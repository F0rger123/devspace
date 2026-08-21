import React from 'react';
import { isElectron } from '../../../lib/electronBridge';
import { BarShell } from './BarShell';

export function ActivityCenterPill() {
  const isDesktop =
    typeof window !== 'undefined' && (isElectron() || window.location.protocol === 'file:');
  const isOverlay =
    typeof window !== 'undefined' &&
    isDesktop &&
    (window.location.hash.includes('overlay') ||
      window.location.pathname.includes('/overlay') ||
      window.location.search.includes('overlay'));

  // Strictly native / Electron overlay only — never render on the normal website
  if (!isDesktop || !isOverlay) {
    return null;
  }

  return <BarShell standalone />;
}

export default ActivityCenterPill;
