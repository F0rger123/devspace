import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as d3 from "d3";
import { 
  Network, 
  Bot, 
  Cpu, 
  Database, 
  Sparkles, 
  Zap, 
  Workflow, 
  MemoryStick, 
  Mic, 
  Volume2,
  Plus,
  Minus,
  Maximize2
} from "lucide-react";

import { CortexSynapse } from "../context/DataProvider";

interface MemoryCortexProps {
  aiContextRules: string;
  setAiContextRules: React.Dispatch<React.SetStateAction<string>>;
  repo: string;
  projects: any[];
  selectedHighlightMemory: string;
  setSelectedHighlightMemory: (val: string) => void;
  memoryVoiceActive: boolean;
  memoryAssistantSpeaking: boolean;
  handleVocalSync: () => void;
  vocalLogs: Array<{ sender: 'user' | 'assistant'; text: string }>;
  cortexSynapses?: CortexSynapse[];
  setCortexSynapses?: React.Dispatch<React.SetStateAction<CortexSynapse[]>>;
}

interface SynapseNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'core' | 'satellite' | 'file';
  tag?: string;
  color: string;
}

interface SynapseLink extends d3.SimulationLinkDatum<SynapseNode> {
  source: string | SynapseNode;
  target: string | SynapseNode;
}

export function cleanTextToPlainEnglish(text: string): string {
  if (!text) return "";
  
  // 1. Remove markdown code blocks (e.g. ```typescript ... ```)
  let clean = text.replace(/```[\s\S]*?```/g, "");
  
  // 2. Remove standard curly braces code statements or JSON
  clean = clean.replace(/\{[\s\S]*?\}/g, "");
  
  // 3. Remove HTML tags if any
  clean = clean.replace(/<[^>]*>/g, "");
  
  // 4. Split into lines and filter out lines matching code hallmarks
  const lines = clean.split("\n");
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true; // keep empty spacing lines
    
    // Hallmark code markers
    const hasBraces = (trimmed.match(/[{}[\]]/g) || []).length > 0;
    const hasCodeKeywords = /\b(const|let|function|import|export|class|return|var|interface|type)\b/.test(trimmed);
    const isCodeStatement = trimmed.endsWith(";") && /[()={}]/.test(trimmed);
    const isArrowFn = trimmed.includes("=>");
    const isSystemLog = /^\d{4}-\d{2}-\d{2}|\[INFO\]|\[ERROR\]|\[DEBUG\]|\[WARN\]/.test(trimmed);
    
    if (hasBraces || hasCodeKeywords || isCodeStatement || isArrowFn || isSystemLog) {
      return false; // strip code-like lines!
    }
    return true;
  });
  
  return filteredLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export const MemoryCortex: React.FC<MemoryCortexProps> = ({
  aiContextRules,
  setAiContextRules,
  repo,
  projects,
  selectedHighlightMemory,
  setSelectedHighlightMemory,
  memoryVoiceActive,
  memoryAssistantSpeaking,
  handleVocalSync,
  vocalLogs,
  cortexSynapses = [],
  setCortexSynapses
}) => {
  const [selectedDetailSynapse, setSelectedDetailSynapse] = useState<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [newMemoryName, setNewMemoryName] = useState("");
  const [newMemoryDesc, setNewMemoryDesc] = useState("");
  const [customMemories, setCustomMemories] = useState<Array<{ id: string, name: string, desc: string }>>([
     { id: 'mem_1', name: 'Authentication Rules', desc: 'Secure Firestore security rules require write verification on auth != null.' },
     { id: 'mem_2', name: 'UI Margin Standards', desc: 'Maintain clean margins on all screen sizes with comfortable gutters.' }
  ]);

  const handleAddMemory = () => {
    if (!newMemoryName.trim() || !newMemoryDesc.trim()) return;
    const newId = `custom_${Date.now()}`;
    const newMemObj = { id: newId, name: newMemoryName, desc: newMemoryDesc };
    setCustomMemories(prev => [...prev, newMemObj]);
    
    // Append to cortex guidelines rules
    setAiContextRules(prev => {
       const ruleText = `\n- ${newMemoryName}: ${newMemoryDesc}`;
       return prev ? prev.trim() + ruleText : ruleText;
    });
    
    setNewMemoryName("");
    setNewMemoryDesc("");
  };

  // Handle container resizing to keep force layout centered fluidly
  useEffect(() => {
    let animationFrameId: number;
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      animationFrameId = requestAnimationFrame(() => {
        setDimensions({ width, height: Math.max(height, 320) });
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      setDimensions({
        width: containerRef.current.clientWidth,
        height: Math.max(containerRef.current.clientHeight, 320)
      });
    }

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Programmatic Zoom actions
  const handleZoomIn = () => {
    if (zoomBehaviorRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (zoomBehaviorRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (zoomBehaviorRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  // Build D3 Force-Directed Simulation
  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Reset canvas

    // Group wrapper to transform based on pan + zoom
    const zoomGroup = svg.append('g').attr('class', 'zoom-group');

    // Define zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
      });
    
    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Start with core nodes
    const nodes: SynapseNode[] = [
      { id: 'core', name: 'Cortex Core', type: 'core', tag: 'AI Core Synapse', color: '#a855f7' },
      
      // Satellites
      { id: 'persona', name: 'Persona Configuration', type: 'satellite', tag: 'Persona Config', color: '#3b82f6' },
      { id: 'stack', name: 'Custom Tech Stack', type: 'satellite', tag: 'Preferred Stack', color: '#f59e0b' },
      { id: 'mobile', name: 'Mobile-First Standards', type: 'satellite', tag: 'Mobile Standard', color: '#10b981' },
      { id: 'types', name: 'Strict Type Safety', type: 'satellite', tag: 'Strict Types', color: '#f43f5e' },
      { id: 'express', name: 'Express Proxy Routing', type: 'satellite', tag: 'Express Proxy Path', color: '#ec4899' },
    ];

    // Connect nodes
    const links: SynapseLink[] = [
      // Core to Satellites
      { source: 'core', target: 'persona' },
      { source: 'core', target: 'stack' },
      { source: 'core', target: 'mobile' },
      { source: 'core', target: 'types' },
      { source: 'core', target: 'express' },
    ];

    // 1. Dynamic projects mapping
    projects.forEach(p => {
       const pId = `proj_${p.id}`;
       nodes.push({
          id: pId,
          name: `${p.name} Workspace`,
          type: 'satellite',
          tag: `Project: ${p.name}`,
          color: '#8b5cf6'
       });
       links.push({ source: 'core', target: pId });
    });

    // 2. Custom memories mapping
    customMemories.forEach(m => {
       nodes.push({
          id: m.id,
          name: m.name,
          type: 'satellite',
          tag: m.name,
          color: '#06b6d4'
       });
       links.push({ source: 'core', target: m.id });
    });

    // 2.5 Dynamic Cortex Synapses mapping
    cortexSynapses.forEach(s => {
       nodes.push({
          id: s.id,
          name: s.name,
          type: 'satellite',
          tag: s.name,
          color: s.type === 'dream_synapse' ? '#f472b6' : '#a855f7'
       });
       links.push({ source: 'core', target: s.id });
    });

    // 3. File nodes mapping
    const filesList = [
      { id: 'f_main', name: 'src/main.tsx', color: '#71717a', parent: 'core' },
      { id: 'f_app', name: 'src/App.tsx', color: '#71717a', parent: 'core' },
      
      { id: 'f_brain', name: 'src/pages/Brain.tsx', color: '#60a5fa', parent: 'persona' },
      { id: 'f_os', name: 'src/pages/AgenticOS.tsx', color: '#60a5fa', parent: 'persona' },
      { id: 'f_cortex', name: 'src/components/MemoryCortex.tsx', color: '#60a5fa', parent: 'persona' },
      
      { id: 'f_package', name: 'package.json', color: '#fcd34d', parent: 'stack' },
      { id: 'f_vite', name: 'vite.config.ts', color: '#fcd34d', parent: 'stack' },
      { id: 'f_css', name: 'src/index.css', color: '#fcd34d', parent: 'stack' },
      
      { id: 'f_issues', name: 'src/pages/Issues.tsx', color: '#34d399', parent: 'mobile' },
      { id: 'f_idea', name: 'src/pages/IdeaExpansion.tsx', color: '#34d399', parent: 'mobile' },
      
      { id: 'f_tsconfig', name: 'tsconfig.json', color: '#fda4af', parent: 'types' },
      { id: 'f_types', name: 'src/types.ts', color: '#fda4af', parent: 'types' },
      
      { id: 'f_server', name: 'server.ts', color: '#f472b6', parent: 'express' },
      { id: 'f_env', name: '.env.example', color: '#f472b6', parent: 'express' }
    ];

    filesList.forEach(f => {
       nodes.push({ id: f.id, name: f.name, type: 'file', color: f.color });
       links.push({ source: f.parent, target: f.id });
    });

    // Connect files to corresponding customized workspace projects dynamically!
    if (projects.length > 0) {
       projects.forEach(p => {
          const pId = `proj_${p.id}`;
          links.push({ source: pId, target: 'f_idea' });
          links.push({ source: pId, target: 'f_issues' });
       });
    }

    // Force simulation with significantly wider scale
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance((d: any) => {
        const src = d.source as any;
        const tgt = d.target as any;
        if (src.type === 'core' && tgt.type === 'satellite') return 160;
        return 100;
      }))
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => {
        if (d.type === 'core') return 55;
        if (d.type === 'satellite') return 36;
        return 18;
      }));

    // 0. Inject beautiful custom SVG definitions (gradients and filters) for cinematic look
    const defs = svg.append('defs');

    // Create a powerful neon glow filter with dual bloom layers (tight core + atmospheric halo)
    const glowFilter = defs.append('filter')
      .attr('id', 'neon-glow-filter')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '3.5')
      .attr('result', 'glow1');
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '12')
      .attr('result', 'glow2');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'glow2');
    feMerge.append('feMergeNode').attr('in', 'glow1');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Feint glow filter
    const feintGlow = defs.append('filter')
      .attr('id', 'feint-glow-filter')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    feintGlow.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');
    const feintMerge = feintGlow.append('feMerge');
    feintMerge.append('feMergeNode').attr('in', 'blur');
    feintMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Node radial gradients for gorgeous volumetric liquid feel!
    // Core gold/yellow gradient
    const coreGrad = defs.append('radialGradient')
      .attr('id', 'grad-core')
      .attr('cx', '40%').attr('cy', '40%').attr('r', '60%');
    coreGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', '1');
    coreGrad.append('stop').attr('offset', '35%').attr('stop-color', '#fef206').attr('stop-opacity', '0.95');
    coreGrad.append('stop').attr('offset', '70%').attr('stop-color', '#f59e0b').attr('stop-opacity', '0.6');
    coreGrad.append('stop').attr('offset', '100%').attr('stop-color', '#78350f').attr('stop-opacity', '0.15');

    // Satellite blue gradient (themed as Amber Gold Soft)
    const satelliteBlueGrad = defs.append('radialGradient')
      .attr('id', 'grad-satellite-blue')
      .attr('cx', '40%').attr('cy', '40%').attr('r', '60%');
    satelliteBlueGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', '1');
    satelliteBlueGrad.append('stop').attr('offset', '35%').attr('stop-color', '#fbbf24').attr('stop-opacity', '0.9');
    satelliteBlueGrad.append('stop').attr('offset', '70%').attr('stop-color', '#d97706').attr('stop-opacity', '0.55');
    satelliteBlueGrad.append('stop').attr('offset', '100%').attr('stop-color', '#451a03').attr('stop-opacity', '0.12');

    // Satellite amber gradient (themed as Sun Yellow Bright)
    const satelliteAmberGrad = defs.append('radialGradient')
      .attr('id', 'grad-satellite-amber')
      .attr('cx', '40%').attr('cy', '40%').attr('r', '60%');
    satelliteAmberGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fffdf0').attr('stop-opacity', '1');
    satelliteAmberGrad.append('stop').attr('offset', '35%').attr('stop-color', '#facc15').attr('stop-opacity', '0.9');
    satelliteAmberGrad.append('stop').attr('offset', '70%').attr('stop-color', '#eab308').attr('stop-opacity', '0.55');
    satelliteAmberGrad.append('stop').attr('offset', '100%').attr('stop-color', '#713f12').attr('stop-opacity', '0.12');

    // Satellite green gradient (themed as Ivory Cream Glow)
    const satelliteGreenGrad = defs.append('radialGradient')
      .attr('id', 'grad-satellite-green')
      .attr('cx', '40%').attr('cy', '40%').attr('r', '60%');
    satelliteGreenGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', '1');
    satelliteGreenGrad.append('stop').attr('offset', '35%').attr('stop-color', '#fef08a').attr('stop-opacity', '0.9');
    satelliteGreenGrad.append('stop').attr('offset', '70%').attr('stop-color', '#eab308').attr('stop-opacity', '0.55');
    satelliteGreenGrad.append('stop').attr('offset', '100%').attr('stop-color', '#451a03').attr('stop-opacity', '0.12');

    // Satellite rose gradient (themed as Bronze Starbeam)
    const satelliteRoseGrad = defs.append('radialGradient')
      .attr('id', 'grad-satellite-rose')
      .attr('cx', '40%').attr('cy', '40%').attr('r', '60%');
    satelliteRoseGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', '1');
    satelliteRoseGrad.append('stop').attr('offset', '35%').attr('stop-color', '#fcd34d').attr('stop-opacity', '0.9');
    satelliteRoseGrad.append('stop').attr('offset', '70%').attr('stop-color', '#d97706').attr('stop-opacity', '0.55');
    satelliteRoseGrad.append('stop').attr('offset', '100%').attr('stop-color', '#451b03').attr('stop-opacity', '0.12');

    // Satellite pink gradient (themed as Supernova Flare)
    const satellitePinkGrad = defs.append('radialGradient')
      .attr('id', 'grad-satellite-pink')
      .attr('cx', '40%').attr('cy', '40%').attr('r', '60%');
    satellitePinkGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fffbeb').attr('stop-opacity', '1');
    satellitePinkGrad.append('stop').attr('offset', '35%').attr('stop-color', '#fbbf24').attr('stop-opacity', '0.9');
    satellitePinkGrad.append('stop').attr('offset', '70%').attr('stop-color', '#f97316').attr('stop-opacity', '0.55');
    satellitePinkGrad.append('stop').attr('offset', '100%').attr('stop-color', '#431407').attr('stop-opacity', '0.12');

    // Satellite cyan gradient (themed as Icy Silver Comet)
    const satelliteCyanGrad = defs.append('radialGradient')
      .attr('id', 'grad-satellite-cyan')
      .attr('cx', '40%').attr('cy', '40%').attr('r', '60%');
    satelliteCyanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', '1');
    satelliteCyanGrad.append('stop').attr('offset', '35%').attr('stop-color', '#f3f4f6').attr('stop-opacity', '0.9');
    satelliteCyanGrad.append('stop').attr('offset', '70%').attr('stop-color', '#9ca3af').attr('stop-opacity', '0.55');
    satelliteCyanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1f2937').attr('stop-opacity', '0.12');

    // Add flowing style markers inside the SVG
    svg.select('style').remove();
    svg.append('style').text(`
      @keyframes dynamic-flow-path {
         0% { stroke-dashoffset: 40; }
         100% { stroke-dashoffset: 0; }
      }
      @keyframes star-twinkle {
         0%, 100% { opacity: 0.15; transform: scale(0.85); }
         50% { opacity: 0.95; transform: scale(1.3); }
      }
      @keyframes slow-rotate {
         0% { transform: rotate(0deg); }
         100% { transform: rotate(360deg); }
      }
      @keyframes slow-reverse-rotate {
         0% { transform: rotate(360deg); }
         100% { transform: rotate(0deg); }
      }
      @keyframes nebula-float-0 {
         0% { transform: translate(0px, 0px) scale(1); }
         100% { transform: translate(35px, -20px) scale(1.08); }
      }
      @keyframes nebula-float-1 {
         0% { transform: translate(0px, 0px) scale(1.05); }
         100% { transform: translate(-30px, 25px) scale(0.95); }
      }
      @keyframes orbit-pulse {
         0%, 100% { opacity: 0.15; }
         50% { opacity: 0.35; }
      }
      .flowing-laser-link {
         animation: dynamic-flow-path 0.75s linear infinite !important;
      }
      .star {
         transform-origin: center;
      }
      .nebula-cloud {
         mix-blend-mode: screen;
         transform-origin: center;
      }
      .orbit-ring {
         transform-origin: center;
         animation: orbit-pulse 5s ease-in-out infinite alternate;
      }
    `);

    // 0.5 Render deep space background effects
    const backdropsGroup = zoomGroup.append('g').attr('class', 'cosmic-backdrop').style('pointer-events', 'none');
 
    // Create 120 twinkling stellar stars randomized across the 2.5D space coordinate map
    const starsCount = 125;
    for (let i = 0; i < starsCount; i++) {
      const cx = (Math.random() * 2.2 - 0.6) * dimensions.width;
      const cy = (Math.random() * 2.2 - 0.6) * dimensions.height;
      const r = Math.random() * 1.5 + 0.35;
      const twinkleDur = 2.4 + Math.random() * 4.2;
      const twinkleDelay = Math.random() * 3.5;
      
      backdropsGroup.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', r)
        .attr('fill', i % 5 === 0 ? '#fbbf24' : i % 5 === 1 ? '#ffffff' : i % 5 === 2 ? '#fef08a' : '#ffffff')
        .attr('fill-opacity', 0.2 + Math.random() * 0.75)
        .attr('class', 'star')
        .style('transform-origin', `${cx}px ${cy}px`)
        .style('animation', `star-twinkle ${twinkleDur}s infinite ease-in-out ${twinkleDelay}s`);
    }
 
    // Create custom blurry nebula clouds with float motions themed yellow and amber
    const nebulas = [
      { x: dimensions.width * 0.25, y: dimensions.height * 0.3, r: 280, color: '#eab308', opacity: 0.10 },
      { x: dimensions.width * 0.75, y: dimensions.height * 0.45, r: 340, color: '#ca8a04', opacity: 0.08 },
      { x: dimensions.width * 0.45, y: dimensions.height * 0.8, r: 240, color: '#facc15', opacity: 0.06 }
    ];
 
    nebulas.forEach((neb, idx) => {
      const nebGrad = defs.append('radialGradient')
        .attr('id', `nebula-grad-${idx}`)
        .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
      nebGrad.append('stop').attr('offset', '0%').attr('stop-color', neb.color).attr('stop-opacity', neb.opacity);
      nebGrad.append('stop').attr('offset', '100%').attr('stop-color', '#000000').attr('stop-opacity', '0');
 
      backdropsGroup.append('circle')
        .attr('cx', neb.x)
        .attr('cy', neb.y)
        .attr('r', neb.r)
        .attr('fill', `url(#nebula-grad-${idx})`)
        .attr('class', 'nebula-cloud')
        .style('animation', `nebula-float-${idx % 2} ${24 + idx * 8}s ease-in-out infinite alternate`);
    });
 
    // Cosmic orbit tracks center tracking around the central core node dynamically
    const orbitGroup = zoomGroup.append('g').attr('class', 'orbit-tracks-container').style('pointer-events', 'none');
    const orbitTracks = [
      { r: 90, stroke: 'rgba(234, 179, 8, 0.22)', dash: '4, 10' },
      { r: 180, stroke: 'rgba(251, 191, 36, 0.15)', dash: '6, 14' },
      { r: 280, stroke: 'rgba(254, 240, 138, 0.10)', dash: '2, 6' },
      { r: 380, stroke: 'rgba(255, 255, 255, 0.06)', dash: '8, 16' }
    ];
 
    const orbitRings = orbitTracks.map(o => {
      return orbitGroup.append('circle')
        .attr('fill', 'none')
        .attr('stroke', o.stroke)
        .attr('stroke-width', 0.85)
        .attr('stroke-dasharray', o.dash)
        .attr('class', 'orbit-ring')
        .attr('r', o.r);
    });
 
    const linkGroup = zoomGroup.append('g').attr('class', 'links-group');
 
    // 1. Cozy underlying fat glow lines
    const glowLink = linkGroup
      .selectAll('line.glow-link')
      .data(links)
      .join('line')
      .attr('class', 'glow-link')
      .attr('stroke', d => {
         const src = d.source as SynapseNode;
         const tgt = d.target as SynapseNode;
         if (src.type === 'core') return '#fbbf24';
         if (tgt.type === 'file') return '#ffffff';
         return '#eab308';
      })
      .attr('stroke-width', d => {
         const src = d.source as SynapseNode;
         return src.type === 'core' ? 8 : 5;
      })
      .attr('stroke-opacity', 0.22)
      .attr('filter', 'url(#neon-glow-filter)');
 
    // 2. Clear flowing laser foreground lines
    const link = linkGroup
      .selectAll('line.laser-link')
      .data(links)
      .join('line')
      .attr('class', 'laser-link flowing-laser-link')
      .attr('stroke', d => {
         const src = d.source as SynapseNode;
         const tgt = d.target as SynapseNode;
         if (src.type === 'core') return '#fffbeb';
         if (tgt.type === 'file') return '#ffffff';
         return '#facc15';
      })
      .attr('stroke-width', d => {
         const src = d.source as SynapseNode;
         return src.type === 'core' ? 2.8 : 1.4;
      })
      .attr('stroke-opacity', 0.92)
      .attr('stroke-dasharray', '6, 12');

    // Draw nodes wrappers
    const node = zoomGroup.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      )
      .on('click', (event, d: any) => {
        if (d.tag) {
          setSelectedHighlightMemory(d.tag);
        }
        
        // Find if this is a Cortex C-Synapse
        const matchingCortexSynapse = cortexSynapses.find(s => s.name === d.name || s.id === d.id);
        if (matchingCortexSynapse) {
          setSelectedDetailSynapse(matchingCortexSynapse);
          return;
        }

        // Tailor synapse detail view properties based on node identity
        let des = "";
        let snip = "";
        let titleName = d.name;
        let pName = "";
        let sType: 'custom_synapse' | 'dream_synapse' = 'custom_synapse';

        if (d.id === 'persona' || d.id === 'core') {
           des = "Guides the core tone, behavior rules, and visual aesthetics of development agents (e.g., Scrum Master, Principal Architect). It influences text prompts sent to LLMs so they respect project roles.";
        } else if (d.id === 'stack') {
           des = "Locks in development defaults such as React 18, Vite, Type-Safe modules, and Tailwind CSS configuration so that all asset generators share matched constraints.";
        } else if (d.id === 'mobile') {
           des = "Directs asset pipelines and layout structures to construct highly tactile touch targets (at least 44px) and fluid mobile layouts across different dimensions.";
        } else if (d.id === 'types') {
           des = "Strict static type-safety rules. Deactivates loose compiler parameters to avoid implicitly compiling code to the 'any' type, safeguarding the active runtime environment.";
        } else if (d.id === 'express') {
           des = "Express server routing protocols. Enforces routing sensitive client secrets securely via proxying endpoints (/api/*) rather than embedding them inside transparent frontend bundles.";
        } else if (d.id && String(d.id).startsWith('proj_')) {
           const projId = String(d.id).replace('proj_', '');
           const proj = projects.find(p => p.id === projId);
           if (proj) {
              titleName = `${proj.name} Workspace`;
              des = `Active project workspace containing custom roadmap lists, custom repositories, and target milestones. Description: ${proj.description || 'No direct notes logged.'}`;
              snip = `Repository Configs:\n${JSON.stringify({ repos: proj.githubRepos || [], frameworks: proj.frameworks || [] }, null, 2)}`;
           } else {
              des = "System project workspace routing parameters.";
           }
        } else if (customMemories.some(m => m.id === d.id || m.name === d.name)) {
           const customM = customMemories.find(m => m.id === d.id || m.name === d.name);
           if (customM) {
              des = customM.desc;
           }
        } else if (d.type === 'file') {
           // Provide tailored descriptions with matching code highlights for all system files
           if (d.name === 'src/main.tsx') {
              des = "Standard entrypoint file bootstrapping React 18 and nesting root-level structures inside standard index.html render nodes.";
              snip = "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';";
           } else if (d.name === 'src/App.tsx') {
              des = "Root single page application router. Decodes current hash routing and manages central responsive shell layout with sidebar and headers.";
              snip = "export default function App() {\n  return (\n    <div className=\"flex min-h-screen text-zinc-100 bg-[#09090b]\">\n      <Sidebar />\n      <MainShell />\n    </div>\n  );\n}";
           } else if (d.name === 'src/pages/Brain.tsx') {
              des = "Central dashboard for cognitive system memory. Integrates our visual Obsidian Synaptic Cortex graph, interactive audio sync controls, and text rules guides.";
           } else if (d.name === 'src/pages/AgenticOS.tsx') {
              des = "Agentic floor simulator dashboard. Manages live telemetry metrics, automated schedules, simulated VM sandboxes, and autonomous team drag-and-drop floors.";
           } else if (d.name === 'src/components/MemoryCortex.tsx') {
              des = "D3.js force simulation engine representing active thoughts, loaded projects, custom assets, and filesystem nodes in a highly cohesive visual model.";
           } else if (d.name === 'package.json') {
              des = "Project dependency manifest. Pins module boundaries, script hooks, and configures proxy targets to match local environment constraints.";
           } else if (d.name === 'vite.config.ts') {
              des = "Vite bundler constraints. Orchestrates typescript path mapping, dev ports, and transpilation standards for the production build steps.";
           } else if (d.name === 'src/index.css') {
              des = "Global Tailwind CSS directives loading custom variables, font family pairings, scrollbar scroll tracks, and subtle glow animations.";
           } else if (d.name === 'src/pages/Issues.tsx') {
              des = "Problem logs backlog and issue coordinator. Resolves high-level feature tickets and logs milestones details securely.";
           } else if (d.name === 'src/pages/IdeaExpansion.tsx') {
              des = "Frictionless AI drafting and whiteboards board, converting dictation into actionable conceptual blocks.";
           } else if (d.name === 'tsconfig.json') {
              des = "TypeScript compilation constraint flags. Strict module checks, path aliases, and esnext compiling goals.";
           } else if (d.name === 'src/types.ts') {
              des = "Global typescript interface database. Declares static signatures for Projects, Issues, Agents, Assets, and Logs.";
           } else if (d.name === 'server.ts') {
              des = "Custom Express server hosting development mock states and proxying live OAuth requests to standard Google Workspace and GitHub APIs.";
           } else if (d.name === '.env.example') {
              des = "Environment sample documentation. Declares key strings required to securely run OAuth, Firebase, and Gemini AI operations.";
           } else {
              des = `Physical filesystem file synapse mapping to "${d.name}". Part of the project repository architecture.`;
           }
        } else {
           des = `Interactive system synapse pointer mapping to [${d.name || 'unnamed'}]. Part of the long-term cognitive repository of the agent workspace.`;
        }

        setSelectedDetailSynapse({
           id: d.id || `custom_${Date.now()}`,
           name: titleName || 'Integrated Synapse Node',
           desc: des,
           snippet: snip || undefined,
           type: sType,
           projectName: pName || undefined,
           createdAt: Date.now()
        });
      });

    // Intense ambient glow auras
    node.filter(d => d.type === 'core' || d.type === 'satellite')
      .append('circle')
      .attr('r', d => d.type === 'core' ? 38 : 25)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => d.type === 'core' ? 3.5 : 1.8)
      .attr('stroke-opacity', 0.35)
      .attr('filter', 'url(#neon-glow-filter)');

    // Inner dashboard rotating dotted ring of Core
    node.filter(d => d.type === 'core')
      .append('circle')
      .attr('r', 34)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.9)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '3, 4')
      .style('animation', 'slow-rotate 12s linear infinite')
      .style('transform-origin', 'center');

    // Outer dashboard rotating dotted ring of Core
    node.filter(d => d.type === 'core')
      .append('circle')
      .attr('r', 46)
      .attr('fill', 'none')
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 1.1)
      .attr('stroke-opacity', 0.38)
      .attr('stroke-dasharray', '14, 20')
      .style('animation', 'slow-reverse-rotate 22s linear infinite')
      .style('transform-origin', 'center');

    // Wave ring pulse animation
    const pulseGlow = node.filter(d => d.type === 'core')
      .append('circle')
      .attr('r', 44)
      .attr('fill', 'transparent')
      .attr('stroke', '#fef08a')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('class', 'animate-ping')
      .style('transform-origin', 'center');

    // Render node representations (circles with custom physical gradients)
    node.append('circle')
      .attr('r', d => {
        let baseR = d.type === 'core' ? 24 : d.type === 'satellite' ? 14 : 7.5;
        if (searchQuery && d.name.toLowerCase().includes(searchQuery.toLowerCase())) {
           return baseR * 1.35;
        }
        return baseR;
      })
      .attr('fill', d => {
        if (d.type === 'core') return 'url(#grad-core)';
        if (d.type === 'satellite') {
           if (d.color === '#a855f7' || d.color === '#8b5cf6') return 'url(#grad-core)';
           if (d.color === '#3b82f6') return 'url(#grad-satellite-blue)';
           if (d.color === '#f59e0b') return 'url(#grad-satellite-amber)';
           if (d.color === '#10b981') return 'url(#grad-satellite-green)';
           if (d.color === '#f43f5e') return 'url(#grad-satellite-rose)';
           if (d.color === '#ec4899' || d.color === '#f472b6') return 'url(#grad-satellite-pink)';
           if (d.color === '#06b6d4') return 'url(#grad-satellite-cyan)';
        }
        // File nodes look like glowing baby star cores
        if (d.type === 'file') return '#ffffff';
        return d.color;
      })
      .attr('fill-opacity', d => d.type === 'file' ? 1 : 0.85)
      .attr('stroke', d => {
         if (searchQuery && d.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return '#f59e0b';
         }
         return d.color;
      })
      .attr('stroke-width', d => {
         if (searchQuery && d.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return 3;
         }
         return d.type === 'core' ? 3 : d.type === 'satellite' ? 2 : 1.2;
      })
      .attr('stroke-opacity', 0.95)
      .attr('filter', 'url(#feint-glow-filter)');

    // Node indicators inside satellites
    node.filter(d => d.type === 'core')
      .append('circle')
      .attr('r', 5.5)
      .attr('fill', '#ffffff')
      .attr('filter', 'url(#feint-glow-filter)');

    node.filter(d => d.type === 'satellite')
      .append('circle')
      .attr('r', 3)
      .attr('fill', '#ffffff');

    // Conditional text label visibility - fade-in ONLY on node hover or if search query matched!
    const textLabel = node.append('text')
      .text(d => d.name)
      .attr('x', d => {
        if (d.type === 'core') return 34;
        if (d.type === 'satellite') return 24;
        return 16;
      })
      .attr('y', 4)
      .attr('font-size', d => d.type === 'core' ? '12px' : d.type === 'satellite' ? '11px' : '10px')
      .attr('fill', d => {
        if (d.type === 'core') return '#ffffff';
        if (d.type === 'satellite') return '#fef08a';
        return '#e4e4e7';
      })
      .attr('font-weight', d => d.type === 'core' ? 'bold' : '500')
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .style('pointer-events', 'none')
      .style('opacity', d => {
         if (searchQuery && d.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return 1;
         }
         return 0;
      })
      .style('text-shadow', '0 1px 8px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)');

    // Toggle label visibility & node scale on mouse actions smoothly
    node.on('mouseenter', function(event: any, d: any) {
      d3.select(this).select('text').transition().duration(250).style('opacity', 1);
      d3.select(this).select('circle')
        .transition().duration(250)
        .attr('r', (nodeDatum: any) => {
          let baseSize = nodeDatum.type === 'core' ? 30 : nodeDatum.type === 'satellite' ? 18 : 11;
          if (searchQuery && nodeDatum.name.toLowerCase().includes(searchQuery.toLowerCase())) {
             return baseSize * 1.35;
          }
          return baseSize;
        })
        .attr('stroke-width', (nodeDatum: any) => nodeDatum.type === 'core' ? 4 : 2.8)
        .attr('stroke-opacity', 1);
    })
    .on('mouseleave', function(event: any, d: any) {
      const isMatched = searchQuery && d.name.toLowerCase().includes(searchQuery.toLowerCase());
      d3.select(this).select('text').transition().duration(200).style('opacity', isMatched ? 1 : 0);
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', (nodeDatum: any) => {
          let baseSize = nodeDatum.type === 'core' ? 24 : nodeDatum.type === 'satellite' ? 14 : 7.5;
          if (isMatched) return baseSize * 1.35;
          return baseSize;
        })
        .attr('stroke-width', (datum: any) => {
           if (isMatched) return 3;
           return datum.type === 'core' ? 3 : datum.type === 'satellite' ? 2 : 1.2;
        });
    });

    // Dynamically update link/node positioning on simulation tick
    simulation.on('tick', () => {
      glowLink
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);

      // Track Concentric Orbit Rings surrounding core node dynamically
      const coreNode = nodes.find(n => n.id === 'core');
      if (coreNode && coreNode.x !== undefined && coreNode.y !== undefined) {
         orbitRings.forEach(ring => {
            ring.attr('cx', coreNode.x!).attr('cy', coreNode.y!);
         });
      }
    });

    return () => {
      simulation.stop();
    };
  }, [dimensions, searchQuery, projects, customMemories]);

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col xl:flex-row p-3 sm:p-6 gap-4 sm:gap-6 overflow-y-auto xl:overflow-hidden bg-[#07070a]/90 animate-in fade-in duration-300 font-sans z-20">
      
      {/* 1. OBSIDIAN-STYLE INTERACTIVE VISUAL SYNAPSE BRAIN */}
      <div className="flex-1 flex flex-col border border-zinc-800/80 bg-[#0e0e11]/80 rounded-2xl p-4 sm:p-5 overflow-hidden min-h-0 relative group shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-3 shrink-0 z-10">
          <div className="flex items-center gap-2">
            <Network size={14} className="text-yellow-400 animate-pulse" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Obsidian Synaptic Cortex</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono hidden sm:inline">Hover nodes for labels / Click satellites to query</span>
        </div>
        
        {/* Interactive Node Graph Area - EXPANDED TO BE PHYSICALLY BIGGER FOR OBSIDIAN VIEW */}
        <div ref={containerRef} className="h-[350px] sm:h-[450px] xl:flex-1 relative bg-gradient-to-br from-[#020205] via-[#121002] to-[#010103] rounded-xl border border-zinc-800/80 overflow-hidden xl:min-h-[500px] shadow-[inset_0_4px_40px_rgba(0,0,0,0.95)]">
          {/* Constellation star grid lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.09]" />
          <div className="absolute inset-0 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:64px_64px] opacity-[0.08]" />
          
          {/* Ambient nebulous atmospheric sweeps */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(234,179,8,0.05)_0%,transparent_65%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_70%,rgba(234,179,8,0.04)_0%,transparent_60%)] pointer-events-none" />
          
          {/* Obsidian Search Box */}
          <div className="absolute top-4 left-4 z-30 flex items-center bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden backdrop-blur-md shadow-lg">
             <span className="p-2 text-zinc-500 text-[10px] font-bold uppercase tracking-wider shrink-0 bg-zinc-900 border-r border-zinc-850 font-mono">Cortex Search:</span>
             <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find memory or file..."
                className="bg-transparent border-none text-[11px] outline-none py-1 px-3 text-zinc-200 focus:ring-0 w-44 font-mono placeholder-zinc-600"
             />
             {searchQuery && (
                <button 
                   onClick={() => setSearchQuery("")}
                   className="p-1 px-2 text-zinc-400 hover:text-white transition text-xs shrink-0 font-bold"
                >
                   ✕
                </button>
             )}
          </div>
          
          {/* Programmatic Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
            <button 
              onClick={handleZoomIn}
              className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-zinc-700 text-zinc-350 hover:text-white transition-all shadow-md"
              type="button"
              title="Zoom In"
            >
              <Plus size={14} />
            </button>
            <button 
              onClick={handleZoomOut}
              className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-zinc-700 text-zinc-350 hover:text-white transition-all shadow-md"
              type="button"
              title="Zoom Out"
            >
              <Minus size={14} />
            </button>
            <button 
              onClick={handleResetZoom}
              className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-zinc-700 text-zinc-350 hover:text-white transition-all shadow-md text-[10px] font-semibold"
              type="button"
              title="Reset Zoom"
            >
              <Maximize2 size={14} />
            </button>
          </div>
          
          {/* Active Synapse Graph SVG canvas */}
          <svg ref={svgRef} className="w-full h-full block z-10 relative" />
        </div>

        {/* Under Synaptic Description Box detailing currently activated Memory */}
        <div className="mt-3 p-3 bg-zinc-900 border border-zinc-800/80 rounded-lg shrink-0 text-[11px] leading-relaxed">
          {selectedHighlightMemory === "AI Core Synapse" && (
            <p className="text-zinc-300"><strong className="text-zinc-100 font-semibold font-mono">🌌 AI Core Synapse:</strong> This is your workspace's high-level memory pool. It maps real-time user-focused code directives directly into upcoming code refinement prompts.</p>
          )}
          {selectedHighlightMemory === "Persona Config" && (
            <p className="text-zinc-300"><strong className="text-yellow-400 font-semibold font-mono">👤 Persona Config:</strong> Guides the core tone, behavior rules, and visual aesthetics of development agents (e.g., Scrum Master, Principal Architect).</p>
          )}
          {selectedHighlightMemory === "Preferred Stack" && (
            <p className="text-zinc-300"><strong className="text-amber-400 font-semibold font-mono">🛠 Preferred Stack:</strong> Locks in framework defaults (React, TS, Tailwind CSS) to enforce architectural consistency across simple or complex views.</p>
          )}
          {selectedHighlightMemory === "Mobile Standard" && (
            <p className="text-zinc-300"><strong className="text-emerald-400 font-semibold font-mono">📱 Mobile Standard:</strong> Instructs generator pipelines to construct flexible tactile touch layouts (no-overscroll, fluid grid) on mobile dimensions.</p>
          )}
          {selectedHighlightMemory === "Strict Types" && (
            <p className="text-zinc-300"><strong className="text-rose-400 font-semibold font-mono">⚡ Strict Types:</strong> Instructs code generation engines to avoid loose compiler models (implicitly 'any') and strictly enforce clean TypeScript structures.</p>
          )}
          {selectedHighlightMemory === "Express Proxy Path" && (
            <p className="text-zinc-300"><strong className="text-pink-400 font-semibold font-mono">🌐 Express Proxy Path:</strong> Enforces secure proxying of sensitive environment credentials via server-side routes (/api/*) rather than revealing factors to browsers.</p>
          )}
          {!["AI Core Synapse", "Persona Config", "Preferred Stack", "Mobile Standard", "Strict Types", "Express Proxy Path"].includes(selectedHighlightMemory || '') && (
            (() => {
              const matchedCustom = customMemories.find(m => m.name === selectedHighlightMemory);
              const matchedCortex = cortexSynapses.find(s => s.name === selectedHighlightMemory);
              const matchedProj = projects.find(p => `Project: ${p.name}` === selectedHighlightMemory);
              if (matchedCustom) {
                return <p className="text-zinc-300"><strong className="text-cyan-400 font-semibold font-mono">🧠 {matchedCustom.name}:</strong> {cleanTextToPlainEnglish(matchedCustom.desc)}</p>;
              }
              if (matchedCortex) {
                return (
                  <div className="text-zinc-300">
                    <p><strong className="text-yellow-400 font-semibold font-mono">🧠 {matchedCortex.name}:</strong> {cleanTextToPlainEnglish(matchedCortex.desc)}</p>
                  </div>
                );
              }
              if (matchedProj) {
                return <p className="text-zinc-300"><strong className="text-yellow-405 font-semibold font-mono">📁 {matchedProj.name} Workspace:</strong> {cleanTextToPlainEnglish(matchedProj.description)}</p>;
              }
              return <p className="text-zinc-500 italic font-mono select-none">No specific cortex overlay selected. Click on a satellite synapse to view cognitive context details.</p>;
            })()
          )}
        </div>
      </div>

      {/* 2. MIDDLE CARD: RULES WRITER MEMORY STORAGE */}
      <div className="w-full xl:w-96 flex flex-col border border-zinc-800/80 bg-[#121214]/65 rounded-xl p-4 overflow-hidden min-h-0 shrink-0">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MemoryStick size={15} className="text-yellow-500" />
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Memory Rules Context</span>
            </div>
            <button
              onClick={() => {
                if (!aiContextRules) return;
                const cleanedRules = cleanTextToPlainEnglish(aiContextRules);
                const lines = cleanedRules.split('\n');
                const bullets: string[] = [];
                const rawParagraphs: string[] = [];
                lines.forEach(line => {
                  const trimmed = line.trim();
                  if (!trimmed) return;
                  if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
                    const content = trimmed.substring(1).trim();
                    if (content) bullets.push(content);
                  } else {
                    rawParagraphs.push(trimmed);
                  }
                });
                const uniqueBullets = Array.from(new Set(bullets)).sort((a, b) => a.localeCompare(b));
                const uniqueParagraphs = Array.from(new Set(rawParagraphs)).sort((a, b) => a.localeCompare(b));
                const sortedLines = [
                  ...uniqueParagraphs,
                  ...uniqueBullets.map(b => `- ${b}`)
                ];
                setAiContextRules(sortedLines.join('\n'));
              }}
              className="text-[9px] bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/35 font-mono transition-all cursor-pointer flex items-center gap-1 self-start mt-0.5"
              title="Automatically organize & sort rules alphabetically"
              type="button"
            >
              <Zap size={9} /> Auto-Sort Rules
            </button>
          </div>
          <span className="text-[10px] text-zinc-550 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            Active Sync
          </span>
        </div>
        
        <textarea
          value={aiContextRules}
          onChange={(e) => setAiContextRules(e.target.value)}
          className="flex-1 w-full bg-[#09090b]/85 border border-zinc-800 rounded-lg p-3 text-[12px] text-emerald-400 font-mono outline-none focus:border-yellow-500/40 resize-none leading-relaxed custom-scrollbar animate-fade-in"
          placeholder={`Developer Persona & Tech Stack:\n- Developer prefers strict type-safety across all TSX components.\n- Always target Tailwind v4 inline utility styling...`}
        />

        {/* Dynamic Synaptic Node Creator Form */}
        <div className="my-3 pt-3.5 border-t border-zinc-800/65 shrink-0">
          <h4 className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></span>
             Create Custom Synaptic Node
          </h4>
          <div className="space-y-2">
             <input 
                type="text"
                value={newMemoryName}
                onChange={(e) => setNewMemoryName(e.target.value)}
                placeholder="Memory Name (e.g., Auth Rules)"
                className="w-full bg-[#09090b]/80 border border-zinc-800 rounded px-2.5 py-1.5 text-[11px] outline-none focus:border-yellow-500/50 text-zinc-100 font-mono"
             />
             <div className="flex gap-2">
                <input 
                   type="text"
                   value={newMemoryDesc}
                   onChange={(e) => setNewMemoryDesc(e.target.value)}
                   placeholder="Synaptic directive description..."
                   className="flex-1 bg-[#09090b]/80 border border-zinc-800 rounded px-2.5 py-1.5 text-[11px] outline-none focus:border-yellow-500/50 text-zinc-200 font-sans"
                />
                <button
                   onClick={handleAddMemory}
                   className="px-3.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded text-[11px] font-bold transition active:scale-95 flex items-center gap-1.5 shrink-0"
                   type="button"
                >
                   <Plus size={12} /> Spawn
                </button>
             </div>
          </div>
        </div>

        {/* Toggle Quick Tags block */}
        <div className="mt-4 shrink-0">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Toggle Memory Inlays</h4>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
            {[
              { label: "Prefer TS", rule: "Developer prefers strict static TypeScript type-safety across all files." },
              { label: "Mobile First", rule: "Always enforce fluid mobile-first responsive views using Tailwind." },
              { label: "Tailwind UI", rule: "Focus strictly on inline Tailwind utility patterns instead of custom CSS stylesheets." },
              { label: "Omit Comments", rule: "Omit highly verbose boilerplate comments on simple functions unless requested." },
              { label: "Full-Stack Express", rule: "Assume full-stack Node.js and Express architecture proxies for API tokens." }
            ].map((inlay, i) => {
              const isAdded = aiContextRules.includes(inlay.rule);
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (isAdded) {
                      setAiContextRules(prev => prev.replace(inlay.rule, '').replace(/\n\n+/g, '\n').trim());
                    } else {
                      setAiContextRules(prev => {
                        const section = `\n- ${inlay.rule}`;
                        return prev ? prev.trim() + section : inlay.rule;
                      });
                    }
                  }}
                  className={`text-[10px] font-semibold px-2 py-1 rounded border transition-all ${
                    isAdded 
                      ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/20' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                  type="button"
                >
                  {isAdded ? '✓ ' : '+ '} {inlay.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex justify-between items-center text-[10px]">
            <span className="text-zinc-500">Auto-saves to browser locale.</span>
            <button onClick={() => setAiContextRules('')} className="text-zinc-500 hover:text-red-400 font-semibold font-mono uppercase tracking-wide text-[9px]" type="button">
              Clear All
            </button>
          </div>
        </div>

        {/* Dynamic C-Synaptic Cortex Synapses list */}
        {cortexSynapses.length > 0 && (
          <div className="mt-4 pt-3 border-t border-zinc-800/60 shrink-0 flex-1 flex flex-col min-h-0 overflow-hidden">
             <h4 className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Active C-Synapses (Click to Open)</span>
                <span className="font-mono text-[8px] tracking-normal lowercase opacity-70">{cortexSynapses.length} registered</span>
             </h4>
             <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1 max-h-56">
                {cortexSynapses.map(s => (
                   <button
                      key={s.id}
                      onClick={() => setSelectedDetailSynapse(s)}
                      className="w-full text-left p-2 rounded bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-900 hover:border-yellow-500/20 transition-all text-[11px] group block"
                      type="button"
                   >
                      <div className="flex items-center justify-between font-mono font-medium text-zinc-300 group-hover:text-yellow-405">
                         <span className="truncate max-w-[170px]">&gt; {s.name}</span>
                         <span className="text-[8px] bg-yellow-950/40 text-yellow-505 py-0.5 px-1.5 rounded uppercase tracking-wider scale-90">{s.projectName || 'global'}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{s.desc}</div>
                   </button>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* 3. RIGHT CARD: CHAT WITH SYSTEM BRAIN (Vocal / Oral & Waveforms!) */}
      <div className="w-full xl:w-76 shrink-0 flex flex-col border border-zinc-800/80 bg-[#121214]/65 rounded-xl p-4 overflow-hidden min-h-0">
        <div className="flex items-center gap-1.5 mb-3 shrink-0">
          <Volume2 size={15} className="text-pink-400" />
          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Speech Memory Sync</span>
        </div>

        {/* ChatGPT Voice Vibe pulsing ring visualizer */}
        <div className="bg-[#09090b]/60 rounded-xl p-6 border border-zinc-800 shrink-0 flex flex-col items-center justify-center relative overflow-hidden mb-4">
          <div className="relative w-20 h-20 flex items-center justify-center z-10">
            {/* Pulses radiating from center */}
            <AnimatePresence mode="popLayout">
              {memoryVoiceActive || memoryAssistantSpeaking ? (
                <motion.div key="active-pulses" className="absolute inset-0">
                  <motion.div 
                    key="active-p1"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    className={`absolute inset-0 rounded-full ${memoryVoiceActive ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}
                  />
                  <motion.div 
                    key="active-p2"
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 2.8, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut", delay: 0.5 }}
                    className={`absolute inset-0 rounded-full ${memoryVoiceActive ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}
                  />
                </motion.div>
              ) : (
                /* Always on Standby Radiator pulses - subtle, calm, and constant */
                <motion.div key="standby-pulses" className="absolute inset-0">
                  <motion.div 
                    key="standby-p1"
                    initial={{ scale: 1, opacity: 0.18 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-emerald-500/15"
                  />
                  <motion.div 
                    key="standby-p2"
                    initial={{ scale: 1, opacity: 0.1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 1 }}
                    className="absolute inset-0 rounded-full bg-emerald-500/5"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Central Voice Button */}
            <button
              onClick={handleVocalSync}
              className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-300 shadow-md ${
                memoryVoiceActive 
                  ? 'bg-red-650 border-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                  : memoryAssistantSpeaking 
                  ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] font-bold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
              type="button"
              title="Speak guiding memo"
            >
              {memoryVoiceActive ? (
                <span className="text-[9px] font-bold tracking-wider animate-bounce font-mono">REC</span>
              ) : memoryAssistantSpeaking ? (
                <Volume2 size={18} className="animate-pulse" />
              ) : (
                <Mic size={18} />
              )}
            </button>
          </div>

          {/* Active Synth waves descriptor text */}
          <span className="text-[10px] font-semibold mt-3 text-center tracking-tight text-zinc-400 font-mono">
            {memoryVoiceActive ? (
              <span className="text-red-400 animate-pulse">Speak memory preference...</span>
            ) : memoryAssistantSpeaking ? (
              <span className="text-yellow-400 animate-pulse">Cortex speaking...</span>
            ) : (
              "Click to dictate guidelines"
            )}
          </span>
        </div>

        {/* Synchronic Vocal Conversational Log */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#09090b]/80 border border-zinc-800 rounded-lg p-3">
          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2 shrink-0 font-mono">Synapse logs</div>
          <div className="flex-1 overflow-y-auto space-y-3 text-[10px] pr-1 custom-scrollbar">
            {vocalLogs.map((log, index) => (
              <div key={index} className={`flex flex-col ${log.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[8px] font-semibold text-zinc-500 mb-0.5 uppercase tracking-wider font-mono">
                  {log.sender === 'user' ? 'Operator Memo' : 'Cortex Response'}
                </span>
                <div className={`p-2.5 rounded-lg max-w-[85%] leading-relaxed ${
                  log.sender === 'user' 
                    ? 'bg-zinc-800 text-zinc-300 rounded-tr-none' 
                    : 'bg-[#18181b] border border-zinc-800 text-yellow-300 rounded-tl-none'
                }`}>
                  {log.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. HIGH-CONTRAST INTERACTIVE SYNAPSE DETAIL MODAL POPUP */}
      <AnimatePresence>
        {selectedDetailSynapse && (
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
             <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="w-full max-w-2xl bg-[#0e0e11] border border-yellow-500/30 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.10)] overflow-hidden flex flex-col font-sans"
             >
                {/* Modal Header */}
                <div className="p-4 bg-gradient-to-r from-yellow-950/30 via-zinc-900 to-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                       <span className="p-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-405 rounded-lg">
                          <Network size={16} />
                       </span>
                      <div>
                         <h3 className="text-xs font-bold text-zinc-100 font-mono tracking-wide uppercase">C-Synapse Inspection</h3>
                         <p className="text-[9px] text-zinc-500 font-mono">ID: {selectedDetailSynapse.id}</p>
                      </div>
                   </div>
                   <button 
                      onClick={() => setSelectedDetailSynapse(null)}
                      className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                      type="button"
                   >
                      ✕
                   </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar text-left">
                   {/* Name and Tag */}
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] bg-yellow-950 text-yellow-300 border border-yellow-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            {selectedDetailSynapse.type === 'dream_synapse' ? 'AI Dream Synopsis' : 'Cognitive Rule'}
                         </span>
                         {selectedDetailSynapse.projectName && (
                            <span className="text-[9px] bg-zinc-90 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded font-mono font-medium">
                               Project: {selectedDetailSynapse.projectName}
                            </span>
                         )}
                         <span className="text-[9px] text-zinc-500 font-mono ml-auto">
                            Synced: {new Date(selectedDetailSynapse.createdAt).toLocaleString()}
                         </span>
                      </div>
                      <h2 className="text-lg font-bold text-zinc-100 tracking-tight leading-snug">{selectedDetailSynapse.name}</h2>
                   </div>

                   {/* Description Card */}
                   <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">Directives & Instructions Context</h4>
                      <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl leading-relaxed text-zinc-300 text-[12px]">
                         {selectedDetailSynapse.desc}
                      </div>
                   </div>

                   {/* Code Snippet if any */}
                   {selectedDetailSynapse.snippet && (
                      <div className="space-y-1.5">
                         <h4 className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">Synthesized Solution Snippet</h4>
                         <div className="relative group">
                            <pre className="p-4 bg-[#050507] border border-zinc-900 rounded-xl text-emerald-400 text-[11px] font-mono overflow-x-auto leading-relaxed max-h-60">
                               <code>{selectedDetailSynapse.snippet}</code>
                            </pre>
                            <button
                               onClick={() => {
                                  if (selectedDetailSynapse.snippet) {
                                     navigator.clipboard.writeText(selectedDetailSynapse.snippet);
                                     alert('Snippet copied to your workspace clipboard! Paste it inside any file to enhance your codebase.');
                                  }
                               }}
                               className="absolute top-2.5 right-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 rounded px-2.5 py-1 text-[10px] font-mono transition shadow-lg"
                               type="button"
                            >
                               Copy Code
                            </button>
                         </div>
                      </div>
                   )}
                </div>

                {/* Modal Actions Footer */}
                <div className="p-4 bg-zinc-950/80 border-t border-zinc-900 flex justify-end gap-2.5">
                   <button
                      onClick={() => {
                         let updatedRules = aiContextRules;
                         const formattedRule = `\n\n- [Cortex Rule] ${selectedDetailSynapse.name}: ${selectedDetailSynapse.desc}`;
                         if (!updatedRules.includes(selectedDetailSynapse.name)) {
                            setAiContextRules(prev => prev ? prev.trim() + formattedRule : formattedRule.trim());
                            alert('Directive successfully merged into long-term text guidelines pool.');
                         } else {
                            alert('This rule is already present in your active rule context!');
                         }
                      }}
                      className="text-xs font-bold px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black rounded-lg shadow transition active:scale-95"
                      type="button"
                   >
                      Promote to Rules Context
                   </button>
                   <button 
                      onClick={() => setSelectedDetailSynapse(null)}
                      className="text-xs font-semibold px-4 py-2 bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-300 border border-zinc-800 rounded-lg transition"
                      type="button"
                   >
                      Exit Inspection
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
