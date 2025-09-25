import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const FAQPage: React.FC = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqs = [
    {
      id: 1,
      category: 'ordering',
      question: t('faq.ordering.q1'),
      answer: t('faq.ordering.a1')
    },
    {
      id: 2,
      category: 'ordering',
      question: t('faq.ordering.q2'),
      answer: t('faq.ordering.a2')
    },
    {
      id: 3,
      category: 'delivery',
      question: t('faq.delivery.q1'),
      answer: t('faq.delivery.a1')
    },
    {
      id: 4,
      category: 'delivery',
      question: t('faq.delivery.q2'),
      answer: t('faq.delivery.a2')
    },
    {
      id: 5,
      category: 'payment',
      question: t('faq.payment.q1'),
      answer: t('faq.payment.a1')
    },
    {
      id: 6,
      category: 'payment',
      question: t('faq.payment.q2'),
      answer: t('faq.payment.a2')
    },
    {
      id: 7,
      category: 'product',
      question: t('faq.product.q1'),
      answer: t('faq.product.a1')
    },
    {
      id: 8,
      category: 'product',
      question: t('faq.product.q2'),
      answer: t('faq.product.a2')
    },
    {
      id: 9,
      category: 'account',
      question: t('faq.account.q1'),
      answer: t('faq.account.a1')
    },
    {
      id: 10,
      category: 'account',
      question: t('faq.account.q2'),
      answer: t('faq.account.a2')
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const categories = [
    { key: 'all', label: t('faq.categories.all') },
    { key: 'ordering', label: t('faq.categories.ordering') },
    { key: 'delivery', label: t('faq.categories.delivery') },
    { key: 'payment', label: t('faq.categories.payment') },
    { key: 'product', label: t('faq.categories.product') },
    { key: 'account', label: t('faq.categories.account') }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryFilteredFaqs = selectedCategory === 'all' 
    ? filteredFaqs 
    : filteredFaqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <HelpCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              {t('faq.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('faq.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8"
          >
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.key
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* FAQ List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-4"
          >
            {categoryFilteredFaqs.length > 0 ? (
              categoryFilteredFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full text-left p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white pr-4">
                        {faq.question}
                      </h3>
                      <div className="flex-shrink-0">
                        {openIndex === index ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-500 dark:text-gray-400">
                  {t('faq.noResults')}
                </p>
                <p className="text-gray-400 dark:text-gray-500 mt-2">
                  {t('faq.tryDifferentSearch')}
                </p>
              </div>
            )}
          </motion.div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl shadow-xl p-8 mt-12 text-center text-white"
          >
            <h2 className="text-2xl font-bold mb-4">{t('faq.stillNeedHelp')}</h2>
            <p className="text-purple-100 mb-6">{t('faq.contactSupport')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:+8801537134852"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
              >
                {t('faq.callUs')}
              </a>
              <a
                href="mailto:support@pickplace.com.bd"
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors border border-purple-400"
              >
                {t('faq.emailUs')}
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage; 