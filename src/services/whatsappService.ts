
import { creativepixelsService } from './creativepixelsService';
import { toast } from 'sonner';

class WhatsAppService {
  async syncTemplates() {
    try {
      const creativepixelsTemplates = await creativepixelsService.getWhatsAppTemplates();
      if (creativepixelsTemplates && creativepixelsTemplates.data) {
        localStorage.setItem('whatsapp-templates', JSON.stringify(creativepixelsTemplates.data));
        return creativepixelsTemplates.data;
      }
      return [];
    } catch (error) {
      console.error('Template sync failed:', error);
      throw error;
    }
  }

  async sendMessage(phoneNumber: string, message: string) {
    try {
      const result = await creativepixelsService.sendWhatsAppMessage(phoneNumber, message);
      console.log('Message sent via Creative Pixels:', result);
      toast.success('Message sent successfully!');
      return result;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  }

  async getMessages() {
    try {
      const messages = await creativepixelsService.getWhatsAppMessages();
      console.log('Messages fetched from Creative Pixels:', messages);
      return messages;
    } catch (error) {
      console.error('Failed to get messages from Creative Pixels:', error);
      throw error;
    }
  }

  async getConversations() {
    try {
      const conversations = await creativepixelsService.getWhatsAppConversations();
      console.log('Conversations fetched from Creative Pixels:', conversations);
      return conversations;
    } catch (error) {
      console.error('Failed to get conversations from Creative Pixels:', error);
      throw error;
    }
  }

  async getChatHistory(contactId: string) {
    try {
      const chatHistory = await creativepixelsService.getWhatsAppChatHistory(contactId);
      console.log('Chat history fetched from Creative Pixels:', chatHistory);
      return chatHistory;
    } catch (error) {
      console.error('Failed to get chat history from Creative Pixels:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
