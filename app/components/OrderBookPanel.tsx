"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface Order {
  price: string;
  size: string;
}

interface OrderBookData {
  asks: Order[];
  bids: Order[];
}

interface PriceHistoryPoint {
  t: number; // timestamp in seconds
  p: number; // price (0-1)
}

type TimePeriod = "1H" | "6H" | "1D" | "1W" | "1M" | "ALL";

interface OrderBookPanelProps {
  yesTokenId: string;
  noTokenId: string;
  outcomeTitle: string;
  selectedSide: "Yes" | "No";
}

interface ProcessedOrder {
  price: number;
  shares: number;
  total: number;
  cumulativeShares: number;
}

export default function OrderBookPanel({
  yesTokenId,
  noTokenId,
  // outcomeTitle - reserved for future use
  selectedSide,
}: OrderBookPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "orderbook" | "graph" | "resolution"
  >("orderbook");
  const [yesOrderBook, setYesOrderBook] = useState<OrderBookData | null>(null);
  const [noOrderBook, setNoOrderBook] = useState<OrderBookData | null>(null);
  const [tradeSide, setTradeSide] = useState<"Yes" | "No">(selectedSide);

  // Price history state
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("ALL");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Calculate Y-axis domain based on price history data (auto-scale with nice round ticks)
  const yAxisConfig = useMemo(() => {
    if (priceHistory.length === 0) {
      return {
        domain: [0, 1] as [number, number],
        ticks: [0.2, 0.4, 0.6, 0.8],
      };
    }

    const prices = priceHistory.map((p) => p.p);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Round min down and max up to nearest 20% (0.2) for nice tick values
    const tickInterval = 0.2; // 20% intervals
    let yMin = Math.floor(minPrice / tickInterval) * tickInterval;
    let yMax = Math.ceil(maxPrice / tickInterval) * tickInterval;

    // Add a bit of padding if data is exactly at boundaries
    if (minPrice === yMin) yMin = Math.max(0, yMin - tickInterval);
    if (maxPrice === yMax) yMax = Math.min(1, yMax + tickInterval);

    // Ensure we have valid bounds
    yMin = Math.max(0, yMin);
    yMax = Math.min(1, yMax);

    // Generate nice round tick values at 20% intervals (exclude min and max)
    const ticks: number[] = [];
    for (let tick = yMin + tickInterval; tick < yMax; tick += tickInterval) {
      // Round to avoid floating point issues
      ticks.push(Math.round(tick * 100) / 100);
    }

    return { domain: [yMin, yMax] as [number, number], ticks };
  }, [priceHistory]);

  // Sync with parent's selectedSide
  useEffect(() => {
    setTradeSide(selectedSide);
  }, [selectedSide]);

  // Get fidelity (data granularity) for price history based on period
  const getTimeRange = useCallback((period: TimePeriod) => {
    // Fidelity controls data granularity (minutes between points)
    const fidelityMap: Record<TimePeriod, number> = {
      "1H": 1,
      "6H": 5,
      "1D": 30,
      "1W": 60,
      "1M": 360,
      ALL: 1440,
    };

    return { fidelity: fidelityMap[period] };
  }, []);

  // Fetch price history
  const fetchPriceHistory = useCallback(async () => {
    const tokenId = tradeSide === "Yes" ? yesTokenId : noTokenId;
    if (!tokenId) return;

    setIsLoadingHistory(true);
    try {
      const { fidelity } = getTimeRange(timePeriod);

      // Map time period to interval parameter for the API
      const intervalMap: Record<TimePeriod, string> = {
        "1H": "1h",
        "6H": "6h",
        "1D": "1d",
        "1W": "1w",
        "1M": "1m",
        ALL: "all",
      };

      const params = new URLSearchParams({
        market: tokenId,
        interval: intervalMap[timePeriod],
        fidelity: fidelity.toString(),
      });

      const response = await fetch(`/api/history?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.history) {
          setPriceHistory(data.history);
        }
      }
    } catch (err) {
      console.error("Error fetching price history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [yesTokenId, noTokenId, tradeSide, timePeriod, getTimeRange]);

  // Fetch price history when tab changes to graph or when tradeSide/timePeriod changes
  useEffect(() => {
    if (activeTab === "graph") {
      fetchPriceHistory();
    }
  }, [activeTab, tradeSide, timePeriod, fetchPriceHistory]);

  const fetchOrderBooks = useCallback(async () => {
    if (!yesTokenId) return;

    try {
      const yesPromise = fetch(`/api/orderbook?tokenId=${yesTokenId}`).then(
        (res) => res.json()
      );
      const noPromise = noTokenId
        ? fetch(`/api/orderbook?tokenId=${noTokenId}`).then((res) => res.json())
        : Promise.resolve(null);

      const [yesData, noData] = await Promise.all([yesPromise, noPromise]);

      if (yesData && !yesData.error) {
        // Sort asks ascending, bids descending
        if (yesData.asks) {
          yesData.asks.sort(
            (a: Order, b: Order) => parseFloat(a.price) - parseFloat(b.price)
          );
        }
        if (yesData.bids) {
          yesData.bids.sort(
            (a: Order, b: Order) => parseFloat(b.price) - parseFloat(a.price)
          );
        }
        setYesOrderBook(yesData);
      }

      if (noData && !noData.error) {
        if (noData.asks) {
          noData.asks.sort(
            (a: Order, b: Order) => parseFloat(a.price) - parseFloat(b.price)
          );
        }
        if (noData.bids) {
          noData.bids.sort(
            (a: Order, b: Order) => parseFloat(b.price) - parseFloat(a.price)
          );
        }
        setNoOrderBook(noData);
      }
    } catch (err) {
      console.error("Error fetching order books:", err);
    }
  }, [yesTokenId, noTokenId]);

  useEffect(() => {
    fetchOrderBooks();
    const interval = setInterval(fetchOrderBooks, 5000);
    return () => clearInterval(interval);
  }, [fetchOrderBooks]);

  // Get current order book based on selected side
  const currentOrderBook = tradeSide === "Yes" ? yesOrderBook : noOrderBook;

  // Process asks (sell orders) - sorted ascending, display reversed (highest at top)
  // Show ALL asks from the API (no limit)
  const processedAsks: ProcessedOrder[] = useMemo(() => {
    if (!currentOrderBook?.asks) return [];

    // Process ALL asks, sorted by price ascending
    const sortedAsks = [...currentOrderBook.asks].sort(
      (a, b) => parseFloat(a.price) - parseFloat(b.price)
    );

    const asks = sortedAsks.map((ask) => ({
      price: parseFloat(ask.price),
      shares: parseFloat(ask.size),
      total: parseFloat(ask.price) * parseFloat(ask.size),
      cumulativeShares: 0,
    }));

    // Calculate cumulative from bottom (lowest price)
    let cumulative = 0;
    for (let i = 0; i < asks.length; i++) {
      cumulative += asks[i].shares;
      asks[i].cumulativeShares = cumulative;
    }

    return asks.reverse(); // Reverse so highest price is at top
  }, [currentOrderBook?.asks]);

  // Process bids (buy orders) - sorted descending (highest at top)
  // Show ALL bids from the API (no limit)
  const processedBids: ProcessedOrder[] = useMemo(() => {
    if (!currentOrderBook?.bids) return [];

    // Process ALL bids, sorted by price descending
    const sortedBids = [...currentOrderBook.bids].sort(
      (a, b) => parseFloat(b.price) - parseFloat(a.price)
    );

    const bids = sortedBids.map((bid) => ({
      price: parseFloat(bid.price),
      shares: parseFloat(bid.size),
      total: parseFloat(bid.price) * parseFloat(bid.size),
      cumulativeShares: 0,
    }));

    // Calculate cumulative from top (highest price)
    let cumulative = 0;
    for (let i = 0; i < bids.length; i++) {
      cumulative += bids[i].shares;
      bids[i].cumulativeShares = cumulative;
    }

    return bids;
  }, [currentOrderBook?.bids]);

  // Calculate max cumulative for depth bar scaling
  const maxCumulative = useMemo(() => {
    const maxAsk =
      processedAsks.length > 0
        ? processedAsks[processedAsks.length - 1].cumulativeShares
        : 0;
    const maxBid =
      processedBids.length > 0
        ? processedBids[processedBids.length - 1].cumulativeShares
        : 0;
    return Math.max(maxAsk, maxBid, 1);
  }, [processedAsks, processedBids]);

  // Calculate last price and spread
  const lastPrice = useMemo(() => {
    if (!currentOrderBook?.asks?.[0]) return null;
    return parseFloat(currentOrderBook.asks[0].price);
  }, [currentOrderBook?.asks]);

  const spread = useMemo(() => {
    if (!currentOrderBook?.asks?.[0] || !currentOrderBook?.bids?.[0])
      return null;
    const bestAsk = parseFloat(currentOrderBook.asks[0].price);
    const bestBid = parseFloat(currentOrderBook.bids[0].price);
    return bestAsk - bestBid;
  }, [currentOrderBook?.asks, currentOrderBook?.bids]);

  const formatPrice = (price: number) => {
    return (price * 100).toFixed(1) + "¢";
  };

  const formatShares = (shares: number) => {
    if (shares >= 1000000) {
      return (shares / 1000000).toFixed(2) + "M";
    }
    if (shares >= 1000) {
      return shares.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    return shares.toFixed(2);
  };

  const formatTotal = (total: number) => {
    if (total >= 1000000) {
      return "$" + (total / 1000000).toFixed(2) + "M";
    }
    if (total >= 1000) {
      return "$" + total.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    return "$" + total.toFixed(2);
  };

  return (
    <div className="bg-transparent rounded-lg border border-[#374E65] overflow-hidden">
      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[#374E65]">
        <button
          onClick={() => setActiveTab("orderbook")}
          className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === "orderbook"
              ? "text-white border-b-2 border-white bg-transparent"
              : "text-[#818a95] hover:text-white"
          }`}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveTab("graph")}
          className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === "graph"
              ? "text-white border-b-2 border-white bg-transparent"
              : "text-[#818a95] hover:text-white"
          }`}
        >
          Graph
        </button>
        <button
          onClick={() => setActiveTab("resolution")}
          className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === "resolution"
              ? "text-white border-b-2 border-white bg-transparent"
              : "text-[#818a95] hover:text-white"
          }`}
        >
          Resolution
        </button>

        {/* Right side - Rewards (hidden on very small screens) */}
        <div className="ml-auto hidden sm:flex items-center gap-2 px-4">
          <span className="text-[#00C08B] text-sm font-medium">Rewards</span>
          <svg
            className="w-4 h-4 text-[#818a95]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[#818a95] text-sm">0.1¢</span>
        </div>
      </div>

      {activeTab === "orderbook" && (
        <div className="p-2 sm:p-4 overflow-x-auto">
          {/* Trade Side Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#818a95] text-xs font-medium uppercase tracking-wider">
              Trade
            </span>
            <button
              onClick={() => setTradeSide("Yes")}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                tradeSide === "Yes"
                  ? "bg-[#00C08B] text-white"
                  : "bg-[#2C3F52] text-[#818a95] hover:bg-[#384E63]"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setTradeSide("No")}
              className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                tradeSide === "No"
                  ? "bg-[#e13737] text-white"
                  : "bg-[#2C3F52] text-[#818a95] hover:bg-[#384E63]"
              }`}
            >
              No
            </button>
            <svg
              className="w-4 h-4 text-[#818a95] ml-1 hidden sm:block"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[40px_1fr_1fr_1fr] sm:grid-cols-[minmax(100px,1fr)_1fr_1fr_1fr] gap-1 sm:gap-2 text-[10px] sm:text-xs text-[#818a95] font-medium uppercase tracking-wider mb-2 px-1 sm:px-2">
            <div></div>
            <div className="text-right">Price</div>
            <div className="text-right">Shares</div>
            <div className="text-right">Total</div>
          </div>

          {/* Asks (Sell Orders) - Red */}
          <div className="relative mb-1">
            {/* Asks Label */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
              <span className="bg-[#e13737] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Asks
              </span>
            </div>

            <div className="flex flex-col">
              {processedAsks.length > 0 ? (
                processedAsks.map((ask, i) => {
                  const depthPercent =
                    (ask.cumulativeShares / maxCumulative) * 100;
                  return (
                    <div
                      key={`ask-${i}`}
                      className="relative grid grid-cols-[40px_1fr_1fr_1fr] sm:grid-cols-[minmax(100px,1fr)_1fr_1fr_1fr] gap-1 sm:gap-2 py-1.5 px-1 sm:px-2 hover:bg-[#2C3F52]/50 cursor-pointer group"
                    >
                      {/* Depth bar - from right */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#e13737]/20 transition-all"
                        style={{ width: `${depthPercent}%` }}
                      />

                      <div className="relative z-10"></div>
                      <div className="relative z-10 text-right text-[#e13737] font-mono text-[10px] sm:text-sm">
                        {formatPrice(ask.price)}
                      </div>
                      <div className="relative z-10 text-right text-white font-mono text-[10px] sm:text-sm">
                        {formatShares(ask.shares)}
                      </div>
                      <div className="relative z-10 text-right text-[#818a95] font-mono text-[10px] sm:text-sm">
                        {formatTotal(ask.total)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-[#818a95] text-sm">
                  No asks available
                </div>
              )}
            </div>
          </div>

          {/* Spread Divider */}
          <div className="flex items-center justify-between py-2 px-2 border-y border-[#374E65] text-xs text-[#818a95]">
            <span>Last: {lastPrice ? formatPrice(lastPrice) : "-"}</span>
            <span>Spread: {spread !== null ? formatPrice(spread) : "-"}</span>
          </div>

          {/* Bids (Buy Orders) - Green */}
          <div className="relative mt-1">
            {/* Bids Label */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
              <span className="bg-[#00C08B] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Bids
              </span>
            </div>

            <div className="flex flex-col">
              {processedBids.length > 0 ? (
                processedBids.map((bid, i) => {
                  const depthPercent =
                    (bid.cumulativeShares / maxCumulative) * 100;
                  return (
                    <div
                      key={`bid-${i}`}
                      className="relative grid grid-cols-[40px_1fr_1fr_1fr] sm:grid-cols-[minmax(100px,1fr)_1fr_1fr_1fr] gap-1 sm:gap-2 py-1.5 px-1 sm:px-2 hover:bg-[#2C3F52]/50 cursor-pointer group"
                    >
                      {/* Depth bar - from right */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#00C08B]/20 transition-all"
                        style={{ width: `${depthPercent}%` }}
                      />

                      <div className="relative z-10"></div>
                      <div className="relative z-10 text-right text-[#00C08B] font-mono text-[10px] sm:text-sm">
                        {formatPrice(bid.price)}
                      </div>
                      <div className="relative z-10 text-right text-white font-mono text-[10px] sm:text-sm">
                        {formatShares(bid.shares)}
                      </div>
                      <div className="relative z-10 text-right text-[#818a95] font-mono text-[10px] sm:text-sm">
                        {formatTotal(bid.total)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-[#818a95] text-sm">
                  No bids available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "graph" && (
        <div className="p-4">
          {/* Header with current price */}
          {priceHistory.length > 0 && (
            <div className="mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-white">
                  {(priceHistory[priceHistory.length - 1]?.p * 100).toFixed(0)}%
                  chance
                </span>
                {priceHistory.length >= 2 &&
                  (() => {
                    const currentPrice =
                      priceHistory[priceHistory.length - 1]?.p || 0;
                    const firstPrice = priceHistory[0]?.p || 0;
                    const change = (currentPrice - firstPrice) * 100;
                    const isPositive = change >= 0;
                    return (
                      <span
                        className={`text-sm font-medium ${
                          isPositive ? "text-[#00C08B]" : "text-[#e13737]"
                        }`}
                      >
                        {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(0)}%
                      </span>
                    );
                  })()}
              </div>
            </div>
          )}

          {/* Price History Chart */}
          <div
            className="h-[280px] w-full"
            style={{ minWidth: "300px", minHeight: "280px" }}
          >
            {isLoadingHistory ? (
              <div className="h-full flex items-center justify-center text-[#818a95]">
                <div className="text-center">
                  <svg
                    className="w-8 h-8 mx-auto mb-2 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm">Loading chart...</p>
                </div>
              </div>
            ) : priceHistory.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={300}
                minHeight={280}
              >
                <LineChart
                  data={priceHistory.map((point) => ({
                    time: point.t * 1000,
                    price: point.p,
                  }))}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  {/* Horizontal reference lines - dynamic based on data */}
                  {yAxisConfig.ticks.map((tick) => (
                    <ReferenceLine
                      key={tick}
                      y={tick}
                      stroke="#374E65"
                      strokeDasharray="2 2"
                    />
                  ))}
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (timePeriod === "1H" || timePeriod === "6H") {
                        return date.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        });
                      } else if (timePeriod === "1D") {
                        return date.toLocaleTimeString("en-US", {
                          hour: "numeric",
                        });
                      } else {
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      }
                    }}
                    stroke="#818a95"
                    tick={{ fill: "#818a95", fontSize: 11 }}
                    axisLine={{ stroke: "#374E65" }}
                    tickLine={false}
                    minTickGap={40}
                  />
                  <YAxis
                    domain={yAxisConfig.domain}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    stroke="transparent"
                    tick={{ fill: "#818a95", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    ticks={yAxisConfig.ticks}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1D2B3A",
                      border: "1px solid #374E65",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                    labelStyle={{ color: "#818a95", fontSize: 11 }}
                    formatter={(value: number) => [
                      `${(value * 100).toFixed(1)}%`,
                      tradeSide === "Yes" ? "Yes" : "No",
                    ]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#60a5fa" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#818a95]">
                <div className="text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 opacity-50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 3v18h18" />
                    <path d="M18 9l-5 5-4-4-3 3" />
                  </svg>
                  <p className="text-sm">No price history available</p>
                </div>
              </div>
            )}
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1">
              {(["1H", "6H", "1D", "1W", "1M", "ALL"] as TimePeriod[]).map(
                (period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      timePeriod === period
                        ? "bg-[#374E65] text-white"
                        : "text-[#818a95] hover:text-white hover:bg-[#2C3F52]"
                    }`}
                  >
                    {period}
                  </button>
                )
              )}
            </div>

            {/* Right side icons (like Polymarket) */}
            <div className="flex items-center gap-2 text-[#818a95]">
              <button
                className="p-1.5 hover:text-white transition-colors"
                title="Settings"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 8.94 4.518" />
                  <path d="M17 4L19 2" />
                </svg>
              </button>
              <button
                className="p-1.5 hover:text-white transition-colors"
                title="Copy"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button
                className="p-1.5 hover:text-white transition-colors"
                title="Code"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </button>
              <button
                className="p-1.5 hover:text-white transition-colors"
                title="Settings"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "resolution" && (
        <div className="p-6">
          <div className="text-[#818a95] text-sm space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">
                Resolution Source
              </h4>
              <p>
                This market will resolve based on official announcements and
                verified sources.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">
                Resolution Rules
              </h4>
              <p>
                The outcome will be determined by the actual result of the
                event. If the event does not occur or is cancelled, the market
                may resolve to the status quo or be voided.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
