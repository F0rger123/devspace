import React, { useState, useEffect } from 'react';
import { Compass, FileCode, GitBranch, Zap, AlertTriangle, Sparkles, Check, Send, Cpu, BrainCircuit, History, Target, Crosshair, Clock, ShieldCheck, Layers, Code2, Layout, Type, Shield, Repeat, Play, Pause, XCircle, Users, Handshake, CheckSquare } from 'lucide-react';
import { useSafeOverlayNavigate } from '../../../hooks/useSafeOverlayNavigate';
import { aetherIntelligence, IntelligenceSummary, PersonalMemory } from '../../../lib/aetherIntelligenceService';
import { AetherMultiActionProgress } from './AetherMultiActionProgress';
import { useStore } from '../../../store';
import { aetherActiveProjectContext, ActivityTimelineItem, ProactiveSuggestionItem } from '../../../lib/aetherActiveProjectContext';
import { aetherConversationalEngine } from '../../../lib/aetherConversationalEngine';
import { aetherContextActions, ContextCaptureData } from '../../../lib/aetherContextModeActions';
import { AetherContextActionMenu } from '../AetherContextActionMenu';
import { aetherProactiveIntelligence, ProactiveAlertItem } from '../../../lib/aetherProactiveIntelligenceService';
import { AetherProactiveAlertCard } from '../AetherProactiveAlertCard';
import { aetherRoutines, RoutineItem } from '../../../lib/aetherRoutinesService';
import { aetherGoals, AetherGoal } from '../../../lib/aetherGoalsService';
import { aetherPeople, PersonProfile } from '../../../lib/aetherPeopleService';
import { aetherMeetingIntelligence, MeetingRecordingState } from '../../../lib/aetherMeetingIntelligenceService';
import { Mic, MicOff, Calendar } from 'lucide-react';

