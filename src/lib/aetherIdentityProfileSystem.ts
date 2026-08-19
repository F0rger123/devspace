// Aether Canonical Identity & Personality Profile Architecture
// Supports fine-grained controls (0-100), rich free-text descriptions, full CRUD Synaptic Directives,
// personality profile versioning, voice preferences, and prompt synthesis for every conversational turn and tool output.

export interface SynapticDirectiveItem {
  id: string;
  text: string;
  enabled: boolean;
  category?: 'identity' | 'technical' | 'safety' | 'communication' | 'custom';
  priority?: number;
}

export interface AetherIdentityProfile {
  id: string;
  name: string; // e.g. "Developer", "Casual", "Deep Work", "Executive", "Witty / Snarky", "Minimal"
  description?: string;
  preferredUserName: string;
  assistantDisplayName: string;
  
  // High-level archetypes
  tone: 'architectural' | 'casual' | 'executive' | 'witty' | 'direct' | 'minimal';
  conversationStyle: 'collaborative_peer' | 'concise_operator' | 'mentor' | 'unfiltered_engineer';
  greetingStyle: 'warm' | 'short' | 'direct' | 'none';

  // 0-100 Precision Personality Sliders
  humorLevel: number;       // 0-100
  verbosity: number;        // 0-100 (0=ultra-short, 50=balanced, 100=in-depth)
  technicalDepth: number;   // 0-100 (0=simplified, 100=kernel/compiler level)
  proactivity: number;      // 0-100
  formality: number;        // 0-100 (0=laid back, 100=strictly professional)
  sarcasm: number;          // 0-100
  directness: number;       // 0-100 (0=gentle/diplomatic, 100=blunt/rapid)
  warmth: number;           // 0-100
  responseEnergy: number;   // 0-100
  profanityPreference: boolean;

  // Rich free-text description typed by user
  customPersonalityPrompt: string;

  // Synaptic Directives (CRUD-managed persistent behavioral instructions)
  synapticDirectives: SynapticDirectiveItem[];

  // Voice Portrait
  voiceProfile: {
    selectedVoiceName: string;
    rate: number;
    pitch: number;
  };

  // Autonomy & execution
  autonomy: {
    autoExecute: boolean;
    confirmDestructive: boolean;
    autoResumePendingSearches: boolean;
  };

  createdAt: number;
  updatedAt: number;
}

