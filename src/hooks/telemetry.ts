/**
 * Telemetry hook — SessionStart
 *
 * Sends anonymous daily active user telemetry.
 * Opt-out by setting LAZY_CLAUDECODE_NO_TELEMETRY=1.
 *
 * Data collected (all anonymous):
 * - Daily active user ping (no identifying info)
 * - lazy-claudecode version
 * - Node.js version
 * - OS platform
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { platform, arch } from "node:os";
import {
  readHookInput,
  noDecision,
  type BaseHookInput,
} from "../utils/hook-io.js";
import { getTelemetryMarkerPath, debugLog, getLazyClaudeCodeRoot } from "../utils/paths.js";
import { join } from "node:path";

interface TelemetryMarker {
  lastPing: string;
  date: string;
}

function shouldPing(): boolean {
  // Check opt-out
  if (process.env.LAZY_CLAUDECODE_NO_TELEMETRY === "1") {
    return false;
  }

  const markerPath = getTelemetryMarkerPath();
  if (!existsSync(markerPath)) {
    return true;
  }

  try {
    const marker = JSON.parse(readFileSync(markerPath, "utf-8")) as TelemetryMarker;
    const today = new Date().toISOString().split("T")[0];
    return marker.date !== today;
  } catch {
    return true;
  }
}

function recordPing(): void {
  const markerPath = getTelemetryMarkerPath();
  const marker: TelemetryMarker = {
    lastPing: new Date().toISOString(),
    date: new Date().toISOString().split("T")[0],
  };
  try {
    writeFileSync(markerPath, JSON.stringify(marker, null, 2), "utf-8");
  } catch (err) {
    debugLog("Failed to write telemetry marker:", err);
  }
}

function getVersion(): string {
  try {
    const pkgPath = join(getLazyClaudeCodeRoot(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

async function main(): Promise<void> {
  try {
    await readHookInput<BaseHookInput>();

    if (!shouldPing()) {
      noDecision();
      return;
    }

    // Record the ping locally (actual telemetry endpoint can be added later)
    debugLog("Telemetry ping:", {
      version: getVersion(),
      node: process.version,
      platform: platform(),
      arch: arch(),
      timestamp: new Date().toISOString(),
    });

    recordPing();
    noDecision();
  } catch (err) {
    debugLog("Telemetry error:", err);
    noDecision();
  }
}

main();
