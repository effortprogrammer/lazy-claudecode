import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("claude-code ultrawork directive source", () => {
	it("#given bundled directive #when compared to prompts-core claude variant #then bytes match", () => {
		// given
		const directive = readFileSync("directive.md", "utf8");
		const claudePromptUrl = new URL(import.meta.resolve("../../../shared/prompts-core/prompts/ultrawork/codex.md"));

		// when
		const claudePrompt = readFileSync(claudePromptUrl, "utf8");

		// then
		expect(claudePrompt).toBe(directive);
	});
});
