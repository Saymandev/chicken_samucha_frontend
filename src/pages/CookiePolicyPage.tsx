import { motion } from 'framer-motion';
import { Cookie, Info, Settings, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const CookiePolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    functional: true
  });

  const handlePreferenceChange = (type: string) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type as keyof typeof prev]
    }));
  };

  const saveCookiePreferences = () => {
    // Mock save functionality
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    alert(t('cookies.preferencesSaved'));
  };

  const cookieTypes = [
    {
      type: 'essential',
      icon: Shield,
      title: t('cookies.types.essential.title'),
      description: t('cookies.types.essential.description'),
      examples: [
        t('cookies.types.essential.examples.auth'),
        t('cookies.types.essential.examples.cart'),
        t('cookies.types.essential.examples.security')
      ],
      required: true
    },
    {
      type: 'functional',
      icon: Settings,
      title: t('cookies.types.functional.title'),
      description: t('cookies.types.functional.description'),
      examples: [
        t('cookies.types.functional.examples.language'),
        t('cookies.types.functional.examples.theme'),
        t('cookies.types.functional.examples.preferences')
      ],
      required: false
    },
    {
      type: 'analytics',
      icon: Info,
      title: t('cookies.types.analytics.title'),
      description: t('cookies.types.analytics.description'),
      examples: [
        t('cookies.types.analytics.examples.usage'),
        t('cookies.types.analytics.examples.performance'),
        t('cookies.types.analytics.examples.errors')
      ],
      required: false
    },
    {
      type: 'marketing',
      icon: Cookie,
      title: t('cookies.types.marketing.title'),
      description: t('cookies.types.marketing.description'),
      examples: [
        t('cookies.types.marketing.examples.ads'),
        t('cookies.types.marketing.examples.tracking'),
        t('cookies.types.marketing.examples.social')
      ],
      required: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
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
              className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Cookie className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              {t('cookies.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('cookies.subtitle')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {t('cookies.lastUpdated')}: January 1, 2024
            </p>
          </div>

          {/* What Are Cookies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {t('cookies.what.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {t('cookies.what.description')}
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('cookies.what.note')}
              </p>
            </div>
          </motion.div>

          {/* Cookie Types */}
          {cookieTypes.map((cookieType, index) => (
            <motion.div
              key={cookieType.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mr-4">
                    <cookieType.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {cookieType.title}
                    </h2>
                    {cookieType.required && (
                      <span className="text-sm text-red-600 font-medium">
                        {t('cookies.required')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handlePreferenceChange(cookieType.type)}
                    disabled={cookieType.required}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      cookiePreferences[cookieType.type as keyof typeof cookiePreferences]
                        ? 'bg-amber-500'
                        : 'bg-gray-200 dark:bg-gray-600'
                    } ${cookieType.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        cookiePreferences[cookieType.type as keyof typeof cookiePreferences]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {cookieType.description}
              </p>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  {t('cookies.examples')}:
                </h3>
                <div className="space-y-2">
                  {cookieType.examples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{example}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Cookie Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('cookies.management.title')}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  {t('cookies.management.browser.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {t('cookies.management.browser.description')}
                </p>
                <div className="space-y-2">
                  {[
                    { name: 'Chrome', url: 'chrome://settings/cookies' },
                    { name: 'Firefox', url: 'about:preferences#privacy' },
                    { name: 'Safari', url: 'Safari > Preferences > Privacy' },
                    { name: 'Edge', url: 'edge://settings/content/cookies' }
                  ].map((browser, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-600 dark:text-gray-300">{browser.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  {t('cookies.management.preferences.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {t('cookies.management.preferences.description')}
                </p>
                <motion.button
                  onClick={saveCookiePreferences}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  {t('cookies.savePreferences')}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Third Party Cookies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {t('cookies.thirdParty.title')}
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Google Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {t('cookies.thirdParty.analytics')}
                </p>
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                  {t('cookies.learnMore')}
                </a>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Payment Processors
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('cookies.thirdParty.payment')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-xl p-8 text-white text-center"
          >
            <Cookie className="w-12 h-12 mx-auto mb-4 text-white" />
            <h2 className="text-2xl font-bold mb-4">{t('cookies.contact.title')}</h2>
            <p className="text-amber-100 mb-6">{t('cookies.contact.description')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:privacy@pickplace.com.bd"
                className="bg-white text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
              >
                {t('cookies.contact.email')}
              </a>
              <a
                href="/contact"
                className="bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors border border-amber-400"
              >
                {t('cookies.contact.form')}
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CookiePolicyPage; 