interface ContextPanelProps {
  projectName: string;
  activePath: string;
  activeDreamCount: number;
  activeWorkCount: number;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  projectName,
  activePath,
  activeDreamCount,
  activeWorkCount,
}) => {
  const navigate = useSafeOverlayNavigate();
  const setDrawingModeActive = useStore((s) => s.setDrawingModeActive);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [nlInput, setNlInput] = useState('');
  const [summary, setSummary] = useState<IntelligenceSummary | null>(null);
  const [personalMemory, setPersonalMemory] = useState<PersonalMemory>(aetherIntelligence.getPersonalMemory());
  const [activityTimeline, setActivityTimeline] = useState<ActivityTimelineItem[]>(() =>
    aetherActiveProjectContext.getActivityTimeline({ limit: 4 })
  );
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlertItem[]>(() =>
    aetherProactiveIntelligence.getAlerts()
  );
  const [upcomingRoutines, setUpcomingRoutines] = useState<RoutineItem[]>(() =>
    aetherRoutines.getUpcomingSuggestions(3)
  );
  const [topGoal, setTopGoal] = useState<AetherGoal | null>(() =>
    aetherGoals.getTopPriorityGoal()
  );
  const [upcomingMeetings, setUpcomingMeetings] = useState(() =>
    aetherPeople.getUpcomingMeetingsWithPeople()
  );
  const [peopleWithFollowUps, setPeopleWithFollowUps] = useState<PersonProfile[]>(() =>
    aetherPeople.getPeople().filter((p) => p.openFollowUps.some((f) => f.status === 'pending'))
  );
  const [inquiryResult, setInquiryResult] = useState<{ title: string; text: string } | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<ContextCaptureData | null>(() =>
    aetherContextActions.getActiveAttachment()
  );
  const [showFullActionMenu, setShowFullActionMenu] = useState(false);

  const [recordingState, setRecordingState] = useState<MeetingRecordingState>(() =>
    aetherMeetingIntelligence.getRecordingState()
  );

  useEffect(() => {
    let mounted = true;
    aetherIntelligence.analyzeContext(projectName, activePath).then((res) => {
      if (mounted) setSummary(res);
    });
    setActivityTimeline(aetherActiveProjectContext.getActivityTimeline({ limit: 4 }));
    setProactiveAlerts(aetherProactiveIntelligence.getAlerts());
    setUpcomingRoutines(aetherRoutines.getUpcomingSuggestions(3));

    const unsubRec = aetherMeetingIntelligence.subscribeRecording((state) => {
      if (mounted) setRecordingState(state);
    });

    const unsub = aetherProactiveIntelligence.subscribe((alerts) => {
      if (mounted) setProactiveAlerts(alerts);
    });

    const unsubRoutines = aetherRoutines.subscribe(() => {
      if (mounted) setUpcomingRoutines(aetherRoutines.getUpcomingSuggestions(3));
    });

    const unsubGoals = aetherGoals.subscribe(() => {
      if (mounted) setTopGoal(aetherGoals.getTopPriorityGoal());
    });

    const unsubPeople = aetherPeople.subscribe((people) => {
      if (mounted) {
        setUpcomingMeetings(aetherPeople.getUpcomingMeetingsWithPeople());
        setPeopleWithFollowUps(people.filter((p) => p.openFollowUps.some((f) => f.status === 'pending')));
      }
    });

    const handleAttachmentUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      setActiveAttachment(custom.detail || aetherContextActions.getActiveAttachment());
    };

    window.addEventListener('aether-context-attachment-updated', handleAttachmentUpdate);
    return () => {
      mounted = false;
      unsub();
      unsubRec();
      unsubRoutines();
      unsubGoals();
      unsubPeople();
      window.removeEventListener('aether-context-attachment-updated', handleAttachmentUpdate);
    };
  }, [projectName, activePath, activeDreamCount, activeWorkCount]);

  const handleExecuteNLCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nlInput.trim()) return;

    const commandText = nlInput.trim();
    setNlInput('');
    setLastActionStatus(`Aether reasoning on: "${commandText}"...`);

    const res = await aetherConversationalEngine.processUserMessageAsync(commandText);
    setLastActionStatus(res.statusText || 'Response ready');
    setInquiryResult({
      title: commandText,
      text: res.responseText
    });
    setActivityTimeline(aetherActiveProjectContext.getActivityTimeline({ limit: 4 }));
    setTimeout(() => setLastActionStatus(null), 4000);
  };

  const handleExecuteAction = async (actionName: string) => {
    setLastActionStatus(`Aether checking: ${actionName}`);
    const res = await aetherConversationalEngine.processUserMessageAsync(actionName);
    setLastActionStatus(res.statusText || 'Analysis completed');
    setInquiryResult({
      title: actionName,
      text: res.responseText
    });
    setActivityTimeline(aetherActiveProjectContext.getActivityTimeline({ limit: 4 }));
    setTimeout(() => setLastActionStatus(null), 3000);
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Aether Intelligence Primary Header */}
      <div className="p-3.5 bg-zinc-900/80 border border-white/15 rounded-2xl space-y-1.5 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-zinc-100 flex items-center gap-1.5">
            <BrainCircuit size={15} className="text-amber-400 animate-pulse" /> Aether Intelligence Engine
          </span>
          <span className="text-[9px] text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
            Workspace & Desktop Reasoning
          </span>
        </div>
        <p className="text-[10.5px] text-zinc-300 leading-snug">
          Central intelligence layer unifying workspace graph, desktop awareness, personal workflow memory, and multi-agent reasoning.
        </p>
      </div>

      {/* Action Notification Toast */}
      {lastActionStatus && (
        <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
          <Check size={12} /> {lastActionStatus}
        </div>
      )}

      {/* Natural Language Command Bar */}
      <form onSubmit={handleExecuteNLCommand} className="flex items-center gap-2">
        <input
          type="text"
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
          placeholder='Ask Aether: "Inspect repo, fix bug, run tests, and open PR", "Circle this"...'
          className="flex-1 bg-zinc-950/80 border border-white/15 hover:border-amber-400/50 focus:border-amber-400 text-xs text-zinc-100 placeholder-zinc-400 px-3 py-2 rounded-xl focus:outline-none transition-colors"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Send size={11} /> Ask
        </button>
      </form>

      {/* Multi-Action Execution Progress Bar & History */}
      <AetherMultiActionProgress />

      {/* Direct Screen Region & Context Capture Button */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDrawingModeActive(true);
              setLastActionStatus('Context Mode Active: Click & drag to draw or select any screen region.');
              setTimeout(() => setLastActionStatus(null), 4000);
            }}
            className="flex-1 py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Crosshair size={13} className="text-amber-400" />
            <span>Draw Context Selection on Screen (Alt+D)</span>
          </button>
        </div>

        {/* Active Context Selection & Smart Action Menu (Dynamic Island Support) */}
        {activeAttachment && (
          <div className="p-3 bg-zinc-950/90 border border-amber-500/40 rounded-2xl space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-amber-500/15 text-amber-400 rounded-lg shrink-0">
                  {activeAttachment.contentType === 'code_error' && <Code2 size={13} />}
                  {activeAttachment.contentType === 'ui_selection' && <Layout size={13} />}
                  {activeAttachment.contentType === 'text_content' && <Type size={13} />}
                  {activeAttachment.contentType === 'empty_or_failed' && <AlertTriangle size={13} />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-100 truncate">{activeAttachment.label}</div>
                  <div className="text-[9px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <span className="uppercase text-amber-400 font-semibold">{activeAttachment.contentType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{new Date(activeAttachment.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowFullActionMenu(prev => !prev)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {showFullActionMenu ? 'Hide Actions' : 'Smart Actions'}
                </button>
                <button
                  onClick={() => aetherContextActions.clearActiveAttachment()}
                  className="p-1 text-zinc-500 hover:text-zinc-300 rounded"
                  title="Clear Attachment"
                >
                  ✕
                </button>
              </div>
            </div>

            {showFullActionMenu && (
              <div className="pt-2 border-t border-zinc-800">
                <AetherContextActionMenu
                  captureData={activeAttachment}
                  inline={true}
                  onClose={() => setShowFullActionMenu(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4 Core Intelligence Synthesized Answers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
            <FileCode size={11} /> 1. What am I doing?
          </span>
          <p className="text-[11px] text-zinc-100 font-semibold">{summary?.whatAmIDoing || `${projectName} at ${activePath}`}</p>
          <p className="text-[9.5px] text-zinc-400">{summary?.whyAmIDoingIt || 'Developing Aether Intelligence architecture'}</p>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
            <GitBranch size={11} /> 2. What changed?
          </span>
          <p className="text-[11px] text-zinc-100 font-semibold">{summary?.whatChanged || 'Renamed Context Mode to Aether Intelligence'}</p>
          <p className="text-[9.5px] text-zinc-400">Desktop awareness & multi-agent pipeline linked</p>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
            <Zap size={11} /> 3. What to work on next?
          </span>
          <p className="text-[11px] text-zinc-100 font-semibold">{summary?.whatToWorkOnNext || 'Review pending Dreams and tasks'}</p>
          <p className="text-[9.5px] text-zinc-400">Suggested: {summary?.nextSuggestedDream || 'Run performance optimization'}</p>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-zinc-200 uppercase flex items-center gap-1">
            <Cpu size={11} /> 4. Personal Memory & Style
          </span>
          <p className="text-[11px] text-zinc-100 font-semibold">{personalMemory.favoriteAIProvider}</p>
          <p className="text-[9.5px] text-zinc-400">Workflow: {personalMemory.preferredWorkflow}</p>
        </div>
      </div>

      {/* Instant Inquiry Result Card */}
      {inquiryResult && (
        <div className="p-3 bg-zinc-950/90 border border-amber-500/40 rounded-2xl space-y-1.5 shadow-xl">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles size={12} /> {inquiryResult.title}
            </span>
            <button
              onClick={() => setInquiryResult(null)}
              className="text-zinc-500 hover:text-zinc-300 text-[10px]"
            >
              ✕
            </button>
          </div>
          <div className="text-[11px] text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-sans">
            {inquiryResult.text}
          </div>
        </div>
      )}

      {/* Top Priority Goal & Milestone (Dynamic Island Surface) */}
      {topGoal && (
        <div className="p-3 bg-zinc-950/60 border border-indigo-500/30 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Target size={11} className="text-indigo-400" /> Active Goal & Next Step
            </span>
            <button
              onClick={() => navigate('/goals')}
              className="text-[9px] text-zinc-400 hover:text-white cursor-pointer"
            >
              Goals Hub →
            </button>
          </span>
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-indigo-500/20 flex flex-col gap-2 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-zinc-100 truncate">{topGoal.title}</span>
              <span className="text-xs font-bold text-indigo-300 shrink-0">{topGoal.progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full ${topGoal.isFallingBehind ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${topGoal.progress}%` }}
              />
            </div>
            {topGoal.nextAction && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[10.5px]">
                <div className="truncate flex-1 pr-1 font-sans text-zinc-300">
                  <span className="text-indigo-400 font-semibold">Next: </span>
                  {topGoal.nextAction.title}
                </div>
                <button
                  onClick={async () => {
                    await aetherGoals.executeNextAction(topGoal.id);
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[9.5px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Play size={9} /> Run
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Routines & Habits (Dynamic Island Surface) */}
      {upcomingRoutines.length > 0 && (
        <div className="p-3 bg-zinc-950/60 border border-purple-500/30 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Repeat size={11} className="text-purple-400" /> Active Routines & Habit Suggestions
            </span>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-[9px] text-zinc-400 hover:text-white cursor-pointer"
            >
              Manage Hub →
            </button>
          </span>
          <div className="space-y-2">
            {upcomingRoutines.map((routine) => (
              <div
                key={routine.id}
                className="p-2.5 rounded-xl bg-zinc-900/90 border border-purple-500/20 flex flex-col gap-2 font-mono text-[11px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                      {routine.confidence}%
                    </span>
                    <span className="font-bold text-zinc-200 truncate">{routine.title}</span>
                  </div>
                  <span className="text-[9px] text-zinc-400 shrink-0">{routine.schedule.recurrenceDescription}</span>
                </div>
                <p className="text-[10.5px] text-zinc-400 font-sans leading-tight">{routine.description}</p>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={async () => {
                        await aetherRoutines.executeRoutine(routine.id);
                        setUpcomingRoutines(aetherRoutines.getUpcomingSuggestions(3));
                      }}
                      className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Play size={10} /> Run Now
                    </button>
                    {routine.status === 'observed_pattern' && (
                      <button
                        onClick={() => {
                          aetherRoutines.confirmRoutine(routine.id);
                          setUpcomingRoutines(aetherRoutines.getUpcomingSuggestions(3));
                        }}
                        className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer font-bold"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400">
                    <button
                      onClick={() => {
                        aetherRoutines.snoozeRoutine(routine.id, 15);
                        setUpcomingRoutines(aetherRoutines.getUpcomingSuggestions(3));
                      }}
                      className="px-1.5 py-0.5 rounded hover:bg-white/10 hover:text-zinc-200"
                    >
                      Snooze 15m
                    </button>
                    <button
                      onClick={() => {
                        aetherRoutines.skipRoutineToday(routine.id);
                        setUpcomingRoutines(aetherRoutines.getUpcomingSuggestions(3));
                      }}
                      className="px-1.5 py-0.5 rounded hover:bg-white/10 hover:text-zinc-200"
                    >
                      Skip Today
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People & Meeting Context (Dynamic Island Surface) */}
      {(upcomingMeetings.length > 0 || peopleWithFollowUps.length > 0) && (
        <div className="p-3 bg-zinc-950/60 border border-indigo-500/30 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Users size={11} className="text-indigo-400" /> People & Meeting Context
            </span>
            <button
              onClick={() => navigate('/people')}
              className="text-[9px] text-zinc-400 hover:text-white cursor-pointer"
            >
              People Hub →
            </button>
          </span>

          <div className="space-y-2 font-mono text-[11px]">
            {/* Upcoming Meeting Card */}
            {upcomingMeetings.slice(0, 1).map((m) => (
              <div key={m.meetingId} className="p-2.5 rounded-xl bg-zinc-900/90 border border-indigo-500/20 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-white truncate">{m.meetingTitle}</span>
                  <span className="text-[9.5px] text-indigo-300 font-mono shrink-0">{m.timeFormatted}</span>
                </div>
                <div className="text-[10.5px] text-zinc-400 truncate font-sans">
                  With: {m.attendees.map((a) => a.name).join(', ')}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={async () => {
                        const brief = aetherMeetingIntelligence.getPreMeetingBrief(m.attendees[0]?.name || m.meetingTitle);
                        if (brief) {
                          const promises = brief.openPromisesAndFollowUps.map(p => `• ${p.type === 'my_commitment' ? '[I Promised]' : '[Waiting On Them]'} ${p.personName}: "${p.text}"`).join('\n') || '• None';
                          const issues = brief.unresolvedIssues.map(i => `• [${i.priority.toUpperCase()}] ${i.title}`).join('\n') || '• None';
                          const points = brief.suggestedTalkingPoints.map(t => `• ${t}`).join('\n');
                          const forgotten = brief.importantThingsYouMayHaveForgotten.map(f => `• ⚠️ ${f}`).join('\n') || '• None';
                          
                          setInquiryResult({
                            title: `Pre-Meeting Brief: ${brief.meetingTitle}`,
                            text: `### 👥 Attendees\n${brief.attendees.map(a => `• ${a.name} (${a.relationshipType}${a.role ? ` • ${a.role}` : ''})`).join('\n')}\n\n### 🤝 Open Promises & Follow-Ups\n${promises}\n\n### 🚨 Unresolved Issues\n${issues}\n\n### 🗣️ Suggested Talking Points\n${points}\n\n### 💡 Things You May Have Forgotten\n${forgotten}`,
                          });
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[9.5px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={9} /> Prep Briefing
                    </button>

                    <button
                      onClick={() => {
                        if (recordingState.isRecording) {
                          aetherMeetingIntelligence.stopRecording();
                        } else {
                          aetherMeetingIntelligence.startRecording(m.meetingTitle);
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 cursor-pointer ${
                        recordingState.isRecording
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {recordingState.isRecording ? <MicOff size={9} /> : <Mic size={9} />}
                      {recordingState.isRecording ? 'Stop Rec' : 'Rec Meeting'}
                    </button>
                  </div>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-zinc-500 hover:text-zinc-300 text-[9.5px]"
                  >
                    Meeting Hub →
                  </button>
                </div>
              </div>
            ))}

            {/* Pending Follow-Up summary */}
            {peopleWithFollowUps.length > 0 && (
              <div className="p-2 rounded-xl bg-zinc-900/60 border border-purple-500/20 flex items-center justify-between text-[10.5px] font-sans">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <CheckSquare size={11} className="text-purple-400" />
                  {peopleWithFollowUps.length} collaborator{peopleWithFollowUps.length > 1 ? 's have' : ' has'} open follow-ups
                </span>
                <button
                  onClick={() => navigate('/people')}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                >
                  Review
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grounded Workspace Activity Timeline */}
      {proactiveAlerts.length > 0 && (
        <div className="p-3 bg-zinc-950/60 border border-amber-500/30 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400 animate-pulse" /> Proactive Intelligence Insights
            </span>
            <span className="text-[9px] text-zinc-400">{proactiveAlerts.length} Active</span>
          </span>
          <div className="space-y-2">
            {proactiveAlerts.map((alert) => (
              <AetherProactiveAlertCard
                key={alert.id}
                alert={alert}
                compact
                onActionComplete={() => setProactiveAlerts(aetherProactiveIntelligence.getAlerts())}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grounded Workspace Activity Timeline */}
      <div className="p-3 bg-zinc-950/60 border border-white/10 rounded-2xl space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <History size={11} className="text-amber-400" /> Grounded Activity Memory Timeline
          </span>
          <span className="text-[9px] text-zinc-400">{activityTimeline.length} Recent Events</span>
        </span>

        <div className="space-y-1.5 text-[10.5px]">
          {activityTimeline.length === 0 ? (
            <div className="p-2 text-center text-zinc-500 text-[10px]">No recent activity logged</div>
          ) : (
            activityTimeline.map((item) => {
              const isFact = item.classification === 'verified_fact';
              return (
                <div key={item.id} className="p-2 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                        isFact ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                      }`}>
                        {isFact ? 'Fact' : 'Inference'}
                      </span>
                      <span className="font-bold text-zinc-200 truncate">{item.activity}</span>
                    </div>
                    {item.details && <span className="text-[9px] text-zinc-400 block truncate">{item.details}</span>}
                  </div>
                  <span className="text-[8.5px] text-zinc-500 shrink-0">{item.formattedTime}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Aether Natural Language & Temporal Actions */}
      <div className="p-3 bg-zinc-950/60 border border-white/10 rounded-2xl space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={11} className="text-amber-400" /> Temporal & Project Intelligence
        </span>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {[
            { label: '🧠 Long-Term Memory', action: 'Show memories for this project' },
            { label: '💾 Remember Context', action: 'Remember active context in this project' },
            { label: 'Yesterday?', action: 'What was I working on yesterday?' },
            { label: 'This morning?', action: 'What did I change this morning?' },
            { label: 'Top project?', action: 'What project have I spent the most time on this week?' },
            { label: 'Unfinished work?', action: 'What did I leave unfinished?' },
            { label: 'Since last open?', action: 'What changed since I last opened this project?' },
            { label: 'Needs attention?', action: 'What needs my attention?' },
            { label: 'Activity Timeline', action: 'Show activity timeline' },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={() => handleExecuteAction(action)}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/15 hover:text-white text-zinc-300 rounded-lg border border-white/10 transition-all cursor-pointer font-bold"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => navigate('/memory')}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 transition-all cursor-pointer font-bold flex items-center gap-1"
          >
            <BrainCircuit size={10} /> Open Memory Hub
          </button>
        </div>
      </div>
    </div>
  );
};
