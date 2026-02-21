"use client";

import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 180000); // Refresh every 3 minutes
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/option-chain/${symbol}/recommended`);
      
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      setRecommendations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
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

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-red-400">
          <p className="font-semibold">Error loading recommendations</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Group by type
  const callRecs = recommendations.filter(r => r.recommendationType.includes('CALL'));
  const putRecs = recommendations.filter(r => r.recommendationType.includes('PUT'));

  // Confidence badge color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 7) return 'bg-green-500';
    if (confidence >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Type badge color
  const getTypeColor = (type: string) => {
    if (type.includes('CALL')) return 'bg-green-600';
    return 'bg-red-600';
  };

  // Render recommendation card
  const renderRecommendation = (rec: StrikeRecommendation, idx: number) => (
    <div 
      key={idx}
      className="bg-gray-750 rounded-lg p-4 hover:bg-gray-700 transition-colors border border-gray-600"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getTypeColor(rec.recommendationType)}`}>
              {rec.recommendationType.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getConfidenceColor(rec.confidence)}`}>
              {rec.confidence.toFixed(1)}/10
            </span>
          </div>
          <div className="text-2xl font-bold text-white">
            {rec.strikePrice.toLocaleString()} {rec.recommendationType.includes('CALL') ? 'CE' : 'PE'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Premium</div>
          <div className="text-xl font-bold text-blue-400">
            ₹{rec.premium.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-gray-800 rounded p-2 mb-3">
        <p className="text-sm text-gray-300">{rec.reason}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <div className="text-gray-400">OI Change</div>
          <div className={`font-semibold ${rec.oiChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {rec.oiChange > 0 ? '+' : ''}{(rec.oiChange / 1000).toFixed(0)}K
          </div>
        </div>
        <div>
          <div className="text-gray-400">Volume</div>
          <div className="font-semibold text-white">{(rec.volume / 1000).toFixed(0)}K</div>
        </div>
        <div>
          <div className="text-gray-400">Liquidity</div>
          <div className="font-semibold text-blue-400">{rec.liquidity.toFixed(1)}/10</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-gray-600 flex justify-between text-xs text-gray-400">
        <span>{rec.expectedBehavior}</span>
        <span>{rec.atmDistance >= 0 ? '+' : ''}{rec.atmDistance.toFixed(2)}% from ATM</span>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Strike Recommendations</h2>
        <p className="text-gray-400 text-sm">{symbol} • Best strikes based on OI analysis</p>
      </div>

      {/* No recommendations */}
      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No recommendations available</p>
          <p className="text-sm mt-2">Waiting for option chain data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Call Recommendations */}
          {callRecs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Call Options
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {callRecs.map((rec, idx) => renderRecommendation(rec, idx))}
              </div>
            </div>
          )}

          {/* Put Recommendations */}
          {putRecs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                Put Options
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {putRecs.map((rec, idx) => renderRecommendation(rec, idx + callRecs.length))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500 text-center">
        Recommendations refresh every 3 minutes • Based on OI build-up analysis
      </div>
    </div>
  );
}
