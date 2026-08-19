import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  // Desktop Runtime Foundation Info
  getAppInfo: () => Promise<{
    appName: string;
    version: string;
    electronVersion: string;
    chromeVersion: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    userDataPath: string;
    desktopPath: string;
  }>;

  // Window Controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximizedChange?: (callback: (isMaximized: boolean) => void) => () => void;

  // Optional capabilities for future native phases
  executeCommand?: (command: string, cwd?: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
  getScreenSources?: () => Promise<{ success: boolean; sources?: Array<{ id: string; name: string; thumbnailUrl: string }>; error?: string }>;
  readClipboardText?: () => Promise<string>;
  writeClipboardText?: (text: string) => Promise<boolean>;

  // Phase 4.1 Native Auto-Update IPC
  checkForUpdates?: () => Promise<any>;
  downloadUpdate?: (updateInfo: any) => Promise<any>;
  verifyUpdateSignature?: (expectedSha256: string) => Promise<any>;
  installUpdateAndRestart?: () => Promise<any>;

  // Phase 5.0 Desktop Overlay & Awareness Architecture
  toggleOverlay?: (visible?: boolean) => Promise<boolean>;
  setOverlayExpanded?: (expanded: boolean) => Promise<void>;
  setOverlayAlwaysOnTop?: (alwaysOnTop: boolean) => Promise<void>;
  getDesktopAwareness?: () => Promise<any>;
  onDesktopAwarenessUpdate?: (callback: (state: any) => void) => () => void;
  executeDesktopAction?: (actionName: string, payload?: any) => Promise<any>;
  recognizeOCR?: (imageSource?: string) => Promise<any>;
  captureScreen?: () => Promise<string | null>;
  captureRegion?: (bounds: any) => Promise<string | null>;
  ocrClipboardImage?: () => Promise<any>;

  // Phase 6.2 Native OS Integration IPC
  getOpenAtLogin?: () => Promise<boolean>;
  setOpenAtLogin?: (openAtLogin: boolean) => Promise<boolean>;
  getShortcut?: () => Promise<string>;
  registerShortcut?: (shortcutKey: string) => Promise<boolean>;
  getOverlaySettings?: () => Promise<any>;
  updateOverlaySettings?: (settings: any) => Promise<any>;
  getNativeTheme?: () => Promise<{ shouldUseDarkColors: boolean; prefersReducedMotion: boolean }>;
  onNativeThemeUpdate?: (callback: (theme: { shouldUseDarkColors: boolean; prefersReducedMotion: boolean }) => void) => () => void;

  // Cross-Window Navigation IPC
  navigateToRoute?: (route: string) => Promise<void>;
  onNavigateTo?: (callback: (route: string) => void) => () => void;

  // System Tray & Background Wake Word
  setWakeWordStatus?: (active: boolean) => Promise<boolean>;
  showDesktopNotification?: (title: string, body: string, actionRoute?: string) => Promise<boolean>;
  setNotificationsEnabled?: (enabled: boolean) => Promise<boolean>;
  onWakeWordToggle?: (callback: (active: boolean) => void) => () => void;
  onNotificationToggle?: (callback: (enabled: boolean) => void) => () => void;

  // Safe Mode & Crash Recovery
  getSafeModeStatus?: () => Promise<any>;
  restartInSafeMode?: () => Promise<boolean>;
  clearSafeMode?: () => Promise<boolean>;

  // Context Mode & File Search
  getDesktopSources?: (options?: { types?: string[]; thumbnailSize?: { width: number; height: number } }) => Promise<any>;
  checkDesktopPermissions?: (mediaType: 'camera' | 'microphone' | 'screen') => Promise<any>;
  searchFiles?: (params: { query: string; rootDir?: string; maxResults?: number }) => Promise<any>;
}

