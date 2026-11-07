<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project architecture
- Story and script generation share one fetch-based server-only OpenAI client; read the key and optional model setting inside handlers so secrets never enter the browser bundle.
- Production scripts store their source story and clean scene narration together in the current project; the voice handoff uses clean narration so directions are not spoken.
- Telugu narration uses a typed server function calling Sarvam directly with the existing server secret; it never routes through the Lovable AI gateway because the requested voice integration excludes gateway credits.
- The root current-project provider persists the active draft and WAV Blob in browser IndexedDB, not expiring object URLs; this is browser-local only until account project storage exists.
- Keep project context and its hook separate from the provider and retain the context object in Vite hot data; even context-module refreshes must preserve identity while routes and providers refresh independently.
- Long narration is split into sentence-aware provider-sized requests and joined as PCM WAV; retry resumes completed chunks to avoid duplicate generation charges.
