/**
 * Update Claude Code configuration (settings.json or config.toml).
 */

export interface UpdateClaudeCodeConfigOptions {
	readonly claudeCodeHome: string;
	readonly hooks?: Record<string, unknown>;
	readonly mcpServers?: Record<string, unknown>;
}

export async function updateClaudeCodeConfig(options: UpdateClaudeCodeConfigOptions): Promise<void> {
	const { join } = await import("node:path");
	const { readFile, writeFile, mkdir } = await import("node:fs/promises");
	const settingsPath = join(options.claudeCodeHome, "settings.json");

	let settings: Record<string, unknown> = {};
	try {
		const raw = await readFile(settingsPath, "utf-8");
		settings = JSON.parse(raw);
	} catch { /* fresh settings */ }

	if (options.hooks) {
		settings["hooks"] = { ...(settings["hooks"] as Record<string, unknown> ?? {}), ...options.hooks };
	}
	if (options.mcpServers) {
		settings["mcpServers"] = { ...(settings["mcpServers"] as Record<string, unknown> ?? {}), ...options.mcpServers };
	}

	await mkdir(options.claudeCodeHome, { recursive: true });
	await writeFile(settingsPath, JSON.stringify(settings, null, "\t"), "utf-8");
}
