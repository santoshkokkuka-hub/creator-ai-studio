import { createServerFn } from "@tanstack/react-start";
import { storySchema, storyPrompt } from "./text-generation";
import { requestOpenAI } from "./openai.server";

export const generateStoryFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => storySchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const story = await requestOpenAI({ key: process.env["OPENAI_API_KEY"], model: process.env["OPENAI_TEXT_MODEL"], prompt: storyPrompt(data) });
      return { story, error: null };
    } catch (e) {
      return { story: null, error: e instanceof Error ? e.message : "Story generation failed. Please retry." };
    }
  });
