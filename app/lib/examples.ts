/**
 * Example usage of Polymarket API
 * This file demonstrates how to use all the API functions
 * Copy and adapt these examples for your use cases
 */

import {
  fetchEvents,
  fetchEventById,
  fetchMarketPrices,
  fetchTags,
  searchMarkets,
  extractTokenIds,
  mapCategoryToTag,
  type Market,
  type Token,
  type PriceData,
} from "./polymarket";

import {
  fetchPriceHistory,
  fetchOrderBook,
  fetchSpreads,
  fetchSeriesById,
  fetchUserPositions,
  fetchTrades,
  fetchTopHolders,
  fetchTeams,
  fetchOpenInterest,
  fetchLiveVolume,
  createWebSocket,
  priceToPercentage,
  formatNumber,
  calculateChange,
} from "./polymarket-advanced";

// ============================================
// BASIC EXAMPLES
// ============================================

/**
 * Example 1: Fetch trending events
 */
export async function getTrendingEvents() {
  const events = await fetchEvents({
    active: true,
    order: "volume",
    limit: 10,
  });

  console.log(`Found ${events.length} trending events`);
  events.forEach((event) => {
    console.log(`- ${event.title} (Volume: ${event.volume})`);
  });

  return events;
}

/**
 * Example 2: Fetch events by category
 */
export async function getEventsByCategory(category: string) {
  // Map category name to tag slug
  const tagSlug = mapCategoryToTag(category);

  const events = await fetchEvents({
    active: true,
    tag: tagSlug,
    order: "volume",
    limit: 20,
  });

  console.log(`Found ${events.length} ${category} events`);
  return events;
}

/**
 * Example 3: Search for specific events
 */
export async function searchForEvents(query: string) {
  const results = await searchMarkets(query);

  console.log(`Search results for "${query}":`);
  console.log(`- ${results.events.length} events`);
  console.log(`- ${results.markets.length} markets`);

  return results;
}

/**
 * Example 4: Get event details with prices
 */
export async function getEventWithPrices(eventId: string) {
  // Fetch the event
  const event = await fetchEventById(eventId);

  // Extract token IDs from markets
  const tokenIds = extractTokenIds([event]);

  // Fetch current prices
  const prices = await fetchMarketPrices(tokenIds);

  console.log(`Event: ${event.title}`);
  event.markets?.forEach((market, idx) => {
    console.log(`Market ${idx + 1}: ${market.question}`);
    market.tokens.forEach((token) => {
      const priceData = prices.find((p) => p.token_id === token.token_id);
      if (priceData) {
        const percentage = priceToPercentage(priceData.price);
        console.log(`  ${token.outcome}: ${percentage}%`);
      }
    });
  });

  return { event, prices };
}

/**
 * Example 5: Get all available tags/categories
 */
export async function getAllCategories() {
  const tags = await fetchTags();

  console.log(`Found ${tags.length} tags:`);
  tags.slice(0, 20).forEach((tag) => {
    console.log(`- ${tag.label} (${tag.slug})`);
  });

  return tags;
}

// ============================================
// ADVANCED EXAMPLES
// ============================================

/**
 * Example 6: Get price history for a market
 */
export async function getMarketPriceHistory(
  tokenId: string,
  interval: "1h" | "1d" = "1h"
) {
  const history = await fetchPriceHistory(tokenId, {
    interval,
    fidelity: 50,
  });

  if (history.length > 0) {
    const latest = history[history.length - 1];
    const oldest = history[0];
    const change = calculateChange(oldest.p, latest.p);

    console.log(`Price history for token ${tokenId}:`);
    console.log(`- Latest: ${(latest.p * 100).toFixed(1)}%`);
    console.log(
      `- Change: ${
        change.direction === "up" ? "+" : "-"
      }${change.percentage.toFixed(2)}%`
    );
  }

  return history;
}

/**
 * Example 7: Analyze market depth (order book)
 */
export async function analyzeMarketDepth(tokenId: string) {
  const orderBook = await fetchOrderBook(tokenId);

  const totalBidSize = orderBook.bids.reduce(
    (sum, bid) => sum + parseFloat(bid.size),
    0
  );
  const totalAskSize = orderBook.asks.reduce(
    (sum, ask) => sum + parseFloat(ask.size),
    0
  );

  console.log(`Order Book Analysis for ${orderBook.asset_id}:`);
  console.log(`- Total Bid Size: ${formatNumber(totalBidSize)}`);
  console.log(`- Total Ask Size: ${formatNumber(totalAskSize)}`);
  console.log(`- Best Bid: ${orderBook.bids[0]?.price || "N/A"}`);
  console.log(`- Best Ask: ${orderBook.asks[0]?.price || "N/A"}`);

  return orderBook;
}

/**
 * Example 8: Get spreads for multiple markets
 */
