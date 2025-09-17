import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, Grid, List, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  GridSkeleton,
  ListSkeleton,
  ProductCardSkeleton
} from '../components/common/Skeleton';
import ProductCard from '../components/product/ProductCard';
import { Product, useStore } from '../store/useStore';
import { productsAPI } from '../utils/api';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Categories for filtering
  const categories = [
    { id: '', name: { en: 'All Categories', bn: 'সব ক্যাটাগরি' } },
    { id: 'chicken', name: { en: 'Chicken Samosa', bn: 'চিকেন সমুচা' } },
    { id: 'vegetable', name: { en: 'Vegetable Samosa', bn: 'সবজি সমুচা' } },
    { id: 'beef', name: { en: 'Beef Samosa', bn: 'গরুর মাংসের সমুচা' } },
    { id: 'combo', name: { en: 'Combo Packs', bn: 'কম্বো প্যাক' } }
  ];

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
  }, [searchTerm, selectedCategory, priceRange, sortBy]);

  // Load recently viewed on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentlyViewedProducts');
      const list = raw ? JSON.parse(raw) : [];
      setRecentlyViewed(Array.isArray(list) ? list.slice(0, 12) : []);
    } catch {
      setRecentlyViewed([]);
    }
  }, []);

  const fetchProducts = async (page = 1, isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const params = {
        search: searchTerm,
        category: selectedCategory,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
        sortBy,
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
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPriceRange({ min: 0, max: 10000 });
    setSortBy('featured');
    setSearchParams(new URLSearchParams());
  };

  // Recently Viewed slider functions
  const itemsPerSlide = 4; // Show 4 items per slide
  const totalSlides = Math.ceil(recentlyViewed.length / itemsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
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
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
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
                ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6'
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

        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {language === 'bn' ? 'সম্প্রতি দেখা পণ্য' : 'Recently Viewed Products'}
            </h2>
            <div className="relative bg-white dark:bg-gray-800 card p-6">
              {/* Navigation Arrows */}
              {totalSlides > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-600"
                    disabled={currentSlide === 0}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  
                  <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-600"
                    disabled={currentSlide === totalSlides - 1}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </>
              )}

              {/* Slider Container */}
              <div className="overflow-hidden">
                <motion.div
                  className="flex gap-4 transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${currentSlide * 100}%)`,
                    width: `${totalSlides * 100}%`
                  }}
                >
                  {Array.from({ length: totalSlides }, (_, slideIndex) => (
                    <div
                      key={slideIndex}
                      className="flex gap-4"
                      style={{ width: `${100 / totalSlides}%` }}
                    >
                      {recentlyViewed
                        .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                        .map((rv: any, idx: number) => (
                          <div
                            key={rv.id || idx}
                            className="flex-shrink-0 w-1/4"
                          >
                            <ProductCard product={rv} showQuickActions={false} compact={true} />
                          </div>
                        ))}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Dots Indicator */}
              {totalSlides > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentSlide
                          ? 'bg-primary-500 w-6'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage; 