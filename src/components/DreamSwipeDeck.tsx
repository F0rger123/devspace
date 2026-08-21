import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Sparkles, Check, X, ArrowLeft, ArrowRight, ThumbsUp, ThumbsDown, 
  RotateCcw, CheckCircle2, Code, ShieldCheck, Zap, Layers, FolderGit2, 
  BrainCircuit, Database, CheckSquare, Brain
} from 'lucide-react';
import { haptic } from '../utils/haptics';

export interface DreamRecommendation {
  id: string;
  title: string;
  description: string;
  snippet?: string;
  category?: 'refactor' | 'security' | 'performance' | 'accessibility' | 'design' | 'new_ideas' | 'general' | string;
  status?: 'active' | 'approved' | 'dismissed' | 'merged' | string;
  createdAt?: number;
  mergedAt?: number;
  mergedCommitSha?: string;
  mergedBranch?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  dreamRecommendations?: DreamRecommendation[];
  brainstormIdeas?: any[];
  dreamLogs?: string[];
  dreamFocus?: string;
}

interface DreamSwipeDeckProps {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  updateProject: (projectId: string, data: any) => void;
  addIssue?: (issue: any) => void;
  setCortexSynapses?: (synapses: any) => void;
  cortexSynapses?: any[];
}

export function DreamSwipeDeck({
  projects,
  activeProjectId = 'all',
  onSelectProject,
  updateProject,
  addIssue,
  setCortexSynapses,
  cortexSynapses = []
}: DreamSwipeDeckProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Sync selected project with prop if changed
  useEffect(() => {
    if (activeProjectId) {
      setSelectedProjectId(activeProjectId);
      setCurrentIndex(0);
    }
  }, [activeProjectId]);

  // Learning model persisted in localStorage
  const [learningStats, setLearningStats] = useState<Record<string, { approved: number; denied: number }>>(() => {
    try {
      const saved = localStorage.getItem('aether_dream_learning_stats');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aether_dream_learning_stats', JSON.stringify(learningStats));
    } catch (e) {
      console.error(e);
    }
  }, [learningStats]);

  // Aggregate all dreams across or filtered by project
  const allProjectDreams = useMemo(() => {
    const list: Array<DreamRecommendation & { projectId: string; projectName: string }> = [];
    
    projects.forEach(proj => {
      if (selectedProjectId === 'all' || proj.id === selectedProjectId) {
        if (proj.dreamRecommendations && proj.dreamRecommendations.length > 0) {
          proj.dreamRecommendations.forEach(rec => {
            // Include active or undecided recommendations first
            if (rec.status !== 'approved' && rec.status !== 'dismissed') {
              list.push({
                ...rec,
                projectId: proj.id,
                projectName: proj.name
              });
            }
          });
        }
      }
    });

    return list;
  }, [projects, selectedProjectId]);

  const currentDream = allProjectDreams[currentIndex] || null;

  // Motion values for swipe gestures
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacityYes = useTransform(x, [10, 100], [0, 1]);
  const opacityNo = useTransform(x, [-10, -100], [0, 1]);

  const recordFeedback = (dream: DreamRecommendation & { projectId: string; projectName: string }, approved: boolean) => {
    const category = dream.category || 'general';
    
    // 1. Update Learning Stats
    setLearningStats(prev => {
      const existing = prev[category] || { approved: 0, denied: 0 };
      return {
        ...prev,
        [category]: {
          approved: approved ? existing.approved + 1 : existing.approved,
          denied: !approved ? existing.denied + 1 : existing.denied
        }
      };
    });

    // 2. Update Project Data
    const proj = projects.find(p => p.id === dream.projectId);
    if (proj) {
      const updatedRecs = (proj.dreamRecommendations || []).map(r => {
        if (r.id === dream.id) {
          const newStatus: 'approved' | 'dismissed' = approved ? 'approved' : 'dismissed';
          return { ...r, status: newStatus };
        }
        return r;
      });

      const currentLogs = proj.dreamLogs || [];
      const logMessage = approved
        ? `💡 AI Learner: User APPROVED "${dream.title}" (${category}). AI model weight increased for [${category}] category.`
        : `❌ AI Learner: User DENIED "${dream.title}" (${category}). AI model configured exclusion rule to reduce similar [${category}] suggestions.`;

      // If approved, optionally convert to brainstorm idea or issue
      let updatedIdeas = proj.brainstormIdeas || [];
      if (approved) {
        updatedIdeas = [
          ...updatedIdeas,
          {
            id: `idea-dream-${Date.now()}`,
            text: dream.title,
            details: `${dream.description}\n\nSnippet:\n${dream.snippet || ''}`,
            status: 'approved',
            createdAt: Date.now()
          }
        ];
      }

      updateProject(proj.id, {
        dreamRecommendations: updatedRecs,
        brainstormIdeas: updatedIdeas,
        dreamLogs: [...currentLogs, logMessage]
      });
    }

    if (approved && addIssue) {
      addIssue({
        projectId: dream.projectId,
        title: `[AI Dream] ${dream.title}`,
        description: `${dream.description}\n\nCode snippet:\n\`\`\`typescript\n${dream.snippet || ''}\n\`\`\``,
        priority: dream.category === 'security' ? 'High' : 'Medium',
        status: 'Todo',
        type: 'Feature'
      });
    }

    // 3. User feedback
    haptic.medium();
    const noticeText = approved 
      ? `✅ Approved! Added to ${dream.projectName} ideas & AI model learned preference.`
      : `❌ Denied. AI model learned to exclude similar suggestions.`;
    setActionNotice(noticeText);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentDream) return;
    setExitDirection(direction);
    recordFeedback(currentDream, direction === 'right');
    setTimeout(() => {
      setExitDirection(null);
      x.set(0);
      if (currentIndex < allProjectDreams.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 200);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        handleSwipe('right');
      } else if (e.key === 'ArrowLeft') {
        handleSwipe('left');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allProjectDreams, currentDream]);

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'security': return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
      case 'performance': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
      case 'design': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25';
      case 'refactor': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25';
      case 'new_ideas': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25';
      default: return 'text-purple-400 bg-purple-500/10 border-purple-500/25';
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* PROJECT SELECTOR STRIP */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold shrink-0">Filter Project:</span>
        <button
          onClick={() => { setSelectedProjectId('all'); setCurrentIndex(0); if (onSelectProject) onSelectProject('all'); }}
          className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
            selectedProjectId === 'all'
              ? 'bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.3)]'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
          }`}
        >
          🌟 All Projects ({projects.reduce((acc, p) => acc + (p.dreamRecommendations?.filter(r => r.status !== 'approved' && r.status !== 'dismissed').length || 0), 0)})
        </button>
        {projects.map(p => {
          const count = p.dreamRecommendations?.filter(r => r.status !== 'approved' && r.status !== 'dismissed').length || 0;
          return (
            <button
              key={p.id}
              onClick={() => { setSelectedProjectId(p.id); setCurrentIndex(0); if (onSelectProject) onSelectProject(p.id); }}
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedProjectId === p.id
                  ? 'bg-yellow-500 text-black shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span>📁 {p.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${selectedProjectId === p.id ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SWIPE DECK CONTAINER */}
      <div className="relative flex flex-col items-center justify-center min-h-[380px] w-full max-w-xl mx-auto">
        {/* Notice alert */}
        <AnimatePresence>
          {actionNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-12 z-30 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl text-xs font-mono text-zinc-200 flex items-center gap-2"
            >
              <Sparkles size={13} className="text-yellow-400 animate-pulse" />
              <span>{actionNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {currentDream ? (
          <div className="relative w-full flex flex-col items-center">
            
            {/* Card Progress Indicator */}
            <div className="flex items-center justify-between w-full mb-3 px-2 text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                <Layers size={12} className="text-yellow-500" />
                <span>Recommendation {currentIndex + 1} of {allProjectDreams.length}</span>
              </span>
              <span className="text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                Keyboard: ⬅️ No / Yes ➡️
              </span>
            </div>

            {/* SWIPE CARD */}
            <motion.div
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(e, info) => {
                if (info.offset.x > 100) {
                  handleSwipe('right');
                } else if (info.offset.x < -100) {
                  handleSwipe('left');
                }
              }}
              animate={exitDirection === 'right' ? { x: 500, opacity: 0 } : exitDirection === 'left' ? { x: -500, opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-full bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden cursor-grab active:cursor-grabbing select-none flex flex-col gap-4 text-left border-t-2 border-t-yellow-500/40"
            >
              {/* Overlay Yes Badge */}
              <motion.div 
                style={{ opacity: opacityYes }}
                className="absolute top-6 right-6 z-20 px-4 py-1.5 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 font-extrabold text-sm uppercase rounded-lg rotate-12 shadow-lg flex items-center gap-1.5"
              >
                <ThumbsUp size={16} /> YES (APPROVE)
              </motion.div>

              {/* Overlay No Badge */}
              <motion.div 
                style={{ opacity: opacityNo }}
                className="absolute top-6 left-6 z-20 px-4 py-1.5 bg-rose-500/20 border-2 border-rose-500 text-rose-400 font-extrabold text-sm uppercase rounded-lg -rotate-12 shadow-lg flex items-center gap-1.5"
              >
                <ThumbsDown size={16} /> NO (DENY)
              </motion.div>

              {/* Card Header Info */}
              <div className="flex items-start justify-between gap-3 border-b border-zinc-850 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9.5px] font-mono font-extrabold px-2 py-0.5 rounded-full border bg-zinc-900 border-zinc-800 text-zinc-300">
                      📁 {currentDream.projectName}
                    </span>
                    <span className={`text-[9.5px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${getCategoryColor(currentDream.category)}`}>
                      {(currentDream.category || 'refactor').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100 mt-1 leading-snug">
                    {currentDream.title}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {currentDream.description}
              </p>

              {/* Code Snippet if present */}
              {currentDream.snippet && (
                <div className="space-y-1 mt-1">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold block">Proposed Solution AST Snippet:</span>
                  <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-[10.5px] font-mono text-yellow-500/90 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar select-text">
                    <code>{currentDream.snippet}</code>
                  </div>
                </div>
              )}

              {/* Drag Hint */}
              <div className="text-[9.5px] font-mono text-zinc-500 text-center pt-2 border-t border-zinc-850/60 flex items-center justify-between">
                <span>👈 Swipe Left to Deny</span>
                <span className="text-yellow-500 font-bold">Drag Card or Click Below</span>
                <span>Swipe Right to Approve 👉</span>
              </div>
            </motion.div>

            {/* ACTION BUTTONS (LEFT / RIGHT) */}
            <div className="flex items-center gap-4 w-full mt-4">
              <button
                onClick={() => handleSwipe('left')}
                className="flex-1 py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <X size={16} /> 👎 NO / DENY (Left)
              </button>

              <button
                onClick={() => handleSwipe('right')}
                className="flex-1 py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              >
                <Check size={16} /> YES / APPROVE (Right) 👍
              </button>
            </div>

          </div>
        ) : (
          /* ALL DREAMS REVIEWED STATE */
          <div className="w-full bg-[#121215] border border-zinc-850 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 text-zinc-400">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-200">All Dreams Reviewed!</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                {selectedProjectId === 'all'
                  ? "You've reviewed all active recommendations across your workspace projects!"
                  : `You've reviewed all recommendations for this project.`}
              </p>
            </div>

            <button
              onClick={() => setCurrentIndex(0)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-colors mt-2"
            >
              <RotateCcw size={14} /> Review Again
            </button>
          </div>
        )}
      </div>

      {/* AI LEARNER PREFERENCE MATRIX */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 text-left font-mono">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
            <BrainCircuit size={13} className="text-yellow-500" /> AI Preference Learning Matrix
          </span>
          <span className="text-[9px] text-zinc-500">Learns what you want and don't want</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mt-2">
          {['security', 'performance', 'refactor', 'design', 'new_ideas'].map(cat => {
            const stat = learningStats[cat] || { approved: 0, denied: 0 };
            const total = stat.approved + stat.denied;
            const approvalRate = total > 0 ? Math.round((stat.approved / total) * 100) : 0;

            return (
              <div key={cat} className="bg-[#121215] border border-zinc-900 p-2 rounded-lg flex flex-col gap-1">
                <span className="text-[9px] text-zinc-400 uppercase font-bold truncate">
                  {cat.replace('_', ' ')}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">👍 {stat.approved}</span>
                  <span className="text-rose-400">👎 {stat.denied}</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-0.5">
                  <div 
                    className="bg-emerald-400 h-full transition-all duration-300" 
                    style={{ width: `${approvalRate}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
