import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { Header } from './Header';
import { CommandPalette } from '../ui/CommandPalette';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#09090b] text-zinc-400 font-sans overflow-hidden select-none selection:bg-blue-500/30">
      <Header />
      <div className="flex flex-grow overflow-hidden relative">
        <Sidebar />
        <main className="flex-grow flex flex-col min-w-0 overflow-hidden bg-[#09090b]">
          <div className="flex-grow overflow-y-auto p-4 lg:p-6 shadow-[inset_0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="mx-auto max-w-6xl h-full min-h-full flex flex-col">
              {children}
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
      <CommandPalette />
    </div>
  );
}
