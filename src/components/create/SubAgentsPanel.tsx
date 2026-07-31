import React from 'react';
import { 
  Bot, 
  Sparkles, 
  Play, 
  RefreshCw, 
  Compass, 
  Code2, 
  ShieldCheck 
} from 'lucide-react';

type SubAgent = {
  name: string;
  role: string;
  status: 'idle' | 'analyzing' | 'working' | 'completed';
  currentActivity: string;
  progress: number;
};

type SwarmLog = {
  sender: string;
  text: string;
  time: string;
  type: string;
};

type SubAgentsPanelProps = {
  subAgents: SubAgent[];
  isSwarmRunning: boolean;
  swarmObjective: string;
  setSwarmObjective: (v: string) => void;
  agentSwarmLogs: SwarmLog[];
  setAgentSwarmLogs: React.Dispatch<React.SetStateAction<SwarmLog[]>>;
  handleRunAgentSwarm: () => void;
};

export const SubAgentsPanel: React.FC<SubAgentsPanelProps> = ({
  subAgents,
  isSwarmRunning,
  swarmObjective,
  setSwarmObjective,
  agentSwarmLogs,
  setAgentSwarmLogs,
  handleRunAgentSwarm
}) => {

  const getAgentIcon = (name: string) => {
    if (name.includes('Architect')) return <Compass className="text-amber-400" size={16} />;
    if (name.includes('Developer')) return <Code2 className="text-yellow-400" size={16} />;
    return <ShieldCheck className="text-emerald-400" size={16} />;
  };

  const getStatusColor = (status: SubAgent['status']) => {
    switch (status) {
      case 'analyzing': return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
      case 'working': return 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
      case 'completed': return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
      default: return 'text-zinc-500 bg-zinc-950/40 border border-zinc-850';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0c12] blueprint-grid" id="create-agents-panel">
      {/* Workspace Header */}
      <div className="px-4 py-3 bg-[#0d0f18] border-b border-zinc-850 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-amber-400" />
          <span className="text-[11px] font-bold text-zinc-200 tracking-wider uppercase font-sans">AI Agent Workspace</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isSwarmRunning ? 'bg-yellow-400 animate-pulse' : 'bg-zinc-600'}`} />
            Status: {isSwarmRunning ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
        {/* Swarm Command Board */}
        <div className="glass-card border-dashed border-amber-500/20 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20 shrink-0">
              <Sparkles size={16} className={isSwarmRunning ? 'animate-pulse' : ''} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">AI Agent Goals</h4>
              <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                Provide a design or development task below. The coordinate AI agents will analyze requirements, create a structured execution plan, and write code modifications directly to your active sandbox.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <textarea
              value={swarmObjective}
              onChange={(e) => setSwarmObjective(e.target.value)}
              placeholder="e.g., Build a clean analytics dashboard panel with nice styled metric cards and a task progress indicator..."
              rows={2}
              className="w-full bg-[#050608] border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-amber-500/30 leading-relaxed font-sans"
              disabled={isSwarmRunning}
            />

            <button
              onClick={handleRunAgentSwarm}
              disabled={isSwarmRunning}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-mono font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-950/20"
            >
              {isSwarmRunning ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>AI Agents Working...</span>
                </>
              ) : (
                <>
                  <Play size={10} />
                  <span>Run AI Agents</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Agent Squad Grid */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase block tracking-wider">Workspace Project Agents</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {subAgents.map((agent) => (
              <div 
                key={agent.name} 
                className={`p-3 glass-card rounded-xl flex flex-col justify-between space-y-3 transition-all ${
                  agent.status === 'working' || agent.status === 'analyzing'
                    ? 'border-purple-500/20 bg-purple-500/5' 
                    : ''
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      {getAgentIcon(agent.name)}
                      <span className="text-xs font-bold text-zinc-100 font-mono">{agent.name}</span>
                    </div>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-500 leading-normal uppercase">{agent.role}</p>
                </div>

                <div className="space-y-1.5">
                  {/* Progress Line */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-zinc-650">
                      <span>Task Completion</span>
                      <span>{agent.progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden border border-zinc-850/40">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          agent.name.includes('Architect') ? 'bg-amber-400' :
                          agent.name.includes('Developer') ? 'bg-yellow-400' :
                          'bg-emerald-400'
                        }`}
                        style={{ width: `${agent.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-1.5 bg-zinc-950/60 border border-zinc-900 rounded font-mono text-[9px] text-zinc-400 min-h-[30px] flex items-center leading-normal">
                    {agent.currentActivity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Debug Debate Logs */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">Live Agent Feed</span>
            <button
              onClick={() => setAgentSwarmLogs([])}
              className="text-[9px] font-mono text-zinc-600 hover:text-zinc-400 cursor-pointer"
            >
              Clear Log
            </button>
          </div>

          <div className="glass-card border-dashed border-amber-500/10 rounded-xl h-64 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
              {agentSwarmLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 italic text-[11px] font-mono">
                  Log is currently idle. Assign a goal and run the agents to begin.
                </div>
              ) : (
                agentSwarmLogs.map((log, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border leading-relaxed font-sans ${
                      log.sender === 'System Arch' ? 'bg-zinc-950/40 border-zinc-900 text-zinc-400 font-mono text-[10px]' :
                      log.sender === 'Lead Architect' ? 'bg-amber-950/10 border-amber-900/10 text-amber-100' :
                      log.sender === 'Developer Agent' ? 'bg-yellow-950/10 border-yellow-900/10 text-yellow-100' :
                      'bg-emerald-950/10 border-emerald-900/10 text-emerald-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5 font-mono text-[9px] font-bold">
                      <span className={
                        log.sender === 'System Arch' ? 'text-zinc-500' :
                        log.sender === 'Lead Architect' ? 'text-amber-400' :
                        log.sender === 'Developer Agent' ? 'text-yellow-400' :
                        'text-emerald-400'
                      }>
                        {log.sender === 'System Arch' ? '⚙️ ' :
                         log.sender === 'Lead Architect' ? '📐 ' :
                         log.sender === 'Developer Agent' ? '💻 ' : '🔍 '}
                        {log.sender.toUpperCase()}
                      </span>
                      <span className="text-zinc-650 font-normal">{log.time}</span>
                    </div>
                    <p className="text-[11px] whitespace-pre-wrap text-zinc-300 font-sans font-medium">{log.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
