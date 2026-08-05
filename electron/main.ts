import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as net from 'net';
import * as childProcess from 'child_process';
import { desktopOverlayManager } from './services/DesktopOverlayManager';
import { desktopAwarenessService } from './services/DesktopAwarenessService';
import { desktopAutomationEngine } from './services/DesktopAutomationEngine';
import { ocrService } from './services/OCRService';

let mainWindow: BrowserWindow | null = null;
let serverProcess: childProcess.ChildProcess | null = null;
let activeServerPort: number | null = null;

/**
 * Finds an available TCP port on localhost starting with defaultPort.
 * If defaultPort is occupied, requests a free dynamic port from the OS.
 */
function getAvailablePort(defaultPort = 3000): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.on('error', () => {
      // Default port unavailable, find any open port assigned by OS
      const freeServer = net.createServer();
      freeServer.unref();
      freeServer.listen(0, '127.0.0.1', () => {
        const port = (freeServer.address() as net.AddressInfo).port;
        freeServer.close(() => resolve(port));
      });
    });

    server.listen(defaultPort, '127.0.0.1', () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
}

/**
 * Polls the embedded server health endpoint until it responds with HTTP 200 OK.
 */
async function waitForServer(url: string, timeoutMs = 15000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // Server starting up...
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

/**
 * Starts the embedded Express server in production mode on an available port.
 */
async function startEmbeddedServer(): Promise<number> {
  if (activeServerPort) {
    return activeServerPort;
  }

  const port = await getAvailablePort(3000);
  const serverPath = path.join(__dirname, '../dist/server.cjs');

  console.log(`[Electron Main] Launching embedded Express backend on port ${port}...`);
  console.log(`[Electron Main] Server entry path: ${serverPath}`);

  serverProcess = childProcess.fork(serverPath, [], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
    },
  });

  serverProcess.on('error', (err) => {
    console.error('[Electron Main] Embedded Express server error:', err);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Electron Main] Embedded Express server process exited (code=${code}, signal=${signal})`);
    serverProcess = null;
    activeServerPort = null;
  });

  const healthUrl = `http://127.0.0.1:${port}/api/health`;
  const isReady = await waitForServer(healthUrl, 15000);

  if (isReady) {
    console.log(`[Electron Main] Embedded Express server responds healthy at ${healthUrl}`);
  } else {
    console.warn(`[Electron Main] Warning: Embedded Express server did not respond within 15s timeout at ${healthUrl}`);
  }

  activeServerPort = port;
  return port;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: 'DevSpace',
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../public/favicon.ico'),
    backgroundColor: '#030305',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.maximize();

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-change', false);
  });

  // Load local development server URL or production localhost backend
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL;
  if (devServerUrl) {
    console.log(`[Electron Main] Loading Development Server URL: ${devServerUrl}`);
    await mainWindow.loadURL(devServerUrl);
    // Open DevTools only in development mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const port = await startEmbeddedServer();
    const appUrl = `http://127.0.0.1:${port}`;
    console.log(`[Electron Main] Loading Production App URL: ${appUrl}`);
    await mainWindow.loadURL(appUrl);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Secure navigation guard
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1') && !url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle external window links safely while enabling OAuth popups for Firebase Auth
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.includes('firebaseapp.com') ||
      url.includes('accounts.google.com') ||
      url.includes('github.com/login') ||
      url.includes('github.com/login/oauth') ||
      url.includes('/__/auth/handler')
    ) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      };
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

function isTrustedSender(event: Electron.IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url || event.sender?.getURL() || '';
  if (!url) return true;
  return (
    url.startsWith('file://') ||
    url.startsWith('http://localhost') ||
    url.startsWith('http://127.0.0.1') ||
    url === 'about:blank'
  );
}

function getTargetWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender) || mainWindow || BrowserWindow.getFocusedWindow();
}

