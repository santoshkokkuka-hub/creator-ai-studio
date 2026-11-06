import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Smartphone } from "lucide-react";
import { PageHeader, Panel, Field, Input, Textarea, ActionButton, Notice, useServiceAction } from "@/components/studio";
import { ImagePicker, type PickedImage } from "@/components/ImagePicker";
import { createShort } from "@/lib/ai-services";

export const Route = createFileRoute("/shorts")({
  head: () => ({ meta: [
    { title: "YouTube Shorts Maker (9:16) — Creator AI Studio" },
    { name: "description", content: "Create vertical 9:16 YouTube Shorts with captions." },
    { property: "og:title", content: "YouTube Shorts Maker (9:16) — Creator AI Studio" },
    { property: "og:description", content: "Create vertical 9:16 YouTube Shorts with captions." },
  ] }),
  component: ShortsPage,
});

function ShortsPage() {
  const [title, setTitle] = useState("");
  const [script, setScript] = useState("");
  const [captions, setCaptions] = useState(true);
  const [images, setImages] = useState<PickedImage[]>([]);
  const a = useServiceAction<Blob>();
  return (
    <>
      <PageHeader title="YouTube Shorts Maker" description="Vertical 9:16 videos, up to 60 seconds." />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Panel title="Content">
            <div className="space-y-4">
              <Field label="Short title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Did you know this about Hyderabad?" /></Field>
              <Field label="Script / narration"><Textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Paste or write your short script" /></Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} className="h-4 w-4 accent-primary" />
                Add captions
              </label>
            </div>
          </Panel>
          <Panel title="Images"><ImagePicker images={images} onChange={setImages} max={10} /></Panel>
        </div>
        <div className="space-y-4">
          <Panel title="9:16 Preview">
            <div className="relative mx-auto flex aspect-[9/16] w-full max-w-[220px] items-center justify-center overflow-hidden rounded-2xl border bg-muted">
              {images[0] ? <img src={images[0].url} alt="" className="h-full w-full object-cover" /> : <Smartphone className="h-8 w-8 text-muted-foreground" />}
              {title && <p className="absolute inset-x-3 bottom-4 rounded bg-background/80 px-2 py-1 text-center text-xs font-semibold">{title}</p>}
            </div>
          </Panel>
          {a.error && <Notice>{a.error}</Notice>}
          <ActionButton className="w-full" loading={a.loading} disabled={!title.trim() || images.length === 0}
            onClick={() => a.run(() => createShort({ title, script, captions, imageCount: images.length }))}>
            Create Short
          </ActionButton>
        </div>
      </div>
    </>
  );
}
