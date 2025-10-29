"use client";

import { useState } from "react";
import { ChargePoint } from "@/data/realChargePoints";

interface ChargingConfirmationModalProps {
  station: ChargePoint;
  onConfirm: () => void;
  onCancel: () => void;
  userBalance: number;
}

export const ChargingConfirmationModal = ({
  station,
  onConfirm,
  onCancel,
  userBalance
}: ChargingConfirmationModalProps) => {
  const [targetKwh, setTargetKwh] = useState(20);
  const availableConnectors = station.connectors.filter(c => c.status === 'available');
  const maxPower = Math.max(...station.connectors.map(c => c.power_kw));
  const estimatedCost = (targetKwh * station.pricing.energy_based.rate) / 78; // Convert INR to USD
  const estimatedTime = Math.ceil((targetKwh / maxPower) * 60); // minutes
  const dechReward = Math.floor(targetKwh * 10); // 10 DECH per kWh

  const canAfford = userBalance >= estimatedCost;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 max-w-lg w-full shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Start Charging Session</h2>
              <p className="text-gray-400 text-sm">{station.name}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Station Info */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Location</div>
                <div className="text-sm text-white font-medium">{station.location.address}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Max Power</div>
                <div className="text-sm text-white font-medium">{maxPower}kW</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Rate</div>
                <div className="text-sm text-white font-medium">₹{station.pricing.energy_based.rate}/kWh</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Available Ports</div>
                <div className="text-sm text-white font-medium">{availableConnectors.length}/{station.no_of_connectors}</div>
              </div>
            </div>
          </div>

          {/* Energy Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Charging Amount
            </label>
            <div className="space-y-3">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={targetKwh}
                onChange={(e) => setTargetKwh(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">5 kWh</span>
                <span className="text-blue-400 font-bold text-lg">{targetKwh} kWh</span>
                <span className="text-gray-400">50 kWh</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-4 border border-blue-500/30">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Energy Cost</span>
                <span className="text-white font-semibold">${estimatedCost.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Estimated Time</span>
                <span className="text-white font-semibold">~{estimatedTime} min</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                <span className="text-blue-400 font-medium">DECH Reward</span>
                <span className="text-blue-400 font-bold text-lg">+{dechReward} DECH</span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <span className="text-sm text-gray-400">Your Balance</span>
            <span className={`text-sm font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
              ${userBalance.toFixed(2)} USD
            </span>
          </div>

          {!canAfford && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-red-400 font-medium text-sm">Insufficient Balance</div>
                <div className="text-red-300 text-xs mt-1">Please add funds to your account to continue</div>
              </div>
            </div>
          )}

          {/* Available Connectors */}
          <div>
            <div className="text-sm font-medium text-gray-300 mb-2">Available Connectors</div>
            <div className="flex flex-wrap gap-2">
              {availableConnectors.map((connector) => (
                <div
                  key={connector.id}
                  className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium"
                >
                  {connector.type} • {connector.power_kw}kW
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (canAfford) {
                onConfirm();
              }
            }}
            disabled={!canAfford}
            className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
              canAfford
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canAfford ? '⚡ Start Charging' : '💰 Add Funds'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
