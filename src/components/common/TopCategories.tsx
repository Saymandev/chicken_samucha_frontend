import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { categoriesAPI } from '../../utils/api';

interface TopCategory {
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
  totalSales: number;
  totalRevenue: number;
}

interface TopCategoriesProps {
  limit?: number;
}

const TopCategories: React.FC<TopCategoriesProps> = ({ limit = 4 }) => {
  const { language } = useStore();
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getTopCategories({ limit });
      if (response.data.success) {
        setTopCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching top categories:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTopCategories();
  }, [fetchTopCategories]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 animate-pulse">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  if (topCategories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {topCategories.map((category, index) => (
        <motion.div
          key={category._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            to={`/products?category=${category.slug}`}
            className="block group"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              {/* Category Image/Icon */}
              <div className="relative mb-3">
                {category.image?.url ? (
                  <div className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                    <img
                      src={category.image.url}
                      alt={category.name[language]}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full flex items-center justify-center text-3xl ring-1 ring-gray-200 dark:ring-gray-700"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>
                )}
              </div>

              {/* Category Name */}
              <h3 className={`font-semibold text-gray-900 dark:text-white mb-1 ${
                language === 'bn' ? 'font-bengali' : ''
              }`}>
                {category.name[language]}
              </h3>

              {/* No product count as requested */}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default TopCategories;
