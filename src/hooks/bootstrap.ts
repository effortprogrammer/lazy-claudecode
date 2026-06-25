/**
 * Bootstrap hook — SessionStart
 *
 * Runs provisioning checks at session start:
 * - Checks for ast-grep binary
 * - Validates environment
 * - Sets up state directory
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  readHookInput,
  addContext,
  noDecision,
  type BaseHookInput,
} from "../utils/hook-io.js";
import { getStateDir, getLazyClaudeCodeRoot, debugLog } from "../utils/paths.js";
import { loadSessionState, saveSessionState } from "../state/session-state.js";

interface BootstrapInput extends BaseHookInput {
  session_id?: string;
  cwd?: string;
}

async function main(): Promise<void> {
  try {
    const input = await readHookInput<BootstrapInput>();
    const sessionId = input.session_id || "unknown";
    const state = loadSessionState(sessionId);

    if (state.bootstrapComplete) {
      noDecision();
      return;
    }

    const warnings: string[] = [];
    const info: string[] = [];

    // Ensure state directory exists
    const stateDir = getStateDir();
    info.push(`State directory: ${stateDir}`);

    // Check for ast-grep
    let hasAstGrep = false;
    try {
      execSync("which ast-grep", { stdio: "ignore" });
      hasAstGrep = true;
      info.push("✅ ast-grep found on PATH");
    } catch {
      // Try sg alias
      try {
        execSync("which sg", { stdio: "ignore" });
        hasAstGrep = true;
        info.push("✅ ast-grep found as 'sg'");
      } catch {
        warnings.push(
          "⚠️ ast-grep not found. Install with: npm install -g @ast-grep/cli or cargo install ast-grep"
        );
      }
    }

    // Check for Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
    if (major < 18) {
      warnings.push(`⚠️ Node.js ${nodeVersion} detected. Requires >=18.0.0`);
    } else {
      info.push(`✅ Node.js ${nodeVersion}`);
    }

    // Check lazy-claudecode root
    const root = getLazyClaudeCodeRoot();
    if (existsSync(root)) {
      info.push(`✅ lazy-claudecode root: ${root}`);
    } else {
      warnings.push(`⚠️ lazy-claudecode root not found: ${root}`);
    }

    // Mark bootstrap as complete
    state.bootstrapComplete = true;
    saveSessionState(state);

    // Build context message
    const parts: string[] = [];
    if (info.length > 0) {
      parts.push("**lazy-claudecode bootstrap:**\n" + info.join("\n"));
    }
    if (warnings.length > 0) {
      parts.push("**Warnings:**\n" + warnings.join("\n"));
    }

    if (parts.length > 0) {
      addContext("SessionStart", parts.join("\n\n"));
    } else {
      noDecision();
    }
  } catch (err) {
    debugLog("Bootstrap error:", err);
    noDecision();
  }
}

main();
