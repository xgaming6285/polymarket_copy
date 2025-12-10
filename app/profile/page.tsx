"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";

interface Position {
  _id: string;
  eventId: string;
  eventTitle: string;
  eventImage?: string;
  outcomeTitle: string;
  outcome: "Yes" | "No";
  shares: number;
  averagePrice: number;
  investedAmount: number;
  currentPrice: number;
  status: "open" | "closed" | "settled";
  profitLoss: number;
  unrealizedPnL: number;
  currentValue: number;
  totalPnL: number;
  createdAt: string;
  closedAt?: string;
}

interface Trade {
  _id: string;
  eventTitle: string;
  outcomeTitle: string;
  type: "buy" | "sell";
  outcome: "Yes" | "No";
  shares: number;
  price: number;
  total: number;
  createdAt: string;
}

interface Stats {
  portfolioValue: number;
  cashBalance: number;
  totalEquity: number;
  totalInvested: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  openPositionsCount: number;
  closedPositionsCount: number;
  totalTradesCount: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<"positions" | "history">("positions");
  const [positionFilter, setPositionFilter] = useState<"open" | "closed" | "all">("open");
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch profile and positions in parallel
      const [profileRes, positionsRes] = await Promise.all([
        fetch(`/api/profile?userId=${user.id}`),
        fetch(`/api/positions?userId=${user.id}&status=${positionFilter}`),
      ]);

      const profileData = await profileRes.json();
      const positionsData = await positionsRes.json();

      if (profileData.stats) {
        setStats(profileData.stats);
        setTrades(profileData.recentTrades || []);
      }

