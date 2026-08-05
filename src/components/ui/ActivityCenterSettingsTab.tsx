import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Sliders,
  Check,
  X,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  ArrowUp,
  ArrowDown,
  Layout,
  Maximize2,
  Minimize2,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  RotateCw,
  Layers,
  CheckCircle2,
  Trash2,
  Plus,
  Terminal,
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  Radio
} from 'lucide-react';
import { useActivityCenter } from '../../hooks/useActivityCenter';
import { ActivityModuleConfig } from '../../lib/activityCenterService';

export function ActivityCenterSettingsTab() {
  const {
    config,
    offlineQueue,
    workspaceStatus,
    aiStatus,
    updateConfig,
    updateModuleConfig,
    reorderModules,
    resetConfig,
    enqueueOfflineMutation,
    processOfflineQueue,
    resolveSyncConflict,
    clearOfflineQueue,
  } = useActivityCenter();

  const [searchFilter, setSearchFilter] = useState('');
  const [activeSubSection, setActiveSubSection] = useState<'modules' | 'display' | 'offline'>('modules');

  const modules = [...(config?.modules || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const filteredModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.description.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;
    const updated = [...modules];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    reorderModules(updated);
  };

  const applyPreset = (presetName: 'minimal' | 'developer' | 'power' | 'quiet') => {
    if (presetName === 'minimal') {
      updateConfig({
        displayMode: 'minimal',
        layoutType: 'compact',
        position: 'top_center',
        transparency: 95,
        blurAmount: 20,
      });
    } else if (presetName === 'developer') {
      updateConfig({
        displayMode: 'developer',
        layoutType: 'detailed',
        position: 'top_center',
        transparency: 85,
        blurAmount: 12,
      });
    } else if (presetName === 'power') {
      updateConfig({
        displayMode: 'always_visible',
        layoutType: 'detailed',
        position: 'top_right',
        transparency: 90,
        blurAmount: 16,
      });
    } else if (presetName === 'quiet') {
      updateConfig({
        displayMode: 'auto_hide',
        layoutType: 'compact',
        position: 'top_center',
        transparency: 98,
        blurAmount: 24,
      });
    }
  };

  return (
    <div className="space-y-6 font-sans text-zinc-300 animate-fade-in">
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-yellow-950/20 via-zinc-900 to-zinc-950 border border-yellow-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-yellow-400 font-bold uppercase">
              DevSpace Signature Feature
            </span>
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded text-[9px] font-mono font-bold">
              Phase 4.4 Active
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white font-mono flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-400" /> Activity Center & Offline Workspace
          </h3>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Customize top-bar floating activity modules, visual appearance, display modes, and manage zero-latency offline SQLite sync engine queues.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => resetConfig()}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCw size={12} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#09090c] border border-zinc-850 rounded-xl text-xs font-mono">
        <button
          onClick={() => setActiveSubSection('modules')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubSection === 'modules'
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Layers size={14} />
          <span>Modules ({modules.filter((m) => m.enabled).length}/{modules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubSection('display')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubSection === 'display'
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Sliders size={14} />
          <span>Display & Appearance</span>
        </button>

        <button
          onClick={() => setActiveSubSection('offline')}
          className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
            activeSubSection === 'offline'
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
          }`}
        >
          <Cloud size={14} />
          <span>Offline Queue ({offlineQueue.filter((i) => i.status === 'pending' || i.status === 'conflict').length})</span>
          {offlineQueue.some((i) => i.status === 'conflict') && (
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping absolute top-1.5 right-2" />
          )}
        </button>
      </div>

      {/* SUB-SECTION 1: MODULE CUSTOMIZATION */}
      {activeSubSection === 'modules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-100 font-mono uppercase tracking-wider">
                Activity Center Modules
              </h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Toggle module visibility, pin critical services, or reorder item positions.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter modules..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0a0d] border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredModules.map((mod, idx) => (
              <div
                key={mod.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  mod.enabled
                    ? mod.pinned
                      ? 'bg-[#0e0e14] border-yellow-500/40 shadow-xs'
                      : 'bg-[#0d0d12] border-zinc-800 hover:border-zinc-700'
                    : 'bg-[#08080a] border-zinc-850/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveModule(idx, 'up')}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1 hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      onClick={() => moveModule(idx, 'down')}
                      disabled={idx === filteredModules.length - 1}
                      title="Move Down"
                      className="p-1 hover:bg-zinc-800 disabled:opacity-30 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-zinc-100 font-mono">
                        {mod.name}
                      </span>
                      {mod.pinned && (
                        <span className="px-1.5 py-0.2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                          <Pin size={8} /> Pinned
                        </span>
                      )}
                      <span className="text-[9px] font-mono uppercase text-zinc-500 px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 rounded">
                        {mod.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">{mod.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateModuleConfig(mod.id, { pinned: !mod.pinned })}
                    title={mod.pinned ? 'Unpin Module' : 'Pin Module'}
                    className={`p-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                      mod.pinned
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                        : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border-zinc-800'
                    }`}
                  >
                    {mod.pinned ? <Pin size={13} /> : <PinOff size={13} />}
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mod.enabled}
                      onChange={(e) => updateModuleConfig(mod.id, { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500 peer-checked:after:bg-black font-mono"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: DISPLAY & APPEARANCE */}
      {activeSubSection === 'display' && (
        <div className="space-y-6">
          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              Quick Display Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              {[
                { id: 'minimal', title: 'Minimalist', desc: 'Auto-hide, high blur' },
                { id: 'developer', title: 'Developer Mode', titleIcon: '⚡', desc: 'Live stats & tokens' },
                { id: 'power', title: 'Power User', desc: 'Always visible top-right' },
                { id: 'quiet', title: 'Quiet Mode', desc: 'Low opacity, compact' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id as any)}
                  className="p-3 bg-[#0d0d12] hover:bg-[#121218] border border-zinc-850 hover:border-yellow-500/40 rounded-xl text-left transition-all cursor-pointer space-y-1"
                >
                  <span className="font-bold text-zinc-100 text-xs block">{p.title}</span>
                  <span className="text-[10px] text-zinc-500 block">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Mode Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              Display Mode Behavior
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              {[
                { id: 'always_visible', label: 'Always Visible', desc: 'Pill is continuously displayed in top bar' },
                { id: 'auto_hide', label: 'Auto Hide', desc: 'Fades out when idle; appears on hover or task run' },
                { id: 'only_activity', label: 'Only During Activity', desc: 'Only displays when background tasks run' },
                { id: 'compact', label: 'Compact Mode', desc: 'Minimal horizontal width and icon-only indicators' },
                { id: 'expanded', label: 'Expanded Mode', desc: 'Full text labels for provider & active workers' },
                { id: 'developer', label: 'Developer Mode ⚡', desc: 'Shows live SQLite latency, tokens & thread IDs' },
              ].map((mode) => (
                <div
                  key={mode.id}
                  onClick={() => updateConfig({ displayMode: mode.id as any })}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                    config?.displayMode === mode.id
                      ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300 shadow-sm'
                      : 'bg-[#0d0d12] border-zinc-850 hover:border-zinc-750 text-zinc-300'
                  }`}
                >
                  <span className="font-extrabold text-xs block">{mode.label}</span>
                  <span className="text-[10px] text-zinc-500 block leading-tight">{mode.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Position Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
              Screen Position
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {[
                { id: 'top_left', label: 'Top Left' },
                { id: 'top_center', label: 'Top Center (Default)' },
                { id: 'top_right', label: 'Top Right' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => updateConfig({ position: pos.id as any })}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                    config?.position === pos.id
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-sm'
                      : 'bg-[#0d0d12] border-zinc-850 text-zinc-400 hover:text-white'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Fine-Tuning Sliders */}
          <div className="p-4 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider">
              Visual Fine-Tuning
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Transparency */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Pill Opacity</span>
                  <span className="text-yellow-400 font-bold">{config?.transparency ?? 90}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={config?.transparency ?? 90}
                  onChange={(e) => updateConfig({ transparency: Number(e.target.value) })}
                  className="w-full accent-yellow-500 cursor-pointer"
                />
              </div>

              {/* Blur Intensity */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Backdrop Blur</span>
                  <span className="text-yellow-400 font-bold">{config?.blurAmount ?? 16} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={config?.blurAmount ?? 16}
                  onChange={(e) => updateConfig({ blurAmount: Number(e.target.value) })}
                  className="w-full accent-yellow-500 cursor-pointer"
                />
              </div>

              {/* Notification Duration */}
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Toast Auto-Dismiss</span>
                  <span className="text-yellow-400 font-bold">{config?.notificationDuration ?? 5} s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={config?.notificationDuration ?? 5}
                  onChange={(e) => updateConfig({ notificationDuration: Number(e.target.value) })}
                  className="w-full accent-yellow-500 cursor-pointer"
                />
              </div>

              {/* Animation Speed */}
              <div className="space-y-1.5 font-mono text-xs">
                <span className="text-zinc-400 block">Animation Dynamics</span>
                <div className="flex items-center gap-1">
                  {['fast', 'normal', 'slow'].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => updateConfig({ animationSpeed: speed as any })}
                      className={`flex-1 py-1 rounded border text-[10px] uppercase font-bold transition-all cursor-pointer ${
                        config?.animationSpeed === speed
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: OFFLINE-FIRST WORKSPACE & QUEUE ENGINE */}
      {activeSubSection === 'offline' && (
        <div className="space-y-5">
          {/* Status Card */}
          <div className="p-4 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase block">
                  Workspace Storage Engine
                </span>
                <h4 className="text-sm font-extrabold text-white font-mono flex items-center gap-2">
                  {workspaceStatus.offlineMode ? (
                    <>
                      <CloudOff className="text-amber-400" size={16} /> Offline SQLite Zero-Latency Mode Active
                    </>
                  ) : (
                    <>
                      <Cloud className="text-emerald-400" size={16} /> Online Cloud Firestore Synchronized
                    </>
                  )}
                </h4>
              </div>

              <div className="flex items-center gap-2 font-mono">
                <button
                  onClick={() => processOfflineQueue()}
                  disabled={offlineQueue.length === 0}
                  className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={12} className={workspaceStatus.cloudSync === 'syncing' ? 'animate-spin' : ''} />
                  <span>Sync Queue Now</span>
                </button>
              </div>
            </div>

            {/* Offline Simulation Test Actions */}
            <div className="pt-2 border-t border-zinc-850 grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
              <button
                onClick={() => {
                  enqueueOfflineMutation({
                    title: `Updated Document Note #${Math.floor(Math.random() * 900 + 100)}`,
                    category: 'sync',
                    type: 'DOCUMENT_UPDATE',
                    payload: { noteId: 'note_123', content: 'Offline draft content' },
                  });
                }}
                className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus size={11} /> Simulate Offline Edit
              </button>

              <button
                onClick={() => {
                  enqueueOfflineMutation({
                    title: `Conflicting Schema Edit #${Math.floor(Math.random() * 900 + 100)}`,
                    category: 'sync',
                    type: 'SCHEMA_UPDATE',
                    payload: { simulatedConflict: true, localData: { field: 'v2_local' } },
                  });
                }}
                className="py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <AlertTriangle size={11} /> Simulate Sync Conflict
              </button>

              <button
                onClick={() => clearOfflineQueue()}
                disabled={offlineQueue.length === 0}
                className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 size={11} /> Clear Queue
              </button>
            </div>
          </div>

          {/* Queue Inspection Table */}
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                Offline Queue Mutations ({offlineQueue.length})
              </span>
              <span className="text-[10px] text-zinc-500">
                Auto-merges upon network reconnection
              </span>
            </div>

            {offlineQueue.length === 0 ? (
              <div className="p-8 text-center bg-[#09090d] border border-zinc-850 rounded-xl space-y-2 font-mono">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                <p className="text-xs text-zinc-300 font-bold">Offline Queue is Clean</p>
                <p className="text-[11px] text-zinc-500">
                  All local workspace edits have been processed and merged into cloud persistence.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {offlineQueue.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                      item.status === 'conflict'
                        ? 'bg-red-950/20 border-red-500/50 shadow-md'
                        : item.status === 'synced'
                        ? 'bg-[#09090d] border-zinc-850 opacity-60'
                        : 'bg-[#0d0d12] border-yellow-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-zinc-100">{item.title}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          item.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : item.status === 'syncing'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : item.status === 'conflict'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <span className="text-[10px] text-zinc-500">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    {/* Conflict Resolution Card if Conflict */}
                    {item.status === 'conflict' && (
                      <div className="p-3 bg-[#120a0a] border border-red-500/40 rounded-lg space-y-2.5 font-mono">
                        <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                          <AlertTriangle size={14} />
                          <span>Sync Conflict Resolution Required</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-snug">
                          The local SQLite mutation conflicts with changes recorded on the Cloud Firestore server. Choose how to resolve this item:
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => resolveSyncConflict(item.id, 'keep_local')}
                            className="flex-1 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Keep Local Version
                          </button>
                          <button
                            onClick={() => resolveSyncConflict(item.id, 'keep_cloud')}
                            className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Keep Cloud Version
                          </button>
                          <button
                            onClick={() => resolveSyncConflict(item.id, 'merge')}
                            className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Auto-Merge Delta
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
