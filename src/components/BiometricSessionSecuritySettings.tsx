import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Globe, 
  LogOut, 
  Clock, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  KeyRound,
  Shield,
  Layers
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { auth } from '../lib/auth';
import { 
  isBiometricsSupported, 
  getBiometricSettings, 
  saveBiometricSettings, 
  enableBiometricAuth, 
  getActiveSessions, 
  terminateAllOtherSessions,
  ActiveSession,
  BiometricSettings
} from '../lib/biometricAuth';

export function BiometricSessionSecuritySettings() {
  const { googleUser, showToast } = useData();
  const userId = auth.currentUser?.uid || googleUser?.uid || 'guest';

  const [supported, setSupported] = useState(false);
  const [biometricConfig, setBiometricConfig] = useState<BiometricSettings>({
    enabled: false,
    requireAfterInactivity: false,
    inactivityTimeoutMinutes: 15
  });

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [showDevAuth, setShowDevAuth] = useState<boolean>(() => {
    return localStorage.getItem('app_enable_dev_auth') === 'true';
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    isBiometricsSupported().then(setSupported);
    setBiometricConfig(getBiometricSettings(userId));
    setSessions(getActiveSessions(userId));
  }, [userId]);

  const handleToggleBiometrics = async () => {
    setIsProcessing(true);
    try {
      if (biometricConfig.enabled) {
        saveBiometricSettings(userId, { enabled: false });
        setBiometricConfig(prev => ({ ...prev, enabled: false }));
        showToast('🔒 Biometric authentication disabled.', 'info');
      } else {
        const res = await enableBiometricAuth(userId, auth.currentUser?.email || googleUser?.email || '');
        if (res.success) {
          setBiometricConfig(prev => ({ ...prev, enabled: true }));
          showToast(res.message, 'success');
        } else {
          showToast(res.message, 'error');
        }
      }
    } catch (err: any) {
      showToast(`Biometrics error: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleInactivity = (enabled: boolean) => {
    saveBiometricSettings(userId, { requireAfterInactivity: enabled });
    setBiometricConfig(prev => ({ ...prev, requireAfterInactivity: enabled }));
    showToast(enabled ? '⏱️ Inactivity biometric challenge enabled.' : 'Inactivity biometric challenge disabled.', 'info');
  };

  const handleChangeTimeout = (minutes: number) => {
    saveBiometricSettings(userId, { inactivityTimeoutMinutes: minutes });
    setBiometricConfig(prev => ({ ...prev, inactivityTimeoutMinutes: minutes }));
    showToast(`Inactivity timeout set to ${minutes} minutes.`, 'success');
  };

  const handleSignOutAllOtherDevices = () => {
    const res = terminateAllOtherSessions(userId);
    if (res.success) {
      setSessions(prev => prev.filter(s => s.isCurrent));
      showToast('🛡️ Successfully signed out all other devices and active sessions.', 'success');
    }
  };

  const handleToggleDevAuthUI = (enabled: boolean) => {
    setShowDevAuth(enabled);
    localStorage.setItem('app_enable_dev_auth', enabled ? 'true' : 'false');
    showToast(enabled ? '🛠️ Developer authentication setup UI enabled.' : 'Production Auth Mode: Firebase debug UI hidden.', 'info');
  };

  return (
    <div className="space-y-6 text-zinc-200 font-sans">
      {/* Biometric Authentication Header Card */}
      <div className="p-5 bg-[#09090b] border border-zinc-850 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <Fingerprint size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white font-mono tracking-wide">
                Biometric Authentication & Hardware Passkeys
              </h3>
              {supported ? (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-mono font-bold">
                  Supported
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded text-[9px] font-mono font-bold">
                  Software Passkey
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Unlock your existing authenticated session securely using Windows Hello, macOS Touch ID / Face ID, or Android Biometrics.
            </p>
          </div>
        </div>

        {/* Biometric Toggle Switch */}
        <button
          onClick={handleToggleBiometrics}
          disabled={isProcessing}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            biometricConfig.enabled 
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
              : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
          }`}
        >
          <Fingerprint size={15} />
          <span>{biometricConfig.enabled ? 'BIOMETRICS ENABLED' : 'ENABLE BIOMETRICS'}</span>
        </button>
      </div>

      {/* Inactivity & Auto-Lock Security Controls */}
      <div className="p-5 bg-[#0e0e14] border border-zinc-850 rounded-2xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="space-y-0.5 font-sans">
            <h4 className="text-xs font-extrabold text-white font-mono flex items-center gap-2">
              <Clock size={15} className="text-yellow-400" />
              <span>Require Biometrics After Inactivity</span>
            </h4>
            <p className="text-xs text-zinc-400">
              Prompt for biometric challenge when returning to DevSpace after a period of idle time.
            </p>
          </div>
          <input
            type="checkbox"
            checked={biometricConfig.requireAfterInactivity}
            onChange={(e) => handleToggleInactivity(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 text-yellow-500 focus:ring-yellow-500 accent-yellow-500 cursor-pointer"
          />
        </div>

        {biometricConfig.requireAfterInactivity && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-zinc-400 font-sans text-xs">Inactivity Lock Threshold:</span>
            <select
              value={biometricConfig.inactivityTimeoutMinutes}
              onChange={(e) => handleChangeTimeout(Number(e.target.value))}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-750 text-yellow-400 rounded-lg font-mono text-xs focus:outline-none focus:border-yellow-500/50 cursor-pointer"
            >
              <option value={5}>5 Minutes</option>
              <option value={15}>15 Minutes (Default)</option>
              <option value={30}>30 Minutes</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>
        )}
      </div>

      {/* Session Management Section */}
      <div className="p-5 bg-[#09090b] border border-zinc-850 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
          <div>
            <h4 className="text-xs font-extrabold text-white font-mono flex items-center gap-2">
              <ShieldCheck size={16} className="text-yellow-400" />
              <span>Active Authenticated Sessions</span>
            </h4>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Review all active login sessions associated with your account across Desktop, Mobile, and Web.
            </p>
          </div>

          <button
            onClick={handleSignOutAllOtherDevices}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out All Other Devices</span>
          </button>
        </div>

        {/* Session Cards List */}
        <div className="space-y-2.5 font-mono text-xs">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                sess.isCurrent
                  ? 'bg-yellow-500/5 border-yellow-500/30'
                  : 'bg-[#121215] border-zinc-850'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-yellow-400">
                  {sess.deviceType === 'desktop' ? (
                    <Monitor size={16} />
                  ) : sess.deviceType === 'mobile' ? (
                    <Smartphone size={16} />
                  ) : (
                    <Globe size={16} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-sans">
                    <span className="text-xs font-bold text-white">{sess.deviceName}</span>
                    {sess.isCurrent && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded text-[9px] font-mono font-bold">
                        THIS DEVICE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono mt-0.5">
                    <span>IP: {sess.ipAddress}</span>
                    <span>•</span>
                    <span>{sess.location}</span>
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px]">
                <span className={sess.isCurrent ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                  {sess.lastActive}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production & Debug UI Preferences */}
      <div className="p-4 bg-[#0d0d12] border border-zinc-850 rounded-xl flex items-center justify-between font-mono text-xs">
        <div className="space-y-0.5 font-sans">
          <span className="text-xs font-bold text-zinc-200 block">Firebase Developer Setup UI</span>
          <p className="text-[11px] text-zinc-400">
            Show Firebase connection guides, domain authorization details, and debug consoles on the login screen.
          </p>
        </div>
        <input
          type="checkbox"
          checked={showDevAuth}
          onChange={(e) => handleToggleDevAuthUI(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-700 text-yellow-500 focus:ring-yellow-500 accent-yellow-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
