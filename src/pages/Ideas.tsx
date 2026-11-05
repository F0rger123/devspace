import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderPlus, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import { useStore } from "../store";
import { Button, Card, Empty, Field, Label, Page } from "../ui";

/** Drop ideas in, then judge them one card at a time: swipe right to keep, left to drop. */
export default function Ideas() {
  const { ideas, addIdea, judgeIdea, ideaToProject } = useStore();
  const [text, setText] = useState("");
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const nav = useNavigate();
  const deck = ideas.filter(i => i.state === "new");
  const kept = ideas.filter(i => i.state === "kept" && !i.projectId);
  const top = deck[0];

  const judge = (keep: boolean) => { if (top) judgeIdea(top.id, keep); setDx(0); };

  return (
    <Page title="Ideas" sub={`${deck.length} to judge · ${kept.length} kept`}>
      <form className="mb-5 flex gap-2" onSubmit={e => { e.preventDefault(); if (text.trim()) { addIdea(text); setText(""); } }}>
        <Field value={text} onChange={e => setText(e.target.value)} placeholder="An idea, any size" aria-label="New idea" />
        <Button type="submit" disabled={!text.trim()}><Plus size={16} /> Add</Button>
      </form>

      {top ? (
        <div className="relative mx-auto h-72 max-w-md select-none">
          {deck[1] && <div className="absolute inset-0 translate-y-3 scale-95 rounded-3xl border border-line bg-panel opacity-60" />}
          <div
            className="absolute inset-0 flex touch-pan-y flex-col rounded-3xl border border-line bg-raise p-6 shadow-2xl shadow-black/50"
            style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: start.current === null ? "transform .2s" : "none", borderColor: dx > 40 ? "var(--color-done)" : dx < -40 ? "var(--color-alert)" : undefined }}
            onPointerDown={e => { start.current = e.clientX; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
            onPointerMove={e => { if (start.current !== null) setDx(e.clientX - start.current); }}
            onPointerUp={() => { const d = dx; start.current = null; if (d > 90) judge(true); else if (d < -90) judge(false); else setDx(0); }}
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Idea {ideas.length - ideas.indexOf(top)}</div>
            <p className="mt-4 flex-1 overflow-auto text-lg leading-relaxed">{top.text}</p>
            <p className="text-center text-xs text-dim">Swipe right to keep, left to drop</p>
          </div>
        </div>
      ) : (
        <Empty title={ideas.length ? "All judged" : "No ideas yet"} hint={ideas.length ? "Add more, or turn the kept ones into projects below." : "Type one above. Aether can also dream them up for you on your phone."} />
      )}
      {top && (
        <div className="mt-6 flex justify-center gap-4">
          <Button kind="ghost" onClick={() => judge(false)}><ThumbsDown size={16} /> Drop</Button>
          <Button onClick={() => judge(true)}><ThumbsUp size={16} /> Keep</Button>
        </div>
      )}

      {kept.length > 0 && (
        <Card className="mt-8">
          <Label>Kept, not started</Label>
          <ul className="divide-y divide-line">
            {kept.map(i => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">{i.text}</span>
                <button onClick={() => { const id = ideaToProject(i.id); if (id) nav(`/projects/${id}`); }} className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-sm text-sub hover:border-accent hover:text-accent">
                  <FolderPlus size={15} /> Project
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  );
}
