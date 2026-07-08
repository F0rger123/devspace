import { useState, useEffect } from 'react';
import { useData } from '../context/DataProvider';
import { FileText, Plus, Search, Tag, Image as ImageIcon, Trash, Save, Edit3, X, Sparkles, Loader2, Eye, Columns, BrainCircuit, Check, CheckSquare, AlertCircle, RefreshCw, Lightbulb, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeAndCategorizeNote, CategorizationResult } from '../lib/categorize';
import { NoteAnalysisPanel } from '../components/ui/NoteAnalysisPanel';

export function Notes() {
  const { notes, addNote, updateNote, deleteNote, activeProjectId, projects, addIssue } = useData();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => localStorage.getItem('notes_selected_note_id'));
  const [isEditing, setIsEditing] = useState(() => localStorage.getItem('notes_is_editing') === 'true');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Categorization & Semantic States
  const [analysisResult, setAnalysisResult] = useState<CategorizationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<'preview' | 'analysis'>('preview');
  const [importedItems, setImportedItems] = useState<Record<string, boolean>>({});
  const [activeEntityTab, setActiveEntityTab] = useState<'issues' | 'ideas' | 'tasks'>('tasks');
  const [hasUnsyncedAnalysis, setHasUnsyncedAnalysis] = useState(false);
  
  // To handle form state
  const [title, setTitle] = useState(() => localStorage.getItem('notes_draft_title') || '');
  const [content, setContent] = useState(() => localStorage.getItem('notes_draft_content') || '');
  const [tags, setTags] = useState(() => localStorage.getItem('notes_draft_tags') || '');
  const [showSplit, setShowSplit] = useState(true);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectNotes = notes.filter(n => n.projectId === activeProjectId);
  const selectedNote = projectNotes.find(n => n.id === selectedNoteId);

  const handleSelect = (id: string) => {
    setSelectedNoteId(id);
    setIsEditing(false);
    setAnalysisResult(null);
    setActiveRightPanel('preview');
    setImportedItems({});
    const n = projectNotes.find(note => note.id === id);
    if (n) {
      setTitle(n.title);
      setContent(n.content);
      setTags(n.tags?.join(', ') || '');
    }
  };

  const handleCreateNew = () => {
    setSelectedNoteId('new');
    setIsEditing(true);
    setTitle('');
    setContent('');
    setTags('');
    setAnalysisResult(null);
    setActiveRightPanel('preview');
    setImportedItems({});
  };

  // Synchronize draft states with localStorage
  useEffect(() => {
    if (selectedNoteId) {
      localStorage.setItem('notes_selected_note_id', selectedNoteId);
    } else {
      localStorage.removeItem('notes_selected_note_id');
    }
  }, [selectedNoteId]);

  useEffect(() => {
    localStorage.setItem('notes_is_editing', String(isEditing));
  }, [isEditing]);

  useEffect(() => {
    localStorage.setItem('notes_draft_title', title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem('notes_draft_content', content);
  }, [content]);

  useEffect(() => {
    localStorage.setItem('notes_draft_tags', tags);
  }, [tags]);

  // Handle initialization and change of project
  useEffect(() => {
    if (activeProjectId) {
      const storedId = localStorage.getItem('notes_selected_note_id');
      const valid = storedId === 'new' || projectNotes.some(n => n.id === storedId);
      if (storedId && valid) {
        if (!isEditing) {
          const n = projectNotes.find(note => note.id === storedId);
          if (n) {
            setTitle(n.title);
            setContent(n.content);
            setTags(n.tags?.join(', ') || '');
          }
        }
      } else {
        if (projectNotes.length > 0) {
          handleSelect(projectNotes[0].id);
        } else {
          setSelectedNoteId(null);
          setTitle('');
          setContent('');
          setTags('');
        }
      }
    } else {
      setSelectedNoteId(null);
    }
  }, [activeProjectId]);

  const handleAiImprove = async () => {
    if (!content.trim() && !title.trim()) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are an AI Markdown co-writer. Improve, expand, and structure the following developer document titled "${title || 'Untitled'}" with appropriate headings, structures, bullet points, and clean typography. Keep technical constraints and do not delete any code blocks. Respond only with the updated Markdown content.\n\nDocument Content:\n${content}`
            }
          ]
        })
      });

      if (!response.ok) throw new Error('AI stream error');
      if (!response.body) throw new Error('No body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamDoc = '';
      setContent('');
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
                streamDoc += data.text;
                setContent(streamDoc);
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to co-write with AI.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCategorize = async () => {
    if (!content.trim() && !title.trim()) return;
    setIsAnalyzing(true);
    setActiveRightPanel('analysis');
    setAnalysisResult(null);
    setImportedItems({});
    try {
      const result = await analyzeAndCategorizeNote(title || 'Untitled Note', content || '');
      setAnalysisResult(result);
      if (result.category === 'Issues') {
        setActiveEntityTab('issues');
      } else if (result.category === 'Tasks') {
        setActiveEntityTab('tasks');
      } else {
        setActiveEntityTab('ideas');
      }
    } catch (e) {
      console.error(e);
      alert('Aether neural connection timed out or is busy. Check console for details.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!activeProjectId || !title) return;
    
    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
    
    if (selectedNoteId === 'new') {
      addNote({
        projectId: activeProjectId,
        title,
        content,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });
      setIsEditing(false);
      // Not resetting selectedNoteId so it could default to nothing or we could track the newly created ID, but crypto UUID is blind. 
      setSelectedNoteId(null);
    } else if (selectedNoteId) {
      updateNote(selectedNoteId, {
        title,
        content,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (selectedNoteId && selectedNoteId !== 'new') {
      deleteNote(selectedNoteId);
      setSelectedNoteId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden pb-4 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-wide text-zinc-100 flex items-center gap-2">
            Notes & <span className="font-semibold italic text-yellow-500">Docs</span> <FileText size={18} className="text-yellow-500/80 animate-pulse" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Structural Markdown editor for brain-dumps, launch goals, and architecture.
          </p>
        </div>
      </div>

      {!activeProjectId ? (
         <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl p-8 bg-[#0c0c0e]">
            <FileText size={32} className="opacity-20 mb-3" />
            <p className="text-sm">Select an active project first.</p>
         </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          
          {/* Notes Sidebar */}
          <div className="w-64 shrink-0 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{activeProject?.name} Notes</h2>
              <button 
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded-md transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search docs..." 
                className="w-full bg-[#121214] border border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-blue-500 transition-colors" 
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {projectNotes.length === 0 && selectedNoteId !== 'new' ? (
                <div className="text-center py-6 text-zinc-600 text-xs italic">
                  No notes found.
                </div>
              ) : (
                <>
                  {selectedNoteId === 'new' && (
                    <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 cursor-pointer">
                      <div className="text-xs font-medium truncate mb-0.5">{title || 'Untitled Note'}</div>
                      <div className="text-[10px] opacity-70">Creating new...</div>
                    </div>
                  )}
                  {projectNotes.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => handleSelect(n.id)}
                      className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedNoteId === n.id ? 'bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-800/50 text-zinc-400'}`}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <div className="text-xs font-medium truncate pr-2">{n.title}</div>
                        <div className="text-[9px] opacity-50 shrink-0">{new Date(n.updatedAt).toLocaleDateString()}</div>
                      </div>
                      {n.tags && n.tags.length > 0 && (
                        <div className="flex gap-1 overflow-hidden mt-1">
                          {n.tags.slice(0, 2).map((t, idx) => (
                             <span key={idx} className="text-[9px] rounded bg-zinc-900 border border-zinc-800 px-1 py-0.5 truncate max-w-[60px]"><Tag size={8} className="inline mr-0.5 opacity-50"/>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Editor/Viewer Panel */}
          <div className="flex-1 border border-zinc-800 bg-[#121214] rounded-xl flex flex-col min-h-0 relative">
            {!selectedNoteId ? (
              <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col opacity-50">
                <FileText size={48} className="mb-4 stroke-1" />
                <p>Select a note or create a new one.</p>
              </div>
            ) : (
              <>
                {/* Editor Top Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#09090b]/50 rounded-t-xl shrink-0">
                  <div className="flex-1 mr-4">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Note Title"
                        className="w-full bg-transparent border-none outline-none text-sm font-semibold text-zinc-100 placeholder:text-zinc-600"
                        autoFocus
                      />
                    ) : (
                      <h2 className="text-sm font-semibold text-zinc-100">{selectedNote?.title}</h2>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Media Stub Tab (Phase 1, Step 3 stub) */}
                    <button className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors" title="Attach Media / Asset (Coming soon)">
                      <ImageIcon size={14} />
                    </button>
                    {isEditing && (
                      <button 
                        onClick={() => setShowSplit(prev => !prev)}
                        className={`p-1.5 transition-colors rounded ${showSplit ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-500 hover:text-zinc-350'}`} 
                        title="Toggle Split-screen Preview"
                      >
                        <Columns size={14} />
                      </button>
                    )}
                    <div className="w-px h-4 bg-zinc-800 mx-1"></div>
                     {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleCategorize} 
                          disabled={isAnalyzing || (!content.trim() && !title.trim())}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-950/45 hover:bg-blue-900/60 disabled:opacity-40 text-blue-200 border border-blue-500/30 rounded text-xs font-medium transition-all"
                          title="Parse raw text into predefined Issues, Ideas, or Tasks automatically using Aether Semantic analysis"
                        >
                          {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <BrainCircuit size={13} className="text-blue-400" />}
                          {analysisResult ? 'Re-Analyze Note' : 'Semantic Categorize'}
                        </button>
                        <button 
                          onClick={handleAiImprove} 
                          disabled={aiLoading || !content.trim()}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#402060]/50 hover:bg-[#502080]/80 disabled:opacity-40 text-purple-200 border border-purple-500/30 rounded text-xs font-medium transition-all"
                          title="Generate, improve, and format your markdown style notes automatically"
                        >
                          {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} className="text-purple-400" />}
                          AI Co-Write
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors">
                          <Save size={14} /> Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <button 
                          onClick={handleCategorize} 
                          disabled={isAnalyzing || (!selectedNote?.content.trim() && !selectedNote?.title.trim())}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/40 hover:bg-blue-800/50 text-blue-200 rounded text-xs font-medium transition-colors border border-blue-500/30 mr-2"
                        >
                          {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} className="text-blue-400" />}
                          {analysisResult ? 'Show Analysis' : 'Analyze Note'}
                        </button>
                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors border border-zinc-700">
                          <Edit3 size={14} /> Edit
                        </button>
                        <button onClick={handleDelete} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors bg-zinc-900 border border-zinc-800 rounded ml-2">
                          <Trash size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                  {isEditing ? (
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-zinc-800 p-4 gap-4">
                      {/* Left: Input */}
                      <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
                        <div className="flex items-center bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2">
                          <Tag size={12} className="text-zinc-500 mr-2 shrink-0" />
                          <input 
                            type="text" 
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            placeholder="architecture, brain-dump, launch-goal (comma separated)"
                            className="w-full bg-transparent border-none outline-none text-xs text-zinc-300 placeholder:text-zinc-600"
                          />
                        </div>
                        <textarea 
                          value={content}
                          onChange={e => setContent(e.target.value)}
                          placeholder="Write your markdown document here..."
                          className="flex-1 w-full bg-transparent border-none outline-none text-sm text-zinc-300 placeholder:text-zinc-700 resize-none font-mono text-zinc-300"
                        />
                      </div>

                      {/* Right: Markdown live preview / Semantic Insights */}
                      {showSplit && (
                        <div className="flex-1 pl-4 flex flex-col min-h-[300px] border-t md:border-t-0 border-zinc-850 mt-4 md:mt-0 pt-4 md:pt-0 max-h-full overflow-hidden">
                          {/* Tabs Header */}
                          <div className="flex items-center justify-between border-b border-zinc-850 pb-2 mb-3 shrink-0">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setActiveRightPanel('preview')}
                                className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded text-xs transition-all ${
                                  activeRightPanel === 'preview' 
                                    ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' 
                                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                                }`}
                              >
                                Live Presentation
                              </button>
                              <button
                                onClick={() => setActiveRightPanel('analysis')}
                                className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1 border ${
                                  activeRightPanel === 'analysis' 
                                    ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' 
                                    : 'text-zinc-500 hover:text-zinc-350 border-transparent'
                                }`}
                              >
                                <span>Aether Insights</span>
                                {(analysisResult || isAnalyzing) && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Tab Content */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 flex flex-col">
                            {activeRightPanel === 'preview' ? (
                              <div className="prose prose-invert prose-xs max-w-none prose-headings:text-zinc-300 prose-p:text-zinc-400 prose-code:text-emerald-400 prose-pre:bg-[#0c0c0e]/50 prose-pre:border prose-pre:border-zinc-800/20">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {content || '*Start writing to preview styles.*'}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <NoteAnalysisPanel
                                analysisResult={analysisResult}
                                isAnalyzing={isAnalyzing}
                                currentTitle={title}
                                currentTagsRaw={tags}
                                onApplyTitle={(newTitle) => setTitle(newTitle)}
                                onApplyTags={(newTags) => {
                                  const currentTagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
                                  const mergedSet = new Set([...currentTagsArray, ...newTags]);
                                  setTags(Array.from(mergedSet).join(', '));
                                }}
                                onAddIssueToBacklog={(item) => {
                                  if (!activeProjectId) return;
                                  addIssue({
                                    projectId: activeProjectId,
                                    title: item.title,
                                    description: item.description,
                                    type: item.type,
                                    status: 'Todo',
                                    priority: item.priority
                                  });
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-zinc-800 p-6 gap-6 overflow-y-auto">
                      {/* Left: Rendered Markdown */}
                      <div className="flex-1 overflow-y-auto max-h-full">
                        {selectedNote?.tags && selectedNote.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {selectedNote.tags.map((t, idx) => (
                               <span key={idx} className="text-[10px] rounded-md bg-zinc-900 border border-zinc-800 text-blue-400 px-2 py-1 flex items-center gap-1 font-medium">
                                 <Tag size={10} className="opacity-70"/> {t}
                               </span>
                            ))}
                          </div>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-400 prose-a:text-blue-400 prose-code:text-emerald-400 prose-pre:bg-[#0c0c0e] prose-pre:border prose-pre:border-zinc-800/50">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedNote?.content || '*No content.*'}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Right: Analysis Panel (Only if analyzing or result exists) */}
                      {(analysisResult || isAnalyzing) && (
                        <div className="flex-1 pl-4 flex flex-col max-h-full overflow-hidden min-h-[300px] border-t md:border-t-0 border-zinc-850 mt-4 md:mt-0 pt-4 md:pt-0">
                          <div className="flex items-center justify-between border-b border-zinc-850 pb-2 mb-3 shrink-0">
                            <span className="text-[10px] uppercase font-black text-zinc-405 tracking-widest flex items-center gap-1.5">
                              <BrainCircuit size={13} className="text-blue-400" /> Aether Cognitive Hub
                            </span>
                            <button 
                              onClick={() => {
                                setAnalysisResult(null);
                                setImportedItems({});
                              }}
                              className="text-zinc-500 hover:text-zinc-350 transition-colors p-1"
                              title="Close Insights"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          
                          <NoteAnalysisPanel
                            analysisResult={analysisResult}
                            isAnalyzing={isAnalyzing}
                            currentTitle={selectedNote?.title || ''}
                            currentTagsRaw={selectedNote?.tags?.join(', ') || ''}
                            onApplyTitle={(newTitle) => {
                              if (selectedNoteId) {
                                updateNote(selectedNoteId, { title: newTitle });
                              }
                            }}
                            onApplyTags={(newTags) => {
                              if (selectedNoteId) {
                                const currentTagsArray = selectedNote?.tags || [];
                                const mergedSet = new Set([...currentTagsArray, ...newTags]);
                                updateNote(selectedNoteId, { tags: Array.from(mergedSet) });
                              }
                            }}
                            onAddIssueToBacklog={(item) => {
                              if (!activeProjectId) return;
                              addIssue({
                                projectId: activeProjectId,
                                title: item.title,
                                description: item.description,
                                type: item.type,
                                status: 'Todo',
                                priority: item.priority
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
