/**
 * @fileoverview MCP tool definitions.
 * Defines the schema and metadata for all available tools.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Common property definitions reused across tools.
 */
const COMMON_PROPERTIES = {
  environment: {
    type: "string" as const,
    enum: ["dev", "prod", "android-dev", "android-prod"],
    description:
      "Environment to search: 'dev'/'prod' (iOS) or 'android-dev'/'android-prod' (Android)",
  },
  timeRange: {
    type: "string" as const,
    enum: ["15m", "1h", "6h", "24h", "7d"],
    description: "Time range to search within",
  },
  size: {
    type: "number" as const,
    description: "Maximum number of results to return",
  },
  query: {
    type: "string" as const,
    description: "Free-text search query using Lucene syntax",
  },
};

/**
 * Tool for searching logs with free-text queries.
 */
const searchLogs: Tool = {
  name: "search_logs",
  description:
    "Search OpenSearch logs with a free-text query. Supports Lucene query syntax. " +
    "Examples: 'error AND authentication', 'status:500', 'message:*timeout*'",
  inputSchema: {
    type: "object" as const,
    properties: {
      environment: COMMON_PROPERTIES.environment,
      query: {
        ...COMMON_PROPERTIES.query,
        description:
          "Free-text search query using Lucene syntax. " +
          "Examples: 'error', 'status:500 AND service.name:auth'",
      },
      timeRange: {
        ...COMMON_PROPERTIES.timeRange,
        description: "Time range to search within. Defaults to 1h if not specified.",
      },
      size: {
        ...COMMON_PROPERTIES.size,
        description: "Maximum number of results to return (default: 50, max: 200)",
      },
    },
    required: ["environment", "query"],
  },
};

/**
 * Tool for searching logs by OpenTelemetry trace ID.
 */
const searchByTrace: Tool = {
  name: "search_by_trace",
  description:
    "Search logs by OpenTelemetry trace ID to see all logs related to a specific request/transaction.",
  inputSchema: {
    type: "object" as const,
    properties: {
      environment: COMMON_PROPERTIES.environment,
      traceId: {
        type: "string" as const,
        description: "The OpenTelemetry trace ID to search for",
      },
      size: {
        ...COMMON_PROPERTIES.size,
        description: "Maximum number of results to return (default: 100)",
      },
    },
    required: ["environment", "traceId"],
  },
};

/**
 * Tool for searching logs by service name.
 */
const searchByService: Tool = {
  name: "search_by_service",
  description: "Search logs filtered by service name, optionally with additional filters.",
  inputSchema: {
    type: "object" as const,
    properties: {
      environment: COMMON_PROPERTIES.environment,
      serviceName: {
        type: "string" as const,
        description: "The service name to filter by",
      },
      level: {
        type: "string" as const,
        enum: ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"],
        description: "Log level to filter by",
      },
      query: {
        ...COMMON_PROPERTIES.query,
        description: "Additional free-text query to apply",
      },
      timeRange: COMMON_PROPERTIES.timeRange,
      size: {
        ...COMMON_PROPERTIES.size,
        description: "Maximum number of results to return (default: 50)",
      },
    },
    required: ["environment", "serviceName"],
  },
};

/**
 * Tool for searching error logs.
 */
const searchErrors: Tool = {
  name: "search_errors",
  description: "Search for error logs, optionally filtered by service or additional query.",
  inputSchema: {
    type: "object" as const,
    properties: {
      environment: COMMON_PROPERTIES.environment,
      serviceName: {
        type: "string" as const,
        description: "Optional service name to filter by",
      },
      query: {
        ...COMMON_PROPERTIES.query,
        description: "Additional free-text query to apply",
      },
      timeRange: {
        ...COMMON_PROPERTIES.timeRange,
        description: "Time range to search within (default: 1h)",
      },
      size: {
        ...COMMON_PROPERTIES.size,
        description: "Maximum number of results to return (default: 50)",
      },
    },
    required: ["environment"],
  },
};

/**
 * Tool for getting unique field values.
 */
const getFieldValues: Tool = {
  name: "get_field_values",
  description:
    "Get the most common values for a specific field. " +
    "Useful for discovering available services, log levels, or other field values.",
  inputSchema: {
    type: "object" as const,
    properties: {
      environment: COMMON_PROPERTIES.environment,
      field: {
        type: "string" as const,
        description:
          "The field to get values for. Examples: 'service.name', 'level', 'host.name'",
      },
      size: {
        ...COMMON_PROPERTIES.size,
        description: "Maximum number of unique values to return (default: 20)",
      },
    },
    required: ["environment", "field"],
  },
};

/**
 * Tool for searching by specific field and value.
 */
const searchByField: Tool = {
  name: "search_by_field",
  description: "Search logs by a specific field and value.",
  inputSchema: {
    type: "object" as const,
    properties: {
      environment: COMMON_PROPERTIES.environment,
      field: {
        type: "string" as const,
        description: "The field name to search. Examples: 'user_id', 'request_id', 'endpoint'",
      },
      value: {
        type: "string" as const,
        description: "The value to search for",
      },
      timeRange: COMMON_PROPERTIES.timeRange,
      size: {
        ...COMMON_PROPERTIES.size,
        description: "Maximum number of results to return (default: 50)",
      },
    },
    required: ["environment", "field", "value"],
  },
};

/**
 * Tool for getting index field mapping.
 */
const getMapping: Tool = {
  name: "get_mapping",
  description:
    "Get the field mapping for the index. " +
    "Useful for discovering available fields and their types.",
  inputSchema: {
    type: "object" as const,
    properties: {
      environment: COMMON_PROPERTIES.environment,
    },
    required: ["environment"],
  },
};

/**
 * Tool for getting a sample log entry.
 */
const getSampleLog: Tool = {
  name: "get_sample_log",
  description: "Get a single sample log entry to see the structure and available fields.",
  inputSchema: {
    type: "object" as const,
    properties: {
      environment: COMMON_PROPERTIES.environment,
    },
    required: ["environment"],
  },
};

/**
 * All available tools exported as an array.
 */
export const tools: Tool[] = [
  searchLogs,
  searchByTrace,
  searchByService,
  searchErrors,
  getFieldValues,
  searchByField,
  getMapping,
  getSampleLog,
];

/**
 * Tool names as a union type for type-safe handling.
 */
export type ToolName =
  | "search_logs"
  | "search_by_trace"
  | "search_by_service"
  | "search_errors"
  | "get_field_values"
  | "search_by_field"
  | "get_mapping"
  | "get_sample_log";

/**
 * Validates if a string is a valid tool name.
 *
 * @param name - Tool name to validate
 * @returns True if the name is a valid tool
 */
export function isValidToolName(name: string): name is ToolName {
  return tools.some((tool) => tool.name === name);
}
