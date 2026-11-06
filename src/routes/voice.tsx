import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AudioLines } from "lucide-react";
import { PageHeader, Panel, Field, Textarea, Select, ActionButton, Notice, EmptyState, useServiceAction } from "@/components/studio";
import { generateTeluguVoice } from "@/lib/ai-services";

export const Route = createFileRoute("/voice")({
  head: () => ({ meta: [
    { title: "Telugu AI Voice Generator — Creator AI Studio" },
    { name: "description", content: "Convert Telugu text into a natural voice-over for your videos." },
    { property: "og:title", content: "Telugu AI Voice Generator — Creator AI Studio" },
    { property: "og:description", content: "Convert Telugu text into a natural voice-over for your videos." },
  ] }),
  component: VoicePage,
});

function VoicePage() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Female — Warm");
  const [speed, setSpeed] = useState(1);
  const a = useServiceAction<Blob>();
  const url = a.result ? URL.createObjectURL(a.result) : null;
  return (
    <>
      <PageHeader title="Telugu AI Voice Generator" description="Paste Telugu text and pick a voice." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Voice settings">
          <div className="space-y-4">
            <Field label="Telugu text" hint={`${text.length} characters`}><Textarea lang="te" value={text} onChange={(e) => setText(e.target.value)} placeholder="ఇక్కడ మీ తెలుగు వచనాన్ని టైప్ చేయండి..." /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Voice"><Select value={voice} onChange={(e) => setVoice(e.target.value)} options={["Female — Warm", "Female — News", "Male — Deep", "Male — Storyteller"]} /></Field>
              <Field label={`Speed: ${speed.toFixed(1)}x`}><input type="range" min={0.5} max={1.5} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mt-3 w-full accent-primary" /></Field>
            </div>
            <ActionButton loading={a.loading} disabled={!text.trim()} onClick={() => a.run(() => generateTeluguVoice({ text, voice, speed }))}>Generate voice</ActionButton>
          </div>
        </Panel>
        <Panel title="Audio">
          {a.error && <div className="mb-4"><Notice>{a.error}</Notice></div>}
          {url ? <audio controls src={url} className="w-full" /> : <EmptyState icon={AudioLines} title="No audio yet" text="Your voice-over will play here." />}
        </Panel>
      </div>
    </>
  );
}
