# AGENTS.md

Rules for every AI coding agent working in this repo (Claude Code, Codex, Cursor, …).

## Project
Static portfolio site (plain HTML/CSS/JS, served by GitHub Pages via `CNAME`). No build step, no framework, no package manager. Keep it that way unless asked.

## Work like a senior engineer
- Read the code you touch first. Match its naming, style and comment density.
- Smallest complete change: reuse what exists → browser/platform feature → existing library → new minimal code. Never add a dependency for a few lines.
- Finish the whole change: every page, link, and asset path it affects.
- Fix root causes, not symptoms. Don't guess — verify (open the page, check paths).
- Never cut: accessibility (alt text, contrast, keyboard), security, mobile layout, performance (optimized images/video, `loading="lazy"`).
- No secrets, API keys or tokens in the repo.
- If a request is ambiguous and the answer changes the work, ask one short question.

## Save tokens
- Be terse. No restating the task, no long summaries.
- Use the knowledge graph (`graphify query`) before broad grep/reads when `graphify-out/` exists.
- Read only the lines you need; don't re-read files you just edited.

## Skills available
- `/ponytail [lite|full|ultra]` — lazy-senior-dev mode (default: full, always on). Also `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`.
- `/graphify .` — build/refresh the codebase knowledge graph.
