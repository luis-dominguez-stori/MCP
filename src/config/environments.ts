/**
 * @fileoverview Environment configuration for OpenSearch clusters.
 * Defines connection settings for each supported environment.
 */

import type { Environment, EnvironmentConfig, Credentials } from "../types/index.js";

/**
 * OpenSearch environment configurations.
 * Maps environment identifiers to their respective connection settings.
 *
 * Index patterns:
 * - iOS: logs-stori-ios-{env}-*
 * - Android: logs-stori-app-{env}-*
 */
export const ENVIRONMENTS: Readonly<Record<Environment, EnvironmentConfig>> = {
  // iOS environments (default)
  dev: {
    baseUrl: "https://opensearch-dev.storicardsvc.com",
    index: "logs-stori-ios-dev-*",
  },
  prod: {
    baseUrl: "https://opensearch-prod.storicardsvc.com",
    index: "logs-stori-ios-prod-*",
  },
  // Android environments
  "android-dev": {
    baseUrl: "https://opensearch-dev.storicardsvc.com",
    index: "logs-stori-app-dev-*",
  },
  "android-prod": {
    baseUrl: "https://opensearch-prod.storicardsvc.com",
    index: "logs-stori-app-prod-*",
  },
} as const;

/**
 * Maps environment identifiers to their credential prefix.
 * Android environments share credentials with their iOS counterparts.
 */
const CREDENTIAL_PREFIX_MAP: Record<Environment, string> = {
  dev: "DEV",
  prod: "PROD",
  "android-dev": "DEV",
  "android-prod": "PROD",
};

/**
 * Retrieves credentials for the specified environment from environment variables.
 *
 * Environment variables follow the pattern:
 * - `OPENSEARCH_{ENV}_USERNAME`: Username for authentication
 * - `OPENSEARCH_{ENV}_PASSWORD`: Password for authentication
 *
 * Note: Android environments use the same credentials as their iOS counterparts
 * (android-dev uses DEV credentials, android-prod uses PROD credentials).
 *
 * @param environment - The target environment
 * @returns Credentials object containing username and password
 * @throws Error if required environment variables are not set
 *
 * @example
 * ```typescript
 * const creds = getCredentials("prod");
 * // Reads OPENSEARCH_PROD_USERNAME and OPENSEARCH_PROD_PASSWORD
 *
 * const androidCreds = getCredentials("android-prod");
 * // Also reads OPENSEARCH_PROD_USERNAME and OPENSEARCH_PROD_PASSWORD
 * ```
 */
export function getCredentials(environment: Environment): Credentials {
  const envPrefix = CREDENTIAL_PREFIX_MAP[environment];
  const usernameKey = `OPENSEARCH_${envPrefix}_USERNAME`;
  const passwordKey = `OPENSEARCH_${envPrefix}_PASSWORD`;

  const username = process.env[usernameKey];
  const password = process.env[passwordKey];

  if (!username || !password) {
    throw new Error(
      `Missing credentials for ${environment} environment. ` +
        `Please set ${usernameKey} and ${passwordKey} environment variables.`
    );
  }

  return { username, password };
}

/**
 * Gets the environment configuration for the specified environment.
 *
 * @param environment - The target environment
 * @returns Environment configuration object
 */
export function getEnvironmentConfig(environment: Environment): EnvironmentConfig {
  return ENVIRONMENTS[environment];
}

/**
 * All valid environment identifiers.
 */
const VALID_ENVIRONMENTS: readonly Environment[] = [
  "dev",
  "prod",
  "android-dev",
  "android-prod",
];

/**
 * Validates that an environment string is a valid Environment type.
 *
 * @param value - String to validate
 * @returns True if the value is a valid environment
 */
export function isValidEnvironment(value: string): value is Environment {
  return VALID_ENVIRONMENTS.includes(value as Environment);
}

/**
 * Gets all available environments.
 *
 * @returns Array of valid environment identifiers
 */
export function getAvailableEnvironments(): readonly Environment[] {
  return VALID_ENVIRONMENTS;
}
