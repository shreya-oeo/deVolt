import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const result = await databaseService.verifySession(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        verified: result.verified,
        session: result.session
      }
    });
  } catch (error) {
    console.error('❌ API - Verify session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}