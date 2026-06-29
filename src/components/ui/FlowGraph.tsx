import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
  NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { FolderGit2, File, Folder, Sparkles, AlertCircle, Bookmark } from 'lucide-react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (
  nodes: any[], 
  edges: any[], 
  direction = 'TB', 
  spacing: 'compact' | 'normal' | 'relaxed' = 'normal'
) => {
  const isHorizontal = direction === 'LR';
  const nodeSep = spacing === 'compact' ? 20 : spacing === 'normal' ? 35 : 70;
  const rankSep = spacing === 'compact' ? 25 : spacing === 'normal' ? 50 : 100;
  dagreGraph.setGraph({ rankdir: direction, nodesep: nodeSep, ranksep: rankSep });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 40 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - 150 / 2,
        y: nodeWithPosition.y - 40 / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

const CustomNode = ({ data }: NodeProps) => {
  const type = data.type as string;
  let icon = <File size={12} />;
  let color = 'border-zinc-800 text-zinc-300 bg-[#121214]';
  let glowStyle = 'hover:ring-2 hover:ring-zinc-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]';

  if (type === 'project') {
    icon = <FolderGit2 size={12} className="text-purple-400" />;
    color = 'border-purple-500/50 text-purple-100 bg-purple-500/10';
    glowStyle = 'hover:ring-2 hover:ring-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]';
  } else if (type === 'repo') {
    icon = <Bookmark size={12} className="text-emerald-400" />;
    color = 'border-emerald-500/50 text-emerald-100 bg-emerald-500/10';
    glowStyle = 'hover:ring-2 hover:ring-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]';
  } else if (type === 'doc') {
    icon = <File size={12} className="text-yellow-400" />;
    color = 'border-yellow-500/50 text-yellow-100 bg-yellow-500/10';
    glowStyle = 'hover:ring-2 hover:ring-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.45)]';
  } else if (type === 'phase') {
    icon = <Sparkles size={12} className="text-amber-400" />;
    color = 'border-amber-500/50 text-amber-100 bg-amber-500/10';
    glowStyle = 'hover:ring-2 hover:ring-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]';
  } else if (type === 'dir') {
    icon = <Folder size={12} className="text-yellow-500" />;
    color = 'border-yellow-500/20 text-yellow-101 bg-[#18181b]';
    glowStyle = 'hover:ring-2 hover:ring-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.35)]';
  } else if (type === 'issue') {
    icon = <AlertCircle size={12} className="text-red-400" />;
    color = 'border-red-500/50 text-red-100 bg-red-500/10';
    glowStyle = 'hover:ring-2 hover:ring-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]';
  }

  return (
    <div className={`px-2 py-1.5 rounded-lg border text-xs flex items-center gap-2 w-[150px] shadow-lg ${color} ${glowStyle} cursor-pointer hover:brightness-110 active:scale-95 hover:scale-105 hover:-translate-y-0.5 transition-all duration-350 font-mono`}>
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !border-none !bg-zinc-600" />
      <div className="p-0.5 rounded bg-zinc-950/45 border border-zinc-800/30 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="truncate flex-1 tracking-tight">{data.name as string}</div>
      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !border-none !bg-zinc-600" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export function FlowGraph({ 
  nodes: initialNodes, 
  links: initialLinks, 
  onNodeClick,
  direction = 'TB',
  spacing = 'normal'
}: { 
  nodes: any[], 
  links: any[], 
  onNodeClick?: (node: any) => void,
  direction?: 'TB' | 'LR',
  spacing?: 'compact' | 'normal' | 'relaxed'
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onNodeDragStop = useCallback((_: any, draggedNode: any) => {
    try {
      const saved = JSON.parse(localStorage.getItem('brain_node_positions') || '{}');
      saved[draggedNode.id] = draggedNode.position;
      localStorage.setItem('brain_node_positions', JSON.stringify(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleResetLayout = () => {
     try {
       localStorage.removeItem('brain_node_positions');
       const rfNodes = initialNodes.map(n => ({
         id: n.id,
         type: 'custom',
         data: { name: n.name, type: n.type },
         position: { x: 0, y: 0 }
       }));
       const rfEdges = initialLinks.map((l, i) => ({
         id: `e${i}`,
         source: l.source.id || l.source,
         target: l.target.id || l.target,
         type: 'smoothstep',
         animated: true,
         style: { stroke: '#a855f7', strokeWidth: 2, opacity: 0.85, filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.45))' }
       }));
       const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
         rfNodes,
         rfEdges,
         direction,
         spacing
       );
       setNodes(layoutedNodes);
       setEdges(layoutedEdges);
       alert("Landscape layout reset successfully!");
     } catch (e) {
       console.error(e);
     }
  };

  useEffect(() => {
    let saved: Record<string, { x: number, y: number }> = {};
    try {
      saved = JSON.parse(localStorage.getItem('brain_node_positions') || '{}');
    } catch {}

    const rfNodes = initialNodes.map(n => ({
      id: n.id,
      type: 'custom',
      data: { name: n.name, type: n.type },
      position: saved[n.id] || { x: 0, y: 0 }
    }));
    
    const rfEdges = initialLinks.map((l, i) => ({
      id: `e${i}`,
      source: l.source.id || l.source,
      target: l.target.id || l.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#a855f7', strokeWidth: 2, opacity: 0.85, filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.45))' }
    }));

    // Filter for large graphs to avoid dagre crash or huge slow down
    let displayNodes = rfNodes;
    let displayEdges = rfEdges;
    if (displayNodes.length > 300) {
       displayNodes = displayNodes.slice(0, 300);
       const nodeIds = new Set(displayNodes.map(n => n.id));
       displayEdges = displayEdges.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      displayNodes,
      displayEdges,
      direction,
      spacing
    );

    // Apply saved positions as override
    const finalNodes = layoutedNodes.map(node => {
      if (saved[node.id]) {
         return {
           ...node,
           position: saved[node.id]
         };
       }
       return node;
    });

    setNodes(finalNodes);
    setEdges(layoutedEdges);
  }, [initialNodes, initialLinks, direction, spacing, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative bg-[#07070a]/90">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
           if(onNodeClick) onNodeClick({ id: node.id, name: node.data.name, type: node.data.type });
        }}
        fitView
        minZoom={0.1}
      >
        <Background color="#27272a" gap={20} size={1} />
        <Controls className="!bg-[#18181b] !border-zinc-800 !fill-zinc-400" />
      </ReactFlow>

      {/* Floater Reset Layout */}
      <button
        onClick={handleResetLayout}
        className="absolute top-4 right-4 z-10 px-2.5 py-1.5 text-[10px] font-bold bg-[#18181b]/90 hover:bg-[#27272a] text-zinc-300 rounded-md border border-zinc-800 shadow-md backdrop-blur-md hover:text-zinc-100 transition-all flex items-center gap-1"
        title="Reset all manual node drag positioning back to auto-layout"
      >
        🔄 Reset Node Layout
      </button>
    </div>
  );
}
