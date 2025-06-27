
import React from 'react';
import { Button } from './ui/button';

interface TestMessageProps {
  onTestMessage: (data: any) => void;
}

const TestMessage: React.FC<TestMessageProps> = ({ onTestMessage }) => {
  const sendTestMessage = () => {
    const testData = {
      messages: [{
        from: "+923049744702",
        text: { body: "Hello from test!" },
        timestamp: new Date().toISOString()
      }],
      contacts: [{
        profile: { name: "Test User" },
        wa_id: "+923049744702"
      }]
    };
    
    console.log('🧪 Sending test message:', testData);
    onTestMessage(testData);
  };

  return (
    <Button onClick={sendTestMessage} variant="outline" size="sm">
      Test Message
    </Button>
  );
};

export default TestMessage;
