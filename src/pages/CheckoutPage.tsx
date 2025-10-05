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
import { useTranslation } from 'react-i18next';
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
  method: 'sslcommerz' | 'cash_on_delivery' | 'bkash' | 'nagad' | 'rocket' | 'upay';
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
  const { t } = useTranslation();
  const { cart, cartTotal, clearCart, user, language } = useStore();
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: {
      street: user?.address?.street || '',
      area: user?.address?.area || '',
      city: user?.address?.city || '',
      district: user?.address?.district || '',
      postalCode: user?.address?.postalCode || ''
    }
  });

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    method: 'sslcommerz'
  });

  const [deliveryMethod] = useState<'pickup' | 'delivery'>('delivery');
  const [orderNote, setOrderNote] = useState('');
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
  
  // Check if any product in cart has free delivery
  const hasFreeDeliveryProduct = cart.some(item => {
    const product = item.product;
    return product && product.freeDelivery === true;
  });
  
  const deliveryCharge = deliveryMethod === 'pickup' ? 0 : (cartTotal >= freeThreshold || hasFreeDeliveryProduct ? 0 : baseDeliveryCharge);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Payment methods - SSLCommerz, Manual Payment, and Cash on Delivery
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
      }
    ];

    // Add manual payment methods if enabled
    if (paymentSettings.manual_payment?.enabled && paymentSettings.manual_payment?.subMethods) {
      const manualMethods = Object.entries(paymentSettings.manual_payment.subMethods)
        .filter(([_, subMethod]: [string, any]) => subMethod.enabled)
        .map(([key, subMethod]: [string, any]) => ({
          id: key,
          name: subMethod.name,
          logo: key === 'bkash' ? '📱' : key === 'nagad' ? '📱' : key === 'rocket' ? '🚀' : '📱',
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
          number: subMethod.accountNumber || '',
          enabled: true,
          instructions: [
            `Send money to ${subMethod.name} number: ${subMethod.accountNumber || 'Not configured'}`,
            'Include your order number in the transaction',
            'Take a screenshot of the payment confirmation',
            'Enter the transaction ID below',
            subMethod.instructions || 'Complete the payment and provide transaction details'
          ]
        }));
      
      allMethods.push(...manualMethods);
    }

    // Add Cash on Delivery
    allMethods.push({
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
        deliveryCharge === 0 ? (hasFreeDeliveryProduct ? 'FREE delivery (Product) 🎉' : 'FREE delivery (Order ≥ ৳500) 🎉') : 'Delivery charge: ৳' + deliveryCharge + ' (included in total)'
      ]
    });

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
      const hasStreet = !!customerInfo.address.street?.trim();
      const hasArea = !!customerInfo.address.area?.trim();
      if (deliveryCharge === 0) {
        // Free delivery: accept if at least one of street or area is present
        if (!hasStreet && !hasArea) {
          toast.error('Please enter delivery address (street or area)');
          return false;
        }
      } else {
        // Paid delivery: require both street and area
        if (!hasStreet || !hasArea) {
          toast.error('Please fill in complete delivery address');
          return false;
        }
      }
    }

    // Validate Bangladesh phone number
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(customerInfo.phone)) {
      toast.error('Please enter a valid Bangladesh phone number (01XXXXXXXXX)');
      return false;
    }

    // Validate manual payment methods
    const manualPaymentMethods = ['bkash', 'nagad', 'rocket', 'upay'];
    if (manualPaymentMethods.includes(paymentInfo.method)) {
      if (!paymentInfo.transactionId?.trim()) {
        toast.error('Please enter the transaction ID for your payment');
        return false;
      }
      if (!paymentInfo.screenshot) {
        toast.error('Please upload a screenshot of your payment confirmation');
        return false;
      }
    }

    return true;
  };

  // Handle SSLCommerz payment
  const handleSSLCommerzPayment = async () => {
    try {
      setLoading(true);

      // 1) Create order in database first
      const formData = new FormData();

      // Add customer info
      formData.append('customer[name]', customerInfo.name);
      formData.append('customer[phone]', customerInfo.phone);
      formData.append('customer[email]', customerInfo.email);

      // Add address if delivery
      if (deliveryMethod === 'delivery') {
        formData.append('customer[address][street]', customerInfo.address.street);
        formData.append('customer[address][area]', customerInfo.address.area);
        formData.append('customer[address][city]', customerInfo.address.city);
        formData.append('customer[address][district]', customerInfo.address.district);
      }

      // Add items
      cart.forEach((item, index) => {
        const productId = (item.product as any).id || (item.product as any)._id;
        formData.append(`items[${index}][product]`, productId);
        formData.append(`items[${index}][quantity]`, item.quantity.toString());
        
        // Add variant data if available
        if (item.variantData) {
          if (item.variantData.color) {
            formData.append(`items[${index}][variantData][color]`, item.variantData.color);
          }
          if (item.variantData.size) {
            formData.append(`items[${index}][variantData][size]`, item.variantData.size);
          }
          if (item.variantData.weight) {
            formData.append(`items[${index}][variantData][weight]`, item.variantData.weight);
          }
          if (item.variantData.priceModifier !== undefined) {
            formData.append(`items[${index}][variantData][priceModifier]`, item.variantData.priceModifier.toString());
          }
        }
      });

      // Add payment info
      formData.append('paymentInfo[method]', 'sslcommerz');
      formData.append('paymentInfo[status]', 'pending');

      // Add delivery info
      formData.append('deliveryInfo[method]', deliveryMethod);
      formData.append('deliveryInfo[address]', deliveryMethod === 'delivery'
        ? [customerInfo.address.street, customerInfo.address.area, customerInfo.address.city]
            .filter(Boolean)
            .map((s) => String(s).trim())
            .filter((s) => s.length > 0)
            .join(', ')
        : 'Pickup from restaurant');
      formData.append('deliveryInfo[phone]', customerInfo.phone);
      formData.append('deliveryInfo[deliveryCharge]', deliveryCharge.toString());

      // Add totals
      formData.append('totalAmount', cartTotal.toString());
      formData.append('finalAmount', finalTotal.toString());

      const orderResponse = await ordersAPI.createOrder(formData);
      
      if (!orderResponse.data?.success) {
        toast.error(orderResponse.data?.message || 'Failed to create order');
        return;
      }

      const orderNumber = orderResponse.data.order.orderNumber;

      // 2) Initiate SSLCommerz payment with the created order number
      const paymentData = {
        orderNumber: orderNumber,
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
        
        // Add variant data if available
        if (item.variantData) {
          if (item.variantData.color) {
            formData.append(`items[${index}][variantData][color]`, item.variantData.color);
          }
          if (item.variantData.size) {
            formData.append(`items[${index}][variantData][size]`, item.variantData.size);
          }
          if (item.variantData.weight) {
            formData.append(`items[${index}][variantData][weight]`, item.variantData.weight);
          }
          if (item.variantData.priceModifier !== undefined) {
            formData.append(`items[${index}][variantData][priceModifier]`, item.variantData.priceModifier.toString());
          }
        }
      });
      
      // Send payment info in the format backend expects
      formData.append('paymentInfo[method]', paymentInfo.method);
      
      // Add transaction ID and screenshot for manual payment methods
      const manualPaymentMethods = ['bkash', 'nagad', 'rocket', 'upay'];
      if (manualPaymentMethods.includes(paymentInfo.method)) {
        if (paymentInfo.transactionId) {
          formData.append('paymentInfo[transactionId]', paymentInfo.transactionId);
        }
        if (paymentInfo.screenshot) {
          formData.append('paymentScreenshot', paymentInfo.screenshot);
        }
      }
      
      // Send delivery info
      formData.append('deliveryInfo[method]', deliveryMethod);
      if (deliveryMethod === 'delivery') {
        formData.append('deliveryInfo[address]', [customerInfo.address.street, customerInfo.address.area, customerInfo.address.city]
          .filter(Boolean)
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0)
          .join(', '));
      } else {
        formData.append('deliveryInfo[address]', 'Pickup from restaurant');
      }
      formData.append('deliveryInfo[phone]', customerInfo.phone);
      formData.append('deliveryInfo[deliveryCharge]', deliveryCharge.toString());
      
      // Add order note if provided
      if (orderNote.trim()) {
        formData.append('notes', orderNote.trim());
      }
      
      // Payment screenshot not needed for SSLCommerz or COD

      

      const response = await ordersAPI.createOrder(formData);
      
      if (response.data.success) {
        // Track purchase counts for each item (best-effort)
        try {
          for (const item of cart) {
            const productId = (item.product as any).id || (item.product as any)._id;
            if (productId) {
              productsAPI.trackPurchase(productId, item.quantity).catch((error) => {
                console.warn('Purchase tracking failed:', error?.response?.status, error?.response?.data);
              });
            }
          }
        } catch (error) {
          console.warn('Purchase tracking error:', error);
        }

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
              Add some products to your cart before checkout
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
            {t('checkout.title')}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('checkout.customerInfo')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('checkout.name')} *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder={t('checkout.name')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('checkout.phone')} *
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
                      {t('checkout.email')} (Optional)
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="your@email.com"
                      onBlur={() => {
                        // If left empty, set a safe placeholder so gateways requiring email won't fail
                        if (!customerInfo.email || !customerInfo.email.trim()) {
                          setCustomerInfo((prev) => ({
                            ...prev,
                            email: `${(prev.phone || 'guest').toString().replace(/[^\d]/g,'') || 'guest'}@noemail.local`
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              

               {/* Delivery Address */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('checkout.address')}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('checkout.street')} *
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
                      {t('checkout.area')} *
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
                      {t('checkout.city')}
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
                      <option value="Narayanganj">Narayanganj</option>
                      <option value="Mymensingh">Mymensingh</option>
                      
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('checkout.district')}
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

              {/* Order Note */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-orange-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('checkout.orderNote')}
                  </h2>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('checkout.orderNote')}
                  </label>
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder={t('checkout.orderNotePlaceholder')}
                    rows={3}
                  />
                </div>
              </div>

              {/* Delivery Zones (place-based) - Only show when delivery has charges (not free) */}
              {deliveryMethod === 'delivery' && Array.isArray(deliverySettings?.zones) && (deliverySettings!.zones.length > 0) && deliveryCharge > 0 && (
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
                    {t('checkout.paymentMethod')}
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

                {/* Transaction Details for Manual Payment Methods */}
                {['bkash', 'nagad', 'rocket', 'upay'].includes(paymentInfo.method) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
                      Payment Details
                    </h3>
                    
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
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPaymentInfo({ ...paymentInfo, screenshot: file });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        {paymentInfo.screenshot && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            ✓ {paymentInfo.screenshot.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

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
                  {t('checkout.orderSummary')}
                </h2>

                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {language === 'bn' ? item.product.name.bn : item.product.name.en}
                        </h3>
                        {/* Variant details, if any */}
                        {item.variantData && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2 mt-1">
                            {item.variantData.color && (
                              <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                Color: {item.variantData.color}
                              </span>
                            )}
                            {item.variantData.size && (
                              <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                Size: {item.variantData.size}
                              </span>
                            )}
                            {item.variantData.weight && (
                              <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                                Weight: {item.variantData.weight}
                              </span>
                            )}
                          </div>
                        )}
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
                    {t('checkout.couponCode')}
                  </h3>
                  
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder={t('checkout.couponCode')}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          disabled={isValidatingCoupon}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponCode.trim()}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isValidatingCoupon ? t('checkout.processing') : t('checkout.applyCoupon')}
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
                          {t('checkout.removeCoupon')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{t('checkout.subtotal')}</span>
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
                        {deliveryMethod === 'pickup' ? t('checkout.pickup') : t('checkout.deliveryCharge')}
                      </span>
                    <span className={deliveryCharge === 0 && deliveryMethod === 'delivery' ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                      {deliveryMethod === 'pickup' ? 'Free' : 
                       deliveryCharge === 0 ? (hasFreeDeliveryProduct ? 'FREE (Product) 🎉' : 'FREE 🎉') : `৳${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span>{t('checkout.total')}</span>
                    <span>৳{finalTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? t('checkout.processing') : t('checkout.placeOrder')}
                </button>

                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>Call for support: 01629428590</span>
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
 