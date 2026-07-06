import { create } from 'zustand';

export interface KineticGesture {
  id: string;
  name: string;
  action: 'toggle-sidebar' | 'toggle-right-sidebar' | 'toggle-sidebar-minimize' | 'toggle-command-palette' | 'custom-alert' | 'macro' | 'none' | 'create-quick-note' | 'trigger-sync' | 'nav-dashboard' | 'nav-projects' | 'nav-notes' | 'nav-docs' | 'nav-settings' | 'clear-chat' | 'reset-system-data' | 'zen-mode' | 'ai-summary-capture' | 'copy-active-note' | string;
  customText?: string;
  points?: { x: number; y: number }[];
  direction?: 'left' | 'right' | 'up' | 'down' | 'wave' | 'custom' | string;
  macroActions?: ('toggle-sidebar' | 'toggle-right-sidebar' | 'toggle-sidebar-minimize' | 'toggle-command-palette' | 'custom-alert' | 'create-quick-note' | 'trigger-sync' | 'nav-dashboard' | 'nav-projects' | 'nav-notes' | 'nav-docs' | 'nav-settings' | 'clear-chat' | 'reset-system-data' | 'zen-mode' | 'ai-summary-capture' | 'copy-active-note' | string)[];
  macroDelay?: number;
  disabled?: boolean;
}

interface StoreState {
  isCommandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isSidebarMinimized: boolean;
  toggleSidebarMinimized: () => void;
  setSidebarMinimized: (minimized: boolean) => void;
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  isRightSidebarExpanded: boolean;
  toggleRightSidebarExpanded: () => void;
  setRightSidebarOpen: (open: boolean) => void;
  
  // Kinetic Gestures
  isKineticEnabled: boolean;
  setKineticEnabled: (enabled: boolean) => void;
  kineticHandsMode: 'one' | 'two';
  setKineticHandsMode: (mode: 'one' | 'two') => void;
  showFloatingCamera: boolean;
  setShowFloatingCamera: (show: boolean) => void;
  kineticGestures: KineticGesture[];
  setKineticGestures: (gestures: KineticGesture[]) => void;
  kineticLogs: { id: string; name: string; action: string; timestamp: number }[];
  addKineticLog: (name: string, action: string) => void;

  // Kinetic Calibration/Sensitivity Controls
  swipeSensitivity: number; // minimum distance in pixels (lower = more sensitive, default 32)
  setSwipeSensitivity: (val: number) => void;
  customPathMatchPrecision: number; // average point distance error allowed (higher = more loose, default 0.23)
  setCustomPathMatchPrecision: (val: number) => void;
  waveSensitivity: number; // minimum wave span in pixels (lower = more sensitive, default 30)
  setWaveSensitivity: (val: number) => void;
  fingerPoseStabilityFrames: number; // minimum stable frames required (lower = faster trigger, default 10)
  setFingerPoseStabilityFrames: (val: number) => void;
  gestureCooldownDuration: number; // cooldown duration in milliseconds between macro/gesture executions (default 1500)
  setGestureCooldownDuration: (val: number) => void;

  commandHistory: { action: string; timestamp: number }[];
  addCommandHistory: (action: string) => void;

  // Real-time tracking stats for on-screen HUD overlay
  activeHandsDetected: number;
  setActiveHandsDetected: (count: number) => void;
  hand1Fingers: string[];
  hand2Fingers: string[];
  setHandFingers: (hand1: string[], hand2: string[]) => void;
  lastTriggeredGesture: { name: string; timestamp: number } | null;
  setLastTriggeredGesture: (gesture: { name: string; timestamp: number } | null) => void;

