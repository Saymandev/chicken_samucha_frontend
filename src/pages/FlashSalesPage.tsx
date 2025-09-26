import { motion } from 'framer-motion';
import { Clock, ShoppingCart, Star, Tag } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { GridSkeleton, ProductCardSkeleton } from '../components/common/Skeleton';
import { Product, useStore } from '../store/useStore';
import { flashSaleAPI } from '../utils/api';

interface FlashSaleProduct {
  product: Product;
  originalPrice: number;
  flashSalePrice: number;
  stockLimit?: number;
  soldCount: number;
  remainingStock?: number;
  discountPercentage: number;
}

interface FlashSale {
  id: string;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  endTime: string;
  remainingTime: {
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } | null;
  backgroundColor: string;
  textColor: string;
  products: FlashSaleProduct[];
}

const FlashSalesPage: React.FC = () => {
  const { language, addToCart } = useStore();
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{[key: string]: {days: number; hours: number; minutes: number; seconds: number}}>({});

  const fetchFlashSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await flashSaleAPI.getCurrentFlashSales();
      if (response.data.success) {
        setFlashSales(response.data.flashSales || []);
      }
    } catch (error) {
      console.error('Fetch flash sales error:', error);
      toast.error('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  // Update countdown timers
  useEffect(() => {
    if (flashSales.length === 0) return;

    const updateCountdowns = () => {
      const newTimeLeft: {[key: string]: {days: number; hours: number; minutes: number; seconds: number}} = {};
      
      flashSales.forEach(sale => {
        const now = new Date().getTime();
        const endTime = new Date(sale.endTime).getTime();
        const distance = endTime - now;

        if (distance > 0) {
          const totalHours = Math.floor(distance / (1000 * 60 * 60));
          const days = Math.floor(totalHours / 24);
          const hours = totalHours % 24;
          
          newTimeLeft[sale.id] = {
            days: days,
            hours: hours,
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          };
        } else {
          // Flash sale ended, refresh the list
          fetchFlashSales();
        }
      });

      setTimeLeft(newTimeLeft);
    };

    updateCountdowns(); // Initial call
    const timer = setInterval(updateCountdowns, 1000);

    return () => clearInterval(timer);
  }, [flashSales, fetchFlashSales]);

  const handleAddToCart = async (product: FlashSaleProduct) => {
    try {
      addToCart(product.product, 1);
      toast.success(`${language === 'bn' ? product.product.name.bn : product.product.name.en} added to cart!`);
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add product to cart');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('BDT', '৳');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <GridSkeleton 
            items={8} 
            ItemComponent={ProductCardSkeleton}
            columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          />
        </div>
      </div>
    );
  }

  if (flashSales.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <Tag className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {language === 'bn' ? 'কোনো ফ্ল্যাশ সেল নেই' : 'No Flash Sales Available'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {language === 'bn' 
                ? 'এই মুহূর্তে কোনো ফ্ল্যাশ সেল চলছে না। শীঘ্রই নতুন অফার আসবে!'
                : 'There are no active flash sales at the moment. Check back soon for amazing deals!'
              }
            </p>
            <Link
              to="/products"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {language === 'bn' ? 'সব পণ্য দেখুন' : 'Browse All Products'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            🔥 {language === 'bn' ? 'ফ্ল্যাশ সেল' : 'Flash Sales'}
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400 text-lg"
          >
            {language === 'bn' 
              ? 'সীমিত সময়ের জন্য বিশেষ ছাড়ে পণ্য কিনুন!'
              : 'Limited time offers with amazing discounts!'
            }
          </motion.p>
        </div>

        {/* Flash Sales */}
        <div className="space-y-12">
          {flashSales.map((sale, saleIndex) => (
            <motion.div
              key={sale.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: saleIndex * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Sale Header */}
              <div 
                className="px-6 py-4 text-white relative overflow-hidden"
                style={{ backgroundColor: sale.backgroundColor }}
              >
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {language === 'bn' ? sale.title.bn : sale.title.en}
                      </h2>
                      {sale.description && (
                        <p className="opacity-90">
                          {language === 'bn' ? sale.description.bn : sale.description.en}
                        </p>
                      )}
                    </div>
                    
                    {/* Countdown Timer */}
                    {timeLeft[sale.id] && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <div className="flex items-center space-x-1">
                          {timeLeft[sale.id].days > 0 && (
                            <>
                              <div className="bg-white/20 px-3 py-2 rounded-lg text-center min-w-[50px]">
                                <div className="text-lg font-bold">{timeLeft[sale.id].days}</div>
                                <div className="text-xs opacity-80">{language === 'bn' ? 'দিন' : 'DAYS'}</div>
                              </div>
                              <div className="text-xl">:</div>
                            </>
                          )}
                          <div className="bg-white/20 px-3 py-2 rounded-lg text-center min-w-[50px]">
                            <div className="text-lg font-bold">{String(timeLeft[sale.id].hours).padStart(2, '0')}</div>
                            <div className="text-xs opacity-80">{language === 'bn' ? 'ঘণ্টা' : 'HRS'}</div>
                          </div>
                          <div className="text-xl">:</div>
                          <div className="bg-white/20 px-3 py-2 rounded-lg text-center min-w-[50px]">
                            <div className="text-lg font-bold">{String(timeLeft[sale.id].minutes).padStart(2, '0')}</div>
                            <div className="text-xs opacity-80">{language === 'bn' ? 'মিনিট' : 'MIN'}</div>
                          </div>
                          <div className="text-xl">:</div>
                          <div className="bg-white/20 px-3 py-2 rounded-lg text-center min-w-[50px]">
                            <div className="text-lg font-bold">{String(timeLeft[sale.id].seconds).padStart(2, '0')}</div>
                            <div className="text-xs opacity-80">{language === 'bn' ? 'সেকেন্ড' : 'SEC'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10"></div>
              </div>

              {/* Products Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {sale.products.map((item, productIndex) => (
                    <motion.div
                      key={item.product._id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: (saleIndex * 0.1) + (productIndex * 0.05) }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square bg-white dark:bg-gray-600">
                        <Link to={`/products/${item.product.id}`}>
                          <img
                            src={item.product.images[0]?.url || '/placeholder.png'}
                            alt={language === 'bn' ? item.product.name.bn : item.product.name.en}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        
                        {/* Discount Badge */}
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                          -{item.discountPercentage}%
                        </div>

                        {/* Stock Badge */}
                        {item.stockLimit && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                            {item.remainingStock} {language === 'bn' ? 'বাকি' : 'left'}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <Link to={`/products/${item.product.id}`}>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
                            {language === 'bn' ? item.product.name.bn : item.product.name.en}
                          </h3>
                        </Link>

                        {/* Rating */}
                        <div className="flex items-center space-x-1 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(item.product.ratings?.average || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ({item.product.ratings?.count || 0})
                          </span>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center space-x-2 mb-4">
                          <span className="text-lg font-bold text-red-600">
                            {formatPrice(item.flashSalePrice)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.originalPrice)}
                          </span>
                        </div>

                        {/* Stock Progress */}
                        {item.stockLimit && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <span>{language === 'bn' ? 'বিক্রি হয়েছে' : 'Sold'}: {item.soldCount}</span>
                              <span>{language === 'bn' ? 'মোট' : 'Total'}: {item.stockLimit}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(item.soldCount / item.stockLimit) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={item.remainingStock === 0}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            item.remainingStock === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <ShoppingCart className="w-4 h-4" />
                            <span>
                              {item.remainingStock === 0
                                ? (language === 'bn' ? 'স্টক শেষ' : 'Out of Stock')
                                : (language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart')
                              }
                            </span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12 p-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl text-white"
        >
          <h2 className="text-2xl font-bold mb-4">
            {language === 'bn' ? 'আরও দুর্দান্ত অফারের জন্য প্রস্তুত থাকুন!' : 'Stay tuned for more amazing deals!'}
          </h2>
          <p className="mb-6 opacity-90">
            {language === 'bn' 
              ? 'আমাদের নিউজলেটার সাবস্ক্রাইব করুন এবং সর্বপ্রথম জানুন নতুন ফ্ল্যাশ সেলের খবর।'
              : 'Subscribe to our newsletter and be the first to know about new flash sales.'
            }
          </p>
          <Link
            to="/products"
            className="bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            {language === 'bn' ? 'সব পণ্য দেখুন' : 'Browse All Products'}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default FlashSalesPage;
