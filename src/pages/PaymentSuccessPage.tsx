import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Home, Package } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ordersAPI } from '../utils/api';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, removeFromCart } = useStore();
  
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const order = searchParams.get('order');
    const status = searchParams.get('status');
    
    if (order) {
      setOrderNumber(order);
    }
    
    if (status === 'success') {
      // remove only purchased items from cart based on order contents
      (async () => {
        try {
          if (order) {
            const res = await ordersAPI.trackOrder(order);
            if (res.data?.success && res.data?.order?.items) {
              const items: any[] = res.data.order.items;
              items.forEach((it: any) => {
                const pid = (it.product && (it.product._id || it.product.id)) || it.product;
                if (pid) removeFromCart(pid);
              });
            }
          }
        } catch (e) {
          // silently ignore; user can clear cart manually
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      // If not success, redirect to fail page
      navigate(`/payment/fail?order=${order}&status=${status}`);
    }
  }, [searchParams, navigate, removeFromCart]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Processing payment...</p>
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
          {/* Success Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {language === 'bn' ? 'পেমেন্ট সফল!' : 'Payment Successful!'}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
              {language === 'bn' 
                ? 'আপনার অর্ডার সফলভাবে প্লেস হয়েছে' 
                : 'Your order has been placed successfully'
              }
            </p>
            
            {orderNumber && (
              <p className="text-lg font-medium text-orange-600 dark:text-orange-400">
                {language === 'bn' ? 'অর্ডার নম্বর:' : 'Order Number:'} {orderNumber}
              </p>
            )}
          </div>

          {/* Success Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
              {language === 'bn' ? 'কী হবে পরবর্তীতে?' : 'What happens next?'}
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {language === 'bn' ? 'অর্ডার কনফার্মেশন' : 'Order Confirmation'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'bn' 
                      ? 'আমরা আপনার অর্ডার পেয়েছি এবং এটি প্রসেস করছি। আপনি একটি কনফার্মেশন ইমেইল পাবেন।'
                      : 'We have received your order and are processing it. You will receive a confirmation email.'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {language === 'bn' ? 'প্রস্তুতি' : 'Preparation'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'bn' 
                      ? 'আমাদের শেফরা আপনার অর্ডার প্রস্তুত করবেন। প্রস্তুতির সময় ১৫-৩০ মিনিট।'
                      : 'Our chefs will prepare your order. Preparation time is 15-30 minutes.'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {language === 'bn' ? 'ডেলিভারি' : 'Delivery'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {language === 'bn' 
                      ? 'আমাদের ডেলিভারি পার্সন আপনার অর্ডার আপনার ঠিকানায় পৌঁছে দেবেন।'
                      : 'Our delivery person will bring your order to your address.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(`/track-order?orderNumber=${orderNumber}`)}
              className="flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              <Package className="w-5 h-5" />
              {language === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}
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
                ? 'কোনো প্রশ্ন আছে? আমাদের সাথে যোগাযোগ করুন'
                : 'Have any questions? Contact us'
              }
            </p>
            <p className="text-orange-600 dark:text-orange-400 font-semibold">
              📞 01537134852
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
