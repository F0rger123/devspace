// Aether Personal Planning & Autonomy Controls Engine
// Authoritative cross-domain autonomy management, per-domain permissions,
// risk-gated execution, recurring approval memory, per-action exceptions,
// transparent "Why Aether Acted" explanations, and unified Undo support.

import { undoRedoManager } from './aetherActionEngine';
import { activityCenter } from './activityCenterService';

export type AutonomyLevel =
  | 'suggest_only'       // 1. Suggest Only: Recommends actions, never executes automatically
  | 'ask_before_acting'  // 2. Ask Before Acting: Prepares actions and asks for confirmation
  | 'trusted_actions'    // 3. Trusted Actions: Automatically performs approved low-risk actions
  | 'high_autonomy';     // 4. High Autonomy: Executes approved workflows & medium actions, but STILL asks for risky/destructive actions

export type AutonomyDomain =
  | 'devspace'      // DevSpace / project work (workspace snapshots, project views, notes)
  | 'github'        // GitHub (workflow investigation, PR reviews, branch checks)
  | 'calendar'      // Calendar (syncing meetings, agenda adjustments)
  | 'travel'        // Travel (traffic updates, leave-by timers, trip packing checks)
  | 'wellness'      // Wellness (stretch reminders, sleep workload adaptations)
  | 'notifications' // Notifications (sound, alerts, badges)
  | 'workflows'     // Workflows (teachable automations, background pipelines)
  | 'desktop';      // Desktop actions (window management, app launching, file opens)

export type ActionRiskLevel = 'low' | 'medium' | 'high' | 'destructive' | 'financial' | 'security';

export type ActionExecutionMode =
  | 'auto_executed'        // Automatically performed by Aether
  | 'confirmed_by_user'    // User manually clicked Approve / confirmed in chat
  | 'suggested_only'       // Displayed as a suggestion / recommendation
  | 'blocked_as_risky'     // Prevented from auto-execution because of risk policy
  | 'undone';              // Reverted via Undo

export interface AutonomyRule {
  id: string;
  name: string;
  domain: AutonomyDomain;
  actionPattern: string; // Regex or substring
  decision: 'always_allow' | 'always_ask' | 'always_block';
  reason: string;
  createdAt: number;
  approvedByUser: boolean;
  timesInvoked: number;
}

export interface RecurringApprovalMemory {
  id: string;
  title: string;
  description: string;
  domain: AutonomyDomain;
  actionType: string;
  triggerEvent: string;
  enabled: boolean;
  learnedAt: number;
  lastExecutedAt?: number;
  executionCount: number;
  reasonTemplate: string;
}

export interface AutonomyActionRecord {
  id: string;
  actionId: string;
  title: string;
  domain: AutonomyDomain;
  riskLevel: ActionRiskLevel;
  executionMode: ActionExecutionMode;
  whyReason: string;
  timestamp: number;
  canUndo: boolean;
  undoDescription?: string;
  status: 'completed' | 'pending_confirmation' | 'cancelled' | 'undone' | 'failed';
  metadata?: Record<string, any>;
  undoPayload?: any;
}

export interface AutonomyConfig {
  globalLevel: AutonomyLevel;
  domainLevels: Record<AutonomyDomain, AutonomyLevel>;
  enableDynamicIslandPrompts: boolean;
  enableSoundOnAutoAction: boolean;
  requireBiometricForDestructive: boolean;
  maxDailyAutoActions: number;
}

const STORAGE_KEY_AUTONOMY_CONFIG = 'aether_autonomy_config_v2';
const STORAGE_KEY_ACTION_HISTORY = 'aether_autonomy_action_history_v2';
const STORAGE_KEY_RULES = 'aether_autonomy_rules_v2';
const STORAGE_KEY_RECURRING_MEMORY = 'aether_autonomy_recurring_memory_v2';

export const DEFAULT_AUTONOMY_CONFIG: AutonomyConfig = {
  globalLevel: 'trusted_actions',
  domainLevels: {
    devspace: 'trusted_actions',
    github: 'trusted_actions',
    calendar: 'trusted_actions',
    travel: 'trusted_actions',
    wellness: 'trusted_actions',
    notifications: 'trusted_actions',
    workflows: 'ask_before_acting',
    desktop: 'ask_before_acting'
  },
  enableDynamicIslandPrompts: true,
  enableSoundOnAutoAction: true,
  requireBiometricForDestructive: false,
  maxDailyAutoActions: 100
};

