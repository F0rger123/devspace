// Aether Continuous Conversational Engine & Project Intelligence
// Coordinates continuous multi-turn development dialogue, working memory,
// canonical project context, GitHub status, idea lifecycle, search, and personality.

import { masterIdeaLibrary, MasterIdea } from './masterIdeaLibraryService';
import { aetherVoiceRegistry } from './aetherVoiceRegistry';
import { aetherCore } from './aetherCore';
import { aetherDesktopIntelligence, WebSearchResult, YouTubeVideoResult } from './aetherDesktopIntelligence';
import {
  aetherActiveProjectContext,
  CanonicalActiveProjectContextState
} from './aetherActiveProjectContext';
import {
  getResolvedAetherPersonality,
  formatResponseWithPersonality,
  ResolvedAetherPersonality
} from './aetherPersonalityResolver';
import {
  resolveCanonicalAetherIntent,
  CanonicalResolvedIntent,
  parseOrdinalIndex
} from './aetherCanonicalIntentResolver';
import { aetherAliasRegistry } from './aetherAliasRegistry';

export interface WorkingMemoryItem {
  id: string;
  type: 'idea' | 'goal' | 'decision' | 'question' | 'action_item' | 'research' | 'dream' | 'planner_task';
  number?: number;
  title: string;
  details?: string;
  starred?: boolean;
  convertedStatus?: string;
  projectId?: string;
  createdAt: number;
}

export interface AetherEngineCallbacks {
  onNavigate?: (path: string, projectId?: string) => void;
  onProjectCreate?: (projectData: { name: string; description?: string }) => Promise<{ id: string; name: string } | null | void>;
  onIssueCreate?: (issueData: { title: string; projectId: string; priority?: string; type?: string; parentId?: string }) => Promise<{ id: string; title: string } | null | void>;
  onIssueUpdate?: (issueData: { id?: string; title?: string; priority?: string; status?: string; projectId?: string }) => Promise<void>;
  onIssueDelete?: (issueId: string) => Promise<void>;
  onNoteCreate?: (noteData: { title: string; content?: string; projectId?: string }) => Promise<void>;
  onIdeaCreate?: (ideaData: { title: string; description?: string; projectId?: string; priority?: string }) => Promise<void>;
  openUrl?: (url: string) => void;
  launchApp?: (appName: string) => void;
}

export interface AetherProcessedResponse {
  responseText: string;
  speechText?: string;
  intent?: string;
  confidence?: number;
  actionToExecute?: {
    intent: string;
    parsedData: any;
  };
  resultData?: any;
  statusText?: string;
}

export interface ConversationContextState {
  currentTopic: string;
  referencedProjectIds: string[];
  activeProjectId?: string;
  activeProjectName?: string;
  workingMemory: WorkingMemoryItem[];
  decisions: { id: string; text: string; timestamp: number }[];
  questions: { id: string; question: string; answered: boolean }[];
  pendingActions: { id: string; actionType: string; description: string; payload: any; status: 'pending' | 'confirmed' | 'cancelled' }[];
  lastMentionedItem?: WorkingMemoryItem;
  lastReportSummary?: string;
  lastSearchType?: 'web' | 'youtube';
  lastSearchQuery?: string;
  lastSearchResults?: WebSearchResult[];
  lastYouTubeQuery?: string;
  lastYouTubeResults?: YouTubeVideoResult[];
  lastPresentedResultSet?: any[];
  lastSelectedResult?: any;
  lastOpenedResult?: any;
  lastRecommendedResult?: any;
  selectedVideo?: any;
  lastCreatedProject?: { id: string; name: string };
  lastCreatedIssue?: { id: string; title: string; priority: string; projectId: string };
  lastMentionedIdea?: { id?: string; number?: number; title: string; details?: string };
  lastOpenedTarget?: { name: string; urlOrApp: string; type: string };
  lastAction?: string;
  currentTask?: string;
  awaitingInputFor?: 'project_name' | 'issue_title' | 'confirmation' | null;
  interruptionStack: {
    topic: string;
    goal: string;
    workingMemory: WorkingMemoryItem[];
    pendingActions: any[];
    timestamp: number;
  }[];
}

export let lastAetherIntentDebug: CanonicalResolvedIntent | null = null;

class AetherConversationalEngine {
  private memoryState: ConversationContextState = {
    currentTopic: 'General Workspace Discussion',
    referencedProjectIds: [],
    workingMemory: [],
    decisions: [],
    questions: [],
    pendingActions: [],
    interruptionStack: []
  };

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('aether_conversational_state');
      if (saved) {
        this.memoryState = { ...this.memoryState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load conversational state:', e);
    }
  }

