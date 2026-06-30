---
description: "Delegate a task to Claude Code via lazy-claudecode"
argument-hint: "<task description>"
allowed-tools: Bash(claude:*), Bash(npx:*), Bash(export:*), Bash(which:*), Bash(command:*)
---

Forward the user's task to Claude Code CLI and return the result verbatim.

Raw slash-command arguments:
`$ARGUMENTS`

## Execution rules

1. First, locate the `claude` binary. It may not be on PATH in sandbox environments.
   Run a single `Bash` call that:
   - Prepends common bin locations to PATH
   - Invokes `claude` with the user's task

   ```bash
   export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ 2>/dev/null | sort -V | tail -1)/bin:$HOME/.volta/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH" 2>/dev/null; claude -p "$ARGUMENTS" --dangerously-skip-permissions
   ```

2. Preserve the user's task text as-is. Do not rewrite, summarize, or expand it.
3. Return Claude Code's stdout exactly as-is. Do not add commentary before or after.

## If claude is not found

If `claude` is still not found after PATH expansion, show the user this installation guide:

```
❌ Claude Code CLI not found.

Install Claude Code:

  npm install -g @anthropic-ai/claude-code

  Docs: https://docs.anthropic.com/en/docs/claude-code

After installing, re-run /lazycc with your task.
```

Do NOT attempt to install Claude Code yourself or run any other commands.

## What you must NOT do

- Do not inspect the repository yourself.
- Do not read files, grep, or do any independent work.
- Do not summarize or condense Claude Code's output.
- Do not run multiple Claude Code invocations.
- Do not attempt to fix issues yourself if Claude Code fails.
