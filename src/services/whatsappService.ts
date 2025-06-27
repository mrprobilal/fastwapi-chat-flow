
import { toast } from 'sonner';
import { databaseService } from './databaseService';
import { fastwAPIService } from './fastwAPIService';

class WhatsAppService {
  async testConnection() {
    console.log('🔍 Testing FastWAPI connection...');
    
    try {
      await fastwAPIService.testConnection();
      console.log('✅ FastWAPI connection successful');
      return true;
    } catch (error: any) {
      console.error('❌ FastWAPI connection failed:', error);
      throw new Error(`FastWAPI connection failed: ${error.message}`);
    }
  }

  async syncContacts() {
    console.log('👥 Syncing contacts via FastWAPI...');
    
    try {
      const conversations = await fastwAPIService.getConversations();
      
      // Save contacts to localStorage
      localStorage.setItem('whatsapp-contacts', JSON.stringify(conversations));
      console.log(`✅ Synced ${conversations.length} contacts via FastWAPI`);

      return conversations;
    } catch (error: any) {
      console.error('❌ FastWAPI contact sync error:', error);
      throw new Error(`Failed to sync contacts via FastWAPI: ${error.message}`);
    }
  }

  async getMessageHistory(phoneNumber: string, limit = 50) {
    console.log('📜 Getting message history via FastWAPI for:', phoneNumber);

    try {
      const messages = await fastwAPIService.getChatMessages(phoneNumber);
      console.log(`✅ Retrieved ${messages.length} messages via FastWAPI for ${phoneNumber}`);
      return messages;
    } catch (error: any) {
      console.error('❌ FastWAPI message history fetch error:', error);
      throw new Error(`Failed to fetch message history via FastWAPI: ${error.message}`);
    }
  }

  async syncAllMessageHistory() {
    console.log('🔄 Starting full message history sync via FastWAPI...');
    
    try {
      const result = await fastwAPIService.syncAllData();
      console.log('✅ FastWAPI sync completed:', result);
      return result;
    } catch (error: any) {
      console.error('❌ FastWAPI full sync error:', error);
      throw new Error(`Failed to sync message history via FastWAPI: ${error.message}`);
    }
  }

  async syncTemplates() {
    console.log('🔄 Syncing templates from FastWAPI...');

    try {
      const templates = await fastwAPIService.getTemplates();
      
      // Save templates to localStorage
      localStorage.setItem('whatsapp-templates', JSON.stringify(templates));
      databaseService.setLastSyncTime(new Date());

      console.log(`✅ Synced ${templates.length} templates from FastWAPI`);
      return templates;
    } catch (error: any) {
      console.error('❌ Template sync error:', error);
      throw new Error(`Failed to sync templates: ${error.message}`);
    }
  }

  async sendTemplateMessage(templateName: string, phoneNumber: string, variables: Record<string, string> = {}) {
    console.log('📤 Sending template message via FastWAPI:', { templateName, phoneNumber, variables });

    try {
      const result = await fastwAPIService.sendTemplate(phoneNumber, templateName, variables);
      console.log('✅ Template message sent via FastWAPI:', result);
      return result;
    } catch (error: any) {
      console.error('❌ FastWAPI template send error:', error);
      throw new Error(`Failed to send template via FastWAPI: ${error.message}`);
    }
  }

  async sendMessage(phoneNumber: string, message: string) {
    console.log('📤 Sending message via FastWAPI:', { phoneNumber, message });

    try {
      const result = await fastwAPIService.sendMessage(phoneNumber, message);
      console.log('✅ Message sent via FastWAPI:', result);
      return result;
    } catch (error: any) {
      console.error('❌ FastWAPI message send error:', error);
      throw new Error(`Failed to send message via FastWAPI: ${error.message}`);
    }
  }
}

export const whatsappService = new WhatsAppService();
