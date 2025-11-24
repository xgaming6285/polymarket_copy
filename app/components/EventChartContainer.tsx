"use client";

import { useEffect, useState } from "react";
import EventChart from "./EventChart";
import { PriceHistory } from "../lib/polymarket-advanced";

interface TokenInfo {
  token_id: string;
  outcome: string;
  price: number;
}

interface EventChartContainerProps {
  tokens: TokenInfo[];
}

export default function EventChartContainer({ tokens }: EventChartContainerProps) {
  const [chartSeries, setChartSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!tokens || tokens.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const colors = ["#00C08B", "#2E75FF", "#FFB800", "#E63757"];
      
      try {
        // Use batch endpoint to fetch all histories in a single request
        // Reduced to 7 days for faster loading
        const startTs = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
        const markets = tokens.map((t) => t.token_id);
        
        const response = await fetch('/api/history/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ markets, startTs }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch batch history');
        }

        const { results } = await response.json();
        
        // Create a map for fast lookup
        const historyMap = new Map(
          results.map((r: { market: string; history: any[] }) => [r.market, r.history])
        );

        const series = tokens.map((t, index) => ({
          name: t.outcome,
          data: historyMap.get(t.token_id) || [],
          color: colors[index % colors.length],
        }));

        setChartSeries(series);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tokens]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!chartSeries.some((s) => s.data.length > 0)) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No price history available
      </div>
    );
  }

  return <EventChart series={chartSeries} />;
}

