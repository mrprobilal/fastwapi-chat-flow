
import { databaseService } from './databaseService';
import { toast } from 'sonner';

class SettingsSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isEnabled = false;
  private syncUrl = '';
  private apiKey = '';

  // Configure sync with your fastwapi.com endpoint
  configure(syncUrl: string, apiKey: string) {
    this.syncUrl = syncUrl;
    this.apiKey = apiKey;
    this.isEnabled = true;
    
    // Save sync configuration
    localStorage.setItem('sync-config', JSON.stringify({
      syncUrl,
      apiKey,
      enabled: true
    }));
    
    console.log('Settings sync configured:', { syncUrl, hasApiKey: !!apiKey });
  }

  // Load sync configuration from storage
  loadConfiguration() {
    try {
      const config = localStorage.getItem('sync-config');
      if (config) {
        const parsed = JSON.parse(config);
        this.syncUrl = parsed.syncUrl || '';
        this.apiKey = parsed.apiKey || '';
        this.isEnabled = parsed.enabled || false;
        return true;
      }
    } catch (error) {
      console.error('Failed to load sync configuration:', error);
    }
    return false;
  }

  // Start automatic sync (checks every 30 seconds)
  startAutoSync() {
    if (!this.isEnabled || !this.syncUrl) {
      console.log('Auto sync not started - not configured');
      return;
    }

    // Clear existing interval
    this.stopAutoSync();

    // Start new interval
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncSettings();
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, 30000); // Check every 30 seconds

    console.log('Auto sync started - checking every 30 seconds');
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Manually sync settings from fastwapi.com
  async syncSettings() {
    if (!this.isEnabled || !this.syncUrl) {
      throw new Error('Sync not configured');
    }

    try {
      const response = await fetch(this.syncUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Sync failed: HTTP ${response.status}`);
      }

      const remoteSettings = await response.json();
      
      // Check if settings have changed
      const currentSettings = databaseService.getSettings();
      const hasChanges = this.hasSettingsChanged(currentSettings, remoteSettings);
      
      if (hasChanges) {
        // Merge with existing settings
        const mergedSettings = {
          ...currentSettings,
          ...remoteSettings,
          lastSyncTime: new Date().toISOString()
        };

        // Save updated settings
        await databaseService.saveSettings(mergedSettings);
        
        console.log('Settings synced from fastwapi.com:', remoteSettings);
        toast.success('Settings synchronized from fastwapi.com');
        
        return true;
      } else {
        console.log('No settings changes detected');
        return false;
      }
    } catch (error) {
      console.error('Settings sync failed:', error);
      throw error;
    }
  }

  // Check if settings have changed
  private hasSettingsChanged(current: any, remote: any) {
    if (!current) return true;
    
    const keysToCheck = ['accessToken', 'businessId', 'phoneNumberId'];
    
    return keysToCheck.some(key => current[key] !== remote[key]);
  }

  // Get sync status
  getStatus() {
    return {
      enabled: this.isEnabled,
      configured: !!(this.syncUrl && this.apiKey),
      running: !!this.syncInterval,
      syncUrl: this.syncUrl
    };
  }

  // Disable sync
  disable() {
    this.stopAutoSync();
    this.isEnabled = false;
    
    // Update stored config
    const config = JSON.parse(localStorage.getItem('sync-config') || '{}');
    config.enabled = false;
    localStorage.setItem('sync-config', JSON.stringify(config));
  }
}

export const settingsSyncService = new SettingsSyncService();
