import React, { createContext, useState, useContext, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState } from 'react-native';

interface NetworkContextData {
  isConnected: boolean | null;
  connectionType: string | null;
  lastSyncTime: Date | null;
}

const NetworkContext = createContext<NetworkContextData>({
  isConnected: true,
  connectionType: null,
  lastSyncTime: new Date(),
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkContextData>({
    isConnected: true,
    connectionType: null,
    lastSyncTime: new Date(),
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState(prev => ({
        ...prev,
        isConnected: state.isConnected,
        connectionType: state.type,
        lastSyncTime: prev.lastSyncTime,
      }));
    });

    // Handle app state changes (iOS issue workaround)
    const subAppState = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === 'active') {
        // Refresh network info when app comes to foreground
        const state = await NetInfo.fetch();
        setNetworkState(prev => ({
          ...prev,
          isConnected: state.isConnected,
          connectionType: state.type,
        }));
      }
    });

    // Initial fetch
    NetInfo.fetch().then(state => {
      setNetworkState(prev => ({
        ...prev,
        isConnected: state.isConnected,
        connectionType: state.type,
      }));
    });

    return () => {
      unsubscribe();
      subAppState.remove();
    };
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextData => {
  return useContext(NetworkContext);
}; 