
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

  // Enhanced message handling for fastwapi format
  const handleIncomingMessage = useCallback((data) => {
    console.log('📨 ===== PROCESSING FASTWAPI MESSAGE =====');
    console.log('📨 Raw fastwapi data:', JSON.stringify(data, null, 2));
    
    try {
      let messageText = '';
      let senderPhone = '';
      let senderName = '';
      let timestamp = new Date().toISOString();
      
      // Strategy 1: Standard fastwapi webhook format
      if (data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = data.entry[0].changes[0].value.messages[0];
        messageText = message.text?.body || message.body || '';
        senderPhone = message.from || '';
        
        if (message.timestamp) {
          timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString();
        }
        
        // Get contact info
        const contacts = data.entry[0].changes[0].value.contacts;
        if (contacts?.[0]?.profile?.name) {
          senderName = contacts[0].profile.name;
        }
      }
      
      // Strategy 2: Direct message format
      else if (data.message || data.text || data.body) {
        messageText = data.message || data.text || data.body;
        senderPhone = data.from || data.phone || data.sender;
        senderName = data.contact_name || data.name;
      }
      
      // Strategy 3: Nested formats
      else if (data.messages?.[0]) {
        const msg = data.messages[0];
        messageText = msg.text?.body || msg.body || msg.message || '';
        senderPhone = msg.from || msg.phone || '';
        senderName = msg.contact_name || msg.name || '';
      }
      
      console.log('📨 Extracted fastwapi values:');
      console.log('  - Message:', messageText);
      console.log('  - Phone:', senderPhone);
      console.log('  - Name:', senderName);
      
      if (!messageText || !senderPhone) {
        console.warn('❌ Invalid fastwapi message - missing required data');
        return;
      }
      
      const formattedPhone = senderPhone.startsWith('+') ? senderPhone : `+${senderPhone}`;
      
      const newMsg = {
        id: Date.now() + Math.random(),
        from: formattedPhone,
        to: 'business',
        text: messageText,
        timestamp: timestamp,
        type: 'received',
        status: 'delivered',
        contact_name: senderName || formattedPhone
      };
      
      console.log('✅ Creating fastwapi message:', newMsg);
      
      // Add message
      setMessages(prev => {
        const updated = [...prev, newMsg];
        localStorage.setItem('whatsapp-messages', JSON.stringify(updated));
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
      
      addOrUpdateChat(chatUpdate);
      toast.success(`📨 New message from ${senderName || formattedPhone}!`);
      
    } catch (error) {
      console.error('❌ Error processing fastwapi message:', error);
      toast.error(`Error processing message: ${error.message}`);
    }
  }, [addOrUpdateChat]);

  // Set up message subscription
  useEffect(() => {
    if (isConnected) {
      console.log('🔌 Pusher connected - subscribing to fastwapi messages...');
      subscribeToMessages(handleIncomingMessage);
    } else {
      console.log('❌ Pusher not connected - waiting...');
    }

    return () => {
      unsubscribeFromMessages();
    };
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
