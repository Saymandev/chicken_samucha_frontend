import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { adminAPI, paymentsAPI } from '../../utils/api';

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  logo: string;
  color: string;
  instructions: string[];
}

const PaymentSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getPaymentMethods();
      if (response.data.success) {
        // Convert the response to our format
        const methods: PaymentMethod[] = [
          {
            id: 'sslcommerz',
            name: 'SSLCommerz',
            enabled: response.data.data.sslcommerz?.enabled || false,
            logo: '🏦',
            color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-200 dark:border-indigo-800',
            instructions: [
              'Click "Pay with SSLCommerz" to proceed',
              'You will be redirected to SSLCommerz payment page',
              'Choose your preferred payment method:',
              '• Credit/Debit Card (Visa, Mastercard, Amex)',
              '• Mobile Banking (bKash, Nagad, Rocket)',
              '• Internet Banking',
              'Complete the payment securely',
              'You will be redirected back automatically'
            ]
          },
          {
            id: 'cash_on_delivery',
            name: 'Cash on Delivery',
            enabled: response.data.data.cash_on_delivery?.enabled || false,
            logo: '💵',
            color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
            instructions: [
              'Pay cash when our delivery person arrives',
              'Keep exact amount ready',
              'You can also pay with mobile banking to our delivery person',
              'No additional charges for COD'
            ]
          }
        ];
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = async (methodId: string) => {
    try {
      setSaving(true);
      const updatedMethods = paymentMethods.map(method => 
        method.id === methodId 
          ? { ...method, enabled: !method.enabled }
          : method
      );
      
      setPaymentMethods(updatedMethods);
      
      // Save to backend
      const updateData: any = {};
      if (methodId === 'sslcommerz') {
        updateData.sslcommerz = { enabled: !paymentMethods.find(m => m.id === methodId)?.enabled };
      } else if (methodId === 'cash_on_delivery') {
        updateData.cash_on_delivery = { enabled: !paymentMethods.find(m => m.id === methodId)?.enabled };
      }
      
      await adminAPI.updatePaymentSettings(updateData);
      toast.success('Payment method updated successfully!');
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
      // Revert the change on error
      fetchPaymentMethods();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payment settings...</p>
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
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Payment Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage available payment methods
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Available Payment Methods
            </h3>
            
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    method.enabled
                      ? `${method.color} border-current`
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{method.logo}</div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {method.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {method.enabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => togglePaymentMethod(method.id)}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {method.enabled ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {method.enabled && (
                    <div className="mt-4 pl-16">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instructions:
                      </h5>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {method.instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Information
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Payment methods are automatically configured based on your backend settings. 
              SSLCommerz requires proper API credentials to function correctly.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSettingsPage;
