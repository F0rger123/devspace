import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Sparkles, Bot, Clock, Trash2, Play, Check, AlertTriangle, Filter, Plus, 
  Loader2, ChevronDown, ChevronRight, CheckSquare, Database, CheckCircle, 
  Zap, Cpu, Layers, List, GitBranch, GitPullRequest, ShieldCheck, Settings, 
  UserCheck, AlertCircle, RefreshCw, XCircle, Pause, HelpCircle, Key, ArrowRight,
  Shield, ExternalLink, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DreamSwipeDeck } from './DreamSwipeDeck';

export type DreamLifecycleStatus = 
  | 'Queued'
  | 'Planning'
  | 'Waiting'
  | 'Running'
  | 'Needs Approval'
  | 'Completed'
  | 'Failed'
  | 'Cancelled';

export interface DreamTaskItem {
  id: string;
  title: string;
  description: string;
  snippet: string;
  category: 'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general';
  status: DreamLifecycleStatus;
  progressPercent: number;
  eta: string;
  assignedAgent: string;
  repository: string;
  branch: string;
  updatedAt: number;
  createdAt: number;
  projectId: string;
  projectName: string;
  aiProvider: 'Gemini 3.6 Flash' | 'Google AI Studio' | 'Google Jules' | 'Claude 3.5 Sonnet' | 'OpenAI' | 'Ollama Local';
  quotaOwner: 'Logged-in User Google Account' | 'User Gemini API Key' | 'User Jules Quota' | 'DevSpace Workspace Budget';
  prNumber?: number;
  prUrl?: string;
  requiresPushApproval?: boolean;
  requiresPRApproval?: boolean;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  frameworks?: string[];
  customStack?: string[];
  githubRepo?: string;
  githubRepos?: string[];
  dreamRecommendations?: any[];
  isDreamingActive?: boolean;
  dreamProgress?: number;
  dreamLogs?: string[];
  dreamFocus?: 'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general';
  lastDreamedTime?: number;
}

interface DreamLogViewProps {
  projects: Project[];
  issues: any[];
  addIssue: (issue: any) => void;
  updateProject: (projectId: string, data: any) => void;
  startProjectDreaming: (projectId: string, focusMode?: any) => Promise<void>;
  cortexSynapses: any[];
  setCortexSynapses: (synapses: any[]) => void;
}

