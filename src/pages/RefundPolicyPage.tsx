import { motion } from 'framer-motion';
import { CheckCircle, Clock, DollarSign, RefreshCw, XCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const RefundPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
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
              className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <RefreshCw className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              {t('refund.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('refund.subtitle')}
            </p>
          </div>

          {/* Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  7 Day Policy
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Request refunds within 7 days of delivery
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Full Refund
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  100% money back for eligible orders
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  Quick Process
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Fast refund processing within 5-7 business days
                </p>
              </div>
            </div>
          </motion.div>

          {/* Eligible Reasons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Refund Eligibility
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold dark:text-white mb-4 text-green-600">
                  Valid Reasons
                </h3>
                <div className="space-y-3">
                  {[
                    'Defective or damaged products',
                    'Wrong item delivered',
                    'Missing items from order',
                    'Product not as described',
                    'Quality issues or manufacturing defects'
                  ].map((reason, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-white mb-4 text-red-600">
                  Non-Eligible Reasons
                </h3>
                <div className="space-y-3">
                  {[
                    'Products used or damaged by customer',
                    'Request after 7 days of delivery',
                    'Change of mind without valid reason',
                    'Products with hygiene concerns (underwear, cosmetics)',
                    'Digital products or downloaded content'
                  ].map((reason, index) => (
                    <div key={index} className="flex items-start">
                      <XCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Detailed Refund Process */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Refund Process & Terms
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  1. How to Request a Refund
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>• Contact our customer support within 7 days of delivery</li>
                  <li>• Provide your order number and reason for refund</li>
                  <li>• Submit photos of defective/damaged items if applicable</li>
                  <li>• Keep the original packaging and all accessories</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  2. Refund Processing Time
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>• Refund approval: 1-2 business days after request</li>
                  <li>• Bank transfer: 5-7 business days</li>
                  <li>• Mobile banking: 3-5 business days</li>
                  <li>• Cash refunds: Available at pickup points</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  3. Return Conditions
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>• Items must be in original condition and packaging</li>
                  <li>• All tags and labels must be intact</li>
                  <li>• Products should be unused and undamaged</li>
                  <li>• Return shipping may be customer's responsibility for non-defective items</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  4. Refund Methods
                </h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                  <li>• Original payment method (preferred)</li>
                  <li>• Bank account transfer</li>
                  <li>• Mobile banking (bKash, Nagad, Rocket)</li>
                  <li>• Store credit for future purchases</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-8 text-white text-center"
          >
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-bold mb-4">Need a Refund?</h2>
            <p className="text-emerald-100 mb-6">Contact our support team for quick assistance</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:refunds@pickplace.com.bd"
                className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
              >
                Email Support
              </a>
              <a
                href="tel:+8801537134852"
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors border border-emerald-400"
              >
                Call Us
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicyPage; 