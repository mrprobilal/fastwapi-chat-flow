import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, TestTube, CheckCircle, XCircle, Copy, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { pusherService } from '../services/pusherService';
import { databaseService } from '../services/databaseService';
import { whatsappService } from '../services/whatsappService';
import { settingsSyncService } from '../services/settingsSyncService';

const Settings = () => {
  const [settings, setSettings] = useState({
    accessToken: '',
    businessId: '',
    phoneNumberId: '',
    pusherAppId: '2012752',
    pusherKey: '490510485d3b7c3874d4',
    pusherSecret: 'bdafa26e3b3d42f53d5c',
    pusherCluster: 'ap4',
  });

  const [connectionStatus, setConnectionStatus] = useState({
    whatsapp: false,
    pusher: false
  });

  const [syncStatus, setSyncStatus] = useState({
    webhookUrl: 'https://hook.eu2.make.com/your-webhook-id',
    lastSync: null
  });

  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testingPusher, setTestingPusher] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize services
    databaseService.initializeSettings();

    // Subscribe to settings changes
    const unsubscribe = databaseService.onSettingsChange((newSettings) => {
      if (newSettings) {
        setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
      }
    });

    // Load initial settings
    const initialSettings = databaseService.getSettings();
    if (initialSettings) {
      setSettings(prevSettings => ({ ...prevSettings, ...initialSettings }));
    }

    // Update sync status
    const updateSyncStatus = () => {
      const status = settingsSyncService.getStatus();
      setSyncStatus(status);
    };

    updateSyncStatus();
    const statusInterval = setInterval(updateSyncStatus, 2000);

    // Check Pusher connection
    const checkPusherConnection = () => {
      setConnectionStatus(prev => ({
        ...prev,
        pusher: pusherService.isConnected()
      }));
    };

    const connectionInterval = setInterval(checkPusherConnection, 2000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(connectionInterval);
      unsubscribe();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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

  const testPusherConnection = async () => {
    setTestingPusher(true);
    try {
      // First save the current settings
      await databaseService.saveSettings(settings);
      
      // Connect to Pusher
      pusherService.connect(settings.pusherKey, settings.pusherCluster);
      
      // Wait a moment for connection
      setTimeout(() => {
        const isConnected = pusherService.isConnected();
        if (isConnected) {
          setConnectionStatus(prev => ({ ...prev, pusher: true }));
          toast.success('Pusher connected successfully! Ready to receive messages.');
          
          // Test the connection
          pusherService.testConnection();
        } else {
          setConnectionStatus(prev => ({ ...prev, pusher: false }));
          toast.error('Failed to connect to Pusher. Check your credentials.');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Pusher test error:', error);
      setConnectionStatus(prev => ({ ...prev, pusher: false }));
      toast.error('Failed to connect to Pusher');
    } finally {
      setTestingPusher(false);
    }
  };

  const testWhatsAppConnection = async () => {
    if (!settings.accessToken || !settings.businessId) {
      toast.error('Please enter Access Token and Business ID first');
      return;
    }

    setTestingWhatsApp(true);
    try {
      // Save settings first so the service can use them
      await databaseService.saveSettings(settings);
      
      // Test the connection
      await whatsappService.testConnection();
      
      setConnectionStatus(prev => ({ ...prev, whatsapp: true }));
      toast.success('WhatsApp Business API connection successful!');
    } catch (error: any) {
      console.error('WhatsApp connection test failed:', error);
      setConnectionStatus(prev => ({ ...prev, whatsapp: false }));
      toast.error(`WhatsApp connection failed: ${error.message}`);
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(syncStatus.webhookUrl);
    toast.success('Webhook URL copied to clipboard!');
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">API Settings</h1>
        <p className="text-gray-600 mt-2">Configure your WhatsApp Business API and real-time messaging</p>
      </div>

      <div className="space-y-6">
        {/* Important Setup Instructions */}
        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4 md:p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Setup Instructions</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Step 1:</strong> Test Pusher connection below ↓</p>
                <p><strong>Step 2:</strong> In your FastWAPI dashboard, set the webhook URL to trigger Pusher events</p>
                <p><strong>Step 3:</strong> Configure your FastWAPI to send messages to channel: <code className="bg-blue-100 px-1 rounded">fastwapi-channel</code></p>
                <p><strong>Step 4:</strong> Use event name: <code className="bg-blue-100 px-1 rounded">message-event</code></p>
              </div>
            </div>
          </div>
        </div>

        {/* Pusher Settings - Moved to top for better visibility */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Pusher Real-time Settings</h3>
            <button
              onClick={testPusherConnection}
              disabled={testingPusher}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <TestTube className="h-4 w-4" />
              {testingPusher ? 'Testing...' : 'Test Pusher Connection'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pusher App ID</label>
              <input
                type="text"
                name="pusherAppId"
                value={settings.pusherAppId}
                onChange={handleInputChange}
                placeholder="Pusher app ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pusher Key</label>
              <input
                type="text"
                name="pusherKey"
                value={settings.pusherKey}
                onChange={handleInputChange}
                placeholder="Pusher app key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pusher Secret</label>
              <input
                type="password"
                name="pusherSecret"
                value={settings.pusherSecret}
                onChange={handleInputChange}
                placeholder="Pusher app secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pusher Cluster</label>
              <input
                type="text"
                name="pusherCluster"
                value={settings.pusherCluster}
                onChange={handleInputChange}
                placeholder="Pusher cluster"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Channel Configuration</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Channel:</strong> fastwapi-channel</p>
              <p><strong>Event:</strong> message-event</p>
              <p><strong>App ID:</strong> {settings.pusherAppId}</p>
            </div>
          </div>
        </div>

        {/* Automatic Sync Settings */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Automatic WhatsApp Sync
              </h3>
              <p className="text-green-700 text-sm mt-1">Automatically sync WhatsApp settings from your website</p>
            </div>
            <button
              onClick={copyWebhookUrl}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Copy className="h-4 w-4" />
              Copy Webhook URL
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-green-800 mb-2">Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={syncStatus.webhookUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-sm"
              />
            </div>
            <p className="text-xs text-green-600 mt-1">Use this URL in your website to automatically sync WhatsApp settings</p>
          </div>

          {/* Sync Status */}
          <div className="p-4 bg-white/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Ready for automatic sync</span>
              </div>
              {syncStatus.lastSync && (
                <span className="text-xs text-gray-600">
                  Last sync: {new Date(syncStatus.lastSync).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Business API Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">WhatsApp Business API</h3>
            <button
              onClick={testWhatsAppConnection}
              disabled={testingWhatsApp}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <TestTube className="h-4 w-4" />
              {testingWhatsApp ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Token *</label>
              <input
                type="password"
                name="accessToken"
                value={settings.accessToken}
                onChange={handleInputChange}
                placeholder="Enter your access token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business ID *</label>
              <input
                type="text"
                name="businessId"
                value={settings.businessId}
                onChange={handleInputChange}
                placeholder="Enter your business ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID *</label>
              <input
                type="text"
                name="phoneNumberId"
                value={settings.phoneNumberId}
                onChange={handleInputChange}
                placeholder="Enter your phone number ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                {connectionStatus.pusher ? 'Connected to fastwapi-channel' : 'Disconnected - Test connection above'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${connectionStatus.whatsapp ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                {connectionStatus.whatsapp ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${connectionStatus.whatsapp ? 'text-green-800' : 'text-red-800'}`}>WhatsApp API</span>
              </div>
              <p className={`text-xs mt-1 ${connectionStatus.whatsapp ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus.whatsapp ? 'Connected and operational' : 'Not connected'}
              </p>
            </div>
          </div>
        </div>

        {/* FastWAPI Integration Instructions */}
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">FastWAPI Setup Instructions</h3>
          <div className="space-y-3 text-sm text-yellow-800">
            <p><strong>Configure your FastWAPI website to forward WhatsApp messages:</strong></p>
            
            <div className="bg-yellow-100 p-3 rounded text-xs">
              <p className="font-medium mb-2">Add this to your FastWAPI webhook handler:</p>
              <pre className="overflow-x-auto whitespace-pre-wrap">
{`// When WhatsApp message is received, send to Pusher
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: '${settings.pusherAppId}',
  key: '${settings.pusherKey}',
  secret: '${settings.pusherSecret}',
  cluster: '${settings.pusherCluster}',
  useTLS: true
});

// In your webhook handler:
pusher.trigger('fastwapi-channel', 'message-event', {
  from: message.from,
  body: message.body,
  timestamp: message.timestamp
});`}
              </pre>
            </div>
            
            <p className="text-xs text-yellow-700 mt-2">
              <strong>Important:</strong> Make sure your FastWAPI website can send Pusher messages when WhatsApp webhooks are received.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
