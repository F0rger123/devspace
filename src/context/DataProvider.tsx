import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc, query, where, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, auth } from '../lib/auth';
import { Toast, ToastContainer } from '../components/ui/Toast';
import { useStore, KineticGesture } from '../store';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const firebaseAuth = getAuth();
  const isSandbox = typeof window !== 'undefined' && window.localStorage.getItem('app_auth_mode') === 'sandbox';
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth.currentUser?.uid || null,
      email: firebaseAuth.currentUser?.email || null,
      emailVerified: firebaseAuth.currentUser?.emailVerified || null,
      isAnonymous: firebaseAuth.currentUser?.isAnonymous || null,
      tenantId: firebaseAuth.currentUser?.tenantId || null,
      providerInfo: firebaseAuth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (!isSandbox) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => sanitizeForFirestore(v)).filter(v => v !== undefined && v !== null);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined && val !== null) {
        res[key] = sanitizeForFirestore(val);
      }
    }
    return res;
  }
  return obj;
}

export async function setDocWithSanitize(ref: any, data: any) {
  return setDoc(ref, sanitizeForFirestore(data));
}

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
  isPublic?: boolean;
  tags?: string[];
  starsCount?: number;
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
  ownerId?: string;
  collaborators?: string[];
  collaboratorRoles?: { [email: string]: 'admin' | 'editor' | 'viewer' };
  githubPushPolicy?: 'owner' | 'admins' | 'editors' | 'open';
  gitHubCollaboratorUsernames?: { [email: string]: string };
  gitHubCollaboratorStatus?: { [email: string]: 'none' | 'pending' | 'active' };
  collaboratorPermissions?: { [email: string]: { canPushToGit: boolean; canViewCode: boolean; canEditRoadmap: boolean; canInviteOthers: boolean } };
};

