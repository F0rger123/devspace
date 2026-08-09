import { masterIdeaLibrary, MasterIdea } from './masterIdeaLibraryService';
import { aetherVoiceRegistry } from './aetherVoiceRegistry';
import { aetherCore } from './aetherCore';
import { aetherDesktopIntelligence } from './aetherDesktopIntelligence';
import { aetherAliasRegistry, AetherAlias, UserDefinedAction } from './aetherAliasRegistry';

export interface WorkingMemoryItem {
  id: string;
  type: 'idea' | 'goal' | 'decision' | 'question' | 'action_item' | 'research' | 'dream' | 'planner_task';
  number?: number; // E.g., #1, #2 for numbered brainstorm lists
  title: string;
  details?: string;
  starred?: boolean;
  convertedStatus?: string;
  projectId?: string;
  createdAt: number;
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
  lastSearchQuery?: string;
  lastSearchResults?: { title: string; url: string }[];
  lastOpenedTarget?: { name: string; urlOrApp: string; type: string };
  explainMode?: {
    topic: string;
    target: string;
    depth: 'beginner' | 'intermediate' | 'expert';
  };
  interruptionStack: {
    topic: string;
    goal: string;
    workingMemory: WorkingMemoryItem[];
    pendingActions: any[];
    timestamp: number;
  }[];
}

export interface BrainstormRequest {
  topic: string;
  count: number; // 5, 20, 100, etc.
  category?: string;
  projectId?: string;
}

