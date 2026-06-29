import { useState, useEffect } from 'react';
import { Search, Map, LayoutDashboard, CheckSquare, FolderGit2, Bot, Settings, ChevronRight, Hash, LogOut, TerminalSquare, Github, FileText, Image as ImageIcon, BrainCircuit, Sparkles, Zap } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { motion } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Sparkles, label: 'AI Assistant', path: '/assistant' },
  { icon: CheckSquare, label: 'Issues', path: '/issues' },
  { icon: FolderGit2, label: 'Projects', path: '/projects' },
  { icon: FileText, label: 'Notes', path: '/notes' },
  { icon: ImageIcon, label: 'Assets', path: '/assets' },
  { icon: BrainCircuit, label: 'Idea Plan', path: '/ideas' },
  { icon: Map, label: 'Roadmap', path: '/roadmap' },
  { icon: Bot, label: 'Project Brain', path: '/brain' },
  { icon: TerminalSquare, label: 'Agentic OS', path: '/agents' },
  { icon: Zap, label: 'Automations', path: '/automations' },
  { icon: Github, label: 'GitHub Int.', path: '/github' },
  { icon: FileText, label: 'Workspace Docs', path: '/docs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const toggleCommandPalette = useStore(state => state.toggleCommandPalette);
  const { isSidebarOpen, isSidebarMinimized, toggleSidebarMinimized } = useStore();
  const { projects, activeProjectId, setActiveProjectId } = useData();
  const navigate = useNavigate();

  if (!isSidebarOpen) return null;

  return (
    <nav className={cn(
      "absolute md:relative z-40 h-full shrink-0 border-r border-[#1f1f23] bg-[#0c0c0e] flex flex-col p-3 transition-all duration-300 shadow-2xl md:shadow-none",
      isSidebarMinimized ? "w-16 gap-4 items-center" : "w-60 gap-6"
    )}>
      
      {/* Sidebar Header & Toggle */}
      <div className={cn("flex items-center w-full mt-1", isSidebarMinimized ? "justify-center mb-1" : "justify-between mb-1 pl-2")}>
        {!isSidebarMinimized && <span className="text-[10px] font-extrabold text-zinc-400 tracking-wider">AETHER OS</span>}
        <button 
          onClick={toggleSidebarMinimized}
          className="p-1 rounded bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all shadow-inner cursor-pointer"
          title={isSidebarMinimized ? "Maximize Sidebar" : "Minimize Sidebar"}
        >
          {isSidebarMinimized ? <ChevronRight size={12} /> : <ChevronRight size={12} className="rotate-180 transition-transform" />}
        </button>
      </div>

      {/* Scrollable Navigation and Content Area */}
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-6">
        {/* Navigation */}
        <section className="w-full">
          {!isSidebarMinimized && <div className="text-[10px] font-extrabold text-white uppercase tracking-widest mb-3 pl-2 opacity-95">Menu</div>}
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative block"
                title={isSidebarMinimized ? item.label : undefined}
              >
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ x: isSidebarMinimized ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-md cursor-pointer group border border-transparent transition-colors duration-200",
                      isSidebarMinimized ? "justify-center p-2" : "px-3 py-1.5",
                      isActive 
                        ? "text-yellow-400 font-bold" 
                        : "text-zinc-100 hover:text-white hover:bg-zinc-800/40 font-medium"
                    )}
                  >
                    {/* Sliding active background indicator using Framer Motion layoutId */}
                    {isActive && (
                      <motion.div
                        layoutId="active-nav-bg"
                        className="absolute inset-0 bg-yellow-500/10 border border-yellow-500/20 rounded-md -z-10 shadow-[0_2px_15px_rgba(234,179,8,0.08)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <motion.div
                      animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                      whileHover={{ scale: 1.25, rotate: [0, -5, 5, 0] }}
                      transition={{
                        scale: { type: "spring", stiffness: 400, damping: 17 },
                        rotate: { type: "keyframes", duration: 0.3, ease: "easeInOut" }
                      }}
                      className="shrink-0"
                    >
                      <item.icon size={14} className={cn(isActive ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]" : "text-zinc-300 group-hover:text-white")} />
                    </motion.div>
                    {!isSidebarMinimized && <span className="text-xs">{item.label}</span>}
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>
        </section>

        {/* Active Projects */}
        {isSidebarMinimized ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-full h-px bg-zinc-900" />
            <div title="Active Projects">
              <FolderGit2 
                size={14} 
                className="text-zinc-500 hover:text-yellow-400 cursor-pointer transition-colors" 
                onClick={() => navigate('/projects')}
              />
            </div>
          </div>
        ) : (
          <section>
            <div className="text-[10px] font-extrabold text-white uppercase tracking-widest mb-3 pl-2 flex items-center group cursor-pointer hover:text-white/90">
              <ChevronRight size={12} className="mr-1 group-hover:block hidden transition-transform" />
              Active Projects
            </div>
            <div className="font-mono text-[11px] space-y-1 opacity-90 pl-2 border-l border-zinc-850">
              {projects.length === 0 ? (
                <div className="text-zinc-500 italic pl-3">No active projects</div>
              ) : projects.slice(0, 5).map((project) => {
                const isActive = project.id === activeProjectId;
                return (
                  <div 
                    key={project.id}
                    onClick={() => {
                      setActiveProjectId(project.id);
                      navigate(`/projects?id=${project.id}`);
                    }}
                    className="relative cursor-pointer"
                  >
                    <motion.div
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={cn(
                        "relative pl-3 py-1 flex flex-col gap-0.5 rounded-md transition-colors",
                        isActive 
                          ? "text-yellow-400 font-semibold" 
                          : "text-zinc-100 hover:text-white hover:bg-zinc-800/30"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-project-bg"
                          className="absolute inset-0 bg-yellow-500/5 border border-yellow-500/25 rounded-md -z-10"
                          transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        />
                      )}
                      <div className="flex items-center gap-2 truncate">↳ {project.name}</div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Integrations */}
        {isSidebarMinimized ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-full h-px bg-zinc-900" />
            <div className="relative group cursor-pointer" onClick={() => navigate('/github')} title="GitHub Connected">
              <Github size={14} className="text-zinc-400 hover:text-white transition-colors" />
              <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-yellow-500/40 bg-yellow-400/80 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
            </div>
          </div>
        ) : (
          <section>
             <div className="text-[10px] font-extrabold text-white uppercase tracking-widest mb-3 pl-2 opacity-95">Integrations</div>
             <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-zinc-100 hover:text-white hover:bg-zinc-800/40 cursor-pointer transition-all border border-transparent hover:border-zinc-800/50 font-medium" onClick={() => navigate('/github')}>
                <Github size={12} className="text-zinc-350 group-hover:text-white" />
                <span>GitHub Attached</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full border border-yellow-500/40 bg-yellow-400/80 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
             </div>
          </section>
        )}
      </div>

      {/* System Status / User Footer */}
      <section className="mt-auto w-full">
        <div className={cn("bg-[#0c0c0e] border border-zinc-900 rounded-lg shadow-inner", isSidebarMinimized ? "p-1.5 flex justify-center" : "p-3")}>
          <div className={cn("text-[10px] text-zinc-500 flex items-center", isSidebarMinimized ? "justify-center" : "justify-between")}>
            <span className="font-bold text-yellow-500" title="dev@devspace.ai">DV</span>
            {!isSidebarMinimized && <span className="font-mono">dev@devspace.ai</span>}
          </div>
        </div>
      </section>

    </nav>
  );
}
