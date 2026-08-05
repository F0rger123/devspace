import { BrowserWindow, screen, app, Menu } from 'electron';
import path from 'path';

export class DesktopOverlayManager {
  private overlayWindow: BrowserWindow | null = null;
  private initialized = false;

  public initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    console.log('[DesktopOverlayManager] Native overlay service initialized');
  }

  public createOverlayWindow(preloadPath: string, serverPort: number): BrowserWindow {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      return this.overlayWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    this.overlayWindow = new BrowserWindow({
      width: 680,
      height: 520,
      x: Math.floor((width - 680) / 2),
      y: 20,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      this.overlayWindow.loadURL(`http://localhost:${serverPort}/#/overlay`);
    } else {
      this.overlayWindow.loadURL(`http://127.0.0.1:${serverPort}/#/overlay`);
    }

    try {
      this.overlayWindow.setAlwaysOnTop(true, 'floating');
      this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } catch (e) {
      console.warn('[DesktopOverlayManager] Non-critical overlay flag warning:', e);
    }

    // Native right-click context menu handler for overlay window
    this.overlayWindow.webContents.on('context-menu', (_e) => {
      const menu = Menu.buildFromTemplate([
        {
          label: 'Hide Overlay',
          click: () => {
            this.overlayWindow?.hide();
          },
        },
        {
          label: 'Always On Top',
          type: 'checkbox',
          checked: this.overlayWindow?.isAlwaysOnTop() ?? true,
          click: (menuItem) => {
            this.setAlwaysOnTop(menuItem.checked);
          },
        },
        { type: 'separator' },
        {
          label: 'Open DevSpace Main Window',
          click: () => {
            const allWins = BrowserWindow.getAllWindows();
            const mainWin = allWins.find((w) => w !== this.overlayWindow);
            if (mainWin && !mainWin.isDestroyed()) {
              if (mainWin.isMinimized()) mainWin.restore();
              mainWin.show();
              mainWin.focus();
            }
          },
        },
        {
          label: 'Desktop Settings',
          click: () => {
            const allWins = BrowserWindow.getAllWindows();
            const mainWin = allWins.find((w) => w !== this.overlayWindow);
            if (mainWin && !mainWin.isDestroyed()) {
              if (mainWin.isMinimized()) mainWin.restore();
              mainWin.show();
              mainWin.focus();
              mainWin.webContents.send('navigate-to', '/settings?tab=desktop_overlay');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Quit DevSpace',
          click: () => {
            (app as any).isQuitting = true;
            app.quit();
          },
        },
      ]);
      menu.popup();
    });

    this.overlayWindow.on('close', (event) => {
      if (!(app as any).isQuitting) {
        event.preventDefault();
        this.overlayWindow?.hide();
      }
    });

    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });

    return this.overlayWindow;
  }

  public getOverlayWindow(): BrowserWindow | null {
    return this.overlayWindow;
  }

  public toggleVisibility(visible?: boolean): boolean {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      return false;
    }
    const shouldShow = visible !== undefined ? visible : !this.overlayWindow.isVisible();
    if (shouldShow) {
      this.overlayWindow.show();
    } else {
      this.overlayWindow.hide();
    }
    return shouldShow;
  }

  public setAlwaysOnTop(flag: boolean): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.setAlwaysOnTop(flag, 'floating');
    }
  }

  public setIgnoreMouseEvents(ignore: boolean): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  }
}

export const desktopOverlayManager = new DesktopOverlayManager();
