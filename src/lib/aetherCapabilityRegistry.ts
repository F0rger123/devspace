// Aether Capability & Credentials Registry
// Manages per-user AI credentials, capability gating, and secure validation

export type CapabilityId = 
  | 'google_search_grounding'
  | 'gemini_advanced_reasoning'
  | 'gemini_code_generation'
  | 'google_calendar'
  | 'google_gmail'
  | 'github_activity'
  | 'desktop_launch'
  | 'spotify_playback';

export type AuthProviderId = 'gemini' | 'google_oauth' | 'github' | 'spotify' | 'anthropic' | 'local_llm';

export interface RequiredDependency {
  provider: AuthProviderId;
  name: string;
  description: string;
  setupRoute?: string;
  setupAction?: 'gemini_key_modal' | 'google_oauth_prompt' | 'github_token_prompt' | 'desktop_app_prompt';
}

export interface AetherCapability {
  id: CapabilityId;
  name: string;
  category: 'ai_reasoning' | 'search' | 'integrations' | 'desktop';
  description: string;
  requiredDependencies: RequiredDependency[];
  fallbackProvider?: string;
  isAvailable: boolean;
  blockerReason?: string;
}

export interface UserAICredentialState {
  provider: AuthProviderId;
  credentialConfigured: boolean;
  validationStatus: 'UNCONFIGURED' | 'VALIDATING' | 'CONNECTED' | 'AUTHENTICATION_FAILED';
  lastValidated?: number;
  lastError?: string;
  maskedKeyHint?: string;
  availableCapabilities: CapabilityId[];
  isUserOwned: boolean;
}

export interface PendingAetherTask {
  id: string;
  intent: string;
  description: string;
  entities: Record<string, any>;
  requiredCapability: CapabilityId;
  createdAt: number;
}

// In-memory runtime cache for the session
let cachedUserGeminiKey: string | null = null;

class AetherCapabilityRegistry {
  private pendingTask: PendingAetherTask | null = null;

  constructor() {
    this.loadPendingTask();
  }

  // Capability declarations
  public getCapabilities(): AetherCapability[] {
    const geminiCred = this.getGeminiCredentialState();
    const hasGemini = geminiCred.validationStatus === 'CONNECTED' && geminiCred.credentialConfigured;

    return [
      {
        id: 'google_search_grounding',
        name: 'Google Search Grounding',
        category: 'search',
        description: 'Real-time live Google Search and information synthesis through Gemini grounding.',
        requiredDependencies: [
          {
            provider: 'gemini',
            name: 'User-Owned Gemini API Credential',
            description: 'Requires a valid personal Gemini API key created in Google AI Studio to run search queries against your quota.',
            setupRoute: '/settings?tab=integrations&provider=gemini',
            setupAction: 'gemini_key_modal'
          }
        ],
        fallbackProvider: 'Wikipedia Encyclopedia & Indexed Tech Specs',
        isAvailable: hasGemini,
        blockerReason: !hasGemini ? 'User-owned Gemini API key required for live Google Search grounding.' : undefined
      },
      {
        id: 'gemini_advanced_reasoning',
        name: 'Advanced Gemini AI Reasoning',
        category: 'ai_reasoning',
        description: 'Deep architectural analysis, code transformation, and multi-turn conversational intelligence.',
        requiredDependencies: [
          {
            provider: 'gemini',
            name: 'User-Owned Gemini API Credential',
            description: 'Requires your own Google Cloud / Gemini API key.',
            setupRoute: '/settings?tab=integrations&provider=gemini',
            setupAction: 'gemini_key_modal'
          }
        ],
        isAvailable: hasGemini,
        blockerReason: !hasGemini ? 'Gemini API key is not configured.' : undefined
      },
      {
        id: 'gemini_code_generation',
        name: 'Gemini Code Generation & Synthesis',
        category: 'ai_reasoning',
        description: 'Automated code patching, refactoring, and prototype assembly.',
        requiredDependencies: [
          {
            provider: 'gemini',
            name: 'User-Owned Gemini API Credential',
            description: 'Requires your own Google Cloud / Gemini API key.',
            setupRoute: '/settings?tab=integrations&provider=gemini',
            setupAction: 'gemini_key_modal'
          }
        ],
        isAvailable: hasGemini,
        blockerReason: !hasGemini ? 'Gemini API key is not configured.' : undefined
      },
      {
        id: 'google_calendar',
        name: 'Google Calendar Integration',
        category: 'integrations',
        description: 'Reads schedule and creates workspace meeting reminders.',
        requiredDependencies: [
          {
            provider: 'google_oauth',
            name: 'Google Account OAuth (Calendar Scopes)',
            description: 'Authorizes read/write access to Google Calendar.'
          }
        ],
        isAvailable: typeof window !== 'undefined' ? !!localStorage.getItem('app_google_token') : false,
        blockerReason: 'Google Calendar OAuth authorization required.'
      },
      {
        id: 'google_gmail',
        name: 'Gmail Integration',
        category: 'integrations',
        description: 'Accesses developer alerts and notification digests.',
        requiredDependencies: [
          {
            provider: 'google_oauth',
            name: 'Google Account OAuth (Gmail Scopes)',
            description: 'Authorizes access to Gmail.'
          }
        ],
        isAvailable: typeof window !== 'undefined' ? !!localStorage.getItem('app_google_token') : false,
        blockerReason: 'Gmail OAuth authorization required.'
      },
      {
        id: 'github_activity',
        name: 'GitHub Repository Sync & PRs',
        category: 'integrations',
        description: 'Inspects commits, issues, branches, and PR activities.',
        requiredDependencies: [
          {
            provider: 'github',
            name: 'GitHub Personal Access Token / OAuth',
            description: 'Authorizes access to GitHub repositories.'
          }
        ],
        isAvailable: typeof window !== 'undefined' ? !!localStorage.getItem('app_github_token') : false,
        blockerReason: 'GitHub Token required.'
      },
      {
        id: 'desktop_launch',
        name: 'Desktop App Launcher',
        category: 'desktop',
        description: 'Launches native desktop applications (VS Code, Chrome, Terminal, etc.).',
        requiredDependencies: [
          {
            provider: 'local_llm',
            name: 'DevSpace Desktop Runtime',
            description: 'Requires running inside DevSpace Desktop application container.'
          }
        ],
        isAvailable: true
      }
    ];
  }

