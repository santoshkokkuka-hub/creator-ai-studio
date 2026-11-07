import { createContext, useContext, type Context } from "react";
import type { VoiceName } from "./voice";

export interface NarrationAsset {
  file: Blob;
  filename: string;
  mimeType: "audio/wav";
  text: string;
  voice: VoiceName;
  speed: number;
  language: "te-IN";
  sampleRate: number;
  createdAt: string;
  source: "story" | "script" | "custom";
}
export interface CurrentProject {
  id: string;
  story?: string;
  script?: string;
  scriptNarration?: string | undefined;
  narration?: NarrationAsset | undefined;
}

interface ProjectContextValue {
  project: CurrentProject | null;
  ready: boolean;
  storageError: string | null;
  setContent: (source: "story" | "script", text: string) => void;
  saveScript: (story: string, script: string, narration: string) => void;
  saveNarration: (asset: NarrationAsset, projectId: string) => Promise<void>;
  ensureProject: () => string;
}
// Preserve the context object even when this module itself is hot-reloaded.
// Provider and route modules can refresh at different times, but must share identity.
export function retainProjectContext(cache?: { projectContext?: Context<ProjectContextValue | null> }) {
  const context = cache?.projectContext ?? createContext<ProjectContextValue | null>(null);
  if (cache) cache.projectContext = context;
  return context;
}
export const ProjectContext = retainProjectContext(import.meta.hot?.data);


export function useCurrentProject() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("Current project provider is missing.");
  return context;
}