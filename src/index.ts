#!/usr/bin/env node
/**
 * @fileoverview Entry point for the OpenSearch Logs MCP server.
 *
 * This MCP (Model Context Protocol) server provides tools for querying
 * OpenSearch logs from iOS applications. It supports searching by various
 * criteria including free-text queries, trace IDs, service names, and
 * error levels.
 *
 * @module opensearch-logs-mcp
 *
 * @example
 * ```bash
 * # Run the server
 * npm start
 *
 * # Or with ts-node for development
 * npx ts-node src/index.ts
 * ```
 *
 * @requires OPENSEARCH_DEV_USERNAME - Username for dev environment
 * @requires OPENSEARCH_DEV_PASSWORD - Password for dev environment
 * @requires OPENSEARCH_PROD_USERNAME - Username for prod environment
 * @requires OPENSEARCH_PROD_PASSWORD - Password for prod environment
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, getServerInfo } from "./server.js";

/**
 * Initializes and starts the MCP server.
 *
 * Creates the server instance, establishes the stdio transport,
 * and begins listening for incoming requests.
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  const info = getServerInfo();
  console.error(`${info.name} v${info.version} running on stdio`);
}

/**
 * Handles fatal errors during startup.
 *
 * @param error - The error that caused the failure
 */
function handleFatalError(error: unknown): never {
  console.error("Fatal error:", error);
  process.exit(1);
}

// Start the server
main().catch(handleFatalError);
