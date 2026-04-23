import { motion } from 'framer-motion';
import { ArrowRight, CreditCard, Home, RefreshCw, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';

const PaymentFailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { language } = useStore();
  
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const order = searchParams.get('order');
    const reasonParam = searchParams.get('reason');
    
    if (order) {
      setOrderNumber(order);
      // Cleanup any stored checkout payload for this provisional order
      try { localStorage.removeItem(`checkout:${order}`); } catch {}
    }
    if (reasonParam) {
      setReason(decodeURIComponent(reasonParam));
    }
    
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Processing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          {/* Fail Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('payment.failed')}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              {t('payment.failedMessage')}
            </p>
            
            {orderNumber && (
              <p className="text-lg font-medium text-orange-600 dark:text-orange-400">
                {t('payment.orderNumber')} {orderNumber}
              </p>
            )}
            
            {reason && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {t('payment.reason')} {reason}
              </p>
            )}
          </div>

          {/* Failure Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
              {t('payment.troubleshooting.title')}
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <RefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'bn' 
                      ? 'আপনি আবার পেমেন্ট করার চেষ্টা করতে পারেন। চেকআউট পেজে ফিরে যান।'
                      : 'You can try making the payment again. Go back to the checkout page.'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {language === 'bn' ? 'অন্য পেমেন্ট মেথড' : 'Different Payment Method'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'bn' 
                      ? 'bKash, Nagad, Rocket বা ক্যাশ অন ডেলিভারি ব্যবহার করে চেষ্টা করুন।'
                      : 'Try using bKash, Nagad, Rocket, or Cash on Delivery.'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">📞</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {language === 'bn' ? 'সাপোর্টে যোগাযোগ' : 'Contact Support'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'bn' 
                      ? 'আপনার পেমেন্ট নিয়ে কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন।'
                      : 'If you have any issues with your payment, contact our support team.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/checkout')}
              className="flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold"
            >
              <Home className="w-5 h-5" />
              {language === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {language === 'bn' 
                ? 'সহায়তা প্রয়োজন? আমাদের সাথে যোগাযোগ করুন'
                : 'Need help? Contact us'
              }
            </p>
            <p className="text-orange-600 dark:text-orange-400 font-semibold">
              📞 +880 1629428590
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {language === 'bn' 
                ? 'আমরা ২৪/৭ আপনার সেবায় আছি'
                : 'We are here to help you 24/7'
              }
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentFailPage;
