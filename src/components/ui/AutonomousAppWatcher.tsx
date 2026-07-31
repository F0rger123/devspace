import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Monitor, 
  ShieldCheck, 
  AlertTriangle, 
  MousePointer, 
  Zap, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  BrainCircuit, 
  Power, 
  Terminal, 
  Code, 
  Globe, 
  Cpu, 
  Lock, 
  Play, 
  Pause, 
  Activity,
  Sparkles,
  Bot,
  ListChecks,
  History
} from 'lucide-react';
import { useData } from '../../context/DataProvider';

export interface AppProcess {
  id: string;
  name: string;
  icon: 'terminal' | 'code' | 'browser' | 'claude' | 'other';
  status: 'active' | 'waiting_permission' | 'idle';
  cpu: string;
  memory: string;
  pid: number;
  lastEvent?: string;
}

export interface PermissionPrompt {
  id: string;
  appId: string;
  appName: string;
  title: string;
  details: string;
  riskLevel: 'safe' | 'medium' | 'high';
  timestamp: number;
}

export interface AetherMemoryRule {
  id: string;
  rule: string;
  targetApp: string;
  action: 'allow' | 'deny' | 'ask';
  category: string;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  appName: string;
  promptTitle: string;
  actionTaken: 'ALLOW' | 'DENY' | 'MANUAL';
  reason: string;
}

