#!/usr/bin/env node
import { isUlwLoopSubcommand, ulwLoopCommand } from "./cli-commands.ts";
import { runPreToolUseGoalBudgetGuardCli, runUlwLoopHookCli } from "./claude-hook.ts";

const TOP_LEVEL_HELP =
	"Usage:\n  lazy-claudecode ulw-loop <subcommand> [args]\n  lazy-claudecode hook user-prompt-submit         (Claude Code UserPromptSubmit hook)\n  lazy-claudecode help | --help | -h              (this message)\n\nRun `lazy-claudecode ulw-loop help` for ulw-loop subcommands.\n";

async function main(): Promise<number> {
	const argv = process.argv.slice(2);
	const command = argv[0];
	if (command === undefined || command === "help" || command === "--help" || command === "-h") {
		process.stdout.write(TOP_LEVEL_HELP);
		return 0;
	}
	if (command === "ulw-loop") return ulwLoopCommand(argv.slice(1));
	if (command === "hook") {
		const sub = argv[1];
		if (sub === "user-prompt-submit") {
			await runUlwLoopHookCli(process.stdin, process.stdout);
			return 0;
		}
		if (sub === "pre-tool-use") {
			await runPreToolUseGoalBudgetGuardCli(process.stdin, process.stdout);
			return 0;
		}
		process.stderr.write(`[lazy-claudecode] unknown hook subcommand: ${sub ?? "(none)"}\n`);
		return 1;
	}
	if (isUlwLoopSubcommand(command)) return ulwLoopCommand(argv);
	process.stderr.write(`[lazy-claudecode] unknown command: ${command}\n${TOP_LEVEL_HELP}`);
	return 1;
}

main()
	.then((code) => {
		process.exit(code);
	})
	.catch((error: unknown) => {
		process.stderr.write(`[lazy-claudecode] ${error instanceof Error ? error.message : String(error)}\n`);
		process.exit(1);
	});
