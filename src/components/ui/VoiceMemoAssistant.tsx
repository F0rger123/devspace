import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff,
  Sparkles, 
  X, 
  Bot, 
  Send, 
  Keyboard, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  FileText, 
  CheckSquare, 
  Lightbulb, 
  Play, 
  Volume2, 
  VolumeX, 
  Square, 
  Trash2,
  BrainCircuit,
  MessageSquare,
  Zap,
  Globe,
  Plus,
  Minimize2,
  Maximize2,
  Video,
  Target,
  MousePointerClick,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { aetherConversationalEngine } from '../../lib/aetherConversationalEngine';
import { aetherVoiceRegistry } from '../../lib/aetherVoiceRegistry';
import { aetherDesktopIntelligence } from '../../lib/aetherDesktopIntelligence';
import { aetherInstanceEngine } from '../../lib/aetherInstanceEngine';
import { evaluateRoutingFirewall } from '../../lib/aetherRoutingGuard';
import { getResolvedAetherPersonality, formatResponseWithPersonality } from '../../lib/aetherPersonalityResolver';
import { haptic } from '../../utils/haptics';
import { WakeCanvasVisualizer } from './WakeCanvasVisualizer';
import { aetherThreadStorage } from '../../lib/aetherThreadStorage';
import { AetherErrorBoundary } from './AetherErrorBoundary';

function extractExplanationFromPartialJson(partialJson: string): string {
  // Try to find completed explanation block
  const match = partialJson.match(/"explanation"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (match) {
    try {
      return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    } catch (e) {
      return match[1];
    }
  }
  // Try to find open explanation block streaming to the end of string
  const openMatch = partialJson.match(/"explanation"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)$/);
  if (openMatch) {
    try {
      return openMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    } catch (e) {
      return openMatch[1];
    }
  }
  // Fallback: in case the JSON is nested or fields are different
  try {
    const parsed = JSON.parse(partialJson + '}');
    if (parsed.explanation) return parsed.explanation;
  } catch (e) {}
  return "";
}

function extractTranscriptFromPartialJson(partialJson: string): string {
  const match = partialJson.match(/"transcript"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (match) {
    try {
      return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    } catch (e) {
      return match[1];
    }
  }
  const openMatch = partialJson.match(/"transcript"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)$/);
  if (openMatch) {
    try {
      return openMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    } catch (e) {
      return openMatch[1];
    }
  }
  return "";
}

function extractIntentFromPartialJson(partialJson: string): string {
  const match = partialJson.match(/"intent"\s*:\s*"([^"\\]*)"/);
  if (match) {
    return match[1];
  }
  return "";
}

function areSessionsEqual(a: any[] | null | undefined, b: any[] | null | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const sa = a[i];
    const sb = b[i];
    if (!sa || !sb) return sa === sb;
    if (sa.id !== sb.id) return false;
    if (sa.title !== sb.title) return false;
    const ma = sa.messages || [];
    const mb = sb.messages || [];
    if (ma.length !== mb.length) return false;
    for (let j = 0; j < ma.length; j++) {
      const msgA = ma[j];
      const msgB = mb[j];
      if (!msgA || !msgB) return msgA === msgB;
      if (msgA.id !== msgB.id) return false;
      if (msgA.role !== msgB.role) return false;
      if (msgA.content !== msgB.content) return false;
    }
  }
  return true;
}

function areConvoHistoriesEqual(a: any[] | null | undefined, b: any[] | null | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ha = a[i];
    const hb = b[i];
    if (!ha || !hb) return ha === hb;
    if (ha.role !== hb.role) return false;
    if (ha.text !== hb.text) return false;
  }
  return true;
}

