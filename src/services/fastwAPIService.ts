import { toast } from 'sonner';
import { databaseService } from './databaseService';

class FastWAPIService {
  private getHeaders() {
    const settings = databaseService.getSettings();
    return {
      'Authorization': `Bearer ${settings.accessToken || ''}`,
      'Content-Type': 'application/json',
    };
  }

  private getBaseUrl() {
    const settings = databaseService.getSettings();
    return settings.backendUrl || 'https://fastwapi.com';
  }

  async testConnection() {
    console.log('🔍 Testing FastWAPI connection...');

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/getConversations/none?from=web_api`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ FastWAPI connection successful');
      return data;
    } catch (error: any) {
      console.error('❌ FastWAPI connection failed:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to FastWAPI. Please check your internet connection.');
      }
      
      throw new Error(`FastWAPI connection failed: ${error.message}`);
    }
  }

  async getConversations() {
    console.log('👥 Getting conversations from FastWAPI...');

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/getConversations/none?from=web_api`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Conversations received:', data);

      // Transform to our chat format
      const chats = data.conversations?.map((conv: any) => ({
        id: conv.phone || conv.id,
        name: conv.name || conv.phone || 'Unknown',
        phone: conv.phone,
        lastMessage: conv.last_message || '',
        time: conv.last_message_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: conv.unread_count || 0,
        avatar: (conv.name || conv.phone || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        online: false
      })) || [];

      return chats;
    } catch (error: any) {
      console.error('❌ Get conversations error:', error);
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  async getChatMessages(phone: string) {
    console.log('📜 Getting messages from FastWAPI for:', phone);

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/getMessages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          phone: phone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Messages received:', data);

      // Transform to our message format
      const messages = data.messages?.map((msg: any) => ({
        id: msg.id || Date.now() + Math.random(),
        from: msg.is_message_by_contact ? msg.phone : 'business',
        to: msg.is_message_by_contact ? 'business' : msg.phone,
        text: msg.value || msg.message || '',
        timestamp: msg.created_at || new Date().toISOString(),
        type: msg.is_message_by_contact ? 'received' : 'sent',
        status: 'delivered',
        contact_name: msg.contact_name || msg.phone
      })) || [];

      return messages;
    } catch (error: any) {
      console.error('❌ Get messages error:', error);
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  async sendMessage(phone: string, message: string) {
    console.log('📤 Sending message via FastWAPI:', { phone, message });

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/sendmessage`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          phone: phone,
          message: message
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Message sent via FastWAPI:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ FastWAPI message send error:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async getTemplates() {
    console.log('📋 Getting templates from FastWAPI...');

    try {
      // Use GET method instead of POST as the API expects GET
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/getTemplates`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Templates received:', data);

      // Transform to our template format
      const templates = data.templates?.map((template: any) => ({
        id: template.id || template.name,
        name: template.name,
        content: template.content || template.body || '',
        status: template.status || 'approved',
        category: template.category || 'general',
        language: template.language || 'en',
        variables: this.extractVariables(template.content || template.body || '')
      })) || [];

      return templates;
    } catch (error: any) {
      console.error('❌ Get templates error:', error);
      throw new Error(`Failed to get templates: ${error.message}`);
    }
  }

  async sendTemplate(phone: string, templateName: string, variables: Record<string, string> = {}) {
    console.log('📤 Sending template via FastWAPI:', { phone, templateName, variables });

    try {
      // Try the correct template sending endpoint
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/sendTemplateMessage`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          phone: phone,
          template_name: templateName,
          variables: variables
        })
      });

      if (!response.ok) {
        // If that doesn't work, try alternative endpoint
        const altResponse = await fetch(`${this.getBaseUrl()}/api/wpbox/template/send`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            phone: phone,
            template: templateName,
            parameters: variables
          })
        });

        if (!altResponse.ok) {
          const errorData = await altResponse.json();
          throw new Error(`HTTP ${altResponse.status}: ${errorData.message || altResponse.statusText}`);
        }

        const result = await altResponse.json();
        console.log('✅ Template sent via FastWAPI (alternative endpoint):', result);
        return result;
      }

      const result = await response.json();
      console.log('✅ Template sent via FastWAPI:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ FastWAPI template send error:', error);
      throw new Error(`Failed to send template: ${error.message}`);
    }
  }

  private extractVariables(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/\{\{(\d+|\w+)\}\}/g);
    return matches ? matches.map((match, index) => `variable_${index + 1}`) : [];
  }

  async syncAllData() {
    console.log('🔄 Starting FastWAPI data sync...');
    
    try {
      // Get conversations first
      const conversations = await this.getConversations();
      
      const allMessages = [];
      const allChats = [];
      
      // Get messages for each conversation
      for (const chat of conversations) {
        try {
          const messages = await this.getChatMessages(chat.phone);
          allMessages.push(...messages);
          
          // Update chat with latest message info
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const updatedChat = {
              ...chat,
              lastMessage: lastMessage.text.substring(0, 50) + (lastMessage.text.length > 50 ? '...' : ''),
              time: new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            allChats.push(updatedChat);
          } else {
            allChats.push(chat);
          }
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`Failed to fetch messages for ${chat.phone}:`, error);
          allChats.push(chat);
        }
      }
      
      // Save to localStorage
      if (allMessages.length > 0) {
        localStorage.setItem('whatsapp-messages', JSON.stringify(allMessages));
        console.log(`✅ Synced ${allMessages.length} messages via FastWAPI`);
      }
      
      if (allChats.length > 0) {
        localStorage.setItem('whatsapp-chats', JSON.stringify(allChats));
        console.log(`✅ Synced ${allChats.length} chats via FastWAPI`);
      }
      
      return { messages: allMessages, chats: allChats };
    } catch (error: any) {
      console.error('❌ FastWAPI sync error:', error);
      throw new Error(`Failed to sync from FastWAPI: ${error.message}`);
    }
  }
}

export const fastwAPIService = new FastWAPIService();
