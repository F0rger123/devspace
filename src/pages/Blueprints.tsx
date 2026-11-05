import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { agent, agentLink } from "../agent";
import { Card, Empty, Label, Page } from "../ui";

interface Blueprint { name: string; plan: string; steps: string[]; runningIn?: string; saved?: number }

/** Plans made by voice with Aether on the phone, read from the Aether PC agent. */
export default function Blueprints() {
  const [list, setList] = useState<Blueprint[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const linked = !!agentLink();

  useEffect(() => {
    if (!linked) return;
    agent<{ blueprints?: Record<string, Blueprint> }>("/memory")
      .then(m => setList(Object.values(m.blueprints ?? {}).sort((a, b) => (b.saved ?? 0) - (a.saved ?? 0))))
      .catch(e => setError(String(e.message || e)));
  }, [linked]);

  return (
    <Page title="Blueprints" sub="Big projects planned with Aether, built step by step by Claude Code">
      {!linked ? (
        <Empty title="Link Aether first" hint="Blueprints live with Aether. Link the Aether PC agent in Settings, then they show up here." action={<Link to="/settings" className="text-accent underline">Open Settings</Link>} />
      ) : error ? (
        <Empty title="Couldn't load blueprints" hint={`The Aether agent didn't answer (${error}). Is it running?`} />
      ) : list === null ? (
        <div className="space-y-3">{[0, 1].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-panel" />)}</div>
      ) : list.length === 0 ? (
        <Empty title="No blueprints yet" hint={'Brainstorm a project with Aether on your phone, then say "save the blueprint". Say "build it" and Claude Code builds it step by step.'} />
      ) : (
        <ul className="space-y-3">
          {list.map(b => (
            <li key={b.name}>
              <Card>
                <button className="w-full text-left" onClick={() => setOpen(open === b.name ? null : b.name)} aria-expanded={open === b.name}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{b.name}</span>
                    <span className="tnum text-xs text-sub">{b.steps.length} steps</span>
                  </div>
                  {b.runningIn && <div className="mt-1 text-xs text-accent">Autopilot running in {b.runningIn}</div>}
                </button>
                {open === b.name && (
                  <div className="mt-4">
                    <p className="whitespace-pre-wrap text-sm text-sub">{b.plan}</p>
                    <Label>Steps</Label>
                    <ol className="list-decimal space-y-2 pl-5 text-sm">{b.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
