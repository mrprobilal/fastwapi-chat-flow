
import Pusher from 'pusher-js';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(pusherKey: string, cluster: string) {
    if (this.pusher) {
      this.disconnect();
    }

    this.pusher = new Pusher(pusherKey, {
      cluster: cluster,
      forceTLS: true
    });

    this.channel = this.pusher.subscribe('fastwapi-channel');
    
    // Handle connection events
    this.pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully');
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
      this.reconnectAttempts = 0;
    }
  }

  subscribeToMessages(callback: (data: any) => void) {
    if (this.channel) {
      // Listen to multiple event types for better compatibility
      this.channel.bind('message-event', callback);
      this.channel.bind('new-message', callback);
      this.channel.bind('incoming-message', callback);
      this.channel.bind('whatsapp-message', callback);
      
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
  }

  // Method to send messages through your FastWAPI backend
  sendMessageToFastAPI(to: string, message: string) {
    // This will be handled by your FastWAPI backend
    // Just store locally and trigger Pusher event for now
    console.log(`📤 Message to send via FastWAPI: ${message} -> ${to}`);
    
    // You can add your FastWAPI endpoint here when ready
    // For now, we'll just handle it locally
    return Promise.resolve();
  }

  isConnected() {
    return this.pusher?.connection.state === 'connected';
  }

  getConnectionState() {
    return this.pusher?.connection.state || 'disconnected';
  }
}

export const pusherService = new PusherService();
