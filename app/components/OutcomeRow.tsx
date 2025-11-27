import { useState, useEffect, useCallback } from "react";
import { OutcomeItem } from "./EventPageContent";

interface Order {
  price: string;
  size: string;
}

// interface OrderBook {
//   asks: Array<{ price: string; size: string }>;
//   bids: Array<{ price: string; size: string }>;
// }

interface OutcomeRowProps {
  outcome: OutcomeItem;
  isSelected: boolean;
  onSelect: (outcome: OutcomeItem) => void;
  selectedSide?: "Yes" | "No";
  onSideSelect?: (side: "Yes" | "No") => void;
  isFirst?: boolean;
  eventImage?: string;
}

export default function OutcomeRow({
  outcome,
  isSelected,
  onSelect,
  selectedSide,
  onSideSelect,
  isFirst = false,
  eventImage,
}: OutcomeRowProps) {
  const [yesPrice, setYesPrice] = useState<number | null>(null);
  const [noPrice, setNoPrice] = useState<number | null>(null);

  // Logic similar to TradePanel to fetch liquidity
  const fetchLiquidity = useCallback(async () => {
    if (!outcome.yesTokenId) return;

    try {
      const yesPromise = fetch(
        `/api/orderbook?tokenId=${outcome.yesTokenId}`
      ).then((res) => res.json());
      // We need to know the No token ID.
      // In EventPageContent, outcome has noTokenId.
      const noPromise = outcome.noTokenId
        ? fetch(`/api/orderbook?tokenId=${outcome.noTokenId}`).then((res) =>
            res.json()
          )
        : Promise.resolve(null);

      const [yesData, noData] = await Promise.all([yesPromise, noPromise]);

      if (
        yesData &&
        !yesData.error &&
        yesData.asks &&
        yesData.asks.length > 0
      ) {
        // Ensure correct sorting: Asks ascending (lowest first)
        yesData.asks.sort(
          (a: Order, b: Order) => parseFloat(a.price) - parseFloat(b.price)
        );
        // Best ask for Yes
        const bestAsk = parseFloat(yesData.asks[0].price);
        setYesPrice(bestAsk);
      }

      if (noData && !noData.error && noData.asks && noData.asks.length > 0) {
        // Ensure correct sorting: Asks ascending (lowest first)
        noData.asks.sort(
          (a: Order, b: Order) => parseFloat(a.price) - parseFloat(b.price)
        );
        // Best ask for No
        const bestAsk = parseFloat(noData.asks[0].price);
        setNoPrice(bestAsk);
      }
    } catch (err) {
      console.error("Error fetching row liquidity", err);
    }
  }, [outcome.yesTokenId, outcome.noTokenId]);

  useEffect(() => {
    // eslint-disable-next-line
    void fetchLiquidity();
    const interval = setInterval(fetchLiquidity, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [fetchLiquidity]);

  // Fallback to static price if live price not available
  const displayYesPrice = yesPrice !== null ? yesPrice : outcome.price;
  // For No price, if we have live No price, use it. Otherwise derived from static price.
  const displayNoPrice = noPrice !== null ? noPrice : 1 - outcome.price;

  // Calculate probability (Mid Price) to match official site
  // Mid = (BestAsk(Yes) + BestBid(Yes)) / 2
  // BestBid(Yes) ~= 1 - BestAsk(No)
  let probability = outcome.price;
  if (yesPrice !== null && noPrice !== null) {
    probability = (yesPrice + (1 - noPrice)) / 2;
    // Clamp to 0-1
    probability = Math.max(0, Math.min(1, probability));
  }

  const imageSrc = outcome.market?.icon || outcome.market?.image;
  // Only show image if it exists and is NOT the same as the main event image (to avoid redundancy)
  const showImage = imageSrc && imageSrc !== eventImage;

  return (
    <div
      onClick={() => onSelect(outcome)}
      className={`grid grid-cols-[1fr_140px_1fr] items-center p-4 cursor-pointer transition-colors border-b border-[#374E65] bg-transparent hover:bg-[#263445] ${isFirst ? "border-t" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {showImage && (
            <div className="relative w-10 h-10 shrink-0">
                <img 
                    src={imageSrc} 
                    alt={outcome.title}
                    className="w-full h-full object-cover rounded-md"
                />
            </div>
        )}
        <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-base truncate">{outcome.title}</span>
            {/* Volume placeholder if available in outcome, otherwise hidden */}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <span className="text-white font-bold text-3xl">
        {(probability * 100).toFixed(0)}%
        </span>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {/* Buy Yes */}
        <button
          className={`min-w-[120px] px-4 py-4 rounded-[4px] text-sm font-bold transition-colors flex justify-between items-center ${
            isSelected && selectedSide === "Yes"
              ? "bg-[#43c773] text-white"
              : "bg-[oklab(0.737847_-0.14654_0.0786822_/_0.25)] text-[#3dac69] hover:bg-[oklab(0.737847_-0.14654_0.0786822_/_0.35)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(outcome);
            onSideSelect?.("Yes");
          }}
        >
          <span>Buy Yes</span>
          <span className="opacity-90">{(displayYesPrice * 100).toFixed(1)}¢</span>
        </button>

        {/* Buy No */}
        <button
          className={`min-w-[120px] px-4 py-4 rounded-[4px] text-sm font-bold transition-colors flex justify-between items-center ${
            isSelected && selectedSide === "No"
              ? "bg-[#e13737] text-white"
              : "bg-[oklab(0.599883_0.185508_0.0907_/_0.15)] text-[#c03538] hover:bg-[oklab(0.599883_0.185508_0.0907_/_0.25)]"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(outcome);
            onSideSelect?.("No");
          }}
        >
          <span>Buy No</span>
          <span className="opacity-90">{(displayNoPrice * 100).toFixed(1)}¢</span>
        </button>
      </div>
    </div>
  );
}
