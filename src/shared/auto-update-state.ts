import { homedir } from "node:os";
/**
 * Auto-update state management — lock acquisition and state persistence.
 */
import { join } from "node:path";

export const DEFAULT_LOCK_STALE_MS = 30_000;

export function resolveLockPath(name: string): string {
	return join(homedir(), ".claude", "locks", `${name}.lock`);
}

export function resolveStatePath(name: string): string {
	return join(homedir(), ".claude", "state", `${name}.json`);
}

export async function acquireLock(
	lockPath: string,
	staleMs = DEFAULT_LOCK_STALE_MS,
): Promise<() => Promise<void>> {
	const { mkdir, writeFile, unlink, stat } = await import("node:fs/promises");
	const { dirname } = await import("node:path");

	await mkdir(dirname(lockPath), { recursive: true });

	try {
		const lockStat = await stat(lockPath);
		if (Date.now() - lockStat.mtimeMs > staleMs) {
			await unlink(lockPath);
		}
	} catch {
		/* no lock file */
	}

	await writeFile(lockPath, String(process.pid), { flag: "wx" });
	return async () => {
		try {
			await unlink(lockPath);
		} catch {
			/* ok */
		}
	};
}

export async function readState<T>(statePath: string): Promise<T | null> {
	try {
		const { readFile } = await import("node:fs/promises");
		const raw = await readFile(statePath, "utf-8");
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

export async function writeState<T>(statePath: string, state: T): Promise<void> {
	const { mkdir, writeFile } = await import("node:fs/promises");
	const { dirname } = await import("node:path");
	await mkdir(dirname(statePath), { recursive: true });
	await writeFile(statePath, JSON.stringify(state, null, "\t"), "utf-8");
}
