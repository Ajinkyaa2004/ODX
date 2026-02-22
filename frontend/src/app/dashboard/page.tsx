'use client';

import { useEffect, useState } from 'react';
import { useSocketIO } from '@/hooks/useSocketIO';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff, BarChart3, LineChart } from 'lucide-react';
import SetupScoreCard from '@/components/SetupScoreCard';
import OptionChainPanel from '@/components/OptionChainPanel';
import StrikeRecommendationCard from '@/components/StrikeRecommendationCard';
import OIAnalysisPanel from '@/components/OIAnalysisPanel';
import RiskCalculatorPanel from '@/components/RiskCalculatorPanel';
import PnLSimulator from '@/components/PnLSimulator';

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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              isPositive ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {priceData && (
                isPositive ? (
                  <TrendingUp className="w-7 h-7 text-green-600" />
                ) : (
                  <TrendingDown className="w-7 h-7 text-red-600" />
                )
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{symbol}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {priceData?.timestamp 
                  ? new Date(priceData.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '--:--:--'}
              </p>
            </div>
          </div>
        </div>
        
        {priceData ? (
          <>
            <div className="text-5xl font-bold text-gray-900 mb-3">
              ₹{formatPrice(priceData.price)}
            </div>
            <div className="flex gap-6 items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isPositive ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className={`text-lg font-semibold ${
                  isPositive ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatChange(priceData.change)}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isPositive ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className={`text-lg font-semibold ${
                  isPositive ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatPercent(priceData.changePercent)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-48 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  ODX Live Dashboard
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  Real-time market data and trading intelligence
                </p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-sm ${
                connected ? 'bg-green-500/20 border border-green-400/30' : 'bg-red-500/20 border border-red-400/30'
              }`}>
                {connected ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-100" />
                    <span className="text-sm font-semibold text-green-100">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-100" />
                    <span className="text-sm font-semibold text-red-100">Disconnected</span>
                  </>
                )}
              </div>
              
              {/* Market Status */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-sm ${
                marketStatus.isOpen 
                  ? 'bg-emerald-500/20 border border-emerald-400/30' 
                  : 'bg-gray-500/20 border border-gray-400/30'
              }`}>
                <Activity className={`w-5 h-5 ${
                  marketStatus.isOpen ? 'text-emerald-100' : 'text-gray-300'
                }`} />
                <span className={`text-sm font-semibold ${
                  marketStatus.isOpen ? 'text-emerald-100' : 'text-gray-300'
                }`}>
                  {marketStatus.isOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-8 bg-gray-50">
        {/* NIFTY Section */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <LineChart className="w-8 h-8 text-blue-600" />
                <span>NIFTY 50</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete technical analysis and options intelligence
              </p>
            </div>
          </div>
          
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

          {/* Phase 5: Risk Calculator & PnL Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RiskCalculatorPanel symbol="NIFTY" currentPrice={prices.NIFTY?.price || 0} />
            <PnLSimulator symbol="NIFTY" currentPrice={prices.NIFTY?.price || 0} />
          </div>

          {/* Technical Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">5-Minute Timeframe</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">5M</span>
              </div>
              {indicators.NIFTY?.['5m'] ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">EMA 9</span>
                    <span className="font-semibold text-gray-900">₹{formatPrice(indicators.NIFTY['5m'].ema.ema9)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">VWAP</span>
                    <span className="font-semibold text-gray-900">₹{formatPrice(indicators.NIFTY['5m'].vwap.value)}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      indicators.NIFTY['5m'].ema.alignment === 'bullish' 
                        ? 'bg-green-100 text-green-700' 
                        : indicators.NIFTY['5m'].ema.alignment === 'bearish'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {indicators.NIFTY['5m'].ema.alignment.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      indicators.NIFTY['5m'].ema.slope === 'bullish' 
                        ? 'bg-green-100 text-green-700' 
                        : indicators.NIFTY['5m'].ema.slope === 'bearish'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {indicators.NIFTY['5m'].ema.slope.toUpperCase()} SLOPE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">15-Minute Timeframe</h3>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">15M</span>
              </div>
              {indicators.NIFTY?.['15m'] ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">EMA 9</span>
                    <span className="font-semibold text-gray-900">₹{formatPrice(indicators.NIFTY['15m'].ema.ema9)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">VWAP</span>
                    <span className="font-semibold text-gray-900">₹{formatPrice(indicators.NIFTY['15m'].vwap.value)}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      indicators.NIFTY['15m'].ema.alignment === 'bullish' 
                        ? 'bg-green-100 text-green-700' 
                        : indicators.NIFTY['15m'].ema.alignment === 'bearish'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {indicators.NIFTY['15m'].ema.alignment.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      indicators.NIFTY['15m'].ema.slope === 'bullish' 
                        ? 'bg-green-100 text-green-700' 
                        : indicators.NIFTY['15m'].ema.slope === 'bearish'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {indicators.NIFTY['15m'].ema.slope.toUpperCase()} SLOPE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="my-12 border-t-2 border-gray-200"></div>

        {/* BANKNIFTY Section */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-1 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <LineChart className="w-8 h-8 text-indigo-600" />
                <span>BANKNIFTY</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete technical analysis and options intelligence
              </p>
            </div>
          </div>
          
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

          {/* Phase 5: Risk Calculator & PnL Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RiskCalculatorPanel symbol="BANKNIFTY" currentPrice={prices.BANKNIFTY?.price || 0} />
            <PnLSimulator symbol="BANKNIFTY" currentPrice={prices.BANKNIFTY?.price || 0} />
          </div>

          {/* Technical Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">5-Minute Timeframe</h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">5M</span>
              </div>
              {indicators.BANKNIFTY?.['5m'] ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">EMA 9</span>
                    <span className="font-semibold text-gray-900">₹{formatPrice(indicators.BANKNIFTY['5m'].ema.ema9)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">VWAP</span>
                    <span className="font-semibold text-gray-900">₹{formatPrice(indicators.BANKNIFTY['5m'].vwap.value)}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      indicators.BANKNIFTY['5m'].ema.alignment === 'bullish' 
                        ? 'bg-green-100 text-green-700' 
                        : indicators.BANKNIFTY['5m'].ema.alignment === 'bearish'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {indicators.BANKNIFTY['5m'].ema.alignment.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      indicators.BANKNIFTY['5m'].ema.slope === 'bullish' 
                        ? 'bg-green-100 text-green-700' 
                        : indicators.BANKNIFTY['5m'].ema.slope === 'bearish'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {indicators.BANKNIFTY['5m'].ema.slope.toUpperCase()} SLOPE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">15-Minute Timeframe</h3>
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full">15M</span>
              </div>
              {indicators.BANKNIFTY?.['15m'] ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">EMA 9</span>
                    <span className="font-semibold text-gray-900">₹{formatPrice(indicators.BANKNIFTY['15m'].ema.ema9)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">VWAP</span>
                    <span className="font-semibold text-gray-900">₹{formatPrice(indicators.BANKNIFTY['15m'].vwap.value)}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      indicators.BANKNIFTY['15m'].ema.alignment === 'bullish' 
                        ? 'bg-green-100 text-green-700' 
                        : indicators.BANKNIFTY['15m'].ema.alignment === 'bearish'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {indicators.BANKNIFTY['15m'].ema.alignment.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      indicators.BANKNIFTY['15m'].ema.slope === 'bullish' 
                        ? 'bg-green-100 text-green-700' 
                        : indicators.BANKNIFTY['15m'].ema.slope === 'bearish'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {indicators.BANKNIFTY['15m'].ema.slope.toUpperCase()} SLOPE
                    </span>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Info Footer */}
        <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Platform Features</h3>
            <p className="text-sm text-gray-600">Complete trading intelligence platform</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Live Market Data</p>
              <p className="text-xs text-gray-500 mt-1">Real-time prices</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Technical Analysis</p>
              <p className="text-xs text-gray-500 mt-1">EMA, VWAP, RSI</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Setup Scoring</p>
              <p className="text-xs text-gray-500 mt-1">0-10 rating system</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <LineChart className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">Options Intelligence</p>
              <p className="text-xs text-gray-500 mt-1">OI analysis & strikes</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-blue-200 text-center text-xs text-gray-600">
            <p>Data updates every 3 minutes • Live prices via Socket.io • WebSocket connectivity for real-time streaming</p>
          </div>
        </div>
      </main>
    </div>
  );
}
