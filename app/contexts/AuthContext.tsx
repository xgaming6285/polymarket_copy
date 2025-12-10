"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  balance?: number;
  portfolioValue?: number;
  createdAt?: string;
}

interface Stats {
  portfolioValue: number;
  cashBalance: number;
  totalEquity: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
}

interface AuthContextType {
  user: User | null;
  stats: Stats | null;
  login: (userData: User) => void;
  logout: () => void;
  refreshStats: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialUser(): User | null {
  if (typeof window === "undefined") return null;
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Error parsing stored user:", error);
      localStorage.removeItem("user");
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading] = useState(() => typeof window === "undefined");

  const refreshStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/profile?userId=${user.id}`);
      const data = await res.json();
      
      if (data.stats) {
        setStats({
          portfolioValue: data.stats.portfolioValue,
          cashBalance: data.stats.cashBalance,
          totalEquity: data.stats.totalEquity,
          unrealizedPnL: data.stats.unrealizedPnL,
          realizedPnL: data.stats.realizedPnL,
          totalPnL: data.stats.totalPnL,
        });
      }
    } catch (error) {
      console.error("Error refreshing stats:", error);
    }
  }, [user?.id]);

  // Fetch stats when user changes
  useEffect(() => {
    if (user?.id) {
      refreshStats();
    } else {
      setStats(null);
    }
  }, [user?.id, refreshStats]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setStats(null);
    localStorage.removeItem("user");
  };

  const updateBalance = (newBalance: number) => {
    if (stats) {
      setStats({
        ...stats,
        cashBalance: newBalance,
        totalEquity: newBalance + stats.portfolioValue,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, stats, login, logout, refreshStats, updateBalance, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