// App lifecycle
app.whenReady().then(async () => {
  console.log('[Electron Main] App ready event fired. Initializing native services...');

  // 1. Initialize native services after app is ready
  desktopAwarenessService.initialize();
  desktopOverlayManager.initialize();
  desktopAutomationEngine.initialize();
  ocrService.initialize();

  // 2. Setup IPC handlers
  setupIpcHandlers();

  // 3. Create Main Window
  await createWindow();

  // 4. Create Desktop Overlay Window
  const preloadPath = path.join(__dirname, 'preload.cjs');
  const port = activeServerPort || 3000;
  desktopOverlayManager.createOverlayWindow(preloadPath, port);

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  (app as any).isQuitting = true;
  if (serverProcess) {
    console.log('[Electron Main] Terminating embedded Express server process...');
    serverProcess.kill();
    serverProcess = null;
  }
});

function setupIpcHandlers() {
  ipcMain.handle('window:minimize', (event) => {
    if (!isTrustedSender(event)) return;
    const win = getTargetWindow(event);
    win?.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    if (!isTrustedSender(event)) return;
    const win = getTargetWindow(event);
    if (!win) return;
    if (win.isMaximized()) {
      win.unmaximize();
      if (win.isMaximized()) {
        win.restore();
      }
    } else {
      win.maximize();
    }
  });

  ipcMain.handle('window:close', (event) => {
    if (!isTrustedSender(event)) return;
    const win = getTargetWindow(event);
    if (win && !win.isDestroyed()) {
      win.close();
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });

  ipcMain.handle('window:isMaximized', (event) => {
    if (!isTrustedSender(event)) return false;
    const win = getTargetWindow(event);
    return win?.isMaximized() ?? false;
  });

  ipcMain.handle('app:getInfo', (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC origin');
    return {
      appName: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      userDataPath: app.getPath('userData'),
      desktopPath: app.getPath('desktop'),
      serverPort: activeServerPort,
    };
  });

  // Phase 4.1 Auto-Update Native IPC handlers
  ipcMain.handle('app:checkForUpdates', async (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC origin');
    const port = activeServerPort || 3000;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/desktop/check-updates?version=${app.getVersion()}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, updateAvailable: false, currentVersion: app.getVersion(), error: err.message };
    }
  });

  ipcMain.handle('app:downloadUpdate', async (event, updateInfo) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC origin');
    const port = activeServerPort || 3000;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/desktop/download-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateInfo),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('app:verifyUpdateSignature', async (event, expectedSha256) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC origin');
    const port = activeServerPort || 3000;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/desktop/verify-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedSha256 }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, verified: false, error: err.message };
    }
  });

  ipcMain.handle('app:installUpdateAndRestart', async (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC origin');
    const port = activeServerPort || 3000;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/desktop/install-update`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          app.quit();
        }, 1500);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Phase 5.0 Desktop Overlay Window & Operating System Architecture
  ipcMain.handle('overlay:toggle', (event, visible?: boolean) => {
    if (!isTrustedSender(event)) return false;
    return desktopOverlayManager.toggleVisibility(visible);
  });

  ipcMain.handle('overlay:setAlwaysOnTop', (event, alwaysOnTop: boolean) => {
    if (!isTrustedSender(event)) return;
    desktopOverlayManager.setAlwaysOnTop(alwaysOnTop);
  });

  // Phase 5.0 Desktop Awareness & Desktop Action Engine
  ipcMain.handle('desktop:getAwareness', (event) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC origin');
    return desktopAwarenessService.getAwarenessState();
  });

  ipcMain.handle('desktop:ocrRecognize', async (event, imageSource?: string) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC origin');
    return await ocrService.recognize(imageSource);
  });

  ipcMain.handle('desktop:executeAction', async (event, actionName: string, payload: any) => {
    if (!isTrustedSender(event)) throw new Error('Unauthorized IPC origin');
    return await desktopAutomationEngine.executeAction(actionName, payload);
  });
}
