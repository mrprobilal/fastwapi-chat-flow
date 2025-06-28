
import React, { useState, useEffect } from 'react';
import { Save, TestTube, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { pusherService } from '../services/pusherService';
import { whatsappService } from '../services/whatsappService';
import { databaseService } from '../services/databaseService';
import TestMessage from '../components/TestMessage';
import { Input } from '../components/ui/input';

const Settings = () => {
  const [settings, setSettings] = useState({
    accessToken: '',
    businessId: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    backendUrl: '',
    backendToken: '',
    pusherAppId: '2012752',
    pusherKey: '490510485d3b7c3874d4',
    pusherSecret: 'bdafa26e3b3d42f53d5c',
    pusherCluster: 'ap4',
  });

  const [connectionStatus, setConnectionStatus] = useState({
    pusher: false,
    whatsapp: false,
    fastwapi: false
  });

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadInitialSettings = async () => {
      await databaseService.initializeSettings();
      const initialSettings = databaseService.getSettings();
      if (initialSettings) {
        console.log('🔧 Loading initial settings:', initialSettings);
        setSettings(initialSettings);
      }
    };

    loadInitialSettings();

    // Check connections periodically
    const checkConnections = () => {
      setConnectionStatus(prev => ({
        ...prev,
        pusher: pusherService.isConnected(),
        fastwapi: !!(settings.backendToken)
      }));
    };

    const connectionInterval = setInterval(checkConnections, 2000);
    return () => clearInterval(connectionInterval);
  }, [settings.backendToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`🔧 Input change: ${name} = ${value}`);
    setSettings(prev => {
      const updated = { ...prev, [name]: value };
      console.log('🔧 Updated settings state:', updated);
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving settings:', settings);
      await databaseService.saveSettings(settings);
      
      // Verify settings were saved
      const savedSettings = databaseService.getSettings();
      console.log('✅ Verified saved settings:', savedSettings);
      
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testPusherConnection = () => {
    try {
      pusherService.connect(settings.pusherKey, settings.pusherCluster);
      toast.success('Pusher connection test initiated!');
    } catch (error) {
      console.error('Pusher test error:', error);
      toast.error('Failed to connect to Pusher');
    }
  };

  const testWhatsAppConnection = async () => {
    try {
      await whatsappService.testConnection();
      setConnectionStatus(prev => ({ ...prev, whatsapp: true }));
      toast.success('WhatsApp Business API connection successful!');
    } catch (error: any) {
      console.error('WhatsApp test error:', error);
      setConnectionStatus(prev => ({ ...prev, whatsapp: false }));
      toast.error(`WhatsApp API connection failed: ${error.message}`);
    }
  };

  const syncContactsAndMessages = async () => {
    setSyncing(true);
    try {
      console.log('🔄 Starting manual sync from Settings...');
      
      // First save current settings to ensure backend token is available
      await databaseService.saveSettings(settings);
      
      // Sync contacts and message history
      const { messages, chats } = await whatsappService.syncAllMessageHistory();
      
      toast.success(`✅ Synced ${messages?.length || 0} messages and ${chats?.length || 0} contacts`);
    } catch (error: any) {
      console.error('❌ Manual sync failed:', error);
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleTestMessage = (data: any) => {
    console.log('🧪 Test message received in Settings:', data);
    toast.success('Test message sent successfully!');
  };

  const clearField = (fieldName: string) => {
    console.log(`🧹 Clearing field: ${fieldName}`);
    setSettings(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your FastWAPI backend and WhatsApp Business API settings</p>
      </div>

      <div className="space-y-6">
        {/* FastWAPI Backend Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">FastWAPI Backend</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Backend Token</label>
              <div className="relative">
                <Input
                  type="text"
                  name="backendToken"
                  value={settings.backendToken}
                  onChange={handleInputChange}
                  placeholder="Your FastWAPI token"
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
            </div>
          </div>
        </div>

        {/* WhatsApp Business API Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Business API</h3>
            <div className="flex gap-2">
              <button
                onClick={testWhatsAppConnection}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <TestTube className="h-4 w-4" />
                Test WhatsApp API
              </button>
              <button
                onClick={syncContactsAndMessages}
                disabled={syncing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Contacts & Messages'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
              <div className="relative">
                <Input
                  type="text"
                  name="accessToken"
                  value={settings.accessToken}
                  onChange={handleInputChange}
                  placeholder="WhatsApp Business API Access Token"
                  className="w-full pr-8"
                />
                {settings.accessToken && (
                  <button
                    type="button"
                    onClick={() => clearField('accessToken')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business ID</label>
              <div className="relative">
                <Input
                  type="text"
                  name="businessId"
                  value={settings.businessId}
                  onChange={handleInputChange}
                  placeholder="WhatsApp Business Account ID"
                  className="w-full pr-8"
                />
                {settings.businessId && (
                  <button
                    type="button"
                    onClick={() => clearField('businessId')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
              <div className="relative">
                <Input
                  type="text"
                  name="phoneNumberId"
                  value={settings.phoneNumberId}
                  onChange={handleInputChange}
                  placeholder="WhatsApp Business Phone Number ID"
                  className="w-full pr-8"
                />
                {settings.phoneNumberId && (
                  <button
                    type="button"
                    onClick={() => clearField('phoneNumberId')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Verify Token</label>
              <div className="relative">
                <Input
                  type="text"
                  name="webhookVerifyToken"
                  value={settings.webhookVerifyToken}
                  onChange={handleInputChange}
                  placeholder="Webhook verification token"
                  className="w-full pr-8"
                />
                {settings.webhookVerifyToken && (
                  <button
                    type="button"
                    onClick={() => clearField('webhookVerifyToken')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className={`p-4 rounded-lg border ${connectionStatus.whatsapp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                {connectionStatus.whatsapp ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${connectionStatus.whatsapp ? 'text-green-800' : 'text-red-800'}`}>WhatsApp Business API</span>
              </div>
              <p className={`text-xs mt-1 ${connectionStatus.whatsapp ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus.whatsapp ? 'Connected and ready' : 'Not connected'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${connectionStatus.pusher ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                {connectionStatus.pusher ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${connectionStatus.pusher ? 'text-green-800' : 'text-red-800'}`}>Pusher Real-time</span>
              </div>
              <p className={`text-xs mt-1 ${connectionStatus.pusher ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus.pusher ? 'Connected to chat channel' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Message System */}
        <TestMessage onTestMessage={handleTestMessage} />
      </div>
    </div>
  );
};

export default Settings;
