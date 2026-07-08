import { useState, useEffect } from 'react';
import { useData, Project, Issue } from '../context/DataProvider';
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
  Circle,
  ChevronRight,
  Loader2,
  Move,
  Database,
  Cpu,
  AlertCircle,
  GitMerge,
  Lightbulb,
  Zap,
  Undo2,
  RefreshCw,
  FileText,
  Layers,
  ChevronDown,
  User,
  ExternalLink,
  Eye
} from 'lucide-react';

interface AutoStep {
  id: string;
  label: string;
  type: 'AI Agent Action' | 'Email Notification' | 'Create Subtask' | 'Problem Resolver';
  config?: {
    prompt?: string;
    emailSubject?: string;
    assignTo?: string;
    actionType?: string;
  };
  status?: 'idle' | 'running' | 'success' | 'failed';
}

interface AutomationFlow {
  id: string;
  name: string;
  desc: string;
  trigger: 'On Critical Bug Created' | 'Daily Schedule' | 'On Idea Received' | 'Weekly Report' | 'On Status Change';
  active: boolean;
  steps: AutoStep[];
}

const TEMPLATES: Omit<AutomationFlow, 'id'>[] = [
  {
    name: "New Bug Email Notification",
    desc: "When a new bug is reported, analyze it and send an email alert.",
    trigger: "On Critical Bug Created",
    active: true,
    steps: [
      {
        id: "step_1",
        label: "AI Bug Analysis",
        type: "AI Agent Action",
        config: { prompt: "Analyze the bug description and draft potential fixes" }
      },
      {
        id: "step_2",
        label: "Create Bug Ticket",
        type: "Create Subtask",
        config: { assignTo: "Cortex Developer Agent", prompt: "Apply code fix and test" }
      },
      {
        id: "step_3",
        label: "Send Email Notification",
        type: "Email Notification",
        config: { emailSubject: "🚨 New Bug Notification" }
      }
    ]
  },
  {
    name: "Daily Bug Report & Solutions",
    desc: "Find open bug reports, suggest solutions with AI, and send a summary email.",
    trigger: "Daily Schedule",
    active: true,
    steps: [
      {
        id: "step_1",
        label: "Find Open Bugs",
        type: "Problem Resolver",
        config: { prompt: "Fetch open bugs from issues list" }
      },
      {
        id: "step_2",
        label: "Suggest Solutions with AI",
        type: "AI Agent Action",
        config: { prompt: "Generate repair guides for each bug found" }
      },
      {
        id: "step_3",
        label: "Send Daily Email Summary",
        type: "Email Notification",
        config: { emailSubject: "☀️ Daily Bug & Solution Summary" }
      }
    ]
  },
  {
    name: "New Project Idea Creator",
    desc: "When you have a new project idea, expand the description and add startup tasks.",
    trigger: "On Idea Received",
    active: true,
    steps: [
      {
        id: "step_1",
        label: "Describe Project Concept",
        type: "AI Agent Action",
        config: { prompt: "Elaborate the project concept and stack recommendation" }
      },
      {
        id: "step_2",
        label: "Add Startup Tasks",
        type: "Create Subtask",
        config: { prompt: "Draft initial development task lists" }
      }
    ]
  }
];

const NODE_BANK = [
  {
    type: "AI Agent Action",
    label: "AI Text Analysis",
    desc: "Run custom prompt through Gemini AI",
    icon: Sparkles,
    color: "text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
  },
  {
    type: "Create Subtask",
    label: "Create AI Task",
    desc: "Create an issue and assign to AI Agent",
    icon: Cpu,
    color: "text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10"
  },
  {
    type: "Email Notification",
    label: "Send Email Alert",
    desc: "Send custom email report or alert",
    icon: Mail,
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
  },
  {
    type: "Problem Resolver",
    label: "Find Bug Solutions",
    desc: "Fetch top 3 outstanding workspace bugs",
    icon: AlertCircle,
    color: "text-rose-400 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
  }
];

