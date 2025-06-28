import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';

interface Review {
  id: string;
  customer: {
    name: string;
    avatar?: { url: string };
  };
  rating: number;
  comment: { en: string; bn: string };
  createdAt: string;
}

interface ReviewCardProps {
  review: Review;
  showActions?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  showActions = false 
}) => {
  const { t } = useTranslation();
  const { language } = useStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start space-x-4">
        {/* Customer Avatar */}
        <div className="flex-shrink-0">
          {review.customer.avatar?.url ? (
            <img
              src={review.customer.avatar.url}
              alt={review.customer.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
        </div>

        {/* Review Content */}
        <div className="flex-1 min-w-0">
          {/* Customer Name and Rating */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {review.customer.name}
            </h4>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {review.rating}/5
              </span>
            </div>
          </div>

          {/* Review Comment */}
          <p className={`text-gray-700 dark:text-gray-300 mb-3 ${
            language === 'bn' ? 'font-bengali' : ''
          }`}>
            {review.comment[language]}
          </p>

          {/* Review Date */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(review.createdAt)}
          </p>

          {/* Actions (for admin) */}
          {showActions && (
            <div className="flex space-x-2 mt-4">
              <button className="btn-sm bg-green-100 text-green-700 hover:bg-green-200">
                {t('admin.approve')}
              </button>
              <button className="btn-sm bg-red-100 text-red-700 hover:bg-red-200">
                {t('admin.reject')}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReviewCard; 