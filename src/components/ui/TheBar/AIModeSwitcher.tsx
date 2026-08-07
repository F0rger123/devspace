import React from 'react';
import { Power, VolumeX, Radio, Target, Mic, Sparkles } from 'lucide-react';
import { AIMode } from './types';
import { useActivityCenter } from '../../../hooks/useActivityCenter';
import { activityCenter } from '../../../lib/activityCenterService';

interface AIModeSwitcherProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
}

const MODES: { mode: AIMode; label: string; icon: React.ReactNode; description: string }[] = [
  { mode: 'Off', label: 'Off', icon: <Power size={11} />, description: 'AI background suspended' },
  { mode: 'Muted', label: 'Muted', icon: <VolumeX size={11} />, description: 'Audio & notifications silenced' },
  { mode: 'Waiting for Keyword', label: 'Waiting for Keyword', icon: <Radio size={11} />, description: 'Listening for wake word trigger' },
  { mode: 'Context Mode', label: 'Context Mode', icon: <Target size={11} />, description: 'Screen & drawing context active' },
  { mode: 'Open / Always Listening', label: 'Open / Always Listening', icon: <Mic size={11} />, description: 'Continuous open mic input' },
  { mode: 'Full Aether', label: 'Full Aether', icon: <Sparkles size={11} />, description: 'Unrestricted neural intelligence' },
];

export const AIModeSwitcher: React.FC<AIModeSwitcherProps> = ({ currentMode, onSelectMode }) => {
  const { updateConfig } = useActivityCenter();

  const handleModeChange = (mode: AIMode) => {
    onSelectMode(mode);

    // Persist mode choice
    if (typeof window !== 'undefined') {
      localStorage.setItem('devspace_active_aether_mode', mode);
    }

    switch (mode) {
      case 'Off':
        updateConfig({ dreamFrequency: 'disabled', offlineSyncFrequency: 'manual' });
        activityCenter.addNotification({
          title: 'Aether Engine Off',
          message: 'All background AI intelligence suspended.',
          type: 'warning',
          category: 'ai',
        });
        break;

      case 'Muted':
        updateConfig({ soundEnabled: false, desktopNotifications: true });
        activityCenter.addNotification({
          title: 'Aether Muted',
          message: 'Audio playback & chime feedback silenced.',
          type: 'warning',
          category: 'ai',
        });
        break;

      case 'Waiting for Keyword':
        activityCenter.addNotification({
          title: 'Waiting for Keyword',
          message: 'Wake-word detection armed in background.',
          type: 'info',
          category: 'voice',
        });
        break;

      case 'Context Mode':
        activityCenter.addNotification({
          title: 'Context Mode Active',
          message: 'Active window and spatial drawing context attached.',
          type: 'info',
          category: 'ai',
        });
        break;

      case 'Open / Always Listening':
        window.dispatchEvent(new CustomEvent('devspace:voice-activate'));
        activityCenter.addNotification({
          title: 'Open Mic Active',
          message: 'Continuous voice stream online.',
          type: 'info',
          category: 'voice',
        });
        break;

      case 'Full Aether':
        updateConfig({ dreamFrequency: 'aggressive' });
        activityCenter.addNotification({
          title: 'Full Aether Intelligence Active',
          message: 'Full-spectrum neural reasoning and workspace awareness online.',
          type: 'info',
          category: 'ai',
        });
        break;
    }
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-full py-0.5">
      {MODES.map(({ mode, label, icon }) => {
        const isActive = currentMode === mode;
        return (
          <button
            key={mode}
            onClick={() => handleModeChange(mode)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              isActive
                ? 'bg-amber-400 text-zinc-950 shadow-sm font-extrabold border border-amber-300 ring-1 ring-amber-400/50'
                : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 hover:border-white/20'
            }`}
          >
            <span className={isActive ? 'text-zinc-950' : 'text-amber-400'}>{icon}</span>
            <span>{label}</span>
            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />}
          </button>
        );
      })}
    </div>
  );
};
