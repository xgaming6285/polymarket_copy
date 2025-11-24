"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import NextImage from "next/image";

interface OrderBook {
  asks: Array<{ price: string; size: string }>;
  bids: Array<{ price: string; size: string }>;
}

interface TradePanelProps {
  selectedOutcome: {
    title: string;
    price: number;
    yesTokenId: string;
    noTokenId: string;
    market: any;
  };
  eventImage?: string;
}

export default function TradePanel({ selectedOutcome, eventImage }: TradePanelProps) {
  const [tradeType, setTradeType] = useState<"Buy" | "Sell">("Buy"); // Tabs
  const [side, setSide] = useState<"Yes" | "No">("Yes"); // Selected side
  const [amount, setAmount] = useState<number>(0);
  
  const [currentOrderBook, setCurrentOrderBook] = useState<OrderBook | null>(null);
  const [opposingOrderBook, setOpposingOrderBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when outcome changes
  useEffect(() => {
    setAmount(0);
    setSide("Yes");
    setTradeType("Buy");
  }, [selectedOutcome.yesTokenId]); // Use ID to track change

  // Determine token IDs based on selection
  const currentTokenId = side === "Yes" ? selectedOutcome.yesTokenId : selectedOutcome.noTokenId;
  const opposingTokenId = side === "Yes" ? selectedOutcome.noTokenId : selectedOutcome.yesTokenId;

  const fetchLiquidity = useCallback(async () => {
    if (!currentTokenId) return;

    setLoading(true);
    setError("");
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
      
      // Ensure correct sorting: Asks ascending (lowest first), Bids descending (highest first)
      if (currentData.asks) currentData.asks.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
      if (currentData.bids) currentData.bids.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
      
      setCurrentOrderBook(currentData);

      if (opposingData && !opposingData.error) {
        // Ensure correct sorting for opposing book too
        if (opposingData.asks) opposingData.asks.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
        if (opposingData.bids) opposingData.bids.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
        setOpposingOrderBook(opposingData);
      }
    } catch (err) {
      console.error(err);
      // setError("Failed to load liquidity"); // Suppress for now to avoid UI clutter
    } finally {
      setLoading(false);
    }
  }, [currentTokenId, opposingTokenId]);

  useEffect(() => {
    fetchLiquidity();
    const interval = setInterval(fetchLiquidity, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [fetchLiquidity]);


  // Helper to calculate max buy amount and potential winnings
  // Adapted from TradeModal
  const calculateStats = useMemo(() => {
    // ... calculation logic ...
    // For brevity, basic implementation
    return {
        shares: 0,
        avgPrice: 0,
        maxBuy: 0
    };
  }, [amount, currentOrderBook, opposingOrderBook]);
  
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
  const { yesBook, noBook } = useMemo(() => {
    if (side === "Yes") {
      return { yesBook: currentOrderBook, noBook: opposingOrderBook };
    } else {
      return { yesBook: opposingOrderBook, noBook: currentOrderBook };
    }
  }, [side, currentOrderBook, opposingOrderBook]);

  const yesPrice = useMemo(() => {
    if (tradeType === "Buy") {
      // Buying Yes -> Ask Price
      if (yesBook?.asks?.[0]) return parseFloat(yesBook.asks[0].price);
    } else {
      // Selling Yes -> Bid Price
      if (yesBook?.bids?.[0]) return parseFloat(yesBook.bids[0].price);
    }
    return selectedOutcome.price; // Fallback
  }, [tradeType, yesBook, selectedOutcome.price]);

  const noPrice = useMemo(() => {
    if (tradeType === "Buy") {
      // Buying No -> Ask Price
      if (noBook?.asks?.[0]) return parseFloat(noBook.asks[0].price);
    } else {
      // Selling No -> Bid Price
      if (noBook?.bids?.[0]) return parseFloat(noBook.bids[0].price);
    }
    return 1 - selectedOutcome.price; // Fallback
  }, [tradeType, noBook, selectedOutcome.price]);

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
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
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
                className={`pb-3 text-lg font-bold transition-colors ${tradeType === "Buy" ? "text-white border-b-2 border-white" : "text-gray-400 hover:text-gray-300"}`}
                onClick={() => setTradeType("Buy")}
            >
                Buy
            </button>
            <button 
                className={`pb-3 text-lg font-bold transition-colors ${tradeType === "Sell" ? "text-white border-b-2 border-white" : "text-gray-400 hover:text-gray-300"}`}
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
            <span className={`text-xl font-bold ${side === "Yes" ? "text-white" : "text-[#818a95]"}`}>
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
            <span className={`text-xl font-bold ${side === "No" ? "text-white" : "text-[#818a95]"}`}>
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
                  onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-transparent text-right outline-none font-mono text-5xl font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors placeholder-[#788089]"
                  placeholder="0"
                  style={{ 
                      width: `${Math.max(1, (amount || "").toString().length) + (amount === 0 ? 0 : 0)}ch`,
                      color: amount > 0 ? "#ffffff" : "#788089"
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
            onClick={() => setAmount(maxBuyAmount)} // Max available
            className="px-[12px] py-0 h-[32px] rounded-lg bg-[#2C3F52] hover:bg-[#384E63] text-white text-[12px] font-bold transition-colors flex items-center justify-center"
        >
            Max
        </button>
      </div>

      {/* Trade Button */}
      <button
        className={`w-full py-3.5 rounded-lg font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] bg-[#2d9cdb] hover:bg-[#238ac3] ${amount === 0 ? "opacity-80" : ""}`}
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
                  <span className={`${side === "Yes" ? "text-[#00C08B]" : "text-[#E63757]"} font-mono`}>
                      ${potentialWinnings.toFixed(2)} ({(potentialWinnings / amount * 100 - 100).toFixed(0)}%)
                  </span>
              </div>
          </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
            By trading, you agree to the <a href="#" className="underline">Terms of Use</a>.
        </p>
      </div>
    </div>
  );
}

