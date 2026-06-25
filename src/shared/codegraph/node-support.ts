/**
 * Codegraph Node.js support evaluation.
 */

/** Environment variable to bypass Node.js safety checks. */
export const CODEGRAPH_UNSAFE_NODE_ENV = "CODEGRAPH_UNSAFE_NODE";

export interface CodegraphNodeSupport {
	readonly supported: boolean;
	readonly nodeVersion: string;
	readonly reason?: string;
}

export function evaluateCodegraphNodeSupport(nodeVersion?: string): CodegraphNodeSupport {
	const version = nodeVersion ?? process.versions.node;
	const major = Number.parseInt(version.split(".")[0] ?? "0", 10);
	if (major < 18) {
		return { supported: false, nodeVersion: version, reason: `Node.js ${version} is below the minimum (18.x)` };
	}
	return { supported: true, nodeVersion: version };
}
