/**
 * Codegraph resolution — resolves codegraph installation and configuration.
 */

export interface CodegraphResolution {
	readonly resolved: boolean;
	readonly installDir?: string;
	readonly configPath?: string;
	readonly reason?: string;
}

export interface CodegraphResolveOptions {
	readonly homeDir?: string;
	readonly workspaceDir?: string;
}

export function resolveCodegraph(options: CodegraphResolveOptions): CodegraphResolution {
	const { join } = require("node:path");
	const homeDir = options.homeDir ?? require("node:os").homedir();
	const installDir = join(homeDir, ".claude", "codegraph");

	try {
		const { existsSync } = require("node:fs");
		if (existsSync(installDir)) {
			return { resolved: true, installDir };
		}
	} catch {
		// ignore
	}
	return { resolved: false, reason: "Codegraph installation not found" };
}

export function resolveCodegraphConfig(options: CodegraphResolveOptions): CodegraphResolution {
	return resolveCodegraph(options);
}