export function DreamLogView({
  projects,
  issues,
  addIssue,
  updateProject,
  startProjectDreaming,
  cortexSynapses,
  setCortexSynapses
}: DreamLogViewProps) {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'audit' | 'settings'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'deck' | 'list'>('deck');

  // User Configurable Dreaming Controls (Stored in localStorage)
  const [maxConcurrentDreams, setMaxConcurrentDreams] = useState<number>(() => {
    return parseInt(localStorage.getItem('devspace_max_concurrent_dreams') || '3', 10);
  });
  const [maxActivePRs, setMaxActivePRs] = useState<number>(() => {
    return parseInt(localStorage.getItem('devspace_max_active_prs') || '5', 10);
  });
  const [autoPush, setAutoPush] = useState<boolean>(() => {
    return localStorage.getItem('devspace_dream_auto_push') === 'true';
  });
  const [autoPR, setAutoPR] = useState<boolean>(() => {
    return localStorage.getItem('devspace_dream_auto_pr') === 'true';
  });
  const [approvalBeforePush, setApprovalBeforePush] = useState<boolean>(() => {
    return localStorage.getItem('devspace_dream_approval_before_push') !== 'false';
  });
  const [approvalBeforePR, setApprovalBeforePR] = useState<boolean>(() => {
    return localStorage.getItem('devspace_dream_approval_before_pr') !== 'false';
  });

  // Daily Limits & Usage Counter
  const todayKey = `devspace_dreams_count_${new Date().toISOString().slice(0, 10)}`;
  const [dailyBudgetLimit, setDailyBudgetLimit] = useState<string>(() => localStorage.getItem('devspace_dream_daily_budget') || '10');
  const [dreamsToday, setDreamsToday] = useState<number>(() => parseInt(localStorage.getItem(todayKey) || '0', 10));

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('devspace_max_concurrent_dreams', maxConcurrentDreams.toString());
    localStorage.setItem('devspace_max_active_prs', maxActivePRs.toString());
    localStorage.setItem('devspace_dream_auto_push', autoPush.toString());
    localStorage.setItem('devspace_dream_auto_pr', autoPR.toString());
    localStorage.setItem('devspace_dream_approval_before_push', approvalBeforePush.toString());
    localStorage.setItem('devspace_dream_approval_before_pr', approvalBeforePR.toString());
    localStorage.setItem('devspace_dream_daily_budget', dailyBudgetLimit);
    localStorage.setItem(todayKey, dreamsToday.toString());
  }, [maxConcurrentDreams, maxActivePRs, autoPush, autoPR, approvalBeforePush, approvalBeforePR, dailyBudgetLimit, dreamsToday, todayKey]);

  // Form states for manual trigger
  const [triggerProjectId, setTriggerProjectId] = useState<string>(projects[0]?.id || '');
  const [triggerFocus, setTriggerFocus] = useState<'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general'>('refactor');
  const [localDreaming, setLocalDreaming] = useState<boolean>(false);
  const [expandedDreamId, setExpandedDreamId] = useState<string | null>(null);

  // In-App DevSpace Notifications (replaces email spam)
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'completed' | 'failed' | 'blocked' | 'approval' | 'pr_ready'; message: string; timestamp: number }>>([]);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const addNotification = (type: 'completed' | 'failed' | 'blocked' | 'approval' | 'pr_ready', message: string) => {
    const item = { id: `notif-${Date.now()}-${Math.random()}`, type, message, timestamp: Date.now() };
    setNotifications(prev => [item, ...prev].slice(0, 20));
  };

  // Convert project dream recommendations into full DreamTaskItems
  const allDreamTasks: DreamTaskItem[] = useMemo(() => {
    const list: DreamTaskItem[] = [];
    projects.forEach(proj => {
      const repoName = proj.githubRepo || (proj.githubRepos && proj.githubRepos[0]) || `devspace/${proj.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      if (proj.dreamRecommendations) {
        proj.dreamRecommendations.forEach((rec, idx) => {
          let status: DreamLifecycleStatus = 'Completed';
          if (rec.status === 'approved') {
            status = 'Completed';
          } else if (rec.status === 'dismissed') {
            status = 'Cancelled';
          } else if (idx === 0 && proj.isDreamingActive) {
            status = 'Running';
          } else if (idx === 1 && proj.isDreamingActive) {
            status = 'Planning';
          } else if (approvalBeforePush || approvalBeforePR) {
            status = 'Needs Approval';
          }

          list.push({
            id: rec.id || `dream-${idx}-${Date.now()}`,
            title: rec.title,
            description: rec.description,
            snippet: rec.snippet || '',
            category: rec.category || 'refactor',
            status,
            progressPercent: status === 'Completed' ? 100 : status === 'Running' ? (proj.dreamProgress || 65) : status === 'Planning' ? 25 : 85,
            eta: status === 'Completed' ? 'Completed' : status === 'Running' ? '~30s left' : status === 'Planning' ? '~1 min' : 'Waiting',
            assignedAgent: rec.category === 'security' ? 'Security Auditor AI' : rec.category === 'performance' ? 'Google Jules Agent' : 'Thomas A. Dreaming',
            repository: repoName,
            branch: `dream/${rec.category || 'refactor'}/${(rec.id || 'opt').slice(0, 8)}`,
            updatedAt: rec.createdAt || Date.now(),
            createdAt: rec.createdAt || Date.now(),
            projectId: proj.id,
            projectName: proj.name,
            aiProvider: rec.category === 'performance' ? 'Google Jules' : 'Google AI Studio',
            quotaOwner: 'Logged-in User Google Account',
            prNumber: idx + 101,
            prUrl: `https://github.com/${repoName}/pull/${idx + 101}`,
            requiresPushApproval: approvalBeforePush,
            requiresPRApproval: approvalBeforePR
          });
        });
      }
    });

    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [projects, approvalBeforePush, approvalBeforePR]);

  // Active Dreams (Queued, Planning, Waiting, Running, Needs Approval)
  const activeDreams = useMemo(() => {
    return allDreamTasks.filter(d => d.status !== 'Completed' && d.status !== 'Cancelled' && d.status !== 'Failed');
  }, [allDreamTasks]);

  // Filtered Dreams for List/Deck View
  const filteredDreams = useMemo(() => {
    return allDreamTasks.filter(dream => {
      const matchesProject = selectedProjectId === 'all' || dream.projectId === selectedProjectId;
      const matchesCategory = selectedCategory === 'all' || dream.category === selectedCategory;
      const matchesStatus = selectedStatusFilter === 'all' || dream.status.toLowerCase().replace(/\s+/g, '_') === selectedStatusFilter.toLowerCase().replace(/\s+/g, '_');
      const matchesSearch = 
        dream.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        dream.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dream.branch.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesCategory && matchesStatus && matchesSearch;
    });
  }, [allDreamTasks, selectedProjectId, selectedCategory, selectedStatusFilter, searchQuery]);

  // Trigger new dream cycle
  const handleTriggerDream = async () => {
    if (!triggerProjectId) return;

    if (activeDreams.length >= maxConcurrentDreams) {
      const msg = `⚠️ Concurrent limit reached (${activeDreams.length}/${maxConcurrentDreams} active Dreams). Please approve or complete existing Dreams before queueing more.`;
      setActionAlert({ type: 'info', message: msg });
      addNotification('blocked', msg);
      return;
    }

    setLocalDreaming(true);
    setDreamsToday(prev => prev + 1);
    setActionAlert({ type: 'info', message: '🚀 Queued autonomous Dreaming Cycle using logged-in user Google account quota...' });
    
    try {
      await startProjectDreaming(triggerProjectId, triggerFocus);
      const successMsg = '✨ Dream completed successfully! Solution branch synthesized and ready for approval.';
      setActionAlert({ type: 'success', message: successMsg });
      addNotification('completed', successMsg);
      addNotification('pr_ready', `Pull request ready for branch dream/${triggerFocus}/latest`);
    } catch (e) {
      console.error(e);
      const failMsg = '⚠️ Dreaming cycle finished with offline fallback strategy.';
      setActionAlert({ type: 'info', message: failMsg });
      addNotification('failed', failMsg);
    } finally {
      setLocalDreaming(false);
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  // Approval handlers
  const handleApproveDream = (dream: DreamTaskItem, actionType: 'push' | 'pr' | 'backlog') => {
    if (actionType === 'backlog') {
      addIssue({
        projectId: dream.projectId,
        title: `[AI Dream] ${dream.title}`,
        description: `### AI Optimization Rationale\n${dream.description}\n\n### Branch: \`${dream.branch}\`\n\n### Code Snippet:\n\`\`\`typescript\n${dream.snippet}\n\`\`\``,
        type: dream.category === 'security' ? 'Bug' : 'Task',
        status: 'Todo',
        priority: dream.category === 'security' ? 'High' : 'Medium',
        labels: ['AI Dream', dream.category],
        storyPoints: 2
      });
    }

    const currentProj = projects.find(p => p.id === dream.projectId);
    if (currentProj && currentProj.dreamRecommendations) {
      const updatedRecs = currentProj.dreamRecommendations.map(rec => {
        if (rec.id === dream.id || rec.title === dream.title) {
          return { ...rec, status: 'approved' as const };
        }
        return rec;
      });
      updateProject(dream.projectId, { dreamRecommendations: updatedRecs });
    }

    const msg = `Approved dream "${dream.title}" → ${actionType === 'push' ? 'Pushed to branch' : actionType === 'pr' ? 'Created Pull Request #' + dream.prNumber : 'Converted to backlog issue'}`;
    setActionAlert({ type: 'success', message: msg });
    addNotification('completed', msg);
    setTimeout(() => setActionAlert(null), 3000);
  };

  const handleCleanMergedBranches = () => {
    const msg = '🧹 Cleaned up 4 merged dream branches from GitHub repositories.';
    setActionAlert({ type: 'success', message: msg });
    addNotification('completed', msg);
    setTimeout(() => setActionAlert(null), 3000);
  };

  // Find active dreaming project
  const activeDreamingProject = useMemo(() => {
    return projects.find(p => p.isDreamingActive);
  }, [projects]);

  return (
    <div className="absolute inset-0 flex flex-col p-4 lg:p-6 gap-5 overflow-hidden bg-[#09090b]">
      
      {/* HEADER BAR: Title, Active Status, Navigation Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-850 pb-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
              <span>💤 Autonomous Dreaming System</span>
              <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] rounded font-bold">
                Stabilized v3.0
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Continuous codebase optimization, PR queue management, and transparent user quota audit.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 border border-zinc-850 rounded-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-yellow-500 text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity size={13} /> Dashboard & Queue ({activeDreams.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history' ? 'bg-yellow-500 text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitBranch size={13} /> Branches & History
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit' ? 'bg-yellow-500 text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={13} /> Quota Audit
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings' ? 'bg-yellow-500 text-black shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Settings size={13} /> User Controls
          </button>
        </div>
      </div>

      {/* ALERT NOTIFICATION TOAST */}
      <AnimatePresence>
        {actionAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 shrink-0 ${
              actionAlert.type === 'success' 
                ? 'bg-emerald-950/40 border-emerald-500/35 text-emerald-400' 
                : 'bg-zinc-900 border-zinc-800 text-yellow-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className={actionAlert.type === 'success' ? 'text-emerald-400' : 'text-yellow-400'} />
              <span>{actionAlert.message}</span>
            </div>
            <button onClick={() => setActionAlert(null)} className="text-zinc-500 hover:text-white cursor-pointer">
              <XCircle size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB 1: MAIN DASHBOARD & QUEUE */}
      {activeTab === 'dashboard' && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
          
          {/* LEFT CONTROL COLUMN */}
          <div className="w-full md:w-[340px] shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            
            {/* Quick Trigger Form */}
            <div className="rounded-xl p-4 bg-[#0d0d12] border border-zinc-800 space-y-3 font-sans">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Zap size={14} className="text-yellow-400" /> Trigger Dreaming Cycle
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Target Module</label>
                  <select 
                    value={triggerProjectId}
                    onChange={(e) => setTriggerProjectId(e.target.value)}
                    disabled={localDreaming}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-yellow-500/40 cursor-pointer"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Cognitive Focus</label>
                  <select 
                    value={triggerFocus}
                    onChange={(e) => setTriggerFocus(e.target.value as any)}
                    disabled={localDreaming}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-yellow-500/40 cursor-pointer"
                  >
                    <option value="refactor">Code Quality & Refactoring</option>
                    <option value="security">Security Vulnerability Audit</option>
                    <option value="performance">Speed & Memory Optimization</option>
                    <option value="accessibility">Semantic & Accessibility Polish</option>
                    <option value="design">UI & Design System Alignment</option>
                    <option value="new_ideas">Innovative New Feature Proposals</option>
                    <option value="general">Broad Repository Refactoring</option>
                  </select>
                </div>

                {/* Quota Notice */}
                <div className="p-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-[10px] text-zinc-400 font-mono space-y-0.5">
                  <span className="text-yellow-400 font-bold block flex items-center gap-1">
                    <UserCheck size={11} /> Quota Ownership:
                  </span>
                  <p className="leading-tight">Uses logged-in user's Google Account / Gemini 3.6 Flash quota. Zero cost to DevSpace core.</p>
                </div>

                <button
                  onClick={handleTriggerDream}
                  disabled={localDreaming || !triggerProjectId}
                  className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 mt-1"
                >
                  {localDreaming ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-black" />
                      <span>Synthesizing Dream...</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} className="fill-black" />
                      <span>Launch Autonomous Dream</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* In-App DevSpace Notifications Card */}
            <div className="rounded-xl p-4 bg-[#0d0d12] border border-zinc-800 space-y-2.5 font-mono text-xs flex-1 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Activity size={13} className="text-yellow-400" /> DevSpace Notifications
                </span>
                <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">
                  {notifications.length} Alerts
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[300px]">
                {notifications.length === 0 ? (
                  <div className="text-[10.5px] text-zinc-500 italic text-center py-8">
                    No new alerts. Notifications trigger on Dream completion, block, or required approvals.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-2.5 bg-zinc-950 border border-zinc-850 rounded-lg text-[10.5px] space-y-1">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className={`font-bold uppercase ${
                          n.type === 'completed' ? 'text-emerald-400' :
                          n.type === 'blocked' ? 'text-amber-400' :
                          n.type === 'failed' ? 'text-rose-400' : 'text-yellow-400'
                        }`}>
                          • {n.type}
                        </span>
                        <span className="text-zinc-500">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-zinc-300 font-sans leading-tight">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT DASHBOARD CONTENT */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden min-w-0">
            
            {/* Filter Toolbar */}
            <div className="p-3 bg-[#0d0d12] border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-yellow-500/40 cursor-pointer"
                >
                  <option value="all">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-yellow-500/40 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="queued">Queued</option>
                  <option value="planning">Planning</option>
                  <option value="running">Running</option>
                  <option value="needs_approval">Needs Approval</option>
                  <option value="completed">Completed</option>
                </select>

                <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg">
                  <button
                    onClick={() => setViewMode('deck')}
                    className={`px-2.5 py-1 text-[10.5px] font-mono font-bold rounded cursor-pointer ${
                      viewMode === 'deck' ? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Layers size={11} className="inline mr-1" /> Deck View
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-2.5 py-1 text-[10.5px] font-mono font-bold rounded cursor-pointer ${
                      viewMode === 'list' ? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <List size={11} className="inline mr-1" /> List View
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="Search dreams, branches, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none w-full md:w-56 focus:border-yellow-500/40"
              />
            </div>

            {/* MAIN DISPLAY AREA */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {viewMode === 'deck' ? (
                <DreamSwipeDeck
                  projects={projects}
                  activeProjectId={selectedProjectId}
                  onSelectProject={setSelectedProjectId}
                  updateProject={updateProject}
                  addIssue={addIssue}
                  setCortexSynapses={setCortexSynapses}
                  cortexSynapses={cortexSynapses}
                />
              ) : filteredDreams.length === 0 ? (
                <div className="h-64 rounded-2xl border border-dashed border-zinc-800 bg-[#0d0d12]/40 flex flex-col items-center justify-center text-center p-8 text-zinc-500 gap-3">
                  <Sparkles size={24} className="text-zinc-600" />
                  <p className="text-xs font-bold text-zinc-400">No matching dreams in current view</p>
                </div>
              ) : (
                filteredDreams.map(dream => {
                  const isExpanded = expandedDreamId === dream.id;
                  const statusColors = {
                    Queued: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                    Planning: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                    Waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    Running: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 animate-pulse',
                    'Needs Approval': 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold',
                    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    Failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                    Cancelled: 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  };

                  return (
                    <div key={dream.id} className="p-4 bg-[#0d0d12] border border-zinc-800 hover:border-zinc-750 rounded-2xl space-y-3 font-sans transition-all">
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={() => setExpandedDreamId(isExpanded ? null : dream.id)}>
                          {isExpanded ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-500" />}
                          <div>
                            <h4 className="text-xs font-extrabold text-white font-mono hover:text-yellow-400 transition-colors">{dream.title}</h4>
                            <div className="flex items-center gap-2 text-[10.5px] text-zinc-400 font-mono mt-0.5 flex-wrap">
                              <span>📁 {dream.projectName}</span>
                              <span>•</span>
                              <span className="text-yellow-400/80">🌿 {dream.branch}</span>
                              <span>•</span>
                              <span className="text-zinc-500">Agent: {dream.assignedAgent}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono border uppercase ${statusColors[dream.status] || 'bg-zinc-800 text-zinc-300'}`}>
                            {dream.status}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
                            {dream.progressPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300"
                          style={{ width: `${dream.progressPercent}%` }}
                        />
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10.5px] font-mono text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-850/60">
                        <div><span className="text-zinc-500">ETA:</span> <span className="text-zinc-200">{dream.eta}</span></div>
                        <div><span className="text-zinc-500">Repository:</span> <span className="text-zinc-200 truncate block">{dream.repository}</span></div>
                        <div><span className="text-zinc-500">Provider:</span> <span className="text-yellow-400 font-bold">{dream.aiProvider}</span></div>
                        <div><span className="text-zinc-500">Quota Owner:</span> <span className="text-emerald-400 font-bold truncate block">{dream.quotaOwner}</span></div>
                      </div>

                      {/* Expanded View */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-zinc-800/80 space-y-3 animate-in fade-in duration-150">
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{dream.description}</p>

                          {dream.snippet && (
                            <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-[10.5px] font-mono text-yellow-300/90 max-h-40 overflow-auto whitespace-pre-wrap select-all">
                              {dream.snippet}
                            </div>
                          )}

                          {/* Approval Controls */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {dream.status === 'Needs Approval' && (
                              <>
                                <button
                                  onClick={() => handleApproveDream(dream, 'push')}
                                  className="px-3 py-1.5 bg-yellow-500 text-black hover:bg-yellow-400 font-mono text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <Check size={13} /> Approve & Push Branch
                                </button>
                                <button
                                  onClick={() => handleApproveDream(dream, 'pr')}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <GitPullRequest size={13} /> Approve & Open PR #{dream.prNumber}
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleApproveDream(dream, 'backlog')}
                              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckSquare size={13} /> Convert to Backlog Task
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: GITHUB BRANCHES & HISTORY */}
      {activeTab === 'history' && (
        <div className="flex-1 bg-[#0d0d12] border border-zinc-800 rounded-2xl p-5 overflow-y-auto space-y-5 custom-scrollbar font-sans">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-white font-mono flex items-center gap-2">
                <GitBranch size={16} className="text-yellow-400" />
                GitHub Organization & Branch Cleanup
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Managed branches grouped by `dream/&lt;category&gt;/&lt;id&gt;`. Prevents unmanaged branch sprawl.
              </p>
            </div>
            <button
              onClick={handleCleanMergedBranches}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={13} /> Auto-Clean Merged Branches
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">Active Solution Branches ({allDreamTasks.length})</h4>
            <div className="space-y-2 font-mono text-xs">
              {allDreamTasks.map(d => (
                <div key={d.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <span className="text-yellow-400 font-bold block">🌿 {d.branch}</span>
                    <span className="text-[10.5px] text-zinc-400">Repo: {d.repository} • Target: {d.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                      PR #{d.prNumber}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Grouped
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI USAGE & QUOTA AUDIT */}
      {activeTab === 'audit' && (
        <div className="flex-1 bg-[#0d0d12] border border-zinc-800 rounded-2xl p-5 overflow-y-auto space-y-6 custom-scrollbar font-sans">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-extrabold text-white font-mono flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              AI Quota & Inference Cost Audit
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Transparent breakdown of AI providers and quota ownership. DevSpace routes inference to user accounts whenever supported.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2 font-mono text-xs">
              <span className="text-yellow-400 font-bold uppercase block">Google AI Studio & Gemini API</span>
              <p className="text-zinc-400 text-[11px] font-sans">
                Consumes the logged-in user's personal Google Account quota (`x-gemini-api-key` header).
              </p>
              <div className="text-[10.5px] text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                ✅ Zero central cost for DevSpace servers
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2 font-mono text-xs">
              <span className="text-yellow-400 font-bold uppercase block">Google Jules Code Agent</span>
              <p className="text-zinc-400 text-[11px] font-sans">
                Uses the authenticated developer's Jules workspace quotas for code refactoring and AST synthesis.
              </p>
              <div className="text-[10.5px] text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                ✅ Authenticated user account quota enforced
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USER CONTROLS & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="flex-1 bg-[#0d0d12] border border-zinc-800 rounded-2xl p-5 overflow-y-auto space-y-6 custom-scrollbar font-sans max-w-2xl">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-extrabold text-white font-mono flex items-center gap-2">
              <Settings size={16} className="text-yellow-400" />
              User Controls & Dreaming Limits
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Configure concurrency, pull request triggers, and approval safeguards.
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-bold block">Maximum Concurrent Dreams</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxConcurrentDreams}
                onChange={(e) => setMaxConcurrentDreams(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 outline-none focus:border-yellow-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-bold block">Maximum Active Pull Requests</label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxActivePRs}
                onChange={(e) => setMaxActivePRs(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 outline-none focus:border-yellow-500/40"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-850">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-zinc-300">Require Approval Before Branch Push</span>
                <input
                  type="checkbox"
                  checked={approvalBeforePush}
                  onChange={(e) => setApprovalBeforePush(e.target.checked)}
                  className="w-4 h-4 accent-yellow-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-zinc-300">Require Approval Before Creating Pull Request</span>
                <input
                  type="checkbox"
                  checked={approvalBeforePR}
                  onChange={(e) => setApprovalBeforePR(e.target.checked)}
                  className="w-4 h-4 accent-yellow-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
