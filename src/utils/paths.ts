/**
 * Path utilities for lazy-claudecode.
 */

import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Get the root directory of the lazy-claudecode installation.
 */
export function getLazyClaudeCodeRoot(): string {
  if (process.env.LAZY_CLAUDECODE_ROOT) {
    return process.env.LAZY_CLAUDECODE_ROOT;
  }
  // Default: two levels up from dist/utils/
  return resolve(import.meta.url.replace("file://", ""), "..", "..", "..");
}

/**
 * Get the state directory for persisting session data.
 * Default: ~/.lazy-claudecode/
 */
export function getStateDir(): string {
  const dir = process.env.LAZY_CLAUDECODE_STATE_DIR || join(homedir(), ".lazy-claudecode");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Get the session state file path.
 */
export function getSessionStatePath(sessionId: string): string {
  const dir = join(getStateDir(), "sessions");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, `${sessionId}.json`);
}

/**
 * Get the Claude settings file path.
 */
export function getClaudeSettingsPath(): string {
  return join(homedir(), ".claude", "settings.json");
}

/**
 * Get the project-local Claude settings path.
 */
export function getProjectClaudeSettingsPath(cwd: string): string {
  return join(cwd, ".claude", "settings.json");
}

/**
 * Get the Claude MCP config path for a project.
 */
export function getClaudeMcpConfigPath(cwd: string): string {
  return join(cwd, ".claude", ".mcp.json");
}

/**
 * Get the telemetry marker file path.
 */
export function getTelemetryMarkerPath(): string {
  return join(getStateDir(), "telemetry-last-ping.json");
}

/**
 * Get the plan state directory.
 */
export function getPlanStateDir(cwd: string): string {
  return join(cwd, ".lazy-claudecode", "plans");
}

/**
 * Check if a binary exists on PATH.
 */
export function binaryExists(name: string): boolean {
  const { execSync } = require("node:child_process");
  try {
    execSync(`which ${name}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Determine if debug mode is enabled.
 */
export function isDebug(): boolean {
  return process.env.LAZY_CLAUDECODE_DEBUG === "1";
}

/**
 * Debug log — only outputs when LAZY_CLAUDECODE_DEBUG=1.
 */
export function debugLog(...args: unknown[]): void {
  if (isDebug()) {
    console.error("[lazy-claudecode:debug]", ...args);
  }
}
