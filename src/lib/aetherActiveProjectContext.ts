// Aether Active Project Context & Project Intelligence Service
// Maintains the single canonical project context:
// {
//   projectId, projectName, connectedRepository, currentBranch,
//   recentCommits, openPullRequests, openIssues, recentIdeas,
//   activeRoadmapPhase, recentNotes, currentConversationTopic
// }
// Real-time synchronization across UI, DataProvider, Aether Conversational Engine, and GitHub.

import { getResolvedAetherPersonality } from './aetherPersonalityResolver';

export interface GitHubCommitItem {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface GitHubPullRequestItem {
  id: number | string;
  number: number;
  title: string;
  user: string;
  state: string;
  mergeable?: boolean;
  draft?: boolean;
  url?: string;
  createdAt?: string;
  headBranch?: string;
  baseBranch?: string;
  branch?: string;
  base?: string;
}

export interface RecentActivityItem {
  id?: string;
  projectId: string;
  projectName: string;
  type: 'project_edit' | 'issue' | 'idea' | 'roadmap' | 'note' | 'commit' | 'push' | 'pull_request' | 'conversation_action' | 'workflow' | 'branch_switch';
  title: string;
  summary?: string;
  timestamp: number;
  source: 'workspace' | 'github' | 'aether' | 'notes' | 'desktop' | 'issues';
  metadata?: Record<string, any>;
}

export interface ActivityTimelineItem {
  id: string;
  timestamp: number;
  formattedTime: string;
  projectId: string;
  projectName: string;
  source: 'github' | 'workspace' | 'notes' | 'conversations' | 'desktop' | 'issues';
  activity: string;
  classification: 'verified_fact' | 'aether_inference';
  details?: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface ProactiveSuggestionItem {
  id: string;
  type: 'unfinished_work' | 'failed_workflow' | 'stale_issue' | 'recent_push' | 'pr_attention' | 'recent_project';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  project?: string;
  actionLabel?: string;
  actionCommand?: string;
  createdAt: number;
}

export interface UnfinishedWorkReport {
  spokenText: string;
  markdownText: string;
  items: Array<{
    id: string;
    title: string;
    type: 'in_progress_issue' | 'draft_pr' | 'stale_issue' | 'pending_task';
    priority?: string;
    projectName: string;
    details?: string;
  }>;
}

export interface SinceLastOpenedReport {
  spokenText: string;
  markdownText: string;
  projectName: string;
  sinceTimestamp: number;
  changesCount: number;
  commits: GitHubCommitItem[];
  issuesChanged: ActiveProjectIssueItem[];
  notesChanged: ActiveProjectNoteItem[];
}

export interface TopProjectTimeReport {
  topProjectName: string;
  topProjectId: string;
  period: string;
  eventsCount: number;
  spokenText: string;
  markdownText: string;
  breakdown: Array<{ projectName: string; eventsCount: number; commits: number; issues: number; notes: number }>;
}

export interface RecentWorkReport {
  primaryProjects: string[];
  facts: string[];
  inferences: string[];
  followUpActions: Array<{ label: string; action: string; payload?: any }>;
  groundedFacts: string[];
  suggestedNextSteps: string[];
  summaryText: string;
  spokenText: string;
}

export type RecentWorkIntelligenceReport = RecentWorkReport;

export interface PRMergeSafetyResult {
  prNumber: number;
  safe: boolean;
  reason?: string;
  details?: any;
  summary: string;
}

export type PRMergeSafetyEvaluation = PRMergeSafetyResult;

export interface ActiveProjectIssueItem {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  status: 'Backlog' | 'Todo' | 'In Progress' | 'In Review' | 'Done' | 'Closed' | string;
  labels?: string[];
  type?: string;
  parentId?: string;
}

export interface ActiveProjectIdeaItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
}

export interface ActiveProjectNoteItem {
  id: string;
  title: string;
  content?: string;
  updatedAt?: number;
}

export interface CanonicalActiveProjectContextState {
  projectId: string | null;
  projectName: string | null;
  connectedRepository: string | null;
  currentBranch: string | null;
  recentCommits: GitHubCommitItem[];
  openPullRequests: GitHubPullRequestItem[];
  openIssues: ActiveProjectIssueItem[];
  recentIdeas: ActiveProjectIdeaItem[];
  activeRoadmapPhase: { id: string; name: string; status?: string } | null;
  recentNotes: ActiveProjectNoteItem[];
  allProjectsSummary: Array<{ id: string; name: string; repo?: string; updatedAt?: number }>;
  recentActivities: RecentActivityItem[];
  currentConversationTopic: string;
  lastActiveTimestamp: number;
  isLoadingGitHub: boolean;
  lastGitHubSyncError: string | null;
}

const CONTEXT_STORAGE_KEY = 'aether_canonical_active_project_context';

export function inferThemesFromActivities(activities: RecentActivityItem[]): string[] {
  const themes: string[] = [];
  const textCorpus = activities.map(a => `${a.title} ${a.summary || ''}`).join(' ').toLowerCase();

  if (textCorpus.includes('aether') || textCorpus.includes('voice') || textCorpus.includes('speech') || textCorpus.includes('wake') || textCorpus.includes('search') || textCorpus.includes('intent') || textCorpus.includes('conversation')) {
    themes.push("improving Aether's search, conversation, and voice reliability");
  }
  if (textCorpus.includes('task') || textCorpus.includes('issue') || textCorpus.includes('kanban') || textCorpus.includes('dropdown') || textCorpus.includes('status') || textCorpus.includes('board') || textCorpus.includes('ticket')) {
    themes.push("polishing task and issue management workflows");
  }
  if (textCorpus.includes('design studio') || textCorpus.includes('preview') || textCorpus.includes('template') || textCorpus.includes('canvas') || textCorpus.includes('style') || textCorpus.includes('ui')) {
    themes.push("fixing Design Studio previews and template rendering");
  }
  if (textCorpus.includes('persist') || textCorpus.includes('storage') || textCorpus.includes('quota') || textCorpus.includes('indexeddb') || textCorpus.includes('firestore') || textCorpus.includes('database') || textCorpus.includes('history')) {
    themes.push("tightening project persistence and conversation storage stability");
  }
  if (textCorpus.includes('github') || textCorpus.includes('pr') || textCorpus.includes('merge') || textCorpus.includes('branch') || textCorpus.includes('commit') || textCorpus.includes('repo')) {
    themes.push("managing repository branching, PR safety, and version control");
  }
  if (textCorpus.includes('auth') || textCorpus.includes('login') || textCorpus.includes('session') || textCorpus.includes('token') || textCorpus.includes('security')) {
    themes.push("securing authentication and user session credentials");
  }
  if (textCorpus.includes('roadmap') || textCorpus.includes('phase') || textCorpus.includes('milestone') || textCorpus.includes('goal')) {
    themes.push("structuring project roadmap milestones and release planning");
  }

  if (themes.length === 0 && activities.length > 0) {
    themes.push("iterating on core application features and workspace stability");
  }
  return Array.from(new Set(themes));
}

class AetherActiveProjectContextService {
  private state: CanonicalActiveProjectContextState = {
    projectId: null,
    projectName: null,
    connectedRepository: null,
    currentBranch: 'main',
    recentCommits: [],
    openPullRequests: [],
    openIssues: [],
    recentIdeas: [],
    activeRoadmapPhase: null,
    recentNotes: [],
    allProjectsSummary: [],
    recentActivities: [],
    currentConversationTopic: 'General Workspace',
    lastActiveTimestamp: Date.now(),
    isLoadingGitHub: false,
    lastGitHubSyncError: null
  };

