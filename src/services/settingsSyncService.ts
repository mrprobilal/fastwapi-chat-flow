

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
        await this.performSync(false); // false = don't show toast for auto sync
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
    return await this.performSync(true); // true = show toast for manual sync
  }

  // Core sync logic used by both manual and auto sync
  private async performSync(showToast: boolean = false) {
    if (!this.isEnabled || !this.syncUrl) {
      throw new Error('Sync not configured');
    }

    try {
      console.log('Attempting to sync from:', this.syncUrl);
      
      const response = await fetch(this.syncUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        // Add timeout and other fetch options for better reliability
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Sync failed: HTTP ${response.status} - ${response.statusText}`);
      }

      const remoteSettings = await response.json();
      console.log('Received settings from fastwapi.com:', remoteSettings);
      
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
        if (showToast) {
          toast.success('Settings synchronized from fastwapi.com');
        }
        
        return true;
      } else {
        console.log('No settings changes detected');
        if (showToast) {
          toast.success('Settings are already up to date');
        }
        return false;
      }
    } catch (error: any) {
      console.error('Settings sync failed:', error);
      
      // Only show error toast for manual sync
      if (showToast) {
        if (error.name === 'AbortError') {
          toast.error('Sync timeout - please check your connection');
        } else if (error.message.includes('Failed to fetch')) {
          toast.error('Cannot connect to fastwapi.com - please check your sync URL');
        } else {
          toast.error(`Sync failed: ${error.message}`);
        }
      }
      
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

