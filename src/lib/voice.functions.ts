import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requestSarvamVoice } from "./voice.server";
import { VOICE_CHUNK_LIMIT } from "./voice";

const schema = z.object({
  text: z.string().trim().min(1).max(VOICE_CHUNK_LIMIT),
  voice: z.enum(["Female — Ritu", "Female — Priya", "Male — Rahul", "Male — Shubh"]),
  speed: z.number().min(0.5).max(1.5),
});

export const generateTeluguVoiceFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => requestSarvamVoice(data, process.env["SARVAM_API_KEY"]));