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
} from 'lucide-react';
import { useActivityCenter } from '../../../hooks/useActivityCenter';
import { useData } from '../../../context/DataProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { AIMode, TheBarTab } from './types';
import { ProjectSwitcher } from './ProjectSwitcher';
import { AIModeSwitcher } from './AIModeSwitcher';
import { DreamPanel } from './DreamPanel';
import { ContextPanel } from './ContextPanel';
import { LiveWorkPanel } from './LiveWorkPanel';
import { SyncPanel } from './SyncPanel';
import { NotificationsPanel } from './NotificationsPanel';

export const BarShell: React.FC = () => {
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
  const navigate = useNavigate();
  const location = useLocation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TheBarTab>('dreams');
  const [aiMode, setAiMode] = useState<AIMode>('AI');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Hotkey Cmd/Ctrl + Shift + A to toggle
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

  // Click outside to collapse
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

  const visibleActivities = activeActivities.filter((a) => !dismissedIds.has(a.id));
  const visibleNotifications = notifications.filter((n) => !dismissedIds.has(n.id));
  const dreamList = activities.filter((a) => a.category === 'dream' && !dismissedIds.has(a.id));
  const activeDreamCount = visibleActivities.filter((a) => a.category === 'dream').length;
  const pendingOfflineCount = offlineQueue.filter((i) => i.status === 'pending' || i.status === 'conflict').length;
  const hasSyncConflict = offlineQueue.some((i) => i.status === 'conflict');

  const handleApprove = (id: string, actionUrl?: string) => {
    setApprovedIds((prev) => new Set(prev).add(id));
    if (actionUrl) {
      navigate(actionUrl);
      setIsExpanded(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div
      ref={containerRef}
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[110] font-sans select-none pointer-events-auto"
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* COLLAPSED BAR (TOP CENTER ONLY) */
          <motion.div
            key="bar-collapsed"
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            onClick={() => setIsExpanded(true)}
            className="group relative flex items-center gap-3 px-4 h-10 bg-gradient-to-b from-[#14141f]/90 via-[#0a0a10]/95 to-[#050508]/98 border border-white/12 shadow-[0_12px_35px_rgba(0,0,0,0.7)] backdrop-blur-3xl rounded-full cursor-pointer hover:border-yellow-500/50 hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-[11px] font-mono shadow-xs">
                D
              </div>
            </div>

            <div className="h-3.5 w-[1px] bg-white/10" />

            <ProjectSwitcher
              projects={projectList}
              activeProjectId={currentProject.id}
              onSelectProject={(id) => setActiveProjectId && setActiveProjectId(id)}
              compact
            />

            <div className="h-3.5 w-[1px] bg-white/10" />

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-yellow-300">
              <Sparkles size={10} className="text-yellow-400 animate-pulse" />
              <span>{aiMode}</span>
            </div>

            {activeDreamCount > 0 ? (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                <span>{activeDreamCount} Dreaming</span>
              </div>
            ) : visibleActivities.length > 0 ? (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
                <Activity size={10} />
                <span>{visibleActivities.length} Active</span>
              </div>
            ) : null}

            {unreadNotificationCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-red-300 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/40">
                <Bell size={10} />
                <span>{unreadNotificationCount}</span>
              </div>
            )}

            <ChevronDown size={13} className="text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
          </motion.div>
        ) : (
          /* EXPANDED BAR STUDIO SURFACE */
          <motion.div
            key="bar-expanded"
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-[92vw] max-w-2xl bg-gradient-to-b from-[#0e0e17]/95 via-[#08080f]/98 to-[#040407]/99 border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-3xl rounded-3xl overflow-hidden font-sans flex flex-col max-h-[82vh]"
          >
            {/* Header */}
            <div className="p-3.5 bg-gradient-to-r from-yellow-950/20 via-[#0b0b12] to-purple-950/20 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-xs font-mono shadow-md">
                  D
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-zinc-100 font-mono tracking-tight">The Bar</span>
                    <span className="px-1.5 py-0.2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded text-[8px] font-mono font-bold">
                      Desktop Liquid Glass
                    </span>
                  </div>
                  <ProjectSwitcher
                    projects={projectList}
                    activeProjectId={currentProject.id}
                    onSelectProject={(id) => setActiveProjectId && setActiveProjectId(id)}
                  />
                </div>
              </div>

              <AIModeSwitcher currentMode={aiMode} onSelectMode={setAiMode} />

              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                title="Minimize Bar"
              >
                <Minimize2 size={14} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#050508] border-b border-white/10 font-mono text-[11px] shrink-0 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveTab('dreams')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dreams'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Sparkles size={12} className={activeDreamCount > 0 ? 'animate-spin' : ''} />
                <span>Dreams ({dreamList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'live'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Activity size={12} />
                <span>Live Work ({visibleActivities.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('aether')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'aether'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Compass size={12} />
                <span>Aether Intelligence</span>
              </button>

              <button
                onClick={() => setActiveTab('sync')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap relative ${
                  activeTab === 'sync'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Cloud size={12} />
                <span>Sync ({pendingOfflineCount})</span>
                {hasSyncConflict && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-1 right-1" />}
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
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
                  dreamList={dreamList}
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
                  activePath={location.pathname}
                  activeDreamCount={dreamList.length}
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

            {/* Footer */}
            <div className="p-3 bg-[#040407] border-t border-white/10 flex items-center justify-between text-[10px] font-mono shrink-0">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Zap size={11} className="text-yellow-400" /> DevSpace Liquid Glass Bar v2.5.0
              </span>

              <button
                onClick={() => {
                  navigate('/settings?tab=activity-center');
                  setIsExpanded(false);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg border border-white/10 transition-all cursor-pointer"
              >
                Settings & Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
