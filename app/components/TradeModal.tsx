"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Market } from "../lib/polymarket";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: Market;
  outcome: "Yes" | "No" | string;
}

interface OrderBook {
  asks: Array<{ price: string; size: string }>;
  bids: Array<{ price: string; size: string }>;
}

export default function TradeModal({
  isOpen,
  onClose,
  market,
  outcome,
}: TradeModalProps) {
  const [amount, setAmount] = useState<number>(10);
  const [currentOrderBook, setCurrentOrderBook] = useState<OrderBook | null>(
    null
  );
  const [opposingOrderBook, setOpposingOrderBook] = useState<OrderBook | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Determine token IDs for current and opposing outcomes
  const { currentTokenId, opposingTokenId } = useMemo(() => {
    if (!market.clobTokenIds)
      return { currentTokenId: null, opposingTokenId: null };

    let ids: string[] = [];
    try {
      ids = Array.isArray(market.clobTokenIds)
        ? market.clobTokenIds
        : JSON.parse(market.clobTokenIds);
    } catch (e) {
      console.error("Failed to parse clobTokenIds", e);
      return { currentTokenId: null, opposingTokenId: null };
    }

    const outcomes = Array.isArray(market.outcomes)
      ? market.outcomes
      : JSON.parse(market.outcomes || "[]");

    const currentIndex = outcomes.findIndex(
      (o: string) => o.toLowerCase() === outcome.toLowerCase()
    );

    if (currentIndex === -1) {
      // Fallback for binary simple case
      if (outcome.toLowerCase() === "yes")
        return { currentTokenId: ids[0], opposingTokenId: ids[1] };
      if (outcome.toLowerCase() === "no")
        return { currentTokenId: ids[1], opposingTokenId: ids[0] };
      return { currentTokenId: ids[0], opposingTokenId: null };
    }

    const currentId = ids[currentIndex];
    // For binary markets, the opposing token is the other one.
    // For now, we only support synthetic liquidity for binary markets (2 outcomes).
    let opposingId = null;
    if (outcomes.length === 2 && ids.length === 2) {
      opposingId = ids[currentIndex === 0 ? 1 : 0];
    }

    return { currentTokenId: currentId, opposingTokenId: opposingId };
  }, [market, outcome]);

  const fetchLiquidity = useCallback(async () => {
    if (!currentTokenId) {
      setError("Token ID not found for this outcome");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Fetch current token order book
      const currentPromise = fetch(
        `/api/orderbook?tokenId=${currentTokenId}`
      ).then((res) => res.json());

      // Fetch opposing token order book if exists
      const opposingPromise = opposingTokenId
        ? fetch(`/api/orderbook?tokenId=${opposingTokenId}`).then((res) =>
            res.json()
          )
        : Promise.resolve(null);

      const [currentData, opposingData] = await Promise.all([
        currentPromise,
        opposingPromise,
      ]);

      if (currentData.error) throw new Error(currentData.error);
      setCurrentOrderBook(currentData);

      if (opposingData && !opposingData.error) {
        setOpposingOrderBook(opposingData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load market liquidity");
    } finally {
      setLoading(false);
    }
  }, [currentTokenId, opposingTokenId]);

  useEffect(() => {
    if (isOpen && market) {
      fetchLiquidity();
    } else {
      // Reset state on close
      setCurrentOrderBook(null);
      setOpposingOrderBook(null);
      setError("");
      setAmount(10); // Reset amount
    }
  }, [
    isOpen,
    market,
    outcome,
    currentTokenId,
    opposingTokenId,
    fetchLiquidity,
  ]);

  const maxBuyAmount = useMemo(() => {
    let total = 0;

    // 1. Direct Liquidity (Asks on current token)
    if (currentOrderBook?.asks) {
      const directLiquidity = currentOrderBook.asks.reduce((sum, ask) => {
        return sum + parseFloat(ask.price) * parseFloat(ask.size);
      }, 0);
      total += directLiquidity;
    }

    // 2. Synthetic Liquidity (Bids on opposing token)
    // Buying Yes = Minting (Yes+No) and Selling No.
    // Cost = 1 - Price(No).
    // Max we can deploy is limited by the size of No bids.
    // Cost = Size * (1 - BidPrice).
    if (opposingOrderBook?.bids) {
      const syntheticLiquidity = opposingOrderBook.bids.reduce((sum, bid) => {
        const price = parseFloat(bid.price);
        const size = parseFloat(bid.size);
        // Net cost to buy 'size' synthetic shares
        return sum + size * (1 - price);
      }, 0);
      total += syntheticLiquidity;
    }

    return total;
  }, [currentOrderBook, opposingOrderBook]);

  // Calculate potential winnings/shares using Weighted Average Price
  // This simulates slippage by walking the order book
  const potentialWinnings = useMemo(() => {
    if (amount <= 0) return 0;

    let remainingAmount = amount;
    let totalShares = 0;

    // Helper to consume liquidity from a list of offers
    // offers: { price, size }[]
    // type: 'direct' | 'synthetic'
    const consumeLiquidity = (offers: { price: number; size: number }[]) => {
      for (const offer of offers) {
        if (remainingAmount <= 0) break;

        const costPerShare = offer.price;
        const maxShares = offer.size;
        const maxCost = maxShares * costPerShare;

        if (remainingAmount >= maxCost) {
          // Take full order
          totalShares += maxShares;
          remainingAmount -= maxCost;
        } else {
          // Take partial
          const shares = remainingAmount / costPerShare;
          totalShares += shares;
          remainingAmount = 0;
        }
      }
    };

    // Prepare sorted list of all liquidity (Direct + Synthetic)
    const allLiquidity: { price: number; size: number }[] = [];

    // 1. Direct Asks
    if (currentOrderBook?.asks) {
      currentOrderBook.asks.forEach((ask) => {
        allLiquidity.push({
          price: parseFloat(ask.price),
          size: parseFloat(ask.size),
        });
      });
    }

    // 2. Synthetic (Opposing Bids)
    // Cost to buy 1 share = 1 - BidPrice
    if (opposingOrderBook?.bids) {
      opposingOrderBook.bids.forEach((bid) => {
        const bidPrice = parseFloat(bid.price);
        const cost = 1 - bidPrice;
        // Filter out invalid costs (>= 1)
        if (cost < 1 && cost > 0) {
          allLiquidity.push({
            price: cost,
            size: parseFloat(bid.size),
          });
        }
      });
    }

    // Sort by price ascending (cheapest first)
    allLiquidity.sort((a, b) => a.price - b.price);

    consumeLiquidity(allLiquidity);

    return totalShares * 1; // Payout is $1 per share
  }, [amount, currentOrderBook, opposingOrderBook]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#2A3F54] w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-start gap-4">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">
              {market.question}
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              {market.category} • {outcome}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-4">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-gray-400 text-sm font-medium">
                  Amount
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) =>
                        setAmount(Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      className="w-full bg-[#1D2B3A] text-white rounded-lg py-3 pl-7 pr-4 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAmount(amount + 1)}
                      className="bg-[#324858] hover:bg-[#3d5669] text-blue-300 px-3 py-3 rounded-lg font-medium text-sm transition-colors"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => setAmount(amount + 10)}
                      className="bg-[#324858] hover:bg-[#3d5669] text-blue-300 px-3 py-3 rounded-lg font-medium text-sm transition-colors"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="range"
                    min="0"
                    max={Math.min(maxBuyAmount, 10000)}
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <button
                    onClick={() => setAmount(maxBuyAmount)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Buy Button */}
              <button
                className={`w-full py-3.5 rounded-lg font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] ${
                  outcome === "Yes"
                    ? "bg-[#00C08B] hover:bg-[#00E0A1] text-white shadow-[#00C08B]/20"
                    : "bg-[#E65050] hover:bg-[#FF5A5A] text-white shadow-[#E65050]/20"
                }`}
              >
                Buy {outcome}
                <div className="text-xs font-normal opacity-90 mt-0.5">
                  To win ${potentialWinnings.toFixed(2)}
                </div>
              </button>

              {/* Max Buy Info */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Buy {outcome} up to{" "}
                  <span className="text-white font-mono font-medium">
                    $
                    {maxBuyAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
