/**
 * @fileoverview Log search service.
 * Business logic layer for searching and analyzing OpenSearch logs.
 */

import type {
  Environment,
  SearchParams,
  FieldValuesParams,
  SearchResult,
  FieldValuesResult,
  MappingResult,
  OpenSearchHit,
} from "../types/index.js";
import { OpenSearchClient, createOpenSearchClient } from "./opensearch-client.js";
import { buildQueryFromParams } from "../utils/query-builder.js";

/**
 * Default number of results to return.
 */
const DEFAULT_SIZE = 50;

/**
 * Maximum number of results allowed per query.
 */
const MAX_SIZE = 200;

/**
 * Default number of unique field values to return.
 */
const DEFAULT_FIELD_VALUES_SIZE = 20;

/**
 * Service for searching and analyzing logs in OpenSearch.
 *
 * Provides high-level methods for common log analysis tasks,
 * abstracting away the details of OpenSearch query construction.
 *
 * @example
 * ```typescript
 * const service = new LogSearchService("prod");
 * const results = await service.search({
 *   environment: "prod",
 *   query: "error",
 *   timeRange: "1h"
 * });
 * ```
 */
export class LogSearchService {
  private readonly client: OpenSearchClient;

  /**
   * Creates a new LogSearchService.
   *
   * @param environment - Target environment
   * @param client - Optional OpenSearch client (for testing)
   */
  constructor(
    private readonly environment: Environment,
    client?: OpenSearchClient
  ) {
    this.client = client ?? createOpenSearchClient(environment);
  }

  /**
   * Searches logs based on the provided parameters.
   *
   * @param params - Search parameters
   * @returns Formatted search results
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const query = buildQueryFromParams(params);
    const size = this.normalizeSize(params.size);

    const body = {
      query,
      size,
      sort: [{ time: { order: "desc" } }],
    };

    const response = await this.client.search(body);

    return {
      total: response.hits.total.value,
      returned: response.hits.hits.length,
      results: this.formatHits(response.hits.hits),
    };
  }

  /**
   * Gets the most common values for a specific field.
   *
   * @param params - Field values parameters
   * @returns Aggregated field values with counts
   */
  async getFieldValues(params: FieldValuesParams): Promise<FieldValuesResult> {
    const size = params.size ?? DEFAULT_FIELD_VALUES_SIZE;

    const body = {
      size: 0,
      aggs: {
        field_values: {
          terms: {
            field: params.field,
            size,
          },
        },
      },
    };

    const response = await this.client.search(body);
    const buckets = response.aggregations?.field_values?.buckets ?? [];

    return {
      field: params.field,
      values: buckets.map((bucket) => ({
        value: bucket.key,
        count: bucket.doc_count,
      })),
    };
  }

  /**
   * Gets the field mapping for the index.
   *
   * @returns Index mapping with field names and types
   */
  async getMapping(): Promise<MappingResult> {
    const indexName = this.client.getTodayIndexName();
    const rawMapping = await this.client.getMapping();

    const indexKey = Object.keys(rawMapping)[0];
    const properties =
      (rawMapping[indexKey] as Record<string, unknown>)?.mappings as
        | Record<string, unknown>
        | undefined;
    const props = (properties?.properties as Record<string, unknown>) ?? {};

    const fields = this.extractFields(props);

    return {
      index: indexName,
      fields: fields.sort(),
    };
  }

  /**
   * Gets a single sample log entry.
   *
   * @returns Single log entry for structure inspection
   */
  async getSampleLog(): Promise<Record<string, unknown>> {
    const body = {
      query: { match_all: {} },
      size: 1,
    };

    const response = await this.client.search(body);
    return response.hits.hits[0]?._source ?? {};
  }

  /**
   * Normalizes the size parameter to be within allowed bounds.
   */
  private normalizeSize(size?: number): number {
    if (size === undefined) return DEFAULT_SIZE;
    return Math.min(Math.max(1, size), MAX_SIZE);
  }

  /**
   * Formats OpenSearch hits into a cleaner structure.
   */
  private formatHits(hits: OpenSearchHit[]): SearchResult["results"] {
    return hits.map((hit) => ({
      id: hit._id,
      index: hit._index,
      ...hit._source,
    }));
  }

  /**
   * Recursively extracts field names and types from mapping properties.
   */
  private extractFields(
    obj: Record<string, unknown>,
    prefix: string = ""
  ): string[] {
    const fields: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        const v = value as Record<string, unknown>;

        if (v.type) {
          fields.push(`${fullPath} (${v.type})`);
        }

        if (v.properties) {
          fields.push(
            ...this.extractFields(v.properties as Record<string, unknown>, fullPath)
          );
        }
      }
    }

    return fields;
  }
}

/**
 * Factory function to create LogSearchService instances.
 *
 * @param environment - Target environment
 * @returns New LogSearchService instance
 */
export function createLogSearchService(environment: Environment): LogSearchService {
  return new LogSearchService(environment);
}
