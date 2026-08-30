// Unified Voice Registry and Voice Capability Engine for Aether

export interface VoiceProfile {
  id: string;
  name: string;
  provider: 'WebSpeech' | 'Electron OS' | 'Aether Cloud' | 'Local OS';
  lang: string;
  localeName: string;
  genderStyle: 'Male' | 'Female' | 'Neutral';
  quality: 'Ultra HD' | 'High' | 'Standard';
  category: 'Available Now' | 'Available After Installing' | 'Cloud Voice' | 'Unavailable';
  isDefault?: boolean;
  isLocal: boolean;
  isFree: boolean;
  estimatedLatencyMs: number;
  streamingSupport: boolean;
  nativeVoice?: SpeechSynthesisVoice;
}

export interface UserIdentityPreferences {
  preferredName: string; // "What should Aether call you?" e.g., "Developer", "Captain", "Alex"
  voiceId: string;
  speechRate: number;
  speechPitch: number;
  responseStyle: 'concise' | 'balanced' | 'detailed' | 'technical';
  wakeWord: string;
}

const DEFAULT_IDENTITY: UserIdentityPreferences = {
  preferredName: 'Developer',
  voiceId: '',
  speechRate: 1.0,
  speechPitch: 1.0,
  responseStyle: 'balanced',
  wakeWord: 'hey aether',
};

// Curated catalog of high quality voices to display with rich metadata
const CURATED_VOICES_CATALOG: Omit<VoiceProfile, 'nativeVoice'>[] = [
  {
    id: 'uk-male-daniel',
    name: 'Daniel (UK English Male - Default Aether)',
    provider: 'WebSpeech',
    lang: 'en-GB',
    localeName: 'United Kingdom',
    genderStyle: 'Male',
    quality: 'Ultra HD',
    category: 'Available Now',
    isDefault: true,
    isLocal: true,
    isFree: true,
    estimatedLatencyMs: 15,
    streamingSupport: true,
  },
  {
    id: 'uk-male-oliver',
    name: 'Oliver (UK Natural Male)',
    provider: 'WebSpeech',
    lang: 'en-GB',
    localeName: 'United Kingdom',
    genderStyle: 'Male',
    quality: 'High',
    category: 'Available Now',
    isLocal: true,
    isFree: true,
    estimatedLatencyMs: 20,
    streamingSupport: true,
  },
  {
    id: 'us-male-alex',
    name: 'Alex (US Natural Male)',
    provider: 'WebSpeech',
    lang: 'en-US',
    localeName: 'United States',
    genderStyle: 'Male',
    quality: 'High',
    category: 'Available Now',
    isLocal: true,
    isFree: true,
    estimatedLatencyMs: 20,
    streamingSupport: true,
  },
  {
    id: 'us-female-samantha',
    name: 'Samantha (US Expressive Female)',
    provider: 'WebSpeech',
    lang: 'en-US',
    localeName: 'United States',
    genderStyle: 'Female',
    quality: 'High',
    category: 'Available Now',
    isLocal: true,
    isFree: true,
    estimatedLatencyMs: 20,
    streamingSupport: true,
  },
  {
    id: 'uk-female-serena',
    name: 'Serena (UK Crisp Female)',
    provider: 'WebSpeech',
    lang: 'en-GB',
    localeName: 'United Kingdom',
    genderStyle: 'Female',
    quality: 'High',
    category: 'Available Now',
    isLocal: true,
    isFree: true,
    estimatedLatencyMs: 20,
    streamingSupport: true,
  },
  {
    id: 'regional-male-deep',
    name: 'Kofi / Aaron (Deep Warm Male - Regional)',
    provider: 'Aether Cloud',
    lang: 'en-US',
    localeName: 'Global Regional',
    genderStyle: 'Male',
    quality: 'Ultra HD',
    category: 'Available Now',
    isLocal: false,
    isFree: true,
    estimatedLatencyMs: 60,
    streamingSupport: true,
  },
  {
    id: 'regional-female-expressive',
    name: 'Aya / Amara (Warm Expressive Female - Regional)',
    provider: 'Aether Cloud',
    lang: 'en-US',
    localeName: 'Global Regional',
    genderStyle: 'Female',
    quality: 'Ultra HD',
    category: 'Available Now',
    isLocal: false,
    isFree: true,
    estimatedLatencyMs: 60,
    streamingSupport: true,
  },
  {
    id: 'local-piper-uk-male',
    name: 'Piper UK Male On-Device TTS Model',
    provider: 'Local OS',
    lang: 'en-GB',
    localeName: 'United Kingdom',
    genderStyle: 'Male',
    quality: 'Ultra HD',
    category: 'Available After Installing',
    isLocal: true,
    isFree: true,
    estimatedLatencyMs: 35,
    streamingSupport: true,
  },
  {
    id: 'cloud-elevenlabs-studio-male',
    name: 'Aether Studio Neural HD UK Male',
    provider: 'Aether Cloud',
    lang: 'en-GB',
    localeName: 'United Kingdom',
    genderStyle: 'Male',
    quality: 'Ultra HD',
    category: 'Cloud Voice',
    isLocal: false,
    isFree: true,
    estimatedLatencyMs: 110,
    streamingSupport: true,
  },
];

