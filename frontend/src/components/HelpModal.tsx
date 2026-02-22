"use client";

import React, { useState } from "react";
import { X, HelpCircle, Info, TrendingUp, Target, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState("scoring");

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Help & Documentation
              </h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="scoring">Scoring System</TabsTrigger>
                <TabsTrigger value="indicators">Indicators</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
                <TabsTrigger value="risk">Risk Management</TabsTrigger>
              </TabsList>

              {/* Scoring System Tab */}
              <TabsContent value="scoring">
                <div className="space-y-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-white">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Understanding Setup Scores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Score Ranges</h4>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-green-600 dark:text-green-400 min-w-[60px]">80-100:</span>
                            <span>Excellent setup - Strong bullish/bearish alignment across all indicators</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-[60px]">60-79:</span>
                            <span>Good setup - Majority of indicators aligned, consider entry</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-yellow-600 dark:text-yellow-400 min-w-[60px]">40-59:</span>
                            <span>Neutral - Mixed signals, wait for better confirmation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-red-600 dark:text-red-400 min-w-[60px]">0-39:</span>
                            <span>Unfavorable - Avoid trading, conflicting signals</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Scoring Components</h4>
                        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                          <li><strong>Trend (30%):</strong> EMA alignment and slope strength</li>
                          <li><strong>VWAP (25%):</strong> Price position relative to volume-weighted average</li>
                          <li><strong>Structure (25%):</strong> Support/resistance levels and price action</li>
                          <li><strong>Volume (20%):</strong> Trading volume vs. 20-day average</li>
                        </ul>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                          <strong>Pro Tip:</strong> Look for scores above 70 with directional 
                          consistency across multiple timeframes (5m, 15m, 1hr) for high-probability setups.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Indicators Tab */}
              <TabsContent value="indicators">
                <div className="space-y-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-white">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Technical Indicators Explained
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">EMA (Exponential Moving Average)</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          We use 9, 20, and 50-period EMAs to identify trend direction and strength.
                        </p>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• <strong>Bullish:</strong> Price above all EMAs, 9 &gt; 20 &gt; 50</li>
                          <li>• <strong>Bearish:</strong> Price below all EMAs, 9 &lt; 20 &lt; 50</li>
                          <li>• <strong>Slope:</strong> Indicates momentum strength (rising/falling)</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">VWAP (Volume Weighted Average Price)</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Dynamic support/resistance level weighted by volume.
                        </p>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• Price above VWAP = Bullish bias</li>
                          <li>• Price below VWAP = Bearish bias</li>
                          <li>• Distance from VWAP indicates overextension</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Volume Profile</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Shows price levels with highest trading activity.
                        </p>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• <strong>POC:</strong> Point of Control - highest volume level</li>
                          <li>• <strong>VAH/VAL:</strong> Value Area High/Low (70% of volume)</li>
                          <li>• Use these as key support/resistance zones</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Options Tab */}
              <TabsContent value="options">
                <div className="space-y-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-white">
                        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Options Trading Guide
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Open Interest (OI) Analysis</h4>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• <strong>High Call OI:</strong> Resistance level - sellers positioned</li>
                          <li>• <strong>High Put OI:</strong> Support level - buyers positioned</li>
                          <li>• <strong>Max Pain:</strong> Strike where most options expire worthless</li>
                          <li>• Price tends to gravitate toward max pain near expiry</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">PCR (Put-Call Ratio)</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Sentiment indicator calculated as Put OI / Call OI.
                        </p>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• <strong>PCR &gt; 1.2:</strong> Oversold - Bullish reversal expected</li>
                          <li>• <strong>PCR 0.8-1.2:</strong> Neutral - No clear bias</li>
                          <li>• <strong>PCR &lt; 0.8:</strong> Overbought - Bearish reversal expected</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Strike Selection</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Our AI recommends strikes based on:
                        </p>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• Current price and expected move</li>
                          <li>• OI concentration and PCR at strikes</li>
                          <li>• Risk-reward ratio and probability</li>
                          <li>• Time decay (theta) considerations</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Risk Management Tab */}
              <TabsContent value="risk">
                <div className="space-y-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-white">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Risk Management Rules
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Position Sizing</h4>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• <strong>Conservative:</strong> Risk 2-3% of capital per trade</li>
                          <li>• <strong>Moderate:</strong> Risk 4-5% of capital per trade</li>
                          <li>• <strong>Aggressive:</strong> Risk 6-8% of capital per trade</li>
                          <li>• Never risk more than you can afford to lose</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Stop Loss Guidelines</h4>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• Place stop loss below recent support (calls) or above resistance (puts)</li>
                          <li>• Generally 20-30% of option premium for intraday trades</li>
                          <li>• Never move stop loss in losing direction</li>
                          <li>• Honor your stops - discipline is key</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Profit Targets</h4>
                        <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-4">
                          <li>• Target 2:1 or 3:1 risk-reward ratio minimum</li>
                          <li>• Book 50% profits at first target, trail rest</li>
                          <li>• Exit before 3:15 PM to avoid last-minute volatility</li>
                          <li>• Never hold losing positions overnight</li>
                        </ul>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm text-red-900 dark:text-red-200">
                          <strong>Important:</strong> This system provides decision support, not financial 
                          advice. Always do your own analysis and trade at your own risk. Past performance 
                          does not guarantee future results.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
