"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { X, Settings, Sun, Moon } from "lucide-react";

interface SettingsData {
  capital: number;
  riskMode: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  broker: "ZERODHA" | "ANGEL" | "UPSTOX" | "FYERS";
  refreshInterval: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  soundVolume: number;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsData>({
    capital: 100000,
    riskMode: "MODERATE",
    broker: "ZERODHA",
    refreshInterval: 180,
    soundEnabled: true,
    notificationsEnabled: true,
    soundVolume: 50,
  });

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("odx-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("odx-settings", JSON.stringify(settings));
    onClose();
    // Optional: Show toast notification
    alert("Settings saved successfully!");
  };

  const resetSettings = () => {
    const defaultSettings: SettingsData = {
      capital: 100000,
      riskMode: "MODERATE",
      broker: "ZERODHA",
      refreshInterval: 180,
      soundEnabled: true,
      notificationsEnabled: true,
      soundVolume: 50,
    };
    setSettings(defaultSettings);
    localStorage.setItem("odx-settings", JSON.stringify(defaultSettings));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Settings Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Theme Section */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="dark:text-gray-300">Theme</Label>
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {theme === "light" ? (
                      <>
                        <Moon className="w-4 h-4" />
                        Dark
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4" />
                        Light
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trading Settings */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Trading Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="capital" className="dark:text-gray-300">Capital (₹)</Label>
                  <Input
                    id="capital"
                    type="number"
                    value={settings.capital}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSettings({ ...settings, capital: parseInt(e.target.value) || 0 })
                    }
                    className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskMode" className="dark:text-gray-300">Risk Mode</Label>
                  <Select
                    value={settings.riskMode}
                    onValueChange={(value: string) =>
                      setSettings({ ...settings, riskMode: value as any })
                    }
                  >
                    <option value="CONSERVATIVE">Conservative (2-3%)</option>
                    <option value="MODERATE">Moderate (4-5%)</option>
                    <option value="AGGRESSIVE">Aggressive (6-8%)</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="broker" className="dark:text-gray-300">Broker</Label>
                  <Select
                    value={settings.broker}
                    onValueChange={(value: string) =>
                      setSettings({ ...settings, broker: value as any })
                    }
                  >
                    <option value="ZERODHA">Zerodha</option>
                    <option value="ANGEL">Angel One</option>
                    <option value="UPSTOX">Upstox</option>
                    <option value="FYERS">Fyers</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Data Refresh */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Data Refresh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="refreshInterval" className="dark:text-gray-300">
                    Refresh Interval (seconds)
                  </Label>
                  <Select
                    value={settings.refreshInterval.toString()}
                    onValueChange={(value: string) =>
                      setSettings({ ...settings, refreshInterval: parseInt(value) })
                    }
                  >
                    <option value="60">1 minute</option>
                    <option value="120">2 minutes</option>
                    <option value="180">3 minutes</option>
                    <option value="300">5 minutes</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications & Alerts */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-white">Alerts & Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="dark:text-gray-300">Browser Notifications</Label>
                  <input
                    type="checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, notificationsEnabled: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="dark:text-gray-300">Sound Alerts</Label>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) =>
                      setSettings({ ...settings, soundEnabled: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume" className="dark:text-gray-300">
                    Sound Volume: {settings.soundVolume}%
                  </Label>
                  <input
                    id="volume"
                    type="range"
                    min="0"
                    max="100"
                    value={settings.soundVolume}
                    onChange={(e) =>
                      setSettings({ ...settings, soundVolume: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={saveSettings} className="flex-1">
                Save Settings
              </Button>
              <Button onClick={resetSettings} variant="outline" className="flex-1">
                Reset to Default
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to use settings
export function useSettings() {
  const [settings, setSettings] = useState<SettingsData>({
    capital: 100000,
    riskMode: "MODERATE",
    broker: "ZERODHA",
    refreshInterval: 180,
    soundEnabled: true,
    notificationsEnabled: true,
    soundVolume: 50,
  });

  useEffect(() => {
    const stored = localStorage.getItem("odx-settings");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
  }, []);

  return settings;
}
