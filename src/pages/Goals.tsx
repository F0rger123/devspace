import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FolderGit2,
  Repeat,
  Heart,
  BookOpen,
  Plane,
  Briefcase,
  Play,
  RotateCcw,
  Pause,
  Archive,
  Trash2,
  ShieldCheck,
  Search,
  Sliders,
  Layers,
  ArrowRight,
  Zap,
  Activity,
  CheckSquare,
} from 'lucide-react';
import {
  aetherGoals,
  AetherGoal,
  GoalCategory,
  GoalPriority,
  GoalStatus,
  GoalMilestone,
  GoalTask,
} from '../lib/aetherGoalsService';
import { useData } from '../context/DataProvider';
import { haptic } from '../utils/haptics';

export function Goals() {
  const [goals, setGoals] = useState<AetherGoal[]>(() => aetherGoals.getGoals());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Set<string>>(new Set(['goal-launch-devspace', 'goal-workout-routine']));

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nlGoalPrompt, setNlGoalPrompt] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState<GoalCategory>('work');
  const [manualPriority, setManualPriority] = useState<GoalPriority>('p1_high');
  const [manualTargetDate, setManualTargetDate] = useState('');
  const [manualMilestones, setManualMilestones] = useState('');
  const [isAiDecomposing, setIsAiDecomposing] = useState(false);

  // Re-plan modal state
  const [replanGoalId, setReplanGoalId] = useState<string | null>(null);
  const [replanDays, setReplanDays] = useState<number>(7);
  const [replanReason, setReplanReason] = useState<string>('Schedule adjusted to balance active sprint priorities');
  const [rebalanceMilestones, setRebalanceMilestones] = useState<boolean>(true);

  // Autonomy action feedback
  const [actionFeedback, setActionFeedback] = useState<{ goalId: string; message: string; success: boolean } | null>(null);

  const { projects } = useData();

  useEffect(() => {
    const unsub = aetherGoals.subscribe((updated) => {
      setGoals(updated);
    });
    return () => unsub();
  }, []);

  const toggleExpandGoal = (id: string) => {
    haptic.light();
    setExpandedGoalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Metrics
  const activeGoals = goals.filter((g) => g.status === 'active' || g.status === 'behind_schedule');
  const behindScheduleGoals = goals.filter((g) => g.isFallingBehind);
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const totalMilestones = goals.reduce((sum, g) => sum + (g.milestones?.length || 0), 0);
  const completedMilestones = goals.reduce(
    (sum, g) => sum + (g.milestones?.filter((m) => m.completed).length || 0),
    0
  );

  // Filtering
  const filteredGoals = goals.filter((g) => {
    if (selectedCategory !== 'all' && g.category !== selectedCategory) {
      if (selectedCategory === 'work' && (g.category === 'coding' || g.category === 'project')) return true;
      return false;
    }
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'behind_schedule' && !g.isFallingBehind) return false;
      if (selectedStatus === 'active' && g.status !== 'active' && g.status !== 'behind_schedule') return false;
      if (selectedStatus === 'completed' && g.status !== 'completed') return false;
      if (selectedStatus === 'paused' && g.status !== 'paused') return false;
      if (selectedStatus === 'archived' && g.status !== 'archived') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchDesc = g.description.toLowerCase().includes(q);
      const matchMs = g.milestones.some((m) => m.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchMs) return false;
    }
    return true;
  });

  // Handlers
  const handleNlCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlGoalPrompt.trim()) return;
    setIsAiDecomposing(true);
    setTimeout(() => {
      aetherGoals.createGoalFromNaturalLanguage(nlGoalPrompt);
      setNlGoalPrompt('');
      setIsAiDecomposing(false);
      setShowCreateModal(false);
      haptic.medium();
    }, 400);
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    const msTitles = manualMilestones
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    aetherGoals.createGoal({
      title: manualTitle,
      category: manualCategory,
      priority: manualPriority,
      targetDate: manualTargetDate || undefined,
      milestoneTitles: msTitles,
    });

    setManualTitle('');
    setManualTargetDate('');
    setManualMilestones('');
    setShowCreateModal(false);
    haptic.medium();
  };

  const handleRunNextAction = async (goalId: string) => {
    haptic.medium();
    const res = await aetherGoals.executeNextAction(goalId);
    setActionFeedback({ goalId, message: res.message, success: res.success });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleBreakIntoSmallerSteps = (goalId: string) => {
    haptic.light();
    aetherGoals.breakGoalIntoSmallerSteps(goalId);
    setExpandedGoalIds((prev) => new Set([...prev, goalId]));
  };

  const handleMakeTopPriority = (goalId: string) => {
    haptic.light();
    aetherGoals.makeTopPriority(goalId);
  };

  const handleOpenReplan = (goalId: string) => {
    haptic.light();
    setReplanGoalId(goalId);
  };

  const handleConfirmReplan = () => {
    if (!replanGoalId) return;
    haptic.medium();
    aetherGoals.replanGoal(replanGoalId, {
      extendDays: replanDays,
      reason: replanReason,
      rebalanceMilestones,
    });
    setReplanGoalId(null);
  };

  const getCategoryBadge = (cat: GoalCategory) => {
    switch (cat) {
      case 'work':
      case 'coding':
      case 'project':
        return { label: 'Work & Projects', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: Briefcase };
      case 'health':
        return { label: 'Health & Wellness', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: Heart };
      case 'learning':
        return { label: 'Learning & Skills', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: BookOpen };
      case 'routine':
        return { label: 'Routines & Habits', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Repeat };
      case 'travel':
        return { label: 'Travel & Trips', bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: Plane };
      default:
        return { label: 'Personal Life', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', icon: Target };
    }
  };

  const getPriorityBadge = (p: GoalPriority) => {
    switch (p) {
      case 'p0_urgent':
        return { label: 'P0 Urgent', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', ping: true };
      case 'p1_high':
        return { label: 'P1 High', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };
      case 'p2_medium':
        return { label: 'P2 Medium', bg: 'bg-zinc-700/30', text: 'text-zinc-300', border: 'border-zinc-700/50' };
      default:
        return { label: 'P3 Low', bg: 'bg-zinc-800/40', text: 'text-zinc-400', border: 'border-zinc-800' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0a0c] text-zinc-100 p-6 md:p-8 space-y-8 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Target size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Aether Goals & Personal Planning
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono font-medium">
                  Evidence-Grounded
                </span>
              </h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Long-term milestone tracking across work, health, routines, projects, learning, travel, and personal life.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              haptic.light();
              aetherGoals.detectBlockersAndScheduleAdherence();
            }}
            className="px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-2 transition"
            title="Scan active goals for blockers or schedule lag"
          >
            <Activity size={14} className="text-amber-400" />
            Check Schedule Health
          </button>
          <button
            onClick={() => {
              haptic.medium();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition"
          >
            <Plus size={15} />
            New Goal
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Active Goals</span>
            <Target size={14} className="text-indigo-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">{activeGoals.length}</span>
            <span className="text-[11px] text-zinc-500 ml-2">in progress</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Schedule Health</span>
            {behindScheduleGoals.length > 0 ? (
              <AlertTriangle size={14} className="text-amber-400" />
            ) : (
              <CheckCircle2 size={14} className="text-emerald-400" />
            )}
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold font-mono ${behindScheduleGoals.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {behindScheduleGoals.length > 0 ? `${behindScheduleGoals.length} Behind` : '100% On Track'}
            </span>
            <span className="text-[11px] text-zinc-500 ml-2">pace score</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Milestone Checkpoints</span>
            <CheckSquare size={14} className="text-blue-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {completedMilestones} / {totalMilestones}
            </span>
            <span className="text-[11px] text-zinc-500 ml-2">
              ({totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Completed Goals</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-400">{completedGoals.length}</span>
            <span className="text-[11px] text-zinc-500 ml-2">achieved</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full font-mono text-xs">
          {[
            { id: 'all', label: 'All Goals' },
            { id: 'work', label: 'Work & Projects' },
            { id: 'health', label: 'Health & Wellness' },
            { id: 'learning', label: 'Learning' },
            { id: 'routine', label: 'Routines' },
            { id: 'travel', label: 'Travel' },
            { id: 'personal', label: 'Personal' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  haptic.light();
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition font-medium ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                    : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search goals or milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active & On Track</option>
            <option value="behind_schedule">Behind Schedule</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Action Execution Toast Feedback */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
            actionFeedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-zinc-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="p-12 rounded-2xl bg-zinc-900/20 border border-dashed border-zinc-800 text-center space-y-4">
            <Target size={36} className="mx-auto text-zinc-600" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-300">No matching goals found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Create a goal using natural conversation (e.g. “I want to launch DevSpace beta in six weeks”) or click New Goal above.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Establish First Goal
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const isExpanded = expandedGoalIds.has(goal.id);
            const catBadge = getCategoryBadge(goal.category);
            const priBadge = getPriorityBadge(goal.priority);
            const CatIcon = catBadge.icon;

            const daysLeft = goal.targetDate
              ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <div
                key={goal.id}
                className={`rounded-2xl border transition-all ${
                  goal.isFallingBehind
                    ? 'bg-[#120f0d]/80 border-amber-500/40 shadow-lg shadow-amber-950/20'
                    : goal.status === 'completed'
                    ? 'bg-zinc-900/30 border-emerald-500/30 opacity-80'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Goal Header Summary */}
                <div className="p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                        <span className={`px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 font-semibold ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}>
                          <CatIcon size={11} />
                          {catBadge.label}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1.5 ${priBadge.bg} ${priBadge.text} ${priBadge.border}`}>
                          {priBadge.ping && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                          {priBadge.label}
                        </span>

                        {goal.targetDate && (
                          <span
                            className={`px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              daysLeft !== null && daysLeft < 0
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : daysLeft !== null && daysLeft <= 7
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                            }`}
                          >
                            <Calendar size={11} />
                            Target: {goal.targetDate} ({daysLeft !== null ? (daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`) : ''})
                          </span>
                        )}

                        {goal.status === 'completed' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                            COMPLETED
                          </span>
                        )}

                        {goal.status === 'paused' && (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-700/40 border border-zinc-600/40 text-zinc-300">
                            PAUSED
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{goal.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Progress Circle & Quick Actions */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-bold font-mono text-white">{goal.progress}%</div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {goal.evidenceRecords?.length || 0} verified evidence
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpandGoal(goal.id)}
                        className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 transition"
                        title={isExpanded ? 'Collapse milestones' : 'Expand milestones'}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        goal.status === 'completed'
                          ? 'bg-emerald-500'
                          : goal.isFallingBehind
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>

                  {/* Next Recommended Action Banner */}
                  {goal.nextAction && goal.status !== 'completed' && (
                    <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                          <Zap size={14} />
                        </div>
                        <div>
                          <span className="font-semibold text-indigo-200">Next Recommended Action: </span>
                          <span className="text-zinc-300">{goal.nextAction.title}</span>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">{goal.nextAction.description}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRunNextAction(goal.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition shrink-0"
                      >
                        <Play size={12} />
                        Execute Action
                      </button>
                    </div>
                  )}

                  {/* Blocker Callout if Behind Schedule */}
                  {goal.isFallingBehind && (
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold">
                        <AlertTriangle size={14} />
                        <span>Schedule Lag & Blocker Detected</span>
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {goal.behindReason || 'Progress velocity is lagging behind the target timeline.'}
                      </p>
                      {goal.blockers && goal.blockers.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-amber-800/30 font-mono text-[10px] text-amber-200/90">
                          {goal.blockers.map((b) => (
                            <div key={b.id} className="flex items-center gap-1.5">
                              <span>• {b.title}: {b.resolutionSuggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => handleOpenReplan(goal.id)}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] border border-amber-500/30 flex items-center gap-1"
                        >
                          <RotateCcw size={11} />
                          Re-Plan Deadline (+1 Week)
                        </button>
                        <button
                          onClick={() => handleBreakIntoSmallerSteps(goal.id)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-[10px] border border-zinc-700 flex items-center gap-1"
                        >
                          <Sparkles size={11} className="text-indigo-400" />
                          Decompose Milestone
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Linked Context Tags */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-400">
                    {goal.linkedContext?.projectNames?.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 flex items-center gap-1 text-zinc-300">
                        <FolderGit2 size={10} className="text-blue-400" />
                        Project: {p}
                      </span>
                    ))}
                    {goal.linkedContext?.routineNames?.map((r, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 flex items-center gap-1 text-zinc-300">
                        <Repeat size={10} className="text-amber-400" />
                        Routine: {r}
                      </span>
                    ))}
                    {goal.linkedContext?.wellnessMetricTarget && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 flex items-center gap-1 text-zinc-300">
                        <Heart size={10} className="text-emerald-400" />
                        Target: {goal.linkedContext.wellnessMetricTarget.targetValue} {goal.linkedContext.wellnessMetricTarget.metricType.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Milestones & Task Breakdown */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 p-5 bg-zinc-950/50 space-y-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-2">
                        <Layers size={13} className="text-indigo-400" />
                        Milestones & Action Items ({goal.milestones?.length || 0})
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBreakIntoSmallerSteps(goal.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 transition"
                        >
                          <Sparkles size={12} />
                          Decompose Active Milestone
                        </button>
                        <button
                          onClick={() => {
                            const title = prompt('Enter new milestone title:');
                            if (title) aetherGoals.addMilestoneToGoal(goal.id, title);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5 transition"
                        >
                          <Plus size={12} />
                          Add Milestone
                        </button>
                      </div>
                    </div>

                    {/* Milestones Accordion / List */}
                    <div className="space-y-3">
                      {goal.milestones?.map((ms) => (
                        <div
                          key={ms.id}
                          className={`p-3.5 rounded-xl border transition ${
                            ms.completed
                              ? 'bg-emerald-950/10 border-emerald-900/30'
                              : 'bg-zinc-900/50 border-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={ms.completed}
                                onChange={() => {
                                  haptic.light();
                                  aetherGoals.toggleMilestone(goal.id, ms.id);
                                }}
                                className="mt-1 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                              <div>
                                <div className={`text-xs font-bold ${ms.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                                  {ms.title}
                                </div>
                                {ms.description && (
                                  <p className="text-[11px] text-zinc-400 mt-0.5">{ms.description}</p>
                                )}
                              </div>
                            </div>

                            {ms.targetDate && (
                              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                Target: {ms.targetDate}
                              </span>
                            )}
                          </div>

                          {/* Sub-Tasks Checklist */}
                          {ms.tasks && ms.tasks.length > 0 && (
                            <div className="mt-3 pl-6 space-y-2 border-t border-zinc-800/40 pt-2.5">
                              {ms.tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between gap-2 text-xs">
                                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                                    <input
                                      type="checkbox"
                                      checked={task.completed}
                                      onChange={() => {
                                        haptic.light();
                                        aetherGoals.toggleTask(goal.id, ms.id, task.id);
                                      }}
                                      className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                                    />
                                    <span className={task.completed ? 'line-through text-zinc-500' : 'text-zinc-300'}>
                                      {task.title}
                                    </span>
                                  </label>
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-mono text-zinc-400">
                                    {task.domain}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Bottom Action Footer for Goal Management */}
                    <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMakeTopPriority(goal.id)}
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1.5 font-medium transition"
                        >
                          <Target size={12} className="text-red-400" />
                          Set P0 Top Priority
                        </button>
                        <button
                          onClick={() => handleOpenReplan(goal.id)}
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1.5 font-medium transition"
                        >
                          <RotateCcw size={12} className="text-amber-400" />
                          Re-Plan Schedule
                        </button>
                        {goal.status === 'active' || goal.status === 'behind_schedule' ? (
                          <button
                            onClick={() => {
                              haptic.light();
                              aetherGoals.pauseGoal(goal.id);
                            }}
                            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1.5 font-medium transition"
                          >
                            <Pause size={12} />
                            Pause Goal
                          </button>
                        ) : goal.status === 'paused' ? (
                          <button
                            onClick={() => {
                              haptic.light();
                              aetherGoals.resumeGoal(goal.id);
                            }}
                            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1.5 font-medium transition"
                          >
                            <Play size={12} />
                            Resume Goal
                          </button>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {goal.status !== 'completed' && (
                          <button
                            onClick={() => {
                              haptic.medium();
                              aetherGoals.completeGoal(goal.id);
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition"
                          >
                            <CheckCircle2 size={12} />
                            Mark Completed
                          </button>
                        )}
                        <button
                          onClick={() => {
                            haptic.light();
                            aetherGoals.archiveGoal(goal.id);
                          }}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                          title="Archive Goal"
                        >
                          <Archive size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete goal "${goal.title}"?`)) {
                              haptic.medium();
                              aetherGoals.deleteGoal(goal.id);
                            }
                          }}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-red-400 hover:text-red-300 border border-zinc-800 transition"
                          title="Delete Goal"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Goal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Aether Long-Term Goal</h3>
                  <p className="text-xs text-zinc-400">Establish target with automatic AI milestone decomposition</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            {/* Natural Language Prompt Formulation */}
            <form onSubmit={handleNlCreate} className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles size={13} />
                Natural Language Goal Setup
              </label>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Type what you want to achieve in plain English. Aether will auto-detect categories, timeline, calculate deadlines, and decompose milestones.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. I want to launch DevSpace beta in six weeks"
                  value={nlGoalPrompt}
                  onChange={(e) => setNlGoalPrompt(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isAiDecomposing || !nlGoalPrompt.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition shrink-0"
                >
                  {isAiDecomposing ? <RotateCcw size={13} className="animate-spin" /> : <Play size={13} />}
                  Auto-Decompose
                </button>
              </div>
            </form>

            <div className="relative text-center">
              <span className="bg-[#121216] px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Or Configure Manually
              </span>
              <div className="absolute inset-0 top-1/2 -z-10 border-t border-zinc-800" />
            </div>

            {/* Manual Form */}
            <form onSubmit={handleManualCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master React Native & Offline State Sync"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as GoalCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="work">Work</option>
                    <option value="project">Project</option>
                    <option value="health">Health & Wellness</option>
                    <option value="learning">Learning</option>
                    <option value="routine">Routine & Habit</option>
                    <option value="travel">Travel</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Priority</label>
                  <select
                    value={manualPriority}
                    onChange={(e) => setManualPriority(e.target.value as GoalPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="p0_urgent">P0 Urgent</option>
                    <option value="p1_high">P1 High</option>
                    <option value="p2_medium">P2 Medium</option>
                    <option value="p3_low">P3 Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={manualTargetDate}
                    onChange={(e) => setManualTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Milestones (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Phase 1: Architecture review and test workspace&#10;Phase 2: Prototype development and verified benchmarks"
                  value={manualMilestones}
                  onChange={(e) => setManualMilestones(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Re-Plan Schedule */}
      {replanGoalId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Re-Plan & Adjust Goal Schedule</h3>
              </div>
              <button
                onClick={() => setReplanGoalId(null)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Extend Target Deadline By</label>
                <select
                  value={replanDays}
                  onChange={(e) => setReplanDays(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value={7}>+1 Week (7 days)</option>
                  <option value={14}>+2 Weeks (14 days)</option>
                  <option value={30}>+1 Month (30 days)</option>
                  <option value={60}>+2 Months (60 days)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Reason for Re-Planning</label>
                <input
                  type="text"
                  value={replanReason}
                  onChange={(e) => setReplanReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={rebalanceMilestones}
                  onChange={(e) => setRebalanceMilestones(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                />
                <span>Automatically rebalance incomplete milestone target dates evenly</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setReplanGoalId(null)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReplan}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
              >
                Apply Re-Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
