import React from 'react';

export type AIMode =
  | 'AI'
  | 'Dream Mode'
  | 'Voice'
  | 'Aether Intelligence'
  | 'Muted'
  | 'Silent'
  | 'Developer'
  | 'Background'
  | 'Off';

export type TheBarTab = 'dreams' | 'live' | 'aether' | 'sync' | 'notifications';

export interface ProjectItem {
  id: string;
  name: string;
}
