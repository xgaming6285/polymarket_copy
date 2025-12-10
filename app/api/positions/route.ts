import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import Position from "@/app/models/Position";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status"); // 'open', 'closed', 'settled', or 'all'

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Build query
    const query: Record<string, unknown> = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const positions = await Position.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate unrealized P&L for open positions
    const positionsWithPnL = positions.map((pos) => {
      const unrealizedPnL = pos.status === 'open' 
        ? (pos.currentPrice - pos.averagePrice) * pos.shares
        : 0;
      
      const currentValue = pos.status === 'open'
        ? pos.shares * pos.currentPrice
        : 0;

      return {
        ...pos,
        unrealizedPnL,
        currentValue,
        totalPnL: pos.profitLoss + unrealizedPnL,
      };
    });

    // Calculate summary stats
    const openPositions = positionsWithPnL.filter(p => p.status === 'open');
    const closedPositions = positionsWithPnL.filter(p => p.status !== 'open');

    const totalPortfolioValue = openPositions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const totalRealizedPnL = closedPositions.reduce((sum, p) => sum + p.profitLoss, 0);

    return NextResponse.json({
      positions: positionsWithPnL,
      summary: {
        openCount: openPositions.length,
        closedCount: closedPositions.length,
        totalPortfolioValue,
        totalUnrealizedPnL,
        totalRealizedPnL,
        totalPnL: totalUnrealizedPnL + totalRealizedPnL,
      }
    });

  } catch (error: unknown) {
    console.error("Positions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update position prices (can be called periodically or on page load)
export async function PUT(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { positions } = body; // Array of { positionId, currentPrice }

    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json(
        { error: "positions array is required" },
        { status: 400 }
      );
    }

    const updates = await Promise.all(
      positions.map(async ({ positionId, currentPrice }) => {
        const position = await Position.findById(positionId);
        if (position && position.status === 'open') {
          position.currentPrice = currentPrice;
          await position.save();
          return { positionId, updated: true };
        }
        return { positionId, updated: false };
      })
    );

    return NextResponse.json({ updates });

  } catch (error: unknown) {
    console.error("Position update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

