/**
 * lazy-claudecode — Agent harness for Claude Code
 *
 * This package is primarily used via CLI (lazy-claudecode install/uninstall/doctor)
 * and hook commands. This barrel export provides programmatic access to utilities.
 */

export { readHookInput, addContext, blockDecision, noDecision } from "./utils/hook-io.js";
export { getStateDir, getLazyClaudeCodeRoot, getClaudeSettingsPath } from "./utils/paths.js";
export { loadSessionState, saveSessionState } from "./state/session-state.js";
export { getActivePlan, getRemainingTasks } from "./state/plan-state.js";
