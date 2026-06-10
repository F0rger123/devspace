import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Project = {
  id: string;
  name: string;
  description: string;
  frameworks?: string[];
  githubRepos?: string[]; // Switched to array to support multiple linked repos
  apiConnections?: { name: string, keyPrefix?: string }[];
  launchTarget?: string; // YYYY-MM-DD
  sprints?: { id: string, name: string, startDate?: string, endDate?: string }[];
  status: 'Active' | 'Paused' | 'Completed' | 'Planning';
  createdAt: number;
  websiteUrl?: string;
  featuresCount?: number;         // e.g. 50
  totalFeaturesCount?: number;    // e.g. 76
  progressPercent?: number;       // e.g. 80
  daysUntilAddition?: number;    // e.g. 30 until a new release
  customStack?: string[];         // dynamic tech stack tags
  seenRecommendedIdeas?: string[]; // to prevent duplicating AI recommendations
  dreamRecommendations?: {        // saved AI self-improvement code recommendations
    id: string;
    title: string;
    description: string;
    snippet: string;
    category?: string;
    status?: 'active' | 'approved' | 'dismissed';
    createdAt?: number;
  }[];
  brainstormIdeas?: {             // child brainstorm ideas
    id: string;
    text: string;
    details?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
  }[];
  goals?: {
    id: string;
    text: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    createdAt: number;
  }[];
  isDreamingActive?: boolean;
  dreamProgress?: number;
  dreamLogs?: string[];
  dreamFocus?: 'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general';
  lastDreamedTime?: number;
};

export type Issue = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  type: 'Task' | 'Bug' | 'Feature';
  status: 'Todo' | 'In Progress' | 'Done';
  phaseId?: string; // High-level Phase mapping
  sprintId?: string; // Sprint mapping
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  githubIssueNumber?: number;
  labels?: string[];
  assignee?: string;
  storyPoints?: number;
  dueDate?: string; // YYYY-MM-DD
  recurrenceRule?: 'Daily' | 'Weekly' | 'Monthly'; 
  dependencyIds?: string[]; // IDs of other issues blocking this one
  bugEnvironment?: string; // e.g. "Production - iOS 15.1"
  crashLogs?: string; // log stacktraces
  createdAt: number;
};

export type Phase = {
  id: string;
  projectId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string;
  goal?: string;
};

export type Note = {
  id: string;
  projectId: string;
  title: string;
  content: string; // Markdown
  tags?: string[];
  createdAt: number;
  updatedAt: number;
};

export type Asset = {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 data
  createdAt: number;
};

export type AgentBranchMergeRequest = {
  id: string;
  title: string;
  source: string;
  target: string;
  status: 'Open' | 'Merged' | 'Draft';
  createdAt: number;
};

export type CortexSynapse = {
  id: string;
  name: string;
  desc: string;
  snippet?: string;
  type: 'dream_synapse' | 'custom_synapse';
  projectName?: string;
  createdAt: number;
};

export type VoiceAction = {
  id: string;
  transcript: string;
  intent: 'create_project' | 'create_issue' | 'update_issue_status' | 'add_brainstorm_idea' | 'add_note' | 'unknown' | string;
  confidence: number;
  parsedData: any;
  explanation: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  createdAt: number;
};

export type Agent = {
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
  githubRepo?: string; // connected GitHub repo
  branchName?: string; // agent branch name
  mergeRequests?: AgentBranchMergeRequest[];
  officeZone?: 'sentinel' | 'scrum' | 'docs_lab' | 'dev_bay';
  projectTaskSector?: 'fixes' | 'feature' | 'docs' | 'qa';
  modelEngine?: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite' | 'claude-3.5-sonnet';
};

type DataContextType = {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => string;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  startProjectDreaming: (projectId: string, focusMode?: 'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general') => Promise<void>;

  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  addIssue: (i: Omit<Issue, 'id' | 'createdAt'>) => void;
  updateIssue: (id: string, i: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;

  phases: Phase[];
  setPhases: React.Dispatch<React.SetStateAction<Phase[]>>;
  addPhase: (p: Omit<Phase, 'id'>) => void;
  updatePhase: (id: string, p: Partial<Phase>) => void;
  deletePhase: (id: string) => void;

  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, n: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  addAsset: (a: Omit<Asset, 'id' | 'createdAt'>) => void;
  deleteAsset: (id: string) => void;

  activeProjectId: string | null;
  setActiveProjectId: React.Dispatch<React.SetStateAction<string | null>>;

  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;

  aiContextRules: string;
  setAiContextRules: React.Dispatch<React.SetStateAction<string>>;

  githubUser: string;
  setGithubUser: React.Dispatch<React.SetStateAction<string>>;

  googleUser: any;
  setGoogleUser: React.Dispatch<React.SetStateAction<any>>;
  googleToken: string | null;
  setGoogleToken: React.Dispatch<React.SetStateAction<string | null>>;
  githubToken: string | null;
  setGithubToken: React.Dispatch<React.SetStateAction<string | null>>;
  githubProfile: any;
  setGithubProfile: React.Dispatch<React.SetStateAction<any>>;
  githubRepo: string | null;
  setGithubRepo: React.Dispatch<React.SetStateAction<string | null>>;
  aiPersona: string;
  setAiPersona: React.Dispatch<React.SetStateAction<string>>;
  aetherControlNotes: boolean;
  setAetherControlNotes: React.Dispatch<React.SetStateAction<boolean>>;
  aetherControlIssues: boolean;
  setAetherControlIssues: React.Dispatch<React.SetStateAction<boolean>>;
  aetherControlAgents: boolean;
  setAetherControlAgents: React.Dispatch<React.SetStateAction<boolean>>;
  aetherControlBrainstorm: boolean;
  setAetherControlBrainstorm: React.Dispatch<React.SetStateAction<boolean>>;
  aetherControlIntegrations: boolean;
  setAetherControlIntegrations: React.Dispatch<React.SetStateAction<boolean>>;
  aetherDoubleConfirm: boolean;
  setAetherDoubleConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  aetherAutoRecommend: boolean;
  setAetherAutoRecommend: React.Dispatch<React.SetStateAction<boolean>>;
  cortexSynapses: CortexSynapse[];
  setCortexSynapses: React.Dispatch<React.SetStateAction<CortexSynapse[]>>;
  voiceQueue: VoiceAction[];
  setVoiceQueue: React.Dispatch<React.SetStateAction<VoiceAction[]>>;
  addVoiceAction: (action: Omit<VoiceAction, 'id' | 'status' | 'createdAt'>) => void;
  updateVoiceActionStatus: (id: string, status: 'approved' | 'rejected' | 'applied') => void;
  deleteVoiceAction: (id: string) => void;
  applyVoiceAction: (id: string) => string;
  passcodePin: string;
  setPasscodePin: React.Dispatch<React.SetStateAction<string>>;
};

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

const getStored = <T,>(key: string, defaultVal: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultVal;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    return defaultVal;
  }
};

