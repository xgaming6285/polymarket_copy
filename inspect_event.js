const fs = require('fs');
const data = JSON.parse(fs.readFileSync('temp_event.json', 'utf8'));
const event = data[0];

console.log("Event Title:", event.title);
console.log("Markets count:", event.markets ? event.markets.length : 0);

if (event.markets) {
  console.log("\n--- First 5 Markets ---");
  event.markets.slice(0, 5).forEach((m, i) => {
    console.log(`\nMarket ${i+1}:`);
    console.log("  Question:", m.question);
    console.log("  Group Item Title:", m.groupItemTitle);
    console.log("  Tokens:", m.tokens ? m.tokens.map(t => `${t.outcome} (${t.token_id}) Price: ${t.price}`).join(", ") : "NO TOKENS");
  });
}

