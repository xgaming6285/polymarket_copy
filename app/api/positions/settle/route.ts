import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import User from "@/app/models/User";
import Position from "@/app/models/Position";
import Trade from "@/app/models/Trade";

// Settle an event - determines profit/loss based on winning outcome
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { eventId, winningOutcome } = body; // winningOutcome: 'Yes' or 'No'

    if (!eventId || !winningOutcome) {
      return NextResponse.json(
        { error: "eventId and winningOutcome are required" },
        { status: 400 }
      );
    }

    // Find all open positions for this event
    const positions = await Position.find({
      eventId,
      status: 'open'
    });

    if (positions.length === 0) {
      return NextResponse.json({
        message: "No open positions found for this event",
        settledCount: 0,
      });
    }

    const settlements = [];

    for (const position of positions) {
      // Calculate settlement
      // If the position's outcome matches the winning outcome, pay out $1 per share
      // Otherwise, the shares are worthless
      const isWinner = position.outcome === winningOutcome;
      const settlementValue = isWinner ? position.shares : 0;
      const profitLoss = settlementValue - position.investedAmount;

      // Update position
      position.status = 'settled';
      position.settlementOutcome = winningOutcome;
      position.profitLoss = profitLoss;
      position.currentPrice = isWinner ? 1 : 0;
      position.closedAt = new Date();
      await position.save();

      // Update user balance
      const user = await User.findById(position.userId);
      if (user) {
        // Add settlement value to balance
        user.balance += settlementValue;
        // Reduce portfolio value by invested amount
        user.portfolioValue = Math.max(0, user.portfolioValue - position.investedAmount);
        await user.save();
      }

      // Create settlement trade record
      await Trade.create({
        userId: position.userId,
        positionId: position._id,
        eventId: position.eventId,
        eventTitle: position.eventTitle,
        marketId: position.marketId,
        outcomeTitle: position.outcomeTitle,
        type: 'sell', // Settlement is like a forced sell
        outcome: position.outcome,
        shares: position.shares,
        price: isWinner ? 1 : 0,
        total: settlementValue,
      });

      settlements.push({
        positionId: position._id,
        userId: position.userId,
        outcome: position.outcome,
        shares: position.shares,
        investedAmount: position.investedAmount,
        settlementValue,
        profitLoss,
        isWinner,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Settled ${positions.length} positions`,
      winningOutcome,
      settlements,
    });

  } catch (error: unknown) {
    console.error("Settlement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