export type Issue = {
  id: string;
  projectId: string;
  parentId?: string; // ID of the parent Issue/Task for nested sub-tasks
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

export type VoiceTrigger = {
  phrase: string;
  path: string;
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

  aetherPersonalityRules: string[];
  setAetherPersonalityRules: React.Dispatch<React.SetStateAction<string[]>>;

  githubUser: string;
  setGithubUser: React.Dispatch<React.SetStateAction<string>>;

  googleUser: any;
  setGoogleUser: React.Dispatch<React.SetStateAction<any>>;
  userProfile: any | null;
  updateUserProfile: (updates: { 
    displayName?: string, 
    avatarColor?: string, 
    title?: string, 
    bio?: string, 
    isPrivate?: boolean,
    githubUrl?: string,
    websiteUrl?: string,
    techStack?: string
  }) => Promise<void>;
  invitations: any[];
  setInvitations: React.Dispatch<React.SetStateAction<any[]>>;
  sendInvitation: (projectId: string, receiverEmail: string, role?: 'admin' | 'editor' | 'viewer', permissions?: any, receiverUsername?: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  updateCollaboratorRole: (projectId: string, email: string, role: 'admin' | 'editor' | 'viewer') => Promise<void>;
  removeCollaborator: (projectId: string, email: string) => Promise<void>;
  notifications?: any[];
  addNotification?: (n: {
    userId: string;
    type: 'star' | 'comment' | 'friend_request' | 'message' | 'collab_request' | 'collab_accept';
    title: string;
    description: string;
    senderId?: string;
    senderName?: string;
    projectId?: string;
    projectName?: string;
  }) => Promise<void>;
  markNotificationRead?: (id: string) => Promise<void>;
  clearAllNotifications?: () => Promise<void>;
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
  aetherModel: string;
  setAetherModel: React.Dispatch<React.SetStateAction<string>>;
  aetherConciseness: string;
  setAetherConciseness: React.Dispatch<React.SetStateAction<string>>;
  aetherThinkingLevel: string;
  setAetherThinkingLevel: React.Dispatch<React.SetStateAction<string>>;
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
  voiceTriggers: VoiceTrigger[];
  setVoiceTriggers: React.Dispatch<React.SetStateAction<VoiceTrigger[]>>;
  wakeWord: string;
  setWakeWord: React.Dispatch<React.SetStateAction<string>>;
  isWakeWordEnabled: boolean;
  setIsWakeWordEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  vocalDiagnostics: string[];
  setVocalDiagnostics: React.Dispatch<React.SetStateAction<string[]>>;
  addVocalDiagnostic: (msg: string) => void;
  trainedPhrases: string[];
  setTrainedPhrases: React.Dispatch<React.SetStateAction<string[]>>;
  trainedWakeWordModel: {
    audioBase64?: string;
    pitchHz?: number;
    resonanceConfidence?: number;
    vocalFrequenceScore?: number;
    calibratedAt?: string;
  } | null;
  setTrainedWakeWordModel: React.Dispatch<React.SetStateAction<any>>;
  selectedVoiceName: string;
  setSelectedVoiceName: React.Dispatch<React.SetStateAction<string>>;
  speechPitch: number;
  setSpeechPitch: React.Dispatch<React.SetStateAction<number>>;
  speechRate: number;
  setSpeechRate: React.Dispatch<React.SetStateAction<number>>;
  activationShortcutKey: string;
  setActivationShortcutKey: React.Dispatch<React.SetStateAction<string>>;
  activationShortcutMouse: string;
  setActivationShortcutMouse: React.Dispatch<React.SetStateAction<string>>;
  stopShortcutKey: string;
  setStopShortcutKey: React.Dispatch<React.SetStateAction<string>>;
  stopShortcutMouse: string;
  setStopShortcutMouse: React.Dispatch<React.SetStateAction<string>>;

  micShortcutKey: string;
  setMicShortcutKey: React.Dispatch<React.SetStateAction<string>>;
  micShortcutMouse: string;
  setMicShortcutMouse: React.Dispatch<React.SetStateAction<string>>;
  clearShortcutKey: string;
  setClearShortcutKey: React.Dispatch<React.SetStateAction<string>>;
  clearShortcutMouse: string;
  setClearShortcutMouse: React.Dispatch<React.SetStateAction<string>>;
  muteVoiceShortcutKey: string;
  setMuteVoiceShortcutKey: React.Dispatch<React.SetStateAction<string>>;
  muteVoiceShortcutMouse: string;
  setMuteVoiceShortcutMouse: React.Dispatch<React.SetStateAction<string>>;
  navProjectsShortcutKey: string;
  setNavProjectsShortcutKey: React.Dispatch<React.SetStateAction<string>>;
  navProjectsShortcutMouse: string;
  setNavProjectsShortcutMouse: React.Dispatch<React.SetStateAction<string>>;
  navNotesShortcutKey: string;
  setNavNotesShortcutKey: React.Dispatch<React.SetStateAction<string>>;
  navNotesShortcutMouse: string;
  setNavNotesShortcutMouse: React.Dispatch<React.SetStateAction<string>>;
  navRoadmapShortcutKey: string;
  setNavRoadmapShortcutKey: React.Dispatch<React.SetStateAction<string>>;
  navRoadmapShortcutMouse: string;
  setNavRoadmapShortcutMouse: React.Dispatch<React.SetStateAction<string>>;

  isAssistantMinimized: boolean;
  setIsAssistantMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  isAssistantOpen: boolean;
  setIsAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;

  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSyncedTime: number | null;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  triggerFullSync: () => Promise<void>;

  // Centralized Macro Registry
  macroRegistry: KineticGesture[];
  toggleMacroMapping: (id: string) => void;
  testMacroMapping: (id: string) => void;

  // Cloud Sync & Sharing Feature APIs
  backupKineticConfig: () => Promise<void>;
  restoreKineticConfig: () => Promise<void>;
  isSyncingConfig: boolean;
  sharedMacros: SharedMacro[];
  setSharedMacros: React.Dispatch<React.SetStateAction<SharedMacro[]>>;
  publishMacro: (title: string, description: string, gestures: KineticGesture[]) => Promise<boolean>;
  deleteSharedMacro: (macroId: string) => Promise<void>;
  likeSharedMacro: (macroId: string) => Promise<void>;
  incrementDownloadsSharedMacro: (macroId: string) => Promise<void>;
};

export interface SharedMacro {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  gestures: KineticGesture[];
  likesCount: number;
  downloadsCount: number;
  createdAt: number;
}

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
  const [aetherPersonalityRules, setAetherPersonalityRules] = useState<string[]>(() => getStored('app_aether_personality_rules', []));
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
  const [userProfile, setUserProfile] = useState<any | null>(() => getStored('app_user_profile', null));
  const [invitations, setInvitations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [googleToken, setGoogleToken] = useState<string | null>(() => getStored('app_google_token', null));
  const [githubToken, setGithubToken] = useState<string | null>(() => getStored('app_github_token', null));
  const [githubProfile, setGithubProfile] = useState<any>(() => getStored('app_github_profile', null));
  const [githubRepo, setGithubRepo] = useState<string | null>(() => getStored('app_last_github_repo', null));
  const [aiPersona, setAiPersona] = useState<string>(() => getStored('app_ai_persona', 'Scrum Master'));
  
  const [voiceTriggers, setVoiceTriggers] = useState<VoiceTrigger[]>(() => {
    const list = getStored<VoiceTrigger[]>('app_voice_triggers', []);
    if (list.length === 0) {
      return [
        { phrase: 'go to projects', path: '/projects' },
        { phrase: 'show projects', path: '/projects' },
        { phrase: 'go to roadmap', path: '/roadmap' },
        { phrase: 'show roadmap', path: '/roadmap' },
        { phrase: 'go to dashboard', path: '/' },
        { phrase: 'show dashboard', path: '/' },
        { phrase: 'go to issues', path: '/issues' },
        { phrase: 'show issues', path: '/issues' },
        { phrase: 'go to notes', path: '/notes' },
        { phrase: 'show notes', path: '/notes' },
        { phrase: 'open settings', path: '/settings' },
        { phrase: 'go to settings', path: '/settings' },
        { phrase: 'go to ideas', path: '/ideas' },
        { phrase: 'go to agents', path: '/agents' },
        { phrase: 'go to brain', path: '/brain' },
      ];
    }
    return list;
  });
  const [wakeWord, setWakeWord] = useState<string>(() => getStored('app_voice_lakeword', 'hey aether'));
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState<boolean>(() => getStored('app_voice_wakeword_enabled', true));
  
  const [vocalDiagnostics, setVocalDiagnostics] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] INFO: Bootstrapping high-fidelity vocal synapse engine...`,
    `[${new Date().toLocaleTimeString()}] INFO: Web Speech API detected. Initializing standby listeners.`
  ]);

  const addVocalDiagnostic = (msg: string) => {
    setVocalDiagnostics(prev => {
      const updated = [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev];
      return updated.slice(0, 35);
    });
  };

  const [trainedPhrases, setTrainedPhrases] = useState<string[]>(() => getStored<string[]>('app_trained_phrases', []));
  const [trainedWakeWordModel, setTrainedWakeWordModel] = useState<any>(() => getStored<any>('app_trained_wakeword_model', null));
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => getStored('app_speech_selected_voice', ''));
  const [speechPitch, setSpeechPitch] = useState<number>(() => getStored('app_speech_pitch', 1.0));
  const [speechRate, setSpeechRate] = useState<number>(() => getStored('app_speech_rate', 1.05));
  
  const [activationShortcutKey, setActivationShortcutKey] = useState<string>(() => getStored('app_shortcut_activation_key', 'Alt+k'));
  const [activationShortcutMouse, setActivationShortcutMouse] = useState<string>(() => getStored('app_shortcut_activation_mouse', 'none'));
  const [stopShortcutKey, setStopShortcutKey] = useState<string>(() => getStored('app_shortcut_stop_key', 'Escape'));
  const [stopShortcutMouse, setStopShortcutMouse] = useState<string>(() => getStored('app_shortcut_stop_mouse', 'none'));

  const [micShortcutKey, setMicShortcutKey] = useState<string>(() => getStored('app_shortcut_mic_key', 'Alt+m'));
  const [micShortcutMouse, setMicShortcutMouse] = useState<string>(() => getStored('app_shortcut_mic_mouse', 'none'));
  const [clearShortcutKey, setClearShortcutKey] = useState<string>(() => getStored('app_shortcut_clear_key', 'Alt+c'));
  const [clearShortcutMouse, setClearShortcutMouse] = useState<string>(() => getStored('app_shortcut_clear_mouse', 'none'));
  const [muteVoiceShortcutKey, setMuteVoiceShortcutKey] = useState<string>(() => getStored('app_shortcut_mute_key', 'Alt+u'));
  const [muteVoiceShortcutMouse, setMuteVoiceShortcutMouse] = useState<string>(() => getStored('app_shortcut_mute_mouse', 'none'));
  const [navProjectsShortcutKey, setNavProjectsShortcutKey] = useState<string>(() => getStored('app_shortcut_nav_projects_key', 'Alt+p'));
  const [navProjectsShortcutMouse, setNavProjectsShortcutMouse] = useState<string>(() => getStored('app_shortcut_nav_projects_mouse', 'none'));
  const [navNotesShortcutKey, setNavNotesShortcutKey] = useState<string>(() => getStored('app_shortcut_nav_notes_key', 'Alt+n'));
  const [navNotesShortcutMouse, setNavNotesShortcutMouse] = useState<string>(() => getStored('app_shortcut_nav_notes_mouse', 'none'));
  const [navRoadmapShortcutKey, setNavRoadmapShortcutKey] = useState<string>(() => getStored('app_shortcut_nav_roadmap_key', 'Alt+r'));
  const [navRoadmapShortcutMouse, setNavRoadmapShortcutMouse] = useState<string>(() => getStored('app_shortcut_nav_roadmap_mouse', 'none'));

  const [isAssistantMinimized, setIsAssistantMinimized] = useState<boolean>(() => getStored('app_assistant_minimized', false));
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  
  const [aetherControlNotes, setAetherControlNotes] = useState<boolean>(() => getStored('app_aether_control_notes', true));
  const [aetherControlIssues, setAetherControlIssues] = useState<boolean>(() => getStored('app_aether_control_issues', true));
  const [aetherControlAgents, setAetherControlAgents] = useState<boolean>(() => getStored('app_aether_control_agents', true));
  const [aetherControlBrainstorm, setAetherControlBrainstorm] = useState<boolean>(() => getStored('app_aether_control_brainstorm', true));
  const [aetherControlIntegrations, setAetherControlIntegrations] = useState<boolean>(() => getStored('app_aether_control_integrations', false));
  const [aetherDoubleConfirm, setAetherDoubleConfirm] = useState<boolean>(() => getStored('app_aether_double_confirm', false));
  const [aetherAutoRecommend, setAetherAutoRecommend] = useState<boolean>(() => getStored('app_aether_auto_recommend', true));
  const [aetherModel, setAetherModel] = useState<string>(() => getStored('app_aether_model', 'gemini-3.5-flash'));
  const [aetherConciseness, setAetherConciseness] = useState<string>(() => getStored('app_aether_conciseness', 'balanced'));
  const [aetherThinkingLevel, setAetherThinkingLevel] = useState<string>(() => getStored('app_aether_thinking_level', 'auto'));
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
    return getStored<string>('whatsapp_passcode_pin', '');
  });

  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // Sync and Toast States & Handlers
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<number | null>(null);
  const [activeSyncs, setActiveSyncs] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSyncToastTimeRef = useRef<number>(0);

  const showToast = (message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const startSync = (key: string) => {
    setSyncStatus('saving');
    setActiveSyncs(prev => prev.includes(key) ? prev : [...prev, key]);
  };

  const endSync = (key: string, success: boolean = true) => {
    setActiveSyncs(prev => {
      const updated = prev.filter(k => k !== key);
      if (updated.length === 0) {
        setSyncStatus(success ? 'saved' : 'error');
        if (success) {
          setLastSyncedTime(Date.now());
        }
      }
      return updated;
    });
  };

  const triggerFullSync = async () => {
    startSync('manual-sync');
    try {
      // 1. Sync to Server cache
      await fetchWithAuth('/api/voice/sync-cache', {
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
          aetherPersonalityRules,
          passcodePin,
          githubToken
        })
      });

      // 2. Sync projects to Firestore
      for (const proj of projects) {
        await setDocWithSanitize(doc(db, 'projects', proj.id), proj);
      }

      // 3. Sync issues to Firestore
      for (const iss of issues) {
        await setDocWithSanitize(doc(db, 'issues', iss.id), iss);
      }

      // 4. Sync notes to Firestore
      for (const note of notes) {
        await setDocWithSanitize(doc(db, 'notes', note.id), note);
      }

      // 5. Sync synapses to Firestore
      for (const syn of cortexSynapses) {
        await setDocWithSanitize(doc(db, 'cortexSynapses', syn.id), syn);
      }

      endSync('manual-sync', true);
      showToast('Manual workspace sync completed successfully.', 'success', 3000);
    } catch (e) {
      console.error("Manual synchronization failed:", e);
      endSync('manual-sync', false);
      showToast('Manual workspace sync failed. Check console for details.', 'error', 3000);
    }
  };

  // Trigger throttled success / error toasts based on sync status
  useEffect(() => {
    if (syncStatus === 'saved' && lastSyncedTime) {
      const now = Date.now();
      if (now - lastSyncToastTimeRef.current > 12000) {
        showToast('All changes synchronized with Firestore.', 'success', 2500);
        lastSyncToastTimeRef.current = now;
      }
    } else if (syncStatus === 'error') {
      showToast('Workspace synchronization failed. Please verify your connection.', 'error', 4000);
    }
  }, [syncStatus, lastSyncedTime]);

  const fetchWithAuth = async (url: string, options: any = {}, retries = 3, delay = 1000): Promise<Response> => {
    const headers = { ...(options.headers || {}) };
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      } catch (e) {
        console.warn("Failed to get idToken for authenticated request:", e);
      }
    }
    try {
      return await fetch(url, { ...options, headers });
    } catch (e: any) {
      const isNetworkError = e instanceof TypeError || e.message?.includes('fetch') || e.message?.includes('NetworkError');
      if (retries > 0 && isNetworkError) {
        console.warn(`[AutoSync] Fetch to ${url} failed. Retrying in ${delay}ms... (${retries} retries left)`, e);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithAuth(url, options, retries - 1, delay * 2);
      }
      throw e;
    }
  };

  const safeJsonFromResponse = async (res: Response): Promise<any> => {
    try {
      const text = await res.text();
      if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
        return JSON.parse(text);
      } else {
        console.warn(`[SafeJSON] Expected JSON response but received non-JSON payload starting with: ${text ? text.slice(0, 100).replace(/\s+/g, ' ') : 'empty'}`);
      }
    } catch (e) {
      console.warn("[SafeJSON] Failed to parse response as JSON:", e);
    }
    return null;
  };

  // Fetch server state cache on mount and sync with Firestore
  useEffect(() => {
    async function loadServerState() {
      let finalProjects: Project[] = [];
      let finalIssues: Issue[] = [];

      try {
        const res = await fetchWithAuth('/api/voice/sync-cache');
        if (res.ok) {
          const data = await safeJsonFromResponse(res);
          if (data) {
            if (data.initialized) {
              // Server has backup disk persistence, treat it as single absolute authority (even if arrays are empty)
              finalProjects = data.projects || [];
              finalIssues = data.issues || [];
              setProjects(finalProjects);
              setIssues(finalIssues);
              setNotes(data.notes || []);
              setPhases(data.phases || []);
              setAgents(data.agents || []);
              setCortexSynapses(data.cortexSynapses || []);
              if (typeof data.aiContextRules === 'string') setAiContextRules(data.aiContextRules);
              if (Array.isArray(data.aetherPersonalityRules)) setAetherPersonalityRules(data.aetherPersonalityRules);
              if (typeof data.passcodePin === 'string') {
                setPasscodePin(data.passcodePin);
                localStorage.setItem('whatsapp_passcode_pin', data.passcodePin);
              }
            } else {
              // Server not yet initialized, load whatever we have in localStorage or defaults, and save it up
              if (Array.isArray(data.projects) && data.projects.length > 0) {
                finalProjects = data.projects;
                setProjects(data.projects);
              }
              if (Array.isArray(data.issues) && data.issues.length > 0) {
                finalIssues = data.issues;
                setIssues(data.issues);
              }
              if (Array.isArray(data.notes) && data.notes.length > 0) setNotes(data.notes);
              if (Array.isArray(data.phases) && data.phases.length > 0) setPhases(data.phases);
              if (Array.isArray(data.agents) && data.agents.length > 0) setAgents(data.agents);
              if (Array.isArray(data.cortexSynapses) && data.cortexSynapses.length > 0) setCortexSynapses(data.cortexSynapses);
              if (typeof data.aiContextRules === 'string' && data.aiContextRules) setAiContextRules(data.aiContextRules);
              if (Array.isArray(data.aetherPersonalityRules) && data.aetherPersonalityRules.length > 0) setAetherPersonalityRules(data.aetherPersonalityRules);
              if (typeof data.passcodePin === 'string' && data.passcodePin) {
                setPasscodePin(data.passcodePin);
                localStorage.setItem('whatsapp_passcode_pin', data.passcodePin);
              }
            }
          }
        }
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
          console.warn("Failed to load server state cache (offline/network error):", e.message);
        } else {
          console.error("Failed to load server state cache:", e);
        }
      }

      // If they were empty, load defaults from state/localStorage
      if (finalProjects.length === 0) {
        finalProjects = getStored<Project[]>('app_projects', []);
      }
      if (finalIssues.length === 0) {
        finalIssues = getStored<Issue[]>('app_issues', []);
      }

      // Synchronize with Firestore
      try {
        let fbProjects: Project[] = [];
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Fetch owned projects
          try {
            const ownedQuery = query(collection(db, 'projects'), where('ownerId', '==', currentUser.uid));
            const ownedSnap = await getDocs(ownedQuery);
            ownedSnap.forEach((docSnap) => {
              fbProjects.push(docSnap.data() as Project);
            });
          } catch (err) {
            console.warn("Failed to fetch owned projects:", err);
          }

          // Fetch collaborative projects
          if (currentUser.email) {
            try {
              const collabQuery = query(collection(db, 'projects'), where('collaborators', 'array-contains', currentUser.email.trim().toLowerCase()));
              const collabSnap = await getDocs(collabQuery);
              collabSnap.forEach((docSnap) => {
                const proj = docSnap.data() as Project;
                if (!fbProjects.some(p => p.id === proj.id)) {
                  fbProjects.push(proj);
                }
              });
            } catch (err) {
              console.warn("Failed to fetch collab projects:", err);
            }
          }
        }

        const allowedProjectIds = fbProjects.map(p => p.id);
        const allowedProjectNames = fbProjects.map(p => (p.name || '').toLowerCase());

        const fbIssues: Issue[] = [];
        try {
          const issuesSnap = await getDocs(collection(db, 'issues'));
          issuesSnap.forEach((docSnap) => {
            const item = docSnap.data() as Issue;
            if (allowedProjectIds.includes(item.projectId)) {
              fbIssues.push(item);
            }
          });
        } catch (err: any) {
          console.warn("Failed to retrieve issues from Firestore:", err.message || err);
        }

        const fbNotes: Note[] = [];
        try {
          const notesSnap = await getDocs(collection(db, 'notes'));
          notesSnap.forEach((docSnap) => {
            const item = docSnap.data() as Note;
            if (allowedProjectIds.includes(item.projectId)) {
              fbNotes.push(item);
            }
          });
        } catch (e: any) {
          console.warn("Failed to retrieve notes from Firestore:", e.message || e);
        }

        const fbSynapses: CortexSynapse[] = [];
        try {
          const synapsesSnap = await getDocs(collection(db, 'cortexSynapses'));
          synapsesSnap.forEach((docSnap) => {
            const item = docSnap.data() as CortexSynapse;
            if (!item.projectName || allowedProjectNames.includes(item.projectName.toLowerCase())) {
              fbSynapses.push(item);
            }
          });
        } catch (e: any) {
          console.warn("Failed to retrieve synapses from Firestore:", e.message || e);
        }

        if (fbProjects.length > 0) {
          // Merge fbProjects with finalProjects (from server cache) to protect dreamed recommendations and progress
          const mergedProjects = fbProjects.map(fbP => {
            const serverP = finalProjects.find(sp => sp.id === fbP.id);
            if (serverP) {
              const currentRecs = fbP.dreamRecommendations || [];
              const serverRecs = serverP.dreamRecommendations || [];
              const mergedRecs = [...currentRecs];
              serverRecs.forEach((sr: any) => {
                if (!mergedRecs.some((r: any) => r.id === sr.id || r.title.toLowerCase() === sr.title.toLowerCase())) {
                  mergedRecs.push(sr);
                }
              });
              
              const currentBrainstorms = fbP.brainstormIdeas || [];
              const serverBrainstorms = serverP.brainstormIdeas || [];
              const mergedBrainstorms = [...currentBrainstorms];
              serverBrainstorms.forEach((sb: any) => {
                if (!mergedBrainstorms.some((b: any) => b.id === sb.id || b.text.toLowerCase() === sb.text.toLowerCase())) {
                  mergedBrainstorms.push(sb);
                }
              });

              return {
                ...fbP,
                dreamRecommendations: mergedRecs,
                brainstormIdeas: mergedBrainstorms,
                isDreamingActive: fbP.isDreamingActive ?? serverP.isDreamingActive,
                dreamProgress: fbP.dreamProgress ?? serverP.dreamProgress,
                dreamLogs: fbP.dreamLogs || serverP.dreamLogs || [],
                dreamFocus: fbP.dreamFocus || serverP.dreamFocus,
                lastDreamedTime: fbP.lastDreamedTime || serverP.lastDreamedTime
              };
            }
            return fbP;
          });
          setProjects(mergedProjects);
          finalProjects = mergedProjects;
        } else if (finalProjects.length > 0) {
          // Empty in Firestore, seed with currently resolved projects
          for (const proj of finalProjects) {
            try {
              await setDocWithSanitize(doc(db, 'projects', proj.id), proj);
            } catch (err: any) {
              console.warn(`Failed to seed project ${proj.id}:`, err.message || err);
            }
          }
        }

        if (fbIssues.length > 0) {
          setIssues(fbIssues);
          finalIssues = fbIssues;
        } else if (finalIssues.length > 0) {
          // Empty in Firestore, seed with currently resolved issues
          for (const iss of finalIssues) {
            try {
              await setDocWithSanitize(doc(db, 'issues', iss.id), iss);
            } catch (err: any) {
              console.warn(`Failed to seed issue ${iss.id}:`, err.message || err);
            }
          }
        }

        if (fbNotes.length > 0) {
          setNotes(fbNotes);
        } else {
          const localNotes = getStored<Note[]>('app_notes', []);
          if (localNotes.length > 0) {
            for (const note of localNotes) {
              try {
                await setDocWithSanitize(doc(db, 'notes', note.id), note);
              } catch (err: any) {
                console.warn(`Failed to seed note ${note.id}:`, err.message || err);
              }
            }
          }
        }

        if (fbSynapses.length > 0) {
          setCortexSynapses(fbSynapses);
        } else {
          const localSynapses = getStored<CortexSynapse[]>('app_cortex_synapses', []);
          if (localSynapses.length > 0) {
            for (const syn of localSynapses) {
              try {
                await setDocWithSanitize(doc(db, 'cortexSynapses', syn.id), syn);
              } catch (err: any) {
                console.warn(`Failed to seed synapse ${syn.id}:`, err.message || err);
              }
            }
          }
        }
      } catch (fbErr: any) {
        if (fbErr?.message?.includes('fetch') || fbErr?.message?.includes('NetworkError') || fbErr?.code === 'unavailable') {
          console.warn("Failed to load / seed to Firestore status (network/offline):", fbErr.message);
        } else {
          console.error("Failed to load / seed to Firestore status:", fbErr);
        }
      } finally {
        setIsInitialLoadDone(true);
      }
    }
    loadServerState();
  }, []);

  // Post state cache to server on local changes (debounced by 400ms)
  useEffect(() => {
    if (!isInitialLoadDone) return;
    setSyncStatus('saving');

    const timer = setTimeout(async () => {
      startSync('sync-cache');
      try {
        await fetchWithAuth('/api/voice/sync-cache', {
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
            aetherPersonalityRules,
            passcodePin,
            githubToken
          })
        });
        endSync('sync-cache', true);
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
          console.warn("Failed to auto-sync changes to server (network/offline):", e.message);
        } else {
          console.error("Failed to auto-sync changes to server:", e);
        }
        endSync('sync-cache', false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [projects, issues, cortexSynapses, notes, phases, agents, aiContextRules, aetherPersonalityRules, passcodePin, githubToken, isInitialLoadDone]);

  const lastFirestoreProjectsRef = useRef<Project[]>([]);

  // Post projects to Firestore on updates (debounced by 450ms)
  useEffect(() => {
    if (!isInitialLoadDone) return;

    // Compare local projects to last firestore snapshot
    const projectsDiffer = (local: Project[], remote: Project[]) => {
      if (local.length !== remote.length) return true;
      for (const lp of local) {
        const rp = remote.find(p => p.id === lp.id);
        if (!rp) return true;
        if (JSON.stringify(lp) !== JSON.stringify(rp)) {
          return true;
        }
      }
      return false;
    };

    if (!projectsDiffer(projects, lastFirestoreProjectsRef.current)) {
      return;
    }

    setSyncStatus('saving');

    const timer = setTimeout(async () => {
      startSync('projects');
      try {
        for (const proj of projects) {
          await setDocWithSanitize(doc(db, 'projects', proj.id), proj);
        }
        lastFirestoreProjectsRef.current = JSON.parse(JSON.stringify(projects));
        endSync('projects', true);
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError') || e?.code === 'unavailable') {
          console.warn("Failed to auto-sync projects to Firestore (network/offline):", e.message);
        } else {
          console.error("Failed to auto-sync projects to Firestore:", e);
        }
        endSync('projects', false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [projects, isInitialLoadDone]);

  // Synchronize githubRepo with active project's connected repository
  useEffect(() => {
    if (activeProjectId && isInitialLoadDone) {
      const activeProj = projects.find(p => p.id === activeProjectId);
      if (activeProj && activeProj.githubRepos && activeProj.githubRepos.length > 0) {
        const firstRepo = activeProj.githubRepos[0];
        if (firstRepo && firstRepo !== githubRepo) {
          setGithubRepo(firstRepo);
        }
      } else {
        if (githubRepo !== null) {
          setGithubRepo(null);
        }
      }
    }
  }, [activeProjectId, projects, isInitialLoadDone, githubRepo]);

  // Real-time Firestore project sync listener
  useEffect(() => {
    if (!googleUser || !isInitialLoadDone) return;

    const email = (googleUser.email || '').trim().toLowerCase();
    const projectsMap: { [id: string]: Project } = {};

    // Seed the map with current loaded projects
    projects.forEach(p => {
      projectsMap[p.id] = p;
    });

    let unsubOwned: (() => void) | null = null;
    let unsubCollab: (() => void) | null = null;

    const updateProjectsFromRealtime = () => {
      const mergedList = Object.values(projectsMap);
      mergedList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // Update the reference of remote projects so auto-sync loop prevention is maintained
      lastFirestoreProjectsRef.current = JSON.parse(JSON.stringify(mergedList));
      setProjects(mergedList);
    };

    // 1. Listen to owned projects
    try {
      const ownedQuery = query(collection(db, 'projects'), where('ownerId', '==', googleUser.uid));
      unsubOwned = onSnapshot(ownedQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const docData = change.doc.data() as Project;
          if (change.type === 'removed') {
            delete projectsMap[change.doc.id];
          } else {
            projectsMap[change.doc.id] = docData;
          }
        });
        
        // Also ensure all current query docs are in map
        snapshot.forEach((docSnap) => {
          projectsMap[docSnap.id] = docSnap.data() as Project;
        });

        updateProjectsFromRealtime();
      }, (error) => {
        // Handle error gracefully via our mandated helper
        handleFirestoreError(error, OperationType.LIST, 'projects');
      });
    } catch (e) {
      console.warn("Failed to attach owned projects real-time listener:", e);
    }

    // 2. Listen to collab projects
    if (email) {
      try {
        const collabQuery = query(collection(db, 'projects'), where('collaborators', 'array-contains', email));
        unsubCollab = onSnapshot(collabQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const docData = change.doc.data() as Project;
            if (change.type === 'removed') {
              if (docData.ownerId !== googleUser.uid) {
                delete projectsMap[change.doc.id];
              }
            } else {
              projectsMap[change.doc.id] = docData;
            }
          });

          // Also ensure all current query docs are in map
          snapshot.forEach((docSnap) => {
            projectsMap[docSnap.id] = docSnap.data() as Project;
          });

          updateProjectsFromRealtime();
        }, (error) => {
          // Handle error gracefully via our mandated helper
          handleFirestoreError(error, OperationType.LIST, 'projects');
        });
      } catch (e) {
        console.warn("Failed to attach collab projects real-time listener:", e);
      }
    }

    return () => {
      if (unsubOwned) unsubOwned();
      if (unsubCollab) unsubCollab();
    };
  }, [googleUser, isInitialLoadDone]);

  // Post issues to Firestore on updates (debounced by 450ms)
  useEffect(() => {
    if (!isInitialLoadDone) return;
    setSyncStatus('saving');

    const timer = setTimeout(async () => {
      startSync('issues');
      try {
        for (const iss of issues) {
          await setDocWithSanitize(doc(db, 'issues', iss.id), iss);
        }
        endSync('issues', true);
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError') || e?.code === 'unavailable') {
          console.warn("Failed to auto-sync issues to Firestore (network/offline):", e.message);
        } else {
          console.error("Failed to auto-sync issues to Firestore:", e);
        }
        endSync('issues', false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [issues, isInitialLoadDone]);

  // Post notes to Firestore on updates (debounced by 450ms)
  useEffect(() => {
    if (!isInitialLoadDone) return;
    setSyncStatus('saving');

    const timer = setTimeout(async () => {
      startSync('notes');
      try {
        for (const note of notes) {
          await setDocWithSanitize(doc(db, 'notes', note.id), note);
        }
        endSync('notes', true);
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError') || e?.code === 'unavailable') {
          console.warn("Failed to auto-sync notes to Firestore (network/offline):", e.message);
        } else {
          console.error("Failed to auto-sync notes to Firestore:", e);
        }
        endSync('notes', false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [notes, isInitialLoadDone]);

  // Post cortexSynapses to Firestore on updates (debounced by 450ms)
  useEffect(() => {
    if (!isInitialLoadDone) return;
    setSyncStatus('saving');

    const timer = setTimeout(async () => {
      startSync('cortexSynapses');
      try {
        for (const syn of cortexSynapses) {
          await setDocWithSanitize(doc(db, 'cortexSynapses', syn.id), syn);
        }
        endSync('cortexSynapses', true);
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError') || e?.code === 'unavailable') {
          console.warn("Failed to auto-sync cortex synapses to Firestore (network/offline):", e.message);
        } else {
          console.error("Failed to auto-sync cortex synapses to Firestore:", e);
        }
        endSync('cortexSynapses', false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [cortexSynapses, isInitialLoadDone]);

  // Periodically fetch the latest projects and dreams from server to stay updated 24/7
  useEffect(() => {
    if (!isInitialLoadDone) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchWithAuth('/api/voice/sync-cache');
        if (res.ok) {
          const data = await safeJsonFromResponse(res);
          if (data && Array.isArray(data.projects)) {
            setProjects(prev => prev.map(p => {
              const serverProj = data.projects.find((sp: any) => sp.id === p.id);
              if (serverProj) {
                // Merge recommendations and logs that were added by server-side dreaming
                const currentRecs = p.dreamRecommendations || [];
                const serverRecs = serverProj.dreamRecommendations || [];
                const mergedRecs = [...currentRecs];
                
                serverRecs.forEach((sr: any) => {
                  if (!mergedRecs.some((r: any) => r.id === sr.id || r.title.toLowerCase() === sr.title.toLowerCase())) {
                    mergedRecs.push(sr);
                  }
                });

                return {
                  ...p,
                  dreamRecommendations: mergedRecs,
                  dreamLogs: serverProj.dreamLogs || p.dreamLogs || []
                };
              }
              return p;
            }));
          }
        }
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
          console.warn("Periodic dream recommendations sync failed (network/offline):", e.message);
        } else {
          console.error("Periodic dream recommendations sync failed:", e);
        }
      }
    }, 1000 * 30); // check every 30 seconds

    return () => clearInterval(interval);
  }, [isInitialLoadDone]);

  useEffect(() => { setStored('whatsapp_passcode_pin', passcodePin); }, [passcodePin]);
  useEffect(() => { setStored('app_projects', projects); }, [projects]);
  useEffect(() => { setStored('app_issues', issues); }, [issues]);
  useEffect(() => { setStored('app_phases', phases); }, [phases]);
  useEffect(() => { setStored('app_notes', notes); }, [notes]);
  useEffect(() => { setStored('app_assets', assets); }, [assets]);
  useEffect(() => { setStored('app_active_project', activeProjectId); }, [activeProjectId]);
  useEffect(() => { setStored('devspace_agents', agents); }, [agents]);
  useEffect(() => { setStored('app_ai_context', aiContextRules); }, [aiContextRules]);
  useEffect(() => { setStored('app_aether_personality_rules', aetherPersonalityRules); }, [aetherPersonalityRules]);
  useEffect(() => { setStored('app_github_user', githubUser); }, [githubUser]);

  const loadUserWorkspace = async (user: any) => {
    if (!user) return;
    try {
      setIsInitialLoadDone(false);
      const idToken = await user.getIdToken();
      
      // 1. Fetch user-scoped server cache
      let finalProjects: Project[] = [];
      let finalIssues: Issue[] = [];
      
      try {
        const res = await fetch('/api/voice/sync-cache', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        if (res.ok) {
          const data = await safeJsonFromResponse(res);
          if (data) {
            finalProjects = data.projects || [];
            finalIssues = data.issues || [];
            setProjects(finalProjects);
            setIssues(finalIssues);
            setNotes(data.notes || []);
            setPhases(data.phases || []);
            setAgents(data.agents || []);
            setCortexSynapses(data.cortexSynapses || []);
            if (typeof data.aiContextRules === 'string') setAiContextRules(data.aiContextRules);
            if (Array.isArray(data.aetherPersonalityRules)) setAetherPersonalityRules(data.aetherPersonalityRules);
            if (typeof data.passcodePin === 'string') {
              setPasscodePin(data.passcodePin);
              localStorage.setItem('whatsapp_passcode_pin', data.passcodePin);
            }
          }
        }
      } catch (e: any) {
        const msg = e?.message || '';
        if (
          msg.includes('fetch') || 
          msg.includes('NetworkError') || 
          msg.toLowerCase().includes('network') || 
          msg.toLowerCase().includes('offline') ||
          msg.toLowerCase().includes('could not reach') ||
          msg.toLowerCase().includes('network-request-failed')
        ) {
          console.warn("Failed to load user-scoped server state (network/offline):", e.message);
        } else {
          console.error("Failed to load user-scoped server state:", e);
        }
      }

      // 2. Query Firestore directly for owned and collab projects
      let fbProjects: Project[] = [];
      try {
        const ownedQuery = query(collection(db, 'projects'), where('ownerId', '==', user.uid));
        const ownedSnap = await getDocs(ownedQuery);
        ownedSnap.forEach((docSnap) => {
          fbProjects.push(docSnap.data() as Project);
        });
      } catch (err) {
        console.warn("Failed to fetch owned projects:", err);
      }

      if (user.email) {
        try {
          const collabQuery = query(collection(db, 'projects'), where('collaborators', 'array-contains', user.email.trim().toLowerCase()));
          const collabSnap = await getDocs(collabQuery);
          collabSnap.forEach((docSnap) => {
            const proj = docSnap.data() as Project;
            if (!fbProjects.some(p => p.id === proj.id)) {
              fbProjects.push(proj);
            }
          });
        } catch (err) {
          console.warn("Failed to fetch collab projects:", err);
        }
      }

      // 1.5 Migrate local anonymous projects and resources if they exist
      const localProjects = getStored<Project[]>('app_projects', []);
      const anonProjects = localProjects.filter(p => !p.ownerId || p.ownerId === 'anonymous');
      
      if (anonProjects.length > 0) {
        console.log(`[Migration] Migrating ${anonProjects.length} anonymous projects to logged-in user ${user.uid}`);
        const email = user.email || '';
        const migratedProjects = localProjects.map(p => {
          if (!p.ownerId || p.ownerId === 'anonymous') {
            return {
              ...p,
              ownerId: user.uid,
              collaborators: email ? [email.trim().toLowerCase()] : [],
              collaboratorRoles: email ? { [email.trim().toLowerCase()]: 'admin' as const } : {}
            };
          }
          return p;
        });

        // Write migrated projects to Firestore
        for (const proj of migratedProjects) {
          if (proj.ownerId === user.uid) {
            try {
              await setDocWithSanitize(doc(db, 'projects', proj.id), proj);
              console.log(`[Migration] Migrated project ${proj.id} saved to Firestore.`);
            } catch (fsErr) {
              console.warn(`[Migration] Failed to save migrated project ${proj.id} to Firestore:`, fsErr);
            }
          }
        }

        // Migrate local anonymous issues, notes, synapses to Firestore
        const localIssues = getStored<Issue[]>('app_issues', []);
        for (const iss of localIssues) {
          try {
            await setDocWithSanitize(doc(db, 'issues', iss.id), iss);
          } catch (fsErr) {
            console.warn(`[Migration] Failed to save issues of migrated project ${iss.id} to Firestore:`, fsErr);
          }
        }

        const localNotes = getStored<Note[]>('app_notes', []);
        for (const note of localNotes) {
          try {
            await setDocWithSanitize(doc(db, 'notes', note.id), note);
          } catch (fsErr) {
            console.warn(`[Migration] Failed to save notes of migrated project ${note.id} to Firestore:`, fsErr);
          }
        }

        const localSynapses = getStored<CortexSynapse[]>('app_cortex_synapses', []);
        for (const syn of localSynapses) {
          try {
            await setDocWithSanitize(doc(db, 'cortexSynapses', syn.id), syn);
          } catch (fsErr) {
            console.warn(`[Migration] Failed to save synapses of migrated project ${syn.id} to Firestore:`, fsErr);
          }
        }

        // Add them to fbProjects list so they are treated as fetched
        migratedProjects.forEach(p => {
          if (!fbProjects.some(fbP => fbP.id === p.id)) {
            fbProjects.push(p);
          }
        });
      }

      const allowedProjectIds = fbProjects.map(p => p.id);
      const allowedProjectNames = fbProjects.map(p => (p.name || '').toLowerCase());

      // Fetch user's issues, notes, synapses
      const issuesSnap = await getDocs(collection(db, 'issues'));
      const fbIssues: Issue[] = [];
      issuesSnap.forEach((docSnap) => {
        const item = docSnap.data() as Issue;
        if (allowedProjectIds.includes(item.projectId)) {
          fbIssues.push(item);
        }
      });

      const fbNotes: Note[] = [];
      try {
        const notesSnap = await getDocs(collection(db, 'notes'));
        notesSnap.forEach((docSnap) => {
          const item = docSnap.data() as Note;
          if (allowedProjectIds.includes(item.projectId)) {
            fbNotes.push(item);
          }
        });
      } catch (e) {}

      const fbSynapses: CortexSynapse[] = [];
      try {
        const synapsesSnap = await getDocs(collection(db, 'cortexSynapses'));
        synapsesSnap.forEach((docSnap) => {
          const item = docSnap.data() as CortexSynapse;
          if (!item.projectName || allowedProjectNames.includes(item.projectName.toLowerCase())) {
            fbSynapses.push(item);
          }
        });
      } catch (e) {}

      // Merge & set state
      if (fbProjects.length > 0) {
        const mergedProjects = fbProjects.map(fbP => {
          const serverP = finalProjects.find(sp => sp.id === fbP.id);
          if (serverP) {
            const currentRecs = fbP.dreamRecommendations || [];
            const serverRecs = serverP.dreamRecommendations || [];
            const mergedRecs = [...currentRecs];
            serverRecs.forEach((sr: any) => {
              if (!mergedRecs.some((r: any) => r.id === sr.id || r.title.toLowerCase() === sr.title.toLowerCase())) {
                mergedRecs.push(sr);
              }
            });
            
            const currentBrainstorms = fbP.brainstormIdeas || [];
            const serverBrainstorms = serverP.brainstormIdeas || [];
            const mergedBrainstorms = [...currentBrainstorms];
            serverBrainstorms.forEach((sb: any) => {
              if (!mergedBrainstorms.some((b: any) => b.id === sb.id || b.text.toLowerCase() === sb.text.toLowerCase())) {
                mergedBrainstorms.push(sb);
              }
            });

            return {
              ...fbP,
              dreamRecommendations: mergedRecs,
              brainstormIdeas: mergedBrainstorms,
              isDreamingActive: fbP.isDreamingActive ?? serverP.isDreamingActive,
              dreamProgress: fbP.dreamProgress ?? serverP.dreamProgress,
              dreamLogs: fbP.dreamLogs || serverP.dreamLogs || [],
              dreamFocus: fbP.dreamFocus || serverP.dreamFocus,
              lastDreamedTime: fbP.lastDreamedTime || serverP.lastDreamedTime
            };
          }
          return fbP;
        });
        setProjects(mergedProjects);
        setStored('app_projects', mergedProjects);
        lastFirestoreProjectsRef.current = JSON.parse(JSON.stringify(mergedProjects));
      } else {
        if (finalProjects.length > 0) {
          setProjects(finalProjects);
          setStored('app_projects', finalProjects);
          lastFirestoreProjectsRef.current = JSON.parse(JSON.stringify(finalProjects));
        } else {
          setProjects([]);
          setStored('app_projects', []);
          lastFirestoreProjectsRef.current = [];
        }
      }

      if (fbIssues.length > 0) {
        setIssues(fbIssues);
        setStored('app_issues', fbIssues);
      } else {
        if (finalIssues.length > 0) {
          setIssues(finalIssues);
          setStored('app_issues', finalIssues);
        } else {
          setIssues([]);
          setStored('app_issues', []);
        }
      }

      if (fbNotes.length > 0) {
        setNotes(fbNotes);
        setStored('app_notes', fbNotes);
      } else {
        const localNotes = getStored<Note[]>('app_notes', []);
        if (localNotes.length > 0) {
          setNotes(localNotes);
        } else {
          setNotes([]);
          setStored('app_notes', []);
        }
      }

      if (fbSynapses.length > 0) {
        setCortexSynapses(fbSynapses);
        setStored('app_cortex_synapses', fbSynapses);
      } else {
        const localSynapses = getStored<CortexSynapse[]>('app_cortex_synapses', []);
        if (localSynapses.length > 0) {
          setCortexSynapses(localSynapses);
        } else {
          setCortexSynapses([]);
          setStored('app_cortex_synapses', []);
        }
      }

      // 3. Immediately POST merged state back to user-scoped server cache to initialize it
      try {
        await fetch('/api/voice/sync-cache', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            projects: fbProjects,
            issues: fbIssues,
            notes: fbNotes,
            cortexSynapses: fbSynapses,
            phases: [],
            agents: [],
            aiContextRules: "",
            aetherPersonalityRules: [],
            passcodePin: "1234"
          })
        });
      } catch (postErr: any) {
        const pmsg = postErr?.message || '';
        if (
          pmsg.includes('fetch') || 
          pmsg.includes('NetworkError') || 
          pmsg.toLowerCase().includes('network') || 
          pmsg.toLowerCase().includes('offline') ||
          pmsg.toLowerCase().includes('could not reach') ||
          pmsg.toLowerCase().includes('network-request-failed')
        ) {
          console.warn("Failed to post user-scoped initial state (network/offline):", postErr.message);
        } else {
          console.error("Failed to post user-scoped initial state:", postErr);
        }
      }

    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.includes('fetch') || 
        msg.includes('NetworkError') || 
        msg.toLowerCase().includes('network') || 
        msg.toLowerCase().includes('offline') ||
        msg.toLowerCase().includes('could not reach') ||
        msg.toLowerCase().includes('network-request-failed')
      ) {
        console.warn("Error loading user workspace (network/offline):", err.message);
      } else {
        console.error("Error loading user workspace:", err);
      }
    } finally {
      setIsInitialLoadDone(true);
    }
  };

  useEffect(() => {
    let unsubNotifications: (() => void) | null = null;
    let unsubInvitations: (() => void) | null = null;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (unsubNotifications) {
        unsubNotifications();
        unsubNotifications = null;
      }
      if (unsubInvitations) {
        unsubInvitations();
        unsubInvitations = null;
      }

      const isSandbox = typeof window !== 'undefined' && window.localStorage.getItem('app_auth_mode') === 'sandbox';
      if (isSandbox) {
        const localUser = getStored<any>('app_google_user', null);
        if (localUser) {
          setGoogleUser(localUser);
          const cachedProfile = getStored<any>('app_user_profile', null) || {
            uid: localUser.uid,
            email: localUser.email,
            username: localUser.displayName || 'SandboxDev',
            displayName: localUser.displayName || 'SandboxDev',
            avatarColor: '#eab308',
            title: 'Full-Stack Developer (Sandbox)',
            bio: 'Active DevSpace collaborator and sandbox designer.',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          setUserProfile(cachedProfile);
          
          // Load local workspace data
          const localProjects = getStored<Project[]>('app_projects', []);
          const localIssues = getStored<Issue[]>('app_issues', []);
          const localNotes = getStored<Note[]>('app_notes', []);
          const localSynapses = getStored<CortexSynapse[]>('app_cortex_synapses', []);
          setProjects(localProjects);
          setIssues(localIssues);
          setNotes(localNotes);
          setCortexSynapses(localSynapses);
          
          setIsInitialLoadDone(true);
          return;
        }
      }

      if (user) {
        const cleanUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        setGoogleUser(cleanUser);
        setStored('app_google_user', cleanUser);
        
        // Fetch or initialize user profile
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setUserProfile(data);
            setStored('app_user_profile', data);
          } else {
            const savedUsername = typeof window !== 'undefined' ? window.sessionStorage.getItem('signup_username') : null;
            const initialProfile = {
              uid: user.uid,
              email: user.email || '',
              username: savedUsername || user.displayName || user.email?.split('@')[0] || 'User',
              displayName: savedUsername || user.displayName || user.email?.split('@')[0] || 'User',
              avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
              title: 'Full-Stack Developer',
              bio: 'Active DevSpace collaborator and software designer.',
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), initialProfile);
            } catch (setErr) {
              console.warn("Failed to save initial profile to Firestore (offline fallback):", setErr);
            }
            setUserProfile(initialProfile);
            setStored('app_user_profile', initialProfile);
          }
        } catch (e) {
          console.warn("Failed to fetch/initialize user profile from Firestore, using offline fallback:", e);
          const cachedProfile = getStored<any>('app_user_profile', null);
          if (cachedProfile && cachedProfile.uid === user.uid) {
            setUserProfile(cachedProfile);
          } else {
            const savedUsername = typeof window !== 'undefined' ? window.sessionStorage.getItem('signup_username') : null;
            const fallbackProfile = {
              uid: user.uid,
              email: user.email || '',
              username: savedUsername || user.displayName || user.email?.split('@')[0] || 'User',
              displayName: savedUsername || user.displayName || user.email?.split('@')[0] || 'User',
              avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
              title: 'Full-Stack Developer',
              bio: 'Active DevSpace collaborator and software designer.',
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            setUserProfile(fallbackProfile);
            setStored('app_user_profile', fallbackProfile);
          }
        }

        // Fetch user invitations inside real-time listener
        try {
          const invQuery = query(collection(db, 'invitations'), where('receiverEmail', '==', (user.email || '').trim().toLowerCase()));
          unsubInvitations = onSnapshot(invQuery, (snapshot) => {
            const fbInvitations: any[] = [];
            snapshot.forEach((docSnap) => {
              fbInvitations.push(docSnap.data());
            });
            setInvitations(fbInvitations);
          }, (err) => {
            console.warn("Real-time invitations error:", err);
          });
        } catch (e) {
          console.warn("Failed to subscribe to user invitations from Firestore:", e);
        }

        // Fetch notifications inside real-time listener
        try {
          const notQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
          unsubNotifications = onSnapshot(notQuery, (snapshot) => {
            const fbNotifs: any[] = [];
            snapshot.forEach((docSnap) => {
              fbNotifs.push(docSnap.data());
            });
            fbNotifs.sort((a, b) => b.createdAt - a.createdAt);
            setNotifications(fbNotifs);
          }, (err) => {
            console.warn("Real-time notifications error:", err);
          });
        } catch (e) {
          console.warn("Failed to subscribe to notifications:", e);
        }

        // Load the full isolated user workspace data
        await loadUserWorkspace(user);
      } else {
        setIsInitialLoadDone(false);
        setGoogleUser(null);
        setStored('app_google_user', null);
        setUserProfile(null);
        setInvitations([]);
        setNotifications([]);
        
        // Clear workspace data on logout to completely isolate sessions
        setProjects([]);
        setIssues([]);
        setNotes([]);
        setCortexSynapses([]);
        setStored('app_projects', []);
        setStored('app_issues', []);
        setStored('app_notes', []);
        setStored('app_cortex_synapses', []);
        setIsInitialLoadDone(true);
      }
    });
    return () => {
      unsubscribe();
      if (unsubNotifications) unsubNotifications();
      if (unsubInvitations) unsubInvitations();
    };
  }, []);

  const addNotification = async (notification: {
    userId: string;
    type: 'star' | 'comment' | 'friend_request' | 'message' | 'collab_request' | 'collab_accept';
    title: string;
    description: string;
    senderId?: string;
    senderName?: string;
    projectId?: string;
    projectName?: string;
  }) => {
    try {
      const id = `notif_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      await setDoc(doc(db, 'notifications', id), {
        id,
        ...notification,
        read: false,
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Failed to add notification:", err);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      for (const notif of notifications) {
        await deleteDoc(doc(db, 'notifications', notif.id));
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const sendInvitation = async (
    projectId: string, 
    receiverEmail: string, 
    role: 'admin' | 'editor' | 'viewer' = 'editor',
    permissions?: any,
    receiverUsername?: string
  ) => {
    if (!auth.currentUser) throw new Error("Must be logged in to send invitations");
    const proj = projects.find(p => p.id === projectId);
    if (!proj) throw new Error("Project not found");

    const id = crypto.randomUUID();
    const inviteLink = `${window.location.origin}/projects?inviteId=${id}`;
    
    const defaultPermissions = {
      canPushToGit: role === 'admin' || role === 'editor',
      canViewCode: true,
      canEditRoadmap: role === 'admin' || role === 'editor',
      canInviteOthers: role === 'admin'
    };

    const newInvitation = {
      id,
      projectId,
      projectName: proj.name,
      senderId: auth.currentUser.uid,
      senderEmail: auth.currentUser.email || '',
      senderName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
      receiverEmail: receiverEmail.trim().toLowerCase(),
      receiverUsername: receiverUsername ? receiverUsername.trim() : '',
      status: 'pending',
      role,
      permissions: permissions || defaultPermissions,
      inviteLink,
      createdAt: Date.now()
    };

    await setDocWithSanitize(doc(db, 'invitations', id), newInvitation);
    setInvitations(prev => [...prev, newInvitation]);

    // Dispatch email notification via SMTP on backend
    try {
      const response = await fetch('/api/collaboration/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectName: proj.name,
          senderEmail: auth.currentUser.email || '',
          senderName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
          receiverEmail: receiverEmail.trim().toLowerCase(),
          invitationId: id,
          role,
          permissions: newInvitation.permissions
        })
      });
      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        console.error("Backend failed to dispatch invitation email:", errPayload);
      } else {
        const resData = await response.json();
        console.log("Invitation email processed successfully:", resData);
      }
    } catch (apiErr) {
      console.error("Failed to connect to backend SMTP dispatcher:", apiErr);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    if (!auth.currentUser) throw new Error("Must be logged in to accept invitations");
    
    let invite = invitations.find(i => i.id === invitationId);
    if (!invite) {
      const snap = await getDoc(doc(db, 'invitations', invitationId));
      if (snap.exists()) {
        invite = snap.data();
      }
    }
    if (!invite) throw new Error("Invitation not found");

    // 1. Update invitation status to accepted
    const updatedInvite = { ...invite, status: 'accepted' };
    await setDocWithSanitize(doc(db, 'invitations', invitationId), updatedInvite);
    setInvitations(prev => {
      if (prev.some(inv => inv.id === invitationId)) {
        return prev.map(inv => inv.id === invitationId ? updatedInvite : inv);
      } else {
        return [...prev, updatedInvite];
      }
    });

    // 2. Add user to project collaborators
    try {
      const projSnap = await getDocs(query(collection(db, 'projects'), where('id', '==', invite.projectId)));
      if (!projSnap.empty) {
        const projDoc = projSnap.docs[0];
        const projData = projDoc.data() as Project;
        const collaborators = projData.collaborators || [];
        const emailLower = (auth.currentUser.email || '').trim().toLowerCase();
        if (!collaborators.includes(emailLower)) {
          collaborators.push(emailLower);
        }
        const collaboratorRoles = projData.collaboratorRoles || {};
        collaboratorRoles[emailLower] = invite.role || 'editor';

        const collaboratorPermissions = projData.collaboratorPermissions || {};
        collaboratorPermissions[emailLower] = invite.permissions || {
          canPushToGit: invite.role === 'admin' || invite.role === 'editor',
          canViewCode: true,
          canEditRoadmap: invite.role === 'admin' || invite.role === 'editor',
          canInviteOthers: invite.role === 'admin'
        };

        const updatedProj = { 
          ...projData, 
          collaborators, 
          collaboratorRoles, 
          collaboratorPermissions 
        };
        await setDocWithSanitize(doc(db, 'projects', invite.projectId), updatedProj);
        setProjects(prev => prev.map(p => p.id === invite.projectId ? updatedProj : p));
      }
    } catch (e) {
      console.error("Failed to add collaborator to project:", e);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    if (!auth.currentUser) throw new Error("Must be logged in to decline invitations");
    
    let invite = invitations.find(i => i.id === invitationId);
    if (!invite) {
      const snap = await getDoc(doc(db, 'invitations', invitationId));
      if (snap.exists()) {
        invite = snap.data();
      }
    }
    if (!invite) throw new Error("Invitation not found");

    const updatedInvite = { ...invite, status: 'declined' };
    await setDocWithSanitize(doc(db, 'invitations', invitationId), updatedInvite);
    setInvitations(prev => {
      if (prev.some(inv => inv.id === invitationId)) {
        return prev.map(inv => inv.id === invitationId ? updatedInvite : inv);
      } else {
        return [...prev, updatedInvite];
      }
    });
  };

  const updateUserProfile = async (updates: { 
    displayName?: string, 
    avatarColor?: string, 
    title?: string, 
    bio?: string, 
    isPrivate?: boolean,
    githubUrl?: string,
    websiteUrl?: string,
    techStack?: string
  }) => {
    const isSandbox = typeof window !== 'undefined' && window.localStorage.getItem('app_auth_mode') === 'sandbox';
    const activeUid = auth.currentUser?.uid || googleUser?.uid;
    const activeEmail = auth.currentUser?.email || googleUser?.email || '';
    if (!activeUid) throw new Error("Must be logged in to update profile");
    
    startSync('profile');
    try {
      const updatedProfile = {
        ...(userProfile || {}),
        ...updates,
        uid: activeUid,
        email: activeEmail,
        updatedAt: Date.now()
      };
      
      if (!isSandbox && auth.currentUser) {
        await setDocWithSanitize(doc(db, 'users', auth.currentUser.uid), updatedProfile);
      }
      
      setUserProfile(updatedProfile);
      setStored('app_user_profile', updatedProfile);
      endSync('profile', true);
      showToast('Profile and workspace settings updated successfully.', 'success', 3000);
    } catch (e) {
      console.error("Failed to update profile:", e);
      endSync('profile', false);
      showToast('Failed to save profile settings.', 'error', 3000);
    }
  };

  const updateCollaboratorRole = async (projectId: string, email: string, role: 'admin' | 'editor' | 'viewer') => {
    if (!auth.currentUser) throw new Error("Must be logged in to update roles");
    const proj = projects.find(p => p.id === projectId);
    if (!proj) throw new Error("Project not found");

    const collaboratorRoles = { ...(proj.collaboratorRoles || {}) };
    collaboratorRoles[email] = role;

    const updatedProj = { ...proj, collaboratorRoles };
    await setDocWithSanitize(doc(db, 'projects', projectId), updatedProj);
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProj : p));
  };

  const removeCollaborator = async (projectId: string, email: string) => {
    if (!auth.currentUser) throw new Error("Must be logged in to remove collaborators");
    const proj = projects.find(p => p.id === projectId);
    if (!proj) throw new Error("Project not found");

    const collaborators = (proj.collaborators || []).filter(c => c !== email);
    const collaboratorRoles = { ...(proj.collaboratorRoles || {}) };
    delete collaboratorRoles[email];

    const updatedProj = { ...proj, collaborators, collaboratorRoles };
    await setDocWithSanitize(doc(db, 'projects', projectId), updatedProj);
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProj : p));
  };

  useEffect(() => { setStored('app_user_profile', userProfile); }, [userProfile]);
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
  useEffect(() => { setStored('app_aether_model', aetherModel); }, [aetherModel]);
  useEffect(() => { setStored('app_aether_conciseness', aetherConciseness); }, [aetherConciseness]);
  useEffect(() => { setStored('app_aether_thinking_level', aetherThinkingLevel); }, [aetherThinkingLevel]);
  useEffect(() => { setStored('app_cortex_synapses', cortexSynapses); }, [cortexSynapses]);
  useEffect(() => { setStored('app_voice_queue', voiceQueue); }, [voiceQueue]);
  useEffect(() => { setStored('app_voice_triggers', voiceTriggers); }, [voiceTriggers]);
  useEffect(() => { setStored('app_voice_lakeword', wakeWord); }, [wakeWord]);
  useEffect(() => { setStored('app_voice_wakeword_enabled', isWakeWordEnabled); }, [isWakeWordEnabled]);
  useEffect(() => { setStored('app_trained_phrases', trainedPhrases); }, [trainedPhrases]);
  useEffect(() => { setStored('app_trained_wakeword_model', trainedWakeWordModel); }, [trainedWakeWordModel]);
  useEffect(() => { setStored('app_speech_selected_voice', selectedVoiceName); }, [selectedVoiceName]);
  useEffect(() => { setStored('app_speech_pitch', speechPitch); }, [speechPitch]);
  useEffect(() => { setStored('app_speech_rate', speechRate); }, [speechRate]);
  useEffect(() => { setStored('app_shortcut_activation_key', activationShortcutKey); }, [activationShortcutKey]);
  useEffect(() => { setStored('app_shortcut_activation_mouse', activationShortcutMouse); }, [activationShortcutMouse]);
  useEffect(() => { setStored('app_shortcut_stop_key', stopShortcutKey); }, [stopShortcutKey]);
  useEffect(() => { setStored('app_shortcut_stop_mouse', stopShortcutMouse); }, [stopShortcutMouse]);

  useEffect(() => { setStored('app_shortcut_mic_key', micShortcutKey); }, [micShortcutKey]);
  useEffect(() => { setStored('app_shortcut_mic_mouse', micShortcutMouse); }, [micShortcutMouse]);
  useEffect(() => { setStored('app_shortcut_clear_key', clearShortcutKey); }, [clearShortcutKey]);
  useEffect(() => { setStored('app_shortcut_clear_mouse', clearShortcutMouse); }, [clearShortcutMouse]);
  useEffect(() => { setStored('app_shortcut_mute_key', muteVoiceShortcutKey); }, [muteVoiceShortcutKey]);
  useEffect(() => { setStored('app_shortcut_mute_mouse', muteVoiceShortcutMouse); }, [muteVoiceShortcutMouse]);
  useEffect(() => { setStored('app_shortcut_nav_projects_key', navProjectsShortcutKey); }, [navProjectsShortcutKey]);
  useEffect(() => { setStored('app_shortcut_nav_projects_mouse', navProjectsShortcutMouse); }, [navProjectsShortcutMouse]);
  useEffect(() => { setStored('app_shortcut_nav_notes_key', navNotesShortcutKey); }, [navNotesShortcutKey]);
  useEffect(() => { setStored('app_shortcut_nav_notes_mouse', navNotesShortcutMouse); }, [navNotesShortcutMouse]);
  useEffect(() => { setStored('app_shortcut_nav_roadmap_key', navRoadmapShortcutKey); }, [navRoadmapShortcutKey]);
  useEffect(() => { setStored('app_shortcut_nav_roadmap_mouse', navRoadmapShortcutMouse); }, [navRoadmapShortcutMouse]);

  useEffect(() => { setStored('app_assistant_minimized', isAssistantMinimized); }, [isAssistantMinimized]);

  const addProject = (p: Omit<Project, 'id' | 'createdAt'>): string => {
    const id = crypto.randomUUID();
    const ownerId = auth.currentUser?.uid || googleUser?.uid || 'anonymous';
    const email = auth.currentUser?.email || googleUser?.email || '';
    const newProj = { 
      ...p, 
      id, 
      createdAt: Date.now(),
      ownerId,
      collaborators: email ? [email.trim().toLowerCase()] : [],
      collaboratorRoles: email ? { [email.trim().toLowerCase()]: 'admin' as const } : {}
    };
    setProjects(prev => [...prev, newProj]);
    setDocWithSanitize(doc(db, 'projects', id), newProj).catch(e => handleFirestoreError(e, OperationType.WRITE, `projects/${id}`));
    return id;
  };
  const updateProject = (id: string, p: Partial<Project>) => {
    setProjects(prev => prev.map(proj => {
      if (proj.id === id) {
        const updated = { ...proj, ...p };
        setDocWithSanitize(doc(db, 'projects', id), updated).catch(e => handleFirestoreError(e, OperationType.WRITE, `projects/${id}`));
        return updated;
      }
      return proj;
    }));
  };
  const deleteProject = (id: string) => {
    // Clean up project issues in Firestore
    const associatedIssues = issues.filter(i => i.projectId === id);
    associatedIssues.forEach(i => {
      deleteDoc(doc(db, 'issues', i.id)).catch(() => {});
    });

    setProjects(prev => prev.filter(proj => proj.id !== id));
    setIssues(prev => prev.filter(i => i.projectId !== id));
    setPhases(prev => prev.filter(p => p.projectId !== id));
    setNotes(prev => prev.filter(n => n.projectId !== id));
    setAssets(prev => prev.filter(a => a.projectId !== id));
    if (activeProjectId === id) setActiveProjectId(null);

    deleteDoc(doc(db, 'projects', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `projects/${id}`));
  };

  const addIssue = (i: Omit<Issue, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const newIss = { ...i, id, createdAt: Date.now() };
    setIssues(prev => [...prev, newIss]);
    setDocWithSanitize(doc(db, 'issues', id), newIss).catch(e => handleFirestoreError(e, OperationType.WRITE, `issues/${id}`));
  };
  const updateIssue = (id: string, i: Partial<Issue>) => {
    setIssues(prev => prev.map(iss => {
      if (iss.id === id) {
        const updated = { ...iss, ...i };
        setDocWithSanitize(doc(db, 'issues', id), updated).catch(e => handleFirestoreError(e, OperationType.WRITE, `issues/${id}`));
        return updated;
      }
      return iss;
    }));
  };
  const deleteIssue = (id: string) => {
    setIssues(prev => prev.filter(iss => iss.id !== id));
    deleteDoc(doc(db, 'issues', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `issues/${id}`));
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
    const id = crypto.randomUUID();
    const newNote = { ...n, id, createdAt: now, updatedAt: now };
    setNotes(prev => [...prev, newNote]);
    setDocWithSanitize(doc(db, 'notes', id), newNote).catch(e => handleFirestoreError(e, OperationType.WRITE, `notes/${id}`));
  };
  const updateNote = (id: string, n: Partial<Note>) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        const updated = { ...note, ...n, updatedAt: Date.now() };
        setDocWithSanitize(doc(db, 'notes', id), updated).catch(e => handleFirestoreError(e, OperationType.WRITE, `notes/${id}`));
        return updated;
      }
      return note;
    }));
  };
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    deleteDoc(doc(db, 'notes', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `notes/${id}`));
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

      case 'navigate_to': {
        const path = parsedData.path || '/';
        const projName = parsedData.projectNameMentioned || '';
        
        if (projName && (path === '/projects' || path === '/notes')) {
          const matched = projects.find((p: any) => p.name.toLowerCase().includes(projName.toLowerCase()));
          if (matched) {
            setActiveProjectId(matched.id);
          }
        }
        
        window.dispatchEvent(new CustomEvent('aether-pc-navigate', { detail: { path } }));
        feedback = `Navigating PC display view to: ${path}`;
        break;
      }

      default:
        feedback = 'Transcript generated, but no automated routing was applicable.';
    }

    setVoiceQueue(prev => prev.map(v => v.id === id ? { ...v, status: 'applied', explanation: feedback } : v));
    return feedback;
  };

  // Keep references to active state for stable polling hook callbacks
  const projectsRef = useRef(projects);
  const issuesRef = useRef(issues);
  const activeProjectIdRef = useRef(activeProjectId);
  const cortexSynapsesRef = useRef(cortexSynapses);
  const agentsRef = useRef(agents);

  useEffect(() => { projectsRef.current = projects; }, [projects]);
  useEffect(() => { issuesRef.current = issues; }, [issues]);
  useEffect(() => { activeProjectIdRef.current = activeProjectId; }, [activeProjectId]);
  useEffect(() => { cortexSynapsesRef.current = cortexSynapses; }, [cortexSynapses]);
  useEffect(() => { agentsRef.current = agents; }, [agents]);

  // Synchronous execution helper for instant cross-device orchestration
  const executeActionDirectly = (act: any): string => {
    const { intent, parsedData } = act;
    if (!intent || intent === 'chat_query' || intent === 'unknown' || !parsedData) return '';

    switch (intent) {
      case 'create_project': {
        const name = parsedData.name || 'New Voice Project';
        const description = parsedData.description || 'Drafted via AI vocal voice dictation command.';
        const frameworks = parsedData.frameworks || ['React'];
        const customStack = parsedData.customStack || frameworks;

        addProject({
          name,
          description,
          frameworks,
          customStack,
          status: 'Planning',
          brainstormIdeas: [],
          seenRecommendedIdeas: [],
          dreamRecommendations: []
        });
        return `Successfully bootstrapped project "${name}" in Planning state.`;
      }

      case 'create_issue': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projectsRef.current.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) {
          projectId = activeProjectIdRef.current || projectsRef.current[0]?.id;
        }
        if (!projectId) {
          return 'Failed to append task: No active project context.';
        }

        const projectRef = projectsRef.current.find(p => p.id === projectId);
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

        return `Added task "${title}" [${type}, ${priority}] into "${projectRef?.name || 'Workspace'}".`;
      }

      case 'update_issue_status': {
        const mentionTitle = parsedData.issueTitleMentioned?.toLowerCase() || '';
        const newStatus = parsedData.newStatus || 'Done';

        let targetIssue = null;
        if (mentionTitle) {
          targetIssue = issuesRef.current.find(iss => 
            iss.title.toLowerCase().includes(mentionTitle)
          );
        }
        if (!targetIssue && activeProjectIdRef.current) {
          targetIssue = issuesRef.current.find(iss => 
            iss.projectId === activeProjectIdRef.current && iss.status !== 'Done'
          );
        }

        if (targetIssue) {
          updateIssue(targetIssue.id, { status: newStatus });
          return `Successfully updated status of "${targetIssue.title}" issue to -> "${newStatus}".`;
        } else {
          return `No open issue matching "${parsedData.issueTitleMentioned || 'active backlog items'}" detected to update.`;
        }
      }

      case 'add_brainstorm_idea': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projectsRef.current.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) projectId = activeProjectIdRef.current || projectsRef.current[0]?.id;

        if (!projectId) {
          return 'Could not register brainstorm: No active project context.';
        }

        const projectRef = projectsRef.current.find(p => p.id === projectId);
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

        return `Appended brainstorm idea "${text}" under project "${projectRef.name}".`;
      }

      case 'add_note': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projectsRef.current.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) projectId = activeProjectIdRef.current || projectsRef.current[0]?.id;

        if (!projectId) {
          return 'No project available to attach note.';
        }

        const projectRef = projectsRef.current.find(p => p.id === projectId);
        const title = parsedData.title || `Voice Note - ${new Date().toLocaleTimeString()}`;
        const content = parsedData.content || 'Doc transcribed via AI interface.';
        const tags = parsedData.tags || ['Voice'];

        addNote({
          projectId,
          title,
          content,
          tags
        });

        return `Committed voice documentation note "${title}" under project "${projectRef?.name || 'Workspace'}".`;
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
        return `Successfully anchored new rule "${name}" in the Obsidian Synaptic Cortex!`;
      }

      case 'navigate_to': {
        const path = parsedData.path || '/';
        const projName = parsedData.projectNameMentioned || '';
        
        if (projName && (path === '/projects' || path === '/notes')) {
          const matched = projectsRef.current.find((p: any) => p.name.toLowerCase().includes(projName.toLowerCase()));
          if (matched) {
            setActiveProjectId(matched.id);
          }
        }
        
        window.dispatchEvent(new CustomEvent('aether-pc-navigate', { detail: { path } }));
        return `Navigating PC display view to: ${path}`;
      }

      default:
        return 'Command executed, but no automatic mapping matches this instruction.';
    }
  };

  // Real-time synchronization hook for remote mobile companion actions/commands
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.pathname === '/whatsapp-companion') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/whatsapp/pending-actions');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            return;
          }
          const data = await response.json();
          if (data.actions && data.actions.length > 0) {
            data.actions.forEach((act: any) => {
              let feedback = 'Fired automatically via cross-device companion orchestration.';
              
              if (act.intent && act.intent !== 'chat_query' && act.intent !== 'unknown') {
                try {
                  const resultFeedback = executeActionDirectly(act);
                  if (resultFeedback) {
                    feedback = resultFeedback;
                  }
                } catch (err: any) {
                  feedback = `Orchestration error: ${err.message}`;
                }
              }

              const isApplied = act.intent && act.intent !== 'chat_query' && act.intent !== 'unknown';
              setVoiceQueue(prev => [
                {
                  id: act.id || crypto.randomUUID(),
                  transcript: act.transcript,
                  intent: act.intent,
                  confidence: act.confidence || 1.0,
                  parsedData: act.parsedData,
                  explanation: isApplied ? feedback : (act.explanation || 'No detail provided'),
                  status: isApplied ? 'applied' : 'pending',
                  createdAt: act.createdAt || Date.now()
                },
                ...prev
              ]);

              window.dispatchEvent(new CustomEvent('aether-remote-action-executed', {
                detail: { action: act, feedback }
              }));
            });
          }
        }
      } catch (err) {
        // Suppress network errors gracefully when offline
      }
    }, 2000); // Poll every 2 seconds for snappy responsiveness

    return () => clearInterval(pollInterval);
  }, []);

  const macroRegistry = useStore((state) => state.kineticGestures);
  const setKineticGestures = useStore((state) => state.setKineticGestures);

  // New States for Cloud Sync & Macro Sharing
  const [isSyncingConfig, setIsSyncingConfig] = useState(false);
  const [sharedMacros, setSharedMacros] = useState<SharedMacro[]>([]);

  // Auto load shared macros from Firestore on mount
  useEffect(() => {
    if (!db || !googleUser) {
      setSharedMacros([]);
      return;
    }

    try {
      const q = query(collection(db, 'shared_macros'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const macros: SharedMacro[] = [];
        snapshot.forEach((doc) => {
          macros.push({ id: doc.id, ...doc.data() } as SharedMacro);
        });
        // Sort newest first
        macros.sort((a, b) => b.createdAt - a.createdAt);
        setSharedMacros(macros);
      }, (error) => {
        if (error.code === 'permission-denied') {
          console.warn("Shared macros subscription permission denied (auth credentials establishing or transient):", error.message);
        } else {
          console.error("Failed to sync shared macros:", error);
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firestore not ready or offline:", err);
    }
  }, [db, googleUser]);

  // Back up configuration (cloud sync)
  const backupKineticConfig = async () => {
    const user = auth?.currentUser;
    if (!user) {
      showToast("Please sign in to backup your kinetic preferences!", "error", 3000);
      return;
    }
    if (!db) {
      showToast("Database is not connected!", "error", 3000);
      return;
    }
    
    setIsSyncingConfig(true);
    try {
      const storeState = useStore.getState();
      const payload = {
        userId: user.uid,
        kineticGestures: storeState.kineticGestures,
        swipeSensitivity: storeState.swipeSensitivity,
        waveSensitivity: storeState.waveSensitivity,
        customPathMatchPrecision: storeState.customPathMatchPrecision,
        fingerPoseStabilityFrames: storeState.fingerPoseStabilityFrames,
        gestureCooldownDuration: storeState.gestureCooldownDuration,
        updatedAt: Date.now()
      };
      
      const configRef = doc(db, 'kinetic_configs', user.uid);
      await setDocWithSanitize(configRef, payload);
      showToast("🖐️ Kinetic configurations successfully backed up to DevSpace Cloud!", "success", 3000);
    } catch (error) {
      showToast("Failed to backup kinetic configuration: " + (error instanceof Error ? error.message : String(error)), "error", 4000);
      handleFirestoreError(error, OperationType.WRITE, `kinetic_configs/${user.uid}`);
    } finally {
      setIsSyncingConfig(false);
    }
  };

  // Restore configuration from cloud sync
  const restoreKineticConfig = async () => {
    const user = auth?.currentUser;
    if (!user) {
      showToast("Please sign in to restore your kinetic configurations!", "error", 3000);
      return;
    }
    if (!db) {
      showToast("Database is not connected!", "error", 3000);
      return;
    }

    setIsSyncingConfig(true);
    try {
      const configRef = doc(db, 'kinetic_configs', user.uid);
      const docSnap = await getDoc(configRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.kineticGestures) {
          useStore.getState().setKineticGestures(data.kineticGestures);
        }
        if (data.swipeSensitivity !== undefined) {
          useStore.getState().setSwipeSensitivity(data.swipeSensitivity);
        }
        if (data.waveSensitivity !== undefined) {
          useStore.getState().setWaveSensitivity(data.waveSensitivity);
        }
        if (data.customPathMatchPrecision !== undefined) {
          useStore.getState().setCustomPathMatchPrecision(data.customPathMatchPrecision);
        }
        if (data.fingerPoseStabilityFrames !== undefined) {
          useStore.getState().setFingerPoseStabilityFrames(data.fingerPoseStabilityFrames);
        }
        if (data.gestureCooldownDuration !== undefined) {
          useStore.getState().setGestureCooldownDuration(data.gestureCooldownDuration);
        }
        showToast("🖐️ Restored custom gestures & sensitivity from DevSpace Cloud successfully!", "success", 3000);
      } else {
        showToast("No cloud backups found for your account. Perform a backup first!", "info", 3000);
      }
    } catch (error) {
      showToast("Failed to restore kinetic configuration: " + (error instanceof Error ? error.message : String(error)), "error", 4000);
      handleFirestoreError(error, OperationType.GET, `kinetic_configs/${user.uid}`);
    } finally {
      setIsSyncingConfig(false);
    }
  };

  // Publish a custom macro/library to public Community Gallery
  const publishMacro = async (title: string, description: string, gestures: KineticGesture[]): Promise<boolean> => {
    const user = auth?.currentUser;
    if (!user) {
      showToast("Please sign in to publish to community gallery!", "error", 3000);
      return false;
    }
    if (!db) {
      showToast("Database is not connected!", "error", 3000);
      return false;
    }
    if (!title || title.trim().length < 3) {
      showToast("Title must be at least 3 characters long!", "error", 3000);
      return false;
    }
    if (!description || description.trim().length < 10) {
      showToast("Description must be at least 10 characters long!", "error", 3000);
      return false;
    }
    if (!gestures || gestures.length === 0) {
      showToast("Please select at least one gesture/macro to publish!", "error", 3000);
      return false;
    }

    const macroId = 'sm-' + Math.random().toString(36).substring(2, 11);
    try {
      const payload: SharedMacro = {
        id: macroId,
        title: title.trim(),
        description: description.trim(),
        creatorId: user.uid,
        creatorName: userProfile?.username || user.displayName || user.email || "Anonymous Dev",
        gestures: gestures,
        likesCount: 0,
        downloadsCount: 0,
        createdAt: Date.now()
      };

      await setDocWithSanitize(doc(db, 'shared_macros', macroId), payload);
      showToast(`🚀 Published "${title}" to the Public Community Gallery successfully!`, "success", 3500);
      return true;
    } catch (error) {
      showToast("Failed to publish macro library: " + (error instanceof Error ? error.message : String(error)), "error", 4000);
      handleFirestoreError(error, OperationType.CREATE, `shared_macros/${macroId}`);
      return false;
    }
  };

  // Delete a shared macro (if you are the author)
  const deleteSharedMacro = async (macroId: string) => {
    const user = auth?.currentUser;
    if (!user) {
      showToast("Please sign in first!", "error", 3000);
      return;
    }
    if (!db) return;

    try {
      const macroRef = doc(db, 'shared_macros', macroId);
      const snap = await getDoc(macroRef);
      if (snap.exists() && snap.data().creatorId === user.uid) {
        await deleteDoc(macroRef);
        showToast("Successfully removed your shared macro from the public library.", "success", 3000);
      } else {
        showToast("Permission denied: You can only delete your own published items.", "error", 3000);
      }
    } catch (error) {
      showToast("Failed to delete shared macro: " + (error instanceof Error ? error.message : String(error)), "error", 4000);
      handleFirestoreError(error, OperationType.DELETE, `shared_macros/${macroId}`);
    }
  };

  // Like a shared macro
  const likeSharedMacro = async (macroId: string) => {
    if (!db) return;
    try {
      const macroRef = doc(db, 'shared_macros', macroId);
      const snap = await getDoc(macroRef);
      if (snap.exists()) {
        const currentLikes = snap.data().likesCount || 0;
        await setDocWithSanitize(macroRef, {
          ...snap.data(),
          likesCount: currentLikes + 1
        });
        showToast("Thanks for liking this shared macro bundle!", "success", 2000);
      }
    } catch (error) {
      showToast("Failed to like macro: " + (error instanceof Error ? error.message : String(error)), "error", 3000);
    }
  };

  // Increment downloads when someone saves it to their own library
  const incrementDownloadsSharedMacro = async (macroId: string) => {
    if (!db) return;
    try {
      const macroRef = doc(db, 'shared_macros', macroId);
      const snap = await getDoc(macroRef);
      if (snap.exists()) {
        const currentDownloads = snap.data().downloadsCount || 0;
        await setDocWithSanitize(macroRef, {
          ...snap.data(),
          downloadsCount: currentDownloads + 1
        });
      }
    } catch (error) {
      console.error("Failed to increment downloads count:", error);
    }
  };

  const toggleMacroMapping = (id: string) => {
    const updated = macroRegistry.map(g => {
      if (g.id === id) {
        return { ...g, disabled: !g.disabled };
      }
      return g;
    });
    setKineticGestures(updated);
    const affected = updated.find(g => g.id === id);
    if (affected) {
      showToast(
        `${affected.name} is now ${affected.disabled ? 'Disabled' : 'Enabled'}`,
        affected.disabled ? 'error' : 'success',
        2500
      );
    }
  };

  const testMacroMapping = (id: string) => {
    const gesture = macroRegistry.find(g => g.id === id);
    if (gesture) {
      if (gesture.disabled) {
        showToast(`Cannot test "${gesture.name}" as it is currently disabled!`, 'error', 3000);
        return;
      }
      showToast(`Testing sequence: ${gesture.name}`, 'info', 2000);
      window.dispatchEvent(new CustomEvent('kinetic-simulate-gesture', { detail: gesture }));
    }
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
      aetherPersonalityRules, setAetherPersonalityRules,
      githubUser, setGithubUser,
      googleUser, setGoogleUser,
      userProfile, updateUserProfile,
      invitations, setInvitations,
      sendInvitation, acceptInvitation, declineInvitation,
      updateCollaboratorRole, removeCollaborator,
      notifications, addNotification, markNotificationRead, clearAllNotifications,
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
      aetherModel, setAetherModel,
      aetherConciseness, setAetherConciseness,
      aetherThinkingLevel, setAetherThinkingLevel,
      cortexSynapses, setCortexSynapses,
      voiceQueue, setVoiceQueue, addVoiceAction, updateVoiceActionStatus, deleteVoiceAction, applyVoiceAction,
      passcodePin, setPasscodePin,
      voiceTriggers, setVoiceTriggers,
      wakeWord, setWakeWord,
      isWakeWordEnabled, setIsWakeWordEnabled,
      vocalDiagnostics, setVocalDiagnostics, addVocalDiagnostic,
      trainedPhrases, setTrainedPhrases,
      trainedWakeWordModel, setTrainedWakeWordModel,
      selectedVoiceName, setSelectedVoiceName,
      speechPitch, setSpeechPitch,
      speechRate, setSpeechRate,
      activationShortcutKey, setActivationShortcutKey,
      activationShortcutMouse, setActivationShortcutMouse,
      stopShortcutKey, setStopShortcutKey,
      stopShortcutMouse, setStopShortcutMouse,

      micShortcutKey, setMicShortcutKey,
      micShortcutMouse, setMicShortcutMouse,
      clearShortcutKey, setClearShortcutKey,
      clearShortcutMouse, setClearShortcutMouse,
      muteVoiceShortcutKey, setMuteVoiceShortcutKey,
      muteVoiceShortcutMouse, setMuteVoiceShortcutMouse,
      navProjectsShortcutKey, setNavProjectsShortcutKey,
      navProjectsShortcutMouse, setNavProjectsShortcutMouse,
      navNotesShortcutKey, setNavNotesShortcutKey,
      navNotesShortcutMouse, setNavNotesShortcutMouse,
      navRoadmapShortcutKey, setNavRoadmapShortcutKey,
      navRoadmapShortcutMouse, setNavRoadmapShortcutMouse,

      isAssistantMinimized, setIsAssistantMinimized,
      isAssistantOpen, setIsAssistantOpen,

      syncStatus,
      lastSyncedTime,
      toasts,
      showToast,
      removeToast,
      triggerFullSync,

      macroRegistry,
      toggleMacroMapping,
      testMacroMapping,

      backupKineticConfig,
      restoreKineticConfig,
      isSyncingConfig,
      sharedMacros,
      setSharedMacros,
      publishMacro,
      deleteSharedMacro,
      likeSharedMacro,
      incrementDownloadsSharedMacro
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DataContext.Provider>
  );
}
