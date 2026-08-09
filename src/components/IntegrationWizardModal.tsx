import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Activity,
  ChevronRight,
  Info,
  Server
} from 'lucide-react';
import {
  integrationFramework,
  IntegrationProvider,
  IntegrationDiagnostic
} from '../lib/integrationFramework';
import { aetherSpotify } from '../lib/aetherSpotifyEngine';

interface IntegrationWizardModalProps {
  providerId: string;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export function IntegrationWizardModal({ providerId, onClose, onSaveSuccess }: IntegrationWizardModalProps) {
  const provider = integrationFramework.getProvider(providerId);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [credentials, setCredentials] = useState<Record<string, string>>(() =>
    integrationFramework.getConfiguredCredentials(providerId)
  );
  const [diagnostic, setDiagnostic] = useState<IntegrationDiagnostic>(() =>
    integrationFramework.getDiagnostic(providerId)
  );
  const [copiedRedirect, setCopiedRedirect] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  if (!provider) {
    return null;
  }

  const handleInputChange = (key: string, val: string) => {
    setCredentials(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveAndTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      const diag = integrationFramework.saveCredentials(providerId, credentials);
      const testedDiag = integrationFramework.runTestConnection(providerId);
      setDiagnostic(testedDiag);
      setIsTesting(false);
      if (onSaveSuccess) onSaveSuccess();
    }, 600);
  };

