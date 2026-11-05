// The Aether PC agent on this computer (github.com/F0rger123/aether-agent). When it's connected,
// DevSpace keeps its projects there too, so Aether on the phone knows them, and shows Aether's
// blueprints and personality here.
import { useEffect, useState } from "react";
import { useStore } from "./store";

const KEY = "devspace-agent";

export interface AgentLink { url: string; token: string }

export function agentLink(): AgentLink | null {
  // Opened from Aether's window with #t=..., the link sets itself up.
  const t = new URLSearchParams(location.hash.slice(1)).get("t");
  if (t) {
    saveLink({ url: "http://127.0.0.1:7733", token: t });
    history.replaceState(null, "", location.pathname + location.search);
  }
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AgentLink) : null;
  } catch {
    return null;
  }
}

export function saveLink(link: AgentLink | null) {
  try {
    if (link) localStorage.setItem(KEY, JSON.stringify(link));
    else localStorage.removeItem(KEY);
  } catch {
    /* private window: stays unlinked */
  }
}

export async function agent<T>(path: string, body?: unknown): Promise<T> {
  const link = agentLink();
  if (!link) throw new Error("not connected");
  const r = await fetch(link.url + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: "Bearer " + link.token, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(r.status === 401 ? "the token was refused" : "the agent said " + r.status);
  return r.json() as Promise<T>;
}

export type SyncState = "off" | "syncing" | "synced" | "error";

/** Keeps projects and ideas in step with the agent: the newer copy wins, then every change is sent. */
export function useAgentSync(): { state: SyncState; error: string } {
  const [state, setState] = useState<SyncState>(agentLink() ? "syncing" : "off");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!agentLink()) return;
    let ready = false;
    let timer: number | undefined;
    agent<{ projects?: unknown[]; ideas?: unknown[]; updatedAt?: number }>("/devspace")
      .then(remote => {
        const local = useStore.getState();
        if ((remote.updatedAt ?? 0) > local.updatedAt && remote.projects) {
          local.replaceAll(remote as never);
        } else if (local.updatedAt > (remote.updatedAt ?? 0)) {
          return agent("/devspace", { projects: local.projects, ideas: local.ideas, updatedAt: local.updatedAt });
        }
      })
      .then(() => { ready = true; setState("synced"); })
      .catch(e => { setState("error"); setError(String(e.message || e)); });
    const stop = useStore.subscribe(s => {
      if (!ready) return;
      clearTimeout(timer);
      setState("syncing");
      timer = window.setTimeout(() => {
        agent("/devspace", { projects: s.projects, ideas: s.ideas, updatedAt: s.updatedAt })
          .then(() => setState("synced"))
          .catch(e => { setState("error"); setError(String(e.message || e)); });
      }, 700);
    });
    return () => { stop(); clearTimeout(timer); };
  }, []);
  return { state, error };
}
