
import { databaseService } from './databaseService';
import { toast } from 'sonner';

class SettingsSyncService {
  // Simple status getter for basic app info
  getStatus() {
    return {
      lastSync: databaseService.getLastSyncTime()
    };
  }
}

export const settingsSyncService = new SettingsSyncService();
