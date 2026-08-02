import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Monitor, 
  RefreshCw, 
  Check, 
  X, 
  Terminal, 
  HardDrive, 
  ShieldCheck, 
  Keyboard, 
  Hand, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy,
  Info,
  Code2,
  FileCode,
  ExternalLink
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { auth } from '../../lib/auth';
import { fetchDesktopReleaseStatus, triggerWindowsInstallerDownload, DesktopReleaseStatus } from '../../lib/desktopReleaseService';
import { probeLocalServer, getLocalSettings, saveLocalSettings } from '../../lib/localModelEngine';

interface DownloadDesktopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadDesktopModal({ isOpen, onClose }: DownloadDesktopModalProps) {
  const { showToast } = useData();

  // Wizard Step State (1 through 6)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Platform Selection (Windows, macOS, Linux)
  const [selectedOs, setSelectedOs] = useState<'win' | 'mac' | 'linux'>('win');
  const [localDbPath, setLocalDbPath] = useState('%USERPROFILE%\\.devspace\\cache.db');

  // Step 2: Account & Cloud Sync
  const [wizardUserName, setWizardUserName] = useState('DevSpace Developer');
  const [wizardUserEmail, setWizardUserEmail] = useState('user@devspace.ai');
  const [syncInterval, setSyncInterval] = useState('instant');

