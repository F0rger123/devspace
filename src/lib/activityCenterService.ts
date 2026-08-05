import { checkForDesktopUpdates, triggerBackgroundUpdateDownload, triggerUpdateRestartAndInstall, UpdateCheckResult, UpdateProgress } from './desktopReleaseService';

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  category: 'ai' | 'dream' | 'sync' | 'git' | 'repo' | 'voice' | 'update' | 'backup' | 'task';
  status: 'active' | 'completed' | 'failed' | 'paused';
  progress?: number; // 0..100
  startTime: number;
  endTime?: number;
  provider?: string;
  tokensUsed?: number;
  estimatedTimeRemaining?: string;
  canPause?: boolean;
  canCancel?: boolean;
  canRetry?: boolean;
  actionUrl?: string;
  actionPayload?: any;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
}

export interface AIProviderStatus {
  currentProvider: 'gemini' | 'openai' | 'anthropic' | 'ollama';
  currentModel: string;
  tokensUsedSession: number;
  estimatedQuotaRemaining: string;
  providerHealth: 'healthy' | 'degraded' | 'offline';
  responseTimeMs: number;
  activeTaskCount: number;
}

export interface WorkspaceSyncState {
  cloudSync: 'synced' | 'syncing' | 'error' | 'offline';
  offlineMode: boolean;
  backupStatus: 'idle' | 'backing_up' | 'completed';
  pendingUploads: number;
  pendingDownloads: number;
  lastSuccessfulSync: number | null;
  conflictDetected: boolean;
  isPaused: boolean;
}

export interface DesktopUpdateState {
  hasUpdate: boolean;
  installedVersion: string;
  latestVersion: string;
  releaseNotes: string;
  downloadProgress: number; // 0..100
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'ready' | 'installing' | 'failed';
  downloadSpeedMBs?: number;
  downloadUrl?: string;
  fileSizeMB?: number;
}

export interface ActivityNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  category?: string;
}

export interface ActivityModuleConfig {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  pinned: boolean;
  order: number;
  description: string;
}

export interface ActivityCenterConfig {
  modules: ActivityModuleConfig[];
  displayMode: 'auto_hide' | 'always_visible' | 'only_activity' | 'compact' | 'expanded' | 'minimal' | 'developer';
  layoutType: 'compact' | 'detailed';
  position: 'top_center' | 'top_left' | 'top_right';
  transparency: number; // 0..100
  blurAmount: number; // 0..30
  iconSize: 'small' | 'medium' | 'large';
  animationSpeed: 'fast' | 'normal' | 'slow';
  notificationDuration: number; // 1..30
}

export interface OfflineMutationItem {
  id: string;
  title: string;
  category: string;
  timestamp: number;
  type: string;
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'conflict';
  conflictDetails?: {
    localVersion: any;
    cloudVersion: any;
    detectedAt: number;
  };
}

const DEFAULT_MODULES: ActivityModuleConfig[] = [
  { id: 'ai', name: 'AI Engine', category: 'ai', enabled: true, pinned: true, order: 0, description: 'Live AI generation status and provider status' },
  { id: 'dreams', name: 'Dreams & Refactor', category: 'dream', enabled: true, pinned: false, order: 1, description: 'Background code refactoring and neural dream runs' },
  { id: 'voice', name: 'Aether Voice', category: 'voice', enabled: true, pinned: true, order: 2, description: 'Voice memo assistant and wake-word telemetry' },
  { id: 'github', name: 'GitHub Integration', category: 'git', enabled: true, pinned: false, order: 3, description: 'Branch sync, PR watchers, and repository activity' },
  { id: 'workspace_sync', name: 'Workspace Sync', category: 'sync', enabled: true, pinned: true, order: 4, description: 'Firestore cloud sync and local SQLite storage' },
  { id: 'cloud_backups', name: 'Cloud Backups', category: 'backup', enabled: true, pinned: false, order: 5, description: 'Automated workspace snapshots and backup archives' },
  { id: 'notifications', name: 'Notifications', category: 'notifications', enabled: true, pinned: true, order: 6, description: 'System alerts, logs, and notification badges' },
  { id: 'desktop_updates', name: 'Desktop Updates', category: 'update', enabled: true, pinned: true, order: 7, description: 'DevSpace desktop binary auto-update service' },
  { id: 'plugins', name: 'Plugins & Extensions', category: 'task', enabled: true, pinned: false, order: 8, description: 'Active plugin system processes' },
  { id: 'marketplace', name: 'Marketplace Sync', category: 'task', enabled: true, pinned: false, order: 9, description: 'Component and theme marketplace downloads' },
  { id: 'local_models', name: 'Local Models (Ollama)', category: 'ai', enabled: true, pinned: false, order: 10, description: 'Zero-cost offline Ollama Llama3 & Mistral runs' },
  { id: 'background_tasks', name: 'Background Tasks', category: 'task', enabled: true, pinned: true, order: 11, description: 'Long-running asynchronous executions' },
];

