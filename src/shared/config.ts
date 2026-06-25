/**
 * Shared configuration types for lazy-claudecode.
 */

export interface CodegraphConfig {
	readonly enabled: boolean;
	readonly installDir?: string;
	readonly autoProvision?: boolean;
	readonly mcpServerName?: string;
}

export interface LazyClaudeCodeConfig {
	readonly codegraph?: CodegraphConfig;
	readonly telemetry?: {
		readonly enabled: boolean;
		readonly anonymous?: boolean;
	};
	readonly rules?: {
		readonly enabled: boolean;
		readonly maxInjectionSize?: number;
	};
}
