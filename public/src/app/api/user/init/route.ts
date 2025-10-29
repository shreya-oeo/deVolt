import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    const required = ['privyUserId'];
    const missing = required.filter(field => !userData[field]);
    
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const {
      privyUserId,
      walletAddress,
      email,
      metadata = {}
    } = userData;

    const db = await connectToDatabase();
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ privyUserId });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        data: existingUser
      });
    }

    // Create new user
    const newUser = {
      privyUserId,
      walletAddress: walletAddress || null,
      email: email || null,
      balance: 0,
      totalSessions: 0,
      totalEnergyConsumed: 0,
      totalSpent: 0,
      totalDechEarned: 0,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata
    };

    const result = await users.insertOne(newUser);

    return NextResponse.json({
      success: true,
      message: 'User initialized successfully',
      data: {
        ...newUser,
        _id: result.insertedId
      }
    });

  } catch (error) {
    console.error('❌ User init error:', error);
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

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ Get user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
