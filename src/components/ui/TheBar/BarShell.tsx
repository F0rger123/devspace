import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronDown,
  Activity,
  Bell,
  Cloud,
  Compass,
  Minimize2,
  Zap,
  EyeOff,
  Layers,
  ExternalLink,
  Settings as SettingsIcon,
  Power,
  GitPullRequest,
  Music,
} from 'lucide-react';
import { useActivityCenter } from '../../../hooks/useActivityCenter';
import { useSpotifyState } from '../../../lib/aetherSpotifyEngine';
import { useData } from '../../../context/DataProvider';
import { useSafeOverlayNavigate } from '../../../hooks/useSafeOverlayNavigate';
import { safeToggleOverlay, safeSetOverlayAlwaysOnTop, safeSetOverlayExpanded, getElectronAPI, isElectron } from '../../../lib/electronBridge';
import { AIMode, TheBarTab } from './types';
import { ProjectSwitcher } from './ProjectSwitcher';
import { AIModeSwitcher } from './AIModeSwitcher';
import { DreamPanel } from './DreamPanel';
import { ContextPanel } from './ContextPanel';
import { LiveWorkPanel } from './LiveWorkPanel';
import { SyncPanel } from './SyncPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { pushQueue } from '../../../lib/pushQueueService';

interface BarShellProps {
  standalone?: boolean;
}

