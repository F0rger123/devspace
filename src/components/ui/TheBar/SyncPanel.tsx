import React from 'react';
import { RefreshCw } from 'lucide-react';
import { OfflineMutationItem, WorkspaceSyncState } from '../../../lib/activityCenterService';

interface SyncPanelProps {
  workspaceStatus: WorkspaceSyncState;
  offlineQueue: OfflineMutationItem[];
  pendingCount: number;
  onSyncNow: () => void;
  onResolveConflict: (id: string, resolution: 'keep_local' | 'keep_cloud') => void;
}

export const SyncPanel: React.FC<SyncPanelProps> = ({
  workspaceStatus,
  offlineQueue,
  pendingCount,
  onSyncNow,
  onResolveConflict,
}) => {
  return (
    <div className="space-y-2.5 font-mono">
      <div className="p-3 bg-slate-900/60 border border-white/15 rounded-2xl flex items-center justify-between backdrop-blur-xl">
        <div>
          <span className="text-xs font-bold text-slate-100 block">Workspace Persistence Engine</span>
          <span className="text-[10px] text-slate-400">
            {workspaceStatus.offlineMode ? 'SQLite Offline Store Active' : 'Cloud Firestore Synchronized'}
          </span>
        </div>

        <button
          onClick={onSyncNow}
          disabled={pendingCount === 0}
          className="px-3 py-1 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-extrabold text-[10.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1"
        >
          <RefreshCw size={11} className={workspaceStatus.cloudSync === 'syncing' ? 'animate-spin' : ''} />
          Sync Now
        </button>
      </div>

      {pendingCount === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs font-mono bg-slate-900/40 border border-white/10 rounded-2xl leading-relaxed">
          Offline sync queue is completely clear.
        </div>
      ) : (
        offlineQueue.map((item) => (
          <div key={item.id} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span>{item.title}</span>
              <span className="text-[9px] uppercase px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-400/30">
                {item.status}
              </span>
            </div>
            {item.status === 'conflict' && (
              <div className="pt-1 flex items-center gap-2 text-[10px]">
                <button
                  onClick={() => onResolveConflict(item.id, 'keep_local')}
                  className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-400/30 cursor-pointer font-medium"
                >
                  Keep Local
                </button>
                <button
                  onClick={() => onResolveConflict(item.id, 'keep_cloud')}
                  className="px-2 py-0.5 bg-white/10 text-slate-300 rounded cursor-pointer font-medium"
                >
                  Keep Cloud
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
