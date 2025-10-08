import { motion } from 'framer-motion';
import { Heart, Minus, Plus, ShoppingCart, Star, Zap } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useFlashSalePrice } from '../../hooks/useFlashSalePrice';
import { Product, useStore } from '../../store/useStore';
import { productsAPI } from '../../utils/api';

interface ProductCardProps {
  product: Product;
  showQuickActions?: boolean;
  compact?: boolean;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showQuickActions = true,
  compact = false,
  viewMode = 'grid'
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, addToCart, cart, user, isAuthenticated } = useStore();
  const { openCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const flashSalePrice = useFlashSalePrice(product._id || product.id);
  // Safe defaults for min/max to ensure quick actions always work
  const minOrderQty = product.minOrderQuantity || 1;
  const maxOrderQty = product.maxOrderQuantity || 9999;
  const [quantity, setQuantity] = useState(minOrderQty);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  // Track viewport width to adapt description length responsively
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
  React.useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Truncate a title to a specific number of words
  const truncateWords = (text: string | undefined, maxWords: number): string => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '…';
  };

  // Strip HTML tags and clean up description for card view
  const cleanDescription = (html: string | undefined): string => {
    if (!html) return '';
    
    // Remove HTML tags
    let cleaned = html.replace(/<[^>]*>/g, '');
    
    // Remove emoji characters (🌿, etc.)
    cleaned = cleaned.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\uD83D\uDE00-\uDE4F]+|[\uD83D\uDE80-\uDEFF]+|[\u2600-\u27BF]+/g, '');
    
    // Clean up extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  };

  // Determine stock availability robustly (API may omit stock on some lists)
  const inStock = product.isAvailable !== false && (
    product.stock == null ? true : product.stock > 0
  );
  const totalSold: number | undefined = (product as any).analytics?.purchaseCount;
  
  

  // Check if product is already in cart
  const productId = product.id || (product as any)._id;
  const cartItem = cart.find(item => {
    const itemId = item.product.id || (item.product as any)._id;
    return itemId === productId;
  });
  const isInCart = !!cartItem;

  // Resolve a safe category label without exposing raw IDs
  const getCategoryLabel = (): string => {
    const category: any = (product as any).category;
    if (!category) return '';
    // If populated object with name
    if (typeof category === 'object' && category.name) {
      const nameObj = category.name as { en?: string; bn?: string };
      return (language === 'bn' ? nameObj.bn : nameObj.en) || '';
    }
    if (typeof category === 'string') {
      // Hide MongoDB ObjectId-like strings
      if (/^[a-f\d]{24}$/i.test(category)) return '';
      // Otherwise show the string (likely a slug); prettify
      return category.replace(/[-_]/g, ' ');
    }
    return '';
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock < 1) {
      toast.error(t('products.outOfStock'));
      return;
    }

    if (quantity < minOrderQty) {
      toast.error(
        language === 'bn' 
          ? `ন্যূনতম ${minOrderQty}টি অর্ডার করুন`
          : `Minimum order quantity is ${minOrderQty}`
      );
      return;
    }

    if (quantity > maxOrderQty) {
      toast.error(
        language === 'bn' 
          ? `সর্বোচ্চ ${maxOrderQty}টি অর্ডার করতে পারেন`
          : `Maximum order quantity is ${maxOrderQty}`
      );
      return;
    }

    setIsAdding(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    addToCart({ ...product, id: productId }, quantity);

    // Track add to cart (fire and forget)
    try {
      if (productId) {
        productsAPI.trackAddToCart(productId).catch(() => {});
      }
    } catch {}
    
    toast.success(
      language === 'bn' 
        ? `${product.name.bn} (${quantity}টি) কার্টে যোগ করা হয়েছে`
        : `${product.name.en} (${quantity}) added to cart`,
      {
        duration: 2000,
        icon: '🛒',
      }
    );
    
    setIsAdding(false);
    
    // Open cart sidebar after adding
    openCart();
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= minOrderQty && newQuantity <= maxOrderQty) {
      setQuantity(newQuantity);
    }
  };

  const handleWishlistToggle = async () => {
    if (isWishlistLoading) return;
    
    const productId = product.id || (product as any)._id;
    if (!productId) {
      console.error('Product ID is undefined');
      return;
    }
    
    
    
    setIsWishlistLoading(true);
    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!inStock) {
      toast.error(t('products.outOfStock'));
      return;
    }

    if (quantity < minOrderQty) {
      toast.error(
        language === 'bn' 
          ? `ন্যূনতম ${minOrderQty}টি অর্ডার করুন`
          : `Minimum order quantity is ${minOrderQty}`
      );
      return;
    }

    if (quantity > maxOrderQty) {
      toast.error(
        language === 'bn' 
          ? `সর্বোচ্চ ${maxOrderQty}টি অর্ডার করতে পারেন`
          : `Maximum order quantity is ${maxOrderQty}`
      );
      return;
    }

    // If user is authenticated, proceed directly to checkout
    if (isAuthenticated && user) {
      setIsBuyingNow(true);
      
      try {
        // Add product to cart first
        addToCart({ ...product, id: product.id || (product as any)._id }, quantity);
        
        // Navigate to checkout
        navigate('/checkout');
        
        toast.success(
          language === 'bn' 
            ? `${product.name.bn} চেকআউটে যোগ করা হয়েছে`
            : `${product.name.en} added to checkout`,
          { duration: 2000 }
        );
      } catch (error) {
        console.error('Error in buy now:', error);
        toast.error('Failed to proceed to checkout');
      } finally {
        setIsBuyingNow(false);
      }
    } else {
      // Guest users: add to cart and go to checkout directly
      setIsBuyingNow(true);
      try {
        addToCart({ ...product, id: product.id || (product as any)._id }, quantity);
        navigate('/checkout');
        toast.success(language === 'bn' ? 'চেকআউটে যান' : 'Proceeding to checkout');
      } finally {
        setIsBuyingNow(false);
      }
    }
  };

  
  // Flash sale price takes priority over regular discount
  const currentPrice = flashSalePrice?.isOnFlashSale 
    ? flashSalePrice.flashSalePrice 
    : (product.discountPrice || product.price);
  const originalPrice = flashSalePrice?.isOnFlashSale 
    ? flashSalePrice.originalPrice 
    : product.price;
  const hasDiscount = flashSalePrice?.isOnFlashSale || !!product.discountPrice;
  const isFlashSale = flashSalePrice?.isOnFlashSale || false;
  const flashSaleStock = flashSalePrice?.remainingStock;

  // Horizontal layout for list view (like the image)
  if (viewMode === 'list' && !compact) {
    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        transition={{ duration: 0.3 }}
        className="group card   hover:shadow-xl transition-all duration-300 h-full min-w-0"
      >
        <Link to={`/products/${product.id || (product as any)._id}`} className="block">
          <div className="flex min-h-44">
            {/* Product Image - Left Side */}
            <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden">
              <img
                src={product.images[0]?.url || '/placeholder-product.jpg'}
                alt={product.name[language]}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                loading="lazy"
              />
              
              {/* Badges */}
              <div className="absolute top-1 left-1 flex flex-col gap-1">
                {isFlashSale && (
                  <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px] animate-pulse">
                    ⚡ FLASH SALE
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                    {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                  </span>
                )}
                {typeof totalSold === 'number' && totalSold >= 50 && (
                  <span className="bg-yellow-500 text-black font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide shadow">
                    Best Seller
                  </span>
                )}
              </div>

              {/* Stock Status */}
              {(!inStock) && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="bg-red-500 text-white font-bold px-2 py-1 rounded text-xs">
                    {t('products.outOfStock')}
                  </span>
                </div>
              )}

              {/* Wishlist Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const productId = product.id || (product as any)._id;
                  if (isInWishlist(productId)) {
                    removeFromWishlist(productId);
                  } else {
                    addToWishlist(productId);
                  }
                }}
                className="absolute top-1 right-1 p-1 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
              >
                <Heart className={`w-3 h-3 ${isInWishlist(product.id || (product as any)._id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Product Info - Right Side */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              {/* Top Section */}
              <div>
                {/* Title */}
                <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 ${
                  language === 'bn' ? 'font-bengali text-sm' : 'text-sm'
                }`} title={product.name[language]}>
                  {truncateWords(
                    product.name[language],
                    viewportWidth < 380 ? 4 : viewportWidth < 640 ? 6 : viewportWidth < 1024 ? 10 : 12
                  )}
                </h3>

                {/* Category Tag (hide raw IDs) */}
                {getCategoryLabel() && (
                  <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full mb-2">
                    {getCategoryLabel()}
                  </span>
                )}

                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    ৳{currentPrice}
                  </span>
                  {hasDiscount && (
                  <span className="text-gray-500 line-through text-sm">
                      ৳{originalPrice}
                  </span>
                  )}
                </div>

                {/* Description (responsive-length preview) */}
                {product.description && (
                  <p className={`text-gray-600 dark:text-gray-400 text-xs mb-2 ${
                    language === 'bn' ? 'font-bengali' : ''
                  }`}>
                    {truncateWords(
                      cleanDescription(product.description[language]),
                      viewportWidth < 380 ? 8 : viewportWidth < 640 ? 12 : viewportWidth < 1024 ? 24 : 32
                    )}
                  </p>
                )}

                {/* Additional Info: Stock, Sold count */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {/* Stock Status */}
                  <div className="flex items-center gap-1">
                    <span>{t('products.stock')}:</span>
                    <span className={`font-medium ${
                      inStock 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {inStock 
                        ? (typeof product.stock === 'number' && product.stock >= 0 
                            ? `${product.stock} ${t('products.available')}` 
                            : t('products.inStock'))
                        : t('products.outOfStock')
                      }
                    </span>
                  </div>

                  {/* Sold count */}
                  <div className="flex items-center gap-1">
                    <span>{t('products.sold')}:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {(product as any).analytics?.purchaseCount || 0}
                    </span>
                  </div>

                  {/* Rating */}
                  {product.ratings?.count > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="font-medium">
                        {product.ratings?.average?.toFixed(1)} ({product.ratings?.count})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section - Quick Add Button */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 order-2 sm:order-1">
                  &nbsp;
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(e);
                  }}
                  disabled={!inStock || isAdding}
                  className={`w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded text-xs font-medium transition-all duration-200 border ${
                    isInCart
                      ? 'bg-green-500 border-green-500 text-white'
                      : inStock
                      ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAdding ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : isInCart ? (
                    'In Cart'
                  ) : inStock ? (
                    t('products.addToCart')
                  ) : (
                    t('products.outOfStock')
                  )}
                </button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="card overflow-hidden hover:shadow-xl transition-all duration-300 h-full min-w-0"
      
    >
      <Link to={`/products/${product.id || (product as any)._id}`} className="block">
        {/* Product Image */}
        <div className={`relative overflow-hidden flex justify-center items-center w-full ${compact ? 'h-48' : 'h-36'}`}>
          <img
            src={product.images[0]?.url || '/placeholder-product.jpg'}
            alt={product.name[language]}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            loading="lazy"
          />
          
          {/* Badges */}
          <div className={`absolute top-2 left-2 flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
            {isFlashSale && (
              <span className={`bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-2 py-1 rounded-full animate-pulse ${compact ? 'text-[10px]' : 'text-xs'}`}>
                ⚡ FLASH
              </span>
            )}
            {hasDiscount && (
              <span className={`bg-red-500 text-white font-bold px-2 py-1 rounded-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
              </span>
            )}
            {typeof totalSold === 'number' && totalSold >= 50 && (
              <span className={`bg-yellow-400 text-black font-extrabold px-2 py-1 rounded-full uppercase tracking-wide shadow ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
                Best Seller
              </span>
            )}
            {/* Featured badge intentionally hidden as requested */}
          </div>

          {/* Right side discount amount badge */}
          {hasDiscount && (
            <div className={`absolute top-2 right-2`}>
              <span className={`bg-red-500 text-white font-bold px-2 py-1 rounded-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
                ৳{Math.round(originalPrice - currentPrice)} DISCOUNT
              </span>
            </div>
          )}

          {/* Sold count badge - emphasize for users */}
          {typeof totalSold === 'number' && (
            <div className="absolute bottom-2 left-2">
              <span className={`bg-black/70 text-white font-semibold px-2 py-1 rounded-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
                Sold {totalSold}
              </span>
            </div>
          )}

          {/* Stock Status */}
          {(!inStock) && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg">
                {t('products.outOfStock')}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWishlistToggle();
                }}
                disabled={isWishlistLoading}
                className={`p-2 rounded-full shadow-md transition-colors ${
                  isInWishlist(product.id || (product as any)._id)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart 
                  className={`w-4 h-4 ${
                    isInWishlist(product.id || (product as any)._id) ? 'fill-current' : ''
                  }`} 
                />
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={`${compact ? 'p-2 space-y-2 min-h-[80px]' : 'p-2 space-y-1 min-h-[70px]'}`}>
          {/* Title */}
          <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-1 ${
            compact 
              ? (language === 'bn' ? 'font-bengali text-sm' : 'text-sm')
              : (language === 'bn' ? 'font-bengali text-sm' : 'text-xs md:text-sm')
          }`} title={product.name[language]}>
            {truncateWords(
              product.name[language],
              compact
                ? (viewportWidth < 640 ? 4 : 5)
                : (viewportWidth < 380 ? 4 : viewportWidth < 640 ? 6 : 8)
            )}
          </h3>

          {/* Rating */}
          {product.ratings?.count > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(product.ratings?.average || 0)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {product.ratings?.average?.toFixed(1)} ({product.ratings?.count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className={`flex items-center gap-2`}>
            <span className={`font-bold text-primary-600 ${compact ? 'text-lg' : 'text-sm md:text-base'}`}>
              ৳{currentPrice}
            </span>
            {hasDiscount && (
              <span className={`text-gray-500 line-through ${compact ? 'text-sm' : 'text-sm'}`}>
                ৳{originalPrice}
              </span>
            )}
          </div>

          {/* Flash Sale Stock Progress */}
          {isFlashSale && flashSalePrice?.stockLimit && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Flash Sale: {flashSalePrice.soldCount} sold</span>
                <span>{flashSaleStock} left</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(flashSalePrice.soldCount / flashSalePrice.stockLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Additional Info: Category, Stock, Sold count */}
          <div className="space-y-1">
            {/* Category */}
            {getCategoryLabel() && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  {getCategoryLabel()}
                </span>
              </div>
            )}
            
            {/* Stock Status */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500 dark:text-gray-400">{t('products.stock')}:</span>
              <span className={`font-medium ${
                inStock 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {inStock 
                  ? (typeof product.stock === 'number' && product.stock >= 0 
                      ? `${product.stock} ${t('products.available')}` 
                      : t('products.inStock'))
                  : t('products.outOfStock')
                }
              </span>
            </div>

            {/* Sold count */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-500 dark:text-gray-400">{t('products.sold')}:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {(product as any).analytics?.purchaseCount || 0}
              </span>
            </div>
          </div>

         
        </div>
      </Link>

      

      {/* Quick Add to Cart Section */}
      {showQuickActions && (
        <div className="p-3 pt-0 space-y-3">
          {/* Quantity Selector */}
          {inStock && (
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuantityChange(quantity - 1);
                }}
                disabled={quantity <= minOrderQty}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              
              <span className="min-w-[1.75rem] text-center font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                {quantity}
              </span>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuantityChange(quantity + 1);
                }}
                disabled={quantity >= maxOrderQty}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          {/* Add to Cart Button */}
          <motion.button
            onClick={handleAddToCart}
            disabled={!inStock || isAdding}
            whileHover={inStock && !isAdding ? { scale: 1.02 } : {}}
            whileTap={inStock && !isAdding ? { scale: 0.98 } : {}}
            className={`w-full flex items-center justify-center sm:gap-2 gap-1 py-2 sm:py-3 px-1 sm:px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
              inStock && !isAdding
                ? isInCart
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'btn-primary hover:bg-primary-700'
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
            ) : inStock ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                {isInCart 
                  ? (language === 'bn' ? 'কার্টে আছে' : 'In Cart')
                  : t('products.addToCart')
                }
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {t('products.outOfStock')}
              </>
            )}
          </motion.button>

          {/* Buy Now Button */}
          {inStock && (
            <motion.button
              onClick={handleBuyNow}
              disabled={!inStock || isBuyingNow}
              whileHover={inStock && !isBuyingNow ? { scale: 1.02 } : {}}
              whileTap={inStock && !isBuyingNow ? { scale: 0.98 } : {}}
              className={`w-full flex items-center justify-center sm:gap-2 gap-1 py-2 sm:py-3 px-1 sm:px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-lg ${
                !inStock || isBuyingNow ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isBuyingNow ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  {language === 'bn' ? 'অর্ডার করা হচ্ছে...' : 'Ordering...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {language === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}
                </>
              )}
            </motion.button>
          )}

          {/* Stock Info */}
          {inStock && typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-orange-600 text-center">
              {t('products.onlyLeft', { count: product.stock })}
            </p>
          )}
        </div>
      )}

      
    </motion.div>
  );
};

export default ProductCard; 