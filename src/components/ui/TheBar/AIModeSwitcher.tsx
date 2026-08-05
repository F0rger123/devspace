import React from 'react';
import { Sparkles, Mic, VolumeX, ShieldCheck, Code2, Moon, Activity, Power } from 'lucide-react';
import { AIMode } from './types';
import { useActivityCenter } from '../../../hooks/useActivityCenter';

interface AIModeSwitcherProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
}

const MODES: { mode: AIMode; label: string; icon: React.ReactNode; description: string }[] = [
  { mode: 'AI', label: 'AI', icon: <Sparkles size={11} />, description: 'Full AI companion assistance' },
  { mode: 'Dream Mode', label: 'Dream Mode', icon: <Activity size={11} />, description: 'Autonomous background refactoring' },
  { mode: 'Voice', label: 'Voice', icon: <Mic size={11} />, description: 'Voice memo listening & synthesis' },
  { mode: 'Aether Intelligence', label: 'Aether', icon: <ShieldCheck size={11} />, description: 'Deep workspace & desktop reasoning engine' },
  { mode: 'Muted', label: 'Muted', icon: <VolumeX size={11} />, description: 'Audio output silenced' },
  { mode: 'Silent', label: 'Silent', icon: <Moon size={11} />, description: 'No notifications or popups' },
  { mode: 'Developer', label: 'Developer', icon: <Code2 size={11} />, description: 'Verbose AST & runtime diagnostics' },
  { mode: 'Off', label: 'Off', icon: <Power size={11} />, description: 'Background AI suspended' },
];

export const AIModeSwitcher: React.FC<AIModeSwitcherProps> = ({ currentMode, onSelectMode }) => {
  const { updateConfig } = useActivityCenter();

  const handleModeChange = (mode: AIMode) => {
    onSelectMode(mode);
    
    // Propagate mode to activity center service to alter real behavior
    if (mode === 'Muted' || mode === 'Silent') {
      updateConfig({ soundEnabled: false, desktopNotifications: mode !== 'Silent' });
    } else if (mode === 'Dream Mode') {
      updateConfig({ dreamFrequency: 'aggressive', soundEnabled: true });
    } else if (mode === 'Voice') {
      updateConfig({ soundEnabled: true });
      // Trigger voice modal event if available
      window.dispatchEvent(new CustomEvent('devspace:voice-activate'));
    } else if (mode === 'Off') {
      updateConfig({ dreamFrequency: 'disabled', offlineSyncFrequency: 'manual' });
    } else {
      updateConfig({ soundEnabled: true, desktopNotifications: true, dreamFrequency: 'adaptive' });
    }
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-full py-0.5">
      {MODES.map(({ mode, label }) => {
        const isActive = currentMode === mode;
        return (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              isActive
                ? 'bg-yellow-500 text-black shadow-xs font-extrabold'
                : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
