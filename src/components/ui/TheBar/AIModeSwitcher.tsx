import React from 'react';
import { Power, Radio, Target, Mic, Monitor, ShieldAlert } from 'lucide-react';
import { AIMode } from './types';
import { useActivityCenter } from '../../../hooks/useActivityCenter';
import { activityCenter } from '../../../lib/activityCenterService';

interface AIModeSwitcherProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
}

const MODES: { mode: AIMode; label: string; icon: React.ReactNode; description: string }[] = [
  { mode: 'OFF', label: 'OFF', icon: <Power size={11} />, description: 'Nothing running' },
  { mode: 'WAITING FOR KEYWORD', label: 'WAITING FOR KEYWORD', icon: <Radio size={11} />, description: 'Listens only for "Hey Aether"' },
  { mode: 'CONTEXT', label: 'CONTEXT', icon: <Target size={11} />, description: 'Reads workspace & answers questions' },
  { mode: 'LISTENING', label: 'LISTENING', icon: <Mic size={11} />, description: 'Continuous open mic conversation' },
  { mode: 'ALWAYS ON', label: 'ALWAYS ON', icon: <Monitor size={11} />, description: 'Works across desktop overlay' },
  { mode: 'FOCUS', label: 'FOCUS', icon: <ShieldAlert size={11} />, description: 'Only interrupts for important events' },
];

export const AIModeSwitcher: React.FC<AIModeSwitcherProps> = ({ currentMode, onSelectMode }) => {
  const { updateConfig } = useActivityCenter();

  const handleModeChange = (mode: AIMode) => {
    onSelectMode(mode);

    if (typeof window !== 'undefined') {
      localStorage.setItem('devspace_active_aether_mode', mode);
      window.dispatchEvent(new CustomEvent('devspace:aether-voice-mode-changed', { detail: { mode } }));
    }

    switch (mode) {
      case 'OFF':
        updateConfig({ dreamFrequency: 'disabled', soundEnabled: false });
        activityCenter.addNotification({
          title: 'Aether Engine OFF',
          message: 'All background voice & AI tasks completely suspended.',
          type: 'warning',
          category: 'ai',
          summary: 'Aether Disables',
          reason: 'WHY: Developer toggled OFF mode.',
        });
        break;

      case 'WAITING FOR KEYWORD':
        updateConfig({ soundEnabled: true });
        activityCenter.addNotification({
          title: 'Wake-Word Mode Active',
          message: 'Listening specifically for "Hey Aether"...',
          type: 'info',
          category: 'voice',
          summary: 'Wake-Word Listening',
          reason: 'WHY: Armed keyword listener.',
          suggestedAction: 'Say "Hey Aether" to issue voice commands.',
        });
        break;

      case 'CONTEXT':
        activityCenter.addNotification({
          title: 'Context Mode Active',
          message: 'Reading active workspace context to answer questions without proactive speech.',
          type: 'info',
          category: 'ai',
          summary: 'Workspace Context Active',
          reason: 'WHY: Silent context reader ready.',
        });
        break;

      case 'LISTENING':
        window.dispatchEvent(new CustomEvent('devspace:voice-activate'));
        activityCenter.addNotification({
          title: 'Continuous Voice Stream Active',
          message: 'Open conversation microphone running while DevSpace is open.',
          type: 'info',
          category: 'voice',
          summary: 'Open Mic Active',
          reason: 'WHY: Developer enabled continuous conversation.',
        });
        break;

      case 'ALWAYS ON':
        activityCenter.addNotification({
          title: 'Always On Desktop Mode',
          message: 'Aether operating across all desktop monitors & active windows.',
          type: 'info',
          category: 'ai',
          summary: 'Desktop Companion Online',
          reason: 'WHY: Multi-monitor IPC awareness enabled.',
        });
        break;

      case 'FOCUS':
        updateConfig({ soundEnabled: false });
        activityCenter.addNotification({
          title: 'Focus Quiet Mode Active',
          message: 'Non-critical alerts silenced. Only high-priority events will interrupt.',
          type: 'warning',
          category: 'ai',
          summary: 'Focus Quiet Mode',
          reason: 'WHY: Minimizing developer cognitive interrupts.',
        });
        break;
    }
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar max-w-full py-0.5">
      {MODES.map(({ mode, label, icon, description }) => {
        const isActive = currentMode === mode;
        return (
          <button
            key={mode}
            title={description}
            onClick={() => handleModeChange(mode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[10px] whitespace-nowrap transition border ${
              isActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold shadow-sm'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
