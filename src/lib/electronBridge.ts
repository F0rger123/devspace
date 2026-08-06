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

export async function safeCheckForUpdates() {
  const api = getElectronAPI();
  if (api && api.checkForUpdates) {
    return await api.checkForUpdates();
  }
  return null;
}

export async function safeDownloadUpdate(updateInfo: any) {
  const api = getElectronAPI();
  if (api && api.downloadUpdate) {
    return await api.downloadUpdate(updateInfo);
  }
  return null;
}

export async function safeVerifyUpdateSignature(sha256: string) {
  const api = getElectronAPI();
  if (api && api.verifyUpdateSignature) {
    return await api.verifyUpdateSignature(sha256);
  }
  return null;
}

export async function safeInstallUpdateAndRestart() {
  const api = getElectronAPI();
  if (api && api.installUpdateAndRestart) {
    return await api.installUpdateAndRestart();
  }
  return null;
}

export async function safeToggleOverlay(visible?: boolean) {
  const api = getElectronAPI();
  if (api && api.toggleOverlay) {
    return await api.toggleOverlay(visible);
  }
  return false;
}

export async function safeSetOverlayExpanded(expanded: boolean) {
  const api = getElectronAPI();
  if (api && api.setOverlayExpanded) {
    await api.setOverlayExpanded(expanded);
  }
}

export async function safeSetOverlayAlwaysOnTop(alwaysOnTop: boolean) {
  const api = getElectronAPI();
  if (api && api.setOverlayAlwaysOnTop) {
    await api.setOverlayAlwaysOnTop(alwaysOnTop);
  }
}

export async function safeGetDesktopAwareness() {
  const api = getElectronAPI();
  if (api && api.getDesktopAwareness) {
    return await api.getDesktopAwareness();
  }
  return null;
}

export function safeSubscribeDesktopAwareness(callback: (state: any) => void) {
  const api = getElectronAPI();
  if (api && api.onDesktopAwarenessUpdate) {
    return api.onDesktopAwarenessUpdate(callback);
  }
  return () => {};
}

export async function safeExecuteDesktopAction(actionName: string, payload?: any) {
  const api = getElectronAPI();
  if (api && api.executeDesktopAction) {
    return await api.executeDesktopAction(actionName, payload);
  }
  return { success: false, error: 'Desktop automation engine requires DevSpace Desktop app.' };
}

export async function safeRecognizeOCR(imageSource?: string) {
  const api = getElectronAPI();
  if (api && api.recognizeOCR) {
    return await api.recognizeOCR(imageSource);
  }
  return { success: false, error: 'OCR engine requires DevSpace Desktop app.' };
}

export async function safeCaptureScreen() {
  const api = getElectronAPI();
  if (api && api.captureScreen) {
    return await api.captureScreen();
  }
  return null;
}

export async function safeCaptureRegion(bounds: any) {
  const api = getElectronAPI();
  if (api && api.captureRegion) {
    return await api.captureRegion(bounds);
  }
  return null;
}

export async function safeOCRClipboard() {
  const api = getElectronAPI();
  if (api && api.ocrClipboardImage) {
    return await api.ocrClipboardImage();
  }
  return { success: false, error: 'Clipboard OCR requires DevSpace Desktop app.' };
}

export async function safeNavigateMain(route: string) {
  const api = getElectronAPI();
  if (api && api.navigateToRoute) {
    await api.navigateToRoute(route);
  }
}

export async function safeGetOpenAtLogin() {
  const api = getElectronAPI();
  if (api && api.getOpenAtLogin) {
    return await api.getOpenAtLogin();
  }
  return false;
}

export async function safeSetOpenAtLogin(openAtLogin: boolean) {
  const api = getElectronAPI();
  if (api && api.setOpenAtLogin) {
    return await api.setOpenAtLogin(openAtLogin);
  }
  return false;
}

export async function safeGetShortcut() {
  const api = getElectronAPI();
  if (api && api.getShortcut) {
    return await api.getShortcut();
  }
  return 'CommandOrControl+Shift+Space';
}

export async function safeRegisterShortcut(shortcutKey: string) {
  const api = getElectronAPI();
  if (api && api.registerShortcut) {
    return await api.registerShortcut(shortcutKey);
  }
  return false;
}

export async function safeGetOverlaySettings() {
  const api = getElectronAPI();
  if (api && api.getOverlaySettings) {
    return await api.getOverlaySettings();
  }
  return null;
}

export async function safeUpdateOverlaySettings(settings: any) {
  const api = getElectronAPI();
  if (api && api.updateOverlaySettings) {
    return await api.updateOverlaySettings(settings);
  }
  return null;
}

export async function safeGetNativeTheme() {
  const api = getElectronAPI();
  if (api && api.getNativeTheme) {
    return await api.getNativeTheme();
  }
  return { shouldUseDarkColors: true, prefersReducedMotion: false };
}

export function safeSubscribeNativeTheme(callback: (theme: any) => void) {
  const api = getElectronAPI();
  if (api && api.onNativeThemeUpdate) {
    return api.onNativeThemeUpdate(callback);
  }
  return () => {};
}

