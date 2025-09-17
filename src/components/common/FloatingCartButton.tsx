import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const FloatingCartButton: React.FC = () => {
  const { cart, cartCount, cartTotal, language, updateCartItem, removeFromCart } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const handleQuantityUpdate = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(productId));
    
    // Add a small delay for better UX
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
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 200));
    
    removeFromCart(productId);
    setUpdatingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  };

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
             <div className="flex items-center gap-2">
               <h3 className="font-semibold text-gray-900 dark:text-white">
                 {language === 'bn' ? 'কার্ট' : 'Cart'}
               </h3>
               <span className="text-sm text-gray-500 dark:text-gray-400">
                 ({cartCount} {language === 'bn' ? 'আইটেম' : 'items'})
               </span>
             </div>
             {cart.length > 0 && (
               <button
                 onClick={() => {
                   if (window.confirm(
                     language === 'bn' 
                       ? 'আপনি কি নিশ্চিত যে আপনি সব আইটেম মুছে ফেলতে চান?'
                       : 'Are you sure you want to clear all items from cart?'
                   )) {
                     cart.forEach(item => removeFromCart(item.product.id));
                   }
                 }}
                 className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                 title={language === 'bn' ? 'সব মুছে ফেলুন' : 'Clear all'}
               >
                 <X className="w-3 h-3" />
               </button>
             )}
           </div>
          
           <div className="space-y-3 max-h-48 overflow-y-auto">
             {cart.slice(0, 3).map((item) => {
               const isUpdating = updatingItems.has(item.product.id);
               return (
                 <motion.div 
                   key={item.product.id} 
                   className="flex items-center gap-3 py-2 group"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                 >
                   <img
                     src={item.product.images[0]?.url || '/placeholder-product.jpg'}
                     alt={item.product.name[language]}
                     className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                   />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                       {item.product.name[language]}
                     </p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">
                       ৳{item.price} {language === 'bn' ? 'প্রতি' : 'each'}
                     </p>
                   </div>
                   
                   {/* Quantity Controls */}
                   <div className="flex items-center gap-2">
                     <button
                       onClick={() => handleQuantityUpdate(item.product.id, item.quantity - 1)}
                       disabled={isUpdating || item.quantity <= 1}
                       className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       <Minus className="w-3 h-3 text-gray-600" />
                     </button>
                     
                     <span className="min-w-[1.5rem] text-center text-sm font-medium text-gray-900 dark:text-white">
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
                       className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       <Plus className="w-3 h-3 text-gray-600" />
                     </button>
                   </div>
                   
                   {/* Subtotal and Remove Button */}
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-semibold text-primary-600 min-w-[3rem] text-right">
                       ৳{item.subtotal}
                     </span>
                     <button
                       onClick={() => handleRemoveItem(item.product.id)}
                       disabled={isUpdating}
                       className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors opacity-0 group-hover:opacity-100"
                       title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove item'}
                     >
                       <Trash2 className="w-3 h-3" />
                     </button>
                   </div>
                 </motion.div>
               );
             })}
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
             <div className="flex gap-2">
               <Link
                 to="/cart"
                 className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-medium text-center block transition-colors"
               >
                 {language === 'bn' ? 'কার্ট দেখুন' : 'View Cart'}
               </Link>
               <Link
                 to="/checkout"
                 className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-center block transition-colors"
               >
                 {language === 'bn' ? 'চেকআউট' : 'Checkout'}
               </Link>
             </div>
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
