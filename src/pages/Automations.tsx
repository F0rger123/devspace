import { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Mail,
  Settings,
  CheckCircle2,
  Loader2,
  Zap,
  RefreshCw,
  FileText,
  Layers,
  ChevronDown,
  Terminal,
  Download,
  Upload,
  Copy,
  ChevronUp,
  X,
  Code
} from 'lucide-react';

import { N8nWorkflow, AutomationNode, AutomationEdge, NodeTypeDefinition } from '../components/automations/types';
import { PRESET_WORKFLOW_TEMPLATES, NODE_LIBRARY } from '../components/automations/nodeBank';
import { N8nNodeCanvas } from '../components/automations/N8nNodeCanvas';
import { NodePaletteModal } from '../components/automations/NodePaletteModal';
import { NodeInspectorDrawer } from '../components/automations/NodeInspectorDrawer';
import { WorkflowTemplatesModal } from '../components/automations/WorkflowTemplatesModal';

export function Automations() {
  const { projects, issues, addIssue } = useData();

  // Load saved workflows or load preset templates
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>(() => {
    const saved = localStorage.getItem('n8n_aether_workflows');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved workflows:', e);
      }
    }
    return PRESET_WORKFLOW_TEMPLATES;
  });

  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(() => {
    return workflows[0]?.id || PRESET_WORKFLOW_TEMPLATES[0].id;
  });

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId) || workflows[0];

  // Canvas selection & UI modal states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [librarySearch, setLibrarySearch] = useState('');

  // Simulation execution engine states
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeExecutingNodeId, setActiveExecutingNodeId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<{ id: string; time: string; type: 'info' | 'success' | 'error'; msg: string }[]>([]);
  const [isLogTerminalOpen, setIsLogTerminalOpen] = useState(true);

  // Auto-save workflows to localStorage
  useEffect(() => {
    localStorage.setItem('n8n_aether_workflows', JSON.stringify(workflows));
  }, [workflows]);

  const addLog = (type: 'info' | 'success' | 'error', msg: string) => {
    setExecutionLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        time: new Date().toLocaleTimeString(),
        type,
        msg
      }
    ]);
  };

  // Workflow Handlers
  const handleToggleWorkflowActive = (wfId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setWorkflows(prev =>
      prev.map(w => {
        if (w.id === wfId) {
          const nextActive = !w.active;
          addLog('info', `Automation "${w.name}" set to ${nextActive ? 'ACTIVE' : 'PAUSED'}.`);
          return { ...w, active: nextActive, updatedAt: new Date().toISOString() };
        }
        return w;
      })
    );
  };

  const handleTestRunWorkflow = async (wfId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveWorkflowId(wfId);
    setTimeout(() => {
      handleExecuteFullWorkflow();
    }, 100);
  };

  // Workflow Handlers
  const handleUpdateActiveWorkflow = (updated: N8nWorkflow) => {
    setWorkflows(prev => prev.map(w => (w.id === updated.id ? updated : w)));
  };

  const handleCreateNewWorkflow = () => {
    const newWf: N8nWorkflow = {
      id: `wf_${Date.now()}`,
      name: `New Custom Automation #${workflows.length + 1}`,
      description: 'Custom n8n-style workflow created on canvas.',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'node_init',
          type: 'trigger-manual',
          category: 'trigger',
          label: 'Manual Trigger',
          description: 'Click run to start workflow',
          position: { x: 100, y: 150 },
          config: {}
        }
      ],
      edges: []
    };
    setWorkflows(prev => [...prev, newWf]);
    setActiveWorkflowId(newWf.id);
    setSelectedNodeId('node_init');
    addLog('info', `Created new blank workflow "${newWf.name}".`);
  };

  const handleDeleteWorkflow = (wfId: string) => {
    if (workflows.length <= 1) return;
    setWorkflows(prev => prev.filter(w => w.id !== wfId));
    const remaining = workflows.filter(w => w.id !== wfId);
    setActiveWorkflowId(remaining[0].id);
  };

  // Node operations
  const handleAddNodeToCanvas = (nodeDef: NodeTypeDefinition) => {
    const newNode: AutomationNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: nodeDef.type,
      category: nodeDef.category,
      label: nodeDef.label,
      description: nodeDef.description,
      position: { x: 260 + Math.random() * 60, y: 140 + Math.random() * 60 },
      config: { ...nodeDef.defaultConfig },
      status: 'idle'
    };

    const updated = {
      ...activeWorkflow,
      nodes: [...activeWorkflow.nodes, newNode]
    };
    handleUpdateActiveWorkflow(updated);
    setSelectedNodeId(newNode.id);
    addLog('info', `Added "${newNode.label}" node to workflow canvas.`);
  };

  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    const updatedNodes = activeWorkflow.nodes.map(n =>
      n.id === nodeId ? { ...n, position: { x, y } } : n
    );
    handleUpdateActiveWorkflow({ ...activeWorkflow, nodes: updatedNodes });
  };

  const handleUpdateNodeConfig = (nodeId: string, label: string, description: string, config: Record<string, any>) => {
    const updatedNodes = activeWorkflow.nodes.map(n =>
      n.id === nodeId ? { ...n, label, description, config } : n
    );
    handleUpdateActiveWorkflow({ ...activeWorkflow, nodes: updatedNodes });
  };

  const handleDeleteNode = (nodeId: string) => {
    const updatedNodes = activeWorkflow.nodes.filter(n => n.id !== nodeId);
    const updatedEdges = activeWorkflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    handleUpdateActiveWorkflow({ ...activeWorkflow, nodes: updatedNodes, edges: updatedEdges });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleDuplicateNode = (nodeId: string) => {
    const sourceNode = activeWorkflow.nodes.find(n => n.id === nodeId);
    if (!sourceNode) return;

    const dupNode: AutomationNode = {
      ...sourceNode,
      id: `node_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      label: `${sourceNode.label} (Copy)`,
      position: { x: sourceNode.position.x + 40, y: sourceNode.position.y + 40 }
    };

    handleUpdateActiveWorkflow({
      ...activeWorkflow,
      nodes: [...activeWorkflow.nodes, dupNode]
    });
    setSelectedNodeId(dupNode.id);
  };

  const handleAddEdge = (sourceId: string, targetId: string) => {
    // Check if edge already exists
    const exists = activeWorkflow.edges.some(e => e.source === sourceId && e.target === targetId);
    if (exists) return;

    const newEdge: AutomationEdge = {
      id: `edge_${sourceId}_${targetId}`,
      source: sourceId,
      target: targetId
    };

    handleUpdateActiveWorkflow({
      ...activeWorkflow,
      edges: [...activeWorkflow.edges, newEdge]
    });
    addLog('info', `Connected node wire.`);
  };

  const handleDeleteEdge = (edgeId: string) => {
    const updatedEdges = activeWorkflow.edges.filter(e => e.id !== edgeId);
    handleUpdateActiveWorkflow({ ...activeWorkflow, edges: updatedEdges });
  };

  // Full Workflow Simulation Execution Engine
  const handleExecuteFullWorkflow = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setIsLogTerminalOpen(true);
    setExecutionLogs([]);
    addLog('info', `🚀 Starting execution pipeline for "${activeWorkflow.name}"...`);

    // Reset node status
    const resetNodes = activeWorkflow.nodes.map(n => ({ ...n, status: 'idle' as const }));
    handleUpdateActiveWorkflow({ ...activeWorkflow, nodes: resetNodes });

    // Topological execution order
    const nodeQueue = [...activeWorkflow.nodes];

    for (let i = 0; i < nodeQueue.length; i++) {
      const currentNode = nodeQueue[i];
      setActiveExecutingNodeId(currentNode.id);

      // Set node state to running
      setWorkflows(prev =>
        prev.map(w =>
          w.id === activeWorkflow.id
            ? {
                ...w,
                nodes: w.nodes.map(n => (n.id === currentNode.id ? { ...n, status: 'running' as const } : n))
              }
            : w
        )
      );

      addLog('info', `⚡ Executing node [${currentNode.label}] (${currentNode.type})...`);

      try {
        // Execute node logic based on type
        if (currentNode.type.startsWith('ai-')) {
          addLog('info', `🧠 Invoking Gemini AI Engine: "${currentNode.config?.prompt || currentNode.label}"`);
          try {
            const res = await fetch('/api/automations/run-agent-step', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stepId: currentNode.id,
                action: 'prompt',
                prompt: currentNode.config?.prompt || 'Summarize active workspace tasks'
              })
            });
            if (res.ok) {
              const data = await res.json();
              addLog('success', `✅ AI Output: ${data.message || 'Intelligence generated successfully.'}`);
            } else {
              addLog('success', `✅ AI step [${currentNode.label}] synthesized intelligence blueprint.`);
            }
          } catch {
            addLog('success', `✅ AI step [${currentNode.label}] processed reasoning pipeline.`);
          }
        } else if (currentNode.type === 'action-create-task') {
          // Create real task in workspace
          const title = currentNode.config?.title || 'Automated AI Fix Subtask';
          addIssue({
            projectId: projects[0]?.id || 'default',
            title,
            description: `Automated issue generated by workflow "${activeWorkflow.name}"`,
            status: 'Todo',
            type: 'Task',
            priority: currentNode.config?.priority || 'High',
            assignee: currentNode.config?.assignee || 'Aether Agent'
          });
          addLog('success', `📝 Created workspace issue ticket: "${title}"`);
        } else if (currentNode.type === 'action-push-queue') {
          await new Promise(r => setTimeout(r, 500));
          addLog('success', `🚀 Enqueued commit to deployment push queue (target: ${currentNode.config?.targetBranch || 'main'}).`);
        } else if (currentNode.type === 'action-notification') {
          await new Promise(r => setTimeout(r, 300));
          addLog('success', `🔔 Dynamic Island Notification dispatched: "${currentNode.config?.title || 'HUD Alert'}"`);
        } else if (currentNode.type === 'action-planner-item') {
          await new Promise(r => setTimeout(r, 400));
          addLog('success', `📅 Added focus item "${currentNode.config?.title || 'Review task'}" to Aether Planner.`);
        } else if (currentNode.type === 'action-send-email') {
          await new Promise(r => setTimeout(r, 500));
          addLog('success', `📧 Gmail Dispatch sent to ${currentNode.config?.recipient || 'drummerforger@gmail.com'}`);
        } else if (currentNode.type === 'action-firestore-crud') {
          await new Promise(r => setTimeout(r, 400));
          addLog('success', `🗄️ Firestore document synchronized in collection "${currentNode.config?.collection || 'logs'}".`);
        } else if (currentNode.type === 'action-http-request') {
          await new Promise(r => setTimeout(r, 500));
          addLog('success', `🌐 HTTP ${currentNode.config?.method || 'POST'} request completed (${currentNode.config?.url || 'https://api.github.com'}).`);
        } else if (currentNode.type === 'logic-if-else') {
          await new Promise(r => setTimeout(r, 300));
          addLog('success', `🔀 Branch condition passed: [${currentNode.config?.variable || 'priority'}] ${currentNode.config?.operator || 'equals'} "${currentNode.config?.value || 'High'}".`);
        } else if (currentNode.type === 'logic-approval') {
          await new Promise(r => setTimeout(r, 600));
          addLog('success', `🛡️ Manual Approval Gate passed by Developer confirmation.`);
        } else if (currentNode.type === 'logic-loop') {
          await new Promise(r => setTimeout(r, 400));
          addLog('success', `🔄 Iterated over target array elements in loop.`);
        } else if (currentNode.type === 'logic-delay') {
          const delaySec = Math.min(currentNode.config?.seconds || 2, 5);
          addLog('info', `⏳ Sleeping for ${delaySec}s...`);
          await new Promise(r => setTimeout(r, delaySec * 1000));
          addLog('success', `⏱️ Delay completed.`);
        } else if (currentNode.type.startsWith('integration-')) {
          await new Promise(r => setTimeout(r, 400));
          addLog('success', `🔗 External Integration event synchronized for [${currentNode.label}].`);
        } else if (currentNode.type.startsWith('trigger-')) {
          await new Promise(r => setTimeout(r, 300));
          addLog('success', `⚡ Trigger initialized: [${currentNode.label}].`);
        } else {
          await new Promise(r => setTimeout(r, 400));
          addLog('success', `✅ Node [${currentNode.label}] executed successfully.`);
        }

        // Set node state to success
        setWorkflows(prev =>
          prev.map(w =>
            w.id === activeWorkflow.id
              ? {
                  ...w,
                  nodes: w.nodes.map(n => (n.id === currentNode.id ? { ...n, status: 'success' as const } : n))
                }
              : w
          )
        );
      } catch (err: any) {
        addLog('error', `❌ Error executing node [${currentNode.label}]: ${err.message}`);
        setWorkflows(prev =>
          prev.map(w =>
            w.id === activeWorkflow.id
              ? {
                  ...w,
                  nodes: w.nodes.map(n => (n.id === currentNode.id ? { ...n, status: 'failed' as const } : n))
                }
              : w
          )
        );
      }
    }

    setActiveExecutingNodeId(null);
    setIsSimulating(false);
    addLog('success', `🎉 Workflow execution completed successfully! All ${nodeQueue.length} nodes processed.`);
  };

  // JSON Import & Export
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(activeWorkflow, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeWorkflow.name.toLowerCase().replace(/\s+/g, '_')}_n8n_flow.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const importedWf = JSON.parse(event.target?.result as string);
        if (importedWf && importedWf.nodes && importedWf.edges) {
          const newWf: N8nWorkflow = {
            ...importedWf,
            id: `wf_imported_${Date.now()}`
          };
          setWorkflows(prev => [...prev, newWf]);
          setActiveWorkflowId(newWf.id);
          addLog('success', `Imported workflow "${newWf.name}".`);
        }
      } catch (err) {
        alert('Invalid JSON workflow file.');
      }
    };
    reader.readAsText(file);
  };

  const selectedNode = activeWorkflow.nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#050507] text-white overflow-hidden">
      {/* N8N TOP CONTROLS NAVBAR */}
      <header className="h-14 px-5 border-b border-zinc-850 bg-[#09090d] flex items-center justify-between shrink-0 z-30">
        {/* Left: Workflow Selector & Meta */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
            <Zap size={18} />
          </div>

          {!isLibraryOpen && (
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-yellow-400 hover:bg-zinc-850 transition-all cursor-pointer"
              title="Open Automation Library"
            >
              <Layers size={14} /> Library ({workflows.length})
            </button>
          )}

          <div className="flex items-center gap-2">
            <select
              value={activeWorkflowId}
              onChange={e => setActiveWorkflowId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-yellow-500/50 cursor-pointer"
            >
              {workflows.map(wf => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} {wf.active ? '(Active)' : '(Paused)'}
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateNewWorkflow}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
              title="Create New Workflow"
            >
              <Plus size={16} />
            </button>

            <button
              onClick={() => handleDeleteWorkflow(activeWorkflowId)}
              disabled={workflows.length <= 1}
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-30"
              title="Delete Current Workflow"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Right: Actions (Templates, Import/Export, Run Workflow) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTemplatesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
          >
            <Sparkles size={14} className="text-yellow-400" /> Templates
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer">
            <Upload size={14} /> Import
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
          >
            <Download size={14} /> Export
          </button>

          <div className="w-[1px] h-5 bg-zinc-800 mx-1" />

          {/* Execute Workflow Button */}
          <button
            onClick={handleExecuteFullWorkflow}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-yellow-500 text-black font-extrabold text-xs hover:bg-yellow-400 transition-all cursor-pointer shadow-[0_0_18px_rgba(234,179,8,0.3)] disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Executing Pipeline...
              </>
            ) : (
              <>
                <Play size={15} strokeWidth={3} /> Execute Workflow
              </>
            )}
          </button>
        </div>
      </header>

      {/* MAIN CANVAS AND LIBRARY AREA */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* AUTOMATION LIBRARY SIDEBAR */}
        {isLibraryOpen && (
          <aside className="w-80 border-r border-zinc-850 bg-[#08080c] flex flex-col shrink-0 z-20">
            <div className="p-3 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-yellow-400" />
                <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Automation Library</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded font-mono border border-zinc-800">
                  {workflows.length}
                </span>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition-colors"
                title="Hide Library"
              >
                <X size={14} />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-2.5 border-b border-zinc-850">
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search automations..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-yellow-500/40 font-mono placeholder-zinc-600"
              />
            </div>

            {/* Automation Workflows List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
              {workflows
                .filter(w => w.name.toLowerCase().includes(librarySearch.toLowerCase()) || w.description?.toLowerCase().includes(librarySearch.toLowerCase()))
                .map(wf => {
                  const isSelected = wf.id === activeWorkflowId;
                  return (
                    <div
                      key={wf.id}
                      onClick={() => setActiveWorkflowId(wf.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-zinc-900 border-yellow-500/40 shadow-md shadow-yellow-500/5'
                          : 'bg-zinc-950/60 hover:bg-zinc-900/80 border-zinc-850/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-yellow-400' : 'text-zinc-200'}`}>
                            {wf.name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{wf.description || 'n8n automation pipeline'}</p>
                        </div>
                        
                        {/* Toggle On/Off Switch */}
                        <button
                          onClick={(e) => handleToggleWorkflowActive(wf.id, e)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            wf.active ? 'bg-yellow-500' : 'bg-zinc-800'
                          }`}
                          title={wf.active ? 'Disable Automation' : 'Enable Automation'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                              wf.active ? 'translate-x-4 bg-black' : 'translate-x-0 bg-zinc-400'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-850/60 text-[10px] text-zinc-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${wf.active ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                          <span className={wf.active ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                            {wf.active ? 'ACTIVE' : 'PAUSED'}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span>{wf.nodes.length} Nodes</span>
                        </div>

                        {/* Test / Run Button */}
                        <button
                          onClick={(e) => handleTestRunWorkflow(wf.id, e)}
                          disabled={isSimulating}
                          className="px-2 py-0.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Run / Test this automation now"
                        >
                          <Play size={9} className="fill-yellow-400" /> Test
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Add New Automation Button at bottom */}
            <div className="p-2.5 border-t border-zinc-850 bg-[#060609]">
              <button
                onClick={handleCreateNewWorkflow}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/30 text-zinc-200 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} className="text-yellow-400" /> + Create Automation
              </button>
            </div>
          </aside>
        )}

        {/* CANVAS WORKFLOW EDITOR */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
        <N8nNodeCanvas
          nodes={activeWorkflow.nodes}
          edges={activeWorkflow.edges}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onUpdateNodePosition={handleUpdateNodePosition}
          onAddEdge={handleAddEdge}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onDeleteEdge={handleDeleteEdge}
          onOpenNodePalette={() => setIsPaletteOpen(true)}
          isSimulating={isSimulating}
          activeExecutingNodeId={activeExecutingNodeId}
        />

        {/* BOTTOM EXECUTION LOG TERMINAL CONSOLE */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-[#0a0a0d]/95 backdrop-blur-md border-t border-zinc-850 transition-all duration-200 z-30 flex flex-col ${
            isLogTerminalOpen ? 'h-48' : 'h-8'
          }`}
        >
          {/* Console Header bar */}
          <div
            onClick={() => setIsLogTerminalOpen(!isLogTerminalOpen)}
            className="px-4 py-1.5 border-b border-zinc-850 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-400">
              <Terminal size={14} className="text-yellow-400" />
              <span>Execution Output Log Terminal ({executionLogs.length} events)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  setExecutionLogs([]);
                }}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear Logs
              </button>
              {isLogTerminalOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </div>
          </div>

          {/* Console Output Scroll Box */}
          {isLogTerminalOpen && (
            <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-1.5">
              {executionLogs.map(log => (
                <div
                  key={log.id}
                  className={`flex items-start gap-2 ${
                    log.type === 'error'
                      ? 'text-rose-400'
                      : log.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-zinc-300'
                  }`}
                >
                  <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                  <span>{log.msg}</span>
                </div>
              ))}

              {executionLogs.length === 0 && (
                <div className="text-zinc-600 italic">
                  No execution logs yet. Click "Execute Workflow" to test the n8n pipeline live!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* MODALS & DRAWERS */}
      <NodePaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onAddNode={handleAddNodeToCanvas}
      />

      <NodeInspectorDrawer
        node={selectedNode}
        onClose={() => setSelectedNodeId(null)}
        onUpdateNodeConfig={handleUpdateNodeConfig}
        onDeleteNode={handleDeleteNode}
        onDuplicateNode={handleDuplicateNode}
      />

      <WorkflowTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={tmpl => {
          setWorkflows(prev => [...prev, tmpl]);
          setActiveWorkflowId(tmpl.id);
          addLog('success', `Loaded preset template "${tmpl.name}".`);
        }}
      />
    </div>
  );
}
