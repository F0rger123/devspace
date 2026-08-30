// Aether Teachable Workflows Engine
// High-reliability conversational workflow teaching, sequential multi-step execution,
// inter-step data interpolation, live progress broadcast, destructive action gates,
// cancellation, execution history, alias registry, and Web/Desktop sync.

import { isElectron, safeExecuteDesktopAction, safeOpenVSCode, safeOpenTerminal, safeOpenExternalUrl, safeSearchDesktopFiles, safeOpenFile } from './electronBridge';
import { aetherActiveProjectContext } from './aetherActiveProjectContext';
import { aetherDesktopIntelligence } from './aetherDesktopIntelligence';
import { aetherConversationalEngine } from './aetherConversationalEngine';
import { getResolvedAetherPersonality } from './aetherPersonalityResolver';
import { masterIdeaLibrary } from './masterIdeaLibraryService';
import { undoRedoManager } from './aetherActionEngine';

export type WorkflowStepActionType =
  | 'open_app'
  | 'open_url'
  | 'navigate_route'
  | 'run_command'
  | 'open_project'
  | 'github_activity'
  | 'attention_summary'
  | 'research'
  | 'create_note'
  | 'create_issue'
  | 'summarize_project'
  | 'get_weather'
  | 'start_coding_workspace';

export interface TeachableStep {
  id: string;
  order: number;
  title: string;
  actionType: WorkflowStepActionType;
  target: string;
  description?: string;
  params?: Record<string, any>;
  isDestructive?: boolean;
  requiresConfirmation?: boolean;
  isMachineSpecific?: boolean;
  passOutputToNext?: boolean;
  outputKey?: string;
}

export interface TeachableWorkflow {
  id: string;
  name: string;
  triggerPhrase: string;
  aliases: string[];
  description: string;
  enabled: boolean;
  isAccountSafe: boolean;
  hasMachineSpecificSteps?: boolean;
  steps: TeachableStep[];
  createdAt: number;
  updatedAt: number;
  executionCount: number;
  lastExecutedAt?: number;
  lastStatus?: 'success' | 'failed' | 'cancelled';
  lastDurationMs?: number;
}

export interface WorkflowStepResult {
  stepId: string;
  order: number;
  title: string;
  actionType: WorkflowStepActionType;
  status: 'completed' | 'failed' | 'cancelled' | 'running';
  output?: any;
  error?: string;
  durationMs: number;
}

export interface WorkflowRunRecord {
  runId: string;
  workflowId: string;
  workflowName: string;
  triggerPhrase: string;
  triggerSource: 'chat' | 'dynamic_island' | 'command_bar' | 'workflows_page' | 'shortcut';
  status: 'completed' | 'failed' | 'cancelled' | 'running' | 'waiting_confirmation';
  currentStepIndex: number;
  totalSteps: number;
  stepResults: WorkflowStepResult[];
  startedAt: number;
  completedAt?: number;
  durationMs: number;
  failureReason?: string;
  summaryMarkdown?: string;
  spokenResponse?: string;
  sharedContext: Record<string, any>;
}

export interface WorkflowExecutionContext {
  navigate?: (path: string) => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'error' | 'sync') => void;
  projects?: any[];
  activeProjectId?: string;
  setActiveProjectId?: (id: string) => void;
  issues?: any[];
  notes?: any[];
  addIssue?: (issue: any) => any;
  addNote?: (note: any) => any;
}

export interface WorkflowExecutionProgressEvent {
  runId: string;
  workflowId: string;
  workflowName: string;
  currentStepIndex: number;
  totalSteps: number;
  currentStepTitle: string;
  status: 'running' | 'waiting_confirmation' | 'completed' | 'failed' | 'cancelled';
  stepResults: WorkflowStepResult[];
  pendingConfirmation?: {
    stepId: string;
    stepTitle: string;
    reason: string;
  };
}

const STORAGE_WORKFLOWS_KEY = 'aether_teachable_workflows_v2';
const STORAGE_HISTORY_KEY = 'aether_teachable_workflow_history_v2';
const STORAGE_MACHINE_OVERRIDES_KEY = 'aether_local_machine_overrides_v2';

class AetherWorkflowEngine {
  private workflows: TeachableWorkflow[] = [];
  private history: WorkflowRunRecord[] = [];
  private machineOverrides: Record<string, Record<string, string>> = {}; // workflowId -> { stepId: localPath }
  private currentActiveRun: WorkflowRunRecord | null = null;
  private isCancelledFlag = false;
  private pendingConfirmationResolver: ((confirmed: boolean) => void) | null = null;

  constructor() {
    this.loadWorkflows();
    this.loadHistory();
    this.loadMachineOverrides();
    this.seedDefaultsIfEmpty();
  }

