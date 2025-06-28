import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, FileText, Scale, Users, XCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsOfServicePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
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
              className="w-20 h-20 bg-gradient-to-br from-slate-600 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Scale className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              {t('terms.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('terms.subtitle')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {t('terms.lastUpdated')}: January 1, 2024
            </p>
          </div>

          {/* Agreement Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="flex items-center mb-6">
              <FileText className="w-8 h-8 text-slate-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('terms.agreement.title')}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('terms.agreement.description')}
            </p>
          </motion.div>

          {/* Service Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('terms.service.title')}
            </h2>
            <div className="space-y-4">
              {[
                t('terms.service.description1'),
                t('terms.service.description2'),
                t('terms.service.description3')
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-600 dark:text-gray-300">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* User Responsibilities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="flex items-center mb-6">
              <Users className="w-8 h-8 text-blue-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('terms.responsibilities.title')}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-green-600">
                  {t('terms.responsibilities.allowed.title')}
                </h3>
                <div className="space-y-2">
                  {[
                    t('terms.responsibilities.allowed.orders'),
                    t('terms.responsibilities.allowed.account'),
                    t('terms.responsibilities.allowed.feedback')
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-red-600">
                  {t('terms.responsibilities.prohibited.title')}
                </h3>
                <div className="space-y-2">
                  {[
                    t('terms.responsibilities.prohibited.fraud'),
                    t('terms.responsibilities.prohibited.abuse'),
                    t('terms.responsibilities.prohibited.interference')
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <XCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Payment Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('terms.payment.title')}
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {t('terms.payment.methods.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('terms.payment.methods.description')}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {t('terms.payment.processing.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('terms.payment.processing.description')}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {t('terms.payment.refunds.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('terms.payment.refunds.description')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Limitation of Liability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <div className="flex items-center mb-6">
              <AlertCircle className="w-8 h-8 text-amber-600 mr-4" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {t('terms.liability.title')}
              </h2>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {t('terms.liability.description')}
              </p>
            </div>
          </motion.div>

          {/* Modifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('terms.modifications.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('terms.modifications.description')}
            </p>
          </motion.div>

          {/* Governing Law */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('terms.law.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('terms.law.description')}
            </p>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="bg-gradient-to-r from-slate-600 to-gray-600 rounded-2xl shadow-xl p-8 text-white text-center"
          >
            <Scale className="w-12 h-12 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-bold mb-4">{t('terms.contact.title')}</h2>
            <p className="text-slate-100 mb-6">{t('terms.contact.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:legal@chickensamosa.com"
                className="bg-white text-slate-600 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                {t('terms.contact.email')}
              </a>
              <a
                href="/contact"
                className="bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors border border-slate-500"
              >
                {t('terms.contact.form')}
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfServicePage; 