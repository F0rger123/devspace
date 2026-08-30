/**
 * Android Bridge & Mobile Native Integration for DevSpace
 * Supports standalone Android APK, Capacitor, Progressive Web App (PWA) on mobile, and Android WebViews.
 */

export interface AndroidAppInfo {
  packageName: string;
  versionName: string;
  versionCode: number;
  appName: string;
  buildType: 'debug' | 'release';
  targetSdkVersion: number;
  minSdkVersion: number;
  sha256Certificate: string;
  sha1Certificate: string;
}

export const ANDROID_APP_CONFIG: AndroidAppInfo = {
  packageName: 'com.devspace.aether',
  versionName: '2.5.0',
  versionCode: 250,
  appName: 'DevSpace',
  buildType: 'release',
  targetSdkVersion: 34,
  minSdkVersion: 26,
  sha256Certificate: '4B:6C:58:63:F1:C9:83:A1:02:88:51:EB:E5:C9:74:3B:19:D4:F2:A8:86:EC:92:28:B6:51:7A:B4:73:C2:59:71',
  sha1Certificate: '7E:24:D3:5F:6B:4A:88:91:02:44:A2:3E:9B:6C:71:0D:3F:8A:2C:91'
};

/**
 * Detect if running in an Android environment (native WebView, Capacitor, TWA, or Android Browser)
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  
  // Check Capacitor / native window bridge
  if ((window as any).Capacitor?.getPlatform?.() === 'android' || (window as any).AndroidNative) {
    return true;
  }

  // Check user agent
  return /android/i.test(navigator.userAgent || '');
}

/**
 * Detect if running in any mobile environment (Android, iOS, or mobile viewport)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (isAndroid()) return true;
  return /iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '') || window.innerWidth <= 768;
}

/**
 * Detect if running specifically in a packaged native Android app
 */
export function isNativeAndroidApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).Capacitor?.isNativePlatform?.() && (window as any).Capacitor?.getPlatform?.() === 'android') ||
         Boolean((window as any).AndroidNative);
}

/**
 * Request notification permission safely across Android and Web
 */
export async function requestAndroidNotificationPermission(): Promise<NotificationPermission | 'denied'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[AndroidBridge] Notifications not supported on this platform');
    return 'denied';
  }

  try {
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[AndroidBridge] Failed to request notification permission:', err);
    return 'denied';
  }
}

/**
 * Request microphone permission safely for Aether voice on Android/Mobile
 */
export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { granted: false, error: 'Microphone API not available' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop stream immediately after permission grant check
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (err: any) {
    console.warn('[AndroidBridge] Microphone permission denied or failed:', err);
    return { granted: false, error: err.name || err.message || 'Permission denied' };
  }
}

/**
 * Show a native Android / Web notification with deep linking and vibration
 */
export function showAndroidNotification(options: {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  deepLink?: string;
  data?: any;
}) {
  const { title, body, icon = '/icon-192.png', tag, deepLink, data } = options;

  // Haptic feedback on notification dispatch
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch (_) {}
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon,
        tag,
        badge: '/icon-192.png',
        data: {
          deepLink: deepLink || '/dashboard',
          ...data
        }
      });

      notif.onclick = function (e) {
        e.preventDefault();
        window.focus();
        if (deepLink) {
          if (deepLink.startsWith('devspace://')) {
            const route = deepLink.replace('devspace://', '/');
            window.location.hash = route;
          } else if (deepLink.startsWith('/')) {
            window.location.pathname = deepLink;
          }
        }
        notif.close();
      };
    } catch (err) {
      console.warn('[AndroidBridge] Failed to construct Notification:', err);
    }
  }
}

/**
 * Route deep link URL (e.g. devspace://dreams, devspace://issues, etc.)
 */
export function handleDeepLinkUrl(url: string, navigate?: (path: string) => void): boolean {
  if (!url) return false;

  let targetPath = '';
  if (url.startsWith('devspace://')) {
    const rawPath = url.replace('devspace://', '').replace(/^\/+/, '');
    targetPath = `/${rawPath}`;
  } else if (url.startsWith('/')) {
    targetPath = url;
  }

  if (targetPath) {
    console.log(`[AndroidBridge] Routing deep link to: ${targetPath}`);
    if (navigate) {
      navigate(targetPath);
    } else if (typeof window !== 'undefined') {
      window.location.href = targetPath;
    }
    return true;
  }

  return false;
}

/**
 * Initialize Android deep link and AppState listeners
 */
export function setupAndroidListeners(navigate: (path: string) => void) {
  if (typeof window === 'undefined') return () => {};

  // Check URL query parameters for notification / deep link intent (e.g., ?route=dreams or ?deeplink=devspace://dreams)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const deeplink = searchParams.get('deeplink') || searchParams.get('route');
    if (deeplink) {
      handleDeepLinkUrl(deeplink, navigate);
    }
  } catch (_) {}

  // Listen for custom App deep link events from Capacitor / Android WebView
  const handleCustomDeepLink = (event: any) => {
    const url = event.detail?.url || event.url;
    if (url) {
      handleDeepLinkUrl(url, navigate);
    }
  };

  window.addEventListener('appUrlOpen', handleCustomDeepLink as any);
  window.addEventListener('devspaceDeepLink', handleCustomDeepLink as any);

  return () => {
    window.removeEventListener('appUrlOpen', handleCustomDeepLink as any);
    window.removeEventListener('devspaceDeepLink', handleCustomDeepLink as any);
  };
}
