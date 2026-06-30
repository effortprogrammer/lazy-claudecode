/**
 * Cache and link plugin binaries for Claude Code.
 */

export interface LinkCachedPluginBinsOptions {
	readonly claudeCodeHome: string;
	readonly pluginRoot: string;
	readonly binNames: readonly string[];
}

export async function linkCachedPluginBins(options: LinkCachedPluginBinsOptions): Promise<void> {
	const { join } = await import("node:path");
	const { mkdir, symlink, unlink } = await import("node:fs/promises");
	const binDir = join(options.claudeCodeHome, "bin");
	await mkdir(binDir, { recursive: true });
	for (const name of options.binNames) {
		const target = join(options.pluginRoot, "dist", `${name}.js`);
		const link = join(binDir, name);
		try {
			await unlink(link);
		} catch {
			/* ok */
		}
		try {
			await symlink(target, link);
		} catch {
			/* ok */
		}
	}
}

export async function linkRootRuntimeBin(
	claudeCodeHome: string,
	pluginRoot: string,
): Promise<void> {
	const { join } = await import("node:path");
	const { mkdir, symlink, unlink } = await import("node:fs/promises");
	const binDir = join(claudeCodeHome, "bin");
	await mkdir(binDir, { recursive: true });
	const target = join(pluginRoot, "dist", "cli.js");
	const link = join(binDir, "lazy-claudecode");
	try {
		await unlink(link);
	} catch {
		/* ok */
	}
	try {
		await symlink(target, link);
	} catch {
		/* ok */
	}
}
