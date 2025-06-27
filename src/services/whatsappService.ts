
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
