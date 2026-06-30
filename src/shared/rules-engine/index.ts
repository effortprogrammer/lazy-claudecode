// Barrel re-export for rules-engine
// All symbols available via a single import path

export { createSessionState, staticDedupKey, dynamicDedupKey } from "./cache.ts";
export {
	PROJECT_MARKERS,
	PROJECT_RULE_SUBDIRS,
	PROJECT_SINGLE_FILES,
	RULE_FILE_EXTENSIONS,
	USER_HOME_RULE_SUBDIRS,
	SOURCE_PRIORITY,
} from "./constants.ts";
export { matchDynamicRuleCached, findSortedCandidatesCached } from "./engine-dynamic-cache.ts";
export { loadDynamicCandidates } from "./engine-dynamic-loader.ts";
export { loadCandidate, ruleDedupKey, staticMatchReason } from "./engine-loader.ts";
export {
	isCandidateWithinProjectCached,
	isSameOrChildPath,
	isRootSingleFile,
} from "./engine-paths.ts";
export { loadStaticCandidates } from "./engine-static-loader.ts";
export type {
	LoadedRuleContent,
	CandidateProjectMembership,
	CandidateDiscoveryCache,
	DynamicMatchCache,
	Engine,
	EngineDeps,
} from "./engine-types.ts";
export { defaultConfig, createEngine } from "./engine.ts";
export { UnsupportedRuleSourceError, RuleFrontmatterParseError } from "./errors.ts";
export { createRuleDiscoveryCache, scanRuleFilesCached } from "./finder-cache.ts";
export type { RuleDiscoveryCache } from "./finder-cache.ts";
export { getWalkDirectories, toRelativePath } from "./finder-paths.ts";
export {
	toProjectRuleSource,
	toProjectSingleFileSource,
	toUserHomeRuleSource,
} from "./finder-sources.ts";
export { findRuleCandidates, findPluginBundledCandidates } from "./finder.ts";
export { formatStaticBlock, formatDynamicBlock } from "./formatter.ts";
export { matchRule, normalizeGlobs, hashContent } from "./matcher.ts";
export type { MatcherInput, MatchResult } from "./matcher.ts";
export { sortCandidates, compareCandidates } from "./ordering.ts";
export { parseRule } from "./parser.ts";
export { resolvePluginRulesRoot } from "./plugin-root.ts";
export { findProjectRoot } from "./project-root.ts";
export { scanRuleFiles } from "./scanner.ts";
export { disabledSourcesFromConfig, DEFAULT_AUTO_DISABLED_SOURCES } from "./sources.ts";
export { truncateRule, truncateBudget } from "./truncator.ts";
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
} from "./types.ts";

/**
 * Determines whether a rule (identified by its display path) should never be
 * truncated when injected into context.  Rules whose path ends with a known
 * "always-full" marker (e.g. AGENTS.md, copilot-instructions.md) are kept
 * intact regardless of budget pressure.
 */
export function isNeverTruncatedRule(displayPath: string): boolean {
	const NEVER_TRUNCATED_SUFFIXES = ["AGENTS.md", "copilot-instructions.md", "CLAUDE.md"];
	return NEVER_TRUNCATED_SUFFIXES.some((suffix) => displayPath.endsWith(suffix));
}
