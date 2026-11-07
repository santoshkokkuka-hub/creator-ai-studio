import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader, Panel, Field, Input, Select, ActionButton, Notice, EmptyState, useServiceAction } from "@/components/studio";
import { generateScript } from "@/lib/ai-services";
import { useCurrentProject } from "@/lib/current-project-context";

export const Route = createFileRoute("/script")({
  head: () => ({ meta: [
    { title: "AI Script Generator — Creator AI Studio" },
    { name: "description", content: "Write a structured YouTube video script with intro, scenes and outro." },
    { property: "og:title", content: "AI Script Generator — Creator AI Studio" },
    { property: "og:description", content: "Write a structured YouTube video script with intro, scenes and outro." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ScriptPage,
});

function ScriptPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Informative");
  const [duration, setDuration] = useState("60 seconds");
  const [language, setLanguage] = useState("Telugu");
  const a = useServiceAction<string>();
  const { setContent } = useCurrentProject();
  return (
    <>
      <PageHeader title="AI Script Generator" description="Get a scene-by-scene script for your video." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Script details">
          <div className="space-y-4">
            <Field label="Video topic"><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. 5 facts about the Godavari river" /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tone"><Select value={tone} onChange={(e) => setTone(e.target.value)} options={["Informative", "Funny", "Emotional", "Dramatic", "Casual"]} /></Field>
              <Field label="Duration"><Select value={duration} onChange={(e) => setDuration(e.target.value)} options={["30 seconds", "60 seconds", "3 minutes", "5 minutes", "10 minutes"]} /></Field>
              <Field label="Language"><Select value={language} onChange={(e) => setLanguage(e.target.value)} options={["Telugu", "English", "Hindi"]} /></Field>
            </div>
            <ActionButton loading={a.loading} disabled={!topic.trim()} onClick={() => a.run(async () => {
              const script = await generateScript({ topic, tone, duration, language });
              setContent("script", script);
              return script;
            })}>Generate script</ActionButton>
          </div>
        </Panel>
        <Panel title="Script">
          {a.error && <div className="mb-4"><Notice>{a.error}</Notice></div>}
          {a.result ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{a.result}</p> : <EmptyState icon={FileText} title="No script yet" text="Your script will appear here, ready to edit." />}
        </Panel>
      </div>
    </>
  );
}
