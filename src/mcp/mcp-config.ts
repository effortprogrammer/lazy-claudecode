/**
 * MCP server configuration generator.
 *
 * Generates .claude/.mcp.json with available MCP servers.
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { debugLog } from "../utils/paths.ts";

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
}

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

/**
 * Generate the default MCP server configuration.
 */
export function generateMcpConfig(): McpConfig {
  return {
    mcpServers: {
      codegraph: {
        command: "npx",
        args: ["-y", "@anthropic/codegraph-mcp"],
        description: "Codebase structure analysis — understand code architecture, dependencies, and navigation",
      },
      "context7": {
        command: "npx",
        args: ["-y", "@anthropic/context7-mcp"],
        description: "Documentation and context retrieval for libraries and frameworks",
      },
      git_bash: {
        command: "npx",
        args: ["-y", "@anthropic/git-bash-mcp"],
        description: "Structured git operations with better error handling",
      },
      grep_app: {
        command: "npx",
        args: ["-y", "@anthropic/grep-app-mcp"],
        description: "Fast code search across repositories",
      },
    },
  };
}

/**
 * Write MCP configuration to a project's .claude/.mcp.json.
 */
export function writeMcpConfig(projectDir: string): void {
  const mcpDir = join(projectDir, ".claude");
  const mcpPath = join(mcpDir, ".mcp.json");

  if (!existsSync(mcpDir)) {
    mkdirSync(mcpDir, { recursive: true });
  }

  const config = generateMcpConfig();

  // If file already exists, merge rather than overwrite
  if (existsSync(mcpPath)) {
    try {
      const existing = JSON.parse(
        require("fs").readFileSync(mcpPath, "utf-8")
      ) as McpConfig;
      // Keep existing servers, add missing ones
      for (const [name, server] of Object.entries(config.mcpServers)) {
        if (!existing.mcpServers[name]) {
          existing.mcpServers[name] = server;
        }
      }
      writeFileSync(mcpPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
    } catch {
      writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
    }
  } else {
    writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  }

  debugLog(`MCP config written to ${mcpPath}`);
}
