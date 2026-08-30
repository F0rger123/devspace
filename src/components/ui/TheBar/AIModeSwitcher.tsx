import React from 'react';
import { Power, Radio, Target, Mic, ChevronRight } from 'lucide-react';
import { AIMode } from './types';
import { useActivityCenter } from '../../../hooks/useActivityCenter';
import { activityCenter } from '../../../lib/activityCenterService';
import {
  aetherVoiceEngine,
  AetherVoiceMode,
  AETHER_MODE_LABELS,
} from '../../../lib/aetherVoiceStateEngine';

interface AIModeSwitcherProps {
  currentMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
}

interface ModeConfig {
  mode: AetherVoiceMode;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  activeColor: string;
  borderColor: string;
  textColor: string;
  pulseDotColor: string;
  description: string;
}

const MODE_CONFIGS: Record<AetherVoiceMode, ModeConfig> = {
  off: {
    mode: 'off',
    label: 'Off',
    shortLabel: 'OFF',
    icon: <Power size={12} />,
    activeColor: 'bg-zinc-800/80 hover:bg-zinc-800',
    borderColor: 'border-zinc-700/60 hover:border-zinc-500/80',
    textColor: 'text-zinc-400 group-hover:text-zinc-200',
    pulseDotColor: 'bg-zinc-500',
    description: 'All microphone & background listeners suspended. Click to cycle modes.',
  },
  wake_word: {
    mode: 'wake_word',
    label: 'Waiting for Keyword',
    shortLabel: 'WAKE-WORD',
    icon: <Radio size={12} />,
    activeColor: 'bg-amber-500/15 hover:bg-amber-500/25',
    borderColor: 'border-amber-500/40 hover:border-amber-500/60',
    textColor: 'text-amber-300',
    pulseDotColor: 'bg-amber-400 animate-pulse',
    description: 'Listening in background for "Hey Aether". Click to cycle modes.',
  },
  listening: {
    mode: 'listening',
    label: 'Listening / Aether On',
    shortLabel: 'LISTENING',
    icon: <Mic size={12} />,
    activeColor: 'bg-emerald-500/20 hover:bg-emerald-500/30',
    borderColor: 'border-emerald-500/45 hover:border-emerald-500/70',
    textColor: 'text-emerald-300',
    pulseDotColor: 'bg-emerald-400 animate-ping',
    description: 'Open conversation microphone active. Click to cycle modes.',
  },
  context: {
    mode: 'context',
    label: 'Context Mode',
    shortLabel: 'CONTEXT',
    icon: <Target size={12} />,
    activeColor: 'bg-cyan-500/15 hover:bg-cyan-500/25',
    borderColor: 'border-cyan-500/40 hover:border-cyan-500/60',
    textColor: 'text-cyan-300',
    pulseDotColor: 'bg-cyan-400',
    description: 'Analyzing active project context to answer questions. Click to turn off.',
  },
};

export const AIModeSwitcher: React.FC<AIModeSwitcherProps> = ({ currentMode, onSelectMode }) => {
  const { updateConfig } = useActivityCenter();

  // Normalize currentMode to 4 canonical modes
  const canonicalMode = aetherVoiceEngine.migrateMode(currentMode);
  const currentConfig = MODE_CONFIGS[canonicalMode] || MODE_CONFIGS.off;

  const handleCycleMode = () => {
    const nextMode = aetherVoiceEngine.cycleNextMode();
    onSelectMode(nextMode);

    switch (nextMode) {
      case 'off':
        updateConfig({ soundEnabled: false });
        activityCenter.addNotification({
          title: 'Aether Disabled',
          message: 'All background voice & AI tasks completely suspended.',
          type: 'warning',
          category: 'ai',
          summary: 'Aether OFF',
          reason: 'WHY: Developer cycled to OFF mode.',
        });
        break;

      case 'wake_word':
        updateConfig({ soundEnabled: true });
        activityCenter.addNotification({
          title: 'Wake-Word Mode Active',
          message: 'Listening specifically for "Hey Aether"...',
          type: 'info',
          category: 'voice',
          summary: 'Wake-Word Armed',
          reason: 'WHY: Developer armed keyword listener.',
          suggestedAction: 'Say "Hey Aether" to begin conversation.',
        });
        break;

      case 'listening':
        updateConfig({ soundEnabled: true });
        window.dispatchEvent(new CustomEvent('devspace:voice-activate'));
        activityCenter.addNotification({
          title: 'Continuous Voice Active',
          message: 'Open conversation microphone active.',
          type: 'info',
          category: 'voice',
          summary: 'Open Mic Active',
          reason: 'WHY: Developer enabled continuous conversation.',
        });
        break;

      case 'context':
        activityCenter.addNotification({
          title: 'Context Mode Active',
          message: 'Reading active workspace context to answer questions.',
          type: 'info',
          category: 'ai',
          summary: 'Workspace Context Active',
          reason: 'WHY: Silent context reader ready.',
        });
        break;
    }
  };

  const nextMode = aetherVoiceEngine.getNextMode();
  const nextConfig = MODE_CONFIGS[nextMode];

  return (
    <button
      type="button"
      onClick={handleCycleMode}
      title={`${currentConfig.description} Next: ${nextConfig.label}`}
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-150 cursor-pointer select-none font-mono text-[11px] font-bold shadow-xs ${currentConfig.activeColor} ${currentConfig.borderColor} ${currentConfig.textColor}`}
    >
      {/* Indicator dot */}
      <span className="relative flex h-2 w-2">
        <span className={`relative inline-flex rounded-full h-2 w-2 ${currentConfig.pulseDotColor}`} />
      </span>

      {/* Mode icon */}
      <span className="shrink-0">{currentConfig.icon}</span>

      {/* Mode Label */}
      <span className="tracking-tight whitespace-nowrap">{currentConfig.label}</span>

      {/* Cycle cue arrow */}
      <ChevronRight
        size={11}
        className="opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-zinc-400"
      />
    </button>
  );
};
