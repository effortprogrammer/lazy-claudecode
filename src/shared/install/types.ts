/**
 * Shared installer types for lazy-claudecode.
 */

export interface ClaudeCodeAgentConfig {
	readonly name: string;
	readonly component: string;
	readonly hooks: Record<string, unknown>;
	readonly enabled?: boolean;
}

export interface GitBashResolution {
	readonly available: boolean;
	readonly path?: string;
	readonly version?: string;
	readonly reason?: string;
}

export interface PluginManifest {
	readonly name: string;
	readonly version: string;
	readonly components: readonly string[];
}
