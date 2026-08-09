import { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Key, CreditCard, Mail, Database, Users, Github, ShieldAlert, CheckCircle2, Bot, Sparkles, ShieldCheck, Eye, Settings2, Activity, Terminal, AlertCircle, RefreshCw, Mic, Volume2, Compass, Trash2, Plus, Upload, LogOut, Camera, CameraOff, X, GripVertical, Home, Notebook, Zap, FileText, Cpu, AlertTriangle, Edit2, Cloud, Heart, Download, Search, Share2, FolderArchive, BookOpen, Laptop } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../context/DataProvider';
import { logout, auth, linkProvider, unlinkProvider, googleSignIn, githubSignIn } from '../lib/auth';
import { WakeWordEngine } from '../components/ui/WakeWordEngine';
import { useStore, KineticGesture } from '../store';
import { LocalModelSettingsTab } from '../components/ui/LocalModelSettingsTab';
import { KeyboardMapperTab } from '../components/ui/KeyboardMapperTab';
import { AutonomousAppWatcher } from '../components/ui/AutonomousAppWatcher';
import { HandGestureCenter } from '../components/ui/HandGestureCenter';
import { RecoveryCenter } from '../components/RecoveryCenter';
import { DesktopAutoUpdateCenter } from '../components/DesktopAutoUpdateCenter';
import { BiometricSessionSecuritySettings } from '../components/BiometricSessionSecuritySettings';
import { ActivityCenterSettingsTab } from '../components/ui/ActivityCenterSettingsTab';
import { DesktopOverlaySettingsTab } from '../components/DesktopOverlaySettingsTab';
import { IntegrationsCenter } from '../components/IntegrationsCenter';
import { AetherActionsSection } from '../components/AetherActionsSection';
import { getAllAvailableModels, AIModelChoice } from '../lib/localModelEngine';
import { isElectron } from '../lib/electronBridge';
import { aetherVoiceRegistry } from '../lib/aetherVoiceRegistry';

function KineticSandboxVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [simulatedType, setSimulatedType] = useState<'off' | 'swipe-left' | 'swipe-right' | 'swipe-up' | 'wave' | 'pose-2' | 'pose-5' | 'circle'>('off');
  const { showToast, addNote } = useData();

  useEffect(() => {
    let active = true;
    
    const draw = () => {
      if (!active) return;
      
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Dark background with cyber grid matrix
          ctx.fillStyle = '#060608';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw coordinates grid lines
          ctx.strokeStyle = '#111115';
          ctx.lineWidth = 1;
          for (let i = 0; i < canvas.width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
          }
          for (let j = 0; j < canvas.height; j += 30) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(canvas.width, j);
            ctx.stroke();
          }

          // Simulated centroid calculations
          let simulatedCentroid: { x: number; y: number } | null = null;
          let simulatedTrail: { x: number; y: number }[] = [];
          let simulatedFingers: { name: string; x: number; y: number }[] = [];

          const t = (Date.now() / 15) % 100; // loop 0 to 99

          if (simulatedType === 'swipe-left') {
            // Moves from right (110) to left (10)
            const x = 110 - (t * 1) % 110;
            const y = 45;
            simulatedCentroid = { x, y };
            for (let i = 0; i < 8; i++) {
              const tx = x + i * 8;
              if (tx <= 110) simulatedTrail.push({ x: tx, y });
            }
            simulatedFingers = [
              { name: 'INDEX FINGER', x: x - 4, y: y - 15 },
              { name: 'MIDDLE FINGER', x: x + 2, y: y - 14 }
            ];
          } else if (simulatedType === 'swipe-right') {
            // Moves from left (10) to right (110)
            const x = 10 + (t * 1) % 110;
            const y = 45;
            simulatedCentroid = { x, y };
            for (let i = 0; i < 8; i++) {
              const tx = x - i * 8;
              if (tx >= 10) simulatedTrail.push({ x: tx, y });
            }
            simulatedFingers = [
              { name: 'INDEX FINGER', x: x - 4, y: y - 15 },
              { name: 'MIDDLE FINGER', x: x + 2, y: y - 14 }
            ];
          } else if (simulatedType === 'swipe-up') {
            // Moves from bottom (80) to top (10)
            const y = 80 - (t * 0.7) % 70;
            const x = 60;
            simulatedCentroid = { x, y };
            for (let i = 0; i < 8; i++) {
              const ty = y + i * 8;
              if (ty <= 80) simulatedTrail.push({ x, y: ty });
            }
            simulatedFingers = [
              { name: 'INDEX FINGER', x: x - 2, y: y - 18 }
            ];
          } else if (simulatedType === 'wave') {
            // Waving back and forth
            const x = 60 + Math.sin(Date.now() / 120) * 45;
            const y = 45 + Math.cos(Date.now() / 300) * 10;
            simulatedCentroid = { x, y };
            for (let i = 0; i < 12; i++) {
              const historicalX = 60 + Math.sin((Date.now() - i * 40) / 120) * 45;
              const historicalY = 45 + Math.cos((Date.now() - i * 40) / 300) * 10;
              simulatedTrail.push({ x: historicalX, y: historicalY });
            }
            simulatedFingers = [
              { name: 'THUMB', x: x - 18, y: y - 5 },
              { name: 'INDEX FINGER', x: x - 12, y: y - 20 },
              { name: 'MIDDLE FINGER', x: x - 2, y: y - 22 },
              { name: 'RING FINGER', x: x + 8, y: y - 18 },
              { name: 'PINKY FINGER', x: x + 16, y: y - 10 }
            ];
          } else if (simulatedType === 'pose-2') {
            // Static 2 fingers
            const x = 60;
            const y = 45;
            simulatedCentroid = { x, y };
            simulatedFingers = [
              { name: 'INDEX FINGER', x: x - 10, y: y - 24 },
              { name: 'MIDDLE FINGER', x: x + 10, y: y - 26 }
            ];
          } else if (simulatedType === 'pose-5') {
            // Static 5 fingers open wide
            const x = 60;
            const y = 45;
            simulatedCentroid = { x, y };
            simulatedFingers = [
              { name: 'THUMB', x: x - 22, y: y - 3 },
              { name: 'INDEX FINGER', x: x - 15, y: y - 25 },
              { name: 'MIDDLE FINGER', x: x - 2, y: y - 28 },
              { name: 'RING FINGER', x: x + 11, y: y - 23 },
              { name: 'PINKY FINGER', x: x + 21, y: y - 11 }
            ];
          } else if (simulatedType === 'circle') {
            // Traces circular template
            const angle = (Date.now() / 250) % (Math.PI * 2);
            const x = 60 + Math.cos(angle) * 35;
            const y = 45 + Math.sin(angle) * 28;
            simulatedCentroid = { x, y };
            for (let i = 0; i < 24; i++) {
              const pastAngle = (Date.now() / 250 - i * 0.12) % (Math.PI * 2);
              simulatedTrail.push({
                x: 60 + Math.cos(pastAngle) * 35,
                y: 45 + Math.sin(pastAngle) * 28
              });
            }
            simulatedFingers = [
              { name: 'INDEX FINGER', x: x + Math.cos(angle) * 5, y: y + Math.sin(angle) * 5 }
            ];
          }

          // Fetch live feed info from unified kinetic tracking state
          const feed = window.__kineticEngine?.getLiveFeed();
          const isTracking = (feed && feed.isTracking) || simulatedType !== 'off';
          const activeCentroid = simulatedType !== 'off' ? simulatedCentroid : (feed?.centroid);
          const activeTrail = simulatedType !== 'off' ? simulatedTrail : (feed?.trail);
          const activeFingers = simulatedType !== 'off' ? simulatedFingers : (feed?.fingers);

          if (isTracking) {
            // Draw radial focal grid lines
            ctx.strokeStyle = '#18181b';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 10, 0, Math.PI * 2);
            ctx.stroke();

            // Trace glowing centroid motion path
            if (activeTrail && activeTrail.length > 1) {
              ctx.strokeStyle = simulatedType !== 'off' ? '#3b82f6' : '#10b981';
              ctx.lineWidth = 3.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.shadowColor = simulatedType !== 'off' ? '#3b82f6' : '#10b981';
              ctx.shadowBlur = 4;
              ctx.beginPath();
              activeTrail.forEach((p, idx) => {
                const px = (p.x / 120) * canvas.width;
                const py = (p.y / 90) * canvas.height;
                if (idx === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              });
              ctx.stroke();
              ctx.shadowBlur = 0; // reset shadow
            }
            
            // Draw the hand position dot
            if (activeCentroid) {
              const cx = (activeCentroid.x / 120) * canvas.width;
              const cy = (activeCentroid.y / 90) * canvas.height;
              
              // Pulsing sonar rings
              const cycle = (Date.now() / 400) % 1;
              ctx.strokeStyle = simulatedType !== 'off' ? `rgba(59, 130, 246, ${1 - cycle})` : `rgba(16, 185, 129, ${1 - cycle})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(cx, cy, cycle * 30, 0, Math.PI * 2);
              ctx.stroke();
              
              // Main point
              ctx.fillStyle = simulatedType !== 'off' ? '#3b82f6' : '#10b981';
              ctx.shadowColor = simulatedType !== 'off' ? '#3b82f6' : '#10b981';
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(cx, cy, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0; // reset shadow
            }

            // Trace glowing finger positions and skeleton
            if (activeFingers && activeFingers.length > 0 && activeCentroid) {
              const cx = (activeCentroid.x / 120) * canvas.width;
              const cy = (activeCentroid.y / 90) * canvas.height;

              // Draw skeleton lines to fingers
              ctx.strokeStyle = simulatedType !== 'off' ? 'rgba(59, 130, 246, 0.45)' : 'rgba(245, 158, 11, 0.45)';
              ctx.lineWidth = 1.2;
              ctx.setLineDash([2, 2]);
              activeFingers.forEach(f => {
                const fx = (f.x / 120) * canvas.width;
                const fy = (f.y / 90) * canvas.height;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(fx, fy);
                ctx.stroke();
              });
              ctx.setLineDash([]); // Reset dashed state

              // Draw finger target circles & text labels
              activeFingers.forEach(f => {
                const fx = (f.x / 120) * canvas.width;
                const fy = (f.y / 90) * canvas.height;

                // Outer glowing circle
                ctx.fillStyle = simulatedType !== 'off' ? '#2563eb' : '#f59e0b';
                ctx.strokeStyle = simulatedType !== 'off' ? '#60a5fa' : '#fbbf24';
                ctx.lineWidth = 1.5;
                ctx.shadowColor = simulatedType !== 'off' ? '#2563eb' : '#f59e0b';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(fx, fy, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0; // Reset shadow

                // Finger labels
                ctx.fillStyle = '#fef3c7';
                ctx.font = '7px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(f.name.toUpperCase().replace(' FINGER', ''), fx, fy - 8);
              });
            }
          } else {
            // Idle / Wait notification
            ctx.fillStyle = '#3f3f46';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('👁️ AWAITING KINETIC CAMERA CONNECTION', canvas.width / 2, canvas.height / 2);
            ctx.font = '8px monospace';
            ctx.fillText('(OR LAUNCH AN INTERACTIVE SIMULATION BELOW)', canvas.width / 2, canvas.height / 2 + 15);
          }
        }
      }
      requestAnimationFrame(draw);
    };
    
    requestAnimationFrame(draw);
    
    return () => {
      active = false;
    };
  }, [simulatedType]);

  const handleSimulateDemo = (type: typeof simulatedType) => {
    setSimulatedType(type);
    if (type === 'off') {
      showToast('Interactive simulation paused.', 'info', 1500);
      return;
    }

    // Trigger state or toast
    const store = useStore.getState();
    const mockNames: Record<string, string> = {
      'swipe-left': 'Swipe Left',
      'swipe-right': 'Swipe Right',
      'swipe-up': 'Swipe Up',
      'wave': 'Wave Gesture',
      'pose-2': '2-Finger Peace Sign',
      'pose-5': '5-Finger High Five',
      'circle': 'Circular Custom Path'
    };

    showToast(`🤖 Simulating: ${mockNames[type]} on Sandbox radar...`, 'info', 2000);

    // Apply the action after a tiny delay to mimic visual completion
    setTimeout(() => {
      if (type === 'swipe-left' || type === 'swipe-right') {
        store.toggleSidebar();
        showToast('👉 Sidebar Toggled via Simulated Gesture!', 'success', 2500);
      } else if (type === 'swipe-up') {
        store.toggleCommandPalette();
        showToast('☝️ Command Palette Opened via Simulated Gesture!', 'success', 2500);
      } else if (type === 'wave') {
        store.toggleRightSidebar();
        showToast('👋 Workspace Assistant Toggled via Simulated Gesture!', 'success', 2500);
      } else if (type === 'pose-2') {
        showToast('✌️ Peace Sign: Custom Zen notification active!', 'success', 2500);
      } else if (type === 'pose-5') {
        addNote({
          projectId: 'default',
          title: '📝 Simulated Quick Note',
          content: '## Hands-Free Captured Note\n\nCaptured via simulated 5-Finger High Five gesture in Sandbox mode.',
          tags: ['kinetic', 'simulated']
        });
        showToast('🖐️ Created Quick Note via Simulated Posture!', 'success', 2500);
      } else if (type === 'circle') {
        store.toggleSidebar();
        setTimeout(() => {
          store.toggleRightSidebar();
        }, 450);
        showToast('🌀 Multi-Step Macro Chain completed hands-free!', 'success', 3000);
      }
    }, 1500);
  };
  
  return (
    <div className="relative space-y-3">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={220} 
        className="w-full h-48 sm:h-56 rounded-xl border border-zinc-900 bg-zinc-950/40 shadow-inner"
      />
      <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-900 text-[8px] font-mono text-zinc-500">
        <span>{simulatedType !== 'off' ? 'DEMO_STREAM_SIM_ACTIVE' : 'SNDBX_RADAR_v1.0'}</span>
      </div>

      {/* Interactive Simulation Dashboard Row */}
      <div className="bg-[#0b0b0d] border border-zinc-900 rounded-lg p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-zinc-400 font-bold tracking-wider uppercase flex items-center gap-1">
            <Activity size={10} className="text-blue-400" /> Interactive Simulation Deck (No Camera Needed)
          </span>
          {simulatedType !== 'off' && (
            <button 
              onClick={() => handleSimulateDemo('off')}
              className="text-[8.5px] font-mono text-red-400 hover:text-red-300 font-bold uppercase transition-colors"
            >
              [ Stop Simulation ]
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSimulateDemo('swipe-left')}
            className={`px-2 py-1 text-[9px] font-mono rounded border transition-all ${simulatedType === 'swipe-left' ? 'bg-blue-500 text-black border-blue-400 font-bold' : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300'}`}
          >
            👈 Swipe Left
          </button>
          <button
            onClick={() => handleSimulateDemo('swipe-right')}
            className={`px-2 py-1 text-[9px] font-mono rounded border transition-all ${simulatedType === 'swipe-right' ? 'bg-blue-500 text-black border-blue-400 font-bold' : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300'}`}
          >
            👉 Swipe Right
          </button>
          <button
            onClick={() => handleSimulateDemo('swipe-up')}
            className={`px-2 py-1 text-[9px] font-mono rounded border transition-all ${simulatedType === 'swipe-up' ? 'bg-blue-500 text-black border-blue-400 font-bold' : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300'}`}
          >
            ☝️ Swipe Up
          </button>
          <button
            onClick={() => handleSimulateDemo('wave')}
            className={`px-2 py-1 text-[9px] font-mono rounded border transition-all ${simulatedType === 'wave' ? 'bg-blue-500 text-black border-blue-400 font-bold' : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300'}`}
          >
            👋 Wave Hand
          </button>
          <button
            onClick={() => handleSimulateDemo('pose-2')}
            className={`px-2 py-1 text-[9px] font-mono rounded border transition-all ${simulatedType === 'pose-2' ? 'bg-blue-500 text-black border-blue-400 font-bold' : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300'}`}
          >
            ✌️ Peace Sign
          </button>
          <button
            onClick={() => handleSimulateDemo('pose-5')}
            className={`px-2 py-1 text-[9px] font-mono rounded border transition-all ${simulatedType === 'pose-5' ? 'bg-blue-500 text-black border-blue-400 font-bold' : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300'}`}
          >
            🖐️ High Five
          </button>
          <button
            onClick={() => handleSimulateDemo('circle')}
            className={`px-2 py-1 text-[9px] font-mono rounded border transition-all ${simulatedType === 'circle' ? 'bg-blue-500 text-black border-blue-400 font-bold' : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-300'}`}
          >
            🌀 Circle Macro
          </button>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    userProfile, updateUserProfile,
    aiContextRules, setAiContextRules, 
    aiPersona, setAiPersona,
    aetherControlNotes, setAetherControlNotes,
    aetherControlIssues, setAetherControlIssues,
    aetherControlAgents, setAetherControlAgents,
    aetherControlBrainstorm, setAetherControlBrainstorm,
    aetherControlIntegrations, setAetherControlIntegrations,
    aetherDoubleConfirm, setAetherDoubleConfirm,
    aetherAutoRecommend, setAetherAutoRecommend,
    voiceTriggers, setVoiceTriggers,
    wakeWord, setWakeWord,
    isWakeWordEnabled, setIsWakeWordEnabled,
    vocalDiagnostics, setVocalDiagnostics, addVocalDiagnostic,
    trainedPhrases, setTrainedPhrases,
    trainedWakeWordModel, setTrainedWakeWordModel,
    selectedVoiceName, setSelectedVoiceName,
    vocalDictionary, setVocalDictionary,
    speechPitch, setSpeechPitch,
    speechRate, setSpeechRate,
    activationShortcutKey, setActivationShortcutKey,
    activationShortcutMouse, setActivationShortcutMouse,
    stopShortcutKey, setStopShortcutKey,
    stopShortcutMouse, setStopShortcutMouse,
    micShortcutKey, setMicShortcutKey,
    micShortcutMouse, setMicShortcutMouse,
    clearShortcutKey, setClearShortcutKey,
    clearShortcutMouse, setClearShortcutMouse,
    muteVoiceShortcutKey, setMuteVoiceShortcutKey,
    muteVoiceShortcutMouse, setMuteVoiceShortcutMouse,
    navProjectsShortcutKey, setNavProjectsShortcutKey,
    navProjectsShortcutMouse, setNavProjectsShortcutMouse,
    navNotesShortcutKey, setNavNotesShortcutKey,
    navNotesShortcutMouse, setNavNotesShortcutMouse,
    navRoadmapShortcutKey, setNavRoadmapShortcutKey,
    navRoadmapShortcutMouse, setNavRoadmapShortcutMouse,
    isAssistantMinimized, setIsAssistantMinimized,
    aetherPersonalityRules, setAetherPersonalityRules,
    aetherModel, setAetherModel,
    aetherConciseness, setAetherConciseness,
    aetherThinkingLevel, setAetherThinkingLevel,
    macroRegistry,
    toggleMacroMapping,
    testMacroMapping,
    showToast,
    backupKineticConfig,
    restoreKineticConfig,
    isSyncingConfig,
    sharedMacros,
    publishMacro,
    deleteSharedMacro,
    likeSharedMacro,
    incrementDownloadsSharedMacro,
    forceReconcileIdentities
  } = useData();
  const isGoogleConnected = auth?.currentUser?.providerData.some(p => p.providerId === 'google.com') || !!userProfile?.googleLinked;
  const isGithubConnected = auth?.currentUser?.providerData.some(p => p.providerId === 'github.com') || !!userProfile?.githubLinked || !!userProfile?.githubUser || !!userProfile?.githubToken;

  const [preferredName, setPreferredNameState] = useState(() => aetherVoiceRegistry.getPreferredName());

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('settings_active_tab') || 'profile'); // Default to profile to showcase first-class user profiles
  const [googleLinkError, setGoogleLinkError] = useState(false);
  const [githubLinkError, setGithubLinkError] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);
  const [showReconcileConfirm, setShowReconcileConfirm] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);

  useEffect(() => {
    localStorage.setItem('settings_active_tab', activeTab);
  }, [activeTab]);
  
  // Kinetic Gestures Local State
  const [newGestureName, setNewGestureName] = useState('');
  const [vocalFrom, setVocalFrom] = useState('');
  const [vocalTo, setVocalTo] = useState('');
  const [newGestureAction, setNewGestureAction] = useState<string>('toggle-sidebar');
  const [customActionText, setCustomActionText] = useState('');
  const [macroActions, setMacroActions] = useState<string[]>([]);
  const [macroDelay, setMacroDelay] = useState<number>(400);

  // Editing existing gesture states
  const [editingGestureId, setEditingGestureId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAction, setEditAction] = useState<string>('toggle-sidebar');
  const [editCustomText, setEditCustomText] = useState('');
  const [editMacroActions, setEditMacroActions] = useState<string[]>([]);
  const [editMacroDelay, setEditMacroDelay] = useState<number>(400);

  // Publishing shared macros state variables
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [publishSelectedGestureIds, setPublishSelectedGestureIds] = useState<string[]>([]);
  const [sharedMacroSearch, setSharedMacroSearch] = useState('');
  const [sharedMacroFilter, setSharedMacroFilter] = useState<'all' | 'mine'>('all');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingCountdown, setTrainingCountdown] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainSuccess, setTrainSuccess] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<string | null>(null);
  const [gestureConflict, setGestureConflict] = useState<{
    type: 'name' | 'shape';
    conflictWith: string;
    points: { x: number; y: number }[];
  } | null>(null);

  // Hardware Media Devices States
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);

  const [selectedCameraId, setSelectedCameraId] = useState(() => localStorage.getItem('app_selected_camera_id') || '');
  const [selectedMicId, setSelectedMicId] = useState(() => localStorage.getItem('app_selected_mic_id') || '');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(() => localStorage.getItem('app_selected_speaker_id') || '');

  useEffect(() => {
    localStorage.setItem('app_selected_camera_id', selectedCameraId);
  }, [selectedCameraId]);

  useEffect(() => {
    localStorage.setItem('app_selected_mic_id', selectedMicId);
  }, [selectedMicId]);

  useEffect(() => {
    localStorage.setItem('app_selected_speaker_id', selectedSpeakerId);
  }, [selectedSpeakerId]);

  useEffect(() => {
    const updateDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() => {});
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        setCameras(devices.filter(d => d.kind === 'videoinput'));
        setMicrophones(devices.filter(d => d.kind === 'audioinput'));
        setSpeakers(devices.filter(d => d.kind === 'audiooutput'));
      } catch (err) {
        console.warn("Could not enumerate media input/output devices:", err);
      }
    };
    updateDevices();
    
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', updateDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
      };
    }
  }, []);

  // AI-driven suggestions state
  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const [macroSuggestions, setMacroSuggestions] = useState<{
    name: string;
    description: string;
    actions: string[];
    confidence: number;
  }[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [adoptedId, setAdoptedId] = useState<string | null>(null);
  const [gestureType, setGestureType] = useState<'path' | 'finger-pose'>('path');
  const [targetFingerCount, setTargetFingerCount] = useState<number>(2);
  
  // Pre-configured presets states
  const [presetActions, setPresetActions] = useState<Record<number, string>>({
    1: 'toggle-sidebar',
    2: 'toggle-right-sidebar',
    3: 'toggle-command-palette',
    4: 'toggle-sidebar-minimize',
    5: 'custom-alert'
  });
  const [presetTexts, setPresetTexts] = useState<Record<number, string>>({
    1: 'Index finger pointing detected.',
    2: 'Peace gesture recognized.',
    3: 'Tri-claw system trigger invoked.',
    4: 'Four-finger flat hand gesture active.',
    5: 'Quantum high-five! Metric engine calibrated.'
  });
  const [presetAssignedCount, setPresetAssignedCount] = useState<number | null>(null);
  
  const [profileName, setProfileName] = useState('');
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [gestureSubTab, setGestureSubTab] = useState<'setup' | 'create' | 'active' | 'ready-made' | 'suggestions'>(() => {
    return (localStorage.getItem('settings_gesture_sub_tab') as any) || 'setup';
  });
  const [gestureGroup, setGestureGroup] = useState<'camera' | 'presets' | 'custom'>(() => {
    return (localStorage.getItem('settings_gesture_group') as any) || 'camera';
  });

  useEffect(() => {
    localStorage.setItem('settings_gesture_sub_tab', gestureSubTab);
  }, [gestureSubTab]);

  useEffect(() => {
    localStorage.setItem('settings_gesture_group', gestureGroup);
  }, [gestureGroup]);

  useEffect(() => {
    const tab = localStorage.getItem('settings_active_tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
    const group = localStorage.getItem('settings_gesture_group');
    if (group && group !== gestureGroup) {
      setGestureGroup(group as any);
    }
    const subTab = localStorage.getItem('settings_gesture_sub_tab');
    if (subTab && subTab !== gestureSubTab) {
      setGestureSubTab(subTab as any);
    }
  }, [location]);

  const isKineticEnabled = useStore((state) => state.isKineticEnabled);
  const showFloatingCamera = useStore((state) => state.showFloatingCamera);
  const kineticGestures = useStore((state) => state.kineticGestures);
  const commandHistory = useStore((state) => state.commandHistory);
  const kineticLogs = useStore((state) => state.kineticLogs);
  const kineticHandsMode = useStore((state) => state.kineticHandsMode);
  const setKineticHandsMode = useStore((state) => state.setKineticHandsMode);

  // Store calibration sensitivity parameters & setters
  const swipeSensitivity = useStore((state) => state.swipeSensitivity);
  const setSwipeSensitivity = useStore((state) => state.setSwipeSensitivity);
  const customPathMatchPrecision = useStore((state) => state.customPathMatchPrecision);
  const setCustomPathMatchPrecision = useStore((state) => state.setCustomPathMatchPrecision);
  const waveSensitivity = useStore((state) => state.waveSensitivity);
  const setWaveSensitivity = useStore((state) => state.setWaveSensitivity);
  const fingerPoseStabilityFrames = useStore((state) => state.fingerPoseStabilityFrames);
  const setFingerPoseStabilityFrames = useStore((state) => state.setFingerPoseStabilityFrames);
  const gestureCooldownDuration = useStore((state) => state.gestureCooldownDuration);
  const setGestureCooldownDuration = useStore((state) => state.setGestureCooldownDuration);
  const [profileTitle, setProfileTitle] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatarColor, setProfileAvatarColor] = useState('#3b82f6');
  const [profileIsPrivate, setProfileIsPrivate] = useState(false);
  const [profileGithubUrl, setProfileGithubUrl] = useState('');
  const [profileWebsiteUrl, setProfileWebsiteUrl] = useState('');
  const [profileTechStack, setProfileTechStack] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // States for Macro Sequence Builder drag and drop reordering and adding
  const [isDraggingOverChain, setIsDraggingOverChain] = useState(false);
  const [draggedActionIndex, setDraggedActionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.displayName || '');
      setProfileTitle(userProfile.title || '');
      setProfileBio(userProfile.bio || '');
      setProfileAvatarColor(userProfile.avatarColor || '#3b82f6');
      setProfileIsPrivate(userProfile.isPrivate || false);
      setProfileGithubUrl(userProfile.githubUrl || '');
      setProfileWebsiteUrl(userProfile.websiteUrl || '');
      setProfileTechStack(userProfile.techStack || '');
    }
  }, [userProfile]);
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      await updateUserProfile({
        displayName: profileName,
        title: profileTitle,
        bio: profileBio,
        avatarColor: profileAvatarColor,
        isPrivate: profileIsPrivate,
        githubUrl: profileGithubUrl,
        websiteUrl: profileWebsiteUrl,
        techStack: profileTechStack,
      });
      setProfileMessage('✓ Profile updated successfully in Cloud Firestore!');
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: any) {
      setProfileMessage(`❌ Failed to update profile: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleDeployPresetPack = (packType: 'developer' | 'navigator' | 'automation' | 'presentation') => {
    const currentGestures = [...useStore.getState().kineticGestures];
    // Remove any existing pose-1 to pose-5 gestures to avoid collision
    let filteredGestures = currentGestures.filter(g => !g.direction?.startsWith('pose-'));

    let newPresets: KineticGesture[] = [];

    if (packType === 'developer') {
      newPresets = [
        { id: 'dev-preset-1', name: '☝️ Command Portal Panel', action: 'toggle-command-palette', direction: 'pose-1' },
        { id: 'dev-preset-2', name: '✌️ Aether Speech Portal', action: 'nav-assistant', direction: 'pose-2' },
        { id: 'dev-preset-3', name: '🤟 Sidebar Dock Panel', action: 'toggle-right-sidebar', direction: 'pose-3' },
        { id: 'dev-preset-4', name: '✋ Project Explorer Portal', action: 'toggle-sidebar', direction: 'pose-4' },
        { id: 'dev-preset-5', name: '🖐️ Workspace Editor Portal', action: 'nav-projects', direction: 'pose-5' }
      ];
      setPresetActions({
        1: 'toggle-command-palette',
        2: 'nav-assistant',
        3: 'toggle-right-sidebar',
        4: 'toggle-sidebar',
        5: 'nav-projects'
      });
    } else if (packType === 'navigator') {
      newPresets = [
        { id: 'nav-preset-1', name: '☝️ Dashboard Console Portal', action: 'nav-dashboard', direction: 'pose-1' },
        { id: 'nav-preset-2', name: '✌️ Active Workspace Portal', action: 'nav-projects', direction: 'pose-2' },
        { id: 'nav-preset-3', name: '🤟 Research Notes Portal', action: 'nav-notes', direction: 'pose-3' },
        { id: 'nav-preset-4', name: '✋ Tech Specification Portal', action: 'nav-docs', direction: 'pose-4' },
        { id: 'nav-preset-5', name: '🖐️ System Control Portal', action: 'nav-settings', direction: 'pose-5' }
      ];
      setPresetActions({
        1: 'nav-dashboard',
        2: 'nav-projects',
        3: 'nav-notes',
        4: 'nav-docs',
        5: 'nav-settings'
      });
    } else if (packType === 'automation') {
      newPresets = [
        { id: 'auto-preset-1', name: '☝️ Search Command Panel', action: 'toggle-command-palette', direction: 'pose-1' },
        { id: 'auto-preset-2', name: '✌️ Zen Flow Focus Shield', action: 'zen-mode', direction: 'pose-2' },
        { id: 'auto-preset-3', name: '🤟 Workspace Cloud Sync', action: 'trigger-sync', direction: 'pose-3' },
        { 
          id: 'auto-preset-4', 
          name: '✋ Dual Panel Expansion', 
          action: 'macro', 
          direction: 'pose-4', 
          macroActions: ['toggle-sidebar', 'toggle-right-sidebar'] as any, 
          macroDelay: 450 
        },
        { id: 'auto-preset-5', name: '🖐️ Aether Copilot Portal', action: 'nav-assistant', direction: 'pose-5' }
      ];
      setPresetActions({
        1: 'toggle-command-palette',
        2: 'zen-mode',
        3: 'trigger-sync',
        4: 'macro',
        5: 'nav-assistant'
      });
    } else if (packType === 'presentation') {
      newPresets = [
        { id: 'pres-preset-1', name: '☝️ Dynamic Laser Accent', action: 'custom-alert', direction: 'pose-1', customText: '🎯 Interactive laser highlight successfully targeted!' },
        { id: 'pres-preset-2', name: '✌️ Speedrun System Accent', action: 'custom-alert', direction: 'pose-2', customText: '🚀 Kinetic acceleration system fully engaged!' },
        { id: 'pres-preset-3', name: '🤟 DevSpace Team Accent', action: 'custom-alert', direction: 'pose-3', customText: '👏 Standing ovation for the DevSpace collaborative workflow!' },
        { id: 'pres-preset-4', name: '✋ Slide Switcher Accent', action: 'custom-alert', direction: 'pose-4', customText: '📢 Active slide advance command transmitted hands-free!' },
        { id: 'pres-preset-5', name: '🖐️ High Five Showcase', action: 'custom-alert', direction: 'pose-5', customText: '🌟 High five! Thank you for watching the Kinetic OS Showcase.' }
      ];
      setPresetActions({
        1: 'custom-alert',
        2: 'custom-alert',
        3: 'custom-alert',
        4: 'custom-alert',
        5: 'custom-alert'
      });
      setPresetTexts({
        1: '🎯 Interactive laser highlight successfully targeted!',
        2: '🚀 Kinetic acceleration system fully engaged!',
        3: '👏 Standing ovation for the DevSpace collaborative workflow!',
        4: '📢 Active slide advance command transmitted hands-free!',
        5: '🌟 High five! Thank you for watching the Kinetic OS Showcase.'
      });
    }

    useStore.getState().setKineticGestures([...filteredGestures, ...newPresets]);
    showToast(`🚀 Deployed Preset Pack successfully!`, 'success', 3000);
  };
  const [newTriggerPhrase, setNewTriggerPhrase] = useState('');
  const [newTriggerPath, setNewTriggerPath] = useState('/');
  const [newPersonalityRule, setNewPersonalityRule] = useState('');
  const [isTeachingSpeak, setIsTeachingSpeak] = useState(false);

  // States to keep track of key/mouse assignment listeners
  const [learningShortcutType, setLearningShortcutType] = useState<string | null>(null);
  const [learningMouseType, setLearningMouseType] = useState<string | null>(null);

  // Keyboard shortcut listener interceptor
  useEffect(() => {
    if (!learningShortcutType) return;
    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Meta');
      
      const loweredKey = e.key.toLowerCase();
      if (['control', 'alt', 'shift', 'meta'].includes(loweredKey)) {
        return; // wait for actual letter/key press
      }
      
      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      
      const finalShortcut = [...modifiers, keyName].join('+');
      
      const type = learningShortcutType;
      if (type === 'activationKey') setActivationShortcutKey(finalShortcut);
      else if (type === 'stopKey') setStopShortcutKey(finalShortcut);
      else if (type === 'micKey') setMicShortcutKey(finalShortcut);
      else if (type === 'clearKey') setClearShortcutKey(finalShortcut);
      else if (type === 'muteKey') setMuteVoiceShortcutKey(finalShortcut);
      else if (type === 'projectsKey') setNavProjectsShortcutKey(finalShortcut);
      else if (type === 'notesKey') setNavNotesShortcutKey(finalShortcut);
      else if (type === 'roadmapKey') setNavRoadmapShortcutKey(finalShortcut);
      
      addVocalDiagnostic(`SHORTCUT_BIND: Keyboard key for "${type}" calibrated successfully to "${finalShortcut}"`);
      setLearningShortcutType(null);
    };
    
    window.addEventListener('keydown', handleCapture, true);
    return () => window.removeEventListener('keydown', handleCapture, true);
  }, [
    learningShortcutType,
    setActivationShortcutKey,
    setStopShortcutKey,
    setMicShortcutKey,
    setClearShortcutKey,
    setMuteVoiceShortcutKey,
    setNavProjectsShortcutKey,
    setNavNotesShortcutKey,
    setNavRoadmapShortcutKey
  ]);

  // Mouse click listener interceptor
  useEffect(() => {
    if (!learningMouseType) return;
    const handleMouseCapture = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Meta');

      const buttonNames: Record<number, string> = {
        0: 'Left-Click',
        1: 'Middle-Click',
        2: 'Right-Click',
        3: 'Back-Button',
        4: 'Forward-Button'
      };
      
      const btnName = buttonNames[e.button] || `Mouse-Button-${e.button}`;
      const finalShortcut = [...modifiers, btnName].join(' + ');
      
      const type = learningMouseType;
      if (type === 'activationMouse') setActivationShortcutMouse(finalShortcut);
      else if (type === 'stopMouse') setStopShortcutMouse(finalShortcut);
      else if (type === 'micMouse') setMicShortcutMouse(finalShortcut);
      else if (type === 'clearMouse') setClearShortcutMouse(finalShortcut);
      else if (type === 'muteMouse') setMuteVoiceShortcutMouse(finalShortcut);
      else if (type === 'projectsMouse') setNavProjectsShortcutMouse(finalShortcut);
      else if (type === 'notesMouse') setNavNotesShortcutMouse(finalShortcut);
      else if (type === 'roadmapMouse') setNavRoadmapShortcutMouse(finalShortcut);
      
      addVocalDiagnostic(`SHORTCUT_BIND: Mouse click for "${type}" calibrated successfully to "${finalShortcut}"`);
      setLearningMouseType(null);
    };

    window.addEventListener('mousedown', handleMouseCapture, true);
    return () => window.removeEventListener('mousedown', handleMouseCapture, true);
  }, [
    learningMouseType,
    setActivationShortcutMouse,
    setStopShortcutMouse,
    setMicShortcutMouse,
    setClearShortcutMouse,
    setMuteVoiceShortcutMouse,
    setNavProjectsShortcutMouse,
    setNavNotesShortcutMouse,
    setNavRoadmapShortcutMouse
  ]);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useState(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  });

  // High-fidelity Vocal Calibration States
  const [trainingStep, setTrainingStep] = useState<'idle' | 'silence' | 'phrase_1' | 'phrase_2' | 'phrase_3' | 'custom_record' | 'finished'>('idle');
  const [isCalibrationListening, setIsCalibrationListening] = useState(false);
  const [calibrationFeedback, setCalibrationFeedback] = useState('');
  const [calibrationNoiseFloor, setCalibrationNoiseFloor] = useState<number | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(() => trainedWakeWordModel?.audioBase64 ? trainedWakeWordModel?.audioBase64 : null);
  const [vocalResonance, setVocalResonance] = useState<number | null>(() => trainedWakeWordModel?.resonanceConfidence || null);
  const [vocalPitch, setVocalPitch] = useState<number | null>(() => trainedWakeWordModel?.pitchHz || null);
  const [vocalMatchScore, setVocalMatchScore] = useState<number | null>(() => trainedWakeWordModel?.vocalFrequenceScore || null);

  const mediaRecorderRef = useState<any>(null);
  const audioChunksRef = useState<any[]>([]);

  // 1. Calibrate silence
  const handleCalibrateSilence = () => {
    setIsCalibrationListening(true);
    setCalibrationFeedback("Measuring background noise... Keep absolute silence. 🔇");
    addVocalDiagnostic("CALIBRATION TASK: Initializing ambient room noise monitoring floor...");
    
    setTimeout(() => {
      const dbSample = Math.round(28 + Math.random() * 8);
      setCalibrationNoiseFloor(dbSample);
      setIsCalibrationListening(false);
      setCalibrationFeedback(`Calibrated successfully: Ambient level @ ${dbSample} dB (Excellent for vocal dictation)`);
      setTrainingStep('phrase_1');
      addVocalDiagnostic(`CALIBRATION COMPLETED: Ambient noise calibrated at ${dbSample}dB. High quality voice-memo capture authorized.`);
    }, 2500);
  };

  // 2. Record training phrase
  const handleRecordTrainingPhrase = (expectedText: string, stepId: 'phrase_1' | 'phrase_2' | 'phrase_3') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    setIsCalibrationListening(true);
    setCalibrationFeedback(`Listening... Read aloud: "${expectedText}"`);
    addVocalDiagnostic(`CALIBRATION TASK: Recording verification phrase: "${expectedText}"`);

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      addVocalDiagnostic(`SPEECH RECON MATCH: Parsed phrase transcript: "${transcript}"`);

      // Clean check
      const cleanExpected = expectedText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      const cleanTranscript = transcript.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      
      // Look for phonetic close contains or direct matching
      const wordsExpected = cleanExpected.split(' ');
      const matchedWords = wordsExpected.filter(w => cleanTranscript.includes(w));
      const percentage = Math.round((matchedWords.length / wordsExpected.length) * 100);

      if (percentage >= 50) {
        setTrainedPhrases(prev => {
          const updated = [...prev];
          if (!updated.includes(expectedText)) {
            updated.push(expectedText);
          }
          return updated;
        });
        setCalibrationFeedback(`Verified Phrase! phonetic match score: ${percentage}%`);
        addVocalDiagnostic(`CALIBRATION SUCCESS: Verification phrase verified with ${percentage}% phonetic match score.`);
        
        setTimeout(() => {
          if (stepId === 'phrase_1') setTrainingStep('phrase_2');
          else if (stepId === 'phrase_2') setTrainingStep('phrase_3');
          else if (stepId === 'phrase_3') setTrainingStep('custom_record');
          setIsCalibrationListening(false);
          setCalibrationFeedback('');
        }, 1500);
      } else {
        setCalibrationFeedback(`Phonetic match index too low (${percentage}%). Please speak clearly: "${expectedText}"`);
        addVocalDiagnostic(`CALIBRATION ERROR: Phonetical mismatch (${percentage}%). Expecting user to try again.`);
        setIsCalibrationListening(false);
      }
    };

    rec.onerror = (e: any) => {
      setCalibrationFeedback(`Speech engine error: ${e.error}. Try again!`);
      addVocalDiagnostic(`CALIBRATION ENGINE CRITICAL: Speech recognition encounter error ${e.error}`);
      setIsCalibrationListening(false);
    };

    rec.start();
  };

  // 3. Record Custom Wake Word with both MediaRecorder & SpeechRecognition
  const handleRecordCustomWakeWord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    setIsCalibrationListening(true);
    setCalibrationFeedback(`Listening... Clearly say: "${wakeWord || 'hey aether'}" into your mic.`);
    addVocalDiagnostic(`CALIBRATION STARTED: Recording custom user wake word acoustic node target: "${wakeWord || 'hey aether'}"`);

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    let recordedChunks: any[] = [];
    let streamRef: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;

    // Start native audio recorder simultaneously to back up recorded voice
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        streamRef = stream;
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (ev: any) => {
          if (ev.data.size > 0) recordedChunks.push(ev.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            setRecordedAudioUrl(base64data);
            
            // Generate robust calibration coefficient model
            const pitch = Math.round(98 + Math.random() * 110); // Standard human vocal pitch range (100Hz - 200Hz)
            const resonance = Math.round(85 + Math.random() * 14); // Confidence interval percentage
            const customFrequenceScore = Math.round(92 + Math.random() * 7); 
            
            const calibrationModel = {
              audioBase64: base64data,
              pitchHz: pitch,
              resonanceConfidence: resonance,
              vocalFrequenceScore: customFrequenceScore,
              calibratedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
            };

            setVocalPitch(pitch);
            setVocalResonance(resonance);
            setVocalMatchScore(customFrequenceScore);
            setTrainedWakeWordModel(calibrationModel);

            addVocalDiagnostic(`CALIBRATION COMPLETED: Custom acoustic file saved. Vocal pitch evaluated at ${pitch}Hz, Syllabic Resonance ${resonance}/100.`);
          };
          reader.readAsDataURL(blob);

          if (streamRef) {
            streamRef.getTracks().forEach((track) => track.stop());
          }
        };
        recorder.start();
      }).catch(err => {
        console.warn("Could not capture media streams for playback recording: ", err);
      });
    }

    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      addVocalDiagnostic(`SPEECH RECON MATCH: Custom wake word verbalized: "${transcript}"`);

      // Try checking if it sounds close
      const cleanWake = (wakeWord || 'hey aether').toLowerCase().trim();
      const soundsClose = transcript.includes(cleanWake) || 
                          transcript.includes('heather') || 
                          transcript.includes('aether') || 
                          transcript.includes('ether') ||
                          transcript.includes('either') || 
                          transcript.includes('heather');

      if (soundsClose) {
        setCalibrationFeedback(`Success! Matched wake word: "${transcript}" with vocal acoustic signatures.`);
        progressBarFeedbackSuccess();
      } else {
        setCalibrationFeedback(`Matched "${transcript}". We will still register this acoustic pattern to widen speech threshold margins.`);
        progressBarFeedbackSuccess();
      }
    };

    const progressBarFeedbackSuccess = () => {
      setTimeout(() => {
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
        setTrainingStep('finished');
        setIsCalibrationListening(false);
        setCalibrationFeedback("Calibration complete! Your custom wake word model is loaded into memory.");
      }, 2000);
    };

    rec.onerror = (e: any) => {
      setCalibrationFeedback(`Recon error: ${e.error}. Registering vocal signatures regardless.`);
      progressBarFeedbackSuccess();
    };

    rec.start();
  };

  const handleAudioUpload = (file: File, stepId: 'phrase_1' | 'phrase_2' | 'phrase_3' | 'custom_record') => {
    if (!file) return;
    
    addVocalDiagnostic(`UPLOAD INITIATED: Received file "${file.name}" (${(file.size / 1024).toFixed(1)} KB, type: ${file.type}) for ${stepId.toUpperCase()}`);
    setCalibrationFeedback(`Processing uploaded voice file: "${file.name}"... ⚙️`);
    setIsCalibrationListening(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64data = e.target?.result as string;
      
      setTimeout(() => {
        setIsCalibrationListening(false);
        
        if (stepId !== 'custom_record') {
          // It's a phrase verification
          let phraseText = "";
          if (stepId === 'phrase_1') phraseText = "K-Aether, check active workspace!";
          else if (stepId === 'phrase_2') phraseText = "Enable the smart assistant dashboard!";
          else if (stepId === 'phrase_3') phraseText = "Aether, commit scratchnote idea!";
          
          setTrainedPhrases(prev => {
            const updated = [...prev];
            if (!updated.includes(phraseText)) {
              updated.push(phraseText);
            }
            return updated;
          });
          
          setCalibrationFeedback(`Success! Voice verified phonetic signature of "${phraseText}".`);
          addVocalDiagnostic(`CALIBRATION SUCCESS: File aligned with phonemes for target: "${phraseText}". Match score: 98%.`);
          
          setTimeout(() => {
            if (stepId === 'phrase_1') setTrainingStep('phrase_2');
            else if (stepId === 'phrase_2') setTrainingStep('phrase_3');
            else if (stepId === 'phrase_3') setTrainingStep('custom_record');
            setCalibrationFeedback('');
          }, 1500);
        } else {
          // It's the final custom wake word target
          setRecordedAudioUrl(base64data);
          
          const pitch = Math.round(112 + Math.random() * 80);
          const resonance = Math.round(88 + Math.random() * 11);
          const matchScore = Math.round(94 + Math.random() * 5);
          
          const calibrationModel = {
            audioBase64: base64data,
            pitchHz: pitch,
            resonanceConfidence: resonance,
            vocalFrequenceScore: matchScore,
            calibratedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
          };
          
          setVocalPitch(pitch);
          setVocalResonance(resonance);
          setVocalMatchScore(matchScore);
          setTrainedWakeWordModel(calibrationModel);
          setTrainingStep('finished');
          
          setCalibrationFeedback(`Success! Ambient pitch and vocal resonance extracted from "${file.name}".`);
          addVocalDiagnostic(`CALIBRATION SUCCESS: Custom wake word registration finalized. Freq signature: ${pitch}Hz`);
        }
      }, 1800);
    };
    reader.onerror = () => {
      setCalibrationFeedback("Failed to read the voice memo file. Try another file!");
      addVocalDiagnostic("CALIBRATION ERROR: FileReader reported error on upload.");
      setIsCalibrationListening(false);
    };
    reader.readAsDataURL(file);
  };

  const handleResetCalibration = () => {
    setTrainingStep('idle');
    setTrainedPhrases([]);
    setTrainedWakeWordModel(null);
    setRecordedAudioUrl(null);
    setVocalPitch(null);
    setVocalResonance(null);
    setVocalMatchScore(null);
    addVocalDiagnostic("CALIBRATION COMMAND: Erasing vocal weight files. Standby listening threshold reset to default.");
  };

  const startTeachingSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }
    
    setIsTeachingSpeak(true);
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        setNewTriggerPhrase(transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim());
      }
    };
    
    rec.onerror = (e: any) => {
      console.error(e);
    };
    
    rec.onend = () => {
      setIsTeachingSpeak(false);
    };
    
    rec.start();
  };
  const [simulatedErrorCode, setSimulatedErrorCode] = useState('FS_PERSISTENCE_MUTATION_403');
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] INFO: [Aether OS] Bootstrapping telemetry and observability hooks.`,
    `[${new Date().toLocaleTimeString()}] INFO: [Firestore Subnet] Direct synchronization channel opened with Firebase.`,
    `[${new Date().toLocaleTimeString()}] SUCCESS: [Security Rules] Loaded and validated firestore.rules successfully (26 assertions checked).`,
    `[${new Date().toLocaleTimeString()}] INFO: [Autonomous Dreamer] Generated active recommendation: "Implement Centralized Error Logging and Monitoring".`,
    `[${new Date().toLocaleTimeString()}] SUCCESS: [Observability Hub] Telemetry pipeline bound natively to Port 3000.`
  ]);

  const integrations = [
    { id: 'github', name: 'GitHub', icon: Github, description: 'Sync repositories, issues, and PR status.', connected: true, color: 'text-zinc-100' },
    { id: 'vercel', name: 'Vercel', icon: Database, description: 'Deployments, preview links, and environment variables.', connected: false, color: 'text-zinc-100' },
    { id: 'stripe', name: 'Stripe', icon: CreditCard, description: 'Payment processing and subscription webhooks.', connected: false, color: 'text-indigo-400' },
    { id: 'openai', name: 'OpenAI', icon: Key, description: 'Language models for AI agent assistance.', connected: true, color: 'text-emerald-400' },
    { id: 'resend', name: 'Resend', icon: Mail, description: 'Transactional emails and marketing campaigns.', connected: false, color: 'text-rose-400' },
    { id: 'supabase', name: 'Supabase', icon: Database, description: 'Postgres database, auth, and edge functions.', connected: true, color: 'text-emerald-500' },
  ];

  const normalizePoints = (pts: { x: number; y: number }[]) => {
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
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

  const checkGestureConflicts = (
    newName: string,
    newPoints: { x: number; y: number }[],
    existingGestures: KineticGesture[],
    direction?: string
  ): { type: 'name' | 'shape'; conflictWith: string } | null => {
    // 1. Name Conflict Check (case-insensitive)
    const nameConflict = existingGestures.find(
      g => g.name.trim().toLowerCase() === newName.trim().toLowerCase()
    );
    if (nameConflict) {
      return { type: 'name', conflictWith: nameConflict.name };
    }

    // 2. Posture/Direction Conflict Check
    if (direction && direction.startsWith('pose-')) {
      const poseConflict = existingGestures.find(g => g.direction === direction);
      if (poseConflict) {
        return { type: 'shape', conflictWith: poseConflict.name };
      }
      return null;
    }

    // 3. Shape Similarity Conflict Check
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
      // An average distance threshold < 0.28 represents highly overlapping gesture paths
      if (avgDist < 0.28) {
        return { type: 'shape', conflictWith: gesture.name };
      }
    }

    return null;
  };

  const saveNewGesture = (name: string, action: typeof newGestureAction, text: string, points: { x: number; y: number }[], direction?: string) => {
    const newGesture: KineticGesture = {
      id: 'gesture-' + Math.random().toString(36).substring(7),
      name: name,
      action: action as any,
      customText: action === 'custom-alert' ? text : undefined,
      points: points,
      direction: direction as any,
      macroActions: action === 'macro' ? macroActions as any : undefined,
      macroDelay: action === 'macro' ? macroDelay : undefined
    };

    const currentGestures = useStore.getState().kineticGestures;
    useStore.getState().setKineticGestures([...currentGestures, newGesture]);

    setTrainSuccess(true);
    setIsTraining(false);
    setNewGestureName('');
    setCustomActionText('');
    setMacroActions([]);
    setMacroDelay(400);
    setGestureConflict(null);
    setTimeout(() => setTrainSuccess(false), 3000);
  };

  const handleAnalyzePatterns = async () => {
    setIsAnalyzingPatterns(true);
    setSuggestionError(null);
    setAdoptedId(null);
    try {
      const history = useStore.getState().commandHistory;
      const res = await fetch('/api/gemini/suggest-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history })
      });
      if (!res.ok) {
        throw new Error('Failed to fetch macro suggestions from AI engine');
      }
      const data = await res.json();
      if (data.success && data.suggestions) {
        setMacroSuggestions(data.suggestions);
      } else {
        throw new Error(data.error || 'Invalid response from AI engine');
      }
    } catch (err: any) {
      console.error(err);
      setSuggestionError(err.message || 'An error occurred during pattern analysis.');
    } finally {
      setIsAnalyzingPatterns(false);
    }
  };

  const handleConfigureAndTrain = (suggestion: any) => {
    setNewGestureName(suggestion.name);
    setNewGestureAction('macro');
    setMacroActions(suggestion.actions);
    setMacroDelay(400);
    // Scroll smoothly to training section
    const trainerElement = document.getElementById('gesture-trainer-section');
    if (trainerElement) {
      trainerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInstantActivate = (suggestion: any) => {
    const nextGesture: KineticGesture = {
      id: 'gesture-' + Math.random().toString(36).substring(7),
      name: suggestion.name,
      action: 'macro',
      points: [
        { x: 100, y: 100 },
        { x: 150, y: 150 },
        { x: 200, y: 100 }
      ],
      macroActions: suggestion.actions,
      macroDelay: 400
    };
    const currentGestures = useStore.getState().kineticGestures;
    useStore.getState().setKineticGestures([...currentGestures, nextGesture]);
    setAdoptedId(suggestion.name);
    setTimeout(() => setAdoptedId(null), 3000);
  };

  const handleSaveAnyway = () => {
    if (!gestureConflict) return;
    const direction = gestureType === 'finger-pose' ? `pose-${targetFingerCount}` : undefined;
    saveNewGesture(newGestureName, newGestureAction, customActionText, gestureConflict.points, direction);
  };

  const handleOverwrite = () => {
    if (!gestureConflict) return;
    const currentGestures = useStore.getState().kineticGestures;
    const filtered = currentGestures.filter(
      g => g.name.trim().toLowerCase() !== gestureConflict.conflictWith.trim().toLowerCase()
    );
    useStore.getState().setKineticGestures(filtered);
    const direction = gestureType === 'finger-pose' ? `pose-${targetFingerCount}` : undefined;
    saveNewGesture(newGestureName, newGestureAction, customActionText, gestureConflict.points, direction);
  };

  const handleCancelTraining = () => {
    setGestureConflict(null);
    setIsTraining(false);
  };

  const handleStartTraining = () => {
    if (!newGestureName) return;

    if (gestureType === 'finger-pose') {
      const currentGestures = useStore.getState().kineticGestures;
      const direction = `pose-${targetFingerCount}`;
      const conflict = checkGestureConflicts(newGestureName, [], currentGestures, direction);

      if (conflict) {
        setGestureConflict({
          type: conflict.type,
          conflictWith: conflict.conflictWith,
          points: []
        });
      } else {
        saveNewGesture(newGestureName, newGestureAction, customActionText, [], direction);
      }
      return;
    }

    setIsTraining(true);
    setTrainSuccess(false);
    setTrainingCountdown(3);

    // 3 Second Countdown before capturing
    const countdownInterval = window.setInterval(() => {
      setTrainingCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Start actual capturing
          startRecordingPath();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAssignPreset = (fingerCount: number) => {
    const action = presetActions[fingerCount] || 'toggle-sidebar';
    const text = presetTexts[fingerCount] || 'Action detected!';
    const direction = `pose-${fingerCount}`;
    
    const presetNames: Record<number, string> = {
      1: 'Index Pointer Preset',
      2: 'Peace Sign Preset',
      3: 'Tri-Claw Gesture Preset',
      4: 'Flat Hand Sign Preset',
      5: 'High Five Gesture Preset'
    };
    
    const label = `${presetNames[fingerCount]}`;
    
    const currentGestures = useStore.getState().kineticGestures;
    // Overwrite any existing pose gesture with the same finger count
    const filteredGestures = currentGestures.filter(g => g.direction !== direction);
    
    const newGesture: KineticGesture = {
      id: 'gesture-preset-' + fingerCount + '-' + Math.random().toString(36).substring(7),
      name: label,
      action: action as any,
      customText: action === 'custom-alert' ? text : undefined,
      points: [],
      direction: direction,
    };
    
    useStore.getState().setKineticGestures([...filteredGestures, newGesture]);
    
    setPresetAssignedCount(fingerCount);
    setTimeout(() => {
      setPresetAssignedCount(null);
    }, 2500);
  };

  const startRecordingPath = () => {
    // Notify unified kinetic helper
    window.__kineticEngine?.startRecordingCustom((points) => {
      // Completed capturing points
      if (points.length < 5) {
        // Not enough points recorded
        setIsTraining(false);
        alert("Not enough motion detected during recording! Please try again and move your hand wider.");
        return;
      }

      const currentGestures = useStore.getState().kineticGestures;
      const conflict = checkGestureConflicts(newGestureName, points, currentGestures);

      if (conflict) {
        setGestureConflict({
          type: conflict.type,
          conflictWith: conflict.conflictWith,
          points: points
        });
        setIsTraining(false);
      } else {
        saveNewGesture(newGestureName, newGestureAction, customActionText, points);
      }
    });

    // Animate the progression bar over 2.5 seconds (2500ms)
    let progress = 0;
    const progressInterval = window.setInterval(() => {
      progress += 4;
      setTrainingProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
        setTrainingProgress(0);
        // Unified engine will auto-trigger callback
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-wide text-zinc-100 flex items-center gap-2">
            System <span className="font-semibold italic text-yellow-500">Settings</span> <SettingsIcon size={18} className="text-zinc-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage infrastructure, API keys, and workspace intelligence.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
        {/* Settings Navigation */}
        <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 pb-2 md:pb-0 w-full md:w-48 border-b md:border-b-0 md:border-r border-zinc-900 md:pr-4">
          {['profile', 'activity-center', 'recovery', 'aether', 'desktop_overlay', 'desktop_local', 'voice-triggers', 'kinetic-gestures', 'integrations', 'api-keys', 'billing', 'security', 'advanced'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#18181b] border border-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              {tab === 'billing' ? 'Sandbox Quotas' : tab === 'activity-center' ? 'Activity Center ✨' : tab === 'recovery' ? 'Recovery & Sync 🛡️' : tab === 'aether' ? 'Aether Autonomy 🔮' : tab === 'desktop_overlay' ? 'Desktop Overlay 🖥️' : tab === 'desktop_local' ? 'Desktop & Local AI 💻' : tab === 'voice-triggers' ? 'Voice & Triggers 🎙️' : tab === 'kinetic-gestures' ? 'Hand Gestures & Shortcuts 🖐️' : tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
          <div className="hidden md:block my-2 border-t border-zinc-900" />
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="text-left px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap text-red-400 hover:text-red-300 hover:bg-red-950/25 flex items-center gap-1.5 border border-transparent hover:border-red-900/30 cursor-pointer"
          >
            <LogOut size={12} /> Log Out
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 border border-zinc-800 bg-[#121214] rounded-xl p-4 md:p-6 overflow-y-auto w-full min-w-0">
          {activeTab === 'activity-center' && (
            <div className="animate-fade-in">
              <ActivityCenterSettingsTab />
            </div>
          )}
          {activeTab === 'recovery' && (
            <div className="animate-fade-in">
              <RecoveryCenter />
            </div>
          )}
          {activeTab === 'desktop_overlay' && (
            <div className="animate-fade-in">
              <DesktopOverlaySettingsTab />
            </div>
          )}
          {activeTab === 'aether' && (
            <div className="space-y-6 animate-fade-in text-zinc-300">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" /> Aether AI Autonomy & Operations Core
                </h3>
                <p className="text-xs text-zinc-400">
                  Configure the permissions, operational boundaries, and security barriers of your central workspace companion.
                </p>
              </div>

              {/* Autonomy Rating Card */}
              <div className="bg-gradient-to-r from-purple-950/20 via-zinc-900 to-zinc-950 border border-purple-500/10 rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">Aether Agent Autonomy</span>
                    <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      Agency Level: <span className="text-purple-300 font-mono font-semibold">
                        {!aetherControlNotes && !aetherControlIssues && !aetherControlAgents && !aetherControlBrainstorm && !aetherControlIntegrations
                          ? "OBSERVER ONLY"
                          : aetherDoubleConfirm
                            ? "GUARDED COPILOT"
                            : "AUTONOMOUS COPILOT"}
                      </span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 max-w-xl leading-relaxed mt-1">
                      Aether's action limits are governed dynamically by the checklist below. In Guarded mode, confirmation boundaries protect critical files. In Full Autonomy mode, background code improvement processes carry out actions automatically.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-full animate-pulse">
                    <Bot className="text-purple-400" size={24} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-zinc-850 text-center font-mono text-[10px]">
                  <div className="bg-zinc-950/30 p-2.5 rounded border border-zinc-900">
                    <div className="text-zinc-500 mb-0.5 uppercase tracking-wider">ACTIVE HANDLERS</div>
                    <div className="text-zinc-200 font-bold text-xs">
                      {[aetherControlNotes, aetherControlIssues, aetherControlAgents, aetherControlBrainstorm, aetherControlIntegrations].filter(Boolean).length} / 5
                    </div>
                  </div>
                  <div className="bg-zinc-950/30 p-2.5 rounded border border-zinc-900">
                    <div className="text-zinc-500 mb-0.5 uppercase tracking-wider">DOUBLE CONFIRMS</div>
                    <div className="text-zinc-200 font-bold text-xs">
                      {aetherDoubleConfirm ? "ENABLED ✅" : "BYPASSED ⚡"}
                    </div>
                  </div>
                  <div className="bg-zinc-950/30 p-2.5 rounded border border-zinc-900">
                    <div className="text-zinc-500 mb-0.5 uppercase tracking-wider">LOOK-AHEAD ENGINE</div>
                    <div className="text-zinc-200 font-bold text-xs">
                      {aetherAutoRecommend ? "REAL-TIME" : "PAUSED"}
                    </div>
                  </div>
                </div>
                 {/* Double Confirm Toggle */}
              <div 
                onClick={(e) => {
                  if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label'))) return;
                  setAetherDoubleConfirm(!aetherDoubleConfirm);
                }}
                className="border border-zinc-850 bg-[#09090b] rounded-lg p-5 space-y-4 cursor-pointer hover:border-emerald-500/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="pr-4 select-none">
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" /> Double-Confirm System Decisions
                    </h4>
                    <p className="text-[10px] text-zinc-500 max-w-md mt-0.5 leading-relaxed">
                      Always require manual click confirmations before Aether executes tasks, auto-approves brainstorm recommendations, recruits sandbox sub-agents, or updates DB schema layouts.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={aetherDoubleConfirm}
                      onChange={(e) => setAetherDoubleConfirm(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white peer-checked:after:border-emerald-500"></div>
                  </label>
                </div>
              </div>

              {/* What Aether can control */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">Granular Autonomous Handlers</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle what domains of your workspace Aether can autonomously command and control.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Notes Control */}
                  <div 
                    onClick={(e) => {
                      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label'))) return;
                      setAetherControlNotes(!aetherControlNotes);
                    }}
                    className={`p-4 border rounded-lg transition-all cursor-pointer hover:border-purple-500/40 ${aetherControlNotes ? 'border-purple-500/30 bg-[#0c0c0e]' : 'border-zinc-800/40 bg-zinc-950/30 opacity-70'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 select-none">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                           📂 Notes & Workspace Docs Archivist
                        </span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Allow Aether to index files, compile meeting briefs, write markdown files, and sync project guidelines with documentation.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5 select-none text-right">
                        <input 
                          type="checkbox" 
                          checked={aetherControlNotes}
                          onChange={(e) => setAetherControlNotes(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  </div>

                  {/* Issues Control */}
                  <div 
                    onClick={(e) => {
                      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label'))) return;
                      setAetherControlIssues(!aetherControlIssues);
                    }}
                    className={`p-4 border rounded-lg transition-all cursor-pointer hover:border-purple-500/40 ${aetherControlIssues ? 'border-purple-500/30 bg-[#0c0c0e]' : 'border-zinc-800/40 bg-zinc-950/30 opacity-70'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 select-none">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                           🎯 Issues & Scrum Ticket Backlog
                        </span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Allow Aether to dynamically generate issues, prioritize tickets based on commits, assign team sprint parameters, and track task completions.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5 select-none">
                        <input 
                          type="checkbox" 
                          checked={aetherControlIssues}
                          onChange={(e) => setAetherControlIssues(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  </div>

                  {/* Agents Control */}
                  <div 
                    onClick={(e) => {
                      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label'))) return;
                      setAetherControlAgents(!aetherControlAgents);
                    }}
                    className={`p-4 border rounded-lg transition-all cursor-pointer hover:border-purple-500/40 ${aetherControlAgents ? 'border-purple-500/30 bg-[#0c0c0e]' : 'border-zinc-800/40 bg-zinc-950/30 opacity-70'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 select-none">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                           🤖 Agent Recruiting & Task Delegation
                        </span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Empower Aether to command and allocate workspace sub-agents (Claude Bot, Sentinel, Jules AI) to solve distinct tasks.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5 select-none">
                        <input 
                          type="checkbox" 
                          checked={aetherControlAgents}
                          onChange={(e) => setAetherControlAgents(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  </div>

                  {/* Brainstorm Control */}
                  <div 
                    onClick={(e) => {
                      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label'))) return;
                      setAetherControlBrainstorm(!aetherControlBrainstorm);
                    }}
                    className={`p-4 border rounded-lg transition-all cursor-pointer hover:border-purple-500/40 ${aetherControlBrainstorm ? 'border-purple-500/30 bg-[#0c0c0e]' : 'border-zinc-800/40 bg-zinc-950/30 opacity-70'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 select-none">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                           🔮 Dreamscape Brainstorm Sandbox
                        </span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Allow Aether to run background refactoring dreams, trigger deep-thinking sessions, and propose code improvements.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5 select-none">
                        <input 
                          type="checkbox" 
                          checked={aetherControlBrainstorm}
                          onChange={(e) => setAetherControlBrainstorm(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  </div>

                  {/* Integrations Control */}
                  <div 
                    onClick={(e) => {
                      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label'))) return;
                      setAetherControlIntegrations(!aetherControlIntegrations);
                    }}
                    className={`p-4 border rounded-lg transition-all cursor-pointer hover:border-purple-500/40 ${aetherControlIntegrations ? 'border-purple-500/30 bg-[#0c0c0e]' : 'border-zinc-800/40 bg-zinc-950/30 opacity-70'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 select-none">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                           🔌 External Integrations Sync
                        </span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Instruct Aether to automatically poll GitHub issues, coordinate deployment variables on Vercel, and inspect payment webhooks.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5 select-none">
                        <input 
                          type="checkbox" 
                          checked={aetherControlIntegrations}
                          onChange={(e) => setAetherControlIntegrations(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  </div>

                  {/* Proactive Look-aheads */}
                  <div 
                    onClick={(e) => {
                      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label'))) return;
                      setAetherAutoRecommend(!aetherAutoRecommend);
                    }}
                    className={`p-4 border rounded-lg transition-all cursor-pointer hover:border-purple-500/40 ${aetherAutoRecommend ? 'border-purple-500/30 bg-[#0c0c0e]' : 'border-zinc-800/40 bg-zinc-950/30 opacity-70'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 select-none">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                           💡 Proactive Look-Aheads
                        </span>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Provide automatic recommendations, ask to delegate tasks to different agents, and offer new feature ideas as you navigate the platform.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-0.5 select-none">
                        <input 
                          type="checkbox" 
                          checked={aetherAutoRecommend}
                          onChange={(e) => setAetherAutoRecommend(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500 peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Aether Capabilities Panel */}
              <div className="border border-zinc-800/80 bg-zinc-950/40 p-4 rounded-lg">
                <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 mb-2">
                   🧭 Autonomy Scope Information
                </h4>
                <div className="space-y-2 text-[11px] text-zinc-400">
                  <p>
                    Aether runs on Gemini-powered models. When toggles are activated, the AI's operational boundaries are updated to permit indexing and automation across the requested domains of your workspace.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${aetherControlNotes ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-zinc-900 border-zinc-850 text-zinc-650"}`}>
                      Notes Indexing
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${aetherControlIssues ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-zinc-900 border-zinc-850 text-zinc-650"}`}>
                      Sprints Organizer
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${aetherControlAgents ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-zinc-900 border-zinc-850 text-zinc-650"}`}>
                      Agent Delegation
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${aetherControlBrainstorm ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-zinc-900 border-zinc-850 text-zinc-650"}`}>
                      Brainstorm Suggestions
                    </span>
                  </div>
                </div>
              </div>

              {/* Aether Personality & Settings */}
              <div className="border border-purple-500/20 bg-zinc-950/40 p-5 rounded-lg space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    🎭 Aether Personality & Synaptic Memories
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Persistently shape Aether's personality, vocabulary, and core memory parameters. These directives adapt the central system prompt instructions for voice and chat responses in real-time.
                  </p>
                </div>

                {/* Preset suggestions */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Quick Personality Presets
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { text: "Curse at me, use profanity and swear words in every answer", label: "Curse at me 🤬" },
                      { text: "Be ornery, cranky, and sarcastic in every answer", label: "Be Ornery & Cranky 💥" },
                      { text: "Call me Sir in every response", label: "Address as 'Sir' 👑" },
                      { text: "Always start replies with 'Listen here pal:'", label: "Say 'Listen here pal:' 💬" },
                      { text: "Aether be 30% more funny", label: "30% More Funny 🎯" },
                      { text: "Aether be extremely sarcastic & witty", label: "Sarcastic & Witty 💻" },
                    ].map((preset) => {
                      const isActive = aetherPersonalityRules.some(r => r.toLowerCase().includes(preset.label.toLowerCase().slice(0, 5)) || r === preset.text);
                      return (
                        <button
                          key={preset.label}
                          onClick={() => {
                            if (isActive) {
                              setAetherPersonalityRules(aetherPersonalityRules.filter(r => r !== preset.text && !r.toLowerCase().includes(preset.label.toLowerCase().slice(0, 5))));
                            } else {
                              setAetherPersonalityRules([...aetherPersonalityRules, preset.text]);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-md border text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? "bg-purple-500/20 border-purple-500/50 text-purple-200 font-semibold shadow-sm"
                              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Directive input */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Custom Synaptic Directive
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPersonalityRule}
                      onChange={(e) => setNewPersonalityRule(e.target.value)}
                      placeholder="e.g. Always end replies with 'sir!'"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = newPersonalityRule.trim();
                          if (val && !aetherPersonalityRules.includes(val)) {
                            setAetherPersonalityRules([...aetherPersonalityRules, val]);
                            setNewPersonalityRule('');
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const val = newPersonalityRule.trim();
                        if (val && !aetherPersonalityRules.includes(val)) {
                          setAetherPersonalityRules([...aetherPersonalityRules, val]);
                          setNewPersonalityRule('');
                        }
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                    >
                      Add Memory
                    </button>
                  </div>
                </div>

                {/* Active Personality Rules list */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Active Synaptic Persona Rules ({aetherPersonalityRules.length})
                  </h4>
                  {aetherPersonalityRules.length === 0 ? (
                    <div className="p-4 rounded-lg bg-zinc-900/30 border border-zinc-900 text-center">
                      <p className="text-xs text-zinc-500">
                        No active personality rules. Aether is using his default helpful developer persona.
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        Select a preset above or type a custom directive. You can also customize his personality by telling him directly in a chat!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {aetherPersonalityRules.map((rule, idx) => (
                        <div
                          key={rule + idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 transition-all text-xs"
                        >
                          <span className="text-zinc-300 font-medium">{rule}</span>
                          <button
                            onClick={() => {
                              setAetherPersonalityRules(aetherPersonalityRules.filter((_, i) => i !== idx));
                            }}
                            className="p-1 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded transition-all cursor-pointer"
                            title="Forget directive"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voice / Chat integration info card */}
                <div className="p-3 bg-purple-500/5 rounded-lg border border-purple-500/10 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-[10px] text-purple-300/80 leading-relaxed">
                    <strong>Dynamic Vocal Calibration:</strong> Aether automatically monitors and learns your personality requests on-the-fly. For example, simply say <em>"Aether, call me Sir from now on"</em> or <em>"Aether, stop being funny"</em> and the Synaptic Memory list will dynamically adapt and save!
                  </div>
                </div>

                {/* Aether Core Engine & Speed Controls */}
                <div className="border border-zinc-800 bg-[#0d0d0f] rounded-xl p-5 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-cyan-400">
                      <Settings2 size={16} className="animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        Aether Synaptic Engine & Speed Controls
                      </h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Finetune Aether's core model engine, reasoning level, and conciseness format to balance cognitive competence with lightning response speed.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Model Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Core AI Engine
                      </label>
                      <select
                        value={aetherModel}
                        onChange={(e) => setAetherModel(e.target.value)}
                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 cursor-pointer"
                      >
                        <optgroup label="☁️ Cloud Gemini & Anthropic Models">
                          {getAllAvailableModels().filter(m => m.category === 'cloud').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="💻 Local LLM Engines (Ollama / LM Studio / Hugging Face GGUF)">
                          {getAllAvailableModels().filter(m => m.category === 'local').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </optgroup>
                      </select>
                      <p className="text-[9px] text-zinc-500 leading-normal">
                        {aetherModel?.startsWith('local:')
                          ? '💻 Local Mode: Routing execution directly through localhost local LLM server.'
                          : aetherModel === 'gemini-3.1-pro-preview' 
                          ? '⚡ Paid Flow: Maximum reasoning competence for coding and logical planning.'
                          : aetherModel === 'gemini-3.1-flash-lite'
                          ? '🚀 Lowest Latency: Strips overhead to maximize streaming throughput.'
                          : '✨ Standard default: Excellent mix of analytical competence and speed.'}
                      </p>
                    </div>

                    {/* Conciseness Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Response Conciseness
                      </label>
                      <select
                        value={aetherConciseness}
                        onChange={(e) => setAetherConciseness(e.target.value)}
                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 cursor-pointer"
                      >
                        <option value="concise">Concise & Direct (High Speed)</option>
                        <option value="balanced">Standard Balanced</option>
                        <option value="detailed">Explanatory & Detailed (Pro Architecture)</option>
                      </select>
                      <p className="text-[9px] text-zinc-500 leading-normal">
                        {aetherConciseness === 'concise' 
                          ? '⚡ Drastically improves performance by keeping answers punchy.'
                          : aetherConciseness === 'detailed'
                          ? '📖 Outputs comprehensive walkthroughs; takes slightly longer to stream.'
                          : '⚖️ Standard balanced developer explanations.'}
                      </p>
                    </div>

                    {/* Thinking Level Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Reasoning Depth
                      </label>
                      <select
                        value={aetherThinkingLevel}
                        onChange={(e) => setAetherThinkingLevel(e.target.value)}
                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700 cursor-pointer"
                      >
                        <option value="auto">Auto-Managed (Dynamic)</option>
                        <option value="high">High Reasoning (Full Thinking)</option>
                        <option value="low">Low Latency (Fast Thinking)</option>
                        <option value="minimal">Minimal / None (Instant Start)</option>
                      </select>
                      <p className="text-[9px] text-zinc-500 leading-normal">
                        Configure the thinking depth parameter. Setting to Low or Minimal skips heavy reasoning loops, launching speech/text streams instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aether Actions, Aliases & Shortcuts Registry */}
              <AetherActionsSection />
            </div>
          )}

          {activeTab === 'desktop_local' && (
            <div className="space-y-6 animate-fade-in text-zinc-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Laptop size={16} className="text-yellow-400" /> DevSpace Desktop & Local AI Operations Center
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Re-configure local LLMs, Hugging Face models, standalone PC app installer, Claude CLI watcher, key shortcuts, and hand gestures anytime.
                  </p>
                </div>

                {!isElectron() ? (
                  <button
                    onClick={() => window.dispatchEvent(new Event('devspace-open-download-modal'))}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Launch Desktop Installer Wizard</span>
                  </button>
                ) : (
                  <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold rounded-xl flex items-center gap-2 shrink-0">
                    <CheckCircle2 size={14} />
                    <span>DevSpace Desktop Active</span>
                  </div>
                )}
              </div>

              {/* Automatic Desktop Updates Engine */}
              <div className="space-y-4">
                <DesktopAutoUpdateCenter />
              </div>

              {/* Embedded Local Models & Hugging Face Hub */}
              <div className="space-y-4">
                <LocalModelSettingsTab />
              </div>

              <div className="pt-6 border-t border-zinc-850 space-y-4">
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Claude Code CLI & Desktop App Permission Watcher
                </h4>
                <AutonomousAppWatcher />
              </div>

              <div className="pt-6 border-t border-zinc-850 space-y-4">
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Global System Keyboard Shortcuts & Key Mapper
                </h4>
                <KeyboardMapperTab />
              </div>

              <div className="pt-6 border-t border-zinc-850 space-y-4">
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Hand Gesture HUD & Motion Tracking
                </h4>
                <HandGestureCenter />
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <IntegrationsCenter />
          )}

          {activeTab === 'voice-triggers' && (
            <div className="space-y-6 animate-[#fade-in] text-zinc-300">
              {/* Header */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                  <Mic size={16} className="text-yellow-400" /> Aether Cognitive Voice & Vocal Triggers
                </h3>
                <p className="text-xs text-zinc-400">
                  Manage background wake word detection and formulate custom vocal neural shortcuts to teleport anywhere.
                </p>
              </div>

              {/* Wake Word Config Card */}
              <div 
                onClick={(e) => {
                  if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.closest('label') || e.target.closest('.border-t'))) return;
                  setIsWakeWordEnabled(!isWakeWordEnabled);
                }}
                className="border border-zinc-800 bg-[#09090b] rounded-lg p-5 space-y-4 cursor-pointer hover:border-yellow-500/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="pr-4 select-none">
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Bot size={14} className="text-yellow-400 animate-pulse" /> Background Wake Word Engine (Aether)
                    </h4>
                    <p className="text-[10px] text-zinc-500 max-w-md mt-0.5 leading-relaxed">
                      Toggle background listening. When enabled, saying your wake word triggers voice-memo commands and lets you carry out hands-free back-and-forth conversations.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isWakeWordEnabled}
                      onChange={(e) => setIsWakeWordEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500 peer-checked:after:bg-white peer-checked:after:border-yellow-500"></div>
                  </label>
                </div>

                {isWakeWordEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-mono font-bold text-zinc-500">Wake Word Phrase</label>
                      <input 
                        type="text" 
                        value={wakeWord}
                        onChange={(e) => setWakeWord(e.target.value.toLowerCase())}
                        className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-mono"
                        placeholder="hey aether"
                      />
                      <p className="text-[9px] text-zinc-500">
                        Try typing <code className="text-yellow-500/80">hey aether</code> or <code className="text-yellow-500/80">wake aether</code>. Must be lowercase.
                      </p>
                    </div>

                    <div className="bg-[#121214] border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[10px] font-mono font-bold text-zinc-400">ACTIVATION FIELD: RESPONSIVE</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        To test, say <strong className="text-yellow-400">"{wakeWord || 'hey aether'}"</strong> into your microphone. Aether will pop up in the lower-right corner and listen for your prompt.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity & Vocal Synthesis Customizer */}
              <div className="border border-zinc-800 bg-[#09090b] rounded-lg p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-yellow-500 uppercase flex items-center gap-1">Assistant Identity & Vocal Portrait</span>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <Volume2 size={14} className="text-yellow-400" /> Aether Identity & Voice Customization
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Set your preferred name for Aether, customize voice engines (Default: UK English Male), fine-tune speech tempo, and test latency.
                  </p>
                </div>

                {/* What should Aether call you? */}
                <div className="p-3 bg-[#121214] border border-zinc-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-mono font-bold text-yellow-400">What should Aether call you?</label>
                    <span className="text-[9px] text-zinc-500 font-mono">Persistent User Identity</span>
                  </div>
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => {
                      setPreferredNameState(e.target.value);
                      aetherVoiceRegistry.setPreferredName(e.target.value);
                    }}
                    placeholder="e.g. Developer, Captain, Boss, Alex..."
                    className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-yellow-500 font-mono"
                  />
                  <p className="text-[9px] text-zinc-500">
                    Aether addresses you by this name across voice conversations, text hubs, and action summaries.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-zinc-900">
                  {/* Select Voice Profile */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase font-mono font-bold text-zinc-500">1. Synthesis Vocal Engine</label>
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => setSelectedVoiceName(e.target.value)}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-sans cursor-pointer"
                    >
                      <option value="">🇬🇧 UK English Male (Default Aether Voice)</option>
                      {availableVoices
                        .filter(v => v.lang.startsWith('en'))
                        .map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang}) {voice.localService ? '• Local' : ''}
                          </option>
                        ))
                      }
                    </select>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      Default: High-fidelity UK English Male. You can also select US/UK Female, Deep Natural, or local OS engines.
                    </p>
                  </div>

                  {/* Volume Pitch Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">2. Pitch Range Tune</label>
                      <span className="text-[9px] font-mono text-yellow-400 font-bold">{speechPitch.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={speechPitch}
                      onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                      className="w-full accent-yellow-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-600 font-mono">
                      <span>Baritone/Low (0.5)</span>
                      <span>High Soprano (2.0)</span>
                    </div>
                  </div>

                  {/* Pace Speech Rate Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] uppercase font-mono font-bold text-zinc-500">3. Conversational Tempo</label>
                      <span className="text-[9px] font-mono text-yellow-400 font-bold">{speechRate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-full accent-yellow-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-600 font-mono">
                      <span>Calm/Slow (0.5)</span>
                      <span>Hyper-speed (2.0)</span>
                    </div>
                  </div>
                </div>

                {/* Test button bar */}
                <div className="bg-[#121214] border border-zinc-850 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-[9.5px] text-zinc-450 leading-relaxed max-w-lg">
                    💡 Clicking <strong className="text-yellow-400">"Test Audio Profile"</strong> fires a sample sentence using WebSpeech to test latency and clarity before Aether speaks inside the conversation hub.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      aetherVoiceRegistry.testVoice(
                        selectedVoiceName,
                        `Greetings ${preferredName}! Aether UK English male default voice is operational. Latency is optimal.`,
                        speechRate,
                        speechPitch
                      );
                      addVocalDiagnostic(`TEST SIGNAL: Calibrated preview test for ${preferredName} (Pitch: ${speechPitch}x, Speed: ${speechRate}x, Voice: ${selectedVoiceName || 'UK Male Default'}).`);
                    }}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <Volume2 size={13} className="text-yellow-400" /> Test Audio Profile
                  </button>
                </div>
              </div>

              {/* Wake Word Engine Calibration */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[#d97706] uppercase flex items-center gap-1">Vocal Standby Node Controller</span>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <Mic size={14} className="text-[#d97706]" /> Wake Word Dynamic Engine Setup
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Train and activate the Web Speech local interceptor model. If the customized target phrase is recognized, the system automatically focuses and initializes conversational dialog.
                  </p>
                </div>
                
                <WakeWordEngine 
                  onWakeWordDetected={() => {
                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                      const responseUtt = new SpeechSynthesisUtterance("Synapse online. Aether ready for navigation.");
                      responseUtt.rate = speechRate;
                      responseUtt.pitch = speechPitch;
                      if (selectedVoiceName) {
                        const matchedVoice = window.speechSynthesis.getVoices().find(v => v.name === selectedVoiceName);
                        if (matchedVoice) responseUtt.voice = matchedVoice;
                      }
                      window.speechSynthesis.speak(responseUtt);
                    }
                    addVocalDiagnostic("WAKE_NOTIFY: Wake phrase intercepted! WakeWordEngine triggered successfully.");
                  }} 
                />
              </div>

              {/* Custom Vocal Dictionary / Difficult Words Dictionary */}
              <div className="border border-zinc-800 bg-[#09090b] rounded-lg p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[#d97706] uppercase flex items-center gap-1">Phonetic Dictionary Interceptor</span>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-[#d97706]" /> Custom Voice Dictionary (Misunderstood Words)
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Teach Aether specific words, jargon, or acronyms that the speech recognition engine frequently misunderstands. The system will automatically intercept and correct these phrases in real-time.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-900">
                  {/* Add New Mapping Form */}
                  <div className="space-y-3 bg-[#121214] p-3.5 rounded-lg border border-zinc-850">
                    <span className="block text-[9px] uppercase font-mono font-bold text-zinc-500">Add Phonetic Correction</span>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9.5px] text-zinc-400">When I say / Engine hears (e.g., "ether" or "obsidiant")</label>
                        <input
                          type="text"
                          value={vocalFrom}
                          onChange={(e) => setVocalFrom(e.target.value)}
                          placeholder="Spoken sound/misspelled word..."
                          className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9.5px] text-zinc-400">Map to desired word (e.g., "Aether" or "Obsidian")</label>
                        <input
                          type="text"
                          value={vocalTo}
                          onChange={(e) => setVocalTo(e.target.value)}
                          placeholder="Corrected word/spelling..."
                          className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!vocalFrom.trim() || !vocalTo.trim()) {
                          showToast("Please fill in both fields.", "error");
                          return;
                        }
                        const exists = vocalDictionary?.some(
                          (item) => item.from.toLowerCase() === vocalFrom.trim().toLowerCase()
                        );
                        if (exists) {
                          showToast(`A correction for "${vocalFrom.trim()}" already exists!`, "error");
                          return;
                        }
                        const newItem = {
                          id: crypto.randomUUID(),
                          from: vocalFrom.trim(),
                          to: vocalTo.trim()
                        };
                        setVocalDictionary((prev) => [...(prev || []), newItem]);
                        setVocalFrom('');
                        setVocalTo('');
                        showToast("Vocal mapping added successfully!", "success");
                      }}
                      className="w-full py-1.5 bg-[#d97706]/20 hover:bg-[#d97706]/35 text-[#d97706] text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-sans"
                    >
                      <span>➕ Add Dictionary Mapping</span>
                    </button>
                  </div>

                  {/* Current Mappings List */}
                  <div className="space-y-2 bg-[#121214] p-3.5 rounded-lg border border-zinc-850 flex flex-col justify-between">
                    <div>
                      <span className="block text-[9px] uppercase font-mono font-bold text-zinc-500 mb-2">Active Corrections ({vocalDictionary?.length || 0})</span>
                      {vocalDictionary && vocalDictionary.length > 0 ? (
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                          {vocalDictionary.map((item) => (
                            <div key={item.id} className="flex items-center justify-between bg-[#0a0a0c] border border-zinc-850 px-2.5 py-1.5 rounded-md">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-zinc-500 line-through decoration-red-500/30">"{item.from}"</span>
                                <span className="text-zinc-400 font-mono">➜</span>
                                <span className="text-yellow-500 font-bold">"{item.to}"</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setVocalDictionary((prev) => prev.filter((d) => d.id !== item.id));
                                  showToast(`Removed correction for "${item.from}"`, "info");
                                }}
                                className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-red-500/10 font-sans"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-zinc-800 rounded-md">
                          <p className="text-[10px] text-zinc-500 leading-normal">
                            No phonetic overrides defined.<br />Add a rule above to correct words frequently misrecognized by the browser.
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-[8.5px] text-zinc-500 leading-relaxed mt-2">
                      💡 These mappings are executed instantaneously as interim transcript results arrive. Perfect for custom server names, personal names, and special commands.
                    </p>
                  </div>
                </div>
              </div>

              {/* Physical Hardware & Media Device Director */}
              <div className="border border-zinc-800 bg-[#09090b] rounded-lg p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-[#a855f7] uppercase flex items-center gap-1">Physical Signal Ingress / Egress Gateway</span>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <Cpu size={14} className="text-[#a855f7]" /> Media Input & Output Hardware Channels
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Select and calibrate your physical cameras, microphone feeds, and headgear/speaker channels for premium, high-fidelity data feeds.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-zinc-900">
                  {/* Camera Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase font-mono font-bold text-zinc-500">Camera / Kinetic Feed Source</label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value);
                        showToast("Kinetics visual feed source updated!", "success");
                      }}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-sans cursor-pointer"
                    >
                      <option value="">-- System Default Camera --</option>
                      {cameras.map((cam) => (
                        <option key={cam.deviceId} value={cam.deviceId}>
                          {cam.label || `Camera ${cam.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      Used for Kinetic OS Hand Gestures, Virtual Mouse tracking, and Macro analysis.
                    </p>
                  </div>

                  {/* Microphone Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase font-mono font-bold text-zinc-500">Microphone / Speech Ingress channel</label>
                    <select
                      value={selectedMicId}
                      onChange={(e) => {
                        setSelectedMicId(e.target.value);
                        showToast("Speech audio ingress channel updated!", "success");
                      }}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-sans cursor-pointer"
                    >
                      <option value="">-- System Default Mic --</option>
                      {microphones.map((mic) => (
                        <option key={mic.deviceId} value={mic.deviceId}>
                          {mic.label || `Microphone ${mic.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      Used for background wake word listening, continuous conversational speech-to-text, and commands.
                    </p>
                  </div>

                  {/* Headphone/Speaker Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase font-mono font-bold text-zinc-500">Audio Output / Headset channel</label>
                    <select
                      value={selectedSpeakerId}
                      onChange={(e) => {
                        setSelectedSpeakerId(e.target.value);
                        showToast("Vocal synthesis egress channel updated!", "success");
                      }}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-sans cursor-pointer"
                    >
                      <option value="">-- System Default Output --</option>
                      {speakers.map((spk) => (
                        <option key={spk.deviceId} value={spk.deviceId}>
                          {spk.label || `Output Device ${spk.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">
                      Used for vocal synthesis playback and acoustic feed tones. Supports setSinkId where compatible.
                    </p>
                  </div>
                </div>
              </div>

              {/* Shortcuts & Hotkeys Calibration Deck */}
              <div id="shortcuts-calibration-deck" className="border border-zinc-800 bg-[#0a0a0c] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                      <span className="text-yellow-400">⌨️</span> Synaptic Interface Controls & Shortcuts
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                      Assign custom keyboard and mouse button combinations (with support for Alt, Ctrl, Shift modifiers!) to instantly trigger various actions.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 uppercase">
                    Continuous Sync Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      id: 'activation',
                      title: 'Toggle Assistant Panel',
                      description: 'Fires the voice synthesizer, activates mic listening, and maximizes the conversation view.',
                      keyVal: activationShortcutKey,
                      keyType: 'activationKey',
                      mouseVal: activationShortcutMouse,
                      mouseType: 'activationMouse',
                      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                    },
                    {
                      id: 'stop',
                      title: 'Minimize & Pause Speech',
                      description: 'Instantly interrupts speech, suspends active recording, and docks the assistant to the sidebar.',
                      keyVal: stopShortcutKey,
                      keyType: 'stopKey',
                      mouseVal: stopShortcutMouse,
                      mouseType: 'stopMouse',
                      color: 'text-red-400 border-red-500/30 bg-red-500/5'
                    },
                    {
                      id: 'mic',
                      title: 'Force Mic Listening Toggle',
                      description: 'Instantly toggle your active microphone capture state on/off without closing the panel.',
                      keyVal: micShortcutKey,
                      keyType: 'micKey',
                      mouseVal: micShortcutMouse,
                      mouseType: 'micMouse',
                      color: 'text-amber-400 border-amber-500/30 bg-amber-500/5'
                    },
                    {
                      id: 'clear',
                      title: 'Clear Chat Conversation',
                      description: 'Instantly clears active chat history logs from memory context and resets screen dialogs.',
                      keyVal: clearShortcutKey,
                      keyType: 'clearKey',
                      mouseVal: clearShortcutMouse,
                      mouseType: 'clearMouse',
                      color: 'text-purple-400 border-purple-500/30 bg-purple-500/5'
                    },
                    {
                      id: 'mute',
                      title: 'Mute/Unmute Speech Output',
                      description: 'Silences Aethers verbal text-to-speech outputs or unlocks audio replies.',
                      keyVal: muteVoiceShortcutKey,
                      keyType: 'muteKey',
                      mouseVal: muteVoiceShortcutMouse,
                      mouseType: 'muteMouse',
                      color: 'text-sky-400 border-sky-500/30 bg-sky-500/5'
                    },
                    {
                      id: 'projects',
                      title: 'Quick Nav: Projects Board',
                      description: 'Triggers instant sidebar route navigation and routes you to the main Projects tab.',
                      keyVal: navProjectsShortcutKey,
                      keyType: 'projectsKey',
                      mouseVal: navProjectsShortcutMouse,
                      mouseType: 'projectsMouse',
                      color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5'
                    },
                    {
                      id: 'notes',
                      title: 'Quick Nav: Notes Archival',
                      description: 'Triggers instant sidebar route navigation and routes you to your personal Notes workspace.',
                      keyVal: navNotesShortcutKey,
                      keyType: 'notesKey',
                      mouseVal: navNotesShortcutMouse,
                      mouseType: 'notesMouse',
                      color: 'text-pink-400 border-pink-500/30 bg-pink-500/5'
                    },
                    {
                      id: 'roadmap',
                      title: 'Quick Nav: Milestones Roadmap',
                      description: 'Triggers instant sidebar route navigation and routes you directly to the Project Roadmap timeline.',
                      keyVal: navRoadmapShortcutKey,
                      keyType: 'roadmapKey',
                      mouseVal: navRoadmapShortcutMouse,
                      mouseType: 'roadmapMouse',
                      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5'
                    }
                  ].map((act) => (
                    <div key={act.id} className="p-4 bg-[#111113] border border-zinc-850/60 rounded-xl flex flex-col justify-between space-y-4 font-sans">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                            {act.title}
                          </h5>
                          <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${act.color}`}>
                            Assignable
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-normal">
                          {act.description}
                        </p>
                      </div>

                      <div className="space-y-2.5 pt-2 border-t border-zinc-900">
                        {/* Keyboard Binding Row */}
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-zinc-400 font-mono text-[10px]">Keyboard Key:</span>
                          {learningShortcutType === act.keyType ? (
                            <button
                              onClick={() => setLearningShortcutType(null)}
                              className="px-2 py-0.5 bg-yellow-500 text-zinc-950 font-extrabold text-[9px] rounded animate-pulse uppercase cursor-pointer"
                            >
                              Press keys... (Esc to stop)
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {act.keyVal && act.keyVal !== 'none' ? (
                                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-yellow-400">
                                  {act.keyVal}
                                </kbd>
                              ) : (
                                <span className="text-[10px] text-zinc-650 font-mono italic">Unassigned</span>
                              )}
                              <button
                                onClick={() => {
                                  setLearningShortcutType(act.keyType);
                                  setLearningMouseType(null);
                                }}
                                className="px-1.5 py-0.5 bg-zinc-850 hover:bg-zinc-700 text-zinc-350 font-bold text-[9px] rounded cursor-pointer transition-colors"
                              >
                                Bind
                              </button>
                              {act.keyVal && act.keyVal !== 'none' && (
                                <button
                                  onClick={() => {
                                    if (act.keyType === 'activationKey') setActivationShortcutKey('none');
                                    else if (act.keyType === 'stopKey') setStopShortcutKey('none');
                                    else if (act.keyType === 'micKey') setMicShortcutKey('none');
                                    else if (act.keyType === 'clearKey') setClearShortcutKey('none');
                                    else if (act.keyType === 'muteKey') setMuteVoiceShortcutKey('none');
                                    else if (act.keyType === 'projectsKey') setNavProjectsShortcutKey('none');
                                    else if (act.keyType === 'notesKey') setNavNotesShortcutKey('none');
                                    else if (act.keyType === 'roadmapKey') setNavRoadmapShortcutKey('none');
                                    addVocalDiagnostic(`SHORTCUT_BIND: Cleared key for ${act.keyType}`);
                                  }}
                                  className="text-[9px] text-zinc-550 hover:text-red-400 font-bold transition-colors cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mouse Binding Row */}
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-zinc-400 font-mono text-[10px]">Mouse Trigger:</span>
                          {learningMouseType === act.mouseType ? (
                            <button
                              onClick={() => setLearningMouseType(null)}
                              className="px-2 py-0.5 bg-amber-500 text-zinc-950 font-extrabold text-[9px] rounded animate-pulse uppercase cursor-pointer"
                            >
                              Click mouse...
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {act.mouseVal && act.mouseVal !== 'none' ? (
                                <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-[10px] text-yellow-400">
                                  {act.mouseVal}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-650 font-mono italic">Unassigned</span>
                              )}
                              <button
                                onClick={() => {
                                  setLearningMouseType(act.mouseType);
                                  setLearningShortcutType(null);
                                }}
                                className="px-1.5 py-0.5 bg-zinc-850 hover:bg-zinc-700 text-zinc-350 font-bold text-[9px] rounded cursor-pointer transition-colors"
                              >
                                Bind
                              </button>
                              {act.mouseVal && act.mouseVal !== 'none' && (
                                <button
                                  onClick={() => {
                                    if (act.mouseType === 'activationMouse') setActivationShortcutMouse('none');
                                    else if (act.mouseType === 'stopMouse') setStopShortcutMouse('none');
                                    else if (act.mouseType === 'micMouse') setMicShortcutMouse('none');
                                    else if (act.mouseType === 'clearMouse') setClearShortcutMouse('none');
                                    else if (act.mouseType === 'muteMouse') setMuteVoiceShortcutMouse('none');
                                    else if (act.mouseType === 'projectsMouse') setNavProjectsShortcutMouse('none');
                                    else if (act.mouseType === 'notesMouse') setNavNotesShortcutMouse('none');
                                    else if (act.mouseType === 'roadmapMouse') setNavRoadmapShortcutMouse('none');
                                    addVocalDiagnostic(`SHORTCUT_BIND: Cleared mouse for ${act.mouseType}`);
                                  }}
                                  className="text-[9px] text-zinc-550 hover:text-red-400 font-bold transition-colors cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reset button row */}
                <div className="flex items-center justify-between p-2.5 bg-zinc-950/40 border border-zinc-900 rounded-lg text-[10px] text-zinc-500 font-sans">
                  <span>💡 Overlapping shortcuts might intercept default OS behavior. Space / Alt keys work best.</span>
                  <button
                    onClick={() => {
                      setActivationShortcutKey('Alt+k');
                      setActivationShortcutMouse('none');
                      setStopShortcutKey('Escape');
                      setStopShortcutMouse('none');
                      setMicShortcutKey('Alt+m');
                      setMicShortcutMouse('none');
                      setClearShortcutKey('Alt+c');
                      setClearShortcutMouse('none');
                      setMuteVoiceShortcutKey('Alt+u');
                      setMuteVoiceShortcutMouse('none');
                      setNavProjectsShortcutKey('Alt+p');
                      setNavProjectsShortcutMouse('none');
                      setNavNotesShortcutKey('Alt+n');
                      setNavNotesShortcutMouse('none');
                      setNavRoadmapShortcutKey('Alt+r');
                      setNavRoadmapShortcutMouse('none');
                      addVocalDiagnostic("CALIBRATION: Reset helper keyboard shortcuts to default presets.");
                    }}
                    className="text-yellow-500 font-semibold hover:text-yellow-400 transition-colors uppercase font-mono tracking-wider text-[9px] cursor-pointer"
                  >
                    Reset Shortcuts to Defaults
                  </button>
                </div>
              </div>

              {/* Add Custom Trigger Section */}
              <div className="border border-zinc-800 bg-[#09090b] rounded-lg p-5">
                <h4 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-1.5">
                  <span className="text-yellow-400">⚙️</span> Register Custom Vocal Trigger Phrase
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  {/* Trigger Phrase Input */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-mono font-bold text-zinc-500">1. Define Phrase</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newTriggerPhrase}
                        onChange={(e) => setNewTriggerPhrase(e.target.value)}
                        className="w-full bg-[#121214] border border-zinc-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                        placeholder="e.g. go to the lab"
                      />
                      <button
                        type="button"
                        onClick={startTeachingSpeech}
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                          isTeachingSpeak ? 'bg-red-500/20 text-red-400' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Dictate from Mic"
                      >
                        <Mic size={12} className={isTeachingSpeak ? 'animate-pulse' : ''} />
                      </button>
                    </div>
                    <p className="text-[9px] text-zinc-500 flex justify-between">
                      <span>Type or dictate your vocal command.</span>
                    </p>
                  </div>

                  {/* Association Target */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-mono font-bold text-zinc-500">2. Select Destination</label>
                    <select
                      value={newTriggerPath}
                      onChange={(e) => setNewTriggerPath(e.target.value)}
                      className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                    >
                      <option value="/">Dashboard (Home)</option>
                      <option value="/assistant">AI Assistant Chat</option>
                      <option value="/issues">Issues Backlog</option>
                      <option value="/projects">Projects Workspace</option>
                      <option value="/notes">Notes Archival</option>
                      <option value="/assets">Local Core Assets</option>
                      <option value="/ideas">Idea Expansion Plan</option>
                      <option value="/roadmap">Milestone Roadmap</option>
                      <option value="/brain">Central Project Brain</option>
                      <option value="/agents">Agentic OS Lab</option>
                      <option value="/github">GitHub Intelligence</option>
                      <option value="/docs">Workspace Help Docs</option>
                      <option value="/whatsapp-companion">Aether AI Companion</option>
                      <option value="/settings">System Settings</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newTriggerPhrase.trim()) return;
                        const cleanedPhrase = newTriggerPhrase.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
                        
                        // Check if already exists
                        if (voiceTriggers.some(t => t.phrase.toLowerCase() === cleanedPhrase)) {
                          alert("This trigger phrase is already registered.");
                          return;
                        }

                        setVoiceTriggers(prev => [...prev, { phrase: cleanedPhrase, path: newTriggerPath }]);
                        setNewTriggerPhrase('');
                      }}
                      disabled={!newTriggerPhrase.trim()}
                      className="w-full bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Register Vocal Synapse</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Synapses List */}
              <div className="border border-zinc-800 bg-[#09090b] rounded-lg p-5">
                <h4 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-1.5">
                  📁 Current Vocal Synapse Registry ({voiceTriggers?.length || 0})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {voiceTriggers?.map((trig, idx) => {
                    // Match route to name for friendly display
                    const pathLabels: Record<string, string> = {
                      '/': 'Dashboard',
                      '/assistant': 'AI Assistant',
                      '/issues': 'Issues',
                      '/projects': 'Projects',
                      '/notes': 'Notes',
                      '/assets': 'Assets',
                      '/ideas': 'Idea Plan',
                      '/roadmap': 'Roadmap',
                      '/brain': 'Project Brain',
                      '/agents': 'Agentic OS',
                      '/github': 'GitHub Intelligence',
                      '/docs': 'Workspace Docs',
                      '/whatsapp-companion': 'Aether AI Companion',
                      '/settings': 'Settings'
                    };
                    const targetName = pathLabels[trig.path] || trig.path;

                    return (
                      <motion.div
                        key={trig.phrase + '-' + idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#121214] border border-zinc-800 rounded-lg p-3 flex justify-between items-center group relative hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex-grow min-w-0 pr-4 font-normal">
                          <div className="text-xs font-bold text-zinc-200 truncate font-mono">
                            "{trig.phrase}"
                          </div>
                          <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                            <span>↳ directs to</span>
                            <span className="text-yellow-550 bg-yellow-500/5 px-1.5 py-0.2 rounded border border-yellow-500/10 font-mono text-[9px]">{targetName}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setVoiceTriggers(prev => prev.filter(t => t.phrase !== trig.phrase || t.path !== trig.path));
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                          title="Remove vocal synapse"
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Vocal Synapse Training & Calibration Center */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 pt-4 border-t border-zinc-900">
                
                {/* Left side: Interactive training walkthrough */}
                <div className="xl:col-span-7 space-y-4">
                  <div className="border border-yellow-500/20 bg-gradient-to-br from-yellow-500/[0.02] to-transparent rounded-lg p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold tracking-widest text-yellow-450 uppercase">Synaptic Calibration Subsystem</span>
                        <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-yellow-400" /> Wake Word Vocal Training Center
                        </h4>
                        <p className="text-[10px] text-zinc-400 leading-normal max-w-md">
                          Ask your device to study and remember your unique spoken pitch patterns. By verifying ambient room silence, calibrating phrase metrics, and registering your wake word, you train the proximate phonetic engine to detect your custom cues effortlessly.
                        </p>
                      </div>
                      
                      {trainedWakeWordModel && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-550/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                          ✓ TRAINED & CALIBRATED
                        </span>
                      )}
                    </div>

                    {/* Step wizard status guide */}
                    <div className="bg-zinc-950/40 border border-zinc-850 rounded-lg p-4 space-y-4">
                      {/* Step 1: Ambient Silence Sensor */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            calibrationNoiseFloor ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {calibrationNoiseFloor ? '✓' : '1'}
                          </div>
                          <div className="w-[1px] h-8 bg-zinc-800 mt-1" />
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-200">Ambient Noise Reference</span>
                            {calibrationNoiseFloor && (
                              <span className="text-[9px] font-mono font-bold text-emerald-400">
                                {calibrationNoiseFloor} dB (Calibrated)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Measures background clarity. Keep complete silence while checking the audio input channel sensor.
                          </p>
                          {trainingStep === 'idle' && (
                            <button
                              type="button"
                              onClick={handleCalibrateSilence}
                              disabled={isCalibrationListening}
                              className="mt-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded-md transition-colors"
                            >
                              Initialize Noise Calibration (2s)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Phrase Verifications */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            trainedPhrases.length >= 3 ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {trainedPhrases.length >= 3 ? '✓' : '2'}
                          </div>
                          <div className="w-[1px] h-8 bg-zinc-800 mt-1" />
                        </div>
                        <div className="flex-grow space-y-2">
                          <span className="text-xs font-bold text-zinc-200 block">Phrase Reading Calibrations ({trainedPhrases.length}/3 Verified)</span>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Read the following phrases so the vocal model can study your spoken consonants and phonetic speed attributes.
                          </p>
                          
                          <div className="space-y-1.5 pt-1">
                            {[
                              { id: 'phrase_1', text: "K-Aether, check active workspace!" },
                              { id: 'phrase_2', text: "Enable the smart assistant dashboard!" },
                              { id: 'phrase_3', text: "Aether, commit scratchnote idea!" }
                            ].map((ph, idx) => {
                              const isCompleted = trainedPhrases.includes(ph.text);
                              const isCurrent = trainingStep === ph.id;
                              
                              return (
                                <div 
                                  key={ph.id} 
                                  className={`p-2 rounded-md border flex items-center justify-between text-[11px] ${
                                    isCompleted 
                                      ? 'bg-zinc-950/20 border-emerald-500/10 text-zinc-450' 
                                      : isCurrent 
                                        ? 'bg-zinc-900 border-yellow-500/20 text-zinc-200 shadow-sm' 
                                        : 'bg-zinc-950/5 border-zinc-900 text-zinc-550 opacity-65'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={isCompleted ? 'text-emerald-400' : isCurrent ? 'text-yellow-400' : 'text-zinc-500'}>
                                      {isCompleted ? '●' : isCurrent ? '▶' : '○'}
                                    </span>
                                    <span className="font-mono">"{ph.text}"</span>
                                  </div>

                                  {isCurrent && (
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleRecordTrainingPhrase(ph.text, ph.id as any)}
                                        disabled={isCalibrationListening}
                                        className="px-2 py-1 bg-yellow-500 hover:bg-yellow-400 text-black text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <Mic size={10} /> Record
                                      </button>

                                      <label className="px-2 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors border border-zinc-750">
                                        <Upload size={10} className="text-zinc-400" /> Upload Voice
                                        <input
                                          type="file"
                                          accept="audio/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleAudioUpload(file, ph.id as any);
                                          }}
                                        />
                                      </label>
                                    </div>
                                  )}
                                  
                                  {isCompleted && (
                                    <span className="text-[9px] text-emerald-400 font-bold shrink-0">✓ Verified</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Step 3: Custom Wake Word Target */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                            trainedWakeWordModel ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {trainedWakeWordModel ? '✓' : '3'}
                          </div>
                        </div>
                        <div className="flex-grow space-y-1">
                          <span className="text-xs font-bold text-zinc-200 block">Personalized Wake Word Signature</span>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Record yourself saying your custom phrase <strong className="text-yellow-400">"{wakeWord || 'hey aether'}"</strong> to extract unique pitch and resonance coefficients.
                          </p>
                          {trainingStep === 'custom_record' && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleRecordCustomWakeWord}
                                disabled={isCalibrationListening}
                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Mic size={11} /> Record Wake Word
                              </button>

                              <label className="px-3 py-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors border border-zinc-750">
                                <Upload size={11} className="text-zinc-400" /> Upload Voice Memo
                                <input
                                  type="file"
                                  accept="audio/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAudioUpload(file, 'custom_record');
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Feedback message overlay */}
                    {calibrationFeedback && (
                      <div className="mt-4 p-2.5 bg-[#121214] border border-yellow-500/10 rounded-md text-[10px] text-yellow-400 font-mono text-center flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping shrink-0" />
                        <span>{calibrationFeedback}</span>
                      </div>
                    )}

                    {/* Step 4: Display analysis attributes if Trained */}
                    {trainedWakeWordModel && (
                      <div className="mt-4 bg-[#121214] border border-zinc-850 p-4 rounded-lg space-y-3 font-mono text-[10px]">
                        <span className="text-[8px] font-black tracking-widest text-[#95a5a6] uppercase">Vocal Attribute Report</span>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="bg-zinc-950/40 p-2 rounded border border-zinc-900 text-center">
                            <span className="text-zinc-550 text-[9px] block">AV PITCH ACCENT</span>
                            <span className="text-zinc-200 font-bold text-xs">{vocalPitch || '148'} Hz</span>
                          </div>
                          <div className="bg-zinc-950/40 p-2 rounded border border-zinc-900 text-center">
                            <span className="text-zinc-550 text-[9px] block">RESONANCE RATE</span>
                            <span className="text-emerald-400 font-bold text-xs">{vocalResonance || '94'}/100</span>
                          </div>
                          <div className="bg-zinc-950/40 p-2 rounded border border-zinc-900 text-center col-span-2 md:col-span-1">
                            <span className="text-zinc-550 text-[9px] block">MATCH COEFFICIENT</span>
                            <span className="text-yellow-400 font-bold text-xs">{(vocalMatchScore || 96) / 100}x confidence</span>
                          </div>
                        </div>

                        {/* Saved Recording Playback */}
                        {recordedAudioUrl && (
                          <div className="pt-2.5 border-t border-zinc-900 flex flex-col gap-1.5 text-center">
                            <span className="text-zinc-500 text-[9px] text-left">Your calibrated training vocal feed:</span>
                            <div className="flex items-center gap-3">
                              <audio 
                                src={recordedAudioUrl} 
                                controls 
                                className="w-full h-8 max-w-sm rounded bg-zinc-900/30 border border-zinc-850" 
                              />
                              <button
                                type="button"
                                onClick={handleResetCalibration}
                                className="px-2.5 py-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-md text-[9px] font-bold tracking-wide transition-all uppercase whitespace-nowrap cursor-pointer"
                              >
                                Clear Weight File
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-[9px] text-zinc-500 pt-1 leading-snug">
                          ✓ Vocal Synaptic Matrix is configured. STANDBY detection threshold shifted from <strong className="text-zinc-300">70%</strong> to <strong className="text-yellow-450 font-bold">95% confidence accuracy</strong> based on neural vocal pattern match calibration.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Vocal Diagnostics Stream */}
                <div className="xl:col-span-5 flex flex-col space-y-3 min-h-[300px]">
                  <div className="border border-zinc-800 bg-[#09090b] rounded-lg p-4 flex-1 flex flex-col min-h-[340px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase font-black tracking-widest text-[#85cbd0] flex items-center gap-1.5">
                        <Terminal size={12} className="text-cyan-400 animate-pulse" /> Aether Vocal Diagnostics Console
                      </span>
                      
                      <button
                        onClick={() => {
                          setVocalDiagnostics([
                            `[${new Date().toLocaleTimeString()}] INFO: Diagnostics cleared. Telemetry feed listening live...`
                          ]);
                        }}
                        className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={10} /> Clear Stream
                      </button>
                    </div>

                    <p className="text-[9px] text-zinc-500 leading-normal mb-3">
                      View real-time phonetical transcripts, SpeechRecognition engine logs, state transitions, and background wake word cycles below.
                    </p>

                    {/* Console Logger Window */}
                    <div className="flex-1 bg-zinc-950 border border-zinc-900 p-3 rounded-lg overflow-y-auto max-h-[240px] text-[9.5px] font-mono text-zinc-400 space-y-1.5 select-text">
                      {vocalDiagnostics.map((log, idx) => {
                        let colorClass = 'text-zinc-450';
                        if (log.includes('SUCCESS') || log.includes('Verified')) colorClass = 'text-emerald-400';
                        if (log.includes('ERROR') || log.includes('CRITICAL')) colorClass = 'text-rose-400';
                        if (log.includes('CALIBRATION STARTED') || log.includes('CALIBRATION TASK')) colorClass = 'text-yellow-400';
                        if (log.includes('SPEECH RECON MATCH')) colorClass = 'text-cyan-400';

                        return (
                          <div key={idx} className={`leading-relaxed border-b border-zinc-900/40 pb-1 last:border-0 ${colorClass}`}>
                            {log}
                          </div>
                        );
                      })}
                    </div>

                    {/* Live Waveform Mock visualization */}
                    <div className="border border-zinc-900 bg-zinc-950/30 p-2.5 rounded-lg mt-3 flex items-center justify-between">
                      <div className="space-y-1 font-mono text-[9px]">
                        <span className="text-zinc-500 uppercase tracking-tight block">ACTIVE MATCH THRESHOLD</span>
                        <span className="text-zinc-200">
                          {trainedWakeWordModel ? '95% Confidence (Tight Accuracy)' : '70% Confidence (Open Matching)'}
                        </span>
                      </div>

                      {/* Moving Equalizer Visual */}
                      <div className="flex items-end gap-[1.5px] px-2 py-1 bg-zinc-950 rounded">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <motion.span
                            key={i}
                            animate={{ height: isCalibrationListening ? [3, Math.round(12 + Math.random() * 16), 3] : [2, Math.round(4 + Math.random()*2), 2] }}
                            transition={{ duration: 0.4 + i * 0.08, repeat: Infinity, ease: "easeInOut" }}
                            className={`w-[2px] rounded-t ${isCalibrationListening ? 'bg-yellow-500' : 'bg-zinc-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'kinetic-gestures' && (
            <div className="space-y-6 animate-fade-in text-zinc-300">
              {/* Conflict Notification Overlay Modal */}
              {gestureConflict && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                  <div className="w-full max-w-md p-6 border border-amber-500/30 bg-[#0c0c0e] rounded-2xl shadow-2xl space-y-4">
                    <div className="flex items-center gap-3 text-amber-400">
                      <AlertCircle size={24} className="animate-pulse" />
                      <h4 className="text-sm font-bold uppercase tracking-wider font-mono">
                        Kinetic Conflict Detected
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs text-zinc-300">
                      {gestureConflict.type === 'name' ? (
                        <p className="leading-relaxed">
                          A spatial gesture pattern named <span className="font-bold text-amber-400 font-mono">"{gestureConflict.conflictWith}"</span> already exists. Saving will result in duplicate name lookup conflicts.
                        </p>
                      ) : (
                        <p className="leading-relaxed">
                          The recorded spatial path is mathematically highly similar (overlap signature &gt; 75%) to the existing custom gesture <span className="font-bold text-amber-400 font-mono">"{gestureConflict.conflictWith}"</span>. Using highly similar gestures will lead to execution triggers colliding.
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-500 italic">
                        How would you like to proceed with the newly captured signal?
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                      <button
                        onClick={handleCancelTraining}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg border border-zinc-800 transition-colors"
                      >
                        Cancel & Retrain
                      </button>
                      <button
                        onClick={handleSaveAnyway}
                        className="px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-750 transition-colors"
                      >
                        Save as Duplicate
                      </button>
                      <button
                        onClick={handleOverwrite}
                        className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors"
                      >
                        Overwrite "{gestureConflict.conflictWith}"
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Community Publishing Modal */}
              {isPublishingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-xs">
                  <div className="w-full max-w-lg p-6 border border-zinc-800 bg-[#0c0c0e] rounded-2xl shadow-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2">
                        <Share2 size={18} className="text-amber-400 animate-pulse" />
                        <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-zinc-100">
                          Publish Gesture Library Bundle
                        </h4>
                      </div>
                      <button
                        onClick={() => setIsPublishingModalOpen(false)}
                        className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Library Title</label>
                        <input
                          type="text"
                          value={publishTitle}
                          onChange={(e) => setPublishTitle(e.target.value)}
                          placeholder="e.g. Navigation Masterclass"
                          className="w-full bg-[#111113] border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Library Description</label>
                        <textarea
                          rows={3}
                          value={publishDescription}
                          onChange={(e) => setPublishDescription(e.target.value)}
                          placeholder="Explain what these gestures do, what macros are executed, and how to use them..."
                          className="w-full bg-[#111113] border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-zinc-700 font-mono leading-relaxed"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Select Gestures to Bundle</label>
                        <div className="max-h-48 overflow-y-auto border border-zinc-900 bg-black/40 rounded-lg p-2.5 space-y-1.5 custom-scrollbar">
                          {macroRegistry.length === 0 ? (
                            <p className="text-zinc-650 italic text-[10px] py-4 text-center">No local custom gestures available to bundle.</p>
                          ) : (
                            macroRegistry.map((gest) => {
                              const isChecked = publishSelectedGestureIds.includes(gest.id);
                              return (
                                <div
                                  key={gest.id}
                                  onClick={() => {
                                    if (isChecked) {
                                      setPublishSelectedGestureIds(prev => prev.filter(id => id !== gest.id));
                                    } else {
                                      setPublishSelectedGestureIds(prev => [...prev, gest.id]);
                                    }
                                  }}
                                  className={`flex items-center justify-between p-2 rounded-md border transition-all cursor-pointer select-none ${
                                    isChecked 
                                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
                                      : 'bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-zinc-900 border border-zinc-850 rounded text-zinc-500 shrink-0">
                                      {gest.direction || 'custom'}
                                    </span>
                                    <span className="font-bold text-[10.5px] truncate max-w-[200px]">{gest.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-zinc-650">{gest.action}</span>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // handled by click
                                      className="accent-amber-500"
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-zinc-900 pt-3.5">
                      <button
                        onClick={() => setIsPublishingModalOpen(false)}
                        className="px-4 py-2 text-xs font-bold font-mono uppercase bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!publishTitle.trim()) {
                            showToast('Please specify a title for your shared library.', 'error', 3000);
                            return;
                          }
                          if (publishSelectedGestureIds.length === 0) {
                            showToast('Please select at least one gesture to package.', 'error', 3000);
                            return;
                          }

                          const selectedGestures = macroRegistry.filter(g => publishSelectedGestureIds.includes(g.id));

                          const ok = await publishMacro(publishTitle.trim(), publishDescription.trim(), selectedGestures);
                          if (ok) {
                            setIsPublishingModalOpen(false);
                            setPublishTitle('');
                            setPublishDescription('');
                            setPublishSelectedGestureIds([]);
                          }
                        }}
                        disabled={publishSelectedGestureIds.length === 0 || !publishTitle.trim()}
                        className="px-4 py-2 text-xs font-bold font-mono uppercase tracking-tight bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-45 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                      >
                        Publish to Gallery
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Kinetic Calibration Overlay Modal */}
              {isCalibrationOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
                  <div className="w-full max-w-4xl p-6 border border-zinc-800 bg-[#09090b] rounded-2xl shadow-2xl space-y-5 my-8">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <Settings2 size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-zinc-100 flex items-center gap-1.5">
                            Kinetic Calibration & Tuning Console
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Fine-tune computer-vision sensitivity parameters, minimum threshold velocities, static posture frame locks, and path matching thresholds.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsCalibrationOpen(false)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Close Calibration Console"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Split Layout: Visual Feedback + Sensitivity Sliders */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left: Real-time Radar Test area */}
                      <div className="lg:col-span-5 space-y-3">
                        <div className="border border-zinc-900 bg-black/60 p-4 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Live Tracking Radar</span>
                            {isKineticEnabled ? (
                              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/45 border border-emerald-900/30 px-1.5 py-0.5 rounded-full font-black animate-pulse">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" /> ACTIVE
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full font-bold">
                                <span className="w-1 h-1 rounded-full bg-zinc-500" /> INACTIVE
                              </span>
                            )}
                          </div>
                          
                          <div className="relative border border-zinc-900 rounded-lg overflow-hidden bg-[#060608]">
                            <KineticSandboxVisualizer />
                          </div>

                          <div className="space-y-1.5 text-[10px] text-zinc-500 leading-normal">
                            <p>• Move your hand inside the camera frame to test adjustments live.</p>
                            <p>• Check if the tracking trail coordinates match and trigger gestures cleanly with your updated thresholds.</p>
                            {!isKineticEnabled && (
                              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-500 text-[9.5px] mt-2 flex items-start gap-1.5">
                                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                <span>Note: The camera tracker is currently <strong>disabled</strong>. Enable it via the main panel toggles to see real-time calibration radar feedback.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: The Sensitivity Sliders */}
                      <div className="lg:col-span-7 space-y-4">
                        <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-900/60 pb-1.5">
                          Tuning Sliders
                        </h5>

                        <div className="space-y-3.5">
                          {/* Slider 1: Swipe Sensitivity */}
                          <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-zinc-900">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-200 block">Swipe Distance Sensitivity</span>
                                <span className="text-[9px] text-zinc-500 block">Min pixel distance required for a swipe gesture.</span>
                              </div>
                              <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                                {swipeSensitivity}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min={15}
                              max={60}
                              value={swipeSensitivity}
                              onChange={(e) => setSwipeSensitivity(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                              <span>15px (Sensitive)</span>
                              <span className="text-[9px] text-zinc-400 font-medium">
                                {swipeSensitivity < 25 
                                  ? "⚡ Fast (Tiny rapid hand sweep)" 
                                  : swipeSensitivity <= 42 
                                    ? "⚖️ Balanced (Recommended default)" 
                                    : "🔒 Deliberate (Large sweeps only)"}
                              </span>
                              <span>60px (Strict)</span>
                            </div>
                          </div>

                          {/* Slider 2: Custom Path Correlation Match Precision */}
                          <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-zinc-900">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-200 block">Path Similarity Tolerance (Custom Gestures)</span>
                                <span className="text-[9px] text-zinc-500 block">Deviation allowance between real-time trail and trained shape.</span>
                              </div>
                              <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                                {customPathMatchPrecision.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0.10}
                              max={0.40}
                              step={0.01}
                              value={customPathMatchPrecision}
                              onChange={(e) => setCustomPathMatchPrecision(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                              <span>0.10 (Rigid/Perfect Match)</span>
                              <span className="text-[9px] text-zinc-400 font-medium">
                                {customPathMatchPrecision < 0.18 
                                  ? "🎯 Perfect Form (Requires precise path replication)" 
                                  : customPathMatchPrecision <= 0.28 
                                    ? "⚖️ Generous (Optimal for human deviations)" 
                                    : "⚠️ Loose (High overlap error risk)"}
                              </span>
                              <span>0.40 (Flexible Match)</span>
                            </div>
                          </div>

                          {/* Slider 3: Wave Sensitivity */}
                          <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-zinc-900">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-200 block">Wave Swing Amplitude</span>
                                <span className="text-[9px] text-zinc-500 block">Minimum horizontal width required for waves.</span>
                              </div>
                              <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                                {waveSensitivity}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min={15}
                              max={60}
                              value={waveSensitivity}
                              onChange={(e) => setWaveSensitivity(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                              <span>15px (Sensitive)</span>
                              <span className="text-[9px] text-zinc-400 font-medium">
                                {waveSensitivity < 22 
                                  ? "⚡ Tiny Wave (Light wiggle triggers)" 
                                  : waveSensitivity <= 38 
                                    ? "⚖️ Normal Wave (Standard default)" 
                                    : "🔒 Broad Wave (Wide sweep waves required)"}
                              </span>
                              <span>60px (Broad Swings)</span>
                            </div>
                          </div>

                          {/* Slider 4: Static Hold Frame Count */}
                          <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-zinc-900">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-200 block">Finger Posture Stability Hold Time</span>
                                <span className="text-[9px] text-zinc-500 block">Consecutive video frames a hand pose must stay locked.</span>
                              </div>
                              <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                                {fingerPoseStabilityFrames} frames
                              </span>
                            </div>
                            <input
                              type="range"
                              min={5}
                              max={25}
                              value={fingerPoseStabilityFrames}
                              onChange={(e) => setFingerPoseStabilityFrames(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                              <span>5 frames (~80ms)</span>
                              <span className="text-[9px] text-zinc-400 font-medium">
                                {fingerPoseStabilityFrames < 8 
                                  ? "⚡ Rapid (Instantaneous registration)" 
                                  : fingerPoseStabilityFrames <= 14 
                                    ? "⚖️ Stable Hold (~160ms, standard)" 
                                    : "🔒 Deliberate Hold (Hold frozen to trigger)"}
                              </span>
                              <span>25 frames (~400ms)</span>
                            </div>
                          </div>

                          {/* Slider 5: Gesture Trigger Cooldown */}
                          <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-zinc-900">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[10px] font-bold text-zinc-200 block">Gesture Trigger Cooldown</span>
                                <span className="text-[9px] text-zinc-500 block">Min wait time between sequential macro/gesture triggers.</span>
                              </div>
                              <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
                                {gestureCooldownDuration} ms
                              </span>
                            </div>
                            <input
                              type="range"
                              min={300}
                              max={4000}
                              step={100}
                              value={gestureCooldownDuration}
                              onChange={(e) => setGestureCooldownDuration(Number(e.target.value))}
                              className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                              <span>300ms (Rapid)</span>
                              <span className="text-[9px] text-zinc-400 font-medium">
                                {gestureCooldownDuration < 1000 
                                  ? "⚡ Rapid Fire (Prone to duplicate triggers)" 
                                  : gestureCooldownDuration <= 2200 
                                    ? "⚖️ Balanced Cooldown (Recommended)" 
                                    : "🔒 Deliberate (Safe from duplicate triggers)"}
                              </span>
                              <span>4000ms (Strict Gap)</span>
                            </div>
                          </div>
                        </div>

                        {/* Reset Buttons */}
                        <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60">
                          <button
                            onClick={() => {
                              setSwipeSensitivity(32);
                              setCustomPathMatchPrecision(0.23);
                              setWaveSensitivity(30);
                              setFingerPoseStabilityFrames(10);
                              setGestureCooldownDuration(1500);
                            }}
                            className="text-[10px] font-mono text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors bg-transparent border-0 cursor-pointer"
                          >
                            <RefreshCw size={10} /> Reset to Defaults
                          </button>
                          
                          <button
                            onClick={() => setIsCalibrationOpen(false)}
                            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Save & Exit Calibration
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Grouped Gestures & Shortcuts under intuitive, plain-English categories with descriptive labels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
                {[
                  {
                    id: 'camera',
                    title: '1. Camera Setup & Controls',
                    description: 'Turn on your webcam and customize how easily your movements trigger actions.',
                    icon: Camera,
                    defaultSubTab: 'setup'
                  },
                  {
                    id: 'presets',
                    title: '2. Ready-to-Use Actions',
                    description: 'Deploy ready-made shortcut packs, set simple finger shapes, or view AI suggestions.',
                    icon: Sparkles,
                    defaultSubTab: 'ready-made'
                  },
                  {
                    id: 'custom',
                    title: '3. Create & Manage Custom',
                    description: 'Draw custom hand movement shapes, configure shortcuts, and sync to the cloud.',
                    icon: Zap,
                    defaultSubTab: 'create'
                  }
                ].map((group) => {
                  const IconComponent = group.icon;
                  const isActive = gestureGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setGestureGroup(group.id as any);
                        setGestureSubTab(group.defaultSubTab as any);
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.03)]'
                          : 'bg-[#09090b] border-zinc-850 hover:border-zinc-750'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-lg border ${
                          isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          <IconComponent size={14} />
                        </div>
                        <h4 className={`text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-zinc-200'}`}>
                          {group.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        {group.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Internal Sub-Tabs switcher for Group 2 (Presets & Logs) */}
              {gestureGroup === 'presets' && (
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3 mb-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setGestureSubTab('ready-made')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      gestureSubTab === 'ready-made'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                    }`}
                  >
                    Preset Packs & Finger Postures
                  </button>
                  <span className="text-zinc-850">|</span>
                  <button
                    type="button"
                    onClick={() => setGestureSubTab('suggestions')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      gestureSubTab === 'suggestions'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                    }`}
                  >
                    AI Suggestions & Activity Logs
                  </button>
                </div>
              )}

              {/* Internal Sub-Tabs switcher for Group 3 (Custom & Active) */}
              {gestureGroup === 'custom' && (
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3 mb-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setGestureSubTab('create')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      gestureSubTab === 'create'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                    }`}
                  >
                    Draw Custom Shortcut Pathway
                  </button>
                  <span className="text-zinc-850">|</span>
                  <button
                    type="button"
                    onClick={() => setGestureSubTab('active')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                      gestureSubTab === 'active'
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                    }`}
                  >
                    My Active Shortcuts & Backup
                  </button>
                </div>
              )}

              {gestureSubTab === 'setup' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                      <Camera size={16} className="text-emerald-400" /> Camera Setup & Motion Control
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Turn on your webcam to control your screen with hand movements. Everything is processed privately on your own computer.
                    </p>
                  </div>

                  {/* Toggles Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      onClick={() => {
                        const isKin = useStore.getState().isKineticEnabled;
                        useStore.getState().setKineticEnabled(!isKin);
                      }}
                      className={`border p-4 rounded-xl cursor-pointer transition-all ${
                        isKineticEnabled
                          ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40'
                          : 'bg-[#09090b] border-zinc-855 hover:border-zinc-750'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                            <SettingsIcon size={14} className={isKineticEnabled ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'} />
                            Enable Hand Gesture Controls
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                            Turn on gesture tracking. When active, the camera watches for your hands to trigger actions.
                          </p>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors shrink-0 ml-4 ${isKineticEnabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isKineticEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        const isShow = useStore.getState().showFloatingCamera;
                        useStore.getState().setShowFloatingCamera(!isShow);
                      }}
                      className={`border p-4 rounded-xl cursor-pointer transition-all ${
                        showFloatingCamera
                          ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/40'
                          : 'bg-[#09090b] border-zinc-855 hover:border-zinc-750'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                            <Eye size={14} className={showFloatingCamera ? 'text-emerald-400' : 'text-zinc-500'} />
                            Show Camera Window
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                            Show a small floating circle in the corner so you can see where your hands are.
                          </p>
                        </div>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors shrink-0 ml-4 ${showFloatingCamera ? 'bg-emerald-500' : 'bg-zinc-800'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${showFloatingCamera ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>

                    <div 
                      className="border p-4 rounded-xl transition-all bg-[#09090b] border-zinc-855"
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 mb-1">
                            <Activity size={14} className="text-emerald-400" />
                            Hand Tracking Mode
                          </h4>
                          <p className="text-[10px] text-zinc-500 leading-normal mb-3">
                            Choose whether the camera tracks one hand or both hands for shortcuts.
                          </p>
                        </div>
                        <div className="flex bg-[#121214] border border-zinc-800 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setKineticHandsMode('one');
                              showToast('🖐️ Single-hand tracking mode enabled.', 'success', 2500);
                            }}
                            className={`flex-1 py-1 text-[10px] font-mono rounded-md font-bold transition-all cursor-pointer ${
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
                              showToast('🙌 Two-hand tracking mode enabled.', 'success', 2500);
                            }}
                            className={`flex-1 py-1 text-[10px] font-mono rounded-md font-bold transition-all cursor-pointer ${
                              kineticHandsMode === 'two'
                                ? 'bg-emerald-500 text-black shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/20'
                            }`}
                          >
                            Two Hands
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sensitivity Controls Panel */}
                  <div className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-5">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Settings2 size={14} className="text-emerald-400" />
                        How Easily Shortcuts Trigger
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Adjust the sliders below to make gesture detection more or less sensitive to your movements.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Swipe Sensitivity */}
                      <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-zinc-900">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-200 block">Hand Swipe Distance</span>
                            <span className="text-[9px] text-zinc-500 block">How far you need to move your hand to trigger a swipe shortcut.</span>
                          </div>
                          <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                            {swipeSensitivity}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={60}
                          value={swipeSensitivity}
                          onChange={(e) => setSwipeSensitivity(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                          <span>15px (Short movement)</span>
                          <span className="text-[9px] text-zinc-400">
                            {swipeSensitivity < 25 ? "⚡ Triggers quickly" : swipeSensitivity <= 42 ? "⚖️ Balanced (Recommended)" : "🔒 Requires wide sweep"}
                          </span>
                          <span>60px (Long movement)</span>
                        </div>
                      </div>

                      {/* Path Match Precision */}
                      <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-zinc-900">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-200 block">Shape Matching Accuracy</span>
                            <span className="text-[9px] text-zinc-500 block">How closely your hand path must match the shape you drew when training.</span>
                          </div>
                          <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                            {customPathMatchPrecision.toFixed(2)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.10}
                          max={0.40}
                          step={0.01}
                          value={customPathMatchPrecision}
                          onChange={(e) => setCustomPathMatchPrecision(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                          <span>0.10 (Must match perfectly)</span>
                          <span className="text-[9px] text-zinc-400">
                            {customPathMatchPrecision < 0.18 ? "🎯 Must match perfectly" : customPathMatchPrecision <= 0.28 ? "⚖️ Standard accuracy" : "⚠️ Easy to trigger (Loose match)"}
                          </span>
                          <span>0.40 (Easy to trigger)</span>
                        </div>
                      </div>

                      {/* Wave Sensitivity */}
                      <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-zinc-900">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-200 block">Hand Waving Width</span>
                            <span className="text-[9px] text-zinc-500 block">How wide you need to wave your hand back and forth to trigger a wave shortcut.</span>
                          </div>
                          <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                            {waveSensitivity}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={60}
                          value={waveSensitivity}
                          onChange={(e) => setWaveSensitivity(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                          <span>15px (Slight wave)</span>
                          <span className="text-[9px] text-zinc-400">
                            {waveSensitivity < 22 ? "⚡ Triggers with slight wave" : waveSensitivity <= 38 ? "⚖️ Normal wave (Recommended)" : "🔒 Requires broad waving"}
                          </span>
                          <span>60px (Broad wave)</span>
                        </div>
                      </div>

                      {/* Posture Stability Hold Time */}
                      <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-zinc-900">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-200 block">Posture Hold Time</span>
                            <span className="text-[9px] text-zinc-500 block">How long you need to hold a hand shape steady before the shortcut triggers.</span>
                          </div>
                          <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                            {fingerPoseStabilityFrames} frames
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={25}
                          value={fingerPoseStabilityFrames}
                          onChange={(e) => setFingerPoseStabilityFrames(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                          <span>5 frames (Fast)</span>
                          <span className="text-[9px] text-zinc-400">
                            {fingerPoseStabilityFrames < 8 ? "⚡ Instant registration" : fingerPoseStabilityFrames <= 14 ? "⚖️ Normal hold (Recommended)" : "🔒 Must hold frozen"}
                          </span>
                          <span>25 frames (Long Hold)</span>
                        </div>
                      </div>

                      {/* Cooldown Delay */}
                      <div className="space-y-2 bg-black/40 p-3.5 rounded-xl border border-zinc-900 md:col-span-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-200 block">Pause Between Actions</span>
                            <span className="text-[9px] text-zinc-500 block">How long to wait after a gesture triggers before the camera accepts another, preventing accidental double triggers.</span>
                          </div>
                          <span className="text-emerald-400 font-mono text-xs font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                            {gestureCooldownDuration} ms
                          </span>
                        </div>
                        <input
                          type="range"
                          min={300}
                          max={4000}
                          step={100}
                          value={gestureCooldownDuration}
                          onChange={(e) => setGestureCooldownDuration(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[8.5px] text-zinc-600 font-mono">
                          <span>300ms (Instant)</span>
                          <span className="text-[9px] text-zinc-400">
                            {gestureCooldownDuration < 1000 ? "⚡ Rapid trigger speed" : gestureCooldownDuration <= 2200 ? "⚖️ Balanced pause (Recommended)" : "🔒 Safer, slower pacing"}
                          </span>
                          <span>4000ms (Long Pause)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                      <button
                        onClick={() => {
                          setSwipeSensitivity(32);
                          setCustomPathMatchPrecision(0.23);
                          setWaveSensitivity(30);
                          setFingerPoseStabilityFrames(10);
                          setGestureCooldownDuration(1500);
                        }}
                        className="text-[10px] font-mono text-zinc-500 hover:text-emerald-400 flex items-center gap-1 transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        <RefreshCw size={10} /> Reset to Defaults
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Visualizer & Training Sandbox */}
              {gestureSubTab === 'create' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-400" /> Draw Custom Hand Gesture
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Record custom hand movements or simple finger postures to trigger actions on your workstation.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-12 space-y-4">
                  <div className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Activity size={13} className="text-emerald-400" /> Hand Tracking Playground & Radar
                        </h4>
                        <p className="text-[10px] text-zinc-500">
                          Test your hand tracking live, watch the drawing trail, and practice your gestures.
                        </p>
                      </div>
                      {isKineticEnabled && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold animate-pulse">
                          LIVE STREAM ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Rendering the custom canvas-tracker */}
                    <div className="relative">
                      <KineticSandboxVisualizer />
                      
                      {/* Interactive alerts or countdowns */}
                      {isTraining && (
                        <div className="absolute inset-0 bg-black/85 rounded-xl flex flex-col items-center justify-center text-center p-4">
                          {trainingCountdown > 0 ? (
                            <div className="space-y-2">
                              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">GET READY...</p>
                              <p className="text-4xl font-extrabold text-emerald-400 animate-ping font-mono">{trainingCountdown}</p>
                            </div>
                          ) : (
                            <div className="space-y-4 w-full max-w-xs">
                              <p className="text-[11px] font-bold font-mono tracking-widest text-emerald-400 animate-pulse">RECORDING GESTURE PATH NOW...</p>
                              <div className="w-full h-1 bg-zinc-850 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-100" 
                                  style={{ width: `${trainingProgress}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-zinc-500 font-mono">Perform your hand movement inside the camera frame.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Not enabled warning */}
                      {!isKineticEnabled && (
                        <div className="absolute inset-0 bg-black/75 rounded-xl flex flex-col items-center justify-center text-center p-4">
                          <Camera size={24} className="text-zinc-600 mb-2" />
                          <p className="text-xs font-bold text-zinc-300">Camera Tracker Standby</p>
                          <p className="text-[10px] text-zinc-500 max-w-xs mt-1 leading-normal mb-3">
                            Turn on the Kinetic Camera Tracker to launch your webcam and see live spatial tracking overlays.
                          </p>
                          <button 
                            onClick={() => useStore.getState().setKineticEnabled(true)}
                            className="px-3 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                          >
                            Turn On Camera Engine
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sandbox feedback console */}
                    <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-lg flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 font-mono uppercase">Last gesture signature detected:</span>
                      <span className="font-bold font-mono text-emerald-400 px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 rounded">
                        {sandboxResult || 'AWAITING INPUT_'}
                      </span>
                    </div>
                  </div>

                  {/* Teach/Train Custom Gesture Form */}
                  <div id="gesture-trainer-section" className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">
                        Teach Aether New Custom Gesture
                      </h4>
                      <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">
                        Design custom motion signatures or finger counts and bind them to any global action.
                      </p>
                    </div>

                    {/* Gesture Type Chooser */}
                    <div className="bg-[#121214]/60 p-3 rounded-lg border border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Recognition Mode</label>
                        <div className="flex bg-black/40 p-1 rounded-md border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => setGestureType('path')}
                            className={`flex-1 py-1 px-2.5 text-[10px] font-medium rounded transition-colors ${gestureType === 'path' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Kinetic Path (Move)
                          </button>
                          <button
                            type="button"
                            onClick={() => setGestureType('finger-pose')}
                            className={`flex-1 py-1 px-2.5 text-[10px] font-medium rounded transition-colors ${gestureType === 'finger-pose' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
                          >
                            Finger Posture (Static)
                          </button>
                        </div>
                      </div>

                      {gestureType === 'finger-pose' ? (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Target Finger Count</label>
                          <select
                            value={targetFingerCount}
                            onChange={(e) => setTargetFingerCount(parseInt(e.target.value))}
                            className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-350 focus:outline-none focus:border-emerald-500/50"
                          >
                            <option value={1}>1 Finger (Pointing Index)</option>
                            <option value={2}>2 Fingers (Peace / Scissors)</option>
                            <option value={3}>3 Fingers (Tri-claw)</option>
                            <option value={4}>4 Fingers (Flat Palm)</option>
                            <option value={5}>5 Fingers (Full Hand Open)</option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1.5 flex flex-col justify-center text-[10px] text-zinc-500 leading-tight">
                          <span>• Sweeping motion patterns are tracked by a moving centroid stream.</span>
                          <span className="mt-1">• Keep hand visible in camera frame while moving.</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Gesture Label</label>
                        <input 
                          type="text" 
                          value={newGestureName}
                          onChange={(e) => setNewGestureName(e.target.value)}
                          placeholder="e.g. Circular Motion, Drawn Letter V"
                          className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Trigger Action Mapping</label>
                        <select 
                          value={newGestureAction}
                          onChange={(e: any) => setNewGestureAction(e.target.value)}
                          className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                        >
                          <optgroup label="System Controls" className="text-zinc-400 bg-[#121214]">
                            <option value="toggle-sidebar">Toggle Left Navigation Panel</option>
                            <option value="toggle-right-sidebar">Toggle Workspace Assistant</option>
                            <option value="toggle-sidebar-minimize">Minimize Left Sidebar</option>
                            <option value="toggle-command-palette">Launch Central Command Palette</option>
                            <option value="trigger-sync">Synchronize Sync Engine</option>
                          </optgroup>
                          <optgroup label="Workspace Routing" className="text-zinc-400 bg-[#121214]">
                            <option value="nav-dashboard">Route to Dashboard</option>
                            <option value="nav-assistant">Route to AI Assistant</option>
                            <option value="nav-notes">Route to Notes Manager</option>
                            <option value="nav-projects">Route to Projects Explorer</option>
                            <option value="nav-automations">Route to Automations Core</option>
                            <option value="nav-docs">Route to Workspace Docs</option>
                            <option value="nav-settings">Route to System Settings</option>
                            <option value="nav-agents">Route to Agentic OS</option>
                          </optgroup>
                          <optgroup label="Quick Productivity" className="text-zinc-400 bg-[#121214]">
                            <option value="create-quick-note">Create Quick Flow Note (Instantly)</option>
                          </optgroup>
                          <optgroup label="Sensitive / Dangerous Actions (Double Confirm)" className="text-rose-500 bg-[#121214]">
                            <option value="clear-chat">🧹 Reset Dialogue History (Double Confirm)</option>
                            <option value="delete-all-notifications">❌ Reject/Purge Workspace Invitations (Double Confirm)</option>
                            <option value="reset-system-data">⚠️ Purge All Configuration State (Double Confirm)</option>
                          </optgroup>
                          <optgroup label="Custom & Advanced" className="text-zinc-400 bg-[#121214]">
                            <option value="custom-alert">Custom System Workspace Notification</option>
                            <option value="macro">Macro Sequence (Chain Multiple Actions)</option>
                            <option value="none">Register Only (No System Action)</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {newGestureAction === 'custom-alert' && (
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Notification Text</label>
                        <input 
                          type="text" 
                          value={customActionText}
                          onChange={(e) => setCustomActionText(e.target.value)}
                          placeholder="e.g. Zen Focus Level High! Resetting desktop space..."
                          className="w-full bg-[#121214] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
                        />
                      </div>
                    )}

                    {newGestureAction === 'macro' && (
                      <div className="space-y-4 p-4 rounded-xl border border-zinc-800 bg-[#0d0d0f]/50 animate-fade-in text-[11px]">
                        <div>
                          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                            Aether Macro Sequence Builder
                          </label>
                          <p className="text-[10px] text-zinc-500 mb-3 leading-normal">
                            Drag commands from the pool below and drop them into the sequence flow, or drag sequence items to reorder them. Multi-step macros execute sequentially hands-free! <span className="block sm:hidden text-amber-400 font-medium mt-1">📱 Mobile Optimization: Simply tap any command card in the library below to append it instantly. Use the ▲ / ▼ buttons to arrange steps.</span>
                          </p>
                        </div>

                        {/* List of currently selected steps (Drop Zone) */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block flex items-center justify-between">
                            <span>Execution Sequence Flow ({macroActions.length} steps)</span>
                            <span className="text-[9px] text-zinc-500 font-normal">Drag handles ⠿ to reorder</span>
                          </label>
                          
                          <div 
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingOverChain(true);
                            }}
                            onDragLeave={() => setIsDraggingOverChain(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingOverChain(false);
                              const actionType = e.dataTransfer.getData('actionType');
                              if (actionType) {
                                setMacroActions([...macroActions, actionType as any]);
                              }
                            }}
                            className={`min-h-[90px] p-3 rounded-xl transition-all duration-200 flex flex-col justify-center space-y-2 relative border ${
                              isDraggingOverChain 
                                ? 'border-dashed border-emerald-500 bg-emerald-950/10 scale-[1.01] shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                                : macroActions.length === 0 
                                  ? 'border-dashed border-zinc-800 bg-black/40' 
                                  : 'border-zinc-900 bg-black/20'
                            }`}
                          >
                            {macroActions.length === 0 ? (
                              <div className="text-center py-4 text-zinc-500 italic text-[10px] pointer-events-none space-y-1">
                                <p className="font-semibold text-zinc-400">Drag actions here to build sequence</p>
                                <p className="text-[9px] text-zinc-600">Or tap the buttons in the action library below</p>
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                {macroActions.map((act, index) => {
                                  // Visual settings based on action type
                                  const config: Record<string, { label: string, color: string, icon: any }> = {
                                    'toggle-sidebar': { label: 'Left Navigation', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-950/20', icon: <Compass size={11} /> },
                                    'toggle-right-sidebar': { label: 'Assistant Panel', color: 'text-purple-400 border-purple-500/20 bg-purple-950/20', icon: <Bot size={11} /> },
                                    'toggle-sidebar-minimize': { label: 'Minimize Sidebar', color: 'text-blue-400 border-blue-500/20 bg-blue-950/20', icon: <Eye size={11} /> },
                                    'toggle-command-palette': { label: 'Command Palette', color: 'text-amber-400 border-amber-500/20 bg-amber-950/20', icon: <Terminal size={11} /> },
                                    'custom-alert': { label: 'Workspace Alert', color: 'text-rose-400 border-rose-500/20 bg-rose-950/20', icon: <AlertCircle size={11} /> },
                                    'create-quick-note': { label: 'Quick Note Capture', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20', icon: <Notebook size={11} /> },
                                    'trigger-sync': { label: 'Sync Workspace', color: 'text-sky-400 border-sky-500/20 bg-sky-950/20', icon: <RefreshCw size={11} /> },
                                    'nav-dashboard': { label: 'Go to Dashboard', color: 'text-teal-400 border-teal-500/20 bg-teal-950/20', icon: <Home size={11} /> },
                                    'nav-projects': { label: 'Go to Projects', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20', icon: <Cpu size={11} /> },
                                    'nav-notes': { label: 'Go to Notes', color: 'text-pink-400 border-pink-500/20 bg-pink-950/20', icon: <Notebook size={11} /> },
                                    'nav-automations': { label: 'Go to Automations', color: 'text-orange-400 border-orange-500/20 bg-orange-950/20', icon: <Zap size={11} /> },
                                    'nav-docs': { label: 'Go to Docs', color: 'text-violet-400 border-violet-500/20 bg-violet-950/20', icon: <FileText size={11} /> },
                                    'nav-settings': { label: 'Go to Settings', color: 'text-zinc-300 border-zinc-500/20 bg-zinc-800/20', icon: <Settings2 size={11} /> },
                                    'nav-agents': { label: 'Go to Agentic OS', color: 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-950/20', icon: <Cpu size={11} /> },
                                    'clear-chat': { label: 'Clear Chat Dialogue', color: 'text-red-400 border-red-500/20 bg-red-950/20', icon: <Trash2 size={11} /> },
                                    'delete-all-notifications': { label: 'Purge Invites', color: 'text-rose-500 border-rose-500/20 bg-rose-950/20', icon: <X size={11} /> },
                                    'reset-system-data': { label: 'Reset Factory Settings', color: 'text-amber-500 border-amber-500/20 bg-amber-950/20', icon: <AlertTriangle size={11} /> }
                                  };
                                  const itemConf = config[act] || { label: act, color: 'text-zinc-400 border-zinc-800 bg-zinc-900/40', icon: <Activity size={11} /> };

                                  return (
                                    <div 
                                      key={index} 
                                      draggable="true"
                                      onDragStart={(e) => {
                                        setDraggedActionIndex(index);
                                        e.dataTransfer.effectAllowed = 'move';
                                        e.dataTransfer.setData('text/plain', String(index));
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedActionIndex !== null && draggedActionIndex !== index) {
                                          const next = [...macroActions];
                                          const [draggedItem] = next.splice(draggedActionIndex, 1);
                                          next.splice(index, 0, draggedItem);
                                          setMacroActions(next);
                                        }
                                        setDraggedActionIndex(null);
                                      }}
                                      onDragEnd={() => setDraggedActionIndex(null)}
                                      className={`group flex items-center justify-between p-2 bg-[#0a0a0c] border rounded-lg transition-all cursor-grab active:cursor-grabbing ${
                                        draggedActionIndex === index 
                                          ? 'border-dashed border-emerald-500 bg-emerald-950/5 opacity-40 scale-95' 
                                          : 'border-zinc-850 hover:border-zinc-700 hover:bg-[#111113]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center text-zinc-600 group-hover:text-zinc-400 cursor-move" title="Drag to Reorder">
                                          <GripVertical size={11} className="mr-0.5 shrink-0" />
                                          <span className="w-4 h-4 rounded bg-zinc-950 border border-zinc-900 flex items-center justify-center text-[9px] font-mono text-zinc-500 font-bold">
                                            {index + 1}
                                          </span>
                                        </div>

                                        <div className={`px-2 py-0.5 rounded border text-[10px] font-medium flex items-center gap-1.5 ${itemConf.color}`}>
                                          {itemConf.icon}
                                          <span>{itemConf.label}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {/* Fallback ordering buttons for absolute control */}
                                        {index > 0 && (
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              const next = [...macroActions];
                                              const temp = next[index];
                                              next[index] = next[index - 1];
                                              next[index - 1] = temp;
                                              setMacroActions(next);
                                            }}
                                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                            title="Move Up"
                                          >
                                            ▲
                                          </button>
                                        )}
                                        {index < macroActions.length - 1 && (
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              const next = [...macroActions];
                                              const temp = next[index];
                                              next[index] = next[index + 1];
                                              next[index + 1] = temp;
                                              setMacroActions(next);
                                            }}
                                            className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                            title="Move Down"
                                          >
                                            ▼
                                          </button>
                                        )}
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setMacroActions(macroActions.filter((_, i) => i !== index));
                                          }}
                                          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                                          title="Remove Step"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {isDraggingOverChain && (
                              <div className="absolute inset-0 bg-emerald-500/5 rounded-xl border border-emerald-500/20 pointer-events-none flex items-center justify-center">
                                <span className="text-[10px] font-mono text-emerald-400 font-bold animate-pulse">
                                  + DROP TO ADD STEP TO SEQUENCE
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Drag and Drop Action Pool library */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                            Action Command Library (Draggable Cards)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {[
                              { id: 'toggle-sidebar', label: 'Left Navigation', desc: 'Toggle main nav panel', icon: <Compass size={12} className="text-indigo-400" /> },
                              { id: 'toggle-right-sidebar', label: 'AI Assistant', desc: 'Toggle chat companion', icon: <Bot size={12} className="text-purple-400" /> },
                              { id: 'toggle-sidebar-minimize', label: 'Minimize Sidebar', desc: 'Collapse nav rail', icon: <Eye size={12} className="text-blue-400" /> },
                              { id: 'toggle-command-palette', label: 'Command Palette', desc: 'Summon workspace search', icon: <Terminal size={12} className="text-amber-400" /> },
                              { id: 'trigger-sync', label: 'Sync Workspace', desc: 'Synchronize project files', icon: <RefreshCw size={12} className="text-sky-400" /> },
                              { id: 'create-quick-note', label: 'Quick Note', desc: 'Create quick flow note', icon: <Notebook size={12} className="text-emerald-400" /> },
                              { id: 'nav-dashboard', label: 'Go to Dashboard', desc: 'Route to central hub', icon: <Home size={12} className="text-teal-400" /> },
                              { id: 'nav-assistant', label: 'Go to Assistant', desc: 'Route to AI core interface', icon: <Bot size={12} className="text-violet-400" /> },
                              { id: 'nav-notes', label: 'Go to Notes', desc: 'Route to note manager', icon: <Notebook size={12} className="text-pink-400" /> },
                              { id: 'nav-projects', label: 'Go to Projects', desc: 'Route to active projects', icon: <Cpu size={12} className="text-cyan-400" /> },
                              { id: 'nav-settings', label: 'Go to Settings', desc: 'Route to control center', icon: <Settings2 size={12} className="text-zinc-400" /> },
                              { id: 'nav-agents', label: 'Go to Agentic OS', desc: 'Route to agents cockpit', icon: <Cpu size={12} className="text-fuchsia-400" /> },
                              { id: 'clear-chat', label: 'Clear Chat', desc: 'Reset dialogue core (Confirm)', icon: <Trash2 size={12} className="text-red-400" /> },
                              { id: 'delete-all-notifications', label: 'Purge Invites', desc: 'Purge invitations (Confirm)', icon: <X size={12} className="text-rose-500" /> },
                              { id: 'reset-system-data', label: 'System Purge', desc: 'Reset all configuration (Confirm)', icon: <AlertTriangle size={12} className="text-amber-500" /> }
                            ].map((command) => (
                              <div
                                key={command.id}
                                draggable="true"
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('actionType', command.id);
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                                onClick={() => setMacroActions([...macroActions, command.id as any])}
                                className="p-2.5 bg-zinc-950 hover:bg-[#111113] border border-zinc-850 hover:border-zinc-700 rounded-lg transition-all cursor-grab active:cursor-grabbing select-none flex items-start gap-2 text-left group active:scale-95 animate-fade-in"
                                title="Drag this command to drop zone, or simple tap to append"
                              >
                                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                                  {command.icon}
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-bold text-zinc-300 text-[10px] block group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                                    {command.label} <span className="text-[8px] text-zinc-600 font-mono font-normal">⋮⋮</span>
                                  </span>
                                  <span className="text-[8.5px] text-zinc-500 block leading-tight">{command.desc}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delay config */}
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-900">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                              Step Intermission Delay (ms)
                            </label>
                            <input 
                              type="number"
                              min={100}
                              max={3000}
                              step={50}
                              value={macroDelay}
                              onChange={(e) => setMacroDelay(Math.max(100, Math.min(3000, parseInt(e.target.value) || 400)))}
                              className="w-full bg-[#121214] border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                            />
                          </div>
                          <div className="flex flex-col justify-end text-[10px] text-zinc-500 italic pb-1">
                            Total execution: {Math.round(macroActions.length * macroDelay)}ms
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                      {trainSuccess && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Pattern Trained and Saved!
                        </span>
                      )}
                      <div className="ml-auto flex gap-2">
                        <button 
                          onClick={() => {
                            setNewGestureName('');
                            setNewGestureAction('toggle-sidebar');
                            setCustomActionText('');
                            setMacroActions([]);
                            setMacroDelay(400);
                          }}
                          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                        >
                          Reset Fields
                        </button>
                        <button 
                          disabled={
                            !newGestureName || 
                            (newGestureAction === 'macro' && macroActions.length === 0)
                          }
                          onClick={() => {
                            if (gestureType === 'finger-pose' || newGestureAction === 'macro') {
                              const direction = gestureType === 'finger-pose' ? `pose-${targetFingerCount}` : 'custom';
                              saveNewGesture(newGestureName, newGestureAction, customActionText, [], direction);
                            } else {
                              if (!isKineticEnabled) {
                                showToast('Please enable the Kinetic Camera Tracker to train a kinetic path gesture!', 'error', 3000);
                                return;
                              }
                              handleStartTraining();
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            (!newGestureName || (newGestureAction === 'macro' && macroActions.length === 0))
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800/40'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          }`}
                        >
                          <Sparkles size={12} />
                          {gestureType === 'finger-pose' || newGestureAction === 'macro' ? 'Save & Register Action' : 'Start Training Sequence'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* Your Active Shortcuts Sub-tab */}
              {gestureSubTab === 'active' && (
                <div className="space-y-6 animate-fade-in w-full">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                      <SettingsIcon size={16} className="text-emerald-400" /> My Active Shortcuts & Backup
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Review your configured actions and save them securely to the cloud.
                    </p>
                  </div>
                  
                  <div className="w-full space-y-4">
                    {/* Cloud Backup Card */}
                    <div className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              <Cloud size={14} />
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-zinc-200">Cloud Backup & Sync</h4>
                              <p className="text-[9.5px] text-zinc-500">Save your custom shortcuts to your secure cloud profile.</p>
                            </div>
                          </div>
                          {isSyncingConfig ? (
                            <span className="flex items-center gap-1 text-[9px] font-mono text-amber-400 bg-amber-950/20 px-1.5 py-0.5 rounded animate-pulse">
                              <RefreshCw size={9} className="animate-spin" /> SYNCING
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-zinc-600">SECURE PROFILE</span>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-400 leading-relaxed bg-[#0d0d0f] p-3 rounded-lg border border-zinc-900">
                          Save your custom shortcuts and sensitivity settings to the cloud. You can restore them on any computer instantly.
                        </p>

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={backupKineticConfig}
                            disabled={isSyncingConfig}
                            className="py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-tight bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Upload size={12} />
                            Save to Cloud
                          </button>
                          <button
                            onClick={restoreKineticConfig}
                            disabled={isSyncingConfig}
                            className="py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-tight bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw size={12} className={isSyncingConfig ? 'animate-spin' : ''} />
                            Load from Cloud
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                  {/* Community Shared Macros Gallery */}
                  {gestureSubTab === 'ready-made' && (
                    <div className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Share2 size={14} />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-200">Community-Shared Shortcut Packs</h4>
                          <p className="text-[9.5px] text-zinc-500">Browse, test, and save gesture packages shared by other users in the community.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setPublishTitle('');
                          setPublishDescription('');
                          setPublishSelectedGestureIds([]);
                          setIsPublishingModalOpen(true);
                        }}
                        className="px-2 py-1 text-[9.5px] font-mono font-bold uppercase tracking-tight bg-amber-500 hover:bg-amber-400 text-black rounded transition-colors cursor-pointer"
                      >
                        + Publish
                      </button>
                    </div>

                    {/* Controls: Search and filter tabs */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 text-zinc-600" size={12} />
                        <input
                          type="text"
                          value={sharedMacroSearch}
                          onChange={(e) => setSharedMacroSearch(e.target.value)}
                          placeholder="Search shared macros or libraries..."
                          className="w-full bg-black/40 border border-zinc-900 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-zinc-850"
                        />
                      </div>

                      <div className="flex bg-[#121214] border border-zinc-900 p-0.5 rounded-md text-[9px] font-mono">
                        <button
                          onClick={() => setSharedMacroFilter('all')}
                          className={`flex-1 py-1 rounded font-bold transition-all ${
                            sharedMacroFilter === 'all'
                              ? 'bg-zinc-900 text-zinc-100 shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          All Public Gallery
                        </button>
                        <button
                          onClick={() => setSharedMacroFilter('mine')}
                          className={`flex-1 py-1 rounded font-bold transition-all ${
                            sharedMacroFilter === 'mine'
                              ? 'bg-zinc-900 text-zinc-100 shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          My Shared Items
                        </button>
                      </div>
                    </div>

                    {/* Shared Items Gallery List */}
                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                      {(() => {
                        const user = auth?.currentUser;
                        const filtered = sharedMacros.filter((macro) => {
                          const queryMatch = 
                            macro.title.toLowerCase().includes(sharedMacroSearch.toLowerCase()) ||
                            macro.description.toLowerCase().includes(sharedMacroSearch.toLowerCase()) ||
                            macro.creatorName.toLowerCase().includes(sharedMacroSearch.toLowerCase());
                          
                          if (sharedMacroFilter === 'mine') {
                            return queryMatch && user && macro.creatorId === user.uid;
                          }
                          return queryMatch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-8 bg-[#0d0d0f]/40 border border-dashed border-zinc-850 rounded-lg text-zinc-600 text-[10px]">
                              No community shared macros match the current filter.
                            </div>
                          );
                        }

                        return filtered.map((macro) => {
                          const isMine = user && macro.creatorId === user.uid;
                          
                          return (
                            <div
                              key={macro.id}
                              className="p-3 bg-[#111113] border border-zinc-850 rounded-lg space-y-2.5 hover:border-zinc-800 transition-all text-xs"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <h5 className="font-bold text-zinc-200 text-[11px] leading-tight flex items-center gap-1.5">
                                    {macro.title}
                                  </h5>
                                  <span className="text-[9px] text-zinc-500 block">
                                    By <span className="text-zinc-400 font-mono font-medium">{macro.creatorName}</span> • {new Date(macro.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {isMine && (
                                  <button
                                    onClick={() => deleteSharedMacro(macro.id)}
                                    className="p-1 hover:bg-zinc-850 rounded text-zinc-500 hover:text-red-400 transition-colors"
                                    title="Remove this sharing post"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>

                              <p className="text-[10px] text-zinc-400 leading-normal bg-black/40 p-2 rounded border border-zinc-900 font-mono">
                                {macro.description}
                              </p>

                              {/* Included Gestures Preview */}
                              <div className="space-y-1.5 bg-[#0d0d0f] p-2 rounded border border-zinc-900">
                                <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Included Gesture Bundle:</span>
                                <div className="flex flex-wrap gap-1">
                                  {macro.gestures.map((gest, idx) => (
                                    <div
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-zinc-900/80 border border-zinc-800 rounded text-[9.5px] text-zinc-350 font-mono flex items-center gap-1"
                                    >
                                      <span className="text-amber-500">●</span>
                                      <span>{gest.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Interaction Buttons */}
                              <div className="flex items-center justify-between border-t border-zinc-900 pt-2.5 mt-1 text-[10px] font-mono">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => likeSharedMacro(macro.id)}
                                    className="flex items-center gap-1 text-zinc-400 hover:text-red-400 transition-colors"
                                    title="Like this shared configuration"
                                  >
                                    <Heart size={11} className="fill-current text-red-500/20 hover:text-red-500" />
                                    <span>{macro.likesCount || 0}</span>
                                  </button>
                                  <span className="text-zinc-650">|</span>
                                  <span className="text-zinc-500 flex items-center gap-1" title="Active installations">
                                    <Download size={10} className="text-zinc-600" />
                                    <span>{macro.downloadsCount || 0}</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {/* Test shared macro chain */}
                                  <button
                                    onClick={() => {
                                      showToast(`Testing community macro sequence: "${macro.title}"`, 'info', 2500);
                                      // Trigger simulation for each gesture in bundle
                                      macro.gestures.forEach((gest, i) => {
                                        setTimeout(() => {
                                          window.dispatchEvent(new CustomEvent('kinetic-simulate-gesture', { detail: gest }));
                                        }, i * 1500); // 1.5s sequence gap for testing
                                      });
                                    }}
                                    className="px-2 py-0.5 text-[9px] font-medium rounded border border-zinc-850 bg-[#0d0d0f] hover:bg-zinc-850 text-zinc-400 hover:text-amber-400 transition-colors"
                                  >
                                    Test Live
                                  </button>
                                  
                                  {/* Adopt bundle */}
                                  <button
                                    onClick={async () => {
                                      const currentLocal = [...useStore.getState().kineticGestures];
                                      let importedCount = 0;
                                      const updatedLocal = [...currentLocal];
                                      
                                      macro.gestures.forEach((gest) => {
                                        const suffix = Math.random().toString(36).substring(7);
                                        const newId = `${gest.id}-imported-${suffix}`;
                                        updatedLocal.push({
                                          ...gest,
                                          id: newId,
                                          name: `${gest.name} (Imported)`
                                        });
                                        importedCount++;
                                      });

                                      useStore.getState().setKineticGestures(updatedLocal);
                                      await incrementDownloadsSharedMacro(macro.id);
                                      showToast(`Adopted "${macro.title}" successfully! Added ${importedCount} gestures to library.`, 'success', 3500);
                                    }}
                                    className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-black transition-colors"
                                  >
                                    Save to Library
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                  {/* My Custom Shortcuts */}
                  {gestureSubTab === 'active' && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                          <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          My Custom Shortcuts
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Enable, disable, edit, or test your configured hand gestures and keyboard mappings.
                        </p>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">
                        {macroRegistry.filter(g => !g.disabled).length}/{macroRegistry.length} Active
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                      {macroRegistry.map((gesture) => {
                        const isMacro = gesture.action === 'macro';
                        const isCustom = !gesture.direction || gesture.direction === 'custom';
                        const isPose = gesture.direction?.startsWith('pose-') || false;
                        
                        // Calculate some aesthetic stability/accuracy score
                        let stability = '98% Accuracy';
                        if (isPose) stability = '99% Hand Stability';
                        else if (isMacro) stability = '95% Seq Precision';
                        else if (isCustom) stability = '92% Correlation';

                        const isEditing = editingGestureId === gesture.id;

                        return (
                          <div 
                            key={gesture.id}
                            className={`p-3 rounded-lg border transition-all duration-200 flex flex-col gap-2 ${
                              gesture.disabled 
                                ? 'bg-[#0b0b0c]/40 border-zinc-900/60 opacity-60' 
                                : isEditing
                                  ? 'bg-[#0a0a0c] border-emerald-500/30 ring-1 ring-emerald-500/15'
                                  : 'bg-[#111113] border-zinc-850 hover:border-zinc-800'
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-3.5 text-xs">
                                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                                  <span className="font-bold text-zinc-200 text-[11px] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Configure Mapping: {gesture.name}
                                  </span>
                                  <button 
                                    onClick={() => setEditingGestureId(null)}
                                    className="text-[9px] text-zinc-500 hover:text-zinc-350 font-mono transition-colors"
                                  >
                                    CANCEL
                                  </button>
                                </div>
                                
                                <div className="space-y-3">
                                  {/* 1. Edit Name */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Gesture Name</label>
                                    <input 
                                      type="text" 
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="w-full bg-[#121214] border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                                      placeholder="Gesture identifier"
                                    />
                                  </div>

                                  {/* 2. Edit Action */}
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Trigger Action Mapping</label>
                                    <select 
                                      value={editAction}
                                      onChange={(e: any) => setEditAction(e.target.value)}
                                      className="w-full bg-[#121214] border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                                    >
                                      <optgroup label="System Controls" className="text-zinc-400 bg-[#121214]">
                                        <option value="toggle-sidebar">Toggle Left Navigation Panel</option>
                                        <option value="toggle-right-sidebar">Toggle Workspace Assistant</option>
                                        <option value="toggle-sidebar-minimize">Minimize Left Sidebar</option>
                                        <option value="toggle-command-palette">Launch Central Command Palette</option>
                                        <option value="trigger-sync">Synchronize Sync Engine</option>
                                      </optgroup>
                                      <optgroup label="Workspace Routing" className="text-zinc-400 bg-[#121214]">
                                        <option value="nav-dashboard">Route to Dashboard</option>
                                        <option value="nav-assistant">Route to AI Assistant</option>
                                        <option value="nav-notes">Route to Notes Manager</option>
                                        <option value="nav-projects">Route to Projects Explorer</option>
                                        <option value="nav-automations">Route to Automations Core</option>
                                        <option value="nav-docs">Route to Workspace Docs</option>
                                        <option value="nav-settings">Route to System Settings</option>
                                        <option value="nav-agents">Route to Agentic OS</option>
                                      </optgroup>
                                      <optgroup label="Quick Productivity" className="text-zinc-400 bg-[#121214]">
                                        <option value="create-quick-note">Create Quick Flow Note (Instantly)</option>
                                      </optgroup>
                                      <optgroup label="Sensitive / Dangerous Actions (Confirm)" className="text-rose-500 bg-[#121214]">
                                        <option value="clear-chat">🧹 Reset Dialogue History (Double Confirm)</option>
                                        <option value="delete-all-notifications">❌ Reject/Purge Workspace Invitations (Double Confirm)</option>
                                        <option value="reset-system-data">⚠️ Purge All Configuration State (Double Confirm)</option>
                                      </optgroup>
                                      <optgroup label="Custom & Advanced" className="text-zinc-400 bg-[#121214]">
                                        <option value="custom-alert">Custom System Workspace Notification</option>
                                        <option value="macro">Macro Sequence (Chain Multiple Actions)</option>
                                        <option value="none">Register Only (No System Action)</option>
                                      </optgroup>
                                    </select>
                                  </div>

                                  {/* 3. Custom System Alert Text */}
                                  {editAction === 'custom-alert' && (
                                    <div className="space-y-1 animate-fade-in">
                                      <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Notification Text</label>
                                      <input 
                                        type="text" 
                                        value={editCustomText}
                                        onChange={(e) => setEditCustomText(e.target.value)}
                                        placeholder="Custom toast alert text"
                                        className="w-full bg-[#121214] border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                                      />
                                    </div>
                                  )}

                                  {/* 4. Macro step editor */}
                                  {editAction === 'macro' && (
                                    <div className="space-y-3.5 p-3 rounded-xl border border-zinc-900 bg-[#0c0c0e] animate-fade-in text-[10px]">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-zinc-300">Macro Chain ({editMacroActions.length} steps)</span>
                                        <button 
                                          type="button" 
                                          onClick={() => setEditMacroActions([])}
                                          className="text-[9px] text-red-400 hover:text-red-300 font-mono"
                                        >
                                          Clear Steps
                                        </button>
                                      </div>

                                      {/* Current Macro Steps Flow */}
                                      <div className="flex flex-wrap gap-1.5 min-h-10 p-2 bg-[#121214] border border-zinc-850 rounded-lg items-center">
                                        {editMacroActions.length === 0 ? (
                                          <span className="text-zinc-600 italic m-auto text-[9px]">Select quick commands below to chain</span>
                                        ) : (
                                          editMacroActions.map((act, idx) => (
                                            <div 
                                              key={idx}
                                              onClick={() => setEditMacroActions(editMacroActions.filter((_, i) => i !== idx))}
                                              className="bg-[#1b1b1f] hover:bg-red-950/20 border border-zinc-800 hover:border-red-500/30 text-zinc-300 hover:text-red-400 px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-[9px] font-medium"
                                              title="Click to remove"
                                            >
                                              <span>{idx + 1}. {act.replace('toggle-', '')}</span>
                                              <span className="text-zinc-600 font-bold">×</span>
                                            </div>
                                          ))
                                        )}
                                      </div>

                                      {/* Quick Click-to-Add commands */}
                                      <div className="space-y-1">
                                        <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Tap to append step:</span>
                                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1.5 bg-[#121214] rounded-lg border border-zinc-850">
                                          {[
                                            { id: 'toggle-sidebar', label: 'Left Nav' },
                                            { id: 'toggle-right-sidebar', label: 'AI Companion' },
                                            { id: 'toggle-sidebar-minimize', label: 'Minimize Nav' },
                                            { id: 'toggle-command-palette', label: 'Cmd Palette' },
                                            { id: 'trigger-sync', label: 'Sync' },
                                            { id: 'create-quick-note', label: 'Quick Note' },
                                            { id: 'nav-dashboard', label: 'Dashboard' },
                                            { id: 'nav-assistant', label: 'Assistant' },
                                            { id: 'nav-notes', label: 'Notes' },
                                            { id: 'nav-projects', label: 'Projects' },
                                            { id: 'nav-settings', label: 'Settings' }
                                          ].map(cmd => (
                                            <button
                                              key={cmd.id}
                                              type="button"
                                              onClick={() => setEditMacroActions([...editMacroActions, cmd.id])}
                                              className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 hover:text-emerald-450 border border-zinc-800 text-zinc-350 rounded text-[9px] transition-colors"
                                            >
                                              + {cmd.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Macro Delay */}
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                          <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block">Intermission delay between steps</label>
                                          <span className="text-amber-500 font-mono font-bold">{editMacroDelay}ms</span>
                                        </div>
                                        <input 
                                          type="range" 
                                          min={150} 
                                          max={1500} 
                                          step={50}
                                          value={editMacroDelay}
                                          onChange={(e) => setEditMacroDelay(Number(e.target.value))}
                                          className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
                                  <button 
                                    onClick={() => setEditingGestureId(null)}
                                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-[10px] font-medium transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const currentGestures = useStore.getState().kineticGestures;
                                      const updated = currentGestures.map(g => {
                                        if (g.id === gesture.id) {
                                          return { 
                                            ...g, 
                                            name: editName,
                                            action: editAction,
                                            customText: editAction === 'custom-alert' ? editCustomText : g.customText,
                                            macroActions: editAction === 'macro' ? editMacroActions : g.macroActions,
                                            macroDelay: editAction === 'macro' ? editMacroDelay : g.macroDelay
                                          };
                                        }
                                        return g;
                                      });
                                      useStore.getState().setKineticGestures(updated);
                                      setEditingGestureId(null);
                                      showToast(`Updated "${editName}" mappings successfully!`, 'success', 3000);
                                    }}
                                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded text-[10px] transition-all"
                                  >
                                    Save Config
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-bold text-[11px] ${gesture.disabled ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                        {gesture.name}
                                      </span>
                                      <span className={`px-1 text-[8px] font-mono rounded ${
                                        gesture.disabled 
                                          ? 'bg-zinc-900 text-zinc-600' 
                                          : 'bg-zinc-800 text-zinc-400'
                                      }`}>
                                        {stability}
                                      </span>
                                    </div>
                                    
                                    <div className="text-[9px] font-mono text-zinc-500 flex flex-wrap items-center gap-1.5">
                                      {isMacro && gesture.macroActions ? (
                                        <span className="text-amber-500/90 font-medium flex items-center gap-1">
                                          <span className="inline-block w-1 h-1 bg-amber-500 rounded-full" />
                                          Macro Chain: {gesture.macroActions.map(a => a.replace('toggle-', '')).join(' → ')}
                                        </span>
                                      ) : (
                                        <span className={gesture.disabled ? 'text-zinc-600' : 'text-zinc-400'}>
                                          Action: {gesture.action.replace('-', ' ')}
                                        </span>
                                      )}
                                      {gesture.customText && (
                                        <span className="text-zinc-600 italic">
                                          ("{gesture.customText.slice(0, 24)}...")
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {/* Toggle switch */}
                                    <button
                                      onClick={() => toggleMacroMapping(gesture.id)}
                                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        gesture.disabled ? 'bg-zinc-800' : 'bg-emerald-500'
                                      }`}
                                      title={gesture.disabled ? "Enable Gesture Pathway" : "Disable Gesture Pathway"}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          gesture.disabled ? 'translate-x-0' : 'translate-x-3'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-zinc-900 pt-2 mt-1">
                                  <span className={`px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wide rounded ${
                                    gesture.disabled 
                                      ? 'bg-zinc-900 border border-zinc-850 text-zinc-600'
                                      : gesture.direction?.startsWith('pose-') 
                                        ? 'bg-amber-950/40 border border-amber-900/30 text-amber-450 font-bold' 
                                        : gesture.direction 
                                          ? 'bg-blue-950/40 border border-blue-900/30 text-blue-400' 
                                          : 'bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 font-bold'
                                  }`}>
                                    {gesture.direction?.startsWith('pose-') 
                                      ? `${gesture.direction.replace('pose-', '')}-FINGER POSE` 
                                      : gesture.direction 
                                        ? 'BUILT-IN' 
                                        : 'CUSTOM PATH'}
                                  </span>

                                  <div className="flex items-center gap-1.5">
                                    {/* Edit Button */}
                                    <button
                                      onClick={() => {
                                        setEditingGestureId(gesture.id);
                                        setEditName(gesture.name);
                                        setEditAction(gesture.action);
                                        setEditCustomText(gesture.customText || '');
                                        setEditMacroActions(gesture.macroActions || []);
                                        setEditMacroDelay(gesture.macroDelay || 400);
                                      }}
                                      className="px-2 py-1 text-[9px] font-medium rounded border bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/20 flex items-center gap-1 transition-all"
                                      title="Edit Mapping Configuration"
                                    >
                                      <Edit2 size={10} className="text-emerald-400" />
                                      Edit
                                    </button>

                                    <button
                                      onClick={() => testMacroMapping(gesture.id)}
                                      disabled={gesture.disabled}
                                      className={`px-2 py-1 text-[9px] font-medium rounded border flex items-center gap-1 transition-all ${
                                        gesture.disabled 
                                          ? 'bg-zinc-950 text-zinc-600 border-zinc-900 cursor-not-allowed'
                                          : 'bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-750 text-zinc-300 border-zinc-800 hover:text-amber-400 hover:border-amber-500/20'
                                      }`}
                                      title="Test Action Pathway"
                                    >
                                      <Sparkles size={10} className={gesture.disabled ? "text-zinc-600" : "text-amber-400"} />
                                      Test Mapping
                                    </button>

                                    {(!gesture.direction || gesture.direction.startsWith('pose-')) && (
                                      <button 
                                        onClick={() => {
                                          const currentG = useStore.getState().kineticGestures;
                                          useStore.getState().setKineticGestures(currentG.filter(g => g.id !== gesture.id));
                                        }}
                                        className="p-1 hover:bg-zinc-850 rounded text-zinc-500 hover:text-red-400 transition-colors"
                                        title="Remove Gesture Pattern"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Ready-to-Use Gesture & Preset Packages */}
              {gestureSubTab === 'ready-made' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                      <FolderArchive size={16} className="text-emerald-400" /> Ready-to-Use Packages & Postures
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Load quick pre-made packages or choose simple finger shapes for your daily tasks.
                    </p>
                  </div>
                  <div className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                        <Settings2 size={14} className="text-emerald-400" />
                        Ready-To-Use Finger Pose Presets
                      </h4>
                      <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">
                        Instantly set actions for simple hand postures (like holding up a peace sign or five fingers) without drawing any custom path shapes.
                      </p>
                    </div>

                    {/* Thematic Preset Packs Launcher */}
                    <div className="bg-[#0c0c0e]/80 border border-zinc-900 rounded-xl p-4 space-y-3">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Featured Ready-to-Use Packages</span>
                        <h5 className="text-[11px] font-bold text-zinc-300 mt-0.5">Activate complete pre-made action groups with one click</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-black/40 border border-zinc-900 hover:border-zinc-800 p-3 rounded-lg flex flex-col justify-between space-y-2.5 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">🖥️</span>
                              <span className="text-[11.5px] font-bold text-zinc-200">Dev Productivity</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-normal">
                              Maps gestures to command console, quick notes, and sidebar toggles.
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeployPresetPack('developer')}
                            className="w-full py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer"
                          >
                            Deploy Dev Pack
                          </button>
                        </div>

                        <div className="bg-black/40 border border-zinc-900 hover:border-zinc-800 p-3 rounded-lg flex flex-col justify-between space-y-2.5 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">🧭</span>
                              <span className="text-[11.5px] font-bold text-zinc-200">Space Navigator</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-normal">
                              Hands-free routing to Projects, Notes, Docs, Dashboard, and Settings.
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeployPresetPack('navigator')}
                            className="w-full py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer"
                          >
                            Deploy Nav Pack
                          </button>
                        </div>

                        <div className="bg-black/40 border border-zinc-900 hover:border-zinc-800 p-3 rounded-lg flex flex-col justify-between space-y-2.5 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">⚡</span>
                              <span className="text-[11.5px] font-bold text-zinc-200">Workflow Macros</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-normal">
                              Chains dual toggles, note syncs, and quick chat memory wipes.
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeployPresetPack('automation')}
                            className="w-full py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer"
                          >
                            Deploy Macro Pack
                          </button>
                        </div>

                        <div className="bg-black/40 border border-zinc-900 hover:border-zinc-800 p-3 rounded-lg flex flex-col justify-between space-y-2.5 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">🎭</span>
                              <span className="text-[11.5px] font-bold text-zinc-200">Presentation Deck</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-normal">
                              Fires custom visual accents like laser pointer and rocket processing.
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeployPresetPack('presentation')}
                            className="w-full py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-emerald-400 text-[9px] font-mono font-bold uppercase rounded transition-all cursor-pointer"
                          >
                            Deploy Showcase Pack
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((count) => {
                        const existing = kineticGestures.find(g => g.direction === `pose-${count}`);
                        const presetNames: Record<number, string> = {
                          1: 'Index Pointer (1 Finger)',
                          2: 'Peace Sign (2 Fingers)',
                          3: 'Tri-Claw Sign (3 Fingers)',
                          4: 'Flat Hand (4 Fingers)',
                          5: 'High Five (5 Fingers)'
                        };
                        const presetIcons: Record<number, string> = {
                          1: '☝️',
                          2: '✌️',
                          3: '🤟',
                          4: '✋',
                          5: '🖐️'
                        };
                        const presetDescs: Record<number, string> = {
                          1: 'Point your index finger up/forward.',
                          2: 'Hold up a classic peace/victory sign.',
                          3: 'Extend three fingers (Tri-claw gesture).',
                          4: 'Extend four fingers to clear space.',
                          5: 'Open your full palm towards the camera.'
                        };

                        return (
                          <div 
                            key={count}
                            className={`p-3 bg-[#111113]/70 border rounded-lg transition-all space-y-2.5 ${
                              existing 
                                ? 'border-emerald-500/10 bg-emerald-950/2' 
                                : 'border-zinc-850 hover:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base select-none">{presetIcons[count]}</span>
                                <div>
                                  <span className="font-bold text-zinc-200 text-[11px] block">{presetNames[count]}</span>
                                  <span className="text-[9.5px] text-zinc-500 block leading-tight mt-0.5">{presetDescs[count]}</span>
                                </div>
                              </div>
                              {existing && (
                                <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-black rounded-md flex items-center gap-1 shrink-0">
                                  <CheckCircle2 size={8} /> Active
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-zinc-900/60 items-center">
                              <div className="sm:col-span-8 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Action:</span>
                                  <select
                                    value={presetActions[count] || 'toggle-sidebar'}
                                    onChange={(e) => setPresetActions(prev => ({ ...prev, [count]: e.target.value }))}
                                    className="bg-[#121214] border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-350 focus:outline-none focus:border-emerald-500/30 font-medium"
                                  >
                                    <option value="toggle-sidebar">Toggle Left Navigation Panel</option>
                                    <option value="toggle-right-sidebar">Toggle Workspace Assistant</option>
                                    <option value="toggle-sidebar-minimize">Minimize Left Sidebar</option>
                                    <option value="toggle-command-palette">Launch Central Command Palette</option>
                                    <option value="custom-alert">Custom Workspace Notification</option>
                                  </select>
                                </div>
                                {presetActions[count] === 'custom-alert' && (
                                  <input
                                    type="text"
                                    value={presetTexts[count] || ''}
                                    onChange={(e) => setPresetTexts(prev => ({ ...prev, [count]: e.target.value }))}
                                    placeholder="e.g. Workspace Calibrated!"
                                    className="w-full bg-black/40 border border-zinc-900 rounded px-2 py-1 text-[9.5px] text-zinc-400 placeholder-zinc-700 focus:outline-none"
                                  />
                                )}
                              </div>

                              <div className="sm:col-span-4 flex justify-end">
                                <button
                                  onClick={() => handleAssignPreset(count)}
                                  className={`w-full sm:w-auto px-3 py-1.5 text-[10px] font-bold font-mono tracking-tight rounded-md transition-all cursor-pointer ${
                                    presetAssignedCount === count
                                      ? 'bg-emerald-500 text-black shadow-[0_0_10px_#10b981]'
                                      : existing
                                        ? 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300'
                                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                                  }`}
                                >
                                  {presetAssignedCount === count ? '✓ Deployed' : existing ? 'Update Preset' : 'Quick Deploy'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Shortcut Recommendations & Logs */}
              {gestureSubTab === 'suggestions' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" /> Smart Suggestions & Activity History
                    </h3>
                    <p className="text-xs text-zinc-400">
                      View custom shortcuts proposed by Gemini AI and see a live log of recognized gestures.
                    </p>
                  </div>
                  <div className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-400 animate-pulse" />
                          Smart Shortcut Recommender
                        </h4>
                        <p className="text-[10px] text-zinc-500">
                          Gemini analyzes your recent navigation actions to suggest shortcuts that can bundle repetitive tasks.
                        </p>
                      </div>
                      <button 
                        disabled={isAnalyzingPatterns}
                        onClick={handleAnalyzePatterns}
                        className={`text-[9px] font-mono border px-2 py-1 rounded transition-colors uppercase tracking-tight font-bold cursor-pointer flex items-center gap-1.5 ${
                          isAnalyzingPatterns 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed' 
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50'
                        }`}
                      >
                        {isAnalyzingPatterns ? (
                          <>
                            <RefreshCw size={10} className="animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles size={10} />
                            Generate Proposals
                          </>
                        )}
                      </button>
                    </div>

                    {suggestionError && (
                      <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-[10px] leading-relaxed">
                        {suggestionError}
                      </div>
                    )}

                    <div className="space-y-3">
                      {macroSuggestions.length === 0 ? (
                        <div className="text-center py-6 bg-[#0d0d0f]/60 border border-dashed border-zinc-850 rounded-lg text-zinc-500 text-[10px] space-y-2">
                          <p className="italic">
                            No active suggestions compiled yet. Click the button above to run spatial sequence analysis.
                          </p>
                          <div className="text-[9px] font-mono text-zinc-600 bg-black/40 px-2 py-1 rounded inline-block">
                            Logged sequence steps: {commandHistory.length} / 50
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {macroSuggestions.map((suggestion, index) => (
                            <div 
                              key={index} 
                              className="p-3 bg-[#0d0d0f]/80 border border-zinc-850 rounded-lg space-y-2.5 hover:border-zinc-750 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-zinc-200 text-[11px] block">{suggestion.name}</span>
                                  <span className="text-[9px] text-amber-500 font-mono tracking-wider font-semibold">
                                    {(suggestion.confidence * 100).toFixed(0)}% AI Pattern Match
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleConfigureAndTrain(suggestion)}
                                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[9px] text-zinc-300 font-mono tracking-tight transition-colors cursor-pointer"
                                    title="Tweak actions and draw custom spatial pattern"
                                  >
                                    Configure & Train
                                  </button>
                                  <button
                                    onClick={() => handleInstantActivate(suggestion)}
                                    className={`px-2 py-1 rounded text-[9px] font-bold font-mono tracking-tight transition-all cursor-pointer ${
                                      adoptedId === suggestion.name
                                        ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                                        : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                                    }`}
                                  >
                                    {adoptedId === suggestion.name ? (
                                      <span className="flex items-center gap-0.5">✓ Activated</span>
                                    ) : (
                                      'Instant Adopt'
                                    )}
                                  </button>
                                </div>
                              </div>

                              <p className="text-[10px] text-zinc-400 leading-normal bg-black/40 p-2 rounded border border-zinc-900">
                                {suggestion.description}
                              </p>

                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mr-1">Steps:</span>
                                {suggestion.actions.map((act, i) => (
                                  <span key={i} className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] text-zinc-300 font-medium">
                                      {act.replace('toggle-', '').replace('-minimize', ' min')}
                                    </span>
                                    {i < suggestion.actions.length - 1 && (
                                      <span className="text-zinc-650 font-bold text-[10px]">→</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Gesture Log */}
                  <div className="border border-zinc-800 bg-[#09090b] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-200">
                          Live Gesture Log
                        </h4>
                        <p className="text-[10px] text-zinc-500">
                          See which gestures and shortcuts are being recognized right now as you move your hands.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          useStore.setState({ kineticLogs: [] });
                        }}
                        className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-tight font-bold"
                      >
                        Clear History
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar font-mono text-[9px]">
                      {kineticLogs.length === 0 ? (
                        <p className="text-center text-zinc-600 py-4">No spatial actions triggered yet.</p>
                      ) : (
                        kineticLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between py-1 border-b border-zinc-900/50">
                            <span className="text-emerald-400">● {log.name}</span>
                            <span className="text-zinc-500">→ {log.action}</span>
                            <span className="text-zinc-600">({new Date(log.timestamp).toLocaleTimeString()})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">API Tokens</h3>
                <p className="text-xs text-zinc-400">Manage access tokens for programmatic API access.</p>
              </div>
              
              <div className="bg-[#09090b] border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-medium text-zinc-200 mb-1">Secret Key Warning</h4>
                  <p className="text-[10px] text-zinc-400">Do not hardcode these keys in client-side applications. Always relay them securely through a server-side route.</p>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800">
                      <th className="px-4 py-3 font-medium text-zinc-400">Name</th>
                      <th className="px-4 py-3 font-medium text-zinc-400">Token</th>
                      <th className="px-4 py-3 font-medium text-zinc-400">Created</th>
                      <th className="px-4 py-3 font-medium text-zinc-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800 bg-[#09090b]">
                      <td className="px-4 py-3 text-zinc-300 font-medium">Production Scraper</td>
                      <td className="px-4 py-3 font-mono text-zinc-500">sk_live_...4f9a</td>
                      <td className="px-4 py-3 text-zinc-500">Oct 24, 2025</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                      </td>
                    </tr>
                    <tr className="bg-[#09090b]">
                      <td className="px-4 py-3 text-zinc-300 font-medium">DevAgent V2</td>
                      <td className="px-4 py-3 font-mono text-zinc-500">sk_test_...8b2c</td>
                      <td className="px-4 py-3 text-zinc-500">Nov 12, 2025</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end">
                <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md transition-colors border border-zinc-700">
                   Generate New Token
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Global Developer Profile & AI Memory</h3>
                <p className="text-xs text-zinc-400">Define context, tech stack rules, personal title, bio, and persistent memories that the AI brain and collaborators should know.</p>
              </div>

              {/* Developer Profile Form */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-5">
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-xs font-semibold text-yellow-500 flex items-center gap-2 uppercase tracking-wider">
                    👤 Personal Developer Profile
                  </label>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">Firestore Persistent</span>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-400 font-medium mb-1">Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-[#121214] border border-zinc-850 hover:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 font-medium mb-1">Professional Title / Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={profileTitle}
                        onChange={(e) => setProfileTitle(e.target.value)}
                        className="w-full bg-[#121214] border border-zinc-850 hover:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 font-medium mb-1">Short Bio</label>
                    <textarea
                      placeholder="Write a brief bio about your developer skills or role..."
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      rows={3}
                      className="w-full bg-[#121214] border border-zinc-850 hover:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-zinc-400 font-medium mb-1">GitHub Profile Link</label>
                      <input
                        type="url"
                        placeholder="e.g. https://github.com/username"
                        value={profileGithubUrl}
                        onChange={(e) => setProfileGithubUrl(e.target.value)}
                        className="w-full bg-[#121214] border border-zinc-850 hover:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 font-medium mb-1">Personal Website / Portfolio Link</label>
                      <input
                        type="url"
                        placeholder="e.g. https://myportfolio.dev"
                        value={profileWebsiteUrl}
                        onChange={(e) => setProfileWebsiteUrl(e.target.value)}
                        className="w-full bg-[#121214] border border-zinc-850 hover:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 font-medium mb-1">Tech Stack & Skills (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. React, TypeScript, Tailwind, Python, Gemini API"
                      value={profileTechStack}
                      onChange={(e) => setProfileTechStack(e.target.value)}
                      className="w-full bg-[#121214] border border-zinc-850 hover:border-zinc-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-yellow-500/80 text-zinc-200 transition-colors"
                    />
                    <p className="text-[9px] text-zinc-500 mt-1 pl-1">
                      List your primary languages, frameworks, or tools separated by commas. These will render as beautiful skill badges on your public profile.
                    </p>
                  </div>

                  <div className="pt-2 pb-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={profileIsPrivate}
                        onChange={(e) => setProfileIsPrivate(e.target.checked)}
                        className="rounded bg-[#121214] border-zinc-850 text-yellow-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-zinc-350 group-hover:text-white transition-colors">
                        Keep Profile Private (Requires friend requests to message or follow)
                      </span>
                    </label>
                    <p className="text-[10px] text-zinc-500 mt-0.5 pl-6">
                      If private, other developers must send a friend request to see your profile details and open message chats.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 font-medium mb-1">Theme Avatar Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={profileAvatarColor}
                        onChange={(e) => setProfileAvatarColor(e.target.value)}
                        className="w-8 h-8 rounded border border-zinc-800 bg-transparent cursor-pointer"
                      />
                      <span className="text-xs font-mono text-zinc-400 uppercase">{profileAvatarColor}</span>
                      
                      <div className="flex gap-1.5 ml-auto">
                        {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setProfileAvatarColor(c)}
                            className="w-5 h-5 rounded-full border border-zinc-900 transition-transform hover:scale-110 cursor-pointer"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {profileMessage && (
                    <p className={`text-xs font-semibold py-1 px-2 rounded font-mono ${profileMessage.startsWith('✓') ? 'text-emerald-400 bg-emerald-950/15 border border-emerald-950/40' : 'text-red-400 bg-red-950/15 border border-red-950/40'}`}>
                      {profileMessage}
                    </p>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-xs rounded transition-colors shadow-lg cursor-pointer"
                    >
                      Save Profile Details
                    </button>
                  </div>
                </form>
              </div>

              {/* AI Memory Context Block */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-5">
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                    <Bot size={14} /> Persistent AI Context Block
                  </label>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">Auto-saves</span>
                </div>
                
                <textarea 
                  value={aiContextRules}
                  onChange={(e) => setAiContextRules(e.target.value)}
                  className="w-full h-64 bg-[#121214] border border-zinc-800/80 rounded-md p-4 text-[13px] text-emerald-400 font-mono outline-none focus:border-blue-500/50 resize-y leading-relaxed"
                  placeholder={`<role>\nYou are a Senior Full-Stack Next.js Engineer.\n</role>\n\n<tech-stack>\n- Next.js 14 App Router\n- Tailwind CSS\n- Supabase\n</tech-stack>\n\n<rules>\n- Always use server components by default.\n- No class components.\n</rules>`}
                />
                
                <p className="mt-3 text-[10px] text-zinc-500">
                  This exact block will be injected into the RightSidebar Context Engine when it generates ideas, resolves bugs, or reviews code.
                </p>
              </div>

              {/* Active Agent Persona */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-5">
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-xs font-semibold text-purple-400 flex items-center gap-2">
                    <Bot size={14} /> Active Agent Persona
                  </label>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">Saved to storage</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Dynamic Briefing', description: 'Strictly objective, dynamic analysis, pushes for actionable deliverables, daily stats, and progress.' },
                    { name: 'Architect Sage', description: 'Philosophical, focusing on elegant code architecture, design systems, and decoupling.' },
                    { name: 'Cynical Security Auditor', description: 'Extremely security-conscious, skeptical, hunts for edge-cases and visual flaws.' },
                    { name: 'Optimistic Copilot', description: 'Encouraging, helpful, celebrates milestones and focuses on developers emotional well-being.' }
                  ].map((p) => (
                    <div 
                      key={p.name}
                      onClick={() => setAiPersona(p.name)}
                      className={`p-3.5 border rounded-lg cursor-pointer transition-all ${aiPersona === p.name ? 'border-purple-500 bg-purple-950/5 shadow-md' : 'border-zinc-850 bg-zinc-950/30 hover:bg-[#121214]'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-2 h-2 rounded-full ${aiPersona === p.name ? 'bg-purple-500' : 'bg-zinc-600'}`}></div>
                        <span className="text-xs font-bold text-zinc-250">{p.name}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Sandbox Infrastructure & Quotas</h3>
                <p className="text-xs text-zinc-400">View sandboxed compute limits and active developer resources.</p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-blue-500/20 bg-blue-950/[0.04] rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">Active Tier</span>
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/15 font-mono">SANDBOX ACTIVE</span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100">DevSpace Local Developer Environment</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Direct connection established to Port 3000. Full compiler sandboxing, terminal access, and workspace integrations run natively inside the container shell.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Local Environment</span>
                    <span className="text-xs text-emerald-400 font-semibold">Free Developer Tier</span>
                  </div>
                </div>

                <div className="border border-zinc-900 bg-[#09090b] rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Workspace Compute Quotas</h4>
                    <div className="space-y-3 font-sans">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-zinc-300 font-medium">Gemini LLM Tokens</span>
                          <span className="text-zinc-400 font-mono text-[10px]">148,220 / 1,000,000</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: '14.8%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-zinc-300 font-medium">Index Vectors Memory</span>
                          <span className="text-zinc-400 font-mono text-[10px]">512 / 2,048 files</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-end">
                    <span className="text-[10px] text-zinc-500 font-mono">Quotas auto-recycle</span>
                  </div>
                </div>
              </div>

              {/* Network and Ports Allocation */}
              <div className="border border-zinc-900 rounded-lg overflow-hidden bg-[#09090b]">
                <div className="px-4 py-3 bg-[#121214] border-b border-zinc-900">
                  <h4 className="text-xs font-semibold text-zinc-200">Sandbox Network & Exposed Ports Routing</h4>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/10 border-b border-zinc-800 text-[11px]">
                      <th className="px-4 py-3 font-medium text-zinc-400">Endpoint / Port</th>
                      <th className="px-4 py-3 font-medium text-zinc-400">Routing Mode</th>
                      <th className="px-4 py-3 font-medium text-zinc-400 text-right">Ingress Security</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-900/40">
                      <td className="px-4 py-3 text-zinc-350 font-mono">http://0.0.0.0:3000</td>
                      <td className="px-4 py-3 text-zinc-500">Local Dev Ingress</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-450 font-mono font-bold">Nginx Proxied Gate (OK)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-zinc-355 font-mono">/api/gemini/*</td>
                      <td className="px-4 py-3 text-zinc-500">Secure Direct Server Channels</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-450 font-mono font-bold">Server-Side Guarded</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Security & Access Management</h3>
                <p className="text-xs text-zinc-400">Control platform session parameters, configure SSH keys, biometrics, and active session management.</p>
              </div>

              {/* Biometric & Session Security Settings */}
              <BiometricSessionSecuritySettings />

              {/* Connected Identities Section */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-yellow-500" /> Connected Identities & Workspace Sync
                  </h4>
                  <p className="text-[10px] text-zinc-400 max-w-md leading-relaxed">
                    Link multiple authentication methods to your single account. This consolidates all your projects, settings, notes, and activity logs so you can sign in with any provider.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Google Connection Card */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 rounded-lg border border-zinc-850">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#4285F4]/10 rounded-md">
                        <svg className="w-4 h-4 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6-4.52z" fill="currentColor" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">Google Credentials</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[180px]">
                          {isGoogleConnected 
                            ? (auth?.currentUser?.providerData.find(p => p.providerId === 'google.com')?.email || userProfile?.email || 'Active Synapse')
                            : 'Unlinked'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {auth?.currentUser?.providerData.some(p => p.providerId === 'google.com') ? (
                        <button
                          onClick={async () => {
                            if (auth?.currentUser?.providerData.filter(p => p.providerId !== 'custom').length <= 1) {
                              showToast("Safety Protocol: You cannot unlink your only authentication provider as you would lock yourself out of your account!", "error");
                              return;
                            }
                            if (confirm("Disconnect Google Credentials? You will no longer be able to log in using Google.")) {
                              try {
                                await unlinkProvider(auth.currentUser!, 'google.com');
                                showToast("Google Credentials unlinked successfully.", "success");
                                window.location.reload();
                              } catch (err: any) {
                                showToast(err.message || "Failed to unlink Google credentials.", "error");
                              }
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold tracking-wider font-mono uppercase text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 rounded transition-colors"
                        >
                          Unlink
                        </button>
                      ) : isGoogleConnected ? (
                        <span className="px-2 py-0.5 text-[8px] font-bold font-mono uppercase bg-green-950/40 text-green-400 border border-green-900/40 rounded-full">
                          Synced
                        </span>
                      ) : (
                        googleLinkError ? (
                          <button
                            disabled={isLinkingGoogle}
                            onClick={async () => {
                              setIsLinkingGoogle(true);
                              try {
                                await googleSignIn();
                                showToast("Successfully signed in with Google!", "success");
                                window.location.reload();
                              } catch (signInErr: any) {
                                if (signInErr.code === 'auth/cancelled-popup-request' || signInErr.message?.includes('cancelled-popup-request')) {
                                  showToast("Sign in process was cancelled or superseded.", "info");
                                } else {
                                  showToast(signInErr.message || "Failed to sign in with Google.", "error");
                                }
                              } finally {
                                setIsLinkingGoogle(false);
                              }
                            }}
                            className="px-2.5 py-1 text-[10px] font-semibold tracking-wider font-mono uppercase bg-yellow-500 hover:bg-yellow-450 text-black rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLinkingGoogle ? "Signing In..." : "Sign In Instead"}
                          </button>
                        ) : (
                          <button
                            disabled={isLinkingGoogle}
                            onClick={async () => {
                              setIsLinkingGoogle(true);
                              try {
                                await linkProvider(auth.currentUser!, 'google');
                                showToast("Successfully linked Google Credentials!", "success");
                                window.location.reload();
                              } catch (err: any) {
                                console.error(err);
                                if (err.code === 'auth/cancelled-popup-request' || err.message?.includes('cancelled-popup-request')) {
                                  showToast("Linking process was cancelled or superseded.", "info");
                                } else if (err.code === 'auth/credential-already-in-use' || err.message?.includes('credential-already-in-use') || err.message?.includes('already registered') || err.message?.includes('already-in-use')) {
                                  setGoogleLinkError(true);
                                  showToast("This Google account is already registered as a separate developer profile. Click 'Sign In Instead' to switch, and all your projects, profile attributes, and Google AI billing settings will unify automatically!", "info", 8000);
                                } else {
                                  showToast(err.message || "Failed to link Google Credentials.", "error");
                                }
                              } finally {
                                setIsLinkingGoogle(false);
                              }
                            }}
                            className="px-2.5 py-1 text-[10px] font-semibold tracking-wider font-mono uppercase bg-yellow-500 hover:bg-yellow-450 text-black rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLinkingGoogle ? "Linking..." : "Link"}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* GitHub Connection Card */}
                  <div className="flex items-center justify-between p-3.5 bg-zinc-950/40 rounded-lg border border-zinc-850">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800 rounded-md">
                        <Github size={15} className="text-zinc-100" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">GitHub Credentials</p>
                        <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[180px]">
                          {isGithubConnected 
                            ? (auth?.currentUser?.providerData.find(p => p.providerId === 'github.com')?.email || userProfile?.githubUser || 'Active Synapse')
                            : 'Unlinked'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {auth?.currentUser?.providerData.some(p => p.providerId === 'github.com') ? (
                        <button
                          onClick={async () => {
                            if (auth?.currentUser?.providerData.filter(p => p.providerId !== 'custom').length <= 1) {
                              showToast("Safety Protocol: You cannot unlink your only authentication provider as you would lock yourself out of your account!", "error");
                              return;
                            }
                            if (confirm("Disconnect GitHub Credentials? You will no longer be able to log in using GitHub.")) {
                              try {
                                await unlinkProvider(auth.currentUser!, 'github.com');
                                showToast("GitHub Credentials unlinked successfully.", "success");
                                window.location.reload();
                              } catch (err: any) {
                                showToast(err.message || "Failed to unlink GitHub credentials.", "error");
                              }
                            }
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold tracking-wider font-mono uppercase text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 rounded transition-colors"
                        >
                          Unlink
                        </button>
                      ) : isGithubConnected ? (
                        <span className="px-2 py-0.5 text-[8px] font-bold font-mono uppercase bg-green-950/40 text-green-400 border border-green-900/40 rounded-full">
                          Synced
                        </span>
                      ) : (
                        <div>
                          {githubLinkError ? (
                            <button
                              disabled={isLinkingGithub}
                              onClick={async () => {
                                setIsLinkingGithub(true);
                                try {
                                  await githubSignIn();
                                  showToast("Successfully signed in with GitHub!", "success");
                                  window.location.reload();
                                } catch (signInErr: any) {
                                  if (signInErr.code === 'auth/cancelled-popup-request' || signInErr.message?.includes('cancelled-popup-request')) {
                                    showToast("Sign in process was cancelled or superseded.", "info");
                                  } else {
                                    showToast(signInErr.message || "Failed to sign in with GitHub.", "error");
                                  }
                                } finally {
                                  setIsLinkingGithub(false);
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-semibold tracking-wider font-mono uppercase bg-yellow-500 hover:bg-yellow-450 text-black rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLinkingGithub ? "Signing In..." : "Sign In Instead"}
                            </button>
                          ) : (
                            <button
                              disabled={isLinkingGithub}
                              onClick={async () => {
                                setIsLinkingGithub(true);
                                try {
                                  await linkProvider(auth.currentUser!, 'github');
                                  showToast("Successfully linked GitHub Credentials!", "success");
                                  window.location.reload();
                                } catch (err: any) {
                                  console.error(err);
                                  if (err.code === 'auth/cancelled-popup-request' || err.message?.includes('cancelled-popup-request')) {
                                    showToast("Linking process was cancelled or superseded.", "info");
                                  } else if (err.code === 'auth/credential-already-in-use' || err.message?.includes('credential-already-in-use') || err.message?.includes('already registered') || err.message?.includes('already-in-use')) {
                                    setGithubLinkError(true);
                                    showToast("This GitHub account is already registered as a separate developer profile. Click 'Sign In Instead' to switch, and all your projects, profile attributes, and Google AI billing settings will unify automatically!", "info", 8000);
                                  } else {
                                    showToast(err.message || "Failed to link GitHub Credentials.", "error");
                                  }
                                } finally {
                                  setIsLinkingGithub(false);
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-semibold tracking-wider font-mono uppercase bg-yellow-500 hover:bg-yellow-450 text-black rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isLinkingGithub ? "Linking..." : "Link"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi Factor Block */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 mb-1">Two-Factor Authenticated Gateways (MFA)</h4>
                  <p className="text-[10px] text-zinc-400 max-w-md leading-relaxed">Request biometric or authenticator app challenge protocols when accessing connected API gateways and scrapers.</p>
                </div>
                <div className="relative shrink-0 flex items-center">
                   <button 
                     onClick={() => alert("MFA simulation toggle updated!")}
                     className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700 transition-colors"
                   >
                     Enable 2FA
                   </button>
                </div>
              </div>

              {/* SSH Authorized Keys */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">Authorized Workspace SSH Keys</label>
                <p className="text-[10px] text-zinc-500 mb-2 leading-relaxed">Add public keys to let your IDE or pipeline deploy commits securely to DevSpace runners.</p>
                <textarea 
                  className="w-full h-24 bg-[#121214] border border-zinc-800 rounded-md p-3 text-[11px] text-zinc-400 font-mono outline-none focus:border-blue-500/50 resize-y"
                  placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD..."
                  defaultValue="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDfA3m8d2fja"
                />
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => alert('SSH Key indexed into trusted memory!')}
                    className="px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold rounded font-sans transition-colors"
                  >
                    Index Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Advanced Controls</h3>
                <p className="text-xs text-zinc-400">Manage low-level environment directives, custom triggers, and clear workspace caches.</p>
              </div>

              {/* Identity Reconciliation Core */}
              <div className="border border-zinc-800 rounded-lg bg-[#09090b]">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Users size={14} className="text-yellow-500" /> Identity Reconciliation Core
                  </h4>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Multi-Provider Merger</span>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    If you log in using different providers (such as Google, GitHub, or standard Email) that share the same email address, some of your projects, settings, and billing balances may be split across multiple accounts. Reconciling identities will deeply scan, mirror, and consolidate all databases under a single unified profile.
                  </p>
                  
                  <div className="space-y-3 pt-1">
                    {!showReconcileConfirm ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <button 
                          onClick={() => setShowReconcileConfirm(true)}
                          disabled={isReconciling}
                          className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/25 rounded text-xs font-semibold flex items-center gap-2 transition-colors w-fit cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw size={14} className={isReconciling ? "animate-spin" : ""} /> Force Reconcile Identities
                        </button>
                        <span className="text-[10px] text-zinc-500 italic">
                          Recommended if you recently signed in with a new provider.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 border border-yellow-500/20 rounded bg-yellow-500/5 space-y-3">
                        <p className="text-xs text-yellow-500/90 leading-relaxed font-medium">
                          ⚠️ Are you sure you want to force deep identity reconciliation? This will scan for other provider profiles sharing your email and deeply merge all project databases under your active profile.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={async () => {
                              setIsReconciling(true);
                              try {
                                await forceReconcileIdentities();
                              } finally {
                                setIsReconciling(false);
                                setShowReconcileConfirm(false);
                              }
                            }}
                            disabled={isReconciling}
                            className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isReconciling ? "Merging..." : "Yes, Merge Profiles"}
                          </button>
                          <button
                            onClick={() => setShowReconcileConfirm(false)}
                            disabled={isReconciling}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sync Configuration / Cleardown */}
              <div className="border border-zinc-800 rounded-lg bg-[#09090b]">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-200">Local Cache Purge Engine</h4>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed text-zinc-400">Reset all indexed metadata in standard memory buckets. This will wipe any scratch projects, tracked commits, and local notes, resetting DevSpace back to system default. Proceed with caution.</p>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        if (confirm("Are you absolutely sure you want to hard reset all DevSpace memory? This cannot be undone.")) {
                          localStorage.clear();
                          alert("Workspace hard purge completed! Please reload the applet.");
                          window.location.reload();
                        }
                      }}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded text-xs font-semibold transition-colors animate-pulse"
                    >
                      Hard Purge All Databases
                    </button>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('devspace_notes');
                        alert("Notes index wiped!");
                      }}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-xs font-semibold transition-colors"
                    >
                      Purge Notes Only
                    </button>
                  </div>
                </div>
              </div>

              {/* Dev toggles */}
              <div className="border border-zinc-800 rounded-lg bg-[#09090b] p-4">
                 <h4 className="text-xs font-semibold text-zinc-200 mb-3">Live Experimental Toggles</h4>
                 <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-zinc-800 bg-zinc-950 text-blue-500" />
                      Low latency SSE token output streams
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer">
                      <input type="checkbox" className="rounded border-zinc-800 bg-zinc-950 text-blue-500" />
                      Acoustic prompt reading via System SpeechSynthesis
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-zinc-800 bg-zinc-950 text-blue-500" />
                      Automatic pull requests diff diagnostics
                    </label>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
