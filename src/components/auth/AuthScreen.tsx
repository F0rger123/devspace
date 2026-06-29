import React, { useState } from 'react';
import { 
  signUpWithEmailPassword, 
  loginWithEmailPassword, 
  sendPasswordReset, 
  googleSignIn, 
  githubSignIn 
} from '../../lib/auth';
import { useData } from '../../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, KeyRound, Eye, EyeOff, Loader2, ArrowLeft, Github } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthScreen() {
  const { setGoogleUser, setGoogleToken, setGithubUser, setGithubProfile, setGithubToken } = useData();
  const [mode, setMode] = useState<AuthMode>('login');
  
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

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter a valid email address.');
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
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in was unsuccessful.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthGithub = async () => {
    setError(null);
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
      setError(err.message || 'GitHub sign-in was unsuccessful.');
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
        className="w-full max-w-md bg-[#09090b]/90 border border-zinc-850 rounded-xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md relative z-10"
      >
        {/* Header App Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(234,179,8,0.45)]">
            <span className="text-black font-extrabold text-xl font-mono">D</span>
          </div>
          <h1 className="text-zinc-100 text-lg font-bold tracking-tight">DEVSPACE / CORE</h1>
          <p className="text-zinc-500 text-xs mt-1 text-center font-mono">
            {mode === 'login' && 'DEVELOPER WORKSPACE SYNC ENGINE'}
            {mode === 'register' && 'CREATE A SECURE CREDENTIAL SYNAPSE'}
            {mode === 'forgot' && 'INITIATE PASSWORD RESET LOOP'}
          </p>
        </div>

        {/* Action Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-950/40 border border-red-900/50 rounded text-red-400 text-xs leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/50 rounded text-emerald-400 text-xs leading-relaxed"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

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
                  placeholder="e.g. cyber_architect"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded py-2 px-3 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <Mail size={13} className="text-yellow-500/80" /> Email Address
            </label>
            <input 
              type="email" 
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded py-2 px-3 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
            />
          </div>

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
                      <Lock size={13} className="text-yellow-500/80" /> Password
                    </label>
                    {mode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => handleModeChange('forgot')}
                        className="text-[11px] text-yellow-500/70 hover:text-yellow-500 hover:underline transition-colors focus:outline-none"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded py-2 pl-3 pr-10 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-zinc-550 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                      <KeyRound size={13} className="text-yellow-500/80" /> Confirm Password
                    </label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#101012] border border-zinc-800 hover:border-zinc-700 rounded py-2 px-3 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
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
            className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold rounded py-2.5 px-4 text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(234,179,8,0.15)] hover:shadow-[0_4px_16px_rgba(234,179,8,0.3)]"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>PROCESSING SECURE TRANSMISSION...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'LOG IN TO DEVSPACE'}
                  {mode === 'register' && 'GENERATE ACCOUNT PROFILE'}
                  {mode === 'forgot' && 'SEND PASSWORD RESET DECODE'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Back and alternative modes toggle links */}
        <div className="mt-6 flex flex-col items-center justify-center gap-2">
          {mode === 'forgot' ? (
            <button
              onClick={() => handleModeChange('login')}
              className="text-xs text-zinc-400 hover:text-zinc-250 flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              <ArrowLeft size={13} /> Back to Sign In
            </button>
          ) : (
            <div className="text-xs text-zinc-500 text-center">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => handleModeChange('register')}
                    className="text-yellow-500 hover:underline hover:text-yellow-400 font-medium transition-colors focus:outline-none"
                  >
                    Create credential profile
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    onClick={() => handleModeChange('login')}
                    className="text-yellow-500 hover:underline hover:text-yellow-400 font-medium transition-colors focus:outline-none"
                  >
                    Log in with password
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Divider & OAuth Integrations */}
        {mode !== 'forgot' && (
          <div className="mt-8 pt-6 border-t border-zinc-850/60">
            <div className="relative flex justify-center text-xs mb-5">
              <span className="bg-[#09090b] px-3 text-zinc-500 font-mono text-[10px]">SECURE SINGLE SIGN-ON OPTIONS</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleOAuthGoogle}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
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
                className="flex items-center justify-center gap-2 py-2 px-4 rounded bg-[#101012] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs transition-colors cursor-pointer"
              >
                <Github size={14} className="mr-1" />
                GitHub
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
