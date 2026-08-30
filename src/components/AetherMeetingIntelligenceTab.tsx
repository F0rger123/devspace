import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Sparkles,
  Mic,
  MicOff,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Send,
  Plus,
  Play,
  Share2,
  FolderGit2,
  Handshake,
  CheckSquare,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Volume2
} from 'lucide-react';
import {
  aetherMeetingIntelligence,
  PreMeetingBrief,
  PostMeetingReview,
  MeetingRecordingState,
  MeetingContextItem
} from '../lib/aetherMeetingIntelligenceService';
import { aetherPeople, PersonProfile } from '../lib/aetherPeopleService';
import { aetherVoiceRegistry } from '../lib/aetherVoiceRegistry';

export function AetherMeetingIntelligenceTab() {
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingContextItem[]>(() =>
    aetherMeetingIntelligence.getUpcomingMeetings()
  );
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    upcomingMeetings[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrief, setActiveBrief] = useState<PreMeetingBrief | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  // Quick Intake State
  const [quickIntakeText, setQuickIntakeText] = useState('');
  const [intakeFeedback, setIntakeFeedback] = useState<string | null>(null);

  // Post-Meeting Review State
  const [rawNotesInput, setRawNotesInput] = useState('');
  const [activeReview, setActiveReview] = useState<PostMeetingReview | null>(null);
  const [processingReview, setProcessingReview] = useState(false);

  // Recording State
  const [recordingState, setRecordingState] = useState<MeetingRecordingState>(() =>
    aetherMeetingIntelligence.getRecordingState()
  );
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  useEffect(() => {
    const unsubRec = aetherMeetingIntelligence.subscribeRecording((state) => {
      setRecordingState(state);
    });

    // Auto load brief for initial meeting if exists
    if (upcomingMeetings.length > 0) {
      loadBrief(upcomingMeetings[0].title);
    }

    return () => {
      unsubRec();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingState.isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [recordingState.isRecording]);

  const loadBrief = (queryOrTitle: string) => {
    if (!queryOrTitle.trim()) return;
    setLoadingBrief(true);
    setTimeout(() => {
      const brief = aetherMeetingIntelligence.getPreMeetingBrief(queryOrTitle);
      setActiveBrief(brief);
      setLoadingBrief(false);
    }, 150);
  };

  const handleQuickIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIntakeText.trim()) return;

    const res = aetherMeetingIntelligence.quickIntake(quickIntakeText.trim(), {
      meetingTitle: activeBrief?.meetingTitle || 'Active Meeting'
    });

    setIntakeFeedback(res.message);
    setQuickIntakeText('');
    setTimeout(() => setIntakeFeedback(null), 4500);

    // Refresh brief to reflect newly captured items
    if (activeBrief) {
      loadBrief(activeBrief.meetingTitle);
    }
  };

  const handleProcessReview = () => {
    if (!rawNotesInput.trim()) return;
    setProcessingReview(true);
    setTimeout(() => {
      const review = aetherMeetingIntelligence.processMeetingNotes({
        meetingTitle: activeBrief?.meetingTitle || 'Architecture & Sprint Review',
        rawNotes: rawNotesInput,
        attendees: activeBrief?.attendees.map((a) => a.name) || ['Alex Chen', 'Jordan Taylor']
      });
      setActiveReview(review);
      setProcessingReview(false);
    }, 300);
  };

  const handleToggleRecording = () => {
    if (recordingState.isRecording) {
      aetherMeetingIntelligence.stopRecording();
    } else {
      aetherMeetingIntelligence.startRecording(activeBrief?.meetingTitle || 'General Discussion');
    }
    setRecordingState(aetherMeetingIntelligence.getRecordingState());
  };

  const speakBriefSummary = () => {
    if (!activeBrief) return;
    const summary = `Pre-meeting brief for ${activeBrief.meetingTitle}. Attendees: ${activeBrief.attendees.map(a => a.name).join(', ')}. You have ${activeBrief.openPromisesAndFollowUps.length} open commitments and ${activeBrief.suggestedTalkingPoints.length} recommended talking points.`;
    aetherVoiceRegistry.speakText(summary);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner with Recording Controls */}
      <div className="p-5 rounded-2xl bg-zinc-900/70 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" />
              <span>Aether Meeting Intelligence</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
              PRE-MEET • INTAKE • POST-REVIEW
            </span>
          </div>
          <p className="text-zinc-400 text-xs font-sans">
            Comprehensive pre-meeting briefings, quick during-meeting commitment intake, and automated post-meeting action extraction.
          </p>
        </div>

        {/* Live Audio Transcription / Explicit User Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto p-2 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className={`w-2.5 h-2.5 rounded-full ${recordingState.isRecording ? 'bg-red-500 animate-ping' : 'bg-zinc-600'}`} />
            <span className="text-[11px] font-bold text-zinc-300">
              {recordingState.isRecording ? `LIVE REC (${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')})` : 'RECORDER IDLE'}
            </span>
          </div>
          <button
            onClick={handleToggleRecording}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
              recordingState.isRecording
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
            }`}
          >
            {recordingState.isRecording ? <MicOff size={13} /> : <Mic size={13} />}
            <span>{recordingState.isRecording ? 'Stop Recording' : 'Start Recording'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left column (Selector & Pre-Meeting Brief), Right column (Quick Intake & Post-Meeting Review) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Pre-Meeting Briefing Center (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-100 text-xs flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span>Pre-Meeting Briefing</span>
              </span>

              {activeBrief && (
                <button
                  onClick={speakBriefSummary}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1.5 transition"
                >
                  <Volume2 size={12} />
                  <span>Listen to Brief</span>
                </button>
              )}
            </div>

            {/* Quick Meeting Selector / Query Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search meeting or person (e.g. 'Alex', 'Sprint Planning')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadBrief(searchQuery);
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 text-xs"
              />
              <button
                onClick={() => loadBrief(searchQuery || 'Alex')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
              >
                <Sparkles size={13} />
                <span>Prep Me</span>
              </button>
            </div>

            {/* Quick Upcoming Meetings Chips */}
            {upcomingMeetings.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                <span className="text-zinc-500 shrink-0">Upcoming:</span>
                {upcomingMeetings.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMeetingId(m.id);
                      loadBrief(m.title);
                    }}
                    className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition font-sans ${
                      selectedMeetingId === m.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {m.title} ({m.timeFormatted})
                  </button>
                ))}
              </div>
            )}

            {/* Rendered Briefing Sections */}
            {loadingBrief ? (
              <div className="p-8 text-center text-zinc-500 animate-pulse">
                Synthesizing multi-source pre-meeting brief...
              </div>
            ) : activeBrief ? (
              <div className="space-y-4 pt-2">
                {/* Meeting Header */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm font-sans">{activeBrief.meetingTitle}</h3>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {activeBrief.meetingTime} {activeBrief.location ? `• ${activeBrief.location}` : ''}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    READY
                  </span>
                </div>

                {/* Attendees, Roles & Relationships */}
                <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 font-bold text-[11px] flex items-center gap-1.5">
                    <Users size={13} className="text-indigo-400" />
                    <span>Attendees, Roles & Relationships</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans">
                    {activeBrief.attendees.map((att, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-200">{att.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9.5px]">
                            {att.relationshipType}
                          </span>
                        </div>
                        <div className="text-zinc-400 text-[11px]">
                          {att.role || 'Contributor'}{att.organization ? ` @ ${att.organization}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Projects */}
                <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 font-bold text-[11px] flex items-center gap-1.5">
                    <FolderGit2 size={13} className="text-emerald-400" />
                    <span>Related Projects & Context</span>
                  </span>
                  <div className="space-y-1.5 font-sans">
                    {activeBrief.relatedProjects.length > 0 ? (
                      activeBrief.relatedProjects.map((p, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-zinc-200">{p.projectName}</span>
                          <span className="text-zinc-400 font-mono text-[10px]">
                            {p.unresolvedIssuesCount} unresolved issues • {p.status || 'Active'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-500 text-[11px]">No specific projects linked.</div>
                    )}
                  </div>
                </div>

                {/* Open Promises & Follow-Ups */}
                <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 font-bold text-[11px] flex items-center gap-1.5">
                    <Handshake size={13} className="text-purple-400" />
                    <span>Open Promises & Follow-Ups ({activeBrief.openPromisesAndFollowUps.length})</span>
                  </span>
                  <div className="space-y-1.5 font-sans">
                    {activeBrief.openPromisesAndFollowUps.length > 0 ? (
                      activeBrief.openPromisesAndFollowUps.map((prom, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-start justify-between gap-2 text-[11px]">
                          <div>
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono mr-1.5 ${
                              prom.type === 'my_commitment' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {prom.type === 'my_commitment' ? 'I PROMISED' : 'WAITING ON THEM'}
                            </span>
                            <span className="text-zinc-200 font-medium">{prom.personName}: </span>
                            <span className="text-zinc-300">"{prom.text}"</span>
                          </div>
                          {prom.deadline && (
                            <span className="text-zinc-500 font-mono text-[10px] shrink-0">
                              Due {prom.deadline}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-500 text-[11px]">No active open promises.</div>
                    )}
                  </div>
                </div>

                {/* Suggested Talking Points & Forgotten Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  {/* Talking Points */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                    <span className="text-zinc-400 font-bold text-[11px] flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>Suggested Talking Points</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-zinc-300 list-disc list-inside">
                      {activeBrief.suggestedTalkingPoints.map((point, idx) => (
                        <li key={idx} className="leading-snug">{point}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Forgotten Items */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2">
                    <span className="text-zinc-400 font-bold text-[11px] flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-red-400" />
                      <span>Things You May Have Forgotten</span>
                    </span>
                    <ul className="space-y-1 text-[11px] text-zinc-300 list-disc list-inside">
                      {activeBrief.importantThingsYouMayHaveForgotten.length > 0 ? (
                        activeBrief.importantThingsYouMayHaveForgotten.map((item, idx) => (
                          <li key={idx} className="leading-snug text-amber-200/90">{item}</li>
                        ))
                      ) : (
                        <li className="text-zinc-500 list-none">All records up to date.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Unresolved Issues & Blockers */}
                {activeBrief.unresolvedIssues.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-2 font-sans">
                    <span className="text-zinc-400 font-bold text-[11px] flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-rose-400" />
                      <span>Unresolved Issues & Blockers</span>
                    </span>
                    <div className="space-y-1.5">
                      {activeBrief.unresolvedIssues.map((issue, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold font-mono ${
                              issue.priority === 'urgent' || issue.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {issue.priority.toUpperCase()}
                            </span>
                            <span className="text-zinc-200 truncate">{issue.title}</span>
                          </div>
                          <span className="text-zinc-500 font-mono text-[10px] shrink-0">{issue.projectName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Intake During Meeting & Post-Meeting Review (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* 1. Quick Intake During/Immediately After Meeting */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 space-y-3.5">
            <div>
              <span className="font-bold text-zinc-100 text-xs flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <span>Quick Intake During Meeting</span>
              </span>
              <p className="text-zinc-400 text-[11px] font-sans mt-0.5">
                Tell Aether commitments, issues, or decisions in natural language.
              </p>
            </div>

            <form onSubmit={handleQuickIntakeSubmit} className="space-y-2.5">
              <div className="relative">
                <textarea
                  rows={3}
                  value={quickIntakeText}
                  onChange={(e) => setQuickIntakeText(e.target.value)}
                  placeholder={`E.g. "Alex agreed to send the API documentation Friday." or "Create an issue for the login bug."`}
                  className="w-full p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[10px] text-zinc-500 font-sans">
                  Auto-syncs People Context & DevSpace
                </div>
                <button
                  type="submit"
                  disabled={!quickIntakeText.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Send size={12} />
                  <span>Capture</span>
                </button>
              </div>
            </form>

            {intakeFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-sans flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{intakeFeedback}</span>
              </div>
            )}

            {/* Preset example buttons */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Quick Templates</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Alex agreed to send API docs Friday',
                  'I promised Jordan I will fix login bug',
                  'Create an issue for memory leak',
                  'Decided to use SQLite for offline cache'
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuickIntakeText(sample)}
                    className="px-2 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10.5px] font-sans transition"
                  >
                    + {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Structured Post-Meeting Review Workspace */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 space-y-3.5">
            <div>
              <span className="font-bold text-zinc-100 text-xs flex items-center gap-2">
                <FileText size={14} className="text-indigo-400" />
                <span>Structured Post-Meeting Review</span>
              </span>
              <p className="text-zinc-400 text-[11px] font-sans mt-0.5">
                Paste meeting notes or transcription to extract decisions, promises, and DevSpace issues.
              </p>
            </div>

            <div className="space-y-2.5">
              <textarea
                rows={4}
                value={rawNotesInput}
                onChange={(e) => setRawNotesInput(e.target.value)}
                placeholder="Paste bullet points or rough meeting notes here..."
                className="w-full p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 text-xs resize-none"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setRawNotesInput(
                      `- Discussed OAuth token refresh architecture.\n- Decided to use standard PKCE flow for all desktop logins.\n- Alex agreed to publish the new API specification by Friday.\n- I promised to optimize the startup latency by Monday.\n- Performance issue found in data grid: need DevSpace issue to track.`
                    );
                  }}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 underline font-sans"
                >
                  Load Sample Notes
                </button>
                <button
                  type="button"
                  onClick={handleProcessReview}
                  disabled={!rawNotesInput.trim() || processingReview}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Sparkles size={12} />
                  <span>{processingReview ? 'Processing...' : 'Process Review'}</span>
                </button>
              </div>
            </div>

            {/* Rendered Post-Meeting Review Results */}
            {activeReview && (
              <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-indigo-500/30 space-y-3 pt-3 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 text-xs">{activeReview.meetingTitle}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9.5px] font-bold">
                    EXTRACTED & SYNCED
                  </span>
                </div>

                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  {activeReview.summary}
                </p>

                {/* Decisions */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Decisions Made</span>
                  <ul className="text-[11px] text-zinc-300 list-disc list-inside space-y-0.5">
                    {activeReview.decisions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                {/* My Commitments */}
                {activeReview.myCommitments.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono">My Commitments</span>
                    <div className="space-y-1">
                      {activeReview.myCommitments.map((c, i) => (
                        <div key={i} className="p-2 rounded bg-zinc-900 text-[11px] text-zinc-300 flex justify-between">
                          <span>To <b>{c.toPerson}</b>: {c.commitment}</span>
                          {c.deadline && <span className="text-zinc-500 font-mono text-[10px]">Due {c.deadline}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Their Commitments */}
                {activeReview.theirCommitments.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">Their Commitments</span>
                    <div className="space-y-1">
                      {activeReview.theirCommitments.map((c, i) => (
                        <div key={i} className="p-2 rounded bg-zinc-900 text-[11px] text-zinc-300 flex justify-between">
                          <span>From <b>{c.fromPerson}</b>: {c.commitment}</span>
                          {c.deadline && <span className="text-zinc-500 font-mono text-[10px]">Due {c.deadline}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Created Issues */}
                {activeReview.issuesCreated.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase font-mono">DevSpace Issues Logged</span>
                    <div className="space-y-1">
                      {activeReview.issuesCreated.map((iss, i) => (
                        <div key={i} className="p-2 rounded bg-zinc-900 text-[11px] text-zinc-300 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-mono text-[9px] font-bold">
                            {iss.priority.toUpperCase()}
                          </span>
                          <span>{iss.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
