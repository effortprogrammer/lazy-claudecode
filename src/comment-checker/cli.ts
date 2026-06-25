#!/usr/bin/env node

import { runClaude CodeHookCli } from "./claude-hook.js";

const [command, subcommand] = process.argv.slice(2);

if (command === "hook" && subcommand === "post-tool-use") {
	await runClaude CodeHookCli();
} else {
	process.stderr.write("Usage: lazy-claudecode-comment-checker hook post-tool-use\n");
	process.exitCode = 2;
}
