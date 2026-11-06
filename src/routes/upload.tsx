import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel, Button } from "@/components/studio";
import { ImagePicker, type PickedImage } from "@/components/ImagePicker";

export const Route = createFileRoute("/upload")({
  head: () => ({ meta: [
    { title: "Image Upload — Creator AI Studio" },
    { name: "description", content: "Upload and arrange images to use in your videos." },
    { property: "og:title", content: "Image Upload — Creator AI Studio" },
    { property: "og:description", content: "Upload and arrange images to use in your videos." },
  ] }),
  component: UploadPage,
});

function UploadPage() {
  const [images, setImages] = useState<PickedImage[]>([]);
  return (
    <>
      <PageHeader title="Image Upload" description="Add the images you want in your video." />
      <Panel title={`Images (${images.length})`}>
        <ImagePicker images={images} onChange={setImages} />
        {images.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/image-to-video"><Button>Continue to Image to Video</Button></Link>
            <Button variant="secondary" onClick={() => setImages([])}>Clear all</Button>
          </div>
        )}
      </Panel>
    </>
  );
}
