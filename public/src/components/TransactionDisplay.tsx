import { useState, useEffect } from 'react';
import { ExternalLink, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface TransactionDisplayProps {
  transactions: Array<{
    solanaTransactionHash: string | null;
    solanaExplorerUrl: string | null;
    memo: string;
    timestamp: string;
    verified: boolean;
    stationName: string;
    costUSD: number;
    kWh: number;
    dechEarned: number;
  }>;
}

export default function TransactionDisplay({ transactions }: TransactionDisplayProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">🔗 Blockchain Transaction History</h3>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <div 
              key={index} 
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {tx.verified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="font-medium">
                    {tx.stationName}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(tx.timestamp)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                <div>
                  <span className="text-gray-600">Energy:</span>
                  <div className="font-medium">{tx.kWh} kWh</div>
                </div>
                <div>
                  <span className="text-gray-600">Cost:</span>
                  <div className="font-medium">${tx.costUSD.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-gray-600">DECH Earned:</span>
                  <div className="font-medium">{tx.dechEarned}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className={`font-medium ${tx.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {tx.verified ? 'Verified' : 'Pending'}
                  </div>
                </div>
              </div>

              {tx.memo && (
                <div className="mb-3">
                  <span className="text-gray-600 text-sm">Memo:</span>
                  <div className="bg-gray-50 rounded p-2 mt-1 text-sm font-mono whitespace-pre-wrap">
                    {tx.memo}
                  </div>
                </div>
              )}

              {tx.solanaTransactionHash && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Transaction Hash:</div>
                    <div className="font-mono text-sm text-blue-700">
                      {shortenHash(tx.solanaTransactionHash)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(tx.solanaTransactionHash!)}
                    className="p-2 hover:bg-blue-100 rounded transition-colors"
                    title="Copy transaction hash"
                  >
                    {copiedHash === tx.solanaTransactionHash ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-blue-500" />
                    )}
                  </button>

                  {tx.solanaExplorerUrl && (
                    <a
                      href={tx.solanaExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                    >
                      View Memo
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {!tx.solanaTransactionHash && (
                <div className="text-sm text-gray-500 italic">
                  Transaction not yet recorded on blockchain
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}