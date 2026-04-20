/**
 * @fileoverview MCP tool handlers.
 * Contains the execution logic for each tool.
 */

import type {
  Environment,
  SearchLogsArgs,
  SearchByTraceArgs,
  SearchByServiceArgs,
  SearchErrorsArgs,
  GetFieldValuesArgs,
  SearchByFieldArgs,
  EnvironmentOnlyArgs,
  TimeRange,
} from "../types/index.js";
import { createLogSearchService } from "../services/log-search.service.js";
import type { ToolName } from "./tool-definitions.js";

/**
 * Severity number threshold for ERROR level logs.
 * OpenTelemetry severity numbers:
 * - 1-4: TRACE
 * - 5-8: DEBUG
 * - 9-12: INFO
 * - 13-16: WARN
 * - 17-20: ERROR
 * - 21-24: FATAL
 */
const ERROR_SEVERITY_THRESHOLD = 17;

/**
 * Default result sizes for different operations.
 */
const DEFAULTS = {
  SEARCH_SIZE: 50,
  TRACE_SIZE: 100,
  MAX_SIZE: 200,
  TIME_RANGE: "1h" as TimeRange,
};

/**
 * Result of a tool execution.
 */
export interface ToolResult {
  /** Whether the execution was successful */
  success: boolean;
  /** Result data as JSON string */
  data?: string;
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Handles execution of MCP tools.
 *
 * This class implements the Strategy pattern, routing tool calls
 * to their appropriate handlers based on the tool name.
 *
 * @example
 * ```typescript
 * const handler = new ToolHandler();
 * const result = await handler.execute("search_logs", {
 *   environment: "prod",
 *   query: "error"
 * });
 * ```
 */
export class ToolHandler {
  /**
   * Executes a tool with the given arguments.
   *
   * @param toolName - Name of the tool to execute
   * @param args - Tool arguments
   * @returns Tool execution result
   */
  async execute(toolName: ToolName, args: unknown): Promise<ToolResult> {
    try {
      const result = await this.dispatch(toolName, args);
      return { success: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }

  /**
   * Dispatches the tool call to the appropriate handler.
   */
  private async dispatch(toolName: ToolName, args: unknown): Promise<string> {
    switch (toolName) {
      case "search_logs":
        return this.handleSearchLogs(args as SearchLogsArgs);

      case "search_by_trace":
        return this.handleSearchByTrace(args as SearchByTraceArgs);

      case "search_by_service":
        return this.handleSearchByService(args as SearchByServiceArgs);

      case "search_errors":
        return this.handleSearchErrors(args as SearchErrorsArgs);

      case "get_field_values":
        return this.handleGetFieldValues(args as GetFieldValuesArgs);

      case "search_by_field":
        return this.handleSearchByField(args as SearchByFieldArgs);

      case "get_mapping":
        return this.handleGetMapping(args as EnvironmentOnlyArgs);

      case "get_sample_log":
        return this.handleGetSampleLog(args as EnvironmentOnlyArgs);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Handles the search_logs tool.
   */
  private async handleSearchLogs(args: SearchLogsArgs): Promise<string> {
    const service = createLogSearchService(args.environment);
    const result = await service.search({
      environment: args.environment,
      query: args.query,
      timeRange: args.timeRange,
      size: Math.min(args.size ?? DEFAULTS.SEARCH_SIZE, DEFAULTS.MAX_SIZE),
    });
    return JSON.stringify(result, null, 2);
  }

  /**
   * Handles the search_by_trace tool.
   */
  private async handleSearchByTrace(args: SearchByTraceArgs): Promise<string> {
    const service = createLogSearchService(args.environment);
    const result = await service.search({
      environment: args.environment,
      traceId: args.traceId,
      size: args.size ?? DEFAULTS.TRACE_SIZE,
    });
    return JSON.stringify(result, null, 2);
  }

  /**
   * Handles the search_by_service tool.
   */
  private async handleSearchByService(args: SearchByServiceArgs): Promise<string> {
    const service = createLogSearchService(args.environment);
    const result = await service.search({
      environment: args.environment,
      serviceName: args.serviceName,
      level: args.level,
      query: args.query,
      timeRange: args.timeRange ?? DEFAULTS.TIME_RANGE,
      size: args.size ?? DEFAULTS.SEARCH_SIZE,
    });
    return JSON.stringify(result, null, 2);
  }

  /**
   * Handles the search_errors tool.
   */
  private async handleSearchErrors(args: SearchErrorsArgs): Promise<string> {
    const service = createLogSearchService(args.environment);
    const result = await service.search({
      environment: args.environment,
      serviceName: args.serviceName,
      query: args.query,
      minSeverity: ERROR_SEVERITY_THRESHOLD,
      timeRange: args.timeRange,
      size: args.size ?? DEFAULTS.SEARCH_SIZE,
    });
    return JSON.stringify(result, null, 2);
  }

  /**
   * Handles the get_field_values tool.
   */
  private async handleGetFieldValues(args: GetFieldValuesArgs): Promise<string> {
    const service = createLogSearchService(args.environment);
    const result = await service.getFieldValues({
      environment: args.environment,
      field: args.field,
      size: args.size,
    });
    return JSON.stringify(result, null, 2);
  }

  /**
   * Handles the search_by_field tool.
   */
  private async handleSearchByField(args: SearchByFieldArgs): Promise<string> {
    const service = createLogSearchService(args.environment);
    const result = await service.search({
      environment: args.environment,
      field: args.field,
      value: args.value,
      timeRange: args.timeRange ?? DEFAULTS.TIME_RANGE,
      size: args.size ?? DEFAULTS.SEARCH_SIZE,
    });
    return JSON.stringify(result, null, 2);
  }

  /**
   * Handles the get_mapping tool.
   */
  private async handleGetMapping(args: EnvironmentOnlyArgs): Promise<string> {
    const service = createLogSearchService(args.environment);
    const result = await service.getMapping();
    return JSON.stringify(result, null, 2);
  }

  /**
   * Handles the get_sample_log tool.
   */
  private async handleGetSampleLog(args: EnvironmentOnlyArgs): Promise<string> {
    const service = createLogSearchService(args.environment);
    const result = await service.getSampleLog();
    return JSON.stringify(result, null, 2);
  }
}

/**
 * Singleton instance of the tool handler.
 */
let handlerInstance: ToolHandler | null = null;

/**
 * Gets or creates the tool handler instance.
 *
 * @returns ToolHandler singleton instance
 */
export function getToolHandler(): ToolHandler {
  if (!handlerInstance) {
    handlerInstance = new ToolHandler();
  }
  return handlerInstance;
}
