import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Clock,
  Brain,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  Layers,
  Flame,
  Plus,
  Trash2,
  BarChart3,
  MessageSquare,
  Compass,
  Zap,
  TrendingUp,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  aetherDailyOperatingService,
  DecisionMemoryItem,
  RecommendationFeedbackRecord,
} from '../lib/aetherDailyOperatingService';

export function AetherDailyOperatingHub() {
  const [activeTab, setActiveTab] = useState<'morning' | 'context' | 'evening' | 'decisions' | 'journey' | 'continuity'>('morning');

  const [morningBrief] = useState(() => aetherDailyOperatingService.getMorningBriefing());
  const [continuousContext, setContinuousContext] = useState(() => aetherDailyOperatingService.getContinuousContext());
  const [eveningWrapUp] = useState(() => aetherDailyOperatingService.getEveningWrapUp());
  const [decisions, setDecisions] = useState<DecisionMemoryItem[]>(() => aetherDailyOperatingService.getDecisionMemories());
  const [feedbackList] = useState<RecommendationFeedbackRecord[]>(() => aetherDailyOperatingService.getRecommendationFeedback());
  const [focusJourney] = useState(() => aetherDailyOperatingService.getFocusJourneyMetrics());
  const [continuityHistory] = useState(() => aetherDailyOperatingService.getConversationContinuityHistory());

  // Form State for Decision Memory
  const [newRule, setNewRule] = useState('');
  const [newCategory, setNewCategory] = useState<DecisionMemoryItem['category']>('git');
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;

    aetherDailyOperatingService.addDecisionMemory(newRule, newCategory);
    setDecisions(aetherDailyOperatingService.getDecisionMemories());
    setNewRule('');
    setShowDecisionModal(false);
  };

  const handleRemoveDecision = (id: string) => {
    aetherDailyOperatingService.removeDecisionMemory(id);
    setDecisions(aetherDailyOperatingService.getDecisionMemories());
  };

  const handleRecordFeedback = (recId: string, title: string, outcome: RecommendationFeedbackRecord['outcome']) => {
    aetherDailyOperatingService.recordRecommendationOutcome(recId, title, outcome);
    alert(`Recorded recommendation outcome as "${outcome.toUpperCase()}". Aether's recommendation engine updated.`);
  };

  return (
    <div className="space-y-6 font-sans text-zinc-200">
      {/* HEADER HERO */}
      <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Compass size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>Aether Daily Operating Intelligence</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold uppercase">
                  ACTIVE SYNC
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Unified daily rhythm: Morning Briefing, Continuous Daily Context, Evening Wrap-up, Decision Memory, and Focus Journey.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2 overflow-x-auto font-mono text-xs">
        {[
          { id: 'morning', label: 'Morning Briefing', icon: Sun },
          { id: 'context', label: 'Continuous Context', icon: Layers },
          { id: 'evening', label: 'Evening Wrap-Up', icon: Moon },
          { id: 'decisions', label: 'Decision Memory', icon: Brain },
          { id: 'journey', label: 'Focus Journey', icon: Flame },
          { id: 'continuity', label: 'Conversation Continuity', icon: MessageSquare },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 whitespace-nowrap transition font-bold ${
                isActive
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <IconComp size={14} className={isActive ? 'text-amber-400' : 'text-zinc-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: MORNING BRIEFING */}
      {activeTab === 'morning' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Sun size={18} />
                <span>Today's Morning Briefing ({morningBrief.date})</span>
              </span>
              <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]">
                {morningBrief.weather?.location} • {morningBrief.weather?.condition} ({morningBrief.weather?.tempF}°F)
              </span>
            </div>

            <p className="text-xs font-sans text-zinc-200 leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800/80">
              {morningBrief.naturalNarrative}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block">Pending Dreams</span>
                <span className="font-bold text-amber-300 text-base">{morningBrief.dreamsWaitingReviewCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block">Open Issues</span>
                <span className="font-bold text-rose-400 text-base">{morningBrief.openIssuesCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block">Pending PRs</span>
                <span className="font-bold text-cyan-300 text-base">{morningBrief.pendingPRsCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block">Est. Workload</span>
                <span className="font-bold text-emerald-400 text-base">{morningBrief.estimatedWorkloadHours} hrs</span>
              </div>
            </div>

            {/* CALENDAR & FOCUS GOALS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-300 text-xs flex items-center gap-1.5">
                  <Calendar size={14} className="text-cyan-400" />
                  <span>Today's Calendar Schedule</span>
                </span>
                <div className="space-y-1.5">
                  {morningBrief.calendarEvents.map((evt, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 font-bold">{evt.time}</span>
                      <span className="text-zinc-200">{evt.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <span className="font-bold text-zinc-300 text-xs flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" />
                  <span>Current Active Goals</span>
                </span>
                <div className="space-y-1.5">
                  {morningBrief.currentFocusGoals.map((g, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTINUOUS DAILY CONTEXT */}
      {activeTab === 'context' && (
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            <span>Real-Time Continuous Daily Context</span>
          </h3>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 font-sans text-xs">
            <span className="text-zinc-400 block font-mono text-[10px] uppercase">Core Daily Objective</span>
            <p className="text-zinc-100 font-semibold">{continuousContext.todayObjective}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="font-bold text-zinc-300 text-xs">Active Project & Task</span>
              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-zinc-500">Project:</span> <span className="text-cyan-300 font-bold">{continuousContext.currentProject}</span></div>
                <div><span className="text-zinc-500">Task:</span> <span className="text-zinc-200">{continuousContext.currentTask}</span></div>
                <div><span className="text-zinc-500">Active Dream:</span> <span className="text-amber-300 font-bold">{continuousContext.activeDreamTitle}</span></div>
                <div><span className="text-zinc-500">Active Agent:</span> <span className="text-indigo-400 font-bold">{continuousContext.activeAgentName}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="font-bold text-zinc-300 text-xs">Subsystem Counts</span>
              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-zinc-500">Planner Items:</span> <span className="text-zinc-200 font-bold">{continuousContext.activePlannerItemsCount} active</span></div>
                <div><span className="text-zinc-500">Tracked Goals:</span> <span className="text-emerald-400 font-bold">{continuousContext.activeGoalsCount} active</span></div>
                <div><span className="text-zinc-500">Top Recommendation:</span> <span className="text-amber-300 font-bold">{continuousContext.topRecommendationTitle}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENING WRAP-UP */}
      {activeTab === 'evening' && (
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="font-bold text-indigo-300 text-sm flex items-center gap-2">
              <Moon size={18} />
              <span>Evening Reflection & Daily Wrap-Up ({eveningWrapUp.date})</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
              {eveningWrapUp.focusDurationFormatted}
            </span>
          </div>

          <p className="text-xs font-sans text-zinc-200 leading-relaxed bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            {eveningWrapUp.reflectionNarrative}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block">Dreams Completed</span>
              <span className="font-bold text-amber-300 text-base">{eveningWrapUp.dreamsCompleted}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block">PRs Merged</span>
              <span className="font-bold text-cyan-300 text-base">{eveningWrapUp.prsMerged}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block">Issues Resolved</span>
              <span className="font-bold text-emerald-400 text-base">{eveningWrapUp.issuesResolved}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block">Tech Debt Delta</span>
              <span className="font-bold text-emerald-400 text-base">{eveningWrapUp.techDebtDelta}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="font-bold text-zinc-300 text-xs">Tomorrow's Priorities</span>
            <div className="space-y-1 text-zinc-300 text-[11px] font-sans">
              {eveningWrapUp.tomorrowsPriorities.map((pri, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-amber-400 shrink-0" />
                  <span>{pri}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DECISION MEMORY */}
      {activeTab === 'decisions' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <Brain size={16} className="text-cyan-400" />
              <span>Durable Decision Memory Rules ({decisions.length} Active Rules)</span>
            </h3>

            <button
              onClick={() => setShowDecisionModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Decision Rule</span>
            </button>
          </div>

          <div className="space-y-3">
            {decisions.map((dec) => (
              <div key={dec.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] uppercase font-bold">
                      {dec.category}
                    </span>
                    <span className="font-bold text-zinc-100">{dec.rule}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block">Added: {new Date(dec.createdAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => handleRemoveDecision(dec.id)}
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete Decision Rule"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* RECOMMENDATION FEEDBACK HISTORY */}
          <div className="p-4 rounded-2xl bg-[#121316] border border-zinc-800 space-y-3 pt-4">
            <span className="font-bold text-zinc-300 text-xs">Recommendation Feedback Outcomes ({feedbackList.length})</span>
            <div className="space-y-1.5">
              {feedbackList.map((fb) => (
                <div key={fb.id} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-200">{fb.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    fb.outcome === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {fb.outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FOCUS JOURNEY */}
      {activeTab === 'journey' && (
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Flame size={16} className="text-amber-400" />
            <span>Focus Journey Trends & Behavioral Metrics</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Avg Duration</span>
              <span className="font-bold text-amber-300 text-base">{focusJourney.averageDurationMinutes}m</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Longest Streak</span>
              <span className="font-bold text-emerald-400 text-base">{focusJourney.longestStreakDays} days</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Total Sessions</span>
              <span className="font-bold text-cyan-300 text-base">{focusJourney.totalFocusSessions}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 text-[10px] block">Break Quality</span>
              <span className="font-bold text-emerald-400 text-base">{focusJourney.breakQualityRating}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="font-bold text-zinc-300 text-xs">Observed Productive Trends</span>
            <div className="space-y-1.5 font-sans text-xs text-zinc-300">
              {focusJourney.trends.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CONVERSATION CONTINUITY */}
      {activeTab === 'continuity' && (
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-400" />
            <span>Workspace Grounded Conversation Continuity</span>
          </h3>

          <div className="space-y-3 font-sans text-xs">
            {continuityHistory.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-indigo-300">Previous Intent ({item.date})</span>
                </div>
                <p className="text-zinc-300">{item.summary}</p>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-amber-300 font-mono">
                  <strong>Aether Continuity Observation:</strong> {item.followUpContext}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD DECISION RULE */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-100 text-sm">Add Decision Memory Rule</span>
              <button onClick={() => setShowDecisionModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDecision} className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Decision / Rule Text</label>
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="e.g. 'Always run unit tests before approval'"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="git">Git & Branching</option>
                  <option value="deployment">Deployment</option>
                  <option value="review">Code Review</option>
                  <option value="ai_model">AI Model Preference</option>
                  <option value="notification">Notifications</option>
                  <option value="general">General Preference</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-zinc-950 font-bold"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
