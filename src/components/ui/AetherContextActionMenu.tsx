import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  FileText,
  Copy,
  Bug,
  BookOpen,
  Search,
  Wrench,
  FolderKanban,
  MessageSquare,
  Zap,
  Layers,
  Scale,
  Shield,
  Cloud,
  Check,
  AlertCircle,
  Play,
  X,
  ChevronRight,
  Code2,
  Layout,
  Type,
  Maximize2
} from 'lucide-react';
import {
  aetherContextActions,
  ContextCaptureData,
  ContextActionResult,
  ActionExecutionContext
} from '../../lib/aetherContextModeActions';
import { useData } from '../../context/DataProvider';
import { useSafeOverlayNavigate } from '../../hooks/useSafeOverlayNavigate';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AetherContextActionMenuProps {
  captureData: ContextCaptureData;
  onClose?: () => void;
  onExecuteCustomAction?: (actionId: string, result: ContextActionResult) => void;
  inline?: boolean;
}

export const AetherContextActionMenu: React.FC<AetherContextActionMenuProps> = ({
  captureData,
  onClose,
  onExecuteCustomAction,
  inline = false,
}) => {
  const { projects, activeProjectId, addNote, addIssue, showToast } = useData();
  const navigate = useSafeOverlayNavigate();

  const [activeTab, setActiveTab] = useState<'recommended' | 'code' | 'ui' | 'text' | 'workflows' | 'compare'>('recommended');
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<ContextActionResult | null>(null);
  const [cloudConsentPending, setCloudConsentPending] = useState<string | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);

  const activeProject = projects?.find(p => p.id === (activeProjectId || captureData.projectId));
  const currentProjectName = activeProject?.name || captureData.projectName || 'DevSpace Desktop';

  const executionContext: ActionExecutionContext = {
    activeProjectId: activeProjectId || captureData.projectId,
    projects,
    addNote: async (note) => {
      if (addNote) return await addNote(note);
    },
    addIssue: async (issue) => {
      if (addIssue) return await addIssue(issue);
    },
    showToast: (msg, type) => {
      if (showToast) showToast(msg, type as any);
    },
    navigate: (path) => navigate(path),
    openAetherChatWithPrompt: (prompt, attachment) => {
      window.dispatchEvent(new CustomEvent('aether-inject-chat-context', {
        detail: { prompt, attachment }
      }));
      navigate('/assistant');
    }
  };

  const handleActionClick = async (actionId: string, requiresCloud: boolean = false) => {
    if (requiresCloud) {
      setCloudConsentPending(actionId);
      return;
    }
    await executeAction(actionId);
  };

  const executeAction = async (actionId: string) => {
    setCloudConsentPending(null);
    setExecutingActionId(actionId);

    try {
      let result: ContextActionResult;
      switch (actionId) {
        case 'explain':
          result = await aetherContextActions.executeExplain(captureData, executionContext);
          break;
        case 'summarize':
          result = await aetherContextActions.executeSummarize(captureData);
          break;
        case 'copy':
          result = await aetherContextActions.executeCopy(captureData, executionContext);
          break;
        case 'save_note':
          result = await aetherContextActions.executeSaveNote(captureData, executionContext);
          break;
        case 'create_issue':
          result = await aetherContextActions.executeCreateIssue(captureData, executionContext);
          break;
        case 'search_error':
          result = await aetherContextActions.executeSearchError(captureData);
          break;
        case 'find_docs':
          result = await aetherContextActions.executeFindDocs(captureData);
          break;
        case 'brainstorm_fix':
          result = await aetherContextActions.executeBrainstormFix(captureData);
          break;
        case 'open_project':
          result = await aetherContextActions.executeOpenRelatedProject(captureData, executionContext);
          break;
        case 'ask_aether':
          result = await aetherContextActions.executeAskAether(captureData, executionContext);
          break;
        case 'add_workflow':
          result = await aetherContextActions.executeAddToWorkflow(captureData, executionContext);
          break;
        case 'turn_into_dream':
          result = await aetherContextActions.executeTurnIntoDream(captureData, executionContext);
          break;
        case 'compare':
          result = await aetherContextActions.executeCompareSelections(captureData, undefined);
          break;
        case 'multi_step':
          result = await aetherContextActions.executeMultiStepAction(captureData, executionContext);
          break;
        default:
          result = await aetherContextActions.executeExplain(captureData, executionContext);
      }

      setActionResult(result);
      if (onExecuteCustomAction) {
        onExecuteCustomAction(actionId, result);
      }
    } catch (err: any) {
      setActionResult({
        actionId,
        actionTitle: 'Action Error',
        success: false,
        requiresCloudAI: false,
        markdownOutput: `### ❌ Action Failed\n\n${err.message || 'An error occurred during execution.'}`,
        error: err.message
      });
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleSetComparisonSlot = (slot: 'first' | 'second') => {
    aetherContextActions.setComparisonSelection(slot, captureData);
    if (showToast) {
      showToast(`Set "${captureData.label}" as Comparison Selection ${slot === 'first' ? 'A' : 'B'}`, 'success', 2500);
    }
  };

  // If capture strictly failed or is empty
  if (captureData.contentType === 'empty_or_failed') {
    return (
      <div className={`p-4 bg-[#121215] border border-red-500/30 rounded-2xl shadow-2xl text-zinc-300 font-sans ${inline ? 'w-full' : 'max-w-md w-full'}`}>
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Empty Context Selection</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white rounded-lg transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
          No text, code AST, or DOM elements were found in the selected screen bounds.
        </p>
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 space-y-1.5 mb-4">
          <div className="font-semibold text-zinc-300">💡 Recommended Solutions:</div>
          <div>1. Redraw a larger region covering visible text or buttons.</div>
          <div>2. Paste text directly into Aether Chat.</div>
          <div>3. In desktop mode, ensure screen capture permissions are enabled.</div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Dismiss Selection
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-[#0f0f12] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-zinc-200 ${inline ? 'w-full' : 'max-w-xl w-full'}`}>
      
      {/* Header with Domain Badge & Project Context */}
      <div className="p-3.5 bg-[#141418] border-b border-zinc-800/80 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100 truncate">{captureData.label}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider flex items-center gap-1 ${
                captureData.contentType === 'code_error'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                  : captureData.contentType === 'ui_selection'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              }`}>
                {captureData.contentType === 'code_error' && <Code2 size={10} />}
                {captureData.contentType === 'ui_selection' && <Layout size={10} />}
                {captureData.contentType === 'text_content' && <Type size={10} />}
                <span>{captureData.contentType.replace('_', ' ')}</span>
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
              <span>Project: <strong className="text-zinc-400">{currentProjectName}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Shield size={10} /> Local Privacy Protected
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Close Menu"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cloud Consent Warning Gate Modal */}
      <AnimatePresence>
        {cloudConsentPending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 bg-amber-950/40 border-b border-amber-500/30 text-amber-200 select-none"
          >
            <div className="flex items-start gap-2.5">
              <Cloud size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <div className="font-bold text-amber-300">Cloud AI Model Gating Notice</div>
                <div>
                  This action involves sending the selected text snippet to Aether Cloud Intelligence for multi-turn reasoning. Sensitive screen data will only be used for this conversation.
                </div>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={() => executeAction(cloudConsentPending)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold transition-colors"
                  >
                    Confirm &amp; Proceed
                  </button>
                  <button
                    onClick={() => setCloudConsentPending(null)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Tabs */}
      <div className="flex border-b border-zinc-800/80 bg-zinc-950/50 p-1 select-none overflow-x-auto scrollbar-none">
        {[
          { id: 'recommended', label: 'Recommended' },
          { id: 'code', label: 'Code & Errors' },
          { id: 'ui', label: 'UI & Design' },
          { id: 'text', label: 'Text & Notes' },
          { id: 'workflows', label: 'Automations' },
          { id: 'compare', label: 'Compare' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action Grid Body */}
      <div className="p-3.5 space-y-3 max-h-[380px] overflow-y-auto">
        
        {/* RECOMMENDED ACTIONS */}
        {activeTab === 'recommended' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ActionButton
              icon={Sparkles}
              title="Explain This"
              description="Analyze syntax, causes, or layout semantics"
              isExecuting={executingActionId === 'explain'}
              onClick={() => handleActionClick('explain')}
              badge="Local"
            />
            <ActionButton
              icon={FileText}
              title="Summarize This"
              description="Generate scannable bullet points and insights"
              isExecuting={executingActionId === 'summarize'}
              onClick={() => handleActionClick('summarize')}
              badge="Local"
            />
            <ActionButton
              icon={Bug}
              title="Create Issue"
              description={`Track in project "${currentProjectName}"`}
              isExecuting={executingActionId === 'create_issue'}
              onClick={() => handleActionClick('create_issue')}
              badge="Local"
            />
            <ActionButton
              icon={BookOpen}
              title="Save as Note"
              description="Store in workspace docs & project memory"
              isExecuting={executingActionId === 'save_note'}
              onClick={() => handleActionClick('save_note')}
              badge="Local"
            />
            <ActionButton
              icon={MessageSquare}
              title="Ask Aether About This"
              description="Attach context snippet directly to Chat"
              isExecuting={executingActionId === 'ask_aether'}
              onClick={() => handleActionClick('ask_aether', true)}
              badge="Cloud AI"
            />
            <ActionButton
              icon={Zap}
              title="Run Multi-Step Pipeline"
              description="Analyze, brainstorm fix, & create note"
              isExecuting={executingActionId === 'multi_step'}
              onClick={() => handleActionClick('multi_step')}
              badge="Multi-Step"
            />
          </div>
        )}

        {/* CODE & ERRORS TAB */}
        {activeTab === 'code' && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ActionButton
                icon={Search}
                title="Search This Error"
                description="Diagnose root cause and view web search links"
                isExecuting={executingActionId === 'search_error'}
                onClick={() => handleActionClick('search_error')}
                badge="Local"
              />
              <ActionButton
                icon={Wrench}
                title="Brainstorm a Fix"
                description="Generate 3 concrete code patches and AST diffs"
                isExecuting={executingActionId === 'brainstorm_fix'}
                onClick={() => handleActionClick('brainstorm_fix')}
                badge="Local"
              />
              <ActionButton
                icon={BookOpen}
                title="Find Documentation"
                description="Retrieve MDN, React, or TypeScript manuals"
                isExecuting={executingActionId === 'find_docs'}
                onClick={() => handleActionClick('find_docs')}
                badge="Local"
              />
              <ActionButton
                icon={FolderKanban}
                title="Open Related Project"
                description="Jump to matching workspace project files"
                isExecuting={executingActionId === 'open_project'}
                onClick={() => handleActionClick('open_project')}
                badge="Local"
              />
            </div>
          </div>
        )}

        {/* UI & DESIGN TAB */}
        {activeTab === 'ui' && (
          <div className="space-y-2">
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs space-y-1">
              <div className="font-bold text-zinc-200">🎨 Design System Audit</div>
              <div className="text-zinc-400 text-[11px]">
                Analyzes component hierarchy, WCAG AA color contrast, and Tailwind spacing tokens.
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ActionButton
                icon={Layout}
                title="Audit Spacing & Tokens"
                description="Suggest mathematical corner nesting & padding"
                isExecuting={executingActionId === 'explain'}
                onClick={() => handleActionClick('explain')}
                badge="Design"
              />
              <ActionButton
                icon={Bug}
                title="Create Design Task"
                description="File UI polish task in project roadmap"
                isExecuting={executingActionId === 'create_issue'}
                onClick={() => handleActionClick('create_issue')}
                badge="Task"
              />
              <ActionButton
                icon={Sparkles}
                title="Turn into a Dream"
                description="Create autonomous UI refactor in Brain studio"
                isExecuting={executingActionId === 'turn_into_dream'}
                onClick={() => handleActionClick('turn_into_dream')}
                badge="Dream"
              />
              <ActionButton
                icon={Copy}
                title="Copy Clean Snippet"
                description="Copy clean Tailwind classes & JSX"
                isExecuting={executingActionId === 'copy'}
                onClick={() => handleActionClick('copy')}
                badge="Local"
              />
            </div>
          </div>
        )}

        {/* TEXT & NOTES TAB */}
        {activeTab === 'text' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ActionButton
              icon={FileText}
              title="Summarize Content"
              description="Extract key highlights and executive takeaways"
              isExecuting={executingActionId === 'summarize'}
              onClick={() => handleActionClick('summarize')}
              badge="Local"
            />
            <ActionButton
              icon={BookOpen}
              title="Save to Project Notes"
              description="Save structured markdown doc with timestamps"
              isExecuting={executingActionId === 'save_note'}
              onClick={() => handleActionClick('save_note')}
              badge="Local"
            />
            <ActionButton
              icon={Copy}
              title="Copy to Clipboard"
              description="Copy formatted markdown with clean line breaks"
              isExecuting={executingActionId === 'copy'}
              onClick={() => handleActionClick('copy')}
              badge="Local"
            />
            <ActionButton
              icon={MessageSquare}
              title="Ask Aether to Rewrite"
              description="Tone adjustment, technical spec, or release note"
              isExecuting={executingActionId === 'ask_aether'}
              onClick={() => handleActionClick('ask_aether', true)}
              badge="Cloud AI"
            />
          </div>
        )}

        {/* AUTOMATIONS & WORKFLOWS TAB */}
        {activeTab === 'workflows' && (
          <div className="space-y-2">
            <ActionButton
              icon={Zap}
              title="Add This to a Workflow"
              description="Register new Teachable Workflow with voice trigger"
              isExecuting={executingActionId === 'add_workflow'}
              onClick={() => handleActionClick('add_workflow')}
              badge="Workflow"
            />
            <ActionButton
              icon={Layers}
              title="Turn into a Dream"
              description="Autonomous AST refactor candidate for project"
              isExecuting={executingActionId === 'turn_into_dream'}
              onClick={() => handleActionClick('turn_into_dream')}
              badge="Autonomous"
            />
            <ActionButton
              icon={Play}
              title="Run Multi-Step Action"
              description="Execute sequential analyze → fix → note pipeline"
              isExecuting={executingActionId === 'multi_step'}
              onClick={() => handleActionClick('multi_step')}
              badge="Engine"
            />
          </div>
        )}

        {/* COMPARE TAB */}
        {activeTab === 'compare' && (
          <div className="space-y-3">
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs space-y-2">
              <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Scale size={14} className="text-amber-400" /> Side-by-Side Comparison Engine
              </div>
              <div className="text-zinc-400 text-[11px] leading-relaxed">
                Compare this selection against another screen capture or code snippet.
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleSetComparisonSlot('first')}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[11px] font-semibold text-zinc-200 transition-colors"
                >
                  Set as Selection A
                </button>
                <button
                  onClick={() => handleSetComparisonSlot('second')}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[11px] font-semibold text-zinc-200 transition-colors"
                >
                  Set as Selection B
                </button>
              </div>
            </div>

            <ActionButton
              icon={Scale}
              title="Execute Semantic Comparison"
              description="Generate diff table, word variance, & AST shifts"
              isExecuting={executingActionId === 'compare'}
              onClick={() => handleActionClick('compare')}
              badge="Compare"
            />
          </div>
        )}

        {/* Action Result Output Viewer */}
        <AnimatePresence>
          {actionResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-3 p-3.5 bg-[#141418] border border-amber-500/30 rounded-xl space-y-3 select-text"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-100">{actionResult.actionTitle} Output</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(actionResult.markdownOutput);
                      setCopiedResult(true);
                      setTimeout(() => setCopiedResult(false), 2000);
                    }}
                    className="p-1 text-zinc-400 hover:text-white rounded transition-colors text-[10px] flex items-center gap-1"
                    title="Copy Markdown"
                  >
                    {copiedResult ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => setActionResult(null)}
                    className="p-1 text-zinc-500 hover:text-white rounded transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              <div className="markdown-body prose prose-invert max-w-none text-xs leading-relaxed max-h-56 overflow-y-auto pr-1">
                <Markdown remarkPlugins={[remarkGfm]}>{actionResult.markdownOutput}</Markdown>
              </div>

              {actionResult.privacyNotice && (
                <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 flex items-center gap-1.5">
                  <Shield size={10} className="text-emerald-400" />
                  <span>{actionResult.privacyNotice}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

interface ActionButtonProps {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  description: string;
  badge?: string;
  isExecuting?: boolean;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  title,
  description,
  badge,
  isExecuting = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isExecuting}
      className="p-2.5 bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 rounded-xl text-left transition-all group flex items-start gap-2.5 disabled:opacity-50 cursor-pointer"
    >
      <div className="p-1.5 bg-zinc-800 group-hover:bg-amber-500/10 text-zinc-400 group-hover:text-amber-400 rounded-lg transition-colors shrink-0 mt-0.5">
        <Icon size={14} className={isExecuting ? 'animate-spin' : ''} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">{title}</span>
          {badge && (
            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded shrink-0 ${
              badge === 'Cloud AI'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-zinc-800 text-zinc-400'
            }`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{description}</p>
      </div>
    </button>
  );
};
