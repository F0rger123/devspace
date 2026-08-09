import { useSyncExternalStore } from 'react';

export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  coverUrl?: string;
  uri?: string;
}

export interface PlaylistCategory {
  id: string;
  name: string;
  type: 'focus' | 'theme' | 'deep_work' | 'break' | 'project' | 'liked' | 'recent';
  tracks: PlaylistTrack[];
  uri?: string;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: 'Headphones' | 'Speaker' | 'Computer' | 'Mobile';
  isActive: boolean;
  volumePercent: number;
}

export interface SpotifyTestResult {
  currentUser: 'working' | 'failed' | 'unavailable';
  currentPlayback: 'working' | 'failed' | 'unavailable';
  devices: 'working' | 'failed' | 'unavailable';
  play: 'working' | 'failed' | 'unavailable';
  pause: 'working' | 'failed' | 'unavailable';
  next: 'working' | 'failed' | 'unavailable';
  previous: 'working' | 'failed' | 'unavailable';
  seek: 'working' | 'failed' | 'unavailable';
  volume: 'working' | 'failed' | 'unavailable';
  shuffle: 'working' | 'failed' | 'unavailable';
  repeat: 'working' | 'failed' | 'unavailable';
  errorMessage?: string;
  recommendedFix?: string;
}

export interface SpotifyPlaybackState {
  isAuthenticated: boolean;
  userProfileName: string;
  userEmail: string;
  isPlaying: boolean;
  currentCategory: PlaylistCategory | null;
  currentTrack: PlaylistTrack | null;
  progressMs: number;
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
  clientId: string;
  errorMessage?: string;
  recommendedFix?: string;
  noActiveDeviceWarning?: boolean;
  testResult?: SpotifyTestResult;
}

export const DEFAULT_SPOTIFY_STATE: SpotifyPlaybackState = {
  isAuthenticated: false,
  userProfileName: '',
  userEmail: '',
  isPlaying: false,
  currentCategory: null,
  currentTrack: null,
  progressMs: 0,
  volume: 80,
  shuffle: false,
  repeat: 'off',
  isCrossfadeEnabled: true,
  crossfadeDurationSec: 4,
  queue: [],
  devices: [],
  activeDeviceId: '',
  favoritePlaylists: [],
  smartAudioMode: 'none',
  fadeOnSpeech: true,
  autoStopAfterFocus: true,
  clientId: '',
};

// PKCE Helper Functions
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = typeof window !== 'undefined' && window.crypto 
    ? window.crypto.getRandomValues(new Uint8Array(length))
    : new Uint8Array(length).map(() => Math.floor(Math.random() * 256));
  return Array.from(values).reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a: ArrayBuffer): string {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a) as any))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

class AetherSpotifyEngine {
  private state: SpotifyPlaybackState;
  private accessToken: string | null = null;
  private refreshTokenVal: string | null = null;
  private tokenExpiry: number = 0;
  private pollInterval: any = null;