const applyVocalDictionary = (text: string, dict: Array<{ from: string, to: string }> | undefined) => {
  if (!text) return text;
  let corrected = text;
  const activeDict = dict || (() => {
    try {
      const stored = localStorage.getItem('app_vocal_dictionary');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  })();
  
  if (Array.isArray(activeDict)) {
    for (const item of activeDict) {
      if (item.from && item.to) {
        const regex = new RegExp(`\\b${item.from.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
        corrected = corrected.replace(regex, item.to);
      }
    }
  }
  return corrected;
};

const extractNewProjectNameFromDecline = (command: string): string | null => {
  const lower = command.toLowerCase().trim();
  
  // Look for patterns like "no, it was spelled xxx", "no, i meant xxx", "no, make it xxx", "no, named xxx"
  const patterns = [
    /no,?\s+it\s+was\s+spelled\s+(.+)/i,
    /no,?\s+it's\s+spelled\s+(.+)/i,
    /no,?\s+its\s+spelled\s+(.+)/i,
    /no,?\s+i\s+meant\s+(.+)/i,
    /no,?\s+make\s+it\s+(.+)/i,
    /no,?\s+named\s+(.+)/i,
    /no,?\s+name\s+it\s+(.+)/i,
    /no,?\s+create\s+(.+)/i,
    /no,?\s+(.+)/i
  ];
  
  for (const regex of patterns) {
    const match = command.match(regex);
    if (match && match[1]) {
      let extracted = match[1].trim();
      extracted = extracted.replace(/[.?!"']+$/, '').trim();
      if (extracted.length > 0) {
        return extracted.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }
  return null;
};

const getContextFollowUp = (path: string, projectName?: string): { feedback: string, actionName: string } => {
  const cleanPath = path.split('?')[0];
  switch (cleanPath) {
    case '/projects':
      if (projectName) {
        return {
          feedback: `I have opened the project "${projectName}" for you. Now that we are inside this project, can I help you brainstorm some ideas, write a note, or create an issue?`,
          actionName: `🧭 Activated Project: ${projectName}`
        };
      } else {
        return {
          feedback: "Hey, what do you want me to do? Do you want to go into a specific project, or create a new one?",
          actionName: "🧭 Activated Projects Center"
        };
      }
    case '/issues':
      return {
        feedback: "Opening your Backlog Issues board. Do you want me to mark issues as resolved, or do you want me to add a new issue?",
        actionName: "🧭 Activated Backlog Issues Board"
      };
    case '/notes':
      return {
        feedback: "Opening your Obsidian Developer Logbooks. Do you want me to add a new note or edit a different note?",
        actionName: "🧭 Activated Notes Workspace"
      };
    case '/sandbox-loop':
      return {
        feedback: "Opening your Sandbox Loop editor. Do you want me to run the latest sandbox code, or do you want to write a new live script?",
        actionName: "🧭 Activated Sandbox Loop"
      };
    case '/agents':
      return {
        feedback: "Opening your GenTIC OS Sandbox workspace. Do you want me to spawn a new sub-agent, configure an existing agent's prompt, or run a test in the Agentic OS workspace?",
        actionName: "🧭 Activated Agentic OS Sandbox"
      };
    case '/automations':
      return {
        feedback: "Opening your Automations Control Panel. Do you want me to add a new recurring automation, or inspect the active queue?",
        actionName: "🧭 Activated Automations Control"
      };
    case '/brain':
      return {
        feedback: "Opening your Memory Cortex Brain Map. Do you want me to query our memory store, add a custom system rule, or visualize the synapses?",
        actionName: "🧭 Activated Brain Map"
      };
    case '/ideas':
      return {
        feedback: "Opening your Idea Expansion Center. Do you want me to generate a new feature brainstorm, expand an existing concept, or pitch a new project idea?",
        actionName: "🧭 Activated Idea Planner"
      };
    case '/assets':
      return {
        feedback: "Opening your Digital Asset Repository. Do you want me to look up specific files, upload a new asset, or generate a mockup image?",
        actionName: "🧭 Activated Assets Center"
      };
    case '/roadmap':
      return {
        feedback: "Opening your Product Roadmap Timeline. Do you want to add a new roadmap milestone, or update the release timeline?",
        actionName: "🧭 Activated Roadmap Timeline"
      };
    case '/docs':
      return {
        feedback: "Opening your Workspace Docs Center. Do you want to search the workspace documentation, or write a new developer doc?",
        actionName: "🧭 Activated Workspace Docs"
      };
    case '/settings':
      return {
        feedback: "Opening your Aether Vocal Preferences. Do you want me to test the microphone connection, check the wake-word engine, or change your spatial cursor sensitivity?",
        actionName: "🧭 Activated Vocal Preferences"
      };
    default:
      return {
        feedback: "I've taken you here. What would you like us to work on?",
        actionName: "🧭 Navigated"
      };
  }
};

export function VoiceMemoAssistant() {
  const { 
    isRightSidebarOpen, 
    toggleRightSidebar,
    circledContexts,
    clearCircledContexts,
    isDrawingModeActive,
    setDrawingModeActive
  } = useStore();
  
  const {
    projects,
    addProject,
    updateProject,
    issues,
    addIssue,
    updateIssue,
    deleteIssue,
    notes,
    addNote,
    cortexSynapses,
    setCortexSynapses,
    activeProjectId,
    setActiveProjectId,
    addVoiceAction,
    setAgents,
    startProjectDreaming,
    voiceTriggers,
    wakeWord,
    isWakeWordEnabled,
    setIsWakeWordEnabled,
    vocalDiagnostics,
    addVocalDiagnostic,
    trainedWakeWordModel,
    selectedVoiceName,
    speechPitch,
    speechRate,
    activationShortcutKey,
    setActivationShortcutKey,
    activationShortcutMouse,
    setActivationShortcutMouse,
    stopShortcutKey,
    setStopShortcutKey,
    stopShortcutMouse,
    setStopShortcutMouse,
    micShortcutKey,
    micShortcutMouse,
    clearShortcutKey,
    clearShortcutMouse,
    muteVoiceShortcutKey,
    muteVoiceShortcutMouse,
    navProjectsShortcutKey,
    navProjectsShortcutMouse,
    navNotesShortcutKey,
    navNotesShortcutMouse,
    navRoadmapShortcutKey,
    navRoadmapShortcutMouse,
    isAssistantMinimized,
    setIsAssistantMinimized,
    isAssistantOpen,
    setIsAssistantOpen,
    showToast,
    vocalDictionary,
    aetherPersonalityRules,
    setAetherPersonalityRules,
    aiContextRules
  } = useData();

  const location = useLocation();
  const navigate = useNavigate();
  const isAssistantRoute = location.pathname === '/assistant';

  // Floating Hub Toggle Expanded State
  const [isHubOpen, setIsHubOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aether-hub-open');
      if (saved === null) return true;
      return saved === 'true';
    }
    return false;
  });
  
  useEffect(() => {
    if (isAssistantOpen !== isHubOpen) {
      setIsAssistantOpen(isHubOpen);
    }
    localStorage.setItem('aether-hub-open', String(isHubOpen));
    window.dispatchEvent(new Event('aether-hub-open-sync'));
  }, [isHubOpen, isAssistantOpen, setIsAssistantOpen]);

  // Voice-Activated Custom Macro Creator Wizard State
  const handleCloseAssistantRef = useRef<() => void>(() => {});
  const [voiceMacroStep, setVoiceMacroStep] = useState<'idle' | 'naming' | 'motion' | 'confirm'>('idle');
  const [voiceMacroName, setVoiceMacroName] = useState('');
  const [voiceMacroAction, setVoiceMacroAction] = useState('toggle-sidebar');
  const [voiceMacroPoints, setVoiceMacroPoints] = useState<{ x: number; y: number }[]>([]);
  const [voiceMacroContradiction, setVoiceMacroContradiction] = useState<string | null>(null);
  const [isRecordingVoiceMacroPath, setIsRecordingVoiceMacroPath] = useState(false);
  const [trainingCountdown, setTrainingCountdown] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState(0);

  useEffect(() => {
    const handleLogoToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { open, mute } = customEvent.detail;
      if (open) {
        setIsHubOpen(true);
        if (mute === false) {
          toggleAetherMutedState(false);
        }
      } else {
        if (handleCloseAssistantRef.current) {
          handleCloseAssistantRef.current();
        } else {
          setIsHubOpen(false);
        }
        if (mute === true) {
          toggleAetherMutedState(true);
        }
      }
    };
    window.addEventListener('aether-logo-toggle', handleLogoToggle);
    return () => {
      window.removeEventListener('aether-logo-toggle', handleLogoToggle);
    };
  }, []);
  const [isUltraCompact, setIsUltraCompact] = useState(false);
  const [hudTab, setHudTab] = useState<'speak' | 'notepad'>('speak');
  const [mobilePanel, setMobilePanel] = useState<'control' | 'summary'>('control');
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [isMicPermissionBlocked, setIsMicPermissionBlocked] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAetherMuted, setIsAetherMuted] = useState<boolean>(() => localStorage.getItem('isAetherMuted') === 'true');
  const [showMutePopover, setShowMutePopover] = useState(false);

  const isMicPermissionBlockedRef = useRef(isMicPermissionBlocked);
  const isUserSpeakingRef = useRef(isUserSpeaking);

  useEffect(() => { isMicPermissionBlockedRef.current = isMicPermissionBlocked; }, [isMicPermissionBlocked]);
  useEffect(() => { isUserSpeakingRef.current = isUserSpeaking; }, [isUserSpeaking]);

  const isAetherMutedRef = useRef(isAetherMuted);
  useEffect(() => { isAetherMutedRef.current = isAetherMuted; }, [isAetherMuted]);

  // Sync isAetherMuted state with other components
  useEffect(() => {
    const handleSync = () => {
      const muted = localStorage.getItem('isAetherMuted') === 'true';
      if (isAetherMutedRef.current !== muted) {
        setIsAetherMuted(muted);
        setVoicePlayback(!muted);
        if (muted) {
          try {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
          } catch (e) {}
          setIsSpeechActive(false);
          if (backgroundRecogRef.current) {
            try {
              backgroundRecogRef.current.onend = null;
              backgroundRecogRef.current.stop();
            } catch (err) {}
            backgroundRecogRef.current = null;
            setIsWakeWordListening(false);
          }
        } else {
          setTimeout(() => {
            startBackgroundWakeWord();
          }, 100);
        }
      }
    };
    window.addEventListener('aether-mute-sync', handleSync);
    return () => window.removeEventListener('aether-mute-sync', handleSync);
  }, []);

  const toggleAetherMutedState = (mute: boolean) => {
    setIsAetherMuted(mute);
    localStorage.setItem('isAetherMuted', String(mute));
    window.dispatchEvent(new Event('aether-mute-sync'));
    addVocalDiagnostic(mute ? "MUTED: Aether voice listening suspended." : "UNMUTED: Aether background voice listening resumed.");
    if (mute) {
      if (backgroundRecogRef.current) {
        try {
          backgroundRecogRef.current.onend = null;
          backgroundRecogRef.current.stop();
        } catch (err) {}
        backgroundRecogRef.current = null;
        setIsWakeWordListening(false);
      }
      if (activeRecogRef.current) {
        try {
          activeRecogRef.current.onend = null;
          activeRecogRef.current.stop();
        } catch (err) {}
        activeRecogRef.current = null;
        setIsListeningForSpeech(false);
      }
    } else {
      if (isHubOpenRef.current) {
        setTimeout(() => {
          startContinuousConversationalListen();
        }, 100);
      } else {
        setTimeout(() => {
          startBackgroundWakeWord();
        }, 100);
      }
    }
  };

  // Input states
  const [typedCommand, setTypedCommand] = useState('');
  const [scratchpadText, setScratchpadText] = useState(() => {
    try {
      return localStorage.getItem('aether_scratchpad_text') || '';
    } catch (e) {
      return '';
    }
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Deep back-and-forth conversation memory state
  const [convoHistory, setConvoHistory] = useState<{ role: 'user' | 'model'; text: string }[]>(() => {
    try {
      const activeSessionId = localStorage.getItem('aether_current_session_id') || 'session-default';
      const savedSessions = localStorage.getItem('aether_chat_sessions');
      if (activeSessionId && savedSessions) {
        const sessions = JSON.parse(savedSessions);
        const activeSess = sessions.find((s: any) => s.id === activeSessionId);
        if (activeSess && activeSess.messages) {
          return activeSess.messages.map((m: any) => ({
            role: m.role === 'assistant' || m.role === 'agent' ? 'model' as const : 'user' as const,
            text: m.content
          }));
        }
      }
      const saved = localStorage.getItem('aether_convo_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [pendingNote, setPendingNote] = useState<string | null>(null);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [sessionItems, setSessionItems] = useState<{ id: string; type: 'note' | 'task' | 'brainstorm' | 'synapse'; title: string; content: string; saved: boolean; isSuggested?: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem('aether_session_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any | null>(null);

  // Audio spectrum refs for animation
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [frequencyBuffer, setFrequencyBuffer] = useState<number[]>(Array(16).fill(4));

  // Background Wake Word Detection States and Refs
  const backgroundRecogRef = useRef<any>(null);
  const speakActiveRef = useRef<boolean>(false);
  const isWakeWordTriggeringRef = useRef<boolean>(false);
  const activeSpeechTextRef = useRef<string>('');
  const [isVoiceDetectedInBg, setIsVoiceDetectedInBg] = useState(false);

  // Play synthetic audio chime helpers with throttling to prevent doubling/overlapping
  const lastActivationChimeTimeRef = useRef<number>(0);
  const lastDeactivationChimeTimeRef = useRef<number>(0);



  const playActivationChime = () => {
    try {
      const now = Date.now();
      if (now - lastActivationChimeTimeRef.current < 1500) {
        console.log("Throttling activation chime play to prevent doubling.");
        return;
      }
      lastActivationChimeTimeRef.current = now;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // Elegant D5 chime note
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.40);
    } catch (e) {
      console.warn("Could not play activation chime", e);
    }
  };

  const playDeactivationChime = () => {
    try {
      const now = Date.now();
      if (now - lastDeactivationChimeTimeRef.current < 1500) {
        return;
      }
      lastDeactivationChimeTimeRef.current = now;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(392.00, ctx.currentTime); // G4 note
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.32);
    } catch (e) {
      console.warn("Could not play deactivation chime", e);
    }
  };

  // Hands-free continuous interaction states
  const [isConversing, setIsConversing] = useState(true); // Default to on for seamless hands-free conversational loops
  const [isListeningForSpeech, setIsListeningForSpeech] = useState(false);
  const [speechTransitText, setSpeechTransitText] = useState('');
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [isPowerSaving, setIsPowerSaving] = useState(true);

  // Power-saving state controller: enters power-saving standby mode after 4 seconds of silence
  useEffect(() => {
    const isAnyActive = 
      isRecording || 
      isProcessing || 
      isUserSpeaking || 
      isSpeechActive || 
      isVoiceDetectedInBg || 
      (speechTransitText && speechTransitText.trim().length > 0);

    if (isAnyActive) {
      setIsPowerSaving(false);
    } else {
      const timer = setTimeout(() => {
        setIsPowerSaving(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isRecording, isProcessing, isUserSpeaking, isSpeechActive, isVoiceDetectedInBg, speechTransitText]);

  const [wakeWordTriggerTime, setWakeWordTriggerTime] = useState<number>(0);
  const [proposedAction, setProposedAction] = useState<{
    id: string;
    intent: string;
    parsedData: any;
    explanation: string;
    transcript: string;
    actionDisplay: string;
  } | null>(null);
  const [pendingProjectClarification, setPendingProjectClarification] = useState<any | null>(null);
  const activeRecogRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Result display feedback
  const [aetherFeedback, setAetherFeedback] = useState<{
    transcript?: string;
    explanation?: string;
    intent?: string;
    triggeredAction?: string;
    error?: string;
  } | null>(null);

  // Sync feedback to Zustand store for subtitle rendering in drawing/context mode HUD
  const setLastSpeechTranscript = useStore((state) => state.setLastSpeechTranscript);
  const setLastAiResponse = useStore((state) => state.setLastAiResponse);
  
  useEffect(() => {
    if (aetherFeedback) {
      if (aetherFeedback.transcript) {
        setLastSpeechTranscript(aetherFeedback.transcript);
      }
      if (aetherFeedback.explanation) {
        setLastAiResponse(aetherFeedback.explanation);
      } else if (aetherFeedback.error) {
        setLastAiResponse(`Error: ${aetherFeedback.error}`);
      }
    }
  }, [aetherFeedback, setLastSpeechTranscript, setLastAiResponse]);

  // TTS Feedback controls
  const [voicePlayback, setVoicePlayback] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('aether_tts_audio_enabled') !== 'false' : true;
  });
  const voicePlaybackRef = useRef(voicePlayback);
  useEffect(() => {
    voicePlaybackRef.current = voicePlayback;
    try {
      localStorage.setItem('aether_tts_audio_enabled', String(voicePlayback));
    } catch (e) {}
  }, [voicePlayback]);

  useEffect(() => {
    const handleSpeechSync = () => {
      const isSpeechEnabled = localStorage.getItem('aether_tts_audio_enabled') !== 'false';
      setVoicePlayback(isSpeechEnabled);
      if (!isSpeechEnabled) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      }
    };
    window.addEventListener('aether-speech-sync', handleSpeechSync);
    return () => window.removeEventListener('aether-speech-sync', handleSpeechSync);
  }, []);
  
  // Synchronized state refs to prevent stale closure bugs in browser speech recognition callbacks
  const isHubOpenRef = useRef(isHubOpen);
  const isDrawingModeActiveRef = useRef(isDrawingModeActive);
  const isConversingRef = useRef(isConversing);
  const isListeningForSpeechRef = useRef(isListeningForSpeech);
  const isRecordingRef = useRef(isRecording);
  const isProcessingRef = useRef(isProcessing);

  // Explicit state flag to allow Aether's audio processing stream and speech synthesis to run concurrently
  const [isConcurrentStreamEnabled, setIsConcurrentStreamEnabled] = useState(true);
  const isConcurrentStreamEnabledRef = useRef(isConcurrentStreamEnabled);

  const activeStreamAbortControllerRef = useRef<AbortController | null>(null);
  const isStreamAbortedRef = useRef<boolean>(false);
  const isPollingUpdateRef = useRef<boolean>(false);

  useEffect(() => { 
    isHubOpenRef.current = isHubOpen || isDrawingModeActive; 
    // Automatically manage continuous listening when the hub opens without overriding manual mute
    if (isHubOpen || isDrawingModeActive) {
      if (!isAetherMutedRef.current && !isListeningForSpeechRef.current && !isProcessingRef.current) {
        startContinuousConversationalListen();
      }
    } else {
      if (!isWakeWordEnabled) {
        // When hub closes and wake-word is not enabled, ensure active mic stops
        if (activeRecogRef.current) {
          try {
            activeRecogRef.current.onend = null;
            activeRecogRef.current.stop();
          } catch (e) {}
          activeRecogRef.current = null;
          setIsListeningForSpeech(false);
        }
      }
    }
  }, [isHubOpen, isDrawingModeActive, isWakeWordEnabled]);
  useEffect(() => { isConversingRef.current = isConversing; }, [isConversing]);
  useEffect(() => { isListeningForSpeechRef.current = isListeningForSpeech; }, [isListeningForSpeech]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { isConcurrentStreamEnabledRef.current = isConcurrentStreamEnabled; }, [isConcurrentStreamEnabled]);
  useEffect(() => { isDrawingModeActiveRef.current = isDrawingModeActive; }, [isDrawingModeActive]);
  
  // High-Quality natural synthesis voices pre-fetching state
  const [voices, setVoices] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadSyncVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      loadSyncVoices();
      window.speechSynthesis.onvoiceschanged = loadSyncVoices;
    }
  }, []);

  const getGreeting = () => {
    const personality = getResolvedAetherPersonality(aetherPersonalityRules);
    const userName = personality.preferredUserName;
    const hours = new Date().getHours();
    let timeOfDay = "evening";
    if (hours >= 5 && hours < 12) {
      timeOfDay = "morning";
    } else if (hours >= 12 && hours < 17) {
      timeOfDay = "afternoon";
    }

    if (personality.verbosity === 'concise') {
      return `Good ${timeOfDay}, ${userName}. Standing by for commands.`;
    }
    
    const greetings = [
      `Good ${timeOfDay}, ${userName}! Aether voice deck online. What ideas are we designing or brainstorming today?`,
      `Good ${timeOfDay}, ${userName}! Welcome back to your central command center. I'm listening—what shall we build next?`,
      `Aether virtual workspace fully synchronized, ${userName}. Ready when you are.`,
      `Standing by, ${userName}. What shall we build or analyze today?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  // Spatial Shortcut Bind: Hold or Tap SPACEBAR to interrupt Aether or toggle mic listen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHubOpen) return;
      // Do not interrupt while typing in textareas or inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (speakActiveRef.current || isSpeechActive) {
          handleIntelligentInterrupt();
        } else if (isListeningForSpeech) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          if (activeRecogRef.current) {
            try {
              activeRecogRef.current.onend = null;
              activeRecogRef.current.stop();
            } catch (err) {}
            setIsListeningForSpeech(false);
          }
          if (speechTransitText.trim()) {
            submitDirectConversationalText(speechTransitText);
          }
        } else {
          setIsConversing(true);
          startContinuousConversationalListen();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHubOpen, isSpeechActive, isListeningForSpeech, isConversing, speechTransitText]);

  // Gestural and focus wakeup to bypass strict browser speech-auth auto-locks
  useEffect(() => {
    const handleGestureWakeup = () => {
      if (isHubOpen) {
        if (isConversing && !isListeningForSpeech) {
          setIsMicPermissionBlocked(false);
          startContinuousConversationalListen();
        }
      } else {
        if (isWakeWordEnabled && !isAetherMuted) {
          setIsMicPermissionBlocked(false);
          if (!backgroundRecogRef.current) {
            startBackgroundWakeWord();
          }
        }
      }
    };

    window.addEventListener('click', handleGestureWakeup);
    window.addEventListener('focus', handleGestureWakeup);
    window.addEventListener('mousedown', handleGestureWakeup);
    window.addEventListener('touchstart', handleGestureWakeup);
    window.addEventListener('pointerdown', handleGestureWakeup);
    window.addEventListener('keydown', handleGestureWakeup);
    return () => {
      window.removeEventListener('click', handleGestureWakeup);
      window.removeEventListener('focus', handleGestureWakeup);
      window.removeEventListener('mousedown', handleGestureWakeup);
      window.removeEventListener('touchstart', handleGestureWakeup);
      window.removeEventListener('pointerdown', handleGestureWakeup);
      window.removeEventListener('keydown', handleGestureWakeup);
    };
  }, [isWakeWordEnabled, isHubOpen, isWakeWordListening, isConversing, isListeningForSpeech]);

  // Auto clean audio on unmount
  useEffect(() => {
    return () => {
      cleanupAudioRecording();
    };
  }, []);

  // Keep convoHistory ref up-to-date for polling
  const convoHistoryRef = useRef(convoHistory);
  useEffect(() => {
    convoHistoryRef.current = convoHistory;
  }, [convoHistory]);

  // Save conversation history to robust IndexedDB thread storage and sync to server when it changes
  useEffect(() => {
    const activeSessionId = typeof localStorage !== 'undefined' ? (localStorage.getItem('aether_current_session_id') || 'session-default') : 'session-default';
    
    // Save to IndexedDB (asynchronous, limitless storage)
    if (convoHistory.length > 0) {
      const dbMessages = convoHistory.map((item, idx) => ({
        id: `msg-voice-${idx}-${Date.now()}`,
        role: (item.role === 'model' ? 'agent' : 'user') as 'user' | 'agent',
        content: item.text,
        timestamp: Date.now()
      }));
      aetherThreadStorage.saveMessages(activeSessionId, dbMessages).catch(err => {
        console.warn("IndexedDB thread save warning:", err);
      });
    }

    // Keep working memory lightweight in localStorage (< 50KB)
    try {
      const recentWindow = convoHistory.slice(-20);
      aetherThreadStorage.safeLocalStorageSet('aether_convo_history', JSON.stringify(recentWindow));
    } catch (err) {
      console.warn("Could not write recent window to localStorage:", err);
    }
    
    // Sync to backend central database / Server-Side Mobile Gateway Chat History
    if (!isPollingUpdateRef.current && convoHistory.length > 0) {
      fetch('/api/whatsapp/sync-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: convoHistory })
      }).catch(err => console.warn("Failed to sync conversation history to server:", err));
    }

    try {
      const savedSessions = localStorage.getItem('aether_chat_sessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        let modified = false;
        const updatedSessions = sessions.map((sess: any) => {
          if (sess.id === activeSessionId) {
            // Compare contents rather than full objects to avoid ID mismatch loops
            const currentContents = (sess.messages || []).map((m: any) => ({
              role: m.role === 'assistant' || m.role === 'agent' ? 'model' as const : 'user' as const,
              text: m.content
            }));
            
            const convoContents = convoHistory;
            
            if (convoHistory.length === 0 && currentContents.length > 0) {
              // Safeguard: ignore initial empty convoHistory on mount if the session already has messages
              return sess;
            }
            
            if (!areConvoHistoriesEqual(currentContents, convoContents)) {
              // Reconstruct mapped messages while preserving original IDs where possible
              const mappedMessages = convoHistory.map((item, idx) => {
                const existing = sess.messages?.[idx];
                const itemRole = item.role === 'model' ? 'agent' : 'user';
                if (existing && (existing.role === itemRole || (existing.role === 'assistant' && itemRole === 'agent')) && existing.content === item.text) {
                  return existing;
                }
                return {
                  id: existing?.id || `msg-voice-${idx}-${Date.now()}`,
                  role: item.role === 'model' ? 'agent' : 'user',
                  content: item.text,
                  timestamp: existing?.timestamp || Date.now()
                };
              });
              
              modified = true;
              return { ...sess, messages: mappedMessages };
            }
          }
          return sess;
        });
        
        if (modified) {
          aetherThreadStorage.safeLocalStorageSet('aether_chat_sessions', JSON.stringify(updatedSessions));
          // Dispatch events to notify other components on the page
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new CustomEvent('aether_sync_chat', { detail: { sender: 'VoiceMemoAssistant' } }));
        }
      }
    } catch (e) {
      console.warn("Could not sync conversation with sidebar:", e);
    }
  }, [convoHistory]);

  // Poll for central chat history updates from backend to seamlessly resume conversation on mobile/PC
  useEffect(() => {
    let active = true;
    const pollHistory = async () => {
      try {
        const res = await fetch('/api/whatsapp/config');
        if (res.ok && active) {
          const data = await res.json();
          if (data.chatHistory) {
            const mapped = data.chatHistory.map((m: any) => ({
              role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
              text: m.text
            }));
            
            if (!areConvoHistoriesEqual(convoHistoryRef.current, mapped)) {
              isPollingUpdateRef.current = true;
              setConvoHistory(mapped);
              setTimeout(() => {
                isPollingUpdateRef.current = false;
              }, 100);
            }
          }
        }
      } catch (err) {
        console.warn("Failed polling voice history from server:", err);
      }
    };

    pollHistory();
    const interval = setInterval(pollHistory, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Keep convoHistory in sync with any text updates typed in the sidebar
  useEffect(() => {
    const syncFromSidebar = () => {
      try {
        const activeSessionId = localStorage.getItem('aether_current_session_id');
        const savedSessions = localStorage.getItem('aether_chat_sessions');
        if (activeSessionId && savedSessions) {
          const sessions = JSON.parse(savedSessions);
          const activeSess = sessions.find((s: any) => s.id === activeSessionId);
          if (activeSess && activeSess.messages) {
            const mapped = activeSess.messages.map((m: any) => ({
              role: m.role === 'assistant' || m.role === 'agent' ? 'model' as const : 'user' as const,
              text: m.content
            }));
            
            setConvoHistory(prev => {
              if (!areConvoHistoriesEqual(prev, mapped)) {
                return mapped;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.warn("Error syncing from sidebar to convoHistory:", e);
      }
    };

    // Initial load sync
    syncFromSidebar();

    // Set up active event bindings
    const handleSync = (e: any) => {
      if (e && e.type === 'aether_sync_chat' && e.detail?.sender === 'VoiceMemoAssistant') {
        return;
      }
      syncFromSidebar();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('aether_sync_chat', handleSync);
    
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('aether_sync_chat', handleSync);
    };
  }, []);

  // Persist workspace scratchpad Text to local storage
  useEffect(() => {
    try {
      localStorage.setItem('aether_scratchpad_text', scratchpadText);
    } catch (e) {
      console.warn("Could not save scratchpadText:", e);
    }
  }, [scratchpadText]);

  // Persist staging active session items (Active Ideas) to local storage
  useEffect(() => {
    try {
      localStorage.setItem('aether_session_items', JSON.stringify(sessionItems));
    } catch (e) {
      console.warn("Could not save sessionItems:", e);
    }
  }, [sessionItems]);

  // Persist current active hudTab
  useEffect(() => {
    try {
      localStorage.setItem('aether_hud_tab', hudTab);
    } catch (e) {
      console.warn("Could not save hudTab:", e);
    }
  }, [hudTab]);

  // Timer counter effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingSeconds(0);
    }
  }, [isRecording]);

  const cleanupAudioRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const startBackgroundWakeWord = () => {
    if (!isWakeWordEnabled || isHubOpen || isAetherMutedRef.current) {
      setIsWakeWordListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsWakeWordListening(false);
      return;
    }

    if (backgroundRecogRef.current) {
      try {
        backgroundRecogRef.current.onend = null;
        backgroundRecogRef.current.onerror = null;
        backgroundRecogRef.current.stop();
      } catch (e) {}
      backgroundRecogRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsWakeWordListening(true);
        setIsMicPermissionBlocked(false);
        setIsVoiceDetectedInBg(false);
        const activeWord = wakeWord.toLowerCase().trim();
        if (trainedWakeWordModel) {
          addVocalDiagnostic(`ENGINE: Background wake word listening initialized. Model calibrated (Pitch Range: ${trainedWakeWordModel.pitchHz}Hz). Listening for "${activeWord}"`);
        } else {
          addVocalDiagnostic(`ENGINE: Background wake word listening started (Uncalibrated). Listening for "${activeWord}"`);
        }
      };

      recognition.onsoundstart = () => {
        setIsVoiceDetectedInBg(true);
      };
      recognition.onspeechstart = () => {
        setIsVoiceDetectedInBg(true);
      };
      recognition.onspeechend = () => {
        setIsVoiceDetectedInBg(false);
      };
      recognition.onsoundend = () => {
        setIsVoiceDetectedInBg(false);
      };

      recognition.onresult = (event: any) => {
        if (speakActiveRef.current) return;

        let fullTranscriptOfRecognition = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscriptOfRecognition += event.results[i][0].transcript;
        }
        const correctedRaw = applyVocalDictionary(fullTranscriptOfRecognition, vocalDictionary);
        const transcript = correctedRaw.toLowerCase().trim();
        const cleanWakeWord = wakeWord.toLowerCase().trim();

        if (transcript.trim()) {
          setIsVoiceDetectedInBg(true);
          if ((window as any)._bgVoiceTimer) {
            clearTimeout((window as any)._bgVoiceTimer);
          }
          (window as any)._bgVoiceTimer = setTimeout(() => {
            setIsVoiceDetectedInBg(false);
          }, 1500);

          const logMsg = `SPEECH: Interim capture "${transcript}"`;
          addVocalDiagnostic(logMsg);
        }

        // High-fidelity proximate phonetics fallback matching loop
        const isWakeWordMatched = 
          transcript.includes(cleanWakeWord) || 
          transcript.includes('hey aether') || 
          transcript.includes('aether') || 
          transcript.includes('hey ether') || 
          transcript.includes('ether') || 
          transcript.includes('hey heather') || 
          transcript.includes('heather') || 
          transcript.includes('k either') ||
          transcript.includes('k ether') ||
          transcript.includes('k aether') ||
          transcript.includes('k ather') ||
          transcript.includes('k-either') ||
          transcript.includes('k-ether') ||
          transcript.includes('k-aether') ||
          transcript.includes('kay either') ||
          transcript.includes('kay ether') ||
          transcript.includes('kay aether') ||
          transcript.includes('kay ather') ||
          transcript.includes('okay ether') ||
          transcript.includes('okay either') ||
          transcript.includes('ok ether') ||
          transcript.includes('ok either') ||
          transcript.includes('hey either') ||
          transcript.includes('hey other') ||
          transcript.includes('hey author') ||
          transcript.includes('hey aster') ||
          transcript.includes('hey actor') ||
          transcript.includes('eighty') ||
          transcript.includes('hi aether') ||
          transcript.includes('okay aether') ||
          transcript.includes('ok aether') ||
          transcript.includes('hello aether') ||
          transcript.includes('wake up aether') ||
          transcript.includes('wake up ether') ||
          transcript.includes('activate aether') ||
          transcript.includes('hey ever') ||
          transcript.includes('eva') ||
          transcript.includes('hey eva') ||
          transcript.includes('heather wake') ||
          transcript.includes('ather') ||
          transcript.includes('hey ather');

        if (isWakeWordMatched) {
          if (isWakeWordTriggeringRef.current) return;
          isWakeWordTriggeringRef.current = true;
          setTimeout(() => {
            isWakeWordTriggeringRef.current = false;
          }, 2500);

          addVocalDiagnostic(`SUCCESS: Wake word matched target "${cleanWakeWord}". Met confidence coefficients! Triggering Aether...`);
          recognition.onend = null;
          recognition.onerror = null;
          try { recognition.stop(); } catch (e) {}
          setIsWakeWordListening(false);
          setIsMicPermissionBlocked(false);
          setIsVoiceDetectedInBg(false);
          
          playActivationChime();
          setWakeWordTriggerTime(Date.now());

          setIsHubOpen(true);
          setIsAssistantMinimized(false);
          setIsUltraCompact(false);
          setHudTab('speak');
          setIsConversing(true);

          const activeProjName = projects.find(p => p.id === activeProjectId)?.name;
          const greeting = aetherConversationalEngine.getGreeting(activeProjName);

          setAetherFeedback({
            explanation: greeting
          });
          triggerBrowserSpeechSynthesis(greeting);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn("Background SpeechRecognition error state:", e.error);
          addVocalDiagnostic(`WARNING: Speech recognition engine reported: "${e.error}"`);
        }
        if (e.error === 'not-allowed') {
          addVocalDiagnostic(`CRITICAL: Microphone access blocked. Please grant permissions or clear busy devices to activate background wake words.`);
          setIsWakeWordListening(false);
          setIsMicPermissionBlocked(true);
        }
      };

      recognition.onend = () => {
        backgroundRecogRef.current = null;

        // Keep isWakeWordListening as true in standard silence cycling so UI doesn't flicker/flap
        const isOnSettingsPage = location.pathname === '/settings';
        
        // If microphone permission is blocked (e.g. lack of user gesture), do NOT auto-retry to prevent rate limit.
        // Instead, wait for a user gesture click/interaction to re-enable.
        const willRestart = isWakeWordEnabled && !isHubOpen && !isOnSettingsPage && !isAetherMutedRef.current && !isMicPermissionBlockedRef.current;
        
        // Safely recreate and spin up a pristine instance to maintain alive state
        setTimeout(() => {
          if (isWakeWordEnabled && !isHubOpen && !isOnSettingsPage && !isAetherMutedRef.current && !isMicPermissionBlockedRef.current) {
            startBackgroundWakeWord();
          } else {
            setIsWakeWordListening(false);
          }
        }, 300); // 300ms delay to cleanly recycle mic resources
      };

      backgroundRecogRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed starting background wake word recognition:", err);
      addVocalDiagnostic(`CRITICAL: System error spawning SpeechRecognition node.`);
      setIsWakeWordListening(false);
    }
  };

  const startContinuousConversationalListen = () => {
    if (!isHubOpenRef.current && !isDrawingModeActiveRef.current) return;
    if (isAetherMutedRef.current) {
      setIsListeningForSpeech(false);
      return;
    }
    
    // Prevent starting speech recognition if it is already active & listening to protect the browser hardware layer
    if (activeRecogRef.current && isListeningForSpeechRef.current) {
      console.log("Speech recognition is already running and listening. No need to restart.");
      return;
    }
    
    // Stop any existing active recognition first
    if (activeRecogRef.current) {
      try {
        activeRecogRef.current.onend = null;
        activeRecogRef.current.stop();
      } catch (e) {}
      activeRecogRef.current = null;
    }
    
    // Stop background wake word during active hub sessions to prevent hardware locks
    if (backgroundRecogRef.current) {
      try {
        backgroundRecogRef.current.onend = null;
        backgroundRecogRef.current.stop();
      } catch (e) {}
      backgroundRecogRef.current = null;
      setIsWakeWordListening(false);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition is not fully supported in your browser client.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscriptOfRound = '';

      recognition.onstart = () => {
        setIsListeningForSpeech(true);
        setSpeechTransitText('');
        setIsUserSpeaking(false);
      };

      recognition.onsoundstart = () => {
        const isStreaming = activeStreamAbortControllerRef.current !== null;
        const isSpeaking = speakActiveRef.current;
        if (!isSpeaking && !isStreaming && !isProcessing) {
          setIsUserSpeaking(true);
        }
      };

      recognition.onspeechstart = () => {
        const isStreaming = activeStreamAbortControllerRef.current !== null;
        const isSpeaking = speakActiveRef.current;
        if (!isSpeaking && !isStreaming && !isProcessing) {
          setIsUserSpeaking(true);
        }
      };

      recognition.onspeechend = () => {
        setTimeout(() => {
          setIsUserSpeaking(false);
        }, 1200);
      };

      recognition.onsoundend = () => {
        setTimeout(() => {
          setIsUserSpeaking(false);
        }, 1200);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptOfRound += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const fullCurrentTextRaw = (finalTranscriptOfRound + interimTranscript).trim();
        const fullCurrentText = applyVocalDictionary(fullCurrentTextRaw, vocalDictionary);

        // Intelligent Voice Barge-In / User Interrupting AI Speak or active stream
        const isStreaming = activeStreamAbortControllerRef.current !== null;
        const isSpeaking = speakActiveRef.current;
        const isAetherProducingSpeech = isSpeaking || isStreaming || isProcessing;

        if (isAetherProducingSpeech) {
          if (fullCurrentText.length > 0) {
            const aiText = activeSpeechTextRef.current || "";
            const cleanTranscript = fullCurrentText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
            
            // If AI is actually speaking, filter out self-transcription echoes.
            // If AI is not speaking yet (just streaming/processing), any voice input is from the user!
            let isUserInterrupting = false;
            
            if (isSpeaking) {
              const cleanAi = aiText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
              const aiWords = new Set(cleanAi.split(/\s+/));
              const transcriptWords = cleanTranscript.split(/\s+/);

              let newWordsCount = 0;
              for (const word of transcriptWords) {
                if (word && !aiWords.has(word)) {
                  newWordsCount++;
                }
              }

              const intenseCuts = [
                "stop", "wait", "no", "cancel", "hold on", "hold", "aether", "ether", "heather", 
                "shut up", "go away", "hey", "close", "silence", "pause", "shut", "listen", "excuse me",
                "actually", "wrong", "instead", "change", "correct", "no actually"
              ];
              const hasIntenseCut = intenseCuts.some(cut => {
                if (cleanTranscript.includes(cut)) {
                  // If the AI itself is speaking this word, don't trigger self-interruption!
                  if (cleanAi.includes(cut)) {
                    return false;
                  }
                  return true;
                }
                return false;
              });

              // Enhanced responsive threshold: require at least 3 new words or a clear intense cut word to trigger interruption
              if (newWordsCount >= 3 || hasIntenseCut) {
                isUserInterrupting = true;
              }
            } else {
              // AI is streaming/processing silently, any captured speech of length >= 1 is the user
              if (cleanTranscript.length >= 1) {
                isUserInterrupting = true;
              }
            }

            if (isUserInterrupting) {
              addVocalDiagnostic(`INTERRUPT: Voice barge-in detected ("${fullCurrentText}"). Cancelling AI speech & resetting stream.`);
              setIsUserSpeaking(true);
              handleIntelligentInterrupt(true); // Pass true to preserve active speech recognition
              // Do not return! Let the speech engine keep accumulating the sentence.
            } else {
              // Skip self-transcription echo
              return;
            }
          } else {
            return;
          }
        }

        // Track user speaking in active conversation
        if (fullCurrentText.length > 0) {
          setIsUserSpeaking(true);
          if ((window as any)._userSpeakingTimer) {
            clearTimeout((window as any)._userSpeakingTimer);
          }
          (window as any)._userSpeakingTimer = setTimeout(() => {
            setIsUserSpeaking(false);
          }, 2500);
        }

        setSpeechTransitText(fullCurrentText);

        // Feed silence timer to stop and commit
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (fullCurrentText.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            recognition.onend = null; // turn off reconnect loop on explicit commit
            try { recognition.stop(); } catch (e) {}
            setIsListeningForSpeech(false);
            setIsUserSpeaking(false);
            submitDirectConversationalText(fullCurrentText);
          }, 1800); // 1800ms of quiet auto-dispatches for natural pauses without premature cuts
        }
      };

      recognition.onerror = (e: any) => {
        setIsUserSpeaking(false);
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn("Conversational loop recognition error:", e);
          addVocalDiagnostic(`WARNING: Speech recognition error state: "${e.error}"`);
        }
        if (e.error === 'not-allowed') {
          setIsMicPermissionBlocked(true);
          addVocalDiagnostic("CRITICAL: Microphone access blocked. Please unlock microphone feed.");
        }
      };

      recognition.onend = () => {
        setIsListeningForSpeech(false);
        setIsUserSpeaking(false);
        // Automatic restart loop while modal window is active & we are conversing
        setTimeout(() => {
          if ((isHubOpenRef.current || isDrawingModeActiveRef.current) && isConversingRef.current && !isListeningForSpeechRef.current) {
            startContinuousConversationalListen();
          }
        }, 150);
      };

      activeRecogRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed starting conversational listener loop:", err);
    }
  };

  // Handle auto-conversational listening trigger when Aether Context Mode (drawing mode) is activated
  useEffect(() => {
    if (isDrawingModeActive) {
      setIsConversing(true);
      isConversingRef.current = true;
      if (!isListeningForSpeechRef.current && !isProcessingRef.current && !speakActiveRef.current) {
        startContinuousConversationalListen();
      }
    } else {
      if (!isHubOpenRef.current) {
        setIsConversing(false);
        isConversingRef.current = false;
        if (activeRecogRef.current) {
          try {
            activeRecogRef.current.onend = null;
            activeRecogRef.current.stop();
          } catch (e) {}
          activeRecogRef.current = null;
        }
        setIsListeningForSpeech(false);
        startBackgroundWakeWord();
      }
    }
  }, [isDrawingModeActive]);

  const requestAetherStream = async (payload: any) => {
    setIsProcessing(true);
    setAetherFeedback(null);
    setProcessingStatus("Contacting Aether stream gateway...");

    const processedSentences = new Set<string>();

    const controller = new AbortController();
    activeStreamAbortControllerRef.current = controller;
    isStreamAbortedRef.current = false;

    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aetherPersonalityRules: aetherPersonalityRules || [],
          ...payload,
          stream: true
        }),
        signal: controller.signal
      });

      if (!response.ok) throw new Error(`Engine returned error code: ${response.status}`);
      if (!response.body) throw new Error("No response body available for stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamDoc = "";

      // Initialize real-time visualization block for streaming
      setAetherFeedback({
        transcript: payload.textCommand || "[Decoding incoming audio...]",
        explanation: "Aether is formulating response...",
        intent: "chat_query"
      });

      // Clear any previous speech synthesis first
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeechActive(false);
      speakActiveRef.current = false;

      // Function to speak a chunk of text
      const speakChunk = (textToSpeak: string) => {
        if (!voicePlayback) return;
        try {
          if (!window.speechSynthesis) return;
          
          // Remove markdown symbols/stars
          const cleanText = textToSpeak.replace(/[*#`_\-]/g, '').trim();
          if (!cleanText) return;

          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = speechRate || 1.18;
          utterance.pitch = speechPitch || 1.0;

          const availableVoices = window.speechSynthesis.getVoices().length > 0 
            ? window.speechSynthesis.getVoices()
            : voices;
          
          const getBestVoice = () => {
            if (selectedVoiceName) {
              const matched = availableVoices.find(v => v.name === selectedVoiceName);
              if (matched) return matched;
            }
            const priorities = [
              // Prioritize British Male voice as the default choice
              (v: any) => (v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.toLowerCase().includes('george') || v.name.includes('Oliver')) && v.lang.includes('en'),
              (v: any) => v.name.includes('Google US English') || v.name.includes('Google UK English Female') || v.name.includes('Google US English Male'),
              (v: any) => v.name.includes('Google') && v.lang.startsWith('en'),
              (v: any) => v.name.toLowerCase().includes('natural') && v.lang.startsWith('en'),
              (v: any) => v.name.toLowerCase().includes('online') && v.lang.startsWith('en'),
              (v: any) => v.name.toLowerCase().includes('enhanced') && v.lang.startsWith('en'),
              (v: any) => v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Aria') || v.name.includes('Guy'),
              (v: any) => v.lang.startsWith('en-US'),
              (v: any) => v.lang.startsWith('en'),
            ];
            for (const priority of priorities) {
              const found = availableVoices.find(priority);
              if (found) return found;
            }
            return availableVoices.find(v => v.lang.startsWith('en')) || null;
          };

          const bestVoice = getBestVoice();
          if (bestVoice) {
            utterance.voice = bestVoice;
          }

          utterance.onstart = () => {
            setIsSpeechActive(true);
            speakActiveRef.current = true;
          };

          utterance.onend = () => {
            setTimeout(() => {
              if (window.speechSynthesis && !window.speechSynthesis.speaking) {
                setIsSpeechActive(false);
                speakActiveRef.current = false;
                addVocalDiagnostic("CONVO_MIC: Streaming SpeechSynthesis completed.");
                
                if ((isHubOpenRef.current || isDrawingModeActiveRef.current) && !isRecordingRef.current && !isProcessingRef.current) {
                  if (isConversingRef.current || isConcurrentStreamEnabledRef.current) {
                    setTimeout(() => {
                      startContinuousConversationalListen();
                    }, 300);
                  }
                } else {
                  startBackgroundWakeWord();
                }
              }
            }, 100);
          };

          (window as any)._activeSpeechUtterance = utterance;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn("Speech Synthesis streaming chunk failure:", e);
        }
      };

      let sseBuffer = "";
      while (true) {
        if (isStreamAbortedRef.current) {
          addVocalDiagnostic("CONVO_MIC: Active stream loop aborted due to interrupt.");
          break;
        }
        const { value, done } = await reader.read();
        if (done || isStreamAbortedRef.current) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (isStreamAbortedRef.current) break;
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              if (data.chunk) {
                streamDoc += data.chunk;

                // Extract partial explanation from streaming JSON
                const partialExplanation = extractExplanationFromPartialJson(streamDoc);
                const partialTranscript = extractTranscriptFromPartialJson(streamDoc);

                if (partialExplanation) {
                  setAetherFeedback(prev => ({
                    ...prev,
                    transcript: partialTranscript || prev?.transcript || payload.textCommand || "[Decoded]",
                    explanation: partialExplanation
                  }));

                  // Voice Streaming Optimization: speak finished sentences immediately
                  if (voicePlayback) {
                    // Match ends of sentences: periods, questions, exclamations, or newlines
                    const sentences = partialExplanation.match(/[^.!?\n]+[.!?\n]+/g);
                    if (sentences) {
                      for (const sentence of sentences) {
                        const trimmed = sentence.trim();
                        if (trimmed && !processedSentences.has(trimmed)) {
                          processedSentences.add(trimmed);
                          speakChunk(trimmed);
                        }
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // Ignore partial parsing errors
            }
          }
        }
      }

      if (isStreamAbortedRef.current) {
        addVocalDiagnostic("CONVO_MIC: Active stream was aborted. Skipping post-processing.");
        return;
      }

      // Once the stream completes, parse the full JSON response to handle all secondary side-effects (intents, saving rules, etc.)
      try {
        const parsedDoc = JSON.parse(streamDoc.trim());
        
        // If there's any leftover text in the sentence buffer that hasn't been spoken yet, speak it!
        if (voicePlayback && parsedDoc.explanation) {
          const trimmedFull = parsedDoc.explanation.trim();
          const sentences = trimmedFull.match(/[^.!?\n]+[.!?\n]+/g) || [];
          let spokenAcc = "";
          for (const s of sentences) {
            const t = s.trim();
            if (processedSentences.has(t)) {
              spokenAcc += s;
            }
          }
          const remainder = trimmedFull.substring(spokenAcc.length).trim();
          if (remainder && !processedSentences.has(remainder)) {
            processedSentences.add(remainder);
            speakChunk(remainder);
          }
        }

        handleProcessedResponse(parsedDoc, true);
      } catch (parseErr) {
        console.warn("Could not parse fully completed stream JSON:", parseErr, streamDoc);
        const partialExplanation = extractExplanationFromPartialJson(streamDoc);
        const partialTranscript = extractTranscriptFromPartialJson(streamDoc) || payload.textCommand || "";
        const partialIntent = extractIntentFromPartialJson(streamDoc) || "chat_query";

        handleProcessedResponse({
          transcript: partialTranscript,
          explanation: partialExplanation || "Stream parsing finished.",
          intent: partialIntent,
          shouldWriteDown: "no",
          noteContent: "",
          parsedData: {}
        }, true);
      }

    } catch (err: any) {
      if (err.name === 'AbortError' || isStreamAbortedRef.current) {
        addVocalDiagnostic("CONVO_MIC: Fetch request aborted successfully.");
        return;
      }
      console.error(err);
      setAetherFeedback({ error: err.message || "Failed conversational streaming processing" });
      
      setTimeout(() => {
        if ((isHubOpenRef.current || isDrawingModeActiveRef.current) && isConversingRef.current && !isSpeechActive) {
          startContinuousConversationalListen();
        }
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitDirectConversationalText = async (command: string) => {
    if (!command.trim() || isProcessing) return;
    
    // Intercept when we have a pending proposed action
    if (proposedAction) {
      const cleanCmd = command.toLowerCase().trim().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");
      
      const confirmPhrases = ["yes", "yeah", "yep", "sure", "ok", "okay", "confirm", "accept", "accepts", "do it", "approve"];
      const declinePhrases = ["no", "nope", "nay", "decline", "deny", "refuse", "cancel", "discard", "dont", "don't"];

      const isConfirm = confirmPhrases.some(p => cleanCmd === p || cleanCmd.startsWith(p + " ") || cleanCmd.endsWith(" " + p));
      const isDecline = declinePhrases.some(p => cleanCmd === p || cleanCmd.startsWith(p + " ") || cleanCmd.endsWith(" " + p));

      if (isConfirm) {
        executeProposedAction(proposedAction);
        return;
      } else if (isDecline) {
        if (proposedAction.intent === 'create_project') {
          const newSpelling = extractNewProjectNameFromDecline(command);
          if (newSpelling) {
            const updatedAction = {
              ...proposedAction,
              parsedData: {
                ...proposedAction.parsedData,
                name: newSpelling
              },
              actionDisplay: `Create Project: "${newSpelling}"`
            };
            setProposedAction(updatedAction);
            
            const feedbackMsg = `Okay, so you meant create project named "${newSpelling}". Is that correct?`;
            
            setConvoHistory(prev => [
              ...prev,
              { role: 'user' as const, text: command },
              { role: 'model' as const, text: feedbackMsg }
            ].slice(-10));

            setAetherFeedback({
              transcript: command,
              explanation: feedbackMsg,
              intent: 'create_project',
              triggeredAction: `📋 Corrected Proposed Project Name: "${newSpelling}"`
            });

            if (voicePlayback) {
              triggerBrowserSpeechSynthesis(feedbackMsg);
            }

            setTimeout(() => {
              if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
                startContinuousConversationalListen();
              }
            }, 1200);
            return;
          }
        }
        discardProposedAction(proposedAction);
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStatus("Aether parsing continuous voice feed...");
    setAetherFeedback(null);

    if (checkVoiceTriggers(command)) {
      setIsProcessing(false);
      return;
    }

    try {
      const contextPayload = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      }));

      await requestAetherStream({
        textCommand: command,
        projectContexts: contextPayload,
        cortexSynapses: cortexSynapses || [],
        notes: notes || [],
        aetherPersonalityRules: aetherPersonalityRules || [],
        history: convoHistory,
        pendingNote: pendingNote,
        activeProjectId,
        currentPath: location.pathname,
        circledContexts: circledContexts || []
      });
    } catch (err: any) {
      console.error(err);
      setAetherFeedback({ error: err.message || "Failed conversational processing" });
      
      // Safety auto-resume on error
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isSpeechActive) {
          startContinuousConversationalListen();
        }
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIntelligentInterrupt = async (preserveRecognition = false) => {
    isStreamAbortedRef.current = true;
    
    // Asynchronously abort any active Gemini stream
    if (activeStreamAbortControllerRef.current) {
      try {
        addVocalDiagnostic("CONVO_MIC: Terminating active Gemini streaming synthesis via AbortController...");
        activeStreamAbortControllerRef.current.abort();
      } catch (e) {
        console.warn("Error aborting stream controller:", e);
      }
      activeStreamAbortControllerRef.current = null;
    }

    // Cancel any current browser Speech Synthesis vocalizations
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        addVocalDiagnostic("CONVO_MIC: Local SpeechSynthesis cancelled successfully.");
      } catch (e) {
        console.warn("Error cancelling speech synthesis:", e);
      }
    }
    
    setIsSpeechActive(false);
    speakActiveRef.current = false;
    
    if (preserveRecognition) {
      // Keep existing SpeechRecognition instance running so they can finish their sentence smoothly!
      addVocalDiagnostic("CONVO_MIC: Preserving active SpeechRecognition loop during barge-in.");
      return;
    }

    // Use an elegant async delay before restarting the continuous conversational loop
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (isHubOpenRef.current && isConversingRef.current && !isListeningForSpeechRef.current) {
      startContinuousConversationalListen();
    }
  };

  const matchesKeyboardShortcut = (e: KeyboardEvent, shortcutStr: string) => {
    if (!shortcutStr) return false;
    const parts = shortcutStr.toLowerCase().split('+');
    const key = parts[parts.length - 1].trim();
    
    const needsCtrl = parts.includes('ctrl') || parts.includes('control');
    const needsAlt = parts.includes('alt');
    const needsShift = parts.includes('shift');
    const needsMeta = parts.includes('meta') || parts.includes('cmd') || parts.includes('win');
    
    const hasCtrl = e.ctrlKey;
    const hasAlt = e.altKey;
    const hasShift = e.shiftKey;
    const hasMeta = e.metaKey;
    
    if (needsCtrl !== hasCtrl) return false;
    if (needsAlt !== hasAlt) return false;
    if (needsShift !== hasShift) return false;
    if (needsMeta !== hasMeta) return false;
    
    const eventKey = e.key.toLowerCase();
    const eventCode = e.code.toLowerCase();
    
    return eventKey === key || eventCode === key;
  };

  const matchesMouseShortcut = (e: MouseEvent, shortcutStr: string) => {
    if (!shortcutStr || shortcutStr === 'none') return false;
    const cleanStr = shortcutStr.toLowerCase();
    
    // Support modifier key constraints for mouse clicks
    const needsCtrl = cleanStr.includes('ctrl');
    const needsAlt = cleanStr.includes('alt');
    const needsShift = cleanStr.includes('shift');
    const needsMeta = cleanStr.includes('meta');
    
    if (needsCtrl !== e.ctrlKey) return false;
    if (needsAlt !== e.altKey) return false;
    if (needsShift !== e.shiftKey) return false;
    if (needsMeta !== e.metaKey) return false;
    
    if (cleanStr.includes('middle') || cleanStr.includes('button-1')) {
      return e.button === 1;
    }
    if (cleanStr.includes('right') || cleanStr.includes('button-2')) {
      return e.button === 2;
    }
    if (cleanStr.includes('back') || cleanStr.includes('button-3')) {
      return e.button === 3;
    }
    if (cleanStr.includes('forward') || cleanStr.includes('button-4')) {
      return e.button === 4;
    }
    if (cleanStr.includes('left') || cleanStr.includes('button-0')) {
      return e.button === 0;
    }
    return false;
  };

  // --- Voice Macro Wizard Helpers ---
  const normalizePoints = (pts: { x: number; y: number }[]) => {
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    if (xs.length === 0 || ys.length === 0) return [];
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    return pts.map(p => ({
      x: spanX > 0 ? (p.x - minX) / spanX : 0.5,
      y: spanY > 0 ? (p.y - minY) / spanY : 0.5
    }));
  };

  const resamplePoints = (pts: { x: number; y: number }[], count: number) => {
    if (pts.length === 0) return Array(count).fill({ x: 0.5, y: 0.5 });
    if (pts.length === 1) return Array(count).fill(pts[0]);
    const resampled: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const indexFloat = (i / (count - 1)) * (pts.length - 1);
      const indexLower = Math.floor(indexFloat);
      const indexUpper = Math.ceil(indexFloat);
      const t = indexFloat - indexLower;
      const p1 = pts[indexLower];
      const p2 = pts[indexUpper];
      resampled.push({
        x: p1.x * (1 - t) + p2.x * t,
        y: p1.y * (1 - t) + p2.y * t
      });
    }
    return resampled;
  };

  const checkLocalGestureConflicts = (
    newName: string,
    newPoints: { x: number; y: number }[],
    existingGestures: any[]
  ): { type: 'name' | 'shape'; conflictWith: string } | null => {
    const nameConflict = existingGestures.find(
      g => g.name && g.name.trim().toLowerCase() === newName.trim().toLowerCase()
    );
    if (nameConflict) return { type: 'name', conflictWith: nameConflict.name };

    if (newPoints.length < 5) return null;
    const normNew = normalizePoints(newPoints);
    const keyPointsCount = 10;
    const resampledNew = resamplePoints(normNew, keyPointsCount);

    for (const gesture of existingGestures) {
      if (!gesture.points || gesture.points.length < 5) continue;
      const normExisting = normalizePoints(gesture.points);
      const resampledExisting = resamplePoints(normExisting, keyPointsCount);
      let totalDist = 0;
      for (let i = 0; i < keyPointsCount; i++) {
        const dX = resampledNew[i].x - resampledExisting[i].x;
        const dY = resampledNew[i].y - resampledExisting[i].y;
        totalDist += Math.sqrt(dX * dX + dY * dY);
      }
      const avgDist = totalDist / keyPointsCount;
      if (avgDist < 0.28) {
        return { type: 'shape', conflictWith: gesture.name };
      }
    }
    return null;
  };

  const handleWizardStartCountdown = () => {
    setVoiceMacroStep('motion');
    setTrainingCountdown(3);
    setVoiceMacroPoints([]);
    
    const countdownInterval = window.setInterval(() => {
      setTrainingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleWizardStartRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleWizardStartRecording = () => {
    setIsRecordingVoiceMacroPath(true);
    setTrainingProgress(0);

    if (window.__kineticEngine && typeof window.__kineticEngine.startRecordingCustom === 'function') {
      window.__kineticEngine.startRecordingCustom((points: { x: number; y: number }[]) => {
        setIsRecordingVoiceMacroPath(false);
        if (points.length < 5) {
          showToast("Not enough hand motion detected! Please try again with a wider gesture.", "error");
          setVoiceMacroStep('naming');
          triggerBrowserSpeechSynthesis("I couldn't detect enough hand motion. Let's return to the setup step. Please try again when you are ready.");
          return;
        }

        setVoiceMacroPoints(points);

        const currentGestures = useStore.getState().kineticGestures || [];
        const conflict = checkLocalGestureConflicts(voiceMacroName, points, currentGestures);

        if (conflict) {
          const warn = `Warning: This motion closely resembles your existing gesture "${conflict.conflictWith}".`;
          setVoiceMacroContradiction(warn);
          triggerBrowserSpeechSynthesis(`Motion captured. However, it overlaps closely with your existing gesture called ${conflict.conflictWith}. You can still confirm to save, or say re-record to try a different motion.`);
        } else {
          setVoiceMacroContradiction(null);
          triggerBrowserSpeechSynthesis("Excellent! I captured your gesture path perfectly. Say test to try it out, or confirm to save.");
        }
        setVoiceMacroStep('confirm');
      });
    } else {
      setTimeout(() => {
        setIsRecordingVoiceMacroPath(false);
        const simulatedPoints = [
          { x: 0.2, y: 0.5 },
          { x: 0.5, y: 0.2 },
          { x: 0.8, y: 0.5 }
        ];
        setVoiceMacroPoints(simulatedPoints);
        setVoiceMacroStep('confirm');
        triggerBrowserSpeechSynthesis("Simulating path registration. Say test to try it, or confirm to save.");
      }, 2500);
    }

    let prog = 0;
    const progressInterval = window.setInterval(() => {
      prog += 4;
      setTrainingProgress(prog);
      if (prog >= 100) {
        clearInterval(progressInterval);
        setTrainingProgress(0);
      }
    }, 100);
  };

  const handleWizardTest = () => {
    showToast(`🧪 Testing gesture action: ${voiceMacroAction}...`, "info", 2000);
    const store = useStore.getState() as any;
    
    if (voiceMacroAction === 'toggle-sidebar') {
      if (typeof store.toggleSidebar === 'function') store.toggleSidebar();
    } else if (voiceMacroAction === 'toggle-right-sidebar') {
      if (typeof store.toggleRightSidebar === 'function') store.toggleRightSidebar();
    } else if (voiceMacroAction === 'toggle-sidebar-minimize') {
      if (typeof store.toggleSidebarMinimized === 'function') store.toggleSidebarMinimized();
    } else if (voiceMacroAction === 'toggle-command-palette') {
      if (typeof store.toggleCommandPalette === 'function') store.toggleCommandPalette();
    } else if (voiceMacroAction === 'custom-alert') {
      showToast('Aether Kinetic Wave Active!', 'success');
    } else if (voiceMacroAction === 'create-quick-note') {
      showToast('Creating quick flow note!', 'success');
    } else if (voiceMacroAction === 'nav-dashboard') {
      navigate('/');
    } else if (voiceMacroAction === 'nav-assistant') {
      navigate('/assistant');
    } else if (voiceMacroAction === 'nav-notes') {
      navigate('/notes');
    } else if (voiceMacroAction === 'nav-settings') {
      navigate('/settings');
    } else {
      showToast(`Macro action ${voiceMacroAction} fired!`, "success");
    }
  };

  const handleWizardSave = () => {
    const store = useStore.getState();
    const currentGestures = store.kineticGestures || [];

    const newGesture = {
      id: 'voice-macro-' + Math.random().toString(36).substring(7),
      name: voiceMacroName,
      action: voiceMacroAction as any,
      points: voiceMacroPoints,
      direction: 'custom'
    };

    store.setKineticGestures([...currentGestures, newGesture]);
    showToast(`🔮 Macro "${voiceMacroName}" successfully added!`, "success", 3000);
    triggerBrowserSpeechSynthesis(`Fantastic! I have saved and mapped your custom gesture macro.`);
    setVoiceMacroStep('idle');
  };

  const handleOpenAssistant = (shouldMinimize = false) => {
    // Close other system panels to prevent overlapping overlays
    try {
      const store = useStore.getState();
      store.setCommandPaletteOpen(false);
      store.setRightSidebarOpen(false);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        store.setSidebarOpen(false);
      }
    } catch (e) {
      console.warn('Could not sync store values on assistant open:', e);
    }

    setIsHubOpen(true);
    setIsAssistantMinimized(shouldMinimize);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    setHudTab('speak');
    setIsConversing(true);
    setAetherFeedback({
      explanation: "Ready & listening..."
    });
    setIsMicPermissionBlocked(false);
  };

  const handleCloseAssistant = () => {
    playDeactivationChime();
    setIsHubOpen(false);
    setIsAssistantMinimized(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeechActive(false);
    speakActiveRef.current = false;
    
    if (activeRecogRef.current) {
      try {
        activeRecogRef.current.onend = null;
        activeRecogRef.current.stop();
      } catch (e) {}
      activeRecogRef.current = null;
    }
    setIsListeningForSpeech(false);
  };

  useEffect(() => {
    handleCloseAssistantRef.current = handleCloseAssistant;
  }, [handleCloseAssistant]);

  const handleToggleMicListen = () => {
    if (isListeningForSpeech) {
      if (activeRecogRef.current) {
        try {
          activeRecogRef.current.onend = null;
          activeRecogRef.current.stop();
        } catch (e) {}
        activeRecogRef.current = null;
      }
      setIsListeningForSpeech(false);
      addVocalDiagnostic("ACTION: Stopped speech session via shortcut command.");
    } else {
      if (!isHubOpen) {
        handleOpenAssistant(false);
      }
      setTimeout(() => {
        startContinuousConversationalListen();
      }, 200);
    }
  };

  const handleClearConvo = () => {
    setConvoHistory([]);
    setAetherFeedback(null);
    addVocalDiagnostic("ACTION: Cleared conversation history via shortcut command.");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const handleToggleMute = () => {
    const nextMuteState = !isAetherMuted;
    toggleAetherMutedState(nextMuteState);
  };

  const handleNavProjects = () => {
    navigate('/projects');
    addVocalDiagnostic("ACTION: Directed user to Projects Workspace via shortcut command.");
  };

  const handleNavNotes = () => {
    navigate('/notes');
    addVocalDiagnostic("ACTION: Directed user to Notes Archival via shortcut command.");
  };

  const handleNavRoadmap = () => {
    navigate('/roadmap');
    addVocalDiagnostic("ACTION: Directed user to Roadmap via shortcut command.");
  };

  // Assignable Keyboard and Mouse Shortcut Listeners
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is writing in any inputs, textareas or editables
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      
      // 1. Activation keyboard key check
      if (matchesKeyboardShortcut(e, activationShortcutKey)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Activation key "${activationShortcutKey}" pressed.`);
        if (isHubOpen) {
          if (isAssistantMinimized) {
            setIsAssistantMinimized(false);
            addVocalDiagnostic(`ACTION: Restored conversation panel from sidebar.`);
          } else {
            // Already maximized: toggle minimize side panel
            setIsAssistantMinimized(true);
            addVocalDiagnostic(`ACTION: Docked conversation panel to sidebar.`);
          }
        } else {
          handleOpenAssistant(false);
        }
      }
      
      // 2. Stop/Minimize keyboard key check
      if (matchesKeyboardShortcut(e, stopShortcutKey)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Deactivation key "${stopShortcutKey}" pressed.`);
        if (isHubOpen) {
          setIsAssistantMinimized(true);
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setIsSpeechActive(false);
          speakActiveRef.current = false;
          
          if (activeRecogRef.current) {
            try {
              activeRecogRef.current.onend = null;
              activeRecogRef.current.stop();
            } catch (err) {}
            activeRecogRef.current = null;
          }
          setIsListeningForSpeech(false);
          addVocalDiagnostic(`ACTION: Stopped speech session and docked assistant to sidebar.`);
        }
      }

      // 3. Mic listen keyboard key check
      if (matchesKeyboardShortcut(e, micShortcutKey)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Mic toggle key "${micShortcutKey}" pressed.`);
        handleToggleMicListen();
      }

      // 4. Clear chat history keyboard key check
      if (matchesKeyboardShortcut(e, clearShortcutKey)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Clear history key "${clearShortcutKey}" pressed.`);
        handleClearConvo();
      }

      // 5. Toggle audio mute keyboard key check
      if (matchesKeyboardShortcut(e, muteVoiceShortcutKey)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Voice mute toggle key "${muteVoiceShortcutKey}" pressed.`);
        handleToggleMute();
      }

      // 6. Navigate to projects keyboard key check
      if (matchesKeyboardShortcut(e, navProjectsShortcutKey)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Navigate projects key "${navProjectsShortcutKey}" pressed.`);
        handleNavProjects();
      }

      // 7. Navigate to notes keyboard key check
      if (matchesKeyboardShortcut(e, navNotesShortcutKey)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Navigate notes key "${navNotesShortcutKey}" pressed.`);
        handleNavNotes();
      }

      // 8. Navigate to roadmap keyboard key check
      if (matchesKeyboardShortcut(e, navRoadmapShortcutKey)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Navigate roadmap key "${navRoadmapShortcutKey}" pressed.`);
        handleNavRoadmap();
      }
    };

    const handleGlobalMouseDown = (e: MouseEvent) => {
      // 1. Activation Mouse Trigger
      if (matchesMouseShortcut(e, activationShortcutMouse)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Activation mouse button "${activationShortcutMouse}" clicked.`);
        if (isHubOpen) {
          if (isAssistantMinimized) {
            setIsAssistantMinimized(false);
            addVocalDiagnostic(`ACTION: Restored conversation panel via mouse command.`);
          }
        } else {
          handleOpenAssistant(false);
        }
      }

      // 2. Stop/Minimize Mouse Trigger
      if (matchesMouseShortcut(e, stopShortcutMouse)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Deactivation mouse button "${stopShortcutMouse}" clicked.`);
        if (isHubOpen) {
          setIsAssistantMinimized(true);
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          setIsSpeechActive(false);
          speakActiveRef.current = false;
          
          if (activeRecogRef.current) {
            try {
              activeRecogRef.current.onend = null;
              activeRecogRef.current.stop();
            } catch (err) {}
            activeRecogRef.current = null;
          }
          setIsListeningForSpeech(false);
          addVocalDiagnostic(`ACTION: Stopped speech session and docked assistant via mouse command.`);
        }
      }

      // 3. Mic listen mouse trigger
      if (matchesMouseShortcut(e, micShortcutMouse)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Mic toggle mouse button "${micShortcutMouse}" clicked.`);
        handleToggleMicListen();
      }

      // 4. Clear chat mouse trigger
      if (matchesMouseShortcut(e, clearShortcutMouse)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Clear chat mouse button "${clearShortcutMouse}" clicked.`);
        handleClearConvo();
      }

      // 5. Toggle mute voice mouse trigger
      if (matchesMouseShortcut(e, muteVoiceShortcutMouse)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Voice mute mouse button "${muteVoiceShortcutMouse}" clicked.`);
        handleToggleMute();
      }

      // 6. Navigate to projects mouse trigger
      if (matchesMouseShortcut(e, navProjectsShortcutMouse)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Navigate projects mouse button "${navProjectsShortcutMouse}" clicked.`);
        handleNavProjects();
      }

      // 7. Navigate to notes mouse trigger
      if (matchesMouseShortcut(e, navNotesShortcutMouse)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Navigate notes mouse button "${navNotesShortcutMouse}" clicked.`);
        handleNavNotes();
      }

      // 8. Navigate to roadmap mouse trigger
      if (matchesMouseShortcut(e, navRoadmapShortcutMouse)) {
        e.preventDefault();
        addVocalDiagnostic(`SHORTCUT TRIGGERED: Navigate roadmap mouse button "${navRoadmapShortcutMouse}" clicked.`);
        handleNavRoadmap();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('mousedown', handleGlobalMouseDown, true); // Catch before standard page navigate triggers
    
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('mousedown', handleGlobalMouseDown, true);
    };
  }, [
    isHubOpen,
    isAssistantMinimized,
    activationShortcutKey,
    activationShortcutMouse,
    stopShortcutKey,
    stopShortcutMouse,
    micShortcutKey,
    micShortcutMouse,
    clearShortcutKey,
    clearShortcutMouse,
    muteVoiceShortcutKey,
    muteVoiceShortcutMouse,
    navProjectsShortcutKey,
    navProjectsShortcutMouse,
    navNotesShortcutKey,
    navNotesShortcutMouse,
    navRoadmapShortcutKey,
    navRoadmapShortcutMouse
  ]);

  // Manage Background Wake Word Listener lifecycle
  useEffect(() => {
    // If we are on the settings page, we let the Settings page's WakeWordEngine handle mic detection
    // to avoid device locks and microphone collisions!
    const isOnSettingsPage = location.pathname === '/settings';

    let timeoutId: any = null;
    if (isWakeWordEnabled && !isHubOpen && !isOnSettingsPage && !isAetherMuted) {
      timeoutId = setTimeout(() => {
        if (!backgroundRecogRef.current && isWakeWordEnabled && !isHubOpen && !isOnSettingsPage && !isAetherMuted) {
          startBackgroundWakeWord();
        }
      }, 400); // Safe delay to allow previous mic sessions to completely release
    } else {
      setIsWakeWordListening(false);
      if (backgroundRecogRef.current) {
        try {
          backgroundRecogRef.current.onend = null;
          backgroundRecogRef.current.onerror = null;
          backgroundRecogRef.current.stop();
        } catch (e) {}
        backgroundRecogRef.current = null;
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      setIsWakeWordListening(false);
      if (backgroundRecogRef.current) {
        try {
          backgroundRecogRef.current.onend = null;
          backgroundRecogRef.current.onerror = null;
          backgroundRecogRef.current.stop();
        } catch (e) {}
        backgroundRecogRef.current = null;
      }
    };
  }, [isWakeWordEnabled, isHubOpen, wakeWord, location.pathname]);

  // Listen for custom wake word events dispatched from other panels (e.g. Settings diagnostics)
  useEffect(() => {
    const handleCustomWakeWord = () => {
      if (!isHubOpen) {
        if (isWakeWordTriggeringRef.current) return;
        isWakeWordTriggeringRef.current = true;
        setTimeout(() => {
          isWakeWordTriggeringRef.current = false;
        }, 2500);

        addVocalDiagnostic("EVENT: Wake-word intercepted from custom event. Activating Aether...");
        playActivationChime();
        setWakeWordTriggerTime(Date.now());
        setIsHubOpen(true);
        setIsAssistantMinimized(false);
        setIsUltraCompact(false);
        setHudTab('speak');
        setIsConversing(true);

        const activeProjName = projects.find(p => p.id === activeProjectId)?.name;
        const greeting = aetherConversationalEngine.getGreeting(activeProjName);

        setAetherFeedback({
          explanation: greeting
        });
        triggerBrowserSpeechSynthesis(greeting);
        setIsMicPermissionBlocked(false);
      }
    };

    window.addEventListener('aether-wake-word-detected', handleCustomWakeWord);
    return () => {
      window.removeEventListener('aether-wake-word-detected', handleCustomWakeWord);
    };
  }, [isHubOpen]);

  // Explicit event listeners allowing the audio processing stream to accept user interrupts concurrently
  useEffect(() => {
    const handleVocalInterruptEvent = (e: Event) => {
      addVocalDiagnostic("EVENT: Received explicit window vocal/audio interrupt event. Cancelling AI speech output.");
      handleIntelligentInterrupt();
    };

    const handleUserInputStartEvent = (e: Event) => {
      addVocalDiagnostic("EVENT: Received explicit window user input event. Ensuring speech recognition handles interrupt concurrently.");
      if (isSpeechActive) {
        handleIntelligentInterrupt();
      }
    };

    window.addEventListener('aether-vocal-interrupt', handleVocalInterruptEvent);
    window.addEventListener('aether-audio-interrupt', handleVocalInterruptEvent);
    window.addEventListener('aether-user-input-start', handleUserInputStartEvent);

    return () => {
      window.removeEventListener('aether-vocal-interrupt', handleVocalInterruptEvent);
      window.removeEventListener('aether-audio-interrupt', handleVocalInterruptEvent);
      window.removeEventListener('aether-user-input-start', handleUserInputStartEvent);
    };
  }, [isSpeechActive]);

  // Handle external system close/open event signals to coordinate popups
  useEffect(() => {
    const handleCloseEvent = () => {
      handleCloseAssistant();
    };
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const shouldMinimize = customEvent.detail?.minimize || false;
      handleOpenAssistant(shouldMinimize);
    };

    window.addEventListener('aether-close-assistant', handleCloseEvent);
    window.addEventListener('aether-open-assistant', handleOpenEvent);
    return () => {
      window.removeEventListener('aether-close-assistant', handleCloseEvent);
      window.removeEventListener('aether-open-assistant', handleOpenEvent);
    };
  }, []);

  // Handle external text submission commands (e.g. from Kinetic HUD Overlay voice control)
  useEffect(() => {
    const handleSubmitCommandEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { text, openSidebar } = customEvent.detail || {};
      if (text && text.trim()) {
        if (openSidebar) {
          setIsHubOpen(true);
          if (!isRightSidebarOpen) {
            toggleRightSidebar();
          }
        }
        submitDirectConversationalText(text);
      }
    };

    window.addEventListener('aether-submit-command', handleSubmitCommandEvent);
    return () => {
      window.removeEventListener('aether-submit-command', handleSubmitCommandEvent);
    };
  }, [isProcessing, proposedAction, convoHistory]);

  // Synchronize Aether mode changes from Dynamic Island / TheBar
  useEffect(() => {
    const handleVoiceModeChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      const rawMode = customEvent.detail?.mode;
      if (!rawMode) return;
      const mode = (typeof rawMode === 'string' ? rawMode.toLowerCase() : '');

      if (mode === 'off' || mode === 'muted') {
        if (activeRecogRef.current) {
          try {
            activeRecogRef.current.onend = null;
            activeRecogRef.current.stop();
          } catch (err) {}
          activeRecogRef.current = null;
        }
        if (backgroundRecogRef.current) {
          try {
            backgroundRecogRef.current.onend = null;
            backgroundRecogRef.current.stop();
          } catch (err) {}
          backgroundRecogRef.current = null;
        }
        setIsListeningForSpeech(false);
        setIsConversing(false);
        isConversingRef.current = false;
        setIsWakeWordListening(false);
        aetherVoiceRegistry.stopSpeaking();
      } else if (mode === 'listening' || mode === 'always on' || mode === 'always_on') {
        setIsHubOpen(true);
        setIsConversing(true);
        isConversingRef.current = true;
        setHudTab('speak');
        startContinuousConversationalListen();
      } else if (mode === 'wake_word' || mode === 'waiting for keyword' || mode === 'wake') {
        setIsWakeWordEnabled(true);
        startBackgroundWakeWord();
      } else if (mode === 'context' || mode === 'focus') {
        setIsHubOpen(true);
        setHudTab('speak');
      }
    };

    const handleVoiceActivate = () => {
      setIsHubOpen(true);
      setIsConversing(true);
      isConversingRef.current = true;
      setHudTab('speak');
      startContinuousConversationalListen();
    };

    window.addEventListener('devspace:aether-voice-mode-changed', handleVoiceModeChanged);
    window.addEventListener('devspace:voice-activate', handleVoiceActivate);

    return () => {
      window.removeEventListener('devspace:aether-voice-mode-changed', handleVoiceModeChanged);
      window.removeEventListener('devspace:voice-activate', handleVoiceActivate);
    };
  }, []);

  // Manage Hands-Free Conversation Mode lifecycle
  useEffect(() => {
    if (isHubOpen) {
      // Opening popup MUST default to Open Hands-Free mode
      setIsConversing(true);
      isConversingRef.current = true;
      setHudTab('speak');

      // Warm up micro-permissions in the active document window context to avoid secure origin isolation
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach(track => track.stop());
          addVocalDiagnostic("SUCCESS: Warm-up mic feed captured & released. Permission granted!");
          startContinuousConversationalListen();
        })
        .catch((err) => {
          addVocalDiagnostic(`WARNING: Warm-up mic feed query failed with code: ${err.message}. Proceeding standalone.`);
          startContinuousConversationalListen();
        });
    } else {
      if (activeRecogRef.current) {
        try {
          activeRecogRef.current.onend = null;
          activeRecogRef.current.stop();
        } catch (e) {}
        activeRecogRef.current = null;
      }
      setIsListeningForSpeech(false);
      setSpeechTransitText('');
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    }

    return () => {
      if (activeRecogRef.current) {
        try {
          activeRecogRef.current.onend = null;
          activeRecogRef.current.stop();
        } catch (e) {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [isHubOpen, isConversing]);

  const startVoiceCapture = async () => {
    try {
      setAetherFeedback(null);
      chunksRef.current = [];
      setRecordingSeconds(0);
      setProcessingStatus('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/ogg';
      if (!MediaRecorder.isTypeSupported('audio/ogg')) mimeType = '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAndSynthesizeAudio();
      };

      // Interactive spectrum analyzer context
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;

        const srcNode = ctx.createMediaStreamSource(stream);
        srcNode.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const renderFrame = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const heights = Array.from(dataArray).slice(0, 16).map(val => 
            Math.max(4, Math.round((val / 255) * 36))
          );
          setFrequencyBuffer(heights);
          animationFrameRef.current = requestAnimationFrame(renderFrame);
        };
        renderFrame();
      } catch (err) {
        console.error("Visualizer initialization skipped or not supported:", err);
      }

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.error(err);
      setAetherFeedback({
        error: err.message || "Microphone access blocked. Please provide recording permissions."
      });
    }
  };

  const stopVoiceCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processAndSynthesizeAudio = async () => {
    if (chunksRef.current.length === 0) {
      setAetherFeedback({ error: "Empty recording buffer. Please speak louder into your microphone." });
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("Digitizing voice signature...");
    
    try {
      const audioBlob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          setProcessingStatus("Synaptic engine decoding intent...");

          const contextPayload = projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description
          }));

          await requestAetherStream({
            audioData: base64Data,
            mimeType: audioBlob.type,
            projectContexts: contextPayload,
            cortexSynapses: cortexSynapses || [],
            notes: notes || [],
            aetherPersonalityRules: aetherPersonalityRules || [],
            history: convoHistory,
            pendingNote: pendingNote,
            activeProjectId,
            currentPath: location.pathname,
            circledContexts: circledContexts || []
          });
        } catch (innerErr: any) {
          console.error(innerErr);
          setAetherFeedback({ error: innerErr.message || "Failed decoding audio packet." });
        } finally {
          setIsProcessing(false);
          cleanupAudioRecording();
        }
      };
    } catch (err: any) {
      console.error(err);
      setAetherFeedback({ error: "Audio reading failed." });
      setIsProcessing(false);
      cleanupAudioRecording();
    }
  };

  const checkVoiceTriggers = (inputText: string): boolean => {
    if (!inputText) return false;
    const cleanInput = inputText.toLowerCase().trim().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");
    
    // -----------------------------------------------------------------
    // AETHER IDENTITY & CONVERSATIONAL INTELLIGENCE INTERCEPTOR
    // -----------------------------------------------------------------
    if (
      cleanInput.includes("google") ||
      cleanInput.includes("search") ||
      cleanInput.includes("youtube") ||
      cleanInput.includes("video") ||
      cleanInput.includes("tutorial") ||
      cleanInput.includes("screencast") ||
      cleanInput.includes("look up") ||
      cleanInput.includes("find information") ||
      cleanInput.includes("research") ||
      cleanInput.includes("call me") ||
      cleanInput.includes("my name is") ||
      cleanInput.includes("what should you call me") ||
      cleanInput.includes("what is my name") ||
      cleanInput.includes("what can you do") ||
      cleanInput.includes("capabilities") ||
      cleanInput.includes("take me to") ||
      cleanInput.includes("take me back") ||
      cleanInput.includes("previous project") ||
      cleanInput.includes("call") ||
      cleanInput.includes("remember this") ||
      cleanInput.includes("when i say") ||
      cleanInput.includes("whenever i say") ||
      cleanInput.startsWith("open") ||
      cleanInput.startsWith("go to") ||
      cleanInput.startsWith("switch to") ||
      cleanInput.startsWith("create") ||
      cleanInput.includes("show me the issues") ||
      cleanInput.includes("open issues") ||
      cleanInput.includes("blockers") ||
      cleanInput.includes("blocking") ||
      cleanInput.includes("what was i working on") ||
      cleanInput.includes("what did i work on") ||
      cleanInput.includes("what changed") ||
      cleanInput.includes("whats changed") ||
      cleanInput.includes("what should i work on") ||
      cleanInput.includes("what is going on with") ||
      cleanInput.includes("whats going on with") ||
      cleanInput.includes("brainstorm") ||
      cleanInput.includes("ideas") ||
      cleanInput.includes("give me") ||
      cleanInput.includes("save the second") ||
      cleanInput.includes("save idea") ||
      cleanInput.includes("save this idea") ||
      cleanInput.includes("turn that into an issue") ||
      cleanInput.includes("turn the second idea into an issue") ||
      cleanInput.includes("make it an idea") ||
      cleanInput.includes("actually make it an idea") ||
      cleanInput.includes("subissue") ||
      cleanInput.includes("sub task") ||
      cleanInput.includes("sub-issue") ||
      cleanInput.includes("safe to merge") ||
      cleanInput.includes("check merge") ||
      cleanInput.includes("merge safety") ||
      cleanInput.includes("open repo") ||
      cleanInput.includes("connected repo") ||
      cleanInput.includes("compare") ||
      cleanInput.includes("save as note") ||
      cleanInput.includes("save this as a note") ||
      cleanInput.includes("make it high priority") ||
      cleanInput.includes("make it medium priority") ||
      cleanInput.includes("make it low priority") ||
      cleanInput.includes("make it critical") ||
      cleanInput.includes("about it") ||
      cleanInput.includes("explaining") ||
      cleanInput.includes("explanation") ||
      cleanInput.includes("open the second") ||
      cleanInput.includes("open the first") ||
      cleanInput.includes("open option") ||
      cleanInput.includes("which one") ||
      cleanInput.includes("recommend") ||
      cleanInput.includes("pull that website up") ||
      cleanInput.includes("what does this mean") ||
      cleanInput.includes("stop") ||
      cleanInput.includes("cancel")
    ) {
      aetherConversationalEngine.processUserMessageAsync(inputText, projects, activeProjectId, {
        onNavigate: (path, projId) => {
          if (projId) setActiveProjectId(projId);
          navigate(path);
        },
        onProjectCreate: async (data) => {
          const newId = addProject({
            name: data.name,
            description: data.description || "Created via Aether voice command.",
            status: 'Planning',
            brainstormIdeas: [],
            seenRecommendedIdeas: [],
            dreamRecommendations: []
          });
          setActiveProjectId(newId);
          navigate('/projects');
          return { id: newId, name: data.name };
        },
        onIssueCreate: async (data) => {
          const issueId = addIssue({
            title: data.title,
            description: 'Created via Aether voice command.',
            status: 'Todo',
            priority: (data.priority as any) || 'Medium',
            type: (data.type as any) || 'Task',
            projectId: data.projectId,
            labels: ['aether', 'voice'],
            ...(data.parentId ? { parentId: data.parentId } : {})
          });
          return { id: issueId, title: data.title };
        },
        onIssueUpdate: async (data) => {
          if (data.id) {
            updateIssue(data.id, {
              ...(data.title ? { title: data.title } : {}),
              ...(data.priority ? { priority: data.priority as any } : {}),
              ...(data.status ? { status: data.status as any } : {})
            });
          }
        },
        onIssueDelete: async (issueId) => {
          if (issueId) {
            deleteIssue(issueId);
          }
        },
        onNoteCreate: async (data) => {
          addNote({
            title: data.title,
            content: data.content || '',
            projectId: data.projectId || activeProjectId
          });
        },
        onIdeaCreate: async (data) => {
          const targetProj = projects.find(p => p.id === (data.projectId || activeProjectId));
          if (targetProj) {
            const currentIdeas = targetProj.brainstormIdeas || [];
            updateProject(targetProj.id, {
              brainstormIdeas: [
                ...currentIdeas,
                {
                  id: `idea-${Date.now()}`,
                  text: data.title,
                  details: data.description || '',
                  status: 'approved' as const,
                  createdAt: Date.now()
                }
              ]
            });
          }
        },
        openUrl: (url) => {
          window.open(url, '_blank');
        },
        launchApp: (appName) => {
          aetherDesktopIntelligence.launchApp(appName);
        }
      }).then(processed => {
        if (processed && processed.responseText) {
          setConvoHistory(prev => [
            ...prev,
            { role: 'user' as const, text: inputText },
            { role: 'model' as const, text: processed.responseText }
          ].slice(-10));

          setAetherFeedback({
            transcript: inputText,
            explanation: processed.responseText,
            intent: 'conversational_action',
            triggeredAction: `🗣️ Aether Intelligence: ${processed.responseText.slice(0, 50)}...`
          });
          triggerBrowserSpeechSynthesis(processed.speechText || processed.responseText);

          if (processed.actionToExecute) {
            executeProposedAction(processed.actionToExecute);
          }
        }
      });
      return true;
    }

    // -----------------------------------------------------------------
    // SPECIAL CORE VOICE COMMANDS FOR ETHER (AETHER AI) STATE CHANGING
    // -----------------------------------------------------------------
    const cleanNoAether = cleanInput.replace(/^(aether|ether|heather|hey aether|hey ether)\s+/, "").trim();

    // 1. Mute and turn off
    if (cleanInput.includes("mute yourself and turn off") || cleanInput.includes("mute and turn off") || cleanNoAether === "mute yourself and turn off" || cleanNoAether === "turn off and mute") {
      const feedbackMsg = "Understood. Muting myself and turning off.";
      setAetherFeedback({
        transcript: inputText,
        explanation: feedbackMsg,
        intent: 'settings_change',
        triggeredAction: "🔇 Aether: Muted & Off"
      });
      triggerBrowserSpeechSynthesis(feedbackMsg);
      
      // Fully turn off
      window.dispatchEvent(new CustomEvent('aether-logo-toggle', { detail: { open: false, mute: true } }));
      if (setIsWakeWordEnabled) setIsWakeWordEnabled(false);
      localStorage.setItem('isAetherMuted', 'true');
      window.dispatchEvent(new Event('aether-mute-sync'));
      useStore.getState().setDrawingModeActive(false);
      
      return true;
    }

    // 2. Turn off
    if (cleanInput.includes("turn off") || cleanNoAether === "turn off" || cleanInput === "turn off") {
      const feedbackMsg = "Aether turning off. Goodbye!";
      setAetherFeedback({
        transcript: inputText,
        explanation: feedbackMsg,
        intent: 'settings_change',
        triggeredAction: "🔇 Aether: Off"
      });
      triggerBrowserSpeechSynthesis(feedbackMsg);

      // Fully turn off
      window.dispatchEvent(new CustomEvent('aether-logo-toggle', { detail: { open: false, mute: true } }));
      if (setIsWakeWordEnabled) setIsWakeWordEnabled(false);
      localStorage.setItem('isAetherMuted', 'true');
      window.dispatchEvent(new Event('aether-mute-sync'));
      useStore.getState().setDrawingModeActive(false);

      return true;
    }

    // 3. Mute yourself
    if (cleanInput.includes("mute yourself") || cleanInput === "mute yourself" || cleanNoAether === "mute yourself" || cleanInput === "mute") {
      const feedbackMsg = "Muting myself now.";
      setAetherFeedback({
        transcript: inputText,
        explanation: feedbackMsg,
        intent: 'settings_change',
        triggeredAction: "🔇 Aether: Muted"
      });
      triggerBrowserSpeechSynthesis(feedbackMsg);

      // Mute
      window.dispatchEvent(new CustomEvent('aether-logo-toggle', { detail: { open: false, mute: true } }));
      localStorage.setItem('isAetherMuted', 'true');
      window.dispatchEvent(new Event('aether-mute-sync'));

      return true;
    }

    // 4. Switch to context mode / context mode / switches context mode
    if (
      cleanInput.includes("switch context mode") || 
      cleanInput.includes("switches context mode") || 
      cleanInput.includes("switch to context mode") || 
      cleanInput.includes("switches to context mode") || 
      cleanInput.includes("context mode") || 
      cleanNoAether === "context" || 
      cleanNoAether === "context mode" || 
      cleanNoAether === "switches context mode" || 
      cleanNoAether === "can you show context" || 
      cleanInput.includes("show context") || 
      cleanInput.includes("can you show context")
    ) {
      const feedbackMsg = "Switched to Aether Intelligence. You can now draw or circle areas with your mouse or hold Alt and drag to create selection regions.";
      setAetherFeedback({
        transcript: inputText,
        explanation: feedbackMsg,
        intent: 'settings_change',
        triggeredAction: "🎯 Aether Intelligence Activated"
      });
      triggerBrowserSpeechSynthesis(feedbackMsg);

      // Activate open on context mode
      window.dispatchEvent(new CustomEvent('aether-logo-toggle', { detail: { open: true, mute: false } }));
      if (setIsWakeWordEnabled) setIsWakeWordEnabled(true);
      localStorage.setItem('isAetherMuted', 'false');
      window.dispatchEvent(new Event('aether-mute-sync'));
      useStore.getState().setDrawingModeActive(true);

      return true;
    }

    // ==========================================
    // VOICE-ACTIVATED MACRO WIZARD INTERCEPTORS
    // ==========================================
    if (voiceMacroStep === 'naming') {
      if (cleanInput.includes("start recording") || cleanInput.includes("record motion") || cleanInput.includes("next") || cleanInput.includes("record gesture")) {
        handleWizardStartCountdown();
        return true;
      }
      if (cleanInput.includes("cancel") || cleanInput.includes("stop") || cleanInput.includes("exit")) {
        setVoiceMacroStep('idle');
        const msg = "Macro creation cancelled.";
        triggerBrowserSpeechSynthesis(msg);
        showToast(msg, 'info');
        return true;
      }
    }

    if (voiceMacroStep === 'confirm') {
      if (cleanInput.includes("re record") || cleanInput.includes("record again") || cleanInput.includes("try again") || cleanInput.includes("got it wrong")) {
        handleWizardStartCountdown();
        return true;
      }
      if (cleanInput.includes("yes thats good") || cleanInput.includes("confirm") || cleanInput.includes("save") || cleanInput.includes("yes") || cleanInput.includes("good")) {
        handleWizardSave();
        return true;
      }
      if (cleanInput.includes("test") || cleanInput.includes("run test") || cleanInput.includes("execute")) {
        handleWizardTest();
        return true;
      }
      if (cleanInput.includes("cancel") || cleanInput.includes("stop") || cleanInput.includes("exit")) {
        setVoiceMacroStep('idle');
        const msg = "Macro creation cancelled.";
        triggerBrowserSpeechSynthesis(msg);
        showToast(msg, 'info');
        return true;
      }
    }

    // ==========================================
    // SPATIAL SETTINGS / CONTROLS INTERCEPTORS
    // ==========================================
    // Dynamic Camera Resizing Voice Commands
    if (cleanInput.includes("make it") && (cleanInput.includes("bigger") || cleanInput.includes("larger") || cleanInput.includes("smaller") || cleanInput.includes("tiny"))) {
      let percent = 25;
      const numMatch = cleanInput.match(/(\d+)\s*%/);
      if (numMatch) {
        percent = parseInt(numMatch[1], 10);
      }
      const isBigger = cleanInput.includes("bigger") || cleanInput.includes("larger");
      const changeType = isBigger ? 'increase' : 'decrease';
      window.dispatchEvent(new CustomEvent('kinetic-camera-control', {
        detail: { action: 'resize-percent', type: changeType, percent }
      }));
      const msg = `Resizing the camera preview. I have made it ${percent}% ${isBigger ? 'bigger' : 'smaller'} for you.`;
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: `📐 Camera Resized`
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    if (cleanInput.includes("make the camera") && (cleanInput.includes("bigger") || cleanInput.includes("larger") || cleanInput.includes("smaller") || cleanInput.includes("twice as big") || cleanInput.includes("double the size"))) {
      let percent = 25;
      let isBigger = true;
      if (cleanInput.includes("twice as big") || cleanInput.includes("double")) {
        percent = 100;
      } else {
        const numMatch = cleanInput.match(/(\d+)\s*%/);
        if (numMatch) {
          percent = parseInt(numMatch[1], 10);
        }
        isBigger = cleanInput.includes("bigger") || cleanInput.includes("larger");
      }
      const changeType = isBigger ? 'increase' : 'decrease';
      window.dispatchEvent(new CustomEvent('kinetic-camera-control', {
        detail: { action: 'resize-percent', type: changeType, percent }
      }));
      const msg = `Resizing the camera preview. I have made it ${percent}% ${isBigger ? 'bigger' : 'smaller'} for you.`;
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: `📐 Camera Resized`
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    if (cleanInput.includes("reset camera size") || cleanInput.includes("make the camera normal") || cleanInput.includes("camera original size") || cleanInput.includes("make it normal size")) {
      window.dispatchEvent(new CustomEvent('kinetic-camera-control', {
        detail: { action: 'resize-reset' }
      }));
      const msg = `I have reset the camera preview to its default size.`;
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: `📐 Camera Size Reset`
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Voice command: Rename / label the last circled context region and save to Obsidian brain
    const areaNameRegex = /(?:from\s+now\s+on\s+)?(?:this\s+area\s+is\s+called|this\s+area\s+is\s+the|this\s+area\s+is|name\s+this\s+area|call\s+this\s+area|this\s+is\s+the|this\s+area\s+is\s+the|this\s+means\s+that|this\s+means|this\s+represents|this\s+signifies)\s+(.+)/i;
    const areaMatch = cleanInput.match(areaNameRegex);
    if (areaMatch) {
      const currentContexts = [...useStore.getState().circledContexts];
      if (currentContexts.length > 0) {
        const lastIndex = currentContexts.length - 1;
        const lastContext = currentContexts[lastIndex];
        // Match raw casing if possible by finding the substring in inputText
        const targetLabelRaw = (inputText.match(/(?:this\s+area\s+is\s+called|this\s+area\s+is\s+the|this\s+area\s+is|name\s+this\s+area|call\s+this\s+area|this\s+is\s+the|this\s+area\s+is\s+the|this\s+means\s+that|this\s+means|this\s+represents|this\s+signifies)\s+(.+)/i)?.[1] || areaMatch[1]).trim().replace(/[.?]/g, "");
        currentContexts[lastIndex] = {
          ...currentContexts[lastIndex],
          label: targetLabelRaw
        };
        useStore.getState().setCircledContexts(currentContexts);

        // Also add directly as a permanent rule to the Obsidian Synaptic Cortex brain!
        const newSyn = {
          id: `synapse-${crypto.randomUUID()}`,
          name: `Anchor: ${targetLabelRaw}`,
          desc: `User defined screen context region representing: ${targetLabelRaw}. Added via active visual context mode.`,
          type: 'custom_synapse' as const,
          createdAt: Date.now()
        };
        setCortexSynapses(prev => [...(prev || []), newSyn]);

        const msg = `Acknowledged. I have labeled this circled region as "${targetLabelRaw}", saved this guideline to my Obsidian brain, and integrated it into active memory context.`;
        setAetherFeedback({
          transcript: inputText,
          explanation: msg,
          intent: 'add_cortex_synapse',
          triggeredAction: `🧠 Saved brain rule: "${targetLabelRaw}"`
        });
        triggerBrowserSpeechSynthesis(msg);
        return true;
      } else {
        const msg = `You asked to label an area, but I couldn't find any active circled regions. Please circle an area with your mouse or hold Alt and drag to define a region first!`;
        setAetherFeedback({
          transcript: inputText,
          explanation: msg,
          intent: 'chat_query'
        });
        triggerBrowserSpeechSynthesis(msg);
        return true;
      }
    }

    // Voice command: Clear circled areas
    if (cleanInput.includes("clear circled areas") || cleanInput.includes("clear circled contexts") || cleanInput.includes("clear all circled areas") || cleanInput.includes("clear target boxes") || cleanInput.includes("delete all circled")) {
      useStore.getState().clearCircledContexts();
      const msg = "I have cleared all circled screen regions and reset active spatial context anchors.";
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: "🧹 Cleared Circled Contexts"
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Toggle Camera Only Mode
    if (cleanInput.includes("only want the camera") || cleanInput.includes("only want camera preview") || cleanInput.includes("camera only mode") || cleanInput.includes("hide gesture hud") || cleanInput.includes("hide the spatial hud") || cleanInput.includes("clean camera preview") || cleanInput.includes("hide all the kinetic") || cleanInput.includes("hide cursor and hud")) {
      window.dispatchEvent(new CustomEvent('kinetic-camera-control', {
        detail: { action: 'set-camera-only', value: true }
      }));
      const msg = "I have activated clean Camera Only Mode. All kinetic HUD overlays and joint trackers are now hidden.";
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: "👁️ Clean Camera Mode Enabled"
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    if (cleanInput.includes("restore the hud") || cleanInput.includes("show gesture hud") || cleanInput.includes("show spatial hud") || cleanInput.includes("show tracking overlay") || cleanInput.includes("disable camera only mode") || cleanInput.includes("show full hud")) {
      window.dispatchEvent(new CustomEvent('kinetic-camera-control', {
        detail: { action: 'set-camera-only', value: false }
      }));
      const msg = "I have restored the full spatial HUD tracking visuals and joint coordinates for you.";
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: "🖥️ Spatial HUD Visuals Restored"
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Disabling macro/gesture/spatial modes
    if (cleanInput.includes("disable macro mode") || cleanInput.includes("disable spatial mode") || cleanInput.includes("disable gesture mode") || cleanInput.includes("turn off camera tracking") || cleanInput.includes("disable spatial camera") || cleanInput.includes("disable spatial tracking")) {
      const store = useStore.getState();
      store.setKineticEnabled(false);
      const msg = "I have disabled Spatial Camera and Macro Mode for you.";
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: "🔇 Spatial Camera Disabled"
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Switching to cursor mode
    if (cleanInput.includes("switch to cursor mode") || cleanInput.includes("enable cursor mode") || cleanInput.includes("activate cursor mode") || cleanInput.includes("turn on cursor mode")) {
      const store = useStore.getState();
      store.setKineticEnabled(true);
      store.setKineticInteractionMode('cursor');
      const msg = "I have activated the Spatial Cursor navigation mode. Move your index finger to control the cursor!";
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: "🖱️ Switched to Cursor Mode"
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Switching to macro/gesture mode
    if (cleanInput.includes("switch to macro mode") || cleanInput.includes("switch to gesture mode") || cleanInput.includes("enable macro mode") || cleanInput.includes("enable gesture mode") || cleanInput.includes("turn on macro mode") || cleanInput.includes("turn on gesture mode")) {
      const store = useStore.getState();
      store.setKineticEnabled(true);
      store.setKineticInteractionMode('gesture');
      const msg = "I have switched you to Spatial Macro mode. Your gestures and poses will trigger actions!";
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: "🖐️ Switched to Macro Mode"
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Cooldown settings query
    if (cleanInput.includes("what is the cooldown time") || cleanInput.includes("what is the cool down time") || cleanInput.includes("what is the cooldown duration") || cleanInput.includes("check gesture cooldown") || cleanInput.includes("check cooldown")) {
      const store = useStore.getState();
      const seconds = (store.gestureCooldownDuration / 1000).toFixed(1);
      const msg = `The current gesture cooldown time is configured to ${seconds} seconds.`;
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_query',
        triggeredAction: "⏱️ Inspected Cooldown Duration"
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Cooldown settings mutation
    const cooldownMatch = cleanInput.match(/(?:change|set|update|cooldown|cool down)(?:\s+the)?(?:\s+cooldown)?(?:\s+time|\s+duration)?(?:\s+to)?\s+(\d+(?:\.\d+)?)\s*(second|sec|s|millisecond|ms)/i) || 
                          cleanInput.match(/(?:change|set|update)(?:\s+the)?(?:\s+cooldown)?(?:\s+time|\s+duration)?(?:\s+to)?\s+(\d+(?:\.\d+)?)\s*(?:seconds|second|sec|s|ms|milliseconds)/i);
    if (cooldownMatch) {
      const value = parseFloat(cooldownMatch[1]);
      const unit = cooldownMatch[2] ? cooldownMatch[2].toLowerCase() : 'second';
      const ms = (unit.startsWith('ms') || unit.startsWith('milli')) ? value : value * 1000;
      const store = useStore.getState();
      store.setGestureCooldownDuration(ms);
      const msg = `I have updated the gesture execution cooldown to ${(ms / 1000).toFixed(1)} seconds.`;
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: `⏱️ Cooldown Set to ${(ms / 1000).toFixed(1)}s`
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Cursor sensitivity query
    if (cleanInput.includes("what is the cursor sensitivity") || cleanInput.includes("check cursor sensitivity") || cleanInput.includes("what is our sensitivity")) {
      const store = useStore.getState();
      const sens = Math.round((store.cursorSensitivity || 1.0) * 100);
      const msg = `The current Spatial Cursor sensitivity is set to ${sens} percent.`;
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_query',
        triggeredAction: "🖱️ Inspected Cursor Sensitivity"
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Cursor sensitivity relative adjustment
    let targetSens: number | null = null;
    let desc = "";
    if (cleanInput.includes("more sensitive") || cleanInput.includes("increase sensitivity") || cleanInput.includes("make cursor faster")) {
      const store = useStore.getState();
      const current = store.cursorSensitivity || 1.0;
      const pctMatch = cleanInput.match(/(\d+)\s*%/);
      const multiplier = pctMatch ? 1 + (parseFloat(pctMatch[1]) / 100) : 1.25;
      targetSens = Math.max(0.2, Math.min(5.0, current * multiplier));
      desc = `${pctMatch ? pctMatch[1] + '%' : '25%'} more sensitive`;
    } else if (cleanInput.includes("less sensitive") || cleanInput.includes("decrease sensitivity") || cleanInput.includes("make cursor slower")) {
      const store = useStore.getState();
      const current = store.cursorSensitivity || 1.0;
      const pctMatch = cleanInput.match(/(\d+)\s*%/);
      const multiplier = pctMatch ? 1 - (parseFloat(pctMatch[1]) / 100) : 0.75;
      targetSens = Math.max(0.2, Math.min(5.0, current * multiplier));
      desc = `${pctMatch ? pctMatch[1] + '%' : '25%'} less sensitive`;
    } else {
      // Direct sensitivity set, e.g. "set cursor sensitivity to 150%" or "sensitivity to 1.5"
      const setMatch = cleanInput.match(/(?:set|change|sensitivity)(?:\s+cursor)?(?:\s+sensitivity)?(?:\s+to)?\s+(\d+)\s*%/i);
      if (setMatch) {
        const pct = parseFloat(setMatch[1]);
        targetSens = Math.max(0.2, Math.min(5.0, pct / 100));
        desc = `to ${pct}%`;
      } else {
        const floatMatch = cleanInput.match(/(?:set|change|sensitivity)(?:\s+cursor)?(?:\s+sensitivity)?(?:\s+to)?\s+(\d+\.\d+)/i);
        if (floatMatch) {
          const val = parseFloat(floatMatch[1]);
          targetSens = Math.max(0.2, Math.min(5.0, val));
          desc = `to ${Math.round(val * 100)}%`;
        }
      }
    }

    if (targetSens !== null) {
      const store = useStore.getState();
      store.setCursorSensitivity(targetSens);
      const sensPercent = Math.round(targetSens * 100);
      const msg = `I have adjusted the Spatial Cursor sensitivity to ${sensPercent} percent (modified ${desc}).`;
      setAetherFeedback({
        transcript: inputText,
        explanation: msg,
        intent: 'settings_change',
        triggeredAction: `🖱️ Sensitivity set to ${sensPercent}%`
      });
      triggerBrowserSpeechSynthesis(msg);
      return true;
    }

    // Interactive Voice Macro Recording wizard trigger
    if (cleanInput.includes("record and add") || cleanInput.includes("create a new macro") || cleanInput.includes("add a new macro") || cleanInput.includes("create custom hand gesture") || cleanInput.includes("create a custom gesture")) {
      let actionToBind = 'toggle-sidebar';
      let actionName = 'Custom Gesture';
      
      if (cleanInput.includes("right sidebar") || cleanInput.includes("right panel")) {
        actionToBind = 'toggle-right-sidebar';
        actionName = 'Toggle Right Sidebar';
      } else if (cleanInput.includes("sidebar") || cleanInput.includes("side panel")) {
        actionToBind = 'toggle-sidebar';
        actionName = 'Toggle Left Sidebar';
      } else if (cleanInput.includes("clear chat") || cleanInput.includes("clear conversation")) {
        actionToBind = 'clear-chat';
        actionName = 'Clear Conversation';
      } else if (cleanInput.includes("zen") || cleanInput.includes("peace")) {
        actionToBind = 'zen-mode';
        actionName = 'Zen Space';
      } else if (cleanInput.includes("quick note") || cleanInput.includes("make a note")) {
        actionToBind = 'create-quick-note';
        actionName = 'Quick Capture Note';
      } else if (cleanInput.includes("dashboard") || cleanInput.includes("home")) {
        actionToBind = 'nav-dashboard';
        actionName = 'Navigate Dashboard';
      } else if (cleanInput.includes("projects") || cleanInput.includes("project page")) {
        actionToBind = 'nav-projects';
        actionName = 'Navigate Projects';
      } else if (cleanInput.includes("notes") || cleanInput.includes("note page")) {
        actionToBind = 'nav-notes';
        actionName = 'Navigate Notes';
      } else if (cleanInput.includes("settings") || cleanInput.includes("options")) {
        actionToBind = 'nav-settings';
        actionName = 'Navigate Settings';
      } else if (cleanInput.includes("docs") || cleanInput.includes("documents")) {
        actionToBind = 'nav-docs';
        actionName = 'Navigate Workspace Docs';
      }

      // Check contradiction for this action in existing gestures
      const currentGestures = useStore.getState().kineticGestures || [];
      const clashingGesture = currentGestures.find(g => g.action === actionToBind);
      let contradictionMsg = null;
      if (clashingGesture) {
        contradictionMsg = `An existing macro "${clashingGesture.name}" is already assigned to this action.`;
      }

      setVoiceMacroName(actionName);
      setVoiceMacroAction(actionToBind);
      setVoiceMacroPoints([]);
      setVoiceMacroContradiction(contradictionMsg);
      setVoiceMacroStep('naming');
      
      const vocalGreeting = `Let's set up a new custom macro called ${actionName}. ${contradictionMsg ? contradictionMsg + ' But we can still register a new motion.' : 'No clashing macros detected!'} Let's record the custom hand motion now. Please tap Start Recording or say 'start recording' when you are ready to gesture!`;
      
      setAetherFeedback({
        transcript: inputText,
        explanation: vocalGreeting,
        intent: 'create_macro',
        triggeredAction: "🔮 Initiated Voice Macro Setup"
      });
      triggerBrowserSpeechSynthesis(vocalGreeting);
      setIsAssistantMinimized(useStore.getState().isKineticEnabled);
      return true;
    }

    // Custom Sidebar / Minimize Command
    const sidebarCommandPhrases = [
      'sidebar', 'ether sidebar', 'aether sidebar', 'go to sidebar', 'minimize', 'minimize to sidebar', 'move to sidebar', 'dock to sidebar', 'dock'
    ];
    if (sidebarCommandPhrases.some(phrase => cleanInput.includes(phrase))) {
      setIsAssistantMinimized(true);
      const feedbackMsg = "I have moved to the sidebar.";
      setAetherFeedback({
        transcript: inputText,
        explanation: feedbackMsg,
        intent: 'navigation_trigger',
        triggeredAction: "🖥️ Switched to Sidebar Mode"
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedbackMsg }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedbackMsg);
      }
      return true;
    }

    // Custom Full Screen / Maximize Command
    const fullscreenCommandPhrases = [
      'full screen', 'ether full screen', 'aether full screen', 'go to full screen', 'maximize', 'maximize to full screen', 'full screen mode', 'expand'
    ];
    if (fullscreenCommandPhrases.some(phrase => cleanInput.includes(phrase))) {
      setIsAssistantMinimized(false);
      const feedbackMsg = "Expanding to full screen.";
      setAetherFeedback({
        transcript: inputText,
        explanation: feedbackMsg,
        intent: 'navigation_trigger',
        triggeredAction: "🖥️ Switched to Full Screen Mode"
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedbackMsg }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedbackMsg);
      }
      return true;
    }

    // 1. Direct/General projects section navigation (bypass clarification)
    const generalProjectsPhrases = [
      'take me to projects', 'go to projects', 'open projects', 'show projects', 'projects page', 'view projects', 'projects', 'navigate to projects',
      'take me to my projects', 'open my projects', 'show my projects', 'navigate to my projects', 'go to my projects', 'my projects',
      'workspace projects', 'open workspace projects'
    ];
    if (generalProjectsPhrases.some(phrase => cleanInput.includes(phrase)) || cleanInput === 'projects' || cleanInput === 'project') {
      setPendingProjectClarification(null); // Clear any pending clarification
      setActiveProjectId(null); // Reset active project to general context
      navigate('/projects');
      setIsAssistantMinimized(true); // Minimize on navigation
      const { feedback, actionName } = getContextFollowUp('/projects');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General notes section navigation
    const generalNotesPhrases = [
      'take me to notes', 'go to notes', 'open notes', 'show notes', 'notes page', 'view notes', 'notes', 'navigate to notes',
      'take me to my notes', 'open my notes', 'show my notes', 'navigate to my notes', 'go to my notes', 'my notes',
      'workspace notes', 'open workspace notes', 'notebook', 'open notebook', 'go to notebook'
    ];
    if (generalNotesPhrases.includes(cleanInput) || cleanInput === 'notes' || cleanInput === 'note') {
      setPendingProjectClarification(null); // Clear any pending clarification
      navigate('/notes');
      setIsAssistantMinimized(true); // Minimize on navigation
      const { feedback, actionName } = getContextFollowUp('/notes');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Issues section navigation
    const generalIssuesPhrases = [
      'take me to issues', 'go to issues', 'open issues', 'show issues', 'issues page', 'view issues', 'issues', 'navigate to issues',
      'take me to my issues', 'open my issues', 'show my issues', 'navigate to my issues', 'go to my issues', 'my issues',
      'tasks', 'open tasks', 'go to tasks', 'take me to tasks', 'my tasks', 'backlog', 'go to backlog', 'view backlog'
    ];
    if (generalIssuesPhrases.includes(cleanInput) || cleanInput === 'issues' || cleanInput === 'issue') {
      setPendingProjectClarification(null);
      navigate('/issues');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/issues');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Sandbox Loop section navigation
    const generalSandboxPhrases = [
      'take me to sandbox loop', 'go to sandbox loop', 'open sandbox loop', 'show sandbox loop', 'sandbox loop page', 'view sandbox loop', 'sandbox loop', 'navigate to sandbox loop',
      'take me to my sandbox loop', 'open my sandbox loop', 'show my sandbox loop', 'navigate to my sandbox loop', 'go to my sandbox loop', 'my sandbox loop',
      'sandbox', 'open sandbox', 'go to sandbox', 'take me to sandbox', 'my sandbox', 'sandbox-loop'
    ];
    if (generalSandboxPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/sandbox-loop');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/sandbox-loop');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Automations section navigation
    const generalAutomationsPhrases = [
      'take me to automations', 'go to automations', 'open automations', 'show automations', 'automations page', 'view automations', 'automations', 'navigate to automations',
      'take me to my automations', 'open my automations', 'show my automations', 'navigate to my automations', 'go to my automations', 'my automations',
      'automation', 'open automation', 'go to automation', 'take me to automation', 'my automation', 'autopilot', 'recurring'
    ];
    if (generalAutomationsPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/automations');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/automations');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Workspace Docs section navigation
    const generalDocsPhrases = [
      'take me to workspace docks', 'take me to my workspace docks', 'workspace docks', 'my workspace docks',
      'take me to workspace docs', 'take me to my workspace docs', 'workspace docs', 'my workspace docks',
      'go to workspace docs', 'open workspace docs', 'show workspace docs',
      'take me to docs', 'go to docs', 'open docs', 'show docs', 'docs',
      'documentation', 'workspace documentation'
    ];
    if (generalDocsPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/docs');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/docs');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Analogous / Agents section navigation
    const generalAgentsPhrases = [
      'take me to analogous', 'take me to my analogous', 'analogous', 'my analogous',
      'take me to agents', 'take me to my agents', 'agents', 'my agents',
      'go to agents', 'open agents', 'show agents', 'agentic os', 'agents sandbox', 'agent sandbox',
      'take me to analogy', 'analogy'
    ];
    if (generalAgentsPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/agents');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/agents');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Project Brain section navigation
    const generalBrainPhrases = [
      'take me to project brain', 'take me to my project brain', 'project brain', 'my project brain',
      'take me to brain', 'take me to my brain', 'brain', 'my brain',
      'go to brain', 'open brain', 'show brain', 'brain map', 'cortex', 'open cortex', 'go to cortex',
      'take me to my mind', 'take me to mind', 'go to my mind', 'go to mind', 'my mind', 'open mind', 'show mind', 'open my mind', 'show my mind'
    ];
    if (generalBrainPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/brain');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/brain');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Idea Planner section navigation
    const generalIdeasPhrases = [
      'take me to ideas', 'go to ideas', 'open ideas', 'show ideas', 'ideas page', 'view ideas', 'ideas', 'navigate to ideas',
      'take me to my ideas', 'open my ideas', 'show my ideas', 'navigate to my ideas', 'go to my ideas', 'my ideas',
      'take me to my idea planner', 'take me to idea planner', 'idea planner', 'my idea planner', 'go to idea planner',
      'open idea planner', 'show idea planner', 'navigate to idea planner', 'ideas planner', 'open ideas planner'
    ];
    if (generalIdeasPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/ideas');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/ideas');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Assets section navigation
    const generalAssetsPhrases = [
      'take me to assets', 'go to assets', 'open assets', 'show assets', 'assets page', 'view assets', 'assets', 'navigate to assets',
      'take me to my assets', 'open my assets', 'show my assets', 'navigate to my assets', 'go to my assets', 'my assets',
      'files', 'open files', 'go to files', 'take me to files', 'my files'
    ];
    if (generalAssetsPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/assets');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/assets');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Roadmap section navigation
    const generalRoadmapPhrases = [
      'take me to roadmap', 'take me to my roadmap', 'roadmap', 'my roadmap',
      'go to roadmap', 'open roadmap', 'show roadmap', 'milestones', 'timeline'
    ];
    if (generalRoadmapPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/roadmap');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/roadmap');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Direct/General Settings section navigation
    const generalSettingsPhrases = [
      'take me to settings', 'go to settings', 'open settings', 'show settings', 'settings page', 'view settings', 'settings', 'navigate to settings',
      'take me to my settings', 'open my settings', 'show my settings', 'navigate to my settings', 'go to my settings', 'my settings',
      'options', 'vocal registry', 'vocal preferences'
    ];
    if (generalSettingsPhrases.includes(cleanInput)) {
      setPendingProjectClarification(null);
      navigate('/settings');
      setIsAssistantMinimized(true);
      const { feedback, actionName } = getContextFollowUp('/settings');
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'navigation_trigger',
        triggeredAction: actionName
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedback);
      }
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // 2. Specific project matching (e.g. "take me to my project Aether")
    const projectPrefixes = [
      'take me to my project', 'take me to project', 'go to my project', 'go to project',
      'open my project', 'open project', 'show my project', 'show project',
      'navigate to my project', 'navigate to project',
      'take me to my', 'take me to', 'go to my', 'go to',
      'open my', 'open', 'show my', 'show',
      'navigate to my', 'navigate to'
    ];
    
    let specifiedProjectName = '';
    const cleanInputNoPunc = cleanInput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();

    for (const prefix of projectPrefixes) {
      if (cleanInputNoPunc.startsWith(prefix + ' ')) {
        specifiedProjectName = cleanInputNoPunc.substring(prefix.length + 1).trim();
        break;
      }
    }
    
    if (!specifiedProjectName && projects && projects.length > 0) {
      const matchDirect = projects.find(p => p.name.toLowerCase().trim() === cleanInputNoPunc);
      if (matchDirect) {
        specifiedProjectName = cleanInputNoPunc;
      }
    }
    
    if (specifiedProjectName && projects && projects.length > 0) {
      // Find exact or substring match in projects
      const matchedProj = projects.find(p => {
        const pName = p.name.toLowerCase().trim();
        return pName === specifiedProjectName || pName.includes(specifiedProjectName) || specifiedProjectName.includes(pName);
      });
      
      if (matchedProj) {
        setPendingProjectClarification(null); // Clear any pending clarification
        setActiveProjectId(matchedProj.id);
        navigate(`/projects?id=${matchedProj.id}`);
        setIsAssistantMinimized(true); // Minimize on navigation
        const { feedback, actionName } = getContextFollowUp('/projects', matchedProj.name);
        setAetherFeedback({
          transcript: inputText,
          explanation: feedback,
          intent: 'navigation_trigger',
          triggeredAction: actionName
        });
        if (voicePlayback) {
          triggerBrowserSpeechSynthesis(feedback);
        }
        return true;
      }
    }

    // Handle Yes/No for pending project clarification
    if (pendingProjectClarification) {
      if (cleanInput === 'yes' || cleanInput === 'yeah' || cleanInput === 'correct' || cleanInput === 'sure' || cleanInput === 'yep' || cleanInput === 'ok' || cleanInput === 'okay' || cleanInput.includes('yes') || cleanInput.includes('yeah') || cleanInput.includes('sure')) {
        const proj = pendingProjectClarification;
        setPendingProjectClarification(null);
        setActiveProjectId(proj.id);
        navigate(`/projects?id=${proj.id}`);
        setIsAssistantMinimized(true); // Minimize and move to the sidebar on navigation
        
        const { feedback, actionName } = getContextFollowUp('/projects', proj.name);
        setAetherFeedback({
          transcript: inputText,
          explanation: feedback,
          intent: 'navigation_trigger',
          triggeredAction: actionName
        });

        setConvoHistory(prev => [
          ...prev,
          { role: 'user' as const, text: inputText },
          { role: 'model' as const, text: feedback }
        ].slice(-10));

        if (voicePlayback) {
          triggerBrowserSpeechSynthesis(feedback);
        }

        setTimeout(() => {
          if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
            startContinuousConversationalListen();
          }
        }, 1500);

        return true;
      } else if (cleanInput === 'no' || cleanInput === 'nope' || cleanInput === 'incorrect' || cleanInput.includes('no') || cleanInput.includes('nope')) {
        setPendingProjectClarification(null);
        const feedbackMsg = "No problem. Let me know which project or page you'd like to open instead.";
        setAetherFeedback({
          transcript: inputText,
          explanation: feedbackMsg,
          intent: 'navigation_trigger',
          triggeredAction: "❌ Cancelled Clarification"
        });

        setConvoHistory(prev => [
          ...prev,
          { role: 'user' as const, text: inputText },
          { role: 'model' as const, text: feedbackMsg }
        ].slice(-10));

        if (voicePlayback) {
          triggerBrowserSpeechSynthesis(feedbackMsg);
        }

        setTimeout(() => {
          if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
            startContinuousConversationalListen();
          }
        }, 1500);

        return true;
      }
    }

    const isProjectRequest = [
      'take me to this project', 'take me to that project', 'take me to the project',
      'open up a project', 'open a project', 'open the project', 'open project', 'go to project', 'go to the project',
      'take me to project', 'take me to my project'
    ].some(phrase => {
      if (phrase.endsWith('project')) {
        if (cleanInput.includes(phrase + 's')) {
          return false;
        }
      }
      return cleanInput === phrase || cleanInput.includes(phrase);
    });

    if (isProjectRequest) {
      if (projects && projects.length > 0) {
        // Find the active project if set, otherwise first project
        const targetProj = projects.find(p => p.id === activeProjectId) || projects[0];
        setPendingProjectClarification(targetProj);
        setIsAssistantMinimized(false); // Do not minimize!
        
        const feedbackMsg = `Did you mean "${targetProj.name}"?`;
        setAetherFeedback({
          transcript: inputText,
          explanation: feedbackMsg,
          intent: 'navigation_clarification',
          triggeredAction: `📋 Clarifying Project: "${targetProj.name}"`
        });

        setConvoHistory(prev => [
          ...prev,
          { role: 'user' as const, text: inputText },
          { role: 'model' as const, text: feedbackMsg }
        ].slice(-10));

        if (voicePlayback) {
          triggerBrowserSpeechSynthesis(feedbackMsg);
        }

        setTimeout(() => {
          if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
            startContinuousConversationalListen();
          }
        }, 1500);

        return true;
      } else {
        const feedbackMsg = "You don't have any projects created yet. Would you like me to help you create one?";
        setAetherFeedback({
          transcript: inputText,
          explanation: feedbackMsg,
          intent: 'navigation_trigger',
          triggeredAction: "⚠️ No projects found"
        });

        setConvoHistory(prev => [
          ...prev,
          { role: 'user' as const, text: inputText },
          { role: 'model' as const, text: feedbackMsg }
        ].slice(-10));

        if (voicePlayback) {
          triggerBrowserSpeechSynthesis(feedbackMsg);
        }

        setTimeout(() => {
          if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
            startContinuousConversationalListen();
          }
        }, 1500);

        return true;
      }
    }

    // 5. Dynamic Stitch Design Style Triggers (Themes)
    const designStylePhrases = [
      { name: 'stitch-neon', phrases: ['neon stitch', 'stitch neon', 'neon theme', 'neon style'] },
      { name: 'stitch-slate', phrases: ['slate stitch', 'stitch slate', 'slate theme', 'slate style', 'grey theme', 'grey stitch', 'slate design'] },
      { name: 'stitch-emerald', phrases: ['emerald stitch', 'stitch emerald', 'emerald theme', 'emerald style', 'green theme', 'green stitch', 'emerald design'] },
      { name: 'stitch-cyberpink', phrases: ['cyberpink stitch', 'stitch cyberpink', 'cyberpink theme', 'cyberpink style', 'pink theme', 'pink stitch', 'cyberpunk', 'cyberpink design'] },
      { name: 'stitch-amber', phrases: ['amber stitch', 'stitch amber', 'amber theme', 'amber style', 'yellow theme', 'amber stitch', 'orange theme', 'amber design'] },
      { name: 'stitch-indigo', phrases: ['indigo stitch', 'stitch indigo', 'indigo theme', 'indigo style', 'blue theme', 'indigo stitch', 'indigo design'] },
    ];

    const matchedDesign = designStylePhrases.find(item => 
      item.phrases.some(phrase => cleanInput.includes(phrase))
    );

    if (matchedDesign) {
      const designId = matchedDesign.name;
      const displayLabel = designId === 'stitch-neon' ? 'Neon Stitch' :
                           designId === 'stitch-slate' ? 'Slate Stitch' :
                           designId === 'stitch-emerald' ? 'Emerald Stitch' :
                           designId === 'stitch-cyberpink' ? 'Cyberpink Stitch' :
                           designId === 'stitch-amber' ? 'Amber Stitch' : 'Indigo Stitch';

      // Dispatch custom window event
      window.dispatchEvent(new CustomEvent('aether-change-design', { detail: { design: designId } }));

      const feedback = `Switching the interactive preview style to ${displayLabel}. Notice how the colors, borders, and layouts adapt beautifully!`;
      triggerBrowserSpeechSynthesis(feedback);
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'change_design_trigger',
        triggeredAction: `🎨 Applied Stitch Style: ${displayLabel}`
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // 6. Dynamic Stitch Template Blueprint Triggers
    const templatePhrases = [
      { name: 'dashboard', phrases: ['dashboard', 'system metrics', 'charts', 'metrics layout', 'dashboard template'] },
      { name: 'chatbot', phrases: ['chatbot', 'ai chat', 'conversational', 'chat bubble', 'chatbot template'] },
      { name: 'kanban', phrases: ['kanban', 'task board', 'workflow board', 'backlog column', 'kanban template'] },
      { name: 'saas-landing', phrases: ['saas landing', 'marketing page', 'pricing page', 'sales page', 'landing page', 'landing template'] },
      { name: 'developer-portfolio', phrases: ['developer portfolio', 'portfolio', 'personal site', 'portfolio template'] },
      { name: 'e-commerce', phrases: ['e commerce', 'storefront', 'shop layout', 'retail layout', 'store template'] },
      { name: 'blog-feed', phrases: ['blog feed', 'content feed', 'article list', 'blog template'] },
      { name: 'cli-tool', phrases: ['cli tool', 'terminal interface', 'command line', 'cli template'] },
      { name: 'ai-generator', phrases: ['ai generator', 'image generator ui', 'token stream ui', 'generator template'] },
      { name: 'crypto-tracker', phrases: ['crypto tracker', 'wallet tracker', 'ledger ui', 'crypto template'] },
      { name: 'pomodoro-hub', phrases: ['pomodoro hub', 'focus timer', 'work clock', 'pomodoro template'] },
      { name: 'api-playground', phrases: ['api playground', 'endpoint tester', 'mock builder', 'playground template'] },
      { name: 'vanilla', phrases: ['vanilla style', 'basic template', 'blank slate', 'vanilla template'] },
    ];

    const matchedTemplate = templatePhrases.find(item =>
      item.phrases.some(phrase => cleanInput.includes(phrase))
    );

    if (matchedTemplate) {
      const templateId = matchedTemplate.name;
      const displayLabel = templateId.toUpperCase();

      window.dispatchEvent(new CustomEvent('aether-change-template', { detail: { template: templateId } }));

      const feedback = `Setting the project blueprint template to ${displayLabel}. Rendering the responsive preview on the design canvas now!`;
      triggerBrowserSpeechSynthesis(feedback);
      setAetherFeedback({
        transcript: inputText,
        explanation: feedback,
        intent: 'change_template_trigger',
        triggeredAction: `🛠️ Switched Stitch Template: ${displayLabel}`
      });
      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedback }
      ].slice(-10));
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 1500);
      return true;
    }

    // Bypass local navigation/shortcut interception if there is a task action present in the command.
    // This allows Gemini to parse and run the compound action (e.g. navigation + task creation).
    const hasTaskAction = /\b(create|add|make|new|build|register|fix|fixed|resolve|resolved|complete|completed|done|update|change|set|remove|delete|brainstorm|synapse)\b/i.test(cleanInput);
    if (hasTaskAction) {
      return false;
    }
    
    // Vocal close triggers
    const closePhrases = [
      'close the window', 'close window', 'close popup', 'close assistant', 
      'close conversation', 'stop talking', 'go away', 'shut down', 'exit'
    ];
    if (closePhrases.some(p => cleanInput === p || cleanInput.includes(p))) {
      const closingMsg = "Closing the conversation window. Talk to you soon!";
      triggerBrowserSpeechSynthesis(closingMsg);
      setAetherFeedback({
        transcript: inputText,
        explanation: closingMsg,
        intent: 'close_trigger',
        triggeredAction: '⚡ Closed Conversation Area'
      });
      setTimeout(() => {
        handleCloseAssistant();
      }, 950);
      return true;
    }

    // Sidebar docking / Move to the side triggers
    const sidebarPhrases = [
      'move to the side', 'move to side', 'put into sidebar', 'put it into sidebar', 
      'put it into a sidebar', 'dock to the side', 'dock sidebar', 'minimize to sidebar', 
      'dock to side', 'dock to right', 'move components to right', 'move page to right'
    ];
    if (sidebarPhrases.some(p => cleanInput === p || cleanInput.includes(p))) {
      setIsAssistantMinimized(true);
      const sidebarMsg = "Alright, putting myself into the sidebar so you can continue working without interruptions.";
      triggerBrowserSpeechSynthesis(sidebarMsg);
      setAetherFeedback({
        transcript: inputText,
        explanation: sidebarMsg,
        intent: 'minimize_trigger',
        triggeredAction: '⚡ Docked Aether to Sidebar'
      });
      return true;
    }

    // Restoration / Full screen triggers
    const restorePhrases = [
      'restore', 'restore window', 'maximize', 'restore screen', 'full screen', 
      'put into center', 'center the window', 'center window', 'open full screen', 'unminimize'
    ];
    if (restorePhrases.some(p => cleanInput === p || cleanInput.includes(p))) {
      setIsAssistantMinimized(false);
      const restoreMsg = "Restoring central full workspace view.";
      triggerBrowserSpeechSynthesis(restoreMsg);
      setAetherFeedback({
        transcript: inputText,
        explanation: restoreMsg,
        intent: 'maximize_trigger',
        triggeredAction: '⚡ Maximized Aether Workspace'
      });
      return true;
    }
    
    // Core semantic navigation routes map
    const navMappings = [
      { phrases: ['brain', 'map', 'cortex', 'open brain', 'go to brain', 'show brain', 'navigate to brain'], path: '/brain', name: 'Memory Cortex Brain Map' },
      { phrases: ['project', 'projects', 'go to projects', 'show projects', 'open projects', 'repositories'], path: '/projects', name: 'Projects Center' },
      { phrases: ['issue', 'issues', 'task', 'tasks', 'backlog', 'go to issues', 'show issues', 'open tasks', 'assets', 'asset', 'go to assets'], path: '/issues', name: 'Backlog Issues board' },
      { phrases: ['note', 'notes', 'notebook', 'documents', 'go to notes', 'show notes', 'open notes', 'logs'], path: '/notes', name: 'Obsidian Developer Logbooks' },
      { phrases: ['roadmap', 'milestones', 'go to roadmap', 'show roadmap', 'open roadmap'], path: '/roadmap', name: 'Product Roadmap Timeline' },
      { phrases: ['settings', 'options', 'vocal registry', 'go to settings', 'open settings', 'show settings'], path: '/settings', name: 'Aether Vocal Preferences' },
      { phrases: ['home', 'dashboard', 'overview', 'main page', 'go to dashboard', 'show dashboard'], path: '/', name: 'Cortex Control Panel' },
      { phrases: ['asset', 'assets', 'go to assets', 'show assets', 'open assets'], path: '/assets', name: 'Digital Asset Repository' },
      { phrases: ['idea', 'ideas', 'go to ideas', 'show ideas', 'open ideas'], path: '/ideas', name: 'Idea Expansion Center' },
      { phrases: ['sandbox loop', 'sandbox-loop', 'my sandbox loop', 'sandbox', 'go to sandbox loop', 'open sandbox loop', 'show sandbox loop'], path: '/sandbox-loop', name: 'Sandbox Loop' },
      { phrases: ['agents', 'agentic', 'go to agents', 'show agents', 'open agents', 'gentic os'], path: '/agents', name: 'Agentic OS Sandbox' },
      { phrases: ['automations', 'automation', 'autopilot', 'recurring automations', 'go to automations', 'open automations', 'show automations'], path: '/automations', name: 'Automations Control Panel' },
    ];

    // Flexible substring/keyword matching for "take me to" or general routing commands
    const checkNavigationKeywords = (text: string): { path: string, name: string } | null => {
      const lower = text.toLowerCase().trim();
      const clean = lower.replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");
      
      // 1. General projects commands: If they say "open my projects", "open projects", "go to projects", etc.,
      // navigate to the projects dashboard and clear the active project context.
      const generalProjectsPhrases = [
        'open my projects', 'open projects', 'go to projects', 'show projects', 'navigate to projects',
        'projects panel', 'projects dashboard', 'projects center', 'my projects'
      ];
      if (generalProjectsPhrases.some(p => lower.includes(p)) || clean === 'projects' || clean === 'project') {
        setActiveProjectId(null);
        return { path: '/projects', name: 'Projects Center' };
      }

      // 2. Dynamic active project switching based on fuzzy spoken name (only if explicitly targeted)
      const words = clean.split(/\s+/);
      for (const proj of projects) {
        const projNameLower = proj.name.toLowerCase().trim();
        const projWords = projNameLower.replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/);
        
        if (
          lower === projNameLower ||
          lower.includes(`project ${projNameLower}`) ||
          lower.includes(`go to ${projNameLower}`) ||
          lower.includes(`open ${projNameLower}`) ||
          lower.includes(`switch to ${projNameLower}`) ||
          lower.includes(`take me to ${projNameLower}`) ||
          (projNameLower.length > 3 && lower.includes(projNameLower) && (lower.includes("project") || lower.includes("navigate") || lower.includes("go") || lower.includes("open")))
        ) {
          setActiveProjectId(proj.id);
          return { path: '/projects', name: `Project "${proj.name}"` };
        }
        
        // Fuzzy word overlap match
        const hasOverlap = projWords.some(pw => pw.length >= 3 && words.some(w => w.includes(pw) || pw.includes(w)));
        if (hasOverlap && (clean.includes("project") || clean.includes("open") || clean.includes("go") || clean.includes("take") || clean.includes("navigate") || clean.includes("switch"))) {
          setActiveProjectId(proj.id);
          return { path: '/projects', name: `Project "${proj.name}"` };
        }
      }

      // Check dream matching
      if (clean === "dreams" || clean === "dream" || clean === "my dreams" || clean === "dream log" || lower.includes("dream")) {
        return { path: '/brain?tab=dreams', name: 'Aether Dream Log' };
      }

      // Check memory matching
      if (clean === "memory" || clean === "memory store" || clean === "custom rules" || lower.includes("memory") || lower.includes("synaptic") || lower.includes("cortex")) {
        return { path: '/brain?tab=memory', name: 'AI Memory & Rules' };
      }

      // 3. Flexible general section matching (highly forgiving of mic inputs/prepositions)
      if (lower.includes("project") || lower.includes("product") || lower.includes("repo") || lower.includes("folder")) {
        return { path: '/projects', name: 'Projects Center' };
      }
      if (lower.includes("asset") || lower.includes("digital asset") || lower.includes("image") || lower.includes("illustration")) {
        return { path: '/assets', name: 'Digital Asset Repository' };
      }
      if (lower.includes("note") || lower.includes("document") || lower.includes("doc") || lower.includes("log") || lower.includes("diary")) {
        return { path: '/notes', name: 'Obsidian Developer Logbooks' };
      }
      if (lower.includes("issue") || lower.includes("task") || lower.includes("backlog") || lower.includes("todo") || lower.includes("to-do") || lower.includes("problem") || lower.includes("bug")) {
        return { path: '/issues', name: 'Backlog Issues board' };
      }
      if (lower.includes("idea") || lower.includes("brainstorm") || lower.includes("concept") || lower.includes("new ideas")) {
        return { path: '/ideas', name: 'Idea Expansion Center' };
      }
      if (lower.includes("brain") || lower.includes("cortex") || lower.includes("mind") || lower.includes("map")) {
        return { path: '/brain', name: 'Memory Cortex Brain Map' };
      }
      if (lower.includes("sandbox loop") || lower.includes("sandbox-loop") || (lower.includes("sandbox") && !lower.includes("agent"))) {
        return { path: '/sandbox-loop', name: 'Sandbox Loop' };
      }
      if (lower.includes("agent") || lower.includes("agentic") || lower.includes("gentic")) {
        return { path: '/agents', name: 'Agentic OS Sandbox' };
      }
      if (lower.includes("automation") || lower.includes("autopilot") || lower.includes("recurring")) {
        return { path: '/automations', name: 'Automations Control Panel' };
      }
      if (lower.includes("roadmap") || lower.includes("timeline") || lower.includes("milestone")) {
        return { path: '/roadmap', name: 'Product Roadmap Timeline' };
      }
      if (lower.includes("setting") || lower.includes("preference") || lower.includes("option")) {
        return { path: '/settings', name: 'Aether Vocal Preferences' };
      }
      if (lower.includes("dashboard") || lower.includes("home") || lower.includes("overview")) {
        return { path: '/', name: 'Cortex Control Panel' };
      }

      return null;
    };

    // Check custom voice triggers first
    let matchedPath: string | null = null;
    let descName = '';

    const kwMatch = checkNavigationKeywords(cleanInput);
    if (kwMatch) {
      matchedPath = kwMatch.path;
      descName = kwMatch.name;
    } else {
      const directMatch = navMappings.find(m => 
        m.phrases.some(p => cleanInput === p || cleanInput.includes(p))
      );

      if (directMatch) {
        matchedPath = directMatch.path;
        descName = directMatch.name;
      } else {
        const dbMatch = voiceTriggers?.find(t => {
          const cleanPhrase = t.phrase.toLowerCase().trim().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");
          return cleanInput === cleanPhrase || cleanInput.includes(cleanPhrase);
        });
        if (dbMatch) {
          matchedPath = dbMatch.path;
          descName = dbMatch.phrase;
        }
      }
    }

    if (matchedPath) {
      navigate(matchedPath);
      setIsAssistantMinimized(true); // Minimize and move to the sidebar on navigation
      
      const { feedback, actionName } = getContextFollowUp(matchedPath);
      const feedbackMessage = feedback;
      
      setAetherFeedback({
        transcript: inputText,
        explanation: feedbackMessage,
        intent: 'navigation_trigger',
        triggeredAction: actionName || `🧭 Activated Vocal Synapse Link to: ${matchedPath}`
      });

      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: inputText },
        { role: 'model' as const, text: feedbackMessage }
      ].slice(-10));

      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(feedbackMessage);
      }

      // Keep assistant open and recycle microphone to continue conversing!
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 250);

      return true;
    }
    return false;
  };

  const handleSendTextCommand = async () => {
    if (!typedCommand.trim() || isProcessing) return;
    const command = typedCommand.trim();
    setTypedCommand('');
    
    // Intercept with proposedAction if any
    if (proposedAction) {
      const cleanCmd = command.toLowerCase().trim().replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");
      const confirmPhrases = ["yes", "yeah", "yep", "sure", "ok", "okay", "confirm", "accept", "accepts", "do it", "approve"];
      const declinePhrases = ["no", "nope", "nay", "decline", "deny", "refuse", "cancel", "discard", "dont", "don't"];

      const isConfirm = confirmPhrases.some(p => cleanCmd === p || cleanCmd.startsWith(p + " ") || cleanCmd.endsWith(" " + p));
      const isDecline = declinePhrases.some(p => cleanCmd === p || cleanCmd.startsWith(p + " ") || cleanCmd.endsWith(" " + p));

      if (isConfirm) {
        executeProposedAction(proposedAction);
        return;
      } else if (isDecline) {
        if (proposedAction.intent === 'create_project') {
          const newSpelling = extractNewProjectNameFromDecline(command);
          if (newSpelling) {
            const updatedAction = {
              ...proposedAction,
              parsedData: {
                ...proposedAction.parsedData,
                name: newSpelling
              },
              actionDisplay: `Create Project: "${newSpelling}"`
            };
            setProposedAction(updatedAction);
            
            const feedbackMsg = `Okay, so you meant create project named "${newSpelling}". Is that correct?`;
            
            setConvoHistory(prev => [
              ...prev,
              { role: 'user' as const, text: command },
              { role: 'model' as const, text: feedbackMsg }
            ].slice(-10));

            setAetherFeedback({
              transcript: command,
              explanation: feedbackMsg,
              intent: 'create_project',
              triggeredAction: `📋 Corrected Proposed Project Name: "${newSpelling}"`
            });

            if (voicePlayback) {
              triggerBrowserSpeechSynthesis(feedbackMsg);
            }

            setTimeout(() => {
              if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
                startContinuousConversationalListen();
              }
            }, 1200);
            return;
          }
        }
        discardProposedAction(proposedAction);
        return;
      }
    }
    
    if (checkVoiceTriggers(command)) {
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("Processing text command pipeline...");
    setAetherFeedback(null);

    try {
      const contextPayload = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      }));

      await requestAetherStream({
        textCommand: command,
        projectContexts: contextPayload,
        cortexSynapses: cortexSynapses || [],
        notes: notes || [],
        aetherPersonalityRules: aetherPersonalityRules || [],
        history: convoHistory,
        pendingNote: pendingNote,
        activeProjectId,
        currentPath: location.pathname,
        circledContexts: circledContexts || []
      });
    } catch (err: any) {
      console.error(err);
      setAetherFeedback({ error: err.message || "Engine network communication failed." });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeProposedAction = (action: any) => {
    const rawInput = action.transcript || action.userSpeak || action.text || "";
    const firewallResult = evaluateRoutingFirewall(rawInput, action.intent, action.parsedData);

    const intent = firewallResult.finalIntent;
    const parsedData = firewallResult.parsedData;
    const explanation = action.explanation;

    let actionTriggeredDisplay = "Consulted Central Workspace Map Interface.";
    setIsAssistantMinimized(false);

    switch (intent) {
      case 'create_project': {
        const name = parsedData.name || 'New Project';
        const description = parsedData.description || 'Drafted via vocal command.';
        const frameworks = parsedData.frameworks || ['React'];
        const customStack = parsedData.customStack || ['Tailwind', 'Vite'];

        const newId = addProject({
          name,
          description,
          frameworks,
          customStack,
          status: 'Planning',
          brainstormIdeas: [],
          seenRecommendedIdeas: [],
          dreamRecommendations: []
        });

        setActiveProjectId(newId);
        actionTriggeredDisplay = `📁 Created & activated Project "${name}" [Planning]`;
        if (!isDrawingModeActiveRef.current) {
          navigate(`/create?mode=brainstorm`);
        }
        break;
      }

      case 'create_issue': {
        let pId = parsedData.projectId;
        if (!pId && parsedData.projectNameMentioned) {
          const matched = projects.find(p => p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase()));
          if (matched) pId = matched.id;
        }
        const finalProjId = pId || activeProjectId || (projects.length > 0 ? projects[0].id : "");

        if (finalProjId) {
          const projRef = projects.find(p => p.id === finalProjId);
          const title = parsedData.title || 'Vocal Backlog task';
          addIssue({
            projectId: finalProjId,
            title,
            description: parsedData.description || 'Captured through instant vocal action.',
            type: parsedData.type || 'Task',
            priority: parsedData.priority || 'Medium',
            status: 'Todo'
          });
          actionTriggeredDisplay = `✓ Logged new backing task "${title}" into Project "${projRef?.name || 'Workspace'}"`;
          if (!isDrawingModeActiveRef.current) {
            navigate('/issues');
          }
        } else {
          actionTriggeredDisplay = `⚠️ Spoken task parsed, but no active projects found to hold it.`;
        }
        break;
      }

      case 'add_note': {
        let pId = parsedData.projectId || activeProjectId || (projects.length > 0 ? projects[0].id : "");
        if (pId) {
          const projRef = projects.find(p => p.id === pId);
          const noteTitle = parsedData.title || `Vocal Dispatch Note - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
          addNote({
            projectId: pId,
            title: noteTitle,
            content: parsedData.content || "Doc transcribed via AI interface.",
            tags: parsedData.tags || ["Vocal"]
          });
          actionTriggeredDisplay = `📝 Transcribed Note "${noteTitle}" linked to "${projRef?.name || 'Workspace'}"`;
          if (!isDrawingModeActiveRef.current) {
            navigate('/notes');
          }
        } else {
          actionTriggeredDisplay = `⚠️ Note transcribed, but missing destination project context.`;
        }
        break;
      }

      case 'add_brainstorm_idea': {
        let pId = parsedData.projectId || activeProjectId || (projects.length > 0 ? projects[0].id : "");
        if (pId) {
          const projRef = projects.find(p => p.id === pId);
          if (projRef) {
            const text = parsedData.text || 'Developer brainstorm feedback';
            updateProject(pId, {
              brainstormIdeas: [
                ...(projRef.brainstormIdeas || []),
                {
                  id: crypto.randomUUID(),
                  text,
                  details: parsedData.details || "Transcribed on the go.",
                  status: 'pending',
                  createdAt: Date.now()
                }
              ]
            });
            actionTriggeredDisplay = `💡 Added Brainstorm Idea "${text}" inside project "${projRef.name}"`;
            if (!isDrawingModeActiveRef.current) {
              navigate('/ideas');
            }
          }
        }
        break;
      }

      case 'add_cortex_synapse': {
        const synapseName = parsedData.name || parsedData.title || `Standard - ${Date.now()}`;
        const newSyn = {
          id: `synapse-${crypto.randomUUID()}`,
          name: synapseName,
          desc: parsedData.desc || parsedData.description || 'Saved custom guideline.',
          type: 'custom_synapse' as const,
          createdAt: Date.now()
        };
        setCortexSynapses(prev => [...(prev || []), newSyn]);
        actionTriggeredDisplay = `🧠 Saved guideline: "${synapseName}"`;
        if (!isDrawingModeActiveRef.current) {
          navigate('/brain');
        }
        break;
      }

      case 'update_issue_status': {
        const issueTitleMentioned = parsedData.issueTitleMentioned || parsedData.title || '';
        const newStatus = parsedData.newStatus || 'Done';
        const targetIssue = issues.find(iss => 
          iss.title.toLowerCase().includes(issueTitleMentioned.toLowerCase()) ||
          issueTitleMentioned.toLowerCase().includes(iss.title.toLowerCase())
        );

        if (targetIssue) {
          updateIssue(targetIssue.id, { status: newStatus });
          actionTriggeredDisplay = `✓ Updated task "${targetIssue.title}" status to "${newStatus}"`;
        } else {
          actionTriggeredDisplay = `⚠️ Spoken task "${issueTitleMentioned}" not found to update.`;
        }
        break;
      }

      case 'delete_issue': {
        const issueTitleMentioned = parsedData.issueTitleMentioned || parsedData.title || '';
        const targetIssue = issues.find(iss => 
          iss.title.toLowerCase().includes(issueTitleMentioned.toLowerCase()) ||
          issueTitleMentioned.toLowerCase().includes(iss.title.toLowerCase())
        );

        if (targetIssue) {
          deleteIssue(targetIssue.id);
          actionTriggeredDisplay = `✓ Deleted task "${targetIssue.title}" successfully.`;
        } else {
          actionTriggeredDisplay = `⚠️ Spoken task "${issueTitleMentioned}" not found to delete.`;
        }
        break;
      }

      case 'approve_dream_recommendation': {
        const mentionTitle = parsedData.title || parsedData.text || parsedData.issueTitleMentioned || '';
        let matchedRec: any = null;
        let matchedProj: any = null;

        for (const proj of projects) {
          const recs = proj.dreamRecommendations || [];
          const found = recs.find((r: any) => 
            r.title.toLowerCase().includes(mentionTitle.toLowerCase()) || 
            mentionTitle.toLowerCase().includes(r.title.toLowerCase())
          );
          if (found) {
            matchedRec = found;
            matchedProj = proj;
            break;
          }
        }

        if (!matchedRec && mentionTitle === '') {
          for (const proj of projects) {
            const recs = proj.dreamRecommendations || [];
            const found = recs.find((r: any) => r.status === 'active');
            if (found) {
              matchedRec = found;
              matchedProj = proj;
              break;
            }
          }
        }

        if (matchedRec && matchedProj) {
          const ideaId = `idea-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const newIdeaItem = {
            id: ideaId,
            text: matchedRec.title,
            details: `${matchedRec.description}\n\nCode Proposal:\n${matchedRec.snippet}`,
            status: "approved" as const,
            createdAt: Date.now(),
          };

          const updatedIdeas = [
            ...(matchedProj.brainstormIdeas || []),
            newIdeaItem,
          ];

          const uniqueIdeas = [];
          const seen = new Set();
          for (const x of updatedIdeas) {
            const key = x.text.trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              uniqueIdeas.push(x);
            }
          }

          const updatedRecs = (matchedProj.dreamRecommendations || []).map((d: any) => {
            if (d.id === matchedRec.id) {
              return { ...d, status: 'approved' as const };
            }
            return d;
          });

          updateProject(matchedProj.id, {
            brainstormIdeas: uniqueIdeas,
            dreamRecommendations: updatedRecs
          });

          actionTriggeredDisplay = `✓ Approved optimization suggestion: "${matchedRec.title}" for Project "${matchedProj.name}"`;
        } else {
          actionTriggeredDisplay = `⚠️ No active code optimization proposals matching details found to approve.`;
        }
        break;
      }

      case 'navigate_to': {
        const path = parsedData.path || '/';
        const projName = parsedData.projectNameMentioned || '';
        let matchedProj = null;

        const isGenericProjectNav = 
          projName.toLowerCase().trim() === 'projects' || 
          projName.toLowerCase().trim() === 'my projects' || 
          projName.toLowerCase().trim() === 'take me to my projects' || 
          projName.toLowerCase().trim() === 'all projects';

        if (parsedData.projectId) {
          matchedProj = projects.find(p => p.id === parsedData.projectId);
        }
        if (!matchedProj && projName && !isGenericProjectNav && projects.length > 0) {
          matchedProj = projects.find(p => {
            const pName = p.name.toLowerCase().trim();
            return pName === projName.toLowerCase().trim() || pName.includes(projName.toLowerCase().trim()) || projName.toLowerCase().trim().includes(pName);
          });
        }

        if (matchedProj) {
          setActiveProjectId(matchedProj.id);
          localStorage.setItem('app_active_project', matchedProj.id);
          localStorage.setItem('active_project_id', matchedProj.id);
          window.dispatchEvent(new CustomEvent('active_project_changed', { detail: matchedProj.id }));
          actionTriggeredDisplay = `🧭 Navigated to project "${matchedProj.name}" workspace.`;
          navigate('/projects');
        } else {
          actionTriggeredDisplay = `🧭 Navigated to workspace section: ${path}`;
          if (!isDrawingModeActiveRef.current) {
            navigate(path);
          }
        }
        break;
      }

      case 'search_web': {
        const query = parsedData.query || 'latest developer news';
        actionTriggeredDisplay = `🌐 Opened Google Search for "${query}" in new tab.`;
        const searchUrl = parsedData.url || `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        try {
          window.open(searchUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
          console.warn('Window open blocked for search_web:', e);
        }
        break;
      }

      case 'search_youtube': {
        const query = parsedData.query || 'devspace aether';
        actionTriggeredDisplay = `📺 YouTube video results retrieved for "${query}".`;
        if (parsedData.forceExternal || parsedData.url) {
          const ytUrl = parsedData.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
          try {
            window.open(ytUrl, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.warn('Window open blocked for search_youtube:', e);
          }
        }
        break;
      }

      case 'open_url':
      case 'open_search_result': {
        const url = parsedData.url;
        actionTriggeredDisplay = `🔗 Opened search result in new tab.`;
        if (url) {
          try {
            window.open(url, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.warn('Window open blocked for open_url:', e);
          }
        }
        break;
      }

      case 'launch_desktop_app': {
        const appName = parsedData.appName || 'browser';
        actionTriggeredDisplay = `🚀 Launched system application "${appName}".`;
        aetherDesktopIntelligence.launchApp(appName);
        break;
      }

      case 'start_dreaming': {
        const projName = parsedData.projectNameMentioned || '';
        let targetProj = projects.find(p => p.id === activeProjectId) || (projects.length > 0 ? projects[0] : null);
        if (projName && projects.length > 0) {
          const matched = projects.find(p => {
            const pName = p.name.toLowerCase().trim();
            return pName === projName.toLowerCase().trim() || pName.includes(projName.toLowerCase().trim()) || projName.toLowerCase().trim().includes(pName);
          });
          if (matched) targetProj = matched;
        }

        if (targetProj) {
          setActiveProjectId(targetProj.id);
          const focusArea = parsedData.focus || 'general';
          startProjectDreaming(targetProj.id, focusArea);
          actionTriggeredDisplay = `✨ Initiated deep autonomous optimization dream on Project "${targetProj.name}" (Focus: ${focusArea})`;
          if (!isDrawingModeActiveRef.current) {
            navigate(`/projects?id=${targetProj.id}`);
          }
        } else {
          actionTriggeredDisplay = `⚠️ start_dreaming invoked, but no target project was identified.`;
        }
        break;
      }

      case 'create_agent': {
        const agentName = parsedData.name || 'AI Developer Pro';
        const agentRole = parsedData.role || 'Code Engineer';
        const zone = parsedData.officeZone || 'dev_bay';
        const sector = parsedData.projectTaskSector || 'feature';
        const engine = parsedData.modelEngine || 'gemini-3.7-flash';
        const goals = parsedData.goals || ['Implement active backlog items', 'Conduct build checks'];

        const newAgent = {
          id: `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: agentName,
          role: agentRole,
          projectId: activeProjectId || 'all',
          watchTargets: ['issues', 'notes'],
          goals: goals,
          schedule: 'Hourly',
          commandList: 'Check backlog, compile layout, optimize widgets.',
          status: 'Idle' as const,
          avatarColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)],
          createdAt: Date.now(),
          officeZone: zone as any,
          projectTaskSector: sector as any,
          modelEngine: engine as any
        };

        setAgents(prev => [...(prev || []), newAgent]);
        actionTriggeredDisplay = `🤖 Spawned and deployed specialized AI Developer Agent: "${agentName}" (${agentRole})`;
        if (!isDrawingModeActiveRef.current) {
          navigate('/agents');
        }
        break;
      }

      case 'github_autopilot_deploy': {
        const projName = parsedData.projectNameMentioned || '';
        let matchedProj = projects.find(p => p.id === activeProjectId) || projects[0];
        if (projName && projects.length > 0) {
          const match = projects.find(p => {
            const pName = p.name.toLowerCase().trim();
            return pName === projName.toLowerCase().trim() || pName.includes(projName.toLowerCase().trim()) || projName.toLowerCase().trim().includes(pName);
          });
          if (match) matchedProj = match;
        }

        const title = parsedData.title || 'Autonomous Optimization';
        const details = parsedData.details || 'Autopilot directed work order.';

        // Call the backend endpoint to add to queue and trigger active autopilot engine
        fetch('/api/github/autopilot/queue/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: matchedProj?.id || 'temp-proj',
            projectName: matchedProj?.name || 'General Workspace',
            title,
            details,
            type: 'custom'
          })
        }).catch(err => console.error("Failed to enqueue via voice assistant:", err));

        actionTriggeredDisplay = `🚀 Enqueued Autopilot Task on "${matchedProj?.name || 'Workspace'}": "${title}"`;
        navigate('/github');
        break;
      }
    }

    const isProposalFlow = action.intent === 'DEVSPACE_CUSTOMIZATION' || proposedAction !== null;
    const speechMessage = isProposalFlow 
      ? `Proposal approved. Executed: ${actionTriggeredDisplay}`
      : (action.explanation || actionTriggeredDisplay);

    setAetherFeedback({
      transcript: action.transcript,
      explanation: speechMessage,
      intent: action.intent,
      triggeredAction: actionTriggeredDisplay
    });

    setConvoHistory(prev => [
      ...prev,
      { role: 'model' as const, text: speechMessage }
    ].slice(-10));

    if (voicePlayback) {
      triggerBrowserSpeechSynthesis(speechMessage);
    }
    setProposedAction(null);
  };

  const discardProposedAction = (action: any) => {
    setAetherFeedback({
      transcript: action.transcript,
      explanation: "Proposed action was discarded safely.",
      intent: 'chat_query',
      triggeredAction: "❌ Proposed Action Discarded/Denied"
    });

    setConvoHistory(prev => [
      ...prev,
      { role: 'model' as const, text: "Understood. The proposed action has been cancelled." }
    ].slice(-10));

    triggerBrowserSpeechSynthesis("Understood. Proposed action cancelled.");
    setProposedAction(null);
  };

  const handleProcessedResponse = (data: any, isFromStream = false) => {
    const { transcript, intent, explanation, parsedData, shouldWriteDown, noteContent } = data;
    
    // Update personality rules if returned by AI
    if (data.aetherPersonalityRules && Array.isArray(data.aetherPersonalityRules)) {
      setAetherPersonalityRules(data.aetherPersonalityRules);
    }
    if (data.addPersonalityRule) {
      const rule = String(data.addPersonalityRule).trim();
      if (rule && !aetherPersonalityRules.includes(rule)) {
        setAetherPersonalityRules(prev => [...prev, rule]);
      }
    }
    if (data.removePersonalityRule) {
      const ruleToDelete = String(data.removePersonalityRule).trim();
      setAetherPersonalityRules(prev => prev.filter(r => r.toLowerCase() !== ruleToDelete.toLowerCase()));
    }

    const userSpeak = String(transcript || "[Voice dispatch]");

    // Diagnostic logging requirement
    console.log('[Aether Routing Diagnostic]', {
      userInput: userSpeak,
      detectedIntent: intent,
      confidence: data.confidence || 0.95,
      selectedEngine: data.selectedEngine || (isFromStream ? 'AetherStreamEngine' : 'AetherConversationalEngine'),
      selectedTool: data.selectedTool || intent,
      result: explanation || 'Processed successfully'
    });

    // Intercept with Voice Triggers matches
    if (transcript && checkVoiceTriggers(transcript)) {
      return;
    }

    // DevSpace Customization proposals (ONLY when user explicitly requests UI customization)
    if (intent === 'DEVSPACE_CUSTOMIZATION' || intent === 'edit_devspace') {
      setIsHubOpen(true);
      setIsAssistantMinimized(false);
      setHudTab('speak');
      setIsConversing(true);

      const promptInput = userSpeak || (parsedData && parsedData.prompt) || "Customize DevSpace layout";
      const activeProfile = aetherInstanceEngine.getActiveProfile();
      const proposal = aetherInstanceEngine.generateProposalFromPrompt(promptInput, activeProfile);
      const proposalMsg = explanation || `Generated DevSpace customization proposal: "${proposal.title}". Would you like to apply it?`;

      setProposedAction({
        id: proposal.id || crypto.randomUUID(),
        intent: 'DEVSPACE_CUSTOMIZATION',
        parsedData: { prompt: promptInput, proposal },
        explanation: proposalMsg,
        actionDisplay: `DevSpace Customization: ${proposal.title}`,
        transcript: userSpeak
      });

      setConvoHistory(prev => [
        ...prev,
        { role: 'user' as const, text: userSpeak },
        { role: 'model' as const, text: proposalMsg }
      ].slice(-10));

      setAetherFeedback({
        transcript: userSpeak,
        explanation: proposalMsg,
        intent: 'DEVSPACE_CUSTOMIZATION',
        triggeredAction: `🎨 DevSpace Customization Proposal: "${proposal.title}"`
      });

      if (voicePlayback) {
        triggerBrowserSpeechSynthesis(proposalMsg);
      }
      return;
    }

    // Standard operational intents execute immediately without proposals
    const standardIntents = [
      'create_project', 
      'create_issue', 
      'add_note', 
      'add_brainstorm_idea', 
      'add_cortex_synapse',
      'update_issue_status',
      'delete_issue',
      'approve_dream_recommendation',
      'navigate_to',
      'start_dreaming',
      'create_agent',
      'search_youtube',
      'open_url',
      'launch_app',
      'github_autopilot_deploy'
    ];

    if (intent && standardIntents.includes(intent) && parsedData) {
      executeProposedAction({
        intent,
        parsedData,
        explanation
      });
      return;
    }

    // Standard non-modifying informational Q&A turn
    const modelSpeak = String(explanation || "Processed successfully.");
    setConvoHistory(prev => [
      ...prev,
      { role: 'user' as const, text: userSpeak },
      { role: 'model' as const, text: modelSpeak }
    ].slice(-10));

    if (shouldWriteDown === 'ask') {
      setPendingNote(noteContent || "");
    } else {
      setPendingNote(null);
    }

    if (shouldWriteDown === 'ask' && noteContent) {
      setSessionItems(prev => {
        const possessesNote = prev.some(i => i.content === noteContent);
        if (possessesNote) return prev;
        return [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            type: 'note',
            title: `Aether Suggested Note - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            content: noteContent,
            saved: false,
            isSuggested: true
          }
        ];
      });
    }

    setAetherFeedback({
      transcript,
      explanation,
      intent,
      triggeredAction: "Consulted Central Workspace Map Interface."
    });

    if (voicePlayback && explanation) {
      if (!isFromStream) {
        triggerBrowserSpeechSynthesis(explanation);
      } else {
        // If from stream and no active speech is speaking/active, recycle the mic
        setTimeout(() => {
          if (!speakActiveRef.current && !window.speechSynthesis?.speaking && isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
            startContinuousConversationalListen();
          }
        }, 500);
      }
    } else {
      // If voice playback is disabled or there is no explanation to speak, immediately recycle the mic
      setTimeout(() => {
        if (isHubOpenRef.current && isConversingRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          startContinuousConversationalListen();
        }
      }, 300);
    }
  };

  const handleUpdateSessionItem = (id: string, updates: Partial<{ id: string; type: 'note' | 'task' | 'brainstorm' | 'synapse'; title: string; content: string; saved: boolean; isSuggested?: boolean }>) => {
    setSessionItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveSessionItem = (id: string) => {
    setSessionItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddManualItem = (type: 'note' | 'task' | 'brainstorm' | 'synapse') => {
    const templates = {
      note: { title: 'New Note', content: '# Note Summary\nEnter details here...' },
      task: { title: 'New Task', content: 'Describe what needs to be done...' },
      brainstorm: { title: 'New Idea', content: 'Describe your idea here...' },
      synapse: { title: 'New Guideline', content: 'Define custom rules, preferences, or instructions...' }
    };
    
    setSessionItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        type,
        title: templates[type].title,
        content: templates[type].content,
        saved: false,
        isSuggested: false
      }
    ]);
  };

  const simulateWakeWordTrigger = () => {
    setIsHubOpen(true);
    setHudTab('speak');
    setConvoHistory([
      { role: 'model', text: "Aether visual cooperative session initialized. What core logs, tasks, or brainstorming ideas are we formulating?" }
    ]);
    triggerBrowserSpeechSynthesis("Aether active. I'm ready to collaborate.");
  };

  const commitSessionItems = () => {
    if (sessionItems.length === 0) return;

    let notesAddedCount = 0;
    let tasksAddedCount = 0;
    let brainstormsAddedCount = 0;
    let synapsesAddedCount = 0;

    const pId = activeProjectId || (projects.length > 0 ? projects[0].id : "");

    sessionItems.forEach(item => {
      switch (item.type) {
        case 'note': {
          if (pId) {
            addNote({
              projectId: pId,
              title: item.title,
              content: item.content,
              tags: ["VoiceSession", "CooperativeBoard"]
            });
            notesAddedCount++;
          }
          break;
        }
        case 'task': {
          if (pId) {
            addIssue({
              projectId: pId,
              title: item.title,
              description: item.content,
              type: 'Task',
              priority: 'Medium',
              status: 'Todo'
            });
            tasksAddedCount++;
          }
          break;
        }
        case 'brainstorm': {
          if (pId) {
            const projRef = projects.find(p => p.id === pId);
            if (projRef) {
              updateProject(pId, {
                brainstormIdeas: [
                  ...(projRef.brainstormIdeas || []),
                  {
                    id: Math.random().toString(36).substring(7),
                    text: item.title,
                    details: item.content,
                    status: 'pending',
                    createdAt: Date.now()
                  }
                ]
              });
              brainstormsAddedCount++;
            }
          }
          break;
        }
        case 'synapse': {
          setCortexSynapses(prev => [
            ...(prev || []),
            {
              id: `synapse-${Math.random().toString(36).substring(7)}`,
              name: item.title,
              desc: item.content,
              type: 'custom_synapse' as const,
              createdAt: Date.now()
            }
          ]);
          synapsesAddedCount++;
          break;
        }
      }
    });

    setSessionItems([]);
    setPendingNote(null);

    const summaryText = `Saved Successfully!\n\n` +
      `All items have been added:\n` +
      `• ${notesAddedCount} notes saved\n` +
      `• ${tasksAddedCount} tasks added to backlog\n` +
      `• ${brainstormsAddedCount} brainstorm ideas saved\n` +
      `• ${synapsesAddedCount} guidelines updated\n\n` +
      `Everything has been saved and completed!`;

    setConvoHistory(prev => [
      ...prev,
      { role: 'model', text: summaryText }
    ]);

    triggerBrowserSpeechSynthesis("Everything has been saved and completed.");
  };

  const commitSingleSessionItem = (itemId: string) => {
    const item = sessionItems.find(i => i.id === itemId);
    if (!item || item.saved) return;

    const pId = activeProjectId || (projects.length > 0 ? projects[0].id : "");

    switch (item.type) {
      case 'note': {
        if (pId) {
          addNote({
            projectId: pId,
            title: item.title,
            content: item.content,
            tags: ["VoiceSession", "Accepted"]
          });
        }
        break;
      }
      case 'task': {
        if (pId) {
          addIssue({
            projectId: pId,
            title: item.title,
            description: item.content,
            type: 'Task',
            priority: 'Medium',
            status: 'Todo'
          });
        }
        break;
      }
      case 'brainstorm': {
        if (pId) {
          const projRef = projects.find(p => p.id === pId);
          if (projRef) {
            updateProject(pId, {
              brainstormIdeas: [
                ...(projRef.brainstormIdeas || []),
                {
                  id: Math.random().toString(36).substring(7),
                  text: item.title,
                  details: item.content,
                  status: 'pending',
                  createdAt: Date.now()
                }
              ]
            });
          }
        }
        break;
      }
      case 'synapse': {
        setCortexSynapses(prev => [
          ...(prev || []),
          {
            id: `synapse-${Math.random().toString(36).substring(7)}`,
            name: item.title,
            desc: item.content,
            type: 'custom_synapse' as const,
            createdAt: Date.now()
          }
        ]);
        break;
      }
    }

    setSessionItems(prev => prev.map(i => i.id === itemId ? { ...i, saved: true } : i));
    triggerBrowserSpeechSynthesis(`Accepted and saved ${item.title}`);
  };

  const triggerBrowserSpeechSynthesis = (text: string) => {
    if (!voicePlaybackRef.current) {
      console.log("Speech audio output is disabled. Speech suppressed:", text);
      return;
    }
    activeSpeechTextRef.current = text;
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      // Remove emojis and symbols/stars for crystal-clear verbalization
      const cleanText = text
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[*#`_\-•\[\]\(\)]/g, '')
        .trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = speechRate || 1.18;
      utterance.pitch = speechPitch || 1.0; // Warm, natural voice pitch
      
      const getBestVoice = () => {
        const availableVoices = window.speechSynthesis.getVoices().length > 0 
          ? window.speechSynthesis.getVoices()
          : voices;
        
        // If user explicitly chose a voice, try to find and set it
        if (selectedVoiceName) {
          const matched = availableVoices.find(v => v.name === selectedVoiceName);
          if (matched) return matched;
        }

        const priorities = [
          // Prioritize British Male voice as the default choice
          (v: any) => (v.name.includes('Google UK English Male') || v.name.includes('Daniel') || v.name.toLowerCase().includes('george') || v.name.includes('Oliver')) && v.lang.includes('en'),
          // Natural Google voices
          (v: any) => v.name.includes('Google US English') || v.name.includes('Google UK English Female') || v.name.includes('Google US English Male'),
          (v: any) => v.name.includes('Google') && v.lang.startsWith('en'),
          // Natural Microsoft voices
          (v: any) => v.name.toLowerCase().includes('natural') && v.lang.startsWith('en'),
          (v: any) => v.name.toLowerCase().includes('online') && v.lang.startsWith('en'),
          // Enhanced / Apple Enhanced
          (v: any) => v.name.toLowerCase().includes('enhanced') && v.lang.startsWith('en'),
          // Premium Safari or system voices
          (v: any) => v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Aria') || v.name.includes('Guy'),
          // Generic english male/female
          (v: any) => v.lang.startsWith('en-US'),
          (v: any) => v.lang.startsWith('en'),
        ];
        
        for (const priority of priorities) {
          const found = availableVoices.find(priority);
          if (found) return found;
        }
        return availableVoices.find(v => v.lang.startsWith('en')) || null;
      };

      const bestVoice = getBestVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      utterance.onstart = () => {
        setIsSpeechActive(true);
        speakActiveRef.current = true;
        addVocalDiagnostic("CONVO_MIC: SpeechSynthesis speaking started.");
        
        // Keep conversational mic running for voice-activated interruption (barge-in)
        if (isHubOpenRef.current && (isConversingRef.current || isConcurrentStreamEnabledRef.current)) {
          if (!isListeningForSpeechRef.current) {
            setTimeout(() => {
              if (speakActiveRef.current && isHubOpenRef.current && (isConversingRef.current || isConcurrentStreamEnabledRef.current)) {
                startContinuousConversationalListen();
              }
            }, 300);
          }
        } else {
          // Off-state or typing notepad mode shuts down standard listeners as expected
          if (activeRecogRef.current) {
            try {
              activeRecogRef.current.onend = null;
              activeRecogRef.current.stop();
            } catch(e){}
          }
          if (backgroundRecogRef.current) {
            try {
              backgroundRecogRef.current.stop();
            } catch (e) {}
          }
        }
      };

      // Watchdog Timer to recover if Chrome/Safari fails to trigger standard onend
      const readingDurationMs = Math.max(3000, cleanText.length * 80);
      const watchdogTimer = setTimeout(() => {
        if (speakActiveRef.current) {
          console.log("SpeechSynthesis onend safety watchdog timer triggered. Restoring mic states.");
          addVocalDiagnostic("CONVO_MIC: SpeechSynthesis safety watchdog timeout occurred.");
          setIsSpeechActive(false);
          speakActiveRef.current = false;
          
          if (isHubOpenRef.current && !isRecordingRef.current && !isProcessingRef.current) {
            if (isConversingRef.current || isConcurrentStreamEnabledRef.current) {
              startContinuousConversationalListen();
            }
          } else {
            startBackgroundWakeWord();
          }
        }
      }, readingDurationMs);

      utterance.onend = () => {
        clearTimeout(watchdogTimer);
        setIsSpeechActive(false);
        speakActiveRef.current = false;
        addVocalDiagnostic("CONVO_MIC: SpeechSynthesis normal onend triggered.");
        
        // Automatic back-and-forth conversational restart
        if (isHubOpenRef.current && !isRecordingRef.current && !isProcessingRef.current) {
          if (isConversingRef.current || isConcurrentStreamEnabledRef.current) {
            setTimeout(() => {
              startContinuousConversationalListen();
            }, 300);
          } else {
            // Standard static PUSH-TO-TALK mode means we do not auto-start
          }
        } else {
          startBackgroundWakeWord();
        }
      };

      utterance.onerror = () => {
        clearTimeout(watchdogTimer);
        setIsSpeechActive(false);
        speakActiveRef.current = false;
        addVocalDiagnostic("CONVO_MIC: SpeechSynthesis onerror triggered.");
        if (isHubOpenRef.current && (isConversingRef.current || isConcurrentStreamEnabledRef.current) && !isRecordingRef.current && !isProcessingRef.current) {
          setTimeout(() => {
            startContinuousConversationalListen();
          }, 300);
        } else {
          startBackgroundWakeWord();
        }
      };

      // Workaround for Chrome SpeechSynthesis GC (Garbage Collection) Bug
      // Store reference globally on window to prevent engine GC from truncating events
      (window as any)._activeSpeechUtterance = utterance;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis blocked or unsupported:", e);
    }
  };


  return (
    <AetherErrorBoundary>
      {/* 1. Large Immersive Split-Dashboard Modal Overlay */}
      <AnimatePresence>
        {isHubOpen && !isDrawingModeActive && (
          isUltraCompact ? (
            /* ULTRA COMPACT FLOATING PILL */
            <motion.div
              key="ultra-compact-pill"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="fixed right-6 bottom-24 w-[380px] max-w-[90vw] bg-[#0c0c0e]/95 border-2 border-yellow-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-[0_0_35px_rgba(245,158,11,0.35)] z-[100] backdrop-blur-md select-none font-sans"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
                  {isSpeechActive ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.6, 0.2] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-amber-500/20"
                      />
                      <Volume2 size={16} className="text-amber-400 animate-pulse z-10" />
                    </>
                  ) : isListeningForSpeech ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.6, 0.2] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-emerald-500/20"
                      />
                      <Mic size={16} className="text-emerald-400 z-10 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 rounded-full bg-zinc-800" />
                      <BrainCircuit size={16} className="text-zinc-500 z-10" />
                    </>
                  )}
                </div>

                <div className="text-left min-w-0 flex-grow">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-yellow-400 font-mono">
                      AETHER LIVE
                    </span>
                    <span className="text-[7px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                      {isSpeechActive ? "Speaking" : isListeningForSpeech ? "Listening" : "Standby"}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-300 font-medium truncate mt-0.5">
                    {speechTransitText 
                      ? speechTransitText 
                      : isSpeechActive 
                        ? (activeSpeechTextRef.current || "Aether speaking...") 
                        : (convoHistory[convoHistory.length - 1]?.text || "Ready for voice input...")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isSpeechActive && (
                  <button
                    onClick={() => handleIntelligentInterrupt()}
                    className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg transition-all cursor-pointer"
                    title="Interrupt Speech"
                  >
                    <VolumeX size={13} />
                  </button>
                )}

                <button
                  onClick={() => setIsUltraCompact(false)}
                  className="p-1.5 bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition-all cursor-pointer"
                  title="Maximize HUD"
                >
                  <Maximize2 size={13} />
                </button>

                <button
                  onClick={handleCloseAssistant}
                  className="p-1.5 bg-zinc-900 text-zinc-400 hover:text-rose-400 border border-zinc-800 rounded-lg transition-all cursor-pointer"
                  title="Close Aether"
                >
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          ) : (
            /* LARGE FULL-SCREEN HUD OVERLAY */
            <motion.div 
              key="large-hud"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className={`fixed selection:bg-yellow-500/30 flex items-center justify-center transition-all duration-300 ${
                isAssistantMinimized 
                  ? "inset-x-0 bottom-0 top-auto h-[48vh] w-full z-[90] pointer-events-none bg-transparent backdrop-blur-none sm:right-4 sm:bottom-[108px] sm:top-4 sm:w-[420px] sm:max-w-[95vw] sm:h-auto sm:max-h-[85vh] sm:inset-auto sm:z-[90] lg:right-0 lg:bottom-0 lg:top-0 lg:h-screen lg:w-[440px] lg:max-h-none lg:inset-auto lg:z-[90]" 
                  : "inset-0 z-[100] bg-black/85 backdrop-blur-md p-0 sm:p-4 pointer-events-auto"
              }`}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleCloseAssistant();
                }
              }}
            >
            <motion.div
              layout="position"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ 
                duration: 0.1, 
                ease: "easeOut",
                layout: { duration: 0.1, ease: "easeOut" }
              }}
              className={`flex flex-col relative transition-all duration-350 pointer-events-auto ${
                isAssistantMinimized
                  ? "w-full h-[48vh] bg-[#0c0c0e]/98 border-t border-zinc-800 rounded-t-3xl overflow-hidden shadow-[0_-10px_40px_rgba(245,158,11,0.22)] sm:w-full sm:h-full sm:bg-[#0c0c0e]/95 sm:border sm:border-zinc-850 sm:rounded-3xl sm:shadow-[0_0_40px_rgba(245,158,11,0.22)] lg:rounded-none lg:border-y-0 lg:border-l lg:border-zinc-850 lg:w-full lg:h-full lg:shadow-none"
                  : "w-full sm:max-w-6xl h-[100dvh] sm:h-[85vh] bg-[#0c0c0e] border-0 sm:border border-zinc-800 rounded-none sm:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.12)]"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (isSpeechActive) {
                  handleIntelligentInterrupt();
                }
              }}
            >
              {/* Header Branding Bar */}
              {isAssistantMinimized ? (
                <div className="p-3 bg-[#121214] border-b border-zinc-850 flex items-center justify-between gap-2 shrink-0 select-none">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 shrink-0">
                      <BrainCircuit size={16} />
                    </span>
                    <div className="text-left min-w-0">
                      <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 truncate">
                        Aether AI
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${isWakeWordListening ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Background listening microphone toggle */}
                    <button
                      onClick={() => toggleAetherMutedState(!isAetherMuted)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        !isAetherMuted 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                      title={!isAetherMuted ? "Mute Background Microphone Listening" : "Unmute Background Microphone Listening"}
                    >
                      {!isAetherMuted ? <Mic size={13} /> : <MicOff size={13} />}
                    </button>

                    {/* TTS sound play option */}
                    <button
                      onClick={() => {
                        setVoicePlayback(!voicePlayback);
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        voicePlayback 
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-850'
                      }`}
                      title={voicePlayback ? "Mute Speech Feedback" : "Unmute Speech Feedback"}
                    >
                      {voicePlayback ? <Volume2 size={13} /> : <VolumeX size={13} />}
                    </button>

                    {/* Minimize toggle (restores to full screen) */}
                    <button
                      onClick={() => setIsAssistantMinimized(false)}
                      className="p-1.5 hover:bg-zinc-900 hover:text-white text-zinc-400 rounded-lg transition-all cursor-pointer border border-zinc-800 bg-zinc-900"
                      title="Maximize to Full Screen"
                    >
                      <Maximize2 size={13} />
                    </button>

                    {/* Ultra Compact Toggle button */}
                    <button
                      onClick={() => setIsUltraCompact(true)}
                      className="p-1.5 hover:bg-zinc-900 hover:text-white text-yellow-400 rounded-lg transition-all cursor-pointer bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20"
                      title="Minimize to Floating Micro-Pill"
                    >
                      <Minimize2 size={13} />
                    </button>

                    <button
                      onClick={handleCloseAssistant}
                      className="p-1.5 hover:bg-zinc-900 hover:text-white text-zinc-400 rounded-lg transition-all cursor-pointer border border-zinc-800 bg-zinc-900"
                      title="Close Assistant"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-yellow-950/20 via-[#121214] to-zinc-950 border-b border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 animate-pulse">
                      <BrainCircuit size={18} />
                    </span>
                    <div className="text-left">
                      <h4 className="text-sm font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
                        Aether AI Cognitive Synaptic Workspace
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mt-0.5">
                        Vocal & Cooperative Session HUD
                      </p>
                    </div>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-2">
                    {/* Web Speech wake word listening status lamp indicator */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800">
                      <span className={`w-2 h-2 rounded-full ${isWakeWordListening ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-650'}`} />
                      <span className="text-[10px] font-mono text-zinc-400">
                        {isWakeWordListening ? 'Voice Rec Active' : 'Voice Standby'}
                      </span>
                    </div>

                    {/* Background listening microphone toggle */}
                    <button
                      onClick={() => toggleAetherMutedState(!isAetherMuted)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        !isAetherMuted 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                      title={!isAetherMuted ? "Mute Background Microphone Listening" : "Unmute Background Microphone Listening"}
                    >
                      {!isAetherMuted ? <Mic size={15} /> : <MicOff size={15} />}
                    </button>

                    {/* TTS sound play option */}
                    <button
                      onClick={() => {
                        setVoicePlayback(!voicePlayback);
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        voicePlayback 
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-850'
                      }`}
                      title={voicePlayback ? "Mute Speech Feedback" : "Unmute Speech Feedback"}
                    >
                      {voicePlayback ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>

                    {/* Minimize Toggle button */}
                    <button
                      onClick={() => setIsAssistantMinimized(!isAssistantMinimized)}
                      className="p-1.5 hover:bg-zinc-900 hover:text-white text-zinc-400 rounded-xl transition-all cursor-pointer"
                      title={isAssistantMinimized ? "Maximise to Full Screen" : "Minimize to Sidebar"}
                    >
                      {isAssistantMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </button>

                    {/* Ultra Compact Toggle button */}
                    <button
                      onClick={() => setIsUltraCompact(true)}
                      className="p-1.5 hover:bg-zinc-900 hover:text-white text-yellow-400 rounded-xl transition-all cursor-pointer bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20"
                      title="Minimize to Floating Micro-Pill"
                    >
                      <Minimize2 size={16} />
                    </button>

                    <button
                      onClick={() => {
                        handleCloseAssistant();
                      }}
                      className="p-1.5 hover:bg-zinc-900 hover:text-white text-zinc-400 rounded-xl transition-all cursor-pointer"
                      title="Close Assistant"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Main Panel Tabs Selector */}
              {!isAssistantMinimized && (
                <div className="flex md:hidden bg-[#0a0a0c] p-1.5 border-b border-zinc-850 shrink-0 justify-around select-none">
                  <button
                    onClick={() => setMobilePanel('control')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${
                      mobilePanel === 'control'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                        : 'text-zinc-500 hover:text-zinc-350 bg-transparent border border-transparent'
                    }`}
                  >
                    <MessageSquare size={13} /> Dialogue
                  </button>
                  <button
                    onClick={() => setMobilePanel('summary')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 relative ${
                      mobilePanel === 'summary'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                        : 'text-zinc-500 hover:text-zinc-350 bg-transparent border border-transparent'
                    }`}
                  >
                    <FileText size={13} /> Sheets
                    {sessionItems.length > 0 && (
                      <span className="absolute top-1 right-2 w-4 h-4 bg-yellow-500 text-black text-[9px] font-black rounded-full flex items-center justify-center">
                        {sessionItems.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Main Content Area Split Panel */}
              <div className="flex-grow flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-900">
                <div className={`flex flex-col p-4 sm:p-5 overflow-hidden flex-1 min-h-0 relative space-y-4 ${
                  isAssistantMinimized ? 'w-full' : 'w-full md:w-1/2'
                } ${!isAssistantMinimized && mobilePanel !== 'control' ? 'hidden md:flex' : 'flex'}`}>
                  <div className="flex items-center justify-between shrink-0 select-none">
                    <span className="text-[10px] uppercase font-black text-yellow-400 tracking-widest font-mono flex items-center gap-1">
                      <MessageSquare size={12} className="text-yellow-450 animate-pulse" />
                      Aether Sync Controller
                    </span>

                    {/* Integrated Tab Selectors */}
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900 shrink-0">
                      <button
                        onClick={() => { haptic.light(); setHudTab('speak'); }}
                        className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 ${
                          hudTab === 'speak' 
                            ? 'bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/10' 
                            : 'text-zinc-500 hover:text-zinc-350 bg-transparent border border-transparent'
                        }`}
                      >
                        <MessageSquare size={10} /> Dialogue Chat
                      </button>
                      <button
                        onClick={() => { haptic.light(); setHudTab('notepad'); }}
                        className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1.5 ${
                          hudTab === 'notepad' 
                            ? 'bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/10' 
                            : 'text-zinc-500 hover:text-zinc-350 bg-transparent border border-transparent'
                        }`}
                      >
                        <FileText size={10} /> Written Notepad
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        haptic.medium();
                        if (window.speechSynthesis) window.speechSynthesis.cancel();
                        setAetherFeedback(null);
                        setConvoHistory([]);
                        setPendingNote(null);
                      }}
                      className="text-zinc-650 hover:text-rose-450 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Clear Stream
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {hudTab === 'speak' ? (
                      <motion.div
                        key="speak-tab"
                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-grow flex flex-col min-h-0 space-y-3"
                      >
                      {/* Interactive Mouse Selection & Context Dashboard */}
                      {((circledContexts && circledContexts.length > 0) || isDrawingModeActive) && (
                        <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900/85 text-left shrink-0">
                          <div className="flex items-center justify-between mb-2 select-none">
                            <div className="flex items-center gap-1.5">
                              <Target size={12} className="text-yellow-400 animate-pulse" />
                              <span className="text-[10px] uppercase font-black tracking-widest text-yellow-400 font-mono">Spatial Screen Context</span>
                            </div>
                            
                            <button
                              onClick={() => {
                                setDrawingModeActive(!isDrawingModeActive);
                                showToast(
                                  !isDrawingModeActive ? "🎯 Activated screen region draw mode" : "🚫 Deactivated screen region draw mode",
                                  "info",
                                  2000
                                );
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                isDrawingModeActive
                                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 animate-pulse'
                                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                              }`}
                            >
                              <MousePointerClick size={10} />
                              <span>{isDrawingModeActive ? "Drawing Active" : "Circle Regions"}</span>
                            </button>
                          </div>

                          {/* List of active circled areas */}
                          {circledContexts && circledContexts.length > 0 ? (
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase">Active Captured Areas ({circledContexts.length})</span>
                                <button
                                  onClick={() => {
                                    clearCircledContexts();
                                    showToast("🧹 Cleared all screen context areas", "info", 1500);
                                  }}
                                  className="text-[8px] text-red-400 hover:text-red-300 font-mono font-bold uppercase cursor-pointer"
                                >
                                  Clear All
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {circledContexts.map((ctx, idx) => (
                                  <div key={ctx.id} className="flex items-center justify-between gap-1.5 bg-zinc-900/80 border border-zinc-850 px-2 py-1 rounded-lg text-[9.5px]">
                                    <span className="text-zinc-300 truncate max-w-[120px] font-mono">{ctx.label || `Area #${idx + 1}`}</span>
                                    <button
                                      onClick={() => {
                                        useStore.setState(state => ({
                                          circledContexts: state.circledContexts.filter(c => c.id !== ctx.id)
                                        }));
                                      }}
                                      className="text-zinc-500 hover:text-red-400 cursor-pointer"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[9px] text-zinc-500 font-mono leading-normal">
                              Context mode active. Circle any area on screen using cursor or Alt + drag.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Real-time Dynamic Acoustic Synaptic feedback tracker */}
                      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/40 rounded-xl border border-zinc-850/60 font-sans select-none shrink-0 text-left">
                        <div className="flex items-center gap-2">
                          {isSpeechActive ? (
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                              </span>
                              <span className="text-[10px] font-bold text-amber-400 font-mono tracking-wider uppercase">Aether Synthesis Speaking</span>
                            </div>
                          ) : isListeningForSpeech ? (
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider uppercase">Aether Listening to Mic</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <span className="w-2 h-2 rounded-full bg-zinc-700" />
                              <span className="text-[10px] font-mono tracking-wider uppercase">Aether Standby</span>
                            </div>
                          )}
                        </div>

                        {/* Animated audio ripple feedback bars */}
                        <div className="flex items-end gap-[2px] h-3">
                          {Array.from({ length: 6 }).map((_, i) => {
                            let duration = 0.5 + i * 0.12;
                            let actBg = "bg-zinc-750";
                            if (isSpeechActive) actBg = "bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.5)]";
                            else if (isListeningForSpeech) actBg = "bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.5)]";

                            return (
                              <motion.span
                                key={i}
                                animate={
                                  isSpeechActive || isListeningForSpeech
                                    ? { height: [4, 12, 4] }
                                    : { height: [4, 4, 4] }
                                }
                                transition={{
                                  duration: duration,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className={`w-[2.5px] rounded-t ${actBg} transition-all`}
                                style={{ height: '4px' }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Chat bubbles container */}
                      <div className="flex-grow min-h-0 pr-2 space-y-2 rounded-xl bg-zinc-950/40 p-3 border border-zinc-900/60 flex flex-col justify-between select-text">
                        {convoHistory.length > 0 && (
                          <div className="flex items-center justify-between pb-2 border-b border-zinc-900/80 text-[10px] text-zinc-500 font-mono">
                            <span className="flex items-center gap-1.5 text-zinc-400">
                              <MessageSquare size={11} className="text-yellow-400" />
                              <span>{convoHistory.length} messages</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const allText = convoHistory
                                  .map((m) => `${m.role === 'user' ? 'User' : 'Aether'}:\n${m.text}`)
                                  .join('\n\n---\n\n');
                                navigator.clipboard.writeText(allText);
                                setCopiedAll(true);
                                setTimeout(() => setCopiedAll(false), 2000);
                              }}
                              className="px-2 py-0.5 rounded bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Copy full conversation"
                            >
                              {copiedAll ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                              <span>{copiedAll ? 'Copied All' : 'Copy All'}</span>
                            </button>
                          </div>
                        )}
                        <div className="space-y-3.5 flex-1 overflow-y-auto mb-2 select-text">
                          {convoHistory.length === 0 && !aetherFeedback ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 select-none">
                              <div className="relative flex items-center justify-center w-24 h-24">
                                {/* Outer concentric pulsing rings */}
                                <motion.div 
                                  animate={{ scale: [1, 1.35, 1], opacity: [0.12, 0.45, 0.12] }}
                                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                  className="absolute inset-0 rounded-full bg-yellow-500/10 filter blur-md"
                                />
                                <motion.div 
                                  animate={{ scale: [1.12, 1.55, 1.12], opacity: [0.06, 0.25, 0.06] }}
                                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                                  className="absolute -inset-4 rounded-full bg-amber-500/5 filter blur-lg"
                                />
                                
                                {/* Inner rotating gradient core */}
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-450 to-rose-500 opacity-80 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.3)]"
                                >
                                  <Bot size={22} className="text-zinc-950 stroke-[2.5]" />
                                </motion.div>
                              </div>
                              
                              <div className="space-y-1">
                                <h4 className="text-zinc-200 font-sans font-extrabold text-xs animate-pulse">Aether Cognition Stream Active</h4>
                                <p className="text-[10px] text-zinc-500 max-w-[280px] leading-relaxed">
                                  Say <span className="font-mono text-yellow-400 font-bold">"{wakeWord}"</span> to activate voice hands-free. You can ask to <span className="font-mono text-yellow-400 font-bold">brainstorm 20 ideas</span> for any project, or request your <span className="font-mono text-yellow-400 font-bold">daily summary</span>!
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3.5 select-text">
                              {convoHistory.map((item, idX) => (
                                <div key={idX} className={`flex flex-col group/msg ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed border transition-all relative select-text ${
                                    item.role === 'user'
                                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-100 rounded-tr-none font-sans'
                                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-200 rounded-tl-none font-sans'
                                  }`}>
                                    <div className="flex items-center justify-between gap-2 mb-1.5 select-none">
                                      <span className="text-[8px] tracking-widest uppercase font-mono block text-left opacity-60">
                                        {item.role === 'user' ? '👨‍💻 Dispatch command' : '🤖 Aether Synthesis'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(item.text);
                                          setCopiedMessageIndex(idX);
                                          setTimeout(() => setCopiedMessageIndex(null), 2000);
                                        }}
                                        className="opacity-60 group-hover/msg:opacity-100 p-0.5 hover:text-yellow-400 text-zinc-400 rounded transition-opacity cursor-pointer"
                                        title="Copy message text"
                                      >
                                        {copiedMessageIndex === idX ? (
                                          <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 font-mono">
                                            <Check size={10} /> Copied
                                          </span>
                                        ) : (
                                          <Copy size={11} />
                                        )}
                                      </button>
                                    </div>
                                    
                                    {item.role === 'user' ? (
                                      <p className="leading-relaxed whitespace-pre-wrap select-text">{item.text}</p>
                                    ) : (
                                      <div className="markdown-body prose prose-invert prose-p:leading-relaxed prose-sm text-zinc-250 max-w-none select-text">
                                        <Markdown
                                          remarkPlugins={[remarkGfm]}
                                          components={{
                                            a: ({ node, ...props }) => (
                                              <a
                                                {...props}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 font-medium hover:underline inline-flex items-center gap-0.5"
                                              >
                                                {props.children}
                                                <ExternalLink size={10} className="inline opacity-70" />
                                              </a>
                                            )
                                          }}
                                        >
                                          {item.text}
                                        </Markdown>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {/* Proposed Action Confirmation Panel */}
                              {proposedAction && (
                                <div className="mt-3 bg-zinc-900/95 border-2 border-yellow-500/40 rounded-2xl p-4 space-y-3 shadow-lg hover:shadow-yellow-500/5 transition-all text-left select-text">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400">
                                      <BrainCircuit size={14} className="animate-pulse" />
                                    </span>
                                    <div>
                                      <span className="text-[9px] font-mono font-bold text-yellow-400 uppercase tracking-widest block leading-none">PROPOSED COGNITIVE ACTION</span>
                                      <span className="text-xs font-black text-zinc-100 mt-1 block">Confirm Workspace Change?</span>
                                    </div>
                                  </div>

                                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-805 text-xs text-zinc-300 font-sans space-y-1 select-text">
                                    <div className="font-bold text-yellow-400 font-mono text-[10px] uppercase">
                                      {proposedAction.actionDisplay}
                                    </div>
                                    <p className="text-[11px] text-zinc-400 leading-normal italic">
                                      "I detected your speech request to execute this change. Please review the structured values."
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 text-[10px] font-sans">
                                    <button
                                      onClick={() => executeProposedAction(proposedAction)}
                                      className="flex-1 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                                    >
                                      ✓ Accept & Save
                                    </button>
                                    <button
                                      onClick={() => discardProposedAction(proposedAction)}
                                      className="flex-grow py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-800"
                                    >
                                      ✗ Deny / Discard
                                    </button>
                                  </div>

                                  <p className="text-[9px] font-mono text-zinc-500 text-center uppercase tracking-widest leading-none pt-1">
                                    Voice ready: Say "yes / accept" or "no / deny"
                                  </p>
                                </div>
                              )}

                              {/* Direct Aether dynamic single fallback feedback */}
                              {aetherFeedback?.explanation && convoHistory.length === 0 && (
                                <div className="flex flex-col items-start select-text">
                                  <div className="max-w-[85%] p-3.5 rounded-2xl rounded-tl-none bg-zinc-900/60 border border-zinc-800 text-zinc-200 text-xs leading-relaxed select-text">
                                    <div className="flex items-center justify-between gap-2 mb-1.5 select-none">
                                      <span className="text-[8px] tracking-widest uppercase font-mono block text-left text-yellow-400 font-black">
                                        🤖 Aether Synthesis
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(aetherFeedback.explanation);
                                          setCopiedMessageIndex(9999);
                                          setTimeout(() => setCopiedMessageIndex(null), 2000);
                                        }}
                                        className="p-0.5 hover:text-yellow-400 text-zinc-400 rounded transition-opacity cursor-pointer"
                                        title="Copy feedback"
                                      >
                                        {copiedMessageIndex === 9999 ? (
                                          <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 font-mono">
                                            <Check size={10} /> Copied
                                          </span>
                                        ) : (
                                          <Copy size={11} />
                                        )}
                                      </button>
                                    </div>
                                    <div className="markdown-body prose prose-invert prose-p:leading-relaxed prose-sm text-zinc-250 max-w-none select-text">
                                      <Markdown remarkPlugins={[remarkGfm]}>
                                        {aetherFeedback.explanation}
                                      </Markdown>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    ) : (
                      /* RICH NOTEPAD WRITER: Dynamic quick scratch logbook */
                      <motion.div
                        key="notepad-tab"
                        initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="flex-grow flex flex-col min-h-0 text-left"
                      >
                        <div className="flex-grow flex flex-col bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-xl space-y-4 min-h-0 text-left">
                          <div>
                            <span className="text-[9px] font-mono font-black text-yellow-400 uppercase tracking-widest leading-none block">
                              Workspace Notepad
                            </span>
                            <h5 className="text-zinc-200 font-sans font-bold text-xs mt-1">Manual written drafts & guidelines</h5>
                            <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                              Type down technical thoughts or scratch ideas freely. Press <span className="font-mono text-zinc-400 font-bold">Enter</span> to instantly convert your paragraph into a structured suggestion card on the right split-desk!
                            </p>
                          </div>

                          <textarea
                            value={scratchpadText}
                            onChange={(e) => setScratchpadText(e.target.value)}
                            placeholder="Write down details e.g.: 'Analyze project dashboard layout and structure new sprint backlogs'..."
                            className="flex-grow w-full bg-[#0d0d0f]/90 border border-zinc-850 p-3.5 rounded-xl text-zinc-100 text-xs focus:ring-1 focus:ring-yellow-500/25 focus:outline-none placeholder-zinc-700 resize-none font-sans leading-relaxed min-h-[160px]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (scratchpadText.trim()) {
                                  const draftText = scratchpadText.trim();
                                  const newItem = {
                                    id: `notepad-${Math.random().toString(36).substring(7)}`,
                                    type: 'note' as const,
                                    title: draftText.substring(0, 36) + (draftText.length > 36 ? '...' : ''),
                                    content: draftText,
                                    saved: false,
                                    isSuggested: true
                                  };
                                  setSessionItems(prev => [newItem, ...prev]);
                                  setScratchpadText('');
                                  triggerBrowserSpeechSynthesis("Staged scratchnote directly to ideas list.");
                                }
                              }
                            }}
                          />

                          <div className="flex gap-2.5 shrink-0">
                            <button
                              onClick={() => {
                                if (!scratchpadText.trim()) return;
                                const draftText = scratchpadText.trim();
                                const newItem = {
                                  id: `notepad-${Math.random().toString(36).substring(7)}`,
                                  type: 'note' as const,
                                  title: draftText.substring(0, 40) + (draftText.length > 40 ? '...' : ''),
                                  content: draftText,
                                  saved: false,
                                  isSuggested: true
                                };
                                setSessionItems(prev => [newItem, ...prev]);
                                setScratchpadText('');
                                triggerBrowserSpeechSynthesis("Draft staged.");
                              }}
                              disabled={!scratchpadText.trim()}
                              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40"
                            >
                              ➕ Stage Suggestion
                            </button>

                            <button
                              onClick={async () => {
                                if (!scratchpadText.trim() || isProcessing) return;
                                const queryVal = scratchpadText.trim();
                                setScratchpadText('');
                                setHudTab('speak');
                                setIsProcessing(true);
                                setProcessingStatus("Aether processing notepad commands...");

                                try {
                                  const contextPayload = projects.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    description: p.description
                                  }));
                                  const res = await fetch('/api/text/process', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      textCommand: queryVal,
                                      projectContexts: contextPayload,
                                      cortexSynapses: cortexSynapses || [],
                                      notes: notes || [],
                                      aetherPersonalityRules: aetherPersonalityRules || [],
                                      aiContextRules: aiContextRules || "",
                                      history: convoHistory,
                                      pendingNote: pendingNote,
                                      activeProjectId,
                                      currentPath: location.pathname
                                    })
                                  });
                                  if (!res.ok) throw new Error("Aether process error");
                                  const data = await res.json();
                                  handleProcessedResponse(data);
                                } catch(ex: any) {
                                  setAetherFeedback({ error: "Failed analyzing scratch log." });
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={!scratchpadText.trim()}
                              className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-405 text-zinc-955 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                            >
                              ✨ AI Parse Notepad
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions / Dispatch Bar at the Bottom on the Left */}
                  <div className="bg-zinc-900/45 border border-zinc-850/70 p-3.5 rounded-2xl space-y-3 shrink-0">
                    {/* Active vocal processing/loader tracker */}
                    {isProcessing && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl font-mono text-[10px] text-yellow-400">
                        <Loader2 size={13} className="animate-spin text-yellow-400 shrink-0" />
                        <span>{processingStatus || 'Processing voice note...'}</span>
                      </div>
                    )}

                    {/* Microphone capture tray */}
                    {!isProcessing && (
                      <div className="flex flex-col items-center justify-center py-1">
                        {/* Interactive Hands-Free Voice Conversational Dashboard Tray */}
                        <div className="w-full">
                          {isMicPermissionBlocked ? (
                            /* 1. Mic permission blocked warning & Troubleshooting widget */
                            <div 
                              onClick={() => {
                                setIsMicPermissionBlocked(false);
                                navigator.mediaDevices.getUserMedia({ audio: true })
                                  .then((stream) => {
                                      stream.getTracks().forEach(track => track.stop());
                                      addVocalDiagnostic("SUCCESS: Microphone permission calibrated manually!");
                                      startContinuousConversationalListen();
                                  })
                                  .catch((err) => {
                                      addVocalDiagnostic(`ERROR: Re-requesting microphone failed with: ${err.message}`);
                                  });
                              }}
                              className="w-full bg-[#1c1112] hover:bg-[#201415] border border-rose-500/20 rounded-xl p-3.5 flex flex-col gap-2.5 cursor-pointer transition-all text-left shadow-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-rose-400 font-sans font-bold text-xs uppercase tracking-wider">
                                  <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                  </span>
                                  <span>Microphone Not Detected</span>
                                </div>
                                <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 text-[9px] font-mono text-rose-300 rounded font-black tracking-wider uppercase animate-pulse">CLICK TO FIX</span>
                              </div>
                              
                              <p className="text-[11px] text-zinc-300 leading-normal">
                                Your browser blocked standard microphone capture. <span className="text-yellow-400 font-extrabold underline">Tap here to re-prompt and authorize mic feeds</span> so you can talk to Aether.
                              </p>
                              
                              <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-900 text-[10px] text-zinc-400 font-sans space-y-1">
                                <p className="font-extrabold text-zinc-300 uppercase tracking-wider text-[8px] font-mono">Chrome / Safari Fix Guide:</p>
                                <p>1. Look at your address bar (near URL refresh button) & look for a <strong className="text-zinc-200">mic/camera lock icon</strong>.</p>
                                <p>2. Tap it, and set <strong className="text-emerald-400">Microphone to "Allow"</strong>.</p>
                                <p>3. Tap anywhere inside this window to wake up the Aether standby circuit.</p>
                              </div>
                            </div>
                          ) : isSpeechActive ? (
                            /* 2. AI is currently speaking - clicking anywhere cancels and listens! */
                            <div 
                              onClick={() => handleIntelligentInterrupt()}
                              className="w-full bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all animate-pulse shadow-sm"
                            >
                              <div className="text-left font-sans flex items-center gap-2.5">
                                <span className="relative flex h-3 w-3 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                                </span>
                                <div>
                                  <span className="text-[9px] font-mono text-amber-500 block leading-none font-bold uppercase tracking-wider">AETHER COGNITIVE FEEDBACK ACTIVE</span>
                                  <span className="text-xs font-bold text-zinc-100 mt-0.5 block">AI is speaking... Tap anywhere to interrupt & speak!</span>
                                </div>
                              </div>
                              <div className="px-2 py-1 bg-amber-500/20 text-yellow-400 text-[9px] font-black tracking-wide border border-yellow-500/20 rounded-md">
                                INTERRUPT
                              </div>
                            </div>
                          ) : isListeningForSpeech ? (
                            /* 3. Microphone is open and listening in real-time */
                            <div className="w-full space-y-2.5">
                              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-900 shadow-inner">
                                <div className="flex items-center gap-2">
                                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                  </span>
                                  <span className="font-mono text-zinc-300 text-xs font-black uppercase tracking-widest">
                                    {speechTransitText ? 'Aether Hearing You...' : 'Speak Now...'}
                                  </span>
                                </div>

                                {/* Dynamic visual spectrum wave using simulated buffer */}
                                <div className="flex items-end gap-[3px] h-4 overflow-hidden max-w-[80px]">
                                  {Array.from({ length: 8 }).map((_, i) => {
                                    const h = speechTransitText ? Math.max(3, Math.round(Math.random() * 20 + 4)) : 3;
                                    return (
                                      <span
                                        key={i}
                                        className="w-[3.5px] rounded-t bg-emerald-500 transition-all duration-100"
                                        style={{ height: `${h}px` }}
                                      />
                                    );
                                  })}
                                </div>
                              </div>

                              {speechTransitText && (
                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-left">
                                  <span className="text-[8px] tracking-wider uppercase font-extrabold text-emerald-500 font-mono block mb-1">Live Transcript</span>
                                  <p className="text-xs font-medium text-emerald-100 italic leading-snug">"{speechTransitText}"</p>
                                </div>
                              )}

                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={() => setIsUltraCompact(true)}
                                  className="px-2.5 py-1 text-[9px] font-black tracking-wide bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none uppercase font-mono animate-pulse"
                                  title="Minimize to floating micro-pill while keeping conversational microphone active"
                                >
                                  <Minimize2 size={11} /> Minimize & Keep Conversing
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* 4. Silent wait state or starting up state */
                            <div 
                              onClick={startContinuousConversationalListen}
                              className="w-full bg-zinc-950/70 hover:bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-850 flex items-center justify-between cursor-pointer transition-all"
                            >
                              <div className="text-left font-sans flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse shrink-0" />
                                <span className="text-xs font-semibold text-zinc-400">Ready for voice input. Tap or speak to start.</span>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                                <Mic size={11} className="animate-pulse" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Text field input trigger */}
                    <div className="flex gap-2 items-center bg-zinc-950 rounded-xl border border-zinc-850 p-1">
                      <textarea
                        rows={1}
                        value={typedCommand}
                        onChange={(e) => setTypedCommand(e.target.value)}
                        placeholder="Say 'Add key task compile database' or write here..."
                        className="flex-grow bg-transparent px-2.5 py-1.5 text-zinc-100 text-xs focus:outline-none placeholder-zinc-600 resize-none font-sans"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendTextCommand();
                          }
                        }}
                      />
                      <button
                        onClick={handleSendTextCommand}
                        disabled={!typedCommand.trim()}
                        className="p-2 rounded-lg bg-yellow-500 disabled:bg-zinc-850 disabled:text-zinc-600 hover:bg-yellow-450 text-zinc-955 transition-all shrink-0 cursor-pointer"
                      >
                        <Send size={11} />
                      </button>
                    </div>

                  </div>
                </div>

                {/* RIGHT PANELS: Workspace Summary note grid and Inline Edits */}
                {!isAssistantMinimized && (
                  <div className={`w-full md:w-1/2 flex flex-col p-4 sm:p-5 bg-[#09090b]/80 flex-1 min-h-0 overflow-hidden space-y-4 ${
                    mobilePanel !== 'summary' ? 'hidden md:flex' : 'flex'
                  }`}>
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-[10px] uppercase font-black text-yellow-400 tracking-widest font-mono flex items-center gap-1">
                      <FileText size={12} className="text-yellow-450" />
                      Interactive Summary & Workspace Sheet
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {sessionItems.length} active ideas
                    </span>
                  </div>

                  {/* Summary grid view with inputs for direct edits */}
                  <div className="flex-grow overflow-y-auto pr-1 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent rounded-xl bg-zinc-950/20 p-2 border border-zinc-900/60 min-h-0">
                    {sessionItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                        <Bot size={24} className="text-zinc-700/50 animate-pulse" />
                        <h4 className="text-zinc-400 font-sans font-bold text-xs">Sandbox editor workspace empty</h4>
                        <p className="text-[10px] text-zinc-500 max-w-[280px]">
                          As you speak, we create notes, tasks, or guidelines and show them here. You can directly edit any text before finalizing, or insert a manual block below!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sessionItems.map((item) => (
                          <div 
                            key={item.id} 
                            className={`bg-[#121215] border rounded-2xl p-4 space-y-3 hover:border-amber-500/35 transition-all relative group shadow-sm text-left ${item.saved ? 'border-emerald-500/30 bg-[#0f1712]/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-zinc-800'}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              {/* Category tag Selector */}
                              <select
                                value={item.type}
                                disabled={item.saved}
                                onChange={(e) => handleUpdateSessionItem(item.id, { type: e.target.value as any })}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[9px] font-black uppercase text-yellow-400 cursor-pointer focus:outline-none disabled:opacity-75"
                              >
                                <option value="note">📝 NOTE LOG</option>
                                <option value="task">✅ BACKLOG TASK</option>
                                <option value="brainstorm">💡 BRAINSTORM IDEA</option>
                                <option value="synapse">🧠 GUIDELINE</option>
                              </select>

                              <div className="flex items-center gap-2">
                                {item.saved ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase text-emerald-400 tracking-wider font-mono">
                                    ✓ Saved & Synced
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => commitSingleSessionItem(item.id)}
                                    className="px-2.5 py-1 rounded bg-[#d97706]/90 hover:bg-yellow-500 text-zinc-950 font-sans text-[9px] font-extrabold uppercase transition-all tracking-wider cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                                  >
                                    ✓ Accept
                                  </button>
                                )}

                                {/* Remove draft item */}
                                <button
                                  onClick={() => handleRemoveSessionItem(item.id)}
                                  className="p-1 hover:bg-rose-950/50 text-zinc-500 hover:text-rose-450 rounded-lg transition-colors cursor-pointer"
                                  title="Remove item draft"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Editable Title */}
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-wider text-zinc-500 block font-bold font-mono">Title</label>
                              <input
                                type="text"
                                value={item.title}
                                disabled={item.saved}
                                onChange={(e) => handleUpdateSessionItem(item.id, { title: e.target.value })}
                                className="w-full bg-[#1b1b1f] border border-zinc-850 px-2.5 py-1.5 rounded-lg text-xs text-zinc-100 font-bold focus:border-yellow-500/50 focus:outline-none disabled:opacity-45"
                                placeholder="Topic name..."
                              />
                            </div>

                            {/* Editable Content */}
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-wider text-zinc-550 block font-bold font-mono">Draft Details</label>
                              <textarea
                                rows={2.5}
                                value={item.content}
                                disabled={item.saved}
                                onChange={(e) => handleUpdateSessionItem(item.id, { content: e.target.value })}
                                className="w-full bg-[#1b1b1f] border border-zinc-850 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-350 leading-relaxed focus:border-yellow-500/50 focus:outline-none font-sans disabled:opacity-45"
                                placeholder="Edit compiled instructions or notes here..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Creative Sandbox additions & saving controls */}
                  <div className="space-y-3 shrink-0">
                    <div className="flex flex-wrap gap-1.5 bg-zinc-900/40 p-2 rounded-xl border border-zinc-850">
                      <span className="text-[8px] tracking-wider uppercase font-extrabold text-zinc-500 w-full block text-left mb-1 font-mono">
                        Quick Manual Inserts
                      </span>
                      <button
                        onClick={() => handleAddManualItem('note')}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded-lg flex items-center gap-1 border border-zinc-800 cursor-pointer"
                      >
                        <Plus size={10} /> +Note
                      </button>
                      <button
                        onClick={() => handleAddManualItem('task')}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded-lg flex items-center gap-1 border border-zinc-800 cursor-pointer"
                      >
                        <Plus size={10} /> +Backlog Task
                      </button>
                      <button
                        onClick={() => handleAddManualItem('brainstorm')}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded-lg flex items-center gap-1 border border-zinc-800 cursor-pointer"
                      >
                        <Plus size={10} /> +Brainstorm
                      </button>
                      <button
                        onClick={() => handleAddManualItem('synapse')}
                        className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-[9px] text-zinc-300 rounded-lg flex items-center gap-1 border border-zinc-800 cursor-pointer"
                      >
                        <Plus size={10} /> +Cognitive Rule
                      </button>
                    </div>

                    {/* Done and Save Session logic */}
                    <button
                      onClick={commitSessionItems}
                      disabled={sessionItems.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-amber-600 top-gradient via-amber-550 to-yellow-400 hover:from-amber-500 hover:to-yellow-350 disabled:from-zinc-900 disabled:to-zinc-900 disabled:text-zinc-655 disabled:border-zinc-850 border border-yellow-500/10 text-zinc-950 font-black tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-[0_4px_24px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_30px_rgba(234,179,8,0.35)] shrink-0 cursor-pointer font-sans"
                    >
                      <CheckCircle2 size={15} />
                      <span>CONCLUDE & COMMIT SYNAPSE SESSION</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

              {/* Voice Macro Wizard Overlay Modal Panel */}
              {voiceMacroStep !== 'idle' && (
                <div className="absolute inset-0 z-[110] bg-[#0c0c0e]/98 backdrop-blur-md flex flex-col justify-between p-6 overflow-y-auto">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-4 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-yellow-500 animate-pulse">
                        <BrainCircuit size={18} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-bold text-zinc-100 font-sans tracking-tight">Aether Macro Builder</h3>
                        <p className="text-[10px] text-zinc-500 font-mono">STEP-BY-STEP VOICE GUIDED REGISTRATION</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setVoiceMacroStep('idle')}
                      className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Wizard Content Body */}
                  <div className="flex-grow flex flex-col items-center justify-center py-6 text-center space-y-6">
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-800">
                      <span className={voiceMacroStep === 'naming' ? 'text-yellow-400 font-black' : ''}>1. Initialize</span>
                      <span>•</span>
                      <span className={voiceMacroStep === 'motion' ? 'text-yellow-400 font-black' : ''}>2. Gesture</span>
                      <span>•</span>
                      <span className={voiceMacroStep === 'confirm' ? 'text-yellow-400 font-black' : ''}>3. Finalize</span>
                    </div>

                    {/* Conditional step visuals */}
                    {voiceMacroStep === 'naming' && (
                      <div className="space-y-4 max-w-md">
                        <div className="w-16 h-16 rounded-full bg-yellow-500/5 flex items-center justify-center border border-yellow-500/20 mx-auto text-yellow-400">
                          <Plus size={28} className="animate-pulse" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-extrabold text-zinc-100 font-sans">Ready to map: <span className="text-yellow-400">"{voiceMacroName}"</span></h4>
                          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                            Aether will bind your custom gesture path to the action: <strong className="text-zinc-200">{voiceMacroAction}</strong>.
                          </p>
                        </div>

                        {voiceMacroContradiction && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-left flex gap-2">
                            <span className="text-amber-400 shrink-0 mt-0.5 font-mono text-xs font-bold">⚠️ CONFLICT:</span>
                            <p className="text-[11px] text-amber-300 font-sans font-medium leading-normal">{voiceMacroContradiction}</p>
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            onClick={handleWizardStartCountdown}
                            className="w-full sm:w-auto px-6 py-2.5 bg-[#d97706] hover:bg-yellow-500 text-zinc-950 font-sans text-xs font-black rounded-xl tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-1.5 cursor-pointer mx-auto"
                          >
                            <Mic size={14} /> START RECORDING MOTION
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-550 font-mono">
                          You can also say <strong className="text-zinc-450 font-black">"start recording"</strong> or <strong className="text-zinc-450 font-black">"cancel"</strong>
                        </p>
                      </div>
                    )}

                    {voiceMacroStep === 'motion' && (
                      <div className="space-y-6 max-w-sm">
                        {trainingCountdown > 0 ? (
                          <div className="space-y-4">
                            <div className="text-6xl font-black text-yellow-500 font-sans animate-ping duration-1000">{trainingCountdown}</div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-zinc-100">Prepare your Hand Gesture...</h4>
                              <p className="text-xs text-zinc-400">Position your hand in front of your camera frame.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {/* Active radar/pulsing circle */}
                            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                              <div className="absolute inset-0 rounded-full bg-red-500/10 border border-red-500/35 animate-ping duration-1000" />
                              <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/50 flex items-center justify-center text-red-500">
                                <Video size={24} className="animate-pulse" />
                              </div>
                            </div>
                            
                            <div className="space-y-1.5">
                              <h4 className="text-sm font-black text-red-400 uppercase tracking-wider font-sans">RECORDING MOTION PATH</h4>
                              <p className="text-xs text-zinc-400">Perform your gesture clearly. Move your hand up to 3 seconds.</p>
                            </div>

                            {/* Custom progress bar */}
                            <div className="w-full h-1.5 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-100 ease-linear"
                                style={{ width: `${trainingProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {voiceMacroStep === 'confirm' && (
                      <div className="space-y-5 max-w-md">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/20 mx-auto text-emerald-450">
                          <CheckCircle2 size={28} className="animate-bounce" />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-extrabold text-zinc-100 font-sans">Motion Capture Complete!</h4>
                          <p className="text-xs text-zinc-400 font-sans">
                            Successfully registered <strong className="text-zinc-200">{voiceMacroPoints.length}</strong> coordinate path points.
                          </p>
                        </div>

                        {/* Miniature Path Preview canvas rendering */}
                        <div className="h-28 w-44 rounded-xl border border-zinc-850 bg-zinc-950/80 p-2 mx-auto flex flex-col justify-between items-center relative overflow-hidden shadow-inner">
                          <span className="text-[7px] text-zinc-650 font-mono absolute top-2 left-2">NORMALIZED PATH PREVIEW</span>
                          
                          {/* Svg Path rendering */}
                          {voiceMacroPoints.length > 0 ? (
                            <svg className="w-full h-full p-4 text-amber-500" viewBox="0 0 1 1">
                              <polyline
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.04"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={normalizePoints(voiceMacroPoints).map(p => `${p.x},${p.y}`).join(' ')}
                              />
                            </svg>
                          ) : (
                            <div className="text-[10px] text-zinc-600 mt-8 font-mono">No coordinates captured</div>
                          )}
                        </div>

                        {voiceMacroContradiction && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-left flex gap-2">
                            <span className="text-amber-400 shrink-0 mt-0.5 font-mono text-xs font-bold">⚠️ WARNING:</span>
                            <p className="text-[11px] text-amber-300 font-sans font-medium leading-normal">{voiceMacroContradiction}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                          <button
                            onClick={handleWizardTest}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-sans text-xs font-bold rounded-xl cursor-pointer"
                          >
                            🧪 TEST ACTION
                          </button>
                          <button
                            onClick={handleWizardStartCountdown}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-sans text-xs font-bold rounded-xl cursor-pointer"
                          >
                            🔄 RE-RECORD
                          </button>
                          <button
                            onClick={handleWizardSave}
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-zinc-950 font-sans text-xs font-black rounded-xl tracking-wider shadow-[0_4px_16px_rgba(16,185,129,0.25)] cursor-pointer"
                          >
                            ✓ SAVE & MAP MACRO
                          </button>
                        </div>

                        <p className="text-[9px] text-zinc-550 font-mono">
                          You can also say <strong className="text-zinc-450 font-black">"confirm"</strong>, <strong className="text-zinc-450 font-black">"test"</strong>, or <strong className="text-zinc-450 font-black">"re-record"</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Wizard Footer Guidance bar */}
                  <div className="bg-zinc-950/80 p-3 rounded-2xl border border-zinc-900 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 shrink-0 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Aether Speech is fully active. You can speak commands, confirm/reject, or use the touch buttons.</span>
                  </div>
                </div>
              )}

              {/* Bottom footer bar */}
              <div className="p-3 bg-zinc-950 border-t border-zinc-900 flex justify-between items-center text-[9px] text-zinc-500 font-mono shrink-0">
                <span>Aether Cognitive Hub Active • Dual Desk Environment</span>
                <span>SYSTEM ONLINE</span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 3. Full perimeter neon glow feedback around the screen (softened) */}
      <AnimatePresence>
        {isSpeechActive && isHubOpen && (
          <motion.div
            key="screen-perimeter-glow"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.15, 0.4, 0.15],
              boxShadow: [
                "inset 0 0 20px rgba(234, 179, 8, 0.15), inset 0 0 40px rgba(234, 179, 8, 0.08)",
                "inset 0 0 40px rgba(234, 179, 8, 0.3), inset 0 0 80px rgba(234, 179, 8, 0.15)",
                "inset 0 0 20px rgba(234, 179, 8, 0.15), inset 0 0 40px rgba(234, 179, 8, 0.08)"
              ]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 3.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="fixed inset-0 pointer-events-none z-[9999] border border-yellow-500/10 rounded-none transition-colors duration-1000"
          />
        )}
      </AnimatePresence>
    </AetherErrorBoundary>
  );
}

export default VoiceMemoAssistant;
