export interface AetherAlias {
  id: string;
  alias: string; // e.g. "my editor", "editor", "my dashboard", "music", "react tutorials"
  target: string; // e.g. "Visual Studio Code", "https://youtube.com", "/projects"
  type: 'website' | 'desktop_app' | 'devspace_route' | 'file';
  createdAt: number;
  description?: string;
}

export interface UserDefinedStep {
  id: string;
  order: number;
  actionType: 'open_app' | 'open_url' | 'navigate_route' | 'run_command';
  target: string;
  label: string;
}

export interface UserDefinedAction {
  id: string;
  name: string;
  triggerPhrase: string; // e.g. "open my workspace"
  steps: UserDefinedStep[];
  autonomyRequired: 'conservative' | 'balanced' | 'autonomous';
  enabled: boolean;
  createdAt: number;
  executionCount: number;
}

export type AutonomyLevel = 'conservative' | 'balanced' | 'autonomous';

class AetherAliasRegistry {
  private ALIASES_KEY = 'aether_aliases_v1';
  private AUTONOMY_KEY = 'aether_autonomy_level_v1';
  private ACTIONS_KEY = 'aether_user_actions_v1';

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const existing = this.getAliases();
    if (existing.length === 0) {
      const defaultAliases: AetherAlias[] = [
        {
          id: 'alias-editor',
          alias: 'my editor',
          target: 'Visual Studio Code',
          type: 'desktop_app',
          createdAt: Date.now() - 86400000,
          description: 'Default code editor alias'
        },
        {
          id: 'alias-music',
          alias: 'my music',
          target: 'Spotify',
          type: 'desktop_app',
          createdAt: Date.now() - 86400000,
          description: 'Default music application alias'
        },
        {
          id: 'alias-dashboard',
          alias: 'my dashboard',
          target: 'https://google.com',
          type: 'website',
          createdAt: Date.now() - 86400000,
          description: 'Primary web dashboard'
        },
        {
          id: 'alias-youtube',
          alias: 'youtube',
          target: 'https://youtube.com',
          type: 'website',
          createdAt: Date.now() - 86400000,
          description: 'Video streaming service'
        }
      ];
      localStorage.setItem(this.ALIASES_KEY, JSON.stringify(defaultAliases));
    }

    const actions = this.getActions();
    if (actions.length === 0) {
      const defaultActions: UserDefinedAction[] = [
        {
          id: 'action-workspace',
          name: 'Open My Workspace',
          triggerPhrase: 'open my workspace',
          steps: [
            { id: 'st-1', order: 1, actionType: 'open_app', target: 'Visual Studio Code', label: 'Launch Visual Studio Code' },
            { id: 'st-2', order: 2, actionType: 'open_url', target: 'https://google.com', label: 'Open Dev Dashboard' },
            { id: 'st-3', order: 3, actionType: 'open_app', target: 'Spotify', label: 'Launch Spotify' }
          ],
          autonomyRequired: 'balanced',
          enabled: true,
          createdAt: Date.now() - 86400000,
          executionCount: 2
        }
      ];
      localStorage.setItem(this.ACTIONS_KEY, JSON.stringify(defaultActions));
    }
  }

  public getAliases(): AetherAlias[] {
    try {
      const data = localStorage.getItem(this.ALIASES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveAlias(alias: Omit<AetherAlias, 'id' | 'createdAt'>): AetherAlias {
    const aliases = this.getAliases();
    const cleanAliasName = alias.alias.toLowerCase().trim();
    
    // Check if alias already exists and update or create
    const existingIndex = aliases.findIndex(a => a.alias.toLowerCase().trim() === cleanAliasName);
    const newEntry: AetherAlias = {
      ...alias,
      id: existingIndex >= 0 ? aliases[existingIndex].id : `alias-${Date.now()}`,
      createdAt: existingIndex >= 0 ? aliases[existingIndex].createdAt : Date.now()
    };

    if (existingIndex >= 0) {
      aliases[existingIndex] = newEntry;
    } else {
      aliases.unshift(newEntry);
    }

    localStorage.setItem(this.ALIASES_KEY, JSON.stringify(aliases));
    return newEntry;
  }

  public deleteAlias(id: string): void {
    const aliases = this.getAliases().filter(a => a.id !== id);
    localStorage.setItem(this.ALIASES_KEY, JSON.stringify(aliases));
  }

  public findMatchingAlias(phrase: string): AetherAlias | undefined {
    const lower = phrase.toLowerCase().trim();
    const aliases = this.getAliases();

    // Exact match
    let match = aliases.find(a => lower === a.alias.toLowerCase().trim());
    if (match) return match;

    // "open [alias]" pattern
    const openMatch = lower.replace(/^open\s+/, '').trim();
    match = aliases.find(a => openMatch === a.alias.toLowerCase().trim());
    if (match) return match;

    // Partial match
    return aliases.find(a => lower.includes(a.alias.toLowerCase().trim()) || a.alias.toLowerCase().trim().includes(lower));
  }

  public getActions(): UserDefinedAction[] {
    try {
      const data = localStorage.getItem(this.ACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveAction(action: UserDefinedAction): void {
    const actions = this.getActions();
    const idx = actions.findIndex(a => a.id === action.id);
    if (idx >= 0) {
      actions[idx] = action;
    } else {
      actions.unshift(action);
    }
    localStorage.setItem(this.ACTIONS_KEY, JSON.stringify(actions));
  }

  public deleteAction(id: string): void {
    const actions = this.getActions().filter(a => a.id !== id);
    localStorage.setItem(this.ACTIONS_KEY, JSON.stringify(actions));
  }

  public findMatchingAction(phrase: string): UserDefinedAction | undefined {
    const lower = phrase.toLowerCase().trim();
    const actions = this.getActions();

    return actions.find(a => 
      a.enabled && (
        lower === a.triggerPhrase.toLowerCase().trim() ||
        lower === a.name.toLowerCase().trim() ||
        lower.includes(a.triggerPhrase.toLowerCase().trim())
      )
    );
  }

  public getAutonomyLevel(): AutonomyLevel {
    try {
      const level = localStorage.getItem(this.AUTONOMY_KEY);
      if (level === 'conservative' || level === 'balanced' || level === 'autonomous') {
        return level;
      }
    } catch {}
    return 'balanced';
  }

  public setAutonomyLevel(level: AutonomyLevel): void {
    localStorage.setItem(this.AUTONOMY_KEY, level);
  }
}

export const aetherAliasRegistry = new AetherAliasRegistry();
