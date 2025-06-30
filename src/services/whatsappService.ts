
import { fastwapiService } from './fastwapiService';
import { toast } from 'sonner';

class WhatsAppService {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  async testConnection() {
    const settings = this.getSettings();
    
    if (!settings?.accessToken || !settings?.businessId) {
      throw new Error('WhatsApp API settings not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/${settings.businessId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('WhatsApp connection successful:', data);
      return data;
    } catch (error) {
      console.error('WhatsApp connection test failed:', error);
      throw error;
    }
  }

  async syncTemplates() {
    try {
      // First try to get templates from FastWAPI backend
      const fastwapiTemplates = await fastwapiService.getWhatsAppTemplates();
      if (fastwapiTemplates && fastwapiTemplates.data) {
        localStorage.setItem('whatsapp-templates', JSON.stringify(fastwapiTemplates.data));
        return fastwapiTemplates.data;
      }
    } catch (error) {
      console.log('Failed to get templates from FastWAPI, trying direct API:', error);
    }

    // Fallback to direct API call
    const settings = this.getSettings();
    
    if (!settings?.accessToken || !settings?.businessId) {
      throw new Error('WhatsApp API settings not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/${settings.businessId}/message_templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Templates synced:', data);
      
      if (data.data && data.data.length > 0) {
        const syncedTemplates = data.data.map((template: any) => ({
          id: template.id,
          name: template.name,
          category: template.category || 'Utility',
          status: template.status || 'Approved',
          content: template.components?.find((c: any) => c.type === 'BODY')?.text || 'Template content',
          variables: template.components?.find((c: any) => c.type === 'BODY')?.example?.body_text?.[0] || []
        }));
        
        localStorage.setItem('whatsapp-templates', JSON.stringify(syncedTemplates));
        return syncedTemplates;
      }
      
      return [];
    } catch (error) {
      console.error('Template sync failed:', error);
      throw error;
    }
  }

  async sendMessage(phoneNumber: string, message: string) {
    try {
      // First try to send via FastWAPI backend
      const result = await fastwapiService.sendWhatsAppMessage(phoneNumber, message);
      console.log('Message sent via FastWAPI:', result);
      return result;
    } catch (error) {
      console.log('Failed to send via FastWAPI, trying direct API:', error);
      
      // Fallback to direct API call
      const settings = this.getSettings();
      
      if (!settings?.accessToken || !settings?.phoneNumberId) {
        throw new Error('WhatsApp API settings not configured');
      }

      try {
        const response = await fetch(`${this.baseUrl}/${settings.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${settings.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: { body: message }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Message sent successfully:', data);
        return data;
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    }
  }

  async getMessages() {
    try {
      // Use the new FastWAPI endpoint to get messages
      const messages = await fastwapiService.getWhatsAppMessages();
      console.log('Messages fetched from FastWAPI:', messages);
      return messages;
    } catch (error) {
      console.error('Failed to get messages from FastWAPI:', error);
      throw error;
    }
  }

  async getConversations() {
    try {
      // Use the new FastWAPI endpoint to get conversations
      const conversations = await fastwapiService.getWhatsAppConversations();
      console.log('Conversations fetched from FastWAPI:', conversations);
      return conversations;
    } catch (error) {
      console.error('Failed to get conversations from FastWAPI:', error);
      throw error;
    }
  }

  private getSettings() {
    try {
      return JSON.parse(localStorage.getItem('fastwapi-settings') || '{}');
    } catch (error) {
      console.error('Error parsing settings:', error);
      return {};
    }
  }
}

export const whatsappService = new WhatsAppService();