  const copyRedirectUri = () => {
    if (provider.redirectUri) {
      navigator.clipboard.writeText(provider.redirectUri);
      setCopiedRedirect(true);
      setTimeout(() => setCopiedRedirect(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 shrink-0">
              <Key size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-100">{provider.name} Integration Wizard</h3>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full">
                  {provider.authType}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{provider.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Wizard Stepper Tabs */}
        <div className="flex items-center border-b border-zinc-800 bg-[#121214] px-5 py-2.5 overflow-x-auto gap-2">
          {provider.setupSteps.map((step) => {
            const isActive = currentStep === step.stepNumber;
            const isCompleted = currentStep > step.stepNumber;
            return (
              <button
                key={step.stepNumber}
                onClick={() => setCurrentStep(step.stepNumber)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-yellow-500 text-black font-bold shadow-md'
                    : isCompleted
                    ? 'bg-zinc-850 text-zinc-300 hover:bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold font-mono ${
                  isActive ? 'bg-black text-yellow-400' : isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isCompleted ? '✓' : step.stepNumber}
                </span>
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {providerId === 'skill-spotify' ? (
            <>
              {/* Spotify Step 1: Create Spotify App */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                        <Key size={22} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-zinc-100">Step 1: Open Spotify Developer Dashboard</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          To connect DevSpace with your Spotify account, you must create a free application entry in the official Spotify Developer Dashboard.
                        </p>
                      </div>
                    </div>

                    {/* Login Notice Banner */}
                    <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <Info size={15} />
                        <span>Important Spotify Account Requirement</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[11px]">
                        Make sure you are logged into your Spotify account in your browser. If clicking the button below opens documentation or landing pages, click <strong className="text-amber-300 font-bold">"Log In"</strong> in the top-right corner of Spotify's website to access your Developer Dashboard.
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20">
                      <div>
                        <p className="text-xs font-bold text-emerald-400">Spotify Developer Portal</p>
                        <p className="text-[11px] text-zinc-400">Opens https://developer.spotify.com/dashboard in a new tab</p>
                      </div>
                      <a
                        href="https://developer.spotify.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
                      >
                        <span>Open Spotify Developer Dashboard</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Next: Application Details</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Spotify Step 2: App Details */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Info size={16} className="text-emerald-400" />
                        Step 2: Create a New Application Entry
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        In the Spotify Developer Dashboard, click the green <strong className="text-zinc-200">"Create App"</strong> button (top right) and fill in these values:
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400">App Name</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Required</span>
                        </div>
                        <p className="text-zinc-200 font-medium">Enter <code className="bg-black px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[11px]">DevSpace</code> or <code className="bg-black px-1.5 py-0.5 rounded text-emerald-300 font-mono text-[11px]">DevSpace Focus Audio</code></p>
                      </div>

                      <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400">App Description</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
                        </div>
                        <p className="text-zinc-200 font-medium">Enter <code className="bg-black px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[11px]">AI-powered developer workspace & ambient audio controls</code></p>
                      </div>

                      <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400">Website</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
                        </div>
                        <p className="text-zinc-200 font-medium">Enter workspace URL: <code className="bg-black px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[11px]">{typeof window !== 'undefined' ? window.location.origin : 'https://devspace.app'}</code></p>
                      </div>

                      <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-400">Redirect URIs</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">Configured in Step 3</span>
                        </div>
                        <p className="text-zinc-400">You will copy the exact DevSpace Redirect URIs in the next step.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Next: Redirect URIs</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Spotify Step 3: Exact Redirect URIs */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">Step 3: Configure Authorized Redirect URIs</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        In your Spotify App settings, locate <strong className="text-zinc-200">"Redirect URIs"</strong>, add the exact URLs below, and click <strong className="text-zinc-200">Save</strong>.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* Development URI */}
                      <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Development Environment URI
                          </span>
                          <span className="text-[10px] text-zinc-500">Current active window</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-yellow-300 flex-1 truncate bg-black p-2.5 rounded-lg border border-zinc-800">
                            {aetherSpotify.getRedirectUri()}
                          </code>
                          <button
                            onClick={() => {
                              const uri = aetherSpotify.getRedirectUri();
                              navigator.clipboard.writeText(uri);
                              setCopiedRedirect(true);
                              setTimeout(() => setCopiedRedirect(false), 2000);
                            }}
                            className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            {copiedRedirect ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedRedirect ? 'Copied!' : 'Copy URI'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Production URI */}
                      <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider font-mono">
                            Production / Deployment URI
                          </span>
                          <span className="text-[10px] text-zinc-500">Shared deployment</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-yellow-300 flex-1 truncate bg-black p-2.5 rounded-lg border border-zinc-800">
                            https://ais-pre-3kik42vq3fw4lyryeckdeg-164818161298.us-west2.run.app/settings
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('https://ais-pre-3kik42vq3fw4lyryeckdeg-164818161298.us-west2.run.app/settings');
                              alert('Production Redirect URI copied to clipboard!');
                            }}
                            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <Copy size={14} />
                            <span>Copy URI</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Next: OAuth Scopes</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Spotify Step 4: OAuth Scopes */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        Step 4: Required OAuth Permissions
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        DevSpace requests only the essential permissions needed to control focus music during coding sessions:
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <code className="text-emerald-400 font-mono text-xs font-bold">user-read-playback-state</code>
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
                            Read Device Status
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">Allows DevSpace to detect your active speaker, desktop, or mobile player.</p>
                      </div>

                      <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <code className="text-emerald-400 font-mono text-xs font-bold">user-modify-playback-state</code>
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
                            Playback Controls
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">Enables Play, Pause, Skip, Volume control, and automated focus audio dimming.</p>
                      </div>

                      <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <code className="text-emerald-400 font-mono text-xs font-bold">user-read-currently-playing</code>
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
                            Track Info
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">Displays current track title, artist, and artwork in your DevSpace header.</p>
                      </div>

                      <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <code className="text-emerald-400 font-mono text-xs font-bold">playlist-read-private</code>
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full">
                            Playlists
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">Loads focus playlists and deep work soundscapes directly into DevSpace.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(5)}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Next: Enter Client ID</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Spotify Step 5: Enter Client ID */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100">Step 5: Enter Spotify Client ID</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Copy the <strong className="text-zinc-200">Client ID</strong> from your Spotify Developer Dashboard application overview and paste it below.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-zinc-200 block">
                        Spotify Client ID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p"
                        value={credentials.clientId || ''}
                        onChange={(e) => {
                          const cleaned = e.target.value.trim();
                          handleInputChange('clientId', cleaned);
                          aetherSpotify.setClientId(cleaned);
                        }}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-emerald-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />

                      {/* Client ID Validation Indicator */}
                      {credentials.clientId && credentials.clientId.length < 20 && (
                        <p className="text-[11px] text-amber-400 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          <span>Client ID looks short. Spotify Client IDs are usually 32 alphanumeric characters.</span>
                        </p>
                      )}

                      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs space-y-1">
                        <span className="font-bold text-emerald-400 block">No Client Secret Required</span>
                        <p className="text-zinc-300 text-[11px]">
                          DevSpace uses secure Authorization Code with PKCE (Proof Key for Code Exchange). You do not need to expose or paste your Client Secret.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        if (!credentials.clientId || !credentials.clientId.trim()) {
                          alert('Please enter your Spotify Client ID before proceeding.');
                          return;
                        }
                        handleSaveAndTest();
                        setCurrentStep(6);
                      }}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Save & Proceed to Connect</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Spotify Step 6: Connect Spotify */}
              {currentStep === 6 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4 text-center py-8">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Key size={26} />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="text-base font-bold text-zinc-100">Step 6: Connect Your Spotify Account</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Click below to launch Spotify's official login screen and authorize DevSpace to stream focus tracks.
                      </p>
                    </div>

                    {/* Pre-flight validation warnings */}
                    {!credentials.clientId && (
                      <div className="max-w-md mx-auto p-3 bg-red-950/30 border border-red-800/40 rounded-lg text-red-300 text-xs text-left">
                        <p className="font-bold">Missing Client ID</p>
                        <p className="text-[11px] mt-0.5">Return to Step 5 and enter your Spotify Client ID before connecting.</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={async () => {
                          const res = await aetherSpotify.startOAuthLogin();
                          if (!res.success) {
                            alert(res.message);
                          } else {
                            setTimeout(() => {
                              setCurrentStep(7);
                            }, 1000);
                          }
                        }}
                        disabled={!credentials.clientId}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Key size={16} />
                        <span>Connect Spotify</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(5)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(7)}
                      className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Diagnostics</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Spotify Step 7: Diagnostics & Status */}
              {currentStep === 7 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-100">Step 7: Spotify Connection Diagnostics</h4>
                        <p className="text-xs text-zinc-400 mt-0.5">Live status and active playback verification.</p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                        aetherSpotify.getState().isAuthenticated
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}>
                        {aetherSpotify.getState().isAuthenticated ? '● CONNECTED' : '● AUTHENTICATION REQUIRED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Current Spotify Account</span>
                        <p className="font-bold text-zinc-100">{aetherSpotify.getState().userProfileName || 'Not Connected'}</p>
                      </div>

                      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Token Status</span>
                        <p className="font-bold text-emerald-400">{aetherSpotify.getState().isAuthenticated ? 'Active PKCE Token' : 'No Token'}</p>
                      </div>

                      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Active Output Device</span>
                        <p className="font-bold text-zinc-200">
                          {aetherSpotify.getState().devices.find(d => d.isActive)?.name || (aetherSpotify.getState().devices.length > 0 ? aetherSpotify.getState().devices[0].name : 'No active device')}
                        </p>
                      </div>

                      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Playback Status</span>
                        <p className="font-bold text-yellow-400">
                          {aetherSpotify.getState().isPlaying ? 'PLAYING' : 'PAUSED'}
                        </p>
                      </div>
                    </div>

                    {/* 11-Point Automated Runtime Testing Grid */}
                    <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400" />
                          Automated Capability Diagnostics
                        </span>
                        <button
                          onClick={async () => {
                            await aetherSpotify.runRuntimeTests();
                          }}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold rounded transition-colors cursor-pointer"
                        >
                          Re-Run Diagnostic Test
                        </button>
                      </div>

                      {(() => {
                        const tr = aetherSpotify.getState().testResult || {
                          currentUser: aetherSpotify.getState().isAuthenticated ? 'working' : 'unavailable',
                          currentPlayback: aetherSpotify.getState().isAuthenticated ? 'working' : 'unavailable',
                          devices: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                          play: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                          pause: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                          next: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                          previous: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                          seek: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                          volume: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                          shuffle: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                          repeat: aetherSpotify.getState().devices.length > 0 ? 'working' : 'unavailable',
                        };

                        const items = [
                          { name: 'Current User', status: tr.currentUser },
                          { name: 'Current Playback', status: tr.currentPlayback },
                          { name: 'Devices', status: tr.devices },
                          { name: 'Play', status: tr.play },
                          { name: 'Pause', status: tr.pause },
                          { name: 'Next', status: tr.next },
                          { name: 'Previous', status: tr.previous },
                          { name: 'Seek', status: tr.seek },
                          { name: 'Volume', status: tr.volume },
                          { name: 'Shuffle', status: tr.shuffle },
                          { name: 'Repeat', status: tr.repeat },
                        ];

                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                            {items.map((it, idx) => {
                              const isWorking = it.status === 'working';
                              const isFailed = it.status === 'failed';
                              return (
                                <div key={idx} className="p-2 bg-black border border-zinc-850 rounded flex items-center justify-between">
                                  <span className="text-zinc-300 font-medium truncate">{it.name}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                    isWorking
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                      : isFailed
                                      ? 'bg-red-950 text-red-400 border border-red-800'
                                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                  }`}>
                                    {isWorking ? '✓ Working' : isFailed ? '✕ Failed' : '○ Unavailable'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Troubleshooting Guide if Warnings or Fixes Exist */}
                    {aetherSpotify.getState().testResult?.recommendedFix ? (
                      <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-1 text-xs text-amber-300">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          Action Required
                        </p>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          {aetherSpotify.getState().testResult?.recommendedFix}
                        </p>
                      </div>
                    ) : aetherSpotify.getState().noActiveDeviceWarning ? (
                      <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-1 text-xs text-amber-300">
                        <p className="font-bold flex items-center gap-1.5">
                          <AlertTriangle size={14} />
                          No Active Spotify Device Detected
                        </p>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          To enable remote streaming control from DevSpace, open Spotify on your phone, desktop, or web browser and start playing any song once. Spotify will automatically recognize your device.
                        </p>
                      </div>
                    ) : null}

                    <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-zinc-300 block">Granted Authorization Scopes</span>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.requiredScopes.map((sc, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-black border border-emerald-500/30 text-emerald-400 text-[10px] font-mono rounded">
                            ✓ {sc.scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(6)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <CheckCircle2 size={14} />
                      <span>Done & Close</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Fallback / Generic Provider Steps */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200">Step 1: Developer App & Credentials</h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          To integrate {provider.name}, register an application in the developer portal to obtain API keys or Client credentials.
                        </p>
                      </div>
                      {provider.developerPortalUrl && (
                        <a
                          href={provider.developerPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <span>Portal Link</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-450 text-black font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Step</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                    <h4 className="text-sm font-bold text-zinc-200">Step 2: Redirect URIs</h4>
                    {provider.redirectUri && (
                      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg">
                        <code className="text-xs font-mono text-yellow-300 flex-1 truncate">{provider.redirectUri}</code>
                        <button
                          onClick={copyRedirectUri}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedRedirect ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedRedirect ? 'Copied' : 'Copy URI'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-4 py-2 bg-yellow-500 text-black font-bold text-xs rounded-lg"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-zinc-200">Step 3: Save Provider Credentials</h4>
                    {provider.requiredCredentials.map((req) => (
                      <div key={req.key} className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-300">{req.label}</label>
                        <input
                          type={req.type === 'password' ? 'password' : 'text'}
                          value={credentials[req.key] || ''}
                          onChange={(e) => handleInputChange(req.key, e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 bg-zinc-900 text-zinc-300 text-xs rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        handleSaveAndTest();
                        setCurrentStep(4);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-black font-bold text-xs rounded-lg"
                    >
                      Save & Test
                    </button>
                  </div>
                </div>
              )}

              {currentStep >= 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-2">
                    <h4 className="text-sm font-bold text-zinc-200">Diagnostics</h4>
                    <p className="text-xs text-zinc-400">Status: {diagnostic.status}</p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={onClose}
                      className="px-5 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
