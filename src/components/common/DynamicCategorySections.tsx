import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { categoriesAPI } from '../../utils/api';
import CategoryProductsSection from './CategoryProductsSection';

interface Category {
  _id: string;
  name: {
    en: string;
    bn: string;
  };
  slug: string;
  image?: {
    url: string;
    public_id: string;
  };
  icon: string;
  color: string;
  productCount: number;
}

interface DynamicCategorySectionsProps {
  limit?: number;
  maxCategories?: number;
}

const DynamicCategorySections: React.FC<DynamicCategorySectionsProps> = ({
  limit = 8,
  maxCategories = 6
}) => {
  const { language } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoriesWithProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAllCategories();
      if (response.data.success) {
        // Filter categories that have products
        const categoriesWithProducts = response.data.data.filter(
          (category: Category) => category.productCount > 0
        );
        // Sort by product count (most products first) and limit
        const sortedCategories = categoriesWithProducts
          .sort((a: Category, b: Category) => b.productCount - a.productCount)
          .slice(0, maxCategories);
        
        setCategories(sortedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [maxCategories]);

  useEffect(() => {
    fetchCategoriesWithProducts();
  }, [fetchCategoriesWithProducts]);

  if (loading) {
    return (
      <div className="space-y-12">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="py-12 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-8">
                {[...Array(limit)].map((_, i) => (
                  <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-12">
      {categories.map((category, index) => (
        <motion.div
          key={category._id}
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
        >
          <CategoryProductsSection
            categorySlug={category.slug}
            headingEn={category.name.en}
            headingBn={category.name.bn}
            limit={limit}
            showMoreTextEn="Show More"
            showMoreTextBn="আরও দেখুন"
          />
        </motion.div>
      ))}
    </div>
  );
};

export default DynamicCategorySections;
