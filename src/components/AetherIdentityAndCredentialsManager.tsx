import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  User,
  Plus,
  Trash2,
  Check,
  Volume2,
  ExternalLink,
  Bot,
  RefreshCw,
  Zap,
  Globe,
  Radio,
  FileCode,
  Activity,
  Layers,
  HelpCircle,
  Copy,
  AlertCircle
} from 'lucide-react';
import {
  aetherPersonalitySystem,
  AetherIdentityProfile,
  SynapticDirectiveItem,
  CANONICAL_DEFAULT_PERSONALITY_PROFILES
} from '../lib/aetherIdentityProfileSystem';
import { aetherCapabilityRegistry, UserAICredentialState } from '../lib/aetherCapabilityRegistry';

export function AetherIdentityAndCredentialsManager() {
  const [activeTab, setActiveTab] = useState<'personality' | 'credentials' | 'directives' | 'capabilities'>('personality');
  
  // Profile State
  const [profile, setProfile] = useState<AetherIdentityProfile>(() => aetherPersonalitySystem.getActiveProfile());
  const [allProfiles, setAllProfiles] = useState<AetherIdentityProfile[]>(() => aetherPersonalitySystem.getAllProfiles());
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Synaptic Directives
  const [newDirectiveText, setNewDirectiveText] = useState('');
  const [directiveCategory, setDirectiveCategory] = useState<SynapticDirectiveItem['category']>('custom');

  // Credentials State
  const [credState, setCredState] = useState<UserAICredentialState>(() => aetherCapabilityRegistry.getGeminiCredentialState());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    const handleProfileChange = (e: any) => {
      setProfile(e.detail || aetherPersonalitySystem.getActiveProfile());
      setAllProfiles(aetherPersonalitySystem.getAllProfiles());
    };

    const handleCredChange = () => {
      setCredState(aetherCapabilityRegistry.getGeminiCredentialState());
    };

    window.addEventListener('aether:personality-profile-changed', handleProfileChange);
    window.addEventListener('aether:credential-updated', handleCredChange);
    return () => {
      window.removeEventListener('aether:personality-profile-changed', handleProfileChange);
      window.removeEventListener('aether:credential-updated', handleCredChange);
    };
  }, []);

  const handleUpdateSlider = (key: keyof AetherIdentityProfile, val: number) => {
    const updated = aetherPersonalitySystem.updateActiveProfile({ [key]: val } as any);
    setProfile(updated);
  };

  const handleUpdateField = (key: keyof AetherIdentityProfile, val: any) => {
    const updated = aetherPersonalitySystem.updateActiveProfile({ [key]: val } as any);
    setProfile(updated);
  };

  const handleSelectProfile = (id: string) => {
    aetherPersonalitySystem.setActiveProfile(id);
    setProfile(aetherPersonalitySystem.getActiveProfile());
  };

  const handleSaveAsNew = () => {
    if (!newProfileName.trim()) return;
    const created = aetherPersonalitySystem.saveAsNewProfile(newProfileName.trim());
    setProfile(created);
    setAllProfiles(aetherPersonalitySystem.getAllProfiles());
    setNewProfileName('');
    setIsCreatingProfile(false);
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm('Delete this custom personality profile?')) {
      aetherPersonalitySystem.deleteProfile(id);
      setProfile(aetherPersonalitySystem.getActiveProfile());
      setAllProfiles(aetherPersonalitySystem.getAllProfiles());
    }
  };

  const handleAddDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirectiveText.trim()) return;
    aetherPersonalitySystem.addDirective(newDirectiveText.trim(), directiveCategory);
    setProfile(aetherPersonalitySystem.getActiveProfile());
    setNewDirectiveText('');
  };

  const handleValidateAndSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsValidatingKey(true);
    setKeyFeedback(null);
    const res = await aetherCapabilityRegistry.saveAndValidateUserGeminiKey(apiKeyInput.trim());
    setIsValidatingKey(false);
    if (res.success) {
      setKeyFeedback({ success: true, message: `Key verified and connected successfully! (${res.maskedKeyHint})` });
      setApiKeyInput('');
      setShowKeyInput(false);
      setCredState(aetherCapabilityRegistry.getGeminiCredentialState());
    } else {
      setKeyFeedback({ success: false, message: res.error || 'Validation failed.' });
    }
  };

  const handleRemoveKey = () => {
    if (confirm('Disconnect your personal Gemini API key? Aether will no longer use your quota for live search grounding.')) {
      aetherCapabilityRegistry.removeUserGeminiKey();
      setCredState(aetherCapabilityRegistry.getGeminiCredentialState());
      setKeyFeedback(null);
    }
  };

  const capabilities = aetherCapabilityRegistry.getCapabilities();

  return (
    <div className="space-y-6">
      {/* Subnav Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Bot size={18} className="text-purple-400" /> Aether Identity, Synaptics & AI Credentials
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure Aether's personality profile, fine-grained conversational sliders, persistent behavioral directives, and user-owned Gemini API keys.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('personality')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'personality'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders size={13} className="inline mr-1.5" /> Personality Profile
          </button>
          <button
            onClick={() => setActiveTab('directives')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'directives'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={13} className="inline mr-1.5" /> Synaptic Directives ({profile.synapticDirectives?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'credentials'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key size={13} className="inline mr-1.5" /> AI Credentials & Quota
          </button>
          <button
            onClick={() => setActiveTab('capabilities')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'capabilities'
                ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap size={13} className="inline mr-1.5" /> Capability Registry
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. PERSONALITY PROFILES & FINE-GRAINED SLIDERS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'personality' && (
        <div className="space-y-6">
          {/* Profile Switcher */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Active Personality Profile</span>
              <div className="flex items-center gap-2">
                {!isCreatingProfile ? (
                  <button
                    onClick={() => setIsCreatingProfile(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                  >
                    <Plus size={12} /> Save As New Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Profile name..."
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="text-xs bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-zinc-100"
                    />
                    <button
                      onClick={handleSaveAsNew}
                      className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsCreatingProfile(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {allProfiles.map((p) => {
                const isActive = p.id === profile.id;
                const isPreset = CANONICAL_DEFAULT_PERSONALITY_PROFILES.some(cp => cp.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all relative ${
                      isActive
                        ? 'border-purple-500/80 bg-purple-950/30 ring-1 ring-purple-500/40 shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-200">{p.name}</span>
                      {isActive && <Check size={14} className="text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{p.description || p.customPersonalityPrompt}</p>
                    {!isPreset && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(p.id);
                        }}
                        className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 p-1"
                        title="Delete custom profile"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Identity & Core Name Callout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <User size={14} className="text-purple-400" /> What Should Aether Call You? (Preferred User Name)
              </label>
              <input
                type="text"
                value={profile.preferredUserName || ''}
                onChange={(e) => handleUpdateField('preferredUserName', e.target.value)}
                placeholder="e.g. Alex, Dave, Commander"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-zinc-500">
                Aether will naturally greet and address you by this name across every spoken utterance, search summary, and greeting.
              </p>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Bot size={14} className="text-purple-400" /> Assistant Display Identity
              </label>
              <input
                type="text"
                value={profile.assistantDisplayName || 'Aether'}
                onChange={(e) => handleUpdateField('assistantDisplayName', e.target.value)}
                placeholder="Aether"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[10px] text-zinc-500">
                The conversational assistant's name (strictly canonical Aether).
              </p>
            </div>
          </div>

          {/* Free-text Personality Prompt */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              <Sparkles size={14} className="text-yellow-400" /> Free-Text Personality & Behavioral Description
            </label>
            <textarea
              rows={3}
              value={profile.customPersonalityPrompt || ''}
              onChange={(e) => handleUpdateField('customPersonalityPrompt', e.target.value)}
              placeholder="e.g. Act like a smart, fast technical partner. Challenge questionable architecture gently, explain code concisely, and use natural developer humor."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 focus:outline-none focus:border-purple-500 leading-relaxed font-mono"
            />
            <p className="text-[10px] text-zinc-500">
              Injected directly into Aether's runtime conversational brain and system directives before every response.
            </p>
          </div>

          {/* Precision Personality Sliders (0-100) */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
                Precision Cognitive & Tone Sliders (0 - 100)
              </h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Fine-tune the exact tone, verbosity, and reasoning behavior of Aether with granular control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Humor Level */}
              <div className="space-y-2 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">Humor & Wit</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{profile.humorLevel}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.humorLevel}
                  onChange={(e) => handleUpdateSlider('humorLevel', Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Deadpan / Serious</span>
                  <span>Lighthearted</span>
                  <span>Roast / Sarcastic</span>
                </div>
              </div>

              {/* Verbosity */}
              <div className="space-y-2 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">Verbosity (Length of Answers)</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{profile.verbosity}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.verbosity}
                  onChange={(e) => handleUpdateSlider('verbosity', Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Ultra-Short (1-2 sentences)</span>
                  <span>Balanced</span>
                  <span>Deep Architectural</span>
                </div>
              </div>

              {/* Technical Depth */}
              <div className="space-y-2 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">Technical Depth</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{profile.technicalDepth}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.technicalDepth}
                  onChange={(e) => handleUpdateSlider('technicalDepth', Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>High-Level Overview</span>
                  <span>Practical Applied</span>
                  <span>AST / Kernel Level</span>
                </div>
              </div>

              {/* Directness */}
              <div className="space-y-2 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">Directness & Speed</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{profile.directness}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.directness}
                  onChange={(e) => handleUpdateSlider('directness', Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Gentle & Conversational</span>
                  <span>Balanced</span>
                  <span>Blunt & Fast</span>
                </div>
              </div>

              {/* Formality */}
              <div className="space-y-2 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">Formality Level</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{profile.formality}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.formality}
                  onChange={(e) => handleUpdateSlider('formality', Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Casual / Discord Slang</span>
                  <span>Modern Peer</span>
                  <span>Corporate Formal</span>
                </div>
              </div>

              {/* Sarcasm */}
              <div className="space-y-2 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200">Sarcasm & Banter</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{profile.sarcasm}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={profile.sarcasm}
                  onChange={(e) => handleUpdateSlider('sarcasm', Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Zero Sarcasm</span>
                  <span>Occasional Quips</span>
                  <span>Spicy Banter</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SYNAPTIC DIRECTIVES (CRUD RULES) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'directives' && (
        <div className="space-y-5">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider mb-1">
              Synaptic Directives Engine
            </h4>
            <p className="text-xs text-zinc-400">
              Synaptic Directives are persistent, non-negotiable behavioral rules that govern Aether across all workflows.
            </p>

            <form onSubmit={handleAddDirective} className="mt-4 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. Always include type definitions with code snippets..."
                value={newDirectiveText}
                onChange={(e) => setNewDirectiveText(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
              />
              <select
                value={directiveCategory}
                onChange={(e: any) => setDirectiveCategory(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-300 focus:outline-none"
              >
                <option value="custom">Custom</option>
                <option value="technical">Technical</option>
                <option value="communication">Communication</option>
                <option value="identity">Identity</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={14} /> Add Directive
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {(profile.synapticDirectives || []).map((dir, idx) => (
              <div
                key={dir.id}
                className="flex items-center justify-between p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-lg hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                  <span className="text-xs font-mono text-purple-400 font-bold mt-0.5">{idx + 1}.</span>
                  <div>
                    <p className={`text-xs ${dir.enabled ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>
                      {dir.text}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850">
                      {dir.category || 'custom'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      aetherPersonalitySystem.toggleDirective(dir.id);
                      setProfile(aetherPersonalitySystem.getActiveProfile());
                    }}
                    className={`px-2 py-1 text-[10px] font-semibold rounded border transition-colors ${
                      dir.enabled
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}
                  >
                    {dir.enabled ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => {
                      aetherPersonalitySystem.deleteDirective(dir.id);
                      setProfile(aetherPersonalitySystem.getActiveProfile());
                    }}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. USER-OWNED AI CREDENTIALS & BILLING SEPARATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-950/20 via-zinc-900 to-zinc-950 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                  User-Owned AI Credential Architecture
                </span>
                <h4 className="text-sm font-bold text-zinc-100 mt-1 flex items-center gap-2">
                  Billable AI Provider Authentication & Quota
                </h4>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed mt-1">
                  Aether operates with strict credential boundaries. Normal AI usage and Google Search grounding utilize <strong>your own Google AI Studio credentials</strong>, ensuring your requests never depend on or get throttled by developer quotas.
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Key className="text-amber-400" size={22} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Current Status:</span>
                {credState.validationStatus === 'CONNECTED' ? (
                  <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1">
                    <ShieldCheck size={12} /> Connected ({credState.maskedKeyHint})
                  </span>
                ) : credState.validationStatus === 'VALIDATING' ? (
                  <span className="text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1 animate-pulse">
                    <RefreshCw size={12} className="animate-spin" /> Validating Key...
                  </span>
                ) : credState.validationStatus === 'AUTHENTICATION_FAILED' ? (
                  <span className="text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1">
                    <ShieldAlert size={12} /> Authentication Failed
                  </span>
                ) : (
                  <span className="text-zinc-400 bg-zinc-800/50 border border-zinc-700 px-2 py-0.5 rounded font-mono">
                    Unconfigured (Setup Required)
                  </span>
                )}
              </div>

              {credState.credentialConfigured && (
                <button
                  onClick={handleRemoveKey}
                  className="text-red-400 hover:text-red-300 font-medium text-xs transition-colors"
                >
                  Disconnect Key
                </button>
              )}
            </div>
          </div>

          {/* Key Input / Connect Card */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Google Gemini API Key (Google AI Studio)</h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Get your free personal API key with high rate limits directly from Google AI Studio.
                </p>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                Get Gemini Key <ExternalLink size={12} />
              </a>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your Gemini API key (AIzaSy...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleValidateAndSaveKey}
                  disabled={isValidatingKey || !apiKeyInput.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isValidatingKey ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={13} /> Verify & Connect
                    </>
                  )}
                </button>
              </div>

              {keyFeedback && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    keyFeedback.success
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-950/20 border-red-500/30 text-red-300'
                  }`}
                >
                  {keyFeedback.success ? <ShieldCheck size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
                  <span>{keyFeedback.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Architectural Distinction between OAuth and Gemini API */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Globe size={14} className="text-blue-400" /> Google OAuth vs. Gemini API
              </h5>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                <strong>Google Account OAuth:</strong> Authorizes user-level workspace access to personal resources like Google Calendar, Gmail, and Drive.
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                <strong>Gemini API Key:</strong> Authorizes raw LLM inference, Google Search grounding, code generation, and multi-turn reasoning tokens.
              </p>
            </div>

            <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Security & Storage Guarantee
              </h5>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Your API key is never transmitted to third parties or logged in public telemetry. It is stored securely in your private browser sandbox and only forwarded via encrypted headers to server-side model proxies.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. CAPABILITY REGISTRY & GATING */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'capabilities' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider mb-1">
              Aether Modular Capability Registry
            </h4>
            <p className="text-xs text-zinc-400">
              Every Aether action explicitly declares its required dependencies, authentication providers, and graceful fallback modes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {capabilities.map((cap) => (
              <div
                key={cap.id}
                className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-zinc-700 transition-all"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">{cap.name}</span>
                    <span className="text-[9px] font-mono uppercase bg-zinc-950 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800">
                      {cap.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{cap.description}</p>
                  {cap.requiredDependencies.map((dep, dIdx) => (
                    <p key={dIdx} className="text-[10px] text-zinc-500 font-mono">
                      • Requires: <span className="text-zinc-300">{dep.name}</span> ({dep.description})
                    </p>
                  ))}
                  {cap.fallbackProvider && (
                    <p className="text-[10px] text-zinc-500">
                      • Fallback Mode: <span className="text-cyan-400">{cap.fallbackProvider}</span>
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {cap.isAvailable ? (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <Check size={13} /> Active & Verified
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-950/40 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                        <AlertCircle size={13} /> Needs Setup
                      </span>
                      {cap.blockerReason && (
                        <p className="text-[9px] text-amber-500/80 mt-1 max-w-xs">{cap.blockerReason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
