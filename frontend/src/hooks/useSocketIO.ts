'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface LivePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

interface MarketStatus {
  isOpen: boolean;
  message: string;
}

export function useSocketIO(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    isOpen: false,
    message: 'Connecting...'
  });

  useEffect(() => {
    // Connect to Socket.io server
    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket.io connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setConnected(false);
    });

    socketInstance.on('price_update', (data: LivePrice) => {
      console.log('Price update:', data);
      setPrices((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    socketInstance.on('market_status', (data: MarketStatus) => {
      console.log('Market status:', data);
      setMarketStatus(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  const subscribe = (symbol: string) => {
    if (socket && connected) {
      console.log(`Subscribing to ${symbol}`);
      socket.emit('subscribe', symbol);
    }
  };

  const unsubscribe = (symbol: string) => {
    if (socket && connected) {
      console.log(`Unsubscribing from ${symbol}`);
      socket.emit('unsubscribe', symbol);
    }
  };

  return {
    socket,
    connected,
    prices,
    marketStatus,
    subscribe,
    unsubscribe,
  };
}
