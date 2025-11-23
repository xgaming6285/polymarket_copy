
import { fetchEventBySlug } from "./app/lib/polymarket";
import { fetchPriceHistory } from "./app/lib/polymarket-advanced";

async function run() {
  const slug = "game-awards-game-of-the-year-2025";
  console.log(`Fetching event: ${slug}`);
  
  try {
    const event = await fetchEventBySlug(slug);
    
    if (!event) {
      console.log("Event not found");
      return;
    }
    
    console.log("Event found:", event.title);
    
    const market = event.markets?.[0];
    if (!market) {
      console.log("No market found");
      return;
    }
    
    let tokenId = "";
    console.log("clobTokenIds type:", typeof market.clobTokenIds);
    console.log("clobTokenIds value:", market.clobTokenIds);

    if (market?.clobTokenIds) {
      try {
        const ids = typeof market.clobTokenIds === "string" 
          ? JSON.parse(market.clobTokenIds) 
          : market.clobTokenIds;
        
        if (Array.isArray(ids) && ids.length > 0) {
          tokenId = ids[0];
        }
        console.log("Parsed IDs:", ids);
      } catch (e) {
        console.error("Error parsing clobTokenIds:", e);
      }
    }

    if (!tokenId && market?.tokens) {
      const yesToken =
        market?.tokens?.find((t) => t.outcome === "Yes") || market?.tokens?.[0];
      if (yesToken?.token_id) {
        tokenId = yesToken.token_id;
      }
    }
    
    console.log("Final Token ID:", tokenId);
    
    if (tokenId) {
      console.log("Fetching price history...");
      const history = await fetchPriceHistory(tokenId);
      console.log("Price history items:", history.length);
      if (history.length > 0) {
        console.log("First item:", history[0]);
        console.log("Last item:", history[history.length - 1]);
      }
    } else {
      console.log("No Token ID extracted");
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

run();

