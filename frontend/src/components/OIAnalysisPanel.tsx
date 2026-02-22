"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Target, Shield, Activity } from 'lucide-react';

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
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-900">Unable to load OI analysis</p>
            <p className="text-sm text-red-600 mt-1">{error || 'Service unavailable'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Color helpers
  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'BULLISH') return 'text-green-600';
    if (sentiment === 'BEARISH') return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentBg = (sentiment: string) => {
    if (sentiment === 'BULLISH') return 'bg-gradient-to-r from-green-500 to-green-600';
    if (sentiment === 'BEARISH') return 'bg-gradient-to-r from-red-500 to-red-600';
    return 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === 'BULLISH') return <TrendingUp className="w-6 h-6" />;
    if (sentiment === 'BEARISH') return <TrendingDown className="w-6 h-6" />;
    return <Activity className="w-6 h-6" />;
  };

  const getPCRColor = (pcr: number) => {
    if (pcr > 1.3) return 'text-green-600'; // Bullish
    if (pcr < 0.7) return 'text-red-600'; // Bearish
    return 'text-yellow-600'; // Neutral
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'CALL_HEAVY') return 'text-red-600';
    if (trend === 'PUT_HEAVY') return 'text-green-600';
    return 'text-gray-600';
  };

  const getBarColor = (score: number, type: 'bullish' | 'bearish') => {
    if (type === 'bullish') {
      if (score >= 7) return 'bg-gradient-to-r from-green-500 to-green-600';
      if (score >= 5) return 'bg-gradient-to-r from-green-600 to-green-700';
      return 'bg-gradient-to-r from-green-700 to-green-800';
    } else {
      if (score >= 7) return 'bg-gradient-to-r from-red-500 to-red-600';
      if (score >= 5) return 'bg-gradient-to-r from-red-600 to-red-700';
      return 'bg-gradient-to-r from-red-700 to-red-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">OI Analysis</h2>
            <p className="text-sm text-gray-600">{symbol} • Open Interest Intelligence</p>
          </div>
        </div>
      </div>

      {/* Overall Sentiment */}
      <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-500 font-semibold mb-2">Market Sentiment</div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white ${getSentimentBg(analysis.sentiment)}`}>
                {getSentimentIcon(analysis.sentiment)}
              </div>
              <div className={`text-3xl font-bold ${getSentimentColor(analysis.sentiment)}`}>
                {analysis.sentiment}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-semibold mb-2">Pattern Strength</div>
            <div className="text-3xl font-bold text-blue-600">
              {analysis.patternStrength.toFixed(1)}/10
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* PCR */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <div className="text-xs font-semibold text-blue-900">Put-Call Ratio</div>
          </div>
          <div className={`text-2xl font-bold ${getPCRColor(analysis.pcr)}`}>
            {analysis.pcr.toFixed(2)}
          </div>
          <div className="text-xs text-blue-700 mt-1 font-medium">
            {analysis.pcrInterpretation}
          </div>
        </div>

        {/* Max Pain */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-600" />
            <div className="text-xs font-semibold text-purple-900">Max Pain</div>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {analysis.maxPainStrike.toLocaleString()}
          </div>
          <div className="text-xs text-purple-700 mt-1 font-medium">
            Spot: {analysis.spotPrice.toLocaleString()}
            <span className={analysis.maxPainDistance > 0 ? 'text-green-600' : 'text-red-600'}>
              {' '}({analysis.maxPainDistance > 0 ? '+' : ''}{analysis.maxPainDistance.toFixed(0)})
            </span>
          </div>
        </div>
      </div>

      {/* OI Trend */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-900">OI Trend</span>
          <span className={`font-bold ${getTrendColor(analysis.oiTrend)}`}>
            {analysis.oiTrend.replace('_', ' ')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="text-xs text-red-700 font-semibold mb-1">Net Call OI Change</div>
            <div className={`text-lg font-bold ${
              analysis.netCallOIChange > 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {analysis.netCallOIChange > 0 ? '+' : ''}
              {(analysis.netCallOIChange / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-xs text-green-700 font-semibold mb-1">Net Put OI Change</div>
            <div className={`text-lg font-bold ${
              analysis.netPutOIChange > 0 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {analysis.netPutOIChange > 0 ? '+' : ''}
              {(analysis.netPutOIChange / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      </div>

      {/* Bullish vs Bearish Strength */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-600" />
          <span>Directional Strength</span>
        </h3>
        
        {/* Bullish */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-green-700">Bullish Strength</span>
            <span className="font-bold text-gray-900">{analysis.bullishScore.toFixed(1)}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getBarColor(analysis.bullishScore, 'bullish')}`}
              style={{ width: `${(analysis.bullishScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Bearish */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-red-700">Bearish Strength</span>
            <span className="font-bold text-gray-900">{analysis.bearishScore.toFixed(1)}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getBarColor(analysis.bearishScore, 'bearish')}`}
              style={{ width: `${(analysis.bearishScore / 10) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
        <div className="text-xs text-gray-700">
          <strong className="text-gray-900 font-bold">Quick Guide:</strong>
          <ul className="mt-2 space-y-1.5 text-gray-600">
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-2">•</span>
              <span>PCR &gt; 1.3: Bullish (Heavy put writing)</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 font-bold mr-2">•</span>
              <span>PCR &lt; 0.7: Bearish (Heavy call writing)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-2">•</span>
              <span>Put OI ↑: Support building</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 font-bold mr-2">•</span>
              <span>Call OI ↑: Resistance building</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
        Updated {new Date(analysis.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
