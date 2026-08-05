import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play, 
  X, 
  Cloud, 
  CloudOff, 
  Download, 
  Bell, 
  Cpu, 
  GitBranch, 
  Mic, 
  ShieldCheck, 
  HardDrive, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Activity, 
  Layers, 
  Trash2,
  AlertTriangle,
  RotateCw,
  BellOff
} from 'lucide-react';
import { useActivityCenter } from '../../hooks/useActivityCenter';
import { useNavigate } from 'react-router-dom';

export function ActivityCenterPill() {
  const {
    activeActivities,
    activities,
    notifications,
    unreadNotificationCount,
    aiStatus,
    workspaceStatus,
    updateState,
    config,
    offlineQueue,
    cancelActivity,
    pauseActivity,
    resumeActivity,
    clearCompleted,
    setAIProvider,
    toggleSyncPause,
    checkUpdates,
    startUpdateDownload,
    installUpdateAndRestart,
    markAllNotificationsRead,
    clearNotifications,
    requestDesktopNotificationPermission,
    processOfflineQueue,
    resolveSyncConflict,
  } = useActivityCenter();

  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'ai' | 'sync' | 'update' | 'notifications'>('tasks');
  const [hasNativeNotif, setHasNativeNotif] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasNativeNotif(Notification.permission === 'granted');
    }
  }, []);

  // Global Keyboard Shortcut: Cmd/Ctrl + Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to collapse panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const hasActiveAI = activeActivities.some((a) => a.category === 'ai');
  const activeTaskCount = activeActivities.length;
  const hasSyncConflict = offlineQueue.some((i) => i.status === 'conflict');
  const pendingOfflineCount = offlineQueue.filter((i) => i.status === 'pending' || i.status === 'conflict').length;

  // Determine dynamic position classes
  const positionClass =
    config?.position === 'top_left'
      ? 'top-2.5 left-6'
      : config?.position === 'top_right'
      ? 'top-2.5 right-6'
      : 'top-2.5 left-1/2 -translate-x-1/2';

  // Determine display mode opacity & visibility
  const isOnlyActivityHidden =
    config?.displayMode === 'only_activity' &&
    activeTaskCount === 0 &&
    unreadNotificationCount === 0 &&
    !updateState.hasUpdate &&
    !hasSyncConflict &&
    !isExpanded;

  if (isOnlyActivityHidden) {
    return (
      <div
        ref={containerRef}
        onClick={() => setIsExpanded(true)}
        className={`fixed ${positionClass} z-[105] opacity-20 hover:opacity-100 transition-opacity duration-300 cursor-pointer`}
        title="Activity Center (Click to Expand)"
      >
        <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
          <Sparkles size={11} />
        </div>
      </div>
    );
  }

  const isAutoHide = config?.displayMode === 'auto_hide' && activeTaskCount === 0 && !isExpanded;

  return (
    <div
      ref={containerRef}
      className={`fixed ${positionClass} z-[105] font-sans select-none transition-all duration-300 ${
        isAutoHide ? 'opacity-40 hover:opacity-100' : 'opacity-100'
      }`}
    >
      {/* Collapsed Floating Activity Pill */}
      <motion.div
        layout
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          backgroundColor: `rgba(14, 14, 18, ${(config?.transparency ?? 90) / 100})`,
          backdropFilter: `blur(${config?.blurAmount ?? 16}px)`,
        }}
        className={`group h-8 px-3.5 flex items-center gap-2.5 border ${
          hasSyncConflict
            ? 'border-red-500/70 shadow-[0_0_18px_rgba(239,68,68,0.3)] animate-pulse'
            : hasActiveAI
            ? 'border-yellow-500/50 shadow-[0_0_18px_rgba(245,158,11,0.25)]'
            : updateState.hasUpdate
            ? 'border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
            : 'border-zinc-800 hover:border-zinc-700'
        } rounded-full cursor-pointer transition-all duration-300 shadow-xl`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* DevSpace Pulse Logo */}
        <div className="relative flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
            <Sparkles size={10} className={hasActiveAI ? 'animate-spin' : ''} />
          </div>
          {hasActiveAI && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 animate-ping opacity-75" />
          )}
        </div>

        {/* Status Text & Indicators */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="font-extrabold text-zinc-100 group-hover:text-yellow-400 transition-colors">
            DevSpace
          </span>

          {/* Developer Telemetry Mode */}
          {config?.displayMode === 'developer' && (
            <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[9px] font-bold">
              SQLite 0.4ms
            </span>
          )}

          {/* Active AI Indicator */}
          {hasActiveAI ? (
            <span className="px-1.5 py-0.2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span>AI Thinking</span>
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">
              {aiStatus.currentProvider}
            </span>
          )}

          {/* Background Tasks Badge */}
          {activeTaskCount > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded text-[10px] font-bold flex items-center gap-1">
              <Activity size={9} className="animate-pulse" />
              <span>{activeTaskCount} Active</span>
            </span>
          )}

          {/* Offline Queue / Sync Status */}
          {hasSyncConflict ? (
            <span className="px-1.5 py-0.2 bg-red-500/20 text-red-300 border border-red-500/40 rounded text-[10px] font-bold flex items-center gap-1 animate-bounce">
              <AlertTriangle size={9} />
              <span>Sync Conflict!</span>
            </span>
          ) : pendingOfflineCount > 0 ? (
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold flex items-center gap-1">
              <CloudOff size={9} />
              <span>{pendingOfflineCount} Queued</span>
            </span>
          ) : workspaceStatus.cloudSync === 'syncing' ? (
            <span className="text-yellow-400 flex items-center gap-1 text-[10px]">
              <RefreshCw size={10} className="animate-spin" />
            </span>
          ) : workspaceStatus.offlineMode ? (
            <span className="text-amber-400/80 flex items-center gap-1 text-[10px]">
              <CloudOff size={10} />
            </span>
          ) : (
            <span className="text-emerald-400/80 flex items-center gap-1 text-[10px]">
              <Cloud size={10} />
            </span>
          )}

          {/* Desktop Update Badge */}
          {updateState.hasUpdate && (
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse">
              <Download size={9} />
              <span>v{updateState.latestVersion}</span>
            </span>
          )}

          {/* Notification Badge */}
          {unreadNotificationCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-red-500/80 text-white font-extrabold text-[9px] flex items-center justify-center">
              {unreadNotificationCount}
            </span>
          )}
        </div>

        <ChevronDown size={12} className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-yellow-400' : ''}`} />
      </motion.div>

      {/* Expanded Activity Center Panel Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 12, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-[480px] sm:w-[560px] max-h-[82vh] bg-[#0b0b0e]/95 border border-zinc-800/90 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col font-sans"
          >
            {/* Top Panel Header */}
            <div className="p-3.5 bg-gradient-to-r from-yellow-950/20 via-[#0e0e14] to-zinc-950 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <Sparkles size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold text-white font-mono tracking-wider uppercase">
                      DevSpace Activity Center
                    </h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded">
                      ⌘⇧A
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Live Background Activity • AI Status • Sync & Updates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!hasNativeNotif && (
                  <button
                    onClick={async () => {
                      const granted = await requestDesktopNotificationPermission();
                      setHasNativeNotif(granted);
                    }}
                    title="Enable Native OS Notifications"
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 rounded-lg border border-zinc-800 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Bell size={12} />
                    <span>Enable OS Notifs</span>
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1 p-2 bg-[#08080b] border-b border-zinc-850 overflow-x-auto text-xs font-mono">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Activity size={12} />
                <span>Active ({activeActivities.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Cpu size={12} />
                <span>AI Engine ({aiStatus.currentProvider})</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'sync'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Cloud size={12} />
                <span>Sync & Backup</span>
              </button>

              <button
                onClick={() => setActiveTab('update')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
                  activeTab === 'update'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Download size={12} />
                <span>Updates</span>
                {updateState.hasUpdate && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Bell size={12} />
                <span>Logs ({unreadNotificationCount})</span>
              </button>
            </div>

            {/* Scrollable Tab Content Container */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[60vh] custom-scrollbar">
              {/* TAB 1: ACTIVE TASKS */}
              {activeTab === 'tasks' && (
                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                      Live Tasks & Background Executions
                    </span>
                    {activities.some((a) => a.status === 'completed' || a.status === 'failed') && (
                      <button
                        onClick={clearCompleted}
                        className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 size={10} />
                        <span>Clear Completed</span>
                      </button>
                    )}
                  </div>

                  {activities.length === 0 ? (
                    <div className="p-8 text-center bg-[#09090d] border border-zinc-850 rounded-xl space-y-2">
                      <CheckCircle2 size={28} className="text-emerald-400 mx-auto opacity-70" />
                      <p className="text-xs font-mono font-bold text-zinc-300">No Background Tasks Running</p>
                      <p className="text-[11px] text-zinc-500">
                        DevSpace background workers, AI engines, and sync services are idle.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activities.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-[#0d0d12] border border-zinc-850 hover:border-zinc-750 rounded-xl space-y-2 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-zinc-100 font-mono">
                                  {item.title}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                  item.status === 'active'
                                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                    : item.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : item.status === 'paused'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                  {item.status}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono capitalize">
                                  • {item.category}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-zinc-400 leading-tight">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {item.actionUrl && (
                                <button
                                  onClick={() => {
                                    setIsExpanded(false);
                                    navigate(item.actionUrl!);
                                  }}
                                  title="Jump to active view"
                                  className="p-1 bg-zinc-900 hover:bg-zinc-800 text-yellow-400 rounded border border-zinc-800 transition-colors cursor-pointer text-[10px] font-mono flex items-center gap-1 px-1.5"
                                >
                                  <span>View</span>
                                  <ExternalLink size={10} />
                                </button>
                              )}

                              {item.status === 'active' && item.canPause && (
                                <button
                                  onClick={() => pauseActivity(item.id)}
                                  title="Pause task"
                                  className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 cursor-pointer"
                                >
                                  <Pause size={11} />
                                </button>
                              )}

                              {item.status === 'paused' && (
                                <button
                                  onClick={() => resumeActivity(item.id)}
                                  title="Resume task"
                                  className="p-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 rounded border border-zinc-800 cursor-pointer"
                                >
                                  <Play size={11} />
                                </button>
                              )}

                              {item.canCancel !== false && item.status === 'active' && (
                                <button
                                  onClick={() => cancelActivity(item.id)}
                                  title="Cancel task"
                                  className="p-1 bg-zinc-900 hover:bg-zinc-800 text-red-400 rounded border border-zinc-800 cursor-pointer"
                                >
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar if defined */}
                          {item.progress !== undefined && item.status === 'active' && (
                            <div className="space-y-1">
                              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                <div
                                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                                <span>Progress</span>
                                <span>{item.progress}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AI STATUS & PROVIDER SWITCHER */}
              {activeTab === 'ai' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-3.5 bg-gradient-to-r from-yellow-950/30 to-zinc-950 border border-yellow-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold">Active Engine</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold">
                        {aiStatus.providerHealth.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-white font-mono uppercase tracking-wider">
                          {aiStatus.currentProvider}
                        </h4>
                        <p className="text-[11px] text-yellow-400 font-mono font-bold">{aiStatus.currentModel}</p>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span className="text-zinc-400 block">Response Latency</span>
                        <span className="text-zinc-200 font-bold">{aiStatus.responseTimeMs} ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Overview Grid */}
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="p-3 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-500 block uppercase">Session Tokens</span>
                      <span className="text-sm font-extrabold text-zinc-200">
                        {aiStatus.tokensUsedSession.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-500 block uppercase">Quota Remaining</span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {aiStatus.estimatedQuotaRemaining}
                      </span>
                    </div>
                  </div>

                  {/* Switch AI Provider */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      Switch Active Provider
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'gemini', name: 'Gemini 3.5 Flash', desc: 'Google DeepMind' },
                        { id: 'openai', name: 'OpenAI GPT-4o', desc: 'Reasoning Engine' },
                        { id: 'anthropic', name: 'Claude 3.5 Sonnet', desc: 'Anthropic AI' },
                        { id: 'ollama', name: 'Ollama Llama3', desc: 'Local Zero-Cost LLM' },
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          onClick={() => setAIProvider(prov.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            aiStatus.currentProvider === prov.id
                              ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300 shadow-sm'
                              : 'bg-[#0d0d12] border-zinc-850 hover:border-zinc-750 text-zinc-300'
                          }`}
                        >
                          <span className="text-xs font-extrabold font-mono block">{prov.name}</span>
                          <span className="text-[10px] text-zinc-500 block">{prov.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WORKSPACE SYNC & BACKUP */}
              {activeTab === 'sync' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-3.5 bg-[#0d0d12] border border-zinc-850 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-xs font-bold text-zinc-100 uppercase">Cloud Sync</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          workspaceStatus.cloudSync === 'synced'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {workspaceStatus.cloudSync.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {workspaceStatus.offlineMode
                          ? 'Offline Mode active. All edits cached in local SQLite database.'
                          : 'Connected to Cloud Firestore & Storage.'}
                      </p>
                    </div>

                    <button
                      onClick={toggleSyncPause}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        workspaceStatus.isPaused
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                      }`}
                    >
                      {workspaceStatus.isPaused ? 'Resume Sync' : 'Pause Sync'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="p-3 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-500 block uppercase">Pending Uploads</span>
                      <span className="text-sm font-extrabold text-zinc-200">
                        {workspaceStatus.pendingUploads}
                      </span>
                    </div>
                    <div className="p-3 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1">
                      <span className="text-[10px] text-zinc-500 block uppercase">Last Sync</span>
                      <span className="text-xs font-extrabold text-zinc-300">
                        {workspaceStatus.lastSuccessfulSync
                          ? new Date(workspaceStatus.lastSuccessfulSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DESKTOP UPDATES */}
              {activeTab === 'update' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-3.5 bg-gradient-to-r from-yellow-950/30 to-zinc-950 border border-yellow-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-white font-mono uppercase tracking-wider">
                        Installed: v{updateState.installedVersion}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {updateState.hasUpdate
                          ? `New GitHub Release v${updateState.latestVersion} Available`
                          : 'DevSpace Desktop is on the latest release.'}
                      </p>
                    </div>

                    <button
                      onClick={() => checkUpdates(false)}
                      disabled={updateState.status === 'checking'}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-yellow-400 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} className={updateState.status === 'checking' ? 'animate-spin' : ''} />
                      <span>{updateState.status === 'checking' ? 'Checking...' : 'Check'}</span>
                    </button>
                  </div>

                  {updateState.hasUpdate && (
                    <div className="p-3.5 bg-[#0d0d12] border border-amber-500/40 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-yellow-300 font-mono">
                          🚀 Update v{updateState.latestVersion} Ready
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">{updateState.fileSizeMB} MB</span>
                      </div>

                      {updateState.releaseNotes && (
                        <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-850 font-mono text-[11px] text-zinc-300 whitespace-pre-line leading-relaxed">
                          {updateState.releaseNotes}
                        </div>
                      )}

                      {updateState.status === 'downloading' && (
                        <div className="space-y-1.5 font-mono">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-yellow-400">Downloading background payload...</span>
                            <span className="text-white font-bold">{updateState.downloadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 transition-all duration-300"
                              style={{ width: `${updateState.downloadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-end">
                        {updateState.status === 'ready' ? (
                          <button
                            onClick={installUpdateAndRestart}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                          >
                            <RefreshCw size={13} />
                            <span>Restart to Install Update</span>
                          </button>
                        ) : (
                          <button
                            onClick={startUpdateDownload}
                            disabled={updateState.status === 'downloading'}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                          >
                            <Download size={13} />
                            <span>{updateState.status === 'downloading' ? 'Downloading...' : 'Download Update in Background'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: NOTIFICATIONS & LOGS */}
              {activeTab === 'notifications' && (
                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">
                      Recent System Notifications
                    </span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Mark Read
                      </button>
                      <span>•</span>
                      <button
                        onClick={clearNotifications}
                        className="text-zinc-500 hover:text-red-400 cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-8 text-center bg-[#09090d] border border-zinc-850 rounded-xl space-y-2 font-mono">
                      <BellOff size={24} className="text-zinc-600 mx-auto" />
                      <p className="text-xs text-zinc-400">No recent notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border transition-all space-y-1 text-xs ${
                            n.read
                              ? 'bg-[#0a0a0d] border-zinc-850 text-zinc-400'
                              : 'bg-[#0f0f15] border-yellow-500/30 text-zinc-100 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold font-mono text-zinc-200">{n.title}</span>
                            <span className="text-[9px] font-mono text-zinc-500">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 leading-snug">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Status Footer */}
            <div className="p-2.5 bg-[#08080b] border-t border-zinc-850 flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>DevSpace Engine Live</span>
              </span>
              <span>Press <strong className="text-zinc-300">⌘Shift+A</strong> to toggle</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
