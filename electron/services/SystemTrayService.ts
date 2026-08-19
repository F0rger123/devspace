import { app, Tray, Menu, BrowserWindow, nativeImage, Notification, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { desktopOverlayManager } from './DesktopOverlayManager';

export class SystemTrayService {
  private tray: Tray | null = null;
  private initialized = false;
  private wakeWordActive = false;
  private notificationsEnabled = true;

  public initialize(mainWindow: BrowserWindow | null): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      this.createTray(mainWindow);
      console.log('[SystemTrayService] System tray initialized successfully.');
    } catch (err) {
      console.warn('[SystemTrayService] Failed to initialize system tray:', err);
    }
  }

  private createTray(mainWindow: BrowserWindow | null): void {
    const iconPath = path.join(__dirname, '../public/favicon.ico');
    let trayIcon = nativeImage.createEmpty();

    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    }

    this.tray = new Tray(trayIcon);
    this.updateToolTip('DevSpace Desktop • Aether Ready');

    this.rebuildContextMenu(mainWindow);

    // Single click toggles main window
    this.tray.on('click', () => {
      this.toggleMainWindow(mainWindow);
    });

    // Double click on Windows/Linux opens main window
    this.tray.on('double-click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }

  public setWakeWordStatus(active: boolean, mainWindow: BrowserWindow | null): void {
    this.wakeWordActive = active;
    this.updateToolTip(
      active
        ? 'DevSpace Desktop • Aether Voice Active (Listening for "Hey Aether")'
        : 'DevSpace Desktop • Aether Ready'
    );
    this.rebuildContextMenu(mainWindow);
  }

  public setNotificationsEnabled(enabled: boolean, mainWindow: BrowserWindow | null): void {
    this.notificationsEnabled = enabled;
    this.rebuildContextMenu(mainWindow);
  }

  public updateToolTip(tooltip: string): void {
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.setToolTip(tooltip);
    }
  }

  public rebuildContextMenu(mainWindow: BrowserWindow | null): void {
    if (!this.tray || this.tray.isDestroyed()) return;

    const isVisible = mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible();
    const openAtLogin = app.getLoginItemSettings().openAtLogin;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: isVisible ? 'Hide DevSpace' : 'Show DevSpace',
        click: () => {
          this.toggleMainWindow(mainWindow);
        },
      },
      {
        label: 'Aether Assistant Overlay (Ctrl+Shift+Space)',
        click: () => {
          desktopOverlayManager.toggleVisibility(undefined, true);
        },
      },
      { type: 'separator' },
      {
        label: 'Aether Wake-Word ("Hey Aether")',
        type: 'checkbox',
        checked: this.wakeWordActive,
        click: (menuItem) => {
          this.wakeWordActive = menuItem.checked;
          this.setWakeWordStatus(this.wakeWordActive, mainWindow);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('aether:wake-word-toggle', this.wakeWordActive);
          }
        },
      },
      {
        label: 'Desktop Notifications',
        type: 'checkbox',
        checked: this.notificationsEnabled,
        click: (menuItem) => {
          this.notificationsEnabled = menuItem.checked;
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('system:notifications-toggle', this.notificationsEnabled);
          }
        },
      },
      {
        label: 'Start at Login',
        type: 'checkbox',
        checked: openAtLogin,
        click: (menuItem) => {
          app.setLoginItemSettings({ openAtLogin: menuItem.checked });
        },
      },
      { type: 'separator' },
      {
        label: 'Quick Actions',
        submenu: [
          {
            label: 'Open My Workspace',
            click: () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('aether:trigger-workspace', {});
              }
            },
          },
          {
            label: 'Launch VS Code in Project',
            click: () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('desktop:action', { action: 'open_vscode' });
              }
            },
          },
          {
            label: 'Open Terminal',
            click: () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('desktop:action', { action: 'open_terminal' });
              }
            },
          },
        ],
      },
      { type: 'separator' },
      {
        label: 'Restart in Safe Mode',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('system:safe-mode-restart');
          }
          (app as any).isQuitting = true;
          app.relaunch({ args: process.argv.slice(1).concat(['--safe-mode']) });
          app.exit(0);
        },
      },
      {
        label: 'Check for Updates...',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('navigate-to', '/settings?tab=updates');
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

    this.tray.setContextMenu(contextMenu);
  }

  private toggleMainWindow(mainWindow: BrowserWindow | null): void {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    if (mainWindow.isVisible()) {
      mainWindow.hide();
      desktopOverlayManager.toggleVisibility(true);
    } else {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      desktopOverlayManager.toggleVisibility(false);
    }
  }

  public showNotification(title: string, body: string, actionRoute?: string, mainWindow?: BrowserWindow | null): void {
    if (!this.notificationsEnabled) return;

    if (Notification.isSupported()) {
      const notif = new Notification({
        title,
        body,
        icon: path.join(__dirname, '../public/favicon.ico'),
      });

      if (actionRoute && mainWindow && !mainWindow.isDestroyed()) {
        notif.on('click', () => {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate-to', actionRoute);
        });
      }

      notif.show();
    }
  }

  public destroy(): void {
    if (this.tray && !this.tray.isDestroyed()) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

export const systemTrayService = new SystemTrayService();
