
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

    this.channel = this.pusher.subscribe('fastwapi-channel');
    
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
      console.log('✅ Successfully subscribed to fastwapi-channel');
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
    }, 15000); // Check every 15 seconds
  }

  private handleReconnect() {
    if (this.isManuallyDisconnected) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(2000 * this.reconnectAttempts, 30000); // Max 30 seconds
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
    console.log('📨 Setting up comprehensive message subscription...');
    this.messageCallback = callback;
    
    if (this.channel) {
      // Comprehensive list of event types matching fastwapi patterns
      const eventTypes = [
        // Primary fastwapi events
        'message-event',
        'webhook-message',
        'whatsapp-message',
        'incoming-message',
        
        // WhatsApp webhook formats
        'whatsapp-webhook',
        'webhook',
        'message',
        'new-message',
        
        // Generic patterns
        'data',
        'event',
        'payload'
      ];

      eventTypes.forEach(eventType => {
        this.channel.bind(eventType, (data: any) => {
          console.log(`📨 ===== FASTWAPI MESSAGE RECEIVED =====`);
          console.log(`📨 Event Type: ${eventType}`);
          console.log(`📨 Raw Data:`, JSON.stringify(data, null, 2));
          console.log(`📨 Timestamp:`, new Date().toISOString());
          console.log(`📨 ====================================`);
          
          if (this.messageCallback) {
            this.messageCallback(data);
          }
        });
        console.log(`📨 Bound to fastwapi event: ${eventType}`);
      });
      
      console.log(`📨 Subscribed to ${eventTypes.length} fastwapi event types`);
    } else {
      console.warn('⚠️ Cannot subscribe - no fastwapi channel available');
    }
  }

  unsubscribeFromMessages() {
    if (this.channel) {
      this.channel.unbind_all();
      console.log('📨 Unsubscribed from all fastwapi message events');
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

  // Force reconnect method
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
