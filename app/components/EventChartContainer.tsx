"use client";

import { useEffect, useState } from "react";
import EventChart from "./EventChart";
import { PriceHistory } from "../lib/polymarket-advanced";

interface TokenInfo {
  token_id: string;
  outcome: string;
  price: number;
}

interface ChartSeries {
  name: string;
  data: PriceHistory[];
  color: string;
}

interface EventChartContainerProps {
  tokens: TokenInfo[];
}

export default function EventChartContainer({
  tokens,
}: EventChartContainerProps) {
  const [chartSeries, setChartSeries] = useState<ChartSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData(isBackground = false) {
      if (!tokens || tokens.length === 0) {
        if (mounted) setLoading(false);
        return;
      }

      if (!isBackground) setLoading(true);
      const colors = ["#00C08B", "#2E75FF", "#FFB800", "#E63757"];

      try {
        // Use batch endpoint to fetch all histories in a single request
        // Fetch from a very old timestamp to get "all time" history
        // Using 1609459200 (Jan 1, 2021) as a safe default for "all time"
        const startTs = 1609459200;
        const fidelity = 720; // 12h intervals for long history
        const markets = tokens.map((t) => t.token_id);

        const response = await fetch("/api/history/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ markets, startTs, fidelity }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch batch history");
        }

        const { results } = await response.json();

        if (!mounted) return;

        // Create a map for fast lookup
        const historyMap = new Map<string, PriceHistory[]>(
          results.map((r: { market: string; history: PriceHistory[] }) => [
            r.market,
            r.history,
          ])
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
        if (mounted && !isBackground) {
          setLoading(false);
        }
      }
    }

    fetchData(false);

    // Poll every 5 seconds for fresh data
    const interval = setInterval(() => fetchData(true), 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
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
