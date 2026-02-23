"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Target, Award, RefreshCw } from 'lucide-react';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface StrikeRecommendation {
  symbol: string;
  recommendationType: string;
  strikePrice: number;
  confidence: number;
  reason: string;
  premium: number;
  liquidity: number;
  openInterest: number;
  oiChange: number;
  volume: number;
  delta?: number;
  atmDistance: number;
  expectedBehavior: string;
  marketBias: string;
}

interface StrikeRecommendationCardProps {
  symbol: string;
}

export default function StrikeRecommendationCard({ symbol }: StrikeRecommendationCardProps) {
  const [recommendations, setRecommendations] = useState<StrikeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/option-chain/${symbol}/recommended`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      const data = await response.json();
      setRecommendations(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [symbol]);

  const fetchRef = useRef(fetchRecommendations);
  fetchRef.current = fetchRecommendations;
  useEffect(() => {
    const tick = () => fetchRef.current?.();
    tick();
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-900">Unable to load recommendations</p>
            <p className="text-sm text-red-600 mt-1">{error || 'Service unavailable'}</p>
          </div>
          <button onClick={onRefresh} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200" title="Retry">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Group by type
  const callRecs = recommendations.filter(r => r.recommendationType.includes('CALL'));
  const putRecs = recommendations.filter(r => r.recommendationType.includes('PUT'));

  // Confidence badge color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 7) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (confidence >= 5) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  // Type badge color
  const getTypeColor = (type: string) => {
    if (type.includes('CALL')) return 'bg-green-600';
    return 'bg-red-600';
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('CALL')) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  // Render recommendation card
  const renderRecommendation = (rec: StrikeRecommendation, idx: number) => (
    <div 
      key={idx}
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 ${getTypeColor(rec.recommendationType)}`}>
              {getTypeIcon(rec.recommendationType)}
              {rec.recommendationType.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 ${getConfidenceColor(rec.confidence)}`}>
              <Award className="w-3 h-3" />
              {rec.confidence.toFixed(1)}/10
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {rec.strikePrice.toLocaleString()} <span className="text-lg text-gray-600">{rec.recommendationType.includes('CALL') ? 'CE' : 'PE'}</span>
          </div>
        </div>
        <div className="text-right bg-blue-50 rounded-lg px-3 py-2">
          <div className="text-xs text-blue-600 font-semibold">Premium</div>
          <div className="text-xl font-bold text-blue-700">
            ₹{rec.premium.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-4 border border-blue-100">
        <p className="text-sm text-gray-700 font-medium">{rec.reason}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 text-xs mb-4">
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-gray-500 font-semibold">OI Change</div>
          <div className={`font-bold text-base mt-1 ${
            rec.oiChange > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {rec.oiChange > 0 ? '+' : ''}{(rec.oiChange / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-gray-500 font-semibold">Volume</div>
          <div className="font-bold text-gray-900 text-base mt-1">{(rec.volume / 1000).toFixed(0)}K</div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-gray-500 font-semibold">Liquidity</div>
          <div className="font-bold text-blue-600 text-base mt-1">{rec.liquidity.toFixed(1)}/10</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-600 font-medium">{rec.expectedBehavior}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${
          Math.abs(rec.atmDistance) < 2 
            ? 'bg-yellow-100 text-yellow-700' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          {rec.atmDistance >= 0 ? '+' : ''}{rec.atmDistance.toFixed(2)}% ATM
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Strike Recommendations</h2>
            <p className="text-sm text-gray-600">{symbol} • AI-powered strike selection</p>
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
      </div>

      {/* No recommendations */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-700 font-semibold">No recommendations available</p>
          <p className="text-sm text-gray-500 mt-2">Waiting for option chain data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Call Recommendations */}
          {callRecs.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-green-700">Call Options</span>
                </div>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {callRecs.map((rec, idx) => renderRecommendation(rec, idx))}
              </div>
            </div>
          )}

          {/* Put Recommendations */}
          {putRecs.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-red-700">Put Options</span>
                </div>
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {putRecs.map((rec, idx) => renderRecommendation(rec, idx + callRecs.length))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        Updates every 5s • Based on OI build-up analysis
      </div>
    </div>
  );
}
