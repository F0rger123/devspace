import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  GitBranch,
  ArrowRight,
  TrendingUp,
  X,
  Play,
  FileText,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { aetherIntelligence, DailyBriefing } from '../lib/aetherIntelligenceService';

interface DailyAetherBriefModalProps {
  projectName?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenReport?: () => void;
  onResumeWorking?: () => void;
}

export const DailyAetherBriefModal: React.FC<DailyAetherBriefModalProps> = ({
  projectName = 'DevSpace Desktop',
  isOpen,
  onClose,
  onOpenReport,
  onResumeWorking,
}) => {
  const brief: DailyBriefing = aetherIntelligence.getDailyBrief(projectName);

  if (!isOpen) return null;

  const handleResume = () => {
    if (onResumeWorking) onResumeWorking();
    onClose();
  };

  const handleReport = () => {
    if (onOpenReport) onOpenReport();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-2xl bg-[#131418] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 font-sans"
        >
          {/* Top Banner Header */}
          <div className="relative p-6 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border-b border-zinc-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Sparkles size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      AETHER BRIEFING
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{brief.date}</span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-100 mt-1">Daily Operating Intelligence</h2>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 text-xs">
            {/* Yesterday Summary Grid */}
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-400" />
                <span>YESTERDAY'S WORKSPACE ACTIVITY</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Dreams Completed</div>
                  <div className="text-lg font-bold text-amber-400 mt-0.5">{brief.yesterday.dreamsCompleted}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Issues Resolved</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">{brief.yesterday.issuesResolved}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">PRs Merged</div>
                  <div className="text-lg font-bold text-cyan-400 mt-0.5">{brief.yesterday.prsMerged}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">AI Operations</div>
                  <div className="text-lg font-bold text-indigo-400 mt-0.5">{brief.yesterday.aiActivityCount}</div>
                </div>
              </div>
            </div>

            {/* Today Plan */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-400" />
                <span>TODAY'S RECOMMENDED FOCUS</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">Highest Priority Task</span>
                    <h3 className="text-sm font-semibold text-zinc-100 mt-0.5">{brief.today.highestPriorityWork}</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20">
                    Est. {brief.today.estimatedWorkDurationHours} hrs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-500/10">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Layers size={14} className="text-amber-400" />
                    <span>{brief.today.dreamsNeedingReviewCount} Dreams waiting for review</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <GitBranch size={14} className="text-cyan-400" />
                    <span>{brief.today.pendingPushesCount} pending git pushes</span>
                  </div>
                </div>
              </div>

              {/* Git Status Bar */}
              <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Git Workspace Status:</span>
                <span className="text-emerald-400">{brief.today.gitStatus}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 bg-[#17181d] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleReport}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition flex items-center gap-2"
            >
              <FileText size={15} />
              <span>Open Full Report</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs transition"
              >
                Dismiss
              </button>

              <button
                onClick={handleResume}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Play size={15} fill="currentColor" />
                <span>Resume Working</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
