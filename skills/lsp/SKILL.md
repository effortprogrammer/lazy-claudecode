---
name: lsp
description: "Use when Claude Code shows LSP diagnostics feedback after edits. Understand how to interpret and act on TypeScript, Python, and other language server errors and warnings."
---

# LSP Diagnostics

The LSP diagnostics hook runs after file edits and reports compiler/type errors and warnings.

## How It Works
- Fires on PostToolUse for Edit/Write/MultiEdit
- Runs the appropriate language checker (tsc --noEmit, pyright, etc.)
- Reports errors and warnings as additional context
- Suppresses after 3 attempts on the same file (avoids loops)

## Supported Languages
| Extension | Checker | Command |
|-----------|---------|---------|
| .ts/.tsx  | TypeScript | `tsc --noEmit` |
| .py       | Pyright | `pyright --outputjson` |
| .rs       | Rust | `cargo check --message-format=json` |
| .go       | Go | `go vet` |

## How to Respond
1. **Errors**: Must fix before proceeding. Read the diagnostic carefully.
2. **Warnings**: Fix if trivial, note if complex (don't derail main task).
3. **Repeated same error**: The hook suppresses after 3 attempts. Step back and rethink approach.

## Pitfalls
- Don't blindly add type assertions (`as any`) to suppress errors
- If tsc reports errors in unrelated files, focus only on files you edited
- Some errors cascade — fix the root cause, not every downstream error
