import React from 'react';
import { motion, PanInfo } from 'motion/react';
import { CheckCircle2, X, ArrowRight, ArrowLeft, Cpu, Clock, FileCode2, Layers } from 'lucide-react';
import { ActivityItem } from '../../../lib/activityCenterService';

interface LiveWorkPanelProps {
  visibleActivities: ActivityItem[];
  approvedIds: Set<string>;
  onApprove: (id: string, actionUrl?: string) => void;
  onDismiss: (id: string) => void;
  onCancel: (id: string) => void;
}

export const LiveWorkPanel: React.FC<LiveWorkPanelProps> = ({
  visibleActivities,
  approvedIds,
  onApprove,
  onDismiss,
  onCancel,
}) => {
  if (visibleActivities.length === 0) {
    return (
      <div className="p-8 text-center space-y-2 bg-zinc-900/60 border border-white/10 rounded-2xl font-mono">
        <CheckCircle2 size={26} className="text-emerald-400 mx-auto" />
        <p className="text-xs text-zinc-100 font-bold">Everything is up to date</p>
        <p className="text-[10.5px] text-zinc-400 leading-relaxed max-w-sm mx-auto">
          All background operations, AST checks, and sync tasks are idle and synced.
        </p>
      </div>
    );
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, itemId: string, actionUrl?: string) => {
    if (info.offset.x > 70) {
      onApprove(itemId, actionUrl);
    } else if (info.offset.x < -70) {
      onDismiss(itemId);
    }
  };

  return (
    <div className="space-y-2.5 font-mono">
      {visibleActivities.map((item, index) => {
        const elapsedTimeSec = item.startTime ? Math.floor((Date.now() - item.startTime) / 1000) : 14;
        const provider = item.category === 'dream' ? 'Gemini 2.5 Flash (Antigravity)' : 'Aether Core AI';
        const tokensEst = Math.round((item.progress || 50) * 14.5 + 420);

        return (
          <motion.div
            key={item.id}
            drag="x"
            dragConstraints={{ left: -100, right: 100 }}
            onDragEnd={(e, info) => handleDragEnd(e, info, item.id, item.actionUrl)}
            className={`p-3.5 rounded-2xl border transition-all space-y-2.5 relative overflow-hidden ${
              approvedIds.has(item.id)
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-zinc-900/80 border-white/15 hover:border-amber-400/40 shadow-xs backdrop-blur-xl'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-zinc-100">{item.title}</span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[8px] uppercase font-bold border border-amber-500/20">
                  {item.category}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {item.canCancel && (
                  <button
                    onClick={() => onCancel(item.id)}
                    className="p-1 hover:bg-white/10 text-zinc-400 hover:text-rose-300 rounded transition-colors cursor-pointer"
                    title="Cancel Task"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {item.description && <p className="text-[11px] text-zinc-300 leading-snug">{item.description}</p>}

            {/* Detailed Activity Timeline Metrics */}
            <div className="grid grid-cols-2 gap-1.5 p-2 bg-zinc-950/50 rounded-xl border border-white/5 text-[9.5px]">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Clock size={10} className="text-amber-400" />
                <span>Elapsed: {elapsedTimeSec}s</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Layers size={10} className="text-emerald-400" />
                <span>ETA: {item.estimatedTimeRemaining || '8s'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Cpu size={10} className="text-amber-400" />
                <span>{provider}</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <FileCode2 size={10} className="text-amber-400" />
                <span>{item.project || 'DevSpace Desktop'} • Q#{index + 1}</span>
              </div>
              <div className="col-span-2 text-[9px] text-zinc-400">
                Tokens processed: ~{tokensEst} tokens
              </div>
            </div>

            {typeof item.progress === 'number' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9.5px] text-zinc-400">
                  <span>Task Progress</span>
                  <span className="text-amber-300 font-bold">{Math.round(item.progress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-950/80 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-[9.5px] border-t border-white/5">
              <span className="text-zinc-500 flex items-center gap-1">
                <ArrowLeft size={10} /> Swipe Left: Dismiss | Swipe Right: Approve <ArrowRight size={10} />
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onDismiss(item.id)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded border border-white/10 cursor-pointer font-medium"
                >
                  Dismiss
                </button>
                {item.actionUrl && (
                  <button
                    onClick={() => onApprove(item.id, item.actionUrl)}
                    className="px-2.5 py-0.5 bg-amber-400 text-zinc-950 font-extrabold rounded cursor-pointer flex items-center gap-1"
                  >
                    Open <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

