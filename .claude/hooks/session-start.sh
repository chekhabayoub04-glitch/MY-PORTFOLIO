#!/bin/bash
# Installs the pinned graphify CLI in fresh cloud containers so the graphify hooks work.
set -euo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
command -v graphify >/dev/null 2>&1 || uv tool install -q "graphifyy==0.9.89"
