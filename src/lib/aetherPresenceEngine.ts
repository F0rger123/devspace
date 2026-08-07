import { aetherCore } from './aetherCore';

export interface FocusSessionState {
  isActive: boolean;
  targetDurationMinutes: number;
  elapsedSeconds: number;
  startTime: number;
  projectName: string;
  activeDreamTitle: string;
  activeAgentName: string;
  aiProvider: string;
  queuedNotificationsCount: number;
  nextBreakCountdownSeconds: number;
  paused: boolean;
}

export interface PresenceNudge {
  id: string;
  timestamp: number;
  category: 'focus' | 'hydration' | 'wellness' | 'dream' | 'stuck_problem' | 'achievement';
  message: string;
  actionLabel?: string;
  dismissed: boolean;
}

export interface HealthWellnessSettings {
  hydrationEnabled: boolean;
  hydrationIntervalMinutes: number;
  stretchingEnabled: boolean;
  stretchingIntervalMinutes: number;
  eyeBreaksEnabled: boolean;
  eyeBreaksIntervalMinutes: number;
  standingEnabled: boolean;
  standingIntervalMinutes: number;
  lunchReminderEnabled: boolean;
  endOfDayShutdownEnabled: boolean;
}

export interface CameraFocusSettings {
  enabled: boolean;
  userOptedIn: boolean;
  permissionGranted: boolean;
  onDeviceInferenceOnly: true; // HARD ENFORCED: Never upload video/frames
  storeFrames: false; // HARD ENFORCED: Never store video
  phoneDetectionThresholdSeconds: number; // e.g. 120s
  lastDetectedState: 'desk_present' | 'user_away' | 'phone_detected' | 'looking_away';
  lastNudgeTime: number;
}

export interface AdaptiveCoachingHabits {
  preferredCodingHours: string;
  typicalReviewDurationMinutes: number;
  preferredBreakCadenceMinutes: number;
  longestProductiveSessionMinutes: number;
  mostProductiveWeekday: string;
  focusInterruptionsCount: number;
  suggestionAcceptanceRatePct: number;
  totalFocusSessionsCompleted: number;
}

class AetherPresenceEngineManager {
  private focusSession: FocusSessionState = {
    isActive: false,
    targetDurationMinutes: 45,
    elapsedSeconds: 0,
    startTime: 0,
    projectName: 'DevSpace Platform Core',
    activeDreamTitle: 'Dream #42 - AST Type Safety & Persistence Engine',
    activeAgentName: 'Aether Dev Agent',
    aiProvider: 'Gemini 3.6 Flash (Antigravity)',
    queuedNotificationsCount: 0,
    nextBreakCountdownSeconds: 1500, // 25 mins
    paused: false,
  };

  private wellnessSettings: HealthWellnessSettings = {
    hydrationEnabled: true,
    hydrationIntervalMinutes: 45,
    stretchingEnabled: true,
    stretchingIntervalMinutes: 60,
    eyeBreaksEnabled: true,
    eyeBreaksIntervalMinutes: 20,
    standingEnabled: true,
    standingIntervalMinutes: 60,
    lunchReminderEnabled: true,
    endOfDayShutdownEnabled: true,
  };

  private cameraFocus: CameraFocusSettings = {
    enabled: false,
    userOptedIn: false,
    permissionGranted: false,
    onDeviceInferenceOnly: true,
    storeFrames: false,
    phoneDetectionThresholdSeconds: 120,
    lastDetectedState: 'desk_present',
    lastNudgeTime: 0,
  };

  private coachingHabits: AdaptiveCoachingHabits = {
    preferredCodingHours: '09:00 - 12:30, 14:00 - 17:30',
    typicalReviewDurationMinutes: 4.2,
    preferredBreakCadenceMinutes: 45,
    longestProductiveSessionMinutes: 110,
    mostProductiveWeekday: 'Tuesday',
    focusInterruptionsCount: 2,
    suggestionAcceptanceRatePct: 94,
    totalFocusSessionsCompleted: 18,
  };

