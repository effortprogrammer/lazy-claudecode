/**
 * ast-grep shared utilities — types and constants for ast-grep binary provisioning.
 * Ported from the monorepo's utils/src/ast-grep/index.ts.
 */

/** Pinned ast-grep version for deterministic builds. */
export const SG_PINNED_VERSION = "0.38.1";

/** Platform slug for ast-grep binary selection. */
export type SgRuntimeSlug =
	| "x86_64-unknown-linux-gnu"
	| "aarch64-unknown-linux-gnu"
	| "x86_64-apple-darwin"
	| "aarch64-apple-darwin"
	| "x86_64-pc-windows-msvc";

/** Manifest entry describing a downloadable ast-grep asset. */
export interface SgManifestAsset {
	readonly url: string;
	readonly sha256: string;
	readonly size: number;
	readonly platform: SgRuntimeSlug;
}

/** Function type for fetching ast-grep assets. */
export type SgFetch = (url: string) => Promise<Buffer>;
