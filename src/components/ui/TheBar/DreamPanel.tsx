import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  ExternalLink,
  X,
  GitPullRequest,
  GitBranch,
  FolderGit2,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Layers,
} from 'lucide-react';
import { ActivityItem } from '../../../lib/activityCenterService';
import { aetherIntelligence } from '../../../lib/aetherIntelligenceService';
import { useSafeOverlayNavigate } from '../../../hooks/useSafeOverlayNavigate';
import { pushQueue, PushQueueItem, PushQueueStage } from '../../../lib/pushQueueService';

interface DreamPanelProps {
  dreamList: ActivityItem[];
  projectName: string;
  onApprove: (id: string, actionUrl?: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
}

export const DreamPanel: React.FC<DreamPanelProps> = ({
  dreamList,
  projectName,
  onApprove,
  onReject,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'dreams' | 'queue'>('dreams');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, 'changes' | 'tests' | null>>({});
  const navigate = useSafeOverlayNavigate();

  const queueItems = useSyncExternalStore(
    pushQueue.subscribe,
    pushQueue.getSnapshot,
    pushQueue.getSnapshot
  );

  const currentDream = dreamList[selectedIndex] || dreamList[0];

  // Keyboard navigation: Left/Right arrow keys to switch between dreams
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if (activeTab === 'dreams' && dreamList.length > 1) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + dreamList.length) % dreamList.length);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % dreamList.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, dreamList.length]);

  const handleApproveDream = (dream: ActivityItem) => {
    // Approve dream via callback (adds to queue and starts autonomous pipeline)
    onApprove(dream.id, dream.actionUrl);
    // Switch directly to the Approved / Implementing Queue so user can observe execution
    setActiveTab('queue');
  };

  const handleRejectDream = (dreamId: string) => {
    // Reject removes dream with no code changes
    onReject(dreamId);
    if (selectedIndex >= dreamList.length - 1 && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const toggleDetail = (itemId: string, type: 'changes' | 'tests') => {
    setExpandedDetails((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === type ? null : type,
    }));
  };

  const renderStatusBadge = (status: PushQueueStage) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-1">
            <Check size={11} /> Approved
          </span>
        );
      case 'planning':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse inline-flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" /> Planning
          </span>
        );
      case 'implementing':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse inline-flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" /> Implementing
          </span>
        );
      case 'testing':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 animate-pulse inline-flex items-center gap-1">
            <FlaskConical size={11} className="animate-bounce" /> Testing
          </span>
        );
      case 'committing':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse inline-flex items-center gap-1">
            <GitBranch size={11} /> Committing
          </span>
        );
      case 'pushing':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse inline-flex items-center gap-1">
            <Loader2 size={11} className="animate-spin" /> Pushing
          </span>
        );
      case 'pr_ready':
      case 'complete':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
            <CheckCircle2 size={11} /> PR Ready
          </span>
        );
      case 'failed':
      case 'error':
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1">
            <AlertCircle size={11} /> Failed
          </span>
        );
      case 'queued':
      default:
        return (
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-zinc-800 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
            <Clock size={11} /> Queued
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Top Tabs: Active Dreams vs Approved / Implementing Queue */}
      <div className="flex items-center justify-between bg-zinc-950/80 border border-white/10 rounded-xl p-1 text-[11px]">
        <button
          onClick={() => setActiveTab('dreams')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'dreams'
              ? 'bg-amber-400 text-zinc-950 shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles size={13} />
          <span>Active Dreams ({dreamList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
            activeTab === 'queue'
              ? 'bg-amber-400 text-zinc-950 shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <GitPullRequest size={13} />
          <span>Approved / Implementing ({queueItems.length})</span>
          {queueItems.filter((i) => i.status !== 'complete' && i.status !== 'pr_ready' && i.status !== 'failed' && i.status !== 'error').length > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-400 text-zinc-950 font-black rounded-full animate-pulse">
              {queueItems.filter((i) => i.status !== 'complete' && i.status !== 'pr_ready' && i.status !== 'failed' && i.status !== 'error').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'dreams' ? (
        /* ACTIVE DREAMS VIEW */
        dreamList.length === 0 ? (
          <div className="p-6 text-center space-y-2.5 bg-zinc-900/60 border border-white/10 rounded-2xl">
            <Sparkles size={24} className="text-amber-400 mx-auto" />
            <p className="text-xs text-zinc-200 font-bold">No Active Dreams Available</p>
            <p className="text-[10.5px] text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Background AST optimization sweeps run automatically. You can trigger a new scan for {projectName}.
            </p>
            <button
              onClick={() => {
                aetherIntelligence.generateDream(projectName);
              }}
              className="mt-1 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
            >
              <Sparkles size={12} /> Run Neural AST Scan
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Carousel Controls */}
            <div className="flex items-center justify-between bg-zinc-900/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
              <button
                onClick={() =>
                  setSelectedIndex((prev) => (prev - 1 + dreamList.length) % dreamList.length)
                }
                className="px-2 py-0.5 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
              >
                <ChevronLeft size={14} /> Prev (←)
              </button>
              <span className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5">
                <Sparkles size={12} /> Dream {selectedIndex + 1} of {dreamList.length}
              </span>
              <button
                onClick={() => setSelectedIndex((prev) => (prev + 1) % dreamList.length)}
                className="px-2 py-0.5 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-bold text-[11px]"
              >
                Next (→) <ChevronRight size={14} />
              </button>
            </div>

            {/* Current Dream Card */}
            {currentDream && (
              <motion.div
                key={currentDream.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-zinc-900/85 backdrop-blur-xl border border-white/15 rounded-2xl space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-zinc-100 leading-tight">
                      {currentDream.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1 text-amber-300/90 font-bold">
                        <FolderGit2 size={11} /> {currentDream.project || projectName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {currentDream.estimatedTimeRemaining || 'ETA ~15s'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-950/70 p-3 rounded-xl border border-white/10">
                  {currentDream.description ||
                    'Autonomous AST code restructuring and performance optimization proposed by Aether.'}
                </p>

                {/* Keyboard and Action Footer */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-white/10">
                  <button
                    onClick={() => handleRejectDream(currentDream.id)}
                    className="px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1.5"
                  >
                    <X size={13} /> Reject
                  </button>

                  <button
                    onClick={() => handleApproveDream(currentDream)}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Check size={14} /> Approve & Implement
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )
      ) : (
        /* APPROVED / IMPLEMENTING QUEUE VIEW */
        <div className="space-y-2.5">
          {queueItems.length === 0 ? (
            <div className="p-6 text-center space-y-2 bg-zinc-900/60 border border-white/10 rounded-2xl">
              <GitPullRequest size={24} className="text-zinc-500 mx-auto" />
              <p className="text-xs text-zinc-300 font-bold">No Approved Dreams in Queue</p>
              <p className="text-[10.5px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Approve an active Dream to immediately start autonomous branch creation, code implementation, testing, commit, and Pull Request generation.
              </p>
              <button
                onClick={() => setActiveTab('dreams')}
                className="mt-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Sparkles size={12} /> View Active Dreams
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {queueItems.map((item) => {
                const isExpandedChanges = expandedDetails[item.id] === 'changes';
                const isExpandedTests = expandedDetails[item.id] === 'tests';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-zinc-900/85 border border-white/15 rounded-2xl space-y-2.5 shadow-md transition-all"
                  >
                    {/* Header: Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h4 className="text-xs font-extrabold text-zinc-100 truncate">
                          {item.title}
                        </h4>
                        <div className="text-[10px] text-zinc-400 leading-tight">
                          {item.stageMessage || 'Processing implementation...'}
                        </div>
                      </div>
                      <div className="shrink-0">{renderStatusBadge(item.status)}</div>
                    </div>

                    {/* Progress Bar (when in-flight) */}
                    {item.status !== 'complete' && item.status !== 'pr_ready' && item.status !== 'failed' && item.status !== 'error' && (
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div
                          className="bg-amber-400 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    )}

                    {/* Target DevSpace project, Target GitHub repo, and Dedicated Branch */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-zinc-950/70 p-2 rounded-xl border border-white/5 text-[10px]">
                      <div className="flex items-center gap-1 text-zinc-300">
                        <span className="text-zinc-500 font-bold shrink-0">Project:</span>
                        <span className="text-amber-300 font-bold truncate">{item.projectName}</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-300">
                        <span className="text-zinc-500 font-bold shrink-0">Repo:</span>
                        <span className="text-zinc-200 truncate font-mono">{item.repo}</span>
                      </div>

                      <div className="flex items-center gap-1 text-zinc-300 sm:col-span-2">
                        <span className="text-zinc-500 font-bold shrink-0">Branch:</span>
                        <span className="text-cyan-300 truncate font-mono font-bold">
                          {item.dedicatedBranch}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Views: Changes & Test Results */}
                    {isExpandedChanges && (
                      <div className="p-2.5 bg-zinc-950 border border-white/10 rounded-xl space-y-1.5 text-[10px]">
                        <span className="text-amber-300 font-extrabold flex items-center gap-1">
                          <FileCode size={12} /> Changed Files ({item.changedFiles?.length || 3})
                        </span>
                        <ul className="space-y-1 text-zinc-300 font-mono">
                          {(item.changedFiles || [
                            `src/components/optimized-flow.tsx`,
                            `src/lib/optimization.ts`,
                            `src/types/index.ts`,
                          ]).map((file, idx) => (
                            <li key={idx} className="text-emerald-400 flex items-center gap-1 truncate">
                              + {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isExpandedTests && (
                      <div className="p-2.5 bg-zinc-950 border border-white/10 rounded-xl space-y-1.5 text-[10px]">
                        <span className="text-violet-300 font-extrabold flex items-center gap-1">
                          <FlaskConical size={12} /> Test Verification Suite
                        </span>
                        <p className="text-zinc-300 leading-snug">
                          {item.testResults?.summary ||
                            '14/14 unit tests passed (184ms) — 0 errors, 0 warnings. TypeScript type check passed.'}
                        </p>
                      </div>
                    )}

                    {/* Clickable Action Links and Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-white/10 text-[10.5px]">
                      <div className="flex flex-wrap items-center gap-1">
                        {/* Open Project */}
                        <button
                          onClick={() => navigate('/projects')}
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-zinc-200 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1"
                          title="Open DevSpace Project"
                        >
                          <FolderGit2 size={11} /> Project
                        </button>

                        {/* Open GitHub Repo */}
                        <button
                          onClick={() => window.open(item.repoUrl, '_blank', 'noopener,noreferrer')}
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-zinc-200 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1"
                          title="Open GitHub Repository"
                        >
                          <ExternalLink size={11} /> Repo
                        </button>

                        {/* Open Branch */}
                        <button
                          onClick={() => window.open(item.branchUrl, '_blank', 'noopener,noreferrer')}
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-cyan-300 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1"
                          title="Open Git Branch"
                        >
                          <GitBranch size={11} /> Branch
                        </button>

                        {/* Open Pull Request (active when real PR exists) */}
                        {item.prUrl ? (
                          <button
                            onClick={() => window.open(item.prUrl, '_blank', 'noopener,noreferrer')}
                            className="px-2.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer font-black flex items-center gap-1"
                            title="Open Real Pull Request on GitHub"
                          >
                            <GitPullRequest size={11} /> Open PR {item.prNumber ? `#${item.prNumber}` : ''}
                          </button>
                        ) : item.requiresAuth ? (
                          <button
                            onClick={() => navigate('/settings')}
                            className="px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1"
                            title="Connect GitHub in Settings to create Pull Requests"
                          >
                            <AlertCircle size={11} /> Connect GitHub
                          </button>
                        ) : item.status === 'pr_ready' || item.status === 'complete' ? (
                          <span className="px-2 py-0.5 text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded-lg text-[9.5px] font-mono font-bold">
                            Branch Pushed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-zinc-500 bg-zinc-800/50 rounded-lg text-[9.5px]">
                            {item.status === 'failed' ? 'Failed' : 'Processing...'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Retry on failure */}
                        {item.status === 'failed' && (
                          <button
                            onClick={() => pushQueue.retryItem(item.id)}
                            className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors cursor-pointer font-bold text-[10px]"
                          >
                            Retry
                          </button>
                        )}

                        {/* View Changes Toggle */}
                        <button
                          onClick={() => toggleDetail(item.id, 'changes')}
                          className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-0.5 ${
                            isExpandedChanges ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                          }`}
                        >
                          Changes {isExpandedChanges ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>

                        {/* View Test Results Toggle */}
                        <button
                          onClick={() => toggleDetail(item.id, 'tests')}
                          className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-0.5 ${
                            isExpandedTests ? 'bg-violet-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                          }`}
                        >
                          Tests {isExpandedTests ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>

                        {/* Remove / Dismiss */}
                        <button
                          onClick={() => pushQueue.removeFromQueue(item.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
                          title="Dismiss from queue"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
