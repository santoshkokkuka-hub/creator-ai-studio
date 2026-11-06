/**
 * Service layer for future AI integrations.
 * Each function is the single place to wire a real provider (via a server function).
 * Until then they reject with NotConfiguredError — no fake output is produced.
 */
export class NotConfiguredError extends Error {
  constructor(feature: string) {
    super(`${feature} is not connected yet. An AI service will be added later.`);
    this.name = "NotConfiguredError";
  }
}

export interface StoryRequest { idea: string; genre: string; length: string; language: string }
export interface ScriptRequest { topic: string; tone: string; duration: string; language: string }
export interface VoiceRequest { text: string; voice: string; speed: number }
export interface ImageToVideoRequest { imageCount: number; transition: string; secondsPerImage: number; aspect: "16:9" | "9:16" }
export interface ShortsRequest { title: string; script: string; captions: boolean; imageCount: number }

export async function generateStory(_req: StoryRequest): Promise<string> {
  throw new NotConfiguredError("AI Story Generator");
}
export async function generateScript(_req: ScriptRequest): Promise<string> {
  throw new NotConfiguredError("AI Script Generator");
}
export async function generateTeluguVoice(_req: VoiceRequest): Promise<Blob> {
  throw new NotConfiguredError("Telugu AI Voice Generator");
}
export async function createVideoFromImages(_req: ImageToVideoRequest): Promise<Blob> {
  throw new NotConfiguredError("Image to Video Maker");
}
export async function createShort(_req: ShortsRequest): Promise<Blob> {
  throw new NotConfiguredError("YouTube Shorts Maker");
}
