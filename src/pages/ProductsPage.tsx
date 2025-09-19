import { motion } from 'framer-motion';
import { Filter, Grid, List, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  GridSkeleton,
  ListSkeleton,
  ProductCardSkeleton
} from '../components/common/Skeleton';
import ProductCard from '../components/product/ProductCard';
import { Product, useStore } from '../store/useStore';
import { categoriesAPI, productsAPI } from '../utils/api';

const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState({
    min: parseInt(searchParams.get('minPrice') || '0'),
    max: parseInt(searchParams.get('maxPrice') || '10000')
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'featured');
  const [filter, setFilter] = useState(searchParams.get('filter') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);

// Categories fetched from API
const [allCategories, setAllCategories] = useState<Array<{ slug: string; name: { en: string; bn: string } }>>([]);

  const sortOptions = [
    { value: 'featured', label: { en: 'Featured', bn: 'বৈশিষ্ট্য' } },
    { value: 'price_low', label: { en: 'Price: Low to High', bn: 'দাম: কম থেকে বেশি' } },
    { value: 'price_high', label: { en: 'Price: High to Low', bn: 'দাম: বেশি থেকে কম' } },
    { value: 'rating', label: { en: 'Highest Rated', bn: 'সর্বোচ্চ রেটিং' } },
    { value: 'newest', label: { en: 'Newest First', bn: 'নতুন প্রথমে' } }
  ];

  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    fetchProducts(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, priceRange, sortBy, filter]);

  // Sync component state when URL query params change (e.g., via navbar links)
  useEffect(() => {
    const nextSearch = searchParams.get('search') || '';
    const nextCategory = searchParams.get('category') || '';
    const nextMin = parseInt(searchParams.get('minPrice') || '0');
    const nextMax = parseInt(searchParams.get('maxPrice') || '10000');
    const nextSort = searchParams.get('sortBy') || 'featured';
    const nextFilter = searchParams.get('filter') || '';

    setSearchTerm(nextSearch);
    setSelectedCategory(nextCategory);
    setPriceRange({ min: isNaN(nextMin) ? 0 : nextMin, max: isNaN(nextMax) ? 10000 : nextMax });
    setSortBy(nextSort);
    setFilter(nextFilter);
  }, [searchParams]);

  // Fetch recently viewed products by IDs
  const fetchRecentlyViewed = async () => {
    try {
      const raw = localStorage.getItem('recentlyViewedProductIds');
      const productIds = raw ? JSON.parse(raw) : [];
      
      if (productIds.length === 0) {
        setRecentlyViewed([]);
        return;
      }

      // Fetch fresh product data for each ID
      const productPromises = productIds.map(async (id: string) => {
        try {
          const response = await productsAPI.getProduct(id);
          return response.data.success ? response.data.product : null;
        } catch (error) {
          console.error(`Error fetching product ${id}:`, error);
          return null;
        }
      });

      const products = await Promise.all(productPromises);
      const validProducts = products.filter(product => product !== null);
      setRecentlyViewed(validProducts);
    } catch (error) {
      console.error('Error fetching recently viewed products:', error);
      setRecentlyViewed([]);
    }
  };

  // Load recently viewed and best sellers on mount
  useEffect(() => {
    fetchRecentlyViewed();
    fetchBestSellers();
    (async () => {
      try {
        const res = await categoriesAPI.getAllCategories();
        if (res.data.success) {
          const items = (res.data.data || []).map((c: any) => ({ slug: c.slug, name: c.name }));
          setAllCategories(items);
        }
      } catch {}
    })();
  }, []);

  const fetchProducts = async (page = 1, isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Map sort keys to backend fields and order
      let sortByField = 'displayOrder';
      let sortOrder: 'asc' | 'desc' = 'asc';
      switch (sortBy) {
        case 'featured':
          sortByField = 'isFeatured';
          sortOrder = 'desc';
          break;
        case 'price_low':
          sortByField = 'price';
          sortOrder = 'asc';
          break;
        case 'price_high':
          sortByField = 'price';
          sortOrder = 'desc';
          break;
        case 'rating':
          sortByField = 'ratings.average';
          sortOrder = 'desc';
          break;
        case 'newest':
          sortByField = 'createdAt';
          sortOrder = 'desc';
          break;
      }

      const params = {
        search: searchTerm,
        category: selectedCategory,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        sortBy: sortByField,
        sortOrder,
        filter,
        page,
        limit: 12
      };

      const response = await productsAPI.getProducts(params);
      if (response.data.success) {
        const newProducts = response.data.products;
        
        if (isNewSearch) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        
        setCurrentPage(page);
        setHasMore(newProducts.length === 12); // If less than 12, no more pages
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(currentPage + 1, false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURLParams();
  };

  const updateURLParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (priceRange.min > 0) params.set('minPrice', priceRange.min.toString());
    if (priceRange.max < 10000) params.set('maxPrice', priceRange.max.toString());
    if (sortBy !== 'featured') params.set('sortBy', sortBy);
    if (filter) params.set('filter', filter);
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: 0, max: 10000 });
    setSortBy('featured');
    setFilter('');
    setSearchParams(new URLSearchParams());
  };

  // Recently Viewed products - using Swiper slider

  // Fetch best sellers
  const fetchBestSellers = async () => {
    try {
      const res = await productsAPI.getProducts({ 
        filter: 'best-seller', 
        limit: 8 
      });
      if (res.data.success) {
        const items = res.data.products || res.data.data || [];
        setBestSellers(items);
      }
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      toast.error('Failed to load best sellers');
    }
  };

  // Refresh recently viewed products (can be called when needed)
  const refreshRecentlyViewed = () => {
    fetchRecentlyViewed();
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 ${
            language === 'bn' ? 'font-bengali' : ''
          }`}>
            {t('products.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {language === 'bn' 
              ? 'আমাদের সুস্বাদু সমুচার কালেকশন আবিষ্কার করুন'
              : 'Discover our delicious samosa collection'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'bn' ? 'পণ্য খুঁজুন...' : 'Search products...'}
                className="input pl-10 w-full dark:bg-gray-700 dark:text-gray-300"
              />
            </div>
            <button
              type="submit"
              className="btn-primary px-6"
            >
              {t('common.search')}
            </button>
          </form>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {t('products.filters')}
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('products.sortBy')}:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input text-sm dark:bg-gray-700 dark:text-gray-300"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label[language]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('products.category')}
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">{language === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
                    {allCategories.map(category => (
                      <option key={category.slug} value={category.slug}>
                        {category.name[language]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('products.priceRange')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                      placeholder="Min"
                      className="input text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      min="0"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 10000 }))}
                      placeholder="Max"
                      className="input text-sm"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-outline w-full"
                  >
                    {t('products.clearFilters')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Active Filter Display */}
        {filter && (
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {language === 'bn' ? 'সক্রিয় ফিল্টার:' : 'Active Filter:'}
                </span>
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                  {filter === 'best-seller' 
                    ? (language === 'bn' ? 'বেস্ট সেলার' : 'Best Sellers')
                    : filter === 'offers'
                    ? (language === 'bn' ? 'অফার জোন' : 'Offer Zone')
                    : filter
                  }
                </span>
              </div>
              <button
                onClick={() => {
                  setFilter('');
                  updateURLParams();
                }}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 text-sm font-medium"
              >
                {language === 'bn' ? 'সাফ করুন' : 'Clear'}
              </button>
            </div>
          </div>
        )}

        {/* Products Grid/List */}
        {loading ? (
          viewMode === 'grid' ? (
            <GridSkeleton 
              items={12} 
              ItemComponent={ProductCardSkeleton}
              columns="grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            />
          ) : (
            <ListSkeleton 
              items={8}
              ItemComponent={ProductCardSkeleton}
            />
          )
        ) : products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 md:gap-3'
                : 'space-y-6'
            }
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard 
                  product={product} 
                  showQuickActions={true}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('products.noResults')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {language === 'bn' 
                ? 'আপনার অনুসন্ধানের জন্য কোন পণ্য পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।'
                : 'No products found for your search. Try changing the filters.'
              }
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              {t('products.clearFilters')}
            </button>
          </div>
        )}

        {/* Load More */}
        {!loading && products.length > 0 && hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="btn-outline px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore 
                ? (language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...')
                : (language === 'bn' ? 'আরো পণ্য লোড করুন' : 'Load More Products')
              }
            </button>
          </div>
        )}

        {bestSellers.length > 0 && filter !== 'best-seller' && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {language === 'bn' ? 'সেরা বিক্রিত পণ্য' : 'Best Sellers'}
            </h2>
            <div className="bg-white dark:bg-gray-800">
              <Swiper
                modules={[Pagination]}
                spaceBetween={16}
                slidesPerView={2}
                pagination={{
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet',
                  bulletActiveClass: 'swiper-pagination-bullet-active',
                }}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 16,
                  },
                  768: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                  },
                  1024: {
                    slidesPerView: 4,
                    spaceBetween: 24,
                  },
                }}
                className="best-sellers-swiper"
              >
                {bestSellers.map((product: any, index: number) => (
                  <SwiperSlide key={product.id || index}>
                    <ProductCard product={product} showQuickActions={true} compact={true} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}

        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {language === 'bn' ? 'সম্প্রতি দেখা পণ্য' : 'Recently Viewed Products'}
            </h2>
          <div className="bg-white dark:bg-gray-800">
              <Swiper
                modules={[Pagination]}
                spaceBetween={16}
                slidesPerView={2}
                pagination={{
                  clickable: true,
                  bulletClass: 'swiper-pagination-bullet',
                  bulletActiveClass: 'swiper-pagination-bullet-active',
                }}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 16,
                  },
                  768: {
                    slidesPerView: 3,
                    spaceBetween: 20,
                  },
                  1024: {
                    slidesPerView: 4,
                    spaceBetween: 24,
                  },
                }}
                className="recently-viewed-swiper"
              >
                {recentlyViewed.map((product: any, index: number) => (
                  <SwiperSlide key={product.id || index}>
                    <ProductCard product={product} showQuickActions={true} compact={true} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage; 