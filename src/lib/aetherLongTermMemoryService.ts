// Aether Long-Term Memory Engine
// Authoritative persistent memory storage across days, weeks, projects, and conversations.
// Extracts, deduplicates, categorizes, and ranks structured memories with verified fact vs inference separation.

export type MemoryCategory =
  | 'project_goal'
  | 'important_decision'
  | 'architecture_choice'
  | 'user_preference'
  | 'unresolved_blocker'
  | 'recurring_workflow'
  | 'important_note'
  | 'repo_context'
  | 'work_theme'
  | 'explicit_user_directive'
  | 'machine_specific_config';

export type MemoryScope = 'global' | 'project' | 'machine_local';

export type MemoryClassification = 'verified_fact' | 'aether_inference';

export interface LongTermMemory {
  id: string;
  key?: string; // Semantic deduplication key (e.g., "pref:editor_ide", "arch:bundler", "goal:launch_target")
  title: string;
  content: string;
  category: MemoryCategory;
  scope: MemoryScope;
  projectId?: string;
  projectName?: string;
  classification: MemoryClassification;
  confidence: number; // 0.0 to 1.0
  pinned: boolean;
  isMachineLocal: boolean;
  syncStatus: 'local_only' | 'synced' | 'pending';
  tags: string[];
  source: 'explicit_remember' | 'conversation_extraction' | 'workflow' | 'git_context' | 'decision_log';
  accessCount: number;
  lastRecalledAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryQueryOptions {
  query?: string;
  projectId?: string;
  category?: MemoryCategory | 'all';
  scope?: MemoryScope | 'all';
  classification?: MemoryClassification | 'all';
  pinnedOnly?: boolean;
  limit?: number;
  minRelevance?: number; // 0.0 to 1.0
}

export interface RankedMemoryResult {
  memory: LongTermMemory;
  relevanceScore: number; // 0.0 to 1.0
  recencyScore: number; // 0.0 to 1.0
  compositeRank: number; // combined score
  matchReasons: string[];
}

export interface MemoryStats {
  total: number;
  verifiedFacts: number;
  aetherInferences: number;
  globalCount: number;
  projectCount: number;
  machineLocalCount: number;
  pinnedCount: number;
  categories: Record<string, number>;
}

const STORAGE_KEY = 'aether_long_term_memories_v1';
const MEMORY_EVENT_NAME = 'aether-long-term-memory-updated';

class AetherLongTermMemoryService {
  private memories: LongTermMemory[] = [];
  private listeners: Set<(memories: LongTermMemory[]) => void> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    this.loadFromStorage();
    if (this.memories.length === 0) {
      this.seedDefaultMemories();
    }
    this.initialized = true;
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.memories = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load long-term memories from storage:', e);
    }
  }

  private saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to persist long-term memories:', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn([...this.memories]);
      } catch (err) {
        console.error('Memory listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(MEMORY_EVENT_NAME, {
          detail: { memories: this.memories, timestamp: Date.now() }
        })
      );
    }
  }

  public subscribe(listener: (memories: LongTermMemory[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.memories]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Seed structured canonical memories so Aether is immediately grounded.
   */
  private seedDefaultMemories() {
    const now = Date.now();
    const seeds: LongTermMemory[] = [
      {
        id: 'mem_seed_pref_voice',
        key: 'pref:voice_default',
        title: 'Default Aether Voice: UK English Male',
        content: 'The user and DevSpace configuration defaults Aether voice synthesis to UK English Male.',
        category: 'user_preference',
        scope: 'global',
        classification: 'verified_fact',
        confidence: 1.0,
        pinned: true,
        isMachineLocal: false,
        syncStatus: 'synced',
        tags: ['voice', 'personality', 'aether', 'preference'],
        source: 'explicit_remember',
        accessCount: 12,
        createdAt: now - 86400000 * 5,
        updatedAt: now - 86400000 * 5
      },
      {
        id: 'mem_seed_arch_bundler',
        key: 'arch:server_bundle',
        title: 'Backend Architecture: Standalone esbuild CommonJS Server',
        content: 'Server compiles to a single bundled CommonJS file (dist/server.cjs) via esbuild, bypassing Node ESM relative import restrictions.',
        category: 'architecture_choice',
        scope: 'global',
        classification: 'verified_fact',
        confidence: 1.0,
        pinned: true,
        isMachineLocal: false,
        syncStatus: 'synced',
        tags: ['server', 'esbuild', 'cjs', 'node', 'architecture'],
        source: 'explicit_remember',
        accessCount: 8,
        createdAt: now - 86400000 * 4,
        updatedAt: now - 86400000 * 4
      },
      {
        id: 'mem_seed_goal_desktop_fidelity',
        key: 'goal:desktop_experience',
        title: 'DevSpace Project Goal: Native Multi-Surface Fluidity',
        content: 'Unify DevSpace web and Electron desktop experiences with instantaneous keyboard hotkeys, Dynamic Island overlay, and zero-latency local execution.',
        category: 'project_goal',
        scope: 'project',
        projectId: 'p1',
        projectName: 'DevSpace Desktop & Aether Core',
        classification: 'verified_fact',
        confidence: 1.0,
        pinned: true,
        isMachineLocal: false,
        syncStatus: 'synced',
        tags: ['goal', 'desktop', 'electron', 'dynamic_island', 'hotkeys'],
        source: 'explicit_remember',
        accessCount: 15,
        createdAt: now - 86400000 * 6,
        updatedAt: now - 86400000 * 6
      },
      {
        id: 'mem_seed_pref_theme',
        key: 'pref:dark_palette',
        title: 'UI Design Preference: Sophisticated Neutral Dark Canvas',
        content: 'Avoid purple-to-blue gradients; use deep #08080a / #0c0c0e slate neutrals with amber/emerald precision accents and WCAG AA contrast.',
        category: 'user_preference',
        scope: 'global',
        classification: 'verified_fact',
        confidence: 0.95,
        pinned: false,
        isMachineLocal: false,
        syncStatus: 'synced',
        tags: ['ui', 'theme', 'styling', 'tailwind', 'contrast'],
        source: 'decision_log',
        accessCount: 5,
        createdAt: now - 86400000 * 3,
        updatedAt: now - 86400000 * 3
      },
      {
        id: 'mem_seed_decision_local_landscape_routing',
        key: 'dec:offline_first_cortex',
        title: 'Architecture Decision: Offline-First Local Data Persistence',
        content: 'Keep transient scratchpad data local to avoid network overhead, while syncing account-safe entities through persistent storage.',
        category: 'important_decision',
        scope: 'project',
        projectId: 'p2',
        projectName: 'Local Landscape',
        classification: 'verified_fact',
        confidence: 0.98,
        pinned: false,
        isMachineLocal: false,
        syncStatus: 'synced',
        tags: ['storage', 'persistence', 'offline_first', 'decision'],
        source: 'decision_log',
        accessCount: 4,
        createdAt: now - 86400000 * 2,
        updatedAt: now - 86400000 * 2
      },
      {
        id: 'mem_seed_inf_work_pattern',
        key: 'inf:active_workflow_preference',
        title: 'Aether Inference: User Prefers Concise Direct Code Over Verbose Summaries',
        content: 'Observed that the user responds best to immediate executable code changes, focused single-view layouts, and minimal conversational filler.',
        category: 'work_theme',
        scope: 'global',
        classification: 'aether_inference',
        confidence: 0.88,
        pinned: false,
        isMachineLocal: false,
        syncStatus: 'synced',
        tags: ['inference', 'working_style', 'concise', 'pattern'],
        source: 'conversation_extraction',
        accessCount: 6,
        createdAt: now - 86400000 * 1,
        updatedAt: now - 86400000 * 1
      },
      {
        id: 'mem_seed_blocker_github_webhook',
        key: 'blocker:github_webhook_cooldown',
        title: 'Unresolved Blocker: GitHub Token Cooldown Rate Limits',
        content: 'High-frequency pull requests and workflow dispatch triggers require 45-second debounce cooldown to avoid API rate limits.',
        category: 'unresolved_blocker',
        scope: 'global',
        classification: 'verified_fact',
        confidence: 0.95,
        pinned: false,
        isMachineLocal: false,
        syncStatus: 'synced',
        tags: ['github', 'rate_limit', 'blocker', 'webhook'],
        source: 'git_context',
        accessCount: 3,
        createdAt: now - 86400000 * 2,
        updatedAt: now - 86400000 * 2
      }
    ];

    this.memories = seeds;
    this.saveToStorage();
  }

  /**
   * Helper to generate a consistent deduplication key.
   */
  public generateSemanticKey(category: MemoryCategory, title: string, scope: MemoryScope, projectId?: string): string {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30);
    const scopePrefix = scope === 'project' && projectId ? `proj_${projectId}` : scope;
    return `${scopePrefix}:${category}:${cleanTitle}`;
  }

  /**
   * Explicit "Remember This" handler.
   */
  public rememberThis(
    input: string,
    options?: {
      category?: MemoryCategory;
      scope?: MemoryScope;
      projectId?: string;
      projectName?: string;
      classification?: MemoryClassification;
      pinned?: boolean;
      isMachineLocal?: boolean;
      tags?: string[];
    }
  ): { memory: LongTermMemory; isUpdate: boolean; replacedPrevious: boolean } {
    const raw = input.trim();
    if (!raw) {
      throw new Error('Cannot remember an empty memory string.');
    }

    const { title, content, detectedCategory } = this.parseMemoryText(raw, options?.category);
    const category = options?.category || detectedCategory;
    const scope = options?.scope || (options?.projectId ? 'project' : 'global');
    const classification = options?.classification || 'verified_fact';
    const isMachineLocal = options?.isMachineLocal || scope === 'machine_local';

    const semanticKey = this.generateSemanticKey(category, title, scope, options?.projectId);

    // Look for existing memory to update/replace rather than create duplicate
    const existingIndex = this.findMatchingMemoryIndex(semanticKey, title, content, scope, options?.projectId);

    const now = Date.now();

    if (existingIndex >= 0) {
      const existing = this.memories[existingIndex];
      const updated: LongTermMemory = {
        ...existing,
        title: title || existing.title,
        content,
        category,
        scope,
        projectId: options?.projectId || existing.projectId,
        projectName: options?.projectName || existing.projectName,
        classification,
        confidence: 1.0,
        pinned: options?.pinned !== undefined ? options.pinned : existing.pinned,
        isMachineLocal,
        syncStatus: isMachineLocal ? 'local_only' : 'synced',
        tags: Array.from(new Set([...(existing.tags || []), ...(options?.tags || []), category, scope])),
        source: 'explicit_remember',
        updatedAt: now
      };

      this.memories[existingIndex] = updated;
      this.saveToStorage();
      return { memory: updated, isUpdate: true, replacedPrevious: true };
    }

    const newMemory: LongTermMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key: semanticKey,
      title,
      content,
      category,
      scope,
      projectId: options?.projectId,
      projectName: options?.projectName,
      classification,
      confidence: 1.0,
      pinned: options?.pinned || false,
      isMachineLocal,
      syncStatus: isMachineLocal ? 'local_only' : 'synced',
      tags: Array.from(new Set([...(options?.tags || []), category, scope, 'explicit'])),
      source: 'explicit_remember',
      accessCount: 1,
      createdAt: now,
      updatedAt: now
    };

    this.memories.unshift(newMemory);
    this.saveToStorage();
    return { memory: newMemory, isUpdate: false, replacedPrevious: false };
  }

  /**
   * Explicit "Forget This" handler.
   */
  public forgetThis(
    targetQueryOrId: string,
    options?: { projectId?: string; scope?: MemoryScope }
  ): { forgottenCount: number; forgottenMemories: LongTermMemory[] } {
    const raw = targetQueryOrId.trim();
    if (!raw) return { forgottenCount: 0, forgottenMemories: [] };

    // 1. Direct ID match
    const byId = this.memories.find((m) => m.id === raw);
    if (byId) {
      this.memories = this.memories.filter((m) => m.id !== raw);
      this.saveToStorage();
      return { forgottenCount: 1, forgottenMemories: [byId] };
    }

    // 2. Semantic query matching
    const searchTerms = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const matched: LongTermMemory[] = [];

    this.memories = this.memories.filter((m) => {
      if (options?.projectId && m.projectId && m.projectId !== options.projectId) {
        return true; // keep untouched
      }

      const text = `${m.title} ${m.content} ${m.tags.join(' ')} ${m.key || ''}`.toLowerCase();
      const matchScore = searchTerms.filter((term) => text.includes(term)).length / searchTerms.length;

      if (matchScore >= 0.6 || text.includes(raw.toLowerCase())) {
        matched.push(m);
        return false; // remove
      }
      return true; // keep
    });

    if (matched.length > 0) {
      this.saveToStorage();
    }

    return { forgottenCount: matched.length, forgottenMemories: matched };
  }

  /**
   * Parse user text to extract clean title and content and infer category.
   */
  private parseMemoryText(
    text: string,
    forcedCategory?: MemoryCategory
  ): { title: string; content: string; detectedCategory: MemoryCategory } {
    let clean = text
      .replace(/^(?:please\s+)?(?:remember\s+this\s*:\s*|remember\s+that\s+|remember\s+this\s+|remember\s+|save\s+to\s+memory\s*:\s*|save\s+to\s+memory\s+|don't\s+forget\s+that\s+|dont\s+forget\s+that\s+|keep\s+in\s+mind\s+that\s+|note\s+that\s+)/i, '')
      .trim();

    // Default category detection heuristics
    let detectedCategory: MemoryCategory = forcedCategory || 'explicit_user_directive';
    const lower = clean.toLowerCase();

    if (!forcedCategory) {
      if (lower.includes('goal is') || lower.includes('our goal') || lower.includes('target is') || lower.includes('objective')) {
        detectedCategory = 'project_goal';
      } else if (lower.includes('decided to') || lower.includes('we decided') || lower.includes('decision:')) {
        detectedCategory = 'important_decision';
      } else if (lower.includes('architecture') || lower.includes('use tailwind') || lower.includes('use vite') || lower.includes('framework') || lower.includes('bundler') || lower.includes('database')) {
        detectedCategory = 'architecture_choice';
      } else if (lower.includes('i prefer') || lower.includes('my preference') || lower.includes('always use') || lower.includes('i like to') || lower.includes('never use')) {
        detectedCategory = 'user_preference';
      } else if (lower.includes('blocked by') || lower.includes('blocker') || lower.includes('issue with') || lower.includes('broken')) {
        detectedCategory = 'unresolved_blocker';
      } else if (lower.includes('workflow') || lower.includes('step 1') || lower.includes('every morning') || lower.includes('routine')) {
        detectedCategory = 'recurring_workflow';
      } else if (lower.includes('github') || lower.includes('repo') || lower.includes('branch') || lower.includes('pr #')) {
        detectedCategory = 'repo_context';
      }
    }

    let title = '';
    let content = clean;

    if (clean.includes(':')) {
      const parts = clean.split(':');
      title = parts[0].trim();
      content = parts.slice(1).join(':').trim();
    } else {
      // First sentence or first 60 chars as title
      const sentences = clean.split(/[\.\n]/);
      title = sentences[0].slice(0, 70).trim();
      if (title.length < clean.length && !title.endsWith('.')) {
        title += '...';
      }
    }

    if (!title) {
      title = clean.slice(0, 50);
    }

    return { title, content: content || clean, detectedCategory };
  }

  /**
   * Find index of a memory that duplicates or represents the same core topic.
   */
  private findMatchingMemoryIndex(
    semanticKey: string,
    title: string,
    content: string,
    scope: MemoryScope,
    projectId?: string
  ): number {
    // 1. Exact semantic key
    const keyMatch = this.memories.findIndex((m) => m.key && m.key === semanticKey);
    if (keyMatch >= 0) return keyMatch;

    // 2. High title or topic similarity in the same scope and project
    const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (let i = 0; i < this.memories.length; i++) {
      const m = this.memories[i];
      if (m.scope !== scope) continue;
      if (scope === 'project' && m.projectId !== projectId) continue;

      const memNormTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normTitle && memNormTitle && (normTitle.includes(memNormTitle) || memNormTitle.includes(normTitle))) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Retrieve and rank memories based on relevance, recency, scope match, and pinned status.
   */
  public queryMemories(options: MemoryQueryOptions = {}): RankedMemoryResult[] {
    const {
      query = '',
      projectId,
      category = 'all',
      scope = 'all',
      classification = 'all',
      pinnedOnly = false,
      limit = 20,
      minRelevance = 0.0
    } = options;

    const queryTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const now = Date.now();
    const ranked: RankedMemoryResult[] = [];

    for (const memory of this.memories) {
      // Filters
      if (category !== 'all' && memory.category !== category) continue;
      if (scope !== 'all' && memory.scope !== scope) continue;
      if (classification !== 'all' && memory.classification !== classification) continue;
      if (pinnedOnly && !memory.pinned) continue;

      // Project scope filter: if query specified projectId, allow matching project memories and global memories
      if (projectId && memory.scope === 'project' && memory.projectId && memory.projectId !== projectId) {
        continue;
      }

      // Compute Relevance
      let relevance = 0.5; // baseline
      const reasons: string[] = [];

      if (queryTokens.length > 0) {
        const textTarget = `${memory.title} ${memory.content} ${memory.tags.join(' ')} ${memory.category}`.toLowerCase();
        let matches = 0;
        for (const token of queryTokens) {
          if (textTarget.includes(token)) {
            matches++;
            if (memory.title.toLowerCase().includes(token)) matches += 0.5;
            if (memory.tags.some((t) => t.toLowerCase().includes(token))) matches += 0.3;
          }
        }
        relevance = Math.min(1.0, matches / Math.max(1, queryTokens.length));
        if (relevance > 0.4) {
          reasons.push(`Matched ${matches.toFixed(1)} query terms`);
        }
      } else {
        relevance = 1.0;
      }

      // Recency calculation (exponential decay over 30 days)
      const ageDays = (now - memory.updatedAt) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0.1, Math.exp(-ageDays / 30));

      // Scope match bonus
      let scopeBonus = 0;
      if (projectId && memory.scope === 'project' && memory.projectId === projectId) {
        scopeBonus = 0.2;
        reasons.push('Linked to active project');
      } else if (memory.scope === 'global') {
        scopeBonus = 0.1;
      }

      // Pinned bonus
      const pinnedBonus = memory.pinned ? 0.25 : 0;
      if (memory.pinned) reasons.push('Pinned by user');

      // Verified fact weighting
      const factBonus = memory.classification === 'verified_fact' ? 0.1 : 0;

      // Composite Rank: 50% relevance, 20% recency, 20% pinned, 10% scope match
      const compositeRank = Math.min(
        1.0,
        relevance * 0.5 + recencyScore * 0.2 + pinnedBonus + scopeBonus + factBonus
      );

      if (relevance >= minRelevance) {
        ranked.push({
          memory,
          relevanceScore: Number(relevance.toFixed(2)),
          recencyScore: Number(recencyScore.toFixed(2)),
          compositeRank: Number(compositeRank.toFixed(3)),
          matchReasons: reasons.length > 0 ? reasons : ['General index match']
        });
      }
    }

    // Sort descending by composite rank
    ranked.sort((a, b) => b.compositeRank - a.compositeRank);

    return ranked.slice(0, limit);
  }

  /**
   * Automated turn extraction: extracts high-value long-term facts/preferences without storing full logs.
   */
  public extractMemoriesFromTurn(
    userMessage: string,
    assistantResponse: string,
    context?: { projectId?: string; projectName?: string }
  ): LongTermMemory[] {
    const text = userMessage.trim();
    if (text.length < 10) return [];

    const lower = text.toLowerCase();
    const extracted: LongTermMemory[] = [];

    // Pattern 1: User explicitly stating persistent preferences
    if (
      lower.startsWith('i prefer ') ||
      lower.startsWith('always use ') ||
      lower.startsWith('never use ') ||
      lower.startsWith('my preferred ') ||
      lower.includes('my favorite ') ||
      lower.includes('my default ')
    ) {
      const res = this.rememberThis(text, {
        category: 'user_preference',
        scope: 'global',
        classification: 'verified_fact',
        projectId: context?.projectId,
        projectName: context?.projectName
      });
      extracted.push(res.memory);
    }

    // Pattern 2: Architectural choice or goal statements
    if (
      lower.includes('we are building ') ||
      lower.includes('our target is ') ||
      lower.includes('our goal is ') ||
      lower.includes('we chose ') ||
      lower.includes('we decided on ') ||
      lower.includes('let us use postgres') ||
      lower.includes("let's use tailwind")
    ) {
      const res = this.rememberThis(text, {
        category: lower.includes('goal') || lower.includes('building') ? 'project_goal' : 'architecture_choice',
        scope: context?.projectId ? 'project' : 'global',
        classification: 'verified_fact',
        projectId: context?.projectId,
        projectName: context?.projectName
      });
      extracted.push(res.memory);
    }

    return extracted;
  }

  /**
   * CRUD & UI management helpers.
   */
  public getMemories(): LongTermMemory[] {
    return [...this.memories];
  }

  public getMemoryById(id: string): LongTermMemory | undefined {
    return this.memories.find((m) => m.id === id);
  }

  public addMemory(memoryData: Omit<LongTermMemory, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>): LongTermMemory {
    const now = Date.now();
    const newMem: LongTermMemory = {
      ...memoryData,
      id: `mem_${now}_${Math.random().toString(36).substring(2, 7)}`,
      accessCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.memories.unshift(newMem);
    this.saveToStorage();
    return newMem;
  }

  public updateMemory(id: string, updates: Partial<LongTermMemory>): LongTermMemory | null {
    const idx = this.memories.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    const existing = this.memories[idx];
    const updated: LongTermMemory = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    this.memories[idx] = updated;
    this.saveToStorage();
    return updated;
  }

  public deleteMemory(id: string): boolean {
    const initialLen = this.memories.length;
    this.memories = this.memories.filter((m) => m.id !== id);
    if (this.memories.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public togglePin(id: string): boolean {
    const memory = this.getMemoryById(id);
    if (!memory) return false;
    this.updateMemory(id, { pinned: !memory.pinned });
    return true;
  }

  public touchMemory(id: string) {
    const mem = this.getMemoryById(id);
    if (mem) {
      mem.accessCount = (mem.accessCount || 0) + 1;
      mem.lastRecalledAt = Date.now();
      this.saveToStorage();
    }
  }

  public getStats(activeProjectId?: string): MemoryStats {
    const stats: MemoryStats = {
      total: this.memories.length,
      verifiedFacts: 0,
      aetherInferences: 0,
      globalCount: 0,
      projectCount: 0,
      machineLocalCount: 0,
      pinnedCount: 0,
      categories: {}
    };

    for (const m of this.memories) {
      if (m.classification === 'verified_fact') stats.verifiedFacts++;
      if (m.classification === 'aether_inference') stats.aetherInferences++;
      if (m.scope === 'global') stats.globalCount++;
      if (m.scope === 'project') stats.projectCount++;
      if (m.isMachineLocal || m.scope === 'machine_local') stats.machineLocalCount++;
      if (m.pinned) stats.pinnedCount++;

      stats.categories[m.category] = (stats.categories[m.category] || 0) + 1;
    }

    return stats;
  }

  public exportMemories(): string {
    // Exclude machine-local memories if exported for cloud account sync
    return JSON.stringify(this.memories, null, 2);
  }

  public importMemories(jsonString: string): { imported: number; errors?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { imported: 0, errors: 'Invalid format: expected array of memories.' };
      }

      let count = 0;
      for (const item of parsed) {
        if (item.title && item.content) {
          const res = this.rememberThis(item.content, {
            category: item.category,
            scope: item.scope,
            projectId: item.projectId,
            projectName: item.projectName,
            classification: item.classification,
            pinned: item.pinned,
            isMachineLocal: item.isMachineLocal,
            tags: item.tags
          });
          if (res) count++;
        }
      }
      return { imported: count };
    } catch (e: any) {
      return { imported: 0, errors: e?.message || 'Failed to parse JSON' };
    }
  }
}

export const aetherLongTermMemory = new AetherLongTermMemoryService();
