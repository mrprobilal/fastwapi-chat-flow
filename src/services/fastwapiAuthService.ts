
import { toast } from 'sonner';
import { databaseService } from './databaseService';

interface LoginResponse {
  status: boolean;
  token?: string;
  id?: number;
  name?: string;
  email?: string;
  errMsg?: string;
}

class FastWAPIAuthService {
  private getBaseUrl() {
    const settings = databaseService.getSettings();
    return settings.backendUrl || 'https://fastwapi.com';
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    console.log('🔑 Logging into FastWAPI...');

    try {
      const response = await fetch(`${this.getBaseUrl()}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LoginResponse = await response.json();
      
      if (data.status && data.token) {
        // Save the FastWAPI token as the access token
        const currentSettings = databaseService.getSettings();
        const updatedSettings = {
          ...currentSettings,
          accessToken: data.token,
          backendToken: data.token
        };
        databaseService.saveSettings(updatedSettings);
        
        console.log('✅ FastWAPI login successful');
        toast.success(`Welcome ${data.name}! FastWAPI authentication successful.`);
      } else {
        console.error('❌ FastWAPI login failed:', data.errMsg);
        toast.error(`Login failed: ${data.errMsg}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ FastWAPI login error:', error);
      toast.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  isLoggedIn(): boolean {
    const settings = databaseService.getSettings();
    return !!(settings.accessToken || settings.backendToken);
  }

  logout() {
    const currentSettings = databaseService.getSettings();
    const updatedSettings = {
      ...currentSettings,
      accessToken: '',
      backendToken: ''
    };
    databaseService.saveSettings(updatedSettings);
    toast.success('Logged out successfully');
  }
}

export const fastwapiAuthService = new FastWAPIAuthService();
