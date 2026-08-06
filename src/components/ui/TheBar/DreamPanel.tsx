import React, { useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import { Sparkles, ChevronLeft, ChevronRight, Check, Clock, ArrowRight, ArrowLeft, Play, Pause, AlertCircle, ExternalLink, X } from 'lucide-react';
import { ActivityItem } from '../../../lib/activityCenterService';
import { aetherIntelligence } from '../../../lib/aetherIntelligenceService';
import { useSafeOverlayNavigate } from '../../../hooks/useSafeOverlayNavigate';

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
  const navigate = useSafeOverlayNavigate();

  if (dreamList.length === 0) {
    return (
      <div className="p-8 text-center space-y-3 bg-zinc-900/60 border border-white/10 rounded-2xl font-mono">
        <Sparkles size={28} className="text-amber-400 mx-auto animate-pulse" />
        <p className="text-xs text-zinc-200 font-bold">No Active Dreams for {projectName}</p>
        <p className="text-[10.5px] text-zinc-400 max-w-md mx-auto leading-relaxed">
          Autonomous background optimizations run automatically when idle logic detects code or architecture enhancement opportunities in this project.
        </p>
        <button
          onClick={() => {
            aetherIntelligence.generateDream(projectName);
          }}
          className="mt-2 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-extrabold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
        >
          <Sparkles size={12} /> Trigger Neural Dream Now
        </button>
      </div>
    );
  }

  const currentDream = dreamList[selectedIndex] || dreamList[0];

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, itemId: string, actionUrl?: string) => {
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
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Review Required</span>;
      case 'active':
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">Running</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">Failed</span>;
      case 'cancelled':
      case 'paused':
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">Paused</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-zinc-800 text-amber-300 border border-amber-500/30">Queued</span>;
    }
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Swiper Header */}
      <div className="flex items-center justify-between bg-zinc-900/60 border border-white/10 rounded-xl p-2 text-xs">
        <button
          onClick={() => setSelectedIndex((prev) => (prev - 1 + dreamList.length) % dreamList.length)}
          className="p-1 hover:bg-white/10 rounded text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
        >
          <ChevronLeft size={14} /> Previous
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
          onDragEnd={(e, info) => handleDragEnd(e, info, currentDream.id, currentDream.actionUrl)}
          className="p-4 bg-zinc-900/80 backdrop-blur-xl border border-white/15 rounded-2xl space-y-3 shadow-lg relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg">
                <Sparkles size={14} />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-zinc-100">{currentDream.title}</h4>
                <span className="text-[9.5px] text-zinc-400">{currentDream.project || projectName}</span>
              </div>
            </div>

            {getStatusBadge(currentDream.status)}
          </div>

          <p className="text-[11px] text-zinc-300 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-white/10">
            {currentDream.description || 'Autonomous AST analysis & performance optimization generated by Aether Intelligence.'}
          </p>

          {/* Reason & Expected Impact */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-zinc-950/40 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-amber-400/90 font-bold block">Reason it exists</span>
              <span className="text-zinc-400">Idle AST sweep detected optimization potential.</span>
            </div>
            <div className="p-2 bg-zinc-950/40 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-emerald-400/90 font-bold block">Expected Impact</span>
              <span className="text-zinc-400">Enhanced type safety and faster render passes.</span>
            </div>
          </div>

          {/* Progress Indicator */}
          {typeof currentDream.progress === 'number' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Progress</span>
                <span className="text-amber-300 font-bold">{Math.round(currentDream.progress)}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-950/80 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, currentDream.progress))}%` }}
                />
              </div>
            </div>
          )}

          {/* Gesture hints */}
          <div className="flex items-center justify-between text-[9px] text-zinc-500 border-t border-white/5 pt-1.5">
            <span className="flex items-center gap-1">
              <ArrowLeft size={10} /> Swipe Left: Reject
            </span>
            <span className="flex items-center gap-1">
              Swipe Right: Approve <ArrowRight size={10} />
            </span>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10">
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock size={11} /> {currentDream.estimatedTimeRemaining || 'ETA 12s'}
            </span>

            <div className="flex items-center gap-2 text-[10px]">
              {currentDream.status === 'completed' ? (
                <>
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
                    <ExternalLink size={10} /> Open Result
                  </button>
                  <button
                    onClick={() => onApprove(currentDream.id, currentDream.actionUrl)}
                    className="px-3 py-1 bg-amber-400 text-zinc-950 font-extrabold rounded-lg hover:bg-amber-300 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Check size={11} /> Approve
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onCancel(currentDream.id)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-zinc-200 rounded-lg border border-white/10 transition-colors cursor-pointer font-medium flex items-center gap-1"
                >
                  <Pause size={10} /> Pause
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

