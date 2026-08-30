import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { isElectron } from './lib/electronBridge';
import { AppLayout } from './components/layout/AppLayout';
import { BarShell } from './components/ui/TheBar/BarShell';
import { Dashboard } from './pages/Dashboard';
import { AssistantChat } from './pages/AssistantChat';
import { Projects } from './pages/Projects';
import { Brain } from './pages/Brain';
import { Issues } from './pages/Issues';
import { Roadmap } from './pages/Roadmap';
import { GitHubIntelligence } from './pages/GitHubIntelligence';
import { WorkspaceDocs } from './pages/WorkspaceDocs';
import { Settings } from './pages/Settings';
import { Notes } from './pages/Notes';
import { Assets } from './pages/Assets';
import { IdeaExpansion } from './pages/IdeaExpansion';
import { AgenticOS } from './pages/AgenticOS';
import { WhatsAppCompanion } from './pages/WhatsAppCompanion';
import { Automations } from './pages/Automations';
import { Workflows } from './pages/Workflows';
import { AetherIntelligenceReport } from './pages/AetherIntelligenceReport';
import { AetherHub } from './pages/AetherHub';
import { Community } from './pages/Community';
import { SandboxLoop } from './pages/SandboxLoop';
import { Create } from './pages/Create';
import { Design } from './pages/Design';
import { EditableDevSpace } from './pages/EditableDevSpace';
import { MemoryPage } from './pages/Memory';
import { Goals } from './pages/Goals';
import { People } from './pages/People';
import { AndroidDiagnosticsScreen } from './components/AndroidDiagnosticsScreen';

export default function App() {
  const isDesktop = typeof window !== 'undefined' && (isElectron() || window.location.protocol === 'file:');
  const RouterComponent = isDesktop ? HashRouter : BrowserRouter;

  const isOverlayWindow = typeof window !== 'undefined' && isDesktop && (
    window.location.hash.includes('overlay') || 
    window.location.pathname.includes('/overlay') ||
    window.location.search.includes('overlay')
  );

  useEffect(() => {
    if (isOverlayWindow) {
      document.documentElement.classList.add('overlay-mode');
      document.body.classList.add('overlay-mode');
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
      document.body.style.overflow = 'hidden';
    }
  }, [isOverlayWindow]);

  if (isOverlayWindow) {
    return (
      <div className="w-screen h-screen bg-transparent overflow-hidden flex items-start justify-center pt-2 select-none">
        <BarShell standalone />
      </div>
    );
  }

  return (
    <RouterComponent>
      <Routes>
        {isDesktop && (
          <>
            <Route
              path="/overlay"
              element={
                <div className="w-screen h-screen bg-transparent overflow-hidden flex items-start justify-center pt-2 select-none">
                  <BarShell standalone />
                </div>
              }
            />
            <Route
              path="overlay"
              element={
                <div className="w-screen h-screen bg-transparent overflow-hidden flex items-start justify-center pt-2 select-none">
                  <BarShell standalone />
                </div>
              }
            />
          </>
        )}
        <Route
          path="*"
          element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create" element={<Create />} />
                <Route path="/design" element={<Design />} />
                <Route path="/assistant" element={<AssistantChat />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/sandbox-loop" element={<SandboxLoop />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/ideas" element={<IdeaExpansion />} />
                <Route path="/brain" element={<Brain />} />
                <Route path="/memory" element={<MemoryPage />} />
                <Route path="/aether-memory" element={<MemoryPage />} />
                <Route path="/agents" element={<AgenticOS />} />
                <Route path="/issues" element={<Issues />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/github" element={<GitHubIntelligence />} />
                <Route path="/docs" element={<WorkspaceDocs />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/community" element={<Community />} />
                <Route path="/whatsapp-companion" element={<WhatsAppCompanion />} />
                <Route path="/automations" element={<Automations />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/aether-report" element={<AetherIntelligenceReport />} />
                <Route path="/aether-hub" element={<AetherIntelligenceReport />} />
                <Route path="/editable-devspace" element={<EditableDevSpace />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/planning" element={<Goals />} />
                <Route path="/people" element={<People />} />
                <Route path="/relationships" element={<People />} />
                <Route path="/android-diagnostics" element={<div className="p-6 max-w-5xl mx-auto"><AndroidDiagnosticsScreen /></div>} />
                <Route path="/diagnostics" element={<div className="p-6 max-w-5xl mx-auto"><AndroidDiagnosticsScreen /></div>} />
                {/* Fallback for undefined routes */}
                <Route
                  path="*"
                  element={
                    <div className="h-full flex items-center justify-center text-zinc-500 flex-col gap-4">
                      <h2 className="text-xl">Component under construction</h2>
                      <p className="text-sm">Use the navigation or Cmd+K to return</p>
                    </div>
                  }
                />
              </Routes>
            </AppLayout>
          }
        />
      </Routes>
    </RouterComponent>
  );
}