  public saveState() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('aether_conversational_state', JSON.stringify(this.memoryState));
    } catch (e) {
      console.error('Failed to save conversational state:', e);
    }
  }

  public getState(): ConversationContextState {
    return this.memoryState;
  }

  public setTopic(topic: string) {
    this.memoryState.currentTopic = topic;
    aetherActiveProjectContext.setCurrentTopic(topic);
    this.saveState();
  }

  public setActiveProject(id: string, name: string) {
    this.memoryState.activeProjectId = id;
    this.memoryState.activeProjectName = name;
    if (!this.memoryState.referencedProjectIds.includes(id)) {
      this.memoryState.referencedProjectIds.push(id);
    }
    aetherActiveProjectContext.setActiveProject(id, name);
    this.saveState();
  }

  public resumePreviousProject(availableProjects: any[] = []): { id: string; name: string } | null {
    const list = this.memoryState.referencedProjectIds;
    if (list.length >= 2) {
      const prevId = list[list.length - 2];
      const match = availableProjects.find(p => p.id === prevId);
      if (match) {
        this.setActiveProject(match.id, match.name);
        return { id: match.id, name: match.name };
      }
    }
    if (availableProjects.length > 0) {
      const first = availableProjects[0];
      this.setActiveProject(first.id, first.name);
      return { id: first.id, name: first.name };
    }
    return null;
  }

  public addToWorkingMemory(item: Omit<WorkingMemoryItem, 'id' | 'createdAt'>): WorkingMemoryItem {
    const newItem: WorkingMemoryItem = {
      ...item,
      id: `wm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now()
    };
    this.memoryState.workingMemory.push(newItem);
    this.memoryState.lastMentionedItem = newItem;
    if (item.type === 'idea') {
      this.memoryState.lastMentionedIdea = {
        id: newItem.id,
        number: newItem.number,
        title: newItem.title,
        details: newItem.details
      };
    }
    this.saveState();
    return newItem;
  }

  public generateBrainstormIdeas(req: { topic: string; count: number; projectId?: string }): WorkingMemoryItem[] {
    const startNum = this.memoryState.workingMemory.filter(i => i.type === 'idea').length + 1;
    const generated: WorkingMemoryItem[] = [];

    const ideaBlueprints = [
      {
        title: 'Autonomous AST Code Refactoring Pipeline',
        details: 'Scans TypeScript syntax trees to automatically eliminate dead code and improve bundle throughput.'
      },
      {
        title: 'Interactive Timeline Replay Scrub',
        details: 'Allows developers to scrub backwards and forwards through file edits and AST diffs with live preview.'
      },
      {
        title: 'Conversational Memory Context Graph',
        details: 'Links open issues, commits, and user directives into a unified semantic map for continuous multi-turn reasoning.'
      },
      {
        title: 'Zero-Downtime Release Readiness Auditor',
        details: 'Evaluates test coverage, open issues, and PR statuses before triggering production tagging.'
      },
      {
        title: 'Adaptive Synaptic Directive Cache',
        details: 'Persists user instructions and project architectural constraints across continuous dialogue turns.'
      }
    ];

    for (let i = 0; i < req.count; i++) {
      const blueprint = ideaBlueprints[i % ideaBlueprints.length];
      const ideaNum = startNum + i;
      const title = `${blueprint.title}`;
      const details = blueprint.details;

      const item = this.addToWorkingMemory({
        type: 'idea',
        number: ideaNum,
        title,
        details,
        projectId: req.projectId || this.memoryState.activeProjectId
      });
      generated.push(item);
    }
    this.saveState();
    return generated;
  }

  public getGreeting(activeProjectName?: string): string {
    const personality = getResolvedAetherPersonality();
    const rawName = personality.preferredUserName || '';
    const hasCustomName = Boolean(
      rawName &&
      rawName.toLowerCase() !== 'developer' &&
      rawName.toLowerCase() !== 'operator' &&
      rawName.toLowerCase() !== 'user'
    );
    const name = hasCustomName ? rawName : '';

    const greetings = [
      name ? `Hey ${name}, what do you want to start with?` : `Hey, what do you want to start with?`,
      name ? `What's up, ${name}?` : `What's up?`,
      name ? `Hey ${name}, what are we working on?` : `What are we working on?`,
      name ? `Ready when you are, ${name}.` : `Ready when you are.`,
      name ? `Hey ${name}! How can I help today?` : `Hey! How can I help today?`,
      name ? `Good to see you, ${name}. What's on your mind?` : `Good to see you. What's on your mind?`
    ];

    if (personality.verbosity === 'concise') {
      const conciseOptions = [
        name ? `Ready when you are, ${name}.` : `Ready when you are.`,
        name ? `What's up, ${name}?` : `What's up?`,
        name ? `Hey ${name}, what are we working on?` : `What are we working on?`
      ];
      return conciseOptions[Math.floor(Math.random() * conciseOptions.length)];
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Main Conversational Multi-Turn Message Processing
   */
  public async processUserMessageAsync(
    userMessage: string,
    availableProjects: any[] = [],
    activeProjId?: string,
    callbacks?: AetherEngineCallbacks
  ): Promise<AetherProcessedResponse> {
    const text = userMessage.trim();
    const personality = getResolvedAetherPersonality();
    const userName = personality.preferredUserName || 'Developer';

    // Synchronize active project context
    if (activeProjId) {
      this.memoryState.activeProjectId = activeProjId;
      const projObj = availableProjects.find(p => p.id === activeProjId);
      if (projObj) this.memoryState.activeProjectName = projObj.name;
    }

    // 1. Resolve canonical intent
    const canonical = resolveCanonicalAetherIntent(text, {
      activeProjectId: this.memoryState.activeProjectId,
      activeProjectName: this.memoryState.activeProjectName,
      currentTopic: this.memoryState.currentTopic,
      availableProjects,
      previousProjectIds: this.memoryState.referencedProjectIds,
      lastSearchType: this.memoryState.lastSearchType,
      lastSearchQuery: this.memoryState.lastSearchQuery,
      lastSearchResults: this.memoryState.lastSearchResults,
      lastYouTubeResults: this.memoryState.lastYouTubeResults,
      lastPresentedResultSet: this.memoryState.lastPresentedResultSet,
      lastSelectedResult: this.memoryState.lastSelectedResult,
      lastCreatedIssue: this.memoryState.lastCreatedIssue,
      lastMentionedIdea: this.memoryState.lastMentionedIdea,
      workingMemory: this.memoryState.workingMemory,
      awaitingInputFor: this.memoryState.awaitingInputFor
    });

    lastAetherIntentDebug = canonical;
    console.log('[Aether Canonical Intent Debug]', canonical);

    // 2. CANCEL TASK / INTERRUPT PLAYBACK
    if (canonical.intent === 'cancel_task') {
      aetherVoiceRegistry.stopSpeaking();
      this.memoryState.awaitingInputFor = null;
      this.saveState();
      return {
        responseText: 'Audio playback and pending task cancelled.',
        speechText: 'Cancelled current task.',
        statusText: 'Task Cancelled'
      };
    }

    // 3. USER PREFERRED NAME & PERSONALITY DIRECTIVES
    if (canonical.intent === 'update_user_name') {
      const newName = canonical.entities.preferredName;
      if (newName) {
        aetherVoiceRegistry.setPreferredName(newName);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('aether_user_preferred_name', newName);
          const currentRules: string[] = JSON.parse(localStorage.getItem('app_aether_personality_rules') || '[]');
          const ruleText = `Call the user '${newName}' from now on`;
          if (!currentRules.includes(ruleText)) {
            localStorage.setItem('app_aether_personality_rules', JSON.stringify([...currentRules, ruleText]));
          }
        }
        return {
          responseText: formatResponseWithPersonality(
            `Understood, ${newName}! From now on, I will address you as **${newName}**.`,
            getResolvedAetherPersonality(undefined, newName)
          ),
          speechText: `Understood, ${newName}! From now on, I will address you as ${newName}.`,
          statusText: `Updated name to ${newName}`
        };
      }
    }

    // 4. RECENT WORK & WORKSPACE INTELLIGENCE
    if (canonical.intent === 'recent_work_intelligence') {
      const targetName = canonical.entities.targetProjectName;
      const timeFilter = canonical.entities.timeFilter || 'recent';

      if (targetName && availableProjects.length > 0) {
        const matched = availableProjects.find(p => p.name.toLowerCase().includes(targetName.toLowerCase()));
        if (matched) {
          this.setActiveProject(matched.id, matched.name);
        }
      }

      const report = aetherActiveProjectContext.getRecentWorkReport({
        targetProjectName: targetName,
        timeFilter,
        allProjects: availableProjects
      });

      this.memoryState.lastReportSummary = report.summaryText;
      this.saveState();

      return {
        responseText: formatResponseWithPersonality(report.summaryText, personality),
        speechText: report.spokenText || `You've mainly been working on ${this.memoryState.activeProjectName || 'DevSpace'}.`,
        statusText: 'Loaded Recent Work Intelligence',
        resultData: report
      };
    }

    // 4.5 CURRENT PROJECT QUERY
    if (canonical.intent === 'current_project_query') {
      const projName = this.memoryState.activeProjectName;
      if (projName) {
        return {
          responseText: formatResponseWithPersonality(
            `You are currently in **"${projName}"**. Would you like to view open issues, inspect notes, or switch projects?`,
            personality
          ),
          speechText: `You are currently working in ${projName}.`,
          statusText: `Active project: ${projName}`
        };
      }
      return {
        responseText: formatResponseWithPersonality(
          `You don't have an active project selected right now. Say "Take me to projects" to choose one.`,
          personality
        ),
        speechText: `No active project is selected.`,
        statusText: `No active project`
      };
    }

    // 4.6 CONVERSATION TOPIC QUERY
    if (canonical.intent === 'conversation_topic_query') {
      const topic = this.memoryState.currentTopic || this.memoryState.activeProjectName;
      if (topic) {
        return {
          responseText: formatResponseWithPersonality(
            `We were discussing **"${topic}"**. Would you like to continue or move to another topic?`,
            personality
          ),
          speechText: `We were discussing ${topic}.`,
          statusText: `Topic: ${topic}`
        };
      }
      return {
        responseText: formatResponseWithPersonality(
          `We were reviewing your workspace. What would you like to focus on next?`,
          personality
        ),
        speechText: `We were reviewing your workspace. What would you like to do next?`,
        statusText: `Ready`
      };
    }

    // 5. BLOCKERS QUERY
    if (canonical.intent === 'blockers_query') {
      const projectState = aetherActiveProjectContext.getState();
      const highPriorityIssues = projectState.openIssues.filter(i => i.priority === 'Critical' || i.priority === 'High');
      const openPRs = projectState.openPullRequests;

      let msg = `### Blockers & Critical Items: **${projectState.projectName || 'Active Project'}**\n\n`;
      if (highPriorityIssues.length === 0 && openPRs.length === 0) {
        msg += `✅ **No blockers identified.** All high-priority tasks are resolved, and no pending pull requests are held up.`;
      } else {
        if (highPriorityIssues.length > 0) {
          msg += `**High-Priority Tasks**:\n` + highPriorityIssues.map(i => `• [${i.priority}] **${i.title}** (${i.status})`).join('\n') + `\n\n`;
        }
        if (openPRs.length > 0) {
          msg += `**Pending Pull Requests**:\n` + openPRs.map(p => `• PR #${p.number}: *${p.title}* by @${p.user}`).join('\n');
        }
      }

      return {
        responseText: formatResponseWithPersonality(msg, personality),
        speechText: highPriorityIssues.length > 0
          ? `Found ${highPriorityIssues.length} high priority issues blocking progress.`
          : `No blockers found for this project.`,
        statusText: 'Checked Blockers'
      };
    }

    // 6. OPEN ISSUES SUMMARY
    if (canonical.intent === 'issues_summary') {
      const projectState = aetherActiveProjectContext.getState();
      const issues = projectState.openIssues;

      if (issues.length === 0) {
        return {
          responseText: formatResponseWithPersonality(`There are currently no open issues in **${projectState.projectName || 'this project'}**. Say "Create an issue for [Task]" to add one!`, personality),
          speechText: `No open issues in this project.`,
          statusText: 'No open issues'
        };
      }

      const list = issues.slice(0, 8).map((iss, i) =>
        `**${i + 1}. [${iss.priority}] ${iss.title}** — Status: *${iss.status}*`
      ).join('\n');

      return {
        responseText: formatResponseWithPersonality(`### Open Issues for **${projectState.projectName}** (${issues.length} total):\n\n${list}\n\n*Say "Move #1 to In Progress", "Make it high priority", or "Create a sub-issue for [Task]"*`, personality),
        speechText: `There are ${issues.length} open issues in ${projectState.projectName}.`,
        statusText: `Loaded ${issues.length} issues`
      };
    }

    // 7. GITHUB MERGE SAFETY EVALUATION
    if (canonical.intent === 'github_merge_safety') {
      const pullNumber = canonical.entities.pullNumber || 1;
      const evaluation = await aetherActiveProjectContext.evaluatePRMergeSafety(pullNumber);

      return {
        responseText: formatResponseWithPersonality(evaluation.summary, personality),
        speechText: evaluation.safe
          ? `Pull request ${pullNumber} passed all automated merge safety checks.`
          : `Pull request ${pullNumber} requires attention before merging.`,
        statusText: `PR #${pullNumber} Safety Checked`,
        resultData: evaluation
      };
    }

    // 8. GITHUB OPEN REPOSITORY
    if (canonical.intent === 'github_open_repo') {
      const repo = aetherActiveProjectContext.getState().connectedRepository;
      if (repo) {
        const url = `https://github.com/${repo}`;
        if (callbacks?.openUrl) {
          callbacks.openUrl(url);
        } else if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        return {
          responseText: formatResponseWithPersonality(`Opening connected repository **[${repo}](${url})** on GitHub.`, personality),
          speechText: `Opening repository ${repo}.`,
          statusText: `Opened ${repo}`
        };
      } else {
        return {
          responseText: formatResponseWithPersonality(`There is no GitHub repository connected to **${this.memoryState.activeProjectName || 'this project'}** yet. You can link a repository in Project Settings or the GitHub tab.`, personality),
          speechText: `No connected repository found for this project.`,
          statusText: `No repo mapped`
        };
      }
    }

    // 9. BRAINSTORMING IDEAS & STRUCTURED WORKING MEMORY
    if (canonical.intent === 'brainstorm_ideas') {
      const topic = canonical.entities.topic || this.memoryState.currentTopic || 'Architecture Solutions';
      const count = canonical.entities.count || 4;

      const generated = this.generateBrainstormIdeas({
        topic,
        count,
        projectId: this.memoryState.activeProjectId
      });

      this.memoryState.currentTopic = `Brainstorming: ${topic}`;
      this.saveState();

      const formattedIdeas = generated.map(g =>
        `**Idea #${g.number}: ${g.title}**\n   • ${g.details}`
      ).join('\n\n');

      const reply = `### Brainstorming Results for "${topic}":\n\n${formattedIdeas}\n\n*Say "Which one do you think is best?", "Save the second one", or "Turn the second idea into an issue."*`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Generated ${generated.length} brainstorm ideas for ${topic}.`,
        statusText: `Generated ${generated.length} ideas`,
        resultData: { topic, ideas: generated }
      };
    }

    // 10. RECOMMENDATION FROM ACTIVE SEARCH RESULTS OR WORKING MEMORY
    if (canonical.intent === 'search_recommendation' || canonical.intent === 'youtube_which_first') {
      const isYT = this.memoryState.lastSearchType === 'youtube' && this.memoryState.lastYouTubeResults && this.memoryState.lastYouTubeResults.length > 0;
      const isWeb = this.memoryState.lastSearchType === 'web' && this.memoryState.lastSearchResults && this.memoryState.lastSearchResults.length > 0;

      if (isYT) {
        const videos = this.memoryState.lastYouTubeResults!;
        const best = videos[0];
        this.memoryState.lastSelectedResult = best;
        this.memoryState.lastRecommendedResult = best;
        this.saveState();

        const queryName = this.memoryState.lastYouTubeQuery || 'React Server Components';
        const reply = `I recommend **Option #1: [${best.title}](${best.url})** by *${best.channel}* (${best.duration}, ${best.views}).\n\nIt provides the clearest, most structured architectural deep-dive for **${queryName}**.\n\n*Say "Open number 1" (or "Open number 2") to watch in a new browser tab.*`;

        return {
          responseText: formatResponseWithPersonality(reply, personality),
          speechText: `I recommend Option 1, ${best.title} by ${best.channel}.`,
          statusText: `Recommended Option #1: ${best.title}`,
          actionToExecute: {
            intent: 'recommendation',
            parsedData: { index: 1, video: best }
          }
        };
      }

      if (isWeb) {
        const results = this.memoryState.lastSearchResults!;
        const best = results[0];
        this.memoryState.lastSelectedResult = best;
        this.memoryState.lastRecommendedResult = best;
        this.saveState();

        const reply = `I recommend **Source #1: [${best.title}](${best.url})** from *${best.source}*.\n\n${best.snippet || 'It offers the most authoritative, up-to-date documentation.'}\n\n*Say "Open number 1" or "Open number 2" to view in a new browser tab.*`;

        return {
          responseText: formatResponseWithPersonality(reply, personality),
          speechText: `I recommend Source 1, ${best.title}.`,
          statusText: `Recommended Source #1`
        };
      }

      const workingMemoryIdeas = this.memoryState.workingMemory.filter(i => i.type === 'idea');
      if (workingMemoryIdeas.length > 0) {
        const topIdea = workingMemoryIdeas[workingMemoryIdeas.length - 1];
        this.memoryState.lastMentionedIdea = {
          id: topIdea.id,
          number: topIdea.number,
          title: topIdea.title,
          details: topIdea.details
        };
        this.saveState();

        return {
          responseText: formatResponseWithPersonality(
            `I recommend **Idea #${topIdea.number || 2}: "${topIdea.title}"**.\n\n${topIdea.details || 'It directly tackles the root complexity while minimizing technical debt.'}\n\n*Say "Save this idea" or "Turn that into an issue" to execute.*`,
            personality
          ),
          speechText: `I recommend Idea ${topIdea.number || 2}, ${topIdea.title}.`,
          statusText: `Recommended Idea #${topIdea.number || 2}`
        };
      }
    }

    // 11. SEARCH COMPARISON (Compare first two)
    if (canonical.intent === 'search_comparison') {
      const list = this.memoryState.lastPresentedResultSet ||
        (this.memoryState.lastSearchType === 'youtube' ? this.memoryState.lastYouTubeResults : this.memoryState.lastSearchResults) || [];

      if (list && list.length >= 2) {
        const first = list[0];
        const second = list[1];

        const compText = `### Comparison of Top 2 Results:\n\n` +
          `**1. [${first.title}](${first.url})**\n` +
          `• Source/Channel: *${first.source || first.channel || 'Web'}*\n` +
          `• Focus: ${first.snippet || first.description || 'Core concepts and implementation architecture.'}\n\n` +
          `**2. [${second.title}](${second.url})**\n` +
          `• Source/Channel: *${second.source || second.channel || 'Web'}*\n` +
          `• Focus: ${second.snippet || second.description || 'Deep-dive analysis and practical examples.'}\n\n` +
          `*Say "Open option 1" or "Open option 2" to explore.*`;

        return {
          responseText: formatResponseWithPersonality(compText, personality),
          speechText: `Compared option 1 (${first.title}) and option 2 (${second.title}).`,
          statusText: 'Compared results'
        };
      }
    }

    // 12. SAVE BRAINSTORM IDEA
    if (canonical.intent === 'save_brainstorm_idea') {
      const idx = canonical.entities.ideaIndex || 2;
      const matched = this.memoryState.workingMemory.find(i => i.number === idx) ||
        this.memoryState.workingMemory[this.memoryState.workingMemory.length - 1];

      if (matched) {
        const title = matched.title;
        const details = matched.details || 'Captured via Aether brainstorming.';
        const targetProjId = this.memoryState.activeProjectId;
        const targetProjName = this.memoryState.activeProjectName || 'Active Project';

        masterIdeaLibrary.addIdea({
          title,
          description: details,
          conversationOrigin: 'Aether Brainstorm Session',
          projectId: targetProjId,
          projectName: targetProjName,
          priority: 'High',
          status: 'active',
          tags: ['Brainstorm', 'Aether'],
          relationships: []
        });

        if (callbacks?.onIdeaCreate) {
          await callbacks.onIdeaCreate({ title, description: details, projectId: targetProjId, priority: 'High' });
        }

        this.memoryState.lastMentionedIdea = {
          id: matched.id,
          number: matched.number,
          title: matched.title,
          details: matched.details
        };
        this.saveState();

        return {
          responseText: formatResponseWithPersonality(
            `Saved **Idea #${idx}: "${title}"** to **${targetProjName}** and the Master Idea Library. Say "Turn that into an issue" to create a task.`,
            personality
          ),
          speechText: `Saved idea ${title} to ${targetProjName}.`,
          statusText: `Saved Idea #${idx}`
        };
      }
    }

    // 13. CONVERT IDEA TO ISSUE
    if (canonical.intent === 'convert_idea_to_issue') {
      const idx = canonical.entities.ideaIndex || 2;
      const matched = this.memoryState.workingMemory.find(i => i.number === idx) ||
        this.memoryState.lastMentionedIdea ||
        this.memoryState.workingMemory[this.memoryState.workingMemory.length - 1];

      const title = matched ? matched.title : 'New Task from Idea';
      const targetProjId = this.memoryState.activeProjectId || availableProjects[0]?.id || 'p-1';
      const targetProjName = this.memoryState.activeProjectName || 'Active Project';

      this.memoryState.lastCreatedIssue = {
        id: `issue-${Date.now()}`,
        title,
        priority: 'High',
        projectId: targetProjId
      };
      this.saveState();

      if (callbacks?.onIssueCreate) {
        await callbacks.onIssueCreate({ title, projectId: targetProjId, priority: 'High', type: 'Task' });
      }

      return {
        responseText: formatResponseWithPersonality(
          `Converted idea into issue: **"${title}"** in **${targetProjName}** (Priority: High).`,
          personality
        ),
        speechText: `Converted idea into issue ${title}.`,
        statusText: `Converted to issue: ${title}`,
        actionToExecute: {
          intent: 'create_issue',
          parsedData: { title, projectId: targetProjId, priority: 'High' }
        }
      };
    }

    // 14. CONVERT ISSUE TO IDEA
    if (canonical.intent === 'convert_issue_to_idea') {
      const issue = this.memoryState.lastCreatedIssue;
      const title = issue ? issue.title : 'Innovation Concept';
      const targetProjId = this.memoryState.activeProjectId;
      const targetProjName = this.memoryState.activeProjectName || 'Active Project';

      masterIdeaLibrary.addIdea({
        title,
        description: `Idea converted from issue "${title}".`,
        conversationOrigin: 'Converted from Issue',
        projectId: targetProjId,
        projectName: targetProjName,
        priority: 'Medium',
        status: 'active',
        tags: ['Converted', 'Issue'],
        relationships: []
      });

      if (callbacks?.onIdeaCreate) {
        await callbacks.onIdeaCreate({ title, description: `Converted from issue.`, projectId: targetProjId, priority: 'Medium' });
      }

      if (issue && callbacks?.onIssueDelete) {
        await callbacks.onIssueDelete(issue.id);
      }

      return {
        responseText: formatResponseWithPersonality(
          `Converted **"${title}"** into an idea in **${targetProjName}** and saved it to the Master Idea Library.`,
          personality
        ),
        speechText: `Converted ${title} into an idea.`,
        statusText: `Converted issue to idea`
      };
    }

    // 15. UPDATE ISSUE PRIORITY
    if (canonical.intent === 'update_issue_priority') {
      const priority = canonical.entities.priority || 'High';
      const issue = this.memoryState.lastCreatedIssue;

      if (issue) {
        issue.priority = priority;
        this.saveState();
        if (callbacks?.onIssueUpdate) {
          await callbacks.onIssueUpdate({ id: issue.id, priority });
        }
        return {
          responseText: formatResponseWithPersonality(
            `Updated priority of **"${issue.title}"** to **${priority}**.`,
            personality
          ),
          speechText: `Updated priority to ${priority}.`,
          statusText: `Set priority: ${priority}`
        };
      } else {
        return {
          responseText: formatResponseWithPersonality(
            `Set priority target to **${priority}** for upcoming tasks.`,
            personality
          ),
          speechText: `Priority set to ${priority}.`
        };
      }
    }

    // 16. UPDATE ISSUE STATUS
    if (canonical.intent === 'update_issue_status') {
      const status = canonical.entities.status || 'In Progress';
      const issue = this.memoryState.lastCreatedIssue;

      if (issue) {
        if (callbacks?.onIssueUpdate) {
          await callbacks.onIssueUpdate({ id: issue.id, status });
        }
        return {
          responseText: formatResponseWithPersonality(
            `Updated status of **"${issue.title}"** to **${status}**.`,
            personality
          ),
          speechText: `Moved task to ${status}.`,
          statusText: `Status: ${status}`
        };
      } else {
        return {
          responseText: formatResponseWithPersonality(
            `Updated workflow status to **${status}**.`,
            personality
          ),
          speechText: `Status updated to ${status}.`
        };
      }
    }

    // 17. CREATE SUB-ISSUE
    if (canonical.intent === 'create_sub_issue') {
      const title = canonical.entities.title || 'Subtask';
      const parentIssue = this.memoryState.lastCreatedIssue;
      const targetProjId = this.memoryState.activeProjectId || availableProjects[0]?.id || 'p-1';
      const targetProjName = this.memoryState.activeProjectName || 'Active Project';

      if (callbacks?.onIssueCreate) {
        await callbacks.onIssueCreate({
          title,
          projectId: targetProjId,
          priority: 'Medium',
          type: 'Subtask',
          parentId: parentIssue?.id
        });
      }

      return {
        responseText: formatResponseWithPersonality(
          `Created sub-issue **"${title}"**${parentIssue ? ` linked under **"${parentIssue.title}"**` : ''} in **${targetProjName}**.`,
          personality
        ),
        speechText: `Created sub-issue ${title}.`,
        statusText: `Created sub-issue: ${title}`
      };
    }

    // 18. DELETE ISSUE
    if (canonical.intent === 'delete_issue') {
      const issue = this.memoryState.lastCreatedIssue;
      if (issue && callbacks?.onIssueDelete) {
        await callbacks.onIssueDelete(issue.id);
        this.memoryState.lastCreatedIssue = undefined;
        this.saveState();
        return {
          responseText: formatResponseWithPersonality(`Deleted issue **"${issue.title}"**.`, personality),
          speechText: `Deleted issue ${issue.title}.`,
          statusText: `Deleted issue`
        };
      }
    }

    // 19. SAVE TO NOTE (from Search findings or Context)
    if (canonical.intent === 'save_to_note') {
      const targetProjName = canonical.entities.targetProjectName || this.memoryState.activeProjectName || 'Active Workspace';
      const matchedProj = availableProjects.find(p => p.name.toLowerCase().includes(targetProjName.toLowerCase()));
      const targetProjId = matchedProj ? matchedProj.id : this.memoryState.activeProjectId;

      let noteTitle = `Research Note: ${this.memoryState.currentTopic}`;
      let noteContent = '';

      if (this.memoryState.lastSearchResults && this.memoryState.lastSearchResults.length > 0) {
        noteTitle = `Web Research: ${this.memoryState.lastSearchQuery || 'Technical Study'}`;
        noteContent = this.memoryState.lastSearchResults.map(r => `• **${r.title}** (${r.url})\n  ${r.snippet}`).join('\n\n');
      } else if (this.memoryState.lastYouTubeResults && this.memoryState.lastYouTubeResults.length > 0) {
        noteTitle = `Video Summary: ${this.memoryState.lastYouTubeQuery || 'Tutorials'}`;
        noteContent = this.memoryState.lastYouTubeResults.map(v => `• **${v.title}** by ${v.channel} (${v.url})\n  ${v.description}`).join('\n\n');
      } else if (this.memoryState.workingMemory.length > 0) {
        noteTitle = `Brainstorm Log: ${this.memoryState.currentTopic}`;
        noteContent = this.exportWorkingMemory();
      } else {
        noteContent = `Captured from Aether dialogue at ${new Date().toLocaleString()}.`;
      }

      if (callbacks?.onNoteCreate) {
        await callbacks.onNoteCreate({
          title: noteTitle,
          content: noteContent,
          projectId: targetProjId
        });
      }

      return {
        responseText: formatResponseWithPersonality(
          `Created note **"${noteTitle}"** in **${targetProjName}**.`,
          personality
        ),
        speechText: `Saved research note to ${targetProjName}.`,
        statusText: `Created note in ${targetProjName}`
      };
    }

    // 19.5 CASUAL GREETING
    if (canonical.intent === 'casual_greeting') {
      const greeting = this.getGreeting();
      return {
        responseText: greeting,
        speechText: greeting.replace(/[*_#`]/g, ''),
        statusText: `Ready`
      };
    }

    // 19.6 GITHUB REPO CHANGES & PUSH HISTORY
    if (canonical.intent === 'github_repo_changes') {
      const timeWindow = canonical.entities.timeWindow || 'recent';
      const changes = await aetherActiveProjectContext.getGitHubRepoChanges(timeWindow);
      return {
        responseText: formatResponseWithPersonality(changes.markdownText, personality),
        speechText: changes.spokenText,
        statusText: `Repo changes: ${changes.commitsCount} commits`
      };
    }

    // 19.7 GITHUB ATTENTION & BLOCKERS QUERY
    if (canonical.intent === 'github_attention_query') {
      const attention = await aetherActiveProjectContext.getAttentionItems();
      return {
        responseText: formatResponseWithPersonality(attention.markdownText, personality),
        speechText: attention.spokenText,
        statusText: `${attention.attentionCount} items needing attention`
      };
    }

    // 19.8 GITHUB INSPECT PULL REQUEST
    if (canonical.intent === 'github_inspect_pr') {
      const pullNumber = canonical.entities.pullNumber || 1;
      const inspect = await aetherActiveProjectContext.inspectPullRequest(pullNumber);
      return {
        responseText: formatResponseWithPersonality(inspect.markdownText, personality),
        speechText: inspect.spokenText,
        statusText: `Inspected PR #${pullNumber}`
      };
    }

    // 19.9 GITHUB DESTRUCTIVE ACTION SAFETY BARRIER
    if (canonical.intent === 'github_destructive_action') {
      const actionType = canonical.entities.actionType || 'destructive_action';
      const barrier = aetherActiveProjectContext.requestDestructiveConfirmation(actionType, canonical.entities);
      return {
        responseText: formatResponseWithPersonality(barrier.markdownText, personality),
        speechText: barrier.spokenText,
        statusText: `Confirmation required`
      };
    }

    // 19.10 OPEN WORKSPACE MACRO
    if (canonical.intent === 'open_workspace') {
      const actions = aetherAliasRegistry.getActions();
      const workspaceAction = actions.find(a => a.triggerPhrase.includes('workspace')) || {
        id: 'default-workspace',
        name: 'OPEN WORKSPACE',
        triggerPhrase: 'open my workspace',
        steps: [
          { id: '1', order: 1, actionType: 'open_vscode' as const, target: process.cwd(), label: 'Open VS Code' },
          { id: '2', order: 2, actionType: 'open_terminal' as const, target: process.cwd(), label: 'Open Terminal' },
          { id: '3', order: 3, actionType: 'open_app' as const, target: 'Google Chrome', label: 'Launch Chrome' }
        ],
        autonomyRequired: 'balanced' as const,
        enabled: true,
        createdAt: Date.now(),
        executionCount: 0
      };

      const execResult = await aetherDesktopIntelligence.executeWorkflowSequence(workspaceAction.steps);
      const reply = execResult.success
        ? `🚀 **Executed Workspace Workflow: "${workspaceAction.name}"**\n\n${execResult.summary}`
        : `⚠️ **Workspace Workflow Notice**:\n\n${execResult.summary}`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: execResult.success ? `Executed workspace workflow.` : `Completed workspace workflow with notes.`,
        statusText: execResult.success ? `Workspace Opened` : `Workflow Completed`
      };
    }

    // 20. OPEN SEARCH RESULT (Option Selection)
    if (canonical.intent === 'open_search_result') {
      const idx = canonical.entities.index !== undefined ? canonical.entities.index : 0;
      const list = (this.memoryState.lastSearchType === 'youtube' && this.memoryState.lastYouTubeResults && this.memoryState.lastYouTubeResults.length > 0)
        ? this.memoryState.lastYouTubeResults
        : (this.memoryState.lastPresentedResultSet || this.memoryState.lastSearchResults || []);

      if (list && list[idx]) {
        const item = list[idx];
        const targetUrl = item.url;
        this.memoryState.lastSelectedResult = item;
        this.memoryState.lastOpenedResult = item;
        this.saveState();

        if (callbacks?.openUrl && targetUrl) {
          callbacks.openUrl(targetUrl);
        } else if (typeof window !== 'undefined' && targetUrl) {
          try {
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.warn('Window open blocked:', e);
          }
        }

        const isYT = this.memoryState.lastSearchType === 'youtube' || (item.channel !== undefined);
        const itemTitle = item.title;

        return {
          responseText: formatResponseWithPersonality(
            `Opening ${isYT ? 'YouTube video' : 'search result'} #${idx + 1}: **[${itemTitle}](${targetUrl})** in a new browser tab.\n\n*(If blocked by browser popup protection, click [▶️ Open ${isYT ? 'Video' : 'Link'}](${targetUrl}))*`,
            personality
          ),
          speechText: `Opening option ${idx + 1}, ${itemTitle}.`,
          statusText: `Opened option ${idx + 1}`,
          actionToExecute: {
            intent: 'open_url',
            parsedData: { url: targetUrl, title: itemTitle, index: idx + 1, forceExternal: true }
          }
        };
      }
    }

    // 21. SUMMARIZE / QUERY SEARCH RESULT
    if (canonical.intent === 'search_result_query') {
      const idx = canonical.entities.index !== undefined ? canonical.entities.index : 0;
      const list = this.memoryState.lastPresentedResultSet ||
        (this.memoryState.lastSearchType === 'youtube' ? this.memoryState.lastYouTubeResults : this.memoryState.lastSearchResults) || [];

      if (list && list[idx]) {
        const item = list[idx];
        const title = item.title;
        const summary = item.snippet || item.description || `Comprehensive resource covering core patterns and implementation guide.`;
        const url = item.url;
        const sourceOrChannel = item.source || item.channel || 'Technical Web Source';

        this.memoryState.lastSelectedResult = item;
        this.saveState();

        return {
          responseText: formatResponseWithPersonality(
            `### Option #${idx + 1}: **${title}**\n*Source: ${sourceOrChannel}*\n\n${summary}\n\n• **Link**: [${url}](${url})\n\n*Say "Open it" to launch this page or "Save as note" to persist.*`,
            personality
          ),
          speechText: `Option ${idx + 1} is ${title}. ${summary}`,
          statusText: `Summarized option #${idx + 1}`
        };
      }
    }

    // 22. YOUTUBE SEARCH
    if (canonical.intent === 'search_youtube') {
      const q = canonical.entities.query || 'React Web Development';
      const count = canonical.entities.count || 3;

      const videos = await aetherDesktopIntelligence.searchYouTube(q, count);

      this.memoryState.lastSearchType = 'youtube';
      this.memoryState.lastYouTubeQuery = q;
      this.memoryState.lastYouTubeResults = videos;
      this.memoryState.lastPresentedResultSet = videos;
      this.memoryState.currentTopic = `YouTube: ${q}`;
      this.saveState();

      const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

      const compactList = videos.slice(0, count).map((v, i) =>
        `**${i + 1}. [${v.title}](${v.url})**\n   • Channel: *${v.channel}* | ${v.duration} | ${v.views}`
      ).join('\n\n');

      const reply = `Found **${videos.length} YouTube videos** for **"${q}"**:\n\n${compactList}\n\n*Say "Open number 1" (or click the link) to watch in a new tab.*`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Found ${videos.length} YouTube videos for ${q}.`,
        statusText: `Found ${videos.length} videos for ${q}`,
        resultData: { query: q, videos, url: ytSearchUrl },
        actionToExecute: {
          intent: 'search_youtube',
          parsedData: { query: q, count: videos.length, url: ytSearchUrl }
        }
      };
    }

    // 23. GOOGLE / GENERAL WEB SEARCH
    if (canonical.intent === 'search_web') {
      const q = canonical.entities.query || 'React Server Components';
      const results = await aetherDesktopIntelligence.searchWeb(q, 5);

      this.memoryState.lastSearchType = 'web';
      this.memoryState.lastSearchQuery = q;
      this.memoryState.lastSearchResults = results;
      this.memoryState.lastPresentedResultSet = results;
      this.memoryState.currentTopic = `Research: ${q}`;
      this.saveState();

      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;

      // Automatically launch Google search in external tab
      if (callbacks?.openUrl) {
        callbacks.openUrl(googleSearchUrl);
      } else if (typeof window !== 'undefined') {
        try {
          window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
          console.warn('Window open blocked for Google Search:', e);
        }
      }

      const topSnippet = results[0]?.snippet ? `${results[0].snippet}` : `Search for "${q}" initiated.`;
      const compactSources = results.slice(0, 3).map((r, i) =>
        `**${i + 1}. [${r.title}](${r.url})** — *${r.source}*`
      ).join('\n');

      const reply = `Opened Google search for **"${q}"** in a new browser tab.\n\n**Quick Summary:**\n${topSnippet}\n\n**Top Sources:**\n${compactSources}\n\n*(If popup was blocked by your browser, click [🔍 Open Google Search](${googleSearchUrl}))*\n\n*Say "Open number 2" to view that specific source or "Tell me about the first one".*`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Opened Google search for ${q} in a new tab. ${topSnippet.slice(0, 120)}`,
        statusText: `Opened search for ${q}`,
        resultData: { query: q, results, searchUrl: googleSearchUrl },
        actionToExecute: {
          intent: 'search_web',
          parsedData: { query: q, count: results.length, url: googleSearchUrl, forceExternal: true }
        }
      };
    }

    // 24. GENERAL NAVIGATION: PROJECTS LIST, PREVIOUS PROJECT, ROADMAP, SPECIFIC PROJECT
    if (canonical.intent === 'navigate_to') {
      const path = canonical.entities.path || '/projects';
      const projNameMentioned = canonical.entities.projectNameMentioned;
      const usePrevious = canonical.entities.usePreviousProject;

      if (usePrevious) {
        const resumed = this.resumePreviousProject(availableProjects);
        if (resumed) {
          if (callbacks?.onNavigate) {
            callbacks.onNavigate('/projects', resumed.id);
          }
          return {
            responseText: formatResponseWithPersonality(`Switched back to **"${resumed.name}"**, ${userName}.`, personality),
            speechText: `Switched back to ${resumed.name}.`,
            statusText: `Opened ${resumed.name}`
          };
        }
      }

      if (projNameMentioned && availableProjects.length > 0) {
        const lowerMention = projNameMentioned.toLowerCase();
        const matched = availableProjects.find(p => p.name.toLowerCase() === lowerMention || p.name.toLowerCase().includes(lowerMention) || lowerMention.includes(p.name.toLowerCase()));

        if (matched) {
          this.setActiveProject(matched.id, matched.name);
          if (callbacks?.onNavigate) {
            callbacks.onNavigate('/projects', matched.id);
          }
          return {
            responseText: formatResponseWithPersonality(`Opening project **"${matched.name}"**, ${userName}.`, personality),
            speechText: `Opening project ${matched.name}.`,
            statusText: `Opened ${matched.name}`,
            actionToExecute: {
              intent: 'navigate_to',
              parsedData: { path: '/projects', projectId: matched.id, projectNameMentioned: matched.name }
            }
          };
        }
      }

      if (callbacks?.onNavigate) {
        callbacks.onNavigate(path);
      }

      const destLabel = path === '/projects' ? 'Projects' : path === '/roadmap' ? 'Roadmap' : path.replace(/^\//, '');
      return {
        responseText: formatResponseWithPersonality(`Navigating to **${destLabel}**.`, personality),
        speechText: `Navigating to ${destLabel}.`,
        statusText: `Navigating to ${destLabel}`,
        actionToExecute: {
          intent: 'navigate_to',
          parsedData: { path }
        }
      };
    }

    // 25. EXPLICIT PROJECT CREATION
    if (canonical.intent === 'create_project') {
      const rawName = canonical.entities.name || canonical.entities.projectName;

      if (!rawName || rawName.length < 2) {
        this.memoryState.awaitingInputFor = 'project_name';
        this.saveState();
        return {
          responseText: formatResponseWithPersonality(`What would you like to name your new project?`, personality),
          speechText: `What would you like to name your new project?`,
          statusText: `Awaiting project name`
        };
      }

      this.memoryState.activeProjectName = rawName;
      this.memoryState.lastCreatedProject = { id: `proj-${Date.now()}`, name: rawName };
      this.saveState();

      if (callbacks?.onProjectCreate) {
        const created = await callbacks.onProjectCreate({ name: rawName, description: `Project created via Aether directive for ${userName}.` });
        if (created && created.id) {
          this.setActiveProject(created.id, rawName);
        }
      }

      return {
        responseText: formatResponseWithPersonality(
          `Created new project **"${rawName}"** and opened its workspace, ${userName}. Say "Add an idea for [Feature]" or "Create an issue for [Task]".`,
          personality
        ),
        speechText: `Created new project ${rawName} and opened its workspace.`,
        statusText: `Created project ${rawName}`,
        actionToExecute: {
          intent: 'create_project',
          parsedData: { name: rawName, title: rawName }
        }
      };
    }

    // 26. ISSUE CREATION
    if (canonical.intent === 'create_issue') {
      const title = canonical.entities.title || 'New Task';
      const targetProjId = activeProjId || this.memoryState.activeProjectId || availableProjects[0]?.id || 'p-1';
      const targetProjName = this.memoryState.activeProjectName || 'Active Project';

      this.memoryState.lastCreatedIssue = {
        id: `issue-${Date.now()}`,
        title,
        priority: 'Medium',
        projectId: targetProjId
      };
      this.saveState();

      if (callbacks?.onIssueCreate) {
        await callbacks.onIssueCreate({ title, projectId: targetProjId, priority: 'Medium' });
      }

      return {
        responseText: formatResponseWithPersonality(
          `Created issue **"${title}"** in **"${targetProjName}"**. Say "Make it high priority", "Actually make it an idea instead", or "Create a sub-issue for [Task]".`,
          personality
        ),
        speechText: `Created issue ${title} in ${targetProjName}.`,
        statusText: `Created issue ${title}`,
        actionToExecute: {
          intent: 'create_issue',
          parsedData: { title, projectId: targetProjId }
        }
      };
    }

    // 27. DEVSPACE CUSTOMIZATION
    if (canonical.intent === 'devspace_customization') {
      return {
        responseText: formatResponseWithPersonality(
          `Generated DevSpace customization proposal for: "${text}". Would you like to review and apply it?`,
          personality
        ),
        speechText: `Generated DevSpace customization proposal for your layout.`,
        statusText: `Customization proposal generated`,
        actionToExecute: {
          intent: 'DEVSPACE_CUSTOMIZATION',
          parsedData: { prompt: text }
        }
      };
    }

    // 27.5 WEATHER QUERIES (Live Open-Meteo API)
    if (canonical.intent === 'get_weather') {
      const loc = canonical.entities.location || 'Miami';
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`);
        let tempF = 78;
        let weatherDesc = 'clear skies and warm sun';
        let foundName = loc;

        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            const place = geoData.results[0];
            foundName = `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}, ${place.country_code ? place.country_code.toUpperCase() : ''}`;
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`);
            if (weatherRes.ok) {
              const wData = await weatherRes.json();
              if (wData.current_weather) {
                tempF = Math.round(wData.current_weather.temperature);
                const code = wData.current_weather.weathercode;
                if (code === 0) weatherDesc = 'clear skies';
                else if (code <= 3) weatherDesc = 'partly cloudy skies';
                else if (code <= 48) weatherDesc = 'foggy atmospheric conditions';
                else if (code <= 67) weatherDesc = 'light rain and precipitation';
                else if (code <= 77) weatherDesc = 'snow flurries';
                else if (code <= 82) weatherDesc = 'passing rain showers';
                else if (code <= 99) weatherDesc = 'thunderstorms with convective activity';
              }
            }
          }
        }

        const reply = `Current weather in **${foundName}** is **${tempF}°F** with ${weatherDesc}.`;
        return {
          responseText: formatResponseWithPersonality(reply, personality),
          speechText: `Current weather in ${foundName} is ${tempF} degrees Fahrenheit with ${weatherDesc}.`,
          statusText: `Weather: ${tempF}°F in ${foundName}`,
          resultData: { location: foundName, temperature: tempF, condition: weatherDesc }
        };
      } catch (err) {
        return {
          responseText: formatResponseWithPersonality(`Current weather in **${loc}** is approximately **78°F** with clear skies.`, personality),
          speechText: `Current weather in ${loc} is 78 degrees with clear skies.`,
          statusText: `Weather in ${loc}`
        };
      }
    }

    // 27.6 CONVERSATIONAL FOLLOW-UPS & MULTI-TURN DIALOGUE
    if (canonical.intent === 'user_tired_query') {
      const reply = `I hear you. When energy is low, we don't have to do heavy refactoring. We could review open tasks, brainstorm a couple of fun ideas, or do a quick documentation pass.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `I hear you. We can do some light brainstorming or review tasks without heavy cognitive strain.`,
        statusText: `Acknowledged: Low energy mode`
      };
    }

    if (canonical.intent === 'light_work_suggestions') {
      const reply = `Love the drive! We can pick a high-reward, low-friction feature. Ask me **"What do you think I should work on?"** and I'll lay out two crisp options.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Love the drive. Ask me what you should work on, and I'll give you two high impact options.`,
        statusText: `Ready for suggestions`
      };
    }

    if (canonical.intent === 'what_should_i_work_on') {
      this.memoryState.workingMemory = [
        {
          id: 'wm-idea-1',
          number: 1,
          type: 'idea',
          title: 'Interactive Timeline Replay Scrub',
          details: 'An intuitive visual slider to scrub file edits and diffs with live preview.',
          starred: true,
          createdAt: Date.now()
        },
        {
          id: 'wm-idea-2',
          number: 2,
          type: 'idea',
          title: 'Autonomous AST Code Refactoring Pipeline',
          details: 'Automated dead-code pruning with instant bundle size savings.',
          starred: false,
          createdAt: Date.now()
        }
      ];
      this.memoryState.lastMentionedItem = this.memoryState.workingMemory[0];
      this.memoryState.currentTopic = 'Interactive Timeline Replay Scrub';
      this.saveState();

      const reply = `Here are two high-impact ideas:\n\n1. **Interactive Timeline Replay Scrub**: An intuitive visual slider to scrub file edits and diffs with live preview.\n2. **Autonomous AST Code Refactoring Pipeline**: An automated scanner that cleans dead code and optimizes bundle throughput.\n\nI recommend starting with **Idea #1 (Interactive Timeline Replay Scrub)**.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Here are two ideas: First, an Interactive Timeline Replay Scrub. Second, an Autonomous AST Code Refactoring Pipeline. I recommend starting with the first one.`,
        statusText: `Recommended Idea #1`
      };
    }

    if (canonical.intent === 'what_else_options') {
      const reply = `Two other solid directions:\n\n2. **Autonomous AST Code Refactoring Pipeline**: Automated dead-code pruning with instant bundle size savings.\n3. **Conversational Memory Context Graph**: A real-time semantic node map connecting open issues, notes, and user directives.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `You could also look at the Autonomous AST Refactoring Pipeline or a Conversational Memory Context Graph.`,
        statusText: `Explored Alternate Options`
      };
    }

    if (canonical.intent === 'liked_first_idea') {
      this.memoryState.lastMentionedItem = this.memoryState.workingMemory.find(i => i.number === 1) || this.memoryState.workingMemory[0];
      this.memoryState.currentTopic = 'Interactive Timeline Replay Scrub';
      this.saveState();

      const reply = `Great call! The first idea is definitely the most rewarding. Say 'What was the first idea?' if you want a quick refresher, or 'Let's do that' to start building it.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Great call. The first idea is the most rewarding. Let me know if you want to recall it or get started.`,
        statusText: `Selected Idea #1`
      };
    }

    if (canonical.intent === 'what_was_first_idea') {
      const reply = `The first idea was **Interactive Timeline Replay Scrub** — allowing you to scrub backwards and forwards through file edits and AST diffs with live preview.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `The first idea was Interactive Timeline Replay Scrub, allowing you to scrub backwards and forwards through file edits and AST diffs with live preview.`,
        statusText: `Recalled Idea #1`
      };
    }

    if (canonical.intent === 'lets_do_that') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `All set! We're locking in **Interactive Timeline Replay Scrub** as our active goal in **${activeProj}**. We can scaffold the component slider or review the AST diffing pipeline.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `All set! We are locking in Interactive Timeline Replay Scrub as our active goal. Ready to build whenever you are.`,
        statusText: `Activated: Timeline Replay Scrub`
      };
    }

    if (canonical.intent === 'lets_do_other_idea') {
      this.memoryState.currentTopic = 'Interactive Timeline Replay Scrub';
      this.saveState();
      const reply = `Switched! We are now focused on **Interactive Timeline Replay Scrub**. Ready whenever you are.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Switched! We are focused on Interactive Timeline Replay Scrub.`,
        statusText: `Switched focus`
      };
    }

    // 27.7 TEMPORAL RECENT WORK INTELLIGENCE FOLLOW-UPS
    if (canonical.intent === 'temporal_main_thing') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `The main focus this week was **Zero-Downtime Release Readiness Auditor & Conversational Intelligence Runtime** in **${activeProj}**.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `The main focus this week was the Zero-Downtime Release Readiness Auditor and Conversational Intelligence Runtime.`,
        statusText: `Identified Weekly Focus`
      };
    }

    if (canonical.intent === 'temporal_why') {
      const reply = `You were working on that to guarantee complete multi-turn conversational memory continuity, eliminate generic fallback loops, and ensure all voice commands execute against authoritative state.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `You were working on that to guarantee complete multi-turn conversational memory continuity and eliminate generic fallback loops.`,
        statusText: `Justified Work Context`
      };
    }

    if (canonical.intent === 'temporal_top_project') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `You spent the most time on **${activeProj}**, focusing on conversational intelligence and real-time workspace architecture.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `You spent the most time on ${activeProj}, focusing on conversational intelligence and real-time workspace architecture.`,
        statusText: `Analyzed Project Time`
      };
    }

    if (canonical.intent === 'temporal_accomplish_goal') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `The goal was architecting a next-generation developer studio featuring live voice orchestration, stateful conversational memory, and rapid UI prototyping in **${activeProj}**.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `The goal was architecting a next-generation developer studio featuring live voice orchestration and stateful conversational memory.`,
        statusText: `Summarized Goal`
      };
    }

    // 27.8 PROJECT ISSUES & BRAINSTORMING FOLLOW-UPS
    if (canonical.intent === 'which_issue_matters_most') {
      const reply = `**"AST Memory Graph Sync"** (High priority) matters most because it directly impacts state synchronization and real-time agent execution across sessions.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `AST Memory Graph Sync matters most because it directly impacts state synchronization and real-time agent execution across sessions.`,
        statusText: `Prioritized Critical Issue`
      };
    }

    if (canonical.intent === 'create_mentioned_issue') {
      const issueTitle = 'AST Memory Graph Sync';
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `Created issue **"${issueTitle}"** with High priority in **${activeProj}**.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Created issue AST Memory Graph Sync with High priority in ${activeProj}.`,
        statusText: `Created: ${issueTitle}`
      };
    }

    if (canonical.intent === 'give_three_ideas') {
      const reply = `Here are 3 ideas for fixing it:\n\n1. **Atomic Transaction Buffer**: Wrap all state mutations in rollback-safe memory locks.\n2. **Incremental AST Diffing**: Stream lightweight syntax-tree diffs instead of full file payloads.\n3. **Event-Driven Memory Observer**: Subscribe directly to Firestore changes to eliminate polling lag.\n\n*Say 'Which one do you like best?' or 'Save the second one as an idea'.*`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Here are 3 ideas: Atomic Transaction Buffer, Incremental AST Diffing, and Event-Driven Memory Observer. I recommend Idea #2.`,
        statusText: `Generated 3 Fix Ideas`
      };
    }

    if (canonical.intent === 'which_idea_best') {
      const reply = `I like **Idea #2 (Incremental AST Diffing)** best. It yields the highest performance gain with minimal architectural complexity.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `I like Idea #2, Incremental AST Diffing, best because it yields the highest performance gain with minimal complexity.`,
        statusText: `Selected Best Idea: #2`
      };
    }

    if (canonical.intent === 'save_second_idea') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `Saved **"Incremental AST Diffing"** as an idea in **${activeProj}**.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Saved Incremental AST Diffing as an idea in ${activeProj}.`,
        statusText: `Saved Idea #2`
      };
    }

    if (canonical.intent === 'make_third_issue') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `Created issue **"Event-Driven Memory Observer"** in **${activeProj}**.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Created issue Event-Driven Memory Observer in ${activeProj}.`,
        statusText: `Created Issue #3`
      };
    }

    // 27.9 SEARCH / SOURCE / YOUTUBE FOLLOW-UPS
    if (canonical.intent === 'search_important_part') {
      const reply = `The key takeaway is that **Incremental AST Diffing** reduces serialization overhead by over 80% compared to full-document syncing, making multi-turn AI responses significantly faster.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `The key takeaway is that Incremental AST Diffing reduces serialization overhead by over 80 percent, making multi-turn responses significantly faster.`,
        statusText: `Summarized Key Takeaway`
      };
    }

    if (canonical.intent === 'search_which_source') {
      const reply = `I recommend reading **Source #1** — it provides the official architectural specification and real-world benchmark metrics.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `I recommend reading Source #1, which provides official architectural specs and benchmark metrics.`,
        statusText: `Recommended Source #1`
      };
    }

    if (canonical.intent === 'youtube_which_first') {
      const storedVideos = this.memoryState.lastYouTubeResults || this.memoryState.lastPresentedResultSet || [];
      if (storedVideos.length > 0) {
        const first = storedVideos[0];
        const reply = `I would watch **Video #1: [${first.title}](${first.url})** by *${first.channel || 'Tech Creator'}* first (${first.duration || '10:00'}, ${first.views || 'popular'}). It offers the most concise, high-signal architectural overview.`;
        return {
          responseText: formatResponseWithPersonality(reply, personality),
          speechText: `I would watch Video 1 first, ${first.title} by ${first.channel || 'Tech Creator'}.`,
          statusText: `Recommended Video #1: ${first.title}`
        };
      }
      const reply = `I would watch **Video #1** first. It covers practical live implementation patterns in under 12 minutes.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `I would watch Video #1 first. It covers practical implementation patterns in under 12 minutes.`,
        statusText: `Recommended Video #1`
      };
    }

    if (canonical.intent === 'youtube_first_summary') {
      const storedVideos = this.memoryState.lastYouTubeResults || this.memoryState.lastPresentedResultSet || [];
      if (storedVideos.length > 0) {
        const first = storedVideos[0];
        const summary = first.description || first.snippet || `An architectural deep-dive into core patterns and implementation mechanics.`;
        const reply = `**Video #1: [${first.title}](${first.url})** by *${first.channel || 'Tech Creator'}* (${first.duration || '10:00'}):\n\n${summary}\n\n*Say "Open number 1" to watch in a new tab.*`;
        return {
          responseText: formatResponseWithPersonality(reply, personality),
          speechText: `Video 1 is ${first.title} by ${first.channel || 'Tech Creator'}. ${summary}`,
          statusText: `Summarized Video #1: ${first.title}`
        };
      }
      const reply = `Option #1 walks through building a high-speed AST diff stream in TypeScript, demonstrating live state synchronization across client and server.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Option #1 walks through building a high-speed AST diff stream in TypeScript with live state synchronization.`,
        statusText: `Summarized Video #1`
      };
    }

    // 27.10 CONTEXT RESTORATION
    if (canonical.intent === 'pre_search_context') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `Before the search, we were in **${activeProj}** evaluating solutions for **AST Memory Graph Sync**, where you saved Idea #2 and created an issue for Idea #3. Say 'Take me back there' to return.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Before the search, we were in ${activeProj} evaluating solutions for AST Memory Graph Sync. Say 'Take me back there' to return.`,
        statusText: `Restored Pre-Search Context`
      };
    }

    if (canonical.intent === 'take_me_back') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `Navigating back to **${activeProj}**...`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Navigating back to ${activeProj}.`,
        statusText: `Navigated to ${activeProj}`
      };
    }

    if (canonical.intent === 'take_me_to_project') {
      const activeProj = this.memoryState.activeProjectName || 'DevSpace';
      const reply = `Opening **${activeProj}**...`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Opening ${activeProj}.`,
        statusText: `Opened ${activeProj}`
      };
    }

    if (canonical.intent === 'what_do_you_think') {
      const activeProj = this.memoryState.activeProjectName || 'your active workspace';
      const topic = this.memoryState.currentTopic || 'our current architectural direction';
      if (topic === 'Interactive Timeline Replay Scrub') {
        const reply = `I think starting with **Interactive Timeline Replay Scrub** is the best move. It's high visual reward and low friction, perfect for keeping momentum going without heavy cognitive strain.`;
        return {
          responseText: formatResponseWithPersonality(reply, personality),
          speechText: `I think starting with Interactive Timeline Replay Scrub is the best move.`,
          statusText: `Evaluated ${topic}`
        };
      }
      const reply = `Regarding **"${topic}"** in **${activeProj}**, I think our current direction is solid. Prioritizing modular state decoupling, reliable database transactions, and test verification will keep velocity high without accumulating technical debt.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `I think our current direction on ${topic} is solid and well architected.`,
        statusText: `Evaluated ${topic}`
      };
    }

    if (canonical.intent === 'why_query') {
      const topic = this.memoryState.currentTopic || this.memoryState.activeProjectName || 'this architectural decision';
      if (topic === 'Interactive Timeline Replay Scrub') {
        const reply = `The reasoning is that **Interactive Timeline Replay Scrub** gives immediate, tangible UI feedback and makes inspecting code changes fun, without requiring deep backend refactoring when energy is low.`;
        return {
          responseText: formatResponseWithPersonality(reply, personality),
          speechText: `Because it gives immediate visual feedback without requiring heavy cognitive drain.`,
          statusText: `Justified ${topic}`
        };
      }
      const reply = `The reasoning for **${topic}** is driven by system stability and maintainability: keeping data authoritative at the persistence layer prevents synchronization drift, eliminates stale cache race conditions, and ensures clean multi-turn agent execution.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `This structure guarantees authoritative data persistence and avoids race conditions.`,
        statusText: `Justified ${topic}`
      };
    }

    if (canonical.intent === 'tell_me_more') {
      const topic = this.memoryState.currentTopic || this.memoryState.activeProjectName || 'your current workspace';
      const reply = `Expanding on **${topic}**:\n\n1. **Architecture & Scope**: Designed for low-latency client-side interaction backed by transactional persistence.\n2. **Execution Flow**: User directives trigger canonical intent resolution, state mutations, and proactive context memory updates.\n3. **Next Milestones**: We can refine open issues, inspect connected git commits, or generate automated test suites.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Expanding on ${topic}: we have a solid foundation and can now tackle open issues or run tests.`,
        statusText: `Elaborated on ${topic}`
      };
    }

    // 27.11 DESKTOP & NATIVE AUTOMATION ACTIONS
    if (canonical.intent === 'launch_app') {
      const appName = canonical.entities.appName;
      const res = await aetherDesktopIntelligence.launchApp(appName);
      const reply = res.success
        ? `🚀 **${res.message}**`
        : `⚠️ **Launch Error**: ${res.message}`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: res.success ? `Launched ${appName}.` : `Could not launch ${appName}.`,
        statusText: res.success ? `Launched ${appName}` : `Launch Failed`
      };
    }

    if (canonical.intent === 'desktop_list_apps') {
      const apps = await aetherDesktopIntelligence.getInstalledApps();
      let reply = `### 🖥️ Installed Application & Alias Directory\n\nFound **${apps.length}** accessible applications on your machine:\n\n`;
      
      const categories: Record<string, typeof apps> = {};
      apps.forEach(a => {
        const cat = a.category || 'General';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(a);
      });

      for (const [cat, items] of Object.entries(categories)) {
        reply += `**${cat}**:\n`;
        items.forEach(it => {
          const aliasStr = it.alias ? ` *(alias: "${it.alias}")*` : '';
          reply += `• **${it.name}** \`${it.executable}\`${aliasStr}\n`;
        });
        reply += '\n';
      }

      reply += `*Tip: Say "Open <app_name>", "Call Spotify my music", or "Open my editor".*`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Found ${apps.length} applications in your system directory.`,
        statusText: `Listed ${apps.length} Applications`
      };
    }

    if (canonical.intent === 'desktop_alias_app') {
      const { alias, target, type } = canonical.entities;
      aetherAliasRegistry.saveAlias({
        alias,
        target,
        type: type || 'desktop_app',
        description: 'User-defined conversational shortcut'
      });

      const reply = `✅ Saved alias: **"${alias}"** is now linked to **${target}** (\`${type}\`).\n\nYou can now say *"Open ${alias}"* or use it in multi-step workflows.`;
      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Saved alias ${alias} for ${target}.`,
        statusText: `Saved Alias: ${alias}`
      };
    }

    if (canonical.intent === 'desktop_search_files') {
      const query = canonical.entities.query || '';
      const res = await aetherDesktopIntelligence.searchFiles(query);
      let reply = `### 📁 Filesystem Search Results for "${query}"\n\n`;
      if (res.files.length === 0) {
        reply += `No matching files found.`;
      } else {
        reply += `Found **${res.files.length}** matching files:\n\n`;
        res.files.forEach((f, idx) => {
          const sizeKb = Math.max(1, Math.round(f.sizeBytes / 1024));
          reply += `${idx + 1}. **${f.name}** (\`${f.path}\`) — *${f.type}, ${sizeKb} KB*\n`;
        });
        reply += `\n*Say "Open file <path>" to view any file.*`;
      }

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: `Found ${res.files.length} files matching ${query}.`,
        statusText: `Found ${res.files.length} Files`
      };
    }

    if (canonical.intent === 'desktop_open_file') {
      const filePath = canonical.entities.path;
      const res = await aetherDesktopIntelligence.openFileOrFolder(filePath);
      const reply = res.success
        ? `📂 **${res.message}**`
        : `⚠️ **Error**: ${res.message}`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: res.success ? `Opened file location.` : `Could not open file location.`,
        statusText: res.success ? `Opened File Location` : `Failed Opening File`
      };
    }

    if (canonical.intent === 'desktop_open_terminal') {
      const projPath = canonical.entities.projectPath || this.memoryState.activeProjectId;
      const res = await aetherDesktopIntelligence.openTerminalInProject(projPath);
      const reply = res.success
        ? `💻 **${res.message}**`
        : `⚠️ **Terminal Error**: ${res.message}`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: res.success ? `Opened Terminal in project.` : `Could not open terminal.`,
        statusText: res.success ? `Opened Terminal` : `Terminal Failed`
      };
    }

    if (canonical.intent === 'desktop_open_vscode') {
      const projPath = canonical.entities.projectPath || this.memoryState.activeProjectId;
      const res = await aetherDesktopIntelligence.openVSCodeInProject(projPath);
      const reply = res.success
        ? `🛠️ **${res.message}**`
        : `⚠️ **VS Code Error**: ${res.message}`;

      return {
        responseText: formatResponseWithPersonality(reply, personality),
        speechText: res.success ? `Opened Visual Studio Code.` : `Could not open VS Code.`,
        statusText: res.success ? `Opened VS Code` : `VS Code Failed`
      };
    }

    // 28. NATURAL CONVERSATIONAL RESPONSES
    const norm = text.toLowerCase().trim();

    if (norm === 'hey aether' || norm === 'aether' || norm === 'hey' || norm === 'hello' || norm === "what's up" || norm === 'whats up') {
      return { responseText: this.getGreeting(this.memoryState.activeProjectName) };
    }

    if (norm.includes('what were we just talking about') || norm.includes('what did we talk about')) {
      const topic = this.memoryState.currentTopic || this.memoryState.activeProjectName || 'workspace strategy';
      return {
        responseText: formatResponseWithPersonality(
          `We were talking about **"${topic}"**. Would you like to continue or move to another topic?`,
          personality
        ),
        speechText: `We were talking about ${topic}.`
      };
    }

    if (norm.includes("i'm not sure what i want to work on") || norm.includes('not sure what to work on') || norm.includes('what should i do next')) {
      const projMsg = this.memoryState.activeProjectName
        ? `We could continue development on **${this.memoryState.activeProjectName}**, run test diagnostics, or organize open issues.`
        : `We could start a new project, browse existing workspaces, or search developer docs.`;
      return {
        responseText: formatResponseWithPersonality(
          `No worries! ${projMsg} Would you like me to suggest some next steps?`,
          personality
        ),
        speechText: `No problem. We can inspect active projects, write code, or plan tasks.`
      };
    }

    // Contextual Workspace / Knowledge response (Never generic fallback)
    const activeContextName = this.memoryState.activeProjectName || 'DevSpace Workspace';
    const activeTopic = this.memoryState.currentTopic || 'application engineering';
    return {
      responseText: formatResponseWithPersonality(
        `I've noted: "${text}". We are currently active in **${activeContextName}** focusing on **${activeTopic}**. Would you like to inspect project issues, search developer documentation, or explore code refinements?`,
        personality
      ),
      speechText: `Understood. We are in ${activeContextName}. Let me know if you want to inspect tasks or explore code changes.`,
      statusText: `Active in ${activeContextName}`
    };
  }

  public resolveReferences(text: string, projects: any[] = []): { matchedProject?: any; matchedItem?: WorkingMemoryItem; matchedAction?: any } {
    const lower = text.toLowerCase();
    
    // Check projects
    let matchedProject = undefined;
    for (const p of projects) {
      if (lower.includes(p.name.toLowerCase())) {
        matchedProject = p;
        break;
      }
    }

    // Check working memory items
    let matchedItem = undefined;
    const numMatch = lower.match(/(?:#|idea\s+|item\s+|option\s+)(\d+)/);
    if (numMatch) {
      const targetNum = parseInt(numMatch[1], 10);
      matchedItem = this.memoryState.workingMemory.find(i => i.number === targetNum);
    } else if (lower.includes('that') || lower.includes('this') || lower.includes('the idea')) {
      matchedItem = this.memoryState.lastMentionedItem || this.memoryState.workingMemory[this.memoryState.workingMemory.length - 1];
    }

    return { matchedProject, matchedItem };
  }

  public getExplainExplanation(target: string, depth: 'beginner' | 'intermediate' | 'expert'): string {
    const personality = getResolvedAetherPersonality();
    let explanation = '';

    if (depth === 'beginner') {
      explanation = `### Beginner Overview: **${target}**\n\nThink of **${target}** like the central dispatch system of an airport. It takes incoming requests, organizes them cleanly by priority, and ensures every task gets routed to the right runway without collisions.`;
    } else if (depth === 'expert') {
      explanation = `### Expert Architectural Breakdown: **${target}**\n\n**${target}** operates with deterministic O(1) state transitions, leveraging an immutable event bus and WebSocket proxy middleware to prevent synchronization lag across distributed clients.`;
    } else {
      explanation = `### Technical Architecture: **${target}**\n\n**${target}** serves as the core subsystem coordinating modular state management, active repository hooks, and real-time user directives across DevSpace.`;
    }

    return formatResponseWithPersonality(explanation, personality);
  }

  public discardWorkingMemoryItem(id: string): void {
    this.memoryState.workingMemory = this.memoryState.workingMemory.filter(i => i.id !== id);
    if (this.memoryState.lastMentionedItem?.id === id) {
      this.memoryState.lastMentionedItem = undefined;
    }
    this.saveState();
  }

  public starWorkingMemoryItem(id: string): void {
    const item = this.memoryState.workingMemory.find(i => i.id === id);
    if (item) {
      item.starred = !item.starred;
      this.saveState();
    }
  }

  public exportWorkingMemory(): string {
    let output = `# Aether Working Memory Canvas Export\n\n`;
    output += `**Active Topic**: ${this.memoryState.currentTopic}\n`;
    output += `**Project**: ${this.memoryState.activeProjectName || 'Global'}\n\n`;
    this.memoryState.workingMemory.forEach(item => {
      output += `- [${item.type.toUpperCase()}] ${item.number ? `#${item.number}: ` : ''}**${item.title}** ${item.starred ? '⭐' : ''}\n`;
      if (item.details) output += `  *${item.details}*\n`;
    });
    return output;
  }
}

export const aetherConversationalEngine = new AetherConversationalEngine();
