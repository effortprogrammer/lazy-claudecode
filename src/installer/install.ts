/**
 * Installer — merges lazy-claudecode hooks into ~/.claude/settings.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
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
 * Resolve the absolute path to the bun binary.
 * Checks: PATH, ~/.bun/bin/bun, common locations.
 */
function resolveBunPath(): string {
  // 1. Try PATH (works if user's shell profile loaded)
  try {
    const resolved = execSync("which bun", { encoding: "utf-8" }).trim();
    if (resolved && existsSync(resolved)) return resolved;
  } catch {
    // not in PATH
  }

  // 2. Check ~/.bun/bin/bun (default bun install location)
  const homeBun = join(homedir(), ".bun", "bin", "bun");
  if (existsSync(homeBun)) return homeBun;

  // 3. Common Homebrew paths
  const brewPaths = [
    "/opt/homebrew/bin/bun",
    "/usr/local/bin/bun",
  ];
  for (const p of brewPaths) {
    if (existsSync(p)) return p;
  }

  // Fallback to bare 'bun' and hope for the best
  console.warn("⚠️  Could not find bun binary. Hooks may fail if bun is not in PATH.");
  return "bun";
}

/**
 * Load hooks-config.json and resolve placeholders to absolute paths.
 * ${BUN} → absolute bun binary path
 * ${PLUGIN_ROOT} → absolute package root path
 */
