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
  const { cart, cartTotal, language, updateCartItem, removeFromCart } = useStore();
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
         <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
               <ShoppingCart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
             </div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">
               {language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
             </h2>
           </div>
           <button
             onClick={onClose}
             className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
           >
             <X className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
           </button>
         </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
           {cart.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center px-4">
               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                 <ShoppingCart className="w-10 h-10 text-gray-400" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                 {language === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
               </h3>
               <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
                 {language === 'bn' 
                   ? 'কিছু পণ্য যোগ করে শুরু করুন' 
                   : 'Add some products to get started'
                 }
               </p>
               <Link
                 to="/products"
                 onClick={onClose}
                 className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
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
                     className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                   >
                     <img
                       src={item.product.images[0]?.url || '/placeholder-product.jpg'}
                       alt={item.product.name[language]}
                       className="w-16 h-16 rounded-lg object-cover flex-shrink-0 shadow-sm"
                     />
                     
                     <div className="flex-1 min-w-0">
                       <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                         {item.product.name[language]}
                       </h4>
                       <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                         ৳{item.price} {language === 'bn' ? 'প্রতি' : 'each'}
                       </p>
                       
                       {/* Quantity Controls */}
                       <div className="flex items-center gap-2 mt-3">
                         <button
                           onClick={() => handleQuantityUpdate(item.product.id, item.quantity - 1)}
                           disabled={isUpdating || item.quantity <= 1}
                           className="w-6 h-6 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm"
                         >
                           <Minus className="w-3 h-3 text-gray-600" />
                         </button>
                         
                         <span className="min-w-[2rem] text-center text-sm font-semibold text-gray-900 dark:text-white">
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
                           className="w-6 h-6 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm"
                         >
                           <Plus className="w-3 h-3 text-gray-600" />
                         </button>
                       </div>
                     </div>
                     
                     <div className="flex flex-col items-end gap-3">
                       <span className="text-lg font-bold text-orange-500">
                         ৳{item.subtotal}
                       </span>
                       <button
                         onClick={() => handleRemoveItem(item.product.id)}
                         disabled={isUpdating}
                         className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1"
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
           <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-6 bg-gray-50 dark:bg-gray-800">
             {/* Subtotal */}
             <div className="flex justify-between items-center py-2">
               <span className="text-lg font-bold text-gray-900 dark:text-white">
                 {language === 'bn' ? 'মোট' : 'Subtotal'}
               </span>
               <span className="text-2xl font-bold text-orange-500">
                 ৳{cartTotal}
               </span>
             </div>

             {/* Action Buttons */}
             <div className="space-y-3">
               <Link
                 to="/checkout"
                 onClick={onClose}
                 className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
               >
                 <CreditCard className="w-5 h-5" />
                 {language === 'bn' ? 'অনলাইনে পেমেন্ট' : 'Pay Online'}
               </Link>
               
               <Link
                 to="/checkout"
                 onClick={onClose}
                 className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
               >
                 <Truck className="w-5 h-5" />
                 {language === 'bn' ? 'ক্যাশ অন ডেলিভারিতে অর্ডার করুন' : 'Cash on Delivery'}
               </Link>
               
               <div className="pt-2">
                 <Link
                   to="/cart"
                   onClick={onClose}
                   className="w-full text-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 py-2 px-4 font-medium transition-colors duration-200 text-sm"
                 >
                   {language === 'bn' ? 'সম্পূর্ণ কার্ট দেখুন' : 'View Full Cart'} →
                 </Link>
               </div>
             </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ShoppingCartSidebar;
