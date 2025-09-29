import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronRight, CreditCard, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
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
  subMethods?: {
    [key: string]: {
      enabled: boolean;
      name: string;
      accountNumber: string;
      instructions: string;
    };
  };
}

const PaymentSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [originalPaymentMethods, setOriginalPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
            id: 'manual_payment',
            name: 'Manual Payment',
            enabled: response.data.data.manual_payment?.enabled || false,
            logo: '📱',
            color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
            instructions: [
              'Choose your preferred mobile banking method',
              'Send money to the provided account number',
              'Include your order number in the transaction',
              'Provide transaction ID for verification'
            ],
            subMethods: response.data.data.manual_payment?.subMethods || {}
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
        setOriginalPaymentMethods(JSON.parse(JSON.stringify(methods))); // Deep copy for comparison
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = (methodId: string) => {
    const updatedMethods = paymentMethods.map(method => 
      method.id === methodId 
        ? { ...method, enabled: !method.enabled }
        : method
    );
    setPaymentMethods(updatedMethods);
  };

  const toggleSubMethod = (parentId: string, subMethodId: string) => {
    const updatedMethods = paymentMethods.map(method => {
      if (method.id === parentId && method.subMethods) {
        const updatedSubMethods = {
          ...method.subMethods,
          [subMethodId]: {
            ...method.subMethods[subMethodId],
            enabled: !method.subMethods[subMethodId].enabled
          }
        };
        return { ...method, subMethods: updatedSubMethods };
      }
      return method;
    });
    
    setPaymentMethods(updatedMethods);
  };

  const updateSubMethod = (parentId: string, subMethodId: string, field: string, value: string) => {
    const updatedMethods = paymentMethods.map(method => {
      if (method.id === parentId && method.subMethods) {
        const updatedSubMethods = {
          ...method.subMethods,
          [subMethodId]: {
            ...method.subMethods[subMethodId],
            [field]: value
          }
        };
        return { ...method, subMethods: updatedSubMethods };
      }
      return method;
    });
    
    setPaymentMethods(updatedMethods);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const hasUnsavedChanges = () => {
    return JSON.stringify(paymentMethods) !== JSON.stringify(originalPaymentMethods);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare update data
      const updateData: any = {};
      
      // Update main payment methods
      paymentMethods.forEach(method => {
        if (method.id === 'sslcommerz') {
          updateData.sslcommerz = { enabled: method.enabled };
        } else if (method.id === 'manual_payment') {
          updateData.manual_payment = { 
            enabled: method.enabled,
            subMethods: method.subMethods || {}
          };
        } else if (method.id === 'cash_on_delivery') {
          updateData.cash_on_delivery = { enabled: method.enabled };
        }
      });
      
      await adminAPI.updatePaymentSettings(updateData);
      setOriginalPaymentMethods(JSON.parse(JSON.stringify(paymentMethods))); // Update original state
      toast.success('Payment settings saved successfully!');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
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
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                hasUnsavedChanges() 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  {hasUnsavedChanges() ? 'Save Changes' : 'No Changes'}
                </>
              )}
            </button>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Available Payment Methods
            </h3>
            
            <div className="space-y-4">
              {paymentMethods.map((method) => {
                const isExpanded = expandedItems.has(method.id);
                const hasSubMethods = method.subMethods && Object.keys(method.subMethods).length > 0;
                
                return (
                  <div key={method.id} className="space-y-2">
                    {/* Main Payment Method */}
                    <div
                      className={`p-4 border-2 rounded-lg transition-all ${
                        method.enabled
                          ? `${method.color} border-current`
                          : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {hasSubMethods && (
                            <button
                              onClick={() => toggleExpanded(method.id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
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
                          className="flex items-center gap-2"
                        >
                          {method.enabled ? (
                            <ToggleRight className="w-6 h-6 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      {method.enabled && !hasSubMethods && (
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

                    {/* Sub Methods */}
                    {hasSubMethods && isExpanded && method.subMethods && (
                      <div className="ml-8 space-y-2">
                        {Object.entries(method.subMethods).map(([subMethodId, subMethod]) => (
                          <div
                            key={subMethodId}
                            className={`p-3 border rounded-lg transition-all ${
                              subMethod.enabled
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">
                                  {subMethodId === 'bkash' && '📱'}
                                  {subMethodId === 'nagad' && '📱'}
                                  {subMethodId === 'rocket' && '🚀'}
                                  {subMethodId === 'upay' && '📱'}
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900 dark:text-white">
                                    {subMethod.name}
                                  </h5>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {subMethod.enabled ? 'Enabled' : 'Disabled'}
                                  </p>
                                </div>
                              </div>
                              
                      <button
                        onClick={() => toggleSubMethod(method.id, subMethodId)}
                        className="flex items-center gap-2"
                      >
                                {subMethod.enabled ? (
                                  <ToggleRight className="w-5 h-5 text-green-500" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </div>

                            {subMethod.enabled && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Account Number
                                  </label>
                                  <input
                                    type="text"
                                    value={subMethod.accountNumber}
                                    onChange={(e) => updateSubMethod(method.id, subMethodId, 'accountNumber', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter account number"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Instructions
                                  </label>
                                  <textarea
                                    value={subMethod.instructions}
                                    onChange={(e) => updateSubMethod(method.id, subMethodId, 'instructions', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter payment instructions"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