const setStored = <T,>(key: string, val: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch (error) {}
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const list = getStored<Project[]>('app_projects', []);
    if (list.length === 0) {
      const defaultProjects: Project[] = [
        {
          id: 'spacestation-sync',
          name: 'Space Station Sync',
          description: 'A responsive administrative dashboard for lunar space coordinate telemetry.',
          status: 'Active',
          createdAt: Date.now() - 10 * 24 * 3600 * 1000,
          frameworks: ['React', 'TypeScript', 'Tailwind CSS'],
          githubRepos: ['google/genai-js'],
          websiteUrl: 'https://spacestation.example.com',
          featuresCount: 50,
          totalFeaturesCount: 76,
          progressPercent: 80,
          daysUntilAddition: 30,
          customStack: ['React', 'TypeScript', 'Tailwind', 'Recharts'],
          brainstormIdeas: [
            { id: '1', text: 'Integrate live solar flare warnings', details: 'Triggers mobile alerts when magnetic activity rises above baseline.', status: 'approved', createdAt: Date.now() },
            { id: '2', text: 'Dynamic telemetry charting', details: 'Use D3 to draw real-time interactive orbital vectors.', status: 'pending', createdAt: Date.now() }
          ],
          seenRecommendedIdeas: [],
          dreamRecommendations: [
            {
              id: 'dream-telemetry-webgl',
              title: 'Optimize Telemetry Coordinate Pipeline via Canvas/D3',
              description: 'Convert SVG coordinate rendering to canvas-backed D3 paths. This resolves browser lag when streaming dense  lunar coordinate batches.',
              snippet: `import * as d3 from 'd3';\n\nexport function useRenderCoordinates(canvasRef: React.RefObject<HTMLCanvasElement>, data: any[]) {\n  React.useEffect(() => {\n    const canvas = canvasRef.current;\n    if (!canvas) return;\n    const ctx = canvas.getContext('2d');\n    if (!ctx) return;\n    ctx.clearRect(0, 0, canvas.width, canvas.height);\n    const scaleX = d3.scaleLinear().domain([0, 100]).range([0, canvas.width]);\n    const scaleY = d3.scaleLinear().domain([0, 100]).range([canvas.height, 0]);\n    ctx.strokeStyle = '#3b82f6';\n    ctx.lineWidth = 1.5;\n    ctx.beginPath();\n    data.forEach((d, idx) => {\n      if (idx === 0) ctx.moveTo(scaleX(d.x), scaleY(d.y));\n      else ctx.lineTo(scaleX(d.x), scaleY(d.y));\n    });\n    ctx.stroke();\n  }, [data, canvasRef]);\n}`
            },
            {
              id: 'dream-security-header-check',
              title: 'Express Security Headers Guard System',
              description: 'Inject helmet security directives and custom rate limit buffers to server.ts to secure sensitive telemetry endpoints from credential scraping.',
              snippet: `import helmet from 'helmet';\nimport rateLimit from 'express-rate-limit';\n\nexport function applySecurityShields(app: any) {\n  app.use(helmet());\n  const apiLimiter = rateLimit({\n    windowMs: 15 * 60 * 1000,\n    max: 100,\n    message: { error: 'Too many queries. Directives hold.' }\n  });\n  app.use('/api/', apiLimiter);\n}`
            }
          ]
        },
        {
          id: 'brainstorm-sandbox',
          name: 'Brainstorm Sandbox',
          description: 'A creative sandbox for holding emerging app ideas, user pitches, and agent suggestions.',
          status: 'Planning',
          createdAt: Date.now() - 20 * 24 * 3600 * 1000,
          frameworks: ['Brainstorming'],
          websiteUrl: '',
          featuresCount: 5,
          totalFeaturesCount: 20,
          progressPercent: 25,
          daysUntilAddition: 10,
          customStack: ['Gemini LLM', 'Voice Dictation'],
          brainstormIdeas: [
            { id: 'idea-1', text: 'Infinite Writer Co-pilot', details: 'Text-editor that triggers mild haptics or red glows when you pause typing for 30 seconds.', status: 'approved', createdAt: Date.now() },
            { id: 'idea-2', text: 'SaaS Billing Tracker for Indie Hackers', details: 'A visual terminal dashboard showing micro-MRI subscriptions.', status: 'pending', createdAt: Date.now() }
          ],
          seenRecommendedIdeas: [],
          dreamRecommendations: [
            {
              id: 'dream-recursive-analysis',
              title: 'Self-Optimizing Gemini Prompt Evaluator',
              description: 'Implement a double-layer prompt check verifying code cleanliness constraints (WCAG, ES Module files) before rendering response stream chunks.',
              snippet: `import { GoogleGenAI } from '@google/genai';\n\nconst ai = new GoogleGenAI();\nexport async function evaluateConstraintAudit(prompt: string) {\n  const res = await ai.models.generateContent({\n    model: 'gemini-3.5-flash',\n    contents: 'Perform a prompt compliance audit on: ' + prompt,\n    config: { responseMimeType: 'application/json' }\n  });\n  return JSON.parse(res.text);\n}`
            }
          ]
        }
      ];
      return defaultProjects;
    }
    return list;
  });
  const [issues, setIssues] = useState<Issue[]>(() => {
    const list = getStored<Issue[]>('app_issues', []);
    if (list.length === 0) {
      const defaultIssues: Issue[] = [
        {
          id: 'issue-vite-perf',
          projectId: 'spacestation-sync',
          title: 'Vite double-mounting causing performance degradation',
          description: 'Strict mode double render side-effects causing state flicker on coordinate graphs.',
          type: 'Bug',
          status: 'Todo',
          priority: 'Critical',
          createdAt: Date.now() - 3 * 24 * 3600 * 1000
        },
        {
          id: 'issue-exp-leak',
          projectId: 'spacestation-sync',
          title: 'Express session key exposure inside console output files',
          description: 'Sanitize server.ts console log dumps to prevent key leakage triggers.',
          type: 'Bug',
          status: 'Todo',
          priority: 'High',
          createdAt: Date.now() - 2 * 24 * 3600 * 1000
        },
        {
          id: 'issue-type-constraints',
          projectId: 'spacestation-sync',
          title: 'Broken type constraints in useData context update parameters',
          description: 'Rectify type mismatches in project interface when pushing roadmap phase data.',
          type: 'Bug',
          status: 'Todo',
          priority: 'Medium',
          createdAt: Date.now() - 4 * 24 * 3600 * 1000
        },
        {
          id: 'issue-workspacedocs-mock',
          projectId: 'spacestation-sync',
          title: 'Workspace Google Docs intelligence showing mockup files',
          description: 'Ensure connected accounts pull actual Google Drive documents instead of offline templates.',
          type: 'Task',
          status: 'Todo',
          priority: 'High',
          createdAt: Date.now() - 12 * 3600 * 1000
        },
        {
          id: 'issue-vector-sim',
          projectId: 'brainstorm-sandbox',
          title: 'Real-time vector matching workspace simulator',
          description: 'Add a client-side vector search sandbox comparing meeting note strings using static word-split hashes.',
          type: 'Feature',
          status: 'Todo',
          priority: 'High',
          createdAt: Date.now() - 2 * 24 * 3600 * 1000
        }
      ];
      return defaultIssues;
    }
    return list;
  });
  const [phases, setPhases] = useState<Phase[]>(() => getStored('app_phases', []));
  const [notes, setNotes] = useState<Note[]>(() => getStored('app_notes', []));
  const [assets, setAssets] = useState<Asset[]>(() => getStored('app_assets', []));
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => getStored('app_active_project', null));
  
  const [agents, setAgents] = useState<Agent[]>(() => {
    const list = getStored<Agent[]>('devspace_agents', []);
    const defaults: Agent[] = [
      {
        id: 'agent-sentinel',
        name: 'Repo Sentinel',
        role: 'Code Auditor & Reviewer',
        projectId: 'spacestation-sync',
        watchTargets: ['github', 'issues'],
        goals: ['Audit coding and typescript type definitions', 'Analyze PR changes for credential exposures', 'Scan git trees for missing package configurations'],
        schedule: 'On Commit',
        commandList: 'Evaluate all modifications to ensure strict ES module imports. Report typed errors immediately.',
        status: 'Active',
        avatarColor: 'border-red-500/50 hover:border-red-500 text-red-400 bg-red-950/20',
        createdAt: Date.now() - 36000000,
        currentTask: 'Auditing remote branches for credential leaks...',
        heartbeat: 74,
        githubRepo: 'google/genai-js',
        branchName: 'feat/agent-sentinel',
        officeZone: 'sentinel',
        mergeRequests: [
          { id: 'mr-1', title: 'security: cleanup env credential leak paths', source: 'feat/agent-sentinel', target: 'main', status: 'Draft', createdAt: Date.now() - 3600000 }
        ],
        modelEngine: 'gemini-3.1-flash-lite'
      },
      {
        id: 'agent-docs',
        name: 'Docs Archivist',
        role: 'Knowledge Graph Sync',
        projectId: 'spacestation-sync',
        watchTargets: ['docs', 'notes'],
        goals: ['Synchronize Google Docs outlines to active markdown repositories', 'Parse meeting notes for milestones', 'Enforce structured documentation metadata'],
        schedule: 'Hourly',
        commandList: 'Reference incoming doc files for Spanner and Postgres replication designs. Build dynamic cross-linking indexes.',
        status: 'Idle',
        avatarColor: 'border-purple-500/50 hover:border-purple-500 text-purple-400 bg-purple-950/20',
        createdAt: Date.now() - 18000000,
        currentTask: 'Structuring cosine similarity vector indexes...',
        heartbeat: 68,
        githubRepo: 'google/genai-js',
        branchName: 'feat/agent-docs',
        officeZone: 'docs_lab',
        mergeRequests: [],
        modelEngine: 'gemini-3.5-flash'
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
        heartbeat: 76,
        githubRepo: 'google/genai-js',
        branchName: 'feat/agent-scrum',
        officeZone: 'scrum',
        mergeRequests: [],
        modelEngine: 'gemini-3.5-flash'
      },
      {
        id: 'agent-jules',
        name: 'Jules AI',
        role: 'Google\'s Coding Assistant',
        projectId: 'all',
        watchTargets: ['github', 'issues'],
        goals: ['Execute multi-task coding queues and bug fixes concurrently', 'Analyze project plans and output step-by-step code briefs', 'Output dynamic markdown testing checklists after complete builds'],
        schedule: 'Manual',
        commandList: 'Focus on multi-issue queues and regression coverage. Provide extensive code details and test guides directly.',
        status: 'Idle',
        avatarColor: 'border-blue-500/50 hover:border-blue-500 text-blue-400 bg-blue-950/20',
        createdAt: Date.now() - 5000000,
        currentTask: 'System idle, awaiting coding mission payload...',
        heartbeat: 72,
        githubRepo: 'google/genai-js',
        branchName: 'feat/jules-coding',
        officeZone: 'dev_bay',
        mergeRequests: [],
        modelEngine: 'gemini-3.1-pro-preview'
      },
      {
        id: 'agent-claude',
        name: 'Claude Code Bot',
        role: 'Fast Refactoring & CLI Agent',
        projectId: 'all',
        watchTargets: ['github'],
        goals: ['Run speed refactorings and code replacements', 'Format package configuration trees', 'Audit terminal syntax structures'],
        schedule: 'On Commit',
        commandList: 'Execute prompt instructions directly. Enforce ES module imports and single-screen boundaries.',
        status: 'Idle',
        avatarColor: 'border-amber-500/50 hover:border-amber-500 text-amber-400 bg-amber-950/20',
        createdAt: Date.now() - 4000000,
        currentTask: 'System idle, listening to terminal connectors...',
        heartbeat: 69,
        githubRepo: 'google/genai-js',
        branchName: 'feat/claude-refactor',
        officeZone: 'dev_bay',
        mergeRequests: [],
        modelEngine: 'claude-3.5-sonnet'
      },
      {
        id: 'agent-antigravity',
        name: 'Antigravity Code Agent',
        role: 'Orchestrator & Flow Optimizer',
        projectId: 'all',
        watchTargets: ['docs', 'notes', 'issues'],
        goals: ['Maintain design system guidelines', 'Maximize typographic and structural contrast', 'Aesthetic spacing calibration'],
        schedule: 'Manual',
        commandList: 'Design, layout, and spacing audit. Maintain literal labels. Shield backend keys.',
        status: 'Idle',
        avatarColor: 'border-pink-500/50 hover:border-pink-500 text-pink-400 bg-pink-950/20',
        createdAt: Date.now() - 3000000,
        currentTask: 'Awaiting design-token updates...',
        heartbeat: 75,
        githubRepo: 'google/genai-js',
        branchName: 'feat/antigravity-design',
        officeZone: 'dev_bay',
        mergeRequests: [],
        modelEngine: 'gemini-3.1-pro-preview'
      }
    ];

    if (list.length === 0) {
      return defaults;
    }
    const merged = [...list];
    for (const d of defaults) {
      if (!merged.some(a => a.id === d.id)) {
        merged.push(d);
      }
    }
    return merged;
  });

  const [aiContextRules, setAiContextRules] = useState<string>(() => getStored('app_ai_context', ''));
  const [githubUser, setGithubUser] = useState<string>(() => getStored('app_github_user', 'google'));

  const [voiceQueue, setVoiceQueue] = useState<VoiceAction[]>(() => {
    const list = getStored<VoiceAction[]>('app_voice_queue', []);
    if (list.length === 0) {
      return [
        {
          id: 'voice-sample-1',
          transcript: 'add a medium priority task for lunar landing called design landing gear module',
          intent: 'create_issue',
          confidence: 0.98,
          explanation: 'The user wants to add a medium priority task titled "design landing gear module" to Lunar Landing.',
          parsedData: {
            title: 'Design Landing Gear Module',
            priority: 'Medium',
            type: 'Task',
            projectNameMentioned: 'Lunar Landing'
          },
          status: 'pending',
          createdAt: Date.now() - 3600000
        },
        {
          id: 'voice-sample-2',
          transcript: 'we absolutely must make sure webgl is enabled for visual performance of our simulations',
          intent: 'add_brainstorm_idea',
          confidence: 0.94,
          explanation: 'User is proposing a project brainstorm idea to enable WebGL for visual performance.',
          parsedData: {
            text: 'Enable WebGL',
            details: 'Ensure WebGL is enabled for visual performance of our simulations'
          },
          status: 'pending',
          createdAt: Date.now() - 1800000
        }
      ];
    }
    return list;
  });

  const [googleUser, setGoogleUser] = useState<any>(() => getStored('app_google_user', null));
  const [googleToken, setGoogleToken] = useState<string | null>(() => getStored('app_google_token', null));
  const [githubToken, setGithubToken] = useState<string | null>(() => getStored('app_github_token', null));
  const [githubProfile, setGithubProfile] = useState<any>(() => getStored('app_github_profile', null));
  const [githubRepo, setGithubRepo] = useState<string | null>(() => getStored('app_last_github_repo', null));
  const [aiPersona, setAiPersona] = useState<string>(() => getStored('app_ai_persona', 'Scrum Master'));
  const [aetherControlNotes, setAetherControlNotes] = useState<boolean>(() => getStored('app_aether_control_notes', true));
  const [aetherControlIssues, setAetherControlIssues] = useState<boolean>(() => getStored('app_aether_control_issues', true));
  const [aetherControlAgents, setAetherControlAgents] = useState<boolean>(() => getStored('app_aether_control_agents', true));
  const [aetherControlBrainstorm, setAetherControlBrainstorm] = useState<boolean>(() => getStored('app_aether_control_brainstorm', true));
  const [aetherControlIntegrations, setAetherControlIntegrations] = useState<boolean>(() => getStored('app_aether_control_integrations', false));
  const [aetherDoubleConfirm, setAetherDoubleConfirm] = useState<boolean>(() => getStored('app_aether_double_confirm', false));
  const [aetherAutoRecommend, setAetherAutoRecommend] = useState<boolean>(() => getStored('app_aether_auto_recommend', true));
  const [cortexSynapses, setCortexSynapses] = useState<CortexSynapse[]>(() => {
    const list = getStored<CortexSynapse[]>('app_cortex_synapses', []);
    if (list.length === 0) {
      return [
        {
          id: 'synapse-authrules',
          name: 'Authentication Protocol',
          desc: 'Secure Firestore database security rules require write verification check where auth is not null.',
          type: 'custom_synapse',
          createdAt: Date.now() - 48000000
        },
        {
          id: 'synapse-margins',
          name: 'UI Responsive Grid',
          desc: 'Enforce fluid spacing using Tailwind, keeping touch elements to minimum of 44px on mobile layers.',
          type: 'custom_synapse',
          createdAt: Date.now() - 24000000
        }
      ];
    }
    return list;
  });

  const [passcodePin, setPasscodePin] = useState<string>(() => {
    return getStored<string>('whatsapp_passcode_pin', '1234');
  });

  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // Fetch server state cache on mount
  useEffect(() => {
    async function loadServerState() {
      try {
        const res = await fetch('/api/voice/sync-cache');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (Array.isArray(data.projects) && data.projects.length > 0) setProjects(data.projects);
            if (Array.isArray(data.issues) && data.issues.length > 0) setIssues(data.issues);
            if (Array.isArray(data.notes) && data.notes.length > 0) setNotes(data.notes);
            if (Array.isArray(data.phases) && data.phases.length > 0) setPhases(data.phases);
            if (Array.isArray(data.agents) && data.agents.length > 0) setAgents(data.agents);
            if (Array.isArray(data.cortexSynapses) && data.cortexSynapses.length > 0) setCortexSynapses(data.cortexSynapses);
            if (typeof data.aiContextRules === 'string' && data.aiContextRules) setAiContextRules(data.aiContextRules);
            if (typeof data.passcodePin === 'string' && data.passcodePin) {
              setPasscodePin(data.passcodePin);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load server state cache:", e);
      } finally {
        setIsInitialLoadDone(true);
      }
    }
    loadServerState();
  }, []);

  // Post state cache to server on local changes (debounced by 800ms)
  useEffect(() => {
    if (!isInitialLoadDone) return;

    const timer = setTimeout(async () => {
      try {
        await fetch('/api/voice/sync-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projects,
            issues,
            cortexSynapses,
            notes,
            phases,
            agents,
            aiContextRules,
            passcodePin
          })
        });
      } catch (e) {
        console.error("Failed to auto-sync changes to server:", e);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [projects, issues, cortexSynapses, notes, phases, agents, aiContextRules, passcodePin, isInitialLoadDone]);

  useEffect(() => { setStored('whatsapp_passcode_pin', passcodePin); }, [passcodePin]);
  useEffect(() => { setStored('app_projects', projects); }, [projects]);
  useEffect(() => { setStored('app_issues', issues); }, [issues]);
  useEffect(() => { setStored('app_phases', phases); }, [phases]);
  useEffect(() => { setStored('app_notes', notes); }, [notes]);
  useEffect(() => { setStored('app_assets', assets); }, [assets]);
  useEffect(() => { setStored('app_active_project', activeProjectId); }, [activeProjectId]);
  useEffect(() => { setStored('devspace_agents', agents); }, [agents]);
  useEffect(() => { setStored('app_ai_context', aiContextRules); }, [aiContextRules]);
  useEffect(() => { setStored('app_github_user', githubUser); }, [githubUser]);

  useEffect(() => { setStored('app_google_user', googleUser); }, [googleUser]);
  useEffect(() => { setStored('app_google_token', googleToken); }, [googleToken]);
  useEffect(() => { setStored('app_github_token', githubToken); }, [githubToken]);
  useEffect(() => { setStored('app_github_profile', githubProfile); }, [githubProfile]);
  useEffect(() => { setStored('app_last_github_repo', githubRepo); }, [githubRepo]);
  useEffect(() => { setStored('app_ai_persona', aiPersona); }, [aiPersona]);
  useEffect(() => { setStored('app_aether_control_notes', aetherControlNotes); }, [aetherControlNotes]);
  useEffect(() => { setStored('app_aether_control_issues', aetherControlIssues); }, [aetherControlIssues]);
  useEffect(() => { setStored('app_aether_control_agents', aetherControlAgents); }, [aetherControlAgents]);
  useEffect(() => { setStored('app_aether_control_brainstorm', aetherControlBrainstorm); }, [aetherControlBrainstorm]);
  useEffect(() => { setStored('app_aether_control_integrations', aetherControlIntegrations); }, [aetherControlIntegrations]);
  useEffect(() => { setStored('app_aether_double_confirm', aetherDoubleConfirm); }, [aetherDoubleConfirm]);
  useEffect(() => { setStored('app_aether_auto_recommend', aetherAutoRecommend); }, [aetherAutoRecommend]);
  useEffect(() => { setStored('app_cortex_synapses', cortexSynapses); }, [cortexSynapses]);
  useEffect(() => { setStored('app_voice_queue', voiceQueue); }, [voiceQueue]);

  const addProject = (p: Omit<Project, 'id' | 'createdAt'>): string => {
    const id = crypto.randomUUID();
    setProjects(prev => [...prev, { ...p, id, createdAt: Date.now() }]);
    return id;
  };
  const updateProject = (id: string, p: Partial<Project>) => {
    setProjects(prev => prev.map(proj => proj.id === id ? { ...proj, ...p } : proj));
  };
  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(proj => proj.id !== id));
    setIssues(prev => prev.filter(i => i.projectId !== id));
    setPhases(prev => prev.filter(p => p.projectId !== id));
    setNotes(prev => prev.filter(n => n.projectId !== id));
    setAssets(prev => prev.filter(a => a.projectId !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const addIssue = (i: Omit<Issue, 'id' | 'createdAt'>) => {
    setIssues(prev => [...prev, { ...i, id: crypto.randomUUID(), createdAt: Date.now() }]);
  };
  const updateIssue = (id: string, i: Partial<Issue>) => {
    setIssues(prev => prev.map(iss => iss.id === id ? { ...iss, ...i } : iss));
  };
  const deleteIssue = (id: string) => {
    setIssues(prev => prev.filter(iss => iss.id !== id));
  };

  const addPhase = (p: Omit<Phase, 'id'>) => {
    setPhases(prev => [...prev, { ...p, id: crypto.randomUUID() }]);
  };
  const updatePhase = (id: string, p: Partial<Phase>) => {
    setPhases(prev => prev.map(ph => ph.id === id ? { ...ph, ...p } : ph));
  };
  const deletePhase = (id: string) => {
    setPhases(prev => prev.filter(ph => ph.id !== id));
  };

  const addNote = (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    setNotes(prev => [...prev, { ...n, id: crypto.randomUUID(), createdAt: now, updatedAt: now }]);
  };
  const updateNote = (id: string, n: Partial<Note>) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, ...n, updatedAt: Date.now() } : note));
  };
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const startProjectDreaming = async (
    projectId: string,
    focusMode: 'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general' = 'refactor'
  ): Promise<void> => {
    const initialLogs = [
      `🌐 Activating Autonomous Agents Dreaming Engine with mode: [${focusMode.toUpperCase()}]...`,
      "🔍 Agent ScrumMaster loading workspace model structures...",
      "📈 Scanning delivery milestone health boards..."
    ];

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          isDreamingActive: true,
          dreamProgress: 10,
          dreamFocus: focusMode,
          dreamLogs: initialLogs,
          lastDreamedTime: Date.now()
        };
      }
      return p;
    }));

    let progress = 10;
    const currentLogs = [...initialLogs];

    const intervalId = setInterval(() => {
      progress += 10;
      if (progress >= 90) {
        clearInterval(intervalId);
        return;
      }

      const logChoices = [
        "🤖 Analyzing package security configurations...",
        "⚡ Inspecting AST node compliance schemas...",
        "⚙️ Running lint verification patterns on project resources...",
        "🔮 Synthesizing recommended patches and performance suggestions..."
      ];
      const selectedLog = logChoices[Math.floor(Math.random() * logChoices.length)];
      currentLogs.push(selectedLog);

      setProjects(prev => prev.map(p => {
        if (p.id === projectId && p.isDreamingActive) {
          return {
            ...p,
            dreamProgress: progress,
            dreamLogs: [...currentLogs]
          };
        }
        return p;
      }));
    }, 1500);

    const targetProj = projects.find(p => p.id === projectId) || projects[0];
    if (!targetProj) {
      clearInterval(intervalId);
      return;
    }

    let focusInstruction = "focused on refactoring, scalability, and code cleanliness optimizations.";
    if (focusMode === "security") {
      focusInstruction = "focused on vulnerability scanning, secure headers, API protection, input sanitization, and encryption audits.";
    } else if (focusMode === "performance") {
      focusInstruction = "focused on bundle size minimization, high-fidelity fast rendering, caching strategies, and lazy loader integrations.";
    } else if (focusMode === "accessibility") {
      focusInstruction = "focused on aria-labels, accessibility standards (WCAG), semantic HTML tags, code standards, and device touch targeting gradients.";
    } else if (focusMode === "design") {
      focusInstruction = "focused on incredible visual design, typography elements, spacing metrics, polished styling details, hover transitions, layouts, and responsive bento-grid patterns.";
    } else if (focusMode === "new_ideas") {
      focusInstruction = "focused on innovative, brand new product ideas, creative features, core value concepts, and expansion specs.";
    } else if (focusMode === "general") {
      focusInstruction = "focused on broad codebase self-improvement, clean styling, robustness, accessibility, performance, and general coding improvements.";
    }

    const stackList = [
      ...(targetProj.frameworks || []),
      ...(targetProj.customStack || [])
    ];

    const promptText = `Act as an autonomous software consultant agent. Suggest exactly 3 highly specific code fixes, security patches, or architecture enhancement recommendations specifically tailored for stack [${stackList.join(", ")}] with description: "${targetProj.description}".
The recommendations must be elements ${focusInstruction}
Ensure ideas are unique, highly comprehensive, structured, feature-rich, and contain extremely detailed, robust, and longer code snippets explaining all configurations. Ensure responses are longer, extensive, and highly formatted with clear steps.

Format your response EXACTLY like this separating recommendations with "---REC---":
Title
Description of fix or enhancement recommendation
\`\`\`typescript
// Code snippet showing the solution
\`\`\`
`;

    try {
      const response = await fetch("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText }],
          context: `You are ScrumMaster Agent dreaming up deep codebase optimizations.`,
        }),
      });

      let accumText = "";
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const inner = line.slice(6).trim();
              if (inner === "[DONE]") continue;
              try {
                const parsed = JSON.parse(inner);
                if (parsed.text) accumText += parsed.text;
              } catch {}
            }
          }
        }
      }

      clearInterval(intervalId);

      const blocks = accumText.split("---REC---").filter((b) => b.trim());
      const mappedRecs = blocks.map((b, idx) => {
        const parts = b.trim().split("\n");
        const title = parts[0]?.trim() || "Optimization Proposal";
        let codeStartIndex = parts.findIndex((p) => p.trim().startsWith("```"));
        const desc =
          codeStartIndex !== -1
            ? parts.slice(1, codeStartIndex).join(" ").trim()
            : parts.slice(1).join(" ").trim();
        const snippet =
          codeStartIndex !== -1
            ? parts.slice(codeStartIndex).join("\n").trim()
            : "// Actionable suggestion code template";
        return {
          id: `rec-${idx}-${Date.now()}`,
          title,
          description: desc,
          snippet,
          category: focusMode,
          status: 'active' as 'active' | 'approved' | 'dismissed',
          createdAt: Date.now() + idx
        };
      });

      const finalRecs = mappedRecs.length > 0 ? mappedRecs : [
        {
          id: `rec-fallback-1-${Date.now()}`,
          title: focusMode === "security" ? "JWT Verification Middleware Audit" : "Vite Dynamic Bundle Chunk Layout",
          description: focusMode === "security" ? "Secure server routes against unsigned token exploits." : "Speed up initial load speeds by dynamically splitting bundle outputs.",
          snippet: focusMode === "security" ? "import jwt from 'jsonwebtoken';\nexport function verifyToken(req, res, next) {\n  const token = req.headers['authorization'];\n  if (!token) return res.status(401).json({ error: 'Unauthorized' });\n  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {\n    if (err) return res.status(401).json({ error: 'Invalid token' });\n    req.user = decoded;\n    next();\n  });\n}" : "import { defineConfig } from 'vite';\nexport default defineConfig({\n  build: {\n    rollupOptions: {\n      output: {\n        manualChunks: {\n          vendor: ['react', 'react-dom']\n        }\n      }\n    }\n  }\n});",
          category: focusMode,
          status: 'active' as 'active' | 'approved' | 'dismissed',
          createdAt: Date.now()
        }
      ];

      // Automatic deduplication & sorting
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const existingRecs = p.dreamRecommendations || [];
          const combined = [...existingRecs];
          finalRecs.forEach(newRec => {
            if (!combined.some(c => c.title.toLowerCase() === newRec.title.toLowerCase())) {
              combined.push(newRec);
            }
          });
          // Alphabetical Sort
          combined.sort((a, b) => a.title.localeCompare(b.title));

          return {
            ...p,
            dreamRecommendations: combined,
            isDreamingActive: false,
            dreamProgress: 100,
            dreamLogs: [...currentLogs, "✨ Background Dreaming Completed! Alphabetically Sorted & Saved."]
          };
        }
        return p;
      }));

    } catch (e) {
      console.error(e);
      clearInterval(intervalId);
      const fallbackRecs = [
        {
          id: `rec-fallback-err-${Date.now()}`,
          title: "Verify environment credential paths",
          description: "Audit security properties of local process keys to prevent accidental key exposure on Client elements.",
          snippet: "const activeKey = process.env.API_KEY || '';",
          category: focusMode,
          status: 'active' as 'active' | 'approved' | 'dismissed',
          createdAt: Date.now()
        }
      ];
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const existingRecs = p.dreamRecommendations || [];
          const combined = [...existingRecs];
          fallbackRecs.forEach(r => {
            if (!combined.some(c => c.title.toLowerCase() === r.title.toLowerCase())) {
              combined.push(r);
            }
          });
          // Alphabetical Sort
          combined.sort((a, b) => a.title.localeCompare(b.title));

          return {
            ...p,
            dreamRecommendations: combined,
            isDreamingActive: false,
            dreamProgress: 100,
            dreamLogs: [...currentLogs, "⚠️ Dreaming completed with warnings. Offline backup patterns loaded, sorted & structured."]
          };
        }
        return p;
      }));
    }
  };

  const addAsset = (a: Omit<Asset, 'id' | 'createdAt'>) => {
    setAssets(prev => [...prev, { ...a, id: crypto.randomUUID(), createdAt: Date.now() }]);
  };
  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  const addVoiceAction = (action: Omit<VoiceAction, 'id' | 'status' | 'createdAt'>) => {
    setVoiceQueue(prev => [
      {
        ...action,
        id: crypto.randomUUID(),
        status: 'pending',
        createdAt: Date.now()
      },
      ...prev
    ]);
  };

  const updateVoiceActionStatus = (id: string, status: 'approved' | 'rejected' | 'applied') => {
    setVoiceQueue(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  const deleteVoiceAction = (id: string) => {
    setVoiceQueue(prev => prev.filter(v => v.id !== id));
  };

  const applyVoiceAction = (id: string): string => {
    const action = voiceQueue.find(v => v.id === id);
    if (!action) return 'Action not found in queue.';
    if (action.status === 'applied') return 'Action already applied.';

    const { intent, parsedData } = action;
    if (!intent || intent === 'unknown' || !parsedData) {
      return 'No specific project workspace operations could be inferred.';
    }

    let feedback = '';

    switch (intent) {
      case 'create_project': {
        const name = parsedData.name || 'New Voice Project';
        const description = parsedData.description || 'Drafted via AI vocal voice dictation command.';
        const frameworks = parsedData.frameworks || ['React'];
        const customStack = parsedData.customStack || frameworks;

        const newId = addProject({
          name,
          description,
          frameworks,
          customStack,
          status: 'Planning',
          brainstormIdeas: [],
          seenRecommendedIdeas: [],
          dreamRecommendations: []
        });

        setActiveProjectId(newId);
        feedback = `Successfully bootstrapped project "${name}" in Planning state.`;
        break;
      }

      case 'create_issue': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projects.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) {
          projectId = activeProjectId || projects[0]?.id;
        }

        if (!projectId) {
          return 'Failed to append task: No active project context.';
        }

        const projectRef = projects.find(p => p.id === projectId);
        const title = parsedData.title || 'Vocal Task';
        const desc = parsedData.description || 'Transcribed via voice';
        const type = parsedData.type || 'Task';
        const priority = parsedData.priority || 'Medium';

        addIssue({
          projectId,
          title,
          description: desc,
          type,
          priority,
          status: 'Todo'
        });

        feedback = `Added task "${title}" [${type}, ${priority}] into "${projectRef?.name || 'Workspace'}".`;
        break;
      }

      case 'update_issue_status': {
        const mentionTitle = parsedData.issueTitleMentioned?.toLowerCase() || '';
        const newStatus = parsedData.newStatus || 'Done';

        let targetIssue = null;
        if (mentionTitle) {
          targetIssue = issues.find(iss => 
            iss.title.toLowerCase().includes(mentionTitle)
          );
        }
        if (!targetIssue && activeProjectId) {
          targetIssue = issues.find(iss => 
            iss.projectId === activeProjectId && iss.status !== 'Done'
          );
        }

        if (targetIssue) {
          updateIssue(targetIssue.id, { status: newStatus });
          feedback = `Successfully updated status of "${targetIssue.title}" issue to -> "${newStatus}".`;
        } else {
          feedback = `No open issue matching "${parsedData.issueTitleMentioned || 'active backlog items'}" detected to update.`;
        }
        break;
      }

      case 'add_brainstorm_idea': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projects.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) projectId = activeProjectId || projects[0]?.id;

        if (!projectId) {
          return 'Could not register brainstorm: No active project context.';
        }

        const projectRef = projects.find(p => p.id === projectId);
        if (!projectRef) return 'Project lookup reference missing.';

        const text = parsedData.text || 'Voice brainstorm idea input';
        const details = parsedData.details || '';

        const existing = projectRef.brainstormIdeas || [];
        const newIdea = {
          id: crypto.randomUUID(),
          text,
          details,
          status: 'pending' as const,
          createdAt: Date.now()
        };

        updateProject(projectId, {
          brainstormIdeas: [...existing, newIdea]
        });

        feedback = `Appended brainstorm idea "${text}" under project "${projectRef.name}".`;
        break;
      }

      case 'add_note': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projects.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) projectId = activeProjectId || projects[0]?.id;

        if (!projectId) {
          return 'No project available to attach note.';
        }

        const projectRef = projects.find(p => p.id === projectId);
        const title = parsedData.title || `Voice Note - ${new Date().toLocaleTimeString()}`;
        const content = parsedData.content || 'Doc transcribed via AI interface.';
        const tags = parsedData.tags || ['Voice'];

        addNote({
          projectId,
          title,
          content,
          tags
        });

        feedback = `Committed voice documentation note "${title}" under project "${projectRef?.name || 'Workspace'}".`;
        break;
      }

      case 'add_cortex_synapse': {
        const name = parsedData.name || parsedData.title || `Cognitive Standard - ${Date.now()}`;
        const desc = parsedData.desc || parsedData.description || 'Behavior constraint formulated via workspace assistant.';
        const type = 'custom_synapse' as const;

        const newSynapse = {
          id: `synapse-${crypto.randomUUID()}`,
          name,
          desc,
          type,
          createdAt: Date.now()
        };

        setCortexSynapses(prev => [...(prev || []), newSynapse]);
        feedback = `Successfully anchored new rule "${name}" in the Obsidian Synaptic Cortex!`;
        break;
      }

      case 'approve_dream_recommendation': {
        const mentionTitle = parsedData.title || parsedData.text || parsedData.issueTitleMentioned || '';
        let matchedRec: any = null;
        let matchedProj: any = null;

        // Traverse projects and find a dream recommendation matching search query title
        for (const proj of projects) {
          const recs = proj.dreamRecommendations || [];
          const found = recs.find((r: any) => 
            r.title.toLowerCase().includes(mentionTitle.toLowerCase()) || 
            mentionTitle.toLowerCase().includes(r.title.toLowerCase())
          );
          if (found) {
            matchedRec = found;
            matchedProj = proj;
            break;
          }
        }

        // Fallback: if no query match, grab the first active dream rec we find
        if (!matchedRec && mentionTitle === '') {
          for (const proj of projects) {
            const recs = proj.dreamRecommendations || [];
            const found = recs.find((r: any) => r.status === 'active');
            if (found) {
              matchedRec = found;
              matchedProj = proj;
              break;
            }
          }
        }

        if (matchedRec && matchedProj) {
          const ideaId = `idea-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newIdeaItem = {
            id: ideaId,
            text: matchedRec.title,
            details: `${matchedRec.description}\n\nCode Snippet Proposal:\n${matchedRec.snippet}`,
            status: "approved" as const,
            createdAt: Date.now(),
          };

          const updatedIdeas = [
            ...(matchedProj.brainstormIdeas || []),
            newIdeaItem,
          ];

          // Deduplicate brainstorming pool by title
          const uniqueIdeas = [];
          const seen = new Set();
          for (const x of updatedIdeas) {
            const key = x.text.trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              uniqueIdeas.push(x);
            }
          }
          uniqueIdeas.sort((a,b) => a.text.localeCompare(b.text));

          const updatedRecs = (matchedProj.dreamRecommendations || []).map((d: any) => {
            if (d.id === matchedRec.id) {
              return { ...d, status: 'approved' as const };
            }
            return d;
          });

          // Update project state in-place
          updateProject(matchedProj.id, {
            brainstormIdeas: uniqueIdeas,
            dreamRecommendations: updatedRecs
          });

          // If brainstorm-sandbox project exists, sync with sandbox pool too
          const sandboxProj = projects.find((p: any) => p.id === "brainstorm-sandbox");
          if (sandboxProj && sandboxProj.id !== matchedProj.id) {
            const sandboxIdeas = [
              ...(sandboxProj.brainstormIdeas || []),
              newIdeaItem
            ];
            const uniqueSandbox = [];
            const seenS = new Set();
            for (const x of sandboxIdeas) {
              const key = x.text.trim().toLowerCase();
              if (!seenS.has(key)) {
                seenS.add(key);
                uniqueSandbox.push(x);
              }
            }
            uniqueSandbox.sort((a, b) => a.text.localeCompare(b.text));
            updateProject(sandboxProj.id, { brainstormIdeas: uniqueSandbox });
          }

          feedback = `Successfully approved choice suggestion: "${matchedRec.title}"! Promoted into project "${matchedProj.name}" Brainstorm Sandbox.`;
        } else {
          feedback = `No active code optimization proposals matching query details were identified to approve.`;
        }
        break;
      }

      default:
        feedback = 'Transcript generated, but no automated routing was applicable.';
    }

    setVoiceQueue(prev => prev.map(v => v.id === id ? { ...v, status: 'applied', explanation: feedback } : v));
    return feedback;
  };

  return (
    <DataContext.Provider value={{
      projects, setProjects, addProject, updateProject, deleteProject, startProjectDreaming,
      issues, setIssues, addIssue, updateIssue, deleteIssue,
      phases, setPhases, addPhase, updatePhase, deletePhase,
      notes, setNotes, addNote, updateNote, deleteNote,
      assets, setAssets, addAsset, deleteAsset,
      activeProjectId, setActiveProjectId,
      agents, setAgents,
      aiContextRules, setAiContextRules,
      githubUser, setGithubUser,
      googleUser, setGoogleUser,
      googleToken, setGoogleToken,
      githubToken, setGithubToken,
      githubProfile, setGithubProfile,
      githubRepo, setGithubRepo,
      aiPersona, setAiPersona,
      aetherControlNotes, setAetherControlNotes,
      aetherControlIssues, setAetherControlIssues,
      aetherControlAgents, setAetherControlAgents,
      aetherControlBrainstorm, setAetherControlBrainstorm,
      aetherControlIntegrations, setAetherControlIntegrations,
      aetherDoubleConfirm, setAetherDoubleConfirm,
      aetherAutoRecommend, setAetherAutoRecommend,
      cortexSynapses, setCortexSynapses,
      voiceQueue, setVoiceQueue, addVoiceAction, updateVoiceActionStatus, deleteVoiceAction, applyVoiceAction,
      passcodePin, setPasscodePin
    }}>
      {children}
    </DataContext.Provider>
  );
}
