import { motion } from 'framer-motion';
import {
  CreditCard,
  MapPin,
  Phone,
  ShoppingCart,
  Upload,
  User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { contentAPI, ordersAPI } from '../utils/api';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    area: string;
    city: string;
    district: string;
    postalCode?: string;
  };
}

interface PaymentInfo {
  method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'cash_on_delivery';
  transactionId?: string;
  screenshot?: File;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart, user, language } = useStore();
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: {
      street: user?.address?.street || '',
      area: user?.address?.area || '',
      city: user?.address?.city || 'Dhaka',
      district: user?.address?.district || 'Dhaka',
      postalCode: user?.address?.postalCode || ''
    }
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'bkash'
  });

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [loading, setLoading] = useState(false);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Free delivery for orders ≥ ৳500
  const baseDeliveryCharge = paymentSettings?.cashOnDelivery?.deliveryCharge || 60;
  const deliveryCharge = deliveryMethod === 'pickup' ? 0 : (cartTotal >= 500 ? 0 : baseDeliveryCharge);
  const finalTotal = cartTotal + deliveryCharge;

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await contentAPI.getPaymentSettings();
      if (response.data.success) {
        setPaymentSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      // Use default settings if fetch fails
      setPaymentSettings({
        bkash: { enabled: true, merchantNumber: '01234567890' },
        nagad: { enabled: true, merchantNumber: '01234567891' },
        rocket: { enabled: true, merchantNumber: '01234567892' },
        upay: { enabled: false, merchantNumber: '01234567893' },
        cashOnDelivery: { enabled: true, deliveryCharge: 60 }
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  // Bangladesh mobile payment methods (filtered by admin settings)
  const getPaymentMethods = () => {
    if (!paymentSettings) return [];

    const allMethods = [
      {
        id: 'bkash',
        name: 'bKash',
        logo: '📱',
        color: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-200 dark:border-pink-800',
        number: paymentSettings.bkash?.merchantNumber || '01234567890',
        enabled: paymentSettings.bkash?.enabled,
        instructions: [
          'Go to bKash app/dial *247#',
          'Select "Send Money"',
          `Enter merchant number: ${paymentSettings.bkash?.merchantNumber || '01234567890'}`,
          'Enter amount: ৳' + finalTotal,
          'Enter reference: Your phone number',
          'Complete the transaction',
          'Take a screenshot of confirmation',
          'Upload the screenshot below'
        ]
      },
      {
        id: 'nagad',
        name: 'Nagad',
        logo: '💰',
        color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-200 dark:border-orange-800',
        number: paymentSettings.nagad?.merchantNumber || '01234567891',
        enabled: paymentSettings.nagad?.enabled,
        instructions: [
          'Go to Nagad app/dial *167#',
          'Select "Send Money"',
          `Enter merchant number: ${paymentSettings.nagad?.merchantNumber || '01234567891'}`,
          'Enter amount: ৳' + finalTotal,
          'Enter reference: Your phone number',
          'Complete the transaction',
          'Take a screenshot of confirmation',
          'Upload the screenshot below'
        ]
      },
      {
        id: 'rocket',
        name: 'Rocket',
        logo: '🚀',
        color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-200 dark:border-purple-800',
        number: paymentSettings.rocket?.merchantNumber || '01234567892',
        enabled: paymentSettings.rocket?.enabled,
        instructions: [
          'Go to Rocket app/dial *322#',
          'Select "Send Money"',
          `Enter merchant number: ${paymentSettings.rocket?.merchantNumber || '01234567892'}`,
          'Enter amount: ৳' + finalTotal,
          'Enter reference: Your phone number',
          'Complete the transaction',
          'Take a screenshot of confirmation',
          'Upload the screenshot below'
        ]
      },
      {
        id: 'upay',
        name: 'Upay',
        logo: '💳',
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
        number: paymentSettings.upay?.merchantNumber || '01234567893',
        enabled: paymentSettings.upay?.enabled,
        instructions: [
          'Go to Upay app',
          'Select "Send Money"',
          `Enter merchant number: ${paymentSettings.upay?.merchantNumber || '01234567893'}`,
          'Enter amount: ৳' + finalTotal,
          'Enter reference: Your phone number',
          'Complete the transaction',
          'Take a screenshot of confirmation',
          'Upload the screenshot below'
        ]
      },
      {
        id: 'cash_on_delivery',
        name: 'Cash on Delivery',
        logo: '💵',
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
        number: '',
        enabled: paymentSettings.cashOnDelivery?.enabled,
        instructions: deliveryMethod === 'pickup' ? [
          'Pay cash when you collect your order',
          'Keep exact amount ready: ৳' + finalTotal,
          'You can also pay with mobile banking at pickup',
          'No delivery charge for pickup orders'
        ] : [
          'Pay cash when our delivery person arrives',
          'Keep exact amount ready: ৳' + finalTotal,
          'You can also pay with mobile banking to our delivery person',
          deliveryCharge === 0 ? 'FREE delivery (Order ≥ ৳500) 🎉' : 'Delivery charge: ৳' + deliveryCharge + ' (included in total)'
        ]
      }
    ];

    // Filter only enabled payment methods
    return allMethods.filter(method => method.enabled);
  };

  const paymentMethods = getPaymentMethods();

  // Auto-select first available payment method when settings load
  React.useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethods.find(method => method.id === paymentInfo.method)) {
      setPaymentInfo({ method: paymentMethods[0].id as any, transactionId: '', screenshot: undefined });
    }
  }, [paymentMethods, paymentInfo.method]);

  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentInfo.method);

  const handleCustomerInfoChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setCustomerInfo({
        ...customerInfo,
        address: { ...customerInfo.address, [addressField]: value }
      });
    } else {
      setCustomerInfo({ ...customerInfo, [field]: value });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setPaymentInfo({ ...paymentInfo, screenshot: file });
      toast.success('Screenshot uploaded successfully');
    }
  };

  const validateForm = () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please fill in all required customer information');
      return false;
    }

    // Only validate delivery address if delivery is selected
    if (deliveryMethod === 'delivery') {
      if (!customerInfo.address.street || !customerInfo.address.area) {
        toast.error('Please fill in complete delivery address');
        return false;
      }
    }

    // Validate Bangladesh phone number
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(customerInfo.phone)) {
      toast.error('Please enter a valid Bangladesh phone number (01XXXXXXXXX)');
      return false;
    }

    if (paymentInfo.method !== 'cash_on_delivery') {
      if (!paymentInfo.transactionId) {
        toast.error('Please enter transaction ID');
        return false;
      }
      if (!paymentInfo.screenshot) {
        toast.error('Please upload payment screenshot');
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    // Validate cart items
    if (!cart || cart.length === 0) {
      toast.error('Your cart is empty. Please add some items before ordering.');
      return;
    }

    // Validate each cart item
    for (const item of cart) {
      const productId = item.product?.id || (item.product as any)?._id;
      if (!item.product || !productId) {
        console.error('Invalid product in cart:', item);
        toast.error('Invalid product in cart. Please refresh and try again.');
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error('Invalid quantity in cart. Please refresh and try again.');
        return;
      }
    }

    try {
      setLoading(true);

      const formData = new FormData();
      
      // Send customer info in the format backend expects
      formData.append('customer[name]', customerInfo.name);
      formData.append('customer[phone]', customerInfo.phone);
      formData.append('customer[email]', customerInfo.email);
      
      // Only include address if delivery is selected
      if (deliveryMethod === 'delivery') {
        formData.append('customer[address][street]', customerInfo.address.street);
        formData.append('customer[address][area]', customerInfo.address.area);
        formData.append('customer[address][city]', customerInfo.address.city);
        formData.append('customer[address][district]', customerInfo.address.district);
        if (customerInfo.address.postalCode) {
          formData.append('customer[address][postalCode]', customerInfo.address.postalCode);
        }
      }
      
      // Send items array in the format backend expects
      cart.forEach((item, index) => {
        const productId = item.product.id || (item.product as any)._id;
        console.log(`Item ${index} - Product ID:`, productId, 'Full product:', item.product);
        formData.append(`items[${index}][product]`, productId);
        formData.append(`items[${index}][quantity]`, item.quantity.toString());
      });
      
      // Send payment info in the format backend expects
      formData.append('paymentInfo[method]', paymentInfo.method);
      if (paymentInfo.transactionId) {
        formData.append('paymentInfo[transactionId]', paymentInfo.transactionId);
      }
      
      // Send delivery info
      formData.append('deliveryInfo[method]', deliveryMethod);
      if (deliveryMethod === 'delivery') {
        formData.append('deliveryInfo[address]', `${customerInfo.address.street}, ${customerInfo.address.area}, ${customerInfo.address.city}`);
      } else {
        formData.append('deliveryInfo[address]', 'Pickup from restaurant');
      }
      formData.append('deliveryInfo[phone]', customerInfo.phone);
      formData.append('deliveryInfo[deliveryCharge]', deliveryCharge.toString());
      
      // Add payment screenshot if provided
      if (paymentInfo.screenshot) {
        formData.append('paymentScreenshot', paymentInfo.screenshot);
      }

      console.log('Sending order data:', {
        customer: customerInfo,
        items: cart,
        paymentInfo: paymentInfo,
        deliveryCharge
      });

      const response = await ordersAPI.createOrder(formData);
      
      if (response.data.success) {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/track-order?orderNumber=${response.data.order.orderNumber}`);
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(`${err.path}: ${err.msg}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add some delicious chicken samosas to your cart before checkout
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Products
            </button>
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Customer Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Method Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Delivery Method
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      deliveryMethod === 'pickup'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🏪</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Pickup from Restaurant
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Collect your order from our location
                        </p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          Free - No delivery charge
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      deliveryMethod === 'delivery'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🚚</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Home Delivery
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          We'll deliver to your address
                        </p>
                        {cartTotal >= 500 ? (
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            🎉 FREE Delivery (Order ≥ ৳500)
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            ৳{baseDeliveryCharge} delivery charge
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              {deliveryMethod === 'delivery' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Delivery Address
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.street}
                      onChange={(e) => handleCustomerInfoChange('address.street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="House/Flat no, Road no"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Area *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.area}
                      onChange={(e) => handleCustomerInfoChange('address.area', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Area/Thana"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <select
                      value={customerInfo.address.city}
                      onChange={(e) => handleCustomerInfoChange('address.city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Khulna">Khulna</option>
                      <option value="Barisal">Barisal</option>
                      <option value="Rangpur">Rangpur</option>
                      <option value="Mymensingh">Mymensingh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      value={customerInfo.address.district}
                      onChange={(e) => handleCustomerInfoChange('address.district', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="District"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Payment Method */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Payment Method
                  </h2>
                </div>

                {loadingSettings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading payment methods...</p>
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">No payment methods available. Please contact support.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setPaymentInfo({ method: method.id as any, transactionId: '', screenshot: undefined });
                        setShowPaymentInstructions(method.id !== 'cash_on_delivery');
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        paymentInfo.method === method.id
                          ? `${method.color} border-current`
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{method.logo}</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {method.name}
                      </div>
                    </button>
                  ))}
                  </div>
                )}

                {/* Payment Instructions */}
                {showPaymentInstructions && selectedPaymentMethod && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      {selectedPaymentMethod.name} Payment Instructions
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      {selectedPaymentMethod.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Transaction Details */}
                {paymentInfo.method !== 'cash_on_delivery' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Transaction ID *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.transactionId || ''}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, transactionId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Enter transaction ID from your payment"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payment Screenshot *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="screenshot-upload"
                        />
                        <label htmlFor="screenshot-upload" className="cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">
                            {paymentInfo.screenshot ? paymentInfo.screenshot.name : 'Click to upload payment screenshot'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            PNG, JPG up to 5MB
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {language === 'bn' ? item.product.name.bn : item.product.name.en}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity} × ৳{item.price}
                        </p>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ৳{item.subtotal}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>৳{cartTotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>
                      {deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery Charge'}
                    </span>
                    <span className={deliveryCharge === 0 && deliveryMethod === 'delivery' ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                      {deliveryMethod === 'pickup' ? 'Free' : 
                       deliveryCharge === 0 ? 'FREE 🎉' : `৳${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span>Total</span>
                    <span>৳{finalTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>

                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>Call for support: 01700000000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage; 