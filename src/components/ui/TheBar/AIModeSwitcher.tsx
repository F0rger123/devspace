import React from 'react';
import { Sparkles, Mic, VolumeX, ShieldCheck, Code2, Moon, Activity, Power } from 'lucide-react';
import { AIMode } from './types';
import { useActivityCenter } from '../../../hooks/useActivityCenter';
import { aetherIntelligence } from '../../../lib/aetherIntelligenceService';
import { activityCenter } from '../../../lib/activityCenterService';

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

    switch (mode) {
      case 'Dream Mode':
        updateConfig({ dreamFrequency: 'aggressive' });
        aetherIntelligence.generateDream('DevSpace Desktop');
        activityCenter.addNotification({
          title: 'Dream Mode Engaged',
          message: 'Autonomous neural optimization runs initiated for active project.',
          type: 'info',
          category: 'dream',
        });
        break;

      case 'Voice':
        window.dispatchEvent(new CustomEvent('devspace:voice-activate'));
        activityCenter.addNotification({
          title: 'Voice Assistant Active',
          message: 'Listening for voice commands and audio inputs.',
          type: 'info',
          category: 'voice',
        });
        break;

      case 'Aether Intelligence':
        aetherIntelligence.analyzeContext('DevSpace Desktop');
        activityCenter.addNotification({
          title: 'Aether Engine Active',
          message: 'Deep workspace and native desktop awareness online.',
          type: 'info',
          category: 'ai',
        });
        break;

      case 'Muted':
        updateConfig({ soundEnabled: false, desktopNotifications: true });
        activityCenter.addNotification({
          title: 'Audio Output Muted',
          message: 'Sound effects and audio voice feedback silenced.',
          type: 'warning',
        });
        break;

      case 'Silent':
        updateConfig({ soundEnabled: false, desktopNotifications: false });
        activityCenter.addNotification({
          title: 'Silent Mode Active',
          message: 'Desktop notifications and audio popups suspended.',
          type: 'warning',
        });
        break;

      case 'Developer':
        updateConfig({ displayMode: 'developer' });
        activityCenter.addNotification({
          title: 'Developer Diagnostics On',
          message: 'Showing verbose IPC telemetry and AST metrics.',
          type: 'info',
        });
        break;

      case 'Off':
        updateConfig({ dreamFrequency: 'disabled', offlineSyncFrequency: 'manual' });
        activityCenter.addNotification({
          title: 'AI Services Suspended',
          message: 'Background AI and neural dream sweeps paused.',
          type: 'warning',
        });
        break;

      default:
        updateConfig({ soundEnabled: true, desktopNotifications: true, dreamFrequency: 'adaptive' });
        activityCenter.addNotification({
          title: 'Standard AI Assistant Active',
          message: 'Gemini AI assistant operational.',
          type: 'info',
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
            className={`px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              isActive
                ? 'bg-cyan-400 text-slate-950 shadow-xs font-extrabold border border-cyan-300'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
};
