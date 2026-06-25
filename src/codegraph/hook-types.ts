import type { Readable } from "node:stream";

import type { LazyClaudeCodeConfig as SharedLazyClaudeCodeConfig } from "../shared/config-loader.ts";
import type { CodegraphProvisionResult as SharedCodegraphProvisionResult } from "../shared/codegraph/provision.ts";
import type {
	CodegraphResolution,
	CodegraphResolveOptions,
} from "../shared/codegraph/resolve.ts";
import type { CodegraphWorkspacePreparation as SharedCodegraphWorkspacePreparation } from "../shared/codegraph/workspace.ts";
import type { CodegraphConfig as SharedCodegraphConfig } from "../shared/config.ts";

export type SessionStartAction = "skipped-disabled" | "spawned";
export type PostToolUseAction = "emitted-guidance" | "skipped";
export type WorkerAction = "failed" | "initialized" | "skipped-disabled" | "skipped-status" | "skipped-unavailable" | "skipped-unsupported-node" | "synced";

export interface WorkerSpawnInvocation {
	readonly args: readonly string[];
	readonly command: string;
	readonly env: Record<string, string | undefined>;
}

export interface HookStdout {
	readonly write: (chunk: string) => void;
}

export interface SessionStartHookResult {
	readonly action: SessionStartAction;
	readonly exitCode: 0;
}

export interface PostToolUseHookResult {
	readonly action: PostToolUseAction;
	readonly exitCode: 0;
}

export interface CodegraphCommandResult {
	readonly exitCode: number;
	readonly stderr?: string;
	readonly stdout: string;
	readonly timedOut: boolean;
}

export type CodegraphConfig = Partial<SharedCodegraphConfig>;
export type LazyClaudeCodeConfig = SharedLazyClaudeCodeConfig;
export type OmoConfigSource = string;
export type CodegraphProvisionResult = SharedCodegraphProvisionResult;
export type CodegraphWorkspacePreparation = SharedCodegraphWorkspacePreparation;

export interface CodegraphSessionStartOutcome {
	readonly action: WorkerAction;
	readonly error?: string;
	readonly exitCode?: number;
	readonly projectRoot?: string;
	readonly source?: string;
	readonly timedOut?: boolean;
}

export interface CodegraphSessionStartDeps {
	readonly ensureGitignored: (projectRoot: string) => boolean;
	readonly ensureProvisioned: (options: { readonly installDir?: string; readonly lockDir: string; readonly version: "1.0.1" }) => Promise<CodegraphProvisionResult>;
	readonly prepareWorkspace: (projectRoot: string, options: { readonly homeDir: string }) => CodegraphWorkspacePreparation;
	readonly resolveCommand: (options?: CodegraphResolveOptions) => CodegraphResolution;
	readonly runCommand: (
		projectRoot: string,
		command: string,
		args: readonly string[],
		options: { readonly env: Record<string, string>; readonly timeoutMs: number },
	) => Promise<CodegraphCommandResult>;
}

export interface SessionStartHookOptions {
	readonly argv?: readonly string[];
	readonly config?: LazyClaudeCodeConfig;
	readonly cwd?: string;
	readonly env?: Record<string, string | undefined>;
	readonly spawnWorker?: (invocation: WorkerSpawnInvocation) => void;
	readonly stdin?: Readable & { readonly isTTY?: boolean };
	readonly stdout?: HookStdout;
	readonly workerCliPath?: string;
}

export interface PostToolUseHookOptions {
	readonly env?: Record<string, string | undefined>;
	readonly stdin?: Readable & { readonly isTTY?: boolean };
	readonly stdout?: HookStdout;
}

export interface SessionStartWorkerOptions {
	readonly config?: LazyClaudeCodeConfig;
	readonly cwd?: string;
	readonly deps?: Partial<CodegraphSessionStartDeps>;
	readonly env?: Record<string, string | undefined>;
	readonly logOutcome?: (outcome: CodegraphSessionStartOutcome) => void;
	readonly nodeVersion?: string;
}
