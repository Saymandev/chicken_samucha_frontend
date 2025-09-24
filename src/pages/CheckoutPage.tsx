import { motion } from 'framer-motion';
import {
  CreditCard,
  MapPin,
  Phone,
  ShoppingCart,
  User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { contentAPI, couponAPI, ordersAPI, paymentsAPI, productsAPI } from '../utils/api';

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
  method: 'sslcommerz' | 'cash_on_delivery';
  transactionId?: string;
  screenshot?: File;
}

interface AppliedCoupon {
  id: string;
  code: string;
  name: { en: string; bn: string };
  type: 'percentage' | 'fixed';
  value: number;
  discount: number;
  maxDiscountAmount?: number;
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
      city: user?.address?.city || 'Rangpur',
      district: user?.address?.district || 'Rangpur',
      postalCode: user?.address?.postalCode || ''
    }
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'sslcommerz'
  });

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [loading, setLoading] = useState(false);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Delivery settings (pulled from backend public endpoint)
  const [deliverySettings, setDeliverySettings] = useState<{ deliveryCharge: number; freeDeliveryThreshold: number; zones?: Array<{ id: string; name: { en: string; bn: string }; price: number }> } | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const selectedZonePrice = deliverySettings?.zones?.find(z => z.id === selectedZoneId)?.price;
  const baseDeliveryCharge = (selectedZonePrice ?? deliverySettings?.deliveryCharge) ?? 60; // Default fallback
  const freeThreshold = deliverySettings?.freeDeliveryThreshold ?? 500; // Default fallback
  const deliveryCharge = deliveryMethod === 'pickup' ? 0 : (cartTotal >= freeThreshold ? 0 : baseDeliveryCharge);
  const couponDiscount = appliedCoupon?.discount || 0;
  const finalTotal = Math.max(0, cartTotal + deliveryCharge - couponDiscount);

  useEffect(() => {
    fetchPaymentSettings();
    // Fetch delivery settings
    (async () => {
      try {
        const res = await contentAPI.getDeliverySettings();
        if (res.data?.success) {
          setDeliverySettings(res.data.settings);
          if (Array.isArray(res.data.settings?.zones) && res.data.settings.zones.length > 0) {
            // Default by user last selection, else by address match (area/city/district), else first
            const zones = res.data.settings.zones;
            const byLast = user?.lastDeliveryZoneId && zones.find((z: any) => z.id === user.lastDeliveryZoneId)?.id;
            const parts = [customerInfo.address.area, customerInfo.address.city, customerInfo.address.district]
              .filter(Boolean)
              .map((s) => String(s).toLowerCase());
            const byAddress = zones.find((z: any) => {
              const en = (z.name.en || '').toLowerCase();
              const bn = (z.name.bn || '').toLowerCase();
              return parts.some((p) => en.includes(p) || bn.includes(p));
            })?.id;
            setSelectedZoneId(byLast || byAddress || zones[0].id);
          }
        }
      } catch (e) {
        // keep defaults
      }
    })();
  }, []);

  // Persist selected zone for logged-in users when it changes
  useEffect(() => {
    if (!user || !selectedZoneId) return;
    // fire and forget; avoid blocking UI
    import('../utils/api').then(({ authAPI }: any) => {
      authAPI.updateDetails({ lastDeliveryZoneId: selectedZoneId }).catch(() => {});
    });
  }, [selectedZoneId, user]);

  const fetchPaymentSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await paymentsAPI.getPaymentMethods();
      if (response.data.success) {
        setPaymentSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      // Use default settings if fetch fails
      setPaymentSettings({
        sslcommerz: { enabled: true },
        cash_on_delivery: { enabled: true }
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  // Coupon functions
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      setIsValidatingCoupon(true);
      setCouponError('');
      
      const orderProducts = cart.map(item => item.product.id);
      const response = await couponAPI.validateCoupon({
        code: couponCode.trim(),
        orderAmount: cartTotal + deliveryCharge,
        userId: user?.id,
        orderProducts
      });

      if (response.data.success) {
        setAppliedCoupon(response.data.coupon);
        toast.success('Coupon applied successfully!');
        setCouponCode('');
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      setCouponError(error.response?.data?.message || 'Invalid coupon code');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponCode('');
  };

  // Payment methods - only SSLCommerz and Cash on Delivery
  const getPaymentMethods = () => {
    if (!paymentSettings) return [];

    const allMethods = [
      {
        id: 'sslcommerz',
        name: 'SSLCommerz',
        logo: '🏦',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-200 dark:border-indigo-800',
        number: '',
        enabled: paymentSettings.sslcommerz?.enabled,
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
        logo: '💵',
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
        number: '',
        enabled: paymentSettings.cash_on_delivery?.enabled,
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

  // File upload not needed for SSLCommerz or COD

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

    // SSLCommerz and Cash on Delivery don't require transaction ID or screenshot
    // SSLCommerz redirects to payment gateway, COD is paid on delivery

    return true;
  };

  // Handle SSLCommerz payment
  const handleSSLCommerzPayment = async () => {
    try {
      setLoading(true);

      // 1) Initiate SSLCommerz first with a provisional order number
      const provisionalOrderNumber = `ORD${Date.now()}`;

      const paymentData = {
        orderNumber: provisionalOrderNumber,
        totalAmount: finalTotal,
        customer: customerInfo,
        items: cart.map(item => ({
          name: item.product.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const paymentResponse = await paymentsAPI.initiateSSLCommerzPayment(paymentData);

      if (!paymentResponse.data?.success) {
        toast.error(paymentResponse.data?.message || 'Failed to initiate payment');
        return;
      }

      // 2) Persist checkout payload locally; create the order after successful payment
      try {
        const payload = {
          orderNumber: provisionalOrderNumber,
          customer: customerInfo,
          items: cart.map(item => ({
            product: (item.product as any).id || (item.product as any)._id,
            quantity: item.quantity
          })),
          paymentInfo: { method: 'sslcommerz' },
          deliveryInfo: {
            method: deliveryMethod,
            address: deliveryMethod === 'delivery'
              ? `${customerInfo.address.street}, ${customerInfo.address.area}, ${customerInfo.address.city}`
              : 'Pickup from restaurant',
            phone: customerInfo.phone,
            deliveryCharge
          },
          totals: {
            totalAmount: cartTotal,
            finalAmount: finalTotal
          }
        };
        localStorage.setItem(`checkout:${provisionalOrderNumber}`, JSON.stringify(payload));
      } catch {}

      // 3) Redirect to SSLCommerz gateway
      const gatewayUrl = paymentResponse.data.data.gatewayPageURL;
      window.location.href = gatewayUrl;
    } catch (error: any) {
      console.error('SSLCommerz payment error:', error);
      toast.error(error?.response?.data?.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
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

    // Handle SSLCommerz payment differently
    if (paymentInfo.method === 'sslcommerz') {
      await handleSSLCommerzPayment();
      return;
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
        
        formData.append(`items[${index}][product]`, productId);
        formData.append(`items[${index}][quantity]`, item.quantity.toString());
      });
      
      // Send payment info in the format backend expects
      formData.append('paymentInfo[method]', paymentInfo.method);
      
      // Send delivery info
      formData.append('deliveryInfo[method]', deliveryMethod);
      if (deliveryMethod === 'delivery') {
        formData.append('deliveryInfo[address]', `${customerInfo.address.street}, ${customerInfo.address.area}, ${customerInfo.address.city}`);
      } else {
        formData.append('deliveryInfo[address]', 'Pickup from restaurant');
      }
      formData.append('deliveryInfo[phone]', customerInfo.phone);
      formData.append('deliveryInfo[deliveryCharge]', deliveryCharge.toString());
      
      // Payment screenshot not needed for SSLCommerz or COD

      

      const response = await ordersAPI.createOrder(formData);
      
      if (response.data.success) {
        // Track purchase counts for each item (best-effort)
        try {
          for (const item of cart) {
            const productId = (item.product as any).id || (item.product as any)._id;
            if (productId) {
              productsAPI.trackPurchase(productId, item.quantity).catch(() => {});
            }
          }
        } catch {}

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
                        {cartTotal >= freeThreshold ? (
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            🎉 FREE Delivery (Order ≥ ৳{freeThreshold})
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
                      
                      <option value="Other">Other</option>
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
{/* Delivery Zones (place-based) */}
{deliveryMethod === 'delivery' && Array.isArray(deliverySettings?.zones) && (deliverySettings!.zones.length > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Delivery Area</h3>
                  <div className="space-y-2">
                    {deliverySettings!.zones.map((z) => (
                      <label key={z.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery-zone"
                            checked={selectedZoneId === z.id}
                            onChange={() => setSelectedZoneId(z.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {language === 'bn' ? (z.name.bn || z.name.en) : (z.name.en || z.name.bn)}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">৳ {z.price.toFixed(2)}</span>
                      </label>
                    ))}
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

                {/* Transaction Details - Not needed for SSLCommerz or COD */}

                {/* SSLCommerz Payment Button */}
                {paymentInfo.method === 'sslcommerz' && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🏦</div>
                      <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                        Secure Payment with SSLCommerz
                      </h3>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                        You will be redirected to a secure payment page where you can pay with your preferred method.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                        <span className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded">💳 Cards</span>
                        <span className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded">📱 Mobile Banking</span>
                        <span className="bg-indigo-100 dark:bg-indigo-800 px-2 py-1 rounded">🏦 Internet Banking</span>
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

                {/* Coupon Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Coupon Code
                  </h3>
                  
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          disabled={isValidatingCoupon}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponCode.trim()}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isValidatingCoupon ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-sm text-red-600 dark:text-red-400">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            {language === 'bn' ? appliedCoupon.name.bn : appliedCoupon.name.en}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            {appliedCoupon.type === 'percentage' 
                              ? `${appliedCoupon.value}% off` 
                              : `৳${appliedCoupon.value} off`}
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>৳{cartTotal}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-৳{couponDiscount}</span>
                    </div>
                  )}
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
                    <span>Call for support: 01537134852</span>
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