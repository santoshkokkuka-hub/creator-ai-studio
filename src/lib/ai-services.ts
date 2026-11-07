import type { ScriptInput, StoryInput } from "./text-generation";
/** Unconnected video features stay explicit — no fake output is produced. */
export class NotConfiguredError extends Error {
  constructor(feature: string) {
    super(`${feature} is not connected yet. An AI service will be added later.`);
    this.name = "NotConfiguredError";
  }
}

export type StoryRequest = StoryInput;
export type ScriptRequest = ScriptInput;
export interface VoiceRequest { text: string; voice: string; speed: number }
export interface ImageToVideoRequest { imageCount: number; transition: string; secondsPerImage: number; aspect: "16:9" | "9:16" }
export interface ShortsRequest { title: string; script: string; captions: boolean; imageCount: number }

export async function createVideoFromImages(_req: ImageToVideoRequest): Promise<Blob> {
  throw new NotConfiguredError("Image to Video Maker");
}
export async function createShort(_req: ShortsRequest): Promise<Blob> {
  throw new NotConfiguredError("YouTube Shorts Maker");
}
