import { VOICES, VOICE_SAMPLE_RATE, type VoiceName } from "./voice";

export async function requestSarvamVoice(data: { text: string; voice: VoiceName; speed: number }, key: string | undefined) {
  if (!key) return { audio: null, error: "SARVAM_API_KEY is not configured. Please add it in project secrets." };
  try {
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": key },
      body: JSON.stringify({ text: data.text, language_code: "te-IN", speaker: VOICES[data.voice], model: "bulbul:v3", pace: data.speed, speech_sample_rate: VOICE_SAMPLE_RATE }),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) {
      // Never log response bodies: provider diagnostics can contain private narration.
      console.error("Sarvam TTS request failed", response.status);
      const error = response.status === 401 || response.status === 403 ? "Sarvam rejected the API key or access. Check the Sarvam account configuration."
        : response.status === 402 ? "Your Sarvam account has insufficient credits. Check your Sarvam balance."
        : response.status === 429 ? "Sarvam is busy or the account limit was reached. Wait a moment, then retry."
        : response.status === 400 || response.status === 422 ? "Sarvam could not process this narration. Check the text and voice settings, then retry."
        : "Sarvam is temporarily unavailable. Please retry.";
      return { audio: null, error };
    }
    const payload = await response.json() as { audios?: unknown };
    if (!Array.isArray(payload.audios) || payload.audios.length !== 1 || typeof payload.audios[0] !== "string" || !payload.audios[0]) return { audio: null, error: "Sarvam returned no usable audio. Please retry." };
    return { audio: payload.audios[0], error: null };
  } catch {
    return { audio: null, error: "Could not reach Sarvam or the request timed out. Please retry." };
  }
}