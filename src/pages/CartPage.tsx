import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { contentAPI } from '../utils/api';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, cartCount, updateCartItem, removeFromCart, clearCart, language } = useStore();
  
  const [isLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Delivery settings (pulled from backend public endpoint)
  const [deliverySettings, setDeliverySettings] = useState<{ deliveryCharge: number; freeDeliveryThreshold: number; zones?: Array<{ id: string; name: { en: string; bn: string }; price: number }> } | null>(null);
  const baseDeliveryCharge = deliverySettings?.deliveryCharge ?? 60; // Default fallback
  const freeThreshold = deliverySettings?.freeDeliveryThreshold ?? 500; // Default fallback
  
  // Check if any product in cart has free delivery
  const hasFreeDeliveryProduct = cart.some(item => {
    const product = item.product;
    return product && product.freeDelivery === true;
  });
  
  // Calculate delivery charge (free if threshold met or product has free delivery)
  const deliveryCharge = cartTotal >= freeThreshold || hasFreeDeliveryProduct ? 0 : baseDeliveryCharge;
  const finalTotal = cartTotal + deliveryCharge;

  // Safely resolve localized strings with sensible fallbacks
  const getLocalized = (value: any): string => {
    if (!value) return '';
    const preferred = language === 'bn' ? value?.bn ?? value?.en : value?.en ?? value?.bn;
    if (typeof preferred === 'string') return preferred;
    if (typeof value === 'string') return value;
    return '';
  };

  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartItem(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeFromCart(productId);
    toast.success(`${productName} removed from cart`);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    toast.success('Cart cleared successfully');
  };

  const handleProceedToCheckout = () => {
    if (cartCount === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  const truncateWords = (text: string, maxWords: number): string => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '…';
  };

  // Fetch delivery settings on component mount
  useEffect(() => {
    (async () => {
      try {
        const res = await contentAPI.getDeliverySettings();
        if (res.data?.success) {
          setDeliverySettings(res.data.settings);
        }
      } catch (e) {
        // keep defaults
      }
    })();
  }, []);

  if (cartCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="w-32 h-32 mx-auto mb-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Start Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Shopping Cart
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            {cartCount > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-red-600 hover:text-red-800 transition-colors font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cart.map((item, index) => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6"
                    >
                      <div className="flex items-center gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images && item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]?.url}
                              alt={getLocalized(item.product?.name) || 'Product image'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate" title={getLocalized(item.product?.name) || 'Product'}>
                            {truncateWords(getLocalized(item.product?.name) || 'Product', 5)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {getLocalized(item.product?.category?.name) || '—'}
                          </p>
                          
                          {/* Price */}
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-orange-500">
                              ৳{item.price}
                            </span>
                            {item.product.discountPrice && item.product.price !== item.product.discountPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ৳{item.product.price}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <button
                              onClick={() => handleQuantityUpdate(item.product.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 text-gray-900 dark:text-white font-medium min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityUpdate(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.maxOrderQuantity}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right min-w-[4rem]">
                            <div className="font-bold text-gray-900 dark:text-white">
                              ৳{item.subtotal}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(
                              item.product.id,
                              getLocalized(item.product?.name) || 'Product'
                            )}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-8"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal ({cartCount} items)
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ৳{cartTotal}
                    </span>
                  </div>

                  {/* Delivery Charge */}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Delivery Charge
                    </span>
                    <span className={`font-medium ${deliveryCharge === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      {deliveryCharge === 0 ? (hasFreeDeliveryProduct ? 'FREE (Product) 🎉' : 'FREE 🎉') : `৳${deliveryCharge}`}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-xl font-bold text-orange-500">
                        ৳{finalTotal}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {deliveryCharge === 0 
                        ? (hasFreeDeliveryProduct ? 'FREE delivery included (Product)' : `FREE delivery (Order ≥ ৳${freeThreshold})`)
                        : `Delivery charge: ৳${deliveryCharge} (included)`}
                    </p>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleProceedToCheckout}
                  disabled={isLoading}
                  className="w-full bg-orange-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-orange-600 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                {/* Continue Shopping */}
                <Link
                  to="/products"
                  className="block text-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mt-4"
                >
                  Continue Shopping
                </Link>

                {/* Delivery Info */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Delivery Options
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Free pickup from restaurant</li>
                    <li>• Home delivery available {deliveryCharge === 0 && cartTotal >= freeThreshold ? '(FREE)' : `(৳${baseDeliveryCharge})`}</li>
                    <li>• Estimated delivery: 30-45 minutes</li>
                    <li>• Available 7 days a week</li>
                  </ul>
                  
                  {/* Free Delivery Promotion */}
                  {deliveryCharge > 0 && cartTotal < freeThreshold && !hasFreeDeliveryProduct ? (
                    <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="text-sm text-orange-800 dark:text-orange-200">
                        <div className="font-medium mb-1">🚚 FREE Delivery Available!</div>
                        <div className="text-xs">
                          Add ৳{freeThreshold - cartTotal} more to get FREE home delivery
                        </div>
                      </div>
                    </div>
                  ) : deliveryCharge === 0 ? (
                    <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="text-sm text-green-800 dark:text-green-200">
                        <div className="font-medium">🎉 FREE Delivery Unlocked!</div>
                        <div className="text-xs">
                          {hasFreeDeliveryProduct 
                            ? 'Your order includes products with FREE delivery'
                            : `Your order qualifies for FREE home delivery (Order ≥ ৳${freeThreshold})`}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Clear Cart Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Clear Cart?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to remove all items from your cart? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearCart}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage; 