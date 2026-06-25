---
name: refactor
description: "Intelligent refactor command for Claude Code. Triggers: refactor, refactoring, cleanup, restructure, extract, simplify, modernize."
---

# Refactor

Systematic refactoring workflow for Claude Code.

## Process
1. **Understand** — Read the target code and its tests. Run tests to confirm green baseline.
2. **Plan** — Identify what to change and why. List specific transformations.
3. **Lock** — Ensure test coverage exists for behavior being preserved. Add tests if missing.
4. **Execute** — Apply transformations one at a time. Run tests after each change.
5. **Verify** — All tests pass. No behavior change unless explicitly intended.

## Common Refactors
- **Extract function/method** — Pull repeated logic into a named function
- **Inline** — Replace a trivial function/variable with its body
- **Rename** — Use ast-grep for structural rename across the codebase
- **Split module** — Break a 250+ LOC file into focused modules
- **Simplify conditionals** — Replace nested if/else with early returns or pattern matching
- **Type narrowing** — Replace `as any` / `unknown` with proper discriminated unions

## Rules
- Never refactor and add features simultaneously
- Run tests after every atomic change
- If tests break, revert the last change and try a different approach
- Commit after each successful refactor step (not at the end)
