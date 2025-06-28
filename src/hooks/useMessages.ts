import { useState, useEffect, useCallback } from 'react';
import { usePusher } from './usePusher';
import { fastwAPIService } from '../services/fastwAPIService';
import { whatsappService } from '../services/whatsappService';
import { toast } from 'sonner';

export const useMessages = () => {
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [apiStatus, setApiStatus] = useState({ checking: false, connected: false });
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSync: null });

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

  // Enhanced message handling for webhook events
  const handleIncomingMessage = useCallback((data) => {
    console.log('🚨 Webhook Message Received:', data);
    
    try {
      let messageText = '';
      let senderPhone = '';
      let senderName = '';
      let timestamp = new Date().toISOString();
      
      // Handle webhook format: { from: "phone", text: "message" }
      if (data.from && data.text) {
        messageText = data.text;
        senderPhone = data.from;
        senderName = data.name || data.from;
      }
      // Handle FastWAPI format
      else if (data.value && data.phone) {
        messageText = data.value;
        senderPhone = data.phone;
        senderName = data.contact_name || data.name;
        timestamp = data.created_at || timestamp;
      }
      // Handle nested message format
      else if (data.message) {
        messageText = data.message.value || data.message.text || data.message;
        senderPhone = data.message.phone || data.phone;
        senderName = data.message.contact_name || data.contact_name;
        timestamp = data.message.created_at || data.created_at || timestamp;
      }
      // Try to extract from any nested structure
      else {
        const extractValue = (obj, key) => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj[key]) return obj[key];
          for (const prop in obj) {
            if (typeof obj[prop] === 'object') {
              const result = extractValue(obj[prop], key);
              if (result) return result;
            }
          }
          return null;
        };

        messageText = extractValue(data, 'value') || extractValue(data, 'text') || extractValue(data, 'message') || '';
        senderPhone = extractValue(data, 'phone') || extractValue(data, 'from') || '';
        senderName = extractValue(data, 'contact_name') || extractValue(data, 'name') || '';
      }
      
      if (messageText && senderPhone) {
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
        
        console.log('✅ Processed webhook message:', newMsg);
        
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
        toast.success(`📨 New message from ${senderName || formattedPhone}: ${messageText.substring(0, 50)}...`);
        
      } else {
        console.error('❌ Could not extract message data:', data);
        toast.error('⚠️ Received data but couldn\'t parse message');
      }
      
    } catch (error) {
      console.error('💥 Error processing webhook message:', error);
      toast.error(`❌ Error processing message: ${error.message}`);
    }
  }, [addOrUpdateChat]);

  // FastWAPI sync function
  const syncAllData = useCallback(async () => {
    setSyncStatus({ syncing: true, lastSync: null });
    
    try {
      console.log('🔄 Starting FastWAPI sync...');
      
      const { messages: syncedMessages, chats: syncedChats } = await fastwAPIService.syncAllData();
      
      // Update state with synced data
      if (syncedMessages && syncedMessages.length > 0) {
        setMessages(syncedMessages);
      }
      
      if (syncedChats && syncedChats.length > 0) {
        setChats(syncedChats);
      }
      
      const syncTime = new Date();
      setSyncStatus({ syncing: false, lastSync: syncTime });
      
      toast.success(`✅ Synced ${syncedMessages?.length || 0} messages and ${syncedChats?.length || 0} contacts from FastWAPI`);
      
    } catch (error: any) {
      console.error('❌ FastWAPI sync failed:', error);
      setSyncStatus({ syncing: false, lastSync: null });
      toast.error(`FastWAPI sync failed: ${error.message}`);
    }
  }, []);

  // Sync templates function
  const syncTemplates = useCallback(async () => {
    try {
      console.log('🔄 Syncing templates from FastWAPI...');
      const syncedTemplates = await whatsappService.syncTemplates();
      setTemplates(syncedTemplates);
      toast.success(`✅ Synced ${syncedTemplates.length} templates from FastWAPI`);
    } catch (error: any) {
      console.error('❌ Template sync failed:', error);
      toast.error(`Template sync failed: ${error.message}`);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load existing data from localStorage first
        const savedMessages = localStorage.getItem('whatsapp-messages');
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        }
        
        const savedChats = localStorage.getItem('whatsapp-chats');
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          const deduplicatedChats = deduplicateChats(parsedChats);
          setChats(deduplicatedChats);
          if (deduplicatedChats.length !== parsedChats.length) {
            localStorage.setItem('whatsapp-chats', JSON.stringify(deduplicatedChats));
          }
        }

        const savedTemplates = localStorage.getItem('whatsapp-templates');
        if (savedTemplates) {
          const parsedTemplates = JSON.parse(savedTemplates);
          setTemplates(parsedTemplates);
        }

        // Check FastWAPI connection
        setApiStatus(prev => ({ ...prev, checking: true }));
        try {
          await fastwAPIService.testConnection();
          setApiStatus({ checking: false, connected: true });
          
          // If we have a connection and no local data, perform initial sync
          if ((!savedMessages || !savedChats) && window.confirm('Would you like to sync your WhatsApp data from FastWAPI?')) {
            await syncAllData();
          }

          // If no templates, sync them
          if (!savedTemplates) {
            await syncTemplates();
          }
        } catch (error) {
          console.error('FastWAPI connection failed:', error);
          setApiStatus({ checking: false, connected: false });
          toast.error(`FastWAPI connection failed: ${error.message}`);
        }
      } catch (error) {
        console.error('❌ Error loading stored data:', error);
      }
    };

    loadInitialData();
  }, [deduplicateChats, syncAllData, syncTemplates]);

  // Set up message subscription when connected
  useEffect(() => {
    if (isConnected) {
      console.log('🔌 Pusher connected - setting up webhook message subscription...');
      subscribeToMessages(handleIncomingMessage);
      
      return () => {
        console.log('🔌 Cleaning up webhook message subscriptions...');
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
    syncStatus,
    setMessages,
    setChats,
    setTemplates,
    addOrUpdateChat,
    normalizePhoneNumber,
    syncAllData,
    syncTemplates
  };
};
