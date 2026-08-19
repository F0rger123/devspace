import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitPullRequest,
  GitCommit,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Flame,
  MessageSquare,
  ListTodo,
  Layers
} from 'lucide-react';
import {
  aetherActiveProjectContext,
  CanonicalActiveProjectContextState,
  RecentWorkIntelligenceReport,
  PRMergeSafetyEvaluation
} from '../../lib/aetherActiveProjectContext';
import { aetherConversationalEngine, WorkingMemoryItem } from '../../lib/aetherConversationalEngine';
import { useData } from '../../context/DataProvider';

interface Props {
  onRunAetherCommand?: (command: string) => void;
  className?: string;
}

export function AetherProjectIntelligencePanel({ onRunAetherCommand, className = '' }: Props) {
  const { projects, activeProjectId, setActiveProjectId } = useData();
  const [contextState, setContextState] = useState<CanonicalActiveProjectContextState>(
    aetherActiveProjectContext.getState()
  );
  const [report, setReport] = useState<RecentWorkIntelligenceReport>(
    aetherActiveProjectContext.getRecentWorkReport()
  );
  const [workingMemory, setWorkingMemory] = useState<WorkingMemoryItem[]>(
    aetherConversationalEngine.getState().workingMemory
  );
  const [selectedPR, setSelectedPR] = useState<number | null>(null);
  const [prSafety, setPrSafety] = useState<PRMergeSafetyEvaluation | null>(null);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [activeTab, setActiveTab] = useState<'intelligence' | 'prs' | 'brainstorm'>('intelligence');

  useEffect(() => {
    const unsub = aetherActiveProjectContext.subscribe((state) => {
      setContextState(state);
      setReport(aetherActiveProjectContext.getRecentWorkReport());
    });
    return () => unsub();
  }, []);

  const handleRefresh = async () => {
    await aetherActiveProjectContext.refreshFromGitHub();
    setReport(aetherActiveProjectContext.getRecentWorkReport());
    setWorkingMemory(aetherConversationalEngine.getState().workingMemory);
  };

  const handleCheckPR = async (prNumber: number) => {
    setSelectedPR(prNumber);
    setCheckingSafety(true);
    try {
      const evaluation = await aetherActiveProjectContext.evaluatePRMergeSafety(prNumber);
      setPrSafety(evaluation);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingSafety(false);
    }
  };

  const executeCommand = (cmd: string) => {
    if (onRunAetherCommand) {
      onRunAetherCommand(cmd);
    }
  };

  return (
    <div
      id="aether-project-intelligence-panel"
      className={`bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl flex flex-col space-y-4 ${className}`}
    >
      {/* Header & Project Status */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-white tracking-wide">
                Aether Project Intelligence
              </h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Continuous Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Active Context: <span className="text-slate-200 font-medium">{contextState.projectName || 'Workspace'}</span>
              {contextState.connectedRepository && (
                <span className="ml-2 text-slate-400">
                  • Repo: <span className="text-indigo-300">{contextState.connectedRepository}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="refresh-intelligence-btn"
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/50"
            title="Refresh GitHub & Workspace Context"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('intelligence')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'intelligence'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Work Intelligence</span>
        </button>
        <button
          onClick={() => setActiveTab('prs')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'prs'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Pull Requests ({contextState.openPullRequests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('brainstorm')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'brainstorm'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Working Memory & Ideas ({workingMemory.filter(i => i.type === 'idea').length})</span>
        </button>
      </div>

      {/* Tab 1: Work Intelligence */}
      {activeTab === 'intelligence' && (
        <div className="space-y-4 text-xs">
          {/* Grounded Facts */}
          <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
              <GitCommit className="w-3.5 h-3.5 text-blue-400" />
              <span>Grounded Recent Facts</span>
            </div>
            {report.groundedFacts.length > 0 ? (
              <ul className="space-y-1 text-slate-300">
                {report.groundedFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No recent commit or pull activity recorded yet.</p>
            )}
          </div>

          {/* Assistant Inferences */}
          {report.inferences.length > 0 && (
            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Context Inferences</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                {report.inferences.map((inf, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{inf}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Suggested Next Steps */}
          {report.suggestedNextSteps.length > 0 && (
            <div className="space-y-2">
              <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                Suggested Next Actions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.suggestedNextSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => executeCommand(step)}
                    className="p-2.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 text-indigo-200 hover:text-white flex items-center justify-between text-left transition-colors group"
                  >
                    <span className="truncate pr-2 font-medium">{step}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pull Requests & Merge Safety */}
      {activeTab === 'prs' && (
        <div className="space-y-3 text-xs">
          {contextState.openPullRequests.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800">
              <GitPullRequest className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>No open pull requests found for {contextState.projectName || 'active repository'}.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contextState.openPullRequests.map((pr) => (
                <div
                  key={pr.number}
                  className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GitPullRequest className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-slate-200">
                        #{pr.number}: {pr.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">by @{pr.user}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                    <span>
                      Branch: <code className="text-slate-300 font-mono">{pr.branch}</code>
                    </span>
                    <span>
                      Base: <code className="text-slate-300 font-mono">{pr.base}</code>
                    </span>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => handleCheckPR(pr.number)}
                      disabled={checkingSafety}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center space-x-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{checkingSafety && selectedPR === pr.number ? 'Auditing...' : 'Check Merge Safety'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Merge Safety Audit Result Box */}
          {prSafety && (
            <div
              className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                prSafety.safe
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              }`}
            >
              <div className="flex items-center space-x-2 font-semibold">
                {prSafety.safe ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  PR #{prSafety.prNumber} Safety Verdict: {prSafety.safe ? 'SAFE TO MERGE' : 'ACTION REQUIRED'}
                </span>
              </div>
              <p className="whitespace-pre-line text-slate-300">{prSafety.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Working Memory & Ideas */}
      {activeTab === 'brainstorm' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              Active Brainstorm Canvas
            </span>
            <button
              onClick={() => executeCommand('Brainstorm a few ways we could solve this')}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Generate 4 Ideas</span>
            </button>
          </div>

          {workingMemory.filter(i => i.type === 'idea').length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>No active brainstorm ideas in working memory.</p>
              <p className="text-[11px] mt-1 text-slate-600">
                Say "Brainstorm 4 ways to solve this" to populate ideas.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {workingMemory
                .filter(i => i.type === 'idea')
                .map((idea) => (
                  <div
                    key={idea.id}
                    className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        Idea #{idea.number || 1}: {idea.title}
                      </span>
                    </div>
                    {idea.details && <p className="text-slate-400">{idea.details}</p>}
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => executeCommand(`Save Idea #${idea.number || 1}`)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      >
                        Save to Project
                      </button>
                      <button
                        onClick={() => executeCommand(`Turn Idea #${idea.number || 1} into an issue`)}
                        className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center space-x-1"
                      >
                        <ListTodo className="w-3 h-3" />
                        <span>Convert to Issue</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
