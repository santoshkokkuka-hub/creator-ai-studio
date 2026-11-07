import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AudioLines, Download, BookOpen, FileText } from "lucide-react";
import { PageHeader, Panel, Field, Textarea, Select, ActionButton, Button, Notice, EmptyState } from "@/components/studio";
import { generateTeluguVoiceFn } from "@/lib/voice.functions";
import { joinWavAudio, splitNarration, VOICES, VOICE_SAMPLE_RATE, type VoiceName } from "@/lib/voice";
import { useCurrentProject, type NarrationAsset } from "@/lib/current-project-context";

export const Route = createFileRoute("/voice")({
  head: () => ({ meta: [
    { title: "Telugu AI Voice Generator — Creator AI Studio" },
    { name: "description", content: "Convert Telugu text into a natural voice-over for your videos." },
    { property: "og:title", content: "Telugu AI Voice Generator — Creator AI Studio" },
    { property: "og:description", content: "Convert Telugu text into a natural voice-over for your videos." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: VoicePage,
});

function VoicePage() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<VoiceName>("Female — Ritu");
  const [speed, setSpeed] = useState(1);
  const [source, setSource] = useState<NarrationAsset["source"]>("custom");
  const [audio, setAudio] = useState<NarrationAsset | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const initialized = useRef(false);
  const mounted = useRef(true);
  const retry = useRef<{ text: string; voice: VoiceName; speed: number; parts: string[]; chunks: string[]; projectId: string; source: NarrationAsset["source"] } | null>(null);
  const { project, ready, storageError, ensureProject, saveNarration } = useCurrentProject();
  const generateVoice = useServerFn(generateTeluguVoiceFn);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!ready || initialized.current) return;
    initialized.current = true;
    const asset = project?.narration;
    if (asset) {
      setAudio(asset); setText(asset.text); setVoice(asset.voice); setSpeed(asset.speed); setSource(asset.source); setSaved(!storageError);
    } else if (project?.story || project?.script) {
      setText(project.story ?? project.scriptNarration ?? project.script ?? ""); setSource(project.story ? "story" : "script");
    }
  }, [ready, project, storageError]);
  useEffect(() => {
    if (!audio) { setUrl(null); return; }
    const objectUrl = URL.createObjectURL(audio.file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [audio]);

  const generate = async () => {
    const narration = text.trim();
    if (!narration || loading || !ready) return;
    setLoading(true); setError(null); setSaved(false);
    const projectId = ensureProject();
    let job = retry.current;
    if (!job || job.text !== narration || job.voice !== voice || job.speed !== speed || job.projectId !== projectId || job.source !== source) {
      job = { text: narration, voice, speed, projectId, source, parts: [], chunks: splitNarration(narration) };
      retry.current = job;
    }
    try {
      // Sequential short requests avoid server timeouts; retry resumes completed chunks.
      for (let i = job.parts.length; i < job.chunks.length; i += 1) {
        if (!mounted.current) return;
        setProgress(`${i + 1} / ${job.chunks.length}`);
        const result = await generateVoice({ data: { text: job.chunks[i], voice: job.voice, speed: job.speed } });
        if (result.error || !result.audio) throw new Error(result.error ?? "No audio was returned. Please retry.");
        job.parts.push(result.audio);
      }
      if (!mounted.current) return;
      const asset: NarrationAsset = { file: joinWavAudio(job.parts), filename: `creator-ai-${projectId}-telugu.wav`, mimeType: "audio/wav", text: narration, voice, speed, language: "te-IN", sampleRate: VOICE_SAMPLE_RATE, createdAt: new Date().toISOString(), source };
      setAudio(asset);
      try { await saveNarration(asset, projectId); if (mounted.current) setSaved(true); }
      catch { if (mounted.current) setError("Audio is ready but could not be saved to this project. Download it to keep it."); }
      retry.current = null;
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "Voice generation failed. Please retry.");
    } finally { if (mounted.current) { setLoading(false); setProgress(""); } }
  };
  const useText = (kind: "story" | "script") => {
    setText(kind === "script" ? project?.scriptNarration ?? project?.script ?? "" : project?.story ?? ""); setSource(kind); setError(null);
  };
  const download = () => {
    if (!url || !audio) return;
    const link = document.createElement("a"); link.href = url; link.download = audio.filename; link.click();
  };
  return (
    <>
      <PageHeader title="Telugu AI Voice Generator" description="Paste Telugu text and pick a voice." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Voice settings">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={loading || !project?.story} onClick={() => useText("story")}><BookOpen className="h-4 w-4" />Use story</Button>
              <Button variant="secondary" disabled={loading || !project?.script} onClick={() => useText("script")}><FileText className="h-4 w-4" />Use script</Button>
            </div>
            <Field label="Telugu text" hint={`${text.length} characters`}><Textarea lang="te" disabled={loading} value={text} onChange={(e) => { setText(e.target.value); setSource("custom"); }} placeholder="ఇక్కడ మీ తెలుగు వచనాన్ని టైప్ చేయండి..." /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Voice"><Select disabled={loading} value={voice} onChange={(e) => { if (e.target.value in VOICES) setVoice(e.target.value as VoiceName); }} options={Object.keys(VOICES)} /></Field>
              <Field label={`Speed: ${speed.toFixed(1)}x`}><input disabled={loading} type="range" min={0.5} max={1.5} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="mt-3 w-full accent-primary" /></Field>
            </div>
            <ActionButton loading={loading} disabled={!text.trim() || !ready} onClick={generate}>{loading ? `Generating ${progress}` : error && retry.current ? "Retry voice" : "Generate voice"}</ActionButton>
          </div>
        </Panel>
        <Panel title="Audio">
          {error && <div className="mb-4" role="alert"><Notice>{error}</Notice></div>}
          {storageError && <div className="mb-4"><Notice>{storageError}</Notice></div>}
          {url ? <div className="space-y-4">
            <audio controls src={url} className="w-full" aria-label="Telugu narration preview" />
            <Button variant="secondary" onClick={download}><Download className="h-4 w-4" />Download audio</Button>
            {saved && !storageError && <p className="text-xs text-muted-foreground">Saved to current project · This browser</p>}
          </div> : <EmptyState icon={AudioLines} title="No audio yet" text="Your voice-over will play here." />}
        </Panel>
      </div>
    </>
  );
}
