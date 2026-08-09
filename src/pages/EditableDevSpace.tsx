import React, { useState } from 'react';
import {
  Palette,
  Layout,
  Type,
  Bot,
  Wrench,
  Code2,
  History,
  FolderDown,
  Globe,
  ShieldAlert,
  Plus,
  Trash,
  RotateCcw,
  Check,
  Copy,
  Download,
  Upload,
  Play,
  Sparkles,
  Eye,
  Sliders,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { isElectron } from '../lib/electronBridge';
import { useDevSpaceInstance } from '../context/DevSpaceInstanceContext';
import {
  DevSpaceInstanceProfile,
  ThemeOverrides,
  LayoutOverrides,
  AetherPersonalityConfig,
  CustomToolDef,
  CustomIntegrationDef,
  CustomAgentDef,
  DEFAULT_THEME_OVERRIDES,
  DEFAULT_LAYOUT_OVERRIDES,
  aetherInstanceEngine,
} from '../lib/aetherInstanceEngine';

export function EditableDevSpace() {
  const {
    isEditableMode,
    toggleEditableMode,
    isSafeMode,
    toggleSafeMode,
    activeProfile,
    allProfiles,
    updateProfile,
    setActiveProfileId,
    createNewProfile,
    createSnapshot,
    rollbackSnapshot,
    importProfile,
    exportProfile,
    getLabel,
    executeCustomTool,
    executeCustomIntegration,
    getSecurityLogs,
    logSecurityEvent,
    getCapabilityManifest,
    activeProposal,
    setProposal,
    applyProposal,
    communityProfiles,
  } = useDevSpaceInstance();

  const [toolExecResults, setToolExecResults] = useState<Record<string, { output: string; isError?: boolean }>>({});
  const [integExecResults, setIntegExecResults] = useState<Record<string, { output: string; isError?: boolean }>>({});

  const [activeTab, setActiveTab] = useState<
    'studio' | 'theme' | 'layout' | 'text' | 'aether' | 'tools' | 'code' | 'versions' | 'profiles' | 'explore' | 'security' | 'safe'
  >('studio');

  const [promptInput, setPromptInput] = useState<string>('');
  const [selectedContextTag, setSelectedContextTag] = useState<string | null>(null);

  const [jsonText, setJsonText] = useState<string>(exportProfile());
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [newSnapshotLabel, setNewSnapshotLabel] = useState<string>('');
  const [newProfileName, setNewProfileName] = useState<string>('');
  const [newProfileDesc, setNewProfileDesc] = useState<string>('');
  const [showNewProfileModal, setShowNewProfileModal] = useState<boolean>(false);
  const [importJsonInput, setImportJsonInput] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Tool Form State
  const [newTool, setNewTool] = useState<{ name: string; description: string; category: string; code: string }>({
    name: '',
    description: '',
    category: 'Utilities',
    code: 'function runTool(input) { return "Processed: " + input; }',
  });

  // New Integration Form State
  const [newInteg, setNewInteg] = useState<{ name: string; providerType: 'REST API' | 'Webhook' | 'Custom AI' | 'MCP Service'; endpoint: string; secretKey: string }>({
    name: '',
    providerType: 'REST API',
    endpoint: 'https://api.example.com/v1',
    secretKey: '',
  });

  // New Agent Form State
  const [newAgent, setNewAgent] = useState<{ name: string; purpose: string; instructions: string }>({
    name: '',
    purpose: '',
    instructions: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleThemeChange = (key: keyof ThemeOverrides, value: any) => {
    updateProfile(
      {
        themeOverrides: {
          ...activeProfile.themeOverrides,
          [key]: value,
        },
      },
      `Updated theme property: ${key}`
    );
  };

  const handleLayoutChange = (key: keyof LayoutOverrides, value: any) => {
    updateProfile(
      {
        layoutOverrides: {
          ...activeProfile.layoutOverrides,
          [key]: value,
        },
      },
      `Updated layout property: ${key}`
    );
  };

  const handleTextOverrideChange = (key: string, value: string) => {
    const textOverrides = { ...activeProfile.textOverrides };
    if (!value.trim()) {
      delete textOverrides[key];
    } else {
      textOverrides[key] = value;
    }
    updateProfile({ textOverrides }, `Updated label override for "${key}"`);
  };

  const handleAetherPersonalityChange = (key: keyof AetherPersonalityConfig, value: any) => {
    updateProfile(
      {
        aetherPersonality: {
          ...activeProfile.aetherPersonality,
          [key]: value,
        },
      },
      `Updated Aether personality: ${key}`
    );
  };

  const handleAddTool = () => {
    if (!newTool.name.trim()) return;
    const toolDef: CustomToolDef = {
      id: `tool-${Date.now()}`,
      name: newTool.name,
      description: newTool.description,
      category: newTool.category,
      customCodeSnippet: newTool.code,
      createdAt: Date.now(),
    };
    updateProfile(
      { customTools: [toolDef, ...(activeProfile.customTools || [])] },
      `Added custom tool: ${newTool.name}`
    );
    setNewTool({ name: '', description: '', category: 'Utilities', code: '' });
    showToast(`Added Custom Tool "${toolDef.name}"`);
  };

  const handleAddIntegration = () => {
    if (!newInteg.name.trim()) return;
    const integDef: CustomIntegrationDef = {
      id: `integ-${Date.now()}`,
      name: newInteg.name,
      providerType: newInteg.providerType,
      endpoint: newInteg.endpoint,
      capabilities: ['Execute Query', 'Stream Webhook'],
      secretKeyRef: newInteg.secretKey ? 'SECURE_STORED' : undefined,
      createdAt: Date.now(),
    };
    updateProfile(
      { customIntegrations: [integDef, ...(activeProfile.customIntegrations || [])] },
      `Added custom integration: ${newInteg.name}`
    );
    setNewInteg({ name: '', providerType: 'REST API', endpoint: '', secretKey: '' });
    showToast(`Added Custom Integration "${integDef.name}"`);
  };

  const handleAddAgent = () => {
    if (!newAgent.name.trim()) return;
    const agentDef: CustomAgentDef = {
      id: `agent-${Date.now()}`,
      name: newAgent.name,
      purpose: newAgent.purpose,
      model: 'gemini-2.5-flash',
      systemInstructions: newAgent.instructions,
      autonomyLevel: 'balanced',
      toolsAllowed: [],
      createdAt: Date.now(),
    };
    updateProfile(
      { customAgents: [agentDef, ...(activeProfile.customAgents || [])] },
      `Added custom AI Agent: ${newAgent.name}`
    );
    setNewAgent({ name: '', purpose: '', instructions: '' });
    showToast(`Added Custom AI Agent "${agentDef.name}"`);
  };

  const handleSaveJsonCode = () => {
    try {
      const parsed = JSON.parse(jsonText);
      updateProfile(parsed, 'Direct JSON Code Editor update');
      setJsonError(null);
      showToast('Profile updated directly from JSON Code Sandbox');
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  if (!isElectron()) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Sliders size={48} />
        </div>
        <h1 className="text-2xl font-black text-white">Editable DevSpace is a Desktop-Only Feature</h1>
        <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
          The isolated runtime engine, live CSS theme controls, sandboxed custom tools, and Aether Context Mode editing are exclusive to the packaged DevSpace Desktop application.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer shadow-lg"
        >
          Return to Workspace Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-6 flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-500 text-black px-4 py-2 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles size={16} /> {toastMessage}
        </div>
      )}

      {/* HEADER & TOP CONTROL BAR */}
      <div className="glass-card p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-2">
              <Sliders size={22} className="text-cyan-400" /> Editable DevSpace & Aether Sandbox
            </h1>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                isEditableMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isEditableMode ? 'Customization Active' : 'Standard Runtime'}
            </span>
            {isSafeMode && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <ShieldAlert size={12} /> Safe Mode Active
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Customize layout, themes, tools, agents, and Aether behavior in your own isolated instance profile.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Profile Selector */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold">Profile:</span>
            <select
              value={activeProfile.id}
              onChange={(e) => setActiveProfileId(e.target.value)}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                  {p.name} ({p.version})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowNewProfileModal(true)}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
          >
            <Plus size={14} /> New Profile
          </button>

          <button
            onClick={toggleSafeMode}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              isSafeMode
                ? 'bg-rose-500 text-white shadow-lg'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
            }`}
          >
            <ShieldAlert size={14} /> {isSafeMode ? 'Disable Safe Mode' : 'Safe Mode'}
          </button>
        </div>
      </div>

      {/* PROPOSAL MODAL (If Aether or Context Mode submits a modification) */}
      {activeProposal && (
        <div className="glass-card bg-cyan-950/40 border border-cyan-500/50 p-5 rounded-2xl flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-400" />
              <h3 className="text-sm font-bold text-cyan-200 uppercase tracking-wider">
                Aether Modification Proposal: {activeProposal.title}
              </h3>
            </div>
            <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold uppercase">
              Target: {activeProposal.targetComponent}
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">{activeProposal.description}</p>

          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 text-xs font-mono space-y-1">
            <div className="text-zinc-500 text-[10px] uppercase font-bold">Proposed Overrides Preview:</div>
            {activeProposal.proposedTheme && (
              <div>Theme: {JSON.stringify(activeProposal.proposedTheme)}</div>
            )}
            {activeProposal.proposedLayout && (
              <div>Layout: {JSON.stringify(activeProposal.proposedLayout)}</div>
            )}
            {activeProposal.proposedText && (
              <div>Text Labels: {JSON.stringify(activeProposal.proposedText)}</div>
            )}
            {activeProposal.proposedPersonality && (
              <div>Aether Personality: {JSON.stringify(activeProposal.proposedPersonality)}</div>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              onClick={() => setProposal(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
            >
              Cancel Proposal
            </button>
            <button
              onClick={() => applyProposal(activeProposal)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} /> Apply Instance Change
            </button>
          </div>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-850">
        {[
          { id: 'studio', label: '✨ Studio & Conversational AI', icon: Sparkles },
          { id: 'theme', label: '🎨 Theme & Styling', icon: Palette },
          { id: 'layout', label: '📐 Layout & Structure', icon: Layout },
          { id: 'text', label: '✍️ Text Overrides', icon: Type },
          { id: 'aether', label: '🤖 Aether & Agents', icon: Bot },
          { id: 'tools', label: '🛠️ Custom Tools', icon: Wrench },
          { id: 'code', label: '📝 JSON Sandbox', icon: Code2 },
          { id: 'versions', label: '⏳ Versions & Rollback', icon: History },
          { id: 'profiles', label: '📦 Profiles & Export', icon: FolderDown },
          { id: 'explore', label: '🌐 Community Explore', icon: Globe },
          { id: 'security', label: '🔒 Security & Audit', icon: Lock },
          { id: 'safe', label: '🛡️ Recovery & Safe Mode', icon: ShieldAlert },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'code') setJsonText(exportProfile());
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-black shadow-md'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 0. STUDIO & CONVERSATIONAL AI */}
      {activeTab === 'studio' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Aether Context Mode & Conversational UI Studio</h3>
                <p className="text-xs text-zinc-400">
                  Speak or type natural language directives to modify theme colors, layout ordering, tab visibility, or control labels in real time.
                </p>
              </div>
            </div>

            {/* Prompt Input Box */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700 p-2 rounded-2xl focus-within:border-cyan-500 transition-all">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && promptInput.trim()) {
                      const proposal = aetherInstanceEngine.generateProposalFromPrompt(promptInput, activeProfile, selectedContextTag || undefined);
                      setProposal(proposal);
                      showToast(`Generated UI proposal: "${proposal.title}"`);
                      setPromptInput('');
                    }
                  }}
                  placeholder={selectedContextTag ? `Instruct Aether regarding "${selectedContextTag}"...` : "e.g. 'Make interface yellow', 'Move Projects above Issues', 'Hide Roadmap tab'"}
                  className="w-full bg-transparent text-sm text-white px-3 py-1.5 outline-none"
                />
                <button
                  onClick={() => {
                    if (promptInput.trim()) {
                      const proposal = aetherInstanceEngine.generateProposalFromPrompt(promptInput, activeProfile, selectedContextTag || undefined);
                      setProposal(proposal);
                      showToast(`Generated UI proposal: "${proposal.title}"`);
                      setPromptInput('');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> Generate Proposal
                </button>
              </div>

              {/* Context Tag Selector */}
              <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                <span className="text-zinc-500 text-[10px] font-bold uppercase font-mono">Target Context:</span>
                {['Global UI Runtime', 'Projects Tab', 'Sidebar Nav', 'Issues Kanban', 'Header Bar'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedContextTag(selectedContextTag === tag ? null : tag)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      selectedContextTag === tag
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedContextTag && (
                  <button onClick={() => setSelectedContextTag(null)} className="text-[10px] text-rose-400 underline ml-1 cursor-pointer">
                    Clear Selection
                  </button>
                )}
              </div>

              {/* Quick Preset Directive Buttons */}
              <div className="space-y-2 pt-3">
                <div className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Quick Preset Directives:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { label: '✨ Make Interface High-Contrast Yellow', prompt: 'Make interface yellow' },
                    { label: '📐 Move Projects Above Issues', prompt: 'Move projects above issues' },
                    { label: '🏷️ Relabel Projects to Mission Control', prompt: 'Call Projects Mission Control' },
                    { label: '🗜️ Enable Compact Sidebar & Cards', prompt: 'Make sidebar compact layout' },
                    { label: '👁️ Hide Roadmap Navigation Tab', prompt: 'Hide Roadmap tab' },
                    { label: '🌙 Switch to Dark Space Charcoal', prompt: 'Switch to dark theme' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        const proposal = aetherInstanceEngine.generateProposalFromPrompt(preset.prompt, activeProfile, selectedContextTag || undefined);
                        setProposal(proposal);
                        showToast(`Generated UI proposal: "${proposal.title}"`);
                      }}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-850 text-left text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span>{preset.label}</span>
                      <Play size={12} className="text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. THEME & STYLING */}
      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Palette size={16} className="text-cyan-400" /> Color Palette Overrides
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Primary Color Accent</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={activeProfile.themeOverrides.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={activeProfile.themeOverrides.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-white font-mono w-32"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Secondary Accent</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={activeProfile.themeOverrides.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={activeProfile.themeOverrides.accentColor}
                    onChange={(e) => handleThemeChange('accentColor', e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-white font-mono w-32"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Background Theme</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={activeProfile.themeOverrides.backgroundColor}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={activeProfile.themeOverrides.backgroundColor}
                    onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-white font-mono w-32"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Card Container Background</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={activeProfile.themeOverrides.cardBackgroundColor}
                    onChange={(e) => handleThemeChange('cardBackgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={activeProfile.themeOverrides.cardBackgroundColor}
                    onChange={(e) => handleThemeChange('cardBackgroundColor', e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-white font-mono w-32"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Type size={16} className="text-cyan-400" /> Typography & Layout Density
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Font Family</label>
                <select
                  value={activeProfile.themeOverrides.fontFamily}
                  onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-white outline-none cursor-pointer font-bold"
                >
                  <option value="Inter">Inter (Clean Modern)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (SaaS Display)</option>
                  <option value="JetBrains Mono">JetBrains Mono (Developer Console)</option>
                  <option value="Playfair Display">Playfair Display (Editorial)</option>
                  <option value="System Default">System Default</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Border Radius ({activeProfile.themeOverrides.borderRadiusPx}px)</label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={activeProfile.themeOverrides.borderRadiusPx}
                  onChange={(e) => handleThemeChange('borderRadiusPx', Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">UI Spacing Density</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'comfortable', 'spacious'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => handleThemeChange('density', d)}
                      className={`py-2 rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer ${
                        activeProfile.themeOverrides.density === d
                          ? 'bg-cyan-500 text-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Visual Atmosphere Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dark', label: 'Dark Mode' },
                    { id: 'cyberpunk-neon', label: 'Cyberpunk Neon' },
                    { id: 'midnight-luxury', label: 'Midnight Luxury' },
                    { id: 'light', label: 'Light Mode' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleThemeChange('colorMode', mode.id)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
                        activeProfile.themeOverrides.colorMode === mode.id
                          ? 'bg-cyan-500 text-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LAYOUT & STRUCTURE */}
      {activeTab === 'layout' && (
        <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-5 animate-fadeIn">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layout size={16} className="text-cyan-400" /> Navigation & Section Visibility
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-400 mb-3">
                Toggle section visibility in your instance navigation sidebar:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  'Dashboard',
                  'Projects',
                  'Issues',
                  'Aether Hub',
                  'Notes',
                  'Roadmap',
                  'Automations',
                  'Brain',
                  'Design',
                  'Community',
                  'Settings',
                ].map((sec) => {
                  const isHidden = (activeProfile.layoutOverrides.hiddenSections || []).includes(sec);
                  return (
                    <button
                      key={sec}
                      onClick={() => {
                        const currentHidden = activeProfile.layoutOverrides.hiddenSections || [];
                        const nextHidden = isHidden
                          ? currentHidden.filter((h) => h !== sec)
                          : [...currentHidden, sec];
                        handleLayoutChange('hiddenSections', nextHidden);
                      }}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isHidden
                          ? 'bg-zinc-900/40 text-zinc-600 border-zinc-850 line-through'
                          : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-cyan-500/40'
                      }`}
                    >
                      <span>{getLabel(sec)}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${isHidden ? 'bg-rose-950/60 text-rose-400' : 'bg-emerald-950/60 text-emerald-400'}`}>
                        {isHidden ? 'Hidden' : 'Visible'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-850 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Compact Item Cards</h4>
                  <p className="text-[10px] text-zinc-500">Reduces vertical padding on cards across all views.</p>
                </div>
                <input
                  type="checkbox"
                  checked={activeProfile.layoutOverrides.compactCards || false}
                  onChange={(e) => handleLayoutChange('compactCards', e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Sidebar Glass Blur</h4>
                  <p className="text-[10px] text-zinc-500">Applies backdrop blur effect to sidebars.</p>
                </div>
                <input
                  type="checkbox"
                  checked={activeProfile.themeOverrides.panelBlur !== false}
                  onChange={(e) => handleThemeChange('panelBlur', e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TEXT OVERRIDES */}
      {activeTab === 'text' && (
        <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Type size={16} className="text-cyan-400" /> UI Text & Section Label Customization
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Customize key interface headings and labels for your personal instance without altering core code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { default: 'Projects', placeholder: 'e.g. Missions or Workspaces' },
              { default: 'Issues', placeholder: 'e.g. Task Backlog or Glitches' },
              { default: 'Aether Hub', placeholder: 'e.g. AI Co-Pilot or Neural Command' },
              { default: 'Notes', placeholder: 'e.g. Knowledge Base or Scratchpad' },
              { default: 'Roadmap', placeholder: 'e.g. Release Milestones' },
              { default: 'Automations', placeholder: 'e.g. Workflow Triggers' },
            ].map((item) => (
              <div key={item.default} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase font-mono">
                    Canonical Label: "{item.default}"
                  </span>
                  {activeProfile.textOverrides[item.default] && (
                    <span className="text-[9px] bg-cyan-950/60 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      Customized
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={activeProfile.textOverrides[item.default] || ''}
                  onChange={(e) => handleTextOverrideChange(item.default, e.target.value)}
                  placeholder={item.placeholder}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-500/50"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. AETHER PERSONALITY & CUSTOM AGENTS */}
      {activeTab === 'aether' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bot size={16} className="text-cyan-400" /> Custom Aether Personality
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-bold block mb-1">Co-Pilot Name</label>
                <input
                  type="text"
                  value={activeProfile.aetherPersonality.name}
                  onChange={(e) => handleAetherPersonalityChange('name', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-white outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Tone</label>
                  <select
                    value={activeProfile.aetherPersonality.tone}
                    onChange={(e) => handleAetherPersonalityChange('tone', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="professional">Professional</option>
                    <option value="concise">Concise</option>
                    <option value="friendly">Friendly</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 font-bold block mb-1">Proactivity</label>
                  <select
                    value={activeProfile.aetherPersonality.proactivity}
                    onChange={(e) => handleAetherPersonalityChange('proactivity', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-white outline-none cursor-pointer"
                  >
                    <option value="reactive">Reactive (On Demand)</option>
                    <option value="suggestive">Suggestive (Guided)</option>
                    <option value="autonomous">Autonomous (Proactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-bold block mb-1">Custom System Instructions</label>
                <textarea
                  rows={4}
                  value={activeProfile.aetherPersonality.customInstructions}
                  onChange={(e) => handleAetherPersonalityChange('customInstructions', e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white outline-none text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus size={16} className="text-cyan-400" /> Custom AI Agents ({activeProfile.customAgents?.length || 0})
            </h3>

            <div className="space-y-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <input
                type="text"
                placeholder="Agent Name (e.g. Code Reviewer)"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none"
              />
              <input
                type="text"
                placeholder="Purpose (e.g. Performs automated static analysis)"
                value={newAgent.purpose}
                onChange={(e) => setNewAgent({ ...newAgent, purpose: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none"
              />
              <textarea
                rows={2}
                placeholder="System instructions..."
                value={newAgent.instructions}
                onChange={(e) => setNewAgent({ ...newAgent, instructions: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 p-2 rounded-lg text-xs text-white outline-none"
              />
              <button
                onClick={handleAddAgent}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                + Register Agent
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(activeProfile.customAgents || []).map((ag) => (
                <div key={ag.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{ag.name}</div>
                    <div className="text-[10px] text-zinc-400">{ag.purpose}</div>
                  </div>
                  <button
                    onClick={() => {
                      const remainder = activeProfile.customAgents.filter((a) => a.id !== ag.id);
                      updateProfile({ customAgents: remainder }, `Deleted agent ${ag.name}`);
                    }}
                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. CUSTOM TOOLS & INTEGRATIONS */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Custom Tools */}
          <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wrench size={16} className="text-cyan-400" /> Custom Local Tools
            </h3>

            <div className="space-y-2 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-xs">
              <input
                type="text"
                placeholder="Tool Name (e.g. CSV Exporter)"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 text-white outline-none"
              />
              <input
                type="text"
                placeholder="Description"
                value={newTool.description}
                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 text-white outline-none"
              />
              <textarea
                rows={3}
                placeholder="JavaScript Function Snippet..."
                value={newTool.code}
                onChange={(e) => setNewTool({ ...newTool, code: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 p-2 rounded-lg font-mono text-[10px] text-zinc-300 outline-none"
              />
              <button
                onClick={handleAddTool}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                + Register Local Tool
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(activeProfile.customTools || []).map((t) => (
                <div key={t.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {t.name}
                        <span className="text-[9px] bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                          Sandboxed
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400">{t.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const res = executeCustomTool(t, 'Test Payload Data');
                          setToolExecResults((prev) => ({
                            ...prev,
                            [t.id]: { output: res.result || res.error || 'Execution finished', isError: !res.success },
                          }));
                        }}
                        className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold rounded cursor-pointer transition-colors"
                      >
                        Run Test
                      </button>
                      <button
                        onClick={() => {
                          const remainder = activeProfile.customTools.filter((x) => x.id !== t.id);
                          updateProfile({ customTools: remainder }, `Deleted tool ${t.name}`);
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>

                  {toolExecResults[t.id] && (
                    <div className={`p-2 rounded font-mono text-[10px] ${toolExecResults[t.id].isError ? 'bg-rose-950/60 text-rose-300 border border-rose-800' : 'bg-black/60 text-emerald-300 border border-emerald-900/50'}`}>
                      Output: {toolExecResults[t.id].output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Integrations */}
          <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" /> Custom API & Webhook Integrations
            </h3>

            <div className="space-y-2 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-xs">
              <input
                type="text"
                placeholder="Integration Name (e.g. Stripe Webhook)"
                value={newInteg.name}
                onChange={(e) => setNewInteg({ ...newInteg, name: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 text-white outline-none"
              />
              <input
                type="text"
                placeholder="Endpoint URL (e.g. https://api.stripe.com/v1)"
                value={newInteg.endpoint}
                onChange={(e) => setNewInteg({ ...newInteg, endpoint: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 text-white outline-none"
              />
              <input
                type="password"
                placeholder="API Key / Secret Header (Encrypted / Stripped on Export)"
                value={newInteg.secretKey}
                onChange={(e) => setNewInteg({ ...newInteg, secretKey: e.target.value })}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2 text-white outline-none"
              />
              <button
                onClick={handleAddIntegration}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                + Connect Integration
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(activeProfile.customIntegrations || []).map((i) => (
                <div key={i.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{i.name} ({i.providerType})</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{i.endpoint}</div>
                      <div className="text-[9px] text-emerald-400 font-bold mt-0.5">
                        {i.secretKeyRef ? '🔒 Secret Masked & Protected' : 'Public Endpoint'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const res = await executeCustomIntegration(i);
                          setIntegExecResults((prev) => ({
                            ...prev,
                            [i.id]: { output: res.responseText || res.error || `HTTP ${res.statusCode}`, isError: !res.success },
                          }));
                        }}
                        className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold rounded cursor-pointer transition-colors"
                      >
                        Ping Endpoint
                      </button>
                      <button
                        onClick={() => {
                          const remainder = activeProfile.customIntegrations.filter((x) => x.id !== i.id);
                          updateProfile({ customIntegrations: remainder }, `Deleted integration ${i.name}`);
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>

                  {integExecResults[i.id] && (
                    <div className={`p-2 rounded font-mono text-[10px] ${integExecResults[i.id].isError ? 'bg-rose-950/60 text-rose-300 border border-rose-800' : 'bg-black/60 text-emerald-300 border border-emerald-900/50'}`}>
                      Response: {integExecResults[i.id].output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. JSON CODE SANDBOX */}
      {activeTab === 'code' && (
        <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code2 size={16} className="text-cyan-400" /> Direct Profile JSON Editor
              </h3>
              <p className="text-xs text-zinc-400">
                Inspect and safely edit the complete raw schema for profile "{activeProfile.name}".
              </p>
            </div>
            <button
              onClick={handleSaveJsonCode}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} /> Apply JSON Changes
            </button>
          </div>

          {jsonError && (
            <div className="bg-rose-950/60 border border-rose-500/30 p-3 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle size={16} /> JSON Syntax Error: {jsonError}
            </div>
          )}

          <textarea
            rows={18}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            className="w-full bg-[#050508] border border-zinc-800 p-4 rounded-xl font-mono text-xs text-cyan-300 outline-none leading-relaxed focus:border-cyan-500/50"
          />
        </div>
      )}

      {/* 7. VERSIONS & ROLLBACK */}
      {activeTab === 'versions' && (
        <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History size={16} className="text-cyan-400" /> Profile Snapshot Timeline & Rollback
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Save version snapshots and restore prior instance configurations instantly.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Snapshot Label (e.g. Pre-Cyberpunk)"
                value={newSnapshotLabel}
                onChange={(e) => setNewSnapshotLabel(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs text-white outline-none w-48"
              />
              <button
                onClick={() => {
                  if (!newSnapshotLabel.trim()) return;
                  createSnapshot(newSnapshotLabel);
                  setNewSnapshotLabel('');
                  showToast('Version snapshot saved!');
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                + Save Snapshot
              </button>
            </div>
          </div>

          {/* Snapshot History List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase font-mono">Saved Version Snapshots ({activeProfile.versionHistory?.length || 0})</h4>
            {activeProfile.versionHistory && activeProfile.versionHistory.length > 0 ? (
              <div className="space-y-2">
                {activeProfile.versionHistory.map((snap) => (
                  <div key={snap.version} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{snap.label}</span>
                        <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                          {snap.version}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">
                        Saved: {new Date(snap.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        rollbackSnapshot(snap.version);
                        showToast(`Rolled back to ${snap.label} (${snap.version})`);
                      }}
                      className="bg-zinc-800 hover:bg-cyan-500 hover:text-black text-zinc-300 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <RotateCcw size={12} /> Rollback
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                No version snapshots recorded yet. Click "Save Snapshot" to capture current state.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. PROFILES & IMPORT/EXPORT */}
      {activeTab === 'profiles' && (
        <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FolderDown size={16} className="text-cyan-400" /> Profile Manager & Import / Export
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Export your DevSpace configuration to JSON or import profiles shared by other developers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([exportProfile()], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${activeProfile.name.toLowerCase().replace(/\s+/g, '-')}-profile.json`;
                  a.click();
                  showToast('Downloaded profile JSON file.');
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download size={14} /> Export JSON
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Upload size={14} /> Import Profile JSON
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase font-mono">Your Saved Instance Profiles ({allProfiles.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allProfiles.map((p) => (
                <div key={p.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${p.id === activeProfile.id ? 'bg-cyan-950/20 border-cyan-500/40' : 'bg-zinc-900 border-zinc-800'}`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{p.name}</h4>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded font-bold">{p.version}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono">
                    <span>By: {p.author}</span>
                    {p.id !== activeProfile.id && (
                      <button
                        onClick={() => {
                          setActiveProfileId(p.id);
                          showToast(`Switched to profile "${p.name}"`);
                        }}
                        className="text-cyan-400 font-bold hover:underline cursor-pointer"
                      >
                        Activate Profile →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. COMMUNITY EXPLORE HUB */}
      {activeTab === 'explore' && (
        <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" /> Community Explore Hub
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Discover and 1-click import pre-built DevSpace & Aether instance templates. Imported templates are isolated personal copies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {communityProfiles.map((cp) => (
              <div key={cp.id} className="glass-card bg-zinc-900/60 p-5 rounded-xl border border-zinc-800 flex flex-col justify-between gap-4 hover:border-cyan-500/30 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/20 font-bold uppercase font-mono">
                        {cp.version}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold uppercase font-mono">
                        Starter Template
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">By @{cp.author}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5">{cp.name}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{cp.description}</p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1 flex-wrap">
                    {(cp.tags || []).map((t) => (
                      <span key={t} className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const res = importProfile(JSON.stringify(cp));
                      if (res.success) {
                        showToast(`Successfully imported isolated copy of "${cp.name}"`);
                      }
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md"
                  >
                    <Download size={12} /> Import
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. SECURITY & AUDIT LOGS */}
      {activeTab === 'security' && (
        <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock size={16} className="text-cyan-400" /> Security Audit Kernel & Capability Manifest
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Inspect security capabilities, SSRF protections, sandboxed executions, and audit trails for this profile instance.
              </p>
            </div>
            <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold font-mono uppercase">
              Sandbox & SSRF Active
            </span>
          </div>

          {/* Capability Manifest */}
          {(() => {
            const manifest = getCapabilityManifest(activeProfile);
            const logs = getSecurityLogs();
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block mb-1">Declared Capabilities</span>
                    <div className="text-lg font-bold text-cyan-300 font-mono">
                      {manifest.requestedCapabilities.length}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      {manifest.requestedCapabilities.length > 0 ? (
                        manifest.requestedCapabilities.map((cap: string) => (
                          <span key={cap} className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                            {cap}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic">None (Least Privilege)</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block mb-1">SSRF Boundary Status</span>
                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                      <ShieldAlert size={14} /> Active Protection
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">
                      {manifest.hasLocalNetworkAccess ? '⚠️ Local Network Access Allowed' : '🔒 Loopback & Private IPs Blocked'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block mb-1">Secrets Protection</span>
                    <div className="text-sm font-bold text-amber-300 flex items-center gap-1 mt-1">
                      <Lock size={14} /> Masked & Isolated
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">
                      {manifest.hasSecretsConfigured ? '🔒 Environment Secret Ref Configured' : 'No Plaintext Secrets Stored'}
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block mb-1">Execution Sandbox</span>
                    <div className="text-sm font-bold text-purple-300 flex items-center gap-1 mt-1">
                      <Code2 size={14} /> Isolated Worker Scope
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">No DOM / Token access granted</p>
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Recent Security Kernel Audit Events ({logs.length})
                  </h4>
                  <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-950 text-zinc-500 font-mono text-[10px] uppercase border-b border-zinc-800">
                        <tr>
                          <th className="p-3">Time</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Actor</th>
                          <th className="p-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 font-mono text-[11px]">
                        {logs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-zinc-850/50 transition-colors">
                            <td className="p-3 text-zinc-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                log.severity === 'critical' || log.action === 'SECURITY_BLOCKED'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : log.action === 'SAFE_MODE_TOGGLED'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-3 text-zinc-400 whitespace-nowrap">{log.actor}</td>
                            <td className="p-3 text-zinc-300 truncate max-w-md">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 10. RECOVERY & SAFE MODE */}
      {activeTab === 'safe' && (
        <div className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-5 animate-fadeIn">
          <div className="flex items-center gap-3">
            <ShieldAlert size={28} className="text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Safe Mode & Instance Recovery Controls
              </h3>
              <p className="text-xs text-zinc-400">
                If a custom style, script, or override creates UI issues, toggle Safe Mode to bypass custom overrides safely.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Safe Mode Bypass</h4>
                <p className="text-[10px] text-zinc-500">Temporarily suspends custom themes and layout overrides.</p>
              </div>
              <button
                onClick={toggleSafeMode}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  isSafeMode ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {isSafeMode ? 'Active (Click to Disable)' : 'Enable Safe Mode'}
              </button>
            </div>

            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Reset Canonical Defaults</h4>
                <p className="text-[10px] text-zinc-500">Restores canonical theme and layout overrides.</p>
              </div>
              <button
                onClick={() => {
                  updateProfile(
                    {
                      themeOverrides: { ...DEFAULT_THEME_OVERRIDES },
                      layoutOverrides: { ...DEFAULT_LAYOUT_OVERRIDES },
                      textOverrides: {},
                    },
                    'Reset profile to canonical defaults'
                  );
                  showToast('Reset instance profile to canonical defaults.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-rose-500 hover:text-white text-zinc-300 cursor-pointer transition-all"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROFILE MODAL */}
      {showNewProfileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#121215] border border-zinc-800 p-6 rounded-2xl max-w-md w-full space-y-4 animate-scaleIn">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create Custom Instance Profile</h3>
            <input
              type="text"
              placeholder="Profile Name (e.g. Full-Stack Developer Suite)"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none"
            />
            <textarea
              rows={3}
              placeholder="Description..."
              value={newProfileDesc}
              onChange={(e) => setNewProfileDesc(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 p-3 rounded-xl text-xs text-white outline-none"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewProfileModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newProfileName.trim()) return;
                  createNewProfile(newProfileName, newProfileDesc);
                  setShowNewProfileModal(false);
                  setNewProfileName('');
                  setNewProfileDesc('');
                  showToast('Created new isolated instance profile!');
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT JSON MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#121215] border border-zinc-800 p-6 rounded-2xl max-w-lg w-full space-y-4 animate-scaleIn">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Import Profile JSON</h3>
            <p className="text-xs text-zinc-400">
              Paste JSON profile specification below. It will be saved as an isolated copy.
            </p>
            <textarea
              rows={8}
              placeholder="Paste JSON profile payload here..."
              value={importJsonInput}
              onChange={(e) => setImportJsonInput(e.target.value)}
              className="w-full bg-[#09090b] border border-zinc-800 p-3 rounded-xl font-mono text-xs text-cyan-300 outline-none"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const res = importProfile(importJsonInput);
                  if (res.success) {
                    setShowImportModal(false);
                    setImportJsonInput('');
                    showToast('Imported isolated profile successfully!');
                  } else {
                    alert(res.error || 'Failed to import JSON profile.');
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black cursor-pointer"
              >
                Import Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
