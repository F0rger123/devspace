import { aetherCore, PersonalMemoryItem } from './aetherCore';

export interface MilestoneEntry {
  id: string;
  date: string;
  timestamp: number;
  title: string;
  description: string;
  whyItMattered: string;
  category: 'workspace' | 'dream' | 'git' | 'agent' | 'focus' | 'release';
  relatedProjects?: string[];
  relatedDreams?: string[];
}

export interface AchievementEntry {
  id: string;
  title: string;
  context: string;
  evidence: string;
  relatedWork: string;
  historicalComparison: string;
  impact: string;
  unlockedAt: number;
  badgeIcon: string;
}

export interface GoalEntry {
  id: string;
  title: string;
  targetDate: string;
  category: 'feature' | 'quality' | 'launch' | 'productivity';
  status: 'in_progress' | 'completed' | 'deferred';
  progressPct: number;
  linkedDreams: string[];
  linkedIssues: string[];
  notes: string;
}

export interface ImprovementSuggestion {
  id: string;
  timestamp: number;
  title: string;
  observation: string;
  suggestedAction: string;
  expectedBenefit: string;
  confidencePct: number;
  status: 'pending' | 'approved' | 'rejected' | 'testing_one_week' | 'never_ask_again';
}

export type TrustLevel = 'Observer' | 'Assistant' | 'Planner' | 'Automation Partner' | 'Delegated Assistant';

export interface TrustLevelConfig {
  currentLevel: TrustLevel;
  unlockedCapabilities: string[];
  lastLevelChange: number;
  userApprovedAutomations: string[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: 'project' | 'dream' | 'issue' | 'file' | 'agent' | 'skill' | 'goal' | 'milestone';
  details: string;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relationship: string;
}

class AetherRelationshipServiceManager {
  private milestones: MilestoneEntry[] = [];
  private achievements: AchievementEntry[] = [];
  private goals: GoalEntry[] = [];
  private improvements: ImprovementSuggestion[] = [];
  private trustConfig: TrustLevelConfig = {
    currentLevel: 'Planner',
    unlockedCapabilities: [
      'Observe workspace activity & suggest improvements',
      'Prepare automated code diffs & branch proposals',
      'Create multi-step execution plans in Aether Planner',
    ],
    lastLevelChange: Date.now() - 86400000 * 14,
    userApprovedAutomations: ['Auto-run linting on save', 'Auto-generate release notes', 'Auto-hydrate memory cortex'],
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    this.milestones = [
      {
        id: 'ms-1',
        date: '2026-07-15',
        timestamp: Date.now() - 86400000 * 22,
        title: 'First DevSpace Workspace Initialized',
        description: 'Bootstrapped DevSpace Aether Desktop container and configured Electron preload bridge.',
        whyItMattered: 'Established core desktop application lifecycle and IPC communication baseline.',
        category: 'workspace',
        relatedProjects: ['DevSpace Desktop Core'],
      },
      {
        id: 'ms-2',
        date: '2026-07-28',
        timestamp: Date.now() - 86400000 * 9,
        title: '100th Dream Approved & Merged',
        description: 'Successfully reached 100 merged Dreams in the background dream engine deck.',
        whyItMattered: 'Demonstrated high user-AI alignment in autonomous code generation.',
        category: 'dream',
        relatedProjects: ['DevSpace Platform'],
        relatedDreams: ['Dream #100 - Zero-Downtime Migration'],
      },
      {
        id: 'ms-3',
        date: '2026-08-01',
        timestamp: Date.now() - 86400000 * 5,
        title: 'First Production Cloud Run Release (v2.5.0)',
        description: 'Executed end-to-end release pipeline with automated changelogs and zero regression.',
        whyItMattered: 'Proved production readiness and seamless integration deployment.',
        category: 'release',
        relatedProjects: ['Aether Core'],
      },
    ];

    this.achievements = [
      {
        id: 'ach-1',
        title: 'First Production Release',
        context: 'Deployed v2.5.0 to Google Cloud Run container ecosystem.',
        evidence: 'GitHub Release Tag v2.5.0 + Docker CJS bundle verification.',
        relatedWork: 'Phase 6.3 Reliability & Health Engine',
        historicalComparison: 'Completed 30% faster than previous sprint cycles.',
        impact: 'Full availability for dev workspace team with zero downtime.',
        unlockedAt: Date.now() - 86400000 * 5,
        badgeIcon: 'Rocket',
      },
      {
        id: 'ach-2',
        title: '30 Consecutive Focus Sessions',
        context: 'Maintained deep concentration cycles using Dynamic Island Focus HUD.',
        evidence: '30 logged 45m+ focus sessions without distraction interruptions.',
        relatedWork: 'Phase 7.0 Focus & Presence Coach',
        historicalComparison: 'Focus duration increased by 42% over 30 days.',
        impact: 'Accelerated core feature velocity while maintaining zero burn-out.',
        unlockedAt: Date.now() - 86400000 * 2,
        badgeIcon: 'Flame',
      },
      {
        id: 'ach-3',
        title: '50% Technical Debt Reduction',
        context: 'Refactored duplicate React state, stale IPC listeners, and type definitions.',
        evidence: 'Zero tsc errors & clean 100% test suite passage.',
        relatedWork: 'Production Hardening Audit',
        historicalComparison: 'Replaced legacy stubs with verified live execution.',
        impact: 'Improved bundle execution speed and memory efficiency.',
        unlockedAt: Date.now() - 86400000 * 1,
        badgeIcon: 'ShieldCheck',
      },
    ];

    this.goals = [
      {
        id: 'goal-1',
        title: 'Ship DevSpace Aether v3.0 Production Release',
        targetDate: '2026-08-30',
        category: 'launch',
        status: 'in_progress',
        progressPct: 85,
        linkedDreams: ['Dream #42', 'Dream #108'],
        linkedIssues: ['ISSUE-104', 'ISSUE-112'],
        notes: 'Final verification suites passing. Relationship intelligence & zero-trust privacy active.',
      },
      {
        id: 'goal-2',
        title: 'Reach 95% Automated Verification Coverage',
        targetDate: '2026-08-15',
        category: 'quality',
        status: 'in_progress',
        progressPct: 100,
        linkedDreams: ['Dream #88'],
        linkedIssues: ['ISSUE-99'],
        notes: '13/13 automated runtime verification tests passing in Aether Health Diagnostics.',
      },
    ];

    this.improvements = [
      {
        id: 'imp-1',
        timestamp: Date.now() - 3600000,
        title: 'Auto-Squash Dream Commits',
        observation: 'You consistently squash Dream commits manually during Git review.',
        suggestedAction: 'Automatically apply squash-and-merge strategy to all approved Dreams.',
        expectedBenefit: 'Saves ~2 minutes per Dream review and keeps Git history clean.',
        confidencePct: 96,
        status: 'pending',
      },
      {
        id: 'imp-2',
        timestamp: Date.now() - 7200000,
        title: 'Optimize Evening Deployment Reminders',
        observation: 'You consistently defer or decline deployment prompts sent after 6 PM.',
        suggestedAction: 'Suppress production deployment prompts after 6 PM local time.',
        expectedBenefit: 'Reduces evening cognitive fatigue and respects quiet hours.',
        confidencePct: 92,
        status: 'pending',
      },
    ];
  }

