"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Order {
  price: string;
  size: string;
}

interface OrderBookData {
  asks: Order[];
  bids: Order[];
}

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
  outcomeTitle,
  selectedSide,
}: OrderBookPanelProps) {
  const [activeTab, setActiveTab] = useState<"orderbook" | "graph" | "resolution">("orderbook");
  const [yesOrderBook, setYesOrderBook] = useState<OrderBookData | null>(null);
  const [noOrderBook, setNoOrderBook] = useState<OrderBookData | null>(null);
  const [tradeSide, setTradeSide] = useState<"Yes" | "No">(selectedSide);

  // Sync with parent's selectedSide
  useEffect(() => {
    setTradeSide(selectedSide);
  }, [selectedSide]);

  const fetchOrderBooks = useCallback(async () => {
    if (!yesTokenId) return;

    try {
      const yesPromise = fetch(`/api/orderbook?tokenId=${yesTokenId}`).then((res) =>
        res.json()
      );
      const noPromise = noTokenId
        ? fetch(`/api/orderbook?tokenId=${noTokenId}`).then((res) => res.json())
        : Promise.resolve(null);

      const [yesData, noData] = await Promise.all([yesPromise, noPromise]);

      if (yesData && !yesData.error) {
        // Sort asks ascending, bids descending
        if (yesData.asks) {
          yesData.asks.sort((a: Order, b: Order) => parseFloat(a.price) - parseFloat(b.price));
        }
        if (yesData.bids) {
          yesData.bids.sort((a: Order, b: Order) => parseFloat(b.price) - parseFloat(a.price));
        }
        setYesOrderBook(yesData);
      }

      if (noData && !noData.error) {
        if (noData.asks) {
          noData.asks.sort((a: Order, b: Order) => parseFloat(a.price) - parseFloat(b.price));
        }
        if (noData.bids) {
          noData.bids.sort((a: Order, b: Order) => parseFloat(b.price) - parseFloat(a.price));
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
    const sortedAsks = [...currentOrderBook.asks]
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
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
    const sortedBids = [...currentOrderBook.bids]
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    
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
    const maxAsk = processedAsks.length > 0 ? processedAsks[processedAsks.length - 1].cumulativeShares : 0;
    const maxBid = processedBids.length > 0 ? processedBids[processedBids.length - 1].cumulativeShares : 0;
    return Math.max(maxAsk, maxBid, 1);
  }, [processedAsks, processedBids]);

  // Calculate last price and spread
  const lastPrice = useMemo(() => {
    if (!currentOrderBook?.asks?.[0]) return null;
    return parseFloat(currentOrderBook.asks[0].price);
  }, [currentOrderBook?.asks]);

  const spread = useMemo(() => {
    if (!currentOrderBook?.asks?.[0] || !currentOrderBook?.bids?.[0]) return null;
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
      <div className="flex border-b border-[#374E65]">
        <button
          onClick={() => setActiveTab("orderbook")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "orderbook"
              ? "text-white border-b-2 border-white bg-transparent"
              : "text-[#818a95] hover:text-white"
          }`}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveTab("graph")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "graph"
              ? "text-white border-b-2 border-white bg-transparent"
              : "text-[#818a95] hover:text-white"
          }`}
        >
          Graph
        </button>
        <button
          onClick={() => setActiveTab("resolution")}
          className={`px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === "resolution"
              ? "text-white border-b-2 border-white bg-transparent"
              : "text-[#818a95] hover:text-white"
          }`}
        >
          Resolution
        </button>
        
        {/* Right side - Rewards */}
        <div className="ml-auto flex items-center gap-2 px-4">
          <span className="text-[#00C08B] text-sm font-medium">Rewards</span>
          <svg className="w-4 h-4 text-[#818a95]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-[#818a95] text-sm">0.1¢</span>
        </div>
      </div>

      {activeTab === "orderbook" && (
        <div className="p-4">
          {/* Trade Side Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#818a95] text-xs font-medium uppercase tracking-wider">Trade</span>
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
            <svg className="w-4 h-4 text-[#818a95] ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>

          {/* Column Headers */}
          <div className="grid grid-cols-[minmax(100px,1fr)_1fr_1fr_1fr] gap-2 text-xs text-[#818a95] font-medium uppercase tracking-wider mb-2 px-2">
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
                  const depthPercent = (ask.cumulativeShares / maxCumulative) * 100;
                  return (
                    <div
                      key={`ask-${i}`}
                      className="relative grid grid-cols-[minmax(100px,1fr)_1fr_1fr_1fr] gap-2 py-1.5 px-2 hover:bg-[#2C3F52]/50 cursor-pointer group"
                    >
                      {/* Depth bar - from right */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#e13737]/20 transition-all"
                        style={{ width: `${depthPercent}%` }}
                      />
                      
                      <div className="relative z-10"></div>
                      <div className="relative z-10 text-right text-[#e13737] font-mono text-sm">
                        {formatPrice(ask.price)}
                      </div>
                      <div className="relative z-10 text-right text-white font-mono text-sm">
                        {formatShares(ask.shares)}
                      </div>
                      <div className="relative z-10 text-right text-[#818a95] font-mono text-sm">
                        {formatTotal(ask.total)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-[#818a95] text-sm">No asks available</div>
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
                  const depthPercent = (bid.cumulativeShares / maxCumulative) * 100;
                  return (
                    <div
                      key={`bid-${i}`}
                      className="relative grid grid-cols-[minmax(100px,1fr)_1fr_1fr_1fr] gap-2 py-1.5 px-2 hover:bg-[#2C3F52]/50 cursor-pointer group"
                    >
                      {/* Depth bar - from right */}
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-[#00C08B]/20 transition-all"
                        style={{ width: `${depthPercent}%` }}
                      />
                      
                      <div className="relative z-10"></div>
                      <div className="relative z-10 text-right text-[#00C08B] font-mono text-sm">
                        {formatPrice(bid.price)}
                      </div>
                      <div className="relative z-10 text-right text-white font-mono text-sm">
                        {formatShares(bid.shares)}
                      </div>
                      <div className="relative z-10 text-right text-[#818a95] font-mono text-sm">
                        {formatTotal(bid.total)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-[#818a95] text-sm">No bids available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "graph" && (
        <div className="p-8 text-center text-[#818a95]">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M18 9l-5 5-4-4-3 3" />
          </svg>
          <p className="text-sm">Depth chart coming soon</p>
        </div>
      )}

      {activeTab === "resolution" && (
        <div className="p-6">
          <div className="text-[#818a95] text-sm space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">Resolution Source</h4>
              <p>This market will resolve based on official announcements and verified sources.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Resolution Rules</h4>
              <p>The outcome will be determined by the actual result of the event. If the event does not occur or is cancelled, the market may resolve to the status quo or be voided.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

