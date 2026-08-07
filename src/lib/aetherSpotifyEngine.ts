export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  coverUrl?: string;
}

export interface PlaylistCategory {
  id: string;
  name: string;
  type: 'focus' | 'theme' | 'deep_work' | 'break' | 'project' | 'liked' | 'recent';
  tracks: PlaylistTrack[];
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: 'Headphones' | 'Speaker' | 'Computer' | 'Mobile';
  isActive: boolean;
  volumePercent: number;
}

export interface SpotifyPlaybackState {
  isAuthenticated: boolean;
  userProfileName: string;
  isPlaying: boolean;
  currentCategory: PlaylistCategory | null;
  currentTrack: PlaylistTrack | null;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'track' | 'context';
  isCrossfadeEnabled: boolean;
  crossfadeDurationSec: number;
  queue: PlaylistTrack[];
  devices: SpotifyDevice[];
  activeDeviceId: string;
  favoritePlaylists: string[];
  smartAudioMode: 'none' | 'focus' | 'deep_work' | 'meeting' | 'review' | 'release';
  fadeOnSpeech: boolean;
  autoStopAfterFocus: boolean;
}

class AetherSpotifyEngine {
  private state: SpotifyPlaybackState = {
    isAuthenticated: true,
    userProfileName: 'Aether Master User',
    isPlaying: false,
    currentCategory: null,
    currentTrack: null,
    volume: 80,
    shuffle: true,
    repeat: 'context',
    isCrossfadeEnabled: true,
    crossfadeDurationSec: 4,
    queue: [],
    devices: [
      { id: 'dev-1', name: 'DevSpace Studio Headphones', type: 'Headphones', isActive: true, volumePercent: 80 },
      { id: 'dev-2', name: 'MacBook Pro Built-in Speakers', type: 'Computer', isActive: false, volumePercent: 70 },
      { id: 'dev-3', name: 'Aether Hi-Fi Monitor', type: 'Speaker', isActive: false, volumePercent: 85 },
    ],
    activeDeviceId: 'dev-1',
    favoritePlaylists: ['Deep Work Ambient', 'Interstellar Soundtracks', 'Zen Focus Flow', 'Debugging Cyberpunk Synth'],
    smartAudioMode: 'none',
    fadeOnSpeech: true,
    autoStopAfterFocus: true,
  };

  private categories: PlaylistCategory[] = [
    {
      id: 'pl-focus',
      name: 'Focus Flow Synthwave',
      type: 'focus',
      tracks: [
        { id: 't1', title: 'Solaris Drift', artist: 'Aether Wave', album: 'Cosmic Coding', durationMs: 240000 },
        { id: 't2', title: 'Quantum Focus', artist: 'Zen Pulse', album: 'HyperSpace', durationMs: 310000 },
        { id: 't3', title: 'Neon Horizon', artist: 'Synth Lab', album: 'Cyberflow', durationMs: 205000 },
      ],
    },
    {
      id: 'pl-interstellar',
      name: 'Interstellar Cinematic',
      type: 'theme',
      tracks: [
        { id: 't4', title: 'Cornfield Chase', artist: 'Hans Zimmer', album: 'Interstellar OST', durationMs: 127000 },
        { id: 't5', title: 'No Time for Caution', artist: 'Hans Zimmer', album: 'Interstellar OST', durationMs: 246000 },
        { id: 't6', title: 'S.T.A.Y.', artist: 'Hans Zimmer', album: 'Interstellar OST', durationMs: 383000 },
      ],
    },
    {
      id: 'pl-deepwork',
      name: 'Deep Work Binaural Focus',
      type: 'deep_work',
      tracks: [
        { id: 't7', title: 'Alpha Wave 14Hz', artist: 'Brainwave Lab', album: 'Focus Matrix', durationMs: 420000 },
        { id: 't8', title: 'Deep Gamma Flow', artist: 'NeuroSound', album: 'Cognitive Flow', durationMs: 500000 },
      ],
    },
    {
      id: 'pl-debugging',
      name: 'Music for Debugging & Heavy Logic',
      type: 'project',
      tracks: [
        { id: 't9', title: 'Zero Type Errors', artist: 'Code Runner', album: 'Clean Build', durationMs: 210000 },
        { id: 't10', title: 'AST Parser Pulse', artist: 'Aether Synth', album: 'Compiler Dreams', durationMs: 280000 },
      ],
    },
    {
      id: 'pl-break',
      name: 'Chill Lofi Break',
      type: 'break',
      tracks: [
        { id: 't11', title: 'Coffee & Code', artist: 'Lofi Beats', album: 'Dev Chill', durationMs: 180000 },
        { id: 't12', title: 'Rainy Night In DevSpace', artist: 'Chillhop Dev', album: 'Night Shift', durationMs: 195000 },
      ],
    },
    {
      id: 'pl-liked',
      name: 'Liked Songs Collection',
      type: 'liked',
      tracks: [
        { id: 't13', title: 'Time', artist: 'Hans Zimmer', album: 'Inception OST', durationMs: 275000 },
        { id: 't14', title: 'Resonance', artist: 'HOME', album: 'Odyssey', durationMs: 212000 },
      ],
    },
  ];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const saved = localStorage.getItem('aether_spotify_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {}
  }

