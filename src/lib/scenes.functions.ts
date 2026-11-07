import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface SceneMedia { type: "image" | "video"; preview: string; url: string; pageUrl: string; tags: string }
export interface Scene { text: string; keywords: string; media: SceneMedia | null }

async function searchPixabay(key: string, q: string, kind: "all" | "image" | "video"): Promise<SceneMedia[]> {
  const query = encodeURIComponent(q.slice(0, 90));
  const out: SceneMedia[] = [];
  const reqs: Promise<void>[] = [];
  if (kind !== "video") reqs.push(fetch(`https://pixabay.com/api/?key=${key}&q=${query}&image_type=photo&safesearch=true&per_page=12`).then(async (r) => {
    if (!r.ok) { console.error("Pixabay image", r.status); return; }
    const j = (await r.json()) as { hits?: { webformatURL: string; largeImageURL: string; pageURL: string; tags: string }[] };
    for (const h of j.hits ?? []) out.push({ type: "image", preview: h.webformatURL, url: h.largeImageURL, pageUrl: h.pageURL, tags: h.tags });
  }));
  if (kind !== "image") reqs.push(fetch(`https://pixabay.com/api/videos/?key=${key}&q=${query}&safesearch=true&per_page=8`).then(async (r) => {
    if (!r.ok) { console.error("Pixabay video", r.status); return; }
    const j = (await r.json()) as { hits?: { pageURL: string; tags: string; videos: Record<string, { url: string; thumbnail?: string }> }[] };
    for (const h of j.hits ?? []) {
      const v = h.videos["small"] ?? h.videos["tiny"] ?? h.videos["medium"];
      if (v?.url) out.push({ type: "video", preview: v.thumbnail ?? "", url: v.url, pageUrl: h.pageURL, tags: h.tags });
    }
  }));
  await Promise.all(reqs);
  return out;
}

export const splitStoryIntoScenesFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ story: z.string().trim().min(1).max(20000) }).parse(d))
  .handler(async ({ data }): Promise<{ scenes: Scene[] | null; error: string | null }> => {
    const gKey = process.env["GEMINI_API_KEY"];
    const pKey = process.env["PIXABAY_API_KEY"];
    if (!gKey) return { scenes: null, error: "Gemini API key is not set up yet." };
    if (!pKey) return { scenes: null, error: "Pixabay API key (PIXABAY_API_KEY) is not set up yet." };
    const prompt = `Divide the following story into logical scenes (3 to 10). Keep each scene's text exactly in the original language and wording, covering the whole story in order. For each scene give 2-4 short English stock-media search keywords describing its visuals (no names).
Return ONLY JSON: [{"text": "...", "keywords": "..."}]

Story:
${data.story}`;
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": gKey },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "low" } } }),
      });
      if (!res.ok) {
        console.error("Gemini scenes error", res.status, await res.text());
        return { scenes: null, error: res.status === 429 || res.status === 503 ? "Gemini is busy right now. Please wait a minute and try again." : "Could not split the story into scenes. Please try again." };
      }
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const raw = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      const parsed = z.array(z.object({ text: z.string(), keywords: z.string() })).safeParse(JSON.parse(raw.replace(/^```json|```$/g, "").trim()));
      if (!parsed.success || !parsed.data.length) return { scenes: null, error: "Scenes could not be read. Please try again." };
      const scenes = await Promise.all(parsed.data.map(async (s) => {
        const results = await searchPixabay(pKey, s.keywords, "all").catch(() => []);
        const media = results.find((m) => m.type === "video") ?? results[0] ?? null;
        return { text: s.text.trim(), keywords: s.keywords.trim(), media };
      }));
      return { scenes, error: null };
    } catch (e) {
      console.error(e);
      return { scenes: null, error: "Could not create scenes. Please try again." };
    }
  });

export const searchMediaFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ query: z.string().trim().min(1).max(100), kind: z.enum(["all", "image", "video"]) }).parse(d))
  .handler(async ({ data }): Promise<{ results: SceneMedia[]; error: string | null }> => {
    const pKey = process.env["PIXABAY_API_KEY"];
    if (!pKey) return { results: [], error: "Pixabay API key (PIXABAY_API_KEY) is not set up yet." };
    try { return { results: await searchPixabay(pKey, data.query, data.kind), error: null }; }
    catch (e) { console.error(e); return { results: [], error: "Pixabay search failed. Please try again." }; }
  });
