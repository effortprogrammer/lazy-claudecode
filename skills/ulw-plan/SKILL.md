---
name: ulw-plan
description: "Planning skill for Claude Code: use before coding when facing 5+ steps, ambiguous scope, multiple modules, or architecture decisions. Explore-first planning that grounds in the codebase, then produces a decision-complete work plan."
---

# ULW Plan

Explore-first planning mode. Use before executing complex work.

## When to Activate
- Task has 5+ implementation steps
- Scope is ambiguous or underspecified
- Multiple modules/files are affected
- Architecture decisions are needed
- User says "plan", "break this down", or "figure out what to build"

## Process
1. **Explore** — Read relevant code, understand current state, identify constraints
2. **Research** — Check docs, similar implementations, best practices if needed
3. **Identify Forks** — List decisions that need user input vs. decisions you can make
4. **Ask** — Only ask about forks exploration cannot resolve
5. **Write Plan** — Produce a numbered task list with:
   - Each task is independently verifiable
   - Dependencies between tasks are explicit
   - Acceptance criteria for each task
   - Estimated complexity (trivial/small/medium/large)
6. **Wait for Approval** — Do not start work until the user approves the plan

## Plan Format
```markdown
# Plan: [Title]

## Context
[1-2 sentences on what exists and what needs to change]

## Tasks
1. [ ] **Task name** — Description. Verify: [how to verify]. [complexity]
2. [ ] **Task name** — Description. Depends on: #1. Verify: [how]. [complexity]
...

## Open Questions
- Q1: [question] — Options: A (trade-off), B (trade-off). Recommend: [A/B because...]
```

## Rules
- Never start coding without an approved plan
- Plans live in `.claude/plans/` directory
- Each task should be completable in one focused session
- If a task is "large", break it down further