  public checkCapability(id: CapabilityId): { allowed: boolean; capability?: AetherCapability; blockerReason?: string } {
    const caps = this.getCapabilities();
    const cap = caps.find(c => c.id === id);
    if (!cap) return { allowed: false, blockerReason: `Unknown capability: ${id}` };
    return { allowed: cap.isAvailable, capability: cap, blockerReason: cap.blockerReason };
  }

  // -------------------------------------------------------------
  // SECURE USER GEMINI CREDENTIAL MANAGEMENT
  // -------------------------------------------------------------
  public getStoredUserGeminiKey(): string | null {
    if (cachedUserGeminiKey) return cachedUserGeminiKey;
    if (typeof window === 'undefined') return null;

    try {
      // Look in session & local storage
      const stored = sessionStorage.getItem('devspace_user_gemini_key') || localStorage.getItem('devspace_user_gemini_key');
      if (stored && stored.trim().length > 10) {
        cachedUserGeminiKey = stored.trim();
        return cachedUserGeminiKey;
      }
    } catch (e) {
      console.warn('Failed to access stored Gemini key:', e);
    }
    return null;
  }

  public getGeminiCredentialState(): UserAICredentialState {
    const key = this.getStoredUserGeminiKey();
    if (typeof window === 'undefined') {
      return {
        provider: 'gemini',
        credentialConfigured: false,
        validationStatus: 'UNCONFIGURED',
        availableCapabilities: [],
        isUserOwned: true
      };
    }

    const valStatusRaw = localStorage.getItem('devspace_gemini_val_status') as UserAICredentialState['validationStatus'] | null;
    const lastValidated = Number(localStorage.getItem('devspace_gemini_last_validated')) || undefined;
    const lastError = localStorage.getItem('devspace_gemini_last_error') || undefined;

    const hasKey = !!key && key.trim().length > 10;
    const validationStatus = hasKey ? (valStatusRaw || 'CONNECTED') : 'UNCONFIGURED';

    let maskedKeyHint: string | undefined = undefined;
    if (key && key.length >= 8) {
      maskedKeyHint = `${key.slice(0, 4)}...${key.slice(-4)}`;
    }

    return {
      provider: 'gemini',
      credentialConfigured: hasKey,
      validationStatus,
      lastValidated,
      lastError,
      maskedKeyHint,
      availableCapabilities: validationStatus === 'CONNECTED' ? ['google_search_grounding', 'gemini_advanced_reasoning', 'gemini_code_generation'] : [],
      isUserOwned: true
    };
  }

