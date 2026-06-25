/**
 * CodeGraph Init hook — PostToolUse
 *
 * After tool use, provides codegraph initialization guidance
 * if codegraph MCP is available but hasn't been used yet.
 */

import {
  readHookInput,
  addContext,
  noDecision,
  type ToolUseHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";
import { loadSessionState, saveSessionState } from "../state/session-state.js";

/** Track if we've already reminded about codegraph */
let codegraphReminded = false;

async function main(): Promise<void> {
  try {
    const input = await readHookInput<ToolUseHookInput>();
    const sessionId = input.session_id || "unknown";
    const toolName = input.tool_name || "";

    // If codegraph tools are being used, no need to remind
    if (toolName.startsWith("codegraph") || toolName.startsWith("mcp__codegraph")) {
      codegraphReminded = true;
      noDecision();
      return;
    }

    // Only remind once per session
    if (codegraphReminded) {
      noDecision();
      return;
    }

    const state = loadSessionState(sessionId);

    // Only show after bootstrap and only for code-editing tools
    if (!state.bootstrapComplete) {
      noDecision();
      return;
    }

    // Check if this is a file exploration or early edit
    const toolInput = input.tool_input || {};
    const filePath = (toolInput.file_path || toolInput.path || "") as string;

    if (!filePath) {
      noDecision();
      return;
    }

    codegraphReminded = true;

    addContext(
      "PostToolUse",
      "**💡 Tip:** CodeGraph MCP is available for codebase structure analysis. " +
      "Use `mcp__codegraph__analyze` to understand the codebase structure, " +
      "find dependencies, and navigate the code more efficiently."
    );
  } catch (err) {
    debugLog("CodeGraph init error:", err);
    noDecision();
  }
}

main();
