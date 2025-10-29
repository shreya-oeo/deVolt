export interface User {
  _id?: string;
  walletAddress?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  lastLogin: Date;
  profile?: {
    name?: string;
    avatar?: string;
    preferences?: Record<string, any>;
  };
  energyData?: {
    totalConsumption: number;
    totalGeneration: number;
    balance: number;
    transactions: Array<{
      id: string;
      type: 'consume' | 'generate' | 'trade';
      amount: number;
      timestamp: Date;
      description?: string;
    }>;
  };
}

export interface EnergyTransaction {
  _id?: string;
  userId: string;
  type: 'consume' | 'generate' | 'trade';
  amount: number;
  price?: number;
  timestamp: Date;
  description?: string;
  blockchainTxHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}