/**
 * @fileoverview MCP Server configuration and setup.
 * Configures the Model Context Protocol server and registers handlers.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { tools, isValidToolName, type ToolName } from "./tools/tool-definitions.js";
import { getToolHandler } from "./tools/tool-handlers.js";

/**
 * Server metadata.
 */
const SERVER_INFO = {
  name: "opensearch-logs",
  version: "1.0.0",
} as const;

/**
 * Creates and configures the MCP server.
 *
 * Sets up all request handlers for tool listing and execution.
 *
 * @returns Configured MCP server instance
 *
 * @example
 * ```typescript
 * const server = createServer();
 * const transport = new StdioServerTransport();
 * await server.connect(transport);
 * ```
 */
export function createServer(): Server {
  const server = new Server(SERVER_INFO, {
    capabilities: {
      tools: {},
    },
  });

  registerHandlers(server);

  return server;
}

/**
 * Registers all request handlers on the server.
 *
 * @param server - MCP server instance
 */
function registerHandlers(server: Server): void {
  registerListToolsHandler(server);
  registerCallToolHandler(server);
}

/**
 * Registers the handler for listing available tools.
 *
 * @param server - MCP server instance
 */
function registerListToolsHandler(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));
}

/**
 * Registers the handler for executing tools.
 *
 * @param server - MCP server instance
 */
function registerCallToolHandler(server: Server): void {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!isValidToolName(name)) {
      return {
        content: [{ type: "text", text: `Error: Unknown tool '${name}'` }],
        isError: true,
      };
    }

    const handler = getToolHandler();
    const result = await handler.execute(name as ToolName, args);

    if (result.success) {
      return {
        content: [{ type: "text", text: result.data ?? "" }],
      };
    }

    return {
      content: [{ type: "text", text: `Error: ${result.error}` }],
      isError: true,
    };
  });
}

/**
 * Gets the server info for logging purposes.
 *
 * @returns Server name and version
 */
export function getServerInfo(): typeof SERVER_INFO {
  return SERVER_INFO;
}
