export { parseApplyPatchRequests } from "../shared/comment-checker-core/index.js";
export { toHookInput } from "./hook-input.js";
export { isRecord } from "../shared/comment-checker-core/index.js";
export { extractCommentCheckRequests, isToolFailureOutput } from "./request-extractor.js";
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
} from "./types.js";
