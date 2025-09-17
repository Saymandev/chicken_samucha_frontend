import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, X } from 'lucide-react';
import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import { Product, useStore } from '../../store/useStore';

interface QuickAddModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ product, isOpen, onClose }) => {
  
  const { language, addToCart, cart } = useStore();
  const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);
  const [isAdding, setIsAdding] = useState(false);

  // Check if product is already in cart
  const cartItem = cart.find(item => item.product.id === product.id);
  const isInCart = !!cartItem;

  const handleAddToCart = async () => {
    if (product.stock < 1) {
      return;
    }

    if (quantity < product.minOrderQuantity) {
      return;
    }

    if (quantity > product.maxOrderQuantity) {
      return;
    }

    setIsAdding(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    addToCart(product, quantity);
    
    setIsAdding(false);
    onClose();
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= product.minOrderQuantity && newQuantity <= product.maxOrderQuantity) {
      setQuantity(newQuantity);
    }
  };

  if (!isOpen) return null;

  const currentPrice = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {language === 'bn' ? 'দ্রুত যোগ করুন' : 'Quick Add'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <img
              src={product.images[0]?.url || '/placeholder-product.jpg'}
              alt={product.name[language]}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {product.name[language]}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-primary-600">
                  ৳{currentPrice}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-500 line-through">
                    ৳{product.price}
                  </span>
                )}
              </div>
              {product.stock > 0 && product.stock <= 5 && (
                <p className="text-xs text-orange-600">
                  {language === 'bn' 
                    ? `শুধু ${product.stock}টি অবশিষ্ট`
                    : `Only ${product.stock} left in stock`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {language === 'bn' ? 'পরিমাণ' : 'Quantity'}
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= product.minOrderQuantity}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              
              <span className="min-w-[3rem] text-center text-lg font-medium text-gray-900 dark:text-white">
                {quantity}
              </span>
              
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.maxOrderQuantity}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {language === 'bn' 
                ? `ন্যূনতম ${product.minOrderQuantity}টি, সর্বোচ্চ ${product.maxOrderQuantity}টি`
                : `Min ${product.minOrderQuantity}, Max ${product.maxOrderQuantity}`
              }
            </p>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">
                {language === 'bn' ? 'মোট' : 'Total'}
              </span>
              <span className="text-xl font-bold text-primary-600">
                ৳{currentPrice * quantity}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock < 1 || isAdding}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                product.stock > 0 && !isAdding
                  ? isInCart
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAdding ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  {language === 'bn' ? 'যোগ করা হচ্ছে...' : 'Adding...'}
                </>
              ) : product.stock > 0 ? (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {isInCart 
                    ? (language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart')
                    : (language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart')
                  }
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {language === 'bn' ? 'স্টকে নেই' : 'Out of Stock'}
                </>
              )}
            </button>
            
            <Link
              to={`/products/${product.id}`}
              onClick={onClose}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickAddModal;
