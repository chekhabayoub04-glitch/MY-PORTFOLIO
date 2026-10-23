#!/usr/bin/env bash
# Installs the ui-pro and ui-ux-pro-max skills for every project on this computer
# and registers the 21st.dev MCP server with your API key.
# Run: bash <(curl -fsSL https://raw.githubusercontent.com/chekhabayoub04-glitch/MY-PORTFOLIO/main/.claude/skills/ui-pro/install.sh)
set -euo pipefail

REPO=https://github.com/chekhabayoub04-glitch/MY-PORTFOLIO.git
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "1/3 Downloading skills..."
git clone -q --depth 1 "$REPO" "$tmp/repo"
mkdir -p ~/.claude/skills
for s in ui-pro ui-ux-pro-max; do
  rm -rf ~/.claude/skills/"$s"
  cp -R "$tmp/repo/.claude/skills/$s" ~/.claude/skills/
done
echo "    Installed to ~/.claude/skills/ui-pro and ~/.claude/skills/ui-ux-pro-max"

echo "2/3 21st.dev API key"
printf "    Paste your key (it stays hidden) and press Enter: "
read -rs KEY </dev/tty
echo
if [[ $KEY != 21st_sk_* ]]; then
  echo "    The key must start with 21st_sk_. Copy it from https://21st.dev/settings/security and run again."
  exit 1
fi

# Keep the key in the shell profile so project .mcp.json files can read API_KEY_21ST.
rc=~/.zshrc
touch "$rc"
grep -v '^export API_KEY_21ST=' "$rc" > "$tmp/rc" || true
echo "export API_KEY_21ST=\"$KEY\"" >> "$tmp/rc"
cat "$tmp/rc" > "$rc"
echo "    Saved API_KEY_21ST in $rc"

echo "3/3 Registering the 21st MCP server for all projects..."
if command -v claude >/dev/null 2>&1; then
  claude mcp remove -s user 21st >/dev/null 2>&1 || true
  claude mcp add -s user --transport http 21st https://21st.dev/api/mcp --header "x-api-key: $KEY"
else
  echo "    'claude' command not found: skipped. Projects with a .mcp.json (like MY-PORTFOLIO) still work."
fi

echo
echo "Done. Quit VS Code completely (Cmd+Q), open it again, then type /mcp in Claude Code."
