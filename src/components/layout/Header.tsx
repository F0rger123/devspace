import { Bell, HelpCircle, Search, Menu, PanelRight, Copy, Check, ExternalLink, Users, Hand, Zap, Move, CameraOff, Mic, MicOff, Sparkles, Target, LayoutDashboard, FolderGit2, Bot, CheckSquare, Map, Github, FileText, Terminal, X, Send, ArrowRight, Download, Laptop, Monitor, Undo2, Redo2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import { SyncPopover } from '../ui/SyncPopover';
import { DownloadDesktopModal } from '../ui/DownloadDesktopModal';
import { haptic } from '../../utils/haptics';
import { undoRedoManager } from '../../lib/aetherActionEngine';

import { isElectron } from '../../lib/electronBridge';

export function Header() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const { 
    toggleCommandPalette, 
    toggleSidebar, 
    toggleRightSidebar, 
    isKineticEnabled,
    setKineticEnabled,
    kineticInteractionMode,
    setKineticInteractionMode,
    setShowFloatingCamera,
    isDrawingModeActive,
    setDrawingModeActive
  } = useStore();
  const { 
    userProfile, 
    googleUser, 
    invitations, 
    acceptInvitation, 
    declineInvitation, 
    syncStatus, 
    isQuotaExceeded,
    showToast,
    isOnline,
    notifications = [],
    markNotificationRead,
    clearAllNotifications,
    isWakeWordEnabled,
    setIsWakeWordEnabled
  } = useData();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [canUndo, setCanUndo] = useState(() => undoRedoManager.canUndo());
  const [canRedo, setCanRedo] = useState(() => undoRedoManager.canRedo());

  useEffect(() => {
    const syncUndoState = () => {
      setCanUndo(undoRedoManager.canUndo());
      setCanRedo(undoRedoManager.canRedo());
    };
    window.addEventListener('aether-undo-state-changed', syncUndoState);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + Shift + Z or Command/Ctrl + Y for Redo
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z') && e.shiftKey) {
        e.preventDefault();
        undoRedoManager.redo();
        syncUndoState();
        return;
      }
      // Command/Ctrl + Z for Undo
      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        // Only trigger if not typing inside an input/textarea
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        undoRedoManager.undo();
        syncUndoState();
        return;
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setDropdownOpen(true);
        }
      }
    };
    const handleOpenDownloadModal = () => setShowDownloadModal(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('devspace-open-download-modal', handleOpenDownloadModal);
    window.addEventListener('devspace-open-desktop-download', handleOpenDownloadModal);
    return () => {
      window.removeEventListener('aether-undo-state-changed', syncUndoState);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('devspace-open-download-modal', handleOpenDownloadModal);
      window.removeEventListener('devspace-open-desktop-download', handleOpenDownloadModal);
    };
  }, []);

  const handleExecuteSearchAI = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setDropdownOpen(false);
      setSearchQuery('');
      showToast("AI command processed successfully", "success");
    }, 1500);
  };

  const commands = [
    { id: '1', name: 'Dashboard', icon: LayoutDashboard, path: '/', shortcut: 'D' },
    { id: '2', name: 'Open Projects', icon: FolderGit2, path: '/projects', shortcut: 'P' },
    { id: '3', name: 'Open Project Brain', icon: Bot, path: '/brain', shortcut: 'B' },
    { id: '4', name: 'Issues & Tasks', icon: CheckSquare, path: '/issues', shortcut: 'I' },
    { id: '5', name: 'Roadmap', icon: Map, path: '/roadmap', shortcut: 'R' },
    { id: '6', name: 'GitHub Intelligence', icon: Github, path: '/github', shortcut: 'G' },
    { id: '7', name: 'Workspace Docs', icon: FileText, path: '/docs', shortcut: 'W' },
  ];

  const [isAetherOpen, setIsAetherOpen] = useState(false);
  const [isAetherMuted, setIsAetherMuted] = useState(() => typeof window !== 'undefined' && localStorage.getItem('isAetherMuted') === 'true');

  useEffect(() => {
    const handleMuteSync = () => {
      setIsAetherMuted(localStorage.getItem('isAetherMuted') === 'true');
    };
    const handleHubSync = () => {
      setIsAetherOpen(localStorage.getItem('aether-hub-open') === 'true');
    };
    window.addEventListener('aether-mute-sync', handleMuteSync);
    window.addEventListener('aether-hub-open-sync', handleHubSync);
    // Initial sync
    handleHubSync();
    handleMuteSync();
    return () => {
      window.removeEventListener('aether-mute-sync', handleMuteSync);
      window.removeEventListener('aether-hub-open-sync', handleHubSync);
    };
  }, []);

  // Determine current Aether voice state with 4 clean user-focused states:
  // 1. Off (closed, muted, wake word off)
  // 2. Off & Unmuted / Standby (closed, unmuted, wake word on)
  // 3. Open & Unmuted (open, unmuted, wake word on)
  // 4. Open on Context Mode (open, unmuted, wake word on, context/draw active)
  let aetherDetailedState: 'off' | 'off_wake' | 'open' | 'context' = 'off';

  if (isDrawingModeActive) {
    aetherDetailedState = 'context';
  } else if (isAetherOpen) {
    aetherDetailedState = 'open';
  } else if (isWakeWordEnabled && !isAetherMuted) {
    aetherDetailedState = 'off_wake';
  } else {
    aetherDetailedState = 'off';
  }

  const handleVoiceStateCycle = () => {
    let nextState: 'off' | 'off_wake' | 'open' | 'context' = 'off';
    
    if (aetherDetailedState === 'off') {
      // From fully off, we go to off but unmuted (listening standby)
      nextState = 'off_wake';
    } else if (aetherDetailedState === 'off_wake') {
      // From off but unmuted, we go to open and unmuted
      nextState = 'open';
    } else if (aetherDetailedState === 'open') {
      // From open and unmuted, we go to context mode
      nextState = 'context';
    } else if (aetherDetailedState === 'context') {
      // From context mode, we go back to fully off
      nextState = 'off';
    }

    let open = false;
    let mute = true;
    let wakeWord = false;
    let drawingMode = false;
    let toastMsg = "";

    if (nextState === 'off') {
      open = false;
      mute = true;
      wakeWord = false;
      drawingMode = false;
      toastMsg = "🔇 Aether AI: Fully Off";
    } else if (nextState === 'off_wake') {
      open = false;
      mute = false;
      wakeWord = true;
      drawingMode = false;
      toastMsg = "🔮 Aether AI: Off & Unmuted (Listening Standby)";
    } else if (nextState === 'open') {
      open = true;
      mute = false;
      wakeWord = true;
      drawingMode = false;
      toastMsg = "✨ Aether AI: Open & Unmuted (Active)";
    } else if (nextState === 'context') {
      open = true;
      mute = false;
      wakeWord = true;
      drawingMode = true;
      toastMsg = "🎯 Aether Intelligence: Active Deep Reasoning & Drawing";
    }

    // Set and dispatch updated states
    window.dispatchEvent(new CustomEvent('aether-logo-toggle', { detail: { open, mute } }));
    if (setIsWakeWordEnabled) setIsWakeWordEnabled(wakeWord);
    localStorage.setItem('isAetherMuted', String(mute));
    window.dispatchEvent(new Event('aether-mute-sync'));
    setDrawingModeActive(drawingMode);

    showToast(toastMsg, 'success', 2500);
    haptic.medium();
  };

  const handleLogoClick = () => {
    navigate('/community');
    haptic.light();
  };

  const handleKineticClick = () => {
    if (!isKineticEnabled) {
      // Transition from OFF -> MACROS
      setKineticEnabled(true);
      setShowFloatingCamera(true);
      setKineticInteractionMode('gesture');
      haptic.medium();
      showToast('🖐️ Spatial Camera: Enabled (Actions & Macros Mode)', 'success', 2500);
    } else if (kineticInteractionMode === 'gesture') {
      // Transition from MACROS -> CURSOR
      setKineticEnabled(true);
      setShowFloatingCamera(true);
      setKineticInteractionMode('cursor');
      haptic.medium();
      showToast('🖱️ Spatial Camera: Enabled (Cursor Navigation Mode)', 'success', 2500);
    } else {
      // Transition from CURSOR -> OFF
      setKineticEnabled(false);
      haptic.warning();
      showToast('🔇 Spatial Camera: Idle / Disabled', 'info', 2500);
    }
  };

  const pendingInvites = invitations ? invitations.filter((i: any) => i.status === 'pending') : [];

  const handleCopyLink = (e: React.MouseEvent, inviteId: string, link: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (googleUser?.email) {
      return googleUser.email[0].toUpperCase();
    }
    return 'D';
  };

  return (
    <header className={`h-11 border-b border-zinc-800/60 flex items-center justify-between px-3 sm:px-4 bg-[#121214]/65 backdrop-blur-md shrink-0 transition-all ${
      isAetherOpen ? 'relative z-[110]' : 'relative z-30'
    }`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={() => { haptic.light(); toggleSidebar(); }} className="p-1.5 text-zinc-500 hover:text-zinc-355 hover:bg-zinc-900 rounded transition-colors">
          <Menu size={16} />
        </button>
        {!isElectron() && (
          <>
            <button
              id="aether-logo-button"
              onClick={handleLogoClick}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
              title="Go to Explore Hub / Dashboard"
            >
              <div className="w-6 h-6 rounded flex items-center justify-center transition-all duration-300 shrink-0 bg-yellow-500 hover:scale-105 shadow-[0_0_12px_rgba(234,179,8,0.35)]">
                <span className="text-black font-extrabold text-[11px] font-mono">D</span>
              </div>
              <span 
                className="tasteful-glitch text-zinc-150 font-display font-light tracking-[0.16em] text-xs sm:text-sm truncate max-w-[120px] min-[380px]:max-w-none group-hover:text-yellow-400 transition-all"
                data-text="DEVSPACE"
              >
                DEVSPACE
              </span>
            </button>
            <div className="h-4 w-[1px] bg-zinc-800 shrink-0 mx-1"></div>
          </>
        )}
        {/* Sleek Tactile Aether Voice Controller Button */}
        <button
          onClick={handleVoiceStateCycle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9.5px] font-mono font-black transition-all duration-300 cursor-pointer select-none active:scale-95 shrink-0 ${
            aetherDetailedState === 'open'
              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/35 hover:bg-yellow-500/20 shadow-[0_0_12px_rgba(234,179,8,0.25)] animate-pulse font-bold'
              : aetherDetailedState === 'context'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/35 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse font-bold'
                : aetherDetailedState === 'off_wake'
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/35 hover:bg-yellow-500/20 shadow-[0_0_12px_rgba(234,179,8,0.15)] font-bold'
                  : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-850'
          }`}
          title={
            aetherDetailedState === 'open'
              ? "Aether AI: OPEN & UNMUTED (Active) - Click to cycle to CONTEXT MODE"
              : aetherDetailedState === 'context'
                ? "Aether AI: OPEN ON CONTEXT MODE (Active & Drawing) - Click to cycle to OFF & UNMUTED"
                : aetherDetailedState === 'off_wake'
                  ? "Aether AI: OFF & UNMUTED (Standby) - Click to cycle to FULLY OFF"
                  : "Aether AI: FULLY OFF - Click to cycle to OPEN & UNMUTED"
          }
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {aetherDetailedState === 'open' && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping"></span>
            )}
            {aetherDetailedState === 'context' && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              aetherDetailedState === 'open'
                ? 'bg-yellow-400'
                : aetherDetailedState === 'context'
                  ? 'bg-amber-400'
                  : aetherDetailedState === 'off_wake'
                    ? 'bg-yellow-400'
                    : 'bg-zinc-650'
            }`}></span>
          </span>

          {aetherDetailedState === 'open' ? (
            <Mic size={11} className="text-yellow-400 shrink-0" />
          ) : aetherDetailedState === 'context' ? (
            <Target size={11} className="text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
          ) : aetherDetailedState === 'off_wake' ? (
            <Sparkles size={11} className="text-yellow-400 shrink-0" />
          ) : (
            <MicOff size={11} className="text-zinc-500 shrink-0" />
          )}

          <span className="hidden min-[480px]:inline uppercase">
            {aetherDetailedState === 'open'
              ? 'Aether AI: ON & OPEN'
              : aetherDetailedState === 'context'
                ? 'Aether AI: CONTEXT MODE'
                : aetherDetailedState === 'off_wake'
                  ? 'Aether AI: OFF (WAITING FOR KEYWORD)'
                  : 'Aether AI: FULLY OFF & MUTED'}
          </span>
        </button>
        <div className="h-4 w-[1px] bg-zinc-800 ml-1 hidden sm:block"></div>
        <div className="relative hidden sm:block shrink-0">
          <button 
            onClick={() => { haptic.light(); setShowSyncDetails(!showSyncDetails); }}
            className="flex items-center justify-center gap-2 ml-2 w-[115px] sm:w-[125px] px-2 py-1 bg-black rounded border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950 transition-colors cursor-pointer select-none shrink-0 overflow-hidden"
            title="View Firestore Sync Status"
          >
            {!isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)] shrink-0"></span>
                <span className="text-[9.5px] font-mono text-amber-500 font-bold tracking-wider truncate">OFFLINE</span>
              </>
            ) : isQuotaExceeded ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)] shrink-0"></span>
                <span className="text-[9.5px] font-mono text-cyan-400 font-bold tracking-wider truncate">CACHE 🔒</span>
              </>
            ) : syncStatus === 'saving' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,1)] shrink-0"></span>
                <span className="text-[9.5px] font-mono text-yellow-500 font-bold tracking-wider truncate">SYNCING...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)] shrink-0"></span>
                <span className="text-[9.5px] font-mono text-red-500 font-bold tracking-wider truncate">ERROR</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,1)] animate-pulse shrink-0"></span>
                <span className="text-[9.5px] font-mono text-yellow-400 font-bold tracking-wider truncate">SYNCED</span>
              </>
            )}
          </button>

          {showSyncDetails && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowSyncDetails(false)}
            />
          )}

          <AnimatePresence>
            {showSyncDetails && (
              <motion.div 
                key="sync-popover"
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute left-2 top-full mt-2.5 z-50"
              >
                <SyncPopover onClose={() => setShowSyncDetails(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex-grow max-w-xs sm:max-w-[260px] mx-2 sm:mx-4 relative hidden sm:block">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
          <span className="text-zinc-600 text-xs mr-2">
            {searchQuery.startsWith('>') ? (
              <Terminal size={14} className="text-amber-500 animate-pulse" />
            ) : (
              <Search size={14} className="text-zinc-500" />
            )}
          </span>
        </div>
        <input 
          ref={searchInputRef}
          type="text" 
          placeholder="Search (use > for AI execution)..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDropdownOpen(false);
              e.currentTarget.blur();
            }
            if (e.key === 'Enter' && searchQuery.startsWith('>') && searchQuery.length > 1) {
              handleExecuteSearchAI();
            }
          }}
          className="w-full bg-[#101012] border border-zinc-850 hover:border-zinc-800 focus:border-yellow-500/50 rounded-md py-1.5 pl-8 pr-8 text-xs focus:outline-none text-zinc-200 transition-colors"
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-1 z-10">
          {searchQuery ? (
            <button 
              onClick={() => { setSearchQuery(''); setDropdownOpen(false); }}
              className="p-0.5 hover:bg-zinc-850 rounded text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X size={10} />
            </button>
          ) : (
            <span className="text-[10px] text-zinc-500 border border-zinc-850 px-1 rounded font-mono">K</span>
          )}
        </div>

        {/* Dropdown Container for Desktop */}
        <AnimatePresence>
          {dropdownOpen && (
            <>
              {/* Overlay listner to close when clicking outside */}
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 bg-[#121214] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col z-50 max-h-[80vh]"
              >
                <div className="overflow-y-auto p-1.5">
                  {searchQuery.startsWith('>') ? (
                    <div className="px-3 py-3">
                      <div className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Zap size={10} /> AI Execution Mode
                      </div>
                      {searchQuery.length > 1 ? (
                        <button 
                          onClick={handleExecuteSearchAI}
                          disabled={executing}
                          className="w-full flex items-center justify-between px-3 py-3 bg-[#09090b] border border-zinc-800 rounded-lg hover:border-amber-500/50 hover:bg-[#18181b] transition-colors group text-left cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                              {executing ? 'Executing...' : 'Run Command'}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 max-w-[90%] truncate font-mono">
                              "{searchQuery.substring(1).trim()}"
                            </div>
                          </div>
                          <div className="text-zinc-600 group-hover:text-amber-500 shrink-0">
                            {executing ? <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                          </div>
                        </button>
                      ) : (
                        <div className="text-center text-xs text-zinc-500 py-6 font-mono">
                          Type an AI command to execute...
                          <div className="text-[10px] mt-2 opacity-50">e.g., "&gt; Deploy latest staging build"</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] font-semibold text-zinc-500 px-3 py-1.5 uppercase tracking-wider font-mono">Suggestions</div>
                      <div className="space-y-0.5">
                        {commands.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                          commands.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cmd) => (
                            <button
                              key={cmd.id}
                              onClick={() => {
                                if (cmd.path) {
                                  navigate(cmd.path);
                                }
                                setDropdownOpen(false);
                              }}
                              className="w-full flex items-center px-3 py-2 rounded-[8px] hover:bg-yellow-500/10 hover:text-yellow-400 text-zinc-300 transition-colors group cursor-pointer text-left"
                            >
                              <cmd.icon size={14} className="mr-3 text-zinc-500 group-hover:text-yellow-400" />
                              <span className="text-xs font-medium">{cmd.name}</span>
                              {cmd.shortcut && (
                                <div className="ml-auto flex gap-1 items-center">
                                  <span className="text-[10px] text-zinc-500 group-hover:text-yellow-400/70 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight size={12}/>
                                  </span>
                                  <kbd className="bg-[#09090b] group-hover:bg-yellow-500/15 px-1.5 py-0.5 rounded text-[9px] uppercase font-mono border border-zinc-800 group-hover:border-yellow-500/25 text-zinc-400 group-hover:text-yellow-400">
                                    {cmd.shortcut}
                                  </kbd>
                                </div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-center text-xs text-zinc-500">
                            No results found for "{searchQuery}"
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-zinc-850 bg-[#09090b] text-[10px] text-zinc-500 flex items-center justify-between">
                  <span>Esc to close</span>
                  <span className="flex items-center gap-1"><kbd className="bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700 font-mono text-[9px]">&gt;</kbd> AI command mode</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Global Undo / Redo Actions Toolbar */}
      <div className="hidden lg:flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur-md border border-zinc-850 rounded-lg p-1 shrink-0">
        <button
          onClick={async () => {
            haptic.light();
            await undoRedoManager.undo();
          }}
          disabled={!canUndo}
          className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-all duration-200 cursor-pointer select-none active:scale-95 ${
            canUndo
              ? 'bg-yellow-500/10 hover:bg-yellow-500/25 border-yellow-500/40 text-yellow-300 hover:text-yellow-100 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.45)]'
              : 'bg-zinc-900/40 border-zinc-850 text-zinc-600 opacity-40 cursor-not-allowed'
          }`}
          title="Global Undo (⌘Z / Ctrl+Z)"
        >
          <Undo2 size={13} className={`transition-transform duration-200 ${canUndo ? 'text-yellow-400 group-hover:-translate-x-0.5 group-hover:scale-110' : ''}`} />
          <span className="text-[10px] font-bold uppercase hidden xl:inline">Undo</span>
          <kbd className="hidden xl:inline-block px-1 py-0.2 rounded text-[8px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold ml-0.5">
            ⌘Z
          </kbd>
        </button>

        <div className="w-[1px] h-3.5 bg-zinc-800" />

        <button
          onClick={async () => {
            haptic.light();
            await undoRedoManager.redo();
          }}
          disabled={!canRedo}
          className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-all duration-200 cursor-pointer select-none active:scale-95 ${
            canRedo
              ? 'bg-yellow-500/10 hover:bg-yellow-500/25 border-yellow-500/40 text-yellow-300 hover:text-yellow-100 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.45)]'
              : 'bg-zinc-900/40 border-zinc-850 text-zinc-600 opacity-40 cursor-not-allowed'
          }`}
          title="Global Redo (⌘⇧Z / Ctrl+Shift+Z)"
        >
          <Redo2 size={13} className={`transition-transform duration-200 ${canRedo ? 'text-yellow-400 group-hover:translate-x-0.5 group-hover:scale-110' : ''}`} />
          <span className="text-[10px] font-bold uppercase hidden xl:inline">Redo</span>
          <kbd className="hidden xl:inline-block px-1 py-0.2 rounded text-[8px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold ml-0.5">
            ⌘⇧Z
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-2.5 sm:gap-4.5">
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Download Desktop App Action Button */}
          {!isElectron() && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); haptic.medium(); setShowDownloadModal(true); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-yellow-500/40 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 hover:text-yellow-200 transition-all cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.15)] select-none"
              title="Download DevSpace as Native PC Software (Offline & Global Context)"
            >
              <Download size={12} className="text-yellow-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider hidden sm:inline">
                Download Desktop
              </span>
            </button>
          )}

          {/* Kinetic Gesture Status Indicator */}
          <button 
            onClick={handleKineticClick}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all cursor-pointer select-none ${
              !isKineticEnabled 
                ? 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:bg-zinc-900 hover:border-zinc-800' 
                : kineticInteractionMode === 'cursor'
                  ? 'bg-cyan-950/20 border-cyan-500/20 text-cyan-400 hover:bg-cyan-950/35 hover:border-cyan-500/40'
                  : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/35 hover:border-emerald-500/40'
            }`}
            title={
              !isKineticEnabled 
                ? "Spatial Camera: Offline (Off → Macros → Cursor)" 
                : kineticInteractionMode === 'cursor'
                  ? "Spatial Camera: Cursor Navigation Mode (Off → Macros → Cursor)"
                  : "Spatial Camera: Actions & Macros Mode (Off → Macros → Cursor)"
            }
          >
            <span className="relative flex h-1.5 w-1.5">
              {isKineticEnabled && (
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  kineticInteractionMode === 'cursor' ? 'bg-cyan-500' : 'bg-emerald-500'
                }`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                !isKineticEnabled 
                  ? 'bg-zinc-650' 
                  : kineticInteractionMode === 'cursor'
                    ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,1)]'
                    : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]'
              }`}></span>
            </span>
            
            {!isKineticEnabled ? (
              <CameraOff size={11} className="text-zinc-500" />
            ) : kineticInteractionMode === 'cursor' ? (
              <Move size={11} className="text-cyan-400" />
            ) : (
              <Zap size={11} className="text-emerald-400" />
            )}

            <span className="text-[9.5px] font-mono font-bold tracking-wider hidden md:inline">
              {!isKineticEnabled 
                ? 'SPATIAL: OFF' 
                : kineticInteractionMode === 'cursor'
                  ? 'SPATIAL: CURSOR'
                  : 'SPATIAL: MACROS'
              }
            </span>
          </button>

          {/* Mobile Search Button */}
          <button 
            onClick={() => { haptic.light(); setDropdownOpen(true); }} 
            className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors sm:hidden"
            title="Search palette"
          >
            <Search size={15} />
          </button>

          {/* Bell Icon & Dropdown Container */}
          <div className="relative">
            <button 
              onClick={() => { haptic.light(); setShowNotifications(!showNotifications); }}
              className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-colors relative"
              title="Notifications"
            >
              <Bell size={16} />
              {(pendingInvites.length > 0 || notifications.some((n: any) => !n.read)) && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.7)]" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
            )}

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  key="notifications-dropdown"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-[#0c0c0e] border border-zinc-850 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                    <div className="p-3 border-b border-zinc-850 flex items-center justify-between bg-[#070708]">
                      <span className="text-[10px] font-bold text-zinc-350 uppercase tracking-wider font-mono">Notifications</span>
                      {(notifications.length > 0 || pendingInvites.length > 0) && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (clearAllNotifications) await clearAllNotifications();
                          }}
                          className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-800 cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900/80 scrollbar-thin">
                      {pendingInvites.length === 0 && notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 space-y-1 bg-zinc-950/20">
                          <p className="text-[11px] font-mono">All caught up!</p>
                          <p className="text-[10px] text-zinc-600">No pending invitations or hub events.</p>
                        </div>
                      ) : (
                        <>
                          {/* Invitations Section */}
                          {pendingInvites.map((invite: any) => (
                            <div key={invite.id} className="p-3 space-y-2.5 hover:bg-zinc-900/20 transition-colors bg-zinc-950/30">
                              <div className="space-y-0.5">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-[11px] font-semibold text-zinc-200 truncate">📁 Invite: {invite.projectName}</h4>
                                  <span className="text-[8px] px-1 bg-yellow-500/10 text-yellow-500 font-mono capitalize border border-yellow-500/20 rounded shrink-0">
                                    {invite.role || 'editor'}
                                  </span>
                                </div>
                                <p className="text-[9px] text-zinc-500 font-mono">
                                  From: {invite.senderEmail}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={async () => {
                                    try {
                                      await acceptInvitation(invite.id);
                                    } catch (e) {
                                      console.error("Error accepting invitation:", e);
                                    }
                                  }}
                                  className="flex-grow py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[10px] rounded transition-colors cursor-pointer text-center"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await declineInvitation(invite.id);
                                    } catch (e) {
                                      console.error("Error declining invitation:", e);
                                    }
                                  }}
                                  className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-bold text-[10px] rounded border border-zinc-800 transition-colors cursor-pointer text-center"
                                >
                                  Decline
                                </button>
                                {invite.inviteLink && (
                                  <button
                                    onClick={(e) => handleCopyLink(e, invite.id, invite.inviteLink)}
                                    className="p-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 rounded border border-zinc-800 transition-colors cursor-pointer"
                                    title="Copy Invite Link"
                                  >
                                    {copiedId === invite.id ? (
                                      <Check size={11} className="text-emerald-400" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* General Notifications Section */}
                          {notifications.map((notif: any) => (
                            <div 
                              key={notif.id} 
                              onClick={async () => {
                                if (markNotificationRead) {
                                  await markNotificationRead(notif.id);
                                }
                              }}
                              className={`p-3 space-y-0.5 hover:bg-zinc-900/30 transition-colors cursor-pointer relative ${!notif.read ? 'bg-zinc-950/40 border-l border-yellow-500/60' : 'bg-transparent'}`}
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <span className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1">
                                  {notif.type === 'star' && '⭐'}
                                  {notif.type === 'comment' && '💬'}
                                  {notif.type === 'friend_request' && '🤝'}
                                  {notif.type === 'message' && '✉️'}
                                  {notif.type === 'collab_request' && '🙋'}
                                  {notif.type === 'collab_accept' && '✅'}
                                  <span className="truncate max-w-[180px]">{notif.title}</span>
                                </span>
                                <span className="text-[8px] text-zinc-500 font-mono shrink-0">
                                  {new Date(notif.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">{notif.description}</p>
                              {!notif.read && (
                                <span className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => { haptic.light(); navigate('/settings'); }}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-bold text-xs cursor-pointer transition-transform hover:scale-105"
            style={{
              backgroundColor: userProfile?.avatarColor || '#3b82f6',
              borderColor: `${userProfile?.avatarColor || '#3b82f6'}80`,
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}
            title={`View profile: ${userProfile?.displayName || googleUser?.email || 'User'}`}
          >
            {getInitials()}
          </button>
        </div>
      </div>
      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {dropdownOpen && (
          <div className="fixed inset-0 bg-[#090a0d] z-50 flex flex-col sm:hidden">
            <div className="flex items-center px-4 py-3 border-b border-zinc-850 gap-3 bg-[#0c0d10]">
              <span className="text-zinc-500">
                {searchQuery.startsWith('>') ? (
                  <Terminal size={15} className="text-amber-500 animate-pulse" />
                ) : (
                  <Search size={15} />
                )}
              </span>
              <input 
                type="text"
                autoFocus
                placeholder="Search or use > for AI execution..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.startsWith('>') && searchQuery.length > 1) {
                    handleExecuteSearchAI();
                  }
                }}
                className="flex-grow bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
              <button 
                onClick={() => { setDropdownOpen(false); setSearchQuery(''); }}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-850 rounded border border-zinc-800 text-zinc-400 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-3">
              {searchQuery.startsWith('>') ? (
                <div className="space-y-4">
                  <div className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={10} /> AI Execution Mode
                  </div>
                  {searchQuery.length > 1 ? (
                    <button 
                      onClick={handleExecuteSearchAI}
                      disabled={executing}
                      className="w-full flex items-center justify-between px-3 py-3 bg-zinc-950 border border-zinc-850 rounded-lg text-left cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          {executing ? 'Executing...' : 'Run Command'}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1 truncate">
                          "{searchQuery.substring(1).trim()}"
                        </div>
                      </div>
                      <Send size={13} className="text-amber-500 animate-pulse" />
                    </button>
                  ) : (
                    <div className="text-center text-xs text-zinc-500 py-10 font-mono">
                      Type an AI command to execute...
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">Suggestions</div>
                  {commands.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                    commands.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cmd) => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          if (cmd.path) {
                            navigate(cmd.path);
                          }
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-zinc-900 text-zinc-300 text-xs font-medium text-left border border-zinc-900 hover:border-zinc-850 transition-all cursor-pointer"
                      >
                        <cmd.icon size={14} className="mr-3 text-zinc-500" />
                        <span>{cmd.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-xs text-zinc-500 py-10 font-mono">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      <DownloadDesktopModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
      />
    </header>
  );
}
