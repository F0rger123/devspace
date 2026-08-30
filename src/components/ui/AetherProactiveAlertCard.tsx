import React, { useState } from 'react';
import {
  GitPullRequest,
  AlertTriangle,
  GitCommit,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  FileText,
  Compass,
  X,
  BellRing,
  ArrowRight,
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import {
  ProactiveAlertItem,
  aetherProactiveIntelligence,
  ProactiveAction
} from '../../lib/aetherProactiveIntelligenceService';
import { useSafeOverlayNavigate } from '../../hooks/useSafeOverlayNavigate';

interface AetherProactiveAlertCardProps {
  alert: ProactiveAlertItem;
  compact?: boolean;
  onActionComplete?: () => void;
}

export const AetherProactiveAlertCard: React.FC<AetherProactiveAlertCardProps> = ({
  alert,
  compact = false,
  onActionComplete
}) => {
  const navigate = useSafeOverlayNavigate();
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [showGroupedDetails, setShowGroupedDetails] = useState(false);

  const isFact = alert.classification === 'verified_fact';

  const getCategoryIcon = () => {
    switch (alert.category) {
      case 'github_workflow':
      case 'pr_conflict':
        return <AlertTriangle size={compact ? 13 : 15} className="text-rose-400 shrink-0" />;
      case 'recent_push':
        return <GitCommit size={compact ? 13 : 15} className="text-amber-400 shrink-0" />;
      case 'pr_review':
        return <GitPullRequest size={compact ? 13 : 15} className="text-cyan-400 shrink-0" />;
      case 'unfinished_work':
        return <Clock size={compact ? 13 : 15} className="text-amber-400 shrink-0" />;
      case 'stale_issues':
        return <Layers size={compact ? 13 : 15} className="text-orange-400 shrink-0" />;
      case 'project_changed':
      case 'continue_project':
        return <FolderGit2 size={compact ? 13 : 15} className="text-emerald-400 shrink-0" />;
      case 'related_note':
        return <FileText size={compact ? 13 : 15} className="text-purple-400 shrink-0" />;
      default:
        return <Sparkles size={compact ? 13 : 15} className="text-amber-400 shrink-0" />;
    }
  };

  const handleAction = (action: ProactiveAction) => {
    aetherProactiveIntelligence.executeAction(action, alert, navigate);
    if (onActionComplete) onActionComplete();
  };

  const handleSnooze = (minutes: number) => {
    aetherProactiveIntelligence.snoozeAlert(alert.id, minutes);
    setShowSnoozeMenu(false);
    if (onActionComplete) onActionComplete();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    aetherProactiveIntelligence.dismissAlert(alert.id);
    if (onActionComplete) onActionComplete();
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all ${
        alert.severity === 'critical' || alert.severity === 'high'
          ? 'bg-rose-950/20 border-rose-500/30 text-rose-100 hover:border-rose-500/50'
          : alert.severity === 'medium'
          ? 'bg-amber-950/20 border-amber-500/30 text-amber-100 hover:border-amber-500/50'
          : 'bg-zinc-900/80 border-white/10 text-zinc-200 hover:border-white/20'
      } ${compact ? 'p-3 text-xs' : 'p-4 text-sm'} backdrop-blur-xl shadow-lg`}
    >
      {/* Top Header: Category Icon, Title, Classification Badge, Dismiss */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 p-1.5 rounded-lg bg-black/40 border border-white/10">
            {getCategoryIcon()}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Fact vs Recommendation Badge */}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                  isFact
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                }`}
              >
                {isFact ? 'VERIFIED FACT' : 'AETHER RECOMMENDATION'}
              </span>

              {alert.projectName && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-mono">
                  {alert.projectName}
                </span>
              )}

              {alert.timeAgoText && (
                <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-0.5">
                  <Clock size={9} /> {alert.timeAgoText}
                </span>
              )}
            </div>

            <h4 className={`font-bold text-zinc-100 leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
              {alert.title}
            </h4>
          </div>
        </div>

        {/* Top Right Controls: Dismiss */}
        <button
          onClick={handleDismiss}
          className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Dismiss this suggestion"
        >
          <X size={13} />
        </button>
      </div>

      {/* Message Description */}
      <p className={`mt-2 text-zinc-300 leading-relaxed pl-9 ${compact ? 'text-[11px]' : 'text-xs'}`}>
        {alert.message}
      </p>

      {/* Grouped Details Drawer if applicable */}
      {alert.groupedCount && alert.groupedCount > 1 && alert.groupedDetails && (
        <div className="mt-2 pl-9">
          <button
            onClick={() => setShowGroupedDetails(!showGroupedDetails)}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 cursor-pointer font-bold"
          >
            {showGroupedDetails ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <span>View {alert.groupedCount} grouped items</span>
          </button>

          {showGroupedDetails && (
            <div className="mt-1.5 p-2 bg-black/40 rounded-xl border border-white/10 space-y-1 text-[10px] font-mono text-zinc-300">
              {alert.groupedDetails.map((det, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{det}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="mt-3.5 pl-9 flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {alert.actions
            .filter((a) => a.type !== 'dismiss' && a.type !== 'snooze')
            .map((act) => (
              <button
                key={act.id}
                onClick={() => handleAction(act)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  act.isPrimary
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10'
                }`}
              >
                <span>{act.label}</span>
                <ArrowRight size={10} />
              </button>
            ))}
        </div>

        {/* Snooze Options */}
        <div className="relative">
          <button
            onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
            className="px-2 py-1 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-1 cursor-pointer"
          >
            <Clock size={10} />
            <span>Snooze</span>
            <ChevronDown size={10} />
          </button>

          {showSnoozeMenu && (
            <div className="absolute right-0 bottom-full mb-1 w-32 bg-zinc-950 border border-white/15 rounded-xl shadow-2xl p-1 z-30 space-y-0.5 text-[10px] font-mono">
              <button
                onClick={() => handleSnooze(15)}
                className="w-full text-left px-2 py-1 rounded-lg hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 cursor-pointer"
              >
                15 minutes
              </button>
              <button
                onClick={() => handleSnooze(60)}
                className="w-full text-left px-2 py-1 rounded-lg hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 cursor-pointer"
              >
                1 hour
              </button>
              <button
                onClick={() => handleSnooze(240)}
                className="w-full text-left px-2 py-1 rounded-lg hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 cursor-pointer"
              >
                4 hours
              </button>
              <button
                onClick={() => handleSnooze(1440)}
                className="w-full text-left px-2 py-1 rounded-lg hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 cursor-pointer"
              >
                Tomorrow (24h)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
