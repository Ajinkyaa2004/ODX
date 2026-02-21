'use client';

import { useEffect, useState } from 'react';
import { useSocketIO } from '@/hooks/useSocketIO';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from 'lucide-react';
import SetupScoreCard from '@/components/SetupScoreCard';
import OptionChainPanel from '@/components/OptionChainPanel';
import StrikeRecommendationCard from '@/components/StrikeRecommendationCard';
import OIAnalysisPanel from '@/components/OIAnalysisPanel';

interface Indicator {
  ema: {
    ema9: number;
    ema20: number;
    ema50: number;
    slope: string;
    alignment: string;
  };
  vwap: {
    value: number;
    position: string;
    distance: number;
  };
}

export default function DashboardPage() {
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:9092';
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  
  const { connected, prices, marketStatus, subscribe } = useSocketIO(socketUrl);
  
  const [indicators, setIndicators] = useState<Record<string, Record<string, Indicator>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to NIFTY and BANKNIFTY
    subscribe('NIFTY');
    subscribe('BANKNIFTY');
    
    // Fetch initial indicators
    fetchIndicators();
    
    // Fetch indicators every 3 minutes
    const interval = setInterval(fetchIndicators, 180000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchIndicators = async () => {
    try {
      const symbols = ['NIFTY', 'BANKNIFTY'];
      const timeframes = ['5m', '15m'];
      
      for (const symbol of symbols) {
        for (const timeframe of timeframes) {
          const response = await fetch(
            `${apiUrl}/api/quant/indicators/${symbol}?timeframe=${timeframe}`
          );
          
          if (response.ok) {
            const data = await response.json();
            setIndicators((prev) => ({
              ...prev,
              [symbol]: {
                ...prev[symbol],
                [timeframe]: data.indicators,
              },
            }));
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching indicators:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${formatPrice(change)}`;
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const renderPriceTicker = (symbol: string) => {
    const priceData = prices[symbol];
    const isPositive = priceData?.change >= 0;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4" 
           style={{ borderLeftColor: isPositive ? '#10b981' : '#ef4444' }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{symbol}</h2>
            <p className="text-sm text-gray-500">
              {priceData?.timestamp 
                ? new Date(priceData.timestamp).toLocaleTimeString('en-IN')
                : '--:--:--'}
            </p>
          </div>
          {priceData && (
            isPositive ? (
              <TrendingUp className="w-8 h-8 text-green-500" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-500" />
            )
          )}
        </div>
        
        {priceData ? (
          <>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ₹{formatPrice(priceData.price)}
            </div>
            <div className="flex gap-4 text-sm">
              <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {formatChange(priceData.change)}
              </span>
              <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {formatPercent(priceData.changePercent)}
              </span>
            </div>
          </>
        ) : (
          <div className="text-2xl text-gray-400">Loading...</div>
        )}
      </div>
    );
  };

  const renderIndicators = (symbol: string) => {
    const symbolIndicators = indicators[symbol];
    
    if (!symbolIndicators) {
      return (
        <div className="bg-white rounded-lg shadow p-4 col-span-2">
          <p className="text-gray-400">Loading indicators...</p>
        </div>
      );
    }

    return (
      <>
        {['5m', '15m'].map((timeframe) => {
          const ind = symbolIndicators[timeframe];
          
          if (!ind) {
            return (
              <div key={timeframe} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-700 mb-2">{timeframe} Indicators</h3>
                <p className="text-gray-400 text-sm">Loading...</p>
              </div>
            );
          }

          return (
            <div key={timeframe} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
                <span>{timeframe} Timeframe</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  ind.ema.alignment === 'bullish' ? 'bg-green-100 text-green-700' :
                  ind.ema.alignment === 'bearish' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {ind.ema.alignment}
                </span>
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-600">EMA 9:</span>
                  <span className="font-medium">₹{formatPrice(ind.ema.ema9)}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-600">EMA 20:</span>
                  <span className="font-medium">₹{formatPrice(ind.ema.ema20)}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-600">EMA 50:</span>
                  <span className="font-medium">₹{formatPrice(ind.ema.ema50)}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-600">VWAP:</span>
                  <span className="font-medium">₹{formatPrice(ind.vwap.value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slope:</span>
                  <span className={`font-medium capitalize ${
                    ind.ema.slope === 'bullish' ? 'text-green-600' :
                    ind.ema.slope === 'bearish' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {ind.ema.slope}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ODX Live Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time market data and indicators
              </p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Disconnected</span>
                  </>
                )}
              </div>
              
              {/* Market Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                marketStatus.isOpen ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 py-8">
        {/* NIFTY Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>NIFTY</span>
            <span className="text-sm font-normal text-gray-500">
              Complete Analysis Dashboard
            </span>
          </h2>
          
          {/* Price Ticker */}
          <div className="mb-6">
            {renderPriceTicker('NIFTY')}
          </div>

          {/* Phase 2: Setup Scoring */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SetupScoreCard symbol="NIFTY" timeframe="5m" />
            <SetupScoreCard symbol="NIFTY" timeframe="15m" />
          </div>

          {/* Phase 3: Option Chain Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <OptionChainPanel symbol="NIFTY" />
            </div>
            <div>
              <OIAnalysisPanel symbol="NIFTY" />
            </div>
          </div>

          {/* Phase 3: Strike Recommendations */}
          <div className="mb-6">
            <StrikeRecommendationCard symbol="NIFTY" />
          </div>

          {/* Phase 1: Legacy Indicators (keep for reference) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Phase 1 Indicators (5m)</h3>
              {indicators.NIFTY?.['5m'] ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <div>EMA9: ₹{formatPrice(indicators.NIFTY['5m'].ema.ema9)}</div>
                  <div>VWAP: ₹{formatPrice(indicators.NIFTY['5m'].vwap.value)}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {indicators.NIFTY['5m'].ema.alignment} • {indicators.NIFTY['5m'].ema.slope}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Loading...</div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Phase 1 Indicators (15m)</h3>
              {indicators.NIFTY?.['15m'] ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <div>EMA9: ₹{formatPrice(indicators.NIFTY['15m'].ema.ema9)}</div>
                  <div>VWAP: ₹{formatPrice(indicators.NIFTY['15m'].vwap.value)}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {indicators.NIFTY['15m'].ema.alignment} • {indicators.NIFTY['15m'].ema.slope}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Loading...</div>
              )}
            </div>
          </div>
        </section>

        <hr className="my-12 border-gray-300" />

        {/* BANKNIFTY Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>BANKNIFTY</span>
            <span className="text-sm font-normal text-gray-500">
              Complete Analysis Dashboard
            </span>
          </h2>
          
          {/* Price Ticker */}
          <div className="mb-6">
            {renderPriceTicker('BANKNIFTY')}
          </div>

          {/* Phase 2: Setup Scoring */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SetupScoreCard symbol="BANKNIFTY" timeframe="5m" />
            <SetupScoreCard symbol="BANKNIFTY" timeframe="15m" />
          </div>

          {/* Phase 3: Option Chain Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <OptionChainPanel symbol="BANKNIFTY" />
            </div>
            <div>
              <OIAnalysisPanel symbol="BANKNIFTY" />
            </div>
          </div>

          {/* Phase 3: Strike Recommendations */}
          <div className="mb-6">
            <StrikeRecommendationCard symbol="BANKNIFTY" />
          </div>

          {/* Phase 1: Legacy Indicators (keep for reference) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Phase 1 Indicators (5m)</h3>
              {indicators.BANKNIFTY?.['5m'] ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <div>EMA9: ₹{formatPrice(indicators.BANKNIFTY['5m'].ema.ema9)}</div>
                  <div>VWAP: ₹{formatPrice(indicators.BANKNIFTY['5m'].vwap.value)}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {indicators.BANKNIFTY['5m'].ema.alignment} • {indicators.BANKNIFTY['5m'].ema.slope}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Loading...</div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Phase 1 Indicators (15m)</h3>
              {indicators.BANKNIFTY?.['15m'] ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <div>EMA9: ₹{formatPrice(indicators.BANKNIFTY['15m'].ema.ema9)}</div>
                  <div>VWAP: ₹{formatPrice(indicators.BANKNIFTY['15m'].vwap.value)}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {indicators.BANKNIFTY['15m'].ema.alignment} • {indicators.BANKNIFTY['15m'].ema.slope}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-400">Loading...</div>
              )}
            </div>
          </div>
        </section>

        {/* Info Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 bg-white rounded-lg shadow p-6">
          <p className="font-semibold text-gray-700 mb-2">✅ Implementation Status</p>
          <div className="flex justify-center gap-8 mt-4">
            <div>
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Phase 0: Infrastructure</span>
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Phase 1: Market Data + Indicators</span>
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Phase 2: Scoring Engine</span>
            </div>
            <div>
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Phase 3: Option Chain Intelligence</span>
            </div>
          </div>
          <p className="mt-4 text-xs">
            Data updates every 3 minutes • Live prices via Socket.io • 
            Scoring: Trend, VWAP, Structure, Momentum, Internals, OI Confirmation
          </p>
        </div>
      </main>
    </div>
  );
}
