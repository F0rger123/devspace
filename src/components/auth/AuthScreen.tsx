import React, { useState, useEffect } from 'react';
import { 
  signUpWithEmailPassword, 
  loginWithEmailPassword, 
  sendPasswordReset, 
  confirmReset,
  googleSignIn, 
  githubSignIn,
  linkWithPendingCredential
} from '../../lib/auth';
import { useData } from '../../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, KeyRound, Eye, EyeOff, Loader2, ArrowLeft, Github, ShieldAlert, Fingerprint } from 'lucide-react';
import { isBiometricsSupported, getBiometricSettings, verifyBiometricAuth } from '../../lib/biometricAuth';
import { haptic } from '../../utils/haptics';

type AuthMode = 'login' | 'register' | 'forgot' | 'resetPassword';

export function AuthScreen() {
  const { setGoogleUser, setGoogleToken, setGithubUser, setGithubProfile, setGithubToken } = useData();
  const [mode, setMode] = useState<AuthMode>('login');
  const [oobCode, setOobCode] = useState<string | null>(null);

  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      const code = params.get('oobCode');
      
      const cleanM = m ? m.replace(/\s+/g, '') : '';
      const cleanCode = code ? code.replace(/\s+/g, '') : '';
      
      if (cleanM === 'resetPassword' && cleanCode) {
        setMode('resetPassword');
        setOobCode(cleanCode);
      }

      // Check for saved session & biometric capabilities
      try {
        const storedUserRaw = localStorage.getItem('app_google_user');
        if (storedUserRaw) {
          const u = JSON.parse(storedUserRaw);
          const uid = u?.uid || 'guest';
          setLastUserId(uid);
          const settings = getBiometricSettings(uid);
          if (settings.enabled) {
            isBiometricsSupported().then(supported => {
              if (supported) setBiometricsAvailable(true);
            });
          }
        }
      } catch (e) {
        console.error('[Auth] Failed reading stored biometric user session:', e);
      }
    }
  }, []);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // Interaction/UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Account Linking / Consolidation States
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [pendingProviderName, setPendingProviderName] = useState('');
  const [consolidationPassword, setConsolidationPassword] = useState('');
  const [consolidationMode, setConsolidationMode] = useState<'options' | 'password'>('options');

  const handleBiometricUnlock = async () => {
    if (!lastUserId) return;
    setLoading(true);
    setError(null);
    haptic.light();
    try {
      const res = await verifyBiometricAuth(lastUserId);
      if (res.success) {
        const stored = localStorage.getItem('app_google_user');
        if (stored) {
          const userObj = JSON.parse(stored);
          setGoogleUser(userObj);
          haptic.success();
          setSuccessMsg('Authenticated via Biometric Passkey');
        } else {
          setError('Session expired. Please sign in with your email or password.');
        }
      } else {
        setError(res.message || 'Biometric authentication was cancelled or failed.');
      }
    } catch (err: any) {
      console.error('[Auth] Biometric verification error:', err);
      setError('Biometric authentication failed. Please use your password.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    haptic.light();
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    
    const cleanEmail = email.trim();
    if (mode !== 'resetPassword' && !cleanEmail) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'resetPassword') {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!oobCode) {
        setError('Security reset code is missing or expired. Please request a new password reset link.');
        return;
      }

      setLoading(true);
      try {
        await confirmReset(oobCode, password);
        haptic.success();
        setSuccessMsg('Your password has been successfully updated! You can now log in.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        console.error('[Auth] Password reset confirmation error:', err);
        if (err.code === 'auth/expired-action-code' || err.code === 'auth/invalid-action-code') {
          setError('The password reset link is invalid or has expired. Please request a new link.');
        } else {
          setError('Failed to update password. Please try requesting a new reset link.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register') {
      const cleanUsername = username.trim();
      if (!cleanUsername) {
        setError('Please enter a username.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const user = await signUpWithEmailPassword(cleanEmail, password, cleanUsername);
        haptic.success();
        setGoogleUser(user);
      } catch (err: any) {
        console.error('[Auth] Sign up error:', err);
        if (err.code === 'auth/email-already-in-use') {
          setError('An account with this email address already exists.');
        } else if (err.code === 'auth/invalid-email') {
          setError('The email address format is invalid.');
        } else if (err.code === 'auth/weak-password') {
          setError('Password is too weak. Please use at least 6 characters.');
        } else {
          setError('Unable to create account at this time. Please try again.');
        }
      } finally {
        setLoading(false);
      }

    } else if (mode === 'login') {
      if (!password) {
        setError('Please enter your password.');
        return;
      }

      setLoading(true);
      try {
        const user = await loginWithEmailPassword(cleanEmail, password);
        haptic.success();
        setGoogleUser(user);
      } catch (err: any) {
        console.error('[Auth] Login error:', err);
        if (
          err.code === 'auth/user-not-found' || 
          err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential'
        ) {
          setError('Invalid email or password combination.');
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many unsuccessful attempts. Please try again in a few moments.');
        } else {
          setError('Unable to sign in. Please verify your credentials and try again.');
        }
      } finally {
        setLoading(false);
      }

    } else if (mode === 'forgot') {
      setLoading(true);
      try {
        await sendPasswordReset(cleanEmail);
        haptic.success();
        setSuccessMsg('A password reset link has been sent to your email address.');
        setEmail('');
      } catch (err: any) {
        console.error('[Auth] Password reset request error:', err);
        if (err.code === 'auth/user-not-found') {
          setError('No account found with this email address.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else {
          setError('Unable to send password reset email. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOAuthGoogle = async () => {
    setError(null);
    setLoading(true);
    haptic.light();
    try {
      const result = await googleSignIn();
      if (result) {
        haptic.success();
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('[Auth] Google sign in error:', err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        setPendingEmail(err.email || '');
        setPendingCredential(err.credential);
        setPendingProviderName('Google');
        setConsolidationMode('options');
        setError(null);
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User intentionally closed popup, no error needed
      } else {
        setError('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthGithub = async () => {
    setError(null);
    setLoading(true);
    haptic.light();
    try {
      const result = await githubSignIn();
      if (result) {
        haptic.success();
        setGoogleUser(result.user);
        setGithubUser(result.username);
        setGithubToken(result.accessToken);
        setGithubProfile({ name: result.username, login: result.username });
      }
    } catch (err: any) {
      console.error('[Auth] GitHub sign in error:', err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        setPendingEmail(err.email || '');
        setPendingCredential(err.credential);
        setPendingProviderName('GitHub');
        setConsolidationMode('options');
        setError(null);
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User intentionally closed popup
      } else {
        setError('Unable to sign in with GitHub. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidationGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result && pendingCredential) {
        const linkedUser = await linkWithPendingCredential(result.user, pendingCredential);
        haptic.success();
        setGoogleUser(linkedUser);
        setGoogleToken(result.accessToken);
        setSuccessMsg(`Successfully connected your Google and ${pendingProviderName} accounts!`);
        setPendingCredential(null);
        setPendingEmail('');
        setPendingProviderName('');
      }
    } catch (err: any) {
      console.error('[Auth] Consolidation error (Google):', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidationGithub = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await githubSignIn();
      if (result && pendingCredential) {
        const linkedUser = await linkWithPendingCredential(result.user, pendingCredential);
        haptic.success();
        setGoogleUser(linkedUser);
        setGithubUser(result.username);
        setGithubToken(result.accessToken);
        setGithubProfile({ name: result.username, login: result.username });
        setSuccessMsg(`Successfully connected your GitHub and ${pendingProviderName} accounts!`);
        setPendingCredential(null);
        setPendingEmail('');
        setPendingProviderName('');
      }
    } catch (err: any) {
      console.error('[Auth] Consolidation error (GitHub):', err);
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidationEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consolidationPassword) {
      setError('Please enter your password to link your account.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithEmailPassword(pendingEmail, consolidationPassword);
      if (user && pendingCredential) {
        const linkedUser = await linkWithPendingCredential(user, pendingCredential);
        haptic.success();
        setGoogleUser(linkedUser);
        setSuccessMsg(`Successfully verified and linked your ${pendingProviderName} account!`);
        setPendingCredential(null);
        setPendingEmail('');
        setPendingProviderName('');
        setConsolidationPassword('');
        setConsolidationMode('options');
      }
    } catch (err: any) {
      console.error('[Auth] Consolidation error (Password):', err);
      setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#030305] relative overflow-hidden select-none">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.06),transparent_45%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.04),transparent_50%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md my-auto bg-[#09090b]/95 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md relative z-10 max-h-[94vh] overflow-y-auto font-sans"
      >
        {/* Header App Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(234,179,8,0.4)]">
            <span className="text-black font-extrabold text-2xl font-mono">D</span>
          </div>
          <h1 className="text-zinc-100 text-xl font-bold tracking-tight">DevSpace</h1>
          <p className="text-zinc-400 text-xs mt-1 text-center">
            {pendingCredential ? 'Consolidate Accounts' : (
              <>
                {mode === 'login' && 'Sign in to your workspace'}
                {mode === 'register' && 'Create your developer account'}
                {mode === 'forgot' && 'Reset your password'}
                {mode === 'resetPassword' && 'Set a new password'}
              </>
            )}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs (Log In vs Sign Up) */}
        {!pendingCredential && (mode === 'login' || mode === 'register') && (
          <div className="flex bg-[#121215] p-1 rounded-xl border border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-yellow-500 text-black shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-yellow-500 text-black shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Biometric Quick Unlock Option */}
        {mode === 'login' && biometricsAvailable && (
          <div className="mb-5 p-3.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                <Fingerprint size={16} /> Biometric Passkey
              </span>
              <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded font-bold">
                INSTANT
              </span>
            </div>
            <p className="text-[11px] text-zinc-300">
              Unlock using Touch ID, Windows Hello, or Android Biometrics.
            </p>
            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={loading}
              className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
            >
              <Fingerprint size={16} />
              <span>{loading ? 'Verifying...' : 'Unlock with Biometrics'}</span>
            </button>
          </div>
        )}

        {/* Action Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-xs leading-relaxed"
            >
              <div>{error}</div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-400 text-xs leading-relaxed"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {pendingCredential ? (
          <div className="space-y-6 animate-fade-in">
            <div className="p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs flex gap-2.5">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1 text-[11px]">Account Found</p>
                <p className="text-zinc-300 font-sans">An existing account was found for <strong className="text-white">{pendingEmail}</strong>.</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-100 font-sans">Link Your Accounts</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Verify your identity to connect your <span className="text-yellow-400 font-semibold">{pendingProviderName === 'Google' ? 'GitHub' : 'Google'}</span> profile with <span className="text-yellow-400 font-semibold">{pendingProviderName}</span> and share your workspace projects:
              </p>
            </div>

            {consolidationMode === 'options' ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleConsolidationGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs transition-colors cursor-pointer font-sans"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6-4.52z" fill="#EA4335" />
                  </svg>
                  Verify using Google
                </button>

                <button
                  type="button"
                  onClick={handleConsolidationGithub}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs transition-colors cursor-pointer font-sans"
                >
                  <Github size={15} className="mr-1" />
                  Verify using GitHub
                </button>

                <button
                  type="button"
                  onClick={() => setConsolidationMode('password')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs transition-colors cursor-pointer font-sans"
                >
                  <KeyRound size={15} className="mr-1 text-yellow-500/85" />
                  Verify with Password
                </button>
              </div>
            ) : (
              <form onSubmit={handleConsolidationEmailPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                    <Lock size={13} className="text-yellow-500/80" /> Password for {pendingEmail}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={consolidationPassword}
                    onChange={(e) => setConsolidationPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConsolidationMode('options')}
                    disabled={loading}
                    className="w-1/2 py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 py-2.5 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold text-xs transition-colors cursor-pointer shadow-[0_4px_12px_rgba(234,179,8,0.15)]"
                  >
                    {loading ? 'Verifying...' : 'Verify & Link'}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-zinc-800 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setPendingCredential(null);
                  setPendingEmail('');
                  setPendingProviderName('');
                  setError(null);
                }}
                disabled={loading}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                ✕ Cancel & Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Main Authentication Forms */}
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="username"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-1.5"
                  >
                    <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                      <User size={13} className="text-yellow-500/80" /> Username
                    </label>
                    <input 
                      type="text" 
                      required
                      autoComplete="username"
                      placeholder="e.g. dev_creator"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {mode !== 'resetPassword' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                    <Mail size={13} className="text-yellow-500/80" /> Email Address
                  </label>
                  <input 
                    type="email" 
                    required
                    autoComplete="email"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                  />
                </div>
              )}

              <AnimatePresence mode="wait">
                {mode !== 'forgot' && (
                  <motion.div
                    key="passwords"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                          <Lock size={13} className="text-yellow-500/80" /> {mode === 'resetPassword' ? 'New Password' : 'Password'}
                        </label>
                        {mode === 'login' && (
                          <button 
                            type="button" 
                            onClick={() => handleModeChange('forgot')}
                            className="text-[11px] text-yellow-500/80 hover:text-yellow-400 hover:underline transition-colors focus:outline-none font-medium"
                          >
                            Forgot Password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          required
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded-lg py-2.5 pl-3 pr-10 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {(mode === 'register' || mode === 'resetPassword') && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                          <KeyRound size={13} className="text-yellow-500/80" /> Confirm Password
                        </label>
                        <input 
                          type="password" 
                          required
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded-lg py-2.5 px-3 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold rounded-lg py-3 px-4 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(234,179,8,0.2)] hover:shadow-[0_4px_20px_rgba(234,179,8,0.35)]"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Sign In with Email'}
                      {mode === 'register' && 'Create Developer Account'}
                      {mode === 'forgot' && 'Send Password Reset Link'}
                      {mode === 'resetPassword' && 'Update Password'}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Back to Sign In button if in forgot/reset password mode */}
            {(mode === 'forgot' || mode === 'resetPassword') && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => handleModeChange('login')}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors focus:outline-none py-1 cursor-pointer"
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </div>
            )}

            {/* Divider & Social Single Sign-On Options */}
            {mode !== 'forgot' && mode !== 'resetPassword' && (
              <div className="mt-6 pt-5 border-t border-zinc-800">
                <div className="relative flex justify-center text-xs mb-4">
                  <span className="bg-[#09090b] px-3 text-zinc-500 text-[10px] uppercase tracking-wider">OR CONTINUE WITH</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleOAuthGoogle}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 hover:text-white text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6-4.52z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={handleOAuthGithub}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 hover:text-white text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    <Github size={15} className="shrink-0 text-white" />
                    GitHub
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
