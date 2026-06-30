export { disposeDefaultLspManager } from "@effortprogrammer/lsp-core/lsp/manager";
export {
	type CallToolOptions,
	callDiagnosticsViaDaemon,
	callToolViaDaemon,
	currentRequestContext,
	type DaemonToolContext,
} from "./daemon-client.ts";
export { ensureDaemonRunning } from "./ensure-daemon.ts";
export { type DaemonPaths, daemonPaths } from "./paths.ts";
export { runMcpStdioProxy } from "./proxy.ts";
