
import { toast } from 'sonner';
import { databaseService } from './databaseService';

class FastWAPIService {
  private getHeaders() {
    const settings = databaseService.getSettings();
    const token = settings.backendToken || '';
    
    if (!token) {
      console.warn('⚠️ No FastWAPI backend token found in settings');
      throw new Error('No FastWAPI backend token configured. Please add your token in Settings.');
    }
    
    console.log('🔑 Using FastWAPI token:', token.substring(0, 10) + '...');
    
    return {
      'Authorization': `Bearer ${token}`,
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
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/getTemplates`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FastWAPI error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ FastWAPI connection successful');
      return data;
    } catch (error: any) {
      console.error('❌ FastWAPI connection failed:', error);
      throw new Error(`FastWAPI connection failed: ${error.message}`);
    }
  }

  async getTemplates() {
    console.log('📋 Getting templates from FastWAPI...');

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/getTemplates`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get templates error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Templates received:', data);

      // Check if response indicates error
      if (data.status === 'error') {
        throw new Error(data.message || 'Unknown error from FastWAPI');
      }

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
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/sendTemplate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          phone: phone,
          template_name: templateName,
          variables: variables
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Send template error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Template sent via FastWAPI:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ FastWAPI template send error:', error);
      throw new Error(`Failed to send template: ${error.message}`);
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
        const errorText = await response.text();
        console.error('Send message error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Message sent via FastWAPI:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ FastWAPI message send error:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async getConversations() {
    console.log('💬 Getting conversations from FastWAPI...');

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/getConversations/none?from=web_api`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get conversations error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Conversations received:', data);

      // Transform to our chat format
      const conversations = data.conversations?.map((conv: any) => ({
        id: conv.phone || conv.id,
        name: conv.name || conv.phone,
        phone: conv.phone,
        lastMessage: conv.lastMessage || '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        avatar: (conv.name || conv.phone).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        online: false
      })) || [];

      return conversations;
    } catch (error: any) {
      console.error('❌ Get conversations error:', error);
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  async getChatMessages(phoneNumber: string) {
    console.log('📨 Getting chat messages from FastWAPI for:', phoneNumber);

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/wpbox/getMessages/${phoneNumber}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get messages error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Messages received:', data);

      // Transform to our message format
      const messages = data.messages?.map((msg: any) => ({
        id: msg.id || Date.now() + Math.random(),
        from: msg.from || phoneNumber,
        to: msg.to || 'business',
        text: msg.text || msg.message || '',
        timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
        type: msg.type || 'received',
        status: msg.status || 'delivered'
      })) || [];

      return messages;
    } catch (error: any) {
      console.error('❌ Get messages error:', error);
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  async syncAllData() {
    console.log('🔄 Syncing all data from FastWAPI...');

    try {
      const [conversations, templates] = await Promise.all([
        this.getConversations(),
        this.getTemplates()
      ]);

      // Get messages for each conversation
      const messagesPromises = conversations.map((conv: any) => 
        this.getChatMessages(conv.phone).catch(() => [])
      );
      const allMessages = await Promise.all(messagesPromises);
      const flatMessages = allMessages.flat();

      console.log('✅ All data synced from FastWAPI');
      return {
        messages: flatMessages,
        chats: conversations,
        templates: templates
      };
    } catch (error: any) {
      console.error('❌ Sync all data error:', error);
      throw new Error(`Failed to sync all data: ${error.message}`);
    }
  }

  private extractVariables(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/\{\{(\d+|\w+)\}\}/g);
    return matches ? matches.map((match, index) => `variable_${index + 1}`) : [];
  }
}

export const fastwAPIService = new FastWAPIService();
