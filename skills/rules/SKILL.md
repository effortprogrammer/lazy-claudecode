---
name: rules
description: "Use when the user asks about Claude Code rules behavior, injected project rules, supported rule file locations, or environment configuration."
---

# Claude Code Rules

Rules are automatically loaded at session start and after relevant file edits.

## Rule File Locations (priority order)
1. `CLAUDE.md` — Project root instructions (always loaded)
2. `.claude/rules/*.md` — Directory-scoped rules (loaded when editing files in that directory)
3. `AGENTS.md` — Agent-specific instructions
4. `.cursorrules` — Cursor-compatible rules (fallback)

## How Rules Work
- Static rules are injected on SessionStart
- Directory-scoped rules are injected when editing files in matching paths
- Rules are deduplicated per session (won't be re-injected)
- The rules-loader hook handles injection into Claude Code's context

## Writing Effective Rules
- Keep rules concise and actionable
- Use imperative mood: "Always use..." not "It is recommended to use..."
- Group related rules under clear headings
- Include examples of correct and incorrect patterns