function loadHooksConfig(root: string): HooksConfig {
  const configPath = join(root, "hooks-config.json");
  const raw = readFileSync(configPath, "utf-8");
  const bunPath = resolveBunPath();
  const resolved = raw
    .replace(/\$\{BUN\}/g, bunPath)
    .replace(/\$\{PLUGIN_ROOT\}/g, root);
  return JSON.parse(resolved) as HooksConfig;
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

/**
 * Detect which coding agent CLIs are available.
 */
function detectAgentCLIs(): { hasClaude: boolean; hasCodex: boolean } {
  let hasClaude = false;
  let hasCodex = false;

  try {
    execSync("which claude", { encoding: "utf-8", stdio: "pipe" });
    hasClaude = true;
  } catch { /* not found */ }

  try {
    execSync("which codex", { encoding: "utf-8", stdio: "pipe" });
    hasCodex = true;
  } catch { /* not found */ }

  return { hasClaude, hasCodex };
}

/**
 * Install cross-call agent files to ~/.claude/agents/ and ~/.codex/agents/.
 * - If `codex` is installed → install lazycc-delegate (Codex can call Claude Code)
 *   - .md → ~/.claude/agents/ (for LazyCodex plugin compatibility)
 *   - .toml → ~/.codex/agents/ + register in ~/.codex/config.toml (for Codex native TUI)
 * - If `claude` is installed → install lazycodex-delegate.md (Claude Code can call Codex)
 * - Both → install both
 */
function installCrossCallAgents(root: string): number {
  const { hasClaude, hasCodex } = detectAgentCLIs();

  const claudeAgentsDir = join(homedir(), ".claude", "agents");
  const codexAgentsDir = join(homedir(), ".codex", "agents");

  // Clean up deprecated agent files from previous versions
  const deprecatedFiles = [
    "claude-code-delegate.md",
    "codex-delegate.md",
  ];
  for (const file of deprecatedFiles) {
    const oldPath = join(claudeAgentsDir, file);
    if (existsSync(oldPath)) {
      unlinkSync(oldPath);
      console.log(`🧹 Removed deprecated ${file}`);
    }
  }

  if (!hasClaude && !hasCodex) {
    console.log("⏭️  Neither claude nor codex CLI found — skipping cross-call agent setup");
    return 0;
  }

  const agentsSourceDir = join(root, "agents");
  const codexAgentsSourceDir = join(root, "codex-agents");

  if (!existsSync(agentsSourceDir)) {
    console.log("⏭️  No agents/ directory in package — skipping cross-call agent setup");
    return 0;
  }

  if (!existsSync(claudeAgentsDir)) {
    mkdirSync(claudeAgentsDir, { recursive: true });
  }

  // Map: which agent file to install for which CLI
  const agentMapping: Array<{ file: string; requiredCli: string; cliName: string }> = [
    { file: "lazycc-delegate.md", requiredCli: "codex", cliName: "Codex" },
    { file: "lazycodex-delegate.md", requiredCli: "claude", cliName: "Claude Code" },
  ];

  let installed = 0;

  for (const { file, requiredCli, cliName } of agentMapping) {
    const cliAvailable = requiredCli === "codex" ? hasCodex : hasClaude;
    if (!cliAvailable) continue;

    const sourcePath = join(agentsSourceDir, file);
    if (!existsSync(sourcePath)) continue;

    const targetPath = join(claudeAgentsDir, file);
    copyFileSync(sourcePath, targetPath);
    console.log(`✅ Installed ${file} → ${claudeAgentsDir}/ (${cliName} can delegate to ${requiredCli === "codex" ? "Claude Code" : "Codex"})`);
    installed++;
  }

  // Install Codex native agent (.toml) if codex is available
  if (hasCodex && existsSync(codexAgentsSourceDir)) {
    installed += installCodexNativeAgents(codexAgentsSourceDir, codexAgentsDir);
  }

  return installed;
}

/**
 * Install .toml agent definitions to ~/.codex/agents/ and register them
 * in ~/.codex/config.toml so Codex TUI recognizes them natively.
 *
 * This enables "@lazycc-delegate" mention in Codex TUI without going
 * through LazyCodex's slash command hook (which Codex TUI intercepts).
 */
function installCodexNativeAgents(sourceDir: string, targetDir: string): number {
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const tomlFiles = readdirSync(sourceDir).filter((f) => f.endsWith(".toml"));
  if (tomlFiles.length === 0) return 0;

  let installed = 0;
  const configPath = join(homedir(), ".codex", "config.toml");

  // Read existing config.toml
  let configContent = "";
  if (existsSync(configPath)) {
    configContent = readFileSync(configPath, "utf-8");
  }

  for (const file of tomlFiles) {
    const agentName = file.replace(".toml", "");
    const sourcePath = join(sourceDir, file);
    const targetPath = join(targetDir, file);

    // Copy .toml file
    copyFileSync(sourcePath, targetPath);
    console.log(`✅ Installed Codex native agent: ${file} → ${targetDir}/`);

    // Register in config.toml if not already present
    const sectionHeader = `[agents.${agentName}]`;
    if (!configContent.includes(sectionHeader)) {
      const agentEntry = `\n${sectionHeader}\nconfig_file = "./agents/${file}"\n`;
      configContent += agentEntry;
      console.log(`✅ Registered ${agentName} in ~/.codex/config.toml`);
    } else {
      console.log(`⏭️  ${agentName} already registered in ~/.codex/config.toml`);
    }

    installed++;
  }

  // Write updated config.toml
  writeFileSync(configPath, configContent, "utf-8");

  return installed;
}

/**
 * Install slash commands to ~/.claude/commands/.
 * - /lazycc → delegates to Claude Code (via lazycc-delegate agent)
 * - /lazycodex → delegates to Codex (via lazycodex-delegate agent)
 *
 * Commands are loaded by both Claude Code and Codex (LazyCodex)
 * from ~/.claude/commands/ directory.
 */
function installSlashCommands(root: string): number {
  const { hasClaude, hasCodex } = detectAgentCLIs();

  const targetDir = join(homedir(), ".claude", "commands");
  const commandsSourceDir = join(root, "commands");

  if (!existsSync(commandsSourceDir)) {
    console.log("⏭️  No commands/ directory in package — skipping slash command setup");
    return 0;
  }

  if (!hasClaude && !hasCodex) {
    console.log("⏭️  Neither claude nor codex CLI found — skipping slash command setup");
    return 0;
  }

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // Map: which command file to install for which CLI
  const commandMapping: Array<{ file: string; requiredCli: string; description: string }> = [
    { file: "lazycc.md", requiredCli: "codex", description: "/lazycc → delegate to Claude Code" },
    { file: "lazycodex.md", requiredCli: "claude", description: "/lazycodex → delegate to Codex" },
  ];

  let installed = 0;

  for (const { file, requiredCli, description } of commandMapping) {
    const cliAvailable = requiredCli === "codex" ? hasCodex : hasClaude;
    if (!cliAvailable) continue;

    const sourcePath = join(commandsSourceDir, file);
    if (!existsSync(sourcePath)) continue;

    const targetPath = join(targetDir, file);
    copyFileSync(sourcePath, targetPath);
    console.log(`✅ Installed ${description}`);
    installed++;
  }

  return installed;
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

  // 7. Install cross-call agent files
  console.log("\n🤝 Setting up cross-call agents...");
  const agentCount = installCrossCallAgents(root);
  if (agentCount > 0) {
    console.log(`\n✅ ${agentCount} cross-call agent(s) installed to ~/.claude/agents/`);
    console.log("   Codex and Claude Code can now delegate tasks to each other as subagents.");
  }

  // 8. Install slash commands
  console.log("\n⚡ Setting up slash commands...");
  const commandCount = installSlashCommands(root);
  if (commandCount > 0) {
    console.log(`\n✅ ${commandCount} slash command(s) installed to ~/.claude/commands/`);
    console.log("   Use /lazycc or /lazycodex to delegate tasks between agents.");
  }
}
