"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Trade {
  tradeId: string;
  symbol: string;
  optionType: string;
  strike: number;
  entryTimestamp: string;
  exitTimestamp?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  setupScore?: number;
  outcome?: string;
  netPnl?: number;
  roiPercentage?: number;
  riskMode?: string;
}

export default function TradeJournalTable() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSymbol, setFilterSymbol] = useState("ALL");
  const [filterOutcome, setFilterOutcome] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/journal/trades");
      if (!response.ok) {
        throw new Error("Failed to fetch trades");
      }
      const data = await response.json();
      setTrades(data);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/journal/export");
      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trades_export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesSymbol = filterSymbol === "ALL" || trade.symbol === filterSymbol;
    const matchesOutcome = filterOutcome === "ALL" || trade.outcome === filterOutcome;
    const matchesSearch =
      searchTerm === "" ||
      trade.tradeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.strike.toString().includes(searchTerm);

    return matchesSymbol && matchesOutcome && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOutcomeBadge = (outcome?: string) => {
    if (!outcome) return <Badge variant="secondary">OPEN</Badge>;
    return outcome === "WIN" ? (
      <Badge className="bg-green-600">WIN</Badge>
    ) : (
      <Badge className="bg-red-600">LOSS</Badge>
    );
  };

  const getPnLColor = (pnl?: number) => {
    if (!pnl) return "text-muted-foreground";
    return pnl >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Trade Journal</CardTitle>
            <CardDescription>All recorded trades and their outcomes</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchTrades} variant="outline" size="sm">
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search by Trade ID or Strike..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterSymbol} onValueChange={setFilterSymbol}>
            <option value="ALL">All Symbols</option>
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
          </Select>
          <Select value={filterOutcome} onValueChange={setFilterOutcome}>
            <option value="ALL">All Trades</option>
            <option value="WIN">Wins Only</option>
            <option value="LOSS">Losses Only</option>
          </Select>
        </div>

        {/* Table */}
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading trades...</div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No trades found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background border-b">
                <tr className="text-left">
                  <th className="p-2 font-semibold">Trade ID</th>
                  <th className="p-2 font-semibold">Symbol</th>
                  <th className="p-2 font-semibold">Type</th>
                  <th className="p-2 font-semibold">Strike</th>
                  <th className="p-2 font-semibold">Entry</th>
                  <th className="p-2 font-semibold">Exit</th>
                  <th className="p-2 font-semibold">Qty</th>
                  <th className="p-2 font-semibold">Score</th>
                  <th className="p-2 font-semibold">Net P&L</th>
                  <th className="p-2 font-semibold">ROI %</th>
                  <th className="p-2 font-semibold">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr key={trade.tradeId} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono text-xs">{trade.tradeId}</td>
                    <td className="p-2">{trade.symbol}</td>
                    <td className="p-2">
                      <Badge variant={trade.optionType === "CALL" ? "default" : "secondary"}>{trade.optionType}</Badge>
                    </td>
                    <td className="p-2">{trade.strike}</td>
                    <td className="p-2">
                      <div className="text-xs">
                        <div>{formatDate(trade.entryTimestamp)}</div>
                        <div className="text-muted-foreground">₹{trade.entryPrice}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-xs">
                        <div>{formatDate(trade.exitTimestamp || "")}</div>
                        <div className="text-muted-foreground">{trade.exitPrice ? `₹${trade.exitPrice}` : "-"}</div>
                      </div>
                    </td>
                    <td className="p-2">{trade.quantity}</td>
                    <td className="p-2">{trade.setupScore ? trade.setupScore.toFixed(1) : "-"}</td>
                    <td className={`p-2 ${getPnLColor(trade.netPnl)}`}>
                      {trade.netPnl ? `₹${trade.netPnl.toFixed(2)}` : "-"}
                    </td>
                    <td className={`p-2 ${getPnLColor(trade.roiPercentage)}`}>
                      {trade.roiPercentage ? `${trade.roiPercentage.toFixed(2)}%` : "-"}
                    </td>
                    <td className="p-2">{getOutcomeBadge(trade.outcome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {filteredTrades.length} of {trades.length} trades
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
