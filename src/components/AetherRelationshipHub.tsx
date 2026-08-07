import React, { useState } from 'react';
import {
  HeartHandshake,
  Calendar,
  Award,
  Target,
  Shield,
  Lightbulb,
  Network,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Brain,
  Rocket,
  Flame,
  ShieldCheck,
  Plus,
  Trash2,
  RotateCcw,
  Sliders,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  aetherRelationshipService,
  MilestoneEntry,
  AchievementEntry,
  GoalEntry,
  ImprovementSuggestion,
  TrustLevel,
} from '../lib/aetherRelationshipService';
import { aetherCore } from '../lib/aetherCore';

export function AetherRelationshipHub() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'achievements' | 'reflections' | 'goals' | 'trust' | 'improvements' | 'graph'>('timeline');
  const [milestones, setMilestones] = useState<MilestoneEntry[]>(() => aetherRelationshipService.getMilestones());
  const [achievements, setAchievements] = useState<AchievementEntry[]>(() => aetherRelationshipService.getAchievements());
  const [goals, setGoals] = useState<GoalEntry[]>(() => aetherRelationshipService.getGoals());
  const [improvements, setImprovements] = useState<ImprovementSuggestion[]>(() => aetherRelationshipService.getImprovementSuggestions());
  const [trustConfig, setTrustConfig] = useState(() => aetherRelationshipService.getTrustConfig());

  const [weeklyReflection] = useState(() => aetherRelationshipService.generateWeeklyReflection());
  const [monthlyReport] = useState(() => aetherRelationshipService.generateMonthlyReport());
  const [knowledgeGraph] = useState(() => aetherRelationshipService.getKnowledgeGraph());

  // Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Milestone Form State
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msWhy, setMsWhy] = useState('');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    aetherRelationshipService.addGoal({
      title: newGoalTitle,
      targetDate: newGoalTargetDate || '2026-09-01',
      category: 'feature',
      status: 'in_progress',
      linkedDreams: ['Dream #120'],
      linkedIssues: ['ISSUE-201'],
      notes: 'Custom long-term objective added by user.',
    });

    setGoals(aetherRelationshipService.getGoals());
    setNewGoalTitle('');
    setShowGoalModal(false);
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;

    aetherRelationshipService.addMilestone({
      date: new Date().toISOString().split('T')[0],
      title: msTitle,
      description: msDesc || 'Custom milestone recorded.',
      whyItMattered: msWhy || 'Significant progress checkpoint.',
      category: 'workspace',
      relatedProjects: ['DevSpace Workspace'],
    });

    setMilestones(aetherRelationshipService.getMilestones());
    setMsTitle('');
    setMsDesc('');
    setMsWhy('');
    setShowMilestoneModal(false);
  };

  const handleImprovementAction = (id: string, status: ImprovementSuggestion['status']) => {
    aetherRelationshipService.updateImprovementStatus(id, status);
    setImprovements(aetherRelationshipService.getImprovementSuggestions());
  };

  const handleTrustUpgrade = (targetLevel: TrustLevel) => {
    if (confirm(`Upgrade Aether Trust Level to "${targetLevel}"? This unlocks additional explicit automated capabilities.`)) {
      const updated = aetherRelationshipService.requestTrustUpgrade(targetLevel);
      setTrustConfig(updated);
    }
  };

  const handleExportReflection = () => {
    const data = {
      weeklyReflection,
      monthlyReport,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-weekly-reflection-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans text-zinc-200">
      {/* HEADER HERO */}
      <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>Aether Relationship Intelligence & Long-Term Growth</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase">
                  Level: {trustConfig.currentLevel}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Transparent long-term continuity, milestone timeline, goal tracking, and explicit trust governance.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportReflection}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-bold font-mono transition flex items-center gap-2"
          >
            <Download size={14} className="text-amber-400" />
            <span>Export Reflection Report</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2 overflow-x-auto font-mono text-xs">
        {[
          { id: 'timeline', label: 'Relationship Timeline', icon: Calendar },
          { id: 'achievements', label: 'Achievement Memory', icon: Award },
          { id: 'reflections', label: 'Weekly & Monthly Insights', icon: Sparkles },
          { id: 'goals', label: 'Goal Tracking', icon: Target },
          { id: 'trust', label: 'Trust Engine Governance', icon: Shield },
          { id: 'improvements', label: 'Improvement Queue', icon: Lightbulb },
          { id: 'graph', label: 'Personal Knowledge Graph', icon: Network },
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

      {/* TAB 1: RELATIONSHIP TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-100 text-sm font-mono flex items-center gap-2">
              <Calendar size={16} className="text-amber-400" />
              <span>Persistent Relationship Timeline ({milestones.length} Milestones)</span>
            </h3>
            <button
              onClick={() => setShowMilestoneModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Record Milestone</span>
            </button>
          </div>

          <div className="relative pl-6 border-l-2 border-zinc-800 space-y-6 font-mono text-xs">
            {milestones.map((ms) => (
              <div key={ms.id} className="relative space-y-2">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-4 border-zinc-950" />
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-100 text-sm">{ms.title}</span>
                    <span className="text-[11px] text-amber-400/90 font-bold">{ms.date}</span>
                  </div>
                  <p className="text-xs font-sans text-zinc-300">{ms.description}</p>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-sans text-zinc-400">
                    <strong className="text-amber-300 font-mono">Why It Mattered:</strong> {ms.whyItMattered}
                  </div>
                  {ms.relatedProjects && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-zinc-500">Related:</span>
                      {ms.relatedProjects.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px] border border-zinc-800">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ACHIEVEMENT MEMORY */}
      {activeTab === 'achievements' && (
        <div className="space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Award size={16} className="text-amber-400" />
            <span>Achievement Memory Cortex ({achievements.length} Verified Unlocked)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <div key={ach.id} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                      <Rocket size={18} className="text-amber-400" />
                      <span>{ach.title}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] uppercase font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-xs font-sans text-zinc-300">{ach.context}</p>
                </div>

                <div className="space-y-1.5 text-[11px] border-t border-zinc-900 pt-3">
                  <div><span className="text-zinc-500">Evidence:</span> <span className="text-zinc-300">{ach.evidence}</span></div>
                  <div><span className="text-zinc-500">Comparison:</span> <span className="text-emerald-400 font-bold">{ach.historicalComparison}</span></div>
                  <div><span className="text-zinc-500">Impact:</span> <span className="text-amber-300 font-bold">{ach.impact}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WEEKLY REFLECTIONS & MONTHLY REPORTS */}
      {activeTab === 'reflections' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
          {/* WEEKLY REFLECTION */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Sparkles size={16} />
                <span>Weekly Reflection Report</span>
              </span>
              <span className="text-[11px] text-zinc-500">{weeklyReflection.period}</span>
            </div>

            <p className="text-xs font-sans text-zinc-300 leading-relaxed">{weeklyReflection.summary}</p>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px]">
              <div><span className="text-zinc-500">Focus Score:</span> <span className="text-amber-300 font-bold">{weeklyReflection.focusQualityScore}</span></div>
              <div><span className="text-zinc-500">Planner Accuracy:</span> <span className="text-emerald-400 font-bold">{weeklyReflection.plannerAccuracyPct}%</span></div>
              <div><span className="text-zinc-500">Dreams Reviewed:</span> <span className="text-zinc-200 font-bold">{weeklyReflection.dreamsReviewed}</span></div>
              <div><span className="text-zinc-500">Tech Debt Reduced:</span> <span className="text-emerald-400 font-bold">{weeklyReflection.techDebtReductionPct}%</span></div>
            </div>

            <div className="space-y-2 text-[11px]">
              <div><strong className="text-amber-300">Biggest Accomplishment:</strong> <span className="text-zinc-200 font-sans">{weeklyReflection.biggestAccomplishment}</span></div>
              <div><strong className="text-emerald-400">Most Productive Session:</strong> <span className="text-zinc-200 font-sans">{weeklyReflection.mostProductiveSession}</span></div>
              <div><strong className="text-rose-400">Areas for Improvement:</strong> <span className="text-zinc-200 font-sans">{weeklyReflection.areasForImprovement}</span></div>
            </div>
          </div>

          {/* MONTHLY INTELLIGENCE REPORT */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="font-bold text-cyan-300 text-sm flex items-center gap-2">
                <TrendingUp size={16} />
                <span>Monthly Intelligence Report</span>
              </span>
              <span className="text-[11px] text-zinc-500">{monthlyReport.month}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400">Data-Backed Behavioral Trends:</span>
              {monthlyReport.observations.map((obs, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-sans text-zinc-300 flex items-start gap-2">
                  <ChevronRight size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span>{obs}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-[11px]">
              <span>Total Focus Hours: <strong className="text-amber-300">{monthlyReport.totalFocusHours}h</strong></span>
              <span>Commits Merged: <strong className="text-emerald-400">{monthlyReport.totalCommitsMerged}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOAL TRACKING */}
      {activeTab === 'goals' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <Target size={16} className="text-amber-400" />
              <span>Long-Term Goals & Milestones Alignment ({goals.length} Goals)</span>
            </h3>

            <button
              onClick={() => setShowGoalModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Goal</span>
            </button>
          </div>

          <div className="space-y-3">
            {goals.map((g) => (
              <div key={g.id} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-zinc-100 text-sm">{g.title}</span>
                    <p className="text-xs font-sans text-zinc-400">{g.notes}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold uppercase text-[10px]">
                      Target: {g.targetDate}
                    </span>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500" style={{ width: `${g.progressPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Category: {g.category}</span>
                    <span>Progress: {g.progressPct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TRUST ENGINE */}
      {activeTab === 'trust' && (
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-6 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                <Shield size={18} className="text-emerald-400" />
                <span>Explicit Trust Engine & Permission Delegation</span>
              </h3>
              <p className="text-xs font-sans text-zinc-400">
                Aether never assumes permissions. Higher levels require explicit user upgrade approval.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
              Current: {trustConfig.currentLevel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {(['Observer', 'Assistant', 'Planner', 'Automation Partner', 'Delegated Assistant'] as TrustLevel[]).map((lvl) => {
              const isCurrent = trustConfig.currentLevel === lvl;
              return (
                <div
                  key={lvl}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                    isCurrent ? 'bg-amber-500/10 border-amber-500/40 text-zinc-100' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-bold text-xs text-zinc-100 block">{lvl}</span>
                    <p className="text-[10px] font-sans text-zinc-400 leading-tight">
                      {lvl === 'Observer' && 'Suggestions only. Zero action without click.'}
                      {lvl === 'Assistant' && 'Can prepare branch diffs and code proposals.'}
                      {lvl === 'Planner' && 'Can construct multi-step plans in Planner.'}
                      {lvl === 'Automation Partner' && 'Executes previously approved workflows.'}
                      {lvl === 'Delegated Assistant' && 'Full delegation for approved tasks.'}
                    </p>
                  </div>

                  {!isCurrent ? (
                    <button
                      onClick={() => handleTrustUpgrade(lvl)}
                      className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-zinc-800 font-bold text-[10px] transition"
                    >
                      Set Level
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-300 text-center block">Active Level</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="font-bold text-zinc-200 text-xs">Currently Unlocked Capabilities under {trustConfig.currentLevel}:</span>
            <ul className="space-y-1 text-zinc-300 text-[11px] font-sans">
              {trustConfig.unlockedCapabilities.map((cap, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 6: IMPROVEMENT QUEUE */}
      {activeTab === 'improvements' && (
        <div className="space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-400" />
            <span>Aether Self-Improvement Suggestions Queue ({improvements.length} Suggestions)</span>
          </h3>

          <div className="space-y-3">
            {improvements.map((imp) => (
              <div key={imp.id} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 text-sm">{imp.title}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[10px]">
                    Confidence: {imp.confidencePct}%
                  </span>
                </div>

                <p className="text-xs font-sans text-zinc-300"><strong>Observation:</strong> {imp.observation}</p>
                <p className="text-xs font-sans text-amber-300"><strong>Suggested Behavioral Adjustment:</strong> {imp.suggestedAction}</p>
                <p className="text-[11px] font-sans text-zinc-500"><strong>Expected Benefit:</strong> {imp.expectedBenefit}</p>

                {imp.status === 'pending' ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
                    <button
                      onClick={() => handleImprovementAction(imp.id, 'approved')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] transition"
                    >
                      Approve & Adopt
                    </button>
                    <button
                      onClick={() => handleImprovementAction(imp.id, 'testing_one_week')}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold text-[11px] transition"
                    >
                      Test for 1 Week
                    </button>
                    <button
                      onClick={() => handleImprovementAction(imp.id, 'rejected')}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-bold text-[11px] transition"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Status: {imp.status.toUpperCase()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: PERSONAL KNOWLEDGE GRAPH */}
      {activeTab === 'graph' && (
        <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4 font-mono text-xs">
          <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
            <Network size={16} className="text-cyan-400" />
            <span>Personal Knowledge Graph & Relationship Nodes</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="font-bold text-zinc-300 text-xs">Knowledge Nodes ({knowledgeGraph.nodes.length})</span>
              <div className="space-y-1.5">
                {knowledgeGraph.nodes.map((node) => (
                  <div key={node.id} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-zinc-100">{node.label}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] uppercase font-bold">
                      {node.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="font-bold text-zinc-300 text-xs">Connected Relationships ({knowledgeGraph.edges.length})</span>
              <div className="space-y-1.5">
                {knowledgeGraph.edges.map((edge, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] flex items-center gap-2 text-zinc-300">
                    <span className="font-bold text-amber-300">{edge.source}</span>
                    <span className="text-zinc-500">↓ {edge.relationship} ↓</span>
                    <span className="font-bold text-cyan-300">{edge.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD GOAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-100 text-sm">Create Long-Term Goal</span>
              <button onClick={() => setShowGoalModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. 'Achieve 100% Test Suite Coverage'"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MILESTONE */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-100 text-sm">Record Milestone</span>
              <button onClick={() => setShowMilestoneModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3">
              <div>
                <label className="block text-zinc-400 mb-1">Milestone Title</label>
                <input
                  type="text"
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  placeholder="e.g. 'Completed ESM Module Migration'"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description</label>
                <textarea
                  value={msDesc}
                  onChange={(e) => setMsDesc(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Why It Mattered</label>
                <input
                  type="text"
                  value={msWhy}
                  onChange={(e) => setMsWhy(e.target.value)}
                  placeholder="e.g. 'Eliminated all runtime import errors'"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
