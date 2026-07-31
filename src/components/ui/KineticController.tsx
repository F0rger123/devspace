import { motion, AnimatePresence } from 'motion/react';
import { Camera, CameraOff, Move, Settings2, Activity, Sparkles, X, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Check, Trash2, RefreshCw, Home, Bot, Notebook, Zap, FileText, Cpu, Play, Pause, HelpCircle, Award, Eye, EyeOff, Minus, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, KineticGesture } from '../../store';
import { useData } from '../../context/DataProvider';

// Extend window interface to support unified kinetic engine communications and MediaPipe integration
declare global {
  interface Window {
    Hands?: any;
    Camera?: any;
    __kineticEngine?: {
      isRecordingCustom: boolean;
      startRecordingCustom: (onComplete: (points: { x: number; y: number }[]) => void) => void;
      stopRecordingCustom: () => void;
      getLiveFeed: () => {
        isTracking: boolean;
        centroid: { x: number; y: number } | null;
        fps: number;
        motionAmount: number;
        trail: { x: number; y: number }[];
        fingers?: { name: string; x: number; y: number; angle: number; dist: number }[];
      };
    };
  }
}

const loadMediaPipe = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.Hands && window.Camera) {
      resolve();
      return;
    }

    const existingHands = document.querySelector('script[src*="hands.js"]');
    if (existingHands) {
      const interval = setInterval(() => {
        if (window.Hands && window.Camera) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
      return;
    }

    // Load camera utils first to avoid dependency race conditions
    const cameraScript = document.createElement('script');
    cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
    cameraScript.crossOrigin = 'anonymous';
    cameraScript.async = true;

    const handsScript = document.createElement('script');
    handsScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
    handsScript.crossOrigin = 'anonymous';
    handsScript.async = true;

    cameraScript.onload = () => {
      document.head.appendChild(handsScript);
    };

    handsScript.onload = () => {
      resolve();
    };

    cameraScript.onerror = (e) => reject(new Error('Failed to load MediaPipe camera_utils: ' + e));
    handsScript.onerror = (e) => reject(new Error('Failed to load MediaPipe hands: ' + e));

    document.head.appendChild(cameraScript);
  });
};

interface GestureSimulatorAnimProps {
  gesture: KineticGesture;
}

