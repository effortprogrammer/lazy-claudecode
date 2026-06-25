/**
 * Rules Loader hook — SessionStart
 *
 * Loads project rules from:
 * - .claude/rules/*.md
 * - CLAUDE.md (root)
 * - AGENTS.md (root)
 * - .lazy-claudecode/rules/*.md
 *
 * Injects loaded rules as additional context.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import {
  readHookInput,
  addContext,
  noDecision,
  type BaseHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";
import { loadSessionState, saveSessionState } from "../state/session-state.js";

interface RulesLoaderInput extends BaseHookInput {
  session_id?: string;
  cwd?: string;
}

interface LoadedRule {
  source: string;
  content: string;
}

function loadRulesFromDir(dir: string): LoadedRule[] {
  const rules: LoadedRule[] = [];
  if (!existsSync(dir)) return rules;

  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
    for (const file of files) {
      const filePath = join(dir, file);
      try {
        const content = readFileSync(filePath, "utf-8").trim();
        if (content) {
          rules.push({ source: filePath, content });
        }
      } catch (err) {
        debugLog(`Failed to read rule file ${filePath}:`, err);
      }
    }
  } catch (err) {
    debugLog(`Failed to read rules directory ${dir}:`, err);
  }

  return rules;
}

function loadRuleFile(filePath: string): LoadedRule | null {
  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath, "utf-8").trim();
    if (content) {
      return { source: filePath, content };
    }
  } catch (err) {
    debugLog(`Failed to read rule file ${filePath}:`, err);
  }
  return null;
}

async function main(): Promise<void> {
  try {
    const input = await readHookInput<RulesLoaderInput>();
    const sessionId = input.session_id || "unknown";
    const cwd = input.cwd || process.cwd();

    const state = loadSessionState(sessionId);
    if (state.rulesLoaded) {
      noDecision();
      return;
    }

    const allRules: LoadedRule[] = [];

    // 1. Load from .claude/rules/
    allRules.push(...loadRulesFromDir(join(cwd, ".claude", "rules")));

    // 2. Load CLAUDE.md
    const claudeMd = loadRuleFile(join(cwd, "CLAUDE.md"));
    if (claudeMd) allRules.push(claudeMd);

    // 3. Load AGENTS.md
    const agentsMd = loadRuleFile(join(cwd, "AGENTS.md"));
    if (agentsMd) allRules.push(agentsMd);

    // 4. Load from .lazy-claudecode/rules/
    allRules.push(...loadRulesFromDir(join(cwd, ".lazy-claudecode", "rules")));

    state.rulesLoaded = true;
    saveSessionState(state);

    if (allRules.length === 0) {
      debugLog("No project rules found");
      noDecision();
      return;
    }

    // Format rules as context
    const parts: string[] = [
      `**📋 Project Rules Loaded (${allRules.length} file(s)):**\n`,
    ];

    for (const rule of allRules) {
      const name = basename(rule.source);
      parts.push(`--- ${name} ---`);
      // Truncate very long rules
      if (rule.content.length > 2000) {
        parts.push(rule.content.substring(0, 2000) + "\n... (truncated)");
      } else {
        parts.push(rule.content);
      }
      parts.push("");
    }

    addContext("SessionStart", parts.join("\n"));
  } catch (err) {
    debugLog("Rules loader error:", err);
    noDecision();
  }
}

main();