      if (positionsData.positions) {
        setPositions(positionsData.positions);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, positionFilter]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user?.id) {
      fetchProfileData();
    }
  }, [user, isLoading, router, fetchProfileData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B1929]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B1929]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-[#1D2B3A] rounded-xl border border-[#2A3F54] p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-green-400 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user.firstName?.charAt(0) || "U"}
                  {user.lastName?.charAt(0) || "S"}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-400">{user.email}</p>
                <p className="text-gray-500 text-sm mt-1">
                  Member since {stats ? new Date(user.createdAt || Date.now()).toLocaleDateString() : "..."}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0B1929] rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Total Equity</div>
                <div className="text-xl font-bold text-white">
                  {stats ? formatCurrency(stats.totalEquity) : "$0.00"}
                </div>
              </div>
              <div className="bg-[#0B1929] rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Cash Balance</div>
                <div className="text-xl font-bold text-green-400">
                  {stats ? formatCurrency(stats.cashBalance) : "$0.00"}
                </div>
              </div>
              <div className="bg-[#0B1929] rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Portfolio Value</div>
                <div className="text-xl font-bold text-blue-400">
                  {stats ? formatCurrency(stats.portfolioValue) : "$0.00"}
                </div>
              </div>
              <div className="bg-[#0B1929] rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Total P&L</div>
                <div
                  className={`text-xl font-bold ${
                    (stats?.totalPnL || 0) >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stats ? formatCurrency(stats.totalPnL) : "$0.00"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[#1D2B3A] rounded-lg border border-[#2A3F54] p-4">
            <div className="text-gray-400 text-sm mb-1">Total Invested</div>
            <div className="text-lg font-semibold text-white">
              {stats ? formatCurrency(stats.totalInvested) : "$0.00"}
            </div>
          </div>
          <div className="bg-[#1D2B3A] rounded-lg border border-[#2A3F54] p-4">
            <div className="text-gray-400 text-sm mb-1">Unrealized P&L</div>
            <div
              className={`text-lg font-semibold ${
                (stats?.unrealizedPnL || 0) >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {stats ? formatCurrency(stats.unrealizedPnL) : "$0.00"}
            </div>
          </div>
          <div className="bg-[#1D2B3A] rounded-lg border border-[#2A3F54] p-4">
            <div className="text-gray-400 text-sm mb-1">Realized P&L</div>
            <div
              className={`text-lg font-semibold ${
                (stats?.realizedPnL || 0) >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {stats ? formatCurrency(stats.realizedPnL) : "$0.00"}
            </div>
          </div>
          <div className="bg-[#1D2B3A] rounded-lg border border-[#2A3F54] p-4">
            <div className="text-gray-400 text-sm mb-1">Open Positions</div>
            <div className="text-lg font-semibold text-white">
              {stats?.openPositionsCount || 0}
            </div>
          </div>
          <div className="bg-[#1D2B3A] rounded-lg border border-[#2A3F54] p-4">
            <div className="text-gray-400 text-sm mb-1">Total Trades</div>
            <div className="text-lg font-semibold text-white">
              {stats?.totalTradesCount || 0}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#2A3F54]">
          <button
            onClick={() => setActiveTab("positions")}
            className={`pb-3 text-lg font-semibold transition-colors ${
              activeTab === "positions"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Positions
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-lg font-semibold transition-colors ${
              activeTab === "history"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Trade History
          </button>
        </div>

        {activeTab === "positions" && (
          <>
            {/* Position Filter */}
            <div className="flex gap-2 mb-6">
              {(["open", "closed", "all"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPositionFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    positionFilter === filter
                      ? "bg-blue-500 text-white"
                      : "bg-[#2A3F54] text-gray-400 hover:bg-[#3D5266]"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Positions Grid */}
            {positions.length === 0 ? (
              <div className="bg-[#1D2B3A] rounded-xl border border-[#2A3F54] p-12 text-center">
                <div className="text-gray-400 text-lg mb-4">No {positionFilter} positions</div>
                <Link
                  href="/"
                  className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-lg"
                >
                  Start Trading
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => (
                  <div
                    key={position._id}
                    className="bg-[#1D2B3A] rounded-xl border border-[#2A3F54] p-6 hover:border-[#3D5266] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Event Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            position.outcome === "Yes" ? "bg-green-500" : "bg-red-500"
                          }`}
                        >
                          <span className="text-white font-bold text-lg">
                            {position.outcome === "Yes" ? "Y" : "N"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/event/${position.eventId}`}
                            className="text-lg font-semibold text-white hover:text-blue-400 line-clamp-1"
                          >
                            {position.eventTitle}
                          </Link>
                          <div className="text-gray-400 text-sm">
                            {position.outcomeTitle} • {position.outcome}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            Opened {formatDate(position.createdAt)}
                            {position.closedAt && ` • Closed ${formatDate(position.closedAt)}`}
                          </div>
                        </div>
                      </div>

                      {/* Position Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                        <div className="text-center">
                          <div className="text-gray-400 text-xs mb-1">Shares</div>
                          <div className="text-white font-semibold">
                            {position.shares.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 text-xs mb-1">Avg Price</div>
                          <div className="text-white font-semibold">
                            {(position.averagePrice * 100).toFixed(1)}¢
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 text-xs mb-1">Current</div>
                          <div className="text-white font-semibold">
                            {(position.currentPrice * 100).toFixed(1)}¢
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 text-xs mb-1">Value</div>
                          <div className="text-white font-semibold">
                            {formatCurrency(position.currentValue)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 text-xs mb-1">P&L</div>
                          <div
                            className={`font-bold ${
                              position.totalPnL >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {formatCurrency(position.totalPnL)}
                            <span className="text-xs ml-1">
                              ({formatPercent((position.totalPnL / position.investedAmount) * 100 || 0)})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            position.status === "open"
                              ? "bg-blue-500/20 text-blue-400"
                              : position.status === "settled"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {position.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <div className="bg-[#1D2B3A] rounded-xl border border-[#2A3F54] overflow-hidden">
            {trades.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-lg">No trades yet</div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#0B1929]">
                  <tr>
                    <th className="text-left text-gray-400 text-sm font-medium p-4">
                      Event
                    </th>
                    <th className="text-left text-gray-400 text-sm font-medium p-4">
                      Type
                    </th>
                    <th className="text-left text-gray-400 text-sm font-medium p-4">
                      Side
                    </th>
                    <th className="text-right text-gray-400 text-sm font-medium p-4">
                      Shares
                    </th>
                    <th className="text-right text-gray-400 text-sm font-medium p-4">
                      Price
                    </th>
                    <th className="text-right text-gray-400 text-sm font-medium p-4">
                      Total
                    </th>
                    <th className="text-right text-gray-400 text-sm font-medium p-4">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr
                      key={trade._id}
                      className="border-t border-[#2A3F54] hover:bg-[#0B1929]/50"
                    >
                      <td className="p-4">
                        <div className="text-white font-medium line-clamp-1">
                          {trade.eventTitle}
                        </div>
                        <div className="text-gray-400 text-sm">{trade.outcomeTitle}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.type === "buy"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.outcome === "Yes"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {trade.outcome}
                        </span>
                      </td>
                      <td className="p-4 text-right text-white font-mono">
                        {trade.shares.toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-white font-mono">
                        {(trade.price * 100).toFixed(1)}¢
                      </td>
                      <td className="p-4 text-right text-white font-mono">
                        {formatCurrency(trade.total)}
                      </td>
                      <td className="p-4 text-right text-gray-400 text-sm">
                        {formatDate(trade.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

