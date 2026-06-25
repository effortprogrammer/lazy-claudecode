---
name: comment-checker
description: "Use when Claude Code needs to understand or respond to automatic comment-checker feedback emitted after a file edit PostToolUse hook."
---

# Comment Checker

The hook registers a PostToolUse handler for Edit, Write, and MultiEdit tool calls.

When comment-checker reports a warning after an edit, Claude Code receives blocking feedback and should fix or explain the flagged comment before moving on.

## Scope
- No MCP tool is exposed — this is purely hook-driven feedback
- Fires only on successful file-write tool calls
- Checks the entire edited file, not just the diff

## What It Flags
1. **TODO/FIXME/HACK without ticket** — e.g. `// TODO: fix later` → should be `// TODO(PROJ-123): fix later`
2. **Obvious/redundant comments** — e.g. `// increment counter` above `counter++`
3. **Commented-out code blocks** — 3+ consecutive commented lines that look like code
4. **Self-evident comments** — comments that restate what the code already says

## How to Respond
- If the warning is valid: fix the comment (add ticket ref, remove redundant comment, or delete commented-out code)
- If the warning is a false positive: briefly explain why the comment is needed and proceed
