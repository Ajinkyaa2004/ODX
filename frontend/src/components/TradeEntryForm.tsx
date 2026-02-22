"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface MarketConditions {
  symbol: string;
  spotPrice: number;
  setupScore: number;
  noTradeScore: number;
  trend: string;
  vwapStatus: string;
  volatilityRegime: string;
  timeCategory: string;
  oiConfirmation: string;
  riskMode: string;
}

interface TradeEntryFormProps {
  marketConditions?: MarketConditions;
  onSuccess?: () => void;
}

export default function TradeEntryForm({ marketConditions, onSuccess }: TradeEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    symbol: marketConditions?.symbol || "NIFTY",
    optionType: "CALL",
    strike: "",
    entryPrice: "",
    quantity: "",
    entryNotes: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const requestData = {
        symbol: formData.symbol,
        optionType: formData.optionType,
        strike: parseInt(formData.strike),
        entryPrice: parseFloat(formData.entryPrice),
        quantity: parseInt(formData.quantity),
        spotPrice: marketConditions?.spotPrice,
        setupScore: marketConditions?.setupScore,
        noTradeScore: marketConditions?.noTradeScore,
        trend: marketConditions?.trend,
        vwapStatus: marketConditions?.vwapStatus,
        volatilityRegime: marketConditions?.volatilityRegime,
        timeCategory: marketConditions?.timeCategory,
        oiConfirmation: marketConditions?.oiConfirmation,
        riskMode: marketConditions?.riskMode,
        entryNotes: formData.entryNotes,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
      };

      const response = await fetch("http://localhost:8080/api/journal/entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to log trade entry");
      }

      const result = await response.json();
      setMessage({ type: "success", text: `Trade logged successfully! ID: ${result.tradeId}` });
      
      // Reset form
      setFormData({
        symbol: marketConditions?.symbol || "NIFTY",
        optionType: "CALL",
        strike: "",
        entryPrice: "",
        quantity: "",
        entryNotes: "",
        tags: "",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error logging trade entry:", error);
      setMessage({ type: "error", text: "Failed to log trade entry" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Trade Entry</CardTitle>
        <CardDescription>Record a new trade entry with current market conditions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Select value={formData.symbol} onValueChange={(value: string) => setFormData({ ...formData, symbol: value })}>
                <option value="NIFTY">NIFTY</option>
                <option value="BANKNIFTY">BANKNIFTY</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="optionType">Option Type</Label>
              <Select value={formData.optionType} onValueChange={(value: string) => setFormData({ ...formData, optionType: value })}>
                <option value="CALL">CALL</option>
                <option value="PUT">PUT</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strike">Strike Price</Label>
              <Input
                id="strike"
                type="number"
                placeholder="22450"
                value={formData.strike}
                onChange={(e) => setFormData({ ...formData, strike: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price</Label>
              <Input
                id="entryPrice"
                type="number"
                step="0.01"
                placeholder="125.50"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="150"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Market Conditions Display */}
          {marketConditions && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Current Market Conditions</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Setup Score:</span>{" "}
                  <span className="font-semibold">{marketConditions.setupScore?.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trend:</span>{" "}
                  <span className="font-semibold">{marketConditions.trend}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Volatility:</span>{" "}
                  <span className="font-semibold">{marketConditions.volatilityRegime}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="entryNotes">Entry Notes</Label>
            <Textarea
              id="entryNotes"
              placeholder="Strong OI buildup at support..."
              rows={3}
              value={formData.entryNotes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, entryNotes: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="OI_PATTERN, TREND_FOLLOWING"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging Trade..." : "Log Trade Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