  private saveState() {
    try {
      localStorage.setItem('aether_spotify_state', JSON.stringify(this.state));
    } catch (e) {}
  }

  public authenticateOAuth(): { success: boolean; message: string; user: string } {
    this.state.isAuthenticated = true;
    this.saveState();
    this.notifyStateChange();
    return {
      success: true,
      message: `Successfully connected Spotify account (${this.state.userProfileName}) via OAuth 2.0.`,
      user: this.state.userProfileName,
    };
  }

  public playPlaylist(query: string): { success: boolean; message: string; playlistName: string } {
    const lower = query.toLowerCase();
    let target = this.categories.find(c => c.name.toLowerCase().includes(lower) || c.type.toLowerCase().includes(lower));
    if (!target) {
      if (lower.includes('interstellar')) {
        target = this.categories.find(c => c.id === 'pl-interstellar');
      } else if (lower.includes('debug') || lower.includes('calm') || lower.includes('chill')) {
        target = this.categories.find(c => c.id === 'pl-debugging') || this.categories.find(c => c.id === 'pl-break');
      } else if (lower.includes('liked')) {
        target = this.categories.find(c => c.id === 'pl-liked');
      } else {
        target = this.categories[0];
      }
    }

    if (!target) {
      return { success: false, message: 'No matching Spotify playlist found.', playlistName: '' };
    }

    this.state.currentCategory = target;
    this.state.currentTrack = target.tracks[0] || null;
    this.state.queue = target.tracks.slice(1);
    this.state.isPlaying = true;
    this.saveState();
    this.notifyStateChange();

    return {
      success: true,
      message: `Playing "${target.name}" on Spotify Focus Engine (${this.getActiveDeviceName()}). Track: ${this.state.currentTrack?.title || 'Flow'} by ${this.state.currentTrack?.artist}`,
      playlistName: target.name,
    };
  }

  public pause(): { success: boolean; message: string } {
    this.state.isPlaying = false;
    this.saveState();
    this.notifyStateChange();
    return { success: true, message: 'Spotify audio paused.' };
  }

  public resume(): { success: boolean; message: string } {
    if (!this.state.currentCategory) {
      return this.playPlaylist('focus');
    }
    this.state.isPlaying = true;
    this.saveState();
    this.notifyStateChange();
    return { success: true, message: `Resumed playback for "${this.state.currentCategory.name}".` };
  }

  public skip(): { success: boolean; message: string } {
    if (!this.state.currentCategory || this.state.currentCategory.tracks.length <= 1) {
      return { success: true, message: 'Skipped to next track in focus queue.' };
    }
    const tracks = this.state.currentCategory.tracks;
    const currentIdx = tracks.findIndex(t => t.id === this.state.currentTrack?.id);
    const nextTrack = tracks[(currentIdx + 1) % tracks.length];
    this.state.currentTrack = nextTrack;
    this.state.isPlaying = true;
    this.saveState();
    this.notifyStateChange();
    return { success: true, message: `Skipped to "${nextTrack.title}" by ${nextTrack.artist}.` };
  }

  public setVolume(volumePercent: number): { success: boolean; message: string; volume: number } {
    const clamped = Math.max(0, Math.min(100, volumePercent));
    this.state.volume = clamped;
    this.saveState();
    this.notifyStateChange();
    return { success: true, message: `Spotify volume set to ${clamped}%.`, volume: clamped };
  }

  public setDevice(deviceNameOrType: string): { success: boolean; message: string } {
    const lower = deviceNameOrType.toLowerCase();
    const dev = this.state.devices.find(d => d.name.toLowerCase().includes(lower) || d.type.toLowerCase().includes(lower));
    if (!dev) {
      return { success: false, message: `Device "${deviceNameOrType}" not found in active Spotify devices.` };
    }
    this.state.devices.forEach(d => d.isActive = (d.id === dev.id));
    this.state.activeDeviceId = dev.id;
    this.saveState();
    this.notifyStateChange();
    return { success: true, message: `Switched Spotify playback to "${dev.name}".` };
  }

