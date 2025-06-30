import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Product, useStore } from '../../store/useStore';

interface ProductCardProps {
  product: Product;
  showQuickActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showQuickActions = true 
}) => {
  const { t } = useTranslation();
  const { language, addToCart } = useStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock < 1) {
      toast.error(t('products.outOfStock'));
      return;
    }

    addToCart(product, product.minOrderQuantity || 1);
    toast.success(
      language === 'bn' 
        ? `${product.name.bn} কার্টে যোগ করা হয়েছে`
        : `${product.name.en} added to cart`
    );
  };

  const currentPrice = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="card overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <Link to={`/products/${product.id || (product as any)._id}`} className="block">
        {/* Product Image */}
        <div className="relative overflow-hidden aspect-square">
          <img
            src={product.images[0]?.url || '/placeholder-product.jpg'}
            alt={product.name[language]}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {Math.round(((product.price - currentPrice) / product.price) * 100)}% OFF
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {language === 'bn' ? 'বৈশিষ্ট্য' : 'FEATURED'}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {(product.stock < 1) && (
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
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 ${
            language === 'bn' ? 'font-bengali text-lg' : 'text-base'
          }`}>
            {product.name[language]}
          </h3>

          {/* Short Description */}
          {product.shortDescription && (
            <p className={`text-sm text-gray-600 dark:text-gray-400 line-clamp-2 ${
              language === 'bn' ? 'font-bengali' : ''
            }`}>
              {product.shortDescription[language]}
            </p>
          )}

          {/* Rating */}
          {product.ratings.count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.ratings.average)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {product.ratings.average.toFixed(1)} ({product.ratings.count})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">
              ৳{currentPrice}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ৳{product.price}
              </span>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{product.preparationTime}</span>
            <span>{product.servingSize}</span>
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      {showQuickActions && (
        <div className="p-4 pt-0">
          <button
            onClick={handleAddToCart}
            disabled={ product.stock < 1}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
               product.stock > 0
                ? 'btn-primary hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.stock > 0 
              ? t('products.addToCart')
              : t('products.outOfStock')
            }
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ProductCard; 