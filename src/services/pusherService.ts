
import Pusher from 'pusher-js';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageCallback: ((data: any) => void) | null = null;

  connect(pusherKey: string, cluster: string) {
    console.log('🔌 Connecting to Pusher with key:', pusherKey, 'cluster:', cluster);
    
    if (this.pusher) {
      this.disconnect();
    }

    this.pusher = new Pusher(pusherKey, {
      cluster: cluster,
      forceTLS: true,
      enabledTransports: ['ws', 'wss']
    });

    this.channel = this.pusher.subscribe('fastwapi-channel');
    
    // Handle connection events
    this.pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
      console.log('🔌 Connection state:', this.pusher?.connection.state);
      console.log('📡 Channel subscribed:', this.channel?.name);
      this.reconnectAttempts = 0;
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected');
    });

    this.pusher.connection.bind('error', (error: any) => {
      console.error('❌ Pusher connection error:', error);
      this.handleReconnect();
    });

    this.pusher.connection.bind('failed', () => {
      console.error('❌ Pusher connection failed');
      this.handleReconnect();
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

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        if (this.pusher) {
          this.pusher.connect();
        }
      }, 2000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
      this.messageCallback = null;
      this.reconnectAttempts = 0;
    }
  }

  subscribeToMessages(callback: (data: any) => void) {
    console.log('📨 Setting up message subscription...');
    this.messageCallback = callback;
    
    if (this.channel) {
      // Bind to multiple event types for better compatibility
      const eventTypes = [
        'message-event',
        'new-message', 
        'incoming-message',
        'whatsapp-message',
        'message',
        'webhook-message'
      ];

      eventTypes.forEach(eventType => {
        this.channel.bind(eventType, (data: any) => {
          console.log(`📨 Received ${eventType} event:`, data);
          if (this.messageCallback) {
            this.messageCallback(data);
          }
        });
        console.log(`📨 Bound to event: ${eventType}`);
      });
      
      console.log('📨 Subscribed to message events on fastwapi-channel');
    } else {
      console.warn('⚠️ Cannot subscribe - no channel available');
    }
  }

  unsubscribeFromMessages() {
    if (this.channel) {
      this.channel.unbind_all();
      console.log('📨 Unsubscribed from all message events');
    }
    this.messageCallback = null;
  }

  // Method to manually trigger a test message (for debugging)
  triggerTestMessage(data: any) {
    console.log('🧪 Triggering test message:', data);
    if (this.messageCallback) {
      this.messageCallback(data);
    }
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
      connected: this.isConnected()
    };
  }
}

export const pusherService = new PusherService();