class AetherVoiceRegistry {
  private userPreferences: UserIdentityPreferences = { ...DEFAULT_IDENTITY };

  constructor() {
    this.loadPreferences();
  }

  public loadPreferences(): UserIdentityPreferences {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('aether_user_identity_prefs');
        if (stored) {
          this.userPreferences = { ...DEFAULT_IDENTITY, ...JSON.parse(stored) };
        }
      }
    } catch (e) {
      console.warn('Failed to load user identity preferences:', e);
    }
    return this.userPreferences;
  }

  public savePreferences(updates: Partial<UserIdentityPreferences>): UserIdentityPreferences {
    this.userPreferences = { ...this.userPreferences, ...updates };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('aether_user_identity_prefs', JSON.stringify(this.userPreferences));
        // Also persist user name in standard preference key
        if (updates.preferredName) {
          localStorage.setItem('aether_user_preferred_name', updates.preferredName);
        }
      }
    } catch (e) {
      console.error('Failed to save user identity preferences:', e);
    }
    return this.userPreferences;
  }

  public getPreferredName(): string {
    if (typeof window !== 'undefined') {
      const direct = localStorage.getItem('aether_user_preferred_name');
      if (direct && direct.trim()) return direct.trim();
    }
    return this.userPreferences.preferredName || 'Developer';
  }

  public setPreferredName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.savePreferences({ preferredName: trimmed });
  }

  public getPreferences(): UserIdentityPreferences {
    return this.userPreferences;
  }

  public getDiscoveredVoices(): VoiceProfile[] {
    const profiles: VoiceProfile[] = [];

    let nativeVoices: SpeechSynthesisVoice[] = [];
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      nativeVoices = window.speechSynthesis.getVoices();
    }

    // 1. Map native browser/OS voices
    nativeVoices.forEach((v) => {
      const isUk = v.lang.startsWith('en-GB') || v.lang.includes('UK');
      const isMale = v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('george') || v.name.toLowerCase().includes('oliver') || v.name.toLowerCase().includes('arthur');
      const isFemale = v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria') || v.name.toLowerCase().includes('serena') || v.name.toLowerCase().includes('kate');

      profiles.push({
        id: `native-${v.name}`,
        name: v.name,
        provider: 'WebSpeech',
        lang: v.lang,
        localeName: v.lang.includes('GB') ? 'United Kingdom' : v.lang.includes('US') ? 'United States' : v.lang,
        genderStyle: isMale ? 'Male' : isFemale ? 'Female' : 'Neutral',
        quality: v.localService ? 'High' : 'Standard',
        category: 'Available Now',
        isDefault: isUk && isMale,
        isLocal: v.localService,
        isFree: true,
        estimatedLatencyMs: 15,
        streamingSupport: true,
        nativeVoice: v,
      });
    });

    // 2. Append catalog items that aren't native duplicates
    CURATED_VOICES_CATALOG.forEach((catItem) => {
      const exists = profiles.some((p) => p.name.toLowerCase().includes(catItem.name.toLowerCase().split(' ')[0]));
      if (!exists) {
        profiles.push({
          ...catItem,
        });
      }
    });

    return profiles;
  }

  public getBestUKMaleVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // First priority: UK English Male voice
    const ukMale = voices.find(
      (v) =>
        (v.lang === 'en-GB' || v.lang.startsWith('en-GB')) &&
        (v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('oliver') ||
          v.name.toLowerCase().includes('arthur'))
    );
    if (ukMale) return ukMale;

    // Second priority: Any UK English voice
    const anyUk = voices.find((v) => v.lang === 'en-GB' || v.lang.startsWith('en-GB'));
    if (anyUk) return anyUk;

    // Third priority: Any English Male voice
    const englishMale = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('david'))
    );
    if (englishMale) return englishMale;

    // Fallback: First English voice
    const anyEnglish = voices.find((v) => v.lang.startsWith('en'));
    return anyEnglish || voices[0] || null;
  }

  public testVoice(
    voiceNameOrId: string,
    sampleText: string = 'Hello! I am Aether. UK English male voice is active and optimized for your workspace.',
    rate: number = 1.0,
    pitch: number = 1.0
  ): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis unavailable.');
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (voiceNameOrId) {
      selectedVoice =
        voices.find((v) => v.name === voiceNameOrId || `native-${v.name}` === voiceNameOrId) || null;
    }

    if (!selectedVoice) {
      selectedVoice = this.getBestUKMaleVoice();
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }

  public speakText(text: string): boolean {
    return this.testVoice('', text);
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const aetherVoiceRegistry = new AetherVoiceRegistry();
