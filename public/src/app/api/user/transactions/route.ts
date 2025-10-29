import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const privyUserId = searchParams.get('privyUserId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!privyUserId) {
      return NextResponse.json(
        { error: 'Privy user ID is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const transactions = db.collection('transactions');

    // Get transactions with enhanced memo information
    const userTransactions = await transactions
      .find({ privyUserId })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Enhance transactions with readable information
    const enhancedTransactions = userTransactions.map(tx => ({
      ...tx,
      formattedMemo: tx.memo || 'No memo available',
      explorerLink: tx.solanaExplorerUrl,
      isVerified: tx.verified || false,
      displayHash: tx.solanaTransactionHash ? 
        `${tx.solanaTransactionHash.slice(0, 8)}...${tx.solanaTransactionHash.slice(-8)}` : 
        null,
      sessionInfo: {
        station: tx.stationName || tx.metadata?.stationName || 'Unknown Station',
        energy: tx.kWh || tx.metadata?.kWh || 0,
        cost: tx.costUSD || tx.metadata?.costUSD || 0,
        dechEarned: tx.metadata?.dechEarned || 0,
        duration: tx.metadata?.durationMinutes || 0,
      }
    }));

    // Get total count for pagination
    const totalCount = await transactions.countDocuments({ privyUserId });

    return NextResponse.json({
      success: true,
      data: {
        transactions: enhancedTransactions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('❌ Get user transactions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}