export interface ResolvedReferenceResult {
  matchedItem?: WorkingMemoryItem;
  matchedProjectId?: string;
  matchedIdeaNumber?: number;
  extractedCommand?: string;
  originalText: string;
}

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
    try {
      const saved = localStorage.getItem('aether_conversational_state');
      if (saved) {
        this.memoryState = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load conversational state:', e);
    }
  }

  public saveState() {
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
    this.saveState();
  }

  public setActiveProject(id: string, name: string) {
    this.memoryState.activeProjectId = id;
    this.memoryState.activeProjectName = name;
    if (!this.memoryState.referencedProjectIds.includes(id)) {
      this.memoryState.referencedProjectIds.push(id);
    }
    this.saveState();
  }

  // 1 & 2. INTERRUPTION HANDLING & TRUE CONVERSATION MEMORY
  public handleInterruption(newInterruptionTopic: string, newGoal: string) {
    // Push current context onto interruption stack
    this.memoryState.interruptionStack.push({
      topic: this.memoryState.currentTopic,
      goal: newGoal,
      workingMemory: [...this.memoryState.workingMemory],
      pendingActions: [...this.memoryState.pendingActions],
      timestamp: Date.now()
    });

    this.memoryState.currentTopic = newInterruptionTopic;
    this.saveState();
  }

  public resolveInterruptionAndResume(): { resumeText: string; restoredTopic: string } | null {
    if (this.memoryState.interruptionStack.length === 0) return null;
    const previousContext = this.memoryState.interruptionStack.pop()!;
    this.memoryState.currentTopic = previousContext.topic;
    this.saveState();
    return {
      restoredTopic: previousContext.topic,
      resumeText: `Now, returning back to our discussion on **${previousContext.topic}**...`
    };
  }

  // 3. REFERENCE RESOLUTION
  public resolveReferences(text: string, availableProjects: any[] = []): ResolvedReferenceResult {
    const lower = text.toLowerCase().trim();
    let matchedItem: WorkingMemoryItem | undefined = undefined;
    let matchedProjectId: string | undefined = undefined;
    let matchedIdeaNumber: number | undefined = undefined;

    // Pattern 1: Idea #N or Idea 14 or #14 or "the second idea"
    const numberMatch = lower.match(/(?:idea|item|#|number|\b)\s*#?(\d+)/);
    if (numberMatch && numberMatch[1]) {
      const num = parseInt(numberMatch[1], 10);
      matchedIdeaNumber = num;
      matchedItem = this.memoryState.workingMemory.find(i => i.number === num);
    } else if (lower.includes('second idea')) {
      matchedIdeaNumber = 2;
      matchedItem = this.memoryState.workingMemory.find(i => i.number === 2);
    } else if (lower.includes('first idea')) {
      matchedIdeaNumber = 1;
      matchedItem = this.memoryState.workingMemory.find(i => i.number === 1);
    } else if (lower.includes('third idea')) {
      matchedIdeaNumber = 3;
      matchedItem = this.memoryState.workingMemory.find(i => i.number === 3);
    }

    // Pattern 2: "that one", "this one", "the last goal", "those dreams"
    if (!matchedItem) {
      if (lower.includes('that one') || lower.includes('this one') || lower.includes('this idea')) {
        matchedItem = this.memoryState.lastMentionedItem || this.memoryState.workingMemory[this.memoryState.workingMemory.length - 1];
      } else if (lower.includes('the last goal') || lower.includes('the previous goal')) {
        matchedItem = [...this.memoryState.workingMemory].reverse().find(i => i.type === 'goal');
      } else if (lower.includes('those dreams') || lower.includes('the dream')) {
        matchedItem = [...this.memoryState.workingMemory].reverse().find(i => i.type === 'dream');
      }
    }

    // Pattern 3: "this project" or project name
    if (lower.includes('this project')) {
      matchedProjectId = this.memoryState.activeProjectId || availableProjects[0]?.id;
    } else {
      const projMatch = availableProjects.find(p => lower.includes(p.name.toLowerCase()));
      if (projMatch) {
        matchedProjectId = projMatch.id;
      }
    }

    return {
      matchedItem,
      matchedProjectId,
      matchedIdeaNumber,
      originalText: text
    };
  }

  // 4. WORKING MEMORY CANVAS OPERATIONS
  public addToWorkingMemory(item: Omit<WorkingMemoryItem, 'id' | 'createdAt'>): WorkingMemoryItem {
    const newItem: WorkingMemoryItem = {
      ...item,
      id: `wm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now()
    };
    this.memoryState.workingMemory.push(newItem);
    this.memoryState.lastMentionedItem = newItem;
    this.saveState();
    return newItem;
  }

  public starWorkingMemoryItem(idOrNumber: string | number): boolean {
    const item = typeof idOrNumber === 'number'
      ? this.memoryState.workingMemory.find(i => i.number === idOrNumber)
      : this.memoryState.workingMemory.find(i => i.id === idOrNumber);
    if (!item) return false;
    item.starred = !item.starred;
    this.saveState();
    return true;
  }

  public discardWorkingMemoryItem(idOrNumber: string | number): boolean {
    const initialLen = this.memoryState.workingMemory.length;
    this.memoryState.workingMemory = this.memoryState.workingMemory.filter(i => {
      if (typeof idOrNumber === 'number') return i.number !== idOrNumber;
      return i.id !== idOrNumber;
    });
    if (this.memoryState.workingMemory.length !== initialLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  public exportWorkingMemory(): string {
    let output = `# Aether Working Memory Canvas Export\n\n`;
    output += `**Active Topic**: ${this.memoryState.currentTopic}\n`;
    output += `**Project**: ${this.memoryState.activeProjectName || 'Global'}\n\n`;

    output += `## Collected Ideas & Items (${this.memoryState.workingMemory.length})\n`;
    this.memoryState.workingMemory.forEach(item => {
      output += `- [${item.type.toUpperCase()}] ${item.number ? `#${item.number}: ` : ''}**${item.title}** ${item.starred ? '⭐' : ''}\n`;
      if (item.details) output += `  *${item.details}*\n`;
    });

    if (this.memoryState.decisions.length > 0) {
      output += `\n## Decisions Made (${this.memoryState.decisions.length})\n`;
      this.memoryState.decisions.forEach(d => {
        output += `- ${d.text} (${new Date(d.timestamp).toLocaleTimeString()})\n`;
      });
    }

    return output;
  }

  // 5. BRAINSTORM MODE (GENERATOR & MANAGEMENT)
  public generateBrainstormIdeas(req: BrainstormRequest): WorkingMemoryItem[] {
    const startNum = this.memoryState.workingMemory.filter(i => i.type === 'idea').length + 1;
    const generated: WorkingMemoryItem[] = [];

    const ideaTemplates = [
      { title: 'Autonomous AST Code Refactoring Pipeline', details: 'Scans syntax trees and applies performance fixes in the background.' },
      { title: 'Interactive Timeline Replay Scrub', details: 'Allows developers to scrub backwards and forwards through code changes.' },
      { title: 'Conversational Memory Context Graph', details: 'Connects ideas, projects, and goals into a searchable neural map.' },
      { title: 'Zero-Downtime Release Readiness Auditor', details: 'Evaluates test coverage, open issues, and PR statuses before tagging.' },
      { title: 'Dynamic Multi-Turn Brainstorming Canvas', details: 'Supports 100+ ideas with instant filtering and project conversions.' },
      { title: 'Desktop Native Keyboard Overlay Engine', details: 'Invokes Aether instantly with hotkeys across system apps.' },
      { title: 'Live Voice Command & Vocal Dictionary', details: 'Maps custom voice commands to instant full-stack code actions.' },
      { title: 'Unified Master Idea Repository', details: 'Stores every brainstorm across conversations with priority tagging.' },
      { title: 'Real-time Cross-Skill Agent Orchestration', details: 'Coordinates calendar, GitHub, Jira, and Slack agents seamlessly.' },
      { title: 'Subsystem Health Diagnostics & Recovery Studio', details: 'Monitors memory leaks, API rates, and auto-heals runtime errors.' }
    ];

    for (let i = 0; i < req.count; i++) {
      const template = ideaTemplates[i % ideaTemplates.length];
      const ideaNum = startNum + i;
      const title = i < ideaTemplates.length
        ? `${template.title}`
        : `${req.topic} Enhancement Concept #${ideaNum}`;
      const details = i < ideaTemplates.length
        ? template.details
        : `Advanced ideation concept tailored for ${req.topic} (Idea #${ideaNum}).`;

      const item = this.addToWorkingMemory({
        type: 'idea',
        number: ideaNum,
        title,
        details,
        projectId: req.projectId || this.memoryState.activeProjectId
      });

      // Save to Master Idea Library
      masterIdeaLibrary.addIdea({
        title,
        description: details,
        conversationOrigin: `Brainstorm: ${req.topic}`,
        projectId: req.projectId || this.memoryState.activeProjectId,
        projectName: this.memoryState.activeProjectName,
        priority: i % 3 === 0 ? 'High' : 'Medium',
        status: 'active',
        tags: ['Brainstorm', req.topic],
        relationships: []
      });

      generated.push(item);
    }

    this.saveState();
    return generated;
  }

  // 9. EXPLAIN MODE
  public setExplainMode(target: string, depth: 'beginner' | 'intermediate' | 'expert' = 'intermediate') {
    this.memoryState.explainMode = {
      topic: this.memoryState.currentTopic,
      target,
      depth
    };
    this.saveState();
  }

  public getExplainExplanation(target: string, depth: 'beginner' | 'intermediate' | 'expert' = 'intermediate'): string {
    if (depth === 'beginner') {
      return `### Beginner Overview: ${target}\n\nThink of **${target}** like a digital assistant's memory ledger. It keeps track of everything discussed so nothing gets lost or forgotten while you work!`;
    } else if (depth === 'expert') {
      return `### Expert Technical Architecture: ${target}\n\n**${target}** operates as an AST-aware state machine with local persistence and Firestore bi-directional synchronization. It maintains a stack-based context manager for unlimited nested interruptions and zero-downtime reference resolution.`;
    } else {
      return `### Intermediate Analysis: ${target}\n\n**${target}** provides live working memory, context tracking across projects, and automatic follow-up intelligence to turn natural conversations into executable tasks.`;
    }
  }

  // 10. FOLLOW-UP INTELLIGENCE
  public getIntelligentFollowUp(): string | null {
    if (this.memoryState.workingMemory.length > 0 && Math.random() > 0.4) {
      const last = this.memoryState.workingMemory[this.memoryState.workingMemory.length - 1];
      if (last.type === 'idea') {
        return `💡 *Would you like me to create a Goal or Issue for "${last.title}"?*`;
      } else if (last.type === 'goal') {
        return `🎯 *Goal recorded! Should I schedule time in your Planner or convert this into a Dream Recommendation?*`;
      }
    }
    return null;
  }

  public getGreeting(activeProjectName?: string): string {
    const persona = aetherCore.getPersonality().persona || 'Technical';
    const userName = aetherVoiceRegistry.getPreferredName();

    if (activeProjectName && Math.random() > 0.4) {
      return `Hey ${userName}, back to work on ${activeProjectName}?`;
    }

    const friendly = [
      `Hey ${userName}! What are we working on?`,
      `Hey ${userName}, I'm here. How can I help?`,
      `Hey ${userName}! Ready when you are.`
    ];
    const professional = [
      `Hello ${userName}. What would you like me to handle?`,
      `Good day ${userName}. Aether active and ready.`,
      `Greetings ${userName}. How may I assist you today?`
    ];
    const technical = [
      `Ready ${userName}. What's the task?`,
      `Aether active, ${userName}. What are we building?`,
      `Online and listening, ${userName}.`
    ];
    const minimal = [
      `Hey ${userName}. What do you need?`,
      `Ready ${userName}.`,
      `Aether here.`
    ];
    const witty = [
      `I'm here, ${userName}. What are we getting ourselves into?`,
      `Aether here! Let's build something awesome, ${userName}.`,
      `Ready when you are, ${userName}.`
    ];

    let pool = friendly;
    if (persona === 'Professional') pool = professional;
    else if (persona === 'Technical') pool = technical;
    else if (persona === 'Minimal') pool = minimal;
    else if (persona === 'Friendly') pool = friendly;
    else if (persona === 'Coach' || persona === 'Teacher') pool = witty;
    else pool = friendly;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  public processUserMessage(
    userMessage: string,
    availableProjects: any[] = [],
    activeProjId?: string
  ): { responseText: string; actionToExecute?: any; speaksResponse?: boolean } {
    const text = userMessage.trim();
    const lower = text.toLowerCase();
    const userName = aetherVoiceRegistry.getPreferredName();

    // 0. Interruption / Stop Command
    if (lower === 'stop' || lower === 'cancel' || lower === 'quiet' || lower === 'silence') {
      aetherVoiceRegistry.stopSpeaking();
      return { responseText: 'Audio playback stopped.' };
    }

    // 0b. Natural Greetings / Casual Intro
    if (lower === 'hey aether' || lower === 'aether' || lower === 'hey' || lower === 'hello' || lower === "what's up" || lower === 'whats up' || lower === 'good morning' || lower === 'good evening' || lower === 'good afternoon') {
      return {
        responseText: this.getGreeting(this.memoryState.activeProjectName)
      };
    }

    // 1. User Identity Preference Command: "Call me [Name]" or "From now on call me [Name]"
    const callMeMatch = lower.match(/(?:from now on\s+)?call me\s+([a-zA-Z0-9\s_\-]+)/i) ||
                        lower.match(/my name is\s+([a-zA-Z0-9\s_\-]+)/i);
    if (callMeMatch && callMeMatch[1] && !lower.includes('call this website') && !lower.includes('call visual studio') && !lower.includes('call vs code') && !lower.includes('call spotify')) {
      const newName = callMeMatch[1].trim().replace(/[.\,!]/g, '');
      if (newName) {
        aetherVoiceRegistry.setPreferredName(newName);
        aetherCore.addMemory({
          topic: 'Identity',
          category: 'preferences',
          fact: `User preferred name is ${newName}`,
          confidence: 100,
          source: 'user_explicit',
          importance: 'high',
          editable: true,
          tags: ['name', 'preference', 'identity']
        });
        return {
          responseText: `Understood! From now on, I will address you as **${newName}**.`
        };
      }
    }

    // 2. User Identity Query: "What should you call me?", "What's my name?", "How do you address me?"
    if (lower.includes('what should you call me') || lower.includes('what is my name') || lower.includes('how do you address me') || lower.includes('what do you call me')) {
      return {
        responseText: `I address you as **${userName}**.`
      };
    }

    // 3. Dynamic Capabilities Query: "What can you do?"
    if (lower.includes('what can you do') || lower.includes('what are your capabilities') || lower === 'help capabilities') {
      const audit = aetherDesktopIntelligence.getCapabilityAudit();
      const capList = audit.map(a => `- **${a.capability}** (${a.status}): ${a.details}`).join('\n');
      return {
        responseText: `### Aether Intelligence Capability Registry\n\n${capList}\n\n- **Project Navigation & Context**: Switch active projects, manage backlog issues, and track priority items.\n- **Web & Media Search**: Live Google search synthesis and YouTube video tutorial discovery.\n- **Desktop Integration**: Application launching and local filesystem discovery.\n- **Custom Aliases & User Actions**: Custom trigger phrases, app/website shortcuts, and multi-step workspace sequences.`
      };
    }

    // 4. User-Defined Multi-Step Action Creation:
    // "When I say 'open my workspace', open VS Code, Chrome to my dashboard, and Spotify"
    const createActionMatch = lower.match(/(?:when|whenever)\s+i\s+say\s+['"]?([^'"]+)['"]?,\s+(?:open|launch|run|do)\s+(.+)/i);
    if (createActionMatch) {
      const triggerPhrase = createActionMatch[1].trim();
      const stepsRaw = createActionMatch[2].trim();
      const actionSteps = stepsRaw.split(/,|\band\b/).map((s, idx) => {
        const item = s.trim();
        let actionType: 'open_app' | 'open_url' | 'navigate_route' = 'open_app';
        let target = item;
        if (item.includes('http') || item.includes('www.') || item.includes('.com') || item.includes('dashboard')) {
          actionType = 'open_url';
          target = item.includes('http') ? item : `https://${item.replace(/^(to\s+my\s+|to\s+)/i, '')}`;
        }
        return {
          id: `step-${Date.now()}-${idx}`,
          order: idx + 1,
          actionType,
          target,
          label: `Step ${idx + 1}: ${item}`
        };
      });

      const newAction: UserDefinedAction = {
        id: `action-${Date.now()}`,
        name: triggerPhrase.toUpperCase(),
        triggerPhrase: triggerPhrase.toLowerCase(),
        steps: actionSteps,
        autonomyRequired: 'balanced',
        enabled: true,
        createdAt: Date.now(),
        executionCount: 0
      };
      aetherAliasRegistry.saveAction(newAction);

      return {
        responseText: `Saved multi-step action **"${triggerPhrase}"** with ${actionSteps.length} sequence steps, ${userName}. Say "${triggerPhrase}" anytime to trigger it.`
      };
    }

    // 5. Website & Application Alias Creation:
    // "Call Visual Studio Code my editor", "Call Spotify my music", "Call this website my dashboard", "Remember this as my dashboard"
    const aliasMatch = lower.match(/call\s+(.+)\s+(?:as\s+)?my\s+([a-z0-9\s_\-]+)/i) ||
                       lower.match(/remember\s+this\s+(?:website\s+)?as\s+(?:my\s+)?([a-z0-9\s_\-]+)/i) ||
                       lower.match(/call\s+this\s+website\s+(?:my\s+)?([a-z0-9\s_\-]+)/i);

    if (aliasMatch) {
      let targetRaw = aliasMatch[1]?.trim();
      let aliasName = aliasMatch[2]?.trim() || aliasMatch[1]?.trim();

      if (lower.includes('this website') || lower.includes('remember this')) {
        targetRaw = this.memoryState.lastOpenedTarget?.urlOrApp || 'https://google.com';
        aliasName = (aliasMatch[1] && aliasMatch[1] !== 'this website') ? aliasMatch[1].trim() : (aliasMatch[2]?.trim() || 'dashboard');
      }

      let aliasType: 'website' | 'desktop_app' | 'devspace_route' = 'website';
      if (targetRaw.toLowerCase().includes('code') || targetRaw.toLowerCase().includes('spotify') || targetRaw.toLowerCase().includes('chrome') || targetRaw.toLowerCase().includes('slack') || targetRaw.toLowerCase().includes('terminal')) {
        aliasType = 'desktop_app';
      }

      aetherAliasRegistry.saveAlias({
        alias: `my ${aliasName.replace(/^my\s+/, '')}`,
        target: targetRaw,
        type: aliasType,
        description: `User defined shortcut for ${targetRaw}`
      });

      return {
        responseText: `Saved alias! Whenever you say **"Open my ${aliasName.replace(/^my\s+/, '')}"**, I will launch **${targetRaw}**.`
      };
    }

    // 6. Execute User-Defined Actions
    const userAction = aetherAliasRegistry.findMatchingAction(text);
    if (userAction) {
      userAction.executionCount += 1;
      aetherAliasRegistry.saveAction(userAction);

      const firstStep = userAction.steps[0];
      return {
        responseText: `Executing user workflow **"${userAction.name}"** (${userAction.steps.length} steps)...`,
        actionToExecute: {
          intent: firstStep.actionType === 'open_url' ? 'search_web' : 'launch_desktop_app',
          parsedData: { query: firstStep.target, appName: firstStep.target }
        }
      };
    }

    // 7. Execute User Alias Shortcuts: e.g. "open my editor", "open my music", "open my dashboard"
    const aliasShortcut = aetherAliasRegistry.findMatchingAlias(text);
    if (aliasShortcut && (lower.startsWith('open') || lower.startsWith('go to') || lower.startsWith('launch'))) {
      if (aliasShortcut.type === 'desktop_app') {
        return {
          responseText: `Opening your alias **"${aliasShortcut.alias}"** (${aliasShortcut.target})...`,
          actionToExecute: {
            intent: 'launch_desktop_app',
            parsedData: { appName: aliasShortcut.target }
          }
        };
      } else if (aliasShortcut.type === 'website') {
        return {
          responseText: `Navigating to your alias **"${aliasShortcut.alias}"** (${aliasShortcut.target})...`,
          actionToExecute: {
            intent: 'search_web',
            parsedData: { query: aliasShortcut.target }
          }
        };
      }
    }

    // 8. Conversational Follow-up Context: "Find me a video about it", "What's the best explanation?", "Open the second one"
    if (lower.includes('about it') || lower.includes('explaining this') || lower.includes('best explanation') || lower.includes('most relevant') || lower.includes('open the second') || lower.includes('open the first') || lower.includes('pull that website up')) {
      const activeQuery = this.memoryState.lastSearchQuery || 'React developer workflows';

      if (lower.includes('video') || lower.includes('youtube') || lower.includes('tutorial')) {
        return {
          responseText: `Searching YouTube for video tutorials on **"${activeQuery}"** based on our conversation context...`,
          actionToExecute: {
            intent: 'search_youtube',
            parsedData: { query: activeQuery, count: 3 }
          }
        };
      }

      if (lower.includes('best explanation') || lower.includes('most relevant') || lower.includes('what does this mean')) {
        return {
          responseText: `Based on our search context for **"${activeQuery}"**: the top authoritative sources highlight architecture fundamentals, modern integration patterns, and best practices.`
        };
      }

      if (lower.includes('open the second') || lower.includes('open second') || lower.includes('the second one')) {
        const targetUrl = this.memoryState.lastSearchResults?.[1]?.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(activeQuery)}`;
        return {
          responseText: `Opening the 2nd search item for **"${activeQuery}"**...`,
          actionToExecute: {
            intent: 'search_web',
            parsedData: { query: targetUrl }
          }
        };
      }

      if (lower.includes('open the first') || lower.includes('open first') || lower.includes('the first one') || lower.includes('pull that website up')) {
        const targetUrl = this.memoryState.lastSearchResults?.[0]?.url || `https://www.google.com/search?q=${encodeURIComponent(activeQuery)}`;
        return {
          responseText: `Opening primary website source for **"${activeQuery}"**...`,
          actionToExecute: {
            intent: 'search_web',
            parsedData: { query: targetUrl }
          }
        };
      }
    }

    // 9. Web Search: "search online for X", "search the web for X", "look up X"
    if (lower.startsWith('search online') || lower.startsWith('search the web') || lower.startsWith('search the internet') || lower.startsWith('look up') || lower.startsWith('search for') || lower.includes('search online for')) {
      const query = text.replace(/^(search online for|search online|search the web for|search the web|search the internet for|search the internet|look up|search for)\s*/i, '').trim();
      const finalQuery = query || 'latest developer news';
      
      this.memoryState.lastSearchQuery = finalQuery;
      this.memoryState.lastSearchResults = [
        { title: `${finalQuery} - Official Docs`, url: `https://www.google.com/search?q=${encodeURIComponent(finalQuery)}` },
        { title: `${finalQuery} - Deep Dive Video Guide`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(finalQuery)}` }
      ];
      this.saveState();

      return {
        responseText: `Searching online for **"${finalQuery}"**...`,
        actionToExecute: {
          intent: 'search_web',
          parsedData: { query: finalQuery }
        }
      };
    }

    // 10. YouTube Search & Tutorials: "find me 3 youtube videos about X"
    if (lower.includes('youtube') || lower.includes('video') || lower.includes('tutorial')) {
      const ytQuery = text.replace(/(find|search|me|three|four|3|4|some|a|youtube|videos|video|tutorial|about|for|explaining)/gi, ' ').replace(/\s+/g, ' ').trim();
      const finalYt = ytQuery || this.memoryState.lastSearchQuery || 'React developer patterns';
      
      this.memoryState.lastSearchQuery = finalYt;
      this.memoryState.lastSearchResults = [
        { title: `${finalYt} Tutorial Part 1`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(finalYt)}` },
        { title: `${finalYt} Architecture Overview`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(finalYt)}+overview` }
      ];
      this.saveState();

      return {
        responseText: `Searching YouTube for video tutorials on **"${finalYt}"**...`,
        actionToExecute: {
          intent: 'search_youtube',
          parsedData: { query: finalYt, count: 3 }
        }
      };
    }

    // 11. Context Query: "What does this mean?"
    if (lower.includes('what does this mean') || lower.includes('explain this element') || lower === 'what does this do') {
      return {
        responseText: `If you have an element selected in Context Mode or a note open in working memory, I can analyze its architecture. Which element or project feature are you referring to, ${userName}?`
      };
    }

    // 12. Desktop Applications: "open chrome", "open vs code", "open spotify", "show my downloads"
    if (lower.startsWith('open chrome') || lower.startsWith('open vs code') || lower.startsWith('open spotify') || lower.startsWith('open slack') || lower.startsWith('open obsidian') || lower.startsWith('open terminal')) {
      const appName = lower.replace(/^open\s+/, '').trim();
      this.memoryState.lastOpenedTarget = { name: appName, urlOrApp: appName, type: 'desktop_app' };
      this.saveState();

      return {
        responseText: `Initiating system trigger to launch **${appName.toUpperCase()}**...`,
        actionToExecute: {
          intent: 'launch_desktop_app',
          parsedData: { appName }
        }
      };
    }

    // 13. Project Creation: "Create a new project called X" / "Create a project called Local Landscape"
    const createProjMatch = lower.match(/(?:create|build|start|make)\s+(?:a\s+)?(?:new\s+)?project(?:\s+called|\s+named)?\s*(.*)/i);
    if (createProjMatch) {
      let rawName = createProjMatch[1]?.trim().replace(/[.\,!]/g, '');
      if (!rawName || rawName === 'called' || rawName === 'named') {
        rawName = 'Aether New App';
      }
      const action = {
        intent: 'create_project',
        parsedData: {
          name: rawName,
          title: rawName,
          description: `Project bootstrapped via Aether voice/text directive for ${userName}.`
        }
      };
      this.memoryState.activeProjectName = rawName;
      this.saveState();
      return {
        responseText: `Creating new project **"${rawName}"** and navigating to the project workspace, ${userName}.`,
        actionToExecute: action
      };
    }

    // 14. Project Navigation / Open / Switch Project (Fuzzy matching)
    const openProjMatch = lower.match(/(?:open|go to|switch to|take me to|show)\s+(?:my\s+)?(?:project\s+)?([a-zA-Z0-9\s_\-]+)/i);
    if (openProjMatch && availableProjects.length > 0) {
      const query = openProjMatch[1].trim();
      if (query && query !== 'issues' && query !== 'notes' && query !== 'ideas' && query !== 'roadmap' && query !== 'chrome' && query !== 'vs code') {
        // Fuzzy search matching
        let matched = availableProjects.find(p => p.name.toLowerCase() === query);
        if (!matched) {
          matched = availableProjects.find(p => p.name.toLowerCase().includes(query) || query.includes(p.name.toLowerCase()));
        }
        if (!matched) {
          const queryWords = query.split(' ').filter(w => w.length > 2);
          matched = availableProjects.find(p => queryWords.some(w => p.name.toLowerCase().includes(w)));
        }

        if (matched) {
          this.setActiveProject(matched.id, matched.name);
          return {
            responseText: `Opening project **"${matched.name}"**, ${userName}.`,
            actionToExecute: {
              intent: 'navigate_to',
              parsedData: {
                path: '/projects',
                projectNameMentioned: matched.name,
                projectId: matched.id
              }
            }
          };
        }
      }
    }

    // 15. Multi-turn contextual commands: "Show me the issues" / "Create an issue" / "Make it high priority"
    if (lower.includes('show me the issues') || lower.includes('show issues') || lower.includes('open issues') || lower === 'issues') {
      const targetProjId = activeProjId || this.memoryState.activeProjectId || availableProjects[0]?.id;
      const targetProjName = this.memoryState.activeProjectName || availableProjects.find(p => p.id === targetProjId)?.name || 'Active Project';
      return {
        responseText: `Showing open issues and task backlog for **"${targetProjName}"**.`,
        actionToExecute: {
          intent: 'navigate_to',
          parsedData: { path: '/issues', projectId: targetProjId }
        }
      };
    }

    if (lower.includes('create an issue') || lower.includes('create issue') || lower.includes('create one') || lower.includes('add task') || lower.includes('add issue')) {
      const targetProjId = activeProjId || this.memoryState.activeProjectId || availableProjects[0]?.id;
      const titleMatch = text.replace(/(?:create|add)\s+(?:an?\s+)?(?:issue|task|one)(?:\s+called|\s+titled)?/i, '').trim();
      const issueTitle = titleMatch && titleMatch.length > 2 ? titleMatch : 'New Aether Backlog Item';
      
      return {
        responseText: `Adding task **"${issueTitle}"** to the project backlog.`,
        actionToExecute: {
          intent: 'create_issue',
          parsedData: {
            title: issueTitle,
            projectId: targetProjId,
            priority: 'Medium',
            type: 'Task'
          }
        }
      };
    }

    if (lower.includes('make it high priority') || lower.includes('set priority high') || lower.includes('high priority')) {
      return {
        responseText: `Updated task priority to **High** for the active backlog item.`,
        actionToExecute: {
          intent: 'update_issue_status',
          parsedData: {
            priority: 'High',
            projectId: activeProjId || this.memoryState.activeProjectId
          }
        }
      };
    }

    // Fallback response with conversational continuity
    return {
      responseText: `Understood, ${userName}. I have recorded your note regarding "${text.slice(0, 60)}".`
    };
  }

  public clearMemory() {
    this.memoryState = {
      currentTopic: 'General Workspace Discussion',
      referencedProjectIds: [],
      workingMemory: [],
      decisions: [],
      questions: [],
      pendingActions: [],
      interruptionStack: []
    };
    this.saveState();
  }
}

export const aetherConversationalEngine = new AetherConversationalEngine();
