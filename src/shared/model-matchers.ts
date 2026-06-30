/**
 * Model identifier matchers — local stubs replacing @oh-my-opencode/model-core.
 */

export function isGptModel(modelID: string): boolean {
	return /^(gpt-|o[1-9]|chatgpt)/i.test(modelID);
}

export function isGeminiModel(modelID: string): boolean {
	return /^gemini/i.test(modelID);
}

export function isGlmModel(modelID: string): boolean {
	return /^glm/i.test(modelID);
}

export function isKimiK2Model(modelID: string): boolean {
	return /kimi.*k2/i.test(modelID);
}

export function isClaudeOpus47Model(modelID: string): boolean {
	return /claude.*opus.*4[\-.]?7/i.test(modelID);
}

export function isMiniMaxModel(modelID: string): boolean {
	return /minimax/i.test(modelID);
}
