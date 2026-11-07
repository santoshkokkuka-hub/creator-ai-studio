import { afterEach, expect, it, vi } from "vitest";
import { requestOpenAI } from "./openai.server";
import { generateScriptFn } from "./script.functions";
import { generateStoryFn } from "./story.functions";

vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({
  inputValidator: (validate: (input: unknown) => unknown) => ({
    handler: (handler: (args: { data: unknown }) => unknown) => (args: { data: unknown }) => handler({ data: validate(args.data) }),
  }),
}) }));
vi.mock("./openai.server", () => ({ requestOpenAI: vi.fn() }));
afterEach(() => vi.resetAllMocks());
const input = { topic: "A boy rescues a bird", tone: "Emotional" as const, duration: "60 seconds" as const, language: "Telugu" as const };
const production = JSON.stringify({ title: "పక్షి", scenes: [{ description: "గ్రామం", visuals: "చెట్టు", narration: "రాము పక్షిని కాపాడాడు.", dialogue: [{ character: "రాము", text: "నువ్వు సురక్షితంగా ఉన్నావు." }] }] });

it("expands a short idea into a story first, then adapts that exact story into a script", async () => {
  vi.mocked(requestOpenAI).mockResolvedValueOnce("రాము పక్షిని కాపాడాడు. పక్షి గ్రామాన్ని కాపాడింది.").mockResolvedValueOnce(production);
  const result = await generateScriptFn({ data: input });
  expect(requestOpenAI).toHaveBeenCalledTimes(2);
  expect(vi.mocked(requestOpenAI).mock.calls[0]?.[0].prompt).toContain(input.topic);
  expect(vi.mocked(requestOpenAI).mock.calls[1]?.[0].prompt).toContain("రాము పక్షిని కాపాడాడు. పక్షి గ్రామాన్ని కాపాడింది.");
  expect(result.story).toBe("రాము పక్షిని కాపాడాడు. పక్షి గ్రామాన్ని కాపాడింది.");
  expect(result.narration).toBe("రాము పక్షిని కాపాడాడు.\nనువ్వు సురక్షితంగా ఉన్నావు.");
  expect(result.error).toBeNull();
});
it("reuses the selected generated story without paying for another story generation", async () => {
  vi.mocked(requestOpenAI).mockResolvedValueOnce(production);
  const sourceStory = "రాము పక్షిని కాపాడాడు.";
  const result = await generateScriptFn({ data: { ...input, sourceStory } });
  expect(requestOpenAI).toHaveBeenCalledTimes(1);
  expect(result.story).toBe(sourceStory);
  expect(vi.mocked(requestOpenAI).mock.calls[0]?.[0].prompt).toContain(sourceStory);
});
it("does not return a usable script after an incomplete structured response", async () => {
  vi.mocked(requestOpenAI).mockResolvedValueOnce('{}');
  const result = await generateScriptFn({ data: { ...input, sourceStory: "source story" } });
  expect(result.script).toBeNull(); expect(result.narration).toBeNull(); expect(result.error).toBeTruthy();
});
it("both generators return provider failures without a fake result", async () => {
  vi.mocked(requestOpenAI).mockRejectedValue(new Error("OpenAI account balance exhausted"));
  const story = await generateStoryFn({ data: { idea: "A bird", genre: "Moral", length: "Short (1–2 min)", language: "English" } });
  const script = await generateScriptFn({ data: input });
  expect(story.story).toBeNull(); expect(story.error).toContain("balance");
  expect(script.script).toBeNull(); expect(script.error).toContain("balance");
});