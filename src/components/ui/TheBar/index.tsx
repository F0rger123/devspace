import React from 'react';
import { isElectron } from '../../../lib/electronBridge';
import { BarShell } from './BarShell';

export function ActivityCenterPill() {
  // CRITICAL REQUIREMENT: Floating overlay exists strictly as a separate desktop window.
  // Never render floating overlay pill inside the main DevSpace window.
  return null;
}

export default ActivityCenterPill;
