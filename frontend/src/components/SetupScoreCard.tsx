"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Target, Activity, Zap, BarChart2, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';

interface ScoreComponents {
  trend: {
    score: number;
    weight: number;
    alignment: string;
    slope: string;
  };
  vwap: {
    score: number;
    weight: number;
    position: string;
    distance: number;
  };
  structure: {
    score: number;
    weight: number;
    pattern: string;
  };
  momentum: {
    score: number;
    weight: number;
    rsi: number;
    roc: number;
  };
  internals: {
    score: number;
    weight: number;
  };
  oi_confirmation: {
    score: number;
    weight: number;
    pcr: number;
    sentiment: string;
  };
}

interface ScoreData {
  symbol: string;
  timeframe: string;
  timestamp: string;
  setup_score: number;
  components: ScoreComponents;
  market_bias: string;
  evaluation_time_seconds: number;
}

interface SetupScoreCardProps {
  symbol: string;
  timeframe?: string;
}

export default function SetupScoreCard({ symbol, timeframe = "5m" }: SetupScoreCardProps) {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTime, setIsRealTime] = useState(false);

  const fetchScore = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:8001/api/quant/score/${symbol}?timeframe=${timeframe}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch score');
      
      const data = await response.json();
      setScoreData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching score:', err);
      setError('Failed to load score data');
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Socket.io connection for real-time updates
  useEffect(() => {
    const socketInstance = io('http://localhost:8001', {
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });

    socketInstance.on('connect', () => {
      console.log('SetupScoreCard: Socket.io connected to quant-engine');
      setIsRealTime(true);
      socketInstance.emit('subscribe', `${symbol}_${timeframe}`);
      socketInstance.emit('subscribe', symbol);
    });

    socketInstance.on('disconnect', () => {
      console.log('SetupScoreCard: Socket.io disconnected');
      setIsRealTime(false);
    });

    socketInstance.on('setup_score_update', (data: any) => {
      console.log('SetupScoreCard: Received real-time update:', data);
      if (data.symbol === symbol && data.timeframe === timeframe) {
        setScoreData({
          symbol: data.symbol,
          timeframe: data.timeframe,
          timestamp: data.timestamp,
          setup_score: data.score,
          components: data.components,
          market_bias: data.bias,
          evaluation_time_seconds: 0
        });
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchScore();
    const interval = setInterval(fetchScore, 180000);
    return () => clearInterval(interval);
  }, [fetchScore]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !scoreData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">Unable to load score data</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error || 'Service unavailable'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { setup_score, components, market_bias } = scoreData;

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600 dark:text-green-400';
    if (score >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBiasColor = (bias: string) => {
    if (bias === 'BULLISH') return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
    if (bias === 'BEARISH') return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const getBiasIcon = (bias: string) => {
    if (bias === 'BULLISH') return <TrendingUp className="w-5 h-5" />;
    if (bias === 'BEARISH') return <TrendingDown className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  const getBarWidth = (score: number) => `${(score / 10) * 100}%`;

  const getBarColor = (score: number) => {
    if (score >= 7) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 5) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'vwap': return <Target className="w-4 h-4" />;
      case 'structure': return <BarChart2 className="w-4 h-4" />;
      case 'momentum': return <Zap className="w-4 h-4" />;
      case 'internals': return <Activity className="w-4 h-4" />;
      case 'oi_confirmation': return <BarChart2 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Setup Score</h2>
            {isRealTime && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{symbol}</span>
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-semibold">{timeframe}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-5xl font-bold ${getScoreColor(setup_score)}`}>
            {setup_score.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">out of 10</div>
        </div>
      </div>

      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md ${getBiasColor(market_bias)}`}>
          {getBiasIcon(market_bias)}
          <span>{market_bias}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Component Analysis</span>
        </h3>
        
        {/* Trend */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('trend')}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Trend</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {components.trend.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.trend.score)}`}>
              {components.trend.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.trend.score)}`}
              style={{ width: getBarWidth(components.trend.score) }}
            ></div>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded font-medium text-gray-700 dark:text-gray-300">
              {components.trend.alignment}
            </span>
            <span className="text-xs px-2 py-1 bg-white dark:bg-gray-800 rounded font-medium text-gray-700 dark:text-gray-300">
              {components.trend.slope}
            </span>
          </div>
        </div>

        {/* VWAP */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('vwap')}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">VWAP</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {components.vwap.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.vwap.score)}`}>
              {components.vwap.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.vwap.score)}`}
              style={{ width: getBarWidth(components.vwap.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {components.vwap.position} • {components.vwap.distance?.toFixed(2)}% distance
          </div>
        </div>

        {/* Structure */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('structure')}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Structure</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {components.structure.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.structure.score)}`}>
              {components.structure.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.structure.score)}`}
              style={{ width: getBarWidth(components.structure.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {components.structure.pattern}
          </div>
        </div>

        {/* Momentum */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('momentum')}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Momentum</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {components.momentum.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.momentum.score)}`}>
              {components.momentum.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.momentum.score)}`}
              style={{ width: getBarWidth(components.momentum.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            RSI: {components.momentum.rsi?.toFixed(1)} • ROC: {components.momentum.roc?.toFixed(2)}%
          </div>
        </div>

        {/* Internals */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('internals')}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Internals</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {components.internals.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.internals.score)}`}>
              {components.internals.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.internals.score)}`}
              style={{ width: getBarWidth(components.internals.score) }}
            ></div>
          </div>
        </div>

        {/* OI Confirmation */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('oi_confirmation')}
              <span className="text-sm font-semibold text-gray-900 dark:text-white">OI Confirmation</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">• {components.oi_confirmation.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.oi_confirmation.score)}`}>
              {components.oi_confirmation.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.oi_confirmation.score)}`}
              style={{ width: getBarWidth(components.oi_confirmation.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            PCR: {components.oi_confirmation.pcr?.toFixed(2)} • {components.oi_confirmation.sentiment}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
        Updated {new Date(scoreData.timestamp).toLocaleTimeString()} • 
        Evaluated in {scoreData.evaluation_time_seconds.toFixed(2)}s
      </div>
    </div>
  );
}