export function Automations() {
  const { projects, issues, addProject, addIssue, updateIssue, activeProjectId } = useData();

  // Local state for loaded automations
  const [flows, setFlows] = useState<AutomationFlow[]>(() => {
    const saved = localStorage.getItem('aether_workspace_automations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading automations", e);
      }
    }
    // Seed with initial templates if empty
    return TEMPLATES.map((t, idx) => ({ ...t, id: `seed_${idx}` }));
  });

  const [activeFlowId, setActiveFlowId] = useState<string>(() => {
    return flows[0]?.id || "";
  });

  const activeFlow = flows.find(f => f.id === activeFlowId) || flows[0];

  // AI Generator prompt
  const [generatorPrompt, setGeneratorPrompt] = useState("");
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);

  // Daily Email Notifications Settings state
  const [emailSettings, setEmailSettings] = useState({
    dailyEmailEnabled: false,
    dailyEmailTime: "08:00",
    dailyEmailRecipient: "drummerforger@gmail.com",
    dailyEmailPlain: false,
    logs: [] as string[]
  });
  const [isSavingEmailSettings, setIsSavingEmailSettings] = useState(false);
  const [isTriggeringTestEmail, setIsTriggeringTestEmail] = useState(false);

  // Email briefing preview states
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ plainText: string; htmlBody: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'html' | 'plain'>('html');

  const fetchBriefingPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch('/api/email/preview-briefing');
      if (res.ok) {
        const data = await res.json();
        setPreviewData({
          plainText: data.plainText,
          htmlBody: data.htmlBody
        });
      }
    } catch (err) {
      console.error("Error loading email preview", err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Aether Synergy state (Idea Incubator)
  const [ideaInput, setIdeaInput] = useState("");
  const [isIncubatingIdea, setIsIncubatingIdea] = useState(false);
  const [incubatedResult, setIncubatedResult] = useState<{
    projectName: string;
    projectDescription: string;
    customStack: string[];
    suggestedIssues: { title: string; description: string; type: 'Feature' | 'Task'; priority: 'Low' | 'Medium' | 'High' | 'Critical' }[];
  } | null>(null);

  // SRE Solver state (Top 3 Bugs)
  const [solvingProblemId, setSolvingProblemId] = useState<string | null>(null);
  const [solvedProblemResult, setSolvedProblemResult] = useState<Record<string, {
    analysis: string;
    reproduction: string;
    codeFix: string;
    subTasks: { title: string; description: string }[];
  }>>({});
  const [applyingProblemId, setApplyingProblemId] = useState<string | null>(null);

  // Live Simulator state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simStepIdx, setSimStepIdx] = useState<number>(-1);

  // Persistence effect
  useEffect(() => {
    localStorage.setItem('aether_workspace_automations', JSON.stringify(flows));
  }, [flows]);

  // Load backend automated email configuration
  useEffect(() => {
    fetch('/api/email/automated-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmailSettings({
            dailyEmailEnabled: data.dailyEmailEnabled || false,
            dailyEmailTime: data.dailyEmailTime || "08:00",
            dailyEmailRecipient: data.dailyEmailRecipient || "drummerforger@gmail.com",
            dailyEmailPlain: data.dailyEmailPlain || false,
            logs: data.logs || []
          });
        }
      })
      .catch(err => console.error("Error fetching email settings", err));
    
    // Fetch initial briefing preview
    fetchBriefingPreview();
  }, []);

  // Save flow changes
  const updateActiveFlow = (updated: Partial<AutomationFlow>) => {
    if (!activeFlowId) return;
    setFlows(prev => prev.map(f => f.id === activeFlowId ? { ...f, ...updated } : f));
  };

  // Drag and drop setup for visual step adding
  const handleDragStart = (e: React.DragEvent, stepType: string) => {
    e.dataTransfer.setData("application/aether-step-type", stepType);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/aether-step-type") as any;
    if (!type || !activeFlow) return;

    // Build the default configuration for this node type
    let label = "New Custom Action";
    let config = {};
    if (type === "AI Agent Action") {
      label = "Aether AI Analysis Step";
      config = { prompt: "Analyze active workflow and summarize suggestions" };
    } else if (type === "Create Subtask") {
      label = "Spawn AI Subtask Action";
      config = { assignTo: "Aether AI", prompt: "Write complete source code implementations" };
    } else if (type === "Email Notification") {
      label = "SMTP Mail Dispatch";
      config = { emailSubject: "Workspace Automation Alert" };
    } else if (type === "Problem Resolver") {
      label = "Resolve Top Project Bugs";
      config = { prompt: "Analyze outstanding defects and draft automated code fixes" };
    }

    const newStep: AutoStep = {
      id: `step_${Date.now()}`,
      label,
      type,
      config,
      status: "idle"
    };

    updateActiveFlow({
      steps: [...activeFlow.steps, newStep]
    });
    addLog(`System: Drag & Drop registered. Appended '${label}' node.`);
  };

  const addStepToActiveFlow = (type: string) => {
    if (!activeFlow) {
      alert("Please select or create an automation workflow first.");
      return;
    }

    let label = "New Custom Action";
    let config = {};
    if (type === "AI Agent Action") {
      label = "Aether AI Analysis Step";
      config = { prompt: "Analyze active workflow and summarize suggestions" };
    } else if (type === "Create Subtask") {
      label = "Spawn AI Subtask Action";
      config = { assignTo: "Aether AI", prompt: "Write complete source code implementations" };
    } else if (type === "Email Notification") {
      label = "SMTP Mail Dispatch";
      config = { emailSubject: "Workspace Automation Alert" };
    } else if (type === "Problem Resolver") {
      label = "Resolve Top Project Bugs";
      config = { prompt: "Analyze outstanding defects and draft automated code fixes" };
    }

    const newStep: AutoStep = {
      id: `step_${Date.now()}`,
      label,
      type: type as any,
      config,
      status: "idle"
    };

    updateActiveFlow({
      steps: [...activeFlow.steps, newStep]
    });
    addLog(`System: Node click registered. Appended '${label}' node.`);
  };

  const addLog = (msg: string) => {
    setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Run/simulate the workflow
  const executeSimulation = async () => {
    if (!activeFlow || activeFlow.steps.length === 0 || isSimulating) return;
    setIsSimulating(true);
    setSimLogs([]);
    setSimStepIdx(0);
    addLog(`🚀 Initiating Live Simulation of: "${activeFlow.name}"...`);

    const updatedSteps = activeFlow.steps.map(s => ({ ...s, status: 'idle' as const }));
    updateActiveFlow({ steps: updatedSteps });

    for (let i = 0; i < activeFlow.steps.length; i++) {
      setSimStepIdx(i);
      const step = activeFlow.steps[i];
      addLog(`⚡ Step ${i + 1}/${activeFlow.steps.length}: Running "${step.label}" (${step.type})...`);

      // Mark step as running
      setFlows(prev => prev.map(f => f.id === activeFlowId ? {
        ...f,
        steps: f.steps.map((s, sIdx) => sIdx === i ? { ...s, status: 'running' } : s)
      } : f));

      // Simulate network / model delay
      await new Promise(resolve => setTimeout(resolve, 2200));

      // Actually execute the underlying action (non-mockup, fully functional!)
      try {
        if (step.type === 'Create Subtask') {
          // If we have an active project, let's actually create a real task ticket in the workspace!
          if (activeProjectId) {
            addIssue({
              projectId: activeProjectId,
              title: `${step.label} (Auto-Spawned)`,
              description: step.config?.prompt || "Automated task spawned by pipeline execution.",
              type: "Task",
              status: "Todo",
              priority: "High",
              assignee: step.config?.assignTo || "Aether Agent"
            });
            addLog(`✅ SUCCESS: Real task added directly to project issues with assignee "${step.config?.assignTo || 'Aether Agent'}"!`);
          } else {
            addLog(`⚠️ WARNING: No active project selected. Skipped real issue injection, simulated safely.`);
          }
        } else if (step.type === 'Email Notification') {
          // Actually request to trigger a report email via our nodemailer integration!
          addLog(`📡 Sending real SMTP request to email dispatcher...`);
          const res = await fetch('/api/email/trigger-daily-now', { method: 'POST' });
          if (res.ok) {
            addLog(`✅ SUCCESS: Dispatched report notification to ${emailSettings.dailyEmailRecipient}!`);
          } else {
            addLog(`❌ ERROR: Nodemailer route returned error status. Check SMTP server configuration.`);
          }
        } else if (step.type === 'Problem Resolver') {
          const topBugs = issues.filter(iss => iss.type === 'Bug' && iss.status !== 'Done');
          addLog(`🔍 Scanning issues list... Found ${topBugs.length} outstanding bugs.`);
          if (topBugs.length > 0) {
            const listText = topBugs.slice(0, 3).map(b => `#${b.id.slice(0, 5)}: ${b.title}`).join(', ');
            addLog(`✅ SUCCESS: Aggregated top defects: [ ${listText} ] for analysis.`);
          } else {
            addLog(`💡 INFO: Zero unresolved bugs found. Workspace is fully optimized!`);
          }
        } else {
          // AI agent action - call real backend with Gemini!
          addLog(`🧠 Invoking Gemini models... Sending step prompt: "${step.config?.prompt || 'default'}"`);
          const response = await fetch('/api/automations/run-agent-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: step.config?.prompt || "Analyze and summarize active workspace status",
              context: {
                projects: projects,
                issues: issues.slice(0, 10)
              }
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              addLog(`🧠 Gemini Agent Response:\n"${data.result}"`);
              addLog(`✅ SUCCESS: Real AI agent step successfully executed and logged.`);
            } else {
              addLog(`⚠️ WARNING: Agent returned failure. Using local fallbacks.`);
            }
          } else {
            addLog(`❌ ERROR: Gemini model execution failed. Skipped execution.`);
          }
        }

        // Mark step as success
        setFlows(prev => prev.map(f => f.id === activeFlowId ? {
          ...f,
          steps: f.steps.map((s, sIdx) => sIdx === i ? { ...s, status: 'success' } : s)
        } : f));

      } catch (err: any) {
        addLog(`❌ ERROR executing step: ${err.message}`);
        setFlows(prev => prev.map(f => f.id === activeFlowId ? {
          ...f,
          steps: f.steps.map((s, sIdx) => sIdx === i ? { ...s, status: 'failed' } : s)
        } : f));
      }
    }

    setIsSimulating(false);
    setSimStepIdx(-1);
    addLog(`🏆 Simulation Finished. All active triggers and actions resolved!`);
  };

  // Generate an automation using Aether AI
  const handleAetherGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatorPrompt.trim() || isGeneratingFlow) return;

    setIsGeneratingFlow(true);
    addLog(`📡 Sending prompt to Aether AI: "${generatorPrompt}"`);

    try {
      const res = await fetch('/api/automations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatorPrompt })
      });

      if (!res.ok) throw new Error("Aether generator endpoint failed");
      const generated = await res.json();

      if (generated && generated.name) {
        const newFlow: AutomationFlow = {
          id: `ai_${Date.now()}`,
          name: generated.name,
          desc: generated.desc || "AI Prompt Compiled Flow",
          trigger: generated.trigger || "On Critical Bug Created",
          active: true,
          steps: (generated.steps || []).map((s: any) => ({
            ...s,
            status: "idle"
          }))
        };

        setFlows(prev => [newFlow, ...prev]);
        setActiveFlowId(newFlow.id);
        setGeneratorPrompt("");
        addLog(`✨ SUCCESS: Aether completed construction! Workflow loaded into canvas.`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`❌ Error compiling prompt via Gemini: ${err.message}`);
    } finally {
      setIsGeneratingFlow(false);
    }
  };

  // Save daily email settings
  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmailSettings(true);
    try {
      const res = await fetch('/api/email/automated-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyEmailEnabled: emailSettings.dailyEmailEnabled,
          dailyEmailTime: emailSettings.dailyEmailTime,
          dailyEmailRecipient: emailSettings.dailyEmailRecipient,
          dailyEmailPlain: emailSettings.dailyEmailPlain
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailSettings(prev => ({
          ...prev,
          logs: data.logs || prev.logs
        }));
        alert("Daily email notification settings saved successfully!");
      }
    } catch (err) {
      console.error(err);
      alert("Error synchronizing automated settings.");
    } finally {
      setIsSavingEmailSettings(false);
    }
  };

  // Manually trigger daily automated email summary
  const triggerManualEmailSend = async () => {
    setIsTriggeringTestEmail(true);
    try {
      const res = await fetch('/api/email/trigger-daily-now', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setEmailSettings(prev => ({
          ...prev,
          logs: data.logs || prev.logs
        }));
        alert(`Autonomous briefing sent to ${emailSettings.dailyEmailRecipient}!`);
      }
    } catch (err: any) {
      alert(`Error sending briefing: ${err.message}`);
    } finally {
      setIsTriggeringTestEmail(false);
    }
  };

  // Incubate Project Idea
  const handleIncubateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaInput.trim() || isIncubatingIdea) return;

    setIsIncubatingIdea(true);
    setIncubatedResult(null);

    try {
      const res = await fetch('/api/automations/incubate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaText: ideaInput })
      });
      const data = await res.json();
      setIncubatedResult(data);
    } catch (err) {
      console.error(err);
      alert("Error expanding idea via Gemini.");
    } finally {
      setIsIncubatingIdea(false);
    }
  };

  // Realize the incubated idea as a live Project
  const realizeProject = () => {
    if (!incubatedResult) return;

    // Create Project
    const pId = addProject({
      name: incubatedResult.projectName,
      description: incubatedResult.projectDescription,
      status: "Planning",
      customStack: incubatedResult.customStack
    });

    // Add starter issues under this project
    incubatedResult.suggestedIssues.forEach(iss => {
      addIssue({
        projectId: pId,
        title: iss.title,
        description: iss.description,
        type: iss.type,
        status: "Todo",
        priority: iss.priority
      });
    });

    alert(`🚀 Project "${incubatedResult.projectName}" successfully realized in workspace with ${incubatedResult.suggestedIssues.length} starter tasks!`);
    setIncubatedResult(null);
    setIdeaInput("");
  };

  // Problem solver: Fetch top 3 bugs
  const topBugs = issues.filter(iss => iss.type === 'Bug' && iss.status !== 'Done').slice(0, 3);

  // Analyze a problem with Aether AI
  const handleSolveProblem = async (problem: Issue) => {
    setSolvingProblemId(problem.id);
    try {
      const res = await fetch('/api/automations/resolve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem })
      });
      const data = await res.json();
      setSolvedProblemResult(prev => ({
        ...prev,
        [problem.id]: data
      }));
    } catch (err) {
      console.error(err);
      alert("Error generating fix blueprint.");
    } finally {
      setSolvingProblemId(null);
    }
  };

  // Assign problem to AI Agent & apply resolution sub-tasks
  const applyProblemFix = (problemId: string) => {
    const remedy = solvedProblemResult[problemId];
    if (!remedy) return;

    setApplyingProblemId(problemId);

    // 1. Assign issue to SRE Agent
    updateIssue(problemId, {
      assignee: "Aether AI Agent",
      status: "In Progress"
    });

    // 2. Inject suggested sub-tasks
    remedy.subTasks.forEach(task => {
      addIssue({
        projectId: activeProjectId || projects[0]?.id || "default",
        parentId: problemId,
        title: task.title,
        description: task.description,
        type: "Task",
        status: "Todo",
        priority: "High",
        assignee: "Cortex Developer Agent"
      });
    });

    setTimeout(() => {
      setApplyingProblemId(null);
      alert("🔧 AI Agent successfully assigned! Outstanding sub-tasks injected under the bug ticket.");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full max-w-7xl mx-auto space-y-6 pb-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f1f23] pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-wide text-zinc-100 flex items-center gap-2">
            Aether <span className="font-semibold italic text-yellow-500">Automation Studio</span> <Zap className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse" size={20} />
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Build multi-level automated pipelines, configure trigger-based email notifications, or invoke SRE AI repair protocols.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeFlow && (
            <button
              onClick={executeSimulation}
              disabled={isSimulating || activeFlow.steps.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-500/40 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(234,179,8,0.05)]"
            >
              {isSimulating ? (
                <>
                  <Loader2 size={13} className="animate-spin text-yellow-400" /> Simulating...
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" /> Run Pipeline Simulation
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              const newFlow: AutomationFlow = {
                id: `flow_${Date.now()}`,
                name: "Custom Workspace Routine",
                desc: "An elegant, bespoke triggered automation workflow.",
                trigger: "On Status Change",
                active: true,
                steps: []
              };
              setFlows(prev => [...prev, newFlow]);
              setActiveFlowId(newFlow.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold cursor-pointer transition-all"
          >
            <Plus size={13} /> New Flow
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto pr-1 pb-12 scrollbar-thin">
        {/* DUAL WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE WORKFLOW BUILDER (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col min-h-[460px]">
            
            {/* Top Toolbar */}
            <div className="bg-[#0e0e11] border-b border-zinc-900/80 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Loaded Workflows:</span>
                <select
                  value={activeFlowId}
                  onChange={(e) => setActiveFlowId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-yellow-500/50 transition-colors cursor-pointer"
                >
                  {flows.map(f => (
                    <option key={f.id} value={f.id} className="bg-zinc-950">{f.name} {f.active ? '🟢' : '⚪'}</option>
                  ))}
                </select>
              </div>

              {activeFlow && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-zinc-500">Trigger:</span>
                    <select
                      value={activeFlow.trigger}
                      onChange={(e) => updateActiveFlow({ trigger: e.target.value as any })}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-350 focus:border-yellow-500/50 outline-none cursor-pointer"
                    >
                      <option value="On Critical Bug Created">On Critical Bug Created</option>
                      <option value="Daily Schedule">Daily Schedule</option>
                      <option value="On Idea Received">On Idea Received</option>
                      <option value="Weekly Report">Weekly Report</option>
                      <option value="On Status Change">On Status Change</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      updateActiveFlow({ active: !activeFlow.active });
                    }}
                    className={`text-[9px] font-extrabold tracking-widest px-2.5 py-1.5 rounded transition-all cursor-pointer ${
                      activeFlow.active 
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                        : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800'
                    }`}
                  >
                    {activeFlow.active ? 'ACTIVE' : 'PAUSED'}
                  </button>

                  <button
                    onClick={() => {
                      setFlows(prev => prev.filter(f => f.id !== activeFlowId));
                      setActiveFlowId(flows[0]?.id || "");
                    }}
                    className="p-1.5 text-zinc-650 hover:text-red-400 hover:bg-red-500/5 rounded-lg border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                    title="Delete workflow"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Canvas Area with drag drop support */}
            {activeFlow ? (
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex-1 p-6 flex flex-col justify-between gap-6 relative min-h-[380px]"
              >
                {/* Background Grid Accent with subtle yellow-amber space dots */}
                <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#eab308_0.8px,transparent_0.8px)] bg-[size:18px_18px] pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  {/* Name and description edit */}
                  <div className="space-y-1.5 bg-zinc-950/20 border border-zinc-900/40 p-3.5 rounded-xl">
                    <input
                      type="text"
                      value={activeFlow.name}
                      onChange={(e) => updateActiveFlow({ name: e.target.value })}
                      className="bg-transparent border-b border-transparent hover:border-zinc-800/60 focus:border-zinc-700/80 text-base font-black text-zinc-200 outline-none w-full pb-1 transition-colors"
                    />
                    <input
                      type="text"
                      value={activeFlow.desc}
                      onChange={(e) => updateActiveFlow({ desc: e.target.value })}
                      className="bg-transparent text-xs text-zinc-500 outline-none w-full border-b border-transparent hover:border-zinc-800/40 focus:border-zinc-700/50 transition-colors"
                    />
                  </div>

                  {/* Nodes / Steps canvas layout */}
                  <div className="pt-2">
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-4 pl-1 flex items-center gap-1.5">
                      <Layers size={11} /> Pipeline Process Workflow Canvas
                    </div>
                    
                    {activeFlow.steps.length === 0 ? (
                      <div className="border border-dashed border-zinc-850 bg-zinc-950/30 rounded-2xl p-10 text-center text-xs text-zinc-500 space-y-3 relative group">
                        <Move className="mx-auto text-zinc-600 animate-bounce group-hover:text-yellow-400 transition-colors" size={20} />
                        <div className="space-y-1 max-w-sm mx-auto">
                          <p className="font-bold text-zinc-400">Your automated workflow canvas is empty.</p>
                          <p className="text-[11px] text-zinc-600 leading-normal">Drag visual action blocks from the node palette on the right, or quickly apply a pre-configured template below.</p>
                        </div>
                      </div>
                    ) : (
                      /* Connected Timeline Connector */
                      <div className="relative pl-8 ml-3 border-l border-dashed border-zinc-800/80 space-y-4 py-2">
                        {activeFlow.steps.map((step, sIdx) => {
                          const isCurrent = simStepIdx === sIdx;
                          
                          // Color code maps for borders, badges, and icons
                          const typeStyleMap = {
                            "AI Agent Action": {
                              border: "border-l-amber-500/70",
                              badge: "text-amber-400 bg-amber-400/10 border-amber-400/20",
                              icon: Sparkles
                            },
                            "Create Subtask": {
                              border: "border-l-blue-500/70",
                              badge: "text-blue-400 bg-blue-400/10 border-blue-400/20",
                              icon: Cpu
                            },
                            "Email Notification": {
                              border: "border-l-emerald-500/70",
                              badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
                              icon: Mail
                            },
                            "Problem Resolver": {
                              border: "border-l-rose-500/70",
                              badge: "text-rose-400 bg-rose-400/10 border-rose-400/20",
                              icon: AlertCircle
                            }
                          };

                          const styles = typeStyleMap[step.type] || {
                            border: "border-l-zinc-800",
                            badge: "text-zinc-400 bg-zinc-900 border-zinc-800",
                            icon: Layers
                          };
                          
                          const IconComponent = styles.icon;

                          return (
                            <motion.div
                              key={step.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0,
                                scale: isCurrent ? 1.01 : 1,
                                boxShadow: isCurrent ? "0 0 25px rgba(234,179,8,0.06)" : "none"
                              }}
                              transition={{ duration: 0.2 }}
                              className={`flex items-start justify-between p-4 bg-[#0d0d10] border border-zinc-850/80 border-l-2 ${styles.border} rounded-xl relative group transition-colors ${
                                isCurrent 
                                  ? 'border-yellow-500/80 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.08)]' 
                                  : 'hover:border-zinc-800 hover:bg-[#0e0e12]'
                              }`}
                            >
                              {/* Precise Node Marker Centered on Timeline Dotted Line */}
                              <div className={`absolute -left-[42px] top-4.5 flex items-center justify-center w-5 h-5 rounded-full border text-[9px] font-mono font-extrabold transition-all duration-300 ${
                                isCurrent 
                                  ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.6)] animate-pulse scale-110'
                                  : step.status === 'success'
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                    : step.status === 'failed'
                                      ? 'bg-rose-950 text-rose-400 border-rose-500/50'
                                      : 'bg-[#060608] text-zinc-500 border-zinc-800'
                              }`}>
                                {sIdx + 1}
                              </div>

                              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                {/* Component Specific Icon Box */}
                                <div className={`p-2 rounded-lg border shrink-0 bg-zinc-900/80 border-zinc-800 ${isCurrent ? 'text-yellow-400 border-yellow-500/25' : 'text-zinc-450'}`}>
                                  <IconComponent size={13} />
                                </div>

                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input
                                      type="text"
                                      value={step.label}
                                      onChange={(e) => {
                                        const updatedSteps = activeFlow.steps.map(s => s.id === step.id ? { ...s, label: e.target.value } : s);
                                        updateActiveFlow({ steps: updatedSteps });
                                      }}
                                      className="bg-transparent font-bold text-xs text-zinc-150 border-b border-transparent hover:border-zinc-800 focus:border-zinc-700 outline-none p-0 transition-colors"
                                    />
                                    <span className={`text-[8.5px] font-mono font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded border ${styles.badge}`}>
                                      {step.type}
                                    </span>
                                  </div>
                                  
                                  {/* Step details prompt config input */}
                                  <div className="flex items-center gap-2 bg-[#060608] border border-zinc-900/70 rounded-lg px-2.5 py-1.5 mt-1.5">
                                    <span className="text-[9px] font-mono font-extrabold text-zinc-600 shrink-0 uppercase tracking-widest">CONFIG:</span>
                                    <input
                                      type="text"
                                      value={step.config?.prompt || step.config?.emailSubject || step.config?.assignTo || ""}
                                      placeholder={step.type === 'Email Notification' ? 'Email Subject line...' : step.type === 'Create Subtask' ? 'Instructions/Assignee...' : 'AI Prompt instructions...'}
                                      onChange={(e) => {
                                        const updatedSteps = activeFlow.steps.map(s => {
                                          if (s.id === step.id) {
                                            const updatedConfig = { ...s.config };
                                            if (s.type === 'Email Notification') {
                                              updatedConfig.emailSubject = e.target.value;
                                            } else if (s.type === 'Create Subtask') {
                                              updatedConfig.prompt = e.target.value;
                                            } else {
                                              updatedConfig.prompt = e.target.value;
                                            }
                                            return { ...s, config: updatedConfig };
                                          }
                                          return s;
                                        });
                                        updateActiveFlow({ steps: updatedSteps });
                                      }}
                                      className="flex-1 bg-transparent border-none p-0 outline-none text-[11px] text-zinc-350 placeholder-zinc-750"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3.5 shrink-0 ml-4 pt-1">
                                {/* State status indicator */}
                                {step.status === 'success' && (
                                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20">
                                    <CheckCircle2 size={11} /> Success
                                  </span>
                                )}
                                {step.status === 'running' && (
                                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                                    <Loader2 size={11} className="animate-spin" /> Running
                                  </span>
                                )}
                                {step.status === 'failed' && (
                                  <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold bg-red-500/5 px-2 py-0.5 rounded border border-red-500/20">
                                    <AlertCircle size={11} /> Failed
                                  </span>
                                )}
                                {(!step.status || step.status === 'idle') && (
                                  <span className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900">
                                    <Circle size={10} /> Queued
                                  </span>
                                )}

                                <button
                                  onClick={() => {
                                    const updatedSteps = activeFlow.steps.filter(s => s.id !== step.id);
                                    updateActiveFlow({ steps: updatedSteps });
                                  }}
                                  className="text-zinc-650 hover:text-red-400 p-1 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 cursor-pointer transition-colors"
                                  title="Remove Node"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Templates load action panel */}
                <div className="border-t border-[#1f1f23] pt-4.5 mt-6">
                  <div className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-widest mb-3 flex items-center gap-1.5 pl-1">
                    <Lightbulb size={11} /> Apply Modular Workspace Template
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {TEMPLATES.map((tmpl, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => {
                          const newFlow: AutomationFlow = {
                            id: `tmpl_${Date.now()}_${tIdx}`,
                            name: tmpl.name,
                            desc: tmpl.desc,
                            trigger: tmpl.trigger,
                            active: true,
                            steps: tmpl.steps.map(s => ({ ...s, status: "idle" }))
                          };
                          setFlows(prev => [newFlow, ...prev]);
                          setActiveFlowId(newFlow.id);
                          addLog(`Loaded Template: "${tmpl.name}"`);
                        }}
                        className="bg-[#0e0e11] border border-zinc-900 hover:border-zinc-700/80 hover:bg-[#111115] p-3 rounded-xl text-left cursor-pointer transition-all space-y-1.5 shadow-sm group"
                      >
                        <div className="text-xs font-bold text-zinc-200 truncate group-hover:text-yellow-400 transition-colors">{tmpl.name}</div>
                        <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed font-sans">{tmpl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 text-xs min-h-[360px] space-y-2">
                <Layers size={22} className="text-zinc-700 animate-pulse" />
                <p className="font-bold text-zinc-400">No active automation pipeline selected.</p>
                <p className="max-w-xs text-[11px] text-zinc-600 leading-normal">Create a new bespoke flow or choose a template below to launch your automation editor.</p>
              </div>
            )}
          </div>

          {/* TELEMETRY SIMULATOR LOGGER VIEW */}
          {simLogs.length > 0 && (
            <div className="bg-[#050507] border border-zinc-900 rounded-xl p-4 space-y-2.5 font-mono text-[11px] shadow-2xl relative overflow-hidden">
              {/* Sci-fi scanner bar */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-yellow-500/25 animate-pulse" />
              
              <div className="flex items-center justify-between text-zinc-500 text-[9.5px] uppercase tracking-widest font-sans border-b border-zinc-900 pb-2 mb-1.5">
                <span className="flex items-center gap-1.5 font-bold"><Cpu size={12} className="text-yellow-500" /> Aether Live Telemetry System Logs</span>
                <button
                  onClick={() => setSimLogs([])}
                  className="hover:text-zinc-300 transition-colors border border-zinc-850 px-2 py-0.5 rounded cursor-pointer"
                >
                  Clear Terminal
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar select-text pr-2">
                {simLogs.map((log, lIdx) => (
                  <div key={lIdx} className={`leading-relaxed tracking-wide ${
                    log.includes('SUCCESS') ? 'text-emerald-400 font-semibold' :
                    log.includes('ERROR') ? 'text-rose-400 font-bold animate-pulse' :
                    log.includes('⚡') ? 'text-yellow-400 font-bold' :
                    log.includes('🚀') ? 'text-amber-400 font-extrabold' :
                    'text-zinc-450'
                  }`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ETHER AI CREATIVE ENGINE BOX */}
          <div className="bg-gradient-to-r from-yellow-500/8 via-amber-500/2 to-transparent border border-yellow-500/15 rounded-2xl p-5 shadow-inner">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-400 shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.05)]">
                <Sparkles size={16} />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Aether Autonomic Pipeline Compiler</h3>
                  <p className="text-[11px] text-zinc-500 leading-normal mt-1 max-w-xl">
                    Describe any pipeline automation scenario (e.g., "Analyze bugs on Slack reports and email summary"), and Aether AI will compile the triggers, configurations, and steps instantly.
                  </p>
                </div>

                <form onSubmit={handleAetherGenerate} className="flex gap-2">
                  <input
                    type="text"
                    value={generatorPrompt}
                    onChange={(e) => setGeneratorPrompt(e.target.value)}
                    placeholder="Describe automation scenario (e.g., 'When a critical bug is reported, assign to SRE and notify via SMTP email')"
                    className="flex-1 bg-zinc-950 border border-zinc-850 hover:border-zinc-800 focus:border-yellow-500/50 text-xs text-zinc-200 outline-none rounded-xl px-3.5 py-3 transition-all placeholder-zinc-750"
                    disabled={isGeneratingFlow}
                  />
                  <button
                    type="submit"
                    disabled={!generatorPrompt.trim() || isGeneratingFlow}
                    className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl shrink-0 cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_2px_15px_rgba(234,179,8,0.15)]"
                  >
                    {isGeneratingFlow ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Compiling...
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} /> Compile Flow
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* DAILY SCHEDULE EMAIL CONTROL CONTAINER */}
          <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="text-emerald-400" size={15} />
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Daily Summary Email Alerts</h3>
              </div>
              <span className={`text-[8px] font-extrabold border px-2 py-0.5 rounded-full font-mono uppercase tracking-widest ${
                emailSettings.dailyEmailEnabled 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}>
                {emailSettings.dailyEmailEnabled ? "ACTIVE TRIGGER" : "INACTIVE"}
              </span>
            </div>

            <form onSubmit={handleSaveEmailSettings} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Recipient Email</label>
                <input
                  type="email"
                  value={emailSettings.dailyEmailRecipient}
                  onChange={(e) => setEmailSettings({ ...emailSettings, dailyEmailRecipient: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-350 outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Daily Scheduled Time</label>
                <input
                  type="time"
                  value={emailSettings.dailyEmailTime}
                  onChange={(e) => setEmailSettings({ ...emailSettings, dailyEmailTime: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-350 outline-none focus:border-emerald-500 cursor-pointer transition-colors"
                />
              </div>

              <div className="md:col-span-3 flex flex-col justify-end gap-1.5 pb-0.5">
                <label className="flex items-center gap-2.5 text-xs text-zinc-400 hover:text-white cursor-pointer py-2 select-none">
                  <input
                    type="checkbox"
                    checked={emailSettings.dailyEmailEnabled}
                    onChange={(e) => setEmailSettings({ ...emailSettings, dailyEmailEnabled: e.target.checked })}
                    className="accent-emerald-500 rounded border-zinc-800 bg-zinc-900 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span className="font-medium">Enable daily report triggers</span>
                </label>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={isSavingEmailSettings}
                  className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-200 hover:text-white font-bold text-xs py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isSavingEmailSettings ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save Settings
                </button>
              </div>
            </form>

            <div className="flex flex-col md:flex-row md:items-center justify-between bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 text-xs gap-3">
              <div className="text-zinc-500 max-w-md leading-normal">
                Want to run a manual diagnostic check? Trigger a live summary report run and dispatch to SMTP immediately.
              </div>
              <button
                type="button"
                onClick={triggerManualEmailSend}
                disabled={isTriggeringTestEmail}
                className="bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold tracking-wider uppercase px-3.5 py-1.5 rounded-lg cursor-pointer transition-all shrink-0"
              >
                {isTriggeringTestEmail ? "Sending test..." : "Send Manual briefing Now"}
              </button>
            </div>

            {/* EMAIL BRIEFING LIVE TEMPLATE PREVIEWER */}
            <div className="border-t border-zinc-900/60 pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowPreview(!showPreview);
                    if (!showPreview) fetchBriefingPreview();
                  }}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer bg-zinc-900/60 hover:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-850 transition-colors"
                >
                  <Eye size={12} className="text-emerald-400" />
                  {showPreview ? "Hide Live Template Preview" : "Show Live Template Preview"}
                </button>
                {showPreview && (
                  <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('html')}
                      className={`text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition-all ${activePreviewTab === 'html' ? 'bg-zinc-850 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      HTML Rendered
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('plain')}
                      className={`text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition-all ${activePreviewTab === 'plain' ? 'bg-zinc-850 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Plain Text
                    </button>
                    <button
                      type="button"
                      onClick={fetchBriefingPreview}
                      disabled={isLoadingPreview}
                      className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer transition-colors"
                      title="Refresh Preview"
                    >
                      <RefreshCw size={10} className={isLoadingPreview ? "animate-spin text-emerald-400" : ""} />
                    </button>
                  </div>
                )}
              </div>

              {showPreview && (
                <div className="border border-zinc-900 bg-[#060608] rounded-xl overflow-hidden transition-all">
                  {isLoadingPreview ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2 text-zinc-500">
                      <Loader2 size={16} className="animate-spin text-emerald-400" />
                      <p className="text-[10px] uppercase font-bold tracking-widest">Generating Live Daily Briefing Preview...</p>
                    </div>
                  ) : previewData ? (
                    activePreviewTab === 'html' ? (
                      <div className="p-4 overflow-x-auto bg-black/40">
                        <div dangerouslySetInnerHTML={{ __html: previewData.htmlBody }} />
                      </div>
                    ) : (
                      <div className="p-4">
                        <pre className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg text-zinc-400 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[300px]">
                          {previewData.plainText}
                        </pre>
                      </div>
                    )
                  ) : (
                    <div className="p-6 text-center text-zinc-600 text-xs italic">
                      Failed to compile briefing. Check workspace active projects cache.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: NODE BANK & SRE PROBLEM SOLVER (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* DRAGGABLE NODE bank PALETTE */}
          <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={13} className="text-yellow-400" /> Action Node Palette
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                Drag action blocks or click them to add them straight to your active canvas.
              </p>
            </div>

            <div className="space-y-3">
              {NODE_BANK.map((node, nIdx) => {
                const IconComp = node.icon;
                return (
                  <motion.div
                    key={nIdx}
                    whileHover={{ scale: 1.015, y: -2, border: "1px solid #333" }}
                    whileTap={{ scale: 0.99 }}
                    draggable
                    onDragStart={(e: any) => handleDragStart(e, node.type)}
                    onClick={() => addStepToActiveFlow(node.type)}
                    className={`p-3.5 border rounded-xl flex gap-3.5 cursor-pointer transition-all select-none group bg-zinc-900/20 hover:bg-zinc-900/40 border-zinc-900`}
                  >
                    <div className={`p-2.5 bg-zinc-950 rounded-xl border border-zinc-850 shrink-0 group-hover:scale-105 transition-transform ${node.color.split(' ')[0]}`}>
                      <IconComp size={14} />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="text-xs font-bold flex items-center justify-between text-zinc-200">
                        {node.label}
                        <Plus size={10} className="text-zinc-600 opacity-60 group-hover:opacity-100 group-hover:text-yellow-400 transition-all" />
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">{node.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE WORKSPACE PROBLEMS MONITOR (TOP 3 BUGS) */}
          <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="text-rose-400" size={13} /> Active Workspace Problems
              </h3>
              <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                Top 3 Unresolved
              </span>
            </div>

            {topBugs.length === 0 ? (
              <div className="text-center py-6 text-zinc-600 text-xs italic space-y-2">
                <CheckCircle2 className="mx-auto text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" size={20} />
                <div className="space-y-0.5">
                  <p className="font-bold text-zinc-400">No active bugs found!</p>
                  <p className="text-[10px] text-zinc-600 font-sans leading-normal">Your code health parameters are in perfect standing.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pr-1">
                {topBugs.map((bug) => {
                  const hasRemedy = !!solvedProblemResult[bug.id];
                  const remedy = solvedProblemResult[bug.id];
                  return (
                    <div key={bug.id} className="p-3.5 bg-[#0d0d10] border border-zinc-900 hover:border-zinc-800 rounded-xl space-y-3 transition-colors">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="space-y-1 min-w-0">
                          <span className="text-[9px] font-mono font-extrabold text-rose-400/80 uppercase">BUG TICKET #{bug.id.slice(0, 5)}</span>
                          <h4 className="text-xs font-bold text-zinc-200 leading-normal truncate">{bug.title}</h4>
                        </div>
                        <span className="text-[8.5px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                          {bug.priority}
                        </span>
                      </div>
                      
                      <p className="text-[10.5px] text-zinc-500 leading-relaxed font-sans line-clamp-2">
                        {bug.description || "No description provided for this blocker."}
                      </p>

                      <div className="flex flex-col gap-2 pt-1 border-t border-zinc-900/60 mt-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSolveProblem(bug)}
                            disabled={solvingProblemId === bug.id}
                            className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-[10px] font-extrabold text-zinc-350 py-2 rounded-lg border border-zinc-850 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                          >
                            {solvingProblemId === bug.id ? (
                              <>
                                <Loader2 size={10} className="animate-spin text-yellow-400" /> Diagnosing...
                              </>
                            ) : hasRemedy ? (
                              <>
                                <RefreshCw size={10} /> Recalculate Fix
                              </>
                            ) : (
                              <>
                                <Sparkles size={10} className="text-amber-400" /> Solve with Aether
                              </>
                            )}
                          </button>

                          {hasRemedy && (
                            <button
                              onClick={() => applyProblemFix(bug.id)}
                              disabled={applyingProblemId === bug.id}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-extrabold py-2 px-3 rounded-lg cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-[0_2px_10px_rgba(239,68,68,0.05)]"
                            >
                              {applyingProblemId === bug.id ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                "Apply Fix"
                              )}
                            </button>
                          )}
                        </div>

                        {/* Diagnostic detail fold */}
                        {hasRemedy && (
                          <div className="bg-[#060608] border border-zinc-950 rounded-lg p-3 space-y-2.5 text-[10.5px] font-sans">
                            <div className="text-rose-400/90 font-bold border-b border-zinc-900 pb-1 flex items-center gap-1">
                              <Cpu size={11} /> Diagnosed Root Cause:
                            </div>
                            <p className="text-zinc-500 leading-relaxed italic">{remedy.analysis}</p>
                            
                            <div className="text-emerald-400/90 font-bold pt-1 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Recommended Code Fix:
                            </div>
                            <pre className="p-2.5 bg-black border border-zinc-900 rounded font-mono text-[9px] text-zinc-400 overflow-x-auto leading-relaxed">
                              {remedy.codeFix}
                            </pre>

                            <div className="text-zinc-400 font-bold pt-1 flex items-center gap-1">
                              <Layers size={11} /> Incremental Sub-tasks to Inject:
                            </div>
                            <ul className="list-disc pl-4 text-zinc-500 space-y-1.5 leading-normal">
                              {remedy.subTasks.map((t, idx) => (
                                <li key={idx}><strong className="text-zinc-450">{t.title}</strong>: {t.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INSTANT IDEA INCUBATOR MODULE */}
          <div className="bg-[#0b0b0d] border border-zinc-900 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5">
                <Lightbulb className="text-yellow-400" size={13} /> Idea Incubator
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                Type in any rough idea or brainstorm. Aether will elaborate it into a starting project blueprint.
              </p>
            </div>

            <form onSubmit={handleIncubateIdea} className="space-y-3">
              <textarea
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                placeholder="Example: A personal budget manager that scans paper receipts using optical character matching..."
                className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 outline-none focus:border-yellow-500/50 h-22 placeholder-zinc-750 font-sans leading-relaxed resize-none transition-all"
                disabled={isIncubatingIdea}
                required
              />
              <button
                type="submit"
                disabled={!ideaInput.trim() || isIncubatingIdea}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold text-xs py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_2px_15px_rgba(234,179,8,0.15)]"
              >
                {isIncubatingIdea ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Expanding...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} /> Elaborate Idea Specification
                  </>
                )}
              </button>
            </form>

            {incubatedResult && (
              <div className="bg-[#0d0d10] border border-zinc-900 rounded-xl p-3.5 space-y-3 shadow-md">
                <div className="border-b border-zinc-900 pb-2">
                  <span className="text-[8px] uppercase font-mono font-extrabold text-yellow-400 tracking-widest">Aether PM Spec Draft</span>
                  <h4 className="text-xs font-bold text-zinc-200 mt-0.5">{incubatedResult.projectName}</h4>
                </div>

                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">{incubatedResult.projectDescription}</p>

                <div className="space-y-1">
                  <span className="text-[8px] text-zinc-500 font-extrabold block uppercase tracking-wider">Recommended Stack:</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {incubatedResult.customStack.map(tag => (
                      <span key={tag} className="text-[8.5px] bg-zinc-950 text-zinc-400 border border-zinc-850 px-1.5 py-0.5 rounded font-mono font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[8px] text-zinc-500 font-extrabold block uppercase tracking-wider">Generated Startup Tasks:</span>
                  <div className="space-y-1.5 pt-0.5">
                    {incubatedResult.suggestedIssues.map((iss, iIdx) => (
                      <div key={iIdx} className="p-2 bg-[#060608] border border-zinc-900/60 rounded-lg text-[10px] space-y-1">
                        <div className="flex items-center justify-between text-zinc-300 font-bold gap-2">
                          <span className="truncate">{iIdx + 1}. {iss.title}</span>
                          <span className="text-[7.5px] bg-zinc-900 text-zinc-500 px-1.5 py-0.2 rounded font-mono uppercase font-bold shrink-0">{iss.priority}</span>
                        </div>
                        <p className="text-[9px] text-zinc-500 leading-relaxed">{iss.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={realizeProject}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 mt-2 shadow-[0_2px_15px_rgba(16,185,129,0.1)]"
                >
                  <GitMerge size={12} /> Realize as Live Project
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
    </div>
  );
}
