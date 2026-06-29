import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
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

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assistant" element={<AssistantChat />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/ideas" element={<IdeaExpansion />} />
          <Route path="/brain" element={<Brain />} />
          <Route path="/agents" element={<AgenticOS />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/github" element={<GitHubIntelligence />} />
          <Route path="/docs" element={<WorkspaceDocs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/whatsapp-companion" element={<WhatsAppCompanion />} />
          <Route path="/automations" element={<Automations />} />
          {/* Fallback for undefined routes */}
          <Route path="*" element={
            <div className="h-full flex items-center justify-center text-zinc-500 flex-col gap-4">
               <h2 className="text-xl">Component under construction</h2>
               <p className="text-sm">Use the navigation or Cmd+K to return</p>
            </div>
          } />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
