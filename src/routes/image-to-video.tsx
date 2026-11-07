import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clapperboard, Film, Images, Wand2 } from "lucide-react";
import { PageHeader, Panel, Field, Select, Button, ActionButton, Notice, EmptyState, useServiceAction } from "@/components/studio";
import { ImagePicker, type PickedImage } from "@/components/ImagePicker";
import { MediaPicker, MediaView } from "@/components/SceneBoard";
import { splitStoryIntoScenesFn, type Scene } from "@/lib/scenes.functions";
import { createVideoFromImages } from "@/lib/ai-services";
import { useCurrentProject } from "@/lib/current-project-context";

export const Route = createFileRoute("/image-to-video")({
  head: () => ({ meta: [
    { title: "Image to Video Maker — Creator AI Studio" },
    { name: "description", content: "Turn your images into a smooth YouTube video with transitions." },
    { property: "og:title", content: "Image to Video Maker — Creator AI Studio" },
    { property: "og:description", content: "Turn your images into a smooth YouTube video with transitions." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ImageToVideoPage,
});

function ImageToVideoPage() {
  const [mode, setMode] = useState<"automatic" | "manual">("automatic");
  const [images, setImages] = useState<PickedImage[]>([]);
  const [transition, setTransition] = useState("Fade");
  const [seconds, setSeconds] = useState("4");
  const a = useServiceAction<Blob>();
  const { project, ready } = useCurrentProject();
  const story = project?.story ?? "";

  // Automatic media mode
  const sceneAction = useServiceAction<Scene[]>();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const createScenes = () => sceneAction.run(async () => {
    const r = await splitStoryIntoScenesFn({ data: { story } });
    if (r.error || !r.scenes) throw new Error(r.error ?? "Something went wrong");
    setScenes(r.scenes);
    setEditing(null);
    return r.scenes;
  });
  const scenesWithMedia = scenes.filter((s) => s.media);

  const mediaCount = mode === "automatic" ? scenesWithMedia.length : images.length;
  const canCreate = mode === "automatic" ? scenesWithMedia.length > 0 : images.length > 0;

  return (
    <>
      <PageHeader title="Image to Video Maker" description="Pick images, set timing and transitions." />

      <div className="mb-6 inline-flex rounded-lg border bg-card p-1">
        {([["automatic", "Automatic Media", Wand2], ["manual", "Manual Upload", Images]] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${mode === value ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {mode === "manual" ? (
          <Panel title="Images"><ImagePicker images={images} onChange={setImages} /></Panel>
        ) : (
          <Panel title="Scenes & media">
            {!ready ? null : !story ? (
              <EmptyState icon={Film} title="No story yet" text="Generate a story in the AI Story Generator first — its scenes and media will be used here automatically." />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <ActionButton loading={sceneAction.loading} onClick={createScenes}>
                    {scenes.length ? "Retry: recreate scenes" : "Create scenes & find media"}
                  </ActionButton>
                  <span className="text-xs text-muted-foreground">Media from Pixabay, matched to your story</span>
                </div>
                {sceneAction.error && <div className="mb-4"><Notice>{sceneAction.error}</Notice></div>}
                {!scenes.length ? (
                  <EmptyState icon={Film} title="No scenes yet" text="Split your story into scenes with matching images and videos." />
                ) : (
                  <div className="space-y-4">
                    {!scenesWithMedia.length && <Notice>Pixabay returned no matching media for these scenes. Try recreating scenes or replace the media manually below.</Notice>}
                    {scenes.map((s, i) => (
                      <div key={i} className="grid gap-4 rounded-lg border p-4 md:grid-cols-[240px_1fr]">
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
              </>
            )}
          </Panel>
        )}
        <div className="space-y-6">
          <Panel title="Settings">
            <div className="space-y-4">
              <Field label="Transition"><Select value={transition} onChange={(e) => setTransition(e.target.value)} options={["Fade", "Slide", "Zoom (Ken Burns)", "None"]} /></Field>
              <Field label="Seconds per image"><Select value={seconds} onChange={(e) => setSeconds(e.target.value)} options={["2", "3", "4", "5", "8"]} /></Field>
              <p className="text-xs text-muted-foreground">Format: 16:9 landscape · Est. length {mediaCount * Number(seconds)}s</p>
              <ActionButton className="w-full" loading={a.loading} disabled={!canCreate}
                onClick={() => a.run(() => createVideoFromImages({ imageCount: mediaCount, transition, secondsPerImage: Number(seconds), aspect: "16:9" }))}>
                Create video
              </ActionButton>
            </div>
          </Panel>
          <Panel title="Preview">
            {a.error && <div className="mb-4"><Notice>{a.error}</Notice></div>}
            <div className="aspect-video"><EmptyState icon={Clapperboard} title="No video yet" text="Your video preview will show here." /></div>
          </Panel>
        </div>
      </div>
    </>
  );
}