export const CANONICAL_DEFAULT_PERSONALITY_PROFILES: AetherIdentityProfile[] = [
  {
    id: 'profile_developer',
    name: 'Developer (Default)',
    description: 'Sharp, technical peer with high directness, balanced humor, and concise code explanations.',
    preferredUserName: 'Developer',
    assistantDisplayName: 'Aether',
    tone: 'architectural',
    conversationStyle: 'collaborative_peer',
    greetingStyle: 'warm',
    humorLevel: 45,
    verbosity: 35,
    technicalDepth: 85,
    proactivity: 70,
    formality: 30,
    sarcasm: 25,
    directness: 80,
    warmth: 60,
    responseEnergy: 65,
    profanityPreference: false,
    customPersonalityPrompt: 'Act like a senior full-stack software engineer and collaborative peer. Keep answers direct, prioritize architectural precision, and deliver immediate code and solutions without fluff.',
    synapticDirectives: [
      { id: 'dir-1', text: 'Address the user by their preferred name.', enabled: true, category: 'identity' },
      { id: 'dir-2', text: 'Keep technical explanations short unless explicitly asked for in-depth architecture.', enabled: true, category: 'communication' },
      { id: 'dir-3', text: 'Offer clear actionable follow-ups after search results.', enabled: true, category: 'technical' }
    ],
    voiceProfile: {
      selectedVoiceName: 'Google UK English Male',
      rate: 1.18,
      pitch: 1.0
    },
    autonomy: {
      autoExecute: true,
      confirmDestructive: true,
      autoResumePendingSearches: true
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
  {
    id: 'profile_casual',
    name: 'Casual & Relaxed',
    description: 'Laid back, friendly partner with high warmth, witty banter, and zero corporate jargon.',
    preferredUserName: 'Developer',
    assistantDisplayName: 'Aether',
    tone: 'casual',
    conversationStyle: 'collaborative_peer',
    greetingStyle: 'warm',
    humorLevel: 75,
    verbosity: 40,
    technicalDepth: 65,
    proactivity: 60,
    formality: 15,
    sarcasm: 40,
    directness: 70,
    warmth: 85,
    responseEnergy: 75,
    profanityPreference: false,
    customPersonalityPrompt: 'Talk casually like a friendly developer friend on Discord. Keep things fun, relaxed, and concise, and challenge bad ideas when helpful without sounding like a corporate support bot.',
    synapticDirectives: [
      { id: 'dir-c1', text: 'Speak informally and conversationally.', enabled: true, category: 'communication' },
      { id: 'dir-c2', text: 'Use clever metaphors to explain complex concepts.', enabled: true, category: 'custom' }
    ],
    voiceProfile: {
      selectedVoiceName: 'Google UK English Male',
      rate: 1.15,
      pitch: 1.05
    },
    autonomy: {
      autoExecute: true,
      confirmDestructive: true,
      autoResumePendingSearches: true
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
  {
    id: 'profile_deep_work',
    name: 'Deep Work (Minimalist)',
    description: 'Laser-focused, ultra-concise, zero small talk. Maximum speed for uninterrupted flow.',
    preferredUserName: 'Developer',
    assistantDisplayName: 'Aether',
    tone: 'minimal',
    conversationStyle: 'concise_operator',
    greetingStyle: 'short',
    humorLevel: 10,
    verbosity: 15,
    technicalDepth: 95,
    proactivity: 50,
    formality: 50,
    sarcasm: 0,
    directness: 95,
    warmth: 30,
    responseEnergy: 50,
    profanityPreference: false,
    customPersonalityPrompt: 'Act in deep work mode. Zero filler, maximum signal-to-noise ratio. Respond in bullet points or code snippets only.',
    synapticDirectives: [
      { id: 'dir-dw1', text: 'Respond in 1-2 concise sentences max unless writing code.', enabled: true, category: 'communication' },
      { id: 'dir-dw2', text: 'Execute tools immediately without status confirmations.', enabled: true, category: 'technical' }
    ],
    voiceProfile: {
      selectedVoiceName: 'Google UK English Male',
      rate: 1.25,
      pitch: 0.95
    },
    autonomy: {
      autoExecute: true,
      confirmDestructive: false,
      autoResumePendingSearches: true
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
  {
    id: 'profile_witty',
    name: 'Witty & Sarcastic',
    description: 'Clever, snarky, high-energy technical partner who loves roast-level code critiques.',
    preferredUserName: 'Developer',
    assistantDisplayName: 'Aether',
    tone: 'witty',
    conversationStyle: 'unfiltered_engineer',
    greetingStyle: 'warm',
    humorLevel: 90,
    verbosity: 45,
    technicalDepth: 80,
    proactivity: 75,
    formality: 10,
    sarcasm: 85,
    directness: 85,
    warmth: 50,
    responseEnergy: 90,
    profanityPreference: false,
    customPersonalityPrompt: 'Be witty, sarcastic, and sharp. Roast unoptimized loops, drop sarcastic commentary on buggy code, but always deliver rock-solid solutions.',
    synapticDirectives: [
      { id: 'dir-w1', text: 'Drop clever developer quips and sarcastic remarks.', enabled: true, category: 'communication' },
      { id: 'dir-w2', text: 'Never compromise on code quality while making jokes.', enabled: true, category: 'technical' }
    ],
    voiceProfile: {
      selectedVoiceName: 'Google UK English Male',
      rate: 1.2,
      pitch: 1.05
    },
    autonomy: {
      autoExecute: true,
      confirmDestructive: true,
      autoResumePendingSearches: true
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  }
];

class AetherPersonalitySystem {
  private activeProfileId: string = 'profile_developer';
  private customProfiles: AetherIdentityProfile[] = [];

  constructor() {
    this.loadProfiles();
  }

  private loadProfiles() {
    if (typeof window === 'undefined') return;
    try {
      const storedActive = localStorage.getItem('aether_active_personality_profile_id');
      if (storedActive) this.activeProfileId = storedActive;

      const storedCustom = localStorage.getItem('aether_custom_personality_profiles');
      if (storedCustom) {
        const parsed = JSON.parse(storedCustom);
        if (Array.isArray(parsed)) this.customProfiles = parsed;
      }
    } catch (e) {
      console.warn('Failed to load personality profiles:', e);
    }
  }

  public getAllProfiles(): AetherIdentityProfile[] {
    const list = [...CANONICAL_DEFAULT_PERSONALITY_PROFILES];
    this.customProfiles.forEach(cp => {
      const idx = list.findIndex(p => p.id === cp.id);
      if (idx >= 0) list[idx] = cp;
      else list.push(cp);
    });
    return list;
  }

  public getActiveProfile(): AetherIdentityProfile {
    const all = this.getAllProfiles();
    let found = all.find(p => p.id === this.activeProfileId);
    if (!found) found = all[0];

    // Overlay any local quick overrides
    if (typeof window !== 'undefined') {
      const overrideName = localStorage.getItem('aether_user_preferred_name');
      const overrideFreeText = localStorage.getItem('aether_custom_personality_freetext');
      if (overrideName && overrideName.trim()) {
        found = { ...found, preferredUserName: overrideName.trim() };
      }
      if (overrideFreeText && overrideFreeText.trim()) {
        found = { ...found, customPersonalityPrompt: overrideFreeText.trim() };
      }
    }
    return found;
  }

  public setActiveProfile(profileId: string) {
    this.activeProfileId = profileId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('aether_active_personality_profile_id', profileId);
      window.dispatchEvent(new CustomEvent('aether:personality-profile-changed', { detail: this.getActiveProfile() }));
    }
  }

  public updateActiveProfile(updates: Partial<AetherIdentityProfile>): AetherIdentityProfile {
    const active = this.getActiveProfile();
    const updated: AetherIdentityProfile = {
      ...active,
      ...updates,
      updatedAt: Date.now()
    };

    const existingCustomIdx = this.customProfiles.findIndex(p => p.id === updated.id);
    if (existingCustomIdx >= 0) {
      this.customProfiles[existingCustomIdx] = updated;
    } else {
      this.customProfiles.push(updated);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('aether_custom_personality_profiles', JSON.stringify(this.customProfiles));
      if (updates.preferredUserName) {
        localStorage.setItem('aether_user_preferred_name', updates.preferredUserName);
      }
      if (updates.customPersonalityPrompt !== undefined) {
        localStorage.setItem('aether_custom_personality_freetext', updates.customPersonalityPrompt);
      }
      window.dispatchEvent(new CustomEvent('aether:personality-profile-changed', { detail: updated }));
    }

    return updated;
  }

  public saveAsNewProfile(name: string, description?: string): AetherIdentityProfile {
    const active = this.getActiveProfile();
    const newProfile: AetherIdentityProfile = {
      ...active,
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim() || 'Custom Profile',
      description: description || 'User-saved custom identity profile',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.customProfiles.push(newProfile);
    this.activeProfileId = newProfile.id;

    if (typeof window !== 'undefined') {
      localStorage.setItem('aether_custom_personality_profiles', JSON.stringify(this.customProfiles));
      localStorage.setItem('aether_active_personality_profile_id', newProfile.id);
      window.dispatchEvent(new CustomEvent('aether:personality-profile-changed', { detail: newProfile }));
    }
    return newProfile;
  }

  public deleteProfile(profileId: string): boolean {
    if (CANONICAL_DEFAULT_PERSONALITY_PROFILES.some(p => p.id === profileId)) {
      return false; // Cannot delete base presets
    }
    this.customProfiles = this.customProfiles.filter(p => p.id !== profileId);
    if (this.activeProfileId === profileId) {
      this.activeProfileId = 'profile_developer';
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('aether_custom_personality_profiles', JSON.stringify(this.customProfiles));
      localStorage.setItem('aether_active_personality_profile_id', this.activeProfileId);
      window.dispatchEvent(new CustomEvent('aether:personality-profile-changed', { detail: this.getActiveProfile() }));
    }
    return true;
  }

  // -------------------------------------------------------------
  // SYNAPTIC DIRECTIVES (CRUD)
  // -------------------------------------------------------------
  public addDirective(text: string, category: SynapticDirectiveItem['category'] = 'custom'): SynapticDirectiveItem {
    const active = this.getActiveProfile();
    const newDir: SynapticDirectiveItem = {
      id: `dir-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: text.trim(),
      enabled: true,
      category
    };

    const updatedDirectives = [...active.synapticDirectives, newDir];
    this.updateActiveProfile({ synapticDirectives: updatedDirectives });
    return newDir;
  }

  public updateDirective(id: string, updates: Partial<SynapticDirectiveItem>) {
    const active = this.getActiveProfile();
    const updatedDirectives = active.synapticDirectives.map(d => (d.id === id ? { ...d, ...updates } : d));
    this.updateActiveProfile({ synapticDirectives: updatedDirectives });
  }

  public deleteDirective(id: string) {
    const active = this.getActiveProfile();
    const updatedDirectives = active.synapticDirectives.filter(d => d.id !== id);
    this.updateActiveProfile({ synapticDirectives: updatedDirectives });
  }

  public toggleDirective(id: string, enabled?: boolean) {
    const active = this.getActiveProfile();
    const updatedDirectives = active.synapticDirectives.map(d => {
      if (d.id === id) {
        return { ...d, enabled: enabled !== undefined ? enabled : !d.enabled };
      }
      return d;
    });
    this.updateActiveProfile({ synapticDirectives: updatedDirectives });
  }

  public reorderDirectives(newOrder: SynapticDirectiveItem[]) {
    this.updateActiveProfile({ synapticDirectives: newOrder });
  }

  // -------------------------------------------------------------
  // RESOLVED PROMPT SYNTHESIS & INJECTION
  // -------------------------------------------------------------
  public generateFullSystemPromptInjection(): string {
    const profile = this.getActiveProfile();
    const activeDirectives = profile.synapticDirectives.filter(d => d.enabled);

    const parts: string[] = [];
    parts.push(`=== AETHER CORE IDENTITY & CONVERSATIONAL ARCHITECTURE ===`);
    parts.push(`- Assistant Name: "${profile.assistantDisplayName}"`);
    parts.push(`- User's Preferred Name: "${profile.preferredUserName}". Address the user naturally by this name.`);
    parts.push(`- Active Persona Profile: "${profile.name}" (Tone: ${profile.tone}, Style: ${profile.conversationStyle})`);
    
    // Sliders translation
    const verbosityDesc = profile.verbosity < 30 ? 'ultra-concise and direct (1-2 sentences maximum)' : profile.verbosity > 70 ? 'thorough and detailed with complete architectural context' : 'balanced and direct';
    const humorDesc = profile.humorLevel > 60 ? 'witty, clever, with occasional developer humor' : profile.humorLevel < 25 ? 'serious and strictly professional' : 'lighthearted and natural';
    const techDepthDesc = profile.technicalDepth > 75 ? 'deep technical precision, referencing exact APIs and data structures' : 'practical and accessible';

    parts.push(`- Personality Metrics:`);
    parts.push(`  • Verbosity: ${profile.verbosity}/100 -> ${verbosityDesc}`);
    parts.push(`  • Humor: ${profile.humorLevel}/100 -> ${humorDesc}`);
    parts.push(`  • Technical Depth: ${profile.technicalDepth}/100 -> ${techDepthDesc}`);
    parts.push(`  • Directness: ${profile.directness}/100 (Bluntness & speed of answering)`);
    parts.push(`  • Formality: ${profile.formality}/100`);
    parts.push(`  • Warmth: ${profile.warmth}/100`);
    parts.push(`  • Sarcasm: ${profile.sarcasm}/100`);

    if (profile.customPersonalityPrompt && profile.customPersonalityPrompt.trim()) {
      parts.push(`- FREE-TEXT PERSONALITY INSTRUCTION:`);
      parts.push(`  "${profile.customPersonalityPrompt.trim()}"`);
    }

    if (activeDirectives.length > 0) {
      parts.push(`- ACTIVE SYNAPTIC DIRECTIVES (Strict Persistent Behavioral Rules):`);
      activeDirectives.forEach((dir, i) => {
        parts.push(`  ${i + 1}. ${dir.text}`);
      });
    }

    parts.push(`- RULE PRIORITY HIERARCHY: System Safety & Privacy > Workspace Permissions > Active User Personality > Synaptic Directives > Immediate Conversation Context.`);
    parts.push(`- TOOL OUTPUT RULE: When returning search results, videos, or system actions, NEVER sound like a generic command-line robot. Maintain the active personality across all summaries, greetings, explanations, and error messages.`);

    return parts.join('\n');
  }

  // Format any tool or standard response through the active personality
  public formatTextThroughPersonality(rawText: string): string {
    if (!rawText) return rawText;
    const profile = this.getActiveProfile();
    let text = rawText;

    if (profile.preferredUserName && profile.preferredUserName !== 'Developer') {
      text = text.replace(/\bDeveloper\b/g, profile.preferredUserName);
    }

    // Ultra-concise verbosity constraint
    if (profile.verbosity <= 25 && text.length > 220) {
      const sentences = text.split(/(?<=[.!?])\s+/);
      if (sentences.length > 2) {
        text = sentences.slice(0, 2).join(' ');
      }
    }

    return text;
  }
}

export const aetherPersonalitySystem = new AetherPersonalitySystem();
