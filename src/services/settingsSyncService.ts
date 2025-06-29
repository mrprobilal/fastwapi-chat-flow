
import { databaseService } from './databaseService';
import { toast } from 'sonner';

class SettingsSyncService {
  private webhookEndpoint = '/api/sync-settings';

  // Webhook handler for receiving settings from your website
  async handleWebhookSync(settings: any) {
    try {
      console.log('Received webhook sync:', settings);
      
      // Validate required fields
      if (!settings.accessToken || !settings.businessId || !settings.phoneNumberId) {
        throw new Error('Missing required WhatsApp API settings');
      }

      // Check if settings have changed
      const currentSettings = databaseService.getSettings();
      const hasChanges = this.hasSettingsChanged(currentSettings, settings);
      
      if (hasChanges) {
        // Merge with existing settings
        const mergedSettings = {
          ...currentSettings,
          ...settings,
          lastSyncTime: new Date().toISOString()
        };

        // Save updated settings
        await databaseService.saveSettings(mergedSettings);
        
        console.log('Settings synced via webhook:', settings);
        toast.success('WhatsApp settings synchronized from your website');
        
        return { success: true, message: 'Settings synchronized successfully' };
      } else {
        console.log('No settings changes detected');
        return { success: true, message: 'Settings are already up to date' };
      }
    } catch (error: any) {
      console.error('Webhook sync failed:', error);
      toast.error(`Sync failed: ${error.message}`);
      throw error;
    }
  }

  // Check if settings have changed
  private hasSettingsChanged(current: any, remote: any) {
    if (!current) return true;
    
    const keysToCheck = ['accessToken', 'businessId', 'phoneNumberId'];
    
    return keysToCheck.some(key => current[key] !== remote[key]);
  }

  // Get webhook endpoint URL
  getWebhookUrl() {
    return `${window.location.origin}${this.webhookEndpoint}`;
  }

  // Get status
  getStatus() {
    return {
      webhookUrl: this.getWebhookUrl(),
      lastSync: databaseService.getLastSyncTime()
    };
  }
}

export const settingsSyncService = new SettingsSyncService();
