import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'dir' | 'file' | 'project' | 'repo' | 'phase' | 'issue' | 'doc';
  size?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

export function ForceGraph({ nodes, links, onNodeClick }: { nodes: Node[], links: Link[], onNodeClick?: (node: Node) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    let animationFrameId: number;
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      animationFrameId = requestAnimationFrame(() => {
        setDimensions({ width, height });
      });
    });
    
    if (containerRef.current) {
       resizeObserver.observe(containerRef.current);
       setDimensions({
         width: containerRef.current.clientWidth,
         height: containerRef.current.clientHeight
       });
    }
    
    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear on re-render

    const g = svg.append('g');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Filter to top N items if graph is huge
    let displayNodes = [...nodes];
    let displayLinks = [...links];
    if (displayNodes.length > 500) {
       displayNodes = displayNodes.slice(0, 500);
       const nodeIds = new Set(displayNodes.map(n => n.id));
       displayLinks = displayLinks.filter(l => nodeIds.has(l.source as string) && nodeIds.has(l.target as string));
    }

    const simulation = d3.forceSimulation(displayNodes)
      .force('link', d3.forceLink(displayLinks).id((d: any) => d.id).distance(40))
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => {
        if (d.type === 'project') return 24;
        if (d.type === 'dir' || d.type === 'repo' || d.type === 'doc') return 16;
        if (d.type === 'phase') return 10;
        return 6;
      }));

    const link = g.append('g')
      .selectAll('line')
      .data(displayLinks)
      .join('line')
      .attr('stroke', '#3f3f46')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.6);

    const node = g.append('g')
      .selectAll('g')
      .data(displayNodes)
      .join('g')
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
      .on('click', (event, d) => {
        if (d.type === 'file' && onNodeClick) {
          onNodeClick(d);
        }
      });

    node.append('circle')
      .attr('r', d => {
        if (d.type === 'project') return 16;
        if (d.type === 'repo' || d.type === 'doc') return 12;
        if (d.type === 'dir') return 8;
        if (d.type === 'phase') return 6;
        return 4;
      })
      .attr('fill', d => {
        if (d.type === 'project') return '#a855f7'; // purple
        if (d.type === 'repo') return '#10b981'; // emerald
        if (d.type === 'doc') return '#3b82f6'; // blue
        if (d.type === 'phase') return '#f59e0b'; // amber
        if (d.type === 'dir') return '#3b82f6'; // blue
        if (d.type === 'issue') return '#ef4444'; // red
        return '#27272a';
      })
      .attr('stroke', '#18181b')
      .attr('stroke-width', 1.5);
      
    node.append('text')
      .text(d => d.name)
      .attr('x', d => {
        if (d.type === 'project') return 20;
        if (d.type === 'repo' || d.type === 'doc') return 16;
        return 10;
      })
      .attr('y', 3)
      .attr('fill', '#a1a1aa')
      .attr('font-size', d => d.type === 'project' ? '12px' : '8px')
      .attr('font-weight', d => (d.type === 'project' || d.type === 'repo') ? 'bold' : 'normal')
      .attr('font-family', 'monospace')
      .style('pointer-events', 'none')
      .style('opacity', d => (d.type === 'dir' || d.type === 'project' || d.type === 'repo' || d.type === 'phase' || d.type === 'doc') ? 1 : 0.4);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-move">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
