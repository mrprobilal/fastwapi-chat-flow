
import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Send } from 'lucide-react';
import { usePusher } from '../hooks/usePusher';
import { toast } from 'sonner';

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'customer', text: 'Hi, I need help with my order', time: '2:25 PM' },
    { id: 2, sender: 'business', text: 'Hello! I\'d be happy to help you with your order. Can you please provide your order number?', time: '2:26 PM' },
    { id: 3, sender: 'customer', text: 'Sure, it\'s #12345', time: '2:28 PM' },
    { id: 4, sender: 'business', text: 'Thank you! I can see your order is being processed and will be shipped tomorrow.', time: '2:29 PM' },
    { id: 5, sender: 'customer', text: 'Thank you for the quick response!', time: '2:30 PM' },
  ]);

  const { isConnected, subscribeToMessages, unsubscribeFromMessages } = usePusher();

  const chats = [
    { id: 1, name: 'John Doe', phone: '+1234567890', lastMessage: 'Thank you for the quick response!', time: '2:30 PM', unread: 2 },
    { id: 2, name: 'Sarah Wilson', phone: '+1987654321', lastMessage: 'Can you send me the details?', time: '1:15 PM', unread: 0 },
    { id: 3, name: 'Mike Johnson', phone: '+1122334455', lastMessage: 'Perfect, thanks!', time: '11:45 AM', unread: 1 },
  ];

  useEffect(() => {
    // Subscribe to real-time messages
    subscribeToMessages((data) => {
      console.log('New message received:', data);
      
      // Add new message to the chat
      const newMsg = {
        id: Date.now(),
        sender: data.sender || 'customer',
        text: data.message || data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newMsg]);
      toast.success('New message received!');
    });

    return () => {
      unsubscribeFromMessages();
    };
  }, [subscribeToMessages, unsubscribeFromMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now(),
      sender: 'business',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');

    // Here you would send to your fastwapi.com backend
    try {
      const response = await fetch('https://fastwapi.com/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          phone: '+1234567890', // Selected chat phone
          // Add other required fields
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Real-time messaging with your customers</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected to Pusher' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96">
        <div className="flex h-full">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-full">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                    selectedChat === chat.id ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{chat.name}</p>
                        <p className="text-xs text-gray-500">{chat.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{chat.time}</p>
                      {chat.unread > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{chat.lastMessage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">John Doe</h3>
              <p className="text-sm text-gray-500">+1234567890 • {isConnected ? 'Online' : 'Offline'}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'business' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'business'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'business' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button 
                  onClick={sendMessage}
                  className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
