import { Bell, HelpCircle, Search, Menu, PanelRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../store';

export function Header() {
  const { toggleCommandPalette, toggleSidebar, toggleRightSidebar } = useStore();

  return (
    <header className="h-11 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#0c0c0e] shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors mr-1">
          <Menu size={16} />
        </button>
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-white rounded-full"></div>
        </div>
        <span className="text-zinc-100 font-semibold tracking-tight text-sm">DEVSPACE / CORE</span>
        <div className="h-4 w-[1px] bg-zinc-700 ml-2 hidden sm:block"></div>
        <div className="hidden sm:flex items-center gap-2 ml-2 px-2 py-1 bg-zinc-900 rounded border border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[11px] font-mono text-zinc-400">AGENT: ACTIVE</span>
        </div>
      </div>
      <div className="flex-grow max-w-md mx-4 sm:mx-8 relative" onClick={toggleCommandPalette}>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <span className="text-zinc-600 text-xs text-zinc-500 mr-2"><Search size={14} /></span>
        </div>
        <input 
          type="text" 
          placeholder="Search projects, tasks, or memory..." 
          className="w-full bg-[#121214] border border-zinc-800 rounded-md py-1.5 pl-8 pr-4 text-xs focus:outline-none focus:border-blue-500 cursor-pointer pointer-events-none text-zinc-400"
        />
        <div className="absolute inset-y-0 right-3 flex items-center hidden sm:flex">
            <span className="text-[10px] text-zinc-600 border border-zinc-800 px-1 rounded font-mono">K</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 border-r border-zinc-800 pr-4">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          <span className="text-[11px] font-medium text-zinc-400">SPRINT 4: 82%</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer">
          <Bell size={16} className="text-zinc-500 hover:text-zinc-300 transition-colors" />
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-800 border border-zinc-700"></div>
        </div>
        <button onClick={toggleRightSidebar} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors ml-1">
          <PanelRight size={16} />
        </button>
      </div>
    </header>
  );
}
