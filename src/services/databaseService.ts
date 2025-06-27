
class DatabaseService {
  private settings: any = null;
  private settingsChangeListeners: ((settings: any) => void)[] = [];

  initializeSettings() {
    try {
      const savedSettings = localStorage.getItem('whatsapp-settings');
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings);
        console.log('📂 Settings loaded from localStorage');
      } else {
        // Initialize with default settings
        this.settings = {
          accessToken: '',
          businessId: '',
          phoneNumberId: '',
          webhookVerifyToken: '',
          backendUrl: '',
          pusherAppId: '',
          pusherKey: '',
          pusherSecret: '',
          pusherCluster: 'us2'
        };
        this.saveSettings();
        console.log('✨ Default settings created');
      }
    } catch (error) {
      console.error('❌ Error initializing settings:', error);
      this.settings = {
        accessToken: '',
        businessId: '',
        phoneNumberId: '',
        webhookVerifyToken: '',
        backendUrl: '',
        pusherAppId: '',
        pusherKey: '',
        pusherSecret: '',
        pusherCluster: 'us2'
      };
    }
  }

  getSettings() {
    if (!this.settings) {
      this.initializeSettings();
    }
    return this.settings;
  }

  updateSettings(newSettings: any) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.notifySettingsChange();
    console.log('💾 Settings updated');
  }

  saveSettings(newSettings?: any) {
    if (newSettings) {
      this.settings = { ...this.settings, ...newSettings };
    }
    try {
      localStorage.setItem('whatsapp-settings', JSON.stringify(this.settings));
      this.notifySettingsChange();
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  }

  onSettingsChange(callback: (settings: any) => void) {
    this.settingsChangeListeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.settingsChangeListeners = this.settingsChangeListeners.filter(
        listener => listener !== callback
      );
    };
  }

  private notifySettingsChange() {
    this.settingsChangeListeners.forEach(listener => {
      listener(this.settings);
    });
  }

  getLastSyncTime() {
    try {
      const syncTime = localStorage.getItem('whatsapp-last-sync');
      return syncTime ? new Date(syncTime) : null;
    } catch (error) {
      console.error('❌ Error getting last sync time:', error);
      return null;
    }
  }

  setLastSyncTime(time: Date) {
    try {
      localStorage.setItem('whatsapp-last-sync', time.toISOString());
    } catch (error) {
      console.error('❌ Error setting last sync time:', error);
    }
  }

  // Customer management methods
  getCustomers() {
    try {
      const customers = localStorage.getItem('whatsapp-customers');
      return customers ? JSON.parse(customers) : [];
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      return [];
    }
  }

  saveCustomer(customer: any) {
    try {
      const customers = this.getCustomers();
      const existingIndex = customers.findIndex((c: any) => c.phone === customer.phone);
      
      if (existingIndex >= 0) {
        customers[existingIndex] = { ...customers[existingIndex], ...customer };
      } else {
        customers.push({
          id: Date.now(),
          ...customer,
          createdAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem('whatsapp-customers', JSON.stringify(customers));
      console.log('💾 Customer saved:', customer.name);
    } catch (error) {
      console.error('❌ Error saving customer:', error);
    }
  }

  deleteCustomer(customerId: number) {
    try {
      const customers = this.getCustomers();
      const filtered = customers.filter((c: any) => c.id !== customerId);
      localStorage.setItem('whatsapp-customers', JSON.stringify(filtered));
      console.log('🗑️ Customer deleted:', customerId);
    } catch (error) {
      console.error('❌ Error deleting customer:', error);
    }
  }
}

export const databaseService = new DatabaseService();
