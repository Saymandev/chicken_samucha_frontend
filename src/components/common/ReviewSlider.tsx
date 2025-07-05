import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';

interface Review {
  id: string;
  customer: { name: string; avatar?: { url: string } };
  rating: number;
  comment: { en: string; bn: string };
  createdAt: string;
}

interface ReviewSliderProps {
  reviews: Review[];
  autoPlay?: boolean;
  interval?: number;
}

const ReviewSlider: React.FC<ReviewSliderProps> = ({ 
  reviews, 
  autoPlay = true, 
  interval = 5000 
}) => {
 
  const { language } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || reviews.length <= 1) return;

    const timer = setInterval(() => {
      if (isAutoPlaying) {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, isAutoPlaying, reviews.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {language === 'bn' 
            ? 'এখনো কোন রিভিউ নেই। প্রথম রিভিউ দিন!'
            : 'No reviews yet. Be the first to review!'
          }
        </p>
      </div>
    );
  }

  // Ensure currentIndex is within bounds
  const currentReview = reviews[currentIndex];
  if (!currentReview) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {language === 'bn' 
            ? 'রিভিউ লোড হচ্ছে...'
            : 'Loading reviews...'
          }
        </p>
      </div>
    );
  }

  return (
    <div 
      className="relative max-w-4xl mx-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Review Display */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl border border-gray-100 dark:border-gray-700">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full -translate-x-16 -translate-y-16 opacity-50"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-full translate-x-12 translate-y-12 opacity-50"></div>
        
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="p-8 md:p-12 relative z-10"
        >
          <div className="text-center">
            {/* Customer Avatar */}
            <div className="mb-6">
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-800">
                  {currentReview.customer.avatar ? (
                    <img 
                      src={currentReview.customer.avatar.url} 
                      alt={currentReview.customer.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    currentReview.customer.name.charAt(0).toUpperCase()
                  )}
                </div>
                {/* Decorative elements around avatar */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-white fill-current" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Rating Stars */}
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`w-6 h-6 ${
                    index < currentReview.rating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Review Comment */}
            <blockquote className="mb-6 relative">
              
              <p className={`select-none text-lg md:text-xl text-gray-700 dark:text-gray-300 italic leading-relaxed px-4 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {language === 'bn' 
                  ? currentReview.comment.bn 
                  : currentReview.comment.en
                }
              </p>
              
            </blockquote>

            {/* Customer Name */}
            <div className="text-center">
              <h4 className={`text-lg font-semibold text-gray-900 dark:text-white ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {currentReview.customer.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(currentReview.createdAt).toLocaleDateString(
                  language === 'bn' ? 'bn-BD' : 'en-US',
                  { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Arrows */}
        {reviews.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-10 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label="Next review"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {reviews.length > 1 && (
        <div className="flex justify-center mt-8 space-x-3">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary-600 scale-125 shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 hover:scale-110'
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Review Counter */}
      {reviews.length > 1 && (
        <div className="text-center mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            {currentIndex + 1} / {reviews.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default ReviewSlider; 