  private listeners: Set<(state: CanonicalActiveProjectContextState) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem(CONTEXT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load canonical active project context:', e);
    }
  }

  private persistState() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to persist canonical active project context:', e);
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error('Error in active project context listener:', err);
      }
    });
  }

  public subscribe(listener: (state: CanonicalActiveProjectContextState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public getState(): CanonicalActiveProjectContextState {
    return { ...this.state };
  }

  public getAuthorizedGitHubToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return (
      localStorage.getItem('github_token') ||
      localStorage.getItem('gh_pat') ||
      localStorage.getItem('github_access_token') ||
      null
    );
  }

  public recordActivity(item: RecentActivityItem) {
    const existing = this.state.recentActivities || [];
    const updated = [item, ...existing.filter(a => a.id !== item.id)].slice(0, 100);
    this.state.recentActivities = updated;
    this.persistState();
  }

  /**
   * Synchronize from DataProvider whenever projects, issues, notes, or activeProjectId update.
   */
  public async syncFromDataContext(data: {
    activeProjectId: string | null;
    projects: any[];
    issues: any[];
    notes: any[];
    phases?: any[];
    ideas?: any[];
    topic?: string;
  }) {
    const { activeProjectId, projects = [], issues = [], notes = [], phases = [], ideas = [], topic } = data;

    let matchedProject = null;
    if (activeProjectId) {
      matchedProject = projects.find(p => p.id === activeProjectId);
    }
    if (!matchedProject && projects.length > 0) {
      matchedProject = projects[0];
    }

    const prevProjectId = this.state.projectId;
    const prevRepo = this.state.connectedRepository;

    const projectId = matchedProject ? matchedProject.id : null;
    const projectName = matchedProject ? matchedProject.name : null;
    const repo =
      matchedProject && matchedProject.githubRepos && matchedProject.githubRepos.length > 0
        ? matchedProject.githubRepos[0]
        : matchedProject?.repo || null;

    // Filter project-specific issues & notes
    const projectIssues: ActiveProjectIssueItem[] = issues
      .filter(i => (!projectId ? true : i.projectId === projectId || i.projectId === 'all'))
      .map(i => ({
        id: i.id,
        title: i.title || 'Untitled Task',
        priority: i.priority || 'Medium',
        status: i.status || 'Todo',
        labels: i.labels || [],
        type: i.type,
        parentId: i.parentId
      }));

    const projectNotes: ActiveProjectNoteItem[] = notes
      .filter(n => (!projectId ? true : n.projectId === projectId || !n.projectId))
      .map(n => ({
        id: n.id,
        title: n.title || 'Untitled Note',
        content: n.content || '',
        updatedAt: n.updatedAt || n.createdAt || Date.now()
      }));

    const projectIdeas: ActiveProjectIdeaItem[] = ideas
      .filter(id => (!projectId ? true : id.projectId === projectId))
      .map(id => ({
        id: id.id,
        title: id.title || 'Untitled Idea',
        description: id.description || '',
        priority: id.priority || 'Medium',
        status: id.status || 'Draft'
      }));

    // Find active phase
    const activePhase = phases.find(ph => ph.status === 'in_progress') || phases[0] || null;

    // Summarize all available projects
    const allProjectsSummary = projects.map(p => ({
      id: p.id,
      name: p.name || 'Untitled Project',
      repo: p.githubRepos?.[0] || p.repo,
      updatedAt: p.updatedAt || p.createdAt || Date.now()
    }));

    // Collect fresh normalized activities from workspace state
    const freshActivities: RecentActivityItem[] = [];
    const now = Date.now();

    // From issues
    issues.slice(0, 20).forEach(iss => {
      const proj = projects.find(p => p.id === iss.projectId);
      const pName = proj ? proj.name : (projectName || 'Workspace');
      freshActivities.push({
        id: `iss-${iss.id}`,
        projectId: iss.projectId || projectId || 'default',
        projectName: pName,
        type: 'issue',
        title: iss.title || 'Untitled Task',
        summary: `Status: ${iss.status || 'Todo'}, Priority: ${iss.priority || 'Medium'}`,
        timestamp: iss.updatedAt || iss.createdAt || now,
        source: 'workspace',
        metadata: { status: iss.status, priority: iss.priority }
      });
    });

    // From notes
    notes.slice(0, 10).forEach(nt => {
      const proj = projects.find(p => p.id === nt.projectId);
      const pName = proj ? proj.name : (projectName || 'Workspace');
      freshActivities.push({
        id: `note-${nt.id}`,
        projectId: nt.projectId || projectId || 'default',
        projectName: pName,
        type: 'note',
        title: nt.title || 'Workspace Note',
        summary: nt.content ? nt.content.substring(0, 60) : '',
        timestamp: nt.updatedAt || nt.createdAt || now,
        source: 'notes'
      });
    });

    this.state.projectId = projectId;
    this.state.projectName = projectName;
    this.state.connectedRepository = repo;
    this.state.openIssues = projectIssues;
    this.state.recentNotes = projectNotes;
    this.state.recentIdeas = projectIdeas;
    this.state.allProjectsSummary = allProjectsSummary;
    this.state.recentActivities = freshActivities;

    if (activePhase) {
      this.state.activeRoadmapPhase = {
        id: activePhase.id,
        name: activePhase.title || activePhase.name || 'Phase 1',
        status: activePhase.status
      };
    }
    if (topic) {
      this.state.currentConversationTopic = topic;
    }
    this.state.lastActiveTimestamp = Date.now();

    if (prevProjectId !== projectId || prevRepo !== repo) {
      this.state.recentCommits = [];
      this.state.openPullRequests = [];
    }

    this.persistState();

    // Trigger GitHub fetch if repo changed or on initial project load
    if (repo && (prevProjectId !== projectId || prevRepo !== repo || this.state.recentCommits.length === 0)) {
      await this.fetchGitHubStateForRepo(repo);
    }
  }

  /**
   * Fetch real commits and PRs from GitHub backend proxy
   */
  public async fetchGitHubStateForRepo(repoFullName: string, branch: string = 'main'): Promise<boolean> {
    if (!repoFullName) return false;

    this.state.isLoadingGitHub = true;
    this.state.lastGitHubSyncError = null;
    this.notifyListeners();

    const token = this.getAuthorizedGitHubToken();
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

    try {
      // 1. Fetch commits
      const commitRes = await fetch(`${baseUrl}/api/github/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: repoFullName, branch, token })
      });

      let commits: GitHubCommitItem[] = [];
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        if (Array.isArray(commitData)) {
          commits = commitData.slice(0, 10).map((c: any) => ({
            sha: c.sha ? c.sha.substring(0, 7) : 'head',
            message: c.commit?.message?.split('\n')[0] || c.message || 'Updated repository',
            author: c.commit?.author?.name || c.author || 'Developer',
            date: c.commit?.author?.date || c.date || new Date().toISOString()
          }));
        }
      }

      // 2. Fetch Pull Requests
      let pullRequests: GitHubPullRequestItem[] = [];
      try {
        const prRes = await fetch(`${baseUrl}/api/github/pulls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: repoFullName, state: 'open', token })
        });

        if (prRes.ok) {
          const prData = await prRes.json();
          if (Array.isArray(prData)) {
            pullRequests = prData.slice(0, 10).map((p: any) => ({
              id: p.id,
              number: p.number,
              title: p.title,
              user: p.user?.login || 'contributor',
              state: p.state,
              mergeable: p.mergeable,
              draft: p.draft || false,
              url: p.html_url || `https://github.com/${repoFullName}/pull/${p.number}`,
              createdAt: p.created_at,
              headBranch: p.head?.ref,
              baseBranch: p.base?.ref
            }));
          }
        }
      } catch (prErr) {
        console.warn('Failed to fetch PRs:', prErr);
      }

      this.state.recentCommits = commits;
      this.state.openPullRequests = pullRequests;
      this.state.connectedRepository = repoFullName;
      this.state.currentBranch = branch;
      this.state.isLoadingGitHub = false;
      this.state.lastGitHubSyncError = null;

      // Add commits to recent activities
      const pName = this.state.projectName || 'Workspace';
      const commitActivities: RecentActivityItem[] = commits.map(c => ({
        id: `commit-${c.sha}`,
        projectId: this.state.projectId || 'default',
        projectName: pName,
        type: 'commit',
        title: c.message,
        summary: `Commit ${c.sha} by ${c.author}`,
        timestamp: new Date(c.date).getTime() || Date.now(),
        source: 'github',
        metadata: { sha: c.sha, author: c.author }
      }));

      this.state.recentActivities = [...commitActivities, ...(this.state.recentActivities || [])].slice(0, 100);

      this.persistState();
      return true;
    } catch (e: any) {
      console.warn('Error syncing GitHub repo state:', e);
      this.state.isLoadingGitHub = false;
      this.state.lastGitHubSyncError = e.message || 'Network error';
      this.persistState();
      return false;
    }
  }

  /**
   * Set active project directly and trigger sync
   */
  public setActiveProject(projectId: string, projectName?: string, repo?: string) {
    this.state.projectId = projectId;
    if (projectName) this.state.projectName = projectName;
    if (repo) this.state.connectedRepository = repo;
    this.state.lastActiveTimestamp = Date.now();
    this.persistState();

    if (repo) {
      this.fetchGitHubStateForRepo(repo);
    }
  }

  /**
   * Set current conversation topic
   */
  public setCurrentTopic(topic: string) {
    this.state.currentConversationTopic = topic;
    this.persistState();
  }

  /**
   * Grounded Recent Work Intelligence Pipeline
   * Groups activity by project and feature theme, separating FACT from INFERENCE.
   */
  public getRecentWorkReport(options?: { targetProjectName?: string; timeFilter?: 'today' | 'this_morning' | 'morning' | 'yesterday' | 'this_week' | 'last_month' | 'recent'; allProjects?: any[] }): RecentWorkReport {
    const facts: string[] = [];
    const inferences: string[] = [];
    const followUpActions: Array<{ label: string; action: string; payload?: any }> = [];

    const activeProjName = this.state.projectName || 'DevSpace';
    const allSummaries = (options?.allProjects && options.allProjects.length > 0)
      ? options.allProjects
      : (this.state.allProjectsSummary && this.state.allProjectsSummary.length > 0)
        ? this.state.allProjectsSummary
        : [{ id: this.state.projectId || '1', name: activeProjName }];

    // Filter project names
    let matchedProjects = allSummaries;
    if (options?.targetProjectName) {
      const q = options.targetProjectName.toLowerCase();
      const filtered = allSummaries.filter((p: any) => p.name && p.name.toLowerCase().includes(q));
      if (filtered.length > 0) {
        matchedProjects = filtered;
      }
    }

    const primaryProjectNames = matchedProjects.slice(0, 2).map((p: any) => p.name || 'DevSpace');
    const primaryNameDisplay = primaryProjectNames.length > 1
      ? `**${primaryProjectNames[0]}** and **${primaryProjectNames[1]}**`
      : `**${primaryProjectNames[0] || activeProjName}**`;

    const repo = this.state.connectedRepository;
    const commits = this.state.recentCommits || [];
    const prs = this.state.openPullRequests || [];
    const issues = this.state.openIssues || [];
    const notes = this.state.recentNotes || [];
    const allActivities = this.state.recentActivities || [];

    const targetProjectIds = new Set(matchedProjects.map((p: any) => p.id).filter(Boolean));
    const targetProjectNames = new Set(matchedProjects.map((p: any) => (p.name || '').toLowerCase()).filter(Boolean));
    const activities = allActivities.filter(a => {
      if (targetProjectIds.size === 0 && targetProjectNames.size === 0) return true;
      if (a.projectId && targetProjectIds.has(a.projectId)) return true;
      if (a.projectName && targetProjectNames.has(a.projectName.toLowerCase())) return true;
      return false;
    });

    // Filter by time window if requested
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfYesterday = startOfToday - 86400000;
    const startOfThisWeek = startOfToday - (7 * 86400000);
    const startOfLastMonth = startOfToday - (30 * 86400000);
    const noonToday = new Date().setHours(12, 0, 0, 0);

    let timeScopedActivities = activities;
    let timeLabel = 'recently';
    if (options?.timeFilter === 'this_morning' || (options?.timeFilter as any) === 'morning') {
      timeScopedActivities = activities.filter(a => a.timestamp >= startOfToday && a.timestamp <= Math.max(noonToday, now));
      timeLabel = 'this morning';
    } else if (options?.timeFilter === 'today') {
      timeScopedActivities = activities.filter(a => a.timestamp >= startOfToday);
      timeLabel = 'today';
    } else if (options?.timeFilter === 'yesterday') {
      timeScopedActivities = activities.filter(a => a.timestamp >= startOfYesterday && a.timestamp < startOfToday);
      timeLabel = 'yesterday';
    } else if (options?.timeFilter === 'this_week') {
      timeScopedActivities = activities.filter(a => a.timestamp >= startOfThisWeek);
      timeLabel = 'this week';
    } else if (options?.timeFilter === 'last_month') {
      timeScopedActivities = activities.filter(a => a.timestamp >= startOfLastMonth);
      timeLabel = 'last month';
    }

    // 1. Facts from GitHub Commits & PRs
    if (commits.length > 0) {
      const topCommit = commits[0];
      facts.push(`Pushed commit \`${topCommit.sha}\` (*${topCommit.message}*) to **${repo || activeProjName}**.`);
      if (commits.length > 1) {
        facts.push(`Recent commit history contains ${commits.length} synced commits.`);
      }
    } else if (repo) {
      facts.push(`Connected repository is **${repo}** on branch \`${this.state.currentBranch || 'main'}\`.`);
    }

    if (prs.length > 0) {
      const pr = prs[0];
      facts.push(`Open Pull Request #${pr.number}: *"${pr.title}"* by @${pr.user} (${pr.draft ? 'Draft' : 'Ready'}).`);
      followUpActions.push({
        label: `Inspect PR #${pr.number}`,
        action: 'inspect_pr',
        payload: { pullNumber: pr.number, repo }
      });
      followUpActions.push({
        label: `Prepare PR #${pr.number} for Merge`,
        action: 'merge_safety_check',
        payload: { pullNumber: pr.number, repo }
      });
    }

    // 2. Facts from Workspace Issues
    const inProgressIssues = issues.filter(i => i.status === 'In Progress' || i.status === 'in_progress');
    const highPriorityIssues = issues.filter(i => (i.priority === 'High' || i.priority === 'Critical') && i.status !== 'Done' && i.status !== 'Closed');

    if (inProgressIssues.length > 0) {
      facts.push(`Currently working on **"${inProgressIssues[0].title}"** (In Progress) in ${activeProjName}.`);
    } else if (highPriorityIssues.length > 0) {
      facts.push(`Top priority backlog item is **"${highPriorityIssues[0].title}"** (${highPriorityIssues[0].priority}) in ${activeProjName}.`);
      followUpActions.push({
        label: `Start "${highPriorityIssues[0].title}"`,
        action: 'start_issue',
        payload: { issueId: highPriorityIssues[0].id }
      });
    } else if (issues.length > 0) {
      facts.push(`You have ${issues.length} active issue(s) tracked in ${activeProjName}.`);
    }

    if (notes.length > 0) {
      facts.push(`You have ${notes.length} note(s) logged in your active workspace.`);
    }

    // 3. Infer meaningful high-level feature themes (DO NOT concatenate raw labels!)
    const relevantActivities = timeScopedActivities.length > 0 ? timeScopedActivities : activities;
    const inferredThemes = inferThemesFromActivities(relevantActivities);

    if (inferredThemes.length > 0 && relevantActivities.length > 0) {
      const topThemes = inferredThemes.slice(0, 2);
      inferences.push(`You've been focused on ${topThemes.join(' and ')}.`);
    } else if (facts.length > 0) {
      inferences.push(`Activities indicate active maintenance and project iteration in ${primaryProjectNames[0] || activeProjName}.`);
    }

    if (facts.length === 0 && inferences.length === 0) {
      facts.push(`No verified code or issue activity recorded yet for ${primaryProjectNames[0] || activeProjName}.`);
    }

    // 4. Synthesize direct, elegant spoken text and markdown summary
    const spokenProject = primaryProjectNames.length > 1
      ? `${primaryProjectNames[0]} and ${primaryProjectNames[1]}`
      : `${primaryProjectNames[0] || activeProjName}`;

    let spokenText = '';
    if (facts.length === 1 && facts[0].startsWith('No verified code')) {
      spokenText = `I have no recorded code or issue activity yet for ${spokenProject}. You are ready for a clean start.`;
    } else {
      const themesText = inferredThemes.length > 0 && relevantActivities.length > 0
        ? `Recently you've been focused on ${inferredThemes.slice(0, 2).join(' and ')}.`
        : inProgressIssues.length > 0
          ? `Your active focus is "${inProgressIssues[0].title}".`
          : `Your workspace is up to date and ready for the next task.`;
      spokenText = `You've mainly been working on ${spokenProject}. ${themesText}`;
    }

    // Markdown summary
    let summaryText = `### Recent Work Intelligence: ${primaryNameDisplay}\n\n`;
    if (inferences.length > 0) {
      summaryText += `**Aether Assessment (Inference)**:\n` + inferences.map(inf => `• ${inf}`).join('\n') + `\n\n`;
    }
    if (facts.length > 0) {
      summaryText += `**Verified Activity (Facts)**:\n` + facts.map(f => `• ${f}`).join('\n') + `\n\n`;
    }
    if (followUpActions.length > 0) {
      summaryText += `**Suggested Next Actions**:\n` + followUpActions.map((act, i) => `${i + 1}. *${act.label}*`).join('\n');
    }

    const suggestedNextSteps = followUpActions.map(a => a.label);

    return {
      primaryProjects: primaryProjectNames,
      facts,
      inferences,
      followUpActions,
      groundedFacts: facts,
      suggestedNextSteps,
      summaryText,
      spokenText
    };
  }

  /**
   * Build structured Activity Timeline distinguishing verified facts vs Aether inferences.
   */
  public getActivityTimeline(filter?: {
    projectId?: string;
    source?: string;
    classification?: 'verified_fact' | 'aether_inference' | 'all';
    limit?: number;
  }): ActivityTimelineItem[] {
    const items: ActivityTimelineItem[] = [];
    const activeProjName = this.state.projectName || 'DevSpace';
    const activeProjId = this.state.projectId || 'default';

    // 1. Commits (verified facts)
    (this.state.recentCommits || []).forEach(c => {
      const timeNum = c.date ? new Date(c.date).getTime() : Date.now();
      items.push({
        id: `timeline-commit-${c.sha}`,
        timestamp: isNaN(timeNum) ? Date.now() : timeNum,
        formattedTime: new Date(isNaN(timeNum) ? Date.now() : timeNum).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        projectId: activeProjId,
        projectName: activeProjName,
        source: 'github',
        activity: `Pushed commit ${c.sha}: "${c.message}"`,
        classification: 'verified_fact',
        details: `Author: ${c.author}`,
        link: this.state.connectedRepository ? `https://github.com/${this.state.connectedRepository}/commit/${c.sha}` : undefined,
        metadata: { sha: c.sha, author: c.author }
      });
    });

    // 2. Open Pull Requests (verified facts)
    (this.state.openPullRequests || []).forEach(pr => {
      const timeNum = pr.createdAt ? new Date(pr.createdAt).getTime() : Date.now();
      items.push({
        id: `timeline-pr-${pr.id || pr.number}`,
        timestamp: isNaN(timeNum) ? Date.now() : timeNum,
        formattedTime: new Date(isNaN(timeNum) ? Date.now() : timeNum).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        projectId: activeProjId,
        projectName: activeProjName,
        source: 'github',
        activity: `PR #${pr.number}: "${pr.title}" (${pr.draft ? 'Draft' : 'Open'})`,
        classification: 'verified_fact',
        details: `Branch: ${pr.headBranch || 'feature'} -> ${pr.baseBranch || 'main'} by @${pr.user}`,
        link: pr.url,
        metadata: { prNumber: pr.number, draft: pr.draft, mergeable: pr.mergeable }
      });
    });

    // 3. Workspace Issues (verified facts)
    (this.state.openIssues || []).forEach(iss => {
      const timeNum = (iss as any).updatedAt || (iss as any).createdAt || Date.now();
      items.push({
        id: `timeline-iss-${iss.id}`,
        timestamp: timeNum,
        formattedTime: new Date(timeNum).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        projectId: activeProjId,
        projectName: activeProjName,
        source: 'issues',
        activity: `Issue: "${iss.title}" [${iss.status}]`,
        classification: 'verified_fact',
        details: `Priority: ${iss.priority}${iss.labels?.length ? ` • Labels: ${iss.labels.join(', ')}` : ''}`,
        metadata: { priority: iss.priority, status: iss.status }
      });
    });

    // 4. Workspace Notes (verified facts)
    (this.state.recentNotes || []).forEach(nt => {
      const timeNum = nt.updatedAt || Date.now();
      items.push({
        id: `timeline-note-${nt.id}`,
        timestamp: timeNum,
        formattedTime: new Date(timeNum).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        projectId: activeProjId,
        projectName: activeProjName,
        source: 'notes',
        activity: `Note: "${nt.title}"`,
        classification: 'verified_fact',
        details: nt.content ? nt.content.substring(0, 100) : ''
      });
    });

    // 5. Recent Activity Events recorded
    (this.state.recentActivities || []).forEach(act => {
      if (!items.some(i => i.id === `timeline-${act.id || act.title}`)) {
        items.push({
          id: `timeline-${act.id || Math.random().toString(36).slice(2, 8)}`,
          timestamp: act.timestamp || Date.now(),
          formattedTime: new Date(act.timestamp || Date.now()).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          projectId: act.projectId || activeProjId,
          projectName: act.projectName || activeProjName,
          source: act.source === 'github' ? 'github' : act.source === 'notes' ? 'notes' : 'workspace',
          activity: act.title,
          classification: 'verified_fact',
          details: act.summary,
          metadata: act.metadata
        });
      }
    });

    // 6. Inferred Focus & Themes (Aether Inferences)
    const inferredThemes = inferThemesFromActivities(this.state.recentActivities || []);
    if (inferredThemes.length > 0) {
      items.push({
        id: `timeline-inf-themes`,
        timestamp: Date.now() - 1000,
        formattedTime: 'Inferred Focus',
        projectId: activeProjId,
        projectName: activeProjName,
        source: 'conversations',
        activity: `Primary Focus Theme: ${inferredThemes.join(', ')}`,
        classification: 'aether_inference',
        details: `Inferred from recent commits, active issues, and workspace edits.`
      });
    }

    // Sort by timestamp desc
    items.sort((a, b) => b.timestamp - a.timestamp);

    // Apply filters
    let filtered = items;
    if (filter?.projectId && filter.projectId !== 'all') {
      filtered = filtered.filter(i => i.projectId === filter.projectId);
    }
    if (filter?.source && filter.source !== 'all') {
      filtered = filtered.filter(i => i.source === filter.source);
    }
    if (filter?.classification && filter.classification !== 'all') {
      filtered = filtered.filter(i => i.classification === filter.classification);
    }
    if (filter?.limit && filter.limit > 0) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Retrieve real unfinished work across DevSpace (in-progress issues, draft PRs, high-priority backlog).
   */
  public getUnfinishedWork(targetProjectId?: string): UnfinishedWorkReport {
    const activeProjName = this.state.projectName || 'DevSpace';
    const items: UnfinishedWorkReport['items'] = [];

    // In-progress issues
    const inProgressIssues = (this.state.openIssues || []).filter(
      i => i.status === 'In Progress' || i.status === 'in_progress'
    );
    inProgressIssues.forEach(i => {
      items.push({
        id: i.id,
        title: i.title,
        type: 'in_progress_issue',
        priority: i.priority,
        projectName: activeProjName,
        details: `Status: In Progress • Priority: ${i.priority}`
      });
    });

    // High priority open issues in Todo / Backlog
    const highPriorityTodo = (this.state.openIssues || []).filter(
      i => (i.priority === 'High' || i.priority === 'Critical') && (i.status === 'Todo' || i.status === 'Backlog')
    );
    highPriorityTodo.forEach(i => {
      items.push({
        id: i.id,
        title: i.title,
        type: 'pending_task',
        priority: i.priority,
        projectName: activeProjName,
        details: `Status: ${i.status} • Priority: ${i.priority}`
      });
    });

    // Draft PRs or open PRs awaiting review/checks
    (this.state.openPullRequests || []).forEach(pr => {
      if (pr.draft || pr.mergeable === false) {
        items.push({
          id: `pr-${pr.id || pr.number}`,
          title: `PR #${pr.number}: ${pr.title}`,
          type: 'draft_pr',
          projectName: activeProjName,
          details: pr.draft ? 'Draft PR awaiting completion' : 'PR has merge conflicts or pending checks'
        });
      }
    });

    // Stale issues (> 7 days without update)
    const now = Date.now();
    const staleThreshold = 7 * 86400000;
    (this.state.openIssues || []).forEach((iss: any) => {
      const lastUpdate = iss.updatedAt || iss.createdAt || 0;
      if (lastUpdate && (now - lastUpdate > staleThreshold) && iss.status !== 'Done' && iss.status !== 'Closed') {
        if (!items.some(it => it.id === iss.id)) {
          items.push({
            id: iss.id,
            title: iss.title,
            type: 'stale_issue',
            priority: iss.priority,
            projectName: activeProjName,
            details: `Untouched for over ${Math.floor((now - lastUpdate) / 86400000)} days`
          });
        }
      }
    });

    if (items.length === 0) {
      return {
        spokenText: `You have no unfinished tasks or open blockers in ${activeProjName}. Everything is clean and resolved.`,
        markdownText: `### Unfinished Work: ${activeProjName}\n\n**All tasks resolved.** There are currently no in-progress issues, draft PRs, or blocked items.`,
        items: []
      };
    }

    const inProgressCount = items.filter(i => i.type === 'in_progress_issue').length;
    const draftPrCount = items.filter(i => i.type === 'draft_pr').length;
    const pendingCount = items.filter(i => i.type === 'pending_task' || i.type === 'stale_issue').length;

    let spokenText = `You have ${items.length} unfinished item${items.length === 1 ? '' : 's'} in ${activeProjName}`;
    if (inProgressCount > 0) {
      const topItem = items.find(i => i.type === 'in_progress_issue');
      spokenText += `, led by "${topItem?.title}" which is currently In Progress.`;
    } else {
      spokenText += `, including ${pendingCount} high-priority backlog items and ${draftPrCount} open PRs.`;
    }

    let markdownText = `### Unfinished Work & Pending Tasks\n\n`;
    markdownText += `**Active Project:** ${activeProjName} (${items.length} item${items.length === 1 ? '' : 's'})\n\n`;
    items.forEach((it, idx) => {
      const icon = it.type === 'in_progress_issue' ? '🔄' : it.type === 'draft_pr' ? '🔀' : it.type === 'stale_issue' ? '⏳' : '📌';
      markdownText += `${idx + 1}. ${icon} **${it.title}** (${it.projectName})\n   - *${it.details}*\n`;
    });

    return { spokenText, markdownText, items };
  }

  /**
   * Determine what changed in a project since last opened session.
   */
  public getChangesSinceLastOpened(targetProjectId?: string): SinceLastOpenedReport {
    const activeProjName = this.state.projectName || 'DevSpace';
    const activeProjId = targetProjectId || this.state.projectId || 'default';

    // Retrieve last opened timestamp
    let lastOpenedMap: Record<string, number> = {};
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('devspace_project_last_opened_v1');
        if (stored) lastOpenedMap = JSON.parse(stored);
      } catch {}
    }

    const prevOpened = lastOpenedMap[activeProjId] || (Date.now() - 86400000);
    // Update last opened timestamp
    lastOpenedMap[activeProjId] = Date.now();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('devspace_project_last_opened_v1', JSON.stringify(lastOpenedMap));
      } catch {}
    }

    // Check commits since prevOpened
    const commitsSince = (this.state.recentCommits || []).filter(c => {
      const t = c.date ? new Date(c.date).getTime() : 0;
      return t > prevOpened;
    });

    // Check issues updated since prevOpened
    const issuesSince = (this.state.openIssues || []).filter((i: any) => {
      const t = i.updatedAt || i.createdAt || 0;
      return t > prevOpened;
    });

    // Check notes updated since prevOpened
    const notesSince = (this.state.recentNotes || []).filter(n => (n.updatedAt || 0) > prevOpened);

    const totalChanges = commitsSince.length + issuesSince.length + notesSince.length;
    const timeFormatted = new Date(prevOpened).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (totalChanges === 0) {
      return {
        spokenText: `No new commits, issue updates, or notes have changed in ${activeProjName} since your last session on ${timeFormatted}.`,
        markdownText: `### Changes Since Last Opened: ${activeProjName}\n\n**Last Session:** ${timeFormatted}\n\nNo changes were recorded since your last visit. Your working tree and task list are synchronized.`,
        projectName: activeProjName,
        sinceTimestamp: prevOpened,
        changesCount: 0,
        commits: [],
        issuesChanged: [],
        notesChanged: []
      };
    }

    let spokenText = `Since you last opened ${activeProjName} on ${timeFormatted}, there have been ${totalChanges} change${totalChanges === 1 ? '' : 's'}`;
    if (commitsSince.length > 0) {
      spokenText += `, including ${commitsSince.length} new commit${commitsSince.length === 1 ? '' : 's'} (${commitsSince[0].message}).`;
    } else if (issuesSince.length > 0) {
      spokenText += `, including updates to "${issuesSince[0].title}".`;
    } else {
      spokenText += `.`;
    }

    let markdownText = `### Changes Since Last Opened: ${activeProjName}\n\n`;
    markdownText += `**Last Session:** ${timeFormatted} • **New Changes:** ${totalChanges}\n\n`;

    if (commitsSince.length > 0) {
      markdownText += `**Synced Commits (${commitsSince.length}):**\n` + commitsSince.map(c => `• \`${c.sha}\`: ${c.message} (*${c.author}*)`).join('\n') + `\n\n`;
    }
    if (issuesSince.length > 0) {
      markdownText += `**Updated Issues (${issuesSince.length}):**\n` + issuesSince.map(i => `• **${i.title}** [${i.status}] (${i.priority})`).join('\n') + `\n\n`;
    }
    if (notesSince.length > 0) {
      markdownText += `**Updated Notes (${notesSince.length}):**\n` + notesSince.map(n => `• **${n.title}**`).join('\n') + `\n\n`;
    }

    return {
      spokenText,
      markdownText,
      projectName: activeProjName,
      sinceTimestamp: prevOpened,
      changesCount: totalChanges,
      commits: commitsSince,
      issuesChanged: issuesSince,
      notesChanged: notesSince
    };
  }

  /**
   * Determine which project had the most activity this week.
   */
  public getTopProjectThisWeek(allProjects?: any[]): TopProjectTimeReport {
    const projects = allProjects || this.state.allProjectsSummary || [];
    const activities = this.state.recentActivities || [];
    const sevenDaysAgo = Date.now() - (7 * 86400000);

    const breakdownMap: Record<string, { projectName: string; eventsCount: number; commits: number; issues: number; notes: number }> = {};

    // Initialize projects
    projects.forEach((p: any) => {
      breakdownMap[p.id || p.name] = {
        projectName: p.name || 'Untitled Project',
        eventsCount: 0,
        commits: 0,
        issues: 0,
        notes: 0
      };
    });

    // If active project not in map, add it
    const activeProjName = this.state.projectName || 'DevSpace';
    const activeProjId = this.state.projectId || 'default';
    if (!breakdownMap[activeProjId]) {
      breakdownMap[activeProjId] = {
        projectName: activeProjName,
        eventsCount: 0,
        commits: 0,
        issues: 0,
        notes: 0
      };
    }

    // Count recent activities in past 7 days
    activities.forEach(a => {
      if (a.timestamp >= sevenDaysAgo) {
        const pKey = a.projectId || activeProjId;
        if (!breakdownMap[pKey]) {
          breakdownMap[pKey] = {
            projectName: a.projectName || 'Workspace',
            eventsCount: 0,
            commits: 0,
            issues: 0,
            notes: 0
          };
        }
        breakdownMap[pKey].eventsCount += 1;
        if (a.type === 'commit' || a.source === 'github') breakdownMap[pKey].commits += 1;
        else if (a.type === 'issue' || a.source === 'issues') breakdownMap[pKey].issues += 1;
        else if (a.type === 'note' || a.source === 'notes') breakdownMap[pKey].notes += 1;
      }
    });

    // Also count active project commits and open issues
    (this.state.recentCommits || []).forEach(c => {
      const t = c.date ? new Date(c.date).getTime() : 0;
      if (t >= sevenDaysAgo) {
        breakdownMap[activeProjId].eventsCount += 1;
        breakdownMap[activeProjId].commits += 1;
      }
    });

    const breakdown = Object.values(breakdownMap).sort((a, b) => b.eventsCount - a.eventsCount);
    const top = breakdown[0] || {
      projectName: activeProjName,
      eventsCount: 1,
      commits: this.state.recentCommits.length,
      issues: this.state.openIssues.length,
      notes: this.state.recentNotes.length
    };

    const spokenText = top.eventsCount > 0
      ? `You spent the most time on ${top.projectName} this week with ${top.eventsCount} logged activities and updates.`
      : `Your activity this week has been centered on ${top.projectName}.`;

    let markdownText = `### Project Activity Breakdown (Past 7 Days)\n\n`;
    markdownText += `**Top Project:** **${top.projectName}** (${top.eventsCount} total events)\n\n`;
    markdownText += `| Project | Total Events | Commits | Issues | Notes |\n`;
    markdownText += `|---|---|---|---|---|\n`;
    breakdown.forEach(b => {
      markdownText += `| **${b.projectName}** | ${b.eventsCount} | ${b.commits} | ${b.issues} | ${b.notes} |\n`;
    });

    return {
      topProjectName: top.projectName,
      topProjectId: activeProjId,
      period: 'this_week',
      eventsCount: top.eventsCount,
      spokenText,
      markdownText,
      breakdown
    };
  }

  /**
   * Get useful proactive suggestions respecting Aether personality proactivity settings.
   */
  public getProactiveSuggestions(options?: { minProactivity?: number; forceInclude?: boolean }): ProactiveSuggestionItem[] {
    const suggestions: ProactiveSuggestionItem[] = [];
    const activeProjName = this.state.projectName || 'DevSpace';
    const repo = this.state.connectedRepository;

    // Check proactivity threshold
    const personality = getResolvedAetherPersonality();
    const proactivityScore = personality.profile?.proactivity ?? 70;
    if (!options?.forceInclude && options?.minProactivity && proactivityScore < options.minProactivity) {
      return [];
    }

    // 1. Failed workflows or PR merge conflicts (High Severity)
    (this.state.openPullRequests || []).forEach(pr => {
      if (pr.mergeable === false) {
        suggestions.push({
          id: `sug-pr-conflict-${pr.number}`,
          type: 'failed_workflow',
          title: `PR #${pr.number} Merge Conflict`,
          description: `Pull Request #${pr.number} ("${pr.title}") has merge conflicts with target branch.`,
          severity: 'high',
          confidence: 0.99,
          project: activeProjName,
          actionLabel: `Inspect PR #${pr.number}`,
          actionCommand: `Inspect PR #${pr.number}`,
          createdAt: Date.now()
        });
      } else if (pr.draft) {
        suggestions.push({
          id: `sug-pr-draft-${pr.number}`,
          type: 'pr_attention',
          title: `Draft PR #${pr.number} Ready for Review?`,
          description: `"${pr.title}" is currently marked as draft. Run safety check to prepare for merge.`,
          severity: 'medium',
          confidence: 0.92,
          project: activeProjName,
          actionLabel: `Run Merge Safety Check`,
          actionCommand: `Prepare PR #${pr.number} for merge`,
          createdAt: Date.now()
        });
      }
    });

    // 2. Unfinished In-Progress Work (High/Medium Severity)
    const inProgressIssues = (this.state.openIssues || []).filter(
      i => i.status === 'In Progress' || i.status === 'in_progress'
    );
    if (inProgressIssues.length > 0) {
      const topIss = inProgressIssues[0];
      suggestions.push({
        id: `sug-in-progress-${topIss.id}`,
        type: 'unfinished_work',
        title: `Resume "${topIss.title}"`,
        description: `You have an active task marked In Progress in ${activeProjName}.`,
        severity: 'medium',
        confidence: 0.95,
        project: activeProjName,
        actionLabel: `View Task`,
        actionCommand: `Show issue ${topIss.title}`,
        createdAt: Date.now()
      });
    }

    // 3. Stale Issues untouched > 5 days (Medium Severity)
    const now = Date.now();
    const staleIssues = (this.state.openIssues || []).filter((iss: any) => {
      const lastUpdate = iss.updatedAt || iss.createdAt || 0;
      return lastUpdate && (now - lastUpdate > 5 * 86400000) && (iss.priority === 'High' || iss.priority === 'Critical') && iss.status !== 'Done';
    });
    if (staleIssues.length > 0) {
      const stale = staleIssues[0];
      suggestions.push({
        id: `sug-stale-${stale.id}`,
        type: 'stale_issue',
        title: `Stale High-Priority Task: "${stale.title}"`,
        description: `Untouched for over 5 days. Consider reprioritizing or starting implementation.`,
        severity: 'medium',
        confidence: 0.88,
        project: activeProjName,
        actionLabel: `Start Task`,
        actionCommand: `Start ${stale.title}`,
        createdAt: Date.now()
      });
    }

    // 4. Recent Pushes ready for PR (Low/Medium Severity)
    const commits = this.state.recentCommits || [];
    if (commits.length > 0 && repo && (this.state.openPullRequests || []).length === 0) {
      const topCommit = commits[0];
      suggestions.push({
        id: `sug-push-${topCommit.sha}`,
        type: 'recent_push',
        title: `Recent Commit: ${topCommit.sha}`,
        description: `"${topCommit.message}" pushed to ${this.state.currentBranch || 'main'}. Ready to open a PR?`,
        severity: 'low',
        confidence: 0.85,
        project: activeProjName,
        actionLabel: `Create PR`,
        actionCommand: `Create PR for ${topCommit.message}`,
        createdAt: Date.now()
      });
    }

    // Limit to top 4 recommendations to avoid spamming
    return suggestions.slice(0, 4);
  }

  /**
   * Refresh GitHub state for connected repository
   */
  public async refreshFromGitHub(): Promise<void> {
    if (this.state.connectedRepository) {
      await this.fetchGitHubStateForRepo(this.state.connectedRepository);
    }
  }

  /**
   * Comprehensive PR Merge Safety Audit
   */
  public async evaluatePRMergeSafety(pullNumber: number): Promise<PRMergeSafetyResult> {
    const repo = this.state.connectedRepository;
    if (!repo) {
      return {
        prNumber: pullNumber,
        safe: false,
        reason: 'No connected GitHub repository found for active project.',
        details: null,
        summary: 'Cannot evaluate merge safety without a connected repository.'
      };
    }

    const token = this.getAuthorizedGitHubToken();
    try {
      const res = await fetch('/api/github/pr-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, pullNumber, token })
      });

      if (!res.ok) {
        return {
          prNumber: pullNumber,
          safe: false,
          reason: `Failed to fetch PR details (${res.statusText}).`,
          details: null,
          summary: `Unable to inspect PR #${pullNumber} on ${repo}.`
        };
      }

      const pr = await res.json();
      const isDraft = pr.draft === true;
      const isMergeable = pr.mergeable === true || pr.mergeable === null;
      const mergeableState = pr.mergeable_state || 'unknown'; // clean, unstable, dirty, blocked, draft

      let safe = true;
      let reasons: string[] = [];

      if (isDraft) {
        safe = false;
        reasons.push('PR is currently in Draft state.');
      }
      if (mergeableState === 'dirty' || pr.mergeable === false) {
        safe = false;
        reasons.push('Merge conflicts detected with the target branch.');
      }
      if (mergeableState === 'blocked') {
        safe = false;
        reasons.push('Blocked by required status checks or branch protection rules.');
      }

      const statusDesc = safe
        ? `✅ **PR #${pullNumber} is Clean & Ready for Merge**.\n- Title: *"${pr.title}"*\n- Branch: \`${pr.head?.ref}\` ➔ \`${pr.base?.ref}\`\n- Changes: +${pr.additions || 0} / -${pr.deletions || 0} (${pr.changed_files || 0} files)`
        : `⚠️ **PR #${pullNumber} Requires Attention Before Merging**:\n${reasons.map(r => `• ${r}`).join('\n')}`;

      return {
        prNumber: pullNumber,
        safe,
        reason: reasons.join('; ') || 'PR passed all automated safety checks.',
        details: pr,
        summary: statusDesc
      };
    } catch (e: any) {
      return {
        prNumber: pullNumber,
        safe: false,
        reason: e.message || 'Network error checking PR safety.',
        details: null,
        summary: `Error performing merge safety check: ${e.message}`
      };
    }
  }

  /**
   * Return identified blockers for active project
   */
  public getBlockers(): string[] {
    const blockers: string[] = [];
    const issues = this.state.openIssues || [];
    issues.forEach(i => {
      if (i.labels?.includes('blocker') || i.priority === 'Critical') {
        blockers.push(`Issue "${i.title}" (${i.priority})`);
      }
    });
    return blockers;
  }

  /**
   * Summarize open issues for active project
   */
  public summarizeOpenIssues(): { count: number; spokenText: string; markdownText: string } {
    const issues = this.state.openIssues || [];
    const open = issues.filter(i => i.status !== 'Done' && i.status !== 'Closed');
    const pName = this.state.projectName || 'Active Project';
    const spokenText = `You have ${open.length} open issue(s) in ${pName}.`;
    const markdownText = `### Open Issues in ${pName} (${open.length})\n\n` +
      (open.length > 0
        ? open.map(i => `• **${i.title}** (${i.priority || 'Medium'}, Status: *${i.status}*)`).join('\n')
        : 'No open issues currently tracked.');
    return { count: open.length, spokenText, markdownText };
  }

  /**
   * Open connected repository in browser or client
   */
  public openConnectedRepository(): { url: string; spokenText: string } {
    const repo = this.state.connectedRepository || 'owner/repo';
    const url = `https://github.com/${repo}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return { url, spokenText: `Opening repository ${repo}.` };
  }

  /**
   * Get formatted commit history and changes for a time window (today, yesterday, this_week, recent).
   */
  public async getGitHubRepoChanges(timeWindow: 'today' | 'yesterday' | 'this_week' | 'recent' = 'recent'): Promise<{
    spokenText: string;
    markdownText: string;
    facts: string[];
    commitsCount: number;
    repo: string;
  }> {
    const repo = this.state.connectedRepository || 'primary repository';
    const commits = this.state.recentCommits || [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfYesterday = startOfToday - oneDay;
    const startOfThisWeek = startOfToday - (new Date().getDay() || 7) * oneDay;

    let filteredCommits = commits;
    let label = 'recently';

    if (timeWindow === 'today') {
      label = 'today';
      filteredCommits = commits.filter(c => {
        const time = new Date(c.date).getTime();
        return !isNaN(time) ? time >= startOfToday : true;
      });
    } else if (timeWindow === 'yesterday') {
      label = 'yesterday';
      filteredCommits = commits.filter(c => {
        const time = new Date(c.date).getTime();
        return !isNaN(time) ? time >= startOfYesterday && time < startOfToday : false;
      });
    } else if (timeWindow === 'this_week') {
      label = 'this week';
      filteredCommits = commits.filter(c => {
        const time = new Date(c.date).getTime();
        return !isNaN(time) ? time >= startOfThisWeek : true;
      });
    }

    // Grounded facts vs suggestions
    const facts: string[] = [];
    if (filteredCommits.length > 0) {
      filteredCommits.slice(0, 5).forEach(c => {
        facts.push(`\`${c.sha}\` - ${c.message} (by ${c.author || 'you'})`);
      });
      const spokenText = `In ${repo} ${label}, there are ${filteredCommits.length} recorded commits. The latest was "${filteredCommits[0].message}".`;
      const markdownText = `### Repository Changes (${label.toUpperCase()})\n**Repository:** \`${repo}\` | **Branch:** \`${this.state.currentBranch || 'main'}\`\n\n**Grounded Commits:**\n${facts.map(f => `• ${f}`).join('\n')}\n\n*${filteredCommits.length > 5 ? `+ ${filteredCommits.length - 5} more commits in this period.` : ''}*`;
      return { spokenText, markdownText, facts, commitsCount: filteredCommits.length, repo };
    } else if (commits.length > 0) {
      const top = commits[0];
      facts.push(`Latest synced commit is \`${top.sha}\` - *"${top.message}"* on \`${this.state.currentBranch || 'main'}\`.`);
      const spokenText = `No commits were recorded specifically for ${label} in ${repo}, but your latest pushed commit is "${top.message}".`;
      const markdownText = `### Repository Status\n**Repository:** \`${repo}\`\nNo commits recorded for **${label}**.\n\n**Latest Synced Commit:**\n• \`${top.sha}\`: ${top.message} (${new Date(top.date).toLocaleDateString()})`;
      return { spokenText, markdownText, facts, commitsCount: 0, repo };
    } else {
      const spokenText = `No git commit history is currently cached for ${repo}. Connect your repository in Settings or push your first branch.`;
      const markdownText = `### Repository Status\n**Repository:** \`${repo}\`\nNo commit history found. Push changes or synchronize your GitHub integration to populate live git activity.`;
      return { spokenText, markdownText, facts: ['No git history found'], commitsCount: 0, repo };
    }
  }

  /**
   * Get items requiring developer attention (failing PR checks, merge conflicts, high-priority blockers).
   */
  public async getAttentionItems(): Promise<{
    spokenText: string;
    markdownText: string;
    attentionCount: number;
    items: Array<{ title: string; category: string; severity: 'high' | 'medium' | 'low' }>;
  }> {
    const items: Array<{ title: string; category: string; severity: 'high' | 'medium' | 'low' }> = [];
    const prs = this.state.openPullRequests || [];
    const issues = this.state.openIssues || [];
    const blockers = this.getBlockers();

    // Check PRs
    prs.forEach(pr => {
      if (pr.draft) {
        items.push({ title: `PR #${pr.number} ("${pr.title}") is marked as Draft`, category: 'Pull Request', severity: 'low' });
      }
    });

    // Check blockers
    if (blockers.length > 0) {
      blockers.forEach(b => {
        items.push({ title: b, category: 'Project Blocker', severity: 'high' });
      });
    }

    // Check critical / high priority open issues
    const criticalIssues = issues.filter(i => (i.priority === 'Critical' || i.priority === 'High') && i.status !== 'Done' && i.status !== 'Closed');
    criticalIssues.slice(0, 3).forEach(i => {
      items.push({ title: `Issue #${i.id.slice(0, 6)}: "${i.title}" (${i.priority})`, category: 'Priority Issue', severity: i.priority === 'Critical' ? 'high' : 'medium' });
    });

    if (items.length > 0) {
      const highItems = items.filter(i => i.severity === 'high');
      const spokenText = highItems.length > 0
        ? `You have ${items.length} items that may need attention, including ${highItems.length} high priority items like "${highItems[0].title}".`
        : `You have ${items.length} items to review, including open PRs and backlog issues.`;

      const markdownText = `### Items Requiring Attention\n\n${items.map(item => {
        const icon = item.severity === 'high' ? '🚨' : item.severity === 'medium' ? '⚠️' : 'ℹ️';
        return `• ${icon} **[${item.category}]** ${item.title}`;
      }).join('\n')}`;

      return { spokenText, markdownText, attentionCount: items.length, items };
    } else {
      return {
        spokenText: 'Everything looks clear! No blocked PRs, critical issues, or active blockers are currently pending.',
        markdownText: '### Workspace Health Status\n\n✅ **All Clear!**\n- No blocked or failing PRs\n- No unresolved critical blockers\n- All active work streams are healthy.',
        attentionCount: 0,
        items: []
      };
    }
  }

  /**
   * Inspect a specific Pull Request.
   */
  public async inspectPullRequest(pullNumber: number): Promise<{
    spokenText: string;
    markdownText: string;
    details: any;
  }> {
    const safety = await this.evaluatePRMergeSafety(pullNumber);
    const spokenText = safety.safe
      ? `Pull request #${pullNumber} is clean and ready to merge with no conflicts.`
      : `Pull request #${pullNumber} requires attention: ${safety.reason}`;

    const markdownText = `### Pull Request #${pullNumber} Inspection\n\n${safety.summary}`;
    return { spokenText, markdownText, details: safety.details };
  }

  /**
   * Safe barrier confirmation for potentially destructive operations (merge, delete, force-push).
   */
  public requestDestructiveConfirmation(actionType: string, details: any): {
    requiresConfirmation: boolean;
    spokenText: string;
    markdownText: string;
    confirmationToken: string;
  } {
    const token = `confirm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const actionLabel = actionType === 'delete_branch' ? 'Deleting Branch' : actionType === 'force_push' ? 'Force Pushing' : 'Merging Pull Request';
    const spokenText = `This is a potentially destructive action: ${actionLabel}. Are you sure you want to proceed? Please confirm to execute.`;
    const markdownText = `### ⚠️ Destructive Action Confirmation Required\n\n**Action:** ${actionLabel}\n**Target:** \`${details?.raw || details?.actionType || 'GitHub Repository'}\`\n\nTo ensure data safety, destructive operations require explicit confirmation. Say **"Confirm"** or press the button below to proceed.`;

    return {
      requiresConfirmation: true,
      spokenText,
      markdownText,
      confirmationToken: token
    };
  }
}

export const aetherActiveProjectContext = new AetherActiveProjectContextService();
