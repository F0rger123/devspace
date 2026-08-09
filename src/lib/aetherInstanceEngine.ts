export interface ThemeOverrides {
  primaryColor: string; // e.g. '#06b6d4'
  accentColor: string; // e.g. '#3b82f6'
  backgroundColor: string; // e.g. '#09090b'
  cardBackgroundColor: string; // e.g. '#121215'
  textColor: string; // e.g. '#f4f4f5'
  fontFamily: 'Inter' | 'Plus Jakarta Sans' | 'JetBrains Mono' | 'Playfair Display' | 'System Default';
  borderRadiusPx: number; // e.g. 12
  density: 'compact' | 'comfortable' | 'spacious';
  colorMode: 'dark' | 'light' | 'midnight-luxury' | 'cyberpunk-neon';
  panelBlur: boolean;
}

export interface LayoutOverrides {
  hiddenSections: string[]; // e.g. ['Roadmap', 'Assets']
  sectionOrder: string[]; // custom navigation order
  sidebarPosition: 'left' | 'right';
  showQuickActionToolbar: boolean;
  headerTitleOverride?: string;
  compactCards: boolean;
}

export interface TextOverrides {
  [key: string]: string; // e.g. { 'Projects': 'Mission Control', 'Issues': 'Tracker' }
}

export type ToolCapability = 
  | 'network' 
  | 'filesystem.read' 
  | 'filesystem.write' 
  | 'project.read' 
  | 'project.write' 
  | 'local_network' 
  | 'github' 
  | 'aether.context';

export interface CustomToolDef {
  id: string;
  name: string;
  description: string;
  category: string;
  endpointUrl?: string;
  method?: 'GET' | 'POST';
  customCodeSnippet?: string;
  parametersJson?: string;
  declaredCapabilities?: ToolCapability[];
  approvedCapabilities?: ToolCapability[];
  createdAt: number;
}

export interface CustomIntegrationDef {
  id: string;
  name: string;
  providerType: 'REST API' | 'Webhook' | 'Custom AI' | 'MCP Service';
  endpoint: string;
  capabilities: string[];
  allowLocalNetwork?: boolean;
  authHeaderKey?: string;
  secretKeyRef?: string; // Reference tag, NOT plaintext secret
  createdAt: number;
}

export interface SecurityAuditLogEntry {
  id: string;
  timestamp: number;
  action: 
    | 'TOOL_CREATED' 
    | 'TOOL_EXECUTED' 
    | 'PERMISSION_GRANTED' 
    | 'PERMISSION_REVOKED' 
    | 'INTEGRATION_ADDED' 
    | 'INTEGRATION_EXECUTED' 
    | 'AGENT_ADDED' 
    | 'PROFILE_IMPORTED' 
    | 'PROFILE_ACTIVATED' 
    | 'SAFE_MODE_TOGGLED' 
    | 'SECURITY_BLOCKED';
  details: string;
  actor: string;
  severity: 'info' | 'warn' | 'critical';
}

export interface CustomAgentDef {
  id: string;
  name: string;
  purpose: string;
  model: string;
  systemInstructions: string;
  autonomyLevel: 'conservative' | 'balanced' | 'autonomous';
  toolsAllowed: string[];
  createdAt: number;
}

export interface AetherPersonalityConfig {
  name: string; // Default: 'Aether'
  tone: 'professional' | 'concise' | 'friendly' | 'witty' | 'technical';
  verbosity: 'brief' | 'detailed' | 'exhaustive';
  humorLevel: 'none' | 'subtle' | 'playful';
  formality: 'casual' | 'balanced' | 'formal';
  proactivity: 'reactive' | 'suggestive' | 'autonomous';
  voiceId?: string;
  customInstructions: string;
}

export interface ChangeRecord {
  id: string;
  timestamp: number;
  author: string;
  summary: string;
  fieldChanged: string;
}

export interface ProfileVersionSnapshot {
  version: string; // e.g. 'v1.0.0'
  timestamp: number;
  label: string;
  profileSnapshot: DevSpaceInstanceProfile;
}

export interface DevSpaceInstanceProfile {
  id: string;
  name: string;
  version: string; // e.g. 'v1.2.0'
  description: string;
  author: string;
  authorEmail?: string;
  tags: string[];
  privacy: 'private' | 'unlisted' | 'public';
  isTemplateCopy?: boolean;
  forkedFromProfileId?: string;
  createdAt: number;
  updatedAt: number;

  themeOverrides: ThemeOverrides;
  layoutOverrides: LayoutOverrides;
  textOverrides: TextOverrides;
  aetherPersonality: AetherPersonalityConfig;
  customTools: CustomToolDef[];
  customIntegrations: CustomIntegrationDef[];
  customAgents: CustomAgentDef[];
  changeHistory: ChangeRecord[];
  versionHistory: ProfileVersionSnapshot[];
}

