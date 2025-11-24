import { useState, useEffect, useCallback } from "react";
import { OutcomeItem } from "./EventPageContent";

interface OrderBook {
  asks: Array<{ price: string; size: string }>;
  bids: Array<{ price: string; size: string }>;
}

interface OutcomeRowProps {
  outcome: OutcomeItem;
  isSelected: boolean;
  onSelect: (outcome: OutcomeItem) => void;
}

export default function OutcomeRow({ outcome, isSelected, onSelect }: OutcomeRowProps) {
  const [yesPrice, setYesPrice] = useState<number | null>(null);
  const [noPrice, setNoPrice] = useState<number | null>(null);
  
  // Logic similar to TradePanel to fetch liquidity
  const fetchLiquidity = useCallback(async () => {
    if (!outcome.yesTokenId) return;

    try {
      const yesPromise = fetch(`/api/orderbook?tokenId=${outcome.yesTokenId}`).then(res => res.json());
      // We need to know the No token ID. 
      // In EventPageContent, outcome has noTokenId.
      const noPromise = outcome.noTokenId 
        ? fetch(`/api/orderbook?tokenId=${outcome.noTokenId}`).then(res => res.json())
        : Promise.resolve(null);

      const [yesData, noData] = await Promise.all([yesPromise, noPromise]);

      if (yesData && !yesData.error && yesData.asks && yesData.asks.length > 0) {
        // Ensure correct sorting: Asks ascending (lowest first)
        yesData.asks.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
        // Best ask for Yes
        const bestAsk = parseFloat(yesData.asks[0].price);
        setYesPrice(bestAsk);
      }

      if (noData && !noData.error && noData.asks && noData.asks.length > 0) {
        // Ensure correct sorting: Asks ascending (lowest first)
        noData.asks.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
        // Best ask for No
        const bestAsk = parseFloat(noData.asks[0].price);
        setNoPrice(bestAsk);
      }
      
    } catch (err) {
      console.error("Error fetching row liquidity", err);
    }
  }, [outcome.yesTokenId, outcome.noTokenId]);

  useEffect(() => {
    fetchLiquidity();
    const interval = setInterval(fetchLiquidity, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [fetchLiquidity]);

  // Fallback to static price if live price not available
  const displayYesPrice = yesPrice !== null ? yesPrice : outcome.price;
  // For No price, if we have live No price, use it. Otherwise derived from static price.
  const displayNoPrice = noPrice !== null ? noPrice : (1 - outcome.price);

  // Calculate probability (Mid Price) to match official site
  // Mid = (BestAsk(Yes) + BestBid(Yes)) / 2
  // BestBid(Yes) ~= 1 - BestAsk(No)
  let probability = outcome.price;
  if (yesPrice !== null && noPrice !== null) {
    probability = (yesPrice + (1 - noPrice)) / 2;
    // Clamp to 0-1
    probability = Math.max(0, Math.min(1, probability));
  }

  return (
    <div
      onClick={() => onSelect(outcome)}
      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors border ${
        isSelected
          ? "bg-[#2C3F51] border-[#00C08B]"
          : "bg-[#2C3F51] border-transparent hover:bg-[#374E65]"
      }`}
    >
      <span className="font-medium text-white">
        {outcome.title}
      </span>
      <div className="flex items-center gap-4">
        {/* Probability / Price */}
        <span className="text-white font-bold">
            {(probability * 100).toFixed(0)}%
        </span>
        
        {/* Buy Yes */}
        <button
          className="px-4 py-1.5 rounded bg-[#00C08B] hover:bg-[#00A07D] text-white text-sm font-bold transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(outcome);
          }}
        >
          Buy Yes {(displayYesPrice * 100).toFixed(1)}¢
        </button>

        {/* Buy No */}
        <button
          className="px-4 py-1.5 rounded bg-[#E63757] hover:bg-[#CC2946] text-white text-sm font-bold transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(outcome);
          }}
        >
          Buy No {(displayNoPrice * 100).toFixed(1)}¢
        </button>
      </div>
    </div>
  );
}

