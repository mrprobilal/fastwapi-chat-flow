
import React, { useState } from 'react';
import { Send, TestTube, Zap } from 'lucide-react';
import { toast } from 'sonner';

const TestMessage = () => {
  const [testPhone, setTestPhone] = useState('+923049744702');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from WhatsApp.');
  const [testName, setTestName] = useState('Test Contact');

  const sendTestMessage = () => {
    // Simulate receiving a message via Pusher (simple format)
    const testData = {
      message: testMessage,
      from: testPhone,
      contact_name: testName,
      timestamp: new Date().toISOString()
    };

    // Dispatch a custom event to simulate Pusher message
    window.dispatchEvent(new CustomEvent('test-pusher-message', { detail: testData }));
    
    toast.success('Test message sent! Check the Messages page.');
  };

  const sendWebhookFormatMessage = () => {
    // Simulate WhatsApp webhook format
    const webhookData = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: testPhone.replace(/\D/g, ''),
              text: {
                body: testMessage
              },
              timestamp: Math.floor(Date.now() / 1000).toString()
            }],
            contacts: [{
              profile: {
                name: testName
              }
            }]
          }
        }]
      }]
    };

    window.dispatchEvent(new CustomEvent('test-pusher-message', { detail: webhookData }));
    
    toast.success('Webhook format test message sent!');
  };

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
        <TestTube className="h-5 w-5" />
        Test Message System
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Phone Number</label>
          <input
            type="text"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
            placeholder="+923049744702"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Contact Name</label>
          <input
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
            placeholder="Test Contact"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-800 mb-1">Message</label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm h-20"
            placeholder="Test message content..."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={sendTestMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Send className="h-4 w-4" />
            Send Simple Test
          </button>
          <button
            onClick={sendWebhookFormatMessage}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Zap className="h-4 w-4" />
            Send Webhook Format
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestMessage;
