---
name: ui-pro
description: "One entry point for all UI/UX work: combines the ui-ux-pro-max design database (styles, palettes, font pairings, UX/accessibility rules, GSAP presets) with the 21st.dev component library through the 21st MCP server. Use whenever the user says ui-pro, asks to design, build, redesign, polish, explore directions for, or review a page, section, or component, or mentions 21st or ui-ux-pro-max."
---

# UI Pro: design rules + 21st.dev components

Two sources, used together:

| Source | What it gives | How to reach it |
|--------|---------------|-----------------|
| **ui-ux-pro-max** (local, always available) | Styles, palettes, typography, UX/a11y rules, GSAP presets, pre-delivery checklist | `python3 "$UIX/scripts/search.py"` |
| **21st.dev** (online) | Real, production component code and inspiration to adapt | MCP tools `mcp__21st__*` (`search`, `get_component`, `get_usage`, `generate`, `iterate_generation`) |

Run all commands from the project root. `$UIX` is the ui-ux-pro-max skill folder: `.claude/skills/ui-ux-pro-max` when the project has it, otherwise `~/.claude/skills/ui-ux-pro-max` (global install). Resolve it once:

```bash
UIX=.claude/skills/ui-ux-pro-max; [ -d "$UIX" ] || UIX=~/.claude/skills/ui-ux-pro-max
```

`references/21st/` below is relative to this skill's own folder.

## Project facts (read before designing)

- Detect the real stack first (`package.json`, framework config, or plain `*.html`/`css`/`js`) and build in that stack.
- 21st.dev components are mostly React/shadcn/Tailwind. In a project without React/Tailwind, **never paste them in as-is**: translate the structure, spacing, and interaction into semantic HTML, the existing CSS, and vanilla JS.
- Reuse the project's existing tokens, classes, fonts, and theme before adding anything new. Preserve its identity unless the user asks for a redesign.
- MY-PORTFOLIO specifically is static HTML + CSS + vanilla JS (`css/style.css`, `css/noir.css`, `js/`) with a noir theme and no build step.

## Step 0: check what is available

1. Check whether `mcp__21st__*` tools are in your tool list (load them with ToolSearch `+21st`).
   - Available → use the full workflow below.
   - Not available or failing → continue with ui-ux-pro-max only, and tell the user in one line that 21st is offline and why (the network does not allow `21st.dev`, or the 21st API key is missing: in a cloud session, the `x-api-key` network secret for `21st.dev`; on a computer, the `API_KEY_21ST` variable or a `21st` server added with `claude mcp add`). Never invent 21st results.

## Pick the mode

| The user wants | Mode |
|----------------|------|
| Build or change a page, section, or component | **Build** |
| Options, variants, "what could this look like" | **Explore** |
| Audit, QA, "what's wrong with this page" | **Review** |

### Build

1. Read the target HTML/CSS/JS and the closest existing components.
2. Set the design direction with ui-ux-pro-max:
   - New page or whole-site direction: `python3 "$UIX/scripts/search.py" "<product + vibe>" --design-system`
   - One concern: `... search.py "<query>" --domain <style|color|typography|ux|gsap|icons|landing>`
   - Stack rules: `... search.py "<query>" --stack html-tailwind` (apply the HTML parts; ignore Tailwind specifics)
3. Find real components on 21st: MCP `search` with the specific need, then `get_component` for the 1–2 best fits.
4. Only if nothing fits, and `get_usage.aiGenerationEnabled` is true, use `generate`. Otherwise build it yourself, grounded in the search results.
5. Implement in the project's real stack, in its own files and style.
6. Go through the checklist below before you finish.

### Explore

1. Search ui-ux-pro-max (`--design-system` and `--domain style`) and 21st (`search`) for references.
2. Define **three named directions** that differ on at least two real axes (hierarchy, density, layout, interaction, content emphasis). Color-only variants don't count.
3. For each, give: the name, the idea, the references used, what stays consistent, the key differences, and the accessibility/responsive risks.
4. Recommend one, let the user choose, then switch to **Build**.

### Review

1. Read the relevant source files.
2. Check it against `references/pro-rules.md` and `references/quick-reference.md` in `$UIX/`, and against the priorities in `references/21st/ui-review.md`.
3. Report findings ordered by severity with `file:line`. Keep provable defects separate from taste suggestions.
4. Auto-fix only clear, low-risk defects. Never silently redesign.

## Pre-delivery checklist

- Contrast ≥ 4.5:1, visible focus, keyboard reachable, alt text, accessible names on icon buttons
- Touch targets ≥ 44×44px; no hover-only interactions
- Mobile-first; no horizontal scroll at 360px; images lazy-loaded with reserved size
- Base text ≥ 16px, line-height ~1.5, tokens instead of stray hex values
- Animations respect `prefers-reduced-motion`; animate transform/opacity, not width/height
- SVG icons, not emoji; real copy, not placeholders

## More detail when needed

- Full 21st workflows: `references/21st/ui-build.md`, `ui-explore.md`, `ui-review.md`, `cli-use.md`
- Full design rules: `$UIX/SKILL.md` and its `references/`
