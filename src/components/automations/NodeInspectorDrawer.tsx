import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Trash2,
  Copy,
  Sparkles,
  Settings,
  CheckCircle2,
  Loader2,
  Code,
  Terminal,
  Zap,
  CheckSquare
} from 'lucide-react';
import { AutomationNode } from './types';
import { NODE_LIBRARY } from './nodeBank';

interface NodeInspectorDrawerProps {
  node: AutomationNode | null;
  onClose: () => void;
  onUpdateNodeConfig: (nodeId: string, label: string, description: string, config: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
}

export function NodeInspectorDrawer({
  node,
  onClose,
  onUpdateNodeConfig,
  onDeleteNode,
  onDuplicateNode
}: NodeInspectorDrawerProps) {
  const [testOutput, setTestOutput] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!node) return null;

  const nodeDef = NODE_LIBRARY.find(def => def.type === node.type);

  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = { ...node.config, [key]: value };
    onUpdateNodeConfig(node.id, node.label, node.description, updatedConfig);
  };

  const handleTestStep = async () => {
    setIsTesting(true);
    setTestOutput(null);

    try {
      // Simulate real-time node test execution
      if (node.type.startsWith('ai-')) {
        const res = await fetch('/api/automations/run-agent-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepId: node.id,
            action: 'prompt',
            prompt: node.config?.prompt || 'Summarize active workspace tasks'
          })
        });
        const data = await res.json();
        setTestOutput(data);
      } else {
        await new Promise(r => setTimeout(r, 800));
        setTestOutput({
          status: 'success',
          executedAt: new Date().toISOString(),
          nodeId: node.id,
          type: node.type,
          outputPayload: {
            result: 'Node executed successfully in isolated sandbox test mode.',
            configApplied: node.config
          }
        });
      }
    } catch (err: any) {
      setTestOutput({
        status: 'error',
        message: err.message || 'Execution error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0c0c10] border-l border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-850 flex items-center justify-between bg-[#0f0f14]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Settings size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Node Inspector</h3>
              <p className="text-[11px] text-zinc-400 font-mono">{node.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDuplicateNode(node.id)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
              title="Duplicate node"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => {
                onDeleteNode(node.id);
                onClose();
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              title="Delete node"
            >
              <Trash2 size={14} />
            </button>
            <div className="w-[1px] h-4 bg-zinc-800 my-1" />
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form Controls */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Label & Description */}
          <div className="space-y-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-850">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Node Title</label>
              <input
                type="text"
                value={node.label}
                onChange={e => onUpdateNodeConfig(node.id, e.target.value, node.description, node.config)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Description</label>
              <textarea
                rows={2}
                value={node.description}
                onChange={e => onUpdateNodeConfig(node.id, node.label, e.target.value, node.config)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50 resize-none"
              />
            </div>
          </div>

          {/* Type Specific Custom Config Parameters */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={13} /> Node Parameters
            </h4>

            {/* AI Prompts */}
            {node.type.startsWith('ai-') && (
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">AI Prompt Instruction</label>
                <textarea
                  rows={4}
                  value={node.config?.prompt || ''}
                  onChange={e => handleConfigChange('prompt', e.target.value)}
                  placeholder="Enter custom prompt for Gemini AI model..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50 resize-none font-mono"
                />
              </div>
            )}

            {/* Email Config */}
            {node.type === 'action-send-email' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={node.config?.recipient || ''}
                    onChange={e => handleConfigChange('recipient', e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={node.config?.subject || ''}
                    onChange={e => handleConfigChange('subject', e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
              </>
            )}

            {/* Webhook Path */}
            {node.type === 'trigger-webhook' && (
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Webhook Endpoint Endpoint</label>
                <input
                  type="text"
                  value={node.config?.path || ''}
                  onChange={e => handleConfigChange('path', e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-emerald-400 font-mono focus:outline-none focus:border-yellow-500/50"
                />
              </div>
            )}

            {/* Task Creation Config */}
            {node.type === 'action-create-task' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Task Title Template</label>
                  <input
                    type="text"
                    value={node.config?.title || ''}
                    onChange={e => handleConfigChange('title', e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1">Assignee</label>
                  <input
                    type="text"
                    value={node.config?.assignee || ''}
                    onChange={e => handleConfigChange('assignee', e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
              </>
            )}
          </div>

          {/* Test Node Execution Section */}
          <div className="pt-4 border-t border-zinc-850 space-y-3">
            <button
              onClick={handleTestStep}
              disabled={isTesting}
              className="w-full py-2 bg-yellow-500 text-black font-extrabold rounded-xl hover:bg-yellow-400 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)] disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Executing Node Sandbox Test...
                </>
              ) : (
                <>
                  <Play size={14} strokeWidth={3} /> Test Node Step
                </>
              )}
            </button>

            {/* Test Payload Terminal */}
            {testOutput && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto space-y-2">
                <div className="flex items-center justify-between text-zinc-500 text-[10px] border-b border-zinc-900 pb-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={12} /> Execution Output
                  </span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(testOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
