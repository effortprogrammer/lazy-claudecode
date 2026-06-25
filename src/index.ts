/**
 * lazy-claudecode — Agent harness for Claude Code
 *
 * This package is primarily used via CLI (lazy-claudecode install/uninstall/doctor)
 * and hook commands. This barrel export provides programmatic access to utilities.
 */

export { readHookInput, addContext, blockDecision, noDecision } from "./utils/hook-io.ts";
export { getStateDir, getLazyClaudeCodeRoot, getClaudeSettingsPath } from "./utils/paths.ts";
export { loadSessionState, saveSessionState } from "./state/session-state.ts";
export { getActivePlan, getRemainingTasks } from "./state/plan-state.ts";