  // --- MILESTONES & TIMELINE ---
  public getMilestones(): MilestoneEntry[] {
    return [...this.milestones];
  }

  public addMilestone(entry: Omit<MilestoneEntry, 'id' | 'timestamp'>): MilestoneEntry {
    const newEntry: MilestoneEntry = {
      ...entry,
      id: `ms-${Date.now()}`,
      timestamp: Date.now(),
    };
    this.milestones.unshift(newEntry);
    return newEntry;
  }

  // --- ACHIEVEMENTS ---
  public getAchievements(): AchievementEntry[] {
    return [...this.achievements];
  }

  // --- GOALS ---
  public getGoals(): GoalEntry[] {
    return [...this.goals];
  }

  public addGoal(goal: Omit<GoalEntry, 'id' | 'progressPct'>): GoalEntry {
    const newGoal: GoalEntry = {
      ...goal,
      id: `goal-${Date.now()}`,
      progressPct: 0,
    };
    this.goals.unshift(newGoal);
    return newGoal;
  }

  public updateGoalProgress(id: string, progressPct: number, status?: GoalEntry['status']) {
    const g = this.goals.find((item) => item.id === id);
    if (g) {
      g.progressPct = Math.min(100, Math.max(0, progressPct));
      if (status) g.status = status;
    }
  }

  // --- IMPROVEMENT QUEUE ---
  public getImprovementSuggestions(): ImprovementSuggestion[] {
    return [...this.improvements];
  }

  public updateImprovementStatus(id: string, status: ImprovementSuggestion['status']) {
    const imp = this.improvements.find((item) => item.id === id);
    if (imp) {
      imp.status = status;
      if (status === 'approved') {
        aetherCore.addMemory({
          topic: `Learned Preference: ${imp.title}`,
          fact: `${imp.suggestedAction} (User Approved Improvement)`,
          category: 'git_workflow',
          confidence: imp.confidencePct,
          source: 'learned_pattern',
          importance: 'high',
          editable: true,
          tags: ['improvement_approved', 'behavioral'],
        });
      }
    }
  }

