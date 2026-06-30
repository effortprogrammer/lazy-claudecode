import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { runSessionStartHook, runUserPromptSubmitHook } from "../claude-hook.ts";
import { formatAdditionalContextOutput } from "../hook-output.ts";

type HookOutput = {
	readonly hookSpecificOutput?: {
		readonly additionalContext?: string;
	};
};

function parseAdditionalContext(output: string): string {
	expect(output.trim().length).toBeGreaterThan(0);
	const parsed = parseHookOutput(JSON.parse(output));
	return parsed.hookSpecificOutput?.additionalContext ?? "";
}

function normalizeGuidance(value: string): string {
	return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function expectSparkshellFirstContract(value: string): void {
	const guidance = normalizeGuidance(value);

	expect(guidance).toMatch(/`lazy-claudecode sparkshell <command>`[^.]*\bfirst\b/);
	expect(guidance).toMatch(/\brepo inspection\b/);
	expect(guidance).toMatch(/\bcli smoke tests\b/);
	expect(guidance).toMatch(/\bgit\/history checks\b/);
	expect(guidance).toMatch(/\bbounded command output\b/);
	expect(guidance).toMatch(/\braw\b[^.]*`rg`\/`grep`\/`cat`\/`git`[^.]*\bfallbacks?\b/);
	expect(guidance).toMatch(/\bsparkshell is unavailable\b/);
	expect(guidance).toMatch(/\btoo narrow\b/);
	expect(guidance).toMatch(
		/`lazy-claudecode sparkshell --shell '<command>'`[^.]*\bmetacharacters\b[^.]*\bpipelines\b/,
	);
	expect(guidance).toMatch(
		/`lazy-claudecode sparkshell --tmux-pane <pane-id> --tail-lines 400`[^.]*\bonly\b[^.]*\binspect\b[^.]*\bexisting pane\b/,
	);
	expect(guidance).toMatch(
		/`lazy-claudecode sparkshell --tmux-pane <pane-id> --tail-lines 400`[^.]*\bnever\b[^.]*\blaunch ordinary commands\b/,
	);
	expect(guidance).not.toMatch(/\bprefer\b[^.]*\bbefore raw shell commands\b/);
}

function parseHookOutput(value: unknown): HookOutput {
	if (typeof value !== "object" || value === null) {
		return {};
	}
	const record = value;
	if (!("hookSpecificOutput" in record)) {
		return {};
	}
	const hookSpecificOutput = record.hookSpecificOutput;
	if (typeof hookSpecificOutput !== "object" || hookSpecificOutput === null) {
		return {};
	}
	if (!("additionalContext" in hookSpecificOutput)) {
		return { hookSpecificOutput: {} };
	}
	const additionalContext = hookSpecificOutput.additionalContext;
	if (typeof additionalContext !== "string") {
		return { hookSpecificOutput: {} };
	}
	return {
		hookSpecificOutput: {
			additionalContext,
		},
	};
}

const fixtureRoot = mkdtempSync(join(tmpdir(), "claude-code-sparkshell-lazy-claudecode-bin-"));
const omoOnPathDir = join(fixtureRoot, "path-bin");
const emptyHomeDir = join(fixtureRoot, "empty-home");
const localBinHomeDir = join(fixtureRoot, "local-bin-home");
mkdirSync(omoOnPathDir, { recursive: true });
mkdirSync(emptyHomeDir, { recursive: true });
mkdirSync(join(localBinHomeDir, ".local", "bin"), { recursive: true });
writeFileSync(join(omoOnPathDir, "lazy-claudecode"), "#!/bin/sh\n");
writeFileSync(join(localBinHomeDir, ".local", "bin", "lazy-claudecode"), "#!/bin/sh\n");

describe("Claude Code Sparkshell awareness", () => {
	afterAll(() => {
		rmSync(fixtureRoot, { recursive: true, force: true });
	});

	it("#given active Claude Code app server env with lazy-claudecode on PATH #when SessionStart runs #then emits Sparkshell guidance", async () => {
		// given
		const env = {
			LAZY_CLAUDECODE_INTERNAL_ORIGINATOR_OVERRIDE: "Claude Code Desktop",
			LAZY_CLAUDECODE_SHELL: "1",
			LAZY_CLAUDECODE_RULES_ENABLED_SOURCES: ".claude/rules",
			PATH: omoOnPathDir,
			HOME: emptyHomeDir,
		};

		// when
		const output = await runSessionStartHook(
			{
				session_id: "session-sparkshell-active",
				transcript_path: null,
				cwd: process.cwd(),
				hook_event_name: "SessionStart",
				model: "gpt-5.5",
				permission_mode: "default",
				source: "startup",
			},
			{ env },
		);

		// then
		const context = parseAdditionalContext(output);
		expectSparkshellFirstContract(context);
		expect(context).toContain("LAZY_CLAUDECODE_SPARKSHELL_SESSION_CONTEXT");
		expect(context).toContain("LAZY_CLAUDECODE_SPARKSHELL_CONDENSE");
		expect(context).toContain("LAZY_CLAUDECODE_SPARKSHELL_SPARK");
		expect(context).toContain("[sparkshell caption]");
		expect(context).toContain("never appends that context to command output");
		expect(context).toContain("what the full output contained");
		expect(context).not.toContain("[REDACTED]");
		expect(context).not.toContain("appends recent session context");
	});

	it("#given inactive env #when SessionStart runs #then emits no Sparkshell guidance", async () => {
		// given
		const env = {
			LAZY_CLAUDECODE_RULES_ENABLED_SOURCES: ".claude/rules",
		};

		// when
		const output = await runSessionStartHook(
			{
				session_id: "session-sparkshell-inactive",
				transcript_path: null,
				cwd: process.cwd(),
				hook_event_name: "SessionStart",
				model: "gpt-5.5",
				permission_mode: "default",
				source: "startup",
			},
			{ env },
		);

		// then
		expect(output).toBe("");
	});

	it("#given Claude Code CLI appserver socket env #when SessionStart runs #then emits Sparkshell guidance", async () => {
		// given
		const env = {
			LAZY_CLAUDECODE_SPARKSHELL_APP_SERVER_SOCKET: "/tmp/app-server-control.sock",
			LAZY_CLAUDECODE_THREAD_ID: "thread-sparkshell-cli",
			LAZY_CLAUDECODE_RULES_ENABLED_SOURCES: ".claude/rules",
			PATH: omoOnPathDir,
			HOME: emptyHomeDir,
		};

		// when
		const output = await runSessionStartHook(
			{
				session_id: "session-sparkshell-cli-wrapper",
				transcript_path: null,
				cwd: process.cwd(),
				hook_event_name: "SessionStart",
				model: "gpt-5.5",
				permission_mode: "default",
				source: "startup",
			},
			{ env },
		);

		// then
		expect(parseAdditionalContext(output)).toContain("lazy-claudecode sparkshell <command>");
	});

	it("#given active Claude Code app env without a resolvable lazy-claudecode command #when SessionStart runs #then emits no Sparkshell guidance", async () => {
		// given
		const env = {
			LAZY_CLAUDECODE_INTERNAL_ORIGINATOR_OVERRIDE: "Claude Code Desktop",
			LAZY_CLAUDECODE_SHELL: "1",
			LAZY_CLAUDECODE_RULES_ENABLED_SOURCES: ".claude/rules",
			PATH: join(fixtureRoot, "missing-path-entry"),
			HOME: emptyHomeDir,
		};

		// when
		const output = await runSessionStartHook(
			{
				session_id: "session-sparkshell-unresolvable",
				transcript_path: null,
				cwd: process.cwd(),
				hook_event_name: "SessionStart",
				model: "gpt-5.5",
				permission_mode: "default",
				source: "startup",
			},
			{ env },
		);

		// then
		expect(output).toBe("");
	});

	it("#given lazy-claudecode only under HOME/.local/bin #when SessionStart runs #then emits guidance with the absolute lazy-claudecode path", async () => {
		// given
		const env = {
			LAZY_CLAUDECODE_INTERNAL_ORIGINATOR_OVERRIDE: "Claude Code Desktop",
			LAZY_CLAUDECODE_SHELL: "1",
			LAZY_CLAUDECODE_RULES_ENABLED_SOURCES: ".claude/rules",
			PATH: join(fixtureRoot, "missing-path-entry"),
			HOME: localBinHomeDir,
		};

		// when
		const output = await runSessionStartHook(
			{
				session_id: "session-sparkshell-local-bin",
				transcript_path: null,
				cwd: process.cwd(),
				hook_event_name: "SessionStart",
				model: "gpt-5.5",
				permission_mode: "default",
				source: "startup",
			},
			{ env },
		);

		// then
		const context = parseAdditionalContext(output);
		expect(context).toContain(
			`${join(localBinHomeDir, ".local", "bin", "lazy-claudecode")} sparkshell <command>`,
		);
		expect(context).not.toContain("`lazy-claudecode sparkshell <command>`");
	});

	it("#given explicit force-on env #when SessionStart runs #then emits Sparkshell guidance", async () => {
		// given
		const env = {
			LAZY_CLAUDECODE_SPARKSHELL_AWARENESS: "1",
			LAZY_CLAUDECODE_RULES_ENABLED_SOURCES: ".claude/rules",
		};

		// when
		const output = await runSessionStartHook(
			{
				session_id: "session-sparkshell-force-on",
				transcript_path: null,
				cwd: process.cwd(),
				hook_event_name: "SessionStart",
				model: "gpt-5.5",
				permission_mode: "default",
				source: "startup",
			},
			{ env },
		);

		// then
		expect(parseAdditionalContext(output)).toContain("lazy-claudecode sparkshell <command>");
	});

	it("#given explicit force-off env with active Claude Code app context #when SessionStart runs #then emits no Sparkshell guidance", async () => {
		// given
		const env = {
			LAZY_CLAUDECODE_SPARKSHELL_AWARENESS: "0",
			LAZY_CLAUDECODE_INTERNAL_ORIGINATOR_OVERRIDE: "Claude Code Desktop",
			LAZY_CLAUDECODE_SHELL: "1",
			LAZY_CLAUDECODE_RULES_ENABLED_SOURCES: ".claude/rules",
		};

		// when
		const output = await runSessionStartHook(
			{
				session_id: "session-sparkshell-force-off",
				transcript_path: null,
				cwd: process.cwd(),
				hook_event_name: "SessionStart",
				model: "gpt-5.5",
				permission_mode: "default",
				source: "startup",
			},
			{ env },
		);

		// then
		expect(output).toBe("");
	});

	it("#given Sparkshell awareness already emitted for a session #when UserPromptSubmit runs #then emits no duplicate guidance", async () => {
		// given
		const pluginDataRoot = mkdtempSync(join(tmpdir(), "claude-code-sparkshell-awareness-"));
		const env = {
			LAZY_CLAUDECODE_INTERNAL_ORIGINATOR_OVERRIDE: "Claude Code Desktop",
			LAZY_CLAUDECODE_SHELL: "1",
			LAZY_CLAUDECODE_RULES_ENABLED_SOURCES: ".claude/rules",
			PATH: omoOnPathDir,
			HOME: emptyHomeDir,
		};
		try {
			const firstOutput = await runSessionStartHook(
				{
					session_id: "session-sparkshell-dedupe",
					transcript_path: null,
					cwd: process.cwd(),
					hook_event_name: "SessionStart",
					model: "gpt-5.5",
					permission_mode: "default",
					source: "startup",
				},
				{ env, pluginDataRoot },
			);
			expect(parseAdditionalContext(firstOutput)).toContain("lazy-claudecode sparkshell <command>");

			// when
			const secondOutput = await runUserPromptSubmitHook(
				{
					session_id: "session-sparkshell-dedupe",
					turn_id: "turn-1",
					transcript_path: null,
					cwd: process.cwd(),
					hook_event_name: "UserPromptSubmit",
					model: "gpt-5.5",
					permission_mode: "default",
					prompt: "continue",
				},
				{ env, pluginDataRoot },
			);

			// then
			expect(secondOutput).toBe("");
		} finally {
			rmSync(pluginDataRoot, { recursive: true, force: true });
		}
	});

	it("#given explicit force-on env #when hook output is formatted #then awareness remains valid hook JSON", () => {
		// given
		const context = [
			"## Sparkshell Runtime",
			"",
			"- Prefer `lazy-claudecode sparkshell <command>` for shell-native inspection.",
		].join("\n");

		// when
		const output = formatAdditionalContextOutput("SessionStart", context);

		// then
		expect(parseAdditionalContext(output)).toContain("## Sparkshell Runtime");
	});
});
