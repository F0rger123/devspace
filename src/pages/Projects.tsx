import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, Plus, Trash2 } from "lucide-react";
import { openTasks, progress, useStore, type Priority, type Status } from "../store";
import { Bar, Button, Card, Empty, Field, Label, Page, STATUS_LOOK } from "../ui";

export default function Projects() {
  const { projects, addProject } = useStore();
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<Status | "all">("active");
  const nav = useNavigate();
  const shown = projects.filter(p => filter === "all" || p.status === filter);

  return (
    <Page title="Projects" sub={`${projects.length} in all`}>
      <form
        className="mb-4 flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          if (!name.trim()) return;
          const id = addProject(name);
          setName("");
          nav(`/projects/${id}`);
        }}
      >
        <Field value={name} onChange={e => setName(e.target.value)} placeholder="New project name" aria-label="New project name" />
        <Button type="submit" disabled={!name.trim()}><Plus size={16} /> Add</Button>
      </form>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(["active", "paused", "done", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1.5 text-sm capitalize ${filter === f ? "border-accent bg-accent text-ink font-semibold" : "border-line text-sub"}`}>{f}</button>
        ))}
      </div>
      {shown.length === 0 ? (
        <Empty title={projects.length ? `No ${filter} projects` : "No projects yet"} hint={projects.length ? "Try another filter." : "Name one above. You can also turn a kept idea into a project from Ideas."} />
      ) : (
        <ul className="space-y-3">
          {shown.map(p => (
            <li key={p.id}>
              <Link to={`/projects/${p.id}`} className="block rounded-2xl border border-line bg-panel p-4 hover:border-accent/50">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{p.name}</span>
                      <span className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase ${STATUS_LOOK[p.status]}`}>{p.status}</span>
                    </div>
                    {p.about && <p className="mt-1 line-clamp-2 text-sm text-sub">{p.about}</p>}
                  </div>
                  <ChevronRight size={18} className="text-dim" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Bar value={progress(p)} />
                  <span className="tnum shrink-0 text-xs text-sub">{openTasks(p)} open</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

export function ProjectDetail() {
  const { id = "" } = useParams();
  const p = useStore(s => s.projects.find(x => x.id === id));
  const { updateProject, removeProject, addTask, toggleTask, removeTask } = useStore();
  const [task, setTask] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const nav = useNavigate();

  if (!p) return <Page title="Not found"><Empty title="That project isn't here" hint="It may have been deleted." action={<Link to="/projects"><Button kind="ghost">Back to projects</Button></Link>} /></Page>;
  const open = p.tasks.filter(t => !t.done);
  const done = p.tasks.filter(t => t.done);

  return (
    <Page title={p.name} sub={`${progress(p)}% done · ${open.length} open`} action={<Link to="/projects" aria-label="Back" className="grid h-10 w-10 place-items-center rounded-xl border border-line"><ArrowLeft size={18} /></Link>}>
      <Card>
        <Label>About</Label>
        <textarea
          defaultValue={p.about}
          onBlur={e => e.target.value !== p.about && updateProject(p.id, { about: e.target.value })}
          placeholder="What it is, who it's for, what done looks like"
          rows={3}
          className="w-full resize-y rounded-xl border border-line bg-ink p-3 text-text placeholder:text-dim focus:border-accent focus:outline-none"
        />
        <div className="mt-3 flex gap-2">
          {(["active", "paused", "done"] as const).map(s => (
            <button key={s} onClick={() => updateProject(p.id, { status: s })} className={`rounded-full border px-3 py-1.5 text-sm capitalize ${p.status === s ? "border-accent bg-accent font-semibold text-ink" : "border-line text-sub"}`}>{s}</button>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <Label>Tasks</Label>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={e => { e.preventDefault(); if (task.trim()) { addTask(p.id, task, priority); setTask(""); } }}>
          <Field value={task} onChange={e => setTask(e.target.value)} placeholder="Add a task" aria-label="New task" />
          <div className="flex gap-2">
            <select value={priority} onChange={e => setPriority(e.target.value as Priority)} aria-label="Priority" className="h-10 rounded-xl border border-line bg-ink px-2 text-sub">
              <option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
            </select>
            <Button type="submit" disabled={!task.trim()}><Plus size={16} /> Add</Button>
          </div>
        </form>
        {p.tasks.length === 0 && <p className="mt-4 text-sub">No tasks yet. Break the project into small steps you can finish in a sitting.</p>}
        <ul className="mt-3 divide-y divide-line">
          {[...open, ...done].map(t => (
            <li key={t.id} className="group flex items-center gap-3 py-3">
              <button aria-label={t.done ? `Reopen ${t.title}` : `Mark ${t.title} done`} onClick={() => toggleTask(p.id, t.id)} className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${t.done ? "border-done bg-done text-ink" : "border-line hover:border-accent"}`}>
                {t.done && <Check size={14} />}
              </button>
              <span className={`min-w-0 flex-1 ${t.done ? "text-dim line-through" : ""}`}>{t.title}</span>
              {t.priority === "high" && !t.done && <span className="font-mono text-[10px] text-accent">HIGH</span>}
              <button aria-label={`Delete ${t.title}`} onClick={() => removeTask(p.id, t.id)} className="text-dim opacity-60 hover:text-alert md:opacity-0 md:group-hover:opacity-100"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-6">
        <Button kind="danger" onClick={() => { if (confirm(`Delete "${p.name}" and its tasks?`)) { removeProject(p.id); nav("/projects"); } }}><Trash2 size={16} /> Delete project</Button>
      </div>
    </Page>
  );
}
