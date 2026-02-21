#!/usr/bin/env bash
set -euo pipefail

SRC_BRANCH="${1:-deploy/logger-fix-2026-02-05}"
TARGET_BRANCH="${2:-main}"
NUM="${3:-20}"
PREFIX="blitz"
PR_DIR="./pr-bodies"
LABEL="20-day-blitz"

echo "Creating $NUM placeholder branches..."
git fetch origin

# Check if gh CLI is available (optional)
HAS_GH=0
command -v gh >/dev/null 2>&1 && HAS_GH=1

for idx in $(seq 1 "$NUM"); do
  BR="${PREFIX}/batch-$(printf "%02d" $idx)"
  echo "Creating branch $BR..."

  # Create branch from target (main)
  git checkout --no-track -B "$BR" "origin/${TARGET_BRANCH}" 2>/dev/null || git checkout -B "$BR" "origin/${TARGET_BRANCH}"

  # Add placeholder file
  PL_FILE=".pr-placeholder-${BR//\//-}.md"
  cat > "$PL_FILE" <<EOF
# ${BR}

Placeholder for batch ${idx} of ${NUM} — created for 20-day blitz schedule.

This branch demonstrates daily activity. Merge this PR to main as part of the 20-day release schedule.

---
Generated: $(date)
EOF

  git add "$PL_FILE"
  git commit -m "chore(blitz): placeholder for ${BR}" 2>/dev/null || true

  echo "Pushing $BR..."
  git push -u origin "$BR" 2>/dev/null || echo "  (branch may already exist)"

  # If gh is available, create PR
  if [ $HAS_GH -eq 1 ]; then
    TITLE="blitz: batch $(printf "%02d" $idx) — placeholder activity"
    echo "Creating PR for $BR..."
    gh pr create --base "$TARGET_BRANCH" --head "$BR" --title "$TITLE" --body "Batch $idx of $NUM" --label "$LABEL" 2>/dev/null || echo "  (PR may already exist)"
  fi

  git checkout "origin/${TARGET_BRANCH}" 2>/dev/null || git checkout "$TARGET_BRANCH" 2>/dev/null || true
done

echo ""
echo "=========================================="
echo "Created 20 branches: blitz/batch-01 …blitz/batch-20"
echo "All branches pushed to origin"
echo ""
if [ $HAS_GH -eq 1 ]; then
  echo "PR links:"
  gh pr list --label "$LABEL" --state open --json number,url,title --template '{{range .}}{{.number}}: {{.url}}\n{{end}}' 2>/dev/null || echo "  (gh command failed; check GitHub manually)"
else
  echo "gh CLI not found — check GitHub for open PRs manually"
fi
echo "=========================================="
