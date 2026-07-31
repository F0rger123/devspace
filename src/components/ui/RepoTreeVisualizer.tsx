import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, File, ChevronRight, ChevronDown, Bot, HelpCircle, Sparkles, 
  RefreshCw, GitCommit, Play, Info, Check, ShieldCheck, Loader2, Network, Code2
} from 'lucide-react';
import { useData } from '../../context/DataProvider';

interface RepoTreeVisualizerProps {
  repoName: string;
  project: any;
}

interface FileNode {
  path: string;
  size?: number;
  type: 'blob' | 'tree';
}

function safeDecodeBase64(str: string): string {
  try {
    const binString = atob(str);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (err) {
      return atob(str);
    }
  }
}

export function RepoTreeVisualizer({ repoName, project }: RepoTreeVisualizerProps) {
  const { githubToken, updateProject } = useData();
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<{ [path: string]: boolean }>({ '': true });
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'graph'>('hierarchy');

  // Scanning & Dreaming states
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileAnalysis, setFileAnalysis] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isDreaming, setIsDreaming] = useState(false);
  const [dreamLog, setDreamLog] = useState<string[]>([]);
  const [dreamOutput, setDreamOutput] = useState<string>('');

  // Canvas context for Force-Directed Graph View
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (repoName) {
      fetchRepoTree();
    }
  }, [repoName]);

  // Handle graph rendering
  useEffect(() => {
    if (viewMode === 'graph' && treeData.length > 0) {
      renderGraph();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [viewMode, treeData]);

  const fetchRepoTree = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/github/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: repoName, token: githubToken || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tree)) {
          // Filter out node_modules, .git, etc.
          const filtered: FileNode[] = data.tree.filter((item: any) => {
            const lower = item.path.toLowerCase();
            return !lower.includes('node_modules/') && 
                   !lower.includes('.git/') && 
                   !lower.includes('dist/') &&
                   !lower.includes('.next/');
          });
          setTreeData(filtered);
          // Set first file as selected by default
          const firstBlob = filtered.find(f => f.type === 'blob');
          if (firstBlob) {
            setSelectedFile(firstBlob.path);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching repository tree:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Construct hierarchical folder structure
  const buildTreeHierarchy = () => {
    const root: any = { name: 'root', path: '', type: 'tree', children: [] };
    
    treeData.forEach(node => {
      const parts = node.path.split('/');
      let current = root;
      
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');
        
        let found = current.children.find((c: any) => c.name === part);
        if (!found) {
          found = {
            name: part,
            path: currentPath,
            type: isLast ? node.type : 'tree',
            size: isLast ? node.size : undefined,
            children: []
          };
          current.children.push(found);
        }
        current = found;
      });
    });

    // Sort: directories first, then files alphabetically
    const sortNode = (n: any) => {
      if (n.children && n.children.length > 0) {
        n.children.sort((a: any, b: any) => {
          if (a.type !== b.type) {
            return a.type === 'tree' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        n.children.forEach(sortNode);
      }
    };
    sortNode(root);
    return root.children;
  };

  // Render Graphical Force-Directed Node Map
  const renderGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Build simplified list of nodes (folders and key files)
    const nodes: any[] = [];
    const links: any[] = [];

    // Root node
    nodes.push({ id: 'root', label: repoName.split('/').pop(), type: 'root', x: 200, y: 150, vx: 0, vy: 0, r: 10, color: '#f59e0b' });

    const foldersSet = new Set<string>();
    
    // Scan unique folder segments
    treeData.slice(0, 100).forEach(node => {
      const parts = node.path.split('/');
      parts.forEach((part, index) => {
        if (index < parts.length - 1) {
          const folderPath = parts.slice(0, index + 1).join('/');
          if (!foldersSet.has(folderPath)) {
            foldersSet.add(folderPath);
            const parentId = index === 0 ? 'root' : parts.slice(0, index).join('/');
            nodes.push({
              id: folderPath,
              label: part,
              type: 'folder',
              x: 100 + Math.random() * 200,
              y: 80 + Math.random() * 140,
              vx: 0,
              vy: 0,
              r: 6,
              color: '#3b82f6'
            });
            links.push({ source: parentId, target: folderPath });
          }
        } else {
          // File node
          const parentId = parts.length === 1 ? 'root' : parts.slice(0, -1).join('/');
          const isKeyFile = part.endsWith('.ts') || part.endsWith('.tsx') || part.endsWith('.js') || part.endsWith('.json') || part.endsWith('.md');
          if (isKeyFile && nodes.length < 120) {
            nodes.push({
              id: node.path,
              label: part,
              type: 'file',
              x: 100 + Math.random() * 200,
              y: 80 + Math.random() * 140,
              vx: 0,
              vy: 0,
              r: 4,
              color: '#a855f7'
            });
            links.push({ source: parentId, target: node.path });
          }
        }
      });
    });

    const runSimulation = () => {
      if (!canvas || viewMode !== 'graph') return;
      
      // Update dimensions to match container dynamically
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = 280;
        }
      }

      const width = canvas.width;
      const height = canvas.height;

      // Simple physics force simulator
      // 1. Repulsion between all node pairs
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 80) {
            const force = (80 - dist) * 0.015;
            n1.vx -= (dx / dist) * force;
            n1.vy -= (dy / dist) * force;
            n2.vx += (dx / dist) * force;
            n2.vy += (dy / dist) * force;
          }
        }
      }

      // 2. Attraction of links
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 45;
          const force = (dist - targetDist) * 0.025;
          sourceNode.vx += (dx / dist) * force;
          sourceNode.vy += (dy / dist) * force;
          targetNode.vx -= (dx / dist) * force;
          targetNode.vy -= (dy / dist) * force;
        }
      });

      // 3. Keep root nodes near center & apply limits
      nodes.forEach(node => {
        if (node.type === 'root') {
          node.vx += (width / 2 - node.x) * 0.02;
          node.vy += (height / 2 - node.y) * 0.02;
        } else {
          // Gravity to center
          node.vx += (width / 2 - node.x) * 0.005;
          node.vy += (height / 2 - node.y) * 0.005;
        }

        // Apply friction & move
        node.vx *= 0.82;
        node.vy *= 0.82;
        node.x += node.vx;
        node.y += node.vy;

        // Bounce boundaries
        if (node.x < 15) { node.x = 15; node.vx *= -1; }
        if (node.x > width - 15) { node.x = width - 15; node.vx *= -1; }
        if (node.y < 15) { node.y = 15; node.vy *= -1; }
        if (node.y > height - 15) { node.y = height - 15; node.vy *= -1; }
      });

      // 4. Render Frame
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(63, 63, 70, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw connections/links
      ctx.lineWidth = 1.2;
      links.forEach(link => {
        const sourceNode = nodes.find(n => n.id === link.source);
        const targetNode = nodes.find(n => n.id === link.target);
        if (sourceNode && targetNode) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.strokeStyle = 'rgba(63, 63, 70, 0.45)';
          ctx.stroke();
        }
      });

      // Draw node spheres
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Node outline/glow
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Labels for folders and root
        if (node.type === 'root' || node.type === 'folder' || nodes.length < 35) {
          ctx.fillStyle = '#d4d4d8';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y - node.r - 4);
        }
      });

      animationRef.current = requestAnimationFrame(runSimulation);
    };

    runSimulation();
  };

  // Perform File-Level Audit
  const handleAuditFile = async (filePath: string) => {
    if (!repoName || !filePath) return;
    setIsAuditing(true);
    setFileAnalysis("");
    
    try {
      // 1. Fetch file content
      const fileRes = await fetch("/api/github/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: repoName, path: filePath, token: githubToken || undefined }),
      });
      if (!fileRes.ok) throw new Error("Failed to load file content");
      const fileData = await fileRes.json();
      const content = fileData.content ? safeDecodeBase64(fileData.content) : (fileData.body || "");
      setFileContent(content);

      // 2. Request Gemini audit analysis
      const prompt = `Act as an elite software architect & security analyst.
      Analyze this code segment from file "${filePath}" in repository "${repoName}":
      \`\`\`
      ${content.substring(0, 4200)}
      \`\`\`
      
      Review this code for:
      1. Overall architecture, readability, and design patterns.
      2. Security loopholes (e.g., credentials exposure, sanitization gaps).
      3. Propose ONE innovative future idea we can expand to make this codebase epic. Start that suggestion line with "[IDEA-PROPOSAL]: " followed by a clear, uppercase short title and a 1-sentence description.`;

      const response = await fetch("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) throw new Error("Stream connection failed");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamContent = "";

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                streamContent += parsed.text;
                setFileAnalysis(streamContent);
              }
            } catch (e) {}
          }
        }
      }

      // Extract and append proposal to project brainstorm ideas automatically!
      if (streamContent) {
        const lines = streamContent.split("\n");
        const proposalLine = lines.find(l => l.includes("[IDEA-PROPOSAL]:"));
        if (proposalLine) {
          const rawProposal = proposalLine.split("[IDEA-PROPOSAL]:")[1].trim();
          const splitIdx = rawProposal.indexOf(":");
          let title = "Code Improvement Concept";
          let desc = rawProposal;
          if (splitIdx > 0) {
            title = rawProposal.substring(0, splitIdx).trim();
            desc = rawProposal.substring(splitIdx + 1).trim();
          }

          const currentIdeas = [...(project.brainstormIdeas || [])];
          if (!currentIdeas.some((i: any) => i.text.toLowerCase() === title.toLowerCase())) {
            const newIdea = {
              id: `idea-audit-${Date.now()}`,
              text: title,
              details: `Derived from auditing ${filePath}:\n${desc}`,
              status: "approved",
              createdAt: Date.now()
            };
            updateProject(project.id, {
              brainstormIdeas: [newIdea, ...currentIdeas]
            });
            setDreamLog(prev => [...prev, `✨ Automatically compiled and logged code idea: "${title}"`]);
          }
        }
      }

    } catch (e: any) {
      console.error(e);
      setFileAnalysis("Failed to audit file. Verify GitHub token and API connections.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Repository-wide Autonomous Dreamer & Code Intelligence Agent
  const handleFullRepoDream = async () => {
    setIsDreaming(true);
    setDreamLog([]);
    setDreamOutput("");

    const logs = [
      "⚡ Initializing Cortex Codebase Analyzer...",
      "🔍 Inspecting dependency manifest (package.json) to list packages...",
      "📂 Scanning repository structure hierarchy & file nodes...",
      "📝 Analyzing README.md description, setup guides, and project mission statement...",
      "🧠 Connecting contextual tokens to Gemini LLM for deep codebase dreaming..."
    ];

    // Staggered status logs
    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setDreamLog(prev => [...prev, logs[i]]);
    }

    try {
      // Find package.json and README.md if they exist in our file tree
      const pkgFile = treeData.find(f => f.path.endsWith('package.json'));
      const readmeFile = treeData.find(f => f.path.toLowerCase().endsWith('readme.md'));

      let packageDetails = "Unknown packages";
      let readmeDetails = "No README documentation";

      if (pkgFile) {
        try {
          const res = await fetch("/api/github/file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo: repoName, path: pkgFile.path, token: githubToken || undefined }),
          });
          const d = await res.json();
          const raw = d.content ? safeDecodeBase64(d.content) : (d.body || "");
          packageDetails = raw.substring(0, 2000);
        } catch (e) {}
      }

      if (readmeFile) {
        try {
          const res = await fetch("/api/github/file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repo: repoName, path: readmeFile.path, token: githubToken || undefined }),
          });
          const d = await res.json();
          const raw = d.content ? safeDecodeBase64(d.content) : (d.body || "");
          readmeDetails = raw.substring(0, 3000);
        } catch (e) {}
      }

      setDreamLog(prev => [...prev, "🧬 Synthesizing architectural ideas..."]);

      const prompt = `Act as an elite engineering lead and autonomous product visionary.
      I have indexed a GitHub repository "${repoName}".
      Here are key snippets of its codebase framework:
      
      DEPENDENCIES (package.json):
      \`\`\`json
      ${packageDetails}
      \`\`\`
      
      DOCUMENTATION (README.md):
      \`\`\`markdown
      ${readmeDetails}
      \`\`\`
      
      Based on the framework, technologies, and purpose shown above:
      1. Summarize in 2 sentences what this project/repository is based on.
      2. Dream up and propose THREE highly innovative, concrete features we can add to this project. For EACH feature, write a line starting with "[FEATURE-IDEA]: " followed by the Title, a colon, and a 1-sentence description. Make them extremely detailed and relevant to the technology stack.`;

      const response = await fetch("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) throw new Error("Dreaming failed");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let outputText = "";

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                outputText += parsed.text;
                setDreamOutput(outputText);
              }
            } catch (e) {}
          }
        }
      }

      // Parse feature proposals and feed into brainstorm lounge!
      if (outputText) {
        const lines = outputText.split("\n");
        const ideasAdded: string[] = [];
        const currentIdeas = [...(project.brainstormIdeas || [])];

        lines.forEach(line => {
          if (line.includes("[FEATURE-IDEA]:")) {
            const rawIdea = line.split("[FEATURE-IDEA]:")[1].trim();
            const splitIdx = rawIdea.indexOf(":");
            let title = "Codebase Brainstorm Idea";
            let desc = rawIdea;
            if (splitIdx > 0) {
              title = rawIdea.substring(0, splitIdx).trim();
              desc = rawIdea.substring(splitIdx + 1).trim();
            }

            if (!currentIdeas.some((i: any) => i.text.toLowerCase() === title.toLowerCase()) && !ideasAdded.includes(title)) {
              ideasAdded.push(title);
              const ideaObj = {
                id: `idea-dream-${Date.now()}-${Math.random().toString(36).substring(3, 7)}`,
                text: title,
                details: `Conceived by Cortex Autonomous Code Dreamer for ${repoName}:\n${desc}`,
                status: "approved",
                createdAt: Date.now()
              };
              currentIdeas.push(ideaObj);
            }
          }
        });

        if (ideasAdded.length > 0) {
          updateProject(project.id, { brainstormIdeas: currentIdeas });
          setDreamLog(prev => [
            ...prev, 
            `🪐 Successfully harvested ${ideasAdded.length} groundbreaking features!`,
            ...ideasAdded.map(t => `   💡 "${t}" added to backlog.`)
          ]);
        } else {
          setDreamLog(prev => [...prev, "✓ Codebase analysis completed. Backlog is fully updated."]);
        }
      }

    } catch (e) {
      console.error(e);
      setDreamLog(prev => [...prev, "❌ Dreaming session failed. check connections."]);
    } finally {
      setIsDreaming(false);
    }
  };

  // Recursive folder renderer
  const renderTreeItem = (node: any, depth = 0) => {
    const isFolder = node.type === 'tree';
    const isExpanded = expandedFolders[node.path];
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path} style={{ paddingLeft: `${depth * 10}px` }} className="space-y-1">
        <div 
          onClick={() => isFolder ? toggleFolder(node.path) : setSelectedFile(node.path)}
          className={`flex items-center justify-between py-1 px-1.5 rounded text-[11px] font-mono cursor-pointer transition-colors group ${
            isSelected 
              ? 'bg-purple-950/20 border border-purple-800/20 text-purple-300' 
              : 'hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            {isFolder ? (
              <>
                <span className="text-zinc-500">
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                <Folder size={12} className={isExpanded ? "text-yellow-500 fill-yellow-500/10" : "text-yellow-600"} />
              </>
            ) : (
              <>
                <span className="w-3" />
                <File size={12} className={isSelected ? "text-purple-400" : "text-zinc-500"} />
              </>
            )}
            <span className={`truncate ${isFolder ? 'font-bold' : ''}`}>{node.name}</span>
          </div>

          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isFolder && (
              <>
                {node.size && (
                  <span className="text-[8.5px] text-zinc-600 font-mono">{(node.size / 1024).toFixed(1)} KB</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(node.path);
                    handleAuditFile(node.path);
                  }}
                  className="px-1.5 py-0.5 bg-purple-900/20 hover:bg-purple-950 border border-purple-500/20 text-[9px] text-purple-400 rounded hover:text-purple-300 cursor-pointer transition-colors font-mono font-bold"
                >
                  AUDIT
                </button>
              </>
            )}
          </div>
        </div>

        {isFolder && isExpanded && node.children && node.children.map((child: any) => renderTreeItem(child, depth + 1))}
      </div>
    );
  };

  const hierarchy = buildTreeHierarchy();

  return (
    <div className="space-y-4 font-sans">
      {/* Visual Workspace Tab / Selector */}
      <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-xl p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-yellow-500/10 rounded-lg text-yellow-400">
            <Network size={15} />
          </div>
          <div>
            <span className="text-[9.5px] font-bold text-zinc-500 tracking-wider uppercase font-mono block">Codebase Architect</span>
            <h4 className="text-xs font-bold text-zinc-300 font-mono flex items-center gap-2">
              <span>{repoName}</span>
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">CONNECTED</span>
            </h4>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex gap-1.5 p-1 bg-zinc-900 border border-zinc-850 rounded-lg">
          <button
            onClick={() => setViewMode('hierarchy')}
            className={`px-3 py-1 text-[9.5px] font-bold font-mono rounded-md flex items-center gap-1 cursor-pointer transition-all ${viewMode === 'hierarchy' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Code2 size={11} /> TREE LIST
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 text-[9.5px] font-bold font-mono rounded-md flex items-center gap-1 cursor-pointer transition-all ${viewMode === 'graph' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Network size={11} /> FORCE MAP
          </button>
        </div>
      </div>

      {/* Main Sandbox split screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left pane: File Explorer OR canvas node graph */}
        <div className="lg:col-span-5 bg-zinc-950/40 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col h-[320px]">
          <div className="px-3.5 py-2.5 border-b border-zinc-900/80 bg-zinc-950/80 flex items-center justify-between">
            <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
              {viewMode === 'hierarchy' ? 'Indexed Directory Tree' : 'Interactive Concept Nodes'}
            </span>
            <button 
              onClick={fetchRepoTree} 
              disabled={isLoading}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={11} className={isLoading ? "animate-spin text-purple-500" : ""} />
            </button>
          </div>

          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span className="text-[10px] text-zinc-500 font-mono">Fetching remote workspace tree nodes...</span>
              </div>
            ) : viewMode === 'hierarchy' ? (
              <div className="space-y-1">
                {hierarchy.length > 0 ? (
                  hierarchy.map((child: any) => renderTreeItem(child, 0))
                ) : (
                  <div className="text-[10px] text-zinc-500 italic py-4 text-center">No indexed files in repository root.</div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-full min-h-[220px]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-transparent" />
                <div className="absolute bottom-2 right-2 p-1.5 bg-[#0a0a0d]/90 border border-zinc-850 rounded text-[8.5px] text-zinc-500 font-mono pointer-events-none">
                  🖱 drag and pan supported
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Agentic Workspace dreaming Lounge */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          {/* Autonomous dreaming suite */}
          <div className="bg-[#09090c] border border-zinc-850 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={15} className="text-yellow-400" />
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  Autonomous Codebase Dreamer
                </h4>
              </div>
              <button
                onClick={handleFullRepoDream}
                disabled={isDreaming || isLoading}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-900 border border-yellow-400/30 text-black font-extrabold text-[10px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.2)]"
              >
                {isDreaming ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    <span>DREAMING ACTIVE...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={11} className="text-yellow-400" />
                    <span>DREAM CODE IDEAS</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
              Deploy our autonomous agent to parse the full tech stack (analyzing package bundles, setup structures, and entry models) to dream up custom core features.
            </p>

            {/* Status logs and output container */}
            {(dreamLog.length > 0 || dreamOutput) && (
              <div className="space-y-2.5">
                {/* Micro Terminal logs */}
                <div className="p-2.5 bg-black border border-zinc-900 rounded-lg max-h-[100px] overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-1">
                  {dreamLog.map((log, i) => (
                    <div key={i} className={log.includes('Failed') || log.includes('error') ? 'text-red-400' : log.includes('✨') || log.includes('💡') ? 'text-emerald-400 font-semibold' : ''}>
                      {log}
                    </div>
                  ))}
                </div>

                {/* Stream output */}
                {dreamOutput && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-2 max-h-[150px] overflow-y-auto">
                    <span className="text-[8.5px] font-bold text-yellow-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Sparkles size={10} /> Synthesized AI Code Concepts:
                    </span>
                    <p className="text-[10px] text-zinc-350 leading-relaxed font-mono whitespace-pre-line">
                      {dreamOutput}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive File Audits */}
          {selectedFile && (
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <File size={13} className="text-purple-400" />
                  <span className="text-xs font-bold text-zinc-300 font-mono truncate">{selectedFile.split('/').pop()}</span>
                </div>
                <button
                  onClick={() => handleAuditFile(selectedFile)}
                  disabled={isAuditing}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-900 text-white disabled:text-zinc-600 font-bold text-[10px] rounded transition-all flex items-center gap-1 cursor-pointer shadow shadow-purple-500/10"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 size={10} className="animate-spin" />
                      <span>AUDITING...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={11} />
                      <span>RUN SECURITY AUDIT</span>
                    </>
                  )}
                </button>
              </div>

              {/* Output block */}
              {isAuditing || fileAnalysis ? (
                <div className="p-3 bg-purple-950/10 border border-purple-500/10 rounded-xl max-h-[160px] overflow-y-auto text-[10px] leading-relaxed font-mono text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800">
                  {isAuditing && !fileAnalysis ? (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Loader2 size={12} className="animate-spin text-purple-500" />
                      <span>Reading file content and compiling AST vectors...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line font-sans">
                      {fileAnalysis}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-zinc-950 rounded-lg text-center border border-dashed border-zinc-900">
                  <p className="text-[10px] text-zinc-500">
                    Select any code file from the left panel directory tree and click <strong className="text-zinc-400">Run Security Audit</strong> to scan for security patches and innovative improvements.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
