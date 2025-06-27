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
    console.log('🚀 ===== SETTING UP ULTRA-COMPREHENSIVE MESSAGE RECEPTION =====');
    this.messageCallback = callback;
    
    if (this.channel) {
      // SUPER COMPREHENSIVE list of ALL possible event names
      const eventTypes = [
        // Standard webhook events
        'messages', 'message', 'msg', 'webhook', 'data', 'event',
        'messages.received', 'message.received', 'message_received',
        'incoming_message', 'incoming-message', 'new_message', 'new-message',
        'whatsapp_message', 'whatsapp-message', 'whatsapp.message',
        'webhook_data', 'webhook-data', 'webhook.data',
        'webhook_received', 'webhook-received', 'webhook.received',
        'cloud_api', 'cloud-api', 'cloud.api',
        'meta_webhook', 'meta-webhook', 'meta.webhook',
        'facebook_webhook', 'facebook-webhook', 'facebook.webhook',
        'fastwapi', 'fastwapi_message', 'fastwapi-message', 'fastwapi.message',
        'fastwapi_webhook', 'fastwapi-webhook', 'fastwapi.webhook',
        'message_event', 'message-event', 'message.event',
        'msg_received', 'msg-received', 'msg.received',
        'data_received', 'data-received', 'data.received',
        'payload', 'event_data', 'event-data', 'event.data',
        'notification', 'notification_received', 'notification-received',
        'business_message', 'business-message', 'business.message',
        'wa_business_message', 'wa-business-message', 'wa.business.message',
        // Additional patterns that might be used
        'webhook.notification', 'webhook_notification', 'webhook-notification',
        'api.webhook', 'api_webhook', 'api-webhook',
        'receive', 'received', 'inbound', 'incoming',
        'chat', 'chat_message', 'chat-message', 'chat.message',
        'text', 'text_message', 'text-message', 'text.message',
        'update', 'status_update', 'status-update', 'status.update'
      ];

      console.log(`🎯 Binding to ${eventTypes.length} different event types...`);
      
      let boundEvents = 0;
      eventTypes.forEach(eventType => {
        try {
          this.channel.bind(eventType, (data: any) => {
            console.log(`🔥🔥🔥 ===== WEBHOOK EVENT RECEIVED =====`);
            console.log(`🔥 Event Type: "${eventType}"`);
            console.log(`🔥 Raw Data:`, data);
            console.log(`🔥 Data Type:`, typeof data);
            console.log(`🔥 Data Keys:`, Object.keys(data || {}));
            console.log(`🔥 JSON Data:`, JSON.stringify(data, null, 2));
            console.log(`🔥 Timestamp:`, new Date().toISOString());
            console.log(`🔥🔥🔥 =================================`);
            
            // Log to window for debugging
            if (typeof window !== 'undefined') {
              (window as any).lastReceivedEvent = {
                eventType,
                data,
                timestamp: new Date().toISOString()
              };
              console.log('💾 Event saved to window.lastReceivedEvent for debugging');
            }
            
            if (this.messageCallback) {
              this.messageCallback(data);
            }
          });
          boundEvents++;
        } catch (error) {
          console.error(`❌ Failed to bind to event "${eventType}":`, error);
        }
      });
      
      console.log(`✅ Successfully bound to ${boundEvents}/${eventTypes.length} webhook event types`);
      
      // ULTRA-AGGRESSIVE: Bind to ALL possible events with global catcher
      try {
        this.channel.bind_global((eventName: string, data: any) => {
          console.log(`🌍🌍🌍 ===== GLOBAL EVENT INTERCEPTED =====`);
          console.log(`🌍 Event Name: "${eventName}"`);
          console.log(`🌍 Event Data:`, data);
          console.log(`🌍 Data Type:`, typeof data);
          console.log(`🌍 JSON:`, JSON.stringify(data, null, 2));
          console.log(`🌍 Timestamp:`, new Date().toISOString());
          console.log(`🌍🌍🌍 ===================================`);
          
          // Save ALL events for debugging
          if (typeof window !== 'undefined') {
            if (!(window as any).allReceivedEvents) {
              (window as any).allReceivedEvents = [];
            }
            (window as any).allReceivedEvents.push({
              eventName,
              data,
              timestamp: new Date().toISOString()
            });
            
            // Keep only last 50 events
            if ((window as any).allReceivedEvents.length > 50) {
              (window as any).allReceivedEvents = (window as any).allReceivedEvents.slice(-50);
            }
            
            console.log(`💾 Event saved to window.allReceivedEvents (${(window as any).allReceivedEvents.length} total)`);
          }
          
          // Process ANY event through our message handler
          if (this.messageCallback) {
            console.log(`🔄 Processing global event "${eventName}" through message handler...`);
            this.messageCallback(data);
          }
        });
        console.log(`🌍 ✅ GLOBAL EVENT CATCHER ACTIVATED - Will catch ANY event sent to this channel`);
      } catch (error) {
        console.error('❌ Failed to set up global event catcher:', error);
      }
      
      // Log channel state
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
