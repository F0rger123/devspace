export interface MasterIdea {
  id: string;
  title: string;
  description: string;
  conversationOrigin: string;
  projectId?: string;
  projectName?: string;
  goals?: string[];
  dreams?: string[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'active' | 'in_review' | 'starred' | 'converted_goal' | 'converted_issue' | 'converted_dream' | 'archived';
  tags: string[];
  relationships: string[]; // Related idea IDs
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'aether_master_idea_library';

class MasterIdeaLibraryService {
  private ideas: MasterIdea[] = [];

  constructor() {
    this.loadIdeas();
  }

  private loadIdeas() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.ideas = JSON.parse(saved);
      } else {
        // Seed with initial master ideas
        this.ideas = [
          {
            id: 'idea-1',
            title: 'Automated Code Replay & AST Time Travel',
            description: 'Record user & AI code edits to allow timeline scrub and visual AST step-through diffs.',
            conversationOrigin: 'Aether Brainstorm Session #1',
            projectId: 'proj-1',
            projectName: 'DevSpace Desktop',
            goals: ['Goal: Zero-downtime undo/redo', 'Goal: Visual diff timeline'],
            dreams: ['Dream: Autonomous AST refactor'],
            priority: 'High',
            status: 'starred',
            tags: ['AST', 'Replay', 'DevTools'],
            relationships: ['idea-2'],
            createdAt: Date.now() - 86400000 * 2,
            updatedAt: Date.now() - 86400000
          },
          {
            id: 'idea-2',
            title: 'Conversational Working Memory Engine',
            description: 'Maintain live context, handles natural interruptions, reference resolution, and follow-up prompts.',
            conversationOrigin: 'Phase 9.0 Strategy',
            projectId: 'proj-1',
            projectName: 'DevSpace Desktop',
            goals: ['Goal: True conversation memory'],
            dreams: ['Dream: Multi-turn reasoning'],
            priority: 'Critical',
            status: 'active',
            tags: ['AI', 'Memory', 'Conversational'],
            relationships: ['idea-1'],
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now()
          }
        ];
        this.saveIdeas();
      }
    } catch (e) {
      console.warn('Failed to load master ideas:', e);
      this.ideas = [];
    }
  }

  private saveIdeas() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ideas));
    } catch (e) {
      console.error('Failed to save master ideas:', e);
    }
  }

  public getIdeas(): MasterIdea[] {
    return [...this.ideas];
  }

  public getIdeaById(id: string): MasterIdea | undefined {
    return this.ideas.find(i => i.id === id);
  }

  public addIdea(idea: Omit<MasterIdea, 'id' | 'createdAt' | 'updatedAt'>): MasterIdea {
    const newIdea: MasterIdea = {
      ...idea,
      id: `master-idea-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.ideas.unshift(newIdea);
    this.saveIdeas();
    return newIdea;
  }

  public updateIdea(id: string, updates: Partial<MasterIdea>): MasterIdea | null {
    const index = this.ideas.findIndex(i => i.id === id);
    if (index === -1) return null;
    this.ideas[index] = {
      ...this.ideas[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveIdeas();
    return this.ideas[index];
  }

  public deleteIdea(id: string): boolean {
    const initialLen = this.ideas.length;
    this.ideas = this.ideas.filter(i => i.id !== id);
    if (this.ideas.length !== initialLen) {
      this.saveIdeas();
      return true;
    }
    return false;
  }

  public searchIdeas(query: string, filterProject?: string, filterTag?: string): MasterIdea[] {
    const q = query.toLowerCase().trim();
    return this.ideas.filter(idea => {
      const matchesQuery = !q || 
        idea.title.toLowerCase().includes(q) || 
        idea.description.toLowerCase().includes(q) ||
        idea.tags.some(t => t.toLowerCase().includes(q));
      const matchesProject = !filterProject || idea.projectId === filterProject || idea.projectName?.toLowerCase() === filterProject.toLowerCase();
      const matchesTag = !filterTag || idea.tags.includes(filterTag);
      return matchesQuery && matchesProject && matchesTag;
    });
  }

  public starIdea(id: string): MasterIdea | null {
    const idea = this.getIdeaById(id);
    if (!idea) return null;
    const newStatus = idea.status === 'starred' ? 'active' : 'starred';
    return this.updateIdea(id, { status: newStatus });
  }

  public exportIdeasToMarkdown(): string {
    let md = '# Master Idea Library Export\n\n';
    md += `*Exported on ${new Date().toLocaleString()}*\n\n`;
    this.ideas.forEach((idea, index) => {
      md += `### ${index + 1}. ${idea.title} ${idea.status === 'starred' ? '⭐' : ''}\n`;
      md += `- **Priority**: ${idea.priority} | **Status**: ${idea.status}\n`;
      md += `- **Project**: ${idea.projectName || 'Global'}\n`;
      md += `- **Origin**: ${idea.conversationOrigin}\n`;
      md += `- **Tags**: ${idea.tags.join(', ') || 'None'}\n`;
      md += `- **Description**: ${idea.description}\n\n`;
    });
    return md;
  }
}

export const masterIdeaLibrary = new MasterIdeaLibraryService();
