/**
 * Post-Compact Reset hook — PostCompact
 *
 * After context compaction, resets session state caches
 * to avoid stale data influencing the compacted session.
 */

import {
  readHookInput,
  addContext,
  noDecision,
  type BaseHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";
import {
  loadSessionState,
  saveSessionState,
  resetCaches,
} from "../state/session-state.js";

interface PostCompactInput extends BaseHookInput {
  session_id?: string;
}

async function main(): Promise<void> {
  try {
    const input = await readHookInput<PostCompactInput>();
    const sessionId = input.session_id || "unknown";

    const state = loadSessionState(sessionId);
    resetCaches(state);
    saveSessionState(state);

    const compactNum = state.compactCount;

    addContext(
      "PostCompact",
      `**🔄 lazy-claudecode: Context compacted (compaction #${compactNum})**\n` +
      "Session caches have been reset. Diagnostics and state will be re-evaluated on next use.\n" +
      (state.ultraworkActive ? "[Ultrawork mode still active]\n" : "") +
      (state.ulwLoopActive ? `[ULW Loop still active — Goal: ${state.ulwLoopGoal}]\n` : "")
    );
  } catch (err) {
    debugLog("Post-compact reset error:", err);
    noDecision();
  }
}

main();
