import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";

import { runCodegraphServe } from "../src/serve.ts";

describe("runCodegraphServe unavailable CodeGraph paths", () => {
	it("#given CodeGraph is unresolved #when serving MCP #then exposes an empty facade with a skip hint", async () => {
		// given
		const stderr: string[] = [];
		const spawned: string[] = [];

		// when
		const exitCode = await runCodegraphServe({
			...closedMcpStdio(),
			config: { codegraph: { auto_provision: false, enabled: true }, sources: [], warnings: [] },
			env: { PATH: "/bin" },
			buildEnv: () => ({}),
			resolve: () => ({ argsPrefix: [], command: "codegraph", exists: false, source: "path" }),
			runProcess: (command: string) => {
				spawned.push(command);
				return Promise.resolve(0);
			},
			stderr: { write: (chunk: string) => stderr.push(chunk) },
		});

		// then
		expect(exitCode).toBe(0);
		expect(spawned).toEqual([]);
		expect(stderr).toEqual([
			"CodeGraph MCP skipped: codegraph binary not found. Install CodeGraph or set LAZY_CLAUDECODE_CODEGRAPH_BIN.\n",
		]);
	});

	it("#given an unsupported local Node #when serving MCP #then exposes an empty facade without spawning codegraph", async () => {
		// given
		const stderr: string[] = [];
		const spawned: string[] = [];

		// when
		const exitCode = await runCodegraphServe({
			...closedMcpStdio(),
			env: {},
			nodeVersion: "26.3.0",
			buildEnv: () => ({}),
			resolve: () => ({ argsPrefix: [], command: "codegraph", exists: true, source: "path" }),
			runProcess: (command: string) => {
				spawned.push(command);
				return Promise.resolve(0);
			},
			stderr: { write: (chunk: string) => stderr.push(chunk) },
		});

		// then
		expect(exitCode).toBe(0);
		expect(spawned).toEqual([]);
		expect(stderr).toHaveLength(1);
		expect(stderr[0]).toContain("CodeGraph MCP skipped");
		expect(stderr[0]).toContain("CODEGRAPH_ALLOW_UNSAFE_NODE");
	});

	it("#given LAZY_CLAUDECODE_CODEGRAPH_BIN points at a missing path #when serving MCP #then exposes an empty facade before spawn", async () => {
		// given
		const stderr: string[] = [];
		const spawned: string[] = [];

		// when
		const exitCode = await runCodegraphServe({
			...closedMcpStdio(),
			buildEnv: () => ({}),
			commandExists: () => false,
			resolve: () => ({ argsPrefix: [], command: "/nonexistent", exists: true, source: "env" }),
			runProcess: (command: string) => {
				spawned.push(command);
				return Promise.resolve(0);
			},
			stderr: { write: (chunk: string) => stderr.push(chunk) },
		});

		// then
		expect(exitCode).toBe(0);
		expect(spawned).toEqual([]);
		expect(stderr).toEqual([
			"CodeGraph MCP skipped: codegraph binary not found. Install CodeGraph or set LAZY_CLAUDECODE_CODEGRAPH_BIN.\n",
		]);
	});

	it("#given Claude Code SOT disables CodeGraph #when serving MCP #then exposes an empty facade with a disabled hint", async () => {
		// given
		const homeDir = mkdtempSync(join(tmpdir(), "lazy-claudecode-codegraph-serve-disabled-home-"));
		const workspace = mkdtempSync(join(tmpdir(), "lazy-claudecode-codegraph-serve-disabled-workspace-"));
		const stderr: string[] = [];
		const spawned: string[] = [];
		try {
			mkdirSync(join(homeDir, ".claude"), { recursive: true });
			mkdirSync(join(workspace, ".claude"), { recursive: true });
			writeFileSync(join(homeDir, ".claude", "config.jsonc"), '{ "codegraph": { "enabled": true } }\n');
			writeFileSync(join(workspace, ".claude", "config.jsonc"), '{ "[claude-code]": { "codegraph": { "enabled": false } } }\n');

			// when
			const exitCode = await runCodegraphServe({
				...closedMcpStdio(),
				cwd: workspace,
				env: { HOME: homeDir },
				runProcess: (command: string) => {
					spawned.push(command);
					return Promise.resolve(0);
				},
				stderr: { write: (chunk: string) => stderr.push(chunk) },
			});

			// then
			expect(exitCode).toBe(0);
			expect(spawned).toEqual([]);
			expect(stderr).toEqual([
				"CodeGraph MCP skipped: disabled by LAZY_CLAUDECODE SOT config. Set [claude-code].codegraph.enabled=true to enable it.\n",
			]);
		} finally {
			rmSync(homeDir, { recursive: true, force: true });
			rmSync(workspace, { recursive: true, force: true });
		}
	});
});

function closedMcpStdio(): { readonly stdin: PassThrough; readonly stdout: PassThrough } {
	const stdin = new PassThrough();
	const stdout = new PassThrough();
	stdout.resume();
	stdin.end();
	return { stdin, stdout };
}