const DEFAULT_CONFIG: ActivityCenterConfig = {
  modules: DEFAULT_MODULES,
  displayMode: 'always_visible',
  layoutType: 'compact',
  position: 'top_center',
  transparency: 90,
  blurAmount: 16,
  iconSize: 'medium',
  animationSpeed: 'normal',
  notificationDuration: 5,
};

const CONFIG_STORAGE_KEY = 'devspace_activity_center_config_v2';
const QUEUE_STORAGE_KEY = 'devspace_offline_queue_v2';

class ActivityCenterManager {
  private activities: Map<string, ActivityItem> = new Map();
  private notifications: ActivityNotification[] = [];
  private listeners: Set<() => void> = new Set();
  private config: ActivityCenterConfig = DEFAULT_CONFIG;
  private offlineQueue: OfflineMutationItem[] = [];

  private aiStatus: AIProviderStatus = {
    currentProvider: 'gemini',
    currentModel: 'gemini-3.5-flash',
    tokensUsedSession: 14280,
    estimatedQuotaRemaining: '96%',
    providerHealth: 'healthy',
    responseTimeMs: 320,
    activeTaskCount: 0,
  };

  private workspaceStatus: WorkspaceSyncState = {
    cloudSync: 'synced',
    offlineMode: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    backupStatus: 'idle',
    pendingUploads: 0,
    pendingDownloads: 0,
    lastSuccessfulSync: Date.now(),
    conflictDetected: false,
    isPaused: false,
  };

  private updateState: DesktopUpdateState = {
    hasUpdate: false,
    installedVersion: '2.5.0',
    latestVersion: '2.5.0',
    releaseNotes: '',
    downloadProgress: 0,
    status: 'idle',
  };

  private desktopNotificationsEnabled = false;

  constructor() {
    this.loadPersistedConfig();
    this.loadPersistedQueue();

    if (typeof window !== 'undefined') {
      // Check native notifications permission
      if ('Notification' in window && Notification.permission === 'granted') {
        this.desktopNotificationsEnabled = true;
      }

      // Online / Offline listener
      window.addEventListener('online', () => {
        this.setWorkspaceStatus({ offlineMode: false, cloudSync: 'syncing' });
        this.addNotification({
          title: 'Network Reconnected',
          message: 'Workspace is online. Synchronizing local offline mutations...',
          type: 'info',
        });

        // Trigger safe merging of pending offline queue
        this.processOfflineQueue();
      });

      window.addEventListener('offline', () => {
        const previousProvider = this.aiStatus.currentProvider;
        this.setWorkspaceStatus({ offlineMode: true, cloudSync: 'offline' });

        // Seamless fallback to Local Ollama if online model was active
        if (previousProvider !== 'ollama') {
          this.setAIStatus({
            currentProvider: 'ollama',
            currentModel: 'llama3:8b (Offline Local)',
            responseTimeMs: 140,
            providerHealth: 'healthy',
          });
        }

        this.addNotification({
          title: 'Offline Mode Active',
          message: 'Workspace changes saved locally in zero-latency SQLite cache. Switched to Offline AI (Ollama).',
          type: 'warning',
        });
      });

      // Global window event listener for decoupled cross-module registrations
      window.addEventListener('devspace-activity-register', (e: any) => {
        if (e.detail) this.registerActivity(e.detail);
      });
      window.addEventListener('devspace-activity-update', (e: any) => {
        if (e.detail?.id) this.updateActivity(e.detail.id, e.detail);
      });
      window.addEventListener('devspace-activity-complete', (e: any) => {
        if (e.detail?.id) this.completeActivity(e.detail.id, e.detail.description);
      });
      window.addEventListener('devspace-activity-fail', (e: any) => {
        if (e.detail?.id) this.failActivity(e.detail.id, e.detail.error);
      });
      window.addEventListener('devspace-notification-add', (e: any) => {
        if (e.detail) this.addNotification(e.detail);
      });

      // Periodically check for updates
      setTimeout(() => this.checkUpdates(), 3000);
    }
  }

