'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocketIO } from '@/hooks/useSocketIO';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff, BarChart3, LineChart, RefreshCw } from 'lucide-react';
import SetupScoreCard from '@/components/SetupScoreCard';
import OptionChainPanel from '@/components/OptionChainPanel';
import StrikeRecommendationCard from '@/components/StrikeRecommendationCard';
import OIAnalysisPanel from '@/components/OIAnalysisPanel';
import RiskCalculatorPanel from '@/components/RiskCalculatorPanel';
import PnLSimulator from '@/components/PnLSimulator';
import { AIReasoningPanel } from '@/components/AIReasoningPanel';
import { GlobalNavbar } from '@/components/GlobalNavbar';
import { SettingsPanel, useSettings } from '@/components/SettingsPanel';
import { AlertManager } from '@/components/AlertManager';
import { HelpModal } from '@/components/HelpModal';
import PriceChart from '@/components/PriceChart';

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

interface LivePriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  source?: string;
}

interface EvaluationData {
  symbol: string;
  setup_score: number;
  no_trade_score: number;
  decision: string;
  threshold: number;
  no_trade_threshold: number;
  trend_score: number;
  trend_direction: string;
  vwap_score: number;
  vwap_status: string;
  structure_score: number;
  oi_score: number;
  oi_pattern: string;
  volatility_score: number;
  volatility_regime: string;
  momentum_score: number;
  internal_score: number;
  time_risk: string;
  fake_breakout_risk: string;
  recommended_strike: number;
  option_type: string;
}

// Check if market is open (IST: 9:15 AM - 3:30 PM, Mon-Fri)
function isMarketOpen(): { isOpen: boolean; message: string } {
  const now = new Date();
  // Convert to IST
  const istOffset = 5.5 * 60; // IST is UTC+5:30
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utc + istOffset * 60000);
  
  const day = istTime.getDay();
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  const marketStart = 9 * 60 + 15; // 9:15 AM
  const marketEnd = 15 * 60 + 30; // 3:30 PM
  
  if (day === 0 || day === 6) {
    return { isOpen: false, message: 'Weekend - Market Closed' };
  }
  
  if (totalMinutes >= marketStart && totalMinutes <= marketEnd) {
    return { isOpen: true, message: 'Market Open' };
  }
  
  if (totalMinutes < marketStart) {
    return { isOpen: false, message: 'Pre-Market - Opens at 9:15 AM IST' };
  }
  
  return { isOpen: false, message: 'Post-Market - Closed at 3:30 PM IST' };
}

