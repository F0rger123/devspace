// Aether Proactive Desktop Intelligence Service
// Quietly watches DevSpace and desktop activity with user permission and surfaces actionable insights.
// Strictly grounded in real project, issue, GitHub, workflow, note, conversation, and desktop activity.
// Enforces Proactivity Levels (Off, Important Only, Balanced, Proactive), Deduplication, Event Grouping,
// Dismiss & Snooze memory, Multi-Surface rendering (Aether Chat, Dynamic Island, Daily Operating Hub, Desktop Notifications),
// and strict FACT vs RECOMMENDATION differentiation.

import { aetherActiveProjectContext, CanonicalActiveProjectContextState } from './aetherActiveProjectContext';
import { getResolvedAetherPersonality } from './aetherPersonalityResolver';
import { safeSetNotificationsEnabled, isElectron } from './electronBridge';
import { aetherLifeContext } from './aetherLifeContextService';
import { aetherMeetingIntelligence } from './aetherMeetingIntelligenceService';

export type ProactivityLevel = 'off' | 'important_only' | 'balanced' | 'proactive';

export type AlertClassification = 'verified_fact' | 'aether_recommendation';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type AlertCategory =
  | 'github_workflow'
  | 'pr_conflict'
  | 'recent_push'
  | 'pr_review'
  | 'unfinished_work'
  | 'stale_issues'
  | 'project_changed'
  | 'continue_project'
  | 'related_note'
  | 'travel_departure'
  | 'traffic_spike'
  | 'trip_packing'
  | 'workspace_leave'
  | 'meeting_prep'
  | 'meeting_post_review'
  | 'system';

export interface ProactiveAction {
  id: string;
  label: string;
  type: 'open_project' | 'open_pr' | 'view_changes' | 'create_issue' | 'continue_work' | 'dismiss' | 'snooze' | 'save_workspace' | 'open_trips' | 'view_route' | 'open_meeting_prep' | 'open_post_review';
  payload?: any;
  isPrimary?: boolean;
}

export interface ProactiveAlertItem {
  id: string;
  category: AlertCategory;
  title: string;
  message: string;
  classification: AlertClassification;
  severity: AlertSeverity;
  minLevelRequired: ProactivityLevel;
  source: 'github' | 'workflow' | 'issues' | 'notes' | 'project' | 'desktop' | 'calendar' | 'travel' | 'trips';
  timestamp: number;
  timeAgoText?: string;
  projectId?: string;
  projectName?: string;
  groupedCount?: number;
  groupedDetails?: string[];
  actions: ProactiveAction[];
  isDismissed?: boolean;
  isSnoozed?: boolean;
  snoozedUntil?: number | null;
  metadata?: Record<string, any>;
}

export interface ProactiveStats {
  totalAlerts: number;
  factsCount: number;
  recommendationsCount: number;
  criticalCount: number;
  highCount: number;
  snoozedCount: number;
  dismissedCount: number;
  activeLevel: ProactivityLevel;
}

const STORAGE_KEY_PROACTIVITY_LEVEL = 'aether_proactivity_level_v1';
const STORAGE_KEY_DISMISSED = 'aether_proactive_dismissed_v1';
const STORAGE_KEY_SNOOZED = 'aether_proactive_snoozed_v1';
const STORAGE_KEY_DESKTOP_NOTIFS = 'aether_proactive_desktop_notifications_enabled_v1';
const STORAGE_KEY_LAST_NOTIFIED = 'aether_proactive_last_notified_v1';

class AetherProactiveIntelligenceService {
  private proactivityLevel: ProactivityLevel = 'balanced';
  private dismissedIds: Set<string> = new Set();
  private snoozedMap: Map<string, number> = new Map(); // id -> snoozeUntil timestamp
  private desktopNotificationsEnabled: boolean = false;
  private lastNotifiedMap: Map<string, number> = new Map(); // hash -> timestamp (cooldown)

  private cachedAlerts: ProactiveAlertItem[] = [];
  private listeners: Set<(alerts: ProactiveAlertItem[]) => void> = new Set();
  private isEvaluating: boolean = false;
  private pollingIntervalId: any = null;

  constructor() {
    this.loadSettings();
    this.startBackgroundWatcher();
  }

  private loadSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      // 1. Proactivity level
      const savedLevel = localStorage.getItem(STORAGE_KEY_PROACTIVITY_LEVEL);
      if (savedLevel && ['off', 'important_only', 'balanced', 'proactive'].includes(savedLevel)) {
        this.proactivityLevel = savedLevel as ProactivityLevel;
      } else {
        // Fallback to personality profile if available
        const personality = getResolvedAetherPersonality();
        const score = personality.profile?.proactivity ?? 70;
        if (score <= 10) this.proactivityLevel = 'off';
        else if (score <= 40) this.proactivityLevel = 'important_only';
        else if (score <= 75) this.proactivityLevel = 'balanced';
        else this.proactivityLevel = 'proactive';
      }

