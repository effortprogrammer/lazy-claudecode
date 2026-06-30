import type { Readable, Writable } from "node:stream";
import type { CallToolOptions, DaemonToolContext } from "./daemon-client.ts";
import type { DaemonPaths } from "./paths.ts";
export interface ProxyOptions {
	input?: Readable;
	output?: Writable;
	paths?: DaemonPaths;
	context?: DaemonToolContext;
	ensure?: CallToolOptions["ensure"];
}
export declare function runMcpStdioProxy(options?: ProxyOptions): Promise<void>;
