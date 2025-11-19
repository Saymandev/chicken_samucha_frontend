import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Star, Zap } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../store/useStore';
import '../styles/quill-custom.css';
import { contentAPI, ordersAPI, productsAPI, reviewsAPI } from '../utils/api';
import { trackBrowserAndServer } from '../utils/fbpixel';

interface Product {
  id: string;
  name: { en: string; bn: string };
  description: { en: string; bn: string };
  shortDescription?: { en: string; bn: string };
  price: number;
  discountPrice?: number;
  images: Array<{ url: string; public_id: string }>;
  category: { 
    _id: string;
    name: { en: string; bn: string };
    slug: string;
  };
  // removed: ingredients, preparationTime, servingSize
  isFeatured: boolean;
  isAvailable: boolean;
  stock: number;
  ratings: { average: number; count: number };
  minOrderQuantity: number;
  maxOrderQuantity: number;
  youtubeVideoUrl?: string;
  analytics?: {
    viewCount: number;
    addToCartCount: number;
    purchaseCount: number;
  };
  // Simple Variant System
  hasVariants?: boolean;
  colorVariants?: Array<{ color: string; colorCode: string; image: { public_id: string; url: string } }>;
  sizeVariants?: Array<{ size: string }>;
  weightVariants?: Array<{ weight: string; priceModifier: number }>;
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
  const { t } = useTranslation();
  const { language, addToCart, user } = useStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { openCart } = useCart();

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // Review pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
  const [quickOrderData, setQuickOrderData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [quickOrderZoneId, setQuickOrderZoneId] = useState('');
  const [deliverySettings, setDeliverySettings] = useState<{
    deliveryCharge: number;
    freeDeliveryThreshold: number;
    zones?: Array<{ id: string; name: { en: string; bn: string }; price: number }>;
  } | null>(null);
  
  // Simple Variant Selection State
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedWeight, setSelectedWeight] = useState<string>('');

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