  public toggleShuffle(): { success: boolean; shuffle: boolean } {
    this.state.shuffle = !this.state.shuffle;
    this.saveState();
    this.notifyStateChange();
    return { success: true, shuffle: this.state.shuffle };
  }

  public handleSmartFocusTrigger(trigger: 'focus_start' | 'meeting_start' | 'deep_work' | 'review' | 'release' | 'speech'): { success: boolean; message: string } {
    if (trigger === 'focus_start') {
      this.state.smartAudioMode = 'focus';
      return this.playPlaylist('focus');
    } else if (trigger === 'deep_work') {
      this.state.smartAudioMode = 'deep_work';
      return this.playPlaylist('deepwork');
    } else if (trigger === 'meeting_start') {
      this.state.smartAudioMode = 'meeting';
      return this.pause();
    } else if (trigger === 'review') {
      this.state.smartAudioMode = 'review';
      return this.playPlaylist('break');
    } else if (trigger === 'speech' && this.state.fadeOnSpeech && this.state.isPlaying) {
      this.state.volume = Math.max(15, this.state.volume - 40);
      this.notifyStateChange();
      return { success: true, message: 'Ducked audio volume while Aether is speaking.' };
    }
    return { success: true, message: `Trigger "${trigger}" applied.` };
  }

  public handleNaturalLanguageCommand(text: string): { handled: boolean; message: string } {
    const lower = text.toLowerCase().trim();

    if (lower.includes('play my focus playlist') || lower === 'play focus music' || lower.includes('start focus playlist')) {
      const res = this.playPlaylist('focus');
      return { handled: true, message: res.message };
    }

    if (lower.includes('play interstellar') || lower.includes('play cinematic')) {
      const res = this.playPlaylist('interstellar');
      return { handled: true, message: res.message };
    }

    if (lower.includes('play music for debugging') || lower.includes('play debugging music')) {
      const res = this.playPlaylist('debugging');
      return { handled: true, message: res.message };
    }

    if (lower.includes('play something calmer') || lower.includes('play lofi') || lower.includes('play chill')) {
      const res = this.playPlaylist('break');
      return { handled: true, message: res.message };
    }

    if (lower === 'pause' || lower === 'pause music' || lower === 'stop music') {
      const res = this.pause();
      return { handled: true, message: res.message };
    }

    if (lower === 'resume' || lower === 'resume music' || lower === 'unpause') {
      const res = this.resume();
      return { handled: true, message: res.message };
    }

    if (lower === 'skip' || lower === 'next track' || lower === 'skip track') {
      const res = this.skip();
      return { handled: true, message: res.message };
    }

    if (lower.includes('turn it down') || lower.includes('lower volume')) {
      const res = this.setVolume(this.state.volume - 25);
      return { handled: true, message: res.message };
    }

    if (lower.includes('turn it up') || lower.includes('increase volume')) {
      const res = this.setVolume(this.state.volume + 25);
      return { handled: true, message: res.message };
    }

    if (lower.includes('switch to my headphones') || lower.includes('switch to headphones')) {
      const res = this.setDevice('headphones');
      return { handled: true, message: res.message };
    }

    if (lower.includes('fade music when aether speaks')) {
      this.state.fadeOnSpeech = true;
      this.saveState();
      return { handled: true, message: 'Enabled automatic music ducking/fading when Aether speaks.' };
    }

    if (lower.includes('stop music after my focus session') || lower.includes('stop music after focus')) {
      this.state.autoStopAfterFocus = true;
      this.saveState();
      return { handled: true, message: 'Enabled automatic playback stop when focus timer expires.' };
    }

    return { handled: false, message: '' };
  }

  public getActiveDeviceName(): string {
    const dev = this.state.devices.find(d => d.id === this.state.activeDeviceId);
    return dev ? dev.name : 'Primary Speaker';
  }

  public getCategories(): PlaylistCategory[] {
    return [...this.categories];
  }

  public getState(): SpotifyPlaybackState {
    return { ...this.state };
  }

  private notifyStateChange() {
    window.dispatchEvent(new CustomEvent('aether_spotify_state_changed', { detail: this.state }));
  }
}

export const aetherSpotify = new AetherSpotifyEngine();

