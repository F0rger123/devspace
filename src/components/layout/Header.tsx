import { Bell, HelpCircle, Search, Menu, PanelRight, Copy, Check, ExternalLink, Users, Hand, Zap, Move, CameraOff, Mic, MicOff, Sparkles } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import { SyncPopover } from '../ui/SyncPopover';
import { haptic } from '../../utils/haptics';

export function Header() {
  const { 
    toggleCommandPalette, 
    toggleSidebar, 
    toggleRightSidebar, 
    isKineticEnabled,
    setKineticEnabled,
    kineticInteractionMode,
    setKineticInteractionMode,
    setShowFloatingCamera
  } = useStore();
  const { 
    userProfile, 
    googleUser, 
    invitations, 
    acceptInvitation, 
    declineInvitation, 
    syncStatus, 
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

  // Determine current Aether voice state
  // 1. ACTIVE: open and not muted
  // 2. STANDBY: closed, unmuted, and wake-word enabled
  // 3. MUTED/OFF: otherwise
  let aetherState: 'active' | 'standby' | 'muted' = 'muted';
  if (isAetherOpen && !isAetherMuted) {
    aetherState = 'active';
  } else if (!isAetherOpen && !isAetherMuted && isWakeWordEnabled) {
    aetherState = 'standby';
  } else {
    aetherState = 'muted';
  }

  const handleVoiceStateCycle = () => {
    if (aetherState === 'active') {
      // Transition from ACTIVE -> STANDBY:
      // Close hub, unmute/keep unmuted, keep wake-word active
      window.dispatchEvent(new CustomEvent('aether-logo-toggle', { detail: { open: false, mute: false } }));
      if (setIsWakeWordEnabled) setIsWakeWordEnabled(true);
      localStorage.setItem('isAetherMuted', 'false');
      window.dispatchEvent(new Event('aether-mute-sync'));
      
      showToast('🔮 Aether: Standby (Listening for "Hey Aether")', 'success', 2500);
      haptic.success();
    } else if (aetherState === 'standby') {
      // Transition from STANDBY -> MUTED/OFF:
      // Close hub, mute background listening
      window.dispatchEvent(new CustomEvent('aether-logo-toggle', { detail: { open: false, mute: true } }));
      localStorage.setItem('isAetherMuted', 'true');
      window.dispatchEvent(new Event('aether-mute-sync'));
      
      showToast('🔇 Aether: Fully Muted & Disabled', 'info', 2500);
      haptic.warning();
    } else {
      // Transition from MUTED/OFF -> ACTIVE:
      // Open hub, unmute dialogue mic, make sure wake-word is active for background too
      window.dispatchEvent(new CustomEvent('aether-logo-toggle', { detail: { open: true, mute: false } }));
      if (setIsWakeWordEnabled) setIsWakeWordEnabled(true);
      localStorage.setItem('isAetherMuted', 'false');
      window.dispatchEvent(new Event('aether-mute-sync'));
      
      showToast('🔮 Aether AI Activated (Listening Mode)', 'success', 2500);
      haptic.success();
    }
  };

  const handleLogoClick = () => {
    handleVoiceStateCycle();
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
    <header className="h-11 border-b border-zinc-900 flex items-center justify-between px-3 sm:px-4 bg-[#050505] shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={() => { haptic.light(); toggleSidebar(); }} className="p-1.5 text-zinc-500 hover:text-zinc-355 hover:bg-zinc-900 rounded transition-colors">
          <Menu size={16} />
        </button>
        <button
          id="aether-logo-button"
          onClick={handleLogoClick}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          title={isAetherOpen ? (isAetherMuted ? "Unmute Aether" : "Mute Aether") : "Activate Aether AI"}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center transition-all duration-300 shrink-0 ${
            isAetherOpen && !isAetherMuted
              ? "bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.7)] border border-emerald-400"
              : isAetherOpen && isAetherMuted
                ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                : "bg-yellow-500 hover:scale-105 shadow-[0_0_12px_rgba(234,179,8,0.35)]"
          }`}>
            <span className="text-black font-extrabold text-[11px] font-mono">D</span>
          </div>
          <span className="text-zinc-150 font-display font-light tracking-[0.16em] text-xs sm:text-sm truncate max-w-[120px] min-[380px]:max-w-none group-hover:text-yellow-400 transition-all">
            DEVSPACE
          </span>
        </button>
        <div className="h-4 w-[1px] bg-zinc-800 shrink-0 mx-1"></div>
        {/* Sleek Tactile Aether Voice Controller Button */}
        <button
          onClick={handleVoiceStateCycle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9.5px] font-mono font-black transition-all duration-300 cursor-pointer select-none active:scale-95 shrink-0 ${
            aetherState === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)] animate-pulse font-bold'
              : aetherState === 'standby'
                ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/35 hover:bg-yellow-500/20 shadow-[0_0_12px_rgba(234,179,8,0.15)]'
                : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:bg-zinc-900 hover:border-zinc-850'
          }`}
          title={
            aetherState === 'active'
              ? "Aether AI: ACTIVE DIALOG (Listening...) - Click to switch to STANDBY"
              : aetherState === 'standby'
                ? "Aether AI: STANDBY (Listening for 'Hey Aether') - Click to MUTED/OFF"
                : "Aether AI: MUTED / OFF (Voice disabled) - Click to ACTIVE DIALOG"
          }
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            {aetherState === 'active' && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              aetherState === 'active'
                ? 'bg-emerald-400'
                : aetherState === 'standby'
                  ? 'bg-yellow-400'
                  : 'bg-zinc-650'
            }`}></span>
          </span>

          {aetherState === 'active' ? (
            <Mic size={11} className="text-emerald-400 shrink-0" />
          ) : aetherState === 'standby' ? (
            <Sparkles size={11} className="text-yellow-400 shrink-0" />
          ) : (
            <MicOff size={11} className="text-zinc-500 shrink-0" />
          )}

          <span className="hidden min-[480px]:inline">
            {aetherState === 'active'
              ? 'ACTIVE'
              : aetherState === 'standby'
                ? 'STANDBY'
                : 'MUTED / OFF'}
          </span>
        </button>
        <div className="h-4 w-[1px] bg-zinc-800 ml-1 hidden sm:block"></div>
        <div className="relative hidden sm:block">
          <button 
            onClick={() => { haptic.light(); setShowSyncDetails(!showSyncDetails); }}
            className="flex items-center gap-2 ml-2 px-2.5 py-1 bg-black rounded border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950 transition-colors cursor-pointer select-none"
            title="View Firestore Sync Status"
          >
            {!isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]"></span>
                <span className="text-[9.5px] font-mono text-amber-500 font-bold tracking-wider">OFFLINE MODE</span>
              </>
            ) : syncStatus === 'saving' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,1)]"></span>
                <span className="text-[9.5px] font-mono text-yellow-500 font-bold tracking-wider">SYNCING...</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
                <span className="text-[9.5px] font-mono text-red-500 font-bold tracking-wider">SYNC ERROR</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse"></span>
                <span className="text-[9.5px] font-mono text-emerald-400 font-bold tracking-wider">SYNCED</span>
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-2 top-0 z-50"
              >
                <SyncPopover onClose={() => setShowSyncDetails(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex-grow max-w-md mx-2 sm:mx-8 relative hidden sm:block" onClick={() => { haptic.light(); toggleCommandPalette(); }}>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <span className="text-zinc-650 text-xs mr-2"><Search size={14} className="text-zinc-500" /></span>
        </div>
        <input 
          type="text" 
          placeholder="Search projects, tasks, or memory..." 
          className="w-full bg-[#101012] border border-zinc-850 hover:border-zinc-800 rounded-md py-1.5 pl-8 pr-4 text-xs focus:outline-none focus:border-yellow-500/80 cursor-pointer pointer-events-none text-zinc-400 transition-colors"
        />
        <div className="absolute inset-y-0 right-3 flex items-center hidden sm:flex">
            <span className="text-[10px] text-zinc-500 border border-zinc-850 px-1 rounded font-mono">K</span>
        </div>
      </div>
      <div className="flex items-center gap-2.5 sm:gap-4.5">
        <div className="flex items-center gap-2.5 sm:gap-4">
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
            onClick={() => { haptic.light(); toggleCommandPalette(); }} 
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
    </header>
  );
}
