import React, { useState, useEffect } from 'react';
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
  GitCommit,
  GitPullRequest,
  AlertTriangle,
  Lightbulb,
  FileText,
  History,
  Tag,
  Repeat,
  Target,
  ArrowRight,
  Play,
  Users,
  Handshake,
  CheckSquare as CheckSquareIcon
} from 'lucide-react';
import { aetherGoals, AetherGoal } from '../lib/aetherGoalsService';
import { aetherPeople, PersonProfile } from '../lib/aetherPeopleService';
import {
  aetherDailyOperatingService,
  DecisionMemoryItem,
  RecommendationFeedbackRecord,
} from '../lib/aetherDailyOperatingService';
import {
  aetherActiveProjectContext,
  ActivityTimelineItem,
  ProactiveSuggestionItem
} from '../lib/aetherActiveProjectContext';
import { AetherProactiveIntelligenceHub } from './ui/AetherProactiveIntelligenceHub';
import { AetherRoutinesTab } from './AetherRoutinesTab';
import { AetherMeetingIntelligenceTab } from './AetherMeetingIntelligenceTab';

export function AetherDailyOperatingHub() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'goals' | 'routines' | 'people' | 'proactive' | 'timeline' | 'morning' | 'context' | 'evening' | 'decisions' | 'journey' | 'continuity'>('meetings');
  const [goalsList, setGoalsList] = useState<AetherGoal[]>(() => aetherGoals.getGoals());
  const [peopleList, setPeopleList] = useState<PersonProfile[]>(() => aetherPeople.getPeople());

  useEffect(() => {
    const unsubGoals = aetherGoals.subscribe((updated) => setGoalsList(updated));
    const unsubPeople = aetherPeople.subscribe((updated) => setPeopleList(updated));
    return () => {
      unsubGoals();
      unsubPeople();
    };
  }, []);

  const [morningBrief] = useState(() => aetherDailyOperatingService.getMorningBriefing());
  const [continuousContext, setContinuousContext] = useState(() => aetherDailyOperatingService.getContinuousContext());
  const [eveningWrapUp] = useState(() => aetherDailyOperatingService.getEveningWrapUp());
  const [decisions, setDecisions] = useState<DecisionMemoryItem[]>(() => aetherDailyOperatingService.getDecisionMemories());
  const [feedbackList] = useState<RecommendationFeedbackRecord[]>(() => aetherDailyOperatingService.getRecommendationFeedback());
  const [focusJourney] = useState(() => aetherDailyOperatingService.getFocusJourneyMetrics());
  const [continuityHistory] = useState(() => aetherDailyOperatingService.getConversationContinuityHistory());

  // Activity Memory & Proactive State
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'verified_fact' | 'aether_inference'>('all');
  const [timelineSourceFilter, setTimelineSourceFilter] = useState<string>('all');
  const [timelineItems, setTimelineItems] = useState<ActivityTimelineItem[]>(() =>
    aetherActiveProjectContext.getActivityTimeline()
  );
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestionItem[]>(() =>
    aetherActiveProjectContext.getProactiveSuggestions({ forceInclude: true })
  );
  const [temporalQuickResult, setTemporalQuickResult] = useState<{ title: string; text: string } | null>(null);

  useEffect(() => {
    const items = aetherActiveProjectContext.getActivityTimeline({
      classification: timelineFilter === 'all' ? undefined : timelineFilter,
      source: timelineSourceFilter === 'all' ? undefined : timelineSourceFilter
    });
    setTimelineItems(items);
  }, [timelineFilter, timelineSourceFilter]);

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

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const handleRecordFeedback = (recId: string, title: string, outcome: RecommendationFeedbackRecord['outcome']) => {
    aetherDailyOperatingService.recordRecommendationOutcome(recId, title, outcome);
    setFeedbackToast(`Recorded outcome as "${outcome.toUpperCase()}" for ${title}.`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleRunTemporalQuery = (queryType: 'yesterday' | 'this_morning' | 'unfinished' | 'top_project' | 'since_last_opened') => {
    if (queryType === 'yesterday') {
      const rep = aetherActiveProjectContext.getRecentWorkReport({ timeFilter: 'yesterday' });
      setTemporalQuickResult({ title: 'Work Done Yesterday', text: rep.summaryText });
    } else if (queryType === 'this_morning') {
      const rep = aetherActiveProjectContext.getRecentWorkReport({ timeFilter: 'this_morning' });
      setTemporalQuickResult({ title: 'Changes This Morning', text: rep.summaryText });
    } else if (queryType === 'unfinished') {
      const rep = aetherActiveProjectContext.getUnfinishedWork();
      setTemporalQuickResult({ title: 'Unfinished Work & Blockers', text: rep.markdownText });
    } else if (queryType === 'top_project') {
      const rep = aetherActiveProjectContext.getTopProjectThisWeek();
      setTemporalQuickResult({ title: 'Top Project Time Spent (This Week)', text: rep.markdownText });
    } else if (queryType === 'since_last_opened') {
      const rep = aetherActiveProjectContext.getChangesSinceLastOpened();
      setTemporalQuickResult({ title: 'Changes Since Last Opened', text: rep.markdownText });
    }
  };

  return (
    <div className="space-y-6 font-sans text-zinc-200">
      {/* HEADER HERO */}
      <div className="p-6 rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-white/10 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
              <Compass size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>Aether Activity Memory & Daily Intelligence</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
                  ACTIVE SYNC
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Authoritative activity timeline, verified facts vs inferences, proactive suggestions, and temporal intelligence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2 overflow-x-auto font-mono text-xs">
        {[
          { id: 'meetings', label: 'Meeting Intelligence', icon: Calendar },
          { id: 'goals', label: 'Goals & Milestones', icon: Target },
          { id: 'routines', label: 'Routines & Habits', icon: Repeat },
          { id: 'people', label: 'People & Contacts', icon: Users },
          { id: 'proactive', label: 'Proactive Intelligence', icon: Sparkles },
          { id: 'timeline', label: 'Activity Timeline & Memory', icon: Clock },
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
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-900/50 backdrop-blur border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <IconComp size={14} className={isActive ? 'text-amber-400' : 'text-zinc-500'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <a
          href="#/memory"
          onClick={(e) => {
            if (typeof window !== 'undefined') {
              if (window.location.hash.startsWith('#')) {
                window.location.hash = '/memory';
              } else {
                window.location.pathname = '/memory';
              }
            }
          }}
          className="px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center gap-2 whitespace-nowrap transition font-bold cursor-pointer ml-auto"
        >
          <Brain size={14} className="text-amber-400" />
          <span>Long-Term Memory Hub →</span>
        </a>
      </div>

      {/* TAB: MEETING INTELLIGENCE */}
      {activeTab === 'meetings' && (
        <AetherMeetingIntelligenceTab />
      )}

      {/* TAB: GOALS & PERSONAL PLANNING */}
      {activeTab === 'goals' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <Target size={16} className="text-indigo-400" />
                  <span>Aether Goals & Active Milestones</span>
                </span>
                <p className="text-zinc-400 text-xs mt-1 font-sans">
                  Real progress calculated directly from verified milestones, tasks, GitHub activity, and wellness data.
                </p>
              </div>

              <a
                href="#/goals"
                onClick={(e) => {
                  if (typeof window !== 'undefined') {
                    if (window.location.hash.startsWith('#')) {
                      window.location.hash = '/goals';
                    } else {
                      window.location.pathname = '/goals';
                    }
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/20 w-fit"
              >
                <span>Open Full Goals Hub</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Top Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {goalsList.filter((g) => g.status !== 'archived').slice(0, 4).map((goal) => {
                const activeMs = goal.milestones.find((m) => !m.completed) || goal.milestones[0];
                return (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-xl border transition ${
                      goal.isFallingBehind
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-bold uppercase">
                            {goal.category}
                          </span>
                          {goal.isFallingBehind && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                              BEHIND SCHEDULE
                            </span>
                          )}
                        </div>
                        <h4 className="text-zinc-100 font-bold text-sm font-sans">{goal.title}</h4>
                      </div>

                      <span className="text-lg font-bold font-mono text-white shrink-0">
                        {goal.progress}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full my-3 overflow-hidden">
                      <div
                        className={`h-full ${goal.isFallingBehind ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>

                    {/* Active Milestone */}
                    {activeMs && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 text-[11px] space-y-1">
                        <div className="text-zinc-400 flex items-center justify-between">
                          <span>Active Milestone</span>
                          <span className="text-zinc-500">{activeMs.targetDate || 'Open'}</span>
                        </div>
                        <div className="text-zinc-200 font-sans font-medium">{activeMs.title}</div>
                      </div>
                    )}

                    {/* Next Action Executable */}
                    {goal.nextAction && (
                      <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800/60 font-sans">
                        <div className="truncate flex-1 pr-2">
                          <span className="text-indigo-400 font-semibold">Next: </span>
                          <span className="text-zinc-300">{goal.nextAction.title}</span>
                        </div>
                        <button
                          onClick={async () => {
                            await aetherGoals.executeNextAction(goal.id);
                          }}
                          className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] font-bold flex items-center gap-1 shrink-0"
                        >
                          <Play size={10} />
                          Run
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: ROUTINES & HABIT INTELLIGENCE */}
      {activeTab === 'routines' && (
        <AetherRoutinesTab />
      )}

      {/* TAB: PEOPLE & RELATIONSHIP INTELLIGENCE */}
      {activeTab === 'people' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" />
                  <span>People, Collaborators & Relationship Intelligence</span>
                </span>
                <p className="text-zinc-400 text-xs mt-1 font-sans">
                  Grounded meeting preparation, commitment tracking, and collaborative context across all projects and calendar events.
                </p>
              </div>

              <a
                href="#/people"
                onClick={(e) => {
                  if (typeof window !== 'undefined') {
                    if (window.location.hash.startsWith('#')) {
                      window.location.hash = '/people';
                    } else {
                      window.location.pathname = '/people';
                    }
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/20 w-fit"
              >
                <span>Open People Hub</span>
                <ArrowRight size={14} />
              </a>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              {/* Upcoming Meetings Card */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-400" />
                    Meetings with People
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {aetherPeople.getUpcomingMeetingsWithPeople().length} scheduled
                  </span>
                </div>
                <div className="space-y-2">
                  {aetherPeople.getUpcomingMeetingsWithPeople().slice(0, 3).map((m) => (
                    <div key={m.meetingId} className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{m.meetingTitle}</span>
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0">{m.timeFormatted}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        With: {m.attendees.map((a) => a.name).join(', ')}
                      </div>
                    </div>
                  ))}
                  {aetherPeople.getUpcomingMeetingsWithPeople().length === 0 && (
                    <p className="text-xs text-zinc-500 italic">No upcoming meetings on record.</p>
                  )}
                </div>
              </div>

              {/* Open Promises Card */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Handshake size={14} className="text-amber-400" />
                    Promises & Commitments
                  </span>
                </div>
                <div className="space-y-2">
                  {peopleList
                    .flatMap((p) =>
                      p.commitmentsAndPromises
                        .filter((pr) => pr.status === 'active')
                        .map((pr) => ({ ...pr, personName: p.name }))
                    )
                    .slice(0, 3)
                    .map((pr) => (
                      <div key={pr.id} className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-zinc-200 truncate">{pr.personName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              pr.direction === 'to_them'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {pr.direction === 'to_them' ? 'I Promised' : 'They Promised'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 truncate">{pr.text}</p>
                      </div>
                    ))}
                  {peopleList.every((p) => p.commitmentsAndPromises.filter((pr) => pr.status === 'active').length === 0) && (
                    <p className="text-xs text-zinc-500 italic">0 active promises pending.</p>
                  )}
                </div>
              </div>

              {/* Pending Follow-Ups Card */}
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <CheckSquareIcon size={14} className="text-purple-400" />
                    Pending Follow-Ups
                  </span>
                </div>
                <div className="space-y-2">
                  {peopleList
                    .flatMap((p) =>
                      p.openFollowUps
                        .filter((f) => f.status === 'pending')
                        .map((f) => ({ ...f, personName: p.name, personId: p.id }))
                    )
                    .slice(0, 3)
                    .map((f) => (
                      <div key={f.id} className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-200 truncate">{f.personName}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{f.title}</div>
                        </div>
                        <button
                          onClick={() => aetherPeople.completeFollowUp(f.personId, f.id)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-emerald-600/20 text-zinc-400 hover:text-emerald-300 text-[10px] font-mono shrink-0 cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    ))}
                  {peopleList.every((p) => p.openFollowUps.filter((f) => f.status === 'pending').length === 0) && (
                    <p className="text-xs text-zinc-500 italic">No open follow-ups.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PROACTIVE INTELLIGENCE */}
      {activeTab === 'proactive' && (
        <AetherProactiveIntelligenceHub />
      )}

      {/* TAB 0: ACTIVITY TIMELINE & PROACTIVE INTELLIGENCE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6 font-mono text-xs">
          {/* QUICK TEMPORAL ACTIONS */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-3">
            <span className="font-bold text-zinc-200 text-xs flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              <span>Quick Temporal Intelligence Inquiries</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <button
                onClick={() => handleRunTemporalQuery('yesterday')}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/50 text-left transition"
              >
                <span className="text-zinc-400 text-[10px] block">Temporal Query</span>
                <span className="text-zinc-200 font-bold text-[11px]">"What did I do yesterday?"</span>
              </button>
              <button
                onClick={() => handleRunTemporalQuery('this_morning')}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/50 text-left transition"
              >
                <span className="text-zinc-400 text-[10px] block">Temporal Query</span>
                <span className="text-zinc-200 font-bold text-[11px]">"What changed this morning?"</span>
              </button>
              <button
                onClick={() => handleRunTemporalQuery('unfinished')}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/50 text-left transition"
              >
                <span className="text-zinc-400 text-[10px] block">Backlog Query</span>
                <span className="text-zinc-200 font-bold text-[11px]">"What did I leave unfinished?"</span>
              </button>
              <button
                onClick={() => handleRunTemporalQuery('top_project')}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/50 text-left transition"
              >
                <span className="text-zinc-400 text-[10px] block">Time Spent</span>
                <span className="text-zinc-200 font-bold text-[11px]">"Top project this week?"</span>
              </button>
              <button
                onClick={() => handleRunTemporalQuery('since_last_opened')}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/50 text-left transition"
              >
                <span className="text-zinc-400 text-[10px] block">Session Delta</span>
                <span className="text-zinc-200 font-bold text-[11px]">"Changed since last open?"</span>
              </button>
            </div>

            {temporalQuickResult && (
              <div className="p-4 rounded-xl bg-zinc-950/90 border border-amber-500/30 space-y-2 mt-3 font-sans text-xs">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-amber-300">{temporalQuickResult.title}</span>
                  <button
                    onClick={() => setTemporalQuickResult(null)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
                <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {temporalQuickResult.text}
                </div>
              </div>
            )}
          </div>

          {/* PROACTIVE SUGGESTIONS CARD DECK */}
          {proactiveSuggestions.length > 0 && (
            <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-xs flex items-center gap-2">
                  <Lightbulb size={14} className="text-amber-400" />
                  <span>Aether Proactive Suggestions ({proactiveSuggestions.length})</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Respects Proactivity Threshold</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {proactiveSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 ${
                      sug.severity === 'high'
                        ? 'bg-rose-950/30 border-rose-500/30'
                        : sug.severity === 'medium'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-zinc-950/60 border-zinc-800'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-100 text-xs flex items-center gap-1.5">
                          {sug.severity === 'high' ? (
                            <AlertTriangle size={12} className="text-rose-400" />
                          ) : (
                            <Lightbulb size={12} className="text-amber-400" />
                          )}
                          <span>{sug.title}</span>
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase font-mono">
                          {sug.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 font-sans leading-snug">
                        {sug.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                      <span className="text-zinc-500">{sug.project}</span>
                      <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {sug.actionLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIMELINE LIST & FILTERS */}
          <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <History size={16} />
                <span>Workspace Activity Timeline ({timelineItems.length} events)</span>
              </span>

              {/* Classification Filter & Source Filter */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-[10px]">
                  <button
                    onClick={() => setTimelineFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      timelineFilter === 'all' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTimelineFilter('verified_fact')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      timelineFilter === 'verified_fact' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Facts Only
                  </button>
                  <button
                    onClick={() => setTimelineFilter('aether_inference')}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${
                      timelineFilter === 'aether_inference' ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Inferences
                  </button>
                </div>

                <select
                  value={timelineSourceFilter}
                  onChange={(e) => setTimelineSourceFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] focus:outline-none"
                >
                  <option value="all">All Sources</option>
                  <option value="github">GitHub</option>
                  <option value="issues">Issues</option>
                  <option value="notes">Notes</option>
                  <option value="workspace">Workspace</option>
                  <option value="conversations">Conversations</option>
                </select>
              </div>
            </div>

            {timelineItems.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                No activity records matched the selected filter criteria.
              </div>
            ) : (
              <div className="space-y-2.5">
                {timelineItems.map((item) => {
                  const isFact = item.classification === 'verified_fact';
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                        isFact
                          ? 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                          : 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              isFact
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {isFact ? 'Verified Fact' : 'Aether Inference'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 uppercase font-mono">
                            {item.source}
                          </span>
                          <span className="text-[10px] text-zinc-500">{item.projectName}</span>
                        </div>
                        <div className="font-bold text-zinc-100 text-xs font-sans">
                          {item.activity}
                        </div>
                        {item.details && (
                          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                            {item.details}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-zinc-500 block">{item.formattedTime}</span>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-amber-400 hover:underline mt-1 inline-block"
                          >
                            View Source →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: MORNING BRIEFING */}
      {activeTab === 'morning' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Sun size={18} />
                <span>Today's Morning Briefing ({morningBrief.date})</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-[10px]">
                {morningBrief.weather?.location} • {morningBrief.weather?.condition} ({morningBrief.weather?.tempF}°F)
              </span>
            </div>

            <p className="text-xs font-sans text-zinc-200 leading-relaxed bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 shadow-inner">
              {morningBrief.naturalNarrative}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block">Pending Dreams</span>
                <span className="font-bold text-amber-300 text-base">{morningBrief.dreamsWaitingReviewCount}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block">Open Issues</span>
                <span className="font-bold text-rose-400 text-base">{morningBrief.openIssuesCount}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block">Pending PRs</span>
                <span className="font-bold text-amber-300 text-base">{morningBrief.pendingPRsCount}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block">Est. Workload</span>
                <span className="font-bold text-emerald-400 text-base">{morningBrief.estimatedWorkloadHours} hrs</span>
              </div>
            </div>

            {/* CALENDAR & FOCUS GOALS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <span className="font-bold text-zinc-300 text-xs flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-400" />
                  <span>Today's Calendar Schedule</span>
                </span>
                <div className="space-y-1.5">
                  {morningBrief.calendarEvents.map((evt, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 font-bold">{evt.time}</span>
                      <span className="text-zinc-200">{evt.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <span className="font-bold text-zinc-300 text-xs flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" />
                  <span>Current Active Goals</span>
                </span>
                <div className="space-y-1.5">
                  {morningBrief.currentFocusGoals.map((g, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800/60 text-[11px] text-zinc-300 flex items-center gap-2">
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
        <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Layers size={16} className="text-amber-400" />
            <span>Real-Time Continuous Daily Context</span>
          </h3>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 font-sans text-xs shadow-inner">
            <span className="text-zinc-400 block font-mono text-[10px] uppercase">Core Daily Objective</span>
            <p className="text-zinc-100 font-semibold">{continuousContext.todayObjective}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
              <span className="font-bold text-zinc-300 text-xs">Active Project & Task</span>
              <div className="space-y-1.5 text-[11px]">
                <div><span className="text-zinc-500">Project:</span> <span className="text-amber-300 font-bold">{continuousContext.currentProject}</span></div>
                <div><span className="text-zinc-500">Task:</span> <span className="text-zinc-200">{continuousContext.currentTask}</span></div>
                <div><span className="text-zinc-500">Active Dream:</span> <span className="text-amber-300 font-bold">{continuousContext.activeDreamTitle}</span></div>
                <div><span className="text-zinc-500">Active Agent:</span> <span className="text-emerald-400 font-bold">{continuousContext.activeAgentName}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
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
        <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
              <Moon size={18} />
              <span>Evening Reflection & Daily Wrap-Up ({eveningWrapUp.date})</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
              {eveningWrapUp.focusDurationFormatted}
            </span>
          </div>

          <p className="text-xs font-sans text-zinc-200 leading-relaxed bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 shadow-inner">
            {eveningWrapUp.reflectionNarrative}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-zinc-500 block">Dreams Completed</span>
              <span className="font-bold text-amber-300 text-base">{eveningWrapUp.dreamsCompleted}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-zinc-500 block">PRs Merged</span>
              <span className="font-bold text-emerald-400 text-base">{eveningWrapUp.prsMerged}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-zinc-500 block">Issues Resolved</span>
              <span className="font-bold text-emerald-400 text-base">{eveningWrapUp.issuesResolved}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-zinc-500 block">Tech Debt Delta</span>
              <span className="font-bold text-emerald-400 text-base">{eveningWrapUp.techDebtDelta}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
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
          <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-xl space-y-3 pt-4">
            <span className="font-bold text-zinc-300 text-xs">Recommendation Feedback Outcomes ({feedbackList.length})</span>
            <div className="space-y-1.5">
              {feedbackList.map((fb) => (
                <div key={fb.id} className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-200">{fb.title}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
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
        <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Flame size={16} className="text-amber-400" />
            <span>Focus Journey Trends & Behavioral Metrics</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Avg Duration</span>
              <span className="font-bold text-amber-300 text-base">{focusJourney.averageDurationMinutes}m</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Longest Streak</span>
              <span className="font-bold text-emerald-400 text-base">{focusJourney.longestStreakDays} days</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Total Sessions</span>
              <span className="font-bold text-amber-300 text-base">{focusJourney.totalFocusSessions}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-zinc-500 text-[10px] block">Break Quality</span>
              <span className="font-bold text-emerald-400 text-base">{focusJourney.breakQualityRating}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
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
        <div className="p-6 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-amber-400" />
            <span>Workspace Grounded Conversation Continuity</span>
          </h3>

          <div className="space-y-3 font-sans text-xs">
            {continuityHistory.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-amber-300">Previous Intent ({item.date})</span>
                </div>
                <p className="text-zinc-300">{item.summary}</p>
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-amber-300 font-mono">
                  <strong>Aether Continuity Observation:</strong> {item.followUpContext}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD DECISION RULE */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4 font-mono text-xs">
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
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500/50"
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
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold transition shadow-sm"
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