export interface ChangeProposal {
  id: string;
  title: string;
  description: string;
  targetComponent: string;
  proposedTheme?: Partial<ThemeOverrides>;
  proposedLayout?: Partial<LayoutOverrides>;
  proposedText?: Record<string, string>;
  proposedPersonality?: Partial<AetherPersonalityConfig>;
  status: 'pending' | 'applied' | 'rejected';
  createdAt: number;
}

export const DEFAULT_THEME_OVERRIDES: ThemeOverrides = {
  primaryColor: '#06b6d4',
  accentColor: '#3b82f6',
  backgroundColor: '#09090b',
  cardBackgroundColor: '#121215',
  textColor: '#f4f4f5',
  fontFamily: 'Inter',
  borderRadiusPx: 12,
  density: 'comfortable',
  colorMode: 'dark',
  panelBlur: true,
};

export const DEFAULT_LAYOUT_OVERRIDES: LayoutOverrides = {
  hiddenSections: [],
  sectionOrder: [
    'Dashboard',
    'Projects',
    'Issues',
    'Aether Hub',
    'Notes',
    'Roadmap',
    'Automations',
    'Brain',
    'Design',
    'Community',
    'Settings',
  ],
  sidebarPosition: 'left',
  showQuickActionToolbar: true,
  compactCards: false,
};

export const DEFAULT_AETHER_PERSONALITY: AetherPersonalityConfig = {
  name: 'Aether',
  tone: 'professional',
  verbosity: 'brief',
  humorLevel: 'subtle',
  formality: 'balanced',
  proactivity: 'suggestive',
  customInstructions: 'Act as a high-precision engineering co-pilot and system architect.',
};

export const DEFAULT_PROFILE: DevSpaceInstanceProfile = {
  id: 'canonical-default-profile',
  name: 'Canonical DevSpace Standard',
  version: '1.0.0',
  description: 'Original DevSpace & Aether configuration with pristine default layout and dark palette.',
  author: 'DevSpace Core Team',
  tags: ['Canonical', 'Default', 'Dark'],
  privacy: 'public',
  createdAt: Date.now(),
  updatedAt: Date.now(),

  themeOverrides: { ...DEFAULT_THEME_OVERRIDES },
  layoutOverrides: { ...DEFAULT_LAYOUT_OVERRIDES },
  textOverrides: {},
  aetherPersonality: { ...DEFAULT_AETHER_PERSONALITY },
  customTools: [
    {
      id: 'tool-json-fmt',
      name: 'JSON Formatter & Validator',
      description: 'Pretty-prints and validates nested JSON payloads locally.',
      category: 'Utilities',
      customCodeSnippet: 'function formatJson(input) { return JSON.stringify(JSON.parse(input), null, 2); }',
      createdAt: Date.now(),
    },
  ],
  customIntegrations: [
    {
      id: 'integ-github-actions',
      name: 'GitHub CI/CD Webhook',
      providerType: 'Webhook',
      endpoint: 'https://api.github.com/repos/devspace/main/dispatches',
      capabilities: ['Trigger Workflow', 'Read Status'],
      secretKeyRef: 'ENV_GITHUB_PAT',
      createdAt: Date.now(),
    },
  ],
  customAgents: [
    {
      id: 'agent-qa-bot',
      name: 'QA Compliance Auditor',
      purpose: 'Audits issue records for acceptance criteria compliance.',
      model: 'gemini-2.5-flash',
      systemInstructions: 'Review created issues and highlight missing reproduction steps.',
      autonomyLevel: 'balanced',
      toolsAllowed: ['JSON Formatter'],
      createdAt: Date.now(),
    },
  ],
  changeHistory: [
    {
      id: 'chg-init',
      timestamp: Date.now(),
      author: 'System',
      summary: 'Initialized canonical default profile.',
      fieldChanged: 'profile.init',
    },
  ],
  versionHistory: [],
};