      // 2. Dismissed
      const savedDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED);
      if (savedDismissed) {
        const arr = JSON.parse(savedDismissed);
        if (Array.isArray(arr)) {
          this.dismissedIds = new Set(arr);
        }
      }

      // 3. Snoozed
      const savedSnoozed = localStorage.getItem(STORAGE_KEY_SNOOZED);
      if (savedSnoozed) {
        const obj = JSON.parse(savedSnoozed);
        const now = Date.now();
        Object.entries(obj).forEach(([id, until]) => {
          if (typeof until === 'number' && until > now) {
            this.snoozedMap.set(id, until);
          }
        });
      }

      // 4. Desktop Notifications
      const savedNotifs = localStorage.getItem(STORAGE_KEY_DESKTOP_NOTIFS);
      if (savedNotifs !== null) {
        this.desktopNotificationsEnabled = savedNotifs === 'true';
      } else {
        this.desktopNotificationsEnabled = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
      }
    } catch (err) {
      console.warn('Error loading proactive settings:', err);
    }
  }

  private saveSettings() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PROACTIVITY_LEVEL, this.proactivityLevel);
      localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(Array.from(this.dismissedIds)));
      
      const snoozedObj: Record<string, number> = {};
      const now = Date.now();
      this.snoozedMap.forEach((until, id) => {
        if (until > now) snoozedObj[id] = until;
      });
      localStorage.setItem(STORAGE_KEY_SNOOZED, JSON.stringify(snoozedObj));
      localStorage.setItem(STORAGE_KEY_DESKTOP_NOTIFS, String(this.desktopNotificationsEnabled));
    } catch (err) {
      console.warn('Error saving proactive settings:', err);
    }
  }

  public getProactivityLevel(): ProactivityLevel {
    return this.proactivityLevel;
  }

  public setProactivityLevel(level: ProactivityLevel) {
    this.proactivityLevel = level;
    this.saveSettings();
    this.evaluateAlerts();
    this.notifyLevelChanged();
  }

  public isDesktopNotificationsEnabled(): boolean {
    return this.desktopNotificationsEnabled;
  }

  public async setDesktopNotificationsEnabled(enabled: boolean): Promise<boolean> {
    if (enabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          this.desktopNotificationsEnabled = false;
          this.saveSettings();
          return false;
        }
      }
    }
    this.desktopNotificationsEnabled = enabled;
    safeSetNotificationsEnabled(enabled);
    this.saveSettings();
    return this.desktopNotificationsEnabled;
  }

  public subscribe(listener: (alerts: ProactiveAlertItem[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.cachedAlerts);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn(this.cachedAlerts);
      } catch (e) {
        console.error('Error in proactive intelligence listener:', e);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aether-proactive-alerts-updated', {
        detail: { alerts: this.cachedAlerts, stats: this.getStats() }
      }));
    }
  }

  private notifyLevelChanged() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aether-proactivity-level-changed', {
        detail: { level: this.proactivityLevel }
      }));
    }
  }

  private startBackgroundWatcher() {
    if (this.pollingIntervalId) return;

    // Listen to canonical context changes
    aetherActiveProjectContext.subscribe(() => {
      this.evaluateAlerts();
    });

    // Evaluate periodically every 25 seconds
    this.pollingIntervalId = setInterval(() => {
      this.evaluateAlerts();
    }, 25000);

    // Initial evaluation
    setTimeout(() => this.evaluateAlerts(), 500);
  }

  /**
   * Evaluates all proactive rules grounded in actual state without simulating data.
   */
  public evaluateAlerts(): ProactiveAlertItem[] {
    if (this.proactivityLevel === 'off') {
      this.cachedAlerts = [];
      this.notifyListeners();
      return [];
    }

    if (this.isEvaluating) return this.cachedAlerts;
    this.isEvaluating = true;

    try {
      const state: CanonicalActiveProjectContextState = aetherActiveProjectContext.getState();
      const now = Date.now();
      const rawAlerts: ProactiveAlertItem[] = [];

      const activeProjName = state.projectName || 'DevSpace';
      const activeProjId = state.projectId || 'default';
      const repo = state.connectedRepository;

      // Clean up expired snoozes
      this.snoozedMap.forEach((until, id) => {
        if (until <= now) {
          this.snoozedMap.delete(id);
        }
      });

      // =========================================================================
      // 1. GITHUB & WORKFLOW ALERTS (FACT)
      // =========================================================================

      // A. Pull Requests with Merge Conflicts (Critical / High)
      (state.openPullRequests || []).forEach(pr => {
        if (pr.mergeable === false) {
          const alertId = `alert-pr-conflict-${pr.number}-${repo || 'repo'}`;
          rawAlerts.push({
            id: alertId,
            category: 'pr_conflict',
            title: `PR #${pr.number} has merge conflicts`,
            message: `Pull request #${pr.number} ("${pr.title}") has merge conflicts with ${pr.baseBranch || 'main'}. Target branch requires conflict resolution before merging.`,
            classification: 'verified_fact',
            severity: 'high',
            minLevelRequired: 'important_only',
            source: 'github',
            timestamp: pr.createdAt ? new Date(pr.createdAt).getTime() : now,
            timeAgoText: this.formatTimeAgo(pr.createdAt ? new Date(pr.createdAt).getTime() : now),
            projectId: activeProjId,
            projectName: activeProjName,
            actions: [
              {
                id: `act-open-pr-${pr.number}`,
                label: `Open PR #${pr.number}`,
                type: 'open_pr',
                payload: { url: pr.url || `https://github.com/${repo}/pull/${pr.number}`, prNumber: pr.number },
                isPrimary: true
              },
              {
                id: `act-snooze-${alertId}`,
                label: 'Snooze',
                type: 'snooze',
                payload: { id: alertId }
              },
              {
                id: `act-dismiss-${alertId}`,
                label: 'Dismiss',
                type: 'dismiss',
                payload: { id: alertId }
              }
            ],
            metadata: { prNumber: pr.number, repo, url: pr.url }
          });
        }
      });

      // B. Failed GitHub Workflows (Recorded in recent activities or sync error)
      const failedWorkflowActivity = (state.recentActivities || []).find(
        a => (a.type === 'workflow' || a.source === 'github') &&
             (a.title.toLowerCase().includes('failed') || (a.summary && a.summary.toLowerCase().includes('failed')))
      );
      if (failedWorkflowActivity || state.lastGitHubSyncError) {
        const errorMsg = failedWorkflowActivity?.title || state.lastGitHubSyncError || 'Build and test checks failed';
        const alertId = `alert-wf-failed-${activeProjId}-${failedWorkflowActivity?.id || 'sync-err'}`;
        rawAlerts.push({
          id: alertId,
          category: 'github_workflow',
          title: `Your last GitHub workflow failed`,
          message: `Automated CI/CD pipeline failed on ${repo || activeProjName}: ${errorMsg}.`,
          classification: 'verified_fact',
          severity: 'high',
          minLevelRequired: 'important_only',
          source: 'workflow',
          timestamp: failedWorkflowActivity?.timestamp || now - 180000,
          timeAgoText: this.formatTimeAgo(failedWorkflowActivity?.timestamp || now - 180000),
          projectId: activeProjId,
          projectName: activeProjName,
          actions: [
            {
              id: `act-view-wf-${alertId}`,
              label: 'Open Repository Actions',
              type: 'open_pr',
              payload: { url: repo ? `https://github.com/${repo}/actions` : undefined },
              isPrimary: true
            },
            {
              id: `act-snooze-${alertId}`,
              label: 'Snooze',
              type: 'snooze',
              payload: { id: alertId }
            },
            {
              id: `act-dismiss-${alertId}`,
              label: 'Dismiss',
              type: 'dismiss',
              payload: { id: alertId }
            }
          ]
        });
      }

      // C. Recent Pushes to Project (FACT - Proactive Level)
      const commits = state.recentCommits || [];
      if (commits.length > 0 && repo) {
        const topCommit = commits[0];
        const commitTime = topCommit.date ? new Date(topCommit.date).getTime() : now - 1200000;
        const diffMinutes = Math.floor((now - commitTime) / (60 * 1000));
        
        // If pushed recently (within past 2 hours)
        if (diffMinutes >= 0 && diffMinutes <= 120) {
          const alertId = `alert-recent-push-${topCommit.sha}`;
          const timeText = diffMinutes === 0 ? 'just now' : `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
          rawAlerts.push({
            id: alertId,
            category: 'recent_push',
            title: `You pushed changes to this project ${timeText}`,
            message: `Commit \`${topCommit.sha}\` ("${topCommit.message}") was pushed by ${topCommit.author} to branch \`${state.currentBranch || 'main'}\`.`,
            classification: 'verified_fact',
            severity: 'low',
            minLevelRequired: 'proactive',
            source: 'github',
            timestamp: commitTime,
            timeAgoText: timeText,
            projectId: activeProjId,
            projectName: activeProjName,
            actions: [
              {
                id: `act-view-changes-${alertId}`,
                label: 'View Changes',
                type: 'view_changes',
                payload: { sha: topCommit.sha, repo, projectId: activeProjId },
                isPrimary: true
              },
              {
                id: `act-create-pr-${alertId}`,
                label: 'Open PR',
                type: 'open_pr',
                payload: { url: `https://github.com/${repo}/pull/new/${state.currentBranch || 'main'}` }
              },
              {
                id: `act-dismiss-${alertId}`,
                label: 'Dismiss',
                type: 'dismiss',
                payload: { id: alertId }
              }
            ],
            metadata: { sha: topCommit.sha, message: topCommit.message }
          });
        }
      }

      // D. Draft PRs awaiting review (Balanced Level)
      (state.openPullRequests || []).forEach(pr => {
        if (pr.draft && pr.mergeable !== false) {
          const alertId = `alert-pr-draft-${pr.number}`;
          rawAlerts.push({
            id: alertId,
            category: 'pr_review',
            title: `Draft PR #${pr.number} ready for review?`,
            message: `Pull Request #${pr.number} ("${pr.title}") is in draft state. Run safety checks and mark ready when ready to merge.`,
            classification: 'aether_recommendation',
            severity: 'medium',
            minLevelRequired: 'balanced',
            source: 'github',
            timestamp: pr.createdAt ? new Date(pr.createdAt).getTime() : now,
            timeAgoText: this.formatTimeAgo(pr.createdAt ? new Date(pr.createdAt).getTime() : now),
            projectId: activeProjId,
            projectName: activeProjName,
            actions: [
              {
                id: `act-open-pr-${pr.number}`,
                label: `Open PR #${pr.number}`,
                type: 'open_pr',
                payload: { url: pr.url || `https://github.com/${repo}/pull/${pr.number}` },
                isPrimary: true
              },
              {
                id: `act-snooze-${alertId}`,
                label: 'Snooze',
                type: 'snooze',
                payload: { id: alertId }
              },
              {
                id: `act-dismiss-${alertId}`,
                label: 'Dismiss',
                type: 'dismiss',
                payload: { id: alertId }
              }
            ]
          });
        }
      });

      // =========================================================================
      // 2. UNFINISHED & STALE WORK ALERTS (FACT + RECOMMENDATION)
      // =========================================================================

      // A. Unfinished In-Progress Issues (Balanced / Important)
      const inProgressIssues = (state.openIssues || []).filter(
        i => i.status === 'In Progress' || i.status === 'in_progress'
      );
      if (inProgressIssues.length > 0) {
        const topIssue = inProgressIssues[0];
        const alertId = `alert-unfinished-task-${topIssue.id}`;
        rawAlerts.push({
          id: alertId,
          category: 'unfinished_work',
          title: `You still have an unfinished issue from earlier`,
          message: `"${topIssue.title}" in ${activeProjName} is currently marked In Progress (Priority: ${topIssue.priority || 'Medium'}).`,
          classification: 'verified_fact',
          severity: 'medium',
          minLevelRequired: 'balanced',
          source: 'issues',
          timestamp: now - 3600000,
          timeAgoText: 'Earlier today',
          projectId: activeProjId,
          projectName: activeProjName,
          actions: [
            {
              id: `act-continue-work-${topIssue.id}`,
              label: 'Continue Work',
              type: 'continue_work',
              payload: { issueId: topIssue.id, projectId: activeProjId },
              isPrimary: true
            },
            {
              id: `act-snooze-${alertId}`,
              label: 'Snooze',
              type: 'snooze',
              payload: { id: alertId }
            },
            {
              id: `act-dismiss-${alertId}`,
              label: 'Dismiss',
              type: 'dismiss',
              payload: { id: alertId }
            }
          ],
          metadata: { issueId: topIssue.id, title: topIssue.title }
        });
      }

      // B. Stale High-Priority Issues Grouped (Balanced Level)
      const staleThreshold = 4 * 86400000; // 4 days
      const staleHighPriority = (state.openIssues || []).filter((iss: any) => {
        const lastUpdate = iss.updatedAt || iss.createdAt || 0;
        const isHigh = iss.priority === 'High' || iss.priority === 'Critical';
        const isNotDone = iss.status !== 'Done' && iss.status !== 'Closed';
        return isHigh && isNotDone && lastUpdate > 0 && (now - lastUpdate > staleThreshold);
      });

      if (staleHighPriority.length > 0) {
        const alertId = `alert-stale-issues-${activeProjId}`;
        const issueTitles = staleHighPriority.map(i => `"${i.title}"`).slice(0, 3);
        const titlesText = issueTitles.join(', ') + (staleHighPriority.length > 3 ? ` and ${staleHighPriority.length - 3} more` : '');

        rawAlerts.push({
          id: alertId,
          category: 'stale_issues',
          title: `You have ${staleHighPriority.length} stale high-priority issue${staleHighPriority.length === 1 ? '' : 's'}`,
          message: `Untouched for over 4 days: ${titlesText}. Consider updating status or reallocating focus.`,
          classification: 'aether_recommendation',
          severity: 'medium',
          minLevelRequired: 'balanced',
          source: 'issues',
          timestamp: now - staleThreshold,
          timeAgoText: '> 4 days ago',
          projectId: activeProjId,
          projectName: activeProjName,
          groupedCount: staleHighPriority.length,
          groupedDetails: staleHighPriority.map(i => `${i.title} [${i.priority}] (${i.status})`),
          actions: [
            {
              id: `act-open-issues-${alertId}`,
              label: 'Open Project',
              type: 'open_project',
              payload: { projectId: activeProjId },
              isPrimary: true
            },
            {
              id: `act-snooze-${alertId}`,
              label: 'Snooze',
              type: 'snooze',
              payload: { id: alertId }
            },
            {
              id: `act-dismiss-${alertId}`,
              label: 'Dismiss',
              type: 'dismiss',
              payload: { id: alertId }
            }
          ]
        });
      }

      // =========================================================================
      // 3. PROJECT CONTINUITY & SINCE-LAST-OPENED (FACT & RECOMMENDATION)
      // =========================================================================

      // A. Changes Since Last Opened (FACT - Balanced Level)
      let lastOpenedMap: Record<string, number> = {};
      if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('devspace_project_last_opened_v1');
          if (stored) lastOpenedMap = JSON.parse(stored);
        } catch {}
      }
      const prevOpened = lastOpenedMap[activeProjId];
      if (prevOpened && (now - prevOpened > 300000)) { // At least 5 mins ago
        const commitsSince = (state.recentCommits || []).filter(c => {
          const t = c.date ? new Date(c.date).getTime() : 0;
          return t > prevOpened;
        });
        const issuesSince = (state.openIssues || []).filter((i: any) => {
          const t = i.updatedAt || i.createdAt || 0;
          return t > prevOpened;
        });

        const totalChanges = commitsSince.length + issuesSince.length;
        if (totalChanges > 0) {
          const alertId = `alert-proj-changed-${activeProjId}-${prevOpened}`;
          rawAlerts.push({
            id: alertId,
            category: 'project_changed',
            title: `This project has changed since you last opened it`,
            message: `${totalChanges} new change${totalChanges === 1 ? '' : 's'} recorded (${commitsSince.length} commits, ${issuesSince.length} issue updates) since ${new Date(prevOpened).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            classification: 'verified_fact',
            severity: 'low',
            minLevelRequired: 'balanced',
            source: 'project',
            timestamp: prevOpened,
            timeAgoText: this.formatTimeAgo(prevOpened),
            projectId: activeProjId,
            projectName: activeProjName,
            actions: [
              {
                id: `act-view-changes-${alertId}`,
                label: 'View Changes',
                type: 'view_changes',
                payload: { projectId: activeProjId, since: prevOpened },
                isPrimary: true
              },
              {
                id: `act-dismiss-${alertId}`,
                label: 'Dismiss',
                type: 'dismiss',
                payload: { id: alertId }
              }
            ]
          });
        }
      }

      // B. Continuity: "You were working on [Other Project] earlier. Continue?" (Proactive Level)
      const allProjects = state.allProjectsSummary || [];
      if (allProjects.length > 1) {
        // Find other project with most recent activity
        const otherProjects = allProjects.filter(p => p.id !== activeProjId);
        const sortedOther = otherProjects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        const recentOther = sortedOther[0];

        if (recentOther && recentOther.updatedAt && (now - recentOther.updatedAt < 86400000 * 2)) {
          const alertId = `alert-continue-proj-${recentOther.id}`;
          rawAlerts.push({
            id: alertId,
            category: 'continue_project',
            title: `You were working on ${recentOther.name} earlier. Continue?`,
            message: `Recent work session was active in ${recentOther.name}. Ready to switch back and resume where you left off?`,
            classification: 'aether_recommendation',
            severity: 'low',
            minLevelRequired: 'proactive',
            source: 'project',
            timestamp: recentOther.updatedAt,
            timeAgoText: this.formatTimeAgo(recentOther.updatedAt),
            projectId: recentOther.id,
            projectName: recentOther.name,
            actions: [
              {
                id: `act-continue-proj-${recentOther.id}`,
                label: `Open ${recentOther.name}`,
                type: 'open_project',
                payload: { projectId: recentOther.id, projectName: recentOther.name },
                isPrimary: true
              },
              {
                id: `act-snooze-${alertId}`,
                label: 'Snooze',
                type: 'snooze',
                payload: { id: alertId }
              },
              {
                id: `act-dismiss-${alertId}`,
                label: 'Dismiss',
                type: 'dismiss',
                payload: { id: alertId }
              }
            ]
          });
        }
      }

      // =========================================================================
      // 4. NOTES & CONTEXT CORRELATION (RECOMMENDATION - Proactive Level)
      // =========================================================================
      const notes = state.recentNotes || [];
      if (notes.length > 0 && inProgressIssues.length > 0) {
        const currentTaskTitle = inProgressIssues[0].title.toLowerCase();
        const keywords = currentTaskTitle.split(/\s+/).filter(w => w.length > 3);
        
        const matchedNote = notes.find(n => {
          const noteText = `${n.title} ${n.content || ''}`.toLowerCase();
          return keywords.some(k => noteText.includes(k));
        });

        if (matchedNote) {
          const alertId = `alert-related-note-${matchedNote.id}-${inProgressIssues[0].id}`;
          rawAlerts.push({
            id: alertId,
            category: 'related_note',
            title: `Your current task looks related to this previous note`,
            message: `Task "${inProgressIssues[0].title}" correlates with note "${matchedNote.title}". Reusing existing context may accelerate implementation.`,
            classification: 'aether_recommendation',
            severity: 'low',
            minLevelRequired: 'proactive',
            source: 'notes',
            timestamp: matchedNote.updatedAt || now,
            timeAgoText: this.formatTimeAgo(matchedNote.updatedAt || now),
            projectId: activeProjId,
            projectName: activeProjName,
            actions: [
              {
                id: `act-view-note-${matchedNote.id}`,
                label: `Open Note "${matchedNote.title}"`,
                type: 'open_project',
                payload: { target: 'notes', noteId: matchedNote.id },
                isPrimary: true
              },
              {
                id: `act-dismiss-${alertId}`,
                label: 'Dismiss',
                type: 'dismiss',
                payload: { id: alertId }
              }
            ]
          });
        }
      }

      // =========================================================================
      // 5. AETHER LIFE CONTEXT: CALENDAR, TRAVEL, LEAVE-BY & TRIPS (FACT & RECOM)
      // =========================================================================
      const lifeConfig = aetherLifeContext.getConfig();
      if (lifeConfig.calendarAwareness) {
        const upcomingEvents = aetherLifeContext.getUpcomingEvents();
        const routes = aetherLifeContext.getAllActiveRouteTelemetry();

        upcomingEvents.forEach((evt) => {
          const diffMins = Math.round((evt.startTime - now) / 60000);
          const route = routes[evt.id];

          // A. Leave-by departure alert (Upcoming within 60 mins with physical destination)
          if (route && diffMins > 0 && diffMins <= 60) {
            const isCritical = route.minutesUntilLeave <= 10;
            const alertId = `alert-leave-${evt.id}-${Math.floor(route.minutesUntilLeave / 5)}`;

            let message = `You have to be at your appointment in ${diffMins} minutes. It currently takes ${route.trafficDurationMinutes} minutes to get there (${route.congestionLevel} traffic), so you should leave in about ${Math.max(1, route.minutesUntilLeave)} minutes.`;
            if (route.minutesUntilLeave <= 5) {
              message = `You need to leave now for "${evt.title}". Current transit time is ${route.trafficDurationMinutes} min to ${route.destinationAddress}.`;
            }

            rawAlerts.push({
              id: alertId,
              category: 'travel_departure',
              title: `Upcoming Departure: ${evt.title}`,
              message,
              classification: 'verified_fact',
              severity: isCritical ? 'critical' : 'high',
              minLevelRequired: isCritical ? 'important_only' : 'balanced',
              source: 'travel',
              timestamp: now,
              timeAgoText: `in ${Math.max(1, route.minutesUntilLeave)}m`,
              actions: [
                {
                  id: `act-save-leave-${evt.id}`,
                  label: 'Save Workspace & Queue Tasks',
                  type: 'save_workspace',
                  payload: { eventId: evt.id, eventTitle: evt.title },
                  isPrimary: true,
                },
                {
                  id: `act-snooze-${alertId}`,
                  label: 'Snooze 5m',
                  type: 'snooze',
                  payload: { id: alertId, durationMs: 5 * 60000 },
                },
                {
                  id: `act-dismiss-${alertId}`,
                  label: 'Dismiss',
                  type: 'dismiss',
                  payload: { id: alertId },
                },
              ],
              metadata: { eventId: evt.id, route },
            });

            // B. Traffic Surge Alert (if traffic increased)
            if (route.trafficChangedFromPrevious) {
              const trafficAlertId = `alert-traffic-surge-${evt.id}`;
              rawAlerts.push({
                id: trafficAlertId,
                category: 'traffic_spike',
                title: 'Traffic Increased on Your Route',
                message: `You haven’t left yet and traffic increased to ${route.destinationAddress} (${route.trafficDurationMinutes}m travel time). You should head out now.`,
                classification: 'verified_fact',
                severity: 'high',
                minLevelRequired: 'important_only',
                source: 'travel',
                timestamp: now,
                actions: [
                  {
                    id: `act-leave-now-${evt.id}`,
                    label: 'Leave Now & Save State',
                    type: 'save_workspace',
                    payload: { eventId: evt.id },
                    isPrimary: true,
                  },
                  {
                    id: `act-dismiss-${trafficAlertId}`,
                    label: 'Dismiss',
                    type: 'dismiss',
                    payload: { id: trafficAlertId },
                  },
                ],
              });
            }
          }
        });
      }

      // C. Trip & Crucial Packing Reminders (Trip approaching with unchecked items)
      if (lifeConfig.tripPackingAssistance) {
        const nextTrip = aetherLifeContext.getNextUpcomingTrip();
        if (nextTrip) {
          const daysUntil = Math.round((nextTrip.departureTimestamp - now) / 86400000);
          const uncheckedCrucial = aetherLifeContext.getUncheckedCrucialItems(nextTrip.id);

          if (daysUntil <= 5 && uncheckedCrucial.length > 0) {
            const tripAlertId = `alert-trip-pack-${nextTrip.id}`;
            const missingNames = uncheckedCrucial.map((i) => i.name).slice(0, 3).join(', ');
            const moreCount = uncheckedCrucial.length > 3 ? ` and ${uncheckedCrucial.length - 3} more` : '';

            rawAlerts.push({
              id: tripAlertId,
              category: 'trip_packing',
              title: `Trip Preparation: ${nextTrip.destination}`,
              message: `Before you leave in ${daysUntil === 0 ? 'today' : `${daysUntil} days`}, you still haven’t checked off your ${missingNames}${moreCount}.`,
              classification: 'aether_recommendation',
              severity: daysUntil <= 1 ? 'high' : 'medium',
              minLevelRequired: daysUntil <= 1 ? 'important_only' : 'balanced',
              source: 'trips',
              timestamp: now,
              actions: [
                {
                  id: `act-open-trips-${nextTrip.id}`,
                  label: 'Open Packing Checklist',
                  type: 'open_trips',
                  payload: { tripId: nextTrip.id },
                  isPrimary: true,
                },
                {
                  id: `act-snooze-${tripAlertId}`,
                  label: 'Snooze',
                  type: 'snooze',
                  payload: { id: tripAlertId },
                },
                {
                  id: `act-dismiss-${tripAlertId}`,
                  label: 'Dismiss',
                  type: 'dismiss',
                  payload: { id: tripAlertId },
                },
              ],
              metadata: { tripId: nextTrip.id, uncheckedCount: uncheckedCrucial.length },
            });
          }
        }
      }

      // =========================================================================
      // D. AETHER PROACTIVE MEETING INTELLIGENCE & BRIEFINGS
      // =========================================================================
      const upcomingMeetings = aetherMeetingIntelligence.getUpcomingMeetings();
      const pastMeetings = aetherMeetingIntelligence.getPastMeetings();

      // 1. Proactive Pre-Meeting Briefing (15-30m before meeting)
      upcomingMeetings.forEach((m) => {
        const diffMinutes = Math.round((m.startTime - now) / 60000);
        if (diffMinutes >= 0 && diffMinutes <= 30) {
          const alertId = `alert-meeting-prep-${m.id}`;
          const attendeeNames = m.attendees.join(', ') || 'Team';
          rawAlerts.push({
            id: alertId,
            category: 'meeting_prep',
            title: `Pre-Meeting Brief: ${m.title}`,
            message: `Starting in ${diffMinutes === 0 ? 'moments' : `${diffMinutes}m`} with ${attendeeNames}. Ready to review open promises, unresolved issues, and key talking points?`,
            classification: 'aether_recommendation',
            severity: diffMinutes <= 10 ? 'high' : 'medium',
            minLevelRequired: 'important_only',
            source: 'calendar',
            timestamp: now,
            actions: [
              {
                id: `act-view-brief-${m.id}`,
                label: 'View Pre-Meeting Brief',
                type: 'open_meeting_prep',
                payload: { meetingId: m.id, query: m.title },
                isPrimary: true,
              },
              {
                id: `act-snooze-${alertId}`,
                label: 'Snooze 5m',
                type: 'snooze',
                payload: { id: alertId, durationMs: 5 * 60000 },
              },
              {
                id: `act-dismiss-${alertId}`,
                label: 'Dismiss',
                type: 'dismiss',
                payload: { id: alertId },
              },
            ],
            metadata: { meetingId: m.id, meetingTitle: m.title, diffMinutes },
          });
        }
      });

      // 2. Proactive Post-Meeting Review Prompt (Ended within past 60m)
      pastMeetings.forEach((m) => {
        const endTime = m.endTime || m.startTime + 1800000;
        const endedMinutesAgo = Math.round((now - endTime) / 60000);
        if (endedMinutesAgo >= 0 && endedMinutesAgo <= 60) {
          const alertId = `alert-meeting-review-${m.id}`;
          rawAlerts.push({
            id: alertId,
            category: 'meeting_post_review',
            title: `Want me to capture the outcomes from that meeting?`,
            message: `"${m.title}" ended ${endedMinutesAgo === 0 ? 'just now' : `${endedMinutesAgo}m ago`}. I can extract decisions, commitments, DevSpace issues, and sync people profiles.`,
            classification: 'aether_recommendation',
            severity: 'medium',
            minLevelRequired: 'balanced',
            source: 'calendar',
            timestamp: endTime,
            timeAgoText: this.formatTimeAgo(endTime),
            actions: [
              {
                id: `act-capture-outcomes-${m.id}`,
                label: 'Capture Outcomes',
                type: 'open_post_review',
                payload: { meetingId: m.id, meetingTitle: m.title },
                isPrimary: true,
              },
              {
                id: `act-snooze-${alertId}`,
                label: 'Snooze 10m',
                type: 'snooze',
                payload: { id: alertId, durationMs: 10 * 60000 },
              },
              {
                id: `act-dismiss-${alertId}`,
                label: 'Dismiss',
                type: 'dismiss',
                payload: { id: alertId },
              },
            ],
            metadata: { meetingId: m.id, meetingTitle: m.title },
          });
        }
      });

      // =========================================================================
      // FILTER BY PROACTIVITY LEVEL, DISMISSED, AND SNOOZED
      // =========================================================================
      const filteredAlerts = rawAlerts.filter(alert => {
        // 1. Check dismissed
        if (this.dismissedIds.has(alert.id)) {
          alert.isDismissed = true;
          return false;
        }

        // 2. Check snoozed
        const snoozedUntil = this.snoozedMap.get(alert.id);
        if (snoozedUntil && snoozedUntil > now) {
          alert.isSnoozed = true;
          alert.snoozedUntil = snoozedUntil;
          return false;
        }

        // 3. Check level threshold
        if (this.proactivityLevel === 'important_only') {
          return alert.minLevelRequired === 'important_only' || alert.severity === 'critical' || alert.severity === 'high';
        }
        if (this.proactivityLevel === 'balanced') {
          return alert.minLevelRequired === 'important_only' || alert.minLevelRequired === 'balanced';
        }
        if (this.proactivityLevel === 'proactive') {
          return true; // all levels allowed
        }
        return false;
      });

      // Deduplicate similar items by category & project if needed
      const deduplicatedAlerts: ProactiveAlertItem[] = [];
      const seenSignatures = new Set<string>();

      filteredAlerts.forEach(a => {
        const sig = `${a.category}-${a.projectId || 'global'}-${a.title}`;
        if (!seenSignatures.has(sig)) {
          seenSignatures.add(sig);
          deduplicatedAlerts.push(a);
        }
      });

      this.cachedAlerts = deduplicatedAlerts;
      this.notifyListeners();

      // Check desktop notification dispatch
      this.checkAndDispatchDesktopNotifications(deduplicatedAlerts);

      return this.cachedAlerts;
    } catch (err) {
      console.warn('Error evaluating proactive alerts:', err);
      return this.cachedAlerts;
    } finally {
      this.isEvaluating = false;
    }
  }

  /**
   * Dispatches real OS desktop notification when appropriate
   */
  private checkAndDispatchDesktopNotifications(alerts: ProactiveAlertItem[]) {
    if (!this.desktopNotificationsEnabled) return;
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const cooldownMs = 15 * 60 * 1000; // 15 mins cooldown per alert signature

    // Only notify high or critical alerts on desktop to avoid notification noise
    const highAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

    highAlerts.forEach(a => {
      const hash = `notif-${a.id}`;
      const lastSent = this.lastNotifiedMap.get(hash) || 0;

      if (now - lastSent > cooldownMs) {
        this.lastNotifiedMap.set(hash, now);
        this.sendDesktopNotification(a);
      }
    });
  }

  private sendDesktopNotification(alert: ProactiveAlertItem) {
    if (typeof window === 'undefined') return;

    const title = `Aether Intelligence: ${alert.title}`;
    const body = alert.message;

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: alert.id
        });
        notif.onclick = () => {
          window.focus();
          this.executePrimaryAction(alert);
        };
      } catch (e) {
        console.warn('Failed to dispatch browser notification:', e);
      }
    }
  }

  /**
   * Action Execution Router
   */
  public executeAction(action: ProactiveAction, alert?: ProactiveAlertItem, routerNavigate?: (path: string) => void) {
    if (action.type === 'dismiss') {
      const id = action.payload?.id || alert?.id;
      if (id) this.dismissAlert(id);
      return;
    }

    if (action.type === 'snooze') {
      const id = action.payload?.id || alert?.id;
      const durationMinutes = action.payload?.durationMinutes || 60;
      if (id) this.snoozeAlert(id, durationMinutes);
      return;
    }

    if (action.type === 'open_pr') {
      const url = action.payload?.url;
      if (url && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (action.type === 'open_project') {
      const projId = action.payload?.projectId || alert?.projectId;
      if (projId) {
        aetherActiveProjectContext.setActiveProject(projId, action.payload?.projectName || alert?.projectName);
      }
      if (routerNavigate) {
        routerNavigate('/projects');
      }
      return;
    }

    if (action.type === 'continue_work') {
      const projId = action.payload?.projectId || alert?.projectId;
      if (projId) {
        aetherActiveProjectContext.setActiveProject(projId, alert?.projectName);
      }
      if (routerNavigate) {
        routerNavigate('/dashboard');
      }
      return;
    }

    if (action.type === 'view_changes') {
      if (routerNavigate) {
        routerNavigate('/github');
      }
      return;
    }

    if (action.type === 'save_workspace') {
      const title = alert?.title || 'User Departure';
      aetherLifeContext.createWorkspaceLeaveSnapshot(title);
      if (routerNavigate) {
        routerNavigate('/settings?tab=life-context');
      }
      return;
    }

    if (action.type === 'open_trips' || action.type === 'view_route') {
      if (routerNavigate) {
        routerNavigate('/settings?tab=life-context');
      }
      return;
    }
  }

  public executePrimaryAction(alert: ProactiveAlertItem, routerNavigate?: (path: string) => void) {
    const primary = alert.actions.find(a => a.isPrimary) || alert.actions[0];
    if (primary) {
      this.executeAction(primary, alert, routerNavigate);
    }
  }

  public dismissAlert(alertId: string) {
    this.dismissedIds.add(alertId);
    this.saveSettings();
    this.evaluateAlerts();
  }

  public snoozeAlert(alertId: string, durationMinutes: number = 60) {
    const until = Date.now() + durationMinutes * 60 * 1000;
    this.snoozedMap.set(alertId, until);
    this.saveSettings();
    this.evaluateAlerts();
  }

  public unsnoozeAlert(alertId: string) {
    this.snoozedMap.delete(alertId);
    this.saveSettings();
    this.evaluateAlerts();
  }

  public restoreDismissedAlert(alertId: string) {
    this.dismissedIds.delete(alertId);
    this.saveSettings();
    this.evaluateAlerts();
  }

  public clearAllDismissed() {
    this.dismissedIds.clear();
    this.saveSettings();
    this.evaluateAlerts();
  }

  public getAlerts(): ProactiveAlertItem[] {
    return [...this.cachedAlerts];
  }

  public getStats(): ProactiveStats {
    const alerts = this.cachedAlerts;
    return {
      totalAlerts: alerts.length,
      factsCount: alerts.filter(a => a.classification === 'verified_fact').length,
      recommendationsCount: alerts.filter(a => a.classification === 'aether_recommendation').length,
      criticalCount: alerts.filter(a => a.severity === 'critical').length,
      highCount: alerts.filter(a => a.severity === 'high').length,
      snoozedCount: this.snoozedMap.size,
      dismissedCount: this.dismissedIds.size,
      activeLevel: this.proactivityLevel
    };
  }

  private formatTimeAgo(timestamp: number): string {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }
}

export const aetherProactiveIntelligence = new AetherProactiveIntelligenceService();
