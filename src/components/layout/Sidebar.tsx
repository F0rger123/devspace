import { useState, useEffect } from 'react';
import { haptic } from '../../utils/haptics';
import { Search, Map, LayoutDashboard, CheckSquare, FolderGit2, Bot, Settings, ChevronRight, Hash, LogOut, TerminalSquare, Github, FileText, Image as ImageIcon, BrainCircuit, Sparkles, Zap, Compass, Cpu, Plus, PencilRuler, Sliders } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { useDevSpaceInstance } from '../../context/DevSpaceInstanceContext';
import { logout } from '../../lib/auth';
import { isElectron } from '../../lib/electronBridge';
import { motion } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Sliders, label: 'Edit DevSpace', path: '/editable-devspace' },
  { icon: PencilRuler, label: 'Design', path: '/design' },
  { icon: Plus, label: 'Create', path: '/create' },
  { icon: Sparkles, label: 'AI Assistant', path: '/assistant' },
  { icon: CheckSquare, label: 'Issues', path: '/issues' },
  { icon: FolderGit2, label: 'Projects', path: '/projects' },
  { icon: Cpu, label: 'Sandbox Loop', path: '/sandbox-loop' },
  { icon: Compass, label: 'Explore Hub', path: '/community' },
  { icon: FileText, label: 'Notes', path: '/notes' },
  { icon: ImageIcon, label: 'Assets', path: '/assets' },
  { icon: BrainCircuit, label: 'Idea Plan', path: '/ideas' },
  { icon: Map, label: 'Roadmap', path: '/roadmap' },
  { icon: Bot, label: 'Project Brain', path: '/brain' },
  { icon: TerminalSquare, label: 'Agentic OS', path: '/agents' },
  { icon: Sparkles, label: 'Aether Report', path: '/aether-report' },
  { icon: Zap, label: 'Automations', path: '/automations' },
  { icon: Github, label: 'GitHub Int.', path: '/github' },
  { icon: FileText, label: 'Workspace Docs', path: '/docs' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const toggleCommandPalette = useStore(state => state.toggleCommandPalette);
  const { isSidebarOpen, isSidebarMinimized, toggleSidebarMinimized, setSidebarOpen } = useStore();
  const { projects, activeProjectId, setActiveProjectId, userProfile, googleUser } = useData();
  const { activeProfile, getLabel, isSafeMode } = useDevSpaceInstance();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLinkClick = () => {
    if (window.innerWidth < 640) {
      setSidebarOpen(false);
    }
  };

  const getInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (googleUser?.email) {
      return googleUser.email[0].toUpperCase();
    }
    return 'DV';
  };

  return (
    <nav className={cn(
      "fixed md:relative z-40 h-full shrink-0 border-r border-zinc-800/80 bg-[#0c0c0e]/70 backdrop-blur-md flex flex-col p-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl md:shadow-none overflow-hidden",
      isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full md:translate-x-0",
      !isSidebarOpen && "md:w-0 md:p-0 md:border-r-0 md:opacity-0 md:pointer-events-none",
      isSidebarMinimized ? "w-16 gap-4 items-center" : "w-60 gap-6",
      "left-0 top-0 bottom-0"
    )}>
      
      {/* Sidebar Header & Toggle */}
      <div className={cn("flex items-center w-full mt-1", isSidebarMinimized ? "justify-center mb-1" : "justify-between mb-1 pl-2")}>
        {!isSidebarMinimized && (
          <span 
            className="tasteful-glitch text-[11px] font-display font-light text-zinc-300 tracking-[0.25em] uppercase"
            data-text="DEVSPACE"
          >
            DEVSPACE
          </span>
        )}
        <button 
          onClick={() => { haptic.light(); toggleSidebarMinimized(); }}
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
          {!isSidebarMinimized && <div className="text-[10px] font-display font-light text-zinc-400 uppercase tracking-[0.22em] mb-3 pl-2 opacity-95">Menu</div>}
          <div className="space-y-1">
            {navItems
              .filter((item) => {
                if (item.path === '/editable-devspace') return false; // Hidden from UI for now
                if (isSafeMode) return true;
                const hidden = activeProfile.layoutOverrides?.hiddenSections || [];
                return !hidden.includes(item.label);
              })
              .map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative block"
                  title={isSidebarMinimized ? getLabel(item.label) : undefined}
                  onClick={() => {
                    haptic.light();
                    handleLinkClick();
                  }}
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
                      {!isSidebarMinimized && <span className="text-xs">{getLabel(item.label)}</span>}
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
                onClick={() => {
                  haptic.light();
                  navigate('/projects');
                  handleLinkClick();
                }}
              />
            </div>
          </div>
        ) : (
          <section>
            <div className="text-[10px] font-display font-light text-zinc-400 uppercase tracking-[0.22em] mb-3 pl-2 flex items-center group cursor-pointer hover:text-white/90">
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
                      haptic.light();
                      setActiveProjectId(project.id);
                      if (location.pathname === '/projects') {
                        navigate(`/projects?id=${project.id}`);
                      }
                      handleLinkClick();
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
            <div className="relative group cursor-pointer" onClick={() => { haptic.light(); navigate('/github'); handleLinkClick(); }} title="GitHub Connected">
              <Github size={14} className="text-zinc-400 hover:text-white transition-colors" />
              <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-yellow-500/40 bg-yellow-400/80 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
            </div>
          </div>
        ) : (
          <section>
             <div className="text-[10px] font-display font-light text-zinc-400 uppercase tracking-[0.22em] mb-3 pl-2 opacity-95">Integrations</div>
             <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs text-zinc-100 hover:text-white hover:bg-zinc-800/40 cursor-pointer transition-all border border-transparent hover:border-zinc-800/50 font-medium" onClick={() => { haptic.light(); navigate('/github'); handleLinkClick(); }}>
                <Github size={12} className="text-zinc-350 group-hover:text-white" />
                <span>GitHub Attached</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full border border-yellow-500/40 bg-yellow-400/80 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
             </div>
          </section>
        )}
      </div>

      {/* System Status / User Footer */}
      <section className="mt-auto w-full flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 w-full">
          <button
            onClick={() => {
              haptic.light();
              navigate('/settings');
              handleLinkClick();
            }}
            className={cn(
              "flex-grow bg-[#0c0c0e] hover:bg-zinc-900/65 border border-zinc-900 rounded-lg shadow-inner text-left transition-all cursor-pointer flex items-center gap-2",
              isSidebarMinimized ? "p-1.5 justify-center" : "p-2.5 min-w-0"
            )}
            title={`View Profile: ${userProfile?.displayName || googleUser?.email || 'User'}`}
          >
            <div
              className="w-6 h-6 rounded-full border flex items-center justify-center font-bold text-[10px] shrink-0"
              style={{
                backgroundColor: userProfile?.avatarColor || '#3b82f6',
                borderColor: `${userProfile?.avatarColor || '#3b82f6'}60`,
                color: '#ffffff'
              }}
            >
              {getInitials()}
            </div>
            {!isSidebarMinimized && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-zinc-250 truncate leading-none mb-0.5">
                  {userProfile?.displayName || googleUser?.email?.split('@')[0] || 'Developer'}
                </p>
                <p className="text-[9px] font-mono text-zinc-500 truncate leading-none">
                  {userProfile?.title || googleUser?.email || 'Lead Engineer'}
                </p>
              </div>
            )}
          </button>

          {!isSidebarMinimized && (
            <button
              onClick={async () => {
                haptic.warning();
                await logout();
                navigate('/');
              }}
              className="p-2.5 bg-[#0c0c0e] hover:bg-red-950/20 hover:text-red-400 border border-zinc-900 hover:border-red-900/30 rounded-lg shadow-inner transition-all cursor-pointer text-zinc-500 shrink-0"
              title="Log Out"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>
        {isSidebarMinimized && (
          <button
            onClick={async () => {
              haptic.warning();
              await logout();
              navigate('/');
            }}
            className="w-full p-2 bg-[#0c0c0e] hover:bg-red-950/20 hover:text-red-400 border border-zinc-900 hover:border-red-900/30 rounded-lg shadow-inner transition-all cursor-pointer text-zinc-500 flex justify-center shrink-0"
            title="Log Out"
          >
            <LogOut size={11} />
          </button>
        )}
      </section>

    </nav>
  );
}
