import { type Server } from "node:net";
import type { DaemonPaths } from "./paths.ts";
export interface DaemonServerOptions {
    idleShutdownMs?: number;
    idleCheckIntervalMs?: number;
    onIdleShutdown?: () => void;
}
export interface DaemonServerHandle {
    readonly server: Server;
    close(): Promise<void>;
}
export declare function startDaemonServer(paths: DaemonPaths, options?: DaemonServerOptions): Promise<DaemonServerHandle>;
