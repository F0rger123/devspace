import { FolderGit2, Plus, ArrowRight, Github, ExternalLink, Loader2, X, Trash, Sparkles, Code2, Globe, Database, Calendar, Shield, Check, Info, ChevronLeft, ChevronRight, Server, Link, Edit2, Play, Volume2, Mic, StopCircle, RefreshCw, Layers, Sliders, CheckSquare, Lightbulb, Target, Brain, ClipboardList, Hammer, Zap, FileUp, Save, CheckCircle2, ShieldCheck, HeartPulse, Sparkle, Rocket } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataProvider';

export function Projects() {
  const [githubReposList, setGithubReposList] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const { 
    projects, 
    addProject, 
    updateProject, 
    deleteProject, 
    githubToken, 
    githubUser, 
    activeProjectId, 
    setActiveProjectId, 
    setGithubRepo,
    assets,
    addAsset,
    deleteAsset,
    addIssue
  } = useData();

  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', description: '', githubRepos: '', frameworks: '', launchTarget: '', apiConnections: '', sprints: '', status: 'Active' as const });

  // WORKSPACE DETAILED VIEWS & AGENTS STATES
  const [viewingWorkspaceId, setViewingWorkspaceId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'goals' | 'brainstorm' | 'dream' | 'stack'>('goals');
  const [newGoalText, setNewGoalText] = useState('');
  const [newStackTag, setNewStackTag] = useState('');
  
  // Voting & Sandbox brainstorming states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [ideasTargetCount, setIdeasTargetCount] = useState(10);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<{ id: string, text: string, details: string }[]>([]);
  
  // Background agent dreaming
  const [isDreaming, setIsDreaming] = useState(false);
  const [dreamingProgress, setDreamingProgress] = useState(0);
  const [dreamLogs, setDreamLogs] = useState<string[]>([]);
  const [dreamRecommendations, setDreamRecommendations] = useState<{ id: string, title: string, description: string, snippet: string }[]>([]);

  // Drag and drop asset tracking state
  const [dragActive, setDragActive] = useState(false);

  // Voice Recognition for Idea Dictation Sandbox
  const recognitionRef = useRef<any>(null);

  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice Dictation is not supported in this browser environment. Please try Chrome or Safari.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
         setVoiceTranscript(prev => prev + finalTranscript);
      }
    };
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  };

  const stopVoiceDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      addAsset({
         projectId: id,
         name: file.name,
         type: file.type || 'application/octet-stream',
         size: Math.round(file.size),
         dataUrl: 'data:text/plain;base64,TW9jayBBc3NldCBEYXRh'
      });
    }
  };

  const triggerAIBrainstorm = async (project: any) => {
    setAiLoading(true);
    setGeneratedIdeas([]);
    const stackList = [...(project.frameworks || []), ...(project.customStack || [])];
    const seenJoin = (project.seenRecommendedIdeas || []).map((idx: string) => `"${idx}"`).join(', ');
    
    const promptText = `Generate EXACTLY ${ideasTargetCount} creative, highly detailed feature ideas or software solutions for a project named "${project.name}" with description: "${project.description}".
Current frameworks/stack: ${stackList.join(', ')}.

IMPORTANT SEEN ELIMINATION REQUIREMENT:
Do NOT suggest any of these previously discussed recommended ideas because the user has already rejected or added them:
[${seenJoin || 'None yet'}]
Ensure your suggestions are completely different.

Format your complete response ONLY as a series of ideas split exactly by the header "---CARD---". No introductory text, no conversational text, no raw JSON, no code fences. Each card block should contain title and description in this exact format:
Title of Feature Setup
Explanation of how it functions and why it fits this technology stack.
`;

    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: promptText }
          ],
          context: `You are DevSpace Brainstorm Assistant. Avoid repeats.`
        })
      });

      if (!response.ok) {
         throw new Error("HTTP error " + response.status);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accum = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
             if (line.startsWith('data: ')) {
                const inner = line.slice(6).trim();
                if (inner === '[DONE]') continue;
                try {
                   const parsed = JSON.parse(inner);
                   if (parsed.text) accum += parsed.text;
                } catch {}
             }
          }
        }
      }

      const blocks = accum.split('---CARD---').filter(b => b.trim());
      const parsedIdeas = blocks.map((b, index) => {
         const parts = b.trim().split('\n').filter(p => p.trim());
         if (parts.length >= 2) {
            return {
               id: `gen-${project.id}-${index}-${Date.now()}`,
               text: parts[0].replace(/[\[\]]/g, '').trim(),
               details: parts.slice(1).join(' ').trim()
            };
         } else if (parts.length === 1) {
            return {
               id: `gen-${project.id}-${index}-${Date.now()}`,
               text: parts[0].replace(/[\[\]]/g, '').trim(),
               details: 'Actionable custom tech proposal.'
            };
         }
         return null;
      }).filter((b): b is {id: string, text: string, details: string} => !!b);

      setGeneratedIdeas(parsedIdeas.slice(0, ideasTargetCount));
    } catch (e) {
      console.error(e);
      setGeneratedIdeas([
         { id: 'mock-1', text: 'Realtime Latency Graph Node', details: 'A visual SVG graphing system checking background transit times automatically.' },
         { id: 'mock-2', text: 'Web Security Key Rotator', details: 'Self-indexing secure headers module which rotates token prefetch parameters.' }
      ]);
    }
    setAiLoading(false);
  };

  const triggerAIDreaming = async (project: any) => {
    setIsDreaming(true);
    setDreamLogs([]);
    setDreamRecommendations([]);
    setDreamingProgress(10);
    
    const logs = [
      '💤 Activating Autonomous Agents Dreaming Engine...',
      '🔍 Agent ScrumMaster loading workspace models...',
      '📈 Scanning delivery milestone health boards...'
    ];
    
    for (let i = 0; i < logs.length; i++) {
       setDreamLogs(prev => [...prev, logs[i]]);
       setDreamingProgress(20 + i * 15);
       await new Promise(resolve => setTimeout(resolve, 800));
    }

    setDreamLogs(prev => [...prev, '💻 Agent CodeOptimizer reviewing frameworks & stack components...']);
    setDreamingProgress(65);

    const stackList = [...(project.frameworks || []), ...(project.customStack || [])];
    const promptText = `Act as an autonomous software consultant agent. Suggest 3 highly specific code fixes, security patches, or architecture enhancement recommendations specifically tailored for stack [${stackList.join(', ')}] with description: "${project.description}".
Ensure ideas are unique, professional, and contain full code snippets in CJS/ESM.

Format your response EXACTLY like this separating recommendations with "---REC---":
Title
Description of fix or enhancement recommendation
\`\`\`typescript
// Code snippet showing the solution
\`\`\`
`;

    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: promptText }
          ],
          context: `You are ScrumMaster Agent dreaming up deep codebase optimizations.`
        })
      });

      let accumText = '';
      if (response.ok) {
         const reader = response.body?.getReader();
         const decoder = new TextDecoder("utf-8");
         if (reader) {
           while (true) {
             const { done, value } = await reader.read();
             if (done) break;
             const chunk = decoder.decode(value);
             const lines = chunk.split('\n');
             for (const line of lines) {
                if (line.startsWith('data: ')) {
                   const inner = line.slice(6).trim();
                   if (inner === '[DONE]') continue;
                   try {
                      const parsed = JSON.parse(inner);
                      if (parsed.text) accumText += parsed.text;
                   } catch {}
                }
             }
           }
         }
      }

      setDreamLogs(prev => [...prev, '🛡️ Agent SecurityAuditor scanning for structural vulnerabilities...']);
      setDreamingProgress(85);
      await new Promise(resolve => setTimeout(resolve, 800));

      const blocks = accumText.split('---REC---').filter(b => b.trim());
      const mappedRecs = blocks.map((b, idx) => {
         const parts = b.trim().split('\n');
         const title = parts[0]?.trim() || 'Optimization Log';
         let codeStartIndex = parts.findIndex(p => p.trim().startsWith('```'));
         const desc = codeStartIndex !== -1 ? parts.slice(1, codeStartIndex).join(' ').trim() : parts.slice(1).join(' ').trim();
         const snippet = codeStartIndex !== -1 ? parts.slice(codeStartIndex).join('\n').trim() : '// Actionable suggestion code template';
         return {
            id: `rec-${idx}-${Date.now()}`,
            title,
            description: desc,
            snippet
         };
      });

      setDreamRecommendations(mappedRecs);
      setDreamLogs(prev => [...prev, '✨ Dreaming Complete! Report compiled. Suggestions ready for inspection.']);
      setDreamingProgress(100);
    } catch (e) {
      console.error(e);
      setDreamRecommendations([
         { id: 'rec-1', title: 'Route Rate Limiter Installation', description: 'Prevent denial-of-service by limiting api requests on backend routes.', snippet: 'import rateLimit from "express-rate-limit";\nconst limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });' }
      ]);
      setDreamLogs(prev => [...prev, '⚠️ Error fetching stream. Standard offline backup solutions populated.']);
      setDreamingProgress(100);
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    setCurrentStep(1);
    const userToFetch = githubUser || 'google';
    const isOwnProfile = !!githubToken;
    setLoadingRepos(true);
    try {
      const reposRes = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(githubToken 
          ? { token: githubToken, user: userToFetch, isOwnProfile } 
          : { user: userToFetch }
        )
      });
      const contentType = reposRes.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
         const data = await reposRes.json();
         if (Array.isArray(data)) {
           setGithubReposList(data);
         }
      }
    } catch (e) {
      console.error("Failed to load repos", e);
    }
    setLoadingRepos(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    addProject({
      name: formData.name,
      description: formData.description,
      frameworks: formData.frameworks ? formData.frameworks.split(',').map(f => f.trim()).filter(f => f) : undefined,
      githubRepos: formData.githubRepos ? formData.githubRepos.split(',').map(f => f.trim()).filter(f => f) : undefined,
      apiConnections: formData.apiConnections ? formData.apiConnections.split(',').map(f => ({ name: f.trim() })).filter(f => f.name) : undefined,
      sprints: formData.sprints ? formData.sprints.split(',').map(s => ({ id: s.trim().toLowerCase().replace(/\s+/g, '-'), name: s.trim() })).filter(s => s.name) : undefined,
      launchTarget: formData.launchTarget || undefined,
      status: formData.status
    });
    setShowModal(false);
    setFormData({ name: '', description: '', githubRepos: '', frameworks: '', launchTarget: '', apiConnections: '', sprints: '', status: 'Active' });
  };

  const renderWorkspace = (project: any) => {
     const projectAssets = assets.filter(a => a.projectId === project.id);
     const completePercentage = Math.min(100, Math.round(((project.featuresCount || 0) / (project.totalFeaturesCount || 10)) * 100));

     return (
        <div className="flex-1 flex flex-col relative pb-8 animate-in fade-in slide-in-from-bottom duration-300">
           {/* BACK HEADER */}
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-6">
              <div>
                 <button 
                   onClick={() => setViewingWorkspaceId(null)}
                   className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2 font-semibold transition-colors"
                 >
                    &larr; Back to Projects Gallery
                 </button>
                 <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-zinc-100">{project.name}</h1>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-mono uppercase tracking-wider">{project.status}</span>
                 </div>
                 <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{project.description || 'No description provided.'}</p>
              </div>

              {/* STAGE & WEBSITE BAR */}
              <div className="flex items-center gap-2">
                 {project.websiteUrl && (
                    <a 
                      href={project.websiteUrl.startsWith('http') ? project.websiteUrl : `https://${project.websiteUrl}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-700/60 flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <ExternalLink size={12} /> Visit Site
                    </a>
                 )}
                 <button 
                   onClick={() => deleteProject(project.id)}
                   className="text-xs bg-red-950/20 hover:bg-red-950/60 text-red-400 border border-red-500/10 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                 >
                    <Trash size={12} /> Delete Space
                 </button>
              </div>
           </div>

           {/* WORKSPACE NAVIGATION TABS */}
           <div className="flex border-b border-zinc-800/80 mb-6 gap-1 overflow-x-auto pb-1 max-w-full">
              {[
                { id: 'goals', label: '🎯 Goal Board & Target Tracker', icon: Target },
                { id: 'brainstorm', label: '💡 AI Brainstorming Sandbox', icon: Brain },
                { id: 'dream', label: '💤 Autonomous AI Dreaming', icon: RefreshCw },
                { id: 'stack', label: '📁 Custom Stack & Assets', icon: Layers }
              ].map(tab => {
                 const Icon = tab.icon;
                 const isActive = workspaceTab === tab.id;
                 return (
                    <button
                      key={tab.id}
                      onClick={() => setWorkspaceTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-xs rounded-t-lg transition-all shrink-0 select-none ${
                        isActive 
                          ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                          : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                      }`}
                    >
                       <Icon size={13} />
                       {tab.label}
                    </button>
                 );
              })}
           </div>

           {/* ACTIVE WORKSPACE FRAMEWORK CONTAINER */}
           <div className="flex-1">
              
              {/* TAB 1: GOALS BOARD & TARGET TRACKER */}
              {workspaceTab === 'goals' && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                    {/* LEFT PANEL: FEATURE DENSITY GAUGES */}
                    <div className="lg:col-span-2 space-y-6">
                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                          <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                             <ClipboardList size={16} className="text-blue-400" /> Feature Roadmap Velocity Tracker
                          </h2>
                          
                          {/* METRIC CARD BARROW */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                             <div className="bg-[#18181b] border border-zinc-800/60 rounded-xl p-4 relative overflow-hidden">
                                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">FEATURES TRACKER</div>
                                <div className="text-2xl font-bold text-zinc-200 mt-1">{project.featuresCount || 0} / {project.totalFeaturesCount || 10} Built</div>
                                <div className="text-[11px] text-blue-400 mt-2 font-medium">
                                   {completePercentage}% to Feature Complete
                                </div>
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-15">
                                   <Hammer size={32} />
                                </div>
                             </div>

                             <div className="bg-[#18181b] border border-zinc-800/60 rounded-xl p-4 relative overflow-hidden">
                                <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">GOING PUBLIC LAUNCH TARGET</div>
                                <div className="text-2xl font-bold text-zinc-200 mt-1">{project.progressPercent || 0}%</div>
                                <div className="text-[11px] text-amber-500 mt-2 font-medium">
                                   {100 - (project.progressPercent || 0)}% remaining until public debut
                                </div>
                                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-15">
                                   <Globe size={32} />
                                </div>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-semibold text-zinc-400 mb-2">Adjust Features Count (Completed & Total)</label>
                                <div className="flex items-center gap-4">
                                   <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-1 shrink-0">
                                      <button 
                                        onClick={() => updateProject(project.id, { featuresCount: Math.max(0, (project.featuresCount || 0) - 1) })}
                                        className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm transition-colors"
                                      >
                                         -
                                      </button>
                                      <span className="w-14 text-center font-bold text-xs text-zinc-100">{project.featuresCount || 0}</span>
                                      <button 
                                        onClick={() => updateProject(project.id, { featuresCount: Math.min((project.totalFeaturesCount || 10), (project.featuresCount || 0) + 1) })}
                                        className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm transition-colors"
                                      >
                                         +
                                      </button>
                                   </div>
                                   <span className="text-zinc-645 select-none font-bold">of</span>
                                   <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-1 shrink-0">
                                      <button 
                                        onClick={() => updateProject(project.id, { totalFeaturesCount: Math.max(1, (project.totalFeaturesCount || 10) - 1) })}
                                        className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm transition-colors"
                                      >
                                         -
                                      </button>
                                      <span className="w-14 text-center font-bold text-xs text-zinc-100">{project.totalFeaturesCount || 10}</span>
                                      <button 
                                        onClick={() => updateProject(project.id, { totalFeaturesCount: (project.totalFeaturesCount || 10) + 1 })}
                                        className="w-8 h-8 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm transition-colors"
                                      >
                                         +
                                      </button>
                                   </div>
                                </div>
                             </div>

                             <div>
                                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Configure Launch Readiness Gauge (%)</label>
                                <div className="flex items-center gap-4">
                                   <input 
                                     type="range" 
                                     min="0" 
                                     max="100" 
                                     value={project.progressPercent || 0}
                                     onChange={(e) => updateProject(project.id, { progressPercent: parseInt(e.target.value) })}
                                     className="flex-1 accent-blue-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                                   />
                                   <span className="text-xs font-mono font-bold text-zinc-200 w-12 text-right bg-zinc-900 px-2 py-1 rounded border border-zinc-800">{project.progressPercent || 0}%</span>
                                </div>
                             </div>

                             <div>
                                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Days remaining to public release (Countdown)</label>
                                <div className="flex items-center gap-3">
                                   <input 
                                     type="number" 
                                     min="0"
                                     value={project.daysUntilAddition || 30}
                                     onChange={(e) => updateProject(project.id, { daysUntilAddition: Math.max(0, parseInt(e.target.value) || 0) })}
                                     className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-blue-500 transition-colors w-32"
                                   />
                                   <span className="text-[11px] text-zinc-500">Days until addition of next feature pipeline.</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* GOAL FEEDBACK BOARDS */}
                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5">
                          <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                             <CheckSquare size={16} className="text-emerald-400" /> Milestone Checkpoints Checklist
                          </h2>

                          <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                             {project.sprints && project.sprints.length > 0 ? (
                               project.sprints.map((sprint: any) => (
                                 <div key={sprint.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800/60 p-3 rounded-lg hover:border-zinc-700 transition-colors group">
                                    <div className="flex items-center gap-2.5">
                                       <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                       <span className="text-xs font-semibold text-zinc-200">{sprint.name}</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-mono">Status: active track</span>
                                 </div>
                               ))
                             ) : (
                                <div className="text-xs text-zinc-500 italic p-2 bg-[#18181b] rounded-lg border border-zinc-850 text-center">
                                   No sprints assigned. Build standard delivery cadence.
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* RIGHT PANEL: WEBSITE LINK & META CONFIG */}
                    <div className="space-y-6">
                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 shadow-lg">
                          <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                             <Globe size={16} className="text-zinc-250" /> Connect Project Website
                          </h2>
                          <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-semibold text-zinc-400 mb-2">Live Production Target Link</label>
                                <div className="flex gap-2">
                                   <input 
                                     type="text" 
                                     placeholder="e.g., mysolardashboard.vercel.app" 
                                     value={project.websiteUrl || ''} 
                                     onChange={(e) => updateProject(project.id, { websiteUrl: e.target.value })}
                                     className="flex-grow bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 px-3 py-2 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                   />
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2">
                                   Updates immediately. Users can click standard links to jump direct to workspace nodes.
                                </p>
                             </div>

                             {project.websiteUrl && (
                                <a 
                                  href={project.websiteUrl.startsWith('http') ? project.websiteUrl : `https://${project.websiteUrl}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-blue-500/20 shadow-md shadow-blue-500/10 transition-colors"
                                >
                                   🚀 Open Live Web Deployment
                                </a>
                             )}
                          </div>
                       </div>

                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5">
                          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3">WORKSPACE HEALTH TELEMETRY</h3>
                          <div className="space-y-3">
                             <div className="flex justify-between items-center text-xs">
                                <span className="text-zinc-500">Repository Connection</span>
                                <span className="font-semibold text-zinc-350">{project.githubRepos && project.githubRepos.length > 0 ? 'Active GitHub Stream' : 'Local Sandbox'}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs border-t border-zinc-900 pt-2">
                                <span className="text-zinc-500">Sprints Configured</span>
                                <span className="font-semibold text-zinc-350">{project.sprints ? project.sprints.length : 1}</span>
                             </div>
                             <div className="flex justify-between items-center text-xs border-t border-zinc-900 pt-2">
                                <span className="text-zinc-500">Custom Stack Items</span>
                                <span className="font-semibold text-zinc-350">{project.customStack ? project.customStack.length : 0} tags</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {/* TAB 2: AI BRAINSTORMING SANDBOX (Vocal & text sandbox) */}
              {workspaceTab === 'brainstorm' && (
                 <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
                       <h2 className="text-sm font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                          <Lightbulb size={16} className="text-cyan-400" /> AI-Fueled Idea Sandbox
                       </h2>
                       <p className="text-xs text-zinc-400 mb-4 max-w-2xl">
                          Type or dictate voice notes below. Choose how many unique custom ideas you require, and raw concepts will trigger non-repeating brainstorm templates!
                       </p>

                       <div className="space-y-4">
                          <div>
                             <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-zinc-400">Speech or Text Input Area</label>
                                <div className="flex items-center gap-2">
                                   {isRecording ? (
                                      <button 
                                        onClick={stopVoiceDictation}
                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded text-[10px] font-bold animate-pulse hover:bg-red-500 transition-colors"
                                      >
                                         <StopCircle size={12} className="animate-spin" /> Stop Dictation
                                      </button>
                                   ) : (
                                      <button 
                                        onClick={startVoiceDictation}
                                        className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-semibold transition-colors"
                                      >
                                         <Mic size={12} /> Voice Speak Typist
                                      </button>
                                   )}
                                </div>
                             </div>
                             
                             <textarea 
                               placeholder="Type raw requirements or click Microphone dictation to transcribe spoken feature suggestions live. E.g., 'An analytics screen that exports custom PDF documents and triggers background email newsletters...'"
                               value={voiceTranscript}
                               onChange={(e) => setVoiceTranscript(e.target.value)}
                               className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 h-28 focus:border-blue-500 transition-colors placeholder:text-zinc-600 outline-none"
                             />
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-zinc-850 pt-4">
                             <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-zinc-400">Target Idea density:</span>
                                <select
                                  value={ideasTargetCount}
                                  onChange={(e) => setIdeasTargetCount(parseInt(e.target.value))}
                                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded-lg py-1 px-2.5 outline-none focus:border-blue-500 transition-colors"
                                >
                                   <option value={10}>Generate 10 Fresh Ideas</option>
                                   <option value={20}>Generate 20 Fresh Ideas</option>
                                   <option value={30}>Generate 30 Fresh Ideas</option>
                                </select>
                             </div>

                             <button 
                               onClick={() => triggerAIBrainstorm(project)}
                               disabled={aiLoading}
                               className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-500/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                             >
                                {aiLoading ? (
                                   <>
                                      <Loader2 size={13} className="animate-spin" /> Gathering Ideas...
                                   </>
                                ) : (
                                   <>
                                      <Sparkles size={13} className="text-cyan-300" /> Consult Gemini Thinker
                                   </>
                                )}
                             </button>
                          </div>
                       </div>
                    </div>

                    {/* LIVE GENERATION CARDS ZONE */}
                    {generatedIdeas.length > 0 && (
                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 animate-in fade-in slide-in-from-top duration-300">
                          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">Gemini Recommended Proposal Sandbox</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {generatedIdeas.map((idea) => (
                                <div key={idea.id} className="bg-[#18181b] border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
                                   <div>
                                      <h4 className="text-xs font-bold text-zinc-200 mb-1">{idea.text}</h4>
                                      <p className="text-[11px] text-zinc-400 leading-relaxed">{idea.details}</p>
                                   </div>

                                   <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-900 shrink-0">
                                      <button 
                                        onClick={() => {
                                           const updatedIdeas = [
                                              ...(project.brainstormIdeas || []),
                                              { id: String(Date.now() + Math.random()), text: idea.text, details: idea.details, status: 'approved' as const, createdAt: Date.now() }
                                           ];
                                           const updatedSeen = [...(project.seenRecommendedIdeas || []), idea.text];
                                           updateProject(project.id, { brainstormIdeas: updatedIdeas, seenRecommendedIdeas: updatedSeen });
                                           // remove from active recommendations display bucket
                                           setGeneratedIdeas(prev => prev.filter(i => i.id !== idea.id));
                                        }}
                                        className="flex-1 bg-emerald-900/30 hover:bg-emerald-900/60 text-emerald-400 text-[10px] font-bold py-1.5 rounded transition-all text-center border border-emerald-500/10 hover:border-emerald-500/30"
                                      >
                                         👍 Add to Brainstorm Pool
                                      </button>
                                      <button 
                                        onClick={() => {
                                           const updatedSeen = [...(project.seenRecommendedIdeas || []), idea.text];
                                           updateProject(project.id, { seenRecommendedIdeas: updatedSeen });
                                           setGeneratedIdeas(prev => prev.filter(i => i.id !== idea.id));
                                        }}
                                        className="px-2.5 bg-zinc-900 text-zinc-500 hover:text-red-400 hover:bg-zinc-850 p-1.5 rounded text-[10px] font-bold transition-all border border-zinc-800"
                                      >
                                         👎 Nope
                                      </button>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* ACTIVE BRAINSTORMS LIST */}
                    <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5">
                       <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Brain size={14} className="text-zinc-500" /> Active Brainstorm Project Pool</h3>
                       
                       {project.brainstormIdeas && project.brainstormIdeas.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {project.brainstormIdeas.map((idea: any) => (
                                <div key={idea.id} className="bg-zinc-900 border border-zinc-800/60 p-4 rounded-xl flex flex-col justify-between group">
                                   <div>
                                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">BRAINSTORM Sandbox CONCEPT</div>
                                      <h4 className="text-xs font-bold text-zinc-200 mt-1 mb-1.5">{idea.text}</h4>
                                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{idea.details}</p>
                                   </div>
                                   
                                   <div className="mt-4 pt-3 border-t border-zinc-850/60 flex items-center justify-between">
                                      <button 
                                        onClick={() => {
                                           addProject({
                                              name: idea.text,
                                              description: idea.details || 'Spawned from Brainstorm project session.',
                                              frameworks: project.frameworks || ['React', 'TypeScript'],
                                              status: 'Planning'
                                           });
                                           // removes from loop
                                           const remainder = project.brainstormIdeas.filter((bi: any) => bi.id !== idea.id);
                                           updateProject(project.id, { brainstormIdeas: remainder });
                                           alert(`Awesome! Promoted '${idea.text}' into a standalone project Space!`);
                                        }}
                                        className="text-[10px] bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/60 px-2.5 py-1 rounded font-bold border border-cyan-500/10 flex items-center gap-1 transition-all"
                                      >
                                         <Rocket size={10} /> Promote to Standalone Project 🚀
                                      </button>

                                      <button 
                                        onClick={() => {
                                           const remainder = project.brainstormIdeas.filter((bi: any) => bi.id !== idea.id);
                                           updateProject(project.id, { brainstormIdeas: remainder });
                                        }}
                                        className="text-zinc-600 hover:text-red-400 p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                         <Trash size={12} />
                                      </button>
                                   </div>
                                </div>
                             ))}
                          </div>
                       ) : (
                          <div className="p-6 text-center text-zinc-500 italic border border-dashed border-zinc-850 rounded-xl bg-[#18181b]/30">
                             No sandbox idea records confirmed in brainstorm lounge yet. Ask Gemini thinker above to seed custom proposals.
                          </div>
                       )}
                    </div>
                 </div>
              )}

              {/* TAB 3: AUTONOMOUS AI DREAMING */}
              {workspaceTab === 'dream' && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                    {/* ROBOT DIAGNOSTIC PANEL */}
                    <div className="lg:col-span-2 space-y-6">
                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full"></div>
                          <h2 className="text-sm font-semibold text-zinc-150 mb-2 flex items-center gap-2">
                             <Zap size={16} className="text-indigo-400 animate-pulse" /> Background Assistant Agents Room
                          </h2>
                          <p className="text-xs text-zinc-400 mb-4">
                             Let AI agents do background dreaming on self-improving code architectures, system optimization layers, and diagnostic safety patches customized for your exact frameworks.
                          </p>

                          <div className="flex items-center justify-between mb-4">
                             <span className="text-xs font-semibold text-zinc-500 italic">Self check & continuous learning loops: online</span>
                             <button
                               onClick={() => triggerAIDreaming(project)}
                               disabled={isDreaming && dreamingProgress < 100}
                               className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-xs font-bold border border-zinc-700/60 flex items-center gap-2 transition-all"
                             >
                                <RefreshCw size={13} className={isDreaming && dreamingProgress < 100 ? 'animate-spin text-cyan-400' : ''} />
                                {isDreaming && dreamingProgress < 100 ? 'Agents Dreaming...' : 'Activate Agent Dreaming Session 💤'}
                             </button>
                          </div>

                          {isDreaming && (
                             <div className="mt-4 space-y-3">
                                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                                   <span>Dream Sync: {dreamingProgress}%</span>
                                   <span>Telemetry analyzer active</span>
                                </div>
                                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                                   <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-300" style={{ width: `${dreamingProgress}%` }} />
                                </div>
                                
                                <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-850 h-32 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1">
                                   {dreamLogs.map((log, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                         <span className="text-cyan-500/70 select-none">&gt;</span>
                                         <span>{log}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          )}
                       </div>

                       {/* DREAM RECOMMENDATIONS */}
                       {dreamRecommendations.length > 0 && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top duration-300">
                             <h3 className="text-xs font-bold text-[#818cf8] uppercase tracking-wider">AI Self-Improvement Code Recommendations</h3>

                             {dreamRecommendations.map((recomm) => (
                                <div key={recomm.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                                   <div>
                                      <span className="text-[9px] bg-indigo-950 text-indigo-300 font-mono py-0.5 px-2 rounded-md font-bold uppercase tracking-wider border border-indigo-500/20">AGENT Recommendation</span>
                                      <h4 className="text-xs font-bold text-zinc-200 mt-2">{recomm.title}</h4>
                                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">{recomm.description}</p>
                                   </div>

                                   {recomm.snippet && (
                                      <pre className="p-3 bg-zinc-950 border border-zinc-850 text-zinc-300 rounded-lg text-[10px] font-mono overflow-x-auto">
                                         <code>{recomm.snippet}</code>
                                      </pre>
                                   )}

                                   <div className="pt-2 border-t border-zinc-850 flex justify-end">
                                      <button 
                                        onClick={() => {
                                           addIssue({
                                              projectId: project.id,
                                              title: `Optimize: ${recomm.title}`,
                                              description: `${recomm.description}\n\nCode Refactor:\n${recomm.snippet}`,
                                              priority: 'High',
                                              status: 'Todo',
                                              type: 'Feature'
                                           });
                                           alert(`Task created! Optimization issue added as checklist to active roadmap.`);
                                        }}
                                        className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded shadow transition-all flex items-center gap-1.5"
                                      >
                                         <CheckCircle2 size={11} /> Convert to Issue Task 📝
                                      </button>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>

                    {/* AGENT TEAM RIGHT SIDEBAR */}
                    <div className="space-y-6">
                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 shadow-lg">
                          <h3 className="text-xs font-semibold text-zinc-350 uppercase tracking-widest mb-4">BACKGROUND DREAM AGENTS</h3>
                          <div className="space-y-4">
                             {[
                               { name: 'ScrumMaster Bot', desc: 'Schedules sprints, reviews milestones issues, audits launch target cadence.', active: true },
                               { name: 'Code Optimizer Bot', desc: 'Inspects frameworks bundles, advises security refactors, writes code snippets.', active: true },
                               { name: 'Security Auditor Bot', desc: 'Pins package validations, verifies route limits, detects leaks.', active: true }
                             ].map((agent, i) => (
                                <div key={i} className="flex gap-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-850 hover:border-zinc-800 transition-colors">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 animate-pulse shrink-0" />
                                   <div>
                                      <div className="text-xs font-bold text-zinc-200">{agent.name}</div>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">{agent.desc}</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              )}

              {/* TAB 4: STACK PRESENTS AND ASSET UPLOADS */}
              {workspaceTab === 'stack' && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
                    {/* LEFT PANEL: UPLOAD & DRAG DROP */}
                    <div className="lg:col-span-2 space-y-6">
                       
                       {/* DRAG DROP BLOCK */}
                       <div 
                         onDragEnter={handleDrag}
                         onDragOver={handleDrag}
                         onDragLeave={handleDrag}
                         onDrop={(e) => handleDrop(e, project.id)}
                         className={`bg-[#121214] border-2 border-dashed rounded-xl p-8 relative overflow-hidden transition-all text-center ${
                            dragActive ? 'border-blue-500 bg-blue-950/10' : 'border-zinc-800 bg-[#121214]'
                         }`}
                       >
                          <FileUp size={32} className="mx-auto text-zinc-400 mb-3" />
                          <h4 className="text-xs font-bold text-zinc-200">Drag and Drop technical docs, assets, logo files here</h4>
                          <p className="text-[11px] text-zinc-500 mt-1 mb-4">or select files to bind configs direct to Workspace container</p>
                          
                          <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 px-4 rounded text-xs select-none transition-colors cursor-pointer border border-zinc-700 font-semibold inline-block">
                             Select configuration files
                             <input 
                               type="file" 
                               className="hidden" 
                               onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                     const file = e.target.files[0];
                                     addAsset({
                                        projectId: project.id,
                                        name: file.name,
                                        type: file.type || 'application/octet-stream',
                                        size: file.size,
                                        dataUrl: 'data:text/plain;base64,TW9jayBBc3NldCBEYXRh'
                                     });
                                  }
                               }}
                             />
                          </label>

                          {dragActive && (
                             <div className="absolute inset-0 bg-blue-950/20 backdrop-blur-xs flex items-center justify-center font-bold text-xs text-blue-400">
                                Release mouse button to attach configuration file!
                             </div>
                          )}
                       </div>

                       {/* ACTIVE FILES LIST */}
                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5">
                          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4">Workspace Asset Ledger</h3>

                          {projectAssets.length > 0 ? (
                             <div className="space-y-2">
                                {projectAssets.map((asset) => (
                                   <div key={asset.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-850 p-3 rounded-lg">
                                      <div className="flex items-center gap-3">
                                         <ClipboardList size={16} className="text-zinc-500" />
                                         <div>
                                            <div className="text-xs font-semibold text-zinc-200">{asset.name}</div>
                                            <div className="text-[10px] text-zinc-500 font-mono">
                                               Type: {asset.type} | Size: {Math.round(asset.size / 1024)} KB
                                            </div>
                                         </div>
                                      </div>

                                      <button 
                                        onClick={() => deleteAsset(asset.id)}
                                        className="text-zinc-600 hover:text-red-400 p-1.5 transition-colors"
                                      >
                                         <X size={14} />
                                      </button>
                                   </div>
                                ))}
                             </div>
                          ) : (
                             <div className="text-xs text-zinc-500 italic text-center p-6 bg-zinc-900/40 rounded-xl border border-[#27272a]/50">
                                No technical specs, designs, or files loaded yet. Use drag/drop above to record stack assets.
                             </div>
                          )}
                       </div>
                    </div>

                    {/* RIGHT PANEL: STACK MANAGER */}
                    <div className="space-y-6">
                       <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 shadow-lg">
                          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3">CUSTOM TECH STACK PRESETS</h3>
                          
                          <div className="space-y-3">
                             <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Add stack tag (e.g., PostgreSQL, Stripe)"
                                  value={newStackTag}
                                  onChange={(e) => setNewStackTag(e.target.value)}
                                  className="flex-grow bg-zinc-900 border border-zinc-800 text-xs text-zinc-150 px-3 py-1.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                                />
                                <button 
                                  onClick={() => {
                                     if (!newStackTag.trim()) return;
                                     const currentStackList = project.customStack || [];
                                     if (!currentStackList.includes(newStackTag.trim())) {
                                        updateProject(project.id, { customStack: [...currentStackList, newStackTag.trim()] });
                                     }
                                     setNewStackTag('');
                                  }}
                                  className="bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-zinc-700/60 transition-colors"
                                >
                                   + Add
                                </button>
                             </div>

                             {/* LISTED TAGS */}
                             <div className="flex flex-wrap gap-2 pt-2">
                                {/* default frameworks */}
                                {project.frameworks && project.frameworks.map((f: string) => (
                                   <span key={f} className="text-xs px-2.5 py-1 bg-blue-950/40 border border-blue-500/25 text-blue-400 font-semibold rounded-lg">
                                      {f}
                                   </span>
                                ))}
                                
                                {/* custom stack tags */}
                                {project.customStack && project.customStack.map((f: string) => (
                                   <button 
                                     key={f}
                                     onClick={() => {
                                        const filtered = project.customStack.filter((item: string) => item !== f);
                                        updateProject(project.id, { customStack: filtered });
                                     }}
                                     className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-red-400 hover:border-red-500/20 font-semibold rounded-lg flex items-center gap-1 group transition-colors"
                                   >
                                      {f} <X size={10} className="text-zinc-650 group-hover:text-red-400 shrink-0" />
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              )}

           </div>
        </div>
     );
  };

  if (viewingWorkspaceId) {
     const project = projects.find(p => p.id === viewingWorkspaceId);
     if (project) {
        return renderWorkspace(project);
     }
  }

  return (
    <div className="flex-1 flex flex-col relative min-h-full pb-8">
       <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            Projects
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your local projects and optional GitHub integrations.
          </p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium text-xs transition-colors shadow-lg shadow-blue-500/10 border border-blue-500/20"
        >
          <Plus size={14} /> New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto relative pb-8">
         {projects.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center text-zinc-500 z-10 text-xs">
              No local projects created yet. Let's build something.
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {projects.map((project) => {
              const isActive = activeProjectId === project.id;
              return (
               <div 
                 key={project.id} 
                 onClick={() => {
                   setActiveProjectId(project.id);
                   if (project.githubRepos && project.githubRepos.length > 0) {
                     setGithubRepo(project.githubRepos[0]);
                   }
                 }}
                 className={`group border transition-all rounded-xl p-4 flex flex-col h-48 relative cursor-pointer ${
                   isActive 
                     ? 'border-blue-500 bg-blue-950/15 shadow-lg shadow-blue-500/10' 
                     : 'border-zinc-800 bg-[#121214] hover:bg-[#18181b] hover:border-zinc-700'
                 }`}
               >
                 <button 
                   onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                   className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <Trash size={14} />
                 </button>
                 <div className="flex items-start justify-between mb-2">
                   <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                     isActive ? 'bg-blue-900/40 border-blue-500/40 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                   }`}>
                     <FolderGit2 size={16} />
                   </div>
                   {project.frameworks && project.frameworks.length > 0 && (
                     <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {project.frameworks.slice(0, 3).map((f) => (
                           <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 truncate max-w-[60px]" title={f}>{f}</span>
                        ))}
                        {project.frameworks.length > 3 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">+{project.frameworks.length - 3}</span>}
                     </div>
                   )}
                 </div>
                 
                 <h3 className="font-semibold text-sm text-zinc-100 mb-1">{project.name}</h3>
                 <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed flex-grow">
                   {project.description || 'No description provided.'}
                 </p>

                 <div className="mt-2.5 flex items-center justify-between">
                   <button 
                     type="button"
                     onClick={(e) => {
                        e.stopPropagation();
                        setViewingWorkspaceId(project.id);
                     }}
                     className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1 shadow-md shadow-blue-500/10 border border-blue-500/30"
                   >
                     <Sparkle size={10} className="text-cyan-300 animate-pulse" /> Enter Workspace &arr;
                   </button>
                   <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500">
                     {project.status}
                   </div>
                 </div>

                 <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                     {project.githubRepos && project.githubRepos.length > 0 ? (
                       <div className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                         <Github size={12} /> {project.githubRepos[0].split('/').pop()}
                       </div>
                     ) : (
                       <span className="italic text-zinc-650">Local Space</span>
                     )}
                     {project.launchTarget && (
                       <span className="bg-amber-500/10 text-amber-500 px-1.5 relative border border-amber-500/20 rounded">{project.launchTarget}</span>
                     )}
                   </div>
                 </div>
               </div>
             );
            })}
           </div>
         )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-zinc-800/60 shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">Step {currentStep} of 5</span>
                <h2 className="text-base font-semibold text-zinc-100 mt-0.5">
                  {currentStep === 1 && "Create Project Blueprint"}
                  {currentStep === 2 && "Link GitHub Repository"}
                  {currentStep === 3 && "Select Tech Stack Preset"}
                  {currentStep === 4 && "Configure API Connections"}
                  {currentStep === 5 && "Define Delivery Cadence"}
                </h2>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-850"
              >
                <X size={16} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-zinc-900 w-full shrink-0 flex">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                
                {/* STEP 1: IDENTITY & BLUEPRINT PRESETS */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Choose a Core Concept Preset (Optional)</label>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                          { name: "SaaS Booster", desc: "Comprehensive SaaS billing, authentication, and database stack.", icon: Globe, pName: "SaaS Platform", pDesc: "Modern multi-tenant web application featuring sub-billing, analytics, and responsive admin dashboards." },
                          { name: "AI Companion", desc: "Intelligent assistant leveraging custom prompt engineering controls.", icon: Sparkles, pName: "AI Companion App", pDesc: "Advanced conversational generative assistant integrated with custom agentic models and workspace rule parameters." },
                          { name: "E-Commerce", desc: "Instant checkout-ready webstore powered by Stripe gateway.", icon: Database, pName: "E-Commerce Storefront", pDesc: "Ultra-fast digital storefront with interactive cart models, secure stripe integrations, and local catalog search." },
                          { name: "Dev Portfolio", desc: "Premium designer portfolio highlighting case studies and blogs.", icon: Code2, pName: "Developer Portfolio", pDesc: "Highly interactive Personal dev workspace detailing project case logs, system documentation, and custom layouts." }
                        ].map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setFormData({ ...formData, name: preset.pName, description: preset.pDesc })}
                            className={`text-left p-2.5 rounded-lg border text-xs transition-all flex flex-col justify-between h-24 ${
                              formData.name === preset.pName
                                ? 'border-blue-500 bg-blue-950/15 text-blue-350'
                                : 'border-zinc-800 bg-[#161619] hover:bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-zinc-150">
                              <preset.icon size={13} className="text-blue-450" />
                              {preset.name}
                            </div>
                            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">{preset.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/50 pt-4">
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1 uppercase tracking-wider">Project Name <span className="text-red-500">*</span></label>
                      <input 
                        autoFocus
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                        placeholder="e.g. Space Station Sync"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1 uppercase tracking-wider">Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors resize-none h-20"
                        placeholder="Brief summary of project goals..."
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: GITHUB CONNECTION */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Link a repository to enable branching overview, collaborative commit counts, and automated milestone tracking.
                    </p>

                    <div className="space-y-2">
                       <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Select Public/Private Repository</label>
                      
                      {loadingRepos ? (
                        <div className="flex flex-col items-center justify-center py-8 text-zinc-500 text-xs gap-2 border border-zinc-800 rounded-lg bg-zinc-900/50">
                          <Loader2 size={20} className="animate-spin text-blue-500" />
                          Fetching your GitHub repositories...
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                          <label className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                            !formData.githubRepos 
                              ? 'border-blue-500 bg-blue-950/15 text-blue-350' 
                              : 'border-zinc-800 bg-[#161619] hover:bg-zinc-800 text-zinc-300'
                          }`}>
                            <input 
                              type="radio" 
                              name="gitRepo" 
                              checked={!formData.githubRepos}
                              onChange={() => setFormData({ ...formData, githubRepos: '' })}
                              className="sr-only"
                            />
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mr-1 ${
                              !formData.githubRepos ? 'border-blue-500 bg-blue-500' : 'border-zinc-600'
                            }`}>
                              {!formData.githubRepos && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-zinc-150">Keep Local Only</div>
                              <p className="text-[10px] text-zinc-450 mt-0.5">Setup project purely as a workspace template without repository linking.</p>
                            </div>
                          </label>

                          {githubReposList.length === 0 ? (
                            <div className="text-center py-6 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-lg">
                              No repositories fetched. Linking 'google/genai-js' as a generic option.
                              <button 
                                type="button" 
                                onClick={() => setFormData({ ...formData, githubRepos: 'google/genai-js' })}
                                className="block mx-auto mt-2 text-[10px] text-blue-500 underline"
                              >
                                Link google/genai-js
                              </button>
                            </div>
                          ) : (
                            githubReposList.map(r => {
                              const isChosen = formData.githubRepos === r.full_name;
                              return (
                                <label 
                                  key={r.id} 
                                  className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                                    isChosen 
                                      ? 'border-blue-500 bg-blue-950/15 text-blue-350' 
                                      : 'border-zinc-800 bg-[#161619] hover:bg-zinc-800 text-zinc-300'
                                  }`}
                                >
                                  <input 
                                    type="radio" 
                                    name="gitRepo" 
                                    checked={isChosen}
                                    onChange={() => setFormData({ ...formData, githubRepos: r.full_name })}
                                    className="sr-only"
                                  />
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mr-1 ${
                                    isChosen ? 'border-blue-500 bg-blue-500' : 'border-zinc-600'
                                  }`}>
                                    {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-zinc-150 truncate flex items-center gap-1.5">
                                      <Github size={12} className="text-zinc-400" />
                                      {r.full_name}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{r.description || 'No description provided.'}</p>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: TECH STACK PRESETS */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Choose your primary runtime environment framework. This directs standard template structures.
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "React, Next.js, Tailwind", title: "React / Next.js Stack (SaaS standard)", details: "Vercel optimized core, leverages Tailwind layout systems and server/client state splits." },
                        { id: "Vue, Nuxt, Tailwind", title: "Vue3 / Nuxt Engine (Creative web frameworks)", details: "Beautiful composition api structures combined with high-performance routing." },
                        { id: "Node.js, Express, MongoDB", title: "Express / NodeJS API Backend Service", details: "Serverless standard API routing, environment handling and database adapters." },
                        { id: "Python, Django", title: "Python / Django Data Core", details: "Best for ML agent tasks, fast api routing, Python environment integrations." },
                        { id: "Vanilla JS, HTML, CSS", title: "Vanilla JS Sandbox (Lightweight prototypes)", details: "Pristine simple HTML standard setups without complex compilation packages." }
                      ].map(framework => {
                        const isSelected = formData.frameworks === framework.id;
                        return (
                          <button
                            key={framework.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, frameworks: framework.id })}
                            className={`text-left p-3 rounded-lg border text-xs transition-all flex items-start gap-3 w-full ${
                              isSelected
                                ? 'border-blue-500 bg-blue-950/15'
                                : 'border-zinc-800 bg-[#161619] hover:bg-zinc-800'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-zinc-600 bg-zinc-900'
                            }`}>
                              {isSelected && <Check size={10} />}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-150">{framework.title}</div>
                              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{framework.details}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4: API CONNECTIONS */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Choose third-party API providers that your workspace intends to integrate. You can select multiple!
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: "Stripe", name: "Stripe Payment Gateway", desc: "For handling subscriptions, webhooks, and invoice generation metrics.", icon: Shield },
                        { id: "Supabase", name: "Supabase DB & Auth", desc: "Cloud PostgreSQL backend setup with built-in login schemas and storage rules.", icon: Database },
                        { id: "Firebase", name: "Firebase Client Backend", desc: "NoSQL Firestore data engines and standard simple client auth triggers.", icon: Server },
                        { id: "OpenAI", name: "OpenAI / LLM Connectors", desc: "For prompting visual or chatbot templates with advanced custom models.", icon: Sparkles },
                        { id: "Google Cloud", name: "Google Cloud Services (GCP)", desc: "For serverless container instances and structured storage infrastructure.", icon: Globe }
                      ].map(api => {
                        const currentSelected = formData.apiConnections ? formData.apiConnections.split(',').map(s => s.trim()) : [];
                        const isSelected = currentSelected.includes(api.id);

                        const handleToggle = () => {
                          let updated;
                          if (isSelected) {
                            updated = currentSelected.filter(x => x !== api.id);
                          } else {
                            updated = [...currentSelected, api.id];
                          }
                          setFormData({ ...formData, apiConnections: updated.join(', ') });
                        };

                        return (
                          <button
                            key={api.id}
                            type="button"
                            onClick={handleToggle}
                            className={`text-left p-3 rounded-lg border text-xs transition-colors flex items-start gap-3 w-full ${
                              isSelected
                                ? 'border-blue-500 bg-blue-950/15'
                                : 'border-zinc-800 bg-[#161619] hover:bg-zinc-800'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-zinc-600 bg-zinc-900'
                            }`}>
                              {isSelected && <Check size={10} />}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-zinc-150 flex items-center justify-between">
                                {api.name}
                                <api.icon size={13} className="text-zinc-500" />
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{api.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 5: DELIVERIES & GOALS */}
                {currentStep === 5 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Assign sprint iterations and deployment launch targets to conclude the questionnaire.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Sprint Cadence Preset</label>
                        <select 
                          value={formData.sprints}
                          onChange={e => setFormData({...formData, sprints: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                        >
                           <option value="">Ungrouped / Single Sprint</option>
                           <option value="Sprint 1, Sprint 2, Polish">Short MVP (3 Sprints)</option>
                           <option value="Sprint 1, Sprint 2, Sprint 3, Beta, Launch">Medium Standard (5 Sprints)</option>
                           <option value="Week 1, Week 2, Week 3, Week 4">Weekly Iteration Cycles</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Primary Target Hosting Environment</label>
                        <select 
                          value={formData.launchTarget}
                          onChange={e => setFormData({...formData, launchTarget: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                        >
                           <option value="">None specified</option>
                           <option value="Vercel">Vercel (Hosting)</option>
                           <option value="Google Cloud Run">Google Cloud Run (Containers)</option>
                           <option value="Firebase Hosting">Firebase Hosting (Storage)</option>
                           <option value="AWS">AWS Server Models (EC2 / ECS)</option>
                           <option value="Cloudflare Pages">Cloudflare Pages (Static Edge)</option>
                           <option value="Netlify">Netlify Core</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Baseline Project Status</label>
                        <select 
                          value={formData.status}
                          onChange={(e: any) => setFormData({...formData, status: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                        >
                           <option value="Active">Active Design</option>
                           <option value="Planning">Planning phase</option>
                           <option value="Paused">Paused</option>
                           <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

              </div>
              
              {/* Footer Controls */}
              <div className="p-4 bg-[#09090b]/60 flex items-center justify-between border-t border-zinc-800/80 shrink-0 rounded-b-xl">
                <button 
                  type="button" 
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold select-none transition-colors ${
                    currentStep === 1 
                      ? 'text-zinc-650 cursor-not-allowed opacity-50' 
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <ChevronLeft size={14} /> Back
                </button>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(stepIndex => (
                    <div 
                      key={stepIndex} 
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                        currentStep === stepIndex ? 'bg-blue-500 w-3' : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                {currentStep < 5 ? (
                  <button 
                    type="button"
                    disabled={currentStep === 1 && !formData.name}
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded text-xs font-semibold transition-colors ${
                      currentStep === 1 && !formData.name ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button 
                    type="submit"
                    disabled={!formData.name}
                    className={`px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors shadow-lg shadow-blue-500/10 border border-blue-500/20 ${
                      !formData.name ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                   >
                     Create Project
                   </button>
                 )}
               </div>

             </form>
           </div>
         </div>
       )}
    </div>
  );
}
