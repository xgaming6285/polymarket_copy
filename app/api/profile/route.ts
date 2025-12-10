import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import User from "@/app/models/User";
import Position from "@/app/models/Position";
import Trade from "@/app/models/Trade";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get position stats
    const openPositions = await Position.find({ userId, status: 'open' }).lean();
    const closedPositions = await Position.find({ userId, status: { $in: ['closed', 'settled'] } }).lean();

    // Calculate portfolio value from open positions
    const portfolioValue = openPositions.reduce((sum, pos) => {
      return sum + (pos.shares * pos.currentPrice);
    }, 0);

    // Calculate unrealized P&L
    const unrealizedPnL = openPositions.reduce((sum, pos) => {
      return sum + ((pos.currentPrice - pos.averagePrice) * pos.shares);
    }, 0);

    // Calculate realized P&L from closed positions
    const realizedPnL = closedPositions.reduce((sum, pos) => sum + pos.profitLoss, 0);

    // Get recent trades
    const recentTrades = await Trade.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate total invested in open positions
    const totalInvested = openPositions.reduce((sum, pos) => sum + pos.investedAmount, 0);

    return NextResponse.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        balance: user.balance,
        createdAt: user.createdAt,
      },
      stats: {
        portfolioValue,
        cashBalance: user.balance,
        totalEquity: user.balance + portfolioValue,
        totalInvested,
        unrealizedPnL,
        realizedPnL,
        totalPnL: unrealizedPnL + realizedPnL,
        openPositionsCount: openPositions.length,
        closedPositionsCount: closedPositions.length,
        totalTradesCount: await Trade.countDocuments({ userId }),
      },
      recentTrades,
    });

  } catch (error: unknown) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user balance (for deposits/withdrawals simulation)
export async function PUT(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { userId, action, amount } = body;

    if (!userId || !action || !amount) {
      return NextResponse.json(
        { error: "userId, action, and amount are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (action === 'deposit') {
      user.balance += amount;
    } else if (action === 'withdraw') {
      if (user.balance < amount) {
        return NextResponse.json(
          { error: "Insufficient balance" },
          { status: 400 }
        );
      }
      user.balance -= amount;
    } else if (action === 'reset') {
      // Reset balance to initial 1M
      user.balance = 1000000;
      user.portfolioValue = 0;
      // Optionally close all positions
      await Position.updateMany(
        { userId, status: 'open' },
        { status: 'closed', closedAt: new Date() }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    await user.save();

    return NextResponse.json({
      success: true,
      balance: user.balance,
    });

  } catch (error: unknown) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

