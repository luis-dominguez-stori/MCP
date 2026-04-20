/**
 * @fileoverview Type definitions for the OpenSearch Logs MCP server.
 * Contains all interfaces, types, and enums used across the application.
 */

// =============================================================================
// Environment Types
// =============================================================================

/**
 * Supported platform identifiers.
 */
export type Platform = "ios" | "android";

/**
 * Supported environment identifiers.
 * - `dev` / `prod`: iOS environments (default, backward compatible)
 * - `android-dev` / `android-prod`: Android environments
 */
export type Environment = "dev" | "prod" | "android-dev" | "android-prod";

/**
 * Configuration for a specific OpenSearch environment.
 */
export interface EnvironmentConfig {
  /** Base URL for the OpenSearch cluster */
  readonly baseUrl: string;
  /** Index pattern for log queries (supports wildcards) */
  readonly index: string;
}

/**
 * Credentials required to authenticate with OpenSearch.
 */
export interface Credentials {
  readonly username: string;
  readonly password: string;
}

// =============================================================================
// Search Types
// =============================================================================

/**
 * Supported time range options for log queries.
 */
export type TimeRange = "15m" | "1h" | "6h" | "24h" | "7d";

/**
 * Parameters for searching logs in OpenSearch.
 */
export interface SearchParams {
  /** Target environment */
  environment: Environment;
  /** Free-text query using Lucene syntax */
  query?: string;
  /** Specific field to match */
  field?: string;
  /** Value for the specified field */
  value?: string;
  /** OpenTelemetry trace ID for distributed tracing */
  traceId?: string;
  /** OpenTelemetry span ID */
  spanId?: string;
  /** Service name filter */
  serviceName?: string;
  /** Log level filter (DEBUG, INFO, WARN, ERROR, FATAL) */
  level?: string;
  /** Minimum severity number for filtering (e.g., 17 for ERROR) */
  minSeverity?: number;
  /** Time range for the query */
  timeRange?: TimeRange;
  /** Maximum number of results to return */
  size?: number;
}

/**
 * Parameters for field aggregation queries.
 */
export interface FieldValuesParams {
  /** Target environment */
  environment: Environment;
  /** Field name to aggregate */
  field: string;
  /** Maximum number of unique values to return */
  size?: number;
}

// =============================================================================
// OpenSearch Response Types
// =============================================================================

/**
 * Represents a single document hit from OpenSearch.
 */
export interface OpenSearchHit {
  /** Index containing the document */
  _index: string;
  /** Unique document identifier */
  _id: string;
  /** Relevance score */
  _score: number;
  /** Document source data */
  _source: Record<string, unknown>;
}

/**
 * OpenSearch search response structure.
 */
export interface OpenSearchResponse {
  hits: {
    total: { value: number };
    hits: OpenSearchHit[];
  };
  aggregations?: {
    field_values?: {
      buckets: Array<{ key: string; doc_count: number }>;
    };
  };
}

/**
 * Formatted search result returned to the client.
 */
export interface SearchResult {
  /** Total number of matching documents */
  total: number;
  /** Number of documents returned in this response */
  returned: number;
  /** Array of log entries */
  results: Array<{
    id: string;
    index: string;
    [key: string]: unknown;
  }>;
}

/**
 * Formatted field values result.
 */
export interface FieldValuesResult {
  /** Field name that was aggregated */
  field: string;
  /** Unique values and their counts */
  values: Array<{
    value: string;
    count: number;
  }>;
}

/**
 * Index mapping result.
 */
export interface MappingResult {
  /** Index name */
  index: string;
  /** List of fields with their types */
  fields: string[];
}

// =============================================================================
// Query Builder Types
// =============================================================================

/**
 * OpenSearch query clause.
 */
export type QueryClause = Record<string, unknown>;

/**
 * Complete OpenSearch query object.
 */
export interface OpenSearchQuery {
  bool?: {
    must: QueryClause[];
  };
  match_all?: Record<string, never>;
}

// =============================================================================
// Tool Handler Types
// =============================================================================

/**
 * Arguments for the search_logs tool.
 */
export interface SearchLogsArgs {
  environment: Environment;
  query: string;
  timeRange?: TimeRange;
  size?: number;
}

/**
 * Arguments for the search_by_trace tool.
 */
export interface SearchByTraceArgs {
  environment: Environment;
  traceId: string;
  size?: number;
}

/**
 * Arguments for the search_by_service tool.
 */
export interface SearchByServiceArgs {
  environment: Environment;
  serviceName: string;
  level?: string;
  query?: string;
  timeRange?: TimeRange;
  size?: number;
}

/**
 * Arguments for the search_errors tool.
 */
export interface SearchErrorsArgs {
  environment: Environment;
  serviceName?: string;
  query?: string;
  timeRange?: TimeRange;
  size?: number;
}

/**
 * Arguments for the get_field_values tool.
 */
export interface GetFieldValuesArgs {
  environment: Environment;
  field: string;
  size?: number;
}

/**
 * Arguments for the search_by_field tool.
 */
export interface SearchByFieldArgs {
  environment: Environment;
  field: string;
  value: string;
  timeRange?: TimeRange;
  size?: number;
}

/**
 * Arguments for environment-only tools (get_mapping, get_sample_log).
 */
export interface EnvironmentOnlyArgs {
  environment: Environment;
}
