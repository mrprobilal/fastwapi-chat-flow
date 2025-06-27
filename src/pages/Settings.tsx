
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { pusherService } from '../services/pusherService';

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

  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('fastwapi-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check Pusher connection
    const checkPusherConnection = () => {
      setConnectionStatus(prev => ({
        ...prev,
        pusher: pusherService.isConnected()
      }));
    };

    const interval = setInterval(checkPusherConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('fastwapi-settings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
    toast.success('Settings saved successfully!');
  };

  const testWhatsAppConnection = async () => {
    if (!settings.accessToken || !settings.businessId) {
      toast.error('Please enter Access Token and Business ID first');
      return;
    }

    setTestingWhatsApp(true);
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('WhatsApp connection test successful:', data);
        setConnectionStatus(prev => ({ ...prev, whatsapp: true }));
        toast.success('WhatsApp Business API connection successful!');
      } else {
        const errorData = await response.json();
        console.error('WhatsApp connection test failed:', errorData);
        setConnectionStatus(prev => ({ ...prev, whatsapp: false }));
        toast.error(`WhatsApp connection failed: ${errorData.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('WhatsApp connection test error:', error);
      setConnectionStatus(prev => ({ ...prev, whatsapp: false }));
      toast.error('Failed to test WhatsApp connection');
    } finally {
      setTestingWhatsApp(false);
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">API Settings</h1>
        <p className="text-gray-600 mt-2">Configure your WhatsApp Business API and Pusher settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="space-y-6">
          {/* WhatsApp Business API Settings */}
          <div>
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
          </div>

          {/* Pusher Settings */}
          <div className="pt-6 border-t border-gray-200">
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
          </div>

          {/* Connection Status */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="pt-6">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Integration Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Website Integration Instructions</h3>
        <div className="space-y-3 text-sm text-blue-800">
          <p><strong>1. Add Pusher to your fastwapi.com website:</strong></p>
          <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
{`// Install: npm install pusher-js
const pusher = new Pusher('${settings.pusherKey}', {
  cluster: '${settings.pusherCluster}'
});

const channel = pusher.subscribe('fastwapi-channel');
channel.bind('message-event', function(data) {
  console.log('New message from app:', data);
});`}
          </pre>
          
          <p><strong>2. Send messages from your website to this app:</strong></p>
          <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
{`// Backend code to trigger events (Node.js)
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: '${settings.pusherAppId}',
  key: '${settings.pusherKey}',
  secret: '${settings.pusherSecret}',
  cluster: '${settings.pusherCluster}',
  useTLS: true
});

pusher.trigger('fastwapi-channel', 'message-event', {
  message: 'Hello from website',
  sender: 'customer',
  phone: '+1234567890'
});`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Settings;