export async function compareMarketSpreads(tokenIds: string[]) {
  const spreads = await fetchSpreads(tokenIds);

  console.log("Market Spreads Comparison:");
  spreads.forEach((spread) => {
    const spreadPercent = (parseFloat(spread.spread) * 100).toFixed(2);
    console.log(`- Market ${spread.market}: ${spreadPercent}% spread`);
    console.log(`  Bid: ${spread.bid}, Ask: ${spread.ask}`);
  });

  return spreads;
}

/**
 * Example 9: Get event series (related markets)
 */
export async function getRelatedMarkets(seriesId: string) {
  const series = await fetchSeriesById(seriesId);

  console.log(`Series: ${series.title}`);
  console.log(`Events: ${series.events?.length || 0}`);

  series.events?.forEach((event) => {
    console.log(`- ${event.title}`);
  });

  return series;
}

/**
 * Example 10: Track user portfolio (requires wallet address)
 */
export async function trackUserPortfolio(walletAddress: string) {
  const positions = await fetchUserPositions(walletAddress);

  console.log(`Portfolio for ${walletAddress}:`);
  console.log(`Total Positions: ${positions.length}`);

  let totalValue = 0;
  positions.forEach((position) => {
    const value = parseFloat(position.value);
    totalValue += value;
    console.log(`- ${position.outcome}: ${formatNumber(value)} USDC`);
  });

  console.log(`Total Portfolio Value: ${formatNumber(totalValue)} USDC`);

  return positions;
}

/**
 * Example 11: Analyze trading activity
 */
export async function analyzeTrading(marketId: string) {
  const trades = await fetchTrades({
    market: marketId,
    limit: 100,
  });

  const buyTrades = trades.filter((t) => t.side === "BUY");
  const sellTrades = trades.filter((t) => t.side === "SELL");

  const totalBuyVolume = buyTrades.reduce(
    (sum, t) => sum + parseFloat(t.size),
    0
  );
  const totalSellVolume = sellTrades.reduce(
    (sum, t) => sum + parseFloat(t.size),
    0
  );

  console.log(`Trading Analysis for Market ${marketId}:`);
  console.log(`- Total Trades: ${trades.length}`);
  console.log(
    `- Buy Trades: ${buyTrades.length} (${formatNumber(totalBuyVolume)} volume)`
  );
  console.log(
    `- Sell Trades: ${sellTrades.length} (${formatNumber(
      totalSellVolume
    )} volume)`
  );

  return trades;
}

/**
 * Example 12: Get market whale positions
 */
export async function getMarketWhales(marketId: string) {
  const topHolders = await fetchTopHolders(marketId);

  console.log(`Top Holders for Market ${marketId}:`);
  topHolders.forEach((holder, idx) => {
    console.log(
      `${idx + 1}. ${holder.address.slice(0, 10)}... - ${formatNumber(
        holder.size
      )} (${holder.outcome})`
    );
  });

  return topHolders;
}

/**
 * Example 13: Get sports markets
 */
export async function getSportsMarkets() {
  // Get all sports teams
  const teams = await fetchTeams();
  console.log(`Found ${teams.length} sports teams`);

  // Get sports events
  const sportsEvents = await fetchEvents({
    tag: "sports",
    active: true,
    order: "volume",
    limit: 20,
  });

  console.log(`Active Sports Markets: ${sportsEvents.length}`);
  sportsEvents.forEach((event) => {
    console.log(`- ${event.title}`);
  });

  return { teams, events: sportsEvents };
}

/**
 * Example 14: Monitor event statistics
 */
export async function monitorEventStats(eventId: string) {
  const [event, liveVolume] = await Promise.all([
    fetchEventById(eventId),
    fetchLiveVolume(eventId),
  ]);

  console.log(`Event Statistics for: ${event.title}`);
  console.log(`- 24h Volume: ${formatNumber(liveVolume.volume_24h)}`);
  console.log(`- Total Volume: ${formatNumber(liveVolume.volume_total)}`);
  console.log(`- Status: ${event.active ? "Active" : "Closed"}`);

  // Get open interest for each market
  if (event.markets && event.markets.length > 0) {
    const market = event.markets[0];
    try {
      const openInterest = await fetchOpenInterest(market.condition_id);
      console.log(
        `- Open Interest: ${formatNumber(openInterest.open_interest)}`
      );
    } catch {
      console.log("- Open Interest: Not available");
    }
  }

  return { event, stats: liveVolume };
}

/**
 * Example 15: Real-time price monitoring with WebSocket
 */
