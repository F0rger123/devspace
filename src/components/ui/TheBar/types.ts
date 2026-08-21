import React from 'react';

// The 4 canonical Aether AI modes
export type AIMode =
  | 'off'
  | 'wake_word'
  | 'listening'
  | 'context'
  // Legacy aliases for backward compatibility during migration
  | 'OFF'
  | 'MUTED'
  | 'WAITING FOR KEYWORD'
  | 'LISTENING'
  | 'ALWAYS ON'
  | 'CONTEXT'
  | 'FOCUS';

export type TheBarTab = 'dreams' | 'live' | 'aether' | 'sync' | 'notifications';

export interface ProjectItem {
  id: string;
  name: string;
}

