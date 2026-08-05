import React, { useState, useEffect } from 'react';
import { Compass, FileCode, GitBranch, Zap, AlertTriangle, Sparkles, Check, Send, Cpu, BrainCircuit, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aetherIntelligence, IntelligenceSummary, PersonalMemory } from '../../../lib/aetherIntelligenceService';

interface ContextPanelProps {
  projectName: string;
  activePath: string;
  activeDreamCount: number;
  activeWorkCount: number;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  projectName,
  activePath,
  activeDreamCount,
  activeWorkCount,
}) => {
  const navigate = useNavigate();
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [nlInput, setNlInput] = useState('');
  const [summary, setSummary] = useState<IntelligenceSummary | null>(null);
  const [personalMemory, setPersonalMemory] = useState<PersonalMemory>(aetherIntelligence.getPersonalMemory());
  const [timeline, setTimeline] = useState(aetherIntelligence.getTimeline());

  useEffect(() => {
    let mounted = true;
    aetherIntelligence.analyzeContext(projectName, activePath).then((res) => {
      if (mounted) setSummary(res);
    });
    return () => {
      mounted = false;
    };
  }, [projectName, activePath, activeDreamCount, activeWorkCount]);

  const handleExecuteNLCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nlInput.trim()) return;

    const commandText = nlInput.trim();
    setNlInput('');
    setLastActionStatus(`Aether reasoning on: "${commandText}"...`);

    const res = await aetherIntelligence.parseNaturalLanguageAction(commandText, projectName);
    setLastActionStatus(res.result);
    setTimeline(aetherIntelligence.getTimeline());
    setTimeout(() => setLastActionStatus(null), 4000);
  };

  const handleExecuteAction = async (actionName: string) => {
    setLastActionStatus(`Executing Aether Action: ${actionName}`);
    const res = await aetherIntelligence.parseNaturalLanguageAction(actionName, projectName);
    setLastActionStatus(res.result);
    setTimeout(() => setLastActionStatus(null), 3000);

    switch (actionName) {
      case 'Create Dream':
        navigate('/dreams');
        break;
      case 'Summarize':
        navigate('/chat');
        break;
      case 'Review code':
        navigate('/code-review');
        break;
      case 'Turn into tasks':
        navigate('/tasks');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Aether Intelligence Primary Header */}
      <div className="p-3.5 bg-gradient-to-r from-purple-950/40 via-[#0b0a16] to-amber-950/30 border border-purple-500/40 rounded-2xl space-y-1.5 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-purple-200 flex items-center gap-1.5">
            <BrainCircuit size={15} className="text-purple-400 animate-pulse" /> Aether Intelligence Engine
          </span>
          <span className="text-[9px] text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 font-bold">
            Personal & Workspace Deep Reasoning
          </span>
        </div>
        <p className="text-[10.5px] text-zinc-300 leading-snug">
          Central intelligence layer unifying workspace graph, desktop awareness, personal workflow memory, and multi-agent reasoning.
        </p>
      </div>

      {/* Action Notification Toast */}
      {lastActionStatus && (
        <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
          <Check size={12} /> {lastActionStatus}
        </div>
      )}

      {/* Natural Language Command Bar */}
      <form onSubmit={handleExecuteNLCommand} className="flex items-center gap-2">
        <input
          type="text"
          value={nlInput}
          onChange={(e) => setNlInput(e.target.value)}
          placeholder='Ask Aether: "Circle this", "Turn into Dream", "Summarize progress"...'
          className="flex-1 bg-black/50 border border-white/12 hover:border-yellow-500/40 focus:border-yellow-500 text-xs text-zinc-100 placeholder-zinc-500 px-3 py-2 rounded-xl focus:outline-none transition-colors"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Send size={11} /> Ask
        </button>
      </form>

      {/* 4 Core Intelligence Synthesized Answers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-yellow-400 uppercase flex items-center gap-1">
            <FileCode size={11} /> 1. What am I doing?
          </span>
          <p className="text-[11px] text-zinc-200 font-semibold">{summary?.whatAmIDoing || `${projectName} at ${activePath}`}</p>
          <p className="text-[9.5px] text-zinc-400">{summary?.whyAmIDoingIt || 'Developing Aether Intelligence architecture'}</p>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
            <GitBranch size={11} /> 2. What changed?
          </span>
          <p className="text-[11px] text-zinc-200 font-semibold">{summary?.whatChanged || 'Renamed Context Mode to Aether Intelligence'}</p>
          <p className="text-[9.5px] text-zinc-400">Desktop awareness & multi-agent pipeline linked</p>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
            <Zap size={11} /> 3. What to work on next?
          </span>
          <p className="text-[11px] text-zinc-200 font-semibold">{summary?.whatToWorkOnNext || 'Review pending Dreams and tasks'}</p>
          <p className="text-[9.5px] text-zinc-400">Suggested: {summary?.nextSuggestedDream || 'Run performance optimization'}</p>
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <span className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
            <Cpu size={11} /> 4. Personal Memory & Style
          </span>
          <p className="text-[11px] text-zinc-200 font-semibold">{personalMemory.favoriteAIProvider}</p>
          <p className="text-[9.5px] text-zinc-400">Workflow: {personalMemory.preferredWorkflow}</p>
        </div>
      </div>

      {/* Workspace Timeline Preview */}
      <div className="p-3 bg-black/30 border border-white/10 rounded-2xl space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <History size={11} className="text-yellow-400" /> Aether Workspace Timeline
          </span>
          <span className="text-[9px] text-zinc-500">3 Recent Events</span>
        </span>

        <div className="space-y-1.5 text-[10.5px]">
          {timeline.slice(0, 3).map((item) => (
            <div key={item.id} className="p-2 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-200 block">{item.title}</span>
                <span className="text-[9.5px] text-zinc-400">{item.description}</span>
              </div>
              <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-bold uppercase">
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Aether Natural Language Actions */}
      <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1">
          <Sparkles size={11} className="text-yellow-400" /> Natural Language Actions
        </span>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {[
            { label: 'Create Dream', action: 'Create Dream' },
            { label: 'Summarize', action: 'Summarize' },
            { label: 'Review code', action: 'Review code' },
            { label: 'Turn into tasks', action: 'Turn into tasks' },
            { label: 'Paste here', action: 'Paste here' },
            { label: 'Circle this', action: 'Circle this' },
            { label: 'What changed?', action: 'What changed?' },
            { label: 'What next?', action: 'What next?' },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={() => handleExecuteAction(action)}
              className="px-2.5 py-1 bg-white/5 hover:bg-yellow-500/20 hover:text-yellow-300 text-zinc-300 rounded-lg border border-white/10 transition-all cursor-pointer font-bold"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
