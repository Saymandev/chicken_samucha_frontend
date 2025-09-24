import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useStore } from '../../store/useStore';
import { publicAPI } from '../../utils/api';

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
  const [announcement, setAnnouncement] = useState<any>(null);
  const [hideBanner, setHideBanner] = useState(false);

  useEffect(() => {
    let mounted = true;
    publicAPI.getAnnouncement().then(res => {
      if (mounted) setAnnouncement(res.data?.announcement || null);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // (Removed) viewport tracking not needed with blurred cover + contained image

  // Filter active items and sort by order
  const activeItems = items.filter(item => item.isActive).sort((a, b) => a.order - b.order);

  if (activeItems.length === 0) {
    return (
      <div className="relative h-[220px] sm:h-[300px] md:h-[420px] lg:h-[520px] xl:h-[640px] w-full bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-4xl">✨</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent font-serif">
              {language === 'bn' ? 'স্বাগতম' : 'Welcome'}
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              {language === 'bn' 
                ? 'আমাদের সুন্দর কসমেটিক্সের জগতে আপনাকে স্বাগতম'
                : 'Welcome to our beautiful world of cosmetics'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden"
         style={{
           // Ideal 16:9 container with clamped heights to keep good ratio
           aspectRatio: '16 / 9',
           maxHeight: '70vh',
           minHeight: 220
         }}>
      {announcement && !hideBanner && (
        <div className="absolute top-0 left-0 right-0 z-30">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="truncate mr-4">
              <span className="font-semibold mr-2">{announcement.title}</span>
              <span className="opacity-90">{announcement.message}</span>
              {announcement.linkUrl && (
                <a href={announcement.linkUrl} className="ml-3 underline" target="_blank" rel="noreferrer">Learn more</a>
              )}
            </div>
            <button onClick={() => setHideBanner(true)} className="text-white/90 hover:text-white">✕</button>
          </div>
        </div>
      )}
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
        className="hero-swiper h-full w-full"
        breakpoints={{
          0: { height: 220 },
          640: { height: 300 },
          768: { height: 420 },
          1024: { height: 520 },
          1280: { height: 640 }
        }}
      >
        {activeItems.map((item, index) => (
          <SwiperSlide key={item.id}>
            <div className="relative h-full w-full">
              {/* Background layers: blurred cover fill + sharp contained image to avoid cropping */}
              {/* Blurred fill to hide letterboxing while keeping full image visible */}
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `url(${item.image.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  filter: 'blur(12px)',
                  transform: 'scale(1.08)',
                  opacity: 0.35
                }}
              />
              {/* Sharp contained image so nothing gets cropped */}
              <div 
                className="absolute inset-0 w-full h-full"
                style={{ 
                  backgroundImage: `url(${item.image.url})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center center',
                  backgroundRepeat: 'no-repeat',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#ffffff'
                }}
              />
              
              {/* Light overlay for better text readability without darkening the image */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              
              {/* Floating cosmetic elements */}
              <div className="absolute top-20 right-20 w-16 h-16 bg-pink-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute bottom-32 left-16 w-12 h-12 bg-purple-400/20 rounded-full blur-lg animate-pulse delay-1000"></div>
              <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-indigo-400/20 rounded-full blur-md animate-pulse delay-500"></div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex items-center">
                <div className="text-left text-white max-w-4xl mx-auto px-4 md:px-8">
                  {item.title[language] && (
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.8 }}
                      className="relative"
                    >
                      <h1
                        className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${
                          language === 'bn' ? 'font-bengali' : 'font-serif'
                        }`}
                        style={{ 
                          textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)',
                          background: 'linear-gradient(135deg, #ffffff 0%, #f8f4ff 50%, #e8d5ff 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {item.title[language]}
                      </h1>
                      {/* Sparkle effect */}
                      <div className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</div>
                      <div className="absolute -bottom-1 -left-2 text-lg animate-pulse delay-300">💫</div>
                    </motion.div>
                  )}
                  
                  {item.description[language] && (
                    <motion.p
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className={`text-xl md:text-2xl mb-8 opacity-95 max-w-2xl leading-relaxed ${
                        language === 'bn' ? 'font-bengali' : ''
                      }`}
                      style={{ 
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
                        color: 'white'
                      }}
                    >
                      {item.description[language]}
                    </motion.p>
                  )}
                  
                  {item.linkUrl && (
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.8 }}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <Link
                        to={item.linkUrl}
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-full hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {item.buttonText[language]}
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Elegant Navigation Buttons */}
      {activeItems.length > 1 && (
        <>
          <div className="hero-swiper-button-prev absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm text-white p-4 rounded-full hover:bg-white/30 transition-all cursor-pointer border border-white/30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <div className="hero-swiper-button-next absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm text-white p-4 rounded-full hover:bg-white/30 transition-all cursor-pointer border border-white/30">
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