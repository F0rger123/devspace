import { useState, useEffect } from 'react';
import { GitBranch, GitCommit, GitMerge, GitPullRequest, Search, CheckCircle2, XCircle, Clock, Loader2, Github, X, BookMarked, Bot, Layers, Plus, Trash2, ShieldCheck, Sparkles, Webhook } from 'lucide-react';
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
    addProject,
    updateProject,
    activeProjectId,
    githubRepo,
    setGithubRepo,
    analyzeProjectCommits,
    showToast
  } = useData();

  const repo = githubRepo || (githubUser && githubUser !== 'google' ? `${githubUser}/` : 'google/genai-js');
  const setRepo = (r: string | null | ((prev: string | null) => string | null)) => {
    if (typeof r === 'function') {
      setGithubRepo((prev) => {
        const current = prev || (githubUser && githubUser !== 'google' ? `${githubUser}/` : 'google/genai-js') || '';
        const updated = r(current);
        if (updated && activeProjectId) {
          updateProject(activeProjectId, { githubRepos: [updated] });
        }
        return updated;
      });
    } else {
      setGithubRepo(r);
      if (r && activeProjectId) {
        updateProject(activeProjectId, { githubRepos: [r] });
      }
    }
  };

  const [analyzingCommitsId, setAnalyzingCommitsId] = useState<string | null>(null);
  const [commits, setCommits] = useState<any[]>(() => {
    const now = new Date();
    const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);
    const formatDate = (date: Date) => {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    return [
      {
        id: "7a29f3d",
        msg: "feat: implement motion-prediction buffer to prevent hand tracking loss during fast movements",
        author: "drummerforger",
        time: formatDate(minutesAgo(12)),
        verified: true
      },
      {
        id: "cf30d21",
        msg: "fix: normalize coordinate mapping for complete viewport mouse coverage",
        author: "drummerforger",
        time: formatDate(minutesAgo(45)),
        verified: true
      },
      {
        id: "2e9a55b",
        msg: "refactor: optimize camera stream tracking latency and response speeds",
        author: "Aether AI Autopilot",
        time: formatDate(minutesAgo(120)),
        verified: true
      },
      {
        id: "92fd5a1",
        msg: "docs: add comprehensive hand-tracking gesture macro cheat sheet",
        author: "drummerforger",
        time: formatDate(minutesAgo(360)),
        verified: false
      },
      {
        id: "b40d321",
        msg: "chore: bootstrap initial workspace settings and obsidian synaptic rules",
        author: "Aether AI Autopilot",
        time: formatDate(minutesAgo(1440)),
        verified: true
      }
    ];
  });
  const [prs, setPrs] = useState<any[]>([]);
  const [mergingPrId, setMergingPrId] = useState<string | null>(null);

  const handleAcceptMergePR = async (prId: string) => {
    if (!githubToken) {
      showToast('Please connect your GitHub account in Sandbox Loop or Settings to merge pull requests directly.', 'error');
      return;
    }
    const pullNum = parseInt(prId.replace('#', ''), 10);
    if (isNaN(pullNum)) return;

    setMergingPrId(prId);
    try {
      const res = await fetch('/api/github/merge-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          pullNumber: pullNum,
          token: githubToken
        })
      });

      if (res.ok) {
        showToast(`Pull request ${prId} successfully merged on GitHub!`, 'success');
        setPrs(prev => prev.map(p => p.id === prId ? { ...p, status: 'closed', merged: true } : p));
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to merge PR');
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Error merging pull request.', 'error');
    } finally {
      setMergingPrId(null);
    }
  };

  const [loading, setLoading] = useState(false);
  const [backgroundSyncing, setBackgroundSyncing] = useState(false);
  const [isAutoPullActive, setIsAutoPullActive] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [fetchedRepos, setFetchedRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [insightGenerating, setInsightGenerating] = useState(false);
  const [insightContent, setInsightContent] = useState('');

  // GitHub Autopilot States
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [autopilotBranchMode, setAutopilotBranchMode] = useState<'main' | 'branch'>('branch');
  const [autopilotLogs, setAutopilotLogs] = useState<any[]>([]);
  const [autopilotQueue, setAutopilotQueue] = useState<any[]>([]);
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [triggeringAutopilot, setTriggeringAutopilot] = useState(false);
  const [autopilotTab, setAutopilotTab] = useState<'queue' | 'recurring' | 'webhooks'>('queue');

  // GitHub Webhooks States
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [newWebhookRepo, setNewWebhookRepo] = useState('');
  const [newWebhookSecret, setNewWebhookSecret] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['issues', 'pull_request']);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  
  // Simulator states
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [simEvent, setSimEvent] = useState<'issues' | 'pull_request'>('issues');
  const [simAction, setSimAction] = useState<string>('opened');
  const [simIssueTitle, setSimIssueTitle] = useState('Critical layout refactor required');
  const [simIssueBody, setSimIssueBody] = useState('Optimize the viewport settings to prevent content clipping on mobile breakpoints.');
  const [simIssueLabels, setSimIssueLabels] = useState('aether-autopilot, bug');
  const [simPrTitle, setSimPrTitle] = useState('feat: Add OAuth flow endpoints');
  const [simPrBody, setSimPrBody] = useState('Prerequisite for linking social accounts securely.');
  const [simPrBranch, setSimPrBranch] = useState('oauth-refactor');
  const [webhookSubTab, setWebhookSubTab] = useState<'config' | 'simulate'>('config');

  // Add Task to Queue Form States
  const [newQueueProjId, setNewQueueProjId] = useState('');
  const [newQueueTitle, setNewQueueTitle] = useState('');
  const [newQueueDetails, setNewQueueDetails] = useState('');
  const [queuingTask, setQueuingTask] = useState(false);

  // Recurring GitHub Tasks States
  const [recurringTasks, setRecurringTasks] = useState<any[]>([]);
  const [newRecProjId, setNewRecProjId] = useState('');
  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecDetails, setNewRecDetails] = useState('');
  const [newRecInterval, setNewRecInterval] = useState('60');
  const [creatingRecurring, setCreatingRecurring] = useState(false);

  // Fetch Webhooks list
  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/github/webhooks');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (err) {
      console.debug("Failed to fetch webhooks:", err);
    }
  };

  // Fetch Autopilot configuration & live terminal logs from server
  const fetchAutopilotConfig = async () => {
    try {
      const res = await fetch('/api/github/autopilot/config');
      if (res.ok) {
        const data = await res.json();
        setAutopilotEnabled(data.enabled);
        setAutopilotBranchMode(data.branchMode || 'branch');
        setAutopilotLogs(data.logs || []);
        setAutopilotQueue(data.queue || []);
        setRecurringTasks(data.recurringTasks || []);
      }
      await fetchWebhooks();
    } catch (err) {
      console.debug("Failed to load Autopilot configuration:", err);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookRepo.trim()) return;
    setIsCreatingWebhook(true);
    try {
      const res = await fetch('/api/github/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: newWebhookRepo,
          secret: newWebhookSecret,
          events: newWebhookEvents,
          active: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks);
        setNewWebhookRepo('');
        setNewWebhookSecret('');
      }
    } catch (err) {
      console.error("Failed to create webhook:", err);
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const handleToggleWebhook = async (id: string) => {
    try {
      const res = await fetch('/api/github/webhooks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks);
      }
    } catch (err) {
      console.error("Failed to toggle webhook:", err);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/github/webhooks/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks);
      }
    } catch (err) {
      console.error("Failed to delete webhook:", err);
    }
  };

  const handleSimulateWebhook = async () => {
    setSimulatingWebhook(true);
    try {
      const res = await fetch('/api/github/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: simEvent,
          action: simAction,
          repo: repo,
          issueTitle: simIssueTitle,
          issueBody: simIssueBody,
          issueLabels: simIssueLabels.split(',').map(s => s.trim()),
          prTitle: simPrTitle,
          prBody: simPrBody,
          prBranch: simPrBranch
        })
      });
      if (res.ok) {
        await fetchAutopilotConfig();
      }
    } catch (err) {
      console.error("Failed to simulate webhook:", err);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  // Update Autopilot configuration on the server
  const saveAutopilotConfig = async (enabled: boolean, mode: 'main' | 'branch') => {
    setAutopilotLoading(true);
    try {
      const res = await fetch('/api/github/autopilot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, branchMode: mode })
      });
      if (res.ok) {
        const data = await res.json();
        setAutopilotEnabled(data.enabled);
        setAutopilotBranchMode(data.branchMode);
      }
    } catch (err) {
      console.error("Failed to update Autopilot configuration:", err);
    } finally {
      setAutopilotLoading(false);
    }
  };

  // Manually trigger an immediate Autopilot check & deployment cycle
  const triggerAutopilotCycle = async () => {
    setTriggeringAutopilot(true);
    try {
      const res = await fetch('/api/github/autopilot/trigger', { method: 'POST' });
      if (res.ok) {
        // Refresh logs immediately
        await fetchAutopilotConfig();
      }
    } catch (err) {
      console.error("Failed to trigger manual Autopilot cycle:", err);
    } finally {
      setTriggeringAutopilot(false);
    }
  };

  // Add task to Autopilot queue
  const handleAddAutopilotQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueueTitle.trim()) return;

    setQueuingTask(true);
    try {
      const selectedProj = projects.find(p => p.id === newQueueProjId) || projects[0];
      const res = await fetch('/api/github/autopilot/queue/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProj?.id || 'temp-proj',
          projectName: selectedProj?.name || 'General Workspace',
          title: newQueueTitle,
          details: newQueueDetails,
          type: 'custom'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAutopilotQueue(data.queue);
        setNewQueueTitle('');
        setNewQueueDetails('');
      }
    } catch (err) {
      console.error("Failed to add task to Autopilot queue:", err);
    } finally {
      setQueuingTask(false);
    }
  };

  // Clear completed/failed items from queue
  const handleClearQueue = async () => {
    try {
      const res = await fetch('/api/github/autopilot/queue/clear', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAutopilotQueue(data.queue);
      }
    } catch (err) {
      console.error("Failed to clear Autopilot queue:", err);
    }
  };

  // Remove a single item from the queue
  const handleRemoveQueueItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/github/autopilot/queue/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setAutopilotQueue(data.queue);
      }
    } catch (err) {
      console.error("Failed to delete item from Autopilot queue:", err);
    }
  };

  // Add new recurring task
  const handleAddRecurringTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecTitle.trim()) return;

    setCreatingRecurring(true);
    try {
      const selectedProj = projects.find(p => p.id === newRecProjId) || projects[0];
      const res = await fetch('/api/github/autopilot/recurring/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProj?.id || 'temp-proj',
          projectName: selectedProj?.name || 'General Workspace',
          title: newRecTitle,
          details: newRecDetails,
          intervalMinutes: parseInt(newRecInterval, 10) || 60
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRecurringTasks(data.recurringTasks);
        setNewRecTitle('');
        setNewRecDetails('');
        setNewRecInterval('60');
      }
    } catch (err) {
      console.error("Failed to add recurring task:", err);
    } finally {
      setCreatingRecurring(false);
    }
  };

  // Toggle active/inactive for a recurring task
  const handleToggleRecurringTask = async (id: string, currentlyEnabled: boolean) => {
    try {
      const res = await fetch('/api/github/autopilot/recurring/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !currentlyEnabled })
      });
      if (res.ok) {
        const data = await res.json();
        setRecurringTasks(data.recurringTasks);
      }
    } catch (err) {
      console.error("Failed to toggle recurring task:", err);
    }
  };

  // Delete a recurring task
  const handleDeleteRecurringTask = async (id: string) => {
    try {
      const res = await fetch(`/api/github/autopilot/recurring/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setRecurringTasks(data.recurringTasks);
      }
    } catch (err) {
      console.error("Failed to delete recurring task:", err);
    }
  };

  // Fetch commits and PRs for selected repository
  const syncCommits = async (isBackground = false) => {
    if (!repo) return;
    if (isBackground) {
      setBackgroundSyncing(true);
    } else {
      setLoading(true);
    }
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
      setLastSyncedAt(new Date());
    } catch (e: any) {
      if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
        console.warn("Failed to sync GitHub commits due to network/offline state:", e.message);
      } else {
        console.error(e);
      }
      setCommits([]);
      setPrs([]);
    }
    setLoading(false);
    setBackgroundSyncing(false);
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
    } catch (e: any) {
      if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
        console.debug("Failed to fetch github repos (network/offline):", e.message);
      } else {
        console.error(e);
      }
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
        } catch (e: any) {
          if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
            console.debug("Failed to fetch github repos (network/offline):", e.message);
          } else {
            console.error(e);
          }
          setFetchedRepos([]);
        }
        setLoadingRepos(false);
      }
    } catch(e: any) {
      if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
        console.warn("Login failed (network/offline):", e.message);
      } else {
        console.error("Login failed", e);
      }
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
    if (!isAutoPullActive || !repo) return;
    
    // Auto-refresh commits and issues in background every 30 seconds
    const interval = setInterval(() => {
      syncCommits(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [repo, isAutoPullActive]);

  useEffect(() => {
    fetchGithubRepos();
  }, []);

  useEffect(() => {
    fetchAutopilotConfig();
    const interval = setInterval(fetchAutopilotConfig, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-auto lg:h-full lg:overflow-hidden pb-4 relative">
      
      {/* Header sections */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-wide text-zinc-100 flex items-center gap-2">
            GitHub <span className="font-semibold italic text-yellow-500">Intelligence</span> <GitBranch size={18} className="text-yellow-500/80 animate-pulse" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Map repository workspaces, assign triggers to projects, and review live commits & AI lead insights.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {githubToken ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#121214] border border-zinc-800 rounded-md">
                <img src={githubProfile?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${githubUser}`} alt="Github Avatar" className="w-4 h-4 rounded-full bg-zinc-850" />
                <span className="text-[10px] text-zinc-300 font-bold">{githubUser}</span>
              </div>
              <button
                onClick={() => {
                  setGithubToken('');
                  setGithubUser('');
                  setGithubProfile(null);
                  showToast('Disconnected GitHub account.', 'success');
                }}
                className="px-2.5 py-1.5 text-[10px] font-medium bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-md border border-red-900/30 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowRepoModal(true)}
              className="px-3 py-1.5 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-750 text-white rounded-md border border-zinc-700 transition-colors flex items-center gap-2 shadow cursor-pointer"
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

          <div 
            onClick={() => setIsAutoPullActive(prev => !prev)}
            className="flex items-center bg-[#121214] border border-zinc-800/80 hover:border-zinc-700 rounded-md px-3 py-1.5 cursor-pointer transition-colors"
            title="Toggle background real-time sync (30s interval)"
          >
            <span className="relative flex h-2 w-2 mr-2">
              {isAutoPullActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoPullActive ? 'bg-emerald-500' : 'bg-zinc-650'}`}></span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400 select-none">
              {isAutoPullActive ? 'Live Syncing' : 'Sync Paused'}
            </span>
            {backgroundSyncing && <Loader2 size={10} className="animate-spin text-emerald-400 ml-1.5" />}
          </div>
          
          <button 
            onClick={() => syncCommits(false)}
            disabled={loading || !repo}
            className="px-3 py-1.5 text-[11px] font-bold bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
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
              <Layers size={13} className="text-yellow-500" />
              <span>Project Code Mappings</span>
            </h3>
            <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">Assign connected GitHub repositories to DevSpace projects below. Active assigned repos feed context to agents watching that scope.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map(proj => {
                const assignedRepos = proj.githubRepos || [];
                const isActive = proj.id === activeProjectId;
                return (
                  <div key={proj.id} className={`p-3 bg-[#09090b] border rounded-lg transition-colors flex flex-col justify-between ${isActive ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-zinc-850'}`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-200 block truncate">{proj.name}</span>
                        {isActive && <span className="text-[8px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1 py-0.2 rounded uppercase font-bold font-mono">Active</span>}
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
                              className="text-zinc-300 font-medium font-mono hover:text-yellow-400 hover:underline text-left truncate flex-1 block"
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

          {/* AI Commit Watcher Feed */}
          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-left">
                <h3 className="font-bold text-xs text-zinc-200 flex items-center gap-2">
                  <Sparkles size={13} className="text-yellow-400 animate-pulse" />
                  <span>Gemini AI Commit Watcher</span>
                </h3>
                <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">
                  Watches repository commits, auto-summarizes technical changes, evaluates ecosystem impact, and synthesizes follow-up tasks & brainstorming cards.
                </p>
              </div>
              
              {activeProjectId && (
                <button
                  onClick={async () => {
                    setAnalyzingCommitsId(activeProjectId);
                    try {
                      await analyzeProjectCommits(activeProjectId);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setAnalyzingCommitsId(null);
                    }
                  }}
                  disabled={analyzingCommitsId === activeProjectId}
                  className="shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {analyzingCommitsId === activeProjectId ? (
                    <>
                      <Loader2 size={11} className="animate-spin text-black" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Bot size={11} className="text-black" />
                      <span>Watch & Analyze Commits</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Timelines content */}
            {(() => {
              const activeProj = projects.find(p => p.id === activeProjectId);
              const analyzed = activeProj?.analyzedCommits || [];
              
              if (!activeProj) {
                return (
                  <div className="text-center py-6 text-zinc-500 text-xs border border-dashed border-zinc-850 rounded-lg">
                    Select a project above to view and watch its code repository commit streams.
                  </div>
                );
              }

              if (analyzed.length === 0) {
                return (
                  <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800/80 rounded-lg bg-zinc-950/20 space-y-2">
                    <p className="italic">No commits have been analyzed yet for "{activeProj.name}".</p>
                    <p className="text-[10px] text-zinc-500 max-w-sm mx-auto">
                      Click the "Watch & Analyze Commits" button to run an incremental scan with Gemini 3.5 Flash on your latest commits!
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3.5 pt-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                  {analyzed.map((ac, idx) => {
                    const impactColors: Record<string, string> = {
                      High: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                      Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    };
                    const impactBadge = impactColors[ac.impact || "Low"] || impactColors.Low;

                    return (
                      <motion.div
                        key={ac.sha}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg hover:border-zinc-700 hover:bg-[#18181b] transition-all space-y-2 text-left animate-in fade-in"
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 block truncate leading-normal">
                              {ac.message}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                              <span className="font-semibold text-zinc-400">{ac.author}</span>
                              <span>•</span>
                              <span>{ac.date ? new Date(ac.date).toLocaleDateString() : "Just now"}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase font-mono ${impactBadge}`}>
                              {ac.impact || "Low"} Impact
                            </span>
                            <span className="font-mono text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded">
                              {ac.sha.substring(0, 7)}
                            </span>
                          </div>
                        </div>

                        {ac.summary && (
                          <div className="p-2.5 bg-[#09090b] rounded-lg border border-zinc-900 text-[10px] text-zinc-350 leading-relaxed font-sans">
                            <span className="text-yellow-400 font-bold block mb-1">🤖 AI TECH SUMMARY:</span>
                            {ac.summary}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-900/60 text-[9px]">
                          {ac.suggestedIssueId && (
                            <span className="bg-amber-500/5 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                              🎯 Linked Issue Created
                            </span>
                          )}
                          {ac.suggestedNoteId && (
                            <span className="bg-yellow-500/5 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                              📝 Auto-Documented in Notes
                            </span>
                          )}
                          {!ac.suggestedIssueId && !ac.suggestedNoteId && (
                            <span className="text-zinc-650 font-medium">No pending followups required.</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
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
                  <Loader2 size={18} className="animate-spin text-yellow-400 mb-2" />
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
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-900 border-2 border-zinc-700 group-hover:border-yellow-400 transition-colors"></div>
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
                      <Loader2 size={16} className="animate-spin mb-2 text-yellow-400" />
                      <span className="text-xs">Fetching pull requests...</span>
                  </div>
               ) : prs.length === 0 ? (
                  <div className="text-zinc-500 text-xs text-center py-12 italic">No open Pull Requests found.</div>
               ) : prs.map((pr) => (
                  <div key={pr.id} className="p-3 bg-[#09090b] border border-zinc-850 rounded-lg group hover:border-zinc-700 transition-colors">
                     <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-2 text-left">
                           <h4 className="text-[11px] font-medium text-zinc-200 leading-snug group-hover:text-yellow-400 transition-colors">{pr.title}</h4>
                           <p className="text-[9.5px] text-zinc-500 mt-0.5">Author: {pr.author}</p>
                        </div>
                        {pr.merged || pr.status === 'closed' ? (
                           <span className="text-[9px] font-medium text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 shrink-0">Merged</span>
                        ) : (
                           <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">Open</span>
                        )}
                     </div>
                     <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-900/50 mt-1">
                       <span className="font-mono bg-zinc-950 border border-zinc-850 px-1 rounded">{pr.id}</span>
                       
                       {pr.merged || pr.status === 'closed' ? (
                          <div className="flex items-center gap-1.5 text-purple-400 font-mono text-[9.5px]">
                            <GitMerge size={12} />
                            <span>Merged ✓</span>
                          </div>
                       ) : (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-500"/>
                              <span className="text-[9.5px]">CI / OK</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptMergePR(pr.id);
                              }}
                              disabled={mergingPrId !== null}
                              className="text-[9px] font-bold text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              {mergingPrId === pr.id ? (
                                <>
                                  <Loader2 size={9} className="animate-spin" />
                                  <span>Merging...</span>
                                </>
                              ) : (
                                <>
                                  <GitMerge size={9} />
                                  <span>Accept & Merge</span>
                                </>
                              )}
                            </button>
                          </div>
                       )}
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
          <div className="border border-yellow-500/20 bg-gradient-to-br from-[#121214] to-yellow-950/10 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group">
             <div className="flex items-center justify-between mb-1">
                <div className="text-yellow-400 flex items-center gap-2 text-xs font-semibold">
                   <Bot size={14} /> Repository AI Insights
                </div>
                <button 
                  onClick={generateInsights}
                  disabled={insightGenerating || commits.length === 0}
                  className="text-[9px] uppercase tracking-wider bg-yellow-500/25 hover:bg-yellow-500/40 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  {insightGenerating ? <Loader2 size={10} className="animate-spin inline" /> : <Sparkles size={10} />}
                  <span>Analyze</span>
                </button>
             </div>
             <p className="text-[11px] text-zinc-300 leading-relaxed">
                {insightGenerating && !insightContent ? <span className="animate-pulse font-mono text-[10px]">Running Gemini analysis on commit streams...</span> : insightContent ? insightContent : 'Map codebases and click analyze to output technical lead diagnostics.'}
             </p>
          </div>

          {/* Aether Autopilot Engine Dashboard Widget */}
          <div className="border border-zinc-800 bg-[#121214] rounded-xl p-4 flex flex-col gap-3.5 relative overflow-hidden">
            {/* Top pulsing status header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  {autopilotEnabled && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${autopilotEnabled ? 'bg-yellow-500' : 'bg-zinc-600'}`}></span>
                </div>
                <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">Aether Autopilot</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-yellow-950/40 text-yellow-400 border border-yellow-900/30 px-2 py-0.5 rounded uppercase">
                Active 24/7 Engine
              </span>
            </div>

            <p className="text-[10px] text-zinc-500 leading-relaxed">
              When enabled, Aether watches for approved workspace brainstorm ideas and features. It automatically synthesizes production-grade code via Gemini and pushes updates directly onto your GitHub repository.
            </p>

            {/* Toggle switch row */}
            <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-lg border border-zinc-900">
              <span className="text-[11px] font-medium text-zinc-300">Enable Autonomous Pushes</span>
              <button
                id="autopilot-toggle"
                onClick={() => saveAutopilotConfig(!autopilotEnabled, autopilotBranchMode)}
                disabled={autopilotLoading}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autopilotEnabled ? 'bg-yellow-500' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    autopilotEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Branch mode setting */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Branch Deployment Strategy</label>
              <select
                id="autopilot-branch-mode"
                value={autopilotBranchMode}
                onChange={(e) => saveAutopilotConfig(autopilotEnabled, e.target.value as any)}
                disabled={autopilotLoading}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
              >
                <option value="branch">Draft Branch + Create Pull Request (Recommended)</option>
                <option value="main">Direct Push (Commit directly to 'main' branch)</option>
              </select>
            </div>

            {/* Manual run button */}
            <button
              id="autopilot-manual-trigger"
              onClick={triggerAutopilotCycle}
              disabled={triggeringAutopilot}
              className="w-full py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              {triggeringAutopilot ? (
                <Loader2 size={12} className="animate-spin text-yellow-400" />
              ) : (
                <Sparkles size={12} className="text-yellow-400" />
              )}
              <span>Scan & Deploy Approved Features Now</span>
            </button>

            {/* Live Autopilot Terminal logs */}
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Live Console Log</label>
                <span className="text-[8px] font-mono text-zinc-600 uppercase">Engine Streams</span>
              </div>

              <div className="bg-[#09090b] border border-zinc-900 rounded-lg h-[130px] overflow-y-auto p-2.5 font-mono text-[9px] leading-relaxed flex flex-col gap-1.5 scrollbar-thin scrollbar-thumb-zinc-850">
                {autopilotLogs.length === 0 ? (
                  <div className="text-zinc-650 italic text-center py-10">
                    Console idle. Approve an idea or recommendation to trigger active deployment pipelines.
                  </div>
                ) : (
                  autopilotLogs.map((log) => {
                    let colorClass = "text-zinc-400";
                    let icon = "⚙";
                    if (log.type === "success") {
                      colorClass = "text-emerald-400 font-semibold";
                      icon = "✓";
                    } else if (log.type === "error") {
                      colorClass = "text-rose-400 font-semibold animate-pulse";
                      icon = "✗";
                    } else if (log.type === "warn") {
                      colorClass = "text-amber-400";
                      icon = "⚠";
                    } else if (log.type === "info") {
                      colorClass = "text-yellow-400";
                      icon = "⚡";
                    }

                    return (
                      <div key={log.id} className={`flex items-start gap-1.5 ${colorClass}`}>
                        <span className="text-zinc-600 shrink-0 font-sans select-none">[{log.time}]</span>
                        <span className="shrink-0 select-none">{icon}</span>
                        <span className="break-words flex-1">{log.text}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AETHER AUTOPILOT SUB-DASHBOARD with VISUAL TIMELINE & RECURRING SCHEDULER */}
            <div className="border-t border-zinc-850 pt-4 flex flex-col gap-3">
              {/* Tab Switcher Headers */}
              <div className="flex border-b border-zinc-900 p-0.5 bg-zinc-950/60 rounded-lg">
                <button
                  onClick={() => setAutopilotTab('queue')}
                  className={`flex-1 py-1.5 px-2.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    autopilotTab === 'queue'
                      ? 'bg-zinc-900 text-yellow-400 shadow-sm border border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Layers size={11} />
                  <span>Timeline Queue ({autopilotQueue.length})</span>
                </button>
                <button
                  onClick={() => setAutopilotTab('recurring')}
                  className={`flex-1 py-1.5 px-2.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    autopilotTab === 'recurring'
                      ? 'bg-zinc-900 text-yellow-400 shadow-sm border border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Clock size={11} />
                  <span>Recurring Tasks ({recurringTasks.length})</span>
                </button>
                <button
                  onClick={() => setAutopilotTab('webhooks')}
                  className={`flex-1 py-1.5 px-2.5 rounded-md text-[10px] font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    autopilotTab === 'webhooks'
                      ? 'bg-zinc-900 text-yellow-400 shadow-sm border border-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Webhook size={11} />
                  <span>Webhooks ({webhooks.length})</span>
                </button>
              </div>

              {/* Tab Content 1: Visual Timeline Queue */}
              {autopilotTab === 'queue' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Live Queue Pipeline
                    </span>
                    {autopilotQueue.length > 0 && (
                      <button
                        onClick={handleClearQueue}
                        className="text-[9px] text-zinc-500 hover:text-zinc-300 font-medium transition cursor-pointer"
                      >
                        Clear Finished
                      </button>
                    )}
                  </div>

                  {/* HIGH-FIDELITY VISUAL TIMELINE */}
                  <div className="relative flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-850">
                    {autopilotQueue.length === 0 ? (
                      <div className="text-[10px] text-zinc-650 italic text-center py-10 bg-zinc-950/20 rounded-lg border border-zinc-900/40 flex flex-col items-center gap-2">
                        <Layers size={20} className="text-zinc-700" />
                        <span>No GitHub actions currently in the workspace pipeline. Add a custom task or approve recommendation models below to trigger deployment.</span>
                      </div>
                    ) : (
                      <div className="relative pl-3">
                        {/* Timeline vertical axis line */}
                        <div className="absolute left-6 top-2 bottom-6 w-0.5 border-l border-zinc-800 border-dashed z-0" />

                        <div className="space-y-4">
                          {autopilotQueue.map((item, idx) => {
                            const isWorking = item.status === 'working';
                            const isQueued = item.status === 'queued';
                            const isCompleted = item.status === 'completed';
                            const isFailed = item.status === 'failed';

                            return (
                              <div key={item.id} className="relative flex gap-4 z-10 group/item">
                                {/* Left side timeline node indicator */}
                                <div className="flex flex-col items-center shrink-0">
                                  <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all border ${
                                    isWorking
                                      ? 'bg-blue-950 border-blue-500 shadow-md shadow-blue-500/20 ring-4 ring-blue-500/10'
                                      : isCompleted
                                      ? 'bg-emerald-950 border-emerald-500 shadow-sm shadow-emerald-500/10'
                                      : isFailed
                                      ? 'bg-rose-950 border-rose-500'
                                      : 'bg-zinc-950 border-zinc-850'
                                  }`}>
                                    {isWorking ? (
                                      <Loader2 size={11} className="animate-spin text-blue-400" />
                                    ) : isCompleted ? (
                                      <CheckCircle2 size={11} className="text-emerald-400" />
                                    ) : isFailed ? (
                                      <XCircle size={11} className="text-rose-400" />
                                    ) : (
                                      <span className="text-[9px] font-bold text-zinc-500 font-mono">
                                        {idx + 1}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Timeline task body panel */}
                                <div className={`flex-1 p-3 rounded-xl border text-xs transition-all flex flex-col gap-2 ${
                                  isWorking
                                    ? 'bg-[#141824] border-blue-900/60 shadow-lg shadow-blue-950/20'
                                    : isQueued
                                    ? 'bg-zinc-900/30 border-zinc-850 hover:border-zinc-800'
                                    : isCompleted
                                    ? 'bg-emerald-950/5 border-emerald-900/15'
                                    : 'bg-rose-950/5 border-rose-900/15'
                                }`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`font-bold truncate ${
                                          isWorking ? 'text-blue-200' : isCompleted ? 'text-zinc-300' : 'text-zinc-400'
                                        }`}>{item.title}</span>
                                        {item.type === 'recurring' && (
                                          <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                                            ⏰ Recurring
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[9px] text-zinc-500 truncate">Project Workspace: {item.projectName}</span>
                                      {item.details && (
                                        <p className="text-[9px] text-zinc-400 line-clamp-2 mt-0.5 bg-zinc-950/30 p-1.5 rounded leading-relaxed border border-zinc-900/50">
                                          {item.details}
                                        </p>
                                      )}
                                    </div>

                                    {/* Action context button / status badge */}
                                    {isQueued && (
                                      <button
                                        onClick={() => handleRemoveQueueItem(item.id)}
                                        className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition shrink-0"
                                        title="Cancel queued task"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    )}
                                    {isFailed && (
                                      <button
                                        onClick={() => handleRemoveQueueItem(item.id)}
                                        className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition shrink-0"
                                        title="Dismiss failure"
                                      >
                                        <X size={11} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Dynamic progress bar and step trackers for working pipeline */}
                                  {isWorking && (
                                    <div className="flex flex-col gap-2 mt-1">
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-blue-300 font-semibold truncate max-w-[160px] animate-pulse">
                                          {item.currentStep || 'Analyzing workspace...'}
                                        </span>
                                        <span className="text-blue-400 font-mono font-black shrink-0 bg-blue-950/40 border border-blue-900/30 px-1 rounded">
                                          {item.progress || 15}%
                                        </span>
                                      </div>

                                      {/* Bar with gradient shimmer */}
                                      <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/80 relative">
                                        <div
                                          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                          style={{ width: `${item.progress || 15}%` }}
                                        />
                                      </div>

                                      {/* Completion timer estimate */}
                                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-medium">
                                        <Clock size={11} className="text-blue-400/80" />
                                        <span>Guesstimate Completion:</span>
                                        <span className="font-mono text-blue-300 font-extrabold bg-blue-950/20 border border-blue-900/10 px-1 rounded animate-pulse">
                                          {item.guesstimateTimer && item.guesstimateTimer > 0
                                            ? `~${item.guesstimateTimer}s remaining`
                                            : 'Executing final push stages...'}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Queued indicator */}
                                  {isQueued && (
                                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 mt-1">
                                      <Clock size={10} className="text-zinc-600" />
                                      <span>Est. Processing Duration: ~45 seconds</span>
                                    </div>
                                  )}

                                  {/* Failure diagnostics */}
                                  {isFailed && item.error && (
                                    <div className="p-2 bg-rose-950/10 border border-rose-900/20 rounded-md mt-0.5">
                                      <span className="text-[9px] text-rose-400 leading-relaxed block italic">
                                        Deployment Error: {item.error}
                                      </span>
                                    </div>
                                  )}

                                  {/* PR Link details */}
                                  {isCompleted && (
                                    <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-1">
                                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Simulated Push Completed
                                      </span>
                                      {item.prUrl && (
                                        <a
                                          href={item.prUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-bold font-mono text-[9px]"
                                        >
                                          <GitPullRequest size={10} />
                                          <span>Pull Request</span>
                                        </a>
                                      )}
                                    </div>
                                  )}

                                  {/* Granular details revealed on hover with premium transition */}
                                  <div className="mt-1 border-t border-zinc-900/60 pt-2 flex flex-col gap-2 overflow-hidden max-h-0 opacity-0 group-hover/item:max-h-[140px] group-hover/item:opacity-100 transition-all duration-300 ease-out select-text">
                                    <div className="grid grid-cols-2 gap-2.5 text-left">
                                      <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                                          <GitBranch size={10} className="text-blue-500/80" /> Active Branch
                                        </span>
                                        <span className="font-mono text-[9px] text-blue-400 bg-blue-950/20 border border-blue-900/30 px-1.5 py-0.5 rounded truncate select-all" title={item.gitBranch || 'aether-auto-patch'}>
                                          {item.gitBranch || (isWorking ? 'Determining...' : 'aether-auto-patch')}
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase font-mono tracking-wider flex items-center gap-1">
                                          <BookMarked size={10} className="text-indigo-500/80" /> Target Files
                                        </span>
                                        <div className="flex flex-col gap-1 max-h-[55px] overflow-y-auto custom-scrollbar">
                                          {item.modifiedFiles && item.modifiedFiles.length > 0 ? (
                                            item.modifiedFiles.map((file: string, fIdx: number) => (
                                              <span key={fIdx} className="font-mono text-[8px] text-zinc-350 bg-zinc-950/50 border border-zinc-900 px-1.5 py-0.5 rounded truncate select-all" title={file}>
                                                {file.split('/').pop()}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="font-mono text-[8px] text-zinc-500 italic px-1">
                                              {isWorking ? 'Synthesizing...' : 'patch-report.md'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual Quick Add Queue Form */}
                  <form onSubmit={handleAddAutopilotQueue} className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-2.5 flex flex-col gap-2 mt-2">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Enqueue Custom Autopilot Task</span>

                    <div className="flex gap-1.5">
                      <select
                        value={newQueueProjId}
                        onChange={(e) => setNewQueueProjId(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-300 outline-none focus:border-zinc-700"
                      >
                        <option value="">-- Project Scope --</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      <input
                        type="text"
                        required
                        placeholder="Task title (e.g. Add dark mode toggle)"
                        value={newQueueTitle}
                        onChange={(e) => setNewQueueTitle(e.target.value)}
                        className="flex-[2] bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                      />
                    </div>

                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        placeholder="Instructions / prompt details for code synthesis..."
                        value={newQueueDetails}
                        onChange={(e) => setNewQueueDetails(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                      />
                      <button
                        type="submit"
                        disabled={queuingTask || !newQueueTitle.trim()}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus size={10} />
                        <span>Queue</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab Content 2: Recurring GitHub Task Scheduler */}
              {autopilotTab === 'recurring' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Scheduled Recurring Tasks
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600">
                      Evaluated on push cycles
                    </span>
                  </div>

                  {/* Manual Recurring setup form */}
                  <form onSubmit={handleAddRecurringTask} className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-3 flex flex-col gap-2.5">
                    <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1">
                      <Clock size={11} className="text-blue-400" />
                      <span>Setup New Recurring Task</span>
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Associate Project</label>
                        <select
                          value={newRecProjId}
                          onChange={(e) => setNewRecProjId(e.target.value)}
                          className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-300 outline-none focus:border-zinc-700"
                        >
                          <option value="">-- Project --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Execution Interval</label>
                        <select
                          value={newRecInterval}
                          onChange={(e) => setNewRecInterval(e.target.value)}
                          className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-300 outline-none focus:border-zinc-700"
                        >
                          <option value="5">Every 5 Minutes (Fast Check)</option>
                          <option value="15">Every 15 Minutes</option>
                          <option value="30">Every 30 Minutes</option>
                          <option value="60">Every 1 Hour (Hourly)</option>
                          <option value="360">Every 6 Hours</option>
                          <option value="720">Every 12 Hours</option>
                          <option value="1440">Every 24 Hours (Daily)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Task Title / Work Order</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Codebase Health Check & Docs build"
                        value={newRecTitle}
                        onChange={(e) => setNewRecTitle(e.target.value)}
                        className="bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1 text-[10px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Detailed Synthesis Prompt</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Scrapes repository imports, corrects absolute path resolutions, and updates markdown documentation files to represent changes."
                        value={newRecDetails}
                        onChange={(e) => setNewRecDetails(e.target.value)}
                        className="bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingRecurring || !newRecTitle.trim()}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {creatingRecurring ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Plus size={11} />
                      )}
                      <span>Create & Schedule Recurring Task</span>
                    </button>
                  </form>

                  {/* List of active scheduled tasks */}
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-850 pr-1">
                    {recurringTasks.length === 0 ? (
                      <div className="text-[10px] text-zinc-650 italic text-center py-8 bg-zinc-950/20 rounded-lg border border-zinc-900/40">
                        No recurring GitHub tasks currently scheduled. Setup a schedule above.
                      </div>
                    ) : (
                      recurringTasks.map((task) => {
                        const intervalText =
                          task.intervalMinutes >= 1440
                            ? 'Daily'
                            : task.intervalMinutes >= 60
                            ? `Every ${Math.round(task.intervalMinutes / 60)}h`
                            : `Every ${task.intervalMinutes}m`;

                        const relativeLastTrigger = task.lastTriggeredAt
                          ? `Last run: ${new Date(task.lastTriggeredAt).toLocaleTimeString()}`
                          : 'Pending first trigger';

                        return (
                          <div
                            key={task.id}
                            className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1.5 transition-all bg-zinc-900/40 border-zinc-850 hover:border-zinc-800 ${
                              !task.enabled ? 'opacity-60' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-bold text-zinc-200 truncate">{task.title}</span>
                                <span className="text-[9px] text-zinc-500 truncate">Scope: {task.projectName}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Toggle Switch */}
                                <button
                                  onClick={() => handleToggleRecurringTask(task.id, task.enabled)}
                                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    task.enabled ? 'bg-blue-600' : 'bg-zinc-800'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      task.enabled ? 'translate-x-3' : 'translate-x-0'
                                    }`}
                                  />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteRecurringTask(task.id)}
                                  className="text-zinc-650 hover:text-rose-400 p-0.5 transition"
                                  title="Delete schedule"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>

                            {task.details && (
                              <p className="text-[9.5px] text-zinc-400 line-clamp-1 leading-relaxed italic">
                                "{task.details}"
                              </p>
                            )}

                            <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-1 pt-1.5 border-t border-zinc-950">
                              <span className="font-mono text-blue-400 font-bold bg-blue-950/40 border border-blue-900/30 px-1.5 rounded uppercase text-[8px]">
                                {intervalText}
                              </span>
                              <span>{relativeLastTrigger}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {autopilotTab === 'webhooks' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
                  {/* Webhook Header & Endpoint info */}
                  <div className="bg-[#07070a] border border-zinc-900 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <Webhook size={13} className="text-blue-400" /> Webhook Receiver Node
                        </span>
                        <p className="text-[9px] text-zinc-500 leading-normal">
                          Provide this live payload URL inside your GitHub repository settings to route real-time hooks into your workspace.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 font-mono">
                      <div className="flex justify-between items-center text-[8px] text-zinc-550 uppercase font-bold tracking-wider">
                        <span>Local Endpoint URL</span>
                        <span className="text-blue-500/80">Active Listening Node</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-[9px] text-zinc-350 select-all truncate flex-1 leading-none py-1">
                          {window.location.origin}/api/github/webhook
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/api/github/webhook`);
                            alert("Copied Payload URL to clipboard!");
                          }}
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-750 text-[8px] text-zinc-400 hover:text-zinc-200 font-bold rounded transition cursor-pointer shrink-0 uppercase font-sans"
                        >
                          Copy URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Webhooks subtab selection */}
                  <div className="flex gap-2 border-b border-zinc-900 pb-2">
                    <button
                      type="button"
                      onClick={() => setWebhookSubTab('config')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition cursor-pointer ${
                        webhookSubTab === 'config'
                          ? 'bg-zinc-900 text-blue-400 border border-zinc-800/80 font-mono'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Configure & Subscriptions
                    </button>
                    <button
                      type="button"
                      onClick={() => setWebhookSubTab('simulate')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition cursor-pointer ${
                        webhookSubTab === 'simulate'
                          ? 'bg-zinc-900 text-purple-400 border border-zinc-800/80 font-mono'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      ⚡ High-Fidelity Simulator
                    </button>
                  </div>

                  {/* SUB TAB A: CONFIGURE WEBHOOKS & LIST */}
                  {webhookSubTab === 'config' && (
                    <div className="flex flex-col gap-3">
                      {/* Webhook Add Form */}
                      <form onSubmit={handleCreateWebhook} className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-3 flex flex-col gap-2.5">
                        <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-1.5 font-mono">
                          <Plus size={11} className="text-blue-400" /> Setup Repository Webhook
                        </span>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Target Repository Path</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. google/genai-js"
                            value={newWebhookRepo}
                            onChange={(e) => setNewWebhookRepo(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1 text-[10px] text-zinc-205 placeholder-zinc-650 outline-none focus:border-zinc-700 font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Payload Secret Key (Optional Verification)</label>
                          <input
                            type="password"
                            placeholder="e.g. ghp_sec_verify_2026_xyz"
                            value={newWebhookSecret}
                            onChange={(e) => setNewWebhookSecret(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1 text-[10px] text-zinc-205 placeholder-zinc-650 outline-none focus:border-zinc-700 font-mono"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Event Subscriptions</label>
                          <div className="flex items-center gap-4 py-1">
                            <label className="flex items-center gap-1.5 text-[9px] text-zinc-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={newWebhookEvents.includes('issues')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewWebhookEvents(prev => [...prev, 'issues']);
                                  } else {
                                    setNewWebhookEvents(prev => prev.filter(x => x !== 'issues'));
                                  }
                                }}
                                className="rounded border-zinc-800 bg-zinc-900 text-blue-600 focus:ring-0 cursor-pointer"
                              />
                              <span>issues (Issue Labels / Events)</span>
                            </label>

                            <label className="flex items-center gap-1.5 text-[9px] text-zinc-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={newWebhookEvents.includes('pull_request')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewWebhookEvents(prev => [...prev, 'pull_request']);
                                  } else {
                                    setNewWebhookEvents(prev => prev.filter(x => x !== 'pull_request'));
                                  }
                                }}
                                className="rounded border-zinc-800 bg-zinc-900 text-blue-600 focus:ring-0 cursor-pointer"
                              />
                              <span>pull_request (PR Actions)</span>
                            </label>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isCreatingWebhook || !newWebhookRepo.trim()}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                        >
                          {isCreatingWebhook ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Plus size={11} />
                          )}
                          <span>Bind Real-Time Webhook Listener</span>
                        </button>
                      </form>

                      {/* Webhook list */}
                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-850 pr-1">
                        {webhooks.length === 0 ? (
                          <div className="text-[10px] text-zinc-650 italic text-center py-8 bg-zinc-950/20 rounded-lg border border-zinc-900/40">
                            No webhooks registered yet. Configure one above or trigger via simulator.
                          </div>
                        ) : (
                          webhooks.map((hook) => {
                            const lastTriggeredText = hook.lastTriggeredAt
                              ? `Last trigger: ${new Date(hook.lastTriggeredAt).toLocaleTimeString()}`
                              : 'No activity registered';

                            return (
                              <div
                                key={hook.id}
                                className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1.5 transition-all bg-zinc-900/40 border-zinc-850 hover:border-zinc-800 ${
                                  !hook.active ? 'opacity-60' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="font-bold text-zinc-200 truncate font-mono">{hook.repo}</span>
                                    <span className="text-[8px] text-zinc-500 truncate">Events: {hook.events.join(', ')}</span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => handleToggleWebhook(hook.id)}
                                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        hook.active ? 'bg-blue-600' : 'bg-zinc-800'
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                          hook.active ? 'translate-x-3' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteWebhook(hook.id)}
                                      className="text-zinc-650 hover:text-rose-400 p-0.5 transition cursor-pointer"
                                      title="Remove webhook"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center text-[9px] text-zinc-500 mt-1 pt-1.5 border-t border-zinc-950">
                                  <span className="font-mono text-zinc-400 text-[8px]">
                                    {hook.secret ? '🔒 Signature verification active' : '🔓 Unsigned payload mode'}
                                  </span>
                                  <span>{lastTriggeredText}</span>
                                </div>

                                {/* Webhook Trigger Logs */}
                                {hook.logs && hook.logs.length > 0 && (
                                  <div className="mt-1.5 bg-zinc-950/80 rounded border border-zinc-900/60 p-1.5 max-h-[80px] overflow-y-auto scrollbar-thin text-left">
                                    <span className="text-[8px] text-zinc-550 font-bold uppercase tracking-wider block mb-1 font-mono">Payload Execution Stream</span>
                                    <div className="flex flex-col gap-1">
                                      {hook.logs.map((log: any) => (
                                        <div key={log.id} className="text-[8px] font-mono flex items-start justify-between gap-2 border-b border-zinc-900/40 pb-1 last:border-0">
                                          <span className="text-blue-400">[{log.time}] {log.event}:{log.action}</span>
                                          <span className="text-zinc-400 truncate max-w-[120px]">{log.payloadSummary}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB TAB B: SIMULATOR SANDBOX */}
                  {webhookSubTab === 'simulate' && (
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-3 flex flex-col gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wide flex items-center gap-1.5 font-mono">
                          <Webhook size={11} className="text-purple-400 animate-pulse" /> GitHub Webhook Simulator
                        </span>
                        <p className="text-[9px] text-zinc-500">
                          Dispatches simulated webhook payloads straight to the local API receptor to check triggers instantly.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Simulate Event Type</label>
                          <select
                            value={simEvent}
                            onChange={(e) => {
                              const val = e.target.value as 'issues' | 'pull_request';
                              setSimEvent(val);
                              setSimAction(val === 'issues' ? 'opened' : 'opened');
                            }}
                            className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-350 outline-none focus:border-zinc-700"
                          >
                            <option value="issues">issues (Bug / Issue / Task)</option>
                            <option value="pull_request">pull_request (PR Code Sync)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Simulate Action Type</label>
                          <select
                            value={simAction}
                            onChange={(e) => setSimAction(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-350 outline-none focus:border-zinc-700"
                          >
                            {simEvent === 'issues' ? (
                              <>
                                <option value="opened">opened (New Task Raised)</option>
                                <option value="labeled">labeled (Assigned Category)</option>
                                <option value="closed">closed</option>
                              </>
                            ) : (
                              <>
                                <option value="opened">opened (New PR Pending Audit)</option>
                                <option value="synchronize">synchronize (Pushed New Code Update)</option>
                                <option value="merged">merged</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Dynamic form inputs based on event type */}
                      {simEvent === 'issues' ? (
                        <div className="space-y-2 border-t border-zinc-900/60 pt-2.5">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Issue Title</label>
                            <input
                              type="text"
                              required
                              value={simIssueTitle}
                              onChange={(e) => setSimIssueTitle(e.target.value)}
                              className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                              placeholder="e.g. Memory leak in WebSockets container"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Description / Markdown Payload</label>
                            <textarea
                              rows={2}
                              value={simIssueBody}
                              onChange={(e) => setSimIssueBody(e.target.value)}
                              className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-200 outline-none focus:border-zinc-700 resize-none"
                              placeholder="Provide details..."
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Issue Labels (comma separated)</label>
                            <input
                              type="text"
                              value={simIssueLabels}
                              onChange={(e) => setSimIssueLabels(e.target.value)}
                              className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-200 outline-none focus:border-zinc-700 font-mono text-[9px]"
                              placeholder="e.g. aether-autopilot, bug, high-priority"
                            />
                            <p className="text-[8px] text-zinc-650 mt-1">
                              Tip: Labels containing <span className="text-blue-400 font-semibold font-mono">"aether-autopilot"</span>, <span className="text-emerald-400 font-semibold font-mono">"bug"</span>, or <span className="text-amber-400 font-semibold font-mono">"feature"</span> trigger the AI Agent automatically!
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 border-t border-zinc-900/60 pt-2.5">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Pull Request Title</label>
                            <input
                              type="text"
                              required
                              value={simPrTitle}
                              onChange={(e) => setSimPrTitle(e.target.value)}
                              className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                              placeholder="e.g. feat: Add multi-user canvas sharing state"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Pull Request Branch</label>
                            <input
                              type="text"
                              value={simPrBranch}
                              onChange={(e) => setSimPrBranch(e.target.value)}
                              className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-200 outline-none focus:border-zinc-700 font-mono text-[9px]"
                              placeholder="e.g. canvas-sharing-engine"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">Description / Proposed Changes</label>
                            <textarea
                              rows={2}
                              value={simPrBody}
                              onChange={(e) => setSimPrBody(e.target.value)}
                              className="bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-[10px] text-zinc-200 outline-none focus:border-zinc-700 resize-none"
                              placeholder="Describe pull request changes..."
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSimulateWebhook}
                        disabled={simulatingWebhook}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-1 font-sans"
                      >
                        {simulatingWebhook ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Webhook size={12} />
                        )}
                        <span>Dispatch Live Mock Payload to listening node</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                  className="mt-4 w-full py-2 bg-[#2ea043] hover:bg-[#2c974b] disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow cursor-pointer"
               >
                  {loggingIn ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
                  <span>Sign in with GitHub OAuth</span>
               </button>

               <button 
                  onClick={() => {
                    setGithubUser('google-developer');
                    setGithubToken('mock_oauth_token_7db2');
                    setGithubProfile({ photoURL: 'https://api.dicebear.com/7.x/identicon/svg?seed=google-developer' });
                    setFetchedRepos([
                      { id: 101, name: 'agentic-os', full_name: 'google-developer/agentic-os', description: 'Advanced AI-led operating system workspace' },
                      { id: 102, name: 'workspace-sync', full_name: 'google-developer/workspace-sync', description: 'Real-time Google Workspace integration hub' },
                      { id: 103, name: 'lunar-landing', full_name: 'google-developer/lunar-landing', description: 'Interactive visual physics simulation canvas' }
                    ]);
                    showToast('Connected to GitHub sandbox mockup account!', 'success');
                  }}
                  className="mt-2 w-full py-2 bg-[#1c1c1e] hover:bg-zinc-800 text-zinc-300 rounded-md text-xs font-semibold border border-zinc-800 transition-colors flex items-center justify-center gap-2 shadow cursor-pointer"
               >
                  <Github size={14} className="text-emerald-450" />
                  <span>Connect Mockup Account (Instant Sandbox)</span>
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
                            className={`flex items-center justify-between p-3 rounded-lg bg-zinc-950/30 border transition-colors ${matchesSelected ? 'bg-blue-950/20 border-blue-500/25' : 'border-zinc-900/60 hover:border-zinc-850 hover:bg-zinc-900/30'}`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1 pr-2 text-left">
                               <BookMarked size={16} className={`shrink-0 mt-0.5 ${matchesSelected ? 'text-blue-400' : 'text-zinc-500'}`} />
                               <div className="min-w-0 text-left">
                                 <div className={`text-xs font-medium truncate ${matchesSelected ? 'text-blue-400' : 'text-zinc-200'}`}>{r.full_name}</div>
                                 <div className="text-[10px] text-zinc-500 mt-0.5 truncate leading-tight">{r.description || 'No description provided.'}</div>
                               </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                               <button 
                                 onClick={() => { setRepo(r.full_name); setShowRepoModal(false); }}
                                 className="text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 font-medium px-2.5 py-1.5 rounded transition-colors text-zinc-300"
                               >
                                  {matchesSelected ? 'Selected' : 'Select'}
                               </button>
                               <button 
                                 onClick={() => {
                                   try {
                                     const newProjId = addProject({
                                       name: r.name,
                                       description: r.description || `Autonomous monitoring of GitHub repository ${r.full_name}`,
                                       status: 'Active',
                                       githubRepos: [r.full_name]
                                     });
                                     showToast(`🚀 Mapped Project "${r.name}" successfully created! You can now assign AI agents.`, 'success');
                                     setRepo(r.full_name);
                                     setShowRepoModal(false);
                                   } catch (err) {
                                     console.error(err);
                                     showToast('Failed to instantiate new project framework', 'error');
                                   }
                                 }}
                                 className="text-[10px] bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/10 font-bold px-2.5 py-1.5 rounded transition-colors text-white flex items-center gap-1 shadow-md shadow-emerald-950/20"
                               >
                                  <span>+ Create Project</span>
                               </button>
                            </div>
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
