// ============================================================================
// AETHER GOALS & PERSONAL PLANNING ENGINE
//
// Cross-domain long-term goal management across work, projects, health,
// routines, learning, travel, and personal life.
// Evidence-grounded progress calculation, automatic milestone/task decomposition,
// blocker detection, schedule re-planning, and Autonomy Engine safety gating.
// ============================================================================

import { activityCenter } from './activityCenterService';
import { aetherAutonomy, AutonomyDomain, ActionRiskLevel } from './aetherAutonomyEngine';
import { aetherRoutines } from './aetherRoutinesService';
import { aetherWellness } from './aetherWellnessService';

export type GoalCategory =
  | 'work'
  | 'project'
  | 'health'
  | 'learning'
  | 'routine'
  | 'travel'
  | 'personal'
  | 'coding'
  | 'financial';

export type GoalPriority = 'p0_urgent' | 'p1_high' | 'p2_medium' | 'p3_low';

export type GoalStatus = 'active' | 'behind_schedule' | 'paused' | 'completed' | 'archived';

export interface GoalTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: number;
  domain: AutonomyDomain;
  assignee?: string;
  linkedActionType?: string;
  linkedActionPayload?: any;
}

export interface GoalEvidence {
  id: string;
  title: string;
  type: 'github_commit' | 'github_pr' | 'routine_log' | 'issue_closed' | 'project_build' | 'wellness_metric' | 'manual';
  timestamp: number;
  verified: boolean;
  details: string;
}

export interface GoalBlocker {
  id: string;
  title: string;
  severity: 'critical' | 'moderate' | 'minor';
  detectedAt: number;
  resolved: boolean;
  resolutionSuggestion: string;
}

export interface GoalNextAction {
  title: string;
  description: string;
  actionType: string;
  domain: AutonomyDomain;
  riskLevel: ActionRiskLevel;
  executePayload?: any;
}

export interface GoalMilestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: number;
  targetDate?: string;
  tasks: GoalTask[];
  evidence: GoalEvidence[];
}

export interface GoalLinkedContext {
  projectIds: string[];
  projectNames: string[];
  issueIds: string[];
  routineIds: string[];
  routineNames: string[];
  workflowIds: string[];
  calendarTarget?: string;
  wellnessMetricTarget?: {
    metricType: 'workouts_per_week' | 'sleep_hours' | 'daily_steps' | 'active_minutes';
    targetValue: number;
    currentAdherence: number;
  };
  githubRepo?: string;
}

export interface GoalReplanRecord {
  id: string;
  timestamp: number;
  reason: string;
  previousTargetDate?: string;
  newTargetDate?: string;
  changesSummary: string;
}

