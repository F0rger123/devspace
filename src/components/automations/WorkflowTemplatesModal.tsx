import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Zap, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { PRESET_WORKFLOW_TEMPLATES } from './nodeBank';
import { N8nWorkflow } from './types';

interface WorkflowTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: N8nWorkflow) => void;
}

export function WorkflowTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate
}: WorkflowTemplatesModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#0e0e12] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-850 flex items-center justify-between bg-[#121217]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">n8n Workflow Template Showcase</h3>
                <p className="text-xs text-zinc-400">Load pre-configured production workflows into the interactive canvas</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Template Cards */}
          <div className="p-5 overflow-y-auto space-y-4">
            {PRESET_WORKFLOW_TEMPLATES.map(tmpl => (
              <div
                key={tmpl.id}
                onClick={() => {
                  onSelectTemplate(tmpl);
                  onClose();
                }}
                className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-500/60 hover:bg-zinc-850 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                    <Zap size={11} /> {tmpl.nodes.length} Nodes
                  </span>
                </div>

                {/* Node Sequence Preview */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-zinc-850 scrollbar-none">
                  {tmpl.nodes.map((node, idx) => (
                    <div key={node.id} className="flex items-center gap-2 shrink-0">
                      <div className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                        {node.label}
                      </div>
                      {idx < tmpl.nodes.length - 1 && (
                        <ArrowRight size={12} className="text-zinc-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
