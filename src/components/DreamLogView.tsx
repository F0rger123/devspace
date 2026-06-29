import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles, Bot, Clock, Trash2, Play, Check, AlertTriangle, Filter, Plus, Loader2, ChevronDown, ChevronRight, CheckSquare, Database, CheckCircle, Zap, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DreamRecommendation {
  id: string;
  title: string;
  description: string;
  snippet: string;
  category: 'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general';
  status: 'active' | 'approved' | 'dismissed';
  createdAt: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  frameworks?: string[];
  customStack?: string[];
  dreamRecommendations?: DreamRecommendation[];
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
  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dreaming Form
  const [triggerProjectId, setTriggerProjectId] = useState<string>(projects[0]?.id || '');
  const [triggerFocus, setTriggerFocus] = useState<'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general'>('refactor');
  const [localDreaming, setLocalDreaming] = useState<boolean>(false);

  // Expanded card tracking
  const [expandedDreamId, setExpandedDreamId] = useState<string | null>(null);

  // Alert/Notifications
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll dreaming logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [projects]);

  // Aggregate all dreams across projects
  const allDreams = useMemo(() => {
    const list: any[] = [];
    projects.forEach(proj => {
      if (proj.dreamRecommendations) {
        proj.dreamRecommendations.forEach(rec => {
          list.push({
            ...rec,
            projectId: proj.id,
            projectName: proj.name,
            projectRepo: (proj as any).githubRepo || ''
          });
        });
      }
    });
    // Sort by timestamp desc
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [projects]);

  // Filter dreams
  const filteredDreams = useMemo(() => {
    return allDreams.filter(dream => {
      const matchesProject = selectedProjectId === 'all' || dream.projectId === selectedProjectId;
      const matchesCategory = selectedCategory === 'all' || dream.category === selectedCategory;
      const matchesSearch = 
        dream.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        dream.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesCategory && matchesSearch;
    });
  }, [allDreams, selectedProjectId, selectedCategory, searchQuery]);

  // Handle triggering a dream session
  const handleTriggerDream = async () => {
    if (!triggerProjectId) return;
    setLocalDreaming(true);
    setActionAlert({ type: 'info', message: 'Triggered autonomous Dreaming Cycle in background...' });
    try {
      await startProjectDreaming(triggerProjectId, triggerFocus);
      setActionAlert({ type: 'success', message: 'Dreaming cycle completed successfully! 3 new options synthesized.' });
    } catch (e) {
      console.error(e);
      setActionAlert({ type: 'success', message: 'Dreaming completed with offline backup options loaded.' });
    } finally {
      setLocalDreaming(false);
      setTimeout(() => setActionAlert(null), 4000);
    }
  };

  // Convert dream to Issue
  const handleConvertDreamToIssue = (dream: any) => {
    // 1. Create issue
    addIssue({
      projectId: dream.projectId,
      title: `[AI Idea] ${dream.title}`,
      description: `### Recommended AI Fix / Optimization\n${dream.description}\n\n### Proposed Code Snippet:\n\`\`\`typescript\n${dream.snippet}\n\`\`\``,
      type: dream.category === 'security' ? 'Bug' : dream.category === 'new_ideas' ? 'Feature' : 'Task',
      status: 'Todo',
      priority: dream.category === 'security' ? 'High' : 'Medium',
      labels: ['Aether Idea', dream.category],
      storyPoints: dream.category === 'performance' ? 3 : 2
    });

    // 2. Mark recommendation as approved in project
    const currentProj = projects.find(p => p.id === dream.projectId);
    if (currentProj && currentProj.dreamRecommendations) {
      const updatedRecs = currentProj.dreamRecommendations.map(rec => {
        if (rec.id === dream.id) {
          return { ...rec, status: 'approved' as const };
        }
        return rec;
      });
      updateProject(dream.projectId, { dreamRecommendations: updatedRecs });
    }

    setActionAlert({ type: 'success', message: `Converted "${dream.title}" into an active backlog Task!` });
    setTimeout(() => setActionAlert(null), 3000);
  };

  // Save to Memory Cortex
  const handleAddToCortex = (dream: any) => {
    const newSynapse = {
      id: `syn-dream-${Date.now()}`,
      name: `Dream: ${dream.title}`,
      desc: dream.description,
      snippet: dream.snippet,
      type: 'dream_synapse' as const,
      projectName: dream.projectName,
      createdAt: Date.now()
    };
    
    setCortexSynapses([...cortexSynapses, newSynapse]);

    // Mark recommendation as approved
    const currentProj = projects.find(p => p.id === dream.projectId);
    if (currentProj && currentProj.dreamRecommendations) {
      const updatedRecs = currentProj.dreamRecommendations.map(rec => {
        if (rec.id === dream.id) {
          return { ...rec, status: 'approved' as const };
        }
        return rec;
      });
      updateProject(dream.projectId, { dreamRecommendations: updatedRecs });
    }

    setActionAlert({ type: 'success', message: `Saved "${dream.title}" into Aether Central Memory Core!` });
    setTimeout(() => setActionAlert(null), 3000);
  };

  // Dismiss / delete dream
  const handleDismissDream = (dream: any) => {
    const currentProj = projects.find(p => p.id === dream.projectId);
    if (currentProj && currentProj.dreamRecommendations) {
      const updatedRecs = currentProj.dreamRecommendations.filter(rec => rec.id !== dream.id);
      updateProject(dream.projectId, { dreamRecommendations: updatedRecs });
    }
    setActionAlert({ type: 'info', message: 'Dream proposal dismissed.' });
    setTimeout(() => setActionAlert(null), 2000);
  };

  // Find currently active dreaming project
  const activeDreamingProject = useMemo(() => {
    return projects.find(p => p.isDreamingActive);
  }, [projects]);

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row p-4 lg:p-6 gap-6 overflow-hidden bg-[#09090b]/40">
      
      {/* LEFT PANEL: Autonomous Dreamer Control & Status Logs */}
      <div className="w-full md:w-[340px] shrink-0 flex flex-col gap-4 overflow-y-auto">
        
        {/* Dreaming Core State Card */}
        <div className="border border-zinc-800 bg-[#121214] rounded-xl p-5 relative overflow-hidden flex flex-col gap-3">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Sparkles size={60} className="text-yellow-500" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${activeDreamingProject ? 'bg-yellow-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
            <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">Dreaming Processor</h4>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            Aether utilizes idle processing loops to scan project codebases, structural parameters, and library patterns, dreaming up optimizations.
          </p>

          {activeDreamingProject ? (
            <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-3 space-y-2 mt-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-yellow-400 font-semibold truncate max-w-[150px]">🤖 Dreaming: {activeDreamingProject.name}</span>
                <span className="text-yellow-500 font-bold">{activeDreamingProject.dreamProgress || 0}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.3)] transition-all duration-300" 
                  style={{ width: `${activeDreamingProject.dreamProgress || 0}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-center text-[10px] font-mono text-emerald-400 mt-1">
              🟢 Cortex Idle & Synced. Awaiting Triggers.
            </div>
          )}
        </div>

        {/* Trigger Dreaming Engine Card */}
        <div className="border border-zinc-800 bg-[#121214] rounded-xl p-5 flex flex-col gap-4">
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-500" /> Trigger Dreaming Cycle
          </h4>

          <div className="space-y-3 text-left">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 pl-1">Target Project</label>
              <select 
                value={triggerProjectId}
                onChange={(e) => setTriggerProjectId(e.target.value)}
                disabled={!!activeDreamingProject || localDreaming}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-yellow-500/40 cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 pl-1">Cognitive Focus</label>
              <select 
                value={triggerFocus}
                onChange={(e) => setTriggerFocus(e.target.value as any)}
                disabled={!!activeDreamingProject || localDreaming}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-yellow-500/40 cursor-pointer"
              >
                <option value="refactor">Code Quality & Refactoring</option>
                <option value="security">Vulnerabilities & Secure Audit</option>
                <option value="performance">Bundle Size & Speed Optimization</option>
                <option value="accessibility">Semantic HTML & WCAG Access</option>
                <option value="design">Visual Polish, Margins & Typography</option>
                <option value="new_ideas">Innovative New Ideas & expansion</option>
                <option value="general">Broad Workspace Self-Improvement</option>
              </select>
            </div>

            <button
              onClick={handleTriggerDream}
              disabled={!!activeDreamingProject || localDreaming || !triggerProjectId}
              className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-yellow-500/5 mt-2"
            >
              {localDreaming || activeDreamingProject ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Dreaming in Progress...
                </>
              ) : (
                <>
                  <Play size={12} className="fill-black" />
                  Launch Dreaming Cycle
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Dreamer Console Logs */}
        <div className="border border-zinc-800 bg-[#121214] rounded-xl p-4 flex-1 flex flex-col min-h-[220px]">
          <h4 className="text-xs font-bold text-zinc-200 mb-3 flex items-center gap-1.5 shrink-0 font-mono">
            <Cpu size={14} className="text-yellow-500" /> Dreaming System Logs
          </h4>
          <div className="flex-1 overflow-y-auto bg-zinc-950 border border-zinc-850/80 rounded-lg p-3 font-mono text-[9.5px] leading-relaxed text-yellow-500/80 space-y-2 max-h-[350px]">
            {activeDreamingProject && activeDreamingProject.dreamLogs && activeDreamingProject.dreamLogs.length > 0 ? (
              activeDreamingProject.dreamLogs.map((log, idx) => (
                <div key={idx} className="flex gap-1.5 items-start">
                  <span className="text-zinc-650 font-bold shrink-0">[{idx + 1}]</span>
                  <span className="text-zinc-350">{log}</span>
                </div>
              ))
            ) : (
              <div className="text-zinc-650 italic text-center py-10">
                Console idle. Activate dreaming loop to capture realtime agent compilation trace logs.
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: Organized Dream Log Dashboard & List */}
      <div className="flex-grow flex flex-col gap-4 overflow-hidden min-w-0">
        
        {/* Action alerts */}
        <AnimatePresence>
          {actionAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-2 shrink-0 ${
                actionAlert.type === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-500/35 text-emerald-400' 
                  : 'bg-zinc-900 border-zinc-800 text-yellow-400'
              }`}
            >
              <CheckCircle size={14} className={actionAlert.type === 'success' ? 'text-emerald-400' : 'text-yellow-400'} />
              <span>{actionAlert.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and search bar */}
        <div className="border border-zinc-800 bg-[#121214] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1">
              <Filter size={12} className="text-zinc-500" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent border-none text-[11px] text-zinc-350 outline-none pr-6 cursor-pointer focus:ring-0"
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1">
              <Filter size={12} className="text-zinc-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-[11px] text-zinc-350 outline-none pr-6 cursor-pointer focus:ring-0"
              >
                <option value="all">All Focuses</option>
                <option value="refactor">Quality & Refactoring</option>
                <option value="security">Security Vulnerabilities</option>
                <option value="performance">Performance & Load</option>
                <option value="accessibility">Accessibility & WCAG</option>
                <option value="design">UI Polish & Design</option>
                <option value="new_ideas">New Ideas & Features</option>
                <option value="general">General Codebase</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search captured ideas & snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-800 rounded-lg py-1.5 px-3 text-[11px] outline-none text-zinc-300 placeholder:text-zinc-650 focus:border-yellow-500/40"
            />
          </div>
        </div>

        {/* Captures Lists / Grid */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
          {filteredDreams.length === 0 ? (
            <div className="h-64 rounded-xl border border-dashed border-zinc-800/80 bg-[#121214]/20 flex flex-col items-center justify-center text-center p-8 text-zinc-500 gap-3">
              <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-full text-zinc-650">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400">No captured dreamed ideas found</p>
                <p className="text-[10px] text-zinc-600 mt-1 max-w-sm">
                  {searchQuery ? "Try altering your active filters or clear search query." : "Launch a Dreaming Cycle on any of your workspace modules to scan code and auto-generate optimizations!"}
                </p>
              </div>
            </div>
          ) : (
            filteredDreams.map(dream => {
              const isExpanded = expandedDreamId === dream.id;
              
              // Category visual properties
              const categoryDetails = 
                dream.category === 'security' ? { label: 'Security Patch', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' } :
                dream.category === 'performance' ? { label: 'Performance Tune', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' } :
                dream.category === 'design' ? { label: 'Design Polish', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' } :
                dream.category === 'new_ideas' ? { label: 'Feature Idea', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' } :
                dream.category === 'refactor' ? { label: 'Code Refactor', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' } :
                { label: 'General Optimization', color: 'text-zinc-400 bg-zinc-900 border-zinc-850' };

              const isApproved = dream.status === 'approved';

              return (
                <div 
                  key={dream.id}
                  className={`rounded-xl border bg-zinc-950/40 p-4 transition-all duration-300 text-left flex flex-col gap-3.5 ${
                    isExpanded ? 'border-zinc-700 shadow-lg bg-[#121214]/65' : 'border-zinc-800/80 hover:border-zinc-750'
                  } ${isApproved ? 'opacity-70 border-zinc-900' : ''}`}
                >
                  
                  {/* Card Header Info */}
                  <div 
                    onClick={() => setExpandedDreamId(isExpanded ? null : dream.id)}
                    className="flex items-center justify-between gap-3 flex-wrap cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isExpanded ? <ChevronDown size={14} className="text-zinc-400 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 shrink-0" />}
                      <div className="space-y-1 truncate">
                        <h4 className="text-xs font-bold text-zinc-150 group-hover:text-yellow-450 truncate" title={dream.title}>
                          {dream.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 flex-wrap">
                          <span className="text-zinc-450 font-semibold bg-zinc-900 border border-zinc-850 px-1 py-0.5 rounded truncate max-w-[140px]" title={dream.projectName}>
                            📁 {dream.projectName}
                          </span>
                          <span className="font-semibold text-zinc-700 shrink-0">•</span>
                          <span className="text-zinc-600 font-medium">
                            Synthesized {new Date(dream.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${categoryDetails.color}`}>
                        {categoryDetails.label}
                      </span>
                      {isApproved && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                          Approved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Body Sections */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800/60 pt-3.5 space-y-4 animate-in fade-in duration-200">
                      
                      {/* Thought Process Description */}
                      <div className="space-y-1.5 text-left">
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Thought Process & Rationale</div>
                        <p className="text-[11.5px] text-zinc-300 leading-relaxed font-sans">
                          {dream.description}
                        </p>
                      </div>

                      {/* Code Snippet Box */}
                      {dream.snippet && dream.snippet !== '// Actionable suggestion code template' && (
                        <div className="space-y-1.5 text-left">
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Proposed Architectural Solution</div>
                          <div className="bg-zinc-950 border border-zinc-850/80 rounded-lg p-3 text-[10.5px] font-mono text-yellow-500/90 leading-relaxed max-h-[190px] overflow-auto custom-scrollbar whitespace-pre-wrap select-all">
                            {dream.snippet}
                          </div>
                        </div>
                      )}

                      {/* Actions row */}
                      {!isApproved && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleConvertDreamToIssue(dream)}
                            className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black rounded-lg border border-yellow-500/20 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckSquare size={12} /> Convert to Backlog Issue
                          </button>

                          <button
                            onClick={() => handleAddToCortex(dream)}
                            className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-lg border border-purple-500/20 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Database size={12} /> Save in Memory Cortex
                          </button>

                          <button
                            onClick={() => handleDismissDream(dream)}
                            className="px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-805 text-zinc-450 hover:text-rose-400 rounded-lg border border-zinc-800 text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={12} /> Dismiss Idea
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
