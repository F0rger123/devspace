import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCode,
  Folder,
  Plus,
  Trash2,
  Save,
  Copy,
  Download,
  Search,
  Check,
  Code,
  RefreshCw,
  FileText,
  FileJson,
  FileSpreadsheet,
  Globe,
  Terminal,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Project } from '../../context/DataProvider';

interface ProjectCodeWorkspaceProps {
  project: Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  onOpenLiveSandbox?: () => void;
}

const DEFAULT_PROJECT_FILES: Record<string, string> = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DevSpace Application</title>
  </head>
  <body class="bg-zinc-950 text-zinc-100 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  'src/App.tsx': `import React, { useState } from 'react';
import { Sparkles, Terminal, Activity } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-[#0d0d10] text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#16161a] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
          <Sparkles size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">DevSpace Live Workspace</h1>
        <p className="text-xs text-zinc-400">
          Editable full-stack project workspace powered by Aether and Vite.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => setCount((c) => c + 1)}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Counter: {count}
          </button>
        </div>
      </div>
    </div>
  );
}`,
  'src/index.css': `@import "tailwindcss";

@layer base {
  body {
    background-color: #09090b;
    color: #f4f4f5;
  }
}`,
  'package.json': `{
  "name": "devspace-project",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.475.0",
    "motion": "^12.4.7",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.1"
  }
}`,
  'README.md': `# DevSpace Project

This is a reactive workspace initialized inside DevSpace.

