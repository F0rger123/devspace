// Universal Aether Command Bar
// Global command launcher for DevSpace and Desktop actions, fuzzy search, natural language execution, and custom aliases.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  Command,
  CornerDownLeft,
  X,
  ArrowUp,
  ArrowDown,
  Layers,
  FolderGit2,
  CheckSquare,
  FileText,
  Code,
  Terminal,
  Zap,
  Play,
  Bookmark,
  Compass,
  PlusSquare,
  Edit3,
  ExternalLink,
  Undo2,
  RefreshCw,
  Mic,
  MicOff,
  Copy,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  BarChart2,
  Globe,
  Youtube,
  File,
  Folder,
  Sliders,
  ChevronRight,
  Send,
  Laptop,
  Monitor,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Workflow
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { useNavigate } from 'react-router-dom';
import { isElectron, safeOpenExternalUrl } from '../../lib/electronBridge';
import {
  aetherCommandBar,
  CommandItem,
  CommandCategory,
  CommandExecutionResult,
  RecentCommandRecord
} from '../../lib/aetherCommandBarService';
import { aetherAliasRegistry, AetherAlias } from '../../lib/aetherAliasRegistry';
import { undoRedoManager } from '../../lib/aetherActionEngine';
import { aetherVoiceEngine } from '../../lib/aetherVoiceStateEngine';
import { haptic } from '../../utils/haptics';

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useStore();
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    issues,
    notes,
    assets,
    addIssue,
    addNote,
    showToast
  } = useData();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CommandExecutionResult | null>(null);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAliasModal, setShowAliasModal] = useState(false);

  // New Alias Form State
  const [newAliasName, setNewAliasName] = useState('');
  const [newAliasTarget, setNewAliasTarget] = useState('');
  const [newAliasType, setNewAliasType] = useState<'desktop_app' | 'website' | 'devspace_route'>('devspace_route');
  const [newAliasDesc, setNewAliasDesc] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const desktop = isElectron();

  // Execution context passed to commands
  const executionContext = useMemo(() => ({
    navigate: (path: string) => {
      navigate(path);
      setCommandPaletteOpen(false);
    },
    showToast,
    projects: projects || [],
    activeProjectId,
    setActiveProjectId,
    issues: issues || [],
    notes: notes || [],
    assets: assets || [],
    addIssue,
    addNote
  }), [navigate, showToast, projects, activeProjectId, setActiveProjectId, issues, notes, assets, addIssue, addNote, setCommandPaletteOpen]);

  // Generate full command index
  const allCommands = useMemo(() => {
    return aetherCommandBar.generateIndex(executionContext);
  }, [executionContext]);

  // Filter & score results with fuzzy search
  const filteredResults = useMemo(() => {
    return aetherCommandBar.search(query, allCommands, selectedCategory);
  }, [query, allCommands, selectedCategory]);

  const recentCommands = useMemo(() => {
    return aetherCommandBar.getRecentCommands();
  }, [isCommandPaletteOpen]);

  // Reset selection index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setExecutionResult(null);
      setExecutionLogs([]);
    } else {
      if (isVoiceListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        setIsVoiceListening(false);
      }
    }
  }, [isCommandPaletteOpen]);

  // Global listener to open command bar via custom event
  useEffect(() => {
    const handleOpenEvent = () => {
      setCommandPaletteOpen(true);
    };
    window.addEventListener('devspace-open-command-palette', handleOpenEvent);
    window.addEventListener('devspace-open-command-bar', handleOpenEvent);
    return () => {
      window.removeEventListener('devspace-open-command-palette', handleOpenEvent);
      window.removeEventListener('devspace-open-command-bar', handleOpenEvent);
    };
  }, [setCommandPaletteOpen]);

  // Voice Dictation handler using Web Speech API
  const toggleVoiceDictation = () => {
    if (isVoiceListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser.', 'info');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        haptic.medium();
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setQuery(transcript);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsVoiceListening(false);
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Could not start speech recognition:', e);
      setIsVoiceListening(false);
    }
  };

  // Execute selected command or free-form prompt
  const executeCommand = async (item?: CommandItem) => {
    setIsExecuting(true);
    setExecutionLogs(['Initializing action runner...', 'Resolving execution context...']);
    haptic.medium();

    try {
      let result: CommandExecutionResult;

      if (item) {
        setExecutionLogs(prev => [...prev, `Invoking: ${item.title}`]);
        result = await item.action(executionContext);
      } else if (query.trim()) {
        setExecutionLogs(prev => [...prev, `Processing intent with Aether Engine: "${query.trim()}"`]);
        result = await aetherCommandBar.executeFreeformQuery(query, executionContext);
      } else {
        setIsExecuting(false);
        return;
      }

      setExecutionResult(result);
      if (result.stepsExecuted && result.stepsExecuted.length > 0) {
        setExecutionLogs(prev => [...prev, ...result.stepsExecuted!]);
      }

      // Record in recent history
      aetherCommandBar.recordExecution({
        commandId: item?.id,
        title: item ? item.title : query.trim(),
        category: item ? item.category : 'aether',
        success: result.success,
        outputSnippet: result.message
      });

      // Spoken voice feedback if Aether returned speechText
      if (result.speechText && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(result.speechText);
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch {}
      }

      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      console.error('Command execution error:', err);
      const failResult: CommandExecutionResult = {
        success: false,
        message: err?.message || 'An unexpected error occurred during execution.',
        stepsExecuted: ['Execution threw an unhandled error']
      };
      setExecutionResult(failResult);
      showToast(failResult.message, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (executionResult) {
        setExecutionResult(null);
        setExecutionLogs([]);
      } else if (showAliasModal) {
        setShowAliasModal(false);
      } else {
        setCommandPaletteOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const maxLen = filteredResults.length + (query.trim() ? 1 : 0);
      setSelectedIndex(prev => (prev + 1) % Math.max(1, maxLen));
      scrollActiveItemIntoView();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const maxLen = filteredResults.length + (query.trim() ? 1 : 0);
      setSelectedIndex(prev => (prev - 1 + maxLen) % Math.max(1, maxLen));
      scrollActiveItemIntoView();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim() && selectedIndex === 0 && filteredResults.length === 0) {
        executeCommand();
      } else if (filteredResults[selectedIndex]) {
        executeCommand(filteredResults[selectedIndex]);
      } else if (query.trim()) {
        executeCommand();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const categories: (CommandCategory | 'all')[] = [
        'all',
        'aether',
        'project',
        'issue',
        'note',
        'file',
        'app',
        'workflow',
        'github',
        'custom',
        'navigation'
      ];
      const currentIdx = categories.indexOf(selectedCategory);
      const nextCat = categories[(currentIdx + (e.shiftKey ? -1 + categories.length : 1)) % categories.length];
      setSelectedCategory(nextCat);
      return;
    }
  };

  const scrollActiveItemIntoView = () => {
    setTimeout(() => {
      const activeEl = resultsContainerRef.current?.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  };

  // Helper to render icon by name
  const renderIcon = (name: string, category?: CommandCategory, className = 'w-4 h-4') => {
    switch (name) {
      case 'Sparkles': return <Sparkles className={`${className} text-yellow-400`} />;
      case 'Clock': return <Clock className={`${className} text-blue-400`} />;
      case 'CheckSquare': return <CheckSquare className={`${className} text-emerald-400`} />;
      case 'AlertCircle': return <AlertCircle className={`${className} text-rose-400`} />;
      case 'BarChart2': return <BarChart2 className={`${className} text-indigo-400`} />;
      case 'Compass': return <Compass className={`${className} text-amber-400`} />;
      case 'Layers': return <Layers className={`${className} text-cyan-400`} />;
      case 'Mic': return <Mic className={`${className} text-yellow-400`} />;
      case 'Code': return <Code className={`${className} text-sky-400`} />;
      case 'Terminal': return <Terminal className={`${className} text-emerald-400`} />;
      case 'Zap': return <Zap className={`${className} text-amber-400`} />;
      case 'Play': return <Play className={`${className} text-emerald-400`} />;
      case 'Bookmark': return <Bookmark className={`${className} text-purple-400`} />;
      case 'FolderGit2': return <FolderGit2 className={`${className} text-amber-400`} />;
      case 'FileText': return <FileText className={`${className} text-zinc-300`} />;
      case 'File': return <File className={`${className} text-zinc-400`} />;
      case 'Github': return <Globe className={`${className} text-zinc-200`} />;
      case 'LayoutDashboard': return <Layers className={`${className} text-amber-400`} />;
      case 'PlusSquare': return <PlusSquare className={`${className} text-emerald-400`} />;
      case 'Edit3': return <Edit3 className={`${className} text-amber-400`} />;
      case 'Workflow': return <Workflow className={`${className} text-indigo-400`} />;
      default: return <Command className={`${className} text-zinc-400`} />;
    }
  };

  // Save new custom alias
  const handleSaveNewAlias = () => {
    if (!newAliasName.trim() || !newAliasTarget.trim()) {
      showToast('Please provide both an alias name and target.', 'info');
      return;
    }
    aetherAliasRegistry.saveAlias({
      alias: newAliasName.trim(),
      target: newAliasTarget.trim(),
      type: newAliasType,
      description: newAliasDesc.trim() || 'Custom user command alias'
    });
    showToast(`Saved alias "${newAliasName.trim()}" successfully!`, 'success');
    setShowAliasModal(false);
    setNewAliasName('');
    setNewAliasTarget('');
    setNewAliasDesc('');
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={() => {
            if (!isExecuting) {
              setCommandPaletteOpen(false);
            }
          }}
        />

        {/* Command Bar Floating Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-[#0e0e11] border border-zinc-800/90 rounded-xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col z-50 text-zinc-100 max-h-[82vh]"
          onKeyDown={handleKeyDown}
        >
          {/* Header & Search Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-zinc-850 bg-[#121216] gap-3">
            <div className="flex items-center justify-center shrink-0">
              {isExecuting ? (
                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Aether anything, search projects, files, tasks, or type a command..."
              className="flex-grow bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
              disabled={isExecuting}
            />

            {/* Voice Dictation Button */}
            <button
              onClick={toggleVoiceDictation}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                isVoiceListening
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
              title={isVoiceListening ? 'Listening (Click to stop)' : 'Voice Dictate Command'}
            >
              {isVoiceListening ? <Mic size={15} /> : <MicOff size={15} />}
            </button>

            {/* Runtime Scope Badge */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 shrink-0">
              {desktop ? (
                <>
                  <Laptop size={11} className="text-emerald-400" />
                  <span>Desktop Native</span>
                </>
              ) : (
                <>
                  <Globe size={11} className="text-cyan-400" />
                  <span>Web Workspace</span>
                </>
              )}
            </div>

            {/* Clear or Close Button */}
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X size={15} />
              </button>
            ) : (
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10.5px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                ESC
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-zinc-850/80 bg-[#0c0c0e] overflow-x-auto no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'aether', label: 'Aether AI' },
              { id: 'project', label: 'Projects' },
              { id: 'issue', label: 'Issues' },
              { id: 'note', label: 'Notes' },
              { id: 'file', label: 'Files' },
              { id: 'app', label: 'Apps' },
              { id: 'workflow', label: 'Workflows' },
              { id: 'github', label: 'GitHub' },
              { id: 'custom', label: 'Custom' }
            ].map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-850 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}

            <div className="ml-auto shrink-0">
              <button
                onClick={() => setShowAliasModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-yellow-400 hover:border-yellow-500/30 text-[11px] transition-colors cursor-pointer"
                title="Create custom alias / command"
              >
                <Plus size={12} />
                <span>New Alias</span>
              </button>
            </div>
          </div>

          {/* Main Results / Execution View Body */}
          <div ref={resultsContainerRef} className="flex-1 overflow-y-auto max-h-[55vh] p-2 space-y-1">
            {/* Live Execution State Banner */}
            {isExecuting && (
              <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-yellow-400">Executing Command...</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Running live action and syncing context memory.</p>
                  </div>
                </div>
                {executionLogs.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-yellow-500/10 space-y-1 font-mono text-[10.5px] text-zinc-400">
                    {executionLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-yellow-500">›</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Execution Result Details Modal/Panel */}
            {executionResult && !isExecuting && (
              <div className={`p-4 rounded-lg border mb-2 ${
                executionResult.success
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {executionResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`text-xs font-bold ${executionResult.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {executionResult.success ? 'Command Executed' : 'Execution Notice'}
                      </h4>
                      <p className="text-xs text-zinc-200 mt-1">{executionResult.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {executionResult.undoable && (
                      <button
                        onClick={async () => {
                          const undone = await undoRedoManager.undo();
                          if (undone) {
                            showToast('Undid action successfully', 'info');
                            setExecutionResult(null);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 cursor-pointer"
                      >
                        <Undo2 size={12} />
                        <span>Undo</span>
                      </button>
                    )}

                    {executionResult.detailsMarkdown && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(executionResult.detailsMarkdown || '');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                        title="Copy Markdown"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    )}

                    <button
                      onClick={() => setExecutionResult(null)}
                      className="p-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Markdown Details Rendering */}
                {executionResult.detailsMarkdown && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 prose prose-invert prose-xs max-w-none text-zinc-300 leading-relaxed">
                    <ReactMarkdown>{executionResult.detailsMarkdown}</ReactMarkdown>
                  </div>
                )}

                {/* Execution Steps */}
                {executionResult.stepsExecuted && executionResult.stepsExecuted.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-850 space-y-1 font-mono text-[10px] text-zinc-400">
                    <div className="font-semibold text-zinc-500 uppercase tracking-wider mb-1">Execution Steps:</div>
                    {executionResult.stepsExecuted.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-400">✓</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prompt Execution Fallback Item when query is typed */}
            {query.trim() && (
              <div
                data-active={selectedIndex === 0 && filteredResults.length === 0}
                onClick={() => executeCommand()}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedIndex === 0
                    ? 'bg-yellow-500/10 border-yellow-500/40 text-zinc-100 shadow-sm'
                    : 'bg-[#111115] border-zinc-850 hover:bg-zinc-850/60 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-2">
                      <span>Ask Aether / Run Natural Language:</span>
                      <span className="text-yellow-400 font-mono">"{query}"</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Process with grounded conversational engine, context memory, and action registry
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500 group-hover:text-yellow-400 text-xs font-mono">
                  <span>Enter</span>
                  <CornerDownLeft size={13} />
                </div>
              </div>
            )}

            {/* Filtered Search Results */}
            {filteredResults.map((item, idx) => {
              const isSelected = (query.trim() ? idx + 1 : idx) === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-active={isSelected}
                  onClick={() => executeCommand(item)}
                  className={`group flex items-center justify-between px-3 py-2.2 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-yellow-500/10 border-yellow-500/40 text-zinc-100 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-zinc-850/60 hover:border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-md border shrink-0 ${
                      isSelected
                        ? 'bg-yellow-500/20 border-yellow-500/30'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}>
                      {renderIcon(item.iconName, item.category)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-200 truncate">{item.title}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-400">
                            {item.badge}
                          </span>
                        )}
                        {item.scope === 'desktop_only' && !desktop && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-amber-950/40 border border-amber-500/30 text-amber-400">
                            Desktop Required
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.shortcut && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">
                        {item.shortcut}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-yellow-400 transition-colors" />
                  </div>
                </div>
              );
            })}

            {/* Empty Search State */}
            {query.trim() && filteredResults.length === 0 && (
              <div className="text-center py-6 text-zinc-500">
                <p className="text-xs font-mono">Press Enter to run "{query}" as a dynamic Aether prompt.</p>
              </div>
            )}

            {/* Empty Query State: Show Suggestions and Recent History */}
            {!query.trim() && (
              <div className="space-y-4 pt-1">
                {/* Recent Commands */}
                {recentCommands.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 pb-1.5">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                        <Clock size={11} /> Recent Commands
                      </span>
                      <button
                        onClick={() => {
                          aetherCommandBar.clearRecent();
                          setQuery(' ');
                          setTimeout(() => setQuery(''), 10);
                        }}
                        className="text-[10px] text-zinc-600 hover:text-zinc-400 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recentCommands.slice(0, 4).map(rec => (
                        <div
                          key={rec.id}
                          onClick={() => {
                            setQuery(rec.title);
                            setTimeout(() => executeCommand(), 20);
                          }}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#111114] border border-zinc-850 hover:border-zinc-750 hover:bg-zinc-850/50 cursor-pointer text-xs text-zinc-300 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Clock size={13} className="text-zinc-500 shrink-0" />
                            <span className="truncate">{rec.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                            {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Context-Aware Actions */}
                <div>
                  <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-yellow-400" /> Context Intelligence
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      { title: 'What did I work on today?', desc: 'Activity log & commit digest', icon: 'Clock', query: 'Show what I worked on today' },
                      { title: 'What needs my attention?', desc: 'Urgent issues & reviews', icon: 'AlertCircle', query: 'What needs my attention?' },
                      { title: 'Open Local Landscape', desc: 'Project intelligence hub', icon: 'Layers', query: 'Open Local Landscape' },
                      { title: 'What did I leave unfinished?', desc: 'In-progress tasks & PRs', icon: 'CheckSquare', query: 'What did I leave unfinished?' },
                      { title: 'Open in VS Code', desc: desktop ? 'Launch desktop IDE' : 'Desktop capability', icon: 'Code', query: 'Open this project in VS Code' },
                      { title: 'Open Terminal', desc: desktop ? 'Launch project shell' : 'Desktop capability', icon: 'Terminal', query: 'Open Terminal here' }
                    ].map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setQuery(sug.query);
                          setTimeout(() => executeCommand(), 20);
                        }}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#111114] border border-zinc-850 hover:border-yellow-500/40 hover:bg-zinc-850/50 text-left transition-colors cursor-pointer group"
                      >
                        <div className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-yellow-400 shrink-0 mt-0.5">
                          {renderIcon(sug.icon, undefined, 'w-3.5 h-3.5')}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-200 group-hover:text-yellow-300 truncate">{sug.title}</div>
                          <div className="text-[10.5px] text-zinc-500 truncate">{sug.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Shortcuts & Context Cheat-sheet */}
          <div className="px-4 py-2.5 border-t border-zinc-850 bg-[#0c0c0e] flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="font-mono px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">↑↓</span> Navigate
              </span>
              <span className="flex items-center gap-1">
                <span className="font-mono px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">↵</span> Execute
              </span>
              <span className="flex items-center gap-1">
                <span className="font-mono px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">Tab</span> Filter
              </span>
              <span className="flex items-center gap-1">
                <span className="font-mono px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">Esc</span> Close
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">
                Active Project: <span className="text-yellow-400 font-medium">{projects?.find(p => p.id === activeProjectId)?.name || 'DevSpace Workspace'}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Modal to Create Custom Alias / Saved Command */}
        <AnimatePresence>
          {showAliasModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAliasModal(false)}
            >
              <div
                className="w-full max-w-md bg-[#121216] border border-zinc-800 rounded-xl p-5 shadow-2xl text-zinc-100 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-bold text-zinc-100">Add Custom Command Alias</h3>
                  </div>
                  <button
                    onClick={() => setShowAliasModal(false)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Alias Trigger Name</label>
                    <input
                      type="text"
                      placeholder="e.g. editor, my dashboard, build project"
                      value={newAliasName}
                      onChange={(e) => setNewAliasName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Target Type</label>
                    <select
                      value={newAliasType}
                      onChange={(e) => setNewAliasType(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 focus:outline-none focus:border-yellow-500/50"
                    >
                      <option value="devspace_route">DevSpace Route (e.g. /projects, /brain, /github)</option>
                      <option value="website">Website URL (e.g. https://github.com)</option>
                      <option value="desktop_app">Desktop App (e.g. Visual Studio Code, Spotify)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Target Path / URL / App Name</label>
                    <input
                      type="text"
                      placeholder={newAliasType === 'devspace_route' ? '/projects' : newAliasType === 'website' ? 'https://google.com' : 'Visual Studio Code'}
                      value={newAliasTarget}
                      onChange={(e) => setNewAliasTarget(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="Shortcut description"
                      value={newAliasDesc}
                      onChange={(e) => setNewAliasDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => setShowAliasModal(false)}
                    className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewAlias}
                    className="px-3 py-1.5 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Save Alias
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
