import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const FloatingCartButton: React.FC = () => {
  const { t } = useTranslation();
  const { cart, cartCount, cartTotal, language } = useStore();
  const [isHovered, setIsHovered] = useState(false);

  if (cartCount === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-6 right-6 z-50"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Cart Preview Tooltip */}
      {isHovered && cart.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full right-0 mb-4 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {language === 'bn' ? 'কার্ট' : 'Cart'}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {cartCount} {language === 'bn' ? 'আইটেম' : 'items'}
            </span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cart.slice(0, 3).map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 py-2">
                <img
                  src={item.product.images[0]?.url || '/placeholder-product.jpg'}
                  alt={item.product.name[language]}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.product.name[language]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.quantity}x ৳{item.price}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary-600">
                  ৳{item.subtotal}
                </span>
              </div>
            ))}
            {cart.length > 3 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                +{cart.length - 3} {language === 'bn' ? 'আরো' : 'more'} {language === 'bn' ? 'আইটেম' : 'items'}
              </p>
            )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900 dark:text-white">
                {language === 'bn' ? 'মোট' : 'Total'}
              </span>
              <span className="text-lg font-bold text-primary-600">
                ৳{cartTotal}
              </span>
            </div>
            <Link
              to="/cart"
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium text-center block transition-colors"
            >
              {language === 'bn' ? 'কার্ট দেখুন' : 'View Cart'}
            </Link>
          </div>
        </motion.div>
      )}

      {/* Floating Cart Button */}
      <Link to="/cart">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative bg-primary-500 hover:bg-primary-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <ShoppingCart className="w-6 h-6" />
          
          {/* Cart Count Badge */}
          <motion.div
            key={cartCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
          >
            {cartCount > 99 ? '99+' : cartCount}
          </motion.div>
        </motion.button>
      </Link>
    </motion.div>
  );
};

export default FloatingCartButton;
