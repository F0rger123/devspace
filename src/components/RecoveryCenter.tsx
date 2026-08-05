import React, { useState } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  Trash2, 
  Archive, 
  Clock, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Upload,
  RefreshCw, 
  FileText, 
  Layers, 
  Lock, 
  Server, 
  Sparkles,
  Database,
  Info,
  Check,
  X,
  Search,
  HardDrive
} from 'lucide-react';
import { useData } from '../context/DataProvider';

export function RecoveryCenter() {
  const {
    projects,
    notes,
    issues,
    cortexSynapses,
    deletedProjects,
    restoreDeletedProject,
    permanentlyDeleteProject,
    workspaceBackups,
    createWorkspaceBackup,
    restoreWorkspaceBackup,
    syncConflict,
    resolveSyncConflict,
    syncAuditLogs,
    projectVersions,
    restoreProjectVersion,
    userProfile,
    googleUser,
    showToast
  } = useData() as any;

  const [activeSubTab, setActiveSubTab] = useState<'backups' | 'trash' | 'versions' | 'audit' | 'conflicts'>('backups');
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'blocked' | 'warn' | 'error'>('all');
  const [logSearch, setLogSearch] = useState('');
  const [selectedVersionProject, setSelectedVersionProject] = useState<string>(() => projects[0]?.id || '');
  const [confirmRestoreBackupId, setConfirmRestoreBackupId] = useState<string | null>(null);
  const [confirmRestoreVersionId, setConfirmRestoreVersionId] = useState<string | null>(null);
  const [customBackupReason, setCustomBackupReason] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // Filter logs
  const filteredLogs = (syncAuditLogs || []).filter((log: any) => {
    if (logFilter !== 'all' && log.status !== logFilter) return false;
    if (logSearch) {
      const q = logSearch.toLowerCase();
      return (
        log.details?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.collection?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter versions for selected project
  const currentProjectVersions = (projectVersions || []).filter((v: any) => v.projectId === selectedVersionProject);

  const handleCreateInstantBackup = () => {
    setIsCreatingBackup(true);
    setTimeout(() => {
      if (createWorkspaceBackup) {
        createWorkspaceBackup(customBackupReason.trim() || 'Manual User Snapshot');
      }
      setCustomBackupReason('');
      setIsCreatingBackup(false);
    }, 300);
  };

  return (
    <div className="space-y-6 text-zinc-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-950 border border-emerald-500/20 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
                <ShieldCheck size={12} /> Sync Protection Active
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Phase 4.0 Data Integrity Architecture
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Recovery Center & Workspace Safeguards
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Your workspace is protected by non-authoritative empty sync guards, automatic versioned local backups, soft-delete safety bins, and conflict resolution engines.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCreateInstantBackup}
              disabled={isCreatingBackup}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <HardDrive size={14} />
              {isCreatingBackup ? 'Creating Snapshot...' : 'Instant Backup Snapshot'}
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-800/60 font-mono text-[10px]">
          <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
            <div className="text-zinc-500 uppercase">ACTIVE PROJECTS</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">{projects?.length || 0} Projects</div>
          </div>
          <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
            <div className="text-zinc-500 uppercase">LOCAL BACKUPS</div>
            <div className="text-blue-400 font-bold text-sm mt-0.5">{workspaceBackups?.length || 0} / 20 Snapshots</div>
          </div>
          <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
            <div className="text-zinc-500 uppercase">TRASH BIN (30 DAYS)</div>
            <div className="text-amber-400 font-bold text-sm mt-0.5">{deletedProjects?.length || 0} Soft-Deleted</div>
          </div>
          <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
            <div className="text-zinc-500 uppercase">SYNC CONFLICTS</div>
            <div className={`font-bold text-sm mt-0.5 ${syncConflict ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`}>
              {syncConflict ? '1 CONFLICT DETECTED' : '0 Conflicts'}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Conflict Warning Banner */}
      {syncConflict && !syncConflict.resolved && (
        <div className="border border-red-500/40 bg-red-950/20 rounded-xl p-5 space-y-3 shadow-md animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-400 shrink-0" size={20} />
              <div>
                <h3 className="text-sm font-bold text-red-200">
                  Sync Protection Alert: Cloud & Local Workspace Disparities Detected
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {syncConflict.reason || 'Cloud state differs from local workspace state. Silenced automatic overwrite.'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
              NON-AUTHORITATIVE OVERWRITE BLOCKED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-950/60 p-3 rounded-lg border border-zinc-850">
            <div>
              <span className="text-zinc-500 font-mono text-[10px] block">LOCAL WORKSPACE DATA</span>
              <span className="font-bold text-zinc-200">{syncConflict.localCount || projects.length} Active Projects</span>
            </div>
            <div>
              <span className="text-zinc-500 font-mono text-[10px] block">CLOUD WORKSPACE DATA</span>
              <span className="font-bold text-zinc-200">{syncConflict.cloudCount || 0} Cloud Documents</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => resolveSyncConflict('keep_local')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload size={13} /> Keep Local Data & Push to Cloud
            </button>
            <button
              onClick={() => resolveSyncConflict('merge')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={13} /> Merge Local & Cloud Items
            </button>
            <button
              onClick={() => resolveSyncConflict('keep_cloud')}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={13} /> Accept Cloud Data (Overwrite Local)
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'backups', label: 'Local Backups 💾', count: workspaceBackups?.length || 0 },
          { id: 'trash', label: 'Trash Bin (Soft Delete) ♻️', count: deletedProjects?.length || 0 },
          { id: 'versions', label: 'Project Versions 🕒', count: projectVersions?.length || 0 },
          { id: 'audit', label: 'Sync Audit Log 📋', count: syncAuditLogs?.length || 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-zinc-800 text-zinc-100 border-t border-x border-zinc-700 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-zinc-700 text-zinc-300 font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: LOCAL BACKUPS */}
      {activeSubTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <HardDrive size={14} className="text-blue-400" /> Automatic & Manual Workspace Snapshots
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                The platform automatically retains up to 20 versioned local backups containing projects, notes, issues, synapses, and AI rules.
              </p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Optional backup note/reason..."
                value={customBackupReason}
                onChange={(e) => setCustomBackupReason(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs px-2.5 py-1.5 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 flex-1 sm:w-48"
              />
              <button
                onClick={handleCreateInstantBackup}
                disabled={isCreatingBackup}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer"
              >
                Create Snapshot
              </button>
            </div>
          </div>

          {/* Backups List */}
          {(!workspaceBackups || workspaceBackups.length === 0) ? (
            <div className="p-8 border border-zinc-850 rounded-xl bg-zinc-950/20 text-center space-y-2">
              <HardDrive size={28} className="mx-auto text-zinc-600" />
              <p className="text-xs text-zinc-400">No workspace backups recorded yet.</p>
              <button
                onClick={handleCreateInstantBackup}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium"
              >
                Create First Snapshot
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {workspaceBackups.map((backup: any) => (
                <div
                  key={backup.id}
                  className="bg-zinc-950/50 border border-zinc-850 hover:border-zinc-750 p-3.5 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200 font-mono">
                        {backup.formattedDate || new Date(backup.timestamp).toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-400 font-mono text-[9px]">
                        {backup.triggerReason || 'Auto Backup'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 flex flex-wrap gap-3 font-mono">
                      <span>📁 {backup.data?.projects?.length || 0} Projects</span>
                      <span>📝 {backup.data?.notes?.length || 0} Notes</span>
                      <span>🎯 {backup.data?.issues?.length || 0} Issues</span>
                      <span>🧠 {backup.data?.cortexSynapses?.length || 0} Synapses</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {confirmRestoreBackupId === backup.id ? (
                      <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/30 p-1.5 rounded-lg">
                        <span className="text-[10px] text-amber-300 font-medium">Confirm restore?</span>
                        <button
                          onClick={() => {
                            if (restoreWorkspaceBackup) restoreWorkspaceBackup(backup.id);
                            setConfirmRestoreBackupId(null);
                          }}
                          className="px-2 py-1 bg-amber-500 text-black font-bold text-[10px] rounded hover:bg-amber-400 cursor-pointer"
                        >
                          Yes, Restore
                        </button>
                        <button
                          onClick={() => setConfirmRestoreBackupId(null)}
                          className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] rounded hover:bg-zinc-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRestoreBackupId(backup.id)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-blue-600/30 hover:border-blue-500/40 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RotateCcw size={13} className="text-blue-400" /> Restore Snapshot
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: TRASH BIN (SOFT DELETE) */}
      {activeSubTab === 'trash' && (
        <div className="space-y-4">
          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl">
            <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Archive size={14} className="text-amber-400" /> Deleted Projects Trash Bin (30-Day Retention)
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Deleted projects are moved here instead of being permanently erased. You can restore them anytime within 30 days.
            </p>
          </div>

          {(!deletedProjects || deletedProjects.length === 0) ? (
            <div className="p-8 border border-zinc-850 rounded-xl bg-zinc-950/20 text-center space-y-1">
              <CheckCircle2 size={28} className="mx-auto text-emerald-500/60" />
              <p className="text-xs text-zinc-400">Trash Bin is empty. No deleted projects in retention.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deletedProjects.map((del: any) => {
                const daysRemaining = Math.max(0, Math.ceil(((del.expiresAt || (del.deletedAt + 30*86400000)) - Date.now()) / (1000 * 60 * 60 * 24)));
                return (
                  <div
                    key={del.id}
                    className="bg-zinc-950/50 border border-zinc-850 hover:border-zinc-750 p-4 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-100">{del.name}</h4>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[9px]">
                          {daysRemaining} Days Left
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1">{del.description || 'No description'}</p>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        Deleted: {new Date(del.deletedAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (restoreDeletedProject) restoreDeletedProject(del.id);
                        }}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RotateCcw size={13} /> Restore Project
                      </button>
                      <button
                        onClick={() => {
                          if (permanentlyDeleteProject) permanentlyDeleteProject(del.id);
                        }}
                        className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-red-400 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} /> Delete Permanently
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PROJECT VERSIONS */}
      {activeSubTab === 'versions' && (
        <div className="space-y-4">
          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-400" /> Project Version Timeline
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Compare and roll back specific projects to previous saved states and configurations.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedVersionProject}
                onChange={(e) => setSelectedVersionProject(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentProjectVersions.length === 0 ? (
            <div className="p-8 border border-zinc-850 rounded-xl bg-zinc-950/20 text-center space-y-1">
              <History size={28} className="mx-auto text-zinc-600" />
              <p className="text-xs text-zinc-400">No previous versions captured for this project yet.</p>
              <p className="text-[10px] text-zinc-500">Project versions are generated automatically when major edits or roadmap updates occur.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentProjectVersions.map((ver: any) => (
                <div
                  key={ver.id}
                  className="bg-zinc-950/50 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200 font-mono">
                        Version {ver.versionNumber || 1}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(ver.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{ver.description || 'Project update snapshot'}</p>
                  </div>

                  <button
                    onClick={() => {
                      if (restoreProjectVersion) restoreProjectVersion(ver.id);
                    }}
                    className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={13} /> Roll Back to Version
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: SYNC AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/40 p-3 border border-zinc-850 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'success', 'blocked', 'warn', 'error'].map((status) => (
                <button
                  key={status}
                  onClick={() => setLogFilter(status as any)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono capitalize transition-all cursor-pointer ${
                    logFilter === status
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 w-full sm:w-48"
              />
            </div>
          </div>

          {/* Audit Logs Table */}
          {filteredLogs.length === 0 ? (
            <div className="p-8 border border-zinc-850 rounded-xl bg-zinc-950/20 text-center text-xs text-zinc-500">
              No audit log entries matching criteria.
            </div>
          ) : (
            <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950/30">
              <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-900 font-mono text-[11px]">
                {filteredLogs.map((log: any) => {
                  const isBlocked = log.status === 'blocked';
                  const isWarn = log.status === 'warn';
                  const isSuccess = log.status === 'success';
                  const isError = log.status === 'error';

                  return (
                    <div key={log.id} className="p-3 hover:bg-zinc-900/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isBlocked ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            isWarn ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            isError ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-zinc-300 font-bold">{log.action || 'SYNC'}</span>
                          <span className="text-zinc-500">[{log.collection || 'workspace'}]</span>
                        </div>
                        <p className="text-zinc-400 font-sans text-xs">{log.details}</p>
                      </div>

                      <span className="text-[10px] text-zinc-600 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
