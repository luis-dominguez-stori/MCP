/**
 * @fileoverview Query builder for constructing OpenSearch queries.
 * Implements the Builder pattern for creating complex search queries.
 */

import type { SearchParams, OpenSearchQuery, QueryClause, TimeRange } from "../types/index.js";
import { calculateTimeWindow } from "./time-range.js";

/**
 * OpenSearch field names used in queries.
 */
const FIELDS = {
  TRACE_ID: "trace_id",
  SPAN_ID: "span_id",
  SERVICE_NAME: "service.name",
  SEVERITY_TEXT: "severityText",
  SEVERITY_NUMBER: "severityNumber",
  TIMESTAMP: "time",
} as const;

/**
 * Builder class for constructing OpenSearch queries.
 *
 * Implements the Builder pattern to allow fluent construction of complex queries
 * while maintaining immutability of the resulting query object.
 *
 * @example
 * ```typescript
 * const query = new QueryBuilder()
 *   .withFreeTextQuery("error")
 *   .withServiceName("stori-ios")
 *   .withTimeRange("1h")
 *   .build();
 * ```
 */
export class QueryBuilder {
  private readonly clauses: QueryClause[] = [];

  /**
   * Adds a free-text query using Lucene query syntax.
   *
   * @param query - Lucene query string
   * @returns This builder instance for chaining
   */
  withFreeTextQuery(query: string): this {
    this.clauses.push({
      query_string: {
        query,
        default_operator: "AND",
      },
    });
    return this;
  }

  /**
   * Adds a field match clause.
   *
   * @param field - Field name to match
   * @param value - Value to match
   * @returns This builder instance for chaining
   */
  withFieldMatch(field: string, value: string): this {
    this.clauses.push({
      match: {
        [field]: value,
      },
    });
    return this;
  }

  /**
   * Adds a term exact match clause.
   *
   * @param field - Field name for exact match
   * @param value - Value to match exactly
   * @returns This builder instance for chaining
   */
  withTermMatch(field: string, value: string): this {
    this.clauses.push({
      term: {
        [field]: value,
      },
    });
    return this;
  }

  /**
   * Adds a trace ID filter for distributed tracing.
   *
   * @param traceId - OpenTelemetry trace ID
   * @returns This builder instance for chaining
   */
  withTraceId(traceId: string): this {
    return this.withTermMatch(FIELDS.TRACE_ID, traceId);
  }

  /**
   * Adds a span ID filter.
   *
   * @param spanId - OpenTelemetry span ID
   * @returns This builder instance for chaining
   */
  withSpanId(spanId: string): this {
    return this.withTermMatch(FIELDS.SPAN_ID, spanId);
  }

  /**
   * Adds a service name filter.
   *
   * @param serviceName - Service name to filter by
   * @returns This builder instance for chaining
   */
  withServiceName(serviceName: string): this {
    return this.withFieldMatch(FIELDS.SERVICE_NAME, serviceName);
  }

  /**
   * Adds a log level filter (severity text).
   *
   * @param level - Log level (DEBUG, INFO, WARN, ERROR, FATAL)
   * @returns This builder instance for chaining
   */
  withLogLevel(level: string): this {
    return this.withFieldMatch(FIELDS.SEVERITY_TEXT, level.toUpperCase());
  }

  /**
   * Adds a minimum severity filter using severity number.
   *
   * Severity levels:
   * - 1-4: TRACE
   * - 5-8: DEBUG
   * - 9-12: INFO
   * - 13-16: WARN
   * - 17-20: ERROR
   * - 21-24: FATAL
   *
   * @param minSeverity - Minimum severity number
   * @returns This builder instance for chaining
   */
  withMinSeverity(minSeverity: number): this {
    this.clauses.push({
      range: {
        [FIELDS.SEVERITY_NUMBER]: {
          gte: minSeverity,
        },
      },
    });
    return this;
  }

  /**
   * Adds a time range filter.
   *
   * @param timeRange - Human-readable time range
   * @returns This builder instance for chaining
   */
  withTimeRange(timeRange: TimeRange): this {
    const window = calculateTimeWindow(timeRange);
    this.clauses.push({
      range: {
        [FIELDS.TIMESTAMP]: window,
      },
    });
    return this;
  }

  /**
   * Builds the final OpenSearch query object.
   *
   * @returns OpenSearch query ready for use in search requests
   */
  build(): OpenSearchQuery {
    if (this.clauses.length === 0) {
      return { match_all: {} };
    }

    return {
      bool: {
        must: [...this.clauses],
      },
    };
  }
}

/**
 * Builds an OpenSearch query from SearchParams.
 *
 * This is a convenience function that uses QueryBuilder internally
 * to construct queries from the SearchParams interface.
 *
 * @param params - Search parameters
 * @returns OpenSearch query object
 */
export function buildQueryFromParams(params: SearchParams): OpenSearchQuery {
  const builder = new QueryBuilder();

  if (params.query) {
    builder.withFreeTextQuery(params.query);
  }

  if (params.field && params.value) {
    builder.withFieldMatch(params.field, params.value);
  }

  if (params.traceId) {
    builder.withTraceId(params.traceId);
  }

  if (params.spanId) {
    builder.withSpanId(params.spanId);
  }

  if (params.serviceName) {
    builder.withServiceName(params.serviceName);
  }

  if (params.level) {
    builder.withLogLevel(params.level);
  }

  if (params.minSeverity) {
    builder.withMinSeverity(params.minSeverity);
  }

  if (params.timeRange) {
    builder.withTimeRange(params.timeRange);
  }

  return builder.build();
}
