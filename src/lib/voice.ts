export const VOICES = {
  "Female — Ritu": "ritu",
  "Female — Priya": "priya",
  "Male — Rahul": "rahul",
  "Male — Shubh": "shubh",
} as const;
export type VoiceName = keyof typeof VOICES;
export const VOICE_CHUNK_LIMIT = 2500;
export const VOICE_SAMPLE_RATE = 22050;

export function splitNarration(text: string): string[] {
  let remaining = text.trim();
  const chunks: string[] = [];
  while (remaining.length > VOICE_CHUNK_LIMIT) {
    const candidate = remaining.slice(0, VOICE_CHUNK_LIMIT);
    const sentenceEnd = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("! "), candidate.lastIndexOf("? "), candidate.lastIndexOf("\n"));
    let end = sentenceEnd > VOICE_CHUNK_LIMIT / 2 ? sentenceEnd + 1 : candidate.lastIndexOf(" ");
    if (end < VOICE_CHUNK_LIMIT / 2) end = VOICE_CHUNK_LIMIT;
    // Never split a surrogate pair.
    if (/[\uD800-\uDBFF]/.test(remaining[end - 1] ?? "")) end -= 1;
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

/** Join PCM data, not WAV containers: concatenating WAV files corrupts playback. */
export function joinWavAudio(encoded: string[]): Blob {
  const parts: Uint8Array[] = [];
  let format: Uint8Array | undefined;
  let length = 0;
  for (const base64 of encoded) {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const view = new DataView(bytes.buffer);
    const label = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));
    if (bytes.length < 44 || label(0) !== "RIFF" || label(8) !== "WAVE") throw new Error("Sarvam returned invalid audio. Please try again.");
    let foundData = false;
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const size = view.getUint32(offset + 4, true);
      if (offset + 8 + size > bytes.length) throw new Error("The audio download was incomplete. Please try again.");
      const chunk = bytes.slice(offset + 8, offset + 8 + size);
      if (label(offset) === "fmt ") {
        if (size < 16 || new DataView(chunk.buffer).getUint16(0, true) !== 1) throw new Error("Unsupported audio format.");
        if (format && (format.length !== chunk.length || format.some((v, i) => v !== chunk[i]))) throw new Error("Audio segments have different formats. Please try again.");
        format = chunk;
      } else if (label(offset) === "data") {
        parts.push(chunk); length += chunk.length; foundData = true;
      }
      offset += 8 + size + size % 2;
    }
    if (!foundData) throw new Error("Sarvam returned no audio. Please try again.");
  }
  if (!format || !length) throw new Error("Sarvam returned no audio. Please try again.");
  const header = new Uint8Array(28 + format.length);
  const view = new DataView(header.buffer);
  const label = (offset: number, value: string) => header.set([...value].map((c) => c.charCodeAt(0)), offset);
  label(0, "RIFF"); view.setUint32(4, header.length + length - 8, true);
  label(8, "WAVE"); label(12, "fmt "); view.setUint32(16, format.length, true); header.set(format, 20);
  label(20 + format.length, "data"); view.setUint32(24 + format.length, length, true);
  return new Blob([header.buffer, ...parts.map(part => new Uint8Array(part).buffer)], { type: "audio/wav" });
}