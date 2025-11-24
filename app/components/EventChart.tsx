"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  if (!series || series.length === 0) return null;

  // Merge data based on timestamp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timestampMap = new Map<number, any>();

  series.forEach((s, index) => {
    if (!s.data) return;
    const key = `series_${index}`;
    s.data.forEach((point) => {
      const time = point.t * 1000; // Convert to ms
      if (!timestampMap.has(time)) {
        timestampMap.set(time, { time });
      }
      const entry = timestampMap.get(time);
      entry[key] = point.p;
    });
  });

  const chartData = Array.from(timestampMap.values()).sort(
    (a, b) => a.time - b.time
  );

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
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: -60, bottom: 5 }}
      >
        {/* Horizontal dotted grid lines at 0%, 20%, 40%, 60%, 80% */}
        {[0, 0.2, 0.4, 0.6, 0.8].map((tick) => (
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
          tick={{ fontSize: 12 }}
          minTickGap={50}
          axisLine={{ stroke: "#899cb2" }}
        />
        <YAxis
          tickFormatter={formatPrice}
          stroke="transparent"
          tick={{ fontSize: 12 }}
          domain={[0, 1]}
          axisLine={false}
          ticks={[0, 0.2, 0.4, 0.6, 0.8]}
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
        <Legend />
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
  );
}
