/**
 * Comment Checker hook — PostToolUse for Edit|Write|MultiEdit
 *
 * Checks edited files for bad comment patterns:
 * - TODO without ticket reference
 * - Commented-out code blocks
 * - Obvious/redundant comments
 * - Self-evident comments that just restate the code
 */

import { readFileSync, existsSync } from "node:fs";
import { extname } from "node:path";
import {
  readHookInput,
  addContext,
  noDecision,
  type ToolUseHookInput,
} from "../utils/hook-io.js";
import { debugLog } from "../utils/paths.js";

/** Bad comment patterns with descriptions */
const BAD_PATTERNS: Array<{ pattern: RegExp; description: string; severity: "warning" | "error" }> = [
  {
    pattern: /\/\/\s*TODO(?!\s*[\[(:]?\s*[A-Z]+-\d+)/,
    description: "TODO without ticket reference (e.g., TODO(PROJ-123))",
    severity: "warning",
  },
  {
    pattern: /\/\/\s*FIXME(?!\s*[\[(:]?\s*[A-Z]+-\d+)/,
    description: "FIXME without ticket reference",
    severity: "warning",
  },
  {
    pattern: /\/\/\s*HACK(?!\s*[\[(:]?\s*[A-Z]+-\d+)/,
    description: "HACK without ticket reference",
    severity: "warning",
  },
  {
    pattern: /\/\/\s*(increment|decrement|set|get|return|initialize|init|declare|define|assign|create|add|remove|delete|update|check|log|print|import)\s+(the\s+)?\w+/i,
    description: "Obvious comment restating the code",
    severity: "warning",
  },
  {
    pattern: /\/\/\s*end\s+(if|for|while|function|class|method|switch|try|catch)/i,
    description: "Redundant end-block comment",
    severity: "warning",
  },
  {
    pattern: /\/\/\s*constructor/i,
    description: "Redundant constructor comment",
    severity: "warning",
  },
  {
    pattern: /\/\/\s*default\s*(case|value|export)/i,
    description: "Redundant default comment",
    severity: "warning",
  },
];

/** Patterns that indicate commented-out code */
const COMMENTED_CODE_PATTERNS: RegExp[] = [
  /\/\/\s*(const|let|var|function|class|import|export|if|for|while|return|throw)\s/,
  /\/\/\s*\w+\s*\(.*\)\s*;?\s*$/,
  /\/\/\s*\w+\.\w+\s*\(.*\)\s*;?\s*$/,
  /\/\*[\s\S]*?(const|let|var|function|class|import|export)\s/,
];

/** File extensions to check */
const CHECKABLE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".java", ".kt", ".scala",
  ".c", ".cpp", ".h", ".hpp",
  ".go", ".rs", ".swift",
  ".py", ".rb",
]);

interface CommentIssue {
  line: number;
  text: string;
  issue: string;
  severity: "warning" | "error";
}

function checkFileForBadComments(filePath: string): CommentIssue[] {
  if (!existsSync(filePath)) return [];

  const ext = extname(filePath);
  if (!CHECKABLE_EXTENSIONS.has(ext)) return [];

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues: CommentIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check bad patterns
    for (const { pattern, description, severity } of BAD_PATTERNS) {
      if (pattern.test(line)) {
        issues.push({
          line: i + 1,
          text: line,
          issue: description,
          severity,
        });
        break; // One issue per line
      }
    }

    // Check for commented-out code (only if not already flagged)
    if (issues.length === 0 || issues[issues.length - 1].line !== i + 1) {
      for (const pattern of COMMENTED_CODE_PATTERNS) {
        if (pattern.test(line)) {
          // Avoid false positives: skip if it looks like a documentation comment
          if (/\/\/\s*(example|e\.g\.|note|see|cf|docs|usage|@)/i.test(line)) {
            continue;
          }
          issues.push({
            line: i + 1,
            text: line,
            issue: "Appears to be commented-out code",
            severity: "warning",
          });
          break;
        }
      }
    }
  }

  return issues;
}

function extractFilePaths(input: ToolUseHookInput): string[] {
  const paths: string[] = [];
  const toolInput = input.tool_input || {};

  // Edit/Write tool: file_path or path
  if (typeof toolInput.file_path === "string") paths.push(toolInput.file_path);
  if (typeof toolInput.path === "string") paths.push(toolInput.path);
  if (typeof toolInput.file === "string") paths.push(toolInput.file);

  // MultiEdit: files array
  if (Array.isArray(toolInput.files)) {
    for (const f of toolInput.files) {
      if (typeof f === "string") paths.push(f);
      if (typeof f === "object" && f !== null && typeof (f as Record<string, unknown>).path === "string") {
        paths.push((f as Record<string, string>).path);
      }
    }
  }

  return [...new Set(paths)]; // Deduplicate
}

async function main(): Promise<void> {
  try {
    const input = await readHookInput<ToolUseHookInput>();
    const filePaths = extractFilePaths(input);

    if (filePaths.length === 0) {
      noDecision();
      return;
    }

    const allIssues: Array<{ file: string; issues: CommentIssue[] }> = [];

    for (const filePath of filePaths) {
      const issues = checkFileForBadComments(filePath);
      if (issues.length > 0) {
        allIssues.push({ file: filePath, issues });
      }
    }

    if (allIssues.length === 0) {
      noDecision();
      return;
    }

    // Format issues as context
    const parts: string[] = ["**⚠️ Comment Checker — Issues Found:**\n"];
    for (const { file, issues } of allIssues) {
      parts.push(`**${file}:**`);
      for (const issue of issues) {
        parts.push(`  Line ${issue.line}: ${issue.issue}`);
        parts.push(`    \`${issue.text}\``);
      }
    }
    parts.push(
      "\n**Action:** Please fix or remove these comments. Comments should add value beyond what the code already communicates."
    );

    addContext("PostToolUse", parts.join("\n"));
  } catch (err) {
    debugLog("Comment checker error:", err);
    noDecision();
  }
}

main();
