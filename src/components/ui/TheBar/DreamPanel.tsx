import React, { useState, useSyncExternalStore } from 'react';
import { motion, PanInfo } from 'motion/react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  ArrowRight,
  ArrowLeft,
  Pause,
  ExternalLink,
  X,
  GitPullRequest,
  GitBranch,
  Layers,
  Send,
  Trash2,
  CheckSquare,
  Square,
  GitCommit,
} from 'lucide-react';
import { ActivityItem } from '../../../lib/activityCenterService';
import { aetherIntelligence } from '../../../lib/aetherIntelligenceService';
import { useSafeOverlayNavigate } from '../../../hooks/useSafeOverlayNavigate';
import { pushQueue, PushQueueItem } from '../../../lib/pushQueueService';

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
  onCancel,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSubView, setActiveSubView] = useState<'dreams' | 'push_queue'>('dreams');
  const [squashCommits, setSquashCommits] = useState(true);
  const [targetBranch, setTargetBranch] = useState('main');
  const [isPushing, setIsPushing] = useState(false);
  const navigate = useSafeOverlayNavigate();

  const queueItems = useSyncExternalStore(
    pushQueue.subscribe,
    pushQueue.getSnapshot,
    pushQueue.getSnapshot
  );

  const projectQueueItems = (queueItems || []).filter(
    (i) => i && i.projectName && i.projectName.toLowerCase() === (projectName || '').toLowerCase()
  );

  const currentDream = dreamList[selectedIndex] || dreamList[0];

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    itemId: string,
    actionUrl?: string
  ) => {
    if (info.offset.x > 70) {
      onApprove(itemId, actionUrl);
    } else if (info.offset.x < -70) {
      onReject(itemId);
    }
  };

  const handleOpenResult = (dream: ActivityItem) => {
    if (dream.actionUrl) {
      navigate(dream.actionUrl);
    } else {
      navigate('/projects');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
      case 'review':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Review
          </span>
        );
      case 'active':
      case 'running':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            Running
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Failed
          </span>
        );
      case 'paused':
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            Paused
          </span>
        );
      case 'queued':
      default:
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-zinc-800 text-amber-300 border border-amber-500/30">
            Queued
          </span>
        );
    }
  };

  const handleExecuteBatchPush = async () => {
    setIsPushing(true);
    await pushQueue.executePushBatch({
      projectName,
      squash: squashCommits,
      customBranch: targetBranch,
    });
    setIsPushing(false);
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Sub-navigation bar: Dreams vs Push Queue */}
      <div className="flex items-center justify-between bg-zinc-950/70 border border-white/10 rounded-xl p-1 text-[10.5px]">
        <button
          onClick={() => setActiveSubView('dreams')}
          className={`flex-1 py-1 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubView === 'dreams'
              ? 'bg-amber-400 text-zinc-950 shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sparkles size={11} />
          <span>Active Dreams ({dreamList.length})</span>
        </button>

        <button
          onClick={() => setActiveSubView('push_queue')}
          className={`flex-1 py-1 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            activeSubView === 'push_queue'
              ? 'bg-amber-400 text-zinc-950 shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <GitBranch size={11} />
          <span>Push Queue ({projectQueueItems.length})</span>
          {projectQueueItems.filter((i) => i.status === 'queued').length > 0 && (
            <span className="px-1.5 py-0.2 text-[8px] bg-emerald-500 text-zinc-950 font-black rounded-full">
              {projectQueueItems.filter((i) => i.status === 'queued').length}
            </span>
          )}
        </button>
      </div>

      {activeSubView === 'dreams' ? (
        dreamList.length === 0 ? (
          <div className="p-6 text-center space-y-2.5 bg-zinc-900/60 border border-white/10 rounded-2xl font-mono">
            <Sparkles size={24} className="text-amber-400 mx-auto" />
            <p className="text-xs text-zinc-200 font-bold">No Dreams for {projectName}</p>
            <p className="text-[10px] text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Background AST optimization sweeps run continuously during active work sessions.
            </p>
            <button
              onClick={() => {
                aetherIntelligence.generateDream(projectName);
              }}
              className="mt-1 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
            >
              <Sparkles size={11} /> Run Neural AST Scan
            </button>
          </div>
        ) : (
          <>
            {/* Swiper Header */}
            <div className="flex items-center justify-between bg-zinc-900/60 border border-white/10 rounded-xl p-2 text-xs">
              <button
                onClick={() =>
                  setSelectedIndex((prev) => (prev - 1 + dreamList.length) % dreamList.length)
                }
                className="p-1 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles size={11} /> Dream {selectedIndex + 1} of {dreamList.length}
              </span>
              <button
                onClick={() => setSelectedIndex((prev) => (prev + 1) % dreamList.length)}
                className="p-1 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>

            {/* Selected Dream Interactive Card */}
            {currentDream && (
              <motion.div
                key={currentDream.id}
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                onDragEnd={(e, info) =>
                  handleDragEnd(e, info, currentDream.id, currentDream.actionUrl)
                }
                className="p-4 bg-zinc-900/80 backdrop-blur-xl border border-white/15 rounded-2xl space-y-3 shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg">
                      <Sparkles size={14} />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-zinc-100">{currentDream.title}</h4>
                      <span className="text-[9.5px] text-zinc-400">
                        {currentDream.project || projectName}
                      </span>
                    </div>
                  </div>

                  {getStatusBadge(currentDream.status)}
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-white/10">
                  {currentDream.description ||
                    'Autonomous AST analysis & performance optimization generated by Aether Intelligence.'}
                </p>

                {/* Gesture hints */}
                <div className="flex items-center justify-between text-[9px] text-zinc-500 border-t border-white/5 pt-1.5">
                  <span className="flex items-center gap-1">
                    <ArrowLeft size={10} /> Swipe Left: Reject
                  </span>
                  <span className="flex items-center gap-1">
                    Swipe Right: Approve & Queue <ArrowRight size={10} />
                  </span>
                </div>

                {/* Action Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Clock size={11} /> {currentDream.estimatedTimeRemaining || 'ETA 12s'}
                  </span>

                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      onClick={() => onReject(currentDream.id)}
                      className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1"
                    >
                      <X size={10} /> Reject
                    </button>
                    <button
                      onClick={() => handleOpenResult(currentDream)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 rounded-lg transition-colors cursor-pointer font-medium flex items-center gap-1"
                    >
                      <ExternalLink size={10} /> Review
                    </button>
                    <button
                      onClick={() => onApprove(currentDream.id, currentDream.actionUrl)}
                      className="px-3 py-1 bg-amber-400 text-zinc-950 font-extrabold rounded-lg hover:bg-amber-300 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Check size={11} /> Approve & Queue
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )
      ) : (
        /* PUSH QUEUE VIEW */
        <div className="space-y-3">
          <div className="p-3 bg-zinc-950/80 border border-white/10 rounded-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <GitBranch size={13} /> Git Push Queue for {projectName}
              </span>

              <div className="flex items-center gap-2 text-[10px]">
                <label className="flex items-center gap-1 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={squashCommits}
                    onChange={(e) => setSquashCommits(e.target.checked)}
                    className="accent-amber-400 rounded"
                  />
                  <span>Squash Commits</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10.5px]">
              <span className="text-zinc-400 shrink-0">Target Branch:</span>
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 flex-1"
              />
            </div>
          </div>

          {/* Queued Items List */}
          {projectQueueItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-900/40 border border-white/10 rounded-xl">
              No approved Dreams queued for push. Approve active Dreams to populate the push queue.
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {projectQueueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-zinc-900/80 border border-white/10 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => pushQueue.toggleSelection(item.id)}
                      className="text-amber-400 cursor-pointer shrink-0"
                    >
                      {item.selected ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-zinc-100 truncate">{item.title}</h5>
                      <span className="text-[9.5px] text-zinc-400 truncate block">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[10px]">
                    {item.status === 'pushed' ? (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold">
                        Pushed ({item.commitHash?.substring(0, 6)})
                      </span>
                    ) : item.status === 'committing' ? (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold animate-pulse">
                        Pushing...
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-full">
                        Queued
                      </span>
                    )}

                    <button
                      onClick={() => pushQueue.removeFromQueue(item.id)}
                      className="p-1 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Batch Push Action */}
          <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
            <span className="text-[10px] text-zinc-400">
              {projectQueueItems.filter((i) => i.selected && i.status !== 'pushed').length} items selected
            </span>

            <button
              onClick={handleExecuteBatchPush}
              disabled={isPushing || projectQueueItems.filter((i) => i.selected && i.status !== 'pushed').length === 0}
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Send size={12} />
              {isPushing ? 'Executing Push Batch...' : 'Push Selected Batch Now'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
