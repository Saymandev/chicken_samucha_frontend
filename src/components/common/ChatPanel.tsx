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
      initializeChat();
    }
  }, [isOpen, initializeChat]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    if (!chatSession) {
      toast.error('Chat session not initialized');
      return;
    }

    const chatId = chatSession.chatId || chatSession.id;
    if (!chatId) {
      toast.error('Invalid chat session');
      return;
    }

    try {
      let messageData: any = {
        chatId,
        message: newMessage,
        senderType: 'user'
      };

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('message', newMessage);
        formData.append('chatId', chatId);
        formData.append('senderType', 'user');

        const uploadResponse = await chatAPI.uploadFile(formData);
        messageData.attachments = uploadResponse.data.attachments;
        messageData.messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      }

      // Optimistic update
      const tempMessage: Message = {
        id: Date.now().toString(),
        senderId: user?.id || 'guest',
        senderName: user?.name || 'You',
        senderType: 'user',
        message: newMessage,
        messageType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
        attachments: selectedFile ? [{
          type: selectedFile.type,
          url: URL.createObjectURL(selectedFile),
          filename: selectedFile.name,
          size: selectedFile.size
        }] : undefined,
        timestamp: new Date().toISOString(),
        isRead: false
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setSelectedFile(null);

      // Send to server
      await chatAPI.sendMessage(messageData);
      
      // Emit typing stop
      socketRef.current?.emit('stop-typing', { chatId, senderType: 'user' });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
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
                {selectedFile && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {selectedFile.type.startsWith('image/') ? (
                        <Image className="w-4 h-4 text-green-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-sm text-gray-700 truncate max-w-48">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(selectedFile.size)})
                      </span>
                    </div>
                    <button
                      onClick={removeSelectedFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Add emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      
                      {showEmojiPicker && (
                        <div
                          ref={emojiPickerRef}
                          className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10"
                        >
                          <div className="grid grid-cols-8 gap-1">
                            {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleEmojiSelect(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !selectedFile}
                      className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Send message"
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