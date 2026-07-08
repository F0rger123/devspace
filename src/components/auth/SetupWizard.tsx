import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Github, 
  Sparkles, 
  Chrome, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Code, 
  Lock, 
  Cpu, 
  Palette,
  Loader2
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { auth, linkProvider } from '../../lib/auth';

const ACCENT_COLORS = [
  { hex: '#eab308', name: 'Amber' },
  { hex: '#3b82f6', name: 'Saphire' },
  { hex: '#10b981', name: 'Emerald' },
  { hex: '#8b5cf6', name: 'Amethyst' },
  { hex: '#ec4899', name: 'Rose' },
  { hex: '#f97316', name: 'Vortex' }
];

export function SetupWizard() {
  const { userProfile, updateUserProfile, googleUser, showToast } = useData();
  
  const isNewSignup = typeof window !== 'undefined' && window.sessionStorage.getItem('is_new_signup') === 'true';
  
  // If the user already completed setup or is not a new sign up, do not show the wizard
  if (userProfile?.setupCompleted || !isNewSignup) {
    return null;
  }

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [username, setUsername] = useState(userProfile?.username || googleUser?.displayName?.split(' ')[0] || '');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || googleUser?.displayName || '');
  const [title, setTitle] = useState(userProfile?.title || 'Full-Stack Developer');
  const [bio, setBio] = useState(userProfile?.bio || 'DevSpace software designer.');
  const [avatarColor, setAvatarColor] = useState(userProfile?.avatarColor || '#eab308');
  
  // GitHub Setup
  const initialGithubLinked = auth.currentUser?.providerData.some(p => p.providerId === 'github.com') || false;
  const initialGithubUsername = auth.currentUser?.providerData.find(p => p.providerId === 'github.com')?.displayName || '';
  const [githubUser, setGithubUser] = useState(initialGithubUsername);
  const [isGithubConnecting, setIsGithubConnecting] = useState(false);
  const [isGithubConnected, setIsGithubConnected] = useState(initialGithubLinked);
  
  // Google Setup
  const initialGoogleLinked = auth.currentUser?.providerData.some(p => p.providerId === 'google.com') || false;
  const [isGoogleConnected, setIsGoogleConnected] = useState(initialGoogleLinked);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);

  const handleConnectGithub = async () => {
    setIsGithubConnecting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast('No authenticated user found.', 'error', 3000);
        return;
      }
      const linkedUser = await linkProvider(currentUser, 'github');
      setIsGithubConnected(true);
      
      const githubInfo = linkedUser.providerData.find(p => p.providerId === 'github.com');
      const ghUsername = githubInfo?.displayName || githubInfo?.email?.split('@')[0] || 'GitHubUser';
      setGithubUser(ghUsername);
      showToast(`✓ GitHub profile @${ghUsername} securely linked!`, 'success', 2500);
    } catch (err: any) {
      console.error('Failed to link GitHub:', err);
      if (err.code === 'auth/credential-already-in-use') {
        showToast('This GitHub account is already linked to another user profile.', 'error', 4000);
      } else {
        showToast('Failed to link GitHub: ' + (err.message || String(err)), 'error', 4000);
      }
    } finally {
      setIsGithubConnecting(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsGoogleConnecting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showToast('No authenticated user found.', 'error', 3000);
        return;
      }
      await linkProvider(currentUser, 'google');
      setIsGoogleConnected(true);
      showToast('✓ Google Workspace securely linked!', 'success', 2500);
    } catch (err: any) {
      console.error('Failed to link Google:', err);
      if (err.code === 'auth/credential-already-in-use') {
        showToast('This Google account is already linked to another user profile.', 'error', 4000);
      } else {
        showToast('Failed to link Google: ' + (err.message || String(err)), 'error', 4000);
      }
    } finally {
      setIsGoogleConnecting(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!username.trim() || !displayName.trim()) {
        showToast('Please enter your username and display name.', 'error', 2500);
        return;
      }
    }
    setStep((prev) => (prev + 1) as any);
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const handleComplete = async () => {
    try {
      await updateUserProfile({
        username: username.trim(),
        displayName: displayName.trim(),
        title: title.trim(),
        bio: bio.trim(),
        avatarColor,
        githubUrl: isGithubConnected ? `https://github.com/${githubUser.trim() || 'username'}` : undefined,
        setupCompleted: true // Save progress flag
      });
      // Clear sign-up flags
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('is_new_signup');
      }
      showToast('🚀 Synaptic profile fully initialized! Welcome to Aether OS.', 'success', 4000);
    } catch (err) {
      console.error('Failed to complete profile wizard setup:', err);
      showToast('Failed to initialize workspace settings. Please try again.', 'error', 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 select-none">
      {/* Background radial soft light accents */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-[#07070a] border border-zinc-900 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden"
      >
        {/* Banner with futuristic progress indicator */}
        <div className="h-2 bg-zinc-900 w-full relative">
          <motion.div 
            className="h-full bg-gradient-to-r from-yellow-500 via-emerald-500 to-purple-500 absolute left-0 top-0"
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                <Cpu size={18} className="animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-zinc-400 font-mono tracking-wider uppercase">SYNAPSE INITIALIZATION</h2>
                <h1 className="text-base font-bold text-zinc-100 font-sans tracking-tight">Setup Workspace Account</h1>
              </div>
            </div>
            <span className="text-xs text-zinc-500 font-mono bg-zinc-900/60 px-2.5 py-1 rounded-md border border-zinc-850">
              STEP {step} / 4
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: IDENTITY DETAILS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-200">Personalize Your Synapse Profile</h3>
                  <p className="text-xs text-zinc-500">Choose how your avatar, handle, and professional title display to workspace collaborators.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Username Handle</label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                      placeholder="e.g. drummerforger"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Drummer Forger"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Professional Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Full-Stack Developer"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Bio Quote</label>
                    <input 
                      type="text" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Active developer and cloud enthusiast."
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-200 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Avatar color picker */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Palette size={12} className="text-zinc-400" /> Choose Accent Synaptic Color
                  </label>
                  <div className="flex gap-3">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setAvatarColor(color.hex)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative cursor-pointer ${
                          avatarColor === color.hex 
                            ? 'scale-110 shadow-[0_0_12px_rgba(255,255,255,0.2)] ring-2 ring-white border-none' 
                            : 'hover:opacity-80 border border-zinc-800'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {avatarColor === color.hex && <Check size={14} className="text-black font-extrabold" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: GITHUB SYNAPSE */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <Github size={16} className="text-zinc-400" /> Link Your GitHub Synapse
                  </h3>
                  <p className="text-xs text-zinc-500">Log in with your GitHub developer account. This securely syncs issues, roadmap code syncs, and mergers directly.</p>
                </div>

                <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-850/60 flex flex-col items-center justify-center space-y-4 text-center">
                  {isGithubConnected ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                        <Check size={24} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block">GitHub Account Linked</span>
                        {githubUser && <span className="text-xs font-mono text-zinc-400">@{githubUser}</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                        <Github size={24} className="text-zinc-400 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-zinc-300">Authorize GitHub Integration</h4>
                        <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">Authorize DevSpace OS to access your branches, sync pull requests, and manage issue tickets.</p>
                      </div>
                      <button
                        onClick={handleConnectGithub}
                        disabled={isGithubConnecting}
                        className="w-full sm:w-auto px-6 py-2.5 bg-zinc-100 hover:bg-white text-black font-bold font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
                      >
                        {isGithubConnecting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Authenticating...
                          </>
                        ) : (
                          <>
                            <Github size={14} /> Log in & Link GitHub
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 leading-relaxed space-y-2 border-t border-zinc-900 pt-4 w-full text-left">
                    <p className="flex items-start gap-1.5">
                      <Check size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>Synchronize public & private repository branches with our LLM system in real-time.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <Check size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>Track push triggers and developer merges with high fidelity on your roadmap.</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 p-2.5 border border-dashed border-zinc-850 rounded-lg">
                  <span className="flex items-center gap-1.5 mx-auto">
                    <Lock size={12} /> Privacy Secure: Permissions are read-only except on user authorized push requests.
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 3: GOOGLE IDENTITY */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <Chrome size={16} className="text-zinc-400" /> Link Google Workspace API
                  </h3>
                  <p className="text-xs text-zinc-500">Keep Google Calendar, Gmail, and Google Drive synchronized with your development roadmap & tasks.</p>
                </div>

                <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-850/60 flex flex-col items-center justify-center space-y-4 text-center">
                  {isGoogleConnected ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                        <Check size={24} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-200 block">Google Account Connected</span>
                        <span className="text-[10px] text-emerald-500 font-mono">Google Credentials Synchronized</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                        <Chrome size={24} className="text-zinc-400 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-zinc-300">Authorize Google workspace</h4>
                        <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">Link Google Drive for referencing repository assets and Google Calendar for deadlines.</p>
                      </div>
                      <button
                        onClick={handleConnectGoogle}
                        disabled={isGoogleConnecting}
                        className="w-full sm:w-auto px-6 py-2.5 bg-zinc-100 hover:bg-white text-black font-bold font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
                      >
                        {isGoogleConnecting ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Authenticating...
                          </>
                        ) : (
                          <>
                            <Chrome size={14} /> Log in & Link Google
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 leading-relaxed space-y-1 pt-3 border-t border-zinc-900 w-full text-left">
                    <span className="text-zinc-400 font-mono uppercase tracking-wider block mb-1 text-[9px]">ACTIVE PERMISSIONS</span>
                    <p>• Read-only access to files inside your Google Drive for reference syncing.</p>
                    <p>• Syncing of task deadlines directly into your Google Calendar.</p>
                  </div>
                </div>

                <div className="text-xs text-zinc-500 flex items-center gap-1.5 bg-zinc-950 p-2.5 border border-zinc-900 rounded-lg">
                  <Sparkles size={13} className="text-yellow-500" />
                  <span>Aether AI automatically links contextual meeting invites into project milestones.</span>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CONFIRMATION SUMMARY */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-4"
              >
                <div className="text-center space-y-2 py-2">
                  <div className="w-12 h-12 bg-gradient-to-tr from-yellow-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-[0_0_20px_rgba(234,179,8,0.25)]">
                    <Check size={22} className="text-black font-extrabold" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">Profile Architecture Solidified!</h3>
                  <p className="text-xs text-zinc-500">Your secure synapse profile has been compiled and is ready for full-scale operations.</p>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850/60 rounded-xl divide-y divide-zinc-900">
                  <div className="pb-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">Dev Handle</span>
                      <span className="font-bold text-zinc-200">@{username}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">Accent Theme</span>
                      <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: avatarColor }} />
                        {ACCENT_COLORS.find(c => c.hex === avatarColor)?.name || 'Custom'}
                      </span>
                    </div>
                  </div>

                  <div className="py-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">GitHub Synapse</span>
                      <span className="text-zinc-300 font-mono truncate block">
                        {isGithubConnected ? `@${githubUser || 'Linked'}` : 'Not Connected'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">Google Workspace</span>
                      <span className="text-zinc-300 font-mono truncate block">
                        {isGoogleConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 text-xs text-zinc-400">
                    <span className="text-[9px] text-zinc-500 uppercase font-mono block mb-0.5">Bio Quote Summary</span>
                    <p className="italic text-[11px] leading-relaxed">"{bio}"</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ChevronLeft size={13} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="py-2.5 px-5 bg-zinc-100 hover:bg-white text-black rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Continue <ChevronRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="py-2.5 px-6 bg-gradient-to-r from-yellow-500 via-amber-500 to-emerald-500 hover:from-yellow-400 hover:to-emerald-400 text-black rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(234,179,8,0.2)]"
              >
                <Sparkles size={14} /> Synapse Workspace
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
