import { activityCenter } from './activityCenterService';

export type GoalCategory = 'personal' | 'career' | 'coding' | 'business' | 'health' | 'learning' | 'financial';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

export interface AetherGoal {
  id: string;
  title: string;
  category: GoalCategory;
  targetDate?: string;
  progress: number; // 0 - 100
  milestones: GoalMilestone[];
  relatedProjectIds: string[];
  relatedPlannerTaskIds: string[];
  relatedReminderIds: string[];
  status: 'active' | 'completed' | 'deferred';
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'aether_goals_v1';

class AetherGoalsService {
  private goals: AetherGoal[] = [];

  constructor() {
    this.loadGoals();
    this.initDefaultsIfEmpty();
  }

  private loadGoals() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.goals = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load goals from storage:', e);
      this.goals = [];
    }
  }

  private saveGoals() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.goals));
    } catch (e) {
      console.warn('Failed to save goals to storage:', e);
    }
  }

  private initDefaultsIfEmpty() {
    if (this.goals.length === 0) {
      const now = Date.now();
      this.goals = [
        {
          id: 'goal-1',
          title: 'Ship DevSpace 3.0 Production Release',
          category: 'coding',
          targetDate: '2026-09-15',
          progress: 65,
          milestones: [
            { id: 'm-1', title: 'Aether Core Simplification & Storage Fixes', completed: true },
            { id: 'm-2', title: 'n8n Automation Builder Integration', completed: true },
            { id: 'm-3', title: 'Final Desktop Package & Release Tagging', completed: false },
          ],
          relatedProjectIds: [],
          relatedPlannerTaskIds: [],
          relatedReminderIds: [],
          status: 'active',
          createdAt: now - 864000000,
          updatedAt: now,
        },
        {
          id: 'goal-2',
          title: 'Save $25,000 in DevSpace Treasury by December',
          category: 'financial',
          targetDate: '2026-12-31',
          progress: 40,
          milestones: [
            { id: 'm-201', title: 'Reach $10,000 ARR milestone', completed: true },
            { id: 'm-202', title: 'Automate SaaS subscription billing', completed: false },
          ],
          relatedProjectIds: [],
          relatedPlannerTaskIds: [],
          relatedReminderIds: [],
          status: 'active',
          createdAt: now - 1200000000,
          updatedAt: now,
        },
        {
          id: 'goal-3',
          title: 'Complete 4 Workouts Each Week',
          category: 'health',
          targetDate: '2026-12-31',
          progress: 75,
          milestones: [
            { id: 'm-301', title: 'Schedule calendar focus blocks for cardio & lifting', completed: true },
            { id: 'm-302', title: 'Track weekly workout consistency', completed: true },
          ],
          relatedProjectIds: [],
          relatedPlannerTaskIds: [],
          relatedReminderIds: [],
          status: 'active',
          createdAt: now - 400000000,
          updatedAt: now,
        },
      ];
      this.saveGoals();
    }
  }

  public getGoals(): AetherGoal[] {
    return [...this.goals];
  }

  public getActiveGoals(): AetherGoal[] {
    return this.goals.filter(g => g.status === 'active');
  }

  public createGoal(
    title: string,
    category: GoalCategory = 'coding',
    targetDate?: string,
    milestoneTitles: string[] = []
  ): AetherGoal {
    const milestones: GoalMilestone[] = milestoneTitles.map((t, idx) => ({
      id: `m-${Date.now()}-${idx}`,
      title: t,
      completed: false,
    }));

    const newGoal: AetherGoal = {
      id: `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title.trim(),
      category,
      targetDate,
      progress: 0,
      milestones,
      relatedProjectIds: [],
      relatedPlannerTaskIds: [],
      relatedReminderIds: [],
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.goals.unshift(newGoal);
    this.saveGoals();

    activityCenter.addNotification({
      title: 'Long-Term Goal Created',
      message: `Goal "${newGoal.title}" (${newGoal.category.toUpperCase()}) recorded.`,
      type: 'info',
      summary: 'Goal Set',
      reason: 'WHY: Developer added long-term target in Aether Hub.',
    });

    return newGoal;
  }

  public updateGoalProgress(id: string, progress: number) {
    const goal = this.goals.find(g => g.id === id);
    if (goal) {
      goal.progress = Math.min(100, Math.max(0, progress));
      if (goal.progress === 100) goal.status = 'completed';
      goal.updatedAt = Date.now();
      this.saveGoals();
    }
  }

  public toggleMilestone(goalId: string, milestoneId: string) {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal) {
      const ms = goal.milestones.find(m => m.id === milestoneId);
      if (ms) {
        ms.completed = !ms.completed;
        const completedCount = goal.milestones.filter(m => m.completed).length;
        if (goal.milestones.length > 0) {
          goal.progress = Math.round((completedCount / goal.milestones.length) * 100);
        }
        goal.updatedAt = Date.now();
        this.saveGoals();
      }
    }
  }

  public addMilestoneToGoal(goalId: string, title: string) {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal && title.trim()) {
      goal.milestones.push({
        id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: title.trim(),
        completed: false,
      });
      const completedCount = goal.milestones.filter(m => m.completed).length;
      goal.progress = Math.round((completedCount / goal.milestones.length) * 100);
      goal.updatedAt = Date.now();
      this.saveGoals();
    }
  }

  public deleteGoal(id: string) {
    this.goals = this.goals.filter(g => g.id !== id);
    this.saveGoals();
  }
}

export const aetherGoals = new AetherGoalsService();
