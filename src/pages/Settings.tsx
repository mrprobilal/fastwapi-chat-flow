import React, { useState, useEffect } from 'react';
import { Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { pusherService } from '../services/pusherService';
import { databaseService } from '../services/databaseService';
import TestMessage from '../components/TestMessage';

const Settings = () => {
  const [settings, setSettings] = useState({
    pusherAppId: '2012752',
    pusherKey: '490510485d3b7c3874d4',
    pusherSecret: 'bdafa26e3b3d42f53d5c',
    pusherCluster: 'ap4',
  });

  const [connectionStatus, setConnectionStatus] = useState({
    pusher: false
  });

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

    // Check Pusher connection
    const checkPusherConnection = () => {
      setConnectionStatus(prev => ({
        ...prev,
        pusher: pusherService.isConnected()
      }));
    };

    const connectionInterval = setInterval(checkPusherConnection, 2000);

    return () => {
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

  const testPusherConnection = () => {
    try {
      pusherService.connect(settings.pusherKey, settings.pusherCluster);
      toast.success('Pusher connection test initiated!');
    } catch (error) {
      console.error('Pusher test error:', error);
      toast.error('Failed to connect to Pusher');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your real-time messaging settings</p>
      </div>

      <div className="space-y-6">
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
          <div className="grid grid-cols-1 gap-4">
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
        <TestMessage />

        {/* Integration Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">FastWAPI Integration</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p><strong>Configure your FastWAPI backend to send messages via Pusher:</strong></p>
            <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
{`# Python example for FastWAPI
import pusher

pusher_client = pusher.Pusher(
    app_id='${settings.pusherAppId}',
    key='${settings.pusherKey}',
    secret='${settings.pusherSecret}',
    cluster='${settings.pusherCluster}',
    ssl=True
)

# Send message to app
pusher_client.trigger('fastwapi-channel', 'message-event', {
    'message': 'Hello from WhatsApp!',
    'from': '+1234567890',
    'contact_name': 'Customer Name'
})`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
