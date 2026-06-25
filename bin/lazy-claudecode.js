#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "install": {
      const { install } = await import("../dist/lib/install.js");
      await install(ROOT);
      break;
    }
    case "uninstall": {
      const { uninstall } = await import("../dist/lib/uninstall.js");
      await uninstall(ROOT);
      break;
    }
    case "doctor": {
      const { doctor } = await import("../dist/lib/doctor.js");
      await doctor(ROOT);
      break;
    }
    case "version":
    case "--version":
    case "-v":
      console.log(`lazy-claudecode v${pkg.version}`);
      break;
    case "help":
    case "--help":
    case "-h":
    default:
      console.log(`
lazy-claudecode v${pkg.version}
Agent harness for Claude Code — hooks, skills, MCP servers, and systematic work modes.

Usage:
  lazy-claudecode <command>

Commands:
  install     Install hooks into ~/.claude/settings.json and set up MCP servers
  uninstall   Remove lazy-claudecode hooks from settings
  doctor      Check all components are healthy
  version     Show version

Options:
  -h, --help     Show this help message
  -v, --version  Show version number
`);
      if (command && command !== "help" && command !== "--help" && command !== "-h") {
        process.exit(1);
      }
      break;
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
