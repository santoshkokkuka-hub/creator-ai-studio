# Image to Video — automatic media mode
- [x] Add Automatic Media (default) / Manual Upload mode toggle; manual upload unchanged.
- [x] Automatic mode: reuse current-project story, split into scenes via existing Gemini+Pixabay server function, auto-select media per scene.
- [x] Scene preview with manual media replacement (shared MediaPicker), no-media notice, retry button.
- [x] Wire selected scene media count into the existing Create Video settings/flow.

Remaining: actual video rendering is still not connected (Create Video shows the honest "not connected yet" notice in both modes) — no fake success is shown.

# Shared OpenAI story and script integration
- [ ] Connect both generators through one server-only OpenAI client using the existing secret and a configurable economical model.
- [ ] Preserve existing controls and results; reuse the current story for scripts, or create a story from a short idea first.
- [ ] Keep scene narration available for the existing voice handoff without changing Sarvam or media/video flows.
- [ ] Test requests, language/settings, errors and the real story-to-script flow; report provider blockers honestly.
