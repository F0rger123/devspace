import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc, addDoc, query, where, getDoc, onSnapshot, disableNetwork } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, auth } from '../lib/auth';
import { Toast, ToastContainer } from '../components/ui/Toast';
import { useStore, KineticGesture } from '../store';
import { isElectron, getElectronAPI } from '../lib/electronBridge';

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

let isFirestoreQuotaExceeded = false;

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (
    isFirestoreQuotaExceeded ||
    errMsg.includes('resource-exhausted') || 
    errMsg.includes('Quota exceeded') || 
    errMsg.includes('quota') || 
    errMsg.includes('exhausted') || 
    errMsg.includes('Quota limit exceeded')
  ) {
    if (!isFirestoreQuotaExceeded) {
      isFirestoreQuotaExceeded = true;
      console.warn("⚠️ [Quota Guard] Firestore write quota exceeded. Seamlessly switching to Local-Only offline-cached workspace.");
      try {
        if (db) {
          disableNetwork(db).catch(() => {});
        }
      } catch (e) {}
    }
    return;
  }

  if (
    errMsg.includes('permission-denied') || 
    errMsg.includes('Missing or insufficient permissions') ||
    errMsg.includes('PERMISSION_DENIED')
  ) {
    console.warn(`⚠️ [Permission Guard] Firestore operation (${operationType}) on ${path || 'unknown'} skipped/denied. Working in local state mode.`);
    return;
  }

  const firebaseAuth = getAuth();
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-firestore-error', { detail: errInfo }));
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

export function getIsFirestoreQuotaExceeded() {
  return isFirestoreQuotaExceeded;
}

// Background Write Queue Engine - prevents any Firestore write operations from blocking UI startup
interface QueuedWriteTask {
  id: string;
  name: string;
  fn: () => Promise<void>;
  retries: number;
}

const writeQueue: QueuedWriteTask[] = [];
let isQueueProcessing = false;

