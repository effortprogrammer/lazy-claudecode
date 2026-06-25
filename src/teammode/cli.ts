#!/usr/bin/env node

import { runTeammodeHookCli } from "./claude-hook.ts";

const [command, subcommand] = process.argv.slice(2);

if (command === "hook" && subcommand === "post-tool-use") {
	await runTeammodeHookCli(process.stdin, process.stdout);
} else {
	process.stderr.write("Usage: lazy-claudecode-teammode hook post-tool-use\n");
	process.exitCode = 2;
}
