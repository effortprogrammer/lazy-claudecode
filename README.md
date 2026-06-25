# lazy-claudecode ☤

<p align="center">
  <strong>Make Claude Code work like it means it.</strong>
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Get%20Started-blue?style=for-the-badge" alt="Get Started"></a>
  <a href="https://github.com/effortprogrammer/lazy-claudecode/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/lazy-claudecode"><img src="https://img.shields.io/npm/v/lazy-claudecode?style=for-the-badge&color=orange" alt="npm"></a>
</p>

<p align="center">
  A zero-config agent harness that turns Claude Code into a disciplined engineering partner.<br>
  Plans before coding. Tests before shipping. Verifies before claiming done.
</p>

---

Claude Code is powerful — but out of the box it still skips tests, hallucinates passing output, and calls it done when nothing compiles. **lazy-claudecode** fixes that with a hook-based harness that enforces real engineering discipline without modifying Claude Code itself.

## ✨ Highlights

| | Feature | What it does |
|---|---|---|
| 🧠 | **Ultrawork Mode** | Type `ulw` in any prompt → Claude plans first, writes tests, verifies with real output, and loops until everything actually works |
| 🔄 | **Goal-bound execution loop** | Evidence-driven checkpoints — Claude can't mark a task done without proving it |
| 🏗️ | **Explore-first planning** | Scans the codebase before writing a plan, surfaces contradictions and risks automatically |
| 👥 | **Team Mode** | Spin up parallel Claude Code threads that cooperate on large tasks with durable shared state |
| 🔬 | **5-agent review pipeline** | Post-implementation QA: goal verification, code quality, security audit, hands-on testing, context mining — all run in parallel |
| 🔍 | **Ultraresearch** | Parallel research swarms across codebase, web, docs, and OSS — with citation and verification |
| 🧹 | **AI slop removal** | Detects and removes 10 categories of AI-generated code smells from your changes |
| 🎨 | **Visual QA** | Screenshot diff + TUI capture → oracle-based design/functional review for any UI you touch |
| 🛠️ | **LSP integration** | Real language-server diagnostics, definitions, references — Claude reads actual compiler errors |
| 📐 | **Strict coding standards** | Enforced type safety, 250 LOC ceiling, TDD, no `any`/`unwrap`/`panic` — across Python, Rust, TypeScript, Go |

## 🚀 Quick Start

```bash
# Requires Bun (https://bun.sh)
curl -fsSL https://bun.sh/install | bash

npm install -g lazy-claudecode
lazy-claudecode install
```

Verify:

```bash
lazy-claudecode doctor
```

That's it. Next time you open Claude Code, the hooks are active.

<details>
<summary>📦 Install from source</summary>

```bash
git clone https://github.com/effortprogrammer/lazy-claudecode.git
cd lazy-claudecode
bun install && bun link
lazy-claudecode install
```

</details>

---

## 🧠 How It Works

lazy-claudecode uses **Claude Code's native hook system** — no monkey-patching, no binary mods. It registers hooks across 7 lifecycle events that guide Claude's behavior:

```
SessionStart → Bootstrap skills, load context, sync rules
     ↓
UserPromptSubmit → Detect work modes (ulw, research, teammode)
     ↓
PreToolUse → Goal-budget guards, comment checks, execution verification
     ↓
PostToolUse → Evidence collection, state tracking
     ↓
Stop → Loop continuation, review triggers
```

Everything lives in `~/.claude/settings.json` — run `lazy-claudecode uninstall` to remove cleanly.

---

## ⚡ Ultrawork Mode

The headline feature. Add **`ulw`** anywhere in your prompt:

```
> implement the auth module ulw
```

What happens:

1. **Explore** — Claude scans the codebase to understand context
2. **Plan** — Produces a decision-complete work plan (reviewed by Metis + Momus agents)
3. **Execute** — Implements with evidence-bound loop (test → code → verify)
4. **Review** — 5 parallel oracle agents verify the result
5. **Loop** — If anything fails, Claude iterates — no human babysitting needed

