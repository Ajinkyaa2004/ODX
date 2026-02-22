"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradeEntryForm from "@/components/TradeEntryForm";
import TradeJournalTable from "@/components/TradeJournalTable";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState("journal");

  // Example market conditions - in real app, this would come from your market data service
  const mockMarketConditions = {
    symbol: "NIFTY",
    spotPrice: 22450.50,
    setupScore: 7.8,
    noTradeScore: 3.2,
    trend: "BULLISH",
    vwapStatus: "ABOVE",
    volatilityRegime: "NORMAL",
    timeCategory: "PRIME_TIME",
    oiConfirmation: "STRONG",
    riskMode: "BALANCED",
  };

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
          <TradeEntryForm 
            marketConditions={mockMarketConditions}
            onSuccess={() => setActiveTab("journal")}
          />
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
