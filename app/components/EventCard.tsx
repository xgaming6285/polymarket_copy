"use client";

import { Event, Market } from "../lib/polymarket";
import { useMemo, useState } from "react";
import Image from "next/image";

// --- Helper Functions ---

const formatPercentage = (value: number): string => {
  const percentage = value * 100;
  if (percentage < 1) return "<1%";
  if (percentage > 99 && percentage < 100) return ">99%";
  // Handle 0 specifically if needed, though Math.round(0) is 0
  return `${Math.round(percentage)}%`;
};

const getOutcomes = (market: Market): string[] => {
  if (!market.outcomes) return [];
  if (Array.isArray(market.outcomes)) return market.outcomes;
  if (typeof market.outcomes === "string") {
    try {
      return JSON.parse(market.outcomes);
    } catch (e) {
      console.error("Error parsing outcomes:", e);
      return [];
    }
  }
  return [];
};

const getPrices = (market: Market) => {
  let prices: number[] = [];
  if (market.outcomePrices) {
    try {
      const parsed =
        typeof market.outcomePrices === "string"
          ? JSON.parse(market.outcomePrices)
          : market.outcomePrices;
      prices = parsed.map((p: string) => parseFloat(p));
    } catch (e) {
      console.error("Error parsing prices:", e);
    }
  }

  // Fallback to tokens if no prices
  if (prices.length === 0 && market.tokens) {
    prices = market.tokens.map((t) => (t.price ? parseFloat(t.price) : 0));
  }

  return prices;
};

const formatVolume = (volume?: string) => {
  if (!volume) return "$0";
  const num = parseFloat(volume);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(0)}m`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toFixed(0)}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "No end date";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Ended";
  if (diffDays === 0) return "Ends today";
  if (diffDays === 1) return "Ends tomorrow";
  if (diffDays < 7) return `${diffDays}d left`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// --- Sub-components ---

const CircularProgress = ({
  value,
  label,
}: {
  value: number;
  label?: string;
}) => {
  const radius = 29;
  // Angles in degrees (Standard SVG: 0 is Right, 90 is Down)
  // Start at 170 (Left-Bottom)
  // End at 10 (Right-Bottom, equivalent to 370)
  const startAngle = 170;

  // Calculate arc path
  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Map percentage to angle
  // 0% -> 170
  // 100% -> 370
  const totalSpan = 200;
  const progressAngle = 170 + value * totalSpan;

  const createPath = (end: number) => {
    const start = polarToCartesian(0, 0, radius, startAngle);
    const finish = polarToCartesian(0, 0, radius, end);
    const span = end - startAngle;
    const largeArc = span <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${finish.x} ${finish.y}`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-[58px] h-[60px]">
      <div className="absolute inset-0 overflow-visible flex justify-center">
        <svg
          width="58"
          height="34"
          viewBox="-29 -29 58 34"
          style={{ overflow: "visible" }}
        >
          {/* Background Track */}
          <path
            d={createPath(370)}
            fill="none"
            className="stroke-[#4d657c]"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Progress Track */}
          <path
            d={createPath(progressAngle)}
            fill="none"
            className={value > 0.5 ? "stroke-[#00C08B]" : "stroke-[#E65050]"}
            strokeOpacity="0.811"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex flex-col items-center justify-center z-10 mt-1">
        <p
          className="font-medium text-[18px] text-[#f2f2f2] text-center leading-none"
          style={{ fontFamily: "'Open Sauce One', sans-serif" }}
        >
          {label || formatPercentage(value)}
        </p>
        <p
          className="font-bold text-[#899cb2] text-[11px] text-center line-clamp-2 leading-none mt-1.5"
          style={{ fontFamily: "'Open Sauce One', sans-serif" }}
        >
          chance
        </p>
      </div>
    </div>
  );
};

const GroupedBinaryRow = ({
  label,
  yesPrice,
}: {
  label: string;
  yesPrice: number;
}) => {
  const [hover, setHover] = useState<"yes" | "no" | null>(null);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-300 truncate flex-1 mr-2">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-white font-bold text-base">
          {formatPercentage(yesPrice)}
        </span>
        <div className="flex gap-1">
          <button
            onMouseEnter={() => setHover("yes")}
            onMouseLeave={() => setHover(null)}
            className={`w-11 h-7 flex items-center justify-center bg-[#0E4F43]/40 hover:bg-[#0E4F43]/60 rounded text-xs font-bold transition-colors ${
              hover === "yes" ? "text-white" : "text-[#00C08B]"
            }`}
          >
            {hover === "yes" ? formatPercentage(yesPrice) : "Yes"}
          </button>
          <button
            onMouseEnter={() => setHover("no")}
            onMouseLeave={() => setHover(null)}
            className={`w-11 h-7 flex items-center justify-center bg-[#4F181E]/40 hover:bg-[#4F181E]/60 rounded text-xs font-bold transition-colors ${
              hover === "no" ? "text-white" : "text-[#E65050]"
            }`}
          >
            {hover === "no" ? formatPercentage(1 - yesPrice) : "No"}
          </button>
        </div>
      </div>
    </div>
  );
};

