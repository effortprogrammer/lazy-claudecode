/**
 * Doctor — health check for all lazy-claudecode components.
 */

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { getClaudeSettingsPath, getStateDir } from "../utils/paths.ts";

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
}

function check(name: string, fn: () => { status: "ok" | "warn" | "error"; message: string }): CheckResult {
  try {
    const result = fn();
    return { name, ...result };
  } catch (err) {
    return { name, status: "error", message: `Exception: ${err}` };
  }
}

export async function doctor(root: string): Promise<void> {
  console.log("🩺 lazy-claudecode health check\n");

  const results: CheckResult[] = [];

  // 1. Check Node.js version
  results.push(
    check("Node.js version", () => {
      const major = parseInt(process.version.slice(1).split(".")[0], 10);
      if (major >= 18) {
        return { status: "ok", message: `${process.version}` };
      }
      return { status: "error", message: `${process.version} (requires >=18)` };
    })
  );

  // 2. Check lazy-claudecode root
  results.push(
    check("Installation root", () => {
      if (existsSync(root)) {
        return { status: "ok", message: root };
      }
      return { status: "error", message: `Not found: ${root}` };
    })
  );

  // 3. Check Bun runtime
  results.push(
    check("Bun runtime", () => {
      try {
        const result = execSync("bun --version", { encoding: "utf-8" }).trim();
        return { status: "ok", message: `Version ${result}` };
      } catch {
        return { status: "error", message: "Not found. Install: curl -fsSL https://bun.sh/install | bash" };
      }
    })
  );

  // 4. Check hooks-config.json
  results.push(
    check("hooks-config.json", () => {
      const configPath = join(root, "hooks-config.json");
      if (existsSync(configPath)) {
        return { status: "ok", message: "Found" };
      }
      return { status: "error", message: "Not found" };
    })
  );

  // 5. Check Claude settings
  results.push(
    check("Claude Code settings", () => {
      const settingsPath = getClaudeSettingsPath();
      if (!existsSync(settingsPath)) {
        return { status: "warn", message: `Not found: ${settingsPath}. Run: lazy-claudecode install` };
      }
      try {
        const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
        if (settings.hooks) {
          let hookCount = 0;
          for (const groups of Object.values(settings.hooks) as Array<Array<{ hooks: unknown[] }>>) {
            for (const group of groups) {
              hookCount += group.hooks.length;
            }
          }
          // Check if any hooks reference lazy-claudecode
          const raw = readFileSync(settingsPath, "utf-8");
          if (raw.includes("lazy-claudecode") || raw.includes("lazy_claudecode")) {
            return { status: "ok", message: `${hookCount} hooks configured (lazy-claudecode detected)` };
          }
          return { status: "warn", message: `${hookCount} hooks found but none from lazy-claudecode. Run: lazy-claudecode install` };
        }
        return { status: "warn", message: "No hooks configured. Run: lazy-claudecode install" };
      } catch {
        return { status: "error", message: "Failed to parse settings" };
      }
    })
  );

  // 6. Check state directory
  results.push(
    check("State directory", () => {
      const dir = getStateDir();
      return { status: "ok", message: dir };
    })
  );

  // 7. Check ast-grep
  results.push(
    check("ast-grep", () => {
      try {
        execSync("which ast-grep 2>/dev/null || which sg 2>/dev/null", { stdio: "pipe" });
        return { status: "ok", message: "Found on PATH" };
      } catch {
        return { status: "warn", message: "Not found. Install: npm i -g @ast-grep/cli" };
      }
    })
  );

  // 8. Check TypeScript
  results.push(
    check("TypeScript", () => {
      try {
        const version = execSync("npx tsc --version 2>/dev/null", {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        return { status: "ok", message: version };
      } catch {
        return { status: "warn", message: "Not found (needed for LSP diagnostics)" };
      }
    })
  );

  // 9. Check LAZY_CLAUDECODE_ROOT env var
  results.push(
    check("LAZY_CLAUDECODE_ROOT env var", () => {
      if (process.env.LAZY_CLAUDECODE_ROOT) {
        return { status: "ok", message: process.env.LAZY_CLAUDECODE_ROOT };
      }
      return { status: "warn", message: `Not set. Add to shell profile: export LAZY_CLAUDECODE_ROOT="${root}"` };
    })
  );

  // Print results
  const statusIcons = { ok: "✅", warn: "⚠️ ", error: "❌" };
  let hasErrors = false;
  let hasWarnings = false;

  for (const result of results) {
    const icon = statusIcons[result.status];
    console.log(`  ${icon} ${result.name}: ${result.message}`);
    if (result.status === "error") hasErrors = true;
    if (result.status === "warn") hasWarnings = true;
  }

  console.log("");

  if (hasErrors) {
    console.log("❌ Some checks failed. Please fix the errors above.");
    process.exit(1);
  } else if (hasWarnings) {
    console.log("⚠️  Some checks have warnings. Everything may still work, but consider addressing them.");
  } else {
    console.log("✅ All checks passed! lazy-claudecode is healthy.");
  }
}
