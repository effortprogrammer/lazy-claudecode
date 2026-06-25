/**
 * Resolve the installer binary directory for Claude Code.
 */

export interface InstallerBinDirOptions {
	readonly claudeCodeHome: string;
	readonly env?: Record<string, string | undefined>;
}

export function resolveClaudeCodeInstallerBinDir(options: InstallerBinDirOptions): string {
	const { join } = require("node:path");
	return join(options.claudeCodeHome, "bin");
}
