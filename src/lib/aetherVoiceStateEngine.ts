/**
 * Canonical Aether Voice State Engine
 * Single authoritative source of truth for voice interaction modes across:
 * - Web App
 * - Windows / Mac Desktop App
 * - Dynamic Island / The Bar (Electron Overlay & Web Component)
 * - Kinetic HUD & Floating Controllers
 * 
 * EXACT 4 MODES:
 * 1. 'off'        — AETHER AI OFF / MUTED
 * 2. 'wake_word'  — WAITING FOR KEYWORD
 * 3. 'listening'  — AETHER AI ON / OPEN
 * 4. 'context'    — CONTEXT MODE
 */

export type AetherVoiceMode = 
  | 'off'              // Fully Off / Muted: All microphones & background listeners suspended
  | 'wake_word'        // Waiting for Keyword: Background listener waiting for "Hey Aether"
  | 'listening'        // On / Open Listening: Continuous open microphone for conversation
  | 'context';         // Context Mode: Reads active workspace / screen context to assist

export interface VoiceStateSnapshot {
  mode: AetherVoiceMode;
  isOff: boolean;
  isWakeWordActive: boolean;
  isOpenMicActive: boolean;
  isContextActive: boolean;
  lastUpdated: number;
}

const STORAGE_KEY = 'devspace_aether_voice_mode_v2';
const ACCOUNT_PREF_KEY = 'devspace_account_aether_mode';
const CHANNEL_NAME = 'devspace_aether_voice_broadcast';

export const AETHER_MODES_CYCLE: AetherVoiceMode[] = ['off', 'wake_word', 'listening', 'context'];

export const AETHER_MODE_LABELS: Record<AetherVoiceMode, string> = {
  off: 'Off',
  wake_word: 'Waiting for Keyword',
  listening: 'Listening / Aether On',
  context: 'Context Mode',
};

class AetherVoiceStateEngine {
  private currentMode: AetherVoiceMode = 'off';
  private listeners: Set<(state: VoiceStateSnapshot) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isSyncingFromRemote = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load initial persisted mode with comprehensive migration from legacy keys
    this.currentMode = this.loadInitialMode();