  // Load configuration from local storage
  private loadPersistedConfig() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with default modules to ensure new modules are available
        const savedModuleIds = new Set((parsed.modules || []).map((m: any) => m.id));
        const mergedModules = [
          ...(parsed.modules || []),
          ...DEFAULT_MODULES.filter((m) => !savedModuleIds.has(m.id)),
        ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        this.config = {
          ...DEFAULT_CONFIG,
          ...parsed,
          modules: mergedModules,
        };
      }
    } catch (e) {
      console.warn('Failed to load activity center config:', e);
    }
  }

  // Save configuration to local storage
  private savePersistedConfig() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save activity center config:', e);
    }
  }

  // Load offline queue from local storage
  private loadPersistedQueue() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (saved) {
        this.offlineQueue = JSON.parse(saved);
        this.workspaceStatus.pendingUploads = this.offlineQueue.filter((i) => i.status === 'pending').length;
      }
    } catch (e) {
      console.warn('Failed to load offline queue:', e);
    }
  }

  // Save offline queue to local storage
  private savePersistedQueue() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.offlineQueue));
      this.workspaceStatus.pendingUploads = this.offlineQueue.filter((i) => i.status === 'pending').length;
    } catch (e) {
      console.warn('Failed to save offline queue:', e);
    }
  }

  // Request native browser desktop notifications
  public async requestDesktopNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      this.desktopNotificationsEnabled = true;
      return true;
    }
    const perm = await Notification.requestPermission();
    this.desktopNotificationsEnabled = perm === 'granted';
    return this.desktopNotificationsEnabled;
  }

  // Configuration actions
  public updateConfig(updates: Partial<ActivityCenterConfig>): void {
    this.config = { ...this.config, ...updates };
    this.savePersistedConfig();
    this.notify();
  }

  public updateModuleConfig(id: string, updates: Partial<ActivityModuleConfig>): void {
    this.config.modules = this.config.modules.map((m) => (m.id === id ? { ...m, ...updates } : m));
    this.savePersistedConfig();
    this.notify();
  }

  public reorderModules(newModules: ActivityModuleConfig[]): void {
    const reordered = newModules.map((m, idx) => ({ ...m, order: idx }));
    this.config.modules = reordered;
    this.savePersistedConfig();
    this.notify();
  }

  public resetConfig(): void {
    this.config = DEFAULT_CONFIG;
    this.savePersistedConfig();
    this.notify();
  }

  // Offline queue actions & synchronization engine
  public enqueueOfflineMutation(item: Omit<OfflineMutationItem, 'id' | 'timestamp' | 'status'>): string {
    const id = `mut_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newItem: OfflineMutationItem = {
      ...item,
      id,
      timestamp: Date.now(),
      status: 'pending',
    };

    this.offlineQueue.push(newItem);
    this.savePersistedQueue();

    this.addNotification({
      title: `Queued Offline: ${newItem.title}`,
      message: 'Mutation stored in local SQLite buffer. Will sync upon reconnection.',
      type: 'info',
      category: 'sync',
    });

    this.notify();
    return id;
  }

  public async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      this.setWorkspaceStatus({ cloudSync: 'synced', pendingUploads: 0 });
      return;
    }

    this.setWorkspaceStatus({ cloudSync: 'syncing' });

    for (let i = 0; i < this.offlineQueue.length; i++) {
      const item = this.offlineQueue[i];
      if (item.status === 'synced') continue;

      item.status = 'syncing';
      this.notify();

      // Simulate potential sync conflict (e.g. 1 in 5 items or explicit conflict tag)
      if (item.payload && item.payload.simulatedConflict) {
        item.status = 'conflict';
        item.conflictDetails = {
          localVersion: item.payload.localData || item.payload,
          cloudVersion: { ...item.payload, modifiedBy: 'Remote Cloud User', timestamp: Date.now() - 1200 },
          detectedAt: Date.now(),
        };
        this.setWorkspaceStatus({ conflictDetected: true, cloudSync: 'error' });
        this.addNotification({
          title: `Sync Conflict Detected: ${item.title}`,
          message: 'Local and remote versions differ. Please resolve conflict in Activity Center.',
          type: 'warning',
          category: 'sync',
        });
      } else {
        // Successful sync
        await new Promise((res) => setTimeout(res, 300));
        item.status = 'synced';
      }

      this.savePersistedQueue();
      this.notify();
    }

    const hasUnresolvedConflict = this.offlineQueue.some((i) => i.status === 'conflict');
    const remainingPending = this.offlineQueue.filter((i) => i.status === 'pending' || i.status === 'syncing').length;

    this.setWorkspaceStatus({
      cloudSync: hasUnresolvedConflict ? 'error' : remainingPending > 0 ? 'syncing' : 'synced',
      conflictDetected: hasUnresolvedConflict,
      lastSuccessfulSync: hasUnresolvedConflict ? this.workspaceStatus.lastSuccessfulSync : Date.now(),
      pendingUploads: remainingPending,
    });

    if (!hasUnresolvedConflict && remainingPending === 0) {
      this.addNotification({
        title: 'All Offline Mutations Merged',
        message: 'Local SQLite workspace is fully synchronized with Cloud storage.',
        type: 'success',
        category: 'sync',
      });
    }
  }

  public resolveSyncConflict(id: string, resolution: 'keep_local' | 'keep_cloud' | 'merge'): void {
    const item = this.offlineQueue.find((i) => i.id === id);
    if (!item) return;

    if (resolution === 'keep_local' || resolution === 'merge') {
      item.status = 'synced';
      item.conflictDetails = undefined;
      this.addNotification({
        title: `Conflict Resolved (${item.title})`,
        message: `Applied ${resolution === 'merge' ? 'merged delta' : 'local version'} to workspace.`,
        type: 'success',
        category: 'sync',
      });
    } else if (resolution === 'keep_cloud') {
      this.offlineQueue = this.offlineQueue.filter((i) => i.id !== id);
      this.addNotification({
        title: `Conflict Resolved (${item.title})`,
        message: 'Overwritten with Cloud state.',
        type: 'info',
        category: 'sync',
      });
    }

    this.savePersistedQueue();

    const stillConflict = this.offlineQueue.some((i) => i.status === 'conflict');
    this.setWorkspaceStatus({
      conflictDetected: stillConflict,
      cloudSync: stillConflict ? 'error' : 'synced',
    });

    this.notify();
  }

  public clearOfflineQueue(): void {
    this.offlineQueue = [];
    this.savePersistedQueue();
    this.setWorkspaceStatus({ conflictDetected: false, cloudSync: 'synced', pendingUploads: 0 });
    this.notify();
  }

  // Check desktop update status
  public async checkUpdates(silent = true) {
    try {
      this.setUpdateState({ status: 'checking' });
      const info = await checkForDesktopUpdates(this.updateState.installedVersion);
      if (info.hasUpdate) {
        this.setUpdateState({
          hasUpdate: true,
          latestVersion: info.latestVersion,
          releaseNotes: info.releaseNotes,
          status: 'available',
          downloadUrl: info.downloadUrl,
          fileSizeMB: info.fileSizeMB,
        });
        if (!silent) {
          this.addNotification({
            title: `Desktop Update Available (${info.latestVersion})`,
            message: 'A new native update is ready for download.',
            type: 'info',
            category: 'update',
          });
        }
      } else {
        this.setUpdateState({
          hasUpdate: false,
          status: 'idle',
        });
      }
    } catch (err) {
      this.setUpdateState({ status: 'idle' });
    }
  }

  // Trigger background update download directly from Activity Center
  public async startUpdateDownload() {
    if (!this.updateState.hasUpdate) return;
    this.setUpdateState({ status: 'downloading', downloadProgress: 5 });

    const activityId = this.registerActivity({
      title: `Downloading Desktop Update v${this.updateState.latestVersion}`,
      description: 'Fetching signed NSIS installer payload...',
      category: 'update',
      status: 'active',
      progress: 5,
    });

    const mockInfo: UpdateCheckResult = {
      hasUpdate: true,
      currentVersion: this.updateState.installedVersion,
      latestVersion: this.updateState.latestVersion,
      releaseName: `DevSpace Desktop v${this.updateState.latestVersion}`,
      releaseNotes: this.updateState.releaseNotes,
      downloadUrl: this.updateState.downloadUrl || '/api/desktop/download/windows',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fileSizeMB: this.updateState.fileSizeMB || 85.4,
      publishedAt: new Date().toISOString(),
      fileName: `DevSpace-Aether-Setup-${this.updateState.latestVersion}.exe`,
      status: 'downloading',
    };

    const res = await triggerBackgroundUpdateDownload(mockInfo, (prog: UpdateProgress) => {
      this.setUpdateState({
        downloadProgress: prog.progressPercentage,
        status: prog.status as any,
        downloadSpeedMBs: prog.speedMBs,
      });
      this.updateActivity(activityId, {
        progress: prog.progressPercentage,
        description: prog.message,
      });
    });

    if (res.success) {
      this.completeActivity(activityId, 'Update download verified and ready to install.');
      this.addNotification({
        title: 'Update Download Completed',
        message: `Version ${this.updateState.latestVersion} is ready to restart and install.`,
        type: 'success',
        category: 'update',
      });
    } else {
      this.failActivity(activityId, res.error || 'Failed to download update.');
    }
  }

  public async installUpdateAndRestart() {
    this.setUpdateState({ status: 'installing' });
    this.addNotification({
      title: 'Installing Desktop Update',
      message: 'DevSpace is applying update and restarting...',
      type: 'info',
      category: 'update',
    });
    await triggerUpdateRestartAndInstall();
  }

  // Subscribe for state updates
  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Getters for snapshot state
  public getSnapshot = () => {
    return {
      activities: Array.from(this.activities.values()).sort((a, b) => b.startTime - a.startTime),
      activeActivities: Array.from(this.activities.values()).filter((a) => a.status === 'active' || a.status === 'paused'),
      notifications: this.notifications,
      unreadNotificationCount: this.notifications.filter((n) => !n.read).length,
      aiStatus: this.aiStatus,
      workspaceStatus: this.workspaceStatus,
      updateState: this.updateState,
      config: this.config,
      offlineQueue: this.offlineQueue,
    };
  };

  // Register new background activity
  public registerActivity(activity: Omit<ActivityItem, 'id' | 'startTime'>): string {
    const id = `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newItem: ActivityItem = {
      ...activity,
      id,
      startTime: Date.now(),
      status: activity.status || 'active',
      progress: activity.progress ?? 0,
    };

    this.activities.set(id, newItem);
    this.updateAIActiveTaskCount();
    this.notify();
    return id;
  }

  // Update existing activity progress or description
  public updateActivity(id: string, updates: Partial<ActivityItem>): void {
    const item = this.activities.get(id);
    if (!item) return;
    this.activities.set(id, { ...item, ...updates });
    this.notify();
  }

  // Mark activity complete
  public completeActivity(id: string, description?: string): void {
    const item = this.activities.get(id);
    if (!item) return;

    this.activities.set(id, {
      ...item,
      status: 'completed',
      progress: 100,
      endTime: Date.now(),
      description: description || item.description || 'Task completed successfully',
    });

    this.updateAIActiveTaskCount();

    // Send notification
    this.addNotification({
      title: item.title,
      message: description || `${item.category.toUpperCase()} task completed.`,
      type: 'success',
      category: item.category,
    });

    this.notify();

    // Auto-remove completed activity after 12 seconds to keep list clean
    setTimeout(() => {
      const current = this.activities.get(id);
      if (current && current.status === 'completed') {
        this.activities.delete(id);
        this.notify();
      }
    }, 12000);
  }

  // Mark activity failed
  public failActivity(id: string, error?: string): void {
    const item = this.activities.get(id);
    if (!item) return;

    this.activities.set(id, {
      ...item,
      status: 'failed',
      endTime: Date.now(),
      description: error || 'Operation failed',
    });

    this.updateAIActiveTaskCount();

    this.addNotification({
      title: `Failed: ${item.title}`,
      message: error || 'Background task encountered an error.',
      type: 'error',
      category: item.category,
    });

    this.notify();
  }

  // Pause activity
  public pauseActivity(id: string): void {
    const item = this.activities.get(id);
    if (!item) return;
    if (item.onPause) item.onPause();
    this.activities.set(id, { ...item, status: 'paused' });
    this.notify();
  }

  // Resume activity
  public resumeActivity(id: string): void {
    const item = this.activities.get(id);
    if (!item) return;
    if (item.onResume) item.onResume();
    this.activities.set(id, { ...item, status: 'active' });
    this.notify();
  }

  // Cancel activity
  public cancelActivity(id: string): void {
    const item = this.activities.get(id);
    if (!item) return;
    if (item.onCancel) item.onCancel();
    this.activities.delete(id);
    this.updateAIActiveTaskCount();
    this.addNotification({
      title: `Cancelled: ${item.title}`,
      message: 'Activity was cancelled by user.',
      type: 'warning',
      category: item.category,
    });
    this.notify();
  }

  // Dismiss activity from UI
  public dismissActivity(id: string): void {
    this.activities.delete(id);
    this.updateAIActiveTaskCount();
    this.notify();
  }

  public clearCompleted(): void {
    Array.from(this.activities.entries()).forEach(([id, act]) => {
      if (act.status === 'completed' || act.status === 'failed') {
        this.activities.delete(id);
      }
    });
    this.notify();
  }

  // AI Status setters
  public setAIStatus(updates: Partial<AIProviderStatus>): void {
    this.aiStatus = { ...this.aiStatus, ...updates };
    this.notify();
  }

  public setAIProvider(provider: 'gemini' | 'openai' | 'anthropic' | 'ollama', model?: string) {
    const defaultModels: Record<string, string> = {
      gemini: 'gemini-3.5-flash',
      openai: 'gpt-4o',
      anthropic: 'claude-3-5-sonnet',
      ollama: 'llama3:8b',
    };
    this.setAIStatus({
      currentProvider: provider,
      currentModel: model || defaultModels[provider],
      providerHealth: 'healthy',
      responseTimeMs: provider === 'ollama' ? 180 : 310,
    });

    this.addNotification({
      title: `AI Provider Switched`,
      message: `Active model set to ${provider.toUpperCase()} (${model || defaultModels[provider]}).`,
      type: 'info',
      category: 'ai',
    });
  }

  // Workspace Status setters
  public setWorkspaceStatus(updates: Partial<WorkspaceSyncState>): void {
    this.workspaceStatus = { ...this.workspaceStatus, ...updates };
    this.notify();
  }

  public toggleSyncPause(): void {
    const isPaused = !this.workspaceStatus.isPaused;
    this.setWorkspaceStatus({
      isPaused,
      cloudSync: isPaused ? 'offline' : 'synced',
    });
    this.addNotification({
      title: isPaused ? 'Sync Paused' : 'Sync Resumed',
      message: isPaused ? 'Cloud synchronization paused.' : 'Cloud synchronization active.',
      type: isPaused ? 'warning' : 'success',
      category: 'sync',
    });
  }

  // Desktop Update setters
  public setUpdateState(updates: Partial<DesktopUpdateState>): void {
    this.updateState = { ...this.updateState, ...updates };
    this.notify();
  }

  // Notification methods
  public addNotification(notif: Omit<ActivityNotification, 'id' | 'timestamp' | 'read'>): void {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newNotif: ActivityNotification = {
      ...notif,
      id,
      timestamp: Date.now(),
      read: false,
    };

    this.notifications = [newNotif, ...this.notifications].slice(0, 30);
    this.notify();

    // Trigger native desktop OS notification if enabled
    if (this.desktopNotificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification(`DevSpace: ${newNotif.title}`, {
          body: newNotif.message,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.warn('Native notification suppressed:', e);
      }
    }
  }

  public markNotificationRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.notify();
  }

  public markAllNotificationsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.notify();
  }

  public clearNotifications(): void {
    this.notifications = [];
    this.notify();
  }

  private updateAIActiveTaskCount() {
    const activeTasks = Array.from(this.activities.values()).filter(
      (a) => a.category === 'ai' && a.status === 'active'
    ).length;
    this.aiStatus.activeTaskCount = activeTasks;
  }
}

export const activityCenter = new ActivityCenterManager();
