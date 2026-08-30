import React, { useState, useEffect } from 'react';
import {
  Brain,
  ShieldCheck,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  Sparkles,
  Layers,
  GitBranch,
  FolderGit2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Check
} from 'lucide-react';
import {
  aetherProactiveIntelligence,
  ProactiveAlertItem,
  ProactivityLevel,
  ProactiveStats
} from '../../lib/aetherProactiveIntelligenceService';
import { AetherProactiveAlertCard } from './AetherProactiveAlertCard';

export const AetherProactiveIntelligenceHub: React.FC = () => {
  const [alerts, setAlerts] = useState<ProactiveAlertItem[]>(() =>
    aetherProactiveIntelligence.getAlerts()
  );
  const [stats, setStats] = useState<ProactiveStats>(() =>
    aetherProactiveIntelligence.getStats()
  );
  const [activeLevel, setActiveLevel] = useState<ProactivityLevel>(() =>
    aetherProactiveIntelligence.getProactivityLevel()
  );
  const [desktopNotifs, setDesktopNotifs] = useState<boolean>(() =>
    aetherProactiveIntelligence.isDesktopNotificationsEnabled()
  );
  const [filter, setFilter] = useState<'all' | 'facts' | 'recommendations' | 'github' | 'issues'>('all');
  const [showDismissedModal, setShowDismissedModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = aetherProactiveIntelligence.subscribe((newAlerts) => {
      setAlerts(newAlerts);
      setStats(aetherProactiveIntelligence.getStats());
      setActiveLevel(aetherProactiveIntelligence.getProactivityLevel());
    });

    const handleUpdate = () => {
      setAlerts(aetherProactiveIntelligence.getAlerts());
      setStats(aetherProactiveIntelligence.getStats());
    };

    window.addEventListener('aether-proactive-alerts-updated', handleUpdate);
    return () => {
      unsub();
      window.removeEventListener('aether-proactive-alerts-updated', handleUpdate);
    };
  }, []);

  const handleLevelChange = (level: ProactivityLevel) => {
    aetherProactiveIntelligence.setProactivityLevel(level);
    setActiveLevel(level);
    showToast(`Proactivity level set to ${level.replace('_', ' ').toUpperCase()}`);
  };

  const handleToggleDesktopNotifs = async () => {
    const next = !desktopNotifs;
    const result = await aetherProactiveIntelligence.setDesktopNotificationsEnabled(next);
    setDesktopNotifs(result);
    showToast(result ? 'Desktop Notifications Enabled' : 'Desktop Notifications Disabled or Permission Denied');
  };

  const handleClearAllDismissed = () => {
    aetherProactiveIntelligence.clearAllDismissed();
    showToast('Restored all dismissed suggestions');
    setShowDismissedModal(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'facts') return a.classification === 'verified_fact';
    if (filter === 'recommendations') return a.classification === 'aether_recommendation';
    if (filter === 'github') return a.category === 'github_workflow' || a.category === 'pr_conflict' || a.category === 'recent_push' || a.category === 'pr_review';
    if (filter === 'issues') return a.category === 'unfinished_work' || a.category === 'stale_issues';
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-amber-500 text-black font-mono font-bold text-xs rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-fade-in">
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Proactivity Level Control Matrix */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Aether Proactivity Level</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold uppercase">
                  {activeLevel.replace('_', ' ')}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Control how proactively Aether watches and surfaces insights without waiting to be asked.
              </p>
            </div>
          </div>

          {/* Desktop Notifications Toggle */}
          <button
            onClick={handleToggleDesktopNotifs}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              desktopNotifs
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {desktopNotifs ? <BellRing size={13} className="text-emerald-400 animate-pulse" /> : <Bell size={13} />}
            <span>Desktop Alerts: {desktopNotifs ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* 4 Levels Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
          {[
            {
              id: 'off',
              label: 'Off',
              desc: 'Silent mode. No proactive alerts are shown.',
              color: 'hover:border-zinc-500'
            },
            {
              id: 'important_only',
              label: 'Important Only',
              desc: 'High severity only: failed CI/CD workflows, PR merge conflicts, critical blockers.',
              color: 'hover:border-rose-500'
            },
            {
              id: 'balanced',
              label: 'Balanced',
              desc: 'Default. Important + unfinished tasks, draft PR reviews, stale issues, changes since last open.',
              color: 'hover:border-amber-500'
            },
            {
              id: 'proactive',
              label: 'Proactive',
              desc: 'All insights: recent pushes, previous project resume, related notes, contextual tips.',
              color: 'hover:border-emerald-500'
            }
          ].map((lvl) => {
            const isSelected = activeLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => handleLevelChange(lvl.id as ProactivityLevel)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-lg text-amber-200'
                    : `bg-black/30 border-white/10 text-zinc-400 ${lvl.color}`
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className={isSelected ? 'text-amber-300' : 'text-zinc-200'}>{lvl.label}</span>
                  {isSelected && <Check size={13} className="text-amber-400" />}
                </div>
                <p className="text-[10px] font-sans text-zinc-400 leading-snug">{lvl.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Stats & Filtering */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'all' ? 'bg-white/15 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('facts')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'facts'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Verified Facts ({stats.factsCount})</span>
          </button>
          <button
            onClick={() => setFilter('recommendations')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'recommendations'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Recommendations ({stats.recommendationsCount})</span>
          </button>
          <button
            onClick={() => setFilter('github')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'github' ? 'bg-white/15 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            GitHub & Workflows
          </button>
          <button
            onClick={() => setFilter('issues')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filter === 'issues' ? 'bg-white/15 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Unfinished & Issues
          </button>
        </div>

        {/* Restore dismissed button */}
        {stats.dismissedCount > 0 && (
          <button
            onClick={handleClearAllDismissed}
            className="text-xs font-mono text-zinc-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Restore {stats.dismissedCount} Dismissed</span>
          </button>
        )}
      </div>

      {/* Proactive Alert Cards Feed */}
      <div className="space-y-3">
        {activeLevel === 'off' ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-white/10 rounded-2xl space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-zinc-500" />
            <h4 className="text-sm font-bold text-zinc-300">Proactivity is Turned Off</h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Switch your proactivity level above to Balanced or Proactive to surface automated insights from your workflows and repositories.
            </p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-white/10 rounded-2xl space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
            <h4 className="text-sm font-bold text-zinc-200">No Action Items Pending</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              All workflows, open PRs, tasks, and recent projects are verified and in sync. Aether is quietly monitoring in background mode.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AetherProactiveAlertCard
              key={alert.id}
              alert={alert}
              onActionComplete={() => {
                setAlerts(aetherProactiveIntelligence.getAlerts());
                setStats(aetherProactiveIntelligence.getStats());
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
