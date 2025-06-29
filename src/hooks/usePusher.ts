
import { useEffect, useState } from 'react';
import { pusherService } from '../services/pusherService';

export const usePusher = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Use the settings from your configuration
    const pusherKey = '490510485d3b7c3874d4';
    const cluster = 'ap4';

    const channel = pusherService.connect(pusherKey, cluster);

    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(pusherService.isConnected());
    };

    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
      pusherService.disconnect();
    };
  }, []);

  const subscribeToMessages = (callback: (data: any) => void) => {
    pusherService.subscribeToMessages(callback);
  };

  const unsubscribeFromMessages = () => {
    pusherService.unsubscribeFromMessages();
  };

  return {
    isConnected,
    subscribeToMessages,
    unsubscribeFromMessages
  };
};
