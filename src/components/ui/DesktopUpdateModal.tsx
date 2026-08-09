import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Sparkles, X, RotateCw, CheckCircle2, ShieldCheck, ArrowRight, BellOff } from 'lucide-react';
import { checkForDesktopUpdates, triggerBackgroundUpdateDownload, triggerUpdateRestartAndInstall, UpdateCheckResult, UpdateProgress } from '../../lib/desktopReleaseService';

export function DesktopUpdateModal() {
  const CURRENT_VERSION = '2.5.0';
  const [isOpen, setIsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [isReadyToInstall, setIsReadyToInstall] = useState(false);

  useEffect(() => {
    const runStartupCheck = async () => {
      try {
        const skippedVersion = localStorage.getItem('devspace_skipped_desktop_version');
        const info = await checkForDesktopUpdates(CURRENT_VERSION);
        
        // If an update exists and hasn't been skipped by the user:
        if (info && info.hasUpdate) {
          if (skippedVersion && skippedVersion === info.latestVersion) {
            console.log(`[AutoUpdater] Version ${info.latestVersion} was previously skipped by user.`);
            return;
          }
          setUpdateInfo(info);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('[AutoUpdater] Startup check error:', err);
      }
    };

    const timer = setTimeout(runStartupCheck, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || !updateInfo) return null;

  const handleUpdateNow = async () => {
    setIsDownloading(true);
    
    const result = await triggerBackgroundUpdateDownload(updateInfo, (prog) => {
      setDownloadProgress(prog);
      if (prog.status === 'ready') {
        setIsReadyToInstall(true);
      }
    });

    setIsDownloading(false);

    if (result.success) {
      setIsReadyToInstall(true);
    }
  };

  const handleInstallAndRestart = async () => {
    await triggerUpdateRestartAndInstall();
    setIsOpen(false);
  };

  const handleRemindLater = () => {
    setIsOpen(false);
  };

  const handleSkipVersion = () => {
    if (updateInfo?.latestVersion) {
      localStorage.setItem('devspace_skipped_desktop_version', updateInfo.latestVersion);
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#09090b] border border-blue-500/30 rounded-2xl p-6 max-w-lg w-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-zinc-100 relative overflow-hidden"
        >
          {/* Header Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          {/* Close Button */}
          <button
            onClick={handleRemindLater}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-900 cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100">DevSpace Desktop Update</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                  {updateInfo.latestVersion}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Current: <span className="font-mono text-zinc-300">v{CURRENT_VERSION}</span> • Ready for automatic background install.
              </p>
            </div>
          </div>

          {/* Release Notes Box */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 mb-5 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider block">
              Release Notes ({updateInfo.latestVersion})
            </span>
            <div className="text-xs text-zinc-300 space-y-1.5 whitespace-pre-line max-h-36 overflow-y-auto pr-1">
              {updateInfo.releaseNotes || '• Performance enhancements and zero-latency local state sync\n• Fixed Spotify playback volume sync\n• Integrated real OAuth session handlers\n• Enhanced background updater stability'}
            </div>
          </div>

          {/* Download Progress Bar */}
          {downloadProgress && (
            <div className="mb-5 space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">{downloadProgress.message}</span>
                <span className="text-blue-400 font-bold">{Math.round(downloadProgress.progressPercentage)}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${downloadProgress.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-zinc-850">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSkipVersion}
                className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Don't ask again for this version"
              >
                <BellOff size={13} /> Skip Version
              </button>
              <button
                onClick={handleRemindLater}
                className="px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Remind Later
              </button>
            </div>

            {isReadyToInstall ? (
              <button
                onClick={handleInstallAndRestart}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <RotateCw size={14} className="animate-spin" /> Restart & Install Update
              </button>
            ) : (
              <button
                onClick={handleUpdateNow}
                disabled={isDownloading}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <RotateCw size={14} className="animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download size={14} /> Update Now
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
