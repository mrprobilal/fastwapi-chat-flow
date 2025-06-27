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

    console.log('👥 Syncing contacts from WhatsApp Business API...');

    try {
      // Get conversations (this gives us the contacts we've been chatting with)
      const response = await fetch(`https://graph.facebook.com/v18.0/${settings.phoneNumberId}/conversations?fields=id,updated_time,participants`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('👥 Conversations received:', data);

      const contacts = [];
      
      if (data.data && Array.isArray(data.data)) {
        for (const conversation of data.data) {
          if (conversation.participants && Array.isArray(conversation.participants)) {
            for (const participant of conversation.participants) {
              if (participant.phone_number) {
                const contact = {
                  id: participant.phone_number,
                  phone: participant.phone_number.startsWith('+') ? participant.phone_number : `+${participant.phone_number}`,
                  name: participant.name || participant.phone_number,
                  lastMessage: '',
                  time: new Date(conversation.updated_time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  unread: 0,
                  avatar: (participant.name || participant.phone_number).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                  online: false
                };
                contacts.push(contact);
              }
            }
          }
        }
      }

      // Save contacts to localStorage
      if (contacts.length > 0) {
        localStorage.setItem('whatsapp-contacts', JSON.stringify(contacts));
        console.log(`✅ Synced ${contacts.length} contacts`);
      }

      return contacts;
    } catch (error: any) {
      console.error('❌ Contact sync error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to WhatsApp API. Please check your internet connection.');
      }
      
      throw new Error(`Failed to sync contacts: ${error.message}`);
    }
  }

  async getMessageHistory(phoneNumber: string, limit = 50) {
    const settings = databaseService.getSettings();
    
    if (!settings.accessToken || !settings.phoneNumberId) {
      throw new Error('WhatsApp Business API credentials not configured. Please set them in Settings.');
    }

    console.log('📜 Fetching message history for:', phoneNumber);

    try {
      // Format phone number for API call
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      
      // Get messages from WhatsApp Business API
      const response = await fetch(`https://graph.facebook.com/v18.0/${settings.phoneNumberId}/messages?fields=id,from,to,type,timestamp,text,status&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('📜 Message history received:', data);

      const messages = [];
      
      if (data.data && Array.isArray(data.data)) {
        for (const msg of data.data) {
          // Filter messages for this specific phone number
          const msgPhone = msg.from?.replace(/\D/g, '') || msg.to?.replace(/\D/g, '');
          if (msgPhone === formattedPhone) {
            const message = {
              id: msg.id || (Date.now() + Math.random()),
              from: msg.from?.startsWith('+') ? msg.from : `+${msg.from}`,
              to: msg.to?.startsWith('+') ? msg.to : `+${msg.to}`,
              text: msg.text?.body || msg.text || '',
              timestamp: msg.timestamp || new Date().toISOString(),
              type: msg.from === settings.phoneNumberId ? 'sent' : 'received',
              status: msg.status || 'delivered'
            };
            messages.push(message);
          }
        }
      }

      // Sort messages by timestamp
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      console.log(`✅ Retrieved ${messages.length} messages for ${phoneNumber}`);
      return messages;
    } catch (error: any) {
      console.error('❌ Message history fetch error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to WhatsApp API. Please check your internet connection.');
      }
      
      throw new Error(`Failed to fetch message history: ${error.message}`);
    }
  }

  async syncAllMessageHistory() {
    console.log('🔄 Starting full message history sync...');
    
    try {
      // First sync contacts to get the list of people we've chatted with
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
          
          // Small delay to avoid rate limiting
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
