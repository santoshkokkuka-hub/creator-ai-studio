import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen } from "lucide-react";
import { PageHeader, Panel, Field, Textarea, Select, ActionButton, Notice, EmptyState, useServiceAction } from "@/components/studio";
import { generateStoryFn } from "@/lib/story.functions";
import type { StoryInput } from "@/lib/text-generation";
import { SceneBoard } from "@/components/SceneBoard";
import { useCurrentProject } from "@/lib/current-project-context";

export const Route = createFileRoute("/story")({
  head: () => ({ meta: [
    { title: "AI Story Generator — Creator AI Studio" },
    { name: "description", content: "Turn a simple idea into a story for your next YouTube video." },
    { property: "og:title", content: "AI Story Generator — Creator AI Studio" },
    { property: "og:description", content: "Turn a simple idea into a story for your next YouTube video." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: StoryPage,
});

function StoryPage() {
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState<StoryInput["genre"]>("Moral");
  const [length, setLength] = useState<StoryInput["length"]>("Short (1–2 min)");
  const [language, setLanguage] = useState<StoryInput["language"]>("Telugu");
  const a = useServiceAction<string>();
  const { setContent, ready } = useCurrentProject();
  const generateStory = useServerFn(generateStoryFn);
  return (
    <>
      <PageHeader title="AI Story Generator" description="Describe your idea and choose a style." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Story details">
          <div className="space-y-4">
            <Field label="Story idea"><Textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="e.g. A village boy who dreams of becoming a pilot" /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Genre"><Select value={genre} onChange={(e) => setGenre(e.target.value as StoryInput["genre"])} options={["Moral", "Kids", "Horror", "Comedy", "Motivational", "Mythology"]} /></Field>
              <Field label="Length"><Select value={length} onChange={(e) => setLength(e.target.value as StoryInput["length"])} options={["Short (1–2 min)", "Medium (3–5 min)", "Long (8–10 min)"]} /></Field>
              <Field label="Language"><Select value={language} onChange={(e) => setLanguage(e.target.value as StoryInput["language"])} options={["Telugu", "English", "Hindi"]} /></Field>
            </div>
            <ActionButton loading={a.loading} disabled={!idea.trim() || !ready} onClick={() => a.run(async () => {
              const result = await generateStory({ data: { idea, genre, length, language } });
              if (result.error || !result.story) throw new Error(result.error ?? "No story was returned. Please retry.");
              const story = result.story;
              setContent("story", story);
              return story;
            })}>Generate story</ActionButton>
          </div>
        </Panel>
        <Panel title="Result">
          {a.error && <div className="mb-4"><Notice>{a.error}</Notice></div>}
          {a.result ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{a.result}</p> : <EmptyState icon={BookOpen} title="No story yet" text="Your generated story will appear here." />}
        </Panel>
      </div>
      {a.result && <SceneBoard key={a.result} story={a.result} />}
    </>
  );
}
