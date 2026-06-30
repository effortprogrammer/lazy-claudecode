/**
 * Hook I/O utilities for Claude Code hook handlers.
 *
 * Hook handlers receive JSON on stdin and output JSON to stdout.
 * These helpers standardize the I/O patterns.
 */

/**
 * Read all of stdin and parse as JSON.
 */
export async function readHookInput<T = Record<string, unknown>>(): Promise<T> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		process.stdin.setEncoding("utf-8");
		process.stdin.on("data", (chunk: string | Buffer) => {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		});
		process.stdin.on("end", () => {
			const raw = Buffer.concat(chunks).toString("utf-8").trim();
			if (!raw) {
				resolve({} as T);
				return;
			}
			try {
				resolve(JSON.parse(raw) as T);
			} catch (err) {
				reject(new Error(`Failed to parse hook input: ${err}`));
			}
		});
		process.stdin.on("error", reject);
		// If stdin is already ended (piped and closed), force end
		if (process.stdin.readableEnded) {
			resolve({} as T);
		}
	});
}

/**
 * Write a raw JSON object to stdout.
 */
export function writeHookOutput(output: object): void {
	process.stdout.write(`${JSON.stringify(output)}\n`);
}

/**
 * Write additional context to be injected into the conversation.
 */
export function addContext(eventName: string, context: string): void {
	writeHookOutput({
		hookSpecificOutput: {
			hookEventName: eventName,
			additionalContext: context,
		},
	});
}

/**
 * Block the current action (for Stop/SubagentStop hooks).
 */
export function blockDecision(reason: string): void {
	writeHookOutput({
		decision: "block",
		reason,
	});
}

/**
 * Deny a tool use (for PreToolUse hooks).
 */
export function denyToolUse(reason: string): void {
	writeHookOutput({
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "deny",
			permissionDecisionReason: reason,
		},
	});
}

/**
 * Approve a tool use (for PreToolUse hooks).
 */
export function approveToolUse(): void {
	writeHookOutput({
		hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "allow",
		},
	});
}

/**
 * No-op output — hook has no opinion.
 */
export function noDecision(): void {
	// Outputting nothing or empty object means no decision
	writeHookOutput({});
}

/**
 * Common hook input types
 */
export interface BaseHookInput {
	session_id?: string;
	cwd?: string;
	transcript_path?: string;
}

export interface ToolUseHookInput extends BaseHookInput {
	tool_name?: string;
	tool_input?: Record<string, unknown>;
	tool_response?: string;
}

export interface UserPromptHookInput extends BaseHookInput {
	user_prompt?: string;
	prompt?: string;
}

export interface StopHookInput extends BaseHookInput {
	stop_reason?: string;
	transcript_path?: string;
}
