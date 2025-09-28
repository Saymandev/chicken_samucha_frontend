import { CreditCard, Package, Save, Settings, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

interface PaymentSettings {
  manual: {
    enabled: boolean;
    bkash: {
      enabled: boolean;
      merchantNumber: string;
      instructions: string;
    };
    nagad: {
      enabled: boolean;
      merchantNumber: string;
      instructions: string;
    };
    rocket: {
      enabled: boolean;
      merchantNumber: string;
      instructions: string;
    };
    upay: {
      enabled: boolean;
      merchantNumber: string;
      instructions: string;
    };
  };
  sslcommerz: {
    enabled: boolean;
  };
  cashOnDelivery: {
    enabled: boolean;
  };
}

interface SecuritySettings {
  blockedIPs: string[];
  ipBlockingEnabled: boolean;
  maxOrdersPerIP: number;
  blockDuration: number; // in hours
}


const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    manual: {
      enabled: true,
      bkash: {
        enabled: true,
        merchantNumber: '01700000000',
        instructions: 'Send money to the above number'
      },
      nagad: {
        enabled: true,
        merchantNumber: '01700000000',
        instructions: 'Make payment to the above number'
      },
      rocket: {
        enabled: true,
        merchantNumber: '01700000000',
        instructions: 'Cash out to the above number'
      },
      upay: {
        enabled: false,
        merchantNumber: '01700000000',
        instructions: 'Send money to the above number'
      }
    },
    sslcommerz: {
      enabled: true
    },
    cashOnDelivery: {
      enabled: true
    }
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    blockedIPs: [],
    ipBlockingEnabled: false,
    maxOrdersPerIP: 5,
    blockDuration: 24
  });

  const [newBlockedIP, setNewBlockedIP] = useState('');


  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
       const response = await adminAPI.getSystemSettings();
      if (response.data.success) {
        // Update payment settings if they exist
        if (response.data.settings.payment) {
          setPaymentSettings(response.data.settings.payment);
        }
        // Update security settings if they exist
        if (response.data.settings.security) {
          setSecuritySettings(response.data.settings.security);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const settingsData = {
        payment: paymentSettings,
        security: securitySettings
      };
      
       const response = await adminAPI.updateSystemSettings(settingsData);
      if (response.data.success) {
        toast.success('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method: string, subMethod?: string) => {
    setPaymentSettings(prev => {
      const newSettings = { ...prev };
      
      if (method === 'manual' && subMethod) {
        // Toggle sub-method under manual payment
        (newSettings.manual as any)[subMethod].enabled = !(newSettings.manual as any)[subMethod].enabled;
      } else if (method === 'manual') {
        // Toggle main manual payment
        newSettings.manual.enabled = !newSettings.manual.enabled;
      } else if (method === 'sslcommerz') {
        newSettings.sslcommerz.enabled = !newSettings.sslcommerz.enabled;
      } else if (method === 'cashOnDelivery') {
        newSettings.cashOnDelivery.enabled = !newSettings.cashOnDelivery.enabled;
      }
      
      return newSettings;
    });
  };

  const updateManualPaymentDetails = (method: string, field: string, value: string) => {
    setPaymentSettings(prev => {
      const newSettings = { ...prev };
      const paymentMethod = newSettings.manual[method as keyof typeof newSettings.manual];
      if (paymentMethod) {
        (paymentMethod as any)[field] = value;
      }
      return newSettings;
    });
  };

  const addBlockedIP = () => {
    if (!newBlockedIP.trim()) {
      toast.error('Please enter a valid IP address');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newBlockedIP.trim())) {
      toast.error('Please enter a valid IP address format (e.g., 192.168.1.1)');
      return;
    }

    if (securitySettings.blockedIPs.includes(newBlockedIP.trim())) {
      toast.error('IP address is already blocked');
      return;
    }

    setSecuritySettings(prev => ({
      ...prev,
      blockedIPs: [...prev.blockedIPs, newBlockedIP.trim()]
    }));
    setNewBlockedIP('');
    toast.success('IP address added to block list');
  };

  const removeBlockedIP = (ip: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      blockedIPs: prev.blockedIPs.filter(blockedIP => blockedIP !== ip)
    }));
    toast.success('IP address removed from block list');
  };


  const tabs = [
    { id: 'payments', name: 'Payment Methods', icon: CreditCard },
    { id: 'security', name: 'Security & IP Blocking', icon: Shield },
    { id: 'products', name: 'Product Variants', icon: Package }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              System Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Configure payment methods, security settings, and system preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {/* Payment Methods Tab */}
              {activeTab === 'payments' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Payment Methods
                    </h2>
                    <button
                      onClick={saveSettings}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Manual Payment */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Manual Payment
                        </h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.manual.enabled}
                            onChange={() => togglePaymentMethod('manual')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {paymentSettings.manual.enabled ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      </div>

                      {paymentSettings.manual.enabled && (
                        <div className="pl-6 space-y-4">
                          {/* bKash */}
                          <div className="border-l-4 border-pink-500 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">bKash</h4>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={paymentSettings.manual.bkash.enabled}
                                  onChange={() => togglePaymentMethod('manual', 'bkash')}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                              </label>
                            </div>
                            {paymentSettings.manual.bkash.enabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Account Number
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentSettings.manual.bkash.merchantNumber}
                                    onChange={(e) => updateManualPaymentDetails('bkash', 'merchantNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="01700000000"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Instructions
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentSettings.manual.bkash.instructions}
                                    onChange={(e) => updateManualPaymentDetails('bkash', 'instructions', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Send money to the above number"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Nagad */}
                          <div className="border-l-4 border-red-500 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">Nagad</h4>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={paymentSettings.manual.nagad.enabled}
                                  onChange={() => togglePaymentMethod('manual', 'nagad')}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                              </label>
                            </div>
                            {paymentSettings.manual.nagad.enabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Account Number
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentSettings.manual.nagad.merchantNumber}
                                    onChange={(e) => updateManualPaymentDetails('nagad', 'merchantNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="01700000000"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Instructions
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentSettings.manual.nagad.instructions}
                                    onChange={(e) => updateManualPaymentDetails('nagad', 'instructions', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Make payment to the above number"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Rocket */}
                          <div className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">Rocket</h4>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={paymentSettings.manual.rocket.enabled}
                                  onChange={() => togglePaymentMethod('manual', 'rocket')}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                            {paymentSettings.manual.rocket.enabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Account Number
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentSettings.manual.rocket.merchantNumber}
                                    onChange={(e) => updateManualPaymentDetails('rocket', 'merchantNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="01700000000"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Instructions
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentSettings.manual.rocket.instructions}
                                    onChange={(e) => updateManualPaymentDetails('rocket', 'instructions', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Cash out to the above number"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Upay */}
                          <div className="border-l-4 border-purple-500 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">Upay</h4>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={paymentSettings.manual.upay.enabled}
                                  onChange={() => togglePaymentMethod('manual', 'upay')}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                              </label>
                            </div>
                            {paymentSettings.manual.upay.enabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Account Number
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentSettings.manual.upay.merchantNumber}
                                    onChange={(e) => updateManualPaymentDetails('upay', 'merchantNumber', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="01700000000"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Instructions
                                  </label>
                                  <input
                                    type="text"
                                    value={paymentSettings.manual.upay.instructions}
                                    onChange={(e) => updateManualPaymentDetails('upay', 'instructions', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Send money to the above number"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SSLCommerz */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            SSLCommerz
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Online payment gateway (Cards, Mobile Banking, Internet Banking)
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.sslcommerz.enabled}
                            onChange={() => togglePaymentMethod('sslcommerz')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {paymentSettings.sslcommerz.enabled ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Cash on Delivery */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Cash on Delivery
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Pay cash when the order is delivered
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={paymentSettings.cashOnDelivery.enabled}
                            onChange={() => togglePaymentMethod('cashOnDelivery')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {paymentSettings.cashOnDelivery.enabled ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security & IP Blocking Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Security & IP Blocking
                    </h2>
                    <button
                      onClick={saveSettings}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* IP Blocking Settings */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            IP Blocking System
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Block specific IP addresses from accessing your site
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={securitySettings.ipBlockingEnabled}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, ipBlockingEnabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {securitySettings.ipBlockingEnabled ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      </div>

                      {securitySettings.ipBlockingEnabled && (
                        <div className="space-y-4">
                          {/* Add New IP */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Block New IP Address
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newBlockedIP}
                                onChange={(e) => setNewBlockedIP(e.target.value)}
                                placeholder="192.168.1.1"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              />
                              <button
                                onClick={addBlockedIP}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                Block IP
                              </button>
                            </div>
                          </div>

                          {/* Blocked IPs List */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Currently Blocked IPs ({securitySettings.blockedIPs.length})
                            </label>
                            {securitySettings.blockedIPs.length > 0 ? (
                              <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                                {securitySettings.blockedIPs.map((ip, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                  >
                                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                                      {ip}
                                    </span>
                                    <button
                                      onClick={() => removeBlockedIP(ip)}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                                No IP addresses are currently blocked
                              </p>
                            )}
                          </div>

                          {/* Security Settings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Max Orders per IP (per day)
                              </label>
                              <input
                                type="number"
                                value={securitySettings.maxOrdersPerIP}
                                onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxOrdersPerIP: parseInt(e.target.value) || 5 }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                min="1"
                                max="100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Auto-block Duration (hours)
                              </label>
                              <input
                                type="number"
                                value={securitySettings.blockDuration}
                                onChange={(e) => setSecuritySettings(prev => ({ ...prev, blockDuration: parseInt(e.target.value) || 24 }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                min="1"
                                max="720"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Variants Tab */}
              {activeTab === 'products' && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Product Variants Configuration
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Color Variants */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">🎨</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Color Variants
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Configure color options with pricing differences and stock tracking
                          </p>
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Features Available:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Color name (English & Bengali)</li>
                            <li>Hex color codes</li>
                            <li>Price differences per color</li>
                            <li>Individual stock tracking</li>
                            <li>Color-specific product images</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Size Variants */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">📏</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Size Variants
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Set up different sizes with dimension specifications and pricing
                          </p>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="text-sm text-green-700 dark:text-green-300">
                          <strong>Features Available:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Size names (Small, Medium, Large, etc.)</li>
                            <li>Dimension specifications</li>
                            <li>Size-based pricing differences</li>
                            <li>Individual stock per size</li>
                            <li>Multilingual support</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Weight Variants */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">⚖️</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Weight Variants
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Configure weight-based pricing for products sold by weight
                          </p>
                        </div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="text-sm text-orange-700 dark:text-orange-300">
                          <strong>Features Available:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Weight values with units (g, kg, lb, oz)</li>
                            <li>Price per weight calculation</li>
                            <li>Weight-based stock management</li>
                            <li>Flexible unit conversions</li>
                            <li>Automatic price calculations</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Implementation Status */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <Package className="w-6 h-6 text-yellow-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                            Implementation Status
                          </h3>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                            The product variant system is fully implemented in the backend and ready for frontend integration.
                          </p>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">
                            <strong>Next Steps:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Update product creation/editing forms</li>
                              <li>Add variant selection to product display pages</li>
                              <li>Integrate variants into checkout process</li>
                              <li>Update cart functionality for variants</li>
                              <li>Add variant-based inventory management</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminSettings;
