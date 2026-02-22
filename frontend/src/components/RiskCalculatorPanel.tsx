'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, Target, AlertCircle } from 'lucide-react';

interface RiskCalculatorProps {
  symbol?: string;
  currentPrice?: number;
}

interface PositionSizingResponse {
  capital: number;
  riskPercentage: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  symbol: string;
  optionType: string;
  strike: number;
  broker: string;
  riskPerUnit: number;
  rewardPerUnit: number;
  lotSize: number;
  maxLots: number;
  positionSize: number;
  positionValue: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  charges: {
    brokerage: number;
    stt: number;
    exchangeCharges: number;
    sebiCharges: number;
    gst: number;
    stampDuty: number;
    totalCharges: number;
  };
  breakEvenPrice: number;
  grossPnLAtTarget: number;
  netPnLAtTarget: number;
  roi: number;
}

export default function RiskCalculatorPanel({ symbol = 'NIFTY', currentPrice = 0 }: RiskCalculatorProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  
  const [capital, setCapital] = useState<number>(100000);
  const [riskPercentage, setRiskPercentage] = useState<number>(2.0);
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice || 125.50);
  const [stopLoss, setStopLoss] = useState<number>(115.00);
  const [target, setTarget] = useState<number>(145.00);
  const [strike, setStrike] = useState<number>(22450);
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [broker, setBroker] = useState<'ANGEL_ONE' | 'FYERS'>('ANGEL_ONE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PositionSizingResponse | null>(null);
  const [error, setError] = useState<string>('');

  const calculatePosition = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${apiUrl}/api/risk/calculate-position`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          capital,
          riskPercentage,
          entryPrice,
          stopLoss,
          target,
          symbol,
          optionType,
          strike,
          broker,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate position');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to calculate position. Please check your inputs.');
      console.error('Error calculating position:', err);
    } finally {
      setLoading(false);
    }
  };

  const setPresetRisk = (risk: number) => {
    setRiskPercentage(risk);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 rounded-lg">
          <Calculator className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Risk Calculator</h2>
          <p className="text-sm text-gray-500">Calculate position sizing & charges</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Capital */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capital (₹)
          </label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            min="0"
            step="1000"
          />
        </div>

        {/* Risk Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Percentage (%)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={riskPercentage}
              onChange={(e) => setRiskPercentage(Number(e.target.value))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="0.1"
              max="5"
              step="0.1"
            />
            <button
              onClick={() => setPresetRisk(1.0)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              1%
            </button>
            <button
              onClick={() => setPresetRisk(2.0)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              2%
            </button>
            <button
              onClick={() => setPresetRisk(3.0)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              3%
            </button>
          </div>
        </div>

        {/* Entry Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Price (₹)
          </label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            min="0"
            step="0.5"
          />
        </div>

        {/* Stop Loss */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stop Loss (₹)
          </label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            min="0"
            step="0.5"
          />
        </div>

        {/* Target */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target (₹)
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            min="0"
            step="0.5"
          />
        </div>

        {/* Strike */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Strike
          </label>
          <input
            type="number"
            value={strike}
            onChange={(e) => setStrike(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            min="0"
            step="50"
          />
        </div>

        {/* Option Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Option Type
          </label>
          <select
            value={optionType}
            onChange={(e) => setOptionType(e.target.value as 'CALL' | 'PUT')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="CALL">CALL (CE)</option>
            <option value="PUT">PUT (PE)</option>
          </select>
        </div>

        {/* Broker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Broker
          </label>
          <select
            value={broker}
            onChange={(e) => setBroker(e.target.value as 'ANGEL_ONE' | 'FYERS')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="ANGEL_ONE">Angel One</option>
            <option value="FYERS">FYERS</option>
          </select>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculatePosition}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Calculating...
          </>
        ) : (
          <>
            <Calculator className="w-5 h-5" />
            Calculate Position
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Position Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Position Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Lot Size</p>
                <p className="text-2xl font-bold text-gray-900">{result.lotSize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Lots</p>
                <p className="text-2xl font-bold text-purple-600">{result.maxLots}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position Size</p>
                <p className="text-2xl font-bold text-gray-900">{result.positionSize}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Position Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(result.positionValue)}</p>
              </div>
            </div>
          </div>

          {/* Risk/Reward */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Risk Amount</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(result.riskAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">₹{result.riskPerUnit.toFixed(2)} per unit</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Reward Amount</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(result.rewardAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">₹{result.rewardPerUnit.toFixed(2)} per unit</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-gray-600">Risk:Reward</p>
              </div>
              <p className="text-xl font-bold text-blue-700">1:{result.riskRewardRatio.toFixed(2)}</p>
            </div>
          </div>

          {/* Charges Breakdown */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Charges Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Brokerage</span>
                <span className="font-medium">{formatCurrency(result.charges.brokerage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">STT</span>
                <span className="font-medium">{formatCurrency(result.charges.stt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange Charges</span>
                <span className="font-medium">{formatCurrency(result.charges.exchangeCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SEBI Charges</span>
                <span className="font-medium">{formatCurrency(result.charges.sebiCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (18%)</span>
                <span className="font-medium">{formatCurrency(result.charges.gst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stamp Duty</span>
                <span className="font-medium">{formatCurrency(result.charges.stampDuty)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                <span className="text-gray-900">Total Charges</span>
                <span className="text-red-600">{formatCurrency(result.charges.totalCharges)}</span>
              </div>
            </div>
          </div>

          {/* PnL Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">PnL at Target</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Break-even Price</p>
                <p className="text-xl font-bold text-orange-600">₹{result.breakEvenPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gross PnL</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(result.grossPnLAtTarget)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net PnL</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(result.netPnLAtTarget)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-gray-600">ROI</p>
                </div>
                <p className="text-xl font-bold text-green-700">{result.roi.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
