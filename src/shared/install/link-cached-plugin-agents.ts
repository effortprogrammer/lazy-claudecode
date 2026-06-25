/**
 * Link cached plugin agent configs into Claude Code's settings.
 */
import type { ClaudeCodeAgentConfig } from "./types.ts";

export interface LinkCachedPluginAgentsOptions {
	readonly claudeCodeHome: string;
	readonly agentConfigs: readonly ClaudeCodeAgentConfig[];
	readonly pluginName: string;
}

export async function linkCachedPluginAgents(options: LinkCachedPluginAgentsOptions): Promise<void> {
	// Registers agent configs in Claude Code's settings directory
	const { join } = await import("node:path");
	const { mkdir, writeFile } = await import("node:fs/promises");
	const agentsDir = join(options.claudeCodeHome, "agents");
	await mkdir(agentsDir, { recursive: true });
	for (const config of options.agentConfigs) {
		const agentPath = join(agentsDir, `${options.pluginName}-${config.name}.json`);
		await writeFile(agentPath, JSON.stringify(config, null, "\t"), "utf-8");
	}
}
