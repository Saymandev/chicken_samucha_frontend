import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface SliderItem {
  id: string;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  image: { url: string; public_id: string };
  linkUrl: string;
  buttonText: { en: string; bn: string };
  isActive: boolean;
  order: number;
}

interface HeroSliderProps {
  items: SliderItem[];
  autoPlay?: boolean;
  interval?: number;
}

const HeroSlider: React.FC<HeroSliderProps> = ({ 
  items, 
  autoPlay = true, 
  interval = 5000 
}) => {
 
  const { language } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  // Filter active items and sort by order
  const activeItems = items.filter(item => item.isActive).sort((a, b) => a.order - b.order);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || activeItems.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === activeItems.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, activeItems.length, interval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? activeItems.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === activeItems.length - 1 ? 0 : currentIndex + 1);
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(autoPlay);
  };

  if (activeItems.length === 0) {
    return (
      <div className="relative h-96 md:h-[500px] hero-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {language === 'bn' ? 'স্বাগতম' : 'Welcome'}
          </h1>
          <p className="text-xl">
            {language === 'bn' 
              ? 'আমাদের সুস্বাদু খাবারের জগতে আপনাকে স্বাগতম'
              : 'Welcome to our delicious world of food'
            }
          </p>
        </div>
      </div>
    );
  }

  const currentItem = activeItems[currentIndex];

  return (
    <div 
      className="relative h-96 md:h-[500px] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${currentItem.image.url})` }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          
          {/* Content */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white max-w-4xl mx-auto px-4">
              <motion.h1
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className={`text-4xl md:text-6xl font-bold mb-4 ${
                  language === 'bn' ? 'font-bengali' : ''
                }`}
              >
                {currentItem.title[language]}
              </motion.h1>
              
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className={`text-xl md:text-2xl mb-8 opacity-90 ${
                  language === 'bn' ? 'font-bengali' : ''
                }`}
              >
                {currentItem.description[language]}
              </motion.p>
              
              {currentItem.linkUrl && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Link
                    to={currentItem.linkUrl}
                    className="btn-primary text-lg px-8 py-3 hover:scale-105 transition-transform"
                  >
                    {currentItem.buttonText[language]}
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {activeItems.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {activeItems.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {activeItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentIndex === index 
                  ? 'bg-white scale-125' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {activeItems.length > 1 && (
        <div className="absolute top-6 right-6 z-20 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {activeItems.length}
        </div>
      )}
    </div>
  );
};

export default HeroSlider; 