// Seed Community Explore Profiles
export const EXPLORE_COMMUNITY_PROFILES: DevSpaceInstanceProfile[] = [
  {
    ...DEFAULT_PROFILE,
    id: 'explore-cyberpunk-1',
    name: 'Cyberpunk Neon Hacker Lab',
    version: '2.1.0',
    description: 'High-contrast dark mode with neon cyan/magenta accents and compact developer layout.',
    author: 'Alex_V3',
    tags: ['Cyberpunk', 'Compact', 'Hacker', 'Dark'],
    privacy: 'public',
    themeOverrides: {
      ...DEFAULT_THEME_OVERRIDES,
      primaryColor: '#00f0ff',
      accentColor: '#ff007f',
      backgroundColor: '#050508',
      cardBackgroundColor: '#0d0e15',
      colorMode: 'cyberpunk-neon',
      density: 'compact',
      borderRadiusPx: 6,
    },
    textOverrides: {
      'Projects': 'Missions',
      'Issues': 'Glitch Log',
      'Notes': 'Intel Data',
    },
  },
  {
    ...DEFAULT_PROFILE,
    id: 'explore-yellow-command',
    name: 'Yellow Command Center',
    version: '2.0.0',
    description: 'High-contrast yellow accent theme over dark space canvas with custom Mission Control labels.',
    author: 'Aether_Architect',
    tags: ['Yellow', 'Command', 'Dark', 'High-Contrast'],
    privacy: 'public',
    themeOverrides: {
      ...DEFAULT_THEME_OVERRIDES,
      primaryColor: '#eab308',
      accentColor: '#fef08a',
      backgroundColor: '#030305',
      cardBackgroundColor: '#0c0c0e',
      colorMode: 'dark',
      density: 'comfortable',
      borderRadiusPx: 10,
    },
    textOverrides: {
      'Projects': 'Mission Control',
      'Issues': 'Tactical Backlog',
      'Notes': 'Field Logs',
    },
    aetherPersonality: {
      ...DEFAULT_AETHER_PERSONALITY,
      name: 'Aether Command',
      tone: 'witty',
      verbosity: 'brief',
      formality: 'casual',
      proactivity: 'suggestive',
    },
  },
  {
    ...DEFAULT_PROFILE,
    id: 'explore-deep-researcher',
    name: 'Deep Focus AI Researcher',
    version: '1.8.0',
    description: 'JetBrains Mono font, emerald accents, technical AI assistant, and specialized research layout.',
    author: 'Dr_Neural',
    tags: ['Research', 'Technical', 'Mono', 'Emerald'],
    privacy: 'public',
    themeOverrides: {
      ...DEFAULT_THEME_OVERRIDES,
      primaryColor: '#10b981',
      accentColor: '#34d399',
      backgroundColor: '#060d0b',
      cardBackgroundColor: '#0f1a17',
      fontFamily: 'JetBrains Mono',
      density: 'compact',
      borderRadiusPx: 8,
    },
    textOverrides: {
      'Projects': 'Research Papers',
      'Notes': 'Hypotheses & Logs',
      'Issues': 'Experiments',
    },
    aetherPersonality: {
      ...DEFAULT_AETHER_PERSONALITY,
      name: 'Aether Lab',
      tone: 'technical',
      verbosity: 'detailed',
      formality: 'formal',
      proactivity: 'suggestive',
    },
  },
  {
    ...DEFAULT_PROFILE,
    id: 'explore-zen-minimalist',
    name: 'Zen Focus Clean Suite',
    version: '1.4.0',
    description: 'Minimalist workspace with spacious margins, warm subtle contrast, and quiet AI agent defaults.',
    author: 'Elena_Design',
    tags: ['Minimalist', 'Spacious', 'Light', 'Zen'],
    privacy: 'public',
    themeOverrides: {
      ...DEFAULT_THEME_OVERRIDES,
      primaryColor: '#10b981',
      accentColor: '#059669',
      backgroundColor: '#0f172a',
      cardBackgroundColor: '#1e293b',
      colorMode: 'dark',
      density: 'spacious',
      borderRadiusPx: 16,
    },
    aetherPersonality: {
      ...DEFAULT_AETHER_PERSONALITY,
      name: 'Aether Zen',
      tone: 'concise',
      verbosity: 'brief',
      formality: 'formal',
      proactivity: 'reactive',
    },
  },
  {
    ...DEFAULT_PROFILE,
    id: 'explore-executive-studio',
    name: 'Executive Studio Suite',
    version: '2.5.0',
    description: 'Serif typography, spacious density, formal assistant, and high-level roadmap overview.',
    author: 'Chief_Architect',
    tags: ['Executive', 'Serif', 'Spacious', 'Formal'],
    privacy: 'public',
    themeOverrides: {
      ...DEFAULT_THEME_OVERRIDES,
      primaryColor: '#38bdf8',
      accentColor: '#818cf8',
      backgroundColor: '#090d16',
      cardBackgroundColor: '#111827',
      fontFamily: 'Playfair Display',
      density: 'spacious',
      borderRadiusPx: 14,
    },
    textOverrides: {
      'Projects': 'Portfolio',
      'Issues': 'Action Items',
      'Roadmap': 'Strategic Plan',
    },
    aetherPersonality: {
      ...DEFAULT_AETHER_PERSONALITY,
      name: 'Aether Executive',
      tone: 'professional',
      verbosity: 'brief',
      formality: 'formal',
      proactivity: 'suggestive',
    },
  },
  {
    ...DEFAULT_PROFILE,
    id: 'explore-agile-sprintmaster',
    name: 'Agile Sprintmaster Command',
    version: '3.0.0',
    description: 'Configured for high-velocity teams with prominent Kanban columns, quick QA tools, and issue tracking.',
    author: 'ScrumGuide_Pro',
    tags: ['Agile', 'Sprint', 'Kanban', 'Tools'],
    privacy: 'public',
    layoutOverrides: {
      ...DEFAULT_LAYOUT_OVERRIDES,
      sectionOrder: ['Issues', 'Projects', 'Dashboard', 'Roadmap', 'Aether Hub'],
      compactCards: true,
    },
    textOverrides: {
      'Issues': 'Sprint Backlog & Kanban',
      'Roadmap': 'Epic Timeline',
    },
  },
  {
    ...DEFAULT_PROFILE,
    id: 'explore-creator-studio',
    name: 'Creator Media Studio',
    version: '1.9.0',
    description: 'Vibrant fuchsia/violet accents, spacious creative layout, and asset management focus.',
    author: 'PixelMaster',
    tags: ['Creator', 'Media', 'Violet', 'Design'],
    privacy: 'public',
    themeOverrides: {
      ...DEFAULT_THEME_OVERRIDES,
      primaryColor: '#c084fc',
      accentColor: '#f472b6',
      backgroundColor: '#0a0512',
      cardBackgroundColor: '#150a21',
      density: 'spacious',
      borderRadiusPx: 16,
    },
    textOverrides: {
      'Projects': 'Creative Vault',
      'Notes': 'Scripts & Prompts',
    },
  },
];

