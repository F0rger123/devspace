import React, { useState } from 'react';
import {
  ShieldCheck,
  Eye,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  Trash2,
  Download,
  Lock,
  PauseCircle,
  RotateCcw,
  Key,
  CheckCircle2,
  AlertTriangle,
  Brain,
  HardDrive,
} from 'lucide-react';
import { aetherCore, PersonalMemoryItem } from '../lib/aetherCore';
import { aetherPresenceEngine } from '../lib/aetherPresenceEngine';

export function AetherPrivacyDashboard() {
  const [memories, setMemories] = useState<PersonalMemoryItem[]>(() => aetherCore.getMemories());
  const [learningPaused, setLearningPaused] = useState<boolean>(false);
  const [cameraSettings, setCameraSettings] = useState(() => aetherPresenceEngine.getCameraFocusSettings());
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [desktopAwarenessEnabled, setDesktopAwarenessEnabled] = useState<boolean>(true);
  const [forgetTopicInput, setForgetTopicInput] = useState<string>('');

  const handleToggleCameraOptIn = () => {
    if (cameraSettings.userOptedIn) {
      const updated = aetherPresenceEngine.optOutCameraFocus();
      setCameraSettings(updated);
    } else {
      const updated = aetherPresenceEngine.optInCameraFocus();
      setCameraSettings(updated);
    }
  };

  const handleDeleteMemory = (id: string) => {
    aetherCore.deleteMemory(id);
    setMemories([...aetherCore.getMemories()]);
  };

  const handleForgetTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgetTopicInput.trim()) return;

    const topicLower = forgetTopicInput.toLowerCase();
    const toDelete = memories.filter((m) => m.topic.toLowerCase().includes(topicLower) || m.tags.some((t) => t.toLowerCase().includes(topicLower)));

    toDelete.forEach((m) => aetherCore.deleteMemory(m.id));
    setMemories([...aetherCore.getMemories()]);
    setForgetTopicInput('');
  };

  const handleResetBehavioralLearning = () => {
    if (confirm('Are you sure you want to reset all learned behavioral patterns?')) {
      aetherCore.resetBehavioralPatterns();
      setMemories([...aetherCore.getMemories()]);
    }
  };

  const handleExportPersonalData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      userMemories: aetherCore.getMemories(),
      behavioralPatterns: aetherCore.getBehavioralPatterns(),
      securityVault: aetherCore.getSecurityVaultStatus(),
      privacyPermissions: aetherCore.getPermissionAuditLogs(),
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-privacy-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-zinc-200 font-sans">
      {/* HEADER CARD */}
      <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span>Aether Privacy & Zero-Trust Governance Center</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                  100% On-Device Enforced
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-sans">
                Full sovereignty over your personal data, camera, microphone, memories, and learning models.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportPersonalData}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 text-xs font-bold transition flex items-center gap-2"
          >
            <Download size={14} className="text-emerald-400" />
            <span>Export Personal Data JSON</span>
          </button>
        </div>
      </div>

      {/* SENSOR & PERMISSION CONTROLS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* CAMERA CONTROL */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 flex items-center gap-2">
                {cameraSettings.userOptedIn ? <Camera size={16} className="text-emerald-400" /> : <CameraOff size={16} className="text-rose-400" />}
                <span>Camera Focus (On-Device)</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                cameraSettings.userOptedIn ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {cameraSettings.userOptedIn ? 'OPTED IN' : 'DISABLED'}
              </span>
            </div>
            <p className="text-xs font-sans text-zinc-400 leading-relaxed">
              Used strictly for local posture/phone detection during focus sessions. Zero video recording, zero stored frames, zero cloud uploads.
            </p>
          </div>

          <button
            onClick={handleToggleCameraOptIn}
            className={`w-full py-2 rounded-xl font-bold text-xs transition border ${
              cameraSettings.userOptedIn
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {cameraSettings.userOptedIn ? 'Opt-Out & Stop Camera' : 'Opt-In To Camera Focus'}
          </button>
        </div>

        {/* MICROPHONE CONTROL */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 flex items-center gap-2">
                {micEnabled ? <Mic size={16} className="text-emerald-400" /> : <MicOff size={16} className="text-rose-400" />}
                <span>Microphone Voice Input</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                micEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {micEnabled ? 'ACTIVE' : 'MUTED'}
              </span>
            </div>
            <p className="text-xs font-sans text-zinc-400 leading-relaxed">
              Enables local wake-word ("Hey Aether") and real-time voice commands. Audio stream processed in-memory only.
            </p>
          </div>

          <button
            onClick={() => setMicEnabled(!micEnabled)}
            className={`w-full py-2 rounded-xl font-bold text-xs transition border ${
              micEnabled
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {micEnabled ? 'Mute Microphone' : 'Enable Microphone'}
          </button>
        </div>

        {/* DESKTOP AWARENESS CONTROL */}
        <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-200 flex items-center gap-2">
                <Monitor size={16} className={desktopAwarenessEnabled ? 'text-emerald-400' : 'text-zinc-500'} />
                <span>Desktop Window Awareness</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                desktopAwarenessEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {desktopAwarenessEnabled ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs font-sans text-zinc-400 leading-relaxed">
              Reads active window title to categorize focus vs distraction. No screen captures recorded or stored.
            </p>
          </div>

          <button
            onClick={() => setDesktopAwarenessEnabled(!desktopAwarenessEnabled)}
            className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold text-xs transition"
          >
            {desktopAwarenessEnabled ? 'Pause Desktop Awareness' : 'Resume Desktop Awareness'}
          </button>
        </div>
      </div>

      {/* MEMORY GOVERNANCE & WIPE TOOLS */}
      <div className="p-6 rounded-2xl bg-[#121316] border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
              <Brain size={16} className="text-cyan-400" />
              <span>Personal Memory Cortex & Forget Protocols ({memories.length} Memories)</span>
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Review, edit, or purge personal facts and preferences stored in Aether's memory.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setLearningPaused(!learningPaused)}
              className={`px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1.5 ${
                learningPaused ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-zinc-900 text-zinc-300 border-zinc-800'
              }`}
            >
              <PauseCircle size={14} />
              <span>{learningPaused ? 'Learning Paused' : 'Pause Behavioral Learning'}</span>
            </button>

            <button
              onClick={handleResetBehavioralLearning}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Reset Behavioral Models</span>
            </button>
          </div>
        </div>

        {/* FORGET TOPIC FORM */}
        <form onSubmit={handleForgetTopic} className="flex items-center gap-2">
          <input
            type="text"
            value={forgetTopicInput}
            onChange={(e) => setForgetTopicInput(e.target.value)}
            placeholder="Type topic keyword to forget (e.g., 'TypeScript', 'Schedule', 'Git')..."
            className="flex-1 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 font-mono focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold text-xs font-mono transition flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Forget Topic</span>
          </button>
        </form>

        {/* MEMORIES TABLE */}
        <div className="space-y-2 font-mono text-xs pt-2">
          {memories.map((mem) => (
            <div key={mem.id} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-200">{mem.topic}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] uppercase font-bold">
                    {mem.category}
                  </span>
                  <span className="text-zinc-500 text-[10px]">Confidence: {mem.confidence}%</span>
                </div>
                <p className="text-xs font-sans text-zinc-400">{mem.fact}</p>
              </div>

              <button
                onClick={() => handleDeleteMemory(mem.id)}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-400 text-zinc-500 transition border border-zinc-800"
                title="Permanently Delete Memory"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
