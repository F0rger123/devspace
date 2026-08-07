import React from 'react';

export type AIMode =
  | 'Off'
  | 'Muted'
  | 'Waiting for Keyword'
  | 'Context Mode'
  | 'Open / Always Listening'
  | 'Full Aether';

export type TheBarTab = 'dreams' | 'live' | 'aether' | 'sync' | 'notifications';

export interface ProjectItem {
  id: string;
  name: string;
}
