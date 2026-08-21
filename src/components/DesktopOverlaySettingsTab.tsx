import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Sparkles, 
  Bell, 
  Eye, 
  Sliders, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Play, 
  RefreshCw,
  ShieldCheck,
  Power
} from 'lucide-react';
import { isElectron, safeToggleOverlay, safeSetOverlayAlwaysOnTop } from '../lib/electronBridge';

export const DesktopOverlaySettingsTab: React.FC = () => {
  // Load settings from localStorage with sane defaults
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_enabled') !== 'false';
  });
  const [launchOnStartup, setLaunchOnStartup] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_launchOnStartup') !== 'false';
  });
  const [alwaysOnTop, setAlwaysOnTop] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_alwaysOnTop') !== 'false';
  });
  const [autoHide, setAutoHide] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_autoHide') === 'true';
  });
  const [showOnlyActivity, setShowOnlyActivity] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_showOnlyActivity') === 'true';
  });
  const [restoreOnStart, setRestoreOnStart] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_restoreOnStart') !== 'false';
  });
  const [animations, setAnimations] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_animations') !== 'false';
  });
  const [notifications, setNotifications] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_notifications') !== 'false';
  });
  const [aetherSuggestions, setAetherSuggestions] = useState<boolean>(() => {
    return localStorage.getItem('desktopOverlay_aetherSuggestions') !== 'false';
  });

  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const handleToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    key: string,
    val: boolean,
    onApply?: (newVal: boolean) => void
  ) => {
    setter(val);
    localStorage.setItem(key, String(val));
    if (onApply) {
      onApply(val);
    }
    setSavedStatus('Setting applied immediately');
    setTimeout(() => setSavedStatus(null), 2000);
  };

  const handleEnableOverlay = (val: boolean) => {
    handleToggle(setIsEnabled, 'desktopOverlay_enabled', val, (newVal) => {
      localStorage.setItem('devspace_hide_dynamic_island', newVal ? 'false' : 'true');
      window.dispatchEvent(new CustomEvent('devspace:toggle-dynamic-island', { detail: { hidden: !newVal } }));
      safeToggleOverlay(newVal);
    });
  };

  const handleAlwaysOnTop = (val: boolean) => {
    handleToggle(setAlwaysOnTop, 'desktopOverlay_alwaysOnTop', val, (newVal) => {
      safeSetOverlayAlwaysOnTop(newVal);
    });
  };

  const toggleOptions = [
    {
      id: 'enabled',
      title: 'Show Dynamic Island / Top Notch',
      description: 'Display the floating top notch Dynamic Island overlay across your Windows desktop and apps. Toggle on to restore if previously hidden.',
      icon: Monitor,
      color: 'text-amber-400',
      checked: isEnabled,
      onChange: (val: boolean) => handleEnableOverlay(val),
    },
    {
      id: 'launchOnStartup',
      title: 'Launch Overlay on Startup',
      description: 'Automatically start the desktop overlay when your system boots up or DevSpace initializes.',
      icon: Power,
      color: 'text-emerald-400',
      checked: launchOnStartup,
      onChange: (val: boolean) => handleToggle(setLaunchOnStartup, 'desktopOverlay_launchOnStartup', val),
    },
    {
      id: 'alwaysOnTop',
      title: 'Always On Top',
      description: 'Keep the overlay pinned above all fullscreen apps, IDEs, and browser windows.',
      icon: Layers,
      color: 'text-amber-300',
      checked: alwaysOnTop,
      onChange: (val: boolean) => handleAlwaysOnTop(val),
    },
    {
      id: 'autoHide',
      title: 'Auto Hide',
      description: 'Automatically collapse or hide the overlay when inactive to save screen real estate.',
      icon: Eye,
      color: 'text-amber-400',
      checked: autoHide,
      onChange: (val: boolean) => handleToggle(setAutoHide, 'desktopOverlay_autoHide', val),
    },
    {
      id: 'showOnlyActivity',
      title: 'Show Only During Activity',
      description: 'Only present the overlay when background tasks, dreams, or live voice sessions are active.',
      icon: Zap,
      color: 'text-amber-400',
      checked: showOnlyActivity,
      onChange: (val: boolean) => handleToggle(setShowOnlyActivity, 'desktopOverlay_showOnlyActivity', val),
    },
    {
      id: 'restoreOnStart',
      title: 'Restore When DevSpace Starts',
      description: 'Automatically restore previous overlay position and state when opening DevSpace.',
      icon: Play,
      color: 'text-emerald-400',
      checked: restoreOnStart,
      onChange: (val: boolean) => handleToggle(setRestoreOnStart, 'desktopOverlay_restoreOnStart', val),
    },
    {
      id: 'animations',
      title: 'Enable Overlay Animations',
      description: 'Render smooth fluid transitions and status indicators inside the overlay bar.',
      icon: Sliders,
      color: 'text-amber-300',
      checked: animations,
      onChange: (val: boolean) => handleToggle(setAnimations, 'desktopOverlay_animations', val),
    },
    {
      id: 'notifications',
      title: 'Enable Notifications',
      description: 'Display system alerts, mode switch confirmations, and task updates inside the overlay.',
      icon: Bell,
      color: 'text-amber-400',
      checked: notifications,
      onChange: (val: boolean) => handleToggle(setNotifications, 'desktopOverlay_notifications', val),
    },
    {
      id: 'aetherSuggestions',
      title: 'Enable Aether Intelligence Suggestions',
      description: 'Receive proactive project look-aheads, automated dream summaries, and quick action prompts.',
      icon: Sparkles,
      color: 'text-amber-400',
      checked: aetherSuggestions,
      onChange: (val: boolean) => handleToggle(setAetherSuggestions, 'desktopOverlay_aetherSuggestions', val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-zinc-300 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wider flex items-center gap-2">
            <Monitor size={16} className="text-amber-400" /> Desktop Overlay Controls & Customization
          </h3>
          <p className="text-xs text-zinc-400">
            Configure system overlay behavior, window layering, auto-hide rules, and Aether suggestions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedStatus && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 size={11} /> {savedStatus}
            </span>
          )}
          <button
            onClick={() => safeToggleOverlay()}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw size={12} /> Toggle Overlay Now
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-200 font-mono">
              {isElectron() ? 'Electron Native Subsystem Connected' : 'Browser Sandbox Mode Active'}
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">
              {isElectron() 
                ? 'Desktop Overlay runs as a dedicated isolated desktop window with native screen awareness.' 
                : 'Running in web mode — overlay settings will take effect when running inside the DevSpace Desktop client.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border ${isEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
            {isEnabled ? 'OVERLAY ONLINE' : 'OVERLAY DISABLED'}
          </span>
        </div>
      </div>

      {/* Grid of Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {toggleOptions.map((opt) => {
          const IconComp = opt.icon;
          return (
            <div
              key={opt.id}
              onClick={(e) => {
                if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label'))) return;
                opt.onChange(!opt.checked);
              }}
              className={`p-4 border rounded-2xl transition-all cursor-pointer hover:border-amber-400/40 ${
                opt.checked 
                  ? 'border-amber-500/30 bg-zinc-900/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
                  : 'border-white/10 bg-zinc-950/40 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 select-none pr-2">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-2 font-mono">
                    <IconComp size={14} className={opt.color} />
                    {opt.title}
                  </span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5 select-none">
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={(e) => opt.onChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-zinc-950 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400 peer-checked:after:bg-zinc-950"></div>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
