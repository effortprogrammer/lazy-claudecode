import { loadCandidate, staticMatchReason } from "./engine-loader.ts";
import { isRootSingleFile } from "./engine-paths.ts";
import type { EngineDeps } from "./engine-types.ts";
import { sortCandidates } from "./ordering.ts";
import type { LoadedRule, RuleCandidate, RuleDiagnostic } from "./types.ts";

export function loadStaticCandidates(
	candidates: ReadonlyArray<RuleCandidate>,
	deps: EngineDeps,
	projectRoot: string | null,
): { rules: LoadedRule[]; diagnostics: RuleDiagnostic[] } {
	const rules: LoadedRule[] = [];
	const diagnostics: RuleDiagnostic[] = [];
	let rootSingleFileSelected = false;

	for (const candidate of sortCandidates(candidates)) {
		if (isDedupedRootSingleFile(candidate, rootSingleFileSelected)) {
			continue;
		}

		const loadedRule = loadCandidate(candidate, deps, diagnostics, projectRoot);
		if (loadedRule === null) {
			continue;
		}

		const matchReason = staticMatchReason(loadedRule);
		if (matchReason === null) {
			continue;
		}

		if (isRootSingleFile(candidate)) {
			rootSingleFileSelected = true;
		}

		rules.push({ ...loadedRule, matchReason });
	}

	return { rules: sortCandidates(rules), diagnostics };
}

function isDedupedRootSingleFile(candidate: RuleCandidate, rootSingleFileSelected: boolean): boolean {
	return rootSingleFileSelected && isRootSingleFile(candidate);
}