const BinaryContent = () => {
  // Binary content just shows buttons, prices are in the gauge
  return (
    <div className="mt-auto">
      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button className="bg-[#0E4F43]/40 hover:bg-[#0E4F43]/60 text-[#00C08B] py-2 rounded text-base font-bold transition-colors">
          Yes
        </button>
        <button className="bg-[#4F181E]/40 hover:bg-[#4F181E]/60 text-[#E65050] py-2 rounded text-base font-bold transition-colors">
          No
        </button>
      </div>
    </div>
  );
};

const VersusContent = ({ market }: { market: Market }) => {
  const prices = getPrices(market);
  const outcomes = getOutcomes(market);
  const outcome1 = outcomes[0] || "Team 1";
  const outcome2 = outcomes[1] || "Team 2";
  const price1 = prices[0] || 0;
  const price2 = prices[1] || 0;

  return (
    <div className="mt-auto space-y-3">
      {/* Team 1 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 truncate pr-2">{outcome1}</span>
        <span className="text-[#00C08B] font-medium">
          {formatPercentage(price1)}
        </span>
      </div>
      {/* Team 2 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300 truncate pr-2">{outcome2}</span>
        <span className="text-[#E65050] font-medium">
          {formatPercentage(price2)}
        </span>
      </div>

      {/* Bar */}
      <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-[#1D2B3A]">
        <div className="bg-[#00C08B]" style={{ width: `${price1 * 100}%` }} />
        <div className="bg-[#E65050]" style={{ width: `${price2 * 100}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="bg-[#1D2B3A] hover:bg-[#2C3F52] text-blue-400 py-1.5 rounded text-xs font-medium transition-colors truncate">
          {outcome1}
        </button>
        <button className="bg-[#1D2B3A] hover:bg-[#2C3F52] text-red-400 py-1.5 rounded text-xs font-medium transition-colors truncate">
          {outcome2}
        </button>
      </div>
    </div>
  );
};

const MultipleChoiceContent = ({ market }: { market: Market }) => {
  const prices = getPrices(market);
  const outcomes = getOutcomes(market);

  // Sort by probability descending
  const sortedIndices = outcomes
    .map((_, i) => i)
    .sort((a, b) => (prices[b] || 0) - (prices[a] || 0))
    .slice(0, 3); // Top 3 outcomes

  return (
    <div className="mt-auto space-y-2">
      {sortedIndices.map((idx) => {
        const prob = prices[idx] || 0;
        return (
          <div key={idx} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-1 h-4 bg-gray-600 rounded-full" />
              <span className="text-gray-300 truncate">{outcomes[idx]}</span>
            </div>
            <span className="text-white font-medium ml-2">
              {formatPercentage(prob)}
            </span>
          </div>
        );
      })}
      {outcomes.length > 3 && (
        <div className="text-[10px] text-gray-500 pl-3">
          + {outcomes.length - 3} more
        </div>
      )}
    </div>
  );
};

const GroupedContent = ({ markets }: { markets: Market[] }) => {
  return (
    <div className="mt-auto flex flex-col gap-2 overflow-y-auto max-h-[72px] pr-0 scrollbar-hide translate-y-1">
      {markets.map((market, idx) => {
        const prices = getPrices(market);
        // Check if binary (case insensitive)
        const outcomes = getOutcomes(market);
        const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");
        const noIndex = outcomes.findIndex((o) => o.toLowerCase() === "no");
        const isBinary = yesIndex !== -1 && noIndex !== -1;

        let displayLabel =
          market.groupItemTitle || market.question || `Item ${idx + 1}`;
        // Clean up label if it repeats the event title or similar?
        // Often groupItemTitle is good.
        if (displayLabel.length > 25)
          displayLabel = displayLabel.substring(0, 25) + "...";

        if (isBinary) {
          const yesPrice = prices[yesIndex] || 0;
          return (
            <GroupedBinaryRow
              key={market.condition_id || idx}
              label={displayLabel}
              yesPrice={yesPrice}
            />
          );
        } else {
          // Categorical sub-market
          const maxPrice = Math.max(...prices);
          return (
            <div
              key={market.condition_id || idx}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-300 truncate mr-2">
                {displayLabel}
              </span>
              <span className="text-white font-medium text-base">
                {formatPercentage(maxPrice)}
              </span>
            </div>
          );
        }
      })}
    </div>
  );
};

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [imageError, setImageError] = useState(false);

  const validMarkets = useMemo(() => {
    const active = (event.markets || []).filter(
      (m) => (m.active || (m.volume && parseFloat(m.volume) > 0)) && !m.closed
    );

    // Sort by price descending
    return active.sort((a, b) => {
      const pricesA = getPrices(a);
      const outcomesA = getOutcomes(a);
      const yesIndexA = outcomesA.findIndex((o) => o.toLowerCase() === "yes");
      const priceA =
        yesIndexA !== -1 ? pricesA[yesIndexA] : Math.max(...pricesA, 0);

      const pricesB = getPrices(b);
      const outcomesB = getOutcomes(b);
      const yesIndexB = outcomesB.findIndex((o) => o.toLowerCase() === "yes");
      const priceB =
        yesIndexB !== -1 ? pricesB[yesIndexB] : Math.max(...pricesB, 0);

      return (priceB || 0) - (priceA || 0);
    });
  }, [event.markets]);

  const { variant, marketsToDisplay } = useMemo(() => {
    // Grouped Variant: Multiple markets (e.g. Sports Dailies, Series)
    if (validMarkets.length > 1) {
      return {
        variant: "grouped" as const,
        marketsToDisplay: validMarkets.slice(0, 3),
      };
    }

    // Single Market Variants
    const market = validMarkets[0];
    if (!market) return { variant: "unknown" as const, marketsToDisplay: [] };

    const outcomes = getOutcomes(market);
    const isBinary =
      outcomes.length === 2 &&
      outcomes.some((o) => o.toLowerCase() === "yes") &&
      outcomes.some((o) => o.toLowerCase() === "no");

    if (isBinary) {
      return { variant: "binary" as const, marketsToDisplay: [market] };
    }

    if (outcomes.length === 2) {
      return { variant: "versus" as const, marketsToDisplay: [market] };
    }

    return { variant: "multiple_choice" as const, marketsToDisplay: [market] };
  }, [validMarkets]);

  const primaryMarket = marketsToDisplay[0];
  const prices = primaryMarket ? getPrices(primaryMarket) : [];
  const outcomes = primaryMarket ? getOutcomes(primaryMarket) : [];
  const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === "yes");

  let displayValue = 0;
  let showMeter = false;

  if (variant === "binary") {
    displayValue = prices[yesIndex] || 0;
    showMeter = true;
  }

  return (
    <div className="bg-[#2A3F54] rounded-lg p-4 hover:bg-[#324858] transition-all duration-200 cursor-pointer h-full flex flex-col border border-transparent hover:border-gray-700 shadow-lg relative overflow-hidden group">
      {/* Top Section: Flex Container for Icon/Title and Meter */}
      <div className="flex items-start justify-between mb-2.5 relative z-10">
        {/* Left Side: Icon & Title */}
        <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
          {(event.icon || event.image) && !imageError && (
            <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-[#1D2B3A] ring-2 ring-[#1D2B3A] group-hover:ring-gray-600 transition-all relative">
              <Image
                src={(event.icon || event.image) as string}
                alt={event.title}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized
              />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[32px]">
            {/* Badges */}
            {event.new && (
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-500/20 text-blue-300 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  New
                </span>
              </div>
            )}

            <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-2 group-hover:text-blue-200 transition-colors">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Right Side: Meter (Only for Binary) */}
        {showMeter && (
          <div className="relative shrink-0">
            <CircularProgress value={displayValue} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grow flex flex-col justify-end mb-2.5 relative z-10 min-h-[24px]">
        {variant === "binary" && <BinaryContent />}
        {variant === "versus" && <VersusContent market={marketsToDisplay[0]} />}
        {variant === "multiple_choice" && (
          <MultipleChoiceContent market={marketsToDisplay[0]} />
        )}
        {variant === "grouped" && <GroupedContent markets={validMarkets} />}
        {variant === "unknown" && <div className="h-4" />}
      </div>

      {/* Footer */}
      <div className="pt-2.5 flex items-center justify-between text-xs text-gray-400 relative z-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-gray-300">
            {formatVolume(event.volume)}{" "}
            <span className="text-gray-500 font-normal">Vol.</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>{formatDate(event.end_date_iso)}</span>
        </div>
      </div>

      {/* Hover Gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
