import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { PageHeader, Panel, Field, Select, ActionButton, Notice, EmptyState, useServiceAction } from "@/components/studio";
import { ImagePicker, type PickedImage } from "@/components/ImagePicker";
import { createVideoFromImages } from "@/lib/ai-services";

export const Route = createFileRoute("/image-to-video")({
  head: () => ({ meta: [
    { title: "Image to Video Maker — Creator AI Studio" },
    { name: "description", content: "Turn your images into a smooth YouTube video with transitions." },
    { property: "og:title", content: "Image to Video Maker — Creator AI Studio" },
    { property: "og:description", content: "Turn your images into a smooth YouTube video with transitions." },
  ] }),
  component: ImageToVideoPage,
});

function ImageToVideoPage() {
  const [images, setImages] = useState<PickedImage[]>([]);
  const [transition, setTransition] = useState("Fade");
  const [seconds, setSeconds] = useState("4");
  const a = useServiceAction<Blob>();
  return (
    <>
      <PageHeader title="Image to Video Maker" description="Pick images, set timing and transitions." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel title="Images"><ImagePicker images={images} onChange={setImages} /></Panel>
        <div className="space-y-6">
          <Panel title="Settings">
            <div className="space-y-4">
              <Field label="Transition"><Select value={transition} onChange={(e) => setTransition(e.target.value)} options={["Fade", "Slide", "Zoom (Ken Burns)", "None"]} /></Field>
              <Field label="Seconds per image"><Select value={seconds} onChange={(e) => setSeconds(e.target.value)} options={["2", "3", "4", "5", "8"]} /></Field>
              <p className="text-xs text-muted-foreground">Format: 16:9 landscape · Est. length {images.length * Number(seconds)}s</p>
              <ActionButton className="w-full" loading={a.loading} disabled={images.length === 0}
                onClick={() => a.run(() => createVideoFromImages({ imageCount: images.length, transition, secondsPerImage: Number(seconds), aspect: "16:9" }))}>
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
