import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Sparkles,
  Clock,
  AlertTriangle,
  Play,
  Cpu,
  Lightbulb,
  CheckSquare,
  Mail,
  Database,
  Globe,
  GitMerge,
  Hourglass,
  Github,
  MessageSquare,
  Webhook,
  Zap,
  Layers,
  Bot
} from 'lucide-react';
import { NODE_LIBRARY } from './nodeBank';
import { NodeTypeDefinition, NodeCategory } from './types';

interface NodePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (nodeType: NodeTypeDefinition) => void;
}

const ICON_MAP: Record<string, any> = {
  Webhook,
  Clock,
  AlertTriangle,
  Play,
  Sparkles,
  Cpu,
  Lightbulb,
  CheckSquare,
  Mail,
  Database,
  Globe,
  GitMerge,
  Hourglass,
  Github,
  MessageSquare
};

const CATEGORIES: { id: NodeCategory | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All Tools', icon: Layers },
  { id: 'trigger', label: 'Triggers', icon: Zap },
  { id: 'ai', label: 'AI & Models', icon: Bot },
  { id: 'action', label: 'Actions', icon: CheckSquare },
  { id: 'logic', label: 'Logic & Flow', icon: GitMerge },
  { id: 'integration', label: 'Integrations', icon: Github }
];

export function NodePaletteModal({ isOpen, onClose, onAddNode }: NodePaletteModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all');

  if (!isOpen) return null;

  const filteredNodes = NODE_LIBRARY.filter(node => {
    const matchesSearch =
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#0e0e12] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-zinc-850 flex items-center justify-between bg-[#121217]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Zap size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Add Automation Node</h3>
                <p className="text-xs text-zinc-400">Select a trigger, AI agent, or action tool to append to workflow canvas</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search & Category Pills */}
          <div className="p-4 border-b border-zinc-850 space-y-3 bg-[#0a0a0d]">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Search nodes (e.g., Gemini AI, Webhook, Email alert, Firestore)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/40 font-bold'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-850'
                    }`}
                  >
                    <Icon size={13} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Node Grid */}
          <div className="p-4 overflow-y-auto max-h-[420px] grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredNodes.map(node => {
              const Icon = ICON_MAP[node.iconName] || Sparkles;
              return (
                <div
                  key={node.type}
                  onClick={() => {
                    onAddNode(node);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 hover:border-yellow-500/50 hover:bg-zinc-850 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${node.bgColor} ${node.borderColor} ${node.color} shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-yellow-400 transition-colors">
                        {node.label}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                        {node.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="uppercase tracking-wider font-semibold">{node.category}</span>
                    <span className="text-yellow-400/80 group-hover:text-yellow-400 font-medium">
                      + Add to Canvas
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredNodes.length === 0 && (
              <div className="col-span-2 text-center py-10 text-zinc-500 text-xs">
                No automation nodes matched your search terms. Try searching for "AI", "Email", or "Trigger".
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
