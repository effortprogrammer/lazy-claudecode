// Barrel re-export for rules-engine
// All symbols available via a single import path

export { createSessionState, staticDedupKey, dynamicDedupKey } from "./cache.js";
export {
	PROJECT_MARKERS,
	PROJECT_RULE_SUBDIRS,
	PROJECT_SINGLE_FILES,
	RULE_FILE_EXTENSIONS,
	USER_HOME_RULE_SUBDIRS,
	SOURCE_PRIORITY,
} from "./constants.js";
export { matchDynamicRuleCached, findSortedCandidatesCached } from "./engine-dynamic-cache.js";
export { loadDynamicCandidates } from "./engine-dynamic-loader.js";
export { loadCandidate, ruleDedupKey, staticMatchReason } from "./engine-loader.js";
export { isCandidateWithinProjectCached, isSameOrChildPath, isRootSingleFile } from "./engine-paths.js";
export { loadStaticCandidates } from "./engine-static-loader.js";
export type {
	LoadedRuleContent,
	CandidateProjectMembership,
	CandidateDiscoveryCache,
	DynamicMatchCache,
	Engine,
	EngineDeps,
} from "./engine-types.js";
export { defaultConfig, createEngine } from "./engine.js";
export { UnsupportedRuleSourceError, RuleFrontmatterParseError } from "./errors.js";
export { createRuleDiscoveryCache, scanRuleFilesCached } from "./finder-cache.js";
export type { RuleDiscoveryCache } from "./finder-cache.js";
export { getWalkDirectories, toRelativePath } from "./finder-paths.js";
export { toProjectRuleSource, toProjectSingleFileSource, toUserHomeRuleSource } from "./finder-sources.js";
export { findRuleCandidates, findPluginBundledCandidates } from "./finder.js";
export { formatStaticBlock, formatDynamicBlock } from "./formatter.js";
export { matchRule, normalizeGlobs, hashContent } from "./matcher.js";
export type { MatcherInput, MatchResult } from "./matcher.js";
export { sortCandidates, compareCandidates } from "./ordering.js";
export { parseRule } from "./parser.js";
export { resolvePluginRulesRoot } from "./plugin-root.js";
export { findProjectRoot } from "./project-root.js";
export { scanRuleFiles } from "./scanner.js";
export { disabledSourcesFromConfig, DEFAULT_AUTO_DISABLED_SOURCES } from "./sources.js";
export { truncateRule, truncateBudget } from "./truncator.js";
export type {
	RuleFrontmatter,
	ParsedRule,
	RuleCandidate,
	LoadedRule,
	PiRulesConfig,
	MatchReason,
	RuleSource,
	RuleDiagnostic,
	SessionState,
} from "./types.js";

/**
 * Determines whether a rule (identified by its display path) should never be
 * truncated when injected into context.  Rules whose path ends with a known
 * "always-full" marker (e.g. AGENTS.md, copilot-instructions.md) are kept
 * intact regardless of budget pressure.
 */
export function isNeverTruncatedRule(displayPath: string): boolean {
	const NEVER_TRUNCATED_SUFFIXES = [
		"AGENTS.md",
		"copilot-instructions.md",
		"CLAUDE.md",
	];
	return NEVER_TRUNCATED_SUFFIXES.some((suffix) =>
		displayPath.endsWith(suffix),
	);
}
