/**
 * @fileoverview Time range utilities for log queries.
 * Provides functions to convert human-readable time ranges to ISO timestamps.
 */

import type { TimeRange } from "../types/index.js";

/**
 * Milliseconds per time unit.
 */
const TIME_UNITS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Mapping of time range strings to their duration in milliseconds.
 */
const TIME_RANGE_MS: Readonly<Record<TimeRange, number>> = {
  "15m": 15 * TIME_UNITS.MINUTE,
  "1h": 1 * TIME_UNITS.HOUR,
  "6h": 6 * TIME_UNITS.HOUR,
  "24h": 24 * TIME_UNITS.HOUR,
  "7d": 7 * TIME_UNITS.DAY,
} as const;

/**
 * Default time range when none is specified.
 */
export const DEFAULT_TIME_RANGE: TimeRange = "1h";

/**
 * Represents a time window with start and end timestamps.
 */
export interface TimeWindow {
  /** Start timestamp in ISO 8601 format */
  gte: string;
  /** End timestamp in ISO 8601 format */
  lte: string;
}

/**
 * Calculates the time window for a given time range.
 *
 * @param timeRange - Human-readable time range (e.g., "1h", "24h", "7d")
 * @param referenceTime - Reference time for calculations (defaults to now)
 * @returns TimeWindow object with ISO timestamps
 *
 * @example
 * ```typescript
 * const window = calculateTimeWindow("1h");
 * // { gte: "2024-01-15T09:00:00.000Z", lte: "2024-01-15T10:00:00.000Z" }
 * ```
 */
export function calculateTimeWindow(
  timeRange: TimeRange,
  referenceTime: Date = new Date()
): TimeWindow {
  const durationMs = TIME_RANGE_MS[timeRange] ?? TIME_RANGE_MS[DEFAULT_TIME_RANGE];
  const startTime = new Date(referenceTime.getTime() - durationMs);

  return {
    gte: startTime.toISOString(),
    lte: referenceTime.toISOString(),
  };
}

/**
 * Validates if a string is a valid time range.
 *
 * @param value - String to validate
 * @returns True if the value is a valid TimeRange
 */
export function isValidTimeRange(value: string): value is TimeRange {
  return value in TIME_RANGE_MS;
}

/**
 * Gets all supported time range values.
 *
 * @returns Array of valid time range strings
 */
export function getSupportedTimeRanges(): TimeRange[] {
  return Object.keys(TIME_RANGE_MS) as TimeRange[];
}
