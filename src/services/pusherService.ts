import Pusher from 'pusher-js';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private messageCallback: ((data: any) => void) | null = null;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;

  connect(pusherKey: string, cluster: string) {
    console.log('🔌 Connecting to Pusher with key:', pusherKey, 'cluster:', cluster);
    
    if (this.pusher) {
      this.disconnect();
    }

    this.isManuallyDisconnected = false;

    this.pusher = new Pusher(pusherKey, {
      cluster: cluster,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      activityTimeout: 30000,
      pongTimeout: 10000,
      unavailableTimeout: 10000
    });

    // Subscribe to the 'chat' channel as per your webhook
    this.channel = this.pusher.subscribe('chat');
    
    // Handle connection events
    this.pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
      console.log('🔌 Connection state:', this.pusher?.connection.state);
      console.log('📡 Channel subscribed:', this.channel?.name);
      this.reconnectAttempts = 0;
      this.startConnectionMonitoring();
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected');
      if (!this.isManuallyDisconnected) {
        this.handleReconnect();
      }
    });

    this.pusher.connection.bind('error', (error: any) => {
      console.error('❌ Pusher connection error:', error);
      if (!this.isManuallyDisconnected) {
        this.handleReconnect();
      }
    });

    this.pusher.connection.bind('failed', () => {
      console.error('❌ Pusher connection failed');
      if (!this.isManuallyDisconnected) {
        this.handleReconnect();
      }
    });

    this.pusher.connection.bind('unavailable', () => {
      console.warn('⚠️ Pusher connection unavailable');
      if (!this.isManuallyDisconnected) {
        this.handleReconnect();
      }
    });

    // Handle channel events
    this.channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Successfully subscribed to chat channel');
    });

    this.channel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ Channel subscription error:', error);
    });

    return this.channel;
  }

  private startConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    this.connectionCheckInterval = setInterval(() => {
      if (!this.isManuallyDisconnected && this.pusher) {
        const state = this.pusher.connection.state;
        console.log('🔍 Connection check - State:', state);
        
        if (state === 'disconnected' || state === 'failed' || state === 'unavailable') {
          console.log('🔄 Connection lost, attempting to reconnect...');
          this.handleReconnect();
        }
      }
    }, 15000);
  }

  private handleReconnect() {
    if (this.isManuallyDisconnected) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(2000 * this.reconnectAttempts, 30000);
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        if (this.pusher && !this.isManuallyDisconnected) {
          try {
            this.pusher.connect();
          } catch (error) {
            console.error('❌ Reconnection failed:', error);
          }
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
      this.messageCallback = null;
      this.reconnectAttempts = 0;
    }
  }

  subscribeToMessages(callback: (data: any) => void) {
    console.log('🚀 ===== SETTING UP WEBHOOK MESSAGE RECEPTION =====');
    this.messageCallback = callback;
    
    if (this.channel) {
      // Listen specifically for 'new-message' event as per your webhook
      this.channel.bind('new-message', (data: any) => {
        console.log('🔥🔥🔥 ===== WEBHOOK MESSAGE RECEIVED =====');
        console.log('🔥 Event Type: "new-message"');
        console.log('🔥 Raw Data:', data);
        console.log('🔥 Data Type:', typeof data);
        console.log('🔥 Data Keys:', Object.keys(data || {}));
        console.log('🔥 JSON Data:', JSON.stringify(data, null, 2));
        console.log('🔥 Timestamp:', new Date().toISOString());
        console.log('🔥🔥🔥 =================================');
        
        // Log to window for debugging
        if (typeof window !== 'undefined') {
          (window as any).lastReceivedEvent = {
            eventType: 'new-message',
            data,
            timestamp: new Date().toISOString()
          };
          console.log('💾 Event saved to window.lastReceivedEvent for debugging');
        }
        
        if (this.messageCallback) {
          this.messageCallback(data);
        }
      });

      // Also keep the comprehensive list for backwards compatibility
      const additionalEventTypes = [
        'messages', 'message', 'msg', 'webhook', 'data', 'event',
        'messages.received', 'message.received', 'message_received',
        'incoming_message', 'incoming-message', 'new_message',
        'whatsapp_message', 'whatsapp-message', 'whatsapp.message',
        'webhook_data', 'webhook-data', 'webhook.data',
        'fastwapi', 'fastwapi_message', 'fastwapi-message'
      ];

      console.log(`🎯 Binding to ${additionalEventTypes.length + 1} different event types...`);
      
      let boundEvents = 1; // Already bound to 'new-message'
      additionalEventTypes.forEach(eventType => {
        try {
          this.channel.bind(eventType, (data: any) => {
            console.log(`🔥 Additional Event Received: "${eventType}"`, data);
            if (this.messageCallback) {
              this.messageCallback(data);
            }
          });
          boundEvents++;
        } catch (error) {
          console.error(`❌ Failed to bind to event "${eventType}":`, error);
        }
      });
      
      console.log(`✅ Successfully bound to ${boundEvents} webhook event types`);
      
      // Global event catcher
      try {
        this.channel.bind_global((eventName: string, data: any) => {
          console.log(`🌍 Global Event: "${eventName}"`, data);
          
          if (typeof window !== 'undefined') {
            if (!(window as any).allReceivedEvents) {
              (window as any).allReceivedEvents = [];
            }
            (window as any).allReceivedEvents.push({
              eventName,
              data,
              timestamp: new Date().toISOString()
            });
            
            if ((window as any).allReceivedEvents.length > 50) {
              (window as any).allReceivedEvents = (window as any).allReceivedEvents.slice(-50);
            }
          }
          
          if (this.messageCallback) {
            this.messageCallback(data);
          }
        });
        console.log(`🌍 ✅ GLOBAL EVENT CATCHER ACTIVATED`);
      } catch (error) {
        console.error('❌ Failed to set up global event catcher:', error);
      }
      
      console.log('📡 Channel State:', {
        name: this.channel.name,
        subscribed: this.channel.subscribed,
        subscription_pending: this.channel.subscription_pending,
        subscription_cancelled: this.channel.subscription_cancelled
      });
      
    } else {
      console.error('❌ NO CHANNEL AVAILABLE - Cannot subscribe to messages!');
    }
    
    console.log('🚀 ===== MESSAGE RECEPTION SETUP COMPLETE =====');
  }

  unsubscribeFromMessages() {
    if (this.channel) {
      this.channel.unbind_all();
      console.log('📨 Unsubscribed from all message events');
    }
    this.messageCallback = null;
  }

  isConnected() {
    return this.pusher?.connection.state === 'connected';
  }

  getConnectionState() {
    return this.pusher?.connection.state || 'disconnected';
  }

  getChannelInfo() {
    return {
      channelName: this.channel?.name,
      subscribed: !!this.channel,
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  forceReconnect() {
    console.log('🔄 Forcing reconnection...');
    this.reconnectAttempts = 0;
    if (this.pusher) {
      this.pusher.disconnect();
      setTimeout(() => {
        if (this.pusher && !this.isManuallyDisconnected) {
          this.pusher.connect();
        }
      }, 1000);
    }
  }
}

export const pusherService = new PusherService();
