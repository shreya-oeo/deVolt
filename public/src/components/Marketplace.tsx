"use client";

import { useState } from 'react';

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number; // in DECH
  image: string;
  category: string;
  stock: number;
  benefits: string[];
}

interface MarketplaceProps {
  dechBalance: number;
  onPurchase: (item: MarketplaceItem, quantity: number) => Promise<void>;
}

interface P2POrder {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number; // DECH tokens
  pricePerToken: number; // USD per DECH
  totalPrice: number; // USD
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  rating: number;
  completedTrades: number;
}

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: 'boost_1',
    name: 'Charging Speed Boost',
    description: '2x faster charging for 24 hours',
    price: 500,
    image: '⚡',
    category: 'Boosts',
    stock: 999,
    benefits: ['2x charging speed', '24 hour duration', 'Stackable']
  },
  {
    id: 'discount_1',
    name: 'Premium Discount Pass',
    description: '20% off all charging sessions for 7 days',
    price: 1000,
    image: '🎫',
    category: 'Passes',
    stock: 999,
    benefits: ['20% discount', '7 days validity', 'All stations']
  },
  {
    id: 'nft_station_1',
    name: 'Virtual Charging Station NFT',
    description: 'Own a virtual station and earn passive DECH',
    price: 5000,
    image: '🏢',
    category: 'NFTs',
    stock: 50,
    benefits: ['Passive income', 'Tradeable', 'Exclusive access']
  },
  {
    id: 'energy_credit_1',
    name: 'Renewable Energy Credits',
    description: '100 kWh of certified green energy',
    price: 750,
    image: '🌱',
    category: 'Credits',
    stock: 200,
    benefits: ['100 kWh credit', 'Carbon neutral', 'Certified']
  },
  {
    id: 'priority_1',
    name: 'Priority Access Badge',
    description: 'Skip the queue at busy stations',
    price: 1500,
    image: '👑',
    category: 'Badges',
    stock: 100,
    benefits: ['Priority access', '30 days', 'All locations']
  },
  {
    id: 'bundle_1',
    name: 'Starter Bundle',
    description: 'Speed boost + Discount pass combo',
    price: 1200,
    image: '📦',
    category: 'Bundles',
    stock: 999,
    benefits: ['Save 300 DECH', 'Both items', 'Best value']
  }
];

