import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Keyboard, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Target, 
  Power, 
  BrainCircuit, 
  Bot, 
  Mic, 
  Hand,
  Edit2,
  Save
} from 'lucide-react';
import { KeyBinding, getKeyBindings, saveKeyBindings, DEFAULT_BINDINGS, parseShortcut } from '../../lib/keyboardMapper';
import { useData } from '../../context/DataProvider';

export function KeyboardMapperTab() {
  const { showToast } = useData();

  const [bindings, setBindings] = useState<KeyBinding[]>(getKeyBindings());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [capturedShortcut, setCapturedShortcut] = useState<string>('');

  useEffect(() => {
    if (!editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const newShortcut = parseShortcut(e);
      if (newShortcut) {
        setCapturedShortcut(newShortcut);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId]);

  const handleSaveEdit = (id: string) => {
    if (!capturedShortcut) return;

    const updated = bindings.map((b) => {
      if (b.id === id) {
        return { ...b, shortcut: capturedShortcut };
      }
      return b;
    });

    setBindings(updated);
    saveKeyBindings(updated);
    setEditingId(null);
    setCapturedShortcut('');
    showToast(`⌨️ Re-mapped shortcut to "${capturedShortcut}"!`, "success");
  };

  const handleResetDefaults = () => {
    setBindings(DEFAULT_BINDINGS);
    saveKeyBindings(DEFAULT_BINDINGS);
    showToast("Keyboard shortcuts reset to default configuration.", "info");
  };

  const handleToggleBinding = (id: string) => {
    const updated = bindings.map((b) => {
      if (b.id === id) return { ...b, enabled: !b.enabled };
      return b;
    });
    setBindings(updated);
    saveKeyBindings(updated);
  };

  return (
    <div className="space-y-5 text-zinc-200 font-sans">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-zinc-950 via-[#0e0e14] to-zinc-950 border border-yellow-500/30 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
            <Keyboard size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Computer Global Keyboard Shortcut Mapper
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Bind custom keyboard combinations to trigger Aether actions anywhere on your PC screen.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw size={13} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Shortcuts List Table */}
      <div className="space-y-2">
        {bindings.map((b) => {
          const isEditing = editingId === b.id;
          return (
            <div
              key={b.id}
              className={`p-3.5 bg-zinc-950 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                isEditing
                  ? 'border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                  : 'border-zinc-850 hover:border-zinc-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-white">{b.actionName}</span>
                  {b.id === 'EMERGENCY_STOP' && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded text-[9px] font-mono font-bold border border-red-500/40">
                      KILL SWITCH
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 font-sans">{b.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-[#0e0e14] border border-yellow-500/60 rounded-xl font-mono text-xs text-yellow-300 font-bold animate-pulse">
                      {capturedShortcut || 'Press Keys...'}
                    </div>
                    <button
                      onClick={() => handleSaveEdit(b.id)}
                      className="p-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-mono text-xs font-bold transition-all cursor-pointer"
                    >
                      <Save size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#0d0d12] border border-zinc-800 rounded-lg font-mono text-xs text-yellow-400 font-bold shadow-inner">
                      {b.shortcut}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(b.id);
                        setCapturedShortcut(b.shortcut);
                      }}
                      className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Re-map key combination"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                )}

                {/* Enable Toggle */}
                <div 
                  onClick={() => handleToggleBinding(b.id)}
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer ${b.enabled ? 'bg-yellow-500' : 'bg-zinc-800'}`}
                >
                  <div className={`w-3 h-3 rounded-full bg-black transition-transform ${b.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
