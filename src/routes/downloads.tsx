import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/studio";

export const Route = createFileRoute("/downloads")({
  head: () => ({ meta: [
    { title: "Download Videos — Creator AI Studio" },
    { name: "description", content: "Download your finished YouTube videos and Shorts." },
    { property: "og:title", content: "Download Videos — Creator AI Studio" },
    { property: "og:description", content: "Download your finished YouTube videos and Shorts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DownloadsPage,
});

function DownloadsPage() {
  return (
    <>
      <PageHeader title="Download Videos" description="Finished videos and Shorts ready to download." />
      <Panel>
        <EmptyState icon={Download} title="No videos to download" text="Videos you create will appear here for download." />
      </Panel>
    </>
  );
}
