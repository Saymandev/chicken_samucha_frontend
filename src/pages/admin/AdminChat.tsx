import { ArrowLeft, Clock, FileText, MessageCircle, Send, User, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import io, { Socket } from 'socket.io-client';
import { adminAPI } from '../../utils/api';

interface ChatSession {
  _id: string;
  chatId: string;
  customer: { 
    name: string; 
    email: string; 
    phone: string;
    user?: string;
    isGuest: boolean;
  };
  status: 'active' | 'waiting' | 'closed' | 'archived';
  lastMessage?: {
    content: string;
    timestamp: string;
    isFromAdmin: boolean;
  };
  unreadCount: {
    admin: number;
    customer: number;
  };
  assignedAdmin?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

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

const AdminChat: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
    const initializeSocket = () => {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://chicken-samucha-backend.onrender.com/api';
      const socketURL = API_BASE_URL.replace('/api', '');
      
      socketRef.current = io(socketURL, {
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        
        // Join admin dashboard to receive global admin events
        socketRef.current?.emit('join-admin-dashboard');
      });

      socketRef.current.on('receive-message', (messageData: any) => {
        
        
        // Add message if it's for the currently selected chat
        if (selectedChat && messageData.chatId === selectedChat.chatId) {
          // Transform message to match our interface
          const transformedMessage: Message = {
            id: messageData.id || `msg-${Date.now()}`,
            senderId: messageData.senderId || 'unknown',
            senderName: messageData.senderName || 'Unknown',
            senderType: messageData.senderType || 'user',
            message: messageData.message || '',
            messageType: messageData.messageType || 'text',
            attachments: messageData.attachments || [],
            timestamp: messageData.timestamp || new Date().toISOString(),
            isRead: messageData.isRead || false
          };
          
          setMessages(prev => [...prev, transformedMessage]);
          
        }
      });

      // Listen for new customer messages across all chats
      socketRef.current.on('new-customer-message', (data: any) => {
       
        
        // Update the chat sessions list with the new message
        setChatSessions(prev => prev.map(session => {
          if (session.chatId === data.chatId) {
            return {
              ...session,
              lastMessage: {
                content: data.message,
                timestamp: data.timestamp,
                isFromAdmin: false
              },
              unreadCount: {
                ...session.unreadCount,
                admin: session.unreadCount.admin + 1
              }
            };
          }
          return session;
        }));
        
        // Show toast notification if not viewing this chat
        if (!selectedChat || selectedChat.chatId !== data.chatId) {
          toast(`New message from ${data.senderName}`, {
            icon: '💬',
            duration: 3000
          });
        }
      });

      socketRef.current.on('user-typing', (data: any) => {
       
        // You can add typing indicators here
      });

      socketRef.current.on('chat-status-changed', (data: any) => {
        
        // Update chat session status in real-time
        setChatSessions(prev => prev.map(session => {
          if (session.chatId === data.chatId) {
            return {
              ...session,
              status: data.status,
              assignedAdmin: data.adminName ? { _id: 'admin', name: data.adminName } : undefined
            };
          }
          return session;
        }));
      });

      socketRef.current.on('user-joined-chat', (data: any) => {
        
        // You can show notifications when users join chats
      });

      socketRef.current.on('new-chat-session', (sessionData: any) => {
        
        // Add new session to the list
        fetchChatSessions();
        toast(`New chat session started by ${sessionData.customerName}`, {
          icon: '🆕',
          duration: 4000
        });
      });
    };

    fetchChatSessions();
    initializeSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.chatId);
      
      // Join the specific chat room for real-time updates
      if (socketRef.current) {
        
        socketRef.current.emit('join-chat', selectedChat.chatId);
      }
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getChatSessions({
        page: 1,
        limit: 50,
        sortBy: 'updatedAt'
      });
      
      
      setChatSessions(response.data.sessions || []);
    } catch (error: any) {
      console.error('Error fetching chat sessions:', error);
      toast.error('Failed to fetch chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      const response = await adminAPI.getChatMessages(chatId);
      
      
      setMessages(response.data.data?.messages || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistic UI update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: 'admin',
      senderName: 'Admin',
      senderType: 'admin',
      message: messageText,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {

      // Send via API
      const response = await adminAPI.sendAdminMessage(selectedChat.chatId, messageText);
      

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? response.data.chatMessage : msg
      ));

      // No need to emit via socket - backend already handles this in sendAdminMessage

      toast.success('Message sent');
      
      // Refresh chat sessions to update last message
      fetchChatSessions();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  const assignChat = async (chatId: string) => {
    try {
      await adminAPI.assignChatSession(chatId, 'current-admin-id');
      toast.success('Chat assigned to you');
      fetchChatSessions();
    } catch (error: any) {
      console.error('Error assigning chat:', error);
      toast.error('Failed to assign chat');
    }
  };

  const closeChatSession = async (chatId: string) => {
    try {
      await adminAPI.closeChatSession(chatId);
      toast.success('Chat session closed');
      setSelectedChat(null);
      fetchChatSessions();
    } catch (error: any) {
      console.error('Error closing chat:', error);
      toast.error('Failed to close chat');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'waiting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Customer Support Chat
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage customer inquiries and provide real-time support
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Chat Sessions List */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex-col ${
              selectedChat ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chat Sessions
                  </h2>
                  <button
                    onClick={fetchChatSessions}
                    className="text-orange-500 hover:text-orange-600 text-sm"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded-full">
                    {chatSessions.filter(c => c.status === 'active').length} Active
                  </span>
                  <span className="text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-1 rounded-full">
                    {chatSessions.filter(c => c.status === 'waiting').length} Waiting
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {chatSessions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No chat sessions found
                  </div>
                ) : (
                  chatSessions.map((chat) => (
                    <div
                      key={chat._id}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedChat?._id === chat._id ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {chat.customer.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {chat.customer.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(chat.status)}`}>
                            {chat.status}
                          </span>
                          {chat.unreadCount.admin > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {chat.unreadCount.admin}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : formatTime(chat.createdAt)}</span>
                        {chat.assignedAdmin && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {chat.assignedAdmin.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className={`flex-1 flex flex-col ${
              selectedChat ? 'w-full md:w-2/3' : 'hidden md:flex'
            }`}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Back button for mobile */}
                        <button
                          onClick={() => setSelectedChat(null)}
                          className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {selectedChat.customer.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedChat.customer.email} • {selectedChat.customer.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {selectedChat.status === 'waiting' && (
                          <button
                            onClick={() => assignChat(selectedChat.chatId)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                          >
                            Assign to Me
                          </button>
                        )}
                        {selectedChat.status === 'active' && (
                          <button
                            onClick={() => closeChatSession(selectedChat.chatId)}
                            className="bg-gray-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                          >
                            Close Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] sm:max-w-[70%] md:max-w-sm lg:max-w-md ${
                            message.senderType === 'admin' ? 'order-2' : 'order-1'
                          }`}>
                            {message.senderType === 'user' && (
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                                  <User className="w-3 h-3 text-white" />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{message.senderName}</span>
                              </div>
                            )}
                            
                            <div className={`rounded-2xl px-4 py-3 ${
                              message.senderType === 'admin'
                                ? 'bg-orange-500 text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md'
                            }`}>
                              {/* Display attachments */}
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mb-2">
                                  {message.attachments.map((attachment, idx) => (
                                    <div key={idx} className="mb-2 last:mb-0">
                                      {attachment.type === 'image' ? (
                                        <img 
                                          src={attachment.url}
                                          alt={attachment.filename}
                                          className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px] h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => window.open(attachment.url, '_blank')}
                                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <div className="flex items-center space-x-2 p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                                          <FileText className="w-4 h-4 flex-shrink-0" />
                                          <a 
                                            href={attachment.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className={`hover:underline text-sm truncate ${
                                              message.senderType === 'admin' 
                                                ? 'text-white/90 hover:text-white' 
                                                : 'text-blue-600 dark:text-blue-400'
                                            }`}
                                            title={attachment.filename}
                                          >
                                            {attachment.filename}
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Display message text */}
                              {message.message && (
                                <p className="text-sm">{message.message}</p>
                              )}
                            </div>
                            
                            <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                              message.senderType === 'admin' ? 'justify-end' : 'justify-start'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(message.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your response..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        disabled={selectedChat.status === 'closed'}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || selectedChat.status === 'closed'}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Select a chat to start
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a chat session from the list to view messages and respond
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Chats</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {chatSessions.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Waiting</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {chatSessions.filter(c => c.status === 'waiting').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Today</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {chatSessions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">2m</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
