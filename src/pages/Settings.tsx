
import React, { useState, useEffect } from 'react';
import { Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
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
    whatsapp: false
  });

  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeSettings = async () => {
      // Initialize services
      await databaseService.initializeSettings();
      
      // Load initial settings
      const initialSettings = databaseService.getSettings();
      if (initialSettings) {
        setSettings(prevSettings => ({ ...prevSettings, ...initialSettings }));
      }
      
      setIsInitialized(true);

      // Subscribe to settings changes only after initialization
      unsubscribe = databaseService.onSettingsChange((newSettings) => {
        if (newSettings && isInitialized) {
          setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
        }
      });
    };

    initializeSettings();

    // Check connections
    const checkConnections = () => {
      setConnectionStatus(prev => ({
        ...prev,
        pusher: pusherService.isConnected()
      }));
    };

    const connectionInterval = setInterval(checkConnections, 2000);

    return () => {
      clearInterval(connectionInterval);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Input change: ${name} = ${value}`);
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await databaseService.saveSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
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

  const handleTestMessage = (data: any) => {
    console.log('🧪 Test message received in Settings:', data);
    toast.success('Test message sent successfully!');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your WhatsApp Business API and real-time messaging settings</p>
      </div>

      <div className="space-y-6">
        {/* WhatsApp Business API Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Business API</h3>
            <button
              onClick={testWhatsAppConnection}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
            >
              <TestTube className="h-4 w-4" />
              Test WhatsApp API
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
              <input
                type="text"
                name="accessToken"
                value={settings.accessToken}
                onChange={handleInputChange}
                placeholder="WhatsApp Business API Access Token"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business ID</label>
              <input
                type="text"
                name="businessId"
                value={settings.businessId}
                onChange={handleInputChange}
                placeholder="WhatsApp Business Account ID"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
              <input
                type="text"
                name="phoneNumberId"
                value={settings.phoneNumberId}
                onChange={handleInputChange}
                placeholder="WhatsApp Business Phone Number ID"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Verify Token</label>
              <Input
                type="text"
                name="webhookVerifyToken"
                value={settings.webhookVerifyToken}
                onChange={handleInputChange}
                placeholder="Webhook verification token"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Pusher Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Pusher Real-time Settings</h3>
            <button
              onClick={testPusherConnection}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <TestTube className="h-4 w-4" />
              Test Connection
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pusher App ID</label>
              <Input
                type="text"
                name="pusherAppId"
                value={settings.pusherAppId}
                onChange={handleInputChange}
                placeholder="Pusher app ID"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pusher Key</label>
              <Input
                type="text"
                name="pusherKey"
                value={settings.pusherKey}
                onChange={handleInputChange}
                placeholder="Pusher app key"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pusher Secret</label>
              <Input
                type="password"
                name="pusherSecret"
                value={settings.pusherSecret}
                onChange={handleInputChange}
                placeholder="Pusher app secret"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pusher Cluster</label>
              <Input
                type="text"
                name="pusherCluster"
                value={settings.pusherCluster}
                onChange={handleInputChange}
                placeholder="Pusher cluster"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {connectionStatus.pusher ? 'Connected to fastwapi-channel' : 'Disconnected'}
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
