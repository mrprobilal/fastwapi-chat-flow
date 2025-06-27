import { toast } from 'sonner';
import { databaseService } from './databaseService';

class WhatsAppService {
  private getHeaders() {
    const settings = databaseService.getSettings();
    return {
      'Authorization': `Bearer ${settings.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private getBaseUrl() {
    const settings = databaseService.getSettings();
    return `https://graph.facebook.com/v18.0/${settings.businessId}`;
  }

  async testConnection() {
    const settings = databaseService.getSettings();
    
    if (!settings.accessToken || !settings.businessId) {
      throw new Error('WhatsApp Business API credentials not configured. Please set them in Settings.');
    }

    console.log('🔍 Testing WhatsApp Business API connection...');

    try {
      const response = await fetch(`${this.getBaseUrl()}/message_templates`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ WhatsApp API connection successful');
      return data;
    } catch (error: any) {
      console.error('❌ WhatsApp API connection failed:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to WhatsApp API. Please check your internet connection.');
      }
      
      throw new Error(`WhatsApp API connection failed: ${error.message}`);
    }
  }

  async syncContacts() {
    const settings = databaseService.getSettings();
    
    if (!settings.accessToken || !settings.phoneNumberId) {
      throw new Error('WhatsApp Business API credentials not configured. Please set them in Settings.');
    }

    console.log('👥 Syncing contacts from local storage and creating sample contacts...');

    try {
      // Since the WhatsApp API doesn't provide a direct way to get all contacts,
      // we'll work with what we have in localStorage and create some sample contacts
      const existingContacts = JSON.parse(localStorage.getItem('whatsapp-contacts') || '[]');
      
      // Create some sample contacts if none exist
      let contacts = existingContacts.length > 0 ? existingContacts : [
        {
          id: '+14809543299',
          phone: '+14809543299',
          name: 'Sample Contact 1',
          lastMessage: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          avatar: 'SC',
          online: false
        },
        {
          id: '+923049744702',
          phone: '+923049744702',
          name: 'Sample Contact 2',
          lastMessage: '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          avatar: 'SC',
          online: false
        }
      ];

      // Save contacts to localStorage
      localStorage.setItem('whatsapp-contacts', JSON.stringify(contacts));
      console.log(`✅ Synced ${contacts.length} contacts`);

      return contacts;
    } catch (error: any) {
      console.error('❌ Contact sync error:', error);
      throw new Error(`Failed to sync contacts: ${error.message}`);
    }
  }

  async getMessageHistory(phoneNumber: string, limit = 50) {
    const settings = databaseService.getSettings();
    
    if (!settings.accessToken || !settings.phoneNumberId) {
      throw new Error('WhatsApp Business API credentials not configured. Please set them in Settings.');
    }

    console.log('📜 Creating sample message history for:', phoneNumber);

    try {
      // Since we can't directly fetch message history from WhatsApp API without webhooks,
      // we'll create some sample messages for demonstration
      const messages = [
        {
          id: Date.now() + 1,
          from: phoneNumber,
          to: 'business',
          text: 'Hello, I need some help with your services.',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          type: 'received',
          status: 'delivered'
        },
        {
          id: Date.now() + 2,
          from: 'business',
          to: phoneNumber,
          text: 'Hi! I\'d be happy to help you. What can I assist you with?',
          timestamp: new Date(Date.now() - 3300000).toISOString(), // 55 minutes ago
          type: 'sent',
          status: 'delivered'
        },
        {
          id: Date.now() + 3,
          from: phoneNumber,
          to: 'business',
          text: 'I\'m interested in your pricing plans.',
          timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
          type: 'received',
          status: 'delivered'
        }
      ];

      console.log(`✅ Created ${messages.length} sample messages for ${phoneNumber}`);
      return messages;
    } catch (error: any) {
      console.error('❌ Message history fetch error:', error);
      throw new Error(`Failed to fetch message history: ${error.message}`);
    }
  }

  async syncAllMessageHistory() {
    console.log('🔄 Starting full message history sync...');
    
    try {
      // First sync contacts
      const contacts = await this.syncContacts();
      
      const allMessages = [];
      const allChats = [];
      
      // Get message history for each contact
      for (const contact of contacts) {
        try {
          const messages = await this.getMessageHistory(contact.phone);
          allMessages.push(...messages);
          
          // Update chat with last message info
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const updatedChat = {
              ...contact,
              lastMessage: lastMessage.text.substring(0, 50) + (lastMessage.text.length > 50 ? '...' : ''),
              time: new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            allChats.push(updatedChat);
          } else {
            allChats.push(contact);
          }
          
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`Failed to fetch messages for ${contact.phone}:`, error);
          allChats.push(contact);
        }
      }
      
      // Save all data to localStorage
      if (allMessages.length > 0) {
        localStorage.setItem('whatsapp-messages', JSON.stringify(allMessages));
        console.log(`✅ Synced ${allMessages.length} total messages`);
      }
      
      if (allChats.length > 0) {
        localStorage.setItem('whatsapp-chats', JSON.stringify(allChats));
        console.log(`✅ Synced ${allChats.length} chats`);
      }
      
      return { messages: allMessages, chats: allChats };
    } catch (error: any) {
      console.error('❌ Full sync error:', error);
      throw new Error(`Failed to sync message history: ${error.message}`);
    }
  }

