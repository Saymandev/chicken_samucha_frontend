import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Star,
  Truck,
  X,
  XCircle
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import RefundRequestModal from '../components/refund/RefundRequestModal';
import { useStore } from '../store/useStore';
import { ordersAPI, reviewsAPI } from '../utils/api';
import '../utils/debug'; // Import debug utilities for development

interface Order {
  id: string;
  orderNumber: string;
  items: Array<{
    product: {
      name: { en: string; bn: string };
      images: Array<{ url: string }>;
      price: number;
    };
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryCharge: number;
  finalAmount: number;
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentInfo: {
    method: string;
    status: string;
  };
  createdAt: string;
  estimatedDeliveryTime?: string;
  hasRefundRequest?: boolean;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: {
      street: string;
      area: string;
      city: string;
      district: string;
    };
  };
}

const OrdersPage: React.FC = () => {
  // const { t } = useTranslation(); // Unused variable
  const { language, user } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      
      // Check if user is logged in
      if (!user) {
        console.error('❌ User not logged in');
        toast.error('Please login to view your orders');
        setLoading(false);
        return;
      }

      const response = await ordersAPI.getMyOrders({ 
        status: filter !== 'all' ? filter : undefined,
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm || undefined
      });
      
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.totalPages || 1);
        
      } else {
        console.error('❌ API returned unsuccessful response:', response.data);
        toast.error('Failed to load orders');
      }
    } catch (error: any) {
      console.error('❌ Error fetching orders:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('❌ Authentication error - redirecting to login');
        toast.error('Session expired. Please login again.');
        // The API interceptor should handle this, but just in case
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        
      } else {
        toast.error(error.response?.data?.message || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, [user, filter, currentPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch orders when page or filter changes
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [currentPage, filter, fetchOrders, user]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (!user) return;

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://rest.ourb.live/api';
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
     
      socket.emit('join-user-room', { userId: user.id });
    });

    socket.on('order-status-updated', (data) => {
      
      // Refresh orders when status changes
      fetchOrders();
      toast.success(`Order ${data.orderNumber} status updated to ${data.newStatus}`);
    });

    socket.on('refund-request-created', (data) => {
      
      // Refresh orders when refund is created
      fetchOrders();
    });

    socket.on('refund-status-updated', (data) => {
      
      // Refresh orders when refund status changes
      fetchOrders();
    });

    return () => {
      socket.emit('leave-user-room', { userId: user.id });
      socket.disconnect();
    };
  }, [user, fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ready':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'courier_cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'return_requested':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <Package className="w-4 h-4" />;
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'ready':
        return <Package className="w-4 h-4" />;
      case 'out_for_delivery':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <Star className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      case 'courier_cancelled':
        return <X className="w-4 h-4" />;
      case 'return_requested':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const openReviewModal = (order: Order) => {
    setReviewOrder(order);
    setReviewModalOpen(true);
    setRating(5);
    setReviewComment('');
  };

  const openRefundModal = (order: Order) => {
    // Check if refund already exists
    if (order.hasRefundRequest) {
      toast.error('Refund request already exists for this order. Please check your refund history.', {
        duration: 5000,
        style: {
          background: '#fef2f2',
          color: '#dc2626',
          border: '1px solid #fecaca'
        }
      });
      return;
    }
    
    setRefundOrder(order);
    setRefundModalOpen(true);
  };

  const handleRefundSuccess = () => {
    fetchOrders(); // Refresh orders after successful refund request
    toast.success('Refund request submitted successfully! You can track the status in your refund history.');
  };

  const submitReview = async () => {
    if (!reviewComment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    if (!reviewOrder) {
      toast.error('No order selected for review');
      return;
    }

    setSubmittingReview(true);
    try {
      const formData = new FormData();
      
      // Try to get product ID if available (for product-specific reviews)
      const firstProduct = reviewOrder.items[0]?.product;
      const productId = (firstProduct as any)?._id || (firstProduct as any)?.id;
      
      // If we have a product ID, add it; otherwise create a general order review
      if (productId) {
        formData.append('product', productId);
      } else if (firstProduct && (firstProduct as any).name) {
        // Try to use product name as fallback
        const productName = (firstProduct as any).name.en || (firstProduct as any).name.bn || (firstProduct as any).name;
        formData.append('product', productName);
      }
      
      formData.append('rating', rating.toString());
      formData.append('comment.en', reviewComment);
      formData.append('reviewType', 'general');
      formData.append('customer.name', reviewOrder.customer.name);
      formData.append('customer.phone', reviewOrder.customer.phone);
      formData.append('customer.email', reviewOrder.customer.email || '');
      formData.append('orderNumber', reviewOrder.orderNumber);

      await reviewsAPI.createReview(formData);
      toast.success('Thank you for your review! It will be published after approval.');
      setReviewModalOpen(false);
      setReviewComment('');
      setRating(5);
      setReviewOrder(null);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Memoized filtered orders to prevent unnecessary re-renders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filter === 'all') return true;
      return order.orderStatus === filter;
    });
  }, [orders, filter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Orders
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your orders and view order history
            </p>
          </div>

          {/* Search and Filter - Always visible */}
          <div className="mb-8 space-y-4">
            {/* Search Input */}
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Search orders by order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setCurrentPage(1); // Reset to first page when filtering
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-orange-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area - Changes based on state */}
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <div className="w-32 h-32 mx-auto mb-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {debouncedSearchTerm ? 'No orders found' : 'No orders yet'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {debouncedSearchTerm 
                  ? `No orders found matching "${debouncedSearchTerm}". Try adjusting your search or filter.`
                  : "You haven't placed any orders yet. Start shopping to see your order history here!"
                }
              </p>
              {!debouncedSearchTerm && (
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Start Shopping
                </Link>
              )}
            </motion.div>
          ) : (
            <>
              {/* Orders List */}
              <div className="space-y-6">
                {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Order #{order.orderNumber}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                        {getStatusIcon(order.orderStatus)}
                        {order.orderStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                        ৳{order.finalAmount}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Items Ordered</h4>
                      <div className="space-y-3">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                              {item.product.images && item.product.images.length > 0 ? (
                                <img
                                  src={item.product.images[0].url}
                                  alt={language === 'bn' ? item.product.name.bn : item.product.name.en}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {language === 'bn' ? item.product.name.bn : item.product.name.en}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Qty: {item.quantity} × ৳{item.price} = ৳{item.quantity * item.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Delivery Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-gray-900 dark:text-white font-medium">{order.customer.name}</p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {order.customer.address.street}, {order.customer.address.area}, 
                              {order.customer.address.city}, {order.customer.address.district}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">{order.customer.phone}</p>
                        </div>
                        {order.estimatedDeliveryTime && (
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-400">
                              Est. delivery: {new Date(order.estimatedDeliveryTime).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between gap-8">
                          <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                          <span className="text-gray-900 dark:text-white">৳{order.totalAmount}</span>
                        </div>
                        <div className="flex justify-between gap-8">
                          <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
                          <span className="text-gray-900 dark:text-white">৳{order.deliveryCharge}</span>
                        </div>
                        <div className="flex justify-between gap-8 font-semibold">
                          <span className="text-gray-900 dark:text-white">Total:</span>
                          <span className="text-orange-500">৳{order.finalAmount}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Payment Method</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {order.paymentInfo.method.toUpperCase()}
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          order.paymentInfo.status === 'verified' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {order.paymentInfo.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-3">
                    <Link
                      to={`/track-order?orderNumber=${order.orderNumber}&phone=${order.customer.phone}`}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      Track Order
                    </Link>
                    {order.orderStatus === 'delivered' && (
                      <button 
                        onClick={() => openReviewModal(order)}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Rate & Review
                      </button>
                    )}
                    {(order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') && !order.hasRefundRequest && (
                      <button 
                        onClick={() => openRefundModal(order)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Request Refund
                      </button>
                    )}
                    {order.hasRefundRequest && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          Refund Requested
                        </span>
                        <Link 
                          to="/refunds"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Status
                        </Link>
                      </div>
                    )}
                    {order.orderStatus === 'pending' && (
                      <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredOrders.length === 0 && filter !== 'all' && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No {filter} orders found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have any orders with status "{filter.replace('_', ' ')}"
              </p>
            </div>
          )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === i + 1
                          ? 'bg-orange-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Refund Request Modal */}
        {refundModalOpen && refundOrder && (
          <RefundRequestModal
            isOpen={refundModalOpen}
            onClose={() => setRefundModalOpen(false)}
            order={refundOrder}
            onSuccess={handleRefundSuccess}
          />
        )}

        {/* Review Modal */}
        {reviewModalOpen && reviewOrder && (
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
                  onClick={() => setReviewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Order: {reviewOrder.orderNumber}
                </p>
                
                {/* Order Items Preview */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Order:
                  </p>
                  <div className="space-y-1">
                    {reviewOrder.items.map((item, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity}x {language === 'bn' ? item.product.name.bn : item.product.name.en}
                      </div>
                    ))}
                  </div>
                </div>
                
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
                  onClick={() => setReviewModalOpen(false)}
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
      </div>
    </div>
  );
};

export default OrdersPage; 