export const BarShell: React.FC<BarShellProps> = ({ standalone = false }) => {
  if (!isElectron()) {
    return null;
  }

  const {
    activeActivities,
    activities,
    notifications,
    unreadNotificationCount,
    workspaceStatus,
    offlineQueue,
    cancelActivity,
    processOfflineQueue,
    resolveSyncConflict,
    markAllNotificationsRead,
  } = useActivityCenter();

  const { projects, activeProjectId, setActiveProjectId } = useData();
  const spotifyState = useSpotifyState();
  const navigate = useSafeOverlayNavigate();
  const activePath = typeof window !== 'undefined' ? window.location.pathname : '/';

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TheBarTab>('dreams');
  const [aiMode, setAiMode] = useState<AIMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('devspace_active_aether_mode');
      if (saved) return saved as AIMode;
    }
    return 'ALWAYS ON';
  });
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setContextMenuPos(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const projectList =
    projects && projects.length > 0
      ? projects
      : [
          { id: 'devspace-core', name: 'DevSpace Desktop' },
          { id: 'lifetime-app', name: 'Lifetime Suite' },
          { id: 'website-main', name: 'DevSpace Web' },
          { id: 'mobile-app', name: 'Mobile Companion' },
        ];

  const currentProject = projectList.find((p) => p.id === activeProjectId) || projectList[0];

  // Hotkey Cmd/Ctrl + Shift + A to toggle & Escape key to collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Click outside or window blur to collapse automatically
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    const handleWindowBlur = () => {
      if (isExpanded) {
        setIsExpanded(false);
      }
    };

    const handleIpcCollapse = () => {
      setIsExpanded(false);
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('devspace:overlay-collapse', handleIpcCollapse);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('devspace:overlay-collapse', handleIpcCollapse);
    }

    const electronApi = getElectronAPI() as any;
    if (electronApi && electronApi.on) {
      try {
        electronApi.on('overlay-collapse-requested', handleIpcCollapse);
      } catch {}
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('devspace:overlay-collapse', handleIpcCollapse);
      if (electronApi && electronApi.off) {
        try {
          electronApi.off('overlay-collapse-requested', handleIpcCollapse);
        } catch {}
      }
    };
  }, [isExpanded]);

  // Handle overlay resize with smooth timing delay during collapse (120-150ms morph)
  useEffect(() => {
    if (isExpanded) {
      safeSetOverlayExpanded(true);
    } else {
      const timer = setTimeout(() => {
        safeSetOverlayExpanded(false);
      }, 140);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isElectron()) {
      // Allow native Electron context menu if registered
      return;
    }
    e.preventDefault();
    const menuWidth = 220;
    const menuHeight = 210;
    let x = Math.max(8, Math.min(e.clientX, window.innerWidth - menuWidth - 8));
    let y = Math.max(8, Math.min(e.clientY, window.innerHeight - menuHeight - 8));
    setContextMenuPos({ x, y });
  };

  const visibleActivities = activeActivities.filter((a) => !dismissedIds.has(a.id));
  const visibleNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  
  // Real Dreams for current active project from projects context + runtime activities
  const activeProjObj = projects.find((p) => p.id === currentProject.id || p.name === currentProject.name);
  const storedRecs = activeProjObj?.dreamRecommendations || [];

  // Convert stored dreamRecommendations to ActivityItem format if present
  const projectStoredDreams = storedRecs.map((rec) => ({
    id: rec.id,
    title: rec.title,
    description: rec.description,
    category: 'dream' as const,
    status: (rec.status === 'approved'
      ? 'completed'
      : rec.status === 'dismissed'
      ? 'failed'
      : 'completed') as any,
    progress: 100,
    startTime: rec.createdAt || Date.now(),
    project: currentProject.name,
    actionUrl: `/projects`,
  }));

  const runtimeDreams = activities.filter(
    (a) =>
      a.category === 'dream' &&
      !dismissedIds.has(a.id) &&
      (!a.project || a.project === currentProject.name || a.project === currentProject.id)
  );

  // Combine runtime dreams with stored project dreams (deduped by ID)
  const existingDreamIds = new Set(runtimeDreams.map((d) => d.id));
  const combinedDreams = [
    ...runtimeDreams,
    ...projectStoredDreams.filter((d) => !existingDreamIds.has(d.id)),
  ];

  const activeDreamCount = combinedDreams.filter((a) => a.status === 'active' || a.status === 'completed').length;
  const pendingOfflineCount = offlineQueue.filter((i) => i.status === 'pending' || i.status === 'conflict').length;
  const hasSyncConflict = offlineQueue.some((i) => i.status === 'conflict');

  const handleApprove = (id: string, actionUrl?: string) => {
    setApprovedIds((prev) => new Set(prev).add(id));
    const targetDream = combinedDreams.find((d) => d.id === id);
    if (targetDream) {
      pushQueue.addToQueue({
        id: targetDream.id,
        title: targetDream.title,
        description: targetDream.description,
        projectName: currentProject.name,
      });
    }
    if (actionUrl) {
      navigate(actionUrl);
      setIsExpanded(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  // Fast 120-150ms fluid morphing transition matching Apple Liquid Glass guidelines
  const morphTransition = { duration: 0.14, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      className={`${
        standalone ? 'relative' : 'fixed top-2 left-1/2 -translate-x-1/2 z-[110]'
      } font-sans select-none pointer-events-auto`}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* COLLAPSED BAR - LIQUID GLASS CAPSULE */
          <motion.div
            key="bar-collapsed"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={morphTransition}
            onClick={() => setIsExpanded(true)}
            className="group relative flex items-center gap-3 px-4 h-10 bg-zinc-900/90 via-zinc-900/95 to-zinc-950/95 border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-2xl rounded-full cursor-pointer hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)] transition-all duration-150"
          >
            <ProjectSwitcher
              projects={projectList}
              activeProjectId={currentProject.id}
              onSelectProject={(id) => setActiveProjectId && setActiveProjectId(id)}
              compact
            />

            <div className="h-3.5 w-[1px] bg-white/15" />

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-300">
              <Sparkles size={10} className="text-amber-400" />
              <span>{aiMode}</span>
            </div>

            {spotifyState?.isAuthenticated && spotifyState?.isPlaying && spotifyState?.currentTrack && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                <Music size={10} className="text-emerald-400 animate-pulse" />
                <span className="truncate max-w-[100px]">{spotifyState.currentTrack.title}</span>
              </div>
            )}

            {activeDreamCount > 0 ? (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-200 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/35">
                <span>{activeDreamCount} Dreams</span>
              </div>
            ) : visibleActivities.length > 0 ? (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                <Activity size={10} />
                <span>{visibleActivities.length} Active</span>
              </div>
            ) : null}

            {unreadNotificationCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-white/20">
                <Bell size={10} />
                <span>{unreadNotificationCount}</span>
              </div>
            )}

            <ChevronDown size={13} className="text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
          </motion.div>
        ) : (
          /* EXPANDED BAR - SOFT FROSTED LIQUID GLASS SURFACE */
          <motion.div
            key="bar-expanded"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={morphTransition}
            className="w-[92vw] max-w-2xl bg-zinc-900/95 via-zinc-900/95 to-zinc-950/98 border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/10 backdrop-blur-3xl rounded-3xl overflow-hidden font-sans flex flex-col max-h-[82vh]"
          >
            {/* Clean Header Bar */}
            <div className="px-4 py-3 bg-zinc-950/90 border-b border-white/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <ProjectSwitcher
                  projects={projectList}
                  activeProjectId={currentProject.id}
                  onSelectProject={(id) => setActiveProjectId && setActiveProjectId(id)}
                />
              </div>

              <AIModeSwitcher currentMode={aiMode} onSelectMode={setAiMode} />

              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                title="Collapse Bar"
              >
                <Minimize2 size={14} />
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 p-1.5 bg-zinc-950/70 border-b border-white/10 font-mono text-[11px] shrink-0 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveTab('dreams')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dreams'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/35 shadow-xs font-semibold backdrop-blur-md'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10'
                }`}
              >
                <Sparkles size={12} className={activeDreamCount > 0 ? 'text-amber-300' : ''} />
                <span>Dreams ({combinedDreams.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'live'
                    ? 'bg-white/15 text-white border border-white/25 shadow-xs font-semibold backdrop-blur-md'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10'
                }`}
              >
                <Activity size={12} />
                <span>Live Work ({visibleActivities.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('aether')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'aether'
                    ? 'bg-white/15 text-white border border-white/25 shadow-xs font-semibold backdrop-blur-md'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10'
                }`}
              >
                <Compass size={12} />
                <span>Aether Intelligence</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap relative ${
                  activeTab === 'sync'
                    ? 'bg-white/15 text-white border border-white/25 shadow-xs font-semibold backdrop-blur-md'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10'
                }`}
              >
                <Cloud size={12} />
                <span>Sync ({pendingOfflineCount})</span>
                {hasSyncConflict && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />}
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'bg-white/15 text-white border border-white/25 shadow-xs font-semibold backdrop-blur-md'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/10'
                }`}
              >
                <Bell size={12} />
                <span>Notifs ({visibleNotifications.length})</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar min-h-[260px] max-h-[420px]">
              {activeTab === 'dreams' && (
                <DreamPanel
                  dreamList={combinedDreams}
                  projectName={currentProject.name}
                  onApprove={handleApprove}
                  onReject={handleDismiss}
                  onCancel={cancelActivity}
                />
              )}

              {activeTab === 'live' && (
                <LiveWorkPanel
                  visibleActivities={visibleActivities}
                  approvedIds={approvedIds}
                  onApprove={handleApprove}
                  onDismiss={handleDismiss}
                  onCancel={cancelActivity}
                />
              )}

              {activeTab === 'aether' && (
                <ContextPanel
                  projectName={currentProject.name}
                  activePath={activePath}
                  activeDreamCount={combinedDreams.length}
                  activeWorkCount={visibleActivities.length}
                />
              )}

              {activeTab === 'sync' && (
                <SyncPanel
                  workspaceStatus={workspaceStatus}
                  offlineQueue={offlineQueue}
                  pendingCount={pendingOfflineCount}
                  onSyncNow={processOfflineQueue}
                  onResolveConflict={resolveSyncConflict}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsPanel
                  notifications={visibleNotifications}
                  onMarkAllRead={markAllNotificationsRead}
                  onDismiss={handleDismiss}
                />
              )}
            </div>

            {/* Clean Operating Experience Footer */}
            <div className="px-4 py-2.5 bg-zinc-950/80 border-t border-white/10 flex items-center justify-between text-[10px] font-mono shrink-0">
              <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                <Zap size={11} className="text-amber-400" /> DevSpace Aether Engine Active
              </span>

              <button
                onClick={() => {
                  navigate('/settings?tab=activity-center');
                  setIsExpanded(false);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg border border-white/10 transition-all cursor-pointer font-medium"
              >
                Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {contextMenuPos && (
        <div
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
          className="fixed z-[250] w-52 bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-xl py-1 text-xs font-sans text-zinc-200 animate-in fade-in zoom-in-95 duration-100 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setContextMenuPos(null);
              safeToggleOverlay(false);
            }}
            className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <EyeOff size={13} className="text-zinc-400" /> Hide Overlay
          </button>
          <button
            onClick={() => {
              setContextMenuPos(null);
              const next = !alwaysOnTop;
              setAlwaysOnTop(next);
              safeSetOverlayAlwaysOnTop(next);
            }}
            className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center justify-between text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Layers size={13} className="text-amber-400" /> Always On Top
            </span>
            {alwaysOnTop && <span className="text-amber-400 font-bold text-[10px]">✓</span>}
          </button>
          <div className="my-1 border-t border-zinc-800" />
          <button
            onClick={() => {
              setContextMenuPos(null);
              navigate('/dashboard');
            }}
            className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ExternalLink size={13} className="text-amber-400" /> Open DevSpace Main Window
          </button>
          <button
            onClick={() => {
              setContextMenuPos(null);
              navigate('/settings?tab=desktop_overlay');
            }}
            className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <SettingsIcon size={13} className="text-zinc-400" /> Desktop Settings
          </button>
          <div className="my-1 border-t border-zinc-800" />
          <button
            onClick={() => {
              setContextMenuPos(null);
              const api = getElectronAPI();
              if (api && api.closeWindow) {
                api.closeWindow();
              } else {
                safeToggleOverlay(false);
              }
            }}
            className="w-full px-3 py-2 text-left hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2 text-rose-400 transition-colors cursor-pointer"
          >
            <Power size={13} /> Quit DevSpace
          </button>
        </div>
      )}
    </div>
  );
};
