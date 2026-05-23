import { useState, useRef, useEffect } from 'react';
import { Sparkles, BrainCircuit, Wand2, RefreshCw, Send, Loader2, Maximize2, LayoutList, CheckSquare, Mic, StopCircle, ChevronLeft, ChevronRight, Check, X, Shield, Database, Server, Globe, FolderPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { useData } from '../context/DataProvider';

export function IdeaExpansion() {
  const { aiContextRules, activeProjectId, setActiveProjectId, addIssue, addPhase, projects, addProject } = useData();
  const [rawDump, setRawDump] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const outputEndRef = useRef<HTMLDivElement>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isEditingOutput, setIsEditingOutput] = useState(false);

  // Project Selection States
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [showNewProjectWizard, setShowNewProjectWizard] = useState(false);

  // Guided Idea Questionnaire States
  const [ideaInputTab, setIdeaInputTab] = useState<'freeform' | 'guided'>('freeform');
  const [ideaGuidedStep, setIdeaGuidedStep] = useState(1);
  const [ideaGuidedAnswers, setIdeaGuidedAnswers] = useState({
    pitch: '',
    friction: '',
    coreFeatures: '',
    stackVibe: 'SaaS App - SQLite & React'
  });

  // New Project Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: '',
    description: '',
    frameworks: 'React, TypeScript, Tailwind CSS',
    apiConnections: '',
    sprints: 'Sprint 1, Sprint 2, Polish',
    launchTarget: 'Vercel',
    status: 'Active' as const,
    featuresCount: 0,
    totalFeaturesCount: 20
  });

  useEffect(() => {
    if (activeProjectId) {
      setTargetProjectId(activeProjectId);
    } else if (projects.length > 0) {
      setTargetProjectId(projects[0].id);
    }
  }, [activeProjectId, projects]);

  const toggleRecording = () => {
    if (isRecording) {
      if ((window as any).ideaSpeechRecognitionRef) {
        (window as any).ideaSpeechRecognitionRef.stop();
      }
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onstart = () => {
          setIsRecording(true);
        };
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setRawDump(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
            
            const speechLower = finalTranscript.toLowerCase().trim();
            if (speechLower.includes('generate plan') || speechLower.includes('make plan') || speechLower.includes('compile plan')) {
               if ('speechSynthesis' in window) {
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance("Affirmative, compiling your product plan."));
               }
               setTimeout(() => {
                 const runBtn = document.getElementById('generate-mvp-btn');
                 if (runBtn) runBtn.click();
               }, 200);
            } else if (speechLower.includes('clear thoughts') || speechLower.includes('clear screen') || speechLower.includes('clear text')) {
               setRawDump('');
               if ('speechSynthesis' in window) {
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance("Cleared active input."));
               }
            } else if (speechLower.includes('mobile first')) {
               setRawDump(prev => prev + '\n- Enforce static mobile-first fluid rules.');
               if ('speechSynthesis' in window) {
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance("Adding mobile first directives."));
               }
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error("Speech error", event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        (window as any).ideaSpeechRecognitionRef = recognition;
        recognition.start();
      } else {
        alert("Speech recognition is not supported in your browser.");
      }
    }
  };

  const scrollToBottom = () => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [output]);

  const handleGenerate = async () => {
    let activeDumpText = rawDump;
    if (ideaInputTab === 'guided') {
      activeDumpText = `### Pitch / Concept\n${ideaGuidedAnswers.pitch}\n\n### Problem & Chaotic Friction\n${ideaGuidedAnswers.friction}\n\n### Core Magic Features\n${ideaGuidedAnswers.coreFeatures}\n\n### Architecture & Integrations Vibe\n${ideaGuidedAnswers.stackVibe}`;
      setRawDump(activeDumpText);
      setIdeaInputTab('freeform');
    }

    if (!activeDumpText.trim()) return;
    
    setIsGenerating(true);
    setOutput('');

    try {
      const promptText = `
        You are an expert technical product manager and software architect.
        I will provide a raw brain-dump of an idea. You must expand it into a formatted MVP plan.
        Required sections:
        - Executive Summary (1-2 sentences)
        - Core Feature Scope
        - Data Model / Architecture
        - Milestones (Phase 1, 2, 3)
        Output must be in Markdown.
        
        Raw Dump:
        ${activeDumpText}
      `;

      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
             { role: 'user', content: promptText }
          ],
          context: `You are DevSpace Idea Engine. Follow these context rules: ${aiContextRules || 'No special rules.'}`
        })
      });

      if (!response.ok) {
         throw new Error(`Server returned error: ${response.status}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let currentContent = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                currentContent += data.text;
                setOutput(currentContent);
              } else if (data.error) {
                setOutput(prev => prev + '\nError: ' + data.error);
              }
            } catch (e) {
              // Ignore parse errors from partial chunks
            }
          }
        }
      }
      if ('speechSynthesis' in window && currentContent) {
         const speech = new SpeechSynthesisUtterance("MVP product plan compiled. Milestones and features of your project are ready for mapping.");
         speech.rate = 1.05;
         window.speechSynthesis.speak(speech);
      }
    } catch (e: any) {
       setOutput('Error formatting MVP plan: ' + e.message);
    }
    
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handlePushToIssues = () => {
    if (!targetProjectId || !output) {
      alert("Please select a valid project first to push issues.");
      return;
    }
    setIsPushing(true);
    
    // Parser for phases and bullet points
    const lines = output.split('\n');
    let currentPhaseId = '';
    let phaseCount = 0;

    for (let i = 0; i < lines.length; i++) {
       const line = lines[i].trim();
       
       if (line.match(/^(###|####|##)?\s*Phase\s*\d+/i)) {
          phaseCount++;
          const phaseName = line.replace(/^(###|####|##)?/, '').trim();
          
          let nextMonth = new Date().getMonth() + phaseCount;
          let year = new Date().getFullYear();
          if (nextMonth > 11) {
            nextMonth -= 12;
            year++;
          }
          
          const startDate = `${year}-${String(nextMonth + 1).padStart(2, '0')}-01`;
          const endDate = '1';
          
          const colors = [
             'text-blue-500 bg-blue-500 border-blue-500', 
             'text-amber-500 bg-amber-500 border-amber-500', 
             'text-emerald-500 bg-emerald-500 border-emerald-500', 
             'text-purple-500 bg-purple-500 border-purple-500'
          ];
          
          addPhase({
             projectId: targetProjectId,
             name: phaseName,
             startDate,
             endDate,
             color: colors[phaseCount % colors.length]
          });
       } else if (line.match(/^-\s+/) || line.match(/^\*\s+/)) {
          const title = line.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim();
          if (title.length > 5) {
             addIssue({
               projectId: targetProjectId,
               title: title.slice(0, 80),
               description: title.length > 80 ? title : undefined,
               type: 'Task',
               status: 'Todo',
               priority: 'Medium'
             });
          }
       }
    }
    
    setTimeout(() => {
      setIsPushing(false);
      setActiveProjectId(targetProjectId);
      alert("Tasks and phases successfully pushed to issues!");
    }, 500);
  };

  // Submit Wizard Questionnaire and Create New Project
  const handleCreateProjectFromWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardData.name.trim()) return;

    const projectId = addProject({
      name: wizardData.name,
      description: wizardData.description,
      frameworks: wizardData.frameworks.split(',').map(f => f.trim()),
      apiConnections: wizardData.apiConnections ? wizardData.apiConnections.split(',').map(a => ({ name: a.trim() })) : [],
      launchTarget: wizardData.launchTarget,
      status: wizardData.status,
      featuresCount: wizardData.featuresCount,
      totalFeaturesCount: wizardData.totalFeaturesCount,
      progressPercent: 0,
      daysUntilAddition: 30,
      customStack: wizardData.frameworks.split(',').map(f => f.trim()),
      seenRecommendedIdeas: [],
      brainstormIdeas: []
    });

    setTargetProjectId(projectId);
    setActiveProjectId(projectId);
    setShowNewProjectWizard(false);
    
    // Reset questionnaire
    setCurrentStep(1);
    setWizardData({
      name: '',
      description: '',
      frameworks: 'React, TypeScript, Tailwind CSS',
      apiConnections: '',
      sprints: 'Sprint 1, Sprint 2, Polish',
      launchTarget: 'Vercel',
      status: 'Active',
      featuresCount: 0,
      totalFeaturesCount: 20
    });

    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance("Project successfully created. You can now push your generated MVP plan directly."));
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            Idea Expansion <BrainCircuit size={18} className="text-pink-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Drop raw brain-dumps here. AI will structure it into an actionable MVP product plan.
          </p>
        </div>
        <button 
          id="generate-mvp-btn"
          onClick={handleGenerate}
          disabled={((ideaInputTab === 'freeform' ? !rawDump.trim() : !ideaGuidedAnswers.pitch.trim())) || isGenerating}
          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm shadow-pink-500/20"
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          Generate MVP Plan
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Input Side with Freeform / Guided Tabs */}
        <div className="w-1/3 flex flex-col border border-zinc-800 bg-[#121214] rounded-xl overflow-hidden min-h-0 shrink-0 text-left">
          <div className="px-3 py-2 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 p-0.5 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => setIdeaInputTab('freeform')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition select-none ${
                  ideaInputTab === 'freeform'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Freeform Dump
              </button>
              <button
                type="button"
                onClick={() => setIdeaInputTab('guided')}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition select-none flex items-center gap-1 ${
                  ideaInputTab === 'guided'
                    ? 'bg-pink-950/40 text-pink-400 border border-pink-700/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Guided Wizard
                <Sparkles size={10} className="text-pink-400 animate-pulse" />
              </button>
            </div>
            
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
               <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Plan Synthesizer</span>
            </div>
          </div>

          <div className="flex-1 p-3 flex flex-col relative min-h-0 overflow-y-auto">
             {ideaInputTab === 'freeform' ? (
               <div className="flex-1 flex flex-col min-h-0">
                 <textarea 
                   value={rawDump}
                   onChange={(e) => setRawDump(e.target.value)}
                   placeholder="Dump your chaotic thoughts here... e.g. 'I want to build a time tracker for writers but it needs to yell at you when you stop typing for 30s...'"
                   className="w-full flex-grow bg-transparent border-none outline-none text-sm text-zinc-300 placeholder:text-zinc-650 resize-none font-mono leading-relaxed"
                   autoFocus
                 />
                 {isRecording && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-[#09090b]/90 backdrop-blur-md border border-zinc-800 rounded-lg py-1 px-2 text-[10px] text-zinc-300 shadow-md">
                       <div className="flex gap-0.5 items-end justify-center h-4 w-10">
                          {[1, 2, 3, 4, 1, 2].map((bar, idx) => (
                             <div 
                                key={idx} 
                                className="w-0.5 bg-amber-400 rounded-full animate-pulse shrink-0"
                                style={{ 
                                   height: bar * 4 + 'px', 
                                   animationDuration: (0.4 + idx * 0.1) + 's' 
                                }}
                             />
                          ))}
                       </div>
                       <span className="font-mono text-[9px] text-zinc-400">Vocal flow active...</span>
                    </div>
                 )}
                 <div className="absolute bottom-3 right-3 flex items-center justify-end">
                   <button 
                     onClick={toggleRecording}
                     className={`p-2 rounded-full transition-all shadow-md flex items-center gap-2 ${
                        isRecording 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' 
                          : 'bg-[#1a1a1e] hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
                     }`}
                     title="Toggle Voice Dictation"
                   >
                     {isRecording ? <StopCircle size={14} /> : <Mic size={14} />}
                     {isRecording && <span className="text-[10px] font-medium pr-1">Listening...</span>}
                   </button>
                 </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col justify-between min-h-0">
                 <div className="space-y-4">
                   <div className="flex justify-between items-center bg-zinc-950 p-2 border border-zinc-850 rounded">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Concept Step {ideaGuidedStep}/4</span>
                      <span className="text-[10px] font-mono text-pink-400">{100 * (ideaGuidedStep / 4)}% Complete</span>
                   </div>

                   {/* Step 1: Elevator Pitch */}
                   {ideaGuidedStep === 1 && (
                     <div className="space-y-2 animate-in fade-in duration-200">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Elevator Pitch & Name</label>
                        <p className="text-[10px] text-zinc-500 leading-normal">What is the high-level concept or core title of this application?</p>
                        <textarea
                          value={ideaGuidedAnswers.pitch}
                          onChange={e => setIdeaGuidedAnswers({ ...ideaGuidedAnswers, pitch: e.target.value })}
                          placeholder="e.g. Writers Time Sandbox - a minimalist desktop utility that enforces focus flow."
                          className="w-full h-28 bg-[#09090b] border border-zinc-800 rounded p-2 text-xs text-zinc-200 outline-none focus:border-pink-500 transition-colors resize-none"
                        />
                     </div>
                   )}

                   {/* Step 2: Problem & Chaotic Friction */}
                   {ideaGuidedStep === 2 && (
                     <div className="space-y-2 animate-in fade-in duration-200">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Chaotic Friction / Target Pain Point</label>
                        <p className="text-[10px] text-zinc-500 leading-normal">What specific problem keeps occurring that this application will bypass?</p>
                        <textarea
                          value={ideaGuidedAnswers.friction}
                          onChange={e => setIdeaGuidedAnswers({ ...ideaGuidedAnswers, friction: e.target.value })}
                          placeholder="e.g. Writers halt mid-sentence and open twitter, losing hours of productive states."
                          className="w-full h-28 bg-[#09090b] border border-[#27272a] rounded p-2 text-xs text-zinc-200 outline-none focus:border-pink-500 transition-colors resize-none"
                        />
                     </div>
                   )}

                   {/* Step 3: Core Features & Magic Moments */}
                   {ideaGuidedStep === 3 && (
                     <div className="space-y-2 animate-in fade-in duration-200">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Standing Magic Features</label>
                        <p className="text-[10px] text-zinc-500 leading-normal">What are 2-3 essential features or events that define the product?</p>
                        <textarea
                          value={ideaGuidedAnswers.coreFeatures}
                          onChange={e => setIdeaGuidedAnswers({ ...ideaGuidedAnswers, coreFeatures: e.target.value })}
                          placeholder="e.g. 1. Screen goes red/rings when user stops typing for 30 seconds. 2. Auto-save drafts to local vector cache. 3. Mono-spaced fullscreen writing room."
                          className="w-full h-28 bg-[#09090b] border border-[#27272a] rounded p-2 text-xs text-zinc-200 outline-none focus:border-pink-500 transition-colors resize-none"
                        />
                     </div>
                   )}

                   {/* Step 4: Tech Stack Vibe */}
                   {ideaGuidedStep === 4 && (
                     <div className="space-y-2 animate-in fade-in duration-200">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Technology Stack & Platform</label>
                        <p className="text-[10px] text-zinc-500 leading-normal">Specify framework requirements or deployment environments:</p>
                        <select
                          value={ideaGuidedAnswers.stackVibe}
                          onChange={e => setIdeaGuidedAnswers({ ...ideaGuidedAnswers, stackVibe: e.target.value })}
                          className="w-full bg-[#09090b] border border-[#27272a] rounded p-2.5 text-xs text-zinc-200 outline-none focus:border-pink-500 transition-colors"
                        >
                           <option value="SaaS React Web App with LocalStorage">React Web App - Simple & Local</option>
                           <option value="Mobile Core - Expo / Tamagui Mobile Stack">Mobile App - Expo / Tamagui Native</option>
                           <option value="Cloud Sync Node Backend & Supabase Postgres">Full-stack - Node, Express, pgvector</option>
                           <option value="Static HTML5 Canvas / Retro Brutalist Core">Lightweight Single-Screen HTML Landing</option>
                        </select>
                        <div className="p-2 border border-dashed border-zinc-850 rounded bg-[#101013] text-[10px] text-zinc-400 mt-2">
                          <span className="font-semibold text-[10px] text-zinc-300 block mb-1">Preview of compiled prompt:</span>
                          This questionnaire will compile directly into structural prompts and load the active agent models on Port 3000.
                        </div>
                     </div>
                   )}
                 </div>

                 <div className="pt-4 border-t border-zinc-850/70 flex items-center justify-between">
                   <button
                     type="button"
                     disabled={ideaGuidedStep === 1}
                     onClick={() => setIdeaGuidedStep(prev => prev - 1)}
                     className="px-2.5 py-1 text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded disabled:opacity-40 transition"
                   >
                     Back
                   </button>

                   <div className="flex items-center gap-1">
                     {[1, 2, 3, 4].map(num => (
                       <div
                         key={num}
                         className={`w-1 h-1 rounded-full transition-all ${
                           ideaGuidedStep === num ? 'bg-pink-500 w-2.5' : 'bg-zinc-750'
                         }`}
                       />
                     ))}
                   </div>

                   {ideaGuidedStep < 4 ? (
                     <button
                       type="button"
                       onClick={() => setIdeaGuidedStep(prev => prev + 1)}
                       className="px-3 py-1 bg-zinc-800 text-zinc-200 hover:text-white rounded text-[10px] font-semibold transition"
                     >
                       Next
                     </button>
                   ) : (
                     <button
                       type="button"
                       onClick={handleGenerate}
                       className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded text-[10px] font-semibold transition shadow shadow-pink-500/10"
                     >
                       Compile MVP Plan
                     </button>
                   )}
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Output Side */}
        <div className="flex-1 flex flex-col border border-zinc-800 bg-[#121214] rounded-xl overflow-hidden min-h-0">
          <div className="px-4 py-3 border-b border-zinc-800 bg-[#09090b] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
             <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-pink-400" />
                <h3 className="text-xs font-semibold text-zinc-200">Structured Output</h3>
             </div>
             
             {/* Dynamic Project Targets & Push controls */}
             <div className="flex flex-wrap gap-2 items-center">
                {output && (
                   <>
                     <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs">
                       <span className="text-zinc-500 text-[10px]">Target Project:</span>
                       <select 
                         value={targetProjectId}
                         onChange={(e) => {
                           if (e.target.value === 'NEW_WIZARD') {
                             setShowNewProjectWizard(true);
                           } else {
                             setTargetProjectId(e.target.value);
                           }
                         }}
                         className="bg-transparent border-none text-[11px] font-medium text-zinc-200 outline-none p-0 cursor-pointer min-w-[120px]"
                       >
                         {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                         ))}
                         <option value="NEW_WIZARD" className="text-pink-400 font-semibold">+ Start New Project Wizard</option>
                       </select>
                     </div>

                     <button 
                        onClick={() => setIsEditingOutput(!isEditingOutput)} 
                        className={`text-[10px] px-2 py-1.5 rounded transition select-none flex items-center gap-1 border ${
                          isEditingOutput 
                            ? 'bg-pink-950/40 text-pink-300 border-pink-700/40 hover:bg-pink-900/40' 
                            : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-zinc-200 border-zinc-700'
                        } font-medium font-sans`}
                     >
                        {isEditingOutput ? 'Preview' : 'Edit Plan'}
                     </button>
                   </>
                )}
                
                <button onClick={handleCopy} className="text-[10px] bg-zinc-800 px-2 py-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition flex items-center gap-1 border border-zinc-700">
                  <LayoutList size={12} /> {isCopying ? 'Copied!' : 'Copy Plan'}
                </button>

                <button onClick={handlePushToIssues} disabled={isPushing} className="text-[10px] bg-pink-650 px-2.5 py-1.5 rounded text-white hover:bg-pink-500 transition flex items-center gap-1 border border-pink-500/30 disabled:opacity-50 font-semibold select-none">
                  {isPushing ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />} Push to Issues
                </button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-[#0c0c0e]">
             {output ? (
                isEditingOutput ? (
                   <textarea 
                     value={output}
                     onChange={(e) => setOutput(e.target.value)}
                     className="w-full h-full bg-transparent border-none outline-none text-xs text-pink-400 font-mono resize-none leading-relaxed focus:ring-0 whitespace-pre"
                     placeholder="Refine product specifications, goals, or milestones..."
                   />
                ) : (
                   <div className="markdown-body prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#121214] prose-pre:border prose-pre:border-zinc-800 max-w-none text-sm">
                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{output}</Markdown>
                      <div ref={outputEndRef} />
                   </div>
                )
             ) : (
                <div className="h-full flex items-center justify-center flex-col text-zinc-500 opacity-60">
                   {isGenerating ? (
                      <>
                         <Loader2 size={32} className="animate-spin mb-4" />
                         <p className="text-sm text-zinc-300">Synthesizing constraints and formulating scope...</p>
                      </>
                   ) : (
                      <>
                         <Maximize2 size={32} className="mb-4 text-zinc-600" />
                         <p className="text-sm text-center max-w-sm text-zinc-400">
                            Awaiting unstructured input. Dump your brain and we will synthesize an actionable product scaffold.
                         </p>
                      </>
                   )}
                </div>
             )}
          </div>
        </div>

      </div>

      {/* GORGEOUS STEP-BY-STEP QUESTIONNAIRE MODAL (Wizard Style) */}
      <AnimatePresence>
        {showNewProjectWizard && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-zinc-800/80 bg-[#09090b]">
                <div className="flex items-center gap-2">
                  <FolderPlus size={16} className="text-pink-400 animate-pulse" />
                  <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">Project Setup Questionnaire</h2>
                </div>
                <button onClick={() => { setShowNewProjectWizard(false); setCurrentStep(1); }} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateProjectFromWizard} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                  
                  {/* STEP 1: Name and Description */}
                  {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Project Name</label>
                        <input 
                          autoFocus
                          required
                          value={wizardData.name}
                          onChange={e => setWizardData({...wizardData, name: e.target.value})}
                          placeholder="e.g. Writers Time Sandbox"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-pink-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Description</label>
                        <textarea 
                          required
                          value={wizardData.description}
                          onChange={e => setWizardData({...wizardData, description: e.target.value})}
                          placeholder="A quick summary of goals and architectural context of the product..."
                          className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-pink-500 transition-colors resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: TECH STACK SELECTOR */}
                  {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <p className="text-xs text-zinc-400">Select base stack presets or customize directly:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: "React, TypeScript, Tailwind CSS", title: "Indie Web (React / TS / Tailwind)", desc: "Pristine UI components, client-side persistence, rapid layout designs." },
                          { id: "React Native, Expo, Tamagui", title: "Mobile Core Hub (React Native / Expo)", desc: "Native touch views, fast feedback cycles, adaptive overlays." },
                          { id: "Node.js, Express, MongoDB", title: "Express / NodeJS API Engine", desc: "Serverless standard API routing, environment handling and database adapters." }
                        ].map(framework => {
                          const isSelected = wizardData.frameworks === framework.id;
                          return (
                            <button
                              key={framework.id}
                              type="button"
                              onClick={() => setWizardData({ ...wizardData, frameworks: framework.id })}
                              className={`text-left p-3 rounded-lg border text-xs transition-all flex items-start gap-3 w-full ${
                                isSelected ? 'border-pink-500 bg-pink-950/10' : 'border-zinc-800 bg-[#161619] hover:bg-zinc-800'
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-pink-500 bg-pink-650 text-white' : 'border-zinc-650 bg-zinc-900'
                              }`}>
                                {isSelected && <Check size={10} />}
                              </div>
                              <div>
                                <div className="font-semibold text-zinc-200">{framework.title}</div>
                                <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{framework.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: API SERVICE CONNECTIONS */}
                  {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <p className="text-xs text-zinc-400">Choose API engines that will form your product landscape:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: "Stripe", name: "Stripe Payment Gateway", desc: "For handling indie subscriptions and checkouts.", icon: Shield },
                          { id: "Supabase", name: "Supabase Postgres DB", desc: "PostgreSQL databases and secure cloud tables.", icon: Database },
                          { id: "Firebase", name: "Firebase Backend Core", desc: "NoSQL Firestore structures and quick OAuth routes.", icon: Server },
                          { id: "OpenAI", name: "LLM Generative Copilot", desc: "Connects LLMs directly to workspace assets.", icon: Sparkles }
                        ].map(api => {
                          const currentSelected = wizardData.apiConnections ? wizardData.apiConnections.split(',').map(s => s.trim()) : [];
                          const isSelected = currentSelected.includes(api.id);

                          const handleToggle = () => {
                            let updated;
                            if (isSelected) {
                              updated = currentSelected.filter(x => x !== api.id);
                            } else {
                              updated = [...currentSelected, api.id];
                            }
                            setWizardData({ ...wizardData, apiConnections: updated.join(', ') });
                          };

                          return (
                            <button
                              key={api.id}
                              type="button"
                              onClick={handleToggle}
                              className={`text-left p-3 rounded-lg border text-xs transition-colors flex items-start gap-3 w-full ${
                                isSelected ? 'border-pink-500 bg-pink-950/10' : 'border-zinc-800 bg-[#161619] hover:bg-zinc-800'
                              }`}
                            >
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-pink-500 bg-pink-650 text-white' : 'border-zinc-650 bg-zinc-900'
                              }`}>
                                {isSelected && <Check size={10} />}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-zinc-200 flex items-center justify-between">
                                  {api.name}
                                  <api.icon size={13} className="text-zinc-500" />
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{api.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: TIMELINE, HOSTING & METRICS */}
                  {currentStep === 4 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Sprints Sequence</label>
                        <select 
                          value={wizardData.sprints}
                          onChange={e => setWizardData({...wizardData, sprints: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-pink-500 transition-colors"
                        >
                           <option value="Sprint 1, Sprint 2, Polish">Minimalist (3 Sprints)</option>
                           <option value="Sprint 1, Sprint 2, Sprint 3, Beta, Launch">Dynamic Indy (5 Sprints)</option>
                           <option value="Week 1, Week 2, Week 3, Week 4">Standard Multi-Week Loop</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Primary Target Hosting</label>
                        <select 
                          value={wizardData.launchTarget}
                          onChange={e => setWizardData({...wizardData, launchTarget: e.target.value})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-pink-500 transition-colors"
                        >
                           <option value="Vercel">Vercel Setup</option>
                           <option value="Google Cloud Run">Google Cloud Run (Containers)</option>
                           <option value="Firebase Hosting">Firebase hosting rules</option>
                           <option value="Netlify">Netlify Static Pages</option>
                        </select>
                      </div>
                    </div>
                  )}

                </div>

                {/* Wizard Footer Controls */}
                <div className="p-4 bg-[#09090b]/80 flex items-center justify-between border-t border-zinc-800/80 shrink-0 rounded-b-xl">
                  <button 
                    type="button" 
                    disabled={currentStep === 1}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map(idx => (
                      <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          currentStep === idx ? 'bg-pink-500 w-3' : 'bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>

                  {currentStep < 4 ? (
                    <button 
                      type="button"
                      disabled={currentStep === 1 && !wizardData.name}
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold transition-colors"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      className="px-4 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded text-xs font-semibold transition-colors border border-pink-500/20 shadow-lg shadow-pink-500/15"
                    >
                      Create from Questionnaire
                    </button>
                  )}
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