export const DOMAIN_METADATA: Record<AutonomyDomain, { label: string; icon: string; description: string }> = {
  devspace: {
    label: 'DevSpace / Project Work',
    icon: 'FolderGit2',
    description: 'Workspace state preservation, note creation, project context switching, and issue tracking.'
  },
  github: {
    label: 'GitHub & CI/CD',
    icon: 'Github',
    description: 'Diagnosing failed workflows, checking pull requests, and inspecting repositories.'
  },
  calendar: {
    label: 'Calendar & Schedule',
    icon: 'Calendar',
    description: 'Syncing upcoming events, agenda coordination, and meeting location checks.'
  },
  travel: {
    label: 'Travel & Departure',
    icon: 'Car',
    description: 'Live traffic recalculations, leave-by timers, and trip packing preparation.'
  },
  wellness: {
    label: 'Wellness & Health',
    icon: 'Heart',
    description: 'Sleep-adjusted workload recommendations, stretch breaks, and recovery advice.'
  },
  notifications: {
    label: 'Notifications & Alerts',
    icon: 'Bell',
    description: 'Desktop alerts, Dynamic Island badges, and proactive briefing delivery.'
  },
  workflows: {
    label: 'Teachable Workflows',
    icon: 'Workflow',
    description: 'Automated multi-step sequences, background actions, and macro pipelines.'
  },
  desktop: {
    label: 'Desktop & OS Actions',
    icon: 'Laptop',
    description: 'Opening native applications, launching external URLs, and window layout.'
  }
};

export const AUTONOMY_LEVEL_DETAILS: Record<AutonomyLevel, { label: string; number: number; shortDesc: string; longDesc: string; badgeColor: string }> = {
  suggest_only: {
    label: 'Suggest Only',
    number: 1,
    shortDesc: 'Recommendations only',
    longDesc: 'Aether recommends actions and insights but never executes them automatically. Every action requires your manual click.',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700'
  },
  ask_before_acting: {
    label: 'Ask Before Acting',
    number: 2,
    shortDesc: 'Prepares & asks confirmation',
    longDesc: 'Aether prepares actions with complete context and asks for your confirmation before executing anything.',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  },
  trusted_actions: {
    label: 'Trusted Actions',
    number: 3,
    shortDesc: 'Auto low-risk actions',
    longDesc: 'Aether automatically performs approved low-risk actions (like saving workspace before leaving, adjusting departure timers, or fetching workflow logs). Medium and high risk actions still ask for approval.',
    badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
  },
  high_autonomy: {
    label: 'High Autonomy',
    number: 4,
    shortDesc: 'Autonomous workflows & actions',
    longDesc: 'Aether may execute approved workflows and medium actions automatically. However, Aether ALWAYS asks before destructive, financial, security-sensitive, or irreversible actions.',
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  }
};

class AetherAutonomyEngine {
  private config: AutonomyConfig = DEFAULT_AUTONOMY_CONFIG;
  private actionHistory: AutonomyActionRecord[] = [];
  private rules: AutonomyRule[] = [];
  private recurringMemory: RecurringApprovalMemory[] = [];
  private listeners: Set<() => void> = new Set();
  private pendingApprovals: Map<string, {
    action: {
      actionId: string;
      title: string;
      domain: AutonomyDomain;
      riskLevel: ActionRiskLevel;
      whyReason: string;
      execute: () => Promise<any>;
      undo?: () => Promise<any>;
    };
    resolve: (approved: boolean) => void;
  }> = new Map();

  constructor() {
    this.loadState();
    this.seedDefaultRecurringMemories();
  }

