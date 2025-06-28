import { motion } from 'framer-motion';
import { CheckCircle, Clock, MapPin, Package, Phone, Search, Star, Truck, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { ordersAPI, reviewsAPI } from '../utils/api';

const TrackOrderPage: React.FC = () => {
  const { t } = useTranslation();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [orderStatus, setOrderStatus] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<string>('');
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      toast.error('Please fill in both order number and phone number');
      return;
    }

    // Basic phone validation for Bangladesh
    const phoneRegex = /^(\+880|880|0)?[13-9]\d{8,9}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      toast.error('Please enter a valid Bangladesh phone number');
      return;
    }

    setIsTracking(true);
    setError('');
    
    try {
      console.log('Tracking order:', { orderNumber: orderNumber.trim(), phone: phone.trim() });
      const response = await ordersAPI.trackOrderWithPhone(orderNumber.trim(), phone.trim());
      console.log('Track response:', response.data);
      
      if (response.data.success && response.data.data) {
        setOrderStatus(response.data.data);
        toast.success('Order found successfully!');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error tracking order:', error);
      const errorMessage = error.response?.data?.message || 'Order not found. Please check your order number and phone number.';
      setError(errorMessage);
      toast.error(errorMessage);
      setOrderStatus(null);
    } finally {
      setIsTracking(false);
    }
  };

  // Customer action handlers
  const handleConfirmDelivery = (orderNumber: string) => {
    // This could update order status or create a confirmation record
    toast.success('Delivery confirmed! Thank you for your order.');
    // In real implementation, you'd call an API to mark delivery as confirmed
  };

  const handleRateOrder = (orderNumber: string) => {
    // Open review modal
    setSelectedOrderForReview(orderNumber);
    setShowReviewModal(true);
    setRating(5);
    setReviewComment('');
  };

  const handleRequestReturn = (orderNumber: string) => {
    // Navigate to return request page
    toast('Redirecting to return request page...');
    // window.location.href = `/returns/request?order=${orderNumber}`;
  };

  const handleCancelOrder = (orderNumber: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      toast.success('Order cancellation requested. We will contact you shortly.');
      // In real implementation, call API to request cancellation
    }
  };

  const handleContactSupport = () => {
    // Open support chat or call
    window.open('tel:01700000000', '_self');
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('rating', rating.toString());
      formData.append('comment.en', reviewComment);
      formData.append('reviewType', 'general');
      formData.append('customer.name', orderStatus?.customer?.name || 'Customer');
      formData.append('customer.phone', orderStatus?.customer?.phone || '');
      
      // Link to order if available
      if (selectedOrderForReview) {
        formData.append('orderNumber', selectedOrderForReview);
      }

      await reviewsAPI.createReview(formData);
      toast.success('Thank you for your review! It will be published after approval.');
      setShowReviewModal(false);
      setReviewComment('');
      setRating(5);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    const iconClass = completed ? 'text-green-500' : 'text-gray-400';
    switch (status) {
      case 'placed':
        return <Package className={`w-5 h-5 ${iconClass}`} />;
      case 'confirmed':
        return <CheckCircle className={`w-5 h-5 ${iconClass}`} />;
      case 'preparing':
        return <Clock className={`w-5 h-5 ${iconClass}`} />;
      case 'in_transit':
        return <Truck className={`w-5 h-5 ${iconClass}`} />;
      case 'out_for_delivery':
        return <MapPin className={`w-5 h-5 ${iconClass}`} />;
      case 'delivered':
        return <CheckCircle className={`w-5 h-5 ${iconClass}`} />;
      default:
        return <Package className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      case 'in_transit':
      case 'out_for_delivery':
        return 'text-blue-600';
      case 'preparing':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
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
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Package className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              {t('trackOrder.title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('trackOrder.subtitle')}
            </p>
          </div>

          {/* Track Order Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8"
          >
            <form onSubmit={handleTrackOrder} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('trackOrder.orderNumber')}
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                      placeholder="ORD123456789"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter your order number (starts with ORD)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the phone number used for the order
                  </p>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <motion.button
                type="submit"
                disabled={isTracking}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isTracking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('trackOrder.tracking')}
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    {t('trackOrder.trackButton')}
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Order Status Results */}
          {orderStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                {t('trackOrder.orderDetails')}
              </h2>
              
              {/* Order Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Order Number</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white break-all">#{orderStatus.orderNumber}</p>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Current Status</p>
                  <p className={`text-base sm:text-lg font-bold ${getStatusColor(orderStatus.status)}`}>
                    {orderStatus.status.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Order Date</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(orderStatus.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                  <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                    ৳{orderStatus.total}
                  </p>
                </div>
              </div>

              {/* Customer & Payment Info */}
              {(orderStatus.customer || orderStatus.paymentInfo) && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {orderStatus.customer && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Name:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{orderStatus.customer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{orderStatus.customer.phone}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {orderStatus.paymentInfo && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Method:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{orderStatus.paymentInfo.method.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className={`font-medium ${
                            orderStatus.paymentInfo.status === 'verified' ? 'text-green-600 dark:text-green-400' :
                            orderStatus.paymentInfo.status === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {orderStatus.paymentInfo.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order Items */}
              {orderStatus.items && orderStatus.items.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Order Items
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="space-y-3">
                      {orderStatus.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                          <div>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {item.name}
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Quantity: {item.quantity} × ৳{item.price}
                            </p>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">
                            ৳{item.subtotal || (item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</span>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">৳{orderStatus.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Timeline */}
              {orderStatus.statusHistory && orderStatus.statusHistory.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Order Status Timeline
                  </h3>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>
                    
                    {orderStatus.statusHistory.map((item: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="relative flex items-start pb-8 last:pb-0"
                      >
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${
                          item.completed 
                            ? 'bg-green-500 border-green-300' 
                            : 'bg-gray-300 border-gray-200 dark:bg-gray-600 dark:border-gray-500'
                        }`}>
                          {getStatusIcon(item.status, item.completed)}
                        </div>
                        
                        {/* Content */}
                        <div className={`ml-6 p-4 rounded-lg flex-1 ${
                          item.completed 
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`font-semibold ${
                                item.completed 
                                  ? 'text-green-800 dark:text-green-200' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {item.label || item.status.replace('_', ' ').toUpperCase()}
                              </p>
                              {item.date && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(item.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                  {item.time && ` at ${item.time}`}
                                </p>
                              )}
                            </div>
                            {item.completed && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Actions based on Order Status */}
              {orderStatus.status === 'delivered' && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Order Actions
                  </h3>
                                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     <button 
                       onClick={() => handleConfirmDelivery(orderStatus.orderNumber)}
                       className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
                     >
                       <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                       <span className="hidden sm:inline">Confirm Receipt</span>
                       <span className="sm:hidden">Confirm</span>
                     </button>
                     
                     <button 
                       onClick={() => handleRateOrder(orderStatus.orderNumber)}
                       className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition-colors text-sm sm:text-base"
                     >
                       <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                       <span className="hidden sm:inline">Rate & Review</span>
                       <span className="sm:hidden">Review</span>
                     </button>
                     
                     <button 
                       onClick={() => handleRequestReturn(orderStatus.orderNumber)}
                       className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base"
                     >
                       <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                       <span className="hidden sm:inline">Request Return</span>
                       <span className="sm:hidden">Return</span>
                     </button>
                   </div>
                </div>
              )}

              {/* Order Actions for Other Statuses */}
              {orderStatus.status !== 'delivered' && orderStatus.status !== 'cancelled' && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Order Actions
                  </h3>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {(orderStatus.status === 'pending' || orderStatus.status === 'confirmed') && (
                      <button 
                        onClick={() => handleCancelOrder(orderStatus.orderNumber)}
                        className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        Cancel Order
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleContactSupport()}
                      className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      Contact Support
                    </button>
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    If you have any questions about your order, please contact our support team:
                  </p>
                  <div className="flex justify-center items-center gap-4">
                    <a 
                      href="tel:01700000000" 
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Call: 01700000000
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Review Modal */}
          {showReviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Rate Your Order
                  </h3>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Order: {selectedOrderForReview}
                  </p>
                  
                  {/* Order Items Preview */}
                  {orderStatus?.items && orderStatus.items.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Order:
                      </p>
                      <div className="space-y-1">
                        {orderStatus.items.map((item: any, index: number) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Star Rating */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {rating} out of 5 stars
                    </p>
                  </div>

                  {/* Review Comment */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Review
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tell us about your experience with the food and service..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrackOrderPage; 