  async syncTemplates() {
    const settings = databaseService.getSettings();
    
    if (!settings.accessToken || !settings.businessId) {
      throw new Error('WhatsApp Business API credentials not configured. Please set them in Settings.');
    }

    console.log('🔄 Syncing templates from WhatsApp Business API...');

    try {
      const response = await fetch(`${this.getBaseUrl()}/message_templates`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 Templates received from WhatsApp API:', data);

      // Transform WhatsApp API data to our template format
      const templates = data.data?.map((template: any) => ({
        id: template.id,
        name: template.name,
        content: template.components?.find((c: any) => c.type === 'BODY')?.text || '',
        status: template.status,
        category: template.category,
        language: template.language,
        variables: this.extractVariables(template.components?.find((c: any) => c.type === 'BODY')?.text || '')
      })) || [];

      // Save templates to localStorage
      localStorage.setItem('whatsapp-templates', JSON.stringify(templates));
      databaseService.setLastSyncTime(new Date());

      return templates;
    } catch (error: any) {
      console.error('❌ Template sync error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to WhatsApp API. Please check your internet connection.');
      }
      
      throw new Error(`Failed to sync templates: ${error.message}`);
    }
  }

  private extractVariables(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/\{\{(\d+)\}\}/g);
    return matches ? matches.map((match, index) => `variable_${index + 1}`) : [];
  }

  async sendTemplateMessage(templateName: string, phoneNumber: string, variables: Record<string, string> = {}) {
    const settings = databaseService.getSettings();
    
    if (!settings.accessToken || !settings.phoneNumberId) {
      throw new Error('WhatsApp Business API credentials not configured. Please set them in Settings.');
    }

    console.log('📤 Sending template message via WhatsApp API:', { templateName, phoneNumber, variables });

    // Format phone number (remove + and ensure it starts with country code)
    const formattedPhone = phoneNumber.replace(/\D/g, '');

    // Prepare template components with variables
    const components = [];
    if (Object.keys(variables).length > 0) {
      const parameters = Object.values(variables).map(value => ({
        type: 'text',
        text: value
      }));
      
      components.push({
        type: 'body',
        parameters: parameters
      });
    }

    const messageData = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName.toLowerCase(),
        language: {
          code: 'en_US'
        },
        ...(components.length > 0 && { components })
      }
    };

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${settings.phoneNumberId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Template message sent:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ Template send error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to WhatsApp API. Please check your internet connection.');
      }
      
      throw new Error(`Failed to send template: ${error.message}`);
    }
  }

  async sendMessage(phoneNumber: string, message: string) {
    const settings = databaseService.getSettings();
    
    if (!settings.accessToken || !settings.phoneNumberId) {
      throw new Error('WhatsApp Business API credentials not configured. Please set them in Settings.');
    }

    console.log('📤 Sending message via WhatsApp API:', { phoneNumber, message });

    // Format phone number (remove + and ensure it starts with country code)
    const formattedPhone = phoneNumber.replace(/\D/g, '');

    const messageData = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
      }
    };

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${settings.phoneNumberId}/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Message sent:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ Message send error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to WhatsApp API. Please check your internet connection.');
      }
      
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
}

export const whatsappService = new WhatsAppService();
