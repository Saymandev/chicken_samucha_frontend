import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { categoriesAPI, productsAPI } from '../../utils/api';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoriesWithProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching categories...');
      
      // First try with productCount
      const response = await categoriesAPI.getAllCategories({ withProductCount: 'true', limit: 50 });
      console.log('Categories API response:', response.data);
      
      if (response.data.success && response.data.data) {
        // Filter categories that have products
        let categoriesWithProducts = response.data.data.filter(
          (category: Category) => category.productCount && category.productCount > 0
        );
        
        console.log('Categories with productCount > 0:', categoriesWithProducts.length);
        
        // If no categories with productCount, try without productCount and check manually
        if (categoriesWithProducts.length === 0) {
          console.log('No categories with productCount, trying all categories...');
          const allCategoriesResponse = await categoriesAPI.getAllCategories({ limit: 50 });
          
          if (allCategoriesResponse.data.success && allCategoriesResponse.data.data) {
            const allCategories = allCategoriesResponse.data.data;
            console.log('All categories found:', allCategories.length);
            
            // Check first few categories for products
            const checkCategories = allCategories.slice(0, 10); // Check first 10 categories
            const categoriesWithProductsPromises = checkCategories.map(async (category: Category) => {
              try {
                const productsResponse = await productsAPI.getProducts({ category: category.slug, limit: 1 });
                const hasProducts = productsResponse.data.success && 
                  (productsResponse.data.products?.length > 0 || productsResponse.data.data?.length > 0);
                console.log(`Category ${category.slug} has products:`, hasProducts);
                return hasProducts ? { ...category, productCount: 1 } : null;
              } catch (error) {
                console.error(`Error checking products for category ${category.slug}:`, error);
                return null;
              }
            });
            
            const results = await Promise.all(categoriesWithProductsPromises);
            categoriesWithProducts = results.filter(Boolean);
            console.log('Categories with products found:', categoriesWithProducts.length);
          }
        }
        
        // Sort by product count (most products first) and limit
        const sortedCategories = categoriesWithProducts
          .sort((a: Category, b: Category) => (b.productCount || 0) - (a.productCount || 0))
          .slice(0, maxCategories);
        
        console.log('Final sorted categories to display:', sortedCategories.length);
        setCategories(sortedCategories);
      } else {
        console.log('No categories found in response');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback: try to get categories without product count
      try {
        const fallbackResponse = await categoriesAPI.getAllCategories({ limit: maxCategories });
        if (fallbackResponse.data.success && fallbackResponse.data.data) {
          console.log('Using fallback categories:', fallbackResponse.data.data.length);
          setCategories(fallbackResponse.data.data);
        } else {
          setCategories([]);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setCategories([]);
      }
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
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
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
