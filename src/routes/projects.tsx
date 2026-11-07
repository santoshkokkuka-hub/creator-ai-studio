import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, Plus } from "lucide-react";
import { PageHeader, Panel, EmptyState, Button } from "@/components/studio";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [
    { title: "My Projects — Creator AI Studio" },
    { name: "description", content: "All your saved stories, scripts and video projects." },
    { property: "og:title", content: "My Projects — Creator AI Studio" },
    { property: "og:description", content: "All your saved stories, scripts and video projects." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="My Projects" description="Your saved stories, scripts and videos." />
        <Link to="/story"><Button><Plus className="h-4 w-4" />New project</Button></Link>
      </div>
      <Panel>
        <EmptyState icon={FolderKanban} title="No projects yet" text="Projects will be saved here once saving is enabled." />
      </Panel>
    </>
  );
}
