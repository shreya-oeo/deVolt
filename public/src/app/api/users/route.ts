import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/types/user';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, email, phone } = await request.json();
    
    if (!walletAddress && !email && !phone) {
      return NextResponse.json(
        { error: 'At least one identifier (wallet, email, or phone) is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const users = db.collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({
      $or: [
        ...(walletAddress ? [{ walletAddress }] : []),
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : [])
      ]
    });

    if (existingUser) {
      // Update last login
      await users.updateOne(
        { _id: existingUser._id },
        { $set: { lastLogin: new Date() } }
      );
      
      return NextResponse.json({ user: existingUser });
    }

    // Create new user
    const newUser: User = {
      walletAddress,
      email,
      phone,
      createdAt: new Date(),
      lastLogin: new Date(),
      energyData: {
        totalConsumption: 0,
        totalGeneration: 0,
        balance: 0,
        transactions: []
      }
    };

    const result = await users.insertOne(newUser);
    const user = await users.findOne({ _id: result.insertedId });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('User creation/login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const email = searchParams.get('email');

    if (!walletAddress && !email) {
      return NextResponse.json(
        { error: 'Wallet address or email is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const users = db.collection('users');

    const user = await users.findOne({
      $or: [
        ...(walletAddress ? [{ walletAddress }] : []),
        ...(email ? [{ email }] : [])
      ]
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}