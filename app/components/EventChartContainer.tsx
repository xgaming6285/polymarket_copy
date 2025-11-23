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
        const historyPromises = tokens.map((t) => {
          // Use our internal API route to avoid CORS and take advantage of Next.js caching if we enabled it
          // Default to 30 days ago
          const startTs = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
          const url = `/api/history?market=${t.token_id}&startTs=${startTs}`;
          
          return fetch(url)
            .then((res) => res.json())
            .then((data) => data.history || [])
            .catch((e) => {
              console.error(`Error fetching history for ${t.token_id}:`, e);
              return [];
            });
        });

        const histories = await Promise.all(historyPromises);

        const series = tokens.map((t, index) => ({
          name: t.outcome,
          data: histories[index] || [],
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

