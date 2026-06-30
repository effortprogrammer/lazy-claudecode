/**
 * Transcript reading and context pressure detection.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { debugLog } from "./paths.ts";

export interface TranscriptMessage {
	role: string;
	content: string | Array<{ type: string; text?: string }>;
}

/**
 * Read the transcript from a transcript file path.
 */
export function readTranscript(transcriptPath: string): TranscriptMessage[] {
	if (!transcriptPath || !existsSync(transcriptPath)) {
		debugLog("Transcript not found:", transcriptPath);
		return [];
	}
	try {
		const raw = readFileSync(transcriptPath, "utf-8");
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return parsed;
		}
		if (parsed.messages && Array.isArray(parsed.messages)) {
			return parsed.messages;
		}
		return [];
	} catch (err) {
		debugLog("Failed to read transcript:", err);
		return [];
	}
}

/**
 * Extract text content from a transcript message.
 */
export function getMessageText(msg: TranscriptMessage): string {
	if (typeof msg.content === "string") {
		return msg.content;
	}
	if (Array.isArray(msg.content)) {
		return msg.content
			.filter((c) => c.type === "text" && c.text)
			.map((c) => c.text!)
			.join("\n");
	}
	return "";
}

/**
 * Estimate context pressure from transcript size.
 * Returns a value between 0 and 1 where 1 means maximum pressure.
 */
export function estimateContextPressure(transcriptPath: string): number {
	if (!transcriptPath || !existsSync(transcriptPath)) {
		return 0;
	}
	try {
		const stat = statSync(transcriptPath);
		const sizeKB = stat.size / 1024;
		// Rough estimate: Claude Code context is ~200K tokens
		// Average 4 chars per token, so ~800KB of text
		// Start warning at 50% = 400KB
		const maxKB = 800;
		return Math.min(1, sizeKB / maxKB);
	} catch {
		return 0;
	}
}

/**
 * Get the last N messages from the transcript.
 */
export function getLastMessages(transcriptPath: string, count: number): TranscriptMessage[] {
	const messages = readTranscript(transcriptPath);
	return messages.slice(-count);
}

/**
 * Check if context pressure is high enough to warrant compaction warning.
 */
export function isContextPressureHigh(transcriptPath: string): boolean {
	return estimateContextPressure(transcriptPath) > 0.7;
}
