
import { useState, useEffect, useCallback } from 'react';
import { usePusher } from './usePusher';
import { whatsappService } from '../services/whatsappService';
import { toast } from 'sonner';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [apiStatus, setApiStatus] = useState({ checking: false, connected: false });

  const { isConnected, subscribeToMessages, unsubscribeFromMessages } = usePusher();

  // Helper function to normalize phone numbers
  const normalizePhoneNumber = useCallback((phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('1') ? `+${digits}` : `+${digits}`;
  }, []);

  // Helper function to deduplicate chats by phone number
  const deduplicateChats = useCallback((chatList) => {
    const seen = new Set();
    return chatList.filter(chat => {
      const normalizedPhone = normalizePhoneNumber(chat.phone);
      if (seen.has(normalizedPhone)) {
        return false;
      }
      seen.add(normalizedPhone);
      return true;
    });
  }, [normalizePhoneNumber]);

  // Helper function to safely add or update chat
  const addOrUpdateChat = useCallback((newChat) => {
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
  }, [normalizePhoneNumber, deduplicateChats]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = () => {
      try {
        // Load templates
        const savedTemplates = localStorage.getItem('whatsapp-templates');
        if (savedTemplates) {
          const parsedTemplates = JSON.parse(savedTemplates);
          setTemplates(parsedTemplates);
        }

        // Load messages
        const savedMessages = localStorage.getItem('whatsapp-messages');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        }
        
        // Load chats
        const savedChats = localStorage.getItem('whatsapp-chats');
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
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

    // Check WhatsApp API connection
    const checkWhatsAppConnection = async () => {
      setApiStatus(prev => ({ ...prev, checking: true }));
      try {
        await whatsappService.testConnection();
        setApiStatus({ checking: false, connected: true });
      } catch (error) {
        console.error('WhatsApp API connection failed:', error);
        setApiStatus({ checking: false, connected: false });
      }
    };

    loadInitialData();
    checkWhatsAppConnection();
  }, [deduplicateChats]);

  // Enhanced message handling with comprehensive debugging
  const handleIncomingMessage = useCallback((data) => {
    console.log('🔥 ===== INCOMING WEBHOOK DATA =====');
    console.log('🔥 Complete Raw Data:', JSON.stringify(data, null, 2));
    console.log('🔥 Data Keys:', Object.keys(data || {}));
    console.log('🔥 Data Type:', typeof data);
    console.log('🔥 ===================================');
    
    try {
      let messageText = '';
      let senderPhone = '';
      let senderName = '';
      let timestamp = new Date().toISOString();
      let messageId = '';
      
      // COMPREHENSIVE WEBHOOK PARSING - All possible formats
      
      // Format 1: Standard WhatsApp Webhook (most common)
      if (data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        console.log('🔍 Using Format 1: Standard WhatsApp Webhook');
        const webhook = data.entry[0].changes[0].value;
        const message = webhook.messages[0];
        
        messageText = message.text?.body || message.body || '';
        senderPhone = message.from || '';
        messageId = message.id || '';
        
        if (message.timestamp) {
          timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();
        }
        
        // Get contact info
        const contacts = webhook.contacts;
        if (contacts?.[0]?.profile?.name) {
          senderName = contacts[0].profile.name;
        }
        
        console.log('✅ Webhook Format 1 - Extracted:', { messageText, senderPhone, senderName, messageId });
      }
      
      // Format 2: Simplified webhook format
      else if (data.messages?.[0]) {
        console.log('🔍 Using Format 2: Simplified Webhook');
        const msg = data.messages[0];
        messageText = msg.text?.body || msg.body || msg.message || '';
        senderPhone = msg.from || msg.phone || '';
        senderName = msg.contact_name || msg.name || '';
        messageId = msg.id || '';
        
        console.log('✅ Webhook Format 2 - Extracted:', { messageText, senderPhone, senderName, messageId });
      }
      
      // Format 3: Direct message properties
      else if (data.message || data.text || data.body) {
        console.log('🔍 Using Format 3: Direct Properties');
        messageText = data.message || data.text || data.body;
        senderPhone = data.from || data.phone || data.sender || data.number;
        senderName = data.contact_name || data.name || data.contact?.name;
        messageId = data.id || data.message_id || '';
        
        console.log('✅ Direct Format 3 - Extracted:', { messageText, senderPhone, senderName, messageId });
      }
      
      // Format 4: Nested webhook data
      else if (data.webhook?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        console.log('🔍 Using Format 4: Nested Webhook');
        const webhook = data.webhook.entry[0].changes[0].value;
        const message = webhook.messages[0];
        
        messageText = message.text?.body || message.body || '';
        senderPhone = message.from || '';
        messageId = message.id || '';
        
        if (message.timestamp) {
          timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();
        }
        
        const contacts = webhook.contacts;
        if (contacts?.[0]?.profile?.name) {
          senderName = contacts[0].profile.name;
        }
        
        console.log('✅ Nested Format 4 - Extracted:', { messageText, senderPhone, senderName, messageId });
      }
      
      // Format 5: Any other nested formats
      else {
        console.log('🔍 Using Format 5: Fallback Search');
        
        // Deep search for message text
        const searchForText = (obj, path = '') => {
          if (typeof obj !== 'object' || obj === null) return null;
          
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if ((key === 'body' || key === 'text' || key === 'message') && typeof value === 'string' && value.trim()) {
              console.log(`📝 Found text at ${currentPath}:`, value);
              return value;
            }
            
            if (typeof value === 'object' && value !== null) {
              const result = searchForText(value, currentPath);
              if (result) return result;
            }
          }
          return null;
        };
        
        // Deep search for phone number
        const searchForPhone = (obj, path = '') => {
          if (typeof obj !== 'object' || obj === null) return null;
          
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if ((key === 'from' || key === 'phone' || key === 'sender' || key === 'number') && typeof value === 'string' && value.trim()) {
              console.log(`📞 Found phone at ${currentPath}:`, value);
              return value;
            }
            
            if (typeof value === 'object' && value !== null) {
              const result = searchForPhone(value, currentPath);
              if (result) return result;
            }
          }
          return null;
        };
        
        // Deep search for name
        const searchForName = (obj, path = '') => {
          if (typeof obj !== 'object' || obj === null) return null;
          
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if ((key === 'name' || key === 'contact_name') && typeof value === 'string' && value.trim()) {
              console.log(`👤 Found name at ${currentPath}:`, value);
              return value;
            }
            
            if (typeof value === 'object' && value !== null) {
              const result = searchForName(value, currentPath);
              if (result) return result;
            }
          }
          return null;
        };
        
        messageText = searchForText(data) || '';
        senderPhone = searchForPhone(data) || '';
        senderName = searchForName(data) || '';
        
        console.log('✅ Fallback Format 5 - Extracted:', { messageText, senderPhone, senderName });
      }
      
      console.log('🔥 FINAL EXTRACTED VALUES:');
      console.log(`📝 Message Text: "${messageText}"`);
      console.log(`📞 Sender Phone: "${senderPhone}"`);
      console.log(`👤 Sender Name: "${senderName}"`);
      console.log(`🆔 Message ID: "${messageId}"`);
      console.log(`⏰ Timestamp: "${timestamp}"`);
      
      // Validation
      if (!messageText) {
        console.error('❌ NO MESSAGE TEXT FOUND!');
        console.log('🔍 Trying to find any text-like content...');
        
        // Last resort - look for any string values that might be the message
        const findAnyText = (obj) => {
          if (typeof obj === 'string' && obj.length > 0 && obj.length < 1000) {
            return obj;
          }
          if (typeof obj === 'object' && obj !== null) {
            for (const value of Object.values(obj)) {
              const result = findAnyText(value);
              if (result) return result;
            }
          }
          return null;
        };
        
        const fallbackText = findAnyText(data);
        if (fallbackText) {
          console.log('🔧 Found fallback text:', fallbackText);
          messageText = fallbackText;
        }
      }
      
      if (!senderPhone) {
        console.error('❌ NO SENDER PHONE FOUND!');
        console.log('🔍 Trying to find any phone-like content...');
        
        // Look for any numeric string that could be a phone
        const findAnyPhone = (obj) => {
          if (typeof obj === 'string' && /^\+?\d{10,15}$/.test(obj.replace(/\s+/g, ''))) {
            return obj;
          }
          if (typeof obj === 'object' && obj !== null) {
            for (const value of Object.values(obj)) {
              const result = findAnyPhone(value);
              if (result) return result;
            }
          }
          return null;
        };
        
        const fallbackPhone = findAnyPhone(data);
        if (fallbackPhone) {
          console.log('🔧 Found fallback phone:', fallbackPhone);
          senderPhone = fallbackPhone;
        }
      }
      
      if (!messageText || !senderPhone) {
        console.error('❌ CRITICAL: Missing required data after all attempts');
        console.error(`❌ messageText: "${messageText}"`);
        console.error(`❌ senderPhone: "${senderPhone}"`);
        toast.error('⚠️ Received invalid message data - cannot process');
        return;
      }
      
      const formattedPhone = senderPhone.startsWith('+') ? senderPhone : `+${senderPhone}`;
      
      const newMsg = {
        id: messageId || (Date.now() + Math.random()),
        from: formattedPhone,
        to: 'business',
        text: messageText,
        timestamp: timestamp,
        type: 'received',
        status: 'delivered',
        contact_name: senderName || formattedPhone
      };
      
      console.log('🚀 CREATING NEW MESSAGE:', newMsg);
      
      // Add message
      setMessages(prev => {
        const updated = [...prev, newMsg];
        localStorage.setItem('whatsapp-messages', JSON.stringify(updated));
        console.log('💾 Saved messages to localStorage, total:', updated.length);
        return updated;
      });
      
      // Add/update chat
      const chatUpdate = {
        id: formattedPhone,
        name: senderName || formattedPhone,
        phone: formattedPhone,
        lastMessage: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: 1,
        avatar: (senderName || formattedPhone).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        online: true
      };
      
      console.log('💬 UPDATING CHAT:', chatUpdate);
      addOrUpdateChat(chatUpdate);
      
      toast.success(`📨 New message from ${senderName || formattedPhone}: ${messageText.substring(0, 50)}...`);
      console.log('🎉 ===== MESSAGE PROCESSING COMPLETE =====');
      
    } catch (error) {
      console.error('💥 CRITICAL ERROR processing message:', error);
      console.error('💥 Stack trace:', error.stack);
      toast.error(`❌ Error processing message: ${error.message}`);
    }
  }, [addOrUpdateChat]);

  // Set up message subscription with comprehensive event handling
  useEffect(() => {
    if (isConnected) {
      console.log('🔌 Pusher connected - setting up message subscription...');
      subscribeToMessages(handleIncomingMessage);
      
      // Also listen for test messages
      const handleTestMessage = (event) => {
        console.log('🧪 Test message received:', event.detail);
        handleIncomingMessage(event.detail);
      };
      
      window.addEventListener('test-pusher-message', handleTestMessage);
      
      return () => {
        console.log('🔌 Cleaning up message subscriptions...');
        window.removeEventListener('test-pusher-message', handleTestMessage);
        unsubscribeFromMessages();
      };
    } else {
      console.log('❌ Pusher not connected - waiting for connection...');
    }
  }, [isConnected, subscribeToMessages, unsubscribeFromMessages, handleIncomingMessage]);

  return {
    messages,
    chats,
    templates,
    apiStatus,
    setMessages,
    setChats,
    addOrUpdateChat,
    normalizePhoneNumber
  };
};
