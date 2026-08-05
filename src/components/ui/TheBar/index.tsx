import React from 'react';
import { isElectron } from '../../../lib/electronBridge';
import { BarShell } from './BarShell';

export function ActivityCenterPill() {
  // CRITICAL REQUIREMENT: The website should NEVER display The Bar.
  // Floating Bar exists ONLY inside the desktop application (Electron).
  if (!isElectron()) {
    return null;
  }

  return <BarShell />;
}

export default ActivityCenterPill;
