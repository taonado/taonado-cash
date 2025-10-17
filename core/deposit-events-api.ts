/**
 * Simple TypeScript interface and client for the Taonado Deposit Events API
 * Route: /deposit-events/
 *
 * This file contains everything needed to interact with the deposit events API
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Deposit event data structure
export interface DepositEvent {
  commitment: string;
  leafIndex: number;
  timestamp: number;
  user: string;
  blockNumber: number;
  transactionHash: string;
}

// Response for GET /deposit-events/
export interface DepositEventsResponse {
  success: true;
  depositEvents: DepositEvent[];
}

// Client interface for easier frontend integration
export interface DepositEventsApiClient {
  /**
   * Get all deposit events
   * @returns Promise resolving to deposit events response
   */
  getAllDepositEvents(): Promise<DepositEventsResponse>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Route path constants
export const DEPOSIT_EVENTS_ROUTES = {
  ALL: "/deposit-events/",
} as const;

// ============================================================================
// CLIENT IMPLEMENTATION
// ============================================================================

export class TaonadoDepositEventsClient implements DepositEventsApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "https://api.taonado.cash") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Get all deposit events
   */
  async getAllDepositEvents(): Promise<DepositEventsResponse> {
    const url = `${this.baseUrl}${DEPOSIT_EVENTS_ROUTES.ALL}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      throw new Error(`API Error: ${data.error || "Unknown error"}`);
    }

    return data as DepositEventsResponse;
  }
}

// ============================================================================
// FACTORY AND HELPER FUNCTIONS
// ============================================================================

// Factory function for easier instantiation
export function createDepositEventsClient(
  baseUrl?: string
): TaonadoDepositEventsClient {
  return new TaonadoDepositEventsClient(baseUrl);
}

// Example usage and helper functions
export const DepositEventsHelpers = {
  /**
   * Format timestamp for display
   */
  formatTimestamp: (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  },

  /**
   * Format user address for display (truncated)
   */
  formatAddress: (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  /**
   * Get total deposit count from events
   */
  getTotalDepositCount: (events: DepositEvent[]): number => {
    return events.length;
  },

  /**
   * Get unique users from events
   */
  getUniqueUsers: (events: DepositEvent[]): string[] => {
    return [...new Set(events.map((event) => event.user))];
  },

  /**
   * Get events within time range
   */
  getEventsInTimeRange: (
    events: DepositEvent[],
    fromTimestamp: number,
    toTimestamp: number
  ): DepositEvent[] => {
    return events.filter(
      (event) =>
        event.timestamp >= fromTimestamp && event.timestamp <= toTimestamp
    );
  },

  /**
   * Get events for specific user
   */
  getEventsForUser: (
    events: DepositEvent[],
    userAddress: string
  ): DepositEvent[] => {
    return events.filter(
      (event) => event.user.toLowerCase() === userAddress.toLowerCase()
    );
  },

  /**
   * Sort events by timestamp (most recent first)
   */
  sortByTimestamp: (
    events: DepositEvent[],
    ascending: boolean = false
  ): DepositEvent[] => {
    return [...events].sort((a, b) =>
      ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
    );
  },
} as const;

// ============================================================================
// USAGE EXAMPLES (for documentation)
// ============================================================================

/**
 * Basic usage example:
 *
 * ```typescript
 * import { createDepositEventsClient, DepositEventsHelpers } from './deposit-events-api';
 *
 * // Create client
 * const client = createDepositEventsClient('https://api.taonado.cash');
 *
 * // Get all deposit events
 * const response = await client.getAllDepositEvents();
 * console.log(`Found ${response.depositEvents.length} deposits`);
 *
 * // Use helper functions
 * const uniqueUsers = DepositEventsHelpers.getUniqueUsers(response.depositEvents);
 * const recentEvents = DepositEventsHelpers.sortByTimestamp(response.depositEvents);
 * ```
 */
