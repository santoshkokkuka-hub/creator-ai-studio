import { afterEach, describe, expect, it, vi } from "vitest";
import { joinWavAudio, splitNarration } from "./voice";
import { requestSarvamVoice } from "./voice.server";

function wav(samples: number[]) {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const label = (offset: number, value: string) => bytes.set([...value].map(c => c.charCodeAt(0)), offset);
  label(0, "RIFF"); view.setUint32(4, bytes.length - 8, true); label(8, "WAVE"); label(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 22050, true); view.setUint32(28, 44100, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  label(36, "data"); view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, i) => view.setInt16(44 + i * 2, sample, true));
  return btoa(String.fromCharCode(...bytes));
}
const readBlob = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.onerror = reject; reader.readAsArrayBuffer(blob);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("Telugu narration", () => {
  it("keeps all narration within Sarvam's 2500-character request limit", () => {
    const text = "ఒక చిన్న గ్రామంలో ఒక బాలుడు ఉండేవాడు. ".repeat(220);
    const chunks = splitNarration(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(chunk => chunk.length <= 2500)).toBe(true);
    expect(chunks.join(" ")).toBe(text.trim());
  });
  it("joins complete WAV PCM into one playable file in narration order", async () => {
    const blob = joinWavAudio([wav([100, 200]), wav([300, 400])]);
    const buffer = await readBlob(blob);
    const view = new DataView(buffer);
    expect(blob.type).toBe("audio/wav");
    expect(buffer.byteLength).toBe(52);
    expect(view.getUint32(4, true)).toBe(44);
    expect(view.getUint32(40, true)).toBe(8);
    expect([0, 1, 2, 3].map(i => view.getInt16(44 + 2 * i, true))).toEqual([100, 200, 300, 400]);
  });
  it("calls Sarvam directly with Telugu language and the selected speaker and pace", async () => {
    const audio = wav([100]);
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ audios: [audio] })));
    vi.stubGlobal("fetch", fetcher);
    expect(await requestSarvamVoice({ text: "తెలుగు కథ", voice: "Female — Ritu", speed: 1.2 }, "test-only-key")).toEqual({ audio, error: null });
    const call = fetcher.mock.calls[0];
    if (!call) throw new Error("Expected a Sarvam request");
    expect(call[0]).toBe("https://api.sarvam.ai/text-to-speech");
    const request = call[1];
    expect(JSON.parse(request.body)).toEqual({ text: "తెలుగు కథ", language_code: "te-IN", speaker: "ritu", model: "bulbul:v3", pace: 1.2, speech_sample_rate: 22050 });
    expect(request.headers["api-subscription-key"]).toBe("test-only-key");
  });
  it("reports missing configuration without calling a provider", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const result = await requestSarvamVoice({ text: "కథ", voice: "Male — Shubh", speed: 1 }, undefined);
    expect(result.audio).toBeNull(); expect(result.error).toContain("SARVAM_API_KEY"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("returns a retryable error without exposing provider response bodies", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private provider diagnostic", { status: 429 })));
    const result = await requestSarvamVoice({ text: "కథ", voice: "Male — Shubh", speed: 1 }, "test-only-key");
    expect(result.audio).toBeNull(); expect(result.error).toContain("retry"); expect(result.error).not.toContain("private provider diagnostic");
  });
});