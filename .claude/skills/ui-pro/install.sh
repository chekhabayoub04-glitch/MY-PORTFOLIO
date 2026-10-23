#!/usr/bin/env bash
# Installs the ui-pro and ui-ux-pro-max skills for every project on this computer
# and registers the 21st.dev MCP server with your API key.
# Run: bash <(curl -fsSL https://raw.githubusercontent.com/chekhabayoub04-glitch/MY-PORTFOLIO/main/.claude/skills/ui-pro/install.sh)
# Add --new-key to replace a saved key.
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
rc=~/.zshrc
touch "$rc"
# Reuse a key saved by an earlier run unless --new-key is passed.
KEY=""
if [[ ${1:-} != --new-key ]]; then
  KEY=$(sed -n 's/^export API_KEY_21ST="\(.*\)"$/\1/p' "$rc" | tail -1)
fi
if [[ -n $KEY ]]; then
  echo "    Using the key already saved in $rc"
else
  printf "    Paste your key (it stays hidden) and press Enter: "
  read -rs KEY </dev/tty
  echo
fi
# Drop spaces, line breaks and other stray characters picked up while pasting.
KEY=$(printf %s "$KEY" | LC_ALL=C tr -cd 'A-Za-z0-9_')
if [[ ! $KEY =~ ^21st_sk_[A-Za-z0-9]{20,}$ ]] || [[ ${KEY:8} == *21st_sk_* ]]; then
  echo "    That does not look like one 21st key (got ${#KEY} characters)."
  echo "    Copy it with the copy icon at https://21st.dev/settings/security, paste it once, and run:"
  echo "      bash <(curl -fsSL <this installer URL>) --new-key"
  exit 1
fi
echo "    Key looks valid: ${#KEY} characters, ends with ...${KEY: -4}"

# Keep the key in the shell profile so project .mcp.json files can read API_KEY_21ST.
grep -v '^export API_KEY_21ST=' "$rc" > "$tmp/rc" || true
echo "export API_KEY_21ST=\"$KEY\"" >> "$tmp/rc"
cat "$tmp/rc" > "$rc"
echo "    Saved API_KEY_21ST in $rc"

echo "3/3 Registering the 21st MCP server for all projects..."
# The VS Code extension ships its own Claude Code when the CLI is not on PATH.
CLAUDE=()
if command -v claude >/dev/null 2>&1; then
  CLAUDE=(claude)
else
  bin=$(find ~/.local/bin ~/.claude/local ~/.vscode/extensions ~/.cursor/extensions -maxdepth 5 \
    -path '*claude*' -name claude -type f -perm -u+x 2>/dev/null | sort | tail -1 || true)
  js=$(find ~/.vscode/extensions ~/.cursor/extensions -maxdepth 5 \
    -path '*anthropic.claude-code-*' -name cli.js -type f 2>/dev/null | sort | tail -1 || true)
  if [[ -n $bin ]]; then
    CLAUDE=("$bin")
  elif [[ -n $js ]] && command -v node >/dev/null 2>&1; then
    CLAUDE=(node "$js")
  fi
fi
if (( ${#CLAUDE[@]} )); then
  "${CLAUDE[@]}" mcp remove -s user 21st >/dev/null 2>&1 || true
  "${CLAUDE[@]}" mcp add -s user --transport http 21st https://21st.dev/api/mcp --header "x-api-key: $KEY"
else
  echo "    Claude Code command not found. Install it with:"
  echo "      curl -fsSL https://claude.ai/install.sh | bash"
  echo "    then run this installer again (it will reuse your saved key)."
  exit 1
fi

echo
echo "Done. Quit VS Code completely (Cmd+Q), open it again, then type /mcp in Claude Code."
