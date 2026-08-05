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

  constructor() {
    const primaryDisplay = screen.getPrimaryDisplay();
    this.currentState = {
      foregroundApp: 'DevSpace Desktop',
      activeWindowTitle: 'DevSpace Aether Operating System',
      clipboardContent: '',
      mousePosition: { x: 0, y: 0 },
      focusedMonitor: {
        id: primaryDisplay.id,
        bounds: primaryDisplay.bounds,
      },
      systemIdleTimeSeconds: 0,
      runningApplicationsCount: 1,
      lastUpdated: new Date().toISOString(),
    };
  }

  public getAwarenessState(): DesktopAwarenessState {
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
