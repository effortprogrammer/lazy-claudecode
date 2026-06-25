---
name: ast-grep
description: "Use ast-grep (sg) for AST-aware code search and rewrite across 25 languages. Trigger for structural code matching or deterministic codemods: find every function/call/class/import shaped like X, rewrite console.log to logger.info, strip `as any`, migrate require() to import, find empty catch blocks or missing await, and scan/apply YAML rules. Prefer this over rg/grep when the target is syntax shape rather than text."
---

# ast-grep

Use `sg` (ast-grep) for AST-level structural search and rewrite. Prefer over grep/rg when matching code *shape* rather than text.

## When to Use
- Find all functions matching a pattern (e.g., all async functions without error handling)
- Structural codemods: rename API, migrate patterns, strip type assertions
- YAML rule scanning for lint-like checks

## Quick Reference

### Search
```bash
# Find all console.log calls
sg --pattern 'console.log($$$ARGS)' --lang ts

# Find empty catch blocks
sg --pattern 'catch ($ERR) {}' --lang ts

# Find functions missing return type
sg --pattern 'function $NAME($$$PARAMS) {$$$BODY}' --lang ts
```

### Rewrite
```bash
# console.log → logger.info
sg --pattern 'console.log($$$ARGS)' --rewrite 'logger.info($$$ARGS)' --lang ts

# Strip `as any`
sg --pattern '$EXPR as any' --rewrite '$EXPR' --lang ts

# require → import
sg --pattern 'const $NAME = require($PATH)' --rewrite 'import $NAME from $PATH' --lang ts
```

### YAML Rules
```bash
# Scan with project rules
sg scan --rule .ast-grep/rules/

# Apply fixes
sg scan --rule .ast-grep/rules/ --fix
```

## Pitfalls
- `$$$` matches zero-or-more args; `$` matches exactly one node
- Always specify `--lang` to avoid ambiguous parses
- Test patterns with `sg --pattern '...' --debug-query` first
- Rewrite preserves whitespace/comments within matched nodes
