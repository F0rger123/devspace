import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
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

  // Maximize the main window by default for full-screen workspace layout
  mainWindow.maximize();

  // Listen for maximize/unmaximize events to notify renderer process
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-change', false);
  });

  // Load production build or local dev server URL
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    // In production build, load bundled static index.html from app package
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Secure navigation: block in-app navigation to arbitrary external web pages
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle external window links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// Security Helper: Validate IPC Sender Origin
function isTrustedSender(event: Electron.IpcMainInvokeEvent): boolean {
  const senderUrl = event.senderFrame?.url || '';
  return senderUrl.startsWith('file://') || senderUrl.startsWith('http://localhost') || senderUrl.startsWith('http://127.0.0.1');
}

// App lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Communication Setup - Runtime Foundation
function setupIpcHandlers() {
  // --- Window Control APIs ---
  ipcMain.handle('window:minimize', (event) => {
    if (!isTrustedSender(event)) return;
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', (event) => {
    if (!isTrustedSender(event)) return;
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', (event) => {
    if (!isTrustedSender(event)) return;
    mainWindow?.close();
  });

  ipcMain.handle('window:isMaximized', (event) => {
    if (!isTrustedSender(event)) return false;
    return mainWindow?.isMaximized() ?? false;
  });

  // --- Desktop Runtime Info ---
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
    };
  });
}
