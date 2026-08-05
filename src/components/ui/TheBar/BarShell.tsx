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

interface BarShellProps {
  standalone?: boolean;
}

export const BarShell: React.FC<BarShellProps> = ({ standalone = false }) => {
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
  
  // Filter Dreams specifically for the active project
  const dreamList = activities.filter(
    (a) =>
      a.category === 'dream' &&
      !dismissedIds.has(a.id) &&
      (!a.project || a.project === currentProject.name || a.project === currentProject.id)
  );

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

  // Ultra-responsive spring physics matching expansion and collapse timing
  const springTransition = { type: 'spring' as const, stiffness: 500, damping: 32, mass: 0.8 };

  return (
    <div
      ref={containerRef}
      className={`${
        standalone ? 'relative' : 'fixed top-3 left-1/2 -translate-x-1/2 z-[110]'
      } font-sans select-none pointer-events-auto`}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* COLLAPSED BAR - PREMIUM LIQUID GLASS CAPSULE */
          <motion.div
            key="bar-collapsed"
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95 }}
            transition={springTransition}
            onClick={() => setIsExpanded(true)}
            className="group relative flex items-center gap-3 px-4 h-10 bg-slate-900/75 via-slate-900/80 to-slate-950/85 border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/10 backdrop-blur-2xl rounded-full cursor-pointer hover:border-cyan-400/50 hover:shadow-[0_0_24px_rgba(34,211,238,0.2)] transition-all duration-200"
          >
            <ProjectSwitcher
              projects={projectList}
              activeProjectId={currentProject.id}
              onSelectProject={(id) => setActiveProjectId && setActiveProjectId(id)}
              compact
            />

            <div className="h-3.5 w-[1px] bg-white/15" />

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-[10px] font-mono font-bold text-cyan-300">
              <Sparkles size={10} className="text-cyan-400 animate-pulse" />
              <span>{aiMode}</span>
            </div>

            {activeDreamCount > 0 ? (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-200 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-400/35 animate-pulse">
                <span>{activeDreamCount} Dreaming</span>
              </div>
            ) : visibleActivities.length > 0 ? (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                <Activity size={10} />
                <span>{visibleActivities.length} Active</span>
              </div>
            ) : null}

            {unreadNotificationCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-blue-200 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30">
                <Bell size={10} />
                <span>{unreadNotificationCount}</span>
              </div>
            )}

            <ChevronDown size={13} className="text-slate-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
          </motion.div>
        ) : (
          /* EXPANDED BAR - SOFT FROSTED LIQUID GLASS SURFACE */
          <motion.div
            key="bar-expanded"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={springTransition}
            className="w-[92vw] max-w-2xl bg-slate-900/80 via-slate-900/90 to-slate-950/95 border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-3xl rounded-3xl overflow-hidden font-sans flex flex-col max-h-[82vh]"
          >
            {/* Clean Header Bar */}
            <div className="px-4 py-3 bg-gradient-to-r from-cyan-950/30 via-slate-900/90 to-blue-950/30 border-b border-white/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
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
                className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                title="Collapse Bar"
              >
                <Minimize2 size={14} />
              </button>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/60 border-b border-white/10 font-mono text-[11px] shrink-0 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setActiveTab('dreams')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dreams'
                    ? 'bg-white/15 text-white border border-white/25 shadow-xs font-semibold backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/10'
                }`}
              >
                <Sparkles size={12} className={activeDreamCount > 0 ? 'animate-spin text-cyan-300' : ''} />
                <span>Dreams ({dreamList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'live'
                    ? 'bg-white/15 text-white border border-white/25 shadow-xs font-semibold backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/10'
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
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/10'
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
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/10'
                }`}
              >
                <Cloud size={12} />
                <span>Sync ({pendingOfflineCount})</span>
                {hasSyncConflict && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute top-1 right-1" />}
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'bg-white/15 text-white border border-white/25 shadow-xs font-semibold backdrop-blur-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/10'
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

            {/* Clean Operating Experience Footer */}
            <div className="px-4 py-2.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-[10px] font-mono shrink-0">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Zap size={11} className="text-cyan-400" /> DevSpace Intelligence Active
              </span>

              <button
                onClick={() => {
                  navigate('/settings?tab=activity-center');
                  setIsExpanded(false);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/10 transition-all cursor-pointer font-medium"
              >
                Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

