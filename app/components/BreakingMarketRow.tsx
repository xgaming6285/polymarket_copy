import { BreakingMarket } from "@/app/lib/breaking";
import Image from "next/image";
import Link from "next/link";

interface BreakingMarketRowProps {
  market: BreakingMarket;
  rank: number;
}

export default function BreakingMarketRow({ market, rank }: BreakingMarketRowProps) {
  // Calculate sparkline path
  const width = 120;
  const height = 40;
  
  const data = market.history || [];
  
  let path = "";
  let color = "#10b981"; // Default green
  
  if (data.length > 1) {
    const minTime = Math.min(...data.map(d => d.t));
    const maxTime = Math.max(...data.map(d => d.t));
    const minPrice = Math.min(...data.map(d => d.p));
    const maxPrice = Math.max(...data.map(d => d.p));
    
    // Determine color based on trend (start vs end)
    const startPrice = data[0].p;
    const endPrice = data[data.length - 1].p;
    if (endPrice < startPrice) {
        color = "#ef4444"; // Red for down
    }

    const points = data.map(d => {
        const x = ((d.t - minTime) / (maxTime - minTime)) * width;
        // Invert Y because SVG 0 is top
        // Add some padding/scaling so it doesn't touch edges strictly if flat
        let normalizedPrice = 0.5;
        if (maxPrice !== minPrice) {
            normalizedPrice = (d.p - minPrice) / (maxPrice - minPrice);
        }
        const y = height - (normalizedPrice * height); 
        return `${x},${y}`;
    });
    
    path = `M ${points.join(" L ")}`;
  }

  // Format percentage change
  const isPositive = market.livePriceChange >= 0;
  const changeColor = isPositive ? "text-[#10b981]" : "text-[#ef4444]"; // Green or Red

  const eventSlug = market.events?.[0]?.slug;
  const href = eventSlug ? `/event/${eventSlug}` : "#";

  return (
    <Link href={href} className="block group">
      <div className="flex items-center gap-4 py-4 border-b border-[#2A3F54] hover:bg-[#2A3F54]/30 transition-colors px-2 rounded-lg">
        <span className="text-gray-400 font-mono w-6 text-center">{rank}</span>
        
        <div className="relative w-12 h-12 shrink-0">
            {market.image ? (
                <Image 
                    src={market.image} 
                    alt={market.question}
                    fill
                    className="object-cover rounded-md"
                />
            ) : (
                <div className="w-full h-full bg-gray-700 rounded-md" />
            )}
        </div>
        
        <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate pr-4">{market.question}</h3>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-white">
                    {Math.round(market.currentPrice * 100)}%
                </span>
                <span className={`text-sm font-medium ${changeColor}`}>
                    {isPositive ? "↗" : "↘"} {Math.abs(market.livePriceChange)}%
                </span>
            </div>
        </div>

        <div className="w-[120px] h-[40px] shrink-0">
            {path && (
                <svg width={width} height={height} className="overflow-visible">
                    <path 
                        d={path} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="2" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </div>

        <div className="text-gray-400 px-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </div>
      </div>
    </Link>
  );
}

