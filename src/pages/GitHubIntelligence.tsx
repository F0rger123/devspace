import { useState, useEffect } from 'react';
import { GitBranch, GitCommit, GitMerge, GitPullRequest, Search, CheckCircle2, XCircle, Clock, Loader2, Github, X, BookMarked, Bot, Layers, Plus, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataProvider';
import { githubSignIn } from '../lib/auth';

export function GitHubIntelligence() {
  const { 
    githubUser, 
    setGithubUser, 
    githubToken, 
    setGithubToken, 
    githubProfile, 
    setGithubProfile,
    projects,
    setProjects,
    updateProject,
    activeProjectId,
    githubRepo,
    setGithubRepo
  } = useData();

  const repo = githubRepo || (githubUser && githubUser !== 'google' ? `${githubUser}/` : 'google/genai-js');
  const setRepo = (r: string | null | ((prev: string | null) => string | null)) => {
    if (typeof r === 'function') {
      setGithubRepo((prev) => {
        const current = prev || (githubUser && githubUser !== 'google' ? `${githubUser}/` : 'google/genai-js') || '';
        return r(current);
      });
    } else {
      setGithubRepo(r);
    }
  };

  const [commits, setCommits] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [fetchedRepos, setFetchedRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [insightGenerating, setInsightGenerating] = useState(false);
  const [insightContent, setInsightContent] = useState('');

  // Fetch commits and PRs for selected repository
  const syncCommits = async () => {
    if (!repo) return;
    setLoading(true);
    setInsightContent(''); // clear old insights
    try {
      const res = await fetch('/api/github/pull', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ repo, token: githubToken || undefined })
      });
      const contentType1 = res.headers.get("content-type");
      if (contentType1 && contentType1.includes("application/json")) {
         const data = await res.json();
         if (Array.isArray(data)) {
            setCommits(data.map((c: any) => ({
               id: c.sha.substring(0, 7),
               msg: c.commit.message.split('\n')[0],
               author: c.commit.author.name,
               time: new Date(c.commit.author.date).toLocaleDateString() + ' ' + new Date(c.commit.author.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
               verified: c.commit.verification?.verified || false
            })));
         } else {
            setCommits([]);
         }
      } else {
         setCommits([]);
      }

      // Fetch open pull requests / issues
      const resPr = await fetch('/api/github/issues', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ repo, state: 'open', token: githubToken || undefined })
      });
      const contentType2 = resPr.headers.get("content-type");
      if (contentType2 && contentType2.includes("application/json")) {
         const dataPr = await resPr.json();
         if (Array.isArray(dataPr)) {
            setPrs(dataPr.filter(p => !!p.pull_request).map((p: any) => ({
               id: `#${p.number}`,
               title: p.title,
               author: p.user.login,
               status: p.state,
               ci: 'passed'
            })).slice(0, 5));
         } else {
            setPrs([]);
         }
      } else {
         setPrs([]);
      }
    } catch (e) {
      console.error(e);
      setCommits([]);
      setPrs([]);
    }
    setLoading(false);
  };

  // List all directories/repositories under custom organization or user profile
  const fetchGithubRepos = async (overrideUser?: string, overrideToken?: string) => {
    const userToFetch = overrideUser || githubUser;
    const tokenToUse = overrideToken || githubToken;
    const isOwnProfile = userToFetch === (overrideUser ? overrideUser : githubUser) && userToFetch === githubUser;
    
    setLoadingRepos(true);
    try {
      const res = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenToUse ? { token: tokenToUse, user: userToFetch, isOwnProfile } : { user: userToFetch || 'google' })
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (Array.isArray(data)) {
            setFetchedRepos(data);
            
            // If the current repo is incomplete (e.g. 'username/'), pre-fill with the first one
            setRepo((currentRepo) => {
               if (currentRepo && currentRepo.endsWith('/') && data.length > 0 && data[0].full_name) {
                  return data[0].full_name;
               }
               return currentRepo;
            });
        } else {
            setFetchedRepos([]);
        }
      } else {
         setFetchedRepos([]);
      }
    } catch (e) {
      console.error(e);
      setFetchedRepos([]);
    }
    setLoadingRepos(false);
  };

  // Assign or unlink repositories from specified project
  const handleAssignRepo = (projectId: string, repoName: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Ensure array exists
    const currentRepos = project.githubRepos || [];
    if (currentRepos.includes(repoName)) return; // already associated

    updateProject(projectId, {
      githubRepos: [...currentRepos, repoName]
    });
  };

  const handleUnassignRepo = (projectId: string, repoName: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const currentRepos = project.githubRepos || [];
    updateProject(projectId, {
      githubRepos: currentRepos.filter(r => r !== repoName)
    });
  };

  const handleOAuthLogin = async () => {
    setLoggingIn(true);
    setAuthError(null);
    try {
      const res = await githubSignIn();
      if (res && res.username) {
        setGithubUser(res.username);
        setGithubToken(res.accessToken);
        setGithubProfile(res.user);
        
        // Fetch actual repositories
        setLoadingRepos(true);
        try {
          const reposRes = await fetch('/api/github/repos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: res.accessToken, user: res.username, isOwnProfile: true })
          });
          const contentType = reposRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await reposRes.json();
            if (Array.isArray(data)) {
               setFetchedRepos(data);
               if (data.length > 0 && data[0].full_name) {
                 setRepo(data[0].full_name);
               } else {
                 setRepo(`${res.username}/`);
               }
            } else {
               setFetchedRepos([]);
            }
          }
        } catch (e) {
          console.error(e);
          setFetchedRepos([]);
        }
        setLoadingRepos(false);
      }
    } catch(e: any) {
      console.error("Login failed", e);
      setAuthError(e.message || String(e));
    }
    setLoggingIn(false);
  };

  const generateInsights = async () => {
     if (commits.length === 0) return;
     setInsightGenerating(true);
     setInsightContent('');
     try {
       const prompt = `Act as an AI tech lead. Review these recent commits from ${repo}: ${JSON.stringify(commits.slice(0, 5))}. Give a 2-3 sentence insight on the repository's velocity, health, or focus areas (e.g. "Auth system stagnant", "Heavy focus on UI"). Keep it highly actionable.`;
       const response = await fetch('/api/gemini/stream', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           messages: [{ role: 'user', content: prompt }]
         })
       });
       if (!response.ok) throw new Error('Failed to generate insights');
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
                 setInsightContent(content);
               }
             } catch (e) {}
           }
         }
       }
     } catch (e) {
       setInsightContent('Error generating repository development insights.');
     }
     setInsightGenerating(false);
  };

  useEffect(() => {
    syncCommits();
  }, [repo]);

  useEffect(() => {
    fetchGithubRepos();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden pb-4 relative">
      
      {/* Header sections */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            GitHub Intelligence <GitBranch size={18} className="text-blue-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Map repository workspaces, assign triggers to projects, and review live commits & AI lead insights.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {githubToken ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#121214] border border-zinc-800 rounded-md">
              <img src={githubProfile?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${githubUser}`} alt="Github Avatar" className="w-4 h-4 rounded-full bg-zinc-850" />
              <span className="text-[10px] text-zinc-300 font-bold">{githubUser} (OAuth)</span>
            </div>
          ) : (
            <button 
              onClick={() => setShowRepoModal(true)}
              className="px-3 py-1.5 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-750 text-white rounded-md border border-zinc-700 transition-colors flex items-center gap-2 shadow"
            >
              <Github size={12} />
              <span>Connect GitHub</span>
            </button>
          )}

          <div 
            onClick={() => setShowRepoModal(true)}
            className="flex items-center bg-[#121214] border border-zinc-800 rounded-md px-3 py-1.5 cursor-pointer hover:bg-[#18181b] transition-colors"
          >
            <span className="text-zinc-500 text-[10px] font-mono">Repo:</span>
            <span className="text-[11px] text-zinc-200 ml-2 font-semibold truncate max-w-[150px]">{repo}</span>
          </div>
          
          <button 
            onClick={syncCommits}
            disabled={loading || !repo}
            className="px-3 py-1.5 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md transition-colors flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <GitPullRequest size={12} />} Reload context
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        
        {/* Left/Middle Columns: Commits, PRs, and Project mappings list */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          
          {/* Active project code assignments */}
          <div className="border border-zinc-900 bg-[#121214]/60 rounded-xl p-4">
            <h3 className="font-bold text-xs text-zinc-200 flex items-center gap-2 mb-3">
              <Layers size={13} className="text-blue-400" />
              <span>Project Code Mappings</span>
            </h3>
            <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">Assign connected GitHub repositories to DevSpace projects below. Active assigned repos feed context to agents watching that scope.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map(proj => {
                const assignedRepos = proj.githubRepos || [];
                const isActive = proj.id === activeProjectId;
                return (
                  <div key={proj.id} className={`p-3 bg-[#09090b] border rounded-lg transition-colors flex flex-col justify-between ${isActive ? 'border-blue-600/50 bg-blue-950/5' : 'border-zinc-850'}`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-200 block truncate">{proj.name}</span>
                        {isActive && <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded uppercase font-bold font-mono">Active</span>}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 lines-clamp-1">{proj.description}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-900">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Assigned Reposities ({assignedRepos.length})</span>
                      <div className="space-y-1">
                        {assignedRepos.length === 0 ? (
                          <div className="text-[10px] text-zinc-650 italic py-1 block">No repositories assigned. Link one below.</div>
                        ) : assignedRepos.map(ar => (
                          <div key={ar} className="flex items-center justify-between p-1 px-2 bg-zinc-950 border border-zinc-850 rounded text-[10px]">
                            <button 
                              onClick={() => { setRepo(ar); }}
                              className="text-zinc-300 font-medium font-mono hover:text-blue-400 hover:underline text-left truncate flex-1 block"
                            >
                              {ar}
                            </button>
                            <button 
                              onClick={() => handleUnassignRepo(proj.id, ar)}
                              className="text-zinc-600 hover:text-rose-400 p-1"
                              title="Unassign Codebase"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Link quick dropdown */}
                      <div className="mt-2.5 flex gap-1">
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignRepo(proj.id, e.target.value);
                              e.target.value = ''; // Reset select
                            }
                          }}
                          className="w-full bg-zinc-950/80 border border-zinc-850 rounded px-1.5 py-1 text-[10px] text-zinc-400 outline-none focus:border-zinc-700"
                        >
                          <option value="">+ Assign repository...</option>
                          {fetchedRepos.map(fr => (
                            <option key={fr.id} value={fr.full_name}>{fr.full_name}</option>
                          ))}
                          {repo && !fetchedRepos.some(fr => fr.full_name === repo) && (
                            <option value={repo}>{repo} (Selected)</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity stream log timeline */}
          <div className="border border-zinc-800 bg-[#121214] rounded-xl flex flex-col flex-1 min-h-[300px]">
            <div className="px-4 py-3 border-b border-zinc-800 bg-[#09090b]/50 rounded-t-xl flex items-center justify-between">
              <h3 className="font-semibold text-xs text-zinc-100 flex items-center gap-2">
                <GitCommit size={14} className="text-zinc-500"/>
                <span>Activity Stream: {repo}</span>
              </h3>
              <span className="text-[9px] font-mono text-zinc-500 uppercase">Commits Log</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-24 text-zinc-500">
                  <Loader2 size={18} className="animate-spin text-blue-400 mb-2" />
                  <span className="text-[11px]">Syncing remote git commits...</span>
                </div>
              ) : commits.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 text-xs flex flex-col items-center justify-center gap-1.5">
                  <BookMarked size={24} className="opacity-20" />
                  <span>No commits found for repository "{repo}"</span>
                  <span className="text-[10px] opacity-70">Check credentials, repo name, or search another codebase on the top right.</span>
                </div>
              ) : (
                <div className="relative border-l border-zinc-800 ml-[11px] space-y-3.5 pt-1">
                  {commits.map((c, i) => (
                    <motion.div 
                      key={c.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative pl-6 group"
                    >
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-zinc-700 group-hover:border-blue-400 transition-colors"></div>
                      <div className="bg-zinc-950/60 border border-zinc-850 p-3 rounded-lg hover:border-zinc-700 hover:bg-[#18181b] transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-zinc-200">{c.msg}</span>
                          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900/80 px-1.5 py-0.5 border border-zinc-800/80 rounded">
                            {c.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3.5 text-[10px] text-zinc-500">
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-400 text-[8px] flex items-center justify-center font-bold">
                              {c.author.substring(0, 2).toUpperCase()}
                            </span>
                            {c.author}
                          </span>
                          <span className="flex items-center gap-1"><Clock size={10}/> {c.time}</span>
                          {c.verified && <span className="text-emerald-500 flex items-center gap-0.5"><CheckCircle2 size={10}/> Verified</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pull Requests & AI Audits */}
        <div className="flex flex-col gap-4">
          
          <div className="border border-zinc-800 bg-[#121214] rounded-xl flex flex-col flex-1 min-h-[300px]">
            <div className="px-4 py-3 border-b border-zinc-800 bg-[#09090b]/50 rounded-t-xl sticky top-0 z-10 flex items-center justify-between">
                <h3 className="font-semibold text-xs text-zinc-100 flex items-center gap-2">
                  <GitPullRequest size={14} className="text-zinc-500"/> Pull Requests
                </h3>
                <span className="text-[9px] font-mono text-zinc-500 font-bold bg-zinc-900 shrink-0 px-2.5 rounded-full py-0.3 border border-zinc-800">Open: {prs.length}</span>
            </div>
            
            <div className="p-3 space-y-2 relative flex-1 overflow-y-auto">
               {loading && prs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                      <Loader2 size={16} className="animate-spin mb-2 text-blue-400" />
                      <span className="text-xs">Fetching pull requests...</span>
                  </div>
               ) : prs.length === 0 ? (
                  <div className="text-zinc-500 text-xs text-center py-12 italic">No open Pull Requests found.</div>
               ) : prs.map((pr) => (
                  <div key={pr.id} className="p-3 bg-[#09090b] border border-zinc-850 rounded-lg group hover:border-zinc-700 transition-colors cursor-pointer">
                     <div className="flex items-start justify-between mb-2">
                        <h4 className="text-[11px] font-medium text-zinc-200 leading-snug pr-2 group-hover:text-blue-400 transition-colors">{pr.title}</h4>
                        <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">Open</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] text-zinc-500">
                       <span className="font-mono bg-zinc-950 border border-zinc-850 px-1 rounded">{pr.id}</span>
                       <div className="flex items-center gap-1.5">
                         <CheckCircle2 size={12} className="text-emerald-500"/>
                         <span>CI / Passed</span>
                       </div>
                     </div>
                  </div>
               ))}
            </div>

            <div className="p-4 border-t border-zinc-800 flex flex-col gap-3 bg-zinc-950/20">
               <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Workspace CI Actions</div>
               <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                     <span className="text-zinc-300 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Render Containers Production</span>
                     <span className="text-zinc-500 font-mono text-[10px]">3000 Ingress OK</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                     <span className="text-zinc-300 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Web Lint (ESLint v9)</span>
                     <span className="text-zinc-500 font-mono text-[10px]">Verified green</span>
                  </div>
               </div>
            </div>
          </div>

          {/* AI Repository Insights Panel */}
          <div className="border border-blue-500/20 bg-gradient-to-br from-[#121214] to-blue-950/10 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group">
             <div className="flex items-center justify-between mb-1">
                <div className="text-blue-400 flex items-center gap-2 text-xs font-semibold">
                   <Bot size={14} /> Repository AI Insights
                </div>
                <button 
                  onClick={generateInsights}
                  disabled={insightGenerating || commits.length === 0}
                  className="text-[9px] uppercase tracking-wider bg-blue-500/25 hover:bg-blue-500/40 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {insightGenerating ? <Loader2 size={10} className="animate-spin inline" /> : <Sparkles size={10} />}
                  <span>Analyze</span>
                </button>
             </div>
             <p className="text-[11px] text-zinc-300 leading-relaxed">
                {insightGenerating && !insightContent ? <span className="animate-pulse font-mono text-[10px]">Running Gemini analysis on commit streams...</span> : insightContent ? insightContent : 'Map codebases and click analyze to output technical lead diagnostics.'}
             </p>
          </div>
        </div>

      </div>

      {showRepoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                 <Github size={16} /> Connect & Bind GitHub Codebases
              </h2>
              <button onClick={() => setShowRepoModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {authError && (
              <div className="m-4 p-4 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs text-amber-200">
                <div className="font-semibold flex items-center gap-1.5 mb-1.5 text-amber-400">
                  <XCircle size={14} className="shrink-0" /> Firebase Auth Context
                </div>
                <p className="leading-relaxed mb-3">
                  {authError}
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setAuthError(null)}
                    className="text-zinc-400 hover:text-zinc-200 text-[10px] underline ml-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
               <div className="flex gap-2">
                 <input 
                   autoFocus
                   value={githubUser}
                   onChange={e => setGithubUser(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && fetchGithubRepos()}
                   className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-zinc-250 outline-none focus:border-blue-500/50 transition-colors font-mono"
                   placeholder="Enter GitHub Profile / Organization"
                 />
                 <button 
                   onClick={() => fetchGithubRepos()}
                   disabled={loadingRepos}
                   className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
                 >
                   {loadingRepos ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
                 </button>
               </div>
               
               <div className="flex items-center gap-4 mt-4 text-xs">
                 <div className="h-px bg-zinc-800 flex-1"></div>
                 <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">OR</span>
                 <div className="h-px bg-zinc-800 flex-1"></div>
               </div>
               
               <button 
                  onClick={handleOAuthLogin}
                  disabled={loggingIn}
                  className="mt-4 w-full py-2 bg-[#2ea043] hover:bg-[#2c974b] disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow"
               >
                  {loggingIn ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
                  <span>Sign in with GitHub OAuth</span>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
               {loadingRepos ? (
                  <div className="flex items-center justify-center py-12 text-zinc-500">
                    <Loader2 size={20} className="animate-spin text-blue-500" />
                  </div>
               ) : fetchedRepos.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs">
                    {githubUser ? 'No repositories found.' : 'Enter a profile or team name to list repository directories.'}
                  </div>
               ) : (
                  <div className="space-y-1">
                     {fetchedRepos.map((r: any) => {
                       const matchesSelected = r.full_name === repo;
                       return (
                         <div 
                           key={r.id} 
                           onClick={() => { setRepo(r.full_name); setShowRepoModal(false); }}
                           className={`flex items-center justify-between p-3 rounded-lg hover:bg-zinc-850 cursor-pointer border transition-colors group ${matchesSelected ? 'bg-blue-950/20 border-blue-500/25' : 'border-transparent hover:border-zinc-800'}`}
                         >
                           <div className="flex items-start gap-3 min-w-0 flex-1 pr-2">
                              <BookMarked size={16} className={`shrink-0 mt-0.5 ${matchesSelected ? 'text-blue-400' : 'text-zinc-500'}`} />
                              <div className="min-w-0">
                                <div className={`text-xs font-medium truncate ${matchesSelected ? 'text-blue-400' : 'text-zinc-200'}`}>{r.full_name}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5 truncate leading-tight">{r.description || 'No description'}</div>
                              </div>
                           </div>
                           <button className="text-[10px] bg-zinc-950 border border-zinc-800 hover:bg-blue-600 hover:text-white hover:border-blue-700 font-bold px-2.5 py-1.2 rounded transition-colors shrink-0 text-zinc-400">
                              Select
                           </button>
                         </div>
                       );
                     })}
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
