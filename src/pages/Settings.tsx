
import React, { useState, useEffect } from 'react';
import { Save, TestTube, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { whatsappService } from '../services/whatsappService';
import { databaseService } from '../services/databaseService';
import { Input } from '../components/ui/input';

const Settings = () => {
  const [settings, setSettings] = useState({
    backendUrl: '',
    backendToken: '',
  });

  const [connectionStatus, setConnectionStatus] = useState({
    fastwapi: false
  });

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        await databaseService.initializeSettings();
        const initialSettings = databaseService.getSettings();
        if (initialSettings) {
          console.log('🔧 Loading initial settings');
          setSettings({
            backendUrl: initialSettings.backendUrl || '',
            backendToken: initialSettings.backendToken || '',
          });
          
          // Check FastWAPI connection if token exists
          if (initialSettings.backendToken) {
            setConnectionStatus(prev => ({ ...prev, fastwapi: true }));
          }
        }
      } catch (error) {
        console.error('❌ Error loading settings:', error);
        toast.error('Failed to load settings');
      }
    };

    loadInitialSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required settings
      if (!settings.backendToken.trim()) {
        toast.error('Backend token is required');
        return;
      }
      
      // Save settings
      const fullSettings = {
        ...settings,
        // Set default URL if not provided
        backendUrl: settings.backendUrl || 'https://fastwapi.com'
      };
      
      await databaseService.saveSettings(fullSettings);
      
      // Update connection status
      setConnectionStatus(prev => ({
        ...prev,
        fastwapi: !!(fullSettings.backendToken)
      }));
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const syncTemplates = async () => {
    setSyncing(true);
    try {
      // First save current settings
      await handleSave();
      
      // Then sync templates
      const templates = await whatsappService.syncTemplates();
      
      toast.success(`✅ Synced ${templates?.length || 0} templates`);
    } catch (error: any) {
      console.error('❌ Template sync failed:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const clearField = (fieldName: string) => {
    setSettings(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your FastWAPI backend connection</p>
      </div>

      <div className="space-y-6">
        {/* FastWAPI Backend Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">FastWAPI Backend</h3>
            <div className="text-sm text-gray-500">
              Status: {connectionStatus.fastwapi ? (
                <span className="text-green-600 font-medium">Connected</span>
              ) : (
                <span className="text-red-600 font-medium">Not Connected</span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Backend URL</label>
              <div className="relative">
                <Input
                  type="text"
                  name="backendUrl"
                  value={settings.backendUrl}
                  onChange={handleInputChange}
                  placeholder="https://fastwapi.com"
                  className="w-full pr-8"
                />
                {settings.backendUrl && (
                  <button
                    type="button"
                    onClick={() => clearField('backendUrl')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backend Token <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="password"
                  name="backendToken"
                  value={settings.backendToken}
                  onChange={handleInputChange}
                  placeholder="Your FastWAPI authentication token"
                  className="w-full pr-8"
                />
                {settings.backendToken && (
                  <button
                    type="button"
                    onClick={() => clearField('backendToken')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Required for all FastWAPI operations
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            
            <button
              onClick={syncTemplates}
              disabled={syncing || !settings.backendToken}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Templates'}
            </button>
          </div>
          
          {!settings.backendToken && (
            <p className="text-amber-600 text-sm mt-2 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Backend token is required for all operations
            </p>
          )}
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h3>
          <div className={`p-4 rounded-lg border ${connectionStatus.fastwapi ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              {connectionStatus.fastwapi ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${connectionStatus.fastwapi ? 'text-green-800' : 'text-red-800'}`}>FastWAPI</span>
            </div>
            <p className={`text-xs mt-1 ${connectionStatus.fastwapi ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus.fastwapi ? 'Token configured' : 'No token configured'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
