import { BrowserWindow, screen, app, Menu, nativeTheme } from 'electron';
import path from 'path';

export interface OverlaySettings {
  globalShortcut: string;
  openAtLogin: boolean;
  rememberPosition: boolean;
  alwaysOnTop: boolean;
  savedX?: number;
  savedY?: number;
  isExpanded: boolean;
  isUserHidden: boolean;
}

export class DesktopOverlayManager {
  private overlayWindow: BrowserWindow | null = null;
  private initialized = false;
  private settings: OverlaySettings = {
    globalShortcut: 'CommandOrControl+Shift+Space',
    openAtLogin: false,
    rememberPosition: true,
    alwaysOnTop: true,
    isExpanded: false,
    isUserHidden: false,
  };

  public initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    console.log('[DesktopOverlayManager] Native overlay service initialized');
  }

  public getSettings(): OverlaySettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<OverlaySettings>): OverlaySettings {
    this.settings = { ...this.settings, ...partial };
    if (partial.alwaysOnTop !== undefined) {
      this.setAlwaysOnTop(partial.alwaysOnTop);
    }
    return this.getSettings();
  }

  public createOverlayWindow(preloadPath: string, serverPort: number): BrowserWindow {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      return this.overlayWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { workArea } = primaryDisplay;

    const overlayWidth = 680;
    const overlayHeight = this.settings.isExpanded ? 520 : 56;
    const initialX = this.settings.rememberPosition && this.settings.savedX !== undefined
      ? this.settings.savedX
      : Math.floor(workArea.x + (workArea.width - overlayWidth) / 2);
    const initialY = this.settings.rememberPosition && this.settings.savedY !== undefined
      ? this.settings.savedY
      : workArea.y + 16;

    this.overlayWindow = new BrowserWindow({
      width: overlayWidth,
      height: overlayHeight,
      x: initialX,
      y: initialY,
      transparent: true,
      backgroundColor: '#00000000',
      frame: false,
      alwaysOnTop: this.settings.alwaysOnTop,
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
      this.overlayWindow.setAlwaysOnTop(this.settings.alwaysOnTop, 'floating');
      // macOS Spaces and Windows Virtual Desktops integration
      this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } catch (e) {
      console.warn('[DesktopOverlayManager] Non-critical overlay flag warning:', e);
    }

    // Save overlay window position on move
    this.overlayWindow.on('moved', () => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        const bounds = this.overlayWindow.getBounds();
        this.settings.savedX = bounds.x;
        this.settings.savedY = bounds.y;
      }
    });

    // Native right-click context menu handler for overlay window
    this.overlayWindow.webContents.on('context-menu', (_e) => {
      const menu = Menu.buildFromTemplate([
        {
          label: 'Hide Overlay',
          click: () => {
            this.toggleVisibility(false, true);
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

  public toggleVisibility(visible?: boolean, isUserAction = false): boolean {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      return false;
    }

    if (isUserAction) {
      if (visible === false) {
        this.settings.isUserHidden = true;
      } else if (visible === true) {
        this.settings.isUserHidden = false;
      } else {
        this.settings.isUserHidden = this.overlayWindow.isVisible();
      }
    }

    const shouldShow = visible !== undefined ? visible : !this.overlayWindow.isVisible();

    if (shouldShow) {
      if (!isUserAction && this.settings.isUserHidden) {
        return false;
      }
      this.overlayWindow.show();
    } else {
      this.overlayWindow.hide();
    }
    return shouldShow;
  }

  public setOverlaySize(expanded: boolean): void {
    this.settings.isExpanded = expanded;
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      const currentBounds = this.overlayWindow.getBounds();
      const currentDisplay = screen.getDisplayMatching(currentBounds);
      const { workArea } = currentDisplay;

      const overlayWidth = 680;
      const overlayHeight = expanded ? 520 : 56;
      const x = currentBounds.x || Math.floor(workArea.x + (workArea.width - overlayWidth) / 2);
      const y = currentBounds.y || workArea.y + 16;

      this.overlayWindow.setBounds({
        x,
        y,
        width: overlayWidth,
        height: overlayHeight,
      });
    }
  }

  public setAlwaysOnTop(flag: boolean): void {
    this.settings.alwaysOnTop = flag;
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
