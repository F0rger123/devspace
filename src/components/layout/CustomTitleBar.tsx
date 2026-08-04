import React, { useEffect, useState } from 'react';
import { Minus, Square, Copy, X, Sparkles } from 'lucide-react';
import { getElectronAPI, isElectron } from '../../lib/electronBridge';

export function CustomTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const electronAvailable = isElectron();

  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;

    try {
      // Query initial window maximized state
      api.isMaximized()
        .then(setIsMaximized)
        .catch((err) => {
          console.warn('Electron window state IPC unavailable:', err);
        });

      // Listen for window state changes from main process
      if (api.onMaximizedChange) {
        const cleanup = api.onMaximizedChange((maximized) => {
          setIsMaximized(maximized);
        });
        return cleanup;
      }
    } catch (err) {
      console.warn('CustomTitleBar failed to initialize IPC listeners:', err);
    }
  }, []);

  const handleMinimize = () => {
    const api = getElectronAPI();
    if (api) {
      api.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    const api = getElectronAPI();
    if (api) {
      setIsMaximized(prev => !prev);
      try {
        await api.maximizeWindow();
        const state = await api.isMaximized();
        setIsMaximized(state);
      } catch (err) {
        console.warn('Failed to toggle window maximize state:', err);
      }
    }
  };

  const handleClose = () => {
    const api = getElectronAPI();
    if (api) {
      api.closeWindow();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    // Avoid double click handling when clicking interactive controls
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    const api = getElectronAPI();
    if (api) {
      api.maximizeWindow();
    }
  };

  if (!electronAvailable) {
    return null;
  }

  return (
    <header
      onDoubleClick={handleDoubleClick}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      className="h-8 w-full bg-[#030305]/95 dark:bg-[#030305]/95 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/60 flex items-center justify-between px-3 text-xs text-zinc-400 select-none z-50 shrink-0 transition-colors duration-200"
    >
      {/* Left Branding & Title */}
      <div className="flex items-center gap-2.5">
        <div 
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="no-drag flex items-center gap-2 cursor-pointer"
        >
          <div className="w-4 h-4 rounded bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-[10px] font-black text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]">
            D
          </div>
          <span className="text-xs font-bold text-zinc-100 dark:text-zinc-100 tracking-tight">
            DevSpace
          </span>
        </div>
        <div className="h-3 w-[1px] bg-zinc-800/80" />
        <div className="flex items-center gap-1 text-[10px] font-mono text-amber-500/90 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="w-2.5 h-2.5" />
          <span>v2.5.0</span>
        </div>
      </div>

      {/* Center Draggable Region Title */}
      <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500 pointer-events-none">
        <span>DevSpace Desktop</span>
      </div>

      {/* Right Controls Area */}
      <div className="flex items-center h-full -mr-3">
        {electronAvailable ? (
          <div 
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className="no-drag flex items-center h-full"
          >
            <button
              onClick={handleMinimize}
              title="Minimize"
              className="h-8 w-11 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 active:bg-zinc-800 transition-colors duration-150 focus:outline-none"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              className="h-8 w-11 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 active:bg-zinc-800 transition-colors duration-150 focus:outline-none"
            >
              {isMaximized ? (
                <Copy className="w-3 h-3 rotate-180" />
              ) : (
                <Square className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={handleClose}
              title="Close"
              className="h-8 w-11 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-rose-600 active:bg-rose-700 transition-colors duration-150 focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="pr-3 text-[10px] text-zinc-500 font-mono select-none">
            Web Preview
          </div>
        )}
      </div>
    </header>
  );
}
