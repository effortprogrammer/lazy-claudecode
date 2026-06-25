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
  Built because Codex hit its limits and we needed something that doesn't stop working.<br>
  Inspired by <a href="https://github.com/code-yeongyu/lazycodex">LazyCodex</a> by <a href="https://github.com/code-yeongyu">@code-yeongyu</a> — rebuilt from scratch on Claude Code's native hook system.
</p>

---

## 🚀 Quick Start

```bash
# Requires Bun (https://bun.sh)
curl -fsSL https://bun.sh/install | bash

npm install -g lazy-claudecode
lazy-claudecode install
```

Verify everything is set up:

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

## ⚡ Ultrawork Mode

Add **`ulw`** anywhere in your prompt:

```
> implement the auth module ulw
```

Claude will:

1. **Explore** the codebase to understand what exists
2. **Plan** a decision-complete work breakdown
3. **Execute** with a test → code → verify loop
4. **Review** the result with parallel QA agents
5. **Loop** until everything actually works — no babysitting needed

---

## 🧬 Origins

Built by [Hojin Yang](https://github.com/effortprogrammer). Inspired by [LazyCodex](https://github.com/code-yeongyu/lazycodex) ([@code-yeongyu](https://github.com/code-yeongyu)).

## License

MIT
