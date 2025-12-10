import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import User from "@/app/models/User";
import Position from "@/app/models/Position";
import Trade from "@/app/models/Trade";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      userId,
      eventId,
      eventTitle,
      eventImage,
      marketId,
      outcomeTitle,
      type, // 'buy' or 'sell'
      outcome, // 'Yes' or 'No'
      amount, // Dollar amount to spend (for buy) or shares to sell (for sell)
      price, // Current market price (0-1)
    } = body;

    // Validate required fields
    if (!userId || !eventId || !marketId || !type || !outcome || !amount || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (type === "buy") {
      // Check if user has enough balance
      if (user.balance < amount) {
        return NextResponse.json(
          { error: "Insufficient balance" },
          { status: 400 }
        );
      }

      // Calculate shares bought
      const shares = amount / price;

      // Find existing position or create new one
      let position = await Position.findOne({
        userId,
        marketId,
        outcome,
        status: 'open'
      });

      if (position) {
        // Update existing position with weighted average price
        const totalShares = position.shares + shares;
        const totalInvested = position.investedAmount + amount;
        position.averagePrice = totalInvested / totalShares;
        position.shares = totalShares;
        position.investedAmount = totalInvested;
        position.currentPrice = price;
        await position.save();
      } else {
        // Create new position
        position = await Position.create({
          userId,
          eventId,
          eventTitle: eventTitle || 'Unknown Event',
          eventImage,
          marketId,
          outcomeTitle: outcomeTitle || outcome,
          outcome,
          shares,
          averagePrice: price,
          investedAmount: amount,
          currentPrice: price,
          status: 'open',
          profitLoss: 0,
        });
      }

      // Create trade record
      await Trade.create({
        userId,
        positionId: position._id,
        eventId,
        eventTitle: eventTitle || 'Unknown Event',
        marketId,
        outcomeTitle: outcomeTitle || outcome,
        type: 'buy',
        outcome,
        shares,
        price,
        total: amount,
      });

      // Update user balance
      user.balance -= amount;
      user.portfolioValue += amount;
      await user.save();

      return NextResponse.json({
        success: true,
        message: `Bought ${shares.toFixed(2)} shares at $${price.toFixed(4)}`,
        position: {
          id: position._id,
          shares: position.shares,
          averagePrice: position.averagePrice,
          investedAmount: position.investedAmount,
        },
        balance: user.balance,
        portfolioValue: user.portfolioValue,
      });

    } else if (type === "sell") {
      // Find existing position
      const position = await Position.findOne({
        userId,
        marketId,
        outcome,
        status: 'open'
      });

      if (!position) {
        return NextResponse.json(
          { error: "No open position found" },
          { status: 400 }
        );
      }

      // amount here represents shares to sell
      const sharesToSell = Math.min(amount, position.shares);
      const saleValue = sharesToSell * price;

      // Calculate profit/loss for this sale
      const costBasis = sharesToSell * position.averagePrice;
      const profitLoss = saleValue - costBasis;

      // Create trade record
      await Trade.create({
        userId,
        positionId: position._id,
        eventId,
        eventTitle: position.eventTitle,
        marketId,
        outcomeTitle: position.outcomeTitle,
        type: 'sell',
        outcome,
        shares: sharesToSell,
        price,
        total: saleValue,
      });

      // Update position
      position.shares -= sharesToSell;
      position.investedAmount -= costBasis;
      position.profitLoss += profitLoss;
      position.currentPrice = price;

      if (position.shares <= 0.0001) {
        // Close position if all shares sold
        position.status = 'closed';
        position.closedAt = new Date();
        position.shares = 0;
        position.investedAmount = 0;
      }
      await position.save();

      // Update user balance
      user.balance += saleValue;
      user.portfolioValue = Math.max(0, user.portfolioValue - costBasis);
      await user.save();

      return NextResponse.json({
        success: true,
        message: `Sold ${sharesToSell.toFixed(2)} shares at $${price.toFixed(4)}`,
        profitLoss,
        position: {
          id: position._id,
          shares: position.shares,
          status: position.status,
        },
        balance: user.balance,
        portfolioValue: user.portfolioValue,
      });
    }

    return NextResponse.json(
      { error: "Invalid trade type" },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error("Trade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

