import { useState } from 'react';
import { 
  BrainCircuit, 
  Loader2, 
  AlertCircle, 
  Lightbulb, 
  CheckSquare, 
  Check, 
  PlusSquare, 
  Tag, 
  ChevronRight, 
  Sparkles, 
  FileText, 
  Clock, 
  Info,
  Calendar
} from 'lucide-react';
import { CategorizationResult, ExtractedIssue, ExtractedIdea, ExtractedTask } from '../../lib/categorize';

interface NoteAnalysisPanelProps {
  analysisResult: CategorizationResult | null;
  isAnalyzing: boolean;
  onApplyTitle: (title: string) => void;
  onApplyTags: (tags: string[]) => void;
  onAddIssueToBacklog: (item: { title: string; description: string; type: 'Bug' | 'Task' | 'Feature'; priority: 'Low' | 'Medium' | 'High' | 'Critical' }) => void;
  currentTitle: string;
  currentTagsRaw: string;
}

export function NoteAnalysisPanel({
  analysisResult,
  isAnalyzing,
  onApplyTitle,
  onApplyTags,
  onAddIssueToBacklog,
  currentTitle,
  currentTagsRaw
}: NoteAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'issues' | 'ideas' | 'tasks'>('tasks');
  const [importedKeys, setImportedKeys] = useState<Record<string, boolean>>({});

  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[300px]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/10 filter blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-blue-400 animate-spin relative" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-200">Aether Cognitive Engine Active</p>
          <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
            Performing multi-dimensional semantic analysis and partitioning raw context into work structures...
          </p>
        </div>
        <div className="flex gap-1.5 items-center justify-center p-1 px-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          <span>Extracting Issues, Ideas & Tasks</span>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500 border-t border-zinc-850 md:border-t-0 p-6 min-h-[300px]">
        <BrainCircuit size={40} className="stroke-1 opacity-25 mb-4 text-zinc-400" />
        <h4 className="text-xs font-semibold text-zinc-450 uppercase tracking-widest mb-1">Semantic Pipeline Ready</h4>
        <p className="text-xs text-zinc-500 max-w-xs leading-normal">
          Click the <strong className="text-blue-400 font-semibold">Semantic Categorize</strong> or <strong className="text-blue-400 font-semibold">Analyze Note</strong> button above to partition content into agile categories instantly.
        </p>
      </div>
    );
  }

  const { category, confidence, summary, suggestedTitle, suggestedTags, extractedEntities, explanation } = analysisResult;
  const issuesList = extractedEntities.issues || [];
  const ideasList = extractedEntities.ideas || [];
  const tasksList = extractedEntities.tasks || [];

  // Helper arrays for simple mapping
  const categoryConfig = {
    Issues: {
      color: 'border-red-500/20 bg-red-950/10 text-red-400',
      icon: <AlertCircle size={14} className="text-red-400" />,
      tag: 'Issues & Defect Core'
    },
    Ideas: {
      color: 'border-purple-500/20 bg-purple-950/10 text-purple-400',
      icon: <Lightbulb size={14} className="text-purple-400" />,
      tag: 'Conceptual Strategy Brain'
    },
    Tasks: {
      color: 'border-blue-500/20 bg-blue-950/10 text-blue-400',
      icon: <CheckSquare size={14} className="text-blue-400" />,
      tag: 'Milestone Chore & Task List'
    }
  };

  const currentTheme = categoryConfig[category] || categoryConfig.Ideas;

  const runImport = (key: string, item: ExtractedIssue | ExtractedIdea | ExtractedTask, type: 'Bug' | 'Task' | 'Feature') => {
    let priorityVal: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
    if ('priority' in item && item.priority) priorityVal = item.priority;
    else if ('severity' in item && item.severity) priorityVal = item.severity;

    onAddIssueToBacklog({
      title: item.title,
      description: item.description,
      type,
      priority: priorityVal
    });

    setImportedKeys(prev => ({ ...prev, [key]: true }));
  };

  const parsedCurrentTags = currentTagsRaw.split(',').map(t => t.trim()).filter(t => t);
  const titleHasChanged = currentTitle !== suggestedTitle;
  const hasNewTags = suggestedTags.some(tag => !parsedCurrentTags.includes(tag));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0e0e11]/30 p-4 overflow-y-auto space-y-4 custom-scrollbar">
      
      {/* Classification Summary Header */}
      <div className={`p-3.5 border rounded-xl ${currentTheme.color} flex flex-col space-y-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider font-mono">
            {currentTheme.icon}
            <span>{category}</span>
          </div>
          <div className="text-[10px] font-semibold bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-zinc-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{Math.round(confidence * 100)}% Match</span>
          </div>
        </div>
        <p className="text-xs text-zinc-300 italic font-medium">
          &ldquo;{summary}&rdquo;
        </p>
        <div className="text-[10px] text-zinc-550 border-t border-zinc-900 pt-1.5 flex gap-1 items-start leading-relaxed">
          <Info size={10} className="shrink-0 mt-0.5 text-zinc-500" />
          <span>{explanation}</span>
        </div>
      </div>

      {/* Suggested Quick Doc Improvements */}
      <div className="space-y-2">
        <h5 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
          <Clock size={10} /> Smart Document Assist
        </h5>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Smart Rename Card */}
          <div className="p-2.5 bg-[#121215] border border-zinc-850 rounded-lg flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Recommended Title</span>
              <span className="text-xs text-zinc-200 font-semibold truncate block" title={suggestedTitle}>
                {suggestedTitle}
              </span>
            </div>
            <button
              onClick={() => onApplyTitle(suggestedTitle)}
              disabled={!titleHasChanged}
              className={`w-full text-center py-1 rounded text-[9.5px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                titleHasChanged 
                  ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 cursor-pointer' 
                  : 'bg-zinc-900 text-zinc-650 border border-zinc-850 cursor-default'
              }`}
            >
              {!titleHasChanged ? (
                <>
                  <Check size={10} /> Renamed
                </>
              ) : (
                <>
                  <Sparkles size={10} /> Smart Rename
                </>
              )}
            </button>
          </div>

          {/* Smart Tagging Card */}
          <div className="p-2.5 bg-[#121215] border border-zinc-850 rounded-lg flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Suggested Tags</span>
              <div className="flex flex-wrap gap-1">
                {suggestedTags.map((tg, i) => (
                  <span key={i} className="text-[8.5px] bg-zinc-900 border border-zinc-850 text-blue-400 px-1 py-0.5 rounded flex items-center gap-0.5 font-mono">
                    <Tag size={6} /> {tg}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onApplyTags(suggestedTags)}
              disabled={!hasNewTags}
              className={`w-full text-center py-1 rounded text-[9.5px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                hasNewTags 
                  ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/20 cursor-pointer' 
                  : 'bg-zinc-900 text-zinc-650 border border-zinc-850 cursor-default'
              }`}
            >
              {!hasNewTags ? (
                <>
                  <Check size={10} /> Tags Applied
                </>
              ) : (
                <>
                  <Tag size={10} /> Merge Tags
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Extracted Backlog Ticket List */}
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-1 shrink-0">
          <h5 className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
            Partitioned Work Items
          </h5>
          <div className="flex bg-zinc-950 p-1 rounded-md border border-zinc-850 gap-0.5">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`text-[8.5px] font-bold uppercase rounded px-1.5 py-0.5 transition-colors ${
                activeTab === 'tasks' ? 'bg-blue-600/25 text-blue-400' : 'text-zinc-550 hover:text-zinc-300'
              }`}
            >
              Tasks ({tasksList.length})
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`text-[8.5px] font-bold uppercase rounded px-1.5 py-0.5 transition-colors ${
                activeTab === 'issues' ? 'bg-red-600/25 text-red-400' : 'text-zinc-550 hover:text-zinc-300'
              }`}
            >
              Issues ({issuesList.length})
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`text-[8.5px] font-bold uppercase rounded px-1.5 py-0.5 transition-colors ${
                activeTab === 'ideas' ? 'bg-purple-600/25 text-purple-400' : 'text-zinc-550 hover:text-zinc-300'
              }`}
            >
              Ideas ({ideasList.length})
            </button>
          </div>
        </div>

        {/* Dynamic Items Listing Container */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[220px]">
          {activeTab === 'tasks' && (
            <>
              {tasksList.length === 0 ? (
                <div className="text-center py-6 text-zinc-650 text-xs italic border border-dashed border-zinc-850 rounded-xl">
                  No tasks parsed under this classification.
                </div>
              ) : (
                tasksList.map((task, idx) => {
                  const key = `task-${idx}`;
                  const isImported = importedKeys[key];
                  return (
                    <div key={key} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-2 group hover:border-zinc-800 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-semibold text-zinc-200 block truncate leading-tight">
                            {task.title}
                          </span>
                          <span className={`text-[7.5px] px-1 font-mono rounded leading-normal ${
                            task.priority === 'Critical' || task.priority === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-zinc-900 text-zinc-450 border border-zinc-800'
                          }`}>
                            {task.priority || 'Medium'} Priority
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-450 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => runImport(key, task, 'Task')}
                          disabled={isImported}
                          className={`text-[9px] font-black uppercase rounded py-1 px-2.5 border transition-all flex items-center gap-1 ${
                            isImported 
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/25 cursor-default'
                              : 'bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-300 border-zinc-800 cursor-pointer active:scale-95'
                          }`}
                        >
                          {isImported ? (
                            <>
                              <Check size={10} /> Backlog Synced
                            </>
                          ) : (
                            <>
                              <PlusSquare size={10} className="text-blue-400" /> Integrate Task Ticket
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'issues' && (
            <>
              {issuesList.length === 0 ? (
                <div className="text-center py-6 text-zinc-650 text-xs italic border border-dashed border-zinc-850 rounded-xl">
                  No issues parsed under this classification.
                </div>
              ) : (
                issuesList.map((issue, idx) => {
                  const key = `issue-${idx}`;
                  const isImported = importedKeys[key];
                  return (
                    <div key={key} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-2 group hover:border-zinc-800 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-semibold text-zinc-200 block truncate leading-tight">
                            {issue.title}
                          </span>
                          <span className={`text-[7.5px] px-1 font-mono rounded leading-normal ${
                            issue.severity === 'Critical' || issue.severity === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-zinc-900 text-zinc-450 border border-zinc-800'
                          }`}>
                            {issue.severity || 'High'} Severity
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-450 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => runImport(key, issue, 'Bug')}
                          disabled={isImported}
                          className={`text-[9px] font-black uppercase rounded py-1 px-2.5 border transition-all flex items-center gap-1 ${
                            isImported 
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/25 cursor-default'
                              : 'bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-300 border-zinc-800 cursor-pointer active:scale-95'
                          }`}
                        >
                          {isImported ? (
                            <>
                              <Check size={10} /> Backlog Synced
                            </>
                          ) : (
                            <>
                              <PlusSquare size={10} className="text-red-400" /> Integrate Bug Ticket
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === 'ideas' && (
            <>
              {ideasList.length === 0 ? (
                <div className="text-center py-6 text-zinc-650 text-xs italic border border-dashed border-zinc-850 rounded-xl">
                  No ideas parsed under this classification.
                </div>
              ) : (
                ideasList.map((idea, idx) => {
                  const key = `idea-${idx}`;
                  const isImported = importedKeys[key];
                  return (
                    <div key={key} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-2 group hover:border-zinc-800 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-semibold text-zinc-200 block truncate leading-tight">
                            {idea.title}
                          </span>
                          <span className="text-[7.5px] px-1 font-mono rounded leading-normal bg-purple-950/10 text-purple-400 border border-purple-500/20">
                            Feature Concept
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-450 leading-relaxed">
                          {idea.description}
                        </p>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => runImport(key, idea, 'Feature')}
                          disabled={isImported}
                          className={`text-[9px] font-black uppercase rounded py-1 px-2.5 border transition-all flex items-center gap-1 ${
                            isImported 
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/25 cursor-default'
                              : 'bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-300 border-zinc-800 cursor-pointer active:scale-95'
                          }`}
                        >
                          {isImported ? (
                            <>
                              <Check size={10} /> Feature Synced
                            </>
                          ) : (
                            <>
                              <PlusSquare size={10} className="text-purple-400" /> Integrate Feature Ticket
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
