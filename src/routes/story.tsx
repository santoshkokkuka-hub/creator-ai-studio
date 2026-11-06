import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { PageHeader, Panel, Field, Textarea, Select, ActionButton, Notice, EmptyState, useServiceAction } from "@/components/studio";
import { generateStory } from "@/lib/ai-services";

export const Route = createFileRoute("/story")({
  head: () => ({ meta: [
    { title: "AI Story Generator — Creator AI Studio" },
    { name: "description", content: "Turn a simple idea into a story for your next YouTube video." },
    { property: "og:title", content: "AI Story Generator — Creator AI Studio" },
    { property: "og:description", content: "Turn a simple idea into a story for your next YouTube video." },
  ] }),
  component: StoryPage,
});

function StoryPage() {
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("Moral");
  const [length, setLength] = useState("Short (1–2 min)");
  const [language, setLanguage] = useState("Telugu");
  const a = useServiceAction<string>();
  return (
    <>
      <PageHeader title="AI Story Generator" description="Describe your idea and choose a style." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Story details">
          <div className="space-y-4">
            <Field label="Story idea"><Textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="e.g. A village boy who dreams of becoming a pilot" /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Genre"><Select value={genre} onChange={(e) => setGenre(e.target.value)} options={["Moral", "Kids", "Horror", "Comedy", "Motivational", "Mythology"]} /></Field>
              <Field label="Length"><Select value={length} onChange={(e) => setLength(e.target.value)} options={["Short (1–2 min)", "Medium (3–5 min)", "Long (8–10 min)"]} /></Field>
              <Field label="Language"><Select value={language} onChange={(e) => setLanguage(e.target.value)} options={["Telugu", "English", "Hindi"]} /></Field>
            </div>
            <ActionButton loading={a.loading} disabled={!idea.trim()} onClick={() => a.run(() => generateStory({ idea, genre, length, language }))}>Generate story</ActionButton>
          </div>
        </Panel>
        <Panel title="Result">
          {a.error && <div className="mb-4"><Notice>{a.error}</Notice></div>}
          {a.result ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{a.result}</p> : <EmptyState icon={BookOpen} title="No story yet" text="Your generated story will appear here." />}
        </Panel>
      </div>
    </>
  );
}
