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

  // Optional capabilities for future native phases
  executeCommand?: (command: string, cwd?: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
  getScreenSources?: () => Promise<{ success: boolean; sources?: Array<{ id: string; name: string; thumbnailUrl: string }>; error?: string }>;
  readClipboardText?: () => Promise<string>;
  writeClipboardText?: (text: string) => Promise<boolean>;
}

const electronAPI: ElectronAPI = {
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
