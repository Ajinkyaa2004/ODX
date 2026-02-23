"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, BarChart3, RefreshCw } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
  /** Live spot from ticker (updates every 1s) - avoids mismatch with NIFTY 50 / BANKNIFTY ticker */
  liveSpotPrice?: number;
}

const POLL_MS = 2000;

export default function OptionChainPanel({ symbol, liveSpotPrice }: OptionChainPanelProps) {
  const [chainData, setChainData] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());
  const mountedRef = useRef(true);

  // Update "now" every second so "Xs ago" and footer visibly change (proves polling is alive)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchOptionChain = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/option-chain/${symbol}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Pragma: 'no-cache' },
      });
      if (!response.ok) throw new Error('Failed to fetch option chain');
      const data = await response.json();
      if (!mountedRef.current) return;
      setChainData(data);
      setLastFetchedAt(new Date());
      setError(null);
    } catch (err) {
      if (mountedRef.current) {
        console.error('Error fetching option chain:', err);
        setError('Failed to load option chain');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [symbol]);

  // Ref so interval always calls latest fetch (never re-run effect = interval never cleared)
  const fetchRef = useRef(fetchOptionChain);
  fetchRef.current = fetchOptionChain;

  useEffect(() => {
    mountedRef.current = true;
    const tick = () => fetchRef.current?.();
    tick();
    const intervalId = setInterval(tick, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [symbol]); // only when symbol changes (e.g. switch panel); never from parent re-renders

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchRef.current?.();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOptionChain();
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
          <div className="flex-1">
            <p className="font-semibold text-red-900">Unable to load option chain</p>
            <p className="text-sm text-red-600 mt-1">{error || 'Service unavailable'}</p>
          </div>
          <button onClick={onRefresh} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200" title="Retry">
            <RefreshCw className="w-4 h-4" />
          </button>
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
              {symbol} • Spot: <span className="font-semibold">₹{(liveSpotPrice ?? chainData.spotPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              {liveSpotPrice !== undefined && (
                <span className="ml-1.5 text-xs text-green-600 font-medium">live</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
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
          <div className="text-gray-500 font-medium">
            Updated {lastFetchedAt ? lastFetchedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}
            {lastFetchedAt && (
              <span className="ml-1 text-green-600">
                ({Math.round((now.getTime() - lastFetchedAt.getTime()) / 1000)}s ago, next in {Math.max(0, POLL_MS / 1000 - Math.round((now.getTime() - lastFetchedAt.getTime()) / 1000))}s)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
