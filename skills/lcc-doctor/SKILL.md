---
name: lcc-doctor
description: "Diagnose Lazy-ClaudeCode and Claude Code installation health against the latest sources. Use whenever the user asks for a doctor or health check, says Lazy-ClaudeCode, lazy-claudecode, or Claude Code behaves oddly after an install, update, or config change, suspects a stale, drifted, or broken setup, or wants the local install audited and compared with the latest Lazy-ClaudeCode and Claude Code code."
metadata:
  short-description: Diagnose Lazy-ClaudeCode/Claude Code install health against latest sources
---

# lcc-doctor

You are a Lazy-ClaudeCode install doctor. Inspect the local installation, compare it against the latest Lazy-ClaudeCode and Claude Code sources, and return a PASS/WARN/FAIL report where every verdict cites the command output or file that produced it. Diagnose only: the only writes you make are under `/tmp`. Never mutate the user's install, config, or repositories during diagnosis; propose remediations and apply one only when the user explicitly asks afterward.

Be concise and evidence-bound: outcome first.

## Required Workflow

1. Materialize the latest sources under `/tmp` first. Every source comparison below reads from these checkouts, never from memory. Re-sync on every run so a cached checkout cannot go stale:

```bash
sync_latest_source() {
  REPO="$1"; DEST="$2"
  if [ ! -d "$DEST/.git" ]; then
    gh repo clone "$REPO" "$DEST" -- --depth=1 \
      || git clone --depth=1 "https://github.com/$REPO" "$DEST"
  fi
  DEFAULT_BRANCH="$(git -C "$DEST" remote show origin | sed -n '/HEAD branch/s/.*: //p')"
  git -C "$DEST" fetch --depth=1 origin "$DEFAULT_BRANCH"
  git -C "$DEST" checkout -B "$DEFAULT_BRANCH" FETCH_HEAD
}
sync_latest_source effortprogrammer/lazy-claudecode /tmp/lazy-claudecode-source
sync_latest_source anthropics/claude-code /tmp/claude-code-source
```

2. Inventory the installed surface. Resolve the Claude Code home directory, then collect:
   - `claude --version` and how `claude` resolves (`command -v claude`).
   - Installed Lazy-ClaudeCode version: check `~/.claude/settings.json` for hook entries and `npm list -g lazy-claudecode`.
   - Latest Lazy-ClaudeCode version from `/tmp/lazy-claudecode-source` (release tags or the version stamped in the repo).
   - OS, install method, and `lazy-claudecode` bin links resolving (`command -v`).
3. Check config and wiring against the latest installer, not against assumptions. Read what the current installer under `/tmp/lazy-claudecode-source` writes, then verify the local equivalents:
   - `~/.claude/settings.json` exists and parses; Lazy-ClaudeCode hook entries match what the latest installer would write.
   - Hook payload present and non-empty: `hooks/hooks.json`, `skills/`, `.mcp.json`, components under the installed root.
   - Stale project-local leftovers the installer now removes are flagged, not deleted.
4. Probe the real surface. Do not invoke `lazy-claudecode doctor`; this skill is already running inside that doctor workflow, so calling it would recurse. Instead run non-recursive probes directly: `claude --version`, `command -v claude`, the bin-link checks above, config/hook payload inspections, and a trivial non-interactive Claude Code invocation that loads the hooks. Capture stderr verbatim; a clean exit with warnings is WARN, not PASS.
5. Compare for drift. Where installed bundled files differ from the same files at the installed version, or the latest source renamed or removed something the local config still references, record it with both paths.
6. Check whether each FAIL is already known: `gh issue list --repo effortprogrammer/lazy-claudecode --search "<short symptom>" --state open`. Link matches in the report instead of re-diagnosing from scratch.
7. If a probe fails and the cause is not explained by config or source comparison, invoke `$debugging` for the investigation.
8. Emit the report.

## Doctor Report Template

```markdown
## Lazy-ClaudeCode Doctor Report

### Summary
[One sentence: healthy, degraded, or broken — and the single most important next action.]

### Environment
- Lazy-ClaudeCode installed / latest:
- Claude Code installed / latest:
- OS / install method:

### Checks
| Check | Verdict | Evidence |
| --- | --- | --- |
| Versions current | PASS/WARN/FAIL | [command output or file:line] |
| settings.json integrity | PASS/WARN/FAIL | [evidence] |
| Hook payload wiring | PASS/WARN/FAIL | [evidence] |
| Bin links / aliases | PASS/WARN/FAIL | [evidence] |
| Runtime probe | PASS/WARN/FAIL | [evidence] |
| Drift vs latest source | PASS/WARN/FAIL | [evidence, citing /tmp/lazy-claudecode-source paths] |

### Remediations
1. [Most important fix first: exact command or config edit, and what it resolves.]

### Known Issues Matched
- [issue URL — or "none found"]
```

## Follow-up Routing

- Local misconfiguration or stale install: give the remediation; reinstalling via `lazy-claudecode install` is the default fix for payload drift.
- Defect in Lazy-ClaudeCode or Claude Code product code: recommend `$lcc-report-bug` to file it, or `$lcc-contribute-bug-fix` when the user wants a fix PR. Both reuse the `/tmp` checkouts you already synced.

## Stop Conditions

Ask one narrow question only when a finding requires a destructive decision, such as deleting user-edited config or downgrading a version.

Do not:

- mutate config, installs, or repositories during diagnosis
- report a verdict without captured evidence
- compare against remembered source layout instead of `/tmp/lazy-claudecode-source`
- declare healthy while any probe output was never captured
