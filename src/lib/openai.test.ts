import { describe, expect, it, vi } from "vitest";
import { DEFAULT_OPENAI_TEXT_MODEL, openAIError, requestOpenAI } from "./openai.server";
import { formatProductionScript, productionScriptSchema, scriptPrompt, scriptSchema, storyPrompt, storySchema } from "./text-generation";

const story = { idea: " A boy saves his village ", genre: "Moral", length: "Short (1–2 min)", language: "Telugu" };
const script = { topic: "A boy saves his village", tone: "Dramatic", duration: "60 seconds", language: "Telugu" };
describe("shared OpenAI story and script integration", () => {
  it.each(["Telugu", "English", "Hindi"])("supports existing %s language on both generators", (language) => {
    expect(storySchema.parse({ ...story, language }).language).toBe(language);
    expect(scriptSchema.parse({ ...script, language }).language).toBe(language);
  });
  it("validates idea and existing genre and length selections", () => {
    expect(storySchema.parse(story).idea).toBe("A boy saves his village");
    for (const input of [{ ...story, idea: " " }, { ...story, idea: "a".repeat(2001) }, { ...story, genre: "Unknown" }, { ...story, length: "Unknown" }, { ...story, language: "Unknown" }]) expect(storySchema.safeParse(input).success).toBe(false);
  });
  it("validates script input, tone and duration", () => {
    for (const input of [{ ...script, topic: " " }, { ...script, tone: "Unknown" }, { ...script, duration: "Unknown" }, { ...script, sourceStory: "" }]) expect(scriptSchema.safeParse(input).success).toBe(false);
  });
  it("passes selected genre and narrated length to story generation", () => {
    const prompt = storyPrompt(storySchema.parse({ ...story, genre: "Horror", length: "Long (8–10 min)" }));
    expect(prompt).toContain("Horror"); expect(prompt).toContain("Long (8–10 min)"); expect(prompt).toContain("Telugu script");
  });
  it("preserves the complete source story and selected script settings", () => {
    const source = "రాము గ్రామాన్ని కాపాడాడు. చివరికి అందరూ సంతోషించారు.";
    const prompt = scriptPrompt(scriptSchema.parse({ ...script, tone: "Emotional", duration: "3 minutes" }), source);
    expect(prompt).toContain(source); expect(prompt).toContain("Emotional"); expect(prompt).toContain("3 minutes"); expect(prompt).toContain("Preserve the story's characters");
  });
  it("retains scene directions and dialogue in the script but only spoken lines in voice output", () => {
    const parsed = productionScriptSchema.parse({ title: "గ్రామం", scenes: [{ description: "గ్రామంలో ఉదయం", visuals: "పచ్చని పొలాలు", narration: "రాము గ్రామానికి వచ్చాడు.", dialogue: [{ character: "రాము", text: "నేను మీకు సహాయం చేస్తాను." }] }, { description: "ముగింపు", visuals: "అందరూ నవ్వుతున్నారు", narration: "గ్రామం సంతోషంగా ఉంది.", dialogue: [] }] });
    const result = formatProductionScript(parsed);
    expect(result.script).toContain("పచ్చని పొలాలు");
    expect(result.narration).toBe("రాము గ్రామానికి వచ్చాడు.\nనేను మీకు సహాయం చేస్తాను.\n\nగ్రామం సంతోషంగా ఉంది.");
    expect(productionScriptSchema.safeParse({ title: "test", scenes: [] }).success).toBe(false);
  });
  it("calls OpenAI directly with the configurable economical model", async () => {
    const fetcher = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: " Complete story " } }] })));
    expect(await requestOpenAI({ key: "test-only-key", prompt: "story" }, fetcher)).toBe("Complete story");
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(JSON.parse(init.body).model).toBe(DEFAULT_OPENAI_TEXT_MODEL);
    await requestOpenAI({ key: "test-only-key", model: "custom-model", prompt: "script", jsonSchema: { name: "script", schema: { type: "object" } } }, fetcher);
    const body = JSON.parse(fetcher.mock.calls[1]?.[1].body);
    expect(body.model).toBe("custom-model"); expect(body.response_format.json_schema.strict).toBe(true);
  });
  it("does not make a request without the key", async () => {
    const fetcher = vi.fn();
    await expect(requestOpenAI({ key: undefined, prompt: "story" }, fetcher)).rejects.toThrow("not configured");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([[401, undefined, "API key"], [429, "insufficient_quota", "balance"], [429, undefined, "rate limit"], [503, undefined, "unavailable"], [404, "model_not_found", "model"], [403, undefined, "permission"]])("handles OpenAI status %s without exposing provider details", async (status, code, message) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code, message: "private provider details" } }), { status: Number(status) }));
    await expect(requestOpenAI({ key: "test-only-key", prompt: "story" }, fetcher)).rejects.toThrow(String(message));
    expect(openAIError(Number(status), typeof code === "string" ? code : undefined)).not.toContain("private provider details");
  });
  it.each([[{}, "no text"], [{ choices: [{ finish_reason: "length", message: { content: "partial" } }] }, "incomplete"], [{ choices: [{ message: { refusal: "blocked" } }] }, "revise"]])("rejects unusable output", async (body, message) => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
    await expect(requestOpenAI({ key: "test-only-key", prompt: "story" }, fetcher)).rejects.toThrow(message);
  });
  it("handles network errors and timeouts", async () => {
    await expect(requestOpenAI({ key: "test-only-key", prompt: "story" }, vi.fn().mockRejectedValue(new TypeError("network")))).rejects.toThrow("Could not read");
    await expect(requestOpenAI({ key: "test-only-key", prompt: "story" }, vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")))).rejects.toThrow("too long");
  });
});