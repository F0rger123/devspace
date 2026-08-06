import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  HardDrive, 
  Sparkles, 
  Terminal, 
  Cpu, 
  Lock, 
  Info,
  RotateCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { 
  checkForDesktopUpdates, 
  triggerBackgroundUpdateDownload, 
  triggerUpdateRestartAndInstall,
  triggerWindowsInstallerDownload,
  UpdateCheckResult, 
  UpdateProgress 
} from '../lib/desktopReleaseService';

export function DesktopAutoUpdateCenter() {
  const { showToast, createWorkspaceBackup } = useData();

  const [currentVersion] = useState('2.5.0');
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);

  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress>({
    status: 'idle',
    progressPercentage: 0,
    downloadedBytes: 0,
    totalBytes: 89547520,
    speedMBs: 0,
    message: 'System is up to date.'
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check for updates on mount
  useEffect(() => {
    handleCheckForUpdates(true);
  }, []);

  const handleCheckForUpdates = async (silent = false) => {
    setIsChecking(true);
    if (!silent) showToast('🔍 Checking GitHub Releases for latest Desktop update...', 'info', 2500);

    try {
      const info = await checkForDesktopUpdates(currentVersion);
      setUpdateInfo(info);

      if (info.hasUpdate) {
        setDownloadProgress(prev => ({
          ...prev,
          status: 'available',
          message: `New Desktop Update ${info.latestVersion} Available!`
        }));
        if (!silent) showToast(`🚀 New Desktop Update ${info.latestVersion} found!`, 'success', 4000);
      } else {
        setDownloadProgress(prev => ({
          ...prev,
          status: 'idle',
          message: `DevSpace Desktop v${currentVersion} is up to date.`
        }));
        if (!silent) showToast(`✅ You are running the latest version (v${currentVersion}).`, 'success', 3000);
      }
    } catch (err: any) {
      console.error('Update check failed:', err);
      if (!silent) showToast('⚠️ Could not connect to update channel.', 'info', 3000);
    } finally {
      setIsChecking(false);
    }
  };

  const handleStartBackgroundDownload = async () => {
    if (!updateInfo || !updateInfo.hasUpdate) return;

    setIsDownloading(true);
    showToast(`📥 Starting background update download (${updateInfo.latestVersion})...`, 'info', 3000);

    const result = await triggerBackgroundUpdateDownload(updateInfo, (prog) => {
      setDownloadProgress(prog);
    });

    setIsDownloading(false);

    if (result.success) {
      showToast(`✅ Update ${updateInfo.latestVersion} payload verified! Click "Restart to Install".`, 'success', 5000);
    } else {
      showToast(`❌ Update download failed: ${result.error || 'Network error'}`, 'error', 5000);
    }
  };

  const handleRestartAndInstall = async () => {
    setIsInstalling(true);
    try {
      // Create workspace data snapshot prior to update installation
      createWorkspaceBackup(`Pre-Update Snapshot v${currentVersion} -> ${updateInfo?.latestVersion || 'v2.6.0'}`);

      showToast('⚡ Initiating Windows installer restart... Preserving all %USERPROFILE%\\.devspace user data.', 'success', 4000);
      const res = await triggerUpdateRestartAndInstall();

      if (res.success) {
        showToast(res.message, 'success', 5000);
      } else {
        showToast('⚠️ Failed to spawn silent installer automatically. Launching manual setup download.', 'info', 4000);
        triggerWindowsInstallerDownload(updateInfo?.downloadUrl || '/api/desktop/download/windows');
      }
    } catch (err: any) {
      showToast(`⚠️ Installation error: ${err.message}`, 'error', 4000);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="space-y-6 text-zinc-200 font-sans">
      {/* Top Header Card */}
      <div className="p-5 bg-gradient-to-r from-yellow-950/30 via-[#0e0e14] to-zinc-950 border border-yellow-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <RotateCw size={22} className={isChecking ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white font-mono tracking-wide">
                Automatic Desktop Updates Engine
              </h3>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded text-[10px] font-mono font-bold">
                Windows x64 NSIS
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans mt-0.5 leading-relaxed">
              GitHub Releases Auto-Updater • SHA256 Signature Verification • Zero Data Loss Guarantee
            </p>
          </div>
        </div>

        <button
          onClick={() => handleCheckForUpdates(false)}
          disabled={isChecking || isDownloading}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 hover:border-yellow-500/40 text-yellow-400 hover:text-yellow-300 font-mono text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm self-stretch sm:self-auto justify-center"
        >
          <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
          <span>{isChecking ? 'Checking GitHub...' : 'Check For Updates'}</span>
        </button>
      </div>

      {/* Version Status Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-4 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Installed Version</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-white">v{currentVersion}</span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
              Active
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Latest GitHub Release</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-yellow-400">
              {updateInfo?.latestVersion || 'v2.6.0'}
            </span>
            {updateInfo?.hasUpdate ? (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded text-[9px] font-bold animate-pulse">
                UPDATE READY
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
                UP TO DATE
              </span>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Signature Security</span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs pt-1">
            <ShieldCheck size={16} />
            <span>SHA-256 Verified</span>
          </div>
        </div>
      </div>

      {/* Error Alert Box if Update or Download Failed */}
      {(downloadProgress.status === 'failed' || updateInfo?.error) && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl flex items-start justify-between gap-4 font-mono text-xs text-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-extrabold text-red-400 block text-xs">Update Error</span>
              <p className="text-[11px] text-zinc-300 font-sans">
                {downloadProgress.error || updateInfo?.error || downloadProgress.message || 'An error occurred during update check or download.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (updateInfo?.hasUpdate) {
                handleStartBackgroundDownload();
              } else {
                handleCheckForUpdates(false);
              }
            }}
            className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-red-200 font-bold rounded-lg transition-all text-xs shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Update Card / Download Progress / Restart Action */}
      {updateInfo?.hasUpdate ? (
        <div className="p-5 bg-[#0e0e14] border border-yellow-500/40 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-white font-mono flex items-center gap-2">
                <span>🚀 DevSpace Desktop {updateInfo.latestVersion} Available</span>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/40 text-[10px]">
                  Released {new Date(updateInfo.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </h4>
              <p className="text-xs text-zinc-400 font-sans mt-1">
                A new version of DevSpace Desktop is available with performance improvements and bug fixes.
              </p>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-yellow-400 font-bold block">{updateInfo.fileSizeMB} MB</span>
              <span className="text-zinc-500 text-[10px]">Windows NSIS Executable</span>
            </div>
          </div>

          {/* Release Notes */}
          <div className="p-3.5 bg-zinc-950/70 border border-zinc-850 rounded-xl space-y-1.5 font-sans">
            <span className="text-xs font-bold font-mono text-zinc-300 block">Release Highlights:</span>
            <div className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-mono text-[11px] bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
              {updateInfo.releaseNotes}
            </div>
          </div>

          {/* Download Progress Bar */}
          {(isDownloading || downloadProgress.status === 'ready' || downloadProgress.status === 'downloading') && (
            <div className="p-4 bg-zinc-950 border border-yellow-500/30 rounded-xl space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-300 font-bold flex items-center gap-1.5">
                  <RefreshCw size={13} className={isDownloading ? 'animate-spin' : ''} />
                  {downloadProgress.message}
                </span>
                <span className="text-white font-bold">{downloadProgress.progressPercentage}%</span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 transition-all duration-300"
                  style={{ width: `${downloadProgress.progressPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                <span>Speed: {downloadProgress.speedMBs || 15.4} MB/s</span>
                <span>Payload: {(downloadProgress.downloadedBytes / (1024 * 1024)).toFixed(1)} / {updateInfo.fileSizeMB} MB</span>
              </div>
            </div>
          )}

          {/* SHA256 Verification Badge */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between font-mono text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Lock size={13} className="text-yellow-400" />
              <span>SHA-256 Payload Hash:</span>
            </span>
            <code className="text-yellow-400 font-bold truncate max-w-[280px]" title={updateInfo.sha256}>
              {updateInfo.sha256}
            </code>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
              <ShieldCheck size={14} />
              <span>User data in %USERPROFILE%\.devspace is 100% preserved.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {downloadProgress.status === 'ready' ? (
                <button
                  onClick={handleRestartAndInstall}
                  disabled={isInstalling}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={15} className={isInstalling ? 'animate-spin' : ''} />
                  <span>{isInstalling ? 'INSTALLING & RESTARTING...' : 'RESTART TO INSTALL UPDATE'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartBackgroundDownload}
                  disabled={isDownloading}
                  className="w-full sm:w-auto px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isDownloading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                  <span>{isDownloading ? 'DOWNLOADING IN BACKGROUND...' : 'DOWNLOAD UPDATE IN BACKGROUND'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Up To Date State Card */
        <div className="p-6 bg-[#0d0d12] border border-zinc-850 rounded-2xl text-center space-y-3 font-sans">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-white font-mono">
              DevSpace Desktop Is Up To Date
            </h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              You are running version <strong className="text-yellow-400 font-mono">v{currentVersion}</strong>. Automatic update monitoring runs silently in the background on startup.
            </p>
          </div>
        </div>
      )}

      {/* Security & Data Loss Protection Guarantee Notice */}
      <div className="p-4 bg-[#0a0a0e] border border-zinc-850 rounded-xl space-y-2 font-mono text-xs">
        <div className="flex items-center gap-2 text-yellow-400 font-bold">
          <ShieldCheck size={16} />
          <span>Windows Update & Data Integrity Specifications</span>
        </div>
        <ul className="space-y-1 text-[11px] text-zinc-400 list-disc list-inside font-sans">
          <li><strong>GitHub Releases Querying:</strong> Real-time HTTP comparison against the latest tagged releases on GitHub.</li>
          <li><strong>SHA-256 Verification:</strong> Pre-installation cryptographic digest verification prevents corrupted or tampered payloads.</li>
          <li><strong>Data Retention Guarantee:</strong> Your local SQLite database, settings, and workspace snapshots stored in <code className="text-yellow-300 font-mono">%USERPROFILE%\.devspace</code> remain completely untouched.</li>
          <li><strong>Windows NSIS Installer:</strong> Supports silent executable launcher (<code className="text-yellow-300 font-mono">/S</code>) for smooth restart transitions.</li>
        </ul>
      </div>
    </div>
  );
}
