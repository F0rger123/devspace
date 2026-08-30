import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Undo2,
  Play,
  RotateCcw,
  Check,
  X,
  Plus,
  Trash2,
  FolderGit2,
  Github,
  Calendar,
  Car,
  Heart,
  Bell,
  Workflow,
  Laptop,
  HelpCircle,
  Search,
  Filter,
  Eye,
  Sliders,
  AlertCircle
} from 'lucide-react';
import {
  aetherAutonomy,
  AutonomyLevel,
  AutonomyDomain,
  ActionExecutionMode,
  AutonomyActionRecord,
  RecurringApprovalMemory,
  AutonomyRule,
  AUTONOMY_LEVEL_DETAILS,
  DOMAIN_METADATA
} from '../lib/aetherAutonomyEngine';
import { haptic } from '../utils/haptics';

const DOMAIN_ICONS: Record<AutonomyDomain, React.ComponentType<{ size?: number; className?: string }>> = {
  devspace: FolderGit2,
  github: Github,
  calendar: Calendar,
  travel: Car,
  wellness: Heart,
  notifications: Bell,
  workflows: Workflow,
  desktop: Laptop
};

export const AetherAutonomyControls: React.FC = () => {
  const [config, setConfig] = useState(() => aetherAutonomy.getConfig());
  const [history, setHistory] = useState<AutonomyActionRecord[]>(() => aetherAutonomy.getActionHistory());
  const [recurringMemories, setRecurringMemories] = useState<RecurringApprovalMemory[]>(() => aetherAutonomy.getRecurringMemories());
  const [rules, setRules] = useState<AutonomyRule[]>(() => aetherAutonomy.getRules());

  const [activeTab, setActiveTab] = useState<'levels' | 'domains' | 'history' | 'recurring' | 'exceptions'>('levels');
  const [domainFilter, setDomainFilter] = useState<AutonomyDomain | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<ActionExecutionMode | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Rule / Memory state
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDomain, setNewRuleDomain] = useState<AutonomyDomain>('devspace');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleDecision, setNewRuleDecision] = useState<'always_allow' | 'always_ask' | 'always_block'>('always_ask');
  const [newRuleReason, setNewRuleReason] = useState('');

  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemDesc, setNewMemDesc] = useState('');
  const [newMemDomain, setNewMemDomain] = useState<AutonomyDomain>('travel');
  const [newMemActionType, setNewMemActionType] = useState('');
  const [newMemTrigger, setNewMemTrigger] = useState('');
  const [newMemReason, setNewMemReason] = useState('');

  useEffect(() => {
    const unsub = aetherAutonomy.subscribe(() => {
      setConfig(aetherAutonomy.getConfig());
      setHistory(aetherAutonomy.getActionHistory());
      setRecurringMemories(aetherAutonomy.getRecurringMemories());
      setRules(aetherAutonomy.getRules());
    });
    return () => {
      unsub();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGlobalLevelChange = (level: AutonomyLevel) => {
    haptic.medium();
    aetherAutonomy.setGlobalLevel(level);
    showToast(`Global Autonomy set to ${AUTONOMY_LEVEL_DETAILS[level].label}`);
  };

  const handleDomainLevelChange = (domain: AutonomyDomain, level: AutonomyLevel) => {
    haptic.light();
    aetherAutonomy.setDomainLevel(domain, level);
    showToast(`${DOMAIN_METADATA[domain].label} updated to ${AUTONOMY_LEVEL_DETAILS[level].label}`);
  };

  const handleSetPreset = (preset: 'balanced' | 'max_auto' | 'ask_all' | 'suggest_only') => {
    haptic.medium();
    if (preset === 'balanced') {
      aetherAutonomy.setAllDomainsLevel('trusted_actions');
      aetherAutonomy.setDomainLevel('workflows', 'ask_before_acting');
      aetherAutonomy.setDomainLevel('desktop', 'ask_before_acting');
      aetherAutonomy.setGlobalLevel('trusted_actions');
      showToast('Applied "Balanced Copilot" Preset');
    } else if (preset === 'max_auto') {
      aetherAutonomy.setAllDomainsLevel('high_autonomy');
      aetherAutonomy.setGlobalLevel('high_autonomy');
      showToast('Applied "High Autonomy" Preset');
    } else if (preset === 'ask_all') {
      aetherAutonomy.setAllDomainsLevel('ask_before_acting');
      aetherAutonomy.setGlobalLevel('ask_before_acting');
      showToast('Applied "Ask Before Acting" Preset');
    } else if (preset === 'suggest_only') {
      aetherAutonomy.setAllDomainsLevel('suggest_only');
      aetherAutonomy.setGlobalLevel('suggest_only');
      showToast('Applied "Suggest Only" Preset');
    }
  };

  const handleUndo = async (historyId: string) => {
    haptic.medium();
    const success = await aetherAutonomy.undoAction(historyId);
    if (success) {
      showToast('✓ Successfully undid Aether action');
    } else {
      showToast('❌ Could not undo action (expired or non-reversible)');
    }
  };

  const handleToggleRecurring = (id: string, enabled: boolean) => {
    haptic.light();
    aetherAutonomy.toggleRecurringMemory(id, enabled);
    showToast(enabled ? 'Recurring behavior enabled' : 'Recurring behavior disabled');
  };

  const handleDeleteRecurring = (id: string) => {
    haptic.light();
    aetherAutonomy.deleteRecurringMemory(id);
    showToast('Recurring behavior memory removed');
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRulePattern.trim()) return;
    aetherAutonomy.addRule({
      name: newRuleName.trim(),
      domain: newRuleDomain,
      actionPattern: newRulePattern.trim(),
      decision: newRuleDecision,
      reason: newRuleReason.trim() || 'User-defined exception rule',
      approvedByUser: true
    });
    setNewRuleName('');
    setNewRulePattern('');
    setNewRuleReason('');
    setShowAddRuleModal(false);
    showToast('✓ Custom exception rule saved');
  };

  const handleDeleteRule = (id: string) => {
    haptic.light();
    aetherAutonomy.deleteRule(id);
    showToast('Exception rule deleted');
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemTitle.trim() || !newMemActionType.trim()) return;
    aetherAutonomy.addRecurringMemory({
      title: newMemTitle.trim(),
      description: newMemDesc.trim() || newMemTitle.trim(),
      domain: newMemDomain,
      actionType: newMemActionType.trim(),
      triggerEvent: newMemTrigger.trim() || 'manual_trigger',
      enabled: true,
      reasonTemplate: newMemReason.trim() || `Approved recurring behavior: ${newMemTitle.trim()}`
    });
    setNewMemTitle('');
    setNewMemDesc('');
    setNewMemActionType('');
    setNewMemTrigger('');
    setNewMemReason('');
    setShowAddMemoryModal(false);
    showToast('✓ Recurring approval memory saved');
  };

  const filteredHistory = history.filter((item) => {
    if (domainFilter !== 'all' && item.domain !== domainFilter) return false;
    if (modeFilter !== 'all' && item.executionMode !== modeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.whyReason.toLowerCase().includes(q) ||
        item.domain.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingConfirmations = history.filter((h) => h.status === 'pending_confirmation');

  return (
    <div className="space-y-6 text-zinc-300">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="fixed top-14 right-6 z-50 px-4 py-2 bg-yellow-500 text-black font-semibold text-xs rounded-lg shadow-xl flex items-center gap-2 border border-yellow-400"
          >
            <Sparkles size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-purple-950/30 via-zinc-900/80 to-zinc-950 border border-purple-500/20 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/30">
              AUTONOMY & PLANNING ENGINE
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              Active: <strong className="text-purple-300">{AUTONOMY_LEVEL_DETAILS[config.globalLevel].label}</strong>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck size={18} className="text-purple-400" /> Aether Planning & Autonomy Controls
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Control how proactive and autonomous Aether is across work and personal life. Configure granular per-domain permissions, inspect full action history with "Why Aether Acted" reasoning, and manage recurring approval memory.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden md:block">
            <div className="text-[10px] font-mono text-zinc-400">SAFETY GATE</div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} /> Destructive Actions Locked
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'levels'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Sliders size={13} /> Autonomy Levels
        </button>

        <button
          onClick={() => setActiveTab('domains')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'domains'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <FolderGit2 size={13} /> Per-Domain Controls (8)
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 relative ${
            activeTab === 'history'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Clock size={13} /> Action History & Why Aether Acted
          {pendingConfirmations.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-extrabold text-[9px] flex items-center justify-center animate-pulse">
              {pendingConfirmations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'recurring'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <Sparkles size={13} /> Recurring Approval Memory ({recurringMemories.length})
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'exceptions'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
          }`}
        >
          <ShieldAlert size={13} /> Exception Rules ({rules.length})
        </button>
      </div>

      {/* TAB 1: AUTONOMY LEVELS (1-4) */}
      {activeTab === 'levels' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {(['suggest_only', 'ask_before_acting', 'trusted_actions', 'high_autonomy'] as AutonomyLevel[]).map((level) => {
              const details = AUTONOMY_LEVEL_DETAILS[level];
              const isSelected = config.globalLevel === level;
              return (
                <div
                  key={level}
                  onClick={() => handleGlobalLevelChange(level)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'bg-zinc-900 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-500 text-black font-extrabold text-[9px] rounded-bl font-mono">
                      ACTIVE GLOBAL
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">LEVEL {details.number}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${details.badgeColor}`}>
                        {details.shortDesc}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                      {details.label}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {details.longDesc}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-zinc-850 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGlobalLevelChange(level);
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-purple-500 text-black font-bold'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      {isSelected ? '✓ Current Global Default' : `Set as Global Default`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preset Quick Actions */}
          <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Zap size={13} className="text-yellow-400" /> One-Click Autonomy Presets
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Quickly align all 8 domains to standard recommended autonomy templates.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                onClick={() => handleSetPreset('balanced')}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-left transition-all group"
              >
                <div className="text-xs font-bold text-zinc-200 group-hover:text-yellow-400">Balanced Copilot (Recommended)</div>
                <div className="text-[10px] text-zinc-400 mt-1">Trusted low-risk actions across work & schedule; asks for workflows and desktop tools.</div>
              </button>

              <button
                onClick={() => handleSetPreset('max_auto')}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-left transition-all group"
              >
                <div className="text-xs font-bold text-zinc-200 group-hover:text-purple-300">High Autonomy Developer</div>
                <div className="text-[10px] text-zinc-400 mt-1">Executes workflows & low/medium actions automatically; destructive actions stay locked.</div>
              </button>

              <button
                onClick={() => handleSetPreset('ask_all')}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-left transition-all group"
              >
                <div className="text-xs font-bold text-zinc-200 group-hover:text-blue-300">Guarded Copilot (Ask Before Acting)</div>
                <div className="text-[10px] text-zinc-400 mt-1">Prepares actions with full context and requires your manual confirmation before doing anything.</div>
              </button>

              <button
                onClick={() => handleSetPreset('suggest_only')}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-left transition-all group"
              >
                <div className="text-xs font-bold text-zinc-200 group-hover:text-zinc-100">Observer (Suggest Only)</div>
                <div className="text-[10px] text-zinc-400 mt-1">Provides read-only recommendations and insights without executing any actions.</div>
              </button>
            </div>
          </div>

          {/* Autonomy Safety Guarantee */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-start gap-3">
            <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                Hard Safety Constraint: Zero Silent Dangerous Actions
              </h4>
              <p className="text-xs text-emerald-400/90 leading-relaxed">
                Even in <strong>High Autonomy</strong> mode, Aether will <strong>NEVER</strong> silently perform destructive actions (e.g. deleting projects, force-pushing/deleting branches, purging data, financial payments, or irreversible file modifications). High-risk operations always require explicit confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PER-DOMAIN CONTROLS (8 Domains) */}
      {activeTab === 'domains' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                Granular Domain Permissions (8 Categories)
              </h3>
              <p className="text-xs text-zinc-400">
                Configure distinct autonomy levels for each area of your personal workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(Object.keys(DOMAIN_METADATA) as AutonomyDomain[]).map((domain) => {
              const meta = DOMAIN_METADATA[domain];
              const Icon = DOMAIN_ICONS[domain];
              const currentLevel = config.domainLevels[domain] || config.globalLevel;
              const levelDetail = AUTONOMY_LEVEL_DETAILS[currentLevel];

              return (
                <div
                  key={domain}
                  className="p-4 bg-zinc-950/80 border border-zinc-850 hover:border-zinc-750 rounded-xl space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400">
                        <Icon size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-100">{meta.label}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">{domain}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${levelDetail.badgeColor}`}>
                      Level {levelDetail.number}: {levelDetail.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {meta.description}
                  </p>

                  <div className="pt-2 border-t border-zinc-850 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-400">Domain Autonomy:</span>
                    <select
                      value={currentLevel}
                      onChange={(e) => handleDomainLevelChange(domain, e.target.value as AutonomyLevel)}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="suggest_only">1. Suggest Only</option>
                      <option value="ask_before_acting">2. Ask Before Acting</option>
                      <option value="trusted_actions">3. Trusted Actions</option>
                      <option value="high_autonomy">4. High Autonomy</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ACTION HISTORY & "WHY AETHER ACTED" */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fade-in">
          {/* Pending Confirmations Banner */}
          {pendingConfirmations.length > 0 && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-400 animate-pulse" /> Pending User Confirmation Queue ({pendingConfirmations.length})
                </h4>
                <span className="text-[10px] text-amber-400 font-mono">Requires Explicit Approval</span>
              </div>

              <div className="space-y-2">
                {pendingConfirmations.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-zinc-950/80 border border-amber-500/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 font-bold uppercase">
                          {item.domain}
                        </span>
                        <span className="text-xs font-bold text-zinc-100">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-amber-200/80 font-mono">
                        {item.whyReason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          haptic.medium();
                          showToast(`✓ Approved: ${item.title}`);
                          item.status = 'completed';
                          item.executionMode = 'confirmed_by_user';
                          setHistory([...aetherAutonomy.getActionHistory()]);
                        }}
                        className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded transition-colors"
                      >
                        Approve & Execute
                      </button>
                      <button
                        onClick={() => {
                          haptic.light();
                          item.status = 'cancelled';
                          setHistory([...aetherAutonomy.getActionHistory()]);
                          showToast(`Dismissed: ${item.title}`);
                        }}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-800 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
            <div className="flex items-center gap-2 flex-grow max-w-sm">
              <Search size={14} className="text-zinc-500" />
              <input
                type="text"
                placeholder="Search actions or 'Why Aether Acted' reasons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value as any)}
                className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 font-mono"
              >
                <option value="all">All Domains</option>
                {(Object.keys(DOMAIN_METADATA) as AutonomyDomain[]).map((d) => (
                  <option key={d} value={d}>
                    {DOMAIN_METADATA[d].label}
                  </option>
                ))}
              </select>

              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as any)}
                className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 font-mono"
              >
                <option value="all">All Modes</option>
                <option value="auto_executed">Auto-Executed</option>
                <option value="confirmed_by_user">User Confirmed</option>
                <option value="suggested_only">Suggested Only</option>
                <option value="undone">Undone</option>
                <option value="blocked_as_risky">Blocked as Risky</option>
              </select>

              {history.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all action history?')) {
                      aetherAutonomy.clearHistory();
                      showToast('Action history cleared');
                    }
                  }}
                  className="px-2 py-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 text-xs rounded border border-zinc-800 transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>

          {/* Action History List */}
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-2">
              <Clock size={24} className="mx-auto text-zinc-600" />
              <div className="text-xs font-mono font-bold text-zinc-400">No Action Records Found</div>
              <div className="text-[11px] text-zinc-600">
                Actions taken or proposed by Aether across DevSpace, Calendar, GitHub, and Travel will appear here.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredHistory.map((item) => {
                const Icon = DOMAIN_ICONS[item.domain] || FolderGit2;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.executionMode === 'undone'
                        ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                        : item.executionMode === 'auto_executed'
                          ? 'bg-zinc-950 border-purple-500/20 hover:border-purple-500/40'
                          : item.executionMode === 'blocked_as_risky'
                            ? 'bg-red-950/10 border-red-500/20'
                            : 'bg-zinc-950 border-zinc-850'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1.5 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-1 rounded bg-zinc-900 border border-zinc-800 text-purple-400">
                            <Icon size={12} />
                          </span>

                          <span className="text-xs font-bold text-zinc-100">{item.title}</span>

                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                              item.executionMode === 'auto_executed'
                                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                                : item.executionMode === 'confirmed_by_user'
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                  : item.executionMode === 'undone'
                                    ? 'bg-zinc-850 text-zinc-400 border-zinc-700 line-through'
                                    : item.executionMode === 'blocked_as_risky'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {item.executionMode.replace(/_/g, ' ')}
                          </span>

                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                            Risk: {item.riskLevel}
                          </span>

                          <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                            {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Transparent "Why Aether Acted" Explanation Box */}
                        <div className="p-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-xs text-zinc-300 font-mono flex items-start gap-2">
                          <span className="text-yellow-400 font-bold shrink-0">WHY:</span>
                          <span className="text-zinc-300 leading-relaxed">{item.whyReason}</span>
                        </div>
                      </div>

                      {/* Undo Action Button */}
                      {item.canUndo && item.executionMode !== 'undone' && (
                        <button
                          onClick={() => handleUndo(item.id)}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-yellow-500/15 hover:text-yellow-300 text-zinc-400 hover:border-yellow-500/30 rounded-lg border border-zinc-800 text-[11px] font-semibold transition-all flex items-center gap-1.5 shrink-0 self-start mt-1 cursor-pointer"
                          title="Undo this action"
                        >
                          <Undo2 size={12} />
                          <span>Undo</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RECURRING APPROVAL MEMORY */}
      {activeTab === 'recurring' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400" /> Recurring Approval Memory
              </h3>
              <p className="text-xs text-zinc-400">
                Aether remembers behaviors you've approved over time and proactively triggers them when matching conditions occur.
              </p>
            </div>
            <button
              onClick={() => setShowAddMemoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              <Plus size={13} /> Add Behavior
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recurringMemories.map((mem) => {
              const Icon = DOMAIN_ICONS[mem.domain] || FolderGit2;
              return (
                <div
                  key={mem.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    mem.enabled
                      ? 'bg-zinc-950/90 border-zinc-800 hover:border-purple-500/40'
                      : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400">
                        <Icon size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-100">{mem.title}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">{mem.domain}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mem.enabled}
                          onChange={(e) => handleToggleRecurring(mem.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>

                      <button
                        onClick={() => handleDeleteRecurring(mem.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {mem.description}
                  </p>

                  <div className="p-2 bg-zinc-900/60 border border-zinc-850 rounded-lg text-[10px] font-mono text-zinc-400 space-y-1">
                    <div>
                      <span className="text-zinc-500">Trigger Event:</span> <strong className="text-zinc-300">{mem.triggerEvent}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500">Execution Count:</span> <strong className="text-purple-300">{mem.executionCount} times</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: EXCEPTION RULES */}
      {activeTab === 'exceptions' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <ShieldAlert size={14} className="text-amber-400" /> Per-Action Exception Rules
              </h3>
              <p className="text-xs text-zinc-400">
                Override domain settings with specific regex patterns or keyword rules (e.g. Always Ask before running script X).
              </p>
            </div>
            <button
              onClick={() => setShowAddRuleModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              <Plus size={13} /> Add Exception Rule
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-1">
              <Shield size={20} className="mx-auto text-zinc-600" />
              <div className="text-xs font-mono font-bold text-zinc-400">No Exception Rules Configured</div>
              <div className="text-[11px] text-zinc-600">
                Add rules to explicitly whitelist or blacklist specific actions regardless of the domain autonomy level.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-100">{rule.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded">
                        {rule.domain}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${
                          rule.decision === 'always_allow'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : rule.decision === 'always_ask'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-red-500/10 text-red-300 border-red-500/30'
                        }`}
                      >
                        {rule.decision.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      Pattern: <code className="text-purple-300 bg-zinc-900 px-1 rounded">{rule.actionPattern}</code> • {rule.reason}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Exception Rule */}
      <AnimatePresence>
        {showAddRuleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121214] border border-zinc-800 rounded-xl p-5 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-purple-400" /> Add Per-Action Exception Rule
                </h3>
                <button onClick={() => setShowAddRuleModal(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddRule} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Always Ask on Database Migration"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Target Domain</label>
                    <select
                      value={newRuleDomain}
                      onChange={(e) => setNewRuleDomain(e.target.value as AutonomyDomain)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                    >
                      {(Object.keys(DOMAIN_METADATA) as AutonomyDomain[]).map((d) => (
                        <option key={d} value={d}>
                          {DOMAIN_METADATA[d].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Decision Policy</label>
                    <select
                      value={newRuleDecision}
                      onChange={(e) => setNewRuleDecision(e.target.value as any)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                    >
                      <option value="always_ask">Always Ask</option>
                      <option value="always_allow">Always Allow (Low/Med)</option>
                      <option value="always_block">Always Block</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Action Keyword / Regex Pattern</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. migrate_database or deploy_prod"
                    value={newRulePattern}
                    onChange={(e) => setNewRulePattern(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Reason / Description</label>
                  <input
                    type="text"
                    placeholder="Why this rule exists"
                    value={newRuleReason}
                    onChange={(e) => setNewRuleReason(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRuleModal(false)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs rounded-lg border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg"
                  >
                    Save Rule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Recurring Behavior */}
      <AnimatePresence>
        {showAddMemoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121214] border border-zinc-800 rounded-xl p-5 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" /> Add Recurring Behavior Memory
                </h3>
                <button onClick={() => setShowAddMemoryModal(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddMemory} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Behavior Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auto-Open Active Project after Morning Briefing"
                    value={newMemTitle}
                    onChange={(e) => setNewMemTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Domain</label>
                    <select
                      value={newMemDomain}
                      onChange={(e) => setNewMemDomain(e.target.value as AutonomyDomain)}
                      className="w-full mt-1 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                    >
                      {(Object.keys(DOMAIN_METADATA) as AutonomyDomain[]).map((d) => (
                        <option key={d} value={d}>
                          {DOMAIN_METADATA[d].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400">Action Type Identifier</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. open_active_project"
                      value={newMemActionType}
                      onChange={(e) => setNewMemActionType(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Trigger Event</label>
                  <input
                    type="text"
                    placeholder="e.g. morning_briefing_closed"
                    value={newMemTrigger}
                    onChange={(e) => setNewMemTrigger(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-zinc-400">Transparent "Why Aether Acted" Reason</label>
                  <textarea
                    rows={2}
                    placeholder="WHY: You usually start this project after your morning briefing..."
                    value={newMemReason}
                    onChange={(e) => setNewMemReason(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemoryModal(false)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs rounded-lg border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg"
                  >
                    Save Memory
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
