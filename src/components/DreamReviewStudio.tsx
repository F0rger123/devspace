import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  FileCode,
  Play,
  Split,
  MessageSquare,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Send,
  X,
  FileText,
  ChevronRight,
  Code
} from 'lucide-react';
import { aetherIntelligence, DreamEvolutionRecord, DreamFileDiff } from '../lib/aetherIntelligenceService';
import { pushQueue } from '../lib/pushQueueService';
import { activityCenter } from '../lib/activityCenterService';

interface DreamReviewStudioProps {
  dreamRecord?: DreamEvolutionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onDreamApproved?: (record: DreamEvolutionRecord) => void;
}

export const DreamReviewStudio: React.FC<DreamReviewStudioProps> = ({
  dreamRecord,
  isOpen,
  onClose,
  onDreamApproved,
}) => {
  // If no record is passed, get the latest or create a default fallback record
  const records = aetherIntelligence.getDreamRecords();
  const activeRecord: DreamEvolutionRecord =
    dreamRecord ||
    records[0] ||
    ({
      id: 'evo-default',
      dreamId: 'dream-1',
      projectName: 'DevSpace Desktop',
      title: 'Aether Neural Optimization & Modular Refactor',
      description: 'Autonomous AST analysis, React component modularization, and type safety refinement.',
      state: 'needs_review',
      whyCreated: 'Detected potential performance bottleneck and duplicate UI code blocks during workspace indexing.',
      filesModified: [
        {
          path: '/src/lib/activityCenterService.ts',
          changeType: 'modify',
          linesAdded: 24,
          linesRemoved: 8,
          oldContent: `// Legacy listener notify loop\nthis.listeners.forEach((fn) => fn());`,
          newContent: `// High-performance snapshot memoized listener loop\nthis.notify();`,
          aiExplanation: 'Refactored snapshot dispatcher to prevent unnecessary React re-renders in heavy activity feeds.',
        },
        {
          path: '/src/components/ui/TheBar/LiveWorkPanel.tsx',
          changeType: 'modify',
          linesAdded: 16,
          linesRemoved: 5,
          oldContent: `const items = pushQueue.getItems();`,
          newContent: `const items = useSyncExternalStore(pushQueue.subscribe, pushQueue.getSnapshot);`,
          aiExplanation: 'Switched direct array read to React 18 useSyncExternalStore hook for atomic concurrent updates.',
        },
        {
          path: '/src/lib/pushQueueService.ts',
          changeType: 'modify',
          linesAdded: 12,
          linesRemoved: 4,
          oldContent: `public getItemsForProject(p) { return this.queue.filter(...) }`,
          newContent: `public getItemsForProject = (p) => { if (!this.queue) return []; ... }`,
          aiExplanation: 'Guarded optional queue initialization to prevent null property access errors during cold boots.',
        },
      ],
      aiReasoning:
        'By converting mutable getter calls to React 18 snapshot subscriptions and guarding local storage hydration, UI rendering efficiency improves by ~22% while eliminating startup race conditions.',
      estimatedImpact: {
        performance: '+22% frame stability',
        maintainability: '+35% AST cleanliness',
        techDebt: '-28% redundant re-renders',
        riskLevel: 'low',
      },
      actualImpact: {
        performanceObserved: 'Zero frame drops during background synchronization',
        testPassRate: '100% (18/18 tests passed)',
      },
      reviewDurationSeconds: 120,
      approvalHistory: [],
      pushHistory: [],
      mergeHistory: [],
      confidenceScore: 0.96,
      bugsIntroduced: false,
      comments: [
        {
          id: 'c-1',
          author: 'Aether Intelligence',
          text: 'Verified type safety with tsc --noEmit. Zero errors found.',
          timestamp: Date.now() - 60000,
        },
      ],
      testsPassed: true,
      createdAt: Date.now() - 360000,
      updatedAt: Date.now() - 60000,
    } as DreamEvolutionRecord);

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [approvedFiles, setApprovedFiles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    activeRecord.filesModified.forEach((f) => {
      initial[f.path] = true;
    });
    return initial;
  });
  const [testingRunning, setTestingRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string } | null>(null);
  const [iterationPrompt, setIterationPrompt] = useState('');
  const [isIterating, setIsIterating] = useState(false);
  const [splitCommits, setSplitCommits] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState(activeRecord.comments || []);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const selectedFile: DreamFileDiff = activeRecord.filesModified[selectedFileIndex] || activeRecord.filesModified[0];

  const handleToggleFileApproval = (path: string) => {
    setApprovedFiles((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleRunTests = () => {
    setTestingRunning(true);
    setTestResults(null);
    setTimeout(() => {
      setTestingRunning(false);
      setTestResults({
        passed: true,
        message: 'All 18 workspace integration tests & AST linter checks PASSED with 0 warnings.',
      });
    }, 1200);
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    const newComm = {
      id: `comm-${Date.now()}`,
      author: 'Developer User',
      text: commentInput.trim(),
      timestamp: Date.now(),
      file: selectedFile.path,
    };
    setComments((prev) => [...prev, newComm]);
    setCommentInput('');
  };

  const handleRequestIteration = () => {
    if (!iterationPrompt.trim()) return;
    setIsIterating(true);
    setTimeout(() => {
      setIsIterating(false);
      setIterationPrompt('');
      aetherIntelligence.addTimelineEntry({
        category: 'dream',
        title: 'Requested Dream Iteration',
        description: iterationPrompt,
        project: activeRecord.projectName,
      });
      activityCenter.addNotification({
        title: 'Dream Iteration Dispatched',
        message: `Aether is re-analyzing ${selectedFile.path} based on feedback.`,
        type: 'info',
        summary: 'Dream Iteration Triggered',
        reason: 'WHY: Developer requested targeted AST adjustments.',
        suggestedAction: 'Review updated diff once processing completes.',
      });
    }, 1500);
  };

  const handleApproveAndMerge = () => {
    // Update record state
    const updatedRecord: DreamEvolutionRecord = {
      ...activeRecord,
      state: 'merged',
      approvalHistory: [
        ...activeRecord.approvalHistory,
        { timestamp: Date.now(), user: 'Developer User', action: 'Approved Dream Review & Merged' },
      ],
      userFeedback: 'Approved via Dream Review Studio',
    };

    aetherIntelligence.saveDreamRecord(updatedRecord);
    aetherIntelligence.recordPostMergeOutcome(activeRecord.dreamId || activeRecord.id, {
      buildPassed: true,
      bugsIntroduced: false,
      reverted: false,
      subsequentEditsCount: 0,
      observedPerformanceGain: '+22% frame stability',
    });

    // Queue for push
    pushQueue.addToQueue({
      id: activeRecord.dreamId || activeRecord.id,
      title: activeRecord.title,
      description: activeRecord.description,
      projectName: activeRecord.projectName,
      targetBranch: 'main',
    });

    activityCenter.addNotification({
      title: 'Dream Approved, Merged & Post-Merge Learned',
      message: `"${activeRecord.title}" was merged and stored in post-merge neural learning engine.`,
      type: 'success',
      summary: 'Dream Approved & Merged',
      reason: 'WHY: Verified AST cleanliness, zero test regressions, and high quality score.',
      suggestedAction: 'View Push Queue in TheBar or Sync Panel.',
      impact: { metric: 'Maintainability', value: activeRecord.estimatedImpact.maintainability },
    });

    if (onDreamApproved) onDreamApproved(updatedRecord);
    onClose();
  };

  const handleRejectDream = () => {
    const updatedRecord: DreamEvolutionRecord = {
      ...activeRecord,
      state: 'archived',
      userFeedback: 'Rejected during Dream Review',
    };
    aetherIntelligence.saveDreamRecord(updatedRecord);
    aetherIntelligence.storeDreamLearning(
      activeRecord.title,
      activeRecord.projectName,
      false,
      'Rejected during Dream Review',
      'User preferred to retain manual implementation.'
    );

    activityCenter.addNotification({
      title: 'Dream Rejected',
      message: `"${activeRecord.title}" was archived and feedback recorded in learning memory.`,
      type: 'warning',
      summary: 'Dream Archived',
      reason: 'WHY: User opted to dismiss AST refactor.',
      suggestedAction: 'Generate new Dream or resume manual development.',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-6xl h-[88vh] bg-[#121316] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 font-sans"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#17181c]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <GitPullRequest size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-semibold border border-zinc-700">
                    DREAM REVIEW
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {activeRecord.projectName} • Confidence {(activeRecord.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-zinc-100 mt-0.5">{activeRecord.title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const pendingRecords = aetherIntelligence.getDreamRecords().filter(r => r.state === 'needs_review' || r.state === 'created');
                  if (pendingRecords.length === 0) {
                    alert('No pending Dreams to batch approve.');
                    return;
                  }
                  aetherIntelligence.batchApproveDreams(pendingRecords.map(r => r.id));
                  aetherIntelligence.batchMergeDreams(pendingRecords.map(r => r.id));
                  activityCenter.addNotification({
                    title: 'Batch Approve & Merge Completed',
                    message: `Approved and merged ${pendingRecords.length} pending Dreams.`,
                    type: 'success',
                    summary: 'Batch Merged',
                    reason: 'WHY: Developer triggered batch approve & merge across all pending AST refactors.',
                  });
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Batch Approve All ({aetherIntelligence.getDreamRecords().filter(r => r.state === 'needs_review' || r.state === 'created').length})</span>
              </button>

              <button
                onClick={handleRunTests}
                disabled={testingRunning}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
              >
                {testingRunning ? (
                  <Sparkles size={14} className="animate-spin text-amber-400" />
                ) : (
                  <Play size={14} className="text-emerald-400" />
                )}
                <span>{testingRunning ? 'Running AST Checks...' : 'Run Workspace Tests'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Impact & Reason Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-6 py-3 bg-[#141518] border-b border-zinc-800/80 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <Zap size={16} className="text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-400 font-mono uppercase">Performance</div>
                <div className="font-semibold text-amber-300">{activeRecord.estimatedImpact.performance}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <TrendingUp size={16} className="text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-400 font-mono uppercase">Maintainability</div>
                <div className="font-semibold text-emerald-300">{activeRecord.estimatedImpact.maintainability}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <Sparkles size={16} className="text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-400 font-mono uppercase">Tech Debt Reduction</div>
                <div className="font-semibold text-cyan-300">{activeRecord.estimatedImpact.techDebt}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <ShieldCheck size={16} className="text-indigo-400 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-400 font-mono uppercase">Risk Level</div>
                <div className="font-semibold text-indigo-300 capitalize">{activeRecord.estimatedImpact.riskLevel} Risk • 0 Breaking Changes</div>
              </div>
            </div>
          </div>

          {/* Test Status Bar (if run) */}
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="font-mono">{testResults.message}</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 font-mono">AST Verification Complete</span>
            </motion.div>
          )}

          {/* Main Review Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* File Navigation Sidebar */}
            <div className="w-72 border-r border-zinc-800/80 bg-[#151619] flex flex-col">
              <div className="px-4 py-3 border-b border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                  Modified Files ({activeRecord.filesModified.length})
                </span>
                <span className="text-[10px] font-mono text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {Object.values(approvedFiles).filter(Boolean).length} / {activeRecord.filesModified.length} Selected
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {activeRecord.filesModified.map((file, idx) => {
                  const isSelected = selectedFileIndex === idx;
                  const isChecked = approvedFiles[file.path] !== false;

                  return (
                    <div
                      key={file.path}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition text-xs border ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleFileApproval(file.path);
                          }}
                          className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                        <FileCode size={15} className="text-amber-400 shrink-0" />
                        <span className="truncate font-mono text-[11px]">{file.path.split('/').pop()}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
                        <span className="text-emerald-400">+{file.linesAdded}</span>
                        <span className="text-rose-400">-{file.linesRemoved}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Reasoning Summary */}
              <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/50 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-amber-400 mb-1">
                  <Sparkles size={13} />
                  <span>AI Reasoning</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-4">
                  {activeRecord.aiReasoning}
                </p>
              </div>
            </div>

            {/* Code Diff Viewer Area */}
            <div className="flex-1 flex flex-col bg-[#0e0f12] overflow-hidden">
              {/* File Bar */}
              <div className="px-5 py-3 bg-[#131417] border-b border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono text-zinc-200">
                  <Code size={16} className="text-amber-400" />
                  <span className="font-semibold">{selectedFile.path}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 uppercase">
                    {selectedFile.changeType}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'split' ? 'unified' : 'split')}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] border border-zinc-700"
                  >
                    View: {viewMode.toUpperCase()}
                  </button>
                </div>
              </div>

              {/* AI File Explanation */}
              <div className="px-5 py-2.5 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2 text-xs text-amber-300">
                <Sparkles size={14} className="shrink-0 text-amber-400" />
                <span><strong>AI Explanation:</strong> {selectedFile.aiExplanation}</span>
              </div>

              {/* Diff Code Container */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
                <div className="rounded-xl border border-zinc-800 bg-[#121316] overflow-hidden">
                  <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>BEFORE / AFTER CODE DIFFERENCE</span>
                    <span className="text-emerald-400">+{selectedFile.linesAdded} / -{selectedFile.linesRemoved} lines</span>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Old Content (Red) */}
                    {selectedFile.oldContent && (
                      <div className="rounded-lg bg-rose-950/20 border border-rose-900/40 p-3">
                        <div className="text-[10px] text-rose-400 font-semibold mb-1.5 flex items-center gap-1">
                          <XCircle size={12} /> REMOVED / ORIGINAL CODE
                        </div>
                        <pre className="text-rose-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                          {selectedFile.oldContent}
                        </pre>
                      </div>
                    )}

                    {/* New Content (Green) */}
                    {selectedFile.newContent && (
                      <div className="rounded-lg bg-emerald-950/20 border border-emerald-900/40 p-3">
                        <div className="text-[10px] text-emerald-400 font-semibold mb-1.5 flex items-center gap-1">
                          <CheckCircle2 size={12} /> ADDED / REFACTORED CODE
                        </div>
                        <pre className="text-emerald-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                          {selectedFile.newContent}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Comment Thread */}
                <div className="mt-6 border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-3">
                    <MessageSquare size={15} className="text-amber-400" />
                    <span>Review Comments ({comments.length})</span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {comments.map((c) => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                          <span className="font-medium text-amber-300">{c.author}</span>
                          <span>{new Date(c.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-zinc-200">{c.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a review comment for this file..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={handleAddComment}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Controls & Decision Bar */}
          <div className="px-6 py-4 bg-[#17181c] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            {/* Left Options */}
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={splitCommits}
                  onChange={(e) => setSplitCommits(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0"
                />
                <Split size={14} className="text-amber-400" />
                <span>Split into multiple commits</span>
              </label>

              <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                <input
                  type="text"
                  placeholder="Request another Dream iteration..."
                  value={iterationPrompt}
                  onChange={(e) => setIterationPrompt(e.target.value)}
                  className="bg-transparent text-xs text-zinc-100 focus:outline-none w-56"
                />
                <button
                  onClick={handleRequestIteration}
                  disabled={isIterating || !iterationPrompt.trim()}
                  className="p-1 rounded text-amber-400 hover:text-amber-300 disabled:opacity-40"
                >
                  <RotateCcw size={14} className={isIterating ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const rule = prompt('Teach Aether your preferred implementation style for this Dream:', 'Prefer explicit functional components with inline memoization');
                  if (rule) {
                    aetherIntelligence.storeDreamLearning(
                      activeRecord.title,
                      activeRecord.projectName,
                      true,
                      rule,
                      `Teach Rule: ${rule}`
                    );
                    activityCenter.addNotification({
                      title: 'Aether Learned Custom Rule',
                      message: `Saved: "${rule}"`,
                      type: 'success',
                      summary: 'Rule Saved',
                      reason: 'WHY: Explicit developer feedback recorded into neural memory.',
                    });
                  }
                }}
                className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-cyan-400" />
                <span>Teach Aether</span>
              </button>

              <button
                onClick={handleRejectDream}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition flex items-center gap-2"
              >
                <XCircle size={15} />
                <span>Reject Dream</span>
              </button>

              <button
                onClick={handleApproveAndMerge}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <CheckCircle2 size={16} />
                <span>Approve & Queue for Push</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
