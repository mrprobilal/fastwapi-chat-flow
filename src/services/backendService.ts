
import { toast } from 'sonner';
import { databaseService } from './databaseService';

class BackendService {
  private getBackendUrl(): string {
    const settings = databaseService.getSettings();
    return settings?.backendUrl || '';
  }

  async syncTemplates() {
    const backendUrl = this.getBackendUrl();
    
    if (!backendUrl) {
      throw new Error('Backend URL not configured. Please set it in Settings.');
    }

    console.log('🔄 Syncing templates from backend:', backendUrl);

    try {
      const response = await fetch(`${backendUrl}/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 Templates received from backend:', data);

      // Transform backend data to our template format if needed
      const templates = Array.isArray(data) ? data : data.templates || [];
      
      // Ensure each template has required fields
      const formattedTemplates = templates.map((template, index) => ({
        id: template.id || `template_${index}`,
        name: template.name || `Template ${index + 1}`,
        content: template.content || template.body || template.text || '',
        status: template.status || 'APPROVED',
        category: template.category || 'MARKETING',
        variables: template.variables || []
      }));

      return formattedTemplates;
    } catch (error: any) {
      console.error('❌ Template sync error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend. Please check your backend URL and ensure the server is running.');
      }
      
      throw new Error(`Failed to sync templates: ${error.message}`);
    }
  }

  async sendTemplateMessage(templateId: string, phoneNumber: string, variables: Record<string, string> = {}) {
    const backendUrl = this.getBackendUrl();
    
    if (!backendUrl) {
      throw new Error('Backend URL not configured. Please set it in Settings.');
    }

    console.log('📤 Sending template message via backend:', { templateId, phoneNumber, variables });

    try {
      const response = await fetch(`${backendUrl}/send-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          phone_number: phoneNumber,
          variables: variables
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Template message sent:', result);
      
      return result;
    } catch (error: any) {
      console.error('❌ Template send error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend. Please check your backend URL and ensure the server is running.');
      }
      
      throw new Error(`Failed to send template: ${error.message}`);
    }
  }
}

export const backendService = new BackendService();