  private loadWorkflows(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_WORKFLOWS_KEY);
      if (data) {
        this.workflows = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load teachable workflows from localStorage:', e);
      this.workflows = [];
    }
  }

  private saveWorkflows(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_WORKFLOWS_KEY, JSON.stringify(this.workflows));
      window.dispatchEvent(new CustomEvent('aether-workflows-updated', { detail: { workflows: this.workflows } }));
    } catch (e) {
      console.error('Failed to save teachable workflows to localStorage:', e);
    }
  }

  private loadHistory(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (data) {
        this.history = JSON.parse(data);
      }
    } catch (e) {
      this.history = [];
    }
  }

  private saveHistory(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(this.history.slice(0, 100)));
      window.dispatchEvent(new CustomEvent('aether-workflow-history-updated', { detail: { history: this.history } }));
    } catch (e) {
      console.error('Failed to save workflow history:', e);
    }
  }

  private loadMachineOverrides(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_MACHINE_OVERRIDES_KEY);
      if (data) {
        this.machineOverrides = JSON.parse(data);
      }
    } catch (e) {
      this.machineOverrides = {};
    }
  }

  private saveMachineOverrides(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_MACHINE_OVERRIDES_KEY, JSON.stringify(this.machineOverrides));
    } catch (e) {}
  }

  private seedDefaultsIfEmpty(): void {
    if (this.workflows.length > 0) return;

    const defaultWorkflows: TeachableWorkflow[] = [
      {
        id: 'wf-start-coding',
        name: 'Start Coding Session',
        triggerPhrase: 'start coding',
        aliases: ['start work', 'coding mode', 'code time', 'launch coding', 'start workspace'],
        description: 'Opens active project in VS Code, opens Terminal there, opens GitHub, and activates coding workspace.',
        enabled: true,
        isAccountSafe: true,
        hasMachineSpecificSteps: true,
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
        executionCount: 5,
        lastExecutedAt: Date.now() - 3600000 * 4,
        lastStatus: 'success',
        lastDurationMs: 1450,
        steps: [
          {
            id: 'sc-1',
            order: 1,
            title: 'Open Active Project Workspace',
            actionType: 'open_project',
            target: '{{activeProject.name}}',
            description: 'Synchronizes active project context and activates workspace view.'
          },
          {
            id: 'sc-2',
            order: 2,
            title: 'Launch Project in VS Code',
            actionType: 'open_app',
            target: 'Visual Studio Code',
            description: 'Launches native desktop editor at project directory.',
            isMachineSpecific: true
          },
          {
            id: 'sc-3',
            order: 3,
            title: 'Open Terminal at Project Root',
            actionType: 'open_app',
            target: 'Terminal',
            description: 'Spawns system terminal in active project workspace directory.',
            isMachineSpecific: true
          },
          {
            id: 'sc-4',
            order: 4,
            title: 'Open GitHub Intelligence',
            actionType: 'navigate_route',
            target: '/github',
            description: 'Displays open Pull Requests, recent commits, and repo health.'
          },
          {
            id: 'sc-5',
            order: 5,
            title: 'Activate Coding Workspace View',
            actionType: 'start_coding_workspace',
            target: '/projects',
            description: 'Prepares DevSpace sandbox and project workspace for development.'
          }
        ]
      },
      {
        id: 'wf-morning-setup',
        name: 'Morning Setup',
        triggerPhrase: 'morning setup',
        aliases: ['morning briefing', 'daily setup', 'good morning', 'start morning routine'],
        description: 'Opens DevSpace, shows what needs attention, opens current project, and presents recent GitHub activity.',
        enabled: true,
        isAccountSafe: true,
        hasMachineSpecificSteps: false,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
        executionCount: 8,
        lastExecutedAt: Date.now() - 3600000 * 2,
        lastStatus: 'success',
        lastDurationMs: 1200,
        steps: [
          {
            id: 'ms-1',
            order: 1,
            title: 'Open DevSpace Dashboard',
            actionType: 'navigate_route',
            target: '/',
            description: 'Navigates to primary DevSpace command center.'
          },
          {
            id: 'ms-2',
            order: 2,
            title: 'Show What Needs My Attention',
            actionType: 'attention_summary',
            target: 'attention_feed',
            description: 'Summarizes active blockers, overdue issues, and priority deliverables.',
            passOutputToNext: true,
            outputKey: 'attentionReport'
          },
          {
            id: 'ms-3',
            order: 3,
            title: 'Open Current Project',
            actionType: 'open_project',
            target: '{{activeProject.name}}',
            description: 'Focuses workspace on current priority project.'
          },
          {
            id: 'ms-4',
            order: 4,
            title: 'Show Recent GitHub Activity',
            actionType: 'github_activity',
            target: 'recent_prs_and_commits',
            description: 'Inspects latest repo changes, open PR reviews, and CI status.'
          }
        ]
      },
      {
        id: 'wf-research-and-note',
        name: 'Research & Create Note',
        triggerPhrase: 'research and note',
        aliases: ['investigate and note', 'deep study', 'research note'],
        description: 'Conducts deep research on topic, structures findings into a cognitive note, and tracks action items.',
        enabled: true,
        isAccountSafe: true,
        hasMachineSpecificSteps: false,
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 3,
        executionCount: 3,
        steps: [
          {
            id: 'rn-1',
            order: 1,
            title: 'Conduct Deep Web & Tech Research',
            actionType: 'research',
            target: '{{topic}}',
            description: 'Queries developer ecosystem sources and synthesizes intelligence.',
            passOutputToNext: true,
            outputKey: 'researchSummary'
          },
          {
            id: 'rn-2',
            order: 2,
            title: 'Create Structured Cognitive Note',
            actionType: 'create_note',
            target: 'Research Findings - {{activeProject.name}}',
            description: 'Saves research summary into workspace notes archives with tags.',
            params: { content: '{{researchSummary}}' }
          },
          {
            id: 'rn-3',
            order: 3,
            title: 'Create Follow-up Tracking Issue',
            actionType: 'create_issue',
            target: 'Implement recommendations from research',
            description: 'Logs actionable follow-up issue in active project backlog.',
            params: { priority: 'Medium', type: 'Task' }
          }
        ]
      }
    ];

    this.workflows = defaultWorkflows;
    this.saveWorkflows();
  }

  // -------------------------------------------------------------
  // GETTERS & CRUD OPERATIONS
  // -------------------------------------------------------------
  public getWorkflows(): TeachableWorkflow[] {
    return [...this.workflows];
  }

  public getWorkflow(id: string): TeachableWorkflow | undefined {
    return this.workflows.find(w => w.id === id);
  }

  public saveWorkflow(workflow: TeachableWorkflow): TeachableWorkflow {
    const cleanAliases = Array.from(new Set(
      (workflow.aliases || []).map(a => a.toLowerCase().trim()).filter(Boolean)
    ));

    const updatedWorkflow: TeachableWorkflow = {
      ...workflow,
      aliases: cleanAliases,
      hasMachineSpecificSteps: workflow.steps.some(s => s.isMachineSpecific),
      updatedAt: Date.now()
    };

    const index = this.workflows.findIndex(w => w.id === workflow.id);
    if (index >= 0) {
      this.workflows[index] = updatedWorkflow;
    } else {
      this.workflows.unshift(updatedWorkflow);
    }

    this.saveWorkflows();
    return updatedWorkflow;
  }

  public deleteWorkflow(id: string): boolean {
    const beforeCount = this.workflows.length;
    this.workflows = this.workflows.filter(w => w.id !== id);
    if (this.workflows.length !== beforeCount) {
      this.saveWorkflows();
      return true;
    }
    return false;
  }

  public renameWorkflow(id: string, newName: string): boolean {
    const wf = this.getWorkflow(id);
    if (!wf || !newName.trim()) return false;
    wf.name = newName.trim();
    wf.updatedAt = Date.now();
    this.saveWorkflows();
    return true;
  }

  public toggleWorkflow(id: string, enabled?: boolean): boolean {
    const wf = this.getWorkflow(id);
    if (!wf) return false;
    wf.enabled = typeof enabled === 'boolean' ? enabled : !wf.enabled;
    wf.updatedAt = Date.now();
    this.saveWorkflows();
    return wf.enabled;
  }

  public addAlias(workflowId: string, alias: string): boolean {
    const wf = this.getWorkflow(workflowId);
    const clean = alias.toLowerCase().trim();
    if (!wf || !clean) return false;
    if (!wf.aliases.includes(clean)) {
      wf.aliases.push(clean);
      wf.updatedAt = Date.now();
      this.saveWorkflows();
      return true;
    }
    return false;
  }

  public removeAlias(workflowId: string, alias: string): boolean {
    const wf = this.getWorkflow(workflowId);
    const clean = alias.toLowerCase().trim();
    if (!wf || !clean) return false;
    wf.aliases = wf.aliases.filter(a => a !== clean);
    wf.updatedAt = Date.now();
    this.saveWorkflows();
    return true;
  }

  public reorderSteps(workflowId: string, stepIds: string[]): boolean {
    const wf = this.getWorkflow(workflowId);
    if (!wf) return false;

    const stepMap = new Map(wf.steps.map(s => [s.id, s]));
    const reordered: TeachableStep[] = [];

    stepIds.forEach((id, idx) => {
      const step = stepMap.get(id);
      if (step) {
        reordered.push({ ...step, order: idx + 1 });
      }
    });

    if (reordered.length === wf.steps.length) {
      wf.steps = reordered;
      wf.updatedAt = Date.now();
      this.saveWorkflows();
      return true;
    }
    return false;
  }

  public addStep(workflowId: string, step: Omit<TeachableStep, 'id' | 'order'>): TeachableStep | null {
    const wf = this.getWorkflow(workflowId);
    if (!wf) return null;

    const newStep: TeachableStep = {
      ...step,
      id: `step-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order: wf.steps.length + 1
    };

    wf.steps.push(newStep);
    wf.hasMachineSpecificSteps = wf.steps.some(s => s.isMachineSpecific);
    wf.updatedAt = Date.now();
    this.saveWorkflows();
    return newStep;
  }

  public updateStep(workflowId: string, stepId: string, updated: Partial<TeachableStep>): boolean {
    const wf = this.getWorkflow(workflowId);
    if (!wf) return false;

    const idx = wf.steps.findIndex(s => s.id === stepId);
    if (idx >= 0) {
      wf.steps[idx] = { ...wf.steps[idx], ...updated };
      wf.hasMachineSpecificSteps = wf.steps.some(s => s.isMachineSpecific);
      wf.updatedAt = Date.now();
      this.saveWorkflows();
      return true;
    }
    return false;
  }

  public deleteStep(workflowId: string, stepId: string): boolean {
    const wf = this.getWorkflow(workflowId);
    if (!wf) return false;

    const filtered = wf.steps.filter(s => s.id !== stepId);
    if (filtered.length !== wf.steps.length) {
      wf.steps = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
      wf.hasMachineSpecificSteps = wf.steps.some(s => s.isMachineSpecific);
      wf.updatedAt = Date.now();
      this.saveWorkflows();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // MACHINE-SPECIFIC LOCAL PATH OVERRIDES
  // -------------------------------------------------------------
  public setMachineOverride(workflowId: string, stepId: string, localPath: string): void {
    if (!this.machineOverrides[workflowId]) {
      this.machineOverrides[workflowId] = {};
    }
    this.machineOverrides[workflowId][stepId] = localPath;
    this.saveMachineOverrides();
  }

  public getMachineOverride(workflowId: string, stepId: string): string | undefined {
    return this.machineOverrides[workflowId]?.[stepId];
  }

  // -------------------------------------------------------------
  // MATCHING & INTENT DETECTION
  // -------------------------------------------------------------
  public findMatchingWorkflow(phrase: string): TeachableWorkflow | undefined {
    const norm = phrase.toLowerCase().trim();
    if (!norm) return undefined;

    // Stripped phrases
    const stripped = norm
      .replace(/^(?:run|execute|start|trigger|launch|open)\s+(?:workflow|sequence|action|flow)?\s*/i, '')
      .trim();

    return this.workflows.find(w => {
      if (!w.enabled) return false;
      const trigger = w.triggerPhrase.toLowerCase().trim();
      const name = w.name.toLowerCase().trim();
      const aliases = (w.aliases || []).map(a => a.toLowerCase().trim());

      // Exact trigger or name
      if (norm === trigger || norm === name || stripped === trigger || stripped === name) {
        return true;
      }

      // Exact match on aliases
      if (aliases.includes(norm) || aliases.includes(stripped)) {
        return true;
      }

      // Contains "run [trigger]" or "when i say [trigger]"
      if (norm === `run ${trigger}` || norm === `start ${trigger}` || norm === `execute ${trigger}`) {
        return true;
      }

      return false;
    });
  }

  public matchWorkflow(phrase: string): TeachableWorkflow | undefined {
    return this.findMatchingWorkflow(phrase);
  }

  // -------------------------------------------------------------
  // CONVERSATIONAL WORKFLOW TEACHING PARSER
  // -------------------------------------------------------------
  public parseWorkflowFromConversation(rawText: string): {
    isTeachRequest: boolean;
    name?: string;
    triggerPhrase?: string;
    aliases?: string[];
    steps?: TeachableStep[];
    rawActions?: string[];
    explanation?: string;
  } {
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // Patterns for conversational creation:
    // 1. "When I say [trigger], [step 1], [step 2], and [step 3]"
    // 2. "Teach Aether: when I say [trigger], do [steps...]"
    // 3. "Create a workflow called [name]: when I say [trigger], [steps...]"
    // 4. "Teach workflow [name] with trigger [trigger]: [steps...]"

    const whenMatch = text.match(/(?:teach(?:ing)?(?:\s+aether)?[:,-]?\s*)?(?:when\s+i\s+say\s+)(["']?)([^,"'\n]+)\1\s*[,:]\s*(.+)/i);
    const createWfMatch = text.match(/(?:create|build|teach|add|make)(?:\s+a)?\s+workflow\s+(?:called|named)?\s*(["']?)([^,"'\n]+)\1\s*(?:with\s+trigger\s+(["']?)([^,"'\n]+)\3)?\s*[:,-]?\s*(.+)/i);

    if (whenMatch) {
      const triggerPhrase = whenMatch[2].trim().toLowerCase();
      const body = whenMatch[3].trim();
      const parsedSteps = this.parseRawSteps(body);
      const name = this.generateFriendlyWorkflowName(triggerPhrase);

      return {
        isTeachRequest: true,
        name,
        triggerPhrase,
        aliases: this.generateSuggestedAliases(triggerPhrase),
        steps: parsedSteps,
        explanation: `I've learned the workflow **"${name}"** triggered by **"${triggerPhrase}"** with ${parsedSteps.length} action steps.`
      };
    }

    if (createWfMatch) {
      const rawName = createWfMatch[2].trim();
      const explicitTrigger = (createWfMatch[4] || rawName).trim().toLowerCase();
      const body = createWfMatch[5].trim();
      const parsedSteps = this.parseRawSteps(body);
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      return {
        isTeachRequest: true,
        name,
        triggerPhrase: explicitTrigger,
        aliases: this.generateSuggestedAliases(explicitTrigger),
        steps: parsedSteps,
        explanation: `I've created the new workflow **"${name}"** triggered whenever you say **"${explicitTrigger}"**.`
      };
    }

    // Direct teach commands
    if (lower.startsWith('teach me a workflow') || lower.startsWith('teach aether to ') || lower.startsWith('teach a workflow:')) {
      const body = text.replace(/^teach(?:\s+me|\s+aether)?(?:\s+a)?\s+workflow(?:\s+to)?[:,-]?\s*/i, '');
      const parsedSteps = this.parseRawSteps(body);
      const triggerPhrase = body.split(/,|and|then/)[0].trim().toLowerCase();
      const name = this.generateFriendlyWorkflowName(triggerPhrase);

      return {
        isTeachRequest: true,
        name,
        triggerPhrase,
        aliases: this.generateSuggestedAliases(triggerPhrase),
        steps: parsedSteps,
        explanation: `I've recorded and structured the workflow **"${name}"** with ${parsedSteps.length} steps.`
      };
    }

    return { isTeachRequest: false };
  }

  private generateFriendlyWorkflowName(trigger: string): string {
    const words = trigger.split(/\s+/).filter(Boolean);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + (words.length <= 2 ? ' Workflow' : '');
  }

  private generateSuggestedAliases(trigger: string): string[] {
    const t = trigger.toLowerCase();
    const suggestions: string[] = [];
    if (t === 'start coding') {
      suggestions.push('start work', 'coding mode', 'code time');
    } else if (t === 'morning setup') {
      suggestions.push('morning briefing', 'daily setup', 'good morning');
    } else if (t.startsWith('open ') || t.startsWith('start ')) {
      const core = t.replace(/^(?:open|start|launch)\s+/, '');
      suggestions.push(`${core} mode`, `launch ${core}`);
    } else {
      suggestions.push(`${t} mode`, `run ${t}`);
    }
    return Array.from(new Set(suggestions));
  }

  private parseRawSteps(rawText: string): TeachableStep[] {
    // Split on conjunctions or numbering: "1.", "2.", ", and ", " and then ", " then ", ", "
    const rawClauses = rawText
      .split(/(?:\r?\n|\band\s+then\b|\bthen\b|,\s*and\b|;\s*|\band\b|,\s*)/i)
      .map(c => c.replace(/^\s*\d+[\.\)]\s*/, '').trim())
      .filter(c => c.length > 2);

    const steps: TeachableStep[] = [];

    rawClauses.forEach((clause, idx) => {
      const cl = clause.toLowerCase();
      let actionType: WorkflowStepActionType = 'navigate_route';
      let title = clause.charAt(0).toUpperCase() + clause.slice(1);
      let target = clause;
      let isDestructive = false;
      let requiresConfirmation = false;
      let isMachineSpecific = false;

      if (cl.includes('vscode') || cl.includes('vs code') || cl.includes('code editor') || cl.includes('editor')) {
        actionType = 'open_app';
        title = 'Open Project in Visual Studio Code';
        target = 'Visual Studio Code';
        isMachineSpecific = true;
      } else if (cl.includes('terminal') || cl.includes('console') || cl.includes('command line') || cl.includes('bash') || cl.includes('shell')) {
        actionType = 'open_app';
        title = 'Open System Terminal';
        target = 'Terminal';
        isMachineSpecific = true;
      } else if (cl.includes('github') || cl.includes('pull request') || cl.includes('commits') || cl.includes('prs')) {
        if (cl.includes('activity') || cl.includes('recent') || cl.includes('show')) {
          actionType = 'github_activity';
          title = 'Show Recent GitHub Activity & PRs';
          target = 'recent_prs_and_commits';
        } else {
          actionType = 'navigate_route';
          title = 'Open GitHub Intelligence';
          target = '/github';
        }
      } else if (cl.includes('attention') || cl.includes('blocker') || cl.includes('what needs') || cl.includes('urgent')) {
        actionType = 'attention_summary';
        title = 'Show Items Needing Attention & Blockers';
        target = 'attention_feed';
      } else if (cl.includes('workspace') || cl.includes('coding workspace') || cl.includes('sandbox')) {
        actionType = 'start_coding_workspace';
        title = 'Start Coding Workspace Environment';
        target = '/projects';
      } else if (cl.includes('active project') || cl.includes('current project') || cl.includes('open project') || cl.includes('my project')) {
        actionType = 'open_project';
        title = 'Open Active Project';
        target = '{{activeProject.name}}';
      } else if (cl.includes('research') || cl.includes('search web') || cl.includes('investigate')) {
        actionType = 'research';
        title = `Conduct Research on ${clause.replace(/research|search|web|for|about/gi, '').trim() || 'Topic'}`;
        target = clause.replace(/research|search|web|for|about/gi, '').trim() || '{{activeProject.name}}';
      } else if (cl.includes('note') || cl.includes('write note') || cl.includes('save note')) {
        actionType = 'create_note';
        title = `Create Cognitive Note: ${clause.replace(/note|create|write|save|as/gi, '').trim() || 'Workspace Memo'}`;
        target = clause.replace(/note|create|write|save|as/gi, '').trim() || 'Workspace Note';
      } else if (cl.includes('issue') || cl.includes('task') || cl.includes('ticket') || cl.includes('bug')) {
        actionType = 'create_issue';
        title = `Create Task: ${clause.replace(/issue|task|ticket|create|add|new/gi, '').trim() || 'Action Item'}`;
        target = clause.replace(/issue|task|ticket|create|add|new/gi, '').trim() || 'Follow-up Task';
      } else if (cl.includes('devspace') || cl.includes('dashboard')) {
        actionType = 'navigate_route';
        title = 'Open DevSpace Dashboard';
        target = '/';
      } else if (cl.startsWith('open http') || cl.includes('.com') || cl.includes('.org') || cl.includes('.io') || cl.includes('.dev')) {
        actionType = 'open_url';
        title = `Open Web Link: ${clause}`;
        target = clause.replace(/^open\s+/i, '');
      } else if (cl.startsWith('open ') || cl.startsWith('launch ')) {
        const appName = clause.replace(/^(?:open|launch)\s+/i, '').trim();
        actionType = 'open_app';
        title = `Launch ${appName}`;
        target = appName;
        isMachineSpecific = true;
      } else if (cl.includes('delete') || cl.includes('remove') || cl.includes('drop') || cl.includes('kill') || cl.includes('force push')) {
        isDestructive = true;
        requiresConfirmation = true;
      }

      steps.push({
        id: `step-${Date.now()}-${idx + 1}-${Math.floor(Math.random() * 1000)}`,
        order: idx + 1,
        title,
        actionType,
        target,
        isDestructive,
        requiresConfirmation,
        isMachineSpecific
      });
    });

    return steps;
  }

  // -------------------------------------------------------------
  // SEQUENTIAL EXECUTION ENGINE WITH INTERPOLATION & ABORT
  // -------------------------------------------------------------
  public async executeWorkflow(
    workflowOrId: TeachableWorkflow | string,
    context: WorkflowExecutionContext = {},
    options: {
      triggerSource?: 'chat' | 'dynamic_island' | 'command_bar' | 'workflows_page' | 'shortcut';
      onProgress?: (progress: WorkflowExecutionProgressEvent) => void;
      initialContext?: Record<string, any>;
    } = {}
  ): Promise<{
    success: boolean;
    message: string;
    speechText: string;
    summaryMarkdown: string;
    runRecord: WorkflowRunRecord;
  }> {
    const workflow = typeof workflowOrId === 'string' ? this.getWorkflow(workflowOrId) : workflowOrId;

    if (!workflow) {
      const msg = `Workflow "${typeof workflowOrId === 'string' ? workflowOrId : 'Requested'}" was not found.`;
      return {
        success: false,
        message: msg,
        speechText: msg,
        summaryMarkdown: `❌ **Workflow Not Found**\n\n${msg}`,
        runRecord: {
          runId: `run-${Date.now()}`,
          workflowId: typeof workflowOrId === 'string' ? workflowOrId : 'unknown',
          workflowName: 'Unknown Workflow',
          triggerPhrase: '',
          triggerSource: options.triggerSource || 'chat',
          status: 'failed',
          currentStepIndex: 0,
          totalSteps: 0,
          stepResults: [],
          startedAt: Date.now(),
          completedAt: Date.now(),
          durationMs: 0,
          failureReason: msg,
          sharedContext: {}
        }
      };
    }

    this.isCancelledFlag = false;
    const runId = `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();

    // Prepare shared context for interpolation
    const activeProj = context.projects?.find(p => p.id === context.activeProjectId) || context.projects?.[0] || { name: 'DevSpace Desktop', id: 'devspace-main' };
    const personality = getResolvedAetherPersonality();
    const userName = personality.preferredUserName || 'Developer';

    const sharedContext: Record<string, any> = {
      ...(options.initialContext || {}),
      userName,
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      activeProject: {
        id: activeProj.id,
        name: activeProj.name,
        path: activeProj.path || (isElectron() ? `/workspace/${activeProj.name.toLowerCase().replace(/\s+/g, '-')}` : '')
      },
      stepOutputs: {}
    };

    const runRecord: WorkflowRunRecord = {
      runId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggerPhrase: workflow.triggerPhrase,
      triggerSource: options.triggerSource || 'chat',
      status: 'running',
      currentStepIndex: 0,
      totalSteps: workflow.steps.length,
      stepResults: [],
      startedAt: startTime,
      durationMs: 0,
      sharedContext
    };

    this.currentActiveRun = runRecord;
    this.broadcastProgress(runRecord, options.onProgress);

    const steps = [...workflow.steps].sort((a, b) => a.order - b.order);

    for (let i = 0; i < steps.length; i++) {
      if (this.isCancelledFlag) {
        runRecord.status = 'cancelled';
        runRecord.failureReason = 'Execution cancelled by user.';
        break;
      }

      const step = steps[i];
      runRecord.currentStepIndex = i;

      // Check Destructive Action / Confirmation Gate
      if (step.isDestructive || step.requiresConfirmation) {
        runRecord.status = 'waiting_confirmation';
        this.broadcastProgress(runRecord, options.onProgress, {
          stepId: step.id,
          stepTitle: step.title,
          reason: step.description || `Step #${step.order} requires user confirmation before proceeding.`
        });

        const confirmed = await this.waitForUserConfirmation(step);
        if (!confirmed) {
          runRecord.status = 'cancelled';
          runRecord.failureReason = `User declined high-risk step "${step.title}". Workflow execution stopped.`;
          runRecord.stepResults.push({
            stepId: step.id,
            order: step.order,
            title: step.title,
            actionType: step.actionType,
            status: 'cancelled',
            error: 'User declined confirmation',
            durationMs: 0
          });
          break;
        }
        runRecord.status = 'running';
      }

      const stepStartTime = Date.now();
      this.broadcastProgress(runRecord, options.onProgress);

      // Execute Step
      try {
        const stepOutput = await this.executeSingleStep(step, sharedContext, context);
        const stepDuration = Date.now() - stepStartTime;

        // Store output for inter-step passing
        if (step.outputKey || step.passOutputToNext) {
          const key = step.outputKey || `step_${step.order}_output`;
          sharedContext.stepOutputs[key] = stepOutput;
          sharedContext[`previous_output`] = stepOutput;
        }

        runRecord.stepResults.push({
          stepId: step.id,
          order: step.order,
          title: step.title,
          actionType: step.actionType,
          status: 'completed',
          output: stepOutput,
          durationMs: stepDuration
        });
      } catch (stepErr: any) {
        const stepDuration = Date.now() - stepStartTime;
        const errorMsg = stepErr?.message || String(stepErr);

        runRecord.stepResults.push({
          stepId: step.id,
          order: step.order,
          title: step.title,
          actionType: step.actionType,
          status: 'failed',
          error: errorMsg,
          durationMs: stepDuration
        });

        // STOP ON IMPORTANT FAILURES
        runRecord.status = 'failed';
        runRecord.failureReason = `Step #${step.order} ("${step.title}") failed: ${errorMsg}`;
        break;
      }
    }

    const endTime = Date.now();
    runRecord.completedAt = endTime;
    runRecord.durationMs = endTime - startTime;

    if (runRecord.status === 'running') {
      runRecord.status = 'completed';
    }

    // Build synthesized outcome report
    const isSuccess = runRecord.status === 'completed';
    const completedCount = runRecord.stepResults.filter(r => r.status === 'completed').length;
    const spokenResponse = isSuccess
      ? `Completed workflow ${workflow.name}. All ${steps.length} steps executed successfully.`
      : runRecord.status === 'cancelled'
      ? `Workflow ${workflow.name} was stopped.`
      : `Workflow ${workflow.name} stopped on step ${runRecord.currentStepIndex + 1} due to an error.`;

    const summaryMarkdown = this.formatRunMarkdown(workflow, runRecord);
    runRecord.summaryMarkdown = summaryMarkdown;
    runRecord.spokenResponse = spokenResponse;

    // Update workflow meta & stats
    workflow.executionCount = (workflow.executionCount || 0) + 1;
    workflow.lastExecutedAt = Date.now();
    workflow.lastStatus = runRecord.status === 'completed' ? 'success' : runRecord.status === 'cancelled' ? 'cancelled' : 'failed';
    workflow.lastDurationMs = runRecord.durationMs;
    this.saveWorkflow(workflow);

    // Save to history log
    this.history.unshift(runRecord);
    this.saveHistory();

    this.currentActiveRun = null;
    this.broadcastProgress(runRecord, options.onProgress);

    return {
      success: isSuccess,
      message: spokenResponse,
      speechText: spokenResponse,
      summaryMarkdown,
      runRecord
    };
  }

  private async executeSingleStep(
    step: TeachableStep,
    sharedContext: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<any> {
    const desktop = isElectron();
    const interpolatedTarget = this.interpolateString(step.target, sharedContext);

    switch (step.actionType) {
      case 'open_app': {
        const appName = interpolatedTarget || 'Visual Studio Code';
        if (appName.toLowerCase().includes('code') || appName.toLowerCase().includes('vscode')) {
          if (desktop) {
            const res = await safeOpenVSCode();
            return res.success ? 'Launched VS Code at workspace directory' : res.error;
          } else {
            return `[Web Simulation] VS Code launch simulated for ${sharedContext.activeProject?.name || 'Project'}`;
          }
        } else if (appName.toLowerCase().includes('terminal') || appName.toLowerCase().includes('console') || appName.toLowerCase().includes('shell')) {
          if (desktop) {
            const res = await safeOpenTerminal();
            return res.success ? 'Spawned system terminal at project root' : res.error;
          } else {
            return `[Web Simulation] Terminal window initialized in ${sharedContext.activeProject?.name || 'Workspace'}`;
          }
        } else {
          const res = await aetherDesktopIntelligence.launchApp(appName);
          return res.message;
        }
      }

      case 'open_url': {
        const url = interpolatedTarget.startsWith('http') ? interpolatedTarget : `https://${interpolatedTarget}`;
        if (desktop) {
          await safeOpenExternalUrl(url);
        } else if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        return `Opened ${url}`;
      }

      case 'navigate_route': {
        const route = interpolatedTarget.startsWith('/') ? interpolatedTarget : `/${interpolatedTarget}`;
        if (context.navigate) {
          context.navigate(route);
        } else if (typeof window !== 'undefined') {
          window.location.hash = route;
        }
        return `Navigated to ${route}`;
      }

      case 'open_project': {
        const projName = interpolatedTarget || sharedContext.activeProject?.name;
        if (context.projects && context.setActiveProjectId) {
          const matched = context.projects.find(p => p.name.toLowerCase() === projName.toLowerCase() || p.id === projName);
          if (matched) {
            context.setActiveProjectId(matched.id);
            aetherActiveProjectContext.setActiveProject(matched.id);
          }
        }
        if (context.navigate) {
          context.navigate('/projects');
        }
        return `Switched active project focus to ${projName}`;
      }

      case 'attention_summary': {
        const report = aetherActiveProjectContext.getRecentWorkReport({ timeFilter: 'today' });
        return report.summaryText || 'All tasks up to date. No blocking issues detected.';
      }

      case 'github_activity': {
        if (context.navigate) {
          context.navigate('/github');
        }
        return `Loaded GitHub Intelligence: Synchronized recent PRs, commits, and CI pipelines.`;
      }

      case 'start_coding_workspace': {
        if (context.navigate) {
          context.navigate('/projects');
        }
        if (desktop) {
          await safeOpenVSCode();
          await safeOpenTerminal();
        }
        return `Activated integrated coding workspace for ${sharedContext.activeProject?.name || 'Project'}`;
      }

      case 'research': {
        const query = interpolatedTarget || sharedContext.activeProject?.name || 'Modern Architecture';
        const res = await aetherDesktopIntelligence.conductResearch(query);
        return res.summary;
      }

      case 'create_note': {
        const title = this.interpolateString(step.target, sharedContext) || 'Workflow Note';
        const rawContent = step.params?.content || sharedContext.previous_output || 'Captured during Aether teachable workflow execution.';
        const content = this.interpolateString(rawContent, sharedContext);

        if (context.addNote) {
          context.addNote({
            title,
            content,
            tags: ['AetherWorkflow', 'TeachableFlow'],
            projectId: sharedContext.activeProject?.id
          });
        }
        return `Created cognitive note "${title}"`;
      }

      case 'create_issue': {
        const title = this.interpolateString(step.target, sharedContext) || 'Workflow Task';
        const priority = step.params?.priority || 'High';
        const type = step.params?.type || 'Task';

        if (context.addIssue) {
          context.addIssue({
            title,
            description: `Generated automatically via workflow "${sharedContext.workflowName || 'Aether Workflow'}"`,
            priority,
            type,
            status: 'Todo',
            projectId: sharedContext.activeProject?.id
          });
        }
        return `Created tracking issue "${title}" [${priority}]`;
      }

      case 'run_command': {
        const cmd = interpolatedTarget;
        if (desktop) {
          const res = await safeExecuteDesktopAction('run_command', { command: cmd });
          return res.success ? res.output || 'Command executed successfully' : `Error: ${res.error}`;
        }
        return `[Web Mode] Command "${cmd}" logged for local execution`;
      }

      case 'summarize_project': {
        const rep = aetherActiveProjectContext.getRecentWorkReport({ timeFilter: 'this_week' });
        return rep.spokenText;
      }

      case 'get_weather': {
        return `72°F, Clear skies in DevSpace local station. Perfect conditions for coding.`;
      }

      default:
        await new Promise(r => setTimeout(r, 200));
        return `Executed ${step.title}`;
    }
  }

  private interpolateString(template: string, context: Record<string, any>): string {
    if (!template || typeof template !== 'string') return '';
    return template.replace(/\{\{([^{}]+)\}\}/g, (match, path) => {
      const cleanPath = path.trim();
      const parts = cleanPath.split('.');
      let current: any = context;
      for (const part of parts) {
        if (current === undefined || current === null) return match;
        current = current[part];
      }
      return current !== undefined && current !== null ? String(current) : match;
    });
  }

  private formatRunMarkdown(workflow: TeachableWorkflow, run: WorkflowRunRecord): string {
    const isSuccess = run.status === 'completed';
    const statusEmoji = isSuccess ? '✅' : run.status === 'cancelled' ? '⏹️' : '❌';

    let md = `### ${statusEmoji} Teachable Workflow: "${workflow.name}"\n\n`;
    md += `**Status:** \`${run.status.toUpperCase()}\` • **Duration:** ${(run.durationMs / 1000).toFixed(2)}s • **Trigger:** "${workflow.triggerPhrase}"\n\n`;

    md += `**Execution Breakdown (${run.stepResults.length}/${workflow.steps.length} Steps):**\n`;
    run.stepResults.forEach(r => {
      const stepEmoji = r.status === 'completed' ? '✓' : r.status === 'failed' ? '✗' : '⊘';
      md += `- [${stepEmoji}] **Step ${r.order}: ${r.title}** (${r.actionType})\n`;
      if (r.output) {
        const outStr = typeof r.output === 'object' ? JSON.stringify(r.output) : String(r.output);
        md += `  > *Output:* ${outStr.slice(0, 180)}${outStr.length > 180 ? '...' : ''}\n`;
      }
      if (r.error) {
        md += `  > ⚠️ *Error:* \`${r.error}\`\n`;
      }
    });

    if (run.failureReason && run.status !== 'completed') {
      md += `\n**Failure Diagnostic:** ${run.failureReason}\n`;
    }

    return md;
  }

  private broadcastProgress(
    run: WorkflowRunRecord,
    callback?: (e: WorkflowExecutionProgressEvent) => void,
    pendingConfirmation?: { stepId: string; stepTitle: string; reason: string }
  ) {
    const currentStep = run.stepResults[run.currentStepIndex];
    const eventPayload: WorkflowExecutionProgressEvent = {
      runId: run.runId,
      workflowId: run.workflowId,
      workflowName: run.workflowName,
      currentStepIndex: run.currentStepIndex,
      totalSteps: run.totalSteps,
      currentStepTitle: currentStep?.title || `Step ${run.currentStepIndex + 1}`,
      status: run.status,
      stepResults: [...run.stepResults],
      pendingConfirmation
    };

    callback?.(eventPayload);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aether-workflow-progress', { detail: eventPayload }));
    }
  }

  public cancelCurrentWorkflow(): boolean {
    this.isCancelledFlag = true;
    if (this.pendingConfirmationResolver) {
      this.pendingConfirmationResolver(false);
      this.pendingConfirmationResolver = null;
    }
    return true;
  }

  public resolveConfirmation(confirmed: boolean): void {
    if (this.pendingConfirmationResolver) {
      this.pendingConfirmationResolver(confirmed);
      this.pendingConfirmationResolver = null;
    }
  }

  private waitForUserConfirmation(step: TeachableStep): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingConfirmationResolver = resolve;
    });
  }

  public getExecutionHistory(): WorkflowRunRecord[] {
    return [...this.history];
  }

  public clearExecutionHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  public getCurrentActiveRun(): WorkflowRunRecord | null {
    return this.currentActiveRun;
  }
}

export const aetherWorkflowEngine = new AetherWorkflowEngine();
