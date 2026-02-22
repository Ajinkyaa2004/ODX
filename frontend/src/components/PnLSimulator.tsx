'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PnLSimulatorProps {
  symbol?: string;
  currentPrice?: number;
}

interface PnLResponse {
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  symbol: string;
  grossPnL: number;
  charges: {
    brokerage: number;
    stt: number;
    exchangeCharges: number;
    sebiCharges: number;
    gst: number;
    stampDuty: number;
    totalCharges: number;
  };
  netPnL: number;
  roi: number;
  breakEvenPrice: number;
  status: 'PROFIT' | 'LOSS' | 'BREAKEVEN';
}

export default function PnLSimulator({ symbol = 'NIFTY', currentPrice = 0 }: PnLSimulatorProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  
  const [entryPrice, setEntryPrice] = useState<number>(125.50);
  const [exitPrice, setExitPrice] = useState<number>(currentPrice || 135.00);
  const [quantity, setQuantity] = useState<number>(150);
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [broker, setBroker] = useState<'ANGEL_ONE' | 'FYERS'>('ANGEL_ONE');
  const [result, setResult] = useState<PnLResponse | null>(null);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (entryPrice > 0 && exitPrice > 0 && quantity > 0) {
      calculatePnL();
    }
  }, [entryPrice, exitPrice, quantity, optionType, broker]);

  const calculatePnL = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/risk/calculate-pnl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryPrice,
          currentPrice: exitPrice,
          quantity,
          symbol,
          optionType,
          broker,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Error calculating PnL:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROFIT':
        return 'text-green-600';
      case 'LOSS':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'PROFIT':
        return 'bg-green-50 border-green-200';
      case 'LOSS':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Activity className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live PnL Simulator</h2>
          <p className="text-sm text-gray-500">Real-time profit & loss calculator</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Entry Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Price (₹)
          </label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.5"
          />
        </div>

        {/* Exit/Current Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exit Price (₹)
          </label>
          <input
            type="number"
            value={exitPrice}
            onChange={(e) => setExitPrice(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.5"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="1"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="CALL">CALL (CE)</option>
            <option value="PUT">PUT (PE)</option>
          </select>
        </div>

        {/* Broker */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Broker
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="ANGEL_ONE"
                checked={broker === 'ANGEL_ONE'}
                onChange={(e) => setBroker(e.target.value as 'ANGEL_ONE' | 'FYERS')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Angel One</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="FYERS"
                checked={broker === 'FYERS'}
                onChange={(e) => setBroker(e.target.value as 'ANGEL_ONE' | 'FYERS')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">FYERS</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Main PnL Display */}
          <div className={`rounded-lg p-6 border-2 ${getStatusBg(result.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {result.status === 'PROFIT' ? (
                  <TrendingUp className="w-8 h-8 text-green-600" />
                ) : result.status === 'LOSS' ? (
                  <TrendingDown className="w-8 h-8 text-red-600" />
                ) : (
                  <Activity className="w-8 h-8 text-gray-600" />
                )}
                <div>
                  <p className="text-sm text-gray-600">Net PnL</p>
                  <p className={`text-4xl font-bold ${getStatusColor(result.status)}`}>
                    {formatCurrency(result.netPnL)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-2xl font-bold ${getStatusColor(result.status)}`}>
                  {result.status}
                </p>
              </div>
            </div>

            {/* PnL Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-300">
              <div>
                <p className="text-xs text-gray-600 mb-1">Gross PnL</p>
                <p className={`text-lg font-bold ${result.grossPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(result.grossPnL)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Charges</p>
                <p className="text-lg font-bold text-red-600">
                  -{formatCurrency(result.charges.totalCharges)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Break-even</p>
                <p className="text-lg font-bold text-orange-600">
                  ₹{result.breakEvenPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">ROI</p>
                <p className={`text-lg font-bold ${result.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.roi >= 0 ? '+' : ''}{result.roi.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Charges Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Charges Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Brokerage:</span>
                <span className="font-medium">₹{result.charges.brokerage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">STT:</span>
                <span className="font-medium">₹{result.charges.stt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exchange:</span>
                <span className="font-medium">₹{result.charges.exchangeCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SEBI:</span>
                <span className="font-medium">₹{result.charges.sebiCharges.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST:</span>
                <span className="font-medium">₹{result.charges.gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stamp:</span>
                <span className="font-medium">₹{result.charges.stampDuty.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Price Movement Indicator */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entry → Exit</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{result.entryPrice.toFixed(2)} → ₹{result.currentPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Movement</p>
                <p className={`text-lg font-bold ${
                  result.currentPrice > result.entryPrice ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.currentPrice > result.entryPrice ? '+' : ''}
                  ₹{(result.currentPrice - result.entryPrice).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
