import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { useStore } from '../store/useStore';
import { productsAPI, reviewsAPI } from '../utils/api';

interface Product {
  id: string;
  name: { en: string; bn: string };
  description: { en: string; bn: string };
  shortDescription?: { en: string; bn: string };
  price: number;
  discountPrice?: number;
  images: Array<{ url: string; public_id: string }>;
  category: { en: string; bn: string };
  ingredients: { en: string[]; bn: string[] };
  preparationTime: string;
  servingSize: string;
  isFeatured: boolean;
  isAvailable: boolean;
  stock: number;
  ratings: { average: number; count: number };
  minOrderQuantity: number;
  maxOrderQuantity: number;
  analytics?: {
    viewCount: number;
    addToCartCount: number;
    purchaseCount: number;
  };
}

interface Review {
  id: string;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    avatar?: { url: string; public_id: string };
  };
  rating: number;
  comment: { en: string; bn: string };
  images?: Array<{ url: string; public_id: string }>;
  createdAt: string;
  isVerified: boolean;
  adminResponse?: {
    message: { en: string; bn: string };
    respondedAt: string;
  };
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { t } = useTranslation(); // Unused variable
  const { language, addToCart } = useStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(false);
 
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
      fetchRelatedProducts();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id!);
      if (response.data.success) {
        const prod = response.data.product;
        setProduct(prod);
        try {
          // Update recently viewed list in localStorage
          const key = 'recentlyViewedProducts';
          const existingRaw = localStorage.getItem(key);
          const existing: Product[] = existingRaw ? JSON.parse(existingRaw) : [];
          const currentId = (prod as any).id || (prod as any)._id;
          
          // Remove if already exists, then add to front
          const filtered = existing.filter((p) => {
            const pId = (p as any).id || (p as any)._id;
            return pId !== currentId;
          });
          
          // Add current product to front and limit to 12
          const updated = [prod, ...filtered].slice(0, 12);
          localStorage.setItem(key, JSON.stringify(updated));
          // Set recently viewed (exclude current product)
        } catch {}
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await reviewsAPI.getProductReviews(id!, { limit: 10 });
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      setRelatedLoading(true);
      const response = await productsAPI.getRelatedProducts(id!, 4);
      if (response.data.success) {
        setRelatedProducts(response.data.products);
      }
    } catch (error: any) {
      console.error('Error fetching related products:', error);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      addToCart(product, quantity);
      
      // Track add to cart analytics (ensure we send a valid id)
      try {
        const productId = (product as any).id || (product as any)._id || id;
        if (productId) {
          await productsAPI.trackAddToCart(productId);
        }
      } catch (error) {
        console.error('Failed to track add to cart:', error);
      }
      
      toast.success(`Added ${quantity} ${language === 'bn' ? product.name.bn : product.name.en} to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;
    if (newQuantity >= product.minOrderQuantity && newQuantity <= product.maxOrderQuantity) {
      setQuantity(newQuantity);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Invalid Product
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No product ID provided
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Product Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Product ID: {id}
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  // Truncate description to 120 words
  const truncateDescription = (text: string, maxWords: number = 120) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const getDescription = () => {
    const desc = language === 'bn' ? product.description.bn : product.description.en;
    return showFullDescription ? desc : truncateDescription(desc);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="aspect-square">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[selectedImage]?.url}
                      alt={language === 'bn' ? product.name.bn : product.name.en}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <ShoppingCart className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-orange-500'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`${language === 'bn' ? product.name.bn : product.name.en} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              {/* Title and Rating */}
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {language === 'bn' ? product.name.bn : product.name.en}
                </h1>
                <div className="flex items-center gap-4">
                  {renderStars(product.ratings.average)}
                  <span className="text-gray-600 dark:text-gray-400">
                    ({product.ratings.count} reviews)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-orange-500">
                    ৳{currentPrice}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-gray-500 line-through">
                      ৳{product.price}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full">
                      {Math.round(((product.price - currentPrice) / product.price) * 100)}% OFF
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {getDescription()}
                </p>
                {(() => {
                  const desc = language === 'bn' ? product.description.bn : product.description.en;
                  const wordCount = desc.trim().split(/\s+/).length;
                  return wordCount > 120 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                    >
                      {showFullDescription 
                        ? (language === 'bn' ? 'কম দেখান' : 'Show Less')
                        : (language === 'bn' ? 'আরো দেখান' : 'Read More')
                      }
                    </button>
                  );
                })()}
              </div>

              {/* Product Details */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {language === 'bn' ? product.category.bn : product.category.en}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Preparation Time</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {product.preparationTime}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Serving Size</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {product.servingSize}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Stock</span>
                  <p className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= product.minOrderQuantity}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 border border-gray-300 rounded-lg min-w-[3rem] text-center dark:border-gray-600">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.maxOrderQuantity}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Min: {product.minOrderQuantity}, Max: {product.maxOrderQuantity}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable || product.stock === 0 || isAddingToCart}
                  className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>

              {/* Availability Status */}
              {!product.isAvailable && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    This product is currently unavailable
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients Section */}
          {product.ingredients && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Ingredients
              </h3>
              <div className="flex flex-wrap gap-2">
                {(language === 'bn' ? product.ingredients.bn : product.ingredients.en).map((ingredient, index) => (
                  <span
                    key={index}
                    className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Related Products
              </h3>
              
              {relatedLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Reviews Section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Customer Reviews ({product.ratings.count})
            </h3>
            
            {reviewsLoading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
                          {review.customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {review.customer.name}
                          </h4>
                          {review.isVerified && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {language === 'bn' && review.comment.bn ? review.comment.bn : review.comment.en}
                        </p>
                        
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {review.images.map((image, index) => (
                              <img
                                key={index}
                                src={image.url}
                                alt="Review"
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        
                        {review.adminResponse && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Admin Response
                              </span>
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {new Date(review.adminResponse.respondedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {language === 'bn' && review.adminResponse.message.bn 
                                ? review.adminResponse.message.bn 
                                : review.adminResponse.message.en}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No reviews yet. Be the first to review this product!
                </p>
              </div>
            )}
          </div>

          
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetailPage; 