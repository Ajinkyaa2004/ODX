"use client";

import React, { useState, useEffect } from 'react';

interface OIAnalysis {
  symbol: string;
  pcr: number;
  pcrInterpretation: string;
  maxPainStrike: number;
  spotPrice: number;
  maxPainDistance: number;
  netCallOIChange: number;
  netPutOIChange: number;
  oiTrend: string;
  sentiment: string;
  bullishScore: number;
  bearishScore: number;
  patternStrength: number;
  timestamp: string;
}

interface OIAnalysisPanelProps {
  symbol: string;
}

export default function OIAnalysisPanel({ symbol }: OIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<OIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 180000); // Refresh every 3 minutes
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/option-chain/${symbol}/analysis`);
      
      if (!response.ok) throw new Error('Failed to fetch OI analysis');
      
      const data = await response.json();
      setAnalysis(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching OI analysis:', err);
      setError('Failed to load OI analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4"></div>
        <div className="h-48 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-red-400">
          <p className="font-semibold">Error loading OI analysis</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Color helpers
  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'BULLISH') return 'text-green-400';
    if (sentiment === 'BEARISH') return 'text-red-400';
    return 'text-gray-400';
  };

  const getPCRColor = (pcr: number) => {
    if (pcr > 1.3) return 'text-green-400'; // Bullish
    if (pcr < 0.7) return 'text-red-400'; // Bearish
    return 'text-yellow-400'; // Neutral
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'CALL_HEAVY') return 'text-red-400';
    if (trend === 'PUT_HEAVY') return 'text-green-400';
    return 'text-gray-400';
  };

  const getBarColor = (score: number, type: 'bullish' | 'bearish') => {
    if (type === 'bullish') {
      if (score >= 7) return 'bg-green-500';
      if (score >= 5) return 'bg-green-600';
      return 'bg-green-700';
    } else {
      if (score >= 7) return 'bg-red-500';
      if (score >= 5) return 'bg-red-600';
      return 'bg-red-700';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">OI Analysis</h2>
        <p className="text-gray-400 text-sm">{symbol} • Open Interest Intelligence</p>
      </div>

      {/* Overall Sentiment */}
      <div className="mb-6 p-4 bg-gray-750 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-400 mb-1">Market Sentiment</div>
            <div className={`text-3xl font-bold ${getSentimentColor(analysis.sentiment)}`}>
              {analysis.sentiment}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Pattern Strength</div>
            <div className="text-3xl font-bold text-blue-400">
              {analysis.patternStrength.toFixed(1)}/10
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* PCR */}
        <div className="bg-gray-750 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-2">Put-Call Ratio (PCR)</div>
          <div className={`text-2xl font-bold ${getPCRColor(analysis.pcr)}`}>
            {analysis.pcr.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {analysis.pcrInterpretation}
          </div>
        </div>

        {/* Max Pain */}
        <div className="bg-gray-750 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-2">Max Pain Strike</div>
          <div className="text-2xl font-bold text-purple-400">
            {analysis.maxPainStrike.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Spot: {analysis.spotPrice.toLocaleString()}
            <span className={analysis.maxPainDistance > 0 ? 'text-green-400' : 'text-red-400'}>
              {' '}({analysis.maxPainDistance > 0 ? '+' : ''}{analysis.maxPainDistance.toFixed(0)})
            </span>
          </div>
        </div>
      </div>

      {/* OI Trend */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">OI Trend</span>
          <span className={`font-semibold ${getTrendColor(analysis.oiTrend)}`}>
            {analysis.oiTrend.replace('_', ' ')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-750 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">Net Call OI Change</div>
            <div className={`text-lg font-bold ${
              analysis.netCallOIChange > 0 ? 'text-red-300' : 'text-gray-400'
            }`}>
              {analysis.netCallOIChange > 0 ? '+' : ''}
              {(analysis.netCallOIChange / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="bg-gray-750 rounded p-3">
            <div className="text-xs text-gray-400 mb-1">Net Put OI Change</div>
            <div className={`text-lg font-bold ${
              analysis.netPutOIChange > 0 ? 'text-green-300' : 'text-gray-400'
            }`}>
              {analysis.netPutOIChange > 0 ? '+' : ''}
              {(analysis.netPutOIChange / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      </div>

      {/* Bullish vs Bearish Strength */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white mb-3">Directional Strength</h3>
        
        {/* Bullish */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-400">Bullish Strength</span>
            <span className="text-white font-semibold">{analysis.bullishScore.toFixed(1)}/10</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getBarColor(analysis.bullishScore, 'bullish')}`}
              style={{ width: `${(analysis.bullishScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Bearish */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-red-400">Bearish Strength</span>
            <span className="text-white font-semibold">{analysis.bearishScore.toFixed(1)}/10</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getBarColor(analysis.bearishScore, 'bearish')}`}
              style={{ width: `${(analysis.bearishScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-gray-750 rounded-lg p-3 mb-4">
        <div className="text-xs text-gray-300">
          <strong className="text-white">Interpretation:</strong>
          <ul className="mt-2 space-y-1 text-gray-400">
            <li>• PCR &gt; 1.3: Bullish (Heavy put writing)</li>
            <li>• PCR &lt; 0.7: Bearish (Heavy call writing)</li>
            <li>• Put OI ↑: Support building (Bullish)</li>
            <li>• Call OI ↑: Resistance building (Bearish)</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Updated {new Date(analysis.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