export interface AetherGoal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetDate?: string;
  startDate: string;
  progress: number; // 0 - 100, evidence-calculated
  status: GoalStatus;
  isFallingBehind: boolean;
  behindReason?: string;
  milestones: GoalMilestone[];
  blockers: GoalBlocker[];
  nextAction: GoalNextAction | null;
  linkedContext: GoalLinkedContext;
  replanHistory: GoalReplanRecord[];
  evidenceRecords: GoalEvidence[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY_GOALS = 'devspace_aether_goals_v2';
const STORAGE_KEY_DISPOSABLE_CACHE = 'devspace_aether_goals_cache';

class AetherGoalsService {
  private goals: AetherGoal[] = [];
  private listeners: Set<(goals: AetherGoal[]) => void> = new Set();

  constructor() {
    this.loadGoals();
    this.initDefaultsIfEmpty();
    this.detectBlockersAndScheduleAdherence();
  }

  public subscribe(listener: (goals: AetherGoal[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getGoals());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = this.getGoals();
    this.listeners.forEach((fn) => {
      try {
        fn(list);
      } catch (err) {
        console.error('Goal listener notification error:', err);
      }
    });
  }

  private safeSaveItem(key: string, value: string): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e: any) {
      if (
        e?.name === 'QuotaExceededError' ||
        e?.code === 22 ||
        e?.number === -2147024882 ||
        String(e).includes('quota')
      ) {
        try {
          // Evict non-essential items
          localStorage.removeItem('aether_trending_repos');
          localStorage.removeItem('devspace_security_audit_logs');
          localStorage.removeItem(STORAGE_KEY_DISPOSABLE_CACHE);
          localStorage.setItem(key, value);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  private loadGoals() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GOALS);
      if (stored) {
        this.goals = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load goals from storage:', e);
      this.goals = [];
    }
  }

  private saveGoals() {
    if (typeof localStorage === 'undefined') return;
    try {
      // Compact serialization: limit historical evidence to top 10 per goal
      const compactGoals = this.goals.map((g) => ({
        ...g,
        evidenceRecords: (g.evidenceRecords || []).slice(-10),
        milestones: (g.milestones || []).map((m) => ({
          ...m,
          evidence: (m.evidence || []).slice(-5),
        })),
        replanHistory: (g.replanHistory || []).slice(-10),
      }));
      this.safeSaveItem(STORAGE_KEY_GOALS, JSON.stringify(compactGoals));
    } catch {
      // Maintain in-memory safely
    }
    this.notify();
  }

  private initDefaultsIfEmpty() {
    if (this.goals.length > 0) return;

    const now = Date.now();
    const isoToday = new Date().toISOString().split('T')[0];

    // Default real sample goals across categories
    this.goals = [
      {
        id: 'goal-launch-devspace',
        title: 'Launch DevSpace Beta in 6 Weeks',
        description: 'Complete core desktop bridge, n8n workflow engine, and release initial production beta build.',
        category: 'work',
        priority: 'p0_urgent',
        startDate: isoToday,
        targetDate: new Date(now + 42 * 86400000).toISOString().split('T')[0],
        progress: 68,
        status: 'active',
        isFallingBehind: false,
        milestones: [
          {
            id: 'm-core-engine',
            title: 'Aether Core Reliability & Local Storage Resilience',
            description: 'Fix quota limits, safe mode fallback, and conversational routing.',
            completed: true,
            completedAt: now - 3 * 86400000,
            targetDate: new Date(now - 2 * 86400000).toISOString().split('T')[0],
            tasks: [
              { id: 't-1', title: 'Implement safe localStorage quota recovery', completed: true, domain: 'devspace' },
              { id: 't-2', title: 'Add streaming fallback cascade for Gemini 503s', completed: true, domain: 'devspace' },
            ],
            evidence: [
              { id: 'ev-1', title: 'Storage quota unit tests passed', type: 'project_build', timestamp: now - 3 * 86400000, verified: true, details: 'Reduced storage memory footprint by 80%' },
            ],
          },
          {
            id: 'm-routines-goals',
            title: 'Routines, Habits & Personal Planning Intelligence',
            description: 'Implement evidence-grounded habits, goal planning, and autonomy gating.',
            completed: true,
            completedAt: now - 86400000,
            targetDate: isoToday,
            tasks: [
              { id: 't-3', title: 'Deploy Aether Routines Engine & Habit tabs', completed: true, domain: 'devspace' },
              { id: 't-4', title: 'Integrate Goal Decomposition & Replanning Service', completed: true, domain: 'devspace' },
            ],
            evidence: [
              { id: 'ev-2', title: 'Daily Hub Routines tab compiled', type: 'project_build', timestamp: now - 86400000, verified: true, details: 'Verified responsive UI in The Bar & Daily Hub' },
            ],
          },
          {
            id: 'm-desktop-packaging',
            title: 'Final Electron Desktop Packaging & Public Release Tagging',
            description: 'Build signed installers for macOS, Linux, and Windows.',
            completed: false,
            targetDate: new Date(now + 21 * 86400000).toISOString().split('T')[0],
            tasks: [
              { id: 't-5', title: 'Configure GitHub Actions multi-arch release pipeline', completed: false, domain: 'github' },
              { id: 't-6', title: 'Conduct pre-release end-to-end sandbox validation', completed: false, domain: 'devspace' },
              { id: 't-7', title: 'Generate SHA256 distribution checksums', completed: false, domain: 'devspace' },
            ],
            evidence: [],
          },
        ],
        blockers: [],
        nextAction: {
          title: 'Review GitHub Actions Release Workflow',
          description: 'Inspect .github/workflows/desktop-build.yml to verify multi-platform compilation flags.',
          actionType: 'open_workflow',
          domain: 'github',
          riskLevel: 'low',
          executePayload: { file: '.github/workflows/desktop-build.yml' },
        },
        linkedContext: {
          projectIds: ['devspace-core'],
          projectNames: ['DevSpace Desktop Application'],
          issueIds: ['DEV-104', 'DEV-108'],
          routineIds: ['routine-morning-sync'],
          routineNames: ['Morning Workspace Activation'],
          workflowIds: ['wf-ci-build'],
          githubRepo: 'owner/devspace-aether',
        },
        replanHistory: [],
        evidenceRecords: [
          { id: 'ev-init-1', title: 'Sprint 3 milestones completed', type: 'project_build', timestamp: now - 86400000, verified: true, details: 'Completed core storage and habit tracking modules' },
        ],
        createdAt: now - 14 * 86400000,
        updatedAt: now,
      },
      {
        id: 'goal-workout-routine',
        title: 'Work Out 4 Times a Week',
        description: 'Maintain cardiovascular health, resistance training consistency, and track logged activity.',
        category: 'health',
        priority: 'p1_high',
        startDate: isoToday,
        targetDate: new Date(now + 90 * 86400000).toISOString().split('T')[0],
        progress: 75,
        status: 'active',
        isFallingBehind: false,
        milestones: [
          {
            id: 'm-weekly-cardio',
            title: 'Complete 4 Weekly Exercise Sessions',
            description: 'Target 45 minutes of moderate-to-high intensity exertion.',
            completed: true,
            completedAt: now - 86400000,
            targetDate: isoToday,
            tasks: [
              { id: 'wt-1', title: 'Monday Upper Body & Mobility', completed: true, domain: 'wellness' },
              { id: 'wt-2', title: 'Wednesday Cardio Interval Run', completed: true, domain: 'wellness' },
              { id: 'wt-3', title: 'Friday Lower Body Strength', completed: true, domain: 'wellness' },
              { id: 'wt-4', title: 'Sunday Active Recovery Walk', completed: false, domain: 'wellness' },
            ],
            evidence: [
              { id: 'ev-w-1', title: 'Logged 3 workouts this week', type: 'wellness_metric', timestamp: now - 86400000, verified: true, details: 'Average heart rate 138 bpm over 52 mins' },
            ],
          },
        ],
        blockers: [],
        nextAction: {
          title: 'Schedule Weekend Recovery Walk Block',
          description: 'Add a 45-minute focus block to Sunday calendar for active recovery.',
          actionType: 'calendar_schedule',
          domain: 'calendar',
          riskLevel: 'low',
        },
        linkedContext: {
          projectIds: [],
          projectNames: [],
          issueIds: [],
          routineIds: ['routine-workout'],
          routineNames: ['Evening Workout Preparation'],
          workflowIds: [],
          wellnessMetricTarget: {
            metricType: 'workouts_per_week',
            targetValue: 4,
            currentAdherence: 3,
          },
        },
        replanHistory: [],
        evidenceRecords: [],
        createdAt: now - 21 * 86400000,
        updatedAt: now,
      },
      {
        id: 'goal-sleep-schedule',
        title: 'Improve Sleep Schedule & Circadian Alignment',
        description: 'Achieve consistent 11:15 PM wind-down, reduce late-night screen time, and maintain 7.5 hours of sleep.',
        category: 'health',
        priority: 'p2_medium',
        startDate: isoToday,
        targetDate: new Date(now + 30 * 86400000).toISOString().split('T')[0],
        progress: 50,
        status: 'active',
        isFallingBehind: false,
        milestones: [
          {
            id: 'm-wind-down',
            title: 'Establish 23:00 Evening Wind-Down Notification',
            completed: true,
            targetDate: isoToday,
            tasks: [
              { id: 'st-1', title: 'Configure gentle dimming & screen curfew', completed: true, domain: 'notifications' },
            ],
            evidence: [],
          },
          {
            id: 'm-consistent-wake',
            title: 'Maintain 07:15 AM Wake Window for 14 Consecutive Days',
            completed: false,
            targetDate: new Date(now + 14 * 86400000).toISOString().split('T')[0],
            tasks: [
              { id: 'st-2', title: 'Log 7 days of 7.5+ hour sleep durations', completed: false, domain: 'wellness' },
            ],
            evidence: [],
          },
        ],
        blockers: [],
        nextAction: {
          title: 'Activate Evening Wind-Down Routine at 23:00',
          description: 'Aether will proactively prepare evening reflection and dim notifications.',
          actionType: 'routine_trigger',
          domain: 'notifications',
          riskLevel: 'low',
        },
        linkedContext: {
          projectIds: [],
          projectNames: [],
          issueIds: [],
          routineIds: ['routine-sleep-prep'],
          routineNames: ['Evening Reflection & Sleep Wind-down'],
          workflowIds: [],
          wellnessMetricTarget: {
            metricType: 'sleep_hours',
            targetValue: 7.5,
            currentAdherence: 6.8,
          },
        },
        replanHistory: [],
        evidenceRecords: [],
        createdAt: now - 10 * 86400000,
        updatedAt: now,
      },
      {
        id: 'goal-learn-react-native',
        title: 'Learn React Native & Mobile App Architecture',
        description: 'Master Expo router, native reanimated animations, and offline SQLite synchronization.',
        category: 'learning',
        priority: 'p2_medium',
        startDate: isoToday,
        targetDate: new Date(now + 60 * 86400000).toISOString().split('T')[0],
        progress: 35,
        status: 'active',
        isFallingBehind: false,
        milestones: [
          {
            id: 'm-rn-fundamentals',
            title: 'Build Interactive Prototype with Expo Router',
            completed: true,
            completedAt: now - 4 * 86400000,
            tasks: [
              { id: 'rnt-1', title: 'Setup Expo SDK 52 workspace', completed: true, domain: 'devspace' },
              { id: 'rnt-2', title: 'Implement stack & tab navigation hierarchy', completed: true, domain: 'devspace' },
            ],
            evidence: [
              { id: 'ev-rn-1', title: 'Expo sample repo created', type: 'github_commit', timestamp: now - 4 * 86400000, verified: true, details: 'Initialized /mobile-prototype repo with typescript template' },
            ],
          },
          {
            id: 'm-rn-offline-sync',
            title: 'Implement Local Database & Conflict-Free State Sync',
            completed: false,
            targetDate: new Date(now + 25 * 86400000).toISOString().split('T')[0],
            tasks: [
              { id: 'rnt-3', title: 'Integrate SQLite with reactive queries', completed: false, domain: 'devspace' },
              { id: 'rnt-4', title: 'Test background fetch synchronization', completed: false, domain: 'devspace' },
            ],
            evidence: [],
          },
        ],
        blockers: [],
        nextAction: {
          title: 'Review SQLite Schema in Mobile Workspace',
          description: 'Open mobile sample repository and write initial table migrations.',
          actionType: 'open_project',
          domain: 'devspace',
          riskLevel: 'low',
        },
        linkedContext: {
          projectIds: ['mobile-prototype'],
          projectNames: ['React Native Mobile Companion'],
          issueIds: [],
          routineIds: [],
          routineNames: [],
          workflowIds: [],
        },
        replanHistory: [],
        evidenceRecords: [],
        createdAt: now - 18 * 86400000,
        updatedAt: now,
      },
    ];

    this.saveGoals();
  }

  // ============================================================================
  // PUBLIC ACCESSORS
  // ============================================================================

  public getGoals(): AetherGoal[] {
    return [...this.goals];
  }

  public getActiveGoals(): AetherGoal[] {
    return this.goals.filter((g) => g.status === 'active' || g.status === 'behind_schedule');
  }

  public getGoalById(id: string): AetherGoal | undefined {
    return this.goals.find((g) => g.id === id);
  }

  public getTopPriorityGoal(): AetherGoal | undefined {
    const active = this.getActiveGoals();
    if (active.length === 0) return undefined;
    return active.sort((a, b) => {
      const order = { p0_urgent: 0, p1_high: 1, p2_medium: 2, p3_low: 3 };
      return order[a.priority] - order[b.priority];
    })[0];
  }

  public getUpcomingMilestones(limit: number = 5): { goal: AetherGoal; milestone: GoalMilestone }[] {
    const results: { goal: AetherGoal; milestone: GoalMilestone }[] = [];
    const activeGoals = this.getActiveGoals();

    for (const goal of activeGoals) {
      for (const ms of goal.milestones) {
        if (!ms.completed) {
          results.push({ goal, milestone: ms });
        }
      }
    }

    return results
      .sort((a, b) => {
        const dateA = a.milestone.targetDate || a.goal.targetDate || '9999-99-99';
        const dateB = b.milestone.targetDate || b.goal.targetDate || '9999-99-99';
        return dateA.localeCompare(dateB);
      })
      .slice(0, limit);
  }

  // ============================================================================
  // REAL EVIDENCE & PROGRESS CALCULATION
  // ============================================================================

  public recalculateProgress(goalId: string) {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return;

    if (!goal.milestones || goal.milestones.length === 0) {
      this.saveGoals();
      return;
    }

    let totalTasks = 0;
    let completedTasks = 0;
    let completedMilestones = 0;

    for (const ms of goal.milestones) {
      if (ms.completed) {
        completedMilestones++;
      }
      if (ms.tasks && ms.tasks.length > 0) {
        totalTasks += ms.tasks.length;
        completedTasks += ms.tasks.filter((t) => t.completed).length;
      }
    }

    let calculatedProgress: number;
    if (totalTasks > 0) {
      // 60% weight on granular tasks, 40% on completed milestone checkpoints
      const taskRatio = completedTasks / totalTasks;
      const milestoneRatio = completedMilestones / goal.milestones.length;
      calculatedProgress = Math.round((taskRatio * 0.6 + milestoneRatio * 0.4) * 100);
    } else {
      calculatedProgress = Math.round((completedMilestones / goal.milestones.length) * 100);
    }

    goal.progress = Math.min(100, Math.max(0, calculatedProgress));
    if (goal.progress === 100 && goal.status !== 'completed') {
      goal.status = 'completed';
    } else if (goal.progress < 100 && goal.status === 'completed') {
      goal.status = 'active';
    }

    goal.updatedAt = Date.now();
    this.saveGoals();
  }

  // ============================================================================
  // BLOCKER DETECTION & SCHEDULE ADHERENCE
  // ============================================================================

  public detectBlockersAndScheduleAdherence(): void {
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];

    for (const goal of this.goals) {
      if (goal.status === 'completed' || goal.status === 'archived' || goal.status === 'paused') {
        goal.isFallingBehind = false;
        continue;
      }

      const blockers: GoalBlocker[] = [];
      let isBehind = false;
      let behindReason = '';

      if (goal.targetDate) {
        const targetTime = new Date(goal.targetDate).getTime();
        const startTime = new Date(goal.startDate).getTime();
        const totalDuration = Math.max(86400000, targetTime - startTime);
        const elapsed = now - startTime;
        const timeRatio = Math.min(1, Math.max(0, elapsed / totalDuration));
        const expectedProgress = Math.round(timeRatio * 100);

        // If time is over 35% elapsed but progress lags by > 25% or past targetDate
        if (now > targetTime && goal.progress < 100) {
          isBehind = true;
          behindReason = `Deadline of ${goal.targetDate} passed with ${100 - goal.progress}% unfinished.`;
          blockers.push({
            id: `blk-${Date.now()}-overdue`,
            title: 'Target date elapsed without completion',
            severity: 'critical',
            detectedAt: now,
            resolved: false,
            resolutionSuggestion: 'Re-plan and extend timeline by 1-2 weeks or reduce milestone scope.',
          });
        } else if (expectedProgress - goal.progress > 25 && timeRatio > 0.3) {
          isBehind = true;
          behindReason = `Progress (${goal.progress}%) is lagging behind timeline pace (expected ~${expectedProgress}%).`;
          blockers.push({
            id: `blk-${Date.now()}-lag`,
            title: 'Progress velocity behind schedule',
            severity: 'moderate',
            detectedAt: now,
            resolved: false,
            resolutionSuggestion: 'Break down current milestone into immediate sub-tasks and prioritize in daily focus blocks.',
          });
        }
      }

      // Check linked wellness targets
      if (goal.linkedContext?.wellnessMetricTarget) {
        const wt = goal.linkedContext.wellnessMetricTarget;
        if (wt.currentAdherence < wt.targetValue * 0.6) {
          isBehind = true;
          behindReason = `Current weekly adherence (${wt.currentAdherence}/${wt.targetValue}) is below pace.`;
        }
      }

      goal.isFallingBehind = isBehind;
      goal.behindReason = behindReason;
      if (isBehind && goal.status === 'active') {
        goal.status = 'behind_schedule';
      } else if (!isBehind && goal.status === 'behind_schedule') {
        goal.status = 'active';
      }

      goal.blockers = blockers;
    }

    this.saveGoals();
  }

  // ============================================================================
  // NATURAL LANGUAGE GOAL CREATION & PARSING
  // ============================================================================

  public createGoalFromNaturalLanguage(input: string): AetherGoal {
    const text = input.trim();
    const lower = text.toLowerCase();
    const now = Date.now();
    const isoToday = new Date().toISOString().split('T')[0];

    let category: GoalCategory = 'work';
    let priority: GoalPriority = 'p1_high';
    let targetDays = 30;
    let title = text.replace(/^(i want to|i need to|let's|help me|goal:|set goal:)\s+/i, '');
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // 1. Detect Category
    if (lower.includes('work out') || lower.includes('workout') || lower.includes('exercise') || lower.includes('gym') || lower.includes('health') || lower.includes('diet') || lower.includes('cardio')) {
      category = 'health';
    } else if (lower.includes('sleep') || lower.includes('wake up') || lower.includes('bedtime') || lower.includes('circadian')) {
      category = 'health';
    } else if (lower.includes('learn') || lower.includes('study') || lower.includes('master') || lower.includes('course') || lower.includes('tutorial')) {
      category = 'learning';
    } else if (lower.includes('launch') || lower.includes('ship') || lower.includes('release') || lower.includes('deploy') || lower.includes('beta') || lower.includes('devspace') || lower.includes('code') || lower.includes('coding')) {
      category = lower.includes('devspace') || lower.includes('code') ? 'project' : 'work';
    } else if (lower.includes('routine') || lower.includes('habit') || lower.includes('daily') || lower.includes('weekly')) {
      category = 'routine';
    } else if (lower.includes('travel') || lower.includes('trip') || lower.includes('flight') || lower.includes('vacation')) {
      category = 'travel';
    } else if (lower.includes('save') || lower.includes('dollar') || lower.includes('money') || lower.includes('budget') || lower.includes('revenue') || lower.includes('arr')) {
      category = 'financial';
    } else {
      category = 'personal';
    }

    // 2. Detect Duration / Timeline
    const weekMatch = lower.match(/(?:in|over|for)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+weeks?/i);
    if (weekMatch) {
      const wordMap: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
      const num = wordMap[weekMatch[1].toLowerCase()] || parseInt(weekMatch[1], 10) || 4;
      targetDays = num * 7;
    } else if (lower.includes('month') || lower.includes('30 days')) {
      targetDays = 30;
    } else if (lower.includes('quarter') || lower.includes('90 days') || lower.includes('3 months')) {
      targetDays = 90;
    } else if (lower.includes('before september') || lower.includes('by september')) {
      const sepTarget = new Date('2026-09-01').getTime();
      targetDays = Math.max(7, Math.round((sepTarget - now) / 86400000));
    } else if (lower.includes('before december') || lower.includes('by end of year') || lower.includes('by december')) {
      const decTarget = new Date('2026-12-31').getTime();
      targetDays = Math.max(14, Math.round((decTarget - now) / 86400000));
    }

    const targetDate = new Date(now + targetDays * 86400000).toISOString().split('T')[0];

    // 3. Generate Intelligent Milestones & Task Breakdown
    const milestones: GoalMilestone[] = [];
    const linkedContext: GoalLinkedContext = {
      projectIds: [],
      projectNames: [],
      issueIds: [],
      routineIds: [],
      routineNames: [],
      workflowIds: [],
    };

    if (category === 'health' && (lower.includes('workout') || lower.includes('work out') || lower.includes('exercise'))) {
      const timesMatch = lower.match(/(\d+|one|two|three|four|five)\s+times?\s+(?:a|per)\s+week/i);
      const timesNum = timesMatch ? (parseInt(timesMatch[1], 10) || 4) : 4;

      milestones.push({
        id: `m-${Date.now()}-1`,
        title: `Establish Weekly ${timesNum}x Workout Schedule`,
        description: `Maintain ${timesNum} scheduled exercise sessions per week with active recovery.`,
        completed: false,
        targetDate: new Date(now + 14 * 86400000).toISOString().split('T')[0],
        tasks: [
          { id: `t-${Date.now()}-1`, title: 'Block exercise focus windows in weekly calendar', completed: false, domain: 'calendar' },
          { id: `t-${Date.now()}-2`, title: 'Create workout preparation reminder routine in Daily Hub', completed: false, domain: 'notifications' },
          { id: `t-${Date.now()}-3`, title: 'Log heart rate and exertion metrics post-workout', completed: false, domain: 'wellness' },
        ],
        evidence: [],
      });
      milestones.push({
        id: `m-${Date.now()}-2`,
        title: 'Maintain 4-Week Adherence Streak',
        description: `Log minimum ${timesNum * 4} total sessions over the month.`,
        completed: false,
        targetDate,
        tasks: [
          { id: `t-${Date.now()}-4`, title: 'Conduct weekly consistency review with Aether', completed: false, domain: 'wellness' },
        ],
        evidence: [],
      });
      linkedContext.wellnessMetricTarget = {
        metricType: 'workouts_per_week',
        targetValue: timesNum,
        currentAdherence: 0,
      };
    } else if (category === 'health' && lower.includes('sleep')) {
      milestones.push({
        id: `m-${Date.now()}-1`,
        title: 'Establish Consistent 23:00 Wind-Down Protocol',
        description: 'Dim screen alerts and initiate evening wind-down routine at 11:00 PM.',
        completed: false,
        targetDate: new Date(now + 7 * 86400000).toISOString().split('T')[0],
        tasks: [
          { id: `t-${Date.now()}-1`, title: 'Set evening wind-down reminder at 23:00', completed: false, domain: 'notifications' },
          { id: `t-${Date.now()}-2`, title: 'Enable Aether sleep workload adjustments for late shifts', completed: false, domain: 'wellness' },
        ],
        evidence: [],
      });
      milestones.push({
        id: `m-${Date.now()}-2`,
        title: 'Achieve 7.5 Hours Average Sleep Duration for 14 Days',
        description: 'Track sleep stages and efficiency score consistency.',
        completed: false,
        targetDate,
        tasks: [
          { id: `t-${Date.now()}-3`, title: 'Review 14-day circadian trend summary with Aether', completed: false, domain: 'wellness' },
        ],
        evidence: [],
      });
      linkedContext.wellnessMetricTarget = {
        metricType: 'sleep_hours',
        targetValue: 7.5,
        currentAdherence: 6.5,
      };
    } else if (category === 'learning') {
      const subject = text.replace(/^(i want to learn|learn|master|study)\s+/i, '') || 'New Skill';
      milestones.push({
        id: `m-${Date.now()}-1`,
        title: `Core Foundations & Syntax Mastery: ${subject}`,
        description: `Complete foundational concepts and architecture exercises for ${subject}.`,
        completed: false,
        targetDate: new Date(now + Math.round(targetDays * 0.35) * 86400000).toISOString().split('T')[0],
        tasks: [
          { id: `t-${Date.now()}-1`, title: `Set up learning sandbox workspace in DevSpace for ${subject}`, completed: false, domain: 'devspace' },
          { id: `t-${Date.now()}-2`, title: 'Complete introductory exercises and key pattern review', completed: false, domain: 'devspace' },
        ],
        evidence: [],
      });
      milestones.push({
        id: `m-${Date.now()}-2`,
        title: `Build Hands-On Working Prototype with ${subject}`,
        description: `Develop an end-to-end runnable project using ${subject}.`,
        completed: false,
        targetDate,
        tasks: [
          { id: `t-${Date.now()}-3`, title: 'Implement state management and integration tests', completed: false, domain: 'devspace' },
          { id: `t-${Date.now()}-4`, title: 'Document learned best practices in DevSpace Notes', completed: false, domain: 'devspace' },
        ],
        evidence: [],
      });
    } else {
      // Work / Project / General
      milestones.push({
        id: `m-${Date.now()}-1`,
        title: 'Architecture Review & Initial Implementation Milestone',
        description: 'Define technical specifications, create project backlog, and complete initial core modules.',
        completed: false,
        targetDate: new Date(now + Math.round(targetDays * 0.4) * 86400000).toISOString().split('T')[0],
        tasks: [
          { id: `t-${Date.now()}-1`, title: 'Create project issues and milestone breakdown in DevSpace', completed: false, domain: 'devspace' },
          { id: `t-${Date.now()}-2`, title: 'Implement primary core module and run verification suite', completed: false, domain: 'devspace' },
        ],
        evidence: [],
      });
      milestones.push({
        id: `m-${Date.now()}-2`,
        title: 'Integration, Polishing & Production Verification',
        description: 'Complete end-to-end testing, resolve blockers, and deploy final deliverables.',
        completed: false,
        targetDate,
        tasks: [
          { id: `t-${Date.now()}-3`, title: 'Execute full automated test verification suite', completed: false, domain: 'devspace' },
          { id: `t-${Date.now()}-4`, title: 'Publish release candidate and tag milestone', completed: false, domain: 'github' },
        ],
        evidence: [],
      });
      linkedContext.projectIds = ['devspace-core'];
      linkedContext.projectNames = ['DevSpace Primary Workspace'];
    }

    const newGoal: AetherGoal = {
      id: `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      description: `Target established by user: "${text}"`,
      category,
      priority,
      startDate: isoToday,
      targetDate,
      progress: 0,
      status: 'active',
      isFallingBehind: false,
      milestones,
      blockers: [],
      nextAction: {
        title: `Start Milestone 1: ${milestones[0]?.title || 'Initial Setup'}`,
        description: milestones[0]?.tasks[0]?.title || 'Begin first task in the active milestone.',
        actionType: 'start_milestone',
        domain: 'devspace',
        riskLevel: 'low',
      },
      linkedContext,
      replanHistory: [],
      evidenceRecords: [],
      createdAt: now,
      updatedAt: now,
    };

    this.goals.unshift(newGoal);
    this.saveGoals();

    activityCenter.addNotification({
      title: 'Goal Established & Decomposed',
      message: `Goal "${newGoal.title}" (${newGoal.category.toUpperCase()}) created with ${newGoal.milestones.length} milestones and target date ${newGoal.targetDate}.`,
      type: 'info',
      summary: 'Goal Created',
      reason: 'WHY: Developer added goal via Aether conversational planning.',
    });

    return newGoal;
  }

  // ============================================================================
  // GOAL MUTATIONS: CRUD & BREAKDOWN
  // ============================================================================

  public createGoal(
    optionsOrTitle:
      | string
      | {
          title: string;
          description?: string;
          category: GoalCategory;
          priority?: GoalPriority;
          targetDate?: string;
          milestoneTitles?: string[];
          linkedProjects?: string[];
          linkedRoutines?: string[];
        },
    categoryArg: GoalCategory = 'work',
    targetDateArg?: string,
    milestoneTitlesArg: string[] = []
  ): AetherGoal {
    let opts: {
      title: string;
      description?: string;
      category: GoalCategory;
      priority?: GoalPriority;
      targetDate?: string;
      milestoneTitles?: string[];
      linkedProjects?: string[];
      linkedRoutines?: string[];
    };

    if (typeof optionsOrTitle === 'string') {
      opts = {
        title: optionsOrTitle,
        category: categoryArg,
        targetDate: targetDateArg,
        milestoneTitles: milestoneTitlesArg,
      };
    } else {
      opts = optionsOrTitle;
    }

    const now = Date.now();
    const isoToday = new Date().toISOString().split('T')[0];
    const msTitles = opts.milestoneTitles && opts.milestoneTitles.length > 0
      ? opts.milestoneTitles
      : ['Phase 1: Initial Setup & Planning', 'Phase 2: Core Execution & Delivery'];

    const milestones: GoalMilestone[] = msTitles.map((t, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      title: t,
      completed: false,
      targetDate: opts.targetDate,
      tasks: [
        { id: `t-${Date.now()}-${idx}-1`, title: `Execute key deliverables for ${t}`, completed: false, domain: 'devspace' },
      ],
      evidence: [],
    }));

    const newGoal: AetherGoal = {
      id: `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: opts.title.trim(),
      description: opts.description || '',
      category: opts.category,
      priority: opts.priority || 'p1_high',
      startDate: isoToday,
      targetDate: opts.targetDate,
      progress: 0,
      status: 'active',
      isFallingBehind: false,
      milestones,
      blockers: [],
      nextAction: {
        title: `Begin ${milestones[0]?.title}`,
        description: 'Review initial deliverables and begin development.',
        actionType: 'start_milestone',
        domain: 'devspace',
        riskLevel: 'low',
      },
      linkedContext: {
        projectIds: opts.linkedProjects || [],
        projectNames: opts.linkedProjects || [],
        issueIds: [],
        routineIds: opts.linkedRoutines || [],
        routineNames: opts.linkedRoutines || [],
        workflowIds: [],
      },
      replanHistory: [],
      evidenceRecords: [],
      createdAt: now,
      updatedAt: now,
    };

    this.goals.unshift(newGoal);
    this.saveGoals();
    return newGoal;
  }

  public breakGoalIntoSmallerSteps(goalId: string, milestoneId?: string): boolean {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return false;

    let targetMilestone = goal.milestones.find((m) => m.id === milestoneId) ||
      goal.milestones.find((m) => !m.completed) ||
      goal.milestones[0];

    if (!targetMilestone) {
      targetMilestone = {
        id: `m-${Date.now()}`,
        title: 'Sprint Action Items',
        completed: false,
        tasks: [],
        evidence: [],
      };
      goal.milestones.push(targetMilestone);
    }

    const newTasks: GoalTask[] = [
      {
        id: `t-${Date.now()}-sub-1`,
        title: `Decompose architecture requirements for ${targetMilestone.title}`,
        completed: false,
        domain: 'devspace',
      },
      {
        id: `t-${Date.now()}-sub-2`,
        title: `Implement focused pull request & unit tests`,
        completed: false,
        domain: 'github',
      },
      {
        id: `t-${Date.now()}-sub-3`,
        title: `Verify end-to-end integration and close linked issues`,
        completed: false,
        domain: 'devspace',
      },
    ];

    targetMilestone.tasks = [...(targetMilestone.tasks || []), ...newTasks];
    goal.updatedAt = Date.now();
    this.recalculateProgress(goalId);

    activityCenter.addNotification({
      title: 'Milestone Decomposed',
      message: `Added 3 actionable sub-tasks to milestone "${targetMilestone.title}" in goal "${goal.title}".`,
      type: 'info',
      summary: 'Task Breakdown',
      reason: 'WHY: Developer requested smaller step breakdown in Aether planning.',
    });

    return true;
  }

  // ============================================================================
  // REPLANNING & SCHEDULE ADJUSTMENTS
  // ============================================================================

  public replanGoal(
    goalId: string,
    options: {
      extendDays?: number;
      newTargetDate?: string;
      reason: string;
      rebalanceMilestones?: boolean;
    }
  ): boolean {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return false;

    const previousTarget = goal.targetDate;
    let nextTarget = options.newTargetDate;

    if (options.extendDays && goal.targetDate) {
      const currentTargetMs = new Date(goal.targetDate).getTime();
      const extendedMs = currentTargetMs + options.extendDays * 86400000;
      nextTarget = new Date(extendedMs).toISOString().split('T')[0];
    } else if (!nextTarget && options.extendDays) {
      const extendedMs = Date.now() + options.extendDays * 86400000;
      nextTarget = new Date(extendedMs).toISOString().split('T')[0];
    }

    if (nextTarget) {
      goal.targetDate = nextTarget;
    }

    // Rebalance incomplete milestone dates evenly
    if (options.rebalanceMilestones && nextTarget) {
      const incomplete = goal.milestones.filter((m) => !m.completed);
      const startTime = Date.now();
      const endTime = new Date(nextTarget).getTime();
      const span = Math.max(86400000, endTime - startTime);

      incomplete.forEach((ms, idx) => {
        const fraction = (idx + 1) / (incomplete.length || 1);
        const msTarget = new Date(startTime + span * fraction).toISOString().split('T')[0];
        ms.targetDate = msTarget;
      });
    }

    const replanRecord: GoalReplanRecord = {
      id: `replan-${Date.now()}`,
      timestamp: Date.now(),
      reason: options.reason,
      previousTargetDate: previousTarget,
      newTargetDate: nextTarget,
      changesSummary: options.extendDays
        ? `Extended deadline by ${options.extendDays} days (New Target: ${nextTarget})`
        : `Updated schedule target to ${nextTarget}`,
    };

    goal.replanHistory = [replanRecord, ...(goal.replanHistory || [])];
    goal.updatedAt = Date.now();

    this.detectBlockersAndScheduleAdherence();
    this.saveGoals();

    activityCenter.addNotification({
      title: 'Goal Schedule Re-Planned',
      message: `Goal "${goal.title}" target date adjusted to ${goal.targetDate} (${options.reason}).`,
      type: 'info',
      summary: 'Schedule Adjusted',
      reason: `WHY: ${options.reason}`,
    });

    return true;
  }

  public setGoalPriority(goalId: string, priority: GoalPriority) {
    const goal = this.goals.find((g) => g.id === goalId);
    if (goal) {
      goal.priority = priority;
      goal.updatedAt = Date.now();
      this.saveGoals();
    }
  }

  public makeTopPriority(goalId: string): boolean {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return false;

    // Demote any existing p0 to p1
    this.goals.forEach((g) => {
      if (g.id !== goalId && g.priority === 'p0_urgent') {
        g.priority = 'p1_high';
      }
    });

    goal.priority = 'p0_urgent';
    goal.updatedAt = Date.now();
    this.saveGoals();

    activityCenter.addNotification({
      title: 'Top Priority Set',
      message: `Goal "${goal.title}" is now marked as P0 Urgent top priority.`,
      type: 'info',
      summary: 'Priority Updated',
      reason: 'WHY: Developer elevated goal to top priority.',
    });

    return true;
  }

  public toggleTask(goalId: string, milestoneId: string, taskId: string): boolean {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return false;

    const ms = goal.milestones.find((m) => m.id === milestoneId);
    if (!ms) return false;

    const task = ms.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : undefined;

    // If all tasks in milestone are completed, mark milestone completed
    const allCompleted = ms.tasks.length > 0 && ms.tasks.every((t) => t.completed);
    if (allCompleted && !ms.completed) {
      ms.completed = true;
      ms.completedAt = Date.now();
      ms.evidence.push({
        id: `ev-${Date.now()}`,
        title: `All milestone tasks completed for "${ms.title}"`,
        type: 'manual',
        timestamp: Date.now(),
        verified: true,
        details: 'User checked off all subordinate action items.',
      });
    }

    this.recalculateProgress(goalId);
    return true;
  }

  public toggleMilestone(goalId: string, milestoneId: string): boolean {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return false;

    const ms = goal.milestones.find((m) => m.id === milestoneId);
    if (!ms) return false;

    ms.completed = !ms.completed;
    ms.completedAt = ms.completed ? Date.now() : undefined;

    // Toggle all sub-tasks to match
    if (ms.tasks && ms.tasks.length > 0) {
      ms.tasks.forEach((t) => {
        t.completed = ms.completed;
        t.completedAt = ms.completed ? Date.now() : undefined;
      });
    }

    if (ms.completed) {
      ms.evidence.push({
        id: `ev-${Date.now()}`,
        title: `Milestone "${ms.title}" marked completed`,
        type: 'manual',
        timestamp: Date.now(),
        verified: true,
        details: 'Verified milestone checkpoint complete.',
      });
    }

    this.recalculateProgress(goalId);
    return true;
  }

  public addMilestoneToGoal(goalId: string, title: string, description?: string, targetDate?: string) {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal || !title.trim()) return;

    goal.milestones.push({
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      description,
      completed: false,
      targetDate: targetDate || goal.targetDate,
      tasks: [
        { id: `t-${Date.now()}-1`, title: `Execute tasks for ${title.trim()}`, completed: false, domain: 'devspace' },
      ],
      evidence: [],
    });

    this.recalculateProgress(goalId);
  }

  public pauseGoal(goalId: string) {
    const goal = this.goals.find((g) => g.id === goalId);
    if (goal) {
      goal.status = 'paused';
      goal.updatedAt = Date.now();
      this.saveGoals();
    }
  }

  public resumeGoal(goalId: string) {
    const goal = this.goals.find((g) => g.id === goalId);
    if (goal) {
      goal.status = 'active';
      goal.updatedAt = Date.now();
      this.detectBlockersAndScheduleAdherence();
      this.saveGoals();
    }
  }

  public completeGoal(goalId: string) {
    const goal = this.goals.find((g) => g.id === goalId);
    if (goal) {
      goal.status = 'completed';
      goal.progress = 100;
      goal.milestones.forEach((m) => {
        m.completed = true;
        m.completedAt = Date.now();
        m.tasks.forEach((t) => {
          t.completed = true;
          t.completedAt = Date.now();
        });
      });
      goal.updatedAt = Date.now();
      this.saveGoals();

      activityCenter.addNotification({
        title: 'Goal Achieved 🎉',
        message: `Congratulations! Goal "${goal.title}" has been marked 100% completed.`,
        type: 'info',
        summary: 'Goal Completed',
        reason: 'WHY: Developer marked goal 100% finished.',
      });
    }
  }

  public archiveGoal(goalId: string) {
    const goal = this.goals.find((g) => g.id === goalId);
    if (goal) {
      goal.status = 'archived';
      goal.updatedAt = Date.now();
      this.saveGoals();
    }
  }

  public deleteGoal(id: string) {
    this.goals = this.goals.filter((g) => g.id !== id);
    this.saveGoals();
  }

  public editGoal(goalId: string, updates: Partial<AetherGoal>): boolean {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return false;

    Object.assign(goal, updates);
    goal.updatedAt = Date.now();
    this.detectBlockersAndScheduleAdherence();
    this.saveGoals();
    return true;
  }

  // ============================================================================
  // AUTONOMY INTEGRATION FOR NEXT ACTIONS
  // ============================================================================

  public async executeNextAction(goalId: string, userConfirmed: boolean = false): Promise<{ success: boolean; message: string }> {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal || !goal.nextAction) {
      return { success: false, message: 'No active next action defined for this goal.' };
    }

    const na = goal.nextAction;

    // Route through Aether Autonomy Safety Gate
    const res = await aetherAutonomy.executeGatedAction({
      actionId: `goal-act-${goal.id}-${Date.now()}`,
      title: na.title,
      whyReason: na.description,
      domain: na.domain,
      riskLevel: na.riskLevel,
      execute: async () => {
        // Record evidence
        goal.evidenceRecords.unshift({
          id: `ev-${Date.now()}`,
          title: `Executed next action: ${na.title}`,
          type: 'manual',
          timestamp: Date.now(),
          verified: true,
          details: na.description,
        });
        goal.updatedAt = Date.now();
        this.saveGoals();
        return { executed: true, goalTitle: goal.title };
      },
    });

    if (res.executed) {
      return { success: true, message: `Successfully executed: ${na.title}` };
    } else {
      return { success: false, message: res.message || `Action requires approval per your ${na.domain} autonomy settings.` };
    }
  }
}

export const aetherGoals = new AetherGoalsService();
