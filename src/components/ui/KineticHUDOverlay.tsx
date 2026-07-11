import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { 
  Activity, 
  Hand, 
  Sparkles, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Zap,
  HelpCircle,
  Info,
  Mic,
  MicOff
} from 'lucide-react';

export function KineticHUDOverlay() {
  const { 
    isKineticEnabled, 
    setKineticEnabled, 
    kineticHandsMode, 
    setKineticHandsMode,
    activeHandsDetected,
    hand1Fingers,
    hand2Fingers,
    lastTriggeredGesture,
    setLastTriggeredGesture,
    kineticInteractionMode,
    setKineticInteractionMode,
    virtualCursorPos,
    isPinching,
    isCameraOnlyMode
  } = useStore();

  const { showToast } = useData();
  const [isMinimized, setIsMinimized] = useState(false);
  const [displayGesture, setDisplayGesture] = useState<{ name: string; timestamp: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Voice Control States
  const [isVoiceControlActive, setIsVoiceControlActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'heard' | 'unsupported'>('idle');
  const [lastVoiceCommand, setLastVoiceCommand] = useState('');

  const interactionModeRef = React.useRef(kineticInteractionMode);
  useEffect(() => {
    interactionModeRef.current = kineticInteractionMode;
  }, [kineticInteractionMode]);

  useEffect(() => {
    if (!isVoiceControlActive || !isKineticEnabled) {
      setVoiceStatus('idle');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('unsupported');
      return;
    }

    let recognition: any = null;
    let shouldRestart = true;

    const initRecognition = () => {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setVoiceStatus('listening');
        };

        recognition.onresult = (event: any) => {
          let interimText = '';
          let isFinalResult = false;
          for (let i = 0; i < event.results.length; ++i) {
            interimText += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              isFinalResult = true;
            }
          }
          setVoiceTranscript(interimText);

          const transcriptLower = interimText.toLowerCase().trim();

          // Define matchers
          const matchesMouse = 
            transcriptLower.includes('enable mouse mode') || 
            transcriptLower.includes('mouse mode') || 
            transcriptLower.includes('switch to mouse mode') || 
            transcriptLower.includes('virtual mouse');

          const matchesMacro = 
            transcriptLower.includes('enable macro mode') || 
            transcriptLower.includes('macro mode') || 
            transcriptLower.includes('switch to macro mode') || 
            transcriptLower.includes('enable gesture mode') || 
            transcriptLower.includes('gesture mode') || 
            transcriptLower.includes('switch to gesture mode');

          const matchesToggle =
            transcriptLower.includes('switch mode') || 
            transcriptLower.includes('toggle mode') || 
            transcriptLower.includes('change mode');

          if (matchesMouse) {
            setKineticInteractionMode('cursor');
            setLastVoiceCommand('Enable Mouse Mode');
            setVoiceStatus('heard');
            showToast('🎙️ Voice Command: Activated Virtual Mouse Mode!', 'success', 3000);
            setVoiceTranscript('');
            if (recognition) recognition.stop();
          } else if (matchesMacro) {
            setKineticInteractionMode('gesture');
            setLastVoiceCommand('Enable Macro Mode');
            setVoiceStatus('heard');
            showToast('🎙️ Voice Command: Activated Actions & Macro Mode!', 'success', 3000);
            setVoiceTranscript('');
            if (recognition) recognition.stop();
          } else if (matchesToggle) {
            const nextMode = interactionModeRef.current === 'gesture' ? 'cursor' : 'gesture';
            setKineticInteractionMode(nextMode);
            setLastVoiceCommand(`Switch to ${nextMode === 'cursor' ? 'Mouse' : 'Macro'} Mode`);
            setVoiceStatus('heard');
            showToast(`🎙️ Voice Command: Swapped mode to ${nextMode === 'cursor' ? 'Virtual Mouse' : 'Actions & Macros'}!`, 'success', 3000);
            setVoiceTranscript('');
            if (recognition) recognition.stop();
          } else if (isFinalResult && transcriptLower.length > 1) {
            // It is a conversational query - route directly to Aether AI Sidebar!
            setLastVoiceCommand(interimText);
            setVoiceStatus('heard');
            setVoiceTranscript('');
            
            window.dispatchEvent(new CustomEvent('aether-submit-command', {
              detail: { text: interimText, openSidebar: true }
            }));
            
            showToast(`🎙️ Transmitting vocal feed to Aether AI...`, 'info', 3000);
            if (recognition) recognition.stop();
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('Speech recognition error:', event.error);
          }
        };

        recognition.onend = () => {
          if (shouldRestart) {
            setTimeout(() => {
              if (shouldRestart && isVoiceControlActive && isKineticEnabled) {
                try {
                  recognition.start();
                } catch (e) {}
              }
            }, 300);
          } else {
            setVoiceStatus('idle');
          }
        };

        recognition.start();
      } catch (err) {
        console.error('Failed to initialize speech recognition:', err);
        setVoiceStatus('unsupported');
      }
    };

    initRecognition();

    return () => {
      shouldRestart = false;
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [isVoiceControlActive, isKineticEnabled, setKineticInteractionMode, showToast]);

  // Sync and clear gesture notification after timeout
  useEffect(() => {
    if (lastTriggeredGesture) {
      setDisplayGesture(lastTriggeredGesture);
      const timer = setTimeout(() => {
        setDisplayGesture(null);
        // Clear in store too so it can be re-triggered
        setLastTriggeredGesture(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [lastTriggeredGesture, setLastTriggeredGesture]);

  if (isCameraOnlyMode) {
    return null;
  }

  if (!isKineticEnabled) {
    return null;
  }

  // Clear text modes description
  const modeDescription = kineticHandsMode === 'two'
    ? '🙌 Dual-Hand: tracks both hands to interpret advanced double-pose commands (e.g. Zen workspace, spatial capture).'
    : '🖐️ Single-Hand: tracks primary hand for swipe-scrolling, wrist paths, and single posture actions. High performance.';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 font-sans pointer-events-none select-none max-w-md w-[calc(100%-2rem)] flex flex-col items-center gap-2">
      
      {/* Gesture Trigger Flash Toast */}
      <AnimatePresence>
        {displayGesture && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-[#0c0c0e]/95 border border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.2)] rounded-xl py-2 px-4 flex items-center gap-2.5 pointer-events-auto"
          >
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 animate-pulse">
              <Sparkles size={13} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                {displayGesture.name}
              </p>
              <p className="text-[8px] text-emerald-400 font-mono tracking-widest uppercase">
                Gesture Intercepted & Executed
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main HUD Panel */}
      <div className="bg-[#09090b]/90 border border-zinc-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-3 w-full pointer-events-auto flex flex-col gap-2.5 max-h-[78vh] overflow-y-auto custom-scrollbar transition-all">
        {/* HUD Header */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-100 flex items-center gap-1.5">
              SPATIAL INTERRUPT HUD
              <span className="text-[8.5px] font-semibold text-zinc-500 uppercase font-sans">
                ({kineticHandsMode === 'two' ? 'Dual-Hand' : 'Single-Hand'})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Minimal Mode indicator */}
            <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
              activeHandsDetected > 0 
                ? (kineticHandsMode === 'two' && activeHandsDetected === 2 
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 animate-pulse')
                : 'bg-zinc-800/40 border border-zinc-800/30 text-zinc-400'
            }`}>
              {activeHandsDetected > 0 
                ? `${activeHandsDetected} HAND${activeHandsDetected > 1 ? 'S' : ''} ACTIVE` 
                : 'WAITING FOR HANDS...'}
            </span>

            {/* Minimize / Collapse Button */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 rounded transition-colors cursor-pointer"
            >
              {isMinimized ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* HUD Expanded Body */}
        {!isMinimized && (
          <>
            {/* Interaction Mode Toggle Bar */}
            <div className="bg-[#121214] border border-zinc-850 p-0.5 rounded-xl w-full flex items-center justify-between shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setKineticInteractionMode('gesture');
                  showToast('🖐️ Gesture & Action Mode Enabled. Swipes and poses are active.', 'info', 2500);
                }}
                className={`flex-1 py-1.5 px-3 text-[9.5px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  kineticInteractionMode === 'gesture'
                    ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/10'
                }`}
              >
                <Zap size={10} />
                Actions & Macros
              </button>
              <button
                type="button"
                onClick={() => {
                  setKineticInteractionMode('cursor');
                  showToast('🖱️ Virtual Mouse Mode Enabled. Pinch to click, Index+Middle to scroll.', 'info', 2500);
                }}
                className={`flex-1 py-1.5 px-3 text-[9.5px] font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  kineticInteractionMode === 'cursor'
                    ? 'bg-cyan-500 text-black shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/10'
                }`}
              >
                <Hand size={10} />
                Virtual Mouse Mode
              </button>
            </div>

            {/* Clear text dynamic explanation banner */}
            <div className="text-[8.5px] text-zinc-400 font-mono bg-zinc-950/40 border border-zinc-850/60 p-2 rounded-lg leading-relaxed flex items-start gap-2">
              <Info size={11} className={`mt-0.5 shrink-0 ${kineticInteractionMode === 'cursor' ? 'text-cyan-400' : 'text-emerald-400'}`} />
              <div className="space-y-0.5">
                <p>
                  {kineticInteractionMode === 'cursor'
                    ? '🖱️ Virtual Mouse: Move index finger to track cursor. Press/pinch thumb to click page items. Extend index + middle fingers together to scroll up/down.'
                    : '🖐️ Gesture Actions: Perform swipes to navigate/expand panels, or hold 2-4 finger postures to execute combined custom macros.'}
                </p>
                <p className="text-zinc-500 text-[8px]">
                  💡 Quick Toggle: Hold Thumb + Pinky fingers out together (Hang Loose gesture) for 1.2 seconds to switch modes hands-free!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Left Box: Mode Toggle Controls */}
            <div className="flex flex-col justify-between bg-[#121214]/50 border border-zinc-850 rounded-xl p-2.5 relative">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8.5px] font-bold font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Layers size={11} className="text-emerald-400" />
                    Capture Density Profile
                  </span>
                  {/* Interactive Tooltip explanation button */}
                  <button
                    type="button"
                    onClick={() => setShowTooltip(!showTooltip)}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      showTooltip ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                    title="Toggle Hand Mode details"
                  >
                    <HelpCircle size={11.5} />
                  </button>
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal mb-2">
                  Adapt capture neural models to prioritize single ergonomic hand or multi-hand spatial combos.
                </p>

                {/* Optional clear-text helper explanation block */}
                <div className="min-h-[30px] transition-all duration-200">
                  <p className="text-[8.5px] text-zinc-400 leading-relaxed font-mono bg-zinc-950/40 border border-zinc-850/65 rounded-lg p-1.5">
                    {modeDescription}
                  </p>
                </div>
              </div>

              {/* Mode switch pills */}
              <div className="flex bg-[#121214] border border-zinc-800 p-0.5 rounded-lg w-full mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setKineticHandsMode('one');
                    showToast('🖐️ Ergonomic One-Hand tracking profile activated.', 'success', 2500);
                  }}
                  className={`flex-1 py-1 text-[9px] font-mono rounded-md font-bold transition-all cursor-pointer ${
                    kineticHandsMode === 'one'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20'
                  }`}
                >
                  Single Hand
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKineticHandsMode('two');
                    showToast('🙌 Immersive Two-Hand Spatial tracking profile activated.', 'success', 2500);
                  }}
                  className={`flex-1 py-1 text-[9px] font-mono rounded-md font-bold transition-all cursor-pointer ${
                    kineticHandsMode === 'two'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20'
                  }`}
                >
                  Two Hands
                </button>
              </div>

              {/* Pop-up Overlay Tooltip Panel if requested */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute inset-0 bg-[#0c0c0e] border border-zinc-800/90 rounded-xl p-2.5 flex flex-col justify-between z-10"
                  >
                    <div className="space-y-1.5">
                      <h5 className="text-[9px] font-bold text-white uppercase font-mono flex items-center justify-between">
                        <span>💡 Spatial Guide</span>
                        <button 
                          type="button"
                          onClick={() => setShowTooltip(false)}
                          className="text-[8px] text-zinc-500 hover:text-zinc-300 underline font-sans"
                        >
                          Dismiss
                        </button>
                      </h5>
                      <p className="text-[8px] text-zinc-400 leading-normal">
                        <strong>Single Hand Mode:</strong> Best for low processor overhead. Interprets single hand count (1-5 fingers) for easy navigation swipes.
                      </p>
                      <p className="text-[8px] text-zinc-400 leading-normal">
                        <strong>Two Hands Mode:</strong> Allows combined double-hand posture combos (e.g. symmetrical fingers) to lock focus modes, sum notes, or clone tasks.
                      </p>
                    </div>
                    <div className="text-[7.5px] text-emerald-400/80 font-mono">
                      *MediaPipe tracking adapts automatically.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Box: Live Hand Inputs Feedback */}
            <div className="flex flex-col justify-center bg-[#121214]/50 border border-zinc-850 rounded-xl p-2.5 space-y-2.5">
              <span className="text-[8.5px] font-bold font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                <Activity size={11} className="text-emerald-400 animate-pulse" />
                Live Finger Sensor Matrix
              </span>

              {/* Hand 1 Visual Sensors */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[8px] font-mono">
                  <span className="text-zinc-500 uppercase">Primary Hand (H1)</span>
                  <span className={activeHandsDetected > 0 ? 'text-emerald-400 font-bold animate-pulse' : 'text-zinc-650'}>
                    {activeHandsDetected > 0 ? 'CONNECTED' : 'IDLE'}
                  </span>
                </div>
                <div className="flex gap-1 justify-between">
                  {['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].map((finger) => {
                    const isActive = activeHandsDetected > 0 && hand1Fingers.includes(finger);
                    return (
                      <div 
                        key={finger}
                        className={`flex-1 py-1 text-center text-[7.5px] font-mono font-extrabold rounded border transition-all ${
                          isActive 
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.15)]' 
                            : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-650'
                        }`}
                        title={`${finger} Finger Status`}
                      >
                        {finger[0]}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hand 2 Visual Sensors (Only if two hands mode enabled) */}
              {kineticHandsMode === 'two' ? (
                <div className="space-y-1.5 pt-1.5 border-t border-zinc-850/60">
                  <div className="flex items-center justify-between text-[8px] font-mono">
                    <span className="text-zinc-500 uppercase">Secondary Hand (H2)</span>
                    <span className={activeHandsDetected > 1 ? 'text-blue-400 font-bold animate-pulse' : 'text-zinc-650'}>
                      {activeHandsDetected > 1 ? 'CONNECTED' : 'IDLE'}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-between">
                    {['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].map((finger) => {
                      const isActive = activeHandsDetected > 1 && hand2Fingers.includes(finger);
                      return (
                        <div 
                          key={finger}
                          className={`flex-1 py-1 text-center text-[7.5px] font-mono font-extrabold rounded border transition-all ${
                            isActive 
                              ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.15)]' 
                              : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-650'
                          }`}
                          title={`${finger} Finger Status`}
                        >
                          {finger[0]}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-zinc-850/60 text-center">
                  <span className="text-[7.5px] font-mono text-zinc-600 uppercase">
                    Enable Two Hands to open secondary sensor
                  </span>
                </div>
              )}

            </div>

            {/* Voice Control Module */}
            <div className="bg-[#121214]/50 border border-zinc-850 rounded-xl p-2.5 relative flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[8.5px] font-bold font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Mic size={11} className={isVoiceControlActive ? 'text-amber-400 animate-pulse' : 'text-zinc-500'} />
                  Voice Control Assistant
                </span>
                
                {/* Voice Status Badge */}
                <div className="flex items-center gap-1.5">
                  {isVoiceControlActive && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        voiceStatus === 'listening' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        voiceStatus === 'listening' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}></span>
                    </span>
                  )}
                  <span className={`text-[8px] font-mono font-bold uppercase tracking-wider ${
                    !isVoiceControlActive ? 'text-zinc-650' : voiceStatus === 'listening' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {!isVoiceControlActive ? 'OFFLINE' : voiceStatus === 'listening' ? 'LISTENING' : voiceStatus === 'heard' ? 'COMMAND HEARD' : 'READY'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="space-y-1">
                  <p className="text-[9px] text-zinc-500 leading-normal">
                    Hands-free voice switcher. Say commands to swap tracking modes or general speech to talk to Aether.
                  </p>
                  
                  {/* Dynamic transcript or hint */}
                  <div className="min-h-6 flex items-center py-1">
                    {voiceTranscript ? (
                      <p className="text-[8.5px] font-mono text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 italic truncate max-w-full">
                        "{voiceTranscript}"
                      </p>
                    ) : lastVoiceCommand ? (
                      <p className="text-[8.5px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 flex items-center gap-1">
                        <span>✓ Executed:</span>
                        <strong className="font-bold">"{lastVoiceCommand}"</strong>
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[7.5px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          "Enable Mouse Mode"
                        </span>
                        <span className="text-[7.5px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          "Enable Macro Mode"
                        </span>
                        <span className="text-[7.5px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                          "Toggle Mode"
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Switch/Button to toggle voice */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isVoiceControlActive;
                    setIsVoiceControlActive(nextVal);
                    if (nextVal) {
                      showToast('🎙️ Hands-Free Voice Control Activated. Say "Enable Mouse Mode" or "Enable Macro Mode".', 'success', 3500);
                    } else {
                      showToast('🎙️ Voice Control Deactivated.', 'info', 2000);
                      setVoiceTranscript('');
                      setLastVoiceCommand('');
                    }
                  }}
                  className={`w-full px-3 py-1.5 text-[9.5px] font-mono rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isVoiceControlActive
                      ? 'bg-amber-400 border-amber-400 text-black shadow-md shadow-amber-400/5'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  {isVoiceControlActive ? (
                    <>
                      <MicOff size={11} />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic size={11} />
                      Start Listening
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          </>
        )}
      </div>

      {/* Dynamic Glowing Virtual Cursor Overlay */}
      {kineticInteractionMode === 'cursor' && activeHandsDetected > 0 && (
        <div 
          className="fixed pointer-events-none z-50 transition-all duration-75 ease-out"
          style={{ 
            left: virtualCursorPos.x, 
            top: virtualCursorPos.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Inner ring */}
          <div className={`relative w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isPinching 
              ? 'border-amber-400 bg-amber-500/20 scale-90' 
              : 'border-cyan-400 bg-cyan-400/10 scale-100 animate-pulse'
          }`}>
            {/* Center dot */}
            <div className={`w-1.5 h-1.5 rounded-full ${
              isPinching ? 'bg-amber-400' : 'bg-cyan-400'
            }`} />

            {/* Pinch action indicator badge */}
            {isPinching && (
              <span className="absolute -bottom-5 text-[8.5px] bg-amber-500 text-black px-1.5 rounded font-bold font-mono tracking-wide uppercase">
                PINCH
              </span>
            )}
          </div>

          {/* Outer target corners */}
          <div className={`absolute border-t-2 border-l-2 rounded-tl-md w-2 h-2 ${
            isPinching ? 'border-amber-400' : 'border-cyan-400/60'
          }`} style={{ top: -4, left: -4 }} />
          <div className={`absolute border-t-2 border-r-2 rounded-tr-md w-2 h-2 ${
            isPinching ? 'border-amber-400' : 'border-cyan-400/60'
          }`} style={{ top: -4, right: -4 }} />
          <div className={`absolute border-b-2 border-l-2 rounded-bl-md w-2 h-2 ${
            isPinching ? 'border-amber-400' : 'border-cyan-400/60'
          }`} style={{ bottom: -4, left: -4 }} />
          <div className={`absolute border-b-2 border-r-2 rounded-br-md w-2 h-2 ${
            isPinching ? 'border-amber-400' : 'border-cyan-400/60'
          }`} style={{ bottom: -4, right: -4 }} />
        </div>
      )}
    </div>
  );
}
