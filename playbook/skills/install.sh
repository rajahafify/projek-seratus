#!/usr/bin/env bash
# Installs the skills listed in skills.lock into .claude/skills/ at the repo root.
# Fetched, not committed: transitions.dev may be used but not redistributed.
# Safe to run again: a source already at its pinned commit is skipped.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)
dest="$root/.claude/skills"
mkdir -p "$dest"
grep -vE '^\s*(#|$)' "$here/skills.lock" | while read -r repo commit paths; do
  stamp="$dest/.$(echo "$repo" | tr / _).commit"
  if [ "$(cat "$stamp" 2>/dev/null)" = "$commit" ]; then continue; fi
  tmp=$(mktemp -d)
  git -C "$tmp" init -q
  git -C "$tmp" remote add origin "https://github.com/$repo"
  git -C "$tmp" fetch -q --depth 1 origin "$commit"
  git -C "$tmp" checkout -q FETCH_HEAD
  for p in $paths; do
    name=$(basename "$p")
    rm -rf "${dest:?}/$name"
    cp -R "$tmp/$p" "$dest/$name"
  done
  echo "$commit" > "$stamp"
  rm -rf "$tmp"
  echo "installed $repo@${commit:0:7}"
done
# The playwright-cli skill calls a playwright-cli command.
command -v playwright-cli >/dev/null || npm install -g @playwright/cli@latest >/dev/null 2>&1 || echo "playwright-cli not installed: use npx playwright instead"
