/**
 * Plan/boulder state reading for work continuation.
 * Reads plan files to determine if there are remaining tasks.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getPlanStateDir, debugLog } from "../utils/paths.ts";

export interface PlanTask {
  id: string;
  description: string;
  completed: boolean;
  evidence?: string;
}

export interface Plan {
  id: string;
  goal: string;
  createdAt: string;
  tasks: PlanTask[];
  status: "active" | "completed" | "abandoned";
}

/**
 * Get the active plan for the current working directory.
 */
export function getActivePlan(cwd: string): Plan | null {
  const planDir = getPlanStateDir(cwd);
  if (!existsSync(planDir)) {
    return null;
  }
  try {
    const files = readdirSync(planDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    for (const file of files) {
      const planPath = join(planDir, file);
      const raw = readFileSync(planPath, "utf-8");
      const plan = JSON.parse(raw) as Plan;
      if (plan.status === "active") {
        return plan;
      }
    }
    return null;
  } catch (err) {
    debugLog("Failed to read plan state:", err);
    return null;
  }
}

/**
 * Get remaining (incomplete) tasks from a plan.
 */
export function getRemainingTasks(plan: Plan): PlanTask[] {
  return plan.tasks.filter((t) => !t.completed);
}

/**
 * Get completed tasks from a plan.
 */
export function getCompletedTasks(plan: Plan): PlanTask[] {
  return plan.tasks.filter((t) => t.completed);
}

/**
 * Calculate plan progress as a percentage.
 */
export function getPlanProgress(plan: Plan): number {
  if (plan.tasks.length === 0) return 100;
  const completed = plan.tasks.filter((t) => t.completed).length;
  return Math.round((completed / plan.tasks.length) * 100);
}

/**
 * Check if there's an active plan with remaining work.
 */
export function hasRemainingWork(cwd: string): boolean {
  const plan = getActivePlan(cwd);
  if (!plan) return false;
  return getRemainingTasks(plan).length > 0;
}

/**
 * Format remaining tasks as a readable string.
 */
export function formatRemainingTasks(plan: Plan): string {
  const remaining = getRemainingTasks(plan);
  const completed = getCompletedTasks(plan);
  const progress = getPlanProgress(plan);

  let output = `## Plan: ${plan.goal}\n\n`;
  output += `Progress: ${progress}% (${completed.length}/${plan.tasks.length} tasks)\n\n`;

  if (completed.length > 0) {
    output += "### Completed:\n";
    for (const task of completed) {
      output += `- [x] ${task.description}\n`;
    }
    output += "\n";
  }

  if (remaining.length > 0) {
    output += "### Remaining:\n";
    for (const task of remaining) {
      output += `- [ ] ${task.description}\n`;
    }
  }

  return output;
}
