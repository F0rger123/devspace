import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Moon, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Smartphone, 
  Cloud, 
  TrendingUp, 
  Footprints,
  Info,
  ChevronRight,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { 
  aetherWellness, 
  GOOGLE_HEALTH_SCOPES, 
  HealthDataSource, 
  DailyHealthMetricSummary, 
  DailyTrendPoint, 
  WellnessInsightItem 
} from '../lib/aetherWellnessService';
import { haptic } from '../utils/haptics';

export function WellnessSettingsTab() {
  const [status, setStatus] = useState(() => aetherWellness.getStatus());
  const [summary, setSummary] = useState<DailyHealthMetricSummary | null>(() => aetherWellness.getSummary());
  const [trends, setTrends] = useState<DailyTrendPoint[]>(() => aetherWellness.getTrends());
  const [insights, setInsights] = useState<WellnessInsightItem[]>(() => aetherWellness.getInsights());
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'permissions' | 'proactive_rules' | 'privacy'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshState = () => {
    setStatus(aetherWellness.getStatus());
    setSummary(aetherWellness.getSummary());
    setTrends(aetherWellness.getTrends());
    setInsights(aetherWellness.getInsights());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConnect = async () => {
    haptic.medium();
    setIsConnecting(true);
    const res = await aetherWellness.connectGoogleHealth();
    setIsConnecting(false);
    refreshState();
    if (res.success) {
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  const handleDisconnect = () => {
    haptic.warning();
    if (confirm('Disconnect Google Health integration and delete all locally cached health telemetry?')) {
      const res = aetherWellness.disconnectAndWipeData(true);
      refreshState();
      showToast(res.message);
    }
  };

  const handleTogglePermission = (key: any, enabled: boolean) => {
    haptic.light();
    aetherWellness.togglePermission(key, enabled);
    refreshState();
  };

  const handleToggleFeature = (key: any, val: any) => {
    haptic.light();
    aetherWellness.toggleFeature(key, val);
    refreshState();
  };

  const handleDataSourceChange = (source: HealthDataSource) => {
    haptic.light();
    aetherWellness.setDataSource(source);
    refreshState();
    showToast(`Data source set to: ${source === 'google_health_fitbit_cloud' ? 'Google Health / Fitbit Cloud API' : 'Health Connect (Android On-Device)'}`);
  };

  return (
    <div className="space-y-6 animate-fade-in text-zinc-300 pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-zinc-900 border border-amber-500/40 text-amber-300 text-xs font-mono rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              NEW GOOGLE HEALTH API v4
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-500 border border-zinc-800">
              FITBIT & PIXEL WATCH READY
            </span>
          </div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Heart size={18} className="text-rose-500" /> Google Health & Wellness Intelligence
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Connect your Google Health / Fitbit telemetry so Aether can proactively support developer ergonomics, rest pacing, and movement cadence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status.connectionStatus === 'connected' ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 size={13} /> Disconnect & Wipe
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : <Heart size={14} />}
              <span>Connect Google Health</span>
            </button>
          )}
        </div>
      </div>

      {/* Strict Non-Diagnostic Medical Disclaimer */}
      <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-start gap-3">
        <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong>Non-Diagnostic & Ergonomic Boundary:</strong> Aether is an AI development companion, not a medical practitioner. Aether uses wellness metrics solely for desk ergonomics, posture/stretch prompts, and focus pacing. Aether will never make clinical diagnoses or medical treatment evaluations.
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2 overflow-x-auto text-xs">
        {[
          { id: 'overview', label: '📊 Health Overview & Telemetry' },
          { id: 'permissions', label: '🔒 Scopes & Data Permissions' },
          { id: 'proactive_rules', label: '⚡ Ergonomic & Focus Reminders' },
          { id: 'privacy', label: '🛡️ Privacy, Security & Data Sources' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: OVERVIEW & TELEMETRY */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {status.connectionStatus === 'connected' && summary ? (
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Steps & Activity */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="flex items-center gap-1.5 font-medium"><Footprints size={14} className="text-emerald-400" /> Daily Steps</span>
                    <span className="text-[10px] font-mono text-emerald-400">{Math.round((summary.steps / summary.goalSteps) * 100)}%</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-100">
                    {summary.steps.toLocaleString()}
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (summary.steps / summary.goalSteps) * 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 flex justify-between">
                    <span>Goal: {summary.goalSteps.toLocaleString()}</span>
                    <span>{summary.activeMinutes} min active</span>
                  </div>
                </div>

                {/* Sleep Architecture */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="flex items-center gap-1.5 font-medium"><Moon size={14} className="text-indigo-400" /> Sleep Duration</span>
                    <span className="text-[10px] font-mono text-indigo-400">{summary.sleepEfficiencyScore}% score</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-100">
                    {summary.sleepHours}h {summary.sleepMinutes}m
                  </div>
                  <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-zinc-800">
                    <div className="bg-indigo-600 h-full" style={{ width: '25%' }} title="Deep" />
                    <div className="bg-purple-500 h-full" style={{ width: '30%' }} title="REM" />
                    <div className="bg-blue-400 h-full" style={{ width: '40%' }} title="Light" />
                  </div>
                  <div className="text-[10px] text-zinc-500 flex justify-between">
                    <span>Restorative rest</span>
                    <span>95m deep • 110m REM</span>
                  </div>
                </div>

                {/* Resting Heart Rate */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="flex items-center gap-1.5 font-medium"><Heart size={14} className="text-rose-400" /> Resting Heart Rate</span>
                    <span className="text-[10px] font-mono text-rose-400">Baseline</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-100 flex items-baseline gap-1.5">
                    {summary.restingHeartRateBpm} <span className="text-xs text-zinc-500 font-normal">BPM</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/80">
                    Daily Average: ~{summary.avgHeartRateBpm} BPM (stable)
                  </div>
                </div>

                {/* Sedentary Counter */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span className="flex items-center gap-1.5 font-medium"><Clock size={14} className="text-amber-400" /> Seated Focus Time</span>
                    <span className="text-[10px] font-mono text-amber-400">{summary.sedentaryMinutes} min</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-100">
                    {summary.sedentaryMinutes} <span className="text-xs text-zinc-500 font-normal">min desk</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/80 flex items-center gap-1">
                    <span className={summary.sedentaryMinutes >= 60 ? 'text-amber-400' : 'text-zinc-400'}>
                      {summary.sedentaryMinutes >= 60 ? '⚠️ Stretch recommended' : '✅ Active cadence'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 7-Day Trend Visualization */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2 uppercase tracking-wider">
                    <TrendingUp size={14} className="text-cyan-400" /> 7-Day Recovery & Activity Trends
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">Google Health API v4 Telemetry</span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-2">
                  {trends.map((t, idx) => (
                    <div key={idx} className="flex flex-col items-center bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60 text-center">
                      <span className="text-[10px] font-semibold text-zinc-400 mb-1">{t.dayLabel}</span>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {(t.steps / 1000).toFixed(1)}k
                      </div>
                      <span className="text-[9px] text-zinc-500 mb-1.5">steps</span>

                      <div className="text-[11px] font-mono text-indigo-300">
                        {t.sleepHours}h
                      </div>
                      <span className="text-[9px] text-zinc-500 mb-1">sleep</span>

                      <div className="text-[10px] font-mono text-rose-400/80">
                        {t.restingHeartRate} bpm
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facts vs Aether Suggestions Inspector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" /> Facts vs. Aether Wellness Suggestions
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      Explicit delineation between objective Google Health telemetry and subjective Aether ergonomic advice.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await aetherWellness.fetchRealGoogleHealthData();
                      refreshState();
                      showToast(res.success ? 'Telemetry refreshed from Google Health / Fitbit.' : 'No new health telemetry returned or authorization expired.');
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <RefreshCw size={12} /> Sync Now
                  </button>
                </div>

                <div className="space-y-2">
                  {insights.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                        item.type === 'health_fact'
                          ? 'bg-cyan-950/15 border-cyan-500/25 text-cyan-200'
                          : 'bg-amber-950/15 border-amber-500/30 text-amber-200'
                      }`}
                    >
                      <div className="mt-0.5">
                        {item.type === 'health_fact' ? (
                          <CheckCircle2 size={16} className="text-cyan-400" />
                        ) : (
                          <Sparkles size={16} className="text-amber-400 animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                              item.type === 'health_fact'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {item.type === 'health_fact' ? 'HEALTH DATA FACT' : 'AETHER WELLNESS SUGGESTION'}
                          </span>
                          <span className="text-xs font-semibold text-zinc-100">{item.title}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{item.description}</p>
                      </div>

                      {item.actionableCta && (
                        <button
                          onClick={() => showToast(`Triggered: ${item.actionableCta}`)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all self-center"
                        >
                          {item.actionableCta}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Disconnected Welcome State */
            <div className="p-8 rounded-2xl bg-gradient-to-b from-zinc-900/60 to-zinc-950 border border-zinc-800 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Heart size={32} />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">Connect Google Health / Fitbit</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Empower Aether to understand your sleep architecture, steps, and desk ergonomics via the new Google Health API v4.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs text-zinc-300">
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <Moon size={16} className="text-indigo-400 mb-1.5" />
                  <div className="font-semibold text-zinc-100">Sleep Awareness</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Adapts daily sprint pace to your rest.</div>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <Clock size={16} className="text-amber-400 mb-1.5" />
                  <div className="font-semibold text-zinc-100">Desk Reminders</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Posture breaks after long seated coding.</div>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <ShieldCheck size={16} className="text-emerald-400 mb-1.5" />
                  <div className="font-semibold text-zinc-100">Zero Cloud Leak</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Encrypted local storage only.</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center gap-2 mx-auto cursor-pointer transition-all"
                >
                  {isConnecting ? <RefreshCw size={14} className="animate-spin" /> : <Heart size={14} />}
                  <span>Authorize Google Health API</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: PERMISSIONS & SCOPES */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'permissions' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Lock size={14} className="text-purple-400" /> Granular Google Health Scopes
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Select exactly which biometric domains Aether is permitted to read. You can revoke any scope at any time.
            </p>
          </div>

          <div className="space-y-3">
            {GOOGLE_HEALTH_SCOPES.map((s) => {
              const isAllowed = (status.permissions as any)[s.category];
              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isAllowed ? 'bg-zinc-900/60 border-zinc-700' : 'bg-zinc-950/40 border-zinc-850 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{s.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          RESTRICTED SCOPE
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{s.description}</p>
                      <div className="text-[10px] font-mono text-zinc-500">{s.scope}</div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={isAllowed}
                        onChange={(e) => handleTogglePermission(s.category, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: PROACTIVE RULES & REMINDERS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'proactive_rules' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={14} className="text-amber-400" /> Proactive Ergonomic & Focus Controls
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customize how Aether translates wellness facts into actionable suggestions during development sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Movement Reminders */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">Sedentary & Stretch Reminder</span>
                <input
                  type="checkbox"
                  checked={status.features.movementStretchReminders}
                  onChange={(e) => handleToggleFeature('movementStretchReminders', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
                />
              </div>
              <p className="text-xs text-zinc-400">
                Aether gently alerts you when you have remained seated at the keyboard without stepping away.
              </p>
              <div className="pt-2">
                <label className="text-[10px] uppercase font-mono text-zinc-500 block mb-1">
                  Threshold: {status.features.sedentaryWarningThresholdMinutes} minutes
                </label>
                <input
                  type="range"
                  min={30}
                  max={120}
                  step={15}
                  value={status.features.sedentaryWarningThresholdMinutes}
                  onChange={(e) => handleToggleFeature('sedentaryWarningThresholdMinutes', parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Sleep Awareness */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">Sleep Awareness & Workload</span>
                <input
                  type="checkbox"
                  checked={status.features.sleepAwareness}
                  onChange={(e) => handleToggleFeature('sleepAwareness', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
              <p className="text-xs text-zinc-400">
                Allows Aether to account for sleep quality when recommending sprint milestones or complex architectural tasks.
              </p>
              <label className="flex items-center gap-2 text-xs text-zinc-300 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={status.features.lowSleepWorkloadAdjustment}
                  onChange={(e) => handleToggleFeature('lowSleepWorkloadAdjustment', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-indigo-500"
                />
                <span>Suggest lighter workload if sleep was &lt; 6.5h</span>
              </label>
            </div>

            {/* Workout Logging */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">Workout & Recovery Awareness</span>
                <input
                  type="checkbox"
                  checked={status.features.workoutAwareness}
                  onChange={(e) => handleToggleFeature('workoutAwareness', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500/20"
                />
              </div>
              <p className="text-xs text-zinc-400">
                Recognize morning or evening workouts and factor physical recovery into daily session check-ins.
              </p>
            </div>

            {/* General Proactive Suggestions */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200">Proactive Conversational Suggestions</span>
                <input
                  type="checkbox"
                  checked={status.features.proactiveSuggestions}
                  onChange={(e) => handleToggleFeature('proactiveSuggestions', e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-xs text-zinc-400">
                When enabled, Aether may proactively offer wellness tips in conversation headers, voice greetings, and Command Bar suggestions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 4: PRIVACY & DATA SOURCES */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'privacy' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" /> Privacy, Security & Data Sources
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              DevSpace treats health data as strictly private. Data is retained locally and never exported to unapproved servers.
            </p>
          </div>

          {/* Data Source Switcher */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-zinc-200">Active Health Data Source</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleDataSourceChange('google_health_fitbit_cloud')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  status.dataSource === 'google_health_fitbit_cloud'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Cloud size={14} /> Google Health / Fitbit Cloud API (Web & Cloud)
                </div>
                <p className="text-[11px] opacity-80 leading-normal">
                  Standard Web & Desktop source for Fitbit devices, Pixel Watch, and Google accounts.
                </p>
              </div>

              <div
                onClick={() => handleDataSourceChange('health_connect_android')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  status.dataSource === 'health_connect_android'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <Smartphone size={14} /> Health Connect (Android On-Device)
                </div>
                <p className="text-[11px] opacity-80 leading-normal">
                  Local Android 14+ encrypted storage for Samsung Health, Pixel Watch, and Garmin data.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Checklist */}
          <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-850 space-y-3 text-xs text-zinc-300">
            <div className="font-bold text-zinc-100 flex items-center gap-2">
              <Lock size={14} className="text-emerald-400" /> Data Protection Safeguards
            </div>
            <ul className="space-y-2 text-zinc-400 text-[11px]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No Cloud Scraping:</strong> Biometrics are parsed client-side and held in ephemeral memory.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Explicit Scope Request:</strong> Only the exact scopes approved in the Scopes tab are queried.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Instant Purge:</strong> Clicking "Disconnect & Wipe" removes all stored metrics immediately.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
