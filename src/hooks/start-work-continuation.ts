/**
 * Start-Work Continuation hook — Stop
 *
 * When the agent wants to stop, checks if there's an active plan
 * with remaining tasks. If so, blocks the stop and injects a
 * continuation directive.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readHookInput,
  blockDecision,
  noDecision,
  type StopHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";
import {
  getActivePlan,
  getRemainingTasks,
  formatRemainingTasks,
} from "../state/plan-state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadContinuationDirective(planStatus: string): string {
  try {
    const templatePath = join(__dirname, "..", "directives", "start-work-continuation.md");
    const template = readFileSync(templatePath, "utf-8");
    return template.replace("{{PLAN_STATUS}}", planStatus);
  } catch {
    return `**⚠️ WORK IS NOT COMPLETE — DO NOT STOP**

There is an active plan with remaining tasks. Continue working.

${planStatus}

Pick the next uncompleted task and continue.`;
  }
}

async function main(): Promise<void> {
  try {
    const input = await readHookInput<StopHookInput>();
    const cwd = input.cwd || process.cwd();

    const plan = getActivePlan(cwd);
    if (!plan) {
      noDecision();
      return;
    }

    const remaining = getRemainingTasks(plan);
    if (remaining.length === 0) {
      noDecision();
      return;
    }

    const planStatus = formatRemainingTasks(plan);
    const directive = loadContinuationDirective(planStatus);

    blockDecision(directive);
  } catch (err) {
    debugLog("Start-work continuation error:", err);
    noDecision();
  }
}

main();
