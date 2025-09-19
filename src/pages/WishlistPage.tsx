import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { GridSkeleton, ProductCardSkeleton } from '../components/common/Skeleton';
import ProductCard from '../components/product/ProductCard';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../store/useStore';

const WishlistPage: React.FC = () => {
  const { language } = useStore();
  const { wishlistItems, loading, clearWishlist, refreshWishlist } = useWishlist();
  const { openCart } = useCart();
  const { addToCart } = useStore();
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const handleClearWishlist = async () => {
    if (wishlistItems.length === 0) return;
    
    if (!window.confirm(
      language === 'bn' 
        ? 'আপনি কি নিশ্চিত যে আপনি আপনার পুরো উইশলিস্ট মুছে ফেলতে চান?'
        : 'Are you sure you want to clear your entire wishlist?'
    )) return;

    setIsClearing(true);
    try {
      await clearWishlist();
    } finally {
      setIsClearing(false);
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    openCart();
    toast.success(
      language === 'bn' 
        ? `${product.name.bn} কার্টে যোগ করা হয়েছে`
        : `${product.name.en} added to cart`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
          </div>
          <GridSkeleton 
            items={6} 
            ItemComponent={ProductCardSkeleton}
            columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {language === 'bn' ? 'আমার উইশলিস্ট' : 'My Wishlist'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'bn' 
                  ? `${wishlistItems.length}টি পণ্য আপনার উইশলিস্টে আছে`
                  : `${wishlistItems.length} items in your wishlist`
                }
              </p>
            </div>
            
            {wishlistItems.length > 0 && (
              <button
                onClick={handleClearWishlist}
                disabled={isClearing}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {language === 'bn' ? 'সব মুছুন' : 'Clear All'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Wishlist Content */}
        {wishlistItems.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className={`text-xl font-semibold text-gray-900 dark:text-white mb-2 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {language === 'bn' ? 'আপনার উইশলিস্ট খালি' : 'Your wishlist is empty'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {language === 'bn' 
                ? 'আপনার পছন্দের পণ্যগুলি এখানে সংরক্ষণ করুন এবং পরে সহজেই অ্যাক্সেস করুন'
                : 'Save your favorite products here and access them easily later'
              }
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {language === 'bn' ? 'পণ্য ব্রাউজ করুন' : 'Browse Products'}
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {wishlistItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <ProductCard 
                  product={item.product} 
                  showQuickActions={true}
                />
                
                {/* Quick Add to Cart Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                >
                  <button
                    onClick={() => handleAddToCart(item.product)}
                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}
                  </button>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Continue Shopping */}
        {wishlistItems.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mt-12"
          >
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {language === 'bn' ? 'আরও পণ্য দেখুন' : 'Continue Shopping'}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
