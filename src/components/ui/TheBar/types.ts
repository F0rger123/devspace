import React from 'react';

export type AIMode =
  | 'OFF'
  | 'MUTED'
  | 'WAITING FOR KEYWORD'
  | 'CONTEXT'
  | 'LISTENING'
  | 'ALWAYS ON'
  | 'FOCUS';

export type TheBarTab = 'dreams' | 'live' | 'aether' | 'sync' | 'notifications';

export interface ProjectItem {
  id: string;
  name: string;
}
