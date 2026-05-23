import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Terminal, FolderGit2, Bot, ArrowRight, X, LayoutDashboard, Map, CheckSquare, Github, FileText, Send, Zap } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';

const commands = [
  { id: '1', name: 'Dashboard', icon: LayoutDashboard, path: '/', shortcut: 'D' },
  { id: '2', name: 'Open Projects', icon: FolderGit2, path: '/projects', shortcut: 'P' },
  { id: '3', name: 'Open Project Brain', icon: Bot, path: '/brain', shortcut: 'B' },
  { id: '4', name: 'Issues & Tasks', icon: CheckSquare, path: '/issues', shortcut: 'I' },
  { id: '5', name: 'Roadmap', icon: Map, path: '/roadmap', shortcut: 'R' },
  { id: '6', name: 'GitHub Intelligence', icon: Github, path: '/github', shortcut: 'G' },
  { id: '7', name: 'Workspace Docs', icon: FileText, path: '/docs', shortcut: 'W' },
];

export function CommandPalette() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
     if (!isCommandPaletteOpen) {
        setQuery('');
        setExecuting(false);
     }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const isCommandMode = query.startsWith('>');
  const filteredCommands = !isCommandMode 
     ? commands.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
     : [];

  const handleExecute = () => {
     setExecuting(true);
     setTimeout(() => {
        setExecuting(false);
        setCommandPaletteOpen(false);
     }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh]">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black/60 backdrop-blur-sm"
           onClick={() => setCommandPaletteOpen(false)}
        />
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: -20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: -20 }}
           transition={{ duration: 0.15, ease: "easeOut" }}
           className="relative w-full max-w-xl bg-[#121214] border border-zinc-800 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        >
          <div className="flex items-center px-4 py-2.5 border-b border-zinc-800">
            {isCommandMode ? <Terminal size={16} className="text-amber-500 mr-3" /> : <Search size={16} className="text-zinc-500 mr-3" />}
            <input 
              autoFocus
              className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 focus:outline-none text-sm"
              placeholder="Type a command or use > for AI execution..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                 if (e.key === 'Enter' && isCommandMode && query.length > 1) {
                    handleExecute();
                 }
              }}
            />
            <button 
              onClick={() => setCommandPaletteOpen(false)}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 p-1 rounded ml-2 transition-colors border border-zinc-800"
            >
              <X size={12} />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-1.5">
            {isCommandMode ? (
               <div className="px-3 py-3">
                  <div className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                     <Zap size={10} /> AI Execution Mode
                  </div>
                  {query.length > 1 ? (
                     <button 
                       onClick={handleExecute}
                       disabled={executing}
                       className="w-full flex items-center justify-between px-3 py-3 bg-[#09090b] border border-zinc-800 rounded-lg hover:border-amber-500/50 hover:bg-[#18181b] transition-colors group text-left"
                     >
                        <div>
                           <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                              {executing ? 'Executing...' : 'Run Command'}
                           </div>
                           <div className="text-[11px] text-zinc-500 mt-0.5 max-w-[90%] truncate font-mono">
                              "{query.substring(1).trim()}"
                           </div>
                        </div>
                        <div className="text-zinc-600 group-hover:text-amber-500 shrink-0">
                           {executing ? <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /> : <Send size={14} />}
                        </div>
                     </button>
                  ) : (
                     <div className="text-center text-xs text-zinc-500 py-6 font-mono">
                        Type an AI command to execute...
                        <div className="text-[10px] mt-2 opacity-50">e.g., "&gt; Deploy latest staging build"</div>
                     </div>
                  )}
               </div>
            ) : (
               <>
                 <div className="text-[10px] font-semibold text-zinc-500 px-3 py-1.5 uppercase tracking-wider">Suggestions</div>
                 <div className="space-y-0.5">
                   {filteredCommands.length > 0 ? filteredCommands.map((cmd) => (
                     <button
                       key={cmd.id}
                       onClick={() => {
                         if (cmd.path) {
                           navigate(cmd.path);
                         }
                         setCommandPaletteOpen(false);
                       }}
                       className="w-full flex items-center px-3 py-2 rounded-[8px] hover:bg-blue-500/10 hover:text-blue-400 text-zinc-300 transition-colors group cursor-pointer text-left"
                     >
                       <cmd.icon size={14} className="mr-3 text-zinc-500 group-hover:text-blue-400" />
                       <span className="text-xs font-medium">{cmd.name}</span>
                       {cmd.shortcut && (
                         <div className="ml-auto flex gap-1 items-center">
                           <span className="text-[10px] text-zinc-500 group-hover:text-blue-400/70 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ArrowRight size={12}/>
                           </span>
                           <kbd className="bg-[#09090b] group-hover:bg-blue-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase font-mono border border-zinc-800 group-hover:border-blue-500/30 text-zinc-400 group-hover:text-blue-400">
                             {cmd.shortcut}
                           </kbd>
                         </div>
                       )}
                     </button>
                   )) : (
                      <div className="px-3 py-4 text-center text-xs text-zinc-500">
                         No results found for "{query}"
                      </div>
                   )}
                 </div>
               </>
            )}
          </div>
          
          <div className="px-4 py-2 border-t border-zinc-800 bg-[#09090b] text-[10px] text-zinc-500 flex items-center justify-between">
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><kbd className="bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700 font-mono text-[9px]">↑</kbd><kbd className="bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700 font-mono text-[9px]">↓</kbd> to navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700 font-mono text-[9px]">↵</kbd> to select</span>
            </div>
            <div className="flex gap-4">
               <span className="flex items-center gap-1"><kbd className="bg-zinc-800 px-1 py-0.5 rounded border border-zinc-700 font-mono text-[9px]">&gt;</kbd> AI command mode</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