  constructor() {
    const storedClientId = typeof localStorage !== 'undefined' ? localStorage.getItem('aether_spotify_client_id') || '' : '';
    const storedAccessToken = typeof localStorage !== 'undefined' ? localStorage.getItem('aether_spotify_access_token') : null;
    const storedRefreshToken = typeof localStorage !== 'undefined' ? localStorage.getItem('aether_spotify_refresh_token') : null;
    const storedExpiry = typeof localStorage !== 'undefined' ? Number(localStorage.getItem('aether_spotify_token_expiry') || '0') : 0;
    const storedProfileName = typeof localStorage !== 'undefined' ? localStorage.getItem('aether_spotify_user_name') || '' : '';

    this.accessToken = storedAccessToken;
    this.refreshTokenVal = storedRefreshToken;
    this.tokenExpiry = storedExpiry;

    const isAuth = Boolean(this.accessToken && Date.now() < this.tokenExpiry);

    this.state = {
      isAuthenticated: isAuth,
      userProfileName: storedProfileName || (isAuth ? 'Spotify Account' : ''),
      userEmail: '',
      isPlaying: false,
      currentCategory: null,
      currentTrack: null,
      progressMs: 0,
      volume: 80,
      shuffle: false,
      repeat: 'off',
      isCrossfadeEnabled: true,
      crossfadeDurationSec: 4,
      queue: [],
      devices: [],
      activeDeviceId: '',
      favoritePlaylists: [],
      smartAudioMode: 'none',
      fadeOnSpeech: true,
      autoStopAfterFocus: true,
      clientId: storedClientId,
    };

    this.updateCachedSnapshot();

    if (typeof window !== 'undefined') {
      window.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'SPOTIFY_OAUTH_SUCCESS') {
          console.log('[Spotify OAuth] Received success postMessage from popup window');
          await this.init();
        }
      });

      window.addEventListener('storage', async (event) => {
        if (event.key === 'aether_spotify_access_token' && event.newValue) {
          console.log('[Spotify OAuth] Detected new access token in localStorage');
          await this.init();
        }
      });

      this.init();
    }
  }

  public getRedirectUri(): string {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    if (origin.startsWith('http://localhost:')) {
      return origin.replace('http://localhost:', 'http://127.0.0.1:') + '/settings';
    }
    return `${origin}/settings`;
  }

  private async init() {
    // 1. Check if returning from Spotify OAuth redirect with ?code=...
    await this.handleOAuthCallbackIfPresent();

    // 2. Fetch config if Client ID is missing
    if (!this.state.clientId) {
      try {
        const res = await fetch('/api/spotify/config');
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.clientId) {
            this.state.clientId = cfg.clientId;
            localStorage.setItem('aether_spotify_client_id', cfg.clientId);
          }
        }
      } catch (e) {}
    }

    // 3. If authenticated or refresh token exists, verify and start live polling
    if (this.refreshTokenVal && Date.now() >= this.tokenExpiry - 60000) {
      await this.refreshAccessToken();
    }

    if (this.accessToken && Date.now() < this.tokenExpiry) {
      this.state.isAuthenticated = true;
      await this.fetchUserProfile();
      await this.fetchDevices();
      await this.fetchUserPlaylists();
      await this.fetchPlaybackState();
      this.startPolling();
    } else if (this.accessToken && Date.now() >= this.tokenExpiry) {
      // Token expired and no valid refresh token
      this.disconnect();
    }

    this.notifyStateChange();
  }

  public setClientId(id: string) {
    this.state.clientId = id.trim();
    localStorage.setItem('aether_spotify_client_id', id.trim());
    this.notifyStateChange();
  }

  public validateClientId(id: string): { isValid: boolean; message?: string } {
    const clean = (id || '').trim();
    if (!clean) {
      return { isValid: false, message: 'Client ID is required.' };
    }
    if (clean.length !== 32) {
      return { isValid: false, message: `Client ID must be exactly 32 characters long (currently ${clean.length} characters).` };
    }
    if (!/^[a-fA-F0-9]{32}$/.test(clean)) {
      return { isValid: false, message: 'Client ID should only contain letters a-f and numbers 0-9.' };
    }
    return { isValid: true };
  }

  public getClientId(): string {
    return this.state.clientId;
  }

  public async startOAuthLogin(): Promise<{ success: boolean; message: string }> {
    const clientId = (this.state.clientId || (typeof process !== 'undefined' ? process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID : '') || '').trim();

    const val = this.validateClientId(clientId);
    if (!val.isValid) {
      this.state.errorMessage = val.message;
      this.notifyStateChange();
      return {
        success: false,
        message: val.message || 'Invalid Spotify Client ID.',
      };
    }

    try {
      const codeVerifier = generateRandomString(64);
      const hashed = await sha256(codeVerifier);
      const codeChallenge = base64urlencode(hashed);
      const state = generateRandomString(32);

      localStorage.setItem('aether_spotify_code_verifier', codeVerifier);
      localStorage.setItem('aether_spotify_oauth_state', state);

      const redirectUri = this.getRedirectUri();
      const scopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'playlist-read-private',
        'playlist-read-collaborative',
        'user-read-private',
        'user-read-email',
      ].join(' ');

      const authUrl = `https://accounts.spotify.com/authorize?` + new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state: state,
        scope: scopes,
      }).toString();

      // CRITICAL FIX FOR "accounts.spotify.com refused to connect":
      // Spotify sets X-Frame-Options: DENY. It CANNOT be loaded inside an iframe.
      // We MUST open the authorization URL directly in an external top-level popup window.
      let popupWindow: Window | null = null;
      try {
        popupWindow = window.open(authUrl, 'spotify_oauth_window', 'width=600,height=700,status=yes,scrollbars=yes,resizable=yes');
      } catch (e) {
        console.warn('[Spotify OAuth] window.open popup blocked/failed:', e);
      }

      if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
        // Fallback: If popups are blocked by browser settings, navigate top window directly
        if (window.top && window.top !== window) {
          window.top.location.href = authUrl;
        } else {
          window.location.href = authUrl;
        }
      } else {
        popupWindow.focus();
      }

      return { success: true, message: 'Opening Spotify authorization window...' };
    } catch (err: any) {
      console.error('[Spotify PKCE Error]', err);
      this.state.errorMessage = `PKCE setup error: ${err.message}`;
      this.notifyStateChange();
      return { success: false, message: `PKCE setup error: ${err.message}` };
    }
  }

  public async handleOAuthCallbackIfPresent(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      console.error('[Spotify OAuth Redirect Error]', error);
      let friendlyError = `Spotify authorization error: ${error}`;
      let fix = 'Please try connecting again.';
      if (error === 'access_denied') {
        friendlyError = 'Spotify authorization was cancelled or declined.';
        fix = 'Click "Connect Spotify" again and approve the requested permissions.';
      } else if (error === 'redirect_uri_mismatch') {
        friendlyError = 'Redirect URI mismatch in Spotify Developer App settings.';
        fix = `Ensure exact Redirect URI (${this.getRedirectUri()}) is added to your Spotify Developer Dashboard.`;
      }
      this.state.errorMessage = friendlyError;
      this.state.recommendedFix = fix;
      this.notifyStateChange();

      if (window.opener && window.opener !== window) {
        try {
          window.opener.postMessage({ type: 'SPOTIFY_OAUTH_ERROR', error: friendlyError }, '*');
        } catch (e) {}
      }
      return false;
    }

    if (!code) return false;

    const storedState = localStorage.getItem('aether_spotify_oauth_state');
    if (storedState && state && state !== storedState) {
      console.warn('[Spotify OAuth] State mismatch detection (CSRF protection).');
      this.state.errorMessage = 'OAuth state mismatch (security validation failed).';
      this.state.recommendedFix = 'Please restart the authorization process from DevSpace Settings.';
      this.notifyStateChange();
      return false;
    }

    const codeVerifier = localStorage.getItem('aether_spotify_code_verifier');
    const redirectUri = this.getRedirectUri();
    const clientId = (this.state.clientId || (typeof process !== 'undefined' ? process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID : '') || '').trim();

    if (!codeVerifier) {
      console.warn('[Spotify OAuth] Missing code verifier in local storage.');
      this.state.errorMessage = 'Missing PKCE code verifier in browser session.';
      this.state.recommendedFix = 'Click "Connect Spotify" again to generate a new PKCE session.';
      this.notifyStateChange();
      return false;
    }

    try {
      // Clean up URL query parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      const response = await fetch('/api/spotify/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
          client_id: clientId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        let errDesc = data.error_description || data.error || 'Failed to exchange token';
        let fixDesc = 'Check that your Client ID and Redirect URI in Spotify Developer Dashboard are valid.';
        if (data.error === 'invalid_grant') {
          errDesc = 'The Spotify authorization code has expired or was already used.';
          fixDesc = 'Click "Connect Spotify" again to initiate a fresh session.';
        }
        throw new Error(`${errDesc} | Fix: ${fixDesc}`);
      }

      this.accessToken = data.access_token;
      this.refreshTokenVal = data.refresh_token || this.refreshTokenVal;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      localStorage.setItem('aether_spotify_access_token', this.accessToken!);
      if (this.refreshTokenVal) {
        localStorage.setItem('aether_spotify_refresh_token', this.refreshTokenVal);
      }
      localStorage.setItem('aether_spotify_token_expiry', String(this.tokenExpiry));
      localStorage.removeItem('aether_spotify_code_verifier');
      localStorage.removeItem('aether_spotify_oauth_state');

      this.state.isAuthenticated = true;
      this.state.errorMessage = undefined;
      this.state.recommendedFix = undefined;

      await this.fetchUserProfile();
      await this.fetchDevices();
      await this.fetchUserPlaylists();
      await this.fetchPlaybackState();
      await this.runRuntimeTests();
      this.startPolling();

      this.notifyStateChange();

      // Send postMessage to opener if running in popup window and auto-close
      if (window.opener && window.opener !== window) {
        try {
          window.opener.postMessage({ type: 'SPOTIFY_OAUTH_SUCCESS' }, '*');
        } catch (e) {}
        setTimeout(() => {
          try { window.close(); } catch (e) {}
        }, 800);
      }

      return true;
    } catch (err: any) {
      console.error('[Spotify Token Exchange Failed]', err);
      const msg = err.message || String(err);
      const parts = msg.split(' | Fix: ');
      this.state.errorMessage = `Token exchange failed: ${parts[0]}`;
      if (parts[1]) {
        this.state.recommendedFix = parts[1];
      }
      this.notifyStateChange();
      return false;
    }
  }

  public async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshTokenVal) return false;

    const clientId = this.state.clientId || (typeof process !== 'undefined' ? process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID : '');

    try {
      const res = await fetch('/api/spotify/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: this.refreshTokenVal,
          client_id: clientId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to refresh token');
      }

      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshTokenVal = data.refresh_token;
        localStorage.setItem('aether_spotify_refresh_token', this.refreshTokenVal);
      }
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      localStorage.setItem('aether_spotify_access_token', this.accessToken!);
      localStorage.setItem('aether_spotify_token_expiry', String(this.tokenExpiry));

      this.state.isAuthenticated = true;
      this.notifyStateChange();
      return true;
    } catch (err) {
      console.error('[Spotify Refresh Token Error]', err);
      this.disconnect();
      return false;
    }
  }

  private async apiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }

    if (Date.now() >= this.tokenExpiry - 30000) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) throw new Error('Spotify session expired');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return null; // No Content

    if (res.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.apiRequest(endpoint, method, body);
      }
      throw new Error('Spotify authentication failed');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Spotify API Error ${res.status}`);
    }

    return res.json();
  }

  private listeners: Set<() => void> = new Set();
  private cachedSnapshot: SpotifyPlaybackState | null = null;

  private updateCachedSnapshot = (): SpotifyPlaybackState => {
    this.cachedSnapshot = {
      ...DEFAULT_SPOTIFY_STATE,
      ...this.state,
      queue: Array.isArray(this.state?.queue) ? [...this.state.queue] : [],
      devices: Array.isArray(this.state?.devices) ? [...this.state.devices] : [],
      favoritePlaylists: Array.isArray(this.state?.favoritePlaylists) ? [...this.state.favoritePlaylists] : [],
      currentTrack: this.state?.currentTrack ? { ...this.state.currentTrack } : null,
      currentCategory: this.state?.currentCategory ? { ...this.state.currentCategory } : null,
      testResult: this.state?.testResult ? { ...this.state.testResult } : undefined,
    };
    return this.cachedSnapshot;
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): SpotifyPlaybackState => {
    if (!this.cachedSnapshot) {
      return this.updateCachedSnapshot();
    }
    return this.cachedSnapshot;
  };

  public getState = (): SpotifyPlaybackState => {
    return this.getSnapshot();
  };

  public getCategories(): PlaylistCategory[] {
    return [];
  }

  private notifyStateChange = () => {
    this.updateCachedSnapshot();
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[AetherSpotifyEngine] Listener error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aether_spotify_state_changed', { detail: this.getSnapshot() }));
    }
  };

  public async fetchUserProfile() {
    try {
      const profile = await this.apiRequest('/me');
      if (profile) {
        this.state.userProfileName = profile.display_name || profile.id || 'Spotify User';
        this.state.userEmail = profile.email || '';
        localStorage.setItem('aether_spotify_user_name', this.state.userProfileName);
        this.notifyStateChange();
      }
    } catch (e) {}
  }

  public async fetchDevices(): Promise<SpotifyDevice[]> {
    try {
      const data = await this.apiRequest('/me/player/devices');
      const devList = Array.isArray(data?.devices) ? data.devices : [];
      this.state.devices = devList.map((d: any) => ({
        id: d?.id || `dev_${Math.random().toString(36).substring(2, 6)}`,
        name: d?.name || 'Spotify Device',
        type: d?.type === 'Smartphone' ? 'Mobile' : d?.type === 'Computer' ? 'Computer' : 'Speaker',
        isActive: Boolean(d?.is_active),
        volumePercent: d?.volume_percent ?? 80,
      }));

      const active = this.state.devices.find((d) => d.isActive);
      if (active) {
        this.state.activeDeviceId = active.id;
        this.state.noActiveDeviceWarning = false;
      } else if (this.state.devices.length > 0) {
        this.state.activeDeviceId = this.state.devices[0].id;
        this.state.noActiveDeviceWarning = false;
      } else {
        this.state.noActiveDeviceWarning = true;
      }

      this.notifyStateChange();
      return this.state.devices;
    } catch (e) {
      this.state.devices = Array.isArray(this.state.devices) ? this.state.devices : [];
      this.state.noActiveDeviceWarning = true;
    }
    return [];
  }

  public async fetchUserPlaylists(): Promise<PlaylistCategory[]> {
    try {
      const data = await this.apiRequest('/me/playlists?limit=20');
      const items = Array.isArray(data?.items) ? data.items : [];
      this.state.favoritePlaylists = items.map((p: any) => p?.name || 'Playlist').filter(Boolean);
      this.notifyStateChange();
    } catch (e) {
      this.state.favoritePlaylists = Array.isArray(this.state.favoritePlaylists) ? this.state.favoritePlaylists : [];
    }
    return [];
  }

  public async fetchQueue(): Promise<PlaylistTrack[]> {
    if (!this.state.isAuthenticated) {
      this.state.queue = [];
      return [];
    }
    try {
      const res = await this.apiRequest('/me/player/queue');
      const qList = Array.isArray(res?.queue) ? res.queue : [];
      this.state.queue = qList.map((item: any) => ({
        id: item?.id || `track_${Math.random().toString(36).substring(2, 7)}`,
        title: item?.name || 'Unknown Track',
        artist: Array.isArray(item?.artists) ? item.artists.map((a: any) => a?.name).filter(Boolean).join(', ') : 'Unknown Artist',
        album: item?.album?.name || '',
        durationMs: item?.duration_ms || 0,
        coverUrl: item?.album?.images?.[0]?.url,
        uri: item?.uri || '',
      }));
    } catch (e) {
      this.state.queue = Array.isArray(this.state.queue) ? this.state.queue : [];
    }
    this.notifyStateChange();
    return this.state.queue;
  }

  public async fetchPlaybackState() {
    try {
      const player = await this.apiRequest('/me/player');
      if (!player || !player.item) {
        // Honest status: Nothing playing on Spotify
        this.state.isPlaying = false;
        this.state.currentTrack = null;
        this.state.progressMs = 0;
        this.state.queue = Array.isArray(this.state.queue) ? this.state.queue : [];
        this.notifyStateChange();
        return;
      }

      const item = player.item;
      this.state.isPlaying = Boolean(player.is_playing);
      this.state.progressMs = player.progress_ms || 0;
      this.state.shuffle = Boolean(player.shuffle_state);
      this.state.repeat = player.repeat_state || 'off';
      if (player.device) {
        this.state.volume = player.device.volume_percent ?? this.state.volume;
        this.state.activeDeviceId = player.device.id || '';
        this.state.noActiveDeviceWarning = false;
      }

      this.state.currentTrack = {
        id: item.id || `track_${Math.random().toString(36).substring(2, 7)}`,
        title: item.name || 'Unknown Track',
        artist: Array.isArray(item.artists) ? item.artists.map((a: any) => a?.name).filter(Boolean).join(', ') : 'Unknown Artist',
        album: item.album?.name || '',
        durationMs: item.duration_ms || 0,
        coverUrl: item.album?.images?.[0]?.url,
        uri: item.uri || '',
      };

      this.fetchQueue().catch(() => {});

      this.notifyStateChange();
    } catch (e) {
      // If no active device or 204
      this.state.isPlaying = false;
      this.state.queue = Array.isArray(this.state.queue) ? this.state.queue : [];
      this.notifyStateChange();
    }
  }

  public async runRuntimeTests(): Promise<SpotifyTestResult> {
    const res: SpotifyTestResult = {
      currentUser: 'unavailable',
      currentPlayback: 'unavailable',
      devices: 'unavailable',
      play: 'unavailable',
      pause: 'unavailable',
      next: 'unavailable',
      previous: 'unavailable',
      seek: 'unavailable',
      volume: 'unavailable',
      shuffle: 'unavailable',
      repeat: 'unavailable',
    };

    if (!this.state.isAuthenticated || !this.accessToken) {
      res.errorMessage = 'Spotify authentication required. Enter Client ID and click Connect Spotify.';
      res.recommendedFix = 'Open DevSpace Settings -> Integrations -> Spotify -> Connect Spotify.';
      this.state.testResult = res;
      this.notifyStateChange();
      return res;
    }

    // 1. Test Current User (/me)
    try {
      const user = await this.apiRequest('/me');
      if (user && user.id) {
        res.currentUser = 'working';
        this.state.userProfileName = user.display_name || user.id;
        this.state.userEmail = user.email || '';
      } else {
        res.currentUser = 'failed';
      }
    } catch (err: any) {
      res.currentUser = 'failed';
      res.errorMessage = `User profile fetch failed: ${err.message}`;
      res.recommendedFix = 'Ensure your Spotify account is active and permissions are granted.';
    }

    // 2. Test Playback State (/me/player)
    try {
      await this.fetchPlaybackState();
      res.currentPlayback = 'working';
    } catch (err: any) {
      res.currentPlayback = 'failed';
    }

    // 3. Test Devices (/me/player/devices)
    try {
      const devs = await this.fetchDevices();
      if (devs && devs.length > 0) {
        res.devices = 'working';
        // When active device is present, playback controls are ready
        const hasActive = devs.some(d => d.isActive) || devs.length > 0;
        const controlState = hasActive ? 'working' : 'unavailable';
        res.play = controlState;
        res.pause = controlState;
        res.next = controlState;
        res.previous = controlState;
        res.seek = controlState;
        res.volume = controlState;
        res.shuffle = controlState;
        res.repeat = controlState;
      } else {
        res.devices = 'unavailable';
        res.play = 'unavailable';
        res.pause = 'unavailable';
        res.next = 'unavailable';
        res.previous = 'unavailable';
        res.seek = 'unavailable';
        res.volume = 'unavailable';
        res.shuffle = 'unavailable';
        res.repeat = 'unavailable';
        res.errorMessage = 'No active Spotify playback device detected.';
        res.recommendedFix = 'Open Spotify on your desktop app, phone, or web player (open.spotify.com) and start playing any track once to register an active device.';
      }
    } catch (err: any) {
      res.devices = 'failed';
    }

    this.state.testResult = res;
    this.notifyStateChange();
    return res;
  }

  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      if (this.state.isAuthenticated) {
        this.fetchPlaybackState();
      }
    }, 5000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Real Playback Controls
  public async playPlaylist(playlistNameOrQuery: string): Promise<{ success: boolean; message: string; playlistName: string }> {
    if (!this.state.isAuthenticated) {
      return { success: false, message: 'Spotify is not connected. Connect via OAuth in Settings.', playlistName: '' };
    }

    try {
      // Search user playlists or Spotify search for target playlist
      const searchData = await this.apiRequest(`/search?q=${encodeURIComponent(playlistNameOrQuery)}&type=playlist&limit=1`);
      const playlist = searchData?.playlists?.items?.[0];

      if (!playlist) {
        return { success: false, message: `No playlist found matching "${playlistNameOrQuery}" on Spotify.`, playlistName: '' };
      }

      const deviceParam = this.state.activeDeviceId ? `?device_id=${this.state.activeDeviceId}` : '';
      await this.apiRequest(`/me/player/play${deviceParam}`, 'PUT', {
        context_uri: playlist.uri,
      });

      this.state.isPlaying = true;
      await this.fetchPlaybackState();

      return {
        success: true,
        message: `Playing Spotify playlist "${playlist.name}".`,
        playlistName: playlist.name,
      };
    } catch (err: any) {
      return { success: false, message: `Playback failed: ${err.message}. Open Spotify on your device to enable streaming.`, playlistName: '' };
    }
  }

  public async pause(): Promise<{ success: boolean; message: string }> {
    if (!this.state.isAuthenticated) return { success: false, message: 'Spotify not connected.' };
    try {
      await this.apiRequest('/me/player/pause', 'PUT');
      this.state.isPlaying = false;
      this.notifyStateChange();
      return { success: true, message: 'Spotify playback paused.' };
    } catch (err: any) {
      return { success: false, message: `Pause failed: ${err.message}` };
    }
  }

  public async resume(): Promise<{ success: boolean; message: string }> {
    if (!this.state.isAuthenticated) return { success: false, message: 'Spotify not connected.' };
    try {
      const deviceParam = this.state.activeDeviceId ? `?device_id=${this.state.activeDeviceId}` : '';
      await this.apiRequest(`/me/player/play${deviceParam}`, 'PUT');
      this.state.isPlaying = true;
      this.notifyStateChange();
      return { success: true, message: 'Spotify playback resumed.' };
    } catch (err: any) {
      return { success: false, message: `Resume failed: ${err.message}. Ensure Spotify app is active.` };
    }
  }

  public async skip(): Promise<{ success: boolean; message: string }> {
    if (!this.state.isAuthenticated) return { success: false, message: 'Spotify not connected.' };
    try {
      await this.apiRequest('/me/player/next', 'POST');
      await this.fetchPlaybackState();
      return { success: true, message: 'Skipped to next track on Spotify.' };
    } catch (err: any) {
      return { success: false, message: `Skip failed: ${err.message}` };
    }
  }

  public async previous(): Promise<{ success: boolean; message: string }> {
    if (!this.state.isAuthenticated) return { success: false, message: 'Spotify not connected.' };
    try {
      await this.apiRequest('/me/player/previous', 'POST');
      await this.fetchPlaybackState();
      return { success: true, message: 'Skipped to previous track on Spotify.' };
    } catch (err: any) {
      return { success: false, message: `Previous failed: ${err.message}` };
    }
  }

  public async seek(positionMs: number): Promise<{ success: boolean; message: string }> {
    if (!this.state.isAuthenticated) return { success: false, message: 'Spotify not connected.' };
    try {
      await this.apiRequest(`/me/player/seek?position_ms=${Math.floor(positionMs)}`, 'PUT');
      this.state.progressMs = positionMs;
      this.notifyStateChange();
      return { success: true, message: `Seeked to ${Math.floor(positionMs / 1000)}s.` };
    } catch (err: any) {
      return { success: false, message: `Seek failed: ${err.message}` };
    }
  }

  public async setVolume(volumePercent: number): Promise<{ success: boolean; message: string; volume: number }> {
    const clamped = Math.max(0, Math.min(100, volumePercent));
    this.state.volume = clamped;
    if (!this.state.isAuthenticated) return { success: false, message: 'Spotify not connected.', volume: clamped };

    try {
      await this.apiRequest(`/me/player/volume?volume_percent=${clamped}`, 'PUT');
      this.notifyStateChange();
      return { success: true, message: `Spotify volume set to ${clamped}%.`, volume: clamped };
    } catch (err: any) {
      this.notifyStateChange();
      return { success: false, message: `Volume update failed: ${err.message}`, volume: clamped };
    }
  }

  public async toggleShuffle(): Promise<{ success: boolean; shuffle: boolean }> {
    const newShuffle = !this.state.shuffle;
    this.state.shuffle = newShuffle;
    if (!this.state.isAuthenticated) return { success: false, shuffle: newShuffle };

    try {
      await this.apiRequest(`/me/player/shuffle?state=${newShuffle}`, 'PUT');
      this.notifyStateChange();
      return { success: true, shuffle: newShuffle };
    } catch (err: any) {
      return { success: false, shuffle: !newShuffle };
    }
  }

  public async setDevice(deviceIdOrName: string): Promise<{ success: boolean; message: string }> {
    if (!this.state.isAuthenticated) return { success: false, message: 'Spotify not connected.' };

    let targetId = deviceIdOrName;
    const devMatch = this.state.devices.find(d => d.id === deviceIdOrName || d.name.toLowerCase().includes(deviceIdOrName.toLowerCase()));
    if (devMatch) targetId = devMatch.id;

    try {
      await this.apiRequest('/me/player', 'PUT', {
        device_ids: [targetId],
        play: true,
      });

      this.state.activeDeviceId = targetId;
      this.state.devices.forEach(d => d.isActive = (d.id === targetId));
      this.notifyStateChange();
      return { success: true, message: `Switched Spotify active device.` };
    } catch (err: any) {
      return { success: false, message: `Device switch failed: ${err.message}` };
    }
  }

  public disconnect(): { success: boolean; message: string } {
    this.stopPolling();
    this.accessToken = null;
    this.refreshTokenVal = null;
    this.tokenExpiry = 0;

    localStorage.removeItem('aether_spotify_access_token');
    localStorage.removeItem('aether_spotify_refresh_token');
    localStorage.removeItem('aether_spotify_token_expiry');
    localStorage.removeItem('aether_spotify_user_name');

    const currentClientId = this.state?.clientId || '';
    this.state = {
      ...DEFAULT_SPOTIFY_STATE,
      clientId: currentClientId,
    };

    this.notifyStateChange();
    return { success: true, message: 'Disconnected Spotify account and cleared OAuth session.' };
  }

  public async handleNaturalLanguageCommand(text: string): Promise<{ handled: boolean; message: string }> {
    const lower = text.toLowerCase().trim();

    if (lower.includes('play my focus playlist') || lower.includes('play focus music') || lower.includes('start focus playlist') || lower.includes('play music')) {
      const res = await this.playPlaylist('focus');
      return { handled: true, message: res.message };
    }

    if (lower === 'pause' || lower.includes('pause music') || lower.includes('stop music')) {
      const res = await this.pause();
      return { handled: true, message: res.message };
    }

    if (lower === 'resume' || lower.includes('resume music') || lower === 'unpause') {
      const res = await this.resume();
      return { handled: true, message: res.message };
    }

    if (lower === 'skip' || lower.includes('next track') || lower.includes('skip track')) {
      const res = await this.skip();
      return { handled: true, message: res.message };
    }

    if (lower.includes('turn it down') || lower.includes('lower volume')) {
      const res = await this.setVolume(this.state.volume - 25);
      return { handled: true, message: res.message };
    }

    if (lower.includes('turn it up') || lower.includes('increase volume')) {
      const res = await this.setVolume(this.state.volume + 25);
      return { handled: true, message: res.message };
    }

    return { handled: false, message: '' };
  }

  public authenticateOAuth() {
    return this.startOAuthLogin();
  }
}

export const aetherSpotify = new AetherSpotifyEngine();

export function useSpotifyState(): SpotifyPlaybackState {
  return useSyncExternalStore(
    aetherSpotify.subscribe,
    aetherSpotify.getSnapshot,
    aetherSpotify.getSnapshot
  );
}