    // Initialize cross-tab/cross-window BroadcastChannel for instant sync
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.mode && event.data.mode !== this.currentMode) {
            this.setModeInternal(this.migrateMode(event.data.mode), false, false);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this runtime:', e);
    }

    // Storage event fallback for cross-window / cross-tab sync
    window.addEventListener('storage', (e) => {
      if ((e.key === STORAGE_KEY || e.key === ACCOUNT_PREF_KEY) && e.newValue) {
        const migrated = this.migrateMode(e.newValue);
        if (migrated !== this.currentMode) {
          this.setModeInternal(migrated, false, false);
        }
      }
    });

    // Custom window events for internal components
    window.addEventListener('devspace:aether-set-voice-mode', (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: string }>;
      if (customEvent.detail?.mode) {
        this.setMode(this.migrateMode(customEvent.detail.mode));
      }
    });

    // Remote account sync listener (from Firestore / account profile updates)
    window.addEventListener('devspace:aether-account-preference-sync', (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: string }>;
      if (customEvent.detail?.mode) {
        const migrated = this.migrateMode(customEvent.detail.mode);
        if (migrated !== this.currentMode) {
          this.setModeInternal(migrated, true, false);
        }
      }
    });
  }

  private loadInitialMode(): AetherVoiceMode {
    try {
      // 1. Check account-level cached preference first
      const accountSaved = localStorage.getItem(ACCOUNT_PREF_KEY);
      if (accountSaved) {
        return this.migrateMode(accountSaved);
      }

      // 2. Check canonical v2 storage key
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return this.migrateMode(saved);
      }

      // 3. Check legacy storage keys
      const legacyProfile = localStorage.getItem('app_user_profile');
      if (legacyProfile) {
        try {
          const parsed = JSON.parse(legacyProfile);
          if (parsed.aetherVoiceMode) {
            return this.migrateMode(parsed.aetherVoiceMode);
          }
        } catch {}
      }

      const legacyBarMode = localStorage.getItem('devspace_active_aether_mode');
      if (legacyBarMode) {
        return this.migrateMode(legacyBarMode);
      }

      const legacyMuted = localStorage.getItem('isAetherMuted') === 'true';
      if (legacyMuted) return 'off';

      return 'off';
    } catch {
      return 'off';
    }
  }

  public migrateMode(raw: any): AetherVoiceMode {
    if (!raw || typeof raw !== 'string') return 'off';
    const clean = raw.trim().toLowerCase();
    const upper = raw.trim().toUpperCase();

    if (clean === 'off' || clean === 'muted' || upper === 'OFF' || upper === 'MUTED') {
      return 'off';
    }
    if (
      clean === 'wake_word' ||
      clean === 'wake' ||
      upper.includes('KEYWORD') ||
      upper.includes('WAKE')
    ) {
      return 'wake_word';
    }
    if (
      clean === 'listening' ||
      clean === 'intent_only' ||
      clean === 'always_on' ||
      upper.includes('LISTEN') ||
      upper.includes('INTENT') ||
      upper.includes('AETHER ON') ||
      upper.includes('ALWAYS ON')
    ) {
      return 'listening';
    }
    if (
      clean === 'context' ||
      clean === 'continuous' ||
      clean === 'focus' ||
      upper.includes('CONTEXT') ||
      upper.includes('CONTINUOUS') ||
      upper.includes('FOCUS')
    ) {
      return 'context';
    }
    return 'off';
  }

  public getMode(): AetherVoiceMode {
    return this.currentMode;
  }

  public getNextMode(): AetherVoiceMode {
    const currentIndex = AETHER_MODES_CYCLE.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % AETHER_MODES_CYCLE.length;
    return AETHER_MODES_CYCLE[nextIndex];
  }

  public cycleNextMode(): AetherVoiceMode {
    const next = this.getNextMode();
    this.setMode(next);
    return next;
  }

  public getSnapshot = (): VoiceStateSnapshot => {
    return {
      mode: this.currentMode,
      isOff: this.currentMode === 'off',
      isWakeWordActive: this.currentMode === 'wake_word',
      isOpenMicActive: this.currentMode === 'listening',
      isContextActive: this.currentMode === 'context',
      lastUpdated: Date.now(),
    };
  };

  public subscribe = (listener: (state: VoiceStateSnapshot) => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public setMode(newMode: AetherVoiceMode | string) {
    const canonicalMode = this.migrateMode(newMode);
    this.setModeInternal(canonicalMode, true, true);
  }

  private setModeInternal(newMode: AetherVoiceMode, shouldBroadcast = true, shouldSyncAccount = true) {
    this.currentMode = newMode;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newMode);
        localStorage.setItem(ACCOUNT_PREF_KEY, newMode);
        localStorage.setItem('isAetherMuted', newMode === 'off' ? 'true' : 'false');
        localStorage.setItem(
          'aether_wake_word_enabled',
          newMode === 'wake_word' || newMode === 'listening' ? 'true' : 'false'
        );
        localStorage.setItem('devspace_active_aether_mode', this.getLegacyModeName(newMode));
      } catch (e) {}

      // Dispatch DOM events for local components
      window.dispatchEvent(
        new CustomEvent('devspace:aether-voice-mode-changed', {
          detail: { mode: newMode, legacyMode: this.getLegacyModeName(newMode) },
        })
      );
      window.dispatchEvent(new CustomEvent('aether-mute-sync'));

      // Dispatch account sync event so DataProvider can push to Firestore
      if (shouldSyncAccount) {
        window.dispatchEvent(
          new CustomEvent('devspace:aether-persist-account-mode', {
            detail: { mode: newMode },
          })
        );
      }

      // Broadcast across Electron overlay windows and browser tabs
      if (shouldBroadcast) {
        try {
          this.broadcastChannel?.postMessage({ mode: newMode, timestamp: Date.now() });
        } catch {}

        // Electron IPC bridge if present
        try {
          const electronApi = (window as any).electronAPI;
          if (electronApi && electronApi.send) {
            electronApi.send('devspace:aether-voice-mode-sync', { mode: newMode });
          }
        } catch {}
      }
    }

    const snapshot = this.getSnapshot();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('Error in voice state listener:', err);
      }
    });
  }

  public toLegacyMode(
    modeOrSnapshot: AetherVoiceMode | VoiceStateSnapshot
  ): 'OFF' | 'WAITING FOR KEYWORD' | 'LISTENING' | 'CONTEXT' {
    const mode = typeof modeOrSnapshot === 'string' ? modeOrSnapshot : modeOrSnapshot?.mode;
    switch (mode) {
      case 'off':
        return 'OFF';
      case 'wake_word':
        return 'WAITING FOR KEYWORD';
      case 'listening':
        return 'LISTENING';
      case 'context':
        return 'CONTEXT';
      default:
        return 'OFF';
    }
  }

  public getLegacyModeName(mode: AetherVoiceMode): string {
    return this.toLegacyMode(mode);
  }

  public fromLegacyMode(legacy: string): AetherVoiceMode {
    return this.migrateMode(legacy);
  }
}

export const aetherVoiceEngine = new AetherVoiceStateEngine();
