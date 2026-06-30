---
description: "Delegate a task to Codex via LazyCodex"
argument-hint: "<task description>"
allowed-tools: Bash(codex:*), Bash(npx:*), Bash(export:*), Bash(which:*), Bash(command:*)
---

Forward the user's task to OpenAI Codex CLI and return the result verbatim.

Raw slash-command arguments:
`$ARGUMENTS`

## Execution rules

1. First, locate the `codex` binary. It may not be on PATH in sandbox environments.
   Run a single `Bash` call that:
   - Prepends common bin locations to PATH
   - Invokes `codex exec` with the user's task

   ```bash
   export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ 2>/dev/null | sort -V | tail -1)/bin:$HOME/.volta/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH" 2>/dev/null; codex exec --skip-git-repo-check -s workspace-write "$ARGUMENTS"
   ```

2. For read-only tasks (review, investigation, explaining code): use `-s review` instead of `-s workspace-write`.
3. Preserve the user's task text as-is. Do not rewrite, summarize, or expand it.
4. Return Codex's stdout exactly as-is. Do not add commentary before or after.

## If codex is not found

If `codex` is still not found after PATH expansion, show the user this installation guide:

```
❌ Codex CLI not found.

Install Codex CLI + LazyCodex (recommended):

  1. Install Codex CLI:
     npm install -g @openai/codex

  2. Install LazyCodex (agent harness for Codex):
     npx lazycodex-ai install

  Docs: https://github.com/code-yeongyu/lazycodex

After installing, re-run /lazycodex with your task.
```

Do NOT attempt to install Codex yourself or run any other commands.

## What you must NOT do

- Do not inspect the repository yourself.
- Do not read files, grep, or do any independent work.
- Do not summarize or condense Codex's output.
- Do not run multiple Codex invocations.
- Do not attempt to fix issues yourself if Codex fails.
