"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import NextImage from "next/image";

interface OrderBook {
  asks: Array<{ price: string; size: string }>;
  bids: Array<{ price: string; size: string }>;
}

interface Order {
  price: string;
  size: string;
}

interface TradePanelProps {
  selectedOutcome: {
    title: string;
    price: number;
    yesTokenId: string;
    noTokenId: string;
    market: unknown;
  };
  eventImage?: string;
  selectedSide?: "Yes" | "No";
  onSideChange?: (side: "Yes" | "No") => void;
}

export default function TradePanel({
  selectedOutcome,
  eventImage,
  selectedSide = "Yes",
  onSideChange,
}: TradePanelProps) {
  const [tradeType, setTradeType] = useState<"Buy" | "Sell">("Buy"); // Tabs
  // const [side, setSide] = useState<"Yes" | "No">("Yes"); // Removed internal state
  const [amount, setAmount] = useState<number>(0);

  // Use prop if provided, otherwise default to "Yes" (though parent should control it)
  const side = selectedSide;
  const setSide = onSideChange || (() => {});

  const [yesOrderBook, setYesOrderBook] = useState<OrderBook | null>(null);
  const [noOrderBook, setNoOrderBook] = useState<OrderBook | null>(null);

  // const [currentOrderBook, setCurrentOrderBook] = useState<OrderBook | null>(
  //   null
  // );
  // const [opposingOrderBook, setOpposingOrderBook] = useState<OrderBook | null>(
  //   null
  // );
  // const [loading, setLoading] = useState(false); // Unused state
  // const [error, setError] = useState(""); // Unused state
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when outcome changes
  useEffect(() => {
    setAmount(0);
    setTradeType("Buy");
    // Side reset is now handled by parent or we can force it here if we want, but better to let parent handle it.
    // If parent changes outcome, it should also reset side if desired.
    // setSide("Yes"); 
  }, [selectedOutcome.yesTokenId]); // Use ID to track change

  const fetchLiquidity = useCallback(async () => {
    if (!selectedOutcome.yesTokenId) return;

    try {
      const yesPromise = fetch(
        `/api/orderbook?tokenId=${selectedOutcome.yesTokenId}`
      ).then((res) => res.json());

      const noPromise = selectedOutcome.noTokenId
        ? fetch(`/api/orderbook?tokenId=${selectedOutcome.noTokenId}`).then((res) =>
            res.json()
          )
        : Promise.resolve(null);

      const [yesData, noData] = await Promise.all([
        yesPromise,
        noPromise,
      ]);

      if (yesData.error) throw new Error(yesData.error);

      // Ensure correct sorting: Asks ascending (lowest first), Bids descending (highest first)
      if (yesData.asks)
        yesData.asks.sort(
          (a: Order, b: Order) => parseFloat(a.price) - parseFloat(b.price)
        );
      if (yesData.bids)
        yesData.bids.sort(
          (a: Order, b: Order) => parseFloat(b.price) - parseFloat(a.price)
        );

      setYesOrderBook(yesData);

      if (noData && !noData.error) {
        // Ensure correct sorting for opposing book too
        if (noData.asks)
          noData.asks.sort(
            (a: Order, b: Order) => parseFloat(a.price) - parseFloat(b.price)
          );
        if (noData.bids)
          noData.bids.sort(
            (a: Order, b: Order) => parseFloat(b.price) - parseFloat(a.price)
          );
        setNoOrderBook(noData);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedOutcome.yesTokenId, selectedOutcome.noTokenId]);

  useEffect(() => {
    fetchLiquidity();
    const interval = setInterval(fetchLiquidity, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [fetchLiquidity]);

  // Derived books based on side selection
  const { currentOrderBook, opposingOrderBook } = useMemo(() => {
    if (side === "Yes") {
      return { currentOrderBook: yesOrderBook, opposingOrderBook: noOrderBook };
    } else {
      return { currentOrderBook: noOrderBook, opposingOrderBook: yesOrderBook };
    }
  }, [side, yesOrderBook, noOrderBook]);

  // Helper to calculate max buy amount and potential winnings
  // Adapted from TradeModal
  /*
  const calculateStats = useMemo(() => {
    // ... calculation logic ...
    // For brevity, basic implementation
    return {
        shares: 0,
        avgPrice: 0,
        maxBuy: 0
    };
  }, []); 
  */

  // We'll implement full calculation logic below

  const maxBuyAmount = useMemo(() => {
    let total = 0;
    // 1. Direct Liquidity
    if (currentOrderBook?.asks) {
      total += currentOrderBook.asks.reduce(
        (sum, ask) => sum + parseFloat(ask.price) * parseFloat(ask.size),
        0
      );
    }
    // 2. Synthetic Liquidity
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
    return totalShares;
  }, [amount, currentOrderBook, opposingOrderBook]);

  // Calculate prices based on Order Book
  const yesPrice = useMemo(() => {
    if (tradeType === "Buy") {
      // Buying Yes -> Ask Price
      if (yesOrderBook?.asks?.[0]) return parseFloat(yesOrderBook.asks[0].price);
    } else {
      // Selling Yes -> Bid Price
      if (yesOrderBook?.bids?.[0]) return parseFloat(yesOrderBook.bids[0].price);
    }
    return selectedOutcome.price; // Fallback
  }, [tradeType, yesOrderBook, selectedOutcome.price]);

  const noPrice = useMemo(() => {
    if (tradeType === "Buy") {
      // Buying No -> Ask Price
      if (noOrderBook?.asks?.[0]) return parseFloat(noOrderBook.asks[0].price);
    } else {
      // Selling No -> Bid Price
      if (noOrderBook?.bids?.[0]) return parseFloat(noOrderBook.bids[0].price);
    }
    return 1 - selectedOutcome.price; // Fallback
  }, [tradeType, noOrderBook, selectedOutcome.price]);

  const getPriceDisplay = (p: number) => {
    if (p < 0.01) return "<1¢";
    if (p > 0.99) return ">99¢";
    return (p * 100).toFixed(1) + "¢";
  };

  return (
    <div className="bg-transparent rounded-lg p-4 w-full max-w-[360px] ml-auto border border-[#2C3F52]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative w-12 h-12 shrink-0 bg-[#00C08B] rounded-lg flex items-center justify-center">
          {eventImage ? (
            <NextImage
              src={eventImage}
              alt="Event"
              fill
              className="object-cover rounded-lg"
            />
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          )}
        </div>
        <div>
          <h2 className="font-bold text-white text-2xl leading-tight">$1B</h2>
        </div>
      </div>

      {/* Buy/Sell Tabs */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-0">
        <div className="flex gap-6">
          <button
            className={`pb-3 text-lg font-bold transition-colors ${
              tradeType === "Buy"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setTradeType("Buy")}
          >
            Buy
          </button>
          <button
            className={`pb-3 text-lg font-bold transition-colors ${
              tradeType === "Sell"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setTradeType("Sell")}
          >
            Sell
          </button>
        </div>
        <div className="flex items-center text-sm font-bold text-white cursor-pointer hover:text-gray-300 mb-2">
          Market <span className="ml-1">▼</span>
        </div>
      </div>

      {/* Yes/No Toggles */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setSide("Yes")}
          className={`flex items-center justify-center gap-2 py-3.5 rounded-lg border transition-all ${
            side === "Yes"
              ? "bg-[#00C08B] border-transparent text-white"
              : "bg-[#2C3F52] border-transparent text-[#818a95] hover:bg-[#384E63]"
          }`}
        >
          <span className="text-xl font-bold">Yes</span>
          <span
            className={`text-xl font-bold ${
              side === "Yes" ? "text-white" : "text-[#818a95]"
            }`}
          >
            {getPriceDisplay(yesPrice)}
          </span>
        </button>

        <button
          onClick={() => setSide("No")}
          className={`flex items-center justify-center gap-2 py-3.5 rounded-lg border transition-all ${
            side === "No"
              ? "bg-[#e13737] border-transparent text-white"
              : "bg-[#2C3F52] border-transparent text-[#818a95] hover:bg-[#384E63]"
          }`}
        >
          <span className="text-xl font-bold">No</span>
          <span
            className={`text-xl font-bold ${
              side === "No" ? "text-white" : "text-[#818a95]"
            }`}
          >
            {getPriceDisplay(noPrice)}
          </span>
        </button>
      </div>

      {/* Amount Input */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-lg font-medium text-[#f2f2f2] mt-2">Amount</span>
        <div
          className="flex items-center justify-end cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <span
            className="text-5xl font-medium transition-colors mr-1"
            style={{ color: amount > 0 ? "#ffffff" : "#788089" }}
          >
            $
          </span>
          <input
            ref={inputRef}
            type="number"
            value={amount || ""}
            onChange={(e) =>
              setAmount(Math.max(0, parseFloat(e.target.value) || 0))
            }
            className="bg-transparent text-right outline-none font-mono text-5xl font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors placeholder-[#788089]"
            placeholder="0"
            style={{
              width: `${
                Math.max(1, (amount || "").toString().length) +
                (amount === 0 ? 0 : 0)
              }ch`,
              color: amount > 0 ? "#ffffff" : "#788089",
            }}
          />
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex justify-end gap-1.5 mb-6">
        {[1, 20, 100].map((val) => (
          <button
            key={val}
            onClick={() => setAmount((prev) => prev + val)}
            className="px-[12px] py-0 h-[32px] rounded-lg bg-[#2C3F52] hover:bg-[#384E63] text-white text-[12px] font-bold transition-colors flex items-center justify-center"
          >
            +${val}
          </button>
        ))}
        <button
          onClick={() => setAmount(parseFloat(maxBuyAmount.toFixed(2)))} // Max available
          className="px-[12px] py-0 h-[32px] rounded-lg bg-[#2C3F52] hover:bg-[#384E63] text-white text-[12px] font-bold transition-colors flex items-center justify-center"
        >
          Max
        </button>
      </div>

      {/* Trade Button */}
      <button
        className={`w-full py-3.5 rounded-lg font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] bg-[#2d9cdb] hover:bg-[#238ac3] ${
          amount === 0 ? "opacity-80" : ""
        }`}
        disabled={amount === 0}
      >
        Trade
      </button>

      {/* Summary */}

      {amount > 0 && (
        <div className="mt-4 p-3 bg-[#1D2B3A] rounded border border-gray-700 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Price</span>
            <span className="text-white font-mono">
              {(amount / potentialWinnings || 0).toFixed(3)}¢
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Est. Shares</span>
            <span className="text-white font-mono">
              {potentialWinnings.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Potential Return</span>
            <span
              className={`${
                side === "Yes" ? "text-[#00C08B]" : "text-[#E63757]"
              } font-mono`}
            >
              ${potentialWinnings.toFixed(2)} (
              {((potentialWinnings / amount) * 100 - 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By trading, you agree to the{" "}
          <a href="#" className="underline">
            Terms of Use
          </a>
          .
        </p>
      </div>
    </div>
  );
}