  private nudges: PresenceNudge[] = [];
  private codingMinutesSession = 72;
  private timerInterval: any = null;

  constructor() {
    this.seedInitialNudges();
    this.startPresenceHeartbeat();
  }

  private seedInitialNudges() {
    this.nudges = [
      {
        id: 'nudge-1',
        timestamp: Date.now() - 300000,
        category: 'focus',
        message: "You've been coding for 72 minutes with high concentration.",
        dismissed: false,
      },
      {
        id: 'nudge-2',
        timestamp: Date.now() - 600000,
        category: 'hydration',
        message: "You haven't had any water in about an hour. Time for a quick refill?",
        actionLabel: 'Log Water Glass',
        dismissed: false,
      },
      {
        id: 'nudge-3',
        timestamp: Date.now() - 1200000,
        category: 'achievement',
        message: "Great job—you've completed three Dreams and reduced technical debt today!",
        dismissed: false,
      },
    ];
  }

  private startPresenceHeartbeat() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.focusSession.isActive && !this.focusSession.paused) {
        this.focusSession.elapsedSeconds += 1;
        if (this.focusSession.nextBreakCountdownSeconds > 0) {
          this.focusSession.nextBreakCountdownSeconds -= 1;
        }

        const totalTargetSec = this.focusSession.targetDurationMinutes * 60;
        if (this.focusSession.elapsedSeconds >= totalTargetSec) {
          this.completeFocusSession();
        }
      }
    }, 1000);
  }

  // --- FOCUS SESSION CONTROL ---
  public startFocusSession(durationMinutes: number = 45, projectName?: string): FocusSessionState {
    this.focusSession = {
      isActive: true,
      targetDurationMinutes: durationMinutes,
      elapsedSeconds: 0,
      startTime: Date.now(),
      projectName: projectName || 'DevSpace Platform Core',
      activeDreamTitle: 'Dream #42 - AST Type Safety & Persistence Engine',
      activeAgentName: 'Aether Dev Agent',
      aiProvider: 'Gemini 3.6 Flash (Antigravity)',
      queuedNotificationsCount: 0,
      nextBreakCountdownSeconds: Math.min(25 * 60, durationMinutes * 60),
      paused: false,
    };

    this.addNudge({
      category: 'focus',
      message: `Focus Mode Engaged for ${durationMinutes} minutes. Non-critical notifications silenced.`,
    });

    return { ...this.focusSession };
  }

  public pauseFocusSession() {
    this.focusSession.paused = true;
  }

  public resumeFocusSession() {
    this.focusSession.paused = false;
  }

  public stopFocusSession(): FocusSessionState {
    this.focusSession.isActive = false;
    this.focusSession.paused = false;
    return { ...this.focusSession };
  }

  public completeFocusSession() {
    this.focusSession.isActive = false;
    this.coachingHabits.totalFocusSessionsCompleted += 1;

    this.addNudge({
      category: 'achievement',
      message: `Focus Session Completed! You stayed focused for ${this.focusSession.targetDurationMinutes} minutes.`,
    });
  }

  public getFocusSession(): FocusSessionState {
    return { ...this.focusSession };
  }

  // --- CAMERA-ASSISTED FOCUS (ON-DEVICE ONLY) ---
  public optInCameraFocus(): CameraFocusSettings {
    this.cameraFocus.userOptedIn = true;
    this.cameraFocus.permissionGranted = true;
    this.cameraFocus.enabled = true;
    return { ...this.cameraFocus };
  }

  public optOutCameraFocus(): CameraFocusSettings {
    this.cameraFocus.userOptedIn = false;
    this.cameraFocus.permissionGranted = false;
    this.cameraFocus.enabled = false;
    return { ...this.cameraFocus };
  }

  public simulateCameraStateChange(newState: 'desk_present' | 'user_away' | 'phone_detected' | 'looking_away'): CameraFocusSettings {
    if (!this.cameraFocus.enabled || !this.cameraFocus.userOptedIn) {
      throw new Error('Camera focus is disabled. Explicit user opt-in is required.');
    }

    this.cameraFocus.lastDetectedState = newState;

    if (newState === 'phone_detected' && this.focusSession.isActive) {
      this.addNudge({
        category: 'focus',
        message: 'Still focusing? Let\'s finish this session first.',
      });
    }

    return { ...this.cameraFocus };
  }

  public getCameraFocusSettings(): CameraFocusSettings {
    return { ...this.cameraFocus };
  }

  // --- PRESENCE NUDGES & WELLNESS ---
  public addNudge(nudge: { category: PresenceNudge['category']; message: string; actionLabel?: string }) {
    const item: PresenceNudge = {
      id: `nudge-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      category: nudge.category,
      message: nudge.message,
      actionLabel: nudge.actionLabel,
      dismissed: false,
    };
    this.nudges.unshift(item);
  }

  public dismissNudge(id: string) {
    const found = this.nudges.find((n) => n.id === id);
    if (found) found.dismissed = true;
  }

  public getNudges(): PresenceNudge[] {
    return this.nudges.filter((n) => !n.dismissed);
  }

  public getWellnessSettings(): HealthWellnessSettings {
    return { ...this.wellnessSettings };
  }

  public updateWellnessSettings(updates: Partial<HealthWellnessSettings>): HealthWellnessSettings {
    this.wellnessSettings = { ...this.wellnessSettings, ...updates };
    return { ...this.wellnessSettings };
  }

  public getAdaptiveCoachingHabits(): AdaptiveCoachingHabits {
    return { ...this.coachingHabits };
  }

  // --- NATURAL COMMAND ROUTER ---
  public processNaturalCommand(command: string): { responseText: string; actionTaken: string } {
    const lower = command.toLowerCase().trim();

    if (lower.includes('lock me in') || lower.includes('lock in') || lower.includes('focus mode')) {
      let mins = 45;
      if (lower.includes('15 min')) mins = 15;
      else if (lower.includes('30 min')) mins = 30;
      else if (lower.includes('1 hour') || lower.includes('one hour') || lower.includes('60 min')) mins = 60;
      else if (lower.includes('until lunch')) mins = 90;

      this.startFocusSession(mins);
      return {
        responseText: `Locking you in for ${mins} minutes. Dynamic Island Focus HUD engaged, non-critical alerts queued.`,
        actionTaken: `Started Focus Session (${mins} mins)`,
      };
    }

    if (lower.includes('drink water') || lower.includes('hydration')) {
      this.addNudge({
        category: 'hydration',
        message: 'Hydration reminder registered. I will remind you every 45 minutes.',
      });
      return {
        responseText: 'Hydration reminder set. Stay refreshed while coding!',
        actionTaken: 'Updated Hydration Reminder cadence',
      };
    }

    if (lower.includes('don\'t interrupt') || lower.includes('dont interrupt') || lower.includes('quiet')) {
      aetherCore.updatePersonality({ notificationFrequency: 'Low' });
      return {
        responseText: 'Silencing non-essential interruptions. I will only reach out for critical security blocks or completed builds.',
        actionTaken: 'Set Notification Frequency to Low',
      };
    }

    if (lower.includes('coach me harder') || lower.includes('challenging')) {
      aetherCore.updatePersonality({ persona: 'Coach' });
      return {
        responseText: 'Switched persona to Coach mode. High accountability & performance focus engaged!',
        actionTaken: 'Updated persona to Coach',
      };
    }

    // Default fallback
    return {
      responseText: `Understood: "${command}". Routing through Aether Presence & Intent Engine.`,
      actionTaken: 'Processed Natural Language Intent',
    };
  }
}

export const aetherPresenceEngine = new AetherPresenceEngineManager();