  // Step 3: Local LLMs & Ollama
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [selectedOllamaModel, setSelectedOllamaModel] = useState('qwen2.5-coder:7b');
  const [isProbingOllama, setIsProbingOllama] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);

  // Step 4: Claude CLI & App Watcher
  const [enableClaudeAutoApproval, setEnableClaudeAutoApproval] = useState(true);
  const [watcherDir, setWatcherDir] = useState('%USERPROFILE%\\.devspace\\watcher');
  const [notifyOnCompletion, setNotifyOnCompletion] = useState(true);

  // Step 5: System Scopes, Hotkeys & Hand Gestures
  const [globalHotkey, setGlobalHotkey] = useState('Cmd+Shift+E');
  const [scopesGranted, setScopesGranted] = useState({
    fileAccess: true,
    screenContext: true,
    claudeAutoClicker: true,
    localModels: true,
    handGestures: true,
    globalHotkeys: true
  });

  // Step 6: Desktop Release Status & Production Binary Download
  const [releaseStatus, setReleaseStatus] = useState<DesktopReleaseStatus | null>(null);
  const [isLoadingReleaseStatus, setIsLoadingReleaseStatus] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeveloperBuildInfo, setShowDeveloperBuildInfo] = useState(false);
  const [hasDownloadedPackage, setHasDownloadedPackage] = useState(() => {
    return localStorage.getItem('devspace_package_downloaded') === 'true';
  });

  const [copiedUnblockCmd, setCopiedUnblockCmd] = useState(false);

  // Auto-fill user information from authenticated session & check release status
  useEffect(() => {
    if (!isOpen) return;
    const user = auth.currentUser;
    if (user) {
      if (user.displayName) {
        setWizardUserName(user.displayName);
      } else if (user.email) {
        const derivedName = user.email.split('@')[0];
        setWizardUserName(derivedName.charAt(0).toUpperCase() + derivedName.slice(1));
      }
      if (user.email) {
        setWizardUserEmail(user.email);
      }
    }
    const savedLocal = getLocalSettings();
    if (savedLocal.activeModelName) {
      setSelectedOllamaModel(savedLocal.activeModelName);
    }

    // Fetch official release status
    setIsLoadingReleaseStatus(true);
    fetchDesktopReleaseStatus()
      .then((status) => setReleaseStatus(status))
      .catch((err) => console.error("Error checking desktop release status:", err))
      .finally(() => setIsLoadingReleaseStatus(false));
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleProbeOllama = async () => {
    setIsProbingOllama(true);
    setOllamaConnected(null);
    try {
      const res = await probeLocalServer({
        id: 'ollama',
        name: 'Ollama',
        url: ollamaHost,
        type: 'ollama',
        status: 'checking',
        models: []
      });
      if (res.status === 'online') {
        setOllamaConnected(true);
        showToast(`✅ Connected to local Ollama server at ${ollamaHost}! Found models.`, "success", 4000);
      } else {
        setOllamaConnected(false);
        showToast(`⚠️ Could not reach Ollama at ${ollamaHost}. Make sure 'ollama serve' is running on your PC.`, "info", 5000);
      }
    } catch {
      setOllamaConnected(false);
      showToast(`⚠️ Ollama server probe offline. You can install & run Ollama after setup.`, "info", 4000);
    } finally {
      setIsProbingOllama(false);
    }
  };

  const handleStartDownload = async () => {
    if (!releaseStatus?.available || !releaseStatus?.downloadUrl) {
      showToast("⚠️ No published Windows installer binary is available for download yet.", "info", 5000);
      return;
    }

    setIsDownloading(true);

    try {
      // Save local settings
      saveLocalSettings({
        activeServerId: 'ollama-default',
        activeModelName: selectedOllamaModel,
        assignedTask: 'all',
        fallbackToCloud: true
      });

      setHasDownloadedPackage(true);
      localStorage.setItem('devspace_package_downloaded', 'true');

      showToast(`📥 Initiating download of ${releaseStatus.fileName || 'DevSpace Aether Desktop Setup 2.5.0.exe'}...`, "success", 5000);
      triggerWindowsInstallerDownload(releaseStatus.downloadUrl, releaseStatus.fileName);
    } catch (err) {
      console.error("Download error:", err);
      showToast("❌ Download request failed.", "error", 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  const copyPowershellUnblock = () => {
    const cmd = `npm run dist:win`;
    navigator.clipboard.writeText(cmd);
    setCopiedUnblockCmd(true);
    showToast("📋 Copied Windows Electron NSIS build command: 'npm run dist:win'", "success", 3000);
    setTimeout(() => setCopiedUnblockCmd(false), 3000);
  };

  const finishSetupWizard = () => {
    if (releaseStatus?.available && !hasDownloadedPackage) {
      handleStartDownload();
    } else {
      showToast("🎉 DevSpace Desktop Setup complete!", "success", 5000);
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl my-auto bg-[#09090c] border border-yellow-500/40 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden font-sans text-zinc-200 flex flex-col max-h-[92vh]"
          >
            {/* Modal Top Header */}
            <div className="p-4 bg-gradient-to-r from-[#0d0d12] via-[#121218] to-[#0d0d12] border-b border-zinc-850 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                  <Monitor size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">DevSpace Desktop Setup Wizard</h3>
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded text-[9px] font-mono font-bold">
                      v2.5.0
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                    Native Application Setup • Account Sync • Local LLMs • Hotkeys
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Close wizard"
              >
                <X size={16} />
              </button>
            </div>

            {/* 6 Step Navigation Progress Bar Header */}
            <div className="p-3 bg-[#0b0b0f] border-b border-zinc-850 shrink-0 select-none">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-center font-mono text-[10px]">
                {[
                  { num: 1, label: '1. Platform' },
                  { num: 2, label: '2. Account Sync' },
                  { num: 3, label: '3. Local LLMs' },
                  { num: 4, label: '4. Claude CLI' },
                  { num: 5, label: '5. Hotkeys & Scopes' },
                  { num: 6, label: '6. Download & Launch' }
                ].map((s) => (
                  <button
                    key={s.num} 
                    onClick={() => setWizardStep(s.num as any)}
                    className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                      wizardStep === s.num 
                        ? 'bg-yellow-500/10 border-yellow-500/60 text-yellow-300 font-bold shadow-[0_0_10px_rgba(234,179,8,0.15)]'
                        : wizardStep > s.num
                        ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 font-semibold'
                        : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <span>{s.label}</span>
                    {wizardStep > s.num && <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Step-by-Step Wizard Scrollable Content */}
            <div className="p-5 overflow-y-auto max-h-[70vh]">
              
              {/* STEP 1: Computer Platform */}
              {wizardStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 bg-gradient-to-r from-yellow-950/30 via-zinc-900/80 to-zinc-950 border border-yellow-500/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <HardDrive size={18} className="text-yellow-400" />
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Step 1: Select Target Operating System
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Select your target desktop operating system platform. Production builds are packaged as native desktop application installers for Windows (64-bit NSIS executable).
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
                      Target Computer Platform
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'win', label: 'Windows PC', detail: 'Native NSIS Installer (.exe)', icon: <HardDrive size={18} /> },
                        { id: 'mac', label: 'macOS Apple', detail: 'Electron macOS App', icon: <Monitor size={18} /> },
                        { id: 'linux', label: 'Linux PC', detail: 'Electron Linux App', icon: <Terminal size={18} /> },
                      ].map((os) => (
                        <button
                          key={os.id}
                          onClick={() => {
                            setSelectedOs(os.id as any);
                            if (os.id === 'win') {
                              setLocalDbPath('%USERPROFILE%\\.devspace\\cache.db');
                            } else if (os.id === 'mac' || os.id === 'linux') {
                              setLocalDbPath('~/.devspace/cache.db');
                            }
                          }}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            selectedOs === os.id
                              ? 'bg-yellow-500/10 border-yellow-500/60 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                              : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={selectedOs === os.id ? 'text-yellow-400' : 'text-zinc-500'}>
                              {os.icon}
                            </span>
                            {selectedOs === os.id && <Check size={16} className="text-yellow-400" />}
                          </div>
                          <div className="mt-4">
                            <span className="text-sm font-bold font-mono block text-white">{os.label}</span>
                            <span className="text-[11px] text-zinc-400 block truncate font-mono mt-0.5">{os.detail}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Specifications Card */}
                  <div className="p-4 bg-[#0d0d12] border border-yellow-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        Electron Native Desktop Specs
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded font-mono font-bold">
                        Program Files Installation
                      </span>
                    </div>
                    <p className="text-[11.5px] text-zinc-300 leading-relaxed">
                      DevSpace Desktop compiles into a native Windows executable with an official NSIS installer. It installs into <code className="text-yellow-300 font-mono">C:\Program Files\DevSpace Aether Desktop</code> with Start Menu and Desktop shortcuts.
                    </p>
                  </div>

                  {/* Local SQLite DB Cache Path */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      Local Computer Cache Path
                    </label>
                    <input
                      type="text"
                      value={localDbPath}
                      onChange={(e) => setLocalDbPath(e.target.value)}
                      className="w-full bg-[#0d0d12] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-end pt-3 border-t border-zinc-850">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Account & Cloud Sync</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: User Account & Bi-Directional Cloud Sync */}
              {wizardStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCheck size={18} className="text-yellow-400" />
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Step 2: User Account & Bi-Directional Sync Registration
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      DevSpace syncs your code spaces, projects, notes, and local AI history between the web and your desktop computer.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                        Developer Display Name
                      </label>
                      <input
                        type="text"
                        value={wizardUserName}
                        onChange={(e) => setWizardUserName(e.target.value)}
                        className="w-full bg-[#0d0d12] border border-zinc-850 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                        Sync Account Email
                      </label>
                      <input
                        type="email"
                        value={wizardUserEmail}
                        onChange={(e) => setWizardUserEmail(e.target.value)}
                        className="w-full bg-[#0d0d12] border border-zinc-850 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      Bi-Directional Cloud Sync Interval
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'instant', label: 'Instant (WebSocket)', desc: 'Real-time updates' },
                        { id: '5min', label: 'Every 5 Mins', desc: 'Low bandwidth' },
                        { id: 'manual', label: 'Manual Only', desc: 'On demand sync' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSyncInterval(opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            syncInterval === opt.id
                              ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300 font-bold'
                              : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                          }`}
                        >
                          <span className="text-xs font-mono block text-white font-bold">{opt.label}</span>
                          <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Local LLMs</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Local LLMs & Ollama Configuration */}
              {wizardStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Terminal size={18} className="text-yellow-400" />
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Step 3: Local LLMs & Ollama Integration Setup
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Connect DevSpace Desktop to local Ollama LLMs running on your GPU for offline privacy and zero-latency code generation.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-wider">
                        Local Ollama API Host URL
                      </label>
                      <button
                        onClick={handleProbeOllama}
                        disabled={isProbingOllama}
                        className="px-2.5 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw size={11} className={isProbingOllama ? 'animate-spin' : ''} />
                        <span>{isProbingOllama ? 'Probing Ollama...' : 'Test Connection'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={ollamaHost}
                      onChange={(e) => setOllamaHost(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50"
                    />

                    {ollamaConnected !== null && (
                      <div className={`p-2 rounded-lg text-[11px] font-mono flex items-center gap-2 ${ollamaConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                        {ollamaConnected ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        <span>{ollamaConnected ? 'Local Ollama Server Connected!' : 'Server probe offline. Ensure Ollama is installed.'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      Default Desktop Local Coding Model
                    </label>
                    <select
                      value={selectedOllamaModel}
                      onChange={(e) => setSelectedOllamaModel(e.target.value)}
                      className="w-full bg-[#0d0d12] border border-zinc-850 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50 cursor-pointer"
                    >
                      <option value="qwen2.5-coder:7b">qwen2.5-coder:7b (Recommended - Fast & Accurate)</option>
                      <option value="llama3.1:8b">llama3.1:8b (General Reasoner)</option>
                      <option value="deepseek-r1:8b">deepseek-r1:8b (Reasoning Specialist)</option>
                      <option value="codellama:7b">codellama:7b (Meta Code Model)</option>
                      <option value="mistral:7b">mistral:7b (Lightweight Fast)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={() => setWizardStep(4)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Claude CLI</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Claude CLI & Watcher */}
              {wizardStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Terminal size={18} className="text-yellow-400" />
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Step 4: Claude Code CLI Watcher Setup
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      DevSpace Desktop monitors terminal windows and Claude CLI prompt outputs to auto-approve safe commands and sync project state.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div 
                      onClick={() => setEnableClaudeAutoApproval(!enableClaudeAutoApproval)}
                      className="p-3 bg-[#0d0d12] border border-zinc-850 hover:border-yellow-500/40 rounded-xl flex items-center justify-between gap-3 cursor-pointer select-none transition-all"
                    >
                      <div>
                        <span className="text-xs font-bold font-mono text-white block">Enable Claude CLI Auto-Approve Assistant</span>
                        <span className="text-[10px] text-zinc-400 block font-sans">Automatically approves standard non-destructive terminal read calls.</span>
                      </div>
                      <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${enableClaudeAutoApproval ? 'bg-yellow-500' : 'bg-zinc-800'}`}>
                        <div className={`w-4 h-4 rounded-full bg-black transition-transform ${enableClaudeAutoApproval ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                        Claude Code Directory Watcher Target
                      </label>
                      <input
                        type="text"
                        value={watcherDir}
                        onChange={(e) => setWatcherDir(e.target.value)}
                        className="w-full bg-[#0d0d12] border border-zinc-850 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={() => setWizardStep(5)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Hotkeys & Scopes</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Hotkeys, Permissions & Gestures */}
              {wizardStep === 5 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Keyboard size={18} className="text-yellow-400" />
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Step 5: System Permissions, Hotkeys & Camera Gestures
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Configure keyboard triggers, local directory scopes, and camera hand gestures for Aether vision.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-wider block">
                        Global Desktop Trigger Hotkey
                      </label>
                      <input
                        type="text"
                        value={globalHotkey}
                        onChange={(e) => setGlobalHotkey(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50"
                      />
                      <span className="text-[10px] text-zinc-500 font-mono block">Press across any app on your PC to toggle DevSpace Aether.</span>
                    </div>

                    <div className="p-3.5 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-wider block">
                        Emergency Pause Hotkey
                      </label>
                      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300">
                        Escape (Esc) Key
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono block">Instantly stops all AI actions and closes overlays.</span>
                    </div>
                  </div>

                  {/* Camera Hand Gestures Card */}
                  <div className="p-3.5 bg-[#0d0d12] border border-zinc-850 rounded-xl space-y-2">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Hand size={15} className="text-yellow-400" />
                      MediaPipe Camera Hand Gesture Controls
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10.5px] font-mono pt-1">
                      <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-300">
                        <span className="text-yellow-400 font-bold block">👌 Pinch Finger</span>
                        <span>Circle Screen Context</span>
                      </div>
                      <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-300">
                        <span className="text-yellow-400 font-bold block">👋 Wave Hand</span>
                        <span>Summarize Screen</span>
                      </div>
                      <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-300">
                        <span className="text-yellow-400 font-bold block">✋ Open Palm</span>
                        <span>Pause AI Task</span>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Toggles */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                      Local Desktop Permission Scopes
                    </label>
                    {[
                      { key: 'fileAccess', label: 'Local File System Access', desc: 'Read and access local files on your PC.' },
                      { key: 'screenContext', label: 'Aether Screen Vision Capture', desc: 'Circle any screen area to teach Aether code context.' },
                      { key: 'localModels', label: 'Local LLM GPU Execution', desc: 'Route prompts to local Ollama models.' },
                    ].map((scope) => (
                      <div 
                        key={scope.key} 
                        onClick={() => setScopesGranted(prev => ({ ...prev, [scope.key]: !prev[scope.key as keyof typeof prev] }))}
                        className="p-2.5 bg-[#0d0d12] border border-zinc-850 hover:border-yellow-500/40 rounded-xl flex items-center justify-between gap-3 cursor-pointer select-none transition-all"
                      >
                        <div>
                          <span className="text-xs font-bold font-mono text-white block">{scope.label}</span>
                          <span className="text-[10px] text-zinc-400 block font-sans">{scope.desc}</span>
                        </div>
                        <div className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${scopesGranted[scope.key as keyof typeof scopesGranted] ? 'bg-yellow-500' : 'bg-zinc-800'}`}>
                          <div className={`w-4 h-4 rounded-full bg-black transition-transform ${scopesGranted[scope.key as keyof typeof scopesGranted] ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-850">
                    <button
                      onClick={() => setWizardStep(4)}
                      className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={() => setWizardStep(6)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center gap-2 cursor-pointer"
                    >
                      <span>Review & Download Installer</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: Review, Official Binary Release Download & Launch */}
              {wizardStep === 6 && (
                <div className="space-y-6 text-center animate-in fade-in duration-200 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 text-black flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                    <Sparkles size={28} />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-extrabold text-white font-mono tracking-tight">
                      🎉 Setup Complete! DevSpace Desktop Deployment
                    </h3>
                    <p className="text-xs text-zinc-300 font-sans max-w-lg mx-auto leading-relaxed">
                      Configured for <strong className="text-yellow-400">{wizardUserName}</strong> (<code className="text-zinc-400">{wizardUserEmail}</code>). All local file scopes, Ollama settings, and hotkeys are configured.
                    </p>
                  </div>

                  {/* Configuration Summary Card */}
                  <div className="p-4 bg-[#0d0d12] border border-yellow-500/40 rounded-2xl max-w-lg mx-auto text-left space-y-2.5 font-mono text-xs text-zinc-300">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px]">
                      <span className="text-zinc-400 font-bold uppercase flex items-center gap-1.5">
                        <HardDrive size={13} className="text-yellow-400" />
                        Target Platform:
                      </span>
                      <span className="text-yellow-400 font-bold uppercase">
                        Windows Desktop NSIS Package (64-bit)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div><span className="text-zinc-500">Local Cache:</span> <span className="text-zinc-200 block truncate">{localDbPath}</span></div>
                      <div><span className="text-zinc-500">Sync Interval:</span> <span className="text-zinc-200 block uppercase">{syncInterval}</span></div>
                      <div><span className="text-zinc-500">Ollama Model:</span> <span className="text-yellow-400 block font-bold">{selectedOllamaModel}</span></div>
                      <div><span className="text-zinc-500">Global Hotkey:</span> <span className="text-yellow-400 block font-bold">{globalHotkey}</span></div>
                    </div>
                  </div>

                  {/* Release Status & Main Download Section */}
                  <div className="max-w-lg mx-auto space-y-3">
                    {isLoadingReleaseStatus ? (
                      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl font-mono text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-yellow-400" />
                        <span>Resolving latest stable desktop release...</span>
                      </div>
                    ) : releaseStatus?.available !== false ? (
                      /* Production Release Available Card */
                      <div className="p-5 bg-[#0d0d14] border border-yellow-500/30 rounded-2xl text-left space-y-4 font-sans">
                        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                          <div>
                            <h4 className="text-sm font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
                              <span>Download DevSpace Desktop</span>
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-md text-[10px] font-bold">
                                {releaseStatus?.version || 'v2.5.0'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                              Release Date: {releaseStatus?.publishedAt ? new Date(releaseStatus.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'August 2026'}
                            </p>
                          </div>
                          <div className="text-right font-mono text-[11px]">
                            <span className="text-zinc-400 block font-bold">{releaseStatus?.fileSizeMB || 85.4} MB</span>
                            <span className="text-zinc-500 text-[10px]">Windows x64</span>
                          </div>
                        </div>

                        {/* Release Notes */}
                        <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-850/60">
                          <span className="text-[11px] font-bold text-zinc-300 font-mono block">Release Highlights:</span>
                          <ul className="text-xs text-zinc-400 space-y-1 font-sans pl-1">
                            {(releaseStatus?.releaseNotes || '• Native Windows Electron runtime with local Ollama & Gemini 3.6 Flash\n• Zero-latency local SQLite cache with synaptic context state\n• Background app watcher and Claude CLI triggers\n• Custom global hotkeys & multi-monitor support').split('\n').map((note, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-yellow-400 font-bold">•</span>
                                <span>{note.replace(/^•\s*/, '')}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Checksum */}
                        {releaseStatus?.sha256 && (
                          <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950/40 px-2.5 py-1.5 rounded-lg border border-zinc-850/40 flex items-center justify-between">
                            <span>SHA256:</span>
                            <code className="text-zinc-400 truncate max-w-[280px]" title={releaseStatus.sha256}>{releaseStatus.sha256}</code>
                          </div>
                        )}

                        {/* Download Button */}
                        <button
                          onClick={handleStartDownload}
                          disabled={isDownloading}
                          className="w-full py-3.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-extrabold rounded-xl transition-all shadow-[0_0_25px_rgba(234,179,8,0.35)] flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.01]"
                        >
                          {isDownloading ? (
                            <>
                              <RefreshCw size={16} className="animate-spin text-black" />
                              <span>INITIATING DOWNLOAD...</span>
                            </>
                          ) : (
                            <>
                              <Download size={16} className="text-black" />
                              <span>DOWNLOAD DEVSPACE DESKTOP SETUP (.EXE)</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Production Release Pending Card - User Friendly, Zero Dev Diagnostics */
                      <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-left space-y-3 font-sans">
                        <div className="flex items-center gap-2 text-yellow-400 font-mono text-xs font-bold">
                          <AlertCircle size={15} />
                          <span>Preparing Latest Desktop Release</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          DevSpace Desktop for Windows is currently preparing its latest stable build. Please check back shortly.
                        </p>
                        <button
                          onClick={() => {
                            setIsLoadingReleaseStatus(true);
                            fetchDesktopReleaseStatus()
                              .then((s) => setReleaseStatus(s))
                              .finally(() => setIsLoadingReleaseStatus(false));
                          }}
                          className="w-full py-2.5 px-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-yellow-300 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                        >
                          <RefreshCw size={13} />
                          <span>Check Release Status Again</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Wizard Footer Controls */}
                  <div className="flex justify-between items-center max-w-lg mx-auto pt-2 border-t border-zinc-850">
                    <button
                      onClick={() => setWizardStep(5)}
                      className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={finishSetupWizard}
                      className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Finish & Close
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
