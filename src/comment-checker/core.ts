export { parseApplyPatchRequests } from "../shared/comment-checker-core/index.ts";
export { toHookInput } from "./hook-input.ts";
export { isRecord } from "../shared/comment-checker-core/index.ts";
export { extractCommentCheckRequests, isToolFailureOutput } from "./request-extractor.ts";
export type {
	CheckerEdit,
	CheckerToolInput,
	CheckerToolName,
	CommentCheckerHookInput,
	CommentCheckRequest,
	ImageContent,
	TextContent,
	ToolResultContent,
	ToolResultLike,
} from "./types.ts";