function GestureSimulatorAnim({ gesture }: GestureSimulatorAnimProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const isPose = gesture.direction?.startsWith('pose-') || false;
  const isSwipeLeft = gesture.id === 'swipe-left' || gesture.direction === 'left';
  const isSwipeRight = gesture.id === 'swipe-right' || gesture.direction === 'right';
  const isSwipeUp = gesture.id === 'swipe-up' || gesture.direction === 'up';
  const isSwipeDown = gesture.direction === 'down';
  const isWave = gesture.id === 'wave' || gesture.direction === 'wave';
  const isCustomPath = !!gesture.points;

  const wrist = { x: 150, y: 170 };
  const palm = { x: 150, y: 120 };

  let activeFingersCount = 5;
  if (isPose && gesture.direction) {
    activeFingersCount = parseInt(gesture.direction.replace('pose-', '')) || 0;
  }

  let swipeOffset = 0;
  if (isSwipeLeft) {
    swipeOffset = 220 - (tick * 3.5) % 220;
  } else if (isSwipeRight) {
    swipeOffset = (tick * 3.5) % 220;
  } else if (isSwipeUp) {
    swipeOffset = 180 - (tick * 2.8) % 180;
  } else if (isSwipeDown) {
    swipeOffset = (tick * 2.8) % 180;
  } else if (isWave) {
    swipeOffset = Math.sin(tick * 0.25) * 55;
  }

  const fingerAngles = [-60, -30, 0, 30, 60];

  return (
    <div className="relative w-full aspect-[4/3] bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:16px_16px] opacity-15" />
      <div className="absolute left-0 right-0 h-[2px] bg-emerald-500/20 blur-[1px] animate-pulse" style={{ top: `${(tick * 1.2) % 100}%` }} />

      <svg width="100%" height="100%" viewBox="0 0 300 200" className="relative z-10 select-none">
        {isCustomPath && gesture.points && gesture.points.length > 0 && (
          <>
            <path
              d={`M ${gesture.points.map(p => `${p.x * 300},${p.y * 200}`).join(' L ')}`}
              fill="none"
              stroke="#059669"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40"
              strokeDasharray="4 4"
            />
            {(() => {
              const ptIndex = Math.floor((tick / 100) * gesture.points.length) % gesture.points.length;
              const activePt = gesture.points[ptIndex] || gesture.points[0];
              return (
                <g>
                  <circle cx={activePt.x * 300} cy={activePt.y * 200} r="12" fill="#10b981" className="opacity-20 animate-ping" />
                  <circle cx={activePt.x * 300} cy={activePt.y * 200} r="6" fill="#34d399" />
                  <text x={activePt.x * 300 + 10} y={activePt.y * 200 + 4} fill="#34d399" className="text-[9px] font-bold font-mono">Finger Tracing</text>
                </g>
              );
            })()}
          </>
        )}

        {(isSwipeLeft || isSwipeRight || isSwipeUp || isSwipeDown || isWave) && (
          <g>
            {Array.from({ length: 5 }).map((_, idx) => {
              const xPos = isSwipeLeft ? swipeOffset + idx * 12 : isSwipeRight ? swipeOffset - idx * 12 : isWave ? 150 + swipeOffset - idx * (swipeOffset > 0 ? 8 : -8) : 150;
              const yPos = isSwipeUp ? swipeOffset + idx * 12 : isSwipeDown ? swipeOffset - idx * 12 : 100;
              const opacity = (5 - idx) * 0.18;
              return (
                <circle
                  key={idx}
                  cx={xPos}
                  cy={yPos}
                  r={Math.max(2, 12 - idx * 1.5)}
                  fill="#10b981"
                  style={{ opacity }}
                />
              );
            })}
          </g>
        )}

        {!isCustomPath && (
          <g>
            <line x1={wrist.x} y1={wrist.y} x2={palm.x} y2={palm.y} stroke="#1f2937" strokeWidth="4" />
            <circle cx={palm.x} cy={palm.y} r="14" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
            
            {fingerAngles.map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const isExtended = idx < activeFingersCount;
              
              const fingerLength = isExtended ? 45 : 20;
              const tipX = palm.x + Math.sin(rad) * fingerLength + (isSwipeLeft || isSwipeRight || isWave ? swipeOffset - 110 : 0);
              const tipY = palm.y - Math.cos(rad) * fingerLength + (isSwipeUp || isSwipeDown ? swipeOffset - 90 : 0);

              return (
                <g key={idx}>
                  <line
                    x1={palm.x}
                    y1={palm.y}
                    x2={tipX}
                    y2={tipY}
                    stroke={isExtended ? '#10b981' : '#3f3f46'}
                    strokeWidth={isExtended ? '4' : '2'}
                    className="transition-all duration-300"
                  />
                  <circle
                    cx={(palm.x + tipX) / 2}
                    cy={(palm.y + tipY) / 2}
                    r="4"
                    fill={isExtended ? '#059669' : '#27272a'}
                  />
                  <circle
                    cx={tipX}
                    cy={tipY}
                    r={isExtended ? '6' : '3.5'}
                    fill={isExtended ? '#34d399' : '#3f3f46'}
                  />
                  {isExtended && (
                    <circle
                      cx={tipX}
                      cy={tipY}
                      r="12"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1"
                      className="opacity-40 animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-850">
        <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-1.5">
          <Activity size={10} className="text-emerald-500 animate-pulse" />
          {isPose ? 'Static Posture Scanner' : isCustomPath ? 'Point Signature Matcher' : 'Dynamic Sweeper Matcher'}
        </span>
        <span className="text-[8px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/30 px-1 rounded uppercase tracking-wider">
          SIMULATION
        </span>
      </div>
    </div>
  );
}

export function KineticController() {
  const { 
    isKineticEnabled, 
    setKineticEnabled, 
    kineticHandsMode,
    setKineticHandsMode,
    showFloatingCamera, 
    setShowFloatingCamera,
    kineticGestures,
    addKineticLog,
    toggleSidebar,
    setSidebarOpen,
    setRightSidebarOpen,
    setSidebarMinimized,
    toggleRightSidebar,
    toggleSidebarMinimized,
    toggleCommandPalette,
    swipeSensitivity,
    customPathMatchPrecision,
    waveSensitivity,
    fingerPoseStabilityFrames,
    gestureCooldownDuration,
    kineticInteractionMode,
    setKineticInteractionMode,
    isPinchDragging,
    setIsPinchDragging,
    virtualCursorPos,
    setVirtualCursorPos,
    isPinching,
    setIsPinching,
    isCameraOnlyMode,
    setCameraOnlyMode,
    cameraScale,
    setCameraScale
  } = useStore();

  const navigate = useNavigate();
  const { addNote, showToast, triggerFullSync, declineInvitation, invitations, userProfile } = useData();

  // State & Coordinate Calibration Settings
  const [isAxesSwapped, setIsAxesSwapped] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('kineticAxesSwapped') === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('kineticAxesSwapped', String(isAxesSwapped));
  }, [isAxesSwapped]);

  // Motion prediction and extrapolation refs
  const lastKnownResultsRef = useRef<any>(null);
  const consecutiveLostFramesRef = useRef(0);
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Intelligent sub-panel scrolling utility
  const scrollElementAtPoint = (x: number, y: number, deltaX: number, deltaY: number) => {
    let element = document.elementFromPoint(x, y);
    while (element) {
      const style = window.getComputedStyle(element);
      const isScrollableY = (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') && element.scrollHeight > element.clientHeight;
      const isScrollableX = (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') && element.scrollWidth > element.clientWidth;
      
      if (isScrollableY || isScrollableX) {
        element.scrollBy({
          left: deltaX,
          top: deltaY,
          behavior: 'auto'
        });
        return;
      }
      element = element.parentElement;
    }
    window.scrollBy({
      left: deltaX,
      top: deltaY,
      behavior: 'auto'
    });
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null);
  const [gestureCooldown, setGestureCooldown] = useState(false);
  const gestureCooldownRef = useRef(false);
  const lastGlobalTriggerTimeRef = useRef<number>(0);

  const setCooldown = (val: boolean) => {
    gestureCooldownRef.current = val;
    setGestureCooldown(val);
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Haptic vibration feedback not supported or blocked:', e);
      }
    }
  };

  const storeRef = useRef({
    kineticGestures,
    swipeSensitivity,
    waveSensitivity,
    fingerPoseStabilityFrames,
    gestureCooldownDuration,
    customPathMatchPrecision,
    kineticHandsMode,
    kineticInteractionMode
  });

  useEffect(() => {
    storeRef.current = {
      kineticGestures,
      swipeSensitivity,
      waveSensitivity,
      fingerPoseStabilityFrames,
      gestureCooldownDuration,
      customPathMatchPrecision,
      kineticHandsMode,
      kineticInteractionMode
    };
  }, [kineticGestures, swipeSensitivity, waveSensitivity, fingerPoseStabilityFrames, gestureCooldownDuration, customPathMatchPrecision, kineticHandsMode, kineticInteractionMode]);

  // Dynamically adapt MediaPipe tracker's tracking capacity when mode switches
  useEffect(() => {
    if (handsRef.current) {
      handsRef.current.setOptions({
        maxNumHands: kineticHandsMode === 'two' ? 2 : 1
      });
    }
  }, [kineticHandsMode]);

  const [pendingConfirm, setPendingConfirm] = useState<{
    name: string;
    action: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  const [fps, setFps] = useState(60);
  const [motionAmount, setMotionAmount] = useState(0);
  const [isMediaPipeLoading, setIsMediaPipeLoading] = useState(false);
  const [mediaPipeError, setMediaPipeError] = useState<string | null>(null);

  // First time popup and Simulation preview states
  const [learningGesture, setLearningGesture] = useState<KineticGesture | null>(null);
  const [learningCountdown, setLearningCountdown] = useState(5);
  const [isInteractivePractice, setIsInteractivePractice] = useState(false);
  const [isFirstTimeDiscovery, setIsFirstTimeDiscovery] = useState(false);

  // Persisted triggered gestures storage
  const getTriggeredGestures = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const val = localStorage.getItem('triggeredGestures');
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  };

  const saveTriggeredGesture = (gestureId: string) => {
    if (typeof window === 'undefined') return;
    try {
      const list = getTriggeredGestures();
      if (!list.includes(gestureId)) {
        list.push(gestureId);
        localStorage.setItem('triggeredGestures', JSON.stringify(list));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTriggerDetails = (g: any) => {
    if (g.id === 'swipe-left') {
      return {
        type: 'swipe-left' as const,
        detail: 'Swift horizontal swipe gesture to the left across the camera sensor.'
      };
    }
    if (g.id === 'swipe-right') {
      return {
        type: 'swipe-right' as const,
        detail: 'Swift horizontal swipe gesture to the right across the camera sensor.'
      };
    }
    if (g.id === 'swipe-up') {
      return {
        type: 'swipe-up' as const,
        detail: 'Swift upward vertical swipe gesture across the camera sensor.'
      };
    }
    if (g.id === 'wave') {
      return {
        type: 'wave' as const,
        detail: 'Rapid back-and-forth waving movement across the camera frame.'
      };
    }
    if (g.direction?.startsWith('pose-')) {
      const fingers = g.direction.replace('pose-', '');
      return {
        type: 'pose' as const,
        detail: `Stable finger pose posture showing exactly ${fingers} extended finger(s) on screen.`
      };
    }
    return {
      type: 'path' as const,
      detail: 'Spatial stroke trail matching a recorded path template with high cosine shape-signature similarity.'
    };
  };

  // Listen for simulation triggers from Settings
  useEffect(() => {
    const handleSimulate = (e: Event) => {
      const gesture = (e as CustomEvent).detail;
      if (gesture) {
        setLearningGesture(gesture);
        setIsFirstTimeDiscovery(false);
        setIsInteractivePractice(false);
        setCooldown(true); // prevent other gestures while previewing
        // Cascade physical pulse pattern indicating simulation HUD activated
        triggerHaptic([50, 30, 50, 30, 80]);
      }
    };
    window.addEventListener('kinetic-simulate-gesture', handleSimulate);
    return () => window.removeEventListener('kinetic-simulate-gesture', handleSimulate);
  }, []);

  // Set up event listener for remote camera resizing and clean mode toggling
  useEffect(() => {
    const handleCameraControl = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      if (detail.action === 'resize-percent') {
        const currentScale = useStore.getState().cameraScale;
        const change = detail.percent / 100;
        const newScale = detail.type === 'increase' ? currentScale + change : currentScale - change;
        setCameraScale(newScale);
        showToast(`📐 Resized Camera Preview: ${Math.round(newScale * 100)}%`, 'success', 2500);
      } else if (detail.action === 'resize-scale') {
        setCameraScale(detail.scale);
        showToast(`📐 Camera Preview set to ${Math.round(detail.scale * 100)}%`, 'success', 2500);
      } else if (detail.action === 'resize-reset') {
        setCameraScale(1.0);
        showToast('📐 Camera Preview size reset to default', 'info', 2500);
      } else if (detail.action === 'toggle-camera-only') {
        const currentMode = useStore.getState().isCameraOnlyMode;
        setCameraOnlyMode(!currentMode);
        showToast(!currentMode ? '👁️ Camera Only mode enabled (HUD Hidden)' : '🖥️ Kinetic Full HUD restored', 'info', 3000);
      } else if (detail.action === 'set-camera-only') {
        setCameraOnlyMode(detail.value);
        showToast(detail.value ? '👁️ Camera Only mode enabled (HUD Hidden)' : '🖥️ Kinetic Full HUD restored', 'info', 3000);
      }
    };

    window.addEventListener('kinetic-camera-control', handleCameraControl);
    return () => window.removeEventListener('kinetic-camera-control', handleCameraControl);
  }, [setCameraScale, setCameraOnlyMode, showToast]);

  // First-time trigger countdown
  useEffect(() => {
    if (!learningGesture || !isFirstTimeDiscovery) return;
    setLearningCountdown(6);
    const interval = setInterval(() => {
      setLearningCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLearningGesture(null);
          setIsFirstTimeDiscovery(false);
          setCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [learningGesture, isFirstTimeDiscovery]);

  // Synchronize practice mode cooldown state
  useEffect(() => {
    if (learningGesture) {
      if (isFirstTimeDiscovery) {
        setCooldown(true);
      } else {
        setCooldown(!isInteractivePractice);
      }
    }
  }, [learningGesture, isInteractivePractice, isFirstTimeDiscovery]);

  // Position for dragging the floating window
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Element Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // CV Tracking variables
  const prevFrameRef = useRef<ImageData | null>(null);
  const handColorRef = useRef<{ r: number; g: number; b: number } | null>(null);
  const centroidRef = useRef<{ x: number; y: number } | null>(null);
  const trailRef = useRef<{ x: number; y: number; time: number }[]>([]);
  const isTrackingRef = useRef(false);
  const isProcessingFrameRef = useRef(false);
  const lastActiveRef = useRef<number>(0);
  const handsRef = useRef<any>(null);

  // Finger Tracking Refs
  const fingersRef = useRef<{ name: string; x: number; y: number; angle: number; dist: number }[]>([]);
  const fingerCountHistoryRef = useRef<number[]>([]);
  const fingers2Ref = useRef<{ name: string; x: number; y: number; angle: number; dist: number }[]>([]);
  const fingerCountHistory2Ref = useRef<number[]>([]);
  const centroid2Ref = useRef<{ x: number; y: number } | null>(null);
  const trail2Ref = useRef<{ x: number; y: number; time: number }[]>([]);
  const lastPoseTriggeredRef = useRef<{ [key: string]: number }>({});

  // Custom Training state
  const isRecordingCustomRef = useRef(false);
  const customRecordingPointsRef = useRef<{ x: number; y: number }[]>([]);
  const customRecordingTimerRef = useRef<number | null>(null);
  const onCustomCompleteRef = useRef<((points: { x: number; y: number }[]) => void) | null>(null);

  // Hand-dragging camera, virtual cursor, scroll & mode-switching Refs
  const isHandDraggingCameraRef = useRef(false);
  const wasDraggingCameraThisSessionRef = useRef(false);
  const lastActiveCursorOrDragTimeRef = useRef<number>(0);
  const handLastDetectedTimeRef = useRef<number>(0);
  const handRediscoveredTimeRef = useRef<number>(0);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastIsPinchingRef = useRef(false);
  const lastScrollYRef = useRef<number | null>(null);
  const shakaStartRef = useRef<number | null>(null);

  const pinchStartXRef = useRef(0);
  const pinchStartYRef = useRef(0);
  const pinchStartTimeRef = useRef(0);
  const hasDraggedScrollRef = useRef(false);
  const lastScrollHandXRef = useRef(0);
  const lastScrollHandYRef = useRef(0);
  const lastHandXRef = useRef<number | null>(null);
  const lastHandYRef = useRef<number | null>(null);

  // Reset collapsed/hidden states and position to defaults on page load/mount
  useEffect(() => {
    setIsMinimized(false);
    useStore.getState().setShowFloatingCamera(true);
    setPosition({ x: 20, y: 100 });
  }, []);

  // Load and unload video stream
  useEffect(() => {
    if (isKineticEnabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isKineticEnabled]);

  // Hook up window interface so settings page can coordinate
  useEffect(() => {
    window.__kineticEngine = {
      isRecordingCustom: isRecordingCustomRef.current,
      startRecordingCustom: (onComplete) => {
        isRecordingCustomRef.current = true;
        customRecordingPointsRef.current = [];
        onCustomCompleteRef.current = onComplete;
        
        // Auto-stop recording after 2.5 seconds
        if (customRecordingTimerRef.current) {
          window.clearTimeout(customRecordingTimerRef.current);
        }
        customRecordingTimerRef.current = window.setTimeout(() => {
          window.__kineticEngine?.stopRecordingCustom();
        }, 2500);
      },
      stopRecordingCustom: () => {
        isRecordingCustomRef.current = false;
        if (customRecordingTimerRef.current) {
          window.clearTimeout(customRecordingTimerRef.current);
          customRecordingTimerRef.current = null;
        }
        if (onCustomCompleteRef.current && customRecordingPointsRef.current.length > 0) {
          onCustomCompleteRef.current(customRecordingPointsRef.current);
        }
        onCustomCompleteRef.current = null;
      },
      getLiveFeed: () => ({
        isTracking: isTrackingRef.current,
        centroid: centroidRef.current,
        centroid2: centroid2Ref.current,
        fps,
        motionAmount,
        trail: trailRef.current.map(p => ({ x: p.x, y: p.y })),
        trail2: (trail2Ref.current || []).map(p => ({ x: p.x, y: p.y })),
        fingers: fingersRef.current,
        fingers2: fingers2Ref.current || []
      })
    };

    return () => {
      delete window.__kineticEngine;
    };
  }, [fps, motionAmount]);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        stopCamera();
      }

      setIsMediaPipeLoading(true);
      setMediaPipeError(null);

      // Load MediaPipe dynamically via CDN to bypass Vite bundler CJS dependency bugs
      await loadMediaPipe();

      if (!handsRef.current) {
        // @ts-ignore
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: storeRef.current.kineticHandsMode === 'two' ? 2 : 1,
          modelComplexity: 1, // Upgrade to Full model for precise landmark detection
          minDetectionConfidence: 0.60,
          minTrackingConfidence: 0.60
        });

        handsRef.current = hands;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user"
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
            setHasPermission(true);
            setIsMediaPipeLoading(false);
            startTrackingLoop();
          });
        };
      }
    } catch (err: any) {
      const isPermissionErr = err?.name === "NotAllowedError" || 
                             err?.message?.toLowerCase().includes("permission") || 
                             err?.message?.toLowerCase().includes("notallowed");
      if (isPermissionErr) {
        console.warn("Kinetic tracker camera access denied or unavailable:", err);
      } else {
        console.error("Kinetic tracker initialization failed:", err);
      }
      setMediaPipeError(err?.message || "Check network connection");
      setIsMediaPipeLoading(false);
      setHasPermission(false);
      setKineticEnabled(false);
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    isTrackingRef.current = false;
    isProcessingFrameRef.current = false;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    prevFrameRef.current = null;
    centroidRef.current = null;
    trailRef.current = [];
    fingersRef.current = [];
  };

  // Perform hand kinetic calculations
  const startTrackingLoop = () => {
    let lastTime = performance.now();
    let frameCount = 0;
    isTrackingRef.current = true;

    // MediaPipe Results Handler
    const onMediaPipeResults = (results: any) => {
      if (!isTrackingRef.current) return;

      // Robust finger extension helper utilizing 3D/2D distance scaling (highly robust to palm rotation and speed)
      const checkFingerExtended = (landmarks: any, tipIdx: number, pipIdx: number, mcpIdx: number) => {
        const wrist = landmarks[0];
        const tip = landmarks[tipIdx];
        const pip = landmarks[pipIdx];
        const mcp = landmarks[mcpIdx];
        if (!wrist || !tip || !pip || !mcp) return false;
        
        // 3D Distance from wrist to tip
        const distWristTip = Math.sqrt(
          Math.pow(tip.x - wrist.x, 2) +
          Math.pow(tip.y - wrist.y, 2) +
          Math.pow(tip.z - wrist.z, 2)
        );
        // 3D Distance from wrist to PIP
        const distWristPip = Math.sqrt(
          Math.pow(pip.x - wrist.x, 2) +
          Math.pow(pip.y - wrist.y, 2) +
          Math.pow(pip.z - wrist.z, 2)
        );
        
        // 3D Distance from MCP (knuckle) to tip
        const distMcpTip = Math.sqrt(
          Math.pow(tip.x - mcp.x, 2) +
          Math.pow(tip.y - mcp.y, 2) +
          Math.pow(tip.z - mcp.z, 2)
        );
        // 3D Distance from MCP (knuckle) to PIP
        const distMcpPip = Math.sqrt(
          Math.pow(pip.x - mcp.x, 2) +
          Math.pow(pip.y - mcp.y, 2) +
          Math.pow(pip.z - mcp.z, 2)
        );

        const verticalExtended = tip.y < pip.y;
        
        // Extended if distance from wrist or MCP to tip is significantly greater than to PIP
        // or standard vertical comparison
        return distWristTip > distWristPip * 1.05 || distMcpTip > distMcpPip * 1.05 || verticalExtended;
      };

      const checkThumbExtended = (landmarks: any) => {
        const tip = landmarks[4];
        const ip = landmarks[3];
        const mcp = landmarks[2];
        const indexMcp = landmarks[5];
        if (!tip || !ip || !mcp || !indexMcp) return false;
        
        const distMcpTip = Math.sqrt(
          Math.pow(tip.x - mcp.x, 2) +
          Math.pow(tip.y - mcp.y, 2) +
          Math.pow(tip.z - mcp.z, 2)
        );
        const distMcpIp = Math.sqrt(
          Math.pow(ip.x - mcp.x, 2) +
          Math.pow(ip.y - mcp.y, 2) +
          Math.pow(ip.z - mcp.z, 2)
        );
        
        const distIndexMcpTip = Math.sqrt(
          Math.pow(tip.x - indexMcp.x, 2) +
          Math.pow(tip.y - indexMcp.y, 2) +
          Math.pow(tip.z - indexMcp.z, 2)
        );

        const horizontalDist = Math.abs(tip.x - indexMcp.x);
        
        return distMcpTip > distMcpIp * 1.05 || horizontalDist > 0.11 || tip.y < ip.y || distIndexMcpTip > 0.12;
      };

      const isNewSignup = typeof window !== 'undefined' && window.sessionStorage.getItem('is_new_signup') === 'true';
      const isWizardActive = !userProfile?.setupCompleted && isNewSignup;
      if (isWizardActive) {
        return;
      }

      // Calculate FPS
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      // --- MOTION-PREDICTION BUFFER OPTIMIZATION LAYER ---
      let processedResults = { ...results };
      const hasDetectedHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;

      if (hasDetectedHand) {
        consecutiveLostFramesRef.current = 0;
        if (lastKnownResultsRef.current && lastKnownResultsRef.current.multiHandLandmarks?.length > 0) {
          const prevLandmarks = lastKnownResultsRef.current.multiHandLandmarks[0];
          const curLandmarks = results.multiHandLandmarks[0];
          if (prevLandmarks[0] && curLandmarks[0]) {
            const dx = curLandmarks[0].x - prevLandmarks[0].x;
            const dy = curLandmarks[0].y - prevLandmarks[0].y;
            velocityRef.current = {
              x: velocityRef.current.x * 0.5 + dx * 0.5,
              y: velocityRef.current.y * 0.5 + dy * 0.5
            };
          }
        }
        lastKnownResultsRef.current = JSON.parse(JSON.stringify(results));
      } else {
        if (
          lastKnownResultsRef.current && 
          lastKnownResultsRef.current.multiHandLandmarks && 
          lastKnownResultsRef.current.multiHandLandmarks.length > 0 && 
          consecutiveLostFramesRef.current < 15
        ) {
          consecutiveLostFramesRef.current++;
          velocityRef.current.x *= 0.90;
          velocityRef.current.y *= 0.90;
          
          const predictedLandmarks = lastKnownResultsRef.current.multiHandLandmarks[0].map((lm: any) => ({
            x: lm.x + velocityRef.current.x,
            y: lm.y + velocityRef.current.y,
            z: lm.z
          }));
          
          processedResults = {
            ...processedResults,
            multiHandLandmarks: [predictedLandmarks],
            multiHandedness: lastKnownResultsRef.current.multiHandedness
          };
          lastKnownResultsRef.current.multiHandLandmarks[0] = predictedLandmarks;
        } else {
          consecutiveLostFramesRef.current = 15;
          velocityRef.current = { x: 0, y: 0 };
        }
      }

      results = processedResults;

      const handsMode = storeRef.current.kineticHandsMode || 'one';

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const nowMs = Date.now();
        const wasHandMissing = (nowMs - handLastDetectedTimeRef.current) > 1500;
        handLastDetectedTimeRef.current = nowMs;
        if (wasHandMissing) {
          handRediscoveredTimeRef.current = nowMs;
        }

        // Hand 1 (Always the first detected hand)
        const landmarks1 = results.multiHandLandmarks[0];

        // Robust hand centroid calculation: average wrist (0) and knuckle joints (5, 9, 13, 17)
        const stableCentroidX1 = (landmarks1[0].x + landmarks1[5].x + landmarks1[9].x + landmarks1[13].x + landmarks1[17].x) / 5;
        const stableCentroidY1 = (landmarks1[0].y + landmarks1[5].y + landmarks1[9].y + landmarks1[13].y + landmarks1[17].y) / 5;

        // Mirror X coordinate so the on-screen glowing joints match natural user mirror feedback perfectly!
        const rawCentroidX1 = (1 - stableCentroidX1) * 120;
        const rawCentroidY1 = stableCentroidY1 * 90;

        // Low-pass Exponential Moving Average (EMA) filter to eliminate hand jitter
        if (!centroidRef.current) {
          centroidRef.current = { x: rawCentroidX1, y: rawCentroidY1 };
        } else {
          const dx1 = rawCentroidX1 - centroidRef.current.x;
          const dy1 = rawCentroidY1 - centroidRef.current.y;
          const movementDist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
          
          // Adaptive Alpha: smaller for stillness to remove jitter, larger for speed to reduce lag
          const minAlpha = 0.16;
          const maxAlpha = 0.95; // Increased from 0.60 to 0.95 for higher maximum speeds
          const alpha1 = Math.min(maxAlpha, minAlpha + (movementDist1 / 8) * (maxAlpha - minAlpha)); // Snappier speed scaling (divided by 8 instead of 12)

          centroidRef.current = {
            x: centroidRef.current.x * (1 - alpha1) + rawCentroidX1 * alpha1,
            y: centroidRef.current.y * (1 - alpha1) + rawCentroidY1 * alpha1
          };
        }

        lastActiveRef.current = Date.now();

        // Detect extended fingers based on 3D/2D distance and vertical offsets
        const isIndexExtended1 = checkFingerExtended(landmarks1, 8, 6, 5);
        const isMiddleExtended1 = checkFingerExtended(landmarks1, 12, 10, 9);
        const isRingExtended1 = checkFingerExtended(landmarks1, 16, 14, 13);
        const isPinkyExtended1 = checkFingerExtended(landmarks1, 20, 18, 17);
        const isThumbExtended1 = checkThumbExtended(landmarks1);

        const fingersList1: any[] = [];
        const addFinger1 = (name: string, tipIdx: number) => {
          const tip = landmarks1[tipIdx];
          const fx = (1 - tip.x) * 120;
          const fy = tip.y * 90;
          
          const dx = fx - centroidRef.current!.x;
          const dy = fy - centroidRef.current!.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          fingersList1.push({ name, x: fx, y: fy, angle, dist });
        };

        if (isThumbExtended1) addFinger1("Thumb Finger", 4);
        if (isIndexExtended1) addFinger1("Index Finger", 8);
        if (isMiddleExtended1) addFinger1("Middle Finger", 12);
        if (isRingExtended1) addFinger1("Ring Finger", 16);
        if (isPinkyExtended1) addFinger1("Pinky Finger", 20);

        fingersRef.current = fingersList1;

        // Process Hand 2 if active and mode is two-hands
        let processedHand2 = false;
        if (handsMode === 'two' && results.multiHandLandmarks.length > 1) {
          const landmarks2 = results.multiHandLandmarks[1];
          const stableCentroidX2 = (landmarks2[0].x + landmarks2[5].x + landmarks2[9].x + landmarks2[13].x + landmarks2[17].x) / 5;
          const stableCentroidY2 = (landmarks2[0].y + landmarks2[5].y + landmarks2[9].y + landmarks2[13].y + landmarks2[17].y) / 5;

          const rawCentroidX2 = (1 - stableCentroidX2) * 120;
          const rawCentroidY2 = stableCentroidY2 * 90;

          if (!centroid2Ref.current) {
            centroid2Ref.current = { x: rawCentroidX2, y: rawCentroidY2 };
          } else {
            const dx2 = rawCentroidX2 - centroid2Ref.current.x;
            const dy2 = rawCentroidY2 - centroid2Ref.current.y;
            const movementDist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            
            const minAlpha = 0.16;
            const maxAlpha = 0.95; // Increased from 0.60 to 0.95 for higher maximum speeds
            const alpha2 = Math.min(maxAlpha, minAlpha + (movementDist2 / 8) * (maxAlpha - minAlpha)); // Snappier speed scaling (divided by 8 instead of 12)

            centroid2Ref.current = {
              x: centroid2Ref.current.x * (1 - alpha2) + rawCentroidX2 * alpha2,
              y: centroid2Ref.current.y * (1 - alpha2) + rawCentroidY2 * alpha2
            };
          }

          // Fingers 2
          const isIndexExtended2 = checkFingerExtended(landmarks2, 8, 6, 5);
          const isMiddleExtended2 = checkFingerExtended(landmarks2, 12, 10, 9);
          const isRingExtended2 = checkFingerExtended(landmarks2, 16, 14, 13);
          const isPinkyExtended2 = checkFingerExtended(landmarks2, 20, 18, 17);
          const isThumbExtended2 = checkThumbExtended(landmarks2);

          const fingersList2: any[] = [];
          const addFinger2 = (name: string, tipIdx: number) => {
            const tip = landmarks2[tipIdx];
            const fx = (1 - tip.x) * 120;
            const fy = tip.y * 90;
            const dx = fx - centroid2Ref.current!.x;
            const dy = fy - centroid2Ref.current!.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            fingersList2.push({ name, x: fx, y: fy, angle, dist });
          };

          if (isThumbExtended2) addFinger2("Thumb Finger", 4);
          if (isIndexExtended2) addFinger2("Index Finger", 8);
          if (isMiddleExtended2) addFinger2("Middle Finger", 12);
          if (isRingExtended2) addFinger2("Ring Finger", 16);
          if (isPinkyExtended2) addFinger2("Pinky Finger", 20);

          fingers2Ref.current = fingersList2;
          processedHand2 = true;
        } else {
          centroid2Ref.current = null;
          fingers2Ref.current = [];
        }

        // Static Posture stable evaluation
        const currentCount = fingersList1.length;
        const currentCount2 = fingers2Ref.current.length;

        fingerCountHistoryRef.current.push(currentCount);
        fingerCountHistory2Ref.current.push(currentCount2);

        const maxWindowSize = storeRef.current.fingerPoseStabilityFrames + 5;
        if (fingerCountHistoryRef.current.length > maxWindowSize) {
          fingerCountHistoryRef.current.shift();
        }
        if (fingerCountHistory2Ref.current.length > maxWindowSize) {
          fingerCountHistory2Ref.current.shift();
        }

        if (fingerCountHistoryRef.current.length >= storeRef.current.fingerPoseStabilityFrames) {
          const counts = fingerCountHistoryRef.current.slice(-storeRef.current.fingerPoseStabilityFrames);
          const isStable = counts.every(c => c === currentCount);
          
          if (processedHand2) {
            const counts2 = fingerCountHistory2Ref.current.slice(-storeRef.current.fingerPoseStabilityFrames);
            const isStable2 = counts2.every(c => c === currentCount2);

            if (isStable && isStable2 && (currentCount > 0 || currentCount2 > 0)) {
              // Both stable -> trigger combined spatial command!
              const minCount = Math.min(currentCount, currentCount2);
              const maxCount = Math.max(currentCount, currentCount2);
              const doublePoseKey = `double-pose-${minCount}-${maxCount}`;
              const lastTrigger = lastPoseTriggeredRef.current[doublePoseKey] || 0;

              if (Date.now() - lastTrigger > 3500) {
                const matchedGesture = storeRef.current.kineticGestures.find(g => g.direction === doublePoseKey && !g.disabled);
                if (matchedGesture) {
                  const isAllowedInCursorMode = storeRef.current.kineticInteractionMode === 'cursor'
                    ? (!useStore.getState().isPinching && (Date.now() - lastActiveCursorOrDragTimeRef.current > 1500))
                    : true;

                  if (isAllowedInCursorMode && 
                      Date.now() - lastActiveCursorOrDragTimeRef.current > 1200 && 
                      Date.now() - handRediscoveredTimeRef.current > 1000) {
                    triggerGesture(matchedGesture.name, matchedGesture.id);
                    lastPoseTriggeredRef.current[doublePoseKey] = Date.now();
                  }
                }
              }
            }
          } else {
            // Single hand stable trigger
            if (isStable && currentCount > 0) {
              const poseKey = `pose-${currentCount}`;
              const lastTrigger = lastPoseTriggeredRef.current[poseKey] || 0;
              
              if (Date.now() - lastTrigger > 2500) {
                const matchedPoseGesture = storeRef.current.kineticGestures.find(g => g.direction === poseKey && !g.disabled);
                if (matchedPoseGesture) {
                  const isAllowedInCursorMode = storeRef.current.kineticInteractionMode === 'cursor'
                    ? (!useStore.getState().isPinching && (Date.now() - lastActiveCursorOrDragTimeRef.current > 1500))
                    : true;

                  if (isAllowedInCursorMode && 
                      Date.now() - lastActiveCursorOrDragTimeRef.current > 1200 && 
                      Date.now() - handRediscoveredTimeRef.current > 1000) {
                    triggerGesture(matchedPoseGesture.name, matchedPoseGesture.id);
                    lastPoseTriggeredRef.current[poseKey] = Date.now();
                  }
                }
              }
            }
          }
        }

        // Add to path trail queue
        trailRef.current.push({
          x: centroidRef.current.x,
          y: centroidRef.current.y,
          time: Date.now()
        });

        if (processedHand2 && centroid2Ref.current) {
          trail2Ref.current.push({
            x: centroid2Ref.current.x,
            y: centroid2Ref.current.y,
            time: Date.now()
          });
        }

        // Record custom path training gesture
        if (isRecordingCustomRef.current) {
          customRecordingPointsRef.current.push({
            x: centroidRef.current.x / 120,
            y: centroidRef.current.y / 90
          });
        }

        // Velocity tracking for motion stats
        if (trailRef.current.length > 1) {
          const lastPt = trailRef.current[trailRef.current.length - 1];
          const prevPt = trailRef.current[trailRef.current.length - 2];
          const dx = lastPt.x - prevPt.x;
          const dy = lastPt.y - prevPt.y;
          const speed = Math.sqrt(dx * dx + dy * dy);
          setMotionAmount(Math.min(1.0, speed / 15));
        }
      } else {
        setMotionAmount(0);
        fingersRef.current = [];
        fingers2Ref.current = [];
        if (centroidRef.current && Date.now() - lastActiveRef.current > 300) {
          centroidRef.current = null;
        }
        centroid2Ref.current = null;
      }

      // Trim old trail elements (increased window to 1600ms to capture full custom gestures without truncation)
      trailRef.current = trailRef.current.filter(t => Date.now() - t.time < 1600);
      trail2Ref.current = trail2Ref.current.filter(t => Date.now() - t.time < 1600);

      // Sync real-time tracking metrics to Zustand store for on-screen HUD overlay
      try {
        const store = useStore.getState();
        const detectedCount = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
        const activeCount = handsMode === 'two' ? Math.min(2, detectedCount) : Math.min(1, detectedCount);
        
        if (store.activeHandsDetected !== activeCount) {
          store.setActiveHandsDetected(activeCount);
        }

        const h1Fingers = fingersRef.current.map(f => f.name.replace(' Finger', ''));
        const h2Fingers = (handsMode === 'two' && fingers2Ref.current) ? fingers2Ref.current.map(f => f.name.replace(' Finger', '')) : [];

        const prevH1 = store.hand1Fingers;
        const prevH2 = store.hand2Fingers;
        const h1Changed = prevH1.length !== h1Fingers.length || h1Fingers.some((f, idx) => prevH1[idx] !== f);
        const h2Changed = prevH2.length !== h2Fingers.length || h2Fingers.some((f, idx) => prevH2[idx] !== f);

        if (h1Changed || h2Changed) {
          store.setHandFingers(h1Fingers, h2Fingers);
        }
      } catch (err) {
        console.error('Error syncing real-time kinetic states:', err);
      }

      // --- EXTRA MULTI-MODE & GESTURE HUD EXTRACTIONS ---
      try {
        const store = useStore.getState();
        const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
        
        if (hasHand) {
          const landmarks1 = results.multiHandLandmarks[0];
          const thumbTip = landmarks1[4];
          const indexTip = landmarks1[8];
          
          // Calculate dynamic, adaptive hand scale based on distance between wrist (0) and index knuckle (5)
          const wrist = landmarks1[0];
          const knuckle = landmarks1[5];
          const handScaleDx = wrist.x - knuckle.x;
          const handScaleDy = wrist.y - knuckle.y;
          const handScaleDz = wrist.z - knuckle.z;
          const handScale = Math.sqrt(handScaleDx * handScaleDx + handScaleDy * handScaleDy + handScaleDz * handScaleDz);

          // Calculate pinch / grab (minimum 2D/3D distance between thumb tip and either index tip OR middle tip)
          const middleTip = landmarks1[12];
          const distThumbIndex = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + 
            Math.pow(thumbTip.y - indexTip.y, 2) + 
            Math.pow(thumbTip.z - indexTip.z, 2)
          );
          const distThumbMiddle = Math.sqrt(
            Math.pow(thumbTip.x - middleTip.x, 2) + 
            Math.pow(thumbTip.y - middleTip.y, 2) + 
            Math.pow(thumbTip.z - middleTip.z, 2)
          );
          const minPinchDist = Math.min(distThumbIndex, distThumbMiddle);
          
          // Highly robust scale-invariant pinch metric with hysteresis thresholding
          const ratio = minPinchDist / handScale;
          const wasPinching = store.isPinching;
          // Hysteresis: enter pinch at <0.44, exit pinch at >0.54 to eliminate drag disconnect flicker
          const pinchThreshold = wasPinching ? 0.54 : 0.44;
          const isPinchingNow = ratio < pinchThreshold;
          
          if (store.isPinching !== isPinchingNow) {
            store.setIsPinching(isPinchingNow);
          }

          // Smart Screen Coordinates mapping using a widened central bounding box.
          // Combine index tip with index MCP joint to stabilize cursor during pinch and gestures
          const indexMcp = landmarks1[5];
          const trackX = indexTip.x * 0.70 + indexMcp.x * 0.30;
          const trackY = indexTip.y * 0.70 + indexMcp.y * 0.30;

          const minX = 0.20;
          const maxX = 0.80;
          const minY = 0.24;
          const maxY = 0.76;

          const rawNormX = (trackX - minX) / (maxX - minX);
          const rawNormY = (trackY - minY) / (maxY - minY);

          let handX = (1 - rawNormX) * window.innerWidth;
          let handY = rawNormY * window.innerHeight;

          // Apply sensitivity adjustment
          const cursorSensitivity = store.cursorSensitivity !== undefined ? store.cursorSensitivity : 2.5;
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          
          handX = centerX + (handX - centerX) * cursorSensitivity;
          handY = centerY + (handY - centerY) * cursorSensitivity;

          // Extra scaling factor if mobile
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          if (isMobile) {
            handX = centerX + (handX - centerX) * 1.5;
            handY = centerY + (handY - centerY) * 1.5;
          }

          // SWAP AXES IF CONFIGURED (corrects 90-degree camera rotations / landscape-portrait swaps)
          if (isAxesSwapped) {
            const rx = handX - centerX;
            const ry = handY - centerY;
            handX = centerX + ry;
            handY = centerY + rx;
          }

          // Smooth the coordinates with an exponential low-pass filter (LERP) to reduce jitter
          if (lastHandXRef.current === null) lastHandXRef.current = handX;
          if (lastHandYRef.current === null) lastHandYRef.current = handY;

          // Adaptive cursor smoothing: if cursor distance is large (fast hand movement), use a higher smoothing factor so it catches up faster
          const cursorDist = Math.sqrt(Math.pow(handX - lastHandXRef.current, 2) + Math.pow(handY - lastHandYRef.current, 2));
          const minSmoothing = 0.35;
          const maxSmoothing = 0.95;
          const smoothing = Math.min(maxSmoothing, minSmoothing + (cursorDist / 120) * (maxSmoothing - minSmoothing));

          handX = lastHandXRef.current + (handX - lastHandXRef.current) * smoothing;
          handY = lastHandYRef.current + (handY - lastHandYRef.current) * smoothing;

          lastHandXRef.current = handX;
          lastHandYRef.current = handY;

          // Clamp coordinates to screen boundaries at the very end to allow 100% full viewport coverage!
          handX = Math.max(12, Math.min(window.innerWidth - 12, handX));
          handY = Math.max(12, Math.min(window.innerHeight - 12, handY));

          const handRightDist = window.innerWidth - handX;
          const handBottomDist = window.innerHeight - handY;

          // Sync Virtual Cursor coordinate to store
          store.setVirtualCursorPos({ x: handX, y: handY });

          if (isPinchingNow || isHandDraggingCameraRef.current || wasDraggingCameraThisSessionRef.current) {
            lastActiveCursorOrDragTimeRef.current = Date.now();
          }

          // 1. PINCH/GRAB DRAGGING CAMERA ONLY BY PINCHING THE HEADER BAR (Z-index/pointer protection)
          const camWidth = isMinimized ? 160 : 192;
          const camHeight = isMinimized ? 44 : 240;
          
          const isOverCameraHeader = 
            handRightDist >= position.x && 
            handRightDist <= position.x + camWidth && 
            handBottomDist >= position.y + camHeight - 44 && 
            handBottomDist <= position.y + camHeight;

          if (isPinchingNow) {
            if (isOverCameraHeader && !isHandDraggingCameraRef.current) {
              isHandDraggingCameraRef.current = true;
              wasDraggingCameraThisSessionRef.current = true;
              store.setIsPinchDragging(true);
              dragOffsetRef.current = {
                x: handRightDist - position.x,
                y: handBottomDist - position.y
              };
            }
          } else {
            if (isHandDraggingCameraRef.current) {
              isHandDraggingCameraRef.current = false;
              store.setIsPinchDragging(false);
            }
          }

          if (isHandDraggingCameraRef.current && isPinchingNow) {
            const targetRight = handRightDist - dragOffsetRef.current.x;
            const targetBottom = handBottomDist - dragOffsetRef.current.y;
            // Clamped within screen borders
            const clampedX = Math.max(10, Math.min(window.innerWidth - camWidth - 10, targetRight));
            const clampedY = Math.max(10, Math.min(window.innerHeight - camHeight - 10, targetBottom));
            setPosition({ x: clampedX, y: clampedY });
          }

          // 2. VIRTUAL MOUSE / CLICK / SCROLL LOGIC (Only active when in 'cursor' mode and NOT dragging camera)
          if (store.kineticInteractionMode === 'cursor' && !wasDraggingCameraThisSessionRef.current) {
            // Track Click & Scroll trigger
            if (isPinchingNow && !lastIsPinchingRef.current) {
              // Pinch started (Mousedown)
              pinchStartXRef.current = handX;
              pinchStartYRef.current = handY;
              pinchStartTimeRef.current = Date.now();
              hasDraggedScrollRef.current = false;
              lastScrollHandXRef.current = handX;
              lastScrollHandYRef.current = handY;

              const element = document.elementFromPoint(handX, handY);
              if (element) {
                const mousedownEvent = new MouseEvent('mousedown', {
                  view: window,
                  bubbles: true,
                  cancelable: true,
                  clientX: handX,
                  clientY: handY,
                  buttons: 1
                });
                element.dispatchEvent(mousedownEvent);
              }
            } else if (isPinchingNow && lastIsPinchingRef.current) {
              // Pinch is held (Check for dragging/scrolling)
              const dx = handX - pinchStartXRef.current;
              const dy = handY - pinchStartYRef.current;
              const scrollLimit = 15; // 15px scroll boundary

              if (!hasDraggedScrollRef.current && (Math.abs(dx) > scrollLimit || Math.abs(dy) > scrollLimit)) {
                hasDraggedScrollRef.current = true;
              }

              if (hasDraggedScrollRef.current) {
                // Pinch-and-drag scrolling (natural touch scroll dragging)
                const scrollDeltaX = handX - lastScrollHandXRef.current;
                const scrollDeltaY = handY - lastScrollHandYRef.current;
                
                // Smart targeted container scrolling
                scrollElementAtPoint(
                  handX,
                  handY,
                  -scrollDeltaX * 3.5,
                  -scrollDeltaY * 3.5
                );
              } else {
                // Regular mouse drag dispatch for sliders or content
                const element = document.elementFromPoint(handX, handY);
                if (element) {
                  const mousemoveEvent = new MouseEvent('mousemove', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: handX,
                    clientY: handY,
                    buttons: 1
                  });
                  element.dispatchEvent(mousemoveEvent);
                }
              }

              // Update scroll reference coordinate frames
              lastScrollHandXRef.current = handX;
              lastScrollHandYRef.current = handY;
            }

            // Pinch ended (Mouseup & click dispatch)
            if (!isPinchingNow && lastIsPinchingRef.current) {
              const wasDragging = wasDraggingCameraThisSessionRef.current;
              wasDraggingCameraThisSessionRef.current = false;

              if (!wasDragging) {
                const element = document.elementFromPoint(handX, handY);
                if (element) {
                  const mouseupEvent = new MouseEvent('mouseup', {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                    clientX: handX,
                    clientY: handY,
                    buttons: 0
                  });
                  element.dispatchEvent(mouseupEvent);
                }

                // If they did not drag scroll, perform click
                if (!hasDraggedScrollRef.current) {
                  const clickElement = document.elementFromPoint(handX, handY);
                  if (clickElement) {
                    const clickEvent = new MouseEvent('click', {
                      view: window,
                      bubbles: true,
                      cancelable: true,
                      clientX: handX,
                      clientY: handY
                    });
                    clickElement.dispatchEvent(clickEvent);
                    if (clickElement instanceof HTMLInputElement || clickElement instanceof HTMLTextAreaElement || clickElement instanceof HTMLButtonElement) {
                      clickElement.focus();
                    }
                  }
                }
              }
            }

            lastIsPinchingRef.current = isPinchingNow;
          } else {
            // Reset state refs when not in cursor mode
            lastIsPinchingRef.current = false;
            hasDraggedScrollRef.current = false;
          }

          // 3. SHAKA POSTURE MODE TOGGLE SWITCH (Thumb + Pinky extended, others folded)
          const isIndexExtended1 = landmarks1[8].y < landmarks1[6].y;
          const isMiddleExtended1 = landmarks1[12].y < landmarks1[10].y;
          const isRingExtended1 = landmarks1[16].y < landmarks1[14].y;
          const isPinkyExtended1 = landmarks1[20].y < landmarks1[18].y;
          const isThumbExtended1 = Math.abs(landmarks1[4].x - landmarks1[5].x) > 0.11 || landmarks1[4].y < landmarks1[3].y;
          
          const isShakaPose = isThumbExtended1 && isPinkyExtended1 && !isIndexExtended1 && !isMiddleExtended1 && !isRingExtended1;
          
          if (isShakaPose) {
            if (!shakaStartRef.current) {
              shakaStartRef.current = Date.now();
            } else if (Date.now() - shakaStartRef.current > 1200) {
              const nextMode = store.kineticInteractionMode === 'gesture' ? 'cursor' : 'gesture';
              store.setKineticInteractionMode(nextMode);
              showToast(
                nextMode === 'cursor' 
                  ? '🖱️ Virtual Mouse Mode Activated! Index finger tracks cursor, pinch to click, index+middle to scroll!' 
                  : '🖐️ Kinetic Gesture Mode Activated! Swipes and custom pose macros active.', 
                'info', 
                3000
              );
              // Avoid spamming mode changes
              shakaStartRef.current = Date.now() + 2000;
            }
          } else {
            // Only clear if not in cooling down state
            if (shakaStartRef.current === null || Date.now() > shakaStartRef.current) {
              shakaStartRef.current = null;
            }
          }
        } else {
          // No hand detected, reset temporary tracking refs
          if (store.isPinching) store.setIsPinching(false);
          if (store.isPinchDragging) store.setIsPinchDragging(false);
          isHandDraggingCameraRef.current = false;
          lastScrollYRef.current = null;
          lastIsPinchingRef.current = false;
          shakaStartRef.current = null;
        }
      } catch (err) {
        console.error('Error executing custom interaction layer math:', err);
      }

      // Perform Gesture matching from trail history
      analyzeTrail();

      // Trigger overlay rendering in sync with tracker update
      drawOverlay();
    };

    if (handsRef.current) {
      handsRef.current.onResults(onMediaPipeResults);
    }

    let lastProcessTime = 0;
    // Boost frame processing to up to 60 FPS (16ms) in virtual mouse/cursor mode, and 40 FPS (24ms) in gesture mode
    const FRAME_INTERVAL = storeRef.current.kineticInteractionMode === 'cursor' ? 16 : 24;

    const processFrame = async () => {
      if (!isTrackingRef.current || !videoRef.current) return;
      if (isProcessingFrameRef.current) {
        requestAnimationFrame(processFrame);
        return;
      }

      const now = performance.now();
      if (now - lastProcessTime < FRAME_INTERVAL) {
        requestAnimationFrame(processFrame);
        return;
      }
      lastProcessTime = now;

      const video = videoRef.current;
      if (
        video.paused || 
        video.ended || 
        video.readyState < 2 || 
        video.videoWidth === 0 || 
        video.videoHeight === 0
      ) {
        requestAnimationFrame(processFrame);
        return;
      }

      if (handsRef.current) {
        try {
          isProcessingFrameRef.current = true;
          await handsRef.current.send({ image: video });
        } catch (err) {
          console.error("MediaPipe prediction error:", err);
        } finally {
          isProcessingFrameRef.current = false;
        }
      }

      requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);
  };

  // Draw high-performance hardware-accelerated overlays on Canvas instead of layout-expensive DOM elements
  const drawOverlay = () => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    const rect = overlay.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    if (isCameraOnlyMode) {
      if (overlay.width !== Math.floor(width * dpr) || overlay.height !== Math.floor(height * dpr)) {
        overlay.width = Math.floor(width * dpr);
        overlay.height = Math.floor(height * dpr);
      }
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);
      return;
    }

    if (overlay.width !== Math.floor(width * dpr) || overlay.height !== Math.floor(height * dpr)) {
      overlay.width = Math.floor(width * dpr);
      overlay.height = Math.floor(height * dpr);
    }

    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const centroid1 = centroidRef.current;
    const centroid2 = centroid2Ref.current;

    if (!centroid1 && !centroid2) return;

    // Coordinate mapping calculations: map [120, 90] to [width, height] accounting for object-cover cropping!
    const R_video = 120 / 90;
    const R_container = width / height;
    let S = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (R_container > R_video) {
      // Container is wider than video (cropped vertically)
      S = width / 120;
      offsetY = (height - 90 * S) / 2;
    } else {
      // Container is taller than video (cropped horizontally)
      S = height / 90;
      offsetX = (width - 120 * S) / 2;
    }

    const mapCoords = (vx: number, vy: number) => {
      const rx = vx;
      const screenX = rx * S + offsetX;
      const screenY = vy * S + offsetY;
      return { x: screenX, y: screenY };
    };

    const drawSingleHand = (
      centroid: { x: number; y: number } | null,
      fingers: typeof fingersRef.current,
      trail: typeof trailRef.current,
      primaryColor: string,
      secondaryColor: string,
      labelColor: string,
      boneColor: string
    ) => {
      if (!centroid) return;

      // Draw glowing trail
      if (trail && trail.length > 1) {
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        trail.forEach((p, idx) => {
          const pt = mapCoords(p.x, p.y);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow
      }

      // Draw skeleton lines from centroid to finger tips
      if (fingers && fingers.length > 0) {
        ctx.strokeStyle = boneColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
        const centerPt = mapCoords(centroid.x, centroid.y);

        fingers.forEach(f => {
          const fingerPt = mapCoords(f.x, f.y);
          ctx.beginPath();
          ctx.moveTo(centerPt.x, centerPt.y);
          ctx.lineTo(fingerPt.x, fingerPt.y);
          ctx.stroke();
        });
        ctx.setLineDash([]); // Reset
      }

      // Draw centroid joint (hand center)
      const centerPt = mapCoords(centroid.x, centroid.y);

      // Pulsing cyber sonar ring on centroid
      const cycle = (Date.now() / 450) % 1;
      ctx.strokeStyle = secondaryColor.replace('0.6', String(1 - cycle));
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(centerPt.x, centerPt.y, cycle * 28, 0, Math.PI * 2);
      ctx.stroke();

      // Central solid tracker dot
      ctx.fillStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(centerPt.x, centerPt.y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Core white dot for high visual precision
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(centerPt.x, centerPt.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw Finger Joints with names
      if (fingers) {
        fingers.forEach(f => {
          const fingerPt = mapCoords(f.x, f.y);

          // Glowing dot for finger tip joint
          ctx.fillStyle = labelColor;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = labelColor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(fingerPt.x, fingerPt.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0; // reset shadow

          // Render precise text tag HUD box for zero overlap and high legibility
          const text = f.name.replace(' Finger', '').toUpperCase();
          ctx.font = '900 8px monospace';
          const textWidth = ctx.measureText(text).width;
          
          const boxW = textWidth + 6;
          const boxH = 11;
          const bx = fingerPt.x - boxW / 2;
          const by = fingerPt.y - 18;

          // HUD solid background label card
          ctx.fillStyle = 'rgba(6, 6, 8, 0.9)';
          ctx.fillRect(bx, by, boxW, boxH);
          
          // HUD frame accent
          ctx.strokeStyle = secondaryColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(bx, by, boxW, boxH);

          // HUD label text
          ctx.fillStyle = labelColor;
          ctx.textAlign = 'center';
          ctx.fillText(text, fingerPt.x, by + 8);
        });
      }
    };

    // Draw first hand
    drawSingleHand(centroid1, fingersRef.current, trailRef.current, '#10b981', 'rgba(16, 185, 129, 0.6)', '#fbbf24', 'rgba(245, 158, 11, 0.6)');
    
    // Draw second hand if configured and active
    if (storeRef.current.kineticHandsMode === 'two' && centroid2) {
      drawSingleHand(centroid2, fingers2Ref.current, trail2Ref.current, '#3b82f6', 'rgba(59, 130, 246, 0.6)', '#a855f7', 'rgba(168, 85, 247, 0.6)');
    }
  };

  // Analyze trail patterns to trigger corresponding commands
  const analyzeTrail = () => {
    // In cursor mode, only allow trail gestures if they aren't pinching and haven't interacted recently
    const isAllowedInCursorMode = storeRef.current.kineticInteractionMode === 'cursor'
      ? (!useStore.getState().isPinching && (Date.now() - lastActiveCursorOrDragTimeRef.current > 1500))
      : true;

    if (!isAllowedInCursorMode) {
      return;
    }

    if (Date.now() - lastActiveCursorOrDragTimeRef.current < 1200) {
      return;
    }

    if (gestureCooldownRef.current || trailRef.current.length < 4) return;

    const points = trailRef.current;
    const now = Date.now();
    
    // We filter the points to look at a highly responsive 350ms window for swipes
    const swipePoints = points.filter(p => now - p.time < 350);
    if (swipePoints.length < 3) return;

    const start = swipePoints[0];
    const end = swipePoints[swipePoints.length - 1];

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const xs = swipePoints.map(p => p.x);
    const ys = swipePoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = maxX - minX;
    const spanY = maxY - minY;

    const duration = end.time - start.time;
    if (duration < 80 || duration > 400) return;

    // Check Custom gestures first!
    if (checkCustomGestures()) {
      trailRef.current = [];
      trail2Ref.current = [];
      return;
    }

    // Velocity checks for standard built-in gestures
    const minSwipeDistance = storeRef.current.swipeSensitivity * 1.1; // Restored standard sensitivity scale to prevent premature/accidental triggers
    const horizontalRatio = 1.35; // slightly more forgiving to allow comfortable, natural swipe curves

    // SWIPE RIGHT (Hand moves rightward on screen -> Swipe Right!)
    if (dx > minSwipeDistance && spanX > spanY * horizontalRatio) {
      triggerGesture('Swipe Right', 'swipe-right');
      trailRef.current = [];
      trail2Ref.current = [];
    }
    // SWIPE LEFT
    else if (dx < -minSwipeDistance && spanX > spanY * horizontalRatio) {
      triggerGesture('Swipe Left', 'swipe-left');
      trailRef.current = [];
      trail2Ref.current = [];
    }
    // SWIPE UP
    else if (dy < -minSwipeDistance && spanY > spanX * horizontalRatio) {
      triggerGesture('Swipe Up', 'swipe-up');
      trailRef.current = [];
      trail2Ref.current = [];
    }
    // SWIPE DOWN
    else if (dy > minSwipeDistance && spanY > spanX * horizontalRatio) {
      triggerGesture('Swipe Down', 'swipe-down');
      trailRef.current = [];
      trail2Ref.current = [];
    }
    // DETECT WAVE (alternating horizontal swings)
    else {
      // Analyze wave in a slightly longer window (last 700ms)
      const wavePoints = points.filter(p => now - p.time < 700);
      let turns = 0;
      let lastDir = 0;
      for (let i = 2; i < wavePoints.length; i++) {
        const step = wavePoints[i].x - wavePoints[i-1].x;
        if (Math.abs(step) > 3.5) { // Increased threshold from 1.5 to 3.5 to filter out hand tremor/noise
          const dir = Math.sign(step);
          if (lastDir !== 0 && dir !== lastDir) {
            turns++;
          }
          lastDir = dir;
        }
      }
      
      const waveSpanX = Math.max(...wavePoints.map(p => p.x)) - Math.min(...wavePoints.map(p => p.x));
      // Require at least 3 turns (e.g. back-and-forth) and wider movement to avoid accidental wave triggers
      if (turns >= 3 && waveSpanX > storeRef.current.waveSensitivity * 1.1) {
        triggerGesture('Wave Gesture', 'wave');
        trailRef.current = [];
        trail2Ref.current = [];
      }
    }
  };

  // Match current trail against user custom gestures
  const checkCustomGestures = (): boolean => {
    // Completely isolate gesture/macro analysis if we are in Virtual Mouse (cursor) mode
    if (storeRef.current.kineticInteractionMode === 'cursor') {
      return false;
    }

    if (Date.now() - lastActiveCursorOrDragTimeRef.current < 1800) {
      return false;
    }

    if (trailRef.current.length < 10) return false;

    // Normalize current trail path to 0-1 range
    const trailXs = trailRef.current.map(p => p.x);
    const trailYs = trailRef.current.map(p => p.y);
    const minX = Math.min(...trailXs);
    const maxX = Math.max(...trailXs);
    const minY = Math.min(...trailYs);
    const maxY = Math.max(...trailYs);

    const spanX = maxX - minX;
    const spanY = maxY - minY;

    // Require at least 24px of motion (increased from 12px) to prevent accidental shape matching from small noise/still hands
    if (spanX < 24 && spanY < 24) return false; 

    const normTrail = trailRef.current.map(p => ({
      x: spanX > 0 ? (p.x - minX) / spanX : 0.5,
      y: spanY > 0 ? (p.y - minY) / spanY : 0.5
    }));

    // Check each custom gesture in the list
    for (const gesture of storeRef.current.kineticGestures) {
      if (gesture.disabled) continue;
      if (!gesture.points || gesture.points.length < 5) continue;

      // Simple Shape Correlation Match (Procrustes-like path matching)
      // Resample both to 10 key points and compute average distance
      const keyPointsCount = 10;
      const resampledTrail = resamplePoints(normTrail, keyPointsCount);
      const resampledGesture = resamplePoints(gesture.points, keyPointsCount);

      let totalDist = 0;
      for (let i = 0; i < keyPointsCount; i++) {
        const dX = resampledTrail[i].x - resampledGesture[i].x;
        const dY = resampledTrail[i].y - resampledGesture[i].y;
        totalDist += Math.sqrt(dX*dX + dY*dY);
      }

      const avgDist = totalDist / keyPointsCount;

      // If average point distance is very low (below customPathMatchPrecision threshold), it's a direct match!
      if (avgDist < storeRef.current.customPathMatchPrecision) {
        triggerGesture(gesture.name, gesture.id);
        return true;
      }
    }

    return false;
  };

  // Helper to resample any series of points to exact N count for comparative matching
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

  const handleCancelConfirm = () => {
    setPendingConfirm(null);
    setCooldown(false);
  };

  // Execute associated system actions for a recognized gesture
  const triggerGesture = (name: string, id: string) => {
    if (gestureCooldownRef.current) return;
    const isNewSignup = typeof window !== 'undefined' && window.sessionStorage.getItem('is_new_signup') === 'true';
    const isWizardActive = !userProfile?.setupCompleted && isNewSignup;
    if (isWizardActive) return;

    if (Date.now() - lastGlobalTriggerTimeRef.current < 2500) {
      return;
    }
    lastGlobalTriggerTimeRef.current = Date.now();
    const gestureObj = storeRef.current.kineticGestures.find(g => g.id === id);
    if (!gestureObj) return;
    if (gestureObj.disabled) return;

    // Dispatch real-time last-triggered event to store for HUD notification
    try {
      useStore.getState().setLastTriggeredGesture({ name, timestamp: Date.now() });
    } catch (e) {
      console.error('Error updating last triggered gesture in store:', e);
    }

    // Check if first time triggered
    const triggeredList = getTriggeredGestures();
    if (!triggeredList.includes(id)) {
      saveTriggeredGesture(id);
      // Let's NOT auto-popup the annoying learning modal/educational popup to avoid disrupting flow
      // setLearningGesture(gestureObj);
      // setIsFirstTimeDiscovery(true);
      // setLearningCountdown(6);
      // setCooldown(true);
    }

    const action = gestureObj.action as string;
    const macroActions = gestureObj.macroActions || [];
    const macroDelay = gestureObj.macroDelay || 400;

    // Check if there are any dangerous actions being triggered (requiring double-confirm popup)
    const dangerousActions = ['clear-chat', 'delete-all-notifications', 'reset-system-data'];
    const isPrimaryDangerous = dangerousActions.includes(action);
    const hasDangerousMacroStep = action === 'macro' && macroActions.some(act => dangerousActions.includes(act));
    const isDangerous = isPrimaryDangerous || hasDangerousMacroStep;

    const runActionSequence = () => {
      setCooldown(true);
      setDetectedGesture(name);

      if (action === 'macro' && macroActions.length > 0) {
        triggerHaptic([60, 50, 60]); // energetic double pulse for macro start
        addKineticLog(name, `macro: [${macroActions.join(' → ')}]`);
      } else {
        triggerHaptic(80); // crisp single pulse for normal gesture
        addKineticLog(name, action);
      }

      const executeAction = (act: string) => {
        if (action === 'macro') {
          triggerHaptic(35); // dynamic tick buzz on sequential step execution
        }
        if (act === 'toggle-sidebar') {
          toggleSidebar();
        } else if (act === 'toggle-right-sidebar') {
          toggleRightSidebar();
        } else if (act === 'toggle-sidebar-minimize') {
          toggleSidebarMinimized();
        } else if (act === 'toggle-command-palette') {
          toggleCommandPalette();
        } else if (act === 'custom-alert') {
          const text = gestureObj.customText || 'Aether Kinetic Wave Activated!';
          showToast(text, 'success', 4000);
        } else if (act === 'create-quick-note') {
          addNote({
            projectId: 'default',
            title: '📝 Kinetic Capture Note',
            content: '## Hands-Free Kinetic Note\n\nCaptured via gesture: **' + name + '** on ' + new Date().toLocaleString() + '.\n\nIdeas & thoughts logged during flow state...',
            tags: ['kinetic', 'brainstorm']
          });
          showToast('📝 Instantly captured kinetic flow note!', 'success', 3000);
        } else if (act === 'trigger-sync') {
          triggerFullSync();
        } else if (act === 'nav-dashboard') {
          navigate('/');
          showToast('Routed to Dashboard via Kinetic command', 'success', 2500);
        } else if (act === 'nav-assistant') {
          navigate('/assistant');
          showToast('Routed to AI Assistant via Kinetic command', 'success', 2500);
        } else if (act === 'nav-notes') {
          navigate('/notes');
          showToast('Routed to Notes via Kinetic command', 'success', 2500);
        } else if (act === 'nav-projects') {
          navigate('/projects');
          showToast('Routed to Projects via Kinetic command', 'success', 2500);
        } else if (act === 'nav-automations') {
          navigate('/automations');
          showToast('Routed to Automations via Kinetic command', 'success', 2500);
        } else if (act === 'nav-docs') {
          navigate('/docs');
          showToast('Routed to Workspace Docs via Kinetic command', 'success', 2500);
        } else if (act === 'nav-settings') {
          navigate('/settings');
          showToast('Routed to System Settings via Kinetic command', 'success', 2500);
        } else if (act === 'nav-agents') {
          navigate('/agents');
          showToast('Routed to Agentic OS via Kinetic command', 'success', 2500);
        } else if (act === 'clear-chat') {
          window.dispatchEvent(new CustomEvent('aether-clear-chat'));
          showToast('🧹 Dialogue history successfully cleared.', 'success', 3000);
        } else if (act === 'delete-all-notifications') {
          const pending = invitations.filter((inv: any) => inv.status === 'pending');
          if (pending.length > 0) {
            pending.forEach((invite: any) => {
              declineInvitation(invite.id);
            });
            showToast(`❌ Purged ${pending.length} pending project invitations.`, 'success', 3000);
          } else {
            showToast('No pending invitations to purge.', 'info', 2500);
          }
        } else if (act === 'reset-system-data') {
          localStorage.clear();
          showToast('Resetting all configurations to default. Reloading...', 'error', 2000);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else if (act === 'zen-mode') {
          // Zen Mode: Minimized sidebar, closed right sidebar
          setSidebarOpen(false);
          setRightSidebarOpen(false);
          setSidebarMinimized(true);
          showToast('🧘 Zen Flow State Locked. All panels minimized and workspace silenced.', 'success', 3500);
        } else if (act === 'ai-summary-capture') {
          // AI Summary Capture Note
          addNote({
            projectId: 'default',
            title: '✨ Unified AI Workspace Summary',
            content: `## Intelligent Spatial Capture\n\n- Captured via: **Double-Hand Combo** on ${new Date().toLocaleString()}\n- **Workspace Status**: Synchronized and locked.\n- **Focus Metrics**: Active flow state validated.\n\n### Spatial Intelligence Insights\nThis note represents a spatial intelligence freeze-frame of your workspace state, automatically categorized as an active developmental milestone.`,
            tags: ['ai-capture', 'milestone', 'kinetic']
          });
          showToast('✨ Captured intelligent workspace summary note!', 'success', 3000);
        } else if (act === 'copy-active-note') {
          // Copy current active notes or workspace description to clipboard
          const summaryText = `Aether Workspace Milestone\nDate: ${new Date().toLocaleString()}\nStatus: Active Kinetic Development State\nCore VM: Sandboxed & Compiled`;
          navigator.clipboard.writeText(summaryText).then(() => {
            showToast('📋 Copied workspace state snapshot directly to clipboard!', 'success', 3000);
          }).catch(() => {
            showToast('📋 Copied workspace state summary!', 'success', 3000);
          });
        }
      };

      if (action === 'macro' && macroActions.length > 0) {
        macroActions.forEach((act, index) => {
          setTimeout(() => {
            executeAction(act);
          }, index * macroDelay);
        });
      } else {
        executeAction(action);
      }

      const userCooldown = storeRef.current.gestureCooldownDuration || 1500;
      const totalDuration = action === 'macro' && macroActions.length > 0
        ? Math.max(userCooldown, macroActions.length * macroDelay)
        : userCooldown;

      // Visual Flash Feedback on the bubble
      setTimeout(() => {
        setDetectedGesture(null);
      }, totalDuration);

      // Reset cooldown after duration
      setTimeout(() => {
        setCooldown(false);
      }, totalDuration);
    };

    if (isDangerous) {
      // Pause tracks and open modal
      setCooldown(true);
      
      let actionDesc = "";
      if (action === 'macro') {
        actionDesc = `Execute Macro Sequence containing sensitive operations: [${macroActions.join(' → ')}]`;
      } else {
        if (action === 'clear-chat') actionDesc = "Permanently clear your AI chat memory and conversation log history.";
        if (action === 'delete-all-notifications') actionDesc = "Reject and purge all pending workspace project invitations.";
        if (action === 'reset-system-data') actionDesc = "Completely reset all system configuration settings and local workspace database state to defaults (this will log you out and refresh the page).";
      }

      setPendingConfirm({
        name: name,
        action: action,
        description: actionDesc,
        onConfirm: () => {
          setPendingConfirm(null);
          runActionSequence();
        }
      });
      return;
    }

    // Default immediate run if not dangerous
    runActionSequence();
  };

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    const fromRight = window.innerWidth - e.clientX;
    const fromBottom = window.innerHeight - e.clientY;
    dragStartRef.current = {
      x: fromRight - position.x,
      y: fromBottom - position.y
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDragging(true);
    const touch = e.touches[0];
    const fromRight = window.innerWidth - touch.clientX;
    const fromBottom = window.innerHeight - touch.clientY;
    dragStartRef.current = {
      x: fromRight - position.x,
      y: fromBottom - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const fromRight = window.innerWidth - e.clientX;
      const fromBottom = window.innerHeight - e.clientY;
      const newX = Math.max(10, Math.min(window.innerWidth - 80, fromRight - dragStartRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, fromBottom - dragStartRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const fromRight = window.innerWidth - touch.clientX;
      const fromBottom = window.innerHeight - touch.clientY;
      const newX = Math.max(10, Math.min(window.innerWidth - 80, fromRight - dragStartRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, fromBottom - dragStartRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      {isKineticEnabled && showFloatingCamera && (
        <div 
          style={{ 
            right: position.x, 
            bottom: position.y,
            width: isMinimized ? '160px' : `${Math.round(192 * cameraScale)}px`,
            height: isMinimized ? '44px' : `${Math.round(240 * cameraScale)}px`
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`fixed z-50 rounded-2xl border bg-zinc-950/90 backdrop-blur-md shadow-2xl select-none ${
            !isDragging ? 'transition-all duration-150' : ''
          } ${
            isPinchDragging
              ? 'border-amber-400 shadow-amber-400/20 scale-[1.02] ring-2 ring-amber-500/20'
              : detectedGesture 
                ? 'border-emerald-500 shadow-emerald-500/10' 
                : 'border-zinc-800 hover:border-zinc-700'
          } flex flex-col overflow-hidden cursor-grab active:cursor-grabbing`}
        >
      {/* Top Header Controls */}
      <div className="h-10 px-3 bg-zinc-950 border-b border-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isPinchDragging ? 'bg-amber-400' : (kineticInteractionMode === 'cursor' ? 'bg-cyan-500' : (isCameraActive ? 'bg-emerald-500' : 'bg-red-500'))
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isPinchDragging ? 'bg-amber-400' : (kineticInteractionMode === 'cursor' ? 'bg-cyan-500' : (isCameraActive ? 'bg-emerald-500' : 'bg-red-500'))
            }`}></span>
          </span>
          <span className={`text-[9px] font-mono font-bold tracking-wider uppercase truncate ${
            isPinchDragging ? 'text-amber-400' : (kineticInteractionMode === 'cursor' ? 'text-cyan-400' : 'text-zinc-400')
          }`}>
            {isPinchDragging ? 'GRABBED' : (kineticInteractionMode === 'cursor' ? 'V-MOUSE MODE' : 'KINETIC OS')}
          </span>
        </div>
        
        <div className="flex items-center gap-1 no-drag">
          {/* Camera Only Mode Clean Toggle */}
          {!isMinimized && (
            <button 
              onClick={() => {
                const nextMode = !isCameraOnlyMode;
                setCameraOnlyMode(nextMode);
                showToast(nextMode ? '👁️ Camera Only Mode enabled' : '🖥️ Kinetic Full HUD restored', 'info', 2000);
              }}
              className={`p-1 hover:bg-zinc-900 rounded-md transition-colors ${isCameraOnlyMode ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              title={isCameraOnlyMode ? "Show HUD overlays" : "Hide HUD overlays (Camera Only)"}
            >
              {isCameraOnlyMode ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
          )}

          {/* Swap Axes Toggle */}
          {!isMinimized && (
            <button 
              onClick={() => {
                const nextSwapped = !isAxesSwapped;
                setIsAxesSwapped(nextSwapped);
                showToast(nextSwapped ? '🔄 Axis Swap Activated (Corrected 90° Rotations)' : '🔄 Axis Swap Deactivated', 'info', 2000);
              }}
              className={`p-1 hover:bg-zinc-900 rounded-md transition-colors ${isAxesSwapped ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Invert / Swap Axes (fixes vertical/horizontal camera rotation offset)"
            >
              <RefreshCw size={11} className={isAxesSwapped ? 'animate-spin' : ''} />
            </button>
          )}

          {/* Size Down Button */}
          {!isMinimized && (
            <button 
              onClick={() => {
                const nextScale = Math.max(0.5, cameraScale - 0.25);
                setCameraScale(nextScale);
                showToast(`📐 Resized Camera to ${Math.round(nextScale * 100)}%`, 'success', 1500);
              }}
              className="p-1 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Make Camera Smaller"
            >
              <Minus size={11} />
            </button>
          )}

          {/* Size Up Button */}
          {!isMinimized && (
            <button 
              onClick={() => {
                const nextScale = Math.min(2.5, cameraScale + 0.25);
                setCameraScale(nextScale);
                showToast(`📐 Resized Camera to ${Math.round(nextScale * 100)}%`, 'success', 1500);
              }}
              className="p-1 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Make Camera Larger"
            >
              <Plus size={11} />
            </button>
          )}

          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isMinimized ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button 
            onClick={() => setShowFloatingCamera(false)}
            className="p-1 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
            title="Hide Floating Bubble"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Camera Stream and Skeleton HUD */}
      {!isMinimized && (
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <video 
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-40 mix-blend-screen saturate-150 contrast-125"
          />
          
          <canvas 
            ref={canvasRef}
            className="hidden"
          />

          {/* High-Performance Canvas Overlay mapping joints in real-time */}
          <canvas 
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* Virtual Hud text and stats layer */}
          {!isCameraOnlyMode && (
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-2">
              {/* Realtime stats ticker */}
              <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500">
                <span>FPS: {fps}</span>
                <span>MOTION: {Math.round(motionAmount * 100)}%</span>
              </div>

              {/* Gesture predicted notification flash */}
              {detectedGesture && (
                <div className="absolute inset-x-2 top-10 z-20 py-1.5 px-2 bg-emerald-950/90 border border-emerald-500/50 rounded-lg text-center animate-bounce shadow-lg">
                  <p className="text-[10px] font-bold text-emerald-400 font-mono flex items-center justify-center gap-1">
                    <Sparkles size={10} className="animate-spin" />
                    {detectedGesture.toUpperCase()}
                  </p>
                  <p className="text-[7px] text-zinc-400 uppercase tracking-widest font-mono">
                    Trigger Executed
                  </p>
                </div>
              )}

              {/* Bottom hud branding */}
              <div className="flex justify-between items-end mt-auto text-[7px] font-mono text-emerald-500/60 uppercase tracking-wider">
                <span>TRK_SENS: HI</span>
                <span className="flex items-center gap-0.5">
                  <Activity size={8} className="animate-pulse text-emerald-400" />
                  SYSTEM READY
                </span>
              </div>
            </div>
          )}

          {/* MediaPipe Loading/Error states overlay */}
          {isMediaPipeLoading && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-3 text-center z-30">
              <Activity size={18} className="text-emerald-500 animate-pulse mb-1.5" />
              <p className="text-[9px] text-emerald-400 font-mono tracking-wider animate-bounce uppercase">Initializing Neural Tracker</p>
              <p className="text-[7px] text-zinc-500 font-mono mt-0.5">Downloading deep-learning models...</p>
            </div>
          )}

          {mediaPipeError && (
            <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-3 text-center z-30">
              <AlertCircle size={18} className="text-red-500 mb-1" />
              <p className="text-[9px] text-zinc-300 font-semibold mb-1">AI Init Failed</p>
              <p className="text-[7px] text-zinc-500 leading-normal">{mediaPipeError}</p>
            </div>
          )}

          {/* Fallback Permission Error Message */}
          {hasPermission === false && !isMediaPipeLoading && !mediaPipeError && (
            <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-3 text-center z-30">
              <AlertCircle size={18} className="text-red-500 mb-1" />
              <p className="text-[9px] text-zinc-300 font-semibold mb-1">Camera Denied</p>
              <p className="text-[8px] text-zinc-500 leading-normal mb-2">Enable camera access in settings to use hand gestures.</p>
              <button 
                onClick={startCamera}
                className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-[8px] rounded hover:bg-zinc-850 text-zinc-300 transition-all no-drag"
              >
                Retry Stream
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating control toolbar */}
      {!isMinimized && (
        <div className="h-10 px-2 bg-zinc-950 border-t border-zinc-900/60 flex items-center justify-between gap-1 text-[10px] no-drag">
          <button 
            onClick={() => {
              localStorage.setItem('settings_active_tab', 'kinetic-gestures');
              localStorage.setItem('settings_gesture_group', 'camera');
              localStorage.setItem('settings_gesture_sub_tab', 'setup');
              navigate('/settings');
            }}
            className="flex items-center gap-1 py-1 px-1.5 hover:bg-zinc-900 rounded-md text-zinc-400 hover:text-white transition-colors"
            title="Configure Camera & Gestures"
          >
            <Settings2 size={11} className="text-zinc-500 hover:text-zinc-300" />
            <span>Manage</span>
          </button>

          <button 
            onClick={() => {
              localStorage.setItem('settings_active_tab', 'kinetic-gestures');
              localStorage.setItem('settings_gesture_group', 'custom');
              localStorage.setItem('settings_gesture_sub_tab', 'create');
              navigate('/settings');
            }}
            className="flex items-center gap-1 py-1 px-1.5 hover:bg-zinc-900 rounded-md text-emerald-450 hover:text-emerald-355 transition-colors"
            title="Create Custom Gesture Shortcut"
          >
            <Sparkles size={11} />
            <span>Customize</span>
          </button>
          
          <button 
            onClick={() => {
              setKineticEnabled(false);
              showToast('🖐️ Camera tracking turned off.', 'info', 2000);
            }}
            className="flex items-center gap-1 py-1 px-1.5 hover:bg-red-950/40 rounded-md text-zinc-500 hover:text-red-400 transition-colors"
            title="Disable Kinetic Engine"
          >
            <CameraOff size={11} />
            <span>Turn Off</span>
          </button>
        </div>
      )}

      {/* Compact Mini bar display */}
      {isMinimized && (
        <div className="flex-grow flex items-center justify-between px-3 text-[10px]">
          <span className="text-[8px] text-zinc-500 font-mono">TRACKING IN BG</span>
          <button 
            onClick={() => {
              localStorage.setItem('settings_active_tab', 'kinetic-gestures');
              localStorage.setItem('settings_gesture_group', 'camera');
              localStorage.setItem('settings_gesture_sub_tab', 'setup');
              navigate('/settings');
            }}
            className="text-[8px] text-emerald-400 font-semibold uppercase hover:underline no-drag"
          >
            Settings
          </button>
        </div>
      )}
    </div>
  )}

    {/* High-Fidelity Double Confirmation Pop-Up for Important/Dangerous Actions */}
    <AnimatePresence>
      {pendingConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-3 sm:p-4 font-sans select-none no-drag">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0a0a0c]/95 border border-red-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative custom-scrollbar"
          >
            {/* Decorative Red Laser Aura at the top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-red-500/10 blur-[30px] rounded-full pointer-events-none" />
            
            <div className="space-y-4 sm:space-y-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/25">
                  <AlertTriangle size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Confirm Sensitive Gesture</h3>
                  <p className="text-[10px] text-red-400 font-mono">Safety Intercept Engaged</p>
                </div>
              </div>

              <div className="p-4 bg-red-950/10 border border-red-950/40 rounded-xl space-y-3">
                <div>
                  <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider">Triggered Gesture</span>
                  <span className="text-xs font-bold text-zinc-200">✨ {pendingConfirm.name}</span>
                </div>
                <div className="pt-2.5 border-t border-zinc-900">
                  <span className="text-[9px] text-zinc-500 font-mono block uppercase tracking-wider">Associated Action</span>
                  <span className="text-xs text-red-400 font-mono font-bold block mt-0.5 capitalize">
                    {pendingConfirm.action.replace(/-/g, ' ')}
                  </span>
                  <p className="text-[10.5px] text-zinc-400 mt-1.5 leading-relaxed font-sans font-normal">
                    {pendingConfirm.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2.5">
                <button
                  onClick={() => pendingConfirm.onConfirm()}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg hover:shadow-red-600/20 active:scale-98 cursor-pointer text-center"
                >
                  Confirm & Execute
                </button>
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 font-bold text-xs rounded-lg border border-zinc-800 transition-colors active:scale-98 cursor-pointer text-center"
                >
                  Cancel Action
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* High-Fidelity Kinetic Educational / Simulation HUD Overlay */}
    <AnimatePresence>
      {learningGesture && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[10001] p-3 sm:p-4 font-sans select-none no-drag">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#070709] border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative space-y-4 sm:space-y-5 custom-scrollbar"
          >
            {/* Cybernetic glowing aura backdrops */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />

            {/* Header with Title and Mode status */}
            <div className="flex items-start justify-between relative z-10 border-b border-zinc-900 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isFirstTimeDiscovery 
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-400' 
                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                }`}>
                  {isFirstTimeDiscovery ? <Award size={22} className="animate-bounce" /> : <Eye size={22} className="animate-pulse" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">
                    {isFirstTimeDiscovery ? '✨ Kinetic Discovery!' : '🤖 Gesture Simulator HUD'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {isFirstTimeDiscovery 
                      ? 'You triggered this action sequence for the first time!' 
                      : 'Interactive Walkthrough & Demonstration'}
                  </p>
                </div>
              </div>

              {!isFirstTimeDiscovery && (
                <button
                  onClick={() => {
                    setLearningGesture(null);
                    setCooldown(false);
                  }}
                  className="p-1.5 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
                  title="Close Simulation HUD"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sub details */}
            <div className="space-y-4 relative z-10">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Physical Gesture Signature</span>
                  <span className="text-base font-bold text-zinc-200 block mt-0.5">✨ {learningGesture.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[8.5px] font-mono font-bold rounded bg-emerald-950/40 border border-emerald-900/30 text-emerald-450 uppercase tracking-wider">
                    {getTriggerDetails(learningGesture).type.replace('-', ' ')}
                  </span>
                  <span className="px-2 py-0.5 text-[8.5px] font-mono font-semibold rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    ID: {learningGesture.id}
                  </span>
                </div>
              </div>

              {/* Physical description box */}
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl">
                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block mb-1">Trigger Combination & Motion</span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {getTriggerDetails(learningGesture).detail}
                </p>
              </div>

              {/* Real-time Hand Mimic simulator panel */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block font-semibold text-emerald-400">Live Gesture Replication Guide</span>
                <GestureSimulatorAnim gesture={learningGesture} />
              </div>

              {/* System action executed */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl">
                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Associated Action Pipeline</span>
                <div className="mt-1.5">
                  {learningGesture.action === 'macro' && learningGesture.macroActions ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] text-amber-450 font-mono font-bold uppercase tracking-wider">
                        <Zap size={11} className="text-amber-400 animate-pulse" />
                        <span>Multi-Step Macro Chain</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {learningGesture.macroActions.map((act: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            {idx > 0 && <span className="text-zinc-600 font-mono text-[10px]">→</span>}
                            <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-mono rounded text-zinc-300 capitalize">
                              {act.replace(/-/g, ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-emerald-950/40 border border-emerald-900/30 text-emerald-400">
                        <Cpu size={12} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-300 font-mono capitalize">
                          {learningGesture.action.replace(/-/g, ' ')}
                        </span>
                        {learningGesture.customText && (
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5 italic">"{learningGesture.customText}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 pt-2 border-t border-zinc-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
              {isFirstTimeDiscovery ? (
                <>
                  <div className="flex items-center gap-2 text-[10.5px] font-mono text-amber-400">
                    <span className="animate-ping h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>Auto-resuming tracker context in <span className="font-bold text-sm text-zinc-100">{learningCountdown}</span> seconds...</span>
                  </div>
                  <button
                    onClick={() => {
                      setLearningGesture(null);
                      setCooldown(false);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg hover:shadow-emerald-600/10 cursor-pointer text-center animate-pulse"
                  >
                    Got It, Continue
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsInteractivePractice(!isInteractivePractice)}
                      className={`px-3 py-1.5 rounded-lg border text-[10.5px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        isInteractivePractice 
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400' 
                          : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Camera size={12} />
                      <span>{isInteractivePractice ? '🔴 Live Practice Mode: Active' : 'Practice with Camera'}</span>
                    </button>
                    {isInteractivePractice && (
                      <span className="text-[9px] text-zinc-500 font-mono animate-pulse">Perform motion in front of camera!</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setLearningGesture(null);
                      setCooldown(false);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Exit Simulator
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