export function monitorPricesRealtime(tokenIds: string[]) {
  console.log(`Starting real-time monitoring for ${tokenIds.length} tokens...`);

  const ws = createWebSocket(tokenIds, (message) => {
    if (message.type === "price_update") {
      console.log("Price Update:", message.data);
    } else if (message.type === "trade") {
      console.log("New Trade:", message.data);
    } else if (message.type === "order_book_update") {
      console.log("Order Book Update:", message.data);
    }
  });

  // Return cleanup function
  return () => {
    console.log("Stopping real-time monitoring...");
    ws?.close();
  };
}

// ============================================
// COMPLETE WORKFLOW EXAMPLE
// ============================================

/**
 * Example 16: Complete analysis workflow
 * This combines multiple API calls to get a full market overview
 */
export async function completeMarketAnalysis(searchQuery: string) {
  console.log("=== COMPLETE MARKET ANALYSIS ===\n");

  // Step 1: Search for markets
  console.log("Step 1: Searching for markets...");
  const searchResults = await searchMarkets(searchQuery);

  if (searchResults.events.length === 0) {
    console.log("No events found!");
    return;
  }

  const event = searchResults.events[0];
  console.log(`\nAnalyzing: ${event.title}\n`);

  // Step 2: Get full event details
  console.log("Step 2: Fetching event details...");
  const fullEvent = await fetchEventById(event.id);

  // Step 3: Get current prices
  console.log("Step 3: Fetching current prices...");
  const tokenIds = extractTokenIds([fullEvent]);
  const prices = await fetchMarketPrices(tokenIds);

  // Step 4: Get market statistics
  console.log("Step 4: Analyzing market statistics...");
  const liveVolume = await fetchLiveVolume(event.id);

  // Step 5: Analyze first market in detail
  if (fullEvent.markets && fullEvent.markets.length > 0) {
    const market = fullEvent.markets[0];
    const tokenId = market.tokens[0]?.token_id;

    if (tokenId) {
      console.log("Step 5: Getting order book...");
      const orderBook = await fetchOrderBook(tokenId);

      console.log("Step 6: Getting price history...");
      const history = await fetchPriceHistory(tokenId, { interval: "1h" });

      // Print summary
      console.log("\n=== ANALYSIS SUMMARY ===");
      console.log(`Event: ${fullEvent.title}`);
      console.log(`Status: ${fullEvent.active ? "Active" : "Closed"}`);
      console.log(`24h Volume: $${formatNumber(liveVolume.volume_24h)}`);
      console.log(`Total Volume: $${formatNumber(liveVolume.volume_total)}`);
      console.log(`\nMarket: ${market.question}`);

      market.tokens.forEach((token) => {
        const price = prices.find((p) => p.token_id === token.token_id);
        if (price) {
          console.log(`- ${token.outcome}: ${priceToPercentage(price.price)}%`);
        }
      });

      console.log(`\nOrder Book Depth:`);
      console.log(`- Bids: ${orderBook.bids.length} orders`);
      console.log(`- Asks: ${orderBook.asks.length} orders`);

      if (history.length > 1) {
        const change = calculateChange(
          history[0].p,
          history[history.length - 1].p
        );
        console.log(`\nPrice Change (${history.length} data points):`);
        console.log(`- Direction: ${change.direction}`);
        console.log(`- Magnitude: ${change.percentage.toFixed(2)}%`);
      }
    }
  }

  return {
    event: fullEvent,
    prices,
    volume: liveVolume,
  };
}

// ============================================
// UTILITY EXAMPLES
// ============================================

/**
 * Example 17: Format and display market data nicely
 */
export function displayMarketSummary(market: Market, prices: PriceData[]) {
  console.log("\n" + "=".repeat(50));
  console.log(`MARKET: ${market.question || "N/A"}`);
  console.log("=".repeat(50));

  market.tokens?.forEach((token: Token) => {
    const priceData = prices.find((p) => p.token_id === token.token_id);
    if (priceData) {
      const percentage = priceToPercentage(priceData.price);
      const bar = "█".repeat(Math.floor(percentage / 2));
      console.log(`${token.outcome.padEnd(10)} ${bar} ${percentage}%`);
    }
  });

  if (market.volume) {
    console.log(`\nVolume: $${formatNumber(market.volume)}`);
  }

  if (market.liquidity) {
    console.log(`Liquidity: $${formatNumber(market.liquidity)}`);
  }

  console.log("=".repeat(50) + "\n");
}

// Export all for easy importing
export const examples = {
  basic: {
    getTrendingEvents,
    getEventsByCategory,
    searchForEvents,
    getEventWithPrices,
    getAllCategories,
  },
  advanced: {
    getMarketPriceHistory,
    analyzeMarketDepth,
    compareMarketSpreads,
    getRelatedMarkets,
    trackUserPortfolio,
    analyzeTrading,
    getMarketWhales,
    getSportsMarkets,
    monitorEventStats,
    monitorPricesRealtime,
  },
  complete: {
    completeMarketAnalysis,
  },
  utility: {
    displayMarketSummary,
  },
};
