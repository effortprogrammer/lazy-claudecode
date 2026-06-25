import type { PiRulesConfig } from "../shared/rules-engine/index.ts";

export function withDynamicBudget(config: PiRulesConfig): PiRulesConfig {
	return {
		...config,
		maxRuleChars: Math.min(config.maxRuleChars, config.dynamicMaxRuleChars),
		maxResultChars: Math.min(config.maxResultChars, config.dynamicMaxResultChars),
	};
}

export function withPromptBudget(config: PiRulesConfig): PiRulesConfig {
	return {
		...config,
		maxRuleChars: Math.min(config.maxRuleChars, config.promptMaxRuleChars),
		maxResultChars: Math.min(config.maxResultChars, config.promptMaxResultChars),
	};
}
