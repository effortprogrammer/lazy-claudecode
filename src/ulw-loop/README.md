# claude-code-ulw-loop

[![ci](https://img.shields.io/badge/ci-pending-lightgrey.svg)](#) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Claude Code plugin scaffold for durable repo-native multi-goal orchestration with embedded success criteria and observable evidence audit.

## Behavior

| Subcommand | Purpose |
|------------|---------|
| `lazy-claudecode ulw-loop create-goals` | Create repo-native goals from a brief and seed criteria. |
| `lazy-claudecode ulw-loop record-evidence` | Record observable evidence for the active criterion. |
| `lazy-claudecode ulw-loop criteria` | Inspect or revise goal success criteria. |
| `lazy-claudecode ulw-loop complete-goals` | Complete eligible goals after criteria pass. |
| `lazy-claudecode ulw-loop checkpoint` | Refuse completion until criteria and evidence gates pass. |
| `lazy-claudecode ulw-loop steer` | Apply steering updates to the plan. |
| `lazy-claudecode ulw-loop status` | Report active goal, criteria, and evidence state. |

Wave 1 is scaffold only. Command behavior lands in later waves.

## Claude Code Plugin

The plugin ships:

- `.claude-code-plugin/plugin.json` for Claude Code plugin discovery.
- `hooks/hooks.json` for the `UserPromptSubmit` hook.
- `skills/ulw-loop/` as the future skill directory.

The hook command is:

```bash
node "${PLUGIN_ROOT}/dist/cli.js" hook user-prompt-submit
```

No MCP server or Claude Code tool is exposed in this scaffold.

## Local Development

```bash
npm install
npm test
npm run typecheck
npm run check
npm pack --dry-run
```

## Local Claude Code Installation

```bash
npx lazy-claudecode-ai install
```

The installer builds and copies the plugin into `~/.claude-code/plugins/cache/effortprogrammer/lazy-claudecode/0.1.0`, registers the `effortprogrammer` marketplace from the `lazy-claudecode` Git repository, installs runtime dependencies there, and enables:

```toml
[features]
plugins = true
plugin_hooks = true

[plugins."lazy-claudecode@effortprogrammer"]
enabled = true
```

## Privacy

This plugin runs locally. The scaffold does not call a network service by itself.

## License

[MIT](LICENSE).

## Related

- [lazy-claudecode](https://github.com/effortprogrammer/lazy-claudecode) - Effort Programmer Claude Code marketplace repository.
