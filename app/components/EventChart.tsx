"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { PriceHistory } from "../lib/polymarket-advanced";

interface ChartSeries {
  id?: string;
  name: string;
  data: PriceHistory[];
  color: string;
}

interface EventChartProps {
  series: ChartSeries[];
}

export default function EventChart({ series }: EventChartProps) {
  // Merge data based on timestamp
  const timestampMap = useMemo(() => {
    const map = new Map<number, Record<string, number>>();

    if (!series || series.length === 0) return map;

    series.forEach((s, index) => {
      if (!s.data) return;
      const key = `series_${index}`;
      s.data.forEach((point) => {
        const time = point.t * 1000; // Convert to ms
        if (!map.has(time)) {
          map.set(time, { time });
        }
        const entry = map.get(time)!;
        entry[key] = point.p;
      });
    });

    return map;
  }, [series]);

  const chartData = useMemo(() => {
    return Array.from(timestampMap.values()).sort((a, b) => a.time - b.time);
  }, [timestampMap]);

  // Calculate Y-axis domain based on data (auto-scale with nice round ticks)
  const yAxisConfig = useMemo(() => {
    if (!series || series.length === 0 || chartData.length === 0) {
      return {
        domain: [0, 1] as [number, number],
        ticks: [0, 0.2, 0.4, 0.6, 0.8],
      };
    }

    // Collect all prices from all series
    const allPrices: number[] = [];
    series.forEach((s) => {
      if (s.data) {
        s.data.forEach((point) => {
          if (typeof point.p === "number" && !isNaN(point.p)) {
            allPrices.push(point.p);
          }
        });
      }
    });

    if (allPrices.length === 0) {
      return {
        domain: [0, 1] as [number, number],
        ticks: [0, 0.2, 0.4, 0.6, 0.8],
      };
    }

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    // Round min down and max up to nearest 20% (0.2) for nice tick values
    const tickInterval = 0.2; // 20% intervals
    let yMin = Math.floor(minPrice / tickInterval) * tickInterval;
    let yMax = Math.ceil(maxPrice / tickInterval) * tickInterval;

    // Add a bit of padding if data is exactly at boundaries
    if (minPrice === yMin) yMin = Math.max(0, yMin - tickInterval);
    if (maxPrice === yMax) yMax = Math.min(1, yMax + tickInterval);

    // Ensure we have valid bounds
    yMin = Math.max(0, yMin);
    yMax = Math.min(1, yMax);

    // Generate nice round tick values at 20% intervals (exclude the max)
    const ticks: number[] = [];
    for (let tick = yMin; tick < yMax; tick += tickInterval) {
      // Round to avoid floating point issues
      ticks.push(Math.round(tick * 100) / 100);
    }

    return { domain: [yMin, yMax] as [number, number], ticks };
  }, [series, chartData]);

  if (!series || series.length === 0) return null;

  const formatTime = (time: number) => {
    return new Date(time).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return `${(price * 100).toFixed(0)}%`;
  };

  return (
    <div className="relative w-full h-full">
      {/* Custom Legend - Top Left */}
      <div className="absolute top-0 left-0 z-10 flex flex-wrap gap-x-3 gap-y-1 p-1">
        {series.map((s, index) => (
          <div
            key={s.id || `legend-${index}`}
            className="flex items-center gap-1.5"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[11px] text-[#899cb2]">{s.name}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 2, left: 0, bottom: 5 }}
        >
          {/* Horizontal dotted grid lines - dynamic based on data */}
          {yAxisConfig.ticks.map((tick) => (
            <ReferenceLine
              key={tick}
              y={tick}
              stroke="#344452"
              strokeDasharray="2 2"
            />
          ))}
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            stroke="#899cb2"
            tick={{ fontSize: 12, fill: "#899cb2" }}
            minTickGap={50}
            axisLine={{ stroke: "#344452" }}
            tickLine={false}
          />
          <YAxis
            orientation="right"
            tickFormatter={formatPrice}
            stroke="transparent"
            tick={{ fontSize: 10, fill: "#899cb2" }}
            domain={yAxisConfig.domain}
            axisLine={false}
            tickLine={false}
            ticks={yAxisConfig.ticks}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1D2B3A",
              borderColor: "#2A3F54",
              color: "#fff",
            }}
            labelFormatter={(label) => new Date(label).toLocaleString("en-US")}
            formatter={(value: number, name: string) => [
              `${(value * 100).toFixed(1)}%`,
              name,
            ]}
          />
          {series.map((s, index) => (
            <Line
              key={s.id || `${s.name}-${index}`}
              name={s.name}
              type="monotone"
              dataKey={`series_${index}`}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
