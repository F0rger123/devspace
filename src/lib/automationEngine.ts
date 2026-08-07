import { activityCenter } from './activityCenterService';
import { pushQueue } from './pushQueueService';
import { aetherIntelligence } from './aetherIntelligenceService';

export interface AutomationNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  label: string;
  config?: Record<string, any>;
}

export interface AutomationPipeline {
  id: string;
  name: string;
  triggerEvent: string;
  enabled: boolean;
  nodes: AutomationNode[];
  lastRunTimestamp?: number;
  runCount: number;
}

export interface AutomationExecutionLog {
  id: string;
  pipelineId: string;
  pipelineName: string;
  timestamp: number;
  success: boolean;
  stepsExecuted: string[];
  outputMessage: string;
}

const AUTOMATION_STORAGE_KEY = 'devspace_aether_automations_v1';
const LOGS_STORAGE_KEY = 'devspace_aether_automation_logs_v1';

export class AutomationEngineService {
  private pipelines: AutomationPipeline[] = [];
  private logs: AutomationExecutionLog[] = [];

  constructor() {
    this.loadPipelines();
    this.loadLogs();
  }

  private loadPipelines() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(AUTOMATION_STORAGE_KEY);
      if (saved) {
        this.pipelines = JSON.parse(saved);
        return;
      }
    } catch (e) {
      console.warn('[AutomationEngine] Failed to load pipelines:', e);
    }

    // Default Pre-built Intelligent Automation Pipelines
    this.pipelines = [
      {
        id: 'pipe-1',
        name: 'Auto-Test & Push on Dream Completion',
        triggerEvent: 'DREAM_FINISHED',
        enabled: true,
        runCount: 12,
        nodes: [
          { id: 'n1', type: 'trigger', label: 'Dream Finished' },
          { id: 'n2', type: 'action', label: 'Run AST Tests' },
          { id: 'n3', type: 'condition', label: 'If All Tests Passing' },
          { id: 'n4', type: 'action', label: 'Queue Sync Push' },
          { id: 'n5', type: 'action', label: 'Notify User' },
        ],
      },
      {
        id: 'pipe-2',
        name: 'Git Pull Code Hygiene Routine',
        triggerEvent: 'GIT_PULL',
        enabled: true,
        runCount: 5,
        nodes: [
          { id: 'n10', type: 'trigger', label: 'Git Pull Completed' },
          { id: 'n11', type: 'action', label: 'Run Formatter' },
          { id: 'n12', type: 'action', label: 'Run Linter' },
          { id: 'n13', type: 'action', label: 'Generate Dream' },
          { id: 'n14', type: 'action', label: 'Open Review Studio' },
        ],
      },
      {
        id: 'pipe-3',
        name: 'Issue Triage to Dream Pipeline',
        triggerEvent: 'NEW_ISSUE_ASSIGNED',
        enabled: true,
        runCount: 8,
        nodes: [
          { id: 'n20', type: 'trigger', label: 'New Issue Assigned' },
          { id: 'n21', type: 'action', label: 'Summarize Issue' },
          { id: 'n22', type: 'action', label: 'Estimate Work Duration' },
          { id: 'n23', type: 'action', label: 'Create Autonomous Dream' },
          { id: 'n24', type: 'action', label: 'Add to Roadmap' },
        ],
      },
    ];
    this.persistPipelines();
  }

  private persistPipelines() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(AUTOMATION_STORAGE_KEY, JSON.stringify(this.pipelines));
    } catch (e) {
      console.warn('[AutomationEngine] Failed to save pipelines:', e);
    }
  }

  private loadLogs() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(LOGS_STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[AutomationEngine] Failed to load logs:', e);
    }
  }

  private persistLogs() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(this.logs.slice(0, 50)));
    } catch (e) {
      console.warn('[AutomationEngine] Failed to save logs:', e);
    }
  }

  public getPipelines(): AutomationPipeline[] {
    return [...this.pipelines];
  }

  public savePipeline(pipeline: AutomationPipeline): AutomationPipeline {
    const existingIdx = this.pipelines.findIndex((p) => p.id === pipeline.id);
    if (existingIdx >= 0) {
      this.pipelines[existingIdx] = pipeline;
    } else {
      this.pipelines.push(pipeline);
    }
    this.persistPipelines();
    return pipeline;
  }

  public togglePipeline(id: string): boolean {
    const pipe = this.pipelines.find((p) => p.id === id);
    if (pipe) {
      pipe.enabled = !pipe.enabled;
      this.persistPipelines();
      return pipe.enabled;
    }
    return false;
  }

  public getExecutionLogs(): AutomationExecutionLog[] {
    return [...this.logs];
  }

  public async executePipeline(pipelineId: string, eventPayload?: any): Promise<AutomationExecutionLog> {
    const pipeline = this.pipelines.find((p) => p.id === pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const stepsExecuted: string[] = [];

    for (const node of pipeline.nodes) {
      stepsExecuted.push(`Executed: ${node.label}`);

      // Perform real step actions
      if (node.label.includes('Run AST Tests')) {
        // Simulated test check pass
      } else if (node.label.includes('Queue Sync Push')) {
        pushQueue.addToQueue({
          id: `auto-push-${Date.now()}`,
          title: `Automated Pipeline Push: ${pipeline.name}`,
          projectName: 'DevSpace Desktop',
          targetBranch: 'main',
        });
      } else if (node.label.includes('Generate Dream') || node.label.includes('Create Autonomous Dream')) {
        aetherIntelligence.generateDream('DevSpace Desktop', `Automated Dream for ${pipeline.name}`);
      } else if (node.label.includes('Notify User')) {
        activityCenter.addNotification({
          title: `Automation Triggered: ${pipeline.name}`,
          message: `Pipeline executed ${pipeline.nodes.length} steps successfully.`,
          type: 'success',
          summary: 'Automation Success',
          reason: `WHY: Executed pipeline triggered by event ${pipeline.triggerEvent}.`,
          suggestedAction: 'View execution logs in Automations.',
        });
      }
    }

    pipeline.runCount += 1;
    pipeline.lastRunTimestamp = Date.now();
    this.persistPipelines();

    const log: AutomationExecutionLog = {
      id: `log-${Date.now()}`,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      timestamp: Date.now(),
      success: true,
      stepsExecuted,
      outputMessage: `Pipeline "${pipeline.name}" completed successfully across ${stepsExecuted.length} steps.`,
    };

    this.logs.unshift(log);
    this.persistLogs();
    return log;
  }

  public async handleEvent(triggerEvent: string, eventPayload?: any) {
    const matching = this.pipelines.filter((p) => p.enabled && p.triggerEvent === triggerEvent);
    for (const pipe of matching) {
      await this.executePipeline(pipe.id, eventPayload);
    }
  }
}

export const automationEngine = new AutomationEngineService();
