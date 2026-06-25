/**
 * Ultrawork Trigger hook — UserPromptSubmit
 *
 * Detects "ultrawork" or "ulw" in user prompt and injects
 * the ultrawork mode directive.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readHookInput,
  addContext,
  noDecision,
  type UserPromptHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";
import { loadSessionState, saveSessionState } from "../state/session-state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Pattern to detect ultrawork activation in user prompt */
const ULTRAWORK_PATTERN = /\b(ultrawork|ulw)\b/i;

/** Pattern to detect ultrawork deactivation */
const DEACTIVATE_PATTERN = /\b(ultrawork|ulw)\s+(off|disable|stop|end)\b/i;

function loadUltraworkDirective(): string {
  try {
    const directivePath = join(__dirname, "..", "directives", "ultrawork.md");
    return readFileSync(directivePath, "utf-8");
  } catch {
    // Fallback inline directive
    return `# Ultrawork Mode Active

You are in ULTRAWORK MODE. Follow systematic, evidence-driven work:
1. Analyze before acting — read relevant code first
2. Work in small, verifiable steps
3. Verify every change (tests, compilation, runtime)
4. No assumptions — read and verify
5. Document what was done and why`;
  }
}

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

    // Check for deactivation
    if (DEACTIVATE_PATTERN.test(prompt)) {
      if (state.ultraworkActive) {
        state.ultraworkActive = false;
        saveSessionState(state);
        addContext(
          "UserPromptSubmit",
          "**Ultrawork mode deactivated.** Returning to normal operation."
        );
      } else {
        noDecision();
      }
      return;
    }

    // Check for activation
    if (ULTRAWORK_PATTERN.test(prompt)) {
      if (!state.ultraworkActive) {
        state.ultraworkActive = true;
        saveSessionState(state);
        const directive = loadUltraworkDirective();
        addContext("UserPromptSubmit", directive);
      } else {
        // Already active, just remind
        addContext(
          "UserPromptSubmit",
          "**Ultrawork mode is active.** Continue following systematic, evidence-driven work protocol."
        );
      }
      return;
    }

    // If ultrawork is active, provide a subtle reminder on every prompt
    if (state.ultraworkActive) {
      addContext(
        "UserPromptSubmit",
        "[Ultrawork mode active — verify before proceeding]"
      );
      return;
    }

    noDecision();
  } catch (err) {
    debugLog("Ultrawork trigger error:", err);
    noDecision();
  }
}

main();
