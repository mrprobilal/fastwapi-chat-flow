class FastWAPIService {
  private baseUrl = 'https://fastwapi.com/api/v2';

  private getAuthToken(): string {
    return localStorage.getItem('token') || '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();
    const url = `${this.baseUrl}/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${token}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`HTTP ${response.status}: Service returned HTML instead of JSON. Check if the endpoint exists.`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`FastWAPI request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication
  async loginUser(email: string, password: string) {
    try {
      console.log('Making login request to FastWAPI...');
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', response.headers.get('content-type'));

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Login endpoint returned HTML (status ${response.status}). The API endpoint may not exist or be configured correctly.`);
      }

      if (!response.ok) {
        throw new Error(`Login failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Login response data:', data);
      return data;
    } catch (error) {
      console.error('Login request error:', error);
      throw error;
    }
  }

  async registerUser(userData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/client/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Register endpoint returned HTML (status ${response.status}). The API endpoint may not exist.`);
      }

      if (!response.ok) {
        throw new Error(`Registration failed with status ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Registration request error:', error);
      throw error;
    }
  }

  // Common APIs
  async getNotifications() {
    return this.makeRequest('common/notifications');
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.makeRequest('common/order/update-status', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, status }),
    });
  }

  async deactivateUser() {
    return this.makeRequest('common/user/deactivate', {
      method: 'POST',
    });
  }

  // Driver APIs
  async getDriverStatus() {
    return this.makeRequest('driver/status');
  }

  async setActiveStatus(active: boolean) {
    return this.makeRequest('driver/status/set-active', {
      method: 'POST',
      body: JSON.stringify({ active }),
    });
  }

  async getDriverOrders() {
    return this.makeRequest('driver/orders');
  }

  async getDriverOrdersWithLatLng() {
    return this.makeRequest('driver/orders-with-location');
  }

  async getDriverEarnings() {
    return this.makeRequest('driver/earnings');
  }

  async updateDriverLocation(latitude: number, longitude: number) {
    return this.makeRequest('driver/location/update', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  // WhatsApp messaging integration using correct endpoints
  async sendWhatsAppMessage(phoneNumber: string, message: string) {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/api/wpbox/sendmessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_token: token,
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
      console.log('Message sent via FastWAPI:', data);
      return data;
    } catch (error) {
      console.error('Error sending WhatsApp message via FastWAPI:', error);
      throw error;
    }
  }

  async getWhatsAppChatHistory(contactId: string) {
    try {
      const response = await this.makeRequest(`api/wpbox/chat/${contactId}`);
      console.log('Chat history fetched from FastWAPI:', response);
      return response;
    } catch (error) {
      console.error('Error fetching chat history from FastWAPI:', error);
      throw error;
    }
  }

  async getWhatsAppMessages() {
    try {
      const token = this.getAuthToken();
      const response = await fetch(`${this.baseUrl}/api/wpbox/getMessages?api_token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
      console.error('Error fetching WhatsApp messages from FastWAPI:', error);
      throw error;
    }
  }

  async getWhatsAppConversations() {
    try {
      const token = this.getAuthToken();
      console.log('Using token for conversations:', token ? 'Token present' : 'No token');
      
      const response = await fetch(`${this.baseUrl}/api/wpbox/getConversations/none?api_token=${token}&from=mobile_api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      console.log('Conversations fetched from FastWAPI:', data);
      
      // Check if the response indicates an error
      if (data.status === 'error') {
        throw new Error(data.message || 'Unknown error from conversations API');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching WhatsApp conversations from FastWAPI:', error);
      throw error;
    }
  }

  async getWhatsAppTemplates() {
    try {
      return this.makeRequest('whatsapp/templates');
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error);
      throw error;
    }
  }
}

export const fastwapiService = new FastWAPIService();
