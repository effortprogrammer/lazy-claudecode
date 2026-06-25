import type { UlwLoopClaude CodeGoalMode, UlwLoopStatus } from "./constants.js";

export interface CreateUlwLoopOptions {
	brief: string;
	goals?: readonly { readonly title?: string; readonly objective: string }[];
	claude-codeGoalMode?: UlwLoopClaude CodeGoalMode;
	now?: Date;
	force?: boolean;
}

export interface StartNextOptions {
	now?: Date;
	retryFailed?: boolean;
}

export interface CheckpointOptions {
	goalId: string;
	status: Extract<UlwLoopStatus, "complete" | "failed"> | "blocked";
	evidence?: string;
	claude-codeGoal?: unknown;
	qualityGate?: unknown;
	allowActiveFinalClaude CodeGoal?: boolean;
	now?: Date;
}

export interface AddUlwLoopGoalOptions {
	title: string;
	objective: string;
	evidence?: string;
	now?: Date;
}

export interface RecordFinalReviewBlockersOptions extends AddUlwLoopGoalOptions {
	goalId: string;
	claude-codeGoal?: unknown;
}
