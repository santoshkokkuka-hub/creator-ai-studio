import { useEffect, useRef, useState, type ReactNode } from "react";
import { ProjectContext, type CurrentProject, type NarrationAsset } from "./current-project-context";

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("creator-ai-current-project", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("project");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Could not open browser project storage."));
  });
}

async function readProject(): Promise<CurrentProject | null> {
  const db = await openStore();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("project").objectStore("project").get("current");
      request.onsuccess = () => resolve((request.result as CurrentProject | undefined) ?? null);
      request.onerror = () => reject(new Error("Could not restore the current project."));
    });
  } finally { db.close(); }
}

async function writeProject(project: CurrentProject): Promise<void> {
  const db = await openStore();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("project", "readwrite");
      tx.objectStore("project").put(project, "current");
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(new Error("Could not save narration in this browser."));
    });
  } finally { db.close(); }
}

export function CurrentProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<CurrentProject | null>(null);
  const current = useRef<CurrentProject | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    readProject().then((saved) => {
      if (active) { current.current = saved; setProject(saved); }
    }).catch(() => {
      if (active) setStorageError("Browser saving is unavailable. Download your audio to keep it.");
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const update = (next: CurrentProject) => {
    current.current = next; setProject(next);
    const pending = queue.current.catch(() => {}).then(() => writeProject(next));
    queue.current = pending;
    pending.then(() => setStorageError(null)).catch(() => setStorageError("Could not save this project in your browser. Download the audio to keep it."));
    return pending;
  };
  const ensureProject = () => {
    const existing = current.current;
    if (existing) return existing.id;
    const next = { id: crypto.randomUUID() };
    void update(next).catch(() => {});
    return next.id;
  };
  const setContent = (source: "story" | "script", text: string) => {
    if (!ready) return;
    const existing = current.current;
    if (existing?.[source] === text) return;
    // A newly generated story starts a new current project; a script attaches to it.
    const next: CurrentProject = source === "story" || !existing ? { id: crypto.randomUUID(), [source]: text } : { ...existing, script: text, scriptNarration: undefined, narration: undefined };
    void update(next).catch(() => {});
  };
  const saveNarration = async (asset: NarrationAsset, projectId: string) => {
    const existing = current.current;
    if (!existing || existing.id !== projectId) throw new Error("The current project changed. Generate narration again for this project.");
    await update({ ...existing, narration: asset });
  };
  const saveScript = (story: string, script: string, narration: string) => {
    if (!ready) return;
    const existing = current.current;
    const next: CurrentProject = { ...(existing?.story === story ? existing : { id: crypto.randomUUID() }), story, script, scriptNarration: narration, narration: undefined };
    void update(next).catch(() => {});
  };
  return <ProjectContext.Provider value={{ project, ready, storageError, setContent, saveScript, ensureProject, saveNarration }}>{children}</ProjectContext.Provider>;
}

