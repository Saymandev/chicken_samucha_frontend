import { motion } from 'framer-motion';
import { CheckCircle, Clock, Mail, Phone, RotateCcw, Shield } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const ReturnPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeInUp}>
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <RotateCcw className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              {t('returnPolicy.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('returnPolicy.subtitle')}
            </p>
          </div>

          {/* Policy Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  {t('returnPolicy.overview.timeLimit')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('returnPolicy.overview.timeLimitDesc')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  {t('returnPolicy.overview.guarantee')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('returnPolicy.overview.guaranteeDesc')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  {t('returnPolicy.overview.process')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('returnPolicy.overview.processDesc')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Detailed Policy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('returnPolicy.detailed.title')}
            </h2>

            {/* Return Conditions */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {t('returnPolicy.conditions.title')}
              </h3>
              <div className="space-y-3">
                {[
                  'returnPolicy.conditions.fresh',
                  'returnPolicy.conditions.time',
                  'returnPolicy.conditions.packaging',
                  'returnPolicy.conditions.receipt'
                ].map((key, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                    className="flex items-start"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 dark:text-gray-300">{t(key)}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Return Process */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {t('returnPolicy.process.title')}
              </h3>
              <div className="space-y-4">
                {[
                  { step: 1, key: 'returnPolicy.process.step1' },
                  { step: 2, key: 'returnPolicy.process.step2' },
                  { step: 3, key: 'returnPolicy.process.step3' },
                  { step: 4, key: 'returnPolicy.process.step4' }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                    className="flex items-start"
                  >
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">
                      {item.step}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 pt-1">{t(item.key)}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Non-Returnable Items */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {t('returnPolicy.nonReturnable.title')}
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {t('returnPolicy.nonReturnable.description')}
                </p>
                <ul className="space-y-2">
                  {[
                    'returnPolicy.nonReturnable.consumed',
                    'returnPolicy.nonReturnable.damaged',
                    'returnPolicy.nonReturnable.special'
                  ].map((key, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      <span className="text-gray-600 dark:text-gray-300">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Refund Policy */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {t('returnPolicy.refund.title')}
              </h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {t('returnPolicy.refund.description')}
                </p>
                <ul className="space-y-2">
                  {[
                    'returnPolicy.refund.mobile',
                    'returnPolicy.refund.bank',
                    'returnPolicy.refund.timeline'
                  ].map((key, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              {t('returnPolicy.contact.title')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {t('returnPolicy.contact.phone')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">+880 123 456 7890</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('returnPolicy.contact.phoneHours')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {t('returnPolicy.contact.email')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">returns@chickensamosa.com</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('returnPolicy.contact.emailResponse')}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReturnPolicyPage; 