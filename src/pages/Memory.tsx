import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Search,
  Plus,
  Pin,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  Globe,
  FolderGit2,
  Monitor,
  Tag,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Layers,
  FileText,
  Sliders,
  Compass,
  Cpu,
  Workflow
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import {
  aetherLongTermMemory,
  LongTermMemory,
  MemoryCategory,
  MemoryScope,
  MemoryClassification,
  RankedMemoryResult,
  MemoryStats
} from '../lib/aetherLongTermMemoryService';
import { haptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_LABELS: Record<MemoryCategory, { label: string; icon: any; color: string }> = {
  project_goal: { label: 'Project Goal', icon: Compass, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  important_decision: { label: 'Decision', icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  architecture_choice: { label: 'Architecture', icon: Cpu, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  user_preference: { label: 'Preference', icon: Sliders, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  unresolved_blocker: { label: 'Blocker', icon: AlertCircle, color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  recurring_workflow: { label: 'Workflow', icon: Workflow, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  important_note: { label: 'Note', icon: FileText, color: 'text-zinc-300 border-zinc-500/30 bg-zinc-500/10' },
  repo_context: { label: 'Repo Context', icon: FolderGit2, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  work_theme: { label: 'Work Theme', icon: Layers, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
  explicit_user_directive: { label: 'User Directive', icon: Sparkles, color: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
  machine_specific_config: { label: 'Machine Config', icon: Monitor, color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' }
};

export function MemoryPage() {
  const { projects, activeProjectId } = useData();
  const [memories, setMemories] = useState<LongTermMemory[]>([]);
  const [stats, setStats] = useState<MemoryStats>(aetherLongTermMemory.getStats(activeProjectId));

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [selectedScope, setSelectedScope] = useState<MemoryScope | 'all'>('all');
  const [selectedClassification, setSelectedClassification] = useState<MemoryClassification | 'all'>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [showRelevanceScoring, setShowRelevanceScoring] = useState(false);

  // Quick remember input
  const [quickInput, setQuickInput] = useState('');
  const [quickCategory, setQuickCategory] = useState<MemoryCategory>('explicit_user_directive');
  const [quickScope, setQuickScope] = useState<MemoryScope>(activeProjectId ? 'project' : 'global');
  const [quickClassification, setQuickClassification] = useState<MemoryClassification>('verified_fact');

  // Edit modal
  const [editingMemory, setEditingMemory] = useState<LongTermMemory | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to updates
  useEffect(() => {
    const unsub = aetherLongTermMemory.subscribe((m) => {
      setMemories(m);
      setStats(aetherLongTermMemory.getStats(activeProjectId));
    });
    return unsub;
  }, [activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Ranked or filtered memory results
  const rankedResults: RankedMemoryResult[] = aetherLongTermMemory.queryMemories({
    query: searchQuery,
    projectId: selectedScope === 'project' ? activeProjectId : undefined,
    category: selectedCategory,
    scope: selectedScope,
    classification: selectedClassification,
    pinnedOnly,
    limit: 100
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickRemember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    haptic.medium();
    const res = aetherLongTermMemory.rememberThis(quickInput, {
      category: quickCategory,
      scope: quickScope,
      projectId: quickScope === 'project' ? activeProjectId : undefined,
      projectName: quickScope === 'project' ? activeProject?.name : undefined,
      classification: quickClassification,
      isMachineLocal: quickScope === 'machine_local'
    });

    setQuickInput('');
    showToast(res.isUpdate ? `Updated memory: "${res.memory.title}"` : `Remembered: "${res.memory.title}"`);
  };

  const handleTogglePin = (id: string) => {
    haptic.light();
    aetherLongTermMemory.togglePin(id);
  };

  const handleDelete = (id: string, title: string) => {
    haptic.warning();
    if (confirm(`Forget memory: "${title}"?`)) {
      aetherLongTermMemory.deleteMemory(id);
      showToast(`Memory deleted.`);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    haptic.light();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;

    haptic.medium();
    aetherLongTermMemory.updateMemory(editingMemory.id, {
      title: editingMemory.title,
      content: editingMemory.content,
      category: editingMemory.category,
      scope: editingMemory.scope,
      classification: editingMemory.classification,
      pinned: editingMemory.pinned,
      tags: editingMemory.tags
    });

    setEditingMemory(null);
    showToast('Memory updated successfully.');
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(aetherLongTermMemory.exportMemories());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aether-memories-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported memories as JSON.');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const res = aetherLongTermMemory.importMemories(text);
          if (res.errors) {
            alert(`Import error: ${res.errors}`);
          } else {
            showToast(`Imported ${res.imported} memories.`);
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#08080a] text-zinc-100 p-4 md:p-8 flex flex-col gap-6 custom-scrollbar">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-zinc-900/90 border border-amber-500/40 text-amber-300 text-sm font-medium shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <Sparkles size={15} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <BrainCircuit size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-light tracking-wide text-zinc-100">
                Aether Long-Term Memory
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                Durable Cortex
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-400 mt-0.5">
              Persistent structured knowledge, project goals, decisions, user preferences, and inferences across sessions.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Export memories to JSON"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Import memories from JSON"
          >
            <Upload size={13} />
            <span>Import</span>
          </button>
          <button
            onClick={() => {
              haptic.light();
              setStats(aetherLongTermMemory.getStats(activeProjectId));
              showToast('Memory index refreshed.');
            }}
            className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-750 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
            title="Refresh memory state"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Top Stat Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col">
          <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">Total Memories</span>
          <span className="text-2xl font-light text-zinc-100 mt-1">{stats.total}</span>
          <span className="text-[10px] text-zinc-400 mt-1">Deduplicated entities</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col">
          <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <CheckCircle2 size={12} /> Verified Facts
          </span>
          <span className="text-2xl font-light text-emerald-300 mt-1">{stats.verifiedFacts}</span>
          <span className="text-[10px] text-emerald-400/80 mt-1">Explicitly confirmed</span>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col">
          <span className="text-[11px] text-purple-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Sparkles size={12} /> Inferences
          </span>
          <span className="text-2xl font-light text-purple-300 mt-1">{stats.aetherInferences}</span>
          <span className="text-[10px] text-purple-400/80 mt-1">Learned from patterns</span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex flex-col">
          <span className="text-[11px] text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <FolderGit2 size={12} /> Project Scope
          </span>
          <span className="text-2xl font-light text-blue-300 mt-1">{stats.projectCount}</span>
          <span className="text-[10px] text-blue-400/80 mt-1">Linked to workspaces</span>
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col">
          <span className="text-[11px] text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Globe size={12} /> Global Scope
          </span>
          <span className="text-2xl font-light text-cyan-300 mt-1">{stats.globalCount}</span>
          <span className="text-[10px] text-cyan-400/80 mt-1">Applies everywhere</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 flex flex-col">
          <span className="text-[11px] text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1">
            <Pin size={12} /> Pinned
          </span>
          <span className="text-2xl font-light text-amber-300 mt-1">{stats.pinnedCount}</span>
          <span className="text-[10px] text-amber-400/80 mt-1">High priority recall</span>
        </div>
      </div>

      {/* Interactive "Remember This" Quick Input Box */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400">
            <Sparkles size={14} />
            <span>Teach Aether New Fact / Remember Directive</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            Natural commands like <code className="text-amber-300">"remember this: ..."</code> also work directly in chat
          </span>
        </div>

        <form onSubmit={handleQuickRemember} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="e.g., Remember that our production bundler is esbuild and our target deploy is Cloud Run..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950 border border-zinc-750 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium text-xs tracking-wide uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Plus size={14} />
              <span>Remember</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            {/* Category selection */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Category:</span>
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value as MemoryCategory)}
                className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => (
                  <option key={catKey} value={catKey}>
                    {catMeta.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Scope selection */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Scope:</span>
              <select
                value={quickScope}
                onChange={(e) => setQuickScope(e.target.value as MemoryScope)}
                className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs outline-none"
              >
                <option value="global">Global (All Projects)</option>
                {activeProject && (
                  <option value="project">Current Project ({activeProject.name})</option>
                )}
                <option value="machine_local">Machine Local (This Host Only)</option>
              </select>
            </div>

            {/* Classification */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Classification:</span>
              <select
                value={quickClassification}
                onChange={(e) => setQuickClassification(e.target.value as MemoryClassification)}
                className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs outline-none"
              >
                <option value="verified_fact">Verified Fact</option>
                <option value="aether_inference">Aether Inference</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or simulate context recall (e.g. 'voice', 'bundler', 'goals')..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Relevance scoring toggle */}
          <button
            onClick={() => {
              haptic.light();
              setShowRelevanceScoring(!showRelevanceScoring);
            }}
            className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              showRelevanceScoring
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={13} />
            <span>{showRelevanceScoring ? 'Hide Relevance Metrics' : 'Show Live Ranking Scores'}</span>
          </button>

          {/* Pinned only toggle */}
          <button
            onClick={() => {
              haptic.light();
              setPinnedOnly(!pinnedOnly);
            }}
            className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              pinnedOnly
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Pin size={13} />
            <span>Pinned Only</span>
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-zinc-100 text-zinc-900 font-medium'
                : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Categories ({stats.total})
          </button>

          {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => {
            const count = stats.categories[catKey] || 0;
            if (count === 0 && selectedCategory !== catKey) return null;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey as MemoryCategory)}
                className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap border flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedCategory === catKey
                    ? catMeta.color
                    : 'bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{catMeta.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Scope and Classification Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Scope:</span>
            <div className="flex rounded-md bg-zinc-950 p-0.5 border border-zinc-850">
              <button
                onClick={() => setSelectedScope('all')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  selectedScope === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedScope('global')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  selectedScope === 'global' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                Global
              </button>
              {activeProject && (
                <button
                  onClick={() => setSelectedScope('project')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    selectedScope === 'project' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                  }`}
                >
                  This Project
                </button>
              )}
              <button
                onClick={() => setSelectedScope('machine_local')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  selectedScope === 'machine_local' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                Machine Local
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Classification:</span>
            <div className="flex rounded-md bg-zinc-950 p-0.5 border border-zinc-850">
              <button
                onClick={() => setSelectedClassification('all')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  selectedClassification === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedClassification('verified_fact')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  selectedClassification === 'verified_fact' ? 'bg-emerald-950 text-emerald-300' : 'text-zinc-400'
                }`}
              >
                Verified Facts
              </button>
              <button
                onClick={() => setSelectedClassification('aether_inference')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  selectedClassification === 'aether_inference' ? 'bg-purple-950 text-purple-300' : 'text-zinc-400'
                }`}
              >
                Inferences
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Results Grid */}
      <div className="flex-1">
        {rankedResults.length === 0 ? (
          <div className="p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center flex flex-col items-center justify-center gap-3">
            <BrainCircuit size={36} className="text-zinc-600" />
            <div className="text-sm font-medium text-zinc-300">No matching long-term memories found</div>
            <p className="text-xs text-zinc-400 max-w-md">
              Try adjusting your search query or teach Aether something new using the input bar above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {rankedResults.map(({ memory, relevanceScore, recencyScore, compositeRank, matchReasons }) => {
              const catMeta = CATEGORY_LABELS[memory.category] || CATEGORY_LABELS.explicit_user_directive;
              const Icon = catMeta.icon;
              const isFact = memory.classification === 'verified_fact';

              return (
                <div
                  key={memory.id}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                    memory.pinned
                      ? 'bg-zinc-900/90 border-amber-500/40 shadow-lg'
                      : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Top Bar: Category, Scope, Classification, Pin */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Category Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${catMeta.color}`}>
                        <Icon size={11} />
                        <span>{catMeta.label}</span>
                      </span>

                      {/* Scope Badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                        {memory.scope === 'project' ? (
                          <>
                            <FolderGit2 size={10} />
                            <span>{memory.projectName || 'Project'}</span>
                          </>
                        ) : memory.scope === 'machine_local' ? (
                          <>
                            <Monitor size={10} />
                            <span>Local Machine</span>
                          </>
                        ) : (
                          <>
                            <Globe size={10} />
                            <span>Global</span>
                          </>
                        )}
                      </span>

                      {/* Fact vs Inference */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          isFact
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                        }`}
                      >
                        {isFact ? 'FACT' : 'INFERENCE'}
                      </span>
                    </div>

                    {/* Pin and Action Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePin(memory.id)}
                        className={`p-1.5 rounded hover:bg-zinc-800 transition-all cursor-pointer ${
                          memory.pinned ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                        title={memory.pinned ? 'Unpin memory' : 'Pin memory'}
                      >
                        <Pin size={14} className={memory.pinned ? 'fill-amber-400' : ''} />
                      </button>

                      <button
                        onClick={() => setEditingMemory(memory)}
                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                        title="Edit memory"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(memory.id, memory.title)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                        title="Forget / Delete memory"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm font-medium text-zinc-100 tracking-wide leading-snug">
                      {memory.title}
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {memory.content}
                    </p>
                  </div>

                  {/* Optional Live Ranking Details */}
                  {showRelevanceScoring && (
                    <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-850 text-[11px] font-mono flex flex-col gap-1 text-zinc-400">
                      <div className="flex items-center justify-between text-amber-300">
                        <span>Composite Rank: {(compositeRank * 100).toFixed(1)}%</span>
                        <span>Relevance: {(relevanceScore * 100).toFixed(0)}%</span>
                        <span>Recency: {(recencyScore * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Reasons: {matchReasons.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Bottom Metadata & Copy */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock size={11} />
                        {new Date(memory.updatedAt).toLocaleDateString()}
                      </span>
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          <Tag size={10} />
                          <span>{memory.tags.slice(0, 3).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopy(`${memory.title}: ${memory.content}`, memory.id)}
                      className="px-2 py-0.5 rounded bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedId === memory.id ? (
                        <>
                          <Check size={11} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Memory Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-750 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-medium text-zinc-100 flex items-center gap-2">
                <Edit3 size={16} className="text-amber-400" />
                <span>Edit Long-Term Memory</span>
              </h2>
              <button
                onClick={() => setEditingMemory(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Title / Key Topic</label>
                <input
                  type="text"
                  value={editingMemory.title}
                  onChange={(e) => setEditingMemory({ ...editingMemory, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-zinc-100 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Detailed Memory Content</label>
                <textarea
                  rows={4}
                  value={editingMemory.content}
                  onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-zinc-100 outline-none focus:border-amber-500 resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Category</label>
                  <select
                    value={editingMemory.category}
                    onChange={(e) => setEditingMemory({ ...editingMemory, category: e.target.value as MemoryCategory })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-zinc-100 outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catMeta]) => (
                      <option key={catKey} value={catKey}>
                        {catMeta.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Classification</label>
                  <select
                    value={editingMemory.classification}
                    onChange={(e) => setEditingMemory({ ...editingMemory, classification: e.target.value as MemoryClassification })}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-750 text-zinc-100 outline-none"
                  >
                    <option value="verified_fact">Verified Fact</option>
                    <option value="aether_inference">Aether Inference</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editPinned"
                  checked={editingMemory.pinned}
                  onChange={(e) => setEditingMemory({ ...editingMemory, pinned: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-950 text-amber-500"
                />
                <label htmlFor="editPinned" className="text-zinc-300">
                  Pin to high-priority recall context
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingMemory(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
