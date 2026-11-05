import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { CalendarCheck, FolderKanban, Lightbulb, Map, Settings as Gear } from "lucide-react";
import { useAgentSync } from "./agent";
import Today from "./pages/Today";
import Projects, { ProjectDetail } from "./pages/Projects";
import Ideas from "./pages/Ideas";
import Blueprints from "./pages/Blueprints";
import Settings from "./pages/Settings";

const TABS = [
  { to: "/today", label: "Today", icon: CalendarCheck },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/ideas", label: "Ideas", icon: Lightbulb },
  { to: "/blueprints", label: "Blueprints", icon: Map },
  { to: "/settings", label: "Settings", icon: Gear },
];

export default function App() {
  const sync = useAgentSync();
  return (
    <div className="flex min-h-full">
      {/* Desktop: a quiet sidebar. Phone: tabs along the bottom, within thumb reach. */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line px-3 py-6 md:flex">
        <div className="mb-8 px-2">
          <div className="font-display text-2xl font-bold">DevSpace</div>
          <div className="mt-1 font-mono text-[11px] text-dim">with Aether</div>
        </div>
        <nav className="flex flex-col gap-1">
          {TABS.map(t => (
            <NavLink key={t.to} to={t.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 ${isActive ? "bg-raise text-accent" : "text-sub hover:text-text"}`}>
              <t.icon size={18} /> {t.label}
            </NavLink>
          ))}
        </nav>
        <SyncDot state={sync.state} error={sync.error} className="mt-auto px-3" />
      </aside>
      <main className="min-w-0 flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/blueprints" element={<Blueprints />} />
          <Route path="/settings" element={<Settings sync={sync} />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {TABS.map(t => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? "text-accent" : "text-dim"}`}>
            <t.icon size={20} /> {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function SyncDot({ state, error, className = "" }: { state: string; error: string; className?: string }) {
  const words = { off: "Not linked to Aether", syncing: "Saving to Aether…", synced: "Synced with Aether", error: "Aether: " + error }[state];
  const dot = { off: "bg-dim", syncing: "bg-accent animate-pulse", synced: "bg-done", error: "bg-alert" }[state];
  return (
    <div className={`flex items-center gap-2 text-xs text-sub ${className}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} /> {words}
    </div>
  );
}
