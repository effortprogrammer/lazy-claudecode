# claude-code-rules

Claude Code plugin that injects local project rule files into model context through lifecycle hooks.

It ports the `pi-rules` rule injector to Claude Code:

- `SessionStart` and `UserPromptSubmit` load static project instructions once per session.
- `PostToolUse` watches Claude Code `apply_patch` by default, then injects matching file-specific rules as additional context.
- `PostCompact` clears the per-session injection cache after manual or automatic compaction so relevant rules can be reintroduced into the compacted conversation.
- Session-level deduplication prevents the same rule from being repeated after it has been injected.

`PostToolUse` output is context-only: it emits `hookSpecificOutput.additionalContext` and does not rewrite tool output.

The runtime has no npm production dependencies, so a clean Claude Code marketplace copy can run without a follow-up `npm install`.

## Rule Sources

Project-level sources:

- `CONTEXT.md`
- `.lazy-claudecode/rules/**/*.md`
- `.claude/rules/**/*.md`
- `.cursor/rules/**/*.md`
- `.github/instructions/**/*.md`
- `.github/copilot-instructions.md`

User-home sources are also supported by the ported engine when available. `AGENTS.md` is not part of `auto` source selection because Claude Code already loads it as native project instructions, so re-injecting it through hooks duplicates context; opt into it explicitly with `LAZY_CLAUDECODE_RULES_ENABLED_SOURCES` if you need hook-level migration behavior. Claude user-home sources (`~/.claude/rules`, `~/.claude/CLAUDE.md`) are also excluded from `auto` because they usually contain Claude Code runtime instructions rather than Claude Code rules; opt into them explicitly when you want that migration behavior.

Markdown rule files may use frontmatter such as:

```md
---
description: TypeScript defaults
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---

Prefer strict TypeScript and keep runtime imports ESM-compatible.
```

## Install Locally

```bash
npx lazy-claudecode-ai install
```

The local installer builds the plugin and copies a clean cache entry to:

```text
~/.claude-code/plugins/cache/effortprogrammer/lazy-claudecode/0.1.0
```

It also enables:

```toml
[features]
plugins = true
plugin_hooks = true
multi_agent = true
child_agents_md = true

[plugins."lazy-claudecode@effortprogrammer"]
enabled = true
```

## Configuration

Use `LAZY_CLAUDECODE_RULES_*` environment variables:

| Variable | Values | Default |
| --- | --- | --- |
| `LAZY_CLAUDECODE_RULES_DISABLED` | `1`, `true`, `yes`, `on` | unset |
| `LAZY_CLAUDECODE_RULES_MODE` | `both`, `static`, `dynamic`, `off` | `both` |
| `LAZY_CLAUDECODE_RULES_MAX_RULE_CHARS` | positive integer | `12000` |
| `LAZY_CLAUDECODE_RULES_MAX_RESULT_CHARS` | positive integer | `40000` |
| `LAZY_CLAUDECODE_RULES_ENABLED_SOURCES` | comma-separated source names or `auto` | `auto` (excludes `AGENTS.md`, `~/.claude/rules`, `~/.claude/CLAUDE.md`) |

For migration from `pi-rules`, equivalent `PI_RULES_*` variables are accepted as fallbacks.

## Debugging

Enable hook phase timing with `NODE_DEBUG=claude-code-rules`:

```bash
NODE_DEBUG=claude-code-rules node dist/cli.js hook post-tool-use < fixture.json
```

Debug lines go to stderr and hook JSON stays on stdout. The log includes `PostToolUse` phases such as `extract`, `fingerprint`, `load`, `persist`, elapsed `ms`, target counts, pending counts, rule counts, and output bytes. It does not log rule bodies or tool response contents.

The default `PostToolUse` hook matcher is intentionally strict: it matches only Claude Code's canonical `apply_patch` hook tool name. Read tools, MCP filesystem tools, shell commands, and Claude-style `Write`/`Edit` aliases are not registered by default.

## Development

```bash
npm install
npm test
npm run check
npm run typecheck
npm pack --dry-run
```

Performance smoke test:

```bash
npm run bench
```

Benchmark timings depend on the local machine. Use the relative counters and repeat-output checks when comparing runs.

Hook smoke test:

```bash
npm run build
printf '%s\n' '{"session_id":"s","transcript_path":null,"cwd":"/path/to/project","hook_event_name":"SessionStart","model":"gpt-5.5","permission_mode":"default","source":"startup"}' \
  | PLUGIN_DATA=/tmp/claude-code-rules-data node dist/cli.js hook session-start
```

## Privacy

`claude-code-rules` runs locally. It reads local rule files and Claude Code hook payloads, writes per-session deduplication state under the Claude Code plugin data directory, and does not make network requests.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
