import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Send, FileText, Paperclip, Smile, ArrowLeft } from 'lucide-react';
import { usePusher } from '../hooks/usePusher';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';

const Messages = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [apiStatus, setApiStatus] = useState({ checking: false, connected: false });

  const { isConnected, subscribeToMessages, unsubscribeFromMessages } = usePusher();

  const [chats, setChats] = useState([]);

  // Helper function to normalize phone numbers
  const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('1') ? `+${digits}` : `+${digits}`;
  };

  // Helper function to deduplicate chats by phone number
  const deduplicateChats = (chatList) => {
    const seen = new Set();
    return chatList.filter(chat => {
      const normalizedPhone = normalizePhoneNumber(chat.phone);
      if (seen.has(normalizedPhone)) {
        return false;
      }
      seen.add(normalizedPhone);
      return true;
    });
  };

  // Helper function to find existing chat by phone number
  const findExistingChat = (phone) => {
    const normalizedPhone = normalizePhoneNumber(phone);
    
    const stateChat = chats.find(chat => normalizePhoneNumber(chat.phone) === normalizedPhone);
    if (stateChat) return stateChat;

    const savedChats = localStorage.getItem('whatsapp-chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      return parsedChats.find(chat => normalizePhoneNumber(chat.phone) === normalizedPhone);
    }
    
    return null;
  };

  // Helper function to safely add or update chat
  const addOrUpdateChat = (newChat) => {
    setChats(prev => {
      const normalizedPhone = normalizePhoneNumber(newChat.phone);
      const existingIndex = prev.findIndex(chat => normalizePhoneNumber(chat.phone) === normalizedPhone);
      
      let updated;
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newChat };
      } else {
        updated = [newChat, ...prev];
      }
      
      const deduplicated = deduplicateChats(updated);
      localStorage.setItem('whatsapp-chats', JSON.stringify(deduplicated));
      return deduplicated;
    });
  };

  // Load messages and chats from localStorage
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const savedMessages = localStorage.getItem('whatsapp-messages');
        const savedChats = localStorage.getItem('whatsapp-chats');
        
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          console.log('📂 Loaded messages from localStorage:', parsedMessages.length);
          setMessages(parsedMessages);
        }
        
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          console.log('📂 Loaded chats from localStorage:', parsedChats.length);
          const deduplicatedChats = deduplicateChats(parsedChats);
          setChats(deduplicatedChats);
          if (deduplicatedChats.length !== parsedChats.length) {
            localStorage.setItem('whatsapp-chats', JSON.stringify(deduplicatedChats));
          }
        }
      } catch (error) {
        console.error('❌ Error loading stored data:', error);
      }
    };

    loadStoredData();
  }, []);

  // Handle selected customer from navigation
  useEffect(() => {
    if (location.state?.selectedCustomer) {
      const customer = location.state.selectedCustomer;
      console.log('👤 Processing selected customer:', customer);
      
      const existingChat = findExistingChat(customer.phone);
      
      if (existingChat) {
        console.log('💬 Found existing chat:', existingChat);
        setSelectedChat(existingChat.id);
      } else {
        console.log('✨ Creating new chat for customer:', customer);
        const newChat = {
          id: customer.phone,
          name: customer.name,
          phone: customer.phone,
          lastMessage: 'Start conversation',
          time: 'Now',
          unread: 0,
          avatar: customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          online: false
        };
        
        addOrUpdateChat(newChat);
        setSelectedChat(newChat.id);
      }
    }
  }, [location.state]);

  // Enhanced message receiving
  useEffect(() => {
    const handleIncomingMessage = (data) => {
      console.log('📨 Raw Pusher event received:', data);
      
      const messageText = data.message || data.text || data.body || data.content;
      const senderPhone = data.from || data.phone || data.sender;
      const senderName = data.contact_name || data.name || data.contact;
      
      console.log('📨 Extracted data:', { messageText, senderPhone, senderName });
      
      if (!messageText || !senderPhone) {
        console.warn('❌ Invalid message data received:', data);
        toast.error('Received invalid message data');
        return;
      }
      
      const newMsg = {
        id: Date.now() + Math.random(),
        from: senderPhone,
        to: 'business',
        text: messageText,
        timestamp: new Date().toISOString(),
        type: 'received',
        status: 'delivered',
        contact_name: senderName
      };
      
      console.log('✅ Processing incoming message:', newMsg);
      
      setMessages(prev => {
        const updated = [...prev, newMsg];
        localStorage.setItem('whatsapp-messages', JSON.stringify(updated));
        console.log('💾 Messages saved, total:', updated.length);
        return updated;
      });
      
      // Add/update chat
      if (senderPhone && senderPhone !== 'business') {
        const chatUpdate = {
          id: senderPhone,
          name: senderName || senderPhone,
          phone: senderPhone,
          lastMessage: messageText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: selectedChat === senderPhone ? 0 : 1,
          avatar: (senderName || senderPhone).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          online: true
        };
        
        addOrUpdateChat(chatUpdate);
        console.log('💬 Chat updated:', chatUpdate);
      }
      
      toast.success(`📨 New message from ${senderName || senderPhone}!`);
    };

    // Listen for test messages
    const handleTestMessage = (event) => {
      handleIncomingMessage(event.detail);
    };

    window.addEventListener('test-pusher-message', handleTestMessage);

    if (isConnected) {
      console.log('🔌 Pusher connected, subscribing to messages...');
      subscribeToMessages(handleIncomingMessage);
    } else {
      console.log('❌ Pusher not connected, cannot subscribe to messages');
    }

    return () => {
      console.log('🔌 Unsubscribing from messages...');
      window.removeEventListener('test-pusher-message', handleTestMessage);
      unsubscribeFromMessages();
    };
  }, [isConnected, subscribeToMessages, unsubscribeFromMessages, selectedChat]);

  // Simplified message sending
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageData = {
      id: Date.now() + Math.random(),
      from: 'business',
      to: selectedChat,
      text: newMessage,
      timestamp: new Date().toISOString(),
      type: 'sent',
      status: 'sent'
    };

    console.log('📤 Sending message:', messageData);

    setMessages(prev => {
      const updated = [...prev, messageData];
      localStorage.setItem('whatsapp-messages', JSON.stringify(updated));
      return updated;
    });

    // Update chat with last message
    setChats(prev => {
      const updated = prev.map(chat => 
        chat.id === selectedChat 
          ? { ...chat, lastMessage: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : chat
      );
      localStorage.setItem('whatsapp-chats', JSON.stringify(updated));
      return updated;
    });

    setNewMessage('');
    toast.success('Message sent! (Will be processed by your FastWAPI backend)');
  };

  const sendTemplate = (template) => {
    if (!selectedChat) return;

    const messageData = {
      id: Date.now() + Math.random(),
      from: 'business',
      to: selectedChat,
      text: template.content,
      timestamp: new Date().toISOString(),
      type: 'sent',
      status: 'sent'
    };

    setMessages(prev => {
      const updated = [...prev, messageData];
      localStorage.setItem('whatsapp-messages', JSON.stringify(updated));
      return updated;
    });

    setShowTemplates(false);
    toast.success('Template sent!');
  };

  const getSelectedChat = () => chats.find(chat => chat.id === selectedChat);
  const selectedChatData = getSelectedChat();
  const chatMessages = messages.filter(msg => 
    (msg.from === selectedChat && msg.type === 'received') || 
    (msg.to === selectedChat && msg.type === 'sent')
  );

  // Mobile view - show only chat list or selected chat
  if (isMobile) {
    if (selectedChat) {
      return (
        <div className="h-screen bg-gray-100 flex flex-col">
          {/* Mobile Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {selectedChatData && (
                <>
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                      {selectedChatData.avatar}
                    </div>
                    {selectedChatData.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedChatData.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedChatData.phone} • {selectedChatData.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-green-50 to-white">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation with {selectedChatData?.name}</p>
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-4 py-2 rounded-lg relative ${
                    message.type === 'sent'
                      ? 'bg-green-500 text-white rounded-br-none' 
                      : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                      <p className={`text-xs ${
                        message.type === 'sent' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {message.type === 'sent' && (
                        <div className="flex">
                          {message.status === 'sending' && (
                            <div className="h-3 w-3 border-2 border-green-200 border-t-green-100 rounded-full animate-spin"></div>
                          )}
                          {message.status === 'sent' && (
                            <svg className="h-3 w-3 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
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
              ))
            )}
          </div>

          {/* Mobile Message Input */}
          <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
            {showTemplates && templates.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border max-h-40 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Templates</h4>
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
                disabled={templates.length === 0}
              >
                <FileText className="h-5 w-5" />
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
        </div>
      );
    }

    // Mobile chat list view
    return (
      <div className="h-screen bg-gray-100 flex flex-col">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    Pusher: {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    apiStatus.checking ? 'bg-yellow-500' : 
                    apiStatus.connected ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    WhatsApp: {apiStatus.checking ? 'Checking...' : apiStatus.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search chats"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Mobile Chat List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-xs">
                {isConnected ? 'Ready to receive messages' : 'Waiting for Pusher connection...'}
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className="p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
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
                      <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{chat.time}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      {chat.unread > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-500 rounded-full min-w-[20px] flex-shrink-0 ml-2">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-600 hidden md:block">Real-time messaging via Pusher</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600 hidden md:inline">
                Pusher: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${
                apiStatus.checking ? 'bg-yellow-500' : 
                apiStatus.connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600 hidden md:inline">
                WhatsApp: {apiStatus.checking ? 'Checking...' : apiStatus.connected ? 'Ready' : 'Setup needed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat List */}
        <div className="w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search chats"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-xs">
                  {isConnected ? 'Ready to receive messages' : 'Waiting for Pusher connection...'}
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedChat === chat.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
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
              ))
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex-col bg-gradient-to-b from-green-50 to-white hidden md:flex">
          {selectedChatData ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
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
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet</p>
                    <p className="text-sm">Start a conversation with {selectedChatData.name}</p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                        message.type === 'sent'
                          ? 'bg-green-500 text-white rounded-br-none' 
                          : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <p className={`text-xs ${
                            message.type === 'sent' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {message.type === 'sent' && (
                            <div className="flex">
                              {message.status === 'sending' && (
                                <div className="h-3 w-3 border-2 border-green-200 border-t-green-100 rounded-full animate-spin"></div>
                              )}
                              {message.status === 'sent' && (
                                <svg className="h-3 w-3 text-green-100" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
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
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
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
                <h3 className="text-xl font-medium text-gray-900 mb-2">Ready for Real-time Messages</h3>
                <p className="text-gray-600">Select a chat to start messaging</p>
                <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-600">
                      Pusher: {isConnected ? 'Ready' : 'Connecting...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
