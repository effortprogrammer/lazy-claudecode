---
description: "Delegate a task to Claude Code via lazy-claudecode"
argument-hint: "<task description>"
allowed-tools: Bash(claude:*)
---

Forward the user's task to Claude Code CLI and return the result verbatim.

Raw slash-command arguments:
`$ARGUMENTS`

## Execution rules

- Use exactly one `Bash` call to invoke Claude Code.
- Command format:
  ```bash
  claude -p "$ARGUMENTS" --dangerously-skip-permissions
  ```
- Preserve the user's task text as-is. Do not rewrite, summarize, or expand it.
- Return Claude Code's stdout exactly as-is. Do not add commentary before or after.
- If the Bash call fails or Claude Code cannot be invoked, return the error message and stop.

## What you must NOT do

- Do not inspect the repository yourself.
- Do not read files, grep, or do any independent work.
- Do not summarize or condense Claude Code's output.
- Do not run multiple Claude Code invocations.
- Do not attempt to fix issues yourself if Claude Code fails.
