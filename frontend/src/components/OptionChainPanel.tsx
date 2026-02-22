"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, BarChart3 } from 'lucide-react';

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
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !chainData) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-900">Unable to load option chain</p>
            <p className="text-sm text-red-600 mt-1">{error || 'Service unavailable'}</p>
          </div>
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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Option Chain</h2>
            <p className="text-sm text-gray-600 mt-1">
              {symbol} • Spot: <span className="font-semibold">₹{chainData.spotPrice.toLocaleString()}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 font-medium mb-1">Put/Call Ratio</div>
          <div className="text-3xl font-bold text-blue-600">
            {chainData.pcr.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {chainData.pcr > 1.3 ? 'Bullish' : chainData.pcr < 0.7 ? 'Bearish' : 'Neutral'}
          </div>
        </div>
      </div>

      {/* Option Chain Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th colSpan={5} className="px-4 py-3 text-center text-green-700 font-bold">
                CALLS
              </th>
              <th className="px-4 py-3 text-center text-gray-900 font-bold border-x-2 border-gray-300 bg-white">
                STRIKE
              </th>
              <th colSpan={5} className="px-4 py-3 text-center text-red-700 font-bold">
                PUTS
              </th>
            </tr>
            <tr className="text-gray-600 border-t border-gray-200 bg-white">
              <th className="px-2 py-2 text-right text-xs font-semibold">OI</th>
              <th className="px-2 py-2 text-right text-xs font-semibold">Chg%</th>
              <th className="px-2 py-2 text-right text-xs font-semibold">Vol</th>
              <th className="px-2 py-2 text-right text-xs font-semibold">LTP</th>
              <th className="px-2 py-2 text-center text-xs font-semibold">Liq</th>
              
              <th className="px-2 py-2 text-center border-x-2 border-gray-300 bg-gray-50 text-xs font-semibold">Price</th>
              
              <th className="px-2 py-2 text-center text-xs font-semibold">Liq</th>
              <th className="px-2 py-2 text-left text-xs font-semibold">LTP</th>
              <th className="px-2 py-2 text-left text-xs font-semibold">Vol</th>
              <th className="px-2 py-2 text-left text-xs font-semibold">Chg%</th>
              <th className="px-2 py-2 text-left text-xs font-semibold">OI</th>
            </tr>
          </thead>
          <tbody>
            {chainData.strikes.map((strike, idx) => (
              <tr 
                key={idx}
                className={`border-t border-gray-100 hover:bg-blue-50 transition-colors ${
                  strike.isAtm ? 'bg-yellow-50 font-semibold' : 'bg-white'
                }`}
              >
                {/* Call Data */}
                <td className="px-2 py-3 text-right text-green-700 font-medium">
                  <div className="relative">
                    <div 
                      className="absolute right-0 top-0 h-full bg-green-100 rounded"
                      style={{ width: getOIBarWidth(strike.call.openInterest, maxCallOI) }}
                    ></div>
                    <span className="relative z-10">
                      {(strike.call.openInterest / 1000).toFixed(0)}K
                    </span>
                  </div>
                </td>
                <td className={`px-2 py-3 text-right font-semibold ${getOIChangeColor(strike.call.oiChangePercent)}`}>
                  {strike.call.oiChangePercent > 0 ? '+' : ''}
                  {strike.call.oiChangePercent.toFixed(1)}%
                </td>
                <td className="px-2 py-3 text-right text-gray-600">
                  {(strike.call.volume / 1000).toFixed(0)}K
                </td>
                <td className="px-2 py-3 text-right text-gray-900 font-semibold">
                  ₹{strike.call.ltp.toFixed(2)}
                </td>
                <td className="px-2 py-3 text-center">
                  <div className="w-12 bg-gray-200 rounded-full h-2 mx-auto">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(strike.call.liquidityScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </td>

                {/* Strike Price */}
                <td className="px-2 py-3 text-center font-bold text-gray-900 border-x-2 border-gray-300 bg-gray-50">
                  {strike.strikePrice.toLocaleString()}
                  {strike.isAtm && (
                    <span className="block text-xs text-yellow-700 font-semibold">ATM</span>
                  )}
                </td>

                {/* Put Data */}
                <td className="px-2 py-3 text-center">
                  <div className="w-12 bg-gray-200 rounded-full h-2 mx-auto">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(strike.put.liquidityScore / 10) * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-2 py-3 text-left text-gray-900 font-semibold">
                  ₹{strike.put.ltp.toFixed(2)}
                </td>
                <td className="px-2 py-3 text-left text-gray-600">
                  {(strike.put.volume / 1000).toFixed(0)}K
                </td>
                <td className={`px-2 py-3 text-left font-semibold ${getOIChangeColor(strike.put.oiChangePercent)}`}>
                  {strike.put.oiChangePercent > 0 ? '+' : ''}
                  {strike.put.oiChangePercent.toFixed(1)}%
                </td>
                <td className="px-2 py-3 text-left text-red-700 font-medium">
                  <div className="relative">
                    <div 
                      className="absolute left-0 top-0 h-full bg-red-100 rounded"
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
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div className="flex gap-4">
            <span><span className="font-semibold">OI:</span> Open Interest</span>
            <span><span className="font-semibold">Vol:</span> Volume</span>
            <span><span className="font-semibold">LTP:</span> Last Traded Price</span>
            <span><span className="font-semibold">Liq:</span> Liquidity Score</span>
          </div>
          <div className="text-gray-500">
            Updated {new Date(chainData.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
