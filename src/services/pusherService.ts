
import Pusher from 'pusher-js';

class PusherService {
  private pusher: Pusher | null = null;
  private channel: any = null;

  connect(pusherKey: string, cluster: string) {
    if (this.pusher) {
      this.disconnect();
    }

    this.pusher = new Pusher(pusherKey, {
      cluster: cluster
    });

    this.channel = this.pusher.subscribe('fastwapi-channel');
    
    // Handle connection events
    this.pusher.connection.bind('connected', () => {
      console.log('Pusher connected successfully');
    });

    this.pusher.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error);
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
      this.channel.bind('message-event', callback);
    }
  }

  unsubscribeFromMessages() {
    if (this.channel) {
      this.channel.unbind('message-event');
    }
  }

  isConnected() {
    return this.pusher?.connection.state === 'connected';
  }
}

export const pusherService = new PusherService();
