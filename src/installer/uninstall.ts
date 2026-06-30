/**
 * Uninstaller — removes lazy-claudecode hooks from ~/.claude/settings.json
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { getClaudeSettingsPath } from "../utils/paths.ts";

interface HookEntry {
  type: string;
  command: string;
  timeout?: number;
}

interface HookGroup {
  matcher?: string;
  hooks: HookEntry[];
}

interface ClaudeSettings {
  hooks?: Record<string, HookGroup[]>;
  [key: string]: unknown;
}

/**
 * Check if a hook command belongs to lazy-claudecode.
 * Matches resolved paths, ${PLUGIN_ROOT} placeholders, and the package name.
 */
function isLazyClaudeCodeHook(hook: HookEntry, root: string): boolean {
  const cmd = hook.command;
  return (
    cmd.includes(root) ||
    cmd.includes("lazy-claudecode") ||
    cmd.includes("${PLUGIN_ROOT}") ||
    cmd.includes("${LAZY_CLAUDECODE_ROOT}")
  );
}

export async function uninstall(root: string): Promise<void> {
  console.log("🔧 Uninstalling lazy-claudecode hooks...\n");

  const settingsPath = getClaudeSettingsPath();

  if (!existsSync(settingsPath)) {
    console.log("ℹ️  No settings file found. Nothing to uninstall.");
    return;
  }

  let settings: ClaudeSettings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch (err) {
    console.error(`❌ Failed to parse ${settingsPath}`);
    process.exit(1);
    return; // TypeScript flow
  }

  if (!settings.hooks) {
    console.log("ℹ️  No hooks found in settings. Nothing to uninstall.");
    return;
  }

  let removedCount = 0;

  for (const event of Object.keys(settings.hooks)) {
    const originalLength = settings.hooks[event].length;

    settings.hooks[event] = settings.hooks[event].filter((group) => {
      const hasLazy = group.hooks.some((h) => isLazyClaudeCodeHook(h, root));
      if (hasLazy) {
        removedCount += group.hooks.length;
      }
      return !hasLazy;
    });

    // Remove empty event arrays
    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event];
    }
  }

  // Remove empty hooks object
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");

  if (removedCount > 0) {
    console.log(`✅ Removed ${removedCount} lazy-claudecode hook(s) from ${settingsPath}`);
  } else {
    console.log("ℹ️  No lazy-claudecode hooks found in settings.");
  }

  console.log("\n✅ Uninstallation complete.");
  console.log("   You can also remove the LAZY_CLAUDECODE_ROOT environment variable.");

  // Uninstall companion plugins
  await uninstallCompanionPlugins();
}

/**
 * Uninstall companion plugins (lazycc-codex-plugin) from Claude Code.
 * Non-critical — failures are logged with manual instructions.
 */
async function uninstallCompanionPlugins(): Promise<void> {
  const MARKETPLACE_NAME = "lazycc-codex";
  const PLUGIN_NAME = "codex";

  // Check if claude CLI is available
  let hasClaude = false;
  try {
    execSync("which claude", { encoding: "utf-8", stdio: "pipe" });
    hasClaude = true;
  } catch { /* not found */ }

  if (!hasClaude) {
    return; // Nothing to clean up
  }

  console.log("\n📦 Removing Codex companion plugin...");

  try {
    // Uninstall plugin
    try {
      execSync(`claude plugin uninstall ${PLUGIN_NAME}@${MARKETPLACE_NAME}`, { stdio: "pipe" });
      console.log(`  ✅ Plugin '${PLUGIN_NAME}' uninstalled`);
    } catch {
      // Already uninstalled or not found — fine
    }

    // Remove marketplace
    try {
      execSync(`claude plugin marketplace remove ${MARKETPLACE_NAME}`, { stdio: "pipe" });
      console.log(`  ✅ Marketplace '${MARKETPLACE_NAME}' removed`);
    } catch {
      // Already removed or not found — fine
    }
  } catch {
    console.log("  ⚠️  Companion plugin removal failed (non-critical).");
    console.log(`     Run manually: claude plugin uninstall ${PLUGIN_NAME}@${MARKETPLACE_NAME} && claude plugin marketplace remove ${MARKETPLACE_NAME}`);
  }
}
