"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradeEntryForm from "@/components/TradeEntryForm";
import TradeJournalTable from "@/components/TradeJournalTable";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState("journal");
  const [marketConditions, setMarketConditions] = useState<any>(null);

  // Fetch real market conditions from live services
  useEffect(() => {
    const fetchMarketConditions = async () => {
      try {
        // Fetch live NIFTY price
        const priceRes = await fetch('http://localhost:8006/live/NIFTY');
        let spotPrice = 0;
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          spotPrice = priceData?.data?.ltp || 0;
        }

        // Fetch OI analysis for market sentiment
        const oiRes = await fetch('http://localhost:8080/api/option-chain/NIFTY/analysis');
        let oiData: any = null;
        if (oiRes.ok) {
          oiData = await oiRes.json();
        }

        setMarketConditions({
          symbol: "NIFTY",
          spotPrice: spotPrice,
          setupScore: oiData?.bullishScore || 5.0,
          noTradeScore: oiData?.bearishScore || 5.0,
          trend: oiData?.sentiment || "NEUTRAL",
          vwapStatus: spotPrice > 0 ? "LIVE" : "UNKNOWN",
          volatilityRegime: "NORMAL",
          timeCategory: "PRIME_TIME",
          oiConfirmation: oiData?.oiTrend === 'PUT_HEAVY' ? 'STRONG' : 'MODERATE',
          riskMode: "BALANCED",
        });
      } catch (error) {
        console.error("Failed to fetch market conditions:", error);
        setMarketConditions({
          symbol: "NIFTY",
          spotPrice: 0,
          setupScore: 0,
          noTradeScore: 0,
          trend: "UNKNOWN",
          vwapStatus: "UNKNOWN",
          volatilityRegime: "UNKNOWN",
          timeCategory: "UNKNOWN",
          oiConfirmation: "UNKNOWN",
          riskMode: "BALANCED",
        });
      }
    };

    fetchMarketConditions();
    const interval = setInterval(fetchMarketConditions, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trade Journal & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your trades, analyze performance, and improve your trading edge
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="entry">Entry</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-6">
          {marketConditions ? (
            <TradeEntryForm
              marketConditions={marketConditions}
              onSuccess={() => setActiveTab("journal")}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">Loading market data...</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="journal" className="mt-6">
          <TradeJournalTable />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
