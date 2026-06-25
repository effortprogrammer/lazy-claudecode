/**
 * LSP Diagnostics hook — PostToolUse for Edit|Write|MultiEdit
 *
 * After a file edit, runs TypeScript/language diagnostics on the file
 * and returns errors/warnings as additional context.
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { extname, dirname, join } from "node:path";
import {
  readHookInput,
  addContext,
  noDecision,
  type ToolUseHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";
import {
  loadSessionState,
  saveSessionState,
  shouldSkipDiagnostics,
  updateDiagnosticsCache,
  incrementDiagnosticsAttempt,
} from "../state/session-state.js";

interface DiagnosticResult {
  file: string;
  errors: string[];
  warnings: string[];
}

/** Max attempts to report diagnostics for the same file before suppressing. */
const MAX_ATTEMPTS = 3;

/** Cooldown in ms between diagnostics for the same file. */
const COOLDOWN_MS = 5000;

/** File extensions we can run diagnostics on. */
const DIAGNOSABLE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
};

function findTsconfig(filePath: string): string | null {
  let dir = dirname(filePath);
  const root = "/";
  while (dir !== root) {
    const tsconfig = join(dir, "tsconfig.json");
    if (existsSync(tsconfig)) return tsconfig;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function runTypeScriptDiagnostics(filePath: string): DiagnosticResult {
  const result: DiagnosticResult = { file: filePath, errors: [], warnings: [] };

  const tsconfig = findTsconfig(filePath);

  try {
    // Use tsc --noEmit for type checking
    const cmd = tsconfig
      ? `npx tsc --noEmit --pretty false -p "${tsconfig}" 2>&1 || true`
      : `npx tsc --noEmit --pretty false "${filePath}" 2>&1 || true`;

    const output = execSync(cmd, {
      cwd: dirname(filePath),
      timeout: 30000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Parse tsc output: file(line,col): error TS1234: message
    const lines = output.split("\n");
    const normalizedPath = filePath.replace(/\\/g, "/");

    for (const line of lines) {
      // Only show diagnostics for the edited file
      if (!line.includes(normalizedPath) && !line.includes(filePath)) {
        // Also check basename match
        const basename = filePath.split("/").pop();
        if (!basename || !line.includes(basename)) continue;
      }

      if (line.includes(": error TS")) {
        result.errors.push(line.trim());
      } else if (line.includes(": warning ")) {
        result.warnings.push(line.trim());
      }
    }
  } catch (err) {
    debugLog("TypeScript diagnostics failed:", err);
  }

  return result;
}

function runPythonDiagnostics(filePath: string): DiagnosticResult {
  const result: DiagnosticResult = { file: filePath, errors: [], warnings: [] };

  // Try pyflakes first (faster), fall back to python -m py_compile
  try {
    const output = execSync(`python3 -m py_compile "${filePath}" 2>&1 || true`, {
      cwd: dirname(filePath),
      timeout: 10000,
      encoding: "utf-8",
    });
    if (output.trim()) {
      result.errors.push(output.trim());
    }
  } catch (err) {
    debugLog("Python diagnostics failed:", err);
  }

  return result;
}

function runDiagnostics(filePath: string): DiagnosticResult | null {
  const ext = extname(filePath);
  const lang = DIAGNOSABLE[ext];

  if (!lang) return null;

  switch (lang) {
    case "typescript":
    case "javascript":
      return runTypeScriptDiagnostics(filePath);
    case "python":
      return runPythonDiagnostics(filePath);
    default:
      return null;
  }
}

function extractFilePaths(input: ToolUseHookInput): string[] {
  const paths: string[] = [];
  const toolInput = input.tool_input || {};

  if (typeof toolInput.file_path === "string") paths.push(toolInput.file_path);
  if (typeof toolInput.path === "string") paths.push(toolInput.path);
  if (typeof toolInput.file === "string") paths.push(toolInput.file);

  if (Array.isArray(toolInput.files)) {
    for (const f of toolInput.files) {
      if (typeof f === "string") paths.push(f);
      if (typeof f === "object" && f !== null && typeof (f as Record<string, unknown>).path === "string") {
        paths.push((f as Record<string, string>).path);
      }
    }
  }

  return [...new Set(paths)];
}

async function main(): Promise<void> {
  try {
    const input = await readHookInput<ToolUseHookInput>();
    const sessionId = input.session_id || "unknown";
    const filePaths = extractFilePaths(input);

    if (filePaths.length === 0) {
      noDecision();
      return;
    }

    const state = loadSessionState(sessionId);
    const allResults: DiagnosticResult[] = [];

    for (const filePath of filePaths) {
      if (!existsSync(filePath)) continue;

      // Check cooldown
      if (shouldSkipDiagnostics(state, filePath, COOLDOWN_MS)) {
        debugLog(`Skipping diagnostics for ${filePath} (cooldown)`);
        continue;
      }

      // Check attempt count
      const attempts = incrementDiagnosticsAttempt(state, filePath);
      if (attempts > MAX_ATTEMPTS) {
        debugLog(`Skipping diagnostics for ${filePath} (max attempts reached)`);
        continue;
      }

      const result = runDiagnostics(filePath);
      if (result && (result.errors.length > 0 || result.warnings.length > 0)) {
        allResults.push(result);
        updateDiagnosticsCache(state, filePath, {
          timestamp: Date.now(),
          errorCount: result.errors.length,
          warningCount: result.warnings.length,
          diagnostics: [...result.errors, ...result.warnings],
        });
      } else if (result) {
        // Clear previous cache on success
        updateDiagnosticsCache(state, filePath, {
          timestamp: Date.now(),
          errorCount: 0,
          warningCount: 0,
          diagnostics: [],
        });
      }
    }

    saveSessionState(state);

    if (allResults.length === 0) {
      noDecision();
      return;
    }

    // Format diagnostics
    const parts: string[] = ["**🔍 LSP Diagnostics:**\n"];
    for (const result of allResults) {
      parts.push(`**${result.file}:**`);
      if (result.errors.length > 0) {
        parts.push(`  ❌ ${result.errors.length} error(s):`);
        for (const err of result.errors.slice(0, 10)) {
          parts.push(`    ${err}`);
        }
        if (result.errors.length > 10) {
          parts.push(`    ... and ${result.errors.length - 10} more`);
        }
      }
      if (result.warnings.length > 0) {
        parts.push(`  ⚠️ ${result.warnings.length} warning(s):`);
        for (const warn of result.warnings.slice(0, 5)) {
          parts.push(`    ${warn}`);
        }
        if (result.warnings.length > 5) {
          parts.push(`    ... and ${result.warnings.length - 5} more`);
        }
      }
    }
    parts.push("\n**Action:** Please fix the errors above before continuing.");

    addContext("PostToolUse", parts.join("\n"));
  } catch (err) {
    debugLog("LSP diagnostics error:", err);
    noDecision();
  }
}

main();
