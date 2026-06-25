/**
 * Executor Verify hook — SubagentStop
 *
 * When a subagent finishes, verifies that it provided evidence receipts
 * for its work. Blocks if no valid evidence is found.
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
  readTranscript,
  getMessageText,
} from "../utils/transcript.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Patterns that indicate evidence was provided */
const EVIDENCE_PATTERNS = [
  /EVIDENCE_RECEIPT:/i,
  /✅\s*(test|compilation|runtime|verification|result)/i,
  /\bpassed?\b.*\btest/i,
  /\btest.*\bpassed?\b/i,
  /\b(all|every)\s+tests?\s+(pass|succeed)/i,
  /\bno\s+(errors?|warnings?|issues?)\b/i,
  /\bbuild\s+succeed/i,
  /\bcompilation\s+success/i,
  /\bverified?\b/i,
];

/** Patterns that indicate the subagent did meaningful work */
const WORK_PATTERNS = [
  /\b(created?|modified?|updated?|changed?|edited?|wrote|written)\s/i,
  /\bfile[s]?\s*(created?|modified?|changed?)/i,
  /\b(implemented?|fixed?|resolved?|added?|removed?)\s/i,
];

function hasEvidence(transcriptPath: string): { hasEvidence: boolean; hasWork: boolean } {
  const messages = readTranscript(transcriptPath);
  let hasEvidence = false;
  let hasWork = false;

  // Check the last 10 messages for evidence
  const recentMessages = messages.slice(-10);

  for (const msg of recentMessages) {
    const text = getMessageText(msg);

    for (const pattern of EVIDENCE_PATTERNS) {
      if (pattern.test(text)) {
        hasEvidence = true;
        break;
      }
    }

    for (const pattern of WORK_PATTERNS) {
      if (pattern.test(text)) {
        hasWork = true;
        break;
      }
    }

    if (hasEvidence && hasWork) break;
  }

  return { hasEvidence, hasWork };
}

function loadVerifyDirective(): string {
  try {
    const directivePath = join(__dirname, "..", "directives", "executor-verify.md");
    return readFileSync(directivePath, "utf-8");
  } catch {
    return `**⚠️ SUBAGENT WORK REQUIRES VERIFICATION**

Before completing, provide an evidence receipt:
- What was done
- Files changed
- Verification performed
- Result (pass/fail)`;
  }
}

async function main(): Promise<void> {
  try {
    const input = await readHookInput<StopHookInput>();
    const transcriptPath = input.transcript_path || "";

    if (!transcriptPath) {
      // No transcript available, can't verify — allow
      noDecision();
      return;
    }

    const { hasEvidence: found, hasWork } = hasEvidence(transcriptPath);

    if (!hasWork) {
      // Subagent didn't do meaningful work, allow stop
      noDecision();
      return;
    }

    if (found) {
      // Evidence found, allow stop
      noDecision();
      return;
    }

    // Work was done but no evidence — block
    const directive = loadVerifyDirective();
    blockDecision(directive);
  } catch (err) {
    debugLog("Executor verify error:", err);
    noDecision();
  }
}

main();
