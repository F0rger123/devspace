/**
 * Canonical Aether / E3AI Voice State Engine
 * Single authoritative source of truth for voice interaction modes across:
 * - Web App
 * - Windows Desktop App
 * - Dynamic Island / The Bar (Electron Overlay & Web Component)
 * - Kinetic HUD & Floating Controllers
 */

export type AetherVoiceMode = 
  | 'off'              // Fully Off: All microphone listeners, background wake-word, and TTS suspended
  | 'muted'            // Muted: Session / conversational context preserved, but microphone capture is muted
  | 'wake_word'        // Waiting for Keyword: Background listener waiting for "Hey Aether"
  | 'listening'        // On / Open Listening: Continuous open mic stream for conversation
  | 'context';         // Context Mode: Reads active workspace / screen context to answer questions

export interface VoiceStateSnapshot {
  mode: AetherVoiceMode;
  isMuted: boolean;
  isWakeWordActive: boolean;
  isOpenMicActive: boolean;
  isContextActive: boolean;
  lastUpdated: number;
}

const STORAGE_KEY = 'devspace_aether_voice_mode_v2';
const CHANNEL_NAME = 'devspace_aether_voice_broadcast';

class AetherVoiceStateEngine {
  private currentMode: AetherVoiceMode = 'wake_word';
  private listeners: Set<(state: VoiceStateSnapshot) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load initial persisted mode
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['off', 'muted', 'wake_word', 'listening', 'context'].includes(saved)) {
        this.currentMode = saved as AetherVoiceMode;
      } else {
        // Fallback checks from legacy keys
        const legacyBarMode = localStorage.getItem('devspace_active_aether_mode');
        const legacyMuted = localStorage.getItem('isAetherMuted') === 'true';
        if (legacyMuted) {
          this.currentMode = 'muted';
        } else if (legacyBarMode === 'OFF') {
          this.currentMode = 'off';
        } else if (legacyBarMode === 'LISTENING') {
          this.currentMode = 'listening';
        } else if (legacyBarMode === 'CONTEXT') {
          this.currentMode = 'context';
        } else {
          this.currentMode = 'wake_word';
        }
      }
    } catch {
      this.currentMode = 'wake_word';
    }

    // Initialize cross-tab/cross-window BroadcastChannel for instant sync between Dynamic Island & Main Window
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.mode && event.data.mode !== this.currentMode) {
            this.setModeInternal(event.data.mode, false);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in this runtime:', e);
    }

    // Storage event fallback for cross-window sync
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (['off', 'muted', 'wake_word', 'listening', 'context'].includes(e.newValue)) {
          this.setModeInternal(e.newValue as AetherVoiceMode, false);
        }
      }
    });

    // Custom window events
    window.addEventListener('devspace:aether-set-voice-mode', (e: Event) => {
      const customEvent = e as CustomEvent<{ mode: AetherVoiceMode }>;
      if (customEvent.detail?.mode) {
        this.setMode(customEvent.detail.mode);
      }
    });
  }

  public getMode(): AetherVoiceMode {
    return this.currentMode;
  }

  public getSnapshot = (): VoiceStateSnapshot => {
    return {
      mode: this.currentMode,
      isMuted: this.currentMode === 'muted',
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

  public setMode(newMode: AetherVoiceMode) {
    this.setModeInternal(newMode, true);
  }

  private setModeInternal(newMode: AetherVoiceMode, shouldBroadcast = true) {
    this.currentMode = newMode;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newMode);
        localStorage.setItem('isAetherMuted', newMode === 'muted' ? 'true' : 'false');
        localStorage.setItem('aether_wake_word_enabled', (newMode === 'wake_word' || newMode === 'listening') ? 'true' : 'false');
        
        // Map to legacy mode string for backward compatibility
        const legacyMap: Record<AetherVoiceMode, string> = {
          off: 'OFF',
          muted: 'OFF',
          wake_word: 'WAITING FOR KEYWORD',
          listening: 'LISTENING',
          context: 'CONTEXT',
        };
        localStorage.setItem('devspace_active_aether_mode', legacyMap[newMode]);
      } catch (e) {}

      // Dispatch DOM events for components listening locally
      window.dispatchEvent(
        new CustomEvent('devspace:aether-voice-mode-changed', {
          detail: { mode: newMode, legacyMode: this.getLegacyModeName(newMode) },
        })
      );
      window.dispatchEvent(new CustomEvent('aether-mute-sync'));

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

  public toLegacyMode(modeOrSnapshot: AetherVoiceMode | VoiceStateSnapshot): 'OFF' | 'MUTED' | 'WAITING FOR KEYWORD' | 'LISTENING' | 'CONTEXT' {
    const mode = typeof modeOrSnapshot === 'string' ? modeOrSnapshot : modeOrSnapshot?.mode;
    switch (mode) {
      case 'off':
        return 'OFF';
      case 'muted':
        return 'MUTED';
      case 'wake_word':
        return 'WAITING FOR KEYWORD';
      case 'listening':
        return 'LISTENING';
      case 'context':
        return 'CONTEXT';
      default:
        return 'WAITING FOR KEYWORD';
    }
  }

  public getLegacyModeName(mode: AetherVoiceMode): string {
    return this.toLegacyMode(mode);
  }

  public fromLegacyMode(legacy: string): AetherVoiceMode {
    const upper = (legacy || '').toUpperCase();
    if (upper === 'OFF') return 'off';
    if (upper === 'MUTED') return 'muted';
    if (upper.includes('KEYWORD') || upper.includes('WAKE')) return 'wake_word';
    if (upper.includes('LISTEN')) return 'listening';
    if (upper.includes('CONTEXT')) return 'context';
    if (upper.includes('ALWAYS ON') || upper.includes('FOCUS')) return 'wake_word';
    return 'wake_word';
  }
}

export const aetherVoiceEngine = new AetherVoiceStateEngine();
