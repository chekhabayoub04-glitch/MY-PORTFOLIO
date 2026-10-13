# OmniRoute (optional, run on your own machine)

OmniRoute is an open-source (MIT) local AI gateway: one OpenAI/Anthropic-compatible endpoint that routes to many providers, including free tiers, with fallback.
Official repo: https://github.com/diegosouzapw/OmniRoute — install only from there.

It is **not** committed to this repo: it is a local server that holds your provider API keys, so it belongs on your computer, not in a public portfolio.

## Safe setup
1. Check the repo's README and Security advisories first; use the latest release.
2. Run it locally only (bind to `127.0.0.1`, never expose the port to the internet). Set a dashboard password.
3. Add your provider keys inside OmniRoute's dashboard — never in this repo or in `.claude/settings.json`.
4. Point Claude Code at it for one shell only:
   ```bash
   export ANTHROPIC_BASE_URL=http://127.0.0.1:<port>
   export ANTHROPIC_AUTH_TOKEN=<omniroute-key>
   claude
   ```

## Know before you use it
- Requests routed to free providers are answered by **those models**, not Claude. Quality differs.
- Each provider's free-tier limits and terms still apply; there is no truly "unlimited" Claude.
- Avoid any setup that reuses someone else's Claude subscription/session tokens — that breaks Anthropic's terms and can get accounts banned.
