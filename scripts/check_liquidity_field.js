// const fetch = require('node-fetch');

async function checkLiquidityField() {
  try {
    const query = "Chile";
    const searchRes = await fetch(`https://gamma-api.polymarket.com/events?slug=chile-presidential-election`); 
    const events = await searchRes.json();
    const event = events[0];
    const market = event.markets.find(m => m.question.includes("Kast"));
    
    console.log("Market Question:", market.question);
    console.log("API Liquidity Field:", market.liquidity);
    
    // Check Super Bowl
    const sbRes = await fetch(`https://gamma-api.polymarket.com/events?slug=super-bowl-2026-winner`);
    const sbEvents = await sbRes.json();
    if (sbEvents && sbEvents.length > 0) {
         const sbMarket = sbEvents[0].markets[0]; // Assuming first is main
         console.log("SB Market:", sbMarket.question);
         console.log("SB API Liquidity Field:", sbMarket.liquidity);
    }

  } catch (error) {
    console.error(error);
  }
}

checkLiquidityField();

