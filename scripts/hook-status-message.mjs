const PRODUCT_PREFIX = "(LazyClaude)";

const WORD_OVERRIDES = new Map([
	["codegraph", "CodeGraph"],
	["lazy-claudecode", "LazyClaude Code"],
	["lsp", "LSP"],
	["mcp", "MCP"],
	["ulw-loop", "Ulw-Loop"],
]);

export function formatLazyClaude CodeHookStatusMessage(version, label) {
	void version;
	return `${PRODUCT_PREFIX} ${normalizeLazyClaude CodeHookStatusLabel(label)}`;
}

export function normalizeLazyClaude CodeHookStatusLabel(label) {
	const parsed = parseLazyClaude CodeHookStatusMessage(label);
	const rawLabel = parsed === null ? label : parsed.label;
	const normalized = rawLabel
		.replace(/^\(LazyClaude\)\s*/i, " ")
		.replace(/\bLAZY_CLAUDECODE\b/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (normalized.length === 0) return "";
	return normalized
		.split(" ")
		.map(formatWord)
		.join(" ");
}

export function parseLazyClaude CodeHookStatusMessage(message) {
	const trimmed = message.trim();
	const current = /^\(LazyClaude\)\s+(.+)$/.exec(trimmed);
	if (current !== null) return { version: undefined, label: current[1] };
	const legacy = /^LazyClaude Code\(([^)]+)\):\s+(.+)$/.exec(trimmed);
	if (legacy === null) return null;
	const [, version, label] = legacy;
	return { version, label };
}

function formatWord(word) {
	const lower = word.toLowerCase();
	const override = WORD_OVERRIDES.get(lower);
	if (override !== undefined) return override;
	if (word.includes("-")) {
		return word
			.split("-")
			.map(formatWord)
			.join("-");
	}
	return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
}
