import { AnimatePresence, motion } from 'framer-motion';
import { Mail, MessageCircle, Phone, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface FloatingChatButtonProps {
  className?: string;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ className = '' }) => {
  const { isAuthenticated, user, language } = useStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChatClick = () => {
    if (isAuthenticated) {
      navigate('/chat');
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleGuestChat = () => {
    navigate('/chat');
    setIsOpen(false);
  };

  const handleContactClick = (type: 'phone' | 'email') => {
    if (type === 'phone') {
      window.open('tel:+8801234567890', '_self');
    } else {
      window.open('mailto:support@chickensamosa.com', '_self');
    }
    setIsOpen(false);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`} ref={chatRef}>
      {/* Chat Options Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ width: '280px', position: 'absolute', right: '0', bottom: '100%' }}
          >
            {/* Header */}
            <div className="bg-primary-500 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {language === 'bn' ? 'সহায়তা পান' : 'Get Help'}
                  </h3>
                  <p className="text-primary-100 text-sm">
                    {language === 'bn' ? 'আমরা এখানে আছি সাহায্যের জন্য' : 'We\'re here to help'}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="p-4 space-y-3">
              {/* Live Chat */}
              <button
                onClick={handleGuestChat}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                  <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {language === 'bn' ? 'লাইভ চ্যাট' : 'Live Chat'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'bn' ? 'তাত্ক্ষণিক সহায়তা পান' : 'Get instant support'}
                  </div>
                </div>
              </button>

              {/* Phone */}
              <button
                onClick={() => handleContactClick('phone')}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {language === 'bn' ? 'ফোন করুন' : 'Call Us'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    +880 1234 567890
                  </div>
                </div>
              </button>

              {/* Email */}
              <button
                onClick={() => handleContactClick('email')}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                  <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {language === 'bn' ? 'ইমেইল করুন' : 'Email Us'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    support@chickensamosa.com
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {language === 'bn' 
                  ? 'আমরা ২৪/৭ আপনার সেবায় আছি' 
                  : 'We\'re available 24/7 to help you'
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <motion.button
        onClick={handleChatClick}
        className="relative w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* X Icon - Always visible */}
        <X className="w-8 h-8 font-bold" />

        {/* Notification Badge - Always visible */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>

        {/* Tooltip */}
        <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          {language === 'bn' ? 'সহায়তা পান' : 'Get Help'}
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
        </div>
      </motion.button>
    </div>
  );
};

export default FloatingChatButton;
