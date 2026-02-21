"use client";

import React, { useState, useEffect } from 'react';

interface OptionData {
  openInterest: number;
  oiChange: number;
  oiChangePercent: number;
  volume: number;
  ltp: number;
  bid: number;
  ask: number;
  liquidityScore: number;
  delta?: number;
}

interface StrikeData {
  strikePrice: number;
  call: OptionData;
  put: OptionData;
  isAtm: boolean;
  atmDistance: number;
  compositeScore: number;
  totalOI: number;
  strikePCR: number;
}

interface OptionChainData {
  symbol: string;
  spotPrice: number;
  atmStrike: number;
  strikes: StrikeData[];
  pcr: number;
  sentiment: string;
  timestamp: string;
}

interface OptionChainPanelProps {
  symbol: string;
}

export default function OptionChainPanel({ symbol }: OptionChainPanelProps) {
  const [chainData, setChainData] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOptionChain();
    const interval = setInterval(fetchOptionChain, 180000); // Refresh every 3 minutes
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchOptionChain = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/option-chain/${symbol}`);
      
      if (!response.ok) throw new Error('Failed to fetch option chain');
      
      const data = await response.json();
      setChainData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching option chain:', err);
      setError('Failed to load option chain');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4"></div>
        <div className="h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !chainData) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-red-400">
          <p className="font-semibold">Error loading option chain</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Color for OI change
  const getOIChangeColor = (change: number) => {
    if (change > 10) return 'text-green-400';
    if (change < -10) return 'text-red-400';
    return 'text-gray-400';
  };

  // Bar width for OI visualization
  const getOIBarWidth = (oi: number, maxOI: number) => {
    return `${(oi / maxOI) * 100}%`;
  };

  const maxCallOI = Math.max(...chainData.strikes.map(s => s.call.openInterest));
  const maxPutOI = Math.max(...chainData.strikes.map(s => s.put.openInterest));

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Option Chain</h2>
          <p className="text-gray-400 text-sm">
            {symbol} • Spot: ₹{chainData.spotPrice.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">PCR</div>
          <div className="text-2xl font-bold text-blue-400">
            {chainData.pcr.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Option Chain Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-700">
            <tr>
              <th colSpan={5} className="px-4 py-3 text-center text-green-400 font-semibold">
                CALLS
              </th>
              <th className="px-4 py-3 text-center text-white font-semibold border-x-2 border-gray-600">
                STRIKE
              </th>
              <th colSpan={5} className="px-4 py-3 text-center text-red-400 font-semibold">
                PUTS
              </th>
            </tr>
            <tr className="text-gray-300 border-t border-gray-600">
              <th className="px-2 py-2 text-right">OI</th>
              <th className="px-2 py-2 text-right">Chg%</th>
              <th className="px-2 py-2 text-right">Vol</th>
              <th className="px-2 py-2 text-right">LTP</th>
              <th className="px-2 py-2 text-center">Liq</th>
              
              <th className="px-2 py-2 text-center border-x-2 border-gray-600">Price</th>
              
              <th className="px-2 py-2 text-center">Liq</th>
              <th className="px-2 py-2 text-left">LTP</th>
              <th className="px-2 py-2 text-left">Vol</th>
              <th className="px-2 py-2 text-left">Chg%</th>
              <th className="px-2 py-2 text-left">OI</th>
            </tr>
          </thead>
          <tbody>
            {chainData.strikes.map((strike, idx) => (
              <tr 
                key={idx}
                className={`border-t border-gray-700 hover:bg-gray-700 transition-colors ${
                  strike.isAtm ? 'bg-gray-750 font-semibold' : ''
                }`}
              >
                {/* Call Data */}
                <td className="px-2 py-3 text-right text-green-300">
                  <div className="relative">
                    <div 
                      className="absolute right-0 top-0 h-full bg-green-500 bg-opacity-20"
                      style={{ width: getOIBarWidth(strike.call.openInterest, maxCallOI) }}
                    ></div>
                    <span className="relative z-10">
                      {(strike.call.openInterest / 1000).toFixed(0)}K
                    </span>
                  </div>
                </td>
                <td className={`px-2 py-3 text-right ${getOIChangeColor(strike.call.oiChangePercent)}`}>
                  {strike.call.oiChangePercent > 0 ? '+' : ''}
                  {strike.call.oiChangePercent.toFixed(1)}%
                </td>
                <td className="px-2 py-3 text-right text-gray-400">
                  {(strike.call.volume / 1000).toFixed(0)}K
                </td>
                <td className="px-2 py-3 text-right text-white">
                  ₹{strike.call.ltp.toFixed(2)}
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="w-12 bg-gray-600 rounded-full h-2 mx-auto">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(strike.call.liquidityScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </td>

                {/* Strike Price */}
                <td className="px-2 py-3 text-center font-bold text-white border-x-2 border-gray-600">
                  {strike.strikePrice.toLocaleString()}
                  {strike.isAtm && (
                    <span className="ml-2 text-xs text-yellow-400">ATM</span>
                  )}
                </td>

                {/* Put Data */}
                <td className="px-2 py-3 text-center">
                  <div className="w-12 bg-gray-600 rounded-full h-2 mx-auto">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(strike.put.liquidityScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-2 py-3 text-left text-white">
                  ₹{strike.put.ltp.toFixed(2)}
                </td>
                <td className="px-2 py-3 text-left text-gray-400">
                  {(strike.put.volume / 1000).toFixed(0)}K
                </td>
                <td className={`px-2 py-3 text-left ${getOIChangeColor(strike.put.oiChangePercent)}`}>
                  {strike.put.oiChangePercent > 0 ? '+' : ''}
                  {strike.put.oiChangePercent.toFixed(1)}%
                </td>
                <td className="px-2 py-3 text-left text-red-300">
                  <div className="relative">
                    <div 
                      className="absolute left-0 top-0 h-full bg-red-500 bg-opacity-20"
                      style={{ width: getOIBarWidth(strike.put.openInterest, maxPutOI) }}
                    ></div>
                    <span className="relative z-10">
                      {(strike.put.openInterest / 1000).toFixed(0)}K
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        OI: Open Interest • Vol: Volume • LTP: Last Traded Price • Liq: Liquidity Score
        <br />
        Updated {new Date(chainData.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
