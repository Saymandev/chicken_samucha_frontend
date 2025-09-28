import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    CheckCheck,
    Download,
    FileText,
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
  const { user, isAuthenticated } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [isAnonymous, setIsAnonymous] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const initializeSocket = useCallback((chatId: string) => {
    const API_BASE_URL = 'https://rest.ourb.live/api';
    const socketURL = API_BASE_URL.replace('/api', '');

    socketRef.current = io(socketURL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socketRef.current?.emit('join-chat', chatId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('receive-message', (messageData: Message) => {
      console.log('Received message:', messageData);
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
  }, []);

  const initializeChat = useCallback(async () => {
    setIsLoading(true);
    try {
      // Wait a bit for user data to be available
      if (isAuthenticated && !user) {
        console.log('User is authenticated but user data not loaded yet, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

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

      console.log('Starting chat session with:', customerInfo);
      console.log('User data:', user);
      console.log('Is authenticated:', isAuthenticated);

      const response = await chatAPI.startChatSession({
        customerInfo,
        category: 'general'
      });

      console.log('Chat session response:', response.data);

      const session = response.data.data.chatSession;
      setChatSession(session);

      if (session.chatId || session.id) {
        const chatId = session.chatId || session.id;
        console.log('Loading messages for chatId:', chatId);
        
        try {
          const messagesResponse = await chatAPI.getChatMessages(chatId);
          console.log('Messages response:', messagesResponse.data);
          
          const loadedMessages = messagesResponse.data?.data?.messages || [];
          console.log('Loaded messages:', loadedMessages);
          
          if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
          } else {
            setMessages([]);
          }
        } catch (msgError: any) {
          console.error('Error loading messages:', msgError);
          console.error('Error details:', msgError.response?.data);
          setMessages([]);
        }
        
        initializeSocket(chatId);
      }
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to start chat session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, isAnonymous, guestForm, initializeSocket]);

  useEffect(() => {
    if (isOpen) {
      // For authenticated users, wait for user data to be available
      if (isAuthenticated && !user) {
        console.log('Waiting for user data to load...');
        return;
      }
      initializeChat();
    }
  }, [isOpen, initializeChat, isAuthenticated, user]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || !chatSession) return;

    const chatId = chatSession.chatId || chatSession.id;
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
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

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setIsAnonymous(false);
    initializeChat();
  };

  const handleAnonymousChat = () => {
    setIsAnonymous(true);
    initializeChat();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-20 right-6 w-96 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col"
        style={{ maxHeight: '500px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Customer Support</h3>
              <p className="text-xs opacity-90">
                {isConnected ? 'Online' : 'Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !isAuthenticated && !isAnonymous ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Support</h3>
                  <p className="text-sm text-gray-600 mb-6">Choose how you'd like to chat with us</p>
                  
                  <form onSubmit={handleGuestSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={guestForm.name}
                        onChange={(e) => setGuestForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={guestForm.email}
                        onChange={(e) => setGuestForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone (optional)"
                        value={guestForm.phone}
                        onChange={(e) => setGuestForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Start Chat
                      </button>
                      <button
                        type="button"
                        onClick={handleAnonymousChat}
                        className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        Anonymous
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Support</h3>
                      <p className="text-sm text-gray-600">How can we help you today?</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                            message.senderType === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="bg-white/10 rounded p-2">
                                  {attachment.type.startsWith('image/') ? (
                                    <div className="space-y-2">
                                      <img
                                        src={attachment.url}
                                        alt={attachment.filename}
                                        className="max-w-full h-auto rounded"
                                      />
                                      <p className="text-xs opacity-75">{attachment.filename}</p>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <FileText className="w-4 h-4" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs truncate">{attachment.filename}</p>
                                        {attachment.size && (
                                          <p className="text-xs opacity-75">
                                            {formatFileSize(attachment.size)}
                                          </p>
                                        )}
                                      </div>
                                      <a
                                        href={attachment.url}
                                        download={attachment.filename}
                                        className="text-blue-300 hover:text-blue-100"
                                      >
                                        <Download className="w-4 h-4" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs opacity-75">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {message.senderType === 'user' && (
                              message.isRead ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {adminTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {(isAuthenticated || isAnonymous || chatSession) && (
              <div className="p-3 border-t border-gray-200">
                <form onSubmit={sendMessage} className="flex items-center space-x-2">
                  {/* File Attachment */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  
                  {/* Emoji Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Add emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute bottom-12 left-0 bg-white rounded-lg shadow-xl border p-3 z-50 max-h-60 overflow-y-auto"
                        style={{ minWidth: '280px' }}
                      >
                        <div className="grid grid-cols-8 gap-1">
                          {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'].map((emoji, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleEmojiSelect(emoji)}
                              className="w-7 h-7 text-sm hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
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
                      <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-gray-600">
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
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={selectedFile ? "Add a message (optional)..." : "Type your message..."}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                      disabled={!chatSession}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || !chatSession}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatPanel;