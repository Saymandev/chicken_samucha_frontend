import { motion } from 'framer-motion';
import { Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
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
  const { language, addToCart, cart } = useStore();
  const { openCart } = useCart();
  const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);
  const [isAdding, setIsAdding] = useState(false);

  // Truncate a title to a specific number of words
  const truncateWords = (text: string | undefined, maxWords: number): string => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '…';
  };

  // Determine stock availability robustly (API may omit stock on some lists)
  const inStock = (product as any).isAvailable !== false && (
    (product as any).stock == null ? true : (product as any).stock > 0
  );
  const totalSold: number | undefined = (product as any).analytics?.purchaseCount ?? (product as any).salesQuantity;

  // Check if product is already in cart
  const productId = product.id || (product as any)._id;
  const cartItem = cart.find(item => {
    const itemId = item.product.id || (item.product as any)._id;
    return itemId === productId;
  });
  const isInCart = !!cartItem;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock < 1) {
      toast.error(t('products.outOfStock'));
      return;
    }

    if (quantity < product.minOrderQuantity) {
      toast.error(
        language === 'bn' 
          ? `ন্যূনতম ${product.minOrderQuantity}টি অর্ডার করুন`
          : `Minimum order quantity is ${product.minOrderQuantity}`
      );
      return;
    }

    if (quantity > product.maxOrderQuantity) {
      toast.error(
        language === 'bn' 
          ? `সর্বোচ্চ ${product.maxOrderQuantity}টি অর্ডার করতে পারেন`
          : `Maximum order quantity is ${product.maxOrderQuantity}`
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
    if (newQuantity >= product.minOrderQuantity && newQuantity <= product.maxOrderQuantity) {
      setQuantity(newQuantity);
    }
  };

  const currentPrice = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;

  // Horizontal layout for list view (like the image)
  if (viewMode === 'list' && !compact) {
    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        transition={{ duration: 0.3 }}
        className="card overflow-hidden hover:shadow-xl transition-all duration-300 h-full"
      >
        <Link to={`/products/${product.id || (product as any)._id}`} className="block">
          <div className="flex h-32">
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
                {hasDiscount && (
                  <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                    {Math.round(((product.price - currentPrice) / product.price) * 100)}% OFF
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                    {language === 'bn' ? 'বৈশিষ্ট্য' : 'FEATURED'}
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
            </div>

            {/* Product Info - Right Side */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              {/* Top Section */}
              <div>
                {/* Title */}
                <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 ${
                  language === 'bn' ? 'font-bengali text-sm' : 'text-sm'
                }`} title={product.name[language]}>
                  {product.name[language]}
                </h3>

                {/* Category Tag */}
                <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full mb-2">
                  {typeof product.category === 'string' ? product.category : 'food'}
                </span>

                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    ৳{currentPrice}
                  </span>
                  {hasDiscount && (
                    <span className="text-gray-500 line-through text-sm">
                      ৳{product.price}
                    </span>
                  )}
                </div>

                {/* Short Description */}
                {product.shortDescription && (
                  <p className={`text-gray-600 dark:text-gray-400 text-xs line-clamp-2 mb-2 ${
                    language === 'bn' ? 'font-bengali' : ''
                  }`}>
                    {product.shortDescription[language]}
                  </p>
                )}
              </div>

              {/* Bottom Section - Quick Add Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {product.preparationTime}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(e);
                  }}
                  disabled={!inStock || isAdding}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 border ${
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
                    'Quick Add'
                  ) : (
                    'Out of Stock'
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
      className="card overflow-hidden hover:shadow-xl transition-all duration-300 h-full p-0"
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
            {hasDiscount && (
              <span className={`bg-red-500 text-white font-bold px-2 py-1 rounded-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {Math.round(((product.price - currentPrice) / product.price) * 100)}% OFF
              </span>
            )}
            {typeof totalSold === 'number' && totalSold >= 50 && (
              <span className={`bg-yellow-500 text-white font-bold px-2 py-1 rounded-full uppercase tracking-wide ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
                Best Seller
              </span>
            )}
            {product.isFeatured && (
              <span className={`bg-primary-500 text-white font-bold px-2 py-1 rounded-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {language === 'bn' ? 'বৈশিষ্ট্য' : 'FEATURED'}
              </span>
            )}
          </div>

          {/* Right side discount amount badge */}
          {hasDiscount && (
            <div className={`absolute top-2 right-2`}>
              <span className={`bg-red-500 text-white font-bold px-2 py-1 rounded-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
                ৳{Math.round(product.price - currentPrice)} DISCOUNT
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
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Add to wishlist logic
                }}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
              >
                <Heart className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={`${compact ? 'p-3 space-y-2 min-h-[140px]' : 'p-2 space-y-1 min-h-[100px]'}`}>
          {/* Title */}
          <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-1 ${
            compact 
              ? (language === 'bn' ? 'font-bengali text-sm' : 'text-sm')
              : (language === 'bn' ? 'font-bengali text-sm' : 'text-xs md:text-sm')
          }`} title={product.name[language]}>
            {truncateWords(product.name[language], compact ? 4 : 5)}
          </h3>

          {/* Rating */}
          {product.ratings.count > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(product.ratings.average)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {product.ratings.average.toFixed(1)} ({product.ratings.count})
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
                ৳{product.price}
              </span>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{product.preparationTime}</span>
            <span className="flex items-center gap-1">
              {((product as any).analytics?.purchaseCount ?? (product as any).salesQuantity) ? (
                <>
                  <span>Sold:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {(product as any).analytics?.purchaseCount ?? (product as any).salesQuantity}
                  </span>
                </>
              ) : (
                <span>{product.servingSize}</span>
              )}
            </span>
          </div>

         
        </div>
      </Link>

      

      {/* Quick Add to Cart Section */}
      {showQuickActions && (
        <div className="p-3 pt-0 space-y-3">
          {/* Quantity Selector */}
          {inStock && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuantityChange(quantity - 1);
                }}
                disabled={quantity <= product.minOrderQuantity}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              
              <span className="min-w-[2rem] text-center font-medium text-gray-900 dark:text-white">
                {quantity}
              </span>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuantityChange(quantity + 1);
                }}
                disabled={quantity >= product.maxOrderQuantity}
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
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
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

          {/* Stock Info */}
          {inStock && typeof (product as any).stock === 'number' && (product as any).stock <= 5 && (
            <p className="text-xs text-orange-600 text-center">
              {language === 'bn' 
                ? `শুধু ${(product as any).stock}টি অবশিষ্ট`
                : `Only ${(product as any).stock} left in stock`
              }
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ProductCard; 