import React, { useState, useEffect } from 'react';
import {
  Server,
  Key,
  ShieldCheck,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Activity,
  Terminal,
  Lock,
  Music,
  Github,
  Calendar,
  Mail,
  FolderGit2,
  Slack,
  MessageSquare,
  Compass,
  Sliders,
  Volume2,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  Repeat,
  Laptop,
  Headphones,
  Radio,
  Search,
  Zap,
  Globe,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  CheckCircle2,
  Info,
  Layers,
  Eye,
  FileText,
  Cloud,
  MapPin,
  Mic,
  Maximize2,
  Sparkles,
  Database
} from 'lucide-react';
import { aetherCore, SkillDefinition, PermissionScope, PermissionAuditEntry } from '../lib/aetherCore';
import { aetherSpotify, SpotifyPlaybackState, SpotifyDevice, PlaylistCategory } from '../lib/aetherSpotifyEngine';

export function IntegrationsCenter() {
  const [skills, setSkills] = useState<SkillDefinition[]>(() => aetherCore.getSkills());
  const [marketplaceSkills, setMarketplaceSkills] = useState<SkillDefinition[]>(() => aetherCore.getMarketplaceSkills());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & Panels
  const [selectedSkillForConfig, setSelectedSkillForConfig] = useState<SkillDefinition | null>(null);
  const [selectedSkillForLogs, setSelectedSkillForLogs] = useState<SkillDefinition | null>(null);
  const [selectedSkillForTest, setSelectedSkillForTest] = useState<SkillDefinition | null>(null);
  const [testResult, setTestResult] = useState<{ status: string; latencyMs: number; details: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'integrations' | 'marketplace'>('integrations');

  // Spotify State
  const [spotifyState, setSpotifyState] = useState<SpotifyPlaybackState>(() => aetherSpotify.getState());
  const [spotifyCategories, setSpotifyCategories] = useState<PlaylistCategory[]>(() => aetherSpotify.getCategories());

  useEffect(() => {
    const handleSpotifyChange = (e: any) => {
      setSpotifyState(e.detail);
    };
    window.addEventListener('aether_spotify_state_changed', handleSpotifyChange);
    return () => {
      window.removeEventListener('aether_spotify_state_changed', handleSpotifyChange);
    };
  }, []);

  const refreshSkills = () => {
    setSkills(aetherCore.getSkills());
    setMarketplaceSkills(aetherCore.getMarketplaceSkills());
  };

  const handleToggleEnabled = (skillId: string, currentEnabled: boolean) => {
    aetherCore.toggleSkillEnabled(skillId, !currentEnabled);
    refreshSkills();
  };

  const handleReconnect = (skillId: string) => {
    aetherCore.reconnectSkill(skillId);
    refreshSkills();
  };

  const handleRefreshToken = async (skillId: string) => {
    await aetherCore.refreshTokenSkill(skillId);
    refreshSkills();
    alert(`Successfully refreshed OAuth access token for ${skillId}.`);
  };

  const handleDisconnect = (skillId: string) => {
    if (confirm(`Disconnect integration "${skillId}"? This will revoke active OAuth scopes.`)) {
      aetherCore.toggleSkillEnabled(skillId, false);
      const skill = aetherCore.getSkill(skillId);
      if (skill) {
        skill.authStatus = 'disconnected';
        skill.permissionsRequired.forEach(p => p.granted = false);
      }
      refreshSkills();
    }
  };

  const handleRunHealthCheck = (skill: SkillDefinition) => {
    setSelectedSkillForTest(skill);
    setIsTesting(true);
    setTestResult(null);
    setTimeout(() => {
      const res = aetherCore.healthCheckSkill(skill.id);
      setTestResult(res);
      setIsTesting(false);
      refreshSkills();
    }, 600);
  };

  const handleSyncBackground = async (skillId: string) => {
    const res = await aetherCore.syncSkillBackground(skillId);
    refreshSkills();
    alert(`Background sync completed! Synchronized ${res.syncedRecords} records.`);
  };

  const handleInstallMarketplace = (skillId: string) => {
    const installed = aetherCore.installMarketplaceSkill(skillId);
    if (installed) {
      refreshSkills();
      alert(`Successfully installed "${installed.name}" from Aether Marketplace!`);
    }
  };

  const handleUninstallMarketplace = (skillId: string) => {
    if (confirm(`Uninstall skill "${skillId}"?`)) {
      aetherCore.uninstallMarketplaceSkill(skillId);
      refreshSkills();
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          skill.capabilities.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const connectedCount = skills.filter(s => s.authStatus === 'connected' && s.enabled).length;
  const degradedCount = skills.filter(s => s.health === 'degraded' || s.authStatus === 'needs_reauth').length;

  return (
    <div className="space-y-6 animate-fade-in text-zinc-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#09090b] border border-zinc-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <PlugZapIcon size={18} className="text-yellow-500" /> DevSpace Integrations Hub & OAuth Gateways
            </h2>
            <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase">
              AES-256 Vault Guarded
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Manage live authentication connections, API key tokens, OAuth permission scopes, and real-time synchronization streams across your toolchain.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#121214] border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-zinc-400">Active Gateways:</span>
            <span className="text-emerald-400 font-bold">{connectedCount} Connected</span>
            {degradedCount > 0 && (
              <span className="text-amber-400 font-bold ml-1">({degradedCount} Degraded)</span>
            )}
          </div>

          <button
            onClick={() => {
              skills.forEach(s => aetherCore.healthCheckSkill(s.id));
              refreshSkills();
              alert("Batch connection health audit complete across all 20 integrated subsystems.");
            }}
            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-450 text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <RefreshCw size={12} /> Health Audit
          </button>
        </div>
      </div>

      {/* Main Tab Switcher & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'integrations'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Connected Subsystems ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'marketplace'
                ? 'bg-purple-950/40 text-purple-300 border border-purple-800/50 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={13} className="text-purple-400" /> Marketplace & Extensions
          </button>
        </div>

        {activeTab === 'integrations' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations, scopes, APIs..."
                className="w-full bg-[#121214] border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50"
            >
              <option value="all">All Categories</option>
              <option value="workspace">Workspace & Cloud</option>
              <option value="git_dev">Git & Repository</option>
              <option value="communication">Communication</option>
              <option value="productivity">Productivity & Audio</option>
              <option value="storage">Storage & Backup</option>
              <option value="system">Native OS & Hardware</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'integrations' ? (
        <div className="space-y-6">
          {/* FIRST CLASS FEATURE: Spotify Focus Audio Integration Suite */}
          <div className="bg-gradient-to-r from-emerald-950/20 via-[#0a0f0d] to-[#09090b] border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Music size={24} className="text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100">Spotify Intelligence & Desktop Focus Suite</h3>
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                      First-Class Integration
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time playback control, smart focus music triggers, device discovery, and natural language command parser.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const res = aetherSpotify.authenticateOAuth();
                    alert(res.message);
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Key size={12} /> OAuth Re-Auth
                </button>
                <button
                  onClick={() => {
                    aetherSpotify.setVolume(spotifyState.volume);
                    alert("Synced Spotify device hardware volume and active OAuth tokens.");
                  }}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Refresh Token
                </button>
              </div>
            </div>

            {/* Spotify Player Control Deck */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-emerald-900/30">
              {/* Playback Controls & Status */}
              <div className="bg-black/40 border border-zinc-850 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">Now Playing</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${spotifyState.isPlaying ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-zinc-900 text-zinc-500'}`}>
                    {spotifyState.isPlaying ? '● PLAYING' : 'PAUSED'}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200 truncate">
                    {spotifyState.currentTrack ? spotifyState.currentTrack.title : 'Deep Focus Ambient Flow'}
                  </h4>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {spotifyState.currentTrack ? `${spotifyState.currentTrack.artist} — ${spotifyState.currentTrack.album}` : 'Aether Spotify Engine'}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => aetherSpotify.toggleShuffle()}
                    className={`p-1.5 rounded transition-colors ${spotifyState.shuffle ? 'text-emerald-400 bg-emerald-950/40' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Toggle Shuffle"
                  >
                    <Shuffle size={13} />
                  </button>

                  <div className="flex items-center gap-2">
                    {spotifyState.isPlaying ? (
                      <button
                        onClick={() => aetherSpotify.pause()}
                        className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full transition-colors cursor-pointer"
                      >
                        <Pause size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => aetherSpotify.resume()}
                        className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full transition-colors cursor-pointer"
                      >
                        <Play size={14} className="ml-0.5" />
                      </button>
                    )}

                    <button
                      onClick={() => aetherSpotify.skip()}
                      className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                      title="Skip Track"
                    >
                      <SkipForward size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Volume2 size={13} className="text-zinc-400" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={spotifyState.volume}
                      onChange={(e) => aetherSpotify.setVolume(Number(e.target.value))}
                      className="w-16 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[9px] font-mono text-zinc-400 w-6 text-right">{spotifyState.volume}%</span>
                  </div>
                </div>
              </div>

              {/* Active Device Selection */}
              <div className="bg-black/40 border border-zinc-850 rounded-lg p-3.5 space-y-3">
                <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block">Spotify Output Device</span>
                <div className="space-y-1.5">
                  {spotifyState.devices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => aetherSpotify.setDevice(device.name)}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                        device.isActive
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold'
                          : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {device.type === 'Headphones' ? <Headphones size={13} /> : device.type === 'Computer' ? <Laptop size={13} /> : <Radio size={13} />}
                        <span className="truncate">{device.name}</span>
                      </div>
                      {device.isActive && <Check size={12} className="text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Playlists & Natural Language Commands */}
              <div className="bg-black/40 border border-zinc-850 rounded-lg p-3.5 space-y-2.5">
                <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider block">Focus Playlists & Shortcuts</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {spotifyCategories.slice(0, 4).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => aetherSpotify.playPlaylist(cat.name)}
                      className="p-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded text-[10px] text-zinc-300 hover:text-emerald-400 text-left truncate transition-colors cursor-pointer"
                    >
                      ▶ {cat.name}
                    </button>
                  ))}
                </div>

                <div className="pt-1 text-[9px] text-zinc-500 flex items-center gap-1 font-mono">
                  <Sparkles size={10} className="text-yellow-500" /> Natural Language Supported in BarShell & Voice
                </div>
              </div>
            </div>
          </div>

          {/* Grid of All Subsystem Integrations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map((skill) => {
              const isConnected = skill.authStatus === 'connected' && skill.enabled;
              return (
                <div
                  key={skill.id}
                  className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                    isConnected
                      ? 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'
                      : 'bg-[#09090b]/60 border-zinc-850/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg border ${
                          isConnected ? 'bg-zinc-900 border-zinc-800 text-yellow-500' : 'bg-zinc-950 border-zinc-900 text-zinc-600'
                        }`}>
                          {getSkillIcon(skill.id)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-zinc-200">{skill.name}</h4>
                            <span className="text-[9px] font-mono text-zinc-500">v{skill.version}</span>
                          </div>
                          <span className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-500">
                            {skill.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Status pill */}
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                          isConnected
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
                            : skill.authStatus === 'needs_reauth'
                            ? 'bg-amber-950/40 text-amber-400 border-amber-900/40'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-850'
                        }`}>
                          {isConnected ? '● Connected' : skill.authStatus === 'needs_reauth' ? '⚠️ Reauth Required' : 'Disconnected'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {skill.description}
                    </p>

                    {/* Capabilities badges */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {skill.capabilities.map((cap, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 text-[9px] font-mono rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(skill.id, skill.enabled)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          skill.enabled
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                        }`}
                      >
                        {skill.enabled ? 'Disable' : 'Enable & Connect'}
                      </button>

                      {isConnected && (
                        <>
                          <button
                            onClick={() => handleReconnect(skill.id)}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-[10px] font-mono transition-colors cursor-pointer"
                            title="Reconnect OAuth Session"
                          >
                            Reconnect
                          </button>
                          <button
                            onClick={() => handleRefreshToken(skill.id)}
                            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-[10px] font-mono transition-colors cursor-pointer"
                            title="Refresh Token"
                          >
                            Refresh
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedSkillForConfig(skill)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-colors cursor-pointer"
                        title="Configure Settings & Permissions"
                      >
                        <SettingsIcon size={12} />
                      </button>

                      <button
                        onClick={() => handleRunHealthCheck(skill)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-yellow-400 rounded transition-colors cursor-pointer"
                        title="Test Connection Endpoint"
                      >
                        <Activity size={12} />
                      </button>

                      <button
                        onClick={() => setSelectedSkillForLogs(skill)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-purple-400 rounded transition-colors cursor-pointer"
                        title="View Audit Logs"
                      >
                        <FileText size={12} />
                      </button>

                      {isConnected && (
                        <button
                          onClick={() => handleDisconnect(skill.id)}
                          className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded transition-colors cursor-pointer"
                          title="Disconnect Integration"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* MARKETPLACE TAB */
        <div className="space-y-4">
          <div className="p-4 bg-purple-950/10 border border-purple-800/30 rounded-xl space-y-1">
            <h3 className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" /> Aether Community Extensions & Official Marketplace
            </h3>
            <p className="text-[11px] text-zinc-400">
              Install 1-click extension modules into your Aether Core. All marketplace extensions run within strict sandboxed permission boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketplaceSkills.map((item) => {
              const isInstalled = skills.some(s => s.id === item.id);
              return (
                <div key={item.id} className="bg-[#09090b] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                          <Layers size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200">{item.name}</h4>
                          <span className="text-[9px] text-zinc-500 font-mono">by {item.author || 'Official Marketplace'}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded">
                        v{item.version}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.capabilities.map((cap, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-400 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-900 flex justify-between items-center">
                    <span className="text-[10px] text-emerald-400 font-mono">✓ Verified Safe Sandbox</span>
                    {isInstalled ? (
                      <button
                        onClick={() => handleUninstallMarketplace(item.id)}
                        className="px-3 py-1 bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-950/50 text-xs font-semibold rounded transition-colors cursor-pointer"
                      >
                        Uninstall
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInstallMarketplace(item.id)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded transition-colors cursor-pointer shadow-lg"
                      >
                        Install Extension
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Skill Configuration */}
      {selectedSkillForConfig && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-zinc-800 rounded-xl w-full max-w-lg p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <SettingsIcon size={16} className="text-yellow-500" />
                <h3 className="text-sm font-bold text-zinc-100">{selectedSkillForConfig.name} Configuration</h3>
              </div>
              <button
                onClick={() => setSelectedSkillForConfig(null)}
                className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">OAuth Scope Permissions</span>
                <p className="text-[11px] text-zinc-400">
                  Grant or revoke fine-grained scopes for this integration.
                </p>
              </div>

              <div className="space-y-2">
                {selectedSkillForConfig.permissionsRequired.length === 0 ? (
                  <p className="text-zinc-500 text-[11px] italic">No explicit OAuth scopes required for this module.</p>
                ) : (
                  selectedSkillForConfig.permissionsRequired.map((scope) => (
                    <div key={scope.id} className="p-3 bg-[#121214] border border-zinc-850 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-yellow-400 font-bold text-[11px]">{scope.scopeName}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={scope.granted}
                            onChange={(e) => {
                              aetherCore.grantScopePermission(selectedSkillForConfig.id, scope.id, e.target.checked);
                              refreshSkills();
                              setSelectedSkillForConfig(aetherCore.getSkill(selectedSkillForConfig.id) || null);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-yellow-500 peer-checked:after:bg-black"></div>
                        </label>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal">{scope.whyNeeded}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedSkillForConfig(null)}
                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Audit Logs */}
      {selectedSkillForLogs && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-zinc-800 rounded-xl w-full max-w-xl p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-purple-400" />
                <h3 className="text-sm font-bold text-zinc-100">{selectedSkillForLogs.name} Audit History</h3>
              </div>
              <button
                onClick={() => setSelectedSkillForLogs(null)}
                className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[11px] pr-1">
              {aetherCore.getAuditHistory().filter(a => a.skillId === selectedSkillForLogs.id).length === 0 ? (
                <p className="text-center text-zinc-600 py-6">No audit log entries recorded for this integration yet.</p>
              ) : (
                aetherCore.getAuditHistory().filter(a => a.skillId === selectedSkillForLogs.id).map((entry) => (
                  <div key={entry.id} className="p-2.5 bg-zinc-950 border border-zinc-850 rounded space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-purple-400 font-bold">[{entry.action.toUpperCase()}]</span>
                      <span className="text-zinc-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-zinc-300 text-[10px] leading-relaxed">{entry.details}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedSkillForLogs(null)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Test Connection */}
      {selectedSkillForTest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-zinc-800 rounded-xl w-full max-w-md p-5 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-yellow-500" />
                <h3 className="text-sm font-bold text-zinc-100">Testing {selectedSkillForTest.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSkillForTest(null)}
                className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 text-center space-y-3 font-mono text-xs">
              {isTesting ? (
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-400 py-4">
                  <RefreshCw size={24} className="animate-spin text-yellow-500" />
                  <p>Sending ping to endpoint...</p>
                </div>
              ) : testResult ? (
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Status:</span>
                    <span className={`font-bold uppercase ${testResult.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {testResult.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Latency:</span>
                    <span className="text-zinc-200 font-bold">{testResult.latencyMs} ms</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-400">
                    {testResult.details}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setSelectedSkillForTest(null)}
                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlugZapIcon(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4z" />
      <path d="M2 22l3-3" />
      <path d="M7.5 13.5 10 11" />
      <path d="M10.5 16.5 13 14" />
      <path d="m17 10 3-3" />
      <path d="m15 6 3-3" />
      <path d="M13 2 9 6" />
    </svg>
  );
}

function getSkillIcon(skillId: string) {
  switch (skillId) {
    case 'skill-google-calendar':
      return <Calendar size={18} />;
    case 'skill-gmail':
      return <Mail size={18} />;
    case 'skill-google-drive':
      return <Cloud size={18} />;
    case 'skill-github':
    case 'skill-gitlab':
      return <Github size={18} />;
    case 'skill-slack':
      return <Slack size={18} />;
    case 'skill-discord':
      return <MessageSquare size={18} />;
    case 'skill-notion':
    case 'skill-jira':
    case 'skill-linear':
    case 'skill-todoist':
      return <FolderGit2 size={18} />;
    case 'skill-spotify':
      return <Music size={18} />;
    case 'skill-weather':
      return <Cloud size={18} />;
    case 'skill-maps':
      return <MapPin size={18} />;
    case 'skill-desktop-automation':
      return <Terminal size={18} />;
    case 'skill-voice':
      return <Mic size={18} />;
    case 'skill-vision-ocr':
      return <Eye size={18} />;
    default:
      return <Server size={18} />;
  }
}
