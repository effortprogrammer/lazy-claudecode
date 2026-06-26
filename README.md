# lazy-claudecode ☤

<p align="center">
  <strong>Make Claude Code work like it means it.</strong>
</p>

<p align="center">
  <a href="#-get-started"><img src="https://img.shields.io/badge/Get%20Started-blue?style=for-the-badge" alt="Get Started"></a>
  <a href="https://github.com/effortprogrammer/lazy-claudecode/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/lazy-claudecode"><img src="https://img.shields.io/npm/v/lazy-claudecode?style=for-the-badge&color=orange" alt="npm"></a>
</p>

<p align="center">
  Claude Code is powerful — but out of the box it guesses, skips verification, and calls it done too early.<br>
  <b>lazy-claudecode</b> fixes that. It hooks into Claude Code's lifecycle to enforce<br>
  structured planning, evidence-based verification, and real proof before "done."
</p>

---

## 🤔 The Problem

You've seen it: Claude Code writes a feature, says "I've implemented X," and stops. No tests. No verification. Sometimes it doesn't even compile. You ask it to be thorough and it writes a paragraph about how thorough it was — without actually checking.

**lazy-claudecode** turns Claude Code into a disciplined engineer that:

- 📋 **Plans before it codes** — structured analysis, success criteria, and scenarios before touching a single file
- 🔴→🟢 **Proves it works** — failing test first, then implementation, then real-surface verification
- 🚫 **Can't fake done** — evidence-gated completion with captured proof artifacts
- 🔄 **Doesn't stop early** — continues when plan tasks remain, verifies subagent work

---

## ⚡ Get Started

```bash
npm install -g lazy-claudecode
lazy-claudecode install
lazy-claudecode doctor        # verify everything's wired up
```

That's it. Next time you open Claude Code, the hooks are active.

<details>
<summary>📦 Install from source</summary>

```bash
git clone https://github.com/effortprogrammer/lazy-claudecode.git
cd lazy-claudecode
npm install && npm run build && npm link
lazy-claudecode install
```

</details>

---

## 🚀 Ultrawork Mode

The headline feature. Type **`ultrawork`** (or **`ulw`**) before your prompt:

```
> ultrawork: implement the auth module
```

Claude Code transforms into a rigorous engineer that follows a strict protocol:

| Phase | What happens |
|-------|-------------|
| **Bootstrap** | Surveys skills, triages complexity (LIGHT vs HEAVY), creates binding success criteria |
| **Plan** | Opens a durable notepad, registers every step as a visible todo |
| **RED** | Writes a failing test *first* — captures proof it fails for the right reason |
| **GREEN** | Smallest change to pass — captures proof it passes |
| **Surface** | Runs real-surface verification (curl, browser, tmux) — not just unit tests |
| **Review** | Spawns a reviewer subagent (HEAVY tier) — loops until unconditional approval |

> Every step produces **captured evidence**. No "it should work" — actual artifacts.

### ULW Loop — Goal-Based Execution

For longer tasks, use the loop commands:

```
> ulw loop start: implement feature X     # Begin tracked execution
> ulw loop checkpoint                      # Save progress
> ulw loop status                          # Check where you are
> ulw loop complete                        # Finish with verification
```

---

## 🔧 What's Under the Hood

lazy-claudecode works through Claude Code's **hook system** — scripts that fire at lifecycle events. No patches, no forks, no fragile hacks.

| Hook | Fires when... | What it does |
|------|--------------|-------------|
| **Bootstrap** | Session starts | Provisions tools (ast-grep, etc.), loads project rules |
| **Ultrawork Trigger** | You type `ultrawork`/`ulw` | Injects the full systematic work directive |
| **Comment Checker** | Files are written/edited | Blocks unnecessary or low-quality comments |
| **LSP Diagnostics** | Files are written/edited | Feeds back errors and warnings automatically |
| **Start-Work Continuation** | Agent tries to stop | Prevents premature stops when plan tasks remain |
| **Executor Verify** | Subagent finishes | Verifies evidence receipts from child agents |
| **Git Bash Reminder** | Before bash commands | Nudges toward the Git MCP for git operations |

### MCP Servers

- **CodeGraph** — structural codebase analysis (call graphs, dependency maps)
- **Git Bash** — git operations through MCP instead of raw shell

### 13+ Skills

Domain-specific knowledge modules that Claude Code loads contextually:

`programming` · `debugging` · `frontend` · `git-master` · `refactor` · `ast-grep` · `lsp` · `comment-checker` · `start-work` · `review-work` · `ulw-loop` · `ulw-plan` · `rules`

---

## 🛠️ Commands

```bash
lazy-claudecode install     # Wire hooks into ~/.claude/settings.json
lazy-claudecode uninstall   # Remove hooks cleanly
lazy-claudecode doctor      # Health check all components
lazy-claudecode version     # Show version
```

---

## 📐 Project Rules

Drop rules files in your project and they'll be loaded automatically:

```
your-project/
├── .claude/rules/*.md     # Per-project rules
├── CLAUDE.md              # Claude Code rules (root)
└── AGENTS.md              # Agent instructions
```

---

## 🔇 Telemetry

Anonymous usage stats are collected by default to improve the tool. Opt out anytime:

```bash
export LAZY_CLAUDECODE_NO_TELEMETRY=1
```

---

## 🧬 Origins

Ported from [LazyClaude](https://github.com/code-yeongyu/lazycodex) (OpenAI Codex CLI) to Claude Code's native hook system by [Hojin Yang](https://github.com/effortprogrammer).

---

## License

MIT
