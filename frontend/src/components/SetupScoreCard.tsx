"use client";

import React, { useState, useEffect } from 'react';

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
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4"></div>
        <div className="h-32 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !scoreData) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-red-400">
          <p className="font-semibold">Error loading score</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { setup_score, components, market_bias } = scoreData;

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Bias color
  const getBiasColor = (bias: string) => {
    if (bias === 'BULLISH') return 'bg-green-500 text-white';
    if (bias === 'BEARISH') return 'bg-red-500 text-white';
    return 'bg-gray-500 text-white';
  };

  // Component bar width
  const getBarWidth = (score: number) => `${(score / 10) * 100}%`;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Setup Score</h2>
          <p className="text-gray-400 text-sm">{symbol} • {timeframe}</p>
        </div>
        <div className="text-right">
          <div className={`text-5xl font-bold ${getScoreColor(setup_score)}`}>
            {setup_score.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">out of 10</div>
        </div>
      </div>

      {/* Market Bias Badge */}
      <div className="mb-6">
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getBiasColor(market_bias)}`}>
          {market_bias}
        </span>
      </div>

      {/* Component Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-3">Component Breakdown</h3>
        
        {/* Trend */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">
              Trend • {components.trend.weight}%
            </span>
            <span className={getScoreColor(components.trend.score)}>
              {components.trend.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: getBarWidth(components.trend.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {components.trend.alignment} • {components.trend.slope}
          </div>
        </div>

        {/* VWAP */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">
              VWAP • {components.vwap.weight}%
            </span>
            <span className={getScoreColor(components.vwap.score)}>
              {components.vwap.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: getBarWidth(components.vwap.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {components.vwap.position} • {components.vwap.distance?.toFixed(2)}% away
          </div>
        </div>

        {/* Structure */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">
              Structure • {components.structure.weight}%
            </span>
            <span className={getScoreColor(components.structure.score)}>
              {components.structure.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: getBarWidth(components.structure.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {components.structure.pattern}
          </div>
        </div>

        {/* Momentum */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">
              Momentum • {components.momentum.weight}%
            </span>
            <span className={getScoreColor(components.momentum.score)}>
              {components.momentum.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: getBarWidth(components.momentum.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            RSI: {components.momentum.rsi?.toFixed(1)} • ROC: {components.momentum.roc?.toFixed(2)}%
          </div>
        </div>

        {/* Internals */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">
              Internals • {components.internals.weight}%
            </span>
            <span className={getScoreColor(components.internals.score)}>
              {components.internals.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: getBarWidth(components.internals.score) }}
            ></div>
          </div>
        </div>

        {/* OI Confirmation */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">
              OI Confirmation • {components.oi_confirmation.weight}%
            </span>
            <span className={getScoreColor(components.oi_confirmation.score)}>
              {components.oi_confirmation.score.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: getBarWidth(components.oi_confirmation.score) }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            PCR: {components.oi_confirmation.pcr?.toFixed(2)} • {components.oi_confirmation.sentiment}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500 text-center">
        Updated {new Date(scoreData.timestamp).toLocaleTimeString()} • 
        Evaluated in {scoreData.evaluation_time_seconds.toFixed(2)}s
      </div>
    </div>
  );
}
