/**
 * Stamp Git Bash MCP environment for Windows Claude Code sessions.
 */

export interface StampGitBashMcpEnvOptions {
	readonly claudeCodeHome: string;
	readonly gitBashPath: string;
}

export async function stampGitBashMcpEnv(options: StampGitBashMcpEnvOptions): Promise<void> {
	const { join } = await import("node:path");
	const { writeFile, mkdir } = await import("node:fs/promises");
	const envDir = join(options.claudeCodeHome, "mcp-env");
	await mkdir(envDir, { recursive: true });
	const envPath = join(envDir, "git-bash.json");
	await writeFile(envPath, JSON.stringify({
		GIT_BASH_PATH: options.gitBashPath,
	}, null, "\t"), "utf-8");
}
