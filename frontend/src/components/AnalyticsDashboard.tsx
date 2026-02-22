"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface AnalyticsData {
  overall: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnl: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    expectancy: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  };
  byScoreRange: Array<{
    category: string;
    trades: number;
    winRate: number;
    avgPnl: number;
  }>;
  byTime: Array<{
    category: string;
    trades: number;
    winRate: number;
    avgPnl: number;
  }>;
  byRegime: Array<{
    category: string;
    trades: number;
    winRate: number;
    avgPnl: number;
  }>;
  byRiskMode: Array<{
    category: string;
    trades: number;
    winRate: number;
    avgPnl: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/journal/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">Failed to load analytics</div>
        </CardContent>
      </Card>
    );
  }

  const { overall } = analytics;

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return "bg-green-600";
    if (winRate >= 50) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
          <CardDescription>Key trading metrics and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-3xl font-bold">{overall.totalTrades}</div>
              <div className="text-xs text-muted-foreground">
                {overall.wins}W / {overall.losses}L
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-3xl font-bold">{overall.winRate.toFixed(1)}%</div>
              <Badge className={getWinRateColor(overall.winRate)}>
                {overall.winRate >= 60 ? "Excellent" : overall.winRate >= 50 ? "Good" : "Needs Work"}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total P&L</div>
              <div className={`text-3xl font-bold ${getPnLColor(overall.totalPnl)}`}>
                ₹{overall.totalPnl.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Net profit/loss</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Profit Factor</div>
              <div className="text-3xl font-bold">{overall.profitFactor.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {overall.profitFactor >= 2 ? "Strong ✓" : overall.profitFactor >= 1.5 ? "Good" : "Weak"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Avg Win</div>
              <div className="text-xl font-semibold text-green-600">₹{overall.avgWin.toFixed(2)}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Avg Loss</div>
              <div className="text-xl font-semibold text-red-600">₹{overall.avgLoss.toFixed(2)}</div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Expectancy</div>
              <div className={`text-xl font-semibold ${getPnLColor(overall.expectancy)}`}>
                ₹{overall.expectancy.toFixed(2)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Current Streak</div>
              <div className="text-xl font-semibold">
                {overall.consecutiveWins > 0 && (
                  <span className="text-green-600">{overall.consecutiveWins}W</span>
                )}
                {overall.consecutiveLosses > 0 && (
                  <span className="text-red-600">{overall.consecutiveLosses}L</span>
                )}
                {overall.consecutiveWins === 0 && overall.consecutiveLosses === 0 && "-"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win Rate by Score Range */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate by Setup Score Range</CardTitle>
          <CardDescription>Performance breakdown by setup score quality</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.byScoreRange}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="winRate" fill="#10b981" name="Win Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Win Rate by Time of Day */}
      <Card>
        <CardHeader>
          <CardTitle>Win Rate by Time of Day</CardTitle>
          <CardDescription>Best and worst trading time windows</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.byTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="winRate" fill="#3b82f6" name="Win Rate %">
                {analytics.byTime.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.winRate >= 60 ? "#10b981" : entry.winRate >= 50 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance by Volatility Regime */}
      {analytics.byRegime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Volatility Regime</CardTitle>
            <CardDescription>How you perform in different market conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {analytics.byRegime.map((regime) => (
                <div key={regime.category} className="p-4 rounded-lg border">
                  <div className="text-sm font-semibold">{regime.category}</div>
                  <div className="mt-2 text-2xl font-bold">{regime.winRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">{regime.trades} trades</div>
                  <div className={`text-sm mt-1 ${getPnLColor(regime.avgPnl)}`}>
                    Avg: ₹{regime.avgPnl.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance by Risk Mode */}
      {analytics.byRiskMode.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Risk Mode</CardTitle>
            <CardDescription>Results across different risk settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {analytics.byRiskMode.map((mode) => (
                <div key={mode.category} className="p-4 rounded-lg border">
                  <div className="text-sm font-semibold">{mode.category}</div>
                  <div className="mt-2 text-2xl font-bold">{mode.winRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">{mode.trades} trades</div>
                  <div className={`text-sm mt-1 ${getPnLColor(mode.avgPnl)}`}>
                    Avg: ₹{mode.avgPnl.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
