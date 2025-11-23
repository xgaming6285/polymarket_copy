// Advanced Polymarket API utilities
// These functions provide additional features beyond basic event fetching

import { Event} from "./polymarket";

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";
const CLOB_API_BASE = "https://clob.polymarket.com";

// ============================================
// PRICE & TRADING DATA
// ============================================

export interface PriceHistory {
  t: number; // timestamp
  p: number; // price
}

export interface OrderBookSummary {
  market: string;
  asset_id: string;
  bids: Array<{
    price: string;
    size: string;
  }>;
  asks: Array<{
    price: string;
    size: string;
  }>;
  timestamp: number;
}

export interface SpreadData {
  market: string;
  spread: string;
  bid: string;
  ask: string;
}

/**
 * Get price history for a specific token
 */
export async function fetchPriceHistory(
  tokenId: string,
  params?: {
    interval?: "1m" | "5m" | "1h" | "1d";
    fidelity?: number;
    startTs?: number;
    endTs?: number;
  }
): Promise<PriceHistory[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.interval) queryParams.append("interval", params.interval);
  if (params?.fidelity) queryParams.append("fidelity", params.fidelity.toString());
  
  if (params?.startTs) {
    queryParams.append("startTs", params.startTs.toString());
  } else {
    // Default to 30 days ago if not provided, to ensure we get data
    const defaultStartTs = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    queryParams.append("startTs", defaultStartTs.toString());
  }

  if (params?.endTs) {
    queryParams.append("endTs", params.endTs.toString());
  }

  // API expects 'market' parameter for the token ID
  const url = `${CLOB_API_BASE}/prices-history?market=${tokenId}&${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch price history: ${response.status}`);
    }

    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error("Error fetching price history:", error);
    throw error;
  }
}

/**
 * Get order book summary for a specific token
 */
export async function fetchOrderBook(tokenId: string): Promise<OrderBookSummary> {
  const url = `${CLOB_API_BASE}/book?token_id=${tokenId}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return empty book for 404 (no book exists)
        return {
          market: "",
          asset_id: tokenId,
          bids: [],
          asks: [],
          timestamp: Date.now()
        };
      }
      throw new Error(`Failed to fetch order book: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Don't log 404s as errors
    if (error instanceof Error && error.message.includes("404")) {
      throw error;
    }
    console.error("Error fetching order book:", error);
    throw error;
  }
}

/**
 * Get bid-ask spreads for multiple markets
 */
export async function fetchSpreads(tokenIds: string[]): Promise<SpreadData[]> {
  const url = `${CLOB_API_BASE}/spreads`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_ids: tokenIds }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch spreads: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching spreads:", error);
    throw error;
  }
}

// ============================================
// SERIES & RELATED EVENTS
// ============================================

export interface Series {
  id: string;
  slug: string;
  title: string;
  description?: string;
  events?: Event[];
}

/**
 * Get all series
 */
export async function fetchSeries(): Promise<Series[]> {
  const url = `${GAMMA_API_BASE}/series`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch series: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching series:", error);
    throw error;
  }
}

/**
 * Get a specific series by ID
 */
export async function fetchSeriesById(seriesId: string): Promise<Series> {
  const url = `${GAMMA_API_BASE}/series/${seriesId}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch series: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching series:", error);
    throw error;
  }
}

// ============================================
// USER & TRADING DATA (requires addresses)
// ============================================

export interface UserPosition {
  market: string;
  asset_id: string;
  outcome: string;
  size: string;
  value: string;
}

export interface Trade {
  id: string;
  market: string;
  asset_id: string;
  side: "BUY" | "SELL";
  size: string;
  price: string;
  timestamp: number;
  trader_address?: string;
}

/**
 * Get current positions for a user
 */
export async function fetchUserPositions(address: string): Promise<UserPosition[]> {
  const url = `${GAMMA_API_BASE}/positions?user=${address}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch positions: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
}

/**
 * Get trades for a user or market
 */
export async function fetchTrades(params: {
  user?: string;
  market?: string;
  limit?: number;
  offset?: number;
}): Promise<Trade[]> {
  const queryParams = new URLSearchParams();
  
  if (params.user) queryParams.append("user", params.user);
  if (params.market) queryParams.append("market", params.market);
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.offset) queryParams.append("offset", params.offset.toString());

  const url = `${GAMMA_API_BASE}/trades?${queryParams.toString()}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trades: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching trades:", error);
    throw error;
  }
}

/**
 * Get top holders for a market
 */
export async function fetchTopHolders(marketId: string): Promise<Array<{
  address: string;
  size: string;
  outcome: string;
}>> {
  const url = `${GAMMA_API_BASE}/top-holders?market=${marketId}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top holders: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching top holders:", error);
    throw error;
  }
}

// ============================================
// SPORTS DATA
// ============================================

export interface Team {
  id: string;
  name: string;
  abbreviation?: string;
  logo?: string;
}

/**
 * Get list of sports teams
 */
export async function fetchTeams(): Promise<Team[]> {
  const url = `${GAMMA_API_BASE}/sports/teams`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch teams: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw error;
  }
}

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * Get open interest for a market
 */
export async function fetchOpenInterest(marketId: string): Promise<{
  market: string;
  open_interest: string;
}> {
  const url = `${GAMMA_API_BASE}/open-interest?market=${marketId}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch open interest: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching open interest:", error);
    throw error;
  }
}

/**
 * Get live volume for an event
 */
export async function fetchLiveVolume(eventId: string): Promise<{
  event: string;
  volume_24h: string;
  volume_total: string;
}> {
  const url = `${GAMMA_API_BASE}/live-volume?event=${eventId}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch live volume: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching live volume:", error);
    throw error;
  }
}

// ============================================
// WEBSOCKET UTILITIES (for real-time updates)
// ============================================

export interface WebSocketMessage {
  type: "price_update" | "trade" | "order_book_update";
  data: unknown;
}

/**
 * Create a WebSocket connection for real-time updates
 * Note: This returns a WebSocket instance that needs to be managed
 */
export function createWebSocket(
  tokenIds: string[],
  onMessage: (message: WebSocketMessage) => void
): WebSocket | null {
  if (typeof window === "undefined") {
    console.warn("WebSocket can only be created in browser environment");
    return null;
  }

  try {
    const ws = new WebSocket("wss://ws-subscriptions-clob.polymarket.com/ws/market");
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      // Subscribe to markets
      ws.send(JSON.stringify({
        type: "subscribe",
        markets: tokenIds,
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
    
    return ws;
  } catch (error) {
    console.error("Failed to create WebSocket:", error);
    return null;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate implied probability from price
 */
export function priceToPercentage(price: string | number): number {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return Math.round(numPrice * 100);
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatNumber(num: number | string): string {
  const value = typeof num === "string" ? parseFloat(num) : num;
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Calculate percentage change
 */
export function calculateChange(oldPrice: number, newPrice: number): {
  percentage: number;
  direction: "up" | "down" | "neutral";
} {
  const change = ((newPrice - oldPrice) / oldPrice) * 100;
  
  return {
    percentage: Math.abs(change),
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

