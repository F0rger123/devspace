import { Link } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import { openTasks, progress, useStore } from "../store";
import { Bar, Button, Card, Empty, Label, Page } from "../ui";

const ORDER = { high: 0, normal: 1, low: 2 } as const;

export default function Today() {
  const { projects, ideas, toggleTask } = useStore();
  const active = projects.filter(p => p.status === "active");
  // What to do next: the open tasks of active projects, most important first, oldest first.
  const next = active
    .flatMap(p => p.tasks.filter(t => !t.done).map(t => ({ t, p })))
    .sort((a, b) => ORDER[a.t.priority] - ORDER[b.t.priority] || a.t.createdAt - b.t.createdAt)
    .slice(0, 8);
  const fresh = ideas.filter(i => i.state === "new").length;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <Page title={hello} sub={new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}>
      <div className="grid grid-cols-3 gap-3">
        <Tile n={active.length} label="Active projects" to="/projects" />
        <Tile n={active.reduce((s, p) => s + openTasks(p), 0)} label="Open tasks" to="/projects" />
        <Tile n={fresh} label="Ideas to judge" to="/ideas" glow={fresh > 0} />
      </div>

      <Card className="mt-4">
        <Label>Up next</Label>
        {next.length === 0 ? (
          projects.length === 0 ? (
            <Empty title="Nothing here yet" hint="Start a project, or drop a few ideas in and swipe the good ones into projects." action={<Link to="/projects"><Button>Start a project</Button></Link>} />
          ) : (
            <p className="py-2 text-sub">No open tasks in your active projects. Nice.</p>
          )
        ) : (
          <ul className="divide-y divide-line">
            {next.map(({ t, p }) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <button aria-label={`Mark ${t.title} done`} onClick={() => toggleTask(p.id, t.id)} className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line hover:border-accent">
                  <Check size={14} className="opacity-0 hover:opacity-60" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{t.title}</div>
                  <Link to={`/projects/${p.id}`} className="text-xs text-dim hover:text-sub">{p.name}</Link>
                </div>
                {t.priority === "high" && <span className="rounded-md border border-accent/40 px-1.5 py-0.5 font-mono text-[10px] text-accent">HIGH</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {active.length > 0 && (
        <Card className="mt-4">
          <Label>Projects in motion</Label>
          <ul className="space-y-3">
            {active.slice(0, 5).map(p => (
              <li key={p.id}>
                <Link to={`/projects/${p.id}`} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2"><span className="truncate font-medium">{p.name}</span><span className="tnum text-xs text-sub">{progress(p)}%</span></div>
                    <div className="mt-2"><Bar value={progress(p)} /></div>
                  </div>
                  <ChevronRight size={16} className="text-dim" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  );
}

function Tile({ n, label, to, glow }: { n: number; label: string; to: string; glow?: boolean }) {
  return (
    <Link to={to} className={`tile-in ${glow ? "glow" : ""} rounded-2xl border border-line bg-panel p-3 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10`}>
      <div className="tnum text-2xl font-bold">{n}</div>
      <div className="mt-1 text-xs leading-tight text-sub">{label}</div>
    </Link>
  );
}
