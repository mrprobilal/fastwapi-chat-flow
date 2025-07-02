
class CreativePixelsService {
  private baseUrl = 'https://creativepixels.site/api';
  private vendorUid = 'a5944265-83b2-4372-a6cf-01778281189b';

  private getAuthToken(): string {
    return localStorage.getItem('token') || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();
    const url = `${this.baseUrl}/${this.vendorUid}/${endpoint}?token=${token}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`HTTP ${response.status}: Service returned HTML instead of JSON. Check if the endpoint exists.`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Creative Pixels API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication with API token
  async loginWithToken(apiToken: string) {
    try {
      console.log('Authenticating with Creative Pixels API token...');
      
      // Store the token temporarily to test it
      localStorage.setItem('token', apiToken);
      
      // Test the token by making a simple request
      const response = await this.makeRequest('contact/conversations');
      
      console.log('Token validation successful:', response);
      return {
        status: true,
        token: apiToken,
        message: 'Authentication successful'
      };
    } catch (error) {
      // Remove invalid token
      localStorage.removeItem('token');
      console.error('Token validation failed:', error);
      throw new Error('Invalid API token. Please check your token and try again.');
    }
  }

  // WhatsApp messaging integration
  async sendWhatsAppMessage(phoneNumber: string, message: string) {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/${this.vendorUid}/contact/send-message?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: phoneNumber,
          message: message
        }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`SendMessage endpoint returned HTML (status ${response.status}). The API endpoint may not exist.`);
      }

      if (!response.ok) {
        throw new Error(`Failed to send message with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Message sent via Creative Pixels API:', data);
      return data;
    } catch (error) {
      console.error('Error sending WhatsApp message via Creative Pixels API:', error);
      throw error;
    }
  }

  async getWhatsAppChatHistory(contactId: string) {
    try {
      const response = await this.makeRequest(`contact/chat/${contactId}`);
      console.log('Chat history fetched from Creative Pixels API:', response);
      return response;
    } catch (error) {
      console.error('Error fetching chat history from Creative Pixels API:', error);
      throw error;
    }
  }

  async getWhatsAppMessages() {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/${this.vendorUid}/contact/messages?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`GetMessages endpoint returned HTML (status ${response.status}). The API endpoint may not exist.`);
      }

      if (!response.ok) {
        throw new Error(`Failed to get messages with status ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching WhatsApp messages from Creative Pixels API:', error);
      throw error;
    }
  }

  async getWhatsAppConversations() {
    try {
      const token = this.getAuthToken();
      console.log('Using token for conversations:', token ? 'Token present' : 'No token');
      
      const response = await fetch(`${this.baseUrl}/${this.vendorUid}/contact/conversations?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`GetConversations endpoint returned HTML (status ${response.status}). The API endpoint may not exist.`);
      }

      if (!response.ok) {
        throw new Error(`Failed to get conversations with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Conversations fetched from Creative Pixels API:', data);
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Unknown error from conversations API');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching WhatsApp conversations from Creative Pixels API:', error);
      throw error;
    }
  }

  async getWhatsAppTemplates() {
    try {
      return this.makeRequest('contact/templates');
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      throw error;
    }
  }
}

export const creativepixelsService = new CreativePixelsService();
