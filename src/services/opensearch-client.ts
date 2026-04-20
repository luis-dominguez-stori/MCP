/**
 * @fileoverview OpenSearch HTTP client.
 * Handles all HTTP communication with OpenSearch clusters.
 */

import type {
  Environment,
  Credentials,
  EnvironmentConfig,
  OpenSearchResponse,
} from "../types/index.js";
import { getCredentials, getEnvironmentConfig } from "../config/environments.js";

/**
 * HTTP methods supported by the client.
 */
type HttpMethod = "GET" | "POST";

/**
 * Request options for OpenSearch API calls.
 */
interface RequestOptions {
  /** HTTP method */
  method: HttpMethod;
  /** Request body (will be JSON serialized) */
  body?: unknown;
}

/**
 * Client for interacting with OpenSearch clusters.
 *
 * Handles authentication, request construction, and response parsing
 * for OpenSearch REST API calls.
 *
 * @example
 * ```typescript
 * const client = new OpenSearchClient("prod");
 * const response = await client.search({
 *   query: { match_all: {} },
 *   size: 10
 * });
 * ```
 */
export class OpenSearchClient {
  private readonly credentials: Credentials;
  private readonly config: EnvironmentConfig;
  private readonly authHeader: string;

  /**
   * Creates a new OpenSearch client for the specified environment.
   *
   * @param environment - Target environment (dev or prod)
   * @throws Error if credentials are not configured
   */
  constructor(private readonly environment: Environment) {
    this.credentials = getCredentials(environment);
    this.config = getEnvironmentConfig(environment);
    this.authHeader = this.buildAuthHeader();
  }

  /**
   * Executes a search query against the logs index.
   *
   * @param body - OpenSearch search request body
   * @returns OpenSearch search response
   * @throws Error if the request fails
   */
  async search(body: Record<string, unknown>): Promise<OpenSearchResponse> {
    const url = this.buildUrl(`${this.config.index}/_search`);
    return this.request<OpenSearchResponse>(url, { method: "POST", body });
  }

  /**
   * Retrieves the field mapping for the current index.
   *
   * @returns Raw mapping response from OpenSearch
   */
  async getMapping(): Promise<Record<string, unknown>> {
    const indexName = this.getTodayIndexName();
    const url = this.buildUrl(`${indexName}/_mapping`);
    return this.request<Record<string, unknown>>(url, { method: "GET" });
  }

  /**
   * Gets the index name for today's date.
   *
   * @returns Index name with today's date (e.g., logs-stori-ios-prod-2024.01.15)
   */
  getTodayIndexName(): string {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ".");
    return this.config.index.replace("*", today);
  }

  /**
   * Gets the wildcard index pattern.
   *
   * @returns Index pattern (e.g., logs-stori-ios-prod-*)
   */
  getIndexPattern(): string {
    return this.config.index;
  }

  /**
   * Builds the Basic Authentication header.
   */
  private buildAuthHeader(): string {
    const { username, password } = this.credentials;
    const encoded = Buffer.from(`${username}:${password}`).toString("base64");
    return `Basic ${encoded}`;
  }

  /**
   * Builds a full URL for the given endpoint.
   */
  private buildUrl(endpoint: string): string {
    return `${this.config.baseUrl}/${endpoint}`;
  }

  /**
   * Executes an HTTP request against OpenSearch.
   *
   * @param url - Full URL to request
   * @param options - Request options
   * @returns Parsed JSON response
   * @throws Error if the request fails or returns non-2xx status
   */
  private async request<T>(url: string, options: RequestOptions): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: this.authHeader,
    };

    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.body !== undefined) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new OpenSearchError(
        `OpenSearch request failed: ${response.status} - ${errorText}`,
        response.status,
        this.environment
      );
    }

    return (await response.json()) as T;
  }
}

/**
 * Custom error class for OpenSearch API errors.
 */
export class OpenSearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly environment: Environment
  ) {
    super(message);
    this.name = "OpenSearchError";
  }
}

/**
 * Factory function to create OpenSearch clients.
 * Useful for dependency injection and testing.
 *
 * @param environment - Target environment
 * @returns New OpenSearchClient instance
 */
export function createOpenSearchClient(environment: Environment): OpenSearchClient {
  return new OpenSearchClient(environment);
}
