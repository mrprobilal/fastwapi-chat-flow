
import { useEffect, useState } from 'react';
import { pusherService } from '../services/pusherService';
import { databaseService } from '../services/databaseService';

export const usePusher = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get settings from database service
    const settings = databaseService.getSettings();
    const pusherKey = settings?.pusherKey || '490510485d3b7c3874d4';
    const cluster = settings?.pusherCluster || 'ap4';

    console.log('🔌 Initializing Pusher with:', { pusherKey, cluster });

    const channel = pusherService.connect(pusherKey, cluster);

    // Monitor connection status more frequently
    const checkConnection = () => {
      const connected = pusherService.isConnected();
      setIsConnected(connected);
      console.log(`🔌 Pusher status: ${connected ? 'Connected' : 'Disconnected'} (${pusherService.getConnectionState()})`);
    };

    // Check immediately and then every 2 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 2000);

    return () => {
      clearInterval(interval);
      pusherService.disconnect();
    };
  }, []);

  const subscribeToMessages = (callback: (data: any) => void) => {
    console.log('📨 Setting up message subscription...');
    pusherService.subscribeToMessages(callback);
  };

  const unsubscribeFromMessages = () => {
    console.log('📨 Removing message subscription...');
    pusherService.unsubscribeFromMessages();
  };

  return {
    isConnected,
    subscribeToMessages,
    unsubscribeFromMessages
  };
};
