
import React, { useState } from 'react';
import { Send, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const Templates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Welcome Message',
      category: 'Marketing',
      status: 'Approved',
      content: 'Welcome to {{business_name}}! We\'re excited to have you as a customer. How can we help you today?',
      variables: ['business_name']
    },
    {
      id: 2,
      name: 'Order Confirmation',
      category: 'Utility',
      status: 'Approved',
      content: 'Your order #{{order_number}} has been confirmed and will be delivered to {{address}} by {{delivery_date}}.',
      variables: ['order_number', 'address', 'delivery_date']
    },
    {
      id: 3,
      name: 'Appointment Reminder',
      category: 'Utility',
      status: 'Approved',
      content: 'Hi {{customer_name}}, this is a reminder that you have an appointment with us on {{date}} at {{time}}.',
      variables: ['customer_name', 'date', 'time']
    },
  ]);

  const handleSyncTemplates = async () => {
    setIsSyncing(true);
    try {
      const settings = JSON.parse(localStorage.getItem('fastwapi-settings') || '{}');
      
      if (!settings.accessToken || !settings.businessId) {
        toast.error('Please configure your WhatsApp API settings first');
        setIsSyncing(false);
        return;
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${settings.businessId}/message_templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Templates synced:', data);
        
        // Update templates with synced data
        if (data.data && data.data.length > 0) {
          const syncedTemplates = data.data.map((template, index) => ({
            id: template.id || index + 1,
            name: template.name || `Template ${index + 1}`,
            category: template.category || 'Utility',
            status: template.status || 'Approved',
            content: template.components?.[0]?.text || 'Template content',
            variables: template.components?.[0]?.example?.body_text?.[0] || []
          }));
          setTemplates(syncedTemplates);
        }
        
        toast.success('Templates synced successfully!');
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync templates. Please check your API settings.');
    } finally {
      setIsSyncing(false);
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
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
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
            ))}
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

                {selectedTemplate.variables.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Variables</label>
                    <div className="space-y-3">
                      {selectedTemplate.variables.map((variable) => (
                        <div key={variable}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {variable.replace('_', ' ').toUpperCase()}
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter ${variable.replace('_', ' ')}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" name="recipient" value="single" className="mr-2" defaultChecked />
                      <span className="text-sm text-gray-900">Single Customer</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="recipient" value="group" className="mr-2" />
                      <span className="text-sm text-gray-900">Customer Group</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="recipient" value="all" className="mr-2" />
                      <span className="text-sm text-gray-900">All Customers</span>
                    </label>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Template Message
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
