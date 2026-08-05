import { isElectron, safeNavigateMain } from '../lib/electronBridge';

export function useSafeOverlayNavigate() {
  return (route: string) => {
    if (isElectron()) {
      safeNavigateMain(route);
    } else {
      window.dispatchEvent(new CustomEvent('devspace:navigate-main', { detail: route }));
    }
  };
}



