import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
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

  // Filter active items and sort by order
  const activeItems = items.filter(item => item.isActive).sort((a, b) => a.order - b.order);

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

  return (
    <div className="relative h-96 md:h-[500px] overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: '.hero-swiper-button-next',
          prevEl: '.hero-swiper-button-prev',
        }}
        pagination={{
          clickable: true,
          bulletClass: 'hero-swiper-pagination-bullet',
          bulletActiveClass: 'hero-swiper-pagination-bullet-active',
        }}
        autoplay={autoPlay ? {
          delay: interval,
          disableOnInteraction: false,
        } : false}
        loop={activeItems.length > 1}
        className="hero-swiper h-full"
      >
        {activeItems.map((item, index) => (
          <SwiperSlide key={item.id}>
            <div className="relative h-full">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${item.image.url})` }}
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
                    {item.title[language]}
                  </motion.h1>
                  
                  <motion.p
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className={`text-xl md:text-2xl mb-8 opacity-90 ${
                      language === 'bn' ? 'font-bengali' : ''
                    }`}
                  >
                    {item.description[language]}
                  </motion.p>
                  
                  {item.linkUrl && (
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                      className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                      <Link
                        to={item.linkUrl}
                        className="btn-primary text-lg px-8 py-3 hover:scale-105 transition-transform"
                      >
                        {item.buttonText[language]}
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      {activeItems.length > 1 && (
        <>
          <div className="hero-swiper-button-prev absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <div className="hero-swiper-button-next absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-all cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default HeroSlider; 