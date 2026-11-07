import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, FileText } from "lucide-react";
import { PageHeader, Panel, Field, Textarea, Select, ActionButton, Button, Notice, EmptyState, useServiceAction } from "@/components/studio";
import { generateScriptFn } from "@/lib/script.functions";
import type { ScriptInput } from "@/lib/text-generation";
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
  const [tone, setTone] = useState<ScriptInput["tone"]>("Informative");
  const [duration, setDuration] = useState<ScriptInput["duration"]>("60 seconds");
  const [language, setLanguage] = useState<ScriptInput["language"]>("Telugu");
  const a = useServiceAction<string>();
  const { project, ready, saveScript } = useCurrentProject();
  const generateScript = useServerFn(generateScriptFn);
  useEffect(() => {
    if (ready && project?.story) setTopic((current) => current || project.story || "");
  }, [ready, project?.story]);
  return (
    <>
      <PageHeader title="AI Script Generator" description="Get a scene-by-scene script for your video." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Script details">
          <div className="space-y-4">
            <Button variant="secondary" disabled={a.loading || !project?.story} onClick={() => setTopic(project?.story ?? "")}><BookOpen className="h-4 w-4" />Use story</Button>
            <Field label="Video topic"><Textarea value={topic} disabled={a.loading} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. 5 facts about the Godavari river" /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tone"><Select value={tone} onChange={(e) => setTone(e.target.value as ScriptInput["tone"])} options={["Informative", "Funny", "Emotional", "Dramatic", "Casual"]} /></Field>
              <Field label="Duration"><Select value={duration} onChange={(e) => setDuration(e.target.value as ScriptInput["duration"])} options={["30 seconds", "60 seconds", "3 minutes", "5 minutes", "10 minutes"]} /></Field>
              <Field label="Language"><Select value={language} onChange={(e) => setLanguage(e.target.value as ScriptInput["language"])} options={["Telugu", "English", "Hindi"]} /></Field>
            </div>
            <ActionButton loading={a.loading} disabled={!topic.trim() || !ready} onClick={() => a.run(async () => {
              const sourceStory = topic.trim() === project?.story?.trim() ? project.story : undefined;
              const result = await generateScript({ data: { topic, tone, duration, language, ...(sourceStory ? { sourceStory } : {}) } });
              if (result.error || !result.script || !result.story || !result.narration) throw new Error(result.error ?? "No complete script was returned. Please retry.");
              saveScript?.(result.story, result.script, result.narration);
              return result.script;
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
