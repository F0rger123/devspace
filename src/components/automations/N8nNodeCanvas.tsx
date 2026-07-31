import { useState, useRef, useEffect, MouseEvent, WheelEvent } from 'react';
import { motion } from 'motion/react';
import {
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
  Plus,
  Trash2,
  Copy,
  Settings,
  Zap,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { AutomationNode, AutomationEdge } from './types';
import { NODE_LIBRARY } from './nodeBank';

interface N8nNodeCanvasProps {
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onAddEdge: (sourceId: string, targetId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onOpenNodePalette: () => void;
  isSimulating: boolean;
  activeExecutingNodeId: string | null;
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

export function N8nNodeCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  onAddEdge,
  onDeleteNode,
  onDuplicateNode,
  onDeleteEdge,
  onOpenNodePalette,
  isSimulating,
  activeExecutingNodeId
}: N8nNodeCanvasProps) {
  // Pan and Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Wiring / Connecting state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle canvas panning start
  const handleCanvasMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.n8n-node-card')) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    onSelectNode(null);
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    } else if (draggingNodeId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const rawX = (e.clientX - containerRect.left - pan.x) / zoom - dragOffsetRef.current.x;
      const rawY = (e.clientY - containerRect.top - pan.y) / zoom - dragOffsetRef.current.y;

      // Snap to 10px grid
      const snappedX = Math.round(rawX / 10) * 10;
      const snappedY = Math.round(rawY / 10) * 10;

      onUpdateNodePosition(draggingNodeId, Math.max(20, snappedX), Math.max(20, snappedY));
    }

    if (connectingSourceId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setMousePos({
          x: (e.clientX - containerRect.left - pan.x) / zoom,
          y: (e.clientY - containerRect.top - pan.y) / zoom
        });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    if (connectingSourceId) {
      setConnectingSourceId(null);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(2.0, Math.max(0.4, prev * zoomFactor)));
  };

  const handleNodeMouseDown = (e: MouseEvent, nodeId: string) => {
    e.stopPropagation();
    onSelectNode(nodeId);
    setDraggingNodeId(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const cursorCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
    const cursorCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

    dragOffsetRef.current = {
      x: cursorCanvasX - node.position.x,
      y: cursorCanvasY - node.position.y
    };
  };

  const startConnecting = (e: MouseEvent, sourceNodeId: string) => {
    e.stopPropagation();
    setConnectingSourceId(sourceNodeId);
    const node = nodes.find(n => n.id === sourceNodeId);
    if (node) {
      setMousePos({
        x: node.position.x + 220,
        y: node.position.y + 40
      });
    }
  };

  const finishConnecting = (e: MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (connectingSourceId && connectingSourceId !== targetNodeId) {
      onAddEdge(connectingSourceId, targetNodeId);
    }
    setConnectingSourceId(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full min-h-[520px] bg-[#070709] overflow-hidden select-none cursor-grab active:cursor-grabbing rounded-2xl border border-zinc-850 shadow-[2xl]"
    >
      {/* N8N SVG Grid Pattern Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Floating Canvas Toolbar */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-[#0d0d11]/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-lg">
        <button
          onClick={onOpenNodePalette}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 text-black font-extrabold text-xs hover:bg-yellow-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.25)]"
        >
          <Plus size={14} strokeWidth={3} /> Add Node
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

        <button
          onClick={() => setZoom(z => Math.min(2.0, z + 0.15))}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <span className="text-[10px] font-mono text-zinc-500 min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
          title="Reset Canvas View"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* TRANSFORM CONTAINER FOR PAN AND ZOOM */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* SVG LAYER FOR EDGES / CONNECTING CABLES */}
        <svg className="absolute inset-0 w-[4000px] h-[4000px] overflow-visible pointer-events-none z-10">
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="edge-active" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Render Existing Edges */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            // Compute connection handle coordinates
            const x1 = sourceNode.position.x + 220; // output port right edge
            const y1 = sourceNode.position.y + 40;  // port height center
            const x2 = targetNode.position.x;       // input port left edge
            const y2 = targetNode.position.y + 40;

            const dx = Math.abs(x2 - x1) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            const isExecutingEdge =
              activeExecutingNodeId === edge.source || activeExecutingNodeId === edge.target;

            return (
              <g key={edge.id} className="group pointer-events-auto cursor-pointer">
                {/* Background fat invisible stroke for easy hover clicking */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="16"
                  onClick={() => onDeleteEdge(edge.id)}
                />
                {/* Visible Bezier Curve */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isExecutingEdge ? 'url(#edge-active)' : 'url(#edge-gradient)'}
                  strokeWidth={isExecutingEdge ? '3.5' : '2.5'}
                  className={`transition-all ${
                    isExecutingEdge
                      ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]'
                      : 'hover:stroke-yellow-400 group-hover:stroke-width-3'
                  }`}
                />
                {/* Animated Particle along Wire if executing */}
                {isExecutingEdge && (
                  <circle r="4" fill="#fef08a" className="animate-pulse">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path={pathData} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Live Connecting Cable while dragging wire */}
          {connectingSourceId && (() => {
            const sourceNode = nodes.find(n => n.id === connectingSourceId);
            if (!sourceNode) return null;

            const x1 = sourceNode.position.x + 220;
            const y1 = sourceNode.position.y + 40;
            const x2 = mousePos.x;
            const y2 = mousePos.y;

            const dx = Math.abs(x2 - x1) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return (
              <path
                d={pathData}
                fill="none"
                stroke="#eab308"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
            );
          })()}
        </svg>

        {/* NODES LAYER */}
        <div className="absolute inset-0 z-20 pointer-events-auto">
          {nodes.map(node => {
            const nodeDef = NODE_LIBRARY.find(def => def.type === node.type) || {
              type: node.type,
              category: node.category,
              label: node.label,
              description: node.description,
              iconName: 'Sparkles',
              color: 'text-zinc-300',
              borderColor: 'border-zinc-800',
              bgColor: 'bg-zinc-900',
              defaultConfig: {}
            };

            const IconComponent = ICON_MAP[nodeDef.iconName] || Sparkles;
            const isSelected = selectedNodeId === node.id;
            const isExecuting = activeExecutingNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={e => handleNodeMouseDown(e, node.id)}
                style={{
                  transform: `translate(${node.position.x}px, ${node.position.y}px)`
                }}
                className={`n8n-node-card absolute w-[220px] bg-[#0c0c0f] border rounded-xl shadow-xl transition-shadow transition-border duration-150 group ${
                  isExecuting
                    ? 'border-yellow-400 bg-yellow-500/10 shadow-[0_0_25px_rgba(234,179,8,0.25)] ring-2 ring-yellow-400/50'
                    : isSelected
                    ? 'border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-yellow-500/40'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Node Header */}
                <div
                  className={`px-3 py-2 rounded-t-xl border-b border-zinc-850 flex items-center justify-between ${nodeDef.bgColor}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <IconComponent size={14} className={nodeDef.color} />
                    <span className="text-xs font-bold text-zinc-200 truncate">
                      {node.label || nodeDef.label}
                    </span>
                  </div>

                  {/* Status Indicator Dot */}
                  <div className="flex items-center gap-1">
                    {node.status === 'running' || isExecuting ? (
                      <Loader2 size={12} className="text-yellow-400 animate-spin" />
                    ) : node.status === 'success' ? (
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    ) : node.status === 'failed' ? (
                      <XCircle size={12} className="text-rose-400" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-zinc-700" />
                    )}
                  </div>
                </div>

                {/* Node Content Preview */}
                <div className="p-3 text-[11px] text-zinc-400 space-y-1.5">
                  <p className="line-clamp-2 text-zinc-400 leading-tight">
                    {node.description || nodeDef.description}
                  </p>

                  {/* Config snippet display */}
                  {node.config?.prompt && (
                    <div className="bg-zinc-950 p-1.5 rounded border border-zinc-850 font-mono text-[10px] text-zinc-300 truncate">
                      "{node.config.prompt}"
                    </div>
                  )}
                  {node.config?.recipient && (
                    <div className="bg-zinc-950 p-1 rounded border border-zinc-850 font-mono text-[9px] text-emerald-400 truncate">
                      📧 {node.config.recipient}
                    </div>
                  )}
                </div>

                {/* INPUT HANDLE (LEFT) */}
                {node.category !== 'trigger' && (
                  <div
                    onMouseUp={e => finishConnecting(e, node.id)}
                    className="absolute -left-2.5 top-8 w-5 h-5 rounded-full bg-zinc-900 border-2 border-yellow-500/80 hover:bg-yellow-500 cursor-crosshair flex items-center justify-center transition-all z-30"
                    title="Input Port (Connect here)"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  </div>
                )}

                {/* OUTPUT HANDLE (RIGHT) */}
                <div
                  onMouseDown={e => startConnecting(e, node.id)}
                  className="absolute -right-2.5 top-8 w-5 h-5 rounded-full bg-zinc-900 border-2 border-blue-500/80 hover:bg-blue-500 cursor-crosshair flex items-center justify-center transition-all z-30"
                  title="Output Port (Drag wire to another node)"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>

                {/* Hover Quick Toolbar */}
                <div className="absolute -top-8 right-0 hidden group-hover:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 shadow-lg z-40">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDuplicateNode(node.id);
                    }}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all cursor-pointer"
                    title="Duplicate node"
                  >
                    <Copy size={11} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteNode(node.id);
                    }}
                    className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                    title="Delete node"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
