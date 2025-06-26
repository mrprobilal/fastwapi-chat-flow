
import React, { useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    accessToken: '',
    businessId: '',
    phoneNumberId: '',
    webhookUrl: '',
    pusherKey: '490510485d3b7c3874d4',
    pusherSecret: 'bdafa26e3b3d42f53d5c',
    pusherCluster: 'ap4',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log('Settings saved:', settings);
    // Here you would typically save to local storage or send to API
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Settings</h1>
        <p className="text-gray-600 mt-2">Configure your WhatsApp Business API and Pusher settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* WhatsApp Business API Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Business API</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access Token</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Business ID</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
                <input
                  type="text"
                  name="phoneNumberId"
                  value={settings.phoneNumberId}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <input
                  type="url"
                  name="webhookUrl"
                  value={settings.webhookUrl}
                  onChange={handleInputChange}
                  placeholder="https://your-webhook-url.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Pusher Settings */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pusher Real-time Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-800">WhatsApp API</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Connected and operational</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-800">Pusher Real-time</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Connected to fastwapi-channel</p>
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
    </div>
  );
};

export default Settings;
