import { useState, useEffect } from 'react';
import { Search, Map, LayoutDashboard, CheckSquare, FolderGit2, Bot, Settings, ChevronRight, Hash, LogOut, TerminalSquare, Github, FileText, Image as ImageIcon, BrainCircuit, Sparkles } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';

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
  { icon: Github, label: 'GitHub Int.', path: '/github' },
  { icon: FileText, label: 'Workspace Docs', path: '/docs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const toggleCommandPalette = useStore(state => state.toggleCommandPalette);
  const { isSidebarOpen } = useStore();
  const { projects, activeProjectId, setActiveProjectId } = useData();

  if (!isSidebarOpen) return null;

  return (
    <nav className="absolute md:relative z-40 h-full w-60 shrink-0 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col p-3 gap-6 transition-all duration-300 shadow-xl md:shadow-none">
      
      {/* Navigation */}
      <section>
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Menu</div>
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
                isActive 
                  ? "bg-zinc-800/50 text-zinc-100" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={14} className={cn("shrink-0", isActive ? "text-blue-400" : "")} />
                  <span className="text-xs">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </section>

      {/* Active Projects */}
      <section>
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center group cursor-pointer hover:text-zinc-300">
          <ChevronRight size={12} className="mr-1 group-hover:block hidden transition-transform" />
          Active Projects
        </div>
        <div className="font-mono text-[11px] space-y-1 opacity-80 pl-2 border-l border-zinc-800/50">
          {projects.length === 0 ? (
            <div className="text-zinc-500 italic pl-3">No active projects</div>
          ) : projects.slice(0, 5).map((project) => (
            <div 
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              className={cn(
                "pl-3 py-0.5 cursor-pointer transition-colors flex flex-col gap-0.5 rounded-md",
                project.id === activeProjectId ? "text-blue-400 font-medium" : "text-zinc-300 hover:text-zinc-100"
              )}
            >
              <div className="flex items-center gap-2 truncate">↳ {project.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section>
         <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Integrations</div>
         <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 cursor-pointer">
            <Github size={12} />
            <span>GitHub Attached</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full border border-green-500/30 bg-green-500/20" />
         </div>
      </section>

      {/* System Status / User Footer */}
      <section className="mt-auto">
        <div className="bg-[#121214] border border-zinc-800 rounded-lg p-3">
          <div className="text-[10px] text-zinc-500 flex items-center justify-between">
            <span>DV</span>
            <span>dev@devspace.ai</span>
          </div>
        </div>
      </section>

    </nav>
  );
}
