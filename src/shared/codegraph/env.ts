/**
 * Codegraph environment builder — constructs env vars for the codegraph MCP server.
 */

export interface CodegraphEnvOptions {
	readonly installDir: string;
	readonly workspaceDir: string;
	readonly nodePath?: string;
	readonly extraEnv?: Record<string, string>;
}

export function buildCodegraphEnv(options: CodegraphEnvOptions): Record<string, string> {
	const env: Record<string, string> = {
		CODEGRAPH_INSTALL_DIR: options.installDir,
		CODEGRAPH_WORKSPACE_DIR: options.workspaceDir,
		...(options.extraEnv ?? {}),
	};
	if (options.nodePath) {
		env["CODEGRAPH_NODE_PATH"] = options.nodePath;
	}
	return env;
}
