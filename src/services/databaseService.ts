export interface BusinessSettings {
  pusherKey: string;
  pusherSecret: string;
  pusherAppId: string;
  pusherCluster: string;
  accessToken: string;
  businessId: string;
  phoneNumberId: string;
  backendUrl: string;
  backendToken: string;
}

class DatabaseService {
  private storageKey = 'whatsapp-business-settings';

  getSettings(): BusinessSettings {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          // Set default Pusher values
          pusherKey: parsed.pusherKey || '490510485d3b7c3874d4',
          pusherSecret: parsed.pusherSecret || 'bdafa26e3b3d42f53d5c',
          pusherAppId: parsed.pusherAppId || '2012752',
          pusherCluster: parsed.pusherCluster || 'ap4',
          // Keep existing WhatsApp API settings
          accessToken: parsed.accessToken || '',
          businessId: parsed.businessId || '',
          phoneNumberId: parsed.phoneNumberId || '',
          // Keep existing backend settings
          backendUrl: parsed.backendUrl || '',
          backendToken: parsed.backendToken || ''
        };
      }
      // Return default settings with Pusher configuration
      return {
        pusherKey: '490510485d3b7c3874d4',
        pusherSecret: 'bdafa26e3b3d42f53d5c',
        pusherAppId: '2012752',
        pusherCluster: 'ap4',
        accessToken: '',
        businessId: '',
        phoneNumberId: '',
        backendUrl: '',
        backendToken: ''
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        pusherKey: '490510485d3b7c3874d4',
        pusherSecret: 'bdafa26e3b3d42f53d5c',
        pusherAppId: '2012752',
        pusherCluster: 'ap4',
        accessToken: '',
        businessId: '',
        phoneNumberId: '',
        backendUrl: '',
        backendToken: ''
      };
    }
  }

  saveSettings(settings: BusinessSettings): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  getLastSyncTime(): Date | null {
    try {
      const stored = localStorage.getItem('last-sync-time');
      return stored ? new Date(stored) : null;
    } catch (error) {
      console.error('Error loading last sync time:', error);
      return null;
    }
  }

  setLastSyncTime(date: Date): void {
    try {
      localStorage.setItem('last-sync-time', date.toISOString());
    } catch (error) {
      console.error('Error saving last sync time:', error);
    }
  }
}

export const databaseService = new DatabaseService();
