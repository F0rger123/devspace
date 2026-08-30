import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  Plus,
  Shield,
  Eye,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  BellOff,
  History,
  Lock,
  Zap,
  Info,
  ChevronRight,
  Filter,
  Check,
  Search,
  Activity,
  Briefcase,
  Code,
  Moon,
  Car,
  Luggage,
  GitPullRequest,
  Coffee,
  Sun,
  Sunset
} from 'lucide-react';
import {
  aetherRoutines,
  RoutineItem,
  RoutineCategory,
  RoutineStatus,
  ROUTINE_CATEGORY_META,
  RoutineEvidenceRecord
} from '../lib/aetherRoutinesService';
import { aetherAutonomy, AutonomyDomain, ActionRiskLevel } from '../lib/aetherAutonomyEngine';

const CATEGORY_ICONS: Record<RoutineCategory, any> = {
  work: Briefcase,
  coding: Code,
  exercise: Activity,
  sleep: Moon,
  travel: Car,
  calendar: Calendar,
  packing: Luggage,
  github_review: GitPullRequest,
  breaks: Coffee,
  morning: Sun,
  evening: Sunset
};

export const AetherRoutinesTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'confirmed' | 'observed' | 'suggestions'>('confirmed');
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RoutineCategory | 'all'>('all');
  const [selectedRoutineForEvidence, setSelectedRoutineForEvidence] = useState<RoutineItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Form State for Manual Routine Creation
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<RoutineCategory>('coding');
  const [newRecurrence, setNewRecurrence] = useState('Every weekday at 9:30 AM');
  const [newTimeOfDay, setNewTimeOfDay] = useState('09:30');
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDescription, setNewActionDescription] = useState('');
  const [newDomain, setNewDomain] = useState<AutonomyDomain>('devspace');
  const [newRiskLevel, setNewRiskLevel] = useState<ActionRiskLevel>('low');
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  const reloadData = () => {
    setRoutines(aetherRoutines.getRoutines());
  };

  useEffect(() => {
    reloadData();
    const unsub = aetherRoutines.subscribe(reloadData);
    return () => unsub();
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleConfirm = (id: string) => {
    const ok = aetherRoutines.confirmRoutine(id);
    if (ok) {
      showToast('Routine confirmed! Aether will proactively support it.', 'success');
      reloadData();
    }
  };

  const handleReject = (id: string) => {
    const ok = aetherRoutines.rejectRoutine(id);
    if (ok) {
      showToast('Pattern dismissed and stopped.', 'info');
      reloadData();
    }
  };

  const handleSnooze = (id: string, minutes: number = 15) => {
    const ok = aetherRoutines.snoozeRoutine(id, minutes);
    if (ok) {
      showToast(`Snoozed for ${minutes} minutes.`, 'info');
      reloadData();
    }
  };

  const handleSkipToday = (id: string) => {
    const ok = aetherRoutines.skipRoutineToday(id);
    if (ok) {
      showToast("Skipped for today. Resumes tomorrow.", 'info');
      reloadData();
    }
  };

  const handlePause = (id: string, days: number = 7) => {
    const ok = aetherRoutines.pauseRoutine(id, days * 86400000);
    if (ok) {
      showToast(`Paused routine for ${days} days.`, 'info');
      reloadData();
    }
  };

  const handleResume = (id: string) => {
    const ok = aetherRoutines.resumeRoutine(id);
    if (ok) {
      showToast('Routine resumed.', 'success');
      reloadData();
    }
  };

  const handleDelete = (id: string) => {
    const ok = aetherRoutines.deleteRoutine(id);
    if (ok) {
      showToast('Routine deleted permanently.', 'info');
      reloadData();
    }
  };

  const handleExecuteNow = async (id: string) => {
    setExecutingId(id);
    try {
      const result = await aetherRoutines.executeRoutine(id);
      if (result.executed) {
        showToast(`Executed: ${result.message}`, 'success');
      } else {
        showToast(`Action Queued (${result.mode}): ${result.message}`, 'info');
      }
    } catch (err: any) {
      showToast(`Execution failed: ${err.message}`, 'error');
    } finally {
      setExecutingId(null);
      reloadData();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    aetherRoutines.createManualRoutine({
      title: newTitle,
      description: newDescription,
      category: newCategory,
      recurrenceDescription: newRecurrence,
      timeOfDay: newTimeOfDay,
      actionTitle: newActionTitle || newTitle,
      actionDescription: newActionDescription || newDescription,
      domain: newDomain,
      riskLevel: newRiskLevel,
      isPrivate: newIsPrivate
    });

    setShowCreateModal(false);
    showToast(`Created routine: "${newTitle}"`, 'success');
    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewActionTitle('');
    setNewActionDescription('');
    reloadData();
  };

  // Filtered routines based on active sub tab and category
  const filteredRoutines = routines.filter((r) => {
    if (activeSubTab === 'confirmed' && r.status !== 'confirmed_routine') return false;
    if (activeSubTab === 'observed' && r.status !== 'observed_pattern') return false;
    if (activeSubTab === 'suggestions' && r.status !== 'aether_suggestion') return false;
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const confirmedCount = routines.filter((r) => r.status === 'confirmed_routine').length;
  const observedCount = routines.filter((r) => r.status === 'observed_pattern').length;
  const suggestionsCount = routines.filter((r) => r.status === 'aether_suggestion').length;

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER WITH STATS & TOP ACTIONS */}
      <div className="p-6 rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles size={11} className="text-amber-400" />
                Adaptive Habit Cortex
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 flex items-center gap-1">
                <Lock size={10} className="text-emerald-400" />
                {aetherRoutines.getPrivacyMode() ? 'Local Privacy Active' : 'Cloud Sync Active'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Aether Routines & Habit Intelligence
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Learns recurring work, development, travel, schedule, and wellness patterns from real evidence only.
              Never invents habits from insufficient data.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Create Routine</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/5">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Confirmed Routines</span>
              <CheckCircle2 size={12} className="text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{confirmedCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Active & automated</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Observed Patterns</span>
              <Sparkles size={12} className="text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-300 mt-1 font-mono">{observedCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Awaiting confirmation</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Aether Suggestions</span>
              <Zap size={12} className="text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-300 mt-1 font-mono">{suggestionsCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Contextual prompts</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/5">
            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Privacy Safeguard</span>
              <Shield size={12} className="text-cyan-400" />
            </div>
            <div className="text-xs font-bold text-cyan-300 mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              100% On-Device
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Health & GPS Isolated</div>
          </div>
        </div>
      </div>

      {/* TOAST FEEDBACK */}
      {feedbackToast && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium transition ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : feedbackToast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info size={14} />
            <span>{feedbackToast.message}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-zinc-400 hover:text-white">
            <XCircle size={14} />
          </button>
        </div>
      )}

      {/* FILTER & SUB-TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSubTab('confirmed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeSubTab === 'confirmed'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Confirmed Routines</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
              {confirmedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('observed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeSubTab === 'observed'
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={13} />
            <span>Observed Patterns (Learned)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
              {observedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('suggestions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
              activeSubTab === 'suggestions'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Zap size={13} />
            <span>Aether Suggestions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
              {suggestionsCount}
            </span>
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative min-w-[220px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search routines or categories..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* CATEGORY FILTER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono text-zinc-500 mr-1 flex items-center gap-1">
          <Filter size={11} /> Filter:
        </span>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
            selectedCategory === 'all'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          All ({routines.length})
        </button>
        {(Object.keys(ROUTINE_CATEGORY_META) as RoutineCategory[]).map((cat) => {
          const meta = ROUTINE_CATEGORY_META[cat];
          const count = routines.filter((r) => r.category === cat).length;
          if (count === 0) return null;
          const isSel = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border whitespace-nowrap ${
                isSel
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-zinc-900/40 text-zinc-400 border-zinc-800 hover:text-zinc-300'
              }`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ROUTINES LISTING */}
      {filteredRoutines.length === 0 ? (
        <div className="p-12 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-500">
            <Clock size={20} />
          </div>
          <h3 className="text-sm font-bold text-zinc-300">No routines match this view</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {activeSubTab === 'observed'
              ? 'Aether only promotes patterns when at least 3-5 real factual observations are recorded.'
              : 'Create a custom routine or let Aether infer habits as you work.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRoutines.map((routine) => {
            const catMeta = ROUTINE_CATEGORY_META[routine.category] || ROUTINE_CATEGORY_META.work;
            const IconComponent = CATEGORY_ICONS[routine.category] || Clock;
            const isPaused = routine.pausedUntil && routine.pausedUntil > Date.now();
            const isSnoozed = routine.snoozedUntil && routine.snoozedUntil > Date.now();
            const isSkippedToday = routine.skippedDates && routine.skippedDates.includes(new Date().toISOString().split('T')[0]);

            return (
              <div
                key={routine.id}
                className={`p-5 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border transition-all relative flex flex-col justify-between ${
                  routine.status === 'confirmed_routine'
                    ? 'border-zinc-800 hover:border-emerald-500/40 shadow-lg shadow-black/30'
                    : routine.status === 'observed_pattern'
                    ? 'border-purple-500/20 hover:border-purple-500/50 shadow-lg shadow-purple-950/10'
                    : 'border-amber-500/20 hover:border-amber-500/50'
                }`}
              >
                <div>
                  {/* TOP BADGE ROW */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${catMeta.color}`}>
                        <IconComponent size={11} />
                        {catMeta.label}
                      </span>

                      {/* CONFIDENCE BADGE */}
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                          routine.confidence >= 80
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : routine.confidence >= 50
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {routine.confidence}% Confidence ({routine.evidenceCount} obs)
                      </span>

                      {routine.isPrivate && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 flex items-center gap-1">
                          <Lock size={9} /> Private
                        </span>
                      )}
                    </div>

                    {/* STATUS PILL */}
                    {isPaused && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Paused
                      </span>
                    )}
                    {isSnoozed && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Snoozed
                      </span>
                    )}
                    {isSkippedToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Skipped Today
                      </span>
                    )}
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    {routine.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {routine.description}
                  </p>

                  {/* SCHEDULE & ACTION TRIGGER INFO */}
                  <div className="mt-3.5 p-3 rounded-xl bg-zinc-950/70 border border-white/5 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Clock size={12} className="text-amber-400 flex-shrink-0" />
                      <span className="truncate">
                        <strong>Schedule:</strong> {routine.schedule.recurrenceDescription}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Zap size={12} className="text-purple-400 flex-shrink-0" />
                      <span className="truncate">
                        <strong>Action:</strong> {routine.action.actionTitle} ({routine.action.domain})
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* VIEW EVIDENCE BUTTON */}
                    <button
                      onClick={() => setSelectedRoutineForEvidence(routine)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>{routine.evidenceCount} Evidence</span>
                    </button>

                    {/* CONFIRM / REJECT BUTTONS FOR OBSERVED PATTERNS */}
                    {routine.status === 'observed_pattern' && (
                      <>
                        <button
                          onClick={() => handleConfirm(routine.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/20"
                        >
                          <Check size={12} />
                          <span>Confirm Routine</span>
                        </button>
                        <button
                          onClick={() => handleReject(routine.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-300 text-zinc-400 text-[11px] font-medium transition cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </>
                    )}

                    {/* EXECUTE NOW BUTTON FOR CONFIRMED ROUTINES */}
                    {routine.status === 'confirmed_routine' && (
                      <button
                        onClick={() => handleExecuteNow(routine.id)}
                        disabled={executingId === routine.id}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {executingId === routine.id ? (
                          <RefreshCw size={12} className="animate-spin text-amber-400" />
                        ) : (
                          <Play size={11} className="text-amber-400" />
                        )}
                        <span>Run Now</span>
                      </button>
                    )}
                  </div>

                  {/* SNOOZE / SKIP / PAUSE / DELETE CONTROLS */}
                  <div className="flex items-center gap-1">
                    {routine.status === 'confirmed_routine' && (
                      <>
                        {isPaused ? (
                          <button
                            onClick={() => handleResume(routine.id)}
                            title="Resume Routine"
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-500/20 text-emerald-300 transition"
                          >
                            <Play size={12} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePause(routine.id, 7)}
                            title="Pause for 1 Week"
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                          >
                            <Pause size={12} />
                          </button>
                        )}

                        <button
                          onClick={() => handleSnooze(routine.id, 15)}
                          title="Snooze 15 minutes"
                          className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono transition"
                        >
                          Snooze 15m
                        </button>

                        <button
                          onClick={() => handleSkipToday(routine.id)}
                          title="Skip for Today"
                          className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono transition"
                        >
                          Skip
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(routine.id)}
                      title="Delete Routine"
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition ml-1"
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

      {/* EVIDENCE INSPECTOR DRAWER / MODAL */}
      {selectedRoutineForEvidence && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400">
                  Authoritative Pattern Evidence
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedRoutineForEvidence.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoutineForEvidence(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-zinc-400">Inferred Confidence: </span>
                <span className="text-emerald-400 font-bold">{selectedRoutineForEvidence.confidence}%</span>
              </div>
              <div>
                <span className="text-zinc-400">Verified Evidence: </span>
                <span className="text-purple-300 font-bold">{selectedRoutineForEvidence.evidenceRecords.length} records</span>
              </div>
            </div>

            {/* TIMELINE OF REAL OBSERVATIONS */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {selectedRoutineForEvidence.evidenceRecords.map((ev, idx) => (
                <div key={ev.id || idx} className="p-3 rounded-xl bg-zinc-950/50 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-400 font-bold">#{idx + 1} {ev.date}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400 uppercase">
                      {ev.source.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{ev.summary}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              {selectedRoutineForEvidence.status === 'observed_pattern' ? (
                <button
                  onClick={() => {
                    handleConfirm(selectedRoutineForEvidence.id);
                    setSelectedRoutineForEvidence(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Check size={14} />
                  <span>Confirm as Routine</span>
                </button>
              ) : (
                <span className="text-xs text-zinc-500 font-mono">Active confirmed habit</span>
              )}
              <button
                onClick={() => setSelectedRoutineForEvidence(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL ROUTINE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">Create Custom Routine</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Routine Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Standup & PR Check"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Description / Intent</label>
                <input
                  type="text"
                  placeholder="e.g. Reviews unmerged PRs and compiles high priority blockers."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RoutineCategory)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {(Object.keys(ROUTINE_CATEGORY_META) as RoutineCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {ROUTINE_CATEGORY_META[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">Time of Day</label>
                  <input
                    type="time"
                    value={newTimeOfDay}
                    onChange={(e) => setNewTimeOfDay(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/50"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Recurrence Description</label>
                <input
                  type="text"
                  placeholder="e.g. Weekdays at 14:00"
                  value={newRecurrence}
                  onChange={(e) => setNewRecurrence(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="pt-2 border-t border-zinc-800/80">
                <span className="block text-[11px] font-mono text-purple-400 uppercase tracking-wider mb-2">
                  Action & Autonomy Gate
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Autonomy Domain</label>
                    <select
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value as AutonomyDomain)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/50 font-mono text-xs"
                    >
                      <option value="devspace">DevSpace Workspace</option>
                      <option value="github">GitHub & CI/CD</option>
                      <option value="calendar">Calendar & Schedule</option>
                      <option value="travel">Travel & Departure</option>
                      <option value="wellness">Wellness & Health</option>
                      <option value="notifications">Notifications & Alerts</option>
                      <option value="workflows">Teachable Workflows</option>
                      <option value="desktop">Desktop & OS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 font-medium mb-1">Risk Tier</label>
                    <select
                      value={newRiskLevel}
                      onChange={(e) => setNewRiskLevel(e.target.value as ActionRiskLevel)}
                      className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-amber-500/50 font-mono text-xs"
                    >
                      <option value="low">Low (Auto-executable if trusted)</option>
                      <option value="medium">Medium (Requires confirmation)</option>
                      <option value="high">High (Guarded)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-private"
                    checked={newIsPrivate}
                    onChange={(e) => setNewIsPrivate(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 text-amber-500"
                  />
                  <label htmlFor="chk-private" className="text-zinc-300 text-xs flex items-center gap-1 cursor-pointer">
                    <Lock size={11} className="text-cyan-400" />
                    Enforce Local-Only Privacy Isolation (Health / GPS data)
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Plus size={14} />
                <span>Save Routine</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
