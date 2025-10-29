import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, walletAddress } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userProfile = await databaseService.initializeUser(
      userId,
      email,
      walletAddress
    );

    return NextResponse.json({
      success: true,
      data: userProfile
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userProfile = await databaseService.getUserProfile(userId);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userProfile
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