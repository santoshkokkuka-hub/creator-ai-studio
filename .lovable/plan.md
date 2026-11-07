# Connect Story and Script to OpenAI

- Replace the Story Generator's provider call with the existing OpenAI key, keeping its controls and result area.
- Connect the Script Generator using the same reusable server-only integration. Reuse the current generated story, or expand a short idea into a complete story before creating its script.
- Produce consistent scene-by-scene scripts with narration, dialogue, descriptions and visual suggestions. Keep narration separate for the existing voice handoff.
- Preserve the current design and leave Pixabay, Sarvam, scene/media selection and video rendering unchanged.
- Verify both generators with real requests and test settings, validation and provider errors. Report any account or service limitations.

## Technical details
- Use fetch-based OpenAI calls with `OPENAI_API_KEY` read only inside server handlers and `OPENAI_TEXT_MODEL` configurable, defaulting to an economical supported model.
- Reuse existing service interfaces, current-project storage and shared controls; no duplicate pages or database changes.
- Handle invalid keys, insufficient balance, rate limits, timeouts, incomplete output and service failures without exposing provider details or secrets.