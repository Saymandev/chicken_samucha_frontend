import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DynamicCategorySections from '../components/common/DynamicCategorySections';
import HeroSlider from '../components/common/HeroSlider';
import ReviewSlider from '../components/common/ReviewSlider';
import {
  GridSkeleton,
  ProductCardSkeleton
} from '../components/common/Skeleton';
import TopCategories from '../components/common/TopCategories';
import ProductCard from '../components/product/ProductCard';
import { Product, useStore } from '../store/useStore';
import { contentAPI, productsAPI, reviewsAPI } from '../utils/api';

interface SliderItem {
  id: string;
  image: { url: string; public_id: string };
  linkUrl: string;
  isActive: boolean;
  order: number;
}

interface Review {
  id: string;
  customer: { name: string; avatar?: { url: string } };
  rating: number;
  comment: { en: string; bn: string };
  createdAt: string;
}

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useStore();
  
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [featuredReviews, setFeaturedReviews] = useState<Review[]>([]);
  const [deliverySettings, setDeliverySettings] = useState<{ freeDeliveryThreshold: number } | null>(null);
  
  const [loadingSlider, setLoadingSlider] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    fetchSliderItems();
    fetchFeaturedProducts();
    fetchBestSellers();
    fetchFeaturedReviews();
    fetchDeliverySettings();
  }, []);

  const fetchSliderItems = async () => {
    try {
      const response = await contentAPI.getSliderItems();
      if (response.data.success) {
        setSliderItems(response.data.sliderItems || []);
      }
    } catch (error) {
      console.error('Error fetching slider items:', error);
    } finally {
      setLoadingSlider(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productsAPI.getFeaturedProducts();
      // Handle both possible response structures
      if (response.data.success && response.data.data) {
        setFeaturedProducts(Array.isArray(response.data.data) ? response.data.data : []);
      } else if (response.data.success && response.data.products) {
        setFeaturedProducts(Array.isArray(response.data.products) ? response.data.products : []);
      } else {
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast.error('Failed to load featured products');
      setFeaturedProducts([]); // Ensure it's always an array
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchFeaturedReviews = async () => {
    try {
      const response = await reviewsAPI.getFeaturedReviews();
      // Handle both possible response structures
      if (response.data.success && response.data.data) {
        setFeaturedReviews(Array.isArray(response.data.data) ? response.data.data : []);
      } else if (response.data.success && response.data.reviews) {
        setFeaturedReviews(Array.isArray(response.data.reviews) ? response.data.reviews : []);
      } else {
        setFeaturedReviews([]);
      }
    } catch (error) {
      console.error('Error fetching featured reviews:', error);
      setFeaturedReviews([]); // Ensure it's always an array
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchBestSellers = async () => {
    try {
      
      const response = await productsAPI.getProducts({ 
        filter: 'best-seller', 
        limit: 8 
      });
      
      if (response.data.success) {
        const items = response.data.products || response.data.data || [];
        setBestSellers(items);
        
      } else {
        
      }
    } catch (error) {
      console.error('❌ Best sellers error:', error);
      setBestSellers([]);
    }
  };

  const fetchDeliverySettings = async () => {
    try {
      const response = await contentAPI.getDeliverySettings();
      if (response.data.success) {
        setDeliverySettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching delivery settings:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative">
        {loadingSlider ? (
          <div className="relative h-[500px] md:h-[600px] bg-gray-200 dark:bg-gray-700 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700" />
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded-lg w-96 mx-auto animate-pulse" />
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-lg w-80 mx-auto animate-pulse" />
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg w-32 mx-auto animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <HeroSlider items={sliderItems} />
        )}
      </section>

       
        
        {/* Top Categories Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {t('homepage.topCategories')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              {t('homepage.topCategoriesDesc')}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <TopCategories limit={4} />
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {t('products.featured')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              {t('homepage.featuredProductsDesc')}
            </p>
          </motion.div>

          {loadingProducts ? (
            <GridSkeleton 
              items={6} 
              ItemComponent={ProductCardSkeleton}
              columns="grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            />
          ) : (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2"
            >
              {(featuredProducts || []).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/products"
              className="btn-primary text-lg px-8 py-3 hover:scale-105 transition-transform"
            >
              {t('homepage.viewAllProducts')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {t('homepage.bestSellers')}
              </h2>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2"
            >
              {bestSellers.map((product, index) => (
                <motion.div key={(product as any).id || index} initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
       {/* Dynamic Category Sections */}
       <DynamicCategorySections limit={8} maxCategories={6} />
      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {t('homepage.whyChooseUs')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {[
              {
                icon: '✨',
                title: t('homepage.features.premiumQuality'),
                description: t('homepage.features.premiumQualityDesc')
              },
              {
                icon: '🚚',
                title: t('homepage.features.fastDelivery'),
                description: t('homepage.features.fastDeliveryDesc')
              },
              {
                icon: '💳',
                title: t('homepage.features.easyPayment'),
                description: t('homepage.features.easyPaymentDesc')
              },
              {
                icon: '🛡️',
                title: t('homepage.features.safeProducts'),
                description: t('homepage.features.safeProductsDesc')
              },
              {
                icon: '🎁',
                title: t('homepage.features.specialOffers'),
                description: t('homepage.features.specialOffersDesc')
              },
              {
                icon: '💬',
                title: t('homepage.features.support24x7'),
                description: t('homepage.features.support24x7Desc')
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center p-6 card hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className={`text-xl font-semibold text-gray-900 dark:text-white mb-3 ${
                  language === 'bn' ? 'font-bengali' : ''
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-gray-600 dark:text-gray-400 ${
                  language === 'bn' ? 'font-bengali' : ''
                }`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {t('reviews.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              {t('homepage.customerReviewsDesc')}
            </p>
          </motion.div>

          {loadingReviews ? (
            <div className="flex justify-center">
              <div className="animate-pulse">
                <div className="w-96 h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <ReviewSlider 
                reviews={featuredReviews || []} 
                autoPlay={true}
                interval={5000}
              />
            </motion.div>
          )}

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className={`text-3xl md:text-4xl font-bold text-white mb-6 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {t('homepage.ctaTitle')}
            </h2>
            <p className={`text-xl text-white opacity-90 mb-8 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {t('homepage.ctaDescription')} ${deliverySettings?.freeDeliveryThreshold ? `৳${deliverySettings.freeDeliveryThreshold}` : '৳1000'}!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center ">
              <Link
                to="/products"
                className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors text-lg hover:scale-105 transform duration-200"
              >
                {t('homepage.orderNow')}
              </Link>
              <Link
                to="/chat"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors text-lg hover:scale-105 transform duration-200"
              >
                {t('homepage.liveChat')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;