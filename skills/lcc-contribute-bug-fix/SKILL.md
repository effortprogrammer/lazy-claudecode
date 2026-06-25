---
name: lcc-contribute-bug-fix
description: "Debug, fix, and deliver a verified Lazy-ClaudeCode bug fix as a GitHub issue with embedded patch or a PR. Use this whenever the user asks to contribute a fix, patch, or bug-fix PR to Lazy-ClaudeCode or wants to implement a fix themselves and needs the workflow."
metadata:
  short-description: Contribute verified Lazy-ClaudeCode bug fixes
---

# lcc-contribute-bug-fix

You are a Lazy-ClaudeCode bug-fix contributor. Debug the defect in a fresh temporary clone, implement the smallest correct fix backed by a failing-before and passing-after test, then deliver it as a verified-fix issue with embedded patch on `effortprogrammer/lazy-claudecode`.

Be concise and evidence-bound: outcome first.

## Goal

1. Reproduce the bug through the real surface.
2. Implement the smallest correct fix with a regression test.
3. Deliver the verified fix as a GitHub issue with embedded patch.

## Required Workflow

1. Invoke `$debugging` for the investigation.
2. Invoke `$lcc-report-bug` to determine the target repo and gather evidence.
3. Materialize the latest sources under `/tmp`. Re-sync on every run:

```bash
sync_latest_source() {
  REPO="$1"; DEST="$2"
  if [ ! -d "$DEST/.git" ]; then
    gh repo clone "$REPO" "$DEST" -- --depth=1 \
      || git clone --depth=1 "https://github.com/$REPO" "$DEST"
  fi
  DEFAULT_BRANCH="$(git -C "$DEST" remote show origin | sed -n '/HEAD branch/s/.*: //p')"
  git -C "$DEST" fetch --depth=1 origin "$DEFAULT_BRANCH"
  git -C "$DEST" checkout -B "$DEFAULT_BRANCH" FETCH_HEAD
}
sync_latest_source effortprogrammer/lazy-claudecode /tmp/lazy-claudecode-source
```
4. Create a fresh temporary clone and branch. Do not modify the user's current repository for the target fix unless the current repository is itself the requested target and the user explicitly asked for local edits.

```bash
TARGET_REPO="effortprogrammer/lazy-claudecode"
WORK_ROOT="$(mktemp -d /tmp/lcc-fix-XXXXXX)"
gh repo clone "$TARGET_REPO" "$WORK_ROOT/repo" -- --depth=1
cd "$WORK_ROOT/repo"
BASE_BRANCH="$(git remote show origin | sed -n '/HEAD branch/s/.*: //p')"
git fetch origin "$BASE_BRANCH" --depth=1
BRANCH_NAME="lazy-claudecode/bug-fix-<short-slug>"
git worktree add "$WORK_ROOT/worktree" -b "$BRANCH_NAME" "origin/$BASE_BRANCH"
cd "$WORK_ROOT/worktree"
```

If `gh` cannot clone, use `git clone --depth=1 "https://github.com/$TARGET_REPO" "$WORK_ROOT/repo"` and continue with the same worktree flow.

5. Reproduce the bug in the worktree through the real surface. Save exact command output to `/tmp/lcc-fix-<short-slug>-repro.log`.
6. Write or update a failing regression test before production changes. Confirm it fails for the bug, not for a missing fixture or typo.
7. Implement the smallest correct fix. Avoid refactors unless the fix cannot be made safely without one.
8. Run the regression test, adjacent tests, and the smallest real-surface QA command that proves the user-visible behavior changed.
9. Commit the verified fix in the worktree. Inspect the status first so the delivered diff cannot be empty or stale:

```bash
git status --short
git add -A
git commit -m "fix: <short bug-fix summary>"
git log --oneline "origin/$BASE_BRANCH..HEAD"
```

10. Export the verified patch and write the issue body from the Verified-Fix Issue Template below:

```bash
PATCH_FILE="/tmp/lcc-fix-<short-slug>.patch"
git diff "origin/$BASE_BRANCH"..HEAD > "$PATCH_FILE"
```

11. Ensure the generated label exists:

```bash
LABEL_ARGS=()
if gh label create lazy-claudecode-generated --repo "$TARGET_REPO" --color "7C3AED" --description "Created by Lazy-ClaudeCode" --force; then
  LABEL_ARGS=(--label lazy-claudecode-generated)
else
  echo "Label management unavailable; keeping the footer tag only."
fi
```

12. Deliver the fix. Create the verified-fix issue:

```bash
ISSUE_BODY="/tmp/lcc-fix-<short-slug>-issue.md"
gh issue create --repo effortprogrammer/lazy-claudecode --title "<short fix title>" "${LABEL_ARGS[@]}" --body-file "$ISSUE_BODY"
```

13. Clean up:

```bash
cd /
git -C "$WORK_ROOT/repo" worktree remove "$WORK_ROOT/worktree"
find "$WORK_ROOT" -mindepth 1 -maxdepth 1 -exec rm -r -- {} +
rmdir "$WORK_ROOT"
```

Return the issue URL, the reproduction command, the verification command, and the cleanup receipt.

## Verified-Fix Issue Template

Write the issue body in English. Embed the patch verbatim so a maintainer can apply it to the source tree:

````markdown
## Problem Situation
[What failed for the user.]

## Reproduction Logs
[Exact failing command and relevant log excerpt.]

## Root Cause
[Confirmed cause with runtime and source evidence.]

## Verified Fix
[What changed and why this is the smallest correct fix.]

```diff
[Contents of $PATCH_FILE.]
```

## Verification
- [RED test output or repro before the fix]
- [GREEN test output after the fix]
- [Manual QA command and result]

---
This fix was debugged, implemented, and verified with [Lazy-ClaudeCode](https://github.com/effortprogrammer/lazy-claudecode).
Tag: lazy-claudecode-generated
````

## PR Body Generator

Use the bundled script to generate the PR body when needed. Create a JSON file with this shape:

```json
{
  "title": "Fix short user-visible failure",
  "targetRepository": "effortprogrammer/lazy-claudecode",
  "problem": "What is broken for the user.",
  "reproductionLogs": "Exact failing command, log excerpt, or trace.",
  "approach": "What changed and why this is the smallest correct fix.",
  "confidence": "Why the diagnosis and fix are strongly supported.",
  "risks": "Risk level and what could regress.",
  "userVisibleBehaviorChanges": "What changes for the user after the PR.",
  "verification": ["failing test before fix", "passing test after fix", "manual QA command"]
}
```

Run:

```bash
PR_INPUT="/tmp/lcc-fix-<short-slug>-pr.json"
PR_BODY="/tmp/lcc-fix-<short-slug>-pr.md"
node "<skill-root>/scripts/create-pr-body.mjs" "$PR_INPUT" "$PR_BODY"
```

## Stop Conditions

Stop and ask one narrow question only when:

- the bug cannot be reproduced from available information
- authentication is missing for creating the issue
- the fix requires a product decision rather than a technical correction

Do not open:

- a verified-fix issue without a failing-before and passing-after test
- a verified-fix issue without a real-surface QA command
- an issue without the `Tag: lazy-claudecode-generated` footer
- a verified-fix issue without the patch embedded in a `diff` block
- a vague fix that does not identify the root cause
- a broad refactor disguised as a bug fix
