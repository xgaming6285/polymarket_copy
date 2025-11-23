const fs = require('fs');
const data = JSON.parse(fs.readFileSync('temp_event.json', 'utf8'));
const event = data[0];
const market = event.markets[0];
console.log(JSON.stringify(market, null, 2));

