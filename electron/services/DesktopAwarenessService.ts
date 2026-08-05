import { app, clipboard, desktopCapturer, screen, BrowserWindow, ipcMain } from 'electron';

export interface DesktopAwarenessState {
  foregroundApp: string;
  activeWindowTitle: string;
  clipboardContent: string;
  mousePosition: { x: number; y: number };
  focusedMonitor: { id: number; bounds: { x: number; y: number; width: number; height: number } };
  systemIdleTimeSeconds: number;
  runningApplicationsCount: number;
  lastUpdated: string;
}

export class DesktopAwarenessService {
  private currentState: DesktopAwarenessState;
  private initialized = false;

  constructor() {
    // Constructor MUST NOT call any Electron APIs (like screen) to remain side-effect free before app.whenReady()
    this.currentState = {
      foregroundApp: 'DevSpace Desktop',
      activeWindowTitle: 'DevSpace Aether Operating System',
      clipboardContent: '',
      mousePosition: { x: 0, y: 0 },
      focusedMonitor: {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      },
      systemIdleTimeSeconds: 0,
      runningApplicationsCount: 1,
      lastUpdated: new Date().toISOString(),
    };
  }

  public initialize(): void {
    if (this.initialized) return;
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      this.currentState.focusedMonitor = {
        id: primaryDisplay.id,
        bounds: primaryDisplay.bounds,
      };
      this.initialized = true;
    } catch (e) {
      console.warn('[DesktopAwarenessService] Could not initialize display awareness:', e);
    }
  }

  public getAwarenessState(): DesktopAwarenessState {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const mousePoint = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(mousePoint);
      let clipText = '';
      try {
        clipText = clipboard.readText();
      } catch {
        clipText = '';
      }

      this.currentState = {
        ...this.currentState,
        clipboardContent: clipText,
        mousePosition: { x: mousePoint.x, y: mousePoint.y },
        focusedMonitor: {
          id: currentDisplay.id,
          bounds: currentDisplay.bounds,
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('[DesktopAwarenessService] Error querying desktop state:', e);
    }

    return this.currentState;
  }

  public broadcastAwarenessUpdate(windows: BrowserWindow[]): void {
    const state = this.getAwarenessState();
    windows.forEach((win) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('desktop:awareness-update', state);
      }
    });
  }
}

export const desktopAwarenessService = new DesktopAwarenessService();
