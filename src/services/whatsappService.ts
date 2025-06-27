
import { toast } from 'sonner';

class WhatsAppService {
  // Placeholder service - WhatsApp Business API integration removed
  // This app now works purely through Pusher real-time messaging
  
  async testConnection() {
    throw new Error('WhatsApp Business API integration has been removed. This app now uses Pusher for real-time messaging only.');
  }

  async syncTemplates() {
    // Return empty templates since we're not using WhatsApp API
    return [];
  }

  async sendMessage(phoneNumber: string, message: string) {
    throw new Error('WhatsApp Business API integration has been removed. This app now uses Pusher for real-time messaging only.');
  }
}

export const whatsappService = new WhatsAppService();
