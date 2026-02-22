"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Activity, Zap, BarChart2, AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    fetchScore();
    const interval = setInterval(fetchScore, 180000); // Refresh every 3 minutes
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const fetchScore = async () => {
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
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !scoreData) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-900">Unable to load score data</p>
            <p className="text-sm text-red-600 mt-1">{error || 'Service unavailable'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { setup_score, components, market_bias } = scoreData;

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Bias color
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

  // Component bar width
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
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Score</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{symbol}</span>
            <span className="text-gray-400">•</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">{timeframe}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-5xl font-bold ${getScoreColor(setup_score)}`}>
            {setup_score.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500 font-medium mt-1">out of 10</div>
        </div>
      </div>

      {/* Market Bias Badge */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md ${getBiasColor(market_bias)}`}>
          {getBiasIcon(market_bias)}
          <span>{market_bias}</span>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <span>Component Analysis</span>
        </h3>
        
        {/* Trend */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('trend')}
              <span className="text-sm font-semibold text-gray-900">
                Trend
              </span>
              <span className="text-xs text-gray-500">• {components.trend.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.trend.score)}`}>
              {components.trend.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.trend.score)}`}
              style={{ width: getBarWidth(components.trend.score) }}
            ></div>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-white rounded font-medium text-gray-700">
              {components.trend.alignment}
            </span>
            <span className="text-xs px-2 py-1 bg-white rounded font-medium text-gray-700">
              {components.trend.slope}
            </span>
          </div>
        </div>

        {/* VWAP */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('vwap')}
              <span className="text-sm font-semibold text-gray-900">
                VWAP
              </span>
              <span className="text-xs text-gray-500">• {components.vwap.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.vwap.score)}`}>
              {components.vwap.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.vwap.score)}`}
              style={{ width: getBarWidth(components.vwap.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            {components.vwap.position} • {components.vwap.distance?.toFixed(2)}% distance
          </div>
        </div>

        {/* Structure */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('structure')}
              <span className="text-sm font-semibold text-gray-900">
                Structure
              </span>
              <span className="text-xs text-gray-500">• {components.structure.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.structure.score)}`}>
              {components.structure.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.structure.score)}`}
              style={{ width: getBarWidth(components.structure.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            {components.structure.pattern}
          </div>
        </div>

        {/* Momentum */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('momentum')}
              <span className="text-sm font-semibold text-gray-900">
                Momentum
              </span>
              <span className="text-xs text-gray-500">• {components.momentum.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.momentum.score)}`}>
              {components.momentum.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.momentum.score)}`}
              style={{ width: getBarWidth(components.momentum.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            RSI: {components.momentum.rsi?.toFixed(1)} • ROC: {components.momentum.roc?.toFixed(2)}%
          </div>
        </div>

        {/* Internals */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('internals')}
              <span className="text-sm font-semibold text-gray-900">
                Internals
              </span>
              <span className="text-xs text-gray-500">• {components.internals.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.internals.score)}`}>
              {components.internals.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.internals.score)}`}
              style={{ width: getBarWidth(components.internals.score) }}
            ></div>
          </div>
        </div>

        {/* OI Confirmation */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getComponentIcon('oi_confirmation')}
              <span className="text-sm font-semibold text-gray-900">
                OI Confirmation
              </span>
              <span className="text-xs text-gray-500">• {components.oi_confirmation.weight}%</span>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(components.oi_confirmation.score)}`}>
              {components.oi_confirmation.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(components.oi_confirmation.score)}`}
              style={{ width: getBarWidth(components.oi_confirmation.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-2">
            PCR: {components.oi_confirmation.pcr?.toFixed(2)} • {components.oi_confirmation.sentiment}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        Updated {new Date(scoreData.timestamp).toLocaleTimeString()} • 
        Evaluated in {scoreData.evaluation_time_seconds.toFixed(2)}s
      </div>
    </div>
  );
}
