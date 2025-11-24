import { fetchOrderBook } from "@/app/lib/polymarket-advanced";
import Image from "next/image";
import { notFound } from "next/navigation";
import EventChartContainer from "@/app/components/EventChartContainer";
import OrderBook from "@/app/components/OrderBook";
import Header from "@/app/components/Header";
import type { Event } from "@/app/lib/polymarket";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

// Fetch directly from Gamma API to avoid internal API route issues on Vercel
async function fetchEventBySlugDirect(slug: string): Promise<Event | null> {
  try {
    const url = `https://gamma-api.polymarket.com/events?slug=${slug}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch event: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    return Array.isArray(data) ? data[0] || null : null;
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }
}

interface ParsedToken {
  token_id: string;
  outcome: string;
  price: number;
}

// Helper to handle raw market data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMarketTokens(market: any): ParsedToken[] {
  if (market.tokens) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return market.tokens.map((t: any) => ({
      token_id: t.token_id,
      outcome: t.outcome,
      price: parseFloat(t.price || "0"),
    }));
  }

  try {
    const outcomes =
      typeof market.outcomes === "string"
        ? JSON.parse(market.outcomes)
        : market.outcomes;
    const clobTokenIds =
      typeof market.clobTokenIds === "string"
        ? JSON.parse(market.clobTokenIds)
        : market.clobTokenIds;
    const prices =
      typeof market.outcomePrices === "string"
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices;

    if (Array.isArray(outcomes) && Array.isArray(clobTokenIds)) {
      return outcomes.map((outcome: string, index: number) => ({
        token_id: clobTokenIds[index],
        outcome,
        price: parseFloat(prices?.[index] || "0"),
      }));
    }
    return [];
  } catch (e) {
    console.error("Error parsing market tokens:", e);
    return [];
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await fetchEventBySlugDirect(slug);

  if (!event) {
    notFound();
  }

  // Default to the first market for now
  const market = event.markets?.[0];

  // Identify tokens to chart (Top 4 by price)
  let tokensToChart: { token_id: string; outcome: string; price: number }[] =
    [];

  if (event.markets && event.markets.length > 1) {
    // Multi-market event (Group market)
    // Collect "Yes" tokens from all markets
    const candidates = event.markets.flatMap((m) => {
      const tokens = getMarketTokens(m);
      const yesToken = tokens.find((t) => t.outcome === "Yes");
      if (!yesToken) return [];

      return [
        {
          token_id: yesToken.token_id,
          outcome: m.groupItemTitle || m.question || "Yes", // Use group title if available
          price: yesToken.price,
        },
      ];
    });

    // Sort by price descending and take top 4
    tokensToChart = candidates.sort((a, b) => b.price - a.price).slice(0, 4);
  } else if (market) {
    const tokens = getMarketTokens(market);
    // Single market event
    // Sort tokens by price descending
    const sortedTokens = [...tokens].sort((a, b) => {
      return b.price - a.price;
    });

    tokensToChart = sortedTokens.slice(0, 4).map((t) => ({
      token_id: t.token_id,
      outcome: t.outcome,
      price: t.price,
    }));
  }

  console.log("Tokens to chart:", JSON.stringify(tokensToChart, null, 2));

  const topTokenId = tokensToChart[0]?.token_id;
  const orderBookPromise = topTokenId
    ? fetchOrderBook(topTokenId).catch(() => null)
    : Promise.resolve(null);

  const orderBook = await orderBookPromise;

  return (
    <main className="min-h-screen bg-[#1d2b3a] text-white">
      <Header />
      <div className="px-[6%] py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex gap-3 items-start">
            {event.image && (
              <div className="relative w-[64px] h-[64px] shrink-0">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover rounded-lg"
                  sizes="100vw"
                />
              </div>
            )}
            <h1
              className="font-bold"
              style={{
                fontFamily: '"Open Sauce One", sans-serif',
                fontSize: "24px",
                lineHeight: "1.3",
                marginTop: "14px",
              }}
            >
              {event.title}
            </h1>
          </div>
          <div
            className="flex items-center gap-1 mt-2"
            style={{
              color: "#899cb2",
              fontFamily: '"Open Sauce One", sans-serif',
              fontSize: "14px",
            }}
          >
            <svg
              height="18"
              width="18"
              viewBox="0 0 18 18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g fill="currentColor">
                <path
                  d="M9.5,12.25s0,2.938,3.75,4H4.75c3.75-1.062,3.75-4,3.75-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                ></path>
                <path
                  d="M5.286,9C1.469,9,1.75,3.75,1.75,3.75H3.987"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                ></path>
                <path
                  d="M12.714,9c3.818,0,3.536-5.25,3.536-5.25h-2.237"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                ></path>
                <path
                  d="M14,1.75c-.625,6.531-2.281,10.219-4.75,10.5h-.25s-.25,0-.25,0c-2.469-.281-4.125-3.969-4.75-10.5H14Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                ></path>
              </g>
            </svg>
            {event.volume && parseFloat(event.volume) > 0 && (
              <span>${parseFloat(event.volume).toLocaleString()} Vol.</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-transparent rounded-lg h-[480px]">
              <EventChartContainer tokens={tokensToChart} />
            </div>

            {/* Outcomes List */}
            <div className="flex flex-col gap-2">
              {tokensToChart.map((token) => (
                <div
                  key={token.token_id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#2C3F51] hover:bg-[#374E65] transition-colors cursor-pointer"
                >
                  <span className="font-medium text-white">
                    {token.outcome}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#00C08B] font-bold">
                      {(token.price * 100).toFixed(0)}%
                    </span>
                    <button className="px-4 py-1.5 rounded bg-[#00C08B] hover:bg-[#00A07D] text-white text-sm font-bold transition-colors">
                      Buy Yes {(token.price * 100).toFixed(1)}¢
                    </button>
                    <button className="px-4 py-1.5 rounded bg-[#E63757] hover:bg-[#CC2946] text-white text-sm font-bold transition-colors">
                      Buy No {(100 - token.price * 100).toFixed(1)}¢
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar - Order Book & Trading */}
          <div className="space-y-6">
            <div className="bg-[#1A222C] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Order Book</h2>
              {orderBook && topTokenId ? (
                <OrderBook data={orderBook} tokenId={topTokenId} />
              ) : (
                <div className="text-gray-400 text-center py-8">
                  Order book data unavailable
                </div>
              )}
            </div>

            <div className="bg-[#1A222C] rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Trade</h2>
                <button className="bg-[#00C08B] hover:bg-[#00A07D] text-white font-bold py-2 px-4 rounded transition-colors">
                  Log In to Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
