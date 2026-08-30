import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Play, RotateCcw, X, ShieldAlert, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { aetherMultiActionEngine, MultiActionPlan, WorkflowStep, WorkflowExecutionHistoryEntry } from '../../../lib/aetherMultiActionEngine';

interface AetherMultiActionProgressProps {
  plan?: MultiActionPlan | null;
  onCancel?: () => void;
  onConfirmStep?: () => void;
  onRejectStep?: () => void;
}

export const AetherMultiActionProgress: React.FC<AetherMultiActionProgressProps> = ({
  plan: initialPlan,
  onCancel,
  onConfirmStep,
  onRejectStep,
}) => {
  const [plan, setPlan] = useState<MultiActionPlan | null>(initialPlan || aetherMultiActionEngine.getCurrentPlan());
  const [history, setHistory] = useState<WorkflowExecutionHistoryEntry[]>(aetherMultiActionEngine.getHistory());
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
    }
  }, [initialPlan]);

  useEffect(() => {
    aetherMultiActionEngine.registerCallbacks({
      onPlanCreated: (p) => setPlan({ ...p }),
      onStepStatusChange: (p) => setPlan({ ...p }),
      onPlanCompleted: (p) => {
        setPlan({ ...p });
        setHistory(aetherMultiActionEngine.getHistory());
      },
      onPlanFailed: (p) => {
        setPlan({ ...p });
        setHistory(aetherMultiActionEngine.getHistory());
      }
    });

    const handleHistoryUpdate = () => {
      setHistory(aetherMultiActionEngine.getHistory());
    };

    const handleWorkflowProgress = (e: CustomEvent<any>) => {
      const detail = e.detail;
      if (!detail) return;

      const convertedPlan: MultiActionPlan = {
        id: detail.runId || `wf-${Date.now()}`,
        title: detail.workflowName,
        originalGoal: `Teachable Flow: ${detail.workflowName}`,
        status: detail.status === 'waiting_confirmation' ? 'waiting_confirmation' :
                detail.status === 'completed' ? 'completed' :
                detail.status === 'failed' ? 'failed' :
                detail.status === 'cancelled' ? 'cancelled' : 'running',
        currentStepIndex: detail.currentStepIndex,
        createdAt: Date.now(),
        steps: (detail.stepResults || []).map((s: any) => ({
          id: s.stepId,
          stepNumber: s.order,
          title: s.title,
          tool: s.title,
          description: s.output ? String(s.output) : 'Executing sequential workflow step',
          status: s.status,
          isDestructive: false,
          requiresConfirmation: false,
          inputPayload: {},
          outputResult: s.output,
          error: s.error
        })),
        sharedContext: {}
      };

      setPlan(convertedPlan);
    };

    window.addEventListener('aether-workflow-history-updated', handleHistoryUpdate);
    window.addEventListener('aether-workflow-progress', handleWorkflowProgress as EventListener);
    return () => {
      window.removeEventListener('aether-workflow-history-updated', handleHistoryUpdate);
      window.removeEventListener('aether-workflow-progress', handleWorkflowProgress as EventListener);
    };
  }, []);

  if (!plan && history.length === 0) return null;

  const currentStep = plan ? plan.steps[plan.currentStepIndex] : null;
  const isWaitingConfirmation = plan?.status === 'waiting_confirmation' || currentStep?.status === 'waiting_confirmation';

  return (
    <div id="aether-multi-action-card" className="w-full bg-zinc-900/90 border border-amber-500/30 shadow-xl rounded-2xl p-4 font-sans text-xs text-zinc-100 backdrop-blur-xl transition-all my-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Sparkles size={14} className={plan?.status === 'running' ? 'animate-spin' : ''} />
          </div>
          <div>
            <h4 className="font-bold text-zinc-100 text-[13px] flex items-center gap-1.5">
              {plan?.title || 'Multi-Action Workflow Engine'}
              {plan && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${
                  plan.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : plan.status === 'failed'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : plan.status === 'cancelled'
                    ? 'bg-zinc-700/50 text-zinc-300 border-zinc-600'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                }`}>
                  {plan.status.toUpperCase().replace('_', ' ')}
                </span>
              )}
            </h4>
            <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[340px]">
              {plan?.originalGoal || 'Execute sequential development workflows'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {plan && plan.status === 'running' && (
            <button
              id="cancel-workflow-btn"
              onClick={() => {
                aetherMultiActionEngine.cancelCurrentWorkflow();
                onCancel?.();
              }}
              className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X size={12} /> Cancel
            </button>
          )}

          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-2 py-1 bg-white/10 hover:bg-white/15 text-zinc-300 rounded-lg text-[11px] font-mono transition-colors cursor-pointer"
            >
              {showHistory ? 'Active Plan' : `History (${history.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Banner for High-Risk Steps */}
      {isWaitingConfirmation && currentStep && (
        <div className="mb-3 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-[12px]">
            <ShieldAlert size={16} /> Confirmation Required for Step {currentStep.stepNumber}
          </div>
          <p className="text-zinc-200 text-[11.5px]">
            Aether is about to execute: <strong>"{currentStep.title}"</strong>.
          </p>
          <div className="text-[11px] text-zinc-300 font-mono bg-black/40 p-2 rounded-lg border border-white/5">
            {currentStep.description}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              id="confirm-step-btn"
              onClick={() => {
                aetherMultiActionEngine.resolveConfirmation(true);
                onConfirmStep?.();
              }}
              className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <CheckCircle2 size={13} /> Confirm & Proceed
            </button>
            <button
              id="reject-step-btn"
              onClick={() => {
                aetherMultiActionEngine.resolveConfirmation(false);
                onRejectStep?.();
              }}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-zinc-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              Decline Step
            </button>
          </div>
        </div>
      )}

      {/* Steps Progress List */}
      {!showHistory && plan && (
        <div className="space-y-2 mb-2">
          {plan.steps.map((step) => {
            const isCurrent = plan.currentStepIndex === step.stepNumber - 1;
            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  step.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-100'
                    : step.status === 'failed'
                    ? 'bg-rose-500/15 border-rose-500/35 text-rose-100'
                    : step.status === 'running'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-100 ring-1 ring-amber-500/30'
                    : step.status === 'cancelled'
                    ? 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400'
                    : 'bg-zinc-950/40 border-white/5 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] w-4 text-center font-bold">
                      {step.status === 'completed' ? (
                        <CheckCircle2 size={14} className="text-emerald-400 inline" />
                      ) : step.status === 'failed' ? (
                        <XCircle size={14} className="text-rose-400 inline" />
                      ) : step.status === 'running' ? (
                        <Play size={13} className="text-amber-400 animate-pulse inline" />
                      ) : step.status === 'waiting_confirmation' ? (
                        <ShieldAlert size={14} className="text-amber-300 animate-bounce inline" />
                      ) : (
                        <Clock size={13} className="text-zinc-500 inline" />
                      )}
                    </span>
                    <span className="font-semibold text-[11.5px] text-zinc-200">
                      Step {step.stepNumber}: {step.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 capitalize">
                    {step.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Step Detail / Output / Error */}
                {step.outputResult && (
                  <div className="mt-1.5 ml-6 text-[10.5px] text-emerald-300 font-mono bg-emerald-950/30 border border-emerald-500/20 rounded p-1.5 break-all">
                    {typeof step.outputResult === 'object'
                      ? JSON.stringify(step.outputResult, null, 2)
                      : String(step.outputResult)}
                  </div>
                )}

                {step.error && (
                  <div className="mt-1.5 ml-6 text-[10.5px] text-rose-300 font-mono bg-rose-950/30 border border-rose-500/20 rounded p-1.5">
                    ❌ {step.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Execution History View */}
      {showHistory && (
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
          <h5 className="font-bold text-zinc-400 text-[11px] uppercase tracking-wider mb-1">
            Recent Workflow Runs ({history.length})
          </h5>
          {history.map((hist) => (
            <div
              key={hist.id}
              className="p-2.5 bg-zinc-950/60 border border-white/10 rounded-xl space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 text-[11.5px]">{hist.title}</span>
                <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  hist.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : hist.status === 'failed'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-zinc-700 text-zinc-300'
                }`}>
                  {hist.status.toUpperCase()} ({hist.completedStepCount}/{hist.stepCount})
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono truncate">{hist.goal}</p>
              <div className="text-[9.5px] text-zinc-500 flex justify-between font-mono pt-1">
                <span>{new Date(hist.startedAt).toLocaleTimeString()}</span>
                <span>{Math.round(hist.durationMs / 100) / 10}s total</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
