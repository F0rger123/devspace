import { BrowserWindow, screen, app } from 'electron';
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
      this.overlayWindow.loadURL(`http://localhost:${serverPort}/#overlay`);
    } else {
      this.overlayWindow.loadURL(`http://127.0.0.1:${serverPort}/#overlay`);
    }

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
