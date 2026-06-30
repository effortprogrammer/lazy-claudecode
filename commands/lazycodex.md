---
description: "Delegate a task to Codex via LazyCodex"
argument-hint: "<task description>"
allowed-tools: Bash(codex:*), Bash(npx:*), Bash(export:*)
---

Forward the user's task to OpenAI Codex CLI and return the result verbatim.

Raw slash-command arguments:
`$ARGUMENTS`

## Execution rules

- Use exactly one `Bash` call to invoke Codex.
- The `codex` binary may not be on PATH (e.g. nvm, volta, or non-default node installs).
  Prepend common locations before invoking:
  ```bash
  export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ 2>/dev/null | tail -1)/bin:$HOME/.volta/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH" 2>/dev/null; codex exec --skip-git-repo-check -s workspace-write "$ARGUMENTS"
  ```
- For read-only tasks (review, investigation, explaining code): use `-s review` instead of `-s workspace-write`.
- Preserve the user's task text as-is. Do not rewrite, summarize, or expand it.
- Return Codex's stdout exactly as-is. Do not add commentary before or after.
- If the Bash call fails or Codex cannot be invoked, return the error message and stop.
- If `codex` is still not found, suggest: `npm install -g @openai/codex`

## What you must NOT do

- Do not inspect the repository yourself.
- Do not read files, grep, or do any independent work.
- Do not summarize or condense Codex's output.
- Do not run multiple Codex invocations.
- Do not attempt to fix issues yourself if Codex fails.
