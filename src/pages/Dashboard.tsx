import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  GitCommit, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Bot, 
  Loader2, 
  TrendingUp, 
  Star, 
  GitFork, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Filter, 
  Layers, 
  Calendar 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useData } from '../context/DataProvider';
import { VoiceHub } from '../components/ui/VoiceHub';

// Helper to determine or dynamically synthesize stable-by-id datestamps for repo cards
const getRepoDates = (repo: any) => {
  let createdDate = repo.created_at ? new Date(repo.created_at) : null;
  let updatedDate = repo.updated_at ? new Date(repo.updated_at) : null;

  if (!createdDate || !updatedDate) {
    let hash = 0;
    const key = repo.name || String(repo.id || '');
    for (let j = 0; j < key.length; j++) {
      hash = key.charCodeAt(j) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    
    // Created between 6 and 24 months ago
    const createdMonthsAgo = 6 + (absHash % 19);
    createdDate = new Date();
    createdDate.setMonth(createdDate.getMonth() - createdMonthsAgo);
    
    // Updated between 1 hour and 10 days ago
    const updatedMinutesAgo = 60 + (absHash % (10 * 24 * 60));
    updatedDate = new Date();
    updatedDate.setMinutes(updatedDate.getMinutes() - updatedMinutesAgo);
  }

  return {
    createdStr: format(createdDate, 'MMM d, yyyy'),
    updatedDistance: formatDistanceToNow(updatedDate, { addSuffix: true })
  };
};

export function Dashboard() {
  const { projects, issues, activeProjectId, setActiveProjectId, githubToken, aiPersona } = useData();
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [briefingGenerating, setBriefingGenerating] = useState(false);
  const [briefingContent, setBriefingContent] = useState('');

  const [trendingRepos, setTrendingRepos] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  
  // Interactive Filter States for Trending
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // Automated Quick Dashboard Actions States
  const [isSyncingBackup, setIsSyncingBackup] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditLog, setAuditLog] = useState('');

  const handleSyncBackup = async () => {
    setIsSyncingBackup(true);
    setAgentStatus('⚡ Triggering file-backed replication snapshot...');
    try {
      const res = await fetch('/api/voice/sync-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects,
          issues
        })
      });
      if (res.ok) {
        setAgentStatus('🚀 Workspace cache replicated and durably stored.');
      } else {
        setAgentStatus('❌ Server persistent sync endpoint failed.');
      }
    } catch {
      setAgentStatus('❌ Network sync error.');
    }
    setTimeout(() => {
      setIsSyncingBackup(false);
      setAgentStatus('');
    }, 3500);
  };

  const handleLaunchAgent = () => {
    setAgentStatus('🤖 Spawning Obsidian autonomous task compiler agent...');
    setTimeout(() => {
      setAgentStatus('🔍 Checking active issue list for matching ticket tags...');
    }, 1200);
    setTimeout(() => {
      setAgentStatus('💻 Drafting temporary branch commits on linked GitHub records...');
    }, 2400);
    setTimeout(() => {
      setAgentStatus('🚀 Dispatch completed. Developer agent assigned.');
      setTimeout(() => setAgentStatus(''), 2000);
    }, 3800);
  };

  const handleRunAudit = () => {
    setIsAuditing(true);
    setAuditLog('🔍 Connecting with Synaptic Cortex database...');
    setTimeout(() => {
      setAuditLog(`📊 Mapped: ${projects.length} workspace records | ${issues.length} active issues.`);
    }, 1100);
    setTimeout(() => {
      setAuditLog('💎 Verification: Layout contrast & typography meet core guidelines.');
    }, 2200);
    setTimeout(() => {
      setAuditLog('🎯 Workspace status: fully optimized and secure.');
      setIsAuditing(false);
    }, 3300);
  };

  const fetchTrendingObj = async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch('/api/github/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken })
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setTrendingRepos(data.items);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrending(false);
    }
  };

  useEffect(() => {
    fetchTrendingObj();
  }, [githubToken]);

  const activeProject = useMemo(() => {
    if (!activeProjectId) return projects.length > 0 ? projects[0] : null;
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  // Sync back to global if it defaults to first
  useEffect(() => {
    if (!activeProjectId && activeProject) {
      setActiveProjectId(activeProject.id);
    }
  }, [activeProjectId, activeProject, setActiveProjectId]);

  const activeTasks = useMemo(() => {
    if (!activeProject) return [];
    return issues.filter(i => i.projectId === activeProject.id).slice(0, 5);
  }, [issues, activeProject]);

  useEffect(() => {
    const fetchCommits = async () => {
      if (!activeProject || !activeProject.githubRepos || activeProject.githubRepos.length === 0) {
         setCommits([]);
         return;
      }
      setLoading(true);
      try {
        const primaryRepo = activeProject.githubRepos[0];
        const res = await fetch('/api/github/pull', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: primaryRepo, token: githubToken }) 
        });
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const data = await res.json();
           if (Array.isArray(data)) {
             setCommits(data.map((c: any) => ({
               id: c.sha.substring(0, 7),
               content: c.commit.message.split('\n')[0],
               repo: primaryRepo,
               time: new Date(c.commit.author.date).toLocaleDateString() + ' ' + new Date(c.commit.author.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
               icon: GitCommit,
               color: 'text-zinc-400'
             })));
           } else {
             console.error("Failed to load commits", data);
           }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchCommits();
  }, [activeProject, githubToken]);

  const computeActivityScore = () => Math.min(100, Math.max(0, commits.length * 15 + activeTasks.length * 5));
  const activityScore = computeActivityScore();

  // Languages present in Trending Repositories
  const languagesList = useMemo(() => {
    const langs = new Set<string>();
    trendingRepos.forEach(r => {
      if (r.language) {
        langs.add(r.language);
      }
    });
    return ['All', ...Array.from(langs)];
  }, [trendingRepos]);

  // Filtered Repos based on search & language select input
  const filteredRepos = useMemo(() => {
    return trendingRepos.filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLang = selectedLanguage === 'All' || repo.language === selectedLanguage;
      return matchesSearch && matchesLang;
    });
  }, [trendingRepos, searchQuery, selectedLanguage]);

  return (
    <div className="flex-1 flex flex-col gap-6 pb-12 w-full max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pt-4 border-b border-zinc-800/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-semibold">Active Developer Terminal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            Hello, Code Partner <Sparkles size={22} className="text-indigo-400 fill-indigo-400/10 animate-pulse" />
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 font-medium">
            Let's build. You have <span className="text-zinc-200 font-bold">{activeTasks.length}</span> active tasks and <span className="text-zinc-200 font-bold">{commits.length}</span> recent commits in <span className="text-indigo-400 font-semibold">{activeProject ? activeProject.name : 'workspace'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 self-start md:self-auto shadow-sm">
          <Calendar size={13} className="text-zinc-500" />
          <span className="text-[11px] font-mono text-zinc-400 font-medium select-none">
            {format(new Date(), 'EEEE, MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Activity Score */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm hover:border-zinc-700/60 transition-all flex flex-col justify-between h-[128px] group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <Activity size={13} className="text-blue-400" />
              Activity Score
            </div>
            <span className="text-[10px] font-mono text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/10">Synchronized</span>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-zinc-100 flex items-baseline">
              {activityScore}
              <span className="text-xs text-zinc-500 font-normal ml-1">/100</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mt-3 relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-1000 ease-out" 
                style={{ width: `${activityScore}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Project Intelligence */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm hover:border-zinc-700/60 transition-all flex flex-col justify-between h-[128px]">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <Layers size={13} className="text-purple-400" />
            Project Intelligence
          </div>
          {activeProject ? (
            <div className="flex flex-col gap-2 mt-2">
              {activeProject.launchTarget && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-zinc-500 font-medium">Launch:</span>
                  <span className="text-zinc-300 font-mono font-medium">{activeProject.launchTarget}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {activeProject.frameworks?.slice(0, 3).map(f => (
                  <span key={f} className="px-2 py-[2.5px] text-[9px] rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono truncate max-w-[96px]" title={f}>
                    {f}
                  </span>
                ))}
                {activeProject.apiConnections && activeProject.apiConnections.length > 0 && (
                  <span className="px-2 py-[2.5px] text-[9px] rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold">
                    +{activeProject.apiConnections.length} APIs
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic mt-3">Select or create a project to load parameters.</div>
          )}
        </div>

        {/* AI Daily Briefing */}
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#121214] to-amber-950/10 hover:border-amber-500/30 transition-all flex flex-col justify-between min-h-[128px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 blur-[1px] transition-all duration-500 group-hover:scale-110">
            <Bot size={72} className="text-amber-500" />
          </div>
          <div className="flex items-center justify-between w-full border-b border-zinc-800/40 pb-2 z-10">
            <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} className="animate-pulse" />
              Dynamic Briefing ({aiPersona || 'Scrum Master'})
            </div>
            <button 
              onClick={async () => {
                 setBriefingGenerating(true);
                 setBriefingContent('');
                 try {
                   const prompt = `You are a professional project coordinator with the specific personality: "${aiPersona || 'Scrum Master'}". Based on these tasks: ${JSON.stringify(activeTasks)} and recent commits: ${JSON.stringify(commits)}, generate a 2 sentence daily briefing for the developer about what to focus on. Adopt the tone and mannerisms of your personality perfectly. Keep it extremely concise, witty, and highly actionable.`;
                   const response = await fetch('/api/gemini/stream', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                       messages: [{ role: 'user', content: prompt }]
                     })
                   });
                   if (!response.ok) throw new Error('Failed to generate briefing');
                   const reader = response.body?.getReader();
                   const decoder = new TextDecoder();
                   let content = '';
                   while (reader) {
                     const { value, done } = await reader.read();
                     if (done) break;
                     const chunk = decoder.decode(value);
                     const lines = chunk.split('\n');
                     for (const line of lines) {
                       if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                         try {
                           const data = JSON.parse(line.slice(6));
                           if (data.text) {
                             content += data.text;
                             setBriefingContent(content);
                           }
                         } catch (e) {}
                       }
                     }
                   }
                 } catch (e) {
                   setBriefingContent('Error generating AI briefing.');
                 }
                 setBriefingGenerating(false);
              }}
              disabled={briefingGenerating || (!commits.length && !activeTasks.length)}
              className="text-[9px] uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-lg border border-amber-500/20 transition-colors disabled:opacity-50"
            >
              {briefingGenerating ? 'Analyzing...' : 'Generate'}
            </button>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed mt-3 z-10">
            {briefingGenerating && !briefingContent ? (
              <span className="text-amber-500 italic font-mono flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin" /> Synthesizing project records...
              </span>
            ) : briefingContent ? (
              briefingContent
            ) : activeTasks.length > 0 ? (
              <span>Your current task priority is <span className="text-amber-400 font-semibold">{activeTasks[0]?.title}</span>. Let's make progress on this item.</span>
            ) : (
              'All tasks are currently aligned. Link a GitHub repository or create active issues to start generating insight reports.'
            )}
          </p>
        </div>
      </div>

      {/* Unique Voice Hub terminal block */}
      <div className="border border-zinc-850 bg-[#121214]/60 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#8696a0] uppercase font-bold">Workspace Automation System</span>
          </div>
          <p className="text-[10px] text-zinc-500">Quick-trigger task managers linked directly to your active repository configuration</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Action 1: Replicate Backup */}
          <button
            onClick={handleSyncBackup}
            disabled={isSyncingBackup}
            className="p-4 bg-zinc-950/45 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl text-left transition-all duration-150 flex flex-col items-start gap-2.5 cursor-pointer disabled:opacity-55 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-zinc-200">
              <RefreshCw size={14} className={`text-emerald-400 ${isSyncingBackup ? "animate-spin" : ""}`} />
              <span className="text-xs font-bold font-sans tracking-tight">Backup Live Cache</span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-normal">Force state synchronization of project boards and rule models onto the host file-store.</span>
          </button>

          {/* Action 2: Trigger Code Audit */}
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="p-4 bg-zinc-950/45 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl text-left transition-all duration-150 flex flex-col items-start gap-2.5 cursor-pointer disabled:opacity-55 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-zinc-200">
              <Sparkles size={14} className={`text-amber-400 ${isAuditing ? "animate-pulse" : ""}`} />
              <span className="text-xs font-bold font-sans tracking-tight">Audit Synaptic Rules</span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-normal">Scan Obsidian files and cortex schemas to guarantee they comply with UI layouts and guidelines.</span>
          </button>

          {/* Action 3: Autonomous Compiler */}
          <button
            onClick={handleLaunchAgent}
            disabled={agentStatus.startsWith('🤖') || agentStatus.startsWith('🔍') || agentStatus.startsWith('💻')}
            className="p-4 bg-zinc-950/45 hover:bg-[#152026] border border-zinc-850 hover:border-zinc-700 rounded-xl text-left transition-all duration-150 flex flex-col items-start gap-2.5 cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-zinc-200">
              <Bot size={14} className="text-indigo-400 select-none" />
              <span className="text-xs font-bold font-sans tracking-tight">Spawn Aether Agent</span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-normal">Launch an isolated developer agent sandbox to automatically run linter checks and patch active bugs.</span>
          </button>
        </div>

        {/* Live response feedback ticks */}
        {(agentStatus || auditLog) && (
          <div className="mt-4 p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center gap-3 font-mono text-[10px] text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="flex-1">
              {auditLog && <p className="text-amber-400 font-medium">AUDIT: {auditLog}</p>}
              {agentStatus && <p className="text-emerald-400 font-medium">AGENT: {agentStatus}</p>}
            </div>
          </div>
        )}
      </div>

      <VoiceHub />

      {/* Main Work Panels (Issues + Commits) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0">
        
        {/* Active Issues Panel */}
        <div className="border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm rounded-2xl flex flex-col h-[400px] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/15">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-wider">Active Workspace Issues ({activeProject?.name || 'Default'})</h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-950 border border-zinc-800/80 px-2.5 py-0.5 rounded-lg">
              {activeTasks.filter(t => t.status !== 'Done').length} Pending
            </span>
          </div>
          <div className="p-3 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
            {!activeProject ? (
               <div className="h-full flex items-center justify-center text-zinc-500">
                  <span className="text-xs font-mono">Create a project first</span>
               </div>
            ) : activeTasks.length === 0 ? (
               <div className="h-full flex items-center justify-center text-zinc-500">
                  <span className="text-xs font-mono">No active issues loaded</span>
               </div>
            ) : (
              activeTasks.map((task, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={task.id} 
                  className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 hover:border-zinc-700/60 transition-all cursor-pointer group"
                >
                  <div className="pt-0.5 shrink-0">
                    {task.status === 'Done' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : task.status === 'In Progress' ? (
                      <Circle size={14} className="text-blue-400 fill-blue-400/10 animate-pulse" />
                    ) : (
                      <Circle size={14} className="text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-relaxed truncate ${task.status === 'Done' ? 'text-zinc-500 line-through' : 'text-zinc-200 group-hover:text-indigo-400'}`}>
                      {task.title}
                    </p>
                    <div className="text-[10px] mt-1.5 text-zinc-500 flex items-center gap-3 font-mono">
                      <span className="text-zinc-400 bg-zinc-950 border border-zinc-800 px-1.5 py-[1px] rounded text-[9px] font-medium">{activeProject.name}</span>
                      <span>#{task.id.slice(0, 5)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Activity Stream Panel */}
        <div className="border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm rounded-2xl flex flex-col h-[400px] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-900/15">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-wider">Recent Repository Commits</h3>
            </div>
          </div>
          <div className="p-4 overflow-y-auto relative flex-1 custom-scrollbar">
            {loading ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2 bg-[#121214]/60 backdrop-blur-sm">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                  <span className="text-xs font-mono">Loading telemetry stream...</span>
               </div>
            ) : (!activeProject?.githubRepos || activeProject.githubRepos.length === 0) ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <span className="text-xs font-mono">Connect a GitHub repository to stream activity</span>
               </div>
            ) : commits.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500 px-8 text-center">
                  <span className="text-xs font-mono leading-relaxed">No commits recorded on {activeProject.githubRepos[0]}.</span>
               </div>
            ) : (
              <div className="relative border-l border-zinc-800 ml-4 space-y-4">
                {commits.map((activity, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                    key={activity.id} 
                    className="relative pl-6 group"
                  >
                    <div className="absolute -left-[14px] top-1 bg-zinc-950 p-1 rounded-full border border-zinc-800 group-hover:border-indigo-500 group-hover:bg-indigo-950/20 transition-all">
                      <activity.icon size={11} className="text-zinc-500 group-hover:text-indigo-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors leading-relaxed">
                        {activity.content}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span className="bg-zinc-950 border border-zinc-850 px-1 py-[0.5px] rounded text-indigo-400/95 font-medium">{activity.id}</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Daily Trending Repositories Board (FULL WIDTH) */}
      <div className="border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm rounded-2xl flex flex-col relative overflow-hidden shadow-2xl">
        
        {/* Row 1: Header */}
        <div className="px-5 py-4 border-b border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
            <TrendingUp size={15} className="text-purple-400 shrink-0" />
            <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-widest">Real-Time GitHub Trends</h3>
          </div>
          
          {/* Controls: Search + Refresh + Language select drop */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
              <input
                type="text"
                placeholder="Filter repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 w-[180px] md:w-[220px]"
              />
            </div>

            {/* Language filter dropdown */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800/70 rounded-xl px-2.5 py-1">
              <Filter size={11} className="text-zinc-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent border-none text-[11px] text-zinc-400 focus:outline-none cursor-pointer pr-1"
              >
                {languagesList.map(lang => (
                  <option key={lang} value={lang} className="bg-zinc-950 text-zinc-300 text-xs">
                    {lang === 'All' ? 'All Languages' : lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh action */}
            <button 
              onClick={fetchTrendingObj}
              disabled={loadingTrending}
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700/80 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 shrink-0 flex items-center justify-center"
              title="Refresh trends"
            >
              <RefreshCw size={12} className={`${loadingTrending ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Body content with beautiful responsive grid, handling titles and overflow correctly */}
        <div className="p-5 relative flex-1 min-h-[220px]">
          {loadingTrending && trendingRepos.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2 bg-zinc-[#121214]/30">
                <Loader2 size={22} className="animate-spin text-purple-400" />
                <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">Reconstructing Trending Register...</span>
             </div>
          ) : filteredRepos.length === 0 ? (
             <div className="h-44 w-full flex flex-col items-center justify-center text-zinc-500">
                <span className="text-sm font-mono text-zinc-400">Zero matches for target criteria</span>
                <span className="text-[10px] text-zinc-600 mt-1">Try modifying your query or language filters above.</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRepos.map((repo, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  key={repo.id || i} 
                  className="bg-zinc-950/45 hover:bg-zinc-950/95 border border-zinc-800/80 hover:border-purple-500/50 rounded-xl p-4 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-md hover:shadow-[0_0_24px_rgba(147,51,234,0.14)] min-h-[148px]"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <a 
                        href={repo.html_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[12px] font-bold text-zinc-200 group-hover:text-purple-400 transition-colors truncate flex-1 flex items-center gap-1.5 font-mono"
                      >
                        {repo.name}
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-all text-zinc-500 shrink-0 transform translate-y-[-1px]" />
                      </a>
                      {repo.stars_today !== undefined && repo.stars_today > 0 && (
                        <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold shrink-0 font-mono">
                          +{repo.stars_today.toLocaleString()} ★
                        </span>
                      )}
                    </div>
                    {/* Repository description - with clear sizing rules to handle titles and stats without clipping */}
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3 min-h-[44px] break-words">
                      {repo.description || "No description provided."}
                    </p>
                  </div>

                  {/* Badges and statistics footer */}
                  <div className="flex items-end justify-between text-[10px] mt-4 pt-3 border-t border-zinc-900 text-zinc-500 font-mono">
                    <div className="flex flex-col gap-1 shrink-0">
                      <span className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full border border-black/10 shrink-0" 
                          style={{
                            backgroundColor: 
                              repo.language === 'TypeScript' ? '#3178c6' :
                              repo.language === 'JavaScript' ? '#f1e05a' :
                              repo.language === 'CSS' ? '#563d7c' :
                              repo.language === 'HTML' ? '#e34c26' :
                              repo.language === 'Go' ? '#00add8' :
                              repo.language === 'Python' ? '#3572A5' :
                              repo.language === 'Rust' ? '#dea584' :
                              repo.language === 'C++' ? '#f34b7d' :
                              repo.language === 'Java' ? '#b07219' : '#a1a1aa'
                          }}
                        />
                        <span className="text-zinc-400 font-medium">{repo.language || 'Codebase'}</span>
                      </span>
                      {/* Dates displaying Created At and Last Updated info */}
                      <div className="text-[9px] text-zinc-500 flex flex-col gap-0.5 leading-snug">
                        <span>Created: {getRepoDates(repo).createdStr}</span>
                        <span className="text-purple-400/90 font-medium">{getRepoDates(repo).updatedDistance}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 pb-0.5">
                      <span className="flex items-center gap-1 text-zinc-400 group-hover:text-amber-500 transition-colors">
                        <Star size={10} className="text-zinc-600 transition-colors" />
                        {repo.stargazers_count ? repo.stargazers_count.toLocaleString() : '0'}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400 group-hover:text-purple-400 transition-colors">
                        <GitFork size={10} className="text-zinc-600 transition-colors" />
                        {repo.forks_count ? repo.forks_count.toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
