# Debugging Skill

## Systematic Debugging Process

### 1. Reproduce
- Confirm the bug exists with a concrete reproduction
- Identify the exact error message, stack trace, or unexpected behavior
- Note the inputs and conditions that trigger the bug

### 2. Isolate
- Narrow down to the smallest reproduction case
- Identify which component/function/line is responsible
- Use binary search on recent changes if needed (git bisect)

### 3. Diagnose
- Read the relevant code carefully
- Trace the data flow from input to the point of failure
- Check assumptions (types, values, state, timing)
- Use logging/debugging tools when code reading isn't enough

### 4. Fix
- Make the minimal change that fixes the root cause
- Don't patch symptoms — fix the underlying issue
- Consider edge cases the fix might affect

### 5. Verify
- Confirm the original bug is fixed
- Run existing tests to check for regressions
- Add a test that covers the bug scenario
- Check related code for similar bugs

## Common Bug Categories
- **Off-by-one** — Array bounds, loop conditions
- **Null/undefined** — Missing null checks, optional chaining
- **Async** — Race conditions, unhandled promises, timing
- **State** — Stale state, shared mutable state, wrong initialization
- **Type** — Type coercion, wrong types, missing validation
