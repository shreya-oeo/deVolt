import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { privyUserId, email, walletAddress } = await request.json();

    if (!privyUserId) {
      return NextResponse.json(
        { error: 'Privy user ID is required' },
        { status: 400 }
      );
    }

    console.log(`🆔 Initializing user: ${privyUserId}`);

    // Connect to database
    const db = await connectToDatabase();
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ privyUserId });
    
    if (existingUser) {
      console.log(`✅ User already exists: ${privyUserId}`);
      return NextResponse.json({
        success: true,
        message: 'User already initialized',
        data: {
          user: existingUser,
          alreadyExists: true
        }
      });
    }

    // Call Solana backend to mint 100 USDC tokens
    let solanaResult = null;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const solanaResponse = await fetch(`${backendUrl}/api/init-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: privyUserId, // Use Privy UID as identifier
          metadata: {
            privyUserId,
            email,
            walletAddress,
            initMethod: 'privy_platform_wallet'
          }
        })
      });

      if (solanaResponse.ok) {
        solanaResult = await solanaResponse.json();
        console.log(`✅ Solana tokens minted for ${privyUserId}:`, solanaResult.data.signature);
      } else {
        console.log(`⚠️ Solana backend unavailable for ${privyUserId}, continuing without tokens`);
      }
    } catch (error) {
      console.log(`⚠️ Solana backend error for ${privyUserId}:`, error.message);
    }

    // Create user profile in database
    const newUser = {
      privyUserId,
      email: email || null,
      walletAddress: walletAddress || null,
      joinedAt: new Date().toISOString(),
      totalSessions: 0,
      totalEnergyConsumed: 0,
      totalSpent: 0,
      totalDechEarned: 0,
      currentBalance: 100.00, // Starting balance
      level: 1,
      achievements: ['welcome'],
      preferences: {
        notifications: true,
        autoCharge: false,
        preferredPaymentMethod: 'USDC'
      },
      solanaInitialized: solanaResult ? true : false,
      solanaTransactionHash: solanaResult?.data?.signature || null,
      solanaExplorerUrl: solanaResult?.data?.explorerUrl || null,
      lastActivity: new Date().toISOString()
    };

    const result = await users.insertOne(newUser);
    console.log(`✅ User created in database: ${privyUserId}`);

    // Log initialization transaction
    if (solanaResult) {
      const transactions = db.collection('transactions');
      await transactions.insertOne({
        privyUserId,
        type: 'initialization',
        amount: 100,
        currency: 'USDC',
        timestamp: new Date().toISOString(),
        description: 'Initial USDC token allocation via platform wallet',
        solanaTransactionHash: solanaResult.data.signature,
        solanaExplorerUrl: solanaResult.data.explorerUrl,
        verified: true,
        metadata: {
          initializationType: 'privy_platform_wallet',
          email,
          walletAddress
        }
      });
      console.log(`📝 Initialization transaction logged for ${privyUserId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'User initialized successfully',
      data: {
        user: { ...newUser, _id: result.insertedId },
        solanaTransaction: solanaResult?.data || null
      }
    });

  } catch (error) {
    console.error('❌ API - Initialize user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize user',
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

    if (!privyUserId) {
      return NextResponse.json(
        { error: 'Privy user ID is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const users = db.collection('users');
    
    const user = await users.findOne({ privyUserId });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update last activity
    await users.updateOne(
      { privyUserId },
      { $set: { lastActivity: new Date().toISOString() } }
    );

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ API - Get user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}