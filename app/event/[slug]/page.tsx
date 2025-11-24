import { notFound } from "next/navigation";
import Header from "@/app/components/Header";
import EventPageContent, {
  OutcomeItem,
} from "@/app/components/EventPageContent";
import type { Event, Market as ApiMarket } from "@/app/lib/polymarket";

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

// Helper to handle raw market data
function getMarketTokens(market: ApiMarket) {
  if (market.tokens) {
    return market.tokens.map((t) => ({
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

  let outcomes: OutcomeItem[] = [];

  if (event.markets && event.markets.length > 1) {
    // Multi-market event (Group market)
    // Collect "Yes" tokens from all markets
    outcomes = event.markets
      .flatMap((m: ApiMarket) => {
        const tokens = getMarketTokens(m);
        const yesToken = tokens.find((t) => t.outcome === "Yes");
        const noToken = tokens.find((t) => t.outcome === "No");
        if (!yesToken) return [];

        return [
          {
            id: yesToken.token_id,
            title: m.groupItemTitle || m.question || "Yes", // Use group title if available
            price: yesToken.price,
            yesTokenId: yesToken.token_id,
            noTokenId: noToken?.token_id || "",
            market: m,
          },
        ];
      })
      .sort((a: OutcomeItem, b: OutcomeItem) => b.price - a.price);
  } else if (event.markets?.[0]) {
    const market = event.markets[0];
    const tokens = getMarketTokens(market);

    // Check if binary (Yes/No)
    const isBinary =
      tokens.length === 2 && tokens.some((t) => t.outcome === "Yes");

    if (isBinary) {
      const yesToken = tokens.find((t) => t.outcome === "Yes");
      const noToken = tokens.find((t) => t.outcome === "No");
      if (yesToken) {
        outcomes = [
          {
            id: yesToken.token_id,
            title: market.question || "Yes",
            price: yesToken.price,
            yesTokenId: yesToken.token_id,
            noTokenId: noToken?.token_id || "",
            market: market,
          },
        ];
      }
    } else {
      // Categorical or other
      outcomes = tokens
        .map((t) => ({
          id: t.token_id,
          title: t.outcome,
          price: t.price,
          yesTokenId: t.token_id,
          noTokenId: "", // explicit No token might be complex
          market: market,
        }))
        .sort((a: OutcomeItem, b: OutcomeItem) => b.price - a.price);
    }
  }

  return (
    <main className="min-h-screen bg-[#1d2b3a] text-white">
      <Header />
      <EventPageContent event={event} outcomes={outcomes} />
    </main>
  );
}
