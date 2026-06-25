/**
 * Installer — merges lazy-claudecode hooks into ~/.claude/settings.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { getClaudeSettingsPath } from "../utils/paths.ts";
import { generateMcpConfig } from "../mcp/mcp-config.ts";

interface HookEntry {
  type: string;
  command: string;
  timeout?: number;
}

interface HookGroup {
  matcher?: string;
  hooks: HookEntry[];
}

interface HooksConfig {
  hooks: Record<string, HookGroup[]>;
}

interface ClaudeSettings {
  hooks?: Record<string, HookGroup[]>;
  [key: string]: unknown;
}

/**
 * Load hooks-config.json and resolve ${LAZY_CLAUDECODE_ROOT} to actual path.
 */
function loadHooksConfig(root: string): HooksConfig {
  const configPath = join(root, "hooks-config.json");
  const raw = readFileSync(configPath, "utf-8");
  const resolved = raw.replace(/\$\{LAZY_CLAUDECODE_ROOT\}/g, root);
  return JSON.parse(resolved) as HooksConfig;
}

/**
 * Check if a hook command belongs to lazy-claudecode.
 */
function isLazyClaudeCodeHook(hook: HookEntry, root: string): boolean {
  return hook.command.includes(root) || hook.command.includes("lazy-claudecode");
}

/**
 * Merge lazy-claudecode hooks into existing settings, avoiding duplicates.
 */
function mergeHooks(
  existing: Record<string, HookGroup[]>,
  incoming: Record<string, HookGroup[]>,
  root: string
): Record<string, HookGroup[]> {
  const merged = { ...existing };

  for (const [event, groups] of Object.entries(incoming)) {
    if (!merged[event]) {
      merged[event] = [];
    }

    // Remove any existing lazy-claudecode hooks for this event
    merged[event] = merged[event].filter((group) => {
      return !group.hooks.some((h) => isLazyClaudeCodeHook(h, root));
    });

    // Add the new hooks
    merged[event].push(...groups);
  }

  return merged;
}

export async function install(root: string): Promise<void> {
  console.log("🔧 Installing lazy-claudecode hooks...\n");

  // 1. Load hooks config
  const hooksConfig = loadHooksConfig(root);
  console.log("✅ Loaded hooks configuration");

  // 2. Load or create Claude settings
  const settingsPath = getClaudeSettingsPath();
  let settings: ClaudeSettings = {};

  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
      console.log(`✅ Loaded existing settings from ${settingsPath}`);
    } catch (err) {
      console.error(`⚠️  Failed to parse ${settingsPath}, creating fresh settings`);
      settings = {};
    }
  } else {
    const dir = dirname(settingsPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    console.log(`📝 Creating new settings file at ${settingsPath}`);
  }

  // 3. Merge hooks
  const existingHooks = settings.hooks || {};
  settings.hooks = mergeHooks(existingHooks, hooksConfig.hooks, root);

  // 4. Write settings
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
  console.log(`✅ Hooks merged into ${settingsPath}`);

  // 5. Set up environment variable hint
  console.log(`\n📌 Set LAZY_CLAUDECODE_ROOT for runtime:`);
  console.log(`   export LAZY_CLAUDECODE_ROOT="${root}"`);
  console.log(`   (Add to your shell profile for persistence)\n`);

  // 6. Generate MCP config hint
  const mcpConfig = generateMcpConfig();
  console.log("📦 MCP server configuration available:");
  console.log("   Run in your project directory to set up MCP servers:");
  console.log(`   lazy-claudecode doctor\n`);

  // Count installed hooks
  let hookCount = 0;
  for (const groups of Object.values(settings.hooks)) {
    for (const group of groups) {
      hookCount += group.hooks.length;
    }
  }

  console.log(`✅ Installation complete! ${hookCount} hooks installed across ${Object.keys(settings.hooks).length} events.`);
  console.log("\nHook events configured:");
  for (const event of Object.keys(hooksConfig.hooks)) {
    const count = hooksConfig.hooks[event].reduce((sum, g) => sum + g.hooks.length, 0);
    console.log(`  - ${event}: ${count} hook(s)`);
  }
}
