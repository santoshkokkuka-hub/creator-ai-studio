import { useEffect, useState } from "react";
import { Film, Search, X } from "lucide-react";
import { Panel, Input, Select, Button, ActionButton, Notice, EmptyState, useServiceAction } from "@/components/studio";
import { splitStoryIntoScenesFn, searchMediaFn, type Scene, type SceneMedia } from "@/lib/scenes.functions";

function MediaView({ m, className }: { m: SceneMedia; className?: string }) {
  return m.type === "video"
    ? <video src={m.url} poster={m.preview || undefined} controls muted playsInline className={className} />
    : <img src={m.preview} alt={m.tags} loading="lazy" className={className} />;
}

export function SceneBoard({ story }: { story: string }) {
  const a = useServiceAction<Scene[]>();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [editing, setEditing] = useState<number | null>(null);

  const create = () => a.run(async () => {
    const r = await splitStoryIntoScenesFn({ data: { story } });
    if (r.error || !r.scenes) throw new Error(r.error ?? "Something went wrong");
    setScenes(r.scenes);
    return r.scenes;
  });
  useEffect(() => { void create(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Panel title="Scenes & media" className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ActionButton loading={a.loading} onClick={create}>{scenes.length ? "Recreate scenes" : "Create scenes & find media"}</ActionButton>
        <span className="text-xs text-muted-foreground">Media from Pixabay</span>
      </div>
      {a.error && <div className="mb-4"><Notice>{a.error}</Notice></div>}
      {!scenes.length ? <EmptyState icon={Film} title="No scenes yet" text="Split your story into scenes with matching images and videos." /> : (
        <div className="space-y-4">
          {scenes.map((s, i) => (
            <div key={i} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[280px_1fr]">
              <div className="space-y-2">
                {s.media ? <MediaView m={s.media} className="aspect-video w-full rounded-md bg-muted object-cover" /> : <div className="flex aspect-video items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">No media found</div>}
                <Button variant="secondary" className="w-full" onClick={() => setEditing(editing === i ? null : i)}>{editing === i ? "Close" : "Replace media"}</Button>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Scene {i + 1}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{s.text}</p>
                <p className="mt-2 text-xs text-muted-foreground">Keywords: {s.keywords}</p>
              </div>
              {editing === i && (
                <div className="md:col-span-2">
                  <MediaPicker initial={s.keywords} onPick={(m) => { setScenes((p) => p.map((x, j) => j === i ? { ...x, media: m } : x)); setEditing(null); }} onClose={() => setEditing(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function MediaPicker({ initial, onPick, onClose }: { initial: string; onPick: (m: SceneMedia) => void; onClose: () => void }) {
  const [q, setQ] = useState(initial);
  const [kind, setKind] = useState("all");
  const a = useServiceAction<SceneMedia[]>();
  const search = () => a.run(async () => {
    const r = await searchMediaFn({ data: { query: q, kind: kind as "all" | "image" | "video" } });
    if (r.error) throw new Error(r.error);
    return r.results;
  });
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && q.trim() && search()} placeholder="English keywords" className="min-w-48 flex-1" />
        <Select value={kind} onChange={(e) => setKind(e.target.value)} options={["all", "image", "video"]} className="w-28" />
        <ActionButton loading={a.loading} disabled={!q.trim()} onClick={search}><Search className="h-4 w-4" />Search</ActionButton>
        <Button variant="secondary" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></Button>
      </div>
      {a.error && <div className="mt-3"><Notice>{a.error}</Notice></div>}
      {a.result && (a.result.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {a.result.map((m, i) => (
            <button key={i} onClick={() => onPick(m)} className="group relative overflow-hidden rounded-md border text-left hover:border-primary">
              {m.preview ? <img src={m.preview} alt={m.tags} loading="lazy" className="aspect-video w-full object-cover" /> : <video src={m.url} muted className="aspect-video w-full object-cover" />}
              <span className="absolute left-1 top-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] uppercase">{m.type}</span>
            </button>
          ))}
        </div>
      ) : <p className="mt-3 text-sm text-muted-foreground">No results. Try other keywords.</p>)}
    </div>
  );
}