  // Interaction Mode properties
  kineticInteractionMode: 'gesture' | 'cursor';
  setKineticInteractionMode: (mode: 'gesture' | 'cursor') => void;
  isPinchDragging: boolean;
  setIsPinchDragging: (isPinchDragging: boolean) => void;
  virtualCursorPos: { x: number; y: number };
  setVirtualCursorPos: (pos: { x: number; y: number }) => void;
  isPinching: boolean;
  setIsPinching: (isPinching: boolean) => void;
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
const initialSidebarOpen = localStorage.getItem('isSidebarOpen') !== null
  ? localStorage.getItem('isSidebarOpen') !== 'false'
  : !isMobile;
const initialSidebarMinimized = localStorage.getItem('isSidebarMinimized') === 'true';
const initialRightSidebarOpen = localStorage.getItem('isRightSidebarOpen') !== null
  ? localStorage.getItem('isRightSidebarOpen') !== 'false'
  : !isMobile;

export const DEFAULT_GESTURES: KineticGesture[] = [
  { id: 'swipe-left', name: 'Swipe Left', action: 'toggle-sidebar', direction: 'left' },
  { id: 'swipe-right', name: 'Swipe Right', action: 'toggle-sidebar', direction: 'right' },
  { id: 'swipe-up', name: 'Swipe Up', action: 'toggle-command-palette', direction: 'up' },
  { id: 'wave', name: 'Wave Gesture', action: 'toggle-right-sidebar', direction: 'wave' },
  { id: 'peace-sign', name: 'Peace Sign (2 Fingers)', action: 'custom-alert', direction: 'pose-2', customText: '✌️ Zen State Enabled! Kinetic peace sign posture active.' },
  { id: 'three-fingers', name: 'Three-Finger Capture', action: 'custom-alert', direction: 'pose-3', customText: '📝 Logged hands-free snap event via Three-Finger Pose!' },
  { 
    id: 'toggle-macro', 
    name: 'Sidebar Duo Macro', 
    action: 'macro', 
    direction: 'pose-4', 
    macroActions: ['toggle-sidebar', 'toggle-right-sidebar'], 
    macroDelay: 450 
  },
  { 
    id: 'hud-macro', 
    name: 'Command Portal Macro', 
    action: 'macro', 
    direction: 'pose-5', 
    macroActions: ['toggle-command-palette', 'toggle-right-sidebar'], 
    macroDelay: 500 
  },
  // Double Hand Gestures
  { id: 'double-peace', name: 'Double Peace Signs (2+2 Fingers)', action: 'zen-mode', direction: 'double-pose-2-2' },
  { id: 'double-highfive', name: 'Double High Five (5+5 Fingers)', action: 'macro', direction: 'double-pose-5-5', macroActions: ['create-quick-note', 'trigger-sync'] as any, macroDelay: 400 },
  { id: 'one-peace-one-highfive', name: 'Peace + High Five (2+5 Combo)', action: 'ai-summary-capture', direction: 'double-pose-2-5' },
  { id: 'double-pointers', name: 'Double Pointers (1+1 Fingers)', action: 'macro', direction: 'double-pose-1-1', macroActions: ['toggle-command-palette', 'toggle-right-sidebar'] as any, macroDelay: 350 },
  { id: 'pointer-highfive', name: 'Pointer + High Five (1+5 Combo)', action: 'copy-active-note', direction: 'double-pose-1-5' }
];

export const useStore = create<StoreState>((set) => ({
  isCommandPaletteOpen: false,
  toggleCommandPalette: () => set((state) => {
    const nextVal = !state.isCommandPaletteOpen;
    const nextHistory = [
      { action: 'toggle-command-palette', timestamp: Date.now() },
      ...state.commandHistory
    ].slice(0, 50);
    localStorage.setItem('commandHistory', JSON.stringify(nextHistory));
    return { isCommandPaletteOpen: nextVal, commandHistory: nextHistory };
  }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  isSidebarOpen: initialSidebarOpen,
  toggleSidebar: () => set((state) => {
    const nextVal = !state.isSidebarOpen;
    localStorage.setItem('isSidebarOpen', String(nextVal));
    const nextHistory = [
      { action: 'toggle-sidebar', timestamp: Date.now() },
      ...state.commandHistory
    ].slice(0, 50);
    localStorage.setItem('commandHistory', JSON.stringify(nextHistory));
    return { isSidebarOpen: nextVal, commandHistory: nextHistory };
  }),
  setSidebarOpen: (open) => set(() => {
    localStorage.setItem('isSidebarOpen', String(open));
    return { isSidebarOpen: open };
  }),
  isSidebarMinimized: initialSidebarMinimized,
  toggleSidebarMinimized: () => set((state) => {
    const nextVal = !state.isSidebarMinimized;
    localStorage.setItem('isSidebarMinimized', String(nextVal));
    const nextHistory = [
      { action: 'toggle-sidebar-minimize', timestamp: Date.now() },
      ...state.commandHistory
    ].slice(0, 50);
    localStorage.setItem('commandHistory', JSON.stringify(nextHistory));
    return { isSidebarMinimized: nextVal, commandHistory: nextHistory };
  }),
  setSidebarMinimized: (minimized) => set(() => {
    localStorage.setItem('isSidebarMinimized', String(minimized));
    return { isSidebarMinimized: minimized };
  }),
  isRightSidebarOpen: initialRightSidebarOpen,
  toggleRightSidebar: () => set((state) => {
    const nextVal = !state.isRightSidebarOpen;
    localStorage.setItem('isRightSidebarOpen', String(nextVal));
    const nextHistory = [
      { action: 'toggle-right-sidebar', timestamp: Date.now() },
      ...state.commandHistory
    ].slice(0, 50);
    localStorage.setItem('commandHistory', JSON.stringify(nextHistory));
    return { isRightSidebarOpen: nextVal, commandHistory: nextHistory };
  }),
  isRightSidebarExpanded: false,
  toggleRightSidebarExpanded: () => set((state) => ({ isRightSidebarExpanded: !state.isRightSidebarExpanded })),
  setRightSidebarOpen: (open) => set(() => {
    localStorage.setItem('isRightSidebarOpen', String(open));
    return { isRightSidebarOpen: open };
  }),
  
  // Kinetic Gestures Initial State
  isKineticEnabled: typeof window !== 'undefined' 
    ? (localStorage.getItem('isKineticEnabled') !== null 
        ? localStorage.getItem('isKineticEnabled') === 'true' 
        : true) 
    : true,
  setKineticEnabled: (enabled) => set(() => {
    localStorage.setItem('isKineticEnabled', String(enabled));
    return { isKineticEnabled: enabled };
  }),
  kineticHandsMode: typeof window !== 'undefined' && localStorage.getItem('kineticHandsMode') === 'two' ? 'two' : 'one',
  setKineticHandsMode: (mode) => set(() => {
    localStorage.setItem('kineticHandsMode', mode);
    return { kineticHandsMode: mode };
  }),
  showFloatingCamera: typeof window !== 'undefined' ? localStorage.getItem('showFloatingCamera') !== 'false' : true,
  setShowFloatingCamera: (show) => set(() => {
    localStorage.setItem('showFloatingCamera', String(show));
    return { showFloatingCamera: show };
  }),
  kineticGestures: typeof window !== 'undefined' && localStorage.getItem('kineticGestures') 
    ? (() => {
        try {
          const parsed = JSON.parse(localStorage.getItem('kineticGestures')!) as KineticGesture[];
          if (parsed.length <= 4) {
            localStorage.setItem('kineticGestures', JSON.stringify(DEFAULT_GESTURES));
            return DEFAULT_GESTURES;
          }
          return parsed;
        } catch (e) {
          return DEFAULT_GESTURES;
        }
      })()
    : DEFAULT_GESTURES,
  setKineticGestures: (gestures) => set(() => {
    localStorage.setItem('kineticGestures', JSON.stringify(gestures));
    return { kineticGestures: gestures };
  }),
  kineticLogs: [],
  addKineticLog: (name, action) => set((state) => ({
    kineticLogs: [
      { id: Math.random().toString(36).substring(7), name, action, timestamp: Date.now() },
      ...state.kineticLogs.slice(0, 19) // Keep last 20 logs
    ]
  })),

  // Sensitivity Controls Initial State & Setters
  swipeSensitivity: typeof window !== 'undefined' && localStorage.getItem('swipeSensitivity') 
    ? Number(localStorage.getItem('swipeSensitivity')) 
    : 32,
  setSwipeSensitivity: (val) => set(() => {
    localStorage.setItem('swipeSensitivity', String(val));
    return { swipeSensitivity: val };
  }),
  customPathMatchPrecision: typeof window !== 'undefined' && localStorage.getItem('customPathMatchPrecision')
    ? Number(localStorage.getItem('customPathMatchPrecision'))
    : 0.23,
  setCustomPathMatchPrecision: (val) => set(() => {
    localStorage.setItem('customPathMatchPrecision', String(val));
    return { customPathMatchPrecision: val };
  }),
  waveSensitivity: typeof window !== 'undefined' && localStorage.getItem('waveSensitivity')
    ? Number(localStorage.getItem('waveSensitivity'))
    : 30,
  setWaveSensitivity: (val) => set(() => {
    localStorage.setItem('waveSensitivity', String(val));
    return { waveSensitivity: val };
  }),
  fingerPoseStabilityFrames: typeof window !== 'undefined' && localStorage.getItem('fingerPoseStabilityFrames')
    ? Number(localStorage.getItem('fingerPoseStabilityFrames'))
    : 10,
  setFingerPoseStabilityFrames: (val) => set(() => {
    localStorage.setItem('fingerPoseStabilityFrames', String(val));
    return { fingerPoseStabilityFrames: val };
  }),
  gestureCooldownDuration: typeof window !== 'undefined' && localStorage.getItem('gestureCooldownDuration')
    ? Number(localStorage.getItem('gestureCooldownDuration'))
    : 1500,
  setGestureCooldownDuration: (val) => set(() => {
    localStorage.setItem('gestureCooldownDuration', String(val));
    return { gestureCooldownDuration: val };
  }),

  commandHistory: typeof window !== 'undefined' && localStorage.getItem('commandHistory')
    ? JSON.parse(localStorage.getItem('commandHistory')!)
    : [],
  addCommandHistory: (action) => set((state) => {
    const nextHistory = [
      { action, timestamp: Date.now() },
      ...state.commandHistory
    ].slice(0, 50);
    localStorage.setItem('commandHistory', JSON.stringify(nextHistory));
    return { commandHistory: nextHistory };
  }),

  // Real-time tracking stats initializers
  activeHandsDetected: 0,
  setActiveHandsDetected: (count) => set(() => ({ activeHandsDetected: count })),
  hand1Fingers: [],
  hand2Fingers: [],
  setHandFingers: (hand1, hand2) => set(() => ({ hand1Fingers: hand1, hand2Fingers: hand2 })),
  lastTriggeredGesture: null,
  setLastTriggeredGesture: (gesture) => set(() => ({ lastTriggeredGesture: gesture })),

  // Interaction Mode initializers
  kineticInteractionMode: 'gesture',
  setKineticInteractionMode: (mode) => set(() => ({ kineticInteractionMode: mode })),
  isPinchDragging: false,
  setIsPinchDragging: (dragging) => set(() => ({ isPinchDragging: dragging })),
  virtualCursorPos: { x: 0, y: 0 },
  setVirtualCursorPos: (pos) => set(() => ({ virtualCursorPos: pos })),
  isPinching: false,
  setIsPinching: (pinching) => set(() => ({ isPinching: pinching })),
}));
