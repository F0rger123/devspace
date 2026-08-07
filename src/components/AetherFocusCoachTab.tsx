import React, { useState, useEffect } from 'react';
import {
  Flame,
  Timer,
  Play,
  Pause,
  Square,
  Droplet,
  Heart,
  Smile,
  Shield,
  Camera,
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  Bell,
  Clock,
  UserCheck,
  TrendingUp,
  Sliders,
  Send,
  Eye,
  Activity,
  Award,
} from 'lucide-react';
import { aetherCore, PersonalityConfig } from '../lib/aetherCore';
import {
  aetherPresenceEngine,
  FocusSessionState,
  PresenceNudge,
  HealthWellnessSettings,
  CameraFocusSettings,
  AdaptiveCoachingHabits,
} from '../lib/aetherPresenceEngine';

export function AetherFocusCoachTab() {
  const [focusState, setFocusState] = useState<FocusSessionState>(() => aetherPresenceEngine.getFocusSession());
  const [nudges, setNudges] = useState<PresenceNudge[]>(() => aetherPresenceEngine.getNudges());
  const [wellnessSettings, setWellnessSettings] = useState<HealthWellnessSettings>(() => aetherPresenceEngine.getWellnessSettings());
  const [cameraSettings, setCameraSettings] = useState<CameraFocusSettings>(() => aetherPresenceEngine.getCameraFocusSettings());
  const [coachingHabits, setCoachingHabits] = useState<AdaptiveCoachingHabits>(() => aetherPresenceEngine.getAdaptiveCoachingHabits());
  const [personality, setPersonality] = useState<PersonalityConfig>(() => aetherCore.getPersonality());

  const [customCommandInput, setCustomCommandInput] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<{ responseText: string; actionTaken: string } | null>(null);

  // Sync Focus Timer Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setFocusState(aetherPresenceEngine.getFocusSession());
      setNudges(aetherPresenceEngine.getNudges());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartFocusSession = (durationMins: number) => {
    const state = aetherPresenceEngine.startFocusSession(durationMins);
    setFocusState(state);
    setNudges(aetherPresenceEngine.getNudges());
  };

  const handlePauseResumeFocus = () => {
    if (focusState.paused) {
      aetherPresenceEngine.resumeFocusSession();
    } else {
      aetherPresenceEngine.pauseFocusSession();
    }
    setFocusState(aetherPresenceEngine.getFocusSession());
  };

  const handleStopFocus = () => {
    const state = aetherPresenceEngine.stopFocusSession();
    setFocusState(state);
    setNudges(aetherPresenceEngine.getNudges());
  };

  const handleToggleWellness = (key: keyof HealthWellnessSettings) => {
    const updated = aetherPresenceEngine.updateWellnessSettings({ [key]: !wellnessSettings[key] });
    setWellnessSettings(updated);
  };

  const handleOptInCamera = () => {
    const updated = aetherPresenceEngine.optInCameraFocus();
    setCameraSettings(updated);
  };

  const handleOptOutCamera = () => {
    const updated = aetherPresenceEngine.optOutCameraFocus();
    setCameraSettings(updated);
  };

  const handleSimulateCameraDetection = (newState: 'desk_present' | 'user_away' | 'phone_detected' | 'looking_away') => {
    const updated = aetherPresenceEngine.simulateCameraStateChange(newState);
    setCameraSettings(updated);
    setNudges(aetherPresenceEngine.getNudges());
  };

  const handleUpdatePersona = (personaName: PersonalityConfig['persona']) => {
    const updated = aetherCore.updatePersonality({ persona: personaName });
    setPersonality(updated);
  };

  const handleProcessCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommandInput.trim()) return;

    const feedback = aetherPresenceEngine.processNaturalCommand(customCommandInput);
    setCommandFeedback(feedback);
    setFocusState(aetherPresenceEngine.getFocusSession());
    setNudges(aetherPresenceEngine.getNudges());
    setPersonality(aetherCore.getPersonality());
    setCustomCommandInput('');
  };

  const formatSeconds = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTargetSec = focusState.targetDurationMinutes * 60;
  const progressPct = Math.min(100, Math.floor((focusState.elapsedSeconds / totalTargetSec) * 100));

  return (
    <div className="space-y-6 font-sans text-zinc-200">
      {/* NATURAL INTERACTION COMMAND BAR */}
      <div className="p-5 rounded-2xl bg-[#121316] border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
            <Sparkles size={16} className="text-amber-400" />
            <span className="font-bold text-zinc-100">Natural Conversational Intent Router</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">e.g. "Lock me in for 30m", "Coach me harder", "Drink water"</span>
        </div>

        <form onSubmit={handleProcessCommand} className="flex items-center gap-2">
          <input
            type="text"
            value={customCommandInput}
            onChange={(e) => setCustomCommandInput(e.target.value)}
            placeholder="Talk to Aether (e.g. 'Aether, lock me in for 45 minutes', 'Don\'t interrupt me for an hour')..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono transition flex items-center gap-1.5"
          >
            <Send size={14} />
            <span>Send Intent</span>
          </button>
        </form>

        {commandFeedback && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-amber-500/30 text-xs font-mono space-y-1">
            <p className="text-amber-300 font-bold">{commandFeedback.responseText}</p>
            <p className="text-zinc-500 text-[10px]">Action Executed: {commandFeedback.actionTaken}</p>
          </div>
        )}
      </div>

      {/* FOCUS MODE CONTROLLER & DYNAMIC ISLAND HUD */}
      <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${focusState.isActive ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
              <Flame size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Dynamic Island Focus Session Controller</span>
                {focusState.isActive && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase">
                    ACTIVE FOCUS ({progressPct}%)
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Transforms Dynamic Island HUD into a live focus timer. Silences non-critical alerts & queues notifications.
              </p>
            </div>
          </div>

          {/* QUICK LAUNCH BUTTONS */}
          {!focusState.isActive ? (
            <div className="flex items-center gap-2 font-mono text-xs">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleStartFocusSession(mins)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-800 font-bold transition"
                >
                  {mins === 90 ? 'Until Lunch (90m)' : `${mins}m Focus`}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={handlePauseResumeFocus}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold transition flex items-center gap-1.5"
              >
                {focusState.paused ? <Play size={14} className="text-emerald-400" /> : <Pause size={14} className="text-amber-400" />}
                <span>{focusState.paused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={handleStopFocus}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold transition flex items-center gap-1.5"
              >
                <Square size={14} />
                <span>End Session</span>
              </button>
            </div>
          )}
        </div>

        {/* DYNAMIC ISLAND FOCUS HUD CARD */}
        {focusState.isActive && (
          <div className="p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-amber-300 font-mono tracking-tight">
                  {formatSeconds(totalTargetSec - focusState.elapsedSeconds)}
                </span>
                <div className="text-xs text-zinc-400 space-y-0.5">
                  <p className="font-bold text-zinc-200">Elapsed: {formatSeconds(focusState.elapsedSeconds)}</p>
                  <p className="text-[11px] text-zinc-500">Next Planned Break in: {formatSeconds(focusState.nextBreakCountdownSeconds)}</p>
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <p className="text-zinc-300 font-bold">{focusState.projectName}</p>
                <p className="text-[11px] text-amber-400/90">{focusState.activeDreamTitle}</p>
                <p className="text-[10px] text-zinc-500">{focusState.activeAgentName} • {focusState.aiProvider}</p>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="space-y-1">
              <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>0m</span>
                <span>Focus Progress: {progressPct}%</span>
                <span>{focusState.targetDurationMinutes}m</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRESENCE NUDGES & HEALTH/WELLNESS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRESENCE NUDGES LIST */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <Bell size={16} className="text-amber-400" />
              <span>Aether Presence Nudges & Nudges Stream</span>
            </h3>
            <span className="text-xs font-mono text-zinc-500">{nudges.length} Active</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {nudges.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 bg-zinc-950 rounded-xl border border-zinc-800">
                Zero presence nudges right now. Concentrating smoothly.
              </div>
            ) : (
              nudges.map((ndg) => (
                <div key={ndg.id} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase">
                        {ndg.category}
                      </span>
                      <span className="text-[10px] text-zinc-500">{new Date(ndg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs font-sans text-zinc-200">{ndg.message}</p>
                  </div>

                  <button
                    onClick={() => {
                      aetherPresenceEngine.dismissNudge(ndg.id);
                      setNudges(aetherPresenceEngine.getNudges());
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold border border-zinc-800"
                  >
                    Dismiss
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* HEALTH & WELLNESS REMINDERS */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Heart size={16} className="text-rose-400" />
            <span>Health & Wellness Adaptive Reminders</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            {[
              { key: 'hydrationEnabled', label: 'Hydration (Water)', icon: Droplet, color: 'text-cyan-400' },
              { key: 'stretchingEnabled', label: 'Stretching Breaks', icon: Activity, color: 'text-emerald-400' },
              { key: 'eyeBreaksEnabled', label: '20-20-20 Eye Rest', icon: Eye, color: 'text-amber-400' },
              { key: 'standingEnabled', label: 'Standing Reminders', icon: TrendingUp, color: 'text-violet-400' },
              { key: 'lunchReminderEnabled', label: 'Lunch Break Sync', icon: Clock, color: 'text-rose-400' },
              { key: 'endOfDayShutdownEnabled', label: 'End-of-Day Shutdown', icon: CheckCircle2, color: 'text-blue-400' },
            ].map((item) => {
              const enabled = wellnessSettings[item.key as keyof HealthWellnessSettings] as boolean;
              const IconComp = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => handleToggleWellness(item.key as keyof HealthWellnessSettings)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition ${
                    enabled ? 'bg-zinc-950 border-zinc-700 text-zinc-100' : 'bg-zinc-950/40 border-zinc-800/50 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComp size={16} className={enabled ? item.color : 'text-zinc-600'} />
                    <span className="font-bold text-xs">{item.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {enabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CAMERA-ASSISTED FOCUS & PERSONALITY SELECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* CAMERA-ASSISTED FOCUS (OPT-IN ONLY) */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <Camera size={16} className={cameraSettings.userOptedIn ? 'text-emerald-400' : 'text-rose-400'} />
              <span>Camera-Assisted Focus (100% Opt-In)</span>
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              cameraSettings.userOptedIn ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {cameraSettings.userOptedIn ? 'OPTED IN' : 'DISABLED'}
            </span>
          </div>

          <p className="text-xs font-sans text-zinc-400 leading-relaxed">
            Performs local posture/phone usage inference during focus mode. Video is NEVER recorded, frames are NEVER stored, and zero data leaves your computer.
          </p>

          <div className="flex items-center gap-3 pt-1">
            {!cameraSettings.userOptedIn ? (
              <button
                onClick={handleOptInCamera}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition"
              >
                Opt-In & Activate Local Camera Focus
              </button>
            ) : (
              <button
                onClick={handleOptOutCamera}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs transition"
              >
                Disable & Revoke Camera Permission
              </button>
            )}
          </div>

          {cameraSettings.userOptedIn && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="font-bold text-zinc-300 text-[11px]">Test Local Pose Detection Simulation:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { state: 'desk_present', label: 'Desk Present' },
                  { state: 'user_away', label: 'User Away' },
                  { state: 'phone_detected', label: 'Phone Usage (>2m)' },
                  { state: 'looking_away', label: 'Looking Away' },
                ].map((st) => (
                  <button
                    key={st.state}
                    onClick={() => handleSimulateCameraDetection(st.state as any)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-[10px] font-bold"
                  >
                    Simulate {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PERSONALITY SELECTOR */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <UserCheck size={16} className="text-amber-400" />
              <span>Aether Selectable Persona ({personality.persona})</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['Professional', 'Coach', 'Friendly', 'Minimal', 'Technical', 'Architect', 'Teacher', 'Researcher'].map((pName) => (
              <button
                key={pName}
                onClick={() => handleUpdatePersona(pName as any)}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                  personality.persona === pName
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {pName}
              </button>
            ))}
          </div>

          {/* ADAPTIVE COACHING HABITS SUMMARY */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="font-bold text-zinc-300 text-xs">Learned Adaptive Focus Habits</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="text-zinc-500">Peak Coding Hours:</span> <span className="text-zinc-200 font-bold">{coachingHabits.preferredCodingHours}</span></div>
              <div><span className="text-zinc-500">Longest Session:</span> <span className="text-zinc-200 font-bold">{coachingHabits.longestProductiveSessionMinutes}m</span></div>
              <div><span className="text-zinc-500">Productive Day:</span> <span className="text-zinc-200 font-bold">{coachingHabits.mostProductiveWeekday}</span></div>
              <div><span className="text-zinc-500">Acceptance Rate:</span> <span className="text-emerald-400 font-bold">{coachingHabits.suggestionAcceptanceRatePct}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
