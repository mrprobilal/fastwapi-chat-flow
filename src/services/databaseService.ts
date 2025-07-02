
import { toast } from 'sonner';

class DatabaseService {
  private settings: any = null;
  private settingsCallbacks: Array<(settings: any) => void> = [];

  async initializeSettings() {
    try {
      const localSettings = localStorage.getItem('creativepixels-settings');
      if (localSettings) {
        this.settings = JSON.parse(localSettings);
        this.notifySettingsChange();
      }
    } catch (error) {
      console.error('Failed to initialize settings:', error);
    }
  }

  async saveSettings(newSettings: any) {
    try {
      localStorage.setItem('creativepixels-settings', JSON.stringify(newSettings));
      this.settings = newSettings;
      this.notifySettingsChange();
      
      console.log('Settings saved:', newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  getSettings() {
    return this.settings;
  }

  onSettingsChange(callback: (settings: any) => void) {
    this.settingsCallbacks.push(callback);
    
    return () => {
      this.settingsCallbacks = this.settingsCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifySettingsChange() {
    this.settingsCallbacks.forEach(callback => {
      callback(this.settings);
    });
  }

  getLastSyncTime() {
    return this.settings?.lastSyncTime || null;
  }

  isSynced() {
    return !!(this.settings?.lastSyncTime);
  }
}

export const databaseService = new DatabaseService();
