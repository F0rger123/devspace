import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { Header } from './Header';
import { CommandPalette } from '../ui/CommandPalette';
import { VoiceMemoAssistant } from '../ui/VoiceMemoAssistant';

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAssistantRoute = location.pathname === '/assistant';
  const isWhatsAppRoute = location.pathname === '/whatsapp-companion';

  if (isWhatsAppRoute) {
    return (
      <div className="h-[100dvh] w-full bg-[#0b141a] text-zinc-100 overflow-hidden select-none">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#09090b] text-zinc-400 font-sans overflow-hidden select-none selection:bg-blue-500/30">
      <Header />
      <div className="flex flex-grow overflow-hidden relative">
        <Sidebar />
        <main className="flex-grow flex flex-col min-w-0 overflow-hidden bg-[#09090b]">
          <div className={`flex-grow overflow-y-auto ${isAssistantRoute ? 'p-0' : 'p-4 lg:p-6'} shadow-[inset_0_4px_24px_rgba(0,0,0,0.4)]`}>
            <div className="w-full h-full min-h-full flex flex-col">
              {children}
            </div>
          </div>
        </main>
        {!isAssistantRoute && <RightSidebar />}
      </div>
      <CommandPalette />
      <VoiceMemoAssistant />
    </div>
  );
}
