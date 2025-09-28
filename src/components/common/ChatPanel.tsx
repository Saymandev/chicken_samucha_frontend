import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    CheckCheck,
    Download,
    FileText,
    Image,
    Minimize2,
    Paperclip,
    Send,
    Smile,
    User,
    X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import io, { Socket } from 'socket.io-client';
import { useStore } from '../../store/useStore';
import { chatAPI } from '../../utils/api';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'admin';
  message: string;
  messageType?: 'text' | 'image' | 'file';
  attachments?: Array<{
    type: string;
    url: string;
    filename: string;
    size?: number;
  }>;
  timestamp: string;
  isRead: boolean;
}

interface ChatSession {
  id: string;
  chatId: string;
  isActive: boolean;
  adminAssigned?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, language } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Guest form for non-authenticated users
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: ''
  });
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  // File attachment and emoji states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSocket = useCallback((chatId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rest.ourb.live/api';
    const socketURL = API_BASE_URL.replace('/api', '');

    socketRef.current = io(socketURL, {
      auth: { token },
      query: { chatId },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server');
    });

    socketRef.current.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark message as read if panel is open
      if (isOpen && message.senderType === 'admin') {
        markMessageAsRead(message.id);
      }
    });

    socketRef.current.on('admin_typing', (data: { isTyping: boolean }) => {
      setAdminTyping(data.isTyping);
    });

    socketRef.current.on('message_read', (data: { messageId: string }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, isRead: true } : msg
      ));
    });
  }, [isOpen]);

  const initializeChat = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Starting chat initialization for user:', user);
      console.log('User authentication status:', isAuthenticated);
      console.log('Auth token exists:', !!localStorage.getItem('token'));
      
      // First, try to get existing active chat sessions for this user
      try {
        console.log('Checking for existing chat sessions...');
        const existingSessionsResponse = await chatAPI.getChatSessions({ 
          userId: user.id, 
          status: 'active',
          limit: 1 
        });
        
        if (existingSessionsResponse.data.sessions && existingSessionsResponse.data.sessions.length > 0) {
          const existingSession = existingSessionsResponse.data.sessions[0];
          console.log('Found existing session:', existingSession);
          
          const finalChatId = existingSession.chatId || existingSession.id;
          const sessionWithChatId = { ...existingSession, chatId: finalChatId };
          
          console.log('Using existing session:', sessionWithChatId);
          setChatSession(sessionWithChatId);
          
          // Load messages for existing session
          if (finalChatId) {
            console.log('Loading messages for existing chatId:', finalChatId);
            try {
              const messagesResponse = await chatAPI.getChatMessages(finalChatId);
              console.log('Messages response:', messagesResponse);
              console.log('Messages data:', messagesResponse.data);
              
              const loadedMessages = messagesResponse.data.data?.messages || messagesResponse.data.messages || [];
              console.log('Final messages to set:', loadedMessages);
              console.log('Setting messages state with:', loadedMessages.length, 'messages');
              setMessages(loadedMessages);
            } catch (messageError: any) {
              console.error('Failed to load messages:', messageError);
              setMessages([]);
            }
          }
          
          // Initialize socket connection
          console.log('Initializing socket with existing chatId:', finalChatId);
          initializeSocket(finalChatId);
          return;
        }
      } catch (existingSessionError) {
        console.log('No existing sessions found or error:', existingSessionError);
      }
      
      // If no existing session, create a new one
      console.log('Creating new chat session...');
      const sessionData = {
        customerInfo: {
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          isAnonymous: false
        },
        category: 'general'
      };
      
      console.log('Sending session data:', sessionData);
      const response = await chatAPI.startChatSession(sessionData);
      console.log('Full response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.data) {
        console.log('Response data keys:', Object.keys(response.data));
        console.log('Response data success:', response.data.success);
        console.log('Response data message:', response.data.message);
      }
      
      // Check if the response indicates success
      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || 'Backend returned error response');
      }
      
      // Handle different response structures - the session is nested in data.data.chatSession
      const chatSessionData = response.data.data?.chatSession || response.data.chatSession || response.data.session || response.data;
      console.log('Extracted session data:', chatSessionData);
      
      if (chatSessionData && typeof chatSessionData === 'object') {
        console.log('Session data keys:', Object.keys(chatSessionData));
        console.log('Session chatId:', chatSessionData.chatId);
        console.log('Session id:', chatSessionData.id);
      }
      
      if (!chatSessionData || (!chatSessionData.chatId && !chatSessionData.id)) {
        console.error('Session validation failed - no valid chatId found');
        throw new Error(`Invalid session data received from server. Response structure: ${JSON.stringify(response.data)}`);
      }
      
      // Use chatId or id as fallback
      const finalChatId = chatSessionData.chatId || chatSessionData.id;
      const sessionWithChatId = { ...chatSessionData, chatId: finalChatId };
      
      console.log('Final session data:', sessionWithChatId);
      setChatSession(sessionWithChatId);
      
      // Load existing messages
      if (finalChatId) {
        console.log('Loading messages for chatId:', finalChatId);
        try {
          const messagesResponse = await chatAPI.getChatMessages(finalChatId);
          console.log('Messages response:', messagesResponse);
          console.log('Messages data:', messagesResponse.data);
          console.log('Messages array:', messagesResponse.data.messages);
          console.log('Messages count:', messagesResponse.data.messages?.length || 0);
          
          const loadedMessages = messagesResponse.data.data?.messages || messagesResponse.data.messages || [];
          console.log('Final messages to set:', loadedMessages);
          console.log('Setting messages state with:', loadedMessages.length, 'messages');
          setMessages(loadedMessages);
        } catch (messageError: any) {
          console.error('Failed to load messages:', messageError);
          console.error('Message error details:', messageError.response?.data || messageError.message);
          // Don't fail the whole chat initialization if messages fail to load
          setMessages([]);
        }
      } else {
        console.log('No chatId available, skipping message loading');
      }
      
      // Initialize socket connection
      console.log('Initializing socket with chatId:', finalChatId);
      initializeSocket(finalChatId);
    } catch (error: any) {
      console.error('Failed to initialize chat:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Full error object:', error);
      toast.error(`Failed to connect to chat: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, initializeSocket, isAuthenticated]);

  // Initialize chat when panel opens
  useEffect(() => {
    console.log('ChatPanel useEffect triggered:', { isOpen, isAuthenticated, user: !!user });
    if (isOpen && isAuthenticated && user) {
      console.log('Starting chat initialization...');
      initializeChat();
    } else if (isOpen && !isAuthenticated) {
      console.log('Guest user - showing guest form');
      setShowGuestForm(false);
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, isAuthenticated, user, initializeChat]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !chatSession) return;

    try {
      const formData = new FormData();
      formData.append('chatId', chatSession.chatId);
      
      if (newMessage.trim()) {
        formData.append('message', newMessage.trim());
      }
      
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      // Send message via API (not socket for file uploads)
      const response = await chatAPI.sendMessage(formData);
      
      // Add message to local state immediately
      const tempMessage: Message = {
        id: response.data.chatMessage?.id || `temp-${Date.now()}`,
        senderId: user?.id || 'anonymous',
        senderName: user?.name || 'You',
        senderType: 'user',
        message: newMessage.trim() || `Sent ${selectedFile ? selectedFile.name : 'a file'}`,
        messageType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
        attachments: selectedFile ? [{
          type: selectedFile.type.startsWith('image/') ? 'image' : 'document',
          url: URL.createObjectURL(selectedFile),
          filename: selectedFile.name,
          size: selectedFile.size
        }] : [],
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setSelectedFile(null);
      
      // Emit real-time notification through socket
      if (socketRef.current) {
        socketRef.current.emit('new_message', {
          chatId: chatSession.chatId,
          message: tempMessage
        });
        
        // Stop typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socketRef.current.emit('stop_typing', { chatId: chatSession.chatId });
        setIsTyping(false);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!socketRef.current || !chatSession) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('start_typing', { chatId: chatSession.chatId });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { chatId: chatSession.chatId });
      }
    }, 2000);
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await chatAPI.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.name || !guestForm.email) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const sessionData = {
        customerInfo: {
          name: guestForm.name,
          email: guestForm.email,
          phone: guestForm.phone || '',
          subject: guestForm.subject || 'General Inquiry',
          isAnonymous: false
        },
        category: 'general'
      };
      
      const response = await chatAPI.startChatSession(sessionData);
      console.log('Guest chat response:', response.data);
      
      const chatSessionData = response.data.data?.chatSession || response.data.chatSession || response.data.session || response.data;
      if (!chatSessionData || !chatSessionData.chatId) {
        throw new Error('Invalid session data received from server');
      }
      
      setChatSession(chatSessionData);
      setShowGuestForm(false);
      setIsAnonymous(false);
      
      // Initialize socket for guest
      initializeSocket(chatSessionData.chatId);
      
      toast.success('Chat session started');
    } catch (error) {
      console.error('Failed to create guest session:', error);
      toast.error('Failed to start chat session');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed bottom-20 right-6 bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-2xl z-50 flex flex-col ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-96'
        }`}
        style={{ maxHeight: isMinimized ? '64px' : '500px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              {isConnected && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {language === 'bn' ? 'গ্রাহক সেবা' : 'Customer Support'}
              </h3>
              <p className="text-xs text-white/80">
                {isConnected 
                  ? (language === 'bn' ? 'অনলাইন' : 'Online')
                  : (language === 'bn' ? 'সংযোগ করা হচ্ছে...' : 'Connecting...')
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-800" style={{ maxHeight: '300px' }}>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : !isAuthenticated && showGuestForm ? (
                // Guest Form
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {language === 'bn' ? 'আপনার তথ্য দিন' : 'Please provide your details'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'bn' ? 'আমরা আপনাকে সাহায্য করতে পারি' : 'So we can assist you better'}
                    </p>
                  </div>
                  
                  <form onSubmit={handleGuestSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'আপনার নাম *' : 'Your Name *'}
                      value={guestForm.name}
                      onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                    <input
                      type="email"
                      placeholder={language === 'bn' ? 'ইমেইল *' : 'Email *'}
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                    <input
                      type="tel"
                      placeholder={language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder={language === 'bn' ? 'বিষয়' : 'Subject'}
                      value={guestForm.subject}
                      onChange={(e) => setGuestForm({ ...guestForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                      {language === 'bn' ? 'চ্যাট শুরু করুন' : 'Start Chat'}
                    </button>
                  </form>
                  
                  <button
                    onClick={() => setShowGuestForm(false)}
                    className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    {language === 'bn' ? 'বেনামে চ্যাট করুন' : 'Chat anonymously'}
                  </button>
                </div>
              ) : (
                // Messages
                <>
                  {(() => {
                    console.log('Rendering messages, count:', messages.length);
                    console.log('Messages array:', messages);
                    return messages.length === 0;
                  })() ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                        {language === 'bn' ? 'স্বাগতম!' : 'Welcome!'}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {language === 'bn' 
                          ? 'আমরা আপনাকে সাহায্য করতে এখানে আছি।' 
                          : 'We\'re here to help you.'
                        }
                      </p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-2xl ${
                            message.senderType === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {/* Message text */}
                          {message.message && (
                            <p className="text-sm mb-2">{message.message}</p>
                          )}
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, idx) => (
                                <div key={idx} className="border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                                  {attachment.type === 'image' ? (
                                    <div>
                                      <img 
                                        src={attachment.url} 
                                        alt={attachment.filename}
                                        className="max-w-full h-auto rounded cursor-pointer"
                                        onClick={() => window.open(attachment.url, '_blank')}
                                      />
                                      <p className="text-xs mt-1 flex items-center">
                                        <Image className="w-3 h-3 mr-1" />
                                        {attachment.filename}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        <div>
                                          <p className="text-xs font-medium">{attachment.filename}</p>
                                          {attachment.size && (
                                            <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => window.open(attachment.url, '_blank')}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                                      >
                                        <Download className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className={`flex items-center justify-between mt-1 ${
                            message.senderType === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <span className="text-xs">{formatTime(message.timestamp)}</span>
                            {message.senderType === 'user' && (
                              <div className="ml-2">
                                {message.isRead ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {adminTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            {(!isAuthenticated && !showGuestForm && isAnonymous) ? (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <button
                  onClick={() => setShowGuestForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  {language === 'bn' ? 'তথ্য দিয়ে চ্যাট শুরু করুন' : 'Start Chat with Details'}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const sessionData = {
                        customerInfo: {
                          name: 'Anonymous User',
                          email: '',
                          phone: '',
                          isAnonymous: true
                        },
                        category: 'general'
                      };
                      
                      const response = await chatAPI.startChatSession(sessionData);
                      console.log('Anonymous chat response:', response.data);
                      
                      const chatSessionData = response.data.data?.chatSession || response.data.chatSession || response.data.session || response.data;
                      if (!chatSessionData || !chatSessionData.chatId) {
                        throw new Error('Invalid session data received from server');
                      }
                      
                      setChatSession(chatSessionData);
                      setIsAnonymous(false);
                      
                      // Initialize socket for anonymous user
                      initializeSocket(chatSessionData.chatId);
                      
                      toast.success('Anonymous chat started');
                    } catch (error) {
                      console.error('Failed to start anonymous chat:', error);
                      toast.error('Failed to start anonymous chat');
                    }
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors"
                >
                  {language === 'bn' ? 'বেনামে চ্যাট করুন' : 'Chat Anonymously'}
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {selectedFile.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-blue-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={removeSelectedFile}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3">
                  <div className="flex items-end space-x-2">
                    {/* Emoji Picker */}
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        disabled={!chatSession}
                      >
                        <Smile className="w-4 h-4 text-gray-500" />
                      </button>
                      
                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-10">
                          <div className="grid grid-cols-8 gap-1 w-64">
                            {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'].map((emoji, index) => (
                              <button
                                key={index}
                                onClick={() => handleEmojiSelect(emoji)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* File Upload */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      disabled={!chatSession}
                    >
                      <Paperclip className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                    />

                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder={language === 'bn' ? 'একটি বার্তা লিখুন...' : 'Type a message...'}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        disabled={!chatSession}
                      />
                    </div>
                    
                    {/* Send Button */}
                    <button
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || !chatSession}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full transition-colors disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatPanel;