export const Marketplace = ({ dechBalance, onPurchase }: MarketplaceProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // P2P Trading State
  const [activeTab, setActiveTab] = useState<'items' | 'p2p' | 'sell'>('items');
  const [p2pOrders, setP2pOrders] = useState<P2POrder[]>([
    {
      id: 'p2p_001',
      sellerId: 'user_123',
      sellerName: 'Arjun S.',
      amount: 1000,
      pricePerToken: 0.05,
      totalPrice: 50,
      status: 'active',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      rating: 4.8,
      completedTrades: 47
    },
    {
      id: 'p2p_002',
      sellerId: 'user_456',
      sellerName: 'Priya M.',
      amount: 2500,
      pricePerToken: 0.048,
      totalPrice: 120,
      status: 'active',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
      rating: 4.9,
      completedTrades: 123
    },
    {
      id: 'p2p_003',
      sellerId: 'user_789',
      sellerName: 'Rahul K.',
      amount: 500,
      pricePerToken: 0.052,
      totalPrice: 26,
      status: 'active',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      rating: 4.7,
      completedTrades: 31
    }
  ]);
  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [userOrders, setUserOrders] = useState<P2POrder[]>([]);

  const categories = ['All', ...Array.from(new Set(MARKETPLACE_ITEMS.map(item => item.category)))];
  
  const filteredItems = selectedCategory === 'All' 
    ? MARKETPLACE_ITEMS 
    : MARKETPLACE_ITEMS.filter(item => item.category === selectedCategory);

  const handlePurchase = async () => {
    if (!selectedItem) return;
    
    const totalCost = selectedItem.price * quantity;
    if (dechBalance < totalCost) {
      return;
    }

    setIsPurchasing(true);
    try {
      await onPurchase(selectedItem, quantity);
      setSelectedItem(null);
      setQuantity(1);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCreateSellOrder = async () => {
    if (!sellAmount || !sellPrice || parseFloat(sellAmount) > dechBalance) return;
    
    const newOrder: P2POrder = {
      id: `p2p_${Date.now()}`,
      sellerId: 'current_user',
      sellerName: 'You',
      amount: parseFloat(sellAmount),
      pricePerToken: parseFloat(sellPrice),
      totalPrice: parseFloat(sellAmount) * parseFloat(sellPrice),
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      rating: 5.0,
      completedTrades: 0
    };
    
    setUserOrders([...userOrders, newOrder]);
    setSellAmount('');
    setSellPrice('');
    
    // Log the sell order creation
    console.log('💰 Sell order created:', {
      orderId: newOrder.id,
      amount: newOrder.amount,
      pricePerToken: newOrder.pricePerToken,
      totalValue: newOrder.totalPrice,
      timestamp: new Date().toISOString()
    });
  };

  const handleBuyP2P = async (order: P2POrder) => {
    // Log the P2P purchase
    console.log('🔄 P2P purchase initiated:', {
      orderId: order.id,
      seller: order.sellerName,
      amount: order.amount,
      totalCost: order.totalPrice,
      timestamp: new Date().toISOString()
    });
    
    // Simulate escrow process
    alert(`🔒 Escrow initiated for ${order.amount} DECH tokens from ${order.sellerName}. Transaction will complete in 5 minutes.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">DECH Marketplace</h2>
          <p className="text-gray-400 text-sm mt-1">Trade tokens and buy exclusive items</p>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-xl">
          <div className="text-xs text-blue-200">Your Balance</div>
          <div className="text-2xl font-bold text-white">{dechBalance.toFixed(0)} DECH</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'items'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Items
        </button>
        <button
          onClick={() => setActiveTab('p2p')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'p2p'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          P2P Trading
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'sell'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Sell Tokens
        </button>
      </div>

      {/* Items Tab Content */}
      {activeTab === 'items' && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const canAfford = dechBalance >= item.price;
          const isOutOfStock = item.stock === 0;

          return (
            <div
              key={item.id}
              className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border overflow-hidden transition-all hover:scale-105 ${
                canAfford && !isOutOfStock
                  ? 'border-blue-500/30 hover:border-blue-500/60 cursor-pointer'
                  : 'border-gray-700 opacity-60'
              }`}
              onClick={() => canAfford && !isOutOfStock && setSelectedItem(item)}
            >
              {/* Image */}
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 h-40 flex items-center justify-center text-6xl">
                {item.image}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </div>
                  {isOutOfStock && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                      Sold Out
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-3">{item.description}</p>

                {/* Benefits */}
                <div className="space-y-1 mb-4">
                  {item.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                      <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                      {benefit}
                    </div>
                  ))}
                </div>

                {/* Price and Stock */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{item.price} DECH</div>
                    <div className="text-xs text-gray-500">{item.stock} in stock</div>
                  </div>
                  <button
                    disabled={!canAfford || isOutOfStock}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      canAfford && !isOutOfStock
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isOutOfStock ? 'Sold Out' : canAfford ? 'Buy Now' : 'Insufficient DECH'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {/* P2P Trading Tab Content */}
      {activeTab === 'p2p' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-xl p-6 border border-green-500/20">
            <h3 className="text-xl font-bold text-white mb-2">Peer-to-Peer DECH Trading</h3>
            <p className="text-gray-400 text-sm">Buy DECH tokens directly from other users with escrow protection</p>
          </div>

          <div className="grid gap-4">
            {p2pOrders.map((order) => {
              const timeLeft = Math.max(0, new Date(order.expiresAt).getTime() - Date.now());
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              const canAfford = dechBalance >= order.totalPrice;

              return (
                <div key={order.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{order.sellerName}</h4>
                          <p className="text-xs text-gray-400">Verified Seller</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-300">
                        <span>🕒 {hoursLeft}h left</span>
                        <span>⭐ {order.rating}/5</span>
                        <span>📊 {order.completedTrades} trades</span>
                        <span>✅ Escrow Protected</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{order.amount.toLocaleString()} DECH</div>
                      <div className="text-green-400 font-medium">${order.pricePerToken.toFixed(3)}/token</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Total Amount</div>
                      <div className="font-bold text-white">{order.amount.toLocaleString()} DECH</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Price per Token</div>
                      <div className="font-bold text-green-400">${order.pricePerToken.toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">Total Price</div>
                      <div className="font-bold text-white">${order.totalPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBuyP2P(order)}
                      disabled={!canAfford}
                      className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                        canAfford
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Buy with Escrow' : 'Insufficient Balance'}
                    </button>
                    <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all">
                      Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sell Tokens Tab Content */}
      {activeTab === 'sell' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-bold text-white mb-2">Sell Your DECH Tokens</h3>
            <p className="text-gray-400 text-sm">List your DECH tokens for sale with automatic escrow protection</p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h4 className="text-lg font-bold text-white mb-4">Create Sell Order</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount to Sell</label>
                <div className="relative">
                  <input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="Enter DECH amount"
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="absolute right-3 top-3 text-gray-400 text-sm">DECH</div>
                </div>
                <div className="text-xs text-gray-400 mt-1">Available: {dechBalance.toFixed(1)} DECH</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price per Token</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="0.050"
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="absolute right-3 top-3 text-gray-400 text-sm">USD</div>
                </div>
                <div className="text-xs text-gray-400 mt-1">Market rate: ~$0.049/DECH</div>
              </div>
            </div>

            {sellAmount && sellPrice && (
              <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Total Value:</span>
                  <span className="text-white font-bold">${(parseFloat(sellAmount) * parseFloat(sellPrice)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Platform Fee (2%):</span>
                  <span className="text-red-400">-${((parseFloat(sellAmount) * parseFloat(sellPrice)) * 0.02).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-white">You'll Receive:</span>
                  <span className="text-green-400">${((parseFloat(sellAmount) * parseFloat(sellPrice)) * 0.98).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateSellOrder}
              disabled={!sellAmount || !sellPrice || parseFloat(sellAmount) > dechBalance}
              className={`w-full mt-6 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                sellAmount && sellPrice && parseFloat(sellAmount) <= dechBalance
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Create Sell Order
            </button>
          </div>

          {/* User's Active Orders */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h4 className="text-lg font-bold text-white mb-4">Your Active Orders</h4>
            {userOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p>No active sell orders</p>
                <p className="text-sm mt-1">Create your first sell order above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userOrders.map((order) => (
                  <div key={order.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{order.amount} DECH</div>
                        <div className="text-sm text-gray-400">${order.pricePerToken}/token</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">${order.totalPrice.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Active</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedItem.name}</h3>
                  <p className="text-gray-400 text-sm">{selectedItem.description}</p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Quantity Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(selectedItem.stock, parseInt(e.target.value) || 1)))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-center text-white"
                    min="1"
                    max={selectedItem.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedItem.stock, quantity + 1))}
                    className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Cost */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Total Cost</span>
                  <span className="text-2xl font-bold text-blue-400">
                    {(selectedItem.price * quantity).toFixed(0)} DECH
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Your Balance</span>
                  <span className={dechBalance >= selectedItem.price * quantity ? 'text-green-400' : 'text-red-400'}>
                    {dechBalance.toFixed(0)} DECH
                  </span>
                </div>
              </div>

              {/* Purchase Button */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing || dechBalance < selectedItem.price * quantity}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold ${
                    isPurchasing || dechBalance < selectedItem.price * quantity
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                  }`}
                >
                  {isPurchasing ? 'Processing...' : '💎 Confirm Purchase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