  private loadState() {
    if (typeof localStorage === 'undefined') return;
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY_AUTONOMY_CONFIG);
      if (savedConfig) {
        this.config = { ...DEFAULT_AUTONOMY_CONFIG, ...JSON.parse(savedConfig) };
      }
      const savedHistory = localStorage.getItem(STORAGE_KEY_ACTION_HISTORY);
      if (savedHistory) {
        this.actionHistory = JSON.parse(savedHistory);
      }
      const savedRules = localStorage.getItem(STORAGE_KEY_RULES);
      if (savedRules) {
        this.rules = JSON.parse(savedRules);
      }
      const savedRecurring = localStorage.getItem(STORAGE_KEY_RECURRING_MEMORY);
      if (savedRecurring) {
        this.recurringMemory = JSON.parse(savedRecurring);
      }
    } catch (e) {
      console.warn('Failed to load Aether Autonomy state:', e);
    }
  }

  private saveState() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_AUTONOMY_CONFIG, JSON.stringify(this.config));
      localStorage.setItem(STORAGE_KEY_ACTION_HISTORY, JSON.stringify(this.actionHistory.slice(0, 200)));
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(this.rules));
      localStorage.setItem(STORAGE_KEY_RECURRING_MEMORY, JSON.stringify(this.recurringMemory));
    } catch (e) {
      console.error('Failed to save Aether Autonomy state:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('Autonomy listener error:', err);
      }
    });
    window.dispatchEvent(new CustomEvent('aether-autonomy-updated'));
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private seedDefaultRecurringMemories() {
    if (this.recurringMemory.length === 0) {
      this.recurringMemory = [
        {
          id: 'rec-workspace-leave',
          title: 'Auto-save Workspace on Departure',
          description: 'Automatically creates a DevSpace workspace leave snapshot before leaving for scheduled calendar events.',
          domain: 'travel',
          actionType: 'save_workspace_snapshot',
          triggerEvent: 'departure_timer_10m',
          enabled: true,
          learnedAt: Date.now() - 86400000 * 3,
          executionCount: 4,
          reasonTemplate: 'WHY: You are scheduled to depart in 10m for an in-person meeting. Auto-saved workspace snapshot so you can resume later without state loss.'
        },
        {
          id: 'rec-github-diagnose',
          title: 'Auto-Investigate Failed GitHub Workflows',
          description: 'Fetches recent workflow run logs and error stack traces when CI/CD fails.',
          domain: 'github',
          actionType: 'investigate_failed_ci',
          triggerEvent: 'github_workflow_failure',
          enabled: true,
          learnedAt: Date.now() - 86400000 * 2,
          executionCount: 2,
          reasonTemplate: 'WHY: GitHub Actions workflow failed on branch main. Automatically retrieved error diagnosis and failed step logs.'
        },
        {
          id: 'rec-leave-traffic-adjust',
          title: 'Auto-Adjust Leave Time on Traffic Shifts',
          description: 'Updates recommended departure time if live traffic worsens or improves for upcoming appointments.',
          domain: 'travel',
          actionType: 'update_leave_by_timer',
          triggerEvent: 'traffic_delay_detected',
          enabled: true,
          learnedAt: Date.now() - 86400000 * 5,
          executionCount: 6,
          reasonTemplate: 'WHY: Real-time traffic on your route increased transit time by 8 minutes. Shifted departure alarm forward to ensure on-time arrival.'
        },
        {
          id: 'rec-wellness-pacing',
          title: 'Auto-Adjust Workload on Poor Sleep',
          description: 'Suggests a lighter focus workload and prioritizes easy tasks when sleep recovery is low.',
          domain: 'wellness',
          actionType: 'adjust_workload_focus',
          triggerEvent: 'sleep_score_below_65',
          enabled: true,
          learnedAt: Date.now() - 86400000 * 1,
          executionCount: 1,
          reasonTemplate: 'WHY: Sleep duration was under 5.5 hours last night with low REM recovery. Prioritized high-impact, lower-cognitive-load tasks.'
        }
      ];
      this.saveState();
    }
  }

  // --- CONFIGURATION GETTERS & SETTERS ---

  public getConfig(): AutonomyConfig {
    return { ...this.config };
  }

  public getGlobalLevel(): AutonomyLevel {
    return this.config.globalLevel;
  }

  public setGlobalLevel(level: AutonomyLevel) {
    this.config.globalLevel = level;
    // Also synchronize domain levels if user chooses
    this.saveState();
  }

  public getDomainLevel(domain: AutonomyDomain): AutonomyLevel {
    return this.config.domainLevels[domain] || this.config.globalLevel;
  }

  public setDomainLevel(domain: AutonomyDomain, level: AutonomyLevel) {
    this.config.domainLevels[domain] = level;
    this.saveState();
  }

  public setAllDomainsLevel(level: AutonomyLevel) {
    this.config.globalLevel = level;
    (Object.keys(this.config.domainLevels) as AutonomyDomain[]).forEach((d) => {
      this.config.domainLevels[d] = level;
    });
    this.saveState();
  }

  // --- GATEKEEPER EVALUATION ---

  /**
   * Evaluates whether an action can be automatically executed, needs confirmation, or is suggested only.
   */
  public evaluateAction(params: {
    actionId: string;
    title: string;
    domain: AutonomyDomain;
    riskLevel: ActionRiskLevel;
    whyReason: string;
  }): {
    decision: 'auto_execute' | 'require_confirmation' | 'suggest_only' | 'block';
    effectiveLevel: AutonomyLevel;
    explanation: string;
  } {
    const { actionId, title, domain, riskLevel, whyReason } = params;
    const effectiveLevel = this.getDomainLevel(domain);

    // 1. Check strict Per-Action Exception Rules
    const matchingRule = this.rules.find((r) => {
      if (r.domain !== domain) return false;
      try {
        const reg = new RegExp(r.actionPattern, 'i');
        return reg.test(actionId) || reg.test(title);
      } catch {
        return title.toLowerCase().includes(r.actionPattern.toLowerCase());
      }
    });

    if (matchingRule) {
      matchingRule.timesInvoked++;
      this.saveState();
      if (matchingRule.decision === 'always_block') {
        return {
          decision: 'block',
          effectiveLevel,
          explanation: `Blocked by custom rule: "${matchingRule.name}" (${matchingRule.reason})`
        };
      }
      if (matchingRule.decision === 'always_ask') {
        return {
          decision: 'require_confirmation',
          effectiveLevel,
          explanation: `Requires confirmation per custom exception rule: "${matchingRule.name}"`
        };
      }
      // If always_allow, ensure it is NOT a destructive action (Destructive is NEVER silently allowed)
      if (riskLevel !== 'destructive' && riskLevel !== 'financial' && riskLevel !== 'security') {
        return {
          decision: 'auto_execute',
          effectiveLevel,
          explanation: `Auto-allowed by custom exception rule: "${matchingRule.name}"`
        };
      }
    }

    // 2. HARD SAFETY GATE: Destructive, Financial, Security-sensitive actions CANNOT be silently executed
    if (riskLevel === 'destructive' || riskLevel === 'financial' || riskLevel === 'security') {
      return {
        decision: 'require_confirmation',
        effectiveLevel,
        explanation: `SAFETY GATE: This action has ${riskLevel.toUpperCase()} risk. Aether will never execute destructive or sensitive actions without explicit confirmation.`
      };
    }

    // 3. Check Recurring Approval Memory
    const matchingRecurring = this.recurringMemory.find((rec) => {
      return rec.enabled && (rec.domain === domain) && (rec.actionType === actionId || actionId.includes(rec.actionType));
    });

    if (matchingRecurring && (effectiveLevel === 'trusted_actions' || effectiveLevel === 'high_autonomy')) {
      if (riskLevel === 'low' || (riskLevel === 'medium' && effectiveLevel === 'high_autonomy')) {
        return {
          decision: 'auto_execute',
          effectiveLevel,
          explanation: `Approved recurring behavior: "${matchingRecurring.title}". ${whyReason}`
        };
      }
    }

    // 4. Level-based evaluation
    switch (effectiveLevel) {
      case 'suggest_only':
        return {
          decision: 'suggest_only',
          effectiveLevel,
          explanation: `Domain "${DOMAIN_METADATA[domain]?.label || domain}" is configured as "Suggest Only". Aether will suggest this action for your manual execution.`
        };

      case 'ask_before_acting':
        return {
          decision: 'require_confirmation',
          effectiveLevel,
          explanation: `Domain "${DOMAIN_METADATA[domain]?.label || domain}" requires confirmation before acting. ${whyReason}`
        };

      case 'trusted_actions':
        if (riskLevel === 'low') {
          return {
            decision: 'auto_execute',
            effectiveLevel,
            explanation: `Trusted low-risk action in ${DOMAIN_METADATA[domain]?.label || domain}. ${whyReason}`
          };
        } else {
          return {
            decision: 'require_confirmation',
            effectiveLevel,
            explanation: `Action is medium/high risk (${riskLevel}). In "Trusted Actions" mode, confirmation is required. ${whyReason}`
          };
        }

      case 'high_autonomy':
        if (riskLevel === 'low' || riskLevel === 'medium') {
          return {
            decision: 'auto_execute',
            effectiveLevel,
            explanation: `High Autonomy enabled for ${DOMAIN_METADATA[domain]?.label || domain}. ${whyReason}`
          };
        } else {
          return {
            decision: 'require_confirmation',
            effectiveLevel,
            explanation: `High risk action requires confirmation even in High Autonomy mode. ${whyReason}`
          };
        }
    }
  }

  /**
   * Executes an action through the autonomy gatekeeper.
   */
  public async executeGatedAction<T = any>(params: {
    actionId: string;
    title: string;
    domain: AutonomyDomain;
    riskLevel: ActionRiskLevel;
    whyReason: string;
    execute: () => Promise<T>;
    undo?: () => Promise<void>;
    undoDescription?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    executed: boolean;
    mode: ActionExecutionMode;
    result?: T;
    historyRecord: AutonomyActionRecord;
    message: string;
  }> {
    const { actionId, title, domain, riskLevel, whyReason, execute, undo, undoDescription, metadata } = params;
    const evaluation = this.evaluateAction({ actionId, title, domain, riskLevel, whyReason });

    const historyId = `act-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    if (evaluation.decision === 'auto_execute') {
      try {
        const result = await execute();

        if (undo) {
          undoRedoManager.pushAction(
            undoDescription || `Auto-action: ${title}`,
            async () => {
              await undo();
              this.markActionUndone(historyId);
            }
          );
        }

        const historyRecord: AutonomyActionRecord = {
          id: historyId,
          actionId,
          title,
          domain,
          riskLevel,
          executionMode: 'auto_executed',
          whyReason: evaluation.explanation,
          timestamp: Date.now(),
          canUndo: !!undo,
          undoDescription: undoDescription || `Undo ${title}`,
          status: 'completed',
          metadata
        };

        this.actionHistory.unshift(historyRecord);
        this.saveState();

        // Broadcast to Activity Center / Dynamic Island
        activityCenter.addNotification({
          title: `⚡ Aether Auto-Action: ${title}`,
          message: evaluation.explanation,
          type: 'info',
          summary: title,
          reason: evaluation.explanation
        });

        window.dispatchEvent(
          new CustomEvent('aether-action-auto-executed', {
            detail: { historyRecord, result }
          })
        );

        return {
          executed: true,
          mode: 'auto_executed',
          result,
          historyRecord,
          message: `Auto-executed: ${title}`
        };
      } catch (err: any) {
        const failedRecord: AutonomyActionRecord = {
          id: historyId,
          actionId,
          title,
          domain,
          riskLevel,
          executionMode: 'auto_executed',
          whyReason: `Failed execution: ${err?.message || 'Unknown error'}. Original trigger: ${evaluation.explanation}`,
          timestamp: Date.now(),
          canUndo: false,
          status: 'failed',
          metadata
        };
        this.actionHistory.unshift(failedRecord);
        this.saveState();
        throw err;
      }
    }

    if (evaluation.decision === 'require_confirmation') {
      const pendingRecord: AutonomyActionRecord = {
        id: historyId,
        actionId,
        title,
        domain,
        riskLevel,
        executionMode: 'confirmed_by_user',
        whyReason: evaluation.explanation,
        timestamp: Date.now(),
        canUndo: !!undo,
        undoDescription: undoDescription || `Undo ${title}`,
        status: 'pending_confirmation',
        metadata
      };

      this.actionHistory.unshift(pendingRecord);
      this.saveState();

      // Broadcast confirmation request to Dynamic Island and Chat
      window.dispatchEvent(
        new CustomEvent('aether-action-confirmation-requested', {
          detail: {
            historyId,
            actionId,
            title,
            domain,
            riskLevel,
            whyReason: evaluation.explanation
          }
        })
      );

      return {
        executed: false,
        mode: 'confirmed_by_user',
        historyRecord: pendingRecord,
        message: `Action prepared and waiting for approval: ${evaluation.explanation}`
      };
    }

    if (evaluation.decision === 'suggest_only') {
      const suggestedRecord: AutonomyActionRecord = {
        id: historyId,
        actionId,
        title,
        domain,
        riskLevel,
        executionMode: 'suggested_only',
        whyReason: evaluation.explanation,
        timestamp: Date.now(),
        canUndo: false,
        status: 'completed',
        metadata
      };
      this.actionHistory.unshift(suggestedRecord);
      this.saveState();

      return {
        executed: false,
        mode: 'suggested_only',
        historyRecord: suggestedRecord,
        message: `Suggested: ${title}`
      };
    }

    // Blocked
    const blockedRecord: AutonomyActionRecord = {
      id: historyId,
      actionId,
      title,
      domain,
      riskLevel,
      executionMode: 'blocked_as_risky',
      whyReason: evaluation.explanation,
      timestamp: Date.now(),
      canUndo: false,
      status: 'cancelled',
      metadata
    };
    this.actionHistory.unshift(blockedRecord);
    this.saveState();

    return {
      executed: false,
      mode: 'blocked_as_risky',
      historyRecord: blockedRecord,
      message: `Blocked: ${evaluation.explanation}`
    };
  }

  // --- ACTION HISTORY & UNDO ---

  public getActionHistory(filter?: {
    domain?: AutonomyDomain;
    executionMode?: ActionExecutionMode;
    limit?: number;
  }): AutonomyActionRecord[] {
    let list = [...this.actionHistory];
    if (filter?.domain) {
      list = list.filter((a) => a.domain === filter.domain);
    }
    if (filter?.executionMode) {
      list = list.filter((a) => a.executionMode === filter.executionMode);
    }
    if (filter?.limit) {
      list = list.slice(0, filter.limit);
    }
    return list;
  }

  public getRecentAutoActions(limit: number = 10): AutonomyActionRecord[] {
    return this.actionHistory
      .filter((a) => a.executionMode === 'auto_executed' && a.status === 'completed')
      .slice(0, limit);
  }

  public getPendingConfirmations(): AutonomyActionRecord[] {
    return this.actionHistory.filter((a) => a.status === 'pending_confirmation');
  }

  public async undoAction(historyId: string): Promise<boolean> {
    const record = this.actionHistory.find((a) => a.id === historyId);
    if (!record || !record.canUndo) return false;

    // Trigger global undo
    const success = await undoRedoManager.undo();
    if (success) {
      record.status = 'undone';
      record.executionMode = 'undone';
      this.saveState();
      activityCenter.addNotification({
        title: `↩️ Undone: ${record.title}`,
        message: `Successfully reverted action taken by Aether.`,
        type: 'info',
        summary: `Undone ${record.title}`,
        reason: 'WHY: User invoked Undo on Aether action.'
      });
      return true;
    }
    return false;
  }

  public markActionUndone(historyId: string) {
    const record = this.actionHistory.find((a) => a.id === historyId);
    if (record) {
      record.status = 'undone';
      record.executionMode = 'undone';
      this.saveState();
    }
  }

  public clearHistory() {
    this.actionHistory = [];
    this.saveState();
  }

  // --- RECURRING APPROVAL MEMORY & RULES ---

  public getRecurringMemories(): RecurringApprovalMemory[] {
    return [...this.recurringMemory];
  }

  public toggleRecurringMemory(id: string, enabled: boolean) {
    const item = this.recurringMemory.find((m) => m.id === id);
    if (item) {
      item.enabled = enabled;
      this.saveState();
    }
  }

  public addRecurringMemory(memory: Omit<RecurringApprovalMemory, 'id' | 'learnedAt' | 'executionCount'>) {
    const newRec: RecurringApprovalMemory = {
      ...memory,
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      learnedAt: Date.now(),
      executionCount: 0
    };
    this.recurringMemory.unshift(newRec);
    this.saveState();
    return newRec;
  }

  public deleteRecurringMemory(id: string) {
    this.recurringMemory = this.recurringMemory.filter((m) => m.id !== id);
    this.saveState();
  }

  public getRules(): AutonomyRule[] {
    return [...this.rules];
  }

  public addRule(rule: Omit<AutonomyRule, 'id' | 'createdAt' | 'timesInvoked'>) {
    const newRule: AutonomyRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: Date.now(),
      timesInvoked: 0
    };
    this.rules.unshift(newRule);
    this.saveState();
    return newRule;
  }

  public deleteRule(id: string) {
    this.rules = this.rules.filter((r) => r.id !== id);
    this.saveState();
  }
}

export const aetherAutonomy = new AetherAutonomyEngine();
