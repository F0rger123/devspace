import React from 'react';

// The 4 canonical Aether AI modes:
// 1. off — Off
// 2. wake_word — Waiting for Keyword
// 3. intent_only / listening — Listening / Aether On
// 4. continuous / context — Context Mode
export type AIMode =
  | 'off'
  | 'wake_word'
  | 'listening'
  | 'context'
  | 'intent_only'
  | 'continuous'
  // Legacy aliases for backward compatibility during migration
  | 'OFF'
  | 'MUTED'
  | 'WAITING FOR KEYWORD'
  | 'LISTENING'
  | 'AETHER AI ON'
  | 'ALWAYS ON'
  | 'CONTEXT'
  | 'CONTEXT MODE'
  | 'FOCUS';

export type TheBarTab = 'dreams' | 'live' | 'aether' | 'sync' | 'notifications';

export interface ProjectItem {
  id: string;
  name: string;
}

