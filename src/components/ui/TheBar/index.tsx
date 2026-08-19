import React from 'react';
import { BarShell } from './BarShell';
import { isElectron } from '../../../lib/electronBridge';

export function ActivityCenterPill() {
  if (!isElectron()) {
    return null;
  }
  return <BarShell />;
}

export default ActivityCenterPill;

