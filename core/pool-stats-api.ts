/**
 * Complete TypeScript interface and client for the Taonado Pool Stats API
 * Route: /stats/note-interest/
 *
 * This file contains everything needed to interact with the pool stats API:
 * - Type definitions
 * - Client implementation
 * - Helper utilities
 * - Validation functions
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Available pool sizes for note interest tracking
export type PoolSize = "0.1" | "1" | "10" | "100" | "1000";

// Available networks
export type Network = "local" | "testnet" | "mainnet";

// Base API response structure
export interface BaseApiResponse {
  success: boolean;
}

// Error response structure
export interface ApiErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
}

// Response for GET /stats/note-interest/:poolSize
export interface PoolSizeInterestResponse extends BaseApiResponse {
  success: true;
  value: number;
  address: string;
}

// Individual pool intent data
export interface PoolIntent {
  poolSize: PoolSize;
  value: number;
}

// Response for GET /stats/note-interest/
export interface AllPoolIntentsResponse extends BaseApiResponse {
  success: true;
  poolIntents: PoolIntent[];
  network: Network;
}

// Union type for all possible responses
export type PoolStatsApiResponse =
  | PoolSizeInterestResponse
  | AllPoolIntentsResponse
  | ApiErrorResponse;

// Client interface for easier frontend integration
export interface PoolStatsApiClient {
  /**
   * Get interest count for a specific pool size
   * @param poolSize - The pool size to query
   * @param network - The network to query (defaults to 'mainnet')
   * @returns Promise resolving to pool size interest response
   */
  getPoolSizeInterest(
    poolSize: PoolSize,
    network?: Network
  ): Promise<PoolSizeInterestResponse>;
}

// Query parameters interface
export interface PoolStatsQueryParams {
  network?: Network;
}

// ============================================================================
// CONSTANTS AND VALIDATION
// ============================================================================

// Route path constants
export const POOL_STATS_ROUTES = {
  BASE: "/stats/note-interest",
  POOL_SIZE: (poolSize: PoolSize) => `/stats/note-interest/${poolSize}`,
} as const;

// Validation utilities
export const PoolStatsValidation = {
  isValidPoolSize: (poolSize: string): poolSize is PoolSize => {
    return ["0.1", "1", "10", "100", "1000"].includes(poolSize);
  },

  isValidNetwork: (network: string): network is Network => {
    return ["local", "testnet", "mainnet"].includes(network);
  },
} as const;

// ============================================================================
// CLIENT IMPLEMENTATION
// ============================================================================

export class TaonadoPoolStatsClient implements PoolStatsApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "https://api.taonado.cash") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Get interest count for a specific pool size
   */
  async getPoolSizeInterest(
    poolSize: PoolSize,
    network: Network = "mainnet"
  ): Promise<PoolSizeInterestResponse> {
    if (!PoolStatsValidation.isValidPoolSize(poolSize)) {
      throw new Error(`Invalid pool size: ${poolSize}`);
    }

    if (!PoolStatsValidation.isValidNetwork(network)) {
      throw new Error(`Invalid network: ${network}`);
    }

    const url = `${this.baseUrl}${POOL_STATS_ROUTES.POOL_SIZE(
      poolSize
    )}?network=${network}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      const errorData = data as ApiErrorResponse;
      throw new Error(`API Error: ${errorData.error}`);
    }

    return data as PoolSizeInterestResponse;
  }

  /**
   * Increment interest count for a specific pool size (triggers the POST behavior)
   * Note: This actually happens automatically when you GET a specific pool size
   */
  async incrementPoolSizeInterest(
    poolSize: PoolSize,
    network: Network = "mainnet"
  ): Promise<PoolSizeInterestResponse> {
    // The API increments the counter when you GET a specific pool size
    return this.getPoolSizeInterest(poolSize, network);
  }
}

// ============================================================================
// FACTORY AND HELPER FUNCTIONS
// ============================================================================

// Factory function for easier instantiation
export function createPoolStatsClient(
  baseUrl?: string
): TaonadoPoolStatsClient {
  return new TaonadoPoolStatsClient(baseUrl);
}
