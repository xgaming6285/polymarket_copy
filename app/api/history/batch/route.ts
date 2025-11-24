import { NextRequest, NextResponse } from "next/server";

const CLOB_API_BASE = "https://clob.polymarket.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { markets, startTs, fidelity } = body;
    
    if (!markets || !Array.isArray(markets) || markets.length === 0) {
      return NextResponse.json(
        { error: "Markets array is required" },
        { status: 400 }
      );
    }

    // Fetch all price histories in parallel
    const historyPromises = markets.map(async (market: string) => {
      const params = new URLSearchParams({
        market,
        ...(startTs && { startTs: startTs.toString() }),
        ...(fidelity && { fidelity: fidelity.toString() }),
      });
      
      const url = `${CLOB_API_BASE}/prices-history?${params.toString()}`;
      
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Use short cache to reduce API calls
          // next: { revalidate: 60 },
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error(`Failed to fetch history for ${market}: ${response.statusText}`);
          return { market, history: [] };
        }

        const data = await response.json();
        return { market, history: data.history || [] };
      } catch (error) {
        console.error(`Error fetching history for ${market}:`, error);
        return { market, history: [] };
      }
    });

    const results = await Promise.all(historyPromises);
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in batch price history fetch:", error);
    return NextResponse.json(
      { error: "Failed to fetch price histories" },
      { status: 500 }
    );
  }
}

