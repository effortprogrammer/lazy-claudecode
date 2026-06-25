# claude-code-start-work-continuation

Claude Code Stop-hook continuation injector for the lazy-claudecode-claude-code `start-work` skill.

It reads `.lazy-claudecode/boulder.json` in the hook payload `cwd`, resolves the active work, inspects the active plan for incomplete top-level checkboxes, and emits Claude Code Stop-hook JSON when the plan still has work:

```json
{"decision":"block","reason":"<directive>"}
```

The `reason` is loaded from `directive.md` on every invocation and filled with current plan state. The hook returns no output when `stop_hook_active` is `true`, when no active Boulder work exists, when the work is completed, when the active work is not tied to `claude-code:<session_id>`, or when all top-level plan checkboxes are complete.

This pairs with the `start-work` skill at `plugin/skills/start-work/SKILL.md`. That skill writes `.lazy-claudecode/boulder.json` with Claude Code session ids prefixed as `claude-code:` so the hook can continue only its own active Claude Code session.

## Counted plan checkboxes

Only column-0 checkboxes under these sections are counted:

- `## TODOs`
- `## Final Verification Wave`

Nested checkboxes under `### Acceptance Criteria`, `### Evidence`, and `### Definition of Done` are ignored.

## Smoke test

```bash
TMP=$(mktemp -d)
mkdir -p "$TMP/.lazy-claudecode/plans"
cat > "$TMP/.lazy-claudecode/plans/test.md" <<EOF
## TODOs
- [ ] Task one
- [ ] Task two
EOF
cat > "$TMP/.lazy-claudecode/boulder.json" <<EOF
{"schema_version":2,"active_work_id":"w1","works":{"w1":{"work_id":"w1","active_plan":".lazy-claudecode/plans/test.md","plan_name":"test","session_ids":["claude-code:smoke-session"],"status":"active"}}}
EOF
PAYLOAD='{"session_id":"smoke-session","turn_id":"t1","transcript_path":"","cwd":"'"$TMP"'","hook_event_name":"Stop","model":"gpt-5.5","permission_mode":"default","stop_hook_active":false}'
npm run build
echo "$PAYLOAD" | node dist/cli.js hook stop

PAYLOAD_LOOP='{"session_id":"smoke-session","turn_id":"t1","transcript_path":"","cwd":"'"$TMP"'","hook_event_name":"Stop","model":"gpt-5.5","permission_mode":"default","stop_hook_active":true}'
echo "$PAYLOAD_LOOP" | node dist/cli.js hook stop

rm -rf "$TMP"
```

Expect the first command to print JSON containing `"decision":"block"`; expect the anti-loop command to print nothing.

## License

MIT. See `LICENSE`.

## Privacy

This plugin only reads local hook payloads, `.lazy-claudecode/boulder.json`, the active plan, and the bundled directive. It makes no network calls and stores no telemetry.
