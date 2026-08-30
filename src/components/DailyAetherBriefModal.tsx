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
  MapPin,
  Car,
  Activity,
  Heart,
  Moon,
  CloudSun,
  Luggage,
  ShieldCheck,
  AlertTriangle,
  Save,
  Check,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { aetherLifeContext, CalendarEventItem, LiveRouteTelemetry, TripPlan } from '../lib/aetherLifeContextService';
import { aetherWellness } from '../lib/aetherWellnessService';
import { aetherActiveProjectContext } from '../lib/aetherActiveProjectContext';
import { aetherIntelligence } from '../lib/aetherIntelligenceService';

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
  const [activeTab, setActiveTab] = useState<'all' | 'schedule' | 'work' | 'wellness' | 'trips'>('all');
  const [savedWorkspace, setSavedWorkspace] = useState(false);

  if (!isOpen) return null;

  const now = Date.now();
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // 1. Calendar & Travel Context
  const upcomingEvents = aetherLifeContext.getUpcomingEvents();
  const activeRoutes = aetherLifeContext.getAllActiveRouteTelemetry();
  const nextPhysicalEvent = upcomingEvents.find((e) => e.location && !e.location.isVirtualMeeting);
  const nextPhysicalRoute = nextPhysicalEvent ? activeRoutes[nextPhysicalEvent.id] : null;

  // 2. Health & Wellness Context
  const wellnessStatus = aetherWellness.getStatus();
  const wellnessSummary = aetherWellness.getSummary();
  const isHealthConnected = wellnessStatus.connectionStatus === 'connected';

  // 3. DevSpace Work Context
  const projectState = aetherActiveProjectContext.getState();
  const baseBrief = aetherIntelligence.getDailyBrief(projectName);

  // 4. Trip & Packing Context
  const nextTrip = aetherLifeContext.getNextUpcomingTrip();
  const uncheckedCrucial = nextTrip ? aetherLifeContext.getUncheckedCrucialItems(nextTrip.id) : [];

  const handleSaveWorkspace = () => {
    aetherLifeContext.createWorkspaceLeaveSnapshot('Departure from Today Briefing');
    setSavedWorkspace(true);
    setTimeout(() => setSavedWorkspace(false), 4000);
  };

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-4xl bg-[#111216] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 font-sans my-8"
        >
          {/* Top Banner Header */}
          <div className="relative p-6 sm:p-7 bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border-b border-zinc-800/80">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-inner">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/25">
                      AETHER LIFE INTELLIGENCE
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{dateFormatted}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">Today Operating Briefing</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Unified multi-source context across schedule, travel, active coding, GitHub, and recovery telemetry.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 text-xs font-mono">
              {[
                { id: 'all', label: 'All Intelligence' },
                { id: 'schedule', label: `Schedule & Travel (${upcomingEvents.length})` },
                { id: 'work', label: `DevSpace Work & GitHub` },
                { id: 'wellness', label: `Health & Recovery` },
                { id: 'trips', label: nextTrip ? `Trip: ${nextTrip.destination}` : 'Trips & Packing' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl border transition whitespace-nowrap font-medium ${
                    activeTab === tab.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-7 space-y-6 max-h-[68vh] overflow-y-auto text-xs">
            {/* 1. TRAVEL & LEAVE TIME BANNER (If upcoming in-person appointment) */}
            {nextPhysicalEvent && nextPhysicalRoute && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <Car size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        VERIFIED FACT
                      </span>
                      <span className="font-bold text-zinc-200 text-sm">Departure Recommendation</span>
                    </div>
                    <p className="text-zinc-300 text-xs mt-0.5">
                      You have to be at <strong className="text-amber-300">{nextPhysicalEvent.title}</strong> in{' '}
                      {Math.max(1, Math.round((nextPhysicalEvent.startTime - now) / 60000))} min ({nextPhysicalRoute.destinationAddress}). Transit takes{' '}
                      <strong>{nextPhysicalRoute.trafficDurationMinutes}m</strong> ({nextPhysicalRoute.congestionLevel} traffic).
                    </p>
                    <div className="text-[11px] font-mono text-amber-400 mt-1">
                      🚗 <strong>Leave by:</strong>{' '}
                      {new Date(nextPhysicalRoute.recommendedLeaveTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      ({nextPhysicalRoute.minutesUntilLeave <= 0 ? 'Leave Now' : `in ${nextPhysicalRoute.minutesUntilLeave} minutes`})
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveWorkspace}
                  disabled={savedWorkspace}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition shrink-0 ${
                    savedWorkspace
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {savedWorkspace ? <Check size={14} /> : <Save size={14} />}
                  <span>{savedWorkspace ? 'Work State Preserved' : 'Save Work State Before Leaving'}</span>
                </button>
              </div>
            )}

            {/* 2. CALENDAR & SCHEDULE SECTION */}
            {(activeTab === 'all' || activeTab === 'schedule') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Calendar size={14} className="text-amber-400" />
                    <span>CALENDAR SCHEDULE ({upcomingEvents.length} Events Today)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Google Calendar Synced
                  </span>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-center">
                    No upcoming calendar events scheduled for today.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {upcomingEvents.map((evt) => {
                      const timeStr = new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const endStr = new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const route = activeRoutes[evt.id];
                      const isVirtual = evt.location?.isVirtualMeeting;

                      return (
                        <div key={evt.id} className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between gap-2">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-200 text-xs">{evt.title}</span>
                              <span className="text-[10px] font-mono text-zinc-400">
                                {timeStr} – {endStr}
                              </span>
                            </div>
                            {evt.description && (
                              <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{evt.description}</p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono">
                            {isVirtual ? (
                              <span className="text-cyan-400 flex items-center gap-1">
                                🌐 Virtual Meeting (Google Meet)
                              </span>
                            ) : evt.location?.rawLocation ? (
                              <span className="text-amber-300 flex items-center gap-1 truncate max-w-[200px]">
                                <MapPin size={11} className="shrink-0" />
                                <span className="truncate">{evt.location.rawLocation}</span>
                              </span>
                            ) : (
                              <span className="text-zinc-500">No Location</span>
                            )}

                            {route && (
                              <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                                {route.trafficDurationMinutes}m travel ({route.congestionLevel})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. DEVSPACE WORK & GITHUB FOCUS */}
            {(activeTab === 'all' || activeTab === 'work') && (
              <div className="space-y-3">
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span>DEVSPACE WORK & GITHUB FOCUS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <span className="text-[10px] font-mono text-amber-400 uppercase block">Active Project</span>
                    <div className="text-sm font-bold text-zinc-100">{projectState.projectName || projectName}</div>
                    <p className="text-[11px] text-zinc-400">
                      {projectState.openIssues?.length || 0} open issues • {projectState.openPullRequests?.length || 0} pull requests
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase block">Top Recommended Action</span>
                    <div className="text-xs font-semibold text-zinc-200">{baseBrief.today.highestPriorityWork}</div>
                    <p className="text-[11px] text-zinc-400">
                      Estimated duration: {baseBrief.today.estimatedWorkDurationHours} hours
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase block">Repository Status</span>
                    <div className="text-xs font-mono text-zinc-300 truncate">
                      {projectState.connectedRepository || 'Connected Repo'}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {baseBrief.today.gitStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. HEALTH & RECOVERY TELEMETRY */}
            {(activeTab === 'all' || activeTab === 'wellness') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Activity size={14} className="text-rose-400" />
                    <span>WELLNESS & RECOVERY TELEMETRY (FITBIT / GOOGLE HEALTH)</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Non-Diagnostic Ergonomics</span>
                </div>

                {wellnessSummary ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                        <Activity size={12} className="text-emerald-400" />
                        <span>Daily Steps</span>
                      </div>
                      <div className="text-base font-bold text-emerald-400 mt-1">
                        {wellnessSummary.steps.toLocaleString()}{' '}
                        <span className="text-[10px] text-zinc-400 font-normal">/ {wellnessSummary.goalSteps.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                        <Moon size={12} className="text-indigo-400" />
                        <span>Sleep Duration</span>
                      </div>
                      <div className="text-base font-bold text-indigo-300 mt-1">
                        {wellnessSummary.sleepHours}h {wellnessSummary.sleepMinutes}m
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                        <Heart size={12} className="text-rose-400" />
                        <span>Resting Heart Rate</span>
                      </div>
                      <div className="text-base font-bold text-rose-400 mt-1">
                        {wellnessSummary.restingHeartRateBpm}{' '}
                        <span className="text-[10px] text-zinc-400 font-normal">BPM</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center gap-1">
                        <Clock size={12} className="text-amber-400" />
                        <span>Desk Seated Time</span>
                      </div>
                      <div className="text-base font-bold text-amber-300 mt-1">
                        {wellnessSummary.sedentaryMinutes}{' '}
                        <span className="text-[10px] text-zinc-400 font-normal">min focus</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-center">
                    Google Health / Fitbit is not connected. Authorize in Settings &gt; Wellness to view sleep and ergonomics.
                  </div>
                )}
              </div>
            )}

            {/* 5. TRIPS & PACKING INTELLIGENCE */}
            {(activeTab === 'all' || activeTab === 'trips') && nextTrip && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Luggage size={14} className="text-indigo-400" />
                    <span>UPCOMING TRIP INTELLIGENCE: {nextTrip.destination.toUpperCase()}</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Departs {nextTrip.startDate} ({Math.max(0, Math.round((nextTrip.departureTimestamp - now) / 86400000))} days)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CloudSun size={16} className="text-amber-400" />
                      <span className="text-xs font-semibold text-zinc-200">
                        {nextTrip.weatherForecast.condition}, High {nextTrip.weatherForecast.highTempF}°F / Low {nextTrip.weatherForecast.lowTempF}°F
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {nextTrip.items.filter((i) => i.isCompleted).length} / {nextTrip.items.length} items packed
                    </span>
                  </div>

                  {uncheckedCrucial.length > 0 ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-amber-300">Crucial Items Still Unpacked: </span>
                        <span className="text-zinc-200">
                          {uncheckedCrucial.map((i) => i.name).join(', ')}.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>All crucial items are packed and ready to go.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 sm:p-6 bg-[#15161b] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleReport}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs border border-zinc-700 transition flex items-center gap-2 cursor-pointer"
            >
              <FileText size={15} />
              <span>Full Analytics Report</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
              >
                Dismiss
              </button>

              <button
                onClick={handleResume}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Play size={15} fill="currentColor" />
                <span>Resume Coding</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
