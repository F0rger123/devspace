import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, ShieldAlert, CheckCircle2, Play, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataProvider';

interface WakeWordEngineProps {
  onWakeWordDetected?: () => void;
  className?: string;
  showVisualizer?: boolean;
}

export const WakeWordEngine: React.FC<WakeWordEngineProps> = ({
  onWakeWordDetected,
  className = '',
  showVisualizer = true
}) => {
  const {
    wakeWord,
    setWakeWord,
    isWakeWordEnabled,
    setIsWakeWordEnabled,
    addVocalDiagnostic,
    setIsAssistantMinimized
  } = useData();

  const [isInitializing, setIsInitializing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isListeningState, setIsListeningState] = useState(false);
  const [lastDetectedPhoneme, setLastDetectedPhoneme] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [errMessage, setErrMessage] = useState('');
  
  const localRecogRef = useRef<any>(null);
  const isComponentAlive = useRef(true);
  const isTriggeredRef = useRef(false);

  // Stop recognition on unmount
  useEffect(() => {
    isComponentAlive.current = true;
    return () => {
      isComponentAlive.current = false;
      stopEngine();
    };
  }, []);

  // Monitor toggle changes to start/stop
  useEffect(() => {
    const isMuted = localStorage.getItem('isAetherMuted') === 'true';
    if (isWakeWordEnabled && !isMuted) {
      startEngine();
    } else {
      stopEngine();
    }
  }, [isWakeWordEnabled, wakeWord]);

  // Request or check media mic access
  const initializeMic = async () => {
    setIsInitializing(true);
    setErrMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop stream tracks immediately since we only used this to obtain system permission
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      addVocalDiagnostic && addVocalDiagnostic("WAKE_ENGINE: Microphone permissions verified successfully.");
      return true;
    } catch (err: any) {
      setHasPermission(false);
      setErrMessage('Microphone permission blocked by browser.');
      addVocalDiagnostic && addVocalDiagnostic(`CRITICAL: Wake Word mic authorization failed: ${err.message || err}`);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  const stopEngine = () => {
    if (localRecogRef.current) {
      try {
        localRecogRef.current.onstart = null;
        localRecogRef.current.onresult = null;
        localRecogRef.current.onerror = null;
        localRecogRef.current.onend = null;
        localRecogRef.current.stop();
      } catch (e) {}
      localRecogRef.current = null;
    }
    setIsListeningState(false);
  };

  const startEngine = async () => {
    const isMuted = localStorage.getItem('isAetherMuted') === 'true';
    if (isMuted) {
      setIsListeningState(false);
      return;
    }
    stopEngine();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrMessage('Web Speech API is not supported in this browser.');
      return;
    }

    if (hasPermission === false) {
      return; // Perm blocked
    }

    // Try verifying perm if null
    if (hasPermission === null) {
      const ok = await initializeMic();
      if (!ok) return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (!isComponentAlive.current) return;
        setIsListeningState(true);
        setErrMessage('');
      };

      recognition.onresult = (event: any) => {
        if (!isComponentAlive.current) return;
        
        let interimText = '';
        for (let i = 0; i < event.results.length; ++i) {
          interimText += event.results[i][0].transcript;
        }

        const transcript = interimText.toLowerCase().trim();
        setLastDetectedPhoneme(interimText);

        const target = wakeWord.toLowerCase().trim();

        // Proximate Phonetics Fallbacks for Aether standard
        const isMatched = 
          transcript.includes(target) ||
          transcript.includes('hey aether') || 
          transcript.includes('aether') || 
          transcript.includes('hey ether') || 
          transcript.includes('ether') || 
          transcript.includes('hey heather') || 
          transcript.includes('heather') ||
          transcript.includes('okay aether') ||
          transcript.includes('ok aether') ||
          transcript.includes('kay aether') ||
          transcript.includes('wake up aether') ||
          transcript.includes('activate aether') ||
          transcript.includes('hi aether');

        if (isMatched) {
          if (isTriggeredRef.current) return;
          isTriggeredRef.current = true;
          setTimeout(() => {
            isTriggeredRef.current = false;
          }, 2500);

          setMatchCount(prev => prev + 1);
          setLastDetectedPhoneme(`[MATCHED] "${transcript}"`);
          
          addVocalDiagnostic && addVocalDiagnostic(`WAKE_WORD_ENGINE: Trigger word detected! Match context: "${transcript}"`);
          
          // Trigger callbacks
          if (onWakeWordDetected) {
            onWakeWordDetected();
          }
          
          // Dispatch custom event to notify global VoiceMemoAssistant to open
          if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
            try {
              window.dispatchEvent(new CustomEvent('aether-wake-word-detected'));
            } catch (e) {}
          }
          
          // Small delay before recycling recognition to avoid continuous loops
          stopEngine();
          setTimeout(() => {
            if (isWakeWordEnabled && isComponentAlive.current) {
              startEngine();
            }
          }, 1500);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setHasPermission(false);
          setErrMessage('Mic permission denied.');
          setIsWakeWordEnabled(false);
          stopEngine();
        } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('WakeWordEngine recognition error:', e.error);
        }
      };

      recognition.onend = () => {
        if (!isComponentAlive.current) return;
        // Auto-restart if wake-word is still active
        if (isWakeWordEnabled) {
          setTimeout(() => {
            if (isWakeWordEnabled && isComponentAlive.current) {
              startEngine().catch(() => {});
            }
          }, 400);
        } else {
          setIsListeningState(false);
        }
      };

      localRecogRef.current = recognition;
      recognition.start();

    } catch (e: any) {
      console.error('Failed to boot WakeWordEngine:', e);
      setErrMessage('Initialization failure.');
      setIsListeningState(false);
    }
  };

  return (
    <div className={`p-4 bg-zinc-950/60 border border-zinc-850 rounded-2xl space-y-3.5 shadow-md relative overflow-hidden ${className}`}>
      
      {/* Visual neon grid background highlight when active */}
      <AnimatePresence>
        {isListeningState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-tr from-amber-600 via-transparent to-yellow-450 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          {isListeningState ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-zinc-700"></span>
          )}
          <span className="text-[9px] uppercase font-black tracking-widest font-mono text-zinc-400">
            Aether Standby Synaptic Interceptor
          </span>
        </div>

        {/* Diagnostic Matches */}
        {matchCount > 0 && (
          <span className="text-[8px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-yellow-400 font-mono font-bold uppercase shrink-0">
            {matchCount} wakes detected
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        
        {/* Core Control Toggle */}
        <div className="space-y-1 max-w-sm">
          <label className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">1. Target Wakephrase</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={wakeWord}
              onChange={(e) => setWakeWord(e.target.value)}
              placeholder="e.g. hey aether"
              className="bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-mono font-semibold max-w-[150px]"
            />
            <span className="text-[10.5px] text-zinc-500 font-sans italic">
              (e.g., "hey aether", "computer")
            </span>
          </div>
        </div>

        {/* Dynamic State Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={async () => {
              if (hasPermission === null || hasPermission === false) {
                await initializeMic();
              }
              setIsWakeWordEnabled(!isWakeWordEnabled);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center gap-1.5 transition-all cursor-pointer ${
              isWakeWordEnabled
                ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-350'
            }`}
          >
            <Power size={12} className={isWakeWordEnabled ? 'stroke-[2.5]' : ''} />
            {isWakeWordEnabled ? 'Active Standby' : 'Enable Standby'}
          </button>
        </div>
      </div>

      {/* Pulsing Visual Waveform Container */}
      {showVisualizer && isListeningState && (
        <div className="h-6 flex items-center justify-center gap-1 bg-[#101012]/40 rounded-lg border border-zinc-900/50 py-1.5 relative z-10">
          {[1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 5, 2, 4, 1, 3, 2, 5].map((val, idx) => (
            <motion.div
              key={idx}
              animate={{ 
                height: [6, val * 3.5, 6],
              }}
              transition={{
                duration: 0.9 + (idx % 3) * 0.15,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-0.5 rounded-full bg-gradient-to-t from-yellow-500 to-amber-400"
            />
          ))}
          <span className="text-[8px] text-zinc-500 font-mono uppercase ml-2 select-none tracking-widest bg-zinc-950/40 px-1.5 rounded">
            Interstellar frequency scan live...
          </span>
        </div>
      )}

      {/* Capturing transcript indicator */}
      {isListeningState && lastDetectedPhoneme && (
        <p className="text-[9px] text-zinc-450 font-mono italic leading-relaxed truncate px-1 border-l border-amber-500/40 relative z-10">
          🎙️ Last Audio Spark: "{lastDetectedPhoneme}"
        </p>
      )}

      {/* Status Warning / Perm block alert */}
      {errMessage && (
        <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg text-[9.5px] text-rose-300 font-sans relative z-10">
          <AlertCircle size={12} className="text-rose-400 flex-shrink-0" />
          <span>{errMessage}</span>
          <button
            onClick={initializeMic}
            className="underline font-bold text-rose-200 hover:text-white uppercase font-mono ml-auto text-[8px] cursor-pointer"
          >
            Grant Mic Access
          </button>
        </div>
      )}
    </div>
  );
};
