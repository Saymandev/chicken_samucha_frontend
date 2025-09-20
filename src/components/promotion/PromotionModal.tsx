import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Gift, Percent, Star, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface Promotion {
  _id: string;
  title: {
    en: string;
    bn: string;
  };
  description: {
    en: string;
    bn: string;
  };
  shortDescription?: {
    en: string;
    bn: string;
  };
  image?: {
    url: string;
    public_id: string;
  };
  bannerImage?: {
    url: string;
    public_id: string;
  };
  type: 'discount' | 'special_offer' | 'announcement' | 'seasonal' | 'flash_sale';
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  discountValue: number;
  validUntil: string;
  displayFrequency: 'once_per_session' | 'once_per_day' | 'always' | 'custom';
  ctaButton: {
    text: {
      en: string;
      bn: string;
    };
    link: string;
    action: 'navigate' | 'apply_coupon' | 'open_catalog' | 'contact_us';
  };
  timeRemaining: number;
  isValid: boolean;
}

interface PromotionModalProps {
  promotion: Promotion;
  onClose: () => void;
  onTrackClick?: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ 
  promotion, 
  onClose, 
  onTrackClick 
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { language } = useStore();
  const [timeRemaining, setTimeRemaining] = useState(promotion.timeRemaining);
  const [isClosing, setIsClosing] = useState(false);

  // Update time remaining every second
  useEffect(() => {
    if (!promotion.isValid || timeRemaining <= 0) {
      onClose();
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          onClose();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [promotion.isValid, timeRemaining, onClose]);

  const formatTimeRemaining = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getPromotionIcon = () => {
    switch (promotion.type) {
      case 'discount':
        return <Percent className="w-6 h-6 text-green-500" />;
      case 'special_offer':
        return <Star className="w-6 h-6 text-yellow-500" />;
      case 'flash_sale':
        return <Clock className="w-6 h-6 text-red-500" />;
      default:
        return <Gift className="w-6 h-6 text-orange-500" />;
    }
  };

  const getDiscountText = () => {
    const lang = language;
    switch (promotion.discountType) {
      case 'percentage':
        return `${promotion.discountValue}% OFF`;
      case 'fixed_amount':
        return `৳${promotion.discountValue} OFF`;
      case 'free_shipping':
        return 'FREE SHIPPING';
      case 'buy_x_get_y':
        return 'BUY X GET Y';
      default:
        return 'SPECIAL OFFER';
    }
  };

  const handleCTAClick = () => {
    onTrackClick?.();
    
    switch (promotion.ctaButton.action) {
      case 'navigate':
        if (promotion.ctaButton.link) {
          navigate(promotion.ctaButton.link);
        }
        break;
      case 'apply_coupon':
        // Handle coupon application
        break;
      case 'open_catalog':
        navigate('/products');
        break;
      case 'contact_us':
        navigate('/contact');
        break;
    }
    onClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const displayImage = promotion.bannerImage || promotion.image;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: isClosing ? 0.8 : 1, opacity: isClosing ? 0 : 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Promotion Image */}
          {displayImage && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={displayImage.url}
                alt={promotion.title[language]}
                className="w-full h-full object-cover"
              />
              {/* Discount Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 px-3 py-1 rounded-full">
                {getPromotionIcon()}
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {getDiscountText()}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {promotion.title[language]}
            </h2>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
              {promotion.shortDescription?.[language] || promotion.description[language]}
            </p>

            {/* Time Remaining */}
            {promotion.timeRemaining > 0 && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  {t('promotion.endsIn')}: {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            )}

            {/* CTA Button */}
            {promotion.ctaButton && (
              <button
                onClick={handleCTAClick}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {promotion.ctaButton.text[language] || promotion.ctaButton.text.en}
              </button>
            )}

            {/* Skip Button */}
            <button
              onClick={handleClose}
              className="w-full mt-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors"
            >
              {t('promotion.skip')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromotionModal;
