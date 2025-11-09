import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  connectionType: NetInfoStateType;
  isOnline: boolean;
  connectionHistory: NetworkConnectionEvent[];
  checkConnection: () => Promise<void>;
}

interface NetworkConnectionEvent {
  timestamp: Date;
  isConnected: boolean | null;
  connectionType: NetInfoStateType;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<NetInfoStateType>(NetInfoStateType.unknown);
  const [connectionHistory, setConnectionHistory] = useState<NetworkConnectionEvent[]>([]);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then(handleConnectionChange);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(handleConnectionChange);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleConnectionChange = useCallback((state: NetInfoState) => {
    setIsConnected(state.isConnected);
    setIsInternetReachable(state.isInternetReachable);
    setConnectionType(state.type);

    // Track connection history (keep last 10 events)
    setConnectionHistory((prev) => {
      const newEvent: NetworkConnectionEvent = {
        timestamp: new Date(),
        isConnected: state.isConnected,
        connectionType: state.type,
      };
      return [newEvent, ...prev].slice(0, 10);
    });

    // Log network changes for debugging
    console.log('Network state changed:', {
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    });
  }, []);

  const checkConnection = useCallback(async () => {
    const state = await NetInfo.fetch();
    handleConnectionChange(state);
  }, [handleConnectionChange]);

  const isOnline = isConnected === true && isInternetReachable !== false;

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        connectionType,
        isOnline,
        connectionHistory,
        checkConnection,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
