import { Bell, HelpCircle, Search, Menu, PanelRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';

export function Header() {
  const { toggleCommandPalette, toggleSidebar, toggleRightSidebar } = useStore();
  const { userProfile, googleUser } = useData();
  const navigate = useNavigate();

  const getInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (googleUser?.email) {
      return googleUser.email[0].toUpperCase();
    }
    return 'D';
  };

  return (
    <header className="h-11 border-b border-zinc-900 flex items-center justify-between px-4 bg-[#050505] shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-1.5 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900 rounded transition-colors mr-1">
          <Menu size={16} />
        </button>
        <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center shadow-[0_0_12px_rgba(234,179,8,0.35)]">
          <span className="text-black font-extrabold text-[11px] font-mono">D</span>
        </div>
        <span className="text-zinc-100 font-semibold tracking-tight text-sm">DEVSPACE / <span className="text-yellow-500 font-bold">CORE</span></span>
        <div className="h-4 w-[1px] bg-zinc-800 ml-2 hidden sm:block"></div>
        <div className="hidden sm:flex items-center gap-2 ml-2 px-2.5 py-0.5 bg-black rounded border border-zinc-800">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,1)]"></span>
          <span className="text-[9.5px] font-mono text-yellow-500 font-bold tracking-wider">SYNC: ACTIVE</span>
        </div>
      </div>
      <div className="flex-grow max-w-md mx-4 sm:mx-8 relative" onClick={toggleCommandPalette}>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <span className="text-zinc-650 text-xs mr-2"><Search size={14} className="text-zinc-500" /></span>
        </div>
        <input 
          type="text" 
          placeholder="Search projects, tasks, or memory..." 
          className="w-full bg-[#101012] border border-zinc-850 hover:border-zinc-800 rounded-md py-1.5 pl-8 pr-4 text-xs focus:outline-none focus:border-yellow-500/80 cursor-pointer pointer-events-none text-zinc-400 transition-colors"
        />
        <div className="absolute inset-y-0 right-3 flex items-center hidden sm:flex">
            <span className="text-[10px] text-zinc-500 border border-zinc-850 px-1 rounded font-mono">K</span>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 border-r border-zinc-850 pr-4">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.7)]"></div>
          <span className="text-[11px] font-medium text-zinc-400">SPRINT 4: <span className="text-yellow-500 font-bold">82%</span></span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Bell size={16} className="text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
          <button
            onClick={() => navigate('/settings')}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center font-bold text-xs cursor-pointer transition-transform hover:scale-105"
            style={{
              backgroundColor: userProfile?.avatarColor || '#3b82f6',
              borderColor: `${userProfile?.avatarColor || '#3b82f6'}80`,
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)'
            }}
            title={`View profile: ${userProfile?.displayName || googleUser?.email || 'User'}`}
          >
            {getInitials()}
          </button>
        </div>
        <button onClick={toggleRightSidebar} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors ml-1">
          <PanelRight size={16} />
        </button>
      </div>
    </header>
  );
}
