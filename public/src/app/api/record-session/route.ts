import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ServerlessSolana from '@/lib/serverlessSolana';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    // Validate required fields
    const required = ['privyUserId', 'sessionId', 'stationId', 'stationName', 'kWh', 'durationMinutes', 'costUSD'];
    const missing = required.filter(field => !sessionData[field]);
    
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const {
      privyUserId,
      sessionId,
      stationId,
      stationName,
      location = { lat: 0, lng: 0, address: '' },
      kWh,
      durationMinutes,
      costUSD,
      metadata = {}
    } = sessionData;

    console.log(`⚡ Recording session: ${sessionId} for user ${privyUserId}`);

    // Calculate DECH tokens earned (10 per kWh)
    const dechEarned = Math.floor(kWh * 10);

    // Create session hash for verification
    const sessionHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        privyUserId,
        sessionId,
        stationId,
        kWh,
        durationMinutes,
        costUSD,
        timestamp: new Date().toISOString()
      }))
      .digest('hex');

    // Connect to database
    const db = await connectToDatabase();
    const sessions = db.collection('sessions');
    const users = db.collection('users');
    const transactions = db.collection('transactions');

    // Create session record
    const session = {
      privyUserId,
      sessionId,
      stationId,
      stationName,
      location,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      kWh,
      durationMinutes,
      costUSD,
      dechEarned,
      status: 'completed',
      sessionHash,
      verified: false,
      solanaTransactionHash: null,
      solanaExplorerUrl: null,
      metadata
    };

    // Prepare memo for transactions
    const transactionMemo = `EV CHARGE: ${kWh}kWh at ${stationName} | Cost: $${costUSD.toFixed(2)} | DECH: ${dechEarned} | Session: ${sessionId.slice(-8)}`;

    // Record transaction on Solana blockchain using serverless functions
    let solanaResult = null;
    try {
      console.log('🔗 Creating Solana memo transaction...');
      
      solanaResult = await ServerlessSolana.createMemoTransaction(
        transactionMemo,
        privyUserId, // Use privyUserId as public key placeholder
        {
          sessionId,
          stationName,
          kWh,
          costUSD,
          dechEarned,
        }
      );

      if (solanaResult) {
        session.verified = solanaResult.verified;
        session.solanaTransactionHash = solanaResult.signature;
        session.solanaExplorerUrl = solanaResult.explorerUrl;
        console.log(`✅ Solana transaction created: ${solanaResult.signature}`);
      }
    } catch (error) {
      console.log(`⚠️ Solana transaction error for session ${sessionId}:`, error.message);
      // Continue without blockchain verification
    }

    // Insert session into database
    const sessionResult = await sessions.insertOne(session);
    console.log(`📝 Session stored in database: ${sessionId}`);

    // Update user stats
    await users.updateOne(
      { privyUserId },
      {
        $inc: {
          totalSessions: 1,
          totalEnergyConsumed: kWh,
          totalSpent: costUSD,
          totalDechEarned: dechEarned
        },
        $set: {
          lastActivity: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    // Log transaction with enhanced details    
    await transactions.insertOne({
      privyUserId,
      sessionId,
      type: 'charge',
      amount: costUSD,
      currency: 'USD',
      timestamp: session.startTime,
      description: `EV Charging Session at ${stationName}`,
      memo: transactionMemo,
      solanaTransactionHash: session.solanaTransactionHash,
      solanaExplorerUrl: session.solanaExplorerUrl,
      verified: session.verified,
      blockHash: solanaResult?.blockHash || null,
      confirmations: solanaResult?.confirmations || 0,
      fee: solanaResult?.fee || 0.000005,
      stationName,
      costUSD,
      kWh,
      metadata: {
        kWh,
        durationMinutes,
        dechEarned,
        stationId,
        stationName,
        location,
        sessionHash,
        energyRate: (costUSD / kWh).toFixed(4),
        dechRate: (dechEarned / kWh).toFixed(2),
        onChainMemo: transactionMemo
      }
    });

    console.log(`✅ Session ${sessionId} completed successfully`);

    return NextResponse.json({
      success: true,
      message: 'Charging session recorded successfully',
      data: {
        session: { ...session, _id: sessionResult.insertedId },
        solanaTransaction: solanaResult || null,
        onChainVerification: session.verified
      }
    });

  } catch (error) {
    console.error('❌ API - Record session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to record charging session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const privyUserId = searchParams.get('privyUserId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!privyUserId) {
      return NextResponse.json(
        { error: 'Privy user ID is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const sessions = db.collection('sessions');

    const userSessions = await sessions
      .find({ privyUserId })
      .sort({ startTime: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: userSessions
    });

  } catch (error) {
    console.error('❌ API - Get sessions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}