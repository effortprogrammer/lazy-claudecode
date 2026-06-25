/**
 * Codegraph guidance builder — constructs init guidance for tool results.
 */

export interface CodegraphGuidanceOptions {
	readonly available: boolean;
	readonly reason?: string;
	readonly mcpServerName?: string;
}

export function buildCodegraphInitGuidanceForToolResult(options: CodegraphGuidanceOptions): string {
	if (!options.available) {
		return options.reason ?? "Codegraph is not available in this session.";
	}
	const serverName = options.mcpServerName ?? "codegraph";
	return `Codegraph MCP server '${serverName}' is available. Use it to explore the codebase structure, find definitions, and navigate references.`;
}
