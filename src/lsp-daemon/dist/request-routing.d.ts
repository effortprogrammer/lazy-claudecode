import { type JsonRpcResponse } from "@effortprogrammer/lsp-core/mcp";
import { type RequestContext } from "@effortprogrammer/lsp-core/request-context";
export declare const CONTEXT_KEY = "_context";
export interface RoutedRequest {
    input: unknown;
    context: RequestContext | undefined;
}
export declare function extractRequestContext(raw: unknown): RoutedRequest;
export declare function handleDaemonMessage(raw: unknown): Promise<JsonRpcResponse | undefined>;
