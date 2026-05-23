import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity, GitCommit, Clock, CheckCircle2, Circle, Sparkles, Bot, Loader2, GitPullRequest } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '../context/DataProvider';

export function Dashboard() {
  const { projects, issues, activeProjectId, setActiveProjectId, githubToken, aiPersona } = useData();
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [briefingGenerating, setBriefingGenerating] = useState(false);
  const [briefingContent, setBriefingContent] = useState('');

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
        // Just fetch the first repo for now in the dashboard
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
             // Maybe API error
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
  const timeInFlowH = Math.floor(activityScore / 20) || 1;
  const timeInFlowM = (activityScore * 7) % 60;

  return (
    <div className="gap-6 flex-1 flex flex-col pb-8 min-h-full">
      
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-100 flex items-center gap-2">
          Hello, Developer <Sparkles size={20} className="text-indigo-400" />
        </h1>
        <p className="text-sm text-zinc-400">
          {format(new Date(), 'EEEE, MMMM do')} — You have {activeTasks.length} active tasks and {commits.length} recent commits in {activeProject ? activeProject.name : 'your workspace'}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Stats */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#121214] flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-1">
            <Activity size={14} /> Activity Score
          </div>
          <div className="text-2xl font-semibold text-zinc-100">{activityScore}<span className="text-sm text-zinc-500 font-normal">/100</span></div>
          <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" style={{ width: `${activityScore}%` }}></div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#121214] flex flex-col gap-2 overflow-hidden h-[116px]">
          <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-1">
            <Bot size={14} /> Project Intelligence
          </div>
          {activeProject ? (
            <div className="flex flex-col gap-2 text-[10px] text-zinc-300">
               {activeProject.launchTarget && (
                 <div className="flex items-center gap-1.5"><span className="text-zinc-500">Target Launch:</span> <span className="text-amber-500 font-semibold uppercase tracking-wide">{activeProject.launchTarget}</span></div>
               )}
               <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {activeProject.frameworks?.slice(0, 3).map(f => (
                     <span key={f} className="px-1.5 py-[2px] rounded bg-[#18181b] border border-zinc-700/50 text-zinc-400 truncate max-w-[80px]" title={f}>{f}</span>
                  ))}
                  {activeProject.apiConnections && activeProject.apiConnections.length > 0 && (
                     <span className="px-1.5 py-[2px] rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">+{activeProject.apiConnections.length} APIs</span>
                  )}
               </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 mt-2">No active project metadata.</div>
          )}
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-[#121214] to-amber-900/10 flex flex-col gap-2 relative overflow-hidden group hover:border-amber-500/40 transition-colors md:col-span-1 lg:col-span-1">
          <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px] transition-all duration-500 group-hover:scale-110">
            <Bot size={80} className="text-amber-500" />
          </div>
          <div className="flex items-center gap-2 text-amber-500/90 text-sm font-medium mb-1 z-10 w-full justify-between">
            <div className="flex items-center gap-2"><Sparkles size={14} /> AI Daily Briefing</div>
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
              className="text-[9px] uppercase tracking-wider bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
            >
              {briefingGenerating ? 'Synthesizing...' : 'Generate New'}
            </button>
          </div>
          <div className="z-10 flex flex-col gap-2 mt-1 flex-1">
             <p className="text-xs text-zinc-300 leading-relaxed max-w-[90%]">
               <strong className="text-amber-500 font-medium">Insights:</strong>{' '}
               {briefingGenerating && !briefingContent ? <span className="animate-pulse">Analyzing vectors...</span> : briefingContent ? briefingContent : activeTasks.length > 0 ? `Your next priority should be: ${activeTasks[0]?.title}.` : 'No active tasks require attention.'}
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        
        {/* Active Tasks Widget */}
        <div className="border border-zinc-800 bg-[#121214] rounded-xl flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#121214] rounded-t-xl z-10">
            <h3 className="font-semibold text-xs text-zinc-200">Active Issues ({activeProject?.name || 'No project'})</h3>
            <span className="text-[10px] text-zinc-500 font-medium bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">{activeTasks.filter(t => t.status !== 'Done').length} pending</span>
          </div>
          <div className="p-2 overflow-y-auto space-y-1 relative">
            {!activeProject ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <span className="text-xs">Create a project first</span>
               </div>
            ) : activeTasks.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <span className="text-xs">No active tasks.</span>
               </div>
            ) : (
              activeTasks.map((task, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={task.id} 
                  className="flex flex-col gap-1 p-2 rounded-lg hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5 shrink-0">
                      {task.status === 'Done' ? <CheckCircle2 size={14} className="text-emerald-500" /> :
                       task.status === 'In Progress' ? <Circle size={14} className="text-blue-400 fill-blue-400/20" /> :
                       <Circle size={14} className="text-zinc-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${task.status === 'Done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                        {task.title}
                      </p>
                      <div className="text-[10px] mt-1 text-zinc-500 flex items-center gap-2">
                         <span className="bg-zinc-900 border border-zinc-800 px-1.5 py-[1px] rounded text-zinc-400">{activeProject.name}</span>
                         <span className="text-zinc-600">#{task.id.slice(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Activity Stream */}
        <div className="border border-zinc-800 bg-[#121214] rounded-xl flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-zinc-800 sticky top-0 bg-[#121214] rounded-t-xl z-10">
            <h3 className="font-semibold text-xs text-zinc-200">Recent GitHub Commits</h3>
          </div>
          <div className="p-4 overflow-y-auto relative">
            {loading ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span className="text-xs">Fetching stream...</span>
               </div>
            ) : (!activeProject?.githubRepos || activeProject.githubRepos.length === 0) ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <span className="text-xs">Link a GitHub repo to see commitments.</span>
               </div>
            ) : commits.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <span className="text-xs">No commits found for {activeProject.githubRepos[0]}.</span>
               </div>
            ) : (
              <div className="relative border-l border-zinc-800 ml-3 space-y-5">
                {commits.map((activity, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    key={activity.id} 
                    className="relative pl-6"
                  >
                    <div className="absolute -left-[17px] top-1 bg-[#0f0f0f] p-1">
                      <activity.icon size={14} className={activity.color} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-zinc-300">
                        {activity.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{activity.time}</span>
                        <span>•</span>
                        <span className="font-medium text-zinc-400">{activity.repo}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
