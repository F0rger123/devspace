import { useState } from "react";
import { agent, agentLink, saveLink, type SyncState } from "../agent";
import { useStore } from "../store";
import { Button, Card, Field, Label, Page } from "../ui";

export default function Settings({ sync }: { sync: { state: SyncState; error: string } }) {
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
      <Card className="mt-4">
        <Label>Your data</Label>
        <p className="text-sub">Everything is kept in this browser{link ? " and on your PC through Aether" : ""}. {projects.length} projects, {ideas.length} ideas.</p>
        <div className="mt-4"><Button kind="ghost" onClick={exportData}>Download a copy</Button></div>
      </Card>
    </Page>
  );
}
