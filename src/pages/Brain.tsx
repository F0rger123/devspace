import { Bot, Network, Workflow, Zap, MemoryStick, Database, Sparkles, Loader2, GitPullRequest, X, FileText, ChevronRight, ChevronDown, Folder, File, LayoutGrid, ListTree, FolderGit2, Mic, Volume2, Cpu, Clock, Trash2, Play, Check, AlertTriangle, Filter, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { FlowGraph } from '../components/ui/FlowGraph';
import { MemoryCortex } from '../components/MemoryCortex';
import { DreamLogView } from '../components/DreamLogView';
import { useData } from '../context/DataProvider';

const FileTreeItem = ({ item, level = 0, onNodeClick, activePath }: { item: any; level?: number; onNodeClick: (node: any) => void, activePath: string | null }) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const isDir = item.type === 'dir';
  const isActive = activePath === item.path;

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-1.5 py-1.5 hover:bg-zinc-800/50 cursor-pointer text-[11px] rounded-md mx-1 transition-colors ${
          isActive ? 'bg-zinc-800 text-zinc-100' : isDir ? 'text-zinc-300' : 'text-zinc-400'
        }`}
        style={{ paddingLeft: `${level * 12 + 6}px`, paddingRight: '8px' }}
        onClick={() => {
          if (isDir) setIsOpen(!isOpen);
          else onNodeClick({ id: item.path, name: item.name });
        }}
      >
        {isDir ? (
           isOpen ? <ChevronDown size={14} className="text-zinc-500 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 shrink-0" />
        ) : (
           <span className="w-[14px] shrink-0"></span>
        )}
        {isDir ? (
           <Folder size={14} className="text-yellow-500/90 shrink-0 filter drop-shadow-[0_0_2px_rgba(234,179,8,0.25)]" />
        ) : (
           <File size={14} className="text-zinc-500 shrink-0" />
        )}
        <span className="truncate">{item.name}</span>
      </div>
      {isDir && isOpen && item.children && (
        <div className="mt-0.5">
          {item.children.map((child: any) => (
            <FileTreeItem key={child.path} item={child} level={level + 1} onNodeClick={onNodeClick} activePath={activePath} />
          ))}
        </div>
      )}
    </div>
  );
};

export function Brain() {
  const { projects, issues, phases, aiContextRules, setAiContextRules, githubRepo, githubToken, activeProjectId, setActiveProjectId, cortexSynapses, setCortexSynapses, startProjectDreaming, addIssue, updateProject } = useData();
  const location = useLocation();
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [repo, setRepo] = useState(() => githubRepo || 'google/genai-js');
  const [viewMode, setViewMode] = useState<'both' | 'graph'>('both');
  const [graphType, setGraphType] = useState<'github' | 'project' | 'memory' | 'dreams'>(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && ['github', 'project', 'memory', 'dreams'].includes(tab)) {
      return tab as any;
    }
    return 'project';
  });

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab && ['github', 'project', 'memory', 'dreams'].includes(tab)) {
      setGraphType(tab as any);
    }
  }, [location.search]);

  const [graphDirection, setGraphDirection] = useState<'TB' | 'LR'>('TB');
  const [graphSpacing, setGraphSpacing] = useState<'compact' | 'normal' | 'relaxed'>('normal');
  
  const [selectedFile, setSelectedFile] = useState<{name: string, content: string, path: string} | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    if (next) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [isFullscreen]);

  // Obsidian Brain and Speech Memory States
  const [memoryVoiceActive, setMemoryVoiceActive] = useState(false);
  const [memoryAssistantSpeaking, setMemoryAssistantSpeaking] = useState(false);
  const [selectedHighlightMemory, setSelectedHighlightMemory] = useState<string | null>("AI Core Synapse");
  const [vocalLogs, setVocalLogs] = useState<{ sender: 'user' | 'assistant', text: string }[]>([
     { sender: 'assistant', text: "Ready! Tell me your guidelines or describe your tech preferences to update my memory." }
  ]);

  const handleVocalSync = () => {
    if (memoryVoiceActive) {
      if ((window as any).brainSpeechRecognitionRef) {
        (window as any).brainSpeechRecognitionRef.stop();
      }
      setMemoryVoiceActive(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
          setMemoryVoiceActive(true);
        };
        
        recognition.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setVocalLogs(prev => [...prev, { sender: 'user', text: transcript }]);
            
            // Append transcribed guideline to aiContextRules
            setAiContextRules(prev => {
                const base = prev ? prev.trim() : '';
                return base + `\n- Guideline (Voice Input): ${transcript}`;
            });

            // Call server side Gemini to synthesize oral confirmation and speak it back
            try {
               const response = await fetch('/api/gemini/stream', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                     messages: [
                        { role: 'user', content: `The user just voiced this preference/memory rule: "${transcript}". Please provide a single-sentence confirmation acknowledging that you have registered this rule into workspace memories (keep it concise, tech-focused, conversational, and under 20 words).` }
                     ]
                  })
               });
               
               if (response.ok) {
                  const reader = response.body?.getReader();
                  const decoder = new TextDecoder();
                  let aiText = '';
                  
                  if (reader) {
                     while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                           if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                              try {
                                 const parsed = JSON.parse(line.slice(6));
                                 if (parsed.text) aiText += parsed.text;
                              } catch(e) {}
                           }
                        }
                     }
                  }
                  
                  if (aiText) {
                     setVocalLogs(prev => [...prev, { sender: 'assistant', text: aiText }]);
                     speakBrainResponse(aiText);
                  }
               }
            } catch (err) {
               const fallbackText = "Cortex updated. Synchronized custom layout rule into project constraints.";
               setVocalLogs(prev => [...prev, { sender: 'assistant', text: fallbackText }]);
               speakBrainResponse(fallbackText);
            }
          }
        };
        
        recognition.onerror = () => {
          setMemoryVoiceActive(false);
        };
        
        recognition.onend = () => {
          setMemoryVoiceActive(false);
        };
        
        (window as any).brainSpeechRecognitionRef = recognition;
        recognition.start();
      } else {
        alert("Web speech recognition is not supported on this browser.");
      }
    }
  };

  const speakBrainResponse = (text: string) => {
     if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setMemoryAssistantSpeaking(true);
        utterance.onend = () => setMemoryAssistantSpeaking(false);
        utterance.onerror = () => setMemoryAssistantSpeaking(false);
        window.speechSynthesis.speak(utterance);
     }
  };

  useEffect(() => {
    const activeProj = projects.find(p => p.id === activeProjectId);
    if (activeProj && activeProj.githubRepos && activeProj.githubRepos.length > 0) {
      setRepo(activeProj.githubRepos[0]);
    } else if (githubRepo) {
      setRepo(githubRepo);
    }
  }, [activeProjectId, githubRepo, projects]);

  const handleNodeClick = async (node: any) => {
     if (!node || !node.id) return;
     if (node.type === 'dir' || node.type === 'project' || node.type === 'phase') return;

     setLoadingFile(true);
     setSelectedFile({ name: node.name || node.id, content: '', path: node.id });
     try {
        const resFs = await fetch('/api/workspace-fs/read-file', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ filePath: node.id })
        });
        if (resFs.ok) {
           const dataFs = await resFs.json();
           if (dataFs.content !== undefined) {
              setSelectedFile({ name: node.name || node.id.split('/').pop(), content: dataFs.content, path: node.id });
              setLoadingFile(false);
              return;
           }
        }

        const res = await fetch('/api/github/file', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ repo, path: node.id, token: githubToken })
        });
        if (res.ok) {
           const contentType = res.headers.get("content-type");
           if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              if (data.name && data.content !== undefined) {
                 setSelectedFile({ name: data.name, content: data.content, path: node.id });
                 setLoadingFile(false);
                 return;
              }
           }
        }
        setSelectedFile({ name: node.name || node.id, content: `// File non-textual or not accessible: ${node.id}`, path: node.id });
     } catch (e: any) {
        console.error("Failed to read file in Project Brain:", e);
        setSelectedFile({ name: node.name || node.id, content: `// Error loading file: ${e.message || e}`, path: node.id });
     }
     setLoadingFile(false);
  };

  const fetchTree = async () => {
    setLoading(true);
    setNodes([]);
    setLinks([]);
    setFileTree([]);

    const activeProj = projects.find(p => p.id === activeProjectId) || projects[0];

    if (graphType === 'project') {
      try {
        const res = await fetch('/api/workspace-fs/list-files');
        if (res.ok) {
          const data = await res.json();
          if (data && data.files) {
            const filesList: string[] = data.files;
            
            const treeRoot = { 
              name: activeProj ? activeProj.name : 'Local Landscape', 
              type: 'dir', 
              path: 'root', 
              children: [] as any[] 
            };
            
            const foldersMap = new Map<string, any>();
            foldersMap.set('root', treeRoot);
            
            const newNodes: any[] = [{ id: 'root', name: activeProj ? activeProj.name : 'Local Landscape', type: 'dir' }];
            const newLinks: any[] = [];
            const pathMap = new Set(['root']);

            filesList.forEach((filePath: string) => {
              const parts = filePath.split('/');
              let currentPath = '';
              for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isLast = i === parts.length - 1;
                const pathSoFar = currentPath ? `${currentPath}/${part}` : part;
                
                if (!pathMap.has(pathSoFar)) {
                  pathMap.add(pathSoFar);
                  
                  const isDir = !isLast;
                  newNodes.push({
                    id: pathSoFar,
                    name: part,
                    type: isDir ? 'dir' : 'file'
                  });

                  const parentPath = currentPath || 'root';
                  newLinks.push({ source: parentPath, target: pathSoFar });

                  const treeNode = {
                    name: part,
                    type: isDir ? 'dir' : 'file',
                    path: pathSoFar,
                    children: isDir ? [] : undefined
                  };

                  if (isDir) {
                    foldersMap.set(pathSoFar, treeNode);
                  }

                  const parentNode = foldersMap.get(parentPath);
                  if (parentNode) {
                    if (!parentNode.children.some((c: any) => c.path === pathSoFar)) {
                      parentNode.children.push(treeNode);
                    }
                  }
                }
                currentPath = pathSoFar;
              }
            });

            if (activeProj) {
              const projPhases = phases.filter(ph => ph.projectId === activeProj.id);
              projPhases.forEach(ph => {
                newNodes.push({ id: `phase-${ph.id}`, name: `Phase: ${ph.name}`, type: 'phase' });
                newLinks.push({ source: 'root', target: `phase-${ph.id}` });
              });

              const projIssues = issues.filter(i => i.projectId === activeProj.id);
              projIssues.forEach(i => {
                newNodes.push({ id: `issue-${i.id}`, name: `Task: ${i.title}`, type: 'issue' });
                if (i.phaseId) {
                  newLinks.push({ source: `phase-${i.phaseId}`, target: `issue-${i.id}` });
                } else {
                  newLinks.push({ source: 'root', target: `issue-${i.id}` });
                }
              });
            }

            const sortTree = (node: any) => {
              if (node.children) {
                node.children.sort((a: any, b: any) => {
                  if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                  return a.name.localeCompare(b.name);
                });
                node.children.forEach(sortTree);
              }
            };
            sortTree(treeRoot);

            setNodes(newNodes);
            setLinks(newLinks);
            setFileTree([treeRoot]);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch workspace files for project brain:', err);
      }
    }

    try {
      const res = await fetch('/api/github/tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, token: githubToken })
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.tree) {
          const newNodes: any[] = [];
          const newLinks: any[] = [];
          const treeRoot = { name: repo, type: 'dir', path: 'root', children: [] as any[] };
          const foldersMap = new Map<string, any>();
          foldersMap.set('root', treeRoot);
          
          newNodes.push({ id: 'root', name: repo, type: 'dir' });
          
          const pathMap = new Set(['root']);

          data.tree.forEach((item: any) => {
            const parts = item.path.split('/');
            const name = parts[parts.length - 1];
            const isDir = item.type === 'tree';
            
            newNodes.push({
              id: item.path,
              name: name,
              type: isDir ? 'dir' : 'file',
              size: item.size
            });
            pathMap.add(item.path);

            const treeNode = {
               name,
               type: isDir ? 'dir' : 'file',
               path: item.path,
               children: isDir ? [] : undefined
            };

            if (isDir) {
               foldersMap.set(item.path, treeNode);
            }

            if (parts.length === 1) {
               newLinks.push({ source: 'root', target: item.path });
               treeRoot.children.push(treeNode);
            } else {
               const parentPath = parts.slice(0, -1).join('/');
               
               if (pathMap.has(parentPath)) {
                  newLinks.push({ source: parentPath, target: item.path });
               } else {
                  newLinks.push({ source: 'root', target: item.path });
               }

               const parentNode = foldersMap.get(parentPath);
               if (parentNode) {
                  parentNode.children.push(treeNode);
               } else {
                  treeRoot.children.push(treeNode);
               }
            }
          });
          
          const sortTree = (node: any) => {
             if (node.children) {
                node.children.sort((a: any, b: any) => {
                   if (a.type !== b.type) {
                      return a.type === 'dir' ? -1 : 1;
                   }
                   return a.name.localeCompare(b.name);
                });
                node.children.forEach(sortTree);
             }
          };
          sortTree(treeRoot);

          setNodes(newNodes);
          setLinks(newLinks);
          setFileTree([treeRoot]);
        }
      }
    } catch (e: any) {
      if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
        console.debug('Failed to fetch tree (network/offline):', e.message);
      } else {
        console.error('Failed to fetch tree:', e);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTree();
  }, [graphType, activeProjectId, projects, repo]);

  return (
    <div className="flex flex-col h-full overflow-y-auto lg:overflow-hidden pb-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-light tracking-wide text-zinc-100 flex items-center gap-2">
            Project <span className="font-semibold italic text-yellow-500">Brain</span> <Bot size={18} className="text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.35)]" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Visualizing semantic relationships, architecture, and memory.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {graphType === 'project' && projects.length > 0 && (
            <div className="flex items-center bg-[#121214] border border-zinc-800 rounded-md py-1 px-2.5">
              <span className="text-[11px] text-zinc-500 font-medium mr-2">Project:</span>
              <select
                value={activeProjectId || projects[0]?.id || ''}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="bg-transparent border-none text-xs text-yellow-400 font-semibold focus:ring-0 outline-none cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#121214] text-zinc-200">{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-wrap bg-[#121214] rounded-md p-1 border border-zinc-800 gap-1">
             <button 
                onClick={() => setGraphType('project')}
                className={`py-1.5 px-3 text-xs rounded-sm transition-colors ${graphType === 'project' ? 'bg-zinc-800 text-zinc-100 flex items-center gap-1.5' : 'text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5'}`}
             >
                <Workflow size={14} /> Local Landscape
             </button>
             <button 
                onClick={() => setGraphType('github')}
                className={`py-1.5 px-3 text-xs rounded-sm transition-colors ${graphType === 'github' ? 'bg-zinc-800 text-zinc-100 flex items-center gap-1.5' : 'text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5'}`}
             >
                <Bot size={14} /> GitHub Semantic
             </button>
             <button 
                onClick={() => setGraphType('memory')}
                className={`py-1.5 px-3 text-xs rounded-sm transition-colors ${graphType === 'memory' ? 'bg-zinc-800 text-zinc-100 flex items-center gap-1.5' : 'text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5'}`}
             >
                <MemoryStick size={14} /> Assistant Memory Store
             </button>
             <button 
                onClick={() => setGraphType('dreams')}
                className={`py-1.5 px-3 text-xs rounded-sm transition-colors ${graphType === 'dreams' ? 'bg-zinc-800 text-yellow-400 font-semibold flex items-center gap-1.5' : 'text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5'}`}
             >
                <Sparkles size={14} className="text-yellow-500" /> Dream Log
             </button>
          </div>
          {graphType !== 'memory' && graphType !== 'dreams' && (
            <>
               <div className="h-4 w-px bg-zinc-800 mx-1 shrink-0"></div>
               <div className="flex bg-[#121214] rounded-md p-1 border border-zinc-800 gap-1 shrink-0">
                  <button 
                     onClick={() => setGraphDirection(prev => prev === 'TB' ? 'LR' : 'TB')}
                     className="py-1 px-1.5 text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-750 font-mono transition flex items-center gap-1 shrink-0"
                     title="Toggle Layout (TB vs LR)"
                  >
                     <Workflow size={11} className={graphDirection === 'LR' ? 'rotate-90 text-yellow-500' : 'text-yellow-400'} />
                     <span>{graphDirection === 'TB' ? 'Vertical' : 'Horizontal'}</span>
                  </button>
                  <button 
                     onClick={() => setGraphSpacing(prev => prev === 'compact' ? 'normal' : prev === 'normal' ? 'relaxed' : 'compact')}
                     className="py-1 px-1.5 text-[10px] bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded border border-zinc-750 font-mono transition flex items-center gap-1 shrink-0"
                     title="Cycle Spacing Compactness"
                  >
                     <LayoutGrid size={11} className="text-pink-400 shrink-0" />
                     <span className="capitalize">{graphSpacing}</span>
                  </button>
               </div>
            </>
          )}
          {graphType === 'github' && (
            <>
              <div className="h-4 w-px bg-zinc-800 mx-1"></div>
              <div className="flex bg-[#121214] rounded-md p-1 border border-zinc-800">
                 <button 
                    onClick={() => setViewMode('both')}
                    className={`p-1.5 rounded-sm transition-colors ${viewMode === 'both' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                     title="Explorer & Graph"
                  >
                     <LayoutGrid size={14} />
                  </button>
                  <button 
                     onClick={() => setViewMode('graph')}
                     className={`p-1.5 rounded-sm transition-colors ${viewMode === 'graph' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                     title="Graph Only"
                  >
                     <Network size={14} />
                  </button>
               </div>
               <div className="flex items-center bg-[#121214] border border-zinc-800 rounded-md">
                 <span className="text-zinc-500 pl-3 text-xs">Repo:</span>
                 <input 
                   type="text" 
                   value={repo}
                   onChange={(e) => setRepo(e.target.value)}
                   onBlur={fetchTree}
                   onKeyDown={(e) => e.key === 'Enter' && fetchTree()}
                   className="bg-transparent border-none text-xs text-zinc-200 py-1.5 px-2 focus:ring-0 w-36 outline-none" 
                 />
               </div>
               <button 
                 onClick={fetchTree}
                 disabled={loading}
                 className="px-3 py-1.5 text-[11px] font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md transition-colors border border-zinc-800 flex items-center gap-1.5"
               >
                 {loading ? <Loader2 size={12} className="animate-spin" /> : <GitPullRequest size={12} />} Re-index
               </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden">
        {viewMode === 'both' && graphType === 'github' && (
          <div className="w-full lg:w-64 h-48 lg:h-auto rounded-xl flex flex-col flex-shrink-0 overflow-hidden relative glass-card">
            <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-[#09090b]/40">
              <ListTree size={14} className="text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-200">Explorer</h3>
            </div>
            <div className="flex-1 overflow-y-auto py-2 pr-1 custom-scrollbar">
              {loading && fileTree.length === 0 ? (
                <div className="flex justify-center p-4">
                   <Loader2 size={16} className="animate-spin text-zinc-500" />
                </div>
              ) : fileTree.length > 0 ? (
                fileTree.map(rootItem => (
                  <FileTreeItem 
                    key={rootItem.path} 
                    item={rootItem} 
                    onNodeClick={handleNodeClick} 
                    activePath={selectedFile?.path || null}
                  />
                ))
              ) : null}
            </div>
          </div>
        )}

        {/* SW SYNAPSTICS ROUTE MARKER */}
        <div className={`rounded-xl relative overflow-hidden flex items-center justify-center transition-all duration-300 glass-card ${
          isFullscreen 
            ? 'fixed inset-0 z-50 p-4 m-0 rounded-none bg-[#0c0c0f]' 
            : 'w-full min-h-[600px] h-full lg:flex-1'
        }`}>
          {/* Fullscreen control button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-3 right-3 z-30 p-1.5 bg-zinc-950/80 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 shadow-lg transition-all flex items-center gap-1.5 text-[11px] font-medium"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Graph"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>

          {graphType === 'dreams' ? (
             <DreamLogView 
                projects={projects as any}
                issues={issues}
                addIssue={addIssue}
                updateProject={updateProject}
                startProjectDreaming={startProjectDreaming}
                cortexSynapses={cortexSynapses}
                setCortexSynapses={setCortexSynapses}
             />
          ) : graphType === 'memory' ? (
             <MemoryCortex 
                aiContextRules={aiContextRules}
                setAiContextRules={setAiContextRules}
                repo={repo}
                projects={projects as any}
                selectedHighlightMemory={selectedHighlightMemory}
                setSelectedHighlightMemory={setSelectedHighlightMemory}
                memoryVoiceActive={memoryVoiceActive}
                memoryAssistantSpeaking={memoryAssistantSpeaking}
                handleVocalSync={handleVocalSync}
                vocalLogs={vocalLogs}
                 cortexSynapses={cortexSynapses}
                 setCortexSynapses={setCortexSynapses}
             />
          ) : false ? (
             <div className="absolute inset-0 flex flex-col md:flex-row p-6 gap-6 overflow-hidden bg-[#09090b]/40">
                {/* Left Card: Memory Text Editor */}
                <div className="flex-1 flex flex-col border border-zinc-800/80 bg-[#121214] rounded-xl p-4 overflow-hidden min-h-0">
                   <div className="flex items-center justify-between mb-3 shrink-0">
                      <div className="flex items-center gap-2">
                         <MemoryStick size={16} className="text-yellow-400" />
                         <span className="text-xs font-semibold text-zinc-200">Active Persona & Context Blocks</span>
                      </div>
                      <span className="text-[10px] text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded flex items-center gap-1.5 font-mono">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                         Read/Write Engine
                      </span>
                   </div>
                   <textarea
                      value={aiContextRules}
                      onChange={(e) => setAiContextRules(e.target.value)}
                      className="flex-1 w-full bg-[#09090b]/80 border border-zinc-800 rounded-lg p-4 text-[12px] text-emerald-400 font-mono outline-none focus:border-yellow-500/40 resize-none leading-relaxed custom-scrollbar"
                      placeholder={`<role>\nYou are a Senior AI Assistant.\n</role>\n\n<tech-stack>\n- Tailwind CSS\n- React with TypeScript\n</tech-stack>\n\nTell the assistant what to remember about you, your tech stack preferences, and coding guidelines...`}
                   />
                   <div className="mt-3 text-[10px] text-zinc-500 shrink-0 leading-relaxed">
                      Changes here are saved directly to the workspace memory and used for all future contextual requests.
                   </div>
                </div>

                {/* Right Card: Quick Actions & Log */}
                <div className="w-full md:w-80 shrink-0 flex flex-col gap-4 overflow-y-auto">
                   {/* Quick Tags */}
                   <div className="border border-zinc-800 bg-[#121214] rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-1.5"><Sparkles size={14} className="text-yellow-400" /> Quick Memory Inlays</h4>
                      <div className="flex flex-wrap gap-1.5">
                         {[
                            { label: "Prefer TypeScript", rule: "Developer prefers strict static TypeScript type-safety across all files." },
                            { label: "Mobile First Design", rule: "Always enforce fluid mobile-first responsive views using Tailwind." },
                            { label: "Clean Tailwind Logic", rule: "Focus strictly on inline Tailwind utility patterns instead of custom CSS stylesheets." },
                            { label: "No Explanatory Comments", rule: "Omit highly verbose boilerplate comments on simple functions unless requested." },
                            { label: "Full-Stack Express Flow", rule: "Assume full-stack Node.js and Express architecture proxies for API tokens." }
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
                                   className={`text-[10px] font-medium px-2 py-1 rounded border transition-all ${
                                      isAdded 
                                        ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/25' 
                                        : 'bg-zinc-800/50 border-zinc-700/80 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                                   }`}
                                >
                                   {isAdded ? '✓ ' : '+ '} {inlay.label}
                                </button>
                             );
                         })}
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-end">
                         <button 
                            onClick={() => setAiContextRules('')}
                            className="text-[9px] text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-wider font-semibold"
                         >
                            Clear Memory Store
                         </button>
                      </div>
                   </div>

                   {/* Active Synaptic Nodes Visualizer */}
                   <div className="border border-zinc-800 bg-[#121214] rounded-xl p-4 flex-1 flex flex-col min-h-[200px]">
                      <h4 className="text-xs font-semibold text-zinc-200 mb-3 flex items-center gap-1.5 shrink-0"><Database size={14} className="text-purple-400" /> Synaptic Activity Logs</h4>
                      <div className="space-y-3 overflow-y-auto flex-1 text-[10px] pr-1 custom-scrollbar">
                         {[
                            { task: "Registered Custom Developer Persona", active: aiContextRules.trim().length > 0, extra: "Custom role-play is fully active" },
                            { task: "Loaded Firebase Auth Blueprints", active: true, extra: "Rules schema cached locally" },
                            { task: "Indexed Linked GitHub Vectors", active: !!repo, extra: `Indexing mapped on: ${repo}` },
                            { task: "Active Workspaces Topology Linked", active: projects.length > 0, extra: `Registered ${projects.length} workspace modules` }
                         ].map((node, idx) => (
                            <div key={idx} className="flex gap-2.5 items-start p-2 rounded bg-[#09090b]/50 border border-zinc-800/40 hover:border-zinc-800 transition-colors">
                               <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${node.active ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-zinc-600'}`}></span>
                               <div>
                                  <div className="font-semibold text-zinc-300 leading-tight">{node.task}</div>
                                  <div className="text-[9px] text-zinc-500 mt-0.5">{node.active ? node.extra : "No active context rules detected"}</div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          ) : (
             <>
               {loading && nodes.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-3 z-10">
                     <Loader2 size={32} className="animate-spin opacity-50" />
                     <span className="text-xs font-mono">Parsing semantic vectors...</span>
                  </div>
               ) : nodes.length > 0 ? (
                  <FlowGraph 
                     nodes={nodes} 
                     links={links} 
                     onNodeClick={handleNodeClick} 
                     direction={graphDirection} 
                     spacing={graphSpacing} 
                  />
               ) : (
                  <div className="text-zinc-500 text-xs">No graph data.</div>
               )}

               <div className="absolute bottom-4 left-4 p-3 rounded-lg max-w-sm pointer-events-none glass-card">
                  <h3 className="text-xs font-semibold text-zinc-200 mb-1 flex items-center gap-2"><Sparkles size={12} className="text-blue-400"/> System Architecture</h3>
                  <p className="text-[10px] text-zinc-400 leading-relaxed max-h-24 overflow-hidden text-ellipsis mb-2">
                    {graphType === 'project' 
                      ? `DevSpace OS uses a dynamic force-directed tree to visualize workspace architectures. Currently indexing local system nodes (${projects.length} projects, ${phases.length} phases, ${issues.length} issues).`
                      : `DevSpace OS uses a dynamic force-directed tree to visualize workspace architectures. Currently indexing GitHub semantic vectors (${nodes.length} nodes and ${links.length} relationships mapped via GitHub API).`
                    }
                  </p>
               </div>
             </>
          )}

          {/* File Viewer Panel */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div 
               initial={{ x: '100%', opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: '100%', opacity: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="absolute top-0 right-0 bottom-0 w-80 bg-[#121214]/95 backdrop-blur-xl border-l border-zinc-800 flex flex-col shadow-2xl z-20"
            >
               <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-200 text-xs font-semibold">
                     <FileText size={14} className="text-zinc-400" />
                     <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800/80">
                     <X size={14} />
                  </button>
               </div>
               <div className="flex-1 overflow-auto p-3 text-[10px] text-zinc-300 font-mono leading-relaxed bg-[#09090b] m-2 rounded-lg border border-zinc-800/50">
                  {loadingFile ? (
                     <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-70">
                        <Loader2 size={16} className="animate-spin mb-2" />
                        Fetching source...
                     </div>
                  ) : (
                     <pre className="overflow-x-auto whitespace-pre-wrap word-break-all">
                       {selectedFile.content ? selectedFile.content : <span className="text-zinc-600 italic">Empty file or unsupported format.</span>}
                     </pre>
                  )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
}
