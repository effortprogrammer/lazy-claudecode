---
name: lazycc
description: "Delegate a task to Claude Code CLI"
---

# LazyCC — Delegate to Claude Code

Forward the current task to Claude Code CLI and return the result verbatim.

## Usage

```bash
/lazycc <task description>
```

## Execution

Run a single shell command to invoke Claude Code:

```bash
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ 2>/dev/null | sort -V | tail -1)/bin:$HOME/.volta/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH" 2>/dev/null; claude -p "{{ARGUMENTS}}" --dangerously-skip-permissions
```

## Rules

1. Preserve the user's task text as-is. Do not rewrite, summarize, or expand it.
2. Return Claude Code's stdout exactly as-is. Do not add commentary before or after.
3. Do not inspect the repository yourself.
4. Do not read files, grep, or do any independent work.
5. Do not run multiple Claude Code invocations.

## If claude is not found

If `claude` is not found after PATH expansion, show the user this message and stop:

```
❌ Claude Code CLI not found.

Install Claude Code:

  npm install -g @anthropic-ai/claude-code

  Docs: https://docs.anthropic.com/en/docs/claude-code

After installing, re-run /lazycc with your task.
```

Do NOT attempt to install Claude Code yourself.

Task: {{ARGUMENTS}}