export function enqueueBackgroundWrite(name: string, fn: () => Promise<void>) {
  writeQueue.push({
    id: `${name}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    fn,
    retries: 0
  });
  console.log(`📥 [Background Write Queue] Enqueued async task: ${name} (Queue depth: ${writeQueue.length})`);
  
  setTimeout(() => {
    processBackgroundWriteQueue().catch(err => {
      console.warn("[Background Write Queue] Warning during processing:", err);
    });
  }, 50);
}

async function processBackgroundWriteQueue() {
  if (isQueueProcessing || writeQueue.length === 0) return;
  isQueueProcessing = true;

  while (writeQueue.length > 0) {
    const task = writeQueue.shift();
    if (!task) continue;

    try {
      console.log(`🚀 [Background Write Queue] Executing task: ${task.name}`);
      await task.fn();
      console.log(`✅ [Background Write Queue] Successfully finished task: ${task.name}`);
    } catch (err: any) {
      console.warn(`⚠️ [Background Write Queue] Task failure for ${task.name}:`, err?.message || err);
      if (task.retries < 3 && (err?.code === 'unavailable' || err?.message?.includes('fetch') || err?.message?.includes('network'))) {
        task.retries += 1;
        writeQueue.push(task);
        console.log(`🔄 [Background Write Queue] Re-queuing ${task.name} for background retry (${task.retries}/3)`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  isQueueProcessing = false;
}

export async function setDocWithSanitize(ref: any, data: any, options?: any) {
  if (isFirestoreQuotaExceeded) {
    console.debug(`[Local Mode] Bypassing Firestore setDoc to ${ref?.path || 'unknown'} due to exceeded quota.`);
    return;
  }
  if (!getAuth().currentUser) {
    console.debug(`[Local Mode] Bypassing Firestore setDoc to ${ref?.path || 'unknown'} - unauthenticated user.`);
    return;
  }
  try {
    if (options) {
      return await setDoc(ref, sanitizeForFirestore(data), options);
    }
    return await setDoc(ref, sanitizeForFirestore(data));
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, ref?.path || 'unknown');
    if (
      isFirestoreQuotaExceeded || 
      err?.code === 'permission-denied' || 
      err?.message?.includes('Missing or insufficient permissions')
    ) {
      return;
    }
    throw err;
  }
}

export async function updateDocWithSanitize(ref: any, data: any) {
  if (isFirestoreQuotaExceeded) {
    console.debug(`[Local Mode] Bypassing Firestore updateDoc to ${ref?.path || 'unknown'} due to exceeded quota.`);
    return;
  }
  if (!getAuth().currentUser) {
    console.debug(`[Local Mode] Bypassing Firestore updateDoc to ${ref?.path || 'unknown'} - unauthenticated user.`);
    return;
  }
  try {
    return await updateDoc(ref, sanitizeForFirestore(data));
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, ref?.path || 'unknown');
    if (
      isFirestoreQuotaExceeded || 
      err?.code === 'permission-denied' || 
      err?.message?.includes('Missing or insufficient permissions')
    ) {
      return;
    }
    throw err;
  }
}

export async function addDocWithSanitize(ref: any, data: any) {
  if (isFirestoreQuotaExceeded) {
    console.debug(`[Local Mode] Bypassing Firestore addDoc to ${ref?.path || 'unknown'} due to exceeded quota.`);
    return;
  }
  if (!getAuth().currentUser) {
    console.debug(`[Local Mode] Bypassing Firestore addDoc to ${ref?.path || 'unknown'} - unauthenticated user.`);
    return;
  }
  try {
    return await addDoc(ref, sanitizeForFirestore(data));
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, ref?.path || 'unknown');
    if (
      isFirestoreQuotaExceeded || 
      err?.code === 'permission-denied' || 
      err?.message?.includes('Missing or insufficient permissions')
    ) {
      return;
    }
    throw err;
  }
}

export async function deleteDocWithSanitize(ref: any) {
  if (isFirestoreQuotaExceeded) {
    console.debug(`[Local Mode] Bypassing Firestore deleteDoc for ${ref?.path || 'unknown'} due to exceeded quota.`);
    return;
  }
  if (!getAuth().currentUser) {
    console.debug(`[Local Mode] Bypassing Firestore deleteDoc for ${ref?.path || 'unknown'} - unauthenticated user.`);
    return;
  }
  try {
    return await deleteDoc(ref);
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, ref?.path || 'unknown');
    if (
      isFirestoreQuotaExceeded || 
      err?.code === 'permission-denied' || 
      err?.message?.includes('Missing or insufficient permissions')
    ) {
      return;
    }
    throw err;
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      console.warn(`⏱️ [Startup Guard] Async operation exceeded ${ms}ms limit - resolving with fallback.`);
      resolve(fallback);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
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
  backendSettings?: {
    type: 'supabase' | 'none' | string;
    url?: string;
    anonKey?: string;
    serviceRoleKey?: string;
  };
  analyzedCommits?: {
    sha: string;
    message: string;
    author: string;
    date: string;
    summary: string;
    impact: 'Low' | 'Medium' | 'High' | 'Critical';
    achievements: string[];
    analyzedAt: number;
    suggestedIssueId?: string;
    suggestedNoteId?: string;
  }[];
  kanbanTasks?: {
    id: string;
    title: string;
    description?: string;
    status: 'queue' | 'progress' | 'completed';
    priority?: 'low' | 'medium' | 'high';
    createdAt: number;
  }[];
  tasks?: {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
  }[];
};

export type DeletedProject = Project & {
  deletedAt: number;
  expiresAt: number;
  originalId: string;
};

export type WorkspaceBackup = {
  id: string;
  timestamp: number;
  formattedDate: string;
  triggerReason: string;
  data: {
    projects: Project[];
    notes: Note[];
    issues: Issue[];
    cortexSynapses: CortexSynapse[];
    settings: {
      aiContextRules: string;
      aetherPersonalityRules: string[];
    };
  };
};

export type ProjectVersion = {
  id: string;
  projectId: string;
  projectName: string;
  versionNumber: number;
  timestamp: number;
  description: string;
  data: Project;
};

export type SyncConflict = {
  id: string;
  timestamp: number;
  collectionName: string;
  cloudCount: number;
  localCount: number;
  cloudData: any[];
  localData: any[];
  reason: string;
  resolved: boolean;
};

export type SyncLogEntry = {
  id: string;
  timestamp: number;
  collection: string;
  status: 'success' | 'warn' | 'blocked' | 'error';
  action: string;
  details: string;
  projectsCount?: number;
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
  analyzeProjectCommits: (projectId: string) => Promise<void>;

  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  addIssue: (i: Omit<Issue, 'id' | 'createdAt'>) => string;
  updateIssue: (id: string, i: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;

  phases: Phase[];
  setPhases: React.Dispatch<React.SetStateAction<Phase[]>>;
  addPhase: (p: Omit<Phase, 'id'>) => void;
  updatePhase: (id: string, p: Partial<Phase>) => void;
  deletePhase: (id: string) => void;

  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
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
    techStack?: string,
    username?: string,
    setupCompleted?: boolean
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
  vocalDictionary: Array<{ id: string, from: string, to: string }>;
  setVocalDictionary: React.Dispatch<React.SetStateAction<Array<{ id: string, from: string, to: string }>>>;
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
  isQuotaExceeded: boolean;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
  triggerFullSync: () => Promise<void>;
  isOnline: boolean;

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
  linkedUids: string[];
  setLinkedUids: React.Dispatch<React.SetStateAction<string[]>>;
  reconcileUserAccounts?: (user: any, linkedUids: string[]) => Promise<void>;
  forceReconcileIdentities: () => Promise<void>;
  startupTimeline: StartupTaskRecord[];

  // Phase 4.0 Data Integrity, Sync Protection & Recovery System
  deletedProjects: DeletedProject[];
  restoreDeletedProject: (id: string) => void;
  permanentlyDeleteProject: (id: string) => void;
  workspaceBackups: WorkspaceBackup[];
  createWorkspaceBackup: (reason?: string) => void;
  restoreWorkspaceBackup: (backupId: string) => void;
  syncConflict: SyncConflict | null;
  resolveSyncConflict: (resolution: 'keep_local' | 'keep_cloud' | 'merge') => void;
  syncAuditLogs: SyncLogEntry[];
  addSyncLog: (entry: Omit<SyncLogEntry, 'id' | 'timestamp'>) => void;
  projectVersions: ProjectVersion[];
  restoreProjectVersion: (versionId: string) => void;
};

export interface StartupTaskRecord {
  id: string;
  name: string;
  status: 'started' | 'completed' | 'failed' | 'timed_out';
  startTime: number;
  endTime?: number;
  durationMs?: number;
  details?: string;
  error?: string;
}

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
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  
  const [agents, setAgents] = useState<Agent[]>(() => {
    return getStored<Agent[]>('devspace_agents', []);
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

  const DEFAULT_GUEST_USER = {
    uid: 'dev-guest-01',
    email: 'architect@devspace.io',
    displayName: 'Devspace Developer',
    title: 'Full-Stack Developer',
    avatarColor: '#eab308',
    isGuest: true
  };

  const [googleUser, setGoogleUser] = useState<any>(() => getStored('app_google_user', DEFAULT_GUEST_USER));
  const [userProfile, setUserProfile] = useState<any | null>(() => getStored('app_user_profile', {
    uid: 'dev-guest-01',
    email: 'architect@devspace.io',
    username: 'Devspace Developer',
    displayName: 'Devspace Developer',
    avatarColor: '#eab308',
    title: 'Full-Stack Developer',
    bio: 'Active Devspace workspace developer.',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }));
  const [linkedUids, setLinkedUids] = useState<string[]>(() => getStored('app_linked_uids', []));
  const [invitations, setInvitations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [googleToken, setGoogleToken] = useState<string | null>(() => getStored('app_google_token', null));
  const [githubToken, setGithubToken] = useState<string | null>(() => getStored('app_github_token', null));
  const [githubProfile, setGithubProfile] = useState<any>(() => getStored('app_github_profile', null));
  const [githubRepo, setGithubRepo] = useState<string | null>(() => getStored('app_last_github_repo', null));
  const [aiPersona, setAiPersona] = useState<string>(() => getStored('app_ai_persona', 'Dynamic Briefing'));
  
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
  const [vocalDictionary, setVocalDictionary] = useState<Array<{ id: string, from: string, to: string }>>(() => {
    const defaults = [
      { id: '1', from: 'ether', to: 'Aether AI' },
      { id: '1b', from: 'e3', to: 'Aether AI' },
      { id: '1c', from: 'e 3', to: 'Aether AI' },
      { id: '1d', from: 'e-3', to: 'Aether AI' },
      { id: '1e', from: 'ether ai', to: 'Aether AI' },
      { id: '2', from: 'obsidiant', to: 'Obsidian' },
      { id: '3', from: 'dev space', to: 'DevSpace' }
    ];
    const stored = localStorage.getItem('app_vocal_dictionary');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out old 'ether' -> 'Aether' maps to overwrite with 'Aether AI'
          const filtered = parsed.filter(item => 
            item.from !== 'ether' && 
            item.from !== 'e3' && 
            item.from !== 'e 3' && 
            item.from !== 'e-3' && 
            item.from !== 'ether ai'
          );
          return [...defaults.filter(d => !filtered.some(f => f.from === d.from)), ...filtered];
        }
      } catch (e) {}
    }
    return defaults;
  });
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

  // Phase 4.0 Data Integrity, Sync Protection & Recovery System States
  const [deletedProjects, setDeletedProjects] = useState<DeletedProject[]>(() => getStored('app_deleted_projects', []));
  const [workspaceBackups, setWorkspaceBackups] = useState<WorkspaceBackup[]>(() => getStored('app_workspace_backups', []));
  const [syncConflict, setSyncConflict] = useState<SyncConflict | null>(() => getStored('app_sync_conflict', null));
  const [syncAuditLogs, setSyncAuditLogs] = useState<SyncLogEntry[]>(() => getStored('app_sync_audit_logs', []));
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>(() => getStored('app_project_versions', []));

  useEffect(() => { setStored('app_deleted_projects', deletedProjects); }, [deletedProjects]);
  useEffect(() => { setStored('app_workspace_backups', workspaceBackups); }, [workspaceBackups]);
  useEffect(() => { setStored('app_sync_conflict', syncConflict); }, [syncConflict]);
  useEffect(() => { setStored('app_sync_audit_logs', syncAuditLogs); }, [syncAuditLogs]);
  useEffect(() => { setStored('app_project_versions', projectVersions); }, [projectVersions]);

  const addSyncLog = (entry: Omit<SyncLogEntry, 'id' | 'timestamp'>) => {
    const newLog: SyncLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      ...entry
    };
    setSyncAuditLogs(prev => [newLog, ...(prev || [])].slice(0, 100));
  };

  const createWorkspaceBackup = (reason: string = 'Manual Snapshot') => {
    const newBackup: WorkspaceBackup = {
      id: 'backup_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      formattedDate: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      triggerReason: reason,
      data: {
        projects: JSON.parse(JSON.stringify(projects || [])),
        notes: JSON.parse(JSON.stringify(notes || [])),
        issues: JSON.parse(JSON.stringify(issues || [])),
        cortexSynapses: JSON.parse(JSON.stringify(cortexSynapses || [])),
        settings: {
          aiContextRules: aiContextRules || '',
          aetherPersonalityRules: aetherPersonalityRules || []
        }
      }
    };
    setWorkspaceBackups(prev => [newBackup, ...(prev || [])].slice(0, 20));
    addSyncLog({
      collection: 'workspace',
      status: 'success',
      action: 'create_backup',
      details: `Created workspace snapshot (${reason}) containing ${(projects || []).length} projects.`
    });
    showToast('✓ Workspace snapshot backup created.', 'success', 2500);
  };

  const restoreWorkspaceBackup = (backupId: string) => {
    const backup = (workspaceBackups || []).find(b => b.id === backupId);
    if (!backup) return;
    if (Array.isArray(backup.data?.projects)) setProjects(backup.data.projects);
    if (Array.isArray(backup.data?.notes)) setNotes(backup.data.notes);
    if (Array.isArray(backup.data?.issues)) setIssues(backup.data.issues);
    if (Array.isArray(backup.data?.cortexSynapses)) setCortexSynapses(backup.data.cortexSynapses);
    if (typeof backup.data?.settings?.aiContextRules === 'string') setAiContextRules(backup.data.settings.aiContextRules);
    if (Array.isArray(backup.data?.settings?.aetherPersonalityRules)) setAetherPersonalityRules(backup.data.settings.aetherPersonalityRules);

    addSyncLog({
      collection: 'workspace',
      status: 'success',
      action: 'restore_backup',
      details: `Restored workspace snapshot from ${backup.formattedDate} (${backup.triggerReason}).`
    });
    showToast(`Restored workspace backup from ${backup.formattedDate}`, 'success', 3500);
  };

  const restoreDeletedProject = (id: string) => {
    const delProj = (deletedProjects || []).find(dp => dp.id === id || dp.originalId === id);
    if (!delProj) return;
    const { deletedAt, expiresAt, originalId, ...projData } = delProj;

    setProjects(prev => [...prev, projData as Project]);
    setDeletedProjects(prev => prev.filter(dp => dp.id !== id && dp.originalId !== id));

    setDocWithSanitize(doc(db, 'projects', projData.id), projData).catch(() => {});
    deleteDocWithSanitize(doc(db, 'deletedProjects', id)).catch(() => {});

    addSyncLog({
      collection: 'projects',
      status: 'success',
      action: 'restore_soft_deleted',
      details: `Restored project '${projData.name}' from Trash Bin.`
    });
    showToast(`✓ Project '${projData.name}' restored successfully!`, 'success', 3000);
  };

  const permanentlyDeleteProject = (id: string) => {
    const delProj = (deletedProjects || []).find(dp => dp.id === id || dp.originalId === id);
    setDeletedProjects(prev => prev.filter(dp => dp.id !== id && dp.originalId !== id));
    deleteDocWithSanitize(doc(db, 'deletedProjects', id)).catch(() => {});
    if (delProj) {
      addSyncLog({
        collection: 'projects',
        status: 'warn',
        action: 'permanent_delete',
        details: `Permanently deleted project '${delProj.name}'.`
      });
      showToast(`Project '${delProj.name}' permanently deleted.`, 'info', 3000);
    }
  };

  const resolveSyncConflict = (resolution: 'keep_local' | 'keep_cloud' | 'merge') => {
    if (!syncConflict) return;
    if (resolution === 'keep_local') {
      enqueueBackgroundWrite('push_local_conflict_resolution', async () => {
        for (const proj of projects) {
          await setDocWithSanitize(doc(db, 'projects', proj.id), proj, { merge: true });
        }
      });
      addSyncLog({
        collection: 'projects',
        status: 'success',
        action: 'resolve_conflict_keep_local',
        details: `User resolved sync conflict by preserving ${projects.length} local projects and syncing to Cloud.`
      });
      showToast('Preserved local projects and synchronized to Cloud.', 'success', 3000);
    } else if (resolution === 'keep_cloud') {
      if (syncConflict.cloudData && syncConflict.cloudData.length > 0) {
        setProjects(syncConflict.cloudData);
        showToast('Updated local projects with Cloud data.', 'info', 3000);
      } else {
        showToast('Cloud data was empty. Preserving local state.', 'info', 3000);
      }
    } else if (resolution === 'merge') {
      const mergedMap = new Map<string, Project>();
      projects.forEach(p => mergedMap.set(p.id, p));
      (syncConflict.cloudData || []).forEach((cp: Project) => {
        if (!mergedMap.has(cp.id)) {
          mergedMap.set(cp.id, cp);
        }
      });
      const mergedList = Array.from(mergedMap.values());
      setProjects(mergedList);
      showToast(`Merged ${mergedList.length} total projects from local & cloud.`, 'success', 3000);
    }
    setSyncConflict(null);
    setStored('app_sync_conflict', null);
  };

  const restoreProjectVersion = (versionId: string) => {
    const ver = (projectVersions || []).find(v => v.id === versionId);
    if (!ver) return;
    setProjects(prev => prev.map(p => p.id === ver.projectId ? ver.data : p));
    setDocWithSanitize(doc(db, 'projects', ver.projectId), ver.data).catch(() => {});
    addSyncLog({
      collection: 'projects',
      status: 'success',
      action: 'restore_project_version',
      details: `Rolled back project '${ver.projectName}' to Version ${ver.versionNumber}.`
    });
    showToast(`Rolled back '${ver.projectName}' to Version ${ver.versionNumber}`, 'success', 3000);
  };

  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [startupTimeline, setStartupTimeline] = useState<StartupTaskRecord[]>([]);

  const updateStartupRecord = (record: StartupTaskRecord) => {
    setStartupTimeline(prev => {
      const idx = prev.findIndex(item => item.id === record.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...record };
        return updated;
      }
      return [...prev, { ...record }];
    });
  };

  const executeStartupTask = async <T,>(
    id: string,
    name: string,
    taskFn: () => Promise<T>,
    timeoutMs: number,
    fallbackValue: T
  ): Promise<T> => {
    const startTime = performance.now();
    const record: StartupTaskRecord = {
      id,
      name,
      status: 'started',
      startTime,
    };
    updateStartupRecord(record);

    console.log(`⏱️ [Startup Instrumentation][Task: ${name}] STARTED at t=${startTime.toFixed(1)}ms`);

    let timerId: any = null;
    let thresholdTimerId: any = setTimeout(() => {
      console.warn(`⏱️ [Startup Instrumentation][Task: ${name}] EXCEEDED 2000ms threshold! Still waiting...`);
    }, 2000);

    const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) => {
      timerId = setTimeout(() => resolve({ isTimeout: true }), timeoutMs);
    });

    try {
      const outcome = await Promise.race([
        taskFn().then((res) => ({ isTimeout: false as const, res })),
        timeoutPromise,
      ]);

      if (timerId) clearTimeout(timerId);
      if (thresholdTimerId) clearTimeout(thresholdTimerId);

      const durationMs = Math.round(performance.now() - startTime);
      record.durationMs = durationMs;
      record.endTime = performance.now();

      if ('isTimeout' in outcome && outcome.isTimeout) {
        record.status = 'timed_out';
        record.details = `Operation exceeded ${timeoutMs}ms limit. Soft-failing subsystem to prevent startup hang.`;
        console.warn(`⏱️ [Startup Instrumentation][Task: ${name}] TIMED OUT after ${durationMs}ms - using fallback value.`);
        updateStartupRecord(record);
        return fallbackValue;
      } else {
        record.status = 'completed';
        record.details = `Task completed successfully.`;
        console.log(`⏱️ [Startup Instrumentation][Task: ${name}] COMPLETED in ${durationMs}ms.`);
        updateStartupRecord(record);
        return (outcome as any).res;
      }
    } catch (err: any) {
      if (timerId) clearTimeout(timerId);
      if (thresholdTimerId) clearTimeout(thresholdTimerId);
      const durationMs = Math.round(performance.now() - startTime);
      record.status = 'failed';
      record.durationMs = durationMs;
      record.endTime = performance.now();
      record.error = err?.message || String(err);
      record.details = `Subsystem error encountered: ${err?.message || err}`;
      console.warn(`⏱️ [Startup Instrumentation][Task: ${name}] FAILED after ${durationMs}ms:`, err?.message || err);
      updateStartupRecord(record);
      return fallbackValue;
    }
  };

  useEffect(() => {
    // Immediately unblock UI so application loads instantly without waiting for telemetry steps
    setIsInitialLoadDone(true);

    const runStartupSequence = async () => {
      // 1. Authentication
      await executeStartupTask('task-auth', 'Authentication', async () => {
        const current = auth.currentUser;
        return current ? { uid: current.uid, email: current.email } : { guest: true };
      }, 1000, { guest: true });

      // 2. Firebase
      await executeStartupTask('task-firebase', 'Firebase', async () => {
        return { dbReady: Boolean(db), authReady: Boolean(auth) };
      }, 1000, { dbReady: true, authReady: true });

      // 3. Firestore
      await executeStartupTask('task-firestore', 'Firestore', async () => {
        if (auth.currentUser) {
          const snap = await withTimeout(getDoc(doc(db, 'users', auth.currentUser.uid)), 1000, null as any);
          return { userDocExists: Boolean(snap && snap.exists()) };
        }
        return { localMode: true };
      }, 1200, { localMode: true });

      // 4. Electron bridge
      await executeStartupTask('task-electron-bridge', 'Electron bridge', async () => {
        const isDesktop = isElectron();
        const api = getElectronAPI();
        if (isDesktop && api) {
          const info = await withTimeout(api.getAppInfo(), 1000, null as any);
          return { isDesktop: true, version: info?.version || '2.5.0' };
        }
        return { isDesktop: false, environment: 'web' };
      }, 1200, { isDesktop: isElectron(), environment: 'web' });

      // 5. Electron IPC
      await executeStartupTask('task-electron-ipc', 'Electron IPC', async () => {
        const api = getElectronAPI();
        if (api && api.isMaximized) {
          const isMax = await withTimeout(api.isMaximized(), 800, false);
          return { channelReady: true, isMaximized: isMax };
        }
        return { channelReady: false };
      }, 1000, { channelReady: false });

      // 6. Local storage
      await executeStartupTask('task-local-storage', 'Local storage', async () => {
        const localProjects = getStored<Project[]>('app_projects', []);
        const localIssues = getStored<Issue[]>('app_issues', []);
        const localNotes = getStored<Note[]>('app_notes', []);
        return { projectsCount: localProjects.length, issuesCount: localIssues.length, notesCount: localNotes.length };
      }, 1000, { projectsCount: 0, issuesCount: 0, notesCount: 0 });

      // 7. User profile
      await executeStartupTask('task-user-profile', 'User profile', async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const docSnap = await withTimeout(getDoc(doc(db, 'users', currentUser.uid)), 1500, null as any);
          if (docSnap && docSnap.exists()) {
            return docSnap.data();
          }
        }
        return getStored('app_user_profile', null);
      }, 1500, getStored('app_user_profile', null));

      // 8. Workspace loading
      await executeStartupTask('task-workspace-loading', 'Workspace loading', async () => {
        return { loaded: true };
      }, 1500, { loaded: true });

      // 9. GitHub synchronization
      await executeStartupTask('task-github-sync', 'GitHub synchronization', async () => {
        const token = getStored('app_github_token', null);
        const user = getStored('app_github_user', 'google');
        return { githubTokenSet: Boolean(token), githubUser: user };
      }, 1000, { githubTokenSet: false, githubUser: 'google' });

      // 10. Dream initialization
      await executeStartupTask('task-dream-init', 'Dream initialization', async () => {
        const recs = getStored('aether_dashboard_recommendations_v2', []);
        return { recsCount: recs.length };
      }, 1000, { recsCount: 0 });

      // 11. AI initialization
      await executeStartupTask('task-ai-init', 'AI initialization', async () => {
        const persona = getStored('app_ai_persona', 'Dynamic Briefing');
        const rules = getStored('app_ai_context', '');
        return { persona, hasContextRules: Boolean(rules) };
      }, 1000, { persona: 'Dynamic Briefing', hasContextRules: false });

      // 12. Provider loading
      await executeStartupTask('task-provider-loading', 'Provider loading', async () => {
        const model = getStored('app_aether_model', 'gemini-3.5-flash');
        return { activeModel: model, status: 'ready' };
      }, 1000, { activeModel: 'gemini-3.5-flash', status: 'ready' });

      // 13. Ollama detection
      await executeStartupTask('task-ollama-detection', 'Ollama detection', async () => {
        try {
          const res = await fetch('/api/ollama/status');
          if (res.ok) {
            const data = await res.json();
            return { available: Boolean(data.online), models: data.models || [] };
          }
          return { available: false, offline: true };
        } catch (e) {
          return { available: false, offline: true };
        }
      }, 1200, { available: false, offline: true });

      // 14. Google account initialization
      await executeStartupTask('task-google-account', 'Google account initialization', async () => {
        const gUser = getStored('app_google_user', null);
        const gToken = getStored('app_google_token', null);
        return { hasGoogleUser: Boolean(gUser), hasGoogleToken: Boolean(gToken) };
      }, 1000, { hasGoogleUser: false, hasGoogleToken: false });
    };

    runStartupSequence().catch((e) => {
      console.warn("Non-fatal startup trace error:", e);
    });
  }, []);

  // Sync and Toast States & Handlers
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<number | null>(null);
  const [activeSyncs, setActiveSyncs] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSyncToastTimeRef = useRef<number>(0);
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🟢 DevSpace is back online! Resuming real-time sync.', 'success', 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ Connection lost. Running in offline-first mode with secure local cache.', 'info', 5000);
    };
    const handleDbError = (e: Event) => {
      const customEvent = e as CustomEvent;
      const errorMsg = customEvent.detail?.error || '';
      if (errorMsg.includes('quota') || errorMsg.includes('exhausted') || errorMsg.includes('Quota')) {
        showToast('⚠️ DevSpace Cloud has reached daily limits. Your changes are running offline in secure Local Cache.', 'info', 7000);
      } else {
        showToast(`⚠️ Database warning: ${errorMsg || 'Connection issue'}. Offline Local Cache is active.`, 'info', 5000);
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('app-firestore-error', handleDbError);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app-firestore-error', handleDbError);
    };
  }, []);

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
    if (syncStatus === 'error') {
      showToast('Workspace synchronization failed. Please verify your connection.', 'error', 4000);
    }
  }, [syncStatus]);

  // Listen to Firestore error events to detect quota exhaustion and toggle local state
  useEffect(() => {
    const handleErr = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const errMsg = detail?.error || "";
      if (
        errMsg.includes('resource-exhausted') || 
        errMsg.includes('Quota exceeded') || 
        errMsg.includes('quota') || 
        errMsg.includes('exhausted') || 
        errMsg.includes('Quota limit exceeded')
      ) {
        setIsQuotaExceeded(true);
        if (!isFirestoreQuotaExceeded) {
          isFirestoreQuotaExceeded = true;
          console.warn("⚠️ [Quota Guard] Firestore write quota exceeded. Seamlessly switching to Local-Only offline-cached workspace.");
        }
      }
    };
    window.addEventListener('app-firestore-error', handleErr);
    return () => window.removeEventListener('app-firestore-error', handleErr);
  }, []);

  const fetchWithAuth = async (url: string, options: any = {}, retries = 3, delay = 1000): Promise<Response> => {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      return new Response(null, { status: 404, statusText: 'File protocol - API bypass' });
    }
    const headers = { ...(options.headers || {}) };
    if (auth.currentUser) {
      try {
        const idToken = await withTimeout(auth.currentUser.getIdToken(), 2000, '');
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      } catch (e) {
        console.warn("Failed to get idToken for authenticated request:", e);
      }
    }
    try {
      return await withTimeout(
        fetch(url, { ...options, headers }),
        3000,
        new Response(null, { status: 504, statusText: 'Gateway Timeout' })
      );
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
              // Server has backup disk persistence, treat non-empty collections as source of truth
              if (Array.isArray(data.projects) && data.projects.length > 0) {
                finalProjects = data.projects;
                setProjects(finalProjects);
              }
              if (Array.isArray(data.issues) && data.issues.length > 0) {
                finalIssues = data.issues;
                setIssues(finalIssues);
              }
              if (Array.isArray(data.notes) && data.notes.length > 0) setNotes(data.notes || []);
              if (Array.isArray(data.phases) && data.phases.length > 0) setPhases(data.phases || []);
              if (Array.isArray(data.agents) && data.agents.length > 0) setAgents(data.agents || []);
              if (Array.isArray(data.cortexSynapses) && data.cortexSynapses.length > 0) setCortexSynapses(data.cortexSynapses || []);
              if (typeof data.aiContextRules === 'string' && data.aiContextRules) setAiContextRules(data.aiContextRules);
              if (Array.isArray(data.aetherPersonalityRules) && data.aetherPersonalityRules.length > 0) setAetherPersonalityRules(data.aetherPersonalityRules);
              if (typeof data.passcodePin === 'string') {
                setPasscodePin(data.passcodePin);
                localStorage.setItem('whatsapp_passcode_pin', data.passcodePin);
              }
              if (typeof data.aetherControlNotes === 'boolean') setAetherControlNotes(data.aetherControlNotes);
              if (typeof data.aetherControlIssues === 'boolean') setAetherControlIssues(data.aetherControlIssues);
              if (typeof data.aetherControlAgents === 'boolean') setAetherControlAgents(data.aetherControlAgents);
              if (typeof data.aetherControlBrainstorm === 'boolean') setAetherControlBrainstorm(data.aetherControlBrainstorm);
              if (typeof data.aetherControlIntegrations === 'boolean') setAetherControlIntegrations(data.aetherControlIntegrations);
              if (typeof data.aetherDoubleConfirm === 'boolean') setAetherDoubleConfirm(data.aetherDoubleConfirm);
              if (typeof data.aetherAutoRecommend === 'boolean') setAetherAutoRecommend(data.aetherAutoRecommend);
              if (typeof data.aetherModel === 'string') setAetherModel(data.aetherModel);
              if (typeof data.aetherConciseness === 'string') setAetherConciseness(data.aetherConciseness);
              if (typeof data.aetherThinkingLevel === 'string') setAetherThinkingLevel(data.aetherThinkingLevel);
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
              if (typeof data.aetherControlNotes === 'boolean') setAetherControlNotes(data.aetherControlNotes);
              if (typeof data.aetherControlIssues === 'boolean') setAetherControlIssues(data.aetherControlIssues);
              if (typeof data.aetherControlAgents === 'boolean') setAetherControlAgents(data.aetherControlAgents);
              if (typeof data.aetherControlBrainstorm === 'boolean') setAetherControlBrainstorm(data.aetherControlBrainstorm);
              if (typeof data.aetherControlIntegrations === 'boolean') setAetherControlIntegrations(data.aetherControlIntegrations);
              if (typeof data.aetherDoubleConfirm === 'boolean') setAetherDoubleConfirm(data.aetherDoubleConfirm);
              if (typeof data.aetherAutoRecommend === 'boolean') setAetherAutoRecommend(data.aetherAutoRecommend);
              if (typeof data.aetherModel === 'string') setAetherModel(data.aetherModel);
              if (typeof data.aetherConciseness === 'string') setAetherConciseness(data.aetherConciseness);
              if (typeof data.aetherThinkingLevel === 'string') setAetherThinkingLevel(data.aetherThinkingLevel);
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

      // ⚡ UNBLOCK UI IMMEDIATELY: Local/server cache state is hydrated. UI is ready.
      setIsInitialLoadDone(true);

      // Synchronize with Firestore in background without blocking UI startup
      try {
        let fbProjects: Project[] = [];
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Fetch owned projects (checking all linked accounts for same-email merge)
          try {
            const uidsToQuery = Array.from(new Set([currentUser.uid, ...(linkedUids || [])]));
            const ownedQuery = query(collection(db, 'projects'), where('ownerId', 'in', uidsToQuery));
            const ownedSnap = await getDocs(ownedQuery);
            ownedSnap.forEach((docSnap) => {
              const proj = docSnap.data() as Project;
              if (!fbProjects.some(p => p.id === proj.id)) {
                fbProjects.push(proj);
              }
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
          // Empty in Firestore, seed asynchronously in background queue without blocking
          const projectsToSeed = [...finalProjects];
          enqueueBackgroundWrite('seed_projects_startup', async () => {
            for (const proj of projectsToSeed) {
              try {
                await setDocWithSanitize(doc(db, 'projects', proj.id), proj);
              } catch (err: any) {
                console.warn(`Failed to seed project ${proj.id}:`, err.message || err);
              }
            }
          });
        }

        if (fbIssues.length > 0) {
          setIssues(fbIssues);
          finalIssues = fbIssues;
          lastFirestoreIssuesRef.current = JSON.parse(JSON.stringify(fbIssues));
        } else if (finalIssues.length > 0) {
          // Empty in Firestore, seed asynchronously in background queue
          const issuesToSeed = [...finalIssues];
          enqueueBackgroundWrite('seed_issues_startup', async () => {
            for (const iss of issuesToSeed) {
              try {
                await setDocWithSanitize(doc(db, 'issues', iss.id), iss);
              } catch (err: any) {
                console.warn(`Failed to seed issue ${iss.id}:`, err.message || err);
              }
            }
          });
          lastFirestoreIssuesRef.current = JSON.parse(JSON.stringify(finalIssues));
        } else {
          lastFirestoreIssuesRef.current = [];
        }

        if (fbNotes.length > 0) {
          setNotes(fbNotes);
          lastFirestoreNotesRef.current = JSON.parse(JSON.stringify(fbNotes));
        } else {
          const localNotes = getStored<Note[]>('app_notes', []);
          if (localNotes.length > 0) {
            enqueueBackgroundWrite('seed_notes_startup', async () => {
              for (const note of localNotes) {
                try {
                  await setDocWithSanitize(doc(db, 'notes', note.id), note);
                } catch (err: any) {
                  console.warn(`Failed to seed note ${note.id}:`, err.message || err);
                }
              }
            });
          }
          lastFirestoreNotesRef.current = JSON.parse(JSON.stringify(localNotes));
        }

        if (fbSynapses.length > 0) {
          setCortexSynapses(fbSynapses);
          lastFirestoreSynapsesRef.current = JSON.parse(JSON.stringify(fbSynapses));
        } else {
          const localSynapses = getStored<CortexSynapse[]>('app_cortex_synapses', []);
          if (localSynapses.length > 0) {
            enqueueBackgroundWrite('seed_synapses_startup', async () => {
              for (const syn of localSynapses) {
                try {
                  await setDocWithSanitize(doc(db, 'cortexSynapses', syn.id), syn);
                } catch (err: any) {
                  console.warn(`Failed to seed synapse ${syn.id}:`, err.message || err);
                }
              }
            });
          }
          lastFirestoreSynapsesRef.current = JSON.parse(JSON.stringify(localSynapses));
        }
      } catch (fbErr: any) {
        if (fbErr?.message?.includes('fetch') || fbErr?.message?.includes('NetworkError') || fbErr?.code === 'unavailable') {
          console.warn("Failed to load / seed to Firestore status (network/offline):", fbErr.message);
        } else {
          console.error("Failed to load / seed to Firestore status:", fbErr);
        }
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
            githubToken,
            aetherControlNotes,
            aetherControlIssues,
            aetherControlAgents,
            aetherControlBrainstorm,
            aetherControlIntegrations,
            aetherDoubleConfirm,
            aetherAutoRecommend,
            aetherModel,
            aetherConciseness,
            aetherThinkingLevel
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
  }, [
    projects, issues, cortexSynapses, notes, phases, agents, aiContextRules, aetherPersonalityRules, passcodePin, githubToken,
    aetherControlNotes, aetherControlIssues, aetherControlAgents, aetherControlBrainstorm, aetherControlIntegrations,
    aetherDoubleConfirm, aetherAutoRecommend, aetherModel, aetherConciseness, aetherThinkingLevel, isInitialLoadDone
  ]);

  const lastFirestoreProjectsRef = useRef<Project[]>([]);
  const lastFirestoreIssuesRef = useRef<Issue[]>([]);
  const lastFirestoreNotesRef = useRef<Note[]>([]);
  const lastFirestoreSynapsesRef = useRef<CortexSynapse[]>([]);

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
        const changedProjects = projects.filter(lp => {
          const rp = lastFirestoreProjectsRef.current.find(p => p.id === lp.id);
          return !rp || JSON.stringify(lp) !== JSON.stringify(rp);
        });

        for (const proj of changedProjects) {
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

    const uidsToQuery = Array.from(new Set([googleUser.uid, ...(linkedUids || [])]));

    const updateProjectsFromRealtime = () => {
      const mergedList = Object.values(projectsMap);
      mergedList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      // Update the reference of remote projects so auto-sync loop prevention is maintained
      lastFirestoreProjectsRef.current = JSON.parse(JSON.stringify(mergedList));
      setProjects(mergedList);
    };

    // 1. Listen to owned projects
    try {
      const ownedQuery = query(collection(db, 'projects'), where('ownerId', 'in', uidsToQuery));
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
              if (!uidsToQuery.includes(docData.ownerId)) {
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
  }, [googleUser, isInitialLoadDone, linkedUids]);

  // Post issues to Firestore on updates (debounced by 450ms)
  useEffect(() => {
    if (!isInitialLoadDone) return;

    // Compare local issues to last firestore snapshot
    const issuesDiffer = (local: Issue[], remote: Issue[]) => {
      if (local.length !== remote.length) return true;
      for (const li of local) {
        const ri = remote.find(i => i.id === li.id);
        if (!ri) return true;
        if (JSON.stringify(li) !== JSON.stringify(ri)) {
          return true;
        }
      }
      return false;
    };

    if (!issuesDiffer(issues, lastFirestoreIssuesRef.current)) {
      return;
    }

    setSyncStatus('saving');

    const timer = setTimeout(async () => {
      startSync('issues');
      try {
        const changedIssues = issues.filter(li => {
          const ri = lastFirestoreIssuesRef.current.find(i => i.id === li.id);
          return !ri || JSON.stringify(li) !== JSON.stringify(ri);
        });

        for (const iss of changedIssues) {
          await setDocWithSanitize(doc(db, 'issues', iss.id), iss);
        }
        lastFirestoreIssuesRef.current = JSON.parse(JSON.stringify(issues));
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

    // Compare local notes to last firestore snapshot
    const notesDiffer = (local: Note[], remote: Note[]) => {
      if (local.length !== remote.length) return true;
      for (const ln of local) {
        const rn = remote.find(n => n.id === ln.id);
        if (!rn) return true;
        if (JSON.stringify(ln) !== JSON.stringify(rn)) {
          return true;
        }
      }
      return false;
    };

    if (!notesDiffer(notes, lastFirestoreNotesRef.current)) {
      return;
    }

    setSyncStatus('saving');

    const timer = setTimeout(async () => {
      startSync('notes');
      try {
        const changedNotes = notes.filter(ln => {
          const rn = lastFirestoreNotesRef.current.find(n => n.id === ln.id);
          return !rn || JSON.stringify(ln) !== JSON.stringify(rn);
        });

        for (const note of changedNotes) {
          await setDocWithSanitize(doc(db, 'notes', note.id), note);
        }
        lastFirestoreNotesRef.current = JSON.parse(JSON.stringify(notes));
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

    // Compare local synapses to last firestore snapshot
    const synapsesDiffer = (local: CortexSynapse[], remote: CortexSynapse[]) => {
      if (local.length !== remote.length) return true;
      for (const ls of local) {
        const rs = remote.find(s => s.id === ls.id);
        if (!rs) return true;
        if (JSON.stringify(ls) !== JSON.stringify(rs)) {
          return true;
        }
      }
      return false;
    };

    if (!synapsesDiffer(cortexSynapses, lastFirestoreSynapsesRef.current)) {
      return;
    }

    setSyncStatus('saving');

    const timer = setTimeout(async () => {
      startSync('cortexSynapses');
      try {
        const changedSynapses = cortexSynapses.filter(ls => {
          const rs = lastFirestoreSynapsesRef.current.find(s => s.id === ls.id);
          return !rs || JSON.stringify(ls) !== JSON.stringify(rs);
        });

        for (const syn of changedSynapses) {
          await setDocWithSanitize(doc(db, 'cortexSynapses', syn.id), syn);
        }
        lastFirestoreSynapsesRef.current = JSON.parse(JSON.stringify(cortexSynapses));
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

  // Active User & Autonomous Background Dreaming Trigger
  const lastActiveRef = React.useRef<number>(Date.now());
  useEffect(() => {
    const updateActivity = () => {
      lastActiveRef.current = Date.now();
    };

    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, []);

  // Check activity periodically and trigger a dream on the active project
  useEffect(() => {
    if (!isInitialLoadDone) return;

    const interval = setInterval(() => {
      // Is user active? (has interacted in the last 3 minutes)
      const isUserActive = (Date.now() - lastActiveRef.current) < 180000;
      if (!isUserActive) return;

      const targetId = activeProjectId || (projects && projects[0]?.id);
      if (!targetId) return;

      const proj = projects.find(p => p.id === targetId);
      if (!proj || proj.isDreamingActive) return;

      // Ensure we don't spam. Limit auto-dream to once every 5 minutes
      const lastDreamed = proj.lastDreamedTime || 0;
      const timeSinceLastDream = Date.now() - lastDreamed;
      if (timeSinceLastDream < 300000) return;

      console.log(`[Autonomous Dream] User is active. Auto-triggering dreaming cycle for project: ${proj.name}`);
      const foci: Array<'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general'> = [
        'refactor', 'security', 'performance', 'accessibility', 'design', 'new_ideas', 'general'
      ];
      const randomFocus = foci[Math.floor(Math.random() * foci.length)];
      startProjectDreaming(targetId, randomFocus).catch(console.error);
    }, 30000); // Check user activity and last dreamed timestamp every 30 seconds

    return () => clearInterval(interval);
  }, [isInitialLoadDone, activeProjectId, projects]);

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

  // Sync connected GitHub credentials to Firestore user doc whenever they change
  useEffect(() => {
    if (!isInitialLoadDone) return;
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      setDocWithSanitize(userDocRef, {
        githubToken,
        githubUser,
        githubProfile
      }, { merge: true }).catch(err => {
        console.warn("Failed to sync GitHub credentials to Firestore:", err);
      });
    }
  }, [githubToken, githubUser, githubProfile, isInitialLoadDone]);

  // Automated GitHub repos and stars monitoring & profile learning
  const hasMonitoredGithubRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!isInitialLoadDone || !githubToken) return;
    if (hasMonitoredGithubRef.current === githubToken) return;
    hasMonitoredGithubRef.current = githubToken;

    const monitorAndBuildProfile = async () => {
      console.log("[GitHub Monitor] Fetching user's repositories and starred repos to build preference profile...");
      
      const maxRetries = 3;
      let attempt = 0;
      let success = false;
      let response: Response | null = null;

      while (attempt < maxRetries && !success) {
        try {
          response = await fetch("/api/github/profile-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: githubToken })
          });

          if (response.ok) {
            success = true;
          } else {
            attempt++;
            console.warn(`[GitHub Monitor] Profile analysis attempt ${attempt} failed with status: ${response.statusText}`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          }
        } catch (err) {
          attempt++;
          console.warn(`[GitHub Monitor] Network/connection attempt ${attempt} failed:`, err);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          }
        }
      }

      if (!success || !response) {
        console.warn("[GitHub Monitor] Could not complete profile analysis after several attempts. Gracefully skipping profile synthesis.");
        return;
      }

      try {
        const profileObj = await response.json();

        // Save analysis to Firestore
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDocWithSanitize(userDocRef, {
            githubProfileAnalysis: profileObj,
            updatedAt: Date.now()
          }, { merge: true });
        }

        // Dynamically append guidelines to aiContextRules to actively "learn what they like"!
        setAiContextRules(prev => {
          let updatedRules = prev || "";
          
          // Remove existing autogenerated github rules block if any to prevent duplicates
          updatedRules = updatedRules.replace(/\n*<!-- GITHUB_LEARNED_PREFERENCES_START -->[\s\S]*?<!-- GITHUB_LEARNED_PREFERENCES_END -->/g, "").trim();

          const prefBlock = `\n\n<!-- GITHUB_LEARNED_PREFERENCES_START -->
# Learned Preferences from GitHub Repos & Stars
- **Focus Summary:** ${profileObj.summary}
${profileObj.recommendedGuidelines.map((g: string) => `- **Preference:** ${g}`).join('\n')}
<!-- GITHUB_LEARNED_PREFERENCES_END -->`;

          return updatedRules + prefBlock;
        });

        console.log("[GitHub Monitor] Successfully synthesized developer preferences profile & registered context rules!");
      } catch (err) {
        console.warn("[GitHub Monitor] Error parsing or saving synthesized developer profile:", err);
      }
    };

    monitorAndBuildProfile();
  }, [githubToken, isInitialLoadDone]);

  const registerLocalIdentity = (uid: string, email: string, profile: any) => {
    try {
      const registry = getStored<any[]>('app_local_identity_registry', []);
      const index = registry.findIndex(r => r.uid === uid);
      const entry = {
        uid,
        email: email || profile?.email || '',
        githubUser: profile?.githubUser || (typeof profile?.githubUser === 'object' ? profile.githubUser?.login : null) || null,
        githubEmail: profile?.githubEmail || profile?.githubProfile?.email || null,
        updatedAt: Date.now()
      };
      if (index >= 0) {
        registry[index] = { ...registry[index], ...entry };
      } else {
        registry.push(entry);
      }
      setStored('app_local_identity_registry', registry);
    } catch (e) {
      console.warn("Failed to register local identity:", e);
    }
  };

  const findRelatedProfiles = async (user: any, activeProfile: any) => {
    if (!user || !db) return [user.uid];
    const currentUid = user.uid;
    const currentEmail = (user.email || activeProfile?.email || '').toLowerCase().trim();
    
    const emailsToScan = new Set<string>();
    if (currentEmail) emailsToScan.add(currentEmail);
    if (user.email) emailsToScan.add(user.email.toLowerCase().trim());
    
    // Explicitly scan user provider data (e.g. google.com, github.com)
    if (user.providerData && Array.isArray(user.providerData)) {
      user.providerData.forEach((p: any) => {
        if (p.email) {
          emailsToScan.add(p.email.toLowerCase().trim());
        }
      });
    }

    // Safety fallback: if user matches the drummerforger profile
    if (currentEmail.includes('drummerforger') || (user.email && user.email.toLowerCase().includes('drummerforger'))) {
      emailsToScan.add('drummerforger@gmail.com');
    }
    
    if (activeProfile) {
      if (activeProfile.email) emailsToScan.add(activeProfile.email.toLowerCase().trim());
      if (activeProfile.githubEmail) emailsToScan.add(activeProfile.githubEmail.toLowerCase().trim());
      if (activeProfile.githubUser?.email) emailsToScan.add(activeProfile.githubUser.email.toLowerCase().trim());
      if (activeProfile.githubProfile?.email) emailsToScan.add(activeProfile.githubProfile.email.toLowerCase().trim());
    }

    const localRegistry = getStored<any[]>('app_local_identity_registry', []);
    localRegistry.forEach(item => {
      if (item.email) emailsToScan.add(item.email.toLowerCase().trim());
      if (item.githubEmail) emailsToScan.add(item.githubEmail.toLowerCase().trim());
    });

    const usernamesToScan = new Set<string>();
    if (activeProfile) {
      if (activeProfile.githubUser) {
        if (typeof activeProfile.githubUser === 'string') {
          usernamesToScan.add(activeProfile.githubUser.toLowerCase().trim());
        } else if (activeProfile.githubUser.login) {
          usernamesToScan.add(activeProfile.githubUser.login.toLowerCase().trim());
        }
      }
      if (activeProfile.githubProfile?.login) {
        usernamesToScan.add(activeProfile.githubProfile.login.toLowerCase().trim());
      }
      if (activeProfile.username) {
        usernamesToScan.add(activeProfile.username.toLowerCase().trim());
      }
    }
    localRegistry.forEach(item => {
      if (item.githubUser && typeof item.githubUser === 'string') {
        usernamesToScan.add(item.githubUser.toLowerCase().trim());
      }
    });

    console.log(`[IdentityScanning] Emails to check:`, Array.from(emailsToScan));
    console.log(`[IdentityScanning] Usernames to check:`, Array.from(usernamesToScan));

    const usersRef = collection(db, 'users');
    let allProfiles: any[] = [];

    // Strategy A: Scan all profiles (if permissions allow)
    try {
      const allUsersSnap = await withTimeout(getDocs(usersRef), 2000, null as any);
      if (allUsersSnap) {
        allUsersSnap.forEach(docSnap => {
          const data = docSnap.data();
          const docEmails = new Set<string>();
          if (data.email) docEmails.add(data.email.toLowerCase().trim());
          if (data.githubEmail) docEmails.add(data.githubEmail.toLowerCase().trim());
          if (data.githubUser?.email) docEmails.add(data.githubUser.email.toLowerCase().trim());
          if (data.githubProfile?.email) docEmails.add(data.githubProfile.email.toLowerCase().trim());

          const docUsernames = new Set<string>();
          if (data.username) docUsernames.add(data.username.toLowerCase().trim());
          if (data.githubUser) {
            if (typeof data.githubUser === 'string') {
              docUsernames.add(data.githubUser.toLowerCase().trim());
            } else if (data.githubUser.login) {
              docUsernames.add(data.githubUser.login.toLowerCase().trim());
            }
          }
          if (data.githubProfile?.login) docUsernames.add(data.githubProfile.login.toLowerCase().trim());

          let matches = false;
          emailsToScan.forEach(email => {
            if (docEmails.has(email)) matches = true;
          });
          usernamesToScan.forEach(username => {
            if (docUsernames.has(username)) matches = true;
          });

          if (matches || data.mergedInto === currentUid || docSnap.id === currentUid) {
            if (!allProfiles.some(p => p.id === docSnap.id)) {
              allProfiles.push({ id: docSnap.id, ...data });
            }
          }
        });
      }
    } catch (scanErr) {
      console.warn("[IdentityScanning] Full scan restricted or failed, falling back to direct queries.");
    }

    // Direct Queries
    const directQueries: any[] = [];
    emailsToScan.forEach(email => {
      directQueries.push(query(usersRef, where('email', '==', email)));
      directQueries.push(query(usersRef, where('githubEmail', '==', email)));
      directQueries.push(query(usersRef, where('githubUser.email', '==', email)));
      directQueries.push(query(usersRef, where('githubProfile.email', '==', email)));
    });

    usernamesToScan.forEach(username => {
      directQueries.push(query(usersRef, where('githubUser', '==', username)));
      directQueries.push(query(usersRef, where('username', '==', username)));
      directQueries.push(query(usersRef, where('githubProfile.login', '==', username)));
    });

    directQueries.push(query(usersRef, where('mergedInto', '==', currentUid)));

    await withTimeout(
      Promise.all(directQueries.map(async (q) => {
        try {
          const snap = await withTimeout(getDocs(q), 1500, null as any);
          if (snap) {
            snap.forEach(docSnap => {
              if (!allProfiles.some(p => p.id === docSnap.id)) {
                allProfiles.push({ id: docSnap.id, ...(docSnap.data() as any) });
              }
            });
          }
        } catch (e) {
          // Safe catch for nested query index requirements or transient errors
        }
      })),
      2000,
      []
    );

    if (!allProfiles.some(p => p.id === currentUid)) {
      try {
        const mySnap = await withTimeout(getDoc(doc(db, 'users', currentUid)), 1500, null as any);
        if (mySnap && mySnap.exists()) {
          allProfiles.push({ id: mySnap.id, ...(mySnap.data() as any) });
        }
      } catch (e) {}
    }

    localRegistry.forEach(item => {
      if (item.uid && !allProfiles.some(p => p.id === item.uid)) {
        allProfiles.push({ id: item.uid, placeholder: true });
      }
    });

    // Resolve placeholders to full profile documents
    await Promise.all(allProfiles.map(async (p, idx) => {
      if (p.placeholder) {
        try {
          const snap = await getDoc(doc(db, 'users', p.id));
          if (snap.exists()) {
            allProfiles[idx] = { id: snap.id, ...(snap.data() as any) };
          }
        } catch (e) {
          console.warn(`[IdentityScanning] Failed to fetch placeholder user document ${p.id}:`, e);
        }
      }
    }));

    return allProfiles.filter(p => p && !p.placeholder);
  };

  const reconcileUserAccounts = async (user: any, linkedUids: string[]) => {
    if (!user || !db || !linkedUids || linkedUids.length <= 1) return;
    const primaryUid = user.uid;
    console.log(`[AccountReconciliation] Running duplicate detection & merge for: ${user.email}, primary UID: ${primaryUid}, linked UIDs:`, linkedUids);

    try {
      // 1. CONSOLIDATE PROJECTS
      const projectsRef = collection(db, 'projects');
      const ownedQuery = query(projectsRef, where('ownerId', 'in', linkedUids));
      const ownedSnap = await withTimeout(getDocs(ownedQuery), 2000, null as any);
      
      let consolidatedCount = 0;
      const projectsToUpdate: any[] = [];
      if (ownedSnap) {
        ownedSnap.forEach((docSnap) => {
          const proj = docSnap.data();
          if (proj.ownerId !== primaryUid) {
            projectsToUpdate.push({
              id: docSnap.id,
              ...proj,
              ownerId: primaryUid
            });
          }
        });
      }

      for (const proj of projectsToUpdate) {
        try {
          await setDocWithSanitize(doc(db, 'projects', proj.id), proj);
          consolidatedCount++;
          console.log(`[AccountReconciliation] Consolidated project ${proj.id} to primary UID ${primaryUid}`);
        } catch (fsErr) {
          console.warn(`[AccountReconciliation] Failed to migrate project ${proj.id}:`, fsErr);
        }
      }

      const secondaryUids = linkedUids.filter(id => id !== primaryUid);

      // 2. CONSOLIDATE KINETIC CONFIGS
      for (const secUid of secondaryUids) {
        try {
          const configRef = doc(db, 'kinetic_configs', secUid);
          const configSnap = await getDoc(configRef);
          if (configSnap.exists()) {
            const configData = configSnap.data();
            const primaryConfigRef = doc(db, 'kinetic_configs', primaryUid);
            const primaryConfigSnap = await getDoc(primaryConfigRef);
            if (!primaryConfigSnap.exists()) {
              await setDocWithSanitize(primaryConfigRef, {
                ...configData,
                userId: primaryUid
              });
              console.log(`[AccountReconciliation] Consolidated kinetic config from ${secUid} to ${primaryUid}`);
            }
          }
        } catch (e) {
          console.warn(`[AccountReconciliation] Failed to migrate kinetic_configs for ${secUid}:`, e);
        }
      }

      // 3. CONSOLIDATE NOTIFICATIONS
      for (const secUid of secondaryUids) {
        try {
          const notificationsRef = collection(db, 'notifications');
          const notQuery = query(notificationsRef, where('userId', '==', secUid));
          const notSnap = await getDocs(notQuery);
          for (const docSnap of notSnap.docs) {
            await setDocWithSanitize(doc(db, 'notifications', docSnap.id), {
              ...docSnap.data(),
              userId: primaryUid
            });
          }
          if (notSnap.size > 0) {
            console.log(`[AccountReconciliation] Consolidated ${notSnap.size} notifications from ${secUid}`);
          }
        } catch (e) {
          console.warn(`[AccountReconciliation] Failed to consolidate notifications for ${secUid}:`, e);
        }
      }

      // 4. CONSOLIDATE SOCIAL (FOLLOWS & FRIEND REQUESTS)
      for (const secUid of secondaryUids) {
        try {
          const followsRef = collection(db, 'follows');
          
          // Followers of secondary UID
          const followersQuery = query(followsRef, where('followingId', '==', secUid));
          const followersSnap = await getDocs(followersQuery);
          for (const docSnap of followersSnap.docs) {
            const follow = docSnap.data();
            const newFollowId = `follow_${follow.followerId}_${primaryUid}`;
            await setDocWithSanitize(doc(db, 'follows', newFollowId), {
              ...follow,
              followingId: primaryUid,
              id: newFollowId
            });
            try {
              await deleteDocWithSanitize(doc(db, 'follows', docSnap.id));
            } catch (e) {}
          }

          // Following list of secondary UID
          const followingQuery = query(followsRef, where('followerId', '==', secUid));
          const followingSnap = await getDocs(followingQuery);
          for (const docSnap of followingSnap.docs) {
            const follow = docSnap.data();
            const newFollowId = `follow_${primaryUid}_${follow.followingId}`;
            await setDocWithSanitize(doc(db, 'follows', newFollowId), {
              ...follow,
              followerId: primaryUid,
              id: newFollowId
            });
            try {
              await deleteDocWithSanitize(doc(db, 'follows', docSnap.id));
            } catch (e) {}
          }
        } catch (e) {
          console.warn(`[AccountReconciliation] Failed to consolidate follows for ${secUid}:`, e);
        }

        // Friend requests
        try {
          const reqRef = collection(db, 'friend_requests');
          const sentQuery = query(reqRef, where('senderId', '==', secUid));
          const sentSnap = await getDocs(sentQuery);
          for (const docSnap of sentSnap.docs) {
            const reqData = docSnap.data();
            await setDocWithSanitize(doc(db, 'friend_requests', docSnap.id), {
              ...reqData,
              senderId: primaryUid
            });
          }

          const receivedQuery = query(reqRef, where('receiverId', '==', secUid));
          const receivedSnap = await getDocs(receivedQuery);
          for (const docSnap of receivedSnap.docs) {
            const reqData = docSnap.data();
            await setDocWithSanitize(doc(db, 'friend_requests', docSnap.id), {
              ...reqData,
              receiverId: primaryUid
            });
          }
        } catch (e) {
          console.warn(`[AccountReconciliation] Failed to consolidate friend requests for ${secUid}:`, e);
        }
      }

      // 5. CONSOLIDATE CHATS
      for (const secUid of secondaryUids) {
        try {
          const chatsRef = collection(db, 'chats');
          const chatQuery = query(chatsRef, where('participantIds', 'array-contains', secUid));
          const chatSnap = await getDocs(chatQuery);
          
          for (const docSnap of chatSnap.docs) {
            const chatData = docSnap.data();
            const oldParticipantIds = chatData.participantIds || [];
            const newParticipantIds = Array.from(new Set(oldParticipantIds.map((id: string) => id === secUid ? primaryUid : id)));
            
            const otherParticipant = newParticipantIds.find((id: string) => id !== primaryUid);
            if (otherParticipant) {
              const newChatId = primaryUid < otherParticipant ? `chat_${primaryUid}_${otherParticipant}` : `chat_${otherParticipant}_${primaryUid}`;
              
              const newChatRef = doc(db, 'chats', newChatId);
              const newChatSnap = await getDoc(newChatRef);
              
              if (!newChatSnap.exists()) {
                await setDocWithSanitize(newChatRef, {
                  ...chatData,
                  id: newChatId,
                  participantIds: newParticipantIds,
                  updatedAt: Date.now()
                });
              }

              const messagesRef = collection(db, 'chats', docSnap.id, 'messages');
              const msgSnap = await getDocs(messagesRef);
              for (const msgDoc of msgSnap.docs) {
                const msgData = msgDoc.data();
                const newMsgRef = doc(db, 'chats', newChatId, 'messages', msgDoc.id);
                await setDocWithSanitize(newMsgRef, {
                  ...msgData,
                  chatId: newChatId,
                  senderId: msgData.senderId === secUid ? primaryUid : msgData.senderId
                });
              }

              if (docSnap.id !== newChatId) {
                try {
                  await deleteDocWithSanitize(doc(db, 'chats', docSnap.id));
                } catch (e) {}
              }
            }
          }
        } catch (e) {
          console.warn(`[AccountReconciliation] Failed to consolidate chats for ${secUid}:`, e);
        }
      }

      // 6. CONSOLIDATE SHARED MACROS
      try {
        const macrosRef = collection(db, 'shared_macros');
        const macrosQuery = query(macrosRef, where('creatorId', 'in', secondaryUids));
        const macrosSnap = await getDocs(macrosQuery);
        for (const docSnap of macrosSnap.docs) {
          const macroData = docSnap.data();
          await setDocWithSanitize(doc(db, 'shared_macros', docSnap.id), {
            ...macroData,
            creatorId: primaryUid
          });
        }
        if (macrosSnap.size > 0) {
          console.log(`[AccountReconciliation] Consolidated ${macrosSnap.size} shared macros to ${primaryUid}`);
        }
      } catch (e) {
        console.warn(`[AccountReconciliation] Failed to consolidate shared macros:`, e);
      }

      if (consolidatedCount > 0) {
        showToast(`Account reconciliation complete! Consolidated ${consolidatedCount} duplicate projects under primary record.`, 'success', 6000);
      }
    } catch (err: any) {
      console.error('[AccountReconciliation] Critical reconciliation failure:', err);
    }
  };

  const forceReconcileIdentities = async () => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Cannot run identity reconciliation because no user is authenticated.", "error", 4000);
      return;
    }
    
    let currentEmail = user.email?.toLowerCase().trim() || '';
    if (!currentEmail && userProfile) {
      currentEmail = (userProfile.email || '').toLowerCase().trim();
    }
    
    if (!currentEmail) {
      try {
        const myDocRef = doc(db, 'users', user.uid);
        const mySnap = await getDoc(myDocRef);
        if (mySnap.exists()) {
          const data = mySnap.data();
          currentEmail = (data.email || data.githubEmail || data.githubUser?.email || data.githubProfile?.email || '').toLowerCase().trim();
        }
      } catch (err) {
        console.warn("[ForceReconcile] Could not fetch profile to resolve same-email accounts:", err);
      }
    }
    
    if (!currentEmail) {
      showToast("No email address associated with your current session to reconcile.", "error", 4000);
      return;
    }
    
    try {
      showToast(`🔄 Running deep identity reconciliation...`, "info", 4000);
      console.log(`[ForceReconcile] Scanning profiles using robust identity engine...`);
      const currentUid = user.uid;
      const allProfiles = await findRelatedProfiles(user, userProfile);
      
      // Compute unified profile attributes
      const savedUsername = typeof window !== 'undefined' ? window.sessionStorage.getItem('signup_username') : null;
      let mergedProfile: any = {
        uid: currentUid,
        email: currentEmail || userProfile?.email || user.email || '',
        username: savedUsername || user.displayName || (currentEmail || userProfile?.email || user.email || '').split('@')[0] || 'User',
        displayName: savedUsername || user.displayName || (currentEmail || userProfile?.email || user.email || '').split('@')[0] || 'User',
        avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
        title: 'Full-Stack Developer',
        bio: 'Active DevSpace collaborator.',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      if (user.providerData.some(p => p.providerId === 'google.com')) mergedProfile.googleLinked = true;
      if (user.providerData.some(p => p.providerId === 'github.com')) mergedProfile.githubLinked = true;

      allProfiles.forEach(prof => {
        if (prof.githubToken) mergedProfile.githubToken = prof.githubToken;
        if (prof.githubUser) mergedProfile.githubUser = prof.githubUser;
        if (prof.githubProfile) mergedProfile.githubProfile = prof.githubProfile;
        if (prof.googleLinked) mergedProfile.googleLinked = true;
        if (prof.githubLinked) mergedProfile.githubLinked = true;
        
        if (prof.displayName && prof.displayName !== currentEmail && prof.displayName !== currentEmail.split('@')[0]) {
          mergedProfile.displayName = prof.displayName;
        }
        if (prof.username && prof.username !== currentEmail && prof.username !== currentEmail.split('@')[0]) {
          mergedProfile.username = prof.username;
        }
        if (prof.avatarColor) mergedProfile.avatarColor = prof.avatarColor;
        if (prof.title) mergedProfile.title = prof.title;
        if (prof.bio) mergedProfile.bio = prof.bio;
        if (prof.createdAt && prof.createdAt < mergedProfile.createdAt) {
          mergedProfile.createdAt = prof.createdAt;
        }
      });
      
      const linkedUids = Array.from(new Set([currentUid, ...allProfiles.map(p => p.id)]));
      console.log(`[ForceReconcile] Mirroring profile across linked accounts:`, linkedUids);
      setLinkedUids(linkedUids);
      setStored('app_linked_uids', linkedUids);
      
      for (const uid of linkedUids) {
        try {
          const targetDocRef = doc(db, 'users', uid);
          const docToSave = {
            ...mergedProfile,
            uid: uid,
            email: currentEmail,
            mergedInto: null
          };
          await setDocWithSanitize(targetDocRef, docToSave, { merge: true });
        } catch (writeErr: any) {
          console.warn(`[ForceReconcile] Failed to mirror profile to user ${uid}:`, writeErr.message || writeErr);
        }
      }
      
      // Set the active profile
      const activeProfile = { ...mergedProfile, uid: currentUid };
      setUserProfile(activeProfile);
      setStored('app_user_profile', activeProfile);
      if (activeProfile.githubToken) {
        setGithubToken(activeProfile.githubToken);
        setStored('app_github_token', activeProfile.githubToken);
      }
      if (activeProfile.githubUser) {
        setGithubUser(activeProfile.githubUser);
        setStored('app_github_user', activeProfile.githubUser);
      }
      if (activeProfile.githubProfile) {
        setGithubProfile(activeProfile.githubProfile);
        setStored('app_github_profile', activeProfile.githubProfile);
      }
      
      // Sync billing
      let mergedBilling: any = {
        creditsBalance: 0.00,
        selectedTier: 'free',
        rpmUsed: 0,
        tpmUsed: 0,
        rpdUsed: 0,
        updatedAt: Date.now()
      };
      
      for (const uid of linkedUids) {
        try {
          const billDocRef = doc(db, 'google_ai_billing', uid);
          const billSnap = await getDoc(billDocRef);
          if (billSnap.exists()) {
            const bData = billSnap.data();
            if (bData.creditsBalance > mergedBilling.creditsBalance) {
              mergedBilling.creditsBalance = bData.creditsBalance;
            }
            if (bData.selectedTier && bData.selectedTier !== 'free') {
              mergedBilling.selectedTier = bData.selectedTier;
            }
            if (bData.rpmUsed > mergedBilling.rpmUsed) mergedBilling.rpmUsed = bData.rpmUsed;
            if (bData.tpmUsed > mergedBilling.tpmUsed) mergedBilling.tpmUsed = bData.tpmUsed;
            if (bData.rpdUsed > mergedBilling.rpdUsed) mergedBilling.rpdUsed = bData.rpdUsed;
            if (bData.updatedAt > mergedBilling.updatedAt) mergedBilling.updatedAt = bData.updatedAt;
          }
        } catch (billErr) {
          console.warn(`[ForceReconcile] Could not read billing for UID ${uid}:`, billErr);
        }
      }
      
      for (const uid of linkedUids) {
        try {
          const billDocRef = doc(db, 'google_ai_billing', uid);
          await setDocWithSanitize(billDocRef, {
            ...mergedBilling,
            email: currentEmail,
            updatedAt: Date.now()
          }, { merge: true });
        } catch (billWriteErr: any) {
          console.warn(`[ForceReconcile] Could not write billing to UID ${uid}:`, billWriteErr.message || billWriteErr);
        }
      }
      
      // Execute main data reconciliation
      await reconcileUserAccounts(user, linkedUids);
      
      // Re-load entire workspace
      await loadUserWorkspace(user, linkedUids);
      
      showToast(`✓ Identity reconciliation complete! Combined ${linkedUids.length} provider records and consolidated your projects successfully.`, "success", 6000);
    } catch (err: any) {
      console.error("[ForceReconcile] Failed deep reconciliation:", err);
      showToast(`Failed to complete identity reconciliation: ${err.message || err}`, "error", 5000);
    }
  };

  const loadUserWorkspace = async (user: any, computedLinkedUids?: string[]) => {
    if (!user) return;
    const workspaceLoadStart = performance.now();
    console.log(`⏱️ [Startup Timing][Stage 5/6] Remote Workspace Sync starting for UID: ${user.uid}`);
    try {
      // Instantly hydrate local cache into state first to ensure zero layout jump
      const localProjects = getStored<Project[]>('app_projects', []);
      const localIssues = getStored<Issue[]>('app_issues', []);
      const localNotes = getStored<Note[]>('app_notes', []);
      const localSynapses = getStored<CortexSynapse[]>('app_cortex_synapses', []);
      if (localProjects.length > 0) setProjects(localProjects);
      if (localIssues.length > 0) setIssues(localIssues);
      if (localNotes.length > 0) setNotes(localNotes);
      if (localSynapses.length > 0) setCortexSynapses(localSynapses);

      // Acquire ID Token with a 1500ms timeout guard
      const idTokenPromise = user.getIdToken().catch((e: any) => {
        console.warn("⏱️ [Startup Timing] ID Token fetch deferred:", e?.message || e);
        return "";
      });
      const idToken = await Promise.race([
        idTokenPromise,
        new Promise<string>((res) => setTimeout(() => {
          console.warn("⏱️ [Startup Timing] ID Token fetch exceeded 1500ms timeout guard - proceeding with local state");
          res("");
        }, 1500))
      ]);
      
      // 1. Fetch user-scoped server cache
      let finalProjects: Project[] = [];
      let finalIssues: Issue[] = [];
      let finalNotes: Note[] = [];
      let finalCortexSynapses: CortexSynapse[] = [];
      let finalPhases: any[] = [];
      let finalAgents: any[] = [];
      let finalAiContextRules: string = "";
      let finalAetherPersonalityRules: string[] = [];
      let finalPasscodePin: string = "1234";
      
      if (idToken) {
        try {
          const syncCacheStart = performance.now();
          let timer: any;
          const timeoutPromise = new Promise<Response | null>((resolve) => {
            timer = setTimeout(() => {
              console.warn("⏱️ [Startup Timing] Server sync cache exceeded 2000ms timeout guard");
              resolve(null);
            }, 2000);
          });
          const res = await Promise.race([
            fetch('/api/voice/sync-cache', {
              headers: { 'Authorization': `Bearer ${idToken}` }
            }).finally(() => clearTimeout(timer)),
            timeoutPromise
          ]);
          if (res && res.ok) {
            const data = await safeJsonFromResponse(res);
            if (data) {
              finalProjects = data.projects || [];
              finalIssues = data.issues || [];
              finalNotes = data.notes || [];
              finalCortexSynapses = data.cortexSynapses || [];
              finalPhases = data.phases || [];
              finalAgents = data.agents || [];
              finalAiContextRules = data.aiContextRules || "";
              finalAetherPersonalityRules = data.aetherPersonalityRules || [];
              finalPasscodePin = data.passcodePin || "1234";

              if (finalProjects.length > 0) setProjects(finalProjects);
              if (finalIssues.length > 0) setIssues(finalIssues);
              if (finalNotes.length > 0) setNotes(finalNotes);
              if (finalPhases.length > 0) setPhases(finalPhases);
              if (finalAgents.length > 0) setAgents(finalAgents);
              if (finalCortexSynapses.length > 0) setCortexSynapses(finalCortexSynapses);
              if (typeof data.aiContextRules === 'string') setAiContextRules(data.aiContextRules);
              if (Array.isArray(data.aetherPersonalityRules)) setAetherPersonalityRules(data.aetherPersonalityRules);
              if (typeof data.passcodePin === 'string') {
                setPasscodePin(data.passcodePin);
                localStorage.setItem('whatsapp_passcode_pin', data.passcodePin);
              }
              console.log(`⏱️ [Startup Timing] Server sync cache fetched in ${(performance.now() - syncCacheStart).toFixed(1)}ms`);
            }
          }
        } catch (e: any) {
          console.warn("⏱️ [Startup Timing] Server cache sync non-fatal error/timeout:", e?.message || e);
        }
      }

      // 2. Query Firestore directly for owned and collab projects (checking all linked accounts for same-email merge)
      let fbProjects: Project[] = [];
      let ownedQuerySuccess = false;
      let collabQuerySuccess = false;
      try {
        const uidsToQuery = Array.from(new Set([user.uid, ...(computedLinkedUids || linkedUids || [])]));
        const ownedQuery = query(collection(db, 'projects'), where('ownerId', 'in', uidsToQuery));
        const ownedSnap = await withTimeout(getDocs(ownedQuery), 2000, null as any);
        if (ownedSnap) {
          ownedQuerySuccess = true;
          ownedSnap.forEach((docSnap) => {
            const proj = docSnap.data() as Project;
            if (!fbProjects.some(p => p.id === proj.id)) {
              fbProjects.push(proj);
            }
          });
        }
      } catch (err) {
        console.warn("Failed to fetch owned projects:", err);
      }

      if (user.email) {
        try {
          const collabQuery = query(collection(db, 'projects'), where('collaborators', 'array-contains', user.email.trim().toLowerCase()));
          const collabSnap = await withTimeout(getDocs(collabQuery), 2000, null as any);
          if (collabSnap) {
            collabQuerySuccess = true;
            collabSnap.forEach((docSnap) => {
              const proj = docSnap.data() as Project;
              if (!fbProjects.some(p => p.id === proj.id)) {
                fbProjects.push(proj);
              }
            });
          }
        } catch (err) {
          console.warn("Failed to fetch collab projects:", err);
        }
      } else {
        collabQuerySuccess = true;
      }

      // Merge localProjects, finalProjects from server, and fbProjects from Firestore
      const projectsMap = new Map<string, Project>();

      // 1. Seed with cached/local projects
      localProjects.forEach(p => {
        projectsMap.set(p.id, {
          ...p,
          ownerId: p.ownerId || user.uid
        });
      });

      // 2. Seed with server sync cache projects
      finalProjects.forEach(p => {
        projectsMap.set(p.id, p);
      });

      // 3. Merge Firestore projects
      fbProjects.forEach(fbP => {
        const serverP = projectsMap.get(fbP.id);
        if (serverP) {
          const currentRecs = fbP.dreamRecommendations || [];
          const serverRecs = serverP.dreamRecommendations || [];
          const mergedRecs = [...currentRecs];
          serverRecs.forEach((sr: any) => {
            if (!mergedRecs.some((r: any) => r.id === sr.id || r.title?.toLowerCase() === sr.title?.toLowerCase())) {
              mergedRecs.push(sr);
            }
          });
          
          const currentBrainstorms = fbP.brainstormIdeas || [];
          const serverBrainstorms = serverP.brainstormIdeas || [];
          const mergedBrainstorms = [...currentBrainstorms];
          serverBrainstorms.forEach((sb: any) => {
            if (!mergedBrainstorms.some((b: any) => b.id === sb.id || b.text?.toLowerCase() === sb.text?.toLowerCase())) {
              mergedBrainstorms.push(sb);
            }
          });

          projectsMap.set(fbP.id, {
            ...fbP,
            dreamRecommendations: mergedRecs,
            brainstormIdeas: mergedBrainstorms,
            isDreamingActive: fbP.isDreamingActive ?? serverP.isDreamingActive,
            dreamProgress: fbP.dreamProgress ?? serverP.dreamProgress,
            dreamLogs: fbP.dreamLogs || serverP.dreamLogs || [],
            dreamFocus: fbP.dreamFocus || serverP.dreamFocus,
            lastDreamedTime: fbP.lastDreamedTime || serverP.lastDreamedTime
          });
        } else {
          projectsMap.set(fbP.id, fbP);
        }
      });

      const deletedIds = new Set((getStored<DeletedProject[]>('app_deleted_projects', []) || []).map(dp => dp.id || dp.originalId));
      const mergedProjectList = Array.from(projectsMap.values()).filter(p => !deletedIds.has(p.id));

      if (mergedProjectList.length > 0) {
        setProjects(mergedProjectList);
        setStored('app_projects', mergedProjectList);
        lastFirestoreProjectsRef.current = JSON.parse(JSON.stringify(mergedProjectList));

        // Background sync: Ensure all merged projects exist in Firestore under the user's UID
        const email = (user.email || '').trim().toLowerCase();
        enqueueBackgroundWrite('sync_merged_projects_firestore', async () => {
          for (const proj of mergedProjectList) {
            try {
              const updatedProj = {
                ...proj,
                ownerId: proj.ownerId || user.uid,
                collaborators: email ? Array.from(new Set([...(proj.collaborators || []), email])) : (proj.collaborators || []),
                collaboratorRoles: email ? { ...(proj.collaboratorRoles || {}), [email]: 'admin' as const } : (proj.collaboratorRoles || {})
              };
              await setDocWithSanitize(doc(db, 'projects', proj.id), updatedProj, { merge: true });
            } catch (fsErr) {
              console.warn(`[WorkspaceSync] Background project save failed for ${proj.id}:`, fsErr);
            }
          }
        });
      } else if (ownedQuerySuccess && collabQuerySuccess && localProjects.length === 0) {
        setProjects([]);
        setStored('app_projects', []);
        lastFirestoreProjectsRef.current = [];
      } else {
        console.warn("⏱️ [WorkspaceSync] Cloud project query completed; retaining cached local projects.");
      }

      const allowedProjectIds = mergedProjectList.map(p => p.id);
      const allowedProjectNames = mergedProjectList.map(p => (p.name || '').toLowerCase());

      // Fetch user's issues, notes, synapses
      const fbIssues: Issue[] = [];
      let issuesQuerySuccess = false;
      try {
        const issuesSnap = await withTimeout(getDocs(collection(db, 'issues')), 2000, null as any);
        if (issuesSnap) {
          issuesQuerySuccess = true;
          issuesSnap.forEach((docSnap) => {
            const item = docSnap.data() as Issue;
            if (allowedProjectIds.includes(item.projectId)) {
              fbIssues.push(item);
            }
          });
        }
      } catch (e) {}

      const fbNotes: Note[] = [];
      let notesQuerySuccess = false;
      try {
        const notesSnap = await withTimeout(getDocs(collection(db, 'notes')), 2000, null as any);
        if (notesSnap) {
          notesQuerySuccess = true;
          notesSnap.forEach((docSnap) => {
            const item = docSnap.data() as Note;
            if (allowedProjectIds.includes(item.projectId)) {
              fbNotes.push(item);
            }
          });
        }
      } catch (e) {}

      const fbSynapses: CortexSynapse[] = [];
      let synapsesQuerySuccess = false;
      try {
        const synapsesSnap = await withTimeout(getDocs(collection(db, 'cortexSynapses')), 2000, null as any);
        if (synapsesSnap) {
          synapsesQuerySuccess = true;
          synapsesSnap.forEach((docSnap) => {
            const item = docSnap.data() as CortexSynapse;
            if (!item.projectName || allowedProjectNames.includes(item.projectName.toLowerCase())) {
              fbSynapses.push(item);
            }
          });
        }
      } catch (e) {}

      if (fbIssues.length > 0) {
        setIssues(fbIssues);
        setStored('app_issues', fbIssues);
        lastFirestoreIssuesRef.current = JSON.parse(JSON.stringify(fbIssues));
      } else if (finalIssues.length > 0) {
        setIssues(finalIssues);
        setStored('app_issues', finalIssues);
        lastFirestoreIssuesRef.current = JSON.parse(JSON.stringify(finalIssues));
      } else if (issuesQuerySuccess && localIssues.length === 0) {
        setIssues([]);
        setStored('app_issues', []);
        lastFirestoreIssuesRef.current = [];
      } else {
        console.warn("⏱️ [WorkspaceSync] Cloud issues query timed out or completed; retaining cached local issues.");
      }

      if (fbNotes.length > 0) {
        setNotes(fbNotes);
        setStored('app_notes', fbNotes);
        lastFirestoreNotesRef.current = JSON.parse(JSON.stringify(fbNotes));
      } else if (finalNotes.length > 0) {
        setNotes(finalNotes);
        setStored('app_notes', finalNotes);
        lastFirestoreNotesRef.current = JSON.parse(JSON.stringify(finalNotes));
      } else if (notesQuerySuccess && localNotes.length === 0) {
        setNotes([]);
        setStored('app_notes', []);
        lastFirestoreNotesRef.current = [];
      } else {
        console.warn("⏱️ [WorkspaceSync] Cloud notes query timed out or completed; retaining cached local notes.");
      }

      if (fbSynapses.length > 0) {
        setCortexSynapses(fbSynapses);
        setStored('app_cortex_synapses', fbSynapses);
        lastFirestoreSynapsesRef.current = JSON.parse(JSON.stringify(fbSynapses));
      } else if (finalCortexSynapses.length > 0) {
        setCortexSynapses(finalCortexSynapses);
        setStored('app_cortex_synapses', finalCortexSynapses);
        lastFirestoreSynapsesRef.current = JSON.parse(JSON.stringify(finalCortexSynapses));
      } else if (synapsesQuerySuccess && localSynapses.length === 0) {
        setCortexSynapses([]);
        setStored('app_cortex_synapses', []);
        lastFirestoreSynapsesRef.current = [];
      } else {
        console.warn("⏱️ [WorkspaceSync] Cloud synapses query timed out or completed; retaining cached local synapses.");
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
            projects: fbProjects.length > 0 ? fbProjects : finalProjects,
            issues: fbIssues.length > 0 ? fbIssues : finalIssues,
            notes: fbNotes.length > 0 ? fbNotes : finalNotes,
            cortexSynapses: fbSynapses.length > 0 ? fbSynapses : finalCortexSynapses,
            phases: finalPhases,
            agents: finalAgents,
            aiContextRules: finalAiContextRules,
            aetherPersonalityRules: finalAetherPersonalityRules,
            passcodePin: finalPasscodePin
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
    let unsubOutgoingInvitations: (() => void) | null = null;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const authInitStartTime = performance.now();
      try {
        console.log(`⏱️ [Startup Timing][Stage 1/5] Auth state change event fired for ${user ? `user ${user.uid}` : 'anonymous/guest session'}`);
        
        // Immediately ensure UI is unblocked with local state (0ms wait)
        setIsInitialLoadDone(true);

        if (unsubNotifications) {
          unsubNotifications();
          unsubNotifications = null;
        }
        if (unsubInvitations) {
          unsubInvitations();
          unsubInvitations = null;
        }
        if (unsubOutgoingInvitations) {
          unsubOutgoingInvitations();
          unsubOutgoingInvitations = null;
        }

        let isSandbox = typeof window !== 'undefined' && window.localStorage.getItem('app_auth_mode') === 'sandbox';
        if (isSandbox && user) {
          window.localStorage.removeItem('app_auth_mode');
          isSandbox = false;
        }
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
            
            console.log(`⏱️ [Startup Timing][Stage 5/5] Sandbox startup ready in ${(performance.now() - authInitStartTime).toFixed(1)}ms`);
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
          
          // Fetch or initialize user profile (Unified multi-provider account sync engine)
          console.log(`⏱️ [Startup Timing][Stage 2/5] Identity & Profile Sync starting...`);
          const profileSyncStart = performance.now();
          let activeProfile: any = null;
          let computedLinkedUids: string[] = [user.uid];
          let currentEmail = user.email?.toLowerCase().trim() || '';
        
        try {
          const myDocRef = doc(db, 'users', user.uid);
          const mySnap = await withTimeout(getDoc(myDocRef), 1500, null as any);
          if (mySnap && mySnap.exists()) {
            activeProfile = mySnap.data();
            if (!currentEmail) {
              currentEmail = (activeProfile.email || activeProfile.githubEmail || activeProfile.githubUser?.email || activeProfile.githubProfile?.email || '').toLowerCase().trim();
            }
          }
        } catch (err) {
          console.warn("[AutoMerge] Could not fetch profile on auth state change:", err);
        }
        
        const currentUid = user.uid;
        try {
          console.log(`[AutoMerge] Running unified login sync using robust identity engine...`);
          const allProfiles = await findRelatedProfiles(user, activeProfile);
          
          // Register current user's profile to the local identity registry to ensure they are forever linked locally too
          registerLocalIdentity(currentUid, currentEmail || activeProfile?.email || user.email, activeProfile);

          // Compute unified profile attributes
          const savedUsername = typeof window !== 'undefined' ? window.sessionStorage.getItem('signup_username') : null;
          let mergedProfile: any = {
            uid: currentUid,
            email: currentEmail || activeProfile?.email || user.email || '',
            username: savedUsername || user.displayName || (currentEmail || activeProfile?.email || user.email || '').split('@')[0] || 'User',
            displayName: savedUsername || user.displayName || (currentEmail || activeProfile?.email || user.email || '').split('@')[0] || 'User',
            avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
            title: 'Full-Stack Developer',
            bio: 'Active DevSpace collaborator.',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          // If active logged-in provider is Google or GitHub, ensure those are preset
          if (user.providerData.some(p => p.providerId === 'google.com')) mergedProfile.googleLinked = true;
          if (user.providerData.some(p => p.providerId === 'github.com')) mergedProfile.githubLinked = true;

          allProfiles.forEach(prof => {
            if (prof.githubToken) mergedProfile.githubToken = prof.githubToken;
            if (prof.githubUser) mergedProfile.githubUser = prof.githubUser;
            if (prof.githubProfile) mergedProfile.githubProfile = prof.githubProfile;
            if (prof.googleLinked) mergedProfile.googleLinked = true;
            if (prof.githubLinked) mergedProfile.githubLinked = true;
            
            if (prof.displayName && prof.displayName !== currentEmail && prof.displayName !== currentEmail.split('@')[0]) {
              mergedProfile.displayName = prof.displayName;
            }
            if (prof.username && prof.username !== currentEmail && prof.username !== currentEmail.split('@')[0]) {
              mergedProfile.username = prof.username;
            }
            if (prof.avatarColor) mergedProfile.avatarColor = prof.avatarColor;
            if (prof.title) mergedProfile.title = prof.title;
            if (prof.bio) mergedProfile.bio = prof.bio;
            if (prof.createdAt && prof.createdAt < mergedProfile.createdAt) {
              mergedProfile.createdAt = prof.createdAt;
            }
          });
            
            // Save the merged profile to all associated UIDs asynchronously in background queue
            const existingStoredLinked = getStored<string[]>('app_linked_uids', []);
            const newlyFoundLinked = Array.from(new Set([currentUid, ...allProfiles.map(p => p.id)]));
            const linkedUids = Array.from(new Set([...existingStoredLinked, ...newlyFoundLinked]));
            computedLinkedUids = linkedUids;
            console.log(`[AutoMerge] Mirroring profile across identical-email accounts:`, linkedUids);
            setLinkedUids(linkedUids);
            setStored('app_linked_uids', linkedUids);
            
            enqueueBackgroundWrite('mirror_profile_auth', async () => {
              for (const uid of linkedUids) {
                try {
                  const targetDocRef = doc(db, 'users', uid);
                  const docToSave = {
                    ...mergedProfile,
                    uid: uid,
                    email: currentEmail,
                    mergedInto: null
                  };
                  await setDocWithSanitize(targetDocRef, docToSave, { merge: true });
                } catch (writeErr: any) {
                  console.warn(`[AutoMerge] Failed to mirror profile to user ${uid}:`, writeErr.message || writeErr);
                }
              }
            });
            
            // Set the state user profile
            activeProfile = { ...mergedProfile, uid: currentUid };
            setUserProfile(activeProfile);
            setStored('app_user_profile', activeProfile);
            if (activeProfile.githubToken) {
              setGithubToken(activeProfile.githubToken);
              setStored('app_github_token', activeProfile.githubToken);
            }
            if (activeProfile.githubUser) {
              setGithubUser(activeProfile.githubUser);
              setStored('app_github_user', activeProfile.githubUser);
            }
            if (activeProfile.githubProfile) {
              setGithubProfile(activeProfile.githubProfile);
              setStored('app_github_profile', activeProfile.githubProfile);
            }
            
            // Sync billing settings across all linked UIDs
            let mergedBilling: any = {
              creditsBalance: 0.00,
              selectedTier: 'free',
              rpmUsed: 0,
              tpmUsed: 0,
              rpdUsed: 0,
              updatedAt: Date.now()
            };
            
            for (const uid of linkedUids) {
              try {
                const billDocRef = doc(db, 'google_ai_billing', uid);
                const billSnap = await withTimeout(getDoc(billDocRef), 1500, null as any);
                if (billSnap && billSnap.exists()) {
                  const bData = billSnap.data();
                  if (bData.creditsBalance > mergedBilling.creditsBalance) {
                    mergedBilling.creditsBalance = bData.creditsBalance;
                  }
                  if (bData.selectedTier && bData.selectedTier !== 'free') {
                    mergedBilling.selectedTier = bData.selectedTier;
                  }
                  if (bData.rpmUsed > mergedBilling.rpmUsed) mergedBilling.rpmUsed = bData.rpmUsed;
                  if (bData.tpmUsed > mergedBilling.tpmUsed) mergedBilling.tpmUsed = bData.tpmUsed;
                  if (bData.rpdUsed > mergedBilling.rpdUsed) mergedBilling.rpdUsed = bData.rpdUsed;
                  if (bData.updatedAt > mergedBilling.updatedAt) mergedBilling.updatedAt = bData.updatedAt;
                }
              } catch (billErr) {
                console.warn(`[AutoMerge] Could not read billing for UID ${uid}:`, billErr);
              }
            }
            
            // Mirror merged billing doc asynchronously in background queue
            enqueueBackgroundWrite('mirror_billing_auth', async () => {
              for (const uid of linkedUids) {
                try {
                  const billDocRef = doc(db, 'google_ai_billing', uid);
                  await setDocWithSanitize(billDocRef, {
                    ...mergedBilling,
                    email: currentEmail, // Critical for cross-UID read security rules!
                    updatedAt: Date.now()
                  }, { merge: true });
                } catch (billWriteErr: any) {
                  console.warn(`[AutoMerge] Could not write billing to UID ${uid}:`, billWriteErr.message || billWriteErr);
                }
              }
            });
            
            if (linkedUids.length > 1) {
              showToast('✓ Linked developer profiles and billing settings synchronized successfully!', 'success', 4000);
            }
            
          } catch (mergeError: any) {
            console.error("[AutoMerge] Failed unified same-email synchronization:", mergeError);
            const storedLinked = getStored<string[]>('app_linked_uids', [user.uid]);
            setLinkedUids(storedLinked);
            enqueueBackgroundWrite('retry_account_reconciliation', async () => {
              try {
                console.log("[AutoMerge] Retrying account reconciliation in background...");
                const retryProfiles = await findRelatedProfiles(user, activeProfile);
                const retryLinkedUids = Array.from(new Set([user.uid, ...retryProfiles.map(p => p.id), ...getStored<string[]>('app_linked_uids', [])]));
                setLinkedUids(retryLinkedUids);
                setStored('app_linked_uids', retryLinkedUids);
                await reconcileUserAccounts(user, retryLinkedUids);
              } catch (retryErr) {
                console.warn("[AutoMerge] Async retry of account reconciliation failed:", retryErr);
              }
            });
          }

        if (!activeProfile) {
          // Normal profile loading/initialization fallback if email check failed or email is missing
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await withTimeout(getDoc(userDocRef), 1500, null as any);
            if (docSnap && docSnap.exists()) {
              const data = docSnap.data();
              setUserProfile(data);
              setStored('app_user_profile', data);
              if (data.githubToken) {
                setGithubToken(data.githubToken);
                setStored('app_github_token', data.githubToken);
              }
              if (data.githubUser) {
                setGithubUser(data.githubUser);
                setStored('app_github_user', data.githubUser);
              }
              if (data.githubProfile) {
                setGithubProfile(data.githubProfile);
                setStored('app_github_profile', data.githubProfile);
              }
            } else {
              const savedUsername = typeof window !== 'undefined' ? window.sessionStorage.getItem('signup_username') : null;
              const fallbackProfile = {
                uid: user.uid,
                email: user.email || '',
                username: savedUsername || user.displayName || user.email?.split('@')[0] || 'User',
                displayName: savedUsername || user.displayName || user.email?.split('@')[0] || 'User',
                avatarColor: ['#eab308', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'][Math.floor(Math.random() * 6)],
                title: 'Full-Stack Developer',
                bio: 'Active DevSpace collaborator.',
                createdAt: Date.now(),
                updatedAt: Date.now()
              };
              setUserProfile(fallbackProfile);
              setStored('app_user_profile', fallbackProfile);
              enqueueBackgroundWrite('fallback_profile_auth', async () => {
                await setDocWithSanitize(userDocRef, fallbackProfile);
              });
            }
          } catch (e) {
            console.warn("Failed to fetch/initialize user profile in fallback:", e);
          }
        }

        // Fetch user invitations (both incoming and outgoing) inside real-time listeners
        let incomingInvList: any[] = [];
        let outgoingInvList: any[] = [];

        const updateMergedInvitations = () => {
          const mergedMap = new Map();
          incomingInvList.forEach(i => mergedMap.set(i.id, i));
          outgoingInvList.forEach(i => mergedMap.set(i.id, i));
          setInvitations(Array.from(mergedMap.values()));
        };

        try {
          const invQuery = query(collection(db, 'invitations'), where('receiverEmail', '==', (user.email || '').trim().toLowerCase()));
          unsubInvitations = onSnapshot(invQuery, (snapshot) => {
            incomingInvList = [];
            snapshot.forEach((docSnap) => {
              incomingInvList.push(docSnap.data());
            });
            updateMergedInvitations();
          }, (err) => {
            console.warn("Real-time incoming invitations error:", err);
          });
        } catch (e) {
          console.warn("Failed to subscribe to incoming user invitations from Firestore:", e);
        }

        try {
          const outgoingInvQuery = query(collection(db, 'invitations'), where('senderId', '==', user.uid));
          unsubOutgoingInvitations = onSnapshot(outgoingInvQuery, (snapshot) => {
            outgoingInvList = [];
            snapshot.forEach((docSnap) => {
              outgoingInvList.push(docSnap.data());
            });
            updateMergedInvitations();
          }, (err) => {
            console.warn("Real-time outgoing invitations error:", err);
          });
        } catch (e) {
          console.warn("Failed to subscribe to outgoing user invitations from Firestore:", e);
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

        // Load isolated user workspace data safely in non-blocking background tasks
        console.log(`⏱️ [Startup Timing][Stage 3/5] Reconciling user accounts in background...`);
        reconcileUserAccounts(user, computedLinkedUids).catch(err => console.warn("Background reconcile warning:", err));
        console.log(`⏱️ [Startup Timing][Stage 4/5] Loading user workspace data in background...`);
        loadUserWorkspace(user, computedLinkedUids).catch(err => console.warn("Background workspace load warning:", err));
      } else {
        setGoogleUser(null);
        setStored('app_google_user', null);
        setUserProfile(null);
        setInvitations([]);
        setNotifications([]);
        
        const localProjects = getStored<Project[]>('app_projects', []);
        if (localProjects.length > 0) {
          setProjects(localProjects);
        }
      }
    } catch (authErr) {
      console.warn("[AuthInit] Handled error during auth state initialization:", authErr);
    } finally {
      console.log(`⏱️ [Startup Timing][Stage 5/5] DevSpace workspace startup complete in ${(performance.now() - authInitStartTime).toFixed(1)}ms`);
      setIsInitialLoadDone(true);
    }
  });
    return () => {
      unsubscribe();
      if (unsubNotifications) unsubNotifications();
      if (unsubInvitations) unsubInvitations();
      if (unsubOutgoingInvitations) unsubOutgoingInvitations();
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
      await setDocWithSanitize(doc(db, 'notifications', id), {
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
      await setDocWithSanitize(doc(db, 'notifications', id), { read: true }, { merge: true });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      for (const notif of notifications) {
        await deleteDocWithSanitize(doc(db, 'notifications', notif.id));
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
      const projDocRef = doc(db, 'projects', invite.projectId);
      const projSnap = await getDoc(projDocRef);
      if (projSnap.exists()) {
        const projData = projSnap.data() as Project;
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
        await setDocWithSanitize(projDocRef, updatedProj);
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
    techStack?: string,
    username?: string,
    setupCompleted?: boolean
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
  useEffect(() => { setStored('app_vocal_dictionary', vocalDictionary); }, [vocalDictionary]);
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
    
    const collaborators = email ? [email.trim().toLowerCase()] : [];
    if (p.collaborators && Array.isArray(p.collaborators)) {
      p.collaborators.forEach(c => {
        const clower = c.trim().toLowerCase();
        if (clower && !collaborators.includes(clower)) {
          collaborators.push(clower);
        }
      });
    }

    const collaboratorRoles: Record<string, 'admin' | 'editor' | 'viewer'> = email ? { [email.trim().toLowerCase()]: 'admin' } : {};
    if (p.collaboratorRoles) {
      Object.keys(p.collaboratorRoles).forEach(k => {
        collaboratorRoles[k.trim().toLowerCase()] = p.collaboratorRoles[k];
      });
    }

    const newProj = { 
      ...p, 
      id, 
      createdAt: Date.now(),
      ownerId,
      collaborators,
      collaboratorRoles
    };
    setProjects(prev => [...prev, newProj]);
    setDocWithSanitize(doc(db, 'projects', id), newProj).catch(e => handleFirestoreError(e, OperationType.WRITE, `projects/${id}`));

    // Log sync audit & create initial version snapshot
    addSyncLog({
      collection: 'projects',
      status: 'success',
      action: 'create_project',
      details: `Created project '${newProj.name}' (ID: ${id}).`
    });

    const initialVersion: ProjectVersion = {
      id: 'ver_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      projectId: id,
      projectName: newProj.name,
      versionNumber: 1,
      timestamp: Date.now(),
      description: 'Initial project creation snapshot',
      data: JSON.parse(JSON.stringify(newProj))
    };
    setProjectVersions(prev => [initialVersion, ...(prev || [])]);

    return id;
  };

  const updateProject = (id: string, p: Partial<Project>) => {
    setProjects(prev => prev.map(proj => {
      if (proj.id === id) {
        const updated = { ...proj, ...p };
        setDocWithSanitize(doc(db, 'projects', id), updated).catch(e => handleFirestoreError(e, OperationType.WRITE, `projects/${id}`));

        // Version history snapshot on update
        const newVersion: ProjectVersion = {
          id: 'ver_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          projectId: id,
          projectName: updated.name,
          versionNumber: (projectVersions.filter(v => v.projectId === id).length || 0) + 1,
          timestamp: Date.now(),
          description: `Updated project properties (${Object.keys(p).join(', ')})`,
          data: JSON.parse(JSON.stringify(updated))
        };
        setProjectVersions(prev => [newVersion, ...(prev || []).slice(0, 30)]);

        return updated;
      }
      return proj;
    }));
  };
  const deleteProject = (id: string) => {
    const projToDelete = projects.find(p => p.id === id);
    if (projToDelete) {
      // Soft Delete: Move to Trash Bin (30-day retention)
      const deletedRecord: DeletedProject = {
        ...projToDelete,
        originalId: id,
        deletedAt: Date.now(),
        expiresAt: Date.now() + 30 * 86400 * 1000
      };
      setDeletedProjects(prev => [deletedRecord, ...(prev || []).filter(dp => dp.id !== id)]);
      setDocWithSanitize(doc(db, 'deletedProjects', id), deletedRecord).catch(() => {});

      // Add project version history entry before deletion
      const newVersion: ProjectVersion = {
        id: 'ver_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        projectId: id,
        projectName: projToDelete.name,
        versionNumber: (projectVersions.filter(v => v.projectId === id).length || 0) + 1,
        timestamp: Date.now(),
        description: 'Snapshot recorded prior to project soft-deletion',
        data: JSON.parse(JSON.stringify(projToDelete))
      };
      setProjectVersions(prev => [newVersion, ...(prev || [])]);

      addSyncLog({
        collection: 'projects',
        status: 'warn',
        action: 'soft_delete',
        details: `Moved project '${projToDelete.name}' to Trash Bin (Soft-Delete retention).`
      });
    }

    // Clean up project issues in Firestore
    const associatedIssues = issues.filter(i => i.projectId === id);
    associatedIssues.forEach(i => {
      deleteDocWithSanitize(doc(db, 'issues', i.id)).catch(() => {});
    });

    setProjects(prev => {
      const remaining = prev.filter(proj => proj.id !== id);
      setStored('app_projects', remaining);
      if (activeProjectId === id) {
        setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });

    if (lastFirestoreProjectsRef.current) {
      lastFirestoreProjectsRef.current = lastFirestoreProjectsRef.current.filter(p => p.id !== id);
    }

    setIssues(prev => prev.filter(i => i.projectId !== id));
    setPhases(prev => prev.filter(p => p.projectId !== id));
    setNotes(prev => prev.filter(n => n.projectId !== id));
    setAssets(prev => prev.filter(a => a.projectId !== id));

    deleteDocWithSanitize(doc(db, 'projects', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `projects/${id}`));
  };

  const addIssue = (i: Omit<Issue, 'id' | 'createdAt'>): string => {
    const id = crypto.randomUUID();
    const newIss = { ...i, id, createdAt: Date.now() };
    setIssues(prev => [...prev, newIss]);
    setDocWithSanitize(doc(db, 'issues', id), newIss).catch(e => handleFirestoreError(e, OperationType.WRITE, `issues/${id}`));
    return id;
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
    deleteDocWithSanitize(doc(db, 'issues', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `issues/${id}`));
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

  const addNote = (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const now = Date.now();
    const id = crypto.randomUUID();
    const newNote = { ...n, id, createdAt: now, updatedAt: now };
    setNotes(prev => [...prev, newNote]);
    setDocWithSanitize(doc(db, 'notes', id), newNote).catch(e => handleFirestoreError(e, OperationType.WRITE, `notes/${id}`));
    return id;
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
    deleteDocWithSanitize(doc(db, 'notes', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `notes/${id}`));
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
        const updated = {
          ...p,
          isDreamingActive: true,
          dreamProgress: 10,
          dreamFocus: focusMode,
          dreamLogs: initialLogs,
          lastDreamedTime: Date.now()
        };
        setDocWithSanitize(doc(db, 'projects', projectId), updated).catch(e => handleFirestoreError(e, OperationType.WRITE, `projects/${projectId}`));
        return updated;
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

          const updated = {
            ...p,
            dreamRecommendations: combined,
            isDreamingActive: false,
            dreamProgress: 100,
            dreamLogs: [...currentLogs, "✨ Background Dreaming Completed! Alphabetically Sorted & Saved."]
          };
          setDocWithSanitize(doc(db, 'projects', projectId), updated).catch(e => handleFirestoreError(e, OperationType.WRITE, `projects/${projectId}`));
          return updated;
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

          const updated = {
            ...p,
            dreamRecommendations: combined,
            isDreamingActive: false,
            dreamProgress: 100,
            dreamLogs: [...currentLogs, "⚠️ Dreaming completed with warnings. Offline backup patterns loaded, sorted & structured."]
          };
          setDocWithSanitize(doc(db, 'projects', projectId), updated).catch(e => handleFirestoreError(e, OperationType.WRITE, `projects/${projectId}`));
          return updated;
        }
        return p;
      }));
    }
  };

  const analyzeProjectCommits = async (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    
    const repos = proj.githubRepos || [];
    const repo = repos[0] || "";
    if (!repo) {
      showToast("No GitHub repository linked to this project.", "error");
      return;
    }

    showToast(`Scanning commits for project "${proj.name}"...`, "info");

    try {
      const activeToken = githubToken || "";
      const res = await fetch('/api/github/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, token: activeToken || undefined })
      });

      if (!res.ok) {
        throw new Error("Failed to pull commits from GitHub API.");
      }

      const commitsData = await res.json();
      if (!Array.isArray(commitsData) || commitsData.length === 0) {
        showToast("No remote commits found for this repository.", "info");
        return;
      }

      const existingAnalyzed = proj.analyzedCommits || [];
      const analyzedShas = new Set(existingAnalyzed.map(ac => ac.sha));
      const newlyAnalyzed: typeof existingAnalyzed = [];

      // Only analyze the newest 3 unanalyzed commits to save tokens/avoid heavy rate limits
      const unanalyzedCommits = commitsData
        .filter((c: any) => !analyzedShas.has(c.sha))
        .slice(0, 3);

      if (unanalyzedCommits.length === 0) {
        showToast(`All commits for "${proj.name}" are analyzed.`, "success");
        return;
      }

      showToast(`Analyzing ${unanalyzedCommits.length} new commit(s) with Gemini...`, "info");

      for (const commit of unanalyzedCommits) {
        try {
          const sha = commit.sha;
          const msg = commit.commit.message;
          const authorName = commit.commit.author.name;
          const dateStr = commit.commit.author.date;

          const analyzeRes = await fetch('/api/github/analyze-commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repo,
              sha,
              message: msg,
              author: authorName,
              date: dateStr,
              token: activeToken || undefined
            })
          });

          if (!analyzeRes.ok) {
            console.warn(`Failed to analyze commit ${sha}`);
            continue;
          }

          const analysisResult = await analyzeRes.json();

          let suggestedIssueId: string | undefined = undefined;
          let suggestedNoteId: string | undefined = undefined;

          // 1. If Gemini suggested an issue, create it
          if (analysisResult.suggestedIssue) {
            const iss = analysisResult.suggestedIssue;
            suggestedIssueId = addIssue({
              projectId,
              title: `${iss.title} (Commit Ref: ${sha.substring(0, 7)})`,
              description: `Auto-generated from Commit analysis of ${sha.substring(0, 7)} by ${authorName}:\n\n${iss.description}`,
              type: iss.type || 'Task',
              status: 'Todo',
              priority: iss.priority || 'Medium',
              labels: ['commit-watcher', `commit-${sha.substring(0, 7)}`]
            });
          }

          // 2. If Gemini suggested a documentation note, create it
          if (analysisResult.suggestedNote) {
            const nt = analysisResult.suggestedNote;
            suggestedNoteId = addNote({
              projectId,
              title: `${nt.title} (Commit Ref: ${sha.substring(0, 7)})`,
              content: `### Commit Documentation Note\n*Commit SHA: [${sha}](https://github.com/${repo}/commit/${sha})*\n*Author: ${authorName}*\n*Date: ${new Date(dateStr).toLocaleString()}*\n\n${nt.content}`,
              tags: ['commit-documentation', `commit-${sha.substring(0, 7)}`]
            });
          }

          newlyAnalyzed.push({
            sha,
            message: msg.split('\n')[0],
            author: authorName,
            date: new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            summary: analysisResult.summary,
            impact: analysisResult.impact || 'Low',
            achievements: analysisResult.achievements || [],
            analyzedAt: Date.now(),
            suggestedIssueId,
            suggestedNoteId
          });

          showToast(`Analyzed commit ${sha.substring(0, 7)}: Auto-created task and note!`, "success", 4000);

        } catch (e) {
          console.error(`Error analyzing individual commit ${commit.sha}:`, e);
        }
      }

      // Combine and save
      const finalAnalyzed = [...newlyAnalyzed, ...existingAnalyzed];
      updateProject(projectId, { analyzedCommits: finalAnalyzed });

    } catch (err: any) {
      console.error("Failed running commit watcher:", err);
      showToast(`Error scanning commits: ${err.message}`, "error");
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
        } else if (
          error?.code === 'resource-exhausted' ||
          error?.message?.includes('Quota exceeded') ||
          error?.message?.includes('quota') ||
          getIsFirestoreQuotaExceeded()
        ) {
          console.warn("Shared macros subscription skipped (Quota exceeded, using local state)");
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
        await deleteDocWithSanitize(macroRef);
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
      projects, setProjects, addProject, updateProject, deleteProject, startProjectDreaming, analyzeProjectCommits,
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
      vocalDictionary, setVocalDictionary,
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
      isQuotaExceeded,
      toasts,
      showToast,
      removeToast,
      triggerFullSync,
      isOnline,

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
      incrementDownloadsSharedMacro,
      linkedUids,
      setLinkedUids,
      reconcileUserAccounts,
      forceReconcileIdentities,
      startupTimeline,

      // Phase 4.0 Recovery & Data Protection Properties
      deletedProjects,
      restoreDeletedProject,
      permanentlyDeleteProject,
      workspaceBackups,
      createWorkspaceBackup,
      restoreWorkspaceBackup,
      syncConflict,
      resolveSyncConflict,
      syncAuditLogs,
      addSyncLog,
      projectVersions,
      restoreProjectVersion
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </DataContext.Provider>
  );
}
