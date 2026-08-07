import { masterIdeaLibrary, MasterIdea } from './masterIdeaLibraryService';

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
