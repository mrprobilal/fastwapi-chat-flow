
import Pusher from 'pusher-js';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;

  connect(pusherKey: string, cluster: string) {
    if (this.pusher) {
      this.disconnect();
    }

    this.pusher = new Pusher(pusherKey, {
      cluster: cluster,
      encrypted: true
    });

    this.channel = this.pusher.subscribe('fastwapi-channel');
    
    // Handle connection events
    this.pusher.connection.bind('connected', () => {
      console.log('Pusher connected successfully to fastwapi-channel');
    });

    this.pusher.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error);
    });

    // Log subscription events
    this.channel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to fastwapi-channel');
    });

    this.channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Subscription error:', error);
    });

    return this.channel;
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
      this.channel = null;
    }
  }

  subscribeToMessages(callback: (data: any) => void) {
    if (this.channel) {
      // Listen to the main event that FastWAPI should send
      this.channel.bind('message-event', (data: any) => {
        console.log('Received message-event:', data);
        callback(data);
      });
      
      // Also listen to common WhatsApp webhook events
      this.channel.bind('whatsapp-message', (data: any) => {
        console.log('Received whatsapp-message:', data);
        callback(data);
      });
      
      this.channel.bind('incoming-message', (data: any) => {
        console.log('Received incoming-message:', data);
        callback(data);
      });
      
      console.log('Subscribed to message events on fastwapi-channel');
    }
  }

  unsubscribeFromMessages() {
    if (this.channel) {
      this.channel.unbind('message-event');
      this.channel.unbind('whatsapp-message');
      this.channel.unbind('incoming-message');
      
      console.log('Unsubscribed from message events');
    }
  }

  isConnected() {
    return this.pusher?.connection.state === 'connected';
  }

  // Test method to send a test event (for debugging)
  testConnection() {
    if (this.channel) {
      console.log('Channel state:', this.channel);
      console.log('Pusher connection state:', this.pusher?.connection.state);
    }
  }
}

export const pusherService = new PusherService();
