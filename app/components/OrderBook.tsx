
"use client";

import { OrderBookSummary } from "../lib/polymarket-advanced";

interface OrderBookProps {
  data: OrderBookSummary;
  tokenId: string;
}

export default function OrderBook({ data, tokenId }: OrderBookProps) {
  const { bids, asks } = data;

  // Sort asks ascending (lowest price first) and take top 5
  const sortedAsks = [...asks].sort((a, b) => parseFloat(a.price) - parseFloat(b.price)).slice(0, 5).reverse();
  
  // Sort bids descending (highest price first) and take top 5
  const sortedBids = [...bids].sort((a, b) => parseFloat(b.price) - parseFloat(a.price)).slice(0, 5);

  return (
    <div className="w-full text-xs font-mono">
      <div className="grid grid-cols-3 text-gray-500 mb-1 px-1">
        <div className="text-left">Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>
      
      {/* Asks (Sells) - Red */}
      <div className="flex flex-col-reverse">
        {sortedAsks.map((ask, i) => {
            const price = parseFloat(ask.price);
            const size = parseFloat(ask.size);
            const total = price * size;
            return (
                <div key={`ask-${i}`} className="grid grid-cols-3 hover:bg-red-900/20 px-1 py-0.5 cursor-pointer text-[#E65050]">
                    <div className="text-left">{price.toFixed(2)}¢</div>
                    <div className="text-right text-gray-300">{size.toFixed(0)}</div>
                    <div className="text-right text-gray-400">${total.toFixed(2)}</div>
                </div>
            );
        })}
      </div>

      <div className="border-t border-gray-700 my-1"></div>

      {/* Bids (Buys) - Green */}
      <div>
        {sortedBids.map((bid, i) => {
             const price = parseFloat(bid.price);
             const size = parseFloat(bid.size);
             const total = price * size;
             return (
                <div key={`bid-${i}`} className="grid grid-cols-3 hover:bg-green-900/20 px-1 py-0.5 cursor-pointer text-[#00C08B]">
                    <div className="text-left">{price.toFixed(2)}¢</div>
                    <div className="text-right text-gray-300">{size.toFixed(0)}</div>
                    <div className="text-right text-gray-400">${total.toFixed(2)}</div>
                </div>
             );
        })}
      </div>
    </div>
  );
}

