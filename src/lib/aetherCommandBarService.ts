// Universal Aether Command Bar Service
// Unified indexing, fuzzy scoring, desktop/web execution lifecycles, and custom alias management.

import { isElectron, safeExecuteDesktopAction, safeOpenVSCode, safeOpenTerminal, safeOpenExternalUrl, safeSearchDesktopFiles, safeOpenFile } from './electronBridge';
import { aetherActiveProjectContext } from './aetherActiveProjectContext';
import { aetherConversationalEngine } from './aetherConversationalEngine';
import { aetherAliasRegistry, AetherAlias, UserDefinedAction } from './aetherAliasRegistry';
import { automationEngine, AutomationPipeline } from './automationEngine';
import { aetherWorkflowEngine, TeachableWorkflow } from './aetherWorkflowEngine';
import { undoRedoManager } from './aetherActionEngine';
import { activityCenter } from './activityCenterService';
import { aetherVoiceEngine } from './aetherVoiceStateEngine';
import { aetherLongTermMemory } from './aetherLongTermMemoryService';

export type CommandCategory = 
  | 'project' 
  | 'issue' 
  | 'note' 
  | 'file' 
  | 'app' 
  | 'workflow' 
  | 'github' 
  | 'aether' 
  | 'custom'
  | 'navigation'
  | 'action';

export type CapabilityScope = 'web_and_desktop' | 'desktop_only' | 'web_only' | 'aether_ai';

export interface CommandExecutionContext {
  navigate: (path: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error' | 'sync', duration?: number) => void;
  projects: any[];
  activeProjectId?: string;
  setActiveProjectId?: (id: string) => void;
  issues?: any[];
  notes?: any[];
  assets?: any[];
  addIssue?: (issue: any) => any;
  addNote?: (note: any) => any;
  openModal?: (modalName: string) => void;
}

export interface CommandExecutionResult {
  success: boolean;
  message: string;
  category?: CommandCategory;
  detailsMarkdown?: string;
  speechText?: string;
  url?: string;
  data?: any;
  undoable?: boolean;
  undoLabel?: string;
  stepsExecuted?: string[];
}

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: CommandCategory;
  scope: CapabilityScope;
  iconName: string;
  keywords?: string[];
  shortcut?: string;
  badge?: string;
  score?: number;
  metadata?: any;
  action: (context: CommandExecutionContext) => Promise<CommandExecutionResult>;
}

export interface RecentCommandRecord {
  id: string;
  commandId?: string;
  title: string;
  category: CommandCategory;
  timestamp: number;
  success: boolean;
  outputSnippet?: string;
}

const RECENT_COMMANDS_KEY = 'aether_command_bar_recent_v1';

class AetherCommandBarService {
  private recentCommands: RecentCommandRecord[] = [];

  constructor() {
    this.loadRecent();
  }

