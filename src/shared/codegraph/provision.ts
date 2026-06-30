/**
 * Codegraph provisioning — ensures the codegraph binary is available.
 */

export interface CodegraphProvisionResult {
	readonly provisioned: boolean;
	readonly binaryPath?: string;
	readonly version?: string;
	readonly reason?: string;
}

export interface CodegraphProvisionOptions {
	readonly installDir: string;
	readonly force?: boolean;
}

export async function ensureCodegraphProvisioned(
	options: CodegraphProvisionOptions,
): Promise<CodegraphProvisionResult> {
	const { join } = await import("node:path");
	const { existsSync } = await import("node:fs");

	const binaryPath = join(options.installDir, "codegraph");
	if (!options.force && existsSync(binaryPath)) {
		return { provisioned: true, binaryPath };
	}
	// In production, this would download and install codegraph
	return {
		provisioned: false,
		reason: "Codegraph binary not found; provision manually or run bootstrap",
	};
}
