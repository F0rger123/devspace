// Cloud sync through Supabase, so phone and PC share DevSpace even with the PC off. It stays off
// until a Supabase project is filled in (Settings, or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
// and you sign in with the link emailed to you. Only your own row can be read or changed.
import { useEffect, useState } from "react";
import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { useStore } from "./store";

const KEY = "devspace-cloud";

export interface CloudConfig { url: string; anonKey: string }

export function cloudConfig(): CloudConfig | null {
  const env = import.meta.env as Record<string, string | undefined>;
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) return { url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CloudConfig) : null;
  } catch {
    return null;
  }
}

export function saveCloudConfig(c: CloudConfig | null) {
  try {
    if (c) localStorage.setItem(KEY, JSON.stringify(c));
    else localStorage.removeItem(KEY);
  } catch {
    /* private window: nothing kept */
  }
  client = null;
}

let client: SupabaseClient | null = null;
export function cloud(): SupabaseClient | null {
  const c = cloudConfig();
  if (!c) return null;
  if (!client) client = createClient(c.url, c.anonKey, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" } });
  return client;
}

/** Emails a sign-in link that comes back to this page. */
export async function sendSignInLink(email: string) {
  const sb = cloud();
  if (!sb) throw new Error("Supabase isn't set up yet");
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
  if (error) throw error;
}

export async function signOut() {
  await cloud()?.auth.signOut();
}

export type CloudState = "not set up" | "signed out" | "syncing" | "synced" | "error";

/** Keeps projects and ideas in step with your Supabase row: the newer copy wins, then changes are sent. */
export function useCloudSync(): { state: CloudState; email: string; error: string } {
  const [state, setState] = useState<CloudState>(cloudConfig() ? "signed out" : "not set up");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = cloud();
    if (!sb) return;
    let ready = false;
    let timer: number | undefined;
    let userId = "";

    const pull = async () => {
      setState("syncing");
      const { data, error: e } = await sb.from("devspace_state").select("data, updated_at").eq("user_id", userId).maybeSingle();
      if (e) throw e;
      const local = useStore.getState();
      const remoteAt = Number(data?.updated_at ?? 0);
      if (data && remoteAt > local.updatedAt) local.replaceAll({ ...(data.data as never as { projects: []; ideas: [] }), updatedAt: remoteAt });
      else if (local.updatedAt > remoteAt) await push();
      ready = true;
      setState("synced");
    };
    const push = async () => {
      const s = useStore.getState();
      const { error: e } = await sb.from("devspace_state").upsert({ user_id: userId, data: { projects: s.projects, ideas: s.ideas }, updated_at: s.updatedAt });
      if (e) throw e;
    };
    const fail = (e: unknown) => { setState("error"); setError(String((e as Error).message || e)); };

    const begin = (session: Session | null) => {
      if (!session) { userId = ""; ready = false; setState("signed out"); setEmail(""); return; }
      userId = session.user.id;
      setEmail(session.user.email ?? "");
      pull().catch(fail);
    };
    sb.auth.getSession().then(({ data }) => begin(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => begin(session));

    const stop = useStore.subscribe(() => {
      if (!ready || !userId) return;
      clearTimeout(timer);
      setState("syncing");
      timer = window.setTimeout(() => push().then(() => setState("synced")).catch(fail), 900);
    });
    // Coming back to the app (switching from the phone to the PC): fetch what changed meanwhile.
    const back = () => { if (document.visibilityState === "visible" && userId) pull().catch(fail); };
    document.addEventListener("visibilitychange", back);
    return () => { stop(); sub.subscription.unsubscribe(); clearTimeout(timer); document.removeEventListener("visibilitychange", back); };
  }, []);

  return { state, email, error };
}
