import { motion } from 'framer-motion';
import { Clock, MessageCircle, Paperclip, Phone, Send, Smile, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import io, { Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';
import { chatAPI } from '../utils/api';

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

const ChatPage: React.FC = () => {
  // const { t } = useTranslation(); // Unused variable
  const { user, isAuthenticated } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
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

  // Initialize chat when component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeChat();
    } else if (!isAuthenticated) {
      // For non-authenticated users, show anonymous option first
      setShowGuestForm(false);
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

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

  const initializeChat = async () => {
    setIsLoading(true);
    try {
     
      
      const customerInfo = isAuthenticated ? {
        name: user?.name || 'User',
        phone: user?.phone || '',
        email: user?.email || ''
      } : isAnonymous ? {
        name: 'Anonymous User',
        phone: '',
        email: '',
        isAnonymous: true
      } : guestForm;
      
      
      
      // Start or get existing chat session
      const response = await chatAPI.startChatSession({
        customerInfo,
        category: 'general'
      });
      
     
      
      const session = response.data.data.chatSession;
      setChatSession(session);
      
      // Load existing messages if session has chatId
      if (session.chatId || session.id) {
        const chatId = session.chatId || session.id;
       
        
        try {
          const messagesResponse = await chatAPI.getChatMessages(chatId);
          
          
          const loadedMessages = messagesResponse.data?.data?.messages || [];
          
          
          if (loadedMessages.length > 0) {
            
            setMessages(loadedMessages);
            
          } else {
            
            setMessages([]);
          }
        } catch (msgError: any) {
          console.error('❌ Error loading messages:', msgError);
          console.error('❌ Error details:', msgError.response?.data);
          setMessages([]);
        }
        
        // Initialize socket connection
        initializeSocket(chatId);
      }
      
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to start chat session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSocket = (chatId: string) => {
    const API_BASE_URL =  'https://chicken-samucha-backend.onrender.com/api';
    const socketURL = API_BASE_URL.replace('/api', '');
    
    
    
    socketRef.current = io(socketURL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      
      setIsConnected(true);
      // Join chat room
      socketRef.current?.emit('join-chat', chatId);
    });

    socketRef.current.on('disconnect', () => {
      
      setIsConnected(false);
    });

    socketRef.current.on('receive-message', (messageData: Message) => {
     
      
      // Only add messages from admin (not user's own messages)
      if (messageData.senderType === 'admin') {
        setMessages(prev => [...prev, messageData]);
        setAdminTyping(false);
      }
    });

    socketRef.current.on('user-typing', (data: any) => {
      if (data.senderType === 'admin') {
        setAdminTyping(true);
      }
    });

    socketRef.current.on('user-stop-typing', (data: any) => {
      if (data.senderType === 'admin') {
        setAdminTyping(false);
      }
    });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || !chatSession) return;

   

    const chatId = chatSession.chatId;
    const messageText = newMessage.trim();
    
    const currentFile = selectedFile;
    
    // Create optimistic message for immediate UI feedback
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || 'guest',
      senderName: user?.name || guestForm.name || 'You',
      senderType: 'user',
      message: messageText || (currentFile ? `Sent an image: ${currentFile.name}` : ''),
      messageType: currentFile?.type?.startsWith('image/') ? 'image' : 'text',
      attachments: currentFile ? [{
        type: currentFile.type?.startsWith('image/') ? 'image' : 'document',
        url: URL.createObjectURL(currentFile),
        filename: currentFile.name,
        size: currentFile.size
      }] : [],
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input and file immediately
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Send via API for persistence
      const formData = new FormData();
      formData.append('chatId', chatId);
      
      // Always append message (can be empty if only file)
      formData.append('message', messageText);
      
      // Append file if selected
      if (currentFile) {
        formData.append('attachment', currentFile);
      }
      
      
      
      const response = await chatAPI.sendMessage(formData);
      
      
      // Replace optimistic message with real message from API
      const realMessage = response.data.data.chatMessage;
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? realMessage : msg
      ));
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to send message');
      
      // Remove optimistic message on error and restore input
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageText);
      setSelectedFile(currentFile);
    }
  };

  const handleTyping = () => {
    if (!isTyping && chatSession) {
      setIsTyping(true);
      socketRef.current?.emit('typing', {
        chatId: chatSession.chatId,
        senderType: 'user',
        senderName: user?.name || guestForm.name
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (chatSession) {
        socketRef.current?.emit('stop-typing', {
          chatId: chatSession.chatId,
          senderType: 'user'
        });
      }
    }, 1000);
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.name || !guestForm.email) {
      toast.error('Please fill in your name and email');
      return;
    }
    setShowGuestForm(false);
    setIsAnonymous(false);
    initializeChat();
  };

  const handleAnonymousStart = () => {
    setIsAnonymous(true);
    setShowGuestForm(false);
    initializeChat();
  };

  const handleUpdateWithDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.name || !guestForm.email) {
      toast.error('Please fill in your name and email');
      return;
    }
    
    try {
      // Update the session with user details
      const response = await chatAPI.updateChatSession(chatSession?.chatId || '', {
        customerInfo: {
          name: guestForm.name,
          email: guestForm.email,
          phone: guestForm.phone,
          subject: guestForm.subject,
          isAnonymous: false
        }
      });
      
      if (response.data.success) {
        setIsAnonymous(false);
        setShowGuestForm(false);
        toast.success('Your details have been updated');
        // Refresh the chat session
        if (chatSession?.chatId) {
          const messagesResponse = await chatAPI.getChatMessages(chatSession.chatId);
          const loadedMessages = messagesResponse.data?.data?.messages || [];
          setMessages(loadedMessages);
        }
      }
    } catch (error: any) {
      console.error('Error updating session:', error);
      toast.error('Failed to update your details');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (showGuestForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Start Live Chat
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Choose how you'd like to start chatting with our support team.
            </p>
          </div>

          <div className="space-y-4">
            {/* Anonymous Option */}
            <button
              type="button"
              onClick={handleAnonymousStart}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span>Start Anonymous Chat</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
              </div>
            </div>

            <form onSubmit={chatSession ? handleUpdateWithDetails : handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={guestForm.name}
                onChange={(e) => setGuestForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={guestForm.email}
                onChange={(e) => setGuestForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={guestForm.phone}
                onChange={(e) => setGuestForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <select
                value={guestForm.subject}
                onChange={(e) => setGuestForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select a topic</option>
                <option value="order">Order Inquiry</option>
                <option value="delivery">Delivery Issue</option>
                <option value="payment">Payment Problem</option>
                <option value="complaint">Complaint</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
            >
                {chatSession ? 'Update Details' : 'Start Chat with Details'}
            </button>
          </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          style={{ height: 'calc(100vh - 8rem)' }}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">
                    Live Support Chat
                  </h1>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span>{isConnected ? 'Online' : 'Offline'}</span>
                    {chatSession?.adminAssigned && (
                      <>
                        <span>•</span>
                        <span>with {chatSession.adminAssigned.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isAuthenticated && isAnonymous && (
                  <button 
                    onClick={() => setShowGuestForm(true)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
                    title="Provide your details"
                  >
                    Add Details
                  </button>
                )}
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: 'calc(100% - 200px)' }}>
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  Welcome to Live Chat!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Send a message to start the conversation with our support team.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderType === 'user';
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${
                        isOwnMessage ? 'order-2' : 'order-1'
                      }`}>
                        {!isOwnMessage && (
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs text-gray-500">{message.senderName}</span>
                          </div>
                        )}
                        <div className={`rounded-2xl px-4 py-3 ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md'
                        }`}>
                          {/* Display attachments (images) */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-2">
                              {message.attachments.map((attachment, idx) => (
                                <div key={idx}>
                                  {attachment.type === 'image' ? (
                                    <img 
                                      src={attachment.url}
                                      alt={attachment.filename}
                                      className="max-w-xs rounded-lg cursor-pointer"
                                      onClick={() => window.open(attachment.url, '_blank')}
                                    />
                                  ) : (
                                    <div className="flex items-center space-x-2 p-2 bg-gray-200 dark:bg-gray-600 rounded">
                                      <span>📎</span>
                                      <a 
                                        href={attachment.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        {attachment.filename}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Display text message */}
                          {message.message && (
                            <p className="text-sm">{message.message}</p>
                          )}
                        </div>
                        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(message.timestamp)}</span>
                          {isOwnMessage && message.isRead && (
                            <span className="text-green-500">✓✓</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Typing Indicator */}
                {adminTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 rounded-bl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t dark:border-gray-700 p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-4">
              {/* File Attachment */}
              <button
                type="button"
                onClick={handleFileSelect}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
              
                             {/* Emoji Picker */}
               <div className="relative">
                 <button
                   type="button"
                   onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                   className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                   title="Add emoji"
                 >
                   <Smile className="w-5 h-5" />
                 </button>
                 
                 {showEmojiPicker && (
                   <div 
                     ref={emojiPickerRef}
                     className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border p-3 z-50 max-h-60 overflow-y-auto"
                     style={{ minWidth: '280px' }}
                   >
                     <div className="grid grid-cols-8 gap-1">
                       {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '💪', '🦾', '🙏'].map((emoji, index) => (
                         <button
                           key={index}
                           type="button"
                           onClick={() => handleEmojiSelect(emoji)}
                           className="w-7 h-7 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center"
                         >
                           {emoji}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
              
                             <div className="flex-1 relative">
                 {/* File preview */}
                 {selectedFile && (
                   <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                     <span className="text-sm text-gray-600 dark:text-gray-300">
                       📎 {selectedFile.name}
                     </span>
                     <button
                       type="button"
                       onClick={removeSelectedFile}
                       className="text-red-500 hover:text-red-700 text-sm"
                     >
                       ✕
                     </button>
                   </div>
                 )}
                 
                 <input
                   type="text"
                   value={newMessage}
                   onChange={(e) => {
                     setNewMessage(e.target.value);
                     handleTyping();
                   }}
                   placeholder={selectedFile ? "Add a message (optional)..." : "Type your message..."}
                   className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-12"
                   disabled={!chatSession}
                 />
               </div>
                             <motion.button
                 type="submit"
                 disabled={(!newMessage.trim() && !selectedFile) || !chatSession}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Send className="w-5 h-5" />
               </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatPage; 