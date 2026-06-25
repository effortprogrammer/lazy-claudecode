import type { UlwLoopClaudeCodeGoalMode, UlwLoopStatus } from "./constants.js";

export interface CreateUlwLoopOptions {
	brief: string;
	goals?: readonly { readonly title?: string; readonly objective: string }[];
	claudeCodeGoalMode?: UlwLoopClaudeCodeGoalMode;
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
	claudeCodeGoal?: unknown;
	qualityGate?: unknown;
	allowActiveFinalClaudeCodeGoal?: boolean;
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
	claudeCodeGoal?: unknown;
}
