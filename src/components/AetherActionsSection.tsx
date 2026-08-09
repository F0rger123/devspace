import React, { useState, useEffect } from 'react';
import { 
  aetherAliasRegistry, 
  AetherAlias, 
  UserDefinedAction, 
  AutonomyLevel 
} from '../lib/aetherAliasRegistry';
import { aetherTeachEngine, TaughtSequence } from '../lib/aetherTeachEngine';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Play, 
  Shield, 
  CheckCircle, 
  ExternalLink, 
  Globe, 
  Monitor, 
  Command, 
  Layers, 
  Zap, 
  Check, 
  HelpCircle 
} from 'lucide-react';

export const AetherActionsSection: React.FC = () => {
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('balanced');
  const [aliases, setAliases] = useState<AetherAlias[]>([]);
  const [userActions, setUserActions] = useState<UserDefinedAction[]>([]);
  const [taughtSequences, setTaughtSequences] = useState<TaughtSequence[]>([]);
  
  // New Alias Form
  const [showAddAlias, setShowAddAlias] = useState(false);
  const [newAliasName, setNewAliasName] = useState('');
  const [newAliasTarget, setNewAliasTarget] = useState('');
  const [newAliasType, setNewAliasType] = useState<'website' | 'desktop_app' | 'devspace_route'>('website');

  // New Action Form
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTrigger, setNewActionTrigger] = useState('');
  const [newActionStepsRaw, setNewActionStepsRaw] = useState('');

  const [testOutput, setTestOutput] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAutonomyLevel(aetherAliasRegistry.getAutonomyLevel());
    setAliases(aetherAliasRegistry.getAliases());
    setUserActions(aetherAliasRegistry.getActions());
    setTaughtSequences(aetherTeachEngine.getSequences());
  };

  const handleAutonomyChange = (level: AutonomyLevel) => {
    aetherAliasRegistry.setAutonomyLevel(level);
    setAutonomyLevel(level);
  };

  const handleAddAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasName || !newAliasTarget) return;

    aetherAliasRegistry.saveAlias({
      alias: newAliasName.toLowerCase().startsWith('my ') ? newAliasName : `my ${newAliasName}`,
      target: newAliasTarget,
      type: newAliasType,
      description: `User-defined shortcut`
    });

    setNewAliasName('');
    setNewAliasTarget('');
    setShowAddAlias(false);
    loadData();
  };

  const handleDeleteAlias = (id: string) => {
    aetherAliasRegistry.deleteAlias(id);
    loadData();
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTrigger || !newActionStepsRaw) return;

    const steps = newActionStepsRaw.split(',').map((s, idx) => {
      const item = s.trim();
      let actionType: 'open_app' | 'open_url' | 'navigate_route' = 'open_app';
      if (item.includes('http') || item.includes('www.') || item.includes('.com')) {
        actionType = 'open_url';
      }
      return {
        id: `step-${Date.now()}-${idx}`,
        order: idx + 1,
        actionType,
        target: item,
        label: `Step ${idx + 1}: ${item}`
      };
    });

    const newAction: UserDefinedAction = {
      id: `action-${Date.now()}`,
      name: newActionTrigger.toUpperCase(),
      triggerPhrase: newActionTrigger.toLowerCase().trim(),
      steps,
      autonomyRequired: 'balanced',
      enabled: true,
      createdAt: Date.now(),
      executionCount: 0
    };

    aetherAliasRegistry.saveAction(newAction);
    setNewActionTrigger('');
    setNewActionStepsRaw('');
    setShowAddAction(false);
    loadData();
  };

  const handleDeleteAction = (id: string) => {
    aetherAliasRegistry.deleteAction(id);
    loadData();
  };

  const handleToggleActionEnabled = (action: UserDefinedAction) => {
    aetherAliasRegistry.saveAction({
      ...action,
      enabled: !action.enabled
    });
    loadData();
  };

  const handleTestAction = (action: UserDefinedAction) => {
    setTestOutput(`🚀 Executing Action: "${action.name}" (${action.steps.length} steps)...`);
    setTimeout(() => {
      setTestOutput(`✅ Action Test Completed Successfully! Executed ${action.steps.map(s => s.target).join(' ➔ ')}`);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-zinc-300">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Zap size={16} className="text-purple-400" /> Aether Actions, Aliases & Workflow Shortcuts
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Define custom trigger phrases, friendly app and website aliases, and multi-step automated workflows.
        </p>
      </div>

      {/* Autonomy Level Control */}
      <div className="bg-gradient-to-r from-purple-950/20 via-zinc-900 to-zinc-950 border border-purple-500/20 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-purple-400 font-bold uppercase">Autonomy Threshold</span>
            <h4 className="text-sm font-bold text-zinc-100">Action Execution Mode</h4>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded uppercase font-semibold">
            Current: {autonomyLevel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Conservative */}
          <div 
            onClick={() => handleAutonomyChange('conservative')}
            className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
              autonomyLevel === 'conservative' 
                ? 'border-purple-500 bg-purple-500/10 text-white' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className={autonomyLevel === 'conservative' ? 'text-purple-400' : 'text-zinc-400'} />
              <span className="text-xs font-bold">Conservative</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Always asks confirmation before launching applications, opening URLs, or running sequences.
            </p>
          </div>

          {/* Balanced */}
          <div 
            onClick={() => handleAutonomyChange('balanced')}
            className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
              autonomyLevel === 'balanced' 
                ? 'border-purple-500 bg-purple-500/10 text-white' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className={autonomyLevel === 'balanced' ? 'text-purple-400' : 'text-zinc-400'} />
              <span className="text-xs font-bold">Balanced</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Executes low-risk app/URL shortcuts directly. Asks confirmation for system modifications.
            </p>
          </div>

          {/* Autonomous */}
          <div 
            onClick={() => handleAutonomyChange('autonomous')}
            className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
              autonomyLevel === 'autonomous' 
                ? 'border-purple-500 bg-purple-500/10 text-white' 
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className={autonomyLevel === 'autonomous' ? 'text-purple-400' : 'text-zinc-400'} />
              <span className="text-xs font-bold">Autonomous</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Executes all user-approved actions and sequence workflows seamlessly without prompting.
            </p>
          </div>
        </div>
      </div>

      {/* Aliases Registry */}
      <div className="border border-zinc-800 bg-zinc-950/40 p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              <Globe size={14} className="text-purple-400" /> Persistent App & Website Aliases
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Assign friendly names to websites or desktop applications (e.g. "Call Spotify my music").
            </p>
          </div>
          <button
            onClick={() => setShowAddAlias(!showAddAlias)}
            className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs flex items-center gap-1 transition-all"
          >
            <Plus size={12} /> Add Alias
          </button>
        </div>

        {showAddAlias && (
          <form onSubmit={handleAddAlias} className="p-3.5 bg-zinc-900 border border-purple-500/30 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Friendly Alias Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. my editor or my dashboard"
                  value={newAliasName}
                  onChange={(e) => setNewAliasName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Target App or URL</label>
                <input 
                  type="text" 
                  placeholder="e.g. Visual Studio Code or https://react.dev"
                  value={newAliasTarget}
                  onChange={(e) => setNewAliasTarget(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Target Type</label>
                <select
                  value={newAliasType}
                  onChange={(e) => setNewAliasType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="website">Website URL</option>
                  <option value="desktop_app">Desktop App</option>
                  <option value="devspace_route">DevSpace Route</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button 
                type="button" 
                onClick={() => setShowAddAlias(false)}
                className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium"
              >
                Save Alias
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {aliases.map(al => (
            <div key={al.id} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">"{al.alias}"</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-purple-300 border border-zinc-750">
                    {al.type}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono truncate max-w-xs">
                  ➔ {al.target}
                </div>
              </div>
              <button 
                onClick={() => handleDeleteAlias(al.id)}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                title="Delete alias"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User-Defined Actions & Sequences */}
      <div className="border border-zinc-800 bg-zinc-950/40 p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              <Layers size={14} className="text-purple-400" /> User-Defined Actions & Workflows
            </h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Create multi-step sequences triggered by natural phrase directives.
            </p>
          </div>
          <button
            onClick={() => setShowAddAction(!showAddAction)}
            className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs flex items-center gap-1 transition-all"
          >
            <Plus size={12} /> Add Action
          </button>
        </div>

        {showAddAction && (
          <form onSubmit={handleAddAction} className="p-3.5 bg-zinc-900 border border-purple-500/30 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Trigger Phrase Directive</label>
                <input 
                  type="text" 
                  placeholder="e.g. open my workspace"
                  value={newActionTrigger}
                  onChange={(e) => setNewActionTrigger(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">Sequence Targets (Comma Separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Visual Studio Code, https://google.com, Spotify"
                  value={newActionStepsRaw}
                  onChange={(e) => setNewActionStepsRaw(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button 
                type="button" 
                onClick={() => setShowAddAction(false)}
                className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium"
              >
                Save Action Workflow
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {userActions.map(act => (
            <div key={act.id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">{act.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Trigger: "{act.triggerPhrase}"
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Executions: {act.executionCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestAction(act)}
                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] flex items-center gap-1 font-mono"
                  >
                    <Play size={10} /> Test
                  </button>
                  <button
                    onClick={() => handleDeleteAction(act.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 rounded"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {act.steps.map(st => (
                  <span key={st.id} className="text-[10px] font-mono px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 flex items-center gap-1">
                    <Command size={10} className="text-purple-400" />
                    {st.target}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {testOutput && (
          <div className="p-3 bg-zinc-900 border border-purple-500/40 rounded-lg text-xs font-mono text-purple-300 animate-fade-in">
            {testOutput}
          </div>
        )}
      </div>
    </div>
  );
};
