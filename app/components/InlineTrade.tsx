"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Market } from "../lib/polymarket";

interface InlineTradeProps {
  market: Market;
  outcome: "Yes" | "No" | string;
  onClose?: () => void;
}

interface OrderBook {
  asks: Array<{ price: string; size: string }>;
  bids: Array<{ price: string; size: string }>;
}

export default function InlineTrade({ market, outcome }: InlineTradeProps) {
  const [amount, setAmount] = useState<number>(10);
  const [currentOrderBook, setCurrentOrderBook] = useState<OrderBook | null>(
    null
  );
  const [opposingOrderBook, setOpposingOrderBook] = useState<OrderBook | null>(
    null
  );

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
    let opposingId = null;
    if (outcomes.length === 2 && ids.length === 2) {
      opposingId = ids[currentIndex === 0 ? 1 : 0];
    }

    return { currentTokenId: currentId, opposingTokenId: opposingId };
  }, [market, outcome]);

  const fetchLiquidity = useCallback(async () => {
    if (!currentTokenId) {
      return;
    }

    try {
      const currentPromise = fetch(
        `/api/orderbook?tokenId=${currentTokenId}`
      ).then((res) => res.json());

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
    }
  }, [currentTokenId, opposingTokenId]);

  useEffect(() => {
    if (market) {
      fetchLiquidity();
    }
  }, [market, fetchLiquidity]);

  const maxBuyAmount = useMemo(() => {
    let total = 0;
    if (currentOrderBook?.asks) {
      total += currentOrderBook.asks.reduce(
        (sum, ask) => sum + parseFloat(ask.price) * parseFloat(ask.size),
        0
      );
    }
    if (opposingOrderBook?.bids) {
      total += opposingOrderBook.bids.reduce((sum, bid) => {
        const price = parseFloat(bid.price);
        const size = parseFloat(bid.size);
        return sum + size * (1 - price);
      }, 0);
    }
    return total;
  }, [currentOrderBook, opposingOrderBook]);

  const potentialWinnings = useMemo(() => {
    if (amount <= 0) return 0;
    let remainingAmount = amount;
    let totalShares = 0;

    const consumeLiquidity = (offers: { price: number; size: number }[]) => {
      for (const offer of offers) {
        if (remainingAmount <= 0) break;
        const costPerShare = offer.price;
        const maxShares = offer.size;
        const maxCost = maxShares * costPerShare;

        if (remainingAmount >= maxCost) {
          totalShares += maxShares;
          remainingAmount -= maxCost;
        } else {
          const shares = remainingAmount / costPerShare;
          totalShares += shares;
          remainingAmount = 0;
        }
      }
    };

    const allLiquidity: { price: number; size: number }[] = [];

    if (currentOrderBook?.asks) {
      currentOrderBook.asks.forEach((ask) => {
        allLiquidity.push({
          price: parseFloat(ask.price),
          size: parseFloat(ask.size),
        });
      });
    }

    if (opposingOrderBook?.bids) {
      opposingOrderBook.bids.forEach((bid) => {
        const bidPrice = parseFloat(bid.price);
        const cost = 1 - bidPrice;
        if (cost < 1 && cost > 0) {
          allLiquidity.push({
            price: cost,
            size: parseFloat(bid.size),
          });
        }
      });
    }

    allLiquidity.sort((a, b) => a.price - b.price);
    consumeLiquidity(allLiquidity);

    return totalShares * 1;
  }, [amount, currentOrderBook, opposingOrderBook]);

  const outcomeColor =
    outcome === "Yes"
      ? "bg-[#00C08B] hover:bg-[#00E0A1] shadow-[#00C08B]/20"
      : "bg-[#E65050] hover:bg-[#FF5A5A] shadow-[#E65050]/20";

  return (
    <div className="flex flex-col">
      {/* Input Row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 flex items-center bg-[#1D2B3A] rounded-md overflow-hidden">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(0, parseFloat(e.target.value) || 0))
              }
              className="w-full bg-transparent text-white py-1.5 pl-6 pr-2 outline-none font-mono text-sm"
            />
          </div>
          <div className="flex gap-0.5 pr-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAmount((prev) => prev + 1);
              }}
              className="bg-[#2C3F52] hover:bg-[#384E63] text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold transition-colors"
            >
              +1
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAmount((prev) => prev + 10);
              }}
              className="bg-[#2C3F52] hover:bg-[#384E63] text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold transition-colors"
            >
              +10
            </button>
          </div>
        </div>

        {/* Slider */}
        <div className="w-28 flex items-center">
          <input
            type="range"
            min="0"
            max={Math.min(maxBuyAmount || 1000, 1000)}
            value={amount}
            onChange={(e) => {
              e.stopPropagation();
              setAmount(parseFloat(e.target.value));
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-1.5 bg-[#1D2B3A] rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={(e) => e.stopPropagation()}
        className={`w-full py-2 rounded-md font-bold text-base shadow-lg transition-all transform active:scale-[0.98] text-white flex flex-col items-center justify-center leading-tight ${outcomeColor}`}
      >
        <span>Buy {outcome}</span>
        <span className="text-[10px] font-normal opacity-90">
          To win ${potentialWinnings.toFixed(2)}
        </span>
      </button>
    </div>
  );
}
