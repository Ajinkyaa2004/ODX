"use client";

import React, { useState, useEffect } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';

interface CandleData {
  timestamp: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9?: number;
  ema20?: number;
  ema50?: number;
  vwap?: number;
}

interface PriceChartProps {
  symbol: string;
  initialTimeframe?: string;
  atmStrike?: number;
}

export default function PriceChart({ symbol, initialTimeframe = "5m", atmStrike }: PriceChartProps) {
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const fetchChartData = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/market-data/ohlc/${symbol}?timeframe=${timeframe}&limit=50`
      );
      
      if (!response.ok) throw new Error('Failed to fetch chart data');
      
      const data = await response.json();
      
      // Format data for chart
      const formattedData = data.map((candle: any) => ({
        timestamp: candle.timestamp,
        time: new Date(candle.timestamp).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
        volume: candle.volume || 0,
        ema9: candle.ema9 ? Number(candle.ema9) : undefined,
        ema20: candle.ema20 ? Number(candle.ema20) : undefined,
        ema50: candle.ema50 ? Number(candle.ema50) : undefined,
        vwap: candle.vwap ? Number(candle.vwap) : undefined
      }));
      
      setChartData(formattedData);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart');
    } finally {
      setLoading(false);
    }
  };

  // Custom candlestick renderer
  const CandleStick = (props: any) => {
    const { x, y, width, height, open, close, high, low } = props;
    const isGreen = close > open;
    const color = isGreen ? '#10b981' : '#ef4444';
    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(close, open);
    
    return (
      <g>
        {/* Wick (high-low line) */}
        <line
          x1={x + width / 2}
          y1={y + height - (high - low)}
          x2={x + width / 2}
          y2={y + height}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + 1}
          y={y + height - (bodyY - low) - bodyHeight}
          width={Math.max(width - 2, 1)}
          height={Math.max(bodyHeight, 1)}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isGreen = data.close > data.open;
      
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
            {data.time}
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Open:</span>
              <span className="font-semibold">₹{data.open.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">High:</span>
              <span className="font-semibold text-green-600">₹{data.high.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Low:</span>
              <span className="font-semibold text-red-600">₹{data.low.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Close:</span>
              <span className={`font-semibold ${isGreen ? 'text-green-600' : 'text-red-600'}`}>
                ₹{data.close.toFixed(2)}
              </span>
            </div>
            {data.volume && (
              <div className="flex justify-between gap-4 pt-1 border-t border-gray-200">
                <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                <span className="font-semibold">{data.volume.toLocaleString()}</span>
              </div>
            )}
            {data.ema9 && (
              <div className="flex justify-between gap-4 pt-1 border-t border-gray-200">
                <span className="text-blue-600">EMA9:</span>
                <span className="font-semibold">₹{data.ema9.toFixed(2)}</span>
              </div>
            )}
            {data.ema20 && (
              <div className="flex justify-between gap-4">
                <span className="text-purple-600">EMA20:</span>
                <span className="font-semibold">₹{data.ema20.toFixed(2)}</span>
              </div>
            )}
            {data.vwap && (
              <div className="flex justify-between gap-4">
                <span className="text-orange-600">VWAP:</span>
                <span className="font-semibold">₹{data.vwap.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 p-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-400">Unable to load chart</p>
            <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
          </div>
          <button 
            onClick={fetchChartData}
            className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const latestCandle = chartData[chartData.length - 1];
  const isGreen = latestCandle && latestCandle.close > latestCandle.open;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isGreen ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
            {isGreen ? (
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {symbol} Price Chart
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString('en-IN')}
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {['1m', '5m', '15m', '30m'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
          <button
            onClick={fetchChartData}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => `₹${value.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* ATM Strike Line */}
          {atmStrike && (
            <ReferenceLine 
              y={atmStrike} 
              stroke="#f59e0b" 
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ 
                value: `ATM ${atmStrike}`, 
                position: 'right',
                fill: '#f59e0b',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
          )}
          
          {/* EMA Lines */}
          <Line 
            type="monotone" 
            dataKey="ema9" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            name="EMA 9"
          />
          <Line 
            type="monotone" 
            dataKey="ema20" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            dot={false}
            name="EMA 20"
          />
          <Line 
            type="monotone" 
            dataKey="ema50" 
            stroke="#06b6d4" 
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="5 5"
            name="EMA 50"
          />
          
          {/* VWAP Line */}
          <Line 
            type="monotone" 
            dataKey="vwap" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={false}
            strokeDasharray="3 3"
            name="VWAP"
          />
          
          {/* Volume Bars */}
          <Bar 
            dataKey="volume" 
            fill="#9ca3af" 
            opacity={0.3}
            yAxisId="volume"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">EMA 9</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-purple-600"></div>
          <span className="text-gray-600 dark:text-gray-400">EMA 20</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-cyan-600" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #06b6d4, #06b6d4 5px, transparent 5px, transparent 10px)' }}></div>
          <span className="text-gray-600 dark:text-gray-400">EMA 50</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-orange-600" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b, #f59e0b 3px, transparent 3px, transparent 6px)' }}></div>
          <span className="text-gray-600 dark:text-gray-400">VWAP</span>
        </div>
        {atmStrike && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-orange-600" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b, #f59e0b 5px, transparent 5px, transparent 10px)' }}></div>
            <span className="text-gray-600 dark:text-gray-400">ATM Strike</span>
          </div>
        )}
      </div>
    </div>
  );
}
