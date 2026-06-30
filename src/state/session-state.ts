/**
 * Per-session state management.
 * Stores diagnostics cache, attempt counts, and other transient state.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { debugLog, getSessionStatePath } from "../utils/paths.ts";

export interface DiagnosticsEntry {
	file: string;
	timestamp: number;
	errorCount: number;
	warningCount: number;
	diagnostics: string[];
}

export interface SessionState {
	sessionId: string;
	startedAt: string;
	diagnosticsCache: Record<string, DiagnosticsEntry>;
	diagnosticsAttempts: Record<string, number>;
	ultraworkActive: boolean;
	ulwLoopActive: boolean;
	ulwLoopGoal: string | null;
	ulwLoopCheckpoints: string[];
	bootstrapComplete: boolean;
	rulesLoaded: boolean;
	compactCount: number;
}

function createDefaultState(sessionId: string): SessionState {
	return {
		sessionId,
		startedAt: new Date().toISOString(),
		diagnosticsCache: {},
		diagnosticsAttempts: {},
		ultraworkActive: false,
		ulwLoopActive: false,
		ulwLoopGoal: null,
		ulwLoopCheckpoints: [],
		bootstrapComplete: false,
		rulesLoaded: false,
		compactCount: 0,
	};
}

/**
 * Load session state from disk.
 */
export function loadSessionState(sessionId: string): SessionState {
	if (!sessionId) {
		return createDefaultState("unknown");
	}
	const path = getSessionStatePath(sessionId);
	if (!existsSync(path)) {
		return createDefaultState(sessionId);
	}
	try {
		const raw = readFileSync(path, "utf-8");
		return JSON.parse(raw) as SessionState;
	} catch (err) {
		debugLog("Failed to load session state:", err);
		return createDefaultState(sessionId);
	}
}

/**
 * Save session state to disk.
 */
export function saveSessionState(state: SessionState): void {
	if (!state.sessionId || state.sessionId === "unknown") {
		return;
	}
	const path = getSessionStatePath(state.sessionId);
	try {
		writeFileSync(path, JSON.stringify(state, null, 2), "utf-8");
	} catch (err) {
		debugLog("Failed to save session state:", err);
	}
}

/**
 * Update diagnostics cache for a file.
 */
export function updateDiagnosticsCache(
	state: SessionState,
	file: string,
	entry: Omit<DiagnosticsEntry, "file">,
): void {
	state.diagnosticsCache[file] = { ...entry, file };
}

/**
 * Check if diagnostics should be skipped for a file (recently checked).
 */
export function shouldSkipDiagnostics(
	state: SessionState,
	file: string,
	cooldownMs = 5000,
): boolean {
	const cached = state.diagnosticsCache[file];
	if (!cached) return false;
	return Date.now() - cached.timestamp < cooldownMs;
}

/**
 * Increment and get diagnostics attempt count for a file.
 */
export function incrementDiagnosticsAttempt(state: SessionState, file: string): number {
	const current = state.diagnosticsAttempts[file] || 0;
	state.diagnosticsAttempts[file] = current + 1;
	return current + 1;
}

/**
 * Reset session state caches (called after compaction).
 */
export function resetCaches(state: SessionState): void {
	state.diagnosticsCache = {};
	state.diagnosticsAttempts = {};
	state.compactCount += 1;
}
