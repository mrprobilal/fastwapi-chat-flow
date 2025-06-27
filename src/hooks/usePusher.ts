
import { useEffect, useState } from 'react';
import { pusherService } from '../services/pusherService';
import { databaseService } from '../services/databaseService';

export const usePusher = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');

  useEffect(() => {
    // Get settings from database service
    const settings = databaseService.getSettings();
    const pusherKey = settings?.pusherKey || '490510485d3b7c3874d4';
    const cluster = settings?.pusherCluster || 'ap4';

    console.log('🔌 Initializing persistent Pusher connection:', { pusherKey, cluster });

    const channel = pusherService.connect(pusherKey, cluster);

    // Monitor connection status continuously
    const checkConnection = () => {
      const connected = pusherService.isConnected();
      const state = pusherService.getConnectionState();
      setIsConnected(connected);
      setConnectionState(state);
      
      console.log(`🔌 Pusher status: ${connected ? '✅ Connected' : '❌ Disconnected'} (${state})`);
      
      if (!connected && state !== 'connecting') {
        console.log('🔄 Connection lost, forcing reconnect...');
        pusherService.forceReconnect();
      }
    };

    // Check immediately and then every 10 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 10000);

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up Pusher connection monitoring...');
      clearInterval(interval);
      // Don't disconnect here to maintain persistent connection
    };
  }, []);

  const subscribeToMessages = (callback: (data: any) => void) => {
    console.log('📨 Setting up fastwapi message subscription...');
    pusherService.subscribeToMessages(callback);
  };

  const unsubscribeFromMessages = () => {
    console.log('📨 Removing fastwapi message subscription...');
    pusherService.unsubscribeFromMessages();
  };

  const forceReconnect = () => {
    console.log('🔄 User requested force reconnect...');
    pusherService.forceReconnect();
  };

  return {
    isConnected,
    connectionState,
    subscribeToMessages,
    unsubscribeFromMessages,
    forceReconnect
  };
};
