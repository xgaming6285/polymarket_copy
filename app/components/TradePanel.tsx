"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import NextImage from "next/image";
import { useAuth } from "../contexts/AuthContext";

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
    image?: string;
  };
  eventId?: string;
  eventTitle?: string;
  eventImage?: string;
  selectedSide?: "Yes" | "No";
  onSideChange?: (side: "Yes" | "No") => void;
  onTradeSuccess?: () => void;
}

export default function TradePanel({
  selectedOutcome,
  eventId,
  eventTitle,
  eventImage,
  selectedSide = "Yes",
  onSideChange,
  onTradeSuccess,
}: TradePanelProps) {
  const { user, stats, refreshStats } = useAuth();
  const [tradeType, setTradeType] = useState<"Buy" | "Sell">("Buy"); // Tabs
  const [orderType, setOrderType] = useState<"Market" | "Limit">("Limit"); // Order type
  const [shares, setShares] = useState<number>(0); // Number of shares
  const [limitPrice, setLimitPrice] = useState<number>(0); // Limit price in decimal (0.174 = 17.4¢)
  const [isTrading, setIsTrading] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [tradeSuccess, setTradeSuccess] = useState("");
  const [hasMounted, setHasMounted] = useState(false);

  // Handle hydration - only show user-specific content after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    setShares(0);
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
        ? fetch(`/api/orderbook?tokenId=${selectedOutcome.noTokenId}`).then(
            (res) => res.json()
          )
        : Promise.resolve(null);

      const [yesData, noData] = await Promise.all([yesPromise, noPromise]);

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

  // Calculate trade stats for Limit orders
  // Simple calculation: Total = shares × limitPrice, To Win = shares × $1
  const tradeStats = useMemo(() => {
    if (shares <= 0 || limitPrice <= 0) {
      return { total: 0, toWin: 0 };
    }

    const total = shares * limitPrice; // Cost to buy
    const toWin = shares; // Each share pays $1 if outcome is correct

    return { total, toWin };
  }, [shares, limitPrice]);

  // Calculate prices based on Order Book
  const yesPrice = useMemo(() => {
    if (tradeType === "Buy") {
      // Buying Yes -> Ask Price
      if (yesOrderBook?.asks?.[0])
        return parseFloat(yesOrderBook.asks[0].price);
    } else {
      // Selling Yes -> Bid Price
      if (yesOrderBook?.bids?.[0])
        return parseFloat(yesOrderBook.bids[0].price);
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

  // Initialize limit price from current market price
  useEffect(() => {
    const currentPrice = side === "Yes" ? yesPrice : noPrice;
    if (currentPrice > 0 && limitPrice === 0) {
      setLimitPrice(currentPrice);
    }
  }, [yesPrice, noPrice, side, limitPrice]);

  // Update limit price when side changes
  useEffect(() => {
    const currentPrice = side === "Yes" ? yesPrice : noPrice;
    if (currentPrice > 0) {
      setLimitPrice(currentPrice);
    }
  }, [side, yesPrice, noPrice]);

  const getPriceDisplay = (p: number) => {
    if (p < 0.01) return "<1¢";
    if (p > 0.99) return ">99¢";
    return (p * 100).toFixed(1) + "¢";
  };

  // Execute trade
  const executeTrade = async () => {
    if (!user?.id) {
      setTradeError("Please log in to trade");
      return;
    }

    if (shares <= 0) {
      setTradeError("Please enter number of shares");
      return;
    }

    if (tradeType === "Buy" && stats && tradeStats.total > stats.cashBalance) {
      setTradeError("Insufficient balance");
      return;
    }

    setIsTrading(true);
    setTradeError("");
    setTradeSuccess("");

    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          eventId: eventId || selectedOutcome.yesTokenId,
          eventTitle: eventTitle || selectedOutcome.title,
          eventImage,
          marketId: selectedOutcome.yesTokenId,
          outcomeTitle: selectedOutcome.title,
          type: tradeType.toLowerCase(),
          outcome: side,
          amount: tradeStats.total, // Total cost
          shares,
          price: limitPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Trade failed");
      }

      setTradeSuccess(data.message);
      setShares(0);

      // Refresh stats
      await refreshStats();

      // Notify parent
      if (onTradeSuccess) {
        onTradeSuccess();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setTradeSuccess(""), 3000);
    } catch (error) {
      console.error("Trade error:", error);
      setTradeError(error instanceof Error ? error.message : "Trade failed");
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="bg-transparent rounded-lg p-3 sm:p-4 w-full lg:max-w-[360px] lg:ml-auto border border-[#2C3F52]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-[#00C08B] rounded-lg flex items-center justify-center">
          {selectedOutcome.image || eventImage ? (
            <NextImage
              src={selectedOutcome.image || eventImage || ""}
              alt="Outcome"
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
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-white text-lg sm:text-2xl leading-tight line-clamp-2">
            {selectedOutcome.title}
          </h2>
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
        <div className="relative">
          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as "Market" | "Limit")}
            className="bg-transparent text-sm font-bold text-white cursor-pointer hover:text-gray-300 mb-2 appearance-none pr-5 outline-none"
          >
            <option value="Limit" className="bg-[#1D2B3A]">
              Limit
            </option>
            <option value="Market" className="bg-[#1D2B3A]">
              Market
            </option>
          </select>
          <span className="absolute right-0 top-0 pointer-events-none">▼</span>
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

      {/* Limit Price Input */}
      <div className="flex items-center justify-between mb-4 py-3 border-b border-gray-700">
        <span className="text-base font-medium text-[#f2f2f2]">
          Limit Price
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLimitPrice((prev) => Math.max(0.01, prev - 0.01))}
            className="w-8 h-8 rounded-lg bg-[#2C3F52] hover:bg-[#384E63] text-white text-lg font-bold transition-colors flex items-center justify-center"
          >
            −
          </button>
          <div className="bg-[#2C3F52] rounded-lg px-4 py-2 min-w-[100px] text-center">
            <span className="text-xl font-bold text-white font-mono">
              {(limitPrice * 100).toFixed(1)}¢
            </span>
          </div>
          <button
            onClick={() => setLimitPrice((prev) => Math.min(0.99, prev + 0.01))}
            className="w-8 h-8 rounded-lg bg-[#2C3F52] hover:bg-[#384E63] text-white text-lg font-bold transition-colors flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>

      {/* Shares Input */}
      <div className="flex items-center justify-between mb-4 py-3 border-b border-gray-700">
        <span className="text-base font-medium text-[#f2f2f2]">Shares</span>
        <div className="flex items-center">
          <input
            ref={inputRef}
            type="number"
            value={shares || ""}
            onChange={(e) =>
              setShares(Math.max(0, parseInt(e.target.value) || 0))
            }
            className="bg-[#2C3F52] rounded-lg px-4 py-2 text-right outline-none font-mono text-xl font-bold text-white w-[120px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="0"
          />
        </div>
      </div>

      {/* Quick Shares Buttons */}
      <div className="flex justify-center gap-2 mb-4">
        {[-100, -10, 10, 100].map((val) => (
          <button
            key={val}
            onClick={() => setShares((prev) => Math.max(0, prev + val))}
            className="px-3 py-1.5 rounded-lg border border-[#374E65] hover:bg-[#384E63] text-white text-sm font-bold transition-colors"
          >
            {val > 0 ? `+${val}` : val}
          </button>
        ))}
      </div>

      {/* Matching info */}
      {shares > 0 && (
        <div className="flex justify-end mb-4">
          <span className="text-sm text-[#00C08B]">
            ⓘ {shares.toFixed(2)} matching
          </span>
        </div>
      )}

      {/* Error/Success Messages */}
      {tradeError && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg">
          {tradeError}
        </div>
      )}
      {tradeSuccess && (
        <div className="mb-3 p-3 bg-green-500/10 border border-green-500/50 text-green-400 text-sm rounded-lg">
          {tradeSuccess}
        </div>
      )}

      {/* Balance Display - only show after mount to avoid hydration mismatch */}
      {hasMounted && user && stats && (
        <div className="mb-3 text-sm text-gray-400 text-right">
          Available:{" "}
          <span className="text-white font-semibold">
            ${stats.cashBalance.toLocaleString()}
          </span>
        </div>
      )}

      {/* Trade Button - use consistent initial state for SSR */}
      <button
        onClick={executeTrade}
        className={`w-full py-3.5 rounded-lg font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] ${
          !hasMounted || !user
            ? "bg-[#2d9cdb] hover:bg-[#238ac3]"
            : isTrading
            ? "bg-[#1a6b9c] cursor-wait"
            : "bg-[#2d9cdb] hover:bg-[#238ac3]"
        } ${shares === 0 ? "opacity-80" : ""}`}
        disabled={shares === 0 || isTrading || (hasMounted && !user)}
      >
        {!hasMounted
          ? "Trade"
          : !user
          ? "Log In to Trade"
          : isTrading
          ? "Processing..."
          : "Trade"}
      </button>

      {/* Summary - Total and To Win */}
      {shares > 0 && limitPrice > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-base text-gray-400">Total</span>
            <span className="text-xl font-mono font-bold text-[#00C08B]">
              ${tradeStats.total.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base text-gray-400 flex items-center gap-1">
              To Win <span className="text-lg">💵</span>
            </span>
            <span className="text-xl font-mono font-bold text-[#00C08B]">
              ${tradeStats.toWin.toFixed(0)}
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
