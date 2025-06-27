
import { toast } from 'sonner';

// Database service for settings and data management
class DatabaseService {
  private settings: any = null;
  private settingsCallbacks: Array<(settings: any) => void> = [];

  async initializeSettings() {
    try {
      // Load from localStorage as fallback
      const localSettings = localStorage.getItem('fastwapi-settings');
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
      // Save to localStorage (will be replaced with Supabase later)
      localStorage.setItem('fastwapi-settings', JSON.stringify(newSettings));
      this.settings = newSettings;
      this.notifySettingsChange();
      
      // TODO: Save to Supabase database when connected
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
    
    // Return cleanup function
    return () => {
      this.settingsCallbacks = this.settingsCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifySettingsChange() {
    this.settingsCallbacks.forEach(callback => {
      callback(this.settings);
    });
  }
}

export const databaseService = new DatabaseService();
