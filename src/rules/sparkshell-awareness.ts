import { existsSync } from "node:fs";
import { join } from "node:path";

type RuntimeEnv = Readonly<Record<string, string | undefined>>;

interface OmoResolutionDeps {
	readonly fileExists?: (path: string) => boolean;
	readonly platform?: NodeJS.Platform;
}

const SPARKSHELL_AWARENESS_MARKER = "## Sparkshell Runtime";

export const SPARKSHELL_AWARENESS_DEDUP_KEY = "__omo_sparkshell_awareness__";

export function isClaudeCodeAppServerActive(env: RuntimeEnv = process.env): boolean {
	const originator = env["CLAUDE_CODE_INTERNAL_ORIGINATOR_OVERRIDE"]?.toLowerCase() ?? "";
	const bundleIdentifier = env["__CFBundleIdentifier"]?.toLowerCase() ?? "";
	const shellActive = isTruthy(env["CLAUDE_CODE_SHELL"]);

	return (
		shellActive &&
		(originator.includes("claude-code desktop") ||
			originator.includes("claude-code app") ||
			bundleIdentifier === "com.anthropic.claude")
	);
}

function isSparkShellAppServerConfigured(env: RuntimeEnv = process.env): boolean {
	const claudeCodeSocketPath = env["CLAUDE_CODE_APP_SERVER_SOCKET"]?.trim() ?? "";
	const omoSocketPath = env["LAZY_CLAUDECODE_SPARKSHELL_APP_SERVER_SOCKET"]?.trim() ?? "";
	return claudeCodeSocketPath.length > 0 || omoSocketPath.length > 0;
}

export function resolveOmoInvocation(env: RuntimeEnv = process.env, deps: OmoResolutionDeps = {}): string | null {
	const fileExists = deps.fileExists ?? existsSync;
	const platform = deps.platform ?? process.platform;
	const binNames = platform === "win32" ? ["lazy-claudecode.cmd", "lazy-claudecode.exe", "lazy-claudecode"] : ["lazy-claudecode"];
	const pathDelimiter = platform === "win32" ? ";" : ":";
	const pathEntries = (env["PATH"] ?? "").split(pathDelimiter).filter((entry) => entry.trim().length > 0);
	for (const pathEntry of pathEntries) {
		for (const binName of binNames) {
			if (fileExists(join(pathEntry, binName))) return "lazy-claudecode";
		}
	}
	for (const candidateDir of omoCandidateBinDirs(env)) {
		for (const binName of binNames) {
			const candidate = join(candidateDir, binName);
			if (fileExists(candidate)) return candidate;
		}
	}
	return null;
}

function omoCandidateBinDirs(env: RuntimeEnv): readonly string[] {
	const dirs: string[] = [];
	const localBinDir = env["CLAUDE_CODE_LOCAL_BIN_DIR"]?.trim() ?? "";
	if (localBinDir.length > 0) dirs.push(localBinDir);
	const home = env["HOME"]?.trim() || env["USERPROFILE"]?.trim() || "";
	const claudeCodeHome = env["CLAUDE_CODE_HOME"]?.trim() || (home.length > 0 ? join(home, ".claude-code") : "");
	if (claudeCodeHome.length > 0) dirs.push(join(claudeCodeHome, "bin"));
	if (home.length > 0) dirs.push(join(home, ".local", "bin"));
	return dirs;
}

export function getSparkShellRuntimeAwareness(env: RuntimeEnv = process.env, deps: OmoResolutionDeps = {}): string {
	const override = env["LAZY_CLAUDECODE_SPARKSHELL_AWARENESS"] ?? env["LAZYCLAUDE_CODE_SPARKSHELL_AWARENESS"];
	if (isFalsy(override)) {
		return "";
	}
	if (!isTruthy(override) && !isClaudeCodeAppServerActive(env) && !isSparkShellAppServerConfigured(env)) {
		return "";
	}

	const resolved = resolveOmoInvocation(env, deps);
	const invocation = resolved ?? (isTruthy(override) ? "lazy-claudecode" : null);
	if (invocation === null) {
		return "";
	}
	const command = /\s/.test(invocation) ? `"${invocation}"` : invocation;

	return [
		SPARKSHELL_AWARENESS_MARKER,
		"",
		`- Use \`${command} sparkshell <command>\` first for repo inspection, CLI smoke tests, git/history checks, and bounded command output. Raw \`rg\`/\`grep\`/\`cat\`/\`git\` are fallbacks when Sparkshell is unavailable or too narrow for the task.`,
		`- Use \`${command} sparkshell --shell '<command>'\` only for shell metacharacters or pipelines.`,
		`- Use \`${command} sparkshell --tmux-pane <pane-id> --tail-lines 400\` only to inspect an existing pane, never to launch ordinary commands. Tail lines must stay between 100 and 1000.`,
		"- When no native sidecar or appserver is available, Sparkshell silently falls back to raw command execution. `LAZY_CLAUDECODE_SPARKSHELL_BIN` selects a native sidecar path.",
		"- When `CLAUDE_CODE_THREAD_ID` identifies a Claude Code session, Sparkshell feeds recent session context (first/latest user request + last 5 conversation messages) into oversized-output condensation for relevance ranking, but never appends that context to command output. `LAZY_CLAUDECODE_SPARKSHELL_SESSION_CONTEXT=0` disables the lookup.",
		`- Route potentially huge output (full log files, big diffs, \`cat\`/\`grep\` over large artifacts) through \`${command} sparkshell\` instead of reading it raw: oversized output is condensed to a budget while preserving error signatures, repeated patterns, session-goal-relevant lines, and head/tail. Tune with \`--budget <chars>\`; disable with \`LAZY_CLAUDECODE_SPARKSHELL_CONDENSE=0\`.`,
		"- Oversized output is first summarized by the spark model (`claude-code exec`, default `gpt-5.3-claude-code-spark`) fed with the shell output plus session context: the summary keeps selected output as-is (no masking) and ends with a `[sparkshell caption]` line describing what ran, what the full output contained, and which lines were omitted. `LAZY_CLAUDECODE_SPARKSHELL_SPARK=0` skips the model and uses deterministic condensation directly.",
	].join("\n");
}

function isTruthy(value: string | undefined): boolean {
	if (value === undefined) {
		return false;
	}
	return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function isFalsy(value: string | undefined): boolean {
	if (value === undefined) {
		return false;
	}
	return ["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}
