import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  idea: z.string().trim().min(1).max(2000),
  genre: z.string().max(50),
  length: z.string().max(50),
  language: z.string().max(30),
});

export const generateStoryFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["GEMINI_API_KEY"];
    if (!key) return { story: null, error: "Gemini API key is not set up yet." };

    const prompt = `Write a complete, engaging ${data.genre} story in ${data.language} for a YouTube video narration.
Length: ${data.length}.
Story idea: ${data.idea}
Write entirely in ${data.language}${data.language === "Telugu" ? " script" : ""}. Include a title on the first line, a clear beginning, middle and satisfying ending. Return only the story text.`;

    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { thinkingConfig: { thinkingLevel: "low" } } }),
        },
      );
      if (!res.ok) {
        console.error("Gemini error", res.status, await res.text());
        const msg =
          res.status === 429 || res.status === 503 ? "Gemini is busy right now. Please wait a minute and try again."
          : res.status === 400 || res.status === 401 || res.status === 403 ? "Gemini rejected the request. Please check your API key."
          : "The story service is unavailable. Please try again.";
        return { story: null, error: msg };
      }
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const story = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
      if (!story) return { story: null, error: "No story was returned. Try changing your idea." };
      return { story, error: null };
    } catch (e) {
      console.error(e);
      return { story: null, error: "Could not reach the story service. Please try again." };
    }
  });
