# lazy-claudecode

> Agent harness for **Claude Code** — hooks, skills, MCP servers, and systematic work modes.  
> Ported from [LazyCodex](https://github.com/code-yeongyu/lazycodex) (OpenAI Codex CLI) to Claude Code's hook system.

## What is this?

**lazy-claudecode** supercharges your Claude Code sessions with:

- 🔧 **Bootstrap** — Session-start provisioning (ast-grep, config, tooling)
- 💬 **Comment Checker** — Blocks bad/unnecessary comments on file writes
- 🔍 **LSP Diagnostics** — Automatic error/warning feedback after edits
- 📐 **CodeGraph** — MCP server for codebase structure analysis
- 🌳 **Git Bash** — MCP server for git operations
- 📋 **Rules Loader** — Loads project rules from `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`
- ⚡ **Ultrawork Mode** — Systematic work directive injection
- 🔄 **ULW Loop** — Goal-based evidence-bound execution with checkpoints
- 🚀 **Start-Work Continuation** — Prevents premature stops when plan tasks remain
- ✅ **Executor Verify** — Subagent evidence receipt verification
- 📊 **Telemetry** — Anonymous usage stats (opt-out with `LAZY_CLAUDECODE_NO_TELEMETRY=1`)
- 🧠 **Skills** — 13+ skill modules for different task types
- 📦 **Model Catalog** — Model routing configuration

## Installation

```bash
# Install globally
npm install -g lazy-claudecode

# Set up hooks in Claude Code
lazy-claudecode install

# Verify everything works
lazy-claudecode doctor
```

### Manual Installation

```bash
git clone https://github.com/kaki/lazy-claudecode.git
cd lazy-claudecode
npm install
npm run build
npm link
lazy-claudecode install
```

## Usage

### Commands

```bash
lazy-claudecode install     # Install hooks into ~/.claude/settings.json
lazy-claudecode uninstall   # Remove hooks from settings
lazy-claudecode doctor      # Check all components are healthy
lazy-claudecode version     # Show version
```

### Ultrawork Mode

Type **"ultrawork"** or **"ulw"** in your Claude Code prompt to activate systematic work mode:

```
> ultrawork: implement the auth module
```

This injects the ultrawork directive which enforces:
- Structured analysis before action
- Evidence-based verification
- Checkpoint-driven progress

### ULW Loop

Type **"ulw loop"** commands to manage goal-based execution:

```
> ulw loop start: implement feature X
> ulw loop checkpoint
> ulw loop status
> ulw loop complete
```

### Skills

Skills are loaded from the `skills/` directory and provide domain-specific guidance:

| Skill | Description |
|-------|-------------|
| `programming` | General programming best practices |
| `debugging` | Systematic debugging methodology |
| `frontend` | Frontend/UI development patterns |
| `git-master` | Git workflow mastery |
| `start-work` | Work session initialization |
| `review-work` | Code review methodology |
| `ulw-loop` | ULW loop execution |
| `ulw-plan` | Planning and decomposition |
| `ast-grep` | AST-based code search/transform |
| `comment-checker` | Comment quality enforcement |
| `lsp` | Language Server Protocol usage |
| `refactor` | Code refactoring patterns |
| `rules` | Project rules management |

## Architecture

```
lazy-claudecode/
├── bin/                    # CLI entrypoint
├── src/
│   ├── hooks/              # Hook handler scripts
│   │   ├── bootstrap.ts           # SessionStart: provisioning
│   │   ├── rules-loader.ts        # SessionStart: load project rules
│   │   ├── telemetry.ts           # SessionStart: anonymous telemetry
│   │   ├── ultrawork-trigger.ts   # UserPromptSubmit: ultrawork detection
│   │   ├── ulw-loop-steering.ts   # UserPromptSubmit: ULW loop commands
│   │   ├── git-bash-reminder.ts   # PreToolUse(Bash): git MCP reminder
│   │   ├── comment-checker.ts     # PostToolUse(Edit|Write): comment check
│   │   ├── lsp-diagnostics.ts     # PostToolUse(Edit|Write): LSP errors
│   │   ├── codegraph-init.ts      # PostToolUse: codegraph guidance
│   │   ├── start-work-continuation.ts  # Stop: continue if tasks remain
│   │   ├── executor-verify.ts     # SubagentStop: verify evidence
│   │   └── post-compact-reset.ts  # PostCompact: reset caches
│   ├── installer/          # Install/uninstall/doctor
│   ├── directives/         # Directive templates (ultrawork, etc.)
│   ├── state/              # Session & plan state management
│   ├── mcp/                # MCP server configuration
│   └── utils/              # Shared utilities (hook I/O, paths, etc.)
├── skills/                 # Skill definition files
├── hooks-config.json       # Hook definitions for Claude Code
└── model-catalog.json      # Model routing config
```

### Hook System

Claude Code hooks allow scripts to run at lifecycle events:

| Event | When | What lazy-claudecode does |
|-------|------|--------------------------|
| `SessionStart` | Session begins | Bootstrap, load rules, telemetry |
| `UserPromptSubmit` | User sends prompt | Ultrawork/ULW detection |
| `PreToolUse` | Before tool execution | Git bash reminders |
| `PostToolUse` | After tool execution | Comment check, LSP diagnostics |
| `Stop` | Agent wants to stop | Continue if tasks remain |
| `SubagentStop` | Subagent finishes | Verify evidence receipts |
| `PostCompact` | Context compaction | Reset state caches |

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `LAZY_CLAUDECODE_NO_TELEMETRY` | Set to `1` to disable telemetry |
| `LAZY_CLAUDECODE_ROOT` | Override install root (set automatically) |
| `LAZY_CLAUDECODE_DEBUG` | Set to `1` for verbose logging |
| `LAZY_CLAUDECODE_STATE_DIR` | Override state directory |

### Project Rules

Place rules files in your project:
- `.claude/rules/*.md` — Per-project rules
- `CLAUDE.md` — Claude Code rules (root)
- `AGENTS.md` — Agent instructions

## License

MIT — Hojin Yang
