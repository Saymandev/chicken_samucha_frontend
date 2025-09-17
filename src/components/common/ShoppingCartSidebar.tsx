import { motion } from 'framer-motion';
import { CreditCard, Minus, Plus, ShoppingCart, Trash2, Truck, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface ShoppingCartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingCartSidebar: React.FC<ShoppingCartSidebarProps> = ({ isOpen, onClose }) => {
  const { cart, cartCount, cartTotal, language, updateCartItem, removeFromCart } = useStore();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityUpdate = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(productId));
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    updateCartItem(productId, newQuantity);
    setUpdatingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  const handleRemoveItem = async (productId: string) => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    removeFromCart(productId);
    setUpdatingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {language === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {language === 'bn' 
                  ? 'কিছু পণ্য যোগ করে শুরু করুন' 
                  : 'Add some products to get started'
                }
              </p>
              <Link
                to="/products"
                onClick={onClose}
                className="btn-primary px-6 py-3"
              >
                {language === 'bn' ? 'পণ্য দেখুন' : 'Browse Products'}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const isUpdating = updatingItems.has(item.product.id);
                return (
                  <motion.div
                    key={item.product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <img
                      src={item.product.images[0]?.url || '/placeholder-product.jpg'}
                      alt={item.product.name[language]}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.product.name[language]}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ৳{item.price} {language === 'bn' ? 'প্রতি' : 'each'}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleQuantityUpdate(item.product.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                          className="p-1 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        
                        <span className="min-w-[2rem] text-center text-sm font-medium text-gray-900 dark:text-white">
                          {isUpdating ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full mx-auto"
                            />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        
                        <button
                          onClick={() => handleQuantityUpdate(item.product.id, item.quantity + 1)}
                          disabled={isUpdating || item.quantity >= item.product.maxOrderQuantity}
                          className="p-1 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-primary-600">
                        ৳{item.subtotal}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        disabled={isUpdating}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove item'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Total and Actions */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {language === 'bn' ? 'মোট' : 'Subtotal'}
              </span>
              <span className="text-2xl font-bold text-primary-600">
                ৳{cartTotal}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/checkout"
                onClick={onClose}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                {language === 'bn' ? 'অনলাইনে পেমেন্ট' : 'Pay Online'}
              </Link>
              
              <Link
                to="/checkout"
                onClick={onClose}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Truck className="w-5 h-5" />
                {language === 'bn' ? 'ক্যাশ অন ডেলিভারিতে অর্ডার করুন' : 'Cash on Delivery'}
              </Link>
              
              <Link
                to="/cart"
                onClick={onClose}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg font-medium text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {language === 'bn' ? 'কার্ট দেখুন' : 'View Cart'}
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ShoppingCartSidebar;
