import { useState } from "react";
import { agent, agentLink, saveLink, type SyncState } from "../agent";
import { useStore } from "../store";
import { cloudConfig, saveCloudConfig, sendSignInLink, signOut, type CloudState } from "../cloud";
import { Button, Card, Field, Label, Page } from "../ui";

/** Cloud sync: off until a Supabase project is filled in, then signed in by a link sent to your email. */
function CloudCard({ cloud }: { cloud: { state: CloudState; email: string; error: string } }) {
  const conf = cloudConfig();
  const [url, setUrl] = useState(conf?.url ?? "");
  const [anon, setAnon] = useState(conf?.anonKey ?? "");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <Card className="mt-4">
      <Label>Cloud sync</Label>
      {!conf ? (
        <>
          <p className="text-sub">Not set up yet. With it, your phone and PC share projects even when the PC is off. Fill in your Supabase project when you're ready (Project settings, API): the project URL and the anon public key.</p>
          <div className="mt-4 space-y-2">
            <Field value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-project.supabase.co" aria-label="Supabase URL" />
            <Field value={anon} onChange={e => setAnon(e.target.value)} placeholder="anon public key" aria-label="Supabase anon key" />
            <Button disabled={!url.trim().startsWith("https://") || anon.trim().length < 20} onClick={() => { saveCloudConfig({ url: url.trim().replace(/\/$/, ""), anonKey: anon.trim() }); location.reload(); }}>Save</Button>
          </div>
        </>
      ) : cloud.state === "signed out" ? (
        <>
          <p className="text-sub">Sign in with your email. You'll get a link; open it on this device.</p>
          <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); sendSignInLink(email.trim()).then(() => setMsg("Check your email for the link.")).catch(err => setMsg("Didn't send: " + String(err.message || err))); }}>
            <Field value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" aria-label="Email" />
            <Button type="submit" disabled={!email.includes("@")}>Send link</Button>
          </form>
          {msg && <p className="mt-2 text-sm text-sub">{msg}</p>}
          <button className="mt-3 text-xs text-dim underline" onClick={() => { saveCloudConfig(null); location.reload(); }}>Use a different project</button>
        </>
      ) : (
        <>
          <p>Signed in as <span className="font-medium">{cloud.email}</span>.</p>
          <p className="mt-1 text-sm text-sub">{{ syncing: "Saving…", synced: "Synced. Your phone and PC see the same projects.", error: "Problem: " + cloud.error, "not set up": "", "signed out": "" }[cloud.state]}</p>
          <div className="mt-4"><Button kind="ghost" onClick={() => signOut().then(() => location.reload())}>Sign out</Button></div>
        </>
      )}
    </Card>
  );
}

export default function Settings({ sync, cloud }: { sync: { state: SyncState; error: string }; cloud: { state: CloudState; email: string; error: string } }) {
  const link = agentLink();
  const [url, setUrl] = useState(link?.url ?? "http://127.0.0.1:7733");
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState("");
  const { projects, ideas } = useStore();

  const connect = async () => {
    saveLink({ url: url.trim().replace(/\/$/, ""), token: token.trim() });
    try {
      await agent("/abilities");
      setMsg("Linked. Reloading to sync…");
      setTimeout(() => location.reload(), 700);
    } catch (e) {
      saveLink(null);
      setMsg("That didn't work: " + String((e as Error).message || e));
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ projects, ideas }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "devspace.json";
    a.click();
  };

  return (
    <Page title="Settings">
      <Card>
        <Label>Aether</Label>
        {link ? (
          <>
            <p>Linked to the Aether PC agent at <span className="font-mono text-sm">{link.url}</span>.</p>
            <p className="mt-1 text-sm text-sub">{{ off: "", syncing: "Saving…", synced: "Projects and ideas are synced, so Aether on your phone knows them.", error: "Sync problem: " + sync.error }[sync.state]}</p>
            <div className="mt-4"><Button kind="ghost" onClick={() => { saveLink(null); location.reload(); }}>Unlink</Button></div>
          </>
        ) : (
          <>
            <p className="text-sub">Link the Aether PC agent so your projects sync with Aether and blueprints show here. The easy way: open DevSpace from Aether's window on your PC. Or paste its token (in <span className="font-mono text-xs">~/.aether/config.json</span>).</p>
            <div className="mt-4 space-y-2">
              <Field value={url} onChange={e => setUrl(e.target.value)} aria-label="Agent address" />
              <Field value={token} onChange={e => setToken(e.target.value)} placeholder="Token" type="password" aria-label="Token" />
              <Button onClick={connect} disabled={!token.trim()}>Link Aether</Button>
              {msg && <p className="text-sm text-sub">{msg}</p>}
            </div>
          </>
        )}
      </Card>
      <CloudCard cloud={cloud} />
      <Card className="mt-4">
        <Label>Your data</Label>
        <p className="text-sub">Everything is kept in this browser{link ? " and on your PC through Aether" : ""}. {projects.length} projects, {ideas.length} ideas.</p>
        <div className="mt-4"><Button kind="ghost" onClick={exportData}>Download a copy</Button></div>
      </Card>
    </Page>
  );
}
