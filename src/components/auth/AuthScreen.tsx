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
import { Mail, Lock, User, KeyRound, Eye, EyeOff, Loader2, ArrowLeft, Github, Copy, ExternalLink, Check, ShieldAlert } from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';

type AuthMode = 'login' | 'register' | 'forgot' | 'resetPassword';

export function AuthScreen() {
  const { setGoogleUser, setGoogleToken, setGithubUser, setGithubProfile, setGithubToken } = useData();
  const [mode, setMode] = useState<AuthMode>('login');
  const [oobCode, setOobCode] = useState<string | null>(null);

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
  const [authErrorType, setAuthErrorType] = useState<'unauthorized-domain' | 'operation-not-allowed' | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Account Linking/Consolidation States
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [pendingProviderName, setPendingProviderName] = useState('');
  const [consolidationPassword, setConsolidationPassword] = useState('');
  const [consolidationMode, setConsolidationMode] = useState<'options' | 'password'>('options');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setAuthErrorType(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthErrorType(null);
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
        setError('Security code is missing or invalid. Please request a new link.');
        return;
      }

      setLoading(true);
      try {
        await confirmReset(oobCode, password);
        setSuccessMsg('Your password has been successfully reset! You can now log in using your new credentials.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } catch (err: any) {
        if (err.code === 'auth/expired-action-code') {
          setError(
            'The password reset link has expired. (Note: Email scanners like Microsoft SafeLinks or corporate firewalls often pre-fetch links, which can instantly expire single-use reset tokens. Please request a new link and follow the Optional In-App Reset guide below to bypass scanners).'
          );
        } else if (err.code === 'auth/invalid-action-code') {
          setError(
            'This password reset link is invalid or has already been used. (Note: Email scanners like Microsoft SafeLinks or corporate firewalls often pre-fetch and consume single-use reset links before you can click them. Please request a new link and follow the Optional In-App Reset guide below to bypass scanners).'
          );
        } else {
          setError(err.message || 'Failed to update password. Please request a new password reset link.');
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
        setGoogleUser(user);
        // Successful signup automatically logs the user in via onAuthStateChanged
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          setError('This email address is already in use.');
        } else if (err.code === 'auth/invalid-email') {
          setError('The email address format is invalid.');
        } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
          setAuthErrorType('unauthorized-domain');
          setError(
            'Firebase Auth Error: This domain is not authorized. Please go to your Firebase Console -> Authentication -> Settings -> Authorized Domains and add this website\'s domain to authorize it.'
          );
        } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
          setAuthErrorType('operation-not-allowed');
          setError(
            'Firebase Auth: Email/Password sign-in is not enabled in your Firebase Console. Please enable it under Authentication -> Sign-in method.'
          );
        } else {
          setError(err.message || 'An error occurred during registration.');
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
        setGoogleUser(user);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('Invalid email or password combination.');
        } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
          setAuthErrorType('unauthorized-domain');
          setError(
            'Firebase Auth Error: This domain is not authorized. Please go to your Firebase Console -> Authentication -> Settings -> Authorized Domains and add this website\'s domain to authorize it.'
          );
        } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
          setAuthErrorType('operation-not-allowed');
          setError(
            'Firebase Auth: Email/Password sign-in is not enabled in your Firebase Console. Please enable it under Authentication -> Sign-in method.'
          );
        } else {
          setError(err.message || 'Failed to sign in. Please try again.');
        }
      } finally {
        setLoading(false);
      }

    } else if (mode === 'forgot') {
      setLoading(true);
      try {
        await sendPasswordReset(cleanEmail);
        setSuccessMsg('A password reset link has been sent to your email.');
        setEmail('');
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          setError('No user profile found with this email address.');
        } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
          setAuthErrorType('unauthorized-domain');
          setError(
            'Firebase Auth Error: This domain is not authorized. Please go to your Firebase Console -> Authentication -> Settings -> Authorized Domains and add this website\'s domain to authorize it.'
          );
        } else {
          setError(err.message || 'Failed to send password reset email.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOAuthGoogle = async () => {
    setError(null);
    setAuthErrorType(null);
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setPendingEmail(err.email || '');
        setPendingCredential(err.credential);
        setPendingProviderName('Google');
        setConsolidationMode('options');
        setError(null);
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setAuthErrorType('unauthorized-domain');
        setError(
          'Firebase Auth Error: This domain is not authorized. Please add this app\'s development and shared domains to your "Authorized Domains" list under Authentication -> Settings -> Authorized Domains in your Firebase console.'
        );
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setAuthErrorType('operation-not-allowed');
        setError(
          'Firebase Auth Error: Google Sign-in provider is not enabled. Please enable Google in your Firebase Console under Authentication -> Sign-in method.'
        );
      } else {
        setError(err.message || 'Google sign-in was unsuccessful.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthGithub = async () => {
    setError(null);
    setAuthErrorType(null);
    setLoading(true);
    try {
      const result = await githubSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGithubUser(result.username);
        setGithubToken(result.accessToken);
        setGithubProfile({ name: result.username, login: result.username });
      }
    } catch (err: any) {
      if (err.code === 'auth/account-exists-with-different-credential') {
        setPendingEmail(err.email || '');
        setPendingCredential(err.credential);
        setPendingProviderName('GitHub');
        setConsolidationMode('options');
        setError(null);
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setAuthErrorType('unauthorized-domain');
        setError(
          'Firebase Auth Error: This domain is not authorized. Please add this app\'s development and shared domains to your "Authorized Domains" list under Authentication -> Settings -> Authorized Domains in your Firebase console.'
        );
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setAuthErrorType('operation-not-allowed');
        setError(
          'Firebase Auth Error: GitHub Sign-in provider is not enabled. Please enable GitHub in your Firebase Console under Authentication -> Sign-in method.'
        );
      } else {
        setError(err.message || 'GitHub sign-in was unsuccessful.');
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
        setGoogleUser(linkedUser);
        setGoogleToken(result.accessToken);
        setSuccessMsg(`✓ Successfully consolidated your Google and ${pendingProviderName} accounts! You can now log in using either method.`);
        setPendingCredential(null);
        setPendingEmail('');
        setPendingProviderName('');
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setError('Firebase Auth Error: This domain is not authorized.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
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
        setGoogleUser(linkedUser);
        setGithubUser(result.username);
        setGithubToken(result.accessToken);
        setGithubProfile({ name: result.username, login: result.username });
        setSuccessMsg(`✓ Successfully consolidated your GitHub and ${pendingProviderName} accounts! You can now log in using either method.`);
        setPendingCredential(null);
        setPendingEmail('');
        setPendingProviderName('');
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setError('Firebase Auth Error: This domain is not authorized.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidationEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consolidationPassword) {
      setError('Please enter your password to authorize linking.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithEmailPassword(pendingEmail, consolidationPassword);
      if (user && pendingCredential) {
        const linkedUser = await linkWithPendingCredential(user, pendingCredential);
        setGoogleUser(linkedUser);
        setSuccessMsg(`✓ Successfully consolidated your email/password and ${pendingProviderName} accounts! You can now log in using either method.`);
        setPendingCredential(null);
        setPendingEmail('');
        setPendingProviderName('');
        setConsolidationPassword('');
        setConsolidationMode('options');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect password or linking failed.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#030305] relative overflow-hidden select-none">
      {/* Visual background enhancements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.06),transparent_45%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.04),transparent_50%)] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md my-auto bg-[#09090b]/95 border border-zinc-800 rounded-2xl p-5 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-md relative z-10 max-h-[94vh] overflow-y-auto font-sans"
      >
        {/* Header App Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center mb-2.5 shadow-[0_0_24px_rgba(234,179,8,0.4)]">
            <span className="text-black font-extrabold text-xl font-mono">D</span>
          </div>
          <h1 className="text-zinc-100 text-lg font-bold tracking-tight">DEVSPACE</h1>
          <p className="text-zinc-500 text-xs mt-0.5 text-center font-mono">
            {pendingCredential ? 'CONSOLIDATING DUPLICATE IDENTITY SYNAPSES' : (
              <>
                {mode === 'login' && 'Developer Workspace Authentication'}
                {mode === 'register' && 'Create Your Developer Account'}
                {mode === 'forgot' && 'Reset Workspace Password'}
                {mode === 'resetPassword' && 'Update Your Account Password'}
              </>
            )}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs (Log In vs Sign Up) */}
        {!pendingCredential && (mode === 'login' || mode === 'register') && (
          <div className="flex bg-[#121215] p-1 rounded-xl border border-zinc-850 mb-6">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-yellow-500 text-black shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              Log In
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
                <p className="font-semibold uppercase tracking-wider font-mono mb-1 text-[11px]">Identity Conflict Detected</p>
                <p className="text-zinc-300 font-sans">An existing user account was found associated with the email <strong className="text-white font-mono select-all break-all">{pendingEmail}</strong>.</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-zinc-100 font-sans">Consolidate & Sync Credentials</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                To link your <span className="text-yellow-400 font-semibold">{pendingProviderName === 'Google' ? 'GitHub' : 'Google'}</span> profile with <span className="text-yellow-400 font-semibold">{pendingProviderName}</span> and share all projects, logs, and settings under a single secure workspace, verify your identity by authenticating with your original provider:
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
                  Verify using Google Account
                </button>

                <button
                  type="button"
                  onClick={handleConsolidationGithub}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs transition-colors cursor-pointer font-sans"
                >
                  <Github size={15} className="mr-1" />
                  Verify using GitHub Account
                </button>

                <button
                  type="button"
                  onClick={() => setConsolidationMode('password')}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs transition-colors cursor-pointer font-sans"
                >
                  <KeyRound size={15} className="mr-1 text-yellow-500/85" />
                  Verify using Email & Password
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

            <div className="pt-4 border-t border-zinc-850/60 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setPendingCredential(null);
                  setPendingEmail('');
                  setPendingProviderName('');
                  setError(null);
                }}
                disabled={loading}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer font-mono"
              >
                ✕ Cancel & Back to Log In
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
                      placeholder="e.g. cyber_architect"
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
                          className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
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
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && 'Log In with Email'}
                      {mode === 'register' && 'Create Developer Account'}
                      {mode === 'forgot' && 'Send Password Reset Link'}
                      {mode === 'resetPassword' && 'Update Password'}
                    </span>
                  </>
                )}
              </button>
            </form>

            {mode === 'forgot' && (
              <div className="mt-4 p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs leading-relaxed space-y-3 font-sans shadow-md">
                <div className="flex items-start gap-2 text-zinc-300">
                  <span className="text-sm">✨</span>
                  <div>
                    <h4 className="font-semibold text-zinc-200 font-sans text-[11px] uppercase tracking-wider mb-0.5">
                      Zero-Setup Reset Link
                    </h4>
                    <p className="text-zinc-400 text-[11px]">
                      Enter your email address above to receive an official password reset link directly in your inbox.
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-800/80 pt-2.5">
                  <details className="group cursor-pointer">
                    <summary className="font-semibold text-zinc-400 hover:text-zinc-300 flex items-center gap-1.5 font-sans text-[10.5px] uppercase tracking-wider select-none outline-none">
                      <span className="transition-transform group-open:rotate-90 text-[8px] font-mono">▶</span>
                      Optional: In-App Reset Settings
                    </summary>
                    <div className="mt-2 space-y-2 text-[11px] text-zinc-400 pl-3 border-l border-zinc-800">
                      <p>
                        Email scanners (like Microsoft SafeLinks) can sometimes pre-fetch links, consuming single-use reset codes prematurely.
                      </p>
                      <p className="font-semibold text-zinc-300">
                        To direct the reset process back into this application:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-zinc-400 font-sans text-[10.5px]">
                        <li>Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">Firebase Console</a></li>
                        <li>Navigate to <strong>Authentication</strong> &rarr; <strong>Templates</strong></li>
                        <li>Select <strong>Password reset</strong> &rarr; <strong>Customize action URL</strong></li>
                        <li>
                          Set Action URL to:
                          <div className="inline-flex flex-wrap items-center gap-1.5 mt-1 bg-[#101012] border border-zinc-800 rounded px-2 py-0.5 max-w-full">
                            <span className="text-yellow-500 select-all font-mono text-[10px] break-all">
                              {typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(typeof window !== 'undefined' ? `${window.location.origin}/` : '', 'action-url')}
                              className="text-[10px] text-zinc-400 hover:text-zinc-200 focus:outline-none flex items-center gap-1 border-l border-zinc-800 pl-1.5 cursor-pointer ml-1"
                              title="Copy URL"
                            >
                              {copiedText === 'action-url' ? (
                                <Check size={11} className="text-green-500 animate-pulse" />
                              ) : (
                                <Copy size={11} />
                              )}
                              <span className="text-[9px] font-sans font-medium">
                                {copiedText === 'action-url' ? 'Copied' : 'Copy'}
                              </span>
                            </button>
                          </div>
                        </li>
                      </ol>
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Back to Sign In button if in forgot/reset password mode */}
            {(mode === 'forgot' || mode === 'resetPassword') && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => handleModeChange('login')}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors focus:outline-none py-1"
                >
                  <ArrowLeft size={13} /> Back to Log In
                </button>
              </div>
            )}

            {/* Divider & Social Single Sign-On Options */}
            {mode !== 'forgot' && mode !== 'resetPassword' && (
              <div className="mt-6 pt-5 border-t border-zinc-850/60">
                <div className="relative flex justify-center text-xs mb-4">
                  <span className="bg-[#09090b] px-3 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">OR CONTINUE WITH SOCIAL ACCOUNT</span>
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

                {/* Collapsible Firebase Connection / Authorization Setup Guide */}
                <div className="mt-6 pt-4 border-t border-zinc-850/60">
                  <button
                    type="button"
                    onClick={() => setShowSetupGuide(!showSetupGuide)}
                    className="w-full flex items-center justify-between py-2 px-3 bg-[#121215] hover:bg-[#18181c] rounded-xl border border-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 font-mono transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      {authErrorType ? (
                        <ShieldAlert size={14} className="text-red-400 animate-pulse shrink-0" />
                      ) : (
                        <span className="text-zinc-400 text-xs">🛠️</span>
                      )}
                      <span className={authErrorType ? "text-red-400 font-semibold" : ""}>
                        {authErrorType ? "Domain / Provider Authorization Guide" : "Firebase Auth Connection Details"}
                      </span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {showSetupGuide || authErrorType ? 'Hide ▲' : 'Show Details ▼'}
                    </span>
                  </button>

                  {(showSetupGuide || authErrorType) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-3 p-3 bg-[#0c0c0e] rounded-xl border border-zinc-850"
                    >
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        {authErrorType === 'unauthorized-domain' 
                          ? 'To authorize this environment to sign in with GitHub or Google, please register your active domain as an Authorized Domain in your Firebase Console.' 
                          : 'To enable OAuth sign-ins, configure the OAuth providers in your Firebase console and map their callback URIs appropriately.'}
                      </p>

                      <div className="space-y-2.5">
                        {/* Section 1: Authorized Domains */}
                        <div className="bg-[#121215] rounded-lg p-2.5 border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-300 font-mono">1. AUTHORIZE ACTIVE DOMAINS</span>
                            <a 
                              href={`https://console.firebase.google.com/project/${firebaseConfig.projectId || 'project-id'}/authentication/settings`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-yellow-500 hover:underline flex items-center gap-1 font-mono"
                            >
                              Console <ExternalLink size={10} />
                            </a>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-sans">
                            Add these domains under: <br />
                            <strong>Authentication &rarr; Settings &rarr; Authorized domains &rarr; Add domain</strong>
                          </p>
                          
                          <div className="space-y-1.5 pt-0.5">
                            {/* Active Host */}
                            <div className="flex items-center justify-between bg-[#0a0a0c] py-1 px-2 rounded border border-zinc-850 text-[10px] font-mono">
                              <span className="text-zinc-400 truncate pr-2 text-[9px]">
                                {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(
                                  typeof window !== 'undefined' ? window.location.hostname : 'localhost',
                                  'domain-active'
                                )}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 font-medium cursor-pointer"
                              >
                                {copiedText === 'domain-active' ? (
                                  <span className="text-emerald-400 text-[9px] font-bold flex items-center gap-0.5"><Check size={10} /> Copied</span>
                                ) : (
                                  <span className="flex items-center gap-1">Copy <Copy size={9} /></span>
                                )}
                              </button>
                            </div>

                            {/* Shared Host */}
                            <div className="flex items-center justify-between bg-[#0a0a0c] py-1 px-2 rounded border border-zinc-850 text-[10px] font-mono">
                              <span className="text-zinc-400 truncate pr-2 text-[9px]">
                                ais-pre-3kik42vq3fw4lyryeckdeg-164818161298.us-west2.run.app
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(
                                  'ais-pre-3kik42vq3fw4lyryeckdeg-164818161298.us-west2.run.app',
                                  'domain-shared'
                                )}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 font-medium cursor-pointer"
                              >
                                {copiedText === 'domain-shared' ? (
                                  <span className="text-emerald-400 text-[9px] font-bold flex items-center gap-0.5"><Check size={10} /> Copied</span>
                                ) : (
                                  <span className="flex items-center gap-1">Copy <Copy size={9} /></span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: GitHub Sign-in provider */}
                        <div className="bg-[#121215] rounded-lg p-2.5 border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-300 font-mono">2. GITHUB OAUTH REDIRECT URI</span>
                            <a 
                              href="https://github.com/settings/developers" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-yellow-500 hover:underline flex items-center gap-1 font-mono"
                            >
                              GitHub Developer <ExternalLink size={10} />
                            </a>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-sans">
                            Paste as <strong>Authorization callback URL</strong> in GitHub Settings:
                          </p>

                          <div className="flex items-center justify-between bg-[#0a0a0c] py-1 px-2 rounded border border-zinc-850 text-[10px] font-mono">
                            <span className="text-zinc-400 truncate pr-2 text-[9px]">
                              {`https://${firebaseConfig.projectId || 'project-id'}.firebaseapp.com/__/auth/handler`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(
                                `https://${firebaseConfig.projectId || 'project-id'}.firebaseapp.com/__/auth/handler`,
                                'redirect-uri'
                              )}
                              className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 font-medium cursor-pointer"
                            >
                              {copiedText === 'redirect-uri' ? (
                                <span className="text-emerald-400 text-[9px] font-bold flex items-center gap-0.5"><Check size={10} /> Copied</span>
                              ) : (
                                <span className="flex items-center gap-1">Copy <Copy size={9} /></span>
                              )}
                            </button>
                          </div>
                          <div className="text-[9px] text-zinc-500 flex flex-col gap-1 font-sans mt-1">
                            <span>📌 <strong>Firebase Settings</strong>: Authentication &rarr; Sign-in method &rarr; Add <strong>GitHub</strong> / <strong>Google</strong>.</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
