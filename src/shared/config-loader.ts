/**
 * Configuration loader for lazy-claudecode.
 * Reads and parses the lazy-claudecode configuration.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface LazyClaudeCodeConfig {
	readonly codegraph?: {
		readonly enabled: boolean;
		readonly installDir?: string;
		readonly autoProvision?: boolean;
		readonly mcpServerName?: string;
	};
	readonly telemetry?: {
		readonly enabled: boolean;
		readonly anonymous?: boolean;
	};
	readonly rules?: {
		readonly enabled: boolean;
		readonly maxInjectionSize?: number;
	};
	readonly ulwLoop?: {
		readonly enabled: boolean;
	};
}

export function getLazyClaudeCodeConfig(configDir?: string): LazyClaudeCodeConfig {
	const dir = configDir ?? join(homedir(), ".claude");
	const configPath = join(dir, "lazy-claudecode.json");
	try {
		const raw = readFileSync(configPath, "utf-8");
		return JSON.parse(raw) as LazyClaudeCodeConfig;
	} catch {
		return {};
	}
}