## Features
- Full TypeScript & React 18
- Tailwind CSS styling
- Aether Autonomous Dreams integration
- Real-time file sync
`
};

export const ProjectCodeWorkspace: React.FC<ProjectCodeWorkspaceProps> = ({
  project,
  updateProject,
  onOpenLiveSandbox,
}) => {
  // Ensure virtual files exist
  const files: Record<string, string> = useMemo(() => {
    if (project.virtualFiles && Object.keys(project.virtualFiles).length > 0) {
      return project.virtualFiles;
    }
    return DEFAULT_PROJECT_FILES;
  }, [project.virtualFiles]);

  const fileKeys = useMemo(() => Object.keys(files).sort(), [files]);

  const [activeFile, setActiveFile] = useState<string>(() => {
    return fileKeys.includes('src/App.tsx') ? 'src/App.tsx' : fileKeys[0] || 'index.html';
  });

  const [code, setCode] = useState<string>(() => files[activeFile] || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');

  // Sync active file code when activeFile changes
  useEffect(() => {
    if (files[activeFile] !== undefined) {
      setCode(files[activeFile]);
      setHasUnsavedChanges(false);
    } else if (fileKeys.length > 0) {
      const fallback = fileKeys[0];
      setActiveFile(fallback);
      setCode(files[fallback]);
      setHasUnsavedChanges(false);
    }
  }, [activeFile, files, fileKeys]);

  // If project has no virtual files at all, seed them into the project
  useEffect(() => {
    if (!project.virtualFiles || Object.keys(project.virtualFiles).length === 0) {
      updateProject(project.id, { virtualFiles: DEFAULT_PROJECT_FILES });
    }
  }, [project.id, project.virtualFiles, updateProject]);

  const handleSave = () => {
    setSaveStatus('saving');
    const updated = {
      ...files,
      [activeFile]: code,
    };
    updateProject(project.id, { virtualFiles: updated });
    setTimeout(() => {
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 200);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim().replace(/^\/+/, '');
    const updated = {
      ...files,
      [cleanName]: `// New file: ${cleanName}\n`,
    };
    updateProject(project.id, { virtualFiles: updated });
    setActiveFile(cleanName);
    setCode(`// New file: ${cleanName}\n`);
    setNewFileName('');
    setShowNewFileModal(false);
  };

  const handleDeleteFile = (fileName: string) => {
    if (Object.keys(files).length <= 1) {
      alert('Cannot delete the last remaining file in the project.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      const updated = { ...files };
      delete updated[fileName];
      updateProject(project.id, { virtualFiles: updated });
      const remaining = Object.keys(updated);
      if (activeFile === fileName && remaining.length > 0) {
        setActiveFile(remaining[0]);
        setCode(updated[remaining[0]]);
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.split('/').pop() || 'file.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered files
  const filteredFiles = fileKeys.filter((f) =>
    f.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group files by directory
  const getFileIcon = (path: string) => {
    if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
      return <FileCode size={14} className="text-cyan-400 shrink-0" />;
    }
    if (path.endsWith('.html')) {
      return <Globe size={14} className="text-orange-400 shrink-0" />;
    }
    if (path.endsWith('.css')) {
      return <Code size={14} className="text-blue-400 shrink-0" />;
    }
    if (path.endsWith('.json')) {
      return <FileJson size={14} className="text-yellow-400 shrink-0" />;
    }
    if (path.endsWith('.md')) {
      return <FileText size={14} className="text-emerald-400 shrink-0" />;
    }
    return <FileCode size={14} className="text-zinc-400 shrink-0" />;
  };

  const lineCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[720px] max-h-[82vh] font-sans">
      {/* Top Action Header */}
      <div className="px-4 py-3 bg-zinc-950/90 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <Code size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
              <span>Project Codebase & Virtual Files</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                {fileKeys.length} Files
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
            }`}
          >
            <Save size={13} />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved! ✓' : hasUnsavedChanges ? 'Save Changes *' : 'Save'}
          </button>

          <button
            onClick={handleCopyCode}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Copy file content"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>

          <button
            onClick={handleDownloadFile}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Download file"
          >
            <Download size={13} />
          </button>

          {onOpenLiveSandbox && (
            <button
              onClick={onOpenLiveSandbox}
              className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Terminal size={13} /> Live Sandbox
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: File Explorer + Editor Area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <div className="w-64 bg-zinc-950/70 border-r border-zinc-800/80 flex flex-col shrink-0">
          {/* File Search & Add Bar */}
          <div className="p-2.5 border-b border-zinc-850 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-7 pr-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-yellow-500/40"
              />
            </div>
            <button
              onClick={() => setShowNewFileModal(true)}
              className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/25 rounded-md transition-colors cursor-pointer shrink-0"
              title="Add New File"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
            {filteredFiles.map((filePath) => {
              const isActive = activeFile === filePath;
              const fileName = filePath.split('/').pop() || filePath;
              const dirName = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';

              return (
                <div
                  key={filePath}
                  onClick={() => setActiveFile(filePath)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-yellow-500/15 text-yellow-300 font-bold border border-yellow-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getFileIcon(filePath)}
                    <div className="truncate">
                      <span>{fileName}</span>
                      {dirName && (
                        <span className="text-[9px] text-zinc-600 ml-1.5 font-normal">
                          ({dirName})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(filePath);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-zinc-500 transition-opacity rounded cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}

            {filteredFiles.length === 0 && (
              <div className="p-4 text-center text-xs text-zinc-600 italic">
                No matching files found.
              </div>
            )}
          </div>

          {/* Bottom Project Stats */}
          <div className="p-2.5 bg-zinc-950 border-t border-zinc-850 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
            <span>Framework: {project.frameworks?.[0] || 'React'}</span>
            <span>TypeScript</span>
          </div>
        </div>

        {/* Right Area: Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d0d10]">
          {/* Active File Tab Bar */}
          <div className="px-4 py-2 bg-zinc-950/60 border-b border-zinc-850 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-300">
              {getFileIcon(activeFile)}
              <span className="font-bold text-white">{activeFile}</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
              <span>{lineCount} lines</span>
              <span>{charCount} chars</span>
              <span className="text-emerald-400/80">UTF-8</span>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 relative flex overflow-hidden">
            {/* Line Numbers Gutter */}
            <div className="w-12 bg-zinc-950/80 border-r border-zinc-850/60 p-4 text-right font-mono text-xs text-zinc-600 select-none overflow-hidden shrink-0">
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i} className="leading-6">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setHasUnsavedChanges(true);
              }}
              onKeyDown={(e) => {
                // Support Cmd+S or Ctrl+S to save
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className="flex-1 bg-transparent p-4 text-xs font-mono text-zinc-200 outline-none resize-none leading-6 custom-scrollbar selection:bg-yellow-500/30 whitespace-pre"
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* New File Modal */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Plus size={16} className="text-yellow-400" /> Create Virtual File
            </h4>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">
                File Path (e.g. src/components/Header.tsx)
              </label>
              <input
                type="text"
                placeholder="src/utils/calculator.ts"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile();
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-yellow-500/50 font-mono"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowNewFileModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                disabled={!newFileName.trim()}
                className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCodeWorkspace;