export function AutonomousAppWatcher() {
  const { showToast, addNote } = useData();

  const [isOpenPermissions, setIsOpenPermissions] = useState(() => {
    return localStorage.getItem('devspace_open_permissions') === 'true';
  });
  const [isEmergencyStopped, setIsEmergencyStopped] = useState(false);
  const [autoApproveClaude, setAutoApproveClaude] = useState(true);

  // Default running applications on user's computer
  const [processes, setProcesses] = useState<AppProcess[]>([
    { id: 'claude-cli', name: 'Claude Code CLI / Desktop', icon: 'claude', status: 'active', cpu: '2.4%', memory: '240 MB', pid: 48102, lastEvent: 'Prompting for bash permission' },
    { id: 'vscode-dev', name: 'VS Code (DevSpace Workspace)', icon: 'code', status: 'active', cpu: '1.1%', memory: '680 MB', pid: 39120, lastEvent: 'Watching file system changes' },
    { id: 'iterm2', name: 'Terminal / iTerm2', icon: 'terminal', status: 'idle', cpu: '0.2%', memory: '95 MB', pid: 18230, lastEvent: 'Waiting for command input' },
    { id: 'chrome-browser', name: 'Google Chrome (DevSpace Preview)', icon: 'browser', status: 'active', cpu: '3.8%', memory: '1.2 GB', pid: 82194, lastEvent: 'Connected to localhost:3000' }
  ]);

  // Active permission prompts waiting for answer
  const [activePrompts, setActivePrompts] = useState<PermissionPrompt[]>([
    {
      id: 'prompt-101',
      appId: 'claude-cli',
      appName: 'Claude Code CLI',
      title: 'Allow command execution: "npm run build && npm run test"?',
      details: 'Claude requested permission to execute terminal commands in /workspace.',
      riskLevel: 'safe',
      timestamp: Date.now()
    }
  ]);

  // Taught Aether Memories / Rules
  const [memoryRules, setMemoryRules] = useState<AetherMemoryRule[]>(() => {
    const raw = localStorage.getItem('devspace_aether_rules') || localStorage.getItem('devspace_ether_rules');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return [
      { id: 'rule-1', rule: 'Auto-click "Allow" when Claude requests permission for git, npm, or build commands', targetApp: 'Claude Code CLI', action: 'allow', category: 'Dev Automation', createdAt: Date.now() - 3600000 },
      { id: 'rule-2', rule: 'Auto-approve file read operations across workspace', targetApp: 'VS Code', action: 'allow', category: 'Security', createdAt: Date.now() - 7200000 },
      { id: 'rule-3', rule: 'Deny any destructive "rm -rf" or dangerous system cleanup commands', targetApp: 'All Apps', action: 'deny', category: 'Safety Guard', createdAt: Date.now() - 86400000 }
    ];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'log-1', timestamp: Date.now() - 120000, appName: 'Claude Code CLI', promptTitle: 'Read /src/context/DataProvider.tsx', actionTaken: 'ALLOW', reason: 'Matched Rule #2: Read permissions pre-approved' }
  ]);

  const [newRuleText, setNewRuleText] = useState('');
  const [cursorAnimating, setCursorAnimating] = useState(false);

  // Save rules to localStorage
  useEffect(() => {
    localStorage.setItem('devspace_aether_rules', JSON.stringify(memoryRules));
  }, [memoryRules]);

  // Listen for emergency stop key or event
  useEffect(() => {
    const handleStop = () => {
      setIsEmergencyStopped(true);
      showToast("🛑 EMERGENCY STOP: All Aether autonomous mouse actions halted!", "error", 5000);
    };
    window.addEventListener('devspace-emergency-stop', handleStop);
    return () => window.removeEventListener('devspace-emergency-stop', handleStop);
  }, [showToast]);

  // Toggle open permissions
  const handleTogglePermissions = () => {
    const nextVal = !isOpenPermissions;
    setIsOpenPermissions(nextVal);
    localStorage.setItem('devspace_open_permissions', String(nextVal));
    showToast(nextVal ? "🔓 Open Autonomous OS Permissions Granted!" : "🔒 Autonomous OS Permissions Restricted to Sandbox", nextVal ? "success" : "info");
  };

  // Add new rule / memory to Aether
  const handleAddMemoryRule = () => {
    if (!newRuleText.trim()) return;
    const newRule: AetherMemoryRule = {
      id: `rule-${Date.now()}`,
      rule: newRuleText.trim(),
      targetApp: 'Claude Code CLI',
      action: 'allow',
      category: 'Taught Memory',
      createdAt: Date.now()
    };
    setMemoryRules(prev => [newRule, ...prev]);
    setNewRuleText('');
    showToast("🧠 Taught new rule memory to Aether AI Assistant!", "success");
  };

  const handleDeleteRule = (id: string) => {
    setMemoryRules(prev => prev.filter(r => r.id !== id));
    showToast("Rule removed from Aether's memory.", "info");
  };

  // Auto-process permission prompt with Aether mouse click
  const handleProcessPrompt = (prompt: PermissionPrompt, decision: 'ALLOW' | 'DENY') => {
    if (isEmergencyStopped) {
      showToast("Cannot execute click: Emergency Stop is ACTIVE!", "error");
      return;
    }

    setCursorAnimating(true);

    setTimeout(() => {
      setCursorAnimating(false);
      // Remove prompt
      setActivePrompts(prev => prev.filter(p => p.id !== prompt.id));

      // Add to audit log
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        appName: prompt.appName,
        promptTitle: prompt.title,
        actionTaken: decision,
        reason: decision === 'ALLOW' 
          ? 'Auto-approved by Aether Memory Rules & Open Permissions Policy'
          : 'Denied by user or safety rule override'
      };
      setAuditLogs(prev => [newLog, ...prev]);

      showToast(
        decision === 'ALLOW' 
          ? `⚡ Aether clicked "ALLOW" on ${prompt.appName} permission prompt!`
          : `🛑 Aether clicked "DENY" on ${prompt.appName} permission prompt!`,
        decision === 'ALLOW' ? "success" : "info",
        3500
      );
    }, 600);
  };

  // Generate simulated Claude request for demonstration / testing
  const handleSimulateClaudeRequest = () => {
    const commands = [
      'Allow command execution: "git push origin main"?',
      'Claude requests permission to create file /src/components/NewFeature.tsx?',
      'Allow running local test suite: "npm test"?',
      'Claude requests read access to ~/.env local configuration file?'
    ];
    const chosen = commands[Math.floor(Math.random() * commands.length)];
    const newPrompt: PermissionPrompt = {
      id: `prompt-${Date.now()}`,
      appId: 'claude-cli',
      appName: 'Claude Code CLI',
      title: chosen,
      details: 'Detected active prompt window overlay on your computer screen.',
      riskLevel: chosen.includes('.env') ? 'medium' : 'safe',
      timestamp: Date.now()
    };
    setActivePrompts(prev => [newPrompt, ...prev]);

    // If auto approve enabled, automatically trigger Aether
    if (autoApproveClaude && !isEmergencyStopped) {
      setTimeout(() => {
        handleProcessPrompt(newPrompt, 'ALLOW');
      }, 1200);
    }
  };

  return (
    <div className="space-y-5 text-zinc-200 font-sans">
      {/* Top Banner: Controlled Environment & Emergency Stop */}
      <div className="p-4 bg-gradient-to-r from-zinc-950 via-[#0e0e14] to-zinc-950 border border-yellow-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isOpenPermissions ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'}`}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Controlled OS Execution Environment
              </h4>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                isOpenPermissions 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              }`}>
                {isOpenPermissions ? 'OPEN PERMISSIONS' : 'SANDBOX RESTRICTED'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Aether monitors desktop applications (Claude, VS Code, Terminal) and handles permissions automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Permissions Toggle */}
          <button
            onClick={handleTogglePermissions}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              isOpenPermissions
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850'
            }`}
          >
            {isOpenPermissions ? <Lock size={13} /> : <Lock size={13} className="text-yellow-400" />}
            <span>{isOpenPermissions ? 'Disable Open Access' : 'Enable Open Access'}</span>
          </button>

          {/* Emergency Stop Switch */}
          <button
            onClick={() => {
              setIsEmergencyStopped(!isEmergencyStopped);
              if (!isEmergencyStopped) showToast("🛑 HALT ACTIVE: All Aether autonomous clicks frozen!", "error");
              else showToast("Aether autonomous execution resumed.", "success");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
              isEmergencyStopped
                ? 'bg-red-600 border-red-500 text-white animate-bounce shadow-red-500/50'
                : 'bg-red-950/60 hover:bg-red-900/80 border-red-500/40 text-red-300'
            }`}
          >
            <Power size={14} />
            <span>{isEmergencyStopped ? 'RESUME AETHER' : 'STOP AETHER'}</span>
          </button>
        </div>
      </div>

      {/* Active Permission Prompts from Claude / OS */}
      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-yellow-400 animate-pulse" />
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Claude & Computer Permission Prompts ({activePrompts.length})
            </h4>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[10.5px] font-mono text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoApproveClaude}
                onChange={(e) => setAutoApproveClaude(e.target.checked)}
                className="accent-yellow-500 rounded"
              />
              <span>Auto-Click Allow on Safe Prompts</span>
            </label>

            <button
              onClick={handleSimulateClaudeRequest}
              className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
            >
              + Simulate Claude Prompt
            </button>
          </div>
        </div>

        {activePrompts.length === 0 ? (
          <div className="p-4 bg-[#0d0d12] border border-zinc-900 rounded-xl text-center text-xs font-mono text-zinc-500">
            No active permission prompts waiting. Aether is watching background processes...
          </div>
        ) : (
          <div className="space-y-2">
            {activePrompts.map((prompt) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-gradient-to-r from-yellow-950/20 via-[#0f0f16] to-zinc-950 border border-yellow-500/40 rounded-xl flex items-center justify-between gap-4 relative overflow-hidden"
              >
                {/* Visual cursor click simulation overlay */}
                {cursorAnimating && (
                  <motion.div 
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute inset-0 bg-yellow-500/10 pointer-events-none flex items-center justify-center gap-2 font-mono text-xs text-yellow-300 font-bold"
                  >
                    <MousePointer size={16} className="animate-bounce text-yellow-400" />
                    <span>Aether is auto-clicking ALLOW...</span>
                  </motion.div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-[9px] font-mono font-bold">
                      {prompt.appName}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">{prompt.title}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans">{prompt.details}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleProcessPrompt(prompt, 'DENY')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => handleProcessPrompt(prompt, 'ALLOW')}
                    className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(234,179,8,0.25)] flex items-center gap-1.5 cursor-pointer"
                  >
                    <MousePointer size={12} />
                    <span>Allow</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Teach Aether Memories & Rules Panel */}
      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <BrainCircuit size={16} className="text-yellow-400" />
          <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
            Teach Aether Memories & Computer Rules ({memoryRules.length})
          </h4>
        </div>

        {/* Add Memory Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            placeholder="e.g. Always click Yes when Claude asks for bash command execution..."
            className="flex-1 bg-[#0d0d12] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-sans text-zinc-200 focus:outline-none focus:border-yellow-500/50"
            onKeyDown={(e) => e.key === 'Enter' && handleAddMemoryRule()}
          />
          <button
            onClick={handleAddMemoryRule}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Teach Memory</span>
          </button>
        </div>

        {/* Existing Taught Rules */}
        <div className="space-y-2 pt-1">
          {memoryRules.map((r) => (
            <div key={r.id} className="p-3 bg-[#0d0d12] border border-zinc-900 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-2 h-2 rounded-full ${r.action === 'allow' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block font-sans">{r.rule}</span>
                  <span className="text-[9.5px] font-mono text-zinc-500">App: {r.targetApp} • {r.category}</span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteRule(r.id)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Running Applications & Audit Trail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monitored Computer Processes */}
        <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={15} className="text-emerald-400" />
              Monitored Applications
            </span>
            <span className="text-[10px] font-mono text-zinc-500">4 Apps Tracked</span>
          </div>

          <div className="space-y-2">
            {processes.map((proc) => (
              <div key={proc.id} className="p-2.5 bg-[#0d0d12] border border-zinc-900 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-zinc-900 rounded-lg text-yellow-400 border border-zinc-800">
                    {proc.icon === 'terminal' && <Terminal size={14} />}
                    {proc.icon === 'code' && <Code size={14} />}
                    {proc.icon === 'browser' && <Globe size={14} />}
                    {proc.icon === 'claude' && <Bot size={14} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold font-mono text-white block">{proc.name}</span>
                    <span className="text-[9.5px] text-zinc-500 font-mono block">{proc.lastEvent}</span>
                  </div>
                </div>

                <div className="text-right font-mono text-[9.5px] text-zinc-400">
                  <span className="block text-emerald-400 font-bold">{proc.cpu} CPU</span>
                  <span>{proc.memory}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Trail */}
        <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <History size={15} className="text-yellow-400" />
              Aether Decision Audit Log
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{auditLogs.length} Events</span>
          </div>

          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-[#0d0d12] border border-zinc-900 rounded-xl space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-zinc-300">{log.appName}</span>
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[8.5px] font-mono font-bold">
                    {log.actionTaken}
                  </span>
                </div>
                <p className="text-[10.5px] text-zinc-400 font-mono truncate">{log.promptTitle}</p>
                <span className="text-[9px] text-zinc-500 font-mono block">{log.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
