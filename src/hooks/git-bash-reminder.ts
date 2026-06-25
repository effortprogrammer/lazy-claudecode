/**
 * Git Bash Reminder hook — PreToolUse for Bash
 *
 * When the user is about to run a git command via Bash,
 * reminds them that the git_bash MCP server is available
 * for safer, structured git operations.
 */

import {
  readHookInput,
  addContext,
  noDecision,
  type ToolUseHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";

/** Git commands that could benefit from MCP usage */
const GIT_COMMANDS = [
  "git commit",
  "git push",
  "git merge",
  "git rebase",
  "git reset",
  "git checkout",
  "git branch",
  "git stash",
  "git cherry-pick",
  "git revert",
];

/** Track if we've reminded in this process */
let hasReminded = false;

async function main(): Promise<void> {
  try {
    const input = await readHookInput<ToolUseHookInput>();
    const toolInput = input.tool_input || {};
    const command = (toolInput.command || toolInput.cmd || "") as string;

    if (!command || hasReminded) {
      noDecision();
      return;
    }

    // Check if this is a git command
    const isGitCommand = GIT_COMMANDS.some((gc) =>
      command.trim().startsWith(gc)
    );

    if (!isGitCommand) {
      noDecision();
      return;
    }

    hasReminded = true;

    // Don't block — just add a reminder
    addContext(
      "PreToolUse",
      "**💡 Git MCP Available:** Consider using the `mcp__git_bash` tools for structured git operations. " +
      "They provide better error handling, conflict detection, and safer defaults. " +
      "Available tools: `git_status`, `git_diff`, `git_commit`, `git_log`, `git_branch`."
    );
  } catch (err) {
    debugLog("Git bash reminder error:", err);
    noDecision();
  }
}

main();
