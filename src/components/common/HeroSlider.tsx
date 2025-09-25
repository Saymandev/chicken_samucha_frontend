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
  image: { url: string; public_id: string };
  linkUrl: string;
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

  // No viewport switching needed – always contain to show full image on all devices

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
    <div className="relative h-[220px] sm:h-[300px] md:h-[420px] lg:h-[520px] xl:h-[640px] w-screen overflow-hidden left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
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
            <Link
              to={item.linkUrl || '#'}
              className="block relative h-full w-full overflow-hidden group cursor-pointer"
            >
              {/* Full-bleed image: fill container width & height */}
              <img
                src={item.image.url}
                alt={`Slider item ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
                loading="eager"
                decoding="async"
              />
              
              {/* Subtle overlay for hover effect */}
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-300" />
            </Link>
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