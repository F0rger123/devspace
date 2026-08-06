import { app, clipboard, powerMonitor, screen, BrowserWindow } from 'electron';
import { exec } from 'child_process';

export interface MonitorInfo {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  isPrimary: boolean;
}

export interface DesktopAwarenessState {
  foregroundApp: string;
  activeWindowTitle: string;
  windowBounds?: { x: number; y: number; width: number; height: number };
  clipboardContent: string;
  hasClipboardImage: boolean;
  mousePosition: { x: number; y: number };
  focusedMonitor: MonitorInfo;
  allMonitors: MonitorInfo[];
  monitorCount: number;
  systemIdleTimeSeconds: number;
  runningApplicationsCount: number;
  isScreenLocked: boolean;
  isSystemSuspended: boolean;
  lastUpdated: string;
}

export class DesktopAwarenessService {
  private currentState: DesktopAwarenessState;
  private initialized = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private cachedForegroundApp = 'DevSpace Desktop';
  private cachedActiveWindowTitle = 'DevSpace Aether Operating System';
  private cachedWindowBounds?: { x: number; y: number; width: number; height: number };

  constructor() {
    this.currentState = {
      foregroundApp: 'DevSpace Desktop',
      activeWindowTitle: 'DevSpace Aether Operating System',
      clipboardContent: '',
      hasClipboardImage: false,
      mousePosition: { x: 0, y: 0 },
      focusedMonitor: {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        workArea: { x: 0, y: 0, width: 1920, height: 1040 },
        scaleFactor: 1,
        isPrimary: true,
      },
      allMonitors: [],
      monitorCount: 1,
      systemIdleTimeSeconds: 0,
      runningApplicationsCount: 1,
      isScreenLocked: false,
      isSystemSuspended: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  public initialize(): void {
    if (this.initialized) return;

    try {
      this.refreshMonitors();

      // Screen Event Listeners
      screen.on('display-added', () => this.refreshMonitors());
      screen.on('display-removed', () => this.refreshMonitors());
      screen.on('display-metrics-changed', () => this.refreshMonitors());

      // Power Monitor Event Listeners
      powerMonitor.on('suspend', () => {
        this.currentState.isSystemSuspended = true;
      });
      powerMonitor.on('resume', () => {
        this.currentState.isSystemSuspended = false;
      });
      powerMonitor.on('lock-screen', () => {
        this.currentState.isScreenLocked = true;
      });
      powerMonitor.on('unlock-screen', () => {
        this.currentState.isScreenLocked = false;
      });

      // Start asynchronous non-blocking foreground app detection loop
      this.startForegroundAppPolling();

      this.initialized = true;
    } catch (e) {
      console.warn('[DesktopAwarenessService] Initialization warning:', e);
    }
  }

  private refreshMonitors(): void {
    try {
      const allDisplays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();

      const mappedMonitors: MonitorInfo[] = allDisplays.map((d) => ({
        id: d.id,
        bounds: d.bounds,
        workArea: d.workArea,
        scaleFactor: d.scaleFactor,
        isPrimary: d.id === primaryDisplay.id,
      }));

      this.currentState.allMonitors = mappedMonitors;
      this.currentState.monitorCount = mappedMonitors.length;

      const cursorPoint = screen.getCursorScreenPoint();
      const nearestDisplay = screen.getDisplayNearestPoint(cursorPoint);

      this.currentState.focusedMonitor = {
        id: nearestDisplay.id,
        bounds: nearestDisplay.bounds,
        workArea: nearestDisplay.workArea,
        scaleFactor: nearestDisplay.scaleFactor,
        isPrimary: nearestDisplay.id === primaryDisplay.id,
      };
    } catch (err) {
      console.warn('[DesktopAwarenessService] Could not refresh monitors:', err);
    }
  }

  private startForegroundAppPolling(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);

    // Initial check
    this.pollNativeForegroundApp();

    // Poll every 2500ms asynchronously without blocking event loop
    this.pollInterval = setInterval(() => {
      this.pollNativeForegroundApp();
    }, 2500);
  }

  private pollNativeForegroundApp(): void {
    const platform = process.platform;

    if (platform === 'darwin') {
      // macOS AppleScript via osascript
      const script = `osascript -e 'tell application "System Events"
        set frontProc to first process whose frontmost is true
        set procName to name of frontProc
        try
          set winTitle to title of window 1 of frontProc
        on error
          set winTitle to ""
        end try
        return procName & "|||" & winTitle
      end tell'`;

      exec(script, { timeout: 800 }, (err, stdout) => {
        if (!err && stdout) {
          const parts = stdout.trim().split('|||');
          if (parts[0]) this.cachedForegroundApp = parts[0].trim();
          if (parts[1]) this.cachedActiveWindowTitle = parts[1].trim();
        }
      });
    } else if (platform === 'win32') {
      // Windows PowerShell script
      const cmd = `powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class Win32 { [DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\\"user32.dll\\")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count); [DllImport(\\"user32.dll\\")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId); }'; $hwnd = [Win32]::GetForegroundWindow(); $sb = New-Object System.Text.StringBuilder 256; [Win32]::GetWindowText($hwnd, $sb, 256) | Out-Null; $procId = 0; [Win32]::GetWindowThreadProcessId($hwnd, [ref]$procId) | Out-Null; $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue; Write-Output ($proc.ProcessName + '|||' + $sb.ToString())"`;

      exec(cmd, { timeout: 800 }, (err, stdout) => {
        if (!err && stdout) {
          const parts = stdout.trim().split('|||');
          if (parts[0]) this.cachedForegroundApp = parts[0].trim();
          if (parts[1]) this.cachedActiveWindowTitle = parts[1].trim();
        }
      });
    } else if (platform === 'linux') {
      // Linux xdotool
      const cmd = `xdotool getactivewindow getwindowname 2>/dev/null`;

      exec(cmd, { timeout: 600 }, (err, stdout) => {
        if (!err && stdout) {
          this.cachedActiveWindowTitle = stdout.trim();
          this.cachedForegroundApp = 'X11 Application';
        }
      });
    }
  }

  public getAwarenessState(): DesktopAwarenessState {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const mousePoint = screen.getCursorScreenPoint();
      const currentDisplay = screen.getDisplayNearestPoint(mousePoint);
      const primaryDisplay = screen.getPrimaryDisplay();

      let clipText = '';
      let hasImage = false;
      try {
        clipText = clipboard.readText() || '';
        const img = clipboard.readImage();
        hasImage = !img.isEmpty();
      } catch {
        clipText = '';
        hasImage = false;
      }

      let idleSecs = 0;
      try {
        idleSecs = powerMonitor.getSystemIdleTime();
      } catch {
        idleSecs = 0;
      }

      this.currentState = {
        ...this.currentState,
        foregroundApp: this.cachedForegroundApp,
        activeWindowTitle: this.cachedActiveWindowTitle,
        windowBounds: this.cachedWindowBounds || {
          x: currentDisplay.bounds.x + 50,
          y: currentDisplay.bounds.y + 50,
          width: Math.round(currentDisplay.bounds.width * 0.8),
          height: Math.round(currentDisplay.bounds.height * 0.8),
        },
        clipboardContent: clipText,
        hasClipboardImage: hasImage,
        mousePosition: { x: mousePoint.x, y: mousePoint.y },
        focusedMonitor: {
          id: currentDisplay.id,
          bounds: currentDisplay.bounds,
          workArea: currentDisplay.workArea,
          scaleFactor: currentDisplay.scaleFactor,
          isPrimary: currentDisplay.id === primaryDisplay.id,
        },
        systemIdleTimeSeconds: idleSecs,
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