const electronAPI: ElectronAPI = {
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_event: any, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on('window:maximized-change', handler);
    return () => {
      ipcRenderer.removeListener('window:maximized-change', handler);
    };
  },
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  downloadUpdate: (updateInfo: any) => ipcRenderer.invoke('app:downloadUpdate', updateInfo),
  verifyUpdateSignature: (expectedSha256: string) => ipcRenderer.invoke('app:verifyUpdateSignature', expectedSha256),
  installUpdateAndRestart: () => ipcRenderer.invoke('app:installUpdateAndRestart'),

  toggleOverlay: (visible?: boolean) => ipcRenderer.invoke('overlay:toggle', visible),
  setOverlayExpanded: (expanded: boolean) => ipcRenderer.invoke('overlay:setExpanded', expanded),
  setOverlayAlwaysOnTop: (alwaysOnTop: boolean) => ipcRenderer.invoke('overlay:setAlwaysOnTop', alwaysOnTop),
  getDesktopAwareness: () => ipcRenderer.invoke('desktop:getAwareness'),
  onDesktopAwarenessUpdate: (callback: (state: any) => void) => {
    const handler = (_event: any, state: any) => callback(state);
    ipcRenderer.on('desktop:awareness-update', handler);
    return () => {
      ipcRenderer.removeListener('desktop:awareness-update', handler);
    };
  },
  executeDesktopAction: (actionName: string, payload?: any) => ipcRenderer.invoke('desktop:executeAction', actionName, payload),
  recognizeOCR: (imageSource?: string) => ipcRenderer.invoke('desktop:ocrRecognize', imageSource),
  captureScreen: () => ipcRenderer.invoke('desktop:captureScreen'),
  captureRegion: (bounds: any) => ipcRenderer.invoke('desktop:captureRegion', bounds),
  ocrClipboardImage: () => ipcRenderer.invoke('desktop:ocrClipboard'),

  getOpenAtLogin: () => ipcRenderer.invoke('app:getOpenAtLogin'),
  setOpenAtLogin: (openAtLogin: boolean) => ipcRenderer.invoke('app:setOpenAtLogin', openAtLogin),
  getShortcut: () => ipcRenderer.invoke('shortcut:get'),
  registerShortcut: (shortcutKey: string) => ipcRenderer.invoke('shortcut:register', shortcutKey),
  getOverlaySettings: () => ipcRenderer.invoke('overlay:getSettings'),
  updateOverlaySettings: (settings: any) => ipcRenderer.invoke('overlay:updateSettings', settings),
  getNativeTheme: () => ipcRenderer.invoke('system:getNativeTheme'),
  onNativeThemeUpdate: (callback: (theme: any) => void) => {
    const handler = (_event: any, theme: any) => callback(theme);
    ipcRenderer.on('system:theme-updated', handler);
    return () => {
      ipcRenderer.removeListener('system:theme-updated', handler);
    };
  },

  navigateToRoute: (route: string) => ipcRenderer.invoke('window:navigateTo', route),
  onNavigateTo: (callback: (route: string) => void) => {
    const handler = (_event: any, route: string) => callback(route);
    ipcRenderer.on('navigate-to', handler);
    return () => {
      ipcRenderer.removeListener('navigate-to', handler);
    };
  },

  setWakeWordStatus: (active: boolean) => ipcRenderer.invoke('tray:setWakeWord', active),
  showDesktopNotification: (title: string, body: string, actionRoute?: string) =>
    ipcRenderer.invoke('tray:showNotification', { title, body, actionRoute }),
  setNotificationsEnabled: (enabled: boolean) => ipcRenderer.invoke('tray:setNotificationsEnabled', enabled),
  onWakeWordToggle: (callback: (active: boolean) => void) => {
    const handler = (_event: any, active: boolean) => callback(active);
    ipcRenderer.on('aether:wake-word-toggle', handler);
    return () => {
      ipcRenderer.removeListener('aether:wake-word-toggle', handler);
    };
  },
  onNotificationToggle: (callback: (enabled: boolean) => void) => {
    const handler = (_event: any, enabled: boolean) => callback(enabled);
    ipcRenderer.on('system:notifications-toggle', handler);
    return () => {
      ipcRenderer.removeListener('system:notifications-toggle', handler);
    };
  },

  getSafeModeStatus: () => ipcRenderer.invoke('safeMode:getStatus'),
  restartInSafeMode: () => ipcRenderer.invoke('safeMode:restartInSafeMode'),
  clearSafeMode: () => ipcRenderer.invoke('safeMode:clearSafeMode'),

  getDesktopSources: (options?: { types?: string[]; thumbnailSize?: { width: number; height: number } }) =>
    ipcRenderer.invoke('desktop:getSources', options),
  checkDesktopPermissions: (mediaType: 'camera' | 'microphone' | 'screen') =>
    ipcRenderer.invoke('desktop:checkPermissions', mediaType),
  searchFiles: (params: { query: string; rootDir?: string; maxResults?: number }) =>
    ipcRenderer.invoke('desktop:searchFiles', params),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
