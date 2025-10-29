import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

export async function POST(request: NextRequest) {
  try {
    console.log('📊 API request for transaction logging');
    const rawData = await request.json();
    console.log('📊 Transaction data received:', JSON.stringify(rawData, null, 2));

    // Handle different data formats
    let transactionData: any;
    
    if (rawData.action && rawData.data) {
      // Handle wrapped format from other parts of the app
      const { action, data } = rawData;
      
      if (action === 'log_transaction') {
        transactionData = {
          userId: data.walletAddress || 'demo_user',
          type: data.type || 'charge',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          description: `Transaction via ${data.metadata?.method || 'unknown method'}`,
          timestamp: new Date().toISOString(),
          verified: data.status === 'confirmed',
          solanaTransactionHash: data.txHash,
          metadata: {
            ...data.metadata,
            originalAction: action,
            stationId: data.metadata?.stationId,
            stationName: data.metadata?.stationName,
            energyAmount: data.metadata?.energyAmount,
            dechEarned: data.metadata?.dechEarned
          }
        };
      } else if (action === 'log_charging_session') {
        transactionData = {
          userId: data.walletAddress || 'demo_user',
          type: 'charge',
          amount: data.amountPaid || 0,
          currency: 'USD',
          description: `Charging session at ${data.stationName}`,
          timestamp: data.startTime || new Date().toISOString(),
          verified: data.txHash ? true : false,
          solanaTransactionHash: data.txHash,
          sessionId: data.stationId,
          metadata: {
            stationId: data.stationId,
            stationName: data.stationName,
            location: data.location,
            coordinates: data.coordinates,
            status: data.status,
            energyConsumed: data.energyConsumed,
            dechEarned: data.dechEarned,
            originalAction: action
          }
        };
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
    } else {
      // Handle direct format (from our Privy integration)
      transactionData = rawData;
    }

    // Validate required fields after normalization
    const required = ['userId', 'type', 'amount', 'currency', 'description'];
    const missing = required.filter(field => !transactionData[field] && transactionData[field] !== 0);
    
    if (missing.length > 0) {
      console.log('❌ Missing required fields after normalization:', missing);
      console.log('📊 Normalized data:', JSON.stringify(transactionData, null, 2));
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate transaction type
    const validTypes = ['charge', 'purchase', 'reward', 'withdrawal'];
    if (!validTypes.includes(transactionData.type)) {
      console.log('❌ Invalid transaction type:', transactionData.type);
      return NextResponse.json(
        { error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate currency
    const validCurrencies = ['USD', 'DECH', 'SOL'];
    if (!validCurrencies.includes(transactionData.currency)) {
      console.log('❌ Invalid currency:', transactionData.currency);
      return NextResponse.json(
        { error: `Invalid currency. Must be one of: ${validCurrencies.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof transactionData.amount !== 'number' || transactionData.amount < 0) {
      console.log('❌ Invalid amount:', transactionData.amount);
      return NextResponse.json(
        { error: 'Amount must be a non-negative number' },
        { status: 400 }
      );
    }

    // Add timestamp if not provided
    if (!transactionData.timestamp) {
      transactionData.timestamp = new Date().toISOString();
    }

    // Set default verification status
    if (transactionData.verified === undefined) {
      transactionData.verified = false;
    }

    console.log('✅ Transaction validation passed, logging to database...');

    try {
      const transaction = await databaseService.logTransaction(transactionData);
      console.log('✅ Transaction logged successfully:', transaction._id);

      return NextResponse.json({
        success: true,
        data: transaction,
        message: 'Transaction logged successfully'
      });
    } catch (dbError) {
      console.error('❌ Database error while logging transaction:', dbError);
      
      // Fallback: log locally if database fails
      console.log('💾 Falling back to local logging for transaction:', {
        userId: transactionData.userId,
        type: transactionData.type,
        amount: transactionData.amount,
        currency: transactionData.currency,
        description: transactionData.description,
        timestamp: transactionData.timestamp
      });

      return NextResponse.json({
        success: true,
        data: {
          _id: `local_${Date.now()}`,
          ...transactionData
        },
        message: 'Transaction logged locally (database unavailable)',
        warning: 'Database connection failed, transaction logged locally'
      });
    }

  } catch (error) {
    console.error('❌ API - Log transaction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const transactions = await databaseService.getUserTransactions(userId, limit);

    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('❌ API - Get transactions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}