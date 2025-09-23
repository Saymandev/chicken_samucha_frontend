import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { productsAPI } from '../../utils/api';
import ProductCard from '../product/ProductCard';
import { GridSkeleton, ProductCardSkeleton } from './Skeleton';

interface CategoryProductsSectionProps {
  categorySlug: string;
  headingEn?: string;
  headingBn?: string;
  limit?: number;
}

const CategoryProductsSection: React.FC<CategoryProductsSectionProps> = ({
  categorySlug,
  headingEn,
  headingBn,
  limit = 8
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
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [categorySlug, limit]);

  const heading = language === 'bn' ? headingBn || headingEn || '' : headingEn || headingBn || '';

  return (
    <section className="py-12 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        {heading && (
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className={`text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 ${language === 'bn' ? 'font-bengali' : ''}`}
          >
            {heading}
          </motion.h2>
        )}

        {loading ? (
          <GridSkeleton items={limit} ItemComponent={ProductCardSkeleton} columns="grid-cols-2 md:grid-cols-3 xl:grid-cols-5" />
        ) : products.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-400">No products found.</div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-8"
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


