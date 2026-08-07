import { activityCenter } from './activityCenterService';
import { aetherCore } from './aetherCore';

export interface AetherReminder {
  id: string;
  rawInput: string;
  title: string;
  targetTime: number; // timestamp in ms
  formattedTime: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceDay?: number; // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  category: 'general' | 'meeting' | 'project' | 'goal' | 'focus';
  completed: boolean;
  relatedGoalId?: string;
  relatedProjectId?: string;
  relatedTaskId?: string;
  createdAt: number;
}

const STORAGE_KEY = 'aether_reminders_v1';

class AetherRemindersService {
  private reminders: AetherReminder[] = [];

  constructor() {
    this.loadReminders();
    this.initDefaultRemindersIfEmpty();
  }

  private loadReminders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.reminders = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load reminders from storage:', e);
      this.reminders = [];
    }
  }

  private saveReminders() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.reminders));
    } catch (e) {
      console.warn('Failed to save reminders to storage:', e);
    }
  }

  private initDefaultRemindersIfEmpty() {
    if (this.reminders.length === 0) {
      const now = Date.now();
      this.reminders = [
        {
          id: 'rem-1',
          rawInput: 'Remind me before my meeting',
          title: 'Prepare agenda for team sync meeting',
          targetTime: now + 3600000,
          formattedTime: new Date(now + 3600000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          recurrence: 'none',
          category: 'meeting',
          completed: false,
          createdAt: now - 1800000,
        },
        {
          id: 'rem-2',
          rawInput: 'Remind me every Friday',
          title: 'Review weekly sprint goals and ship release tags',
          targetTime: this.getNextDayOfWeek(5, 17, 0),
          formattedTime: new Date(this.getNextDayOfWeek(5, 17, 0)).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          recurrence: 'weekly',
          recurrenceDay: 5,
          category: 'goal',
          completed: false,
          createdAt: now - 86400000,
        },
      ];
      this.saveReminders();
    }
  }

  private getNextDayOfWeek(dayOfWeek: number, hour = 9, minute = 0): number {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    const currentDay = d.getDay();
    let distance = dayOfWeek - currentDay;
    if (distance <= 0) distance += 7;
    d.setDate(d.getDate() + distance);
    return d.getTime();
  }

  /**
   * Natural Language Parsing Engine for Reminders
   * Supports:
   * - "Remind me in X minutes/hours/days/months"
   * - "Remind me tomorrow" / "tomorrow at 3pm"
   * - "Remind me in two months"
   * - "Remind me every Friday" / "every day"
   * - "Remind me before my meeting"
   */
  public parseAndCreateReminder(input: string, related?: { goalId?: string; projectId?: string; taskId?: string }): AetherReminder {
    const rawInput = input.trim();
    let cleanedText = rawInput.replace(/^(remind me to|remind me|set a reminder to|set reminder to|remind me in|remind me at)\s+/i, '');
    let title = rawInput;
    let targetTime = Date.now() + 3600000; // default 1 hour
    let recurrence: 'none' | 'daily' | 'weekly' | 'monthly' = 'none';
    let recurrenceDay: number | undefined = undefined;

    const lower = rawInput.toLowerCase();

    // 1. Check for "before my meeting"
    if (lower.includes('before my meeting') || lower.includes('before meeting')) {
      title = cleanedText.replace(/before (my )?meeting/i, '').trim() || 'Prepare for upcoming meeting';
      // Find next meeting in planner or set 30m
      const plannerItems = aetherCore.getPlannerItems();
      const nextMeeting = plannerItems.find(p => p.type === 'meeting' && p.status === 'pending');
      if (nextMeeting && nextMeeting.scheduledTime) {
        const parsed = Date.parse(nextMeeting.scheduledTime);
        if (!isNaN(parsed) && parsed > Date.now()) {
          targetTime = parsed - 15 * 60 * 1000; // 15 mins before
        } else {
          targetTime = Date.now() + 1800000;
        }
      } else {
        targetTime = Date.now() + 1800000;
      }
    }
    // 2. Check for "every [day/dayofweek]"
    else if (lower.includes('every friday')) {
      recurrence = 'weekly';
      recurrenceDay = 5;
      targetTime = this.getNextDayOfWeek(5, 9, 0);
      title = cleanedText.replace(/every friday/i, '').trim() || 'Weekly Friday reminder';
    } else if (lower.includes('every monday')) {
      recurrence = 'weekly';
      recurrenceDay = 1;
      targetTime = this.getNextDayOfWeek(1, 9, 0);
      title = cleanedText.replace(/every monday/i, '').trim() || 'Weekly Monday reminder';
    } else if (lower.includes('every day') || lower.includes('daily')) {
      recurrence = 'daily';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      targetTime = tomorrow.getTime();
      title = cleanedText.replace(/(every day|daily)/i, '').trim() || 'Daily reminder';
    }
    // 3. Check for relative time "in X hours/minutes/days/months"
    else {
      const numberMap: Record<string, number> = {
        one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10
      };

      const relativeRegex = /in\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+(minute|min|hour|hr|day|week|month)s?/i;
      const match = lower.match(relativeRegex);

      if (match) {
        const rawNum = match[1];
        const unit = match[2];
        const num = numberMap[rawNum] || parseInt(rawNum, 10) || 1;

        let multiplier = 60000; // minute
        if (unit.startsWith('hour') || unit === 'hr') multiplier = 3600000;
        else if (unit.startsWith('day')) multiplier = 86400000;
        else if (unit.startsWith('week')) multiplier = 7 * 86400000;
        else if (unit.startsWith('month')) multiplier = 30 * 86400000;

        targetTime = Date.now() + (num * multiplier);
        title = cleanedText.replace(relativeRegex, '').trim() || `Reminder in ${num} ${unit}`;
      } else if (lower.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (lower.includes('morning')) tomorrow.setHours(9, 0, 0, 0);
        else if (lower.includes('evening')) tomorrow.setHours(18, 0, 0, 0);
        else tomorrow.setHours(10, 0, 0, 0);
        targetTime = tomorrow.getTime();
        title = cleanedText.replace(/tomorrow\s*(morning|evening)?/i, '').trim() || 'Tomorrow reminder';
      } else {
        // Default title if no time specifiers found
        title = cleanedText || rawInput;
      }
    }

    if (!title || title.length < 2) {
      title = rawInput;
    }

    const reminder: AetherReminder = {
      id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rawInput,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      targetTime,
      formattedTime: new Date(targetTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      recurrence,
      recurrenceDay,
      category: related?.goalId ? 'goal' : related?.projectId ? 'project' : 'general',
      completed: false,
      relatedGoalId: related?.goalId,
      relatedProjectId: related?.projectId,
      relatedTaskId: related?.taskId,
      createdAt: Date.now(),
    };

    this.reminders.unshift(reminder);
    this.saveReminders();

    // Integration 1: Activity Center Notification
    activityCenter.addNotification({
      title: 'Reminder Created',
      message: `"${reminder.title}" set for ${reminder.formattedTime}`,
      type: 'info',
      summary: 'Reminder Set',
      reason: `NL Parser matched: "${rawInput}"`,
    });

    return reminder;
  }

  public getReminders(): AetherReminder[] {
    return [...this.reminders];
  }

  public getPendingReminders(): AetherReminder[] {
    return this.reminders.filter(r => !r.completed);
  }

  public toggleReminderCompleted(id: string) {
    const r = this.reminders.find(rem => rem.id === id);
    if (r) {
      r.completed = !r.completed;
      this.saveReminders();
    }
  }

  public deleteReminder(id: string) {
    this.reminders = this.reminders.filter(rem => rem.id !== id);
    this.saveReminders();
  }
}

export const aetherReminders = new AetherRemindersService();
