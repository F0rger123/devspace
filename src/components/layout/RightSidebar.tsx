import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Bot, 
  Zap, 
  Code2, 
  Database, 
  Github, 
  Send, 
  Terminal, 
  Cpu, 
  Paperclip, 
  Mic, 
  StopCircle, 
  Image as ImageIcon, 
  X, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Layers, 
  Map, 
  CheckSquare, 
  PlayCircle,
  HelpCircle,
  Plus,
  Trash2,
  Settings,
  Play,
  Shield,
  Sliders,
  Check,
  Globe,
  Key,
  Lock,
  RefreshCw,
  FileText,
  Edit3,
  Server,
  Activity,
  Eye,
  Compass,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { useData } from '../../context/DataProvider';
import { useStore } from '../../store';
import { db } from '../../lib/auth';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  isVoice?: boolean;
  actionFeedback?: string;
};

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

export function RightSidebar({ isFullPage = false }: { isFullPage?: boolean }) {
  const navigate = useNavigate();
  const { 
    projects, 
    addProject, 
    updateProject, 
    issues, 
    addIssue, 
    updateIssue, 
    notes, 
    addNote, 
    phases, 
    agents, 
    aiContextRules, 
    setAiContextRules, 
    activeProjectId, 
    setActiveProjectId,
    cortexSynapses,
    setCortexSynapses,
    addVoiceAction,
    aetherControlNotes,
    aetherControlIssues,
    aetherControlAgents,
    aetherControlBrainstorm,
    aetherControlIntegrations,
    aetherDoubleConfirm,
    aetherAutoRecommend,
    aetherModel,
    aetherConciseness,
    aetherThinkingLevel,
    aetherPersonalityRules,
    activationShortcutKey,
    stopShortcutKey,
    googleUser
  } = useData();

  const { 
    isRightSidebarOpen, 
    toggleRightSidebar, 
    isRightSidebarExpanded, 
    toggleRightSidebarExpanded 
  } = useStore();

  const getDynamicGreeting = () => {
    const hr = new Date().getHours();
    let timeGreeting = "Greetings";
    if (hr < 12) timeGreeting = "Good morning";
    else if (hr < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    const projectsCount = projects?.length || 0;
    const rulesCount = cortexSynapses?.length || 0;
    const hasDreams = projects?.some(p => (p.dreamRecommendations || []).length > 0);

    let welcome = `${timeGreeting}, drummerforger! Aether online and synchronized.\n\n`;
    welcome += `I am holding our continuous synaptic memory of **${rulesCount} custom rules** and **${projectsCount} active projects** fully loaded.\n\n`;
    if (hasDreams) {
      welcome += `Last night, I dreamed up several fresh optimizations and code refactors for your active branches. Let me know if you would like me to retrieve my latest dream recommendations or review outstanding tasks!`;
    } else {
      welcome += `I am standing by as your central brain orchestrator. Let's design some incredible features today. What are we building next?`;
    }
    return welcome;
  };

  // Session states for past conversations
  const [isSessionsLoaded, setIsSessionsLoaded] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('aether_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'session-default',
        title: 'Central Orchestrator Session',
        createdAt: Date.now(),
        messages: [
          {
            id: '1',
            role: 'agent',
            content: 'System online. I am Aether, your central brain orchestrator. I have full synaptic mapping to your Obsidian Notes, Maps of Spring, and AgenticOS. How can I assist you today?'
          }
        ]
      },
      {
        id: 'session-2',
        title: 'Source Code Refactor Audit',
        createdAt: Date.now() - 3600000,
        messages: [
          { id: 'u1', role: 'user', content: 'Design a clean state sync for local storage' },
          { id: 'a1', role: 'agent', content: 'Created synchronized hooks with debounce timers inside VoiceHub to protect backend gateways from API rate limiting.' }
        ]
      }
    ];
  });
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('aether_current_session_id');
      return saved || 'session-default';
    } catch {
      return 'session-default';
    }
  });

  // Derived state for the active message list (single source of truth)
  const messages = useMemo(() => {
    const active = chatSessions.find(s => s.id === currentSessionId);
    return active?.messages || [];
  }, [chatSessions, currentSessionId]);

  const currentSessionIdRef = useRef(currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const setMessages = useCallback((updater: Message[] | ((prev: Message[]) => Message[])) => {
    setChatSessions(prev => prev.map(s => {
      if (s.id === currentSessionIdRef.current) {
        const currentMsgs = s.messages || [];
        const nextMsgs = typeof updater === 'function' ? (updater as any)(currentMsgs) : updater;
        return { ...s, messages: nextMsgs };
      }
      return s;
    }));
  }, []);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState<string>('');

  // Right Inspector active tab
  const [rightInspectorTab, setRightInspectorTab] = useState<'sessions' | 'automations' | 'mcp' | 'access' | 'synapses'>('sessions');

  // Custom MCP configurations
  const [mcpServers, setMcpServers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('aether_mcp_servers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 'mcp-1', name: 'Filesystem Access Core', url: 'http://localhost:5001/mcp/files', active: true, authType: 'Bearer Link', token: 'fs_token_aether_928' },
      { id: 'mcp-2', name: 'GitHub Integration Module', url: 'https://api.github.com/mcp', active: false, authType: 'OAuth Node', token: '' },
      { id: 'mcp-3', name: 'PostgreSQL Relational Explorer', url: 'http://localhost:5432/mcp', active: true, authType: 'None', token: '' }
    ];
  });

  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpUrl, setNewMcpUrl] = useState('');
  const [newMcpToken, setNewMcpToken] = useState('');
  const [newMcpAuthType, setNewMcpAuthType] = useState('Bearer Token');

  // Customizable fine-grained permissions
  const [accessControls, setAccessControls] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('aether_access_controls');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      fileReadWrite: 'granted', // 'granted', 'read-only', 'restricted'
      networkFetch: true,
      dbSync: true,
      sandboxIngress: true,
      credentialsAccess: false,
      telegramBridge: true,
      whatsappBridge: true
    };
  });

  // Customize Assistant Model Settings
  const [aiSettings, setAiSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('aether_ai_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      modelName: 'gemini-3.5-flash',
      temperature: 0.72,
      systemPersona: 'Aether Brain Orchestrator',
      streamEnabled: true,
      customEndpoint: 'https://generativelanguage.googleapis.com'
    };
  });

  // Automations Studio (N-Level flow customizer and simulation agent)
  const [automations, setAutomations] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('aether_automations');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'auto-1',
        name: 'Weekly Sprint Backlog Sweep',
        desc: 'Scans backlog items in Active Phase, checks deadlines, and generates automated summary reports.',
        trigger: 'timer_cron',
        active: true,
        steps: [
          { id: 's1', type: 'query_db', label: 'Query Pending Backlog', config: { query: 'status = In Progress' }, status: 'success' },
          { id: 's2', type: 'gemini_transform', label: 'Summarize Status Priorities', config: { prompt: 'Identify major issues and build a roadmap summary.' }, status: 'success' },
          { id: 's3', type: 'code_run', label: 'Compile Workspace Note', config: { noteName: 'Sprint_Backlog_Report' }, status: 'success' }
        ],
        isRunningSim: false,
        simLogs: []
      },
      {
        id: 'auto-2',
        name: 'Remote Ingress Dispatcher',
        desc: 'Listens for simulation messages and triggers safe gateway webhooks with security verification.',
        trigger: 'webhook_receipt',
        active: false,
        steps: [
          { id: 's4', type: 'code_run', label: 'Fetch Live Telegram Commands', config: { params: 'pending-actions' }, status: 'idle' },
          { id: 's5', type: 'delay_wait', label: 'Apply Safe Handshake Backoff', config: { delaySecs: 3 }, status: 'idle' },
          { id: 's6', type: 'broadcast', label: 'Distribute Synapse Alert', config: { target: 'all-channels', message: 'Database state updated online.' }, status: 'idle' }
        ],
        isRunningSim: false,
        simLogs: []
      }
    ];
  });

  const [activeAutoId, setActiveAutoId] = useState<string | null>(null);
  const [newAutoName, setNewAutoName] = useState('');
  const [newAutoDesc, setNewAutoDesc] = useState('');
  const [newAutoTrigger, setNewAutoTrigger] = useState('manual_run');

  // Load message feed dynamically from current session
  // Persist current session ID to local storage
  useEffect(() => {
    localStorage.setItem('aether_current_session_id', currentSessionId);
    window.dispatchEvent(new CustomEvent('aether_sync_chat', { detail: { sender: 'RightSidebar' } }));
  }, [currentSessionId]);

  // Listen to cross-component storage changes for seamless real-time syncing
  useEffect(() => {
    const handleStorageChange = (e: any) => {
      if (e && e.type === 'aether_sync_chat' && e.detail?.sender === 'RightSidebar') {
        return;
      }
      if (!e || e.key === 'aether_chat_sessions' || e.key === 'aether_current_session_id' || !e.key) {
        try {
          const saved = localStorage.getItem('aether_chat_sessions');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.length > 0) {
              setChatSessions(prev => {
                if (!areSessionsEqual(prev, parsed)) {
                  return parsed;
                }
                return prev;
              });
            }
          }
          const savedActiveId = localStorage.getItem('aether_current_session_id');
          if (savedActiveId) {
            setCurrentSessionId(prev => {
              if (prev !== savedActiveId) {
                return savedActiveId;
              }
              return prev;
            });
          }
        } catch (err) {
          console.warn("Storage sync failed:", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('aether_sync_chat', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('aether_sync_chat', handleStorageChange);
    };
  }, []);

  // Listen for custom kinetic trigger to clear dialogue history
  useEffect(() => {
    const handleClearChat = async () => {
      const defaultSessions = [
        {
          id: 'session-default',
          title: 'Central Orchestrator Session',
          createdAt: Date.now(),
          messages: [
            {
              id: '1',
              role: 'agent',
              content: getDynamicGreeting()
            }
          ]
        }
      ];
      setChatSessions(defaultSessions);
      setCurrentSessionId('session-default');
      localStorage.setItem('aether_chat_sessions', JSON.stringify(defaultSessions));
      localStorage.setItem('aether_current_session_id', 'session-default');

      // Clear in Firestore if logged in
      if (googleUser) {
        try {
          const snap = await getDocs(collection(db, 'chatSessions'));
          const batchDeletes = snap.docs.map(docSnap => deleteDoc(doc(db, 'chatSessions', docSnap.id)));
          await Promise.all(batchDeletes);
          await setDoc(doc(db, 'chatSessions', 'session-default'), defaultSessions[0]);
        } catch (err) {
          console.error("Failed to sync cleared chats to Firestore:", err);
        }
      }
    };
    window.addEventListener('aether-clear-chat', handleClearChat);
    return () => window.removeEventListener('aether-clear-chat', handleClearChat);
  }, [googleUser, setChatSessions]);

  // Update default welcome greeting dynamically once projects or memory synapses load
  useEffect(() => {
    if (projects && projects.length > 0) {
      const greeting = getDynamicGreeting();
      setChatSessions(prev => {
        let changed = false;
        const next = prev.map(s => {
          if (s.id === 'session-default' && s.messages.length === 1 && (s.messages[0].content && (s.messages[0].content.startsWith('System online. I am Aether') || s.messages[0].content.includes('System online')))) {
            if (s.messages[0].content !== greeting) {
              changed = true;
              return {
                ...s,
                messages: [
                  {
                    id: '1',
                    role: 'agent',
                    content: greeting
                  }
                ]
              };
            }
          }
          return s;
        });
        return changed ? next : prev;
      });
    }
  }, [projects, cortexSynapses]);

  // Load chat sessions from Firestore when user is authenticated
  useEffect(() => {
    const loadSessions = async () => {
      if (!googleUser) {
        setIsSessionsLoaded(true);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'chatSessions'));
        const fbSessions: any[] = [];
        snap.forEach(d => fbSessions.push(d.data()));
        if (fbSessions.length > 0) {
          fbSessions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setChatSessions(fbSessions);
        } else {
          // Empty in Firestore, seed with current local sessions
          for (const s of chatSessions) {
            await setDoc(doc(db, 'chatSessions', s.id), s);
          }
        }
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError') || e?.code === 'permission-denied') {
          console.warn("Skipped syncing chat sessions from Firestore (permission / offline):", e.message || e);
        } else {
          console.error("Failed to load chat sessions from Firestore:", e);
        }
      } finally {
        setIsSessionsLoaded(true);
      }
    };
    loadSessions();
  }, [googleUser]);

  // Persist session variations automatically to local storage and Firestore
  useEffect(() => {
    localStorage.setItem('aether_chat_sessions', JSON.stringify(chatSessions));
    window.dispatchEvent(new CustomEvent('aether_sync_chat', { detail: { sender: 'RightSidebar' } }));

    if (!isSessionsLoaded || !googleUser) return;

    const timer = setTimeout(async () => {
      try {
        for (const s of chatSessions) {
          await setDoc(doc(db, 'chatSessions', s.id), s);
        }
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError') || e?.code === 'permission-denied') {
          console.warn("Skipped syncing chat sessions to Firestore (permission / offline):", e.message || e);
        } else {
          console.error("Failed to sync chat sessions to Firestore:", e);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [chatSessions, isSessionsLoaded, googleUser]);

  useEffect(() => {
    localStorage.setItem('aether_mcp_servers', JSON.stringify(mcpServers));
  }, [mcpServers]);

  useEffect(() => {
    localStorage.setItem('aether_ai_settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  useEffect(() => {
    localStorage.setItem('aether_automations', JSON.stringify(automations));
  }, [automations]);

  useEffect(() => {
    localStorage.setItem('aether_access_controls', JSON.stringify(accessControls));
  }, [accessControls]);

  // Helper to trigger live simulation step run
  const triggerAutomationSimulation = (autoId: string) => {
    setAutomations(prev => prev.map(a => {
      if (a.id === autoId) {
        return {
          ...a,
          isRunningSim: true,
          simLogs: [`[SYSTEM] Starting execution flow: "${a.name}"`, `[TRIGGER] "${a.trigger.toUpperCase()}" fired successfully.`]
        };
      }
      return a;
    }));

    // Step-by-step mock simulation timeouts
    const targetAuto = automations.find(a => a.id === autoId);
    if (!targetAuto) return;

    let logCounter = 0;
    const executeStep = (stepIdx: number) => {
      if (stepIdx >= targetAuto.steps.length) {
        setAutomations(prev => prev.map(a => {
          if (a.id === autoId) {
            return {
              ...a,
              isRunningSim: false,
              simLogs: [...(a.simLogs || []), `[SUCCESS] Automation execution complete! All ${a.steps.length} nodes resolved successfully.`]
            };
          }
          return a;
        }));
        return;
      }

      const step = targetAuto.steps[stepIdx];
      setAutomations(prev => prev.map(a => {
        if (a.id === autoId) {
          const updatedSteps = [...a.steps];
          updatedSteps[stepIdx] = { ...step, status: 'running' };
          return {
            ...a,
            steps: updatedSteps,
            simLogs: [...(a.simLogs || []), `[RUNNING] Executing Node: ${step.label} (${step.type})...`]
          };
        }
        return a;
      }));

      setTimeout(() => {
        setAutomations(prev => prev.map(a => {
          if (a.id === autoId) {
            const updatedSteps = [...a.steps];
            updatedSteps[stepIdx] = { ...step, status: 'success' };
            const detailText = step.type === 'query_db' ? 'Returned database stream (200 OK).' :
                               step.type === 'gemini_transform' ? 'Processed transformed directives.' :
                               step.type === 'code_run' ? 'Fitted logic inside mock environment.' :
                               step.type === 'delay_wait' ? 'Delay threshold completed.' : 'Webhook distributed successfully.';
            return {
              ...a,
              steps: updatedSteps,
              simLogs: [...(a.simLogs || []), `[RESOLVED] Node "${step.label}" finished. Details: ${detailText}`]
            };
          }
          return a;
        }));
        executeStep(stepIdx + 1);
      }, 1200);
    };

    executeStep(0);
  };

  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceAudioEnabled, setVoiceAudioEnabled] = useState<boolean>(() => {
    return localStorage.getItem('isAetherMuted') !== 'true';
  });

  useEffect(() => {
    const handleSync = () => {
      const isMuted = localStorage.getItem('isAetherMuted') === 'true';
      setVoiceAudioEnabled(!isMuted);
      if (isMuted) {
        try {
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        } catch (e) {}
        setIsSpeechPlaying(false);
      }
    };
    window.addEventListener('aether-mute-sync', handleSync);
    return () => window.removeEventListener('aether-mute-sync', handleSync);
  }, []);

  const [isSpeechPlaying, setIsSpeechPlaying] = useState(false);

  // Browser SpeechRecognition Integration states
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const latestTranscriptRef = useRef('');

  // Audio recording states (for high-fidelity voice execution)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<{name: string, data: string, mime: string}[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Audio recording timer loop
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Text-To-Speech Synthesis
  const speakVoiceReply = (text: string) => {
    if (!voiceAudioEnabled) return;
    try {
      window.speechSynthesis?.cancel();
      // Remove code snippets or markdown elements for standard human narrative voice
      const spokenText = text
        .replace(/```[\s\S]*?```/g, '[Displaying technical code block]')
        .replace(/[*#`_\-]/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        setIsSpeechPlaying(false);
      };
      utterance.onerror = () => {
        setIsSpeechPlaying(false);
      };

      setIsSpeechPlaying(true);
      window.speechSynthesis?.speak(utterance);
    } catch (e) {
      console.error('Speech playback failed:', e);
      setIsSpeechPlaying(false);
    }
  };

  const stopVoiceReply = () => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn("SpeechSynthesis cancel failed:", e);
    }
    setIsSpeechPlaying(false);
  };

  // Global shortcut and interruption keys for RightSidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const matchesStop = (shortcutStr: string) => {
        if (!shortcutStr) return false;
        const parts = shortcutStr.toLowerCase().split('+');
        const key = parts[parts.length - 1].trim();
        const eventKey = e.key.toLowerCase();
        
        if (key === 'escape' && eventKey === 'escape') return true;
        
        const needsCtrl = parts.includes('ctrl') || parts.includes('control');
        const needsAlt = parts.includes('alt');
        const needsShift = parts.includes('shift');
        const hasCtrl = e.ctrlKey;
        const hasAlt = e.altKey;
        const hasShift = e.shiftKey;
        
        if (needsCtrl !== hasCtrl || needsAlt !== hasAlt || needsShift !== hasShift) return false;
        return eventKey === key;
      };

      if (matchesStop(stopShortcutKey || 'escape')) {
        if (isSpeechPlaying || isRecording) {
          e.preventDefault();
          stopVoiceReply();
          if (isRecording) stopRecording();
          console.log("Aether interrupted via stop shortcut");
        }
      }

      if (matchesStop(activationShortcutKey || 'alt+k')) {
        if (isRightSidebarOpen) {
          e.preventDefault();
          if (isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRightSidebarOpen, isRecording, isSpeechPlaying, activationShortcutKey, stopShortcutKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
           setAttachedFiles(prev => [...prev, {
              name: file.name,
              data: (event.target?.result as string).split(',')[1] || '',
              mime: file.type
           }]);
        };
        reader.readAsDataURL(file);
     }
  };

  // Dispatch matched Voice intent logic directly in frontend (same as in VoiceMemoAssistant)
  const dispatchCommandAction = (intent: string, parsedData: any): string => {
    if (!intent || intent === 'unknown' || !parsedData || intent === 'chat_query') {
      return '';
    }

    let feedback = '';

    switch (intent) {
      case 'create_project': {
        const name = parsedData.name || 'New Voice Project';
        const description = parsedData.description || 'Drafted via Aether AI workspace direct command.';
        const frameworks = parsedData.frameworks || ['React'];
        const customStack = parsedData.customStack || frameworks;

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
        feedback = `Bootstrapped Project: "${name}" initiated into workspace successfully.`;
        break;
      }

      case 'create_issue': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projects.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) {
          projectId = activeProjectId || projects[0]?.id;
        }

        if (!projectId) {
          return 'Failed: No project exists to append task.';
        }

        const projectRef = projects.find(p => p.id === projectId);
        const title = parsedData.title || 'Vocal Task';
        const desc = parsedData.description || 'Transcribed via Aether workflow';
        const type = parsedData.type || 'Task';
        const priority = parsedData.priority || 'Medium';

        addIssue({
          projectId,
          title,
          description: desc,
          type,
          priority,
          status: 'Todo'
        });

        feedback = `Appended Tasks: Added "${title}" to project backlog of "${projectRef?.name}".`;
        break;
      }

      case 'update_issue_status': {
        const mentionTitle = parsedData.issueTitleMentioned?.toLowerCase() || '';
        const newStatus = parsedData.newStatus || 'Done';

        let targetIssue = null;
        if (mentionTitle) {
          targetIssue = issues.find(iss => 
            iss.title.toLowerCase().includes(mentionTitle)
          );
        }
        if (!targetIssue && activeProjectId) {
          targetIssue = issues.find(iss => 
            iss.projectId === activeProjectId && iss.status !== 'Done'
          );
        }

        if (targetIssue) {
          updateIssue(targetIssue.id, { status: newStatus });
          feedback = `Status Shift: "${targetIssue.title}" status modified to [${newStatus}].`;
        } else {
          feedback = `No issue matching "${mentionTitle || 'active item'}" discovered to coordinate.`;
        }
        break;
      }

      case 'add_brainstorm_idea': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projects.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) projectId = activeProjectId || projects[0]?.id;

        if (!projectId) return 'Failed: No active project context.';

        const projectRef = projects.find(p => p.id === projectId);
        if (!projectRef) return 'Project lookup reference missing.';

        const text = parsedData.text || 'Brainstorm idea';
        const details = parsedData.details || '';

        const existing = projectRef.brainstormIdeas || [];
        const newIdea = {
          id: crypto.randomUUID(),
          text,
          details,
          status: 'pending' as const,
          createdAt: Date.now()
        };

        updateProject(projectId, {
          brainstormIdeas: [...existing, newIdea]
        });

        feedback = `Idea Synced: Registered brainstorm "${text}" underneath active project thoughts.`;
        break;
      }

      case 'add_note': {
        let projectId = parsedData.projectId;
        if (!projectId && parsedData.projectNameMentioned) {
          const matched = projects.find(p => 
            p.name.toLowerCase().includes(parsedData.projectNameMentioned.toLowerCase())
          );
          if (matched) projectId = matched.id;
        }
        if (!projectId) projectId = activeProjectId || projects[0]?.id;

        if (!projectId) return 'Failed to save note: No project reference';

        const title = parsedData.title || `Cognitive Note - ${new Date().toLocaleTimeString()}`;
        const content = parsedData.content || 'Transcribed dynamically via Aether AI Workspace.';
        const tags = parsedData.tags || ['AetherVoice'];

        addNote({
          projectId,
          title,
          content,
          tags
        });

        feedback = `Written Note: Doc notes "${title}" created and saved in memory archives.`;
        break;
      }

      case 'add_cortex_synapse': {
        const name = parsedData.name || 'AI Memory Directive';
        const desc = parsedData.desc || 'No instruction detail supplied.';
        
        setCortexSynapses(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name,
            desc,
            type: 'custom_synapse' as const,
            createdAt: Date.now()
          }
        ]);
        
        feedback = `Synapse Wired: Add rules rule "${name}" to cognitive cortex.`;
        break;
      }

      case 'approve_dream_recommendation': {
        const mentionTitle = parsedData.title || parsedData.text || '';
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

        if (!matchedRec) {
          // fallback to first active unapproved
          for (const proj of projects) {
            const recs = proj.dreamRecommendations || [];
            const found = recs.find((r: any) => r.status !== 'approved');
            if (found) {
              matchedRec = found;
              matchedProj = proj;
              break;
            }
          }
        }

        if (matchedRec && matchedProj) {
          const brainstorms = matchedProj.brainstormIdeas || [];
          const alreadyExists = brainstorms.some((b: any) => b.text === matchedRec.title);
          let uniqueIdeas = [...brainstorms];
          if (!alreadyExists) {
            uniqueIdeas.push({
              id: crypto.randomUUID(),
              text: matchedRec.title,
              details: matchedRec.description,
              status: 'pending',
              createdAt: Date.now()
            });
          }

          const updatedRecs = (matchedProj.dreamRecommendations || []).map((d: any) => {
            if (d.id === matchedRec.id) {
              return { ...d, status: 'approved' };
            }
            return d;
          });

          updateProject(matchedProj.id, {
            brainstormIdeas: uniqueIdeas,
            dreamRecommendations: updatedRecs
          });

          feedback = `Dream Realized: Approved recommendation page "${matchedRec.title}" and loaded into project brainstorms!`;
        } else {
          feedback = 'Spoken intent matched, but no specific dreaming tracks are pending approval.';
        }
        break;
      }

      default:
        feedback = 'Command registered in Aether Workspace.';
    }

    return feedback;
  };

  // Send textual query: streams Q&A immediately from /api/gemini/stream with rich workspace constraints
  const handleSend = async (forcedText?: string) => {
    stopVoiceReply();
    const textToSend = forcedText || inputValue;
    if (!textToSend.trim() && attachedFiles.length === 0) return;

    const lower = textToSend.toLowerCase().trim();
    const clean = lower.replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");

    // Dynamic active project switching based on spoken/typed name
    let matchedProject = null;
    for (const proj of projects) {
      const projNameLower = proj.name.toLowerCase().trim();
      if (
        lower === projNameLower ||
        lower.includes(`project ${projNameLower}`) ||
        lower.includes(`go to ${projNameLower}`) ||
        lower.includes(`open ${projNameLower}`) ||
        lower.includes(`switch to ${projNameLower}`) ||
        lower.includes(`take me to ${projNameLower}`) ||
        (projNameLower.length > 3 && lower.includes(projNameLower) && (lower.includes("project") || lower.includes("navigate") || lower.includes("go") || lower.includes("open")))
      ) {
        matchedProject = proj;
        break;
      }
    }

    let targetPath = '';
    let descName = '';

    if (lower.includes("minimize sidebar") || lower.includes("collapse sidebar") || lower.includes("shrink sidebar") || lower.includes("minimize the sidebar") || lower.includes("collapse the sidebar")) {
      useStore.getState().setSidebarMinimized(true);
      setInputValue('');
      const feedbackMessage = "I have minimized the navigation sidebar into a compact, space-saving icon-only rail.";
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: feedbackMessage };
      setMessages(prev => [...prev, userMsg, modelMsg]);
      speakVoiceReply(feedbackMessage);
      return;
    }
    
    if (lower.includes("maximize sidebar") || lower.includes("expand sidebar") || lower.includes("restore sidebar") || lower.includes("maximize the sidebar") || lower.includes("expand the sidebar")) {
      useStore.getState().setSidebarMinimized(false);
      setInputValue('');
      const feedbackMessage = "I have maximized the navigation sidebar back to its full expanded layout.";
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: feedbackMessage };
      setMessages(prev => [...prev, userMsg, modelMsg]);
      speakVoiceReply(feedbackMessage);
      return;
    }

    if (lower.includes("hide sidebar") || lower.includes("close sidebar") || lower.includes("hide the sidebar") || lower.includes("close the sidebar")) {
      if (useStore.getState().isSidebarOpen) {
        useStore.getState().toggleSidebar();
      }
      setInputValue('');
      const feedbackMessage = "I have hidden the navigation sidebar completely. You can bring it back by asking me to show it or using the layout controls.";
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: feedbackMessage };
      setMessages(prev => [...prev, userMsg, modelMsg]);
      speakVoiceReply(feedbackMessage);
      return;
    }

    if (lower.includes("show sidebar") || lower.includes("open sidebar") || lower.includes("show the sidebar") || lower.includes("open the sidebar")) {
      if (!useStore.getState().isSidebarOpen) {
        useStore.getState().toggleSidebar();
      }
      setInputValue('');
      const feedbackMessage = "I have restored and displayed the navigation sidebar on your layout.";
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: feedbackMessage };
      setMessages(prev => [...prev, userMsg, modelMsg]);
      speakVoiceReply(feedbackMessage);
      return;
    }

    if (matchedProject) {
      setActiveProjectId(matchedProject.id);
      targetPath = '/projects';
      descName = `Project "${matchedProject.name}"`;
    } else if (clean === "automations" || clean === "automation" || clean === "workflows" || clean === "workflow" || clean === "pipelines" || lower.includes("automation") || lower.includes("pipeline") || lower.includes("workflow")) {
      targetPath = '/automations';
      descName = 'Automations Studio';
    } else if (clean === "dreams" || clean === "dream" || clean === "my dreams" || clean === "dream log" || lower.includes("dream")) {
      targetPath = '/brain?tab=dreams';
      descName = 'Aether Dream Log';
    } else if (clean === "memory" || clean === "memory store" || clean === "synaptic rules" || lower.includes("memory") || lower.includes("synaptic") || lower.includes("cortex")) {
      targetPath = '/brain?tab=memory';
      descName = 'Synaptic Memory Cortex';
    } else if (clean === "projects" || clean === "project" || lower.includes("take me to projects") || lower.includes("go to projects") || lower.includes("open projects") || lower.includes("show projects")) {
      targetPath = '/projects';
      descName = 'Projects Center';
    } else if (clean === "assets" || clean === "asset" || lower.includes("take me to assets") || lower.includes("go to assets") || lower.includes("open assets") || lower.includes("show assets")) {
      targetPath = '/assets';
      descName = 'Digital Asset Repository';
    } else if (clean === "notes" || clean === "note" || lower.includes("take me to notes") || lower.includes("go to notes") || lower.includes("open notes") || lower.includes("show notes")) {
      targetPath = '/notes';
      descName = 'Obsidian Developer Logbooks';
    } else if (clean === "ideas" || clean === "idea" || lower.includes("take me to ideas") || lower.includes("go to ideas") || lower.includes("open ideas") || lower.includes("show ideas") || lower.includes("new ideas")) {
      targetPath = '/ideas';
      descName = 'Idea Expansion Center';
    } else if (clean === "issues" || clean === "issue" || clean === "problems" || clean === "problem" || clean === "tasks" || clean === "task" || lower.includes("take me to issues") || lower.includes("go to issues") || lower.includes("open tasks") || lower.includes("problems") || lower.includes("backlog")) {
      targetPath = '/issues';
      descName = 'Backlog Issues board';
    } else if (clean === "brain" || clean === "cortex" || clean === "map" || lower.includes("take me to brain") || lower.includes("go to brain") || lower.includes("open brain")) {
      targetPath = '/brain';
      descName = 'Memory Cortex Brain Map';
    } else if (clean === "agents" || clean === "agent" || lower.includes("take me to agents") || lower.includes("go to agents") || lower.includes("open agents")) {
      targetPath = '/agents';
      descName = 'Agentic OS Sandbox';
    } else if (clean === "roadmap" || lower.includes("take me to roadmap") || lower.includes("go to roadmap") || lower.includes("open roadmap")) {
      targetPath = '/roadmap';
      descName = 'Product Roadmap Timeline';
    } else if (clean === "settings" || lower.includes("take me to settings") || lower.includes("go to settings") || lower.includes("open settings")) {
      targetPath = '/settings';
      descName = 'Aether Vocal Preferences';
    } else if (clean === "dashboard" || clean === "home" || lower.includes("take me to dashboard") || lower.includes("go to dashboard") || lower.includes("open dashboard")) {
      targetPath = '/';
      descName = 'Cortex Control Panel';
    }

    if (targetPath) {
      navigate(targetPath);
      setInputValue('');
      const feedbackMessage = `Opening your ${descName}. What would you like me to do next?`;
      
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: feedbackMessage };
      setMessages(prev => [...prev, userMsg, modelMsg]);
      
      speakVoiceReply(feedbackMessage);
      return;
    }

    if (aetherDoubleConfirm) {
      const displayBrief = textToSend.length > 50 ? `${textToSend.slice(0, 50)}...` : textToSend;
      const confirmed = window.confirm(`⚠️ Aether Double-Confirmation Safeguard:\n\nYou are instructing Aether to run an operation:\n"${displayBrief}"\n\nDo you authorize Aether to process this command?`);
      if (!confirmed) {
        return;
      }
    }

    let displayContent = textToSend;
    if (attachedFiles.length > 0) {
       displayContent += `\n[Attached ${attachedFiles.length} files]`;
    }

    const newMsg: Message = { id: Date.now().toString(), role: 'user', content: displayContent };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);
    setIsProcessing(true);

    const agentMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: agentMsgId,
      role: 'agent',
      content: ''
    }]);

    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMsg],
          files: filesToSend,
          projects: projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            frameworks: p.frameworks,
            customStack: p.customStack
          })),
          issues: issues.map(iss => ({
            id: iss.id,
            projectId: iss.projectId,
            title: iss.title,
            status: iss.status,
            priority: iss.priority,
            type: iss.type
          })),
          cortexSynapses: cortexSynapses || [],
          notes: notes || [],
          phases: phases || [],
          agents: agents || [],
          aiContextRules: aiContextRules || "",
          aetherPersonalityRules: aetherPersonalityRules || [],
          aetherModel: aetherModel || 'gemini-3.5-flash',
          aetherConciseness: aetherConciseness || 'balanced',
          aetherThinkingLevel: aetherThinkingLevel || 'auto',
          aetherControlNotes: aetherControlNotes ?? true,
          aetherControlIssues: aetherControlIssues ?? true,
          aetherControlAgents: aetherControlAgents ?? true,
          aetherControlBrainstorm: aetherControlBrainstorm ?? true,
          aetherControlIntegrations: aetherControlIntegrations ?? false,
          aetherDoubleConfirm: aetherDoubleConfirm ?? false,
          aetherAutoRecommend: aetherAutoRecommend ?? true
        })
      });

      if (!response.ok) {
         throw new Error(`Server returned error: ${response.status}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let currentContent = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                currentContent += data.text;
                
                const prefsMatch = currentContent.match(/<UPDATE_PREFS>([\s\S]*?)<\/UPDATE_PREFS>/);
                if (prefsMatch && prefsMatch[1]) {
                    setAiContextRules(prefsMatch[1].trim());
                }

                setMessages(prev => prev.map(msg => 
                  msg.id === agentMsgId 
                    ? { 
                        ...msg, 
                        content: currentContent.replace(/<UPDATE_PREFS>[\s\S]*?<\/UPDATE_PREFS>/g, '').trim() || currentContent 
                      }
                    : msg
                ));
              } else if (data.error) {
                setMessages(prev => prev.map(msg => 
                  msg.id === agentMsgId 
                    ? { ...msg, content: currentContent + '\nError: ' + data.error }
                    : msg
                ));
              }
            } catch (e) {
              // Ignore partial parse
            }
          }
        }
      }
      
      setIsProcessing(false);
      
      // Speak response dynamically if enabled
      const finalMsg = currentContent.replace(/<UPDATE_PREFS>[\s\S]*?<\/UPDATE_PREFS>/g, '').trim();
      speakVoiceReply(finalMsg);

    } catch (e: any) {
      setIsProcessing(false);
      setMessages(prev => prev.map(msg => 
        msg.id === agentMsgId 
          ? { ...msg, content: 'Error streaming response: ' + e.message }
          : msg
      ));
    }
  };

  // Native browser SpeechRecognition Integration to capture voice input live
  const startRecording = async () => {
    stopVoiceReply();
    try {
      setErrorMsg('');
      setSpeechTranscript('');
      latestTranscriptRef.current = '';

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setErrorMsg('Web Speech API is not supported in this browser. Please use Chrome or Safari.');
        return;
      }

      // Pre-check microphone permissions
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        setErrorMsg('Microphone accessibility blocked. Please grant access in your browser settings.');
        return;
      }

      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      let finalTranscript = '';

      recog.onstart = () => {
        setIsRecording(true);
        setRecordingSeconds(0);
      };

      recog.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const fullTranscript = finalTranscript || interimTranscript;
        latestTranscriptRef.current = fullTranscript;
        setSpeechTranscript(fullTranscript);
        setInputValue(fullTranscript);
      };

      recog.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setErrorMsg('Speech recognition error: ' + (err.error || 'Check microphone authorization'));
        setIsRecording(false);
      };

      recog.onend = () => {
        setIsRecording(false);
        const transcript = latestTranscriptRef.current.trim();
        if (transcript) {
          setEditableTranscript(transcript);
          setConfirmTitle('');
          setSelectedProjectId(activeProjectId || projects[0]?.id || '');
          setShowConfirmPrompt(true);
        }
      };

      (window as any).activeAssistantRecog = recog;
      recog.start();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed initiating Speech Recognition: ' + err.message);
    }
  };

  const stopRecording = () => {
    const recog = (window as any).activeAssistantRecog;
    if (recog) {
      try {
        recog.stop();
      } catch (e) {
        console.error('Stop error:', e);
      }
      (window as any).activeAssistantRecog = null;
    }
    setIsRecording(false);
  };

  const clearConversation = () => {
    setMessages([
      {
        id: '1',
        role: 'agent',
        content: 'Conversation history flushed. Aether AI synaptic channels clear. How can I assist?'
      }
    ]);
  };

  const injectPromptChip = (text: string) => {
    setInputValue(text);
  };

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (!isRightSidebarOpen && !isFullPage) return null;

  // Render Full Screen Desktop ChatGPT Style Workspace
  if (isRightSidebarExpanded || isFullPage) {
    return (
      <div className={`${isFullPage ? 'w-full h-full' : 'fixed inset-0 z-50'} bg-[#09090b] flex flex-row overflow-hidden font-sans text-zinc-300`}>
        
        {/* Left Columns - ChatGPT Sessions Sidebar of Past Dialogs */}
        <AnimatePresence>
          {chatSessions && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-[#0c0c0e] border-r border-[#1e1e24] flex flex-col shrink-0 overflow-hidden"
            >
              {/* New session launcher */}
              <div className="p-3 border-b border-[#1e1e24] space-y-2">
                <button
                  onClick={() => {
                    const newId = `session-${Date.now()}`;
                    const newS = {
                      id: newId,
                      title: `Dialogue Topic ${chatSessions.length + 1}`,
                      createdAt: Date.now(),
                      messages: [
                        {
                          id: `init-${Date.now()}`,
                          role: 'agent',
                          content: 'New syntactic orchestrator workspace initialized. Command me or provide spoken audio directives.'
                        }
                      ]
                    };
                    setChatSessions(prev => [newS, ...prev]);
                    setCurrentSessionId(newId);
                  }}
                  className="w-full py-2.5 px-3 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-100 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:border-indigo-500/30"
                >
                  <Plus size={14} className="text-indigo-400" />
                  <span>New Conversation</span>
                </button>
              </div>

              {/* List of past conversations (ChatGPT style) */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 select-none scrollbar-thin">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-2">History Dialogues</div>
                {chatSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  const isEditing = editingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      onClick={() => !isEditing && setCurrentSessionId(session.id)}
                      className={`relative group p-2.5 rounded-lg flex items-center justify-between gap-2 border transition-all cursor-pointer text-xs ${
                        isActive
                          ? 'bg-zinc-850 border-zinc-700/80 text-zinc-100 shadow'
                          : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText size={13} className={isActive ? 'text-indigo-400' : 'text-zinc-500'} />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingSessionTitle}
                            onChange={(e) => setEditingSessionTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setChatSessions(prev => prev.map(s => s.id === session.id ? { ...s, title: editingSessionTitle } : s));
                                setEditingSessionId(null);
                              }
                            }}
                            onBlur={() => {
                              setChatSessions(prev => prev.map(s => s.id === session.id ? { ...s, title: editingSessionTitle } : s));
                              setEditingSessionId(null);
                            }}
                            className="bg-zinc-950 text-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium truncate block">{session.title}</span>
                        )}
                      </div>

                      {/* Hover action items */}
                      {!isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(session.id);
                              setEditingSessionTitle(session.title);
                            }}
                            className="p-1 hover:bg-zinc-855 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
                            title="Rename"
                          >
                            <Edit3 size={11} />
                          </button>
                          {chatSessions.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const filtered = chatSessions.filter(s => s.id !== session.id);
                                setChatSessions(filtered);
                                if (isActive) {
                                  setCurrentSessionId(filtered[0]?.id || 'session-default');
                                }
                              }}
                              className="p-1 hover:bg-red-950/20 rounded text-zinc-400 hover:text-red-400 transition-colors"
                              title="Delete conversation"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom footer credit */}
              <div className="p-3 border-t border-[#1e1e24] bg-zinc-950/35 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                <span>Sessions Persisted</span>
                <span className="text-indigo-400 font-bold">LocalState</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Conversation Window */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
          
          {/* Top Board */}
          <div className="h-14 border-b border-[#1f1f23] flex items-center justify-between px-6 bg-[#0c0c0e]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                AE
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                  Aether AI Workspace 
                  <span className="text-[9px] bg-indigo-950/40 text-indigo-400 py-0.5 px-2 rounded-full border border-indigo-500/20 font-mono">
                    {chatSessions.find(s => s.id === currentSessionId)?.title || 'Aether Active'}
                  </span>
                </div>
                <div className="text-[9px] text-zinc-500 font-mono">SYNTACTIC COGNITIVE SYSTEM • SECURE ACCESS CONTROL</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const currentMute = localStorage.getItem('isAetherMuted') === 'true';
                  const nextMute = !currentMute;
                  localStorage.setItem('isAetherMuted', String(nextMute));
                  window.dispatchEvent(new Event('aether-mute-sync'));
                }}
                className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all outline-none ${
                  voiceAudioEnabled 
                    ? 'bg-indigo-950/40 transition-colors border-indigo-500/20 text-indigo-400' 
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
                title="Vocal feedback toggle"
              >
                {voiceAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span className="text-[10px] uppercase font-semibold hidden md:inline-block">TTS Speech</span>
              </button>

              <button 
                onClick={clearConversation}
                className="text-zinc-500 hover:text-zinc-200 text-xs px-3 py-2 hover:bg-zinc-900 border border-zinc-800/80 rounded-lg transition-colors hidden sm:block"
              >
                Flush Conversation
              </button>

              <button 
                onClick={() => {
                  if (isFullPage) {
                    navigate('/');
                  } else {
                    toggleRightSidebarExpanded();
                  }
                }}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                title={isFullPage ? "Exit Fullscreen Assistant" : "Contract Workspace View"}
              >
                <Minimize2 size={14} />
              </button>
            </div>
          </div>

          {/* Chat Feed */}
          <div 
            onClick={() => { if (isSpeechPlaying) stopVoiceReply(); }}
            className={`flex-1 overflow-y-auto p-6 space-y-6 bg-[#08080a] select-text ${isSpeechPlaying ? 'cursor-pointer' : ''}`}
          >
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <motion.div
                   key={msg.id}
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-500 flex items-center justify-center text-black font-extrabold text-xs shrink-0 shadow-lg">
                      A
                    </div>
                  )}

                  <div className="flex flex-col max-w-[80%]">
                    <div className="text-[10px] text-zinc-600 font-mono mb-1 flex items-center gap-1.5">
                      {msg.role === 'user' ? 'Operator (Local)' : 'Aether Orchestrator'}
                      {msg.isVoice && <span className="text-yellow-400 text-[8px] uppercase tracking-widest font-mono border border-yellow-500/10 px-1.5 rounded bg-yellow-950/20 font-bold">Audio input</span>}
                    </div>

                    <div className={`px-5 py-3.5 rounded-2xl shadow-xl leading-relaxed text-xs sm:text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-650 text-indigo-50 border border-indigo-600 rounded-tr-none shadow-indigo-950/10'
                        : 'bg-[#121214] border border-[#27272a] text-zinc-300 rounded-tl-none'
                    }`}>
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="markdown-body prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#09090b] prose-pre:border prose-pre:border-zinc-800 prose-sm text-zinc-300 max-w-none">
                          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content}</Markdown>
                        </div>
                      )}

                      {msg.actionFeedback && (
                        <div className="mt-3 pt-2.5 border-t border-emerald-500/20 text-emerald-400 font-mono text-xs flex items-center gap-2 font-medium">
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0 animate-pulse" />
                          <span>{msg.actionFeedback}</span>
                        </div>
                      )}
                    </div>

                    {msg.role === 'agent' && (
                      <button
                        onClick={() => speakVoiceReply(msg.content)}
                        className="text-[10px] text-zinc-500 hover:text-indigo-450 font-mono mt-1 px-1 flex items-center gap-1.5 uppercase tracking-wider transition-colors bg-transparent border-none cursor-pointer"
                      >
                        <Volume2 size={11} /> Speak Aloud
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {isProcessing && (
                <div className="flex gap-4 items-start justify-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Loader2 size={14} className="text-indigo-400 animate-spin" />
                  </div>
                  <div className="flex flex-col">
                    <div className="text-[10px] text-zinc-650 font-mono mb-1">Aether Thinking</div>
                    <div className="bg-[#121214] border border-[#27272a] px-5 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-3 text-xs sm:text-sm text-zinc-500 font-mono animate-pulse">
                      Consulting workspace synaptics & models...
                    </div>
                  </div>
                </div>
              )}

              {isSpeechPlaying && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    stopVoiceReply();
                  }}
                  className="sticky bottom-2 mx-auto max-w-xs px-4 py-2 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-500 border border-yellow-500/20 rounded-full text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg backdrop-blur-md z-50 animate-bounce"
                >
                  <VolumeX size={13} className="animate-pulse" />
                  <span>AI is speaking... Tap anywhere to interrupt</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Chat Dictation bar */}
          <div className="p-6 bg-[#0c0c0e] border-t border-[#1f1f23] select-none">
            <div className="max-w-3xl mx-auto">
              
              {/* Voice recording display overlay */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-[#18181b]/95 border border-red-500/30 rounded-xl p-4 text-center flex flex-col items-center justify-center mb-4 gap-2.5 shadow-2xl"
                  >
                    <div className="text-red-400 text-xs font-mono uppercase tracking-widest font-bold flex items-center gap-2 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Dictating vocal action script...
                    </div>
                    
                    {/* Beautiful fluid-motion glowing audio visualizer */}
                    <div className="flex items-end justify-center gap-0.5 h-12 w-full max-w-xs overflow-hidden px-4 py-2 mt-1 bg-zinc-950/65 rounded-xl border border-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                      {[10, 24, 18, 28, 14, 32, 22, 16, 26, 20, 24, 12, 18, 30, 22, 14].map((baseH, i) => (
                        <motion.span
                          key={`sidebar-voice-wave-${i}`}
                          animate={{ height: [`4px`, `${baseH}px`, `4px`] }}
                          transition={{
                            duration: 0.6 + (i % 4) * 0.15,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-1.5 rounded-t-full bg-gradient-to-t from-red-650 via-purple-505 to-indigo-400"
                          style={{
                            filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.4))'
                          }}
                        />
                      ))}
                    </div>

                    <div className="text-3xl font-bold font-mono text-white">{formatSecs(recordingSeconds)}</div>

                    {speechTranscript && (
                      <div className="text-[11px] text-zinc-300 max-w-md line-clamp-3 px-3 py-1.5 bg-black/40 border border-zinc-800/50 rounded-xl font-mono leading-relaxed max-h-18 overflow-y-auto custom-scrollbar">
                        "{speechTranscript}"
                      </div>
                    )}

                    <button
                      onClick={stopRecording}
                      className="px-6 py-2 bg-red-650 hover:bg-red-700 text-white rounded-full font-bold text-xs flex items-center gap-1.5 transition-all text-sm shadow-md cursor-pointer"
                    >
                      Stop &amp; Review Memo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {errorMsg && (
                <div className="bg-rose-955/20 border border-rose-500/25 p-3 mb-4 rounded-xl text-xs font-mono text-rose-400 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} /> <span>{errorMsg}</span>
                  </div>
                  <button onClick={() => setErrorMsg('')} className="underline hover:text-rose-300">dismiss</button>
                </div>
              )}

              {/* Input Core */}
              <div className="relative flex flex-col gap-3 bg-[#121214] border border-[#27272a] rounded-2xl p-3 focus-within:border-indigo-500/60 shadow-xl">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-zinc-650 shrink-0 ml-1" />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (isSpeechPlaying) stopVoiceReply();
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Aether to coordinate tasks, audit security, or review integrations..."
                    className="w-full bg-transparent border-none py-1.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-0 select-text"
                  />
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-850 mt-1 select-none">
                  <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors relative"
                      title="Attach file"
                    >
                      <Paperclip size={14} />
                      {attachedFiles.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-indigo-500 text-[9px] flex items-center justify-center rounded-full text-white font-bold shadow-md">{attachedFiles.length}</span>
                      )}
                    </button>

                    {isSpeechPlaying && (
                      <button 
                        onClick={stopVoiceReply}
                        className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 transition-all flex items-center gap-1.5 animate-pulse"
                        title="Interrupt / Stop Aether Voice"
                      >
                        <StopCircle size={14} className="text-yellow-500 fill-yellow-500/20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Stop Voice</span>
                      </button>
                    )}

                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-2 rounded-lg transition-all border relative overflow-hidden ${
                        isRecording 
                          ? 'bg-red-950/40 text-red-400 border-red-500 px-3 shadow-[0_0_15px_rgba(239,68,68,0.25)]' 
                          : 'text-indigo-400 hover:bg-zinc-800 border-transparent hover:border-[#27272a]'
                      }`}
                      title="Vocal voice directive"
                    >
                      <div className="flex items-center gap-1.5">
                        <Mic size={14} className={isRecording ? 'text-red-500' : ''} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{isRecording ? 'listening' : 'Spoken Memo'}</span>
                        {isRecording && (
                          <div className="flex gap-[1.5px] items-center h-3 shrink-0 ml-1">
                            {[10, 16, 12, 18, 14, 8, 12, 6].map((baseH, i) => (
                              <motion.span
                                key={`sidebar-spec-${i}`}
                                animate={{ height: [`3px`, `${baseH}px`, `3px`] }}
                                transition={{
                                  duration: 0.6 + i * 0.08,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="w-[1.5px] bg-red-400 rounded-full"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={() => handleSend()}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-45 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-transform shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    <span>Execute Synapse</span>
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Settings, Automations, MCP Services Inspector */}
        <div className="w-full md:w-[380px] border-l border-[#1f1f23] bg-[#0c0c0e] flex flex-col shrink-0 overflow-hidden h-full">
          
          {/* Tabs Selector */}
          <div className="flex border-b border-[#1f1f23] bg-zinc-950/40 shrink-0 p-1 select-none">
            {[
              { id: 'sessions', label: 'Feeds', Icon: Compass },
              { id: 'automations', label: 'Flows', Icon: Zap },
              { id: 'mcp', label: 'MCP & APIs', Icon: Settings },
              { id: 'access', label: 'Perms', Icon: Shield },
              { id: 'synapses', label: 'Cortex', Icon: Database }
            ].map((tab) => {
              const tabIsActive = rightInspectorTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRightInspectorTab(tab.id as any)}
                  className={`flex-1 py-2 px-1 text-[10px] font-semibold rounded-md flex flex-col items-center gap-1 transition-all ${
                    tabIsActive
                      ? 'bg-zinc-850 text-white shadow-sm border border-zinc-750'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <tab.Icon size={13} className={tabIsActive ? 'text-indigo-400' : ''} />
                  <span className="tracking-wide uppercase text-[8px]">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Tab Containers */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">

            {/* TAB 1: QUICK SUGGESTIONS & PERSISTENT FEEDS */}
            {rightInspectorTab === 'sessions' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass size={13} className="text-indigo-400" /> Prompts & Suggestions
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                    Select a custom structured prompt key to inject into assistant pipeline:
                  </p>
                </div>

                <div className="space-y-2 select-none">
                  {[
                    { label: '🛡️ Initiate security backlog audit', prompt: 'Audit all current project backlogs and recommend high priority security improvements.' },
                    { label: '🗒️ Refactor local synchronization engine', prompt: 'Create an architecture notes doc for refactoring API polling cache with debounced storage.' },
                    { label: '🤖 Summarize specialty agent roles', prompt: 'Summarize what active Specialty Agents are currently configured to build across categories.' },
                    { label: '💡 Generate sprint feature expansion tracks', prompt: 'Suggest key feature brainstorm ideas based on current spring roadmaps.' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => injectPromptChip(item.prompt)}
                      className="w-full text-left p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-855 border border-zinc-800/80 text-[11px] text-zinc-350 hover:text-white transition-colors block"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-zinc-850 pt-4 space-y-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Active Roadmap Snapshot</span>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2.5 text-[11px]">
                    {phases?.slice(0, 3).map((ph, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-zinc-850/50 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-zinc-300 font-medium truncate shrink-0 max-w-[130px]">{ph.name}</span>
                        <div className="flex gap-1 items-center shrink-0 text-zinc-500 font-mono text-[9px]">
                          <span>{ph.startDate || 'Q3 Milestone'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AUTOMATION FLOWS (N-LEVEL PIPELINE BUILDER & MOCK SIMULATOR) */}
            {rightInspectorTab === 'automations' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={13} className="text-yellow-400 animate-pulse" /> N-Level Automation Studio
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                    Set up custom pipelines, add multi-step triggers/tasks, and run safe live dry-run simulations.
                  </p>
                </div>

                {/* Workflow Cards */}
                <div className="space-y-3.5">
                  {automations.map((flow) => {
                    const isActive = activeAutoId === flow.id;
                    return (
                      <div key={flow.id} className={`p-3 bg-[#111113] border rounded-xl space-y-3 ${isActive ? 'border-indigo-500/40 shadow-md' : 'border-zinc-800/80 hover:border-zinc-750'}`}>
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="cursor-pointer flex-1" onClick={() => setActiveAutoId(isActive ? null : flow.id)}>
                            <div className="text-[11px] font-bold text-zinc-100 tracking-wide flex items-center gap-1.5">
                              {flow.name}
                              <span className={`w-1.5 h-1.5 rounded-full ${flow.active ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">{flow.desc}</p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setAutomations(prev => prev.map(a => a.id === flow.id ? { ...a, active: !a.active } : a));
                              }}
                              className={`p-1.5 rounded text-[9px] font-bold tracking-wider uppercase border border-transparent transition-all cursor-pointer ${
                                flow.active 
                                  ? 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/30' 
                                  : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                              }`}
                            >
                              {flow.active ? 'ON' : 'OFF'}
                            </button>
                            <button
                              onClick={() => {
                                setAutomations(prev => prev.filter(a => a.id !== flow.id));
                              }}
                              className="p-1.5 rounded bg-zinc-900 text-zinc-500 hover:text-red-400 border border-zinc-850 hover:bg-red-950/20"
                              title="Delete workflow"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Trigger Type Indicator */}
                        <div className="text-[9px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800/40 p-1 px-2 rounded flex items-center justify-between">
                          <span>TRIGGER EVENT:</span>
                          <span className="text-indigo-400 uppercase tracking-widest font-bold">{flow.trigger}</span>
                        </div>

                        {/* Steps / Nodes pipeline */}
                        <div className="space-y-1.5 pl-1.5 border-l border-indigo-500/20">
                          {flow.steps.map((st: any, sIdx: number) => (
                            <div key={st.id} className="text-[10px] flex items-center justify-between p-1.5 rounded bg-zinc-950/65 border border-zinc-900">
                              <span className="text-zinc-350 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-zinc-900 text-[8px] flex items-center justify-center border border-zinc-800 text-zinc-500">{sIdx + 1}</span>
                                {st.label}
                              </span>
                              <div className="flex items-center gap-1.5 font-mono text-[8px]">
                                <span className="bg-zinc-900 text-zinc-500 py-0.5 px-1.5 rounded border border-zinc-850">{st.type}</span>
                                {st.status === 'success' && <span className="text-emerald-400">●</span>}
                                {st.status === 'running' && <Loader2 size={8} className="text-amber-400 animate-spin" />}
                                {st.status === 'idle' && <span className="text-zinc-650">○</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Interactive Steps Addition Form under active details */}
                        {isActive && (
                          <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-900 space-y-2 mt-2">
                            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Add pipeline step:</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                onClick={() => {
                                  const labelStr = prompt('Enter Step Label (e.g. Scrape web, query table):');
                                  if (!labelStr) return;
                                  const stepsType = prompt('Choose Step Type (query_db, code_run, gemini_transform, delay_wait, broadcast):');
                                  if (!stepsType) return;
                                  setAutomations(prev => prev.map(a => {
                                    if (a.id === flow.id) {
                                      return {
                                        ...a,
                                        steps: [...a.steps, {
                                          id: `s-${Date.now()}`,
                                          type: stepsType,
                                          label: labelStr,
                                          status: 'idle'
                                        }]
                                      };
                                    }
                                    return a;
                                  }));
                                }}
                                className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 rounded font-semibold text-[9px] text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Plus size={10} /> <span>Custom Step</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Simulation log Console */}
                        {flow.isRunningSim && flow.simLogs && (
                          <div className="bg-black/90 p-2 rounded border border-[#1e1e24] font-mono text-[8px] text-emerald-400 space-y-1 max-h-32 overflow-y-auto">
                            {flow.simLogs.map((log: string, lIdx: number) => (
                              <div key={lIdx} className="leading-tight">{log}</div>
                            ))}
                          </div>
                        )}

                        {/* Action Simulations Trigger */}
                        <div className="flex items-center justify-end pt-2 text-[10px]">
                          <button
                            onClick={() => triggerAutomationSimulation(flow.id)}
                            disabled={flow.isRunningSim}
                            className="bg-indigo-650 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold tracking-wide uppercase px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
                          >
                            {flow.isRunningSim ? (
                              <>
                                <Loader2 size={11} className="animate-spin text-white" />
                                <span>Running Sim...</span>
                              </>
                            ) : (
                              <>
                                <Play size={10} className="fill-current" />
                                <span>Test Simulation</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Workflow creation button */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-2 select-none">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">Teach Custom Workflow</span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Workflow Name..."
                      value={newAutoName}
                      onChange={(e) => setNewAutoName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Brief Description..."
                      value={newAutoDesc}
                      onChange={(e) => setNewAutoDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                    />
                    <div className="flex justify-between items-center text-[10px] gap-2 pt-1">
                      <select 
                        value={newAutoTrigger} 
                        onChange={(e) => setNewAutoTrigger(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded p-1 text-[10px] text-zinc-300"
                      >
                        <option value="manual_run">manual trigger</option>
                        <option value="webhook_receipt">webhook inbound</option>
                        <option value="timer_cron">scheduled timer</option>
                      </select>
                      <button
                        onClick={() => {
                          if (!newAutoName.trim()) return;
                          const newFlow = {
                            id: `auto-${Date.now()}`,
                            name: newAutoName,
                            desc: newAutoDesc || 'No custom details added.',
                            trigger: newAutoTrigger,
                            active: true,
                            steps: [
                              { id: `s-first-${Date.now()}`, type: 'gemini_transform', label: 'Transform Active Request', status: 'idle' }
                            ],
                            isRunningSim: false,
                            simLogs: []
                          };
                          setAutomations(prev => [...prev, newFlow]);
                          setNewAutoName('');
                          setNewAutoDesc('');
                        }}
                        className="bg-indigo-650 hover:bg-vivid-indigo py-1 px-3 text-[10px] text-white font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Launch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MCP SERVERS REGISTRATION & MODEL VARIABLES CONFIG */}
            {rightInspectorTab === 'mcp' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                    <Settings size={13} className="text-zinc-400" /> MCP Servers & Parameter Config
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                    Configure active Model Context Protocol (MCP) server endpoints, secure authorization keys, and model parameters.
                  </p>
                </div>

                {/* Model Params Slider */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 space-y-3">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block border-b border-zinc-800 pb-1.5">Brain parameters</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400">Gemini Precision Model:</span>
                      <span className="font-mono text-indigo-400 font-bold">{aiSettings.modelName}</span>
                    </div>
                    <select
                      value={aiSettings.modelName}
                      onChange={(e) => setAiSettings({ ...aiSettings, modelName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-[10px] text-zinc-300"
                    >
                      <option value="gemini-3.5-flash">gemini-3.5-flash (Orchestrator)</option>
                      <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Executive)</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400">Temperature Variable:</span>
                      <span className="font-mono text-indigo-400 font-bold">{aiSettings.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={aiSettings.temperature}
                      onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Registered MCP Handshakes */}
                <div className="space-y-3 select-none">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Registered MCP Connectors</span>
                  <div className="space-y-2">
                    {mcpServers.map((srv) => (
                      <div key={srv.id} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-200">{srv.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${srv.active ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-zinc-600'}`} />
                            <button
                              onClick={() => {
                                setMcpServers(prev => prev.map(s => s.id === srv.id ? { ...s, active: !s.active } : s));
                              }}
                              className="text-[8px] font-mono uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
                            >
                              toggle
                            </button>
                          </div>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 truncate" title={srv.url}>
                          ADDR: <span className="text-zinc-400">{srv.url}</span>
                        </div>
                        {srv.token && (
                          <div className="text-[8px] font-mono text-zinc-500">
                            AUTH-KEY: <span className="text-indigo-550">•••••••••{srv.token.slice(-3)}</span>
                          </div>
                        )}
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => setMcpServers(prev => prev.filter(s => s.id !== srv.id))}
                            className="text-[8px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300"
                          >
                            Unlink Node
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Register New Server Node */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">Register MCP Server</span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Server Nickname..."
                      value={newMcpName}
                      onChange={(e) => setNewMcpName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="MCP Handshake URL..."
                      value={newMcpUrl}
                      onChange={(e) => setNewMcpUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Security Authorization Key (Optional)..."
                      value={newMcpToken}
                      onChange={(e) => setNewMcpToken(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                    />
                    
                    <button
                      onClick={() => {
                        if (!newMcpName.trim() || !newMcpUrl.trim()) return;
                        const newSrv = {
                          id: `mcp-${Date.now()}`,
                          name: newMcpName,
                          url: newMcpUrl,
                          active: true,
                          authType: newMcpAuthType,
                          token: newMcpToken
                        };
                        setMcpServers(prev => [...prev, newSrv]);
                        setNewMcpName('');
                        setNewMcpUrl('');
                        setNewMcpToken('');
                      }}
                      className="w-full py-1.5 bg-[#4f46e5] text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-indigo-500"
                    >
                      Authenticate Connector Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ACCESS CONTROL PANELS (PERMISSIONS TOGGLES) */}
            {rightInspectorTab === 'access' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield size={13} className="text-indigo-400" /> Access & Permission Matrix
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                    Authorize or lock down fine-grained privileges to direct sandbox components.
                  </p>
                </div>

                {/* Permissions Toggles List */}
                <div className="space-y-2 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80 select-none">
                  
                  {/* File Permission Options Selector */}
                  <div className="space-y-1.5 border-b border-zinc-850 pb-3">
                    <span className="text-[10px] font-semibold text-zinc-400 block">Workspace Code Access level:</span>
                    <div className="grid grid-cols-3 gap-1.5 text-[9px] text-center">
                      {[
                        { id: 'granted', label: 'FULL READ/WRITE' },
                        { id: 'read-only', label: 'READ ONLY' },
                        { id: 'restricted', label: 'LOCKED' }
                      ].map((perm) => (
                        <button
                          key={perm.id}
                          onClick={() => setAccessControls({ ...accessControls, fileReadWrite: perm.id })}
                          className={`p-1.5 rounded-md font-bold tracking-wide transition-all border outline-none ${
                            accessControls.fileReadWrite === perm.id
                              ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20'
                              : 'bg-zinc-950 text-zinc-500 border-zinc-850'
                          }`}
                        >
                          {perm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Boolean Permission Switches */}
                  <div className="space-y-3 pt-3">
                    {[
                      { key: 'networkFetch', label: 'Authorize Web Fetching', desc: 'Allows Aether to query remote URLs.' },
                      { key: 'dbSync', label: 'Drizzle/Postgres Schema Sync', desc: 'Permits remote queries on relational components.' },
                      { key: 'sandboxIngress', label: 'Active Sandbox Validation', desc: 'Validates credential hashes against ingress loops.' },
                      { key: 'credentialsAccess', label: 'Read Setting Shell Secrets', desc: 'Grants access to workspace environment keys.' },
                      { key: 'telegramBridge', label: 'Aether Telegram Gateway Connection', desc: 'Toggles live listener loop inside active workspace.' },
                      { key: 'whatsappBridge', label: 'Aether WhatsApp Webhook Connection', desc: 'Controls remote simulated chat streams.' }
                    ].map((row) => (
                      <div key={row.key} className="flex items-start justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-zinc-200 block">{row.label}</span>
                          <span className="text-[9px] text-zinc-500 font-sans block leading-normal">{row.desc}</span>
                        </div>
                        <button
                          onClick={() => setAccessControls({ ...accessControls, [row.key]: !accessControls[row.key] })}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 outline-none ${
                            accessControls[row.key] ? 'bg-indigo-600' : 'bg-zinc-800'
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-205 transition-transform ${
                            accessControls[row.key] ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-[10px] font-mono text-zinc-500 leading-normal">
                  ⚠️ Permissions configured above are enforced natively in this sandbox and synchronizes directly across workspace API proxy controllers.
                </div>
              </div>
            )}

            {/* TAB 5: MEMORY SYNAPSES & AGENT LIST SUMMARY */}
            {rightInspectorTab === 'synapses' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={13} className="text-[#a855f7]" /> Synaptic Rules & Agents
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                    Review specialty cognitive agents and direct prompt cortex synapse specifications wired into your brain workspace.
                  </p>
                </div>

                {/* Dynamic specialty agents list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Specialty Agents Array ({agents?.length || 0})</span>
                  <div className="space-y-2">
                    {agents?.map((agent, i) => (
                      <div key={i} className="p-2.5 bg-zinc-900 border border-zinc-850 rounded-lg flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-zinc-200 truncate">{agent.name}</div>
                          <div className="text-[9px] text-zinc-500 truncate mt-0.5 font-mono">{agent.role}</div>
                        </div>
                        <span className="text-[8px] tracking-wider px-2 py-0.5 rounded-sm bg-emerald-950/50 text-emerald-400 border border-emerald-500/10 font-mono uppercase font-semibold">
                          online
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Rule synapses backlog */}
                <div className="space-y-2.5 pt-3 border-t border-zinc-900">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Cortex Memory Rules ({cortexSynapses?.length || 0})</span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {cortexSynapses?.map((rule, i) => (
                      <div key={i} className="p-2.5 bg-zinc-900 border border-zinc-900 rounded-lg flex items-start gap-2 text-xs">
                        <Database size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-zinc-200 truncate">{rule.name}</div>
                          <div className="text-[9px] text-zinc-500 mt-0.5 font-sans leading-normal">{rule.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    );
  }

  // Render Normal RightSidebar Panel Layout
  return (
    <aside className="absolute md:relative right-0 z-40 h-full w-[85vw] sm:w-80 md:w-60 shrink-0 border-l border-zinc-800 bg-[#0c0c0e] flex flex-col overflow-hidden shadow-xl md:shadow-none font-sans">
      
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-zinc-800 bg-[#0c0c0e] shrink-0">
        <h2 className="text-xs font-semibold text-zinc-100 flex items-center gap-2 uppercase tracking-wider">
          <Bot size={14} className="text-yellow-500" /> Aether AI Workspace
        </h2>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const currentMute = localStorage.getItem('isAetherMuted') === 'true';
              const nextMute = !currentMute;
              localStorage.setItem('isAetherMuted', String(nextMute));
              window.dispatchEvent(new Event('aether-mute-sync'));
            }}
            className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${voiceAudioEnabled ? 'text-[#a855f7]' : 'text-zinc-500'}`}
            title="Read Speech Output"
          >
            {voiceAudioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          <button
            onClick={() => {
              navigate('/assistant');
            }}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Fullscreen Workspace mode"
          >
            <Maximize2 size={13} />
          </button>

          <button 
            onClick={toggleRightSidebar}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
            title="Collapse Assistant"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Synchronized Brain Cortex Telemetry Indicators (Compact) */}
      <div className="p-3 bg-[#121215]/60 border-b border-zinc-800/80 shrink-0 select-none">
        <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 flex items-center justify-between">
          <span>Obsidian Brain Cache</span>
          <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1.5 rounded-sm border border-yellow-500/20 font-mono">Synced</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800/80">
            <div className="text-zinc-400 font-bold font-mono">{cortexSynapses?.length || 0}</div>
            <div className="text-[8px] text-zinc-500 mt-0.5 truncate uppercase">Rules</div>
          </div>
          <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800/80">
            <div className="text-zinc-400 font-bold font-mono">{notes?.length || 0}</div>
            <div className="text-[8px] text-zinc-500 mt-0.5 truncate uppercase">Docs</div>
          </div>
          <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800/80">
            <div className="text-zinc-400 font-bold font-mono">{projects?.reduce((acc: number, p: any) => acc + (p.dreamRecommendations?.length || 0), 0)}</div>
            <div className="text-[8px] text-zinc-500 mt-0.5 truncate uppercase">Dreams</div>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-zinc-800/50">
          <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase mb-1">
            <span>Cognitive Capacity</span>
            <span className="text-yellow-500 font-semibold">LVL {Math.max(1, Math.floor((cortexSynapses?.length || 0) / 2) + 1)} • {cortexSynapses?.length || 0} Synapses</span>
          </div>
          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full"
              initial={{ width: "10%" }}
              animate={{ width: `${Math.min(100, Math.max(10, ((cortexSynapses?.length || 0) % 2 === 0 && (cortexSynapses?.length || 0) > 0 ? 100 : ((cortexSynapses?.length || 0) % 2) * 50)))}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Chat Conversation Feed */}
      <div 
        onClick={() => { if (isSpeechPlaying) stopVoiceReply(); }}
        className={`flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-[#09090b] select-text ${isSpeechPlaying ? 'cursor-pointer' : ''}`}
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1 text-[11px] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.role === 'agent' && (
              <div className="flex items-center gap-1.5 mb-0.5 text-[9px] font-semibold text-yellow-500 uppercase tracking-widest pl-1">
                <Cpu size={10} className="animate-pulse" /> Aether Orchestrator
              </div>
            )}
            <div
              className={`px-3 py-2 rounded-xl max-w-full leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_2px_12px_rgba(234,179,8,0.06)]'
                  : 'bg-[#121214] text-zinc-350 border border-zinc-800/80 shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                 <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                 <div className="markdown-body prose prose-invert prose-p:leading-normal prose-pre:bg-[#09090b] prose-pre:border prose-pre:border-zinc-800 max-w-none text-[11px]">
                   <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{msg.content}</Markdown>
                 </div>
              )}

              {msg.actionFeedback && (
                <div className="mt-2 pt-1 border-t border-emerald-500/25 text-emerald-400 font-mono text-[9px] flex items-center gap-1.5">
                  <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{msg.actionFeedback}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-start gap-1 text-[11px]"
          >
            <div className="text-[9px] text-zinc-500 font-mono">Aether Consulting Brain...</div>
            <div className="bg-[#121214] border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <Loader2 size={11} className="text-indigo-400 animate-spin" />
              <span className="text-zinc-500 font-mono animate-pulse">Syncing states...</span>
            </div>
          </motion.div>
        )}

        {isSpeechPlaying && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              stopVoiceReply();
            }}
            className="sticky bottom-2 mx-auto max-w-[180px] px-3 py-1.5 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-500 border border-yellow-500/20 rounded-full text-center text-[10px] font-medium tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-md backdrop-blur-md z-50 animate-bounce"
          >
            <VolumeX size={11} className="animate-pulse" />
            <span>Tap to interrupt</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dictating vocal actions Overlay in sidebar info */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#18181b] border-t border-red-500/30 p-3 text-center space-y-2 select-none"
          >
            <div className="text-red-400 text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 animate-pulse font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Recording Voice Command
            </div>
            
            {/* Beautiful fluid-motion miniature audio wave */}
            <div className="flex items-end justify-center gap-0.5 h-6 w-full max-w-[120px] overflow-hidden px-2 mx-auto py-1 bg-zinc-950/45 rounded-lg border border-zinc-900/60 shadow-[inset_0_1px_4px_rgba(0,0,0,0.8)]">
              {[8, 16, 12, 18, 10, 14, 8].map((baseH, i) => (
                <motion.span
                  key={`sidebar-mini-wave-${i}`}
                  animate={{ height: [`3px`, `${baseH}px`, `3px`] }}
                  transition={{
                    duration: 0.5 + (i % 3) * 0.12,
                    repeat: Infinity,
                    ease: "easeInOut"
                    }}
                  className="w-0.5 rounded-t-full bg-red-500"
                />
              ))}
            </div>

            <div className="text-xl font-bold font-mono text-zinc-100">{recordingSeconds}s</div>

            {speechTranscript && (
              <div className="text-[9.5px] text-zinc-300 max-w-full px-2 py-1 bg-black/40 border border-zinc-900 rounded font-mono leading-tight max-h-12 overflow-y-auto custom-scrollbar">
                "{speechTranscript}"
              </div>
            )}

            <button
              onClick={stopRecording}
              className="px-3.5 py-1 text-[10px] bg-red-650 hover:bg-red-700 font-semibold text-white rounded-full mx-auto cursor-pointer"
            >
              Stop &amp; Review
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Box */}
      {errorMsg && (
        <div className="bg-rose-950/20 border-t border-rose-500/10 p-2 text-[9px] font-mono text-rose-400 text-center flex items-center justify-center gap-1.5 select-none">
          <AlertCircle size={11} /> <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="underline font-bold">close</button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-[#0c0c0e] border-t border-zinc-800 shrink-0 select-none">
        <div className="relative flex flex-col gap-2 bg-[#121214] border border-zinc-800 focus-within:border-indigo-500/50 rounded-xl p-2.5 transition-all">
           
           <div className="flex items-center">
              <Terminal size={12} className="text-zinc-500 ml-1 shrink-0" />
              <input 
                type="text" 
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  if (isSpeechPlaying) stopVoiceReply();
                }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Talk to Aether..."
                className="w-full bg-transparent border-none py-1 pl-2.5 pr-2 text-xs text-zinc-150 placeholder:text-zinc-650 focus:outline-none focus:ring-0 select-text"
              />
           </div>
           
           <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/40 mt-1">
             <div className="flex items-center gap-1">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors relative" 
                  title="Attach file"
                >
                  <Paperclip size={12} />
                  {attachedFiles.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-500 text-[8px] flex items-center justify-center rounded-full text-black font-extrabold">{attachedFiles.length}</span>
                  )}
                </button>

                {isSpeechPlaying && (
                  <button 
                    onClick={stopVoiceReply}
                    className="p-1.5 rounded transition-colors text-yellow-500 bg-yellow-500/10 animate-pulse"
                    title="Stop Aether Voice Playback"
                  >
                    <StopCircle size={12} />
                  </button>
                )}

                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-1.5 rounded transition-colors ${isRecording ? 'text-red-500 bg-red-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                  title="Voice command dictation"
                >
                  <Mic size={12} className={isRecording ? 'animate-pulse' : ''} />
                </button>
             </div>

             <button 
               onClick={() => handleSend()}
               disabled={isProcessing}
               className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/25 transition-colors flex items-center gap-1 shadow-sm"
             >
               <span className="text-[10px] font-semibold px-1">Send</span>
               <Send size={11} />
             </button>
           </div>
        </div>

        <div className="flex justify-between items-center mt-2 px-1 text-[9px] text-zinc-500">
          <span>🎯 Double-click floating widget to toggles</span>
          <span className="text-zinc-600">↵ to Send</span>
        </div>
      </div>

      {/* Voice Transcription Action Confirmation Modal */}
      <AnimatePresence>
        {showConfirmPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-5 text-left flex flex-col gap-4 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-xl">
                    <Mic size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider font-mono">Review Spoken Memo</h3>
                    <p className="text-[10px] text-zinc-500">How would you like to save this transcription?</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfirmPrompt(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1.5 hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Editable Transcript Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Transcribed Text</label>
                <textarea
                  value={editableTranscript}
                  onChange={(e) => setEditableTranscript(e.target.value)}
                  className="w-full h-24 bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/60 font-mono resize-none leading-relaxed"
                  placeholder="No transcribed speech detected..."
                />
              </div>

              {/* Note / Task Title Customizer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5 col-span-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Custom Title</label>
                  <input
                    type="text"
                    value={confirmTitle}
                    onChange={(e) => setConfirmTitle(e.target.value)}
                    placeholder="Auto-generated title"
                    className="w-full bg-zinc-950/80 border border-[#27272a] rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/60"
                  />
                </div>

                <div className="space-y-1.5 col-span-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Project Context</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-[#27272a] rounded-xl px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
                  >
                    <option value="">-- No Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const finalTitle = confirmTitle.trim() || `Voice Note - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    const projId = selectedProjectId || activeProjectId || projects[0]?.id;
                    if (!projId) {
                      setErrorMsg("Please create/select a project first.");
                      return;
                    }
                    addNote({
                      projectId: projId,
                      title: finalTitle,
                      content: editableTranscript,
                      tags: ['VoiceCapture']
                    });
                    
                    // Create visual chat feedback
                    setMessages(prev => [
                      ...prev,
                      {
                        id: `usr-note-${Date.now()}`,
                        role: 'user',
                        content: `Save speech note: "${finalTitle}"`
                      },
                      {
                        id: `ath-note-rep-${Date.now()}`,
                        role: 'agent',
                        content: `📝 **Success:** Dictated speech saved as Note: **"${finalTitle}"**.`
                      }
                    ]);
                    
                    setShowConfirmPrompt(false);
                  }}
                  className="p-3 bg-indigo-600/10 hover:bg-indigo-650/20 text-indigo-400 border border-indigo-500/15 rounded-xl text-center text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                >
                  <FileText size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Save as Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const finalTitle = confirmTitle.trim() || `Voice Task - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    const projId = selectedProjectId || activeProjectId || projects[0]?.id;
                    if (!projId) {
                      setErrorMsg("Please create/select a project first.");
                      return;
                    }
                    addIssue({
                      projectId: projId,
                      title: finalTitle,
                      description: editableTranscript,
                      type: 'Task',
                      priority: 'Medium',
                      status: 'Todo'
                    });

                    // Create visual chat feedback
                    setMessages(prev => [
                      ...prev,
                      {
                        id: `usr-task-${Date.now()}`,
                        role: 'user',
                        content: `Save speech task: "${finalTitle}"`
                      },
                      {
                        id: `ath-task-rep-${Date.now()}`,
                        role: 'agent',
                        content: `📋 **Success:** Dictated speech saved as Task: **"${finalTitle}"** added to project backlog.`
                      }
                    ]);

                    setShowConfirmPrompt(false);
                  }}
                  className="p-3 bg-emerald-600/10 hover:bg-emerald-650/20 text-emerald-400 border border-emerald-500/15 rounded-xl text-center text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer"
                >
                  <CheckSquare size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Save as Task</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInputValue(editableTranscript);
                    setShowConfirmPrompt(false);
                  }}
                  className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-center text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 col-span-1 cursor-pointer"
                >
                  <Edit3 size={12} />
                  <span>Edit in Chat Box</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Instantly trigger handleSend!
                    handleSend(editableTranscript);
                    setShowConfirmPrompt(false);
                  }}
                  className="p-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/15 rounded-xl text-center text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 col-span-1 cursor-pointer"
                >
                  <Send size={12} />
                  <span>Send direct Chat</span>
                </button>
              </div>

              <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-1 px-1 border-t border-zinc-900 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmPrompt(false);
                  }}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Discard transcription
                </button>
                <span>Aether WebSpeech Node</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </aside>
  );
}
