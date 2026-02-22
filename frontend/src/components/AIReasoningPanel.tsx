"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AIReasoningData {
  trade_reasoning: string;
  key_strengths: string[];
  key_risks: string[];
  invalidation_condition: string;
  confidence_level: "HIGH" | "MEDIUM" | "LOW";
  suggested_action: string;
  generated_at?: string;
  model?: string;
  generation_time_ms?: number;
}

interface AIReasoningPanelProps {
  symbol: string;
  evaluationData?: any;
  autoGenerate?: boolean;
}

export function AIReasoningPanel({ 
  symbol, 
  evaluationData,
  autoGenerate = false 
}: AIReasoningPanelProps) {
  const [reasoning, setReasoning] = useState<AIReasoningData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const generateReasoning = async () => {
    if (!evaluationData) {
      setError("No evaluation data available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8002/api/ai/generate-reasoning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluation_data: evaluationData,
          force_regenerate: false,
        }),
      });

      const data = await response.json();

      if (data.success && data.reasoning) {
        setReasoning(data.reasoning);
      } else {
        setError(data.error || "Failed to generate reasoning");
      }
    } catch (err) {
      console.error("Error generating reasoning:", err);
      setError("Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (autoGenerate && evaluationData && !reasoning) {
      generateReasoning();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, evaluationData]);

  const getConfidenceBadgeColor = (level: string) => {
    switch (level) {
      case "HIGH":
        return "bg-green-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-white";
      case "LOW":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">🤖</div>
          <CardTitle>AI Trade Analysis</CardTitle>
          {reasoning && (
            <Badge className={getConfidenceBadgeColor(reasoning.confidence_level)}>
              {reasoning.confidence_level} CONFIDENCE
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {reasoning && reasoning.generation_time_ms && (
            <span className="text-xs text-gray-500">
              {reasoning.generation_time_ms}ms
            </span>
          )}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              generateReasoning();
            }}
            disabled={isLoading || !evaluationData}
          >
            {isLoading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Generating AI analysis...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Reasoning Display */}
          {reasoning && !isLoading && (
            <div className="space-y-4">
              {/* Main Reasoning */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Trade Reasoning
                </h3>
                <p className="text-sm text-blue-800">{reasoning.trade_reasoning}</p>
              </div>

              {/* Key Strengths */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 mb-2">
                  ✓ Key Strengths
                </h3>
                <ul className="space-y-1">
                  {reasoning.key_strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Risks */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-2">
                  ⚠ Key Risks
                </h3>
                <ul className="space-y-1">
                  {reasoning.key_risks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Invalidation Condition */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-orange-900 mb-2">
                  🚫 Invalidation Condition
                </h3>
                <p className="text-sm text-orange-800 font-medium">
                  {reasoning.invalidation_condition}
                </p>
              </div>

              {/* Suggested Action */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-900 mb-2">
                  💡 Suggested Action
                </h3>
                <p className="text-sm text-purple-800">{reasoning.suggested_action}</p>
              </div>

              {/* Model Info */}
              {reasoning.model && (
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>Model: {reasoning.model}</span>
                  {reasoning.generated_at && (
                    <span>
                      Generated: {new Date(reasoning.generated_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!reasoning && !isLoading && !error && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">
                Click &quot;Generate&quot; to get AI-powered analysis of this setup
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