  // --- TRUST ENGINE ---
  public getTrustConfig(): TrustLevelConfig {
    return { ...this.trustConfig };
  }

  public requestTrustUpgrade(targetLevel: TrustLevel): TrustLevelConfig {
    const levels: TrustLevel[] = ['Observer', 'Assistant', 'Planner', 'Automation Partner', 'Delegated Assistant'];
    const capabilityMap: Record<TrustLevel, string[]> = {
      Observer: ['Observe workspace activity & suggest improvements'],
      Assistant: ['Observe workspace activity', 'Prepare automated code diffs & branch proposals'],
      Planner: ['Observe workspace activity', 'Prepare automated code diffs', 'Create multi-step execution plans in Aether Planner'],
      'Automation Partner': [
        'Observe workspace activity',
        'Prepare automated code diffs',
        'Create execution plans',
        'Execute previously approved workflows autonomously',
      ],
      'Delegated Assistant': [
        'Full autonomous delegation',
        'Auto-repeat workflows explicitly approved',
        'Background dream hydration & self-healing',
      ],
    };

    this.trustConfig.currentLevel = targetLevel;
    this.trustConfig.unlockedCapabilities = capabilityMap[targetLevel];
    this.trustConfig.lastLevelChange = Date.now();

    return { ...this.trustConfig };
  }

  // --- WEEKLY REFLECTIONS & MONTHLY REPORTS ---
  public generateWeeklyReflection() {
    return {
      period: 'Week of Aug 01 - Aug 07, 2026',
      summary: 'High-velocity sprint focused on Aether platform reliability, automated verification suites, and presence coaching.',
      projectsCompleted: 2,
      dreamsReviewed: 14,
      issuesResolved: 8,
      techDebtReductionPct: 35,
      focusQualityScore: '96 / 100 (Deep Focus)',
      plannerAccuracyPct: 94,
      biggestAccomplishment: 'Achieved 100% automated runtime verification passage across 13 core subsystems.',
      mostProductiveSession: 'Tuesday morning (09:30 - 12:15) with 110m continuous focus duration.',
      mostDifficultProblem: 'Ensuring zero-downtime ESM bundle generation for custom Express server.',
      areasForImprovement: 'Batching PR reviews to avoid mid-afternoon context switches.',
      suggestedPrioritiesNextWeek: [
        'Finalize v3.0 production tag release',
        'Expand camera-assisted focus posture sensitivity',
        'Maintain zero unhandled IPC crashes in desktop runtime',
      ],
    };
  }

  public generateMonthlyReport() {
    return {
      month: 'August 2026',
      observations: [
        'You consistently review code faster before lunch (avg 2.8m vs 6.1m in afternoon).',
        'Your suggestion acceptance rate has reached 96% across Aether core recommendations.',
        'Focus sessions on Tuesdays & Thursdays yield 40% higher commit output than Mondays.',
        'Dream approval efficiency improved by 52% following the single-click review deck integration.',
      ],
      topSkillsUsed: ['Google Calendar API', 'GitHub Intelligence', 'Sentry Error Monitor'],
      totalFocusHours: 42.5,
      totalCommitsMerged: 128,
    };
  }

  // --- KNOWLEDGE GRAPH ---
  public getKnowledgeGraph(): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
    return {
      nodes: [
        { id: 'proj-1', label: 'DevSpace Platform', type: 'project', details: 'Full-stack Electron & Cloud Run app' },
        { id: 'dream-42', label: 'Dream #42 (AST Types)', type: 'dream', details: 'Automated type safety generator' },
        { id: 'goal-1', label: 'Ship v3.0 Release', type: 'goal', details: 'Target: Aug 30, 2026' },
        { id: 'agent-dev', label: 'Aether Dev Agent', type: 'agent', details: 'Core development agent' },
        { id: 'skill-git', label: 'GitHub Intelligence', type: 'skill', details: 'OAuth connected' },
        { id: 'ms-3', label: 'Milestone: Production v2.5.0', type: 'milestone', details: 'Cloud Run deployed' },
      ],
      edges: [
        { source: 'proj-1', target: 'goal-1', relationship: 'tracks_towards' },
        { source: 'goal-1', target: 'dream-42', relationship: 'requires_dream' },
        { source: 'dream-42', target: 'agent-dev', relationship: 'executed_by' },
        { source: 'agent-dev', target: 'skill-git', relationship: 'uses_skill' },
        { source: 'proj-1', target: 'ms-3', relationship: 'achieved_milestone' },
      ],
    };
  }
}

export const aetherRelationshipService = new AetherRelationshipServiceManager();
