import { useSyncExternalStore } from 'react';
import { activityCenter } from '../lib/activityCenterService';

export function useActivityCenter() {
  const snapshot = useSyncExternalStore(
    activityCenter.subscribe,
    activityCenter.getSnapshot,
    activityCenter.getSnapshot
  );

  return {
    ...snapshot,
    // Helper actions
    registerActivity: (activity: Parameters<typeof activityCenter.registerActivity>[0]) =>
      activityCenter.registerActivity(activity),
    updateActivity: (id: string, updates: Parameters<typeof activityCenter.updateActivity>[1]) =>
      activityCenter.updateActivity(id, updates),
    completeActivity: (id: string, desc?: string) => activityCenter.completeActivity(id, desc),
    failActivity: (id: string, err?: string) => activityCenter.failActivity(id, err),
    pauseActivity: (id: string) => activityCenter.pauseActivity(id),
    resumeActivity: (id: string) => activityCenter.resumeActivity(id),
    cancelActivity: (id: string) => activityCenter.cancelActivity(id),
    dismissActivity: (id: string) => activityCenter.dismissActivity(id),
    clearCompleted: () => activityCenter.clearCompleted(),
    
    // AI actions
    setAIProvider: (provider: 'gemini' | 'openai' | 'anthropic' | 'ollama', model?: string) =>
      activityCenter.setAIProvider(provider, model),
    setAIStatus: (status: Parameters<typeof activityCenter.setAIStatus>[0]) =>
      activityCenter.setAIStatus(status),
      
    // Workspace actions
    toggleSyncPause: () => activityCenter.toggleSyncPause(),
    setWorkspaceStatus: (status: Parameters<typeof activityCenter.setWorkspaceStatus>[0]) =>
      activityCenter.setWorkspaceStatus(status),
      
    // Update actions
    checkUpdates: (silent?: boolean) => activityCenter.checkUpdates(silent),
    startUpdateDownload: () => activityCenter.startUpdateDownload(),
    installUpdateAndRestart: () => activityCenter.installUpdateAndRestart(),
    
    // Notification actions
    addNotification: (notif: Parameters<typeof activityCenter.addNotification>[0]) =>
      activityCenter.addNotification(notif),
    markNotificationRead: (id: string) => activityCenter.markNotificationRead(id),
    markAllNotificationsRead: () => activityCenter.markAllNotificationsRead(),
    clearNotifications: () => activityCenter.clearNotifications(),
    requestDesktopNotificationPermission: () => activityCenter.requestDesktopNotificationPermission(),

    // Configuration actions
    updateConfig: (updates: Parameters<typeof activityCenter.updateConfig>[0]) =>
      activityCenter.updateConfig(updates),
    updateModuleConfig: (id: string, updates: Parameters<typeof activityCenter.updateModuleConfig>[1]) =>
      activityCenter.updateModuleConfig(id, updates),
    reorderModules: (newModules: Parameters<typeof activityCenter.reorderModules>[0]) =>
      activityCenter.reorderModules(newModules),
    resetConfig: () => activityCenter.resetConfig(),

    // Offline queue actions
    enqueueOfflineMutation: (item: Parameters<typeof activityCenter.enqueueOfflineMutation>[0]) =>
      activityCenter.enqueueOfflineMutation(item),
    processOfflineQueue: () => activityCenter.processOfflineQueue(),
    resolveSyncConflict: (id: string, resolution: 'keep_local' | 'keep_cloud' | 'merge') =>
      activityCenter.resolveSyncConflict(id, resolution),
    clearOfflineQueue: () => activityCenter.clearOfflineQueue(),
  };
}
