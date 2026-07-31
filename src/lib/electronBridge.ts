import { ElectronAPI } from '../../electron/preload';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI);
};

export const getElectronAPI = (): ElectronAPI | null => {
  if (isElectron()) {
    return window.electronAPI!;
  }
  return null;
};

export async function safeExecuteTerminalCommand(command: string, cwd?: string) {
  const api = getElectronAPI();
  if (api && api.executeCommand) {
    return await api.executeCommand(command, cwd);
  }
  return {
    success: false,
    error: 'Terminal execution requires running inside DevSpace Electron Desktop App.',
  };
}

export async function safeGetScreenSources() {
  const api = getElectronAPI();
  if (api && api.getScreenSources) {
    return await api.getScreenSources();
  }
  return {
    success: false,
    error: 'Screen capture API requires DevSpace Electron Desktop App.',
  };
}

export async function safeReadClipboard() {
  const api = getElectronAPI();
  if (api && api.readClipboardText) {
    return await api.readClipboardText();
  }
  return navigator.clipboard ? await navigator.clipboard.readText() : '';
}

export async function safeWriteClipboard(text: string) {
  const api = getElectronAPI();
  if (api && api.writeClipboardText) {
    return await api.writeClipboardText(text);
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}
