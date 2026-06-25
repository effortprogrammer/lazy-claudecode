/**
 * Git Bash detection and preparation for Windows environments.
 */

import type { GitBashResolution } from "./types.ts";

export interface PrepareGitBashOptions {
	readonly env?: Record<string, string | undefined>;
}

export async function prepareGitBashForInstall(options?: PrepareGitBashOptions): Promise<GitBashResolution> {
	const platform = process.platform;
	if (platform !== "win32") {
		return { available: false, reason: "Git Bash is only relevant on Windows" };
	}

	const { existsSync } = await import("node:fs");
	const candidates = [
		process.env["PROGRAMFILES"] && `${process.env["PROGRAMFILES"]}\\Git\\bin\\bash.exe`,
		"C:\\Program Files\\Git\\bin\\bash.exe",
		"C:\\Program Files (x86)\\Git\\bin\\bash.exe",
	].filter(Boolean) as string[];

	for (const candidate of candidates) {
		if (existsSync(candidate)) {
			return { available: true, path: candidate };
		}
	}

	return { available: false, reason: "Git Bash not found in standard locations" };
}
