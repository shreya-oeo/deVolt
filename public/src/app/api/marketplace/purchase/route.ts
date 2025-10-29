import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const { userId, itemId, quantity, totalCost } = await req.json();

    if (!userId || !itemId || !quantity || !totalCost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = DatabaseManager.getInstance();

    // Log the purchase transaction
    await db.logTransaction({
      walletAddress: userId,
      txHash: `marketplace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'marketplace_purchase',
      amount: totalCost,
      currency: 'DECH',
      status: 'completed',
      metadata: {
        itemId,
        quantity,
        purchaseType: 'marketplace',
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Purchase failed' },
      { status: 500 }
    );
  }
}

