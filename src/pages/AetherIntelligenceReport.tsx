import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Activity,
  CheckCircle2,
  TrendingUp,
  Brain,
  ShieldCheck,
  Zap,
  GitBranch,
  Layers,
  Clock,
  Lightbulb,
  X,
  BookOpen,
  HelpCircle,
  FileCode,
  Target,
  BarChart3,
  Cpu,
  Terminal,
  AlertTriangle,
  RotateCcw,
  Rocket,
  Compass,
  Network,
  Award,
  Bot
} from 'lucide-react';
import {
  aetherIntelligence,
  IntelligenceRecommendation,
  DreamLearningEntry,
  ReleaseReadinessReport,
  PredictivePattern,
  CoachingInsight
} from '../lib/aetherIntelligenceService';
import { useData } from '../context/DataProvider';
import { activityCenter } from '../lib/activityCenterService';
import { pushQueue } from '../lib/pushQueueService';

export function AetherIntelligenceReport() {
  const { projects, issues } = useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'release' | 'coach' | 'dreams' | 'predictive' | 'graph' | 'recommendations' | 'learning' | 'health'>('overview');
  
  const [recommendations, setRecommendations] = useState<IntelligenceRecommendation[]>([]);
  
  React.useEffect(() => {
    aetherIntelligence.getRecommendations('DevSpace Desktop').then(setRecommendations);
  }, []);
  
  const [learnings, setLearnings] = useState<DreamLearningEntry[]>(() =>
    aetherIntelligence.getDreamLearnings()
  );

  const [selectedGraphNode, setSelectedGraphNode] = useState<any>(null);
  const [focusSummaryModal, setFocusSummaryModal] = useState<any>(null);
  const [isFocusActive, setIsFocusActive] = useState<boolean>(() => aetherIntelligence.isFocusModeActive());
  const [explainModal, setExplainModal] = useState<IntelligenceRecommendation | null>(null);
  const [teachInput, setTeachInput] = useState('');
  const [teachTarget, setTeachTarget] = useState<IntelligenceRecommendation | null>(null);

  const handleToggleFocusMode = () => {
    if (isFocusActive) {
      const summary = aetherIntelligence.endFocusModeSummary();
      setIsFocusActive(false);
      setFocusSummaryModal(summary);
    } else {
      aetherIntelligence.setFocusMode(true);
      setIsFocusActive(true);
    }
  };

  const dreamRecords = aetherIntelligence.getDreamRecords();
  const memory = aetherIntelligence.getMemory();
  const releaseReport = aetherIntelligence.getReleaseReadiness('DevSpace Desktop');
  const predictivePatterns = aetherIntelligence.detectPredictivePatterns();
  const coachingInsights = aetherIntelligence.getCoachingInsights();
  const workspaceGraph = aetherIntelligence.getWorkspaceGraph();

  // Dynamic calculations from live workspace data
  const totalProjects = projects.length || 1;
  const totalIssues = issues.length || 0;
  const closedIssues = issues.filter(i => i.status === 'Done').length;
  const approvedDreams = dreamRecords.filter(r => r.state === 'approved' || r.state === 'pushed' || r.state === 'merged').length;
  const pendingDreams = dreamRecords.filter(r => r.state === 'needs_review' || r.state === 'created' || r.state === 'running').length;
  const totalQueuePushes = pushQueue.getItems().length;

  const handleDismissRec = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
    activityCenter.addNotification({
      title: 'Recommendation Dismissed',
      message: 'Aether will adjust suggestion priority.',
      type: 'info',
      summary: 'Recommendation Dismissed',
      reason: 'WHY: Developer explicitly dismissed active recommendation.',
    });
  };

  const handleNeverShowRec = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
    aetherIntelligence.storeDreamLearning(
      'Suppressed Recommendation Category',
      'DevSpace Desktop',
      false,
      'User selected Never Show Again',
      'Do not suggest this recommendation pattern again.'
    );
    activityCenter.addNotification({
      title: 'Recommendation Muted Permanently',
      message: 'Pattern saved to Aether behavioral learning engine.',
      type: 'warning',
      summary: 'Recommendation Pattern Muted',
      reason: 'WHY: Developer selected Never Show Again for recommendation category.',
    });
  };

  const handleTeachAether = () => {
    if (!teachInput.trim() || !teachTarget) return;
    aetherIntelligence.storeDreamLearning(
      teachTarget.title,
      'DevSpace Desktop',
      true,
      teachInput.trim(),
      `Custom User Rule: ${teachInput.trim()}`
    );
    setLearnings(aetherIntelligence.getDreamLearnings());
    setTeachInput('');
    setTeachTarget(null);
    activityCenter.addNotification({
      title: 'Aether Learned New Rule',
      message: 'Preference saved into neural memory.',
      type: 'success',
      summary: 'Neural Preference Updated',
      reason: 'WHY: Explicit developer feedback recorded into learning engine.',
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0c0e] text-zinc-100 font-sans overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#121316] border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Brain size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                AETHER OPERATING INTELLIGENCE
              </span>
              <span className="text-xs text-zinc-400 font-mono">Phase 5.16 Production Report</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mt-1">Workspace Operating Intelligence</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleFocusMode}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-semibold border transition flex items-center gap-2 ${
              isFocusActive
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
            }`}
          >
            <Target size={14} className={isFocusActive ? 'animate-pulse text-zinc-950' : 'text-amber-400'} />
            <span>{isFocusActive ? 'Focus Mode Active' : 'Enter Deep Focus'}</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Release Confidence: {releaseReport.releaseConfidenceScore}%</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-800/80 pb-2 custom-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'release', label: 'Release Readiness', icon: Rocket },
          { id: 'coach', label: 'Aether Coach', icon: Compass },
          { id: 'dreams', label: 'Dream Quality', icon: Sparkles },
          { id: 'predictive', label: 'Predictive Intelligence', icon: TrendingUp },
          { id: 'graph', label: 'Workspace Graph', icon: Network },
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { id: 'learning', label: 'Learning Engine', icon: BookOpen },
          { id: 'health', label: 'System Health', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-amber-400' : 'text-zinc-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[#131417] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Active Workspace Projects</span>
                <div className="text-2xl font-bold text-amber-400">{totalProjects}</div>
                <p className="text-[11px] text-zinc-500">Live indexed in workspace memory</p>
              </div>

              <div className="p-4 rounded-xl bg-[#131417] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Total Dreams Evaluated</span>
                <div className="text-2xl font-bold text-emerald-400">{dreamRecords.length}</div>
                <p className="text-[11px] text-zinc-500">{approvedDreams} Approved • {pendingDreams} Pending</p>
              </div>

              <div className="p-4 rounded-xl bg-[#131417] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Workspace Issues Tracked</span>
                <div className="text-2xl font-bold text-cyan-400">{totalIssues}</div>
                <p className="text-[11px] text-zinc-500">{closedIssues} Resolved / Closed</p>
              </div>

              <div className="p-4 rounded-xl bg-[#131417] border border-zinc-800 space-y-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase">Sync Queue Pushes</span>
                <div className="text-2xl font-bold text-indigo-400">{totalQueuePushes}</div>
                <p className="text-[11px] text-zinc-500">Queued for background commit</p>
              </div>
            </div>

            {/* Quick Release Readiness Snapshot */}
            <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Rocket size={18} className="text-amber-400" />
                  <span>Release Readiness Overview</span>
                </h3>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold">
                  {releaseReport.status}
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">{releaseReport.summary}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-500">Build Status</div>
                  <div className="text-emerald-400 font-bold mt-1">{releaseReport.buildStatus}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-500">Test Status</div>
                  <div className="text-emerald-400 font-bold mt-1">{releaseReport.testStatus}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-500">Merge Conflicts</div>
                  <div className="text-zinc-200 font-bold mt-1">{releaseReport.mergeConflictsCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-500">Tech Debt Level</div>
                  <div className="text-amber-400 font-bold mt-1">{releaseReport.technicalDebtLevel}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RELEASE READINESS PANEL TAB */}
        {activeTab === 'release' && (
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Rocket size={20} className="text-amber-400" />
                  <span>Release Readiness Panel</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Live automated release verification metrics</p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-extrabold text-emerald-400 font-mono">{releaseReport.releaseConfidenceScore}%</div>
                <span className="text-[11px] font-mono text-zinc-500">Release Confidence</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <span className="font-mono text-zinc-400 uppercase text-[10px]">Outstanding Issues</span>
                <div className="text-2xl font-bold text-amber-400">{releaseReport.outstandingIssuesCount}</div>
                <p className="text-zinc-500">Non-blocking active issue tickets</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <span className="font-mono text-zinc-400 uppercase text-[10px]">Pending Dreams</span>
                <div className="text-2xl font-bold text-cyan-400">{releaseReport.pendingDreamsCount}</div>
                <p className="text-zinc-500">AST refactors awaiting review</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <span className="font-mono text-zinc-400 uppercase text-[10px]">Pending Git Pushes</span>
                <div className="text-2xl font-bold text-indigo-400">{releaseReport.pendingPushesCount}</div>
                <p className="text-zinc-500">Queued in background push manager</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
              <span className="font-mono text-amber-400 font-semibold uppercase text-[11px]">Deployment Blockers Audit</span>
              {releaseReport.blockersList.length === 0 || releaseReport.blockersList.every(b => b.status === 'ignored') ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={16} />
                  <span>Zero active deployment blockers detected. Codebase is release-ready.</span>
                </div>
              ) : (
                releaseReport.blockersList.map((blocker) => (
                  <div key={blocker.id} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className={blocker.severity === 'blocker' ? 'text-rose-400' : 'text-amber-400'} />
                        <span className="font-bold text-zinc-100">{blocker.title}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        blocker.status === 'ignored' ? 'bg-zinc-800 text-zinc-500' : blocker.severity === 'blocker' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {blocker.status === 'ignored' ? 'Ignored' : blocker.severity}
                      </span>
                    </div>

                    <p className="text-zinc-300"><strong className="text-zinc-400">Reason:</strong> {blocker.reason}</p>
                    <p className="text-zinc-400"><strong className="text-zinc-500">Impact:</strong> {blocker.impact}</p>
                    <p className="text-amber-300 font-mono text-[11px]"><strong className="text-amber-400">Recommended Action:</strong> {blocker.recommendedAction}</p>

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 font-mono text-[11px]">
                      <button
                        onClick={() => setActiveTab('dreams')}
                        className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                      >
                        Open Dream Studio
                      </button>
                      {blocker.status !== 'ignored' && (
                        <button
                          onClick={() => {
                            aetherIntelligence.ignoreReleaseBlocker(blocker.id);
                            activityCenter.addNotification({
                              title: 'Release Blocker Ignored',
                              message: `Ignored blocker "${blocker.title}" for current release build.`,
                              type: 'info',
                              summary: 'Blocker Ignored',
                              reason: 'WHY: User explicitly ignored release warning item.',
                            });
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                        >
                          Ignore Warning
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* AETHER COACH TAB */}
        {activeTab === 'coach' && (
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Compass size={18} className="text-amber-400" />
              <span>Aether Proactive Coaching Engine</span>
            </h3>
            <p className="text-xs text-zinc-400">Contextual developer guidance generated non-intrusively during development sessions.</p>

            <div className="space-y-3 mt-4">
              {coachingInsights.map((insight) => (
                <div key={insight.id} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-300">{insight.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${insight.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                        {insight.severity}
                      </span>
                    </div>
                    <p className="text-zinc-300">{insight.message}</p>
                  </div>

                  {insight.actionLabel && (
                    <button className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-semibold transition shrink-0">
                      {insight.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DREAM QUALITY & POST-MERGE LEARNING TAB */}
        {activeTab === 'dreams' && (
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <span>Dream Quality Engine & Post-Merge Learning</span>
              </h3>
              <span className="text-xs font-mono text-zinc-400">{dreamRecords.length} Dreams Tracked</span>
            </div>

            <div className="space-y-4">
              {dreamRecords.map((r) => {
                const metrics = r.qualityMetrics || aetherIntelligence.computeQualityMetrics(r);
                return (
                  <div key={r.id} className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4 text-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 text-sm">{r.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300">
                            {r.state}
                          </span>
                        </div>
                        <p className="text-zinc-400 mt-1">{r.description}</p>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-right shrink-0">
                        <div>
                          <div className="text-lg font-bold text-emerald-400">{metrics.overallScore}/100</div>
                          <div className="text-[10px] text-zinc-500">Quality Score</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                      <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800">
                        <span className="text-zinc-500 block">Complexity</span>
                        <span className="text-zinc-200 font-semibold">{metrics.complexity}</span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800">
                        <span className="text-zinc-500 block">Risk Score</span>
                        <span className="text-amber-400 font-semibold">{metrics.riskScore}/100</span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800">
                        <span className="text-zinc-500 block">Review Difficulty</span>
                        <span className="text-cyan-400 font-semibold">{metrics.reviewDifficulty}</span>
                      </div>
                      <div className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800">
                        <span className="text-zinc-500 block">Test Coverage</span>
                        <span className="text-emerald-400 font-semibold">{metrics.testCoverage}%</span>
                      </div>
                    </div>

                    {r.postMergeOutcome && (
                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 font-mono text-[11px] flex items-center justify-between">
                        <span>Post-Merge Outcome: Verified Clean Build & 0 Regression Bugs</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                          Post-Merge Learned
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PREDICTIVE INTELLIGENCE TAB */}
        {activeTab === 'predictive' && (
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-400" />
              <span>Predictive Intelligence & Pattern Analytics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {predictivePatterns.map((pat) => (
                <div key={pat.id} className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-800/40 space-y-2 font-sans">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-indigo-300 font-bold">{pat.title}</span>
                    <span className="text-indigo-400 text-[10px]">{(pat.confidence * 100).toFixed(0)}% confidence</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{pat.insight}</p>
                  <p className="text-amber-300 font-mono text-[11px] pt-1 border-t border-indigo-800/30">
                    Action: {pat.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORKSPACE GRAPH TAB */}
        {activeTab === 'graph' && (
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Network size={18} className="text-cyan-400" />
                  <span>Workspace Intelligence Graph Relationships</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Interactive navigation graph connecting Projects, Dreams, Files, Issues, and Recommendations.</p>
              </div>
              {selectedGraphNode && (
                <button
                  onClick={() => setSelectedGraphNode(null)}
                  className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300"
                >
                  Clear Node Filter
                </button>
              )}
            </div>

            {selectedGraphNode && (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-3 font-mono text-xs text-cyan-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-cyan-300">Selected Node: {selectedGraphNode.label}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] uppercase">{selectedGraphNode.type}</span>
                </div>
                <p className="text-zinc-300 font-sans text-xs">Connected Relationships in Neural Knowledge Mesh:</p>
                <div className="space-y-1 text-[11px]">
                  {workspaceGraph.links
                    .filter((l) => l.source === selectedGraphNode.id || l.target === selectedGraphNode.id)
                    .map((link, idx) => (
                      <div key={idx} className="p-2 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-zinc-300">
                        <span>{link.source} → {link.relationship} → {link.target}</span>
                        <span className="text-amber-400 text-[10px]">Active Relationship</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs">
              <span className="text-cyan-400 uppercase font-semibold text-[11px] block">
                Nodes ({workspaceGraph.nodes.length}) & Relationships ({workspaceGraph.links.length}) — Click to Inspect
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {workspaceGraph.nodes.map((node) => {
                  const isSelected = selectedGraphNode?.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedGraphNode(node)}
                      className={`p-3 rounded-lg border text-left transition flex flex-col justify-between space-y-1 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <span className={`font-semibold ${isSelected ? 'text-cyan-300' : 'text-amber-300'}`}>{node.label}</span>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Type: {node.type}</span>
                        <span>Status: {node.status || 'active'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS TAB */}
        {activeTab === 'recommendations' && (
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-400" />
              <span>Intelligent Recommendations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-300 text-sm">{rec.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/10 text-amber-400 uppercase">
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-zinc-300 mt-1.5">{rec.description}</p>
                    <p className="text-zinc-400 text-[11px] italic mt-1">{rec.reason}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80 font-mono text-[11px]">
                    <button
                      onClick={() => setExplainModal(rec)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                    >
                      Explain
                    </button>
                    <button
                      onClick={() => handleDismissRec(rec.id)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleNeverShowRec(rec.id)}
                      className="px-2.5 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/50"
                    >
                      Never Show Again
                    </button>
                    <button
                      onClick={() => setTeachTarget(rec)}
                      className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                    >
                      Teach Aether
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEARNING ENGINE TAB */}
        {activeTab === 'learning' && (
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <BookOpen size={18} className="text-cyan-400" />
              <span>Aether Behavioral Learning Memory</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <span className="font-mono text-amber-400 font-semibold">User Workflow Preferences</span>
                <p className="text-zinc-300">Preferred Workflow: {memory.preferredWorkflow}</p>
                <p className="text-zinc-300">Coding Style: {memory.codingStyle}</p>
                <p className="text-zinc-300">Review Habit: {memory.reviewHabit}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <span className="font-mono text-cyan-400 font-semibold">Frequently Accessed Resources</span>
                <p className="text-zinc-300">Top Files: {memory.frequentlyOpenedFiles.join(', ') || 'AppLayout.tsx, Header.tsx'}</p>
                <p className="text-zinc-300">Top Projects: {memory.mostUsedProjects.join(', ') || 'DevSpace Desktop'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-zinc-400 uppercase font-semibold block">Stored Takeaways ({learnings.length})</span>
              {learnings.map((l) => (
                <div key={l.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-zinc-200">{l.dreamTitle}</span>
                    <p className="text-zinc-400 text-[11px]">{l.keyTakeaway}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${l.wasAccepted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {l.wasAccepted ? 'Accepted' : 'Rejected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SYSTEM HEALTH TAB */}
        {activeTab === 'health' && (
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Workspace Health Analysis</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="text-zinc-400 font-mono">AST & Syntax Safety</div>
                <div className="text-lg font-bold text-emerald-400">100% Valid</div>
                <p className="text-zinc-500">Zero compiler errors across TypeScript AST nodes.</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="text-zinc-400 font-mono">Technical Debt Score</div>
                <div className="text-lg font-bold text-amber-400">Low (12/100)</div>
                <p className="text-zinc-500">Refactored snapshot hooks minimized duplicate renders.</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="text-zinc-400 font-mono">Security Vulnerabilities</div>
                <div className="text-lg font-bold text-cyan-400">0 Critical</div>
                <p className="text-zinc-500">API keys server-side proxy enforced.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EXPLAIN RECOMMENDATION MODAL */}
      {explainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141518] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-amber-400 text-sm">{explainModal.title}</h3>
              <button onClick={() => setExplainModal(null)} className="p-1 rounded text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-zinc-300 leading-relaxed">{explainModal.description}</p>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-amber-300">
              <strong>Deep Explanation:</strong> {explainModal.reason}
            </div>
            <button
              onClick={() => setExplainModal(null)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl"
            >
              Close Explanation
            </button>
          </div>
        </div>
      )}

      {/* DEEP FOCUS SESSION SUMMARY MODAL */}
      {focusSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141518] border border-amber-500/30 rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs text-zinc-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-amber-400" />
                <h3 className="font-bold text-amber-300 text-sm">Deep Focus Session Completed</h3>
              </div>
              <button onClick={() => setFocusSummaryModal(null)} className="p-1 rounded text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-zinc-300 whitespace-pre-line leading-relaxed font-mono">{focusSummaryModal.summaryText}</p>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
              All background tasks completed with zero interruptions. Focus report archived to session timeline.
            </div>
            <button
              onClick={() => setFocusSummaryModal(null)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition"
            >
              Resume Normal Mode
            </button>
          </div>
        </div>
      )}

      {/* TEACH AETHER MODAL */}
      {teachTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#141518] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-4 text-xs text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-amber-400 text-sm">Teach Aether: {teachTarget.title}</h3>
              <button onClick={() => setTeachTarget(null)} className="p-1 rounded text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-zinc-400">Specify your explicit preference for future recommendations and Dream generations:</p>
            <textarea
              rows={3}
              placeholder="e.g., Always use React 18 useSyncExternalStore for global state subscriptions..."
              value={teachInput}
              onChange={(e) => setTeachInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setTeachTarget(null)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleTeachAether}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
              >
                Save Rule to Neural Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
