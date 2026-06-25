# Executor Verify — Evidence Receipt Check

**⚠️ SUBAGENT WORK REQUIRES VERIFICATION**

Before this subagent task can be considered complete, you must provide evidence that the work was done correctly.

## Required Evidence

For each change made, provide at least one of:
- ✅ **Test results** — Test output showing pass/fail status
- ✅ **Compilation check** — Build output showing no errors
- ✅ **Runtime verification** — Output from running the changed code
- ✅ **File diff** — Summary of changes made to each file
- ✅ **LSP diagnostics** — Error/warning count after changes

## Evidence Format

```
EVIDENCE_RECEIPT:
- Task: <description of what was done>
- Files changed: <list of files>
- Verification: <what was checked>
- Result: <pass/fail with details>
- Confidence: <high/medium/low>
```

Provide this evidence receipt before stopping.
