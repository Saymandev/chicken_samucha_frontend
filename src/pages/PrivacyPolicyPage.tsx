import { motion } from 'framer-motion';
import { AlertTriangle, Database, Eye, Lock, Shield, UserCheck } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'information-collection',
      icon: Database,
      title: t('privacy.sections.collection.title'),
      content: [
        t('privacy.sections.collection.personal'),
        t('privacy.sections.collection.usage'),
        t('privacy.sections.collection.technical'),
        t('privacy.sections.collection.payment')
      ]
    },
    {
      id: 'information-use',
      icon: Eye,
      title: t('privacy.sections.use.title'),
      content: [
        t('privacy.sections.use.orders'),
        t('privacy.sections.use.communication'),
        t('privacy.sections.use.improvement'),
        t('privacy.sections.use.legal')
      ]
    },
    {
      id: 'data-protection',
      icon: Lock,
      title: t('privacy.sections.protection.title'),
      content: [
        t('privacy.sections.protection.encryption'),
        t('privacy.sections.protection.access'),
        t('privacy.sections.protection.storage'),
        t('privacy.sections.protection.monitoring')
      ]
    },
    {
      id: 'user-rights',
      icon: UserCheck,
      title: t('privacy.sections.rights.title'),
      content: [
        t('privacy.sections.rights.access'),
        t('privacy.sections.rights.correction'),
        t('privacy.sections.rights.deletion'),
        t('privacy.sections.rights.portability')
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
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
              className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              {t('privacy.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('privacy.subtitle')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {t('privacy.lastUpdated')}: January 1, 2024
            </p>
          </div>

          {/* Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {t('privacy.overview.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('privacy.overview.description')}
            </p>
          </motion.div>

          {/* Main Sections */}
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mr-4">
                  <section.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-4">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-4 mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Cookies Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('privacy.cookies.title')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  {t('privacy.cookies.essential.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('privacy.cookies.essential.description')}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  {t('privacy.cookies.analytics.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('privacy.cookies.analytics.description')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Third Party Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('privacy.thirdParty.title')}
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {t('privacy.thirdParty.payment.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('privacy.thirdParty.payment.description')}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  {t('privacy.thirdParty.analytics.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('privacy.thirdParty.analytics.description')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-xl p-8 text-white text-center"
          >
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-bold mb-4">{t('privacy.contact.title')}</h2>
            <p className="text-indigo-100 mb-6">{t('privacy.contact.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:privacy@chickensamosa.com"
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                {t('privacy.contact.email')}
              </a>
              <a
                href="/contact"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors border border-indigo-400"
              >
                {t('privacy.contact.form')}
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 