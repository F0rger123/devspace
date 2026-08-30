import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { 
  X, 
  Sparkles, 
  Target, 
  Trash2, 
  HelpCircle, 
  Edit3, 
  Check, 
  Mic, 
  Bot, 
  Copy, 
  BrainCircuit, 
  CheckSquare, 
  Flag, 
  Calendar, 
  Map, 
  Zap,
  MousePointer,
  Compass,
  Move,
  RefreshCw,
  Layers,
  Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aetherContextActions, ContextCaptureData } from '../../lib/aetherContextModeActions';
import { AetherContextActionMenu } from './AetherContextActionMenu';

export function CursorDrawContext() {
  const {
    isDrawingModeActive,
    setDrawingModeActive,
    circledContexts,
    setCircledContexts,
    addCircledContext,
    clearCircledContexts,
    lastSpeechTranscript,
    lastAiResponse
  } = useStore();

  const { 
    showToast, 
    addIssue, 
    projects, 
    activeProjectId, 
    updateProject, 
    addNote, 
    cortexSynapses, 
    setCortexSynapses 
  } = useData();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isAltHeld, setIsAltHeld] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeStrategyContext, setActiveStrategyContext] = useState<any | null>(null);
  const [activeActionMenuContext, setActiveActionMenuContext] = useState<ContextCaptureData | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);

  // State to track handle resizing
  const [resizeState, setResizeState] = useState<{
    contextId: string;
    handle: 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move';
    initialBounds: { x: number; y: number; width: number; height: number };
    initialMousePos: { x: number; y: number };
  } | null>(null);

  // Track global cursor position
  useEffect(() => {
    const handleMousePosition = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMousePosition);
    return () => window.removeEventListener('mousemove', handleMousePosition);
  }, []);

  // Resize handling logic
  useEffect(() => {
    if (!resizeState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { contextId, handle, initialBounds, initialMousePos } = resizeState;
      const deltaX = e.clientX - initialMousePos.x;
      const deltaY = e.clientY - initialMousePos.y;

      let newBounds = { ...initialBounds };

      if (handle === 'move') {
        const newX = Math.max(0, Math.min(initialBounds.x + deltaX, window.innerWidth - initialBounds.width));
        const newY = Math.max(0, Math.min(initialBounds.y + deltaY, window.innerHeight - initialBounds.height));
        newBounds = {
          ...initialBounds,
          x: newX,
          y: newY
        };
      } else if (handle === 'tl') {
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
      } else if (handle === 't') {
        const bottom = initialBounds.y + initialBounds.height;
        const newY = Math.max(0, Math.min(e.clientY, bottom - 20));
        newBounds = {
          ...initialBounds,
          y: newY,
          height: bottom - newY
        };
      } else if (handle === 'b') {
        const top = initialBounds.y;
        const newHeight = Math.max(20, Math.min(e.clientY - top, window.innerHeight - top));
        newBounds = {
          ...initialBounds,
          height: newHeight
        };
      } else if (handle === 'l') {
        const right = initialBounds.x + initialBounds.width;
        const newX = Math.max(0, Math.min(e.clientX, right - 20));
        newBounds = {
          ...initialBounds,
          x: newX,
          width: right - newX
        };
      } else if (handle === 'r') {
        const left = initialBounds.x;
        const newWidth = Math.max(20, Math.min(e.clientX - left, window.innerWidth - left));
        newBounds = {
          ...initialBounds,
          width: newWidth
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

  // Monitor Alt key & Escape key globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault(); // Prevent browser from focusing menu bar
        setIsAltHeld(true);
      } else if (e.key === 'Escape') {
        if (circledContexts.length > 0 || isDrawingModeActive) {
          clearCircledContexts();
          setDrawingModeActive(false);
          showToast("Cancelled context selection", "info", 1500);
        }
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
  }, [circledContexts.length, isDrawingModeActive]);

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
          const currentPath = window.location.pathname;
          let plainEnglishLabel = "DevSpace Screen Component";
          if (currentPath === '/') plainEnglishLabel = "Project Operating Center";
          else if (currentPath.includes('planner')) plainEnglishLabel = "Sprint Planner & Backlog";
          else if (currentPath.includes('issues')) plainEnglishLabel = "Issue Tracker & Dev Backlog";
          else if (currentPath.includes('settings')) plainEnglishLabel = "System Integrations & Settings";
          else if (currentPath.includes('create')) plainEnglishLabel = "Project Creation Lab";
          else plainEnglishLabel = `Workspace Area (${currentPath})`;

          const label = `${plainEnglishLabel} #${index}`;
          const newContextId = `circle-${crypto.randomUUID()}`;
          
          addCircledContext({
            id: newContextId,
            type: 'circle',
            points: [...path],
            bounds: { x: minX, y: minY, width, height },
            label,
            timestamp: Date.now()
          });

          // Automatically analyze region with deep domain classifier
          const targetProj = projects?.find(p => p.id === activeProjectId) || projects?.[0];
          aetherContextActions.captureAndAnalyzeRegion({
            id: newContextId,
            label,
            bounds: { x: minX, y: minY, width, height },
            points: [...path],
            projectId: activeProjectId,
            projectName: targetProj?.name
          }).then((analyzed) => {
            setActiveActionMenuContext(analyzed);
          });

          showToast(`🎯 Captured Context: "${label}"`, 'success', 2000);
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

  // 1. Copy Context to Clipboard
  const handleCopyContext = (ctx: any) => {
    const textToCopy = `[DevSpace Spatial Context] ${ctx.label}\nCaptured: ${new Date(ctx.timestamp).toLocaleString()}\nContext: Active user interface component selection in workspace.`;
    navigator.clipboard.writeText(textToCopy);
    showToast("📋 Copied captured context to clipboard!", "success", 2500);
  };

  // 2. Save Context as Cortex Memory Synapse
  const handleSaveMemory = (ctx: any) => {
    const newSynapse = {
      id: `synapse-${Date.now()}`,
      name: ctx.label || 'Captured Screen Context',
      desc: `Extracted from DevSpace Context Mode selection: ${ctx.label}`,
      snippet: `// DevSpace Context Selection\n// Target: ${ctx.label}\nconst capturedAt = "${new Date(ctx.timestamp).toISOString()}";`,
      type: 'custom_synapse' as const,
      projectName: projects[0]?.name || 'DevSpace Global',
      createdAt: Date.now()
    };
    setCortexSynapses(prev => [newSynapse, ...prev]);
    showToast("🧠 Saved context directly into Cortex Memory Synapses!", "success", 3500);
  };

  // 3. Track Context as Issue
  const handleTrackIssue = (ctx: any) => {
    const projId = activeProjectId || projects[0]?.id || 'default';
    const issueId = addIssue({
      projectId: projId,
      title: `Context Issue: ${ctx.label}`,
      description: `Automatically created from DevSpace Desktop Selection.\nSelected Region: ${ctx.label}`,
      type: 'Bug',
      status: 'Todo',
      priority: 'High',
      labels: ['AetherContext', 'DesktopCapture'],
      bugEnvironment: 'DevSpace Desktop Context Mode'
    });
    showToast(`🐛 Created new Issue "${ctx.label}" in Project Tasks!`, "success", 3500);
  };

  // 4. Track Context as Project Goal
  const handleTrackGoal = (ctx: any) => {
    const targetProj = projects.find(p => p.id === activeProjectId) || projects[0];
    if (!targetProj) {
      showToast("Please create or select a project first to attach goals.", "error");
      return;
    }
    const newGoal = {
      id: `goal-${Date.now()}`,
      text: `Context Goal: ${ctx.label}`,
      completed: false,
      priority: 'high' as const,
      createdAt: Date.now()
    };
    const updatedGoals = [...(targetProj.goals || []), newGoal];
    updateProject(targetProj.id, { goals: updatedGoals });
    showToast(`🎯 Added "${ctx.label}" as Goal to ${targetProj.name}!`, "success", 3500);
  };

  // 5. Map Context into Timeline / Roadmap
  const handleMapTimeline = (ctx: any) => {
    const targetProj = projects.find(p => p.id === activeProjectId) || projects[0];
    if (!targetProj) return;
    const newSprint = {
      id: `sprint-${Date.now()}`,
      name: `Sprint: ${ctx.label}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const updatedSprints = [...(targetProj.sprints || []), newSprint];
    updateProject(targetProj.id, { sprints: updatedSprints });
    showToast(`⏱️ Mapped "${ctx.label}" into Project Roadmap Timeline!`, "success", 3500);
  };

  // 6. Map Out Strategy with Gemini AI
  const handleGeminiStrategy = (ctx: any) => {
    setActiveStrategyContext({
      title: ctx.label,
      bounds: ctx.bounds,
      timestamp: ctx.timestamp,
      steps: [
        `Analyze visual layout and code parameters of ${ctx.label}`,
        `Integrate local offline cache handlers & state synchronization`,
        `Generate automated unit tests and validation schema`,
        `Deploy updates directly to DevSpace Cloud & local desktop storage`
      ],
      aiRecommendation: `Aether AI recommends converting this captured area into a modular React component with full local-first state caching and cloud sync fallback.`
    });
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
                <div className="absolute inset-0 bg-yellow-500/5 rounded-[10px] overflow-hidden pointer-events-none">
                  <div className="w-full h-0.5 bg-yellow-400/30 shadow-[0_0_8px_#facc15] absolute top-0 left-0 animate-bounce" />
                </div>

                {/* Move Bar / Drag Header at top */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 'move',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute -top-7 left-1/2 -translate-x-1/2 bg-yellow-500/90 hover:bg-yellow-400 text-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider cursor-move shadow-md z-40 transition-colors pointer-events-auto select-none"
                  title="Click and drag to move selection box"
                >
                  <Move size={10} />
                  <span>Drag Box</span>
                </div>

                {/* Floating label at the top-left */}
                {isEditing ? (
                  <div className="absolute -top-7 left-0 bg-yellow-950/95 border border-yellow-500/40 rounded-md px-1.5 py-0.5 flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-yellow-400 shadow-md z-50 pointer-events-auto">
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
                  <div className="absolute -top-7 left-0 bg-yellow-955/95 border border-yellow-500/40 rounded-md px-1.5 py-0.5 flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-yellow-400 shadow-md pointer-events-auto group/label z-30">
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

                {/* Remove / Cancel button at top-right */}
                <div className="absolute -top-7 right-0 flex items-center gap-1 z-40 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteContext(ctx.id);
                      setDrawingModeActive(true);
                      showToast("🎯 Redraw selection area", "info", 1500);
                    }}
                    className="p-1 bg-yellow-950/90 border border-yellow-500/40 hover:bg-yellow-900 rounded text-yellow-400 hover:text-yellow-200 shadow-md transition-colors cursor-pointer text-[8px] font-mono flex items-center gap-0.5"
                    title="Redraw this selection"
                  >
                    <RefreshCw size={8} />
                    <span>Redraw</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteContext(ctx.id);
                    }}
                    className="p-1 bg-zinc-950/95 border border-red-500/40 hover:bg-red-955/50 rounded text-zinc-500 hover:text-red-400 shadow-md transition-colors cursor-pointer"
                    title="Cancel and remove selection"
                  >
                    <X size={9} />
                  </button>
                </div>

                {/* Floating Context Actions Toolbar directly below region */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-[#09090c]/95 border border-yellow-500/60 backdrop-blur-md rounded-xl p-1 flex items-center gap-1 shadow-2xl z-50 pointer-events-auto shrink-0 select-none">
                  <button
                    onClick={async () => {
                      const targetProj = projects?.find(p => p.id === activeProjectId) || projects?.[0];
                      const analyzed = await aetherContextActions.captureAndAnalyzeRegion({
                        id: ctx.id,
                        label: ctx.label,
                        bounds: ctx.bounds,
                        points: ctx.points,
                        projectId: activeProjectId,
                        projectName: targetProj?.name
                      });
                      setActiveActionMenuContext(analyzed);
                    }}
                    className="p-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.3)]"
                    title="Open full Aether Context Action Menu (Explain, Summarize, Fix, Workflow, etc.)"
                  >
                    <Sparkles size={11} className="animate-spin-slow" />
                    <span>Smart Actions</span>
                  </button>

                  <div className="w-[1px] h-3 bg-zinc-800" />

                  <button
                    onClick={() => handleCopyContext(ctx)}
                    className="p-1.5 hover:bg-yellow-500/20 text-yellow-300 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Copy context to clipboard"
                  >
                    <Copy size={11} />
                    <span className="hidden sm:inline">Copy</span>
                  </button>

                  <div className="w-[1px] h-3 bg-zinc-800" />

                  <button
                    onClick={() => handleSaveMemory(ctx)}
                    className="p-1.5 hover:bg-yellow-500/20 text-yellow-300 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Save to Cortex Memory Synapse"
                  >
                    <BrainCircuit size={11} />
                    <span className="hidden sm:inline">Save Memory</span>
                  </button>

                  <div className="w-[1px] h-3 bg-zinc-800" />

                  <button
                    onClick={() => handleTrackIssue(ctx)}
                    className="p-1.5 hover:bg-yellow-500/20 text-yellow-300 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Create Project Issue from context"
                  >
                    <CheckSquare size={11} />
                    <span className="hidden sm:inline">Track Issue</span>
                  </button>

                  <div className="w-[1px] h-3 bg-zinc-800" />

                  <button
                    onClick={() => handleTrackGoal(ctx)}
                    className="p-1.5 hover:bg-yellow-500/20 text-yellow-300 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Attach as Goal to current project"
                  >
                    <Flag size={11} />
                    <span className="hidden sm:inline">Goal</span>
                  </button>

                  <div className="w-[1px] h-3 bg-zinc-800" />

                  <button
                    onClick={() => handleMapTimeline(ctx)}
                    className="p-1.5 hover:bg-yellow-500/20 text-yellow-300 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Map into Project Roadmap Timeline"
                  >
                    <Calendar size={11} />
                    <span className="hidden sm:inline">Timeline</span>
                  </button>

                  <div className="w-[1px] h-3 bg-zinc-800" />

                  <button
                    onClick={() => handleGeminiStrategy(ctx)}
                    className="p-1.5 bg-yellow-500/20 border border-yellow-500/50 hover:bg-yellow-500 hover:text-black text-yellow-300 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                    title="Ask Gemini AI to map out goal strategy"
                  >
                    <Zap size={11} className="animate-pulse" />
                    <span>AI Strategy</span>
                  </button>
                </div>

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

                {/* Edge resizing handles */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 't',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-1.5 bg-yellow-400 hover:bg-yellow-300 rounded cursor-ns-resize z-45 pointer-events-auto opacity-70 hover:opacity-100 transition-opacity"
                  title="Resize top edge"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 'b',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-1.5 bg-yellow-400 hover:bg-yellow-300 rounded cursor-ns-resize z-45 pointer-events-auto opacity-70 hover:opacity-100 transition-opacity"
                  title="Resize bottom edge"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 'l',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-6 bg-yellow-400 hover:bg-yellow-300 rounded cursor-ew-resize z-45 pointer-events-auto opacity-70 hover:opacity-100 transition-opacity"
                  title="Resize left edge"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setResizeState({
                      contextId: ctx.id,
                      handle: 'r',
                      initialBounds: { ...ctx.bounds! },
                      initialMousePos: { x: e.clientX, y: e.clientY }
                    });
                  }}
                  className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-1.5 h-6 bg-yellow-400 hover:bg-yellow-300 rounded cursor-ew-resize z-45 pointer-events-auto opacity-70 hover:opacity-100 transition-opacity"
                  title="Resize right edge"
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

      {/* Subtitles & Active Speech Dialog Overlay in Context Mode */}
      <AnimatePresence>
        {isDrawingModeActive && (lastSpeechTranscript || lastAiResponse) && (
          <motion.div
            initial={{ opacity: 0, y: 15, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 10, x: '-50%', scale: 0.95 }}
            className="fixed bottom-40 left-1/2 z-[42] bg-zinc-950/90 border border-yellow-500/30 backdrop-blur-md rounded-2xl p-4 shadow-2xl max-w-md w-[calc(100%-2rem)] select-none pointer-events-auto"
          >
            <div className="space-y-3">
              {lastSpeechTranscript && (
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Mic size={10} className="text-zinc-455" />
                  </div>
                  <div className="flex-grow">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block leading-none mb-0.5">You said</span>
                    <p className="text-[11px] text-zinc-300 font-medium leading-relaxed italic">
                      "{lastSpeechTranscript}"
                    </p>
                  </div>
                </div>
              )}
              
              {lastAiResponse && (
                <div className="flex gap-2.5 items-start pt-2 border-t border-zinc-900">
                  <div className="w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/35 flex items-center justify-center shrink-0">
                    <Bot size={10} className="text-yellow-400 animate-pulse" />
                  </div>
                  <div className="flex-grow">
                    <span className="text-[9px] uppercase font-bold text-yellow-400/90 block leading-none mb-0.5 flex items-center gap-1">
                      Aether AI
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                    </span>
                    <p className="text-[11px] text-zinc-100 font-semibold leading-relaxed">
                      {lastAiResponse}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Gemini AI Strategy Modal Breakdown */}
      <AnimatePresence>
        {activeStrategyContext && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#0a0a0d] border border-yellow-500/40 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-zinc-200"
            >
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                    <Zap size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Gemini Aether Goal Strategy
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Context Target: "{activeStrategyContext.title}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStrategyContext(null)}
                  className="p-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1">
                  <span className="text-[9px] text-yellow-400/90 font-bold uppercase block">
                    AI Architectural Strategy & Blueprint
                  </span>
                  <p className="text-zinc-300 leading-relaxed font-sans text-[11px]">
                    {activeStrategyContext.aiRecommendation}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                    Execution Steps
                  </span>
                  <div className="space-y-1.5">
                    {activeStrategyContext.steps.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2 bg-[#0d0d12] border border-zinc-900 rounded-lg">
                        <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-[9px] font-bold shrink-0">
                          0{idx + 1}
                        </span>
                        <span className="text-[11px] text-zinc-300 font-sans">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-850 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-mono">
                  Synthesized for {projects[0]?.name || 'Active Workspace'}
                </span>
                <button
                  onClick={() => {
                    const targetProj = projects.find(p => p.id === activeProjectId) || projects[0];
                    if (targetProj) {
                      addNote({
                        projectId: targetProj.id,
                        title: `Strategy Blueprint: ${activeStrategyContext.title}`,
                        content: `# Strategy Blueprint for ${activeStrategyContext.title}\n\n${activeStrategyContext.aiRecommendation}\n\n## Action Items\n` + activeStrategyContext.steps.map((s: string, i: number) => `- [ ] ${s}`).join('\n'),
                        tags: ['Strategy', 'AetherAI', 'ContextCapture']
                      });
                      showToast("📄 Saved Strategy directly as a Workspace Doc Note!", "success");
                    }
                    setActiveStrategyContext(null);
                  }}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-xs font-bold rounded-xl transition-all cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                >
                  SAVE AS WORKSPACE DOC
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart Aether Context Action Menu Modal */}
      <AnimatePresence>
        {activeActionMenuContext && (
          <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AetherContextActionMenu
                captureData={activeActionMenuContext}
                onClose={() => setActiveActionMenuContext(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Mouse Cursor Follower HUD when Context Mode is Active */}
      <AnimatePresence>
        {isDrawingModeActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              left: cursorPos.x + 18,
              top: cursorPos.y + 18,
            }}
            className="pointer-events-none z-[60] bg-[#09090c]/90 border border-yellow-500/50 backdrop-blur-md rounded-xl p-2 shadow-xl flex items-center gap-2 select-none"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
            </div>

            <div className="text-[9px] font-mono text-zinc-300 leading-tight">
              <span className="font-bold text-yellow-400 uppercase block">Aether Cursor Engine</span>
              <span className="text-zinc-500">X:{cursorPos.x} Y:{cursorPos.y} • Drag to Circle</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