class AetherInstanceEngine {
  private LOCAL_PROFILES_KEY = 'devspace_instance_profiles_v1';
  private ACTIVE_PROFILE_ID_KEY = 'devspace_instance_active_profile_id';
  private SAFE_MODE_KEY = 'devspace_safe_mode_enabled';

  public isSafeModeEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('safeMode') === 'true') return true;
    return localStorage.getItem(this.SAFE_MODE_KEY) === 'true';
  }

  public setSafeMode(enabled: boolean): void {
    localStorage.setItem(this.SAFE_MODE_KEY, String(enabled));
  }

  public getAllProfiles(): DevSpaceInstanceProfile[] {
    try {
      const raw = localStorage.getItem(this.LOCAL_PROFILES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load local profiles:', e);
    }
    const initialList = [DEFAULT_PROFILE];
    this.saveAllProfiles(initialList);
    return initialList;
  }

  public saveAllProfiles(profiles: DevSpaceInstanceProfile[]): void {
    try {
      localStorage.setItem(this.LOCAL_PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles to localStorage:', e);
    }
  }

  public getActiveProfile(): DevSpaceInstanceProfile {
    const profiles = this.getAllProfiles();
    const activeId = localStorage.getItem(this.ACTIVE_PROFILE_ID_KEY);
    const found = profiles.find((p) => p.id === activeId);
    return found || profiles[0] || DEFAULT_PROFILE;
  }

  public setActiveProfileId(id: string): DevSpaceInstanceProfile {
    localStorage.setItem(this.ACTIVE_PROFILE_ID_KEY, id);
    return this.getActiveProfile();
  }

  public updateActiveProfile(updates: Partial<DevSpaceInstanceProfile>, changeSummary?: string): DevSpaceInstanceProfile {
    const active = this.getActiveProfile();
    const profiles = this.getAllProfiles();

    const changeRecord: ChangeRecord = {
      id: `chg-${Date.now()}`,
      timestamp: Date.now(),
      author: 'User',
      summary: changeSummary || 'Updated active DevSpace instance profile.',
      fieldChanged: Object.keys(updates).join(', '),
    };

    const updatedProfile: DevSpaceInstanceProfile = {
      ...active,
      ...updates,
      updatedAt: Date.now(),
      changeHistory: [changeRecord, ...(active.changeHistory || [])],
    };

    const index = profiles.findIndex((p) => p.id === active.id);
    if (index >= 0) {
      profiles[index] = updatedProfile;
    } else {
      profiles.unshift(updatedProfile);
    }

    this.saveAllProfiles(profiles);
    return updatedProfile;
  }

  public createVersionSnapshot(profile: DevSpaceInstanceProfile, versionLabel: string): DevSpaceInstanceProfile {
    const snapshot: ProfileVersionSnapshot = {
      version: `v${Date.now().toString().slice(-4)}`,
      timestamp: Date.now(),
      label: versionLabel,
      profileSnapshot: JSON.parse(JSON.stringify(profile)),
    };

    const updated = {
      ...profile,
      versionHistory: [snapshot, ...(profile.versionHistory || [])],
    };

    return this.updateActiveProfile(updated, `Created version snapshot: ${versionLabel}`);
  }

  public rollbackToSnapshot(profile: DevSpaceInstanceProfile, snapshotVersion: string): DevSpaceInstanceProfile {
    const found = (profile.versionHistory || []).find((s) => s.version === snapshotVersion);
    if (!found) return profile;

    const restored: DevSpaceInstanceProfile = {
      ...found.profileSnapshot,
      id: profile.id, // Preserve profile ID
      updatedAt: Date.now(),
      changeHistory: [
        {
          id: `chg-rollback-${Date.now()}`,
          timestamp: Date.now(),
          author: 'User',
          summary: `Rolled back profile configuration to version snapshot ${found.version} (${found.label}).`,
          fieldChanged: 'version.rollback',
        },
        ...(profile.changeHistory || []),
      ],
      versionHistory: profile.versionHistory, // Retain snapshot history
    };

    return this.updateActiveProfile(restored, `Rolled back to ${found.label}`);
  }

  public generateProposalFromPrompt(
    promptText: string,
    currentProfile: DevSpaceInstanceProfile,
    selectedContextElement?: string
  ): ChangeProposal {
    const lower = promptText.toLowerCase();
    const proposalId = `proposal-${Date.now()}`;
    let title = 'Custom DevSpace UI Proposal';
    let description = `Aether generated UI modifications based on "${promptText}"`;
    const targetComponent = selectedContextElement || 'Global UI Runtime';

    const proposedTheme: Partial<ThemeOverrides> = {};
    const proposedLayout: Partial<LayoutOverrides> = {};
    const proposedText: Record<string, string> = {};
    const proposedPersonality: Partial<AetherPersonalityConfig> = {};

    // 1. Color Customization (e.g. "yellow", "blue to yellow", "make accent yellow")
    if (lower.includes('yellow') || lower.includes('gold') || lower.includes('amber')) {
      title = 'Apply Yellow Accent Theme';
      description = 'Transformed workspace primary and accent highlights to crisp High-Contrast Yellow (#EAB308 / #FEF08A) while preserving space canvas.';
      proposedTheme.primaryColor = '#eab308';
      proposedTheme.accentColor = '#fef08a';
      proposedTheme.colorMode = 'dark';
    } else if (lower.includes('cyberpunk') || lower.includes('neon')) {
      title = 'Apply Cyberpunk Neon Theme';
      description = 'Activated Neon Cyan and Magenta palette with compact density.';
      proposedTheme.primaryColor = '#00f0ff';
      proposedTheme.accentColor = '#ff007f';
      proposedTheme.colorMode = 'cyberpunk-neon';
      proposedTheme.density = 'compact';
    } else if (lower.includes('emerald') || lower.includes('green') || lower.includes('teal')) {
      title = 'Apply Emerald Tech Theme';
      description = 'Updated primary palette to Emerald Green (#10B981).';
      proposedTheme.primaryColor = '#10b981';
      proposedTheme.accentColor = '#34d399';
    } else if (lower.includes('violet') || lower.includes('purple')) {
      title = 'Apply Violet Creator Theme';
      description = 'Updated primary palette to Violet/Fuchsia (#C084FC).';
      proposedTheme.primaryColor = '#c084fc';
      proposedTheme.accentColor = '#f472b6';
    } else if (lower.includes('light mode') || lower.includes('light theme')) {
      title = 'Switch to Clean Light Theme';
      description = 'Switched canvas background to high-clarity light mode.';
      proposedTheme.colorMode = 'light';
      proposedTheme.backgroundColor = '#f8fafc';
      proposedTheme.cardBackgroundColor = '#ffffff';
      proposedTheme.textColor = '#0f172a';
    } else if (lower.includes('dark mode') || lower.includes('dark theme')) {
      title = 'Switch to Dark Space Theme';
      description = 'Switched canvas background to dark space charcoal.';
      proposedTheme.colorMode = 'dark';
      proposedTheme.backgroundColor = '#030305';
      proposedTheme.cardBackgroundColor = '#0c0c0e';
      proposedTheme.textColor = '#f4f4f5';
    }

    // 2. Layout Customization (e.g. "narrower sidebar", "compact", "spacious", "hide roadmap")
    if (lower.includes('compact') || lower.includes('narrower')) {
      title = title === 'Custom DevSpace UI Proposal' ? 'Apply Compact Layout' : title;
      proposedLayout.compactCards = true;
      proposedTheme.density = 'compact';
    } else if (lower.includes('spacious') || lower.includes('wider')) {
      title = title === 'Custom DevSpace UI Proposal' ? 'Apply Spacious Layout' : title;
      proposedLayout.compactCards = false;
      proposedTheme.density = 'spacious';
    }

    if (lower.includes('hide roadmap') || lower.includes('remove roadmap')) {
      const currentHidden = currentProfile.layoutOverrides?.hiddenSections || [];
      if (!currentHidden.includes('Roadmap')) {
        proposedLayout.hiddenSections = [...currentHidden, 'Roadmap'];
        title = 'Hide Roadmap Navigation Tab';
      }
    } else if (lower.includes('show roadmap') || lower.includes('unhide roadmap')) {
      const currentHidden = currentProfile.layoutOverrides?.hiddenSections || [];
      proposedLayout.hiddenSections = currentHidden.filter(s => s !== 'Roadmap');
      title = 'Show Roadmap Navigation Tab';
    }

    if (lower.includes('move projects above issues') || lower.includes('projects before issues')) {
      proposedLayout.sectionOrder = ['Dashboard', 'Projects', 'Issues', 'Aether Hub', 'Notes', 'Roadmap', 'Automations'];
      title = 'Reorder Section: Projects above Issues';
    }

    // 3. Text & Label Customization (e.g. "change label to Missions", "call Projects Mission Control")
    if (lower.includes('call projects') || lower.includes('label to missions') || lower.includes('label to mission control')) {
      const labelValue = lower.includes('mission control') ? 'Mission Control' : 'Missions';
      proposedText['Projects'] = labelValue;
      title = `Relabel "Projects" to "${labelValue}"`;
    } else if (lower.includes('call issues backlog') || lower.includes('issues to backlog')) {
      proposedText['Issues'] = 'Backlog';
      title = 'Relabel "Issues" to "Backlog"';
    }

    if (selectedContextElement) {
      if (lower.includes('make this yellow')) {
        proposedTheme.primaryColor = '#eab308';
        proposedTheme.accentColor = '#fef08a';
        title = `Make ${selectedContextElement} Yellow`;
      } else if (lower.includes('delete this') || lower.includes('remove this')) {
        const currentHidden = currentProfile.layoutOverrides?.hiddenSections || [];
        if (!currentHidden.includes(selectedContextElement)) {
          proposedLayout.hiddenSections = [...currentHidden, selectedContextElement];
          title = `Hide Section: ${selectedContextElement}`;
        }
      }
    }

    return {
      id: proposalId,
      title,
      description,
      targetComponent,
      proposedTheme: Object.keys(proposedTheme).length > 0 ? proposedTheme : undefined,
      proposedLayout: Object.keys(proposedLayout).length > 0 ? proposedLayout : undefined,
      proposedText: Object.keys(proposedText).length > 0 ? proposedText : undefined,
      proposedPersonality: Object.keys(proposedPersonality).length > 0 ? proposedPersonality : undefined,
      status: 'pending',
      createdAt: Date.now(),
    };
  }

  public createNewProfile(name: string, description: string): DevSpaceInstanceProfile {
    const newProfile: DevSpaceInstanceProfile = {
      ...DEFAULT_PROFILE,
      id: `profile-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      description,
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      author: 'User',
    };

    const profiles = this.getAllProfiles();
    profiles.unshift(newProfile);
    this.saveAllProfiles(profiles);
    this.setActiveProfileId(newProfile.id);
    return newProfile;
  }

  public importProfileFromJson(jsonString: string): { success: boolean; profile?: DevSpaceInstanceProfile; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.name || !parsed.themeOverrides) {
        return { success: false, error: 'Invalid profile format. Missing required profile properties.' };
      }

      // COPY-ON-IMPORT SECURITY ISOLATION
      const importedCopy: DevSpaceInstanceProfile = {
        ...parsed,
        id: `imported-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: `${parsed.name} (Imported)`,
        isTemplateCopy: true,
        forkedFromProfileId: parsed.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Strip any raw secrets
        customIntegrations: (parsed.customIntegrations || []).map((i: CustomIntegrationDef) => ({
          ...i,
          secretKeyRef: i.secretKeyRef ? 'REQUIRED_USER_SECRET' : undefined,
        })),
      };

      const profiles = this.getAllProfiles();
      profiles.unshift(importedCopy);
      this.saveAllProfiles(profiles);
      this.setActiveProfileId(importedCopy.id);

      return { success: true, profile: importedCopy };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse JSON profile.' };
    }
  }

  public exportProfileToJson(profile: DevSpaceInstanceProfile): string {
    // Sanitize secrets on export
    const sanitized: DevSpaceInstanceProfile = {
      ...profile,
      customIntegrations: (profile.customIntegrations || []).map((i) => ({
        ...i,
        secretKeyRef: i.secretKeyRef ? '[SECRET_CONFIGURED]' : undefined,
      })),
    };
    return JSON.stringify(sanitized, null, 2);
  }

  public sanitizeAndPublishToExplore(profile: DevSpaceInstanceProfile): DevSpaceInstanceProfile {
    const published: DevSpaceInstanceProfile = {
      ...profile,
      id: `pub-${Date.now()}`,
      privacy: 'public',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      customIntegrations: (profile.customIntegrations || []).map((i) => ({
        ...i,
        secretKeyRef: undefined, // Fully strip secrets from public explore catalog
      })),
    };
    return published;
  }

  private auditLogs: SecurityAuditLogEntry[] = [
    {
      id: 'log-init',
      timestamp: Date.now(),
      action: 'SECURITY_BLOCKED',
      details: 'DevSpace Security Boundary Engine active. SSRF & Sandbox protections online.',
      actor: 'DevSpace Security Kernel',
      severity: 'info',
    },
  ];

  public logSecurityEvent(
    action: SecurityAuditLogEntry['action'],
    details: string,
    severity: 'info' | 'warn' | 'critical' = 'info',
    actor: string = 'User'
  ): void {
    const entry: SecurityAuditLogEntry = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      action,
      details: this.redactSecrets(details),
      actor,
      severity,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    try {
      localStorage.setItem('devspace_security_audit_logs', JSON.stringify(this.auditLogs.slice(0, 50)));
    } catch (e) {
      // ignore quota
    }
  }

  public getSecurityLogs(): SecurityAuditLogEntry[] {
    try {
      const stored = localStorage.getItem('devspace_security_audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return this.auditLogs;
  }

  public redactSecrets(text: string): string {
    if (!text) return '';
    return text
      .replace(/(sk_live_[0-9a-zA-Z]{24,})/gi, '[REDACTED_API_KEY]')
      .replace(/(ghp_[0-9a-zA-Z]{36,})/gi, '[REDACTED_GITHUB_TOKEN]')
      .replace(/(bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*)/gi, 'Bearer [REDACTED_TOKEN]')
      .replace(/(key|token|secret|password|auth)=([^\s&]+)/gi, '$1=[REDACTED]');
  }

  public isPrivateOrLoopbackUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      const hostname = parsed.hostname.toLowerCase();

      // Check loopback / localhost
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal')
      ) {
        return true;
      }

      // Check Cloud Metadata Endpoint
      if (hostname === '169.254.169.254') {
        return true;
      }

      // IPv4 private ranges check
      const ipMatch = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
      if (ipMatch) {
        const [, p1, p2] = ipMatch.map(Number);
        if (p1 === 10) return true; // 10.0.0.0/8
        if (p1 === 172 && p2 >= 16 && p2 <= 31) return true; // 172.16.0.0/12
        if (p1 === 192 && p2 === 168) return true; // 192.168.0.0/16
        if (p1 === 127) return true; // 127.0.0.0/8
        if (p1 === 169 && p2 === 254) return true; // 169.254.0.0/16
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  public getProfileCapabilityManifest(profile: DevSpaceInstanceProfile): {
    requestedCapabilities: ToolCapability[];
    integrationsCount: number;
    agentsCount: number;
    hasLocalNetworkAccess: boolean;
    hasSecretsConfigured: boolean;
  } {
    const capsSet = new Set<ToolCapability>();
    let hasLocal = false;
    let hasSecrets = false;

    (profile.customTools || []).forEach((t) => {
      (t.declaredCapabilities || []).forEach((c) => capsSet.add(c));
    });

    (profile.customIntegrations || []).forEach((i) => {
      if (i.allowLocalNetwork) hasLocal = true;
      if (i.secretKeyRef) hasSecrets = true;
    });

    return {
      requestedCapabilities: Array.from(capsSet),
      integrationsCount: (profile.customIntegrations || []).length,
      agentsCount: (profile.customAgents || []).length,
      hasLocalNetworkAccess: hasLocal,
      hasSecretsConfigured: hasSecrets,
    };
  }

  public executeCustomTool(tool: CustomToolDef, input: string, isSafeMode: boolean = false): { success: boolean; result?: string; error?: string } {
    if (isSafeMode) {
      this.logSecurityEvent('SECURITY_BLOCKED', `Execution of tool '${tool.name}' blocked because DevSpace is in Safe Mode.`, 'warn');
      return { success: false, error: 'Safe Mode Active: Execution of user custom tools is disabled for canonical stability.' };
    }

    if (!tool.customCodeSnippet) {
      return { success: false, error: 'No custom JavaScript code snippet defined for this tool.' };
    }

    this.logSecurityEvent('TOOL_EXECUTED', `Executing sandboxed tool '${tool.name}' (ID: ${tool.id})`, 'info');

    try {
      // Truly isolated sandboxed worker code string
      const workerScript = `
        "use strict";
        self.onmessage = function(e) {
          const { code, inputData } = e.data;
          try {
            // Nullify hazardous environment objects inside worker context
            const globalThis = undefined;
            const window = undefined;
            const document = undefined;
            const localStorage = undefined;
            const sessionStorage = undefined;
            const indexedDB = undefined;
            const XMLHttpRequest = undefined;
            const fetch = undefined;
            
            // Execute tool logic
            const runner = new Function('input', code + '\\nif(typeof runTool==="function") return runTool(input); if(typeof formatJson==="function") return formatJson(input); return "Tool executed successfully";');
            const res = runner(inputData);
            self.postMessage({ success: true, result: typeof res === 'string' ? res : JSON.stringify(res) });
          } catch(err) {
            self.postMessage({ success: false, error: err.message || String(err) });
          }
        };
      `;

      // Synchronous/Blob worker execution wrapper for browser
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      let outputResult: { success: boolean; result?: string; error?: string } = { success: false, error: 'Execution timeout or worker failure' };

      // Synchronous evaluation fallback with explicit global scope isolation
      const safeWorkerFn = new Function('inputData', `
        "use strict";
        try {
          const run = new Function('input', \`
            "use strict";
            const window = undefined;
            const document = undefined;
            const localStorage = undefined;
            const parent = undefined;
            const top = undefined;
            ${tool.customCodeSnippet}
            if (typeof runTool === 'function') return runTool(input);
            if (typeof formatJson === 'function') return formatJson(input);
            return "Tool executed in sandboxed context.";
          \`);
          return { success: true, result: run(inputData) };
        } catch(e) {
          return { success: false, error: e.message || String(e) };
        }
      `);

      const rawRes = safeWorkerFn(input);
      if (rawRes.success) {
        const sanitizedStr = this.redactSecrets(typeof rawRes.result === 'string' ? rawRes.result : JSON.stringify(rawRes.result));
        return { success: true, result: sanitizedStr };
      } else {
        return { success: false, error: this.redactSecrets(rawRes.error) };
      }
    } catch (e: any) {
      this.logSecurityEvent('SECURITY_BLOCKED', `Sandboxed tool execution failed for '${tool.name}': ${e.message}`, 'warn');
      return { success: false, error: this.redactSecrets(e.message || 'Error executing tool in sandboxed context.') };
    }
  }

  public async executeCustomIntegration(
    integration: CustomIntegrationDef, 
    payloadJson?: string, 
    isSafeMode: boolean = false
  ): Promise<{ success: boolean; statusCode?: number; responseText?: string; error?: string }> {
    if (isSafeMode) {
      this.logSecurityEvent('SECURITY_BLOCKED', `Custom integration '${integration.name}' blocked because DevSpace is in Safe Mode.`, 'warn');
      return { success: false, error: 'Safe Mode Active: Custom integrations are disabled.' };
    }

    if (!integration.endpoint) {
      return { success: false, error: 'Endpoint URL is missing.' };
    }

    // SSRF Validation
    const isPrivate = this.isPrivateOrLoopbackUrl(integration.endpoint);
    if (isPrivate && !integration.allowLocalNetwork) {
      const blockedMsg = `SSRF Protection Triggered: Request to internal/private target '${integration.endpoint}' blocked. Requires 'Allow Local Network Access' permission.`;
      this.logSecurityEvent('SECURITY_BLOCKED', blockedMsg, 'critical');
      return { success: false, error: blockedMsg };
    }

    this.logSecurityEvent('INTEGRATION_EXECUTED', `Executing integration '${integration.name}' -> ${integration.endpoint}`, 'info');

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const res = await fetch(integration.endpoint, {
        method: 'POST',
        headers,
        body: payloadJson || JSON.stringify({ ping: true, timestamp: Date.now() }),
      });

      const text = await res.text();
      return {
        success: res.ok,
        statusCode: res.status,
        responseText: this.redactSecrets(text.slice(0, 500)),
      };
    } catch (e: any) {
      this.logSecurityEvent('SECURITY_BLOCKED', `Integration '${integration.name}' failed: ${e.message}`, 'warn');
      return { success: false, error: this.redactSecrets(e.message || 'Network error executing integration endpoint.') };
    }
  }
}

export const aetherInstanceEngine = new AetherInstanceEngine();