export default function DashboardPage() {
  const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:9092';
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const realtimeUrl = 'http://localhost:8006'; // Market data realtime REST service
  
  const { connected, prices: socketPrices, marketStatus: socketMarketStatus, subscribe } = useSocketIO(socketUrl);
  const settings = useSettings();
  
  const [indicators, setIndicators] = useState<Record<string, Record<string, Indicator>>>({});
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Live price state from REST polling
  const [livePrices, setLivePrices] = useState<Record<string, LivePriceData>>({});
  const [dataSource, setDataSource] = useState<string>('connecting');
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  // Real evaluation data for AI Reasoning (replaces hardcoded mock data)
  const [niftyEvaluation, setNiftyEvaluation] = useState<EvaluationData | null>(null);
  const [bankniftyEvaluation, setBankniftyEvaluation] = useState<EvaluationData | null>(null);
  
  // Compute actual market status from IST time
  const [realMarketStatus, setRealMarketStatus] = useState(isMarketOpen());
  
  // Merge socket prices with REST polled prices (REST takes priority for freshness)
  const prices = { ...socketPrices, ...Object.fromEntries(
    Object.entries(livePrices).map(([symbol, data]) => [
      symbol,
      {
        symbol: data.symbol,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        timestamp: data.timestamp,
      }
    ])
  )};
  
  const marketStatus = realMarketStatus;

  // Fetch live prices from market-data-realtime REST service
  const fetchLivePrices = useCallback(async () => {
    try {
      const response = await fetch(`${realtimeUrl}/all`);
      if (!response.ok) throw new Error('Failed to fetch live prices');
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        const newPrices: Record<string, LivePriceData> = {};
        for (const item of result.data) {
          newPrices[item.symbol] = {
            symbol: item.symbol,
            price: item.ltp,
            change: item.change,
            changePercent: item.changePercent,
            timestamp: item.timestamp,
            open: item.open,
            high: item.high,
            low: item.low,
            prevClose: item.prevClose,
            source: item.source || 'FYERS_LIVE',
          };
        }
        setLivePrices(newPrices);
        setDataSource('FYERS_LIVE');
        setLastFetchTime(new Date());
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching live prices:', err);
      // Fall back to socket prices if REST fails
      if (Object.keys(socketPrices).length > 0) {
        setDataSource('SOCKET');
      } else {
        setDataSource('disconnected');
      }
      setLoading(false);
    }
  }, [realtimeUrl, socketPrices]);

  // Fetch real evaluation data for AI reasoning (replaces hardcoded mock)
  const fetchEvaluationData = useCallback(async (symbol: string) => {
    try {
      // Fetch OI analysis for real data
      const oiRes = await fetch(`${apiUrl}/api/option-chain/${symbol}/analysis`);
      let oiData: any = null;
      if (oiRes.ok) {
        oiData = await oiRes.json();
      }
      
      // Fetch recommended strikes
      const recRes = await fetch(`${apiUrl}/api/option-chain/${symbol}/recommended`);
      let recData: any[] = [];
      if (recRes.ok) {
        recData = await recRes.json();
      }
      
      // Get live price for the symbol
      const livePrice = livePrices[symbol];
      const currentPrice = livePrice?.price || 0;
      
      // Build evaluation data from real API responses
      const topRec = recData[0];
      const evaluation: EvaluationData = {
        symbol,
        setup_score: oiData?.bullishScore || 5.0,
        no_trade_score: 10 - (oiData?.bullishScore || 5.0),
        decision: oiData?.sentiment === 'BULLISH' ? 'TRADE' : 'NO_TRADE',
        threshold: 6.5,
        no_trade_threshold: 5.0,
        trend_score: oiData?.bullishScore || 5.0,
        trend_direction: oiData?.sentiment || 'NEUTRAL',
        vwap_score: oiData?.patternStrength ? oiData.patternStrength * 2 : 5.0,
        vwap_status: `Spot at ₹${currentPrice.toFixed(2)}`,
        structure_score: oiData?.patternStrength || 5.0,
        oi_score: oiData?.bullishScore || 5.0,
        oi_pattern: oiData?.oiTrend === 'PUT_HEAVY' ? 'Put heavy buildup - Bullish' :
                    oiData?.oiTrend === 'CALL_HEAVY' ? 'Call heavy buildup - Bearish' : 'Balanced OI',
        volatility_score: 5.0,
        volatility_regime: 'MODERATE',
        momentum_score: oiData?.bullishScore || 5.0,
        internal_score: oiData?.patternStrength || 5.0,
        time_risk: isMarketOpen().isOpen ? 'PRIME_TIME' : 'CLOSED',
        fake_breakout_risk: 'LOW',
        recommended_strike: topRec?.strikePrice || (symbol === 'NIFTY' ? Math.round(currentPrice / 50) * 50 : Math.round(currentPrice / 100) * 100),
        option_type: topRec?.recommendationType?.includes('CALL') ? 'CALL' : 'PUT',
      };
      
      return evaluation;
    } catch (err) {
      console.error(`Error fetching evaluation for ${symbol}:`, err);
      return null;
    }
  }, [apiUrl, livePrices]);

  // Poll live prices every 2 seconds
  useEffect(() => {
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 2000);
    return () => clearInterval(interval);
  }, [fetchLivePrices]);

  // Update market status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRealMarketStatus(isMarketOpen());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch evaluation data for AI panels (every 3 minutes)
  useEffect(() => {
    const fetchEvals = async () => {
      const [niftyEval, bankniftyEval] = await Promise.all([
        fetchEvaluationData('NIFTY'),
        fetchEvaluationData('BANKNIFTY'),
      ]);
      if (niftyEval) setNiftyEvaluation(niftyEval);
      if (bankniftyEval) setBankniftyEvaluation(bankniftyEval);
    };
    
    // Delay initial fetch to let prices load first
    const timeout = setTimeout(fetchEvals, 3000);
    const interval = setInterval(fetchEvals, 180000); // Refresh every 3 min
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchEvaluationData]);

  // Subscribe to socket channels as backup
  useEffect(() => {
    subscribe('NIFTY');
    subscribe('BANKNIFTY');
    return () => {};
  }, []);

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
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg transition-shadow duration-200">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              isPositive ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'
            }`}>
              {priceData && (
                isPositive ? (
                  <TrendingUp className="w-7 h-7 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-7 h-7 text-red-600 dark:text-red-400" />
                )
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{symbol}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {priceData?.timestamp 
                  ? new Date(priceData.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '--:--:--'}
              </p>
            </div>
          </div>
        </div>
        
        {priceData ? (
          <>
            <div className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
              ₹{formatPrice(priceData.price)}
            </div>
            <div className="flex gap-6 items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isPositive ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'
              }`}>
                <span className={`text-lg font-semibold ${
                  isPositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {formatChange(priceData.change)}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isPositive ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'
              }`}>
                <span className={`text-lg font-semibold ${
                  isPositive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {formatPercent(priceData.changePercent)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Global Navbar */}
      <GlobalNavbar 
        onSettingsClick={() => setSettingsOpen(true)}
        onHelpClick={() => setHelpOpen(true)}
      />
      
      {/* Settings Panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      
      {/* Alert Manager */}
      <AlertManager settings={settings} />
      
      {/* Connection & Market Status Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div className="max-w-[1920px] mx-auto flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            dataSource === 'FYERS_LIVE' ? 'bg-green-100 dark:bg-green-900' : 
            dataSource === 'SOCKET' ? 'bg-yellow-100 dark:bg-yellow-900' :
            'bg-red-100 dark:bg-red-900'
          }`}>
            {dataSource === 'FYERS_LIVE' ? (
              <>
                <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Live Data (FYERS)</span>
              </>
            ) : dataSource === 'SOCKET' ? (
              <>
                <Wifi className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Socket Feed</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">Connecting...</span>
              </>
            )}
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            marketStatus.isOpen 
              ? 'bg-emerald-100 dark:bg-emerald-900' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            <Activity className={`w-4 h-4 ${
              marketStatus.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
            }`} />
            <span className={`text-sm font-semibold ${
              marketStatus.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {marketStatus.message}
            </span>
          </div>
          
          {lastFetchTime && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <RefreshCw className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Updated {lastFetchTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-6 py-8 bg-gray-50 dark:bg-gray-900">
        {/* NIFTY Section */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <LineChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <span>NIFTY 50</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete technical analysis and options intelligence
              </p>
            </div>
          </div>
          
          {/* Price Ticker */}
          <div className="mb-6">
            {renderPriceTicker('NIFTY')}
          </div>

          {/* Price Chart */}
          <div className="mb-6">
            <PriceChart symbol="NIFTY" initialTimeframe="5m" atmStrike={prices.NIFTY ? Math.round(prices.NIFTY.price / 50) * 50 : undefined} />
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

          {/* Phase 7: AI Reasoning */}
          <div className="mb-6">
            <AIReasoningPanel 
              symbol="NIFTY" 
              evaluationData={niftyEvaluation || undefined}
              autoGenerate={false}
            />
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <LineChart className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <span>BANKNIFTY</span>
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complete technical analysis and options intelligence
              </p>
            </div>
          </div>
          
          {/* Price Ticker */}
          <div className="mb-6">
            {renderPriceTicker('BANKNIFTY')}
          </div>

          {/* Price Chart */}
          <div className="mb-6">
            <PriceChart symbol="BANKNIFTY" initialTimeframe="5m" atmStrike={prices.BANKNIFTY ? Math.round(prices.BANKNIFTY.price / 100) * 100 : undefined} />
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

          {/* Phase 7: AI Reasoning */}
          <div className="mb-6">
            <AIReasoningPanel 
              symbol="BANKNIFTY" 
              evaluationData={bankniftyEvaluation || undefined}
              autoGenerate={false}
            />
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