  public async saveAndValidateUserGeminiKey(rawKey: string): Promise<{ success: boolean; error?: string; maskedKeyHint?: string }> {
    const cleanKey = (rawKey || '').trim();
    if (!cleanKey || cleanKey.length < 15) {
      return { success: false, error: 'Please enter a valid Gemini API key (typically starts with AIza...).' };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('devspace_gemini_val_status', 'VALIDATING');
    }

    try {
      const res = await fetch('/api/user/validate-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanKey })
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        cachedUserGeminiKey = cleanKey;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('devspace_user_gemini_key', cleanKey);
          localStorage.setItem('devspace_user_gemini_key', cleanKey);
          localStorage.setItem('devspace_gemini_val_status', 'CONNECTED');
          localStorage.setItem('devspace_gemini_last_validated', String(Date.now()));
          localStorage.removeItem('devspace_gemini_last_error');
          window.dispatchEvent(new CustomEvent('aether:credential-updated', { detail: { provider: 'gemini', status: 'CONNECTED' } }));
        }

        const masked = `${cleanKey.slice(0, 4)}...${cleanKey.slice(-4)}`;
        return { success: true, maskedKeyHint: masked };
      } else {
        const errorMsg = data.error || 'Authentication failed: Invalid Gemini API key or quota exceeded.';
        if (typeof window !== 'undefined') {
          localStorage.setItem('devspace_gemini_val_status', 'AUTHENTICATION_FAILED');
          localStorage.setItem('devspace_gemini_last_error', errorMsg);
          window.dispatchEvent(new CustomEvent('aether:credential-updated', { detail: { provider: 'gemini', status: 'AUTHENTICATION_FAILED', error: errorMsg } }));
        }
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error connecting to Gemini validation server.';
      if (typeof window !== 'undefined') {
        localStorage.setItem('devspace_gemini_val_status', 'AUTHENTICATION_FAILED');
        localStorage.setItem('devspace_gemini_last_error', errorMsg);
      }
      return { success: false, error: errorMsg };
    }
  }

  public removeUserGeminiKey() {
    cachedUserGeminiKey = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('devspace_user_gemini_key');
      localStorage.removeItem('devspace_user_gemini_key');
      localStorage.setItem('devspace_gemini_val_status', 'UNCONFIGURED');
      localStorage.removeItem('devspace_gemini_last_validated');
      localStorage.removeItem('devspace_gemini_last_error');
      window.dispatchEvent(new CustomEvent('aether:credential-updated', { detail: { provider: 'gemini', status: 'UNCONFIGURED' } }));
    }
  }

  // -------------------------------------------------------------
  // PENDING TASK LIFECYCLE (SURVIVES CREDENTIAL CONFIGURATION)
  // -------------------------------------------------------------
  public setPendingTask(task: Omit<PendingAetherTask, 'id' | 'createdAt'>) {
    const newTask: PendingAetherTask = {
      ...task,
      id: `pending-task-${Date.now()}`,
      createdAt: Date.now()
    };
    this.pendingTask = newTask;
    if (typeof window !== 'undefined') {
      localStorage.setItem('aether_pending_task', JSON.stringify(newTask));
      window.dispatchEvent(new CustomEvent('aether:pending-task-updated', { detail: newTask }));
    }
  }

  public getPendingTask(): PendingAetherTask | null {
    if (this.pendingTask) return this.pendingTask;
    this.loadPendingTask();
    return this.pendingTask;
  }

  public clearPendingTask() {
    this.pendingTask = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aether_pending_task');
      window.dispatchEvent(new CustomEvent('aether:pending-task-updated', { detail: null }));
    }
  }

  private loadPendingTask() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('aether_pending_task');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only retain tasks from the last 15 minutes
        if (Date.now() - parsed.createdAt < 15 * 60 * 1000) {
          this.pendingTask = parsed;
        } else {
          localStorage.removeItem('aether_pending_task');
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

export const aetherCapabilityRegistry = new AetherCapabilityRegistry();
