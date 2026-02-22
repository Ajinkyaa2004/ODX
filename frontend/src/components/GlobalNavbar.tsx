"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";

interface GlobalIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface GlobalNavbarProps {
  onSettingsClick: () => void;
  onHelpClick: () => void;
}

export function GlobalNavbar({ onSettingsClick, onHelpClick }: GlobalNavbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [indices, setIndices] = useState<GlobalIndex[]>([
    { name: "S&P 500", value: 5850.23, change: 45.12, changePercent: 0.78 },
    { name: "Nasdaq", value: 18432.65, change: -23.45, changePercent: -0.13 },
    { name: "Dow", value: 42156.78, change: 123.45, changePercent: 0.29 },
    { name: "Nikkei", value: 38245.12, change: 89.34, changePercent: 0.23 },
    { name: "Hang Seng", value: 20123.45, change: -156.78, changePercent: -0.77 },
    { name: "India VIX", value: 14.25, change: 0.45, changePercent: 3.26 },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch global indices (TODO: Replace with real API call)
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        // TODO: Call backend API when implemented
        // const response = await fetch('http://localhost:8080/api/market-data/global-indices');
        // const data = await response.json();
        // setIndices(data);
      } catch (error) {
        console.error("Failed to fetch global indices:", error);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      {/* Top Bar - Global Indices */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-1">
        <div className="flex items-center justify-between max-w-full overflow-x-auto">
          <div className="flex items-center gap-4 md:gap-6 flex-nowrap">
            {indices.map((index) => (
              <div
                key={index.name}
                className="flex items-center gap-2 text-xs whitespace-nowrap"
              >
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {index.name}
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                  {index.value.toFixed(2)}
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    index.change >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {index.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(index.changePercent).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">ODX</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Options Decision Engine
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Intraday Trading System
              </p>
            </div>
          </div>

          {/* Right - Time and Settings */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(currentTime)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onHelpClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden md:inline">Help</span>
              </Button>
              <Button
                onClick={onSettingsClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
