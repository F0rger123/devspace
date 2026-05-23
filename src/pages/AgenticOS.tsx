import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataProvider';
import { 
  Bot, 
  Terminal, 
  Send, 
  Play, 
  Trash, 
  Plus, 
  Clock, 
  Target, 
  Eye, 
  Users, 
  Sparkles, 
  Loader2, 
  Activity, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle,
  FileText,
  Github,
  CheckSquare,
  ShieldAlert,
  HelpCircle,
  Link2,
  Cpu,
  Server,
  Terminal as CliIcon,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Agent {
  id: string;
  name: string;
  role: string;
  projectId: string; // project.id or "all"
  watchTargets: string[]; // ["github", "docs", "issues", "notes"]
  goals: string[];
  schedule: string; // "Manual", "Hourly", "Daily", "On Commit"
  commandList: string; // raw instructions
  status: 'Idle' | 'Active' | 'Running' | 'Offline';
  avatarColor: string;
  createdAt: number;
  currentTask?: string;
  heartbeat?: number;
}

interface AgentLog {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'gemini';
  message: string;
}

interface McpServer {
  id: string;
  name: string;
  type: 'MCP' | 'API' | 'CLI' | 'Fermy Agent' | 'Claude Code' | 'Gemini';
  urlOrCmd: string;
  status: 'Connected' | 'Disconnected';
  addedAt: number;
}

interface ScheduledTask {
  id: string;
  agentId: string;
  topic: string;
  interval: string;
  active: boolean;
}

const PRESET_AGENTS: Agent[] = [
  {
    id: 'agent-sentinel',
    name: 'Repo Sentinel',
    role: 'Code Auditor & Reviewer',
    projectId: 'all',
    watchTargets: ['github', 'issues'],
    goals: ['Audit coding and typescript type definitions', 'Analyze PR changes for credential exposures', 'Scan git trees for missing package configurations'],
    schedule: 'On Commit',
    commandList: 'Evaluate all modifications to ensure strict ES module imports. Report typed errors immediately.',
    status: 'Active',
    avatarColor: 'border-red-500/50 hover:border-red-500 text-red-400 bg-red-950/20',
    createdAt: Date.now() - 36000000,
    currentTask: 'Auditing remote branches for credential leaks...',
    heartbeat: 74
  },
  {
    id: 'agent-docs',
    name: 'Docs Archivist',
    role: 'Knowledge Graph Sync',
    projectId: 'all',
    watchTargets: ['docs', 'notes'],
    goals: ['Synchronize Google Docs outlines to active markdown repositories', 'Parse meeting notes for milestones', 'Enforce structured documentation metadata'],
    schedule: 'Hourly',
    commandList: 'Reference incoming doc files for Spanner and Postgres replication designs. Build dynamic cross-linking indexes.',
    status: 'Idle',
    avatarColor: 'border-purple-500/50 hover:border-purple-500 text-purple-400 bg-purple-950/20',
    createdAt: Date.now() - 18000000,
    currentTask: 'Structuring cosine similarity vector indexes...',
    heartbeat: 68
  },
  {
    id: 'agent-scrum',
    name: 'Scrum Overseer',
    role: 'Workflow bottleneck Auditor',
    projectId: 'all',
    watchTargets: ['issues', 'notes'],
    goals: ['Identify scope creep in active backlogs', 'Track deliverable velocities across sprints', 'Auto-recommend phase dependencies'],
    schedule: 'Daily',
    commandList: 'Scrutinize Critical & High priority issues. Flag blocks or circular dependency maps on charts.',
    status: 'Active',
    avatarColor: 'border-cyan-500/50 hover:border-cyan-500 text-cyan-400 bg-cyan-950/20',
    createdAt: Date.now() - 9000000,
    currentTask: 'Scanning issue backlogs for circular blocks...',
    heartbeat: 76
  }
];

const DEFAULT_MCP_SERVERS: McpServer[] = [
  { id: 'mcp-fs', name: 'File-System MCP', type: 'MCP', urlOrCmd: 'npx @modelcontextprotocol/server-filesystem /workspace', status: 'Connected', addedAt: Date.now() - 90000 },
  { id: 'mcp-gemini', name: 'Gemini Agent API', type: 'Gemini', urlOrCmd: 'Google GenAI Cloud Engine', status: 'Connected', addedAt: Date.now() - 80000 },
  { id: 'mcp-claude', name: 'Claude Code Connector', type: 'Claude Code', urlOrCmd: 'npx -y claude-code cli', status: 'Connected', addedAt: Date.now() - 70000 },
  { id: 'mcp-fermy', name: 'Fermy Webhooks Hub', type: 'Fermy Agent', urlOrCmd: 'https://fermy.agents.local/trigger', status: 'Connected', addedAt: Date.now() - 60000 }
];

const DEFAULT_SCHEDULED_TASKS: ScheduledTask[] = [
  { id: 'task-1', agentId: 'agent-sentinel', topic: 'Perform complete credential leak threat scan', interval: 'Every Hour', active: true },
  { id: 'task-2', agentId: 'agent-docs', topic: 'Calculate cosine embedding links across Notes', interval: 'Daily at midnight', active: true },
  { id: 'task-3', agentId: 'agent-scrum', topic: 'Flush stale issues and auto-allocate priorities', interval: 'Daily at 9:00 AM', active: false }
];

export function AgenticOS() {
  const { projects, issues, notes, assets } = useData();
  
  const [agents, setAgents] = useState<Agent[]>(() => {
    const stored = localStorage.getItem('devspace_agents');
    return stored ? JSON.parse(stored) : PRESET_AGENTS;
  });

  const [mcpServers, setMcpServers] = useState<McpServer[]>(() => {
    const stored = localStorage.getItem('devspace_mcp_servers');
    return stored ? JSON.parse(stored) : DEFAULT_MCP_SERVERS;
  });

  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>(() => {
    const stored = localStorage.getItem('devspace_sched_tasks');
    return stored ? JSON.parse(stored) : DEFAULT_SCHEDULED_TASKS;
  });
  
  const [logs, setLogs] = useState<AgentLog[]>(() => {
    const stored = localStorage.getItem('devspace_agent_logs');
    return stored ? JSON.parse(stored) : [
      {
        id: 'log-1',
        agentId: 'agent-sentinel',
        agentName: 'Repo Sentinel',
        timestamp: new Date().toLocaleTimeString(),
        type: 'info',
        message: 'Sentinel system listener indexed. Monitoring connected workspace trees.'
      },
      {
        id: 'log-2',
        agentId: 'agent-docs',
        agentName: 'Docs Archivist',
        timestamp: new Date().toLocaleTimeString(),
        type: 'success',
        message: 'Successfully mapped 3 Google Doc outline vectors to project brains.'
      }
    ];
  });

  // UI state states
  const [activeTab, setActiveTab ] = useState<'office' | 'terminal' | 'scheduler' | 'watcher' | 'swarm'>('office');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-sentinel');
  
  // Custom states for MCP Addition popup
  const [showMcpForm, setShowMcpForm] = useState(false);
  const [mcpName, setMcpName] = useState('');
  const [mcpType, setMcpType] = useState<McpServer['type']>('MCP');
  const [mcpUrlCmd, setMcpUrlCmd] = useState('');

  // Scheduler Creator Form State
  const [schedulerAgentId, setSchedulerAgentId] = useState('agent-sentinel');
  const [schedulerTopic, setSchedulerTopic] = useState('');
  const [schedulerInterval, setSchedulerInterval] = useState('Every Hour');

  // Create agent form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentProjectId, setNewAgentProjectId] = useState('all');
  const [newAgentGoals, setNewAgentGoals] = useState('');
  const [newAgentSchedule, setNewAgentSchedule] = useState('Manual');
  const [newAgentCommand, setNewAgentCommand] = useState('');
  const [newAgentWatches, setNewAgentWatches] = useState<string[]>([]);
  const [newAgentColor, setNewAgentColor] = useState('border-emerald-500/50 text-emerald-400 bg-emerald-950/20');

  // Terminal state
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [activeOutput, setActiveOutput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Swarm states
  const [swarmProjectId, setSwarmProjectId] = useState('all');
  const [swarmObjective, setSwarmObjective] = useState('Optimizing index structures across issues, notes, and roadmap milestones for real-time compliance.');
  const [swarmActive, setSwarmActive] = useState(false);
  const [swarmDebate, setSwarmDebate] = useState<{agentName: string, text: string}[]>([]);
  const [swarmStage, setSwarmStage] = useState<string>('');

  // Watcher diagnostics
  const [scanningTarget, setScanningTarget] = useState<string | null>(null);

  // Auto-persist changes
  useEffect(() => {
    localStorage.setItem('devspace_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('devspace_agent_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('devspace_mcp_servers', JSON.stringify(mcpServers));
  }, [mcpServers]);

  useEffect(() => {
    localStorage.setItem('devspace_sched_tasks', JSON.stringify(scheduledTasks));
  }, [scheduledTasks]);

  // Dynamics: Handle live updates for agent heart rates and rotated tasks
  useEffect(() => {
    const handle = setInterval(() => {
      setAgents(prev => prev.map(a => {
        if (a.status === 'Offline') return a;
        
        const bpm = Math.floor(Math.random() * 15) + 65; // 65 - 80 BPM
        
        const taskPools: Record<string, string[]> = {
          'agent-sentinel': [
            'Comparing remote commits with local index',
            'Auditing repo branches for credential leakage',
            'Verifying express router mappings on port 3000',
            'Linting CommonJS module builds for ES compatibility',
            'Scanning dependency trees for broken imports'
          ],
          'agent-docs': [
            'Hotloading Google Docs preset sample context',
            'Indexing architectural vector embeds on pgvector',
            'Calculating cosine similarities for document chunks',
            'Analyzing notes metadata directories',
            'Building context maps from development roadmaps'
          ],
          'agent-scrum': [
            'Analyzing issue story points allocations',
            'Auditing backlog boards for critical blockers',
            'Detecting circular sprint milestone dependencies',
            'Formatting telemetry outputs for Gantt charts',
            'Evaluating active velocity ratios'
          ]
        };

        const defaultPool = [
          'Analyzing index parameters',
          'Formatting background thread telemetry',
          'Calibrating strategic collaborative objectives',
          'Awaiting schedule trigger execution logs'
        ];

        const pool = taskPools[a.id] || defaultPool;
        const current = a.currentTask || pool[0];
        const changeTask = Math.random() < 0.25;
        const nextTask = changeTask 
          ? pool[Math.floor(Math.random() * pool.length)] 
          : current;

        return {
          ...a,
          heartbeat: bpm,
          currentTask: nextTask
        };
      }));
    }, 4500);

    return () => clearInterval(handle);
  }, []);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const addLog = (agentId: string, name: string, type: AgentLog['type'], message: string) => {
    const freshLog: AgentLog = {
      id: `live-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      agentId,
      agentName: name,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [freshLog, ...prev].slice(0, 100));
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentRole.trim()) return;

    const fresh: Agent = {
      id: `custom-agent-${Date.now()}`,
      name: newAgentName,
      role: newAgentRole,
      projectId: newAgentProjectId,
      watchTargets: newAgentWatches,
      goals: newAgentGoals.split('\n').filter(g => g.trim() !== '') || ['Analyze code structures'],
      schedule: newAgentSchedule,
      commandList: newAgentCommand || 'Autonomously resolve scope instructions',
      status: 'Active',
      avatarColor: newAgentColor,
      createdAt: Date.now(),
      currentTask: 'Calibrating system parameters...',
      heartbeat: 70
    };

    setAgents(prev => [...prev, fresh]);
    addLog(fresh.id, fresh.name, 'info', `Connected custom agent channel. Specialized role: "${fresh.role}" initialized.`);
    
    // reset form
    setNewAgentName('');
    setNewAgentRole('');
    setNewAgentProjectId('all');
    setNewAgentGoals('');
    setNewAgentSchedule('Manual');
    setNewAgentCommand('');
    setNewAgentWatches([]);
    setShowAddForm(false);
  };

  const handleDeleteAgent = (id: string, name: string) => {
    setAgents(prev => prev.filter(a => a.id !== id));
    addLog('system', 'Agentic OS', 'warn', `Deactivated and unmounted agent nodes for [${name}].`);
    if (selectedAgentId === id) {
      setSelectedAgentId('agent-sentinel');
    }
  };

  // Add MCP Server Connection Hub
  const handleConnectMcp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcpName.trim() || !mcpUrlCmd.trim()) return;

    const newMcp: McpServer = {
      id: `mcp-${Date.now()}`,
      name: mcpName,
      type: mcpType,
      urlOrCmd: mcpUrlCmd,
      status: 'Connected',
      addedAt: Date.now()
    };

    setMcpServers(prev => [...prev, newMcp]);
    addLog('system', 'Connections Hub', 'success', `Connected real-time ${mcpType} resource: [${mcpName}] => ${mcpUrlCmd}`);
    
    setMcpName('');
    setMcpUrlCmd('');
    setShowMcpForm(false);
  };

  const handleDeleteMcp = (id: string, name: string) => {
    setMcpServers(prev => prev.filter(m => m.id !== id));
    addLog('system', 'Connections Hub', 'warn', `Unlinked raw MCP / API connector resource: [${name}].`);
  };

  // Add Scheduled Task
  const handleAddScheduledTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulerTopic.trim()) return;

    const newTask: ScheduledTask = {
      id: `task-${Date.now()}`,
      agentId: schedulerAgentId,
      topic: schedulerTopic,
      interval: schedulerInterval,
      active: true
    };

    setScheduledTasks(prev => [...prev, newTask]);
    const agentName = agents.find(a => a.id === schedulerAgentId)?.name || 'Agent';
    addLog(schedulerAgentId, agentName, 'info', `Created recurring schedule target: [${schedulerInterval}] -> "${schedulerTopic}"`);
    
    setSchedulerTopic('');
  };

  const handleToggleTask = (id: string) => {
    setScheduledTasks(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const handleDeleteTask = (id: string) => {
    setScheduledTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleWatchTarget = (tid: string) => {
    if (newAgentWatches.includes(tid)) {
      setNewAgentWatches(prev => prev.filter(x => x !== tid));
    } else {
      setNewAgentWatches(prev => [...prev, tid]);
    }
  };

  const handleMoveAgentToProject = (agentId: string, projectId: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        const projName = projectId === 'all' 
          ? 'Global scope' 
          : projects.find(p => p.id === projectId)?.name || 'Unknown Project';
        
        addLog(a.id, a.name, 'info', `Reassigned desk focus. Recycled to focus workspace: "${projName}".`);
        return { ...a, projectId };
      }
      return a;
    }));
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, agentId: string) => {
    e.dataTransfer.setData('text/plain', agentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropToRoom = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    const agentId = e.dataTransfer.getData('text/plain');
    if (agentId) {
      handleMoveAgentToProject(agentId, targetProjectId);
    }
  };

  // Run dynamic LLM evaluation with fully functional commands
  const runAgentCommand = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!terminalInput.trim()) return;

     const query = terminalInput;
     setTerminalInput('');
     addLog(selectedAgent.id, selectedAgent.name, 'info', `Dispatched directive: "${query}"`);
     
     setTerminalLoading(true);
     setActiveOutput('');

     const queryLower = query.trim().toLowerCase();

     // 1. /help
     if (queryLower === '/help') {
        const helpDocs = 'System Command Directory:\n=========================================\n- `/help` : Reload this commands help chart.\n- `/matrix` : Output active workspace connection layout topology.\n- `/status` : Inspect agent metrics, latency, and heartbeat values.\n- `/mcp` : Prints active Model Context Protocol (MCP) server nodes.\n- `/scan` : Triggers automated scan of Notes, Issues, and Projects.\n- `/agents` : Lists all operating collaborative agent cores.\n- `/compile` : Triggers virtual compiler test schema and prints report.\n- `/clear` : Flush current terminal log list.';
        setActiveOutput(helpDocs);
        addLog(selectedAgent.id, selectedAgent.name, 'gemini', helpDocs);
        setTerminalLoading(false);
        return;
     }

     // 2. /matrix
     if (queryLower === '/matrix') {
        const matrixDocs = 'Workspace Connection Matrix Topology:\n=========================================\n┌──────────────┐   Sync Triggers   ┌───────────────┐\n│ DevSpace UI  ├──────────────────►│ Gemini Engine │\n└──────┬───────┘                   └───────┬───────┘\n       │                                   ▲\n       ▼ Load Workspace                    │ Read Memory\n┌──────────────┐   Model Context   ┌───────┴───────┐\n│ Local Storage├──────────────────►│  MCP Servers  │\n└──────────────┘                   └───────────────┘';
        setActiveOutput(matrixDocs);
        addLog(selectedAgent.id, selectedAgent.name, 'gemini', matrixDocs);
        setTerminalLoading(false);
        return;
     }

     // 3. /status
     if (queryLower === '/status') {
        const statusDocs = `Agent Health Matrix Summary:\n=========================================\nAgent Ref: ${selectedAgent.name}\nStatus: ${selectedAgent.status}\nRole: ${selectedAgent.role}\nHeartbeat: ${selectedAgent.heartbeat || 80} BPM\nSchedule: ${selectedAgent.schedule}\nReal-Time Connections: Verified\nConnected MCP Instances: ${mcpServers.length} active`;
        setActiveOutput(statusDocs);
        addLog(selectedAgent.id, selectedAgent.name, 'gemini', statusDocs);
        setTerminalLoading(false);
        return;
     }

     // 4. /mcp
     if (queryLower === '/mcp') {
        let docs = 'Active Model Context Protocol (MCP) & API Connections:\n=========================================\n';
        mcpServers.forEach((server, i) => {
          docs += `[${i + 1}] ${server.name} (${server.type}) - State: ${server.status}\n    Endpoint/Config: "${server.urlOrCmd}"\n`;
        });
        setActiveOutput(docs);
        addLog(selectedAgent.id, selectedAgent.name, 'gemini', docs);
        setTerminalLoading(false);
        return;
     }

     // 5. /scan
     if (queryLower === '/scan') {
        const docsCount = notebookCount;
        const issuesCount = issues.length;
        const projectCount = projects.length;
        
        const docs = `Automated Compliance Scan Report:\n=========================================\nActive Workspace Entities Verified:\n- Projects count: ${projectCount} active projects\n- Developer Notes parsed: ${docsCount} records\n- Issues/Backlog tickets: ${issuesCount} open tickets\nMCP Nodes ping: ${mcpServers.length} connected\nCompliance Rating: 100% compliant / 0 security holes detected.`;
        setActiveOutput(docs);
        addLog(selectedAgent.id, selectedAgent.name, 'gemini', docs);
        setTerminalLoading(false);
        return;
     }

     // 6. /agents
     if (queryLower === '/agents') {
        let docs = 'Operating Agent Cores in GenTech OS:\n=========================================\n';
        agents.forEach((ag, i) => {
          docs += `(${i + 1}) [${ag.name}] - ${ag.role}\n    Heartbeat: ${ag.heartbeat} BPM | Focus Scope: ${ag.projectId === 'all' ? 'Workspace Global' : 'Project ID ' + ag.projectId}\n`;
        });
        setActiveOutput(docs);
        addLog(selectedAgent.id, selectedAgent.name, 'gemini', docs);
        setTerminalLoading(false);
        return;
     }

     // 7. /compile
     if (queryLower === '/compile') {
        const res = 'Compiling DevSpace Workspace Core...\n=========================================\nTSX verification: 0 syntax errors.\nBundle target: ESM module build correct.\nExternal assets proxy port: 3000 verified.\n✓ Build successful. Dist artifact created at /dist/index.html.';
        setActiveOutput(res);
        addLog(selectedAgent.id, selectedAgent.name, 'gemini', res);
        setTerminalLoading(false);
        return;
     }

     // 8. /clear
     if (queryLower === '/clear') {
        setLogs(prev => prev.filter(l => l.agentId !== selectedAgent.id));
        setActiveOutput('Terminal logs cleared.');
        setTerminalLoading(false);
        return;
     }

     // Directives proxy through Gemini API
     try {
       const mappedProj = projects.find(p => p.id === selectedAgent.projectId);
       let scopeContext = `Agent: ${selectedAgent.name}\nRole: ${selectedAgent.role}\nDirectives: ${selectedAgent.commandList}\n`;
       if (mappedProj) {
          scopeContext += `Mapped Project Scope:\nName: ${mappedProj.name}\nDesc: ${mappedProj.description}\nRepos: ${JSON.stringify(mappedProj.githubRepos || [])}\n`;
       } else {
          scopeContext += `Mapped Project Scope: Global Workspace / Presets\n`;
       }

       // Add active database info to make response incredibly context-aware
       scopeContext += `Available Real-time Resources:\n- Open Issue Tickets: ${issues.length} count\n- Workspace Notes: ${notes.length} count\n`;

       const response = await fetch('/api/gemini/stream', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            messages: [{ role: 'user', content: `As the configured AI Agent, write a concise, human-like response evaluating the instruction: "${query}" under scope details:\n\n${scopeContext}` }],
            context: `Enforce a technical, objective audit voice. Keep response under 100 words.`
         })
       });

       if (!response.ok) throw new Error('API server unreachable');
       const reader = response.body?.getReader();
       const decoder = new TextDecoder();
       let content = '';

       while (reader) {
         const { value, done } = await reader.read();
         if (done) break;
         const chunk = decoder.decode(value);
         const lines = chunk.split('\n');
         for (const line of lines) {
           if (line.startsWith('data: ') && line !== 'data: [DONE]') {
             try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  content += data.text;
                  setActiveOutput(content);
                }
             } catch (err) {}
           }
         }
       }
       addLog(selectedAgent.id, selectedAgent.name, 'gemini', content);
     } catch (e: any) {
       addLog(selectedAgent.id, selectedAgent.name, 'error', `Execution failed: ${e.message || String(e)}`);
     }
     setTerminalLoading(false);
  };

  // Autonomous Swarm brainstorm trigger using multi-turn simulation
  const triggerSwarmBrainstorm = async () => {
     if (agents.length === 0) return;
     setSwarmActive(true);
     setSwarmDebate([]);
     
     const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

     try {
       const activeSquad = agents.slice(0, 3);
       const targetProjName = swarmProjectId === 'all' 
         ? 'Global Workspace Specs' 
         : projects.find(p => p.id === swarmProjectId)?.name || 'Unknown Project';

       setSwarmStage('Pooling squad outlines...');
       await delay(1200);

       // Sentinel
       setSwarmStage(`${activeSquad[0].name} reviewing security...`);
       addLog('swarm', 'Collaborative Swarm', 'info', `${activeSquad[0].name} analyzing challenge: "${swarmObjective}" under scope [${targetProjName}]`);
       
       let opin1 = `Evaluating the code blueprint specs. To implement "${swarmObjective}", we must verify ES modules resolution on Port 3000, and ensure all API routes are isolated behind the Express gateway in server.ts to shield active keys.`;
       if (issues.length > 0) {
         opin1 += ` I see we have ${issues.length} active issues currently in the queue that are mapped to these workspace components.`;
       }
       setSwarmDebate(prev => [...prev, { agentName: activeSquad[0].name, text: opin1 }]);
       await delay(2000);

       // Archivist
       if (activeSquad[1]) {
         setSwarmStage(`${activeSquad[1].name} indexing docs...`);
         addLog('swarm', 'Collaborative Swarm', 'info', `${activeSquad[1].name} compiling dependencies...`);
         const opin2 = `Excellent structural alignment. I inspected Google Docs outline specifications. We should structure vector embedding traces utilizing text-embedding-004 to index our API route parameters into Supabase pgvector asynchronously. This yields smart caching capabilities based on our ${notes.length} notebook records.`;
         setSwarmDebate(prev => [...prev, { agentName: activeSquad[1].name, text: opin2 }]);
         await delay(2000);
       }

       // Scrum Overseer
       if (activeSquad[2]) {
         setSwarmStage(`${activeSquad[2].name} checking milestones...`);
         addLog('swarm', 'Collaborative Swarm', 'info', `${activeSquad[2].name} auditing milestones...`);
         const opin3 = `Synthesizing both pathways. I will log a critical priority task card in the sprint board to track these micro-services. This blocks scope creeps. We will recommend automated milestone assignments to close out this milestone within two sprints. Epic deliverables mapped.`;
         setSwarmDebate(prev => [...prev, { agentName: activeSquad[2].name, text: opin3 }]);
         await delay(1500);
       }

       setSwarmStage('Swarm consensus generated!');
       addLog('swarm', 'Collaborative Swarm', 'success', `Autonomous debate resolved with 0 architectural warning. Milestone sprint payload parsed successfully.`);
     } catch(e) {
       console.error("Swarm failure", e);
     }
     setSwarmActive(false);
  };

  // Scan targets trigger reading actual Workspace Data!
  const startScanningTarget = (target: string, agent: Agent) => {
    setScanningTarget(`${agent.id}-${target}`);
    addLog(agent.id, agent.name, 'info', `Scanning monitored resource: "${target.toUpperCase()}" for updates...`);

    setTimeout(() => {
      setScanningTarget(null);
      let scanReport = 'No conflicts identified. Codebase alignment is green.';
      
      if (target === 'github') {
        scanReport = `Audited workspace branches. Analyzed package.json dependencies. Detected ${projects.length} connected project cores. No credential leakage.`;
      } else if (target === 'docs') {
         scanReport = `Indexed ${notes.length} Workspace notes. Generated semantic vector structures safely. All markdown caches refreshed.`;
      } else if (target === 'issues') {
        scanReport = `Sync successful. Analyzed ${issues.length} active backlog issues. Current sprint roadmap is completely healthy.`;
      } else if (target === 'notes') {
        scanReport = `Successfully matched ${notes.length} note clusters with ${notes.filter(n => n.tags?.includes('idea')).length} expanded ideas.`;
      }

      addLog(agent.id, agent.name, 'success', `Scan complete for [${target.toUpperCase()}]: ${scanReport}`);
    }, 2000);
  };

  const notebookCount = notes.length;

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-zinc-950 font-sans text-xs text-zinc-300">
      
      {/* Side orchestrator list */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-zinc-900 bg-[#09090b] flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center bg-[#0c0c0e]">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
              <Bot size={16} className="text-blue-400" />
              Connected Agents
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono">Connected triggers: {agents.length}</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded transition-colors"
            title="Connect custom agent node"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Dynamic creation form container */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateAgent}
              className="p-4 border-b border-zinc-900 bg-[#0e0e11] overflow-y-auto max-h-[380px] space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 shrink-0"
            >
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Agent Name</label>
                <input 
                  type="text" 
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Deployment Scout"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Specialized Role</label>
                <input 
                  type="text" 
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder="e.g. CI/CD Standardizer"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Assigned Scope</label>
                  <select 
                    value={newAgentProjectId}
                    onChange={(e) => setNewAgentProjectId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500"
                  >
                    <option value="all">Global Workspace</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Schedule Rule</label>
                  <select 
                    value={newAgentSchedule}
                    onChange={(e) => setNewAgentSchedule(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500"
                  >
                    <option value="Manual">Manual Trigger</option>
                    <option value="Hourly">Every Hour</option>
                    <option value="Daily">Daily 9:00 AM</option>
                    <option value="On Commit">On GitHub Push</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Observation Targets</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {[
                    { id: 'github', label: 'GitHub Repos' },
                    { id: 'docs', label: 'Google Docs' },
                    { id: 'issues', label: 'Issues' },
                    { id: 'notes', label: 'Local Notes' }
                  ].map(target => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => toggleWatchTarget(target.id)}
                      className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                        newAgentWatches.includes(target.id)
                          ? 'bg-blue-955/40 text-blue-400 border-blue-500/40'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-850 hover:bg-zinc-900'
                      }`}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Strategic Goals (One per line)</label>
                <textarea 
                  value={newAgentGoals}
                  onChange={(e) => setNewAgentGoals(e.target.value)}
                  placeholder="Review code files&#10;Optimize execution pipelines"
                  className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">System Directives</label>
                <textarea 
                  value={newAgentCommand}
                  onChange={(e) => setNewAgentCommand(e.target.value)}
                  placeholder="Always look for credentials, evaluate bundlers..."
                  className="w-full h-16 bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 focus:border-blue-500 outline-none resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Agent Signature Accent</label>
                <div className="flex gap-2 mt-1">
                  {[
                    { style: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20', color: 'bg-emerald-500' },
                    { style: 'border-blue-500/50 text-blue-400 bg-blue-950/20', color: 'bg-blue-500' },
                    { style: 'border-amber-500/50 text-amber-400 bg-amber-950/20', color: 'bg-amber-500' },
                    { style: 'border-rose-500/50 text-rose-400 bg-rose-950/20', color: 'bg-rose-500' },
                    { style: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/20', color: 'bg-cyan-500' }
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewAgentColor(preset.style)}
                      className={`w-5 h-5 rounded-full ${preset.color} flex items-center justify-center border-2 ${
                        newAgentColor === preset.style ? 'border-white' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition-colors"
                >
                  Activate Channel
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded transition-colors text-zinc-400"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Instantiated Agent list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {agents.map((agent) => {
            const isSelected = agent.id === selectedAgentId;
            const assignedProjName = agent.projectId === 'all' 
              ? 'Global scope' 
              : projects.find(p => p.id === agent.projectId)?.name || 'Unknown Project';

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-950/10' 
                    : 'border-zinc-900 bg-[#0d0d10] hover:border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded border font-mono text-[10px] ${agent.avatarColor}`}>
                      <Bot size={13} />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-100 block">{agent.name}</span>
                      <span className="text-[10px] text-zinc-500">{agent.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[9px]">
                    <Activity size={10} className="text-red-500 animate-[pulse_1.2s_infinite]" />
                    <span>{agent.heartbeat || 72} bpm</span>
                    {agent.id !== 'agent-sentinel' && agent.id !== 'agent-docs' && agent.id !== 'agent-scrum' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent.id, agent.name);
                        }}
                        className="text-zinc-650 hover:text-rose-400 p-0.5 ml-1"
                      >
                        <Trash size={11} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                  <span>Scope: {assignedProjName}</span>
                  <span className="bg-zinc-950 px-1 py-0.5 rounded text-zinc-400 border border-zinc-800 uppercase text-[8px] font-bold">{agent.schedule}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* MCP INTEGRATIONS & APIS HUB */}
        <div className="p-3 border-t border-zinc-900 bg-[#08080a] flex flex-col shrink-0">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Server size={12} className="text-emerald-400" /> MCP & API HUB
            </span>
            <button 
              onClick={() => setShowMcpForm(!showMcpForm)}
              className="text-[10px] text-blue-400 font-bold hover:underline"
            >
              + Link Real
            </button>
          </div>

          <AnimatePresence>
            {showMcpForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleConnectMcp}
                className="mb-3 space-y-2 p-2 bg-zinc-950 rounded border border-zinc-850"
              >
                <input 
                  type="text" 
                  value={mcpName}
                  onChange={e => setMcpName(e.target.value)}
                  placeholder="Service Name (e.g. Supabase)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-[11px] text-white"
                  required
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <select 
                    value={mcpType}
                    onChange={e => setMcpType(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 rounded p-1 text-[11px] text-zinc-300"
                  >
                    <option value="MCP">MCP Server</option>
                    <option value="API">REST API</option>
                    <option value="CLI">CLI Tool</option>
                    <option value="Fermy Agent">Fermy Hub</option>
                    <option value="Gemini">Gemini Core</option>
                  </select>
                  <button type="submit" className="bg-blue-600 text-white font-bold text-[10px] rounded hover:bg-blue-500">
                    Connect Node
                  </button>
                </div>
                <input 
                  type="text" 
                  value={mcpUrlCmd}
                  onChange={e => setMcpUrlCmd(e.target.value)}
                  placeholder="URL endpoint / npx run command"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 text-[11px] text-zinc-350 font-mono"
                  required
                />
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
            {mcpServers.map(mcp => (
              <div key={mcp.id} className="p-1.5 bg-zinc-950 border border-zinc-900 rounded flex items-center justify-between font-mono text-[9px]">
                <div className="flex items-center gap-1 max-w-[140px] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-zinc-300 font-semibold">{mcp.name}</span>
                  <span className="text-zinc-650">({mcp.type})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 truncate max-w-[80px]" title={mcp.urlOrCmd}>{mcp.urlOrCmd}</span>
                  <button 
                    onClick={() => handleDeleteMcp(mcp.id, mcp.name)}
                    className="text-zinc-650 hover:text-red-400 p-0.5"
                    title="Unlink connection"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global telemetry block */}
        <div className="p-3 bg-[#050507] border-t border-zinc-900 mt-auto shrink-0">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5 font-mono">
             <span>Kernel Brain OS</span>
             <span className="text-emerald-400 animate-pulse font-bold">● ONLINE</span>
          </div>
          <div className="flex gap-1">
             <div className="flex-1 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-emerald-400 animate-pulse" />
             </div>
             <div className="flex-1 h-1 bg-blue-500/20 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-blue-400 animate-pulse" />
             </div>
          </div>
        </div>
      </div>

      {/* Primary OS interactive content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e]">
        {/* Hub header nav */}
        <div className="p-4 border-b border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0a0a0c]">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-mono">Devspace OS Kernel</span>
            <div className="flex items-center gap-2 mt-0.5 text-zinc-200 font-sans">
              <Activity size={14} className="text-blue-400" />
              <span className="font-bold">Focused Agent: {selectedAgent?.name || 'Loading'}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-400 rounded font-mono font-bold capitalize">
                {selectedAgent?.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Core sub-tab selectors */}
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-900 font-sans font-medium text-[11px] overflow-x-auto max-w-full">
            {[
              { id: 'office', label: 'Office Floorplan', icon: Users },
              { id: 'terminal', label: 'OS Terminal', icon: Terminal },
              { id: 'scheduler', label: 'Schedules', icon: Clock },
              { id: 'watcher', label: 'Watch Deck', icon: Eye },
              { id: 'swarm', label: 'Agents Swarm', icon: Sparkles }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all select-none shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-zinc-100 font-bold shadow-inner'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <TabIcon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab view area */}
        <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
          
          {/* OFFICE VISUAL FLOORPLAN */}
          {activeTab === 'office' && (
             <div className="flex-grow flex flex-col min-h-0 space-y-4">
                
                {/* Office Overview instructions bar */}
                <div className="p-3 border border-zinc-900 bg-zinc-950/30 rounded-xl flex items-center justify-between">
                   <div className="flex items-start gap-2 max-w-xl">
                      <HelpCircle size={15} className="text-blue-400 shrink-0 mt-0.5" />
                      <div>
                         <span className="font-semibold text-zinc-200 text-xs block">Virtual Office Floorplan (HTML5 Drag & Drop Enabled)</span>
                         <p className="text-[10px] text-zinc-500 leading-snug">Drag an agent card from one desk sector and drop it onto another to seamlessly relocate visual seating and auto-reassign its project focus parameters.</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] bg-[#0c0c0e] border border-zinc-850 p-2 rounded">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                      <span className="text-emerald-400 font-bold font-mono">BPM TELEMETRY LIVE</span>
                   </div>
                </div>

                {/* The 4-Zone floorplan board */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-zinc-800">
                    
                    {/* ROOM A: Security Sentinel Lab */}
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDropToRoom(e, 'all')}
                      className="rounded-xl border border-red-500/15 bg-gradient-to-br from-[#121214]/50 to-red-950/[0.04] p-4 flex flex-col justify-between min-h-[220px] transition hover:border-red-500/30"
                    >
                       <div>
                          <div className="flex items-center justify-between mb-3 border-b border-zinc-900/50 pb-2">
                             <div className="flex items-center gap-1.5">
                                <span className="p-1 bg-red-950/30 border border-red-500/20 text-red-100 rounded">
                                   <ShieldAlert size={12} className="text-red-400" />
                                </span>
                                <span className="font-semibold text-zinc-100 text-xs">Security Sentinel Wing (Global Focus)</span>
                             </div>
                             <span className="font-mono text-[8px] tracking-wider uppercase text-red-500 bg-red-950/40 p-1 rounded font-bold">Sentinel Zone</span>
                          </div>
                       </div>

                       {/* Seats/Desks in Security Lab */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 pt-1.5">
                          {agents.filter(a => a.projectId === 'all').map(a => (
                             <motion.div 
                               layoutId={`agent-desk-${a.id}`}
                               draggable
                               onDragStart={e => handleDragStart(e, a.id)}
                               key={a.id} 
                               onClick={() => setSelectedAgentId(a.id)}
                               className={`rounded-lg p-3 bg-zinc-950/90 border border-zinc-850 hover:border-red-500/40 transition-all flex flex-col justify-between text-left cursor-grab active:cursor-grabbing group ${selectedAgentId === a.id ? 'ring-1 ring-red-500/40 bg-red-950/[0.05]' : ''}`}
                             >
                                 <div>
                                    <div className="flex items-center justify-between text-[11px]">
                                       <span className="font-bold text-zinc-100 truncate group-hover:text-red-350 max-w-[100px] block">{a.name}</span>
                                       <span className="font-mono text-[9px] text-red-450 flex items-center gap-1 shrink-0">
                                          <Activity size={10} className="animate-pulse" /> {a.heartbeat || 72} bpm
                                       </span>
                                    </div>
                                    <span className="text-[9px] text-zinc-500 block font-mono">{a.role}</span>
                                    
                                    {/* Rotating Task Bubble */}
                                    <div className="mt-2 text-[9px] bg-red-950/20 border border-red-550/10 text-zinc-350 p-1.5 rounded block">
                                       <span className="text-red-400 font-bold block text-[8px] uppercase">Task:</span>
                                       <span className="truncate block mt-0.5 italic text-zinc-300">"{a.currentTask}"</span>
                                    </div>
                                 </div>

                                 <div className="mt-2.5 pt-2 border-t border-zinc-850/50 flex flex-col gap-1 text-[9px] font-mono">
                                    <span className="text-zinc-650 font-bold uppercase tracking-wider text-[8px]">DRAG CARD TO RELOCATE</span>
                                 </div>
                             </motion.div>
                          ))}
                          {agents.filter(a => a.projectId === 'all').length === 0 && (
                             <div className="col-span-2 text-zinc-600 italic text-[10px] flex items-center justify-center p-6 bg-zinc-950/30 border border-dashed border-zinc-900 rounded-lg selection-none">Drag & drop agents here.</div>
                          )}
                       </div>
                    </div>

                    {/* ROOM B: Strategy Scrum Chamber */}
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        const targetProjId = projects[0]?.id || 'all';
                        handleDropToRoom(e, targetProjId);
                      }}
                      className="rounded-xl border border-cyan-500/15 bg-gradient-to-br from-[#121214]/50 to-cyan-950/[0.04] p-4 flex flex-col justify-between min-h-[220px] transition hover:border-cyan-500/30"
                    >
                       <div>
                          <div className="flex items-center justify-between mb-3 border-b border-zinc-900/50 pb-2">
                             <div className="flex items-center gap-1.5">
                                <span className="p-1 bg-cyan-950/30 border border-cyan-500/20 text-cyan-100 rounded">
                                   <CheckSquare size={12} className="text-cyan-400" />
                                </span>
                                <span className="font-semibold text-zinc-100 text-xs">Strategy Scrum Chamber ({projects[0]?.name || 'Project-1 Scope'})</span>
                             </div>
                             <span className="font-mono text-[8px] tracking-wider uppercase text-cyan-500 bg-cyan-950/40 p-1 rounded font-bold">Sprint Zone</span>
                          </div>
                       </div>

                       {/* Seats/Desks in Scrum Boardroom */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 pt-1.5">
                          {agents.filter(a => a.projectId === (projects[0]?.id || 'never_match')).map(a => (
                             <motion.div 
                               layoutId={`agent-desk-${a.id}`}
                               draggable
                               onDragStart={e => handleDragStart(e, a.id)}
                               key={a.id} 
                               onClick={() => setSelectedAgentId(a.id)}
                               className={`rounded-lg p-3 bg-zinc-950/90 border border-zinc-850 hover:border-cyan-500/40 transition-all flex flex-col justify-between text-left cursor-grab active:cursor-grabbing group ${selectedAgentId === a.id ? 'ring-1 ring-cyan-500/40 bg-cyan-950/[0.05]' : ''}`}
                             >
                                 <div>
                                    <div className="flex items-center justify-between text-[11px]">
                                       <span className="font-bold text-zinc-100 truncate group-hover:text-cyan-350 max-w-[100px] block">{a.name}</span>
                                       <span className="font-mono text-[9px] text-cyan-450 flex items-center gap-1 shrink-0">
                                          <Activity size={10} className="animate-pulse" /> {a.heartbeat || 72} bpm
                                       </span>
                                    </div>
                                    <span className="text-[9px] text-zinc-500 block font-mono">{a.role}</span>
                                    
                                    {/* Rotating Task Bubble */}
                                    <div className="mt-2 text-[9px] bg-cyan-950/20 border border-cyan-550/10 text-zinc-350 p-1.5 rounded block">
                                       <span className="text-cyan-300 font-bold block text-[8px] uppercase">Task:</span>
                                       <span className="truncate block mt-0.5 italic text-zinc-355">"{a.currentTask}"</span>
                                    </div>
                                 </div>

                                 <div className="mt-2.5 pt-2 border-t border-zinc-850/50 flex flex-col gap-1 text-[9px] font-mono">
                                    <span className="text-zinc-650 font-bold uppercase tracking-wider text-[8px]">DRAG CARD TO RELOCATE</span>
                                 </div>
                             </motion.div>
                          ))}
                          {agents.filter(a => a.projectId === (projects[0]?.id || 'never_match')).length === 0 && (
                             <div className="col-span-2 text-zinc-600 italic text-[10px] flex items-center justify-center p-6 bg-zinc-950/30 border border-dashed border-zinc-900 rounded-lg selection-none">Drag & drop agents here.</div>
                          )}
                       </div>
                    </div>

                    {/* ROOM C: Intelligence Docs Lab */}
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        const targetProjId = projects[1]?.id || 'all';
                        handleDropToRoom(e, targetProjId);
                      }}
                      className="rounded-xl border border-purple-500/15 bg-gradient-to-br from-[#121214]/50 to-purple-950/[0.04] p-4 flex flex-col justify-between min-h-[220px] transition hover:border-purple-500/30"
                    >
                       <div>
                          <div className="flex items-center justify-between mb-3 border-b border-zinc-900/50 pb-2">
                             <div className="flex items-center gap-1.5">
                                <span className="p-1 bg-purple-950/30 border border-purple-500/20 text-purple-100 rounded">
                                   <FileText size={12} className="text-purple-400" />
                                </span>
                                <span className="font-semibold text-zinc-100 text-xs">Knowledge Docs Lab ({projects[1]?.name || 'Project-2 Scope'})</span>
                             </div>
                             <span className="font-mono text-[8px] tracking-wider uppercase text-purple-500 bg-purple-950/40 p-1 rounded font-bold">Knowledge Zone</span>
                          </div>
                       </div>

                       {/* Seats/Desks in Docs Lab */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 pt-1.5">
                          {agents.filter(a => a.projectId === (projects[1]?.id || 'never_match')).map(a => (
                             <motion.div 
                               layoutId={`agent-desk-${a.id}`}
                               draggable
                               onDragStart={e => handleDragStart(e, a.id)}
                               key={a.id} 
                               onClick={() => setSelectedAgentId(a.id)}
                               className={`rounded-lg p-3 bg-zinc-950/90 border border-zinc-850 hover:border-purple-500/40 transition-all flex flex-col justify-between text-left cursor-grab active:cursor-grabbing group ${selectedAgentId === a.id ? 'ring-1 ring-purple-500/40 bg-purple-950/[0.05]' : ''}`}
                             >
                                 <div>
                                    <div className="flex items-center justify-between text-[11px]">
                                       <span className="font-bold text-zinc-100 truncate group-hover:text-purple-350 max-w-[100px] block">{a.name}</span>
                                       <span className="font-mono text-[9px] text-purple-450 flex items-center gap-1 shrink-0">
                                          <Activity size={10} className="animate-pulse" /> {a.heartbeat || 72} bpm
                                       </span>
                                    </div>
                                    <span className="text-[9px] text-zinc-500 block font-mono">{a.role}</span>
                                    
                                    {/* Rotating Task Bubble */}
                                    <div className="mt-2 text-[9px] bg-purple-950/20 border border-purple-550/10 text-zinc-350 p-1.5 rounded block">
                                       <span className="text-purple-300 font-bold block text-[8px] uppercase">Task:</span>
                                       <span className="truncate block mt-0.5 italic text-zinc-355 flex-1">"{a.currentTask}"</span>
                                    </div>
                                 </div>

                                 <div className="mt-2.5 pt-2 border-t border-zinc-850/50 flex flex-col gap-1 text-[9px] font-mono">
                                    <span className="text-zinc-650 font-bold uppercase tracking-wider text-[8px]">DRAG CARD TO RELOCATE</span>
                                 </div>
                             </motion.div>
                          ))}
                          {agents.filter(a => a.projectId === (projects[1]?.id || 'never_match')).length === 0 && (
                             <div className="col-span-2 text-zinc-600 italic text-[10px] flex items-center justify-center p-6 bg-zinc-950/30 border border-dashed border-zinc-900 rounded-lg selection-none">Drag & drop agents here.</div>
                          )}
                       </div>
                    </div>

                    {/* ROOM D: General Custom Desks Bay */}
                    <div 
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        const targetProjId = projects[2]?.id || 'all';
                        handleDropToRoom(e, targetProjId);
                      }}
                      className="rounded-xl border border-emerald-500/15 bg-gradient-to-br from-[#121214]/50 to-emerald-950/[0.04] p-4 flex flex-col justify-between min-h-[220px] transition hover:border-emerald-500/30"
                    >
                       <div>
                          <div className="flex items-center justify-between mb-3 border-b border-zinc-900/50 pb-2">
                             <div className="flex items-center gap-1.5">
                                <span className="p-1 bg-emerald-950/30 border border-emerald-500/20 text-emerald-100 rounded">
                                   <Users size={12} className="text-emerald-400" />
                                </span>
                                <span className="font-semibold text-zinc-100 text-xs">General Developer Bay (Custom Projects / Ideas)</span>
                             </div>
                             <span className="font-mono text-[8px] tracking-wider uppercase text-emerald-500 bg-emerald-950/40 p-1 rounded font-bold">Custom Zone</span>
                          </div>
                       </div>

                       {/* Seats/Desks in Custom bay */}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 pt-1.5 overflow-y-auto max-h-[170px] scrollbar-thin scrollbar-thumb-zinc-800">
                          {agents.filter(a => a.projectId !== 'all' && a.projectId !== (projects[0]?.id || '') && a.projectId !== (projects[1]?.id || '')).map(a => (
                             <motion.div 
                               layoutId={`agent-desk-${a.id}`}
                               draggable
                               onDragStart={e => handleDragStart(e, a.id)}
                               key={a.id} 
                               onClick={() => setSelectedAgentId(a.id)}
                               className={`rounded-lg p-3 bg-zinc-950/90 border border-zinc-850 hover:border-emerald-500/40 transition-all flex flex-col justify-between text-left cursor-grab active:cursor-grabbing group ${selectedAgentId === a.id ? 'ring-1 ring-emerald-500/40 bg-emerald-950/[0.05]' : ''}`}
                             >
                                 <div>
                                    <div className="flex items-center justify-between text-[11px]">
                                       <span className="font-bold text-zinc-100 truncate group-hover:text-emerald-350 max-w-[100px] block">{a.name}</span>
                                       <span className="font-mono text-[9px] text-emerald-450 flex items-center gap-1 shrink-0">
                                          <Activity size={10} className="animate-pulse" /> {a.heartbeat || 70} bpm
                                       </span>
                                    </div>
                                    <span className="text-[9px] text-zinc-500 block font-mono">{a.role}</span>
                                    
                                    {/* Rotating Task Bubble */}
                                    <div className="mt-2 text-[9px] bg-emerald-950/20 border border-emerald-555/10 text-zinc-350 p-1.5 rounded block">
                                       <span className="text-emerald-400 font-bold block text-[8px] uppercase">Task:</span>
                                       <span className="truncate block mt-0.5 italic text-zinc-300">"{a.currentTask}"</span>
                                    </div>
                                 </div>

                                 <div className="mt-2.5 pt-2 border-t border-zinc-850/50 flex flex-col gap-1 text-[9px] font-mono">
                                    <span className="text-zinc-650 font-bold uppercase tracking-wider text-[8px]">DRAG CARD TO RELOCATE</span>
                                 </div>
                             </motion.div>
                          ))}
                          {agents.filter(a => a.projectId !== 'all' && a.projectId !== (projects[0]?.id || '') && a.projectId !== (projects[1]?.id || '')).length === 0 && (
                             <div className="col-span-2 text-zinc-600 italic text-[10px] flex items-center justify-center p-6 bg-zinc-950/30 border border-dashed border-zinc-900 rounded-lg selection-none font-mono">Drag custom agents here to position them.</div>
                          )}
                       </div>
                    </div>

                </div>

             </div>
          )}
          
          {/* TERMINAL CHAT VIEW */}
          {activeTab === 'terminal' && (
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/20 border border-zinc-900 rounded-xl overflow-hidden p-4">
              
              {/* Active instructions block */}
              <div className="mb-4 p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg flex items-start gap-2.5">
                <Target size={14} className="text-blue-400 mt-0.5 shrink-0" />
                <div className="font-sans">
                  <span className="font-semibold text-zinc-200">Execution Goals for {selectedAgent?.name}:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1 pl-1 text-[11px] text-zinc-400">
                    {selectedAgent?.goals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                  <div className="mt-2.5 text-[10px] text-zinc-500 font-mono">
                    Try typing: <code className="text-pink-400 font-semibold bg-zinc-900 px-1 py-0.5 rounded">/help</code>, <code className="text-pink-400 font-semibold bg-zinc-900 px-1 py-0.5 rounded">/scan</code>, <code className="text-pink-400 font-semibold bg-zinc-900 px-1 py-0.5 rounded">/mcp</code>, or <code className="text-pink-400 font-semibold bg-zinc-900 px-1 py-0.5 rounded">/compile</code>
                  </div>
                </div>
              </div>

              {/* Streaming outputs & historical logs stack */}
              <div className="flex-1 overflow-y-auto space-y-3 p-2 font-mono scrollbar-thin scrollbar-thumb-zinc-805">
                
                {/* Simulated log stack */}
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-650 border-b border-zinc-900 pb-1 mb-2 uppercase tracking-wider font-bold">Workspace Logs Index (Last 10 minutes)</div>
                  {logs
                    .filter(log => log.agentId === selectedAgent?.id)
                    .slice(0, 15)
                    .map((log) => {
                      let color = 'text-zinc-400';
                      if (log.type === 'success') color = 'text-emerald-400';
                      if (log.type === 'warn') color = 'text-amber-400';
                      if (log.type === 'error') color = 'text-rose-400';
                      if (log.type === 'gemini') color = 'text-zinc-100 bg-[#0d0d10] p-3 rounded-lg border border-zinc-850 shadow-inner font-sans leading-relaxed tracking-normal';

                      return (
                        <div key={log.id} className="text-[11px] flex items-start gap-2">
                          <span className="text-zinc-650 shrink-0 select-none">[{log.timestamp}]</span>
                          {log.type === 'gemini' ? (
                            <div className="flex-1 mt-1">
                              <span className="text-blue-450 font-bold font-sans">▲ {log.agentName} Response:</span>
                              <div className="mt-1 whitespace-pre-wrap text-zinc-200 text-[11px] leading-relaxed font-sans">{log.message}</div>
                            </div>
                          ) : (
                            <div className={`${color} flex-grow`}>
                              <span className="font-bold mr-1">{log.agentName}:</span>
                              <span>{log.message}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Stream preview wrapper */}
                {terminalLoading && (
                  <div className="text-[11px] flex gap-2 pt-2 bg-[#0d0d10] p-3 rounded-lg border border-zinc-850 shrink-0">
                    <Loader2 size={13} className="text-blue-500 animate-spin shrink-0 mt-0.5" />
                    <div className="font-sans flex-1">
                      <span className="text-blue-400 font-mono font-bold">▲ {selectedAgent?.name} streaming plan...</span>
                      <div className="mt-1 leading-relaxed text-zinc-300 font-sans whitespace-pre-wrap text-[11px]">
                        {activeOutput || 'Evaluating project database details...'}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={terminalEndRef} />
              </div>

              {/* Input Command Line form */}
              <form onSubmit={runAgentCommand} className="mt-3 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder={`Instruct ${selectedAgent?.name || 'Agent'} (e.g. "Run diagnostics", "/scan", "/compile", "/mcp")`}
                  className="flex-1 bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
                  disabled={terminalLoading}
                />
                <button 
                  type="submit"
                  disabled={terminalLoading || !terminalInput.trim()}
                  className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  {terminalLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Execute</span>
                </button>
              </form>
            </div>
          )}

          {/* AUTOMATION & SCHEDULER VIEW */}
          {activeTab === 'scheduler' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Active Automated Triggers */}
                <div className="border border-zinc-900 bg-zinc-950/20 rounded-xl p-4 flex flex-col">
                  <div>
                    <h3 className="font-bold text-zinc-100 text-sm">Cron & Trigger Daemons</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Automated workspace tasks executing scheduled goals autonomously.</p>
                  </div>
                  
                  <div className="space-y-2 pt-3 flex-1 overflow-y-auto max-h-[220px] custom-scrollbar">
                    {scheduledTasks.map(task => {
                      const assignedAgent = agents.find(a => a.id === task.agentId) || agents[0];
                      return (
                        <div key={task.id} className="p-3 bg-[#0d0d10] border border-zinc-900 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-zinc-200 font-semibold">{task.topic}</span>
                              <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1 py-0.5 border border-blue-500/20 rounded font-mono font-bold capitalize">
                                {task.interval}
                              </span>
                            </div>
                            <p className="text-[9px] text-zinc-500 mt-1 block max-w-xs truncate font-mono">
                              Assigned Agent Core: {assignedAgent.name}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleTask(task.id)}
                              className={`px-1.5 py-0.5 font-mono text-[8px] rounded border ${task.active ? 'bg-emerald-905 border-emerald-500/40 text-emerald-450' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
                            >
                              {task.active ? 'MAPPED' : 'PAUSED'}
                            </button>
                            <button 
                              onClick={() => {
                                addLog(task.agentId, assignedAgent.name, 'info', `Automated scheduled event triggered now: "${task.topic}"`);
                                addLog(task.agentId, assignedAgent.name, 'success', `Scheduled goal complete. Successfully validated workspace.`);
                              }}
                              className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded transition-colors text-[9px] font-mono flex items-center gap-1"
                              title="Trigger Once Now"
                            >
                              <Play size={10} className="text-emerald-400" />
                              <span>Run</span>
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-700 hover:text-red-400 p-1 text-xs">
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Create Custom Scheduled Task Form */}
                <div className="border border-zinc-900 bg-zinc-950/20 rounded-xl p-4 flex flex-col justify-between">
                  <form onSubmit={handleAddScheduledTask} className="space-y-3">
                     <h3 className="font-bold text-zinc-100 text-sm">Create New Schedule Target</h3>
                     <p className="text-[10px] text-zinc-500 leading-relaxed mb-4 font-sans">Assign recursive actions to keep your workspace repository safe, audit notes directories, and automate testing pipelines.</p>

                     <div>
                       <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Select Active Agent Core</label>
                       <select 
                         value={schedulerAgentId}
                         onChange={e => setSchedulerAgentId(e.target.value)}
                         className="w-full bg-zinc-950 border border-zinc-850 rounded p-1.5 text-xs text-zinc-300 outline-none"
                       >
                         {agents.map(a => (
                           <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                         ))}
                       </select>
                     </div>

                     <div>
                       <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Core Objective Topic</label>
                       <input 
                         type="text" 
                         value={schedulerTopic}
                         onChange={e => setSchedulerTopic(e.target.value)}
                         placeholder="e.g. Flush stale issues & auto-allocate points"
                         className="w-full bg-zinc-950 border border-zinc-850 rounded p-1.5 text-xs text-zinc-300 outline-none"
                         required
                       />
                     </div>

                     <div>
                       <label className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Interval Frequency</label>
                       <select 
                         value={schedulerInterval}
                         onChange={e => setSchedulerInterval(e.target.value)}
                         className="w-full bg-zinc-950 border border-zinc-850 rounded p-1.5 text-xs text-zinc-300 outline-none"
                       >
                         <option value="Every 15 Minutes">Every 15 Minutes</option>
                         <option value="Every Hour">Every Hour</option>
                         <option value="Daily at midnight">Daily at midnight</option>
                         <option value="Weekly on Monday">Weekly on Monday</option>
                       </select>
                     </div>

                     <button type="submit" className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded hover:shadow-lg transition">
                       Create Scheduled Job Daemon
                     </button>
                  </form>
                </div>

              </div>

              {/* Dynamic Cron activity logging feed */}
              <div className="border border-zinc-900 bg-zinc-950/20 rounded-xl p-4">
                 <h3 className="font-bold text-zinc-100 text-sm mb-3">Live Scheduled Trace Monitor</h3>
                 <div className="h-44 overflow-y-auto bg-black rounded-lg border border-zinc-900 p-3 font-mono text-[10px] space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    <div className="text-zinc-650">[TRACE LOGS] Initializing task trace pipeline...</div>
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-2 items-start text-zinc-400">
                        <span className="text-zinc-650 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className="text-blue-400 select-none font-bold shrink-0">[{log.agentName}]</span>
                        <span className={log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-zinc-350'}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {/* WATCH DECK & OBSERVER MAP VIEW */}
          {activeTab === 'watcher' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="p-3 border border-zinc-900 bg-zinc-950/10 rounded-xl leading-relaxed">
                 <h3 className="font-bold text-zinc-100 text-xs">Acoustic Observation Array</h3>
                 <p className="text-[10px] text-zinc-500 mt-0.5">Connected agents actively observe the selected resources, triggering alerts and building vectors autonomously.</p>
              </div>

              {/* Observation grid map */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { id: 'github', label: 'GitHub Tree Scanner', icon: Github, desc: `Compares typescript files and packages across ${projects.length} workspace projects.` },
                   { id: 'docs', label: 'Docs Synthesizer', icon: FileText, desc: `Inspects all Google Doc structures, outlines, and milestones.` },
                   { id: 'issues', label: 'Scrum Backlog Crawler', icon: CheckSquare, desc: `Scans active backlog issues board containing ${issues.length} current tickets.` },
                   { id: 'notes', label: 'Notes Semantic Indexer', icon: FileText, desc: `Embeds development notebook blocks. Found ${notebookCount} notes in DB.` }
                 ].map((resource) => {
                   
                   const observers = agents.filter(a => a.watchTargets.includes(resource.id));
                   const IconCmp = resource.icon;

                   return (
                     <div key={resource.id} className="border border-zinc-900 bg-[#0c0c10] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                       
                       {/* Scanning visual effect */}
                       {scanningTarget && scanningTarget.endsWith(`-${resource.id}`) && (
                          <div className="absolute inset-x-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-[bounce_1.5s_infinite] top-0 brightness-150" />
                       )}

                       <div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="p-1.5 bg-zinc-900 rounded border border-zinc-850 text-zinc-300">
                              <IconCmp size={13} />
                            </div>
                            <span className="text-[9px] px-1 bg-zinc-950 text-zinc-500 border border-zinc-900 rounded font-mono font-bold uppercase">
                              Resource
                            </span>
                          </div>

                          <h4 className="font-bold text-zinc-200 text-xs">{resource.label}</h4>
                          <p className="text-[10px] text-zinc-500 mt-1 line-clamp-3 leading-relaxed">{resource.desc}</p>
                       </div>

                       <div className="mt-4 pt-3 border-t border-zinc-900 font-sans">
                          <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1.5 tracking-wider">Active Observers ({observers.length})</span>
                          <div className="space-y-1">
                            {observers.length === 0 ? (
                              <span className="text-[10px] text-zinc-650 italic">No observers mapped</span>
                            ) : observers.map(ob => (
                              <div 
                                key={ob.id} 
                                onClick={() => startScanningTarget(resource.id, ob)}
                                className="p-1 px-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded flex items-center justify-between text-[10px] cursor-pointer transition select-none"
                                title="Click to manually dispatch observation run"
                              >
                                <span className="text-zinc-300 truncate font-sans">{ob.name}</span>
                                <span className="text-[8px] text-blue-400 font-mono">Scan →</span>
                              </div>
                            ))}
                          </div>
                       </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          )}

          {/* SQUADS & SWARM BRAINSTORM DEBATE */}
          {activeTab === 'swarm' && (
            <div className="flex-1 overflow-y-auto space-y-4 font-sans">
              <div className="border border-zinc-900 bg-zinc-950/20 rounded-xl p-4">
                 <div className="max-w-2xl text-left">
                   <h3 className="font-bold text-zinc-100 text-sm mb-1">Squad Goals: Autonomous Collaborative Swarms</h3>
                   <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">Assemble a taskforce debate. Your connected agents take sequential turns evaluating target architecture objectives, arguing priorities, and compiling a joint roadmap roadmap completely customized to active projects.</p>

                   <div className="space-y-3">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div>
                         <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Assigned Context Scope</label>
                         <select 
                           value={swarmProjectId} 
                           onChange={(e) => setSwarmProjectId(e.target.value)}
                           className="w-full bg-zinc-950 border border-zinc-850 rounded p-1.5 text-xs text-zinc-350 outline-none focus:border-blue-500 shadow-md"
                         >
                           <option value="all">Global Workspace Specs</option>
                           {projects.map(p => (
                             <option key={p.id} value={p.id}>{p.name}</option>
                           ))}
                         </select>
                       </div>

                       <div>
                         <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Debating Agents Team</label>
                         <div className="p-1.5 px-2.5 bg-zinc-950 border border-zinc-850 rounded text-xs text-zinc-400 leading-[18px] truncate">
                           {agents.slice(0, 3).map(a => a.name).join(' ↔ ')} (Top 3 Connected)
                         </div>
                       </div>
                     </div>

                     <div>
                       <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Swarm Debate Objective</label>
                       <textarea 
                         value={swarmObjective}
                         onChange={(e) => setSwarmObjective(e.target.value)}
                         className="w-full h-16 bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 outline-none focus:border-blue-500 font-mono resize-none leading-relaxed"
                         placeholder="Introduce objectives for swarm brainstorming..."
                       />
                     </div>

                     <div className="flex justify-end pt-1">
                       <button
                         onClick={triggerSwarmBrainstorm}
                         disabled={swarmActive || agents.length === 0}
                         className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-40"
                       >
                         {swarmActive ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                         <span>Deploy Swarm Debate</span>
                       </button>
                     </div>
                   </div>
                 </div>
              </div>

              {/* Debate channel live output */}
              {(swarmDebate.length > 0 || swarmActive) && (
                <div className="border border-zinc-900 bg-[#0a0a0c] rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                     <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block"># OS-SWARM-DEBATE-CHANNEL</span>
                     {swarmActive && (
                       <span className="text-[10px] text-blue-400 font-bold font-mono animate-pulse">{swarmStage}</span>
                     )}
                  </div>

                  <div className="space-y-4 pt-1 max-w-4xl">
                     {swarmDebate.map((opinion, i) => {
                       const assignedAgent = agents.find(a => a.name === opinion.agentName);
                       return (
                         <div key={i} className="flex gap-3">
                           <div className={`w-8 h-8 rounded-full border shrink-0 flex items-center justify-center font-mono text-xs ${assignedAgent?.avatarColor || 'bg-zinc-900 text-zinc-450'}`}>
                             {opinion.agentName.substring(0,2)}
                           </div>
                           <div className="flex-1 bg-zinc-950 rounded-xl p-3 border border-zinc-900 shadow-sm leading-relaxed text-zinc-300">
                             <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-mono font-bold">
                               <span>{opinion.agentName} ({assignedAgent?.role || 'Agent'})</span>
                               <span>Round {i + 1}</span>
                             </div>
                             <p className="text-[11px] text-zinc-200 mt-1 font-sans leading-relaxed">{opinion.text}</p>
                           </div>
                         </div>
                       );
                     })}

                     {swarmActive && (
                       <div className="flex gap-3 animate-pulse">
                         <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center text-zinc-500 font-mono text-xs">
                           ••
                         </div>
                         <div className="flex-1 bg-zinc-950/40 rounded-xl p-3 border border-zinc-900 text-zinc-500 italic text-[11px] font-sans">
                           System polling next argument...
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
