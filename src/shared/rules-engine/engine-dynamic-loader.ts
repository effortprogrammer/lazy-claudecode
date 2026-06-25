import { findSortedCandidatesCached, matchDynamicRuleCached } from "./engine-dynamic-cache.ts";
import { loadCandidate, ruleDedupKey } from "./engine-loader.ts";
import { isSameOrChildPath } from "./engine-paths.ts";
import type { CandidateDiscoveryCache, DynamicMatchCache, EngineDeps, LoadedRuleContent } from "./engine-types.ts";
import { createRuleDiscoveryCache } from "./finder.ts";
import { matchRule } from "./matcher.ts";
import { sortCandidates } from "./ordering.ts";
import { disabledSourcesFromConfig } from "./sources.ts";
import type { LoadedRule, PiRulesConfig, RuleDiagnostic } from "./types.ts";

export function loadDynamicCandidates(
	config: PiRulesConfig,
	deps: EngineDeps,
	cwd: string,
	targetPaths: ReadonlyArray<string>,
	dynamicMatchCache: DynamicMatchCache,
): { rules: LoadedRule[]; diagnostics: RuleDiagnostic[] } {
	const rules: LoadedRule[] = [];
	const diagnostics: RuleDiagnostic[] = [];
	const seenRules = new Set<string>();
	const loadedRuleContent = new Map<string, LoadedRuleContent | null>();
	const projectMembership = new Map<string, boolean>();
	const disabledSources = disabledSourcesFromConfig(config);
	const discoveryCache = createRuleDiscoveryCache();
	const candidateDiscoveryCache: CandidateDiscoveryCache = new Map();
	const cwdProjectRoot = deps.findProjectRoot(cwd);

	for (const targetFile of uniqueStrings(targetPaths)) {
		const projectRoot =
			cwdProjectRoot !== null && isSameOrChildPath(targetFile, cwdProjectRoot)
				? cwdProjectRoot
				: deps.findProjectRoot(targetFile);
		const findOptions: Parameters<EngineDeps["findCandidates"]>[0] = {
			projectRoot,
			targetFile,
			cache: discoveryCache,
		};
		if (disabledSources !== undefined) {
			findOptions.disabledSources = disabledSources;
		}
		const candidates = findSortedCandidatesCached(candidateDiscoveryCache, deps.findCandidates, findOptions);

		for (const candidate of candidates) {
			const loadedRule = loadCandidate(
				candidate,
				deps,
				diagnostics,
				projectRoot,
				loadedRuleContent,
				projectMembership,
			);
			if (loadedRule === null) {
				continue;
			}

			const matchReason = matchDynamicRuleCached(
				dynamicMatchCache,
				projectRoot,
				targetFile,
				candidate,
				loadedRule,
				deps.matchRule ?? matchRule,
			);

			if (matchReason === null) {
				continue;
			}

			const dedupKey = ruleDedupKey(loadedRule);
			if (seenRules.has(dedupKey)) {
				continue;
			}

			seenRules.add(dedupKey);
			rules.push({ ...loadedRule, matchReason });
		}
	}

	return { rules: sortCandidates(rules), diagnostics };
}

function uniqueStrings(values: ReadonlyArray<string>): string[] {
	const uniqueValues: string[] = [];
	const seenValues = new Set<string>();
	for (const value of values) {
		if (seenValues.has(value)) {
			continue;
		}

		seenValues.add(value);
		uniqueValues.push(value);
	}
	return uniqueValues;
}
