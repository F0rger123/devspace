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
  setOverlayAlwaysOnTop?: (alwaysOnTop: boolean) => Promise<void>;
  getDesktopAwareness?: () => Promise<any>;
  onDesktopAwarenessUpdate?: (callback: (state: any) => void) => () => void;
  executeDesktopAction?: (actionName: string, payload?: any) => Promise<any>;
  recognizeOCR?: (imageSource?: string) => Promise<any>;
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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
