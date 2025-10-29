
import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { localTxHash, solanaTransactionHash, solanaExplorerUrl, verified } = body;

    if (!localTxHash || !solanaTransactionHash) {
      return NextResponse.json({ error: 'localTxHash and solanaTransactionHash are required' }, { status: 400 });
    }

    // Update the transaction in DB by matching txHash/localTxHash
    const updated = await databaseService.updateTransactionByLocalHash(localTxHash, {
      solanaTransactionHash,
      solanaExplorerUrl,
      verified: verified === true
    });

    if (!updated) {
      return NextResponse.json({ success: false, message: 'No transaction updated' });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Update on-chain transaction error:', error);
    return NextResponse.json({ error: 'Failed to update transaction', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}