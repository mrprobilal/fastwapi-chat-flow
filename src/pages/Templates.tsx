
import React, { useState, useEffect } from 'react';
import { Send, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { databaseService } from '../services/databaseService';
import { whatsappService } from '../services/whatsappService';

const Templates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('whatsapp-templates');
    if (savedTemplates) {
      const parsedTemplates = JSON.parse(savedTemplates);
      console.log('Loaded templates from localStorage:', parsedTemplates);
      setTemplates(parsedTemplates);
    }

    // Initialize database service
    databaseService.initializeSettings();
  }, []);

  const handleSyncTemplates = async () => {
    setIsSyncing(true);
    try {
      const settings = databaseService.getSettings();
      
      if (!settings?.accessToken || !settings?.businessId) {
        toast.error('Please configure your WhatsApp Business API credentials in Settings first');
        setIsSyncing(false);
        return;
      }

      console.log('Using WhatsApp Business API for sync');
      
      const syncedTemplates = await whatsappService.syncTemplates();
      
      setTemplates(syncedTemplates);
      
      if (syncedTemplates.length > 0) {
        toast.success(`${syncedTemplates.length} templates synced successfully!`);
      } else {
        toast.success('Templates synced successfully! No templates found.');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Failed to sync templates: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVariableChange = (variableName: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !phoneNumber.trim()) {
      toast.error('Please select a template and enter a phone number');
      return;
    }

    setIsSending(true);
    try {
      await whatsappService.sendTemplateMessage(
        selectedTemplate.name,
        phoneNumber,
        templateVariables
      );
      
      toast.success('Template message sent successfully!');
      
      // Clear form
      setPhoneNumber('');
      setTemplateVariables({});
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error(`Failed to send template: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Messages</h1>
          <p className="text-gray-600 mt-2">Send approved WhatsApp Business templates to your customers</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSyncTemplates}
            disabled={isSyncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Templates'}
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Available Templates ({templates.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {templates.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No templates available</p>
                <p className="text-sm">Click "Sync Templates" to load your templates from WhatsApp Business API</p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setTemplateVariables({});
                  }}
                  className={`p-6 cursor-pointer hover:bg-gray-50 ${
                    selectedTemplate?.id === template.id ? 'bg-green-50 border-l-4 border-green-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {template.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Template Preview & Send */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {selectedTemplate ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Send Template: {selectedTemplate.name}</h3>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Content</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-900">{selectedTemplate.content}</p>
                  </div>
                </div>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Variables</label>
                    <div className="space-y-3">
                      {selectedTemplate.variables.map((variable, index) => (
                        <div key={index}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {variable.replace('_', ' ').toUpperCase()}
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter ${variable.replace('_', ' ')}`}
                            value={templateVariables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button 
                  onClick={handleSendTemplate}
                  disabled={isSending || !phoneNumber.trim()}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? 'Sending...' : 'Send Template Message'}
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Template</h3>
              <p className="text-gray-600">Choose a template from the list to preview and send it to your customers.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates;
