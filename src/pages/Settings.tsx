
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { databaseService } from '../services/databaseService';
import { whatsappService } from '../services/whatsappService';

const Settings = () => {
  const [settings, setSettings] = useState({
    apiToken: '',
  });

  const [connectionStatus, setConnectionStatus] = useState({
    creativepixels: false
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    databaseService.initializeSettings();

    const unsubscribe = databaseService.onSettingsChange((newSettings) => {
      if (newSettings) {
        setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
      }
    });

    const initialSettings = databaseService.getSettings();
    if (initialSettings) {
      setSettings(prevSettings => ({ ...prevSettings, ...initialSettings }));
    }

    // Check if we have a valid token
    const token = localStorage.getItem('token');
    if (token) {
      setConnectionStatus(prev => ({ ...prev, creativepixels: true }));
    }

    return () => {
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

  const testConnection = async () => {
    if (!settings.apiToken) {
      toast.error('Please enter your API Access Token first');
      return;
    }

    setTestingConnection(true);
    try {
      await databaseService.saveSettings(settings);
      
      // Store token temporarily and test
      localStorage.setItem('token', settings.apiToken);
      
      // Test by fetching conversations
      await whatsappService.getConversations();
      
      setConnectionStatus(prev => ({ ...prev, creativepixels: true }));
      toast.success('Creative Pixels API connection successful!');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus(prev => ({ ...prev, creativepixels: false }));
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">API Settings</h1>
        <p className="text-gray-600 mt-2">Configure your Creative Pixels API connection</p>
      </div>

      <div className="space-y-6">
        {/* Setup Instructions */}
        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-4 md:p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Setup Instructions</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Step 1:</strong> Get your API Access Token from Creative Pixels dashboard</p>
                <p><strong>Step 2:</strong> Enter the token below and test the connection</p>
                <p><strong>Step 3:</strong> Save settings to complete the setup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Creative Pixels API Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Creative Pixels API</h3>
            <button
              onClick={testConnection}
              disabled={testingConnection}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <TestTube className="h-4 w-4" />
              {testingConnection ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Access Token *</label>
              <input
                type="password"
                name="apiToken"
                value={settings.apiToken}
                onChange={handleInputChange}
                placeholder="Enter your Creative Pixels API token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find your API token in your Creative Pixels dashboard
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
            <div className={`p-4 rounded-lg border ${connectionStatus.creativepixels ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                {connectionStatus.creativepixels ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${connectionStatus.creativepixels ? 'text-green-800' : 'text-red-800'}`}>Creative Pixels API</span>
              </div>
              <p className={`text-xs mt-1 ${connectionStatus.creativepixels ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus.creativepixels ? 'Connected and operational' : 'Not connected - Test connection above'}
              </p>
            </div>
          </div>
        </div>

        {/* API Information */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-900">API Base URL:</p>
                <p className="font-mono text-xs bg-white p-2 rounded border">https://creativepixels.site/api</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Vendor UID:</p>
                <p className="font-mono text-xs bg-white p-2 rounded border">a5944265-83b2-4372-a6cf-01778281189b</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
