import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { X, Sparkles, Target, Trash2, HelpCircle, Edit3, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CursorDrawContext() {
  const {
    isDrawingModeActive,
    setDrawingModeActive,
    circledContexts,
    setCircledContexts,
    addCircledContext,
    clearCircledContexts
  } = useStore();

  const { showToast } = useData();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);

  // State to track handle resizing
  const [resizeState, setResizeState] = useState<{
    contextId: string;
    handle: 'tl' | 'tr' | 'bl' | 'br';
    initialBounds: { x: number; y: number; width: number; height: number };
    initialMousePos: { x: number; y: number };
  } | null>(null);

  // Resize handling logic
  useEffect(() => {
    if (!resizeState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { contextId, handle, initialBounds, initialMousePos } = resizeState;
      const deltaX = e.clientX - initialMousePos.x;
      const deltaY = e.clientY - initialMousePos.y;

      let newBounds = { ...initialBounds };

      if (handle === 'tl') {
        const right = initialBounds.x + initialBounds.width;
        const bottom = initialBounds.y + initialBounds.height;
        const newX = Math.max(0, Math.min(e.clientX, right - 20));
        const newY = Math.max(0, Math.min(e.clientY, bottom - 20));
        newBounds = {
          x: newX,
          y: newY,
          width: right - newX,
          height: bottom - newY
        };
      } else if (handle === 'tr') {
        const left = initialBounds.x;
        const bottom = initialBounds.y + initialBounds.height;
        const newY = Math.max(0, Math.min(e.clientY, bottom - 20));
        const newWidth = Math.max(20, Math.min(e.clientX - left, window.innerWidth - left));
        newBounds = {
          x: left,
          y: newY,
          width: newWidth,
          height: bottom - newY
        };
      } else if (handle === 'bl') {
        const right = initialBounds.x + initialBounds.width;
        const top = initialBounds.y;
        const newX = Math.max(0, Math.min(e.clientX, right - 20));
        const newHeight = Math.max(20, Math.min(e.clientY - top, window.innerHeight - top));
        newBounds = {
          x: newX,
          y: top,
          width: right - newX,
          height: newHeight
        };
      } else if (handle === 'br') {
        const left = initialBounds.x;
        const top = initialBounds.y;
        const newWidth = Math.max(20, Math.min(e.clientX - left, window.innerWidth - left));
        const newHeight = Math.max(20, Math.min(e.clientY - top, window.innerHeight - top));
        newBounds = {
          x: left,
          y: top,
          width: newWidth,
          height: newHeight
        };
      }

      setCircledContexts(
        circledContexts.map(c => 
          c.id === contextId ? { ...c, bounds: newBounds } : c
        )
      );
    };

    const handleMouseUp = () => {
      setResizeState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState, circledContexts, setCircledContexts]);

  // Monitor Alt key globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault(); // Prevent browser from focusing menu bar
        setIsAltHeld(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltHeld(false);
      }
    };
    const handleBlur = () => {
      setIsAltHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Set canvas size
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isInteractionActive = isDrawingModeActive || isAltHeld;

  // Ultra-high performance zero-latency requestAnimationFrame draw loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const path = pathRef.current;
      if (path.length >= 2) {
        // Drawing yellow glow path following the cursor directly
        ctx.strokeStyle = '#eab308'; // Rich premium yellow neon line
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.shadowColor = 'rgba(234, 179, 8, 0.9)';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();

        // Draw active yellow flare pointer tip at the lead position for extra responsive feedback
        const lead = path[path.length - 1];
        ctx.beginPath();
        ctx.arc(lead.x, lead.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = 'rgba(250, 204, 21, 1)';
        ctx.shadowBlur = 20;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInteractionActive]);

  // Handle global mouse events for freeform circle drawing & right-click deletion
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Trigger drawing if drawing mode is toggled or Alt key is held
      if (!isDrawingModeActive && !e.altKey) return;
      
      // Right-click behavior to delete all circles/context
      if (e.button === 2) {
        e.preventDefault();
        clearCircledContexts();
        showToast("🧹 Reset canvas and cleared all circled contexts", "info", 2000);
        return;
      }

      // Only draw on left click
      if (e.button !== 0) return;

      // Prevent default page selecting/dragging behavior
      e.preventDefault();

      setIsDrawing(true);
      const startPoint = { x: e.clientX, y: e.clientY };
      pathRef.current = [startPoint];
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      
      const newPoint = { x: e.clientX, y: e.clientY };
      pathRef.current.push(newPoint);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawing) return;
      setIsDrawing(false);

      const path = pathRef.current;
      if (path.length > 5) {
        // Calculate Bounding Box
        const xs = path.map(p => p.x);
        const ys = path.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const width = maxX - minX;
        const height = maxY - minY;

        // Discard very tiny clicks
        if (width > 20 && height > 20) {
          const index = circledContexts.length + 1;
          const label = `Captured Screen Region #${index}`;
          
          addCircledContext({
            id: `circle-${crypto.randomUUID()}`,
            type: 'circle',
            points: [...path],
            bounds: { x: minX, y: minY, width, height },
            label,
            timestamp: Date.now()
          });

          showToast(`🎯 Captured Screen Context Area: "${label}"`, 'success', 2000);
        }
      }

      pathRef.current = [];
    };

    // Right-click contextmenu event handler to prevent menu and trigger reset
    const handleContextMenu = (e: MouseEvent) => {
      if (!isDrawingModeActive && !e.altKey) return;
      e.preventDefault();
      clearCircledContexts();
      showToast("🧹 Reset canvas and cleared all circled contexts", "info", 2000);
    };

    window.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu, { passive: false });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isDrawing, isDrawingModeActive, circledContexts.length, addCircledContext, clearCircledContexts, showToast]);

  const deleteContext = (id: string) => {
    setCircledContexts(circledContexts.filter(c => c.id !== id));
  };

  const updateLabel = (id: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (trimmed) {
      setCircledContexts(circledContexts.map(c => c.id === id ? { ...c, label: trimmed } : c));
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Absolute fullscreen canvas for active cursor path drawing */}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 z-[45] pointer-events-none transition-opacity duration-200 ${
          isInteractionActive ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Drawing mode screen guide border */}
      {isInteractionActive && (
        <div className="fixed inset-0 border-2 border-dashed border-yellow-550/40 pointer-events-none z-[44] animate-pulse">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0c0c0e]/95 border border-yellow-500/50 text-yellow-400 text-[10px] font-mono font-bold py-1 px-3 rounded-full flex items-center gap-2 shadow-lg select-none pointer-events-auto">
            <Target size={11} className="animate-spin text-yellow-400" />
            <span>DRAGGING MOUSE: CIRCLE ITEMS TO RECRUIT AS AETHER CONTEXT</span>

            {circledContexts.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearCircledContexts();
                  showToast("🧹 Reset canvas and cleared all circled contexts", "info", 2000);
                }}
                className="ml-2 px-2 py-0.5 bg-red-955/80 border border-red-500/30 hover:bg-red-900/90 text-red-300 hover:text-white rounded text-[9px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Quickly clear all active selections"
              >
                <Trash2 size={9} />
                <span>Reset Canvas</span>
              </button>
            )}

            {isDrawingModeActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawingModeActive(false);
                }}
                className="ml-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded text-[9px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Exit Selection Mode"
              >
                <X size={9} />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Circled contexts glowing viewport overlays */}
      <div className="fixed inset-0 pointer-events-none z-[43]">
        <AnimatePresence>
          {circledContexts.map((ctx, index) => {
            if (!ctx.bounds) return null;
            const isEditing = editingId === ctx.id;
            return (
              <motion.div
                key={ctx.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  position: 'absolute',
                  left: ctx.bounds.x,
                  top: ctx.bounds.y,
                  width: ctx.bounds.width,
                  height: ctx.bounds.height,
                }}
                className="border-2 border-yellow-500 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.35)] pointer-events-auto group/box flex flex-col justify-between"
              >
                {/* Visual Laser Scanning Grid Accent */}
                <div className="absolute inset-0 bg-yellow-500/5 rounded-[10px] overflow-hidden">
                  <div className="w-full h-0.5 bg-yellow-400/30 shadow-[0_0_8px_#facc15] absolute top-0 left-0 animate-bounce" />
                </div>

                {/* Floating label at the top-left */}
                {isEditing ? (
                  <div className="absolute -top-6 left-0 bg-yellow-950/95 border border-yellow-500/40 rounded-md px-1.5 py-0.5 flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-yellow-400 shadow-md z-50 pointer-events-auto">
                    <Target size={9} className="text-yellow-400" />
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateLabel(ctx.id, editValue);
                        } else if (e.key === 'Escape') {
                          setEditingId(null);
                        }
                      }}
                      onBlur={() => updateLabel(ctx.id, editValue)}
                      className="bg-transparent border-none outline-none text-yellow-200 text-[8.5px] font-mono w-28 p-0 m-0"
                      autoFocus
                      placeholder="Rename region..."
                    />
                    <button
                      onClick={() => updateLabel(ctx.id, editValue)}
                      className="hover:text-white text-yellow-450 p-0 cursor-pointer"
                    >
                      <Check size={8} />
                    </button>
                  </div>
                ) : (
                  <div className="absolute -top-6 left-0 bg-yellow-955/95 border border-yellow-500/40 rounded-md px-1.5 py-0.5 flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-yellow-400 shadow-md pointer-events-auto group/label">
                    <Target size={9} />
                    <span className="truncate max-w-28">{ctx.label || `TARGET #${index + 1}`}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(ctx.id);
                        setEditValue(ctx.label || `Captured Screen Region #${index + 1}`);
                      }}
                      className="opacity-0 group-hover/label:opacity-100 text-yellow-500 hover:text-yellow-255 ml-1 transition-opacity cursor-pointer"
                      title="Rename this region"
                    >
                      <Edit3 size={8} />
                    </button>
                  </div>
                )}

                {/* Remove button at top-right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteContext(ctx.id);
                  }}
                  className="absolute -top-6 right-0 p-0.5 bg-zinc-950/95 border border-red-500/40 hover:bg-red-955/50 rounded text-zinc-500 hover:text-red-400 shadow-md transition-colors cursor-pointer z-10 pointer-events-auto"
                  title="Remove captured context"
                >
                  <X size={9} />
                </button>

                {/* Resizing handles at the four corners */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 'tl',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute top-0 left-0 w-3 h-3 bg-yellow-400 hover:bg-yellow-300 border-2 border-[#0c0c0e] rounded-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize z-50 shadow-[0_0_6px_rgba(234,179,8,0.6)] hover:scale-125 transition-transform pointer-events-auto"
                  title="Resize top-left"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 'tr',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 hover:bg-yellow-300 border-2 border-[#0c0c0e] rounded-full translate-x-1/2 -translate-y-1/2 cursor-nesw-resize z-50 shadow-[0_0_6px_rgba(234,179,8,0.6)] hover:scale-125 transition-transform pointer-events-auto"
                  title="Resize top-right"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 'bl',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute bottom-0 left-0 w-3 h-3 bg-yellow-400 hover:bg-yellow-300 border-2 border-[#0c0c0e] rounded-full -translate-x-1/2 translate-y-1/2 cursor-nesw-resize z-50 shadow-[0_0_6px_rgba(234,179,8,0.6)] hover:scale-125 transition-transform pointer-events-auto"
                  title="Resize bottom-left"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 'br',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-400 hover:bg-yellow-300 border-2 border-[#0c0c0e] rounded-full translate-x-1/2 translate-y-1/2 cursor-nwse-resize z-50 shadow-[0_0_6px_rgba(234,179,8,0.6)] hover:scale-125 transition-transform pointer-events-auto"
                  title="Resize bottom-right"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Controller panel if contexts are selected or drawing mode is active */}
      <AnimatePresence>
        {(circledContexts.length > 0 || isDrawingModeActive) && (
          <motion.div
            initial={{ opacity: 0, y: 25, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[42] bg-[#0c0c0e]/95 border border-yellow-500/50 rounded-xl px-3.5 py-2.5 flex items-center gap-3 shadow-2xl shadow-yellow-950/20 max-w-sm w-[calc(100%-2rem)] select-none pointer-events-auto"
          >
            {/* Draw Toggle Button inside Selection UI */}
            <button
              onClick={() => {
                setDrawingModeActive(!isDrawingModeActive);
                showToast(
                  !isDrawingModeActive ? "🎯 Activated screen region draw mode" : "🚫 Deactivated screen region draw mode",
                  "info",
                  2000
                );
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isDrawingModeActive
                  ? 'bg-yellow-500/20 border-yellow-450 text-yellow-300 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-yellow-400 hover:border-yellow-500/45'
              }`}
              title={isDrawingModeActive ? "Disable freeform draw mode" : "Enable freeform draw mode"}
            >
              <Target size={14} />
            </button>
            
            <div className="flex-grow min-w-0">
              <p className="text-[10px] font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                {isDrawingModeActive ? (
                  <span className="text-yellow-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    Selection Mode Active
                  </span>
                ) : (
                  <span>Spatial Context Anchors</span>
                )}
              </p>
              <p className="text-[8px] text-zinc-400 font-mono mt-0.5 leading-normal">
                {circledContexts.length > 0 
                  ? `Recruited ${circledContexts.length} area${circledContexts.length > 1 ? 's' : ''} to Aether AI`
                  : "Hold Alt + drag to capture any screen region"
                }
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {circledContexts.length > 0 && (
                <button
                  onClick={() => {
                    clearCircledContexts();
                    showToast("🧹 Cleared all circled context regions", "info", 2000);
                  }}
                  className="p-1.5 hover:bg-red-955/30 hover:border-red-500/40 border border-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 text-[9px] font-mono font-bold uppercase cursor-pointer"
                  title="Clear all circled areas (Reset Canvas)"
                >
                  <Trash2 size={10} />
                  <span>Clear</span>
                </button>
              )}

              {isDrawingModeActive && (
                <button
                  onClick={() => setDrawingModeActive(false)}
                  className="p-1 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Exit Draw Mode"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
