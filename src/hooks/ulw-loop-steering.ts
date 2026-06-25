/**
 * ULW Loop Steering hook — UserPromptSubmit
 *
 * Detects ULW loop commands in user prompts and steers the session:
 * - "ulw loop start: <goal>" — Start a new ULW loop
 * - "ulw loop checkpoint" — Create a checkpoint
 * - "ulw loop status" — Show current loop status
 * - "ulw loop complete" — Mark loop as complete
 * - "ulw loop abort" — Abort the current loop
 */

import {
  readHookInput,
  addContext,
  noDecision,
  type UserPromptHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";
import { loadSessionState, saveSessionState } from "../state/session-state.js";

const LOOP_START_PATTERN = /\bulw\s+loop\s+start\s*:\s*(.+)/i;
const LOOP_CHECKPOINT_PATTERN = /\bulw\s+loop\s+checkpoint\b/i;
const LOOP_STATUS_PATTERN = /\bulw\s+loop\s+status\b/i;
const LOOP_COMPLETE_PATTERN = /\bulw\s+loop\s+complete\b/i;
const LOOP_ABORT_PATTERN = /\bulw\s+loop\s+(abort|cancel|stop)\b/i;

async function main(): Promise<void> {
  try {
    const input = await readHookInput<UserPromptHookInput>();
    const prompt = input.user_prompt || input.prompt || "";
    const sessionId = input.session_id || "unknown";

    if (!prompt) {
      noDecision();
      return;
    }

    const state = loadSessionState(sessionId);

    // Check for loop start
    const startMatch = prompt.match(LOOP_START_PATTERN);
    if (startMatch) {
      const goal = startMatch[1].trim();
      state.ulwLoopActive = true;
      state.ulwLoopGoal = goal;
      state.ulwLoopCheckpoints = [];
      saveSessionState(state);

      addContext(
        "UserPromptSubmit",
        `# ULW Loop Started

## Goal: ${goal}

### Protocol
1. **Analyze** — Understand the current state and what needs to change
2. **Plan** — Break the goal into verifiable steps
3. **Execute** — Work through steps one at a time
4. **Verify** — After each step, verify with evidence (tests, output, diagnostics)
5. **Checkpoint** — After each verified step, the user may checkpoint

### Rules
- Every change must be verified before moving on
- If a step fails, diagnose and fix before continuing
- Provide evidence receipts for each completed step
- Ask for checkpoint when you've completed a meaningful unit of work

### Current Status
- Goal: ${goal}
- Checkpoints: 0
- Status: IN PROGRESS`
      );
      return;
    }

    // Check for checkpoint
    if (LOOP_CHECKPOINT_PATTERN.test(prompt) && state.ulwLoopActive) {
      const checkpointId = `CP-${state.ulwLoopCheckpoints.length + 1}`;
      state.ulwLoopCheckpoints.push(`${checkpointId}: ${new Date().toISOString()}`);
      saveSessionState(state);

      addContext(
        "UserPromptSubmit",
        `# ✅ Checkpoint ${checkpointId} Created

## ULW Loop Status
- Goal: ${state.ulwLoopGoal}
- Checkpoints: ${state.ulwLoopCheckpoints.length}
- Latest: ${checkpointId}

Continue working toward the goal. Provide evidence for each subsequent step.`
      );
      return;
    }

    // Check for status
    if (LOOP_STATUS_PATTERN.test(prompt)) {
      if (!state.ulwLoopActive) {
        addContext("UserPromptSubmit", "**No active ULW loop.** Start one with: `ulw loop start: <goal>`");
      } else {
        const checkpointList = state.ulwLoopCheckpoints.length > 0
          ? state.ulwLoopCheckpoints.map((cp) => `  - ${cp}`).join("\n")
          : "  (none yet)";

        addContext(
          "UserPromptSubmit",
          `# ULW Loop Status

- **Goal:** ${state.ulwLoopGoal}
- **Active:** Yes
- **Checkpoints (${state.ulwLoopCheckpoints.length}):**
${checkpointList}`
        );
      }
      return;
    }

    // Check for complete
    if (LOOP_COMPLETE_PATTERN.test(prompt) && state.ulwLoopActive) {
      const goal = state.ulwLoopGoal;
      const checkpoints = state.ulwLoopCheckpoints.length;
      state.ulwLoopActive = false;
      state.ulwLoopGoal = null;
      state.ulwLoopCheckpoints = [];
      saveSessionState(state);

      addContext(
        "UserPromptSubmit",
        `# ✅ ULW Loop Complete

- **Goal:** ${goal}
- **Checkpoints completed:** ${checkpoints}
- **Status:** COMPLETE

Provide a final summary of what was accomplished with evidence.`
      );
      return;
    }

    // Check for abort
    if (LOOP_ABORT_PATTERN.test(prompt) && state.ulwLoopActive) {
      const goal = state.ulwLoopGoal;
      state.ulwLoopActive = false;
      state.ulwLoopGoal = null;
      state.ulwLoopCheckpoints = [];
      saveSessionState(state);

      addContext(
        "UserPromptSubmit",
        `# ⚠️ ULW Loop Aborted

- **Goal:** ${goal}
- **Status:** ABORTED

Summarize what was completed before aborting.`
      );
      return;
    }

    // If loop is active, provide subtle context
    if (state.ulwLoopActive) {
      addContext(
        "UserPromptSubmit",
        `[ULW Loop active — Goal: ${state.ulwLoopGoal} | Checkpoints: ${state.ulwLoopCheckpoints.length}]`
      );
      return;
    }

    noDecision();
  } catch (err) {
    debugLog("ULW loop steering error:", err);
    noDecision();
  }
}

main();
