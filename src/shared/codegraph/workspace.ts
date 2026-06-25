/**
 * Codegraph workspace preparation — sets up workspace for codegraph indexing.
 */

export interface CodegraphWorkspacePreparation {
	readonly prepared: boolean;
	readonly workspaceDir: string;
	readonly indexDir?: string;
	readonly reason?: string;
}

export interface CodegraphWorkspaceOptions {
	readonly workspaceDir: string;
	readonly installDir: string;
}

export async function prepareCodegraphWorkspace(options: CodegraphWorkspaceOptions): Promise<CodegraphWorkspacePreparation> {
	const { join } = await import("node:path");
	const { mkdir } = await import("node:fs/promises");

	const indexDir = join(options.workspaceDir, ".codegraph");
	try {
		await mkdir(indexDir, { recursive: true });
		return { prepared: true, workspaceDir: options.workspaceDir, indexDir };
	} catch (error) {
		return { prepared: false, workspaceDir: options.workspaceDir, reason: String(error) };
	}
}

export async function ensureCodegraphGitignored(workspaceDir: string): Promise<void> {
	const { join } = await import("node:path");
	const { readFile, appendFile } = await import("node:fs/promises");

	const gitignorePath = join(workspaceDir, ".gitignore");
	try {
		const content = await readFile(gitignorePath, "utf-8");
		if (!content.includes(".codegraph")) {
			await appendFile(gitignorePath, "\n.codegraph/\n");
		}
	} catch {
		// No .gitignore or can't read it — skip
	}
}
