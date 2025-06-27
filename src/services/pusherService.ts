
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
    console.log('📨 Setting up COMPREHENSIVE webhook message subscription...');
    this.messageCallback = callback;
    
    if (this.channel) {
      // COMPREHENSIVE list of ALL possible WhatsApp webhook event names
      const eventTypes = [
        // Standard WhatsApp webhook events
        'messages',
        'messages.received',
        'message.received',
        'message_received',
        'incoming_message',
        'incoming-message',
        'new_message',
        'new-message',
        'whatsapp_message',
        'whatsapp-message',
        'whatsapp.message',
        
        // Generic webhook events
        'webhook',
        'webhook_data',
        'webhook-data',
        'webhook.data',
        'webhook_received',
        'webhook-received',
        'webhook.received',
        
        // Cloud API events
        'cloud_api',
        'cloud-api',
        'cloud.api',
        'cloud_api_webhook',
        'cloud-api-webhook',
        'cloud.api.webhook',
        
        // Meta/Facebook events
        'meta_webhook',
        'meta-webhook',
        'meta.webhook',
        'facebook_webhook',
        'facebook-webhook',
        'facebook.webhook',
        
        // FastWAPI specific events
        'fastwapi',
        'fastwapi_message',
        'fastwapi-message',
        'fastwapi.message',
        'fastwapi_webhook',
        'fastwapi-webhook',
        'fastwapi.webhook',
        
        // Generic message events
        'message',
        'message_event',
        'message-event',
        'message.event',
        'msg',
        'msg_received',
        'msg-received',
        'msg.received',
        
        // Data events
        'data',
        'data_received',
        'data-received',
        'data.received',
        'payload',
        'event_data',
        'event-data',
        'event.data',
        
        // Notification events
        'notification',
        'notification_received',
        'notification-received',
        'notification.received',
        
        // Business API events
        'business_message',
        'business-message',
        'business.message',
        'wa_business_message',
        'wa-business-message',
        'wa.business.message'
      ];

      let boundEvents = 0;
      eventTypes.forEach(eventType => {
        try {
          this.channel.bind(eventType, (data: any) => {
            console.log(`🔥 ===== WEBHOOK EVENT RECEIVED =====`);
            console.log(`🔥 Event Type: "${eventType}"`);
            console.log(`🔥 Event Data:`, JSON.stringify(data, null, 2));
            console.log(`🔥 Timestamp:`, new Date().toISOString());
            console.log(`🔥 =================================`);
            
            if (this.messageCallback) {
              this.messageCallback(data);
            }
          });
          boundEvents++;
          console.log(`📨 ✅ Bound to event: "${eventType}"`);
        } catch (error) {
          console.error(`📨 ❌ Failed to bind to event "${eventType}":`, error);
        }
      });
      
      console.log(`📨 🎯 Successfully bound to ${boundEvents}/${eventTypes.length} webhook event types`);
      
      // Also bind to catch-all events just in case
      try {
        this.channel.bind_global((eventName: string, data: any) => {
          console.log(`🌐 GLOBAL EVENT CAUGHT: "${eventName}"`, data);
          
          // If it's not one of our known events, still try to process it
          if (!eventTypes.includes(eventName)) {
            console.log(`🆕 Unknown event type "${eventName}" - attempting to process anyway`);
            if (this.messageCallback) {
              this.messageCallback(data);
            }
          }
        });
        console.log(`📨 🌐 Global event catcher enabled`);
      } catch (error) {
        console.error('❌ Failed to set up global event catcher:', error);
      }
      
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
