import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { productsAPI } from '../../utils/api';
import ProductCard from '../product/ProductCard';
import { GridSkeleton, ProductCardSkeleton } from './Skeleton';

interface CategoryProductsSectionProps {
  categorySlug: string;
  headingEn?: string;
  headingBn?: string;
  limit?: number;
  showMoreTextEn?: string;
  showMoreTextBn?: string;
}

const CategoryProductsSection: React.FC<CategoryProductsSectionProps> = ({
  categorySlug,
  headingEn,
  headingBn,
  limit = 8,
  showMoreTextEn = "Show More",
  showMoreTextBn = "আরও দেখুন"
}) => {
  const { language } = useStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        
        const res = await productsAPI.getProducts({ category: categorySlug, limit });
        
        const items = res.data?.products || res.data?.data || [];
        
        if (mounted) setProducts(items);
      } catch (e) {
        console.error(`Error fetching products for ${categorySlug}:`, e);
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [categorySlug, limit]);

  const heading = language === 'bn' ? headingBn || headingEn || '' : headingEn || headingBn || '';
  const showMoreText = language === 'bn' ? showMoreTextBn : showMoreTextEn;

  // Don't render if no products
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          {heading && (
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white ${language === 'bn' ? 'font-bengali' : ''}`}
            >
              {heading}
            </motion.h2>
          )}
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="ml-auto"
          >
            <Link
              to={`/products?category=${categorySlug}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors duration-200"
            >
              {showMoreText}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <GridSkeleton items={limit} ItemComponent={ProductCardSkeleton} columns="grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" />
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2"
          >
            {products.map((p, i) => (
              <motion.div key={(p as any).id || i} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CategoryProductsSection;