  private loadRecent() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
      if (stored) {
        this.recentCommands = JSON.parse(stored);
      }
    } catch {}
  }

  public getRecentCommands(): RecentCommandRecord[] {
    return [...this.recentCommands];
  }

  public recordExecution(record: Omit<RecentCommandRecord, 'id' | 'timestamp'>) {
    const newRecord: RecentCommandRecord = {
      ...record,
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
    };

    // Filter duplicates by title
    this.recentCommands = [
      newRecord,
      ...this.recentCommands.filter(r => r.title.toLowerCase() !== record.title.toLowerCase())
    ].slice(0, 15);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(this.recentCommands));
      } catch {}
    }
  }

  public clearRecent() {
    this.recentCommands = [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(RECENT_COMMANDS_KEY);
      } catch {}
    }
  }

  // Generate complete index of executable commands for the current workspace context
  public generateIndex(context: CommandExecutionContext): CommandItem[] {
    const items: CommandItem[] = [];
    const desktop = isElectron();
    const activeProj = context.projects.find(p => p.id === context.activeProjectId) || context.projects[0];
    const activeProjId = activeProj?.id;
    const activeProjName = activeProj?.name || 'DevSpace Workspace';

    // -------------------------------------------------------------
    // 1. AETHER INTELLIGENCE & CONVERSATIONAL ACTIONS
    // -------------------------------------------------------------
    items.push({
      id: 'aether-today-work',
      title: 'Show what I worked on today',
      subtitle: `Generate grounded daily activity report for ${activeProjName}`,
      category: 'aether',
      scope: 'aether_ai',
      iconName: 'Sparkles',
      keywords: ['today', 'worked', 'summary', 'report', 'activity', 'log', 'changes'],
      badge: 'Aether AI',
      action: async (ctx) => {
        const report = aetherActiveProjectContext.getRecentWorkReport({ timeFilter: 'today' });
        return {
          success: true,
          message: report.spokenText,
          speechText: report.spokenText,
          detailsMarkdown: report.summaryText,
          category: 'aether',
          stepsExecuted: ['Analyzed active project context', 'Filtered activities for today', 'Synthesized fact vs inference timeline']
        };
      }
    });

    items.push({
      id: 'aether-yesterday-work',
      title: 'Show what I worked on yesterday',
      subtitle: `Summarize yesterday's commits, notes, and task updates`,
      category: 'aether',
      scope: 'aether_ai',
      iconName: 'Clock',
      keywords: ['yesterday', 'past', 'history', 'worked', 'commits'],
      badge: 'Aether AI',
      action: async (ctx) => {
        const report = aetherActiveProjectContext.getRecentWorkReport({ timeFilter: 'yesterday' });
        return {
          success: true,
          message: report.spokenText,
          speechText: report.spokenText,
          detailsMarkdown: report.summaryText,
          category: 'aether',
          stepsExecuted: ['Queried temporal history', 'Filtered yesterday activities', 'Synthesized report']
        };
      }
    });

    items.push({
      id: 'aether-unfinished-work',
      title: 'What did I leave unfinished?',
      subtitle: 'Audit open in-progress tasks, unmerged branches, and pending items',
      category: 'aether',
      scope: 'aether_ai',
      iconName: 'CheckSquare',
      keywords: ['unfinished', 'pending', 'left', 'todos', 'open', 'tasks', 'blockers'],
      badge: 'Aether AI',
      action: async (ctx) => {
        const unfinished = aetherActiveProjectContext.getUnfinishedWork();
        return {
          success: true,
          message: unfinished.spokenText,
          speechText: unfinished.spokenText,
          detailsMarkdown: unfinished.markdownText,
          category: 'aether',
          stepsExecuted: ['Scanned active project tasks', 'Audited issue status', 'Compiled unfinished checklist']
        };
      }
    });

    items.push({
      id: 'aether-attention-query',
      title: 'What needs my attention?',
      subtitle: 'Identify high-priority issues, active PR reviews, and urgent milestones',
      category: 'aether',
      scope: 'aether_ai',
      iconName: 'AlertCircle',
      keywords: ['attention', 'urgent', 'priority', 'blockers', 'review', 'prs', 'alerts'],
      badge: 'Aether AI',
      action: async (ctx) => {
        const state = aetherActiveProjectContext.getState();
        const highPriority = (state.openIssues || []).filter(i => i.priority === 'High' || i.priority === 'Critical');
        const openPrs = state.openPullRequests || [];
        const msg = `You have ${highPriority.length} high priority issue(s) and ${openPrs.length} open pull request(s) requiring review.`;
        const md = `### Items Requiring Immediate Attention\n\n**High Priority Issues:**\n${highPriority.map(h => `- ⚠️ **${h.title}** (${h.status})`).join('\n') || 'None'}\n\n**Open Pull Requests:**\n${openPrs.map(p => `- 🔀 **#${p.number}: ${p.title}** (${p.state})`).join('\n') || 'None'}`;
        return {
          success: true,
          message: msg,
          speechText: msg,
          detailsMarkdown: md,
          category: 'aether',
          stepsExecuted: ['Audited high priority issues', 'Evaluated PR blockers', 'Compiled attention list']
        };
      }
    });

    items.push({
      id: 'aether-top-project-week',
      title: 'What project have I spent the most time on this week?',
      subtitle: 'Analyze 7-day activity telemetry across all projects',
      category: 'aether',
      scope: 'aether_ai',
      iconName: 'BarChart2',
      keywords: ['top project', 'most time', 'week', 'analytics', 'hours', 'focus'],
      badge: 'Aether AI',
      action: async (ctx) => {
        const report = aetherActiveProjectContext.getRecentWorkReport({ timeFilter: 'this_week', allProjects: ctx.projects });
        const topProject = report.primaryProjects[0] || 'DevSpace Workspace';
        const msg = `You have spent the most time on ${topProject} this week.`;
        return {
          success: true,
          message: msg,
          speechText: msg,
          detailsMarkdown: report.summaryText,
          category: 'aether',
          stepsExecuted: ['Aggregated past 7 days activity across all projects', `Identified top project: ${topProject}`, 'Generated grounded intelligence report']
        };
      }
    });

    items.push({
      id: 'aether-open-daily-brief',
      title: 'Open Daily Aether Brief',
      subtitle: 'Launch interactive daily operating brief with goals & blockers',
      category: 'aether',
      scope: 'web_and_desktop',
      iconName: 'Compass',
      keywords: ['brief', 'daily', 'standup', 'operating', 'hub', 'morning'],
      action: async (ctx) => {
        window.dispatchEvent(new Event('devspace-open-daily-brief'));
        return {
          success: true,
          message: 'Opened Daily Aether Brief modal.',
          stepsExecuted: ['Dispatched daily brief event']
        };
      }
    });

    items.push({
      id: 'aether-open-landscape',
      title: 'Open Local Landscape',
      subtitle: 'Launch full project intelligence landscape and analytics hub',
      category: 'navigation',
      scope: 'web_and_desktop',
      iconName: 'Layers',
      keywords: ['landscape', 'local landscape', 'hub', 'intelligence', 'aether report'],
      action: async (ctx) => {
        ctx.navigate('/aether-report');
        return {
          success: true,
          message: 'Navigated to Local Landscape & Intelligence Report.',
          stepsExecuted: ['Routed to /aether-report']
        };
      }
    });

    // Aether Long-Term Memory Hub
    items.push({
      id: 'aether-open-memory',
      title: 'Open Aether Long-Term Memory',
      subtitle: 'View, edit, pin, search, and manage persistent memories across sessions',
      category: 'navigation',
      scope: 'web_and_desktop',
      iconName: 'BrainCircuit',
      keywords: ['memory', 'memories', 'cortex', 'remember', 'recall', 'facts', 'preferences', 'inferences', 'long-term memory'],
      action: async (ctx) => {
        ctx.navigate('/memory');
        return {
          success: true,
          message: 'Opened Aether Long-Term Memory Hub.',
          stepsExecuted: ['Routed to /memory']
        };
      }
    });

    // Recall active project memories
    items.push({
      id: 'aether-recall-project-memory',
      title: `Recall Memories for ${activeProjName}`,
      subtitle: 'Show remembered goals, decisions, architecture, and blockers for this project',
      category: 'aether',
      scope: 'web_and_desktop',
      iconName: 'BrainCircuit',
      keywords: ['recall', 'remembered', 'project memory', 'decisions', 'architecture', 'goals'],
      action: async (ctx) => {
        const results = aetherLongTermMemory.queryMemories({
          projectId: activeProjId,
          limit: 6
        });

        if (results.length === 0) {
          return {
            success: true,
            message: `No specific memories found for ${activeProjName} yet.`,
            detailsMarkdown: `### ${activeProjName} Memories\n\nNo memories linked yet. You can say *"Remember that [fact]"* anytime.`
          };
        }

        let md = `### 🧠 Recalled Memories for **${activeProjName}**\n\n`;
        results.forEach((r, i) => {
          const m = r.memory;
          md += `${i + 1}. **${m.title}** (${m.classification === 'verified_fact' ? '`FACT`' : '`INFERENCE`'})\n   - ${m.content}\n   - *Category: \`${m.category}\`*\n\n`;
        });

        return {
          success: true,
          message: `Recalled ${results.length} memories for ${activeProjName}.`,
          detailsMarkdown: md,
          stepsExecuted: [`Retrieved ${results.length} memories from local cortex`]
        };
      }
    });

    // Remember Current Context
    items.push({
      id: 'aether-remember-context',
      title: `Remember Active Context in ${activeProjName}`,
      subtitle: 'Store current project state and decisions into Aether long-term memory',
      category: 'action',
      scope: 'web_and_desktop',
      iconName: 'Sparkles',
      keywords: ['remember context', 'save context', 'store memory', 'remember this'],
      action: async (ctx) => {
        const res = aetherLongTermMemory.rememberThis(
          `Active focus on ${activeProjName}: Ongoing development, feature stabilization, and responsive UX.`,
          {
            projectId: activeProjId,
            projectName: activeProjName,
            category: 'work_theme',
            scope: activeProjId ? 'project' : 'global',
            classification: 'verified_fact'
          }
        );

        return {
          success: true,
          message: `Saved active context to long-term memory: "${res.memory.title}"`,
          stepsExecuted: ['Added memory entity to long-term storage', 'Persisted to local cortex']
        };
      }
    });

    items.push({
      id: 'aether-voice-cycle',
      title: 'Cycle Aether Voice Mode',
      subtitle: `Current mode: ${aetherVoiceEngine.getMode().toUpperCase()} (Click to toggle Active/Voice/Context)`,
      category: 'aether',
      scope: 'web_and_desktop',
      iconName: 'Mic',
      keywords: ['voice', 'mute', 'unmute', 'speak', 'audio', 'listen', 'cadence'],
      action: async (ctx) => {
        const nextMode = aetherVoiceEngine.cycleNextMode();
        return {
          success: true,
          message: `Switched Aether voice state to ${nextMode.toUpperCase()}.`,
          stepsExecuted: [`Aether mode updated to ${nextMode}`]
        };
      }
    });

    // -------------------------------------------------------------
    // 2. DESKTOP & WORKSPACE TOOLS
    // -------------------------------------------------------------
    items.push({
      id: 'tool-vscode',
      title: 'Open this project in VS Code',
      subtitle: `Launch Visual Studio Code in ${activeProjName}`,
      category: 'app',
      scope: 'desktop_only',
      iconName: 'Code',
      keywords: ['vscode', 'vs code', 'code', 'editor', 'ide', 'open project in vs code'],
      badge: desktop ? 'Desktop Native' : 'Desktop Only',
      action: async (ctx) => {
        if (desktop) {
          const res = await safeOpenVSCode();
          if (res && res.success) {
            return {
              success: true,
              message: `Opened ${activeProjName} in Visual Studio Code.`,
              stepsExecuted: ['Sent IPC request to Electron desktop bridge', 'VS Code launched with active directory']
            };
          } else {
            return {
              success: false,
              message: res?.error || 'Failed to launch VS Code on host system.',
              stepsExecuted: ['Attempted desktop launch', 'Received system execution error']
            };
          }
        } else {
          return {
            success: false,
            message: 'Direct OS process execution requires DevSpace Electron Desktop App.',
            detailsMarkdown: `### Desktop Feature Notice\n\nOpening your OS file system in **Visual Studio Code** directly is an Electron Desktop capability.\n\n**Web Alternative**:\n- Run \`code .\` in your local terminal\n- Or open the project via DevSpace Desktop app.`,
            stepsExecuted: ['Detected Web runtime environment', 'Presented desktop capability notice']
          };
        }
      }
    });

    items.push({
      id: 'tool-terminal',
      title: 'Open Terminal here',
      subtitle: `Launch system terminal inside ${activeProjName} workspace`,
      category: 'app',
      scope: 'desktop_only',
      iconName: 'Terminal',
      keywords: ['terminal', 'console', 'bash', 'zsh', 'command prompt', 'cli', 'open terminal here'],
      badge: desktop ? 'Desktop Native' : 'Desktop Only',
      action: async (ctx) => {
        if (desktop) {
          const res = await safeOpenTerminal();
          if (res && res.success) {
            return {
              success: true,
              message: 'Opened native terminal at project root.',
              stepsExecuted: ['Invoked safeOpenTerminal', 'Spanned native shell process']
            };
          } else {
            return {
              success: false,
              message: res?.error || 'Could not open native terminal.',
              stepsExecuted: ['Attempted terminal launch']
            };
          }
        } else {
          return {
            success: false,
            message: 'Native terminal spawning requires DevSpace Electron Desktop App.',
            detailsMarkdown: `### Desktop Feature Notice\n\nOpening native system terminals (bash/zsh/PowerShell) directly is supported on DevSpace Desktop.\n\nIn Web mode, you can inspect commands and project files through DevSpace Code Workspace.`,
            stepsExecuted: ['Detected Web browser environment']
          };
        }
      }
    });

    // -------------------------------------------------------------
    // 3. WORKFLOWS & TEACHABLE AUTOMATIONS
    // -------------------------------------------------------------
    const teachableWorkflows = aetherWorkflowEngine.getWorkflows();
    teachableWorkflows.forEach((wf: TeachableWorkflow) => {
      if (!wf.enabled) return;
      const allKeywords = [
        'run',
        'workflow',
        'teachable',
        wf.triggerPhrase.toLowerCase(),
        wf.name.toLowerCase(),
        ...(wf.aliases || []).map(a => a.toLowerCase())
      ];

      items.push({
        id: `teachable-wf-${wf.id}`,
        title: `Run Workflow: ${wf.name}`,
        subtitle: `Trigger: "${wf.triggerPhrase}" • ${wf.steps.length} sequential step(s)`,
        category: 'workflow',
        scope: wf.hasMachineSpecificSteps ? 'desktop_only' : 'web_and_desktop',
        iconName: 'Workflow',
        keywords: allKeywords,
        badge: 'Teachable Flow',
        action: async (ctx) => {
          const res = await aetherWorkflowEngine.executeWorkflow(wf, {
            navigate: ctx.navigate,
            showToast: ctx.showToast,
            projects: ctx.projects,
            activeProjectId: ctx.activeProjectId,
            setActiveProjectId: ctx.setActiveProjectId,
            issues: ctx.issues,
            notes: ctx.notes,
            addIssue: ctx.addIssue,
            addNote: ctx.addNote
          }, {
            triggerSource: 'command_bar'
          });

          return {
            success: res.success,
            message: res.message,
            speechText: res.speechText,
            detailsMarkdown: res.summaryMarkdown,
            stepsExecuted: res.runRecord.stepResults.map(s => `${s.order}. ${s.title} [${s.status.toUpperCase()}]`)
          };
        }
      });
    });

    const pipelines = automationEngine.getPipelines();
    pipelines.forEach((pipe: AutomationPipeline) => {
      items.push({
        id: `workflow-${pipe.id}`,
        title: `Run Workflow: ${pipe.name}`,
        subtitle: `Category: ${pipe.category || 'workflow'} • ${pipe.nodes.length} step(s)`,
        category: 'workflow',
        scope: 'web_and_desktop',
        iconName: 'Zap',
        keywords: ['run', 'workflow', 'pipeline', 'automation', pipe.name.toLowerCase(), pipe.category || ''],
        badge: 'Pipeline',
        action: async (ctx) => {
          const log = await automationEngine.executePipeline(pipe.id);
          return {
            success: log.success,
            message: log.outputMessage || `Executed pipeline "${pipe.name}".`,
            stepsExecuted: log.stepsExecuted,
            detailsMarkdown: `### Workflow Execution: ${pipe.name}\n\n**Status:** ${log.success ? '✅ Success' : '❌ Failed'}\n**Duration:** ${log.durationMs || 120}ms\n\n**Steps Completed:**\n${log.stepsExecuted.map(s => `- ${s}`).join('\n')}`
          };
        }
      });
    });

    // -------------------------------------------------------------
    // 4. USER DEFINED ACTIONS & SAVED ALIASES
    // -------------------------------------------------------------
    const userActions = aetherAliasRegistry.getActions();
    userActions.forEach((act: UserDefinedAction) => {
      items.push({
        id: `custom-action-${act.id}`,
        title: `Run Action: ${act.name}`,
        subtitle: `Trigger: "${act.triggerPhrase}" • ${act.steps.length} automated steps`,
        category: 'custom',
        scope: 'web_and_desktop',
        iconName: 'Play',
        keywords: ['custom action', 'macro', act.name.toLowerCase(), act.triggerPhrase.toLowerCase()],
        badge: 'Custom Action',
        action: async (ctx) => {
          const executedSteps: string[] = [];
          for (const step of act.steps) {
            executedSteps.push(`Executing: ${step.label} (${step.actionType})`);
            if (step.actionType === 'navigate_route') {
              ctx.navigate(step.target);
            } else if (step.actionType === 'open_url') {
              await safeOpenExternalUrl(step.target);
            } else if (step.actionType === 'open_app') {
              if (desktop) {
                await safeExecuteDesktopAction('launch_app', { appName: step.target });
              } else {
                ctx.showToast(`Launch app "${step.target}" requested (Desktop runtime required)`, 'info');
              }
            }
          }
          return {
            success: true,
            message: `Completed custom action "${act.name}" (${act.steps.length} steps).`,
            stepsExecuted: executedSteps
          };
        }
      });
    });

    const aliases = aetherAliasRegistry.getAliases();
    aliases.forEach((al: AetherAlias) => {
      items.push({
        id: `alias-${al.id}`,
        title: `Alias: ${al.alias}`,
        subtitle: `Target: ${al.target} (${al.type.replace('_', ' ')})`,
        category: 'custom',
        scope: al.type === 'desktop_app' ? 'desktop_only' : 'web_and_desktop',
        iconName: 'Bookmark',
        keywords: ['alias', al.alias.toLowerCase(), al.target.toLowerCase()],
        badge: 'Alias',
        action: async (ctx) => {
          if (al.type === 'devspace_route') {
            ctx.navigate(al.target);
            return { success: true, message: `Navigated to ${al.target}` };
          } else if (al.type === 'website') {
            await safeOpenExternalUrl(al.target);
            return { success: true, message: `Opened URL ${al.target}` };
          } else if (al.type === 'desktop_app') {
            if (desktop) {
              const res = await safeExecuteDesktopAction('launch_app', { appName: al.target });
              return { success: res.success, message: `Launched ${al.target}` };
            } else {
              return {
                success: false,
                message: `Desktop App launch (${al.target}) requires DevSpace Desktop runtime.`
              };
            }
          }
          return { success: true, message: `Executed alias ${al.alias}` };
        }
      });
    });

    // -------------------------------------------------------------
    // 5. PROJECTS SEARCH & SWITCHING
    // -------------------------------------------------------------
    (context.projects || []).forEach((proj: any) => {
      const isActive = proj.id === context.activeProjectId;
      items.push({
        id: `project-${proj.id}`,
        title: `Project: ${proj.name}`,
        subtitle: `${isActive ? 'Active Workspace • ' : ''}${proj.description || 'DevSpace software project'}`,
        category: 'project',
        scope: 'web_and_desktop',
        iconName: 'FolderGit2',
        keywords: ['project', proj.name.toLowerCase(), ...(proj.tags || []).map((t: string) => t.toLowerCase())],
        badge: isActive ? 'Active' : 'Project',
        action: async (ctx) => {
          if (ctx.setActiveProjectId) {
            ctx.setActiveProjectId(proj.id);
          }
          ctx.navigate('/projects');
          return {
            success: true,
            message: `Switched active project to "${proj.name}".`,
            stepsExecuted: [`Set active project id: ${proj.id}`, 'Navigated to Projects view']
          };
        }
      });
    });

    // -------------------------------------------------------------
    // 6. ISSUES & TASKS SEARCH
    // -------------------------------------------------------------
    (context.issues || []).forEach((iss: any) => {
      const proj = context.projects.find(p => p.id === iss.projectId);
      items.push({
        id: `issue-${iss.id}`,
        title: `Issue: ${iss.title}`,
        subtitle: `${proj ? proj.name + ' • ' : ''}Status: ${iss.status || 'Todo'} • Priority: ${iss.priority || 'Medium'}`,
        category: 'issue',
        scope: 'web_and_desktop',
        iconName: 'CheckSquare',
        keywords: ['issue', 'task', 'bug', 'todo', iss.title.toLowerCase(), (iss.status || '').toLowerCase()],
        badge: iss.status || 'Issue',
        action: async (ctx) => {
          ctx.navigate('/issues');
          return {
            success: true,
            message: `Opened task "${iss.title}". Status: ${iss.status || 'Todo'}.`,
            detailsMarkdown: `### Issue: ${iss.title}\n\n- **Project:** ${proj?.name || 'Active Workspace'}\n- **Status:** ${iss.status || 'Todo'}\n- **Priority:** ${iss.priority || 'Medium'}\n- **Description:** ${iss.description || 'No description provided.'}`
          };
        }
      });
    });

    // -------------------------------------------------------------
    // 7. NOTES, DOCS & ASSETS SEARCH
    // -------------------------------------------------------------
    (context.notes || []).forEach((note: any) => {
      items.push({
        id: `note-${note.id}`,
        title: `Note: ${note.title}`,
        subtitle: note.content ? note.content.slice(0, 70) + '...' : 'Workspace document note',
        category: 'note',
        scope: 'web_and_desktop',
        iconName: 'FileText',
        keywords: ['note', 'doc', 'document', note.title.toLowerCase(), ...(note.tags || []).map((t: string) => t.toLowerCase())],
        badge: 'Note',
        action: async (ctx) => {
          ctx.navigate('/notes');
          return {
            success: true,
            message: `Opened note "${note.title}".`,
            detailsMarkdown: `### ${note.title}\n\n${note.content || '*(Empty note)*'}`
          };
        }
      });
    });

    (context.assets || []).forEach((asset: any) => {
      items.push({
        id: `asset-${asset.id}`,
        title: `File: ${asset.name}`,
        subtitle: `Type: ${asset.type || 'Asset'} • Size: ${asset.size || 'Unknown'}`,
        category: 'file',
        scope: 'web_and_desktop',
        iconName: 'File',
        keywords: ['file', 'asset', 'pdf', 'image', 'document', asset.name.toLowerCase()],
        badge: 'File',
        action: async (ctx) => {
          ctx.navigate('/assets');
          return {
            success: true,
            message: `Opened file asset "${asset.name}".`
          };
        }
      });
    });

    // -------------------------------------------------------------
    // 8. GITHUB INTELLIGENCE & REPOSITORY ACTIONS
    // -------------------------------------------------------------
    const ghState = aetherActiveProjectContext.getState();
    if (ghState.connectedRepository) {
      items.push({
        id: 'github-view-repo',
        title: `Search GitHub: ${ghState.connectedRepository}`,
        subtitle: `Branch: ${ghState.currentBranch || 'main'} • ${ghState.recentCommits?.length || 0} synced commits`,
        category: 'github',
        scope: 'web_and_desktop',
        iconName: 'Github',
        keywords: ['github', 'repo', 'repository', 'commits', 'prs', ghState.connectedRepository.toLowerCase()],
        badge: 'GitHub',
        action: async (ctx) => {
          ctx.navigate('/github');
          return {
            success: true,
            message: `Opened GitHub Intelligence for ${ghState.connectedRepository}.`
          };
        }
      });

      (ghState.recentCommits || []).slice(0, 5).forEach((c: any) => {
        items.push({
          id: `gh-commit-${c.sha || c.hash || Math.random()}`,
          title: `Commit: ${c.message?.split('\n')[0] || c.sha}`,
          subtitle: `${c.author || 'Dev'} • ${c.sha?.slice(0, 7) || 'HEAD'} • ${ghState.connectedRepository}`,
          category: 'github',
          scope: 'web_and_desktop',
          iconName: 'GitCommit',
          keywords: ['commit', 'git', c.message?.toLowerCase() || '', c.sha || ''],
          badge: 'Commit',
          action: async (ctx) => {
            ctx.navigate('/github');
            return {
              success: true,
              message: `Inspected commit ${c.sha?.slice(0, 7)}: "${c.message}"`,
              detailsMarkdown: `### GitHub Commit Details\n\n- **Hash:** \`${c.sha}\`\n- **Author:** ${c.author}\n- **Message:** ${c.message}\n- **Repo:** ${ghState.connectedRepository}`
            };
          }
        });
      });
    }

    // -------------------------------------------------------------
    // 9. CORE NAVIGATION ROUTES
    // -------------------------------------------------------------
    const coreRoutes = [
      { id: 'nav-dashboard', title: 'Dashboard', subtitle: 'Workspace overview and health metrics', path: '/', icon: 'LayoutDashboard', keywords: ['home', 'overview', 'dashboard', 'stats'] },
      { id: 'nav-projects', title: 'Projects', subtitle: 'Manage software projects and repositories', path: '/projects', icon: 'FolderGit2', keywords: ['projects', 'repos', 'apps'] },
      { id: 'nav-brain', title: 'Project Brain', subtitle: 'Cortex neural memory and context visualizer', path: '/brain', icon: 'Bot', keywords: ['brain', 'cortex', 'memory', 'knowledge'] },
      { id: 'nav-issues', title: 'Issues & Tasks', subtitle: 'Kanban board, backlog, and sprint planner', path: '/issues', icon: 'CheckSquare', keywords: ['issues', 'tasks', 'kanban', 'sprint'] },
      { id: 'nav-roadmap', title: 'Roadmap & Milestones', subtitle: 'Strategic development timeline', path: '/roadmap', icon: 'Map', keywords: ['roadmap', 'milestones', 'timeline', 'goals'] },
      { id: 'nav-github', title: 'GitHub Intelligence', subtitle: 'Pull requests, branch management, and CI', path: '/github', icon: 'Github', keywords: ['github', 'pull requests', 'branches'] },
      { id: 'nav-docs', title: 'Workspace Docs', subtitle: 'Documentation and API specs', path: '/docs', icon: 'FileText', keywords: ['docs', 'documentation', 'markdown'] },
      { id: 'nav-notes', title: 'Notes & Cortex Memories', subtitle: 'Scratchpad and fast note taking', path: '/notes', icon: 'Edit3', keywords: ['notes', 'scratchpad', 'ideas'] },
      { id: 'nav-assets', title: 'Assets & Media', subtitle: 'Design assets, PDFs, and uploaded files', path: '/assets', icon: 'Folder', keywords: ['assets', 'files', 'media', 'pdfs'] },
      { id: 'nav-ideas', title: 'Idea Expansion', subtitle: 'Brainstorming and AI feature expansion', path: '/ideas', icon: 'Lightbulb', keywords: ['ideas', 'expansion', 'brainstorming'] },
      { id: 'nav-agents', title: 'Agentic OS', subtitle: 'Multi-agent orchestration and autonomy settings', path: '/agents', icon: 'Cpu', keywords: ['agents', 'autonomous', 'orchestration'] },
      { id: 'nav-automations', title: 'Automations & Pipelines', subtitle: 'Workflow builder and background runners', path: '/automations', icon: 'Workflow', keywords: ['automations', 'workflows', 'triggers'] },
      { id: 'nav-sandbox', title: 'Sandbox Loop', subtitle: 'Safe dream evaluation and code execution', path: '/sandbox-loop', icon: 'RefreshCw', keywords: ['sandbox', 'dreams', 'evaluation'] },
      { id: 'nav-design', title: 'Design Studio', subtitle: 'Interactive UI generator and AB comparisons', path: '/design', icon: 'Palette', keywords: ['design', 'ui', 'templates', 'generator'] },
      { id: 'nav-create', title: 'Create Wizard', subtitle: 'Bootstrap new applications from natural language', path: '/create', icon: 'PlusCircle', keywords: ['create', 'new app', 'scaffold'] },
      { id: 'nav-settings', title: 'Settings', subtitle: 'Preferences, voice, models, and security', path: '/settings', icon: 'Settings', keywords: ['settings', 'preferences', 'voice', 'models'] },
    ];

    coreRoutes.forEach(r => {
      items.push({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle,
        category: 'navigation',
        scope: 'web_and_desktop',
        iconName: r.icon,
        keywords: ['navigate', 'open', 'go to', ...r.keywords],
        badge: 'View',
        action: async (ctx) => {
          ctx.navigate(r.path);
          return { success: true, message: `Navigated to ${r.title}.` };
        }
      });
    });

    // -------------------------------------------------------------
    // 10. QUICK ACTION BUILDERS (Create Issue, Create Note, New Project)
    // -------------------------------------------------------------
    items.push({
      id: 'action-create-issue',
      title: 'Create an Issue',
      subtitle: `Create a new task in ${activeProjName}`,
      category: 'action',
      scope: 'web_and_desktop',
      iconName: 'PlusSquare',
      keywords: ['create issue', 'new issue', 'add task', 'new task', 'bug', 'todo'],
      badge: 'Action',
      action: async (ctx) => {
        if (ctx.addIssue && activeProj) {
          const newIssue = {
            projectId: activeProj.id,
            title: 'New Task from Command Bar',
            description: 'Created via Universal Aether Command Bar',
            priority: 'Medium',
            status: 'Todo',
            createdAt: Date.now()
          };
          await ctx.addIssue(newIssue);
          return {
            success: true,
            message: `Created issue in ${activeProjName}.`,
            undoable: true,
            undoLabel: 'Delete created issue',
            stepsExecuted: ['Added issue to DataProvider', 'Synced with project backlog']
          };
        }
        ctx.navigate('/issues');
        return { success: true, message: 'Navigated to Issues planner.' };
      }
    });

    items.push({
      id: 'action-create-note',
      title: 'Create a Quick Note',
      subtitle: 'Capture a timestamped thought into Cortex memory',
      category: 'action',
      scope: 'web_and_desktop',
      iconName: 'Edit3',
      keywords: ['create note', 'quick note', 'new note', 'memo', 'capture'],
      badge: 'Action',
      action: async (ctx) => {
        if (ctx.addNote && activeProj) {
          const newNote = {
            projectId: activeProj.id,
            title: `Quick Note (${new Date().toLocaleTimeString()})`,
            content: 'Captured via Universal Aether Command Bar.',
            tags: ['QuickCapture', 'CommandBar'],
            createdAt: Date.now()
          };
          await ctx.addNote(newNote);
          return {
            success: true,
            message: 'Saved quick note to Cortex memory.',
            stepsExecuted: ['Recorded note to memory store']
          };
        }
        ctx.navigate('/notes');
        return { success: true, message: 'Navigated to Notes.' };
      }
    });

    return items;
  }

  // Fast Fuzzy Search Scoring Algorithm
  public search(
    query: string, 
    items: CommandItem[], 
    selectedCategory?: CommandCategory | 'all'
  ): CommandItem[] {
    const trimmed = query.trim().toLowerCase();

    // Filter by category if specified and not 'all'
    let pool = items;
    if (selectedCategory && selectedCategory !== 'all') {
      pool = items.filter(it => it.category === selectedCategory);
    }

    if (!trimmed) {
      return pool.slice(0, 30);
    }

    const queryTokens = trimmed.split(/\s+/).filter(Boolean);

    const scored = pool.map(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const subtitleLower = (item.subtitle || '').toLowerCase();
      const keywords = item.keywords || [];

      // 1. Exact title match
      if (titleLower === trimmed) {
        score += 1000;
      } else if (titleLower.startsWith(trimmed)) {
        score += 500;
      } else if (titleLower.includes(trimmed)) {
        score += 250;
      }

      // 2. Keyword exact / prefix match
      keywords.forEach(kw => {
        const kwLower = kw.toLowerCase();
        if (kwLower === trimmed) {
          score += 300;
        } else if (kwLower.startsWith(trimmed)) {
          score += 150;
        } else if (kwLower.includes(trimmed)) {
          score += 80;
        }
      });

      // 3. Subtitle match
      if (subtitleLower.includes(trimmed)) {
        score += 60;
      }

      // 4. Token multi-match
      let tokensMatched = 0;
      queryTokens.forEach(token => {
        if (titleLower.includes(token)) {
          score += 50;
          tokensMatched++;
        } else if (keywords.some(k => k.includes(token))) {
          score += 40;
          tokensMatched++;
        } else if (subtitleLower.includes(token)) {
          score += 20;
          tokensMatched++;
        }
      });

      if (tokensMatched === queryTokens.length) {
        score += 100; // bonus if all words matched
      }

      return {
        ...item,
        score
      };
    });

    return scored
      .filter(item => item.score! > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 40);
  }

  // Handle Free-Form Natural Language & Direct Action Execution
  public async executeFreeformQuery(
    rawQuery: string, 
    context: CommandExecutionContext
  ): Promise<CommandExecutionResult> {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      return { success: false, message: 'Empty query received.' };
    }

    const lower = trimmed.toLowerCase();

    // 1. Check for web search prefix (e.g. "google ...", "search google ...")
    if (lower.startsWith('google ') || lower.startsWith('search google ')) {
      const q = lower.replace(/^google\s+/, '').replace(/^search google\s+/, '').trim();
      const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      await safeOpenExternalUrl(targetUrl);
      return {
        success: true,
        message: `Opened Google search for "${q}".`,
        url: targetUrl,
        stepsExecuted: [`Encoded search query "${q}"`, 'Dispatched browser open event']
      };
    }

    // 2. Check for YouTube search prefix (e.g. "youtube ...", "find youtube videos about ...")
    if (lower.startsWith('youtube ') || lower.startsWith('find youtube videos about ') || lower.startsWith('search youtube ')) {
      const q = lower.replace(/^youtube\s+/, '').replace(/^find youtube videos about\s+/, '').replace(/^search youtube\s+/, '').trim();
      const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      await safeOpenExternalUrl(targetUrl);
      return {
        success: true,
        message: `Opened YouTube search for "${q}".`,
        url: targetUrl,
        stepsExecuted: [`Constructed YouTube search URL`, 'Opened in browser']
      };
    }

    // 3. Check for File Search (e.g. "find my pdf from yesterday", "find pdf ...", "find file ...")
    if (lower.startsWith('find ') || lower.includes('.pdf') || lower.includes('file') || lower.includes('pdf')) {
      const fileQuery = lower.replace(/^find\s+/, '').replace(/my\s+/, '').trim();
      if (isElectron()) {
        const desktopRes = await safeSearchDesktopFiles({ query: fileQuery });
        if (desktopRes && desktopRes.success && desktopRes.results && desktopRes.results.length > 0) {
          return {
            success: true,
            message: `Found ${desktopRes.results.length} matching desktop file(s).`,
            detailsMarkdown: `### Files Matching "${fileQuery}"\n\n${desktopRes.results.map((r: any) => `- **${r.name || r.path}** (\`${r.path}\`)`).join('\n')}`,
            stepsExecuted: ['Searched native desktop filesystem', `Located ${desktopRes.results.length} matches`]
          };
        }
      }

      // Search in workspace assets & notes
      const matchedAssets = (context.assets || []).filter((a: any) => (a.name || '').toLowerCase().includes(fileQuery));
      const matchedNotes = (context.notes || []).filter((n: any) => (n.title || '').toLowerCase().includes(fileQuery) || (n.content || '').toLowerCase().includes(fileQuery));
      
      if (matchedAssets.length > 0 || matchedNotes.length > 0) {
        return {
          success: true,
          message: `Found ${matchedAssets.length} asset(s) and ${matchedNotes.length} note(s) matching "${fileQuery}".`,
          detailsMarkdown: `### Workspace Results for "${fileQuery}"\n\n${matchedAssets.map((a: any) => `📁 **Asset:** ${a.name}`).concat(matchedNotes.map((n: any) => `📝 **Note:** ${n.title}`)).join('\n')}`,
          stepsExecuted: ['Searched active workspace memory and storage assets']
        };
      }
    }

    // 4. Check for Custom Alias definition (e.g. "alias editor = Visual Studio Code")
    const aliasDefineMatch = trimmed.match(/^alias\s+([^=]+)=\s*(.+)$/i);
    if (aliasDefineMatch) {
      const aliasName = aliasDefineMatch[1].trim();
      const target = aliasDefineMatch[2].trim();
      const isWebUrl = target.startsWith('http://') || target.startsWith('https://');
      const isRoute = target.startsWith('/');
      const saved = aetherAliasRegistry.saveAlias({
        alias: aliasName,
        target: target,
        type: isWebUrl ? 'website' : isRoute ? 'devspace_route' : 'desktop_app',
        description: `Custom alias created via Universal Command Bar`
      });
      return {
        success: true,
        message: `Saved alias "${aliasName}" -> "${target}".`,
        detailsMarkdown: `### New Alias Registered\n\n- **Alias:** \`${saved.alias}\`\n- **Target:** \`${saved.target}\`\n- **Type:** \`${saved.type}\``,
        stepsExecuted: ['Parsed alias definition', 'Saved to persistent Aether Alias Registry']
      };
    }

    // 5. Check if query matches a known alias directly
    const matchedAlias = aetherAliasRegistry.findMatchingAlias(trimmed);
    if (matchedAlias) {
      if (matchedAlias.type === 'devspace_route') {
        context.navigate(matchedAlias.target);
        return { success: true, message: `Navigated to ${matchedAlias.target} via alias "${matchedAlias.alias}".` };
      } else if (matchedAlias.type === 'website') {
        await safeOpenExternalUrl(matchedAlias.target);
        return { success: true, message: `Opened URL ${matchedAlias.target} via alias "${matchedAlias.alias}".` };
      } else if (matchedAlias.type === 'desktop_app') {
        if (isElectron()) {
          const res = await safeExecuteDesktopAction('launch_app', { appName: matchedAlias.target });
          return { success: res.success, message: `Launched ${matchedAlias.target}.` };
        } else {
          return {
            success: false,
            message: `Desktop app launch (${matchedAlias.target}) requires DevSpace Desktop runtime.`
          };
        }
      }
    }

    // 6. Natural Language Query handled via authoritative Aether Conversational Engine!
    const response = await aetherConversationalEngine.processUserMessageAsync(
      trimmed,
      context.projects,
      context.activeProjectId,
      {
        onNavigate: context.navigate,
        onIssueCreate: async (issueData) => {
          if (context.addIssue) {
            return await context.addIssue(issueData);
          }
        },
        onNoteCreate: async (noteData) => {
          if (context.addNote) {
            await context.addNote(noteData);
          }
        }
      }
    );

    return {
      success: true,
      message: response.speechText || response.responseText.slice(0, 140),
      speechText: response.speechText,
      detailsMarkdown: response.responseText,
      category: 'aether',
      stepsExecuted: ['Resolved intent with canonical Aether engine', 'Executed relevant context query', 'Generated grounded response']
    };
  }
}

export const aetherCommandBar = new AetherCommandBarService();
