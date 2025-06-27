
import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Send, FileText, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { usePusher } from '../hooks/usePusher';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

const Messages = () => {
  const location = useLocation();
  const [selectedChat, setSelectedChat] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'customer', text: 'Hi, I need help with my order', time: '2:25 PM', status: 'delivered' },
    { id: 2, sender: 'business', text: 'Hello! I\'d be happy to help you with your order. Can you please provide your order number?', time: '2:26 PM', status: 'read' },
    { id: 3, sender: 'customer', text: 'Sure, it\'s #12345', time: '2:28 PM', status: 'delivered' },
    { id: 4, sender: 'business', text: 'Thank you! I can see your order is being processed and will be shipped tomorrow.', time: '2:29 PM', status: 'read' },
    { id: 5, sender: 'customer', text: 'Thank you for the quick response!', time: '2:30 PM', status: 'delivered' },
  ]);

  const { isConnected, subscribeToMessages, unsubscribeFromMessages } = usePusher();

  const templates = [
    { id: 1, name: 'Welcome Message', content: 'Welcome! How can we help you today?' },
    { id: 2, name: 'Order Status', content: 'Your order is being processed and will be shipped soon.' },
    { id: 3, name: 'Thank You', content: 'Thank you for choosing our service!' },
  ];

  const [chats, setChats] = useState([
    { id: 1, name: 'John Doe', phone: '+1234567890', lastMessage: 'Thank you for the quick response!', time: '2:30 PM', unread: 2, avatar: 'JD', online: true },
    { id: 2, name: 'Sarah Wilson', phone: '+1987654321', lastMessage: 'Can you send me the details?', time: '1:15 PM', unread: 0, avatar: 'SW', online: false },
    { id: 3, name: 'Mike Johnson', phone: '+1122334455', lastMessage: 'Perfect, thanks!', time: '11:45 AM', unread: 1, avatar: 'MJ', online: true },
  ]);

  // Handle selected customer from navigation
  useEffect(() => {
    if (location.state?.selectedCustomer) {
      const customer = location.state.selectedCustomer;
      // Add to chats if not already present
      const existingChat = chats.find(chat => chat.phone === customer.phone);
      if (!existingChat) {
        const newChat = {
          id: Date.now(),
          name: customer.name,
          phone: customer.phone,
          lastMessage: 'Start conversation',
          time: 'Now',
          unread: 0,
          avatar: customer.name.split(' ').map(n => n[0]).join('').toUpperCase(),
          online: false
        };
        setChats(prev => [newChat, ...prev]);
        setSelectedChat(newChat.id);
      } else {
        setSelectedChat(existingChat.id);
      }
    }
  }, [location.state]);

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('whatsapp-messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [selectedChat]);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('whatsapp-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Subscribe to real-time messages
    subscribeToMessages((data) => {
      console.log('New message received:', data);
      
      // Add new message to the chat
      const newMsg = {
        id: Date.now(),
        sender: data.sender || 'customer',
        text: data.message || data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered'
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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
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
      
      // Update message status to sent
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id ? { ...msg, status: 'sent' } : msg
      ));
      
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id ? { ...msg, status: 'failed' } : msg
      ));
      toast.error('Failed to send message');
    }
  };

  const sendTemplate = async (template) => {
    const messageData = {
      id: Date.now(),
      sender: 'business',
      text: template.content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending'
    };

    setMessages(prev => [...prev, messageData]);
    setShowTemplates(false);

    try {
      const response = await fetch('https://fastwapi.com/api/send-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          phone: '+1234567890',
        })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageData.id ? { ...msg, status: 'sent' } : msg
        ));
        toast.success('Template sent successfully!');
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === messageData.id ? { ...msg, status: 'failed' } : msg
        ));
        toast.error('Failed to send template');
      }
    } catch (error) {
      console.error('Error sending template:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === messageData.id ? { ...msg, status: 'failed' } : msg
      ));
      toast.error('Failed to send template');
    }
  };

  const getSelectedChat = () => chats.find(chat => chat.id === selectedChat);
  const selectedChatData = getSelectedChat();

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600">Real-time messaging with your customers</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search or start new chat"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedChat === chat.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                      {chat.avatar}
                    </div>
                    {chat.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">{chat.name}</p>
                      <p className="text-xs text-gray-500">{chat.time}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-500 rounded-full min-w-[20px]">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-green-50 to-white">
          {selectedChatData ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                        {selectedChatData.avatar}
                      </div>
                      {selectedChatData.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedChatData.name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedChatData.phone} • {selectedChatData.online ? 'Online' : 'Last seen recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Video className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreVertical className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'business' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                        message.sender === 'business'
                          ? 'bg-green-500 text-white rounded-br-none'
                          : 'bg-white text-gray-900 shadow-sm border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <p className={`text-xs ${
                          message.sender === 'business' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.time}
                        </p>
                        {message.sender === 'business' && (
                          <div className="flex">
                            {message.status === 'sending' && (
                              <div className="h-3 w-3 border-2 border-green-200 border-t-green-100 rounded-full animate-spin"></div>
                            )}
                            {message.status === 'sent' && (
                              <svg className="h-3 w-3 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {message.status === 'delivered' && (
                              <svg className="h-3 w-3 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            {message.status === 'read' && (
                              <div className="flex">
                                <svg className="h-3 w-3 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <svg className="h-3 w-3 text-blue-300 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            {message.status === 'failed' && (
                              <svg className="h-3 w-3 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                {showTemplates && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Templates</h4>
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => sendTemplate(template)}
                          className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-gray-500 text-xs truncate">{template.content}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FileText className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded-full transition-colors">
                      <Smile className="h-5 w-5" />
                    </button>
                  </div>
                  <button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to WhatsApp Business</h3>
                <p className="text-gray-600">Select a chat to start messaging your customers</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