### Multi-Agent Architecture

Ultrawork orchestrates specialized agents under the hood:

| Agent | Role |
|---|---|
| **Planner** | Strategic decomposition — turns vague requests into executable plans |
| **Metis** | Pre-planning analyst — catches contradictions and missing constraints |
| **Momus** | Plan reviewer — verifies tasks are startable and references exist |
| **Explorer** | Codebase search specialist — fast, read-only file discovery |
| **Librarian** | OSS researcher — finds library docs with SHA-pinned GitHub citations |

---

## 🛡️ What Gets Enforced

These aren't suggestions — they're hooks that run on every interaction:

- **Tests before code** — the loop won't proceed without a failing test first
- **Real output verification** — Claude must run the code and show actual output, not hallucinated results
- **Comment quality** — flags TODO/FIXME/HACK that lack actionable detail
- **250 LOC ceiling** — modules over 250 lines of pure logic trigger mandatory refactoring
- **Type strictness** — no `any` in TypeScript, no `unwrap` in Rust, no bare `except` in Python
- **Evidence ledger** — every checkpoint is logged with proof of what was verified

---

## 📚 Built-in Skills (23)

Skills are loaded automatically based on context:

| Category | Skills |
|---|---|
| **Core workflow** | `start-work` · `review-work` · `ulw-plan` · `ulw-loop` |
| **Coding** | `programming` · `debugging` · `refactor` · `remove-ai-slops` |
| **Research** | `ultraresearch` · `ultimate-browsing` |
| **Quality** | `visual-qa` · `comment-checker` · `lsp` · `lsp-setup` |
| **Team** | `teammode` |
| **Meta** | `rules` · `init-deep` · `git-master` · `frontend` · `ast-grep` |
| **Contributing** | `lcc-contribute-bug-fix` · `lcc-doctor` · `lcc-report-bug` |

---

## 🔌 MCP Servers

Three MCP servers come pre-configured:

| Server | Purpose |
|---|---|
| **codegraph** | Codebase structure analysis — architecture, dependencies, call graphs |
| **git-bash** | Structured git operations with better error handling |
| **lsp** | Language server protocol — real diagnostics, go-to-definition, references |

Plus remote connections to [grep.app](https://grep.app) and [Context7](https://context7.com) for OSS code search and library docs.

---

## 🏗️ Architecture

```
lazy-claudecode/
├── hooks-config.json       # 42 hook entries across 7 lifecycle events
├── skills/                 # 23 SKILL.md files — auto-loaded by context
├── components/
│   └── ultrawork/agents/   # 10 specialized agent personas (TOML)
├── src/
│   ├── rules/              # Dynamic CLAUDE.md injection
│   ├── bootstrap/          # Session initialization + skill sync
│   ├── ultrawork/          # Ultrawork mode detection + routing
│   ├── ulw-loop/           # Goal-bound execution loop engine
│   ├── start-work/         # Plan executor with evidence ledger
│   ├── teammode/           # Parallel thread orchestration
│   ├── comment-checker/    # Comment quality enforcement
│   ├── executor-verify/    # Output verification hooks
│   ├── codegraph/          # Codebase structure MCP server
│   ├── git-bash/           # Git operations MCP server
│   ├── lsp/                # LSP integration hooks
│   ├── lsp-daemon/         # Language server MCP daemon
│   └── telemetry/          # Anonymous usage telemetry
├── scripts/                # Build, sync, and migration utilities
└── bin/                    # CLI entry point
```

---

## 🧬 Origins

Inspired by [LazyCodex](https://github.com/code-yeongyu/lazycodex) ([@code-yeongyu](https://github.com/code-yeongyu)). Rebuilt from scratch on Claude Code's native hook system — by [Hojin Yang](https://github.com/effortprogrammer).

## License

MIT
