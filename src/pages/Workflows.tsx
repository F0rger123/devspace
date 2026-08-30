import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Play,
  Plus,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  X,
  ExternalLink,
  Laptop,
  Globe,
  Shield,
  ShieldAlert,
  Sliders,
  RefreshCw,
  Terminal,
  FolderGit2,
  CheckSquare,
  FileText,
  Bookmark,
  Share2,
  RotateCcw,
  Check,
  ChevronRight,
  Activity,
  Workflow as WorkflowIcon
} from 'lucide-react';
import {
  aetherWorkflowEngine,
  TeachableWorkflow,
  TeachableStep,
  WorkflowStepActionType,
  WorkflowRunRecord,
  WorkflowExecutionProgressEvent
} from '../lib/aetherWorkflowEngine';
import { useData } from '../context/DataProvider';
import { useNavigate } from 'react-router-dom';
import { isElectron } from '../lib/electronBridge';
import { haptic } from '../utils/haptics';

export function Workflows() {
  const { projects, activeProjectId, setActiveProjectId, issues, notes, addIssue, addNote, showToast } = useData();
  const navigate = useNavigate();
  const desktop = isElectron();

  const [workflows, setWorkflows] = useState<TeachableWorkflow[]>([]);
  const [history, setHistory] = useState<WorkflowRunRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'workflows' | 'history' | 'teach'>('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'paused'>('all');

  // Conversational Teaching Form State
  const [conversationalInput, setConversationalInput] = useState('');
  const [teachParsedResult, setTeachParsedResult] = useState<any>(null);

  // Workflow Editor Modal State
  const [editingWorkflow, setEditingWorkflow] = useState<TeachableWorkflow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newAliasInput, setNewAliasInput] = useState('');

  // Live Execution Modal / Progress State
  const [activeRunningWorkflow, setActiveRunningWorkflow] = useState<TeachableWorkflow | null>(null);
  const [liveExecutionProgress, setLiveExecutionProgress] = useState<WorkflowExecutionProgressEvent | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);

  // Quick Alias Add State on Cards
  const [quickAliasWfId, setQuickAliasWfId] = useState<string | null>(null);
  const [quickAliasText, setQuickAliasText] = useState('');

  useEffect(() => {
    loadData();

    const handleWorkflowsUpdated = (e: any) => {
      setWorkflows(aetherWorkflowEngine.getWorkflows());
    };

    const handleHistoryUpdated = (e: any) => {
      setHistory(aetherWorkflowEngine.getExecutionHistory());
    };

    const handleProgress = (e: CustomEvent<WorkflowExecutionProgressEvent>) => {
      setLiveExecutionProgress(e.detail);
    };

    window.addEventListener('aether-workflows-updated', handleWorkflowsUpdated as EventListener);
    window.addEventListener('aether-workflow-history-updated', handleHistoryUpdated as EventListener);
    window.addEventListener('aether-workflow-progress', handleProgress as EventListener);

    return () => {
      window.removeEventListener('aether-workflows-updated', handleWorkflowsUpdated as EventListener);
      window.removeEventListener('aether-workflow-history-updated', handleHistoryUpdated as EventListener);
      window.removeEventListener('aether-workflow-progress', handleProgress as EventListener);
    };
  }, []);

  const loadData = () => {
    setWorkflows(aetherWorkflowEngine.getWorkflows());
    setHistory(aetherWorkflowEngine.getExecutionHistory());
  };

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(w => {
      const matchSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.triggerPhrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.aliases || []).some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFilter =
        filterEnabled === 'all' ? true : filterEnabled === 'enabled' ? w.enabled : !w.enabled;

      return matchSearch && matchFilter;
    });
  }, [workflows, searchQuery, filterEnabled]);

  // Execute Workflow Handler
  const handleRunWorkflow = async (workflow: TeachableWorkflow) => {
    haptic.medium();
    setActiveRunningWorkflow(workflow);
    setIsExecutionModalOpen(true);

    const execContext = {
      navigate,
      showToast,
      projects: projects || [],
      activeProjectId,
      setActiveProjectId,
      issues: issues || [],
      notes: notes || [],
      addIssue,
      addNote
    };

    try {
      const res = await aetherWorkflowEngine.executeWorkflow(workflow, execContext, {
        triggerSource: 'workflows_page',
        onProgress: (p) => setLiveExecutionProgress(p)
      });

      if (res.success) {
        showToast?.(`Workflow "${workflow.name}" finished successfully!`, 'success');
      } else if (res.runRecord.status === 'cancelled') {
        showToast?.(`Workflow execution cancelled.`, 'info');
      } else {
        showToast?.(`Workflow failed: ${res.runRecord.failureReason || 'Error'}`, 'error');
      }
    } catch (e: any) {
      showToast?.(`Execution error: ${e?.message || e}`, 'error');
    }
  };

  // Conversational Teaching Actions
  const handleParseConversational = (text: string) => {
    setConversationalInput(text);
    if (!text.trim()) {
      setTeachParsedResult(null);
      return;
    }
    const parsed = aetherWorkflowEngine.parseWorkflowFromConversation(text);
    setTeachParsedResult(parsed);
  };

  const handleSaveTaughtWorkflow = () => {
    if (!teachParsedResult || !teachParsedResult.steps || teachParsedResult.steps.length === 0) return;
    haptic.success();

    const newWf: TeachableWorkflow = {
      id: `wf-${Date.now()}`,
      name: teachParsedResult.name || 'Custom Teachable Workflow',
      triggerPhrase: teachParsedResult.triggerPhrase || 'custom trigger',
      aliases: teachParsedResult.aliases || [],
      description: `Created conversationally: "${conversationalInput}"`,
      enabled: true,
      isAccountSafe: true,
      hasMachineSpecificSteps: teachParsedResult.steps.some((s: any) => s.isMachineSpecific),
      steps: teachParsedResult.steps,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0
    };

    aetherWorkflowEngine.saveWorkflow(newWf);
    setConversationalInput('');
    setTeachParsedResult(null);
    setActiveTab('workflows');
    showToast?.(`Learned and saved workflow "${newWf.name}"!`, 'success');
  };

  // Editor Actions
  const handleOpenNewWorkflow = () => {
    setEditingWorkflow({
      id: `wf-${Date.now()}`,
      name: 'New Custom Workflow',
      triggerPhrase: 'run custom flow',
      aliases: ['my flow', 'start custom flow'],
      description: 'Executes customized sequential steps across DevSpace and OS tools.',
      enabled: true,
      isAccountSafe: true,
      hasMachineSpecificSteps: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0,
      steps: [
        {
          id: `step-${Date.now()}-1`,
          order: 1,
          title: 'Open Active Project',
          actionType: 'open_project',
          target: '{{activeProject.name}}',
          description: 'Focuses workspace on active project'
        },
        {
          id: `step-${Date.now()}-2`,
          order: 2,
          title: 'Show What Needs Attention',
          actionType: 'attention_summary',
          target: 'attention_feed',
          description: 'Summarizes deliverables & blockers'
        }
      ]
    });
    setIsEditorOpen(true);
  };

  const handleSaveEditor = () => {
    if (!editingWorkflow) return;
    if (!editingWorkflow.name.trim() || !editingWorkflow.triggerPhrase.trim()) {
      showToast?.('Workflow name and trigger phrase are required.', 'error');
      return;
    }
    haptic.success();
    aetherWorkflowEngine.saveWorkflow(editingWorkflow);
    setIsEditorOpen(false);
    setEditingWorkflow(null);
    showToast?.(`Saved workflow "${editingWorkflow.name}"`, 'success');
  };

  const handleDeleteWorkflow = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete workflow "${name}"?`)) {
      haptic.medium();
      aetherWorkflowEngine.deleteWorkflow(id);
      showToast?.(`Deleted workflow "${name}"`, 'info');
    }
  };

  const handleDuplicateWorkflow = (wf: TeachableWorkflow) => {
    haptic.light();
    const dupe: TeachableWorkflow = {
      ...wf,
      id: `wf-${Date.now()}`,
      name: `${wf.name} (Copy)`,
      triggerPhrase: `${wf.triggerPhrase} copy`,
      aliases: wf.aliases.map(a => `${a} copy`),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0,
      lastExecutedAt: undefined,
      lastStatus: undefined
    };
    aetherWorkflowEngine.saveWorkflow(dupe);
    showToast?.(`Duplicated "${wf.name}"`, 'success');
  };

  // Step Reordering & Editing in Editor Modal
  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (!editingWorkflow) return;
    const newSteps = [...editingWorkflow.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    // Recalculate order numbers
    newSteps.forEach((s, idx) => (s.order = idx + 1));
    setEditingWorkflow({ ...editingWorkflow, steps: newSteps });
  };

  const handleAddStepToEditor = () => {
    if (!editingWorkflow) return;
    const newStep: TeachableStep = {
      id: `step-${Date.now()}-${editingWorkflow.steps.length + 1}`,
      order: editingWorkflow.steps.length + 1,
      title: 'New Action Step',
      actionType: 'navigate_route',
      target: '/projects',
      description: 'Navigates to specified workspace route'
    };
    setEditingWorkflow({
      ...editingWorkflow,
      steps: [...editingWorkflow.steps, newStep]
    });
  };

  const handleDeleteStepFromEditor = (stepId: string) => {
    if (!editingWorkflow) return;
    const filtered = editingWorkflow.steps.filter(s => s.id !== stepId);
    filtered.forEach((s, idx) => (s.order = idx + 1));
    setEditingWorkflow({ ...editingWorkflow, steps: filtered });
  };

  const handleUpdateStepInEditor = (stepId: string, updates: Partial<TeachableStep>) => {
    if (!editingWorkflow) return;
    const updated = editingWorkflow.steps.map(s => (s.id === stepId ? { ...s, ...updates } : s));
    setEditingWorkflow({ ...editingWorkflow, steps: updated });
  };

  const handleAddAliasToEditor = () => {
    if (!editingWorkflow || !newAliasInput.trim()) return;
    const clean = newAliasInput.toLowerCase().trim();
    if (!editingWorkflow.aliases.includes(clean)) {
      setEditingWorkflow({
        ...editingWorkflow,
        aliases: [...editingWorkflow.aliases, clean]
      });
    }
    setNewAliasInput('');
  };

  const handleRemoveAliasFromEditor = (alias: string) => {
    if (!editingWorkflow) return;
    setEditingWorkflow({
      ...editingWorkflow,
      aliases: editingWorkflow.aliases.filter(a => a !== alias)
    });
  };

  const handleAddQuickAlias = (wfId: string) => {
    if (!quickAliasText.trim()) return;
    aetherWorkflowEngine.addAlias(wfId, quickAliasText.trim());
    setQuickAliasWfId(null);
    setQuickAliasText('');
    showToast?.('Added alias!', 'success');
  };

  return (
    <div id="workflows-page" className="w-full h-full min-h-screen bg-[#09090b] text-zinc-100 flex flex-col p-4 md:p-8 font-sans custom-scrollbar overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <WorkflowIcon size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
                  Aether Teachable Workflows
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Conversational Engine v2
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Teach, automate, and trigger multi-step desktop & workspace flows via chat, command bar, or Dynamic Island.
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="teach-workflow-btn"
              onClick={() => setActiveTab('teach')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
                activeTab === 'teach'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
              }`}
            >
              <Sparkles size={14} /> Teach by Conversation
            </button>

            <button
              id="new-workflow-btn"
              onClick={handleOpenNewWorkflow}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Plus size={14} /> Create Workflow
            </button>
          </div>
        </div>

        {/* Stats & Sync Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Zap size={18} />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-zinc-100">{workflows.length}</div>
              <div className="text-[11px] text-zinc-400">Total Workflows</div>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-emerald-300">
                {workflows.filter(w => w.enabled).length}
              </div>
              <div className="text-[11px] text-zinc-400">Active Triggers</div>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Activity size={18} />
            </div>
            <div>
              <div className="text-lg font-bold font-mono text-purple-300">{history.length}</div>
              <div className="text-[11px] text-zinc-400">Total Runs Logged</div>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              {desktop ? <Laptop size={18} /> : <Globe size={18} />}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-100">
                {desktop ? 'Desktop Native' : 'Web & Sync'}
              </div>
              <div className="text-[10.5px] text-zinc-400 font-mono">
                {desktop ? 'OS Process & IDE Enabled' : 'Account Safe Synced'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'workflows'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Workflows ({workflows.length})
            </button>
            <button
              onClick={() => setActiveTab('teach')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'teach'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles size={12} /> Teach Aether
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock size={12} /> Run History ({history.length})
            </button>
          </div>

          {activeTab === 'workflows' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search workflows, triggers, aliases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 w-64"
                />
              </div>

              <select
                value={filterEnabled}
                onChange={(e: any) => setFilterEnabled(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">All States</option>
                <option value="enabled">Active Only</option>
                <option value="paused">Paused Only</option>
              </select>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: WORKFLOWS LIST & CARDS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'workflows' && (
          <div className="space-y-4">
            {filteredWorkflows.length === 0 ? (
              <div className="p-12 text-center bg-zinc-900/30 border border-dashed border-white/10 rounded-2xl space-y-3">
                <WorkflowIcon size={32} className="mx-auto text-zinc-600" />
                <h3 className="text-sm font-bold text-zinc-300">No workflows matching filter</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Try speaking to Aether or click "Teach by Conversation" to add reusable workflows.
                </p>
                <button
                  onClick={handleOpenNewWorkflow}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Create Workflow
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredWorkflows.map((wf) => (
                  <motion.div
                    key={wf.id}
                    layout
                    className={`p-5 bg-zinc-900/70 border rounded-2xl backdrop-blur-md transition-all flex flex-col justify-between ${
                      wf.enabled
                        ? 'border-white/10 hover:border-amber-500/40 shadow-lg'
                        : 'border-white/5 opacity-70 bg-zinc-950/40'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-100">{wf.name}</h3>
                            <span
                              className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                                wf.enabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {wf.enabled ? 'ACTIVE' : 'PAUSED'}
                            </span>
                            {wf.hasMachineSpecificSteps && (
                              <span
                                title="Contains local machine desktop commands"
                                className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1"
                              >
                                <Laptop size={10} /> Local Paths
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2">{wf.description}</p>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <button
                          onClick={() => {
                            haptic.light();
                            const next = aetherWorkflowEngine.toggleWorkflow(wf.id);
                            setWorkflows(aetherWorkflowEngine.getWorkflows());
                            showToast?.(`Workflow ${next ? 'activated' : 'paused'}`, 'info');
                          }}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            wf.enabled ? 'bg-amber-500' : 'bg-zinc-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              wf.enabled ? 'left-4' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Trigger Phrase & Aliases */}
                      <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                            Primary Trigger:
                          </span>
                          <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-md font-mono text-[11px] font-semibold">
                            "{wf.triggerPhrase}"
                          </span>
                        </div>

                        {/* Aliases List */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-zinc-500">Aliases:</span>
                          {wf.aliases && wf.aliases.length > 0 ? (
                            wf.aliases.map((alias) => (
                              <span
                                key={alias}
                                className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded text-[10px] font-mono flex items-center gap-1"
                              >
                                "{alias}"
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-mono">None</span>
                          )}

                          {quickAliasWfId === wf.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Add alias..."
                                value={quickAliasText}
                                onChange={(e) => setQuickAliasText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddQuickAlias(wf.id)}
                                className="px-1.5 py-0.5 bg-zinc-800 border border-white/20 rounded text-[10px] text-zinc-100 w-24 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddQuickAlias(wf.id)}
                                className="p-0.5 bg-amber-500 text-zinc-950 rounded hover:bg-amber-400"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                onClick={() => setQuickAliasWfId(null)}
                                className="p-0.5 text-zinc-400 hover:text-zinc-200"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setQuickAliasWfId(wf.id);
                                setQuickAliasText('');
                              }}
                              className="text-[10px] text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <Plus size={10} /> Add
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Steps Summary Preview */}
                      <div className="space-y-1.5">
                        <div className="text-[10.5px] font-mono text-zinc-400 flex items-center justify-between">
                          <span>Sequential Steps ({wf.steps.length}):</span>
                          {wf.lastExecutedAt && (
                            <span className="text-zinc-500">
                              Last run: {new Date(wf.lastExecutedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {wf.steps.map((step) => (
                            <div
                              key={step.id}
                              className="px-2.5 py-1.5 bg-zinc-950/60 border border-white/5 rounded-lg text-xs flex items-center justify-between text-zinc-300"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono text-[10px] text-amber-400 font-bold">
                                  #{step.order}
                                </span>
                                <span className="truncate text-[11.5px]">{step.title}</span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500 shrink-0 ml-2 uppercase">
                                {step.actionType.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-4">
                      <div className="text-[10.5px] font-mono text-zinc-500">
                        {wf.executionCount || 0} run(s) recorded
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingWorkflow(JSON.parse(JSON.stringify(wf)));
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                          title="Edit Workflow Steps"
                        >
                          <Edit3 size={13} />
                        </button>

                        <button
                          onClick={() => handleDuplicateWorkflow(wf)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                          title="Duplicate Workflow"
                        >
                          <Copy size={13} />
                        </button>

                        <button
                          onClick={() => handleDeleteWorkflow(wf.id, wf.name)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Delete Workflow"
                        >
                          <Trash2 size={13} />
                        </button>

                        <button
                          onClick={() => handleRunWorkflow(wf)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                        >
                          <Play size={12} /> Run Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: CONVERSATIONAL TEACHING PLAYGROUND */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'teach' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="p-6 bg-zinc-900/80 border border-amber-500/30 rounded-3xl space-y-4 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
                <Sparkles size={20} /> Teach Aether Reusable Workflows by Conversation
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Describe the workflow naturally. Aether automatically decomposes natural phrases into deterministic multi-step pipelines with triggers, aliases, and desktop capabilities.
              </p>

              {/* Natural Language Prompt Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Instruction Prompt:
                </label>
                <textarea
                  rows={3}
                  value={conversationalInput}
                  onChange={(e) => handleParseConversational(e.target.value)}
                  placeholder="e.g. When I say start coding, open my active project in VS Code, open Terminal there, open GitHub, and start my coding workspace."
                  className="w-full p-3 bg-black/60 border border-white/15 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 font-sans custom-scrollbar"
                />
              </div>

              {/* Quick Presets / Starters */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-zinc-500">Try these conversational examples:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "When I say start coding, open my active project in VS Code, open Terminal there, open GitHub, and start my coding workspace.",
                    "When I say morning setup, open DevSpace, show what needs my attention, open my current project, and show recent GitHub activity.",
                    "Teach Aether: when I say research and note, conduct deep research on modern web architecture, create a structured note with findings, and create a follow-up task."
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => handleParseConversational(example)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-[11px] transition-colors border border-white/5 text-left cursor-pointer"
                    >
                      "{example.slice(0, 52)}..."
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Parsed Preview */}
              {teachParsedResult && teachParsedResult.isTeachRequest && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-amber-300 flex items-center gap-2">
                        <span>Workflow: {teachParsedResult.name}</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-300">
                        Trigger: <strong className="text-amber-200">"{teachParsedResult.triggerPhrase}"</strong>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveTaughtWorkflow}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30"
                    >
                      <Check size={14} /> Save & Learn Workflow
                    </button>
                  </div>

                  {/* Aliases Preview */}
                  {teachParsedResult.aliases && teachParsedResult.aliases.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-mono text-zinc-400">Suggested Aliases:</span>
                      {teachParsedResult.aliases.map((a: string) => (
                        <span key={a} className="px-2 py-0.5 bg-black/40 text-amber-200 rounded text-[10px] font-mono">
                          "{a}"
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Steps Preview */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-mono text-zinc-400">
                      Parsed Pipeline ({teachParsedResult.steps?.length || 0} Steps):
                    </div>
                    {teachParsedResult.steps?.map((step: any) => (
                      <div
                        key={step.id}
                        className="p-2 bg-black/50 border border-white/5 rounded-xl text-xs flex items-center justify-between text-zinc-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-bold">#{step.order}</span>
                          <span>{step.title}</span>
                          {step.isMachineSpecific && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                              Desktop
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          {step.actionType}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: RUN HISTORY & AUDIT LOGS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-200">Execution Audit Log ({history.length})</h3>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all workflow run history?')) {
                      aetherWorkflowEngine.clearExecutionHistory();
                      setHistory([]);
                      showToast?.('History cleared', 'info');
                    }
                  }}
                  className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/30 border border-white/5 rounded-2xl text-xs text-zinc-500">
                No workflow execution runs recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((run) => (
                  <div
                    key={run.runId}
                    className="p-4 bg-zinc-900/60 border border-white/10 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm">{run.workflowName}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                            run.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : run.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-zinc-700 text-zinc-300 border-zinc-600'
                          }`}
                        >
                          {run.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                          Source: {run.triggerSource}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-3">
                        <span>{new Date(run.startedAt).toLocaleString()}</span>
                        <span>{(run.durationMs / 1000).toFixed(2)}s duration</span>
                      </div>
                    </div>

                    {/* Step Breakdown */}
                    <div className="space-y-1.5 pt-1">
                      {run.stepResults.map((res) => (
                        <div
                          key={res.stepId}
                          className="px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {res.status === 'completed' ? (
                                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                              ) : res.status === 'failed' ? (
                                <XCircle size={13} className="text-rose-400 shrink-0" />
                              ) : (
                                <Clock size={13} className="text-zinc-500 shrink-0" />
                              )}
                              <span className="text-zinc-200 font-medium">
                                Step {res.order}: {res.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500">{res.durationMs}ms</span>
                          </div>

                          {res.output && (
                            <div className="text-[10.5px] font-mono text-emerald-300 bg-emerald-950/20 p-1.5 rounded border border-emerald-500/10 break-all">
                              {typeof res.output === 'object' ? JSON.stringify(res.output) : String(res.output)}
                            </div>
                          )}

                          {res.error && (
                            <div className="text-[10.5px] font-mono text-rose-300 bg-rose-950/30 p-1.5 rounded border border-rose-500/20">
                              ❌ {res.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {run.failureReason && (
                      <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-mono">
                        Failure Diagnostic: {run.failureReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: WORKFLOW FULL EDITOR */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isEditorOpen && editingWorkflow && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-zinc-900 border border-white/15 rounded-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl text-zinc-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Edit Teachable Workflow</h3>
                    <p className="text-xs text-zinc-400 font-mono">Configure triggers, aliases, and sequential steps</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400">Workflow Name:</label>
                    <input
                      type="text"
                      value={editingWorkflow.name}
                      onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400">Primary Voice / Text Trigger Phrase:</label>
                    <input
                      type="text"
                      value={editingWorkflow.triggerPhrase}
                      onChange={(e) => setEditingWorkflow({ ...editingWorkflow, triggerPhrase: e.target.value.toLowerCase() })}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500/50"
                      placeholder="e.g. start coding"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-400">Description:</label>
                  <input
                    type="text"
                    value={editingWorkflow.description}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Aliases Tag Manager */}
                <div className="space-y-2 p-3 bg-black/30 border border-white/5 rounded-2xl">
                  <label className="text-xs font-mono text-zinc-400">Workflow Aliases & Trigger Variations:</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingWorkflow.aliases?.map((alias) => (
                      <span
                        key={alias}
                        className="px-2 py-1 bg-white/10 text-zinc-200 rounded-lg text-xs font-mono flex items-center gap-1.5"
                      >
                        "{alias}"
                        <button
                          onClick={() => handleRemoveAliasFromEditor(alias)}
                          className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}

                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Add alias (e.g. coding mode)..."
                        value={newAliasInput}
                        onChange={(e) => setNewAliasInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAliasToEditor()}
                        className="px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-xs text-zinc-100 w-44 focus:outline-none"
                      />
                      <button
                        onClick={handleAddAliasToEditor}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-zinc-200 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Steps Manager */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider">
                      Sequential Execution Steps ({editingWorkflow.steps.length}):
                    </label>
                    <button
                      onClick={handleAddStepToEditor}
                      className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Add Step
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {editingWorkflow.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center justify-center">
                              {step.order}
                            </span>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => handleUpdateStepInEditor(step.id, { title: e.target.value })}
                              className="px-2 py-1 bg-zinc-800/80 border border-white/10 rounded-lg text-xs text-zinc-100 font-medium focus:outline-none w-64"
                              placeholder="Step title"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveStep(idx, 'up')}
                              className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-zinc-300 cursor-pointer"
                              title="Move Step Up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              disabled={idx === editingWorkflow.steps.length - 1}
                              onClick={() => handleMoveStep(idx, 'down')}
                              className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded text-zinc-300 cursor-pointer"
                              title="Move Step Down"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteStepFromEditor(step.id)}
                              className="p-1 bg-rose-500/10 hover:bg-rose-500/20 rounded text-rose-300 cursor-pointer ml-1"
                              title="Delete Step"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Step Details Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 block mb-0.5">Action Type:</span>
                            <select
                              value={step.actionType}
                              onChange={(e) => handleUpdateStepInEditor(step.id, { actionType: e.target.value as any })}
                              className="w-full px-2 py-1 bg-zinc-850 border border-white/10 rounded-lg text-zinc-200 text-xs focus:outline-none"
                            >
                              <option value="open_project">Open Project</option>
                              <option value="open_app">Launch Desktop App (VS Code / Terminal / App)</option>
                              <option value="start_coding_workspace">Start Coding Workspace</option>
                              <option value="navigate_route">Navigate DevSpace Route</option>
                              <option value="github_activity">Show GitHub Activity & PRs</option>
                              <option value="attention_summary">Show What Needs Attention</option>
                              <option value="research">Deep Web & Tech Research</option>
                              <option value="create_note">Create Cognitive Note</option>
                              <option value="create_issue">Create Task Issue</option>
                              <option value="run_command">Execute Terminal Command</option>
                              <option value="open_url">Open Web Link</option>
                            </select>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 block mb-0.5">Target / Parameter:</span>
                            <input
                              type="text"
                              value={step.target}
                              onChange={(e) => handleUpdateStepInEditor(step.id, { target: e.target.value })}
                              placeholder="e.g. Visual Studio Code, /github, {{activeProject.name}}"
                              className="w-full px-2 py-1 bg-zinc-850 border border-white/10 rounded-lg text-zinc-200 text-xs font-mono focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Step Checkboxes */}
                        <div className="flex items-center gap-4 pt-1 text-[11px] text-zinc-400">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!step.requiresConfirmation}
                              onChange={(e) => handleUpdateStepInEditor(step.id, { requiresConfirmation: e.target.checked, isDestructive: e.target.checked })}
                              className="accent-amber-500 rounded"
                            />
                            <span>Require Confirmation</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!step.isMachineSpecific}
                              onChange={(e) => handleUpdateStepInEditor(step.id, { isMachineSpecific: e.target.checked })}
                              className="accent-amber-500 rounded"
                            />
                            <span>Desktop Local Path</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!step.passOutputToNext}
                              onChange={(e) => handleUpdateStepInEditor(step.id, { passOutputToNext: e.target.checked })}
                              className="accent-amber-500 rounded"
                            />
                            <span>Pass Output to Next Step</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditor}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Check size={14} /> Save Workflow
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: LIVE EXECUTION PROGRESS & CONFIRMATION HUD */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isExecutionModalOpen && liveExecutionProgress && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-900 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-2xl text-zinc-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                    <Sparkles size={16} className={liveExecutionProgress.status === 'running' ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      {liveExecutionProgress.workflowName}
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          liveExecutionProgress.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : liveExecutionProgress.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : liveExecutionProgress.status === 'cancelled'
                            ? 'bg-zinc-700 text-zinc-300 border-zinc-600'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        }`}
                      >
                        {liveExecutionProgress.status.toUpperCase()}
                      </span>
                    </h4>
                    <p className="text-[11px] font-mono text-zinc-400">
                      Step {liveExecutionProgress.currentStepIndex + 1} of {liveExecutionProgress.totalSteps}
                    </p>
                  </div>
                </div>

                {liveExecutionProgress.status === 'running' && (
                  <button
                    onClick={() => {
                      aetherWorkflowEngine.cancelCurrentWorkflow();
                    }}
                    className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X size={12} /> Cancel Run
                  </button>
                )}
              </div>

              {/* Confirmation Gate for High-Risk Steps */}
              {liveExecutionProgress.status === 'waiting_confirmation' && liveExecutionProgress.pendingConfirmation && (
                <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <ShieldAlert size={16} /> User Confirmation Required
                  </div>
                  <p className="text-xs text-zinc-200">
                    Aether is preparing to execute: <strong>"{liveExecutionProgress.pendingConfirmation.stepTitle}"</strong>
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono bg-black/40 p-2 rounded-lg">
                    {liveExecutionProgress.pendingConfirmation.reason}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => aetherWorkflowEngine.resolveConfirmation(true)}
                      className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <CheckCircle2 size={13} /> Confirm & Proceed
                    </button>
                    <button
                      onClick={() => aetherWorkflowEngine.resolveConfirmation(false)}
                      className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-zinc-300 rounded-xl text-xs cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Steps Progress List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {liveExecutionProgress.stepResults.map((res) => (
                  <div
                    key={res.stepId}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      res.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                        : res.status === 'failed'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                        : res.status === 'running'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-200 ring-1 ring-amber-500/30'
                        : 'bg-zinc-950/40 border-white/5 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {res.status === 'completed' ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        ) : res.status === 'failed' ? (
                          <XCircle size={14} className="text-rose-400 shrink-0" />
                        ) : res.status === 'running' ? (
                          <Play size={13} className="text-amber-400 animate-pulse shrink-0" />
                        ) : (
                          <Clock size={13} className="text-zinc-500 shrink-0" />
                        )}
                        <span className="font-semibold text-[11.5px]">
                          Step {res.order}: {res.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 capitalize">
                        {res.status}
                      </span>
                    </div>

                    {res.output && (
                      <div className="mt-1.5 ml-5 text-[10.5px] font-mono text-emerald-300 bg-emerald-950/20 p-1.5 rounded border border-emerald-500/10 break-all">
                        {typeof res.output === 'object' ? JSON.stringify(res.output) : String(res.output)}
                      </div>
                    )}

                    {res.error && (
                      <div className="mt-1.5 ml-5 text-[10.5px] font-mono text-rose-300 bg-rose-950/30 p-1.5 rounded border border-rose-500/20">
                        ❌ {res.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dismiss / Close Button when finished */}
              {liveExecutionProgress.status !== 'running' && liveExecutionProgress.status !== 'waiting_confirmation' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsExecutionModalOpen(false)}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
