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

interface OptionChainUpdate {
  symbol: string;
  strikes: any[];
  timestamp: string;
}

interface OIAnalysisUpdate {
  symbol: string;
  data: any;
  timestamp: string;
}

interface SetupScoreUpdate {
  symbol: string;
  timeframe: string;
  score: number;
  components: any;
  timestamp: string;
}

export function useSocketIO(url: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    isOpen: false,
    message: 'Connecting...'
  });
  const [optionChainData, setOptionChainData] = useState<Record<string, OptionChainUpdate>>({});
  const [oiAnalysisData, setOIAnalysisData] = useState<Record<string, OIAnalysisUpdate>>({});
  const [setupScores, setSetupScores] = useState<Record<string, SetupScoreUpdate>>({});

  useEffect(() => {
    // Connect to Socket.io server
    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => setConnected(true));
    socketInstance.on('disconnect', () => setConnected(false));

    socketInstance.on('price_update', (data: LivePrice) => {
      setPrices((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    socketInstance.on('market_status', (data: MarketStatus) => setMarketStatus(data));

    socketInstance.on('option_chain_update', (data: OptionChainUpdate) => {
      setOptionChainData((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    socketInstance.on('oi_analysis_update', (data: OIAnalysisUpdate) => {
      setOIAnalysisData((prev) => ({
        ...prev,
        [data.symbol]: data,
      }));
    });

    socketInstance.on('setup_score_update', (data: SetupScoreUpdate) => {
      const key = `${data.symbol}_${data.timeframe}`;
      setSetupScores((prev) => ({
        ...prev,
        [key]: data,
      }));
    });
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  const subscribe = (symbol: string) => {
    if (socket && connected) socket.emit('subscribe', symbol);
  };

  const unsubscribe = (symbol: string) => {
    if (socket && connected) socket.emit('unsubscribe', symbol);
  };

  return {
    socket,
    connected,
    prices,
    marketStatus,
    optionChainData,
    oiAnalysisData,
    setupScores,
    subscribe,
    unsubscribe,
  };
}
