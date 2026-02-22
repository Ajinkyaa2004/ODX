"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Bell, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Alert {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
  sound?: boolean;
}

interface AlertManagerProps {
  settings: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    soundVolume: number;
  };
}

export function AlertManager({ settings }: AlertManagerProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Check notification permission
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const playSound = useCallback((type: Alert["type"]) => {
    if (!settings.soundEnabled) return;

    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies for different alert types
    const frequencies = {
      success: 800,
      warning: 600,
      error: 400,
      info: 700,
    };

    oscillator.frequency.value = frequencies[type];
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(settings.soundVolume / 100, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [settings.soundEnabled, settings.soundVolume]);

  const showNotification = useCallback((alert: Alert) => {
    if (!settings.notificationsEnabled || permission !== "granted") return;

    const notification = new Notification(alert.title, {
      body: alert.message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }, [settings.notificationsEnabled, permission]);

  const addAlert = useCallback((alert: Omit<Alert, "id" | "timestamp">) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setAlerts((prev) => [newAlert, ...prev].slice(0, 5)); // Keep only last 5 alerts

    if (alert.sound !== false) {
      playSound(newAlert.type);
    }

    showNotification(newAlert);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      removeAlert(newAlert.id);
    }, 10000);

    return newAlert.id;
  }, [playSound, showNotification]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  // Expose addAlert function globally (could be improved with Context API)
  useEffect(() => {
    (window as any).showAlert = addAlert;
    return () => {
      delete (window as any).showAlert;
    };
  }, [addAlert]);

  const getAlertColors = (type: Alert["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-900 dark:text-green-100";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100";
      case "error":
        return "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-900 dark:text-red-100";
      case "info":
        return "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100";
    }
  };

  return (
    <>
      {/* Notification Permission Request */}
      {permission === "default" && settings.notificationsEnabled && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Enable Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Get alerts about important trading signals and market events
                </p>
                <Button onClick={requestNotificationPermission} size="sm">
                  Enable
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Toast Container */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border shadow-lg p-4 animate-slide-in ${getAlertColors(
              alert.type
            )}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{alert.title}</h4>
                  {alert.sound !== false && settings.soundEnabled && (
                    <Volume2 className="w-4 h-4" />
                  )}
                </div>
                <p className="text-sm opacity-90">{alert.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {alert.timestamp.toLocaleTimeString("en-IN")}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeAlert(alert.id)}
                className="rounded-full p-1 h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Helper functions to show alerts from anywhere in the app
export const showSuccessAlert = (title: string, message: string) => {
  if ((window as any).showAlert) {
    (window as any).showAlert({ type: "success", title, message });
  }
};

export const showWarningAlert = (title: string, message: string) => {
  if ((window as any).showAlert) {
    (window as any).showAlert({ type: "warning", title, message });
  }
};

export const showErrorAlert = (title: string, message: string) => {
  if ((window as any).showAlert) {
    (window as any).showAlert({ type: "error", title, message });
  }
};

export const showInfoAlert = (title: string, message: string) => {
  if ((window as any).showAlert) {
    (window as any).showAlert({ type: "info", title, message });
  }
};

// Hook to use alerts in components
export function useAlerts() {
  const addAlert = useCallback((alert: Omit<Alert, "id" | "timestamp">) => {
    if ((window as any).showAlert) {
      return (window as any).showAlert(alert);
    }
    return null;
  }, []);

  return {
    showSuccess: (title: string, message: string) => addAlert({ type: "success", title, message }),
    showWarning: (title: string, message: string) => addAlert({ type: "warning", title, message }),
    showError: (title: string, message: string) => addAlert({ type: "error", title, message }),
    showInfo: (title: string, message: string) => addAlert({ type: "info", title, message }),
  };
}
