import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataProvider';
import { 
  Mic, 
  Square,
  Check, 
  X, 
  Sparkles, 
  Activity, 
  Trash2, 
  Volume2, 
  VolumeX,
  Play, 
  Clock, 
  AlertCircle, 
  FolderPlus, 
  Plus, 
  Lightbulb, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Send,
  Bot,
  Settings,
  Wifi,
  WifiOff,
  Terminal,
  Cpu,
  RefreshCw,
  LayoutDashboard,
  Sliders,
  Loader2
} from 'lucide-react';

export function VoiceHub() {
  const { 
    voiceQueue, 
    setVoiceQueue, 
    applyVoiceAction, 
    updateVoiceActionStatus,
    projects,
    issues,
    notes,
    cortexSynapses,
    setCortexSynapses,
    addVoiceAction,
    updateProject,
    phases,
    agents,
    aiContextRules,
    aetherPersonalityRules,
    setAetherPersonalityRules
  } = useData();

  // Unified AI Assistant & Terminal States
  const [activeLayoutTab, setActiveLayoutTab] = useState<'console' | 'gateway' | 'queue'>('console');
  const [activeTab, setActiveTab] = useState<'pending' | 'applied' | 'rejected'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ElevenLabs States
  const [elevenLabsEnabled, setElevenLabsEnabled] = useState(() => localStorage.getItem('elevenlabs_enabled') === 'true');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(() => localStorage.getItem('elevenlabs_api_key') || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(() => localStorage.getItem('elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM');

  // WhatsApp States (Direct QR Multi-Device Companion Pairing)
  const [whatsappBotNumber, setWhatsappBotNumber] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState(() => localStorage.getItem('whatsapp_access_token') || '');
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState(() => localStorage.getItem('whatsapp_phone_number_id') || '');
  const [whatsappVerifyToken, setWhatsappVerifyToken] = useState(() => localStorage.getItem('whatsapp_verify_token') || 'aether_verify_token');
  const [whatsappConfig, setWhatsappConfig] = useState<{
    active: boolean;
    botNumber: string;
    accessToken: string;
    phoneNumberId: string;
    verifyToken: string;
    pendingActionCount: number;
    logs: { time: string, type: 'info' | 'error' | 'action', text: string }[];
    connectionState?: 'unlinked' | 'initializing' | 'qr_ready' | 'linked';
    pairingCode?: string;
    linkedAccount?: string;
    qrString?: string;
    linkMethod?: 'multidevice' | 'clicktochat';
  }>({
    active: false,
    botNumber: 'Unconfigured',
    accessToken: '',
    phoneNumberId: '',
    verifyToken: 'aether_verify_token',
    pendingActionCount: 0,
    logs: [],
    connectionState: 'unlinked',
    pairingCode: '',
    linkedAccount: '',
    qrString: '',
    linkMethod: 'multidevice'
  });
  const [whatsappConnectLoading, setWhatsappConnectLoading] = useState(false);
  const [isRefreshingWhatsAppLogs, setIsRefreshingWhatsAppLogs] = useState(false);
  const [showWhatsappAuthRaw, setShowWhatsappAuthRaw] = useState(false);

  // WhatsApp Interactive Device Mockup Chat Conversation States
  const [whatsappChatHistory, setWhatsappChatHistory] = useState<{sender: 'user' | 'aether', text: string, type?: 'text' | 'voice', time: string}[]>([
    {
      sender: 'aether',
      text: "WhatsApp Bot online. Send me a voice memo or text, and I'll update your projects, backlog tasks, or notes in the Obsidian Semantic Brain instantly!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [whatsappDraftMessage, setWhatsappDraftMessage] = useState('');
  const [whatsappDeviceRecording, setWhatsappDeviceRecording] = useState(false);
  const [whatsappDeviceRecordingSeconds, setWhatsappDeviceRecordingSeconds] = useState(0);
  const whatsappDeviceTimerRef = useRef<any>(null);
  const whatsappDeviceStreamRef = useRef<MediaStream | null>(null);
  const whatsappDeviceRecorderRef = useRef<MediaRecorder | null>(null);
  const whatsappDeviceChunksRef = useRef<Blob[]>([]);
  const [whatsappDeviceProcessing, setWhatsappDeviceProcessing] = useState(false);

  // Gateway Sub-Tab Selection
  const [gatewaySubTab, setGatewaySubTab] = useState<'telegram' | 'whatsapp'>('telegram');
  const [simulatedPhone, setSimulatedPhone] = useState('+1 (310) 902-1845');
  
  // Mic Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micError, setMicError] = useState('');
  
  // Mic Web Audio Visuals Buffer
  const [frequencyBuffer, setFrequencyBuffer] = useState<number[]>(Array(24).fill(4));
  
  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Local Synthesizer / TTS replying audio state (100% Free & instant Web speech)
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Deep conversation helper
  const [pendingNote, setPendingNote] = useState<string | null>(null);

  // Chat interface console
  const [typedMessage, setTypedMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{sender: 'user' | 'aether', text: string, time: string}[]>([
    {
      sender: 'aether',
      text: "Greetings! I am Synapse Aether, your central orbital orchestrator. Type or record a vocal directive (e.g. 'create a new project called Mars Rover' or 'what are our active tasks?') and I will handle it.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Telegram Configuration States
  const [botToken, setBotToken] = useState('');
  const [botConfig, setBotConfig] = useState<{
    active: boolean;
    token: string;
    botName: string;
    pendingActionCount: number;
    logs: {time: string, type: 'info' | 'error' | 'action', text: string}[];
  }>({
    active: false,
    token: '',
    botName: 'Unconfigured',
    pendingActionCount: 0,
    logs: []
  });
  const [connectLoading, setConnectLoading] = useState(false);
  const [isRefreshingTelegramLogs, setIsRefreshingTelegramLogs] = useState(false);
  const [showTokenRaw, setShowTokenRaw] = useState(false);

  // Simulated gateway messenger state
  const [simTelegramUser, setSimTelegramUser] = useState('OrbitCommander');
  const [simTextOption, setSimTextOption] = useState('add notes detailing our rocket assembly rules in markdown');
  const [customSimText, setCustomSimText] = useState('');
  const [simulationLoading, setSimulationLoading] = useState(false);

  // Self-contained dynamic alert system
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4500);
  };

  // Convert status to styling classes
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse';
    }
  };

  const getIntentStyle = (intent: string) => {
    switch (intent) {
      case 'create_project':
        return {
          icon: <FolderPlus size={16} className="text-blue-400" />,
          label: 'Create Project',
          color: 'border-blue-500/30 bg-blue-500/5 text-blue-400'
        };
      case 'create_issue':
        return {
          icon: <Plus size={16} className="text-violet-400" />,
          label: 'Create Task',
          color: 'border-violet-500/30 bg-violet-500/5 text-violet-400'
        };
      case 'update_issue_status':
        return {
          icon: <CheckCircle2 size={16} className="text-emerald-400" />,
          label: 'Update Status',
          color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
        };
      case 'add_brainstorm_idea':
        return {
          icon: <Lightbulb size={16} className="text-amber-400" />,
          label: 'Brainstorm Idea',
          color: 'border-amber-500/30 bg-amber-500/5 text-amber-400'
        };
      case 'add_note':
        return {
          icon: <FileText size={16} className="text-cyan-400" />,
          label: 'Add Note/Doc',
          color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400'
        };
      default:
        return {
          icon: <Sparkles size={16} className="text-slate-400" />,
          label: 'AI Inferred Action',
          color: 'border-slate-500/30 bg-slate-500/5 text-slate-400'
        };
    }
  };

  const filteredActions = voiceQueue.filter(action => {
    if (activeTab === 'pending') return action.status === 'pending';
    if (action.status === 'applied') return action.status === 'applied';
    return action.status === 'rejected';
  });

  // Verbal Synthesis engine using native browser speech synthesizers or premium ElevenLabs TTS proxy
  const speakVoiceReply = async (speechText: string) => {
    if (!ttsEnabled) return;

    // Check if premium ElevenLabs mode is toggled 'on'
    const isPremiumTTS = localStorage.getItem('elevenlabs_enabled') === 'true';
    const elApiKey = localStorage.getItem('elevenlabs_api_key') || '';
    const elVoiceId = localStorage.getItem('elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM';

    if (isPremiumTTS && elApiKey) {
      try {
        const res = await fetch('/api/voice/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: speechText,
            apiKey: elApiKey,
            voiceId: elVoiceId
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.audioData) {
            const binaryStr = atob(data.audioData);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
            return; // Skip native SpeechSynthesis
          }
        }
      } catch (err) {
        console.error("Premium ElevenLabs TTS failed, falling back to local synthesizer:", err);
      }
    }

    try {
      window.speechSynthesis?.cancel();
      const cleanString = speechText.replace(/[*#`_\-]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanString);
      utterance.rate = 1.05;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis?.getVoices();
      const matchVoice = voices?.find(v => 
        v.lang.includes('en') && 
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Aria') || v.name.includes('Samantha'))
      );
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
      window.speechSynthesis?.speak(utterance);
    } catch (e) {
      console.error("Synthesizer playback error:", e);
    }
  };

  // Stable synchronization refs to avoid layout re-render loops triggering aggressive polling rate limit (Rate Exceeded)
  const projectsRef = useRef(projects);
  const issuesRef = useRef(issues);
  const cortexSynapsesRef = useRef(cortexSynapses || []);
  const notesRef = useRef(notes || []);
  const phasesRef = useRef(phases || []);
  const agentsRef = useRef(agents || []);
  const aiContextRulesRef = useRef(aiContextRules || "");
  const ttsEnabledRef = useRef(ttsEnabled);
  const addVoiceActionRef = useRef(addVoiceAction);
  const speakVoiceReplyRef = useRef(speakVoiceReply);
  const setActiveLayoutTabRef = useRef(setActiveLayoutTab);

  useEffect(() => {
    projectsRef.current = projects;
    issuesRef.current = issues;
    cortexSynapsesRef.current = cortexSynapses || [];
    notesRef.current = notes || [];
    phasesRef.current = phases || [];
    agentsRef.current = agents || [];
    aiContextRulesRef.current = aiContextRules || "";
    ttsEnabledRef.current = ttsEnabled;
    addVoiceActionRef.current = addVoiceAction;
    speakVoiceReplyRef.current = speakVoiceReply;
    setActiveLayoutTabRef.current = setActiveLayoutTab;
  }, [projects, issues, cortexSynapses, notes, phases, agents, aiContextRules, ttsEnabled, addVoiceAction, speakVoiceReply, setActiveLayoutTab]);

  // Connect & Polling Logic
  useEffect(() => {
    // 1. Sync current project lists state to backend cache (projects, issues, cortex synapses, notes, phases, agents, aiContextRules)
    const syncWorkspaceCache = async () => {
      try {
        await fetch('/api/voice/sync-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projects: projectsRef.current.map(p => ({ id: p.id, name: p.name, description: p.description })),
            issues: issuesRef.current.map(iss => ({ id: iss.id, projectId: iss.projectId, title: iss.title, status: iss.status })),
            cortexSynapses: cortexSynapsesRef.current,
            notes: notesRef.current,
            phases: phasesRef.current,
            agents: agentsRef.current,
            aiContextRules: aiContextRulesRef.current
          })
        });
      } catch (err: any) {
        if (err?.message?.includes('Failed to fetch') || err?.message?.includes('Load failed')) {
          console.debug("Network temporarily unavailable: sync-cache status offline");
        } else {
          console.error("Error syncing project state config cache:", err);
        }
      }
    };
    syncWorkspaceCache();

    // 2. Poll for pending actions retrieved from Telegram Bot Updates loop
    const checkTelegramPending = async () => {
      try {
        const response = await fetch('/api/telegram/pending-actions');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            return; // Skip silently if HTML (e.g. loading pages or 502/503 fallback templates) is served
          }
          const resJson = await response.json();
          if (resJson.actions && resJson.actions.length > 0) {
            resJson.actions.forEach((act: any) => {
              addVoiceActionRef.current({
                transcript: act.transcript,
                intent: act.intent,
                confidence: act.confidence,
                parsedData: act.parsedData,
                explanation: act.explanation
              });
              showToast(`📥 Synchronized remote instruction from Telegram: "${act.intent.toUpperCase()}"`);
              if (ttsEnabledRef.current) {
                speakVoiceReplyRef.current(`Incoming Telegram Directive: ${act.explanation}`);
              }
            });
            setActiveLayoutTabRef.current('queue');
          }
        }
      } catch (e: any) {
        if (e?.message?.includes('Failed to fetch') || e?.message?.includes('Load failed')) {
          console.debug("Network temporarily unavailable: telegram queues status offline");
        } else {
          console.error("Failed checking telegram queue inbox:", e);
        }
      }
    };

    // 3. Poll for pending actions retrieved from WhatsApp active inbox webhook
    const checkWhatsappPending = async () => {
      try {
        const response = await fetch('/api/whatsapp/pending-actions');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            return; // Skip silently
          }
          const resJson = await response.json();
          if (resJson.actions && resJson.actions.length > 0) {
            resJson.actions.forEach((act: any) => {
              addVoiceActionRef.current({
                transcript: act.transcript,
                intent: act.intent,
                confidence: act.confidence,
                parsedData: act.parsedData,
                explanation: act.explanation
              });
              showToast(`📥 Synchronized remote instruction from WhatsApp: "${act.intent.toUpperCase()}"`);
              if (ttsEnabledRef.current) {
                speakVoiceReplyRef.current(`Incoming WhatsApp Directive: ${act.explanation}`);
              }
            });
            setActiveLayoutTabRef.current('queue');
          }
        }
      } catch (e: any) {
        if (e?.message?.includes('Failed to fetch') || e?.message?.includes('Load failed')) {
          console.debug("Network temporarily unavailable: whatsapp queues status offline");
        } else {
          console.error("Failed checking whatsapp queue inbox:", e);
        }
      }
    };

    const intervalId = setInterval(() => {
      checkTelegramPending();
      checkWhatsappPending();
      syncWorkspaceCache();
    }, 5000); // Poll every 5s instead of 3s to minimize request rates and respect reverse proxy limit policy

    return () => clearInterval(intervalId);
  }, []);

  // Periodic logs & config puller for Telegram and WhatsApp Gateways
  useEffect(() => {
    const fetchTelegramConfig = async () => {
      try {
        const response = await fetch('/api/telegram/config');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            return; // Skip silently if non-JSON (HTML) page
          }
          const data = await response.json();
          setBotConfig(data);
          if (data.active && data.tokenRaw) {
            setBotToken(data.tokenRaw);
          }
        }
      } catch (e: any) {
        if (e?.message?.includes('Failed to fetch') || e?.message?.includes('Load failed')) {
          console.debug("Network temporarily unavailable: telegram gateway metrics offline");
        } else {
          console.error("Error getting live bot metrics:", e);
        }
      }
    };

    const fetchWhatsAppConfig = async () => {
      try {
        const response = await fetch('/api/whatsapp/config');
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            return; // Skip silently if non-JSON (HTML) page
          }
          const data = await response.json();
          setWhatsappConfig(data);
          if (data.active && data.botNumber) {
            setWhatsappBotNumber(data.botNumber);
          }
          if (Array.isArray(data.chatHistory)) {
            setWhatsappChatHistory(data.chatHistory);
          }
        }
      } catch (e: any) {
        if (e?.message?.includes('Failed to fetch') || e?.message?.includes('Load failed')) {
          console.debug("Network temporarily unavailable: whatsapp gateway config offline");
        } else {
          console.error("Error getting live WhatsApp details:", e);
        }
      }
    };

    fetchTelegramConfig();
    fetchWhatsAppConfig();

    const loopId = setInterval(() => {
      fetchTelegramConfig();
      fetchWhatsAppConfig();
    }, 6000);

    return () => clearInterval(loopId);
  }, []);

  const refreshTelegramLogs = async () => {
    setIsRefreshingTelegramLogs(true);
    try {
      const response = await fetch('/api/telegram/config');
      if (response.ok) {
        const data = await response.json();
        setBotConfig(data);
        showToast("Bot live telemetry log feed refreshed.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshingTelegramLogs(false);
    }
  };

  const refreshWhatsAppLogs = async () => {
    setIsRefreshingWhatsAppLogs(true);
    try {
      const response = await fetch('/api/whatsapp/config');
      if (response.ok) {
        const data = await response.json();
        setWhatsappConfig(data);
        showToast("WhatsApp live telemetry log feed refreshed.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshingWhatsAppLogs(false);
    }
  };

  // Microphone Audio Capture Functions
  const startRecordingStream = async () => {
    try {
      setMicError('');
      chunksRef.current = [];
      setRecordingSeconds(0);

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
        await processMicrophoneData();
      };

      // Create Web Audio spectrum analyzer for high fidelity microphone gauges
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
          const heights = Array.from(dataArray).slice(0, 24).map(val => 
            Math.max(4, Math.round((val / 255) * 44))
          );
          setFrequencyBuffer(heights);
          animationFrameRef.current = requestAnimationFrame(renderFrame);
        };
        renderFrame();
      } catch (err) {
        console.error("Web Audio spectrum visualizer initialization error:", err);
      }

      mediaRecorder.start(250);
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (e: any) {
      console.error(e);
      setMicError(e.message || "Microphone access blocked. Enable audio devices permissions.");
    }
  };

  const stopRecordingStream = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }

    setIsRecording(false);
  };

  const processMicrophoneData = async () => {
    if (chunksRef.current.length === 0) {
      setMicError("Nothing was captured in buffer.");
      return;
    }

    setIsProcessing(true);
    try {
      const audioBlob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        // Formulate target context data array
        const contextPayload = projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description
        }));

        const res = await fetch('/api/voice/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Data,
            mimeType: audioBlob.type,
            projectContexts: contextPayload,
            cortexSynapses: cortexSynapses || [],
            notes: notes || [],
            history: chatHistory.map(itm => ({
              role: itm.sender === 'user' ? 'user' : 'model',
              text: itm.text
            })),
            pendingNote: pendingNote
          })
        });

        if (!res.ok) {
          throw new Error(`Aether returned error status code: ${res.status}`);
        }

        const data = await res.json();
        
        // Append user voice speech and Aether message answers to active local console
        setChatHistory(prev => [
          ...prev,
          { sender: 'user', text: data.transcript || "[Spoken Audio Directive]", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          { sender: 'aether', text: data.explanation || "Analyzed voice input.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ]);

        if (data.shouldWriteDown === 'ask') {
          setPendingNote(data.noteContent || "");
        } else {
          setPendingNote(null);
        }

        if (data.intent && data.intent !== 'chat_query' && data.intent !== 'unknown') {
          addVoiceAction({
            transcript: data.transcript,
            intent: data.intent,
            confidence: data.confidence || 0.95,
            parsedData: data.parsedData || {},
            explanation: data.explanation
          });
          showToast(`💡 Proposed work item compiled: '${data.intent.toUpperCase()}'`);
        }

        if (data.aetherPersonalityRules) {
          setAetherPersonalityRules(data.aetherPersonalityRules);
        }

        // Voice speech synthesizer reply 
        speakVoiceReply(data.explanation);
      };
    } catch (err: any) {
      console.error(err);
      setMicError(err.message || "Failed decoding vocal recordings.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard console dispatch text prompt
  const submitTextCommand = async () => {
    if (!typedMessage.trim() || isProcessing) return;
    
    const plainText = typedMessage.trim();
    setTypedMessage('');
    setIsProcessing(true);

    // Render in instant history logs
    setChatHistory(prev => [
      ...prev,
      { sender: 'user', text: plainText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);

    try {
      const contexts = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      }));

      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textCommand: plainText,
          projectContexts: contexts,
          cortexSynapses: cortexSynapses || [],
          notes: notes || [],
          history: chatHistory.map(itm => ({
            role: itm.sender === 'user' ? 'user' : 'model',
            text: itm.text
          })),
          pendingNote: pendingNote
        })
      });

      if (!res.ok) {
        throw new Error(`Server network endpoint returned error: ${res.status}`);
      }

      const resData = await res.json();
      
      setChatHistory(prev => [
        ...prev,
        { sender: 'aether', text: resData.explanation, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);

      if (resData.shouldWriteDown === 'ask') {
        setPendingNote(resData.noteContent || "");
      } else {
        setPendingNote(null);
      }

      if (resData.intent && resData.intent !== 'chat_query' && resData.intent !== 'unknown') {
        addVoiceAction({
          transcript: resData.transcript || plainText,
          intent: resData.intent,
          confidence: resData.confidence || 0.98,
          parsedData: resData.parsedData || {},
          explanation: resData.explanation
        });
        showToast(`💡 Proposed action item compiled inside review queue.`);
      }

      if (resData.aetherPersonalityRules) {
        setAetherPersonalityRules(resData.aetherPersonalityRules);
      }

      // Voice response
      speakVoiceReply(resData.explanation);

    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        { sender: 'aether', text: `Consolidated dispatch failed: ${err.message || 'Connecting failure.'}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Telegram Configuration commands
  const handleConnectTelegram = async () => {
    if (!botToken.trim()) return;
    setConnectLoading(true);
    try {
      const response = await fetch('/api/telegram/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setBotConfig(prev => ({
          ...prev,
          active: true,
          botName: data.botName
        }));
        showToast(`🔋 Telegram Bot @${data.botName} initialized successfully!`);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Credentials testing rejected.");
      }
    } catch (err: any) {
      showToast(`❌ Connection Failed: ${err.message}`);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    try {
      const response = await fetch('/api/telegram/disconnect', { method: 'POST' });
      if (response.ok) {
        setBotConfig(prev => ({
          ...prev,
          active: false,
          botName: 'Unconfigured'
        }));
        setBotToken('');
        showToast("Telegram Polling Gateway deactivated.");
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Playtest Simulator dispatches
  const dispatchSimMessage = async (type: 'text' | 'voice') => {
    setSimulationLoading(true);
    try {
      const transcriptionText = type === 'text' ? customSimText || simTextOption : '';
      const voiceTextRepresentative = type === 'voice' ? simTextOption : '';

      const response = await fetch('/api/telegram/simulate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcriptionText,
          voiceText: voiceTextRepresentative,
          username: simTelegramUser
        })
      });

      if (response.ok) {
        const data = await response.json();
        showToast(`⚡ Simulation Successful: Message parsed by Aether AI.`);
        if (ttsEnabled) {
          speakVoiceReply(`Incoming Sim Msg: ${data.replyText}`);
        }
        setCustomSimText('');
        // Refresh logging list
        refreshTelegramLogs();
      }
    } catch (err: any) {
      showToast(`Simulation Error: ${err.message}`);
    } finally {
      setSimulationLoading(false);
    }
  };

  const handleInitDirectLink = async (method: 'multidevice' | 'clicktochat') => {
    setWhatsappConnectLoading(true);
    try {
      const response = await fetch('/api/whatsapp/init-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      });
      if (response.ok) {
        showToast(`📲 Requesting direct secure Baileys handshake session...`);
        // Refresh properties in ~1.2s to capture the generated credentials
        setTimeout(async () => {
          const r = await fetch('/api/whatsapp/config');
          if (r.ok) {
            const data = await r.json();
            setWhatsappConfig(data);
            showToast(`🔑 Handshake QR is ready! Scan it to sync instantly.`);
          }
        }, 1200);
      }
    } catch (err: any) {
      showToast(`❌ Connection Generation Error: ${err.message}`);
    } finally {
      setWhatsappConnectLoading(false);
    }
  };

  const handleConfirmDirectLink = async (phone: string) => {
    setWhatsappConnectLoading(true);
    try {
      const response = await fetch('/api/whatsapp/confirm-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phone || "+1 (310) 902-1845",
          code: whatsappConfig.pairingCode || "A87C-XP92"
        })
      });
      if (response.ok) {
        const data = await response.json();
        setWhatsappConfig(prev => ({
          ...prev,
          active: true,
          connectionState: 'linked',
          botNumber: data.botNumber,
          linkedAccount: data.linkedAccount,
          logs: [
            ...(prev.logs || []),
            { time: new Date().toLocaleTimeString(), type: 'info', text: `[Baileys-Core] Noise connection handoff accepted for mobile number: ${data.botNumber}` }
          ]
        }));
        setWhatsappBotNumber(data.botNumber);
        showToast(`🎉 Connected! Aether Linked instantly as companion.`);
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(`❌ Connection Failed: ${errData.error || 'Server rejected challenge'}`);
      }
    } catch (err: any) {
      showToast(`❌ Pairing Handshake Failed: ${err.message}`);
    } finally {
      setWhatsappConnectLoading(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    if (!whatsappBotNumber.trim() || !whatsappAccessToken.trim() || !whatsappPhoneNumberId.trim()) {
      showToast("⚠️ Please specify Bot Number, Phone ID, and Meta Access Token.");
      return;
    }
    setWhatsappConnectLoading(true);
    try {
      localStorage.setItem('whatsapp_access_token', whatsappAccessToken.trim());
      localStorage.setItem('whatsapp_phone_number_id', whatsappPhoneNumberId.trim());
      localStorage.setItem('whatsapp_verify_token', whatsappVerifyToken.trim());

      const response = await fetch('/api/whatsapp/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botNumber: whatsappBotNumber.trim(),
          accessToken: whatsappAccessToken.trim(),
          phoneNumberId: whatsappPhoneNumberId.trim(),
          verifyToken: whatsappVerifyToken.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setWhatsappConfig(prev => ({
          ...prev,
          active: true,
          botNumber: data.botNumber,
          connectionState: 'linked'
        }));
        showToast(`🔋 WhatsApp Cloud API Gateway initialized successfully!`);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Meta Verification Handshake failed.");
      }
    } catch (err: any) {
      showToast(`❌ Setup Failed: ${err.message}`);
    } finally {
      setWhatsappConnectLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      const response = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      if (response.ok) {
        setWhatsappConfig(prev => ({
          ...prev,
          active: false,
          botNumber: 'Unconfigured',
          connectionState: 'unlinked',
          linkedAccount: '',
          pairingCode: ''
        }));
        setWhatsappBotNumber('');
        setWhatsappAccessToken('');
        setWhatsappPhoneNumberId('');
        showToast("WhatsApp session disconnected successfully.");
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // WhatsApp smartphone direct recording start/stop handlers
  const startWhatsappDeviceRecord = async () => {
    try {
      whatsappDeviceChunksRef.current = [];
      setWhatsappDeviceRecordingSeconds(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      whatsappDeviceStreamRef.current = stream;

      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/ogg' };
      if (!MediaRecorder.isTypeSupported('audio/ogg')) options = { mimeType: '' };

      const mediaRecorder = new MediaRecorder(stream, options);
      whatsappDeviceRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          whatsappDeviceChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processWhatsappDeviceVoice();
      };

      mediaRecorder.start(200);
      setWhatsappDeviceRecording(true);
      whatsappDeviceTimerRef.current = setInterval(() => {
        setWhatsappDeviceRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      showToast(`Mic access blocked: ${err.message}`);
    }
  };

  const stopWhatsappDeviceRecord = () => {
    if (whatsappDeviceTimerRef.current) {
      clearInterval(whatsappDeviceTimerRef.current);
      whatsappDeviceTimerRef.current = null;
    }
    if (whatsappDeviceRecorderRef.current && whatsappDeviceRecorderRef.current.state !== 'inactive') {
      whatsappDeviceRecorderRef.current.stop();
    }
    if (whatsappDeviceStreamRef.current) {
      whatsappDeviceStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setWhatsappDeviceRecording(false);
  };

  const processWhatsappDeviceVoice = async () => {
    if (whatsappDeviceChunksRef.current.length === 0) return;
    setWhatsappDeviceProcessing(true);
    try {
      const audioBlob = new Blob(whatsappDeviceChunksRef.current, { type: whatsappDeviceRecorderRef.current?.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/whatsapp/simulate-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Data,
            mimeType: audioBlob.type,
            username: "WhatsApp Operator"
          })
        });

        if (!response.ok) throw new Error(`Handshake error ${response.status}`);
        const resData = await response.json();

        setWhatsappChatHistory(prev => [
          ...prev,
          {
            sender: 'user',
            text: resData.action?.transcript || '[Spoken Audio Directive]',
            type: 'voice',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            sender: 'aether',
            text: resData.replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        if (ttsEnabled) {
          speakVoiceReply(resData.replyText);
        }
      };
    } catch (err: any) {
      showToast(`Failed voice processing: ${err.message}`);
    } finally {
      setWhatsappDeviceProcessing(false);
    }
  };

  // Keyboard text message dispatch in smartphone mockup
  const handleSendWhatsappDeviceText = async () => {
    if (!whatsappDraftMessage.trim() || whatsappDeviceProcessing) return;
    const txt = whatsappDraftMessage.trim();
    setWhatsappDraftMessage('');
    setWhatsappDeviceProcessing(true);

    setWhatsappChatHistory(prev => [
      ...prev,
      {
        sender: 'user',
        text: txt,
        type: 'text',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      const response = await fetch('/api/whatsapp/simulate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: txt,
          username: "WhatsApp Operator"
        })
      });

      if (!response.ok) throw new Error(`Gateway returned error ${response.status}`);
      const resData = await response.json();

      setWhatsappChatHistory(prev => [
        ...prev,
        {
          sender: 'aether',
          text: resData.replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (ttsEnabled) {
        speakVoiceReply(resData.replyText);
      }
    } catch (err: any) {
      showToast(`Inbound Routing Error: ${err.message}`);
    } finally {
      setWhatsappDeviceProcessing(false);
    }
  };

  // Shared function to run intents dynamically inside tab-screen
  const applyApprovedVocalIntent = (intent: string, parsedData: any): string => {
    if (!intent || intent === 'chat_query' || intent === 'unknown') return '';
    try {
      // Create project fallback, etc.
      // We can use the already existing applyVoiceAction logic inside DataProvider 
      // by temporarily queuing and auto-applying it
      const tempId = `whatsapp-auto-${Date.now()}`;
      addVoiceAction({
        transcript: 'WhatsApp auto-committed request',
        intent: intent,
        confidence: 0.98,
        parsedData: parsedData,
        explanation: 'Fired automatically via direct interactive WhatsApp cockpit.'
      });
      return `Queued operation ${intent.toUpperCase()} into backlog queue. Check the Actions Queue tab to apply manually or review logs.`;
    } catch (err: any) {
      return `Direct action failed: ${err.message}`;
    }
  };

  const clearActionQueue = () => {
    setVoiceQueue([]);
    showToast("Local actions queue history cleared.");
  };

  const handleApproveProposal = (id: string) => {
    const feedback = applyVoiceAction(id);
    showToast(`✅ Approved! ${feedback}`);
    if (expandedId === id) setExpandedId(null);
  };

  const handleRejectProposal = (id: string) => {
    updateVoiceActionStatus(id, 'rejected');
    showToast("Operation proposal marked as Rejected.");
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div id="voice-synapse-terminal" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background radial aesthetics */}
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Floating Dynamic Alert banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-4 left-4 right-4 z-50 bg-slate-950/95 border border-indigo-500/40 text-slate-100 rounded-xl px-4 py-3 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles size={16} className="text-indigo-400 shrink-0" />
              <p className="text-xs font-medium truncate font-sans text-slate-200">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-200 shrink-0 p-1">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Title/Brand Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10 border-b border-slate-800/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 bg-gradient-to-tr from-yellow-500/20 to-amber-500/20 text-yellow-400 rounded-xl border border-yellow-500/15">
              <Bot size={22} className={isRecording ? 'animate-bounce' : 'animate-pulse text-yellow-400'} />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${botConfig.active ? 'bg-amber-500 animate-ping' : 'bg-amber-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white font-sans">Aether Workspace Portal</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-yellow-500/10 text-yellow-300 rounded border border-yellow-500/20">
                v2.0 Gateway
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">Full-stack central AI orchestrator, voice microphone decoder, &amp; Telegram control link.</p>
          </div>
        </div>

        {/* Layout Mode controls & TTS Switch */}
        <div className="flex items-center gap-2 mt-1 md:mt-0 w-full md:w-auto">
          {/* TTS Audio reply Toggle buttons */}
          <button
            onClick={() => {
              const enabled = !ttsEnabled;
              setTtsEnabled(enabled);
              showToast(enabled ? "🔊 Vocal Synthetic Speech feedback ENABLED (Free browser TTS service)" : "🔇 Vocal Speech muted.");
              if (enabled) speakVoiceReply("Speech synthesis activated.");
            }}
            title={ttsEnabled ? "Speech response enabled - Audio Volume" : "Auditory response disabled"}
            className={`p-2 rounded-xl border transition-all ${ttsEnabled ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
          >
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 flex-1 md:flex-initial">
            {(['console', 'gateway', 'queue'] as const).map((tab) => {
              const badgeCount = tab === 'queue' ? voiceQueue.filter(v => v.status === 'pending').length : 0;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveLayoutTab(tab)}
                  className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all flex items-center justify-center gap-1.5 ${
                    activeLayoutTab === tab
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'console' && <Terminal size={12} />}
                  {tab === 'gateway' && <Cpu size={12} />}
                  {tab === 'queue' && <CheckCircle2 size={12} />}
                  {tab}
                  {badgeCount > 0 && (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Terminal Shell Grid */}
      <div className="grid grid-cols-1 gap-6 relative z-10">
        
        {/* TAB 1: CONSOLE VIEW (Mic dictations, chat box, and transcript logs) */}
        {activeLayoutTab === 'console' && (
          <div className="space-y-4">
            
            {/* Split Panel: Left-hand Mic record block / Right-hand Conversational feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Vocal Microphone Console block */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-indigo-400'}`} />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {isRecording ? 'Capturing Microphone Audio' : 'Microphone Processor'}
                      </span>
                    </div>
                    {isRecording && (
                      <span className="text-xs font-mono text-rose-400 animate-pulse">
                        {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white mb-1">Aether Vocal Audio Deck</h3>
                  <p className="text-xs text-slate-400">Click and speak to Aether. No simulated prompts—your native microphone will translate spoken Blueprints instantly.</p>

                  {micError && (
                    <div className="mt-3 p-2 text-rose-400 border border-rose-500/20 bg-rose-500/5 rounded-lg flex items-center gap-2 text-xs">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="truncate">{micError}</span>
                    </div>
                  )}
                </div>

                {/* Real Physical Web Audio Waves Visualizer */}
                <div className="h-20 bg-slate-950/70 border border-slate-900/80 rounded-xl my-4 px-4 flex items-center justify-center gap-1.5 overflow-hidden relative shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)]">
                  {isRecording ? (
                    <>
                      {/* Left side mirrored wing */}
                      {[...frequencyBuffer].reverse().slice(0, 12).map((height, idx) => (
                        <div
                          key={`real-freq-l-${idx}`}
                          className="w-1.5 bg-gradient-to-t from-yellow-600 via-amber-500 to-yellow-350 rounded-full transition-all duration-75"
                          style={{ 
                            height: `${height}px`,
                            filter: `drop-shadow(0 0 4px ${height > 20 ? 'rgba(245,158,11,0.7)' : 'rgba(234,179,8,0.4)'})`
                          }}
                        />
                      ))}
                      {/* Active core pulse orb */}
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 mx-2 shadow-[0_0_15px_rgba(245,158,11,0.9)] animate-ping absolute" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mx-2 shadow-[0_0_8px_rgba(217,119,6,0.8)] z-10" />
                      {/* Right side mirrored wing */}
                      {frequencyBuffer.slice(0, 12).map((height, idx) => (
                        <div
                          key={`real-freq-r-${idx}`}
                          className="w-1.5 bg-gradient-to-t from-yellow-600 via-amber-500 to-yellow-350 rounded-full transition-all duration-75"
                          style={{ 
                            height: `${height}px`,
                            filter: `drop-shadow(0 0 4px ${height > 20 ? 'rgba(245,158,11,0.7)' : 'rgba(234,179,8,0.4)'})`
                          }}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="flex gap-1 mb-1 items-end h-8">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div 
                            key={`wave-idle-${i}`} 
                            className="w-1 bg-slate-800/60 rounded-full animate-pulse" 
                            style={{ 
                              height: `${4 + Math.sin(i * 0.3) * 10}px`,
                              animationDelay: `${i * 50}ms`
                            }} 
                          />
                        ))}
                      </div>
                      <span className="text-[9px] tracking-widest text-amber-500/60 font-mono font-bold">AETHER SPECTRUM COGNITIVE SYNC IDLE</span>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                      <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-yellow-300">Cognitive AI Analyzing Audio memo...</span>
                    </div>
                  )}
                </div>

                {/* Record Mic trigger panel */}
                <div className="flex gap-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecordingStream}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 text-black rounded-xl text-xs font-bold transition-all shadow-lg shadow-yellow-500/10 border border-yellow-500/20 cursor-pointer"
                    >
                      <Mic size={14} />
                      Start Voice Memo Record
                    </button>
                  ) : (
                    <button
                      onClick={stopRecordingStream}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 animate-pulse cursor-pointer"
                    >
                      <Square size={14} />
                      Finish &amp; Process Speech
                    </button>
                  )}
                </div>

                {/* Premium Voice Settings Panel (ElevenLabs integration) */}
                <div className="mt-4 bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={14} className={elevenLabsEnabled ? "text-amber-400 animate-pulse" : "text-slate-450"} />
                      <span className="text-[11px] font-bold font-sans tracking-wide text-slate-300">Premium Human Voice Synthesis</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={elevenLabsEnabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setElevenLabsEnabled(enabled);
                          localStorage.setItem('elevenlabs_enabled', String(enabled));
                          showToast(enabled ? "Premium ElevenLabs Voice synthesis turned ON." : "Standard robotic browser voice restored.");
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-amber-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-950/40 border peer-checked:border-amber-500/20 border-slate-700"></div>
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                    Switch from robotic SpeechSynthesis to premium, hyper-realistic synthesized speech from ElevenLabs!
                  </p>

                  {elevenLabsEnabled && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2 pt-1 border-t border-slate-900/60"
                    >
                      <div>
                        <label className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block mb-0.5">ElevenLabs API Secret Key</label>
                        <input
                          type="password"
                          value={elevenLabsApiKey}
                          onChange={(e) => {
                            setElevenLabsApiKey(e.target.value);
                            localStorage.setItem('elevenlabs_api_key', e.target.value);
                          }}
                          placeholder="PASTE YOUR ELEVENLABS API KEY..."
                          className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/40 focus:outline-none rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block mb-0.5">ElevenLabs Voice ID</label>
                        <input
                          type="text"
                          value={elevenLabsVoiceId}
                          onChange={(e) => {
                            setElevenLabsVoiceId(e.target.value);
                            localStorage.setItem('elevenlabs_voice_id', e.target.value);
                          }}
                          placeholder="e.g. 21m00Tcm4TlvDq8ikWAM (Rachel)"
                          className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500/40 focus:outline-none rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Chat Command logs Feed panel */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between min-h-[300px]">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                  <span className="text-xs font-mono text-yellow-500 tracking-wider font-semibold uppercase">Aether Console Feed</span>
                  <span className="text-[10px] text-slate-500 font-mono">Conversational thread with central AI</span>
                </div>

                {/* Log messages scrollbox */}
                <div className="space-y-4 overflow-y-auto max-h-[220px] pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                  {chatHistory.map((chat, idx) => (
                    <div key={`chat-bubble-${idx}`} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-slate-500 font-mono">{chat.time}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${chat.sender === 'user' ? 'text-yellow-400' : 'text-amber-400'}`}>
                          {chat.sender === 'user' ? 'You' : 'Aether AI'}
                        </span>
                      </div>
                      <div className={`p-3 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                        chat.sender === 'user' 
                          ? 'bg-yellow-500/10 border border-yellow-500/15 text-yellow-105' 
                          : 'bg-slate-900/90 border border-slate-800/80 text-slate-300'
                      }`}>
                        {chat.text}
                      </div>
                    </div>
                  ))}
                  {isProcessing && chatHistory[chatHistory.length-1]?.sender === 'user' && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-yellow-400 pl-1">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span>Aether is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Keyboard typing Input box */}
                <div className="mt-4 flex items-center gap-2 border-t border-slate-900 pt-3">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitTextCommand()}
                    placeholder="Type work commands e.g. 'what projects do we have?'..."
                    className="flex-1 bg-slate-900 border border-slate-850 hover:border-slate-700 focus:border-yellow-500/70 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white tracking-wide transition-colors font-sans"
                  />
                  <button
                    onClick={submitTextCommand}
                    disabled={!typedMessage.trim() || isProcessing}
                    className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 disabled:opacity-50 text-black font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </div>

              </div>

            </div>

            {/* Aether Cognitive Integration Reference */}
            <div className="bg-slate-950 border border-slate-850/80 rounded-xl p-4 mt-2">
              <div className="flex items-center gap-2 mb-3 border-b border-indigo-505/10 pb-2">
                <LayoutDashboard size={14} className="text-indigo-400" />
                <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">Aether AI System Blueprint & Synaptic Diagnostics</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Cpu size={14} className="text-purple-400" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-semibold">Synaptic Cortex</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Aether pulls dynamically from the Obsidian Brain, reading system markdown assets, active ideas, and project dreaming scopes continuously.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-450 mt-2 block">● REPO MEMORY INTEGRITY READY</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Bot size={14} className="text-indigo-400" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-semibold">Action Dispatcher</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Inbound voice recordings are synthesized instantly by our cognitive core, transforming natural speech into precise actionable project tasks.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-indigo-400 mt-2 block">● COMPILATION ENGINE ONLINE</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={14} className="text-emerald-450" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-semibold">Active Gateways</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Control Aether via standard Web interface dictation, Telegram poll bots, or Twilio WhatsApp secure webhooks for true cross-platform capability.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 mt-2 block">● GATEWAYS SECURED</span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/60 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sliders size={14} className="text-amber-400" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-semibold">Audio Synthesizer</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Select between standard rapid browser text-to-speech synthesis or activate premium high-fidelity voice profiles powered by our ElevenLabs module.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-amber-500 mt-2 block">● AUDIO DRIVER STAGED</span>
                </div>
              </div>
            </div>

          </div>
        )}

               {/* TAB 2: REMOTE POLL GATEWAYS */}
        {activeLayoutTab === 'gateway' && (
          <div className="space-y-6">
            
            {/* Sub-tab switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl max-w-sm border border-slate-800">
              <button
                onClick={() => setGatewaySubTab('telegram')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  gatewaySubTab === 'telegram'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot size={13} /> Telegram Bot API
              </button>
              <button
                onClick={() => setGatewaySubTab('whatsapp')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  gatewaySubTab === 'whatsapp'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles size={13} className="text-emerald-400" /> Mobile Companion Link
              </button>
            </div>

            {gatewaySubTab === 'telegram' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                {/* Token Configuration Console */}
                <div className="lg:col-span-12 xl:col-span-12 lg:col-span-12 xl:col-span-5 space-y-4">
                  <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot size={18} className="text-indigo-400" />
                      <h3 className="text-sm font-bold text-white font-sans">Telegram Bot Gateway Link</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Coordinate your workspace completely hands-free via mobile! Create a Telegram bot using BotFather, insert your Token below, and send it texts or audio notes to interact with the workspace instantly.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Telegram Bot Token Secret</label>
                        <div className="flex gap-2">
                          <input
                            type={showTokenRaw ? "text" : "password"}
                            value={botToken}
                            onChange={(e) => setBotToken(e.target.value)}
                            placeholder="0000000000:AAxxxxxxxxx..."
                            disabled={botConfig.active}
                            className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl px-3 py-2 text-xs text-white font-mono"
                          />
                          <button 
                            onClick={() => setShowTokenRaw(!showTokenRaw)}
                            className="px-2.5 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/40 rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            {showTokenRaw ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>

                      {/* Status row and actions */}
                      <div className="flex items-center justify-between py-1 pt-2">
                        <div className="flex items-center gap-1.5">
                          {botConfig.active ? (
                            <>
                              <Wifi size={14} className="text-emerald-400 animate-pulse" />
                              <span className="text-xs font-mono font-semibold text-emerald-400">ONLINE: @{botConfig.botName}</span>
                            </>
                          ) : (
                            <>
                              <WifiOff size={14} className="text-slate-500" />
                              <span className="text-xs font-mono text-slate-500">DISCONNECTED</span>
                            </>
                          )}
                        </div>

                        {botConfig.active ? (
                          <button
                            onClick={handleDisconnectTelegram}
                            className="px-4 py-1.5 text-xs font-semibold bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl transition-all cursor-pointer"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={handleConnectTelegram}
                            disabled={connectLoading || !botToken.trim()}
                            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl border border-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            {connectLoading && <RefreshCw size={12} className="animate-spin" />}
                            Connect Bot
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick tutorial notes */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4">
                    <h4 className="text-[11px] font-bold text-slate-300 font-sans uppercase mb-2">15-Second Gateway Tutorial:</h4>
                    <ul className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed font-sans">
                      <li>Open Telegram and search for <span className="text-slate-200">@BotFather</span>.</li>
                      <li>Compose message <code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-amber-300">/newbot</code> and copy the Token.</li>
                      <li>Paste it above, tap Connect, and begin speaking to your robot!</li>
                    </ul>
                  </div>
                </div>

                {/* Bot Updates Terminal Ticker */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                  {/* Live Output Logs Ticker */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 min-h-[460px] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Terminal size={14} className="text-slate-400" />
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Gateway Activity Live Monitor</span>
                      </div>
                      <button 
                        onClick={refreshTelegramLogs}
                        disabled={isRefreshingTelegramLogs}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} className={isRefreshingTelegramLogs ? "animate-spin" : ""} />
                      </button>
                    </div>

                    {/* Logs stream box */}
                    <div className="bg-slate-900/60 rounded-lg p-3 h-96 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin">
                      {botConfig.logs && botConfig.logs.length > 0 ? (
                        botConfig.logs.map((log, lIdx) => (
                          <div key={`log-${lIdx}`} className="flex items-start gap-2 border-b border-slate-950/20 pb-1">
                            <span className="text-slate-600 shrink-0">[{log.time}]</span>
                            <span className={`shrink-0 uppercase text-[9px] px-1 py-px rounded ${
                              log.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                              log.type === 'action' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              'bg-slate-800 text-indigo-400 border border-slate-705'
                            }`}>
                              {log.type}
                            </span>
                            <span className="text-slate-300 break-all">{log.text}</span>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 font-sans italic text-xs">
                          No transactions registered yet. Monitor processes live socket telemetry from the online bot token.
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 font-sans text-right block mt-1">Live updates refresh in real-time</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                {/* Configuration Console Side */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-emerald-400" />
                        <h3 className="text-sm font-bold text-white font-sans">Mobile Companion Link Console</h3>
                      </div>
                      <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                        Sandbox Simulator
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Authorizing Aether's companion device via the sandbox simulation setup. Since Aether executes in an offline preview, this connects directly with our **Mobile Companion Web Client**, allowing you to execute tasks on your phone browser or another tab.
                    </p>

                    {/* Unlinked Setup Flow */}
                    {(!whatsappConfig.connectionState || whatsappConfig.connectionState === 'unlinked') && (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 text-center space-y-4 animate-scaleUp">
                        <span className="text-4xl block">📱</span>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white font-sans">Companion Device Link Node</h4>
                          <p className="text-[11px] text-slate-400 leading-normal max-w-[280px] mx-auto">
                            Integrates with standard multi-device framework. Direct secure client transport and noise encryption layer.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            onClick={() => handleInitDirectLink('multidevice')}
                            disabled={whatsappConnectLoading}
                            className="w-full py-2.5 px-4 text-xs font-bold bg-emerald-650 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 text-white rounded-xl border border-emerald-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          >
                            {whatsappConnectLoading ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                Requesting handoff handshake...
                              </>
                            ) : (
                              <>
                                ✨ Generate Direct Pairing QR Code
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Initializing Load Flow */}
                    {whatsappConfig.connectionState === 'initializing' && (
                      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 text-center space-y-4 flex flex-col items-center justify-center">
                        <RefreshCw size={24} className="text-emerald-400 animate-spin" />
                        <div className="space-y-1">
                          <span className="text-xs font-mono font-bold text-slate-350 block">BUILDING NOISE PAIRING NODES</span>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Executing ECDH 25519-bit keygen challenge...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Handshake QR and Code Ready Flow */}
                    {whatsappConfig.connectionState === 'qr_ready' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                          {/* White high-contrast QR Frame */}
                          <div className="bg-white p-2.5 rounded-xl shrink-0 w-[124px] h-[124px] flex items-center justify-center relative shadow-xl">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                                `${window.location.origin}/whatsapp-companion?code=${whatsappConfig.pairingCode || 'A87C-XP92'}`
                              )}`}
                              alt="WhatsApp Bot Pairing QR"
                              className="w-[108px] h-[108px]"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Instructions Column */}
                          <div className="flex-1 space-y-2">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">Option A: Scan QR Code</span>
                            <ol className="text-[11px] text-slate-350 space-y-1.5 font-sans leading-relaxed list-decimal pl-4">
                              <li>Open your phone's default <strong className="text-white">System Camera App</strong>.</li>
                              <li>Scan the QR code to open the browser-based <strong className="text-emerald-400">Ether Companion</strong>.</li>
                              <li>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span>Or click to test in a new tab:</span>
                                  <a 
                                    href={`/whatsapp-companion?code=${whatsappConfig.pairingCode || 'A87C-XP92'}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-emerald-400 font-bold underline hover:text-emerald-300 cursor-pointer text-xs"
                                  >
                                    Open Sandbox Companion UI ↗
                                  </a>
                                </div>
                              </li>
                            </ol>
                            
                            {/* Copy companion URL Helper */}
                            <div className="pt-1.5 flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  const url = `${window.location.origin}/whatsapp-companion?code=${whatsappConfig.pairingCode || 'A87C-XP92'}`;
                                  navigator.clipboard.writeText(url);
                                  showToast("📋 Companion link copied to clipboard!");
                                }}
                                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-mono hover:text-white text-slate-300 px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                🔗 Copy Companion Link Setup URL
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Separation Border */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <div className="h-px bg-slate-900 flex-1" />
                          <span className="px-3 uppercase tracking-wider">or link with text code</span>
                          <div className="h-px bg-slate-900 flex-1" />
                        </div>

                        {/* Warning/Guideline banner */}
                        <div className="bg-amber-950/30 border border-amber-500/35 text-[10.5px] p-3 rounded-xl text-amber-200/95 leading-relaxed font-sans space-y-1.5">
                          <span className="font-bold block text-xs tracking-tight text-amber-300">🚨 WHY ARE YOU GETTING "INVALID QR" OR "COULD NOT LINK"?</span>
                          <p>
                            Aether is a <strong>simulated developer sandbox environment with local persistent state</strong>. It does <strong>NOT</strong> have Meta API business authorization keys registered.
                          </p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Do <strong>NOT</strong> scan this QR code inside your official WhatsApp app settings under "Link a device". This results in the <strong className="text-white">"invalid QR code"</strong> error.</li>
                            <li>Do <strong>NOT</strong> type Option B's pairing code inside your official WhatsApp mobile app text prompt. This results in the <strong className="text-white">"could not link device"</strong> error.</li>
                            <li><strong>HOW TO LINK PROPERLY:</strong> Move away from official WhatsApp settings. Scan this QR with your <strong>phone's system camera</strong> or open the <strong>Companion Link Setup URL</strong>. This launches our custom Aether WhatsApp mock client on your browser, which links with the workspace perfectly!</li>
                          </ul>
                        </div>

                        {/* Monospace pairing code board */}
                        <div className="bg-slate-900 border border-slate-805 p-3 rounded-xl flex items-center justify-between animate-fadeIn">
                          <div>
                            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-505 block">Option B: Sandbox Companion Pairing Code</span>
                            <span className="text-sm font-mono font-extrabold text-emerald-450 tracking-wider">
                              {whatsappConfig.pairingCode || "A87C-XP92"}
                            </span>
                          </div>
                          <span className="text-[10px] max-w-[160px] text-right text-slate-400 leading-normal font-sans">
                            Enter this code inside Aether's custom WhatsApp Companion webpage.
                          </span>
                        </div>

                        {/* Regenerating QR Code box (Explicit button requested!) */}
                        <div className="flex justify-between items-center bg-slate-900/30 border border-slate-850 p-3 rounded-xl gap-2">
                          <span className="text-[10px] text-slate-400 leading-tight">Need a fresh code or scanning expired?</span>
                          <button
                            onClick={() => handleInitDirectLink('multidevice')}
                            disabled={whatsappConnectLoading}
                            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-emerald-400 hover:text-emerald-300 rounded-lg px-2.5 py-1.5 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap border border-slate-700 shadow"
                          >
                            <RefreshCw size={10} className={whatsappConnectLoading ? "animate-spin" : ""} />
                            Regenerate Code
                          </button>
                        </div>

                        {/* Linked Devices Setup Confirm Connector */}
                        <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 space-y-2">
                          <span className="text-[10px] font-mono text-emerald-450 uppercase font-semibold block">
                            Confirm Connection Status
                          </span>
                          <p className="text-[11px] text-slate-400 font-sans leading-normal">
                            Once Linked inside your mobile app via either QR scanner or Companion Code, enter your phone number to declare connection status and activate synchronization:
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={simulatedPhone}
                              onChange={(e) => setSimulatedPhone(e.target.value)}
                              placeholder="+1 (555) 019-2834"
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 placeholder-slate-700 w-full focus:outline-none focus:border-emerald-500/50"
                            />
                            <button
                              onClick={() => handleConfirmDirectLink(simulatedPhone)}
                              disabled={whatsappConnectLoading}
                              className="px-3.5 py-1.5 text-xs font-bold bg-emerald-650 hover:bg-emerald-600 border border-emerald-500/10 rounded-lg text-white transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 shadow"
                            >
                              {whatsappConnectLoading && <RefreshCw size={11} className="animate-spin" />}
                              Confirm Link
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Connection Linked Active State Board */}
                    {whatsappConfig.connectionState === 'linked' && (
                      <div className="space-y-4 animate-scaleUp">
                        <div className="bg-emerald-950/25 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                            <span className="text-xs uppercase font-mono font-bold text-emerald-400">SESSION LINK ACTIVE</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                              <span className="text-slate-500 uppercase font-mono text-[9px] block">Linked Account</span>
                              <span className="text-slate-200 font-mono font-bold tracking-tight block truncate">
                                {whatsappConfig.linkedAccount || whatsappConfig.botNumber || "+1 (555) 019-2834"}
                              </span>
                            </div>
                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                              <span className="text-slate-500 uppercase font-mono text-[9px] block">Node Status</span>
                              <span className="text-emerald-400 font-bold block">
                                Listening Live
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                            Aether is connected directly as a companion device. It is monitoring incoming voice-notes, text prompts, or tasks, and automatically synchronizing them with your central agent processor.
                          </p>
                        </div>

                        {/* Action Buttons inside linked connection */}
                        <div className="flex justify-end">
                          <button
                            onClick={handleDisconnectWhatsApp}
                            className="px-4 py-1.5 text-xs font-semibold bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/20 rounded-xl transition-all cursor-pointer shadow-sm"
                          >
                            Disconnect Companion
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Client Handshake Details */}
                  <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">Client Handshake Protocol Details</span>
                    <p className="text-xs text-slate-400 leading-normal font-sans">
                      This implementation utilizes native secure WebSocket tunnels. No Facebook Business verification checks are enforced, enabling immediate developer access.
                    </p>
                  </div>
                </div>

                {/* WhatsApp Companion Documentation, Setup Manual and Live Monitor */}
                <div className="lg:col-span-7 space-y-4">
                  {/* WhatsApp Diagnostic Guidance */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                      <AlertCircle size={16} className="text-emerald-400" />
                      <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider">Linked Devices Directory & Setup Instructions</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Section 1: Finding Linked Devices */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold tracking-wide">
                          📍 Finding the "Linked Devices" Settings
                        </span>
                        <p className="text-xs text-slate-400 leading-normal">
                          WhatsApp supports up to four linked companion devices without needing to keep your main phone online. If you are having trouble finding the settings:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 space-y-1">
                            <span className="text-[10px] uppercase font-mono font-bold text-slate-300">Apple iOS (iPhone)</span>
                            <ul className="text-[11px] text-slate-400 list-disc pl-3.5 space-y-1">
                              <li>Open <strong className="text-white">WhatsApp</strong></li>
                              <li>Tap the <strong className="text-white">Settings</strong> gear icon (bottom right)</li>
                              <li>Select <strong className="text-white">Linked Devices</strong></li>
                              <li>Tap the blue <strong className="text-white">Link a Device</strong> action</li>
                            </ul>
                          </div>

                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 space-y-1">
                            <span className="text-[10px] uppercase font-mono font-bold text-slate-300">Google Android</span>
                            <ul className="text-[11px] text-slate-400 list-disc pl-3.5 space-y-1">
                              <li>Open <strong className="text-white">WhatsApp</strong></li>
                              <li>Tap the <strong className="text-white">Menu</strong> (three vertical dots, top right)</li>
                              <li>Select <strong className="text-white">Linked Devices</strong></li>
                              <li>Tap the green <strong className="text-white">Link a Device</strong> action</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: What is a Companion Pairing Code? */}
                      <div className="space-y-1.5 border-t border-slate-900 pt-3">
                        <span className="text-[11px] font-mono text-emerald-450 uppercase font-semibold tracking-wide">
                          🔑 Option B: What is Sandbox Companion pairing?
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Companion pairing is an alternative sandbox mechanism to link a virtual WhatsApp smartphone simulator on your device. It bypasses any need for Meta Developer credentials, letting you test instant speech-to-text messaging pipelines.
                        </p>
                        <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-850 space-y-2">
                          <span className="text-[10px] uppercase font-mono text-slate-300 block font-bold">How to Link option B:</span>
                          <ol className="text-[11px] text-slate-400 space-y-1.5 list-decimal pl-4 leading-normal">
                            <li>Keep Aether's 8-character pairing code visible (e.g. <code className="font-mono text-emerald-400 bg-slate-950 px-1 py-0.5 rounded font-bold">{whatsappConfig.pairingCode || "A87C-XP92"}</code>).</li>
                            <li>Click "Open Sandbox Companion UI" above or scan the QR code with your smartphone's system camera helper.</li>
                            <li>On Aether's custom Companion page, enter your simulated phone number and type the 8-character code shown above.</li>
                            <li>Click "Authorize & Link Device" to establish the web-socket data stream and connect.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Live Output Logs Ticker */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 min-h-[220px] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Terminal size={14} className="text-slate-400" />
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">WhatsApp Direct Link Monitor</span>
                      </div>
                      <button 
                        onClick={refreshWhatsAppLogs}
                        disabled={isRefreshingWhatsAppLogs}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} className={isRefreshingWhatsAppLogs ? "animate-spin" : ""} />
                      </button>
                    </div>

                    {/* Logs stream box */}
                    <div className="bg-slate-900/60 rounded-lg p-3 h-40 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin">
                      {whatsappConfig.logs && whatsappConfig.logs.length > 0 ? (
                        whatsappConfig.logs.map((log, lIdx) => (
                          <div key={`log-${lIdx}`} className="flex items-start gap-2 border-b border-slate-950/20 pb-1">
                            <span className="text-slate-600 shrink-0">[{log.time}]</span>
                            <span className={`shrink-0 uppercase text-[9px] px-1 py-px rounded ${
                              log.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                              log.type === 'action' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              'bg-slate-800 text-emerald-400 border border-slate-705'
                            }`}>
                              {log.type}
                            </span>
                            <span className="text-slate-300 break-all">{log.text}</span>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 font-sans italic text-xs">
                          No transactions registered yet. Monitor shows direct noise socket handshakes and agent linkage.
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 font-sans text-right block mt-1">Live updates refresh in real-time</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STRUCTURED ACTIONS QUEUE LIST */}
        {activeLayoutTab === 'queue' && (
          <div className="space-y-4">
            
            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center bg-slate-950 px-4 py-3 border-b border-slate-800">
                <div className="flex gap-2">
                  {(['pending', 'applied', 'rejected'] as const).map(tab => {
                    const count = voiceQueue.filter(v => v.status === tab).length;
                    return (
                      <button
                        key={`tab-filter-${tab}`}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          activeTab === tab
                            ? 'bg-slate-800 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                          activeTab === tab ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {voiceQueue.length > 0 && (
                  <button
                    onClick={clearActionQueue}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-semibold"
                  >
                    <Trash2 size={12} /> Clear Queue Logs
                  </button>
                )}
              </div>

              {/* Collapsible Action Queue rows */}
              <div className="divide-y divide-slate-850 max-h-[380px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {filteredActions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-16 px-4 text-center text-slate-500"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center mx-auto mb-3">
                        <Activity size={16} className="text-slate-600" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">NO DIRECTIVES COMPILED</h4>
                      <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto font-sans leading-relaxed">
                        {activeTab === 'pending'
                          ? "Voice recordings or Telegram messages carrying operational blueprints will sync here for vetting."
                          : `No items found currently marked as ${activeTab}.`}
                      </p>
                    </motion.div>
                  ) : (
                    filteredActions.map(action => {
                      const isExpanded = expandedId === action.id;
                      const intentConfig = getIntentStyle(action.intent);

                      return (
                        <motion.div
                          key={`row-${action.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`transition-colors border-l-2 ${isExpanded ? 'bg-slate-900/40 border-l-indigo-500' : 'hover:bg-slate-900/10 border-l-transparent'}`}
                        >
                          {/* Item summary banner */}
                          <div
                            onClick={() => setExpandedId(isExpanded ? null : action.id)}
                            className="px-4 py-3.5 flex items-center justify-between gap-4 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`p-2 rounded-lg border shrink-0 ${intentConfig.color}`}>
                                {intentConfig.icon}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis font-mono">
                                  "{action.transcript}"
                                </p>
                                <div className="flex items-center gap-2 mt-1 font-sans">
                                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(action.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="text-slate-700 font-bold">•</span>
                                  <span className="text-[10px] font-mono text-emerald-400">
                                    {(action.confidence * 100).toFixed(0)}% AI certainty
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className={`text-[9px] font-mono border px-2 py-0.5 rounded uppercase ${getStatusBadgeColor(action.status)}`}>
                                {action.status}
                              </span>
                              <div className="text-slate-500">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>
                          </div>

                          {/* Interactive Drawer details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-slate-900 bg-slate-950/60"
                              >
                                <div className="p-4 space-y-4 text-xs font-sans">
                                  {/* Explanation and intent descriptions */}
                                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                                    <h5 className="text-[10px] font-mono uppercase text-indigo-400 font-bold mb-1">AETHER EXPLANATION:</h5>
                                    <p className="text-slate-300 leading-relaxed text-xs">{action.explanation}</p>
                                  </div>

                                  {/* Sub parameters key value values */}
                                  <div className="grid grid-cols-2 gap-3 bg-slate-900/30 p-3 rounded-lg border border-slate-850">
                                    <div>
                                      <h6 className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-0.5 block">Operation Target Intent</h6>
                                      <span className={`text-[11px] px-2 py-0.5 font-semibold rounded border inline-block ${intentConfig.color}`}>
                                        {intentConfig.label}
                                      </span>
                                    </div>
                                    <div>
                                      <h6 className="text-[9px] uppercase font-mono tracking-widest text-slate-500 mb-0.5 block font-bold">Identified parameters</h6>
                                      <p className="text-slate-200 font-mono font-medium truncate text-xs">
                                        {action.intent === 'create_project' && `Project Name: ${action.parsedData?.name}`}
                                        {action.intent === 'create_issue' && `Task Title: ${action.parsedData?.title}`}
                                        {action.intent === 'update_issue_status' && `Status: ${action.parsedData?.newStatus}`}
                                        {action.intent === 'add_brainstorm_idea' && `Text: ${action.parsedData?.text}`}
                                        {action.intent === 'add_note' && `Note Title: ${action.parsedData?.title}`}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Parameters code dump */}
                                  <div>
                                    <span className="text-[9px] uppercase font-mono text-slate-500 block mb-1">Extracted API Schema JSON payload</span>
                                    <pre className="p-3 bg-slate-950 border border-slate-900 rounded-xl text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-32">
                                      {JSON.stringify(action.parsedData, null, 2)}
                                    </pre>
                                  </div>

                                  {/* Action Controls */}
                                  {action.status === 'pending' && (
                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-900">
                                      <button
                                        onClick={() => handleRejectProposal(action.id)}
                                        className="px-3.5 py-2 font-semibold bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-850 hover:border-slate-750 rounded-xl transition-all flex items-center gap-1 text-xs"
                                      >
                                        <X size={14} /> Reject Proposal
                                      </button>
                                      <button
                                        onClick={() => handleApproveProposal(action.id)}
                                        className="px-4 py-2 font-bold bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl transition-all flex items-center gap-1.5 border border-indigo-500/20 shadow-md shadow-indigo-600/10 text-xs"
                                      >
                                        <Check size={14} /> Approve Action
                                      </button>
                                    </div>
                                  )}

                                  {action.status === 'applied' && (
                                    <div className="flex items-center gap-2 text-emerald-400 font-semibold py-1">
                                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                      <span>Action successfully applied to the workspace.</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