  // Reset gallery index when variant selection changes so color image shows immediately
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColor, selectedSize, selectedWeight]);

  useEffect(() => {
    (async () => {
      try {
        const res = await contentAPI.getDeliverySettings();
        if (res.data?.success) {
          setDeliverySettings(res.data.settings);
        }
      } catch (error) {
        // Default fallbacks will be used
      }
    })();
  }, []);

  const quickOrderPricing = useMemo(() => {
    const zones = deliverySettings?.zones || [];
    const selectedZone = zones.find((zone) => zone.id === quickOrderZoneId) || null;
    const baseCharge = selectedZone?.price ?? deliverySettings?.deliveryCharge ?? 60;
    const threshold = deliverySettings?.freeDeliveryThreshold ?? 500;
    const hasFreeDeliveryProduct = Boolean(product && (product as any)?.freeDelivery === true);
    const unitPrice = product ? (product.discountPrice ?? product.price ?? 0) : 0;
    const orderValue = unitPrice * quantity;
    const deliveryCharge =
      orderValue >= threshold || hasFreeDeliveryProduct ? 0 : baseCharge;

    return {
      selectedZone,
      baseCharge,
      threshold,
      deliveryCharge,
      hasFreeDeliveryProduct,
      orderValue,
    };
  }, [deliverySettings, quickOrderZoneId, product, quantity]);

  const {
    selectedZone: quickOrderSelectedZone,
    baseCharge: quickOrderBaseCharge,
    threshold: quickOrderFreeThreshold,
    deliveryCharge: quickOrderDeliveryCharge,
    hasFreeDeliveryProduct: quickOrderHasFreeDeliveryProduct,
  } = quickOrderPricing;

  const getZoneLabel = (zone?: { id?: string; name?: { en?: string; bn?: string } }) => {
    if (!zone) return '';
    if (language === 'bn') {
      return zone.name?.bn || zone.name?.en || zone.id || '';
    }
    return zone.name?.en || zone.name?.bn || zone.id || '';
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProduct(id!);
      if (response.data.success) {
        const prod = response.data.product;
        setProduct(prod);
        try {
          const prodId = (prod as any).id || (prod as any)._id || id;
          const price = (prod as any).discountPrice || (prod as any).price || 0;
          if (prodId) {
            trackBrowserAndServer('ViewContent', {
              customData: {
                content_ids: [prodId],
                content_type: 'product',
                value: price,
                currency: 'BDT',
              },
            });
          }
        } catch {}
        try {
          // Update recently viewed list in localStorage (store only IDs)
          const key = 'recentlyViewedProductIds';
          const existingRaw = localStorage.getItem(key);
          const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];
          const currentId = (prod as any).id || (prod as any)._id;
          
          
          
          // Remove if already exists, then add to front
          const filtered = existing.filter(id => id !== currentId);
          
          // Add current product ID to front and limit to 12
          const updated = [currentId, ...filtered].slice(0, 12);
          localStorage.setItem(key, JSON.stringify(updated));
          
          
        } catch (error) {
          console.error('❌ Error storing recently viewed product:', error);
        }
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (reset = true) => {
    try {
      if (reset) {
        setReviewsLoading(true);
        setCurrentPage(1);
        setHasMoreReviews(true);
      } else {
        setLoadingMore(true);
      }
      
      const page = reset ? 1 : currentPage + 1;
      const response = await reviewsAPI.getProductReviews(id!, { 
        page, 
        limit: 10 
      });
      
      if (response.data.success) {
        if (reset) {
          setReviews(response.data.data);
        } else {
          setReviews(prev => [...prev, ...response.data.data]);
        }
        
        setCurrentPage(page);
        setTotalReviews(response.data.total || 0);
        setHasMoreReviews(response.data.data.length === 10);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!hasMoreReviews || loadingMore) return;
    await fetchReviews(false);
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

  // Simple Variant Helper Functions
  const getCurrentPrice = (): number => {
    let price = product?.discountPrice || product?.price || 0;
    
    // Add weight variant price modifier
    if (selectedWeight && product?.weightVariants) {
      const weightVariant = product.weightVariants.find(w => w.weight === selectedWeight);
      if (weightVariant) {
        price += weightVariant.priceModifier;
      }
    }
    
    return price;
  };

  const getCurrentImages = () => {
    // If color is selected and has image, show color image
    if (selectedColor && product?.colorVariants) {
      const colorVariant = product.colorVariants.find(c => c.color === selectedColor);
      if (colorVariant?.image?.url) {
        // Prepend color image but keep original product images available
        const baseImages = product?.images || [];
        // Avoid duplicate if the color image URL already exists in base images
        const isDuplicate = baseImages.some(img => img.url === colorVariant.image!.url);
        return isDuplicate ? baseImages : [colorVariant.image, ...baseImages];
      }
    }
    
    // Otherwise show product images
    return product?.images || [];
  };

  const canAddToCart = () => {
    // Enable the button as long as the product can be bought; we will validate selections on click
    if (!product) return false;
    return product.isAvailable && product.stock > 0;
  };

  const getVariantData = () => {
    if (!product?.hasVariants) return undefined;
    
    return {
      color: selectedColor || undefined,
      size: selectedSize || undefined,
      weight: selectedWeight || undefined,
      priceModifier: selectedWeight && product?.weightVariants 
        ? product.weightVariants.find(w => w.weight === selectedWeight)?.priceModifier || 0
        : 0
    };
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      const variantData = getVariantData();
      addToCart(product, quantity, variantData);
      try {
        const productId = (product as any).id || (product as any)._id || id;
        trackBrowserAndServer('AddToCart', {
          customData: {
            content_ids: [productId],
            content_type: 'product',
            value: getCurrentPrice() * quantity,
            currency: 'BDT',
            quantity,
          },
        });
      } catch {}
      
      // Open cart sidebar to show the added item
      openCart();
      
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
              {t('productDetail.invalidProduct')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('productDetail.noProductId')}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              {t('productDetail.browseProducts')}
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
              {t('productDetail.productNotFound')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Product ID: {id}
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              {t('productDetail.productDoesntExist')}
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              {t('productDetail.browseProducts')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const originalPrice = product?.discountPrice || product?.price || 0;
  const hasDiscount = currentPrice < originalPrice;

  // Truncate description to 20 words
  const truncateDescription = (text: string, maxWords: number = 20) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const getDescription = () => {
    const desc = language === 'bn' ? product.description.bn : product.description.en;
    return showFullDescription ? desc : truncateDescription(desc);
  };

  const handleWishlistToggle = async () => {
    if (isWishlistLoading || !product) return;
    
    const productId = product.id || (product as any)._id;
    if (!productId) {
      console.error('Product ID is undefined');
      return;
    }
    
    setIsWishlistLoading(true);
    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId);
        toast.success(t('productDetail.removedFromWishlist'));
      } else {
        await addToWishlist(productId);
        toast.success(t('productDetail.addedToWishlist'));
      }
    } catch (error) {
      toast.error(t('productDetail.somethingWentWrong'));
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    // For authenticated users, add to cart and go to checkout
    if (user) {
      try {
        setIsBuyingNow(true);
        const variantData = getVariantData();
        addToCart(product, quantity, variantData);
        // Don't open cart sidebar for Buy Now - go directly to checkout
        navigate('/checkout');
        toast.success(t('productDetail.addedToCart'));
      } catch (error) {
        toast.error(t('productDetail.somethingWentWrong'));
      } finally {
        setIsBuyingNow(false);
      }
    } else {
      // For guest users, show quick order modal
      setShowQuickOrderModal(true);
    }
  };

  const handleQuickOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!quickOrderData.name || !quickOrderData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsBuyingNow(true);
      
      // Create direct order for guest user
      const orderData = new FormData();
      const variantData = getVariantData();
      
      // Add customer info in the format backend expects
      orderData.append('customer[name]', quickOrderData.name);
      orderData.append('customer[phone]', quickOrderData.phone);
      if (quickOrderData.email) {
        orderData.append('customer[email]', quickOrderData.email);
      }
      
      // Resolve dynamic delivery info
      const resolvedDeliveryCharge = quickOrderDeliveryCharge;

      // Parse address - include zone label if selected
      const addressInput = quickOrderData.address?.trim();
      const zoneLabel = getZoneLabel(quickOrderSelectedZone || undefined);
      const addressString = addressInput
        ? zoneLabel ? `${addressInput} (${zoneLabel})` : addressInput
        : zoneLabel || 'Address not provided';

      orderData.append('customer[address][street]', addressString);
      orderData.append('customer[address][area]', 'Not specified');
      orderData.append('customer[address][city]', 'Rangpur');
      orderData.append('customer[address][district]', 'Rangpur');
      
      // Add items in the format backend expects
      const productId = product.id || (product as any)._id;
      orderData.append('items[0][product]', productId);
      orderData.append('items[0][quantity]', quantity.toString());
      if (variantData) {
        if (variantData.color) {
          orderData.append('items[0][variantData][color]', variantData.color);
        }
        if (variantData.size) {
          orderData.append('items[0][variantData][size]', variantData.size);
        }
        if (variantData.weight) {
          orderData.append('items[0][variantData][weight]', variantData.weight);
        }
        if (typeof variantData.priceModifier === 'number') {
          orderData.append('items[0][variantData][priceModifier]', variantData.priceModifier.toString());
        }
      }
      
      // Add payment info
      orderData.append('paymentInfo[method]', 'cash_on_delivery');
      
      // Add delivery info
      orderData.append('deliveryInfo[method]', 'delivery');
      orderData.append('deliveryInfo[address]', addressString);
      orderData.append('deliveryInfo[phone]', quickOrderData.phone);
      orderData.append('deliveryInfo[deliveryCharge]', resolvedDeliveryCharge.toString());
      if (quickOrderSelectedZone) {
        orderData.append('deliveryInfo[zoneId]', quickOrderSelectedZone.id);
        orderData.append('deliveryInfo[zoneName]', getZoneLabel(quickOrderSelectedZone));
        orderData.append('deliveryInfo[zoneCharge]', quickOrderBaseCharge.toString());
      }

      const response = await ordersAPI.createOrder(orderData);
      
      if (response.data.success) {
        try {
          const prodId = product.id || (product as any)._id;
          trackBrowserAndServer('Lead', {
            customData: {
              content_name: 'Quick Order',
              value: (product.discountPrice || product.price) * quantity,
              currency: 'BDT',
              content_ids: prodId ? [prodId] : undefined,
              content_type: 'product',
            },
            userData: {
              ...(quickOrderData.email && { email: quickOrderData.email }),
              phone: quickOrderData.phone,
              firstName: quickOrderData.name.split(' ')?.[0],
              lastName: quickOrderData.name.split(' ')?.slice(1).join(' '),
            },
          });
        } catch {}
        toast.success('Order placed successfully! We will contact you soon.');
        setShowQuickOrderModal(false);
        setQuickOrderData({ name: '', phone: '', email: '', address: '' });
      } else {
        toast.error(response.data.message || 'Failed to place order');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsBuyingNow(false);
    }
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
            {t('productDetail.back')}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image/Video */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="aspect-square">
                  {selectedImage === -1 && product.youtubeVideoUrl && getYouTubeVideoId(product.youtubeVideoUrl) ? (
                    // Show YouTube video
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(product.youtubeVideoUrl)}`}
                      title={`${language === 'bn' ? product.name.bn : product.name.en} Video`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : getCurrentImages().length > 0 ? (
                    // Show selected image
                    <img
                      src={getCurrentImages()[selectedImage]?.url}
                      alt={language === 'bn' ? product.name.bn : product.name.en}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // Show placeholder
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <ShoppingCart className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Images + Video */}
              <div className="flex space-x-2 overflow-x-auto">
                {/* Product Images */}
                {getCurrentImages().map((image, index) => (
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
                
                {/* YouTube Video Thumbnail */}
                {product.youtubeVideoUrl && getYouTubeVideoId(product.youtubeVideoUrl) && (
                  <button
                    onClick={() => setSelectedImage(-1)} // Use -1 to indicate video selection
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === -1
                        ? 'border-orange-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="w-full h-full bg-red-600 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </button>
                )}
              </div>

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

              {/* Simple Variant Selection */}
              {product.hasVariants && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'bn' ? 'বিকল্প নির্বাচন করুন' : 'Select Options'}
                  </h3>
                  
                  {/* Color Variants */}
                  {product.colorVariants && product.colorVariants.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'bn' ? 'রঙ' : 'Color'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.colorVariants.map((variant, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedColor(prev => prev === variant.color ? '' : variant.color)}
                            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${
                              selectedColor === variant.color
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: variant.colorCode }}
                            />
                            <span className="text-sm font-medium">{variant.color}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Variants */}
                  {product.sizeVariants && product.sizeVariants.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'bn' ? 'সাইজ' : 'Size'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.sizeVariants.map((variant, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedSize(prev => prev === variant.size ? '' : variant.size)}
                            className={`px-4 py-2 border rounded-lg transition-all ${
                              selectedSize === variant.size
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            <span className="text-sm font-medium">{variant.size}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weight Variants */}
                  {product.weightVariants && product.weightVariants.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'bn' ? 'ওজন' : 'Weight'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.weightVariants.map((variant, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedWeight(prev => prev === variant.weight ? '' : variant.weight)}
                            className={`px-4 py-2 border rounded-lg transition-all ${
                              selectedWeight === variant.weight
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            <span className="text-sm font-medium">{variant.weight}</span>
                            {variant.priceModifier !== 0 && (
                              <span className="text-xs ml-1">
                                {variant.priceModifier > 0 ? '+' : ''}৳{variant.priceModifier}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Variants Summary */}
                  {(selectedColor || selectedSize || selectedWeight) && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {language === 'bn' ? 'নির্বাচিত বিকল্প' : 'Selected Options'}
                      </h4>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {selectedColor && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded">
                            {language === 'bn' ? 'রঙ' : 'Color'}: {selectedColor}
                          </span>
                        )}
                        {selectedSize && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                            {language === 'bn' ? 'সাইজ' : 'Size'}: {selectedSize}
                          </span>
                        )}
                        {selectedWeight && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">
                            {language === 'bn' ? 'ওজন' : 'Weight'}: {selectedWeight}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('productDetail.description')}
                </h3>
                <div 
                  className="text-gray-700 dark:text-gray-300 rich-text-content max-w-none"
                  style={{ lineHeight: '1.5' }}
                  dangerouslySetInnerHTML={{ __html: getDescription() }}
                />
                {(() => {
                  const desc = language === 'bn' ? product.description.bn : product.description.en;
                  const wordCount = desc.trim().split(/\s+/).length;
                  return wordCount > 20 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
                    >
                      {showFullDescription 
                        ? t('productDetail.showLess')
                        : t('productDetail.readMore')
                      }
                    </button>
                  );
                })()}
              </div>

              {/* Product Details */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('productDetail.category')}</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {language === 'bn' ? product.category.name.bn : product.category.name.en}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('productDetail.stock')}</span>
                  <p className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 
                      ? (typeof product.stock === 'number' && product.stock >= 0 
                          ? `${product.stock} ${t('productDetail.available')}` 
                          : t('productDetail.inStock'))
                      : t('productDetail.outOfStock')
                    }
                  </p>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('productDetail.quantity')}
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
                  {t('productDetail.min')}: {product.minOrderQuantity}, {t('productDetail.max')}: {product.maxOrderQuantity}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!canAddToCart() || isAddingToCart}
                    className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {isAddingToCart ? t('productDetail.adding') : t('productDetail.addToCart')}
                  </button>
                  <button 
                    onClick={handleWishlistToggle}
                    disabled={isWishlistLoading}
                    className={`p-3 border rounded-lg transition-colors ${
                      isInWishlist(product.id || (product as any)._id)
                        ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                        : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                    } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Heart className={`w-5 h-5 ${
                      isInWishlist(product.id || (product as any)._id) ? 'fill-current' : ''
                    }`} />
                  </button>
                </div>
                
                {/* Buy Now Button */}
                <button
                  onClick={handleBuyNow}
                  disabled={!canAddToCart() || isBuyingNow}
                  className="w-full bg-[#ef4444] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  {isBuyingNow ? (language === 'bn' ? 'অর্ডার হচ্ছে...' : 'Processing...') : (language === 'bn' ? 'এখনই কিনুন' : 'Buy Now')}
                </button>
              </div>

              {/* Availability Status */}
              {!product.isAvailable && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    {t('productDetail.unavailable')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Ingredients section removed */}
          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {t('productDetail.relatedProducts')}
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
              {t('productDetail.customerReviews')} ({product.ratings.count})
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
                              {t('productDetail.verified')}
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
                                {t('productDetail.adminResponse')}
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
                
                {/* Load More Button and Review Count */}
                {hasMoreReviews && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreReviews}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        'Load More Reviews'
                      )}
                    </button>
                  </div>
                )}
                
                {/* Review Count */}
                {totalReviews > 0 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {reviews.length} of {totalReviews} reviews
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {t('productDetail.noReviews')}
                </p>
              </div>
            )}
          </div>

          {/* Quick Order Modal for Guest Users */}
          {showQuickOrderModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {language === 'bn' ? 'দ্রুত অর্ডার' : 'Quick Order'}
                    </h3>
                    <button
                      onClick={() => setShowQuickOrderModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Product Summary */}
                  <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0].url}
                        alt={language === 'bn' ? product.name.bn : product.name.en}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {language === 'bn' ? product.name.bn : product.name.en}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Qty: {quantity} × ৳{product.discountPrice || product.price} = ৳{quantity * (product.discountPrice || product.price)}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleQuickOrderSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {language === 'bn' ? 'নাম *' : 'Name *'}
                      </label>
                      <input
                        type="text"
                        value={quickOrderData.name}
                        onChange={(e) => setQuickOrderData({...quickOrderData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {language === 'bn' ? 'ফোন নম্বর *' : 'Phone Number *'}
                      </label>
                      <input
                        type="tel"
                        value={quickOrderData.phone}
                        onChange={(e) => setQuickOrderData({...quickOrderData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {language === 'bn' ? 'ইমেইল' : 'Email'}
                      </label>
                      <input
                        type="email"
                        value={quickOrderData.email}
                        onChange={(e) => setQuickOrderData({...quickOrderData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {language === 'bn' ? 'ঠিকানা' : 'Address'}
                      </label>
                      <textarea
                        value={quickOrderData.address}
                        onChange={(e) => setQuickOrderData({...quickOrderData, address: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder={language === 'bn' ? 'বিস্তারিত ঠিকানা দিন...' : 'Enter detailed address...'}
                      />
                    </div>

                    {deliverySettings?.zones && deliverySettings.zones.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {language === 'bn' ? 'ডেলিভারি এলাকা নির্বাচন করুন' : 'Choose Delivery Area'}
                        </label>
                        <select
                          value={quickOrderZoneId}
                          onChange={(e) => setQuickOrderZoneId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ef4444] focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">
                            {language === 'bn'
                              ? `স্ট্যান্ডার্ড ডেলিভারি (৳${deliverySettings.deliveryCharge ?? 60})`
                              : `Standard delivery (৳${deliverySettings.deliveryCharge ?? 60})`}
                          </option>
                          {deliverySettings.zones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {`${getZoneLabel(zone)} — ৳${zone.price}`}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {language === 'bn'
                            ? `অর্ডার ≥ ৳${quickOrderFreeThreshold} হলে অথবা ফ্রি-ডেলিভারি প্রোডাক্টে ডেলিভারি ফ্রি`
                            : `Orders ≥ ৳${quickOrderFreeThreshold} or products with free delivery pay 0 charge`}
                        </p>
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {language === 'bn' ? 'ডেলিভারি চার্জ' : 'Delivery Charge'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {quickOrderDeliveryCharge === 0
                              ? (quickOrderHasFreeDeliveryProduct
                                  ? language === 'bn'
                                    ? 'এই পণ্যে ফ্রি ডেলিভারি প্রযোজ্য'
                                    : 'This product includes free delivery'
                                  : language === 'bn'
                                    ? `অর্ডার ≥ ৳${quickOrderFreeThreshold} হওয়ায় ফ্রি`
                                    : `Free because order ≥ ৳${quickOrderFreeThreshold}`)
                              : (language === 'bn'
                                  ? `অর্ডার ≥ ৳${quickOrderFreeThreshold} হলে ফ্রি`
                                  : `Free if order ≥ ৳${quickOrderFreeThreshold}`)}
                          </p>
                          {quickOrderSelectedZone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {language === 'bn'
                                ? `নির্বাচিত এলাকা: ${getZoneLabel(quickOrderSelectedZone)} (৳${quickOrderBaseCharge})`
                                : `Selected area: ${getZoneLabel(quickOrderSelectedZone)} (৳${quickOrderBaseCharge})`}
                            </p>
                          )}
                        </div>
                        <div
                          className={`text-lg font-semibold ${
                            quickOrderDeliveryCharge === 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {quickOrderDeliveryCharge === 0
                            ? language === 'bn'
                              ? 'ফ্রি'
                              : 'FREE'
                            : `৳${quickOrderDeliveryCharge}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowQuickOrderModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {language === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isBuyingNow}
                        className="flex-1 px-4 py-2 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isBuyingNow ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {language === 'bn' ? 'অর্ডার হচ্ছে...' : 'Placing Order...'}
                          </>
                        ) : (
                          language === 'bn' ? 'অর্ডার করুন' : 'Place Order'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetailPage; 