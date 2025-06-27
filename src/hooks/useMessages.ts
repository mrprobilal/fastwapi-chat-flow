import { useState, useEffect, useCallback } from 'react';
import { usePusher } from './usePusher';
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

  // Full sync function
  const syncAllData = useCallback(async () => {
    setSyncStatus({ syncing: true, lastSync: null });
    
    try {
      console.log('🔄 Starting full data sync...');
      
      // Sync contacts and message history
      const { messages: syncedMessages, chats: syncedChats } = await whatsappService.syncAllMessageHistory();
      
      // Update state with synced data
      if (syncedMessages && syncedMessages.length > 0) {
        setMessages(syncedMessages);
      }
      
      if (syncedChats && syncedChats.length > 0) {
        setChats(syncedChats);
      }
      
      // Sync templates
      const syncedTemplates = await whatsappService.syncTemplates();
      if (syncedTemplates && syncedTemplates.length > 0) {
        setTemplates(syncedTemplates);
      }
      
      const syncTime = new Date();
      setSyncStatus({ syncing: false, lastSync: syncTime });
      
      toast.success(`✅ Synced ${syncedMessages?.length || 0} messages and ${syncedChats?.length || 0} contacts`);
      
    } catch (error: any) {
      console.error('❌ Sync failed:', error);
      setSyncStatus({ syncing: false, lastSync: null });
      toast.error(`Sync failed: ${error.message}`);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load existing data from localStorage first
        const savedTemplates = localStorage.getItem('whatsapp-templates');
        if (savedTemplates) {
          const parsedTemplates = JSON.parse(savedTemplates);
          setTemplates(parsedTemplates);
        }

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

        // Check WhatsApp API connection
        setApiStatus(prev => ({ ...prev, checking: true }));
        try {
          await whatsappService.testConnection();
          setApiStatus({ checking: false, connected: true });
          
          // If we have a connection and no local data, perform initial sync
          if ((!savedMessages || !savedChats) && window.confirm('Would you like to sync your WhatsApp contacts and message history?')) {
            await syncAllData();
          }
        } catch (error) {
          console.error('WhatsApp API connection failed:', error);
          setApiStatus({ checking: false, connected: false });
        }
      } catch (error) {
        console.error('❌ Error loading stored data:', error);
      }
    };

    loadInitialData();
  }, [deduplicateChats, syncAllData]);

  // ULTRA-ENHANCED message handling with MAXIMUM debugging
  const handleIncomingMessage = useCallback((data) => {
    console.log('🚨🚨🚨 ===== INCOMING DATA ANALYSIS =====');
    console.log('🚨 Raw Input Data:', data);
    console.log('🚨 Data Type:', typeof data);
    console.log('🚨 Data Constructor:', data?.constructor?.name);
    console.log('🚨 Is Array:', Array.isArray(data));
    console.log('🚨 Keys:', Object.keys(data || {}));
    console.log('🚨 JSON String:', JSON.stringify(data, null, 2));
    console.log('🚨🚨🚨 ===================================');
    
    // Save to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).lastProcessedData = {
        data,
        timestamp: new Date().toISOString(),
        processed: false
      };
    }
    
    try {
      let messageText = '';
      let senderPhone = '';
      let senderName = '';
      let timestamp = new Date().toISOString();
      let messageId = '';
      
      // ULTRA-COMPREHENSIVE parsing - try EVERY possible format
      console.log('🔍 Starting comprehensive data extraction...');
      
      // Try to extract ANY text content from ANYWHERE in the data
      const extractText = (obj, path = '') => {
        if (obj === null || obj === undefined) return null;
        
        if (typeof obj === 'string' && obj.trim().length > 0) {
          console.log(`📝 Found potential text at ${path}: "${obj}"`);
          return obj.trim();
        }
        
        if (typeof obj === 'object') {
          // Check common text fields first
          const textFields = ['text', 'body', 'message', 'content', 'msg'];
          for (const field of textFields) {
            if (obj[field] && typeof obj[field] === 'string' && obj[field].trim()) {
              console.log(`📝 Found text in ${path}.${field}: "${obj[field]}"`);
              return obj[field].trim();
            }
            if (obj[field]?.body && typeof obj[field].body === 'string' && obj[field].body.trim()) {
              console.log(`📝 Found text in ${path}.${field}.body: "${obj[field].body}"`);
              return obj[field].body.trim();
            }
          }
          
          // Recursively search all properties
          for (const [key, value] of Object.entries(obj)) {
            const newPath = path ? `${path}.${key}` : key;
            const result = extractText(value, newPath);
            if (result) return result;
          }
        }
        
        return null;
      };
      
      // Try to extract ANY phone number from ANYWHERE in the data
      const extractPhone = (obj, path = '') => {
        if (obj === null || obj === undefined) return null;
        
        if (typeof obj === 'string') {
          // Check if it looks like a phone number
          const phonePattern = /^[\+]?[1-9][\d]{7,14}$/;
          const cleanPhone = obj.replace(/\D/g, '');
          if (phonePattern.test(obj) || (cleanPhone.length >= 8 && cleanPhone.length <= 15)) {
            console.log(`📞 Found potential phone at ${path}: "${obj}"`);
            return obj;
          }
        }
        
        if (typeof obj === 'object') {
          // Check common phone fields first
          const phoneFields = ['from', 'phone', 'number', 'sender', 'wa_id', 'whatsapp_id'];
          for (const field of phoneFields) {
            if (obj[field] && typeof obj[field] === 'string') {
              const cleanPhone = obj[field].replace(/\D/g, '');
              if (cleanPhone.length >= 8 && cleanPhone.length <= 15) {
                console.log(`📞 Found phone in ${path}.${field}: "${obj[field]}"`);
                return obj[field];
              }
            }
          }
          
          // Recursively search all properties
          for (const [key, value] of Object.entries(obj)) {
            const newPath = path ? `${path}.${key}` : key;
            const result = extractPhone(value, newPath);
            if (result) return result;
          }
        }
        
        return null;
      };
      
      // Try to extract ANY name from ANYWHERE in the data
      const extractName = (obj, path = '') => {
        if (obj === null || obj === undefined) return null;
        
        if (typeof obj === 'string' && obj.trim().length > 0 && obj.trim().length < 100) {
          // Skip if it looks like a phone number
          const cleanString = obj.replace(/\D/g, '');
          if (cleanString.length < 8) {
            console.log(`👤 Found potential name at ${path}: "${obj}"`);
            return obj.trim();
          }
        }
        
        if (typeof obj === 'object') {
          // Check common name fields first
          const nameFields = ['name', 'contact_name', 'profile_name', 'display_name', 'user_name'];
          for (const field of nameFields) {
            if (obj[field] && typeof obj[field] === 'string' && obj[field].trim()) {
              console.log(`👤 Found name in ${path}.${field}: "${obj[field]}"`);
              return obj[field].trim();
            }
          }
          
          // Check nested profile/contact objects
          if (obj.profile?.name) {
            console.log(`👤 Found name in ${path}.profile.name: "${obj.profile.name}"`);
            return obj.profile.name;
          }
          if (obj.contact?.name) {
            console.log(`👤 Found name in ${path}.contact.name: "${obj.contact.name}"`);
            return obj.contact.name;
          }
        }
        
        return null;
      };
      
      // Extract data using our comprehensive functions
      messageText = extractText(data) || '';
      senderPhone = extractPhone(data) || '';
      senderName = extractName(data) || '';
      
      // Try specific FastWAPI format if general extraction didn't work
      if (!messageText || !senderPhone) {
        console.log('🔄 Trying FastWAPI-specific formats...');
        
        // Format patterns based on FastWAPI documentation
        const patterns = [
          // Standard WhatsApp webhook
          () => {
            const msg = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            const contacts = data?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
            return {
              text: msg?.text?.body || msg?.body,
              phone: msg?.from,
              name: contacts?.profile?.name
            };
          },
          // Direct message format
          () => ({
            text: data?.message || data?.text || data?.body,
            phone: data?.from || data?.phone || data?.sender,
            name: data?.name || data?.contact_name
          }),
          // Nested webhook format
          () => {
            const msg = data?.webhook?.messages?.[0] || data?.messages?.[0];
            return {
              text: msg?.text?.body || msg?.body || msg?.message,
              phone: msg?.from || msg?.phone,
              name: msg?.name || msg?.contact_name
            };
          }
        ];
        
        for (let i = 0; i < patterns.length; i++) {
          try {
            const result = patterns[i]();
            console.log(`🔍 Pattern ${i + 1} result:`, result);
            
            if (result.text && !messageText) messageText = result.text;
            if (result.phone && !senderPhone) senderPhone = result.phone;
            if (result.name && !senderName) senderName = result.name;
            
            if (messageText && senderPhone) break;
          } catch (error) {
            console.log(`❌ Pattern ${i + 1} failed:`, error);
          }
        }
      }
      
      console.log('🔥 FINAL EXTRACTED VALUES:');
      console.log(`📝 Message Text: "${messageText}"`);
      console.log(`📞 Sender Phone: "${senderPhone}"`);
      console.log(`👤 Sender Name: "${senderName}"`);
      
      // If we still don't have basic data, try one more desperate attempt
      if (!messageText && !senderPhone) {
        console.log('🆘 DESPERATE ATTEMPT - Looking for ANY text/phone patterns...');
        
        const dataString = JSON.stringify(data);
        console.log('🔍 Searching in JSON string:', dataString);
        
        // Look for phone patterns in the JSON string
        const phoneMatches = dataString.match(/[\+]?[1-9]\d{7,14}/g);
        if (phoneMatches && phoneMatches.length > 0) {
          senderPhone = phoneMatches[0];
          console.log(`📞 Found phone in JSON: ${senderPhone}`);
        }
        
        // Look for text patterns (quoted strings that aren't phone numbers)
        const textMatches = dataString.match(/"([^"]{1,500})"/g);
        if (textMatches) {
          for (const match of textMatches) {
            const text = match.slice(1, -1); // Remove quotes
            if (text.length > 3 && text.length < 500 && !/^\+?\d+$/.test(text)) {
              messageText = text;
              console.log(`📝 Found text in JSON: ${messageText}`);
              break;
            }
          }
        }
      }
      
      // Validation and processing
      if (messageText && senderPhone) {
        console.log('✅ SUCCESS! Found both message and phone');
        
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
        
        console.log('🚀 CREATING MESSAGE:', newMsg);
        
        // Update window debug info
        if (typeof window !== 'undefined') {
          (window as any).lastProcessedData.processed = true;
          (window as any).lastProcessedData.extractedMessage = newMsg;
        }
        
        // Add message
        setMessages(prev => {
          const updated = [...prev, newMsg];
          localStorage.setItem('whatsapp-messages', JSON.stringify(updated));
          console.log('💾 Messages saved, total count:', updated.length);
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
        
      } else {
        console.error('❌ FAILED TO EXTRACT REQUIRED DATA');
        console.error(`❌ messageText: "${messageText}"`);
        console.error(`❌ senderPhone: "${senderPhone}"`);
        console.error('❌ Raw data was:', data);
        
        // Still show a notification so user knows something came through
        toast.error(`⚠️ Received data but couldn't parse message. Check console for details.`);
        
        // Save failed parsing attempt for debugging
        if (typeof window !== 'undefined') {
          if (!(window as any).failedParsingAttempts) {
            (window as any).failedParsingAttempts = [];
          }
          (window as any).failedParsingAttempts.push({
            data,
            timestamp: new Date().toISOString(),
            extractedText: messageText,
            extractedPhone: senderPhone
          });
        }
      }
      
    } catch (error) {
      console.error('💥 CRITICAL ERROR processing message:', error);
      console.error('💥 Stack trace:', error.stack);
      console.error('💥 Original data:', data);
      toast.error(`❌ Error processing message: ${error.message}`);
    }
  }, [addOrUpdateChat]);

  // Set up message subscription when connected
  useEffect(() => {
    if (isConnected) {
      console.log('🔌 Pusher connected - setting up ultra-comprehensive message subscription...');
      subscribeToMessages(handleIncomingMessage);
      
      // Test event listener for debugging
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
    syncStatus,
    setMessages,
    setChats,
    addOrUpdateChat,
    normalizePhoneNumber,
    syncAllData
  };
};
