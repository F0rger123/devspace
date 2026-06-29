import { Calendar, ChevronLeft, ChevronRight, Loader2, Target, Plus, X, ListTodo, Presentation, Rocket, Focus, AlertCircle, ExternalLink, Sparkles, LayoutList, Check, Mic, Send, CheckCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell } from 'recharts';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getHexForPhaseColor = (colorClass: string) => {
  if (colorClass.includes('blue')) return '#3b82f6';
  if (colorClass.includes('purple')) return '#a855f7';
  if (colorClass.includes('emerald')) return '#10b981';
  if (colorClass.includes('rose')) return '#f43f5e';
  if (colorClass.includes('amber')) return '#f59e0b';
  return '#3b82f6';
};

export function Roadmap() {
  const { projects, issues, phases, addPhase, updatePhase, deletePhase, addIssue, updateIssue, activeProjectId, setActiveProjectId } = useData();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({ 
    name: '', 
    goal: '',
    startMonth: 0, 
    duration: 1, 
    color: 'text-blue-500 bg-blue-500 border-blue-500' 
  });

  // Voice Command & Natural Language Smart Architect Console states
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [successLogs, setSuccessLogs] = useState<string[]>([]);

  const handleToggleListening = () => {
    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Web Speech API is not supported in this browser environment. You can type commands manually in the console bar below!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          setVoiceError("Microphone permission was denied inside the application preview. Please grant access or type manually.");
        } else {
          setVoiceError(`Audio capture notification: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
      };

      recognition.start();
    } catch (e: any) {
      setVoiceError(`Audio module initialization warning: ${e.message}`);
      setIsListening(false);
    }
  };

  const handleExecuteVoiceCommand = async (commandToExecute?: string) => {
    const activeCommand = commandToExecute !== undefined ? commandToExecute : voiceText;
    if (!activeCommand.trim()) return;

    setIsProcessingVoice(true);
    setVoiceError(null);

    const activeProject = projects.find(p => p.id === activeProjectId);

    const promptText = `
You are an expert AI scrum master assistant compiled into the SaaS Project OS.
Process this spoken voice typing intent: "${activeCommand}"

Context Details:
Active Project ID: "${activeProjectId || ""}"
Active Project Name: "${activeProject?.name || ""}"
Current Roadmap Phases: ${JSON.stringify(activePhases.map(p => ({ id: p.id, name: p.name, startMonth: p.startMonth, duration: p.duration, goal: p.goal || "" })))}
Current Issue/Tasks: ${JSON.stringify(issues.filter(i => i.projectId === activeProjectId).map(i => ({ id: i.id, title: i.title, priority: i.priority, status: i.status })))}

You MUST convert this spoken command into one or more operations on the roadmap.
Return a RAW JSON array of actions wrapped inside standard markdown code block: \`\`\`json ... \`\`\`.
Do not output any introductory or concluding text.

JSON Schema format:
{
  "actions": [
    {
      "type": "CREATE_PHASE",
      "payload": {
        "name": "Phase Name",
        "goal": "Describe goal clearly",
        "startMonth": 5, // 0-indexed month (0=Jan, 1=Feb, 2=Mar, 3=Apr, 4=May, 5=Jun, 6=Jul, 7=Aug, 8=Sep, 9=Oct, 10=Nov, 11=Dec)
        "duration": 6, // number of months (1 to 12)
        "color": "text-blue-500 bg-blue-500 border-blue-500" // or emerald-500, purple-500, rose-500, amber-500
      }
    },
    {
      "type": "UPDATE_PHASE",
      "payload": {
        "phaseId": "match existing phase id from the context",
        "goal": "updated objectives",
        "name": "updated name if specified"
      }
    },
    {
      "type": "ADD_ISSUE",
      "payload": {
        "title": "Task title",
        "priority": "Medium", // Low, Medium, High, Critical
        "phaseId": "match phase uuid if can, otherwise leave empty",
        "status": "To Do" // or Done if they said "I finished / completed this"
      }
    },
    {
      "type": "COMPLETE_ISSUE",
      "payload": {
        "issueId": "match existing issue id from context for completion"
      }
    }
  ]
}
`;

    try {
      const response = await fetch("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText }],
          context: `You are ScrumMaster Agent compiling voice typing intent to structural JSON commands.`,
        }),
      });

      let accumText = "";
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const inner = line.slice(6).trim();
              if (inner === "[DONE]") continue;
              try {
                const parsed = JSON.parse(inner);
                if (parsed.text) accumText += parsed.text;
              } catch {}
            }
          }
        }
      }

      // Now extract and parse the JSON block
      const jsonStart = accumText.indexOf("```json");
      const jsonEnd = accumText.lastIndexOf("```");
      let jsonString = accumText;
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonString = accumText.slice(jsonStart + 7, jsonEnd).trim();
      } else if (accumText.includes("{")) {
        // Fallback trace
        const firstBrace = accumText.indexOf("{");
        const lastBrace = accumText.lastIndexOf("}");
        jsonString = accumText.slice(firstBrace, lastBrace + 1);
      }

      const parsedResult = JSON.parse(jsonString);
      if (parsedResult && Array.isArray(parsedResult.actions)) {
        let executedLogs: string[] = [];
        
        for (const act of parsedResult.actions) {
          if (act.type === "CREATE_PHASE" && activeProjectId) {
            const year = new Date().getFullYear();
            const monthStr = (act.payload.startMonth + 1).toString().padStart(2, '0');
            addPhase({
              projectId: activeProjectId,
              name: act.payload.name,
              startDate: `${year}-${monthStr}-01`,
              endDate: act.payload.duration.toString(),
              color: act.payload.color || "text-blue-500 bg-blue-500 border-blue-500",
              goal: act.payload.goal
            });
            executedLogs.push(`🚀 Created Phase: "${act.payload.name}" starting in month idx ${act.payload.startMonth} with goal: "${act.payload.goal}"`);
          } 
          else if (act.type === "UPDATE_PHASE") {
            updatePhase(act.payload.phaseId, {
              ...(act.payload.goal ? { goal: act.payload.goal } : {}),
              ...(act.payload.name ? { name: act.payload.name } : {})
            });
            executedLogs.push(`⚙️ Updated objectives for phase ID: ${act.payload.phaseId}`);
          }
          else if (act.type === "ADD_ISSUE" && activeProjectId) {
            const pId = act.payload.phaseId || (activePhases[0]?.id || "");
            addIssue({
              projectId: activeProjectId,
              title: act.payload.title,
              description: "Voice-typed collaborative task constraint.",
              type: "Task",
              status: act.payload.status === "To Do" || act.payload.status === "Todo" || !act.payload.status ? "Todo" : (act.payload.status === "In Progress" ? "In Progress" : "Done"),
              priority: act.payload.priority || "Medium",
              phaseId: pId || undefined,
            });
            executedLogs.push(`📝 Added task "${act.payload.title}" (${act.payload.status || "Todo"}) to phase ID "${pId}"`);
          }
          else if (act.type === "COMPLETE_ISSUE") {
            let targetId = act.payload.issueId;
            if (targetId === "AUTO_FIRST" || !targetId || !issues.some(iss => iss.id === targetId)) {
              const activeProjIssues = issues.filter(i => i.projectId === activeProjectId && i.status !== "Done");
              if (activeProjIssues.length > 0) {
                targetId = activeProjIssues[0].id;
              }
            }
            if (targetId && issues.some(iss => iss.id === targetId)) {
              updateIssue(targetId, { status: "Done" });
              const foundIssue = issues.find(i => i.id === targetId);
              executedLogs.push(`✅ Marked task "${foundIssue?.title || 'Active Task'}" as Completed!`);
            } else {
              executedLogs.push(`⚠️ No open tasks found to mark as completed.`);
            }
          }
        }

        if (executedLogs.length > 0) {
          setSuccessLogs(executedLogs);
          setVoiceText('');
          // Auto clear logs after 8 seconds
          setTimeout(() => setSuccessLogs([]), 8000);
        } else {
          setVoiceError("The AI interpreted the voice command but could not extract active changes. Try saying: 'Add task [Name] to Phase [PhaseName]'");
        }
      } else {
        setVoiceError("Could not compile voice intent into structured changes. Try a cleaner request form.");
      }
    } catch (err: any) {
      console.error(err);
      setVoiceError(`Failed compile translation: ${err.message}. Try checking formatting specifications.`);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const activeIssuesWithDates = useMemo(() => {
    return issues.filter(i => i.projectId === activeProjectId && i.dueDate).map(issue => {
      const d = new Date(issue.dueDate!);
      const monthProgress = ((d.getMonth() + (d.getDate() / 31)) / 12) * 100;
      return { ...issue, monthProgress, d };
    }).sort((a, b) => a.d.getTime() - b.d.getTime());
  }, [issues, activeProjectId]);

  const activePhases = useMemo(() => {
    return phases.filter(p => p.projectId === activeProjectId).map(phase => {
      const phaseIssues = issues.filter(i => i.phaseId === phase.id);
      const open = phaseIssues.filter(i => i.status !== 'Done').length;
      const closed = phaseIssues.filter(i => i.status === 'Done').length;
      const total = open + closed;
      const progress = total === 0 ? 0 : Math.round((closed / total) * 100);

      return {
        ...phase,
        open,
        closed,
        total,
        progress,
        startMonth: parseInt(phase.startDate.split('-')[1]) - 1 || 0,
        duration: parseInt(phase.endDate) || 1, // storing duration in endDate for this simplified demo
      };
    }).sort((a, b) => a.startMonth - b.startMonth);
  }, [phases, issues, activeProjectId]);

  const overallStats = useMemo(() => {
    let totalIssues = 0;
    let closedIssues = 0;
    
    activePhases.forEach(p => {
      totalIssues += p.total;
      closedIssues += p.closed;
    });

    const completionRate = totalIssues === 0 ? 0 : Math.round((closedIssues / totalIssues) * 100);
    const completedPhases = activePhases.filter(p => p.progress === 100 && p.total > 0).length;

    return { totalIssues, closedIssues, completionRate, completedPhases, totalPhases: activePhases.length };
  }, [activePhases]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !activeProjectId) return;
    
    const year = new Date().getFullYear();
    const monthStr = (formData.startMonth + 1).toString().padStart(2, '0');
    
    addPhase({
      projectId: activeProjectId,
      name: formData.name,
      startDate: `${year}-${monthStr}-01`,
      endDate: formData.duration.toString(),
      color: formData.color,
      goal: formData.goal || undefined
    });
    
    setShowModal(false);
    setCurrentStep(1);
    setFormData({ 
      name: '', 
      goal: '',
      startMonth: 0, 
      duration: 1, 
      color: 'text-blue-500 bg-blue-500 border-blue-500' 
    });
  };

  const getGradientsForColor = (classes: string) => {
     if (classes.includes('blue')) return 'from-blue-500/80 to-blue-600/30 border-blue-400 shadow-blue-500/20';
     if (classes.includes('purple')) return 'from-purple-500/80 to-purple-600/30 border-purple-400 shadow-purple-500/20';
     if (classes.includes('emerald')) return 'from-emerald-500/80 to-emerald-600/30 border-emerald-400 shadow-emerald-500/20';
     if (classes.includes('rose')) return 'from-rose-500/80 to-rose-600/30 border-rose-400 shadow-rose-500/20';
     if (classes.includes('amber')) return 'from-amber-500/80 to-amber-600/30 border-amber-400 shadow-amber-500/20';
     return 'from-blue-500 to-cyan-500 border-blue-400';
  };

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId);
  }, [projects, activeProjectId]);

  return (
    <div className="flex flex-col h-full overflow-hidden pb-4 relative">
      <div className="flex items-center justify-between mb-6 animate-in fade-in duration-350">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            Roadmap <Target size={18} className="text-emerald-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Visual timeline for phases and track progress.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center bg-[#121214] border border-zinc-800 rounded-md">
            <span className="text-zinc-500 pl-3 text-xs">Project:</span>
            <select 
              value={activeProjectId || ''}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-transparent border-none text-xs text-zinc-200 py-1.5 px-2 focus:ring-0 outline-none w-36"
            >
              {projects.length === 0 && <option value="">No projects</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => { if(activeProjectId) { setCurrentStep(1); setShowModal(true); } }}
            disabled={!activeProjectId}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium text-xs transition-colors shadow-lg shadow-blue-500/10 border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> New Phase
          </button>
        </div>
      </div>

      {activeProject && (
         <div className="bg-[#121214] border border-zinc-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-350">
            <div>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-semibold border border-blue-500/20">WORKSPACE HEALTH</span>
                  {activeProject.websiteUrl ? (
                     <a href={activeProject.websiteUrl.startsWith('http') ? activeProject.websiteUrl : `https://${activeProject.websiteUrl}`} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 text-[11px]">
                         <ExternalLink size={10} /> {activeProject.websiteUrl}
                     </a>
                  ) : (
                     <span className="text-[10px] text-zinc-550 italic">No web link</span>
                  )}
               </div>
               <h2 className="text-sm font-semibold text-zinc-150 mt-1">{activeProject.name} Workspace</h2>
               <p className="text-[11px] text-zinc-400 line-clamp-1 max-w-lg mt-0.5">{activeProject.description}</p>
            </div>

            <div className="w-full md:w-64 shrink-0">
               <div className="flex items-center justify-between text-[11px] mb-1 text-zinc-400">
                    <span>Features Tracker</span>
                    <span className="font-semibold text-zinc-100">{activeProject.featuresCount || 0} / {activeProject.totalFeaturesCount || 10} Built</span>
               </div>
               <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/80">
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((activeProject.featuresCount || 0) / (activeProject.totalFeaturesCount || 10)) * 100))}%` }} />
               </div>
               <p className="text-[9px] text-zinc-500 mt-1 flex justify-between font-mono">
                  <span>Going public progress: {activeProject.progressPercent || 0}%</span>
                  <span>{activeProject.daysUntilAddition || 30} days until next release</span>
               </p>
            </div>

            <div className="flex items-center gap-5 text-right shrink-0">
               {activeProject.frameworks && activeProject.frameworks.length > 0 && (
                  <div className="border-r border-zinc-800 pr-5 text-left hidden sm:block">
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">PRIMARY STACK</div>
                      <span className="text-xs text-zinc-300 font-medium truncate max-w-[120px] block">{activeProject.frameworks[0]}</span>
                  </div>
               )}
               <div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">WORKSPACE STATE</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500">{activeProject.status}</div>
               </div>
            </div>
         </div>
      )}

      {/* COGNITIVE VOICE & NATURAL LANGUAGE ARCHITECT CONSOLE */}
      {activeProjectId && (
        <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-zinc-850 pb-3 mb-4 gap-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <span className="flex h-2 w-2 relative">
                  {isListening && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isListening ? 'bg-emerald-500' : 'bg-zinc-600'}`}></span>
                </span>
                🎙️ Cognitive Voice & Natural Language Architect
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Directly dictate roadmap modifications or type commands. The ScrumMaster agent compiles spoken parameters into active roadmap migrations.
              </p>
            </div>
            {isListening && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="h-4 w-0.5 bg-emerald-500 animate-[bounce_0.8s_infinite_-0.2s]"></span>
                <span className="h-5 w-0.5 bg-emerald-400 animate-[bounce_0.8s_infinite]"></span>
                <span className="h-3 w-0.5 bg-emerald-500 animate-[bounce_0.8s_infinite_0.2s]"></span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleToggleListening}
              type="button"
              className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer shrink-0 ${
                isListening
                  ? "bg-rose-950/40 text-rose-300 border-rose-500/40 hover:bg-rose-900/40"
                  : "bg-emerald-950/40 text-emerald-300 border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-900/30"
              }`}
              title={isListening ? "Stop listening" : "Start speaking"}
            >
              <Mic size={15} className={isListening ? "animate-pulse" : ""} />
              <span>{isListening ? "Listening..." : "Voice Capture"}</span>
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="e.g. From June to December, I want to deliver Public Release, and add task Check secure headers."
                disabled={isProcessingVoice}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExecuteVoiceCommand();
                }}
                className="w-full bg-zinc-900 border border-zinc-800 disabled:opacity-50 rounded-lg pl-3 pr-10 py-2.5 text-xs text-zinc-200 outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
              />
              <button
                onClick={() => handleExecuteVoiceCommand()}
                disabled={isProcessingVoice || !voiceText.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors cursor-pointer"
              >
                <Send size={12} />
              </button>
            </div>
          </div>

          {/* Prompt Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-zinc-800/40 pt-3">
            <span className="text-[10px] text-zinc-550 font-mono shrink-0">Command Presets:</span>
            {[
              "From June to December, I want to deliver Public Beta platform.",
              "Add urgent task Deploy API Gateway inside existing phase.",
              "Mark active task as done.",
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setVoiceText(chip);
                  handleExecuteVoiceCommand(chip);
                }}
                disabled={isProcessingVoice}
                className="text-[9px] bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap"
              >
                "{chip}"
              </button>
            ))}
          </div>

          {/* Feedback & Error Logs */}
          <AnimatePresence>
            {voiceError && (
              <div className="mt-3 p-2.5 rounded bg-rose-950/20 text-rose-400 border border-rose-500/10 text-[10.5px] leading-relaxed flex items-center gap-2">
                <AlertCircle size={13} className="shrink-0" />
                <span>{voiceError}</span>
              </div>
            )}

            {isProcessingVoice && (
              <div className="mt-3 p-2.5 rounded bg-blue-950/10 text-blue-300 border border-blue-500/10 text-[10.5px] leading-relaxed flex items-center gap-2">
                <Loader2 size={13} className="animate-spin shrink-0" />
                <span>Interpreting vocal parameters to compile actionable milestone JSON instructions...</span>
              </div>
            )}

            {successLogs.length > 0 && (
              <div className="mt-3 p-3 bg-emerald-950/20 text-emerald-300 border border-emerald-500/10 rounded space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Voice Command Compiled Successfully!
                </div>
                <div className="space-y-1">
                  {successLogs.map((log, idx) => (
                    <div key={idx} className="text-[10.5px] flex items-start gap-1.5 leading-relaxed font-sans">
                      <span className="text-emerald-500 font-mono select-none">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#121214] to-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 flex-1 flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="z-10">
              <div className="text-xs font-medium text-emerald-500/70 mb-1 flex items-center gap-1.5"><Rocket size={12}/> Project Velocity</div>
              <div className="text-2xl font-semibold text-emerald-500">{overallStats.completionRate}%</div>
              <div className="text-[10px] text-zinc-500 mt-1">Overall completion across {overallStats.totalPhases} phases</div>
            </div>
            <div className="relative w-16 h-16 shrink-0 z-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-emerald-900/30" />
                <circle 
                  cx="32" cy="32" r="28" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  strokeDasharray="175.93" 
                  strokeDashoffset={175.93 - (175.93 * overallStats.completionRate) / 100}
                  className="text-emerald-500 transition-all duration-1000" 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                 {overallStats.completionRate}%
              </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
        </div>

        <div className="bg-gradient-to-br from-[#121214] to-blue-900/10 border border-blue-500/20 rounded-xl p-4 flex-1 flex flex-col justify-center relative overflow-hidden hover:border-blue-500/40 transition-all">
            <div className="text-xs font-medium text-blue-500/70 mb-1 flex items-center gap-1.5"><Presentation size={12}/> Issue Resolution</div>
            <div className="flex items-end gap-2 text-zinc-100 font-semibold z-10">
               <span className="text-2xl text-blue-400">{overallStats.closedIssues}</span>
               <span className="text-xs text-zinc-500 mb-1 font-medium">/ {overallStats.totalIssues} closed</span>
            </div>
            <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1.5 z-10">
               <div className="w-full bg-blue-900/30 h-1.5 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 origin-left" style={{ width: `${overallStats.totalIssues > 0 ? (overallStats.closedIssues / overallStats.totalIssues) * 100 : 0}%`}}></div>
               </div>
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full -translate-x-8 translate-y-8"></div>
        </div>

        <div className="bg-gradient-to-br from-[#121214] to-purple-900/10 border border-purple-500/20 rounded-xl p-4 flex-1 flex flex-col justify-center relative overflow-hidden hover:border-purple-500/40 transition-all">
            <div className="text-xs font-medium text-purple-500/70 mb-1 flex items-center gap-1.5"><Target size={12}/> Completed Phases</div>
            <div className="flex items-end gap-2 text-zinc-100 font-semibold z-10">
               <span className="text-2xl text-purple-400">{overallStats.completedPhases}</span>
               <span className="text-xs text-zinc-500 mb-1 font-medium">/ {overallStats.totalPhases} total</span>
            </div>
            <div className="mt-2 text-[10px] text-zinc-500 z-10">
              Phases fully delivered on roadmap
            </div>
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        </div>
      </div>

      <div className="flex-1 border border-zinc-800 bg-[#121214] rounded-xl overflow-hidden flex flex-col min-h-0 relative">
        <div className="flex border-b border-zinc-800 bg-[#121214]">
          <div className="w-72 shrink-0 p-3 border-r border-zinc-800 flex items-center">
             <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Phases</span>
          </div>
          <div className="flex-1 flex text-[10px] font-medium text-zinc-500 relative">
            {months.map((m, i) => (
              <div key={m} className={`flex-1 p-3 border-zinc-800 ${i !== months.length -1 ? 'border-r' : ''}`}>
                 {m}
              </div>
            ))}
            <div className="absolute top-0 bottom-0 border-l border-blue-500/50 z-20 pointer-events-none" style={{ left: `${(new Date().getMonth() / 12) * 100}%` }}>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 -ml-[3px] -mt-0.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative">
          {!activeProjectId ? (
              <div className="absolute inset-0 flex items-center justify-center h-full text-zinc-500 text-xs">
                 Create a project to manage your roadmap.
              </div>
          ) : activePhases.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center h-full text-zinc-500 text-xs">
                 No phases found. Create one.
              </div>
          ) : (
            <>
              {activePhases.map((phase, i) => {
                 const chartData = phase.total === 0 
                   ? [{ name: 'No issues', value: 1, color: '#1f1f23' }]
                   : [
                       { name: 'Done', value: phase.closed, color: getHexForPhaseColor(phase.color) },
                       { name: 'Open', value: phase.open, color: '#27272a' }
                     ];

                 return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={phase.id} 
                    className="flex border-b border-zinc-800/80 relative group"
                  >
                    
                    <div className="w-72 shrink-0 p-3.5 border-r border-zinc-800 bg-[#121214] z-10 group-hover:bg-[#18181b] transition-colors flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs text-zinc-200 truncate flex items-center gap-1.5" title={phase.name}>
                            <Focus size={12} className="text-zinc-500" />
                            {phase.name}
                          </div>
                          <button onClick={() => deletePhase(phase.id)} className="text-zinc-650 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                        {phase.goal && (
                           <p className="text-[10px] text-zinc-550 mt-1 tracking-tight text-left italic line-clamp-2 leading-relaxed" title={phase.goal}>
                              Goal: {phase.goal}
                           </p>
                        )}
                        <div className="mt-2 text-[10px] text-zinc-400 flex justify-between items-center w-full font-mono">
                          <span className="flex items-center gap-1 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span>{phase.progress}% Done</span>
                          </span>
                          <span className="text-zinc-500">{phase.closed}/{phase.total} Tasks</span>
                        </div>
                        <div className="w-full bg-zinc-900/80 rounded-full h-1.5 mt-1.5 overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${phase.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${getGradientsForColor(phase.color).split(' ').slice(0, 2).join(' ')} relative overflow-hidden`}
                            style={{
                              boxShadow: `0 0 8px ${getHexForPhaseColor(phase.color)}33`
                            }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{
                                repeat: Infinity,
                                repeatType: 'loop',
                                duration: 2,
                                ease: 'linear',
                              }}
                            />
                          </motion.div>
                        </div>

                        {/* Top 3 Urgent Pending Issues list */}
                        {(() => {
                          const pendingIssuesForPhase = issues
                            .filter((is) => is.phaseId === phase.id && is.status !== 'Done')
                            .sort((a, b) => {
                              const priorityWeight: Record<string, number> = {
                                'Critical': 4,
                                'High': 3,
                                'Medium': 2,
                                'Low': 1
                              };
                              const wa = priorityWeight[a.priority] || 0;
                              const wb = priorityWeight[b.priority] || 0;
                              if (wa !== wb) return wb - wa;
                              return b.createdAt - a.createdAt;
                            })
                            .slice(0, 3);

                          if (pendingIssuesForPhase.length === 0) return null;

                          return (
                            <div className="mt-3.5 pt-2.5 border-t border-zinc-800/60 flex flex-col gap-1.5 w-full text-left">
                              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center justify-between font-mono">
                                <span className="flex items-center gap-1"><ListTodo size={9} className="text-zinc-500" /> Urgent Pending</span>
                                <span className="text-[8px] text-zinc-600 font-normal">({phase.open} open)</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {pendingIssuesForPhase.map(issue => {
                                  let badgeColor = 'text-zinc-400 bg-zinc-800/40 border-zinc-700/30';
                                  if (issue.priority === 'Critical') badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                                  if (issue.priority === 'High') badgeColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                                  if (issue.priority === 'Medium') badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                                  
                                  return (
                                    <button
                                      key={issue.id}
                                      onClick={() => navigate(`/issues?phaseId=${phase.id}&issueId=${issue.id}`)}
                                      className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-zinc-900/50 hover:bg-zinc-800/60 hover:text-blue-400 border border-zinc-800/40 hover:border-zinc-700/80 transition-all text-left w-full group/issue overflow-hidden"
                                      title={`Click to view issue: ${issue.title}`}
                                    >
                                      <span className="truncate text-zinc-300 font-medium group-hover/issue:text-blue-400 text-[10px]">
                                        {issue.title}
                                      </span>
                                      <span className={`shrink-0 text-[8px] font-bold px-1 py-0.2 rounded border uppercase tracking-wider font-mono ${badgeColor}`}>
                                        {issue.priority}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="w-12 h-12 shrink-0 flex items-center justify-center relative select-none mt-0.5">
                        <PieChart width={44} height={44}>
                          <Pie
                            data={chartData}
                            cx={22}
                            cy={22}
                            innerRadius={11}
                            outerRadius={20}
                            paddingAngle={chartData.length > 1 && phase.closed > 0 && phase.open > 0 ? 2 : 0}
                            dataKey="value"
                            isAnimationActive={false}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="#121214" strokeWidth={1} />
                            ))}
                          </Pie>
                        </PieChart>
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-zinc-400">
                          {phase.progress}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative bg-zinc-900/10 group-hover:bg-zinc-900/30 transition-colors min-h-[96px]">
                       <div className="absolute inset-0 flex pointer-events-none">
                         {months.map((_, idx) => (
                           <div key={idx} className={`flex-1 border-zinc-800/50 ${idx !== months.length -1 ? 'border-r' : ''}`}></div>
                         ))}
                       </div>
                       
                       <div 
                         className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg bg-[#09090b]/80 backdrop-blur-sm px-3 flex items-center shadow-lg border outline outline-1 outline-transparent hover:outline-white/20 transition-all origin-left overflow-hidden ${phase.color}`}
                         style={{ 
                           left: `${(phase.startMonth / 12) * 100}%`, 
                           width: `calc(${Math.min(100, (phase.duration / 12) * 100)}% - 12px)`,
                           marginLeft: '6px'
                         }}
                         title={`${phase.name} ${phase.goal ? '— ' + phase.goal : ''} (${phase.progress}% Done)`}
                       >
                          <span className="text-[10px] font-semibold truncate drop-shadow-md text-white">{phase.name}</span>
                          
                          {/* Animated tracking progress bar representing done issues */}
                          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#09090b]/60 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${phase.progress}%` }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className="h-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            />
                          </div>
                       </div>
                    </div>
                  </motion.div>
                 );
              })}
              
              {activeIssuesWithDates.length > 0 && (
                <div className="flex border-b border-zinc-800/80 relative group min-h-[64px]">
                  <div className="w-72 shrink-0 p-3 border-r border-zinc-800 bg-[#121214] z-10 flex flex-col justify-center">
                    <div className="font-medium text-xs text-zinc-300 flex items-center gap-1.5"><AlertCircle size={12} className="text-zinc-500"/> Milestone Tasks</div>
                    <div className="mt-1 text-[10px] text-zinc-500">{activeIssuesWithDates.length} scheduled issues</div>
                  </div>
                  <div className="flex-1 relative bg-[#09090b]/50">
                     <div className="absolute inset-0 flex pointer-events-none">
                       {months.map((_, idx) => (
                         <div key={idx} className={`flex-1 border-zinc-800/50 ${idx !== months.length -1 ? 'border-r' : ''}`}></div>
                       ))}
                     </div>
                     {activeIssuesWithDates.map((issue) => (
                        <div 
                          key={issue.id}
                          className="absolute top-1/2 -translate-y-1/2 -ml-2 w-3.5 h-3.5 rounded-full bg-zinc-900 border-[2.5px] border-emerald-500 flex items-center justify-center cursor-pointer hover:scale-150 transition-all hover:z-20 group/point shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          style={{ left: `calc(${issue.monthProgress}%)` }}
                          title={issue.title}
                        >
                           <div className="absolute text-[9px] pointer-events-none opacity-0 group-hover/point:opacity-100 left-1/2 -translate-x-1/2 bottom-5 bg-[#09090b] border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-200 capitalize whitespace-nowrap z-30 transition-all">
                              {issue.title} ({issue.status})
                           </div>
                        </div>
                     ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* NEW STEP-BY-STEP QUESTIONNAIRE FOR PHASES (with Goal setting!) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-zinc-800/50 bg-[#09090b] shrink-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-emerald-400 animate-pulse" />
                  <h2 className="text-sm font-bold text-zinc-150 uppercase tracking-wider">Milestone Setup Wizard</h2>
                </div>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                  
                  {/* STEP 1: Phase Name & Goal setting */}
                  {currentStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Milestone Phase Name</label>
                        <input 
                          autoFocus
                          required
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. Q1 Public Release / Alpha Launch"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors animate-in fade-in"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Primary Goal / Core Objectives</label>
                        <textarea 
                          required
                          value={formData.goal}
                          onChange={e => setFormData({...formData, goal: e.target.value})}
                          placeholder="What is the critical path/outcome of this phase? e.g. Resolve 100% of P0 blocks, test production server gateways with high traffic."
                          className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Timing configuration */}
                  {currentStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Start Calendar Month</label>
                          <select 
                            value={formData.startMonth}
                            onChange={(e) => setFormData({...formData, startMonth: parseInt(e.target.value)})}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                          >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Target Duration (Months)</label>
                          <input 
                            type="number"
                            min="1" max="12"
                            value={formData.duration}
                            onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Identification & Aesthetic pairing */}
                  {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Aesthetic Theme Palette</label>
                        <p className="text-[10px] text-zinc-500 mb-2">Choose an overlay palette representing priority levels:</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { name: 'Cosmic Sky', val: 'text-blue-500 bg-blue-500 border-blue-500' },
                            { name: 'Aurora Emerald', val: 'text-emerald-500 bg-emerald-500 border-emerald-500' },
                            { name: 'Calm Iris', val: 'text-purple-500 bg-purple-500 border-purple-500' },
                            { name: 'Indie Rose', val: 'text-rose-500 bg-rose-500 border-rose-500' },
                            { name: 'Solar Amber', val: 'text-amber-500 bg-amber-500 border-amber-500' }
                          ].map(item => {
                            const isSelected = formData.color === item.val;
                            return (
                              <button
                                key={item.val}
                                type="button"
                                onClick={() => setFormData({...formData, color: item.val})}
                                className={`text-[11px] p-2 rounded-lg border text-zinc-100 flex items-center justify-between basis-[45%] flex-grow font-medium transition-all ${
                                  isSelected ? 'border-zinc-400 bg-zinc-800/80 shadow' : 'border-zinc-800 bg-[#161619]'
                                }`}
                              >
                                {item.name}
                                <div className={`w-3.5 h-3.5 rounded-full ${item.val.split(' ')[1]}`} />
                              </button>
                            );
                          })}
                        </div>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-455 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map(stepIndex => (
                      <div 
                        key={stepIndex} 
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          currentStep === stepIndex ? 'bg-blue-500 w-3' : 'bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>

                  {currentStep < 3 ? (
                    <button 
                      type="button"
                      disabled={currentStep === 1 && (!formData.name || !formData.goal)}
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      disabled={!formData.name || !formData.goal}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors shadow-lg shadow-blue-500/10 border border-blue-500/20 disabled:opacity-50"
                    >
                      Deploy Phase
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
